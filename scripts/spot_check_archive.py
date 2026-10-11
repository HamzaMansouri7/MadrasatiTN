"""
Spot-Check & Audit Tool for Parascolaire Archive.
Inspects ~5 pages per book, reviews low-confidence OCR extractions (< 0.85),
and validates curriculum linkage.

Usage:
  python scripts/spot_check_archive.py
  python scripts/spot_check_archive.py --book sagesse_6eme_complet --sample 5
"""
import sys
import json
import argparse
from pathlib import Path
from typing import List, Dict, Any

sys.stdout.reconfigure(encoding='utf-8')

ARCHIVE_DIR = Path('parascolaire/_archive')

def spot_check(sample_size: int = 5, target_book: str = None, min_conf: float = 0.85):
    if not ARCHIVE_DIR.exists():
        print("Archive directory does not exist yet. Run ingestion first.")
        return

    book_dirs = [d for d in ARCHIVE_DIR.iterdir() if d.is_dir() and not d.name.startswith('.')]
    if target_book:
        book_dirs = [d for d in book_dirs if target_book.lower() in d.name.lower()]

    if not book_dirs:
        print("No archived books found.")
        return

    print("======================================================================")
    print("           PARASCOLAIRE ARCHIVE AUDIT & SPOT-CHECK REPORT             ")
    print("======================================================================\n")

    total_pages = 0
    total_items = 0
    total_exercises = 0
    total_lessons = 0
    total_answers = 0
    conf_scores: List[float] = []
    low_conf_items: List[Dict[str, Any]] = []

    for bdir in book_dirs:
        book_meta_file = bdir / 'book.json'
        book_meta = {}
        if book_meta_file.exists():
            try:
                book_meta = json.loads(book_meta_file.read_text(encoding='utf-8'))
            except Exception:
                pass

        pages_dir = bdir / 'pages'
        page_files = sorted(pages_dir.glob('*.json')) if pages_dir.exists() else []
        total_pages += len(page_files)

        print(f"📘 Book: {bdir.name}")
        print(f"   Title: {book_meta.get('title', 'N/A')} | Grade: {book_meta.get('grade', 'N/A')} | Subject: {book_meta.get('subject', 'N/A')}")
        print(f"   Ingested Pages: {len(page_files)} / {book_meta.get('totalPages', '?')}")

        if not page_files:
            print("   (No pages ingested yet)\n")
            continue

        # Sample up to sample_size pages evenly
        step = max(len(page_files) // sample_size, 1)
        sampled = page_files[::step][:sample_size]

        print(f"   --- Spot Check Samples ({len(sampled)} pages) ---")
        for pf in sampled:
            try:
                data = json.loads(pf.read_text(encoding='utf-8'))
                items = data.get('items', [])
                total_items += len(items)
                topic_id = data.get('topicId', 'unlinked')
                topic_guess = data.get('topicGuess', 'unknown')
                print(f"   * Page {data.get('page')}: Topic = '{topic_guess}' (-> {topic_id}) | Items = {len(items)}")

                for it in items:
                    kind = it.get('kind', 'exercise')
                    conf = float(it.get('confidence', 1.0))
                    conf_scores.append(conf)

                    if kind == 'exercise': total_exercises += 1
                    elif kind == 'lesson': total_lessons += 1
                    elif kind == 'answer': total_answers += 1

                    if conf < min_conf:
                        low_conf_items.append({
                            'book': bdir.name,
                            'page': data.get('page'),
                            'id': it.get('id'),
                            'conf': conf,
                            'instruction': it.get('instruction'),
                            'body': it.get('body')[:80] if it.get('body') else '',
                        })

                    instr_snippet = (it.get('instruction') or it.get('body') or '')[:70].replace('\n', ' ')
                    has_ans = "✓ Ans" if it.get('answer') else "- NoAns"
                    print(f"       [{kind[:3].upper()}] #{it.get('number', '-')} ({conf*100:.0f}%, {has_ans}) : {instr_snippet}")
            except Exception as e:
                print(f"   * Error reading {pf.name}: {e}")

        print("")

    avg_conf = (sum(conf_scores) / len(conf_scores)) if conf_scores else 0.0

    print("======================================================================")
    print("                       AUDIT SUMMARY STATS                            ")
    print("======================================================================")
    print(f"Books Inspected:       {len(book_dirs)}")
    print(f"Total Pages Processed: {total_pages}")
    print(f"Total Items Sampled:   {total_items} (Ex: {total_exercises}, Les: {total_lessons}, Ans: {total_answers})")
    print(f"Average Confidence:    {avg_conf * 100:.1f}%")
    print(f"Low Confidence (<{min_conf}): {len(low_conf_items)} items")

    if low_conf_items:
        print("\n⚠️  LOW CONFIDENCE ITEMS REQUIRING REVIEW:")
        for l in low_conf_items[:10]:
            print(f"   - [{l['book']}] Page {l['page']} item {l['id']} (conf: {l['conf']:.2f}): {l['instruction']} -> {l['body']}")
    else:
        print("\n✅ All sampled items meet the confidence threshold (>= 85%).")
    print("======================================================================\n")


def main():
    parser = argparse.ArgumentParser(description="Audit and spot-check parascolaire extracted items.")
    parser.add_argument('--book', type=str, help="Filter by book slug")
    parser.add_argument('--sample', type=int, default=5, help="Number of pages to spot-check per book")
    parser.add_argument('--min-conf', type=float, default=0.85, help="Minimum acceptable confidence threshold")
    args = parser.parse_args()

    spot_check(sample_size=args.sample, target_book=args.book, min_conf=args.min_conf)


if __name__ == '__main__':
    main()
