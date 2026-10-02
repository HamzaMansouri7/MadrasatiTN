import fitz
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

doc = fitz.open('_sources/101410_P00.pdf')
print("Total pages:", len(doc))

# Let's inspect the last 5 pages (usually Table of Contents / الفهرس in Tunisian books)
for i in range(len(doc)-5, len(doc)):
    txt = doc[i].get_text()
    print(f"--- Page {i+1} ---")
    print(txt[:400].encode('unicode_escape').decode())
