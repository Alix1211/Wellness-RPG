"""Preserve the current OTA archive's assets and reuse unchanged download parts."""
from pathlib import Path
import argparse, hashlib, io, zipfile
p=argparse.ArgumentParser()
p.add_argument('--html',required=True)
p.add_argument('--build',required=True,type=int)
p.add_argument('--out',required=True)
a=p.parse_args()
out=Path(a.out)
props=dict(line.split('=',1) for line in (out/'update.properties').read_text().splitlines())
assert a.build>int(props['build'])
names=props['parts'].split(',')
original=b''.join((out/n).read_bytes() for n in names)
assert hashlib.sha256(original).hexdigest()==props['sha256']
old=zipfile.ZipFile(io.BytesIO(original))
buffer=io.BytesIO()
with zipfile.ZipFile(buffer,'w') as z:
    for info in old.infolist():
        z.writestr(info,Path(a.html).read_bytes() if info.filename=='index.html' else old.read(info))
data=buffer.getvalue()
with zipfile.ZipFile(io.BytesIO(data)) as z:
    assert z.testzip() is None
    assert z.read('index.html')==Path(a.html).read_bytes()
    for name in old.namelist():
        if name!='index.html': assert z.read(name)==old.read(name)
parts=[]
for i,start in enumerate(range(0,len(data),524288)):
    part=data[start:start+524288]
    if i<len(names) and (out/names[i]).read_bytes()==part:
        name=names[i]
    else:
        name=f'game-{a.build}.zip.part-{i:03d}'
        (out/name).write_bytes(part)
    parts.append(name)
assert b''.join((out/n).read_bytes() for n in parts)==data
(out/'update.properties').write_text(f'build={a.build}\nminNative={props["minNative"]}\nsha256={hashlib.sha256(data).hexdigest()}\nsize={len(data)}\nparts='+','.join(parts)+'\n')
print({'build':a.build,'bytes':len(data),'newParts':sum(n not in names for n in parts),'sha256':hashlib.sha256(data).hexdigest()})
