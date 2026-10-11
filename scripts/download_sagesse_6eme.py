import os
import re
import time
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
import fitz  # PyMuPDF
from PIL import Image

EMBED_URL = 'https://www.scribd.com/embeds/736531549/content'
OUTPUT_DIR = '_sources'
TEMP_DIR = 'scripts/temp_sagesse_pages'
OUTPUT_PDF = os.path.join(OUTPUT_DIR, 'Sagesse_6eme.pdf')

os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(TEMP_DIR, exist_ok=True)

# 1. Fetch Embed HTML if not already cached
embed_html_path = 'scripts/embed_736531549.html'
if not os.path.exists(embed_html_path):
    print("Fetching embed HTML...")
    req = urllib.request.Request(EMBED_URL, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
    with urllib.request.urlopen(req) as r:
        html = r.read().decode('utf-8', errors='ignore')
    with open(embed_html_path, 'w', encoding='utf-8') as f:
        f.write(html)
else:
    with open(embed_html_path, 'r', encoding='utf-8', errors='ignore') as f:
        html = f.read()

# 2. Extract all 129 page image URLs
page_images = {
    1: "http://html.scribd.com/5d20pznegwcjkga2/images/1-551da48fb2.jpg",
    2: "http://html.scribd.com/5d20pznegwcjkga2/images/2-f8f2da81d2.jpg",
    3: "http://html.scribd.com/5d20pznegwcjkga2/images/3-8abde2a258.jpg"
}

matches = re.findall(r'https?://html\.scribdassets\.com/5d20pznegwcjkga2/pages/(\d+)-([a-zA-Z0-9]+)\.jsonp', html)
for p_str, hash_str in matches:
    p = int(p_str)
    page_images[p] = f"http://html.scribd.com/5d20pznegwcjkga2/images/{p}-{hash_str}.jpg"

total_pages = len(page_images)
print(f"Extracted {total_pages} page image URLs.")

def download_page(page_num, url):
    target_path = os.path.join(TEMP_DIR, f"page_{page_num:03d}.jpg")
    if os.path.exists(target_path) and os.path.getsize(target_path) > 1000:
        return page_num, target_path, True

    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://www.scribd.com/'
    }
    
    for attempt in range(4):
        try:
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, timeout=15) as resp:
                data = resp.read()
                if len(data) > 1000:
                    with open(target_path, 'wb') as f:
                        f.write(data)
                    return page_num, target_path, True
        except Exception as e:
            time.sleep(1 + attempt)
    return page_num, target_path, False

# 3. Download all pages concurrently
print("Downloading 129 pages concurrently...")
results = {}
with ThreadPoolExecutor(max_workers=10) as executor:
    futures = {executor.submit(download_page, p, url): p for p, url in page_images.items()}
    for future in as_completed(futures):
        p_num, path, success = future.result()
        results[p_num] = success
        if not success:
            print(f"Failed to download page {p_num}")

failed = [p for p, ok in results.items() if not ok]
if failed:
    print(f"Download failed for pages: {failed}")
    exit(1)
print("All 129 pages downloaded successfully.")

# 4. Assemble PDF using PyMuPDF (fitz)
print("Building PDF...")
doc = fitz.open()

for page_num in range(1, total_pages + 1):
    img_path = os.path.join(TEMP_DIR, f"page_{page_num:03d}.jpg")
    with Image.open(img_path) as im:
        w, h = im.size
    
    rect = fitz.Rect(0, 0, w, h)
    pdf_page = doc.new_page(width=w, height=h)
    pdf_page.insert_image(rect, filename=img_path)

doc.save(OUTPUT_PDF, deflate=True, garbage=4)
doc.close()

file_size_mb = os.path.getsize(OUTPUT_PDF) / (1024 * 1024)
print(f"PDF created successfully at: {OUTPUT_PDF} ({file_size_mb:.2f} MB)")
