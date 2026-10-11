"""Re-transcribe specific pages from the image at high effort and replace items when readable. Usage: fix_pages_claude.py book:page ..."""
import base64, json, sys
from pathlib import Path
import fitz
sys.path.insert(0, 'scripts')
from recheck_ocr_claude import call, use, cost
sys.stdout.reconfigure(encoding='utf-8')
A = Path('parascolaire/_archive')
for arg in sys.argv[1:]:
    b, p = arg.rsplit(':', 1); p = int(p)
    pf = A / b / 'pages' / f'{p:03d}.json'; d = json.loads(pf.read_text(encoding='utf-8'))
    bj = json.loads((A / b / 'book.json').read_text(encoding='utf-8'))
    img = fitz.open('parascolaire/' + bj['sourceFile'])[p - 1].get_pixmap(dpi=220).tobytes('jpeg')
    old = json.dumps([{k: i.get(k) for k in ('kind', 'number', 'instruction', 'body', 'answer')} for i in d['items']], ensure_ascii=False)
    pr = f"""Page {p} du livre « {b} » ({d['grade']}). Transcris fidèlement TOUT le contenu de l'image (exercices, énoncés, corrigés, tableaux, formules), dans l'ordre de lecture, avec accents et chiffres exacts. Ne rien inventer; passage illisible: [illisible]. Décris brièvement les figures dans figureDesc.
Transcription OCR actuelle (peut contenir des erreurs ou être incomplète, ne t'y fie pas): {old}
Réponds uniquement en JSON: {{"readable": true|false, "confidence": 0.0-1.0, "items":[{{"kind":"exercise|lesson|answer","number":"","instruction":"","body":"","figureDesc":"","answer":null}}]}}"""
    try: r = call(img, pr)
    except Exception as e: print(arg, 'FAILED', e); continue
    ok = r.get('readable') and (r.get('confidence') or 0) >= float(__import__('os').environ.get('MIN_CONF', '0.85')) and r.get('items')
    if ok:
        d.setdefault('itemsOcr1', d['items'])
        new = r['items']
        for i, it in enumerate(new):
            base = d['items'][i] if i < len(d['items']) else {}
            it['id'] = f"{b}_p{p:03d}_i{i + 1}"; it['topicId'] = d.get('topicId'); it['formatGuess'] = base.get('formatGuess'); it['difficultyGuess'] = base.get('difficultyGuess'); it['confidence'] = r['confidence']
        d['items'] = new; d['quality'] = {'status': 'hand_fixed', 'source': 'claude-high', 'accuracy': r['confidence'], 'reviewed': True}
        if 'poor_scan' in d.get('linkFlags', []): d['linkFlags'].remove('poor_scan')
    else:
        d['quality'] = {'status': 'poor', 'source': 'claude-high', 'accuracy': r.get('confidence')}
    pf.write_text(json.dumps(d, ensure_ascii=False, indent=2), encoding='utf-8')
    print(arg, 'FIXED' if ok else 'STILL POOR', r.get('confidence'), f'${cost():.2f}', flush=True)
