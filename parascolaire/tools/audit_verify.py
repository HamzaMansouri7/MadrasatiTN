"""Second pass: re-check every 'fix' verdict from audit_exercises.py with an independent verifier prompt.

For each flagged item the verifier sees the page image again and the proposed issues/fix, and must answer
confirm / reject per issue. Output: parascolaire/outputs/audit/verified/<book>.json (livres/ is never modified).
Usage: python parascolaire/tools/audit_verify.py --book 5eme_annee/<book> --pdf <pdf> [--budget-usd 2]
"""
import argparse, base64, json, sys
from pathlib import Path
import fitz
from anthropic import Anthropic
sys.path.insert(0, str(Path(__file__).parent))
from audit_exercises import MODEL, PRICE_IN, PRICE_OUT, ROOT, load_key

SYSTEM = ("You are a strict second reviewer. A first reviewer flagged differences between extracted exercise text and "
          "the printed page. For each flagged item, look at the page again and judge EACH issue independently: "
          "'confirm' only if the page really shows it, otherwise 'reject'. Then give the final corrected text only "
          "from confirmed issues. Answer with JSON only.")

ap = argparse.ArgumentParser()
ap.add_argument('--book', required=True); ap.add_argument('--pdf', required=True)
ap.add_argument('--budget-usd', type=float, default=2.0)
a = ap.parse_args()
src = ROOT / 'parascolaire' / 'outputs' / 'audit' / (a.book.replace('/', '__') + '.json')
out = ROOT / 'parascolaire' / 'outputs' / 'audit' / 'verified' / src.name
out.parent.mkdir(parents=True, exist_ok=True)
first = json.loads(src.read_text(encoding='utf-8'))
done = json.loads(out.read_text(encoding='utf-8')) if out.exists() else {}
client = Anthropic(api_key=load_key()); pdf = fitz.open(str(ROOT / a.pdf)); spent = 0.0
for p, v in first.items():
    flagged = [i for i in v['result'].get('items', []) if i['verdict'] == 'fix']
    if not flagged or p in done: continue
    img = base64.standard_b64encode(pdf[int(p) - 1].get_pixmap(dpi=130).tobytes('png')).decode()
    user = ('Flagged items (JSON):\n' + json.dumps(flagged, ensure_ascii=False) +
            '\n\nReturn {"items":[{"id":"...","issues":[{"issue":"...","judgement":"confirm"|"reject"}],'
            '"final":"confirmed"|"rejected"|"partial","fixed":{"instruction":"...","body":"..."}}]}. '
            'Include "fixed" only if final is confirmed or partial.')
    r = client.messages.create(model=MODEL, max_tokens=4000, system=SYSTEM, messages=[{'role': 'user', 'content': [
        {'type': 'image', 'source': {'type': 'base64', 'media_type': 'image/png', 'data': img}},
        {'type': 'text', 'text': user}]}])
    text = ''.join(b.text for b in r.content if b.type == 'text')
    try: data = json.loads(text[text.index('{'): text.rindex('}') + 1])
    except ValueError: data = {'raw': text}
    spent += r.usage.input_tokens / 1e6 * PRICE_IN + r.usage.output_tokens / 1e6 * PRICE_OUT
    done[p] = data
    out.write_text(json.dumps(done, ensure_ascii=False, indent=2), encoding='utf-8')
    if spent >= a.budget_usd: print('Budget reached'); break
print(f'{src.name}: verified {len(done)} pages, ~${spent:.2f}')
