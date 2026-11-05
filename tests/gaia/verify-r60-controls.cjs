// R62 regression tests: joystick starts near left-side exits, held input at landings,
// and road controls. Run with the R60 and R62 extracted script directories.
const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict'),path=require('path');
const [beforeDir,afterDir]=process.argv.slice(2);
assert(beforeDir&&afterDir,'Usage: verify-portal-controls.cjs R60 R62');
const read=(dir,n)=>fs.readFileSync(path.join(dir,`script-${String(n).padStart(2,'0')}.js`),'utf8');
for(let n=0;n<23;n++){
 new vm.Script(read(afterDir,n));
 if(![13,16].includes(n))assert.equal(read(afterDir,n),read(beforeDir,n),`Unrelated script ${n}`);
}
const host=read(afterDir,16),road=read(afterDir,13),events=new Map();
function fn(name){
 const match=new RegExp(`^function ${name}\\(`,'m').exec(host);assert(match,name);
 const rest=host.slice(match.index),end=rest.search(/\n(?:async )?function /);
 return rest.slice(0,end<0?rest.length:end);
}
const ctx={ART:{},document:{hidden:false,addEventListener:(name,handler)=>{const list=events.get(name)||[];list.push(handler);events.set(name,list);}},addEventListener:()=>{}};
ctx.window=ctx;vm.createContext(ctx);vm.runInContext(read(afterDir,7),ctx);
const M=ctx.CenterModel;ctx.M=M;ctx.world=M.makeState();
Object.assign(ctx,{portalCooldown:0,liftState:null,mode:'field',life:{},CenterLife:{get:()=>[]},toast:()=>{},talkNear:()=>false});
ctx.floor=()=>M.FLOORS[ctx.world.scene.floor];
ctx.sceneChange=handler=>{vm.runInContext('armPortal()',ctx);handler();ctx.portalCooldown=.65;};
ctx.elevator=()=>{ctx.usedElevator=true;};ctx.streetExit=()=>{ctx.exited=true;};ctx.talkTo=()=>{};
const h0=host.indexOf('/* R62 portal input:');const h1=host.indexOf('function resetInput()',h0);
vm.runInContext(host.slice(h0,h1),ctx);
for(const name of ['useStairs','centerEdge','centerTap'])vm.runInContext(fn(name),ctx);
const emit=(type,props)=>{for(const handler of events.get(type)||[])handler({target:{matches:()=>false},...props});};
const ready=()=>vm.runInContext('portalReady()',ctx);
// Touching the left joystick where the basement stairs overlap must only start movement.
M.changeFloor(ctx.world,13);ctx.world.player.x=450;
assert.equal(vm.runInContext('centerTap(405,600,true)',ctx),false);
assert.equal(ctx.world.scene.floor,13);
// A deliberate stair input moves once, arrives clear of all reverse portals, and
// cannot be repeated by a held direction or a held action pointer.
for(const fi of [9,12,13])for(const stair of M.FLOORS[fi].stairs){
 M.changeFloor(ctx.world,fi);ctx.world.player.x=(stair.x0+stair.x1)/2;
 ctx.portalCooldown=0;emit('keydown',{key:stair.dir==='up'?'ArrowUp':'ArrowDown'});
 ctx.stair=stair;assert(vm.runInContext('useStairs(stair)',ctx));
 assert.equal(ctx.world.scene.floor,stair.to);
 const landing=ctx.floor(),x=ctx.world.player.x;
 assert(!landing.stairs.some(t=>x>=t.x0-90&&x<=t.x1+90),'Landing outside reverse stairs');
 assert(landing.doorX==null||Math.abs(x-landing.doorX)>=200,'Landing outside street exit');
 ctx.portalCooldown=0;assert.equal(ready(),false,'Time alone cannot release held input');
 const dest=ctx.world.scene.floor;
 for(let i=0;i<180;i++)vm.runInContext('centerEdge(-1);centerEdge(1)',ctx);
 assert.equal(ctx.world.scene.floor,dest,'No portal ping-pong for 180 frames');
 emit('keyup',{key:stair.dir==='up'?'ArrowUp':'ArrowDown'});assert(ready());
 emit('pointerdown',{pointerId:42});vm.runInContext('armPortal()',ctx);
 assert(!ready());emit('pointerup',{pointerId:42});assert(ready());
}
// Stair click only occupies its visible sign, not the whole lower-left screen.
M.changeFloor(ctx.world,13);ctx.portalCooldown=0;ctx.world.player.x=450;
assert.equal(vm.runInContext('centerTap(405,600,false)',ctx),false);
assert.equal(ctx.world.scene.floor,13);
emit('pointerdown',{pointerId:7});assert.equal(vm.runInContext('centerTap(405,232,false)',ctx),true);
assert.equal(ctx.world.scene.floor,9);
ctx.portalCooldown=0;assert(!ready());emit('pointercancel',{pointerId:7});assert(ready());
// Exercise the real canvas pointerdown routing at a doorway whose hitbox sits
// inside the left joystick area. The event must initialize the joystick instead.
const start=host.indexOf("canvas.addEventListener('pointerdown',e=>");
const end=host.indexOf("\ncanvas.addEventListener('pointermove'",start);
const canvasEvents=new Map();ctx.canvas={addEventListener:(t,f)=>canvasEvents.set(t,f),setPointerCapture:()=>{}};
ctx.CityTravel={active:false};ctx.innerWidth=1280;ctx.innerHeight=720;ctx.joystick={id:null};
ctx.view=()=>({s:1,cam:0,y:0});ctx.place=()=>ctx.floor().place;
ctx.$=selector=>selector==='#panel'?{open:false}:selector==='#stick'?{style:{}}:{style:{}};
ctx.CenterGallery={hit:()=>{throw Error('Joystick hit gallery');}};
ctx.enterIndex=()=>{throw Error('Joystick entered doorway');};ctx.openRoom=()=>{};
vm.runInContext(host.slice(start,end),ctx);
M.changeFloor(ctx.world,0);
canvasEvents.get('pointerdown')({clientX:570,clientY:350,pointerId:99,preventDefault:()=>{}});
assert.equal(ctx.joystick.id,99);
// The forced test button is gone, while the actual run/hold/boost handlers remain identical.
assert(!road.includes('cityTestEnc'));assert(!road.includes('실린더 테스트'));
const runStart=" const run=document.querySelector('#action');";
const suffix=s=>s.slice(s.indexOf(runStart));
assert.equal(suffix(road),suffix(read(beforeDir,13)),'Road run controls must be unchanged');
console.log('PASS: all stair routes, safe landing, held-key/pointer release, repeated-frame bounce prevention, narrow stair signs, joystick/door separation, road test button removal and run controls preserved; unrelated scripts unchanged.');
