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
  vx:0,vz:0,wobbleX:0,wobbleZ:0,age:0,lastTarget:null,utterance:null};
const enemyRadius=BALL_R,enemyOriginalColor=ballMat.color.getHex(),enemyOriginalGlow=ballMat.emissive.getHex();
const enemyFuse=new THREE.Group();
const enemyWick=new THREE.Mesh(new THREE.CylinderGeometry(.011,.015,.14,7),new THREE.MeshBasicMaterial({color:0x4e344d}));
enemyWick.position.y=.125;enemyFuse.add(enemyWick);
const enemySpark=new THREE.Mesh(new THREE.SphereGeometry(.031,8,8),new THREE.MeshBasicMaterial({color:0xffeb63}));enemySpark.position.y=.21;enemyFuse.add(enemySpark);enemyFuse.visible=false;ballMesh.add(enemyFuse);
function enemyResetPoint(){
 if(enemyState.wobbleX||enemyState.wobbleZ){racketPos.x-=enemyState.wobbleX;racketPos.z-=enemyState.wobbleZ;}
 enemyState.active=null;enemyState.remaining=0;enemyState.bomb=0;enemyState.bounceAge=99;
 enemyState.vx=enemyState.vz=enemyState.wobbleX=enemyState.wobbleZ=0;
 BALL_R=enemyRadius;ballMesh.scale.setScalar(1);ballMesh.visible=true;
 playerRacket.scale.setScalar(1);oppRacket.scale.setScalar(1);
 ballMat.color.setHex(enemyOriginalColor);ballMat.emissive.setHex(enemyOriginalGlow);enemyFuse.visible=false;
 const fx=document.getElementById('enemy-screen-fx');if(fx)fx.className='';
 const timer=document.getElementById('enemy-bomb-timer');if(timer)timer.hidden=true;
 const cut=document.getElementById('enemy-cutin');if(cut)cut.classList.remove('shout');
 enemyUpdateHint();
}
function enemyResetMatch(){enemyState.shield=0;enemyResetPoint();enemyState.used=0;enemyState.step=0;enemyState.age=0;enemyState.lastTarget=null;enemyUpdateHint();}
function enemyUpdateHint(){const hint=document.getElementById('enemy-effect-hint');if(!hint)return;hint.textContent=enemyState.shield?'한 번 더♡ · 연속 2회로 돌파 '+enemyState.shield+'/2':enemyState.active?(ENEMY_SKILLS.find(x=>x.id===enemyState.active)?.hint||''):'';hint.hidden=!hint.textContent;}
function enemyShout(skill){
 const el=document.getElementById('enemy-cutin'),photo=el.querySelector('img');
 photo.src=V11.opponent?.normal||'';photo.alt=careerLabel;
 el.querySelector('strong').textContent=skill.name;el.querySelector('small').textContent=careerLabel;
 enemyPlaceCutin();
 el.classList.remove('shout');void el.offsetWidth;el.classList.add('shout');
 if(careerQuery.get('muted')!=='1'&&globalThis.speechSynthesis&&globalThis.SpeechSynthesisUtterance){
  const voice=speechSynthesis.getVoices().find(v=>/^ko/i.test(v.lang));
  if(voice){const u=new SpeechSynthesisUtterance(skill.name.replaceAll('♡',''));u.voice=voice;u.lang='ko-KR';u.rate=1.25;u.pitch=1.25;enemyState.utterance=u;speechSynthesis.speak(u);}
 }
}
function enemyActivate(id=enemySkill.id,force=false){
 if(!force&&(enemyState.used>=enemyLimit||trainingActive||menuOpen||enemyState.active||enemyState.shield||gameState!=='play'))return false;
 const skill=ENEMY_SKILLS.find(s=>s.id===id);if(!skill)return false;
 enemyResetPoint();enemyState.used++;enemyState.active=id;enemyState.remaining=skill.seconds;
 if(id==='bigBall'||id==='tinyBall'){const scale=id==='bigBall'?1.8:.55;BALL_R=enemyRadius*scale;ballMesh.scale.setScalar(scale);}
 if(id==='bigRacket')oppRacket.scale.setScalar(1.5);
 if(id==='tinyRacket')playerRacket.scale.setScalar(.55);
 if(id==='bombBall'){enemyState.bomb=10;enemyFuse.visible=true;ballMat.color.setHex(0x292433);ballMat.emissive.setHex(0x9d184d);document.getElementById('enemy-bomb-timer').hidden=false;}
 if(['paint','pinkFog','slippery'].includes(id))document.getElementById('enemy-screen-fx').className=id;
 enemyShout(skill);enemyUpdateHint();return true;
}
function enemyOnAttack(){
 const threshold=enemyFinal?[1,8,14][enemyState.used]:1;
 if(enemyState.used<enemyLimit&&playerScore+oppScore>=threshold&&!enemyState.active&&!enemyState.shield)enemyActivate();
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
 const z=enemyState.active==='waitBounce'?.85+(n%2)*.45:Math.max(.48,Math.min(TABLE_L/2-.22,depth+(Math.random()-.5)*(1-accuracy)*.3));
 if(enemyState.active==='bigBall')ballSpin.z=-2.8;
 let time=enemyState.active==='bigBall'?returnTime*.88:returnTime;
 if(enemyState.active==='waitBounce'){time=Math.max(1.05,time);}
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
 #enemy-cutin{position:absolute;right:12px;top:23%;width:min(260px,29vw);height:88px;display:flex;align-items:center;gap:6px;z-index:32;pointer-events:none;opacity:0;transform-origin:100% 50%;color:#fff3fa;text-shadow:0 2px 3px #73214c,0 0 6px #a52875}
 #enemy-cutin img{width:76px;height:88px;object-fit:contain;flex-shrink:0;filter:drop-shadow(0 2px 3px #70244d)}
 #enemy-cutin strong{display:block;font:900 clamp(12px,1.8vw,19px) EnemyGaia,system-ui;word-break:keep-all}#enemy-cutin small{font:700 11px EnemyGaia,system-ui}
 #enemy-cutin.shout{animation:enemyShout .55s ease-out forwards}
 @keyframes enemyShout{0%{opacity:0;transform:scale(.85)}18%{opacity:1;transform:scale(1)}55%{opacity:1}100%{opacity:0;transform:scale(1.22)}}
 #enemy-effect-hint{position:absolute;left:8px;bottom:18%;max-width:43%;border-radius:12px;padding:4px 9px;background:#8b346cbb;color:#fff5f8;font:700 11px EnemyGaia,system-ui;pointer-events:none;z-index:12}
 #enemy-effect-hint[hidden],#enemy-bomb-timer[hidden]{display:none}
 #enemy-bomb-timer{position:absolute;left:12px;top:26%;background:#382136d9;border:1px solid #ff8abd;border-radius:14px;padding:4px 10px;color:#ffe7f2;font:800 14px EnemyGaia,system-ui;pointer-events:none;z-index:14}
 #enemy-screen-fx{position:absolute;left:16%;top:29%;width:72%;height:40%;pointer-events:none;z-index:5;overflow:hidden;border-radius:35%}
 #enemy-screen-fx.paint{background:radial-gradient(ellipse 24% 33% at 22% 50%,#fc58b5d0 0 68%,transparent 75%),radial-gradient(ellipse 20% 29% at 66% 22%,#fe6f9cc0 0 68%,transparent 74%),radial-gradient(ellipse 28% 27% at 78% 80%,#ed2f86bb 0 70%,transparent 76%)}
 #enemy-screen-fx.pinkFog{background:radial-gradient(ellipse at 50% 45%,#ee84becf,transparent 73%);backdrop-filter:blur(3px)}
 #enemy-screen-fx.slippery{background:repeating-linear-gradient(107deg,transparent 0 34px,#c3ecff27 37px 47px,transparent 50px 85px);opacity:.65}
 @media(orientation:portrait){#enemy-cutin{right:8px;top:22%;width:38vw;height:92px}#enemy-cutin img{width:64px;height:86px}#enemy-cutin strong{font-size:13px}#enemy-effect-hint{bottom:17%;font-size:10px}#enemy-screen-fx{left:8%;top:36%;width:84%;height:34%}}
 `;document.head.append(style);
 const ui=document.getElementById('ui'),cut=document.createElement('div');cut.id='enemy-cutin';cut.innerHTML='<img alt=""><div><small></small><strong></strong></div>';ui.append(cut);
 for(const id of ['enemy-screen-fx','enemy-effect-hint','enemy-bomb-timer']){const e=document.createElement('div');e.id=id;if(id!=='enemy-screen-fx')e.hidden=true;ui.append(e);}
}
function enemyPlaceCutin(){
 const el=document.getElementById('enemy-cutin');if(!el)return;
 const hud=document.getElementById('v11-hud')?.getBoundingClientRect();
 const height=innerHeight>innerWidth?92:88,width=Math.min(innerHeight>innerWidth?innerWidth*.38:innerWidth*.29,260);
 const top=Math.max((hud?.bottom||0)+24,innerHeight*(innerHeight>innerWidth?.17:.23));
 const points=[0,.15,.3,.5].map(t=>{const p=t?flightAt(ballPos,ballVel,ballSpin,t).p:ballPos;const v=new THREE.Vector3(p.x,p.y,p.z).project(camera);return{x:(v.x+1)*innerWidth/2,y:(1-v.y)*innerHeight/2};});
 const options=[{x:8,origin:'0% 50%'},{x:innerWidth-width-8,origin:'100% 50%'}];
 const cost=o=>{const left=o.origin.startsWith('100')?o.x-width*.22:o.x;return points.reduce((n,p)=>n+(p.x>left-10&&p.x<left+width*1.22+10&&p.y>top-12&&p.y<top+height+12?10000:0),0);};
 const chosen=options.sort((a,b)=>cost(a)-cost(b))[0];
 el.style.left=chosen.x+'px';el.style.right='auto';el.style.top=top+'px';el.style.transformOrigin=chosen.origin;
}
enemyInstallUI();
const enemyBaseScore=scorePoint,enemyBaseReset=resetBall,enemyBaseMatch=menuNewGame,enemyBaseHit=playerHit;
scorePoint=function(scorer,reason,dead){if(enemyInterceptPoint(scorer))return;enemyResetPoint();return enemyBaseScore(scorer,reason,dead);};
resetBall=function(){enemyResetPoint();return enemyBaseReset();};
menuNewGame=function(){enemyResetMatch();return enemyBaseMatch();};
playerHit=function(){if(!enemyCanContact())return;const before=lastHitter;enemyBaseHit();if(before!=='player'&&lastHitter==='player')enemyPlayerReturn();};
addEventListener('pagehide',()=>{enemyState.shield=0;enemyResetPoint();if(enemyState.utterance&&globalThis.speechSynthesis)speechSynthesis.cancel();});
addEventListener('resize',enemyPlaceCutin);
