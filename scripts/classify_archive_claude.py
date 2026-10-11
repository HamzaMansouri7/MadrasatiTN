"""LLM topic linking for archive pages. Text only. Marks each page linkStatus=clean|parked."""
import argparse, json, os, re, sys, threading, time, urllib.error, urllib.request, glob
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from dotenv import load_dotenv

sys.stdout.reconfigure(encoding='utf-8')
load_dotenv()
KEY = os.getenv('ANTHROPIC_API_KEY', '').strip().strip('"').strip("'")
MODEL = 'claude-sonnet-5-5'
CUR = Path('src/app/core/data/curriculum-chapters.data.ts')
chapters = json.loads(re.search(r'TUNISIAN_CURRICULUM_CHAPTERS:\s*CurriculumChapter\[\]\s*=\s*(\[[\s\S]*?\]);', CUR.read_text(encoding='utf-8')).group(1))
lock = threading.Lock(); use = {'i': 0, 'o': 0, 'n': 0, 'fail': 0}

def prompt(d, grade):
    chs = '\n'.join(f"- {c['id']} | {c['subject']} | {c['trimester']} | {c['titleFr']} | {c['keyCompetencyFr']}" for c in chapters if c['grade'] == grade)
    items = '\n'.join(f"[{i.get('number','')}] {(i.get('instruction') or '')[:200]} {(i.get('body') or '')[:350]}" for i in d['items'][:8])
    return f"""Page d'un manuel parascolaire tunisien ({grade}). Sujet deviné par l'OCR: {d.get('topicGuess','')}
Contenu:
{items}

Chapitres officiels de {grade} (id | matière | trimestre | titre | compétence):
{chs}

Choisis le chapitre officiel qui correspond exactement au contenu de cette page. Règles strictes:
- Identifie d'abord la matière réelle de la page (le manuel peut mélanger les matières).
- Si la page est un examen / une évaluation générale couvrant plusieurs chapitres, une page de garde, ou si aucun chapitre ne correspond clairement: topicId null.
- confidence: 0.9+ seulement si le contenu relève sans ambiguïté de ce chapitre; sinon <0.8.
Réponds uniquement en JSON: {{"subject":"...","topicId":"id ou null","confidence":0.0,"reason":"une phrase en français"}}"""

def call(p):
    body = json.dumps({'model': MODEL, 'max_tokens': 400, 'output_config': {'effort': 'low'}, 'messages': [{'role': 'user', 'content': p}]}).encode()
    for a in range(6):
        req = urllib.request.Request('https://api.anthropic.com/v1/messages', data=body, method='POST', headers={'x-api-key': KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json'})
        try:
            with urllib.request.urlopen(req, timeout=120) as r:
                data = json.loads(r.read())
            t = ''.join(b.get('text', '') for b in data['content'] if b.get('type') == 'text')
            with lock:
                use['i'] += data['usage']['input_tokens']; use['o'] += data['usage']['output_tokens']
            return json.loads(t[t.find('{'):t.rfind('}') + 1])
        except urllib.error.HTTPError as e:
            if e.code in (429, 500, 502, 503, 529): time.sleep(2 ** a); continue
            raise
        except (json.JSONDecodeError, urllib.error.URLError, TimeoutError):
            time.sleep(2)
    raise RuntimeError('retries')

def work(pf, grade):
    d = json.loads(pf.read_text(encoding='utf-8'))
    if d.get('linkStatus'):
        return
    txt = json.dumps(d['items'], ensure_ascii=False)
    flags = []
    if not d['items']: flags.append('no_items')
    if '�' in txt: flags.append('garbled_chars')
    cs = [i.get('confidence', 1) for i in d['items'] if isinstance(i.get('confidence'), (int, float))]
    if cs and min(cs) < 0.6: flags.append('low_ocr_confidence')
    try:
        r = call(prompt(d, grade)) if d['items'] else {'topicId': None, 'confidence': 0, 'reason': 'page sans contenu', 'subject': ''}
    except Exception as e:
        with lock: use['fail'] += 1
        print('ERR', pf, e, flush=True); return
    valid = {c['id'] for c in chapters if c['grade'] == grade}
    tid = r.get('topicId') if r.get('topicId') in valid else None
    conf = float(r.get('confidence') or 0)
    d['topicPrevAuto'] = {'topicId': d.get('topicId'), 'confidence': d.get('topicConfidence')}
    d['topicId'] = tid; d['topicConfidence'] = conf; d['topicSubject'] = r.get('subject', ''); d['topicReason'] = r.get('reason', '')
    ch = next((c for c in chapters if c['id'] == tid), None)
    d['topicTitle'] = (ch['titleFr'] if ch else '')
    for i in d['items']: i['topicId'] = tid
    if not tid: flags.append('no_topic')
    elif conf < 0.8: flags.append('uncertain_topic')
    d['linkFlags'] = flags
    d['linkStatus'] = 'clean' if not flags else 'parked'
    pf.write_text(json.dumps(d, ensure_ascii=False, indent=2), encoding='utf-8')
    with lock:
        use['n'] += 1
        print(f"{pf.parent.parent.name} {pf.stem} {d['linkStatus']} {tid} {conf} ${use['i']*2/1e6+use['o']*10/1e6:.2f}", flush=True)

if __name__ == '__main__':
    ap = argparse.ArgumentParser(); ap.add_argument('--limit', type=int); ap.add_argument('--workers', type=int, default=6); a = ap.parse_args()
    jobs = []
    for bj in sorted(glob.glob('parascolaire_frozen/_archive/*/book.json')):
        g = json.loads(Path(bj).read_text(encoding='utf-8'))['grade']
        jobs += [(pf, g) for pf in sorted(Path(bj).parent.glob('pages/*.json'))]
    if a.limit: jobs = jobs[::max(1, len(jobs) // a.limit)][:a.limit]
    with ThreadPoolExecutor(a.workers) as ex:
        list(ex.map(lambda j: work(*j), jobs))
    print('DONE', use)
