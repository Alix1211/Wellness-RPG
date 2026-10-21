#!/usr/bin/env python3
"""Prepare a public/static update feed without editing the game or uploading it."""
from pathlib import Path
import argparse,gzip,hashlib,json,shutil
p=argparse.ArgumentParser();p.add_argument('--html',required=True);p.add_argument('--build',required=True);p.add_argument('--out',required=True);a=p.parse_args()
src=Path(a.html);data=src.read_bytes();assert b'<html' in data[:65536].lower() or b'<!doctype html' in data[:65536].lower()
out=Path(a.out);version=a.build+'-'+hashlib.sha256(data).hexdigest()[:12];dest=out/version;dest.mkdir(parents=True,exist_ok=True)
compressed=gzip.compress(data,compresslevel=6,mtime=0);parts=[]
for i,start in enumerate(range(0,len(compressed),5*1024*1024)):
 name=f'game.gz.part-{i:02d}';(dest/name).write_bytes(compressed[start:start+5*1024*1024]);parts.append(version+'/'+name)
m={'build':a.build,'sha256':hashlib.sha256(data).hexdigest(),'size':len(data),'compression':'gzip','parts':parts}
# Upload versioned files first, replace update.json LAST. Keep old version folders.
temp=out/'update.json.tmp';temp.write_text(json.dumps(m,indent=2)+'\n');temp.replace(out/'update.json')
print(out/'update.json');print('Publish version folder first and update.json last. No upload has been performed.')
