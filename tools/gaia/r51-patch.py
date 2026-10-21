#!/usr/bin/env python3
"""R51: 기구 훈련층(3층) 기구방 B/C 사이 이음새를 민트색 기둥으로 가림.
usage: r51-patch.py WORKDIR   (r50 위에 적용)"""
import sys
from pathlib import Path
W=Path(sys.argv[1]);p=W/'script-16.js';s=p.read_text(encoding='utf8')
old="drawLift(f);\n {const hl=v.cam+250/v.s+90"
assert s.count(old)==1
new=("drawLift(f);\n if(fi===2){const sx=f.bay+L[0].w,pw=86,px=sx-pw/2;if(px+pw>v.cam-20&&px<v.cam+v.width+20){const y0=FL_Y-2,y1=FL_Y+FL_T-6,g=ctx.createLinearGradient(px,0,px+pw,0);g.addColorStop(0,'#5fb9a5');g.addColorStop(.18,'#8fe0cb');g.addColorStop(.5,'#b9f2e2');g.addColorStop(.82,'#8fe0cb');g.addColorStop(1,'#56ad99');"
"ctx.fillStyle='#00000026';ctx.beginPath();ctx.ellipse(sx,y1+2,pw*.62,9,0,0,6.283);ctx.fill();"
"ctx.fillStyle=g;ctx.fillRect(px,y0,pw,y1-y0);ctx.fillStyle='#ffffff55';ctx.fillRect(px+pw*.22,y0,6,y1-y0);"
"ctx.fillStyle='#7ccdb8';ctx.fillRect(px-8,y0,pw+16,22);ctx.fillRect(px-8,y1-26,pw+16,26);ctx.fillStyle='#d6fbf0';ctx.fillRect(px-8,y0,pw+16,6);ctx.fillRect(px-8,y1-26,pw+16,5);"
"ctx.strokeStyle='#3f8f7e';ctx.lineWidth=3;ctx.strokeRect(px,y0,pw,y1-y0);}}\n {const hl=v.cam+250/v.s+90")
s=s.replace(old,new);p.write_text(s,encoding='utf8');print('r51 patched')
