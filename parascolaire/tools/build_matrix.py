"""Build parascolaire/MATRIX.md and parascolaire/matrix.json.

Self-contained: reads ONLY parascolaire/livres/ (rebranded books). It never touches
the frozen originals, so the folder can be pushed and rebuilt on its own.

Run from anywhere:  python parascolaire/tools/build_matrix.py
Add a table = write one function returning a list of markdown lines, then register it in TABLES.
"""
import json, sys, collections
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import export_notebooklm as exp          # same exact-match correction logic as the NotebookLM export

sys.stdout.reconfigure(encoding='utf-8')
ROOT = Path(__file__).resolve().parent.parent          # .../parascolaire
LIVRES = ROOT / 'livres'


def load_json(p):
    return json.loads(p.read_text(encoding='utf-8'))


# ---------- load ----------
books, pages, rows = {}, [], []
for bj in sorted(LIVRES.glob('*/*/book.json')):
    b = load_json(bj)
    b['_dir'] = bj.parent
    books[b['book']] = b
    for pf in sorted((bj.parent / 'pages').glob('*.json')):
        pages.append(load_json(pf))
    ex = bj.parent / 'exercices.json'
    if ex.exists():
        brows = [r for r in load_json(ex)['exercises'] if r.get('kind') == 'exercise']
        bpages = {int(pf.stem): load_json(pf) for pf in (bj.parent / 'pages').glob('*.json')}
        bitems = {it['id']: it for pg in bpages.values() for it in pg['items'] if it.get('id')}
        cidx = {}
        for r in brows:
            if r['page'] not in cidx:
                cidx[r['page']] = exp.build_correction_index([x for x in brows if x['page'] == r['page']], r['page'], bpages)
            it = bitems.get(r['id'])
            txt, st = exp.correction_for(r, it, cidx[r['page']]) if it else (None, 'none')
            # exact correction: text really found for THIS exercise. 'unmatched' = linked page exists, no exact match.
            r['_corr'] = r['correction'] if txt else ('unmatched' if st == 'unmatched' else 'none')
        rows += brows

gkey = lambda g: int(g[0])
bk = lambda slug: books[slug]['title'] if slug in books else slug
ptype = lambda d: d.get('pageType') or d.get('tags', {}).get('pageType')
SUBJ = lambda d: d.get('labels', {}).get('pageSubject') or d.get('tags', {}).get('subject')
audited = lambda d: d.get('quality', {}).get('status', 'audit_pending') not in ('audit_pending', 'recheck_pending')
EXACT = {r['id'] for r in rows if r['_corr'] in ('inline', 'linked', 'self_contained')}   # exact match only
has_corr = lambda d, i: i.get('id') in EXACT
WITH_CORR = ('inline', 'linked', 'self_contained')       # exercise-level correction values
pct = lambda a, b: f'{100 * a // b}%' if b else '-'


def table(head, body, total=None):
    L = ['| ' + ' | '.join(head) + ' |', '|' + '---|' * len(head)]
    L += ['| ' + ' | '.join(str(c) for c in r) + ' |' for r in body]
    if total:
        L.append('| ' + ' | '.join(f'**{c}**' if c != '' else '' for c in total) + ' |')
    return L


# ---------- tables ----------
def t_books():
    R = collections.defaultdict(collections.Counter)
    for r in rows:
        R[r['book']]['ex'] += 1
        R[r['book']]['ready'] += r['tier'] == 'ready'
    body = []
    for n, (slug, b) in enumerate(sorted(books.items(), key=lambda kv: (gkey(kv[1]['grade']), kv[1]['title'])), 1):
        body.append([n, b['grade'], b['title'], b['subject'], f"`{b['_dir'].relative_to(ROOT).as_posix()}`",
                     b['totalPages'], R[slug]['ex'], R[slug]['ready']])
    return table(['#', 'Classe', 'Nom du livre', 'Matière', 'Dossier', 'Pages', 'Exercices', 'Prêts'], body,
                 ['Total', '', '', '', '', sum(b['totalPages'] for b in books.values()), len(rows),
                  sum(r['tier'] == 'ready' for r in rows)])


def t_by_class():
    C = collections.defaultdict(collections.Counter); bset = collections.defaultdict(set); tset = collections.defaultdict(set)
    for d in pages:
        g = d['grade']; c = C[g]; bset[g].add(d['book']); tset[g].add(d['tags'].get('themeGroup') or d['tags']['theme'])
        c['pages'] += 1; c['clean'] += d['linkStatus'] == 'clean'
        if ptype(d) == 'exam':
            c['exams'] += 1; c['exam_corr'] += d.get('correctionStatus') in ('linked', 'self_contained')
        for i in d['items']:
            if i['kind'] == 'lesson': c['lessons'] += 1
            if i['kind'] == 'exercise':
                c['ex'] += 1; c['ready'] += audited(d); c['ex_corr'] += has_corr(d, i)
    T = collections.Counter(); tb = set(); tt = set(); body = []
    for g in sorted(C, key=gkey):
        c = C[g]; T.update(c); tb |= bset[g]; tt |= tset[g]
        body.append([g, len(bset[g]), c['pages'], c['clean'], len(tset[g]), c['lessons'], c['ex'], c['ready'], c['ex_corr'], c['exams'], c['exam_corr']])
    return table(['Classe', 'Livres', 'Pages', 'Pages propres', 'Thèmes', 'Items de cours', 'Exercices', 'Contrôlés', 'Avec corrigé', 'Examens', 'Examens avec corrigé'],
                 body, ['Total', len(tb), T['pages'], T['clean'], len(tt), T['lessons'], T['ex'], T['ready'], T['ex_corr'], T['exams'], T['exam_corr']])


def t_class_subject():
    C = collections.defaultdict(lambda: collections.defaultdict(collections.Counter)); subs = collections.Counter()
    for d in pages:
        c = C[d['grade']][SUBJ(d)]; c['pages'] += 1; subs[SUBJ(d)] += 1
        for i in d['items']:
            if i['kind'] == 'exercise': c['ex'] += 1
    cols = [s for s, _ in subs.most_common()]
    body = []
    for g in sorted(C, key=gkey):
        cells = [f"{C[g][s]['pages']} p / {C[g][s]['ex']} ex" if C[g][s]['pages'] else '-' for s in cols]
        body.append([g] + cells + [f"{sum(C[g][s]['pages'] for s in cols)} p / {sum(C[g][s]['ex'] for s in cols)} ex"])
    tot = [f"{sum(C[g][s]['pages'] for g in C)} p / {sum(C[g][s]['ex'] for g in C)} ex" for s in cols]
    return table(['Classe'] + cols + ['Total'], body,
                 ['Total'] + tot + [f"{sum(subs.values())} p / {sum(sum(C[g][s]['ex'] for s in C[g]) for g in C)} ex"])


def t_subject_themes():
    T = collections.defaultdict(lambda: collections.defaultdict(collections.Counter))
    for d in pages:
        th = d['tags'].get('themeGroup') or d['tags']['theme']; c = T[SUBJ(d)][(d['grade'], th)]; c['pages'] += 1
        for i in d['items']:
            if i['kind'] == 'exercise': c['ex'] += 1; c['corr'] += has_corr(d, i)
    L = []
    for s in sorted(T, key=lambda x: -sum(c['pages'] for c in T[x].values())):
        L += [f'### {s}', '']
        L += table(['Classe', 'Thème', 'Pages', 'Exercices', 'Avec corrigé'],
                   [[g, th, c['pages'], c['ex'], c['corr']] for (g, th), c in sorted(T[s].items(), key=lambda kv: (gkey(kv[0][0]), kv[0][1]))])
        L.append('')
    return L


def t_corrections():
    C = collections.defaultdict(collections.Counter)
    for r in rows:
        c = C[(r['grade'], r['subject'])]; c['ex'] += 1; c[r['_corr']] += 1
    body = []; T = collections.Counter()
    for (g, s), c in sorted(C.items(), key=lambda kv: (gkey(kv[0][0]), -kv[1]['ex'])):
        T.update(c); w = sum(c[k] for k in WITH_CORR)
        body.append([g, s, c['ex'], c['inline'], c['self_contained'], c['linked'], w, c['unmatched'], c['no_correction_yet'] + c['none'], pct(w, c['ex'])])
    w = sum(T[k] for k in WITH_CORR)
    return table(['Classe', 'Matière', 'Exercices', 'Réponse dans l’exercice', 'Réponse sur la page', 'Corrigé exact sur page liée', 'Total avec corrigé', 'Page liée, sans correspondance exacte', 'Sans corrigé', '% avec corrigé'],
                 body, ['Total', '', T['ex'], T['inline'], T['self_contained'], T['linked'], w, T['unmatched'], T['no_correction_yet'] + T['none'], pct(w, T['ex'])])


def t_book_class_subject():
    B = collections.defaultdict(collections.Counter)
    for d in pages: B[d['book']][SUBJ(d)] += 1
    return table(['Livre', 'Classe', 'Pages', 'Matières (pages)'],
                 [[bk(b), books[b]['grade'], sum(B[b].values()), ', '.join(f'{k} {v}' for k, v in B[b].most_common())]
                  for b in sorted(B, key=lambda x: (gkey(books[x]['grade']), bk(x)))])


def t_formats_subject():
    F = collections.defaultdict(collections.Counter); subs = collections.Counter()
    for d in pages:
        sj = SUBJ(d); subs[sj] += 1
        for f in set(d['tags'].get('formats', [])): F[f][sj] += 1
    cols = [x for x, _ in subs.most_common(5)]
    body = [[f] + [c[x] for x in cols] + [sum(c[x] for x in cols)] for f, c in sorted(F.items(), key=lambda kv: -sum(kv[1].values()))]
    return table(['Format (page)'] + cols + ['Total'], body, ['Pages'] + [subs[x] for x in cols] + [sum(subs[x] for x in cols)])


def t_class_format():
    C = collections.defaultdict(collections.Counter); fm = collections.Counter()
    for r in rows:
        f = r.get('format') or 'free'; C[r['grade']][f] += 1; fm[f] += 1
    cols = [f for f, _ in fm.most_common()]
    return table(['Classe'] + cols + ['Total'], [[g] + [C[g][f] for f in cols] + [sum(C[g].values())] for g in sorted(C, key=gkey)],
                 ['Total'] + [fm[f] for f in cols] + [sum(fm.values())])


def t_difficulty():
    C = collections.defaultdict(collections.Counter)
    for r in rows: C[(r['grade'], r['subject'])][r.get('difficulty') or 'n/a'] += 1
    body = []; T = collections.Counter()
    for (g, s), c in sorted(C.items(), key=lambda kv: (gkey(kv[0][0]), -sum(kv[1].values()))):
        T.update(c); body.append([g, s, c['easy'], c['medium'], c['hard'], c['n/a'], sum(c.values())])
    return table(['Classe', 'Matière', 'easy', 'medium', 'hard', 'n/a', 'Total'], body, ['Total', '', T['easy'], T['medium'], T['hard'], T['n/a'], sum(T.values())])


def t_exams():
    C = collections.defaultdict(collections.Counter)
    for d in pages:
        if ptype(d) != 'exam': continue
        c = C[(d['grade'], SUBJ(d))]; c['n'] += 1; c[d.get('examScope') or 'unknown'] += 1
        c['corr'] += d.get('correctionStatus') in ('linked', 'self_contained')
    sc = ['single', 'short_test', 'trimester', 'full_year', 'exam_part', 'unknown']
    body = []; T = collections.Counter()
    for (g, s), c in sorted(C.items(), key=lambda kv: (gkey(kv[0][0]), -kv[1]['n'])):
        T.update(c); body.append([g, s, c['n']] + [c[x] for x in sc] + [c['corr']])
    return table(['Classe', 'Matière', 'Examens'] + sc + ['Avec corrigé'], body, ['Total', '', T['n']] + [T[x] for x in sc] + [T['corr']])


def t_quality_book():
    B = collections.defaultdict(collections.Counter)
    for d in pages:
        c = B[d['book']]; c['pages'] += 1; c['clean'] += d['linkStatus'] == 'clean'; c[d.get('quality', {}).get('status', 'audit_pending')] += 1
    return table(['Livre', 'Classe', 'Pages', 'Propres', 'Contrôlées (ok)', 'Corrigées', 'À auditer'],
                 [[bk(b), books[b]['grade'], c['pages'], c['clean'], c['sampled_ok'] + c['verified'], c['hand_fixed'] + c['corrected'], c['audit_pending'] + c['recheck_pending']]
                  for b, c in sorted(B.items(), key=lambda kv: (gkey(books[kv[0]]['grade']), bk(kv[0])))])


def t_readiness():
    C = collections.defaultdict(collections.Counter)
    for r in rows: C[(r['grade'], r['subject'])][r['tier']] += 1
    body = []; T = collections.Counter()
    for (g, s), c in sorted(C.items(), key=lambda kv: (gkey(kv[0][0]), -sum(kv[1].values()))):
        T.update(c); n = sum(c.values()); body.append([g, s, n, c['ready'], c['pending_audit'], c['shelved'], pct(c['ready'], n)])
    n = sum(T.values())
    return table(['Classe', 'Matière', 'Exercices', 'Prêts', 'À auditer', 'Écartés', '% prêts'], body, ['Total', '', n, T['ready'], T['pending_audit'], T['shelved'], pct(T['ready'], n)])


def t_curriculum_link():
    C = collections.defaultdict(collections.Counter)
    for r in rows:
        c = C[(r['grade'], r['subject'])]; c['ex'] += 1; c['linked'] += bool(r.get('topicId'))
    body = []; T = collections.Counter()
    for (g, s), c in sorted(C.items(), key=lambda kv: (gkey(kv[0][0]), -kv[1]['ex'])):
        T.update(c); body.append([g, s, c['ex'], c['linked'], c['ex'] - c['linked'], pct(c['linked'], c['ex'])])
    return table(['Classe', 'Matière', 'Exercices', 'Liés au programme officiel', 'Non liés', '% liés'], body,
                 ['Total', '', T['ex'], T['linked'], T['ex'] - T['linked'], pct(T['linked'], T['ex'])])


def t_presets():
    C = collections.defaultdict(collections.Counter); subs = collections.Counter()
    for r in rows:
        if r['tier'] != 'ready': continue
        f = r.get('format') or 'free'; s = r['subject']; subs[s] += 1
        C[f][s] += 1; C[f][s + '|c'] += r['_corr'] in WITH_CORR
    cols = [s for s, _ in subs.most_common(5)]
    body = [[f] + [f"{c[s + '|c']} / {c[s]}" for s in cols] for f, c in sorted(C.items(), key=lambda kv: -sum(v for k, v in kv[1].items() if '|' not in k))]
    return table(['Format'] + cols, body)


TABLES = [
    ('0. Les livres', 'Un livre = un dossier dans `livres/<classe>/<livre>/` avec `book.json`, `exercices.json` et `pages/NNN.json`. Prêts = exercices contrôlés ou corrigés.', t_books),
    ('1. Matrice par classe', 'Chiffres globaux. Contrôlés = exercices sur une page auditée. Avec corrigé = réponse dans l’exercice, sur la page ou sur une page de corrigé liée.', t_by_class),
    ('2. Matrice classe par matière', 'Cellule = pages / exercices. La matière est une étiquette par page (un livre peut mêler plusieurs matières).', t_class_subject),
    ('3. Matrice matière par thème', 'Thèmes normalisés par classe, avec pages, exercices et exercices avec corrigé.', t_subject_themes),
    ('4. Matrice des corrigés', 'Par classe et matière. Comptage exact, identique à l’export NotebookLM: un exercice a un corrigé seulement si son texte est retrouvé pour CE numéro d’exercice.', t_corrections),
    ('5. Matrice livre par classe et matière', 'Quels livres couvrent quelle matière.', t_book_class_subject),
    ('6. Matrice formats de page par matière', 'Nombre de pages contenant chaque format (étiquette de page). Une page peut avoir plusieurs formats.', t_formats_subject),
    ('6b. Matrice classe par format d’exercice', 'Formats détectés par règles sur la consigne et l’énoncé.', t_class_format),
    ('7. Matrice difficulté', 'Estimée d’après la position de la page dans le livre (heuristique, non vérifiée).', t_difficulty),
    ('8. Matrice des examens', 'Portée: single, short_test, trimester, full_year, exam_part, unknown.', t_exams),
    ('9. Matrice qualité par livre', 'Propres = liées à un chapitre. Contrôlées = audit OK. Corrigées = texte refait. À auditer = jamais contrôlées.', t_quality_book),
    ('10. Matrice de disponibilité', 'Prêts = utilisables pour générer. À auditer = pas encore contrôlés. Écartés = qualité trop faible.', t_readiness),
    ('11. Matrice du lien au programme officiel', 'Un exercice lié a un `topicId` du programme officiel: c’est la condition pour le retrouver par chapitre.', t_curriculum_link),
    ('12. Matrice des presets', 'Cellule = exercices prêts avec corrigé / exercices prêts, par format et matière. Sert à choisir quels presets alimenter.', t_presets),
]

# ---------- write ----------
out = ['# Guide des matrices — bibliothèque parascolaire', '',
       'Généré par `parascolaire/tools/build_matrix.py` à partir de `livres/` uniquement. Ne pas éditer à la main.', '',
       '**Où chercher**', '', '| Besoin | Fichier |', '|---|---|',
       '| Un livre | `livres/<classe>/<livre>/book.json` |',
       '| Les exercices d’un livre (classe, thème, format, corrigé, niveau) | `livres/<classe>/<livre>/exercices.json` |',
       '| Une page (texte, thème, qualité) | `livres/<classe>/<livre>/pages/NNN.json` |',
       '| Les chiffres de ce guide en JSON | `matrix.json` |', '']
for title, note, fn in TABLES:
    out += [f'## {title}', '', note, ''] + fn() + ['']
(ROOT / 'MATRIX.md').write_text('\n'.join(out), encoding='utf-8')

summary = collections.defaultdict(collections.Counter)
for r in rows:
    k = f"{r['grade']} | {r['subject']}"
    summary[k]['exercises'] += 1; summary[k]['ready'] += r['tier'] == 'ready'
    summary[k]['withCorrection'] += r['_corr'] in WITH_CORR; summary[k]['linkedToCurriculum'] += bool(r.get('topicId'))
(ROOT / 'matrix.json').write_text(json.dumps({'books': len(books), 'pages': len(pages), 'exercises': len(rows),
                                              'byClassSubject': {k: dict(v) for k, v in sorted(summary.items())}}, ensure_ascii=False, indent=2), encoding='utf-8')
print(f'MATRIX.md written, {len(out)} lines · books {len(books)} · pages {len(pages)} · exercises {len(rows)}')
