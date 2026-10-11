"""After fixes: unpark partner pages whose poor partner is no longer poor, clean pages with no remaining flags, rebuild indexes."""
import json, sys, collections
from pathlib import Path
sys.stdout.reconfigure(encoding='utf-8')
A = Path('parascolaire_frozen/_archive'); pages = {}
for pf in A.glob('*/pages/*.json'):
    d = json.loads(pf.read_text(encoding='utf-8')); pages[(d['book'], d['page'])] = (pf, d)
is_poor = lambda d: d.get('quality', {}).get('status') == 'poor' or 'poor_scan' in d.get('linkFlags', [])
c = collections.Counter()
for (b, p), (pf, d) in pages.items():
    fl = d.get('linkFlags', []); ch = False
    if d.get('quality', {}).get('status') == 'hand_fixed':
        for x in ('poor_scan', 'low_ocr_confidence'):
            if x in fl: fl.remove(x); ch = True; c['stale flag removed'] += 1
    if 'partner_parked' in fl:
        partners = d.get('correctionPages', []) + d.get('correctionOf', [])
        if not any((b, x) in pages and is_poor(pages[(b, x)][1]) for x in partners):
            fl.remove('partner_parked'); d.get('quality', {}).pop('partnerOfPoor', None); ch = True; c['partner unparked'] += 1
    if ch and not fl and d.get('linkStatus') == 'parked' and d.get('topicId'):
        d['linkStatus'] = 'clean'; c['page now clean'] += 1
    if ch: pf.write_text(json.dumps(d, ensure_ascii=False, indent=2), encoding='utf-8')
cl = pk = 0
with (A / 'index_clean.jsonl').open('w', encoding='utf-8') as a, (A / 'index_parked.jsonl').open('w', encoding='utf-8') as b2:
    for pf in sorted(A.glob('*/pages/*.json')):
        d = json.loads(pf.read_text(encoding='utf-8'))
        row = {'book': d['book'], 'page': d['page'], 'topicId': d['topicId'], 'confidence': d['topicConfidence'], 'flags': d['linkFlags'], 'pageType': d.get('pageType'), 'quality': d.get('quality', {}).get('status'), 'reason': d.get('topicReason', ''), 'items': len(d['items'])}
        (a if d['linkStatus'] == 'clean' else b2).write(json.dumps(row, ensure_ascii=False) + '\n'); cl += d['linkStatus'] == 'clean'; pk += d['linkStatus'] != 'clean'
mq = A / 'manual_queue.json'
if mq.exists():
    q = [x for x in json.loads(mq.read_text(encoding='utf-8')) if (x['book'], x['page']) in pages and is_poor(pages[(x['book'], x['page'])][1])]; mq.write_text(json.dumps(q, ensure_ascii=False, indent=2), encoding='utf-8'); c['manual queue left'] = len(q)
print(dict(c), 'clean', cl, 'parked', pk)
