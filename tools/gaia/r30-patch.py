#!/usr/bin/env python3
"""R30: usage r30-patch.py WORKDIR
 - Studio: '전체 초기화' button resets every layer of the current orientation (and targets).
 - Road test button '실린더' in the city UI: starts the cylinder encounter at once (enabled only while travelling)."""
import sys
from pathlib import Path
W=Path(sys.argv[1])
def rd(n):return (W/n).read_text(encoding='utf8')
def wr(n,s):(W/n).write_text(s,encoding='utf8')
def sub(s,old,new):
    assert s.count(old)==1,(old[:80],s.count(old));return s.replace(old,new)
s=rd('script-12.js')
s=sub(s,'<button data-a="reset">초기화</button>','<button data-a="reset">초기화</button><button data-a="resetall">전체 초기화</button>')
s=sub(s,"q('[data-a=save]').onclick=async()=>{","q('[data-a=resetall]').onclick=()=>{config[ori]={};config.targets={};refresh();q('#studioStatus').textContent='이 방향의 모든 배치를 처음 상태로 되돌렸습니다. 저장을 눌러야 확정됩니다.';};q('[data-a=save]').onclick=async()=>{")
wr('script-12.js',s)
s=rd('script-13.js')
s=sub(s,"back=document.createElement('button');back.id='cityReturn';","const testEnc=document.createElement('button');testEnc.id='cityTestEnc';testEnc.type='button';testEnc.textContent='실린더 테스트';testEnc.disabled=true;testEnc.style.cssText='position:fixed;left:8px;bottom:8px;z-index:60;padding:8px 12px;font:700 13px system-ui;border-radius:10px;border:1px solid #fff6;background:#0009;color:#fff';testEnc.onclick=()=>{if(state==='travel'&&!encounter)beginEncounter();};ui.append(testEnc);setInterval(()=>{testEnc.disabled=!(active&&state==='travel'&&!encounter);},300);\n back=document.createElement('button');back.id='cityReturn';")
wr('script-13.js',s)
# cylinder is portrait-only: always use the portrait layout
s=rd('script-06.js')
s=sub(s,"const ori=innerHeight>innerWidth?'portrait':'landscape',ls=layout[ori]||{}","const ori=(innerHeight>innerWidth||cfg.kind==='cylinder'||window.GAME_CONFIG?.kind==='cylinder')?'portrait':'landscape',ls=layout[ori]||{}")
wr('script-06.js',s)
s=rd('script-12.js')
s=sub(s,"ori=orientation();config[ori]||={};","ori=(inGame&&frame?.contentWindow?.GAME_CONFIG?.kind==='cylinder')?'portrait':orientation();config[ori]||={};")
wr('script-12.js',s)
print('r30 patched')
