/* 뒤를 조심!! — ordinary props, pull-and-release, cartoon reactions. */
const MG_THROW_ITEMS=[
 {id:'ball',name:'고무공',hint:'통통 튀어요',speed:1,gravity:620,air:.025,bounce:.84,spin:5,size:46},
 {id:'duck',name:'고무오리',hint:'가볍게 떠요',speed:.91,gravity:430,air:.24,bounce:.3,spin:1.6,size:56},
 {id:'slipper',name:'슬리퍼',hint:'빙글빙글 빨라요',speed:1.16,gravity:790,air:.065,bounce:.1,spin:12,size:66}
];
// The same integrator drives live shots and the dotted preview.
function mgThrowStep(p,item,dt,scale,floor){
 p.age+=dt;p.vx*=Math.exp(-item.air*dt);p.vy*=Math.exp(-item.air*dt);p.vy+=item.gravity*scale*dt;
 p.x+=p.vx*dt;p.y+=p.vy*dt;p.angle+=item.spin*dt;
 if(p.y>floor&&p.vy>0){p.y=floor;p.vy=-p.vy*item.bounce;p.vx*=.78;p.bounces++;return true;}
 return false;
}
function mgThrowCrosses(x0,y0,x1,y1,x,y,rx,ry){
 const ax=(x0-x)/rx,ay=(y0-y)/ry,dx=(x1-x0)/rx,dy=(y1-y0)/ry;
 const t=clamp(-(ax*dx+ay*dy)/(dx*dx+dy*dy||1),0,1);
 return (ax+dx*t)**2+(ay+dy*t)**2<=1;
}
const mgBehindStyle=document.createElement('style');
mgBehindStyle.textContent=`
.mg-behind-scene .mg-canvas-wrap{margin-bottom:0;overflow:visible}.mg-preview.behind-preview img{width:85%;max-width:85%;height:100%}
.mg-throw-info{display:flex;align-items:center;justify-content:space-between;gap:8px;flex:none;min-height:61px;padding:4px 8px;border-top:1px solid #fff8;background:#fff5df99;border-radius:12px;color:#526f64}
.mg-throw-current,.mg-throw-next{display:flex;align-items:center;gap:8px;min-width:0}.mg-throw-current img{width:54px;height:48px;object-fit:contain}.mg-throw-current strong{display:block;font-size:15px}.mg-throw-current small{display:block;font-size:11px;color:#7d8571}.mg-throw-next{font-size:11px}.mg-throw-next img{width:34px;height:32px;object-fit:contain}.mg-throw-power{height:6px;flex:none;border-radius:6px;background:#d4d5bd;margin:5px 8px;overflow:hidden}.mg-throw-power i{height:100%;display:block;width:0;background:linear-gradient(90deg,#87cbaa,#f7cf65,#ef8994);transition:width .03s}
.mg-behind-fly{position:absolute;width:var(--actor-size);height:var(--actor-size);object-fit:contain;transform:translate(-50%,-50%);pointer-events:none;z-index:5;animation:mgBehindFly .88s cubic-bezier(.2,.55,.4,1) forwards;transform-origin:50% 55%}
.mg-behind-shout{position:absolute;font-size:clamp(25px,5vw,62px);font-weight:1000;color:#fff4af;-webkit-text-stroke:1px #7e3547;text-shadow:3px 4px #8e3a59;white-space:nowrap;animation:mgBehindShout .85s forwards;z-index:6;pointer-events:none}
@keyframes mgBehindFly{0%{transform:translate(-50%,-50%) scale(.85) rotate(-5deg)}24%{transform:translate(-50%,-56%) scale(1.35) rotate(6deg)}67%{opacity:1;transform:translate(-30%,-90%) scale(3.8) rotate(18deg)}100%{opacity:0;transform:translate(80vw,-120vh) scale(5.2) rotate(33deg)}}
@keyframes mgBehindShout{0%{opacity:0;transform:translate(-50%,-50%) scale(.3) rotate(-15deg)}18%{opacity:1;transform:translate(-50%,-65%) scale(1.1) rotate(-8deg)}80%{opacity:1}100%{opacity:0;transform:translate(-50%,-130%) scale(1.15)}}
@media(max-width:650px) and (orientation:portrait){.mg-behind-scene .mg-board{padding:8px}.mg-throw-info{padding:3px 5px;min-height:53px;gap:5px}.mg-throw-current img{width:43px;height:41px}.mg-throw-current strong{font-size:12px}.mg-throw-next{font-size:10px;gap:4px}.mg-throw-next img{width:28px;height:28px}.mg-behind-scene .mg-stats{font-size:13px}.mg-behind-scene .mg-small{font-size:10px;margin:3px 0}}
`;
document.head.append(mgBehindStyle);

function mgBehind(board){
 const portrait=board.clientHeight>board.clientWidth*1.05;
 const stats=mgNode('div','mg-stats','',board),{c,ctx,w,h}=mgCanvas(board,portrait?600:840,portrait?700:540);
 c.tabIndex=0;c.setAttribute('aria-label','아래 소품을 당겼다가 놓아 캐릭터 맞히기');
 const info=mgNode('div','mg-throw-info',undefined,board),currentBox=mgNode('div','mg-throw-current',undefined,info),currentImage=mgNode('img','',undefined,currentBox),currentText=mgNode('div','',undefined,currentBox);
 const currentName=mgNode('strong','',undefined,currentText),currentHint=mgNode('small','',undefined,currentText),nextBox=mgNode('div','mg-throw-next',undefined,info);
 mgNode('span','','다음',nextBox);const nextImage=mgNode('img','',undefined,nextBox),nextName=mgNode('span','',undefined,nextBox);
 const power=mgNode('div','mg-throw-power',undefined,board),powerBar=mgNode('i','',undefined,power);
 mgNode('p','mg-small','아래로 당겨서 놓기 · 방향으로 조준, 길이로 힘 조절',board);
 const scale=h/600,origin={x:w*.5,y:h*.93},floor=h*.95,maxPull=h*.21,gain=7.15;
 const actorSize=Math.min(h*.65,w*.62),foot=h*.62,hitY=foot-actorSize*.24,rx=actorSize*.115,ry=actorSize*.08;
 const round=mgRound,metrics=round.behind={shots:0,hits:0,misses:0,maxCombo:0,bounceHits:0};
 let elapsed=0,time=30,score=0,combo=0,acc=0,cool=0,spawn=0,serial=0,shotSerial=0,ended=false,pointer=null,start=null,aim={x:0,y:maxPull*.78};
 let current=0,next=1,bag=[2],shots=[],marks=[],target;
 function takeItem(){if(!bag.length){bag=[0,1,2];for(let i=bag.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[bag[i],bag[j]]=[bag[j],bag[i]];}}const n=bag.shift();if(n===next&&bag.length){bag.push(n);return bag.shift();}return n;}
 function refreshItems(){const a=MG_THROW_ITEMS[current],b=MG_THROW_ITEMS[next];currentImage.src=MG_IMAGES.behind[a.id].src;currentImage.alt=a.name;currentName.textContent=a.name;currentHint.textContent=a.hint;nextImage.src=MG_IMAGES.behind[b.id].src;nextImage.alt=b.name;nextName.textContent=b.name;}
 function newTarget(first=false){
  const center=first?w/2:w*(.3+Math.random()*.4);
  target={id:++serial,x:center,from:center,to:center,age:0,phase:'idle',rem:first?1.25:.65+Math.random()*.35,move:0,duration:.8,entry:first?0:.28,entryFrom:Math.random()<.5?-actorSize:w+actorSize,dir:1};
  spawn=0;
 }
 function updateTarget(dt){
  if(!target)return;target.age+=dt;target.entry=Math.max(0,target.entry-dt);target.rem-=dt;
  if(target.phase==='move'){target.move=Math.min(1,target.move+dt/target.duration);const q=target.move*target.move*(3-2*target.move);target.x=target.from+(target.to-target.from)*q;}
  if(target.rem>0)return;
  if(target.phase==='idle'){
   target.phase='warn';target.rem=.3;target.from=target.x;const amplitude=w*(.08+Math.min(.07,elapsed*.002));
   target.to=clamp(target.x+(Math.random()<.5?-1:1)*amplitude,w*.21,w*.79);target.dir=target.to>=target.from?1:-1;
  }else if(target.phase==='warn'){
   target.phase='move';target.move=0;target.duration=Math.max(.72,.98-elapsed*.006);target.rem=target.duration;
  }else{target.phase='idle';target.x=target.to;target.rem=.55+Math.random()*.4;}
 }
 function shotFromAim(index=current){const item=MG_THROW_ITEMS[index];return {id:++shotSerial,kind:index,x:origin.x,y:origin.y,vx:-aim.x*gain*item.speed,vy:-aim.y*gain*item.speed,age:0,angle:0,bounces:0,target:target?.id,trail:[]};}
 function updatePower(){powerBar.style.width=pointer!==null?Math.round(Math.hypot(aim.x,aim.y)/maxPull*100)+'%':'0%';}
 function finish(){if(ended)return;ended=true;pointer=null;powerBar.style.width='0%';mgFinish(`${score}점`,clamp(metrics.hits/14-metrics.misses*.012,0,1),`명중 ${metrics.hits}회 · 최고 연속 ${metrics.maxCombo}회 · 통통 명중 ${metrics.bounceHits}회`);}
 function fire(){
  if(ended||time<=0||cool>0||shots.length>=3||!target||target.entry>0||Math.hypot(aim.x,aim.y)<12)return false;
  shots.push(shotFromAim());metrics.shots++;cool=.23;current=next;next=takeItem();refreshItems();sound('whoosh');return true;
 }
 function adjust(point){let x=clamp(point.x-start.x,-maxPull*.8,maxPull*.8),y=clamp(point.y-start.y,0,maxPull);const length=Math.hypot(x,y);if(length>maxPull){x*=maxPull/length;y*=maxPull/length;}aim={x,y};updatePower();}
 c.onpointerdown=e=>{const pt=mgPoint(c,e);if(pointer!==null||ended||pt.x<0||pt.x>w||pt.y<h*.5||pt.y>h||cool>0||!target)return;e.preventDefault();pointer=e.pointerId;start=pt;aim={x:0,y:0};try{c.setPointerCapture(pointer);}catch{}updatePower();};
 c.onpointermove=e=>{if(e.pointerId!==pointer)return;e.preventDefault();adjust(mgPoint(c,e));};
 c.onpointerup=e=>{if(e.pointerId!==pointer)return;e.preventDefault();adjust(mgPoint(c,e));fire();const id=pointer;pointer=null;updatePower();try{c.releasePointerCapture(id);}catch{}};
 const cancel=e=>{if(e.pointerId!==pointer)return;pointer=null;updatePower();};c.onpointercancel=cancel;c.onlostpointercapture=cancel;
 c.onkeydown=e=>{if(ended)return;if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown',' ','Enter'].includes(e.key)){e.preventDefault();if(e.key==='ArrowLeft')aim.x=clamp(aim.x+7,-maxPull*.6,maxPull*.6);if(e.key==='ArrowRight')aim.x=clamp(aim.x-7,-maxPull*.6,maxPull*.6);if(e.key==='ArrowUp')aim.y=clamp(aim.y+7,16,maxPull);if(e.key==='ArrowDown')aim.y=clamp(aim.y-7,16,maxPull);if(e.key===' '||e.key==='Enter')fire();}};
 function fly(x,points){
  const layer=mgDialog.querySelector('.mg-fx-layer'),r=c.getBoundingClientRect(),sr=layer.getBoundingClientRect(),s=Math.min(r.width/w,r.height/h),ox=r.left+(r.width-w*s)/2,oy=r.top+(r.height-h*s)/2;
  const el=mgNode('img','mg-behind-fly',undefined,layer);el.src=MG_IMAGES.behind.rear7.src;el.alt='깜짝 놀라 날아가는 캐릭터';el.style.cssText=`left:${ox+x*s-sr.left}px;top:${oy+(foot-actorSize*.5)*s-sr.top}px;--actor-size:${actorSize*s}px`;
  const shout=mgNode('span','mg-behind-shout','으아악!!',layer);shout.style.cssText=`left:${ox+x*s-sr.left}px;top:${oy+foot*.6*s-sr.top}px`;
  setTimeout(()=>{el.remove();shout.remove();},930);
  const frame=MG_IMAGES.behind['rear'+(7+metrics.hits%3)];if(frame)el.src=frame.src;
  mgEffect(3,clamp((ox+x*s-sr.left)/sr.width*100,20,80),35,180);mgHearts(50,45,metrics.hits%3===0?36:14);mgReact(metrics.hits%4===0?'tear':'surprise',2);mgVoice(true);sound('boing');
  marks.push({x,y:hitY,text:'+'+points,t:.8});
 }
 function hit(p){
  const t=target;metrics.hits++;combo++;metrics.maxCombo=Math.max(metrics.maxCombo,combo);if(p.bounces)metrics.bounceHits++;
  const quick=Math.round(50*clamp(1-t.age/2.3,0,1)),mult=Math.min(2,1+Math.floor((combo-1)/3)*.25),points=Math.round((100+quick+(p.bounces?25:0))*mult);score+=points;
  fly(t.x,points);shots=[];target=null;spawn=.3;
  mgSay(p.bounces?'안심하기에는 조금 일렀습니다…!':combo>=4?'다음 분, 준비… 으앗! 순서가 너무 빠릅니다!':'네, 다음 순서 바로 들어갑니다!','surprise');
 }
 function draw(dt){
  ctx.clearRect(0,0,w,h);
  ctx.fillStyle='#fff4db2b';ctx.beginPath();ctx.ellipse(w/2,h*.73,w*.42,h*.18,0,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle='#ffffff65';ctx.lineWidth=2;for(let i=0;i<4;i++){const y=h*(.59+i*.105);ctx.beginPath();ctx.moveTo(w*.07,y);ctx.lineTo(w*.93,y);ctx.stroke();}
  ctx.fillStyle='#55796535';ctx.beginPath();if(target)ctx.ellipse(target.x,foot,actorSize*.25,actorSize*.045,0,0,Math.PI*2);ctx.fill();
  if(target){
   let x=target.x;if(target.entry>0){const q=1-target.entry/.28;x=target.entryFrom+(target.x-target.entryFrom)*(1-(1-q)**3);}
   const avoid=target.phase!=='idle',frame=(avoid?4:1)+Math.floor(elapsed*(avoid?8:5))%3;
   ctx.save();ctx.translate(x,foot-actorSize*.5+Math.sin(elapsed*10)*1.5);if(avoid&&target.dir<0)ctx.scale(-1,1);
   mgDrawImage(ctx,MG_IMAGES.behind['rear'+frame],0,0,actorSize,actorSize,Math.sin(elapsed*7)*.015);ctx.restore();
   ctx.font=`bold ${Math.round(17*scale)}px sans-serif`;ctx.textAlign='center';ctx.fillStyle='#456b60';ctx.fillText(nameOf(mById(round.members[(serial-1)%round.members.length])||{name:'다음 참가자'}),x,Math.max(18,foot-actorSize+15));
  }
  // The preview stops early; the player must still read the moving character.
  if(pointer!==null){
   ctx.strokeStyle='#b98169';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(origin.x-23,origin.y+8);ctx.lineTo(origin.x+aim.x*.36,origin.y+aim.y*.36);ctx.lineTo(origin.x+23,origin.y+8);ctx.stroke();
   const pred=shotFromAim();shotSerial--;for(let n=0;n<22;n++){mgThrowStep(pred,MG_THROW_ITEMS[current],.035,scale,floor);if(n%2===0){ctx.globalAlpha=1-n/26;ctx.fillStyle='#fff8b8';ctx.strokeStyle='#8b8063';ctx.lineWidth=1;ctx.beginPath();ctx.arc(pred.x,pred.y,4.5-n*.08,0,Math.PI*2);ctx.fill();ctx.stroke();}}ctx.globalAlpha=1;
  }
  ctx.fillStyle='#fef2cecc';ctx.strokeStyle='#c49b74';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(origin.x,origin.y+12,49,21,0,0,Math.PI*2);ctx.fill();ctx.stroke();
  mgDrawImage(ctx,MG_IMAGES.behind[MG_THROW_ITEMS[current].id],origin.x,origin.y-8,62,62,Math.sin(elapsed*2)*.06);
  if(!metrics.shots&&pointer===null){ctx.fillStyle='#627f6b';ctx.font=`bold ${Math.round(17*scale)}px sans-serif`;ctx.textAlign='center';ctx.fillText('↓ 아래로 당겼다가 놓으세요',origin.x,origin.y+57*scale);}
  for(const p of shots){
   for(let i=0;i<p.trail.length;i++){const a=p.trail[i];ctx.globalAlpha=(i+1)/p.trail.length*.22;ctx.fillStyle='#fff7cb';ctx.beginPath();ctx.arc(a.x,a.y,3+(i/p.trail.length)*3,0,Math.PI*2);ctx.fill();}ctx.globalAlpha=1;
   const item=MG_THROW_ITEMS[p.kind];mgDrawImage(ctx,MG_IMAGES.behind[item.id],p.x,p.y,item.size,item.size,p.angle);
  }
  marks=marks.filter(m=>(m.t-=dt)>0);ctx.textAlign='center';ctx.font=`1000 ${Math.round(30*scale)}px sans-serif`;for(const m of marks){ctx.globalAlpha=Math.min(1,m.t*3);ctx.fillStyle='#fff4ab';ctx.strokeStyle='#955271';ctx.lineWidth=4;ctx.strokeText(m.text,m.x,m.y-(.8-m.t)*80);ctx.fillText(m.text,m.x,m.y-(.8-m.t)*80);}ctx.globalAlpha=1;
 }
 refreshItems();newTarget(true);mgSay('준비됐습니다. 뒤는 제가 살피겠습니다!','calm');
 mgClock(dt=>{
  if(ended)return;time=Math.max(0,time-dt);elapsed+=dt;cool=Math.max(0,cool-dt);if(time<=0){finish();return;}
  acc+=dt;while(acc>=1/120){const step=1/120;acc-=step;
   updateTarget(step);if(!target&&(spawn-=step)<=0)newTarget();
   for(const p of [...shots]){if(!shots.includes(p))continue;const x=p.x,y=p.y,item=MG_THROW_ITEMS[p.kind];const bounced=mgThrowStep(p,item,step,scale,floor);
    if(bounced&&p.bounces<=2){sound('boing');marks.push({x:p.x,y:p.y,text:item.id==='ball'?'통!':'툭!',t:.45});}
    if(target&&target.entry<=0&&p.target===target.id&&mgThrowCrosses(x,y,p.x,p.y,target.x,hitY,rx,ry)){hit(p);break;}
    if(p.age>4.5||p.x<-70||p.x>w+70||p.y<-h*.5||p.bounces>2||(p.bounces>0&&Math.abs(p.vy)<45&&p.y>floor-5)){
     shots=shots.filter(x=>x!==p);metrics.misses++;combo=0;
     if(metrics.misses%2===1)mgSay('아직 여기 있습니다. 다음 소품도 확인해 주세요!','calm');
    }
   }
  }
  for(const p of shots){p.trail.push({x:p.x,y:p.y});if(p.trail.length>7)p.trail.shift();}
  stats.textContent=`남은 ${Math.ceil(time)}초　${score}점　연속 ${combo}`;draw(dt);
 });
 const stop=mgCleanup;mgCleanup=()=>{ended=true;pointer=null;shots=[];c.onpointerdown=c.onpointermove=c.onpointerup=c.onpointercancel=c.onlostpointercapture=c.onkeydown=null;stop();};
}
