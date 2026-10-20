#!/usr/bin/env python3
"""Conveyor batting R4 (apply on top of R3): each of 5 rounds is a SET of 2-6 characters arriving on consecutive beats
(gap shrinks with round), stray swings are penalised (-10m, combo reset), judgement windows x0.75 (WINSCALE, revert = 1).
Only the last swing of a set uses the big flight (ceiling punch/stuck); earlier swings launch short 'flyers'.
Score: max = swings x 120, goals are scaled from the 600 base. Usage: batting-r4-patch.py [HTML]"""
import sys
from pathlib import Path
R=Path(__file__).resolve().parents[2]
P=Path(sys.argv[1]) if len(sys.argv)>1 else R/'modules/minigames/minigame-conveyor-batting.html'
s=P.read_text(encoding='utf8')
def sub(old,new):
    global s
    assert s.count(old)==1,(old[:80],s.count(old))
    s=s.replace(old,new)
def span(a,b,new):
    global s
    i=s.index(a);j=s.index(b,i);s=s[:i]+new+s[j:]
sub("const RING={R0:250,r0:46,L:1.1,show:false};","const RING={R0:250,r0:46,L:1.1,show:false};\nconst SETN={1:[2,3,3,4,4],2:[3,3,4,4,5],3:[3,4,4,5,6]},GAPB={1:[2,2,2,1,1],2:[2,2,1,1,1],3:[2,1,1,1,1]},WINSCALE=.75;\nconst maxScore=()=>SETN[CFG.difficulty].reduce((a,b)=>a+b,0)*120;")
sub("let W=720,H=1485,ox=0,ripples=[],holes=[],","let W=720,H=1485,ox=0,queue=[],passed=[],flyers=[],sets=[],setStart=0,strays=0,ripples=[],holes=[],")
sub("holes=[];ripples=[];musicT0=0;bgmWait=false;roundSerial++;","holes=[];ripples=[];queue=[];passed=[];flyers=[];sets=[];setStart=0;strays=0;musicT0=0;bgmWait=false;roundSerial++;")
sub('<span>m / 600</span>','<span id="maxs">m / 600</span>')
sub("function goal(){return CFG.goal!==null&&Number.isFinite(+CFG.goal)?+CFG.goal:rule.goal;}","function goal(){const g=CFG.goal!==null&&Number.isFinite(+CFG.goal)?+CFG.goal:rule.goal;return Math.round(g/600*maxScore());}")
span("function syncHUD(){","function begin(){","""function syncHUD(){const n=$('attempts');n.replaceChildren();for(let i=0;i<5;i++){const d=document.createElement('span'),rec=sets[i];d.className='dot'+(rec?' '+rec.grade:i===round-1&&phase!=='done'?' current':'');d.textContent=rec?(rec.grade==='perfect'?'★':rec.score):i+1;n.append(d);}$('score').textContent=score;$('maxs').textContent='m / '+maxScore();$('combo').hidden=combo<2;if(combo>=2)$('combo').innerHTML='<b>'+combo+'</b>연속 정타!';}
""")
span("function next(){","function addSticker(","""function next(){round++;phase='approach';age=0;grade=flight=null;precision=shotDistance=0;swing=null;Sound.stop(true);camera=0;trails=[];queue=[];passed=[];setStart=records.length;
const startX=Math.max(860,W-ox+120),esc=1+.05*(round-1),spd=rule.speed*esc*(startX-370)/490,travel=(startX-370)/spd,per=60/BPM[CFG.difficulty],N=SETN[CFG.difficulty][round-1]||4;
let bi=Math.ceil((totalTime+travel+.05-beatTime(0))/per);if(bi<0)bi=0;if(bi%2)bi++;
const gap=Math.max(GAPB[CFG.difficulty][round-1]||2,Math.ceil(150/(spd*per))),list=[];
for(let k=0;k<N;k++){const arrive=beatTime(bi+k*gap);list.push({x:370+spd*(arrive-totalTime),y:floorY()-125,spd,arrive,win:rule.window*WINSCALE*(1-.04*(round-1)),amp:rule.amplitude+(round-1)*AMPUP[CFG.difficulty],frequency:CFG.difficulty===3?3.3:2.6,serial:++roundSerial});}
hero=list.shift();queue=list;syncHUD();}
function judgeNow(h){const dy=Math.abs((h.y-55)-strikeY()),dt=Math.abs(h.x-370)/h.spd,win=h.win,error=Math.max(dt/(win*2.2),dy/64);return{dt,win,pr:clamp(1-error,0,1),g:dt<=win*.45&&dy<=17?'perfect':dt<=win&&dy<=33?'good':dt<=win*2.2&&dy<=64?'bad':'miss'};}
function input(){if(paused||document.hidden||phase!=='approach')return;Sound.unlock();const j=judgeNow(hero);$('hint').style.opacity='0';if(j.dt>j.win*3){stray();return;}precision=j.pr;grade=j.g;shotDistance=grade==='miss'?0:Math.round(12+108*Math.pow(precision,.8));ripples.push({x:370,y:strikeY(),r:RING.r0,life:.5,max:.5,g:grade});swing={age:0};sfx('swing');if(queue.length){lightHit();return;}phase='windup';age=0;}
function stray(){swing={age:0};sfx('swing');combo=0;score=Math.max(0,score-10);strays++;Sound.play('miss',true);addSticker('16',250,floorY()-300,120,.6,0);shake=4;ripples.push({x:370,y:strikeY(),r:46,life:.35,max:.35,g:'miss'});syncHUD();}
function lightHit(){const g=grade,pts=shotDistance,h=hero,x=h.x,y=h.y-55;score+=pts;combo=g==='perfect'?combo+1:0;records.push({grade:g,score:pts,distance:pts,accuracy:Math.round(precision*1000)/1000});
if(g==='miss'){sfx('miss');Sound.play('miss',true);addSticker('07',clamp(x,180,550),y-150,150,.7,-.1);passed.push(h);}
else{const p=g==='perfect',gd=g==='good';sfx(p?'hit_perfect':gd?'hit_good':'hit_bad');Sound.play(p?'hit_punch':'hit_slap');shake=p?9:5;burst(x,y,p?34:gd?18:8);rings.push({x,y,r:12,life:.45,max:.45});addSticker(p?'03':gd?'02':'01',x,y-150,p?170:140,.55,rand(-.1,.1));flyers.push({x,y:h.y,vx:p?260:gd?200:150,vy:-(p?1500:gd?1100:700),g:900,age:0,rot:0,life:.75,loc:CFG.location});}
hero=queue.shift();syncHUD();}
function autoMiss(){grade='miss';shotDistance=0;precision=0;const h=hero;combo=0;records.push({grade:'miss',score:0,distance:0,accuracy:0});sfx('miss');Sound.play('miss',true);addSticker('07',clamp(h.x,180,550),h.y-205,150,.7,-.1);passed.push(h);hero=queue.shift();syncHUD();}
function endSet(){const rs=records.slice(setStart),n=rs.length,perf=rs.filter(r=>r.grade==='perfect').length,miss=rs.filter(r=>r.grade==='miss').length;sets.push({grade:perf===n?'perfect':miss===0?'good':miss<n?'bad':'miss',score:rs.reduce((a,r)=>a+r.score,0)});}
""")
sub("records.push({grade,score:points,distance:points,accuracy:Math.round(precision*1000)/1000});syncHUD();","records.push({grade,score:points,distance:points,accuracy:Math.round(precision*1000)/1000});endSet();syncHUD();")
# finish / result
sub("ratio:score/600,","ratio:score/maxScore(),")
sub("+' / 5 · 최장 '+","+' / '+records.length+' · 헛스윙 '+strays+' · 최장 '+")
sub("$('summary').textContent=records.map(r=>r.score).join(' + ')+' = '+score+'m';","$('summary').textContent=sets.map(r=>r.score).join(' + ')+' = '+score+'m';")
sub("$('resultCrest').textContent=score===600?'★':'✦';","$('resultCrest').textContent=score>=maxScore()?'★':'✦';")
# update: queue/passed/flyers + time-based auto miss
sub("age+=dt;if(swing)swing.age+=dt;","age+=dt;if(swing)swing.age+=dt;for(const w of passed){w.x=370+w.spd*(w.arrive-totalTime);w.y=floorY()-125+w.amp*Math.sin((totalTime-w.arrive)*w.frequency);}passed=passed.filter(w=>w.x>-260);for(const f of flyers){f.age+=dt;f.x+=f.vx*dt;f.vy+=f.g*dt;f.y+=f.vy*dt;f.rot+=dt*9;}flyers=flyers.filter(f=>f.age<f.life);")
sub("if(hero.x<220){grade='miss';swing={age:.3};impact();}}","for(const q of queue){q.x=370+q.spd*(q.arrive-totalTime);q.y=floorY()-125+q.amp*Math.sin((totalTime-q.arrive)*q.frequency);}if(totalTime-hero.arrive>hero.win*2.2){if(queue.length)autoMiss();else{grade='miss';swing={age:.3};impact();}}}")
# draw
sub("function drawHero(){","""function drawWalker(h){if(h.x<-260||h.x>W-ox+400)return;const py=h.y;ctx.strokeStyle='#b3a0bd';ctx.lineWidth=12;ctx.beginPath();ctx.moveTo(h.x-35,floorY());ctx.lineTo(h.x-35,py);ctx.moveTo(h.x+35,floorY());ctx.lineTo(h.x+35,py);ctx.stroke();rect(h.x-80,py-4,160,22,9,'#fff0c9','#d7b6a5');rect(h.x-65,py+17,130,18,6,'#d9a9b7');sprite('hero-'+CFG.location+'-back'+(Math.floor(totalTime*4)%4),h.x,h.y,220,220,.5,310/320);}
function drawFlyers(){for(const f of flyers){const k=clamp(f.age/f.life,0,1),sc=1-.45*k;ctx.save();ctx.globalAlpha=clamp(1-(k-.6)/.4,0,1);sprite('hero-'+f.loc+'-air',f.x,f.y,220*sc,220*sc,.5,310/320,f.rot);ctx.restore();}}
function drawHero(){""")
sub("drawBelt();drawHero();","drawBelt();for(const q of queue)drawWalker(q);for(const w of passed)drawWalker(w);drawHero();")
sub("drawBatter();drawGuide();","drawBatter();drawFlyers();drawGuide();")
sub("speed:hero.spd,window:hero.win,arrive:hero.arrive,","speed:hero.spd,window:hero.win,queue:queue.length,strays,sets:sets.length,arrive:hero.arrive,")
P.write_text(s,encoding='utf8');print('patched',len(s))
