import json, glob, re, sys, collections
from pathlib import Path
sys.stdout.reconfigure(encoding='utf-8')
A = Path('parascolaire/_archive')
CORR = re.compile(r'corrig|corrección|تصحيح|إصلاح|اصلاح|حلول|الحل\b|solutions?', re.I)
EXAM = re.compile(r'examen|épreuve|epreuve|concours|évaluation|evaluation|اختبار|امتحان|فرض|تقييم|تقويم|محطة|وضعية', re.I)
COVER = re.compile(r'garde|couverture|page vide|blanche|aucun contenu|non identifiable|indéterminé|غلاف', re.I)

def kind(d):
    if d.get('pageType'): return d['pageType']
    g = d.get('topicGuess', '')
    if not d['items'] or COVER.search(g): return 'cover'
    ans = sum(i['kind'] == 'answer' for i in d['items'])
    if CORR.search(g) or ans >= max(2, len(d['items']) / 2): return 'correction'
    if EXAM.search(g): return 'exam'
    return 'exercise'

def rng(ps):
    ps = sorted(ps); out = []; s = p = ps[0]
    for x in ps[1:]:
        if x == p + 1: p = x; continue
        out.append(f'{s}-{p}' if p > s else str(s)); s = p = x
    out.append(f'{s}-{p}' if p > s else str(s))
    return ', '.join(out)

NAMES = {'exam': 'Examens / évaluations', 'exercise': 'Exercices', 'correction': 'Corrections', 'cover': 'Pages de garde / vides'}
LINKS = json.loads((A / 'exam_links.json').read_text(encoding='utf-8')) if (A / 'exam_links.json').exists() else []
books = []; tot = collections.Counter(); selfc = collections.Counter()
for bj in sorted(A.glob('*/book.json')):
    b = json.loads(bj.read_text(encoding='utf-8')); clean = collections.defaultdict(list); rest = collections.defaultdict(list)
    for pf in sorted(bj.parent.glob('pages/*.json')):
        d = json.loads(pf.read_text(encoding='utf-8'))
        if d.get('selfContained'): selfc[b['book']] += 1
        if d['linkStatus'] == 'clean': clean[(d['topicId'], d['topicTitle'])].append(d['page'])
        else:
            k = kind(d); rest[k].append(d['page']); tot[k] += 1
    tot['clean'] += sum(len(v) for v in clean.values()); books.append((b, clean, rest))

L = ['# Archive parascolaire (privée, ne jamais publier)', '',
     'OCR par page (Claude Sonnet 5.5) des manuels commerciaux, utilisé uniquement comme source de modèles pour l\'IA. Le contenu des livres n\'est jamais republié tel quel.', '',
     '## Organisation', '```', 'parascolaire/', '  <niveau>/…/<livre>.pdf          PDF source (local, ignoré par git)',
     '  _archive/<livre>/book.json     métadonnées du livre', '  _archive/<livre>/pages/NNN.json  une page OCR (items, topicId, linkStatus, linkFlags)',
     '  _archive/index_clean.jsonl     pages liées au programme officiel', '  _archive/index_parked.jsonl    pages en attente', '  _archive/CATALOG.md            catalogue par classe > matière > thème (244 thèmes), à utiliser comme source d’idées',
     '  _archive/catalog.jsonl         même catalogue, une ligne par page (tags, formats, mots-clés, ideaNote)',
     '  _archive/_blank/<livre>/       pages vides ou de couverture écartées (récupérables)', '```', '',
     '## Deux catégories', '',
     '- **Propre (`linkStatus: clean`)**: page rattachée à un chapitre officiel (topicId) avec confiance >= 0.8 et sans alerte OCR. Seules ces pages sont utilisables pour l\'ancrage par chapitre.',
     '- **En attente (`parked`)**: examens, exercices, corrigés ou pages sans chapitre précis. Elles sont organisées ci-dessous par type, pas par chapitre.', '',
     f"**Total: {sum(tot.values())} pages: {tot['clean']} propres, {tot['exam']} examens, {tot['exercise']} exercices, {tot['correction']} corrections, {tot['cover']} pages de garde/vides.**", '']
GS = collections.defaultdict(collections.Counter)
for pf in A.glob('*/pages/*.json'):
    d = json.loads(pf.read_text(encoding='utf-8')); g = d['grade']; t = d.get('pageType') or d.get('tags', {}).get('pageType')
    GS[g]['pages'] += 1; GS[g]['p_' + str(t)] += 1
    if t == 'exam': GS[g]['ec' if d.get('correctionStatus') in ('linked', 'self_contained') else 'en'] += 1
    for i in d['items']:
        if i['kind'] == 'lesson': GS[g]['li'] += 1
EXF = A / 'exercises.jsonl'
if EXF.exists():
    for ln in EXF.read_text(encoding='utf-8').splitlines():
        r = json.loads(ln)
        if r['kind'] == 'exercise': GS[r['grade']]['ex'] += 1; GS[r['grade']]['ex_' + r['tier']] += 1
L += ['## Vue d’ensemble par classe', '',
      '| Classe | Pages | Pages de cours | Items de cours | Pages d’exercices | Pages mixtes | Examens | Examens avec corrigé | Examens sans corrigé | Exercices | Prêts | À auditer | Écartés |', '|---|---|---|---|---|---|---|---|---|---|---|---|---|']
TT = collections.Counter()
for g in sorted(GS, key=lambda x: int(x[0])):
    c = GS[g]; TT.update(c)
    L.append(f"| {g} | {c['pages']} | {c['p_lesson']} | {c['li']} | {c['p_exercise']} | {c['p_mixed']} | {c['p_exam']} | {c['ec']} | {c['en']} | {c['ex']} | {c['ex_ready']} | {c['ex_pending_audit']} | {c['ex_shelved']} |")
c = TT; L.append(f"| **Total** | **{c['pages']}** | **{c['p_lesson']}** | **{c['li']}** | **{c['p_exercise']}** | **{c['p_mixed']}** | **{c['p_exam']}** | **{c['ec']}** | **{c['en']}** | **{c['ex']}** | **{c['ex_ready']}** | **{c['ex_pending_audit']}** | **{c['ex_shelved']}** |")
L += ['', 'Les exercices ne comptent que les items de type exercice; `exercises.jsonl` contient aussi les items de cours. Prêts = contrôlés ou vérifiés; À auditer = jamais contrôlés; Écartés = mauvaise qualité de scan.', '']
for b, clean, rest in books:
    L += [f"## {b['title']}", f"{b['grade']} · {b['subject']} · {b['totalPages']} pages · `{b['book']}`", '']
    if clean:
        L += ['**Propres, par chapitre officiel**', '', '| topicId | Chapitre | Pages |', '|---|---|---|']
        for (tid, t), ps in sorted(clean.items()): L.append(f'| {tid} | {t} | {rng(ps)} |')
        L.append('')
    if rest:
        L += ['**En attente, par type**', '', '| Type | Pages |', '|---|---|']
        for k in ('exam', 'exercise', 'correction', 'cover'):
            if rest[k]: L.append(f'| {NAMES[k]} | {rng(rest[k])} |')
        L.append('')
    bl = [x for x in LINKS if x['book'] == b['book']]
    good = [x for x in bl if float(x.get('confidence', 0)) >= 0.8]
    if bl or selfc[b['book']]:
        L += [f"**Énoncés → corrigés**: {len(good)} liaisons sûres, {len(bl) - len(good)} en attente, {selfc[b['book']]} pages avec énoncé et corrigé ensemble", '']
        if good:
            L += ['| Énoncé (pages) | Corrigé (pages) | Confiance |', '|---|---|---|']
            for x in good: L.append(f"| {rng(x['statementPages'])} | {rng(x['correctionPages'])} | {x['confidence']} |")
            L.append('')
L += ["## Champs d'une page (`pages/NNN.json`)", '',
      '| Champ | Sens |', '|---|---|',
      '| `items[]` | exercices, leçons et réponses: `kind`, `number`, `instruction`, `body`, `figureDesc`, `answer`, `confidence`, `formatGuess`, `difficultyGuess` |',
      '| `topicId`, `topicTitle`, `topicConfidence`, `topicReason` | chapitre officiel choisi par Claude (null si aucun) |',
      '| `topicIdPrev`, `topicPrevAuto` | anciens liens automatiques, gardés pour mémoire |',
      '| `linkStatus` | `clean` ou `parked` |',
      '| `linkFlags` | raisons de mise en attente: `no_topic`, `uncertain_topic`, `low_ocr_confidence`, `no_items`, `garbled_chars`, `classify_failed` |',
      '| `tags` | `subject`, `theme`, `themeGroup`, `skill`, `pageType`, `formats`, `keywords`, `ideaValue`, `ideaNote` |',
      '| `pageType` | `exam`, `exercise` ou `correction` (rempli à la main pour 6 pages, sinon déduit à la génération du README) |',
      '| `correctionPages` / `correctionOf` | liaison énoncé ↔ corrigé (confiance >= 0.8) |',
      '| `selfContained` | énoncé et corrigé sur la même page |', '',
      '## Scripts', '',
      '| Script | Rôle |', '|---|---|',
      '| `scripts/ingest_parascolaire_claude.py` | OCR page par page avec Claude Sonnet 5.5 (980 pages, environ 22 $) |',
      '| `scripts/relink_archive.py` | premier lien programme hors ligne (remplacé par le suivant) |',
      '| `scripts/classify_archive_claude.py` | lien chapitre par Claude, statut clean/parked (environ 8 $) |',
      '| `scripts/tag_archive_claude.py` | étiquettes par page: matière, thème, compétence, type, formats, mots-clés, valeur d’idée (environ 5 $) |',
      '| `scripts/consolidate_themes.py` | regroupe les thèmes libres en thèmes canoniques par classe et matière (environ 0,4 $) |',
      '| `scripts/build_catalog.py` | génère `CATALOG.md` et `catalog.jsonl` |',
      '| `scripts/link_exams_corrections.py` | liaison énoncés ↔ corrigés par livre (environ 0,3 $) |',
      '| `scripts/build_archive_readme.py` | régénère ce README |', '',
      '## Pages écartées', '', f"{sum(1 for _ in A.glob('_blank/*/*.json'))} pages vides ou de couverture déplacées dans `_archive/_blank/<livre>/` (récupérables). Les 6 pages à vrai contenu classées à tort comme couvertures ont été reclassées.", '']
QC = collections.Counter(); QB = collections.defaultdict(list)
for pf in A.glob('*/pages/*.json'):
    d = json.loads(pf.read_text(encoding='utf-8')); q = d.get('quality', {}); QC[q.get('status', 'unaudited')] += 1
    if isinstance(q.get('accuracy'), (int, float)): QB[d['book']].append(q['accuracy'])
L += ['## Qualité OCR (audit)', '',
      'Contrôle de la transcription par Claude Sonnet 5.5 en comparant l’image de la page à son texte OCR. Premier passage rapide (effort bas) sur 383 pages tirées au hasard, puis second passage approfondi (effort élevé, 200 DPI) sur les pages signalées.', '',
      '| Statut | Pages |', '|---|---|']
for k, lab in (('verified', 'Vérifiées au second passage, texte correct'), ('corrected', 'Texte corrigé (ancien texte gardé dans `itemsOcr1`)'), ('sampled_ok', 'Échantillon correct au premier passage'), ('recheck_pending', 'Signalées au premier passage, second passage à faire plus tard'), ('audit_pending', 'À auditer plus tard (jamais contrôlées)'), ('poor', 'Mauvaise qualité du scan, mises en attente (`poor_scan`)'), ('unaudited', 'Non auditées')):
    if QC[k]: L.append(f'| {lab} | {QC[k]} |')
L += ['', '**Règles appliquées**', '',
      '- Précision >= 0.90 après second passage: texte corrigé adopté, page jugée fiable.',
      '- 0.75 à 0.89: texte corrigé adopté, marquée comme à relire.',
      '- Moins de 0.75: page mise en attente (`poor_scan`) avec son énoncé ou son corrigé associé (`partner_parked`), afin de ne jamais garder un énoncé sans corrigé ni l’inverse.',
      '- `manual_queue.json` liste les pages trop faibles, à reprendre à la main si besoin.', '',
      '**Précision moyenne par livre (pages auditées)**', '', '| Livre | Pages auditées | Précision moyenne |', '|---|---|---|']
for b, v in sorted(QB.items(), key=lambda kv: sum(kv[1]) / len(kv[1])): L.append(f'| {b} | {len(v)} | {sum(v) / len(v):.2f} |')
L += ['', '**Limites**: le contrôleur est le même modèle que l’OCR; les pages non auditées (environ 55 %) n’ont aucune garantie mesurée; les pourcentages viennent du modèle, pas d’une relecture humaine.', '']
EX = collections.defaultdict(lambda: collections.defaultdict(list))
for pf in A.glob('*/pages/*.json'):
    d = json.loads(pf.read_text(encoding='utf-8'))
    if d.get('correctionStatus'): EX[d['book']][d['correctionStatus']].append(d['page'])
L += ['## Examens et corrigés', '',
      'Chaque page d’examen porte `correctionStatus`: `linked` (corrigé lié, voir `correctionPages`), `self_contained` (réponses sur la même page) ou `no_correction_yet` (aucun corrigé trouvé dans les livres; la page reste dans l’archive, non mise en attente).', '',
      '| Livre | Avec corrigé | Réponses sur la page | Sans corrigé (pour l’instant) |', '|---|---|---|---|']
tl = ts = tn = 0
for b, v in sorted(EX.items()):
    l, sc, n = len(v['linked']), len(v['self_contained']), len(v['no_correction_yet']); tl += l; ts += sc; tn += n
    L.append(f"| {b} | {l} | {sc} | {n}" + (f" (p. {rng(v['no_correction_yet'])})" if n else '') + ' |')
L += [f'| **Total** | **{tl}** | **{ts}** | **{tn}** |', '']
L += ['## Limites connues', '',
      '- Le référentiel contient 147 chapitres (pas de grammaire/conjugaison française, production écrite, etc.): ces pages restent en attente faute de chapitre.',
      '- Seulement 4 pages ont été comparées visuellement au scan; le reste repose sur l\'audit automatique et la confiance du modèle.',
      '- Les liaisons énoncé ↔ corrigé ne sont vérifiées que par l IA et par 6 contrôles manuels; certaines (ex. Math Solutions 73-74 → 126) sont approximatives.',
      '- Le type (examen/exercice/correction) est déduit du titre de page et des items, sans vérification manuelle.']
Path('parascolaire/README.md').write_text('\n'.join(L), encoding='utf-8')
print(tot)
