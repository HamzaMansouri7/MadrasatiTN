"""
Ingestion Pipeline for Tunisian Parascolaire Workbooks.
Renders PDF pages to 200 DPI images via PyMuPDF, executes single-call OCR and
semantic structuring via Gemini 2.5 / 3.8 Flash, links topics to the official
147-row curriculum, and writes per-page JSONs and book metadata.

Usage:
  python scripts/ingest_parascolaire.py --book sagesse_6eme_complet --limit 5
  python scripts/ingest_parascolaire.py --all --throttle 1.5
"""
import os
import sys
import json
import time
import argparse
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple

sys.stdout.reconfigure(encoding='utf-8')
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import fitz  # PyMuPDF
from google import genai
from google.genai import types
from dotenv import load_dotenv

from scripts.curriculum_matcher import CurriculumIndex, GRADE_CANONICAL, SUBJECT_CANONICAL

load_dotenv()

# Fixed Output Directory
BASE_DIR = Path('parascolaire')
ARCHIVE_DIR = BASE_DIR / '_archive'

# Multi-Key Rotation
KEYS = [
    os.getenv('GEMINI_API_KEY', '').strip().strip('"').strip("'"),
    os.getenv('GEMINI_API_KEY_2', '').strip().strip('"').strip("'"),
    os.getenv('GEMINI_API_KEY_3', '').strip().strip('"').strip("'"),
]
KEYS = [k for k in KEYS if len(k) > 10]
if not KEYS:
    raise RuntimeError("No valid GEMINI_API_KEY found in .env")

class MultiKeyGeminiClient:
    def __init__(self, api_keys: List[str]):
        self.api_keys = api_keys
        self.current_idx = 0
        self.clients = [genai.Client(api_key=k) for k in api_keys]
        self.models_to_try = ['gemini-3.7-flash', 'gemini-3.8-flash']

    def generate(self, img_bytes: bytes, prompt: str, max_retries: int = 5) -> Dict[str, Any]:
        last_error = None
        for attempt in range(max_retries):
            client = self.clients[self.current_idx]
            for model_name in self.models_to_try:
                try:
                    resp = client.models.generate_content(
                        model=model_name,
                        contents=[
                            types.Part.from_bytes(data=img_bytes, mime_type='image/jpeg'),
                            prompt
                        ],
                        config=types.GenerateContentConfig(
                            response_mime_type='application/json',
                            temperature=0.2,
                        )
                    )
                    if resp.text:
                        text = resp.text.strip()
                        if text.startswith('```'):
                            lines = text.split('\n')
                            if lines[0].startswith('```'):
                                lines = lines[1:]
                            if lines and lines[-1].startswith('```'):
                                lines = lines[:-1]
                            text = '\n'.join(lines).strip()
                        return json.loads(text)
                except Exception as ex:
                    err_msg = str(ex).lower()
                    last_error = ex
                    if '404' in err_msg or 'not_found' in err_msg:
                        continue
                    if '429' in err_msg or 'quota' in err_msg or 'rate' in err_msg:
                        print(f"  [RateLimit] Key {self.current_idx + 1}/{len(self.api_keys)} hit limit. Rotating...")
                        self.current_idx = (self.current_idx + 1) % len(self.api_keys)
                        time.sleep(1.0 + attempt * 1.5)
                        break
                    print(f"  [Error] Model {model_name} failed: {ex}. Retrying...")
                    time.sleep(1.5)
            self.current_idx = (self.current_idx + 1) % len(self.api_keys)
            time.sleep(1.0)

        raise RuntimeError(f"All Gemini generation attempts failed: {last_error}")


def infer_metadata_from_path(pdf_path: Path) -> Dict[str, str]:
    rel = str(pdf_path.relative_to(BASE_DIR)).replace('\\', '/').lower()

    grade = '6ème Année'
    if '1ere' in rel: grade = '1ère Année'
    elif '2eme' in rel: grade = '2ème Année'
    elif '3eme' in rel: grade = '3ème Année'
    elif '4eme' in rel: grade = '4ème Année'
    elif '5eme' in rel: grade = '5ème Année'
    elif '6eme' in rel: grade = '6ème Année'

    subject = 'Français'
    if 'math' in rel:
        subject = 'Mathématiques'
    elif 'eveil' in rel or 'scientifique' in rel:
        subject = 'Éveil Scientifique'
    elif 'francais' in rel or 'lecture' in rel or 'sagesse' in rel:
        subject = 'Français'
    elif 'arabe' in rel or 'production' in rel or 'ennajah' in rel or 'ahram' in rel:
        subject = 'اللغة العربية'

    slug = pdf_path.stem.lower()

    return {
        'slug': slug,
        'title': pdf_path.stem.replace('_', ' '),
        'grade': grade,
        'subject': subject,
        'relPath': str(pdf_path.relative_to(BASE_DIR)).replace('\\', '/')
    }


def guess_format(body: str, instruction: str) -> str:
    combined = f"{instruction} {body}".lower()
    if any(k in combined for k in ['qcm', 'choisis la bonne', 'ضع علامة', 'اختر الإجابة']):
        return 'qcm'
    if any(k in combined for k in ['vrai ou faux', 'صواب أو خطأ', 'صحيح أم خطأ', 'vrai', 'faux']):
        return 'true_false'
    if any(k in combined for k in ['relie', 'صل', 'اربط', 'matching']):
        return 'matching'
    if any(k in combined for k in ['complète', 'أكمل', 'امْلأ الفراغ', 'remplis']):
        return 'fill_blank'
    if any(k in combined for k in ['calcule', 'احسب', 'أنجز العملية', 'operation']):
        return 'calculation'
    if any(k in combined for k in ['rédige', 'أنتج نصا', 'فقرة', 'production écrite', 'exprime']):
        return 'text_production'
    if any(k in combined for k in ['مسألة', 'problème', 'وضعية']):
        return 'problem_solving'
    return 'free'


def guess_difficulty(page_num: int, total_pages: int, kind: str) -> str:
    if kind == 'lesson':
        return 'easy'
    ratio = page_num / max(total_pages, 1)
    if ratio < 0.3:
        return 'easy'
    elif ratio < 0.7:
        return 'medium'
    else:
        return 'hard'


def process_book(
    pdf_path: Path,
    client: MultiKeyGeminiClient,
    curriculum: CurriculumIndex,
    limit_pages: Optional[int] = None,
    page_range: Optional[Tuple[int, int]] = None,
    throttle_sec: float = 1.0,
):
    meta = infer_metadata_from_path(pdf_path)
    book_slug = meta['slug']
    book_dir = ARCHIVE_DIR / book_slug
    pages_dir = book_dir / 'pages'
    pages_dir.mkdir(parents=True, exist_ok=True)

    doc = fitz.open(pdf_path)
    total_pages = len(doc)

    book_meta = {
        'book': book_slug,
        'title': meta['title'],
        'grade': meta['grade'],
        'subject': meta['subject'],
        'totalPages': total_pages,
        'sourceFile': meta['relPath'],
        'updatedAt': int(time.time()),
    }
    (book_dir / 'book.json').write_text(json.dumps(book_meta, ensure_ascii=False, indent=2), encoding='utf-8')

    print(f"\n=======================================================")
    print(f"Processing: {book_slug} ({total_pages} pages, {meta['grade']}, {meta['subject']})")
    print(f"=======================================================")

    pages_to_process = list(range(total_pages))
    if page_range:
        start, end = page_range
        pages_to_process = [p for p in pages_to_process if start <= (p + 1) <= end]
    if limit_pages:
        pages_to_process = pages_to_process[:limit_pages]

    processed_count = 0
    skipped_count = 0

    for page_idx in pages_to_process:
        page_num = page_idx + 1
        page_file = pages_dir / f"{page_num:03d}.json"

        # Resumption: skip if JSON already exists and is valid
        if page_file.exists() and page_file.stat().st_size > 50:
            try:
                existing = json.loads(page_file.read_text(encoding='utf-8'))
                if existing.get('items') is not None:
                    skipped_count += 1
                    continue
            except Exception:
                pass

        print(f"[{book_slug}] Rendering & Ingesting Page {page_num:03d}/{total_pages}...")

        # PyMuPDF 200 DPI render
        fitz_page = doc[page_idx]
        pix = fitz_page.get_pixmap(dpi=200)
        img_bytes = pix.tobytes('jpeg')

        prompt = f"""Tu es un expert pédagogique tunisien du primaire ({meta['grade']} - {meta['subject']}).
Analyse cette page scannée du manuel parascolaire "{meta['title']}".
Extrais fidèlement la totalité des items éducatifs visibles sur cette page.

Pour chaque item:
- kind: 'exercise' | 'lesson' | 'answer'
- number: numéro de l'exercice/activité ou ''
- instruction: consigne exacte
- body: contenu complet, textes d'appui, phrases ou énoncés
- figureDesc: brève description d'un schéma, tableau ou dessin si présent, sinon ''
- answer: réponse ou corrigé explicite si présent sur la page, sinon null
- confidence: score de fidélité OCR (0.0 à 1.0)

Format JSON attendu strictement:
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

        try:
            page_data = client.generate(img_bytes, prompt)
        except Exception as e:
            print(f"  [ERROR] Page {page_num:03d} failed after retries: {e}")
            continue

        page_data['book'] = book_slug
        page_data['page'] = page_num

        # Link to curriculum
        topic_guess = page_data.get('topicGuess', '')
        matched_id, conf_score, chapter = curriculum.match_topic(topic_guess, meta['grade'], meta['subject'])
        page_data['topicId'] = matched_id
        page_data['topicTitle'] = chapter.get('titleFr') or chapter.get('titleAr') if chapter else ''
        page_data['topicConfidence'] = conf_score

        # Enrich items
        for idx, item in enumerate(page_data.get('items', [])):
            item['id'] = f"{book_slug}_p{page_num:03d}_i{idx+1}"
            item['topicId'] = matched_id
            item['formatGuess'] = guess_format(item.get('body', ''), item.get('instruction', ''))
            item['difficultyGuess'] = guess_difficulty(page_num, total_pages, item.get('kind', 'exercise'))

        # Save page JSON
        page_file.write_text(json.dumps(page_data, ensure_ascii=False, indent=2), encoding='utf-8')
        processed_count += 1
        print(f"  -> Saved {page_file.name} ({len(page_data.get('items', []))} items, matched: {matched_id})")

        time.sleep(throttle_sec)

    doc.close()
    print(f"Done {book_slug}: processed {processed_count}, skipped {skipped_count}.")


def main():
    parser = argparse.ArgumentParser(description="Ingest Tunisian Parascolaire PDFs to structured JSON.")
    parser.add_argument('--book', type=str, help="Specific book slug or substring to ingest")
    parser.add_argument('--all', action='store_true', help="Ingest all discovered books in parascolaire/")
    parser.add_argument('--limit', type=int, help="Limit number of pages per book")
    parser.add_argument('--pages', type=str, help="Page range like 1-5")
    parser.add_argument('--throttle', type=float, default=1.0, help="Sleep seconds between calls")
    args = parser.parse_args()

    page_range = None
    if args.pages:
        parts = args.pages.split('-')
        page_range = (int(parts[0]), int(parts[1]))

    client = MultiKeyGeminiClient(KEYS)
    curriculum = CurriculumIndex()

    # Discover books
    pdf_files: List[Path] = []
    for root, _, files in os.walk(BASE_DIR):
        if '_archive' in root:
            continue
        for f in files:
            if f.endswith('.pdf'):
                pdf_files.append(Path(root) / f)

    pdf_files.sort(key=lambda p: str(p))

    if args.book:
        target = args.book.lower()
        pdf_files = [p for p in pdf_files if target in p.stem.lower()]

    if not pdf_files:
        print("No matching PDFs found.")
        sys.exit(0)

    print(f"Discovered {len(pdf_files)} parascolaire books. Gemini keys available: {len(KEYS)}.")

    for pdf in pdf_files:
        process_book(
            pdf,
            client=client,
            curriculum=curriculum,
            limit_pages=args.limit,
            page_range=page_range,
            throttle_sec=args.throttle,
        )


if __name__ == '__main__':
    main()
