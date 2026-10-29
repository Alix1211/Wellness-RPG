// Run from repository root: node tests/female-enemies.cjs
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const path=require('node:path');const root=path.resolve(__dirname,'../belt-scroll');
const els=new Map();const noop=()=>{};
function element(id){if(els.has(id))return els.get(id);const e={style:{setProperty:noop},classList:{add:noop,remove:noop,toggle:noop},dataset:{},addEventListener:noop,setPointerCapture:noop,getBoundingClientRect:()=>({left:0,top:0,width:100,height:100}),querySelector:()=>element(id+'child'),focus:noop};if(id==='scene')e.getContext=()=>({});els.set(id,e);return e;}
const c={console,URLSearchParams,location:{search:'?qa'},innerWidth:960,innerHeight:540,performance:{now:()=>0},requestAnimationFrame:noop,setTimeout:noop,clearTimeout:noop,Image:class{complete=false;naturalWidth=0},REGION_ART:{},__GAME_ASSET:{},document:{getElementById:element,querySelectorAll:()=>[],addEventListener:noop,body:{classList:{add:noop,remove:noop}}},DetectiveApp:{state:{hp:160,mp:100,gold:80,stats:{},checkpoint:{},records:{}},save:noop,ready:noop},AlleyAudio:new Proxy({},{get:()=>noop}),addEventListener:noop};c.window=c;vm.createContext(c);
for(const file of ['campaign.js','female-enemies.js','game.js'])vm.runInContext(fs.readFileSync(path.join(root,'js',file),'utf8'),c,{filename:file});
const q=c.__alleyQA,F=c.FemaleEnemies,g=q.game,p=q.player;
function reset(){q.clearInput();Object.assign(p,{hp:160,maxHp:160,mp:100,x:400,y:435,face:1,stun:0,attack:null,attackCooldown:0,guard:false,jump:null,down:null,slam:null,splash:null,charge:null,skillPose:null,invuln:0,hurt:0,combo:0,cardGuard:0,cardDef:0,cardSpd:0,skillCooldown:0,pushCd:0,chargeCd:0,dopa:0,climaxT:0,climaxCd:0,dazeT:0});Object.assign(g,{mode:'playing',elapsed:0,zone:0,projectiles:[],enemies:[],castaways:[],freeze:0,props:[],waveLive:true,zones:[{start:0,end:1500}]});}
function enemy(kind,x=460,y=435){const d=q.types[kind];return {id:1,kind,name:d.name,x,y,hp:100,maxHp:100,invuln:0,stun:0,staggerResist:0,face:-1,windup:0,swing:0,hurt:0,attackCd:99,entry:0,powerDown:0,bind:0,floorTime:0,motionPhase:0,slotY:0};}
for(let stage=1;stage<=14;stage++){const waves=q.makePlan(stage);for(const w of waves)for(const pack of w.packs)for(const kind of pack)assert(q.types[kind],kind);assert(waves.at(-1).boss);}
assert(q.makePlan(1)[0].packs[0].includes('yogaFighter'));assert(q.makePlan(1)[0].packs[1].includes('bikiniFighter'));assert(q.makePlan(1)[1].packs[1].includes('waterQueen'));console.log('PASS all encounter plans, early access, bosses retained');
for(const kind of ['yogaFighter','bikiniFighter','waterQueen']){
 reset();const e=enemy(kind);g.enemies=[e];const before=p.hp;q.femaleAttack(e,kind==='waterQueen'?'water':'hip');for(let n=0;n<16;n++)q.update(.04);assert(p.hp<before,kind+' damage');
 reset();const diver=enemy(kind);g.enemies=[diver];q.hitEnemy(diver,13,15,.23,p.x);assert.equal(diver.hp,87);assert.equal(F.pose(diver,0).key,kind==='waterQueen'?'state0':'state1');diver.invuln=0;q.hitEnemy(diver,28,91,.68,p.x,false,1,true);assert(diver.air);assert.equal(F.pose(diver,0).key,'state1');diver.invuln=0;q.hitEnemy(diver,1000,0,.2,p.x);assert.equal(diver.exit.kind,'female');diver.exit.age=.8;assert.equal(F.pose(diver,0).key,'state2');
}
console.log('PASS all three enemy attack damage, player hits, knockback and defeat frames');
reset();const e=enemy('bikiniFighter',530);g.enemies=[e];q.femaleAttack(e,'dive');const x=e.x;for(let n=0;n<8;n++)q.update(.04);assert(e.x<x);assert(p.hp<160);const hp=p.hp;for(let n=0;n<12;n++)q.update(.04);assert.equal(p.hp,hp);assert(!e.dive);console.log('PASS dive travel, one-hit limit and recovery');
reset();const boss=enemy('mafiaBoss',700);boss.pattern=1;g.enemies=[boss];assert(q.regionalAttack(boss,'womanThrow'));const shot=g.projectiles[0];assert.equal(shot.kind,'person');assert.equal(shot.figure,'yogaFighter');shot.age=shot.ttl-.01;shot.x=1200;for(let n=0;n<2;n++)q.update(.02);assert(g.castaways.length);assert.equal(g.castaways[0].figure,'yogaFighter');console.log('PASS boss throw uses new flying sprite and fallen frame');
const calls=[];const ctx=new Proxy({drawImage(...a){calls.push(a)}},{get:(o,k)=>o[k]||noop});const images={};for(const [key]of Object.entries(F.assets))images[key]={complete:true,naturalWidth:2048};
for(const [char,data]of Object.entries(F.data)){
 const kind=Object.keys(F.types).find(k=>F.types[k].frames[0]==='female_'+char);
 for(const [key,f]of Object.entries(data.frames)){calls.length=0;assert(F.frame(ctx,images,kind,key));const call=calls[0];assert.equal(call[7],f.rect[2]/2);assert.equal(call[8],f.rect[3]/2);assert(call[7]<260&&call[8]<190);}
 for(const state of [{},{hurt:.1},{air:{age:.2,lift:40}},{floorTime:.3},{exit:{age:.8,duration:1.4}},{walking:true,motionPhase:2},{windup:.3,windupStyle:'hip'},{swing:.3,swingStyle:'hip'}]){F.draw(ctx,images,{...enemy(kind),...state},g);}
}
console.log('PASS all 34 frame rects use fixed native scale; animation transitions render');
assert.equal(p.maxHp,160);assert(!('combatCommands'in q));console.log('PASS existing player input/health unchanged');

for(const face of [-1,1]){let flip;const dc=new Proxy({scale(x){flip=x}},{get:(o,k)=>o[k]||noop});const e={...enemy('yogaFighter'),face,windup:.3,windupStyle:'hip'};F.draw(dc,images,e,g);assert.equal(flip,face);e.windup=0;e.walking=true;F.draw(dc,images,e,g);assert.equal(flip,-face);}console.log('PASS hip pose faces backward so hip strikes toward target; movement/dive face forward');
