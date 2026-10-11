import json, random, os
from collections import defaultdict

NAMES = json.load(open('parascolaire_frozen/_archive/book_names.json', encoding='utf-8'))
rows = [json.loads(line) for line in open('parascolaire_frozen/_archive/exercises.jsonl', encoding='utf-8')]
pending = [r for r in rows if r.get('tier') == 'pending_audit']

print(f"Total pending_audit: {len(pending)}")

by_book = defaultdict(list)
for r in pending:
    by_book[r['book']].append(r)

random.seed(42)
samples = []

for book, items in by_book.items():
    chosen = random.sample(items, min(2, len(items)))
    for c in chosen:
        page_file = f"parascolaire_frozen/_archive/{c['book']}/pages/{c['book']}_{c['page']}.json"
        body_snippet = ""
        instruction = ""
        if os.path.exists(page_file):
            pdata = json.load(open(page_file, encoding='utf-8'))
            idx = c.get('number', 1) - 1
            if 0 <= idx < len(pdata.get('items', [])):
                it = pdata['items'][idx]
                instruction = it.get('instruction', '')[:100]
                body_snippet = it.get('body', '')[:120]

        q = c.get('quality')
        q_status = q if isinstance(q, str) else (q.get('status') if isinstance(q, dict) else str(q))

        samples.append({
            "bookDisplayName": NAMES.get(c['book'], c['book']),
            "page": c['page'],
            "exerciseNumber": c.get('number'),
            "grade": c.get('grade'),
            "subject": c.get('subject'),
            "kind": c['kind'],
            "format": c.get('format'),
            "instruction": instruction,
            "bodySnippet": body_snippet,
            "hasAnswer": c.get('hasAnswer'),
            "correctionPages": c.get('correctionPages', []),
            "qualityStatus": q_status
        })

print(f"Sampled {len(samples)} exercises across {len(by_book)} books.")
out_path = 'parascolaire_frozen/_archive/_label_check/pending_audit_sample.json'
with open(out_path, 'w', encoding='utf-8') as f:
    json.dump({
        "totalPending": len(pending),
        "sampleCount": len(samples),
        "note": "Representative sample of 2 exercises per book with tier=pending_audit. Bulk audit requires owner approval (~$0.02/page).",
        "samples": samples
    }, f, indent=2, ensure_ascii=False)

print(f"Saved sample to {out_path}")
