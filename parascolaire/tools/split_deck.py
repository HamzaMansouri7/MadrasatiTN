"""Split a NotebookLM deck PDF (one infographic per slide) into one PNG per theme, strictly named.

Input name (strict): <classe>__<livre>__themes-NN-NN-NN__diaporama-infographies__vN.pdf  (explicit theme numbers, in slide order)
Output, same folder: <classe>__<livre>__<NN-theme>__infographie-paysage__vN.png  + one manifest.json entry each.
Usage: python parascolaire/tools/split_deck.py <path-to-deck.pdf> [--zoom 2]
Stops if the page count differs from the theme count (never guesses).
"""
import json, re, sys
from pathlib import Path
import fitz

sys.stdout.reconfigure(encoding='utf-8')
sys.path.insert(0, str(Path(__file__).resolve().parent))
import export_notebooklm as EX
import build_runsheets as RS


def main():
    a = sys.argv[1:]
    if not a:
        sys.exit(__doc__)
    pdf = Path(a[0]); zoom = float(a[a.index('--zoom') + 1]) if '--zoom' in a else 2.0
    m = re.fullmatch(r'(.+?)__(.+?)__themes-([\d-]+)__diaporama-infographies__v(\d+)\.pdf', pdf.name)
    if not m:
        sys.exit(f'bad deck filename: {pdf.name}\nexpected <classe>__<livre>__themes-NN-NN__diaporama-infographies__vN.pdf')
    classe, livre, nums, ver = m.group(1), m.group(2), [int(x) for x in m.group(3).split('-')], int(m.group(4))
    bdir = next((b for b in EX.books().values() if b.parent.name.replace('_', '-') == classe and b.name.replace('_', '-') == livre), None)
    if not bdir:
        sys.exit(f'unknown book {classe}/{livre}')
    book, themes = RS.analyse(bdir)
    byn = {t['n']: t for t in themes}
    doc = fitz.open(pdf)
    if len(doc) != len(nums):
        sys.exit(f'{len(doc)} pages but {len(nums)} themes in the name: stop')
    mp = pdf.parent / 'manifest.json'
    man = json.loads(mp.read_text(encoding='utf-8')) if mp.exists() else {'book': bdir.name, 'runs': []}
    for page, n in zip(doc, nums):
        t = byn[n]
        v = 1
        while (pdf.parent / RS.out_name(bdir, t, 'infographie-paysage', v)).exists():
            v += 1
        out = pdf.parent / RS.out_name(bdir, t, 'infographie-paysage', v)
        page.get_pixmap(matrix=fitz.Matrix(zoom, zoom)).save(out)
        man['runs'].append({'file': out.name, 'theme': t['theme'], 'sourceFile': t['file'], 'type': 'infographic', 'settings': 'chat deck, landscape',
                            'fromDeck': pdf.name, 'date': '2026-10-12', 'status': 'to_review'})
        print(out.name)
    mp.write_text(json.dumps(man, ensure_ascii=False, indent=2), encoding='utf-8')


main()
