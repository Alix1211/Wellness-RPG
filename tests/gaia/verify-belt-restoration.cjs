// Regression checks against the original R60 extracted scripts.
const fs=require('fs'), vm=require('vm'), assert=require('node:assert/strict');
const path=require('path');
const [beforeDir,afterDir]=process.argv.slice(2);
assert(beforeDir&&afterDir,'Usage: node verify-belt-restoration.cjs BEFORE AFTER');
function read(dir,n){return fs.readFileSync(path.join(dir,`script-${String(n).padStart(2,'0')}.js`),'utf8');}
function model(dir){const ctx={ART:{}};ctx.window=ctx;vm.createContext(ctx);vm.runInContext(read(dir,7),ctx);return ctx;}
const original=model(beforeDir), restored=model(afterDir), M=restored.CenterModel;
for(let n=0;n<23;n++){
 new vm.Script(read(afterDir,n),{filename:`script-${n}.js`});
 const r62=read(afterDir,16).includes('/* R62 portal input:');
 if(![7,16,...(r62?[13]:[])].includes(n))assert.equal(read(afterDir,n),read(beforeDir,n),`Script ${n} must be byte-identical`);
}
const json=x=>JSON.parse(JSON.stringify(x));
assert.deepEqual(json(original.GaiaLife.R),json(restored.GaiaLife.R));
for(const [fi,f] of M.FLOORS.entries()){
 const prior=original.CenterModel.FLOORS[fi];
 assert.deepEqual(json(f.rooms.map(({id,kind,games,bg,service})=>({id,kind,games,bg,service}))),
                  json(prior.rooms.map(({id,kind,games,bg,service})=>({id,kind,games,bg,service}))));
 if(!['center','company','street'].includes(f.place)){
  assert.deepEqual(json(f),json(prior),'Home layout must be retained');continue;
 }
 const s=M.makeState();M.changeFloor(s,fi);s.player.x=640;s.player.y=575;
 const y=s.player.y;M.step(s,0,-1,.1);assert(s.player.y<y,`${fi}: up`);
 M.step(s,0,1,.2);assert(s.player.y>y,`${fi}: down`);
 const x=s.player.x;M.step(s,1,0,.1);assert(s.player.x>x,`${fi}: right`);
 M.step(s,-1,0,.2);assert(s.player.x<x,`${fi}: left`);
 const b=M.bounds(s.scene);assert(b.bottom>b.top,`${fi}: depth walk area`);
 for(let n=0;n<50;n++)M.step(s,-1,-1,.1);
 assert(s.player.x>=b.left&&s.player.y>=b.top,`${fi}: boundary`);
 if(f.place!=='street')for(let ri=0;ri<f.rooms.length;ri++){
  M.enterRoom(s,ri);assert.equal(s.scene.type,'room');assert.equal(f.rooms[s.scene.room].id,f.rooms[ri].id);
  assert(M.bounds(s.scene).bottom>M.bounds(s.scene).top);
  M.leaveRoom(s);assert.equal(s.scene.type,'corridor');assert.equal(s.player.x,f.rooms[ri].x);
 }
}
// Every existing minigame remains reachable under the same stable room IDs.
const games=new Set(M.FLOORS.flatMap(f=>f.rooms.flatMap(r=>r.games)));
for(const kind of [0,1,2,3,4,5,'rope','squat','batting'])assert(games.has(kind),String(kind));
assert(read(afterDir,16).includes("return['water']"));
assert(read(afterDir,16).includes("return['cylinder']"));
// Exercise the actual host validator and doorway routing with persisted R60 state.
const host=read(afterDir,16);
function hostFunction(name){
 const match=new RegExp(`^function ${name}\\(`,'m').exec(host);assert(match,name);const start=match.index;
 const rest=host.slice(start), end=rest.search(/\n(?:async )?function /);
 return end<0?rest:rest.slice(0,end);
}
const ctx=restored;
Object.assign(ctx,{M,world:M.makeState(),life:{active:'Q07',quests:{Q07:{stage:'game'}},story:{seen:['M01']},stats:{ki:34,um:31,bo:35,ge:33}},loaded:true});
ctx.world.scene={type:'corridor',floor:2,room:1};
ctx.world.player.x=original.CenterModel.FLOORS[2].rooms[1].x;
ctx.world.player.y=642;
const progress=JSON.stringify(ctx.life);
vm.runInContext(hostFunction('ensureSceneValid'),ctx);
vm.runInContext('ensureSceneValid()',ctx);
assert.equal(ctx.world.player.x,M.FLOORS[2].rooms[1].x,'R60 room position migrates by ID');
assert.equal(ctx.world.player.y,575);
assert.equal(ctx.life.beltMapVersion,1);
const preserved={...ctx.life};delete preserved.beltMapVersion;
assert.equal(JSON.stringify(preserved),progress,'Quest/story/stat progress preserved');
ctx.world.player.x=733;ctx.world.player.y=517;
vm.runInContext('ensureSceneValid()',ctx);
assert.equal(ctx.world.player.x,733,'No repeat migration after save/reload');assert.equal(ctx.world.player.y,517);
ctx.world.player.x=NaN;ctx.world.player.y=undefined;
vm.runInContext('ensureSceneValid()',ctx);assert(Number.isFinite(ctx.world.player.x)&&Number.isFinite(ctx.world.player.y));
ctx.floor=()=>M.FLOORS[ctx.world.scene.floor];ctx.place=()=>ctx.floor().place;
ctx.portalReady=()=>true;ctx.armPortal=()=>{};
ctx.sceneChange=fn=>fn();ctx.accessDestination=()=>({ok:true});ctx.toast=()=>{};
vm.runInContext(hostFunction('enterIndex'),ctx);
M.changeFloor(ctx.world,10);
const officeGate=M.FLOORS[10].rooms.findIndex(r=>r.kind==='companyGate');
vm.runInContext(`enterIndex(${officeGate})`,ctx);
assert.equal(ctx.world.scene.floor,6);assert(Number.isFinite(ctx.world.player.y),'Company gate has finite feet coordinates');
vm.runInContext('enterIndex(0)',ctx);assert.equal(ctx.world.scene.type,'room');
Object.assign(ctx,{
 CityTravel:{update:()=>false},CenterLife:{update:()=>{},get:()=>[]},
 schedTick:()=>{},time:0,portalCooldown:0,transition:0,liftState:null,
 joystick:{x:0,y:0},keys:new Set(['arrowup']),encounterCooldown:new Map(),
 nearRoom:-1,nearClock:0,nearLine:0,view:()=>({width:1280}),
 streetExit:()=>{throw Error('Unexpected street exit');},elevator:()=>{ctx.usedElevator=true;}
});
vm.runInContext(hostFunction('update'),ctx);
for(const fi of [0,1,2,3,4,6,7,8]){
 ctx.life.employed=true;M.changeFloor(ctx.world,fi);ctx.world.player.x=ctx.floor().rooms[0].x;ctx.world.player.y=575;
 ctx.keys=new Set(['arrowup']);vm.runInContext('update(.04)',ctx);
 assert(ctx.world.player.y<575,`Host update ${fi}: depth movement`);
 ctx.world.player.y=480;vm.runInContext('update(.04)',ctx);
 assert.equal(ctx.world.scene.type,'room',`Host update ${fi}: doorway`);
 ctx.world.player.y=670;ctx.keys=new Set(['arrowdown']);vm.runInContext('update(.04)',ctx);
 assert.equal(ctx.world.scene.type,'corridor',`Host update ${fi}: exit`);
 ctx.world.player.x=180;ctx.world.player.y=480;ctx.keys=new Set(['arrowup']);ctx.usedElevator=false;
 vm.runInContext('update(.04)',ctx);assert(ctx.usedElevator,`Host update ${fi}: elevator`);
}
console.log('PASS: 23 scripts parse; unrelated scripts byte-identical; all room IDs/games preserved; depth movement, boundaries and room round trips on every restored floor; R60 save migration and repeat-load position; company gate and room entry; home and growth rules unchanged.');
