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
s=sub(s,"const ori=innerHeight>innerWidth?'portrait':'landscape',ls=layout[ori]||{}","const ori=(innerHeight>innerWidth||cfg.kind==='cylinder'||document.body.classList.contains('cylinder-game'))?'portrait':'landscape',ls=layout[ori]||{}")
wr('script-06.js',s)
s=rd('script-12.js')
s=sub(s,"ori=orientation();config[ori]||={};","ori=(inGame&&frame?.contentDocument?.body?.classList.contains('cylinder-game'))?'portrait':orientation();config[ori]||={};")
wr('script-12.js',s)
# side bars of the cylinder are plain black (background clipped to the portrait box)
s=rd('script-06.js')
a=".cylinder-game .play{width:min(100vw,calc((100dvh - 44px)*9/16))!important;"
s=sub(s,a,"html:has(body.cylinder-game),body.cylinder-game{background:#000!important}body.cylinder-game::before,body.cylinder-game::after{content:'';position:fixed;top:0;bottom:0;width:max(0px,calc((100vw - 100dvh*9/16)/2));background:#000;z-index:1;pointer-events:none}body.cylinder-game::before{left:0}body.cylinder-game::after{right:0}\\n"+a)
wr('script-06.js',s)
s=rd('script-06.js')
a=".cylinder-game .play{position:fixed!important;inset:0!important;width:100vw!important;height:100dvh!important;max-width:none!important;max-height:none!important;aspect-ratio:auto!important;margin:0!important;border-radius:0!important}"
s=sub(s,a,a+".cylinder-game .play{inset:0 auto 0 50%!important;width:min(100vw,calc(100dvh*9/16))!important;transform:translateX(-50%)!important}.cylinder-game .overlay{left:50%!important;right:auto!important;width:min(100vw,calc(100dvh*9/16))!important;transform:translateX(-50%)!important}")
wr('script-06.js',s)
s=rd('script-16.js')
s=sub(s,"const stay=()=>{fleeClose();if(fleePaused){try{$('#miniFrame').contentWindow.LifeMini.pause(false);}catch{}}fleePaused=false;};","const stay=()=>{fleeClose();if(fleePaused){try{$('#miniFrame').contentWindow.LifeMini.pause(false);}catch{}}fleePaused=false;try{$('#miniFrame').focus();$('#miniFrame').contentWindow.focus();}catch{}};")
wr('script-16.js',s)
s=rd('script-16.js')
s=s.rstrip()+"\n;(()=>{let last=null;setInterval(()=>{const f=document.getElementById('miniFrame'),L=document.getElementById('miniLayer');if(!f||!L)return;try{const d=f.contentDocument;const cyl=!!(d&&d.body&&d.body.classList.contains('cylinder-game'));L.style.background=(cyl&&!L.hidden)?'#000':'';if(d&&d!==last&&d.readyState==='complete'){last=d;f.focus();f.contentWindow.focus();}}catch(e){}},250);})();\n"
wr('script-16.js',s)
print('r30 patched')
