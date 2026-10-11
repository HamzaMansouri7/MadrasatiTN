"""Generate parascolaire/MATRIX.md: guide of matrix tables (add one function per table)."""
import json, glob, collections, sys
from pathlib import Path
sys.stdout.reconfigure(encoding='utf-8')
A = Path('parascolaire/_original_frozen/_archive'); pages = []
for f in sorted(A.glob('*/pages/*.json')): pages.append(json.loads(f.read_text(encoding='utf-8')))
ptype = lambda d: d.get('pageType') or d.get('tags', {}).get('pageType')
audited = lambda d: d.get('quality', {}).get('status', 'audit_pending') not in ('audit_pending', 'recheck_pending')
has_corr = lambda d, i: bool(i.get('answer') or any(x['kind'] == 'answer' for x in d['items']) or d.get('selfContained') or d.get('correctionPages'))
gkey = lambda g: int(g[0])
NAMES = json.loads((A / 'book_names.json').read_text(encoding='utf-8')) if (A / 'book_names.json').exists() else {}
bk = lambda b: NAMES.get(b, b)

def table_by_class():
    C = collections.defaultdict(collections.Counter); books = collections.defaultdict(set); themes = collections.defaultdict(set)
    for d in pages:
        g = d['grade']; c = C[g]; books[g].add(d['book']); themes[g].add(d['tags'].get('themeGroup') or d['tags']['theme']); c['pages'] += 1
        c['clean'] += d['linkStatus'] == 'clean'; t = ptype(d)
        if t == 'exam': c['exams'] += 1; c['exam_corr'] += d.get('correctionStatus') in ('linked', 'self_contained')
        for i in d['items']:
            if i['kind'] == 'lesson': c['lessons'] += 1
            if i['kind'] == 'exercise':
                c['ex'] += 1; c['ready'] += audited(d); c['ex_corr'] += has_corr(d, i)
    L = ['| Classe | Livres | Pages | Pages propres | Thèmes | Items de cours | Exercices | Prêts | Avec corrigé | Examens | Examens avec corrigé |', '|---|---|---|---|---|---|---|---|---|---|---|']; T = collections.Counter(); tb = set(); tt = set()
    for g in sorted(C, key=gkey):
        c = C[g]; T.update(c); tb |= books[g]; tt |= themes[g]
        L.append(f"| {g} | {len(books[g])} | {c['pages']} | {c['clean']} | {len(themes[g])} | {c['lessons']} | {c['ex']} | {c['ready']} | {c['ex_corr']} | {c['exams']} | {c['exam_corr']} |")
    L.append(f"| **Total** | **{len(tb)}** | **{T['pages']}** | **{T['clean']}** | **{len(tt)}** | **{T['lessons']}** | **{T['ex']}** | **{T['ready']}** | **{T['ex_corr']}** | **{T['exams']}** | **{T['exam_corr']}** |")
    return L


SUBJ = lambda d: d.get('labels', {}).get('pageSubject') or d.get('tags', {}).get('subject')
def table_class_subject():
    C = collections.defaultdict(lambda: collections.defaultdict(collections.Counter)); subs = collections.Counter()
    for d in pages:
        c = C[d['grade']][SUBJ(d)]; c['pages'] += 1; subs[SUBJ(d)] += 1
        for i in d['items']:
            if i['kind'] == 'exercise': c['ex'] += 1; c['corr'] += has_corr(d, i)
    cols = [s for s, _ in subs.most_common()]
    L = ['| Classe | ' + ' | '.join(cols) + ' | Total |', '|---|' + '---|' * (len(cols) + 1)]
    for g in sorted(C, key=gkey):
        cells = []; tp = te = 0
        for s_ in cols:
            c = C[g][s_]; tp += c['pages']; te += c['ex']; cells.append(f"{c['pages']} p / {c['ex']} ex" if c['pages'] else '-')
        L.append(f'| {g} | ' + ' | '.join(cells) + f' | {tp} p / {te} ex |')
    tot = []
    for s_ in cols:
        tp = sum(C[g][s_]['pages'] for g in C); te = sum(C[g][s_]['ex'] for g in C); tot.append(f'**{tp} p / {te} ex**')
    L.append('| **Total** | ' + ' | '.join(tot) + f" | **{sum(subs.values())} p / {sum(sum(C[g][x]['ex'] for x in C[g]) for g in C)} ex** |")
    return L

def table_subject_themes():
    T = collections.defaultdict(lambda: collections.defaultdict(collections.Counter)); grades = collections.defaultdict(lambda: collections.defaultdict(set))
    for d in pages:
        th = d['tags'].get('themeGroup') or d['tags']['theme']; c = T[SUBJ(d)][(d['grade'], th)]; c['pages'] += 1
        for i in d['items']:
            if i['kind'] == 'exercise': c['ex'] += 1; c['corr'] += has_corr(d, i)
    L = []
    for s_ in sorted(T, key=lambda x: -sum(c['pages'] for c in T[x].values())):
        L += [f'### {s_}', '', '| Classe | Thème | Pages | Exercices | Avec corrigé |', '|---|---|---|---|---|']
        for (g, th), c in sorted(T[s_].items(), key=lambda kv: (gkey(kv[0][0]), kv[0][1])): L.append(f"| {g} | {th} | {c['pages']} | {c['ex']} | {c['corr']} |")
        L.append('')
    return L

def table_corrections():
    C = collections.defaultdict(collections.Counter)
    for d in pages:
        pa = any(x['kind'] == 'answer' for x in d['items']) or d.get('selfContained'); lk = bool(d.get('correctionPages'))
        for i in d['items']:
            if i['kind'] != 'exercise': continue
            c = C[(d['grade'], SUBJ(d))]; c['ex'] += 1
            if i.get('answer'): c['inline'] += 1
            elif pa: c['same'] += 1
            elif lk: c['linked'] += 1
            else: c['none'] += 1
    L = ['| Classe | Matière | Exercices | Réponse dans l’item | Réponses sur la page | Corrigé sur page liée | Total avec corrigé | Sans corrigé | % avec corrigé |', '|---|---|---|---|---|---|---|---|---|']; T = collections.Counter()
    for (g, s_), c in sorted(C.items(), key=lambda kv: (gkey(kv[0][0]), -kv[1]['ex'])):
        w = c['inline'] + c['same'] + c['linked']; T.update(c)
        L.append(f"| {g} | {s_} | {c['ex']} | {c['inline']} | {c['same']} | {c['linked']} | {w} | {c['none']} | {100 * w // c['ex']}% |")
    w = T['inline'] + T['same'] + T['linked']
    L.append(f"| **Total** | | **{T['ex']}** | **{T['inline']}** | **{T['same']}** | **{T['linked']}** | **{w}** | **{T['none']}** | **{100 * w // T['ex']}%** |")
    return L

def table_book_class_subject():
    B = collections.defaultdict(collections.Counter); G = {}
    for d in pages: B[d['book']][SUBJ(d)] += 1; G[d['book']] = d['grade']
    L = ['| Livre | Classe | Pages | Matières (pages) |', '|---|---|---|---|']
    for b in sorted(B, key=lambda x: (gkey(G[x]), x)): L.append(f"| {bk(b)} | {G[b]} | {sum(B[b].values())} | " + ', '.join(f'{k} {v}' for k, v in B[b].most_common()) + ' |')
    return L

def table_formats_subject():
    F = collections.defaultdict(collections.Counter); subs = collections.Counter()
    for d in pages:
        sj = SUBJ(d); subs[sj] += 1
        for f in set(d['tags'].get('formats', [])): F[f][sj] += 1
    cols = [x for x, _ in subs.most_common(5)]
    L = ['| Format (page) | ' + ' | '.join(cols) + ' | Total |', '|---|' + '---|' * (len(cols) + 1)]
    for f, c in sorted(F.items(), key=lambda kv: -sum(kv[1].values())): L.append(f'| {f} | ' + ' | '.join(str(c[x]) for x in cols) + f' | {sum(c[x] for x in cols)} |')
    L.append('| **Pages** | ' + ' | '.join(f'**{subs[x]}**' for x in cols) + f' | **{sum(subs[x] for x in cols)}** |')
    return L

def table_class_format():
    EXF = A / 'exercises.jsonl'
    if not EXF.exists(): return []
    C = collections.defaultdict(collections.Counter); fmts = collections.Counter()
    for ln in EXF.read_text(encoding='utf-8').splitlines():
        r = json.loads(ln)
        if r.get('kind') != 'exercise': continue
        f = r.get('format') or 'free'
        C[r['grade']][f] += 1; fmts[f] += 1
    cols = [f for f, _ in fmts.most_common()]
    L = ['| Classe | ' + ' | '.join(cols) + ' | Total |', '|---|' + '---|' * (len(cols) + 1)]
    for g in sorted(C, key=gkey):
        cells = [str(C[g][f]) for f in cols]
        L.append(f'| {g} | ' + ' | '.join(cells) + f' | {sum(C[g].values())} |')
    tot = [str(fmts[f]) for f in cols]
    L.append('| **Total** | ' + ' | '.join(f'**{x}**' for x in tot) + f' | **{sum(fmts.values())}** |')
    return L

def table_difficulty():
    C = collections.defaultdict(collections.Counter)
    for d in pages:
        for i in d['items']:
            if i['kind'] == 'exercise': C[(d['grade'], SUBJ(d))][i.get('difficultyGuess') or 'n/a'] += 1
    L = ['| Classe | Matière | easy | medium | hard | n/a | Total |', '|---|---|---|---|---|---|---|']; T = collections.Counter()
    for (g, s_), c in sorted(C.items(), key=lambda kv: (gkey(kv[0][0]), -sum(kv[1].values()))):
        T.update(c); L.append(f"| {g} | {s_} | {c['easy']} | {c['medium']} | {c['hard']} | {c['n/a']} | {sum(c.values())} |")
    L.append(f"| **Total** | | **{T['easy']}** | **{T['medium']}** | **{T['hard']}** | **{T['n/a']}** | **{sum(T.values())}** |")
    return L

def table_exams():
    C = collections.defaultdict(collections.Counter)
    for d in pages:
        if ptype(d) != 'exam': continue
        c = C[(d['grade'], SUBJ(d))]; c['n'] += 1; c[d.get('examScope') or 'unknown'] += 1; c['corr'] += d.get('correctionStatus') in ('linked', 'self_contained')
    sc = ['single', 'short_test', 'trimester', 'full_year', 'exam_part', 'unknown']
    L = ['| Classe | Matière | Examens | ' + ' | '.join(sc) + ' | Avec corrigé |', '|---|---|---|' + '---|' * (len(sc) + 1)]; T = collections.Counter()
    for (g, s_), c in sorted(C.items(), key=lambda kv: (gkey(kv[0][0]), -kv[1]['n'])):
        T.update(c); L.append(f"| {g} | {s_} | {c['n']} | " + ' | '.join(str(c[x]) for x in sc) + f" | {c['corr']} |")
    L.append(f"| **Total** | | **{T['n']}** | " + ' | '.join(f'**{T[x]}**' for x in sc) + f" | **{T['corr']}** |")
    return L

def table_quality_book():
    B = collections.defaultdict(collections.Counter); G = {}
    for d in pages:
        c = B[d['book']]; G[d['book']] = d['grade']; c['pages'] += 1; c['clean'] += d['linkStatus'] == 'clean'; c[d.get('quality', {}).get('status', 'audit_pending')] += 1
    L = ['| Livre | Classe | Pages | Propres | Contrôlées (ok) | Corrigées | À auditer |', '|---|---|---|---|---|---|---|']
    for b in sorted(B, key=lambda x: (gkey(G[x]), x)):
        c = B[b]; L.append(f"| {bk(b)} | {G[b]} | {c['pages']} | {c['clean']} | {c['sampled_ok'] + c['verified']} | {c['hand_fixed'] + c['corrected']} | {c['audit_pending'] + c['recheck_pending']} |")
    return L

def table_names():
    L = ['| # | Classe | Dossier (slug) | Titre d’origine | Nom choisi | Pages | PDF source |', '|---|---|---|---|---|---|---|']; rows = []
    for bj in A.glob('*/book.json'):
        b = json.loads(bj.read_text(encoding='utf-8')); rows.append((gkey(b['grade']), bj.parent.name, b))
    for n, (_, slug, b) in enumerate(sorted(rows, key=lambda x: (x[0], x[1])), 1):
        L.append(f"| {n} | {b['grade']} | {slug} | {b.get('originalTitle', b['title'])} | {NAMES.get(slug, '*à nommer*')} | {sum(1 for _ in (A / slug / 'pages').glob('*.json'))} | {b['sourceFile']} |")
    return L

TABLES = [('0. Noms des livres', 'Nom d’origine et nom choisi. Le dossier (slug) ne change pas: tous les identifiants en dépendent. Les noms sont dans `_original_frozen/_archive/book_names.json`.', table_names),
          ('1. Matrice par classe', 'Chiffres globaux par classe. Prêts = exercices sur une page contrôlée ou corrigée. Avec corrigé = réponse dans l’item, sur la page ou sur une page de corrigé liée.', table_by_class),
          ('2. Matrice classe par matière', 'Cellule = pages / exercices. Matière = étiquette par page (plusieurs matières possibles dans un même livre).', table_class_subject),
          ('3. Matrice matière par thème', 'Par matière, thèmes normalisés par classe avec pages, exercices et exercices avec corrigé.', table_subject_themes),
          ('4. Matrice exercices avec et sans corrigé', 'Par classe et matière. Page liée = corrigé sur une autre page du même livre (lien fait par l’IA, non vérifié à la main).', table_corrections),
          ('5. Matrice livre par classe et matière', 'Quels livres couvrent quoi (matière = étiquette par page).', table_book_class_subject),
          ('6. Matrice format d’exercice par matière', 'Nombre de pages contenant chaque format (étiquette de page, plus fiable que celle de l’exercice). Une page peut avoir plusieurs formats.', table_formats_subject),
          ('6b. Matrice classe par format d’exercice', 'Répartition des formats d’exercices par niveau scolaire (détection déterministe sur énoncé et consigne).', table_class_format),
          ('7. Matrice difficulté par classe et matière', 'Difficulté estimée d’après la position de la page dans le livre (heuristique, non vérifiée).', table_difficulty),
          ('8. Matrice examens par classe, matière, portée et corrigé', 'Portée: single, short_test, trimester, full_year, exam_part, unknown.', table_exams),
          ('9. Matrice qualité par livre', 'Propres = liées à un chapitre. Contrôlées = audit OK. Corrigées = texte refait. À auditer = jamais contrôlées.', table_quality_book)]
out = ['# Guide des matrices (archive parascolaire)', '', 'Tableaux de repérage pour retrouver vite un thème, un livre ou une classe. Généré par `scripts/build_matrix.py`; ne pas éditer à la main.', '',
       '**Où chercher**', '', '| Besoin | Fichier |', '|---|---|', '| Toutes les pages par classe, matière, thème | `_original_frozen/_archive/CATALOG.md`, `_original_frozen/_archive/catalog.jsonl` |', '| Un exercice précis (classe, thème, corrigé, niveau) | `_original_frozen/_archive/exercises.jsonl` |',
       '| Examens avec corrigé | `_original_frozen/_archive/EXAMS_WITH_CORRECTION.md` |', '| Couverture du programme officiel | `_original_frozen/_archive/COVERAGE.md` |', '| Détail par livre, qualité, règles | `README.md` |', '| Une page | `_original_frozen/_archive/<livre>/pages/NNN.json` |', '']
for title, note, fn in TABLES: out += [f'## {title}', '', note, ''] + fn() + ['']
Path('parascolaire/MATRIX.md').write_text('\n'.join(out), encoding='utf-8'); print('MATRIX.md written,', len(out), 'lines')
