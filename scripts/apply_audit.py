"""Apply OCR audit results: use corrections, park poor pages and their exam/correction partners."""
import json, collections, sys
from pathlib import Path
sys.stdout.reconfigure(encoding='utf-8')
A = Path('parascolaire_frozen/_archive'); POOR = 0.75
pages = {}
for pf in sorted(A.glob('*/pages/*.json')):
    d = json.loads(pf.read_text(encoding='utf-8')); pages[(d['book'], d['page'])] = (pf, d)
poor = set(); c = collections.Counter()
for (b, p), (pf, d) in pages.items():
    a2, a1 = d.get('audit2'), d.get('audit')
    acc = (a2 or a1 or {}).get('accuracy'); acc = acc if isinstance(acc, (int, float)) else None
    if a2 is None and a1 is None: d['quality'] = {'status': 'audit_pending'}; c['audit_pending'] += 1; continue
    src = 'recheck' if a2 else 'audit'
    if acc is not None and acc < POOR if a2 else (acc is not None and acc < 0.7 and a1.get('verdict') == 'needs_fix'):
        d['quality'] = {'status': 'poor', 'accuracy': acc, 'source': src}; poor.add((b, p)); c['poor'] += 1; continue
    if a2 and d.get('itemsCorrected') and 'itemsOcr1' not in d:
        old = d['items']; new = d['itemsCorrected']
        for i, it in enumerate(new):
            base = old[i] if i < len(old) else {}
            for k in ('topicId', 'formatGuess', 'difficultyGuess'): it[k] = base.get(k)
            it['id'] = f"{b}_p{p:03d}_i{i + 1}"
        d['itemsOcr1'] = old; d['items'] = new
        d['quality'] = {'status': 'corrected', 'accuracy': acc, 'reviewed': acc >= 0.9}; c['corrected'] += 1
    elif a2:
        d['quality'] = {'status': 'verified', 'accuracy': acc}; c['verified'] += 1
    else:
        d['quality'] = {'status': 'sampled_ok' if a1.get('verdict') != 'needs_fix' else 'recheck_pending', 'accuracy': acc}; c[d['quality']['status']] += 1
partners = set()
for (b, p) in poor:
    d = pages[(b, p)][1]
    for q in d.get('correctionPages', []) + d.get('correctionOf', []):
        if (b, q) in pages and (b, q) not in poor: partners.add((b, q))
for key in poor | partners:
    d = pages[key][1]
    d['linkStatus'] = 'parked'
    fl = d.setdefault('linkFlags', [])
    f = 'poor_scan' if key in poor else 'partner_parked'
    if f not in fl: fl.append(f)
    if key in partners and key not in poor: d.setdefault('quality', {})['partnerOfPoor'] = True
for pf, d in pages.values(): pf.write_text(json.dumps(d, ensure_ascii=False, indent=2), encoding='utf-8')
(A / 'manual_queue.json').write_text(json.dumps(sorted([{'book': b, 'page': p, 'accuracy': pages[(b, p)][1]['quality'].get('accuracy')} for b, p in poor], key=lambda x: x['accuracy'] or 0), ensure_ascii=False, indent=2), encoding='utf-8')
print(dict(c), 'partners parked', len(partners))
