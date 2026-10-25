from pathlib import Path
import argparse,zipfile,hashlib
p=argparse.ArgumentParser();p.add_argument('--html',required=True);p.add_argument('--build',required=True,type=int);p.add_argument('--assets');p.add_argument('--out',required=True);a=p.parse_args()
d=Path(a.out);d.mkdir(parents=True,exist_ok=True);f=d/('game-'+str(a.build)+'.zip')
with zipfile.ZipFile(f,'w',zipfile.ZIP_DEFLATED) as z:
 z.write(a.html,'index.html')
 if a.assets:
  for x in sorted(Path(a.assets).rglob('*')):
   if x.is_file():z.write(x,'assets/'+x.relative_to(a.assets).as_posix())
b=f.read_bytes();names=[]
for i,start in enumerate(range(0,len(b),524288)):
 name=f.name+f'.part-{i:03d}';(d/name).write_bytes(b[start:start+524288]);names.append(name)
(d/'update.properties').write_text(f'build={a.build}\nminNative=2026102503\nsha256={hashlib.sha256(b).hexdigest()}\nsize={len(b)}\nparts='+','.join(names)+'\n')
print('Publish versioned parts, then update.properties; keep previous parts.')
