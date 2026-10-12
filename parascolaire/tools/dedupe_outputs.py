"""Delete byte-identical duplicate files under parascolaire/outputs/ (run BEFORE sorting or renaming anything).
Keeps the file with the strict name (contains '__'), else the oldest. Usage: python parascolaire/tools/dedupe_outputs.py"""
import hashlib, sys
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8')
OUT = Path(__file__).resolve().parent.parent / 'outputs'
seen = {}
for f in sorted((p for p in OUT.rglob('*') if p.is_file() and p.name != 'manifest.json'), key=lambda p: (('__' not in p.name), p.stat().st_mtime)):
    h = hashlib.md5(f.read_bytes()).hexdigest()
    if h in seen:
        print(f'deleted duplicate: {f.relative_to(OUT)}  (same as {seen[h].relative_to(OUT)})'); f.unlink()
    else:
        seen[h] = f
print(f'{len(seen)} unique files')
