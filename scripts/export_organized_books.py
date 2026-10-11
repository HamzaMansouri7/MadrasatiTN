import json, os, shutil, glob
from pathlib import Path

BASE = Path('parascolaire')
ARCHIVE = Path('parascolaire_frozen') / '_archive'
LIVRES = BASE / 'livres'

NAMES = json.load(open(ARCHIVE / 'book_names.json', encoding='utf-8'))

GRADE_MAP = {
    '1ère Année': '1ere_annee',
    '2ème Année': '2eme_annee',
    '3ème Année': '3eme_annee',
    '4ème Année': '4eme_annee',
    '5ème Année': '5eme_annee',
    '6ème Année': '6eme_annee'
}

CLEAN_FOLDER_NAMES = {
    "jisr_ennajah_1ere_evaluations": "evaluations_maths_arabe",
    "jisr_ennajah_2eme_toutes_matieres": "evaluations_toutes_matieres",
    "jisr_ennajah_3eme_examens": "examens_toutes_matieres",
    "math_solutions_4eme_sellami": "mathematiques_exercices_corriges",
    "mouayen_production_ecrite_4eme": "production_ecrite_arabe",
    "al_ahram_5eme_complet": "mathematiques_exercices_evaluations",
    "eveil_scientifique_5eme_evaluations": "eveil_scientifique_evaluations",
    "exercices_math_5eme_corriges": "exercices_mathematiques_corriges",
    "livre_mowazi_5eme_math_sciences": "devoirs_trimestre_1_matieres_mixtes",
    "al_mounir_eveil_scientifique_6eme": "eveil_scientifique_cours_exercices",
    "cahier_grammaire_6eme": "grammaire_arabe_cahier_regles",
    "concours_blanc_eveil_scientifique_corriges": "concours_blanc_eveil_scientifique_corrige",
    "concours_math_6eme_corriges": "concours_mathematiques_corriges",
    "epreuve_modele_math_6eme_corrigee": "epreuve_modele_mathematiques_corrigee",
    "examen_lecture_6eme_corriges": "examen_lecture_arabe_corrige",
    "mouayen_6eme_math_francais": "soutien_maths_francais",
    "sagesse_6eme_complet": "francais_lire_et_sexprimer"
}

# Load all exercises for per-book bundling
exercises_by_book = {}
with open(ARCHIVE / 'exercises.jsonl', encoding='utf-8') as f:
    for line in f:
        r = json.loads(line)
        b = r['book']
        if b not in exercises_by_book:
            exercises_by_book[b] = []
        exercises_by_book[b].append(r)

created_books = []

for slug, display_name in NAMES.items():
    book_src = ARCHIVE / slug
    if not book_src.exists():
        continue
    
    bj_data = json.load(open(book_src / 'book.json', encoding='utf-8'))
    grade = bj_data.get('grade', '6ème Année')
    grade_dir_name = GRADE_MAP.get(grade, '6eme_annee')
    clean_slug = CLEAN_FOLDER_NAMES.get(slug, slug)
    
    dest_book_dir = LIVRES / grade_dir_name / clean_slug
    dest_pages_dir = dest_book_dir / 'pages'
    dest_pages_dir.mkdir(parents=True, exist_ok=True)
    
    # Clean exercises for this book
    book_raw_ex = exercises_by_book.get(slug, [])
    clean_exercises = []
    for ex in book_raw_ex:
        c_ex = dict(ex)
        c_ex['book'] = clean_slug
        c_ex['bookTitle'] = display_name
        if c_ex.get('id'):
            c_ex['id'] = c_ex['id'].replace(slug, clean_slug)
        clean_exercises.append(c_ex)
    
    # 1. Clean book metadata
    clean_book_meta = {
        "book": clean_slug,
        "title": display_name,
        "grade": grade,
        "subject": bj_data.get('labels', {}).get('subjectTop') or bj_data.get('subject'),
        "publisher": "مدرستي تونس — Madrasati TN",
        "edition": "2025-2026",
        "totalPages": bj_data.get('totalPages', 0),
        "totalExercises": len(clean_exercises),
        "readyExercises": sum(1 for x in clean_exercises if x.get('tier') == 'ready'),
    }
    with open(dest_book_dir / 'book.json', 'w', encoding='utf-8') as f:
        json.dump(clean_book_meta, f, indent=2, ensure_ascii=False)
        
    # 2. Copy and format page JSONs with 100% clean rebranding
    src_pages = sorted(book_src.glob('pages/*.json'))
    for sp in src_pages:
        pdata = json.load(open(sp, encoding='utf-8'))
        
        # Replace book slug with clean slug and add clean title
        pdata['book'] = clean_slug
        pdata['bookTitle'] = display_name
        
        # Scrub and update item IDs
        for it in pdata.get('items', []):
            if it.get('id'):
                it['id'] = it['id'].replace(slug, clean_slug)
                
        dest_page_file = dest_pages_dir / sp.name
        with open(dest_page_file, 'w', encoding='utf-8') as f:
            json.dump(pdata, f, indent=2, ensure_ascii=False)
            
    # 3. Export all structured exercises for this book
    with open(dest_book_dir / 'exercices.json', 'w', encoding='utf-8') as f:
        json.dump({
            "book": clean_slug,
            "bookTitle": display_name,
            "grade": grade,
            "exerciseCount": len(clean_exercises),
            "exercises": clean_exercises
        }, f, indent=2, ensure_ascii=False)
        
    created_books.append((grade_dir_name, clean_slug, display_name, len(src_pages)))

print(f"100% Rebranding Complete! Updated {len(created_books)} books in parascolaire/livres/.")
