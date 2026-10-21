#!/usr/bin/env python3
"""R53: 줄 자르기(rope) 세로 전용 — 판을 720x1280으로 키우고 입구를 70% 높이(세로 900)로 내림.
 - script-02 : 캔버스 높이/그리기/물리(입구 y, 낙하선)/세로 비율 CSS
 - script-06 : 편집기 좌표(입구 기본값·적용·포인터 변환)를 판 높이에 맞춤
usage: r53-patch.py WORKDIR   (r52 위에 적용)"""
import sys
from pathlib import Path
W=Path(sys.argv[1])
def sub(s,old,new,n=1):
    assert s.count(old)==n,(old[:60],s.count(old));return s.replace(old,new)
p=W/'script-02.js';s=p.read_text(encoding='utf8')
s=sub(s,"W=720,images={}","W=720,H=GAME_CONFIG.kind==='rope'?1280:720,images={}")
s=sub(s,"if(kind==='cylinder')document.body.classList.add('cylinder-game');",
"if(kind==='cylinder')document.body.classList.add('cylinder-game');else if(kind==='rope'){window.__ropeH=1280;canvas.height=1280;document.body.classList.add('rope-game');const st=document.createElement('style');st.textContent='.rope-game .play{aspect-ratio:9/16!important;width:min(calc(100vw - 16px),calc((100dvh - 128px)*9/16))!important}';document.head.append(st);}")
i=s.index('function draw(){');j=s.index('var wasShoot=false;')
d=s[i:j]
d=d.replace('ctx.clearRect(0,0,720,720)','ctx.clearRect(0,0,720,H)').replace('createLinearGradient(0,0,0,720)','createLinearGradient(0,0,0,H)').replace('fillRect(0,0,720,720)','fillRect(0,0,720,H)').replace('fit(images.bg,0,0,720,720)','fit(images.bg,0,0,720,H)')
assert '720,720' not in d,d.count('720,720')
s=s[:i]+d+s[j:]
s=sub(s,"this.goal={x:360,y:650,width:104};","this.goal={x:360,y:(root.__ropeH?900:650),width:104};")
s=sub(s,"if(p.y>760){this.done=true;break;}","if(p.y>(root.__ropeH?root.__ropeH+40:760)){this.done=true;break;}")
p.write_text(s,encoding='utf8')
p=W/'script-06.js';s=p.read_text(encoding='utf8')
s=sub(s,"if(id==='goal')return{x:.5,y:650/720,","if(id==='goal')return{x:.5,y:(cfg.kind==='rope'?900/1280:650/720),")
s=sub(s,"Object.assign(m.goal,{x:v.x*720,y:v.y*720,","Object.assign(m.goal,{x:v.x*720,y:v.y*(cfg.kind==='rope'?1280:720),")
s=sub(s,"function localPoint(canvas,e,w=720,h=720){","function localPoint(canvas,e,w=720,h=(cfg.kind==='rope'?1280:720)){")
p.write_text(s,encoding='utf8');print('r53 patched')
