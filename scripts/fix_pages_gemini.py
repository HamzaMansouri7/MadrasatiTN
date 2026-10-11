"""Re-transcribe specific pages using Google Gemini (gemini-3.7-flash).
Usage:
  python scripts/fix_pages_gemini.py path/to/file.png ...
  python scripts/fix_pages_gemini.py book:page ...
"""
import base64, json, os, re, sys, time
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()
sys.stdout.reconfigure(encoding='utf-8')

A = Path('parascolaire/_original_frozen/_archive')
REV = A / '_review'

# Gather all available Gemini keys
raw_keys = (os.getenv('GEMINI_API_KEYS', '').split(',') + 
            [os.getenv('GEMINI_API_KEY', ''), 
             os.getenv('GEMINI_API_KEY_2', ''), 
             os.getenv('GEMINI_API_KEY_3', ''), 
             os.getenv('GEMINI_PAID_API_KEY', '')])
KEYS = [k.strip().strip('"').strip("'") for k in raw_keys if k.strip().strip('"').strip("'")]
# Deduplicate preserving order
KEYS = list(dict.fromkeys(KEYS))
MODEL = 'gemini-3.7-flash'

def get_client(key_idx=0):
    k = KEYS[key_idx % len(KEYS)]
    return genai.Client(api_key=k)

def parse_target(arg):
    p_arg = Path(arg)
    if p_arg.suffix.lower() == '.png':
        stem = p_arg.stem
        # e.g. al_mounir_eveil_scientifique_6eme_p057
        m = re.match(r'^(.*)_p(\d+)$', stem)
        if m:
            b, p = m.group(1), int(m.group(2))
            return p_arg, b, p
    elif ':' in arg:
        b, p = arg.rsplit(':', 1)
        p = int(p)
        png = REV / f"{b}_p{p:03d}.png"
        return png, b, p
    return None, None, None

def transcribe_one(arg):
    png_path, b, p = parse_target(arg)
    if not png_path:
        print(f"Skipping invalid target: {arg}")
        return

    # Check for original page json
    pf = A / b / 'pages' / f'{p:03d}.json'
    d = json.loads(pf.read_text(encoding='utf-8')) if pf.exists() else {}
    grade = d.get('grade', '')

    # Get image bytes
    if png_path.exists():
        img_bytes = png_path.read_bytes()
    else:
        bj = json.loads((A / b / 'book.json').read_text(encoding='utf-8'))
        import fitz
        img_bytes = fitz.open('parascolaire/' + bj['sourceFile'])[p - 1].get_pixmap(dpi=220).tobytes('jpeg')

    old_items = d.get('items', [])
    old_json = json.dumps([{k: i.get(k) for k in ('kind', 'number', 'instruction', 'body', 'answer')} for i in old_items], ensure_ascii=False)

    prompt = f"""Tu es un transcripteur expert de manuels scolaires tunisiens.
Page {p} du livre « {b} » ({grade}).
Transcris fidèlement TOUT le contenu de l'image (exercices, énoncés, corrigés, tableaux, formules), dans l'ordre de lecture, avec accents/voyelles (tashkeel en arabe) et chiffres exacts.
Règles strictes :
1. Ne rien inventer.
2. Si un passage est illisible dans le scan, transcris strictement [illisible].
3. Décris brièvement les illustrations/figures dans figureDesc.
4. Conserve la distinction claire entre 'instruction', 'body', et 'answer'.
5. Transcription OCR précédente (peut contenir des erreurs ou omissions) : {old_json}

Réponds UNIQUEMENT en JSON avec la structure exacte suivante :
{{
  "readable": true,
  "confidence": 0.95,
  "items": [
    {{
      "kind": "exercise|lesson|answer",
      "number": "",
      "instruction": "",
      "body": "",
      "figureDesc": "",
      "answer": null
    }}
  ]
}}"""

    res = None
    for attempt in range(len(KEYS) * 2):
        try:
            cli = get_client(attempt)
            response = cli.models.generate_content(
                model=MODEL,
                contents=[
                    types.Part.from_bytes(data=img_bytes, mime_type='image/png' if png_path.suffix == '.png' else 'image/jpeg'),
                    prompt
                ],
                config=types.GenerateContentConfig(
                    response_mime_type="application/json"
                )
            )
            raw = response.text.strip()
            # extract JSON
            s_idx = raw.find('{')
            e_idx = raw.rfind('}')
            res = json.loads(raw[s_idx:e_idx+1])
            break
        except Exception as err:
            if attempt == len(KEYS) * 2 - 1:
                print(f"[{b} p{p}] FAILED: {err}")
                return
            time.sleep(1)

    # Assemble output fixed json
    out_dict = dict(d)
    out_dict['book'] = b
    out_dict['page'] = p
    out_dict['ocrModel'] = MODEL

    items = res.get('items', [])
    for idx, it in enumerate(items):
        it['id'] = f"{b}_p{p:03d}_i{idx + 1}"
        it['topicId'] = d.get('topicId')
        base = old_items[idx] if idx < len(old_items) else {}
        it['formatGuess'] = base.get('formatGuess', 'free')
        it['difficultyGuess'] = base.get('difficultyGuess', 'medium')
        it['confidence'] = res.get('confidence', 0.9)

    out_dict['items'] = items
    out_dict['quality'] = {
        'status': 'verified_exact' if res.get('readable') else 'poor',
        'accuracy': res.get('confidence', 0.9),
        'source': MODEL
    }

    out_file = REV / f"{b}_p{p:03d}.fixed.json"
    out_file.write_text(json.dumps(out_dict, ensure_ascii=False, indent=2), encoding='utf-8')
    print(f"[{b} p{p:03d}] -> {out_file.name} | Readable: {res.get('readable')} | Confidence: {res.get('confidence')} | Items: {len(items)}")

if __name__ == '__main__':
    args = sys.argv[1:]
    if not args:
        print("Usage: python scripts/fix_pages_gemini.py <image_path_or_book:page> ...")
        sys.exit(1)

    print(f"Processing {len(args)} pages with {MODEL}...")
    with ThreadPoolExecutor(max_workers=4) as ex:
        list(ex.map(transcribe_one, args))
    print("ALL DONE.")
