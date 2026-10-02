"""Extract all official CNP primary recitations / poems (محفوظات) across 1ère to 6ème année.

Adheres strictly to the Educational Asset Folder & Metadata Standard:
- Path: public/assets/resources/<grade>/arabe/<trimester>/recitation/
- Format: .webp (q82, method 6, max width 1600px)
- Manifest: manifest.json with full schema
- Global Index: public/assets/resources/index.json
"""
import os
import json
import shutil
import fitz
import sys
from PIL import Image

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

MAX_WIDTH = 1600
QUALITY = 82
PUBLIC = "public"
INDEX_PATH = os.path.join(PUBLIC, "assets", "resources", "index.json")

# ─────────────────────────────────────────────────────────────────────────────
# VERIFIED recitation set (audited 2026-10-03 by visual inspection of each page).
#
# Every entry below was confirmed to be a genuine محفوظات / نشيد / قصيد page
# (verse lines, poem title, poet attribution). 29 earlier entries were dropped
# because their page numbers pointed at adjacent reading-comprehension / letter /
# exercise pages (نص قراءة with an الأسئلة box) — NOT poems. Only add an item
# here after eyeballing the rendered page: wrong page numbers are the #1 failure.
#
# RULE (from the owner): nothing enters the library unless it is well classified.
# The extractor is self-cleaning — any recitation file/dir NOT produced from this
# list is purged on each run (see purge_stale_recitations), so re-running can
# never resurrect a mis-classified page.
# ─────────────────────────────────────────────────────────────────────────────
RECITATIONS = [
    # ─── 1ÈRE ANNÉE (CNP 101110) ───
    {
        'grade': '1ere-annee', 'grade_short': '1ere', 'code': '101110', 'part': 'P00',
        'trimester_num': 3, 'trimester_slug': 'trimestre-3',
        'book_pdf': '_sources/101110_P00.pdf', 'url': 'https://www.cnp.com.tn/arabic/PDF/101110P00.pdf',
        'items': [
            {'page': 108, 'title': 'عيد الأمهات (نشيد)', 'slug': 'eid_al_ommahat'},
        ]
    },

    # ─── 2ÈME ANNÉE (CNP 101215) ───
    {
        'grade': '2eme-annee', 'grade_short': '2eme', 'code': '101215', 'part': 'P00',
        'trimester_num': 1, 'trimester_slug': 'trimestre-1',
        'book_pdf': '_sources/101215_P00.pdf', 'url': 'https://www.cnp.com.tn/arabic/PDF/101215P00.pdf',
        'items': [
            {'page': 16, 'title': 'العود إلى المدرسة (محفوظات)', 'slug': 'al_awd_ila_al_madrasa'},
        ]
    },
    {
        'grade': '2eme-annee', 'grade_short': '2eme', 'code': '101215', 'part': 'P00',
        'trimester_num': 3, 'trimester_slug': 'trimestre-3',
        'book_pdf': '_sources/101215_P00.pdf', 'url': 'https://www.cnp.com.tn/arabic/PDF/101215P00.pdf',
        'items': [
            {'page': 108, 'title': 'شهر رمضان (نشيد)', 'slug': 'shahr_ramadan'},
        ]
    },

    # ─── 3ÈME ANNÉE (CNP 101315 P01 & P02) ───
    {
        'grade': '3eme-annee', 'grade_short': '3eme', 'code': '101315', 'part': 'P01',
        'trimester_num': 1, 'trimester_slug': 'trimestre-1',
        'book_pdf': '_sources/101315_P01.pdf', 'url': 'https://www.cnp.com.tn/arabic/PDF/101315P01.pdf',
        'items': [
            {'page': 16, 'title': 'شكوى (قصيد)', 'slug': 'shakwa'},
            {'page': 36, 'title': 'الفلاح (قصيد)', 'slug': 'al_fallah'},
            {'page': 56, 'title': 'أغنية (قصيد)', 'slug': 'oughniya'},
        ]
    },
    {
        'grade': '3eme-annee', 'grade_short': '3eme', 'code': '101315', 'part': 'P01',
        'trimester_num': 2, 'trimester_slug': 'trimestre-2',
        'book_pdf': '_sources/101315_P01.pdf', 'url': 'https://www.cnp.com.tn/arabic/PDF/101315P01.pdf',
        'items': [
            {'page': 78, 'title': 'الحمامة والنملة (قصيد)', 'slug': 'al_hamama_wa_an_namla', 'pdf': '_sources/101315_P01.pdf'},
        ]
    },

    # ─── 4ÈME ANNÉE (CNP 101410) ───
    {
        'grade': '4eme-annee', 'grade_short': '4eme', 'code': '101410', 'part': 'P00',
        'trimester_num': 1, 'trimester_slug': 'trimestre-1',
        'book_pdf': '_sources/101410_P00.pdf', 'url': 'https://www.cnp.com.tn/arabic/PDF/101410P00.pdf',
        'items': [
            {'page': 9, 'title': 'نشيد النحل (قصيد)', 'slug': 'nasheed_an_nahl'},
        ]
    },
    {
        'grade': '4eme-annee', 'grade_short': '4eme', 'code': '101410', 'part': 'P00',
        'trimester_num': 2, 'trimester_slug': 'trimestre-2',
        'book_pdf': '_sources/101410_P00.pdf', 'url': 'https://www.cnp.com.tn/arabic/PDF/101410P00.pdf',
        'items': [
            {'page': 110, 'title': 'أمي (محفوظات)', 'slug': 'ommi_4'},
        ]
    },
    {
        'grade': '4eme-annee', 'grade_short': '4eme', 'code': '101410', 'part': 'P00',
        'trimester_num': 3, 'trimester_slug': 'trimestre-3',
        'book_pdf': '_sources/101410_P00.pdf', 'url': 'https://www.cnp.com.tn/arabic/PDF/101410P00.pdf',
        'items': [
            {'page': 131, 'title': 'الكلب والحمامة (قصيد)', 'slug': 'al_kalb_wa_al_hamama'},
            {'page': 152, 'title': 'النهر المتجمد (شعر)', 'slug': 'an_nahr_al_moutajammid'},
        ]
    },

    # ─── 5ÈME ANNÉE (CNP 101509) ───
    {
        'grade': '5eme-annee', 'grade_short': '5eme', 'code': '101509', 'part': 'P00',
        'trimester_num': 1, 'trimester_slug': 'trimestre-1',
        'book_pdf': '_sources/101509_P00.pdf', 'url': 'https://www.cnp.com.tn/arabic/PDF/101509P00.pdf',
        'items': [
            {'page': 16, 'title': 'القُبّرة وابنها (قصيدة)', 'slug': 'al_qoubbara_wa_ibnouha'},
            {'page': 36, 'title': 'نصيحة أب (قصيدة)', 'slug': 'naseehat_ab'},
            {'page': 57, 'title': 'العنزة وابنها (قصيدة)', 'slug': 'al_anza_wa_ibnouha'},
        ]
    },
    {
        'grade': '5eme-annee', 'grade_short': '5eme', 'code': '101509', 'part': 'P00',
        'trimester_num': 2, 'trimester_slug': 'trimestre-2',
        'book_pdf': '_sources/101509_P00.pdf', 'url': 'https://www.cnp.com.tn/arabic/PDF/101509P00.pdf',
        'items': [
            {'page': 78, 'title': 'حنوّ الجدّة (قصيدة)', 'slug': 'hinw_al_jadda'},
            {'page': 99, 'title': 'زهرة اللوز (قصيدة)', 'slug': 'zahrat_al_lawz'},
            {'page': 122, 'title': 'كم تشتكي (قصيدة)', 'slug': 'kam_tashtaki'},
        ]
    },
    {
        'grade': '5eme-annee', 'grade_short': '5eme', 'code': '101509', 'part': 'P00',
        'trimester_num': 3, 'trimester_slug': 'trimestre-3',
        'book_pdf': '_sources/101509_P00.pdf', 'url': 'https://www.cnp.com.tn/arabic/PDF/101509P00.pdf',
        'items': [
            {'page': 144, 'title': 'القاطرة (قصيدة)', 'slug': 'al_qatira'},
            {'page': 166, 'title': 'علي الخوان (قصيدة)', 'slug': 'ala_al_khiwan'},
        ]
    },

    # ─── 6ÈME ANNÉE (CNP 101611) ───
    {
        'grade': '6eme-annee', 'grade_short': '6eme', 'code': '101611', 'part': 'P00',
        'trimester_num': 1, 'trimester_slug': 'trimestre-1',
        'book_pdf': '_sources/101611_P00.pdf', 'url': 'https://www.cnp.com.tn/arabic/PDF/101611P00.pdf',
        'items': [
            {'page': 73, 'title': 'الربيع (شعر)', 'slug': 'ar_rabii_6'},
        ]
    },
    {
        'grade': '6eme-annee', 'grade_short': '6eme', 'code': '101611', 'part': 'P00',
        'trimester_num': 2, 'trimester_slug': 'trimestre-2',
        'book_pdf': '_sources/101611_P00.pdf', 'url': 'https://www.cnp.com.tn/arabic/PDF/101611P00.pdf',
        'items': [
            {'page': 108, 'title': 'الذئب والكلب (قصيد)', 'slug': 'ath_thieb_wa_al_kalb'},
            {'page': 157, 'title': 'الراديو (شعر)', 'slug': 'ar_radio'},
            {'page': 191, 'title': 'إلى أبناء المدارس (قصيدة)', 'slug': 'ila_abnaa_al_madaris'},
        ]
    }
]

def render_and_save_webp(pdf_path, page_num, dest_path):
    doc = fitz.open(pdf_path)
    # 0-indexed page in PyMuPDF
    page = doc[page_num - 1]
    pix = page.get_pixmap(dpi=150)
    
    # Save pixmap to temporary PNG or convert directly with PIL
    from io import BytesIO
    png_bytes = pix.tobytes("png")
    doc.close()
    
    img = Image.open(BytesIO(png_bytes))
    if img.width > MAX_WIDTH:
        ratio = MAX_WIDTH / img.width
        img = img.resize((MAX_WIDTH, round(img.height * ratio)), Image.LANCZOS)
    if img.mode in ("RGBA", "P"):
        img = img.convert("RGB")
    
    img.save(dest_path, "WEBP", quality=QUALITY, method=6)

def purge_stale_recitations(expected_files, expected_dirs):
    """Remove any recitation asset NOT produced by the verified list.

    expected_files : set of absolute .webp paths this run wrote
    expected_dirs  : set of recitation dir paths this run touched (kept)
    Returns the list of manifest relPaths that should survive in the index.
    """
    import glob
    survivors = set()
    res_root = os.path.join(PUBLIC, "assets", "resources")
    for mpath in glob.glob(os.path.join(res_root, "*", "arabe", "*", "recitation", "manifest.json")):
        rec_dir = os.path.dirname(mpath)
        if rec_dir not in expected_dirs:
            # Whole directory is stale (grade/trimester dropped from verified list)
            shutil.rmtree(rec_dir)
            print(f"[purge] removed stale dir {rec_dir}")
            continue
        # Dir is kept — drop any .webp that is not an expected verified file
        for webp in glob.glob(os.path.join(rec_dir, "*.webp")):
            if webp not in expected_files:
                os.remove(webp)
                print(f"[purge] removed stale file {webp}")
        rel = os.path.relpath(mpath, PUBLIC).replace(os.sep, "/")
        survivors.add("assets/" + rel.split("assets/", 1)[1] if "assets/" in rel else rel)
    return survivors


def main():
    with open(INDEX_PATH, encoding="utf-8") as f:
        global_index = json.load(f)

    manifest_list = global_index.get("manifests", [])
    total_extracted = 0
    expected_files = set()
    expected_dirs = set()

    for group in RECITATIONS:
        grade = group['grade']
        trimester_slug = group['trimester_slug']
        topic = 'recitation'
        target_dir = os.path.join(PUBLIC, "assets", "resources", grade, "arabe", trimester_slug, topic)
        os.makedirs(target_dir, exist_ok=True)
        expected_dirs.add(target_dir)

        manifest_rel = f"assets/resources/{grade}/arabe/{trimester_slug}/{topic}/manifest.json"
        manifest_items = []
        
        for item in group['items']:
            pdf = item.get('pdf', group['book_pdf'])
            url = item.get('url', group['url'])
            p_num = item['page']
            filename = f"recitation_{group['grade_short']}_t{group['trimester_num']}_p{p_num:03d}_{item['slug']}.webp"
            dest_file = os.path.join(target_dir, filename)
            
            print(f"[{grade} | T{group['trimester_num']}] Extracting '{item['title']}' (p.{p_num})...")
            render_and_save_webp(pdf, p_num, dest_file)
            expected_files.add(dest_file)
            total_extracted += 1
            
            manifest_items.append({
                'id': f"cnp-{group['code']}-recitation-p{p_num:03d}",
                'grade': grade,
                'subject': 'arabe',
                'subSubject': 'recitation',
                'trimester': group['trimester_num'],
                'topic': topic,
                'title': item['title'],
                'file': filename,
                'relPath': f"assets/resources/{grade}/arabe/{trimester_slug}/{topic}/{filename}",
                'lang': 'ar',
                'ref': f"{url}#page={p_num}",
                'labels': ['cnp', group['code'], 'arabe', 'recitation', 'محفوظات', 'شعر', grade]
            })

        # Write manifest.json
        manifest_path = os.path.join(target_dir, 'manifest.json')
        with open(manifest_path, 'w', encoding='utf-8') as mf:
            json.dump({
                'source': f"CNP {group['code']} — كتب القراءة الرسمية",
                'subject': 'اللغة العربية — المحفوظات والأناشيد',
                'grade': grade,
                'trimester': group['trimester_num'],
                'count': len(manifest_items),
                'items': manifest_items
            }, mf, ensure_ascii=False, indent=2)

        # Register in global index if not present
        if manifest_rel not in manifest_list:
            manifest_list.append(manifest_rel)

    # Self-cleaning: delete any recitation asset/dir not produced this run,
    # then drop their now-dead manifest entries from the global index. Non-
    # recitation manifests are left untouched.
    survivors = purge_stale_recitations(expected_files, expected_dirs)
    manifest_list = [
        m for m in manifest_list
        if "/recitation/manifest.json" not in m or m in survivors
    ]

    global_index["manifests"] = manifest_list
    with open(INDEX_PATH, 'w', encoding='utf-8') as f:
        json.dump(global_index, f, ensure_ascii=False, indent=2)

    print(f"\nExtraction complete! {total_extracted} verified recitation items "
          f"extracted; {len(survivors)} recitation manifests in the index.")

if __name__ == "__main__":
    main()
