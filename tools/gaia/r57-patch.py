#!/usr/bin/env python3
"""R57: 줄 자르기 난이도 완화 — 입구를 조금 올리고(900→860) 넓힘(폭 104→150).
usage: r57-patch.py WORKDIR   (r54 위에 적용)"""
import sys
from pathlib import Path
W=Path(sys.argv[1])
def sub(s,old,new,n=1):
    assert s.count(old)==n,(old[:60],s.count(old));return s.replace(old,new)
p=W/'script-02.js';s=p.read_text(encoding='utf8')
s=sub(s,"this.goal={x:360,y:(root.__ropeH?900:650),width:104};","this.goal={x:360,y:(root.__ropeH?860:650),width:(root.__ropeH?150:104)};")
p.write_text(s,encoding='utf8')
p=W/'script-06.js';s=p.read_text(encoding='utf8')
s=sub(s,"y:(cfg.kind==='rope'?900/1280:650/720),","y:(cfg.kind==='rope'?860/1280:650/720),")
s=sub(s,"width:104*v.z,rotation:v.r*Math.PI/180","width:(cfg.kind==='rope'?150:104)*v.z,rotation:v.r*Math.PI/180")
p.write_text(s,encoding='utf8');print('r57 patched')
