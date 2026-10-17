const assert=require('node:assert/strict');
const {Model}=require('../src/minigames/water-bottles/game.js');
const step=(m,t,dt=1/120)=>{for(let s=0;s<t;s+=dt)m.step(dt);};
for(const dt of [1/120,1/60,1/30,.05]){
 const m=new Model();
 for(let i=0;i<4;i++){
  const b=m.bottles[i],dx=b.x-m.config.muzzle.x,dy=b.mouthY-m.config.muzzle.y;
  const a=65*Math.PI/180;
  m.angle=65;m.power=Math.sqrt(m.config.gravity*dx*dx/(2*Math.cos(a)**2*(dy+dx*Math.tan(a))));
  m.fire=true;while(b.fill<100&&!m.done)m.step(dt);m.fire=false;step(m,3,dt);
 }
 assert.equal(m.won,true,'all bottles reachable at dt='+dt);
 assert.equal(m.caught,400);assert.equal(m.tank+m.caught+m.spilled+m.drops.length,600);
}
{
 const m=new Model();m.angle=20;m.power=350;m.fire=true;step(m,26);assert(m.done);assert.equal(m.won,false);assert.equal(m.tank,0);assert.equal(m.caught+m.spilled,600);
 m.reset();m.paused=true;m.fire=true;step(m,3);assert.equal(m.tank,600);assert.equal(m.clock,0);
}
console.log('PASS: four targets at 20–120 fps, success/failure, conservation, pause');
