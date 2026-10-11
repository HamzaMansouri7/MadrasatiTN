"""Map free-form page themes to ~10-20 canonical themes per grade+subject (stored as tags.themeGroup)."""
import json, os, sys, time, urllib.request, urllib.error, collections
from pathlib import Path
from dotenv import load_dotenv
sys.stdout.reconfigure(encoding='utf-8'); load_dotenv()
KEY = os.getenv('ANTHROPIC_API_KEY', '').strip().strip('"').strip("'"); use = [0, 0]
A = Path('parascolaire/_original_frozen/_archive')

def call(p):
    body = json.dumps({'model': 'claude-sonnet-5-5', 'max_tokens': 16000, 'output_config': {'effort': 'medium'}, 'messages': [{'role': 'user', 'content': p}]}).encode()
    for a in range(5):
        req = urllib.request.Request('https://api.anthropic.com/v1/messages', data=body, method='POST', headers={'x-api-key': KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json'})
        try:
            with urllib.request.urlopen(req, timeout=400) as r: data = json.loads(r.read())
            t = ''.join(b.get('text', '') for b in data['content'] if b.get('type') == 'text')
            use[0] += data['usage']['input_tokens']; use[1] += data['usage']['output_tokens']
            return json.loads(t[t.find('{'):t.rfind('}') + 1])
        except (urllib.error.HTTPError, urllib.error.URLError, json.JSONDecodeError, TimeoutError):
            time.sleep(2 ** a)
    raise RuntimeError('retries')

groups = collections.defaultdict(list)
for pf in sorted(A.glob('*/pages/*.json')):
    d = json.loads(pf.read_text(encoding='utf-8'))
    if d.get('tags'): groups[(d['grade'], d['tags']['subject'])].append((pf, d))
for (g, s), items in sorted(groups.items()):
    themes = sorted({d['tags']['theme'] for _, d in items})
    p = f"""Classe: {g}. Matière: {s}. Voici {len(themes)} thèmes libres issus de pages de manuels parascolaires tunisiens:
{chr(10).join('- ' + t for t in themes)}

Regroupe-les en 8 à 18 thèmes canoniques (noms courts en français, ordre logique du programme, ex: 'Numération jusqu\'à 999', 'Fractions', 'Le texte narratif', 'Grammaire: le verbe'). Chaque thème libre doit être assigné à exactement un thème canonique; utilise 'Divers' seulement si rien ne convient.
Réponds uniquement en JSON: {{"canonical": ["..."], "map": {{"thème libre": "thème canonique"}}}}"""
    r = call(p); m = r['map']; ok = 0
    for pf, d in items:
        d['tags']['themeGroup'] = m.get(d['tags']['theme']) or 'Divers'; ok += d['tags']['theme'] in m
        pf.write_text(json.dumps(d, ensure_ascii=False, indent=2), encoding='utf-8')
    print(g, s, len(themes), '->', len(set(m.values())), f'mapped {ok}/{len(items)}', f'${use[0]*2/1e6+use[1]*10/1e6:.2f}', flush=True)
