"""Audit pending exercises of one book against the source PDF page, with Claude vision.

For each page that has exercises with tier == 'pending_audit', render the PDF page, send the image plus
the extracted items, and ask for a verdict per item. Results go to parascolaire/outputs/audit/<book>.json.
`livres/` is never modified: a human reviews the report, then fixes are applied separately.

Usage (from repo root):
  python parascolaire/tools/audit_exercises.py --book 5eme_annee/mathematiques_exercices_evaluations \
      --pdf parascolaire_frozen/_sources/5eme/Al_Ahram_5eme_Complet.pdf --dry-run
  ... --limit-pages 1            # cost probe
  ... --budget-usd 5             # hard stop

The API key is read from ANTHROPIC_API_KEY (env or .env). It is never printed.
"""
import argparse
import base64
import json
import os
import sys
from pathlib import Path

import fitz
from anthropic import Anthropic

ROOT = Path(__file__).resolve().parents[2]
MODEL = 'claude-sonnet-5-5'
# Rough USD per million tokens used ONLY for the budget guard (unverified: check the pricing page).
PRICE_IN, PRICE_OUT = 3.0, 15.0

SYSTEM = (
    "You audit OCR-extracted exercises of a Tunisian primary-school book against the page image. "
    "Compare each extracted item to what is printed on the page. Report only real differences: wrong or missing "
    "digits, words, numbers, units, operators, or a figure description that contradicts the picture. "
    "Do not rewrite style. Answer with JSON only."
)


def load_key() -> str:
    key = os.environ.get('ANTHROPIC_API_KEY')
    if key:
        return key
    env = ROOT / '.env'
    if env.exists():
        for line in env.read_text(encoding='utf-8').splitlines():
            if line.startswith('ANTHROPIC_API_KEY='):
                return line.split('=', 1)[1].strip().strip('"').strip("'")
    sys.exit('ANTHROPIC_API_KEY not found')


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument('--book', required=True)
    ap.add_argument('--pdf', required=True)
    ap.add_argument('--dry-run', action='store_true')
    ap.add_argument('--limit-pages', type=int, default=0)
    ap.add_argument('--budget-usd', type=float, default=5.0)
    args = ap.parse_args()

    book_dir = ROOT / 'parascolaire' / 'livres' / args.book
    exos = json.loads((book_dir / 'exercices.json').read_text(encoding='utf-8'))['exercises']
    pending: dict[int, list[str]] = {}
    for e in exos:
        if e['tier'] == 'pending_audit':
            pending.setdefault(e['page'], []).append(e['id'])
    pages = sorted(pending)
    if args.limit_pages:
        pages = pages[: args.limit_pages]
    print(f'{sum(len(v) for v in pending.values())} pending exercises on {len(pending)} pages; auditing {len(pages)} pages')
    if args.dry_run:
        print('pages:', pages)
        return

    out_path = ROOT / 'parascolaire' / 'outputs' / 'audit' / (args.book.replace('/', '__') + '.json')
    out_path.parent.mkdir(parents=True, exist_ok=True)
    report = json.loads(out_path.read_text(encoding='utf-8')) if out_path.exists() else {}

    client = Anthropic(api_key=load_key())
    pdf = fitz.open(str(ROOT / args.pdf))
    spent = 0.0
    for p in pages:
        if str(p) in report:
            continue
        page_json = json.loads((book_dir / 'pages' / f'{p:03d}.json').read_text(encoding='utf-8'))
        ids = set(pending[p])
        items = [i for i in page_json['items'] if i.get('id') in ids]
        pix = pdf[p - 1].get_pixmap(dpi=130)
        img = base64.standard_b64encode(pix.tobytes('png')).decode()
        user = (
            'Extracted items of this page (JSON):\n'
            + json.dumps([{k: i.get(k) for k in ('id', 'number', 'instruction', 'body', 'figureDesc')} for i in items], ensure_ascii=False)
            + '\n\nReturn JSON: {"items":[{"id":"...","verdict":"ok"|"fix"|"unreadable","issues":["short description"],'
            '"fixed":{"instruction":"...","body":"..."}}]}. Include "fixed" only when verdict is "fix".'
        )
        resp = client.messages.create(
            model=MODEL,
            max_tokens=4000,
            system=SYSTEM,
            messages=[{'role': 'user', 'content': [
                {'type': 'image', 'source': {'type': 'base64', 'media_type': 'image/png', 'data': img}},
                {'type': 'text', 'text': user},
            ]}],
        )
        cost = resp.usage.input_tokens / 1e6 * PRICE_IN + resp.usage.output_tokens / 1e6 * PRICE_OUT
        spent += cost
        text = ''.join(b.text for b in resp.content if b.type == 'text')
        try:
            data = json.loads(text[text.index('{'): text.rindex('}') + 1])
        except ValueError:
            data = {'raw': text}
        report[str(p)] = {'result': data, 'tokensIn': resp.usage.input_tokens, 'tokensOut': resp.usage.output_tokens}
        out_path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
        print(f'page {p}: in {resp.usage.input_tokens} out {resp.usage.output_tokens} ~${cost:.3f} (total ~${spent:.2f})')
        if spent >= args.budget_usd:
            print('Budget reached, stopping.')
            break


if __name__ == '__main__':
    main()
