#!/usr/bin/env python3
"""Conveyor batting R3 (apply on top of R2): bgm no longer killed every round, speed x1.5,
big shrinking guide ring on the strike point (beat-synced), beat pulse on target, judgement ripple.
Usage: batting-r3-patch.py [HTML]"""
import sys
from pathlib import Path
R=Path(__file__).resolve().parents[2]
P=Path(sys.argv[1]) if len(sys.argv)>1 else R/'modules/minigames/minigame-conveyor-batting.html'
s=P.read_text(encoding='utf8')
def sub(old,new):
    global s
    assert s.count(old)==1,(old[:80],s.count(old))
    s=s.replace(old,new)
# --- music bug: per-round Sound.stop() killed the bgm
sub("function stop(){epoch++;stopBgm();for(const p of pool.splice(0))","function stop(keep){epoch++;if(!keep){bepoch++;stopBgm();}for(const p of pool.splice(0))")
sub("let bgmNode=null;const bgmBuf=new Map();","let bgmNode=null,bepoch=0;const bgmBuf=new Map();")
sub("async function bgm(i,pos=0){if(!solo||mute||document.hidden)return false;const id=epoch;","async function bgm(i,pos=0){if(!solo||mute||document.hidden)return false;const id=bepoch;")
sub("if(!b||id!==epoch||mute||paused||document.hidden)return false;try{stopBgm();","if(!b||id!==bepoch||mute||paused||document.hidden)return false;try{stopBgm();")
sub("swing=null;Sound.stop();camera=0;","swing=null;Sound.stop(true);camera=0;")
# --- speed x1.5
sub("const RULES={1:{speed:180,window:.15,amplitude:0,goal:220},2:{speed:216,window:.12,amplitude:35,goal:320},3:{speed:258,window:.09,amplitude:58,goal:400}};",
    "const RULES={1:{speed:270,window:.15,amplitude:0,goal:220},2:{speed:324,window:.12,amplitude:35,goal:320},3:{speed:387,window:.09,amplitude:58,goal:400}};\nconst RING={R0:250,r0:46,L:1.1};")
# --- ripples state
sub("let W=720,H=1485,ox=0,holes=[],","let W=720,H=1485,ox=0,ripples=[],holes=[],")
sub("holes=[];musicT0=0;bgmWait=false;roundSerial++;","holes=[];ripples=[];musicT0=0;bgmWait=false;roundSerial++;")
sub("swing={age:0};phase='windup';age=0;sfx('swing');","swing={age:0};ripples.push({x:370,y:strikeY(),r:RING.r0,life:.5,max:.5,g:grade});phase='windup';age=0;sfx('swing');")
sub("for(const r of rings){r.r+=240*dt;r.life-=dt;}","for(const r of rings){r.r+=240*dt;r.life-=dt;}for(const r of ripples)r.life-=dt;ripples=ripples.filter(r=>r.life>0);")
# --- drawing
sub("function particleShape(p){",
"""function drawGuide(){if(!hero)return;const cy=strikeY();
 if(phase==='approach'){const dtA=hero.arrive-totalTime,k=clamp(dtA/RING.L,-.6,1.2),r=Math.max(8,RING.r0+(RING.R0-RING.r0)*k),a=clamp((RING.L*1.2-dtA)/(RING.L*.2),0,1)*clamp(1+dtA/.25,0,1),per=60/BPM[CFG.difficulty];let bp=((totalTime-beatTime(0))/per)%1;if(bp<0)bp+=1;const pulse=Math.exp(-bp*7)*.12,inP=Math.abs(dtA)<=hero.win*.45,inG=Math.abs(dtA)<=hero.win;
  ctx.save();ctx.globalAlpha=a;ctx.lineCap='round';
  ctx.beginPath();ctx.arc(370,cy,RING.r0*(1+pulse),0,7);ctx.fillStyle=inP?'rgba(255,245,190,.38)':'rgba(255,255,255,.16)';ctx.fill();ctx.lineWidth=5;ctx.strokeStyle='rgba(110,70,120,.28)';ctx.stroke();ctx.lineWidth=3;ctx.strokeStyle='#ffffff';ctx.stroke();
  ctx.beginPath();ctx.arc(370,cy,r,0,7);ctx.strokeStyle='rgba(110,70,120,.25)';ctx.lineWidth=11;ctx.stroke();
  const col=inP?'#fff3b0':inG?'#ffe0ef':'#ffffff';
  if(inG){ctx.strokeStyle=inP?'rgba(255,236,150,.30)':'rgba(255,200,230,.22)';ctx.lineWidth=inP?26:18;ctx.stroke();}
  ctx.strokeStyle=col;ctx.lineWidth=inP?8:5;ctx.stroke();ctx.restore();}
 for(const q of ripples){const p=1-q.life/q.max,e=ease(p);ctx.save();ctx.globalAlpha=clamp(1-p,0,1);ctx.lineWidth=Math.max(2,9*(1-p));
  if(q.g==='miss'){ctx.strokeStyle='#b9b1c4';ctx.beginPath();ctx.arc(q.x,q.y,q.r*(1-.35*e),0,7);ctx.stroke();}
  else{const gr=q.g==='perfect'?140:q.g==='good'?85:45;ctx.strokeStyle=q.g==='perfect'?'#fff1a8':q.g==='good'?'#ffd4e8':'#ffffff';ctx.beginPath();ctx.arc(q.x,q.y,q.r+gr*e,0,7);ctx.stroke();if(q.g==='perfect'){ctx.lineWidth=Math.max(2,6*(1-p));ctx.beginPath();ctx.arc(q.x,q.y,q.r+gr*.55*e,0,7);ctx.stroke();}}
  ctx.restore();}}
function particleShape(p){""")
sub("drawBatter();for(const r of rings){","drawBatter();drawGuide();for(const r of rings){")
sub('<div class="hint" id="hint">배트에 닿을 순간 터치!</div>','<div class="hint" id="hint">큰 원이 작은 원에 닿는 순간 터치!</div>')
P.write_text(s,encoding='utf8');print('patched',len(s))
