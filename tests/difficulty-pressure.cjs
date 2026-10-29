// Run from repository root: node tests/difficulty-pressure.cjs
// Optional prior-code comparison: GAIA_AI_BASELINE=/path/to/previous/game.js node tests/difficulty-pressure.cjs
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const path=require('node:path');const root=path.resolve(__dirname,'../belt-scroll');
const els=new Map();const noop=()=>{};
function element(id){if(els.has(id))return els.get(id);const e={style:{setProperty:noop},classList:{add:noop,remove:noop,toggle:noop},dataset:{},addEventListener:noop,setPointerCapture:noop,getBoundingClientRect:()=>({left:0,top:0,width:100,height:100}),querySelector:()=>element(id+'child'),focus:noop};if(id==='scene')e.getContext=()=>({});els.set(id,e);return e;}
const c={Math:Object.assign(Object.create(Math),{random:()=>.5}),console,URLSearchParams,location:{search:'?qa'},innerWidth:960,innerHeight:540,performance:{now:()=>0},requestAnimationFrame:noop,setTimeout:noop,clearTimeout:noop,Image:class{complete=false;naturalWidth=0},REGION_ART:{},__GAME_ASSET:{},document:{getElementById:element,querySelectorAll:()=>[],addEventListener:noop,body:{classList:{add:noop,remove:noop}}},DetectiveApp:{state:{hp:160,mp:100,gold:80,stats:{},checkpoint:{},records:{}},save:noop,ready:noop},AlleyAudio:new Proxy({},{get:()=>noop}),addEventListener:noop};c.window=c;vm.createContext(c);
for(const file of ['campaign.js','female-enemies.js','game.js'])vm.runInContext(fs.readFileSync(file==='game.js'&&process.env.GAIA_AI_BASELINE?process.env.GAIA_AI_BASELINE:path.join(root,'js',file),'utf8'),c,{filename:file});
const q=c.__alleyQA,F=c.FemaleEnemies,g=q.game,p=q.player;
function reset(){if(p.grab)q.releaseGrab(false);q.clearInput();Object.assign(p,{hp:160,maxHp:160,grab:null,grabCd:999,crouch:false,dash:null,dashLink:null,dashFollow:null,spinRush:null,mp:100,x:400,y:435,face:1,stun:0,attack:null,attackCooldown:0,guard:false,jump:null,down:null,slam:null,splash:null,charge:null,skillPose:null,invuln:0,hurt:0,combo:0,cardGuard:0,cardDef:0,cardSpd:0,skillCooldown:0,pushCd:0,chargeCd:0,dopa:0,climaxT:0,climaxCd:0,dazeT:0});Object.assign(g,{mode:'playing',elapsed:0,zone:0,projectiles:[],enemies:[],castaways:[],freeze:0,props:[],waveLive:true,zones:[{start:0,end:1500}]});}
function enemy(kind,x=460,y=435){const d=q.types[kind];return {id:1,kind,name:d.name,x,y,hp:10000,maxHp:10000,invuln:0,stun:0,staggerResist:0,face:-1,windup:0,swing:0,hurt:0,attackCd:99,entry:0,powerDown:0,bind:0,floorTime:0,motionPhase:0,slotY:0};}

const baseline=!!process.env.GAIA_AI_BASELINE;
function prepare(kinds,xs){reset();p.invuln=999;g.elapsed=0;g.nextThreatAt=0;g.nextRangedAt=0;g.reinfT=999;g.enemies=kinds.map((kind,i)=>({...enemy(kind,xs?.[i]??(450+i*12),435),id:i+1,attackCd:0}));return g.enemies;}
function run(seconds,hook){for(let n=0;n<Math.round(seconds/.02);n++){hook?.(n);q.update(.02);}}
const metrics={};
let enemies=prepare(['punk','boxer','goth','hippie'],[450,340,465,330]);run(12);metrics.melee=enemies.map(e=>e.attackBeat||0);
enemies=prepare(['flameGuy','rocketeer','grenadier'],[730,850,700]);run(12);metrics.ranged=enemies.map(e=>e.attackBeat||0);
for(const kind of ['yogaFighter','bikiniFighter','waterQueen','whip']){const e=prepare([kind],[kind==='waterQueen'?700:470])[0];run(12);metrics[kind]=e.attackBeat||0;}
for(const kind of ['fedora','redBoss','manager','clubBoss','scientist','farmer','mafiaA','mafiaB','mafiaC','mafiaD','mafiaBoss','director','heiress','host','pimp','studentBoss']){const e=prepare([kind],[780])[0];run(12);metrics[kind]={attacks:e.attackBeat||0,barrages:e.barrageNo||0,x:e.x};}
console.log(JSON.stringify(metrics));
if(baseline)process.exit(0);
assert(metrics.melee.every(n=>n>=5),'every nearby melee enemy must attack repeatedly');assert(metrics.ranged.every(n=>n>=3),'all ranged enemies must shoot independently');
for(const kind of ['yogaFighter','bikiniFighter','waterQueen','whip']){assert.equal(q.enemyActionRate(kind),2);assert.equal(q.femaleHealth(kind),2);assert(metrics[kind]>=5,kind+' active cadence');}
console.log('PASS all enemies act independently; female action clock/HP multiplier exactly ×2');
for(const kind of ['fedora','redBoss','manager','clubBoss','scientist','farmer','mafiaA','mafiaB','mafiaC','mafiaD','mafiaBoss','director','heiress','host','pimp','studentBoss']){assert(metrics[kind].barrages>=2,kind+' regular barrages');assert(metrics[kind].attacks>=1,kind+' must leave barrage state and use its own attacks');}
console.log('PASS all 16 boss profiles maintain ranged pressure and return to their own attack patterns');
for(const kind of ['fedora','redBoss','manager','clubBoss','scientist','farmer','mafiaBoss','director','heiress','host','pimp','studentBoss']){const b=prepare([kind],[800])[0];run(12,()=>{b.x=800;b.y=435;});assert(b.barrageNo>=8,kind+' sustained far pressure');}
console.log('PASS every boss keeps firing when the player stays at distance');
let e=prepare(['punk'],[1280])[0];const far=e.x;run(2);assert(e.x<far-200,'pursue outside old 660px radius');
e=prepare(['punk'],[480])[0];e.attackCd=99;run(2);assert(Math.abs(e.x-p.x)<q.types.punk.reach,'approach through reach boundary');
e=prepare(['breaker'],[660])[0];let spun=false,spinX,travel=0;run(2,()=>{if(e.spinRush){if(!spun)spinX=e.x;spun=true;travel=Math.max(travel,Math.abs(e.x-spinX));}});assert(spun);assert(travel>90);assert.equal(e.attackBeat,1);console.log('PASS remote pursuit, melee spacing, and advancing spin with one hit per spin');
e=prepare(['bikiniFighter'],[675])[0];run(.42);assert(e.dive||e.attackBeat>=1,'dive starts from midrange');
e=prepare(['waterQueen'],[700])[0];e.y=345;p.y=490;q.femaleAttack(e,'water');assert.equal(g.projectiles[0].lane,490);
console.log('PASS diving women launch from midrange; aimed water shots track the target lane');
// Enemy attacks accelerate, but skills retain their real-time control duration.
e=prepare(['waterQueen'],[700])[0];e.stun=1.1;e.bind=1.5;e.attackCd=2;run(.2);assert(Math.abs(e.stun-.9)<1e-8);assert(Math.abs(e.bind-1.3)<1e-8);assert(Math.abs(e.attackCd-1.6)<1e-8);
e=prepare(['manager'],[700])[0];e.barrageCd=0;e.barrageWind=.3;e.volley=2;e.closeWind=.2;q.hitEnemy(e,13,0,.23,p.x);assert.equal(e.hp,9987);assert.equal(e.barrageWind,0);assert.equal(e.volley,0);assert.equal(e.closeWind,0);assert(e.stun<=.16);const firstStun=e.stun;e.invuln=0;q.hitEnemy(e,28,0,.68,p.x,false,1,true);assert.equal(e.hp,9959);assert.equal(e.stun,firstStun,'ordinary repeated kicks cannot extend boss lock during resistance');e.invuln=0;q.hitEnemy(e,4,0,1.1,p.x,false,0,false,true);assert(e.stun>=1.1,'dash setup must still stun');
console.log('PASS unchanged 13/28 damage, boss resistance to repeated ordinary stun, full setup control, and interruption of boss windups');
e=prepare(['manager'],[750])[0];run(8,n=>{if(n%26===0){e.invuln=0;q.hitEnemy(e,28,0,.68,p.x,false,1,true);}});assert((e.attackBeat||0)+(e.barrageNo||0)>0,'boss must attack through a series of ordinary kicks');
e=prepare(['manager'],[460])[0];p.invuln=0;p.grabCd=999;run(.8);assert(p.hp<160,'boss punishes close contact');
console.log('PASS bosses can retaliate through ordinary kick pressure and attack at close range');
// Run real stage spawning, including repeat starts (no multiplicative stat drift).
for(const stage of [1,2,4,7,10]){
 c.AlleyGame.start(stage,0);g.mode='playing';
 for(let zone=0;zone<q.waves.length;zone++){q.spawnWave(zone);for(let pack=0;pack<q.waves[zone].packs.length;pack++){
  if(pack)q.spawnPack();for(const mob of g.enemies){const d=q.types[mob.kind],scale=d.boss?(['mafiaA','mafiaB','mafiaC','mafiaD'].includes(mob.kind)?2.2:3.6):c.GaiaCampaign.stages[stage].hpScale;assert.equal(mob.maxHp,Math.round(d.hp*q.femaleHealth(mob.kind)*scale*g.hpMul));}
 }}
}
const attack=q.types.waterQueen.attack;c.AlleyGame.start(1,0);assert.equal(q.types.waterQueen.attack,attack);assert.equal(p.maxHp,160);assert.equal(q.moves.punch.damage,13);assert.equal(q.moves.kick.damage,28);
console.log('PASS actual spawns use ×2 female health / strengthened boss HP; repeat starts never compound attack damage; player stats unchanged');
