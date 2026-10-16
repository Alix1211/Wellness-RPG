/* 물어와! — standalone runner; no main-game state or storage access. */
class FetchGame {
 constructor(host,{assets,bg,onFinish=()=>{},onEvent=()=>{}}){
  this.host=host;this.assets=assets;this.bg=bg;this.onFinish=onFinish;this.onEvent=onEvent;
  host.classList.add('fetch-game');host.innerHTML='<div class="fetch-hud"><span class="fetch-distance">물건을 던지는 중…</span><span class="fetch-time">0.0초</span></div><div class="fetch-court"><canvas width="1920" height="1080" aria-label="장애물을 뛰어넘어 물건 회수하기"></canvas><div class="fetch-call" aria-live="polite">물어와!</div></div><div class="fetch-controls"><button aria-label="전진 연타"><b>전진</b><small>빠르게 연타!</small></button><button aria-label="점프"><b>점프</b><small>장애물을 훌쩍!</small></button></div>';
  this.c=host.querySelector('canvas');this.ctx=this.c.getContext('2d');this.ctx.scale(2,2);this.w=960;this.h=540;this.floor=414;this.x=252;
  this.s={phase:'throw',age:0,time:0,distance:0,speed:0,y:0,vy:0,jumpAge:0,land:0,stagger:0,invincible:0,collisions:0,cleared:0,anim:0,finishAge:0,frame:0,jumpFrame:0};
  this.goal=18000;this.obstacles=[];let d=1550;
  const kinds=[{id:'cuffs',w:66,h:38},{id:'blind',w:88,h:48},{id:'cat',w:76,h:88}];
  for(let i=0;d<this.goal-1100;i++){const k=kinds[i%3];this.obstacles.push({...k,d,hit:false,passed:false});d+=1080+(i%4)*125;}
  this.distanceEl=host.querySelector('.fetch-distance');this.timeEl=host.querySelector('.fetch-time');this.call=host.querySelector('.fetch-call');
  const [a,b]=host.querySelectorAll('.fetch-controls button');this.buttons=[a,b];
  const bind=(button,fn)=>{button.onpointerdown=e=>{if(e.pointerType==='mouse'&&e.button!==0)return;e.preventDefault();button.focus({preventScroll:true});fn();};button.onclick=e=>{if(e.detail===0)fn();};};bind(a,()=>this.tap());bind(b,()=>this.jump());
  this.key=e=>{if(e.repeat||!['ArrowRight',' ','ArrowUp'].includes(e.key))return;e.preventDefault();e.key==='ArrowRight'?this.tap():this.jump();};host.tabIndex=0;host.addEventListener('keydown',this.key);
  this.stopped=false;this.last=performance.now();const loop=now=>{if(this.stopped)return;const dt=Math.min(.035,(now-this.last)/1000);this.last=now;if(!document.hidden)this.step(dt);this.raf=requestAnimationFrame(loop);};this.raf=requestAnimationFrame(loop);this.draw();
 }
 tap(){const s=this.s;if(s.phase!=='run')return false;s.speed=Math.min(900,s.speed+95);this.onEvent('tap');return true;}
 jump(){const s=this.s;if(s.phase!=='run'||s.y>0||s.vy>0||s.land>0||s.stagger>.15)return false;s.vy=605;s.jumpAge=0;s.land=0;this.onEvent('jump');return true;}
 say(text,seconds=.9){this.call.textContent=text;this.call.classList.add('show');this.callUntil=this.s.age+seconds;}
 step(dt){
  if(this.stopped||this.s.phase==='done')return;const s=this.s;s.age+=dt;
  if(this.callUntil&&s.age>this.callUntil){this.call.classList.remove('show');this.callUntil=0;}
  if(s.phase==='throw'){
   if(s.age<.12)this.say('물어와!',1.2);
   if(s.age>=1.4){s.phase='run';this.say('전진 연타!  장애물은 점프!',1.5);this.onEvent('start');}
  }else if(s.phase==='run'){
   s.time+=dt;s.stagger=Math.max(0,s.stagger-dt);s.invincible=Math.max(0,s.invincible-dt);s.land=Math.max(0,s.land-dt);
   s.speed=Math.max(0,s.speed-(s.stagger>0?300:155)*dt);s.distance=Math.min(this.goal,s.distance+s.speed*dt);s.anim+=dt*(2+s.speed/95);
   if(s.vy>0||s.y>0){s.jumpAge+=dt;s.y+=s.vy*dt;s.vy-=1650*dt;if(s.y<=0){s.y=0;s.vy=0;s.land=.1;this.onEvent('land');}}
   const crouch=s.jumpAge<.055&&s.vy>0;s.jumpFrame=s.land>0?3:crouch?0:s.vy>70?1:2;
   s.frame=Math.floor(s.anim)%4;
   for(const o of this.obstacles){const dx=o.d-s.distance;if(!o.hit&&!o.passed&&Math.abs(dx)<o.w*.5+48&&s.y<o.h-8&&s.invincible<=0){o.hit=true;s.collisions++;s.speed*=.38;s.stagger=.38;s.invincible=.8;this.say(['앗! 발이 꼬였습니다!','으악, 이게 왜 여기에!','넘을 수 있었는데…!'][s.collisions%3]);this.onEvent('collision');}if(!o.passed&&dx<-110){o.passed=true;if(!o.hit){s.cleared++;this.say(s.cleared%3===0?'훌쩍! 완벽한 착지입니다!':'슝!',.45);this.onEvent('clear');}}}
   if(s.distance>=this.goal){s.phase='return';s.finishAge=0;this.say('물었습니다! 돌아갑니다!!',1.1);this.onEvent('fetch');}
  }else if(s.phase==='return'){
   s.finishAge+=dt;s.anim+=dt*11;if(s.finishAge>1.15){s.phase='done';this.buttons.forEach(b=>b.disabled=true);const score=Math.max(100,Math.round(1400-s.time*12-s.collisions*75));this.onFinish({score,time:s.time,collisions:s.collisions,cleared:s.cleared,success:true});}
  }
  this.distanceEl.textContent=s.phase==='throw'?'회수 준비!':s.phase==='return'||s.phase==='done'?'회수 성공!':`남은 ${Math.max(0,Math.ceil((this.goal-s.distance)/100))}m`;
  this.timeEl.textContent=s.time.toFixed(1)+'초';this.draw();
 }
 image(im,x,y,w,h,flip=false){if(!im?.naturalWidth)return;const c=this.ctx;c.save();c.translate(x,y);if(flip)c.scale(-1,1);c.drawImage(im,-w/2,-h,w,h);c.restore();}
 draw(){
  const c=this.ctx,s=this.s,w=this.w,h=this.h;c.clearRect(0,0,w,h);
  // Foreground and far wall share distance, with a 20% parallax wall.
  if(this.bg?.naturalWidth){const bw=h*this.bg.naturalWidth/this.bg.naturalHeight,offset=(s.distance*.2)%bw;for(let i=-1;i<=Math.ceil(w/bw)+1;i++)c.drawImage(this.bg,i*bw-offset,0,bw,h);}
  else{c.fillStyle='#cbe7dd';c.fillRect(0,0,w,h);}
  c.fillStyle='#fff4d51f';c.fillRect(0,0,w,h);
  const fh=h-this.floor+20,fw=fh*3,offset=s.distance%(fw*2);
  for(let i=-2;i<Math.ceil(w/fw)+3;i++){const im=this.assets[i%2===0?'floor':'floor-mirror'];if(im?.naturalWidth)c.drawImage(im,i*fw-offset,this.floor-10,fw,fh);}
  c.fillStyle='#6d3c2938';c.fillRect(0,this.floor-10,w,6);
  for(const o of this.obstacles){const x=this.x+o.d-s.distance;if(x<-100||x>w+100)continue;c.save();c.globalAlpha=o.hit?.42:1;c.fillStyle='#4b35423b';c.beginPath();c.ellipse(x,this.floor+6,o.w*.65,8,0,0,Math.PI*2);c.fill();this.image(this.assets[o.id],x,this.floor,o.w,o.h);c.restore();}
  const retrieved=s.phase==='return'||s.phase==='done',charX=retrieved?this.x-s.finishAge*490:this.x;
  c.fillStyle='#3a34383f';c.beginPath();c.ellipse(charX,this.floor+4,72-s.y*.12,12-s.y*.014,0,0,Math.PI*2);c.fill();
  const moving=s.speed>8,air=s.y>0||s.vy>0||s.land>0;let im=this.assets[(air?'jump':'run')+((air?s.jumpFrame:moving?Math.floor(s.anim)%4:0)+1)];
  c.save();if(s.invincible>0)c.globalAlpha=.7+Math.sin(s.age*35)*.3;
  this.image(im,charX,this.floor+7-s.y,260,334,!retrieved);c.restore();
  if(s.phase==='throw'){const q=Math.min(1,s.age/1.2),x=this.x+50+q*950,y=this.floor-110-Math.sin(q*Math.PI)*240;this.image(this.assets.duck,x,y,54,54);}
  else if(this.goal-s.distance<950&&!retrieved){const x=this.x+this.goal-s.distance;this.image(this.assets.duck,x,this.floor,58,58);c.fillStyle='#fff8da';c.font='bold 18px system-ui';c.textAlign='center';c.fillText('발견!',x,this.floor-70);}
  if(retrieved)this.image(this.assets.duck,charX-90,this.floor-70,45,45);
  if(s.phase==='run'&&s.speed>610&&s.y===0){c.strokeStyle='#fff9';c.lineWidth=3;for(let i=0;i<4;i++){const x=charX-120-(s.age*170+i*23)%95;c.beginPath();c.moveTo(x,this.floor-35-i*14);c.lineTo(x-20,this.floor-35-i*14);c.stroke();}}
  const ratio=Math.min(1,s.distance/this.goal);c.fillStyle='#ffffffa6';c.fillRect(22,19,w-44,7);c.fillStyle='#e9ac55';c.fillRect(22,19,(w-44)*ratio,7);
 }
 destroy(){this.stopped=true;cancelAnimationFrame(this.raf);this.host.removeEventListener('keydown',this.key);this.buttons.forEach(b=>{b.onpointerdown=null;b.onclick=null;});}
}
const fetchStyle=document.createElement('style');fetchStyle.textContent=`.fetch-game{display:flex;flex-direction:column;min-height:0;height:100%;gap:7px}.fetch-hud{display:flex;justify-content:space-between;align-items:center;font-weight:800;font-size:17px;padding:2px 8px;flex:none}.fetch-court{flex:1;min-height:0;position:relative;overflow:hidden;border-radius:13px;background:#e3d1b2}.fetch-court canvas{position:absolute;width:100%;height:100%;object-fit:contain;inset:0}.fetch-call{position:absolute;top:17%;left:50%;transform:translateX(-50%) scale(.7);opacity:0;transition:transform .12s,opacity .1s;text-align:center;white-space:nowrap;font-size:clamp(16px,2.7vw,35px);font-weight:950;color:#fff3ac;text-shadow:2px 2px #904357,-1px -1px #904357;pointer-events:none}.fetch-call.show{opacity:1;transform:translateX(-50%) scale(1)}.fetch-controls{display:flex;justify-content:space-between;gap:22px;flex:none;padding:2px 5px 5px}.fetch-controls button{width:44%;min-height:67px;border-radius:18px;background:linear-gradient(#ebae7a,#ce7857);border:2px solid #ffe3ad;box-shadow:0 4px #91533f;color:#fff8e9;touch-action:none;user-select:none;-webkit-user-select:none}.fetch-controls button+button{background:linear-gradient(#6ba995,#397e70);box-shadow:0 4px #28584f;border-color:#c5e6c2}.fetch-controls b{display:block;font-size:25px}.fetch-controls small{display:block;font-size:11px}.fetch-controls button:active{transform:translateY(3px);box-shadow:0 1px #704638}.fetch-controls button:disabled{opacity:.5}@media(max-height:540px){.fetch-controls button{min-height:49px}.fetch-controls b{font-size:21px}.fetch-hud{font-size:14px}.fetch-game{gap:3px}}.mg-fetch-scene .mg-board{padding:7px}.mg-fetch-scene .mg-canvas-wrap{margin:0}@media(orientation:portrait){.mg-fetch-scene{grid-template-columns:1fr!important;grid-template-rows:minmax(0,1fr) 125px!important}.mg-fetch-scene .mg-side{position:relative!important;inset:auto!important;width:100%!important;height:125px!important;flex-direction:row;gap:10px}.mg-fetch-scene .mg-portrait{height:125px;width:100px;flex:none}.mg-fetch-scene .mg-speech{flex:1;width:auto;min-width:0}.mg-fetch-scene .mg-preview,.mg-fetch-scene .mg-result{padding-bottom:0}.fetch-controls{gap:12px}.fetch-controls button{width:47%;min-height:67px}.fetch-court canvas{object-fit:contain}}
`;document.head.append(fetchStyle);
