import urllib.request
import re

url = 'https://www.scribd.com/document/736531549/Sagesse-6eme'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
try:
    with urllib.request.urlopen(req) as r:
        html = r.read().decode('utf-8', errors='ignore')
    
    author_links = set(re.findall(r'href=[\'"](/user/[^\'"]+|/author/[^\'"]+)[\'"]', html))
    print('Author links:', author_links)
    
    docs = set(re.findall(r'/document/(\d+)/([^\'"?#]+)', html))
    print('Total doc links found on page:', len(docs))
    for doc_id, doc_slug in sorted(docs):
        if any(w in doc_slug.lower() for w in ['sagesse', 'arab', 'math', 'francais', '6eme', '5eme', '4eme', '3eme', 'ann', 'tunis']):
            print(f"Doc: {doc_id} -> {doc_slug}")
except Exception as e:
    print('Err:', e)
