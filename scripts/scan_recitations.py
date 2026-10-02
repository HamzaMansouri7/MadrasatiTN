import urllib.request
import fitz
import os
import re
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

BOOKS = [
    {
        'grade': '1ere-annee',
        'code': '101110',
        'part': 'P00',
        'url': 'https://www.cnp.com.tn/arabic/PDF/101110P00.pdf',
        'title': 'كتاب القراءة 1'
    },
    {
        'grade': '2eme-annee',
        'code': '101215',
        'part': 'P00',
        'url': 'https://www.cnp.com.tn/arabic/PDF/101215P00.pdf',
        'title': 'كتاب القراءة 2'
    },
    {
        'grade': '3eme-annee',
        'code': '101315',
        'part': 'P01',
        'url': 'https://www.cnp.com.tn/arabic/PDF/101315P01.pdf',
        'title': 'ينابيع 1 (السنة 3)'
    },
    {
        'grade': '3eme-annee',
        'code': '101315',
        'part': 'P02',
        'url': 'https://www.cnp.com.tn/arabic/PDF/101315P02.pdf',
        'title': 'ينابيع 2 (السنة 3)'
    },
    {
        'grade': '4eme-annee',
        'code': '101410',
        'part': 'P00',
        'url': 'https://www.cnp.com.tn/arabic/PDF/101410P00.pdf',
        'title': 'دروب الحوار (السنة 4)'
    },
    {
        'grade': '5eme-annee',
        'code': '101509',
        'part': 'P00',
        'url': 'https://www.cnp.com.tn/arabic/PDF/101509P00.pdf',
        'title': 'مسالك القراءة (السنة 5)'
    },
    {
        'grade': '6eme-annee',
        'code': '101611',
        'part': 'P00',
        'url': 'https://www.cnp.com.tn/arabic/PDF/101611P00.pdf',
        'title': 'عالم القراءة (السنة 6)'
    }
]

os.makedirs('_sources', exist_ok=True)

for b in BOOKS:
    pdf_path = os.path.join('_sources', f"{b['code']}_{b['part']}.pdf")
    if not os.path.exists(pdf_path):
        print(f"Downloading {b['title']} ({b['url']})...")
        req = urllib.request.Request(b['url'], headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as resp, open(pdf_path, 'wb') as f:
            f.write(resp.read())
    else:
        print(f"Using cached {pdf_path}")

    doc = fitz.open(pdf_path)
    print(f"\n=== {b['grade']} | {b['title']} (Total pages: {len(doc)}) ===")
    
    # Check Table of Contents or scan pages for keywords
    candidates = []
    keywords = ['محفوظ', 'أنشد', 'أنشود', 'نشيد', 'أحفظ', 'شعر', 'قصيد']
    
    for idx, page in enumerate(doc, 1):
        txt = page.get_text()
        matched_kw = [kw for kw in keywords if kw in txt]
        if matched_kw:
            # First non-empty lines
            lines = [l.strip() for l in txt.split('\n') if l.strip() and len(l.strip()) > 2]
            sample = " | ".join(lines[:4]) if lines else ""
            candidates.append((idx, matched_kw, sample))
    
    print(f"Found {len(candidates)} candidate pages with keywords:")
    for page_num, kws, sample in candidates[:15]:
        print(f"  Page {page_num:3d} [{','.join(kws)}]: {sample[:90]}")
    if len(candidates) > 15:
        print(f"  ... and {len(candidates) - 15} more.")
    doc.close()
