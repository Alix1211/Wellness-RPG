#!/usr/bin/env python3
"""R52: 화면 편집(게임판 맞추기) 중에는 '잠시 쉬는 중' 창이 게임판을 가리지 않게 숨김.
usage: r52-patch.py WORKDIR   (r51 위에 적용)"""
import sys
from pathlib import Path
W=Path(sys.argv[1]);p=W/'script-06.js';s=p.read_text(encoding='utf8')
old="window.MEDIA_PAUSED=true;window.LifeMini?.pause(true);}"
assert s.count(old)==1
new="window.MEDIA_PAUSED=true;window.LifeMini?.pause(true);const ov=document.querySelector('#overlay');let st=false;try{st=!!parent.document.querySelector('#studio');}catch(e){}if(ov&&st)ov.hidden=true;}"
s=s.replace(old,new)
p.write_text(s,encoding='utf8');print('r52 patched')
