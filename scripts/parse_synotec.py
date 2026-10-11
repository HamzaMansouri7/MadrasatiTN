import re
import urllib.parse

path = r'C:\Users\lassa\.gemini\antigravity-ide\brain\04857bf7-a13d-411a-b9d9-bc59eb204e06\.system_generated\steps\378\content.md'
with open(path, 'r', encoding='utf-8', errors='ignore') as f:
    text = f.read()

# Find product URLs and titles
matches = re.findall(r'<a[^>]+href=[\'"](https://synotec\.tn/produit/[^\'"]+)[\'"][^>]*>(.*?)</a>', text, re.DOTALL)
print(f'Total matches: {len(matches)}')

seen = set()
products = []
for url, raw_title in matches:
    clean_title = re.sub(r'<[^>]+>', '', raw_title).strip()
    if clean_title and clean_title not in seen:
        seen.add(clean_title)
        decoded_url = urllib.parse.unquote(url)
        products.append((clean_title, decoded_url))

print(f'Unique products: {len(products)}')
with open('scripts/synotec_products.txt', 'w', encoding='utf-8') as out:
    for title, url in products:
        out.write(f'{title} | {url}\n')
