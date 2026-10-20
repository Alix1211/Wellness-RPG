#!/usr/bin/env python3
"""Conveyor batting R2: landscape fit-height, place backgrounds + breakable ceiling, rhythm arrival with 90/120/150 music,
escalating difficulty, new bat sounds, empty 'launch' sprite fallback. Usage: batting-r2-patch.py [HTML] (default modules/minigames/minigame-conveyor-batting.html)"""
import sys,json,base64,io
from pathlib import Path
from PIL import Image
R=Path(__file__).resolve().parents[2]
P=Path(sys.argv[1]) if len(sys.argv)>1 else R/'modules/minigames/minigame-conveyor-batting.html'
s=P.read_text(encoding='utf8')
def sub(old,new):
    global s
    assert s.count(old)==1,(old[:80],s.count(old))
    s=s.replace(old,new)
def b64(p,mime):return 'data:'+mime+';base64,'+base64.b64encode(Path(p).read_bytes()).decode()
def jpg(p,w=1280):
    im=Image.open(p).convert('RGB');im=im.resize((w,round(im.height*w/im.width)),Image.LANCZOS);b=io.BytesIO();im.save(b,'JPEG',quality=78,optimize=True)
    return 'data:image/jpeg;base64,'+base64.b64encode(b.getvalue()).decode()
BG=Path('/tmp/claude-0/work/bat/bg');SND=Path('/tmp/claude-0/work/bat/snd');SQ=R/'assets/audio/squat'
# --- data objects (ASSETS / AUDIO)
def patch_obj(name,upd):
    global s
    key='const '+name+'='
    i=s.index(key)+len(key);obj,end=json.JSONDecoder().raw_decode(s[i:]);obj.update(upd)
    s=s[:i]+json.dumps(obj,ensure_ascii=False)+s[i+end:]
patch_obj('ASSETS',{'bg-center':jpg(BG/'bg_트레이닝실.jpg'),'bg-company':jpg(BG/'bg_company_private.jpg'),'bg-street':jpg(BG/'bg_.._city_park.jpg')})
patch_obj('AUDIO',{'hit_punch':b64(SND/'bat_A_perfect.ogg','audio/ogg'),'hit_slap':b64(SND/'bat_A_good.ogg','audio/ogg'),
 'bgm1':b64(SQ/'squat90_bgm.ogg','audio/ogg'),'bgm2':b64(SQ/'squat120_bgm.ogg','audio/ogg'),'bgm3':b64(SQ/'squat150_bgm.ogg','audio/ogg')})
# --- globals / rules
sub("let W=720,H=1485,loaded=false,","let W=720,H=1485,ox=0,holes=[],musicT0=0,bgmWait=false,loaded=false,")
sub("const RULES={1:{speed:180,window:.20,amplitude:0,goal:240},2:{speed:216,window:.16,amplitude:35,goal:360},3:{speed:258,window:.13,amplitude:58,goal:456}};",
"const RULES={1:{speed:180,window:.15,amplitude:0,goal:220},2:{speed:216,window:.12,amplitude:35,goal:320},3:{speed:258,window:.09,amplitude:58,goal:400}};\nconst BPM={1:90,2:120,3:150},OFFS={1:.19,2:.09,3:.17},SLAB=150,AMPUP={1:6,2:4,3:3};")
sub("const PLACES={center:{name:'센터',row:0,wall:'#f5e7f5',trim:'#c6acd7'},company:{name:'회사',row:2,wall:'#e8edf8',trim:'#afbdd5'},street:{name:'거리',row:1,wall:'#fff0e3',trim:'#d7b3a5'}};",
"const PLACES={center:{name:'센터',row:0,wall:'#f5e7f5',trim:'#c6acd7',ceil:true,slab:'#d3d9e4',grid:'#b3bccb',floor:'#d9b995'},company:{name:'회사',row:2,wall:'#e8edf8',trim:'#afbdd5',ceil:true,slab:'#ece8e4',grid:'#c9c1bc',floor:'#d8d1ca'},street:{name:'거리',row:1,wall:'#fff0e3',trim:'#d7b3a5',ceil:false,floor:'#efd3ad'}};")
# --- sound: real files for hits, bgm without silence trim
sub("for(const k of Object.keys(AUDIO))load(k);","for(const k of Object.keys(AUDIO))if(!k.startsWith('bgm'))load(k);")
sub("function load(k){if(ac&&(k==='hit_slap'||k==='hit_punch')){","function load(k){if(ac&&!AUDIO[k]&&(k==='hit_slap'||k==='hit_punch')){")
sub("function stop(){epoch++;for(const p of pool.splice(0))","function stop(){epoch++;stopBgm();for(const p of pool.splice(0))")
sub("function suspend(){ac?.suspend().catch(()=>{});}return{unlock,play,stop,suspend,",
"""function suspend(){ac?.suspend().catch(()=>{});}
let bgmNode=null;const bgmBuf=new Map();
function stopBgm(){if(bgmNode){try{bgmNode.n.stop();bgmNode.n.disconnect();bgmNode.g.disconnect();}catch{}bgmNode=null;}}
function loadBgm(i){const k='bgm'+i;if(!ac||!AUDIO[k])return Promise.resolve(null);if(!bgmBuf.has(k))bgmBuf.set(k,Promise.resolve().then(()=>{const raw=atob(AUDIO[k].split(',')[1]);return ac.decodeAudioData(Uint8Array.from(raw,c=>c.charCodeAt(0)).buffer);}).catch(()=>null));return bgmBuf.get(k);}
async function bgm(i,pos=0){if(!solo||mute||document.hidden)return false;const id=epoch;unlock();const b=await loadBgm(i);if(!b||id!==epoch||mute||paused||document.hidden)return false;try{stopBgm();const n=ac.createBufferSource(),g=ac.createGain();n.buffer=b;g.gain.value=1;n.connect(g).connect(master);bgmNode={n,g};n.start(ac.currentTime+.03,pos);return true;}catch{return false;}}
return{unlock,play,stop,suspend,bgm,""")
# --- resize: landscape fits height, wide world
sub("function resize(){const r=canvas.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(r.width*d);canvas.height=Math.round(r.height*d);H=r.height/r.width*W;draw();}",
"function resize(){const r=canvas.getBoundingClientRect(),wide=r.width>r.height*1.15,d=Math.min(devicePixelRatio||1,wide?1.5:2);canvas.width=Math.round(r.width*d);canvas.height=Math.round(r.height*d);if(wide){H=1000;W=r.width/r.height*H;}else{W=720;H=r.height/r.width*W;}ox=(W-720)/2;draw();}")
# --- begin: reset ceiling holes + start music
sub("shake=flash=stopLeft=camera=returnCamera=peak=0;roundSerial++;","shake=flash=stopLeft=camera=returnCamera=peak=0;holes=[];musicT0=0;bgmWait=false;roundSerial++;")
sub("$('hint').style.opacity='1';syncHUD();run();}","$('hint').style.opacity='1';syncHUD();if(solo&&!mute){bgmWait=true;Sound.bgm(CFG.difficulty,0).then(ok=>{bgmWait=false;if(ok)musicT0=totalTime+.03;});}run();}\nfunction resumeBgm(){if(!solo||mute||paused||phase==='ready'||phase==='done')return;const pos=Math.max(0,totalTime-musicT0);Sound.bgm(CFG.difficulty,pos).then(ok=>{if(ok)musicT0=totalTime+.03-pos;});}\nfunction beatTime(i){return musicT0+OFFS[CFG.difficulty]+60/BPM[CFG.difficulty]*i;}")
# --- next(): rhythm arrival, per-round escalation
sub("const cross=(860-370)/rule.speed;hero={x:860,y:floorY()-125,amp:rule.amplitude,cross,frequency:CFG.difficulty===3?3.3:2.6,serial:++roundSerial};syncHUD();}",
"""const startX=Math.max(860,W-ox+120),esc=1+.05*(round-1),spd=rule.speed*esc*(startX-370)/490,travel=(startX-370)/spd,per=60/BPM[CFG.difficulty];let bi=Math.ceil((totalTime+travel+.05-beatTime(0))/per);if(bi<0)bi=0;if(bi%2)bi++;const arrive=beatTime(bi);
hero={x:370+spd*(arrive-totalTime),y:floorY()-125,spd,arrive,win:rule.window*(1-.04*(round-1)),amp:rule.amplitude+(round-1)*AMPUP[CFG.difficulty],frequency:CFG.difficulty===3?3.3:2.6,serial:++roundSerial};syncHUD();}""")
sub("const dy=Math.abs((hero.y-55)-strikeY()),dt=Math.abs(hero.x-370)/rule.speed;const error=Math.max(dt/(rule.window*2.2),dy/64);precision=clamp(1-error,0,1);grade=dt<=rule.window*.5&&dy<=17?'perfect':dt<=rule.window&&dy<=33?'good':dt<=rule.window*2.2&&dy<=64?'bad':'miss';",
"const dy=Math.abs((hero.y-55)-strikeY()),dt=Math.abs(hero.x-370)/hero.spd,win=hero.win;const error=Math.max(dt/(win*2.2),dy/64);precision=clamp(1-error,0,1);grade=dt<=win*.45&&dy<=17?'perfect':dt<=win&&dy<=33?'good':dt<=win*2.2&&dy<=64?'bad':'miss';")
# --- impact: ceiling stuck for 'good' indoors
sub("trailAt:0};}","trailAt:0};if(place.ceil&&good)Object.assign(flight,{stuck:true,T1:.42,T2:.75,T3:.45,duration:1.62,vx:0,vy:0,g:0});}")
# --- update
sub("else if(phase==='approach'){hero.x=860-rule.speed*age;hero.y=floorY()-125+hero.amp*Math.sin((age-hero.cross)*hero.frequency);if(hero.x<220){grade='miss';swing={age:.3};impact();}}",
"else if(phase==='approach'){hero.x=370+hero.spd*(hero.arrive-totalTime);hero.y=floorY()-125+hero.amp*Math.sin((totalTime-hero.arrive)*hero.frequency);if(hero.x<220){grade='miss';swing={age:.3};impact();}}")
sub("else if(phase==='miss'){hero.x-=rule.speed*2.2*dt;","else if(phase==='miss'){hero.x-=hero.spd*2.2*dt;")
sub("else if(phase==='flight'){const t=age;hero.x=flight.x0+flight.vx*t;hero.y=flight.y0+flight.vy*t+.5*flight.g*t*t;if(grade==='perfect'){camera=ease((t-.1)/1.05)*H*.62;peak=",
"else if(phase==='flight'){const t=age;if(flight.stuck)stuckStep(t);else{hero.x=flight.x0+flight.vx*t;hero.y=flight.y0+flight.vy*t+.5*flight.g*t*t;}if(grade==='perfect'){camera=ease((t-.1)/1.05)*H*.62;if(place.ceil&&!flight.holed&&hero.y<70)punch();peak=")
sub("function run(){if(raf||paused||phase==='done')return;",
"""function dust(x,y,n){for(let i=0;i<n;i++)particles.push({x:x+rand(-50,50),y:y+rand(-30,30),vx:rand(-170,170),vy:rand(20,280),life:rand(.5,1.05),max:1.05,size:rand(8,19),spin:rand(-6,6),r:rand(-3,3),kind:i%2?2:3,color:i%3?'#ebe7ef':'#c6bdd1'});if(particles.length>200)particles.splice(0,particles.length-200);}
function punch(){flight.holed=true;holes.push({x:hero.x,w:64});shake=22;flash=.18;dust(hero.x,-60,46);addSticker('03',hero.x,-20,230,.8,rand(-.1,.1));rings.push({x:hero.x,y:-60,r:20,life:.5,max:.5});}
function bump(){shake=16;flash=.1;Sound.play('hit_slap');addSticker('02',hero.x,hero.y+30,210,.8,rand(-.1,.1));dust(hero.x,-40,28);}
function stuckStep(t){const f=flight,a=f.T1,b=a+f.T2,y0=f.y0,yS=100;if(t<a){const k=ease(t/a);hero.y=y0+(yS-y0)*k;hero.x=f.x0+50*k;camera=330*k;}else{if(!f.bumped){f.bumped=true;bump();}hero.x=f.x0+50;if(t<b){hero.y=yS+Math.sin(t*16)*3;camera=330;}else{const k=(t-b)/f.T3;hero.y=yS+(y0-yS)*k*k;camera=330*(1-k*k);}}}
function run(){if(raf||paused||phase==='done')return;""")
sub("if(age>.4){if(round>=5)finish();else next();}","if(age>.4&&!(bgmWait&&age<2.2)){if(round>=5)finish();else next();}")
# --- drawing
sub("sprite(key,hero.x,hero.y,220*scale,220*scale,.5,310/320,rotation);}","if(!images[key]?.naturalWidth)key=key.replace('launch','air');sprite(key,hero.x,hero.y,220*scale,220*scale,.5,310/320,rotation);}")
sub("rotation=grade==='perfect'?Math.sin(age*4)*.24:age*(grade==='bad'?3:1.5);","rotation=grade==='perfect'?Math.sin(age*4)*.24:age*(grade==='bad'?3:1.5);if(flight.stuck){key='hero-'+CFG.location+'-air';scale=1;rotation=age>flight.T1?Math.sin(age*12)*.07:0;}")
sub("ctx.translate(0,camera);drawBelt();drawHero();drawBatter();","ctx.translate(ox,camera);drawBelt();drawHero();if(hero&&flight?.stuck&&phase==='flight')slabPatch();drawBatter();")
sub("const x=(i*137)%720,y=((totalTime*570+i*159)%H);","const x=(i*137)%W,y=((totalTime*570+i*159)%H);")
# belt wide
sub("rect(-30,y-5,790,57,18,'#b5aac7','#a99aba');ctx.save();ctx.beginPath();ctx.rect(0,y,W,38);","rect(-ox-30,y-5,W+60,57,18,'#b5aac7','#a99aba');ctx.save();ctx.beginPath();ctx.rect(-ox,y,W,38);")
sub("const offset=(totalTime*(rule.speed||150))%90;for(let x=-100;x<850;x+=90)","const offset=(totalTime*((hero&&hero.spd)||rule.speed||150))%90;for(let x=-ox-100;x<W-ox+130;x+=90)")
sub("for(let x=10;x<740;x+=43){","for(let x=-ox+10;x<W-ox+20;x+=43){")
sub("rect(-20,y+56,760,20,8,'#b88faa');}","rect(-ox-20,y+56,W+40,20,8,'#b88faa');}")
# background: whole function
i=s.index('function drawBackground(){');j=s.index('function drawBelt(){')
s=s[:i]+r"""function slabPath(x0,x1,withHoles){ctx.beginPath();ctx.rect(x0,-SLAB,x1-x0,SLAB);if(withHoles)for(const h of holes){ctx.moveTo(h.x+h.w,-SLAB/2);ctx.ellipse(h.x,-SLAB/2,h.w,SLAB*.44,0,0,Math.PI*2);}}
function slabFill(x0,x1){ctx.fillStyle=place.slab;ctx.fill('evenodd');ctx.clip('evenodd');ctx.strokeStyle=place.grid;ctx.lineWidth=3;for(let x=Math.floor(x0/96)*96;x<x1;x+=96){ctx.beginPath();ctx.moveTo(x,-SLAB);ctx.lineTo(x,0);ctx.stroke();}ctx.beginPath();ctx.moveTo(x0,-SLAB/2);ctx.lineTo(x1,-SLAB/2);ctx.stroke();for(let x=Math.floor(x0/384)*384+120;x<x1;x+=384){ctx.fillStyle='#fffbe8';ctx.fillRect(x,-SLAB+18,150,SLAB/2-30);ctx.fillRect(x,-SLAB/2+12,150,SLAB/2-30);}ctx.fillStyle='#8f7f9a';ctx.fillRect(x0,-6,x1-x0,6);ctx.fillRect(x0,-SLAB,x1-x0,6);}
function drawSlab(){if(!place.ceil)return;const x0=-ox-60,x1=W-ox+60;ctx.save();slabPath(x0,x1,true);slabFill(x0,x1);ctx.restore();ctx.save();ctx.strokeStyle='#7d6c88';ctx.lineWidth=6;for(const h of holes){ctx.beginPath();ctx.ellipse(h.x,-SLAB/2,h.w,SLAB*.44,0,0,Math.PI*2);ctx.stroke();ctx.lineWidth=4;for(let k=0;k<9;k++){const a=k/9*Math.PI*2+h.x,r0=h.w*.96,r1=h.w*(1.15+(k%3)*.1);ctx.beginPath();ctx.moveTo(h.x+Math.cos(a)*r0,-SLAB/2+Math.sin(a)*SLAB*.42);ctx.lineTo(h.x+Math.cos(a)*r1,-SLAB/2+Math.sin(a)*SLAB*.5);ctx.stroke();}}ctx.restore();}
function slabPatch(){if(!place.ceil)return;const x0=hero.x-150,x1=hero.x+150;ctx.save();ctx.beginPath();ctx.rect(x0,-SLAB,x1-x0,SLAB);ctx.clip();slabPath(x0,x1,false);slabFill(x0,x1);ctx.restore();ctx.save();ctx.strokeStyle='#7d6c88';ctx.lineWidth=4;ctx.lineCap='round';for(let k=0;k<7;k++){const a=Math.PI*(.1+k/6*.8),r=50+(k%2)*28;ctx.beginPath();ctx.moveTo(hero.x+Math.cos(a)*34,-6+Math.sin(a)*14);ctx.lineTo(hero.x+Math.cos(a)*r,-6+Math.sin(a)*r*.7);ctx.stroke();}ctx.restore();}
function drawBackground(){const lift=clamp(camera/H,0,1),g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,lift>.2?'#d5cced':'#c9e4f6');g.addColorStop(.6,'#e5f4f9');g.addColorStop(1,'#fff4e9');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
for(let i=0;i<6;i++)cloud(((i*177+Math.sin(totalTime*.1+i)*20)%(W+180))-80,H*.27+i*130+camera*.35,1+(i%2)*.5,.6);
if(lift>.1){ctx.globalAlpha=clamp(lift*1.4,0,.8);for(const s of stars){ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(s.x*W/720,(s.y+camera*.12)%H,s.r,0,7);ctx.fill();}ctx.fillStyle='#fff3cc';ctx.beginPath();ctx.arc(W*.8,H*.18+camera*.1,46,0,7);ctx.fill();ctx.globalAlpha=1;}
const fy=floorY(),rh=fy+56,im=images.background?.naturalWidth?images.background:images['bg-'+CFG.location];ctx.save();ctx.translate(0,camera);
ctx.save();ctx.beginPath();ctx.rect(0,0,W,rh);ctx.clip();if(im?.naturalWidth){const k=Math.max(W/im.naturalWidth,rh/im.naturalHeight),dw=im.naturalWidth*k,dh=im.naturalHeight*k;ctx.drawImage(im,(W-dw)/2,rh-dh,dw,dh);}else{ctx.fillStyle=place.wall;ctx.fillRect(0,0,W,rh);}ctx.restore();
ctx.fillStyle=place.floor;ctx.fillRect(0,rh-1,W,H*2);ctx.strokeStyle='#ffffff55';ctx.lineWidth=3;for(let y=rh+24;y<H*1.6;y+=70){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}for(let x=-W;x<W*2;x+=160){ctx.beginPath();ctx.moveTo(W/2,rh);ctx.lineTo(x,H*1.6);ctx.stroke();}
ctx.save();ctx.translate(ox,0);drawSlab();ctx.restore();ctx.restore();}
"""+s[j:]
# visibility / mute -> resume music
sub("else if(!paused)run();});addEventListener('pagehide'","else if(!paused){run();resumeBgm();}});addEventListener('pagehide'")
sub("if(mute)Sound.stop();else Sound.unlock();};","if(mute)Sound.stop();else{Sound.unlock();resumeBgm();}};")
sub("speed:rule.speed,window:rule.window}:null","speed:hero.spd,window:hero.win,arrive:hero.arrive,now:totalTime,holes:holes.length}:null")
P.write_text(s,encoding='utf8');print('patched',len(s))
