"""
Generate back-cover, intro, and outro pages for Madrasati TN 100% ready books.
Strictly conforms to:
- DESIGN.md (ink #14251D, pine #2D6A4F, paper #FBF8F1, gold #8A5A00 / #F2C14E, rule #E7DFCF)
- ANTIGRAVITY-BOOKS-100.md (logo, watermark, wordmark, madrastihub.com, non-profit disclaimer)
- WebP quality 82, Lanczos downscale to max 1600px
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

W, H = 1200, 1600 # 3:4 portrait ratio

# Design tokens
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
    return get_display(arabic_reshaper.reshape(text))

def get_fonts():
    return {
        'h1': ImageFont.truetype(FONT_PATH, 54),
        'h2': ImageFont.truetype(FONT_PATH, 42),
        'body': ImageFont.truetype(FONT_REG, 34),
        'body_bold': ImageFont.truetype(FONT_PATH, 34),
        'caption': ImageFont.truetype(FONT_REG, 26),
        'watermark': ImageFont.truetype(FONT_LATIN, 90),
        'footer': ImageFont.truetype(FONT_PATH, 28),
    }

def draw_branding_header(img: Image.Image, draw: ImageDraw.ImageDraw, fonts, title_ar: str):
    # Top left logo
    if os.path.exists(LOGO_PATH):
        logo = Image.open(LOGO_PATH).convert('RGB').resize((110, 110), Image.Resampling.LANCZOS)
        # Rounded border
        img.paste(logo, (70, 70))
        draw.rectangle([70, 70, 180, 180], outline=RULE, width=2)
    
    # Top right: Ministry / Cartouche text
    header_lines = [
        ar('الجمهورية التونسية'),
        ar('وزارة التربية'),
        ar('المركز الوطني البيداغوجي ومدرستي تونس')
    ]
    y = 70
    for l in header_lines:
        bbox = draw.textbbox((0, 0), l, font=fonts['caption'])
        lw = bbox[2] - bbox[0]
        draw.text((W - 70 - lw, y), l, font=fonts['caption'], fill=INK)
        y += 34

    # Top separator line
    draw.line([(70, 210), (W - 70, 210)], fill=RULE, width=2)

def draw_branding_footer(img: Image.Image, draw: ImageDraw.ImageDraw, fonts, page_kind: str):
    # Bottom separator line
    draw.line([(70, H - 140), (W - 70, H - 140)], fill=RULE, width=2)
    
    # Left: madrastihub.com
    draw.text((70, H - 105), "madrastihub.com", font=fonts['footer'], fill=PINE)
    
    # Right: مدرستي تونس · Madrasati TN
    t_ar = ar("مدرستي تونس · Madrasati TN")
    bbox = draw.textbbox((0, 0), t_ar, font=fonts['footer'])
    lw = bbox[2] - bbox[0]
    draw.text((W - 70 - lw, H - 105), t_ar, font=fonts['footer'], fill=INK)

def apply_watermark(img: Image.Image):
    """Subtle 45-degree diagonal semi-transparent watermark across center."""
    watermark_layer = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    wdraw = ImageDraw.Draw(watermark_layer)
    font_wm = ImageFont.truetype(FONT_LATIN, 80)
    
    # Draw faint text
    text = "MADRASATI TN"
    bbox = wdraw.textbbox((0, 0), text, font=font_wm)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    
    # Create single rotated stamp
    stamp = Image.new('RGBA', (tw + 40, th + 40), (0, 0, 0, 0))
    sdraw = ImageDraw.Draw(stamp)
    sdraw.text((20, 20), text, font=font_wm, fill=(20, 37, 29, 22)) # 8% opacity ink
    rotated = stamp.rotate(45, expand=True, resample=Image.Resampling.BICUBIC)
    
    rw, rh = rotated.size
    cx = (W - rw) // 2
    cy = (H - rh) // 2
    img_rgba = img.convert('RGBA')
    img_rgba.alpha_composite(rotated, (cx, cy))
    return img_rgba.convert('RGB')

def generate_intro_page(book: dict, out_path: str):
    fonts = get_fonts()
    img = Image.new('RGB', (W, H), PAPER)
    draw = ImageDraw.Draw(img)

    draw_branding_header(img, draw, fonts, book['title'])
    
    # Book Grade badge
    badge_text = ar(book.get('grade', ''))
    draw.rounded_rectangle([W // 2 - 160, 260, W // 2 + 160, 320], radius=16, fill=PINE_DARK)
    bbox = draw.textbbox((0, 0), badge_text, font=fonts['h2'])
    draw.text(((W - (bbox[2] - bbox[0])) // 2, 268), badge_text, font=fonts['h2'], fill=WHITE)

    # Book Title
    title_ar = ar(book['title'])
    bbox = draw.textbbox((0, 0), title_ar, font=fonts['h1'])
    draw.text(((W - (bbox[2] - bbox[0])) // 2, 360), title_ar, font=fonts['h1'], fill=INK)

    # Subtitle / Subject
    sub_ar = ar(f"المادة: {book.get('subject', '')} — السنة الدراسية 2025-2026")
    bbox = draw.textbbox((0, 0), sub_ar, font=fonts['body_bold'])
    draw.text(((W - (bbox[2] - bbox[0])) // 2, 435), sub_ar, font=fonts['body_bold'], fill=PINE)

    # Content Box
    draw.rounded_rectangle([90, 520, W - 90, 1380], radius=24, fill=WHITE, outline=RULE, width=2)
    
    # Card Header
    card_title = ar("دليل استخدام هذا الكتاب التعليمي")
    bbox = draw.textbbox((0, 0), card_title, font=fonts['h2'])
    draw.text(((W - (bbox[2] - bbox[0])) // 2, 555), card_title, font=fonts['h2'], fill=INK)
    draw.line([(140, 625), (W - 140, 625)], fill=RULE, width=1)

    points = [
        ("• المحتوى البيداغوجي:", f"يحتوي هذا المصنف على {book.get('totalExercises', 0)} تمرينًا وتقييمًا مبرمجًا وفق التوزيع الرسمي لوزارة التربية التونسية."),
        ("• الإدماج والتقييم:", "تمارين متدرجة الصعوبة تشمل مراجعة القواعد، التطبيق المباشر، والوضعيات الاستكشافية والإدماجية."),
        ("• الإصلاح الدقيق:", "كل تمرين مصحوب بمسار الحل والتصحيح النموذجي لتمكين الولي والمربي من المتابعة الموضوعية للتعلمات."),
        ("• الطباعة الرسمية:", "الصفحات مهيأة للطباعة المباشرة بصيغة A4 مع ترويسة رسمية ومساحات مخصصة لبيانات التلميذ والعدد."),
        ("• المنصة الرقمية:", "يمكنكم متابعة الحلول التفاعلية وتحميل باقي الكراسات والتقييمات عبر منصة madrastihub.com.")
    ]
    
    y = 665
    for title, desc in points:
        t_reshaped = ar(title)
        bbox = draw.textbbox((0, 0), t_reshaped, font=fonts['body_bold'])
        draw.text((W - 140 - (bbox[2] - bbox[0]), y), t_reshaped, font=fonts['body_bold'], fill=PINE_DARK)
        y += 46
        
        # Word wrap desc in Arabic
        words = desc.split(' ')
        lines = []
        cur = []
        for w in words:
            test_line = " ".join(cur + [w])
            tbbox = draw.textbbox((0, 0), ar(test_line), font=fonts['body'])
            if (tbbox[2] - tbbox[0]) > (W - 280):
                lines.append(" ".join(cur))
                cur = [w]
            else:
                cur.append(w)
        if cur:
            lines.append(" ".join(cur))
        
        for l in lines:
            l_reshaped = ar(l)
            bbox = draw.textbbox((0, 0), l_reshaped, font=fonts['body'])
            draw.text((W - 140 - (bbox[2] - bbox[0]), y), l_reshaped, font=fonts['body'], fill=INK)
            y += 44
        y += 24

    draw_branding_footer(img, draw, fonts, 'intro')
    final = apply_watermark(img)
    final.save(out_path, 'WEBP', quality=82, method=6)
    print(f"Generated intro: {out_path}")

def generate_outro_page(book: dict, out_path: str):
    fonts = get_fonts()
    img = Image.new('RGB', (W, H), PAPER)
    draw = ImageDraw.Draw(img)

    draw_branding_header(img, draw, fonts, book['title'])

    # Title
    t1 = ar("خاتمة ومصادر الدعم البيداغوجي")
    bbox = draw.textbbox((0, 0), t1, font=fonts['h1'])
    draw.text(((W - (bbox[2] - bbox[0])) // 2, 280), t1, font=fonts['h1'], fill=INK)

    # Subtitle
    t2 = ar("مدرستي تونس — منصة الدعم المدرسي التشاركي")
    bbox = draw.textbbox((0, 0), t2, font=fonts['h2'])
    draw.text(((W - (bbox[2] - bbox[0])) // 2, 355), t2, font=fonts['h2'], fill=PINE)

    # Main Card
    draw.rounded_rectangle([90, 440, W - 90, 1380], radius=24, fill=WHITE, outline=RULE, width=2)

    blocks = [
        ("لمن هذا الكراس؟", "تم إعداد هذا المحتوى ليكون سندًا حقيقيًا للأولياء لمرافقة أبنائهم في المنزل، ومرجعًا مساعدًا للسيدات والسادة المربين داخل قاعات الدرس وفي حصص الدعم المدرسي."),
        ("مجاني للمجتمع وغير ربحي", "تؤمن منصة مدرستي تونس بأن المورد التعليمي الجيد حق لكل تلميذ وتلميذة في ربوع تونس. كافة التقييمات، الكراسات، والامتحانات متاحة مجانًا بدون أي معاليم أو اشتراكات تجارية."),
        ("تفاعل مع المنصة وشارك ملاحظاتك", "يمكنكم عبر منصة madrastihub.com استخدام المصحح الآلي للتمارين، وتصفح الكتب المدرسية الرسمية للمركز الوطني البيداغوجي، والتواصل مع شبكة المربين المتطوعين.")
    ]

    y = 500
    for title, desc in blocks:
        draw.rounded_rectangle([130, y, W - 130, y + 230], radius=16, fill=PAPER_2)
        t_reshaped = ar(title)
        bbox = draw.textbbox((0, 0), t_reshaped, font=fonts['h2'])
        draw.text(((W - (bbox[2] - bbox[0])) // 2, y + 25), t_reshaped, font=fonts['h2'], fill=PINE_DARK)
        
        # Wrapped text
        words = desc.split(' ')
        lines = []
        cur = []
        for w in words:
            test_line = " ".join(cur + [w])
            tbbox = draw.textbbox((0, 0), ar(test_line), font=fonts['body'])
            if (tbbox[2] - tbbox[0]) > (W - 320):
                lines.append(" ".join(cur))
                cur = [w]
            else:
                cur.append(w)
        if cur:
            lines.append(" ".join(cur))

        ly = y + 90
        for l in lines:
            l_reshaped = ar(l)
            bbox = draw.textbbox((0, 0), l_reshaped, font=fonts['body'])
            draw.text(((W - (bbox[2] - bbox[0])) // 2, ly), l_reshaped, font=fonts['body'], fill=INK)
            ly += 44
        y += 265

    draw_branding_footer(img, draw, fonts, 'outro')
    final = apply_watermark(img)
    final.save(out_path, 'WEBP', quality=82, method=6)
    print(f"Generated outro: {out_path}")

def generate_back_cover(book: dict, out_path: str):
    fonts = get_fonts()
    # Back cover is Solid Pine Dark #1B4332
    img = Image.new('RGB', (W, H), PINE_DARK)
    draw = ImageDraw.Draw(img)

    # Inner decorative border
    draw.rectangle([45, 45, W - 45, H - 45], outline=GOLD, width=3)
    draw.rectangle([55, 55, W - 55, H - 55], outline=GOLD_HI, width=1)

    # Logo top centered
    if os.path.exists(LOGO_PATH):
        logo = Image.open(LOGO_PATH).convert('RGB').resize((150, 150), Image.Resampling.LANCZOS)
        img.paste(logo, ((W - 150) // 2, 140))
        draw.rectangle([(W - 150) // 2, 140, (W + 150) // 2, 290], outline=GOLD_HI, width=2)

    # Platform Title
    t1 = ar("مدرستي تونس · Madrasati TN")
    bbox = draw.textbbox((0, 0), t1, font=fonts['h1'])
    draw.text(((W - (bbox[2] - bbox[0])) // 2, 320), t1, font=fonts['h1'], fill=WHITE)

    t2 = ar("فضاء الموارد البيداغوجية والتقييمات المدرسية")
    bbox = draw.textbbox((0, 0), t2, font=fonts['body'])
    draw.text(((W - (bbox[2] - bbox[0])) // 2, 395), t2, font=fonts['body'], fill=GOLD_HI)

    # Center Content Card
    draw.rounded_rectangle([110, 480, W - 110, 1200], radius=24, fill=PAPER)
    cdraw = ImageDraw.Draw(img)

    b_title = ar(book['title'])
    bbox = cdraw.textbbox((0, 0), b_title, font=fonts['h2'])
    cdraw.text(((W - (bbox[2] - bbox[0])) // 2, 530), b_title, font=fonts['h2'], fill=INK)

    counts_line = ar(f"يشتمل على {book.get('totalExercises', 0)} تمرينًا مصححًا موزعة على {book.get('totalPages', 0)} صفحات بيداغوجية")
    bbox = cdraw.textbbox((0, 0), counts_line, font=fonts['body_bold'])
    cdraw.text(((W - (bbox[2] - bbox[0])) // 2, 600), counts_line, font=fonts['body_bold'], fill=PINE)

    draw.line([(180, 665), (W - 180, 665)], fill=RULE, width=2)

    features = [
        "مطابق للبرامج الرسمية لوزارة التربية التونسية",
        "تمارين تقييمية مع إصلاح نموذجي مفصل ومدرج",
        "إتاحة كاملة للطباعة المنزلية والمدرسية بصيغة A4",
        "دعم ذكي وتوضيحات مساعدة للولي والتلميذ"
    ]
    fy = 710
    for f in features:
        draw.ellipse([W - 210, fy + 12, W - 195, fy + 27], fill=GOLD)
        f_ar = ar(f)
        bbox = cdraw.textbbox((0, 0), f_ar, font=fonts['body'])
        cdraw.text((W - 230 - (bbox[2] - bbox[0]), fy), f_ar, font=fonts['body'], fill=INK)
        fy += 65

    # Non-profit highlight box
    draw.rounded_rectangle([150, 990, W - 150, 1140], radius=16, fill=PAPER_2, outline=PINE, width=2)
    np1 = ar("مجاني للمجتمع · غير ربحي")
    bbox = cdraw.textbbox((0, 0), np1, font=fonts['h2'])
    cdraw.text(((W - (bbox[2] - bbox[0])) // 2, 1015), np1, font=fonts['h2'], fill=PINE_DARK)

    np2 = ar("مبادرة تربوية تشاركية مفتوحة لكافة الأولياء والمربين")
    bbox = cdraw.textbbox((0, 0), np2, font=fonts['caption'])
    cdraw.text(((W - (bbox[2] - bbox[0])) // 2, 1080), np2, font=fonts['caption'], fill=INK)

    # Bottom URL
    draw.text(((W - 380) // 2, 1310), "https://madrastihub.com", font=fonts['h2'], fill=GOLD_HI)
    draw.text(((W - 480) // 2, 1380), ar("تونس — السنة الدراسية 2025-2026"), font=fonts['caption'], fill=WHITE)

    final = apply_watermark(img)
    final.save(out_path, 'WEBP', quality=82, method=6)
    print(f"Generated back cover: {out_path}")

print("Script template ready.")
