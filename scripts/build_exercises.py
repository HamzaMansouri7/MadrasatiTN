"""One row per exercise item: class, subject, theme, type, format, difficulty, correction, quality tier (ready|shelved)."""
import json, collections, sys
from pathlib import Path
sys.stdout.reconfigure(encoding='utf-8')
A = Path('parascolaire/_archive'); rows = []; tier = collections.Counter()
for pf in sorted(A.glob('*/pages/*.json')):
    d = json.loads(pf.read_text(encoding='utf-8')); t = d.get('tags', {}); q = d.get('quality', {})
    poor = q.get('status') == 'poor' or 'poor_scan' in d.get('linkFlags', []) or 'partner_parked' in d.get('linkFlags', [])
    pending = q.get('status', 'audit_pending') in ('audit_pending', 'recheck_pending', 'unaudited')
    ptype = d.get('pageType') or t.get('pageType')
    corr = d.get('correctionStatus') or ('linked' if d.get('correctionPages') else 'self_contained' if any(i['kind'] == 'answer' or i.get('answer') for i in d['items']) else 'no_correction_yet')
    tr = 'shelved' if poor else 'pending_audit' if pending else 'ready'
    for i in d['items']:
        if i['kind'] == 'answer': continue
        has_ans = bool(i.get('answer')) or corr in ('linked', 'self_contained')
        rows.append({'id': i.get('id'), 'book': d['book'], 'page': d['page'], 'grade': d['grade'], 'subject': t.get('subject'), 'theme': t.get('themeGroup') or t.get('theme'),
                     'pageType': ptype, 'kind': i['kind'], 'number': i.get('number'), 'format': i.get('formatGuess'), 'difficulty': i.get('difficultyGuess'),
                     'topicId': d.get('topicId'), 'correction': corr if ptype == 'exam' else ('inline' if i.get('answer') else ('linked' if d.get('correctionPages') else 'none')),
                     'hasAnswer': has_ans, 'correctionPages': d.get('correctionPages', []), 'quality': q.get('status', 'unaudited'), 'accuracy': q.get('accuracy'),
                     'tier': tr})
        tier[tr] += 1
(A / 'exercises.jsonl').write_text('\n'.join(json.dumps(r, ensure_ascii=False) for r in rows), encoding='utf-8')
by = collections.Counter((r['grade'], r['tier']) for r in rows)
print(len(rows), dict(tier)); print(sorted(by.items()))
