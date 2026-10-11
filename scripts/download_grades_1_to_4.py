import os
import sys

sys.path.append('scripts')
from download_scribd import download_scribd_book

books = [
    ("503007795", "parascolaire/1ere/Jisr_Ennajah_1ere_Evaluations.pdf"),
    ("518576186", "parascolaire/2eme/Jisr_Ennajah_2eme_Toutes_Matieres.pdf"),
    ("672681058", "parascolaire/3eme/Jisr_Ennajah_3eme_Examens.pdf"),
    ("204256983", "parascolaire/4eme/Math_Solutions_4eme_Sellami.pdf"),
    ("799289079", "parascolaire/4eme/Mouayen_Production_Ecrite_4eme.pdf")
]

for doc_id, out_path in books:
    if os.path.exists(out_path):
        print(f"Skipping {out_path}, already exists.")
        continue
    print(f"\n==============================")
    print(f"Downloading: {out_path} (ID: {doc_id})")
    print(f"==============================")
    try:
        res = download_scribd_book(doc_id, out_path)
        print(f"Result: {res}")
    except Exception as e:
        print(f"Error downloading {doc_id}: {e}")

print("\nBatch download complete.")
