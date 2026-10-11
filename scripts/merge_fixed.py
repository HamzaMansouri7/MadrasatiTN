"""Merge _review/<book>_pNNN.fixed.json (external fixes) into the archive pages. Old items kept in itemsOcr1."""
import json, sys
from pathlib import Path
sys.stdout.reconfigure(encoding='utf-8')
A = Path('parascolaire/_archive')
for f in sys.argv[1:]:
    n = json.loads(Path(f).read_text(encoding='utf-8')); b, p = n['book'], n['page']; items = [i for i in n['items'] if ((i.get('body') or '') + (i.get('instruction') or '')).strip()]
    pf = A / b / 'pages' / f'{p:03d}.json'; o = json.loads(pf.read_text(encoding='utf-8'))
    o.setdefault('itemsOcr1', o['items']); confs = []
    for i, it in enumerate(items):
        base = o['items'][i] if i < len(o['items']) else {}
        it['id'] = f'{b}_p{p:03d}_i{i + 1}'; it['topicId'] = o.get('topicId')
        it['formatGuess'] = it.get('formatGuess') or base.get('formatGuess'); it['difficultyGuess'] = it.get('difficultyGuess') or base.get('difficultyGuess')
        it.setdefault('kind', base.get('kind', 'exercise')); it.setdefault('figureDesc', ''); it.setdefault('answer', None)
        if isinstance(it.get('confidence'), (int, float)): confs.append(it['confidence'])
    o['items'] = items; o['quality'] = {'status': 'hand_fixed', 'source': 'antigravity', 'accuracy': round(min(confs), 2) if confs else 0.9, 'reviewed': True}
    for x in ('poor_scan', 'low_ocr_confidence'):
        if x in o.get('linkFlags', []): o['linkFlags'].remove(x)
    pf.write_text(json.dumps(o, ensure_ascii=False, indent=2), encoding='utf-8')
    print(b, p, 'old', len(o['itemsOcr1']), 'new', len(items), o['quality']['accuracy'])
