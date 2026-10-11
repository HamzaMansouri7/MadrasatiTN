"""Steady set: exam pages that have a correction (linked or on the same page), organized by class > subject > theme."""
import json, collections, re, sys
from pathlib import Path
sys.stdout.reconfigure(encoding='utf-8')
A = Path('parascolaire_frozen/_archive'); rows = []
BOOK_NAMES = json.loads((A / 'book_names.json').read_text(encoding='utf-8')) if (A / 'book_names.json').exists() else {}
for pf in sorted(A.glob('*/pages/*.json')):
    d = json.loads(pf.read_text(encoding='utf-8')); t = d.get('tags', {})
    ptype = d.get('pageType') or t.get('pageType')
    if ptype != 'exam': continue
    inline = any(i['kind'] == 'answer' or i.get('answer') for i in d['items'])
    corr = 'linked' if d.get('correctionPages') else 'self_contained' if (d.get('selfContained') or inline) else None
    if not corr: continue
    q = d.get('quality', {})
    rows.append({'grade': d['grade'], 'subject': t.get('subject'), 'theme': t.get('themeGroup') or t.get('theme'), 'book': d['book'], 'page': d['page'],
                 'correction': corr, 'correctionPages': d.get('correctionPages', []), 'quality': q.get('status', 'unaudited'), 'accuracy': q.get('accuracy'),
                 'tier': 'shelved' if (q.get('status') == 'poor' or 'partner_parked' in d.get('linkFlags', [])) else 'pending_audit' if q.get('status', 'audit_pending') in ('audit_pending', 'recheck_pending', 'unaudited') else 'ready'})
(A / 'exams_with_correction.jsonl').write_text('\n'.join(json.dumps(r, ensure_ascii=False) for r in rows), encoding='utf-8')
GO = lambda g: int(re.match(r'(\d)', g).group(1))
L = ['# Examens avec corrigé (ensemble stable)', '', f'{len(rows)} pages d’examen avec corrigé lié ou sur la même page. Classées par classe, matière, thème. `corrigé: pXX` = page du corrigé dans le même livre.', '']
tree = collections.defaultdict(lambda: collections.defaultdict(lambda: collections.defaultdict(list)))
for r in rows: tree[r['grade']][r['subject']][r['theme']].append(r)
for g in sorted(tree, key=GO):
    L += [f'## {g}', '']
    for s in sorted(tree[g], key=str):
        L += [f'### {s}', '']
        for th, rs in sorted(tree[g][s].items(), key=lambda kv: str(kv[0])):
            L.append(f'**{th}**'); L.append('')
            for r in rs:
                c = f"corrigé: p{','.join(map(str, r['correctionPages']))}" if r['correction'] == 'linked' else 'corrigé sur la page'
                bname = BOOK_NAMES.get(r['book'], r['book'])
                L.append(f"- {bname} p{r['page']} · {c} · qualité {r['quality']}" + (f" ({r['accuracy']})" if r['accuracy'] else '') + (' · EN ATTENTE' if r['tier'] == 'shelved' else ' · À AUDITER' if r['tier'] == 'pending_audit' else ''))
            L.append('')
(A / 'EXAMS_WITH_CORRECTION.md').write_text('\n'.join(L), encoding='utf-8')
c = collections.Counter((r['grade'], r['tier']) for r in rows)
print(len(rows), collections.Counter(r['tier'] for r in rows), collections.Counter(r['correction'] for r in rows)); print(sorted(c.items()))
