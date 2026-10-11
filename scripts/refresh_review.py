"""Keep _review/ = only pages still needing a human decision; move resolved ones to _review/_done/; rewrite REVIEW_LIST.md and contact sheet."""
import json, shutil, sys
from pathlib import Path
import fitz
sys.stdout.reconfigure(encoding='utf-8')
A = Path('parascolaire/_original_frozen/_archive'); R = A / '_review'; D = R / '_done'; D.mkdir(exist_ok=True)
pending = []; resolved = set()
for pf in sorted(A.glob('*/pages/*.json')):
    d = json.loads(pf.read_text(encoding='utf-8')); q = d.get('quality', {}); st = q.get('status'); fl = d.get('linkFlags', [])
    cs = [i.get('confidence', 1) for i in d['items'] if isinstance(i.get('confidence'), (int, float))]; m = min(cs) if cs else 1
    g = None
    if st == 'poor': g = 'A poor'
    elif st in ('audit_pending', 'recheck_pending') and m < 0.6: g = 'B low-confidence'
    elif 'partner_parked' in fl: g = 'C partner of a poor page'
    key = (d['book'], d['page'])
    if g: pending.append((g, d['grade'][:3], d.get('tags', {}).get('subject', '')[:10], d['book'], d['page'], d.get('pageType') or d.get('tags', {}).get('pageType'), q.get('accuracy') if g[0] != 'B' else round(m, 2)))
    elif st == 'hand_fixed': resolved.add(key)
keep = {f'{b}_p{p:03d}' for _, _, _, b, p, _, _ in pending}
moved = 0
for f in list(R.iterdir()):
    if f.is_file() and f.suffix in ('.png', '.json') and 'contact_sheet' not in f.name:
        stem = f.name.split('.')[0]
        if f.name.endswith('.fixed.json'):
            b2, p2 = stem.rsplit('_p', 1)
            qq = json.loads((A / b2 / 'pages' / f'{int(p2):03d}.json').read_text(encoding='utf-8')).get('quality', {}) if (A / b2 / 'pages' / f'{int(p2):03d}.json').exists() else {'status': 'hand_fixed'}
            if qq.get('status') == 'hand_fixed' and qq.get('source') in ('antigravity', 'claude-high'): shutil.move(str(f), str(D / f.name)); moved += 1
        elif stem not in keep:
            shutil.move(str(f), str(D / f.name)); moved += 1
for g, gr, sub, b, p, pt, sc in pending:
    img = R / f'{b}_p{p:03d}.png'
    if not img.exists():
        bj = json.loads((A / b / 'book.json').read_text(encoding='utf-8'))
        fitz.open('parascolaire/' + bj['sourceFile'])[p - 1].get_pixmap(dpi=80).save(str(img))
L = [f'# Pages à vérifier ({len(pending)})', '', 'Seules les pages encore sans décision. Résolues (texte corrigé) dans `_done/`.', '', '| # | Groupe | Classe | Matière | Livre | Page | Type | Score |', '|---|---|---|---|---|---|---|---|']
pending.sort()
for k, (g, gr, sub, b, p, pt, sc) in enumerate(pending, 1): L.append(f'| {k} | {g} | {gr} | {sub} | {b} | {p} | {pt} | {sc} |')
(R / 'REVIEW_LIST.md').write_text('\n'.join(L), encoding='utf-8')
old = R / 'contact_sheet_low_confidence.png'
if old.exists(): old.unlink()
print(len(pending), 'to review;', moved, 'files moved to _done;', len(resolved), 'resolved pages')
import collections; print(collections.Counter(p[0] for p in pending))
