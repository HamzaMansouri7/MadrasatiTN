import os
import sys
from download_scribd import download_scribd_book

books = [
    ("804633994", "parascolaire/07_Mouayen_6eme_Math_Francais.pdf"),
    ("807879410", "parascolaire/08_Exercices_Math_5eme_Corriges.pdf"),
    ("705408805", "parascolaire/09_Examen_Lecture_6eme_Corriges.pdf"),
    ("533890421", "parascolaire/10_Concours_Blanc_Eveil_Scientifique_Corriges.pdf")
]

for doc_id, out_path in books:
    if os.path.exists(out_path):
        print(f"Skipping {out_path}, already exists.")
        continue
    print(f"\n==============================")
    print(f"Starting download: {out_path} (ID: {doc_id})")
    print(f"==============================")
    try:
        res = download_scribd_book(doc_id, out_path)
        print(f"Result for {out_path}: {res}")
    except Exception as e:
        print(f"Error downloading {doc_id}: {e}")

print("\nAll batch downloads complete.")
