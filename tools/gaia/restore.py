#!/usr/bin/env python3
"""Restore original R60, then apply its verified input/control repair and cast/quest links."""
import gzip,hashlib,json,re,subprocess
from pathlib import Path
root=Path(__file__).resolve().parents[2]
m=json.loads((root/'builds/gaia-life-20261020/manifest.json').read_text())
data=gzip.decompress(b''.join((root/p).read_bytes() for p in m['parts']))
assert len(data)==m['size'] and hashlib.sha256(data).hexdigest()==m['sha256']
html=data.decode('utf-8')
if m.get('transform'):
 assert m['transform']=='r60-controls-cast'
 text=(root/'src/gaia-life/r60-controls-fix.mjs').read_text()
 changes=json.JSONDecoder().raw_decode(text.split('const CHANGES=',1)[1])[0]
 ss=list(re.finditer(r'<script([^>]*)>([\s\S]*?)</script\s*>',html))
 assert len(ss)==23
 for i in [16,13,5]:
  source=ss[i][2]
  for p in changes:
   if p['script']!=i:continue
   assert source.count(p['before'])==p['count']
   source=source.replace(p['before'],p['after'])
  html=html[:ss[i].start(2)]+source+html[ss[i].end(2):]
 data=html.encode('utf-8')
 assert len(data)==m['output_size'] and hashlib.sha256(data).hexdigest()==m['output_sha256']
out=root/'GAIA-LIFE-R60-CONTROLS.html'
out.write_bytes(data)
print(out,len(data),hashlib.sha256(data).hexdigest())
if m.get('story_transform')=='gaia-cohab-ending-v1':
 final=root/'GAIA-LIFE-R60-COHAB.html'
 subprocess.run(['node',str(root/'tools/gaia/apply-cohab.mjs'),str(out),str(final)],check=True)
 result=final.read_bytes()
 assert len(result)==m['story_output_size'] and hashlib.sha256(result).hexdigest()==m['story_output_sha256']
 print(final,len(result),hashlib.sha256(result).hexdigest())
