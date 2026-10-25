/* GAIA Detective Brawler MVP — original character art, Gold Quest-style attack geometry.
   This is a separate game. It never reads/writes the detective card-game save. */
(() => {
  'use strict';
  const cvs = document.getElementById('scene');
  const ctx = cvs.getContext('2d', { alpha: false });
  const $ = id => document.getElementById(id);
  const W = 960, H = 540;
  let WORLD_W = 3160;
  const Y_MIN = 340, Y_MAX = 493;
  const ASSET = {
    alley: 'assets/bg_alley_land.jpg',
    hero: 'assets/hero.png', barbari: 'assets/barbari.png',
    bouncer: 'assets/bouncer.png', mohawk: 'assets/mohawk.png',
    paddle: 'assets/paddle.webp',
    lowerPrep: 'assets/rozie_lower_prep.png', lowerHit: 'assets/rozie_lower_hit.png',
    upperPrep: 'assets/rozie_upper_prep.png', upperHit: 'assets/rozie_upper_hit.png'
  };
  const CARD_LIST = [
    {id:'C15',name:'미란다 원칙 복창',price:20,description:'28 피해, 체력 절반 이하 2배. 쿨타임 6초.',symbol:'⚖',kind:'miranda',cooldown:6},
    {id:'C24',name:'무적의 형사 수갑',price:40,description:'근처 적 3초 봉쇄, 공격 약화. 쿨타임 12초.',symbol:'⌁',kind:'cuffs',cooldown:12},
    {id:'C25',name:'구속영장 청구 타격',price:55,description:'42 피해, 체력 30% 이하 2배. 쿨타임 9초.',symbol:'✦',kind:'warrant',cooldown:9}
  ];
  const WAVES = [
    ['barbari','barbari'],
    ['mohawk','barbari','mohawk'],
    ['bouncer','mohawk','barbari'],
    ['bouncer','bouncer','mohawk']
  ];
  const TYPES = {
    barbari:{name:'바바리맨',hp:42,attack:6,speed:98,drawH:139,reach:68},
    bouncer:{name:'클럽 바운서',hp:50,attack:8,speed:89,drawH:148,reach:73},
    mohawk:{name:'모히칸 양아치',hp:38,attack:5,speed:111,drawH:142,reach:66}
  };
  const savedKey = 'gaia_detective_brawler_mvp_v1';
  let wallet = {gold:80,owned:[],equipped:null,lifetime:0};
  try { const raw = JSON.parse(localStorage.getItem(savedKey)); if(raw&&Number.isFinite(raw.gold)){
    const owned=(raw.owned||raw.stock||[]).filter(id=>CARD_LIST.some(c=>c.id===id));
    wallet={gold:Math.max(0,raw.gold),owned:[...new Set(owned)],equipped:owned.includes(raw.equipped)?raw.equipped:(owned[0]||null),lifetime:raw.lifetime||0};
  }} catch (_) {}
  const save = () => { try {localStorage.setItem(savedKey,JSON.stringify(wallet));} catch (_) {} };
  const images = {};
  for(const [key,src] of Object.entries(ASSET)){
    const img = new Image(); img.src = src; images[key] = img;
    img.onerror = () => { console.warn('Asset unavailable:',src); };
  }
  const player = {x:148,y:428,face:1,hp:160,maxHp:160,invuln:0,hurt:0,attack:null,attackCooldown:0,skillCooldown:0,anim:0,stun:0,combo:0,comboTime:0};
  const game = {mode:'menu',oldMode:'menu',zone:0,waveLive:false,arrests:0,seed:Date.now(),camera:0,elapsed:0,particles:[],props:[],shake:0,freeze:0,tip:'',tipTime:0,enemies:[],lastAttack:null};
  let toastTimer=0, audioCtx=null;
  const clamp = (v,a,b) => Math.max(a,Math.min(b,v));
  const randFactory = s => () => {s^=s<<13;s^=s>>>17;s^=s<<5;return (s>>>0)/4294967296;};
  const $modal=$('modal'),$intro=$('introPanel'),$shop=$('shopPanel'),$result=$('resultPanel');
  let joystick={active:false,x:0,y:0,pid:null};
  const held=new Set();
  const input={punch:false,kick:false,skill:false};
  function showPanel(panel){$modal.classList.remove('hidden');for(const p of [$intro,$shop,$result])p.classList.toggle('hidden',p!==panel);}
  function hidePanels(){$modal.classList.add('hidden');}
  function toast(message,seconds=2.2){$('toast').textContent=message;$('toast').classList.add('show');toastTimer=seconds;}
  function sound(kind){
    try {audioCtx=audioCtx||new (window.AudioContext||window.webkitAudioContext)();if(audioCtx.state==='suspended')audioCtx.resume();
      const osc=audioCtx.createOscillator(),g=audioCtx.createGain(),now=audioCtx.currentTime;
      osc.connect(g);g.connect(audioCtx.destination);osc.type=kind==='kick'?'sawtooth':kind==='card'?'sine':'triangle';
      osc.frequency.setValueAtTime(kind==='card'?720:kind==='hurt'?160:kind==='kick'?90:220,now);
      osc.frequency.exponentialRampToValueAtTime(kind==='card'?280:45,now+.10);
      g.gain.setValueAtTime(kind==='hurt'?.07:.115,now);g.gain.exponentialRampToValueAtTime(.001,now+.11);
      osc.start(now);osc.stop(now+.12);
    } catch(_) {}
  }
  function refreshHud(){
    $('hpFill').style.width=`${100*player.hp/player.maxHp}%`;
    $('hpText').textContent=`${Math.ceil(player.hp)}/${player.maxHp}`;
    $('coins').textContent=wallet.gold;
    $('arrests').textContent=game.arrests;
    $('combo').textContent=player.combo;
    $('stageLabel').textContent=`${Math.min(4,game.zone+1)}구역 / 뒷골목`;
    const card=CARD_LIST.find(c=>c.id===wallet.equipped);
    $('skillLabel').textContent=card?(player.skillCooldown>0?`대기 ${Math.ceil(player.skillCooldown)}초`:card.name.slice(0,7)):'카드 없음';
    $('shopMoney').textContent=`${wallet.gold} G`;
  }
  function renderShop(){
    $('shopCards').innerHTML='';
    for(const c of CARD_LIST){
      const box=document.createElement('div');box.className='shop-card';
      box.innerHTML=`<span class="overline">${c.id} · 원본 카드</span><div style="font-size:26px">${c.symbol}</div><strong>${c.name}</strong><small>${c.description}</small>`;
      const owned=wallet.owned.includes(c.id);
      const btn=document.createElement('button');btn.textContent=owned?(wallet.equipped===c.id?'장착 중 ✓':'장착하기'):`${c.price} G · 해금`;
      btn.disabled=(!owned&&wallet.gold<c.price)||wallet.equipped===c.id;
      btn.onclick=()=>{if(!wallet.owned.includes(c.id)){if(wallet.gold<c.price)return;wallet.gold-=c.price;wallet.owned.push(c.id);toast(`${c.name} 스킬 해금!`);}wallet.equipped=c.id;player.skillCooldown=0;save();renderShop();refreshHud();sound('card');};
      box.appendChild(btn);$('shopCards').appendChild(box);
    }
    refreshHud();
  }
  function openShop(){game.oldMode=game.mode;game.mode='shop';renderShop();showPanel($shop);}
  function closeShop(){game.mode=game.oldMode==='shop'?'menu':game.oldMode;if(game.mode==='playing')hidePanels();else showPanel(['menu','paused'].includes(game.mode)?$intro:$result);}
  // Golden Quest dungeon idea, adjusted for side-scrolling: seeded adjacent rooms
  // (random widths and entry corridors) but a guaranteed passable horizontal path.
  // Decor is generated from the same seed so every deployment gets a new field.
  function generateLayout(){
    const rng=randFactory(game.seed|0),zones=[];
    let cursor=0;
    for(let i=0;i<WAVES.length;i++){
      const corridor=75+Math.floor(rng()*75);
      const length=660+Math.floor(rng()*220);
      const zone={start:cursor,end:cursor+length,corridor};
      zones.push(zone);cursor+=length;
    }
    game.zones=zones;WORLD_W=cursor;
  }
  function makeProps(){
    generateLayout();game.props=[];const rng=randFactory((game.seed^0x6a51)|0);
    for(let z=0;z<game.zones.length;z++){
      const zone=game.zones[z];
      // Decoration slots are seeded like the ARPG dungeon rooms. Their collision is shallow.
      for(let j=0;j<6;j++){
        const x=zone.start+zone.corridor+32+j*(zone.end-zone.start-zone.corridor-65)/6+(rng()-.5)*28;
        const roll=rng();
        game.props.push({x,y:roll>.57?302:roll>.2?325:487,kind:roll>.57?'paddle':roll>.25?'mannequin':'planter',hue:z%2});
      }
    }
  }
  function reset(newSeed=true){
    if(newSeed)game.seed=(Math.random()*0x7fffffff)|0;
    game.zone=0;game.waveLive=false;game.arrests=0;game.camera=0;game.elapsed=0;game.enemies=[];game.particles=[];game.shake=0;game.freeze=0;game.lastAttack=null;
    Object.assign(player,{x:145,y:435,face:1,hp:160,invuln:0,hurt:0,attack:null,attackCooldown:0,skillCooldown:0,stun:0,combo:0,comboTime:0});
    makeProps();game.mode='playing';hidePanels();
    spawnWave(0);toast('뒷골목 수사 시작! 범죄자들을 체포하세요.',2.7);refreshHud();
  }
  function spawnWave(zone){
    if(zone>=4){finish(true);return;}
    game.zone=zone;game.waveLive=true;game.enemies=[];
    const rng=randFactory((game.seed+zone*13337)|0);
    WAVES[zone].forEach((kind,i)=>{
      const def=TYPES[kind];const hue=[0,0,35,-30,18][i%5];
      game.enemies.push({kind,name:def.name,x:game.zones[zone].start+290+i*95+rng()*35,y:370+rng()*108,face:-1,hp:def.hp,maxHp:def.hp,invuln:0,hurt:0,stun:0,staggerResist:0,windup:0,attackCd:.8+rng()*.5,swing:0,colorShift:hue,id:zone*10+i,powerDown:0,bind:0});
    });
    $('stageLabel').textContent=`${zone+1}구역 / 뒷골목`;
    toast(zone===0?'바바리맨 출현!':`${zone+1}구역 출현! 옷 색이 다른 녀석들입니다.`,2.2);
  }
  function particle(x,y,label,color='#fff6bd',size=21){game.particles.push({x,y,label,color,size,age:0,life:.83,vx:(Math.random()-.5)*38,vy:-76-Math.random()*26});}
  // Gold Quest-style sword crescent and spear lane: visual effects and damage
  // both use the same directional reach/side-width parameters.
  const moves={
    punch:{dur:.28,impact:.43,near:20,reach:153,width:62,damage:13,stagger:.17,kb:13,maxHits:1},
    kick:{dur:.72,impact:.62,near:28,reach:225,width:44,damage:30,stagger:.73,kb:104,maxHits:Infinity}
  };
  function attack(kind){
    if(game.mode!=='playing'||player.stun>0||player.attackCooldown>0||player.hp<=0)return;
    const cfg=moves[kind];player.attack={kind,age:0,hit:false,dir:player.face};
    player.attackCooldown=cfg.dur*1.12;player.anim=.22;sound(kind);
  }
  function hitEnemy(e,amount,kb,stagger,sourceX,crit=false,forceDir=0,strong=false){
    if(e.hp<=0||e.invuln>0)return false;
    e.hp=Math.max(0,e.hp-amount);e.hurt=.21;
    if(e.staggerResist<=0||strong){e.stun=Math.max(e.stun,stagger);e.staggerResist=.92;}
    e.invuln=.12;
    e.x=clamp(e.x+(forceDir||Math.sign(e.x-sourceX||player.face))*kb,50,WORLD_W-50);
    particle(e.x,e.y-118,`${crit?'✦ ':''}-${amount}`,crit?'#ffee70':'#ffffff',crit?26:21);
    game.shake=Math.max(game.shake,crit?7:3);game.freeze=.032;player.combo++;player.comboTime=2.1;
    if(e.hp<=0){
      game.arrests++;wallet.lifetime++;const reward=10+(e.kind==='bouncer'?10:0)+(e.colorShift?2:0);
      wallet.gold+=reward;save();particle(e.x,e.y-156,'체포! +'+reward+'G','#baffdb',26);
      game.shake=7;sound('card');
    }
    refreshHud();return true;
  }
  function resolveAttack(a){
    const cfg=moves[a.kind];const hits=[];
    for(const e of game.enemies){
      if(e.hp<=0)continue;
      const dx=e.x-player.x,dy=(e.y-player.y)*1.12;
      const along=dx*a.dir,side=Math.abs(dy);
      if(along>=cfg.near&&along<=cfg.reach&&side<=cfg.width)hits.push({e,along});
    }
    hits.sort((a,b)=>a.along-b.along);
    const dealt=hits.slice(0,cfg.maxHits);
    let struck=0;
    for(const h of dealt){
      if(hitEnemy(h.e,cfg.damage,cfg.kb,cfg.stagger,player.x,false,a.dir,a.kind==='kick'))struck++;
    }
    game.lastAttack={kind:a.kind,dir:a.dir,targets:struck,reach:cfg.reach,knockback:cfg.kb};
    if(!struck&&a.kind==='punch')particle(player.x+a.dir*105,player.y-105,'휙','#fff7e3',14);
    if(struck&&a.kind==='kick')particle(player.x+a.dir*155,player.y-118,'쿵!','#fff0bc',25);
  }
  function hurtPlayer(e){
    if(player.invuln>0||player.hp<=0||game.mode!=='playing')return;
    const d=Math.max(2,TYPES[e.kind].attack-(e.powerDown>0?3:0));
    player.hp=Math.max(0,player.hp-d);player.invuln=.72;player.hurt=.25;player.stun=.18;
    player.x=clamp(player.x+Math.sign(player.x-e.x||-e.face)*23,45,WORLD_W-60);
    player.combo=0;particle(player.x,player.y-151,`-${d}`,'#ff6a87',26);game.shake=8;game.freeze=.06;sound('hurt');refreshHud();
    if(player.hp===0)finish(false);
  }
  function nearestEnemy(range=Infinity){
    let best=null,dist=range;
    for(const e of game.enemies){if(e.hp<=0)continue;const d=Math.hypot(e.x-player.x,(e.y-player.y)*1.4);if(d<dist){dist=d;best=e;}}
    return best;
  }
  function useCard(){
    if(game.mode!=='playing'||player.stun>0)return;
    const card=CARD_LIST.find(c=>c.id===wallet.equipped);
    if(!card){toast('스킬카드를 경찰서 매점에서 구매하세요.');return;}
    if(player.skillCooldown>0)return;
    const targets=game.enemies.filter(e=>e.hp>0&&Math.hypot(e.x-player.x,(e.y-player.y)*1.3)<205);
    if(targets.length===0){toast('카드를 사용할 범죄자가 근처에 없습니다.');return;}
    player.skillCooldown=card.cooldown;particle(player.x,player.y-186,card.name,'#fff5a4',20);game.shake=6;sound('card');
    if(card.kind==='miranda'||card.kind==='warrant'){
      const target=nearestEnemy(205);
      if(target){let damage=card.kind==='miranda'?28:42;const ratio=card.kind==='miranda'?.5:.3;
        if(target.hp/target.maxHp<=ratio)damage*=2;
        hitEnemy(target,damage,65,.8,player.x,true);
      }
    } else {
      for(const e of targets){e.bind=Math.max(e.bind,3);e.powerDown=Math.max(e.powerDown,8);particle(e.x,e.y-140,'⛓ 봉쇄','#b8fff0',19);}
    }
    refreshHud();
  }
  function finish(won){
    game.mode=won?'won':'lost';$('resultKicker').textContent=won?'MISSION COMPLETE':'MISSION FAILED';
    $('resultTitle').textContent=won?'뒷골목 수사 완료!':'로지, 잠깐 휴식합니다!';
    $('resultDesc').textContent=won?`총 ${game.arrests}명 체포! ${wallet.gold}G 보유. 새 지도 배치로 재출동할 수 있습니다.`:'경찰서에서 카드 스킬을 보충해 다시 출동하세요.';
    showPanel($result);refreshHud();
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
    game.elapsed+=dt;player.invuln=Math.max(0,player.invuln-dt);player.hurt=Math.max(0,player.hurt-dt);
    player.stun=Math.max(0,player.stun-dt);player.attackCooldown=Math.max(0,player.attackCooldown-dt);
    const oldSkillSec=Math.ceil(player.skillCooldown);player.skillCooldown=Math.max(0,player.skillCooldown-dt);
    if(Math.ceil(player.skillCooldown)!==oldSkillSec)refreshHud();
    player.comboTime=Math.max(0,player.comboTime-dt);if(player.comboTime===0&&player.combo!==0){player.combo=0;refreshHud();}
    game.shake=Math.max(0,game.shake-dt*21);game.freeze=Math.max(0,game.freeze-dt);
    if(input.punch){attack('punch');}if(input.kick){attack('kick');}if(input.skill){input.skill=false;useCard();}
    if(player.attack){const move=moves[player.attack.kind];player.attack.age+=dt;if(!player.attack.hit&&player.attack.age>=move.dur*move.impact){player.attack.hit=true;resolveAttack(player.attack);}if(player.attack.age>=move.dur)player.attack=null;}
    const [dx,dy]=moveVector();if(dx!==0)player.face=Math.sign(dx);
    if(player.stun===0){const limit=game.waveLive?game.zones[game.zone].end-105:WORLD_W-80;
      player.x=clamp(player.x+dx*216*dt,55,limit);
      player.y=clamp(player.y+dy*169*dt,Y_MIN,Y_MAX);
    }
    for(const e of game.enemies){
      if(e.hp<=0)continue;
      e.invuln=Math.max(0,e.invuln-dt);e.hurt=Math.max(0,e.hurt-dt);e.stun=Math.max(0,e.stun-dt);e.staggerResist=Math.max(0,e.staggerResist-dt);e.bind=Math.max(0,e.bind-dt);e.powerDown=Math.max(0,e.powerDown-dt);
      e.attackCd=Math.max(0,e.attackCd-dt);e.swing=Math.max(0,e.swing-dt);
      if(e.bind>0||e.stun>0)continue;
      const deltaX=player.x-e.x,deltaY=player.y-e.y,dist=Math.hypot(deltaX,deltaY*1.35);
      if(Math.abs(deltaX)>3)e.face=Math.sign(deltaX);
      if(e.windup>0){
        e.windup-=dt;
        if(e.windup<=0){e.swing=.27;e.attackCd=1.0+Math.random()*.52;
          if(Math.abs(player.x-e.x)<TYPES[e.kind].reach+8&&Math.abs(deltaY)<53)hurtPlayer(e);
        }
      } else if(dist<TYPES[e.kind].reach&&Math.abs(deltaY)<52){
        if(e.attackCd===0)e.windup=.36;
      } else if(dist<620){
        const speed=TYPES[e.kind].speed;
        e.x+=Math.sign(deltaX)*speed*dt*(Math.abs(deltaX)>64?1:.22);
        e.y+=Math.sign(deltaY)*speed*.73*dt*(Math.abs(deltaY)>21?1:.22);
        e.y=clamp(e.y,Y_MIN,Y_MAX);
      }
    }
    game.enemies=game.enemies.filter(e=>e.hp>0||e.hurt>0);
    if(game.waveLive&&game.enemies.every(e=>e.hp<=0)){
      game.waveLive=false;
      const next=game.zone+1;
      if(next===4){finish(true);return;}
      game.zone=next;
      toast('구역 정리 완료! 오른쪽으로 전진하세요. ➜',2.7);
      refreshHud();
    } else if(!game.waveLive&&game.zone<4&&player.x>game.zones[game.zone].start+90){spawnWave(game.zone);}
    game.camera+=((clamp(player.x-345,0,WORLD_W-W))-game.camera)*Math.min(1,dt*4.4);
    for(const p of game.particles){p.age+=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;}
    game.particles=game.particles.filter(p=>p.age<p.life);
  }
  function backdrop(){
    // The card game's original landscape background repeats at its native ratio.
    // No destructible map layer, hidden illustration, or tile-hole compositing.
    const img=images.alley;
    if(img&&img.complete&&img.naturalWidth&&img.naturalHeight){
      const tileW=H*img.naturalWidth/img.naturalHeight;
      const start=Math.floor(game.camera/tileW);
      for(let i=start;i*tileW<game.camera+W;i++){
        const sx=Math.round(i*tileW-game.camera);
        ctx.drawImage(img,sx,0,Math.ceil(tileW)+1,H);
      }
    }else{
      const g=ctx.createLinearGradient(0,0,W,H);
      g.addColorStop(0,'#faafc8');g.addColorStop(1,'#b6a7d3');
      ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
    }
  }
  function roundRect(x,y,w,h,r){ctx.beginPath();ctx.roundRect(x,y,w,h,r);}
  function drawProp(p){
    const x=p.x-game.camera;if(x<-120||x>W+120)return;
    const y=p.y;
    ctx.save();ctx.translate(x,y);ctx.globalAlpha=.94;
    if(p.kind==='paddle'){
      ctx.fillStyle='#c37e8d';ctx.fillRect(-4,-63,8,63);
      if(images.paddle.complete&&images.paddle.naturalWidth)ctx.drawImage(images.paddle,-27,-107,54,94);
      else{ctx.fillStyle='#ffa0be';ctx.font='57px sans-serif';ctx.fillText('♥',-26,-45);}
      ctx.fillStyle='#ba839f';ctx.fillRect(-20,-4,40,6);
    }else if(p.kind==='mannequin'){
      ctx.fillStyle='#785875';ctx.fillRect(-3,-22,6,24);ctx.fillRect(-18,0,36,5);
      ctx.fillStyle='#f5c4b7';roundRect(-20,-81,40,65,14);ctx.fill();
      ctx.strokeStyle=p.hue?'#cc7bbd':'#ed7799';ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(-15,-70);ctx.lineTo(15,-26);ctx.moveTo(15,-70);ctx.lineTo(-15,-26);ctx.stroke();
      ctx.fillStyle='#ffe6ae';ctx.beginPath();ctx.arc(0,-49,7,0,Math.PI*2);ctx.fill();
    }else{
      ctx.fillStyle='#e59bca';ctx.fillRect(-24,-26,48,29);ctx.fillStyle='#71c59e';ctx.font='37px sans-serif';ctx.fillText('✿',-18,-22);
    }
    ctx.restore();
  }
  function drawAttackEffect(a){
    const move=moves[a.kind],t=clamp(a.age/move.dur,0,1);
    if(a.kind==='punch'){
      if(t<.07||t>.96)return;
      const swipe=clamp((t-.07)/.78,0,1),glow=Math.sin(Math.PI*swipe);
      ctx.save();ctx.translate(9+swipe*12,-106);ctx.globalAlpha=Math.max(.05,glow)*.92;
      const grad=ctx.createLinearGradient(37,-65,154,66);
      grad.addColorStop(0,'#fffdf3');grad.addColorStop(.55,'#fff7b5');grad.addColorStop(1,'#f58cb9');
      ctx.fillStyle=grad;
      // Crescent strike: the displayed sweep covers the same front area as punch reach.
      ctx.beginPath();ctx.ellipse(77,0,78,65,0,-1.35,1.35);
      ctx.ellipse(76,0,54,44,0,1.35,-1.35,true);ctx.closePath();ctx.fill();
      ctx.strokeStyle='#fffdf4';ctx.lineWidth=3;ctx.stroke();
      ctx.strokeStyle='#ffe7f2aa';ctx.lineWidth=4;
      for(let i=0;i<2;i++){
        ctx.beginPath();ctx.moveTo(17-i*13,-43+i*17);
        ctx.quadraticCurveTo(45-i*9,-60+i*24,87-i*7,-66+i*37);ctx.stroke();
      }
      ctx.restore();
    }else{
      // Slow wind-up; at impact the spear-shaped wave reaches all targets in its lane.
      if(t<.28||t>.98)return;
      const extend=clamp((t-.28)/(.62-.28),0,1);
      const fade=t>.8?Math.max(0,(.98-t)/.18):1;
      const tip=32+(move.reach-32)*extend;
      ctx.save();ctx.translate(0,-108);ctx.globalAlpha=fade*.91;
      const grad=ctx.createLinearGradient(28,0,tip,0);
      grad.addColorStop(0,'#fff6cf');grad.addColorStop(.48,'#fffdf4');grad.addColorStop(1,'#95f4ef');
      ctx.fillStyle=grad;ctx.strokeStyle='#fff5c8';ctx.lineWidth=3;
      ctx.beginPath();ctx.moveTo(32,-13);ctx.lineTo(Math.max(34,tip-30),-14);
      ctx.lineTo(tip,0);ctx.lineTo(Math.max(34,tip-30),14);
      ctx.lineTo(32,13);ctx.lineTo(53,0);ctx.closePath();ctx.fill();ctx.stroke();
      ctx.strokeStyle='#ffc0d9';ctx.lineWidth=5;
      ctx.beginPath();ctx.moveTo(20,-24);ctx.lineTo(Math.max(25,tip-51),-18);
      ctx.moveTo(19,23);ctx.lineTo(Math.max(25,tip-59),18);ctx.stroke();
      ctx.restore();
    }
  }
  function drawFighter(unit,hero=false){
    const img=images[hero?'hero':unit.kind];if(!img||!img.complete||!img.naturalWidth)return;
    const x=unit.x-game.camera,groundY=unit.y;
    const h=hero?169:TYPES[unit.kind].drawH;
    const w=h*(img.naturalWidth/img.naturalHeight);
    if(x<-170||x>W+170)return;
    ctx.save();ctx.translate(x,groundY);
    const blinking=unit.hurt>0||unit.invuln>0;
    if(blinking&&Math.floor(game.elapsed*23)%2===0)ctx.globalAlpha=.38;
    ctx.fillStyle='#6047634d';ctx.beginPath();ctx.ellipse(0,-2,w*.38,11,0,0,Math.PI*2);ctx.fill();
    ctx.scale(hero&&unit.attack?unit.attack.dir:unit.face,1);ctx.filter=hero?'none':unit.colorShift?`hue-rotate(${unit.colorShift}deg)`: 'none';
    const walkBob=hero&&Math.hypot(...moveVector())>.2?Math.abs(Math.sin(game.elapsed*12))*3:0;
    const attackSpriteKey=hero&&unit.attack?
      `${unit.attack.kind==='punch'?'upper':'lower'}${unit.attack.age/moves[unit.attack.kind].dur<.42?'Prep':'Hit'}`:null;
    const attackSprite=attackSpriteKey?images[attackSpriteKey]:null;
    if(attackSprite&&attackSprite.complete&&attackSprite.naturalWidth){
      const poseH=h,poseW=poseH*attackSprite.naturalWidth/attackSprite.naturalHeight;
      // Upper/chest pose faces left in source; lower/hip pose faces right (backward stance).
      ctx.save();ctx.scale(unit.attack.kind==='kick'?1:-1,1);
      ctx.drawImage(attackSprite,-poseW*.5,-poseH,poseW,poseH);ctx.restore();
    } else ctx.drawImage(img,-w*.5,-h-walkBob,w,h);
    ctx.filter='none';
    if(hero&&unit.attack)drawAttackEffect(unit.attack);
    const anim=hero?unit.attack:unit.swing>0?{kind:'punch',age:.14}:null;
    if(anim&&(!hero||!attackSprite?.complete||!attackSprite.naturalWidth)){
      const prog=hero?anim.age/moves[anim.kind].dur:.6;
      const thrust=Math.sin(Math.PI*clamp(prog,0,1));
      ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle=hero?'#f1b8a4':'#e7bda6';ctx.lineWidth=hero?13:12;
      ctx.beginPath();
      if(anim.kind==='kick'){ctx.moveTo(14,-47);ctx.lineTo(24+thrust*71,-31-thrust*7);ctx.stroke();ctx.fillStyle=hero?'#2e2134':'#554260';roundRect(20+thrust*70,-40,29,18,6);ctx.fill();}
      else{ctx.moveTo(14,-h*.68);ctx.lineTo(21+thrust*76,-h*.64);ctx.stroke();ctx.fillStyle=hero?'#24202f':'#ba748b';ctx.beginPath();ctx.arc(23+thrust*76,-h*.64,12,0,Math.PI*2);ctx.fill();}
      if(thrust>.6){ctx.fillStyle='#ffe087';ctx.font='23px sans-serif';ctx.fillText('✦',75,-h*.70);}
    }
    ctx.restore();
    if(!hero){
      ctx.save();ctx.fillStyle='#4f3958cc';roundRect(x-w*.43,groundY-h-16,w*.86,7,3);ctx.fill();ctx.fillStyle=unit.hurt>0?'#ffe89b':'#77e2b3';roundRect(x-w*.43,groundY-h-16,w*.86*Math.max(0,unit.hp/unit.maxHp),7,3);ctx.fill();
      ctx.font='bold 12px system-ui';ctx.textAlign='center';ctx.strokeStyle='#624257';ctx.lineWidth=3;ctx.strokeText(unit.name,x,groundY-h-21);ctx.fillStyle='#fff';ctx.fillText(unit.name,x,groundY-h-21);
      if(unit.windup>0){ctx.fillStyle='#ff5e7c';ctx.font='bold 27px sans-serif';ctx.fillText('!',x,groundY-h-47);}
      if(unit.bind>0){ctx.fillStyle='#b8fff0';ctx.font='22px sans-serif';ctx.fillText('⌁',x+23,groundY-h-30);}
      ctx.restore();
    }
  }
  function drawWorld(){
    ctx.save();if(game.shake>0)ctx.translate((Math.random()-.5)*game.shake,(Math.random()-.5)*game.shake*.5);
    backdrop();
    const objects=[...game.props.map(p=>({y:p.y,draw:()=>drawProp(p)})),...game.enemies.filter(e=>e.hp>0).map(e=>({y:e.y,draw:()=>drawFighter(e)})),{y:player.y,draw:()=>drawFighter(player,true)}];
    objects.sort((a,b)=>a.y-b.y);for(const o of objects)o.draw();
    ctx.restore();
    for(const p of game.particles){ctx.save();ctx.globalAlpha=1-p.age/p.life;ctx.font=`900 ${p.size}px system-ui`;ctx.textAlign='center';ctx.lineWidth=4;ctx.strokeStyle='#694369';ctx.strokeText(p.label,p.x-game.camera,p.y);ctx.fillStyle=p.color;ctx.fillText(p.label,p.x-game.camera,p.y);ctx.restore();}
    if(game.mode==='playing'){
      ctx.fillStyle='#fff3e4cf';roundRect(337,508,285,18,9);ctx.fill();
      ctx.fillStyle='#e88ab7';roundRect(340,511,279*clamp(player.x/WORLD_W,0,1),12,7);ctx.fill();
      ctx.fillStyle='#68445e';ctx.font='bold 11px system-ui';ctx.textAlign='center';ctx.fillText('뒷골목 순찰 진행',481,521);
    }
  }
  let last=performance.now();function frame(now){const dt=Math.min(.04,(now-last)/1000||.016);last=now;update(dt);drawWorld();requestAnimationFrame(frame);}requestAnimationFrame(frame);
  $('start').addEventListener('click',()=>{if(game.mode==='paused'){game.mode='playing';hidePanels();$('start').textContent='뒷골목 출동 ▶';}else reset();});
  $('restart').addEventListener('click',()=>reset());
  $('shopOpen').addEventListener('click',openShop);$('introShop').addEventListener('click',openShop);$('resultShop').addEventListener('click',openShop);
  $('shopClose').addEventListener('click',closeShop);
  $('pause').addEventListener('click',()=>{if(game.mode==='playing'){game.mode='paused';showPanel($intro);$('start').textContent='수사 계속하기 ▶';}else if(game.mode==='paused'){game.mode='playing';hidePanels();$('start').textContent='뒷골목 출동 ▶';}});
  $('fullScreen').addEventListener('click',async()=>{try{if(!document.fullscreenElement)await $('game-shell').requestFullscreen();else await document.exitFullscreen();if(screen.orientation?.lock&&document.fullscreenElement)await screen.orientation.lock('landscape').catch(()=>{});}catch(_){toast('기기에서 전체화면을 지원하지 않습니다.');}});
  // Touch buttons hold for repeat attacks, J/K repeat while held on keyboard too.
  for(const key of ['punch','kick','skill']){
    const el=$(key);const release=()=>{input[key]=false;el.classList.remove('pressed');};
    el.addEventListener('pointerdown',e=>{e.preventDefault();el.setPointerCapture(e.pointerId);input[key]=true;el.classList.add('pressed');});
    for(const ev of ['pointerup','pointercancel','lostpointercapture'])el.addEventListener(ev,release);
  }
  const joy=$('joystick'),stick=$('stick');
  function moveStick(e){const r=joy.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;
    let dx=(e.clientX-cx)/(r.width*.34),dy=(e.clientY-cy)/(r.height*.34),mag=Math.hypot(dx,dy);if(mag>1){dx/=mag;dy/=mag;}
    joystick.x=dx;joystick.y=dy;stick.style.transform=`translate(calc(-50% + ${dx*34}px),calc(-50% + ${dy*34}px))`;
  }
  joy.addEventListener('pointerdown',e=>{e.preventDefault();joystick.active=true;joystick.pid=e.pointerId;joy.setPointerCapture(e.pointerId);moveStick(e);});
  joy.addEventListener('pointermove',e=>{if(joystick.active&&e.pointerId===joystick.pid)moveStick(e);});
  function joyEnd(e){if(e.pointerId!==joystick.pid)return;joystick.active=false;joystick.x=0;joystick.y=0;stick.style.transform='translate(-50%,-50%)';}
  for(const ev of ['pointerup','pointercancel','lostpointercapture'])joy.addEventListener(ev,joyEnd);
  window.addEventListener('keydown',e=>{
    if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();
    held.add(e.code);
    if(e.repeat)return;
    if(e.code==='KeyJ')input.punch=true;
    if(e.code==='KeyK')input.kick=true;
    if(e.code==='KeyL')input.skill=true;
    if(e.code==='Escape'&&game.mode==='playing')$('pause').click();
  });
  window.addEventListener('keyup',e=>{held.delete(e.code);if(e.code==='KeyJ')input.punch=false;if(e.code==='KeyK')input.kick=false;});
  window.addEventListener('blur',()=>{held.clear();input.punch=false;input.kick=false;input.skill=false;joystick.x=joystick.y=0;});
  // Debug state is read-only: useful to verify collision, waves and shops in browser tests.
  window.__gaiaBrawlerDebug=()=>({mode:game.mode,zone:game.zone,enemies:game.enemies.map(e=>({hp:e.hp,x:e.x,y:e.y,kind:e.kind})),player:{x:player.x,y:player.y,hp:player.hp,attack:player.attack?.kind||null,attackDir:player.attack?.dir||null},gold:wallet.gold,owned:[...wallet.owned],equipped:wallet.equipped,arrests:game.arrests,lastAttack:game.lastAttack});
  makeProps();refreshHud();
})();
