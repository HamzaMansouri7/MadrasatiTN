"""Set correctionStatus on every exam page: linked | self_contained | no_correction_yet (not parked)."""
import json, collections, sys
from pathlib import Path
sys.stdout.reconfigure(encoding='utf-8')
c = collections.Counter()
for pf in sorted(Path('parascolaire/_archive').glob('*/pages/*.json')):
    d = json.loads(pf.read_text(encoding='utf-8'))
    t = d.get('pageType') or d.get('tags', {}).get('pageType')
    if t != 'exam': d.pop('correctionStatus', None); continue
    inline = any(i['kind'] == 'answer' or i.get('answer') for i in d['items'])
    st = 'linked' if d.get('correctionPages') else 'self_contained' if (d.get('selfContained') or inline) else 'no_correction_yet'
    d['correctionStatus'] = st; c[st] += 1
    pf.write_text(json.dumps(d, ensure_ascii=False, indent=2), encoding='utf-8')
print(dict(c))
