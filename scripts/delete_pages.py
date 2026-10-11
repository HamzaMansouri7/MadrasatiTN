"""Cascade-delete archive pages: JSON, review image, links in other pages, exam_links pairs, manual queue, deletion manifest."""
import json, sys, time
from pathlib import Path
sys.stdout.reconfigure(encoding='utf-8')
A = Path('parascolaire/_original_frozen/_archive'); targets = {}
for a in sys.argv[1:]:
    b, p = a.rsplit(':', 1); targets.setdefault(b, set()).add(int(p))
gone = {(b, p) for b, ps in targets.items() for p in ps}; log = []
for b, p in sorted(gone):
    pf = A / b / 'pages' / f'{p:03d}.json'
    if pf.exists(): pf.unlink(); log.append(f'json {b} p{p}')
    img = A / '_review' / f'{b}_p{p:03d}.png'
    if img.exists(): img.unlink(); log.append(f'image {b} p{p}')
touched = 0
for pf in A.glob('*/pages/*.json'):
    d = json.loads(pf.read_text(encoding='utf-8')); b = d['book']; ch = False
    for k in ('correctionPages', 'correctionOf'):
        if d.get(k):
            new = [x for x in d[k] if (b, x) not in gone]
            if new != d[k]:
                ch = True; d[k] = new
                if not new: d.pop(k)
    if ch:
        if d.get('pageType') == 'exam' or d.get('correctionStatus'):
            if not d.get('correctionPages'): d['correctionStatus'] = 'no_correction_yet'
        fl = d.get('linkFlags', [])
        if 'partner_parked' in fl and not any((b, x) in {(bb, q) for bb, q in []} for x in []):
            others = [x for x in d.get('correctionPages', []) + d.get('correctionOf', [])]
            still_poor = False
            for x in others:
                q = A / b / 'pages' / f'{x:03d}.json'
                if q.exists():
                    qd = json.loads(q.read_text(encoding='utf-8'))
                    if qd.get('quality', {}).get('status') == 'poor': still_poor = True
            if not still_poor:
                fl.remove('partner_parked')
                if not fl: d['linkStatus'] = 'clean'
                d.get('quality', {}).pop('partnerOfPoor', None)
        pf.write_text(json.dumps(d, ensure_ascii=False, indent=2), encoding='utf-8'); touched += 1; log.append(f'unlinked {b} p{d["page"]}')
el = A / 'exam_links.json'
if el.exists():
    pairs = json.loads(el.read_text(encoding='utf-8')); out = []
    for pr in pairs:
        b = pr['book']; pr['statementPages'] = [x for x in pr['statementPages'] if (b, x) not in gone]; pr['correctionPages'] = [x for x in pr['correctionPages'] if (b, x) not in gone]
        if pr['statementPages'] and pr['correctionPages']: out.append(pr)
    log.append(f'exam_links {len(pairs)} -> {len(out)}'); el.write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding='utf-8')
mq = A / 'manual_queue.json'
if mq.exists():
    q = [x for x in json.loads(mq.read_text(encoding='utf-8')) if (x['book'], x['page']) not in gone]; mq.write_text(json.dumps(q, ensure_ascii=False, indent=2), encoding='utf-8')
man = A / 'deleted_pages.jsonl'
with man.open('a', encoding='utf-8') as f:
    for b, p in sorted(gone): f.write(json.dumps({'book': b, 'page': p, 'reason': 'very low quality, owner decision', 'date': time.strftime('%Y-%m-%d')}, ensure_ascii=False) + '\n')
for b in targets:
    bj = A / b / 'book.json'; d = json.loads(bj.read_text(encoding='utf-8')); d['deletedPages'] = sorted(set(d.get('deletedPages', [])) | targets[b]); bj.write_text(json.dumps(d, ensure_ascii=False, indent=2), encoding='utf-8')
print(len(gone), 'pages deleted;', touched, 'pages unlinked'); print('\n'.join(log))
