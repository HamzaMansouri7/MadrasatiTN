"""
Builds parascolaire/_archive/index.jsonl sorted by topicId.
Consolidates all extracted items across all archived books into a single index.

Usage:
  python scripts/build_archive_index.py
"""
import sys
import json
from pathlib import Path
from typing import List, Dict, Any

sys.stdout.reconfigure(encoding='utf-8')

ARCHIVE_DIR = Path('parascolaire/_archive')
INDEX_FILE = ARCHIVE_DIR / 'index.jsonl'

def build_index() -> int:
    if not ARCHIVE_DIR.exists():
        print("Archive directory does not exist. Run ingestion first.")
        return 0

    all_records: List[Dict[str, Any]] = []
    book_dirs = [d for d in ARCHIVE_DIR.iterdir() if d.is_dir() and not d.name.startswith('.')]

    print(f"Scanning {len(book_dirs)} book archives...")
    for bdir in book_dirs:
        pages_dir = bdir / 'pages'
        if not pages_dir.exists():
            continue

        book_meta_file = bdir / 'book.json'
        book_meta = {}
        if book_meta_file.exists():
            try:
                book_meta = json.loads(book_meta_file.read_text(encoding='utf-8'))
            except Exception:
                pass

        for page_file in sorted(pages_dir.glob('*.json')):
            try:
                data = json.loads(page_file.read_text(encoding='utf-8'))
                page_num = data.get('page', 1)
                book_slug = data.get('book', bdir.name)
                grade = data.get('grade', book_meta.get('grade', ''))
                subject = data.get('subject', book_meta.get('subject', ''))
                page_topic_id = data.get('topicId', 'unlinked')
                page_topic_guess = data.get('topicGuess', '')

                for idx, item in enumerate(data.get('items', [])):
                    topic_id = item.get('topicId') or page_topic_id
                    rec_id = item.get('id') or f"{book_slug}_p{page_num:03d}_i{idx+1}"

                    record = {
                        'id': rec_id,
                        'topicId': topic_id,
                        'topicGuess': page_topic_guess,
                        'book': book_slug,
                        'page': page_num,
                        'grade': grade,
                        'subject': subject,
                        'kind': item.get('kind', 'exercise'),
                        'number': str(item.get('number', '')),
                        'instruction': item.get('instruction', ''),
                        'body': item.get('body', ''),
                        'figureDesc': item.get('figureDesc', ''),
                        'answer': item.get('answer'),
                        'confidence': float(item.get('confidence', 1.0)),
                        'formatGuess': item.get('formatGuess', 'free'),
                        'difficultyGuess': item.get('difficultyGuess', 'medium'),
                        'ref': f"parascolaire:{book_slug}#p{page_num}n{item.get('number', idx+1)}",
                    }
                    all_records.append(record)
            except Exception as e:
                print(f"Error reading {page_file}: {e}")

    # Sort strictly by topicId, then book, page, item id
    all_records.sort(key=lambda r: (r['topicId'] or 'zz_unlinked', r['book'], r['page'], r['id']))

    # Write index.jsonl
    INDEX_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(INDEX_FILE, 'w', encoding='utf-8') as f:
        for rec in all_records:
            f.write(json.dumps(rec, ensure_ascii=False) + '\n')

    print(f"✅ Generated {INDEX_FILE} with {len(all_records)} indexed records across {len(book_dirs)} books.")
    return len(all_records)


if __name__ == '__main__':
    build_index()
