#!/usr/bin/env python3
"""Split a built HTML into committed gzip parts + manifest. Usage: make-parts.py BUILD_LABEL path/to/GAIA-LIFE.html"""
import gzip,hashlib,json,sys
from pathlib import Path
root=Path(__file__).resolve().parents[2];d=root/'builds/gaia-life-20261020';label,src=sys.argv[1],Path(sys.argv[2])
data=src.read_bytes();gz=gzip.compress(data,9,mtime=0);CH=5242880
for old in d.glob('html.gz.part-*'):old.unlink()
parts=[]
for i in range(0,len(gz),CH):
    n=f'builds/gaia-life-20261020/html.gz.part-{i//CH:02d}';(root/n).write_bytes(gz[i:i+CH]);parts.append(n)
(d/'manifest.json').write_text(json.dumps({'build':label,'sha256':hashlib.sha256(data).hexdigest(),'size':len(data),'compression':'gzip','parts':parts},indent=2)+'\n')
print(label,len(data),len(parts),'parts')
