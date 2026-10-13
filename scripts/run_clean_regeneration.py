"""Run audited regeneration of the 5 books."""
import sys, json, os
from pathlib import Path

sys.path.insert(0, 'scripts')
import generate_clean_book_pages as GEN

BOOKS_CONFIG = {
    '5eme-annee/exercices-mathematiques-corriges': (
        '5eme-annee/parascolaire/trimestre-1/exercices-mathematiques-corriges',
        'parascolaire/livres/5eme_annee/exercices_mathematiques_corriges'
    ),
    '5eme-annee/eveil-scientifique-evaluations': (
        '5eme-annee/parascolaire/trimestre-1/eveil-scientifique-evaluations',
        'parascolaire/livres/5eme_annee/eveil_scientifique_evaluations'
    ),
    '6eme-annee/concours-blanc-eveil-scientifique-corrige': (
        '6eme-annee/parascolaire/trimestre-1/concours-blanc-eveil-scientifique-corrige',
        'parascolaire/livres/6eme_annee/concours_blanc_eveil_scientifique_corrige'
    ),
    '6eme-annee/examen-lecture-arabe-corrige': (
        '6eme-annee/parascolaire/trimestre-1/examen-lecture-arabe-corrige',
        'parascolaire/livres/6eme_annee/examen_lecture_arabe_corrige'
    ),
    '6eme-annee/epreuve-modele-mathematiques-corrigee': (
        '6eme-annee/parascolaire/trimestre-1/epreuve-modele-mathematiques-corrigee',
        'parascolaire/livres/6eme_annee/epreuve_modele_mathematiques_corrigee'
    )
}

index_file = 'public/assets/resources/index.json'
index_data = json.load(open(index_file, encoding='utf-8'))

for book_id, (rel_dest_dir, livre_dir) in BOOKS_CONFIG.items():
    dest_dir = Path('public/assets/resources') / rel_dest_dir
    dest_dir.mkdir(parents=True, exist_ok=True)
    
    bdata = json.load(open(Path(livre_dir) / 'book.json', encoding='utf-8'))
    exdata = json.load(open(Path(livre_dir) / 'exercices.json', encoding='utf-8'))
    exercises = exdata.get('exercises', [])
    
    # 1. Exact exercise metrics
    ex_only = sum(1 for x in exercises if x.get('kind') == 'exercise')
    has_ans = sum(1 for x in exercises if x.get('hasAnswer') is True)
    
    # Check if there is an explicit examTrimester in data
    trimesters = {x.get('examTrimester') for x in exercises if x.get('examTrimester')}
    trimester = trimesters.pop() if len(trimesters) == 1 else None

    # Check digitized page files on disk
    pages_dir = Path(livre_dir) / 'pages'
    page_files = sorted([f for f in os.listdir(pages_dir) if f.endswith('.json')])
    actual_pages = len(page_files)
    total_pg = bdata.get('totalPages', actual_pages)

    print(f"\nProcessing {book_id}:")
    print(f"  ex_only: {ex_only}, has_ans: {has_ans}, actual_pages: {actual_pages}, total_pg: {total_pg}, trimester: {trimester}")

    # 1. Front Cover (Material Icon, exact Arabic, strictly audited metrics)
    GEN.generate_front_cover(bdata, ex_only, has_ans, actual_pages, trimester, str(dest_dir / 'cover.webp'))

    # 2. Back Cover (verified facts only, no watermark overlap, 2025-2026)
    GEN.generate_back_cover(bdata, ex_only, has_ans, actual_pages, trimester, str(dest_dir / 'back-cover.webp'))

    # 3. Intro & Outro
    GEN.generate_intro_page(bdata, ex_only, has_ans, actual_pages, trimester, str(dest_dir / 'intro.webp'))
    GEN.generate_outro_page(bdata, ex_only, actual_pages, str(dest_dir / 'outro.webp'))

    # 4. Manifest.json
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
            'trimester': trimester or 1,
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
        'items': items,
        'exerciseCount': ex_only,
        'solvedCount': has_ans,
        'notes': f"{total_pg} pages in the book, {actual_pages} digitized."
    }
    manifest_path = dest_dir / 'manifest.json'
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding='utf-8')
    print(f'  Wrote manifest: {manifest_path} ({len(items)} pages)')

    m_rel = f'assets/resources/{rel_dest_dir}/manifest.json'
    if m_rel not in index_data['manifests']:
        index_data['manifests'].insert(0, m_rel)

open(index_file, 'w', encoding='utf-8').write(json.dumps(index_data, ensure_ascii=False, indent=2))
print('\nAudited regeneration complete for all 5 books!')
