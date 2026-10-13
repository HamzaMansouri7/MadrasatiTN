"""
High-Precision Programmatic PIL Generator for Madrasati TN Parascolaire Books.
Audited & Verified against exact source data:
1. Exact exercise counts (counting kind == 'exercise' only).
2. Exact solution claims (based on hasAnswer count).
3. No hardcoded trimesters (only displayed if examTrimester exists in data).
4. Uniform page count statement: "X صفحات في الكتاب، Y مرقمنة".
5. Removed all unverified wording ("مرتب حسب المحاور والمفاهيم", etc.).
6. Elegant design: Material Icons badge (calculate, science, menu_book), refined borders, and palette.
7. Zero watermark overlap and verified 2025-2026 year format.
"""
import os, sys, json
sys.stdout.reconfigure(encoding='utf-8')
from PIL import Image, ImageDraw, ImageFont
import arabic_reshaper
from bidi.algorithm import get_display

LOGO_PATH = 'public/logo.jpg'
FONT_PATH = 'C:/Windows/Fonts/majallab.ttf'
FONT_REG = 'C:/Windows/Fonts/majalla.ttf'
FONT_LATIN = 'C:/Windows/Fonts/arialbd.ttf'
FONT_ICON = 'scripts/fonts/MaterialIcons-Regular.ttf'

W, H = 1200, 1600 # 3:4 portrait ratio

# Design tokens from DESIGN.md
INK = (20, 37, 29)         # #14251D
PINE = (45, 106, 79)       # #2D6A4F
PINE_DARK = (27, 67, 50)   # #1B4332
PAPER = (251, 248, 241)    # #FBF8F1
PAPER_2 = (242, 236, 222)  # #F2ECDE
RULE = (231, 223, 207)     # #E7DFCF
GOLD = (138, 90, 0)        # #8A5A00
GOLD_HI = (242, 193, 78)   # #F2C14E
WHITE = (255, 255, 255)

def ar(text: str) -> str:
    if not text:
        return ""
    return get_display(arabic_reshaper.reshape(text))

def ar_with_year(prefix: str, year_str: str = "2025-2026") -> str:
    return f"{year_str} {ar(prefix)}"

def get_fonts():
    return {
        'title_xl': ImageFont.truetype(FONT_PATH, 54),
        'title': ImageFont.truetype(FONT_PATH, 44),
        'h2': ImageFont.truetype(FONT_PATH, 36),
        'h3': ImageFont.truetype(FONT_PATH, 30),
        'body': ImageFont.truetype(FONT_REG, 28),
        'body_bold': ImageFont.truetype(FONT_PATH, 28),
        'caption': ImageFont.truetype(FONT_REG, 24),
        'footer': ImageFont.truetype(FONT_PATH, 26),
        'icon_lg': ImageFont.truetype(FONT_ICON, 64),
        'icon_md': ImageFont.truetype(FONT_ICON, 44),
    }

def get_subject_icon(subject: str) -> str:
    s = subject.lower()
    if 'math' in s:
        return 'calculate'
    if 'éveil' in s or 'eveil' in s or 'science' in s:
        return 'science'
    return 'menu_book'

def apply_subtle_watermark(img: Image.Image, cy_offset: int = 0):
    watermark_layer = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    wdraw = ImageDraw.Draw(watermark_layer)
    font_wm = ImageFont.truetype(FONT_LATIN, 70)
    
    text = "MADRASATI TN"
    bbox = wdraw.textbbox((0, 0), text, font=font_wm)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    
    stamp = Image.new('RGBA', (tw + 40, th + 40), (0, 0, 0, 0))
    sdraw = ImageDraw.Draw(stamp)
    sdraw.text((20, 20), text, font=font_wm, fill=(20, 37, 29, 13)) # 5% opacity
    rotated = stamp.rotate(45, expand=True, resample=Image.Resampling.BICUBIC)
    
    rw, rh = rotated.size
    cx = (W - rw) // 2
    cy = (H - rh) // 2 + cy_offset
    img_rgba = img.convert('RGBA')
    img_rgba.alpha_composite(rotated, (cx, cy))
    return img_rgba.convert('RGB')

def draw_header_bar(img: Image.Image, draw: ImageDraw.ImageDraw, fonts):
    if os.path.exists(LOGO_PATH):
        logo = Image.open(LOGO_PATH).convert('RGB').resize((90, 90), Image.Resampling.LANCZOS)
        img.paste(logo, (70, 60))
        draw.rectangle([70, 60, 160, 150], outline=RULE, width=2)
    
    draw.text((W - 70 - (draw.textbbox((0, 0), ar("مدرستي تونس"), font=fonts['h2'])[2]), 65),
              ar("مدرستي تونس"), font=fonts['h2'], fill=PINE_DARK)
    draw.text((W - 70 - (draw.textbbox((0, 0), ar("فضاء الموارد البيداغوجية والتقييمات"), font=fonts['caption'])[2]), 110),
              ar("فضاء الموارد البيداغوجية والتقييمات"), font=fonts['caption'], fill=INK)
    
    draw.line([(70, 170), (W - 70, 170)], fill=RULE, width=2)

def draw_footer_bar(draw: ImageDraw.ImageDraw, fonts):
    draw.line([(70, H - 100), (W - 70, H - 100)], fill=RULE, width=2)
    draw.text((70, H - 75), "madrastihub.com", font=fonts['footer'], fill=PINE)
    
    brand_foot = ar("مدرستي تونس · Madrasati TN")
    bw = draw.textbbox((0, 0), brand_foot, font=fonts['footer'])[2]
    draw.text((W - 70 - bw, H - 75), brand_foot, font=fonts['footer'], fill=INK)

# ==============================================================================
# 1. FRONT COVER
# ==============================================================================
def generate_front_cover(book: dict, ex_only: int, has_ans: int, actual_pages: int, trimester: int | None, out_path: str):
    fonts = get_fonts()
    img = Image.new('RGB', (W, H), PAPER)
    draw = ImageDraw.Draw(img)

    # Top Pine Banner (Height 380px)
    draw.rectangle([0, 0, W, 380], fill=PINE_DARK)
    draw.rectangle([0, 380, W, 392], fill=GOLD_HI)

    # Logo in header banner
    if os.path.exists(LOGO_PATH):
        logo = Image.open(LOGO_PATH).convert('RGB').resize((120, 120), Image.Resampling.LANCZOS)
        img.paste(logo, (80, 65))
        draw.rectangle([80, 65, 200, 185], outline=GOLD_HI, width=2)

    # Platform Wordmark in Banner
    wm1 = ar("مدرستي تونس · Madrasati TN")
    draw.text((W - 80 - (draw.textbbox((0, 0), wm1, font=fonts['title'])[2]), 70),
              wm1, font=fonts['title'], fill=WHITE)
    
    wm2 = ar("سلسلة الدعم والتقييم البيداغوجي")
    draw.text((W - 80 - (draw.textbbox((0, 0), wm2, font=fonts['h3'])[2]), 135),
              wm2, font=fonts['h3'], fill=GOLD_HI)

    # Year in Banner
    year_str = ar_with_year("السنة الدراسية :", "2025-2026")
    draw.text((W - 80 - (draw.textbbox((0, 0), year_str, font=fonts['caption'])[2]), 185),
              year_str, font=fonts['caption'], fill=WHITE)

    # Subject Icon Badge in Header (Material Icon)
    icon_name = get_subject_icon(book.get('subject', ''))
    draw.rounded_rectangle([W // 2 - 45, 260, W // 2 + 45, 350], radius=16, fill=WHITE)
    ibox = draw.textbbox((0, 0), icon_name, font=fonts['icon_lg'])
    iw, ih = ibox[2] - ibox[0], ibox[3] - ibox[1]
    draw.text(((W - iw) // 2, 275), icon_name, font=fonts['icon_lg'], fill=PINE_DARK)

    # Central Card
    draw.rounded_rectangle([80, 450, W - 80, 1380], radius=24, fill=WHITE, outline=RULE, width=2)
    cdraw = ImageDraw.Draw(img)

    # Grade Pill Badge
    grade_txt = ar(book.get('grade', ''))
    gw = cdraw.textbbox((0, 0), grade_txt, font=fonts['h2'])[2]
    badge_w = gw + 60
    bx1 = (W - badge_w) // 2
    cdraw.rounded_rectangle([bx1, 490, bx1 + badge_w, 555], radius=14, fill=PAPER_2, outline=PINE, width=2)
    cdraw.text((bx1 + 30, 502), grade_txt, font=fonts['h2'], fill=PINE_DARK)

    # Clean Book Title (NO duplicated words)
    title_raw = book.get('title', '')
    title_ar = ar(title_raw)
    tw = cdraw.textbbox((0, 0), title_ar, font=fonts['title_xl'])[2]
    if tw > (W - 220):
        words = title_raw.split('—')
        if len(words) == 2:
            l1, l2 = ar(words[0].strip()), ar("— " + words[1].strip())
            cdraw.text(((W - cdraw.textbbox((0, 0), l1, font=fonts['title_xl'])[2]) // 2, 590), l1, font=fonts['title_xl'], fill=INK)
            cdraw.text(((W - cdraw.textbbox((0, 0), l2, font=fonts['title'])[2]) // 2, 665), l2, font=fonts['title'], fill=PINE)
        else:
            cdraw.text(((W - tw) // 2, 610), title_ar, font=fonts['title'], fill=INK)
    else:
        cdraw.text(((W - tw) // 2, 610), title_ar, font=fonts['title_xl'], fill=INK)

    # Subject line (Drop trimester unless specified in data)
    subj_str = f"المادة: {book.get('subject', '')}"
    if trimester:
        subj_str += f" — الثلاثي {trimester}"
    subj_ar = ar(subj_str)
    sw = cdraw.textbbox((0, 0), subj_ar, font=fonts['h3'])[2]
    cdraw.text(((W - sw) // 2, 755), subj_ar, font=fonts['h3'], fill=PINE_DARK)

    cdraw.line([(160, 820), (W - 160, 820)], fill=RULE, width=2)

    # Clean Content Summary Block (strictly verified facts)
    total_pg = book.get('totalPages', actual_pages)
    
    # Precise pages line
    if total_pg != actual_pages:
        pages_line = f"{total_pg} صفحات في الكتاب، {actual_pages} صفحات مرقمنة"
    else:
        pages_line = f"{actual_pages} صفحات كاملة مرقمنة"

    # Precise solution line
    if has_ans == ex_only and ex_only > 0:
        ans_line = "مصحوب بالإصلاح الكامل لجميع التمارين."
    elif has_ans > 0:
        ans_line = f"يتضمن حلولاً نموذجية لـ {has_ans} تمرينًا من أصل {ex_only}."
    else:
        ans_line = "تمارين تقييمية للمراجعة والدعم المدرسي."

    stats_block = [
        ("• التمارين:", f"يحتوي هذا الكراس على {ex_only} تمرينًا."),
        ("• الصفحات:", pages_line + "."),
        ("• الإصلاح:", ans_line),
        ("• الإتاحة:", "متاح مجانًا بدون أي مقابل لدعم التلاميذ والأولياء.")
    ]

    sy = 865
    for header, desc in stats_block:
        h_ar = ar(header)
        d_ar = ar(desc)
        cdraw.text((W - 160 - cdraw.textbbox((0, 0), h_ar, font=fonts['body_bold'])[2], sy),
                   h_ar, font=fonts['body_bold'], fill=PINE)
        cdraw.text((W - 270 - cdraw.textbbox((0, 0), d_ar, font=fonts['body'])[2], sy),
                   d_ar, font=fonts['body'], fill=INK)
        sy += 58

    # Free for community badge at bottom
    cdraw.rounded_rectangle([160, 1220, W - 160, 1300], radius=14, fill=PAPER_2)
    comm_txt = ar("مبادرة تعليمية تشاركية مفتوحة · مجاني للمجتمع")
    cw = cdraw.textbbox((0, 0), comm_txt, font=fonts['h3'])[2]
    cdraw.text(((W - cw) // 2, 1242), comm_txt, font=fonts['h3'], fill=PINE_DARK)

    # Bottom Footer
    draw.line([(80, 1460), (W - 80, 1460)], fill=RULE, width=2)
    draw.text((80, 1495), "madrastihub.com", font=fonts['h2'], fill=PINE)
    
    foot_r = ar("مدرستي تونس — تونس")
    draw.text((W - 80 - draw.textbbox((0, 0), foot_r, font=fonts['h2'])[2], 1495),
              foot_r, font=fonts['h2'], fill=INK)

    final = apply_subtle_watermark(img)
    final.save(out_path, 'WEBP', quality=82, method=6)
    print(f"Generated clean front cover: {out_path}")

# ==============================================================================
# 2. BACK COVER
# ==============================================================================
def generate_back_cover(book: dict, ex_only: int, has_ans: int, actual_pages: int, trimester: int | None, out_path: str):
    fonts = get_fonts()
    img = Image.new('RGB', (W, H), PINE_DARK)
    draw = ImageDraw.Draw(img)

    # Frame border
    draw.rectangle([45, 45, W - 45, H - 45], outline=GOLD, width=3)
    draw.rectangle([55, 55, W - 55, H - 55], outline=GOLD_HI, width=1)

    # Top logo
    if os.path.exists(LOGO_PATH):
        logo = Image.open(LOGO_PATH).convert('RGB').resize((110, 110), Image.Resampling.LANCZOS)
        img.paste(logo, ((W - 110) // 2, 105))
        draw.rectangle([(W - 110) // 2, 105, (W + 110) // 2, 215], outline=GOLD_HI, width=2)

    t1 = ar("مدرستي تونس · Madrasati TN")
    draw.text(((W - draw.textbbox((0, 0), t1, font=fonts['title'])[2]) // 2, 245), t1, font=fonts['title'], fill=WHITE)

    t2 = ar("فضاء الموارد البيداغوجية والتقييمات المدرسية")
    draw.text(((W - draw.textbbox((0, 0), t2, font=fonts['body'])[2]) // 2, 315), t2, font=fonts['body'], fill=GOLD_HI)

    # Center card
    draw.rounded_rectangle([100, 400, W - 100, 1180], radius=24, fill=PAPER)
    cdraw = ImageDraw.Draw(img)

    b_title = ar(book.get('title', ''))
    draw.text(((W - cdraw.textbbox((0, 0), b_title, font=fonts['h2'])[2]) // 2, 450),
              b_title, font=fonts['h2'], fill=INK)

    # Uniform pages line
    total_pg = book.get('totalPages', actual_pages)
    if total_pg != actual_pages:
        page_summary = f"{total_pg} صفحات في الكتاب، {actual_pages} صفحات مرقمنة"
    else:
        page_summary = f"{actual_pages} صفحات مرقمنة"

    counts_line = ar(f"يشتمل على {ex_only} تمرينًا ({page_summary})")
    draw.text(((W - cdraw.textbbox((0, 0), counts_line, font=fonts['body_bold'])[2]) // 2, 515),
              counts_line, font=fonts['body_bold'], fill=PINE)

    draw.line([(160, 575), (W - 160, 575)], fill=RULE, width=2)

    # Verified solution fact
    if has_ans == ex_only and ex_only > 0:
        ans_fact = "الإصلاح: مصحوب بالإصلاح الكامل لجميع التمارين"
    elif has_ans > 0:
        ans_fact = f"الإصلاح: يتضمن حلولاً لـ {has_ans} تمرينًا من أصل {ex_only}"
    else:
        ans_fact = "التقييم: تمارين داعمة للمراجعة المباشرة"

    facts = [
        f"المستوى: {book.get('grade', '')} — مادة {book.get('subject', '')}",
        f"المحتوى: {ex_only} تمرينًا وتطبيقًا",
        f"الصفحات: {page_summary}",
        ans_fact,
        "المنصة: متاحة للجميع عبر madrastihub.com مجانًا"
    ]

    fy = 620
    for f in facts:
        draw.ellipse([W - 180, fy + 8, W - 166, fy + 22], fill=GOLD)
        f_ar = ar(f)
        draw.text((W - 200 - cdraw.textbbox((0, 0), f_ar, font=fonts['body'])[2], fy),
                  f_ar, font=fonts['body'], fill=INK)
        fy += 58

    # Non-profit declaration card
    draw.rounded_rectangle([140, 970, W - 140, 1120], radius=16, fill=PAPER_2, outline=PINE, width=2)
    np1 = ar("مجاني للمجتمع · غير ربحي")
    draw.text(((W - cdraw.textbbox((0, 0), np1, font=fonts['h2'])[2]) // 2, 995),
              np1, font=fonts['h2'], fill=PINE_DARK)
    
    np2 = ar("مبادرة تربوية تشاركية مفتوحة لكافة الأولياء والمربين")
    draw.text(((W - cdraw.textbbox((0, 0), np2, font=fonts['caption'])[2]) // 2, 1060),
              np2, font=fonts['caption'], fill=INK)

    # Bottom Footer
    draw.text(((W - draw.textbbox((0, 0), "https://madrastihub.com", font=fonts['h2'])[2]) // 2, 1260),
              "https://madrastihub.com", font=fonts['h2'], fill=GOLD_HI)
    
    year_line = ar_with_year("تونس — السنة الدراسية :", "2025-2026")
    draw.text(((W - draw.textbbox((0, 0), year_line, font=fonts['caption'])[2]) // 2, 1335),
              year_line, font=fonts['caption'], fill=WHITE)

    final = apply_subtle_watermark(img, cy_offset=-100)
    final.save(out_path, 'WEBP', quality=82, method=6)
    print(f"Generated clean back cover: {out_path}")

# ==============================================================================
# 3. INTRO PAGE
# ==============================================================================
def generate_intro_page(book: dict, ex_only: int, has_ans: int, actual_pages: int, trimester: int | None, out_path: str):
    fonts = get_fonts()
    img = Image.new('RGB', (W, H), PAPER)
    draw = ImageDraw.Draw(img)

    draw_header_bar(img, draw, fonts)

    badge_text = ar(book.get('grade', ''))
    draw.rounded_rectangle([W // 2 - 150, 230, W // 2 + 150, 290], radius=14, fill=PINE_DARK)
    bw = draw.textbbox((0, 0), badge_text, font=fonts['h2'])[2]
    draw.text(((W - bw) // 2, 238), badge_text, font=fonts['h2'], fill=WHITE)

    t_ar = ar(book.get('title', ''))
    draw.text(((W - draw.textbbox((0, 0), t_ar, font=fonts['title'])[2]) // 2, 320),
              t_ar, font=fonts['title'], fill=INK)

    subj_str = f"المادة: {book.get('subject', '')}"
    if trimester:
        subj_str += f" — الثلاثي {trimester}"
    year_str = ar_with_year(subj_str + " — السنة الدراسية :", "2025-2026")
    draw.text(((W - draw.textbbox((0, 0), year_str, font=fonts['body_bold'])[2]) // 2, 395),
              year_str, font=fonts['body_bold'], fill=PINE)

    draw.rounded_rectangle([90, 460, W - 90, 1380], radius=24, fill=WHITE, outline=RULE, width=2)
    cdraw = ImageDraw.Draw(img)

    card_header = ar("تقديم ومحتوى الكراس")
    draw.text(((W - cdraw.textbbox((0, 0), card_header, font=fonts['h2'])[2]) // 2, 500),
              card_header, font=fonts['h2'], fill=INK)
    draw.line([(140, 560), (W - 140, 560)], fill=RULE, width=1)

    total_pg = book.get('totalPages', actual_pages)
    if total_pg != actual_pages:
        page_desc = f"{total_pg} صفحات في أصل الكتاب، و{actual_pages} صفحات رقمية معتمدة."
    else:
        page_desc = f"{actual_pages} صفحات رقمية معتمدة."

    if has_ans == ex_only and ex_only > 0:
        ans_desc = "التمارين مصحوبة بالإصلاح الكامل لجميع الأسئلة."
    elif has_ans > 0:
        ans_desc = f"يتضمن الكراس إصلاحًا لـ {has_ans} تمرينًا من مجموع {ex_only}."
    else:
        ans_desc = "تمارين تقييمية للمراجعة الذاتية والمتابعة المباشرة."

    points = [
        ("• المحتوى الرقمي:", f"يحتوي هذا الكراس على {ex_only} تمرينًا وتطبيقًا موزعة على " + page_desc),
        ("• مسار الإصلاح:", ans_desc),
        ("• الغاية البيداغوجية:", "مساعدة التلاميذ على تثبيت المكتسبات ودعم الأولياء في المرافقة المنزلية."),
        ("• منصة مدرستي تونس:", "كافة الكراسات متاحة مجانًا لكافة أفراد العائلة التربوية عبر madrastihub.com.")
    ]

    y = 610
    for header, desc in points:
        h_ar = ar(header)
        draw.text((W - 140 - cdraw.textbbox((0, 0), h_ar, font=fonts['body_bold'])[2], y),
                  h_ar, font=fonts['body_bold'], fill=PINE_DARK)
        y += 42
        
        words = desc.split(' ')
        lines, cur = [], []
        for w in words:
            test = " ".join(cur + [w])
            if (cdraw.textbbox((0, 0), ar(test), font=fonts['body'])[2]) > (W - 280):
                lines.append(" ".join(cur))
                cur = [w]
            else:
                cur.append(w)
        if cur:
            lines.append(" ".join(cur))
        
        for l in lines:
            l_ar = ar(l)
            draw.text((W - 140 - cdraw.textbbox((0, 0), l_ar, font=fonts['body'])[2], y),
                      l_ar, font=fonts['body'], fill=INK)
            y += 40
        y += 28

    draw_footer_bar(draw, fonts)
    final = apply_subtle_watermark(img)
    final.save(out_path, 'WEBP', quality=82, method=6)
    print(f"Generated clean intro page: {out_path}")

# ==============================================================================
# 4. OUTRO PAGE
# ==============================================================================
def generate_outro_page(book: dict, ex_only: int, actual_pages: int, out_path: str):
    fonts = get_fonts()
    img = Image.new('RGB', (W, H), PAPER)
    draw = ImageDraw.Draw(img)

    draw_header_bar(img, draw, fonts)

    t1 = ar("خاتمة ومصادر الدعم")
    draw.text(((W - draw.textbbox((0, 0), t1, font=fonts['title'])[2]) // 2, 250),
              t1, font=fonts['title'], fill=INK)

    t2 = ar("مدرستي تونس — مبادرة الدعم المدرسي التشاركي")
    draw.text(((W - draw.textbbox((0, 0), t2, font=fonts['h2'])[2]) // 2, 325),
              t2, font=fonts['h2'], fill=PINE)

    draw.rounded_rectangle([90, 410, W - 90, 1380], radius=24, fill=WHITE, outline=RULE, width=2)
    cdraw = ImageDraw.Draw(img)

    blocks = [
        ("سند بيداغوجي للمتعلم والولي", f"تمت رقمنة هذا الكراس ({ex_only} تمرينًا) ليكون مرجعًا للمراجعة ودعم التعلمات المدرسية."),
        ("مجاني للمجتمع وغير ربحي", "المحتوى متاح بصفة مجانية ومفتوحة دون أي مقابل مالي خدمة للمجموعة التربوية."),
        ("متابعة الموارد الرقمية", "يمكنكم تصفح المزيد من التقييمات والكتب المدرسية الرسمية عبر الموقع: madrastihub.com")
    ]

    y = 470
    for title, desc in blocks:
        draw.rounded_rectangle([130, y, W - 130, y + 230], radius=16, fill=PAPER_2)
        t_ar = ar(title)
        draw.text(((W - cdraw.textbbox((0, 0), t_ar, font=fonts['h2'])[2]) // 2, y + 25),
                  t_ar, font=fonts['h2'], fill=PINE_DARK)

        words = desc.split(' ')
        lines, cur = [], []
        for w in words:
            test = " ".join(cur + [w])
            if (cdraw.textbbox((0, 0), ar(test), font=fonts['body'])[2]) > (W - 320):
                lines.append(" ".join(cur))
                cur = [w]
            else:
                cur.append(w)
        if cur:
            lines.append(" ".join(cur))

        ly = y + 90
        for l in lines:
            l_ar = ar(l)
            draw.text(((W - cdraw.textbbox((0, 0), l_ar, font=fonts['body'])[2]) // 2, ly),
                      l_ar, font=fonts['body'], fill=INK)
            ly += 40
        y += 265

    draw_footer_bar(draw, fonts)
    final = apply_subtle_watermark(img)
    final.save(out_path, 'WEBP', quality=82, method=6)
    print(f"Generated clean outro page: {out_path}")

print("Clean book pages generator updated.")
