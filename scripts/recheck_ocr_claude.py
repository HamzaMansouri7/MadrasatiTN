"""High-effort re-check of pages the first audit flagged needs_fix. Stores audit2 + itemsCorrected (OCR items untouched)."""
import base64, json, sys, threading, time, urllib.request, urllib.error
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import fitz
sys.path.insert(0, 'scripts')
from audit_ocr_claude import KEY, A
from dotenv import load_dotenv
sys.stdout.reconfigure(encoding='utf-8')
lock = threading.Lock(); use = {'i': 0, 'o': 0, 'n': 0, 'fail': 0}; BUDGET = 13.0
cost = lambda: use['i'] * 2 / 1e6 + use['o'] * 10 / 1e6

def call(img, p):
    body = json.dumps({'model': 'claude-sonnet-5-5', 'max_tokens': 16000, 'output_config': {'effort': 'high'}, 'messages': [{'role': 'user', 'content': [
        {'type': 'image', 'source': {'type': 'base64', 'media_type': 'image/jpeg', 'data': base64.b64encode(img).decode()}}, {'type': 'text', 'text': p}]}]}).encode()
    for a in range(5):
        req = urllib.request.Request('https://api.anthropic.com/v1/messages', data=body, method='POST', headers={'x-api-key': KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json'})
        try:
            with urllib.request.urlopen(req, timeout=600) as r: data = json.loads(r.read())
            if data.get('stop_reason') == 'max_tokens': raise json.JSONDecodeError('trunc', '', 0)
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
    if d.get('audit2'): return
    img = fitz.open(pdf)[d['page'] - 1].get_pixmap(dpi=200).tobytes('jpeg')
    ocr = json.dumps([{k: i.get(k) for k in ('kind', 'number', 'instruction', 'body', 'figureDesc', 'answer')} for i in d['items']], ensure_ascii=False)
    first = '; '.join(f"{e.get('type')}: {e.get('detail')}" for e in d['audit'].get('errors', [])[:8])
    p = f"""Voici l'image d'une page scannée de manuel parascolaire tunisien et sa transcription OCR (JSON). Un premier contrôle rapide a signalé: {first}
Vérifie soigneusement chaque item contre l'image (mots, voyelles visibles, chiffres, ordre, exercices manquants, texte inventé). Ne confirme une erreur que si tu la vois clairement dans l'image. Recopie fidèlement, sans rien inventer; si un passage est illisible dans le scan, garde [illisible].
Réponds uniquement en JSON: {{"accuracy": 0.0-1.0, "verdict": "ok|minor_issues|needs_fix", "confirmedErrors":[{{"type":"...","severity":"minor|major","detail":"..."}}], "itemsCorrected": [liste complète des items corrigés, mêmes champs kind/number/instruction/body/figureDesc/answer] ou null si la transcription est déjà correcte}}
Transcription:
{ocr}"""
    try: r = call(img, p)
    except Exception:
        with lock: use['fail'] += 1
        print('ERR', pf, flush=True); return
    d['audit2'] = {k: r.get(k) for k in ('accuracy', 'verdict', 'confirmedErrors')}
    if r.get('itemsCorrected'): d['itemsCorrected'] = r['itemsCorrected']
    pf.write_text(json.dumps(d, ensure_ascii=False, indent=2), encoding='utf-8')
    with lock:
        use['n'] += 1; print(pf.parent.parent.name, pf.stem, d['audit']['verdict'], '->', r.get('verdict'), r.get('accuracy'), f'${cost():.2f}', flush=True)

if __name__ == '__main__':
    pdfs = {bj.parent.name: Path('parascolaire') / json.loads(bj.read_text(encoding='utf-8'))['sourceFile'] for bj in A.glob('*/book.json')}
    jobs = []
    for pf in sorted(A.glob('*/pages/*.json')):
        d = json.loads(pf.read_text(encoding='utf-8'))
        if (d.get('audit') or {}).get('verdict') == 'needs_fix' and 0.7 <= (d['audit'].get('accuracy') or 0) <= 0.9: jobs.append((pf, pdfs[pf.parent.parent.name]))
    print(len(jobs), 'pages to recheck', flush=True)
    with ThreadPoolExecutor(10) as ex: list(ex.map(work, jobs))
    print('DONE', use, f'${cost():.2f}')
