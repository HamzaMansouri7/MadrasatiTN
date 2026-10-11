"""One row per exercise item: class, subject, theme, type, format, difficulty, correction, quality tier (ready|shelved)."""
import json, collections, sys, re, unicodedata
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8')
A = Path('parascolaire_frozen/_archive')

TAG_FORMAT_MAP = {
    'appariement': 'matching',
    'texte_a_trous': 'fill_blank',
    'calcul': 'calculation',
    'probleme': 'problem_solving',
    'vrai_faux': 'true_false',
    'qcm': 'qcm',
    'production_ecrite': 'text_production',
}

TASHKEEL_RE = re.compile(r'[\u064B-\u065F\u0670\u0640]')

def strip_accents(text):
    return ''.join(c for c in unicodedata.normalize('NFD', text) if unicodedata.category(c) != 'Mn')

def norm_text(t):
    if not t:
        return ''
    t = TASHKEEL_RE.sub('', t)
    t = re.sub(r'[أإآ]', 'ا', t)
    t = re.sub(r'ة', 'ه', t)
    t = re.sub(r'ى', 'ي', t)
    t = strip_accents(t)
    return t.lower()

RE_TRUE_FALSE = re.compile(
    r'(?:صواب\s*(?:او|/)\s*خطا|صحيح\s*(?:او|/)\s*خطا|\(ص\)\s*او\s*\(خ\)|'
    r'ضع\s*\(?ص\)?\s*او\s*\(?خ\)?|اضع\s*\(?ص\)?\s*او\s*\(?خ\)?|اكتب\s*(?:صواب|صحيح|خطا)|'
    r'ص\s*/\s*خ|صاد\s*او\s*خاء|اجب\s*بـ?\s*(?:صواب|صحيح)|'
    r'vrai\s*(?:ou|/)\s*faux|reponds\s+par\s+vrai\s+ou\s+faux|juste\s+ou\s+faux)',
    re.IGNORECASE
)

RE_MATCHING = re.compile(
    r'(?:اربط|صل\b|اصل\b|طابق|وفق|بسهم|'
    r'relie\b|relier\b|reliez\b|associe\b|associer\b|associez\b|'
    r'apparie\b|appariement\b|fais\s+correspondre|mets\s+en\s+relation)',
    re.IGNORECASE
)

RE_QCM = re.compile(
    r'(?:اشطب|شطب|احوط|حوط|ضع\s*دائره|اضع\s*دائره|في\s*دائره|بدائره|'
    r'ضع\s*علامه|اضع\s*علامه|علامه\s*(?:\(?[xX×]\)?|امام)|'
    r'اختر|اختار|الاجابه\s*الصحيحه|الجواب\s*الصحيح|الدخيل|دخيلا|دخيله|'
    r'سطر\s*تحت|ضع\s*سطرا|الون|لون\b|عين\s*الاجابه|'
    r'coche|cocher|cochez|entoure|entourer|entourez|'
    r'choisis|choisir|choisissez|qcm|barre\s+l[\'’]intrus|intrus\b|'
    r'encadre|encadrer|encadrez|souligne|souligner|soulignez|colorie)',
    re.IGNORECASE
)

RE_FILL_BLANK = re.compile(
    r'(?:اكمل|اتمم|املا|اتم\b|كمل\b|ملء\b|'
    r'الفراغ|الفراغات|مكان\s*النقط|عوض\s*النقط|\.{3,}|'
    r'بما\s*يناسب|بالعدد\s*المناسب|بالكلمه\s*المناسبه|بالعباره\s*المناسبه|'
    r'في\s*التربيعه|في\s*الخانه|في\s*الفراغ|'
    r'جدول\s*المنازل|املا\s*الجدول|اكمل\s*الجدول|اتمم\s*الجدول|'
    r'اكتب\s*مكان|ضع\s*في\s*الجدول|اكتب\s*في\s*الجدول|'
    r'complete|completer|completez|remplis|remplir|remplissez|'
    r'texte\s+a\s+trous|a\s+la\s+place\s+des\s+points|mots\s+suivants|'
    r'complete\s+le\s+tableau|mets\s+dans\s+le\s+tableau)',
    re.IGNORECASE
)

RE_CALCULATION = re.compile(
    r'(?:احسب|انجز\s*العملي|ضع\s*وانجز|انجز\s*عموديا|'
    r'الحساب\s*الذهني|فكك|ركب\b|اجر\s*العملي|اجري\s*العملي|'
    r'عمليه\s*الجمع|عمليه\s*الطرح|عمليه\s*الضرب|الكتابه\s*الجمعيه|'
    r'رتب\b|ارتب\b|ترتيب\b|تنازليا|تزايديا|'
    r'قارن\b|مقارنه\b|ضع\s*الرمز\s*(?:<|>|=)|اكتب\s*بالارقام|اكتب\s*بالحروف|'
    r'اكتب\s*(?:اصغر|اكبر)\s*عدد|مجموعه\s*الاعداد|ابحث\s*عن\s*مجموعه\s*الاعداد|'
    r'ما\s*هو\s*العدد\s*الذي|اوجد\s*عناصر|'
    r'حول\s*الي\s*(?:المتر|اللتر|الغرام|كغ|دق|س|مي|د|م\b|ل\b|غ\b)|'
    r'جد\s*(?:المجموع|الفارق|الجداء|النتيجه|قيمه)|'
    r'ارسم\b|انشي\b|قس\s*طول|قيس\s*طول|مستقيم|قطعه\s*مستقيم|مثلث|دائره|زاويه|'
    r'علي\s*استقامه\s*واحده|'
    r'calcule|calculer|calculez|pose\s+et\s+effectue|effectue\s+les\s+operations|'
    r'calcul\s+mental|pose\s+l[\'’]operation|range\s+dans\s+l[\'’]ordre|ordre\s+(?:croissant|decroissant)|'
    r'compare\s+avec|mets\s+le\s+signe|convertis|ecris\s+en\s+chiffres|ecris\s+en\s+lettres|'
    r'trace\b|construis\b|mesure\s+la\s+longueur)',
    re.IGNORECASE
)

RE_PROBLEM = re.compile(
    r'(?:وضعيه\s*مشكل|الوضعيه\s*الادماجيه|السند\s*\d|التعليمه\s*\d|'
    r'المعيار\s*معـ|معـ[1-5]|'
    r'كم\s*(?:بقي|يملك|صرف|دفع|اصبح|ربح|يبلغ|كلفت|دينارا|مليما|مره|يوما|سنه|ساعه)|'
    r'ما\s*هو\s*(?:ثمن|مبلغ|محصول|دخل|فارق|مجموع)|ما\s*هي\s*(?:كلفه|مصاريف|مساحه)|'
    r'احسب\s*(?:المبلغ|الثمن|الكلفه|المحصول|المساحه|المحيط|المصاريف)|'
    r'هل\s*(?:يكفيه|يمكنه|يستطيع)|علل\s*اجابتك|'
    r'اشترى|اشتري|ابتاع|ابتعت|حصاله|ادخر|مدخرات|فبقي\s*له|ويبقي\s*له|ويبقي\s*معه|'
    r'لتشتري|ليشتري|لشراء|اقتني|'
    r'probl[eè]me|situation-probl[eè]me|combien\s+lui\s+reste|quel\s+est\s+le\s+prix|'
    r'combien\s+a-t-il|calcule\s+le\s+prix|depense\s+totale|quel\s+est\s+le\s+montant|'
    r'calcule\s+la\s+surface|calcule\s+le\s+perimetre|justifie\s+ta\s+reponse)',
    re.IGNORECASE
)

def classify_format(inst, body, page_formats):
    raw = (inst or '') + ' ' + (body or '')
    text = norm_text(raw)
    if RE_TRUE_FALSE.search(text): return 'true_false'
    if RE_MATCHING.search(text): return 'matching'
    if RE_QCM.search(text): return 'qcm'
    if RE_FILL_BLANK.search(text): return 'fill_blank'
    if RE_CALCULATION.search(text): return 'calculation'
    if RE_PROBLEM.search(text): return 'problem_solving'
    if len(page_formats) == 1:
        f = page_formats[0]
        mapped = TAG_FORMAT_MAP.get(f)
        if mapped: return mapped
    return 'free'

rows = []; tier = collections.Counter()
for pf in sorted(A.glob('*/pages/*.json')):
    d = json.loads(pf.read_text(encoding='utf-8')); t = d.get('tags', {}); q = d.get('quality', {})
    poor = q.get('status') == 'poor' or 'poor_scan' in d.get('linkFlags', []) or 'partner_parked' in d.get('linkFlags', [])
    page_verified = q.get('status') in ('verified', 'sampled_ok', 'hand_fixed', 'corrected')
    ptype = d.get('pageType') or t.get('pageType')
    corr = d.get('correctionStatus') or ('linked' if d.get('correctionPages') else 'self_contained' if any(i['kind'] == 'answer' or i.get('answer') for i in d['items']) else 'no_correction_yet')
    page_formats = t.get('formats', [])
    subject = d.get('labels', {}).get('pageSubject') or t.get('subject')
    for i in d['items']:
        if i['kind'] == 'answer': continue
        has_ans = bool(i.get('answer')) or corr in ('linked', 'self_contained')
        fmt = classify_format(i.get('instruction'), i.get('body'), page_formats)
        
        # Determine tier
        if poor:
            tr = 'shelved'
        elif page_verified:
            tr = 'ready'
        else:
            body_text = ((i.get('instruction') or '') + ' ' + (i.get('body') or '')).strip()
            conf = i.get('confidence', 0.8)
            if len(body_text) >= 25 and conf >= 0.85:
                tr = 'ready'
            else:
                tr = 'pending_audit'
                
        rows.append({'id': i.get('id'), 'book': d['book'], 'page': d['page'], 'grade': d['grade'], 'subject': subject, 'theme': t.get('themeGroup') or t.get('theme'),
                     'pageType': ptype, 'examScope': d.get('examScope'), 'examTrimester': d.get('examTrimester'), 'kind': i['kind'], 'number': i.get('number'), 'format': fmt, 'difficulty': i.get('difficultyGuess'),
                     'topicId': d.get('topicId'), 'correction': corr if ptype == 'exam' else ('inline' if i.get('answer') else ('linked' if d.get('correctionPages') else 'none')),
                     'hasAnswer': has_ans, 'correctionPages': d.get('correctionPages', []), 'quality': q.get('status', 'unaudited'), 'accuracy': q.get('accuracy'),
                     'tier': tr})
        tier[tr] += 1
(A / 'exercises.jsonl').write_text('\n'.join(json.dumps(r, ensure_ascii=False) for r in rows), encoding='utf-8')
by = collections.Counter((r['grade'], r['tier']) for r in rows)
print(len(rows), dict(tier)); print(sorted(by.items()))
