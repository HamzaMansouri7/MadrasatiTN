"""Re-link archive pages to curriculum topicIds: grade fixed per book, subject inferred per page."""
import json, re, glob, sys, collections, unicodedata
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8')
CUR = Path('src/app/core/data/curriculum-chapters.data.ts')
chapters = json.loads(re.search(r'TUNISIAN_CURRICULUM_CHAPTERS:\s*CurriculumChapter\[\]\s*=\s*(\[[\s\S]*?\]);', CUR.read_text(encoding='utf-8')).group(1))
STOP = set('le la les un une des de du au aux en dans sur pour par avec et ou est sont que qui ce cette ces son sa ses cours exercices exercice leçon activité évaluation page note la relève malgré matière indiquée في من إلى على عن مع و ثم أو هذا هذه الذي التي كل تمارين درس تقييم وضعية محطة تقويم اختبار الثلاثي السنة'.split())

def norm(t):
    t = unicodedata.normalize('NFKD', t.lower())
    t = re.sub('[ً-ْـ]', '', t)
    t = ''.join(c for c in t if not unicodedata.combining(c))
    t = t.replace('أ', 'ا').replace('إ', 'ا').replace('آ', 'ا').replace('ى', 'ي').replace('ة', 'ه')
    return t

def toks(t):
    out = set()
    for w in re.findall(r'[a-z0-9؀-ۿ]+', norm(t)):
        if w.startswith('ال') and len(w) > 4:
            w = w[2:]
        if len(w) > 2 and w not in STOP:
            out.add(w)
    return out

for c in chapters:
    c['_t'] = toks(' '.join([c.get('titleAr', ''), c.get('titleFr', ''), c.get('keyCompetencyAr', ''), c.get('keyCompetencyFr', '')] + c.get('suggestedPromptsAr', []) + c.get('suggestedPromptsFr', [])))

def link(d, grade, book_subject):
    cands = [c for c in chapters if c['grade'] == grade] or chapters
    text = d.get('topicGuess', '') + ' ' + ' '.join(((i.get('instruction') or '') + ' ' + (i.get('body') or ''))[:400] for i in d.get('items', [])[:4])
    q = toks(d.get('topicGuess', '')); body = toks(text)
    best, bs = None, 0.0
    for c in cands:
        if not c['_t']:
            continue
        s = 2 * len(q & c['_t']) / max(len(q), 1) * 0.5 + len(body & c['_t']) / max(len(body), 1) * 2
        if norm(c.get('subject', '')) == norm(book_subject):
            s *= 1.15
        if s > bs:
            best, bs = c, s
    return best, round(min(bs, 0.99), 2)

n = collections.Counter(); changed = 0
for bj in sorted(glob.glob('parascolaire/_original_frozen/_archive/*/book.json')):
    bm = json.loads(Path(bj).read_text(encoding='utf-8'))
    for pf in sorted(Path(bj).parent.glob('pages/*.json')):
        d = json.loads(pf.read_text(encoding='utf-8'))
        if 'topicIdPrev' not in d:
            d['topicIdPrev'] = d.get('topicId'); d['topicConfidencePrev'] = d.get('topicConfidence')
        ch, sc = link(d, bm['grade'], bm['subject'])
        ok = ch is not None and sc >= 0.12
        tid = ch['id'] if ok else None
        if tid != d.get('topicId'):
            changed += 1
        d['topicId'] = tid; d['topicConfidence'] = sc if ok else 0.0
        d['topicTitle'] = (ch.get('titleFr') or ch.get('titleAr')) if ok else ''
        for i in d.get('items', []):
            i['topicId'] = tid
        pf.write_text(json.dumps(d, ensure_ascii=False, indent=2), encoding='utf-8')
        n['linked' if ok else 'unlinked'] += 1
        n['strong>=0.4' if ok and sc >= 0.4 else 'weak'] += 1
print(n, 'changed', changed)
