"""Pair exam/exercise pages with their correction pages per book (LLM on page summaries)."""
import json, glob, re, os, sys, time, urllib.request, urllib.error
from pathlib import Path
from dotenv import load_dotenv
sys.stdout.reconfigure(encoding='utf-8'); load_dotenv()
KEY = os.getenv('ANTHROPIC_API_KEY', '').strip().strip('"').strip("'")
A = Path('parascolaire_frozen/_archive'); use = [0, 0]

def call(p):
    body = json.dumps({'model': 'claude-sonnet-5-5', 'max_tokens': 8000, 'output_config': {'effort': 'medium'}, 'messages': [{'role': 'user', 'content': p}]}).encode()
    for a in range(5):
        req = urllib.request.Request('https://api.anthropic.com/v1/messages', data=body, method='POST', headers={'x-api-key': KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json'})
        try:
            with urllib.request.urlopen(req, timeout=300) as r: data = json.loads(r.read())
            t = ''.join(b.get('text', '') for b in data['content'] if b.get('type') == 'text')
            use[0] += data['usage']['input_tokens']; use[1] += data['usage']['output_tokens']
            return json.loads(t[t.find('{'):t.rfind('}') + 1])
        except (urllib.error.HTTPError, urllib.error.URLError, json.JSONDecodeError, TimeoutError) as e:
            time.sleep(2 ** a)
    raise RuntimeError('retries')

allpairs = []
for bj in sorted(A.glob('*/book.json')):
    book = bj.parent.name; rows = []; files = {}
    for pf in sorted(bj.parent.glob('pages/*.json')):
        d = json.loads(pf.read_text(encoding='utf-8')); files[d['page']] = (pf, d)
        its = d['items']; na = sum(i['kind'] == 'answer' or bool(i.get('answer')) for i in its)
        first = ' | '.join(f"{i.get('number','')} {(i.get('instruction') or i.get('body') or '')[:60]}" for i in its[:3]).replace('\n', ' ')
        rows.append(f"p{d['page']} [{d.get('pageType') or d['linkStatus']}] answers={na}/{len(its)} :: {d['topicGuess'][:110]} :: {first}")
    if not any('answers=0/' not in r and not re.search(r'answers=0/', r) for r in rows):
        print(book, 'no answers, skipped'); continue
    p = f"""Livre parascolaire tunisien « {book} ». Résumé de chaque page (numéro, type, nombre d'items corrigés/réponses, titre, premiers items):
{chr(10).join(rows)}

Tâche: associe chaque page de CORRECTION (corrigé, solutions, barème) à la ou aux pages d'ÉNONCÉ (examen, épreuve, exercices) qu'elle corrige, dans ce même livre. Utilise le titre, le numéro d'examen/semaine/situation, la matière et les numéros de questions. Ne devine pas: si l'énoncé correspondant n'est pas clairement identifiable (ou absent du livre), mets confidence < 0.8.
Une page peut contenir à la fois énoncé et corrigé (answers>0): dans ce cas "selfContained": true, sans paire.
Réponds uniquement en JSON: {{"pairs":[{{"statementPages":[int],"correctionPages":[int],"confidence":0.0,"reason":"une phrase"}}],"selfContained":[int]}}"""
    r = call(p); print(book, len(r.get('pairs', [])), 'pairs', len(r.get('selfContained', [])), 'self', f'${use[0]*2/1e6+use[1]*10/1e6:.2f}', flush=True)
    for pr in r.get('pairs', []):
        pr['book'] = book; allpairs.append(pr)
        if float(pr.get('confidence', 0)) >= 0.8:
            for s in pr['statementPages']:
                if s in files: files[s][1].setdefault('correctionPages', []); files[s][1]['correctionPages'] = sorted(set(files[s][1]['correctionPages'] + pr['correctionPages']))
            for c in pr['correctionPages']:
                if c in files: files[c][1]['correctionOf'] = sorted(set(files[c][1].get('correctionOf', []) + pr['statementPages']))
    for p_ in r.get('selfContained', []):
        if p_ in files: files[p_][1]['selfContained'] = True
    for pf, d in files.values(): pf.write_text(json.dumps(d, ensure_ascii=False, indent=2), encoding='utf-8')
(A / 'exam_links.json').write_text(json.dumps(allpairs, ensure_ascii=False, indent=2), encoding='utf-8')
good = [x for x in allpairs if float(x.get('confidence', 0)) >= 0.8]
print('pairs', len(allpairs), 'confident', len(good), 'parked', len(allpairs) - len(good), f'${use[0]*2/1e6+use[1]*10/1e6:.2f}')
