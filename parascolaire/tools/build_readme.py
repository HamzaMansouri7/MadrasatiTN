"""Build parascolaire/README.md from parascolaire/livres/ only (no frozen data, no external paths).

Run from anywhere:  python parascolaire/tools/build_readme.py
Run build_matrix.py first if the books changed (README links to MATRIX.md, it does not copy it).
"""
import json, sys, collections
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import export_notebooklm as exp          # exact-match correction logic shared with the export

sys.stdout.reconfigure(encoding='utf-8')
ROOT = Path(__file__).resolve().parent.parent
LIVRES = ROOT / 'livres'
load = lambda p: json.loads(p.read_text(encoding='utf-8'))
gkey = lambda g: int(g[0])
WITH_CORR = ('inline', 'linked', 'self_contained')
pct = lambda a, b: f'{100 * a // b}%' if b else '-'

books, rows, pages = [], [], 0
for bj in sorted(LIVRES.glob('*/*/book.json')):
    b = load(bj); b['_dir'] = bj.parent
    ex = load(bj.parent / 'exercices.json')['exercises']
    b['_rows'] = [r for r in ex if r.get('kind') == 'exercise']
    bp = {int(pf.stem): load(pf) for pf in (bj.parent / 'pages').glob('*.json')}
    bi = {it['id']: it for pg in bp.values() for it in pg['items'] if it.get('id')}
    ci = {}
    for r in b['_rows']:
        if r['page'] not in ci:
            ci[r['page']] = exp.build_correction_index([x for x in b['_rows'] if x['page'] == r['page']], r['page'], bp)
        it = bi.get(r['id'])
        r['_corr'] = r['correction'] if it and exp.correction_for(r, it, ci[r['page']])[0] else 'none'
    rows += b['_rows']; pages += len(list((bj.parent / 'pages').glob('*.json')))
    books.append(b)
books.sort(key=lambda b: (gkey(b['grade']), b['title']))
n = len(rows); ready = sum(r['tier'] == 'ready' for r in rows)
corr = sum(r['_corr'] in WITH_CORR for r in rows); linked = sum(bool(r.get('topicId')) for r in rows)
sample = next(iter(books[0]['_rows']))

L = ['# Bibliothèque parascolaire — Madrasati TN', '',
     'Banque d’exercices du primaire tunisien (1ère à 6ème année), organisée par livre, classe, matière, thème, format et corrigé. '
     'Elle sert de matière de référence pour les trois moteurs: presets d’exercices, agent de rédaction, livres privés.', '',
     f'**{len(books)} livres · {pages} pages · {n} exercices · {ready} prêts ({pct(ready, n)}) · {corr} avec corrigé ({pct(corr, n)}) · {linked} liés au programme officiel ({pct(linked, n)})**', '',
     '## Organisation', '', '```', 'parascolaire/',
     '  livres/<classe>/<livre>/book.json       fiche du livre (nom, classe, matière, totaux)',
     '  livres/<classe>/<livre>/exercices.json  tous les exercices du livre, une ligne par exercice',
     '  livres/<classe>/<livre>/pages/NNN.json  une page (texte, thème, qualité, liens)',
     '  MATRIX.md                               matrices de repérage (classe, matière, thème, corrigé…)',
     '  matrix.json                             mêmes chiffres, lisibles par les moteurs',
     '  tools/build_matrix.py                   régénère MATRIX.md et matrix.json',
     '  tools/build_readme.py                   régénère ce fichier', '```', '',
     'Tout est régénérable à partir de `livres/`. Les fichiers générés ne s’éditent pas à la main.', '',
     '## Les livres', '', '| Classe | Livre | Matière | Pages | Exercices | Prêts | Avec corrigé | Liés au programme |', '|---|---|---|---|---|---|---|---|']
for b in books:
    R = b['_rows']; nb = len(R)
    L.append(f"| {b['grade']} | {b['title']} | {b['subject']} | {b['totalPages']} | {nb} | {sum(r['tier'] == 'ready' for r in R)} | "
             f"{sum(r['_corr'] in WITH_CORR for r in R)} | {sum(bool(r.get('topicId')) for r in R)} |")
L.append(f"| **Total** | | | **{pages}** | **{n}** | **{ready}** | **{corr}** | **{linked}** |")

by_cls = collections.defaultdict(collections.Counter)
for r in rows:
    c = by_cls[r['grade']]; c['ex'] += 1; c['ready'] += r['tier'] == 'ready'; c['corr'] += r['_corr'] in WITH_CORR; c['link'] += bool(r.get('topicId'))
L += ['', '## Par classe', '', '| Classe | Exercices | Prêts | Avec corrigé | Liés au programme |', '|---|---|---|---|---|']
for g in sorted(by_cls, key=gkey):
    c = by_cls[g]; L.append(f"| {g} | {c['ex']} | {c['ready']} ({pct(c['ready'], c['ex'])}) | {c['corr']} ({pct(c['corr'], c['ex'])}) | {c['link']} ({pct(c['link'], c['ex'])}) |")
L += ['', 'Le détail (matière, thème, format, examens, qualité) est dans [MATRIX.md](MATRIX.md).', '',
      '## Un exercice (`exercices.json`)', '', 'Champs présents sur chaque ligne:', '', '| Champ | Valeur d’exemple |', '|---|---|']
for k, v in sample.items():
    L.append(f"| `{k}` | `{json.dumps(v, ensure_ascii=False)}` |")
L += ['', '- `tier`: `ready` (utilisable), `pending_audit` (texte pas encore contrôlé), `shelved` (écarté).',
      '- `correction`: `inline` (réponse dans l’exercice), `self_contained`, `linked` (corrigé sur une autre page du livre), `no_correction_yet`, `none`.',
      '- `topicId`: chapitre du programme officiel; vide si l’exercice n’est pas encore rattaché.',
      '- `format`: `fill_blank`, `calculation`, `matching`, `qcm`, `problem_solving`, `text_production`, `true_false`, `free`.',
      '- `difficulty`: estimée d’après la position dans le livre (indicatif).', '',
      '## Utilisation par moteur', '',
      '| Moteur | Filtre conseillé | Remarque |', '|---|---|---|',
      '| Presets d’exercices | `tier = ready`, `correction` dans (`inline`, `self_contained`, `linked`), `topicId` renseigné | Table 12 de MATRIX.md: quel format est assez fourni. |',
      '| Agent de rédaction | `tier = ready`, par `topicId` ou thème | Les exercices servent d’exemples de style et de niveau, pas de texte à recopier. |',
      '| Livres privés | un dossier `livres/<classe>/<livre>/` complet | Le nom du livre est dans `book.json` (`title`). |', '',
      '## Limites connues', '',
      f'- {n - linked} exercices ({pct(n - linked, n)}) n’ont pas de `topicId`: ils ne sortent pas dans une recherche par chapitre (table 11 de MATRIX.md).',
      f'- {n - ready} exercices ne sont pas `ready` (texte non contrôlé).',
      '- Le format de chaque exercice est détecté par règles: environ 40% restent `free`.',
      '- La difficulté est une estimation, pas une mesure.',
      '- Les corrigés `linked` ont été rattachés par IA et non vérifiés à la main.', '']
(ROOT / 'README.md').write_text('\n'.join(L), encoding='utf-8')
print('README.md written,', len(L), 'lines')
