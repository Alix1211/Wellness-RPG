#!/usr/bin/env python3
"""R48: 방 이름표를 한 줄(같은 높이, 그림 위쪽 띠)로 정렬해 올리고 화면 안에 보이는 구역 중앙에 표시 / 대화창 주인공 초상화를 NPC 수준으로 축소.
usage: r48-patch.py WORKDIR REPO   (r47 위에 적용)"""
import sys
from pathlib import Path
W=Path(sys.argv[1])
def sub(s,old,new,n=1):
    assert s.count(old)==n,(s.count(old),old[:90]);return s.replace(old,new)
p=W/'script-16.js';s=p.read_text(encoding='utf8')
s=sub(s,"for(const r of f.rooms){if(r.x<v.cam-300||r.x>v.cam+v.width+300||r.entry&&false)continue;box(r.x-74,112,148,28,12,'#fff5e8e0');text(r.name,r.x,131,16,'#79516a');}",
 "{const hl=v.cam+250/v.s+90,hr=v.cam+v.width-96/v.s;for(const r of f.rooms){const a=Math.max(r.x0,hl),b=Math.min(r.x1,hr);if(b-a<160)continue;const lx=(a+b)/2;box(lx-74,92,148,28,12,'#fff5e8e0');text(r.name,lx,111,16,'#79516a');}}")
s=sub(s,"let schedKey=-1;window.__talkShot=null;","let schedKey=-1;window.__talkShot=null;document.head.append(Object.assign(document.createElement('style'),{textContent:'#roomScene #femalePortrait{scale:.86;transform-origin:center bottom}'}));")
p.write_text(s,encoding='utf8');print('r48 patched')
