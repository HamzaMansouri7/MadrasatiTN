"""Build parascolaire/publish/ for the Parascolaire module: WebP images, hashed names, catalog.json.

Spec: docs/PARASCOLAIRE-MODULE-SPEC.md sections 4 and 5.
Input : parascolaire/outputs/<classe>/<livre>/ (masters + manifest.json) and parascolaire/livres/ (themes).
Output: parascolaire/publish/ (gitignored): img/, course/, video/, catalog.json (written last).
Upload (owner approves each run): rsync publish/ to /var/madrasati/uploads/parascolaire/ on the VPS.

Usage: python parascolaire/tools/publish_catalog.py   (always every book; unchanged images are re-encoded to the same hashed names)
Run dedupe_outputs.py first.
"""
import hashlib, io, json, re, shutil, sys
from datetime import datetime, timezone
from pathlib import Path

import fitz
from PIL import Image

sys.stdout.reconfigure(encoding='utf-8')
sys.path.insert(0, str(Path(__file__).resolve().parent))
import export_notebooklm as EX
import build_runsheets as RS

ROOT = RS.ROOT
OUT = ROOT / 'outputs'
PUB = ROOT / 'publish'
GOOD = ('approved', 'approved_with_note')
FULL_MAX, THUMB_MAX, WEBP_Q = 1600, 640, 82
STRICT = re.compile(r'^[\w-]+__[\w-]+__(\d\d-[\w-]+|themes-[\d-]+)__[\w-]+__v\d+\.\w+$')


def h8(data: bytes) -> str:
    return hashlib.md5(data).hexdigest()[:8]


def version(run) -> int:
    m = re.search(r'__v(\d+)\.', run['file'])
    return int(m.group(1)) if m else 0


def pick(runs):
    """Newest approved run, else the newest run."""
    if not runs:
        return None
    good = sorted((r for r in runs if r['status'] in GOOD), key=version)
    return good[-1] if good else sorted(runs, key=version)[-1]


def webp(img: Image.Image, max_side: int) -> bytes:
    im = img.convert('RGB')
    im.thumbnail((max_side, max_side))
    buf = io.BytesIO()
    im.save(buf, 'WEBP', quality=WEBP_Q, method=6)
    return buf.getvalue()


def put(rel_dir: str, stem: str, ext: str, data: bytes) -> str:
    name = f'{stem}.{h8(data)}.{ext}'
    d = PUB / rel_dir
    d.mkdir(parents=True, exist_ok=True)
    f = d / name
    if not f.exists():
        f.write_bytes(data)
    return f'{rel_dir}/{name}'


def infographic(folder: Path, run, rel_dir: str):
    src = folder / run['file']
    img = Image.open(src)
    w, h = img.size
    full = webp(img, FULL_MAX)
    thumb = webp(img, THUMB_MAX)
    fim = Image.open(io.BytesIO(full))
    return {
        'status': 'ready', 'orientation': 'landscape' if w >= h else 'portrait',
        'full': put(rel_dir, 'infographic', 'webp', full), 'thumb': put(rel_dir, 'infographic-thumb', 'webp', thumb),
        'w': fim.size[0], 'h': fim.size[1], 'source': run['file'], 'quality': run['status'],
    }


def course(folder: Path, run, rel_dir: str):
    src = folder / run['file']
    doc = fitz.open(src)
    pages, thumb = [], None
    for i, page in enumerate(doc, 1):
        z = FULL_MAX / page.rect.width
        pm = page.get_pixmap(matrix=fitz.Matrix(z, z))
        im = Image.frombytes('RGB', (pm.width, pm.height), pm.samples)
        pages.append(put(rel_dir, f'p{i}', 'webp', webp(im, FULL_MAX)))
        if i == 1:
            thumb = put(rel_dir, 'course-thumb', 'webp', webp(im, THUMB_MAX))
            size = [pm.width, pm.height]
    pdf_bytes = src.read_bytes()
    return {
        'status': 'ready', 'pages': pages, 'thumb': thumb, 'w': size[0], 'h': size[1],
        'pdf': put(rel_dir, 'course', 'pdf', pdf_bytes), 'pdfBytes': len(pdf_bytes), 'source': run['file'], 'quality': run['status'],
    }


def video(folder: Path, stem: str, rel_dir: str):
    files = sorted(f for f in folder.glob(f'*__{stem}__video-enfant__v*.mp4'))
    if not files:
        return None
    data = files[-1].read_bytes()
    return {'status': 'ready', 'file': put(rel_dir, 'video', 'mp4', data), 'bytes': len(data), 'source': files[-1].name}


def build_book(bdir: Path, num: int, errors: list, warns: list, do_images: bool):
    book, themes = RS.analyse(bdir)
    classe = bdir.parent.name.replace('_', '-')
    livre = bdir.name.replace('_', '-')
    folder = OUT / bdir.parent.name / bdir.name
    man = json.loads((folder / 'manifest.json').read_text(encoding='utf-8')) if (folder / 'manifest.json').exists() else {'runs': []}
    runs = [r for r in man['runs'] if not r.get('hidden')]

    if folder.exists():
        for f in folder.iterdir():
            if f.is_file() and f.name != 'manifest.json' and not STRICT.match(f.name):
                warns.append(f'{classe}/{livre}: file name does not match the strict pattern, skipped: {f.name}')
        known = {t['file'] for t in themes}
        for r in man['runs']:
            if r.get('sourceFile') not in known:
                warns.append(f"{classe}/{livre}: manifest entry for unknown theme file {r.get('sourceFile')}")
            if not (folder / r['file']).exists():
                warns.append(f"{classe}/{livre}: manifest lists a missing file {r['file']}")

    out_themes = []
    for t in themes:
        stem = t['file'][:-3]
        rel = f'{classe}/{livre}/{stem}'
        mine = [r for r in runs if r.get('sourceFile') == t['file'] and (folder / r['file']).exists()]
        slots = {}
        ig = pick([r for r in mine if r['type'] == 'infographic'])
        cs = pick([r for r in mine if r['type'] == 'course-slides'])
        if do_images:
            slots['infographic'] = infographic(folder, ig, f'img/{rel}') if ig else None
            slots['course'] = course(folder, cs, f'course/{rel}') if cs else None
            slots['video'] = video(folder, stem, f'video/{rel}') if folder.exists() else None
        out_themes.append({
            'id': stem, 'n': t['n'], 'title': t['theme'], 'subject': t['subject'], 'exerciseCount': t['ex'],
            'slots': {k: (v or {'status': 'pending'}) for k, v in slots.items()} if do_images else {},
        })

    has_ready = any(s['status'] == 'ready' for th in out_themes for s in th['slots'].values())
    for th in out_themes:
        for key in ('infographic', 'course', 'video'):
            s = th['slots'].setdefault(key, {'status': 'pending'})
            if s['status'] == 'pending':
                s['status'] = 'in-progress' if has_ready else 'soon'
    ready_themes = sum(any(s['status'] == 'ready' for s in th['slots'].values()) for th in out_themes)
    subjects = sorted({th['subject'] for th in out_themes})
    book_entry = {
        'id': f'{classe}/{livre}', 'classe': classe, 'title': book['title'], 'number': num, 'subject': book['subject'], 'subjects': subjects,
        'themeCount': len(out_themes), 'readyCount': ready_themes,
        'resources': {'parentGuide': {'status': 'in-progress' if has_ready else 'soon'}},
        'themes': out_themes,
    }
    # Check for official cover in public/assets/resources
    cover_candidate = Path(ROOT.parent / f'public/assets/resources/{classe}/parascolaire/trimestre-1/{livre}/cover.webp')
    if cover_candidate.exists():
        book_entry['cover'] = f'assets/resources/{classe}/parascolaire/trimestre-1/{livre}/cover.webp'
    return book_entry


def validate(catalog: dict, errors: list):
    seen = set()
    for b in catalog['books']:
        ids = [t['id'] for t in b['themes']]
        if len(ids) != len(set(ids)):
            errors.append(f"{b['id']}: duplicate theme ids")
        if b['themeCount'] != len(b['themes']):
            errors.append(f"{b['id']}: themeCount mismatch")
        for t in b['themes']:
            for key, s in t['slots'].items():
                if s['status'] not in ('ready', 'in-progress', 'soon'):
                    errors.append(f"{b['id']}/{t['id']}/{key}: bad status {s['status']}")
                if s['status'] == 'ready':
                    paths = [s.get(k) for k in ('full', 'thumb', 'pdf', 'file') if s.get(k)] + list(s.get('pages', []))
                    if not paths:
                        errors.append(f"{b['id']}/{t['id']}/{key}: ready without files")
                    for p in paths:
                        seen.add(p)
                        if not (PUB / p).exists():
                            errors.append(f'missing file {p}')
    return seen


def main():
    avail = EX.books()
    nums = RS.notebook_numbers(avail)
    errors, warns = [], []
    books = []
    for name in sorted(avail, key=lambda n: nums[f'{avail[n].parent.name}/{n}']):
        bdir = avail[name]
        books.append(build_book(bdir, nums[f'{bdir.parent.name}/{name}'], errors, warns, do_images=True))
    classes, seen_c = [], set()
    for b in sorted(books, key=lambda b: b['classe']):
        if b['classe'] not in seen_c:
            seen_c.add(b['classe'])
            grade = next(bd for n, bd in avail.items() if bd.parent.name.replace('_', '-') == b['classe'])
            label = EX.load(grade / 'book.json')['grade']
            classes.append({'id': b['classe'], 'label': label, 'order': int(label[0])})
    classes.sort(key=lambda c: c['order'])
    catalog = {'version': 1, 'generatedAt': datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'), 'classes': classes, 'books': books}
    validate(catalog, errors)
    for w in warns:
        print('WARN', w)
    if errors:
        for e in errors:
            print('ERROR', e)
        sys.exit('catalog not written: fix the errors above')
    (PUB / 'catalog.json').write_text(json.dumps(catalog, ensure_ascii=False, indent=1), encoding='utf-8')
    total = sum(f.stat().st_size for f in PUB.rglob('*') if f.is_file())
    n_themes = sum(b['themeCount'] for b in books)
    n_ready = sum(1 for b in books for t in b['themes'] for s in t['slots'].values() if s['status'] == 'ready')
    print(f"catalog.json written: {len(books)} books, {n_themes} themes, {n_ready} ready slots, {total / 1048576:.1f} MB in publish/")


if __name__ == '__main__':
    main()
