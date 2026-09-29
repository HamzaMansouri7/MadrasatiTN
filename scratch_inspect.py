import urllib.request
import urllib.parse
import ssl
import re

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

url = 'https://www.cnp.com.tn/CNP1/web/arabic/biblio/resultat_man.jsp'
payload = {
    'CYCLE': '1',
    'CLASSE': '1',
    'MATIERE': '__',
    'type': 'eleve'
}
data = urllib.parse.urlencode(payload).encode('utf-8')

req = urllib.request.Request(url, data=data, headers={
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    'Content-Type': 'application/x-www-form-urlencoded'
})

with urllib.request.urlopen(req, context=ctx, timeout=15) as resp:
    html = resp.read().decode('utf-8', errors='ignore')

with open('results_classe1.html', 'w', encoding='utf-8') as f:
    f.write(html)

print("Status 200, length:", len(html))
# Let's extract any table or links
rows = re.findall(r'<tr.*?>.*?</tr>', html, re.DOTALL | re.IGNORECASE)
print("Rows found:", len(rows))
for r in rows:
    # clean tags
    text = re.sub(r'<[^>]+>', ' ', r)
    text = ' '.join(text.split())
    links = re.findall(r'href=[\'"]([^\'"]+)[\'"]', r, re.IGNORECASE)
    onclicks = re.findall(r'onclick=[\'"]([^\'"]+)[\'"]', r, re.IGNORECASE)
    print("Row:", text[:100], "Links:", links, "Onclicks:", onclicks)
