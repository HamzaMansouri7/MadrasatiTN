"""Coverage of official chapters by clean archive pages, per grade+subject and per book. Exams with multi-chapter scope are excluded from the penalty."""
import json, re, sys, collections
from pathlib import Path
sys.stdout.reconfigure(encoding='utf-8')
A = Path('parascolaire_frozen/_archive')
ch = json.loads(re.search(r'TUNISIAN_CURRICULUM_CHAPTERS:\s*CurriculumChapter\[\]\s*=\s*(\[[\s\S]*?\]);', Path('src/app/core/data/curriculum-chapters.data.ts').read_text(encoding='utf-8')).group(1))
byid = {c['id']: c for c in ch}; cov = collections.defaultdict(lambda: collections.defaultdict(set)); pages = collections.Counter(); multi = collections.Counter(); nochap = collections.Counter(); book_rows = {}
for pf in sorted(A.glob('*/pages/*.json')):
    d = json.loads(pf.read_text(encoding='utf-8')); g = d['grade']; sub = d.get('tags', {}).get('subject', '')
    t = d.get('pageType') or d.get('tags', {}).get('pageType'); b = d['book']
    br = book_rows.setdefault(b, collections.Counter()); br['pages'] += 1
    if d['linkStatus'] == 'clean' and d.get('topicId') in byid:
        cov[byid[d['topicId']]['grade']][d['topicId']].add(b); br['clean'] += 1
    elif t == 'exam' and d.get('examScope') in ('trimester', 'full_year', 'short_test', 'exam_part'): br['multi_exam'] += 1; multi[g] += 1
    else: br['unlinked'] += 1; nochap[(g, sub)] += 1
L = ['# Couverture du programme officiel par l’archive (pages propres)', '', 'Un chapitre est couvert s’il a au moins une page propre liée. Les examens multi-chapitres (trimestre, fin d’année, contrôle court, page d’examen) ne sont pas comptés comme non classés.', '']
L += ['## Par classe et matière', '', '| Classe | Matière | Chapitres officiels | Couverts | % | Chapitres sans page propre |', '|---|---|---|---|---|---|']
tot = cov_n = 0
for g in sorted({c['grade'] for c in ch}, key=lambda x: int(x[0])):
    for s in sorted({c['subject'] for c in ch if c['grade'] == g}):
        cs = [c for c in ch if c['grade'] == g and c['subject'] == s]; got = [c for c in cs if c['id'] in cov[g]]
        miss = [c['id'] for c in cs if c['id'] not in cov[g]]; tot += len(cs); cov_n += len(got)
        L.append(f"| {g} | {s} | {len(cs)} | {len(got)} | {100 * len(got) // len(cs)}% | {', '.join(miss) or '-'} |")
L += [f'| **Total** | | **{tot}** | **{cov_n}** | **{100 * cov_n // tot}%** | |', '', '## Par livre', '', '| Livre | Pages | Propres | Examens multi-chapitres | Sans chapitre |', '|---|---|---|---|---|']
for b, c in sorted(book_rows.items()): L.append(f"| {b} | {c['pages']} | {c['clean']} | {c['multi_exam']} | {c['unlinked']} |")
(A / 'COVERAGE.md').write_text('\n'.join(L), encoding='utf-8'); print('\n'.join(L[4:4 + 3 + 30]))
