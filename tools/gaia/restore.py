#!/usr/bin/env python3
"""Restore the exact self-contained latest HTML from committed gzip parts."""
import gzip,hashlib,json,re,subprocess,sys,tempfile
from pathlib import Path
root=Path(__file__).resolve().parents[2]
m=json.loads((root/'builds/gaia-life-20261020/manifest.json').read_text())
data=gzip.decompress(b''.join((root/p).read_bytes() for p in m['parts']))
assert len(data)==m['size'] and hashlib.sha256(data).hexdigest()==m['sha256']
if m.get('transform'):
 assert m['transform'] in ('belt-scroll-r61','belt-scroll-r62'), 'Unknown release transform'
 html=data.decode('utf-8')
 scripts=list(re.finditer(r'<script([^>]*)>([\s\S]*?)</script\s*>',html))
 assert len(scripts)==23
 with tempfile.TemporaryDirectory(prefix='gaia-belt-') as tmp:
  work=Path(tmp)
  for i in (7,13,16):(work/f'script-{i:02}.js').write_text(scripts[i][2],encoding='utf-8')
  subprocess.run([sys.executable,str(root/'tools/gaia/r61-belt-scroll.py'),tmp],check=True)
  if m['transform']=='belt-scroll-r62':
   subprocess.run([sys.executable,str(root/'tools/gaia/r62-portal-controls.py'),tmp],check=True)
  for i in (16,13,7):
   match=scripts[i]
   html=html[:match.start(2)]+(work/f'script-{i:02}.js').read_text(encoding='utf-8')+html[match.end(2):]
 data=html.encode('utf-8')
 assert len(data)==m['output_size'] and hashlib.sha256(data).hexdigest()==m['output_sha256']
out=root/'GAIA-LIFE-20261020.html'
out.write_bytes(data)
print(out,len(data),hashlib.sha256(data).hexdigest())
