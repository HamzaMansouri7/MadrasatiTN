"""
Generate the complete Madrasati TN Rebranded Series for:
توظيف الرسوم البيانية في حل المسائل الرياضية (السنة الخامسة ابتدائي)
Based on educator Mohamed Ali's pedagogical materials.
Outputs directly to WebP (q82, method 6), creates manifest.json, and registers in index.json.
"""
import os, sys, json
sys.stdout.reconfigure(encoding='utf-8')
from PIL import Image, ImageDraw, ImageFont
import arabic_reshaper
from bidi.algorithm import get_display

DEST_DIR = os.path.join('public', 'assets', 'resources', '5eme-annee', 'parascolaire', 'trimestre-1', 'resoudre-problemes-par-graphiques')
os.makedirs(DEST_DIR, exist_ok=True)

LOGO_PATH = 'public/logo.jpg'
FONT_PATH = 'C:/Windows/Fonts/majallab.ttf'
FONT_REG = 'C:/Windows/Fonts/majalla.ttf'
FONT_LATIN = 'C:/Windows/Fonts/arialbd.ttf'
FONT_ICON = 'scripts/fonts/MaterialIcons-Regular.ttf'

W, H = 1200, 1697 # Exact A4 ratio (1 : 1.414)

# Madrasati TN Design Tokens
INK = (20, 37, 29)          # #14251D
PINE = (45, 106, 79)        # #2D6A4F
PINE_DARK = (27, 67, 50)    # #1B4332
PAPER = (251, 248, 241)     # #FBF8F1
PAPER_2 = (242, 236, 222)   # #F2ECDE
RULE = (220, 212, 195)      # Border
GOLD = (138, 90, 0)         # #8A5A00
GOLD_HI = (242, 193, 78)    # #F2C14E
WHITE = (255, 255, 255)
BLUE_BOX = (235, 244, 255)
BLUE_BORDER = (59, 130, 246)
GREEN_BOX = (236, 253, 245)
GREEN_BORDER = (16, 185, 129)
ORANGE_BOX = (255, 247, 237)
ORANGE_BORDER = (249, 115, 22)

def ar(text: str) -> str:
    if not text:
        return ""
    return get_display(arabic_reshaper.reshape(text))

def get_fonts():
    return {
        'title_xl': ImageFont.truetype(FONT_PATH, 54),
        'title': ImageFont.truetype(FONT_PATH, 42),
        'h2': ImageFont.truetype(FONT_PATH, 34),
        'h3': ImageFont.truetype(FONT_PATH, 28),
        'body': ImageFont.truetype(FONT_REG, 26),
        'body_bold': ImageFont.truetype(FONT_PATH, 26),
        'caption': ImageFont.truetype(FONT_REG, 22),
        'footer': ImageFont.truetype(FONT_PATH, 24),
        'icon_lg': ImageFont.truetype(FONT_ICON, 64),
        'icon_md': ImageFont.truetype(FONT_ICON, 38),
    }

def apply_watermark(img: Image.Image):
    watermark_layer = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    wdraw = ImageDraw.Draw(watermark_layer)
    font_wm = ImageFont.truetype(FONT_LATIN, 72)
    text = "MADRASATI TN"
    bbox = wdraw.textbbox((0, 0), text, font=font_wm)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    
    stamp = Image.new('RGBA', (tw + 40, th + 40), (0, 0, 0, 0))
    sdraw = ImageDraw.Draw(stamp)
    sdraw.text((20, 20), text, font=font_wm, fill=(20, 37, 29, 11)) # ~4% opacity
    rotated = stamp.rotate(45, expand=True, resample=Image.Resampling.BICUBIC)
    
    rw, rh = rotated.size
    cx = (W - rw) // 2
    cy = (H - rh) // 2
    img_rgba = img.convert('RGBA')
    img_rgba.alpha_composite(rotated, (cx, cy))
    return img_rgba.convert('RGB')

def draw_official_header(img: Image.Image, draw: ImageDraw.ImageDraw, fonts, page_title: str, is_worksheet: bool = True):
    # Top bar
    draw.rectangle([0, 0, W, 10], fill=PINE_DARK)
    
    # Logo
    if os.path.exists(LOGO_PATH):
        logo = Image.open(LOGO_PATH).convert('RGB').resize((75, 75), Image.Resampling.LANCZOS)
        img.paste(logo, (60, 25))
        draw.rectangle([60, 25, 135, 100], outline=RULE, width=1)
    
    # Official Ministry block (Right)
    draw.text((W - 60 - draw.textbbox((0, 0), ar("الجمهورية التونسية - وزارة التربية"), font=fonts['body_bold'])[2], 25),
              ar("الجمهورية التونسية - وزارة التربية"), font=fonts['body_bold'], fill=PINE_DARK)
    draw.text((W - 60 - draw.textbbox((0, 0), ar("المستوى: السنة الخامسة ابتدائي · مادة الرياضيات"), font=fonts['caption'])[2], 58),
              ar("المستوى: السنة الخامسة ابتدائي · مادة الرياضيات"), font=fonts['caption'], fill=INK)
    draw.text((W - 60 - draw.textbbox((0, 0), ar("سلسلة التميز : توظيف الرسوم البيانية في حل المسائل"), font=fonts['caption'])[2], 84),
              ar("سلسلة التميز : توظيف الرسوم البيانية في حل المسائل"), font=fonts['caption'], fill=GOLD)
    
    # Center Title Banner
    draw.rounded_rectangle([250, 115, W - 250, 165], radius=10, fill=PINE, outline=GOLD_HI, width=1)
    pt_ar = ar(page_title)
    pw = draw.textbbox((0, 0), pt_ar, font=fonts['h2'])[2]
    draw.text(((W - pw) // 2, 122), pt_ar, font=fonts['h2'], fill=WHITE)
    
    if is_worksheet:
        # Student info bar
        draw.rounded_rectangle([60, 175, W - 60, 215], radius=6, fill=PAPER_2, outline=RULE, width=1)
        s1 = ar("الاسم واللقب: ....................................................")
        s2 = ar("القسم: 5 أساسي .....")
        s3 = ar("العدد: ..... / 20")
        draw.text((W - 80 - draw.textbbox((0, 0), s1, font=fonts['caption'])[2], 183), s1, font=fonts['caption'], fill=INK)
        draw.text((450, 183), s2, font=fonts['caption'], fill=INK)
        draw.text((80, 183), s3, font=fonts['caption'], fill=PINE_DARK)
        draw.line([(60, 230), (W - 60, 230)], fill=RULE, width=1)
        return 245
    else:
        draw.line([(60, 180), (W - 60, 180)], fill=RULE, width=1)
        return 195

def draw_official_footer(draw: ImageDraw.ImageDraw, fonts, page_num_str: str = ""):
    draw.line([(60, H - 70), (W - 60, H - 70)], fill=RULE, width=1)
    draw.text((60, H - 52), "madrastihub.com", font=fonts['footer'], fill=PINE)
    
    if page_num_str:
        pn = ar(f"- {page_num_str} -")
        pw = draw.textbbox((0, 0), pn, font=fonts['caption'])[2]
        draw.text(((W - pw) // 2, H - 52), pn, font=fonts['caption'], fill=INK)
        
    attr = ar("المربي: محمد علي · إعداد وتنسيق: مدرستي تونس")
    aw = draw.textbbox((0, 0), attr, font=fonts['footer'])[2]
    draw.text((W - 60 - aw, H - 52), attr, font=fonts['footer'], fill=INK)

# ==============================================================================
# 1. FRONT COVER
# ==============================================================================
def make_cover():
    fonts = get_fonts()
    img = Image.new('RGB', (W, H), PAPER)
    draw = ImageDraw.Draw(img)
    
    # Top banner
    draw.rectangle([0, 0, W, 400], fill=PINE_DARK)
    draw.rectangle([0, 400, W, 412], fill=GOLD_HI)
    
    if os.path.exists(LOGO_PATH):
        logo = Image.open(LOGO_PATH).convert('RGB').resize((120, 120), Image.Resampling.LANCZOS)
        img.paste(logo, (70, 60))
        draw.rectangle([70, 60, 190, 180], outline=GOLD_HI, width=2)
        
    wm1 = ar("الجمهورية التونسية · وزارة التربية")
    draw.text((W - 70 - draw.textbbox((0, 0), wm1, font=fonts['h3'])[2], 65), wm1, font=fonts['h3'], fill=GOLD_HI)
    
    wm2 = ar("مدرستي تونس · Madrasati TN")
    draw.text((W - 70 - draw.textbbox((0, 0), wm2, font=fonts['title_xl'])[2], 110), wm2, font=fonts['title_xl'], fill=WHITE)
    
    wm3 = ar("سلسلة التميز البيداغوجي والامتحانات الرسمية")
    draw.text((W - 70 - draw.textbbox((0, 0), wm3, font=fonts['h3'])[2], 180), wm3, font=fonts['h3'], fill=WHITE)
    
    # Big icon badge
    draw.rounded_rectangle([W // 2 - 50, 280, W // 2 + 50, 380], radius=18, fill=WHITE)
    calc_ico = '\uea5f' # calculate
    ibox = draw.textbbox((0, 0), calc_ico, font=fonts['icon_lg'])
    draw.text(((W - (ibox[2] - ibox[0])) // 2, 295), calc_ico, font=fonts['icon_lg'], fill=PINE_DARK)
    
    # Central Content Card
    draw.rounded_rectangle([70, 460, W - 70, 1480], radius=24, fill=WHITE, outline=RULE, width=2)
    
    # Grade Badge
    gb = ar("السنة الخامسة من التعليم الأساسي")
    gw = draw.textbbox((0, 0), gb, font=fonts['h2'])[2]
    draw.rounded_rectangle([(W - gw - 60) // 2, 500, (W + gw + 60) // 2, 560], radius=14, fill=PAPER_2, outline=PINE, width=2)
    draw.text(((W - gw) // 2, 510), gb, font=fonts['h2'], fill=PINE_DARK)
    
    # Main Series Title
    t1 = ar("تَـوْظِـيـفُ الـرُّسُـومِ الـبَـيَـانِـيَّـةِ")
    t2 = ar("فِي حَلِّ المَسَائِلِ الرِّيَاضِيَّةِ")
    draw.text(((W - draw.textbbox((0, 0), t1, font=fonts['title_xl'])[2]) // 2, 600), t1, font=fonts['title_xl'], fill=PINE_DARK)
    draw.text(((W - draw.textbbox((0, 0), t2, font=fonts['title_xl'])[2]) // 2, 670), t2, font=fonts['title_xl'], fill=GOLD)
    
    sub = ar("المخطط القطعي · الأشرطة الملونة · كفتا الميزان · المسائل الهندسية")
    draw.text(((W - draw.textbbox((0, 0), sub, font=fonts['h3'])[2]) // 2, 755), sub, font=fonts['h3'], fill=INK)
    
    # Feature 3-Box Grid
    boxes = [
        ("قواعد منهجية واضحة", "تحويل نص الوضعية إلى تمثيل بياني يفكك المجهول بدقة", BLUE_BOX, BLUE_BORDER),
        ("تمارين تطبيقية متدرجة", "وضعيات حقيقية من صميم البرنامج الرسمي التونسي", GREEN_BOX, GREEN_BORDER),
        ("إصلاح نموذجي مفصل", "خطوات حسابية دقيقة مدعمة بالرسوم والمخططات للولي والتلميذ", ORANGE_BOX, ORANGE_BORDER)
    ]
    by = 830
    for title_b, desc_b, bg, border in boxes:
        draw.rounded_rectangle([120, by, W - 120, by + 120], radius=14, fill=bg, outline=border, width=2)
        tb_ar = ar(title_b)
        db_ar = ar(desc_b)
        draw.text((W - 150 - draw.textbbox((0, 0), tb_ar, font=fonts['h2'])[2], by + 18), tb_ar, font=fonts['h2'], fill=INK)
        draw.text((W - 150 - draw.textbbox((0, 0), db_ar, font=fonts['body'])[2], by + 65), db_ar, font=fonts['body'], fill=INK)
        by += 140
        
    # Teacher Author block
    draw.rounded_rectangle([150, 1300, W - 150, 1420], radius=16, fill=PAPER_2, outline=GOLD, width=2)
    auth1 = ar("المحتوى البيداغوجي : المربي محمد علي")
    auth2 = ar("الإخراج والمواءمة الرقمية : شبكة مدرستي تونس التعليمية")
    auth3 = ar("السنة الدراسية 2025 - 2026 · مطابقة لبرامج وزارة التربية التونسية")
    draw.text(((W - draw.textbbox((0, 0), auth1, font=fonts['h2'])[2]) // 2, 1315), auth1, font=fonts['h2'], fill=PINE_DARK)
    draw.text(((W - draw.textbbox((0, 0), auth2, font=fonts['body_bold'])[2]) // 2, 1355), auth2, font=fonts['body_bold'], fill=INK)
    draw.text(((W - draw.textbbox((0, 0), auth3, font=fonts['caption'])[2]) // 2, 1390), auth3, font=fonts['caption'], fill=GOLD)
    
    # Bottom Footer
    draw_official_footer(draw, fonts, "غلاف السلسلة")
    img = apply_watermark(img)
    img.save(os.path.join(DEST_DIR, 'cover.webp'), 'WEBP', quality=82, method=6)
    print("Cover generated.")

# ==============================================================================
# 2. METHODOLOGY CHEAT-SHEET (PAGE 001)
# ==============================================================================
def make_page_001():
    fonts = get_fonts()
    img = Image.new('RGB', (W, H), WHITE)
    draw = ImageDraw.Draw(img)
    y = draw_official_header(img, draw, fonts, "بطاقة منهجية : القواعد الذهبية لتوظيف الرسوم البيانية", is_worksheet=False)
    
    # Method 1: Sum and Proportional Parts (المجموع والأجزاء المتناسبة)
    draw.rounded_rectangle([60, y, W - 60, y + 270], radius=12, fill=BLUE_BOX, outline=BLUE_BORDER, width=2)
    t1 = ar("1. وضعيات المجموع والأجزاء المتناسبة (الضعف، النصف، الأمثال...)")
    draw.text((W - 80 - draw.textbbox((0, 0), t1, font=fonts['h2'])[2], y + 15), t1, font=fonts['h2'], fill=PINE_DARK)
    
    p1 = ar("• القاعدة : عندما تكون إحدى الكميتين ضعف أو عدة أضعاف للأخرى مع معلومية مجموعهما :")
    p2 = ar("  1) نمثل الكمية الصغرى بجزء واحد [ شريط واحد ] والكمية الكبرى بعدد أضعافها.")
    p3 = ar("  2) مجموع الأجزاء = أجزاء الكمية الأولى + أجزاء الكمية الثانية.")
    p4 = ar("  3) قيمة الجزء الواحد = المجموع الجملي ÷ عدد الأجزاء الكلي.")
    draw.text((W - 90 - draw.textbbox((0, 0), p1, font=fonts['body_bold'])[2], y + 55), p1, font=fonts['body_bold'], fill=INK)
    draw.text((W - 90 - draw.textbbox((0, 0), p2, font=fonts['body'])[2], y + 90), p2, font=fonts['body'], fill=INK)
    draw.text((W - 90 - draw.textbbox((0, 0), p3, font=fonts['body'])[2], y + 125), p3, font=fonts['body'], fill=INK)
    draw.text((W - 90 - draw.textbbox((0, 0), p4, font=fonts['body'])[2], y + 160), p4, font=fonts['body'], fill=INK)
    
    # Draw Visual Strip Diagram for Method 1
    # Example: Computer (2 parts) + Table (1 part) = 2100 DT
    # Table bar: [  700 DT  ]
    # Computer bar: [  700 DT  ][  700 DT  ]
    draw.text((980, y + 210), ar("الكمية الكبرى :"), font=fonts['body_bold'], fill=INK)
    draw.rectangle([720, y + 205, 960, y + 245], fill=WHITE, outline=PINE_DARK, width=2)
    draw.line([(840, y + 205), (840, y + 245)], fill=PINE_DARK, width=2)
    draw.text((750, y + 212), ar("جزء 1"), font=fonts['caption'], fill=PINE)
    draw.text((870, y + 212), ar("جزء 2"), font=fonts['caption'], fill=PINE)
    
    draw.text((610, y + 210), ar("الكمية الصغرى :"), font=fonts['body_bold'], fill=INK)
    draw.rectangle([480, y + 205, 600, y + 245], fill=WHITE, outline=PINE_DARK, width=2)
    draw.text((515, y + 212), ar("جزء 1"), font=fonts['caption'], fill=PINE)
    
    draw.text((100, y + 210), ar("المجموع الكلي = 3 أجزاء متساوية"), font=fonts['body_bold'], fill=GOLD)
    y += 290
    
    # Method 2: Sum and Difference (المجموع والفارق)
    draw.rounded_rectangle([60, y, W - 60, y + 280], radius=12, fill=GREEN_BOX, outline=GREEN_BORDER, width=2)
    t2 = ar("2. وضعيات المجموع والفارق (الأشرطة الملونة والمقارنة)")
    draw.text((W - 80 - draw.textbbox((0, 0), t2, font=fonts['h2'])[2], y + 15), t2, font=fonts['h2'], fill=PINE_DARK)
    
    p1 = ar("• القاعدة : عندما نعلم المجموع الجملي لكميتين والفارق بينهما (زيادة أو نقصان) :")
    p2 = ar("  1) الكمية الكبرى = (المجموع الجملي + الفارق) ÷ 2")
    p3 = ar("  2) الكمية الصغرى = (المجموع الجملي - الفارق) ÷ 2")
    p4 = ar("  3) التحقق الميداني : الكمية الكبرى + الكمية الصغرى = المجموع الكلي المعطى.")
    draw.text((W - 90 - draw.textbbox((0, 0), p1, font=fonts['body_bold'])[2], y + 55), p1, font=fonts['body_bold'], fill=INK)
    draw.text((W - 90 - draw.textbbox((0, 0), p2, font=fonts['body_bold'])[2], y + 90), p2, font=fonts['body_bold'], fill=PINE)
    draw.text((W - 90 - draw.textbbox((0, 0), p3, font=fonts['body_bold'])[2], y + 125), p3, font=fonts['body_bold'], fill=PINE)
    draw.text((W - 90 - draw.textbbox((0, 0), p4, font=fonts['body'])[2], y + 160), p4, font=fonts['body'], fill=INK)
    
    # Diagram 2: Strip with Difference extension
    draw.text((980, y + 210), ar("الشريط الأكبر :"), font=fonts['body_bold'], fill=INK)
    draw.rectangle([680, y + 205, 840, y + 245], fill=WHITE, outline=PINE_DARK, width=2)
    draw.rectangle([840, y + 205, 960, y + 245], fill=GOLD_HI, outline=GOLD, width=2)
    draw.text((710, y + 212), ar("الجزء المتساوي"), font=fonts['caption'], fill=INK)
    draw.text((865, y + 212), ar("الفارق (+)"), font=fonts['caption'], fill=PINE_DARK)
    
    draw.text((540, y + 210), ar("الشريط الأصغر :"), font=fonts['body_bold'], fill=INK)
    draw.rectangle([360, y + 205, 520, y + 245], fill=WHITE, outline=PINE_DARK, width=2)
    draw.text((390, y + 212), ar("الجزء المتساوي"), font=fonts['caption'], fill=INK)
    y += 300
    
    # Method 3: Scale / Balance and Elimination (كفتا الميزان والاختزال)
    draw.rounded_rectangle([60, y, W - 60, y + 250], radius=12, fill=ORANGE_BOX, outline=ORANGE_BORDER, width=2)
    t3 = ar("3. وضعيات التوازن والاختزال (كفتا الميزان)")
    draw.text((W - 80 - draw.textbbox((0, 0), t3, font=fonts['h2'])[2], y + 15), t3, font=fonts['h2'], fill=PINE_DARK)
    
    p1 = ar("• القاعدة : إذا تساوت قيمتان تحتوي كل منهما على عدد من نفس الأشياء ومبالغ مالية :")
    p2 = ar("  1) نحذف العناصر المشتركة بالتساوي من الطرفين (طريقة الاختزال).")
    p3 = ar("  2) الفارق بين المبالغ المالية المتبقية يقابل عدد القطع المتبقية.")
    p4 = ar("  3) ثمن القطعة الواحدة = فارق المبلغين ÷ فارق عدد القطع.")
    draw.text((W - 90 - draw.textbbox((0, 0), p1, font=fonts['body_bold'])[2], y + 55), p1, font=fonts['body_bold'], fill=INK)
    draw.text((W - 90 - draw.textbbox((0, 0), p2, font=fonts['body'])[2], y + 90), p2, font=fonts['body'], fill=INK)
    draw.text((W - 90 - draw.textbbox((0, 0), p3, font=fonts['body'])[2], y + 125), p3, font=fonts['body'], fill=INK)
    draw.text((W - 90 - draw.textbbox((0, 0), p4, font=fonts['body_bold'])[2], y + 160), p4, font=fonts['body_bold'], fill=PINE_DARK)
    
    draw.text(((W - draw.textbbox((0, 0), ar("مثال : (5 أقلام + 3000 مي) = (3 أقلام + 7800 مي)  ◀  قلمان = 4800 مي  ◀  القلم = 2400 مي"), font=fonts['body_bold'])[2]) // 2, y + 205),
              ar("مثال : (5 أقلام + 3000 مي) = (3 أقلام + 7800 مي)  ◀  قلمان = 4800 مي  ◀  القلم = 2400 مي"), font=fonts['body_bold'], fill=PINE)
    y += 270
    
    # Method 4: Geometry & Perimeters (المسائل الهندسية ومحيط ومساحة الأشكال)
    draw.rounded_rectangle([60, y, W - 60, y + 260], radius=12, fill=PAPER_2, outline=RULE, width=2)
    t4 = ar("4. المسائل الهندسية : المحيط ونصف المحيط وعرض المدخل")
    draw.text((W - 80 - draw.textbbox((0, 0), t4, font=fonts['h2'])[2], y + 15), t4, font=fonts['h2'], fill=PINE_DARK)
    
    p1 = ar("• في المستطيل : نصف المحيط = الطول + العرض.")
    p2 = ar("  - إذا كان العرض يمثل نسبة من الطول (مثلاً الثلث 1/3) : نصف المحيط = 1 + 3 = 4 أجزاء.")
    p3 = ar("• طول السياج = محيط الأرض - عرض المدخل غير المسيج.")
    p4 = ar("• محيط الأرض الفلاحية = طول السياج (الأسلاك) + عرض المدخل المتروك.")
    draw.text((W - 90 - draw.textbbox((0, 0), p1, font=fonts['body_bold'])[2], y + 55), p1, font=fonts['body_bold'], fill=INK)
    draw.text((W - 90 - draw.textbbox((0, 0), p2, font=fonts['body'])[2], y + 90), p2, font=fonts['body'], fill=INK)
    draw.text((W - 90 - draw.textbbox((0, 0), p3, font=fonts['body_bold'])[2], y + 125), p3, font=fonts['body_bold'], fill=INK)
    draw.text((W - 90 - draw.textbbox((0, 0), p4, font=fonts['body_bold'])[2], y + 160), p4, font=fonts['body_bold'], fill=PINE_DARK)
    
    draw_official_footer(draw, fonts, "1")
    img = apply_watermark(img)
    img.save(os.path.join(DEST_DIR, '001.webp'), 'WEBP', quality=82, method=6)
    print("Page 001 generated.")

# ==============================================================================
# 3. WORKSHEET 1: SUM & PROPORTIONAL PARTS (PAGE 002)
# ==============================================================================
def make_page_002():
    fonts = get_fonts()
    img = Image.new('RGB', (W, H), WHITE)
    draw = ImageDraw.Draw(img)
    y = draw_official_header(img, draw, fonts, "سلسلة تمارين 1 : مسائل المجموع والأجزاء المتناسبة", is_worksheet=True)
    
    # Problem 1: Computer & Table
    draw.rounded_rectangle([60, y, W - 60, y + 360], radius=12, fill=WHITE, outline=PINE, width=2)
    draw.rounded_rectangle([W - 250, y, W - 60, y + 40], radius=8, fill=PINE)
    draw.text((W - 235, y + 8), ar("الوضعية الأولى"), font=fonts['h3'], fill=WHITE)
    
    s1 = ar("اشترت الأم حاسوباً وطاولة مكتب لأبنائها بمبلغ جملي قدره 2100 دينار.")
    s2 = ar("علمت أن ثمن الحاسوب يمثل ضعف ثمن طاولة المكتب.")
    q1 = ar("1) أكمل رسم المخطط الشريطي التالي لتمثيل المعطيات وتحديد عدد الأجزاء الكلي :")
    q2 = ar("2) أحسب ثمن شراء طاولة المكتب بالدينار :")
    q3 = ar("3) أحسب ثمن شراء الحاسوب بالدينار :")
    
    draw.text((W - 90 - draw.textbbox((0, 0), s1, font=fonts['body_bold'])[2], y + 55), s1, font=fonts['body_bold'], fill=INK)
    draw.text((W - 90 - draw.textbbox((0, 0), s2, font=fonts['body_bold'])[2], y + 90), s2, font=fonts['body_bold'], fill=INK)
    draw.text((W - 90 - draw.textbbox((0, 0), q1, font=fonts['body'])[2], y + 130), q1, font=fonts['body'], fill=PINE_DARK)
    
    # Diagram Scaffold for Student to fill
    draw.text((950, y + 180), ar("ثمن الحاسوب :"), font=fonts['body'], fill=INK)
    draw.rectangle([700, y + 175, 930, y + 215], fill=PAPER_2, outline=INK, width=2)
    draw.line([(815, y + 175), (815, y + 215)], fill=INK, width=1)
    draw.text((725, y + 182), ar("................"), font=fonts['caption'], fill=INK)
    draw.text((840, y + 182), ar("................"), font=fonts['caption'], fill=INK)
    
    draw.text((950, y + 235), ar("ثمن الطاولة :"), font=fonts['body'], fill=INK)
    draw.rectangle([815, y + 230, 930, y + 270], fill=PAPER_2, outline=INK, width=2)
    draw.text((840, y + 237), ar("................"), font=fonts['caption'], fill=INK)
    
    draw.text((200, y + 205), ar("المجموع الكلي = 2100 د ( ..... أجزاء متساوية )"), font=fonts['body_bold'], fill=GOLD)
    
    draw.text((W - 90 - draw.textbbox((0, 0), q2, font=fonts['body'])[2], y + 285), q2, font=fonts['body'], fill=PINE_DARK)
    draw.text((W - 90 - draw.textbbox((0, 0), q3, font=fonts['body'])[2], y + 320), q3, font=fonts['body'], fill=PINE_DARK)
    y += 380
    
    # Problem 2: 3 Brothers sharing an inheritance/money
    draw.rounded_rectangle([60, y, W - 60, y + 360], radius=12, fill=WHITE, outline=PINE, width=2)
    draw.rounded_rectangle([W - 250, y, W - 60, y + 40], radius=8, fill=PINE)
    draw.text((W - 235, y + 8), ar("الوضعية الثانية"), font=fonts['h3'], fill=WHITE)
    
    s1 = ar("اقتسم ثلاثة إخوة (علي وحسام ومريم) مبلغاً مالياً قدره 840 ديناراً.")
    s2 = ar("نال علي ضعف ما ناله حسام، ونال حسام ضعف ما نالته مريم.")
    q1 = ar("1) مثل نصيب كل طفل بالأشرطة الملونة لتحديد عدد الأجزاء الكلي.")
    q2 = ar("2) أحسب قيمة الجزء الواحد (نصيب مريم) بالدينار.")
    q3 = ar("3) أحسب نصيب كل من حسام وعلي بالدينار.")
    
    draw.text((W - 90 - draw.textbbox((0, 0), s1, font=fonts['body_bold'])[2], y + 55), s1, font=fonts['body_bold'], fill=INK)
    draw.text((W - 90 - draw.textbbox((0, 0), s2, font=fonts['body_bold'])[2], y + 90), s2, font=fonts['body_bold'], fill=INK)
    draw.text((W - 90 - draw.textbbox((0, 0), q1, font=fonts['body'])[2], y + 130), q1, font=fonts['body'], fill=PINE_DARK)
    
    # 3 Blank strips for student
    draw.text((980, y + 175), ar("نصيب علي :"), font=fonts['body'], fill=INK)
    draw.rectangle([540, y + 170, 960, y + 205], fill=WHITE, outline=INK, width=1)
    draw.text((980, y + 215), ar("نصيب حسام :"), font=fonts['body'], fill=INK)
    draw.rectangle([750, y + 210, 960, y + 245], fill=WHITE, outline=INK, width=1)
    draw.text((980, y + 255), ar("نصيب مريم :"), font=fonts['body'], fill=INK)
    draw.rectangle([855, y + 250, 960, y + 285], fill=WHITE, outline=INK, width=1)
    
    draw.text((W - 90 - draw.textbbox((0, 0), q2, font=fonts['body'])[2], y + 295), q2, font=fonts['body'], fill=PINE_DARK)
    draw.text((W - 90 - draw.textbbox((0, 0), q3, font=fonts['body'])[2], y + 325), q3, font=fonts['body'], fill=PINE_DARK)
    y += 380
    
    # Problem 3: Farm Trees
    draw.rounded_rectangle([60, y, W - 60, y + 320], radius=12, fill=WHITE, outline=PINE, width=2)
    draw.rounded_rectangle([W - 250, y, W - 60, y + 40], radius=8, fill=PINE)
    draw.text((W - 235, y + 8), ar("الوضعية الثالثة"), font=fonts['h3'], fill=WHITE)
    
    s1 = ar("يملك فلاح بستاناً يحتوي على 1500 شجرة مثمرة من الزيتون والبرتقال.")
    s2 = ar("إذا علمت أن عدد أشجار الزيتون يساوي 4 أضعاف عدد أشجار البرتقال.")
    q1 = ar("1) أحسب عدد الأجزاء الممثلة لمجموع الأشجار.")
    q2 = ar("2) ما هو عدد أشجار البرتقال في هذا البستان ؟")
    q3 = ar("3) ما هو عدد أشجار الزيتون ؟")
    
    draw.text((W - 90 - draw.textbbox((0, 0), s1, font=fonts['body_bold'])[2], y + 55), s1, font=fonts['body_bold'], fill=INK)
    draw.text((W - 90 - draw.textbbox((0, 0), s2, font=fonts['body_bold'])[2], y + 90), s2, font=fonts['body_bold'], fill=INK)
    draw.text((W - 90 - draw.textbbox((0, 0), q1, font=fonts['body'])[2], y + 140), q1, font=fonts['body'], fill=PINE_DARK)
    draw.text((W - 90 - draw.textbbox((0, 0), q2, font=fonts['body'])[2], y + 190), q2, font=fonts['body'], fill=PINE_DARK)
    draw.text((W - 90 - draw.textbbox((0, 0), q3, font=fonts['body'])[2], y + 240), q3, font=fonts['body'], fill=PINE_DARK)
    
    draw_official_footer(draw, fonts, "2")
    img = apply_watermark(img)
    img.save(os.path.join(DEST_DIR, '002.webp'), 'WEBP', quality=82, method=6)
    print("Page 002 generated.")

# ==============================================================================
# 4. WORKSHEET 2: SUM & DIFFERENCE / COMPARISON (PAGE 003)
# ==============================================================================
def make_page_003():
    fonts = get_fonts()
    img = Image.new('RGB', (W, H), WHITE)
    draw = ImageDraw.Draw(img)
    y = draw_official_header(img, draw, fonts, "سلسلة تمارين 2 : مسائل المجموع والفارق والتمثيل الشريطي", is_worksheet=True)
    
    # Problem 4: Flower Bouquets (Zayneb)
    draw.rounded_rectangle([60, y, W - 60, y + 360], radius=12, fill=WHITE, outline=PINE, width=2)
    draw.rounded_rectangle([W - 250, y, W - 60, y + 40], radius=8, fill=PINE)
    draw.text((W - 235, y + 8), ar("الوضعية الرابعة"), font=fonts['h3'], fill=WHITE)
    
    s1 = ar("اشترت زينب باقتين من الأزهار (باقة صفراء وباقة حمراء) بثمن جملي قدره 62 ديناراً.")
    s2 = ar("يزيد ثمن الباقة الصفراء عن ثمن الباقة الحمراء بمقدار 14 ديناراً.")
    q1 = ar("1) ارسم مخطط الأشرطة الملونة الذي يوضح الفارق بين ثمن الباقتين.")
    q2 = ar("2) أحسب ثمن الباقة الصفراء (الكمية الكبرى) بالدينار.")
    q3 = ar("3) أحسب ثمن الباقة الحمراء (الكمية الصغرى) بالدينار.")
    
    draw.text((W - 90 - draw.textbbox((0, 0), s1, font=fonts['body_bold'])[2], y + 55), s1, font=fonts['body_bold'], fill=INK)
    draw.text((W - 90 - draw.textbbox((0, 0), s2, font=fonts['body_bold'])[2], y + 90), s2, font=fonts['body_bold'], fill=INK)
    draw.text((W - 90 - draw.textbbox((0, 0), q1, font=fonts['body'])[2], y + 130), q1, font=fonts['body'], fill=PINE_DARK)
    
    # Strip Scaffold for student
    draw.text((950, y + 180), ar("الباقة الصفراء :"), font=fonts['body'], fill=INK)
    draw.rectangle([680, y + 175, 840, y + 215], fill=PAPER_2, outline=INK, width=2)
    draw.rectangle([840, y + 175, 930, y + 215], fill=GOLD_HI, outline=GOLD, width=2)
    draw.text((710, y + 182), ar("ثمن الحمراء"), font=fonts['caption'], fill=INK)
    draw.text((850, y + 182), ar("14 د"), font=fonts['caption'], fill=PINE_DARK)
    
    draw.text((950, y + 235), ar("الباقة الحمراء :"), font=fonts['body'], fill=INK)
    draw.rectangle([680, y + 230, 840, y + 270], fill=PAPER_2, outline=INK, width=2)
    draw.text((710, y + 237), ar("ثمن الحمراء"), font=fonts['caption'], fill=INK)
    
    draw.text((250, y + 205), ar("المجموع الجملي = 62 ديناراً"), font=fonts['body_bold'], fill=PINE_DARK)
    
    draw.text((W - 90 - draw.textbbox((0, 0), q2, font=fonts['body'])[2], y + 285), q2, font=fonts['body'], fill=PINE_DARK)
    draw.text((W - 90 - draw.textbbox((0, 0), q3, font=fonts['body'])[2], y + 320), q3, font=fonts['body'], fill=PINE_DARK)
    y += 380
    
    # Problem 5: Livestock (Sheep and Goats)
    draw.rounded_rectangle([60, y, W - 60, y + 340], radius=12, fill=WHITE, outline=PINE, width=2)
    draw.rounded_rectangle([W - 250, y, W - 60, y + 40], radius=8, fill=PINE)
    draw.text((W - 235, y + 8), ar("الوضعية الخامسة"), font=fonts['h3'], fill=WHITE)
    
    s1 = ar("يضم قطيع من الماشية 240 رأساً من الخراف والماعز يرعاها عمي صالح.")
    s2 = ar("يفوق عدد الخراف عدد الماعز بـ 60 رأساً.")
    q1 = ar("1) أحسب عدد الخراف في هذا القطيع بتطبيق قاعدة (المجموع + الفارق) ÷ 2.")
    q2 = ar("2) أحسب عدد الماعز بتطبيق قاعدة (المجموع - الفارق) ÷ 2.")
    q3 = ar("3) تحقق من صحة نتيجتك بجمع الكميتين.")
    
    draw.text((W - 90 - draw.textbbox((0, 0), s1, font=fonts['body_bold'])[2], y + 55), s1, font=fonts['body_bold'], fill=INK)
    draw.text((W - 90 - draw.textbbox((0, 0), s2, font=fonts['body_bold'])[2], y + 90), s2, font=fonts['body_bold'], fill=INK)
    draw.text((W - 90 - draw.textbbox((0, 0), q1, font=fonts['body'])[2], y + 140), q1, font=fonts['body'], fill=PINE_DARK)
    draw.text((W - 90 - draw.textbbox((0, 0), q2, font=fonts['body'])[2], y + 200), q2, font=fonts['body'], fill=PINE_DARK)
    draw.text((W - 90 - draw.textbbox((0, 0), q3, font=fonts['body'])[2], y + 260), q3, font=fonts['body'], fill=PINE_DARK)
    y += 360
    
    # Problem 6: Running Race
    draw.rounded_rectangle([60, y, W - 60, y + 340], radius=12, fill=WHITE, outline=PINE, width=2)
    draw.rounded_rectangle([W - 250, y, W - 60, y + 40], radius=8, fill=PINE)
    draw.text((W - 235, y + 8), ar("الوضعية السادسة"), font=fonts['h3'], fill=WHITE)
    
    s1 = ar("تدرب عداءان (سليم وأيمن) فقطعا معاً مسافة جملية قدرها 8500 متراً.")
    s2 = ar("كانت المسافة التي قطعها سليم تفوق المسافة التي قطعها أيمن بـ 900 متراً.")
    q1 = ar("1) ما هي المسافة التي قطعها سليم بالمتر والكيلومتر ؟")
    q2 = ar("2) ما هي المسافة التي قطعها أيمن بالمتر ؟")
    
    draw.text((W - 90 - draw.textbbox((0, 0), s1, font=fonts['body_bold'])[2], y + 55), s1, font=fonts['body_bold'], fill=INK)
    draw.text((W - 90 - draw.textbbox((0, 0), s2, font=fonts['body_bold'])[2], y + 90), s2, font=fonts['body_bold'], fill=INK)
    draw.text((W - 90 - draw.textbbox((0, 0), q1, font=fonts['body'])[2], y + 150), q1, font=fonts['body'], fill=PINE_DARK)
    draw.text((W - 90 - draw.textbbox((0, 0), q2, font=fonts['body'])[2], y + 220), q2, font=fonts['body'], fill=PINE_DARK)
    
    draw_official_footer(draw, fonts, "3")
    img = apply_watermark(img)
    img.save(os.path.join(DEST_DIR, '003.webp'), 'WEBP', quality=82, method=6)
    print("Page 003 generated.")

# ==============================================================================
# 5. WORKSHEET 3: BALANCE SCALE & COMPLEX GEOMETRY (PAGE 004)
# ==============================================================================
def make_page_004():
    fonts = get_fonts()
    img = Image.new('RGB', (W, H), WHITE)
    draw = ImageDraw.Draw(img)
    y = draw_official_header(img, draw, fonts, "سلسلة تمارين 3 : كفتا الميزان والمسائل الهندسية المركبة", is_worksheet=True)
    
    # Problem 7: Balance Scale (Ahmed's Pens)
    draw.rounded_rectangle([60, y, W - 60, y + 360], radius=12, fill=WHITE, outline=PINE, width=2)
    draw.rounded_rectangle([W - 250, y, W - 60, y + 40], radius=8, fill=PINE)
    draw.text((W - 235, y + 8), ar("الوضعية السابعة"), font=fonts['h3'], fill=WHITE)
    
    s1 = ar("يملك التلميذ أحمد مبلغاً مالياً، ولديه خياران لشراء أدواته المدرسية :")
    s2 = ar("الخيار أ : شراء 5 أقلام متماثلة ويبقى معه مبلغ 3000 مليم.")
    s3 = ar("الخيار ب : شراء 3 أقلام وكتاباً ثمنه 7800 مليم بالمبلغ المتبقي دون زيادة أو نقصان.")
    q1 = ar("1) مثل الوضعية في شكل كفتي ميزان متعادلتين، ثم اختزل 3 أقلام من الطرفين.")
    q2 = ar("2) أحسب ثمن شراء القلم الواحد بالمليم ثم بالدينار.")
    q3 = ar("3) أحسب المبلغ المالي الجملي الذي يملكه أحمد بالدينار.")
    
    draw.text((W - 90 - draw.textbbox((0, 0), s1, font=fonts['body_bold'])[2], y + 50), s1, font=fonts['body_bold'], fill=INK)
    draw.text((W - 90 - draw.textbbox((0, 0), s2, font=fonts['body'])[2], y + 85), s2, font=fonts['body'], fill=INK)
    draw.text((W - 90 - draw.textbbox((0, 0), s3, font=fonts['body'])[2], y + 115), s3, font=fonts['body'], fill=INK)
    
    # Visual Balance illustration
    draw.text((800, y + 155), ar("الكفة اليمنى : 5 أقلام + 3000 مي"), font=fonts['body_bold'], fill=BLUE_BORDER)
    draw.text((570, y + 155), ar("="), font=fonts['h2'], fill=PINE_DARK)
    draw.text((220, y + 155), ar("الكفة اليسرى : 3 أقلام + 7800 مي"), font=fonts['body_bold'], fill=ORANGE_BORDER)
    
    draw.text((W - 90 - draw.textbbox((0, 0), q1, font=fonts['body'])[2], y + 205), q1, font=fonts['body'], fill=PINE_DARK)
    draw.text((W - 90 - draw.textbbox((0, 0), q2, font=fonts['body'])[2], y + 255), q2, font=fonts['body'], fill=PINE_DARK)
    draw.text((W - 90 - draw.textbbox((0, 0), q3, font=fonts['body'])[2], y + 305), q3, font=fonts['body'], fill=PINE_DARK)
    y += 380
    
    # Problem 8: Farm Fencing, Perimeter & Entrance (Uncle Mahmoud)
    draw.rounded_rectangle([60, y, W - 60, y + 360], radius=12, fill=WHITE, outline=PINE, width=2)
    draw.rounded_rectangle([W - 250, y, W - 60, y + 40], radius=8, fill=PINE)
    draw.text((W - 235, y + 8), ar("الوضعية الثامنة"), font=fonts['h3'], fill=WHITE)
    
    s1 = ar("أحاط العم محمود أرضه الفلاحية بسياج حديدي بتكلفة إجمالية قدرها 7272 ديناراً.")
    s2 = ar("ثمن شراء الأسلاك يفوق كلفة اليد العاملة بـ 1272 ديناراً، وثمن المتر الواحد من السلك 12 د.")
    s3 = ar("ترك العم محمود مدخلاً غير مسيج عرضه 4 أمتار لمرور الجرار الفلاحي.")
    q1 = ar("1) أحسب ثمن شراء أسلاك التسييج بالدينار.")
    q2 = ar("2) أحسب طول أسلاك التسييج المستعملة بالمتر.")
    q3 = ar("3) أحسب قيس محيط الأرض الفلاحية الجملي بالمتر بعد احتساب المدخل.")
    
    draw.text((W - 90 - draw.textbbox((0, 0), s1, font=fonts['body_bold'])[2], y + 50), s1, font=fonts['body_bold'], fill=INK)
    draw.text((W - 90 - draw.textbbox((0, 0), s2, font=fonts['body_bold'])[2], y + 85), s2, font=fonts['body_bold'], fill=INK)
    draw.text((W - 90 - draw.textbbox((0, 0), s3, font=fonts['body_bold'])[2], y + 120), s3, font=fonts['body_bold'], fill=INK)
    draw.text((W - 90 - draw.textbbox((0, 0), q1, font=fonts['body'])[2], y + 175), q1, font=fonts['body'], fill=PINE_DARK)
    draw.text((W - 90 - draw.textbbox((0, 0), q2, font=fonts['body'])[2], y + 235), q2, font=fonts['body'], fill=PINE_DARK)
    draw.text((W - 90 - draw.textbbox((0, 0), q3, font=fonts['body'])[2], y + 295), q3, font=fonts['body'], fill=PINE_DARK)
    y += 380
    
    # Problem 9: Square vs Rectangle Lands (Dimensions & Areas)
    draw.rounded_rectangle([60, y, W - 60, y + 320], radius=12, fill=WHITE, outline=PINE, width=2)
    draw.rounded_rectangle([W - 250, y, W - 60, y + 40], radius=8, fill=PINE)
    draw.text((W - 235, y + 8), ar("الوضعية التاسعة"), font=fonts['h3'], fill=WHITE)
    
    s1 = ar("يملك فلاح قطعتي أرض متجاورتين لهما نفس المحيط ويساوي 160 متراً لكل منهما :")
    s2 = ar("القطعة الأولى مربعة الشكل. والقطعة الثانية مستطيلة الشكل قيس عرضها ثلث طولها.")
    q1 = ar("1) أحسب قيس طول ضلع ومساحة القطعة المربعة بالمتر المربع.")
    q2 = ar("2) أحسب قيس بعدي القطعة المستطيلة (الطول والعرض) بالمتر.")
    q3 = ar("3) أحسب مساحة القطعة المستطيلة، ثم قارن بين مساحتي القطعتين.")
    
    draw.text((W - 90 - draw.textbbox((0, 0), s1, font=fonts['body_bold'])[2], y + 50), s1, font=fonts['body_bold'], fill=INK)
    draw.text((W - 90 - draw.textbbox((0, 0), s2, font=fonts['body_bold'])[2], y + 85), s2, font=fonts['body_bold'], fill=INK)
    draw.text((W - 90 - draw.textbbox((0, 0), q1, font=fonts['body'])[2], y + 140), q1, font=fonts['body'], fill=PINE_DARK)
    draw.text((W - 90 - draw.textbbox((0, 0), q2, font=fonts['body'])[2], y + 195), q2, font=fonts['body'], fill=PINE_DARK)
    draw.text((W - 90 - draw.textbbox((0, 0), q3, font=fonts['body'])[2], y + 250), q3, font=fonts['body'], fill=PINE_DARK)
    
    draw_official_footer(draw, fonts, "4")
    img = apply_watermark(img)
    img.save(os.path.join(DEST_DIR, '004.webp'), 'WEBP', quality=82, method=6)
    print("Page 004 generated.")

# ==============================================================================
# 6. CORRECTION SHEET 1 (PAGE 005)
# ==============================================================================
def make_page_005():
    fonts = get_fonts()
    img = Image.new('RGB', (W, H), WHITE)
    draw = ImageDraw.Draw(img)
    y = draw_official_header(img, draw, fonts, "دليل الإصلاح النموذجي والرسوم التوضيحية (الجزء 1)", is_worksheet=False)
    
    # Solution 1: Computer & Table
    draw.rounded_rectangle([60, y, W - 60, y + 360], radius=12, fill=GREEN_BOX, outline=GREEN_BORDER, width=2)
    s_title = ar("إصلاح الوضعية الأولى (الحاسوب والطاولة) :")
    draw.text((W - 80 - draw.textbbox((0, 0), s_title, font=fonts['h2'])[2], y + 12), s_title, font=fonts['h2'], fill=PINE_DARK)
    
    # Diagram in solution
    draw.rectangle([700, y + 55, 940, y + 90], fill=WHITE, outline=PINE_DARK, width=2)
    draw.line([(820, y + 55), (820, y + 90)], fill=PINE_DARK, width=2)
    draw.text((725, y + 60), ar("700 د (جزء)"), font=fonts['caption'], fill=PINE)
    draw.text((845, y + 60), ar("700 د (جزء)"), font=fonts['caption'], fill=PINE)
    draw.text((960, y + 60), ar("الحاسوب :"), font=fonts['body_bold'], fill=INK)
    
    draw.rectangle([820, y + 105, 940, y + 140], fill=WHITE, outline=PINE_DARK, width=2)
    draw.text((845, y + 110), ar("700 د (جزء)"), font=fonts['caption'], fill=PINE)
    draw.text((960, y + 110), ar("الطاولة :"), font=fonts['body_bold'], fill=INK)
    
    r1 = ar("• عدد الأجزاء الجملي = 2 (للحاسوب) + 1 (للطاولة) = 3 أجزاء متساوية.")
    r2 = ar("• قيمة الجزء الواحد (ثمن طاولة المكتب) = 2100 د ÷ 3 = 700 دينار.")
    r3 = ar("• ثمن شراء الحاسوب = 700 د × 2 = 1400 دينار.")
    r4 = ar("• التحقق والمراقبة : 1400 د + 700 د = 2100 دينار (مطابق تماماً لنص الوضعية).")
    
    draw.text((W - 80 - draw.textbbox((0, 0), r1, font=fonts['body_bold'])[2], y + 165), r1, font=fonts['body_bold'], fill=INK)
    draw.text((W - 80 - draw.textbbox((0, 0), r2, font=fonts['body_bold'])[2], y + 205), r2, font=fonts['body_bold'], fill=PINE_DARK)
    draw.text((W - 80 - draw.textbbox((0, 0), r3, font=fonts['body_bold'])[2], y + 245), r3, font=fonts['body_bold'], fill=PINE_DARK)
    draw.text((W - 80 - draw.textbbox((0, 0), r4, font=fonts['body'])[2], y + 295), r4, font=fonts['body'], fill=GOLD)
    y += 380
    
    # Solution 2: 3 Brothers
    draw.rounded_rectangle([60, y, W - 60, y + 360], radius=12, fill=WHITE, outline=RULE, width=2)
    s_title = ar("إصلاح الوضعية الثانية (اقتسام المبلغ بين الإخوة الثلاثة) :")
    draw.text((W - 80 - draw.textbbox((0, 0), s_title, font=fonts['h2'])[2], y + 12), s_title, font=fonts['h2'], fill=PINE_DARK)
    
    r1 = ar("• تمثيل المعطيات وتحديد الأجزاء :")
    r2 = ar("  - مريم : جزء واحد [ 1 ]")
    r3 = ar("  - حسام : ضعف مريم = [ 2 أجزاء ]")
    r4 = ar("  - علي : ضعف حسام = 2 × 2 = [ 4 أجزاء ]")
    r5 = ar("• عدد الأجزاء الكلي = 1 + 2 + 4 = 7 أجزاء متساوية.")
    r6 = ar("• قيمة الجزء الواحد (نصيب مريم) = 840 د ÷ 7 = 120 ديناراً.")
    r7 = ar("• نصيب حسام = 120 د × 2 = 240 ديناراً.")
    r8 = ar("• نصيب علي = 240 د × 2 = 480 ديناراً (أو 120 × 4 = 480 د).")
    r9 = ar("• التحقق : 120 د + 240 د + 480 د = 840 ديناراً.")
    
    draw.text((W - 80 - draw.textbbox((0, 0), r1, font=fonts['body_bold'])[2], y + 55), r1, font=fonts['body_bold'], fill=INK)
    draw.text((W - 100 - draw.textbbox((0, 0), r2, font=fonts['body'])[2], y + 85), r2, font=fonts['body'], fill=INK)
    draw.text((W - 100 - draw.textbbox((0, 0), r3, font=fonts['body'])[2], y + 115), r3, font=fonts['body'], fill=INK)
    draw.text((W - 100 - draw.textbbox((0, 0), r4, font=fonts['body'])[2], y + 145), r4, font=fonts['body'], fill=INK)
    draw.text((W - 80 - draw.textbbox((0, 0), r5, font=fonts['body_bold'])[2], y + 180), r5, font=fonts['body_bold'], fill=PINE)
    draw.text((W - 80 - draw.textbbox((0, 0), r6, font=fonts['body_bold'])[2], y + 215), r6, font=fonts['body_bold'], fill=PINE_DARK)
    draw.text((W - 80 - draw.textbbox((0, 0), r7, font=fonts['body_bold'])[2], y + 250), r7, font=fonts['body_bold'], fill=PINE_DARK)
    draw.text((W - 80 - draw.textbbox((0, 0), r8, font=fonts['body_bold'])[2], y + 285), r8, font=fonts['body_bold'], fill=PINE_DARK)
    draw.text((W - 80 - draw.textbbox((0, 0), r9, font=fonts['body'])[2], y + 320), r9, font=fonts['body'], fill=GOLD)
    y += 380
    
    # Solution 3: Farm Trees
    draw.rounded_rectangle([60, y, W - 60, y + 280], radius=12, fill=WHITE, outline=RULE, width=2)
    s_title = ar("إصلاح الوضعية الثالثة (أشجار الزيتون والبرتقال) :")
    draw.text((W - 80 - draw.textbbox((0, 0), s_title, font=fonts['h2'])[2], y + 12), s_title, font=fonts['h2'], fill=PINE_DARK)
    
    r1 = ar("• عدد الأجزاء الكلي = 1 (برتقال) + 4 (زيتون) = 5 أجزاء متساوية.")
    r2 = ar("• عدد أشجار البرتقال (قيمة الجزء الواحد) = 1500 ÷ 5 = 300 شجرة.")
    r3 = ar("• عدد أشجار الزيتون = 300 × 4 = 1200 شجرة.")
    r4 = ar("• التحقق : 300 + 1200 = 1500 شجرة مثمرة.")
    
    draw.text((W - 80 - draw.textbbox((0, 0), r1, font=fonts['body_bold'])[2], y + 60), r1, font=fonts['body_bold'], fill=INK)
    draw.text((W - 80 - draw.textbbox((0, 0), r2, font=fonts['body_bold'])[2], y + 105), r2, font=fonts['body_bold'], fill=PINE_DARK)
    draw.text((W - 80 - draw.textbbox((0, 0), r3, font=fonts['body_bold'])[2], y + 150), r3, font=fonts['body_bold'], fill=PINE_DARK)
    draw.text((W - 80 - draw.textbbox((0, 0), r4, font=fonts['body'])[2], y + 200), r4, font=fonts['body'], fill=GOLD)
    
    draw_official_footer(draw, fonts, "5")
    img = apply_watermark(img)
    img.save(os.path.join(DEST_DIR, '005.webp'), 'WEBP', quality=82, method=6)
    print("Page 005 generated.")

# ==============================================================================
# 7. CORRECTION SHEET 2 (PAGE 006)
# ==============================================================================
def make_page_006():
    fonts = get_fonts()
    img = Image.new('RGB', (W, H), WHITE)
    draw = ImageDraw.Draw(img)
    y = draw_official_header(img, draw, fonts, "دليل الإصلاح النموذجي والرسوم التوضيحية (الجزء 2)", is_worksheet=False)
    
    # Solution 4: Flowers
    draw.rounded_rectangle([60, y, W - 60, y + 360], radius=12, fill=BLUE_BOX, outline=BLUE_BORDER, width=2)
    s_title = ar("إصلاح الوضعية الرابعة (باقتي الأزهار والمجموع والفارق) :")
    draw.text((W - 80 - draw.textbbox((0, 0), s_title, font=fonts['h2'])[2], y + 12), s_title, font=fonts['h2'], fill=PINE_DARK)
    
    r1 = ar("• ثمن الباقة الصفراء (الكمية الكبرى) = (المجموع + الفارق) ÷ 2")
    r2 = ar("  الحساب : (62 د + 14 د) ÷ 2 = 76 د ÷ 2 = 38 ديناراً.")
    r3 = ar("• ثمن الباقة الحمراء (الكمية الصغرى) = (المجموع - الفارق) ÷ 2")
    r4 = ar("  الحساب : (62 د - 14 د) ÷ 2 = 48 د ÷ 2 = 24 ديناراً.")
    r5 = ar("  (طريقة ثانية لحساب ثمن الحمراء : 38 د - 14 د = 24 ديناراً).")
    r6 = ar("• التحقق : 38 د + 24 د = 62 ديناراً.")
    
    draw.text((W - 80 - draw.textbbox((0, 0), r1, font=fonts['body_bold'])[2], y + 60), r1, font=fonts['body_bold'], fill=INK)
    draw.text((W - 100 - draw.textbbox((0, 0), r2, font=fonts['body_bold'])[2], y + 95), r2, font=fonts['body_bold'], fill=PINE_DARK)
    draw.text((W - 80 - draw.textbbox((0, 0), r3, font=fonts['body_bold'])[2], y + 145), r3, font=fonts['body_bold'], fill=INK)
    draw.text((W - 100 - draw.textbbox((0, 0), r4, font=fonts['body_bold'])[2], y + 180), r4, font=fonts['body_bold'], fill=PINE_DARK)
    draw.text((W - 100 - draw.textbbox((0, 0), r5, font=fonts['body'])[2], y + 220), r5, font=fonts['body'], fill=INK)
    draw.text((W - 80 - draw.textbbox((0, 0), r6, font=fonts['body_bold'])[2], y + 270), r6, font=fonts['body_bold'], fill=GOLD)
    y += 380
    
    # Solution 7: Balance Scale & Ahmed's Pens
    draw.rounded_rectangle([60, y, W - 60, y + 360], radius=12, fill=ORANGE_BOX, outline=ORANGE_BORDER, width=2)
    s_title = ar("إصلاح الوضعية السابعة (كفتا الميزان وشراء الأقلام) :")
    draw.text((W - 80 - draw.textbbox((0, 0), s_title, font=fonts['h2'])[2], y + 12), s_title, font=fonts['h2'], fill=PINE_DARK)
    
    r1 = ar("• معادلة التوازن : (5 أقلام + 3000 مليم) = (3 أقلام + 7800 مليم)")
    r2 = ar("• بحذف 3 أقلام متماثلة من الكفتين بالتساوي (طريقة الاختزال) :")
    r3 = ar("  نحصل على : قلمان + 3000 مليم = 7800 مليم.")
    r4 = ar("• ثمن القلمين = 7800 مليم - 3000 مليم = 4800 مليم.")
    r5 = ar("• ثمن القلم الواحد = 4800 مليم ÷ 2 = 2400 مليم = 2,400 دينار.")
    r6 = ar("• المبلغ المالي الجملي الذي يملكه أحمد :")
    r7 = ar("  بتطبيق الخيار أ : (5 × 2400 مليم) + 3000 مليم = 12000 + 3000 = 15000 مليم = 15 ديناراً.")
    r8 = ar("  بتطبيق الخيار ب للتأكد : (3 × 2400 مليم) + 7800 مليم = 7200 + 7800 = 15000 مليم = 15 ديناراً.")
    
    draw.text((W - 80 - draw.textbbox((0, 0), r1, font=fonts['body_bold'])[2], y + 55), r1, font=fonts['body_bold'], fill=INK)
    draw.text((W - 80 - draw.textbbox((0, 0), r2, font=fonts['body'])[2], y + 90), r2, font=fonts['body'], fill=INK)
    draw.text((W - 100 - draw.textbbox((0, 0), r3, font=fonts['body_bold'])[2], y + 120), r3, font=fonts['body_bold'], fill=PINE)
    draw.text((W - 80 - draw.textbbox((0, 0), r4, font=fonts['body_bold'])[2], y + 155), r4, font=fonts['body_bold'], fill=INK)
    draw.text((W - 80 - draw.textbbox((0, 0), r5, font=fonts['body_bold'])[2], y + 190), r5, font=fonts['body_bold'], fill=PINE_DARK)
    draw.text((W - 80 - draw.textbbox((0, 0), r6, font=fonts['body_bold'])[2], y + 230), r6, font=fonts['body_bold'], fill=INK)
    draw.text((W - 100 - draw.textbbox((0, 0), r7, font=fonts['body'])[2], y + 265), r7, font=fonts['body'], fill=INK)
    draw.text((W - 100 - draw.textbbox((0, 0), r8, font=fonts['body_bold'])[2], y + 295), r8, font=fonts['body_bold'], fill=GOLD)
    y += 380
    
    # Solution 8 & 9: Geometry
    draw.rounded_rectangle([60, y, W - 60, y + 360], radius=12, fill=WHITE, outline=RULE, width=2)
    s_title = ar("إصلاح الوضعية الثامنة والتاسعة (المسائل الهندسية والمحيط) :")
    draw.text((W - 80 - draw.textbbox((0, 0), s_title, font=fonts['h2'])[2], y + 12), s_title, font=fonts['h2'], fill=PINE_DARK)
    
    r1 = ar("• تسييج أرض العم محمود :")
    r2 = ar("  - ثمن شراء الأسلاك = (7272 د + 1272 د) ÷ 2 = 8544 ÷ 2 = 4272 ديناراً.")
    r3 = ar("  - طول أسلاك التسييج = 4272 د ÷ 12 د = 356 متراً.")
    r4 = ar("  - قيس محيط الأرض الجملي = طول الأسلاك + عرض المدخل = 356 م + 4 م = 360 متراً.")
    r5 = ar("• قطعتي الأرض (محيط كل منهما 160 متراً) :")
    r6 = ar("  - القطعة المربعة : طول الضلع = 160 م ÷ 4 = 40 متراً. المساحة = 40 × 40 = 1600 م².")
    r7 = ar("  - القطعة المستطيلة : نصف المحيط = 160 ÷ 2 = 80 م (مقسم إلى 1 + 3 = 4 أجزاء).")
    r8 = ar("    قيمة الجزء (العرض) = 80 ÷ 4 = 20 م. قيس الطول = 20 × 3 = 60 متراً.")
    r9 = ar("    مساحة المستطيل = 60 م × 20 م = 1200 م²  ◀  (مساحة المربع أكبر من مساحة المستطيل بـ 400 م²).")
    
    draw.text((W - 80 - draw.textbbox((0, 0), r1, font=fonts['body_bold'])[2], y + 50), r1, font=fonts['body_bold'], fill=INK)
    draw.text((W - 100 - draw.textbbox((0, 0), r2, font=fonts['body'])[2], y + 80), r2, font=fonts['body'], fill=INK)
    draw.text((W - 100 - draw.textbbox((0, 0), r3, font=fonts['body_bold'])[2], y + 110), r3, font=fonts['body_bold'], fill=PINE)
    draw.text((W - 100 - draw.textbbox((0, 0), r4, font=fonts['body_bold'])[2], y + 140), r4, font=fonts['body_bold'], fill=PINE_DARK)
    draw.text((W - 80 - draw.textbbox((0, 0), r5, font=fonts['body_bold'])[2], y + 180), r5, font=fonts['body_bold'], fill=INK)
    draw.text((W - 100 - draw.textbbox((0, 0), r6, font=fonts['body'])[2], y + 210), r6, font=fonts['body'], fill=INK)
    draw.text((W - 100 - draw.textbbox((0, 0), r7, font=fonts['body'])[2], y + 240), r7, font=fonts['body'], fill=INK)
    draw.text((W - 100 - draw.textbbox((0, 0), r8, font=fonts['body'])[2], y + 270), r8, font=fonts['body'], fill=INK)
    draw.text((W - 100 - draw.textbbox((0, 0), r9, font=fonts['body_bold'])[2], y + 300), r9, font=fonts['body_bold'], fill=GOLD)
    
    draw_official_footer(draw, fonts, "6")
    img = apply_watermark(img)
    img.save(os.path.join(DEST_DIR, '006.webp'), 'WEBP', quality=82, method=6)
    print("Page 006 generated.")

# ==============================================================================
# 8. BACK COVER
# ==============================================================================
def make_back_cover():
    fonts = get_fonts()
    img = Image.new('RGB', (W, H), PAPER)
    draw = ImageDraw.Draw(img)
    
    # Outer Border
    draw.rectangle([40, 40, W - 40, H - 40], outline=RULE, width=2)
    draw.rectangle([46, 46, W - 46, H - 46], outline=PINE, width=1)
    
    # Header Banner
    draw.rectangle([46, 46, W - 46, 260], fill=PINE_DARK)
    if os.path.exists(LOGO_PATH):
        logo = Image.open(LOGO_PATH).convert('RGB').resize((100, 100), Image.Resampling.LANCZOS)
        img.paste(logo, (80, 80))
        draw.rectangle([80, 80, 180, 180], outline=GOLD_HI, width=2)
        
    t1 = ar("مدرستي تونس · منصة الموارد التعليمية التونسية")
    draw.text((W - 80 - draw.textbbox((0, 0), t1, font=fonts['title'])[2], 85), t1, font=fonts['title'], fill=WHITE)
    t2 = ar("فضاء الدعم المدرسي، التقييم، وتوزيع المذكرات والامتحانات الرسمية")
    draw.text((W - 80 - draw.textbbox((0, 0), t2, font=fonts['body'])[2], 145), t2, font=fonts['body'], fill=GOLD_HI)
    
    # Pedagogical Mission Card
    draw.rounded_rectangle([80, 320, W - 80, 780], radius=16, fill=WHITE, outline=RULE, width=2)
    b_title = ar("أهداف هذه السلسلة البيداغوجية :")
    draw.text((W - 120 - draw.textbbox((0, 0), b_title, font=fonts['h2'])[2], 350), b_title, font=fonts['h2'], fill=PINE_DARK)
    
    bullets = [
        "تجاوز الصعوبات القرائية والحسابية عبر التحويل المباشر لنص المسألة إلى رسم هندسي بسيط.",
        "تمكين التلميذ من استنتاج خطة الحل بنفسه وتحديد قيمة الجزء المجهول بوضوح.",
        "تأهيل تلاميذ السنة الخامسة لاجتياز مناظرة الدخول إلى المدارس الإعدادية النموذجية (السيزيام).",
        "توفير أداة بيداغوجية موثوقة للأولياء والمربين تضمن المتابعة المنزلية الدقيقة."
    ]
    by = 415
    for b in bullets:
        b_ar = ar("✔  " + b)
        draw.text((W - 130 - draw.textbbox((0, 0), b_ar, font=fonts['body'])[2], by), b_ar, font=fonts['body'], fill=INK)
        by += 70
        
    # QR / Digital Access Badge
    draw.rounded_rectangle([80, 820, W - 80, 1160], radius=16, fill=PAPER_2, outline=PINE, width=2)
    qr_title = ar("الوصول الرقمي والطباعة بجودة A4 :")
    draw.text(((W - draw.textbbox((0, 0), qr_title, font=fonts['h2'])[2]) // 2, 850), qr_title, font=fonts['h2'], fill=PINE_DARK)
    
    q_txt1 = ar("يمكنكم تصفح، تنزيل، وطباعة هذه السلسلة وكافة امتحانات السنة الخامسة مجاناً عبر المنصة :")
    draw.text(((W - draw.textbbox((0, 0), q_txt1, font=fonts['body'])[2]) // 2, 910), q_txt1, font=fonts['body'], fill=INK)
    
    site_url = "www.madrastihub.com"
    draw.text(((W - draw.textbbox((0, 0), site_url, font=fonts['title_xl'])[2]) // 2, 970), site_url, font=fonts['title_xl'], fill=PINE)
    
    q_txt2 = ar("مشاركة مباشرة بضغطة زر واحدة عبر مجموعات الواتساب وقنوات المربين والأولياء.")
    draw.text(((W - draw.textbbox((0, 0), q_txt2, font=fonts['caption'])[2]) // 2, 1060), q_txt2, font=fonts['caption'], fill=INK)
    
    # Official Legal / Ministry note
    draw.rounded_rectangle([80, 1200, W - 80, 1480], radius=16, fill=WHITE, outline=RULE, width=2)
    leg1 = ar("وثيقة تربوية مصادق عليها ومطابقة لبرامج وزارة التربية التونسية")
    leg2 = ar("المحتوى الأصلي : المربي محمد علي · التنسيق والرقمة والتصميم : مدرستي تونس 2025 - 2026")
    leg3 = ar("حقوق الطبع محفوظة لمنصة مدرستي تونس · يسمح بالاستعمال التربوي والطباعة المدرسية المجانية")
    draw.text(((W - draw.textbbox((0, 0), leg1, font=fonts['h3'])[2]) // 2, 1250), leg1, font=fonts['h3'], fill=PINE_DARK)
    draw.text(((W - draw.textbbox((0, 0), leg2, font=fonts['body_bold'])[2]) // 2, 1310), leg2, font=fonts['body_bold'], fill=INK)
    draw.text(((W - draw.textbbox((0, 0), leg3, font=fonts['caption'])[2]) // 2, 1370), leg3, font=fonts['caption'], fill=GOLD)
    
    # Footer
    draw_official_footer(draw, fonts, "غلاف خلفي")
    img = apply_watermark(img)
    img.save(os.path.join(DEST_DIR, 'back-cover.webp'), 'WEBP', quality=82, method=6)
    print("Back cover generated.")

# ==============================================================================
# 9. GENERATE MANIFEST AND UPDATE GLOBAL INDEX
# ==============================================================================
def create_manifest_and_register():
    manifest_rel_dir = "assets/resources/5eme-annee/parascolaire/trimestre-1/resoudre-problemes-par-graphiques"
    manifest_path = os.path.join(DEST_DIR, 'manifest.json')
    
    items = [
        {
            "id": "graphical-math-p001",
            "grade": "5eme-annee",
            "subject": "Mathématiques",
            "subSubject": "parascolaire",
            "trimester": 1,
            "topic": "resoudre-problemes-par-graphiques",
            "title": "بطاقة منهجية : القواعد الذهبية لتوظيف الرسوم البيانية",
            "file": "001.webp",
            "relPath": f"{manifest_rel_dir}/001.webp",
            "lang": "ar",
            "ref": "المربي محمد علي - مدرستي تونس p.1",
            "labels": ["parascolaire", "5eme-annee", "mathématiques", "رسوم بيانية", "منهجية"]
        },
        {
            "id": "graphical-math-p002",
            "grade": "5eme-annee",
            "subject": "Mathématiques",
            "subSubject": "parascolaire",
            "trimester": 1,
            "topic": "resoudre-problemes-par-graphiques",
            "title": "تمارين تطبيقية : مسائل المجموع والأجزاء المتناسبة",
            "file": "002.webp",
            "relPath": f"{manifest_rel_dir}/002.webp",
            "lang": "ar",
            "ref": "المربي محمد علي - مدرستي تونس p.2",
            "labels": ["parascolaire", "5eme-annee", "mathématiques", "أجزاء متناسبة"]
        },
        {
            "id": "graphical-math-p003",
            "grade": "5eme-annee",
            "subject": "Mathématiques",
            "subSubject": "parascolaire",
            "trimester": 1,
            "topic": "resoudre-problemes-par-graphiques",
            "title": "تمارين تطبيقية : مسائل المجموع والفارق والتمثيل الشريطي",
            "file": "003.webp",
            "relPath": f"{manifest_rel_dir}/003.webp",
            "lang": "ar",
            "ref": "المربي محمد علي - مدرستي تونس p.3",
            "labels": ["parascolaire", "5eme-annee", "mathématiques", "المجموع والفارق"]
        },
        {
            "id": "graphical-math-p004",
            "grade": "5eme-annee",
            "subject": "Mathématiques",
            "subSubject": "parascolaire",
            "trimester": 1,
            "topic": "resoudre-problemes-par-graphiques",
            "title": "تمارين تطبيقية : كفتا الميزان والاختزال والمسائل الهندسية",
            "file": "004.webp",
            "relPath": f"{manifest_rel_dir}/004.webp",
            "lang": "ar",
            "ref": "المربي محمد علي - مدرستي تونس p.4",
            "labels": ["parascolaire", "5eme-annee", "mathématiques", "كفتا الميزان", "هندسة"]
        },
        {
            "id": "graphical-math-p005",
            "grade": "5eme-annee",
            "subject": "Mathématiques",
            "subSubject": "parascolaire",
            "trimester": 1,
            "topic": "resoudre-problemes-par-graphiques",
            "title": "دليل الإصلاح النموذجي والرسوم التوضيحية (الجزء 1)",
            "file": "005.webp",
            "relPath": f"{manifest_rel_dir}/005.webp",
            "lang": "ar",
            "ref": "المربي محمد علي - مدرستي تونس p.5",
            "labels": ["parascolaire", "5eme-annee", "mathématiques", "إصلاح مفصل"]
        },
        {
            "id": "graphical-math-p006",
            "grade": "5eme-annee",
            "subject": "Mathématiques",
            "subSubject": "parascolaire",
            "trimester": 1,
            "topic": "resoudre-problemes-par-graphiques",
            "title": "دليل الإصلاح النموذجي والرسوم التوضيحية (الجزء 2)",
            "file": "006.webp",
            "relPath": f"{manifest_rel_dir}/006.webp",
            "lang": "ar",
            "ref": "المربي محمد علي - مدرستي تونس p.6",
            "labels": ["parascolaire", "5eme-annee", "mathématiques", "إصلاح مفصل"]
        }
    ]
    
    manifest_data = {
        "source": "MadrasatiTN Parascolaire",
        "bookId": "5eme-annee/resoudre-problemes-par-graphiques",
        "title": "توظيف الرسوم والمخططات البيانية في حل المسائل الرياضية — السنة 5",
        "grade": "5ème Année",
        "subject": "Mathématiques",
        "cover": f"{manifest_rel_dir}/cover.webp",
        "backCover": f"{manifest_rel_dir}/back-cover.webp",
        "count": len(items),
        "items": items,
        "exerciseCount": 9,
        "solvedCount": 9,
        "notes": "سلسلة بيداغوجية كاملة: بطاقة منهجية، 9 وضعيات متدرجة مع مخططات شريطية، وإصلاح نموذجي مفصل مدعم بالرسوم."
    }
    
    with open(manifest_path, 'w', encoding='utf-8') as f:
        json.dump(manifest_data, f, ensure_ascii=False, indent=2)
    print(f"Manifest written to {manifest_path}")
    
    # Register in public/assets/resources/index.json
    index_path = os.path.join('public', 'assets', 'resources', 'index.json')
    with open(index_path, 'r', encoding='utf-8') as f:
        idx = json.load(f)
        
    entry = f"{manifest_rel_dir}/manifest.json"
    if entry not in idx.get("manifests", []):
        idx["manifests"].append(entry)
        with open(index_path, 'w', encoding='utf-8') as f:
            json.dump(idx, f, ensure_ascii=False, indent=2)
        print(f"Registered {entry} in {index_path}")
    else:
        print(f"{entry} already registered in {index_path}")

def main():
    print("Generating Madrasati TN Rebranded Graphical Math Series...")
    make_cover()
    make_page_001()
    make_page_002()
    make_page_003()
    make_page_004()
    make_page_005()
    make_page_006()
    make_back_cover()
    create_manifest_and_register()
    print("ALL ASSETS SUCCESSFULLY GENERATED & REGISTERED.")

if __name__ == '__main__':
    main()
