import os, shutil, glob, json
from pathlib import Path

P = Path('parascolaire')
SOURCES_DIR = P / '../parascolaire_frozen/_sources'
SOURCES_DIR.mkdir(exist_ok=True)

# Move grade folders into _sources
grade_dirs = ['1ere', '2eme', '3eme', '4eme', '5eme', '6eme']
for g in grade_dirs:
    src_dir = P / g
    dest_dir = SOURCES_DIR / g
    if src_dir.exists() and not dest_dir.exists():
        shutil.move(str(src_dir), str(dest_dir))
        print(f"Moved {src_dir} -> {dest_dir}")

# Update book.json sourceFile paths
for bj in sorted(P.glob('../parascolaire_frozen/_archive/*/book.json')):
    data = json.load(open(bj, encoding='utf-8'))
    sf = data.get('sourceFile', '')
    if sf and not sf.startswith('../parascolaire_frozen/_sources/'):
        data['sourceFile'] = f"parascolaire_frozen/_sources/{sf}"
        with open(bj, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        print(f"Updated sourceFile in {bj.parent.name}: {data['sourceFile']}")

print("Archive complete! All original PDFs safely stored in parascolaire_frozen/_sources/.")
