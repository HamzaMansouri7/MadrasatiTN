"""Tag every archive page with normalized subject/theme/type/skills/keywords (text only)."""
import argparse, json, os, sys, threading, time, urllib.request, urllib.error, glob
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from dotenv import load_dotenv
sys.stdout.reconfigure(encoding='utf-8'); load_dotenv()
KEY = os.getenv('ANTHROPIC_API_KEY', '').strip().strip('"').strip("'")
lock = threading.Lock(); use = {'i': 0, 'o': 0, 'n': 0, 'fail': 0}
SUBJECTS = ['Mathématiques', 'Arabe', 'Français', 'Éveil scientifique', 'Histoire-Géographie', 'Éducation islamique', 'Éducation civique', 'Autre']

def prompt(d):
    items = '\n'.join(f"[{i.get('kind')}|{i.get('number','')}] {(i.get('instruction') or '')[:180]} {(i.get('body') or '')[:260]}" for i in d['items'][:10])
    return f"""Page d'un manuel parascolaire tunisien, {d['grade']}. Titre deviné: {d.get('topicGuess','')}
Contenu:
{items}

Classe cette page pour une bibliothèque de sources d'idées (exercices, examens, infographies). Réponds uniquement en JSON:
{{"subject": un de {SUBJECTS},
 "theme": "thème précis en français, 2 à 6 mots, normalisé (ex: 'Fractions et pourcentages', 'Le texte narratif', 'La respiration')",
 "skill": "compétence visée en une phrase courte en français",
 "pageType": "exam | exercise | lesson | correction | mixed",
 "formats": ["qcm|vrai_faux|appariement|texte_a_trous|calcul|probleme|production_ecrite|lecture_comprehension|dictee|schema_tableau|autre"],
 "keywords": ["3 à 6 mots-clés en français"],
 "ideaValue": "high | medium | low (richesse comme source d'idées originales)",
 "ideaNote": "une phrase: ce qui est réutilisable comme idée (type de situation, format, contexte), sans recopier le texte"}}"""

def call(p):
    body = json.dumps({'model': 'claude-sonnet-5-5', 'max_tokens': 700, 'output_config': {'effort': 'low'}, 'messages': [{'role': 'user', 'content': p}]}).encode()
    for a in range(6):
        req = urllib.request.Request('https://api.anthropic.com/v1/messages', data=body, method='POST', headers={'x-api-key': KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json'})
        try:
            with urllib.request.urlopen(req, timeout=120) as r: data = json.loads(r.read())
            t = ''.join(b.get('text', '') for b in data['content'] if b.get('type') == 'text')
            with lock: use['i'] += data['usage']['input_tokens']; use['o'] += data['usage']['output_tokens']
            return json.loads(t[t.find('{'):t.rfind('}') + 1])
        except (urllib.error.HTTPError, urllib.error.URLError, json.JSONDecodeError, TimeoutError):
            time.sleep(2 ** a)
    raise RuntimeError('retries')

def work(pf):
    d = json.loads(pf.read_text(encoding='utf-8'))
    if d.get('tags') or not d['items']: return
    try: t = call(prompt(d))
    except Exception as e:
        with lock: use['fail'] += 1
        print('ERR', pf, flush=True); return
    if t.get('subject') not in SUBJECTS: t['subject'] = 'Autre'
    d['tags'] = t
    pf.write_text(json.dumps(d, ensure_ascii=False, indent=2), encoding='utf-8')
    with lock:
        use['n'] += 1; print(pf.parent.parent.name, pf.stem, t['subject'], '|', t['theme'], f"${use['i']*2/1e6+use['o']*10/1e6:.2f}", flush=True)

if __name__ == '__main__':
    ap = argparse.ArgumentParser(); ap.add_argument('--limit', type=int); ap.add_argument('--workers', type=int, default=6); a = ap.parse_args()
    fs = sorted(Path('parascolaire/_original_frozen/_archive').glob('*/pages/*.json'))
    if a.limit: fs = fs[::max(1, len(fs) // a.limit)][:a.limit]
    with ThreadPoolExecutor(a.workers) as ex: list(ex.map(work, fs))
    print('DONE', use)
