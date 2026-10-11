"""Audit OCR quality: Claude compares page image vs stored OCR items. Hard budget cap."""
import argparse, base64, json, os, random, sys, threading, time, urllib.request, urllib.error
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import fitz
from dotenv import load_dotenv
sys.stdout.reconfigure(encoding='utf-8'); load_dotenv()
KEY = os.getenv('ANTHROPIC_API_KEY', '').strip().strip('"').strip("'")
A = Path('parascolaire/_archive'); lock = threading.Lock(); use = {'i': 0, 'o': 0, 'n': 0, 'fail': 0}; BUDGET = 13.0
cost = lambda: use['i'] * 2 / 1e6 + use['o'] * 10 / 1e6

def call(img, p):
    body = json.dumps({'model': 'claude-sonnet-5-5', 'max_tokens': 3000, 'output_config': {'effort': 'low'}, 'messages': [{'role': 'user', 'content': [
        {'type': 'image', 'source': {'type': 'base64', 'media_type': 'image/jpeg', 'data': base64.b64encode(img).decode()}}, {'type': 'text', 'text': p}]}]}).encode()
    for a in range(5):
        req = urllib.request.Request('https://api.anthropic.com/v1/messages', data=body, method='POST', headers={'x-api-key': KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json'})
        try:
            with urllib.request.urlopen(req, timeout=300) as r: data = json.loads(r.read())
            t = ''.join(b.get('text', '') for b in data['content'] if b.get('type') == 'text')
            with lock: use['i'] += data['usage']['input_tokens']; use['o'] += data['usage']['output_tokens']
            return json.loads(t[t.find('{'):t.rfind('}') + 1])
        except (urllib.error.HTTPError, urllib.error.URLError, json.JSONDecodeError, TimeoutError):
            time.sleep(2 ** a)
    raise RuntimeError('retries')

def work(job):
    pf, pdf = job
    if cost() >= BUDGET: return
    d = json.loads(pf.read_text(encoding='utf-8'))
    if d.get('audit'): return
    img = fitz.open(pdf)[d['page'] - 1].get_pixmap(dpi=150).tobytes('jpeg')
    ocr = '\n'.join(f"[{i.get('number','')}] {i.get('instruction','')} || {i.get('body','')} || réponse: {i.get('answer')}" for i in d['items'])
    p = f"""Voici l'image d'une page scannée et sa transcription OCR ci-dessous. Vérifie la transcription contre l'image: mots arabes/français faux, voyelles (tashkeel) fausses ou absentes alors que visibles, chiffres/opérations faux, exercices ou questions manquants, texte inventé.
Transcription:
{ocr}

Réponds uniquement en JSON: {{"accuracy": 0.0-1.0 (part du contenu correctement transcrit), "errors":[{{"type":"mot|voyelle|chiffre|manquant|invente|ordre","severity":"minor|major","detail":"court, avec le mot ou nombre fautif et la bonne valeur"}}], "missingContent": true|false, "verdict":"ok|minor_issues|needs_fix"}}"""
    try: r = call(img, p)
    except Exception: 
        with lock: use['fail'] += 1
        return
    d['audit'] = r; pf.write_text(json.dumps(d, ensure_ascii=False, indent=2), encoding='utf-8')
    with lock:
        use['n'] += 1
        print(pf.parent.parent.name, pf.stem, r.get('verdict'), r.get('accuracy'), f'${cost():.2f}', flush=True)

if __name__ == '__main__':
    ap = argparse.ArgumentParser(); ap.add_argument('--n', type=int, default=300); a = ap.parse_args(); random.seed(11)
    pdfs = {}
    for bj in A.glob('*/book.json'):
        b = json.loads(bj.read_text(encoding='utf-8')); pdfs[bj.parent.name] = Path('parascolaire') / b['sourceFile']
    pages = [(pf, pdfs[pf.parent.parent.name]) for pf in sorted(A.glob('*/pages/*.json')) if pdfs[pf.parent.parent.name].exists()]
    by = {}
    for j in pages: by.setdefault(j[0].parent.parent.name, []).append(j)
    jobs = []
    for b, js in by.items():
        k = max(5, round(a.n * len(js) / len(pages))); jobs += random.sample(js, min(k, len(js)))
    random.shuffle(jobs); print(len(jobs), 'pages planned', flush=True)
    with ThreadPoolExecutor(12) as ex: list(ex.map(work, jobs))
    print('DONE', use, f'${cost():.2f}')
