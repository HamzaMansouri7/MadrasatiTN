"""Build catalog (grade > subject > theme) from tagged archive pages."""
import json, sys, collections, re
from pathlib import Path
sys.stdout.reconfigure(encoding='utf-8')
A = Path('parascolaire_frozen/_archive')
BOOK_NAMES = json.loads((A / 'book_names.json').read_text(encoding='utf-8')) if (A / 'book_names.json').exists() else {}
GO = lambda g: int(re.match(r'(\d)', g).group(1))
rows = []
for pf in sorted(A.glob('*/pages/*.json')):
    d = json.loads(pf.read_text(encoding='utf-8')); t = d.get('tags')
    if not t: continue
    rows.append({'book': d['book'], 'page': d['page'], 'grade': d['grade'], 'subject': t['subject'], 'theme': t['theme'], 'themeGroup': t.get('themeGroup') or t['theme'], 'skill': t.get('skill', ''),
                 'type': t.get('pageType', ''), 'formats': t.get('formats', []), 'keywords': t.get('keywords', []), 'ideaValue': t.get('ideaValue', ''),
                 'ideaNote': t.get('ideaNote', ''), 'topicId': d.get('topicId'), 'linkStatus': d['linkStatus'], 'correctionPages': d.get('correctionPages', []), 'correctionOf': d.get('correctionOf', [])})
(A / 'catalog.jsonl').write_text('\n'.join(json.dumps(r, ensure_ascii=False) for r in rows), encoding='utf-8')

def rng(ps):
    ps = sorted(ps); out = []; s = p = ps[0]
    for x in ps[1:]:
        if x == p + 1: p = x; continue
        out.append(f'{s}-{p}' if p > s else str(s)); s = p = x
    out.append(f'{s}-{p}' if p > s else str(s)); return ','.join(out)

tree = collections.defaultdict(lambda: collections.defaultdict(lambda: collections.defaultdict(list)))
for r in rows: tree[r['grade']][r['subject']][r['themeGroup']].append(r)
L = ['# Catalogue des sources d\'idées', '', f'{len(rows)} pages classées par classe, matière et thème (étiquettes Claude Sonnet 5.5). Données complètes: `catalog.jsonl`. Pages à forte valeur d\'idée marquées **★**.', '']
tc = collections.Counter(r['type'] for r in rows); L += ['Types: ' + ', '.join(f'{k} {v}' for k, v in tc.most_common()), '']
for g in sorted(tree, key=GO):
    ng = sum(len(v) for s in tree[g].values() for v in s.values()); L += [f'## {g} ({ng} pages)', '']
    for s in sorted(tree[g], key=lambda x: -sum(len(v) for v in tree[g][x].values())):
        ns = sum(len(v) for v in tree[g][s].values()); L += [f'### {s} ({ns})', '']
        for th, rs in sorted(tree[g][s].items(), key=lambda kv: kv[0]):
            types = collections.Counter(r['type'] for r in rs); star = '★ ' if any(r['ideaValue'] == 'high' for r in rs) else ''
            byb = collections.defaultdict(list)
            for r in rs: byb[r['book']].append(r['page'])
            src = '; '.join(f"{BOOK_NAMES.get(b, b)} p{rng(ps)}" for b, ps in byb.items())
            L.append(f"- {star}**{th}**: {len(rs)} p · {', '.join(f'{k} {v}' for k, v in types.most_common())} · {src}")
        L.append('')
(A / 'CATALOG.md').write_text('\n'.join(L), encoding='utf-8')
print(len(rows), sum(len(tree[g]) for g in tree), 'grade-subject groups', sum(len(th) for g in tree for th in tree[g].values()), 'themes')
fc = collections.Counter(f for r in rows for f in r['formats']); print(fc.most_common(8)); print(collections.Counter(r['ideaValue'] for r in rows))
