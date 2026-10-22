#!/usr/bin/env python3
"""Rebuild 06 from the verified delivered 05 when the R61 baseline is unavailable.
Only the town BGM gate and casual host code change; all game/assets/editor code stays intact.
"""
from pathlib import Path
import hashlib,json,sys
from bgm_gate import patch_html
here=Path(__file__).resolve().parent;root=here.parent
source=Path(sys.argv[1]);raw=source.read_bytes()
assert hashlib.sha256(raw).hexdigest()=='cf2af069dbc0740f6f4b74d01a765c8e6b044e2636e84f24a7a86074af6fcc77','Expected delivered CASUAL-05'
s=raw.decode();needle="<script>\n(()=>{'use strict';\nconst BUILD='CASUAL-05'"
assert s.count(needle)==1
a=s.index(needle);b=s.index('</script>',a)
s=s[:a]+'<script>\n'+(here/'app.js').read_text()+'\n'+s[b:]
s=patch_html(s);out=root/'GAIA-CASUAL-06.html';out.write_text(s)
data=out.read_bytes();manifest={'build':'CASUAL-06','size':len(data),'sha256':hashlib.sha256(data).hexdigest(),'baseline':'R61','edition':'casual','storageKey':'gaia-casual-save-v1'}
(here/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n');print(json.dumps(manifest))
