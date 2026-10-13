"""Apply the two-pass audit (audit_exercises.py + audit_verify.py) to livres/.

Per page: a page is promoted only if EVERY pending item on it is ok, or its flag was confirmed/partial (fix applied),
or rejected by the verifier (original kept). Pages with unreadable items or no parsed verdict stay pending.
Promoted pages get quality.status = 'ai_verified' and their pending exercises become tier 'ready'.
Usage: python parascolaire/tools/audit_apply.py [--dry-run]
"""
import json, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
AUD = ROOT / 'parascolaire' / 'outputs' / 'audit'
dry = '--dry-run' in sys.argv
tot = {'pages': 0, 'kept': 0, 'fixed': 0, 'ready': 0}
for rep in sorted(AUD.glob('*.json')):
    book = rep.stem.replace('__', '/')
    bdir = ROOT / 'parascolaire' / 'livres' / book
    first = json.loads(rep.read_text(encoding='utf-8'))
    ver_p = AUD / 'verified' / rep.name
    ver = json.loads(ver_p.read_text(encoding='utf-8')) if ver_p.exists() else {}
    ex_p = bdir / 'exercices.json'
    ex = json.loads(ex_p.read_text(encoding='utf-8'))
    by_id = {e['id']: e for e in ex['exercises']}
    for pg, v in first.items():
        items = v['result'].get('items')
        if not items:
            tot['kept'] += 1; continue
        vitems = {i['id']: i for i in ver.get(pg, {}).get('items', [])}
        ok_page, fixes = True, {}
        for i in items:
            if i['verdict'] == 'ok': continue
            if i['verdict'] == 'fix' and i['id'] in vitems:
                f = vitems[i['id']]
                if f.get('final') in ('confirmed', 'partial') and f.get('fixed'): fixes[i['id']] = f['fixed']
                elif f.get('final') == 'rejected': pass
                else: ok_page = False
            else: ok_page = False
        if not ok_page:
            tot['kept'] += 1; continue
        pf = bdir / 'pages' / f'{int(pg):03d}.json'
        page = json.loads(pf.read_text(encoding='utf-8'))
        for it in page['items']:
            if it.get('id') in fixes:
                for k in ('instruction', 'body'):
                    if fixes[it['id']].get(k): it[k] = fixes[it['id']][k]
                it['auditFix'] = 'claude-vision-2pass-2026-10-13'
                tot['fixed'] += 1
        page['quality'] = {**page.get('quality', {}), 'status': 'ai_verified'}
        for i in items:
            e = by_id.get(i['id'])
            if e and e['tier'] == 'pending_audit':
                e['tier'] = 'ready'; e['quality'] = 'ai_verified'; tot['ready'] += 1
        tot['pages'] += 1
        if not dry: pf.write_text(json.dumps(page, ensure_ascii=False, indent=2), encoding='utf-8')
    if not dry: ex_p.write_text(json.dumps(ex, ensure_ascii=False, indent=2), encoding='utf-8')
print(tot, '(dry run)' if dry else '')
