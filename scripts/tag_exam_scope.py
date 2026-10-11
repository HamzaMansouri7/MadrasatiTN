"""Tag exam pages with examScope (single | trimester | full_year | unknown) and trimester number. Local, no API."""
import json, re, sys, collections
from pathlib import Path
sys.stdout.reconfigure(encoding='utf-8')
A = Path('parascolaire_frozen/_archive')
FULL = re.compile(r"annuel|سنوي|certificat de fin|fin d.études|fin des études|concours|examen régional|examen regional|session de juin|نهاية المرحلة|شهادة ختم|مناظرة|اختبار نهاية السنة|نهاية السنة", re.I)
SHORT = re.compile(r"تقويمي|مراقبة|devoir|contrôle|contrôle|évaluation|evaluation|تقييم|اختبار قصير|فرض", re.I)
PART = re.compile(r"page \d+ sur \d+|المجال الرئيسي|فرض تأليفي|partie \d", re.I)
TRI = re.compile(r"trimest|ثلاثي|الثلاثي|session de février|فيفري", re.I)
NUM = [(re.compile(r"(1er|premier|الأول|الاول|\b1\b.{0,12}trimest|trimest.{0,12}\b1\b)", re.I), 1), (re.compile(r"(2e|2ème|deuxième|الثاني|trimest.{0,12}\b2\b)", re.I), 2), (re.compile(r"(3e|3ème|troisième|الثالث|trimest.{0,12}\b3\b)", re.I), 3)]
c = collections.Counter(); by = collections.defaultdict(collections.Counter)
for pf in sorted(A.glob('*/pages/*.json')):
    d = json.loads(pf.read_text(encoding='utf-8')); t = d.get('pageType') or d.get('tags', {}).get('pageType')
    if t != 'exam': d.pop('examScope', None); d.pop('examTrimester', None); pf.write_text(json.dumps(d, ensure_ascii=False, indent=2), encoding='utf-8'); continue
    g = d.get('topicGuess', '') + ' ' + ' '.join((i.get('instruction') or '')[:80] for i in d['items'][:2])
    if FULL.search(g): sc = 'full_year'
    elif TRI.search(g): sc = 'trimester'
    elif PART.search(g): sc = 'exam_part'
    elif d['linkStatus'] == 'clean' and d.get('topicId'): sc = 'single'
    elif SHORT.search(g): sc = 'short_test'
    else: sc = 'unknown'
    tri = next((n for rx, n in NUM if sc == 'trimester' and rx.search(d.get('topicGuess', ''))), None)
    d['examScope'] = sc
    if tri: d['examTrimester'] = tri
    else: d.pop('examTrimester', None)
    pf.write_text(json.dumps(d, ensure_ascii=False, indent=2), encoding='utf-8'); c[sc] += 1; by[d['grade']][sc] += 1
print(dict(c))
for g in sorted(by): print(g, dict(by[g]))
