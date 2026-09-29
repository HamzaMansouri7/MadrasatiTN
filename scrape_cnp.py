import urllib.request
import urllib.parse
import ssl
import re
import json

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

BASE_URL = "https://www.cnp.com.tn"
SEARCH_URL = f"{BASE_URL}/CNP1/web/arabic/biblio/resultat_man.jsp"

grades = {
    "0": "تحضيري (Préparatoire)",
    "1": "السنة الأولى (1ère)",
    "2": "السنة الثانية (2ème)",
    "3": "السنة الثالثة (3ème)",
    "4": "السنة الرابعة (4ème)",
    "5": "السنة الخامسة (5ème)",
    "6": "السنة السادسة (6ème)"
}

all_books = []

for classe_id, classe_name in grades.items():
    payload = {
        'CYCLE': '1',
        'CLASSE': classe_id,
        'MATIERE': '__',
        'type': 'eleve'
    }
    data = urllib.parse.urlencode(payload).encode('utf-8')
    req = urllib.request.Request(SEARCH_URL, data=data, headers={
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Content-Type': 'application/x-www-form-urlencoded'
    })
    try:
        with urllib.request.urlopen(req, context=ctx, timeout=15) as resp:
            html = resp.read().decode('utf-8', errors='ignore')
            # Extract rows
            rows = re.findall(r'<tr class\s*=\s*[\'"]tr_content[\'"]>(.*?)</tr>', html, re.DOTALL | re.IGNORECASE)
            current_code = None
            current_title = None
            for row in rows:
                cols = re.findall(r'<td[^>]*>(.*?)</td>', row, re.DOTALL | re.IGNORECASE)
                # Check for PDF links
                pdf_match = re.search(r'href\s*=\s*([^ >]+\.pdf)', row, re.IGNORECASE)
                if not pdf_match:
                    continue
                raw_href = pdf_match.group(1).replace('"', '').replace("'", "")
                full_pdf_url = urllib.parse.urljoin(SEARCH_URL, raw_href)
                
                # Check if this row has code and title
                clean_texts = [re.sub(r'<[^>]+>', '', c).strip() for c in cols]
                if len(clean_texts) >= 3:
                    current_code = clean_texts[0]
                    current_title = clean_texts[1]
                    part = clean_texts[2]
                elif len(clean_texts) == 1:
                    part = clean_texts[0]
                else:
                    part = "Partie"

                all_books.append({
                    "grade_id": classe_id,
                    "grade_name": classe_name,
                    "code": current_code,
                    "title": current_title,
                    "part": part,
                    "pdf_url": full_pdf_url
                })
    except Exception as e:
        print(f"Error for {classe_name}: {e}")

with open("cnp_primary_books.json", "w", encoding="utf-8") as f:
    json.dump(all_books, f, ensure_ascii=False, indent=2)

print(f"Extraction complete! Total book files found: {len(all_books)}")
