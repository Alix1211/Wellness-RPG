
/* GAIA Detective Brawler MVP — original character art, Gold Quest-style attack geometry.
   This is a separate game. It never reads/writes the detective card-game save. */
(() => {
  'use strict';
  const cvs = document.getElementById('scene');
  const ctx = cvs.getContext('2d', { alpha: false });
  const $ = id => document.getElementById(id);
  let W = 960;const H = 540;
  function fitView(){ // 가로로 긴 화면이면 장면 폭(W)을 넓혀 검은 띠를 없앤다
    const ar=Math.max(16/9,Math.min(2.4,innerWidth/Math.max(1,innerHeight))),nw=Math.round(H*ar/2)*2,sh=document.getElementById('game-shell');
    if(sh)sh.style.setProperty('--ar',(nw/H).toFixed(5));if(nw!==W){W=nw;cvs.width=W;}
  }
  fitView();addEventListener('resize',fitView);addEventListener('orientationchange',()=>setTimeout(fitView,200));document.addEventListener('fullscreenchange',()=>setTimeout(fitView,100));
  let WORLD_W = 3160;
  const Y_MIN = 340, Y_MAX = 493;
  const ASSET = window.__GAME_ASSET; // 그림 묶음은 js/game-art.js (자동 업데이트에서 코드만 작게 받기 위해 분리)
  Object.assign(ASSET,REGION_ART);
  const CARD_LIST=[];
  let WAVES=[];
  let activeStage=1,packIndex=0,enemySerial=0,checkpointStart=0,muted=false,hasReported=false;
  const TYPES = {
    // Distinct combat profiles are initial values for later one-enemy-at-a-time tuning.
    // Drawn heights are visual only; keep the tested HP, AI and hit ranges.
    // Rozie is 169px. Ordinary enemies should be at least her height.
    punk:{name:'모히칸 펑크',hp:42,attack:6,speed:110,drawH:184,reach:71,style:'punch',interval:1.16,telegraph:.35,spacing:69},
    paddleBrute:{name:'하트 패들 떡대',hp:68,attack:10,speed:83,drawH:202,reach:83,style:'paddle',interval:1.85,telegraph:.53,spacing:83},
    goth:{name:'고딕 갱스터',hp:46,attack:7,speed:100,drawH:185,reach:77,style:'punch',interval:1.50,telegraph:.43,spacing:77},
    whip:{name:'채찍 여전사',hp:52,attack:8,speed:91,drawH:190,reach:166,style:'whip',interval:2.05,telegraph:.72,spacing:136},
    boxer:{name:'대머리 펀치맨',hp:56,attack:8,speed:112,drawH:199,reach:79,style:'punch',interval:1.05,telegraph:.34,spacing:77},
    hippie:{name:'히피 악당',hp:44,attack:6,speed:104,drawH:186,reach:75,style:'punch',interval:1.56,telegraph:.56,spacing:75},
    flameGuy:{name:'화염병 악당',hp:48,attack:7,speed:80,drawH:190,reach:83,style:'flame',ranged:true,interval:2.46,telegraph:.80,spacing:250},
    rocketeer:{name:'바주카 악당',hp:62,attack:16,speed:66,drawH:198,reach:92,style:'rocket',ranged:true,interval:3.25,telegraph:1.04,spacing:315},
    grenadier:{name:'수류탄 악당',hp:48,attack:12,speed:82,drawH:185,reach:78,style:'grenade',ranged:true,interval:2.77,telegraph:.84,spacing:275},
    fedora:{name:'중절모 킬러',hp:190,attack:11,speed:104,drawH:244,reach:140,style:'whirlwind',boss:true,interval:1.88,telegraph:.60,spacing:280},
    redBoss:{name:'뒷골목 보스',hp:300,attack:16,speed:32,drawH:300,reach:112,style:'paddle',boss:true,interval:2.30,telegraph:.78,spacing:168},
    clubPunk:{name:'클럽 펑크',hp:48,attack:7,speed:121,drawH:188,reach:87,style:'punch',interval:1.30,telegraph:.42,spacing:80},
    bouncer:{name:'클럽 경호원',hp:76,attack:10,speed:70,drawH:208,reach:86,style:'punch',interval:1.96,telegraph:.66,spacing:84},
    breaker:{name:'브레이커',hp:52,attack:8,speed:99,drawH:191,reach:120,style:'sweep',interval:2.05,telegraph:.68,spacing:108},
    manager:{name:'보안팀장',hp:260,attack:12,speed:104,drawH:216,reach:161,style:'shock',boss:true,interval:1.9,telegraph:.8,spacing:141},
    clubBoss:{name:'클럽 보스',hp:430,attack:15,speed:38,drawH:265,reach:220,style:'whip',boss:true,interval:2.5,telegraph:1.0,spacing:190}
  };
  Object.assign(TYPES,GaiaCampaign.types,window.FemaleEnemies?.types||{});
  Object.assign(ASSET,window.FemaleEnemies?.assets||{},window.EnemyWalk?.assets||{},window.HeroActions?.assets||{});
  const wallet=DetectiveApp.state;
  const ST=k=>Math.min(30,(wallet.stats&&wallet.stats[k])||0),sk=()=>1+.04*ST('개방성');
  const save=()=>DetectiveApp.save();
  const images = {};

  const burstArt={};
  const poses={move:[],walk:[],jump:[],fall:[]},enemyFrames={};
  let assetsRemaining=Object.keys(ASSET).length,assetsFailed=[];
  function finishAsset(){
    if(--assetsRemaining!==0)return;
    const pose=(key,reference)=>{const im=images[key];return {image:im,width:im.naturalWidth,height:im.naturalHeight,anchorX:im.naturalWidth/2};};
    poses.move=['move0','move1','guard_pose'].map(k=>pose(k));
    poses.walk=[0,1,2,3].map(n=>pose('walk'+n));poses.jump=[0,1,2,3].map(n=>pose('jump'+n));poses.fall=[0,1,2,3,4].map(n=>pose('fall'+n));
    for(const kind of Object.keys(TYPES))enemyFrames[kind]=TYPES[kind].regional?TYPES[kind].frames.map(k=>images[k]):kind==='clubBoss'?[images.clubBoss_whip,images.clubBoss_gun]:['fedora','redBoss','manager'].includes(kind)?[images[kind+'_idle'],images[kind+'_attack']]:[images[kind]];
    // Keep the character and handle; suppress only the painted, stationary
    // rope in a render cache. The entire visible cord is now the physical rig.
    {const im=images.whip,c=document.createElement('canvas');c.width=im.naturalWidth;c.height=im.naturalHeight;const g=c.getContext('2d');g.drawImage(im,0,0);g.save();g.scale(c.width/638,c.height/721);g.globalCompositeOperation='destination-out';g.strokeStyle='#000';g.lineWidth=25;g.lineCap='round';g.lineJoin='round';
      const path=[[223,39],[210,25],[182,14],[140,12],[98,17],[60,36],[31,64],[15,99],[9,143],[12,181],[25,217],[50,251],[86,278],[127,297],[161,316],[177,339],[179,358],[173,372]];
      g.beginPath();path.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.stroke();g.clearRect(0,0,130,240);g.clearRect(0,240,218,172);g.clearRect(0,0,255,40);g.restore();enemyFrames.whip=[c];}
    document.querySelectorAll('[data-art]').forEach(el=>el.src=ASSET[el.dataset.art]);
    $('heroPortrait').src='assets/ui/rosie-portrait.jpg';
    if(assetsFailed.length){$('error').classList.remove('hidden');$('error').textContent='이미지를 불러오지 못했습니다. 파일을 다시 열어 주세요.';return;}
    DetectiveApp.ready();
  }
  for(const [key,src] of Object.entries(ASSET)){
    const im=new Image();images[key]=im;im.onload=finishAsset;im.onerror=()=>{assetsFailed.push(key);finishAsset();};im.src=src;
  }

  const player = {x:148,y:428,face:1,hp:160,maxHp:160,invuln:0,hurt:0,attack:null,attackCooldown:0,skillCooldown:0,mp:100,maxMp:100,pushCd:0,chargeCd:0,charge:null,skillPose:null,anim:0,stun:0,combo:0,comboTime:0,jump:null,jumpZ:0,grab:null,grabCd:2,crouch:false,crouchHold:0,crouchBlend:0,dash:null,dashLink:null,dashFollow:null,dashCd:0,down:null,slam:null,splash:null};
  const game = {mode:'menu',oldMode:'menu',hazards:[],castaways:[],regionalFX:[],zone:0,waveLive:false,arrests:0,seed:Date.now(),camera:0,elapsed:0,particles:[],decals:[],bubbles:[],props:[],shockwaves:[],skillBursts:[],projectiles:[],shake:0,freeze:0,tip:'',tipTime:0,enemies:[],lastAttack:null};
  let toastTimer=0, audioCtx=null;
  const clamp = (v,a,b) => Math.max(a,Math.min(b,v));
  const randFactory = s => () => {s^=s<<13;s^=s>>>17;s^=s<<5;return (s>>>0)/4294967296;};
  const $modal=$('modal'),$intro=$('introPanel'),$result=$('resultPanel');
  let joystick={active:false,x:0,y:0,pid:null};
  const held=new Set();
  const input={punch:false,kick:false,jump:false,dash:false,crouch:false,skill:false,charge:false};
  const queuedAttack={punch:0,kick:0};
  // [임시] 연속 탭만 연속기로 계산. 홀드 자동공격은 제외하고 0.16초만 입력 유예.
  const COMBO_TAP_GRACE=.16,COMBO_GAP=1.12;
  const comboChain={steps:[],last:-99};
  const comboRecipes=[
    {steps:['punch','punch','kick'],move:'hipCrash'},
    {steps:['kick','kick','punch','punch'],move:'whirlSplit'}
  ];
  function resetComboChain(){comboChain.steps=[];comboChain.last=-99;}
  function comboMove(kind,fresh){
    if(!fresh){resetComboChain();return kind;}
    const steps=[...(game.elapsed-comboChain.last<=COMBO_GAP?comboChain.steps:[]),kind];
    const complete=comboRecipes.find(r=>steps.length===r.steps.length&&steps.every((s,i)=>s===r.steps[i]));
    if(complete){resetComboChain();return complete.move;}
    let prefix=[];
    for(let n=1;n<=steps.length;n++){
      const tail=steps.slice(-n);
      if(comboRecipes.some(r=>tail.every((s,i)=>s===r.steps[i])))prefix=tail;
    }
    comboChain.steps=prefix;comboChain.last=game.elapsed;
    return kind;
  }
  let slamKickLock=false; // Require a fresh lower-attack press after a jumping slam.
  function showPanel(panel){$modal.classList.remove('hidden');for(const p of [$intro,$result])p.classList.toggle('hidden',p!==panel);}
  function hidePanels(){$modal.classList.add('hidden');}
  function toast(){}
  function sound(kind){
    if(muted)return;
    if(kind==='punch')AlleyAudio.hero('upper');
    else if(kind==='kick'||kind==='split'||kind==='hipCrash'||kind==='whirlSplit')AlleyAudio.hero('lower');
    else if(kind==='headbutt'||kind==='dashHug')AlleyAudio.hero('upper');
    else if(kind==='dashHip')AlleyAudio.hero('lower');
    else if(kind==='hurt')AlleyAudio.hero(player.down?'down':'hurt');
  }

  function clock(v){return Math.floor(v/60)+':'+String(Math.floor(v%60)).padStart(2,'0');}
  function refreshHud(){refreshDopa();
    $('hpFill').style.width=`${100*player.hp/player.maxHp}%`;$('hpText').textContent=`${Math.ceil(player.hp)} / ${player.maxHp}`;
    refreshSkillHud();$('coins').textContent=wallet.gold;$('arrests').textContent=game.arrests;$('combo').textContent=player.combo;
    $('stageLabel').textContent=`${GaiaCampaign.stages[activeStage].name} ${GaiaCampaign.stages[activeStage].route} · ${Math.min(WAVES.length,game.zone+1)} / ${WAVES.length}`;
    $('objective').textContent=game.zone===WAVES.length-1?(activeStage===1?'중간보스 체포':'보스 구역 · 최종 체포'):
      `${clock(game.elapsed)} · ${game.waveLive?'주변의 적을 정리하세요':'오른쪽으로 전진하세요 →'}`;
    const boss=game.enemies.find(e=>TYPES[e.kind].boss&&e.hp>0);
    $('bossHUD').classList.toggle('hidden',!boss);
    if(boss){$('bossName').textContent=boss.name;$('bossFill').style.width=100*game.enemies.filter(e=>TYPES[e.kind].boss).reduce((n,e)=>n+Math.max(0,e.hp),0)/(game.encounterBossMax||boss.maxHp)+'%';}
  }
  function clearInput(){cancelCharge();resetComboChain();player.crouch=false;player.crouchHold=0;player.crouchBlend=0;player.dash=null;player.dashLink=null;player.dashFollow=null;held.clear();queuedAttack.punch=queuedAttack.kick=0;for(const k of Object.keys(input))input[k]=false;joystick.x=joystick.y=0;joystick.active=false;joystick.pid=null;slamKickLock=false;
    $('stick').style.transform='translate(-50%,-50%)';document.querySelectorAll('.pressed').forEach(e=>e.classList.remove('pressed'));}
  function pause(abort=false){
    if(game.mode!=='playing'&&game.mode!=='paused')return;
    clearInput();game.mode='paused';AlleyAudio.pause();$('pauseTitle').textContent='설정';
    $('pauseDesc').textContent='게임이 일시정지되었습니다.';
    showPanel($intro);
  }
  function returnToCity(){
    releaseGrab(false);
    const report=game.mode==='won';
    clearInput();if(!hasReported){wallet.mp=player.mp;wallet.hp=Math.max(1,player.hp);wallet.arrests+=game.arrests;hasReported=true;}save();
    game.mode='city';hidePanels();DetectiveApp.city();
    window.BeltStory?.play(report?'police.return':'common.return',{title:'경찰서 · 복귀',...window.BeltDialogue?.actors.chief});
  }
  // Explicit, data-driven encounter groups: composition and reinforcement count
  // control the length. No forced timer or idle waves delay a skilled player.
    const REGIONAL_RANGED=new Set(['spray','bottle','womanThrow','banknotes','heartShot','contract','cleaverFan','water']);
  function isRangedStyle(style){return ['flame','rocket','grenade','dagger','bullet'].includes(style)||REGIONAL_RANGED.has(style);}
  // [임시] Independent enemy clocks; control effects still use real seconds.
  const femaleEnemy=kind=>!!TYPES[kind].female||kind==='whip'||kind==='heiress';
  const femaleHealth=kind=>femaleEnemy(kind)?2:1;
  function enemyActionRate(kind){return femaleEnemy(kind)?2:TYPES[kind].boss?1.65:isRangedStyle(TYPES[kind].style)?1.55:1.35;}
  function enemyReach(e,style){
    if(style==='dive')return 300;
    if(style==='sweep'||style==='whirlwind')return 290;
    if(style==='rush')return 390;
    if(isRangedStyle(style))return ({grenade:400,flame:600,rocket:660,water:680})[style]||780;
    return TYPES[e.kind].reach;
  }
  function regionalStyle(e){const d=TYPES[e.kind],cycle=e.kind==='studentBoss'&&e.hp<e.maxHp*.5?['cleaver','rush','feint','cleaverFan','cleaver']:d.pattern;return cycle?.[(e.pattern||0)%cycle.length]||d.style;}
  function makeRegionalPlan(stage){
    const info=GaiaCampaign.stages[stage],variants=[
      [['punk','hippie','goth'],['boxer','clubPunk','paddleBrute','punk']],
      [['whip','bouncer','goth','punk'],['breaker','hippie','clubPunk','boxer']],
      [['flameGuy','punk','boxer','goth'],['paddleBrute','whip','hippie','bouncer']],
      [['grenadier','clubPunk','hippie','boxer'],['goth','breaker','bouncer','punk']],
      [['rocketeer','boxer','punk','whip'],['flameGuy','paddleBrute','goth','hippie']],
      [['bouncer','breaker','clubPunk','grenadier'],['whip','punk','boxer','hippie']]];
    if(info.event){const bosses=[['fedora','punk'],['manager','hippie'],['scientist','boxer'],['farmer','manager']];return Array.from({length:12},(_,i)=>({packs:i%3===2?[variants[(i+(wallet.eventRuns||0))%6][0].slice(),bosses[((i-2)/3+(wallet.eventRuns||0))%4].slice()]:variants[(i+(wallet.eventRuns||0))%6].map(p=>p.slice()),checkpoint:i>0&&i%4===0,boss:i===11,eventBoss:i%3===2}));}
    const plan=Array.from({length:ZN(stage)},(_,i)=>({packs:variants[(i+stage)%6].map(p=>p.slice()),checkpoint:i>0&&i%4===0}));
    const bosses={5:[['whip','goth'],['scientist']],6:[['paddleBrute','hippie'],['farmer']],7:[['punk','bouncer'],['mafiaA','mafiaB','mafiaC','mafiaD']],8:[['boxer','goth'],['mafiaBoss']],9:[['clubPunk','breaker'],['director']],10:[['bouncer','whip'],['heiress'],['host']],11:[['paddleBrute','bouncer'],['pimp']],12:[['whip','goth'],['studentBoss']],14:[['bouncer','whip','boxer'],['paddleBrute','goth','clubPunk','hippie']]};plan.push({packs:bosses[stage],boss:true});return plan;
  }
  function femaleAttack(e,style){
    const def=TYPES[e.kind],dir=e.face;
    if(style==='water'){
      const x=e.x+dir*72,y=e.y-126,travel=Math.max(.3,Math.abs(player.x-x)/340);
      game.projectiles.push({kind:'water',x,y,vx:dir*340,vy:clamp((player.y-108-y)/travel,-130,130),face:dir,age:0,ttl:2.1,sourceX:e.x,damage:def.attack,lane:player.y});
    }else if(style==='dive'){
      e.dive={age:0,duration:.62,dir,fromX:e.x,distance:Math.min(280,Math.abs(player.x-e.x)+25),hit:false};
    }else e.strikes=[{time:.16,dir,done:false}];
    return true;
  }
  function regionalAttack(e,style){
    if(TYPES[e.kind].female)return femaleAttack(e,style);
    if(!TYPES[e.kind].regional)return false;
    const def=TYPES[e.kind],dir=e.face,front=(player.x-e.x)*dir,lane=Math.abs(player.y-e.y),origin={x:e.x+dir*def.drawH*.43,y:e.y-def.drawH*.72};
    const shot=(kind,damage,speed=270,spread=0)=>{const travel=Math.max(.4,Math.abs(player.x-origin.x)/speed),target=player.y-108;game.projectiles.push({kind,x:origin.x,y:origin.y,vx:dir*speed,vy:clamp((target-origin.y)/travel+spread,-180,180),face:dir,age:0,ttl:['person','bottle'].includes(kind)?travel:2.3,sourceX:e.x,damage,lane:player.y,figure:(e.pattern||0)%2?'yogaFighter':'bikiniFighter'});};
    if(['rake','clapper','handbag','cane','baton','cleaver','feint'].includes(style)){e.strikes=(style==='feint'?[.15,.36]:[.15]).map(time=>({time,dir,done:false}));return true;}
    if(style==='spray'){for(const off of [-18,0,18])shot('spray',def.attack,220,off);return true;}
    if(style==='bottle'){shot('bottle',def.attack,220);return true;}
    if(style==='womanThrow'){shot('person',def.attack,255);return true;}
    if(style==='banknotes'){for(const off of [-28,0,28])shot('banknote',def.attack,235,off);return true;}
    if(style==='heartShot'){for(const off of [-30,0,30])shot('enemyHeart',def.attack,270,off);return true;}
    if(style==='contract'){shot('contract',7,235);return true;}
    if(style==='cleaverFan'){for(const off of [-38,0,38])shot('cleaverShot',def.attack-3,300,off);return true;}
    if(style==='stomp'||style==='megaphone'){const radius=style==='stomp'?164:182;game.regionalFX.push({kind:style,x:e.x,y:e.y,dir,age:0,life:.55,radius});const hit=style==='stomp'?Math.abs(player.x-e.x)<radius&&lane<80:front>=-12&&front<radius&&lane<76;if(hit)damagePlayer(def.attack,e.x,style==='stomp'?'heavy':'normal');game.shake=Math.max(game.shake,style==='stomp'?5:2);return true;}
    if(style==='callCrew'){
      game.regionalFX.push({kind:'call',x:e.x,y:e.y,dir,age:0,life:.55,radius:90});
      if(game.enemies.filter(x=>x.hp>0).length<7){const area=game.zones[game.zone],kinds=e.kind==='pimp'?['boxer','bouncer']:['clubPunk','punk'];for(let i=0;i<2;i++){const kind=kinds[i],d=TYPES[kind],x=clamp(e.x+dir*(165+i*80),area.start+65,area.end-65),hp=Math.round(d.hp*femaleHealth(kind)*.9);game.enemies.push({kind,name:d.name,x,y:clamp(e.y+(i?37:-37),Y_MIN,Y_MAX),face:Math.sign(player.x-x)||-1,hp,maxHp:hp,invuln:0,hurt:0,stun:0,staggerResist:0,windup:0,windupStyle:d.style,attackCd:.4+i*.15,swing:0,swingStyle:d.style,id:++enemySerial,slotY:(i?1:-1)*25,powerDown:0,bind:0,air:null,floorTime:0,floorAngle:0,exit:null,walking:false,motionPhase:0,captured:false,reward:0,entry:.8});}}
      return true;
    }
    if(style==='bullet'&&e.kind.startsWith('mafia')){shot('bullet',def.attack,410);if(e.kind==='mafiaC')shot('bullet',def.attack,410,26);comicPop(origin.x,origin.y,'flare',{size:44,life:.18,behind:true});return true;}
    return false;
  }
  function regionalVisibleY(p){return p.y-(['grenade','person','bottle'].includes(p.kind)?Math.sin(Math.PI*clamp(p.age/p.ttl,0,1))*(p.kind==='person'?85:82):0);}
  function regionalProjectileEnd(p,impact){
    if(p.kind==='person')game.castaways.push({x:p.x,y:clamp(p.lane,Y_MIN,Y_MAX),figure:p.figure,age:0,life:1.05,face:p.face||1,angle:(p.face||1)*1.28});
    if(p.kind==='bottle'){game.hazards.push({x:p.x,y:clamp(p.lane,Y_MIN,Y_MAX),age:0,life:2.8,tick:0});comicPop(p.x,regionalVisibleY(p),'puff',{size:65,life:.35});}
    if(p.kind==='contract'&&impact&&player.hurt>0)player.stun=Math.max(player.stun,.30);
  }
  function updateRegional(dt){
    for(const x of game.castaways)x.age+=dt;game.castaways=game.castaways.filter(x=>x.age<x.life);
    for(const x of game.regionalFX)x.age+=dt;game.regionalFX=game.regionalFX.filter(x=>x.age<x.life);
    for(const h of game.hazards){h.age+=dt;h.tick-=dt;if(h.tick<=0&&Math.abs(player.x-h.x)<62&&Math.abs(player.y-h.y)<35&&player.jumpZ<20){damagePlayer(5,h.x,'normal');h.tick=.75;}}game.hazards=game.hazards.filter(h=>h.age<h.life);
  }
  function regionalBodyMotion(e){if(!TYPES[e.kind].regional||e.air||e.stun>0||e.bind>0||e.exit)return {shift:0,lean:0};if(e.windup>0)return {shift:4*(1-e.windup/TYPES[e.kind].telegraph),lean:.025};const t=e.swing>0?clamp(1-e.swing/.55,0,1):0,drive=Math.sin(t*Math.PI);return {shift:-10*drive,lean:-.045*drive};}
  function drawRegionalAttack(e,h){
    if(!TYPES[e.kind].regional||e.air||e.stun>0||e.bind>0)return;const style=e.windup>0?e.windupStyle:e.swingStyle;
    if(e.windup>0&&style==='womanThrow'&&e.windup<.7){ctx.save();ctx.translate(32,-h*.82);window.FemaleEnemies.frame(ctx,images,(e.pattern||0)%2?'yogaFighter':'bikiniFighter','dive0');ctx.restore();}
    if(e.swing<=0)return;const t=clamp(1-e.swing/.55,0,1);if(['rake','clapper','handbag','cane','baton','cleaver','feint'].includes(style)){ctx.save();ctx.globalAlpha=(1-t)*.58;ctx.lineWidth=style==='cleaver'?5:3;ctx.strokeStyle=style==='cleaver'?'#eff8ff':'#ffbdda';ctx.lineCap='round';ctx.beginPath();ctx.ellipse(-h*.24,-h*.59,h*.37,h*.27,-.25,-Math.PI*.8,-Math.PI*.8+Math.PI*1.6*Math.min(1,t*3));ctx.stroke();ctx.restore();}
  }
  function drawRegionalProjectile(p){
    if(!['spray','bottle','person','banknote','enemyHeart','contract','cleaverShot','water'].includes(p.kind))return false;
    const x=p.x-game.camera,y=regionalVisibleY(p);ctx.save();ctx.translate(x,y);
    if(p.kind==='person'){ctx.scale(-(p.face||1),1);window.FemaleEnemies.frame(ctx,images,p.figure,p.age<.12?'dive0':'dive1');}
    else if(p.kind==='water'){ctx.scale(p.face||1,1);ctx.fillStyle='#67dcff';ctx.strokeStyle='#d9faff';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(0,0,19,7,0,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle='#a5efff88';ctx.beginPath();ctx.ellipse(-24,0,13,4,0,0,Math.PI*2);ctx.fill();}
    else if(p.kind==='bottle'){ctx.rotate(p.age*8);ctx.fillStyle='#9bdf83';ctx.strokeStyle='#4b7653';ctx.lineWidth=2;roundRect(-11,-17,22,34,5);ctx.fill();ctx.stroke();ctx.fillStyle='#f1d0ef';ctx.fillRect(-7,-25,14,9);ctx.fillStyle='#fffbd2';ctx.fillRect(-8,-4,16,11);}
    else if(p.kind==='spray'){const g=ctx.createRadialGradient(-3,-3,1,0,0,15);g.addColorStop(0,'#efffd2');g.addColorStop(.6,'#93da83');g.addColorStop(1,'#509d73aa');ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,13,0,Math.PI*2);ctx.fill();}
    else if(p.kind==='enemyHeart')tinyHeart(0,0,12);
    else if(p.kind==='cleaverShot'){ctx.rotate(p.age*8);ctx.fillStyle='#6d483c';roundRect(-29,-4,21,8,3);ctx.fill();const g=ctx.createLinearGradient(-6,-12,20,12);g.addColorStop(0,'#fffdf0');g.addColorStop(.45,'#dae4e8');g.addColorStop(1,'#8496a0');ctx.fillStyle=g;roundRect(-8,-13,34,26,3);ctx.fill();ctx.strokeStyle='#536976';ctx.lineWidth=1;ctx.stroke();}
    else{ctx.rotate(Math.sin(p.age*7)*.25);ctx.fillStyle=p.kind==='banknote'?'#d9c17b':'#fff0df';ctx.strokeStyle='#8c6887';ctx.lineWidth=1.5;roundRect(-20,-12,40,24,3);ctx.fill();ctx.stroke();ctx.strokeStyle=p.kind==='banknote'?'#a27a42':'#bf91a6';for(let i=0;i<3;i++){ctx.beginPath();ctx.moveTo(-13,-6+i*6);ctx.lineTo(12,-6+i*6);ctx.stroke();}}
    ctx.restore();return true;
  }
  function drawRegionalFloor(){
    for(const h of game.hazards){ctx.save();ctx.globalAlpha=Math.min(1,(h.life-h.age)/.5)*.48;ctx.fillStyle='#9bdca7';ctx.beginPath();ctx.ellipse(h.x-game.camera,h.y-3,62,21,0,0,Math.PI*2);ctx.fill();ctx.restore();}
    for(const p of game.castaways){ctx.save();ctx.translate(p.x-game.camera,p.y);ctx.scale(-(p.face||1),1);ctx.globalAlpha=Math.min(1,(p.life-p.age)/.3);window.FemaleEnemies.frame(ctx,images,p.figure,'state2');ctx.restore();}
    for(const f of game.regionalFX){const t=f.age/f.life;ctx.save();ctx.translate(f.x-game.camera,f.y);ctx.strokeStyle=f.kind==='megaphone'?'#edc1ff':'#fff1c8';ctx.globalAlpha=(1-t)*.8;ctx.lineWidth=4*(1-t)+1;for(let i=0;i<2;i++){ctx.beginPath();ctx.ellipse(f.kind==='megaphone'?f.dir*(30+t*95):0,-8,f.radius*(.2+t*.8)-i*13,12+t*25,0,0,Math.PI*2);ctx.stroke();}ctx.restore();}
  }

  const ZN=s=>s===14?4:s<=4?8:s<=9?11:14; // 구역 수(보스 제외) [임시] 초반 8 / 중반 11 / 후반 14
  function makePlan(stage){return window.FemaleEnemies.decorate(makeBasePlan(stage),stage);}
  function makeBasePlan(stage){
    if(stage>=5)return makeRegionalPlan(stage);
    if(stage>=3){
      const variants=[
        [['punk','clubPunk','breaker'],['bouncer','goth','hippie','clubPunk']],
        [['breaker','boxer','clubPunk','paddleBrute'],['whip','clubPunk','bouncer','punk']],
        [['flameGuy','breaker','goth','clubPunk'],['hippie','bouncer','boxer','breaker']],
        [['bouncer','punk','grenadier','clubPunk'],['whip','breaker','goth','hippie']],
        [['breaker','paddleBrute','clubPunk','boxer'],['bouncer','rocketeer','punk','goth']],
        [['grenadier','bouncer','hippie','clubPunk'],['breaker','whip','boxer','punk']]
      ];
      const plan=Array.from({length:ZN(stage)},(_,i)=>({packs:variants[(i+(stage===4?2:0))%6].map(p=>p.slice()),checkpoint:i>0&&i%4===0,title:''}));
      plan.push({packs:stage===3?[['bouncer','breaker'],['manager']]:[['clubPunk','bouncer','breaker'],['clubBoss']],boss:true});return plan;
    }
    const groups=[
      [['punk','boxer','hippie','punk'],['goth','clubPunk','boxer','hippie']],
      [['whip','punk','goth','hippie'],['boxer','paddleBrute','breaker','goth']],
      [['paddleBrute','boxer','punk','hippie'],['goth','whip','bouncer','punk']],
      [['flameGuy','punk','boxer','hippie'],['whip','goth','punk','boxer']],
      [['grenadier','paddleBrute','goth','punk'],['flameGuy','boxer','hippie','punk']],
      [['rocketeer','whip','boxer','punk'],['grenadier','goth','paddleBrute','hippie']]
    ];
    const list=[];
    for(let i=0;i<ZN(stage);i++){
      const group=groups[(i+(stage===2?2:0))%groups.length].map(pack=>pack.slice());
      // The first section introduces melee combat before ranged threats.
      if(stage===1&&i===0)group[0]=['punk','boxer','hippie'];
      if(i>=1&&i%2===1)group[1][group[1].length-1]=['flameGuy','grenadier','flameGuy','rocketeer'][(i>>1)%4]; // 초반에도 원거리 적 섞기 [임시]
      list.push({packs:group,title:['진입로','골목','안쪽'][i%3],checkpoint:i>0&&i%4===0});
    }
    list.push({packs:stage===1?[['boxer','whip','goth'],['fedora']]:[['paddleBrute','grenadier','goth'],['redBoss']],boss:true});
    return list;
  }

  // Golden Quest dungeon idea, adjusted for side-scrolling: seeded adjacent rooms
  // (random widths and entry corridors) but a guaranteed passable horizontal path.
  // Decor is generated from the same seed so every deployment gets a new field.

  function generateLayout(){
    const rng=randFactory(game.seed|0),zones=[];let cursor=0;
    for(let i=0;i<WAVES.length;i++){const length=i===WAVES.length-1?1460:1080+Math.floor(rng()*100);
      zones.push({start:cursor,end:cursor+length,corridor:100});cursor+=length;}
    game.zones=zones;WORLD_W=cursor;
  }
  function makeProps(){generateLayout();game.props=[];game.breakables=[];game.pickups=[];player.hasteT=0;}

  let storyBossSeen=new Set(),lastStoryBoss=null,storyPackBosses=[];
  function storyContext(boss){
    const kind=boss?.kind||WAVES.flatMap(w=>w.packs.flat()).find(k=>TYPES[k]?.boss);
    const portraitFor=(k,d)=>ASSET[d?.frames?.[0]||(k==='clubBoss'?'clubBoss_whip':k+'_idle')]||ASSET[k]||'';
    const def=TYPES[kind],info=GaiaCampaign.stages[activeStage],actors={};
    for(const [k,d]of Object.entries(TYPES))if(d.boss)actors[k]={name:d.name,portrait:portraitFor(k,d)};
    return {hero:'assets/ui/rosie-portrait.jpg',portrait:portraitFor(kind,def),name:boss?.name||def?.name||'',kind,actors,
      region:info.region,route:info.route,routes:GaiaCampaign.regions[info.region].stages.length,title:info.name+' · '+info.route};
  }
  function battleStory(event,boss){
    if(!window.BeltStory)return;
    if(boss)lastStoryBoss=boss;
    const c=storyContext(boss),key=BeltStory.key(event,c);
    clearInput();if(game.mode==='playing')game.mode='dialogue';
    const done=()=>{clearInput();if(game.mode==='dialogue'&&!BeltStory.active){game.mode='playing';if(document.hidden)pause();}};
    if(event==='boss'&&boss?.kind==='host')BeltStory.play('studio.reveal',c,done);
    BeltStory.play(key,c,done);
  }

  // ===== 난이도: 월드 레벨(깬 스테이지 3개마다 +1) 연동 + 보스 기본 강화 — 수치 전부 [임시] =====
  // 적 체력 +25%/레벨, 공격력 +12%/레벨 유지. 여성 체력 ×2, 보스 기본 체력 ×3.6(마피아 사수 ×2.2). 공격력 배율은 기존 유지.
  const BOSS_HP={mafiaA:2.2,mafiaB:2.2,mafiaC:2.2,mafiaD:2.2},BOSS_HP_DEFAULT=3.6,BOSS_ATK=1.25;
  const worldLevel=()=>Math.floor(Object.keys(wallet).filter(k=>/^stage\d+$/.test(k)&&wallet[k]).length/3);
  function applyDifficulty(){
    const wl=worldLevel(),atk=1+.12*wl;
    for(const d of Object.values(TYPES)){if(d.baseAttack==null)d.baseAttack=d.attack;d.attack=Math.max(1,Math.round(d.baseAttack*atk*(d.boss?BOSS_ATK:1)));}
    game.hpMul=1+.25*wl;
  }
  function reset(stage=activeStage,checkpoint=0){
    const storyRetry=(game.mode==='lost'&&stage===activeStage)||checkpoint>0;
    window.BeltStory?.cancel();storyBossSeen=new Set();lastStoryBoss=null;storyPackBosses=[];
    activeStage=stage;applyDifficulty();WAVES=makePlan(stage);planBreakables();checkpointStart=Math.max(0,Math.min(WAVES.length-1,checkpoint));hasReported=false;
    game.hazards=[];game.castaways=[];game.regionalFX=[];game.encounterBossMax=0;
    game.seed=activeStage===13?67821+(wallet.eventRuns||0)*997:67821;game.zone=checkpointStart;game.waveLive=false;game.arrests=0;game.camera=0;game.elapsed=0;game.enemies=[];game.particles=[];game.decals=[];game.bubbles=[];game.shockwaves=[];game.skillBursts=[];game.projectiles=[];game.shake=0;game.freeze=0;game.lastAttack=null;game.transition=0;game.artParticles=[];game.artBursts=[];game.skillRings=[];game.heartBursts=[];
    makeProps();
    const startX=game.zones[checkpointStart].start+145;
    Object.assign(player,{x:startX,y:435,face:1,hp:checkpoint?Math.max(112,wallet.hp):Math.max(80,wallet.hp),maxHp:160,invuln:0,hurt:0,attack:null,attackCooldown:0,skillCooldown:0,mp:wallet.mp??100,maxMp:100,pushCd:0,chargeCd:0,charge:null,skillPose:null,stun:0,combo:0,comboTime:0,jump:null,jumpZ:0,grab:null,grabCd:2,crouch:false,crouchHold:0,crouchBlend:0,dash:null,dashLink:null,dashFollow:null,dashCd:0,down:null,slam:null,splash:null,cardGuard:0,cardDef:0,cardSpd:0,dopa:0,climaxT:0,climaxCd:0,dazeT:0});game.cardQ=[];if(window.BeltCards)BeltCards.begin(stage);
    game.camera=Math.max(0,startX-345);clearInput();game.mode='playing';AlleyAudio.bgm('battle');hidePanels();if(storyRetry)battleStory('common.retry');battleStory('enter');spawnWave(checkpointStart);
    toast(stage===1?'뒷골목 1 · 중간보스를 찾아 전진하세요':'뒷골목 2 · 골목 안쪽으로 진입합니다',2.6);refreshHud();
  }
  function spawnWave(zone){
    game.zone=zone;game.waveLive=true;game.enemies=[];game.projectiles=[];game.hazards=[];game.castaways=[];game.regionalFX=[];packIndex=0;spawnBreakables(zone);
    if(WAVES[zone].checkpoint){
      wallet.checkpoint[activeStage]=zone;player.hp=Math.min(player.maxHp,player.hp+40);wallet.hp=player.hp;wallet.mp=player.mp;save();
      toast('수사 경로 기록 · 체력 +40',2.2);
    }
    if(WAVES[zone].boss){AlleyAudio.bgm('boss');game.transition=.9;toast(activeStage===1?'중절모 킬러 · 중간보스':'보스 구역 진입 · 뒷골목 보스',2.7);}
    spawnPack();refreshHud();
  }
  function spawnPack(){
    const z=game.zones[game.zone],kinds=WAVES[game.zone].packs[packIndex++];
    const rng=randFactory((game.seed+game.zone*1133+packIndex*977)|0);

    kinds.forEach((kind,i)=>{
      const def=TYPES[kind],boss=def.boss;
      const left=packIndex>1&&i===0&&!boss&&player.x>z.start+260;
      const x=clamp(left?player.x-245:player.x+345+i*73,z.start+80,z.end-95);
      const hp=Math.round(def.hp*femaleHealth(kind)*(boss?(activeStage===13?.60:1)*(BOSS_HP[kind]??BOSS_HP_DEFAULT):GaiaCampaign.stages[activeStage].hpScale)*(game.hpMul||1));
      game.enemies.push({kind,name:def.name,x,y:Y_MIN+25+(i%3)*48,face:left?1:-1,hp,maxHp:hp,invuln:0,hurt:0,stun:0,staggerResist:0,windup:0,windupStyle:def.style,attackCd:.35+i*.12+rng()*.18,swing:0,swingStyle:def.style,colorShift:0,id:++enemySerial,slotY:(i%3-1)*27,powerDown:0,bind:0,air:null,floorTime:0,floorAngle:0,exit:null,walking:false,motionPhase:rng()*Math.PI*2,captured:false,reward:0,entry:.8});
    });
    game.reinfT=undefined;
    game.encounterBossMax=game.enemies.filter(e=>TYPES[e.kind].boss).reduce((n,e)=>n+e.maxHp,0);
    storyPackBosses=game.enemies.filter(e=>TYPES[e.kind].boss).map(e=>({kind:e.kind,name:e.name}));
    const newBosses=game.enemies.filter(e=>TYPES[e.kind].boss&&!storyBossSeen.has(e.kind));
    if(newBosses.length){newBosses.forEach(e=>storyBossSeen.add(e.kind));battleStory('boss',newBosses[0]);}
    if(packIndex>1&&!WAVES[game.zone].boss)toast('추가 인원 접근 · 주변을 확인하세요',1.5);
  }

  function particle(x,y,label,color='#fff6bd',size=21){game.particles.push({x,y,label,color,size,age:0,life:.83,vx:(Math.random()-.5)*38,vy:-76-Math.random()*26});}
  // Reuse the owner's original transparent six-sticker and four-swoosh sheets.
  // Each punch shows at most ONE pre-drawn sticker; never stack a whole sheet.

  const COMIC_CELLS={slap:'fx_zzak',swat:'fx_chalssak',thud:'fx_kwang',puff:'fx_bbong',crash:'fx_crash',boing:'fx_peng',ouch:'fx_ah',surprise:'fx_startle',shock:'fx_what',gasp:'fx_gasp',spark:'fx_spark',bigBang:'fx_bang3',hearts:'fx_heartB',flutter:'fx_flash',glitter:'fx_throb',speed:'fx_whoosh',blast:'fx_peng',arc:'fx_lines',flare:'fx_flash',reward:'fx_spark'};
  function comicPop(x,y,name,options={}){
    if(!COMIC_CELLS[name])return;
    game.decals.push({x,y,name,age:0,life:options.life||.4,size:options.size||76,dir:options.dir||1,spin:options.spin||0,driftX:options.driftX||0,driftY:options.driftY??-16,behind:!!options.behind});
    if(game.decals.length>5)game.decals.shift();
  }

  function comicBubble(unit,label){
    game.bubbles.push({unit,label,age:0,life:1.48});
    if(game.bubbles.length>2)game.bubbles.shift();
  }
  // 임시: 몸통 두께를 감안해 근접 판정 폭을 넓힘. 입력·속도·피해량은 유지.
  const moves={
    punch:{dur:.42,impact:.51,near:-12,reach:94,width:64,damage:13,stagger:.23,kb:15,maxHits:1},
    kick:{dur:.65,impact:.63,near:-12,reach:126,width:70,damage:28,stagger:.68,kb:91,maxHits:1},
    // 임시: 앉은 공격. 기본 상단/하단과 같은 피해량, 다리찢기는 양쪽 발 범위.
    headbutt:{dur:.42,impact:.51,near:-12,reach:94,width:64,damage:13,stagger:.32,kb:36,maxHits:1},
    split:{dur:.65,impact:.42,near:-112,reach:112,width:70,damage:28,stagger:.68,kb:91,maxHits:3,bothSides:true},
    // 임시: 대쉬 후의 낮은 피해 제어 기술. 후속 기본 공격은 그대로.
    dashHip:{dur:.44,impact:.2,near:-16,reach:76,width:70,damage:6,stagger:.40,kb:0,maxHits:3,setup:'push'},
    dashHug:{dur:.46,impact:.2,near:-12,reach:88,width:64,damage:4,stagger:1.10,kb:0,maxHits:1,setup:'stun'},
    // [임시] 가슴-가슴-엉덩이 / 엉덩이-엉덩이-가슴-가슴
    hipCrash:{dur:.78,impact:.57,near:-18,reach:152,width:78,damage:44,stagger:.90,kb:150,maxHits:2},
    whirlSplit:{dur:1.08,impact:.36,near:-170,reach:170,width:80,damage:20,stagger:.55,kb:115,maxHits:4,bothSides:true,spin:true}
  };
  const slamMove={damage:23,radiusX:169,radiusY:76,kb:139,stagger:.82,dropSpeed:450,recovery:.37};
  function attack(kind,fresh=false){
    if(game.mode!=='playing'||player.hp<=0||player.splash||player.grab)return false;
    const wasDashing=!!(player.dash||player.dashLink);
    if(wasDashing){if(player.stun>0||player.charge||player.skillPose||player.attackCooldown>0)return false;resetComboChain();continueDash(kind==='kick'?'hip':'hug');}
    if(kind==='punch'&&player.jump&&player.jumpZ>18&&player.stun===0&&!player.slam){
      resetComboChain();
      player.splash={age:0,dir:player.face,fromX:player.x,lift:player.jumpZ,hit:false,landed:false};
      player.jump=null;player.attack=null;player.crouch=false;player.dashFollow=null;player.attackCooldown=.84;AlleyAudio.hero('upper');return true;
    }

    // Pressing the existing LOWER button in mid-jump replaces the forward spear
    // with a falling seated slam. Its damage happens only when the feet reach ground.
    if(kind==='kick'&&player.jump&&player.jumpZ>18&&!player.slam&&!slamKickLock&&player.stun===0){
      resetComboChain();
      player.dashFollow=null;player.slam={phase:'dive',age:0,recovery:0};player.jump=null;
      player.crouch=false;slamKickLock=true;player.attackCooldown=0;AlleyAudio.hero('slam');return true;
    }
    if(game.mode!=='playing'||player.charge||player.skillPose||player.stun>0||player.attackCooldown>0||player.hp<=0||player.jump||player.down||player.slam||kind==='kick'&&slamKickLock)return false;
    if(wasDashing)kind=kind==='kick'?'dashHip':'dashHug';
    if(!wasDashing&&(input.crouch||player.crouch||player.crouchHold>0)){resetComboChain();kind=kind==='kick'?'split':'headbutt';}
    else if(!wasDashing)kind=comboMove(kind,fresh);
    player.crouch=false;
    const cfg=moves[kind];player.attack={kind,age:0,hit:false,dir:player.face,fromDash:wasDashing,hitIds:new Set()};
    player.attackCooldown=cfg.dur*1.12;player.anim=.22;sound(kind);
    if(kind==='whirlSplit')AlleyAudio.cartoon('whoosh');
    return true;
  }
  // Comic-book knockback: the original paper doll keeps its pose and simply
  // arcs through the air. No extra sprite sheets or realistic rigid-body physics.
  function launchEnemy(e,dir,distance,depth=0){
    if(e.hp<=0||e.exit)return;
    const mass=TYPES[e.kind].boss?(e.kind==='clubBoss'?.35:e.kind==='redBoss'?.48:.72):1;
    const travel=clamp(distance*mass,42,270);
    e.setupPush=null;e.air={age:0,duration:.62+Math.min(.18,travel/800),fromX:e.x,dir:dir||1,distance:travel,
      height:clamp(travel*.65,46,135),angle:0,lift:0,contacts:new Set(),depth};
    e.floorTime=0;e.floorAngle=0;e.windup=0;e.swing=0;
    e.stun=Math.max(e.stun,e.air.duration+.4);
    if(depth===0&&!TYPES[e.kind].boss&&Math.random()<.75)particle(e.x,e.y-175,FLY_LINES[Math.floor(Math.random()*FLY_LINES.length)],'#ffffff',27);
  }
  function captureEnemy(e){
    if(e.captured)return;
    e.captured=true;game.arrests++;
    e.reward=TYPES[e.kind].reward??(TYPES[e.kind].boss?80:5);
    wallet.gold+=e.reward;save();refreshHud();
  }
  // Defeat is an over-the-top comic exit, not another identical knockdown.
  // A deliberately different miniature cartoon for every enemy personality.
  const EXIT_BY_KIND={
    punk:'spring',boxer:'squash',hippie:'fold',whip:'heart',paddleBrute:'squash',
    goth:'heart',flameGuy:'fold',rocketeer:'spring',grenadier:'cuffs',
    fedora:'spin',redBoss:'boss',clubPunk:'spring',bouncer:'squash',breaker:'spin',manager:'cuffs',clubBoss:'boss'
  };
  const EXIT_LENGTH={female:1.4,spring:1.32,squash:1.18,fold:1.38,heart:1.42,cuffs:1.18,spin:1.35,boss:1.85};

  function defeatEnemy(e,dir=1){
    if(e.exit)return;
    const kind=TYPES[e.kind].female?'female':EXIT_BY_KIND[e.kind]||'cuffs';
    e.setupPush=null;e.exit={kind,age:0,duration:EXIT_LENGTH[kind],dir:dir||1};
    e.air=null;e.floorTime=0;e.windup=0;e.swing=0;e.stun=2;
    captureEnemy(e);emitExitFX(e);AlleyAudio.cartoon(EXIT_BY_KIND[e.kind]);AlleyAudio.die(TYPES[e.kind].female?'whip':e.kind);hap('bigHit');
    const atY=e.y-TYPES[e.kind].drawH*.69;
    const graphic={squash:'thud',spin:'arc',spring:'boing',fold:'puff',heart:'hearts',cuffs:'flutter',boss:'bigBang'}[kind];
    comicPop(e.x,atY,graphic,{size:kind==='boss'?150:kind==='heart'?108:93,life:kind==='boss'?.73:.49,dir});
    if(e.kind==='whip')comicBubble(e,'주인님~ 죄송해요♡');
    else if(kind==='heart')comicBubble(e,'사랑해요~♡');




    game.shake=Math.max(game.shake,kind==='boss'?11:4);
    sound('card');
  }
  function hitEnemy(e,amount,kb,stagger,sourceX,crit=false,forceDir=0,strong=false,setup=false){
    if(e.hp<=0||e.invuln>0)return false;
    if(e.vulnT>0)amount=Math.round(amount*1.8);
    amount=Math.max(1,Math.round(amount*(1+.03*ST('음란도'))*(player.climaxT>0?1.5:1)));
    if(e.kind==='bouncer'&&!strong&&e.windup<=0&&e.swing<=0&&Math.sign(sourceX-e.x)===e.face)amount=Math.max(1,Math.round(amount*.6));
    e.hp=Math.max(0,e.hp-amount);e.hurt=.21;AlleyAudio.impact(strong,e.kind);hap(strong?'bigHit':'hit');
    const boss=!!TYPES[e.kind].boss,canStagger=setup||e.staggerResist<=0||strong&&!boss;
    if(canStagger){
      e.stun=Math.max(e.stun,boss&&!setup?Math.min(stagger,strong?.26:.16):stagger);e.staggerResist=boss?1.2:.92;
      e.windup=0;e.followup=null;e.strikes=null;e.dive=null;e.spinRush=null;e.swing=0;e.closeWind=0;e.barrageWind=0;e.volley=0; // A clean counter-hit cancels a telegraphed enemy blow.
    }
    e.invuln=.13;if(!setup)e.setupPush=null;
    const dir=forceDir||Math.sign(e.x-sourceX||player.face);
    // Even large punches/kicks usually produce a short shove. A rare strong
    // blow launches a living mob; bosses almost never become tumbling toys.
    // 임시: 모든 강타(발차기·내려찍기)와 연타 4번째 타격은 확정으로 날린다(예전: 15% 확률). 보스는 날리지 않고 크게 휘청.
    const isBoss=!!TYPES[e.kind].boss,comboHit=!setup&&(player.combo+1)%4===0;
    if(e.hp<=0)defeatEnemy(e,dir);
    else if(!isBoss&&(strong||comboHit)){launchEnemy(e,dir,strong?Math.max(120,kb*1.7):130);bigImpact(e,dir,strong);}
    else if(isBoss&&(strong||comboHit)){e.x=clamp(e.x+dir*48,50,WORLD_W-50);if(canStagger&&!setup)e.stun=Math.max(e.stun,Math.min(.3,stagger+.3));game.shake=Math.max(game.shake,9);game.freeze=Math.max(game.freeze,.07);vib();}
    else e.x=clamp(e.x+dir*Math.min(kb,29),50,WORLD_W-50);
    if(e.hp>0){
      if(crit||Math.random()<.76){
        const sticker=crit?'spark':strong?(Math.random()<.5?'swat':'slap'):'slap';
        comicPop(e.x+dir*21,e.y-115,sticker,{size:crit?95:strong?83:62,life:.36,dir});
      }
    }
    game.shake=Math.max(game.shake,crit?7:3);game.freeze=Math.max(game.freeze,.032);player.combo++;player.comboTime=2.1;
    refreshHud();return true;
  }
  function vib(){try{const h=window.GAIA_HAPTICS||(window.parent&&window.parent.GAIA_HAPTICS);if(h&&h.fx&&h.fx.miniPerfect)h.fx.miniPerfect();}catch(_){}} // 앱에 진동 장치가 있으면 길고 세게(없으면 무시)
  function hap(name){try{const h=window.GAIA_HAPTICS;if(h&&h.fx&&h.fx[name])h.fx[name]();}catch(_){}}
  function bigImpact(e,dir,strong){ // 퍽퍽퍽: 충돌음 3연타 + 짧은 정지 + 흔들림
    game.shake=Math.max(game.shake,strong?12:8);game.freeze=Math.max(game.freeze,strong?.085:.065);
    particle(e.x+dir*10,e.y-130,'퍽!','#ffe9a9',30);
    setTimeout(()=>{particle(e.x,e.y-150,'퍽!','#fff1c4',26);AlleyAudio.impact(true,e.kind);},80);
    setTimeout(()=>{AlleyAudio.impact(true,e.kind);},170);
    vib();
  }
  function resolveAttack(a,finalPulse=false){
    const cfg=moves[a.kind];const hits=[];
    for(const e of game.enemies){
      if(e.hp<=0)continue;
      const dx=e.x-player.x,dy=(e.y-player.y)*1.12;
      const along=dx*a.dir,side=Math.abs(dy);
      if(along>=cfg.near&&along<=cfg.reach&&side<=cfg.width)hits.push({e,along});
    }
    hits.sort((a,b)=>cfg.bothSides?Math.abs(a.along)-Math.abs(b.along):a.along-b.along);
    const dealt=hits.slice(0,cfg.maxHits);
    let struck=0;
    for(const h of dealt){
      const strong=a.kind==='kick'||a.kind==='split'||a.kind==='hipCrash'||a.kind==='whirlSplit'&&finalPulse;
      const kb=a.kind==='whirlSplit'&&!finalPulse?0:cfg.kb;
      if(hitEnemy(h.e,a.kind==='whirlSplit'?(finalPulse?25:20):cfg.damage,kb,cfg.stagger,player.x,false,cfg.bothSides?(Math.sign(h.e.x-player.x)||a.dir):a.dir,strong))struck++;
    }
    if(!cfg.spin||finalPulse)hitBreakables(a,cfg);
    game.lastAttack={kind:a.kind,dir:a.dir,targets:struck,reach:cfg.reach,knockback:cfg.kb};
    if(a.kind==='hipCrash'){
      comicPop(player.x+a.dir*105,player.y-88,'bigBang',{size:138,life:.47,dir:a.dir});
      game.shockwaves.push({x:player.x+a.dir*65,y:player.y,age:0,life:.43});
      particle(player.x+a.dir*85,player.y-175,'엉덩이 쾅!','#fff0bd',25);
      game.shake=Math.max(game.shake,11);
    }else if(a.kind==='whirlSplit'){
      for(const dir of [-1,1])comicPop(player.x+dir*115,player.y-62,finalPulse?'crash':'arc',{size:105,life:.3,dir,behind:true});
      if(finalPulse){particle(player.x,player.y-185,'회전 다리찢기!','#ffe9ff',24);game.shake=Math.max(game.shake,9);}
    }else if(struck&&a.kind==='headbutt')comicPop(player.x+a.dir*65,player.y-105,'speed',{size:76,life:.23,dir:a.dir,behind:true});
    else if(struck&&a.kind==='split'){for(const dir of [-1,1])comicPop(player.x+dir*70,player.y-23,'arc',{size:96,life:.25,dir,behind:true});}
    else if(struck)comicPop(player.x+a.dir*(a.kind==='punch'?74:98),player.y-(a.kind==='punch'?124:88),
      a.kind==='punch'?'speed':'arc',{size:a.kind==='punch'?104:132,life:.25,dir:a.dir,behind:true});
    if(!struck&&a.kind==='punch')particle(player.x+a.dir*105,player.y-105,'휙','#fff7e3',14);
  }
  function resolveDashSetup(a){
    const cfg=moves[a.kind];if(!cfg.setup||a.age<.05||a.age>.32||a.hitIds.size>=cfg.maxHits)return;
    const candidates=game.enemies.filter(e=>e.hp>0&&!e.air&&!(e.floorTime>0)&&!e.exit&&!a.hitIds.has(e.id)&&(e.x-player.x)*a.dir>=cfg.near&&(e.x-player.x)*a.dir<=cfg.reach&&Math.abs((e.y-player.y)*1.12)<=cfg.width).sort((x,y)=>Math.abs(x.x-player.x)-Math.abs(y.x-player.x));
    for(const e of candidates){
      if(a.hitIds.size>=cfg.maxHits)break;
      if(!hitEnemy(e,cfg.damage,0,cfg.stagger,player.x,false,a.dir,false,true))continue;
      a.hitIds.add(e.id);a.hit=true;e.air=null;e.floorTime=0;
      if(cfg.setup==='push')e.setupPush={age:0,duration:.18,fromX:e.x,dir:a.dir,distance:TYPES[e.kind].boss?75:115};
      else{e.setupPush=null;e.stun=Math.max(e.stun,cfg.stagger);player.dashFollow=null;}
      comicPop(e.x,player.y-(cfg.setup==='push'?65:120),cfg.setup==='push'?'speed':'spark',{size:70,life:.25,dir:a.dir});
      game.lastAttack={kind:a.kind,dir:a.dir,targets:a.hitIds.size,setup:cfg.setup};
    }
  }
  function landSlam(){
    if(!player.slam||player.slam.phase!=='dive')return;
    player.slam.phase='landed';player.slam.recovery=0;player.stun=Math.max(player.stun,.25);player.jumpZ=0;
    let struck=0;
    for(const e of game.enemies){
      if(e.hp<=0||Math.abs(e.x-player.x)>slamMove.radiusX||Math.abs(e.y-player.y)>slamMove.radiusY)continue;
      const dir=Math.sign(e.x-player.x)||e.face||player.face;
      if(hitEnemy(e,slamMove.damage,slamMove.kb,slamMove.stagger,player.x,false,dir,true))struck++;
    }
    slamBreakables();
    game.lastAttack={kind:'slam',dir:0,targets:struck,reach:slamMove.radiusX,knockback:slamMove.kb};
    game.shockwaves.push({x:player.x,y:player.y,age:0,life:.47});
    game.shake=Math.max(game.shake,13);game.freeze=.075;
    player.invuln=Math.max(player.invuln,.23);
    player.attackCooldown=Math.max(player.attackCooldown,slamMove.recovery);
    comicPop(player.x,player.y-119,'bigBang',{size:128,life:.56});
  }
  function damagePlayer(d,sourceX,kind='normal'){
    if(player.grab)return false;
    if(player.hp<=0||game.mode!=='playing')return false;
    if(player.cardGuard>0){particle(player.x,player.y-120,'◇','#bbfff4',24);return false;}
    if(player.cardDef>0)d=d*.35;
    if(!player.charge&&Math.random()<Math.min(.3,.01*ST('색기'))){particle(player.x,player.y-130,'휙','#ffe3ee',26);return false;}
    d=d/(1+.025*ST('복종도'));
    if(player.invuln<=0)addDopa(d*1.1*(1+.04*ST('복종도')));
    if(player.charge){
      const c=player.charge;c.raw+=d;c.stored=Math.min(SKILLS.maxStored,c.stored+d*.8);c.hits++;
      player.hp=Math.max(0,player.hp-d*.2);player.hurt=.12;game.shake=Math.max(game.shake,3);
      comicPop(player.x+c.dir*28,player.y-95,'swat',{size:64,life:.24});AlleyAudio.hero('hurt');hap('hit');refreshHud();
      if(player.hp<=0){cancelCharge();finish(false);}return true;
    }
    if(player.invuln>0)return false;
    if(kind!=='explosion'&&player.jump&&player.jump.age<.12&&player.jumpZ>36){return false;} // 점프 직후 아주 짧은 순간만 무적 [임시]
    player.hp=Math.max(0,player.hp-d);player.combo=0;resetComboChain();player.attack=null;player.crouch=false;player.crouchHold=0;player.crouchBlend=0;player.dash=null;player.dashLink=null;player.dashFollow=null;player.slam=null;player.splash=null;
    player.jump=null;player.jumpZ=0;
    const away=Math.sign(player.x-sourceX||player.face);
    if(kind==='heavy'||kind==='explosion'){
      const duration=kind==='explosion'?1.08:.84;
      player.down={kind,age:0,duration,dir:away,travelled:0,hitIds:new Set()};
      player.jump=null;player.jumpZ=0;player.stun=duration;
      // Give the player time to stand up and defend after a knockdown.
      player.invuln=duration+.48;player.hurt=.16;player.dazeT=Math.max(player.dazeT||0,duration);
    }else{
      player.invuln=1.25;player.hurt=.24;player.stun=.13;
      player.x=clamp(player.x+away*23,45,WORLD_W-60);
    }
    comicPop(player.x,player.y-141,kind==='explosion'?'surprise':'ouch',
      {size:kind==='explosion'?106:77,life:.49,dir:away});
    game.shake=kind==='explosion'?16:kind==='heavy'?11:8;
    game.freeze=.06;sound('hurt');hap(player.hp<=0?'heavyHurt':'hurt');refreshHud();
    if(player.hp===0)finish(false);
    return true;
  }
  function updateEnemyFlights(dt){
    for(const e of game.enemies){
      if(e.air){
        const flight=e.air;
        flight.age=Math.min(flight.duration,flight.age+dt);
        const t=flight.age/flight.duration;
        const eased=1-Math.pow(1-t,2);
        const maxX=game.waveLive?game.zones[game.zone].end-39:WORLD_W-50;
        e.x=clamp(flight.fromX+flight.dir*flight.distance*eased,50,maxX);
        flight.lift=Math.sin(Math.PI*t)*flight.height;
        flight.angle=flight.dir*1.16*Math.min(1,t*2.2); // 제자리 회전 없이, 날아가면서 뒤로 눕는다(착지 각도와 같음)
        // Flying into another paper doll becomes a small secondary attack.
        if(flight.depth<3&&t<.97){
          for(const other of game.enemies){
            if(other===e||other.hp<=0||other.air||other.floorTime>0||flight.contacts.has(other.id))continue;
            if(Math.abs(other.x-e.x)>62||Math.abs(other.y-e.y)>53)continue;
            flight.contacts.add(other.id);
            const otherBoss=TYPES[other.kind].boss;
            const bump=otherBoss?Math.round(other.maxHp*(flight.depth===0?.06:.04)):flight.depth===0?12:8;
            other.hp=Math.max(0,other.hp-bump);
            other.hurt=.25;other.invuln=.22;other.windup=0;
            if(other.hp===0)defeatEnemy(other,flight.dir);
            else if(otherBoss){other.stun=Math.max(other.stun,.8);other.swing=0;other.closeWind=0;other.barrageWind=0;other.volley=0;}
            else launchEnemy(other,flight.dir,flight.distance*.78,flight.depth+1);
            particle(other.x,other.y-125,otherBoss?'쾅!!':'퍽!','#ffe9a9',otherBoss?38:25);
            game.shake=Math.max(game.shake,5);
          }
        }
        // A fallen enemy can lightly bump Rozie, but hit invulnerability still applies.
        if(!flight.contacts.has('rozie')&&Math.abs(e.x-player.x)<49&&Math.abs(e.y-player.y)<47&&flight.lift<78){
          flight.contacts.add('rozie');
          damagePlayer(3,e.x,'normal');
        }
        if(t>=1){
          e.air=null;e.floorTime=.8;e.floorDur=.8;e.floorAngle=flight.dir*1.16;e.slideV=flight.dir*(120+flight.distance*.45);e.floorLift=0;e.floorBounced=false;game.shake=Math.max(game.shake,6);particle(e.x,e.y-70,'♥','#ff9fc8',28);particle(e.x+16,e.y-92,'✦','#ffe38a',22);
          comicPop(e.x,e.y-55,'thud',{size:80,life:.39});
        }
      }else if(e.floorTime>0){
        e.floorTime=Math.max(0,e.floorTime-dt);
        const fa=(e.floorDur||.42)-e.floorTime; // 착지 후 지난 시간: 튕기고 미끄러지며 뒹군다
        e.slideV=(e.slideV||0)*Math.pow(.02,dt);
        const maxX2=game.waveLive?game.zones[game.zone].end-39:WORLD_W-50;
        e.x=clamp(e.x+(e.slideV||0)*dt,50,maxX2);
        e.floorLift=fa<.38?Math.abs(Math.sin(fa/.38*Math.PI))*26:0;
        if(!e.floorBounced&&fa>=.38){e.floorBounced=true;comicPop(e.x,e.y-48,'thud',{size:58,life:.3});game.shake=Math.max(game.shake,3);}
      }
    }
  }
  function updateEnemyExits(dt){
    for(const e of game.enemies)if(e.exit)e.exit.age=Math.min(e.exit.duration,e.exit.age+dt);
  }
  const GRABBERS=new Set(['punk','boxer','goth','hippie','clubPunk','bouncer','breaker']);
  function beginGrab(e,pose){
    if(game.mode!=='playing'||!GRABBERS.has(e.kind)||player.grab||player.grabCd>0||player.hp<=0||player.invuln>0||player.jump||player.down||player.slam||player.splash||player.dash||player.charge||e.hp<=0||e.exit||e.air||e.floorTime>0||e.stun>0||e.hurt>0||e.bind>0||Math.abs(e.x-player.x)>78||Math.abs(e.y-player.y)>58)return false;
    clearInput();player.attack=null;player.skillPose=null;player.attackCooldown=0;player.stun=0;player.hurt=0;player.dazeT=0;
    const dir=Math.sign(e.x-player.x)||player.face;game.grabCount=(game.grabCount||0)+1;
    player.grab={enemy:e,pose:pose||((game.grabCount%2)?'hip':'low'),dir,age:0,taps:0,need:6,x:player.x,y:player.y};
    e.holdingPlayer=true;e.face=-dir;e.x=clamp(player.x+dir*62,game.zones[game.zone].start+55,game.zones[game.zone].end-60);e.y=clamp(player.y-8,Y_MIN,Y_MAX);e.windup=0;e.swing=0;e.followup=null;e.strikes=null;e.rush=null;e.setupPush=null;e.walking=false;
    game.freeze=0;return true;
  }
  function releaseGrab(escaped=false){
    const g=player.grab;if(!g)return;
    g.enemy.holdingPlayer=false;g.enemy.attackCd=Math.max(g.enemy.attackCd||0,1);g.enemy.stun=Math.max(g.enemy.stun||0,escaped?.45:0);
    player.grab=null;player.grabCd=9;player.invuln=Math.max(player.invuln,.65);player.stun=0;
    if(escaped){const z=game.zones[game.zone];player.x=clamp(player.x-g.dir*24,Math.max(55,z.start+35),z.end-35);comicPop(player.x,player.y-100,'speed',{size:65,life:.24,dir:-g.dir});}
  }
  function mashGrab(){
    if(game.mode!=='playing'||!player.grab)return false;
    const g=player.grab;g.taps=Math.min(g.need,g.taps+1);
    if(g.age>=1&&g.taps>=g.need)releaseGrab(true);
    return true;
  }
  function updateGrab(dt){
    const g=player.grab;if(!g)return;
    const e=g.enemy;
    if(!game.enemies.includes(e)||e.hp<=0||e.exit||e.air||e.floorTime>0||e.stun>0||e.hurt>0||e.bind>0){releaseGrab(false);return;}
    g.age+=dt;player.x=g.x;player.y=g.y;player.crouch=false;player.crouchHold=0;player.crouchBlend=0;player.attack=null;player.dash=null;player.dashFollow=null;player.dashLink=null;player.jumpZ=0;
    if(g.age>=1&&g.taps>=g.need)releaseGrab(true);
  }
  function drawGrab(){
    const g=player.grab;if(!g)return;
    const x=player.x-game.camera,h=g.pose==='hip'?169:112,cy=player.y-h-12,t=g.age*8;
    for(let j=0;j<3;j++){const a=t+j*Math.PI*2/3;tinyHeart(x+Math.cos(a)*28,cy+Math.sin(a)*8,7,Math.sin(a)<0?.55:1);}
    // Gloved grip markers on the upper arms, away from the pelvis.
    ctx.save();ctx.lineCap='round';
    for(const side of [-1,1]){const gx=x+g.dir*10+side*12,gy=player.y-(g.pose==='hip'?112:73)+side*5;
      ctx.strokeStyle='#392c38';ctx.lineWidth=5;for(let j=0;j<3;j++){ctx.beginPath();ctx.moveTo(gx-3,gy-4+j*4);ctx.quadraticCurveTo(gx+6,gy-4+j*4,gx+5,gy+j*4);ctx.stroke();}
      ctx.strokeStyle='#d8a58e';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(gx-2,gy-5);ctx.lineTo(gx+3,gy-4);ctx.stroke();}
    ctx.font='bold 14px system-ui';ctx.textAlign='center';ctx.lineWidth=3;ctx.strokeStyle='#65475f';ctx.fillStyle='#fff1f7';
    const label='탈출 · 버튼 연타 '+g.taps+' / '+g.need,hudY=Math.min(cy-20,g.enemy.y-TYPES[g.enemy.kind].drawH-40);ctx.strokeText(label,x,hudY);ctx.fillText(label,x,hudY);ctx.restore();
  }
  const GRAB_LINES={enemy:'야! 이 판국에 뭐하는거야!!',rosie:'앙..체포 중이랍니다~~'};
  function grabBubble(text,x,y,width,rosie=false){
    ctx.save();ctx.font='bold 20px system-ui';ctx.textAlign='left';ctx.textBaseline='top';
    const lines=[];let line='';for(const ch of text){if(line&&ctx.measureText(line+ch).width>width-30){lines.push(line);line=ch;}else line+=ch;}if(line)lines.push(line);
    const height=lines.length*29+24;ctx.fillStyle=rosie?'#f0badbd9':'#fff1e4d9';ctx.strokeStyle=rosie?'#ffe9f2':'#efd1ac';ctx.lineWidth=1.5;
    roundRect(x,y,width,height,13);ctx.fill();ctx.stroke();ctx.fillStyle=rosie?'#724159':'#665266';
    lines.forEach((t,i)=>ctx.fillText(t,x+15,y+12+i*29));ctx.restore();
  }
  function drawGrabOverlay(){
    const g=player.grab;if(!g)return;
    if(!g.backdrop&&document.createElement){const c=document.createElement('canvas');c.width=cvs.width;c.height=cvs.height;const b=c.getContext('2d');if(b){b.drawImage(cvs,0,0);g.backdrop=c;}}
    ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,W,H);
    if(g.backdrop){ctx.save();ctx.filter='blur(5px)';ctx.drawImage(g.backdrop,-8,-8,W+16,H+16);ctx.restore();}
    else{ctx.fillStyle='#b38095';ctx.fillRect(0,0,W,H);}
    ctx.fillStyle='#68465855';ctx.fillRect(0,0,W,H);
    // Existing sprites are enlarged together. No battle coordinates are changed.
    const oldCamera=game.camera,scale=Math.min(1.95,360/TYPES[g.enemy.kind].drawH),baseX=W*.46,baseY=H*.83;
    const hero={...player,x:-30,y:0,face:1,grab:{...g,dir:1}};
    const foe={...g.enemy,x:9,y:-8,face:-1,holdingPlayer:true,cutIn:true};
    ctx.save();ctx.translate(baseX,baseY);ctx.scale(scale,scale);game.camera=0;
    try{
      // Bring the standing captor's shoulder/arm beside Rosie; rock about planted feet.
      ctx.save();ctx.translate(foe.x,foe.y);ctx.rotate(-Math.sin(g.age*Math.PI*2*1.8)*.045);ctx.translate(-foe.x,-foe.y);drawFighter(foe);ctx.restore();
      drawFighter(hero,true);
    }finally{game.camera=oldCamera;ctx.restore();}
    const headX=baseX-30*scale,headY=baseY-(g.pose==='hip'?181:124)*scale;
    for(let j=0;j<3;j++){const a=g.age*8+j*Math.PI*2/3;tinyHeart(headX+Math.cos(a)*35,headY+Math.sin(a)*11,9,Math.sin(a)<0?.55:1);}
    grabBubble(GRAB_LINES.enemy,W*.57,H*.14,Math.min(300,W*.32));
    grabBubble(GRAB_LINES.rosie,W*.06,H*.40,Math.min(255,W*.29),true);
    ctx.font='bold 17px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineWidth=4;ctx.strokeStyle='#6c455e';ctx.fillStyle='#fff0f5';
    const progress='버튼 연타로 풀려나기 · '+g.taps+' / '+g.need;ctx.strokeText(progress,W*.18,H*.65);ctx.fillText(progress,W*.18,H*.65);
    ctx.restore();
  }
  function hurtPlayer(e){
    if(beginGrab(e))return;
    const d=Math.max(2,TYPES[e.kind].attack-(e.powerDown>0?3:0));
    // Ordinary enemy blows should not make Rozie fall over every second.
    damagePlayer(d,e.x,d>=10&&Math.random()<.20?'heavy':'normal');
  }
  function throwEnemyProjectile(e,style){
    if(e.kind==='clubBoss'&&style==='bullet'){
      const points=[[178,-244,0],[157,-192,-35],[-52,-210,35]];
      for(const [dx,dy,spread] of points){const sx=e.x+e.face*dx,sy=e.y+dy,vx=e.face*425,travel=Math.max(.4,Math.abs(player.x-sx)/425),vy=clamp((player.y-108-sy)/travel+spread,-200,200);
        game.projectiles.push({kind:'bullet',x:sx,y:sy,vx,vy,face:e.face,age:0,ttl:2.5,sourceX:e.x,damage:10});comicPop(sx,sy,'flare',{size:55,life:.19,dir:e.face});}
      return;
    }
    const face=e.face,sourceX=e.x+face*(TYPES[e.kind].drawH*.41);
    const vx=face*(style==='rocket'?300:style==='bullet'?480:style==='dagger'?365:style==='flame'?275:210);
    const add=(offset=0)=>{
      const sourceY=e.y-TYPES[e.kind].drawH*.67+offset;
      const travelTime=Math.abs(player.x-sourceX)/Math.abs(vx);
      const vy=clamp((player.y-108-sourceY)/Math.max(.26,travelTime),-245,245);
      game.projectiles.push({kind:style,x:sourceX,y:sourceY,vx,vy,face,age:0,ttl:style==='grenade'?1.65:2.3,sourceX:e.x,damage:TYPES[e.kind].attack});
    };
    add();if(style==='bullet')add(18);
  }
  function enemyAttackStyle(e,dist){
    if(TYPES[e.kind].regional)return regionalStyle(e);
    if(e.kind==='clubBoss')return e.bossStyle||'whip';
    if(e.kind==='manager')return 'shock';
    if(e.kind==='fedora')return dist<290?'whirlwind':'dagger';
    if(e.kind==='redBoss')return dist<144?'paddle':'bullet';
    return TYPES[e.kind].style;
  }
  // ---- 보스 압박: 탄막 · 근접 밀쳐내기 · 졸개 증원 (수치는 임시) ----
  function bossReady(e){return e.hp>0&&!e.exit&&!e.air&&e.floorTime<=0&&e.stun<=0&&e.bind<=0&&!(e.entry>0);}
  function fireBarrage(e,wave){
    const def=TYPES[e.kind],wl=worldLevel(),face=e.face;
    const n=4+Math.min(3,wl)+(e.hp<e.maxHp*.5?1:0);
    const sx=e.x+face*def.drawH*.38,sy=e.y-def.drawH*.67;
    const speed=300+wl*18,t=Math.max(.35,Math.abs(player.x-sx)/speed);
    const baseVy=(player.y-108-sy)/t,gap=wave%2?35:48;
    for(let i=0;i<n;i++){
      const k=i-(n-1)/2;
      game.projectiles.push({kind:'bullet',x:sx,y:sy,vx:face*speed,vy:clamp(baseVy+k*gap,-270,270),face,age:0,ttl:2.7,sourceX:e.x,damage:Math.max(5,Math.round(def.attack*.5))});
    }
    comicPop(sx,sy,'flare',{size:96,life:.24,dir:face,behind:true});
    AlleyAudio.weapon('bullet');game.shake=Math.max(game.shake,3);
  }
  function updateBossPressure(dt){
    if(!game.waveLive)return;
    const wl=worldLevel();
    for(const e of game.enemies){
      const def=TYPES[e.kind];if(!def.boss||!bossReady(e))continue;
      if(e.barrageCd===undefined){e.barrageCd=.75;e.closeCd=.35;e.barrageWind=0;e.volley=0;e.barrageNo=0;}
      e.barrageCd-=dt;e.closeCd-=dt;
      const dx=player.x-e.x,dy=player.y-e.y,busy=e.windup>0||e.rush||e.spinRush||e.dive||e.followup||e.strikes;
      // 가까이 붙으면 밀쳐내기 (예고 후 발동)
      if(e.closeWind>0){
        e.closeWind-=dt;
        if(e.closeWind<=0){
          comicPop(e.x+Math.sign(dx||1)*60,e.y-def.drawH*.4,'swat',{size:130,life:.3,dir:Math.sign(dx||1)});
          game.shake=Math.max(game.shake,8);AlleyAudio.weapon('whirlwind');
          if(Math.abs(player.x-e.x)<150&&Math.abs(player.y-e.y)<72&&player.jumpZ<20)damagePlayer(Math.max(8,Math.round(def.attack*.8)),e.x,'heavy');
        }
        continue;
      }
      if(!busy&&e.closeCd<=0&&Math.abs(dx)<145&&Math.abs(dy)<72){
        e.closeWind=.32;e.closeCd=Math.max(.85,1.3-wl*.08);e.face=Math.sign(dx)||e.face;
        particle(e.x,e.y-def.drawH-8,'!','#ff5a5a',44);continue;
      }
      // 연속 사격: 두 번째 묶음
      if(e.volley>0){
        e.barrageWind-=dt;
        if(e.barrageWind<=0){e.volley--;e.face=Math.sign(dx)||e.face;fireBarrage(e,++e.barrageNo);e.barrageWind=e.volley>0?.28:0;}
        continue;
      }
      // 멀리 있을 때 탄막
      if(!busy&&e.barrageCd<=0&&(Math.abs(dx)>150||Math.abs(dy)>70)){
        if(e.barrageWind<=0){e.barrageWind=.36;e.face=Math.sign(dx)||e.face;particle(e.x,e.y-def.drawH-8,'!','#ffb347',44);comicPop(e.x+e.face*def.drawH*.38,e.y-def.drawH*.67,'flare',{size:60,life:.5,dir:e.face,behind:true});continue;}
      }
      if(e.barrageWind>0&&e.volley===0){
        e.barrageWind-=dt;
        if(e.barrageWind<=0){
          e.face=Math.sign(dx)||e.face;fireBarrage(e,++e.barrageNo);
          e.volley=e.hp<e.maxHp*.6||wl>=1?2:1;e.barrageWind=.28;
          e.barrageCd=Math.max(1.1,1.85-wl*.12)*(e.hp<e.maxHp*.5?.8:1);
        }
      }
    }
  }
  function bossMinionPool(){
    if(game.reinfPool&&game.reinfPoolStage===activeStage)return game.reinfPool;
    const all=[...new Set(WAVES.flatMap(w=>w.packs.flat()).filter(k=>TYPES[k]&&!TYPES[k].boss))];
    const melee=all.filter(k=>!isRangedStyle(TYPES[k].style));
    game.reinfPool=melee.length?melee:all;game.reinfPoolStage=activeStage;return game.reinfPool;
  }
  function updateReinforcements(dt){
    if(!game.waveLive||game.mode!=='playing')return;
    const live=e=>e.hp>0&&!e.exit;
    const bossAlive=game.enemies.some(e=>TYPES[e.kind].boss&&live(e));
    if(!bossAlive){
      for(const e of game.enemies)if(e.reinf&&live(e)){e.hp=0;defeatEnemy(e,1);}
      game.reinfT=undefined;return;
    }
    if(game.reinfT===undefined)game.reinfT=3.2;
    game.reinfT-=dt;if(game.reinfT>0)return;
    const wl=worldLevel();game.reinfT=Math.max(2.8,4.3-wl*.25);
    const alive=game.enemies.filter(e=>!TYPES[e.kind].boss&&live(e)).length;
    if(alive>=3+Math.min(1,wl))return;
    const pool=bossMinionPool();if(!pool.length)return;
    const kind=pool[Math.floor(Math.random()*pool.length)],def=TYPES[kind],z=game.zones[game.zone];
    let x=player.x+(Math.random()<.5?1:-1)*(380+Math.random()*60);
    x=clamp(x,z.start+80,z.end-95);if(Math.abs(x-player.x)<220)x=clamp(player.x+(player.x<(z.start+z.end)/2?1:-1)*400,z.start+80,z.end-95);
    const hp=Math.round(def.hp*femaleHealth(kind)*GaiaCampaign.stages[activeStage].hpScale*(game.hpMul||1));
    game.enemies.push({kind,name:def.name,x,y:Y_MIN+25+Math.floor(Math.random()*3)*48,face:Math.sign(player.x-x)||-1,hp,maxHp:hp,invuln:0,hurt:0,stun:0,staggerResist:0,windup:0,windupStyle:def.style,attackCd:.4+Math.random()*.2,swing:0,swingStyle:def.style,colorShift:0,id:++enemySerial,slotY:(Math.floor(Math.random()*3)-1)*27,powerDown:0,bind:0,air:null,floorTime:0,floorAngle:0,exit:null,walking:false,motionPhase:Math.random()*Math.PI*2,captured:false,reward:0,entry:.6,reinf:true});
  }
  function jump(){
    if(game.mode!=='playing'||player.hp<=0||player.grab||player.stun>0||player.jump||player.down||player.crouch&&!player.dash||player.attack||player.slam||player.splash||player.charge)return;
    resetComboChain();
    const fromDash=!!(player.dash||player.dashLink);if(fromDash)continueDash('jump');
    player.jump={age:0,duration:.88,fromDash};player.jumpZ=0;AlleyAudio.hero('jump');
  }
  // 임시: 버튼을 떼어도 0.38초 앉기 유지, 전환 0.22초/0.18초. 공격 입력은 즉시 허용.
  function syncCrouch(){
    const free=!player.grab&&!player.dash&&!player.dashFollow&&!player.charge&&!player.jump&&!player.down&&!player.attack&&!player.slam&&!player.splash&&player.stun===0&&player.hp>0;
    player.crouch=!!(free&&(input.crouch||player.crouchHold>0||player.crouchBlend>.02));
  }
  function updateCrouch(dt){
    player.crouchHold=input.crouch?.38:Math.max(0,(player.crouchHold||0)-dt);
    const blocked=player.grab||player.dash||player.dashFollow||player.charge||player.jump||player.down||player.slam||player.splash||player.stun>0||player.hp<=0;
    if(blocked){player.crouchHold=0;player.crouchBlend=0;}
    else if(player.attack){player.crouchBlend=['split','headbutt'].includes(player.attack.kind)?1:0;}
    else{const down=input.crouch||player.crouchHold>0;player.crouchBlend=clamp((player.crouchBlend||0)+(down?dt/.22:-dt/.18),0,1);}
    syncCrouch();
  }
  function continueDash(action){
    const d=player.dash||player.dashLink;if(!d)return;
    player.dashFollow={age:0,duration:action==='jump'?.22:action==='hip'?.28:action==='hug'?.20:.14,distance:action==='jump'?110:action==='hip'?110:action==='hug'?75:70,dx:d.dx,dy:d.dy,dir:d.dir,fromX:player.x,fromY:player.y};
    player.face=d.dir;player.dash=null;player.dashLink=null;player.crouch=false;player.crouchHold=0;player.crouchBlend=0;
  }
  // 임시: 0.18초 / 160px 대쉬, 0.55초 재사용. 입력 대기나 공격 예약 없음.
  function dash(){
    if(game.mode!=='playing'||player.hp<=0||player.grab||player.stun>0||player.attack||player.attackCooldown>0||player.jump||player.down||player.slam||player.splash||player.charge||player.skillPose||player.dash||player.dashCd>0)return false;
    let [dx,dy]=moveVector();const n=Math.hypot(dx,dy);if(n>.2){dx/=n;dy/=n;}else{dx=player.face;dy=0;}
    if(Math.abs(dx)>.1)player.face=Math.sign(dx);
    resetComboChain();player.crouch=false;player.crouchHold=0;player.crouchBlend=0;player.dashFollow=null;player.dashLink=null;player.dash={age:0,duration:.18,dx,dy,dir:player.face,fromX:player.x,fromY:player.y};player.dashCd=.55;
    AlleyAudio.cartoon('whoosh');return true;
  }
  function refreshDashHud(){const el=$('dash'),off=player.dashCd>0||player.attackCooldown>0||player.stun>0||!!(player.attack||player.jump||player.down||player.slam||player.splash||player.charge||player.skillPose||player.dash)||player.hp<=0;
    el.classList.toggle('unavailable',off);el.setAttribute?.('aria-disabled',String(off));}
  function nearestEnemy(range=Infinity){
    let best=null,dist=range;
    for(const e of game.enemies){if(e.hp<=0)continue;const d=Math.hypot(e.x-player.x,(e.y-player.y)*1.4);if(d<dist){dist=d;best=e;}}
    return best;
  }

  const SKILLS={pushCost:18,pushCooldown:3,chargeCost:25,chargeCooldown:5,maxCharge:3,maxStored:100};
  function canSkill(){return game.mode==='playing'&&player.hp>0&&!player.grab&&!player.down&&!player.jump&&!player.slam&&!player.splash&&!player.dash&&!player.dashFollow&&player.stun<=0&&!player.charge;}
  function pushSkill(){
    return false; // 하트 속박 스킬은 쓰지 않아 제거(케인 지시)
    if(!canSkill()||player.mp<SKILLS.pushCost||player.pushCd>0)return false;
    player.mp-=SKILLS.pushCost;player.pushCd=SKILLS.pushCooldown;player.attack=null;player.crouch=false;player.attackCooldown=.3;
    let targets=0;
    for(const e of game.enemies){
      if(e.hp<=0||Math.hypot(e.x-player.x,(e.y-player.y)*2)>181)continue;
      if(hitEnemy(e,Math.round(7*sk()),0,.12,player.x,false,Math.sign(e.x-player.x)||player.face,false))targets++;
      if(e.hp>0){e.air=null;e.floorTime=0;e.bind=(TYPES[e.kind].boss?.8:2)*sk();e.windup=0;e.swing=0;e.followup=null;e.rush=null;}
    }
    for(let i=0;i<16;i++)game.heartBursts.push({x:player.x,y:player.y-86,angle:i*Math.PI*2/16,age:-i*.014,life:.66,radius:125+(i%4)*15,size:7+(i%3)*2});
    player.skillPose={kind:'hearts',age:0,life:.38};game.lastAttack={kind:'hearts',targets};
    AlleyAudio.hero('lower');refreshHud();return true;
  }
  function beginCharge(){
    if(!canSkill()||player.mp<SKILLS.chargeCost||player.chargeCd>0)return false;
    player.mp-=SKILLS.chargeCost;player.attack=null;player.crouch=false;player.invuln=0;player.charge={age:0,stored:0,raw:0,hits:0,dir:player.face};refreshHud();return true;
  }
  function releaseCharge(){
    const c=player.charge;if(!c||game.mode!=='playing')return false;
    player.charge=null;player.chargeCd=SKILLS.chargeCooldown;player.attackCooldown=.48;player.stun=.22;player.skillPose={kind:'release',age:0,life:.48,dir:c.dir};
    const stored=Math.min(SKILLS.maxStored,c.stored),damage=Math.round((8+stored*2.5)*sk()),radius=155+Math.min(100,stored);let targets=0;
    for(const e of game.enemies){if(e.hp<=0||Math.abs(e.x-player.x)>radius||Math.abs(e.y-player.y)>95)continue;
      const dir=Math.sign(e.x-player.x)||c.dir;
      if(hitEnemy(e,damage,150+stored,.95,player.x,stored>=30,dir,true)){targets++;if(e.hp>0&&!TYPES[e.kind].boss)launchEnemy(e,dir,170+stored);}
    }
    // A release clears nearby incoming rounds, leaving space for a counterattack.
    game.projectiles=game.projectiles.filter(p=>Math.hypot(p.x-player.x,p.y-player.y+110)>radius);
    game.skillRings.push({kind:'release',x:player.x,y:player.y,age:0,life:.65,radius});game.lastAttack={kind:'charge',stored,damage,targets,held:c.age};
    game.shake=Math.max(game.shake,Math.min(14,5+stored*.12));game.freeze=.06;player.invuln=Math.max(player.invuln,.35);
    comicPop(player.x+c.dir*88,player.y-95,stored>=30?'bigBang':'thud',{size:stored>=30?132:85,life:.46});AlleyAudio.hero('slam');AlleyAudio.cartoon('boss');refreshHud();return true;
  }
  function cancelCharge(){if(player.charge){player.charge=null;player.chargeCd=SKILLS.chargeCooldown;}input.charge=false;}
  function updateSkills(dt){
    if((player.cardGuard>0||player.cardDef>0||player.cardSpd>0)&&Math.random()<dt*6)particle(player.x+(Math.random()-.5)*60,player.y-60-Math.random()*110,player.cardGuard>0?'◇':player.cardSpd>0?'»':'✦',player.cardGuard>0?'#bbfff4':player.cardSpd>0?'#ffe38a':'#ffb3d1',22);
    player.climaxT=Math.max(0,player.climaxT-dt);player.climaxCd=Math.max(0,player.climaxCd-dt);if(player.climaxT>0&&Math.random()<dt*10)particle(player.x+(Math.random()-.5)*70,player.y-50-Math.random()*130,Math.random()<.5?'♥':'✦','#ff9fc8',24);
    player.cardGuard=Math.max(0,player.cardGuard-dt);player.cardDef=Math.max(0,player.cardDef-dt);player.cardSpd=Math.max(0,player.cardSpd-dt);player.hasteT=Math.max(0,(player.hasteT||0)-dt);
    player.dazeT=Math.max(0,(player.dazeT||0)-dt);
    for(const e of game.enemies){if(e.vulnT>0)e.vulnT-=dt;if(e.hp>0&&e.bind>0&&Math.random()<dt*9)particle(e.x+(Math.random()-.5)*50,e.y-60-Math.random()*100,Math.random()<.5?'♥':'⚡','#ffd0e6',22);}
    if(game.cardQ&&game.cardQ.length){for(const q of game.cardQ)q.t-=dt;const due=game.cardQ.filter(q=>q.t<=0);game.cardQ=game.cardQ.filter(q=>q.t>0);for(const q of due)q.fn();}
    player.pushCd=Math.max(0,player.pushCd-dt);player.chargeCd=Math.max(0,player.chargeCd-dt);
    if(player.charge){player.charge.age=Math.min(SKILLS.maxCharge,player.charge.age+dt);if(player.charge.age>=SKILLS.maxCharge-1e-6)releaseCharge();}
    else player.mp=Math.min(player.maxMp,player.mp+4*dt*(1+.03*ST('개방성')));
    if(player.skillPose){player.skillPose.age+=dt;if(player.skillPose.age>=player.skillPose.life)player.skillPose=null;}
    for(const r of game.skillRings)r.age+=dt;game.skillRings=game.skillRings.filter(r=>r.age<r.life);
    for(const h of game.heartBursts)h.age+=dt;game.heartBursts=game.heartBursts.filter(h=>h.age<h.life);
    refreshSkillHud();
  }
  function refreshSkillHud(){
    $('mpFill').style.width=(100*player.mp/player.maxMp)+'%';$('mpText').textContent='M '+Math.floor(player.mp);
    $('pushSkill').classList.toggle('unavailable',player.mp<SKILLS.pushCost||player.pushCd>0);
    $('chargeSkill').classList.toggle('unavailable',player.mp<SKILLS.chargeCost&&!player.charge||player.chargeCd>0);
    $('pushSkill').style.setProperty('--cool',Math.round(player.pushCd/SKILLS.pushCooldown*100)+'%');
    $('chargeSkill').style.setProperty('--cool',Math.round(player.chargeCd/SKILLS.chargeCooldown*100)+'%');
    $('chargeSkill').classList.toggle('charging',!!player.charge);
  }
  function tinyHeart(x,y,size,alpha=1){
    ctx.save();ctx.translate(x,y);ctx.scale(size/12,size/12);ctx.globalAlpha*=alpha;ctx.fillStyle='#f875b1';ctx.strokeStyle='#fff1f5';ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(0,6);ctx.bezierCurveTo(-13,-2,-7,-12,0,-5);ctx.bezierCurveTo(7,-12,13,-2,0,6);ctx.fill();ctx.stroke();ctx.restore();
  }
  function drawSkillArt(){
    for(const h of game.heartBursts){if(h.age<0)continue;const t=h.age/h.life,d=h.radius*Math.sin(Math.min(1,t/.7)*Math.PI/2),x=h.x-game.camera+Math.cos(h.angle)*d,y=h.y+Math.sin(h.angle)*d*.55;
      if(t<.72)tinyHeart(x,y,h.size,Math.min(1,t*12));
      else {ctx.save();ctx.strokeStyle='#ffabd0';ctx.globalAlpha=(1-t)/.28;ctx.lineWidth=1.5;for(let i=0;i<4;i++){const a=i*Math.PI/2;ctx.beginPath();ctx.moveTo(x+Math.cos(a)*4,y+Math.sin(a)*4);ctx.lineTo(x+Math.cos(a)*(7+12*(t-.72)),y+Math.sin(a)*(7+12*(t-.72)));ctx.stroke();}ctx.restore();}
    }
    for(const e of game.enemies){if(e.hp<=0||e.bind<=0)continue;for(let j=0;j<3;j++)tinyHeart(e.x-game.camera+Math.cos(game.elapsed*3+j*2.1)*21,e.y-TYPES[e.kind].drawH-12+Math.sin(game.elapsed*4+j)*5,5,.8);}

    for(const r of game.skillRings){const t=r.age/r.life,rad=25+(r.radius-25)*(1-(1-t)**3);ctx.save();ctx.translate(r.x-game.camera,r.y-35*t);ctx.globalAlpha=(1-t)*.9;ctx.strokeStyle=r.kind==='push'?'#c1fff1':'#ff9cca';ctx.lineWidth=8*(1-t)+1;ctx.beginPath();ctx.ellipse(0,-10,rad,rad*.38,0,0,Math.PI*2);ctx.stroke();ctx.strokeStyle='#fff2ce';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(0,-10,rad*.8,rad*.27,0,0,Math.PI*2);ctx.stroke();ctx.restore();}
    const c=player.charge;if(!c)return;const x=player.x-game.camera,y=player.y-57,ratio=c.age/3,power=c.stored/100;
    ctx.save();ctx.translate(x,y);ctx.lineCap='round';
    ctx.strokeStyle='#604657b0';ctx.lineWidth=7;ctx.beginPath();ctx.ellipse(0,24,48,17,0,0,Math.PI*2);ctx.stroke();ctx.strokeStyle='#fba3ca';ctx.beginPath();ctx.ellipse(0,24,48,17,0,-Math.PI/2,-Math.PI/2+Math.PI*2*ratio);ctx.stroke();
    for(let i=0;i<3;i++){ctx.fillStyle=c.age>=i+1?'#fff2b0':'#ffffff55';ctx.beginPath();ctx.arc((i-1)*13,-124,3.6,0,Math.PI*2);ctx.fill();}
    ctx.globalAlpha=.5+power*.4;ctx.strokeStyle='#ffce8e';ctx.lineWidth=2+power*2;ctx.beginPath();ctx.arc(c.dir*29,-31,15+power*25,0,Math.PI*2);ctx.stroke();ctx.restore();
  }

  function refreshDopa(){const f=$('dpFill');if(!f)return;f.style.width=Math.max(0,Math.min(100,player.dopa||0))+'%';$('dpTrack').classList.toggle('full',(player.dopa||0)>=80||player.climaxT>0);$('dpText').textContent=player.climaxT>0?'절정!':'도파민';}
  function addDopa(v){if(player.climaxT>0||player.climaxCd>0||player.hp<=0||game.mode!=='playing')return;player.dopa=Math.min(100,(player.dopa||0)+v);if(player.dopa>=100)climax();refreshDopa();}
  function climax(){
    player.dopa=0;player.climaxT=6;player.climaxCd=8;player.invuln=Math.max(player.invuln,1.6);player.mp=player.maxMp;player.pushCd=0;player.chargeCd=0;
    player.hp=Math.min(player.maxHp,player.hp+player.maxHp*.12);game.freeze=Math.max(game.freeze,.35);game.shake=Math.max(game.shake,16);vib();AlleyAudio.cartoon('boss');AlleyAudio.hero('slam');
    particle(player.x,player.y-185,'절정!!','#ffb3d1',46);for(let i=0;i<18;i++)particle(player.x+(Math.random()-.5)*130,player.y-30-Math.random()*170,['♥','✦','✧'][i%3],'#ff9fc8',24+Math.random()*10);
    const f=$('climaxFlash');if(f){f.classList.remove('go');void f.offsetWidth;f.classList.add('go');}
    for(let i=0;i<20;i++)game.heartBursts.push({x:player.x,y:player.y-86,angle:i*Math.PI*2/20,age:-i*.012,life:.7,radius:140+(i%4)*18,size:8+(i%3)*2});
    for(const e of game.enemies){if(e.hp<=0||Math.abs(e.x-player.x)>560)continue;e.invuln=0;const dir=Math.sign(e.x-player.x)||player.face,b=!!TYPES[e.kind].boss;hitEnemy(e,Math.max(5,Math.ceil(e.maxHp*(b?.08:.55))),160,.7,player.x,true,dir,true);if(e.hp>0&&!b)launchEnemy(e,dir,170);}
    refreshHud();
  }
  function useCard(card){
    if(!card||game.mode!=='playing'||player.grab||player.hp<=0)return false;
    const g=BELT_G[card.grade]||1,P=BELT_POW,near=()=>game.enemies.filter(e=>e.hp>0&&Math.abs(e.x-player.x)<540),boss=e=>!!TYPES[e.kind].boss;
    game.shake=Math.max(game.shake,10);vib();AlleyAudio.cartoon('boss');
    const sparkle=(col,labels)=>{for(let i=0;i<16;i++)particle(player.x+(Math.random()-.5)*110,player.y-40-Math.random()*150,labels[i%labels.length],col,22+Math.random()*10);};
    for(const o of card.ops){const n=o.n||0;
      if(o.op==='dmg'){
        for(let k=0;k<3;k++)game.cardQ.push({t:k*.22,fn:()=>{for(const e of near()){e.invuln=0;const dir=Math.sign(e.x-player.x)||player.face,fr=boss(e)?P.boss(n,g):P.dmg(n,g),amt=Math.max(4,Math.ceil(e.maxHp*fr/3));hitEnemy(e,amt,70,.3,player.x,k===2,dir,k===2);if(e.hp>0)comicPop(e.x,e.y-60,k===2?'bigBang':'thud',{size:k===2?110:75,life:.34});particle(e.x,e.y-100,['퍼!','버!','벅!'][k],'#fff6bd',34);}game.shake=Math.max(game.shake,12);game.freeze=Math.max(game.freeze,.05);vib();AlleyAudio.impact(true,'');}});}
      else if(o.op==='heal'){const v=Math.round(player.maxHp*P.heal(n,g));player.hp=Math.min(player.maxHp,player.hp+v);sparkle('#a8f0c6',['✦','♥','✧','샤라랑']);particle(player.x,player.y-170,'♥ +'+v,'#a8f0c6',32);}
      else if(o.op==='hpLoss'){player.hp=Math.max(1,player.hp-n);}
      else if(o.op==='block'){player.cardGuard=Math.max(player.cardGuard,P.guard(n,g));sparkle('#bbfff4',['◇','✧']);}
      else if(o.op==='tight'){player.cardDef=Math.max(player.cardDef,P.def(n,g));}
      else if(o.op==='lube'){player.cardSpd=Math.max(player.cardSpd,P.spd(n,g));}
      else if(o.op==='draw'){player.pushCd=0;player.chargeCd=0;}
      else if(o.op==='dopa'){addDopa(P.dopa(n,g));sparkle('#ffb3d1',['✦','♥']);}
      else if(o.op==='energy'){player.mp=Math.min(player.maxMp,player.mp+n*15);}
      else if(o.op==='overclock'){player.mp=player.maxMp;player.pushCd=0;player.chargeCd=0;player.cardGuard=Math.max(player.cardGuard,3);}
      else if(o.op==='weak'||o.op==='enemyStrDown'){for(const e of near())e.powerDown=Math.max(e.powerDown||0,P.debuff(n,g));}
      else if(o.op==='vuln'){for(const e of near())e.vulnT=P.debuff(n,g);}
      else if(o.op==='disgust'){for(const e of near()){e.stun=Math.max(e.stun,boss(e)?1.5:P.stun(n,g));e.windup=0;e.swing=0;e.followup=null;e.rush=null;}}
      else if(o.op==='bind'){for(const e of near()){e.bind=boss(e)?1.5:P.bind(n,g);e.windup=0;e.swing=0;e.followup=null;e.rush=null;}}
    }
    wallet.hp=player.hp;wallet.mp=player.mp;refreshHud();return true;
  }
  function finish(won){
    if(hasReported)return;releaseGrab(false);clearInput();game.mode=won?'won':'lost';hasReported=true;AlleyAudio.pause();AlleyAudio.effect(won?'victory':'defeat',.38);
    DetectiveApp.result({won,stage:activeStage,hp:player.hp,mp:player.mp,arrests:game.arrests,elapsed:game.elapsed});
    $('resultKicker').textContent='';
    $('resultTitle').textContent=won?'체포 완료':'잠깐 휴식';
    $('resultDesc').textContent=`${game.arrests}명 · ${clock(game.elapsed)}`+(won&&wallet.lastReward?` · 카드 획득: ${wallet.lastReward}`:'')+(!won?' · 체력 +30 · 복종도 +1':'');
    $('restart').textContent=won?'지도':'재도전';
    $('resultReturn').classList.toggle('hidden',won);
    $('restart').onclick=()=>{if(won)returnToCity();else reset(activeStage,wallet.checkpoint[activeStage]||0);};
    refreshHud();
    if(window.BeltStory)BeltStory.play(BeltStory.key(won?'win':'lose',storyContext(lastStoryBoss)),storyContext(lastStoryBoss),()=>showPanel($result));
    else showPanel($result);
  }

  function moveVector(){
    let dx=joystick.x,dy=joystick.y;
    if(held.has('ArrowLeft')||held.has('KeyA'))dx-=1;
    if(held.has('ArrowRight')||held.has('KeyD'))dx+=1;
    if(held.has('ArrowUp')||held.has('KeyW'))dy-=1;
    if(held.has('ArrowDown')||held.has('KeyS'))dy+=1;
    const n=Math.hypot(dx,dy);return n>1?[dx/n,dy/n]:[dx,dy];
  }
  function update(dt){
    if(toastTimer>0){toastTimer-=dt;if(toastTimer<=0)$('toast').classList.remove('show');}
    if(game.mode!=='playing')return;
    // The grab cut-in has its own clock; battle state stays exactly paused.
    if(player.grab){updateGrab(dt);return;}
    // Short hit-stop makes every successful strike readable; the landing slam
    // holds the whole stage slightly longer for a comic 'THUD!' impact.
    if(game.freeze>0){game.freeze=Math.max(0,game.freeze-dt);game.shake=Math.max(0,game.shake-dt*21);return;}
    game.elapsed+=dt;updateSkills(dt);player.invuln=Math.max(0,player.invuln-dt);player.hurt=Math.max(0,player.hurt-dt);
    player.stun=Math.max(0,player.stun-dt);player.attackCooldown=Math.max(0,player.attackCooldown-dt*(player.hasteT>0?1.5:1));updateProps(dt);
    const oldSkillSec=Math.ceil(player.skillCooldown);player.skillCooldown=Math.max(0,player.skillCooldown-dt);
    if(Math.ceil(player.skillCooldown)!==oldSkillSec)refreshHud();
    player.comboTime=Math.max(0,player.comboTime-dt);if(player.comboTime===0&&player.combo!==0){player.combo=0;refreshHud();}
    game.shake=Math.max(0,game.shake-dt*21);game.freeze=Math.max(0,game.freeze-dt);
    if(player.dashLink){player.dashLink.life-=dt;if(player.dashLink.life<=0||player.stun>0||input.crouch)player.dashLink=null;}
    player.grabCd=Math.max(0,(player.grabCd||0)-dt);updateGrab(dt);
    updateCrouch(dt);
    player.dashCd=Math.max(0,(player.dashCd||0)-dt);
    if(input.dash){input.dash=false;dash();}
    if(input.jump){input.jump=false;jump();}
    if(input.skill){input.skill=false;pushSkill();}
    if(input.punch||queuedAttack.punch>0){if(attack('punch',queuedAttack.punch>0))queuedAttack.punch=0;}
    if(input.kick||queuedAttack.kick>0){if(attack('kick',queuedAttack.kick>0))queuedAttack.kick=0;}
    queuedAttack.punch=Math.max(0,queuedAttack.punch-dt);queuedAttack.kick=Math.max(0,queuedAttack.kick-dt);
    if(input.skill){input.skill=false;useCard();}
    if(player.attack){const a=player.attack,move=moves[a.kind];a.age+=dt*(player.hasteT>0?1.5:1);
      if(move.spin){
        if(!a.hit&&a.age>=move.dur*move.impact){a.hit=true;resolveAttack(a,false);}
        if(!a.spinFinal&&a.age>=move.dur*.72){a.spinFinal=true;resolveAttack(a,true);}
      }else if(!move.setup&&!a.hit&&a.age>=move.dur*move.impact){a.hit=true;resolveAttack(a);}
      if(a.age>=move.dur){if(['headbutt','split'].includes(a.kind)){player.crouchHold=Math.max(player.crouchHold||0,.22);player.crouchBlend=1;}player.attack=null;}}
    if(player.jump){
      player.jump.age+=dt;
      const t=clamp(player.jump.age/player.jump.duration,0,1);
      player.jumpZ=Math.sin(t*Math.PI)*104;
      if(t>=1){player.jump=null;player.jumpZ=0;}
    }
    if(player.slam){
      player.slam.age+=dt;
      if(player.slam.phase==='dive'){
        player.jumpZ=Math.max(0,player.jumpZ-slamMove.dropSpeed*dt);
        if(player.jumpZ===0)landSlam();
      }else{
        player.slam.recovery+=dt;
        if(player.slam.recovery>=slamMove.recovery)player.slam=null;
      }
    }
    if(player.splash){
      const b=player.splash;b.age+=dt;const t=clamp(b.age/.46,0,1);
      const limit=game.waveLive?game.zones[game.zone].end-35:WORLD_W-80;
      player.x=clamp(b.fromX+b.dir*174*(1-(1-t)**2),Math.max(45,game.zones[Math.max(0,game.zone-1)].start+35),limit);
      player.face=b.dir;player.jumpZ=t<1?Math.max(0,b.lift*(1-t)+30*Math.sin(Math.PI*t)):0;
      if(!b.hit&&b.age>=.10&&b.age<=.46){
        const e=game.enemies.filter(e=>e.hp>0&&(e.x-player.x)*b.dir>=-18&&(e.x-player.x)*b.dir<98&&Math.abs(e.y-player.y)<64).sort((a,b)=>Math.abs(a.x-player.x)-Math.abs(b.x-player.x))[0];
        if(e&&hitEnemy(e,24,96,.6,player.x,false,b.dir,true)){b.hit=true;game.lastAttack={kind:'splash',dir:b.dir,targets:1};AlleyAudio.impact(true,e.kind);}
      }
      if(t>=1&&!b.landed){b.landed=true;player.stun=Math.max(player.stun,.28);game.lastAttack={kind:'splash',dir:b.dir,targets:b.hit?1:0};comicPop(player.x+b.dir*26,player.y-23,'thud',{size:60,life:.28});}
      if(b.age>=.76){player.splash=null;player.jumpZ=0;}
    }
    if(player.down){
      player.down.age+=dt;
      const p=clamp(player.down.age/player.down.duration,0,1);
      const target=player.down.kind==='explosion'?155:23;
      const travel=target*(1-Math.pow(1-p,2));
      const fallLimit=game.waveLive?game.zones[game.zone].end-35:WORLD_W-60;
      player.x=clamp(player.x+player.down.dir*(travel-player.down.travelled),45,fallLimit);
      player.down.travelled=travel;
      // Rozie becomes a harmless-looking but very heavy paper doll in flight.
      // Enemies she tumbles into take a little collision damage too.
      for(const e of game.enemies){
        if(e.hp<=0||e.air||e.floorTime>0||player.down.hitIds.has(e.id))continue;
        if(Math.abs(e.x-player.x)>63||Math.abs(e.y-player.y)>50)continue;
        player.down.hitIds.add(e.id);
        e.hp=Math.max(0,e.hp-(player.down.kind==='explosion'?7:4));
        e.hurt=.24;e.invuln=.20;e.windup=0;
        if(e.hp===0)defeatEnemy(e,player.down.dir);
        else if(Math.random()<.28)launchEnemy(e,player.down.dir,75);
        particle(e.x,e.y-116,'퍽!','#ffedbb',24);
      }
      if(p>=1){comicPop(player.x,player.y-64,'thud',{size:87,life:.48});player.down=null;player.stun=0;}
    }
    const dashing=!!(player.dash||player.dashFollow);
    if(player.dash){const d=player.dash;d.age=Math.min(d.duration,d.age+dt);const t=d.age/d.duration,q=1-(1-t)**2;
      const lo=Math.max(55,game.zones[Math.max(0,game.zone-1)].start+35),hi=game.waveLive?game.zones[game.zone].end-35:WORLD_W-80;
      player.x=clamp(d.fromX+d.dx*160*q,lo,hi);player.y=clamp(d.fromY+d.dy*96*q,Y_MIN,Y_MAX);player.face=d.dir;
      if(d.age>=d.duration){player.dash=null;player.dashLink={dx:d.dx,dy:d.dy,dir:d.dir,life:.16};}
    }
    if(player.dashFollow){const d=player.dashFollow;d.age=Math.min(d.duration,d.age+dt);const t=d.age/d.duration,q=1-(1-t)**2;
      const lo=Math.max(55,game.zones[Math.max(0,game.zone-1)].start+35),hi=game.waveLive?game.zones[game.zone].end-35:WORLD_W-80;
      player.x=clamp(d.fromX+d.dx*d.distance*q,lo,hi);player.y=clamp(d.fromY+d.dy*d.distance*.6*q,Y_MIN,Y_MAX);player.face=d.dir;
      if(d.age>=d.duration)player.dashFollow=null;
    }
    if(player.attack&&moves[player.attack.kind].setup)resolveDashSetup(player.attack);
    refreshDashHud();
    AlleyAudio.tick();
    const [dx,dy]=moveVector();if(dx!==0&&!dashing&&!player.down&&!player.slam&&!player.splash&&!player.charge)player.face=Math.sign(dx);
    syncCrouch();
    // Only the actual, visible stage boundary is closed during a live wave.
    // The old end-105 limit stranded Rozie while ranged enemies kept moving.
    if(player.stun===0&&!player.grab&&!dashing&&!(player.attack&&(moves[player.attack.kind].bothSides||moves[player.attack.kind].setup))&&player.attack?.kind!=='headbutt'&&!player.crouch&&!player.slam&&!player.splash&&!player.charge){const limit=game.waveLive?game.zones[game.zone].end-35:WORLD_W-80;
      player.x=clamp(player.x+dx*216*dt*(player.cardSpd>0?1.5:1),Math.max(55,game.zones[Math.max(0,game.zone-1)].start+35),limit);
      player.y=clamp(player.y+dy*169*dt*(player.cardSpd>0?1.5:1),Y_MIN,Y_MAX);
    }
    updateEnemyFlights(dt);
    updateEnemyExits(dt);
    updateBossPressure(dt);updateReinforcements(dt);
    for(const e of game.enemies){
      if(e.hp<=0)continue;
      if(e.holdingPlayer){e.walking=false;continue;}
      if(e.entry>0){e.entry=Math.max(0,e.entry-dt);continue;}
      const previousX=e.x,previousY=e.y;
      e.walking=false;e.motionPhase=(e.motionPhase||0)+dt*1.6;
      e.invuln=Math.max(0,e.invuln-dt);e.hurt=Math.max(0,e.hurt-dt);e.stun=Math.max(0,e.stun-dt);e.staggerResist=Math.max(0,e.staggerResist-dt);e.bind=Math.max(0,e.bind-dt);e.powerDown=Math.max(0,e.powerDown-dt);
      if(e.setupPush){const k=e.setupPush;k.age=Math.min(k.duration,k.age+dt);const t=k.age/k.duration,z=game.zones[game.zone];e.x=clamp(k.fromX+k.dir*k.distance*(1-(1-t)**2),z.start+55,z.end-60);if(k.age>=k.duration)e.setupPush=null;}
      const actionDt=dt*enemyActionRate(e.kind);
      e.attackCd=Math.max(0,e.attackCd-actionDt);e.swing=Math.max(0,e.swing-actionDt);
      if(e.air||e.floorTime>0||e.bind>0||e.stun>0){e.dive=null;e.rush=null;e.spinRush=null;e.followup=null;e.strikes=null;continue;}
      if(e.dive){const d=e.dive;d.age+=actionDt;const t=clamp(d.age/d.duration,0,1);
        e.x=clamp(d.fromX+d.dir*d.distance*t,game.zones[game.zone].start+55,game.zones[game.zone].end-60);e.face=d.dir;
        if(!d.hit&&t>.16&&Math.abs(player.x-e.x)<64&&Math.abs(player.y-e.y)<72){d.hit=true;hurtPlayer(e);}
        if(t>=1){e.dive=null;e.swing=0;e.attackCd=Math.max(e.attackCd,.9);}continue;
      }
      if(e.strikes){
        for(const hit of e.strikes){hit.time-=actionDt;if(hit.time<=0&&!hit.done){hit.done=true;const front=(player.x-e.x)*hit.dir;if(front>=-12&&front<TYPES[e.kind].reach+8&&Math.abs(player.y-e.y)<72)hurtPlayer(e);}}
        if(e.strikes&&e.strikes.every(hit=>hit.done))e.strikes=null;
      }
      if(e.followup){e.followup.time-=actionDt;if(e.followup.time<=0){const dir=e.followup.dir;e.followup=null;e.face=dir;e.swing=.44;e.swingStyle='shock';if((player.x-e.x)*dir>=-12&&Math.abs(player.x-e.x)<TYPES[e.kind].reach&&Math.abs(player.y-e.y)<72)hurtPlayer(e);}}
      if(e.rush){const r=e.rush;r.age+=actionDt;const t=clamp(r.age/r.duration,0,1);e.x=clamp(r.fromX+r.dir*r.distance*t,game.zones[game.zone].start+55,game.zones[game.zone].end-70);e.face=r.dir;e.walking=true;
        if(!r.hit&&Math.abs(player.x-e.x)<105&&Math.abs(player.y-e.y)<76){r.hit=true;damagePlayer(TYPES[e.kind].attack,e.x,'heavy');}
        if(t>=1){e.rush=null;e.attackCd=1.7;}continue;
      }
      if(e.spinRush){const r=e.spinRush;r.age+=actionDt;const t=clamp(r.age/r.duration,0,1),z=game.zones[game.zone];
        e.x=clamp(r.fromX+r.dir*r.distance*t,z.start+55,z.end-60);e.y=clamp(r.fromY+(r.targetY-r.fromY)*t,Y_MIN,Y_MAX);e.face=r.dir;e.swing=Math.max(e.swing,.08);
        if(!r.hit&&Math.abs(player.x-e.x)<TYPES[e.kind].reach&&Math.abs(player.y-e.y)<80){r.hit=true;hurtPlayer(e);}
        if(t>=1){e.spinRush=null;e.swing=0;}continue;
      }
      if(e.closeWind>0||e.barrageWind>0||e.volley>0){e.walking=false;continue;}
      const deltaX=player.x-e.x,deltaY=player.y-e.y,dist=Math.hypot(deltaX,deltaY*1.35);
      // Face the target at the start of an attack, then commit to that
      // direction through the warning. Players can dodge behind the whip.
      if(Math.abs(deltaX)>3&&e.windup<=0&&e.swing<=0&&!e.followup)e.face=Math.sign(deltaX);
      const def=TYPES[e.kind];if(e.kind==='clubBoss'&&e.windup<=0&&e.attackCd<=0){const cycle=e.hp/e.maxHp<.5?['whip','bullet','rush','bullet']:['whip','bullet','rush'];e.bossStyle=cycle[(e.pattern||0)%cycle.length];}const style=enemyAttackStyle(e,dist);
      if(e.windup>0){
        e.windup-=actionDt;
        if(e.windup<=0){
          const released=e.windupStyle;AlleyAudio.weapon(released);e.swing=released==='whirlwind'?.72:released==='whip'?.66:released==='paddle'?.58:.55;
          e.swingStyle=released;e.attackBeat=(e.attackBeat||0)+1;
          e.attackCd=def.interval+Math.random()*.28;
          if(e.kind==='boxer'||e.kind==='clubPunk')e.x=clamp(e.x+e.face*24,45,WORLD_W-45);
          if(e.kind==='paddleBrute')e.x=clamp(e.x+e.face*15,45,WORLD_W-45);
          if(e.kind==='whip')comicPop(e.x+e.face*105,e.y-def.drawH*.58,'arc',
            {size:151,life:.31,dir:e.face,behind:true,spin:e.face*.14});
          if(released==='bullet'||released==='dagger')comicPop(e.x+e.face*67,e.y-def.drawH*.69,
            released==='bullet'?'flare':'speed',{size:released==='bullet'?90:78,life:.23,dir:e.face,behind:true});

          if(released==='paddle')comicPop(e.x+e.face*114,e.y-def.drawH*.58,'swat',
            {size:90,life:.29,dir:e.face});
          if(regionalAttack(e,released)){}else if(released==='rush'){
            e.rush={age:0,duration:.68,dir:e.face,fromX:e.x,distance:Math.min(270,Math.abs(player.x-e.x)+45),hit:false};
          }else if(released==='shock'){
            e.x=clamp(e.x+e.face*25,game.zones[game.zone].start+55,game.zones[game.zone].end-65);
            if((player.x-e.x)*e.face>=-12&&Math.abs(player.x-e.x)<def.reach&&Math.abs(deltaY)<72)hurtPlayer(e);
            e.followup={time:.42,dir:e.face};
          }else if(released==='sweep'||released==='whirlwind'){
            e.swing=.72;e.spinRush={age:0,duration:.72,dir:e.face,fromX:e.x,fromY:e.y,targetY:player.y,distance:Math.min(260,Math.abs(player.x-e.x)+25),hit:false};
          }else if(['flame','rocket','grenade','dagger','bullet'].includes(released))throwEnemyProjectile(e,released);
          else if(released==='whip'){
            // A broad frontal sweep, not a one-pixel punch: readable warning,
            // then one hit. The backward half-plane remains safe.
            const front=(player.x-e.x)*e.face;
            if(front>=-12&&front<def.reach&&Math.abs(deltaY)<92)hurtPlayer(e);
          }else if(meleeProps[e.kind]){
            const duration=released==='paddle'?.58:.55,first=duration*(.45-.3)/.7;
            e.strikes=(meleeProps[e.kind].kind==='fist'?[first,first+.24]:[first]).map(time=>({time,dir:e.face,done:false}));
          }else if((released==='whirlwind'||(player.x-e.x)*e.face>=-12)&&Math.abs(player.x-e.x)<def.reach+(released==='whirlwind'?38:8)&&Math.abs(deltaY)<(released==='whirlwind'?80:72))hurtPlayer(e);
        }
      } else if(e.swing<=0) {
        const ranged=isRangedStyle(style);
        const reach=enemyReach(e,style);
        const inLine=Math.abs(deltaY)<(ranged?155:['dive','rush','sweep','whirlwind'].includes(style)?100:style==='whip'?92:72);
        // Each enemy acts independently; no global queue makes the others watch.
        const canAttack=!e.followup&&!e.strikes;
        if(e.attackCd<=0&&dist<reach&&inLine&&canAttack){
          e.windupStyle=style;e.windup=def.telegraph;if(def.regional){e.pattern=(e.pattern||0)+1;if(e.kind==='studentBoss'&&e.hp<e.maxHp*.5)e.windup*=.88;}if(e.kind==='clubBoss'){e.pattern=(e.pattern||0)+1;e.windup=style==='rush'?1.25:style==='bullet'?1.05:.95;}
          if(style==='whip'&&Math.random()<.60)comicBubble(e,'주인님 명령이에요!');
        }else{
          // Approach in staggered lanes; ranged types hold their own distance.
          const gap=ranged?Math.min(def.keep||def.spacing,reach*.7):Math.min(def.spacing,def.reach*.65),spacingError=Math.abs(deltaX)-gap;
          const burst=['punk','clubPunk'].includes(e.kind)?1+.26*Math.max(0,Math.sin(game.elapsed*8+e.id)):1;
          const speed=def.speed*(def.boss?1.4:1.25);
          const staccato=['boxer','clubPunk'].includes(e.kind)?(Math.sin(game.elapsed*7.5+e.id)>.1?1.3:.75):1;
          if(spacingError>12)e.x+=Math.sign(deltaX)*speed*burst*staccato*dt;
          else if(spacingError< -25)e.x-=Math.sign(deltaX)*speed*dt*(ranged?.65:.16);
          const sideStep=e.kind==='breaker'?Math.sin(game.elapsed*3.3+e.id)*43:e.kind==='hippie'?Math.sin(game.elapsed*2.7+e.id)*29:
            e.kind==='goth'?Math.sin(game.elapsed*1.8+e.id)*15:0;
          const desiredY=clamp(player.y+(e.slotY||0)*.3+sideStep*.55,Y_MIN,Y_MAX);
          const laneError=desiredY-e.y;
          if(Math.abs(laneError)>9)e.y+=Math.sign(laneError)*Math.min(Math.abs(laneError),speed*.95*dt);
          e.y=clamp(e.y,Y_MIN,Y_MAX);
        }
        // Keep paper-doll silhouettes from piling up into one solid wall.
        for(const other of game.enemies){
          if(other===e||other.hp<=0)continue;
          const sx=e.x-other.x,sy=e.y-other.y;
          if(Math.abs(sx)>56||Math.abs(sy)>32)continue;
          const dir=Math.sign(sx)||(e.id>other.id?1:-1);
          e.x=clamp(e.x+dir*(56-Math.abs(sx))*.043,45,WORLD_W-45);
          e.y=clamp(e.y+(Math.sign(sy)||(e.id>other.id?1:-1))*(32-Math.abs(sy))*.023,Y_MIN,Y_MAX);
        }
      }
      const arena=game.zones[game.zone];e.x=clamp(e.x,arena.start+55,arena.end-60);
      e.walking=Math.hypot(e.x-previousX,e.y-previousY)>.30;
      if(e.walking)e.walkDistance=(e.walkDistance||0)+Math.hypot(e.x-previousX,e.y-previousY);
      if(e.walking)e.motionPhase+=dt*(e.kind==='punk'?10:e.kind==='boxer'?5.5:e.kind==='hippie'?7.8:6.7);
    }
    updateCombatArt(dt);updateRegional(dt);
    for(const p of game.projectiles){
      p.age+=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;
      const visibleY=regionalVisibleY(p);
      const targetY=player.y-108,impact=Math.abs(p.x-player.x)<(p.kind==='person'?58:p.kind==='grenade'?45:36)&&Math.abs(visibleY-targetY)<(p.kind==='person'?65:52)&&(!p.lane||Math.abs(p.lane-player.y)<60);
      const expired=p.age>=p.ttl;
      if(!impact&&!expired)continue;
      if(impact||p.kind==='grenade'&&Math.abs(p.x-player.x)<95&&Math.abs(p.y-targetY)<100){
        damagePlayer(p.damage,p.sourceX,['rocket','grenade'].includes(p.kind)?'explosion':p.kind==='person'?'heavy':'normal');
      }
      regionalProjectileEnd(p,impact);
      if(['rocket','grenade'].includes(p.kind)){
        emitBlast(p.x,visibleY,p.kind);
        game.shockwaves.push({x:p.x,y:p.y+108,age:0,life:.40,explosion:true});
        comicPop(p.x,p.y,p.kind==='rocket'?'blast':'flare',{size:160,life:.31,behind:true});
        comicPop(p.x,p.y,p.kind==='rocket'?'bigBang':'puff',{size:p.kind==='rocket'?148:112,life:.59});
        game.shake=Math.max(game.shake,9);
      }
      if(p.kind==='flame')emitBlast(p.x,visibleY,'flame');
      p.age=p.ttl+1;
    }
    game.projectiles=game.projectiles.filter(p=>p.age<=p.ttl);
    game.enemies=game.enemies.filter(e=>e.hp>0||e.air||e.floorTime>0||e.exit&&e.exit.age<e.exit.duration);

    if(game.waveLive&&game.enemies.length===0){
      if(storyPackBosses.length){const boss=storyPackBosses[0];storyPackBosses=[];battleStory('defeated',boss);return;}
      if(packIndex<WAVES[game.zone].packs.length){spawnPack();}
      else{
        game.waveLive=false;const next=game.zone+1;
        if(next===WAVES.length){finish(true);return;}
        if(game.zone%2===1){player.hp=Math.min(player.maxHp,player.hp+12);}
        game.zone=next;toast('구간 정리 완료 · 오른쪽으로 →',1.7);refreshHud();
      }
    }else if(!game.waveLive&&game.zone<WAVES.length&&player.x>game.zones[game.zone].start+90){spawnWave(game.zone);}
    game.transition=Math.max(0,(game.transition||0)-dt);
    if(Math.floor(game.elapsed*2)!==game.lastHudTick){game.lastHudTick=Math.floor(game.elapsed*2);refreshHud();}

    // Battle framing ends at the real world edge of the arena. The player
    // can walk right up to the screen edge; no painted gate in the middle.
    const cameraEnd=game.waveLive?game.zones[game.zone].end:WORLD_W;
    game.camera+=((clamp(player.x-345,0,Math.max(0,cameraEnd-W)))-game.camera)*Math.min(1,dt*4.4);
    for(const p of game.particles){p.age+=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;}
    game.particles=game.particles.filter(p=>p.age<p.life);
    for(const d of game.decals)d.age+=dt;
    game.decals=game.decals.filter(d=>d.age<d.life);
    for(const b of game.bubbles)b.age+=dt;
    game.bubbles=game.bubbles.filter(b=>b.age<b.life);
    for(const s of game.shockwaves)s.age+=dt;
    game.shockwaves=game.shockwaves.filter(s=>s.age<s.life);
    for(const s of game.skillBursts)s.age+=dt;
    game.skillBursts=game.skillBursts.filter(s=>s.age<s.life);
  }

  function backdrop(){
    const bossZone=game.zone===WAVES.length-1;
    const info=GaiaCampaign.stages[activeStage],img=images[bossZone&&info.arena?info.arena:info.bg];
    if(!img?.naturalWidth){ctx.fillStyle='#bd8a9c';ctx.fillRect(0,0,W,H);return;}
    const tileW=H*img.naturalWidth/img.naturalHeight;
    const start=Math.floor(game.camera/tileW);
    for(let i=start;i*tileW<game.camera+W;i++){
      const x=Math.round(i*tileW-game.camera),flip=i%2!==0;
      ctx.save();ctx.translate(x+(flip?Math.ceil(tileW):0),0);ctx.scale(flip?-1:1,1);
      ctx.drawImage(img,0,0,Math.ceil(tileW)+1,H);ctx.restore();
    }
    // The two routes each use one background; the final arena alone switches
    // to the original card-game alley at its unchanged aspect ratio.
  }

  function roundRect(x,y,w,h,r){ctx.beginPath();ctx.roundRect(x,y,w,h,r);}
  // ===== 거리 진열대(부서짐) + 떨어지는 용품(먹으면 효과) — 케인 그림, 수치는 전부 [임시] =====
  // 진열대: [화면 높이(px), 부서지는 데 필요한 타격 수]. 펀치 1, 킥 2, 슬램 3.
  const OBJ_SPEC={o1_rack:[130,4],o1_mann_a:[150,3],o1_mann_b:[150,3],o1_mann_c:[150,3],o1_carousel:[150,4],o1_mirror:[150,3],o1_bunnyshelf:[140,4],o1_pegboard:[145,4],o1_tier:[140,3],o1_whiprack:[140,4],
    o2_mann_pink:[150,3],o2_mann_purple:[150,3],o2_cuffstand:[120,3],o2_carousel:[140,4],o2_paddles:[140,3],o2_blindshelf:[100,3],o2_perfume:[70,2],o2_towels:[60,2],o2_heartpillow:[66,2],o2_pawpillow:[66,2],
    o2_heartmirror:[120,3],o2_tier2:[100,3],o2_bunnystand:[100,3],o2_dome:[100,3],o2_basket:[60,2],o2_bag:[80,2],o2_pouch:[80,2]};
  // 용품: k=효과 종류, v=크기(heal=최대체력 비율, dopa=게이지, 나머지=초), t=떠오르는 이름, c=글자색
  const ITEM_SPEC={
    milk:{k:'heal',v:.22,t:'하트 우유',c:'#a8f0c6'},bra_mint:{k:'heal',v:.35,t:'민트 브라',c:'#a8f0c6'},bra_pink:{k:'heal',v:.35,t:'핑크 브라',c:'#a8f0c6'},
    vibe:{k:'dopa',v:18,t:'바이브',c:'#ffb3d1'},dildo:{k:'dopa',v:26,t:'딜도',c:'#ffb3d1'},plug:{k:'dopa',v:38,t:'플러그',c:'#ffb3d1'},
    flogger:{k:'haste',v:8,t:'채찍 · 공속↑',c:'#ffd275'},catpaddle:{k:'haste',v:8,t:'고양이 패들 · 공속↑',c:'#ffd275'},
    ears_bunny:{k:'speed',v:8,t:'토끼 귀 · 이속↑',c:'#bbfff4'},ears_cat:{k:'speed',v:8,t:'고양이 귀 · 이속↑',c:'#bbfff4'},leash:{k:'speed',v:8,t:'하트 리쉬 · 이속↑',c:'#bbfff4'},
    collar_bell:{k:'guard',v:5,t:'방울 목줄 · 피해↓',c:'#d2c3ff'},collar_pink:{k:'guard',v:5,t:'핑크 목줄 · 피해↓',c:'#d2c3ff'},collar_purple:{k:'guard',v:5,t:'보라 목줄 · 피해↓',c:'#d2c3ff'},
    cuffs_black:{k:'bind',v:2.5,t:'수갑 · 적 구속',c:'#ffffff'},cuffs_pink:{k:'bind',v:2.5,t:'핑크 수갑 · 적 구속',c:'#ffffff'},blindfold:{k:'bind',v:2.5,t:'안대 · 적 구속',c:'#ffffff'}};
  // 종류별 가중치(합 100) → 종류 안에서 무작위
  const ITEM_POOL=[[26,['milk','milk','milk','bra_mint','bra_pink']],[26,['vibe','dildo','plug']],[14,['flogger','catpaddle']],[14,['ears_bunny','ears_cat','leash']],[10,['collar_bell','collar_pink','collar_purple']],[10,['cuffs_black','cuffs_pink','blindfold']]];
  const DROP={item:.62,gold:.23}; // 나머지는 꽝
  const propImg={},pimg=n=>propImg[n]||(propImg[n]=Object.assign(new Image(),{src:'assets/props/'+n+'.webp'}));
  Object.keys(OBJ_SPEC).forEach(pimg);Object.keys(ITEM_SPEC).forEach(k=>pimg('i_'+k));
  // 한 스테이지에 5~6개만: 보스 구역을 뺀 구역들에 골고루 나눠 놓는다.
  function planBreakables(){
    const total=5+(Math.random()<.5?1:0),zs=[];
    for(let i=0;i<WAVES.length;i++)if(!WAVES[i].boss)zs.push(i);
    if(!zs.length)for(let i=0;i<WAVES.length;i++)zs.push(i);
    for(let i=zs.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[zs[i],zs[j]]=[zs[j],zs[i]];}
    const plan={};for(let k=0;k<total;k++){const z=zs[k%zs.length];plan[z]=(plan[z]||0)+1;}
    game.propPlan=plan;
  }
  function spawnBreakables(zone){
    const z=game.zones[zone];if(!z)return;
    const ids=Object.keys(OBJ_SPEC),n=(game.propPlan&&game.propPlan[zone])||0,list=[];
    for(let i=0,tries=0;i<n&&tries<60;tries++){
      const x=z.start+260+Math.random()*(z.end-z.start-520),y=Y_MIN+16+Math.random()*(Y_MAX-Y_MIN-16);
      if(list.some(b=>Math.abs(b.x-x)<260))continue;
      const id=ids[Math.floor(Math.random()*ids.length)],sp=OBJ_SPEC[id];
      list.push({id,x,y,h:sp[0],hp:sp[1],maxHp:sp[1],shake:0,flash:0});i++;
    }
    game.breakables=list;
  }
  function hitBreakables(a,cfg){
    for(const b of game.breakables||[]){
      if(b.hp<=0)continue;
      const along=(b.x-player.x)*a.dir,dy=Math.abs((b.y-player.y)*1.12);
      if(along>=cfg.near-35&&along<=cfg.reach+40&&dy<=cfg.width+14)damageBreakable(b,['kick','split','hipCrash','whirlSplit'].includes(a.kind)?2:1);
    }
  }
  function slamBreakables(){for(const b of game.breakables||[])if(b.hp>0&&Math.abs(b.x-player.x)<slamMove.radiusX+30&&Math.abs(b.y-player.y)<slamMove.radiusY+24)damageBreakable(b,3);}
  function damageBreakable(b,d){
    b.hp-=d;b.shake=.22;b.flash=.12;hap('hit');AlleyAudio.impact(false,'punk');
    for(let i=0;i<4;i++)artParticle(b.x,b.y-b.h*.5,(Math.random()-.5)*170,-60-Math.random()*90,.6,3+Math.random()*3,'heart',i%2?'#ff9fc8':'#ffd275');
    if(b.hp<=0)breakObject(b);
  }
  function breakObject(b){
    game.shake=Math.max(game.shake,6);AlleyAudio.cartoon('squash');hap('bigHit');comicPop(b.x,b.y-b.h*.55,'puff',{size:96,life:.45,dir:1});
    for(let i=0;i<18;i++){const a=i*2.4;artParticle(b.x,b.y-b.h*.45,Math.cos(a)*(60+Math.random()*120),-70-Math.random()*130,.9,3+Math.random()*4,i%3?'heart':'star',i%2?'#ff9fc8':'#ffe08a');}
    const r=Math.random();
    if(r<DROP.item)dropItem(b.x,b.y);
    else if(r<DROP.item+DROP.gold){const g=8+Math.floor(Math.random()*10);wallet.gold+=g;save();refreshHud();particle(b.x,b.y-b.h*.7,'+'+g+' G','#ffe08a',24);}
  }
  function dropItem(x,y){
    let r=Math.random()*100,pool=ITEM_POOL[0][1];for(const [w,ids] of ITEM_POOL){if(r<w){pool=ids;break;}r-=w;}
    const id=pool[Math.floor(Math.random()*pool.length)];
    (game.pickups||(game.pickups=[])).push({id,x:x+(Math.random()-.5)*34,y:clamp(y,Y_MIN,Y_MAX),z:0,vz:300,age:0});
  }
  function applyItem(id){
    const sp=ITEM_SPEC[id];if(!sp)return;let msg=sp.t;
    if(sp.k==='heal'){const v=Math.round(player.maxHp*sp.v);player.hp=Math.min(player.maxHp,player.hp+v);wallet.hp=player.hp;msg+=' +'+v;}
    else if(sp.k==='dopa')addDopa(sp.v);
    else if(sp.k==='haste')player.hasteT=Math.max(player.hasteT||0,sp.v);
    else if(sp.k==='speed')player.cardSpd=Math.max(player.cardSpd||0,sp.v);
    else if(sp.k==='guard')player.cardDef=Math.max(player.cardDef||0,sp.v);
    else if(sp.k==='bind'){for(const e of game.enemies){if(e.hp<=0||Math.abs(e.x-player.x)>560)continue;e.bind=TYPES[e.kind].boss?1.2:sp.v;e.windup=0;e.swing=0;e.followup=null;e.rush=null;}}
    particle(player.x,player.y-195,msg,sp.c,26);
    for(let i=0;i<10;i++)particle(player.x+(Math.random()-.5)*90,player.y-40-Math.random()*150,['✦','♥','✧'][i%3],sp.c,20+Math.random()*8);
    sound('card');hap('tick');refreshHud();
  }
  function updateProps(dt){
    if(game.breakables){for(const b of game.breakables){b.shake=Math.max(0,b.shake-dt);b.flash=Math.max(0,b.flash-dt);}game.breakables=game.breakables.filter(b=>b.hp>0);}
    const ps=game.pickups;if(!ps||!ps.length)return;
    for(const p of ps){p.age+=dt;if(p.z>0||p.vz>0){p.vz-=950*dt;p.z+=p.vz*dt;if(p.z<=0){p.z=0;p.vz=p.vz<-140?-p.vz*.35:0;}}}
    if(player.hp>0&&player.jumpZ<40)for(const p of ps){if(p.got||p.age<.4)continue;if(Math.abs(p.x-player.x)<50&&Math.abs(p.y-player.y)<38){p.got=true;applyItem(p.id);}}
    game.pickups=ps.filter(p=>!p.got&&p.age<22);
  }
  function drawBreakable(b){
    const x=b.x-game.camera;if(x<-220||x>W+220)return;
    const img=pimg(b.id);if(!img.naturalWidth)return;
    const h=b.h,w=h*img.naturalWidth/img.naturalHeight;
    ctx.save();ctx.translate(x+(b.shake>0?Math.sin(b.shake*90)*4:0),b.y);
    ctx.fillStyle='rgba(64,28,58,.28)';ctx.beginPath();ctx.ellipse(0,0,w*.42,6,0,0,Math.PI*2);ctx.fill();
    if(b.flash>0)ctx.filter='brightness(1.5)';
    if(b.shake>0)ctx.rotate(Math.sin(b.shake*70)*.03);
    ctx.drawImage(img,-w/2,-h,w,h);ctx.restore();
  }
  function drawPickup(p){
    const x=p.x-game.camera;if(x<-80||x>W+80)return;
    if(p.age>17&&Math.floor(p.age*7)%2)return;
    const img=pimg('i_'+p.id);if(!img.naturalWidth)return;
    const sc=54/Math.max(img.naturalWidth,img.naturalHeight),w=img.naturalWidth*sc,h=img.naturalHeight*sc,bob=p.z>0?0:Math.sin(p.age*5)*3;
    ctx.save();ctx.translate(x,p.y);
    ctx.fillStyle='rgba(64,28,58,.25)';ctx.beginPath();ctx.ellipse(0,0,w*.4,5,0,0,Math.PI*2);ctx.fill();
    const g=ctx.createRadialGradient(0,-h*.6-p.z-bob,2,0,-h*.6-p.z-bob,h*.9);g.addColorStop(0,'rgba(255,240,180,.65)');g.addColorStop(1,'rgba(255,240,180,0)');
    ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,-h*.6-p.z-bob,h*.9,0,Math.PI*2);ctx.fill();
    ctx.drawImage(img,-w/2,-h-6-p.z-bob,w,h);ctx.restore();
  }
  function drawBuffs(){
    const list=[];
    if(player.hasteT>0)list.push(['i_flogger',player.hasteT,8]);
    if(player.cardSpd>0)list.push(['i_ears_bunny',player.cardSpd,8]);
    if(player.cardDef>0)list.push(['i_collar_pink',player.cardDef,5]);
    list.forEach((b,i)=>{
      const x=22+i*50,y=126,img=pimg(b[0]);
      ctx.save();ctx.fillStyle='rgba(255,243,228,.85)';roundRect(x,y,42,44,10);ctx.fill();
      if(img.naturalWidth){const s=Math.min(32/img.naturalWidth,30/img.naturalHeight);ctx.drawImage(img,x+21-img.naturalWidth*s/2,y+3+(30-img.naturalHeight*s)/2,img.naturalWidth*s,img.naturalHeight*s);}
      ctx.fillStyle='#e88ab7';roundRect(x+4,y+37,34*clamp(b[1]/b[2],0,1),4,2);ctx.fill();ctx.restore();
    });
  }

  window.__gaiaProps={spawnWave,spawnPack,get WAVES(){return WAVES;},TYPES,worldLevel,game,player,applyItem,dropItem,damageBreakable,OBJ_SPEC,ITEM_SPEC}; // 점검용
  function drawProp(p){
    const x=p.x-game.camera;if(x<-120||x>W+120)return;
    const y=p.y;
    ctx.save();ctx.translate(x,y);ctx.globalAlpha=.94;
    const radius=p.kind==='shopRack'?52:p.kind==='mannequin'?15:21;
    ctx.save();ctx.fillStyle='rgba(64,28,58,.30)';ctx.beginPath();
    ctx.ellipse(0,0,radius,p.kind==='shopRack'?8:5,0,0,Math.PI*2);ctx.fill();ctx.restore();
    if(p.kind==='shopRack'){
      const img=images.comicShop;
      if(img?.naturalWidth)ctx.drawImage(img,p.hue?1110:0,0,p.hue?326:576,510,-63,-113,126,113);
      else{ctx.fillStyle='#e5a0c1';roundRect(-54,-105,108,105,11);ctx.fill();}
    }else if(p.kind==='mannequin'){
      const img=images.comicShop;
      const src=[581,753,927][p.hue%3];
      if(img?.naturalWidth)ctx.drawImage(img,src,0,178,540,-15,-88,30,88);
      else{ctx.fillStyle='#f5c4b7';roundRect(-11,-83,22,76,12);ctx.fill();}
    }else{
      ctx.fillStyle='#e59bca';ctx.fillRect(-24,-26,48,29);ctx.fillStyle='#71c59e';ctx.font='37px sans-serif';ctx.fillText('✿',-18,-22);
    }
    ctx.restore();
  }

// Presentation layer. Damage, movement speeds, AI schedules and map progression
// are owned by the existing game engine and deliberately stay unchanged.
  function artParticle(x,y,vx,vy,life,size,kind,color){
    (game.artParticles||(game.artParticles=[])).push({x,y,vx,vy,life,age:0,size,kind,color,angle:Math.random()*6.28,spin:(Math.random()-.5)*9});
    if(game.artParticles.length>180)game.artParticles.shift();
  }
  function emitBlast(x,y,kind='rocket'){
    (game.artBursts||(game.artBursts=[])).push({x,y,age:0,life:.56,kind});
    for(let i=0;i<18;i++){
      const a=i*Math.PI*2/18,speed=45+Math.random()*150;
      artParticle(x,y,Math.cos(a)*speed,Math.sin(a)*speed-35,.45+Math.random()*.45,2+Math.random()*4,'ember',i%3?'#ffb759':'#fff5cc');
    }
  }
  function emitExitFX(e){
    const style=EXIT_BY_KIND[e.kind];
    for(let i=0;i<(TYPES[e.kind].boss?13:7);i++){
      const a=i*2.399963;
      artParticle(e.x,e.y-TYPES[e.kind].drawH*.5,Math.cos(a)*(35+i*4),-55-Math.random()*85,1.1,4+Math.random()*4,
        style==='heart'?'heart':style==='fold'?'paper':'star',i%3===0?'#91e6cd':i%2?'#ffd275':'#f99cc8');
    }
  }
  function updateCombatArt(dt){
    game.artParticles=game.artParticles||[];game.artBursts=game.artBursts||[];
    for(const p of game.artParticles){p.age+=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=p.kind==='ember'?60:155;p.vx*=Math.pow(.985,dt*60);p.angle+=p.spin*dt;}
    game.artParticles=game.artParticles.filter(p=>p.age<p.life);
    for(const b of game.artBursts)b.age+=dt;
    game.artBursts=game.artBursts.filter(b=>b.age<b.life);
    for(const p of game.projectiles){
      if(p.kind!=='flame'&&p.kind!=='rocket')continue;
      p.emberClock=(p.emberClock||0)+dt;
      if(p.emberClock>.045){p.emberClock=0;const face=Math.sign(p.vx);
        artParticle(p.x-face*(p.kind==='rocket'?30:17),p.y+(Math.random()-.5)*12,-face*(25+Math.random()*40),-12-Math.random()*30,.3+Math.random()*.28,1+Math.random()*2,'ember',Math.random()<.5?'#ffd177':'#ff9561');}
    }
    // A constrained Verlet rope gives the whip a delayed, weighted tip. The tip
    // reaches full extension at the existing engine's attack release, not at an
    // unrelated visual timestamp. Root and target use the committed facing.
    for(const e of game.enemies){
      if(e.kind!=='whip'||e.exit||e.hp<=0)continue;
      const h=TYPES.whip.drawH,beat=Math.sin(e.motionPhase||0),rest=Math.sin(game.elapsed*1.65+e.id*1.9);
      const shift=e.walking?beat*4.4:0,lift=e.walking?3.7*Math.abs(beat):0;let lean=e.walking?.048*beat:.012*rest;
      if(e.windup>0)lean+=Math.sin(Math.PI*.5*(1-e.windup/TYPES.whip.telegraph))*.15;
      if(e.swing>0)lean-=Math.sin(Math.PI*clamp(1-e.swing/.66,0,1))*.24;
      const root={x:e.x+e.face*(shift-23*Math.cos(lean)+h*.928*Math.sin(lean)),y:e.y-lift-23*Math.sin(lean)-h*.928*Math.cos(lean)};
      if(!e.rope){e.rope=Array.from({length:19},(_,i)=>({x:root.x-e.face*i*4,y:root.y+i*7,px:root.x-e.face*i*4,py:root.y+i*7}));e.ropeTrail=[];}
      const nodes=e.rope,step=12.0;let target=null;
      if(e.windup>0){const t=1-e.windup/TYPES.whip.telegraph;
        if(t<.68)target={x:root.x-e.face*(45+38*Math.sin(t/.68*Math.PI)),y:root.y-70-24*Math.sin(t/.68*Math.PI)};
        else{const q=(t-.68)/.32,fast=q*q*(3-2*q);target={x:(root.x-e.face*45)*(1-fast)+(e.x+e.face*TYPES.whip.reach)*fast,y:(root.y-70)*(1-fast)+(e.y-h*.63)*fast};}
      }else if(e.swing>0&&e.swingStyle==='whip'){
        const t=1-e.swing/.66;target={x:e.x+e.face*(TYPES.whip.reach-109*t*t),y:e.y-h*.63+110*t};
      }
      const oldRoot=nodes[0];
      if(Math.hypot(oldRoot.x-root.x,oldRoot.y-root.y)>80){for(let i=0;i<nodes.length;i++){nodes[i].x=nodes[i].px=root.x-e.face*i*4;nodes[i].y=nodes[i].py=root.y+i*7;}}
      for(let i=1;i<nodes.length;i++){const n=nodes[i],vx=(n.x-n.px)*.93,vy=(n.y-n.py)*.93;n.px=n.x;n.py=n.y;n.x+=vx;n.y+=vy+470*dt*dt;}
      for(let pass=0;pass<12;pass++){
        nodes[0].x=root.x;nodes[0].y=root.y;
        if(target){nodes.at(-1).x=target.x;nodes.at(-1).y=target.y;}
        for(let i=0;i<nodes.length-1;i++){
          const a=nodes[i],b=nodes[i+1],dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy)||1,d=(len-step)/len;
          if(i!==0){a.x+=dx*d*.5;a.y+=dy*d*.5;}b.x-=dx*d*.5;b.y-=dy*d*.5;
        }
      }
      // Finish from the anchored hand so abrupt turns cannot stretch a link.
      nodes[0].x=root.x;nodes[0].y=root.y;
      for(let i=1;i<nodes.length;i++){
        const a=nodes[i-1],b=nodes[i],dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy)||1;
        b.x=a.x+dx*step/len;b.y=a.y+dy*step/len;
      }
      e.ropeTrail.push({x:nodes.at(-1).x,y:nodes.at(-1).y,age:0});
      for(const t of e.ropeTrail)t.age+=dt;e.ropeTrail=e.ropeTrail.filter(t=>t.age<.13);
    }
  }
  function drawWeaponRigs(){
    for(const e of game.enemies){
      if(e.kind!=='whip'||!e.rope||e.exit||e.hp<=0||e.hideRig)continue;
      if(e.x-game.camera< -260||e.x-game.camera>W+260)continue;
      const rope=e.rope;
      ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
      if(e.swing>0&&e.ropeTrail.length>2){ctx.strokeStyle='#ffe0b880';ctx.lineWidth=2;ctx.beginPath();e.ropeTrail.forEach((p,i)=>{if(i)ctx.lineTo(p.x-game.camera,p.y);else ctx.moveTo(p.x-game.camera,p.y);});ctx.stroke();}
      const path=()=>{ctx.beginPath();ctx.moveTo(rope[0].x-game.camera,rope[0].y);for(let i=1;i<rope.length-1;i++){const a=rope[i],b=rope[i+1];ctx.quadraticCurveTo(a.x-game.camera,a.y,(a.x+b.x)/2-game.camera,(a.y+b.y)/2);}ctx.lineTo(rope.at(-1).x-game.camera,rope.at(-1).y);};
      path();ctx.strokeStyle='#392533';ctx.lineWidth=6;ctx.stroke();path();ctx.strokeStyle='#b85979';ctx.lineWidth=3.4;ctx.stroke();path();ctx.strokeStyle='#ffd3bc';ctx.lineWidth=.9;ctx.stroke();
      if(e.swing>.54){const tip=rope.at(-1);ctx.strokeStyle='#fff7d8';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(tip.x-game.camera-6,tip.y-5);ctx.lineTo(tip.x-game.camera+6,tip.y+5);ctx.moveTo(tip.x-game.camera-5,tip.y+6);ctx.lineTo(tip.x-game.camera+5,tip.y-6);ctx.stroke();}
      ctx.restore();
    }
  }
  function heroTrailSamples(a){
    const t=clamp(a.age/moves[a.kind].dur,0,1),upper=a.kind==='punch',out=[];
    if(t<.16||t>.96)return out;
    for(let j=2;j>=0;j--){const f=clamp((t-.16-j*.045)/.68,0,1);if(t<.16+j*.045)continue;
      out.push({x:(upper?24:25)+18*Math.sin(f*Math.PI*.85)-j*8,y:upper?-124:-82,size:(upper?40:43)*(1+.08*Math.sin(f*Math.PI)),alpha:(j===0?.88:j===1?.38:.19)*Math.min(1,(.99-t)/.16)});
    }return out;
  }
  function hipHeartSamples(a){
    const t=clamp(a.age/moves[a.kind].dur,0,1),out=[];
    for(let i=0;i<5;i++){const q=(t-.14-i*.13)/.34;if(q<0||q>1)continue;
      out.push({x:22+q*25,y:-87-q*18+(i%2?4:-4),size:5+3*Math.sin(q*Math.PI),alpha:Math.min(1,q*9)*(1-q*.75),pop:q>.76});
    }return out;
  }
  function drawAttackEffect(a){
    if(a.kind==='kick'||a.kind==='hipCrash'){
      for(const h of hipHeartSamples(a)){
        if(!h.pop)tinyHeart(h.x,h.y,h.size,h.alpha);
        else {ctx.save();ctx.strokeStyle='#ff9dcc';ctx.lineWidth=1.4;ctx.globalAlpha=h.alpha;for(let i=0;i<4;i++){const angle=i*Math.PI/2;ctx.beginPath();ctx.moveTo(h.x+Math.cos(angle)*4,h.y+Math.sin(angle)*4);ctx.lineTo(h.x+Math.cos(angle)*7,h.y+Math.sin(angle)*7);ctx.stroke();}ctx.restore();}
      }return;
    }
    const art=images.upperDetail;if(!art?.naturalWidth)return;
    for(const p of heroTrailSamples(a)){ctx.save();ctx.translate(p.x,p.y);ctx.scale(-1,1);ctx.globalAlpha=p.alpha;const w=p.size*art.naturalWidth/art.naturalHeight;ctx.drawImage(art,-w/2,-p.size/2,w,p.size);ctx.restore();}
  }
  function spinBands(e,h,front){
    if(e.swing<=0||!(e.kind==='fedora'&&e.swingStyle==='whirlwind'||e.kind==='breaker'&&e.swingStyle==='sweep'))return;
    const phase=game.elapsed*20,alpha=Math.min(1,e.swing/.16),base=e.kind==='breaker'?-.72:-.48;
    ctx.save();ctx.lineCap='round';
    for(let j=0;j<3;j++){const y=h*(base+j*.105),rx=(e.kind==='breaker'?99:116)-j*9,ry=14+j*3,start=front?0:Math.PI;
      ctx.globalAlpha=alpha*(front?.48:.22);ctx.strokeStyle=j%2?'#ffb9dd':'#d9fff5';ctx.lineWidth=3-j*.6;
      ctx.beginPath();ctx.ellipse(0,y,rx,ry,0,start,start+Math.PI);ctx.stroke();
      ctx.globalAlpha=alpha*.7;const a=phase+j*2; if((Math.sin(a)>=0)===front){ctx.beginPath();ctx.ellipse(0,y,rx,ry,0,a,a+.45);ctx.stroke();}
    }ctx.restore();
  }
  function drawClubWeapon(e,h){
    const active=e.swing>0,warning=e.windup>0;
    if(e.kind==='manager'&&(active||warning||e.followup)){
      const x=-h*.55,y=-h*.72;ctx.save();ctx.strokeStyle='#c8b4ff';ctx.lineWidth=2.3;ctx.globalAlpha=active?.95:.5;
      for(let j=0;j<3;j++){ctx.beginPath();ctx.moveTo(x-9,y+j*3);for(let i=1;i<6;i++)ctx.lineTo(x-9-i*9,y+Math.sin(game.elapsed*37+i+j)*7+j*3);ctx.stroke();}ctx.restore();
    }

    if(e.kind==='clubBoss'&&(warning||e.rush)){ctx.save();ctx.strokeStyle=e.windupStyle==='rush'?'#ffbf80':'#efb2e1';ctx.lineWidth=3;ctx.globalAlpha=.65;ctx.setLineDash([8,7]);ctx.beginPath();ctx.ellipse(-90,0,115,28,0,0,Math.PI*2);ctx.stroke();ctx.restore();}

  }
  // Motion model adapted from ARPG town.js: preparation 0-.30,
  // strike .30-.60, recovery .60-1, body lunge and independent back layer.
  // Keep Gaia's art, proportions, ranges and single-hit invulnerability.
  const meleeProps={
    punk:{art:'purpleProp',kind:'stab'},goth:{art:'purpleWand',kind:'stab'},clubPunk:{art:'heartWand',kind:'stab'},
    paddleBrute:{art:'heartPaddle',kind:'swing'},bouncer:{art:'pawPaddle',kind:'swing'},redBoss:{art:'heartPaddle',kind:'swing'},
    boxer:{art:'fistDetail',kind:'fist'},hippie:{art:'fistDetail',kind:'fist'}
  };
  function combatBeat(k){return k<.3?{w:k/.3,s:0,r:0}:k<.6?{w:1,s:(k-.3)/.3,r:0}:{w:1,s:1,r:Math.min(1,(k-.6)/.4)};}
  function comicWeaponPhase(e){
    if(e.air||e.floorTime>0||e.bind>0||e.stun>0||e.exit||!meleeProps[e.kind])return null;
    const style=e.windup>0?e.windupStyle:e.swingStyle;
    if(e.kind==='redBoss'&&style!=='paddle')return null;
    if(e.windup>0){const visible=Math.min(.20,TYPES[e.kind].telegraph);return e.windup<=visible?.3*(1-e.windup/visible):null;}
    if(e.swing<=0)return null;
    return .3+.7*clamp(1-e.swing/(style==='paddle'?.58:.55),0,1);
  }
  function comicWeaponPose(e,h,k){
    const profile=meleeProps[e.kind],ph=combatBeat(k),snap=Math.sin(Math.min(1,ph.s*2)*Math.PI/2),drive=snap*(1-ph.r)**2;
    if(profile.kind==='swing')return {x:h*.05-8*drive,y:-h*.57,size:h*.68,angle:ph.s===0?.45+1.3*ph.w:1.75-4.7*Math.sin(ph.s*Math.PI/2)+.6*ph.r,grip:.78};
    if(profile.kind==='stab')return {x:-h*.12+13*(1-ph.w)-(TYPES[e.kind].reach*.65)*drive,y:-h*.64,size:h*.47,angle:-Math.PI/2,grip:.62};
    const f=k<.58?clamp((k-.30)/.28,0,1):clamp((k-.58)/.35,0,1),pulse=Math.sin(f*Math.PI),second=k>=.58,alt=(e.attackBeat||0)%2?1:-1;
    return {x:-h*.20-TYPES[e.kind].reach*.56*pulse,y:-h*(second?.57:.69)+alt*3,size:h*(second?.25:.22),angle:second?-.08:.10,grip:.5,pulse,second};
  }
  function enemyBodyMotion(e){
    const k=comicWeaponPhase(e);if(k===null)return {shift:0,lean:0,lift:0};const p=combatBeat(k),v=comicWeaponPose(e,TYPES[e.kind].drawH,k);
    const drive=meleeProps[e.kind].kind==='fist'?v.pulse:Math.sin(Math.min(1,p.s*2)*Math.PI/2)*(1-p.r)**2;
    return {shift:6*p.w*(1-Math.min(1,p.s*3))-12*drive,lean:.035*p.w*(1-p.s)-.075*drive,lift:meleeProps[e.kind].kind==='fist'?2*drive:0};
  }
  function comicArc(e,h,k){
    const ph=combatBeat(k);if(ph.s<=0||ph.r>=1)return;const origin=comicWeaponPose(e,h,k),start=1.75-Math.PI/2,end=1.75-4.7*Math.sin(ph.s*Math.PI/2)-Math.PI/2,r=h*.49,fade=(1-ph.r)*.72;
    ctx.save();ctx.lineCap='round';
    ctx.strokeStyle='rgba(255,172,214,'+fade*.22+')';ctx.lineWidth=14;ctx.beginPath();ctx.arc(origin.x,origin.y,r,end,start);ctx.stroke();
    ctx.beginPath();for(let i=0;i<=18;i++){const t=i/18,a=start+(end-start)*t,w=1+10*t*t;ctx[i?'lineTo':'moveTo'](origin.x+Math.cos(a)*(r+w),origin.y+Math.sin(a)*(r+w));}
    for(let i=18;i>=0;i--){const t=i/18,a=start+(end-start)*t,w=1+10*t*t;ctx.lineTo(origin.x+Math.cos(a)*(r-w),origin.y+Math.sin(a)*(r-w));}
    ctx.closePath();ctx.fillStyle='rgba(255,194,225,'+fade*.65+')';ctx.fill();ctx.strokeStyle='rgba(255,246,226,'+fade+')';ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(origin.x,origin.y,r,end,start+(end-start)*.2);ctx.stroke();ctx.restore();
  }
  function comicThrust(e,h,k,v){
    const ph=combatBeat(k);if(ph.s<=0||ph.r>=1)return;const alpha=(1-ph.r)*.75,front=-TYPES[e.kind].reach-15,y=v.y;
    ctx.save();ctx.strokeStyle='rgba(255,229,202,'+alpha+')';ctx.lineCap='round';ctx.lineWidth=2;
    for(const dy of [-12,12]){ctx.beginPath();ctx.moveTo(-h*.20,y+dy);ctx.lineTo(front,y+dy*.4);ctx.stroke();}
    if(k>.40&&k<.58){ctx.strokeStyle='#fff4de';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(front-5,y-7);ctx.lineTo(front+5,y+7);ctx.moveTo(front-5,y+7);ctx.lineTo(front+5,y-7);ctx.stroke();}ctx.restore();
  }
  function propAt(art,x,y,length,angle){
    const im=images[art];if(!im?.naturalWidth)return;const w=length*im.naturalWidth/im.naturalHeight;
    ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.drawImage(im,-w/2,-length*.9,w,length);ctx.restore();
  }
  function drawEnemyAttackEffect(e,h){
    drawRegionalAttack(e,h);drawClubWeapon(e,h);if(e.air||e.floorTime>0||e.bind>0||e.stun>0)return;
    const profile=meleeProps[e.kind],warning=e.windup>0,active=e.swing>0;
    const phase=comicWeaponPhase(e);
    if(profile){
      if(phase===null)return;const v=comicWeaponPose(e,h,phase),ph=combatBeat(phase),fade=phase>.90?(1-phase)/.10:1,im=images[profile.art],w=v.size*im.naturalWidth/im.naturalHeight;
      if(profile.kind==='swing')comicArc(e,h,phase);
      if(profile.kind==='stab')comicThrust(e,h,phase,v);
      ctx.save();ctx.globalAlpha=.98*fade;ctx.translate(v.x,v.y);ctx.rotate(v.angle);ctx.drawImage(im,-w/2,-v.size*v.grip,w,v.size);ctx.restore();
      if(profile.kind==='fist'&&v.pulse>.65){ctx.save();ctx.globalAlpha=(v.pulse-.65)*1.8;ctx.strokeStyle='#fff1cf';ctx.lineWidth=2;ctx.beginPath();ctx.arc(v.x-v.size*.35,v.y,9+(1-v.pulse)*22,Math.PI*.6,Math.PI*1.4);ctx.stroke();ctx.restore();}
      return;
    }
    if(e.kind==='fedora'){
      if(active&&e.swingStyle==='whirlwind'){propAt('purpleProp',-h*.43,-h*.77,h*.30,-1.55);propAt('heartPaddle',h*.43,-h*.77,h*.38,1.55);}return;
    }
  }
  function fireShape(length,radius,age,alpha=1){
    ctx.save();ctx.globalAlpha=alpha;ctx.lineJoin='round';
    const wave=Math.sin(age*26)*radius*.25;
    const g=ctx.createLinearGradient(-length,0,15,0);g.addColorStop(0,'#ff884400');g.addColorStop(.24,'#f06a3b');g.addColorStop(.6,'#ffab42');g.addColorStop(1,'#fff5c6');
    ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(16,0);
    ctx.bezierCurveTo(3,-radius*1.15,-length*.25,-radius*1.05,-length*.39,-radius*.48+wave);
    ctx.bezierCurveTo(-length*.58,-radius*.92-wave,-length*.63,-radius*.13,-length, -radius*.16+wave);
    ctx.bezierCurveTo(-length*.73,radius*.39,-length*.56,-radius*.06,-length*.42,radius*.58-wave);
    ctx.bezierCurveTo(-length*.22,radius*1.16,3,radius*.9,16,0);ctx.fill();
    ctx.fillStyle='#ffe58b';ctx.beginPath();ctx.moveTo(12,0);ctx.quadraticCurveTo(-length*.16,-radius*.65,-length*.57,wave*.5);ctx.quadraticCurveTo(-length*.24,radius*.53,12,0);ctx.fill();
    ctx.fillStyle='#fff9dc';ctx.beginPath();ctx.ellipse(0,0,12,radius*.36,-.1,0,Math.PI*2);ctx.fill();ctx.restore();
  }
  function drawProjectile(p){
    if(drawRegionalProjectile(p))return;
    const x=p.x-game.camera,y=p.y-(p.kind==='grenade'?Math.sin(Math.PI*clamp(p.age/p.ttl,0,1))*82:0),face=Math.sign(p.vx)||1;
    if(x< -200||x>W+200)return;
    ctx.save();ctx.translate(x,y);
    if(p.kind==='flame'){
      ctx.scale(face,1);
      const halo=ctx.createRadialGradient(-11,0,3,-11,0,43);halo.addColorStop(0,'#ffb15d55');halo.addColorStop(1,'#ff9c4100');ctx.fillStyle=halo;ctx.fillRect(-60,-45,100,90);
      fireShape(108+Math.sin(p.age*19)*13,22+Math.sin(p.age*31)*3,p.age);
      for(let i=0;i<3;i++){ctx.save();ctx.translate(-46-i*20,Math.sin(p.age*20+i*2)*12);fireShape(29,6,p.age+i,.48);ctx.restore();}
    }else if(p.kind==='rocket'){
      ctx.save();ctx.scale(face,1);ctx.translate(-32,0);fireShape(61,9,p.age);ctx.restore();
      const im=images.rocketFx;ctx.scale(-face,1);if(im?.naturalWidth)ctx.drawImage(im,-44,-18,89,36);
    }else if(p.kind==='grenade'){
      ctx.rotate(p.age*9);const im=images.grenadeFx;if(im?.naturalWidth)ctx.drawImage(im,-23,-23,47,47);
      ctx.strokeStyle='#fff1a3';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(12,-20);ctx.lineTo(17+Math.sin(p.age*73)*5,-29);ctx.stroke();
    }else if(p.kind==='dagger'){
      ctx.scale(face,1);propAt('purpleProp',0,0,44,Math.PI/2);
    }else{
      ctx.scale(face,1);const g=ctx.createLinearGradient(-25,0,15,0);g.addColorStop(0,'#fff7c100');g.addColorStop(1,'#fff7c1');ctx.fillStyle=g;roundRect(-29,-3,40,6,3);ctx.fill();ctx.fillStyle='#ffd78a';ctx.beginPath();ctx.ellipse(10,0,7,3.5,0,0,Math.PI*2);ctx.fill();
    }
    ctx.restore();
  }
  function drawCombatArtParticles(){
    for(const b of game.artBursts||[]){
      const t=b.age/b.life,x=b.x-game.camera;
      ctx.save();ctx.translate(x,b.y);ctx.globalAlpha=1-t;
      for(let j=0;j<9;j++){
        const a=j*Math.PI*2/9,r=(18+75*t)*(j%2?1:.8),size=(15+17*Math.sin(t*Math.PI))*(1-t*.55);
        ctx.fillStyle=j%2?'#f69061':'#ffc56b';ctx.beginPath();ctx.arc(Math.cos(a)*r*.67,Math.sin(a)*r*.57,size,0,Math.PI*2);ctx.fill();
      }
      ctx.fillStyle='#fff0bd';ctx.beginPath();ctx.arc(0,0,28*(1-t),0,Math.PI*2);ctx.fill();ctx.restore();
    }
    for(const p of game.artParticles||[]){
      const t=p.age/p.life,x=p.x-game.camera;if(x< -30||x>W+30)continue;
      ctx.save();ctx.translate(x,p.y);ctx.rotate(p.angle);ctx.globalAlpha=(1-t)*Math.min(1,t*12);ctx.fillStyle=p.color;
      if(p.kind==='heart'){ctx.strokeStyle='#fff5e4';ctx.lineWidth=.6;drawTinyHeart(0,0,p.size,0);}
      else if(p.kind==='star'){
        ctx.beginPath();for(let i=0;i<10;i++){const r=i%2?p.size*.43:p.size,a=i*Math.PI/5-Math.PI/2;if(i)ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r);else ctx.moveTo(Math.cos(a)*r,Math.sin(a)*r);}ctx.closePath();ctx.fill();
      }else if(p.kind==='paper'){ctx.fillRect(-p.size,-p.size*.6,p.size*2,p.size*1.2);}
      else{ctx.beginPath();ctx.ellipse(0,0,p.size*(1-t*.5),p.size*.55,0,0,Math.PI*2);ctx.fill();}
      ctx.restore();
    }
  }
  function drawCuffExit(t,h){
    const close=clamp((t-.15)/.28,0,1),gap=33*(1-close);
    ctx.save();ctx.translate(0,-h*.56);ctx.rotate(Math.sin(t*13)*.09);
    for(const side of [-1,1]){
      ctx.save();ctx.translate(side*(16+gap),0);ctx.strokeStyle='#745b6b';ctx.lineWidth=7;ctx.beginPath();ctx.ellipse(0,0,13,17,0,0,Math.PI*2);ctx.stroke();ctx.strokeStyle='#dcf6f1';ctx.lineWidth=4;ctx.stroke();ctx.strokeStyle='#fff9e9';ctx.lineWidth=1;ctx.stroke();ctx.restore();
    }
    ctx.strokeStyle='#c7e2dc';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(-9-gap,0);ctx.lineTo(9+gap,0);ctx.stroke();ctx.restore();
  }

  function drawComicDecals(behind=false){
    for(const d of game.decals){
      if(d.behind!==behind)continue;const im=images[COMIC_CELLS[d.name]];if(!im?.naturalWidth)continue;
      const t=clamp(d.age/d.life,0,1),size=d.size*(.8+.2*Math.sin(Math.PI*t));
      ctx.save();ctx.translate(d.x-game.camera+d.driftX*t,d.y+d.driftY*t);ctx.rotate(d.spin*t);
      ctx.globalAlpha=t<.65?1:(1-t)/.35;
      const ratio=im.naturalWidth/im.naturalHeight;ctx.drawImage(im,-size*ratio/2,-size/2,size*ratio,size);ctx.restore();
    }
  }


  function drawComicBubbles(){
    for(const b of game.bubbles){
      const x=b.unit.x-game.camera,y=b.unit.y-TYPES[b.unit.kind].drawH-50;
      if(x<20||x>W-20)continue;
      ctx.save();ctx.font='bold 12px system-ui';ctx.textAlign='center';
      const width=Math.min(250,ctx.measureText(b.label).width+24),cx=clamp(x,width/2+8,W-width/2-8);
      ctx.fillStyle='#fff9efe8';ctx.strokeStyle='#da9eac';ctx.lineWidth=1;
      roundRect(cx-width/2,Math.max(93,y),width,29,13);ctx.fill();ctx.stroke();ctx.fillStyle='#85516d';ctx.fillText(b.label,cx,Math.max(93,y)+19);ctx.restore();
    }
  }

  function drawTinyHeart(x,y,size,rotation=0){
    ctx.save();ctx.translate(x,y);ctx.rotate(rotation);ctx.scale(size,size);
    ctx.beginPath();ctx.moveTo(0,.80);
    ctx.bezierCurveTo(-.72,.33,-1.08,-.24,-.64,-.66);
    ctx.bezierCurveTo(-.31,-.99,0,-.67,0,-.41);
    ctx.bezierCurveTo(0,-.67,.31,-.99,.64,-.66);
    ctx.bezierCurveTo(1.08,-.24,.72,.33,0,.80);
    ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();
  }
  function drawHeartShower(t,h,id){
    // Small, separate hearts form a readable little bouquet.
    // A full-sheet copy of the sticker alone cannot give this choreography.
    ctx.save();ctx.globalAlpha=Math.min(1,t*8)*clamp((1-t)/.30,0,1);
    for(let i=0;i<5;i++){
      const delay=.08+(i%3)*.075;
      const p=clamp((t-delay)/(1-delay),0,1);
      if(p===0)continue;
      const angle=(i*2.399+id*.13);
      const outward=(42+65*p)*(i%2?.85:1.16);
      const x=Math.cos(angle)*outward;
      const y=-h*.44+Math.sin(angle)*31-100*p;
      ctx.fillStyle=i%3===0?'#69dfb9':i%2?'#ffd36f':'#ff66a5';
      ctx.strokeStyle='#fff8ef';ctx.lineWidth=1.2;
      drawTinyHeart(x,y,5+(i%3)*1.5+2*Math.sin(Math.PI*p),Math.sin(angle)*.20);
    }
    ctx.restore();
  }
  function drawCoiledSpring(t,h){
    const p=clamp((t-.17)/.32,0,1);if(p<=0||t>.49)return;
    const tall=(16+Math.sin(Math.PI*.82*p)*118)*clamp((.49-t)/.07,0,1);
    ctx.save();ctx.globalAlpha=clamp(p*5,0,1);ctx.lineCap='round';
    ctx.strokeStyle='#a76569';ctx.lineWidth=8;
    ctx.beginPath();ctx.moveTo(-27,0);
    for(let i=0;i<=30;i++){
      const q=i/30;
      ctx.lineTo(Math.sin(q*Math.PI*12)*30,-tall*q);
    }
    ctx.stroke();ctx.strokeStyle='#ffbad6';ctx.lineWidth=4;ctx.stroke();
    ctx.fillStyle='#fa8fb7';ctx.strokeStyle='#fff1df';ctx.lineWidth=2.5;
    ctx.beginPath();ctx.ellipse(0,-tall,35,7,0,0,Math.PI*2);ctx.fill();ctx.stroke();
    ctx.restore();
  }
  function drawFoldedPaper(img,w,h,t){
    const p=clamp((t-.05)/.75,0,1),ease=p*p*(3-2*p);
    const smallH=h*(1-.88*ease);
    // Keep one continuous illustration. Thin overlaid fold creases provide
    // the accordion illusion without any exposed sprite cutting seams.
    if(t<.79){
      ctx.drawImage(img,-w/2,-smallH,w,smallH);
      if(ease>.08){
        ctx.save();ctx.strokeStyle=`rgba(255,244,237,${ease*.96})`;
        ctx.lineWidth=3;ctx.shadowColor='#ab678f';ctx.shadowBlur=3;
        for(const f of [1/3,2/3]){
          ctx.beginPath();ctx.moveTo(-w*.46,-smallH*f);
          ctx.quadraticCurveTo(0,-smallH*f+6*ease,w*.46,-smallH*f);
          ctx.stroke();
        }
        ctx.restore();
      }
    }
    if(t>.56){
      const q=clamp((t-.56)/.22,0,1);
      ctx.save();ctx.globalAlpha=q;
      ctx.fillStyle='#ffcad9';ctx.strokeStyle='#fff7ef';ctx.lineWidth=3;
      roundRect(-w*.26,-h*.16,w*.52,h*.16,5);ctx.fill();ctx.stroke();
      ctx.strokeStyle='#ec8dae';ctx.lineWidth=2;
      ctx.beginPath();ctx.moveTo(-w*.26,-h*.15);ctx.lineTo(0,-h*.08);
      ctx.lineTo(w*.26,-h*.15);ctx.stroke();
      ctx.fillStyle='#ed6eac';ctx.strokeStyle='#fff7ef';ctx.lineWidth=1.4;
      drawTinyHeart(0,-h*.095,6,0);ctx.restore();
    }
  }
  function drawExitScene(unit,h,w){
    const e=unit.exit;if(!e)return;
    const t=clamp(e.age/e.duration,0,1);
    if(e.kind==='spring')drawCoiledSpring(t,h);
    if(e.kind==='heart')drawHeartShower(t,h,unit.id);
    if(e.kind==='boss'&&t>.53){
      // The boss is too massive to be thrown offscreen by a pink paddle.
      // A weighty floor shock and a gold arrest seal finish the joke.
      const q=clamp((t-.53)/.21,0,1);
      ctx.save();ctx.globalAlpha=(1-t)*2;
      ctx.strokeStyle='#ffe7ad';ctx.lineWidth=6*(1-q)+2;
      ctx.beginPath();ctx.ellipse(0,-2,28+120*q,7+18*q,0,0,Math.PI*2);ctx.stroke();
      ctx.strokeStyle='#ff99c2';ctx.lineWidth=3;
      ctx.beginPath();ctx.ellipse(0,-2,21+94*q,5+13*q,0,0,Math.PI*2);ctx.stroke();
      ctx.restore();
    }
  }
  function drawWholeEnemy(unit,img,w,h){
    // The illustration remains ONE contiguous silhouette in every frame.
    // A waist-sliced puppet left a naked seam when the two halves rotated.
    // Entire-body timing/footside squash is enough to give each foe character.
    if(unit.holdingPlayer||unit.air||unit.floorTime>0||unit.exit){ctx.drawImage(img,-w/2,-h,w,h);return;}
    const beat=Math.sin(unit.motionPhase||0),walking=unit.walking;
    const rest=Math.sin(game.elapsed*1.65+unit.id*1.9);
    let shift=0,lift=0,lean=0,scaleX=1,scaleY=1;
    switch(unit.kind){
      case 'clubPunk':
      case 'punk': // short bounce, abrupt little skateboard-like slide
        shift=walking?beat*6:0;lift=walking?Math.pow(Math.max(0,beat),2)*8:0;
        lean=walking?.075*beat:.018*rest;scaleY=1+(walking?.025*Math.abs(beat):0);break;
      case 'bouncer':
      case 'boxer': // planted boxer: sharp shoulder/heel pulses, not a hop
        shift=walking?Math.sign(beat)*2.8:0;lift=walking?1.4*Math.abs(beat):0;
        lean=walking?.038*Math.sign(beat):.008*rest;
        scaleX=1+(walking?.025*Math.max(0,beat):0);break;
      case 'goth': // silent floating-looking GLIDE; feet remain on the floor
        shift=walking?beat*1.2:0;lift=.6;
        lean=.012*Math.sin(game.elapsed*1.3+unit.id);break;
      case 'whip': // light tiptoe gait with a lively upper-body rhythm
        shift=walking?beat*4.4:0;lift=walking?3.7*Math.abs(beat):0;
        lean=(walking?.048*beat:.012*rest);break;
      case 'hippie': // broad, lazy comic pendulum
        shift=walking?beat*5.2:0;lift=walking?1.9*Math.abs(beat):0;
        lean=.071*Math.sin((unit.motionPhase||0)*.7);break;
      case 'clubBoss':
      case 'redBoss': // the giant does NOT dance: only slow breathing
        scaleX=1+.007*rest;scaleY=1-.004*rest;break;
      case 'manager':
      case 'fedora': // sneaky glide, then purposeful blade/whirlwind snap
        shift=walking?beat*2.1:0;lean=walking?.022*beat:.012*rest;break;
      case 'breaker':shift=walking?Math.sin(beat)*9:0;lean=walking?beat*.07:.02*rest;break;
      default:
        shift=walking?beat*2.4:0;lift=walking?1.5*Math.abs(beat):0;
        lean=walking?.026*beat:.013*rest;
    }
    if(TYPES[unit.kind].regional){const m=regionalBodyMotion(unit);shift+=m.shift;lean+=m.lean;}
    else if(meleeProps[unit.kind]){const m=enemyBodyMotion(unit);shift+=m.shift;lift+=m.lift;lean+=m.lean;}
    else {
      if(unit.windup>0){const p=1-unit.windup/TYPES[unit.kind].telegraph;lean+=Math.sin(Math.PI*.5*p)*(unit.kind==='whip'?.15:.07);}
      if(unit.swing>0){const duration=unit.swingStyle==='whip'?.66:unit.swingStyle==='whirlwind'?.72:.55;lean-=Math.sin(Math.PI*clamp(1-unit.swing/duration,0,1))*(unit.kind==='whip'?.24:.10);}
    }
    ctx.save();ctx.translate(shift,-lift);ctx.rotate(lean);ctx.scale(scaleX,scaleY);
    ctx.drawImage(img,-w/2,-h,w,h);ctx.restore();
  }
  function drawDaze(u,hero){
    if(hero&&player.grab)return;
    const on=hero?(player.dazeT>0&&player.hp>0):(u.hp>0&&u.stun>.55&&!u.air&&!(u.floorTime>0)&&!u.exit);
    if(!on)return;
    const x=u.x-game.camera,h=hero?169:TYPES[u.kind].drawH,t=game.elapsed*5,cy=u.y-h-8;
    for(let i=0;i<3;i++){
      const a=t+i*Math.PI*2/3,s=Math.sin(a),back=s<0;
      ctx.save();ctx.translate(x+Math.cos(a)*34,cy+s*9);ctx.globalAlpha=back?.55:1;const sc=back?.75:1;ctx.scale(sc,sc);
      if(hero){ctx.fillStyle=player.climaxT>0?'#ff7fb5':'#ffd84a';ctx.strokeStyle='#8a5a2a';ctx.lineWidth=1.5;ctx.font='bold 26px sans-serif';ctx.textAlign='center';ctx.strokeText(player.climaxT>0?'♥':'★',0,9);ctx.fillText(player.climaxT>0?'♥':'★',0,9);}
      else{
        const f=back?1:-1,flap=Math.sin(game.elapsed*30+i)*4;
        ctx.fillStyle='#ffd84a';ctx.beginPath();ctx.ellipse(0,0,9,6.5,0,0,Math.PI*2);ctx.fill();
        ctx.beginPath();ctx.arc(f*7,-4,4.6,0,Math.PI*2);ctx.fill();
        ctx.fillStyle='#ff9a3c';ctx.beginPath();ctx.moveTo(f*11,-5);ctx.lineTo(f*17,-3);ctx.lineTo(f*11,-2);ctx.fill();
        ctx.fillStyle='#e8b02a';ctx.beginPath();ctx.ellipse(-f*1,-2-flap*.4,6,3.2+Math.abs(flap)*.4,0,0,Math.PI*2);ctx.fill();
        ctx.fillStyle='#4b3320';ctx.beginPath();ctx.arc(f*8,-5,1,0,Math.PI*2);ctx.fill();
      }
      ctx.restore();
    }
  }
  const ART={};for(const [k,v] of Object.entries(window.ENEMY_ART||{})){ART[k]={};for(const t of ['alt','fly']){const im=new Image();im.src=v[t];ART[k][t]=im;}}
  const artOk=im=>im&&im.complete&&im.naturalWidth;
  const FLY_LINES=['아앙~♥','더 세게!','으앗~♥','날아간다~♥','좋아~♥']; // 날아갈 때 대사 [임시, 케인이 바꿀 것]
  function drawFighter(unit,hero=false){
    if(hero&&window.HeroActions?.draw(ctx,images,unit,game))return;
    if(!hero&&TYPES[unit.kind].female){window.FemaleEnemies.draw(ctx,images,unit,game);return;}
    const figures=hero?null:enemyFrames[unit.kind];
    const alternatePose=!hero&&TYPES[unit.kind].regional?(unit.swing>0||unit.windup>0&&unit.windup<.22):unit.swing>0&&(unit.kind==='fedora'&&unit.swingStyle==='whirlwind'||
      unit.kind==='redBoss'&&unit.swingStyle==='paddle'||unit.kind==='manager'||unit.kind==='clubBoss'&&unit.swingStyle==='bullet');
    let img=figures?.[figures.length===2&&alternatePose?1:0]||images[hero?'hero':unit.kind];
    const art=!hero&&!unit.exit?ART[unit.kind]:null;
    const flying=!!(art&&(unit.air||unit.floorTime>0)&&artOk(art.fly));
    // 두번째 동작 이미지와 번갈아: 제자리 움짤
    if(art&&!unit.holdingPlayer&&!flying&&!alternatePose&&!unit.air&&!(unit.floorTime>0)&&!(unit.swing>0||unit.windup>0)&&artOk(art.alt)&&Math.floor(game.elapsed*3.6+unit.id*.37)%2===1)img=art.alt;
    if(unit.kind==='whip')unit.hideRig=flying||img===art?.alt||!!window.EnemyWalk?.canDraw(unit,images); // 새 컷엔 채찍이 그려져 있어서 물리 밧줄은 숨김
    if(!img||!(img.naturalWidth||img.width))return;
    const x=unit.x-game.camera,groundY=unit.y;
    const h=hero?169:TYPES[unit.kind].drawH;
    const w=h*((img.naturalWidth||img.width)/(img.naturalHeight||img.height));
    if(x<-340||x>W+340)return;
    ctx.save();ctx.translate(x,groundY);
    if(hero&&unit.dashFollow){ctx.save();ctx.scale(unit.dashFollow.dir,1);ctx.strokeStyle='#e1fff5';ctx.globalAlpha=.6;ctx.lineWidth=2;for(let j=0;j<3;j++){ctx.beginPath();ctx.moveTo(-26-j*7,-50-j*20-unit.jumpZ);ctx.lineTo(-67-j*10,-50-j*20-unit.jumpZ);ctx.stroke();}ctx.restore();}
    if(!hero&&unit.bind>0&&!unit.exit&&!unit.air)ctx.translate((Math.random()-.5)*7,(Math.random()-.5)*5); // 속박: 파르르 떨림
    // Never fade the enemy body on hit; repeated semi-transparent frames made
    // the paper-doll characters illegible during a combo.
    if(hero&&unit.hurt>0&&Math.floor(game.elapsed*14)%2===0)ctx.globalAlpha=.64;
    if(!unit.exit){ctx.fillStyle='#6047634d';ctx.beginPath();ctx.ellipse(0,-2,w*.38,11,0,0,Math.PI*2);ctx.fill();}
    if(!hero&&unit.exit){
      const exit=unit.exit,t=clamp(exit.age/exit.duration,0,1);
      drawExitScene(unit,h,w);

      if(exit.kind==='squash'){
        // Heavy boxer pancaking: quick WHOOMP, then he lies flat for a beat.
        const p=clamp(t/.56,0,1),ease=1-(1-p)**3;
        ctx.scale(1+.38*ease,1-.79*ease);
        ctx.globalAlpha=t>.78?(1-t)/.22:1;
      }else if(exit.kind==='spring'){
        // Compression, a sudden high bounce, then a gentle exit offscreen.
        const p=clamp((t-.17)/.83,0,1);
        ctx.translate(exit.dir*153*p*p,-(112*Math.sin(Math.PI*Math.min(1,p*1.22))+264*p));
        ctx.rotate(exit.dir*.27*p);
        ctx.scale(1-.22*p,t<.17?1-.59*Math.sin(Math.PI*t/.17):1);
        ctx.globalAlpha=t>.82?(1-t)/.18:1;
      }else if(exit.kind==='heart'){
        const p=clamp((t-.28)/.72,0,1),shrink=1-.93*p*p;
        ctx.translate(0,-56*p);ctx.rotate(Math.sin(t*17)*.11*(1-p));
        ctx.scale(shrink,shrink);ctx.globalAlpha=t>.77?(1-t)/.23:1;
      }else if(exit.kind==='fold'){
        // Whole paper silhouette folds into a deliberately creased card.
        ctx.translate(exit.dir*42*t*t,-11*Math.sin(Math.PI*t));
        ctx.rotate(exit.dir*.27*clamp((t-.78)/.22,0,1));
        ctx.globalAlpha=t>.85?(1-t)/.15:1;
      }else if(exit.kind==='spin'){
        ctx.translate(exit.dir*211*t,-Math.sin(Math.PI*t)*108);
        ctx.rotate(exit.dir*Math.PI*2.2*t);
        ctx.scale(1-.70*t,1-.70*t);
        ctx.globalAlpha=t>.70?(1-t)/.30:1;
      }else if(exit.kind==='cuffs'){
        ctx.translate(exit.dir*82*t,-30*Math.sin(Math.PI*t));
        ctx.rotate(exit.dir*.3*t);
        ctx.scale(1-.95*t,1-.95*t);
        ctx.globalAlpha=t>.72?(1-t)/.28:1;
      }else if(exit.kind==='boss'){
        // Massive boss: wobble, heavy bottom-first collapse, NO pinwheel.
        const fall=clamp((t-.22)/.60,0,1),ease=fall*fall*(3-2*fall);
        ctx.rotate(Math.sin(t*19)*.105*(1-ease));
        ctx.scale(1+.25*ease,1-.91*ease);
        ctx.globalAlpha=t>.84?(1-t)/.16:1;
      }
    }
    // Keep the exact same paper-doll drawing while it flies and lands.
    if(!hero&&(unit.air||unit.floorTime>0)){
      const airborne=unit.air;
      ctx.translate(0,-(airborne?airborne.lift:(unit.floorLift||0)));
      ctx.rotate((airborne?.angle??unit.floorAngle)*(flying?.3:1));
    }
    // Original enemy drawings are LEFT-facing; player drawings use their own
    // normalized pose transforms below. Mirroring only once fixes the bug
    // where every enemy attacked away from Rozie.
    ctx.scale(hero?(unit.attack?unit.attack.dir:unit.face):-unit.face,1);
    if(!hero&&!unit.exit){
      spinBands(unit,h,false);
      const motion=enemyBodyMotion(unit);ctx.save();ctx.translate(motion.shift,-motion.lift);drawEnemyAttackEffect(unit,h);ctx.restore();
      if(unit.kind==='whip'&&unit.windup>0){
        const warning=1-unit.windup/TYPES.whip.telegraph;
        ctx.save();ctx.globalAlpha=.25+.32*warning;ctx.strokeStyle='#ff98c3';ctx.lineWidth=4;
        ctx.beginPath();ctx.ellipse(-86,-4,88,30,0,0,Math.PI*2);ctx.stroke();
        ctx.restore();
      }

    }
    ctx.filter=hero?'none':unit.hurt>0?'brightness(1.17) saturate(1.1)':unit.colorShift?`hue-rotate(${unit.colorShift}deg)`: 'none';
    const walking=hero&&!unit.charge&&!unit.skillPose&&Math.hypot(...moveVector())>.2&&unit.stun===0&&!unit.crouch&&!unit.attack&&!unit.down&&!unit.slam;
    const walkBob=walking?Math.abs(Math.sin(game.elapsed*12))*3:0;
    const attackSpriteKey=hero&&(unit.charge||unit.skillPose)?(unit.charge?'lowerPrep':unit.skillPose.kind==='release'?'lowerHit':'upperHit'):hero&&unit.attack?
      `${unit.attack.kind==='punch'?'upper':'lower'}${unit.attack.age/moves[unit.attack.kind].dur<.42?'Prep':'Hit'}`:null;
    const attackSprite=attackSpriteKey?images[attackSpriteKey]:null;
    let pose=null,poseScale=1,poseLift=0;
    if(hero&&!unit.attack){
      if(unit.slam&&poses.fall.length===5){
        pose=poses.fall[unit.slam.phase==='dive'?2:unit.slam.recovery<.17?3:4];
        poseScale=h/550;poseLift=unit.slam.phase==='dive'?unit.jumpZ:0;
      }else if(unit.down&&poses.fall.length===5){
        const t=clamp(unit.down.age/unit.down.duration,0,1);
        const sequence=unit.down.kind==='explosion'?[0,1,2,3,4]:[0,1,3,4];
        pose=poses.fall[sequence[Math.min(sequence.length-1,Math.floor(t*sequence.length))]];
        poseScale=h/550;
        poseLift=unit.down.kind==='explosion'?Math.sin(Math.PI*clamp(t/.78,0,1))*74:
          Math.sin(Math.PI*clamp(t/.65,0,1))*12;
      }else if(unit.jump&&poses.jump.length===4){
        const t=clamp(unit.jump.age/unit.jump.duration,0,1);
        pose=poses.jump[t<.12?0:t<.36?1:t<.64?2:t<.88?1:3];
        poseScale=h/685;poseLift=unit.jumpZ;
      }else if(unit.crouch&&poses.move.length===3){
        pose=poses.move[2];poseScale=h/pose.height;
      }else if(walking&&poses.walk.length===4){
        pose=poses.walk[Math.floor(game.elapsed*9)%4];
        poseScale=h/700;
      }else if(poses.move.length===3){
        pose=poses.move[1];poseScale=h/pose.height;
      }
    }
    if(hero&&unit.splash){
      const b=unit.splash,im=images['splash'+(b.age<.14?0:b.age<.46?1:2)],scale=169/550;
      ctx.save();ctx.scale(-1,1);ctx.drawImage(im,-im.naturalWidth*scale/2,-im.naturalHeight*scale-unit.jumpZ,im.naturalWidth*scale,im.naturalHeight*scale);ctx.restore();
    }else if(attackSprite&&attackSprite.complete&&attackSprite.naturalWidth){
      const poseH=h,poseW=poseH*attackSprite.naturalWidth/attackSprite.naturalHeight;
      // Upper/chest pose faces left in source; lower/hip pose faces right (backward stance).
      ctx.save();const hip=['kick','hipCrash'].includes(unit.attack?.kind);ctx.scale(unit.charge||unit.skillPose?.kind==='release'||hip?1:-1,1);
      const t=hip?clamp(unit.attack.age/moves[unit.attack.kind].dur,0,1):0,hop=hip?Math.abs(Math.sin(t*Math.PI*2)):0;
      ctx.translate(hip?hop*(unit.attack?.kind==='hipCrash'?19:9):0,hip?-hop*(unit.attack?.kind==='hipCrash'?17:9):0);ctx.drawImage(attackSprite,-poseW*.5,-poseH,poseW,poseH);ctx.restore();
    }else if(pose){
      // The three new sheets face left. Flip once inside the normal facing transform.
      ctx.save();ctx.scale(-1,1);
      ctx.drawImage(pose.image,-pose.anchorX*poseScale,-pose.height*poseScale-poseLift,
        pose.width*poseScale,pose.height*poseScale);
      ctx.restore();
    }else if(!hero&&window.EnemyWalk?.draw(ctx,images,unit,h)){
      // Walk atlas has fixed per-character scale and foot anchors.
    }else if(flying){
      const k=h/(images[unit.kind].naturalHeight||h),fw=art.fly.naturalWidth*k,fh=art.fly.naturalHeight*k;
      ctx.drawImage(art.fly,-fw/2,-fh,fw,fh);
    }else if(!hero&&unit.exit?.kind==='fold'){
      drawFoldedPaper(img,w,h,clamp(unit.exit.age/unit.exit.duration,0,1));
    }else if(!hero&&unit.kind==='whip'){
      // Unlike the other sheet figures, the whip-wielding woman is painted
      // facing RIGHT. Mirror her alone to match the shared facing contract.
      ctx.save();ctx.scale(-1,1);drawWholeEnemy(unit,img,w,h);ctx.restore();
    }else if(!hero){const spin=unit.swing>0&&(unit.kind==='fedora'&&unit.swingStyle==='whirlwind'||unit.kind==='breaker'&&unit.swingStyle==='sweep');ctx.save();if(spin){const c=Math.cos(game.elapsed*23);ctx.scale((c<0?-1:1)*(.52+.48*Math.abs(c)),1);}drawWholeEnemy(unit,img,w,h);ctx.restore();}
    else ctx.drawImage(img,-w*.5,-h-walkBob,w,h);
    if(!hero&&unit.exit?.kind==='cuffs'){drawCuffExit(clamp(unit.exit.age/unit.exit.duration,0,1),h);}
    if(false){
      const cuff=images.comicToolsPink;
      if(cuff?.naturalWidth){ctx.save();ctx.translate(0,-h*.52);
        ctx.drawImage(cuff,0,0,850,510,-65,-40,130,79);ctx.restore();}
    }
    ctx.filter='none';
    if(!hero&&!unit.exit){spinBands(unit,h,true);}
    if(hero&&unit.attack)drawAttackEffect(unit.attack);
    const anim=hero?unit.attack:null;
    if(anim&&(!attackSprite?.complete||!attackSprite.naturalWidth)){
      const prog=anim.age/moves[anim.kind].dur;
      const thrust=Math.sin(Math.PI*clamp(prog,0,1));
      ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle=hero?'#f1b8a4':'#e7bda6';ctx.lineWidth=hero?13:12;
      ctx.beginPath();
      if(anim.kind==='kick'){ctx.moveTo(14,-47);ctx.lineTo(24+thrust*71,-31-thrust*7);ctx.stroke();ctx.fillStyle=hero?'#2e2134':'#554260';roundRect(20+thrust*70,-40,29,18,6);ctx.fill();}
      else{ctx.moveTo(14,-h*.68);ctx.lineTo(21+thrust*76,-h*.64);ctx.stroke();ctx.fillStyle=hero?'#24202f':'#ba748b';ctx.beginPath();ctx.arc(23+thrust*76,-h*.64,12,0,Math.PI*2);ctx.fill();}
      if(thrust>.6){ctx.fillStyle='#ffe087';ctx.font='23px sans-serif';ctx.fillText('✦',75,-h*.70);}
    }
    ctx.restore();
    if(!hero&&!unit.exit&&!unit.cutIn&&!TYPES[unit.kind].boss){
      ctx.save();const barW=Math.min(98,w*.7);ctx.fillStyle='#4f3958cc';roundRect(x-barW/2,groundY-h-16-((unit.id||0)%3)*9,barW,7,3);ctx.fill();ctx.fillStyle=unit.hurt>0?'#ffe89b':'#77e2b3';roundRect(x-barW/2,groundY-h-16-((unit.id||0)%3)*9,barW*Math.max(0,unit.hp/unit.maxHp),7,3);ctx.fill();
      ctx.font='bold 11px system-ui';ctx.textAlign='center';ctx.strokeStyle='#624257';ctx.lineWidth=3;
      if(unit.windup>0){ctx.strokeStyle='#ffdca9';ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,groundY-h-25,5,0,Math.PI*2);ctx.stroke();}
      if(unit.bind>0){ctx.fillStyle='#b8fff0';ctx.font='22px sans-serif';ctx.fillText('⌁',x+23,groundY-h-30);}
      ctx.restore();
    }
  }
  function drawWorld(){
    if(player.grab){drawGrabOverlay();return;}
    ctx.save();if(game.shake>0)ctx.translate((Math.random()-.5)*Math.min(5,game.shake),(Math.random()-.5)*Math.min(3,game.shake*.5));
    backdrop();drawRegionalFloor();
    for(const s of game.shockwaves){
      const t=clamp(s.age/s.life,0,1),r=18+slamMove.radiusX*t;
      ctx.save();ctx.globalAlpha=(1-t)*.85;ctx.strokeStyle='#fff1b0';ctx.lineWidth=7*(1-t)+1;
      ctx.beginPath();ctx.ellipse(s.x-game.camera,s.y-5,r,Math.max(8,r*.21),0,0,Math.PI*2);ctx.stroke();
      ctx.strokeStyle='#f594c2';ctx.lineWidth=3*(1-t)+1;
      ctx.beginPath();ctx.ellipse(s.x-game.camera,s.y-5,r*.8,Math.max(5,r*.15),0,0,Math.PI*2);ctx.stroke();
      ctx.restore();
    }
    drawComicDecals(true);drawWeaponRigs();
    const objects=[...(game.breakables||[]).map(b=>({y:b.y,draw:()=>drawBreakable(b)})),...(game.pickups||[]).map(p=>({y:p.y+1,draw:()=>drawPickup(p)})),...game.props.map(p=>({y:p.y,draw:()=>drawProp(p)})),...game.enemies.filter(e=>e.hp>0||e.air||e.floorTime>0||e.exit).map(e=>({y:e.y,draw:()=>{drawFighter(e);drawDaze(e,false);}})),{y:player.y,draw:()=>{drawFighter(player,true);drawDaze(player,true);}}];
    objects.sort((a,b)=>a.y-b.y);for(const o of objects)o.draw();drawGrab();
    for(const p of game.projectiles)drawProjectile(p);
    for(const s of game.skillBursts){
      if(s.age<0)continue;
      const t=clamp(s.age/s.life,0,1);
      ctx.save();ctx.globalAlpha=(1-t)*.96;
      if(s.kind==='paddle'){
        const size=30+53*Math.sin(Math.PI*t);
        ctx.translate(s.x-game.camera+s.side*(18+35*t),s.y-20*t);ctx.rotate(s.side*(.6-t*.8));
        if(images.paddle.complete&&images.paddle.naturalWidth)ctx.drawImage(images.paddle,-size*.4,-size*.65,size*.8,size*1.3);
        else{ctx.font=`${size}px sans-serif`;ctx.fillText('♥',-size/2,0);}
      }else{
        const f=1-Math.pow(1-t,2),x=s.fromX+(s.x-s.fromX)*f-game.camera,y=s.fromY+(s.y-s.fromY)*f-23*Math.sin(t*Math.PI);
        ctx.translate(x,y);ctx.rotate(t*Math.PI*2.2);
        const cuffArt=images.comicToolsPink;
        if(cuffArt?.naturalWidth)ctx.drawImage(cuffArt,0,0,768,512,-42,-28,84,56);
        else{ctx.lineWidth=5;ctx.strokeStyle='#eaf9ff';
          ctx.beginPath();ctx.ellipse(-14,0,11,14,0,0,Math.PI*2);ctx.ellipse(14,0,11,14,0,0,Math.PI*2);ctx.stroke();
          ctx.beginPath();ctx.moveTo(-5,0);ctx.lineTo(5,0);ctx.stroke();}
      }
      ctx.restore();
    }
    drawSkillArt();drawCombatArtParticles();drawComicDecals(false);drawComicBubbles();
    ctx.restore();
    for(const p of game.particles){ctx.save();ctx.globalAlpha=1-p.age/p.life;ctx.font=`900 ${p.size}px system-ui`;ctx.textAlign='center';ctx.lineWidth=4;ctx.strokeStyle='#694369';ctx.strokeText(p.label,p.x-game.camera,p.y);ctx.fillStyle=p.color;ctx.fillText(p.label,p.x-game.camera,p.y);ctx.restore();}
    if(game.mode==='playing'){
      drawBuffs();
      ctx.fillStyle='#fff3e4cf';roundRect(337,8,285,18,9);ctx.fill();
      ctx.fillStyle='#e88ab7';roundRect(340,11,279*clamp(player.x/WORLD_W,0,1),12,7);ctx.fill();
      ctx.fillStyle='#68445e';ctx.font='bold 11px system-ui';ctx.textAlign='center';
      if(!game.waveLive){ctx.font='bold 23px system-ui';ctx.textAlign='right';ctx.fillStyle='#fff3da';ctx.strokeStyle='#7e4d63';ctx.lineWidth=4;ctx.strokeText('›',W-34,245);ctx.fillText('›',W-34,245);}
    }
  }
  let last=performance.now();function frame(now){const dt=Math.min(.04,(now-last)/1000||.016);last=now;update(dt);drawWorld();requestAnimationFrame(frame);}requestAnimationFrame(frame);

  $('start').onclick=()=>{clearInput();game.mode='playing';AlleyAudio.bgm(WAVES[game.zone].boss?'boss':'battle');hidePanels();};
  $('pauseReturn').onclick=returnToCity;$('resultReturn').onclick=returnToCity;
  $('pause').onclick=()=>{if(game.mode==='playing')pause();else if(game.mode==='paused'){$('start').click();}};

  // Four combat buttons: upper/lower repeat while held, jump is a one-shot,
  // crouch remains active only while held; dash is a one-shot. Two M-powered skills use separate controls.
  for(const key of ['punch','kick','jump','crouch','dash']){
    const el=$(key);const release=()=>{if(key!=='jump'&&key!=='dash')input[key]=false;if(key==='kick')slamKickLock=false;el.classList.remove('pressed');};
    el.addEventListener('pointerdown',e=>{e.preventDefault();el.setPointerCapture(e.pointerId);if(player.grab){mashGrab();input[key]=false;el.classList.add('pressed');return;}input[key]=true;if(key==='crouch')player.crouchHold=.38;if(key==='punch'||key==='kick')queuedAttack[key]=COMBO_TAP_GRACE;el.classList.add('pressed');});
    for(const ev of ['pointerup','pointercancel','lostpointercapture'])el.addEventListener(ev,release);
  }
  $('pushSkill').addEventListener('pointerdown',e=>{e.preventDefault();if(player.grab){mashGrab();return;}pushSkill();});
  let chargePointer=null;
  $('chargeSkill').addEventListener('pointerdown',e=>{e.preventDefault();if(player.grab){mashGrab();return;}if(chargePointer!==null)return;chargePointer=e.pointerId;e.currentTarget.setPointerCapture(e.pointerId);beginCharge();});
  $('chargeSkill').addEventListener('pointerup',e=>{if(e.pointerId===chargePointer){chargePointer=null;releaseCharge();}});
  for(const event of ['pointercancel','lostpointercapture'])$('chargeSkill').addEventListener(event,e=>{if(e.pointerId===chargePointer){chargePointer=null;cancelCharge();}});
  const joy=$('joystick'),stick=$('stick');
  function moveStick(e){const r=joy.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;
    let dx=(e.clientX-cx)/(r.width*.34),dy=(e.clientY-cy)/(r.height*.34),mag=Math.hypot(dx,dy);if(mag>1){dx/=mag;dy/=mag;}
    joystick.x=dx;joystick.y=dy;stick.style.transform=`translate(calc(-50% + ${dx*34}px),calc(-50% + ${dy*34}px))`;
  }
  joy.addEventListener('pointerdown',e=>{e.preventDefault();joystick.active=true;joystick.pid=e.pointerId;joy.setPointerCapture(e.pointerId);moveStick(e);});
  joy.addEventListener('pointermove',e=>{if(joystick.active&&e.pointerId===joystick.pid)moveStick(e);});
  function joyEnd(e){if(e.pointerId!==joystick.pid)return;joystick.active=false;joystick.x=0;joystick.y=0;stick.style.transform='translate(-50%,-50%)';}
  for(const ev of ['pointerup','pointercancel','lostpointercapture'])joy.addEventListener(ev,joyEnd);
  const zone=$('joyZone'),jf=$('joyFloat'),jfs=$('joyFloatStick');let origin=null;
  function zoneMove(e){const R=44;let dx=(e.clientX-origin.x)/R,dy=(e.clientY-origin.y)/R,mag=Math.hypot(dx,dy);if(mag>1){dx/=mag;dy/=mag;}joystick.x=dx;joystick.y=dy;jfs.style.transform=`translate(calc(-50% + ${dx*44}px),calc(-50% + ${dy*44}px))`;}
  zone.addEventListener('pointerdown',e=>{if(joystick.active)return;e.preventDefault();origin={x:e.clientX,y:e.clientY};jf.style.left=e.clientX+'px';jf.style.top=e.clientY+'px';jf.classList.remove('hidden');joystick.active=true;joystick.pid=e.pointerId;try{zone.setPointerCapture(e.pointerId);}catch(_){}zoneMove(e);});
  zone.addEventListener('pointermove',e=>{if(joystick.active&&e.pointerId===joystick.pid&&origin)zoneMove(e);});
  function zoneEnd(e){if(e.pointerId!==joystick.pid||!origin)return;origin=null;joystick.active=false;joystick.x=0;joystick.y=0;jf.classList.add('hidden');jfs.style.transform='translate(-50%,-50%)';}
  for(const ev of ['pointerup','pointercancel','lostpointercapture'])zone.addEventListener(ev,zoneEnd);
  window.addEventListener('keydown',e=>{
    if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();
    held.add(e.code);
    if(e.repeat)return;
    if(player.grab&&['KeyJ','KeyK','Space','ShiftLeft','ShiftRight','KeyL','KeyQ','KeyE'].includes(e.code)){mashGrab();return;}
    if(e.code==='KeyQ')pushSkill();if(e.code==='KeyE')beginCharge();if(e.code==='KeyJ'){input.punch=true;queuedAttack.punch=COMBO_TAP_GRACE;}
    if(e.code==='KeyK'){input.kick=true;queuedAttack.kick=COMBO_TAP_GRACE;}
    if(e.code==='Space')input.jump=true;
    if(e.code==='KeyL')input.dash=true;
    if(e.code==='ShiftLeft'||e.code==='ShiftRight'){input.crouch=true;player.crouchHold=.38;}
    
    if(e.code==='Escape'&&game.mode==='playing')$('pause').click();
  });
  window.addEventListener('keyup',e=>{held.delete(e.code);if(e.code==='KeyE')releaseCharge();if(e.code==='KeyJ')input.punch=false;if(e.code==='KeyK'){input.kick=false;slamKickLock=false;}if(e.code==='ShiftLeft'||e.code==='ShiftRight')input.crouch=held.has('ShiftLeft')||held.has('ShiftRight');});
  window.addEventListener('blur',()=>{clearInput();if(game.mode==='playing')pause();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){clearInput();if(game.mode==='playing')pause();}});
  // Debug state is read-only: useful to verify collision, waves and shops in browser tests.
  window.__gaiaBrawlerDebug=()=>({mode:game.mode,zone:game.zone,zoneEnd:game.zones[game.zone]?.end,waveLive:game.waveLive,enemies:game.enemies.map(e=>({hp:e.hp,x:e.x,y:e.y,face:e.face,windup:e.windup,kind:e.kind,airborne:!!e.air,landed:e.floorTime>0})),player:{x:player.x,y:player.y,hp:player.hp,attack:player.attack?.kind||null,attackDir:player.attack?.dir||null,jump:!!player.jump,jumpZ:player.jumpZ,crouch:player.crouch,dash:!!player.dash,down:player.down?.kind||null,slam:player.slam?.phase||null},poses:{move:poses.move.length,walk:poses.walk.length,jump:poses.jump.length,fall:poses.fall.length},shockwaves:game.shockwaves.length,projectiles:game.projectiles.map(p=>({x:p.x,y:p.y,vx:p.vx,vy:p.vy,face:p.face})),gold:wallet.gold,owned:[...(wallet.owned||[])],equipped:wallet.equipped,arrests:game.arrests,lastAttack:game.lastAttack});

  window.AlleyGame={debug:{addDopa,hurt:d=>damagePlayer(d,player.x+60),player:()=>player},hold:s=>{game.freeze=Math.max(game.freeze,s);},useCard,canUseCard:()=>game.mode==='playing'&&!player.grab&&player.hp>0,start:reset,focus:()=>{cvs.focus();},state:()=>({stage:activeStage,mode:game.mode,zone:game.zone,packs:packIndex,enemies:game.enemies.length,time:game.elapsed,checkpoint:wallet.checkpoint[activeStage]||0})};
  if(new URLSearchParams(location.search).has('qa'))window.__alleyQA={
    get game(){return game;},get player(){return player;},get types(){return TYPES;},get waves(){return WAVES;},get assetsFailed(){return assetsFailed;},
    femaleEnemy,femaleHealth,enemyActionRate,enemyReach,applyDifficulty,updateBossPressure,updateReinforcements,GRAB_LINES,drawGrabOverlay,beginGrab,mashGrab,releaseGrab,drawGrab,dash,moves,comboChain,femaleAttack,makePlan,spawnPack,regionalAttack,regionalStyle,regionalVisibleY,combatBeat,enemyBodyMotion,comicWeaponPhase,comicWeaponPose,heroTrailSamples,hipHeartSamples,pushSkill,beginCharge,releaseCharge,SKILLS,enemyAttackStyle,update,damagePlayer,hitEnemy,attack,jump,spawnWave,finish,clearInput,drawWorld,poses,images,throwEnemyProjectile,drawFighter,drawProjectile,drawAttackEffect,updateCombatArt,defeatEnemy,emitBlast,
    teleport(x,y){player.x=x;player.y=y;game.camera=clamp(x-345,0,WORLD_W-W);},
    clearPack(){for(const e of game.enemies){e.hp=0;e.exit=null;}game.enemies=[];update(.016);},
    move(dx,dy){joystick.x=dx;joystick.y=dy;},input
  };
  game.skillRings=[];game.heartBursts=[];WAVES=makePlan(1);makeProps();refreshHud();refreshSkillHud();

})();
