"""Fill the prompt templates for every book and theme and write one ready-to-paste run sheet per book.

Reads: parascolaire/prompts/*.v1.md (templates), defaults.json, notebooks.json, and parascolaire/livres/.
Writes: parascolaire/prompts/runsheets/NN-<book>.md and runsheets/INDEX.md (generated, do not edit by hand).
Also re-exports the book's NotebookLM source files so theme numbers and file names always match.

Usage:
  python parascolaire/tools/build_runsheets.py --all
  python parascolaire/tools/build_runsheets.py <book-folder-name>
  python parascolaire/tools/build_runsheets.py --print <book-folder-name> <theme-number> <output>
     output = infographic | slides | slide-1 | video-child | video-parent | video-teacher
No book, class or theme is hard-coded: everything comes from the data and defaults.json.
"""
import json, re, sys, collections
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8')
sys.path.insert(0, str(Path(__file__).resolve().parent))
import export_notebooklm as EX

ROOT = EX.ROOT
PDIR = ROOT / 'prompts'
SHEETS = PDIR / 'runsheets'
CFG = json.loads((PDIR / 'defaults.json').read_text(encoding='utf-8'))
ORDER = json.loads((PDIR / 'notebooks.json').read_text(encoding='utf-8'))['order']
OUTPUTS = ['infographic', 'slides', 'slide-1', 'video-child', 'video-parent', 'video-teacher']
VIDEO_STUDIO = {'video-child': 'child', 'video-parent': 'parent', 'video-teacher': 'teacher'}


def template(name):
    t = (PDIR / f'{name}.v1.md').read_text(encoding='utf-8')
    body = t.split('## Prompt', 1)[1]
    m = re.search(r'```text\n(.*?)```', body, re.S)
    return m.group(1).strip()


TEMPLATES = {o: template(o) for o in OUTPUTS}


def fill(text, vals):
    for k, v in vals.items():
        text = text.replace('{{' + k + '}}', v)
    left = re.findall(r'\{\{\w+\}\}', text)
    if left:
        raise SystemExit(f'unfilled fields {left}')
    return re.sub(r'  +', ' ', text).replace(' .', '.').replace(' ,', ',')


def notebook_numbers(avail):
    names = [n for n in ORDER if n in {f'{b.parent.name}/{b.name}' for b in avail.values()}]
    rest = sorted(f'{b.parent.name}/{b.name}' for b in avail.values() if f'{b.parent.name}/{b.name}' not in names)
    return {n: i for i, n in enumerate(names + rest, 1)}


def analyse(bdir):
    """Themes with the same numbering and file names as export_notebooklm.py."""
    book = EX.load(bdir / 'book.json')
    rows = [r for r in EX.load(bdir / 'exercices.json')['exercises'] if r.get('kind') == 'exercise' and r.get('tier') in EX.EXPORT_TIERS]
    pages = {int(p.stem): EX.load(p) for p in (bdir / 'pages').glob('*.json')}
    items = {it['id']: it for pg in pages.values() for it in pg['items'] if it.get('id')}
    by = collections.defaultdict(list)
    for r in rows:
        by[r['theme'] or 'Sans thème'].append(r)
    cidx = {pg: EX.build_correction_index([r for r in rows if r['page'] == pg], pg, pages) for pg in {r['page'] for r in rows}}
    themes = []
    for n, theme in enumerate(sorted(by, key=lambda t: (-len(by[t]), t)), 1):
        tr = by[theme]
        corr = sum(1 for r in tr if r['id'] in items and EX.correction_for(r, items[r['id']], cidx[r['page']])[0] is not None)
        subj = collections.Counter(r.get('subject') or book['subject'] for r in tr).most_common(1)[0][0]
        themes.append({'n': n, 'theme': theme, 'file': EX.slug(theme, n) + '.md', 'ex': len(tr), 'corr': corr, 'subject': subj})
    return book, themes


def values(book, th):
    grade = book['grade'][0]
    c = CFG['classes'][grade]
    s = CFG['subjects'].get(th['subject'], {'lang': 'ar', 'ar': th['subject'], 'fr': th['subject']})
    lang = CFG['languages'][s['lang']]
    ratio = th['corr'] / th['ex'] if th['ex'] else 0
    answer = ('You may quote a correction from the selected sources, exactly, to explain a method.'
              if ratio >= CFG['rules']['min_correction_ratio_for_answers']
              else 'The sources hold few or no corrections for this theme: never write or invent an answer to a source exercise.')
    return {
        'class_en': c['en'], 'age': c['age'], 'subject': th['subject'], 'theme': th['theme'],
        'class_label': c[s['lang']], 'subject_label': s[s['lang']],
        'lang_name': lang['name'], 'vowel_clause': lang['vowel_clause'],
        'number_clause': f"Numbers must stay {c['numbers']}." if s.get('maths') else '',
        'answer_clause': answer, 'brand': lang['brand_display'], 'exception': lang['exception'], 'brand_latin': CFG['brand']['name_latin'],
    }, lang, int(grade)


def band(grade):
    return '1-3' if grade <= 3 else '4-6'


def settings_line(output, grade, lang):
    b = CFG['bands'][band(grade)]
    if output == 'infographic':
        i = b['infographic']
        return f"Language **{lang['dropdown']}** · orientation **{i['orientation']}** · style **{i['style']}** · detail **{i['detail']}**"
    if output in ('slides', 'slide-1'):
        s = b['slides']
        return f"Language **{lang['dropdown']}** · format **{s['format']}** · length **{'Court' if output == 'slide-1' else s['length']}**"
    v = b['video']
    return f"Language **{lang['dropdown']}** · format **{v['format']}** · style **{v['style']}** · paste in **Thème personnalisé**"


def studio_name(o):
    return {'infographic': 'Infographie', 'slides': 'Présentation', 'slide-1': 'Présentation (1 slide)'}.get(o, 'Résumé vidéo')


def render(book, th, output):
    vals, lang, grade = values(book, th)
    return fill(TEMPLATES[output], vals), settings_line(output, grade, lang)


def sheet(bdir, num):
    book, themes = analyse(bdir)
    EX.export_book(bdir)
    nb = f"Madrasati TN · {num:02d} · {book['title']}"
    L = [f'# {nb}', '', f"Class: {book['grade']} · themes: {len(themes)} · upload folder: `parascolaire/notebooklm/{bdir.parent.name}/{bdir.name}/` (all files).", '',
         'Generated by `parascolaire/tools/build_runsheets.py`. Do not edit by hand. Rules: `NOTEBOOKLM_PLAN.md` sections 15 and 16.', '',
         '## How to use one prompt', '', '1. Left panel: **Tout sélectionner** (untick all), then tick ONLY the theme file shown.',
         '2. Right panel (Studio): click the pencil on the output tile.', '3. Set the options shown for that prompt.', '4. Paste the prompt, generate, then review with the checklist in section 10 of the plan.', '',
         '## Progress', '', '| # | Theme | File | Exercises | With correction | Infographic | Slides (8) | Slide (1) | Video child | Video parent | Video teacher |', '|---|---|---|---|---|---|---|---|---|---|---|']
    for t in themes:
        L.append(f"| {t['n']} | {t['theme']} | `{t['file']}` | {t['ex']} | {t['corr']} | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |")
    for t in themes:
        small = t['ex'] <= CFG['rules']['small_theme_max_exercises']
        L += ['', f"## {t['n']:02d} · {t['theme']}", '', f"Tick only: `{t['file']}` · {t['ex']} exercises · {t['corr']} with a correction · subject {t['subject']}"]
        if small:
            L.append(f"Small theme (7 exercises or fewer): do the one-slide asset and the child video only.")
        chosen = ['slide-1', 'video-child'] if small else ['infographic', 'slides', 'video-child']
        for o in chosen:
            p, st = render(book, t, o)
            L += ['', f'### {t["n"]:02d} · {studio_name(o)} — {o}', st, '', '```text', p, '```']
        others = [o for o in OUTPUTS if o not in chosen]
        L += ['', f"Other prompts for this theme (print on demand): `python parascolaire/tools/build_runsheets.py --print {bdir.name} {t['n']} <{' | '.join(others)}>`"]
    SHEETS.mkdir(parents=True, exist_ok=True)
    out = SHEETS / f'{num:02d}-{bdir.name}.md'
    out.write_text('\n'.join(L) + '\n', encoding='utf-8')
    return nb, out, len(themes)


if __name__ == '__main__':
    avail = EX.books()
    nums = notebook_numbers(avail)
    a = sys.argv[1:]
    if not a:
        sys.exit(__doc__)
    if a[0] == '--print':
        bdir = avail[a[1]]
        book, themes = analyse(bdir)
        t = next(x for x in themes if x['n'] == int(a[2]))
        p, st = render(book, t, a[3])
        print(f'{st}\n\n{p}')
        sys.exit(0)
    names = list(avail) if a[0] == '--all' else a
    idx = ['# Run sheets — index', '', 'Generated. One sheet per book, in notebook order.', '', '| # | Notebook | Themes | Sheet |', '|---|---|---|---|']
    for nm in sorted(names, key=lambda n: nums[f'{avail[n].parent.name}/{n}']):
        nb, out, nt = sheet(avail[nm], nums[f'{avail[nm].parent.name}/{nm}'])
        idx.append(f'| {out.name[:2]} | {nb} | {nt} | [{out.name}]({out.name}) |')
        print(f'{nb} -> {out.relative_to(ROOT.parent).as_posix()} ({nt} themes)')
    if a[0] == '--all':
        (SHEETS / 'INDEX.md').write_text('\n'.join(idx) + '\n', encoding='utf-8')
