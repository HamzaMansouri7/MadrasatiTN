import os
import io
import json
import fitz
from PIL import Image

MAX_WIDTH = 1600
QUALITY = 82

PUBLIC_RESOURCES = "public/assets/resources"

doc_4eme = fitz.open('_sources_candidates/521417P00.pdf')
doc_5eme = fitz.open('_sources_candidates/521514P00.pdf')

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

configs = [
    # 4ème Année (CNP 521417, 64 pages)
    {
        'grade': '4eme-annee',
        'grade_short': '4eme',
        'grade_label': '4ème Année',
        't_slug': 'trimestre-1',
        't_num': 1,
        'sources': [
            {'doc': doc_4eme, 'code': '521417P00', 'start_p': 1, 'end_p': 22, 'url': 'https://www.cnp.com.tn/arabic/PDF/521417P00.pdf'}
        ]
    },
    {
        'grade': '4eme-annee',
        'grade_short': '4eme',
        'grade_label': '4ème Année',
        't_slug': 'trimestre-2',
        't_num': 2,
        'sources': [
            {'doc': doc_4eme, 'code': '521417P00', 'start_p': 23, 'end_p': 44, 'url': 'https://www.cnp.com.tn/arabic/PDF/521417P00.pdf'}
        ]
    },
    {
        'grade': '4eme-annee',
        'grade_short': '4eme',
        'grade_label': '4ème Année',
        't_slug': 'trimestre-3',
        't_num': 3,
        'sources': [
            {'doc': doc_4eme, 'code': '521417P00', 'start_p': 45, 'end_p': 64, 'url': 'https://www.cnp.com.tn/arabic/PDF/521417P00.pdf'}
        ]
    },
    # 5ème Année (CNP 521514, 83 pages - Page 1 is cover, skipped)
    {
        'grade': '5eme-annee',
        'grade_short': '5eme',
        'grade_label': '5ème Année',
        't_slug': 'trimestre-1',
        't_num': 1,
        'sources': [
            {'doc': doc_5eme, 'code': '521514P00', 'start_p': 2, 'end_p': 21, 'url': 'https://www.cnp.com.tn/arabic/PDF/521514P00.pdf'},
            {'doc': doc_5eme, 'code': '521514P00', 'start_p': 62, 'end_p': 77, 'url': 'https://www.cnp.com.tn/arabic/PDF/521514P00.pdf'}
        ]
    },
    {
        'grade': '5eme-annee',
        'grade_short': '5eme',
        'grade_label': '5ème Année',
        't_slug': 'trimestre-2',
        't_num': 2,
        'sources': [
            {'doc': doc_5eme, 'code': '521514P00', 'start_p': 22, 'end_p': 45, 'url': 'https://www.cnp.com.tn/arabic/PDF/521514P00.pdf'},
            {'doc': doc_5eme, 'code': '521514P00', 'start_p': 78, 'end_p': 83, 'url': 'https://www.cnp.com.tn/arabic/PDF/521514P00.pdf'}
        ]
    },
    {
        'grade': '5eme-annee',
        'grade_short': '5eme',
        'grade_label': '5ème Année',
        't_slug': 'trimestre-3',
        't_num': 3,
        'sources': [
            {'doc': doc_5eme, 'code': '521514P00', 'start_p': 46, 'end_p': 61, 'url': 'https://www.cnp.com.tn/arabic/PDF/521514P00.pdf'}
        ]
    }
]

manifest_paths_to_register = []

for cfg in configs:
    grade = cfg['grade']
    grade_short = cfg['grade_short']
    grade_label = cfg['grade_label']
    t_slug = cfg['t_slug']
    t_num = cfg['t_num']
    target_dir = os.path.join(PUBLIC_RESOURCES, grade, 'francais', t_slug, 'bandes-dessinees')
    os.makedirs(target_dir, exist_ok=True)

    manifest_items = []
    item_idx = 1

    for src in cfg['sources']:
        doc = src['doc']
        code = src['code']
        url = src['url']

        for p in range(src['start_p'], src['end_p'] + 1):
            filename = f"bd_{grade_short}_francais_t{t_num}_p{item_idx:02d}.webp"
            dest_path = os.path.join(target_dir, filename)
            save_page_as_webp(doc, p - 1, dest_path)

            rel_path = f"assets/resources/{grade}/francais/{t_slug}/bandes-dessinees/{filename}"
            manifest_items.append({
                'id': f"cnp-{code}-p{p:02d}",
                'grade': grade,
                'subject': 'francais',
                'subSubject': 'expression_orale',
                'trimester': t_num,
                'topic': 'bandes-dessinees',
                'title': f"Français {grade_label} — Expression Orale / BD planche {item_idx}",
                'file': filename,
                'relPath': rel_path,
                'lang': 'fr',
                'ref': f"{url}#page={p}",
                'labels': [
                    'cnp',
                    'francais',
                    'bande_dessinee',
                    'expression_orale',
                    f"{grade_short}_annee"
                ]
            })
            item_idx += 1

    # Write manifest.json
    manifest_path = os.path.join(target_dir, 'manifest.json')
    with open(manifest_path, 'w', encoding='utf-8') as f:
        json.dump({
            'source': f"CNP {cfg['sources'][0]['code']} ({grade_label} {t_slug.capitalize()})",
            'count': len(manifest_items),
            'items': manifest_items
        }, f, ensure_ascii=False, indent=2)

    # Write README.md
    readme_path = os.path.join(target_dir, 'README.md')
    with open(readme_path, 'w', encoding='utf-8') as f:
        f.write(f"# Bandes Dessinées / Expression Orale — {grade_label} ({t_slug.capitalize()})\n\n"
                f"- **Description:** Planches d'expression orale et bandes dessinées — {grade_label} ({t_slug.capitalize()})\n"
                f"- **Source:** CNP {cfg['sources'][0]['code']} ({cfg['sources'][0]['url']})\n"
                f"- **Classification:** Grade: `{grade}` | Subject: `francais` | Trimester: `{t_slug}` | Topic: `bandes-dessinees` | Lang: `fr`\n"
                f"- **Count:** {len(manifest_items)} items\n"
                f"- **Pattern:** `bd_{grade_short}_francais_t{t_num}_p*.webp`\n"
                f"- **Format:** Direct WebP (q82, method 6, max 1600px)\n"
                f"- **Date Extracted:** 2026-10-09\n")

    rel_manifest = f"assets/resources/{grade}/francais/{t_slug}/bandes-dessinees/manifest.json"
    manifest_paths_to_register.append(rel_manifest)
    print(f"Generated {len(manifest_items)} WebP items for {grade} {t_slug} in {target_dir}")

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
