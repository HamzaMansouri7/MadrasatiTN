import urllib.request
import fitz
import os
import json

batches = [
    {
        'url': 'https://www.cnp.com.tn/arabic/PDF/101215P00.pdf',
        'code': '101215',
        'grade': '2eme-annee',
        'grade_short': '2eme',
        'subject': 'arabe',
        'subSubject': 'lecture_communication',
        'trimester_slug': 'trimestre-1',
        'trimester_num': 1,
        'topic': 'lecture',
        'type_prefix': 'lesson',
        'lang': 'ar',
        'title_prefix': 'كتاب القراءة والتواصل صفحة',
        'desc_fr': 'Manuel officiel de lecture et communication orale — 2ème année primaire.',
        'desc_ar': 'كتاب القراءة والتواصل الشفوي الرسمي — السنة الثانية أساسي.'
    },
    {
        'url': 'https://www.cnp.com.tn/arabic/PDF/101216P00.pdf',
        'code': '101216',
        'grade': '2eme-annee',
        'grade_short': '2eme',
        'subject': 'arabe',
        'subSubject': 'exercices_ecriture',
        'trimester_slug': 'trimestre-1',
        'trimester_num': 1,
        'topic': 'cahier-exercices',
        'type_prefix': 'ex',
        'lang': 'ar',
        'title_prefix': 'كتاب التمارين والأنشطة صفحة',
        'desc_fr': "Cahier d'exercices et d'activités d'arabe — 2ème année primaire.",
        'desc_ar': 'كتاب التمارين والأنشطة للغة العربية — السنة الثانية أساسي.'
    },
    {
        'url': 'https://www.cnp.com.tn/arabic/PDF/102210P00.pdf',
        'code': '102210',
        'grade': '2eme-annee',
        'grade_short': '2eme',
        'subject': 'maths',
        'subSubject': 'mathematiques',
        'trimester_slug': 'trimestre-1',
        'trimester_num': 1,
        'topic': 'manuel-exercices',
        'type_prefix': 'ex',
        'lang': 'ar',
        'title_prefix': 'كتاب الرياضيات صفحة',
        'desc_fr': 'Manuel et exercices de mathématiques — 2ème année primaire.',
        'desc_ar': 'كتاب الرياضيات الرسمي — السنة الثانية أساسي.'
    },
    {
        'url': 'https://www.cnp.com.tn/arabic/PDF/121209P00.pdf',
        'code': '121209',
        'grade': '2eme-annee',
        'grade_short': '2eme',
        'subject': 'francais',
        'subSubject': 'francais_activites',
        'trimester_slug': 'trimestre-1',
        'trimester_num': 1,
        'topic': 'cahier-activites',
        'type_prefix': 'ex',
        'lang': 'fr',
        'title_prefix': "Cahier d'activités Français page",
        'desc_fr': "Manuel officiel de Français — Mon cahier d'activités — 2ème Année.",
        'desc_ar': 'كرّاس الأنشطة للغة الفرنسية — السنة الثانية أساسي.'
    }
]

for b in batches:
    pdf_path = f"{b['code']}_temp.pdf"
    print(f"Processing 2ème Année: {b['code']} -> {b['subject']}/{b['topic']}...")
    
    # 1. Download
    req = urllib.request.Request(b['url'], headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req) as resp, open(pdf_path, 'wb') as f:
        f.write(resp.read())
    
    # 2. Target directory
    target_dir = f"src/assets/resources/{b['grade']}/{b['subject']}/{b['trimester_slug']}/{b['topic']}"
    os.makedirs(target_dir, exist_ok=True)
    
    # 3. Slice
    doc = fitz.open(pdf_path)
    page_count = len(doc)
    manifest_items = []
    
    for idx, page in enumerate(doc, 1):
        pix = page.get_pixmap(dpi=150)
        filename = f"{b['type_prefix']}_{b['grade_short']}_{b['subject']}_t{b['trimester_num']}_p{idx:02d}.png"
        dest_path = os.path.join(target_dir, filename)
        pix.save(dest_path)
        
        manifest_items.append({
            'id': f"cnp-{b['code']}-p{idx:02d}",
            'grade': b['grade'],
            'subject': b['subject'],
            'subSubject': b['subSubject'],
            'trimester': b['trimester_num'],
            'topic': b['topic'],
            'title': f"{b['title_prefix']} {idx}",
            'file': filename,
            'relPath': f"assets/resources/{b['grade']}/{b['subject']}/{b['trimester_slug']}/{b['topic']}/{filename}",
            'lang': b['lang'],
            'ref': f"{b['url']}#page={idx}",
            'labels': ['cnp', b['code'], b['subject'], b['topic'], b['grade']]
        })
    
    doc.close()
    if os.path.exists(pdf_path):
        os.remove(pdf_path)
    
    # 4. Manifest
    manifest_path = os.path.join(target_dir, 'manifest.json')
    with open(manifest_path, 'w', encoding='utf-8') as mf:
        json.dump({
            'source': f"CNP {b['code']}",
            'count': len(manifest_items),
            'items': manifest_items
        }, mf, ensure_ascii=False, indent=2)
    
    # 5. README
    readme_path = os.path.join(target_dir, 'README.md')
    with open(readme_path, 'w', encoding='utf-8') as rf:
        rf.write(f"# {b['subject'].capitalize()} — {b['topic']} ({b['grade']} / {b['trimester_slug']})\n\n"
                 f"- **Description:** {b['desc_fr']} ({b['desc_ar']})\n"
                 f"- **Source:** CNP {b['code']} — {b['url']}\n"
                 f"- **Classification:** Grade: `{b['grade']}` | Subject: `{b['subject']}` | Trimester: `{b['trimester_slug']}` | Topic: `{b['topic']}` | Lang: `{b['lang']}`\n"
                 f"- **Count:** {page_count} items\n"
                 f"- **Pattern:** `{b['type_prefix']}_{b['grade_short']}_{b['subject']}_t{b['trimester_num']}_p*.png`\n"
                 f"- **Date Extracted:** 2026-10-02\n")
    
    print(f"Done: {page_count} pages saved to {target_dir}")

print("All 2ème Année batches completed successfully.")
