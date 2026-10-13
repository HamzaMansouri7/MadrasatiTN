"""Process all 100% ready books."""
import sys, json, os, shutil
from pathlib import Path
from PIL import Image

sys.path.insert(0, 'scripts')
import generate_book_pages as GEN

COVERS_RAW = {
    '5eme-annee/exercices-mathematiques-corriges': (
        'C:/Users/lassa/.gemini/antigravity-ide/brain/a7daa1e8-7379-44cd-b530-71d287274e75/cover_5eme_exercices_maths_1791913649598.jpg',
        '5eme-annee/parascolaire/trimestre-1/exercices-mathematiques-corriges',
        'parascolaire/livres/5eme_annee/exercices_mathematiques_corriges'
    ),
    '5eme-annee/eveil-scientifique-evaluations': (
        'C:/Users/lassa/.gemini/antigravity-ide/brain/a7daa1e8-7379-44cd-b530-71d287274e75/cover_5eme_eveil_1791913698407.jpg',
        '5eme-annee/parascolaire/trimestre-1/eveil-scientifique-evaluations',
        'parascolaire/livres/5eme_annee/eveil_scientifique_evaluations'
    ),
    '6eme-annee/concours-blanc-eveil-scientifique-corrige': (
        'C:/Users/lassa/.gemini/antigravity-ide/brain/a7daa1e8-7379-44cd-b530-71d287274e75/cover_6eme_concours_eveil_1791913715682.jpg',
        '6eme-annee/parascolaire/trimestre-1/concours-blanc-eveil-scientifique-corrige',
        'parascolaire/livres/6eme_annee/concours_blanc_eveil_scientifique_corrige'
    ),
    '6eme-annee/examen-lecture-arabe-corrige': (
        'C:/Users/lassa/.gemini/antigravity-ide/brain/a7daa1e8-7379-44cd-b530-71d287274e75/cover_6eme_lecture_arabe_1791913740233.jpg',
        '6eme-annee/parascolaire/trimestre-1/examen-lecture-arabe-corrige',
        'parascolaire/livres/6eme_annee/examen_lecture_arabe_corrige'
    ),
    '6eme-annee/epreuve-modele-mathematiques-corrigee': (
        'C:/Users/lassa/.gemini/antigravity-ide/brain/a7daa1e8-7379-44cd-b530-71d287274e75/cover_6eme_epreuve_maths_1791913765518.jpg',
        '6eme-annee/parascolaire/trimestre-1/epreuve-modele-mathematiques-corrigee',
        'parascolaire/livres/6eme_annee/epreuve_modele_mathematiques_corrigee'
    )
}

index_file = 'public/assets/resources/index.json'
index_data = json.load(open(index_file, encoding='utf-8'))

for book_id, (raw_cover, rel_dest_dir, livre_dir) in COVERS_RAW.items():
    dest_dir = Path('public/assets/resources') / rel_dest_dir
    dest_dir.mkdir(parents=True, exist_ok=True)
    
    # 1. Front Cover
    cover_path = dest_dir / 'cover.webp'
    im = Image.open(raw_cover).convert('RGB')
    im.thumbnail((1600, 1600), Image.Resampling.LANCZOS)
    im.save(cover_path, 'WEBP', quality=82, method=6)
    print(f'Processed front cover: {cover_path}')

    # 2. Book data
    bdata = json.load(open(Path(livre_dir) / 'book.json', encoding='utf-8'))
    
    # 3. Intro, Outro, Back Cover
    GEN.generate_intro_page(bdata, str(dest_dir / 'intro.webp'))
    GEN.generate_outro_page(bdata, str(dest_dir / 'outro.webp'))
    GEN.generate_back_cover(bdata, str(dest_dir / 'back-cover.webp'))

    # 4. Manifest.json
    pages_dir = Path(livre_dir) / 'pages'
    page_files = sorted([f for f in os.listdir(pages_dir) if f.endswith('.json')])
    items = []
    grade_slug = book_id.split('/')[0]
    book_slug = book_id.split('/')[1]
    
    for pf in page_files:
        pnum = int(pf[:-5])
        items.append({
            'id': f'{book_slug}-p{pnum:03d}',
            'grade': grade_slug,
            'subject': bdata.get('subject', ''),
            'subSubject': 'parascolaire',
            'trimester': 1,
            'topic': book_slug,
            'title': f'صفحة {pnum}',
            'file': pf,
            'relPath': f'{livre_dir}/pages/{pf}',
            'lang': 'ar',
            'ref': f'MadrasatiTN Parascolaire p.{pnum}',
            'labels': ['parascolaire', grade_slug, bdata.get('subject', '').lower()]
        })

    manifest = {
        'source': 'MadrasatiTN Parascolaire',
        'bookId': book_id,
        'title': bdata.get('title', ''),
        'grade': bdata.get('grade', ''),
        'subject': bdata.get('subject', ''),
        'cover': f'assets/resources/{rel_dest_dir}/cover.webp',
        'backCover': f'assets/resources/{rel_dest_dir}/back-cover.webp',
        'intro': f'assets/resources/{rel_dest_dir}/intro.webp',
        'outro': f'assets/resources/{rel_dest_dir}/outro.webp',
        'count': len(items),
        'items': items
    }
    manifest_path = dest_dir / 'manifest.json'
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding='utf-8')
    print(f'Wrote manifest: {manifest_path} ({len(items)} pages)')

    # Register in global index
    m_rel = f'assets/resources/{rel_dest_dir}/manifest.json'
    if m_rel not in index_data['manifests']:
        index_data['manifests'].insert(0, m_rel)

# Also update 1ere-annee with intro, outro, back-cover
b1_data = json.load(open('parascolaire/livres/1ere_annee/evaluations_maths_arabe/book.json', encoding='utf-8'))
p1_dest = Path('public/assets/resources/1ere-annee/parascolaire/trimestre-1/evaluations-maths-arabe')
GEN.generate_intro_page(b1_data, str(p1_dest / 'intro.webp'))
GEN.generate_outro_page(b1_data, str(p1_dest / 'outro.webp'))
GEN.generate_back_cover(b1_data, str(p1_dest / 'back-cover.webp'))
m1 = json.load(open(p1_dest / 'manifest.json', encoding='utf-8'))
m1['backCover'] = 'assets/resources/1ere-annee/parascolaire/trimestre-1/evaluations-maths-arabe/back-cover.webp'
m1['intro'] = 'assets/resources/1ere-annee/parascolaire/trimestre-1/evaluations-maths-arabe/intro.webp'
m1['outro'] = 'assets/resources/1ere-annee/parascolaire/trimestre-1/evaluations-maths-arabe/outro.webp'
(p1_dest / 'manifest.json').write_text(json.dumps(m1, ensure_ascii=False, indent=2), encoding='utf-8')

open(index_file, 'w', encoding='utf-8').write(json.dumps(index_data, ensure_ascii=False, indent=2))
print('All books processed and registered successfully!')
