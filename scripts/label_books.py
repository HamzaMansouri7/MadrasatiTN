"""Per-book labels: class, declared subject (from folder/title when explicit), subject distribution; flags tag conflicts. Writes book.json.labels."""
import json, glob, collections, sys
from pathlib import Path
sys.stdout.reconfigure(encoding='utf-8')
A = Path('parascolaire_frozen/_archive')
FOLDER = {'mathematiques': 'Mathématiques', 'francais': 'Français', 'eveil_scientifique': 'Éveil scientifique'}
TITLE = [('math', 'Mathématiques'), ('production_ecrite', 'Arabe'), ('grammaire_arabe', 'Arabe')]
rows = []
OV = json.loads((A / 'book_label_overrides.json').read_text(encoding='utf-8')) if (A / 'book_label_overrides.json').exists() else {}
for bj in sorted(A.glob('*/book.json')):
    b = json.loads(bj.read_text(encoding='utf-8')); slug = bj.parent.name; parts = Path(b['sourceFile']).parts
    dist = collections.Counter(); 
    for pf in bj.parent.glob('pages/*.json'):
        d = json.loads(pf.read_text(encoding='utf-8')); dist[d['tags']['subject']] += 1
    decl = next((FOLDER[p] for p in parts if p in FOLDER), None); src = 'folder' if decl else None
    if not decl and ('toutes_matieres' in slug or 'complet' in slug and 'sagesse' not in slug and 'ahram' not in slug): pass
    top, n = dist.most_common(1)[0]; tot = sum(dist.values())
    lab = {'class': b['grade'], 'subjectsAll': dict(dist), 'subjectDeclared': decl, 'subjectDeclaredFrom': src, 'subjectTop': top, 'topShare': round(n / tot, 2),
           'kind': 'parascolaire', 'needsReview': bool(decl and decl != top) or (n / tot) < 0.6}
    if slug in OV: lab.update({'subjectDeclared': OV[slug]['subject'], 'subjectDeclaredFrom': OV[slug]['by'], 'needsReview': False, 'note': OV[slug].get('note')})
    b['labels'] = lab; bj.write_text(json.dumps(b, ensure_ascii=False, indent=2), encoding='utf-8')
    rows.append((slug, b['grade'][:3], decl or '-', top, round(n / tot, 2), 'REVIEW' if lab['needsReview'] else 'ok', dict(dist.most_common(4))))
print('book|class|declared(folder)|top tag|share|status|distribution')
for r in rows: print('|'.join(map(str, r)))
