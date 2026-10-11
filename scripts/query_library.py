"""CLI query engine for parascolaire library outside the TypeScript server.

Usage:
  python scripts/query_library.py --topicId math-5-ch1
  python scripts/query_library.py --grade "5ème Année" --subject "Mathématiques" --theme "Grands nombres"
  python scripts/query_library.py --format calculation --limit 5
"""
import argparse, json, sys
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8')

BUNDLE_PATH = Path('data/parascolaire/index.json')

def tokenize(text):
    import re
    return set(re.findall(r'[\w\u0600-\u06FF]{2,}', (text or '').lower()))

def query_library(topic_id=None, grade=None, subject=None, theme=None, fmt=None, limit=5):
    if not BUNDLE_PATH.exists():
        print(f"Error: Bundle not found at {BUNDLE_PATH}. Run scripts/export_parascolaire_bundle.py first.")
        return []

    data = json.loads(BUNDLE_PATH.read_text(encoding='utf-8'))
    items = data if isinstance(data, list) else data.get('items', [])

    results = []
    
    # 1. Exact topicId match has highest priority
    if topic_id:
        exact = [it for it in items if it.get('topicId') == topic_id or it.get('ref') == topic_id]
        results.extend(exact)

    # 2. Filter by grade / subject / format if specified
    candidates = items
    if grade:
        candidates = [it for it in candidates if it.get('grade') == grade]
    if subject:
        s_lower = subject.lower()
        candidates = [it for it in candidates if s_lower in (it.get('subject') or '').lower()]
    if fmt:
        f_lower = fmt.lower()
        candidates = [it for it in candidates if (it.get('format') or '').lower() == f_lower]

    # Rank by theme / keyword score if theme given
    if theme:
        theme_tokens = tokenize(theme)
        scored = []
        for it in candidates:
            if it in results:
                continue
            haystack = f"{it.get('title', '')} {it.get('theme', '')} {it.get('text', '')}".lower()
            score = sum(1 for t in theme_tokens if t in haystack)
            if score > 0:
                scored.append((score, it))
        scored.sort(key=lambda x: -x[0])
        results.extend([it for _, it in scored])
    elif not topic_id:
        for it in candidates:
            if it not in results:
                results.append(it)

    return results[:limit]

def main():
    parser = argparse.ArgumentParser(description="Query parascolaire library")
    parser.add_argument('--topicId', help="Curriculum topicId (e.g. math-5-ch1)")
    parser.add_argument('--grade', help="Grade level (e.g. '5ème Année')")
    parser.add_argument('--subject', help="Subject (e.g. Mathématiques, Arabe, Français)")
    parser.add_argument('--theme', help="Theme keywords")
    parser.add_argument('--format', dest='fmt', help="Exercise format (calculation, fill_blank, etc.)")
    parser.add_argument('--limit', type=int, default=5, help="Max results to return")
    args = parser.parse_args()

    matches = query_library(
        topic_id=args.topicId,
        grade=args.grade,
        subject=args.subject,
        theme=args.theme,
        fmt=args.fmt,
        limit=args.limit
    )

    print(f"Found {len(matches)} matching parascolaire items:")
    for idx, it in enumerate(matches, 1):
        print("=" * 60)
        print(f"{idx}. {it.get('title')} [{it.get('format', 'free')}] (ID: {it.get('id')})")
        print(f"   Grade: {it.get('grade')} | Matière: {it.get('subject')} | TopicId: {it.get('topicId')}")
        print(f"   Provenance: {it.get('bookDisplayName')} (p. {it.get('page')})")
        print("-" * 60)
        print(it.get('text', '')[:300])
        if it.get('correction'):
            print(f"\n   [Corrigé]: {it.get('correction')[:150]}")

if __name__ == '__main__':
    main()
