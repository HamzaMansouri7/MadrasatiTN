import os
import re
import sys
import time
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
import fitz  # PyMuPDF
from PIL import Image

def download_scribd_book(scribd_url_or_id, output_name=None):
    # Extract document ID
    m = re.search(r'(\d{8,})', str(scribd_url_or_id))
    if not m:
        print("Invalid Scribd URL or document ID.")
        return False
    doc_id = m.group(1)
    
    output_dir = '_sources'
    os.makedirs(output_dir, exist_ok=True)
    temp_dir = os.path.join('scripts', f'temp_{doc_id}')
    os.makedirs(temp_dir, exist_ok=True)
    
    embed_url = f'https://www.scribd.com/embeds/{doc_id}/content'
    print(f"Fetching metadata for Document ID: {doc_id}...")
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://www.scribd.com/'
    }
    
    req = urllib.request.Request(embed_url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            html = r.read().decode('utf-8', errors='ignore')
    except Exception as e:
        print(f"Error fetching embed page: {e}")
        return False
        
    if not output_name:
        title_m = re.search(r'"title":\s*"([^"]+)"', html)
        if title_m:
            clean_title = re.sub(r'[^\w\-_\.]', '_', title_m.group(1))
            output_name = f"{clean_title}.pdf"
        else:
            output_name = f"scribd_{doc_id}.pdf"
            
    if os.path.dirname(output_name):
        output_pdf = output_name
        os.makedirs(os.path.dirname(output_pdf), exist_ok=True)
    else:
        output_pdf = os.path.join(output_dir, output_name)
    
    # Extract images from outer_page divs (first pages)
    page_images = {}
    for p in range(1, 10):
        m_page = re.search(r'id=["\']outer_page_' + str(p) + r'["\'][\s\S]*?orig=["\'](http[s]?://html\.scribd\.com/[^"\']+/images/[^"\']+)["\']', html)
        if m_page:
            page_images[p] = m_page.group(1)

    # Extract JSONP / image mappings
    jsonp_matches = re.findall(r'https?://html\.scribdassets\.com/([a-zA-Z0-9]+)/pages/(\d+)-([a-zA-Z0-9]+)\.jsonp', html)
    for asset_dir, p_str, hash_str in jsonp_matches:
        p = int(p_str)
        page_images[p] = f"http://html.scribd.com/{asset_dir}/images/{p}-{hash_str}.jpg"

    total_pages = len(page_images)
    if total_pages == 0:
        print("No pages could be extracted from embed.")
        return False
        
    print(f"Found {total_pages} pages. Downloading concurrently...")
    
    def download_page(page_num, url):
        target_path = os.path.join(temp_dir, f"page_{page_num:03d}.jpg")
        if os.path.exists(target_path) and os.path.getsize(target_path) > 1000:
            return page_num, target_path, True
        for attempt in range(4):
            try:
                r_img = urllib.request.Request(url, headers=headers)
                with urllib.request.urlopen(r_img, timeout=15) as resp:
                    data = resp.read()
                    if len(data) > 1000:
                        with open(target_path, 'wb') as f:
                            f.write(data)
                        return page_num, target_path, True
            except Exception:
                time.sleep(1 + attempt)
        return page_num, target_path, False

    with ThreadPoolExecutor(max_workers=10) as executor:
        futures = {executor.submit(download_page, p, url): p for p, url in page_images.items()}
        for f in as_completed(futures):
            p_num, path, success = f.result()
            if not success:
                print(f"Warning: failed page {p_num}")

    print("Building PDF...")
    doc = fitz.open()
    for page_num in sorted(page_images.keys()):
        img_path = os.path.join(temp_dir, f"page_{page_num:03d}.jpg")
        if os.path.exists(img_path):
            with Image.open(img_path) as im:
                w, h = im.size
            rect = fitz.Rect(0, 0, w, h)
            pdf_page = doc.new_page(width=w, height=h)
            pdf_page.insert_image(rect, filename=img_path)

    doc.save(output_pdf, deflate=True, garbage=4)
    doc.close()
    
    # Cleanup temp
    import shutil
    shutil.rmtree(temp_dir, ignore_errors=True)
    
    size_mb = os.path.getsize(output_pdf) / (1024 * 1024)
    print(f"Successfully generated: {output_pdf} ({size_mb:.2f} MB, {len(page_images)} pages)")
    return output_pdf

if __name__ == '__main__':
    if len(sys.argv) > 1:
        target = sys.argv[1]
        out_name = sys.argv[2] if len(sys.argv) > 2 else None
        download_scribd_book(target, out_name)
    else:
        print("Usage: python scripts/download_scribd.py <scribd_url_or_id> [output_name.pdf]")
