#!/usr/bin/env python3
"""Restore the exact self-contained latest HTML from committed gzip parts."""
import gzip,hashlib,json
from pathlib import Path
root=Path(__file__).resolve().parents[2];m=json.loads((root/'builds/gaia-life-20261020/manifest.json').read_text());data=gzip.decompress(b''.join((root/p).read_bytes() for p in m['parts']));assert hashlib.sha256(data).hexdigest()==m['sha256'];out=root/'GAIA-LIFE-20261020.html';out.write_bytes(data);print(out, len(data),m['sha256'])
