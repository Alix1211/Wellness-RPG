// Run from repository root: node tests/female-enemies.cjs
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const path=require('node:path');const root=path.resolve(__dirname,'../belt-scroll');
const els=new Map();const noop=()=>{};
function element(id){if(els.has(id))return els.get(id);const e={style:{setProperty:noop},classList:{add:noop,remove:noop,toggle:noop},dataset:{},listeners:{},addEventListener(type,fn){(this.listeners[type]??=[]).push(fn)},setPointerCapture:noop,getBoundingClientRect:()=>({left:0,top:0,width:100,height:100}),querySelector:()=>element(id+'child'),focus:noop};if(id==='scene')e.getContext=()=>({});els.set(id,e);return e;}
const c={console,URLSearchParams,location:{search:'?qa'},innerWidth:960,innerHeight:540,performance:{now:()=>0},requestAnimationFrame:noop,setTimeout:noop,clearTimeout:noop,Image:class{complete=false;naturalWidth=0},REGION_ART:{},__GAME_ASSET:{},document:{getElementById:element,querySelectorAll:()=>[],addEventListener:noop,body:{classList:{add:noop,remove:noop}}},DetectiveApp:{state:{hp:160,mp:100,gold:80,stats:{},checkpoint:{},records:{}},save:noop,ready:noop},AlleyAudio:new Proxy({},{get:()=>noop}),addEventListener:noop};c.window=c;vm.createContext(c);
for(const file of ['campaign.js','female-enemies.js','enemy-walk.js','hero-actions.js','game.js'])vm.runInContext(fs.readFileSync(path.join(root,'js',file),'utf8'),c,{filename:file});
const q=c.__alleyQA,F=c.FemaleEnemies,g=q.game,p=q.player;
function reset(){q.clearInput();p.dashCd=0;Object.assign(p,{hp:160,maxHp:160,mp:100,x:400,y:435,face:1,stun:0,attack:null,attackCooldown:0,guard:false,crouch:false,dash:null,jump:null,down:null,slam:null,splash:null,charge:null,skillPose:null,invuln:0,hurt:0,combo:0,cardGuard:0,cardDef:0,cardSpd:0,skillCooldown:0,pushCd:0,chargeCd:0,dopa:0,climaxT:0,climaxCd:0,dazeT:0});Object.assign(g,{mode:'playing',elapsed:0,zone:0,projectiles:[],enemies:[],castaways:[],freeze:0,props:[],waveLive:true,zones:[{start:0,end:1500}]});}
function enemy(kind,x=460,y=435){const d=q.types[kind];return {id:1,kind,name:d.name,x,y,hp:100,maxHp:100,invuln:0,stun:0,staggerResist:0,face:-1,windup:0,swing:0,hurt:0,attackCd:99,entry:0,powerDown:0,bind:0,floorTime:0,motionPhase:0,slotY:0};}

const A=c.HeroActions;function frozenEnemy(kind,x,y=435){return {...enemy(kind,x,y),stun:10};}
function settle(seconds){for(let t=0;t<seconds;t+=.02)q.update(.02);}
function press(id){for(const fn of element(id).listeners.pointerdown||[])fn({preventDefault:noop,pointerId:1,currentTarget:element(id)});}
function release(id){for(const fn of element(id).listeners.pointerup||[])fn({pointerId:1});}
reset();g.enemies=[frozenEnemy('punk',1200)];press('crouch');q.move(1,.4);q.update(.016);assert(p.crouch);assert.equal(A.pose(p),'00');assert.equal(p.x,400);assert.equal(p.y,435);release('crouch');q.update(.016);assert(p.crouch);assert.equal(p.x,400);settle(.75);assert(!p.crouch);assert(p.x>400);console.log('PASS held crouch stops movement; released crouch lingers then stands slowly');
reset();q.input.crouch=true;p.crouch=true;assert(q.damagePlayer(10,p.x+60));assert.equal(p.hp,150);assert(!p.crouch);console.log('PASS crouch replaces guard and does not block damage');
reset();g.enemies=[frozenEnemy('punk',460),frozenEnemy('punk',315)];q.input.crouch=true;q.attack('punch');assert.equal(p.attack.kind,'headbutt');assert.equal(p.attack.age,0);q.move(1,0);settle(.35);assert.equal(g.enemies[0].hp,87);assert.equal(g.enemies[1].hp,100);assert.equal(p.x,400);q.move(0,0);release('crouch');settle(.6);assert.equal(g.enemies[0].hp,87);console.log('PASS crouch + upper starts headbutt immediately, one front hit, no movement or delayed second attack');
reset();g.enemies=[frozenEnemy('punk',480),frozenEnemy('punk',320),frozenEnemy('punk',610)];q.input.crouch=true;q.attack('kick');assert.equal(p.attack.kind,'split');settle(.36);assert.equal(g.enemies[0].hp,72);assert.equal(g.enemies[1].hp,72);assert.equal(g.enemies[2].hp,100);assert.equal(g.enemies[0].air.dir,1);assert.equal(g.enemies[1].air.dir,-1);assert.equal(q.moves.kick.damage,28);assert.equal(q.moves.punch.damage,13);console.log('PASS split hits both sides once with outward knockback; outside range misses; standing damage unchanged');
reset();g.enemies=[frozenEnemy('punk',1200)];q.move(1,0);const hp=p.hp,mp=p.mp;assert(q.dash());assert.equal(A.pose(p),'20');q.update(.09);assert(Math.abs(p.x-520)<.01);q.update(.09);assert(Math.abs(p.x-560)<.01);assert(!p.dash);assert(!q.dash());assert.equal(p.hp,hp);assert(p.mp>=mp);console.log('PASS dash is 160px over 0.18s, ends cleanly, no health/M cost and cooldown blocks retrigger');
reset();g.enemies=[frozenEnemy('punk',1200)];p.x=1450;q.move(1,0);q.dash();q.update(.18);assert.equal(p.x,1465);console.log('PASS dash respects current arena boundary');
reset();g.enemies=[frozenEnemy('punk',1200)];p.face=-1;assert(q.dash());q.update(.18);assert.equal(p.x,240);console.log('PASS without movement input dash follows facing direction');
reset();g.enemies=[frozenEnemy('punk',1200)];p.y=400;q.move(1,1);q.dash();q.update(.18);assert(Math.abs(p.x-(400+160/Math.sqrt(2)))<.01);assert(Math.abs(p.y-(400+96/Math.sqrt(2)))<.01);console.log('PASS directional diagonal dash');
reset();g.enemies=[frozenEnemy('punk',1200)];q.attack('punch');press('dash');q.update(.02);assert(!p.dash);assert(!q.input.dash);settle(1);assert(!p.dash);assert.equal(p.x,400);console.log('PASS dash pressed during an attack is discarded, never queued');
reset();g.enemies=[frozenEnemy('punk',1200)];press('dash');release('dash');q.update(.02);assert(p.dash);q.clearInput();assert(!p.dash&&!p.crouch);assert(!q.input.dash&&!q.input.crouch);console.log('PASS touch dash tap works and pause/input reset cancels new states');
const calls=[];const rc=new Proxy({drawImage(...a){calls.push(a)}},{get:(o,k)=>o[k]||noop});const im={naturalWidth:1728,complete:true};for(const key of Object.keys(A.data)){calls.length=0;A.frame(rc,im,key);const f=A.data[key];assert.equal(calls[0][7],f.rect[2]/2);assert.equal(calls[0][8],f.rect[3]/2);assert(Math.abs(calls[0][6]+calls[0][8])<1);}
console.log('PASS all 12 action poses share fixed anatomical scale and planted ground anchors');

for(const kind of ['punch','kick']){reset();g.enemies=[frozenEnemy('punk',1200)];q.move(1,0);q.dash();q.update(.06);const x=p.x;q.attack(kind);assert(!p.dash);assert.equal(p.attack.kind,kind==='punch'?'dashHug':'dashHip');assert(p.attack.fromDash);assert.equal(p.attack.age,0);assert(p.dashFollow);q.update(.02);assert(p.x>x);assert.equal(q.moves[kind].damage,kind==='punch'?13:28);console.log('PASS dash immediately links '+kind+' with momentum and unchanged damage');}
reset();g.enemies=[frozenEnemy('punk',1200)];q.move(1,0);q.dash();q.update(.05);q.jump();assert(!p.dash);assert(p.jump.fromDash);const jumpX=p.x;q.update(.06);assert(p.x>jumpX);assert(p.jumpZ>18);q.attack('punch');assert(p.splash);assert(!p.dashFollow);console.log('PASS dash links jump and existing airborne upper attack without a queue');
reset();g.enemies=[frozenEnemy('punk',1200)];press('crouch');q.update(.03);release('crouch');settle(.08);q.attack('kick');assert.equal(p.attack.kind,'split');console.log('PASS tap crouch, release, then promptly press lower still gives seated split');
reset();g.enemies=[frozenEnemy('punk',1200)];press('crouch');q.update(.10);assert(p.crouchBlend>0&&p.crouchBlend<1);release('crouch');settle(.08);assert(p.crouch);settle(.20);assert(!p.crouch);assert.equal(p.crouchBlend,0);console.log('PASS gradual sit, faster stand-up (0.10s grace + 0.12s upstroke)');
reset();g.enemies=[frozenEnemy('punk',1200)];q.dash();q.attack('punch');assert(p.dashFollow);q.damagePlayer(10,p.x+60);assert(!p.dashFollow);q.clearInput();assert(!p.crouchHold&&!p.crouchBlend);console.log('PASS hit and pause/input reset clear link momentum and stance grace');

reset();g.enemies=[frozenEnemy('punk',1200)];q.dash();q.jump();q.update(.06);q.attack('kick');assert(p.slam);assert(!p.dashFollow);console.log('PASS dash jump links existing airborne lower slam');
reset();g.enemies=[frozenEnemy('punk',1200)];press('crouch');release('crouch');q.update(.016);assert(p.crouch);q.attack('punch');assert.equal(p.attack.kind,'headbutt');console.log('PASS even a crouch tap between frames remains usable for a seated attack');
for(const kind of ['punch','kick']){reset();g.enemies=[frozenEnemy('punk',570)];q.move(1,0);q.dash();q.update(.06);q.move(0,0);q.attack(kind);settle(.55);assert.equal(g.enemies[0].hp,kind==='punch'?96:94);console.log('PASS linked dash '+kind+' lands low setup damage once');}

reset();const hugged={...enemy('punk',570),id:101,staggerResist:9,windup:.8};g.enemies=[hugged];p.combo=3;q.move(1,0);q.dash();q.update(.06);q.move(0,0);q.attack('punch');q.update(.06);assert.equal(hugged.hp,96);assert(hugged.stun>.9);assert.equal(hugged.windup,0);assert(!hugged.air);assert(!p.dashFollow);const hugX=p.x;settle(.25);assert.equal(p.x,hugX);settle(.3);q.attack('punch');settle(.3);assert.equal(hugged.hp,83);console.log('PASS low-damage hug stuns through resistance, cancels windup, stops close and allows ordinary follow-up');
for(const dir of [-1,1]){reset();const target={...enemy('punk',400+dir*165),id:102};g.enemies=[target];p.combo=3;q.move(dir,0);q.dash();q.update(.06);q.move(0,0);q.attack('kick');settle(.6);assert.equal(target.hp,94);assert((target.x-(400+dir*165))*dir>90);assert(!target.air);assert(!target.floorTime);console.log('PASS sliding hip pushes grounded enemy outward in direction '+dir+' without fourth-hit launch');}
reset();const controlBoss={...enemy('mafiaBoss',570),id:103};g.enemies=[controlBoss];q.move(1,0);q.dash();q.update(.06);q.move(0,0);q.attack('kick');settle(.4);assert.equal(controlBoss.hp,94);assert(controlBoss.x>620);assert(controlBoss.x<=650);assert(!controlBoss.air);console.log('PASS boss receives low damage and shorter grounded knockback');
const hipTransforms=[];const dc=new Proxy({scale(x,y){hipTransforms.push(x)}},{get:(o,k)=>o[k]||noop});const artImages={rosie_actions:{naturalWidth:1560},rosie_hug:{naturalWidth:1400}};for(const dir of [-1,1]){hipTransforms.length=0;A.draw(dc,artImages,{...p,hp:160,stun:0,down:null,jump:null,splash:null,slam:null,charge:null,skillPose:null,dash:null,dashFollow:null,attack:{kind:'dashHip',dir,age:.2},x:0,y:0},g);assert.equal(hipTransforms[0],dir);}
for(const [key,f]of Object.entries(A.hugData)){calls.length=0;A.frame(rc,im,key);assert.equal(calls[0][7],f.rect[2]/2);assert.equal(calls[0][8],f.rect[3]/2);}console.log('PASS hip moves backside-first and all four hug frames keep fixed anatomical scale');

reset();const pushFollow={...enemy('punk',570),id:105};g.enemies=[pushFollow];q.move(1,0);q.dash();q.update(.06);q.move(0,0);q.attack('kick');settle(.6);assert.equal(pushFollow.hp,94);q.attack('punch');settle(.3);assert.equal(pushFollow.hp,81);console.log('PASS grounded sliding push leaves ordinary upper follow-up reachable');
reset();g.enemies=[frozenEnemy('punk',1200)];q.dash();q.update(.18);assert(!p.dash&&p.dashLink);q.attack('kick');assert.equal(p.attack.kind,'dashHip');assert(!p.dashLink);console.log('PASS fresh lower input immediately after dash end starts slide immediately');
reset();g.enemies=[frozenEnemy('punk',1200)];q.dash();q.update(.18);settle(.2);q.attack('kick');assert.equal(p.attack.kind,'kick');console.log('PASS brief dash link window expires; ordinary lower attack remains ordinary');

reset();const wouldGrab=enemy('boxer',p.x+50);g.enemies=[wouldGrab];
assert.equal(q.beginGrab(wouldGrab,'hip'),false);assert(!p.grab&&!wouldGrab.holdingPlayer);
assert(q.damagePlayer(10,wouldGrab.x));assert.equal(p.hp,150);assert(!p.grab);
console.log('PASS grab cut-in disabled; normal damage remains without pausing the fight');
for(const age of [.01,.12,.26,.43])assert.equal(A.pose({...p,hp:160,stun:0,grab:null,jump:null,down:null,slam:null,splash:null,charge:null,skillPose:null,attack:{kind:'dashHug',age}}),'h1');console.log('PASS sliding hug uses the existing open-arm frame and is unchanged');

// Finisher input tests: genuine taps, not held autofire or an old long input buffer.
function tapCombo(kind){press(kind);release(kind);q.update(.016);return p.attack?.kind;}
reset();g.enemies=[frozenEnemy('punk',540)];
assert.equal(tapCombo('punch'),'punch');settle(.51);
assert.equal(tapCombo('punch'),'punch');settle(.51);
assert.equal(tapCombo('kick'),'hipCrash');assert.equal(q.moves.hipCrash.damage,44);
settle(.55);assert.equal(g.enemies[0].hp,56);assert.equal(g.lastAttack.kind,'hipCrash');
assert(!q.comboChain.steps.length);console.log('PASS chest-chest-hip uses the final tap for a strong hip crash; ordinary damage remains 13/28');

reset();g.enemies=[frozenEnemy('punk',545),{...frozenEnemy('punk',255),id:2}];
assert.equal(tapCombo('kick'),'kick');settle(.75);
assert.equal(tapCombo('kick'),'kick');settle(.75);
assert.equal(tapCombo('punch'),'punch');settle(.51);
assert.equal(tapCombo('punch'),'whirlSplit');assert.equal(A.pose(p),'10');
settle(.43);assert.equal(g.enemies[0].hp,80);assert.equal(g.enemies[1].hp,80);
settle(.42);assert.equal(g.enemies[0].hp,55);assert.equal(g.enemies[1].hp,55);
assert.equal(g.lastAttack.kind,'whirlSplit');assert(!q.comboChain.steps.length);
console.log('PASS hip-hip-chest-chest triggers split and two outward spinning attack pulses');

for(const kind of ['punch','kick']){
 reset();g.enemies=[frozenEnemy('punk',1200)];press(kind);settle(4.5);
 assert.equal(q.holdAttacks[kind],3,kind+' held count caps at exactly 3');
 assert.equal(q.basicChain.count,3,kind+' third hit is the finisher');
 assert.equal(p.attack,null,'held attacks must stop after 3, never loop forever');
 assert(q.comboChain.steps.length<=1);release(kind);assert.equal(q.holdAttacks[kind],0);
 press(kind);q.update(.016);assert.equal(p.attack.kind,kind,'new press starts fresh attacks');release(kind);
 console.log('PASS '+kind+' hold stops after three, releases unlock a new attack');
}
reset();const finishingTarget=frozenEnemy('punk',465);finishingTarget.hp=200;finishingTarget.maxHp=200;g.enemies=[finishingTarget];
for(let i=1;i<=3;i++){p.attack=null;p.attackCooldown=0;const start=finishingTarget.x;q.attack('punch');assert.equal(p.attack.basicHit,i);settle(.26);assert.equal(!!finishingTarget.air,i===3,'knockback only on 3rd hit');finishingTarget.invuln=0;finishingTarget.x=start;finishingTarget.air=null;}
console.log('PASS third ordinary upper hit, not earlier hits, applies knockback');
reset();g.enemies=[frozenEnemy('punk',1200)];assert.equal(tapCombo('punch'),'punch');settle(1.25);
assert.equal(tapCombo('punch'),'punch');settle(.51);assert.equal(tapCombo('kick'),'kick');
console.log('PASS an expired input pattern does not fire a finisher');

reset();g.enemies=[frozenEnemy('punk',1200)];tapCombo('punch');settle(.51);p.invuln=0;
assert(q.damagePlayer(3,p.x+60));p.hurt=0;p.stun=0;p.down=null;settle(.51);
tapCombo('punch');settle(.51);assert.equal(tapCombo('kick'),'kick');
console.log('PASS player damage cancels the previous combo sequence');

// Regression for real tablet taps faster than the long lower-attack recovery.
// The fourth physical tap must fire the split without waiting for four animations.
reset();g.enemies=[frozenEnemy('punk',545),{...frozenEnemy('punk',255),id:2}];
for(const kind of ['kick','kick','punch']){press(kind);release(kind);settle(.22);}
press('punch');release('punch');
assert.equal(p.attack.kind,'whirlSplit');assert.equal(p.attack.age,0);
settle(1.2);assert.equal(g.enemies[0].hp,55);assert.equal(g.enemies[1].hp,55);
assert(!q.comboChain.steps.length);console.log('PASS fast 0.22s tablet taps trigger spinning split immediately and land both pulses');

reset();g.enemies=[frozenEnemy('punk',1200)];
for(const kind of ['kick','punch','kick','punch']){press(kind);release(kind);settle(.22);}
assert.notEqual(p.attack?.kind,'whirlSplit');console.log('PASS incorrect four-tap order does not trigger the finisher');

// Three-tap input must be independent of the first/second normal attack cooldown.
reset();g.enemies=[frozenEnemy('punk',540)];
for(const kind of ['punch','punch']){press(kind);release(kind);settle(.08);}
press('kick');release('kick');
assert.equal(p.attack.kind,'hipCrash');assert.equal(p.attack.age,0);
settle(.55);assert.equal(g.enemies[0].hp,56);assert(!q.comboChain.steps.length);
console.log('PASS fast 0.08s tablet taps P-P-K immediately trigger hip crash despite cooldown');

// Finishers endure damage, including heavy/blast impacts, without a forced
// knockdown or cancelling the remaining attack pulses.
for(const [sequence,finisher,impact] of [
 [['punch','punch','kick'],'hipCrash','heavy'],
 [['kick','kick','punch','punch'],'whirlSplit','explosion']
]){
 reset();g.enemies=[frozenEnemy('punk',1200)];
 for(const key of sequence){press(key);release(key);q.update(.08);}
 assert.equal(p.attack.kind,finisher);
 const hp=p.hp;assert(q.damagePlayer(20,p.x+60,impact));
 assert.equal(p.hp,hp-20);assert.equal(p.attack.kind,finisher);
 assert(!p.stun&&!p.down);assert(!p.grab);
 assert.equal(q.damagePlayer(20,p.x+60,impact),false,'normal post-hit protection remains');
 settle(1.4);assert.equal(g.lastAttack.kind,finisher);assert(!p.attack);
 console.log('PASS '+finisher+' takes damage yet finishes uninterrupted under '+impact+' impact');
}
reset();g.enemies=[frozenEnemy('punk',1200)];q.attack('punch');
assert(q.damagePlayer(10,p.x+60));assert(!p.attack);
console.log('PASS ordinary attacks remain interruptible when the character is hit');
