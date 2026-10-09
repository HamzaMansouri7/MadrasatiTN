import os
import io
import json
import fitz
from PIL import Image

MAX_WIDTH = 1600
QUALITY = 82

# Target root
PUBLIC_RESOURCES = "public/assets/resources"

# Define the extraction mapping
# Grade 2 Arabic BDs:
# P01: 34 pages (pages 3-34 are scenes)
# P02: 14 pages (pages 1-14 are scenes)

# T1 items: P01 pages 3..20 (18 pages)
# T2 items: P01 pages 21..34 (14 pages) + P02 pages 1..7 (7 pages) => 21 pages
# T3 items: P02 pages 8..14 (7 pages)

doc1 = fitz.open('_sources_candidates/501208P01.pdf')
doc2 = fitz.open('_sources_candidates/501208P02.pdf')

def save_page_as_webp(doc, page_idx_0, dest_path):
    page = doc[page_idx_0]
    pix = page.get_pixmap(dpi=200)
    img_data = pix.tobytes("png")
    with Image.open(io.BytesIO(img_data)) as img:
        if img.width > MAX_WIDTH:
            ratio = MAX_WIDTH / img.width
            img = img.resize((MAX_WIDTH, round(img.height * ratio)), Image.LANCZOS)
        if img.mode in ("RGBA", "P"):
            img = img.convert("RGB")
        os.makedirs(os.path.dirname(dest_path), exist_ok=True)
        img.save(dest_path, "WEBP", quality=QUALITY, method=6)

trimester_configs = [
    {
        't_slug': 'trimestre-1',
        't_num': 1,
        'sources': [
            {'doc': doc1, 'code': '501208P01', 'start_p': 3, 'end_p': 20, 'url': 'https://www.cnp.com.tn/arabic/PDF/501208P01.pdf'}
        ]
    },
    {
        't_slug': 'trimestre-2',
        't_num': 2,
        'sources': [
            {'doc': doc1, 'code': '501208P01', 'start_p': 21, 'end_p': 34, 'url': 'https://www.cnp.com.tn/arabic/PDF/501208P01.pdf'},
            {'doc': doc2, 'code': '501208P02', 'start_p': 1, 'end_p': 7, 'url': 'https://www.cnp.com.tn/arabic/PDF/501208P02.pdf'}
        ]
    },
    {
        't_slug': 'trimestre-3',
        't_num': 3,
        'sources': [
            {'doc': doc2, 'code': '501208P02', 'start_p': 8, 'end_p': 14, 'url': 'https://www.cnp.com.tn/arabic/PDF/501208P02.pdf'}
        ]
    }
]

manifest_paths_to_register = []

for cfg in trimester_configs:
    t_slug = cfg['t_slug']
    t_num = cfg['t_num']
    target_dir = os.path.join(PUBLIC_RESOURCES, '2eme-annee', 'arabe', t_slug, 'bandes-dessinees')
    os.makedirs(target_dir, exist_ok=True)
    
    manifest_items = []
    item_idx = 1
    
    for src in cfg['sources']:
        doc = src['doc']
        code = src['code']
        url = src['url']
        
        for p in range(src['start_p'], src['end_p'] + 1):
            filename = f"bd_2eme_arabe_t{t_num}_p{item_idx:02d}.webp"
            dest_path = os.path.join(target_dir, filename)
            save_page_as_webp(doc, p - 1, dest_path)
            
            rel_path = f"assets/resources/2eme-annee/arabe/{t_slug}/bandes-dessinees/{filename}"
            manifest_items.append({
                'id': f"cnp-{code}-p{p:02d}",
                'grade': '2eme-annee',
                'subject': 'arabe',
                'subSubject': 'communication_orale',
                'trimester': t_num,
                'topic': 'bandes-dessinees',
                'title': f"مساراتي - شريط مصور صفحة {item_idx}",
                'file': filename,
                'relPath': rel_path,
                'lang': 'ar',
                'ref': f"{url}#page={p}",
                'labels': [
                    'cnp',
                    'masarati',
                    'bande_dessinee',
                    'expression_orale',
                    '2eme_annee'
                ]
            })
            item_idx += 1
            
    # Write manifest.json
    manifest_path = os.path.join(target_dir, 'manifest.json')
    with open(manifest_path, 'w', encoding='utf-8') as f:
        json.dump({
            'source': f"CNP 501208 ({t_slug.capitalize()})",
            'count': len(manifest_items),
            'items': manifest_items
        }, f, ensure_ascii=False, indent=2)
        
    # Write README.md
    readme_path = os.path.join(target_dir, 'README.md')
    with open(readme_path, 'w', encoding='utf-8') as f:
        f.write(f"# Bandes Dessinées / مشاهد التواصل الشفوي — 2ème Année ({t_slug.capitalize()})\n\n"
                f"- **Description:** مساراتي — أشرطة مصورة للتواصل الشفوي (السنة الثانية أساسي)\n"
                f"- **Source:** CNP 501208 (https://www.cnp.com.tn/arabic/PDF/501208P01.pdf / 501208P02.pdf)\n"
                f"- **Classification:** Grade: `2eme-annee` | Subject: `arabe` | Trimester: `{t_slug}` | Topic: `bandes-dessinees` | Lang: `ar`\n"
                f"- **Count:** {len(manifest_items)} items\n"
                f"- **Pattern:** `bd_2eme_arabe_t{t_num}_p*.webp`\n"
                f"- **Format:** Direct WebP (q82, method 6, max 1600px)\n"
                f"- **Date Extracted:** 2026-10-09\n")
                
    rel_manifest = f"assets/resources/2eme-annee/arabe/{t_slug}/bandes-dessinees/manifest.json"
    manifest_paths_to_register.append(rel_manifest)
    print(f"Generated {len(manifest_items)} WebP items for {t_slug} in {target_dir}")

# Update public/assets/resources/index.json
index_path = os.path.join(PUBLIC_RESOURCES, 'index.json')
with open(index_path, 'r', encoding='utf-8') as f:
    idx_data = json.load(f)

for m in manifest_paths_to_register:
    if m not in idx_data['manifests']:
        idx_data['manifests'].append(m)

with open(index_path, 'w', encoding='utf-8') as f:
    json.dump(idx_data, f, ensure_ascii=False, indent=2)

print("\nSuccessfully updated index.json with new manifests:")
for m in manifest_paths_to_register:
    print(f"  + {m}")
