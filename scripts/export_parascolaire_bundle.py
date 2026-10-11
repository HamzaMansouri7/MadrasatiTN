"""Export tier=ready exercises + themes + corrections to data/parascolaire/index.json."""
import json, re, sys
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8')
A = Path('parascolaire/_original_frozen/_archive')
OUT_DIR = Path('data/parascolaire')
OUT_DIR.mkdir(parents=True, exist_ok=True)

NAMES = json.loads((A / 'book_names.json').read_text(encoding='utf-8')) if (A / 'book_names.json').exists() else {}

ARABIC_RE = re.compile(r'[\u0600-\u06FF]')
LATIN_RE = re.compile(r'[a-zA-Z]')

def detect_lang(text):
    ar = len(ARABIC_RE.findall(text))
    lat = len(LATIN_RE.findall(text))
    if ar > 0 and lat > 0:
        return 'mixed'
    if ar > 0:
        return 'ar'
    if lat > 0:
        return 'fr'
    return 'mixed'

# Cache page JSONs
page_cache = {}
def get_page(book, page):
    k = (book, page)
    if k not in page_cache:
        pf = A / book / 'pages' / f"{page:03d}.json"
        if pf.exists():
            page_cache[k] = json.loads(pf.read_text(encoding='utf-8'))
        else:
            page_cache[k] = None
    return page_cache[k]

# Cache correction texts
def get_correction_text(book, corr_pages, item_number):
    texts = []
    for cp in corr_pages:
        page_d = get_page(book, cp)
        if not page_d: continue
        for it in page_d.get('items', []):
            # match by number if possible, or include answer items
            if it.get('kind') == 'answer' or it.get('answer'):
                ans_str = it.get('answer') or it.get('body') or it.get('instruction') or ''
                if ans_str:
                    num = str(it.get('number', '')).strip()
                    if not item_number or not num or num == str(item_number).strip():
                        texts.append(ans_str.strip())
    return ' | '.join(texts[:3]) if texts else ''

sources = []
ready_count = 0
with_corr_count = 0
by_topic = collections = {}

EXF = A / 'exercises.jsonl'
lines = EXF.read_text(encoding='utf-8').splitlines()

for ln in lines:
    r = json.loads(ln)
    if r.get('tier') != 'ready':
        continue
    ready_count += 1
    
    book = r['book']
    page = r['page']
    page_d = get_page(book, page)
    if not page_d:
        continue
        
    # Find matching item
    item = None
    for it in page_d.get('items', []):
        if it.get('id') == r.get('id'):
            item = it
            break
    if not item:
        # fallback by number
        for it in page_d.get('items', []):
            if str(it.get('number', '')) == str(r.get('number', '')) and it.get('kind') != 'answer':
                item = it
                break
    if not item:
        continue
        
    inst = (item.get('instruction') or '').strip()
    body = (item.get('body') or '').strip()
    ans = (item.get('answer') or '').strip()
    
    corr_text = ''
    if ans:
        corr_text = ans
    elif r.get('correctionPages'):
        corr_text = get_correction_text(book, r['correctionPages'], r.get('number'))
        
    if corr_text:
        with_corr_count += 1
        
    text_parts = []
    if inst:
        text_parts.append(f"Consigne: {inst}")
    if body:
        text_parts.append(f"Énoncé: {body}")
    if corr_text:
        text_parts.append(f"Corrigé: {corr_text}")
    full_text = '\n'.join(text_parts) if text_parts else (inst or body or 'Exercice')
    
    lang = detect_lang(inst + ' ' + body)
    book_display = NAMES.get(book, book)
    theme = r.get('theme') or page_d.get('tags', {}).get('theme') or ''
    topic_id = r.get('topicId') or page_d.get('topicId')
    
    # Title with provenance
    num_str = f", ex. {r.get('number')}" if r.get('number') else ''
    title = f"{book_display} (p. {page}{num_str})"
    if theme:
        title += f" — {theme}"
        
    # Trimester
    trim = r.get('examTrimester')
    if not trim and topic_id:
        if '-t1' in topic_id or '-p1' in topic_id or '-p2' in topic_id or '-u1' in topic_id or '-u2' in topic_id or '-u3' in topic_id or '-ch1' in topic_id or '-ch2' in topic_id or '-m1' in topic_id or '-m2' in topic_id or '-m3' in topic_id or '-m4' in topic_id:
            trim = 'Trimestre 1'
        elif '-t2' in topic_id or '-p3' in topic_id or '-p4' in topic_id or '-u4' in topic_id or '-u5' in topic_id or '-u6' in topic_id or '-ch3' in topic_id or '-ch4' in topic_id or '-m5' in topic_id or '-m6' in topic_id or '-m7' in topic_id or '-m8' in topic_id:
            trim = 'Trimestre 2'
        elif '-t3' in topic_id or '-p5' in topic_id or '-p6' in topic_id or '-u7' in topic_id or '-u8' in topic_id or '-m9' in topic_id or '-m10' in topic_id:
            trim = 'Trimestre 3'
            
    source_row = {
        'id': f"parascolaire-{r['id']}",
        'origin': 'parascolaire',
        'grade': r['grade'],
        'subject': r['subject'],
        'trimester': trim,
        'lang': lang,
        'title': title,
        'text': full_text,
        'ref': topic_id or f"{book}_p{page:03d}",
        'topicId': topic_id,
        'book': book,
        'bookDisplayName': book_display,
        'page': page,
        'theme': theme,
        'format': r.get('format', 'free'),
        'difficulty': r.get('difficulty'),
        'hasAnswer': bool(corr_text),
        'correction': corr_text if corr_text else None
    }
    sources.append(source_row)

out_file = OUT_DIR / 'index.json'
out_file.write_text(json.dumps(sources, ensure_ascii=False, indent=2), encoding='utf-8')

print(f"Exported {len(sources)} tier=ready sources to {out_file}")
print(f"With corrections: {with_corr_count}")
topic_counts = {}
for s in sources:
    tid = s.get('topicId') or 'no-topic'
    topic_counts[tid] = topic_counts.get(tid, 0) + 1
print(f"Unique topicIds: {len(topic_counts)}")
if 'math-5-ch1' in topic_counts:
    print(f"Sources for math-5-ch1: {topic_counts['math-5-ch1']}")
