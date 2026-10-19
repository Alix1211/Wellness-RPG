#!/usr/bin/env python3
"""Extract/repack top-level scripts without replacing or decoding embedded artwork."""
import argparse,json,re,hashlib
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('action',choices=['extract','pack']);p.add_argument('--html',default='GAIA-LIFE-20261020.html');p.add_argument('--dir',default='.gaia-edit');p.add_argument('--output',default='gaia-edited.html');a=p.parse_args();d=Path(a.dir)
if a.action=='extract':
 raw=Path(a.html).read_bytes();s=raw.decode('utf-8');d.mkdir(parents=True,exist_ok=True);matches=list(re.finditer(r'<script([^>]*)>([\s\S]*?)</script\s*>',s));parts=[];pos=0
 for i,m in enumerate(matches):
  parts.append(s[pos:m.start(2)]);pos=m.end(2);(d/f'script-{i:02}.js').write_text(m[2],encoding='utf-8')
 parts.append(s[pos:]);(d/'structure.json').write_text(json.dumps(parts,ensure_ascii=False),encoding='utf-8');(d/'manifest.json').write_text(json.dumps({'scripts':len(matches),'sha256':hashlib.sha256(raw).hexdigest(),'source':a.html},indent=2),encoding='utf-8');print(f'{len(matches)} scripts extracted to {d}')
else:
 parts=json.loads((d/'structure.json').read_text());s=parts[0]
 for i,tail in enumerate(parts[1:]):s+=(d/f'script-{i:02}.js').read_text()+tail
 Path(a.output).write_bytes(s.encode('utf-8'));print(hashlib.sha256(s.encode()).hexdigest(),a.output)
