"""
Claude (Sonnet 5.5) variant of ingest_parascolaire.py.
Same output format and resume logic (skips pages that already have a valid JSON),
reuses the metadata / curriculum helpers from ingest_parascolaire.py, runs pages in parallel.
Raw HTTP to the Messages API (no extra dependency). Key: ANTHROPIC_API_KEY in .env.

Usage:
  python scripts/ingest_parascolaire_claude.py --all --workers 6
  python scripts/ingest_parascolaire_claude.py --book sagesse --limit 3
"""
import argparse
import base64
import json
import os
import sys
import threading
import time
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from typing import Any, Dict, List

sys.stdout.reconfigure(encoding='utf-8')
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import fitz  # PyMuPDF
from dotenv import load_dotenv

from scripts.curriculum_matcher import CurriculumIndex
from scripts.ingest_parascolaire import (
    ARCHIVE_DIR,
    BASE_DIR,
    guess_difficulty,
    guess_format,
    infer_metadata_from_path,
)

load_dotenv()
API_KEY = os.getenv('ANTHROPIC_API_KEY', '').strip().strip('"').strip("'")
if not API_KEY.startswith('sk-ant-'):
    raise RuntimeError('ANTHROPIC_API_KEY missing or invalid in .env')

MODEL = 'claude-sonnet-5-5'
API_URL = 'https://api.anthropic.com/v1/messages'
print_lock = threading.Lock()
usage_lock = threading.Lock()
usage_total = {'input': 0, 'output': 0, 'pages': 0, 'failed': 0}


def log(msg: str) -> None:
    with print_lock:
        print(msg, flush=True)


def build_prompt(meta: Dict[str, str], book_slug: str, page_num: int) -> str:
    return f"""Tu es un expert pédagogique tunisien du primaire ({meta['grade']} - {meta['subject']}).
Analyse cette page scannée du manuel parascolaire "{meta['title']}".
Extrais fidèlement la totalité des items éducatifs visibles sur cette page.
Recopie le texte arabe exactement, avec ses voyelles (tashkeel) quand elles sont présentes.

Pour chaque item:
- kind: 'exercise' | 'lesson' | 'answer'
- number: numéro de l'exercice/activité ou ''
- instruction: consigne exacte
- body: contenu complet, textes d'appui, phrases ou énoncés
- figureDesc: brève description d'un schéma, tableau ou dessin si présent, sinon ''
- answer: réponse ou corrigé explicite si présent sur la page, sinon null
- confidence: score de fidélité OCR (0.0 à 1.0)

Réponds uniquement avec le JSON, sans texte autour, au format strict:
{{
  "book": "{book_slug}",
  "page": {page_num},
  "grade": "{meta['grade']}",
  "subject": "{meta['subject']}",
  "topicGuess": "titre ou thème officiel tunisien précis de la page",
  "items": [
    {{
      "kind": "exercise",
      "number": "1",
      "instruction": "...",
      "body": "...",
      "figureDesc": "",
      "answer": null,
      "confidence": 0.95
    }}
  ]
}}"""


def parse_json(text: str) -> Dict[str, Any]:
    text = text.strip()
    if text.startswith('```'):
        lines = text.split('\n')[1:]
        if lines and lines[-1].startswith('```'):
            lines = lines[:-1]
        text = '\n'.join(lines).strip()
    start, end = text.find('{'), text.rfind('}')
    return json.loads(text[start:end + 1])


def call_claude(img_bytes: bytes, prompt: str, max_retries: int = 6) -> Dict[str, Any]:
    body = json.dumps({
        'model': MODEL,
        'max_tokens': 16000,
        'output_config': {'effort': 'low'},
        'messages': [{'role': 'user', 'content': [
            {'type': 'image', 'source': {'type': 'base64', 'media_type': 'image/jpeg',
                                         'data': base64.b64encode(img_bytes).decode()}},
            {'type': 'text', 'text': prompt},
        ]}],
    }).encode()
    last = None
    for attempt in range(max_retries):
        req = urllib.request.Request(API_URL, data=body, method='POST', headers={
            'x-api-key': API_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json'})
        try:
            with urllib.request.urlopen(req, timeout=300) as r:
                data = json.loads(r.read())
            if data.get('stop_reason') == 'refusal':
                raise RuntimeError(f"refusal: {data.get('stop_details')}")
            if data.get('stop_reason') == 'max_tokens':
                raise RuntimeError('output truncated (max_tokens)')
            text = ''.join(b.get('text', '') for b in data.get('content', []) if b.get('type') == 'text')
            with usage_lock:
                usage_total['input'] += data['usage'].get('input_tokens', 0)
                usage_total['output'] += data['usage'].get('output_tokens', 0)
            return parse_json(text)
        except urllib.error.HTTPError as e:
            last = f'HTTP {e.code}: {e.read()[:200]!r}'
            if e.code in (429, 500, 502, 503, 529):
                time.sleep(int(e.headers.get('retry-after') or 0) or 2 ** attempt)
                continue
            raise RuntimeError(last)
        except (json.JSONDecodeError, ValueError) as e:
            last = f'bad JSON: {e}'
            time.sleep(1)
        except (urllib.error.URLError, TimeoutError) as e:
            last = f'network: {e}'
            time.sleep(2 ** attempt)
    raise RuntimeError(f'failed after retries: {last}')


def page_done(page_file: Path) -> bool:
    if not page_file.exists() or page_file.stat().st_size <= 50:
        return False
    try:
        return json.loads(page_file.read_text(encoding='utf-8')).get('items') is not None
    except Exception:
        return False


def ingest_page(job: Dict[str, Any], curriculum: CurriculumIndex) -> None:
    meta, slug, page_num, total = job['meta'], job['slug'], job['page'], job['total']
    page_file: Path = job['file']
    if page_done(page_file):  # another run may have written it meanwhile
        return
    try:
        page_data = call_claude(job['img'], build_prompt(meta, slug, page_num))
    except Exception as e:
        with usage_lock:
            usage_total['failed'] += 1
        log(f'  [ERROR] {slug} p{page_num:03d}: {e}')
        return

    page_data['book'] = slug
    page_data['page'] = page_num
    page_data['ocrModel'] = MODEL
    topic_guess = page_data.get('topicGuess', '')
    matched_id, conf_score, chapter = curriculum.match_topic(topic_guess, meta['grade'], meta['subject'])
    page_data['topicId'] = matched_id
    page_data['topicTitle'] = (chapter.get('titleFr') or chapter.get('titleAr')) if chapter else ''
    page_data['topicConfidence'] = conf_score
    for idx, item in enumerate(page_data.get('items', [])):
        item['id'] = f'{slug}_p{page_num:03d}_i{idx + 1}'
        item['topicId'] = matched_id
        item['formatGuess'] = guess_format(item.get('body', '') or '', item.get('instruction', '') or '')
        item['difficultyGuess'] = guess_difficulty(page_num, total, item.get('kind', 'exercise'))

    page_file.write_text(json.dumps(page_data, ensure_ascii=False, indent=2), encoding='utf-8')
    with usage_lock:
        usage_total['pages'] += 1
        cost = usage_total['input'] * 2 / 1e6 + usage_total['output'] * 10 / 1e6
        done = usage_total['pages']
    log(f'  -> {slug} p{page_num:03d}: {len(page_data.get("items", []))} items | pages {done} | ~${cost:.2f}')


def jobs_for_book(pdf_path: Path, limit: int | None):
    meta = infer_metadata_from_path(pdf_path)
    slug = meta['slug']
    pages_dir = ARCHIVE_DIR / slug / 'pages'
    pages_dir.mkdir(parents=True, exist_ok=True)
    doc = fitz.open(pdf_path)
    total = len(doc)
    book_meta = {
        'book': slug, 'title': meta['title'], 'grade': meta['grade'], 'subject': meta['subject'],
        'totalPages': total, 'sourceFile': meta['relPath'], 'updatedAt': int(time.time()),
    }
    (ARCHIVE_DIR / slug / 'book.json').write_text(json.dumps(book_meta, ensure_ascii=False, indent=2), encoding='utf-8')
    indices = list(range(total))[:limit] if limit else range(total)
    for i in indices:
        page_file = pages_dir / f'{i + 1:03d}.json'
        if page_done(page_file):
            continue
        img = doc[i].get_pixmap(dpi=200).tobytes('jpeg')
        yield {'meta': meta, 'slug': slug, 'page': i + 1, 'total': total, 'file': page_file, 'img': img}
    doc.close()


def main():
    parser = argparse.ArgumentParser(description='Ingest parascolaire PDFs with Claude Sonnet 5.5.')
    parser.add_argument('--book', type=str, help='Book slug or substring')
    parser.add_argument('--all', action='store_true', help='All books in parascolaire/')
    parser.add_argument('--limit', type=int, help='Max pages per book')
    parser.add_argument('--workers', type=int, default=6, help='Parallel requests')
    args = parser.parse_args()

    pdfs: List[Path] = sorted(
        (Path(root) / f for root, _, files in os.walk(BASE_DIR) if '_archive' not in root
         for f in files if f.endswith('.pdf')),
        key=str,
    )
    if args.book:
        pdfs = [p for p in pdfs if args.book.lower() in p.stem.lower()]
    elif not args.all:
        parser.error('pass --all or --book')

    curriculum = CurriculumIndex()
    log(f'{len(pdfs)} books, model {MODEL}, {args.workers} workers')
    started = time.time()
    with ThreadPoolExecutor(max_workers=args.workers) as pool:
        pending = set()
        for pdf in pdfs:
            for job in jobs_for_book(pdf, args.limit):
                pending.add(pool.submit(ingest_page, job, curriculum))
                if len(pending) >= args.workers * 2:  # keep rendered images bounded
                    done = next(as_completed(pending))
                    pending.discard(done)
        for f in as_completed(pending):
            pass

    cost = usage_total['input'] * 2 / 1e6 + usage_total['output'] * 10 / 1e6
    log(f"DONE pages={usage_total['pages']} failed={usage_total['failed']} "
        f"tokens in={usage_total['input']} out={usage_total['output']} ~${cost:.2f} in {time.time() - started:.0f}s")


if __name__ == '__main__':
    main()
