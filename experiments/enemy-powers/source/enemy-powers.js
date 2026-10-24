// Fixed opponent skills. This module never changes AI defensive tracking/stats.
const ENEMY_SKILLS=[
 {id:'bigBall',name:'큰 게 취향이라서요♡',hint:'큰 공 · 강한 바운드',seconds:0},
 {id:'tinyBall',name:'작아도 얕보면 안 돼♡',hint:'작은 공을 끝까지 보세요',seconds:0},
 {id:'bombBall',name:'10초만 더 버텨봐♡',hint:'10초 뒤 공이 있는 쪽이 실점',seconds:0},
 {id:'bigRacket',name:'맞을 준비는 제가 했는데♡',hint:'상대 라켓 확대',seconds:0},
 {id:'tinyRacket',name:'그 조그만 걸로 버티게요?♡',hint:'미주 라켓 축소',seconds:0},
 {id:'slippery',name:'다리에 힘이 풀려서♡',hint:'미주 이동에 관성',seconds:2},
 {id:'paint',name:'기분 좋아서 쏟았어요♡',hint:'분홍 얼룩 · 시야 주의',seconds:2},
 {id:'pinkFog',name:'아무것도 안 보여도 계속♡',hint:'핑크 안개 · 궤적을 기억하세요',seconds:2},
 {id:'strongReturn',name:'때려줘! 더 세게♡',hint:'약한 스윙은 힘을 잃어요',seconds:0},
 {id:'doubleWin',name:'한 번 더! 아직 부족해♡',hint:'연속 두 번 따내면 1점',seconds:0},
 {id:'waitBounce',name:'벌써 끝내면 싫어요♡',hint:'바운드 뒤 조금 기다렸다 치기',seconds:0},
 {id:'tremor',name:'손이 자꾸 떨려요♡',hint:'라켓 흔들림을 보정하세요',seconds:3},
 {id:'blink',name:'눈 감고도 받아주세요♡',hint:'공의 잔상을 따라가세요',seconds:3},
 {id:'centerHit',name:'정중앙으로 부탁해요♡',hint:'라켓 중앙에 맞혀 안정적으로',seconds:0},
 {id:'rubber',name:'도망가지 마세요♡',hint:'가장자리로 움직일수록 저항',seconds:3}
];
const ENEMY_ROSTER={
 'r0-0':{skill:'bigBall',pattern:'wide'},'r0-1':{skill:'tinyRacket',pattern:'repeat'},
 'r0-2':{skill:'slippery',pattern:'shortLong'},'r0-3':{skill:'paint',pattern:'open'},
 'r0-4':{skill:'strongReturn',pattern:'bodyWide'},'r0-5':{skill:'tremor',pattern:'wide'},
 'r0-6':{skill:'bigRacket',pattern:'repeat'},'r0-7':{skill:'bombBall',pattern:'shortLong'},
 'r1-0':{skill:'tinyBall',pattern:'open'},'r1-1':{skill:'pinkFog',pattern:'wide'},
 'r1-2':{skill:'waitBounce',pattern:'shortLong'},'r1-3':{skill:'centerHit',pattern:'repeat'},
 'r1-4':{skill:'rubber',pattern:'open'},'r1-5':{skill:'blink',pattern:'bodyWide'},
 'r1-6':{skill:'doubleWin',pattern:'wide'},'r1-7':{skill:'slippery',pattern:'shortLong'},
 'r2-0':{skill:'paint',pattern:'open'},'r2-1':{skill:'bombBall',pattern:'wide'},
 'r2-2':{skill:'tinyRacket',pattern:'repeat'},'r2-3':{skill:'bigRacket',pattern:'bodyWide'},
 'r2-4':{skill:'blink',pattern:'shortLong'},'r2-5':{skill:'rubber',pattern:'open'},
 'r2-6':{skill:'centerHit',pattern:'repeat'},'r2-7':{skill:'waitBounce',pattern:'shortLong'},
 'r2-8':{skill:'doubleWin',pattern:'wide'},'r2-9':{skill:'pinkFog',pattern:'open'}
};
const enemyId='r'+(Number(careerQuery.get('region'))||0)+'-'+(Number(careerQuery.get('index'))||0);
const enemyProfile=ENEMY_ROSTER[enemyId]||ENEMY_ROSTER['r0-0'];
const enemySkill=ENEMY_SKILLS.find(s=>s.id===enemyProfile.skill);
const enemyFinal=careerQuery.get('enemyMatchKind')==='final';
const enemyLimit=enemyFinal?3:1;
const enemyState={active:null,remaining:0,bomb:0,used:0,step:0,bounceAge:99,shield:0,
  vx:0,vz:0,wobbleX:0,wobbleZ:0,age:0,lastTarget:null,utterance:null,pending:null,presenting:0,resumeTouch:undefined,forwardTouchId:null};
const enemyRadius=BALL_R,enemyOriginalColor=ballMat.color.getHex(),enemyOriginalGlow=ballMat.emissive.getHex();
const enemyFuse=new THREE.Group();
const enemyWick=new THREE.Mesh(new THREE.CylinderGeometry(.011,.015,.14,7),new THREE.MeshBasicMaterial({color:0x4e344d}));
enemyWick.position.y=.125;enemyFuse.add(enemyWick);
const enemySpark=new THREE.Mesh(new THREE.SphereGeometry(.031,8,8),new THREE.MeshBasicMaterial({color:0xffeb63}));enemySpark.position.y=.21;enemyFuse.add(enemySpark);enemyFuse.visible=false;ballMesh.add(enemyFuse);
function enemyResetPoint(){
 if(enemyState.wobbleX||enemyState.wobbleZ){racketPos.x-=enemyState.wobbleX;racketPos.z-=enemyState.wobbleZ;}
 enemyState.active=null;enemyState.remaining=0;enemyState.bomb=0;enemyState.bounceAge=99;
 enemyState.pending=null;enemyState.presenting=0;
 enemyState.vx=enemyState.vz=enemyState.wobbleX=enemyState.wobbleZ=0;
 BALL_R=enemyRadius;ballMesh.scale.setScalar(1);ballMesh.visible=true;
 playerRacket.scale.setScalar(1);oppRacket.scale.setScalar(1);
 ballMat.color.setHex(enemyOriginalColor);ballMat.emissive.setHex(enemyOriginalGlow);enemyFuse.visible=false;
 const fx=document.getElementById('enemy-screen-fx');if(fx)fx.className='';
 const timer=document.getElementById('enemy-bomb-timer');if(timer)timer.hidden=true;
 const cut=document.getElementById('enemy-cutin');if(cut){cut.classList.remove('shout');cut.hidden=true;}
 if(enemyState.utterance&&globalThis.speechSynthesis)speechSynthesis.cancel();enemyState.utterance=null;
 enemyUpdateHint();
}
function enemyResetMatch(){enemyState.shield=0;enemyResetPoint();enemyState.used=0;enemyState.step=0;enemyState.age=0;enemyState.lastTarget=null;enemyUpdateHint();}
function enemyUpdateHint(){const hint=document.getElementById('enemy-effect-hint');if(!hint)return;hint.textContent=enemyState.shield?'한 번 더♡ · 연속 2회로 돌파 '+enemyState.shield+'/2':enemyState.active?(ENEMY_SKILLS.find(x=>x.id===enemyState.active)?.hint||''):'';hint.hidden=!hint.textContent;}
function enemyShout(skill){
 const el=document.getElementById('enemy-cutin'),photo=el.querySelector('img');
 photo.src=V11.opponent?.normal||'';photo.alt=careerLabel;
 el.querySelector('strong').textContent=skill.name;el.querySelector('small').textContent=careerLabel;
 const index=ENEMY_SKILLS.findIndex(s=>s.id===skill.id),col=index%3,row=Math.floor(index/3);
 const xs=[0,516,1034,1536],ys=[0,218,410,602,800,1024];
 const bubble=el.querySelector('svg');bubble.setAttribute('aria-label',skill.name);bubble.setAttribute('viewBox',xs[col]+' '+ys[row]+' '+(xs[col+1]-xs[col])+' '+(ys[row+1]-ys[row]));
 el.hidden=false;
 el.classList.remove('shout');void el.offsetWidth;el.classList.add('shout');
 if(careerQuery.get('muted')!=='1'&&globalThis.speechSynthesis&&globalThis.SpeechSynthesisUtterance){
  const voice=speechSynthesis.getVoices().find(v=>/^ko/i.test(v.lang));
  if(voice){const u=new SpeechSynthesisUtterance(skill.name.replaceAll('♡',''));u.voice=voice;u.lang='ko-KR';u.rate=1.25;u.pitch=1.25;enemyState.utterance=u;speechSynthesis.speak(u);}
 }
}
function enemyActivate(id=enemySkill.id,force=false){
 if(!force&&(enemyState.used>=enemyLimit||trainingActive||menuOpen||enemyState.active||enemyState.pending||enemyState.shield||gameState!=='play'))return false;
 const skill=ENEMY_SKILLS.find(s=>s.id===id);if(!skill)return false;
 enemyResetPoint();enemyState.used++;enemyState.pending=id;enemyState.presenting=1.8;
 enemyState.resumeTouch=activeRacketTouchId!==null&&isTouching?{id:activeRacketTouchId,x:lastTouchX,y:lastTouchY,forward:enemyState.forwardTouchId===activeRacketTouchId}:undefined;
 enemyShout(skill);return true;
}
function enemyApplyPending(){
 const id=enemyState.pending,skill=ENEMY_SKILLS.find(s=>s.id===id);if(!skill)return;
 enemyState.pending=null;enemyState.active=id;enemyState.remaining=skill.seconds;
 if(id==='bigBall'||id==='tinyBall'){const scale=id==='bigBall'?1.8:.55;BALL_R=enemyRadius*scale;ballMesh.scale.setScalar(scale);}
 if(id==='bigRacket')oppRacket.scale.setScalar(1.5);
 if(id==='tinyRacket')playerRacket.scale.setScalar(.55);
 if(id==='bombBall'){enemyState.bomb=10;enemyFuse.visible=true;ballMat.color.setHex(0x292433);ballMat.emissive.setHex(0x9d184d);document.getElementById('enemy-bomb-timer').hidden=false;}
 if(['paint','pinkFog','slippery'].includes(id))document.getElementById('enemy-screen-fx').className=id;
 // The attack was prepared before the freeze; recompute its flight after radius/spin changes.
 if(lastHitter==='opponent'&&rallyPhase==='rally'&&enemyState.lastTarget){const t=enemyState.lastTarget;if(id==='bigBall')ballSpin.z=-2.8;aimLiveShot({x:t.x,z:t.z},t.time);}
 enemyUpdateHint();
}
function enemyPresentationTick(dt){
 if(!enemyState.presenting)return false;
 const panel=document.querySelector('#enemy-cutin .enemy-presentation');panel.style.animationPlayState=(menuOpen||careerPaused||document.hidden)?'paused':'running';
 if(menuOpen||careerPaused||document.hidden)return true;
 enemyState.presenting=Math.max(0,enemyState.presenting-dt);
 if(enemyState.presenting<=0){const el=document.getElementById('enemy-cutin');el.classList.remove('shout');el.hidden=true;enemyRestoreTouch();enemyApplyPending();}
 return true;
}
function enemyRestoreTouch(){
 const t=enemyState.resumeTouch;
 if(t!==undefined){
  activeRacketTouchId=null;enemyState.forwardTouchId=null;isTouching=false;touchVelX=touchVelZ=0;
  if(t){
   activeRacketTouchId=t.id;enemyState.forwardTouchId=t.forward?t.id:null;isTouching=true;mouseActive=false;
   lastTouchX=t.x;lastTouchY=t.y;touchStartTime=performance.now();
   const pos=mapTouchTo3D(t.x,t.y);racketInputTarget.x=pos.x;racketInputTarget.z=pos.z;
   // Follow the held finger smoothly, without a teleported racket or buffered smash.
   racketVelX=racketVelY=racketVelZ=racketSpeed=racketInstantSpeed=0;
   prevRacketX=racketPos.x;prevRacketY=racketPos.y;prevRacketZ=racketPos.z;
   previousPhysicsRacket={...racketPos};motionHistory=[];recordMotionSample(racketPos.x,0,racketPos.z);
  }
 }
 enemyState.resumeTouch=undefined;
}
function enemyCaptureCutinInput(event,type){
 if(!enemyState.presenting){
  // A touch that began on the cutin keeps that DOM target after it is hidden.
  // Continue that one live gesture until release; ordinary canvas input is untouched.
  if(enemyState.forwardTouchId!==null&&type.startsWith('touch')&&event.target!==canvas){
   const t=Array.from(event.touches||[]).find(t=>t.identifier===enemyState.forwardTouchId);
   if(!t){activeRacketTouchId=null;enemyState.forwardTouchId=null;isTouching=false;touchVelX=touchVelZ=0;}
   else if(type==='touchmove'&&!menuOpen&&!smashAiming){
    const now=performance.now(),elapsed=Math.max(1,now-touchStartTime);
    touchVelX=(t.clientX-lastTouchX)/elapsed*16;touchVelZ=(t.clientY-lastTouchY)/elapsed*16;
    lastTouchX=t.clientX;lastTouchY=t.clientY;touchStartTime=now;
    const pos=mapTouchTo3D(t.clientX,t.clientY);racketInputTarget.x=pos.x;racketInputTarget.z=pos.z;recordMotionSample(pos.x,0,pos.z);
   }
   if(event.cancelable)event.preventDefault();event.stopImmediatePropagation();
  }
  return;
 }
 if(type.startsWith('touch')){
  const touches=Array.from(event.touches||[]);
  const t=touches.find(t=>t.identifier===(enemyState.resumeTouch?.id??activeRacketTouchId))||touches[0];
  enemyState.resumeTouch=t?{id:t.identifier,x:t.clientX,y:t.clientY,forward:event.target!==canvas}:null;
  if(!t){activeRacketTouchId=null;enemyState.forwardTouchId=null;isTouching=false;touchVelX=touchVelZ=0;releaseHeldSpin();}
 }else if(type==='mouseup'){isTouching=false;mouseActive=false;touchVelX=touchVelZ=0;releaseHeldSpin();}
 if(event.cancelable)event.preventDefault();event.stopImmediatePropagation();
}
function enemyOnAttack(){
 const threshold=enemyFinal?[1,8,14][enemyState.used]:1;
 if(enemyState.used<enemyLimit&&playerScore+oppScore>=threshold&&!enemyState.active&&!enemyState.pending&&!enemyState.shield)enemyActivate();
}
function enemyAttackTarget(power,accuracy,returnTime){
 const n=enemyState.step++,half=TABLE_W/2,open=racketPos.x>=0?-1:1,side=n%2?-1:1;
 let sign=side,depth=n%3===0?.72:2.28,spread=.77;
 switch(enemyProfile.pattern){
  case 'open':sign=open;depth=n%3===1?.68:2.30;break;
  case 'repeat':sign=Math.floor(n/2)%2?-1:1;depth=n%2?2.34:1.35;break;
  case 'shortLong':sign=side;depth=n%2?.62:2.36;break;
  case 'bodyWide':sign=n%3===0?0:open;depth=n%3===0?1.55:2.25;break;
 }
 const error=(Math.random()-.5)*(1-accuracy)*.55;
 const x=Math.max(-half+.18,Math.min(half-.18,(sign===0?racketPos.x*.6:sign*half*spread)+error));
 const attackSkill=enemyState.active||enemyState.pending;
 const z=attackSkill==='waitBounce'?.85+(n%2)*.45:Math.max(.48,Math.min(TABLE_L/2-.22,depth+(Math.random()-.5)*(1-accuracy)*.3));
 if(enemyState.active==='bigBall')ballSpin.z=-2.8;
 let time=attackSkill==='bigBall'?returnTime*.88:returnTime;
 if(attackSkill==='waitBounce'){time=Math.max(1.05,time);}
 const target={x,z,time:Math.max(.42,time),pattern:enemyProfile.pattern};enemyState.lastTarget=target;return target;
}
function enemyPlayerScale(){return enemyState.active==='tinyRacket'?.55:1;}
function enemyOppScale(){return enemyState.active==='bigRacket'?1.5:1;}
function enemyCanContact(){return !(enemyState.active==='waitBounce'&&playerSideBounces===1&&enemyState.bounceAge<.18);}
function enemyBeforeInput(){racketPos.x-=enemyState.wobbleX;racketPos.z-=enemyState.wobbleZ;enemyState.wobbleX=enemyState.wobbleZ=0;}
function enemyInput(dt){
 if(menuOpen||smashAiming||smashAutopilot||dt<=0)return false;
 if(enemyState.active!=='slippery'&&enemyState.active!=='rubber')return false;
 const touching=isTouching||mouseActive;
 if(enemyState.active==='slippery'){
  const desiredX=touching?(racketInputTarget.x-racketPos.x)*8:0,desiredZ=touching?(racketInputTarget.z-racketPos.z)*8:0;
  const blend=1-Math.exp(-(touching?4:2)*dt);
  enemyState.vx+=(Math.max(-8,Math.min(8,desiredX))-enemyState.vx)*blend;
  enemyState.vz+=(Math.max(-8,Math.min(8,desiredZ))-enemyState.vz)*blend;
  racketPos.x+=enemyState.vx*dt;racketPos.z=Math.max(.3,Math.min(TABLE_L/2+2.5,racketPos.z+enemyState.vz*dt));
 }else if(touching){const rate=18/(1+Math.abs(racketPos.x)*2.8),blend=1-Math.exp(-rate*dt);racketPos.x+=(racketInputTarget.x-racketPos.x)*blend;racketPos.z+=(racketInputTarget.z-racketPos.z)*blend;}
 return true;
}
function enemyAfterInput(dt){if(enemyState.active==='tremor'&&!menuOpen&&gameState==='play'&&dt>0){enemyState.wobbleX=Math.sin(enemyState.age*19)*.09;enemyState.wobbleZ=Math.sin(enemyState.age*13)*.035;racketPos.x+=enemyState.wobbleX;racketPos.z+=enemyState.wobbleZ;}}
function enemyPlayerReturn(){
 if(enemyState.active==='strongReturn'&&racketSpeed<3.6){ballVel.z*=.62;ballVel.y*=.70;}
 if(enemyState.active==='centerHit'&&Math.hypot(ballPos.x-racketPos.x,ballPos.y-racketPos.y)>getPlayerReachRadius()*.45){ballVel.x+=(ballPos.x>=racketPos.x?1:-1)*.75;ballVel.y*=.82;}
}
function enemyInterceptPoint(scorer){
 if(trainingActive)return false;
 if(scorer==='player'&&(enemyState.active==='doubleWin'||enemyState.shield)){
  if(!enemyState.shield){enemyState.shield=1;enemyResetPoint();enemyUpdateHint();gameState='point-pause';releaseHeldSpin();const epoch=++serveEpoch;setTimeout(()=>{if(epoch!==serveEpoch||careerReported)return;const retry=()=>{if(epoch!==serveEpoch||careerReported)return;if(menuOpen){setTimeout(retry,100);return;}resetBall();if(serveSide==='opponent')scheduleOpponentServe();};retry();},900);return true;}
  enemyState.shield=0;
 }else if(scorer==='opponent')enemyState.shield=0;
 return false;
}
function enemyTick(dt){
 if(menuOpen||careerPaused||gameState!=='play'||gameTimeScale===0||dt<=0)return;
 enemyState.age+=dt;enemyState.bounceAge+=dt;
 if(enemyState.active==='blink')ballMesh.visible=enemyState.age%.32>.10;
 if(enemyState.active==='bombBall'){
  enemyState.bomb=Math.max(0,enemyState.bomb-dt);document.getElementById('enemy-bomb-timer').textContent='💣 '+enemyState.bomb.toFixed(1)+'초';
  ballMat.color.setHex(0x292433);ballMat.emissive.setHex(Math.floor(enemyState.age*5)%2?0x9d184d:0xe94f24);
  if(enemyState.bomb<=0){scorePoint(ballPos.z>=0?'opponent':'player','펑♡ 10초 폭탄!');return;}
 }
 if(enemyState.remaining>0){enemyState.remaining-=dt;if(enemyState.remaining<=0)enemyResetPoint();}
}
function enemyInstallUI(){
 const style=document.createElement('style');style.textContent=ENEMY_FONT_CSS+`
 #enemy-cutin{position:fixed;inset:0;z-index:70;display:grid;place-items:center;background:radial-gradient(ellipse at 50% 45%,#ffb5d14d,#32152ec7);backdrop-filter:blur(3px);touch-action:none;pointer-events:auto}
 #enemy-cutin[hidden]{display:none!important}
 #enemy-cutin .enemy-presentation{display:grid;grid-template-columns:minmax(180px,.8fr) minmax(280px,1.4fr);align-items:center;justify-items:center;gap:12px;width:92vw;max-width:1080px;height:84vh;transform-origin:center}
 #enemy-cutin.shout .enemy-presentation{animation:enemyShout 1.8s ease-out forwards}
 @keyframes enemyShout{0%{opacity:0;transform:scale(.8)}12%{opacity:1;transform:scale(1)}78%{opacity:1;transform:scale(1.015)}100%{opacity:0;transform:scale(1.22)}}
 #enemy-cutin .enemy-face{display:flex;flex-direction:column;align-items:center;gap:10px;filter:drop-shadow(0 8px 18px #431230aa)}
 #enemy-cutin img{width:min(38vw,350px);height:min(65vh,350px);object-fit:contain;display:block}
 #enemy-cutin small{padding:5px 28px;border:2px solid #fff3f6;border-radius:30px;background:#982d71d9;color:#fff5fa;font:800 20px EnemyGaia,system-ui;text-shadow:0 2px 2px #6f1e51}
 #enemy-cutin strong{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%)}
 #enemy-cutin .enemy-bubble{width:100%;max-width:650px;aspect-ratio:2.5;mask-image:linear-gradient(to right,transparent,#000 3%,#000 97%,transparent),linear-gradient(to bottom,transparent,#000 5%,#000 95%,transparent);mask-composite:intersect;-webkit-mask-composite:source-in;filter:drop-shadow(0 6px 16px #98345a66)}
 #enemy-cutin svg{display:block;width:100%;height:100%;overflow:hidden}
 #enemy-effect-hint{position:absolute;left:8px;bottom:18%;max-width:43%;border-radius:12px;padding:5px 10px;background:#8b346cdd;color:#fff5f8;font:700 12px EnemyGaia,system-ui;pointer-events:none;z-index:12}
 #enemy-effect-hint[hidden],#enemy-bomb-timer[hidden]{display:none}
 #enemy-bomb-timer{position:absolute;left:12px;top:26%;background:#382136d9;border:1px solid #ff8abd;border-radius:14px;padding:4px 10px;color:#ffe7f2;font:800 16px EnemyGaia,system-ui;pointer-events:none;z-index:14}
 #enemy-screen-fx{position:absolute;left:16%;top:29%;width:72%;height:40%;pointer-events:none;z-index:5;overflow:hidden;border-radius:35%}
 #enemy-screen-fx.paint{background:radial-gradient(ellipse 24% 33% at 22% 50%,#fc58b5d0 0 68%,transparent 75%),radial-gradient(ellipse 20% 29% at 66% 22%,#fe6f9cc0 0 68%,transparent 74%),radial-gradient(ellipse 28% 27% at 78% 80%,#ed2f86bb 0 70%,transparent 76%)}
 #enemy-screen-fx.pinkFog{background:radial-gradient(ellipse at 50% 45%,#ee84becf,transparent 73%);backdrop-filter:blur(3px)}
 #enemy-screen-fx.slippery{background:none}
 @media(orientation:portrait){#enemy-cutin .enemy-presentation{grid-template-columns:1fr;grid-template-rows:minmax(0,1.5fr) minmax(0,1fr);width:94vw;height:86vh;gap:5px}#enemy-cutin img{width:min(76vw,390px);height:min(43vh,390px)}#enemy-cutin .enemy-bubble{width:94vw;max-width:650px}#enemy-cutin small{font-size:20px}#enemy-effect-hint{bottom:17%;max-width:65%}#enemy-screen-fx{left:8%;top:36%;width:84%;height:34%}}
 `;document.head.append(style);
 const ui=document.getElementById('ui'),cut=document.createElement('div');cut.id='enemy-cutin';cut.hidden=true;
 cut.innerHTML='<div class="enemy-presentation"><div class="enemy-face"><img alt=""><small></small></div><div class="enemy-bubble"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 516 218" role="img" aria-label="스킬 말풍선"><image href="assets/enemy-powers/skill-bubbles.png" x="0" y="0" width="1536" height="1024"/></svg><strong></strong></div></div>';ui.append(cut);
 for(const id of ['enemy-screen-fx','enemy-effect-hint','enemy-bomb-timer']){const e=document.createElement('div');e.id=id;if(id!=='enemy-screen-fx')e.hidden=true;ui.append(e);}
 const sheet=new Image();sheet.src='assets/enemy-powers/skill-bubbles.png';
 // No hidden racket movement or buffered shots while the skill is being announced.
 for(const type of ['pointerdown','pointerup','pointermove','mousedown','mouseup','mousemove','touchstart','touchend','touchmove','touchcancel','click','keydown'])addEventListener(type,event=>enemyCaptureCutinInput(event,type),{capture:true,passive:false});
}
function enemyPlaceCutin(){}
enemyInstallUI();
const enemyBaseScore=scorePoint,enemyBaseReset=resetBall,enemyBaseMatch=menuNewGame,enemyBaseHit=playerHit;
scorePoint=function(scorer,reason,dead){if(enemyInterceptPoint(scorer))return;enemyResetPoint();return enemyBaseScore(scorer,reason,dead);};
resetBall=function(){enemyResetPoint();return enemyBaseReset();};
menuNewGame=function(){enemyResetMatch();return enemyBaseMatch();};
playerHit=function(){if(!enemyCanContact())return;const before=lastHitter;enemyBaseHit();if(before!=='player'&&lastHitter==='player')enemyPlayerReturn();};
addEventListener('pagehide',()=>{enemyState.shield=0;enemyResetPoint();if(enemyState.utterance&&globalThis.speechSynthesis)speechSynthesis.cancel();});
addEventListener('resize',enemyPlaceCutin);
