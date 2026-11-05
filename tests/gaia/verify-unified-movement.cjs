const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const [before,after]=process.argv.slice(2);const read=(dir,i)=>fs.readFileSync(`${dir}/script-${String(i).padStart(2,'0')}.js`,'utf8');
for(let i=0;i<23;i++){new vm.Script(read(after,i));if(![7,16,22].includes(i))assert.equal(read(before,i),read(after,i));}
const c={ART:{}};c.window=c;vm.createContext(c);vm.runInContext(read(after,7),c);const M=c.CenterModel;c.M=M;
for(const [fi,f]of M.FLOORS.entries())if(f.place!=='unused'){
 const w=M.makeState();M.changeFloor(w,fi);w.player.x=650;w.player.y=575;
 const b=M.bounds(w.scene);assert(b.top<b.bottom,`${fi} belt depth`);
 M.step(w,0,-1,.1);assert(w.player.y<575);M.step(w,0,1,.2);assert(w.player.y>575);
}
const host=read(after,16);function fn(name){const st=new RegExp(`^function ${name}\\(`,'m').exec(host).index,rest=host.slice(st);return rest.slice(0,rest.search(/\n(?:async )?function /));}
c.world=M.makeState();c.floor=()=>M.FLOORS[c.world.scene.floor];c.portalReady=()=>true;c.talkNear=()=>false;c.captureBg=()=>'';c.toast=()=>{};
let route;c.streetExit=()=>route='street';c.elevator=()=>route='lift';c.useStairs=s=>{route=s.to;M.changeFloor(c.world,s.to);};c.openRoom=r=>route=r.id;c.enterIndex=i=>route=i;
vm.runInContext(fn('centerAction'),c);
for(const fi of [9,11,12,13]){
 M.changeFloor(c.world,fi);const f=c.floor();
 for(const s of f.stairs||[]){M.changeFloor(c.world,fi);c.world.player.x=(s.x0+s.x1)/2;route=null;vm.runInContext('centerAction()',c);assert.equal(route,s.to);}
 if(f.doorX!=null){M.changeFloor(c.world,fi);c.world.player.x=f.doorX;route=null;vm.runInContext('centerAction()',c);assert.equal(route,'street');}
}
for(const fi of [0,6]){M.changeFloor(c.world,fi);for(const [x,want] of [[95,'street'],[180,'lift']]){c.world.player.x=x;route=null;vm.runInContext('centerAction()',c);assert.equal(route,want);}}
const update=fn('update');assert(!update.includes('enterIndex('));assert(!update.includes('centerEdge('));assert(!update.includes('homeStep('));assert(!update.includes('streetExit('));
assert(host.includes("if(world.player.y>=635){sceneChange(()=>M.leaveRoom(world));return;}"));
assert(read(after,22).includes('sx=hero.x>=50?16:84'));
console.log('PASS: all floors have depth; house stair/door actions; distinct lift/street actions; no automatic movement portals; explicit room exit; unrelated scripts byte-identical.');
// Run the actual host update for held directions at each home stair and door.
Object.assign(c,{CityTravel:{update:()=>false},ensureSceneValid:()=>{},schedTick:()=>{},time:0,portalCooldown:0,transition:0,liftState:null,joystick:{x:0,y:0},keys:new Set(),CenterLife:{update:()=>{},get:()=>[]},life:{day:1},encounterCooldown:new Map(),view:()=>({width:1280}),nearRoom:-1,nearClock:0,nearLine:0});
vm.runInContext(fn('update'),c);
for(const fi of [9,11,12,13])for(const [dx,dy]of [[-1,0],[1,0],[0,-1],[0,1]]){
 M.changeFloor(c.world,fi);c.world.player.x=c.floor().stairs?.[0]?.x0??c.floor().doorX;c.world.player.y=575;c.joystick={x:dx,y:dy};
 for(let frame=0;frame<180;frame++)vm.runInContext('update(1/60)',c);
 assert.equal(c.world.scene.floor,fi);assert.equal(c.world.scene.type,'corridor');
}
console.log('PASS: actual update holds all four directions for 180 frames on every home floor without changing scenes.');
