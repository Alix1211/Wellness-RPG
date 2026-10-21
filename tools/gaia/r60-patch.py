#!/usr/bin/env python3
"""R60: 줄 자르기 입구를 케인이 그린 빨간 타원 위치(822→789)로 이동, 화면의 타점 타원은 숨김.
usage: r60-patch.py WORKDIR   (r57 위에 적용)"""
import sys
from pathlib import Path
W=Path(sys.argv[1])
def sub(s,old,new,n=1):
    assert s.count(old)==n,(old[:60],s.count(old));return s.replace(old,new)
p=W/'script-02.js';s=p.read_text(encoding='utf8')
s=sub(s,"y:(root.__ropeH?822:650)","y:(root.__ropeH?789:650)")
s=sub(s,"ctx.fillStyle='#446e6688';ctx.beginPath();ctx.ellipse(goal.x,goal.y,goal.width/2,19,goal.rotation||0,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#77b8a2';ctx.lineWidth=8;ctx.stroke();","if(!root.__ropeH){ctx.fillStyle='#446e6688';ctx.beginPath();ctx.ellipse(goal.x,goal.y,goal.width/2,19,goal.rotation||0,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#77b8a2';ctx.lineWidth=8;ctx.stroke();}")
p.write_text(s,encoding='utf8')
p=W/'script-06.js';s=p.read_text(encoding='utf8')
s=sub(s,"y:(cfg.kind==='rope'?822/1280:650/720),","y:(cfg.kind==='rope'?789/1280:650/720),")
p.write_text(s,encoding='utf8')
