"""Export one book (or all) from parascolaire/livres/ as NotebookLM source files.

Output: parascolaire/notebooklm/<class>/<book>/00-overview.md + NN-<theme>.md  (one file per theme)
Template and rules: parascolaire/NOTEBOOKLM_PLAN.md sections 3, 4 and 15.

Usage:
  python parascolaire/tools/export_notebooklm.py <book-folder-name>     one book
  python parascolaire/tools/export_notebooklm.py --all                  every book under livres/
  python parascolaire/tools/export_notebooklm.py --list                 list book folder names

Nothing is hard-coded per book: books are discovered by scanning livres/*/*/book.json.
Only exercises with tier == ready are exported. A correction is written only when it is present in
the data; otherwise the marker NO_CORRECTION is written so the model never invents one.
"""
import json, re, sys, unicodedata, collections
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8')
ROOT = Path(__file__).resolve().parent.parent
LIVRES = ROOT / 'livres'
OUT = ROOT / 'notebooklm'
EXPORT_TIERS = ('ready',)                      # accepted tiers (config: change here, not per book)
NO_CORRECTION = 'No correction yet. Do not invent one.'
UNMATCHED = 'A correction exists on a linked page but could not be matched to this exercise. Do not invent one.'
CORR_OK = ('inline', 'self_contained', 'linked')
NL = chr(10)
PAGE_REF = re.compile(r'الصفحة\s*(\d+)')


def load(p):
    return json.loads(p.read_text(encoding='utf-8'))


def slug(s, n):
    s = unicodedata.normalize('NFKD', s).encode('ascii', 'ignore').decode()
    s = re.sub(r'[^a-zA-Z0-9]+', '-', s).strip('-').lower()
    return f'{n:02d}-{s or "theme"}'


def clean(v):
    v = (v or '').strip()
    return '' if v.lower() in ('none', 'null') else v


def statement(item):
    ins, body, fig = clean(item.get('instruction')), clean(item.get('body')), clean(item.get('figureDesc'))
    text = body if (body and (not ins or body.startswith(ins) or ins in body)) else '\n'.join(x for x in (ins, body) if x)
    return text, fig


def base_num(v):
    m = re.match(r'\s*(\d+)', str(v or ''))
    return m.group(1) if m else None


def printed_page(it):
    """Printed page referenced by a correction item: '2 (ص81)' in number, or 'الصفحة 13' in instruction."""
    for s in (str(it.get('number') or ''), it.get('instruction') or ''):
        m = re.search(r'ص\s*(\d+)', s) or PAGE_REF.search(s)
        if m:
            return int(m.group(1))
    return None


def build_correction_index(rows_on_page, pdf_page, pages):
    """number -> correction text for the exercises of ONE book page.
    The correction pages quote the printed page number, which differs from the PDF page by a small
    offset. The offset is not assumed: pick the quoted page whose item numbers overlap most with the
    exercise numbers of this page. No overlap = no match (never a guess)."""
    want = {base_num(r['number']) for r in rows_on_page} - {None}
    cands = collections.defaultdict(lambda: collections.defaultdict(list))
    for cp in {c for r in rows_on_page for c in (r.get('correctionPages') or [])}:
        pg = pages.get(cp)
        for it in (pg['items'] if pg else []):
            if it.get('kind') != 'answer':
                continue
            pp, n = printed_page(it), base_num(it.get('number'))
            if pp is not None and n is not None and abs(pdf_page - pp) <= 10:
                cands[pp][n].append(it)
    best, score = None, 0
    for pp, byn in cands.items():
        ov = len(want & set(byn))
        if ov > score or (ov == score and ov and best is not None and abs(pdf_page - pp) < abs(pdf_page - best)):
            best, score = pp, ov
    out = {}
    if best is not None:
        for n, its in cands[best].items():
            parts = []
            for it in its:
                ans, body = clean(it.get('answer')), clean(it.get('body'))
                parts.append(NL.join(x for x in (ans, body) if x))
            txt = NL.join(x for x in parts if x)
            if txt:
                out[n] = txt
    return out


def correction_for(row, item, index):
    """Return (text or None, status). Never guesses."""
    kind = row['correction']
    if kind in ('inline', 'self_contained'):
        a = clean(item.get('answer'))
        if a:
            return a, kind
    if kind == 'linked':
        txt = index.get(base_num(row['number']))
        return (txt, 'linked') if txt else (None, 'unmatched')
    return None, 'none'


def export_book(bdir):
    book = load(bdir / 'book.json')
    rows = [r for r in load(bdir / 'exercices.json')['exercises'] if r.get('kind') == 'exercise' and r.get('tier') in EXPORT_TIERS]
    pages = {int(p.stem): load(p) for p in (bdir / 'pages').glob('*.json')}
    items = {it['id']: it for pg in pages.values() for it in pg['items'] if it.get('id')}
    dest = OUT / bdir.parent.name / bdir.name
    if dest.exists():
        for f in dest.glob('*.md'):
            f.unlink()
    dest.mkdir(parents=True, exist_ok=True)

    by_theme = collections.defaultdict(list)
    for r in rows:
        by_theme[r['theme'] or 'Sans thème'].append(r)
    order = sorted(by_theme, key=lambda t: (-len(by_theme[t]), t))

    cidx = {}
    for pgno in {r['page'] for r in rows}:
        cidx[pgno] = build_correction_index([r for r in rows if r['page'] == pgno], pgno, pages)
    stats = {}
    for n, theme in enumerate(order, 1):
        trows = sorted(by_theme[theme], key=lambda r: (r['page'], str(r['number'])))
        chapters = sorted({r['topicId'] for r in trows if r.get('topicId')})
        L = [f'# {theme} — {book["grade"]} — {book["subject"]}', '',
             f'Book: {book["title"]}',
             f'Official chapter: {", ".join(chapters) if chapters else "unknown"}', '',
             '## Exercises', '']
        withc = 0
        for r in trows:
            it = items.get(r['id'])
            if not it:
                continue
            text, fig = statement(it)
            corr, status = correction_for(r, it, cidx[r['page']])
            withc += corr is not None
            L += [f'### Exercise {r["number"] or "-"}   (format: {r.get("format") or "free"} | difficulty: {r.get("difficulty") or "n/a"})',
                  'Statement:', text or '(empty)']
            if fig:
                L += ['Figure description:', fig]
            L += ['Correction:', corr if corr else (UNMATCHED if status == 'unmatched' else NO_CORRECTION), '']
        (dest / f'{slug(theme, n)}.md').write_text('\n'.join(L), encoding='utf-8')
        stats[theme] = (len(trows), withc, len(chapters))

    kinds = collections.Counter(r['pageType'] for r in rows)
    ov = [f'# {book["title"]}', '',
          f'Class: {book["grade"]}', f'Subject: {book["subject"]}',
          f'Main content type: {kinds.most_common(1)[0][0] if kinds else "n/a"}',
          f'Exercises exported (ready only): {len(rows)}',
          f'With a correction: {sum(v[1] for v in stats.values())}', '',
          '## Themes (one source file each)', '', '| File | Theme | Exercises | With correction |', '|---|---|---|---|']
    for n, theme in enumerate(order, 1):
        ov.append(f'| {slug(theme, n)}.md | {theme} | {stats[theme][0]} | {stats[theme][1]} |')
    ov += ['', 'Rule: only the statements and corrections written in the theme files may be used. Exercises marked "No correction yet" have no answer in the sources; never create one.', '']
    (dest / '00-overview.md').write_text('\n'.join(ov), encoding='utf-8')
    return book['title'], dest, len(order), len(rows), sum(v[1] for v in stats.values())


def books():
    return {b.name: b for b in sorted(LIVRES.glob('*/*')) if (b / 'book.json').exists()}


if __name__ == '__main__':
    avail = books()
    args = sys.argv[1:]
    if not args or args[0] == '--list':
        print('\n'.join(avail)); sys.exit(0)
    names = list(avail) if args[0] == '--all' else args
    for nm in names:
        if nm not in avail:
            sys.exit(f'unknown book: {nm}  (use --list)')
        t, d, nt, ne, nc = export_book(avail[nm])
        print(f'{t} -> {d.relative_to(ROOT.parent).as_posix()} | themes {nt} | exercises {ne} | with correction {nc}')
