/* Pure models. Square coordinates 720x720; render art never changes hit geometry. */
(function(root){'use strict';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const TILES=[{x:80,y:62,size:250},{x:390,y:62,size:250},{x:80,y:336,size:250},{x:390,y:336,size:250}];
class Water{
 constructor(config={}){this.duration=config.duration||45;this.left=this.duration;this.tiles=TILES.map(t=>({...t,cx:t.x+t.size/2,cy:t.y+t.size/2,fill:0}));this.muzzle={x:360,y:642};this.target={x:360,y:270};this.particles=[];this.shooting=false;this.accum=0;this.done=false;this.caught=0;this.emitted=0;this.spilled=0;this.rng=config.rng||Math.random;}
 aim(x,y){this.target={x:clamp(x,30,690),y:clamp(y,55,608)};}
 update(dt){if(this.done)return;dt=Math.min(dt,this.left);this.left=Math.max(0,this.left-dt);if(this.shooting){this.accum+=dt;while(this.accum>=1/45){this.accum-=1/45;const t=.35+(642-this.target.y)/900,amount=11/45,x=this.target.x+(this.rng()-.5)*8,y=this.target.y+(this.rng()-.5)*8;this.particles.push({x:360,y:642,vx:(x-360)/t,vy:(y-642-350*t*t)/t,t:0,flight:t,amount});this.emitted+=amount;}}
 for(const p of this.particles){const d=Math.min(dt,p.flight-p.t);p.x+=p.vx*d;p.y+=p.vy*d+350*d*d;p.vy+=700*d;p.t+=d;if(p.t>=p.flight-1e-7){const tile=this.tiles.find(t=>Math.hypot(p.x-t.cx,p.y-t.cy)<=19);const caught=tile?Math.min(p.amount,100-tile.fill):0;if(tile)tile.fill+=caught;this.caught+=caught;this.spilled+=p.amount-caught;}}
 this.particles=this.particles.filter(p=>p.t<p.flight-1e-7);if(this.left<=1e-7){this.done=true;this.shooting=false;this.spilled+=this.particles.reduce((s,p)=>s+p.amount,0);this.particles=[];}}
 result(){return{score:Math.round(this.caught),ratio:this.caught/400,success:this.caught>=399.5,detail:'4개 게이지 총 충전량 · '+Math.round(this.caught)+' / 400'};}
}
const LEVELS=[
 {name:'첫 절단',ball:[360,220],anchors:[[360,65]],velocity:[0,0],obstacles:[]},
 {name:'왼쪽에서',ball:[235,245],anchors:[[360,65]],velocity:[35,0],obstacles:[]},
 {name:'오른쪽에서',ball:[485,245],anchors:[[360,65]],velocity:[-35,0],obstacles:[]},
 {name:'두 줄의 순서',ball:[260,245],anchors:[[180,70],[510,70]],velocity:[0,0],obstacles:[]},
 {name:'장애물 너머',ball:[235,240],anchors:[[360,65]],velocity:[0,0],obstacles:[{x:130,y:360,w:150,h:22}]},
 {name:'마지막 세 줄',ball:[450,255],anchors:[[190,65],[530,65],[360,55]],velocity:[0,0],obstacles:[{x:120,y:415,w:105,h:22},{x:495,y:415,w:105,h:22}]}
];
function intersects(a,b,c,d){const cross=(x,y,z)=>(y.x-x.x)*(z.y-x.y)-(y.y-x.y)*(z.x-x.x);const p=cross(a,b,c),q=cross(a,b,d),r=cross(c,d,a),s=cross(c,d,b);return p*q<=0&&r*s<=0&&Math.max(Math.min(a.x,b.x),Math.min(c.x,d.x))<=Math.min(Math.max(a.x,b.x),Math.max(c.x,d.x))+1&&Math.max(Math.min(a.y,b.y),Math.min(c.y,d.y))<=Math.min(Math.max(a.y,b.y),Math.max(c.y,d.y))+1;}
class Rope{
 constructor(index=0){this.index=index;const l=LEVELS[index];this.ball={x:l.ball[0],y:l.ball[1],vx:l.velocity[0],vy:l.velocity[1],r:22};this.ropes=l.anchors.map(([x,y])=>({x,y,len:Math.hypot(x-this.ball.x,y-this.ball.y),cut:false}));this.obstacles=l.obstacles;this.goal={x:360,y:650,width:104};this.done=false;this.won=false;this.time=0;this.cuts=0;this.cutFX=[];}
 cut(a,b){let n=0;for(const r of this.ropes)if(!r.cut&&intersects(a,b,r,this.ball)){r.cut=true;this.cuts++;n++;this.cutFX.push({x:(a.x+b.x)/2,y:(a.y+b.y)/2,t:.4});}return n;}
 update(dt){if(this.done)return;const steps=Math.max(1,Math.ceil(dt*120)),h=dt/steps;for(let k=0;k<steps;k++){const p=this.ball,oldY=p.y;this.time+=h;p.vy+=520*h;p.vx*=Math.exp(-.07*h);p.x+=p.vx*h;p.y+=p.vy*h;
 for(let j=0;j<5;j++)for(const r of this.ropes)if(!r.cut){let dx=p.x-r.x,dy=p.y-r.y,d=Math.hypot(dx,dy);if(d>r.len){dx/=d;dy/=d;p.x=r.x+dx*r.len;p.y=r.y+dy*r.len;const radial=p.vx*dx+p.vy*dy;if(radial>0){p.vx-=radial*dx;p.vy-=radial*dy;}}}
 if(p.x<p.r){p.x=p.r;p.vx=Math.abs(p.vx)*.6;}if(p.x>720-p.r){p.x=720-p.r;p.vx=-Math.abs(p.vx)*.6;}
 for(const o of this.obstacles){const x=clamp(p.x,o.x,o.x+o.w),y=clamp(p.y,o.y,o.y+o.h),dx=p.x-x,dy=p.y-y,d=Math.hypot(dx,dy);if(d<p.r){if(d>1e-7){const nx=dx/d,ny=dy/d;p.x=x+nx*p.r;p.y=y+ny*p.r;const v=p.vx*nx+p.vy*ny;if(v<0){p.vx-=1.55*v*nx;p.vy-=1.55*v*ny;}}else{p.y=o.y-p.r;p.vy=-Math.abs(p.vy)*.55;}}}
 if(oldY<this.goal.y&&p.y>=this.goal.y&&p.vy>0&&Math.abs(p.x-this.goal.x)<this.goal.width/2-p.r*.25){this.done=this.won=true;break;}
 if(p.y>760){this.done=true;break;}}
 this.cutFX.forEach(f=>f.t-=dt);this.cutFX=this.cutFX.filter(f=>f.t>0);}
 result(){return{score:this.won?this.index+1:this.index,ratio:(this.index+(this.won?1:0))/LEVELS.length,success:this.won,detail:(this.won?'성공':'재도전')+' · '+(this.index+1)+' / '+LEVELS.length+'단계'};}
}
class Cylinder{
 constructor(config={}){this.duration=config.duration||60;this.left=this.duration;this.goal=config.goal||1000;this.pressure=42;this.score=0;this.hearts=[];this.spawn=.65;this.cooldown=0;this.rng=config.rng||Math.random;this.points=[{x:265,y:260},{x:470,y:345},{x:310,y:470}];this.events=[];this.done=false;this.taps=0;this.overflows=0;}
 tap(){if(this.done)return;this.taps++;this.pressure+=9;if(this.pressure>82){if(this.cooldown<=0){this.score=Math.max(0,this.score-45);this.overflows++;this.cooldown=.7;this.events.push({type:'over'});}this.pressure=Math.min(98,this.pressure);}else if(this.pressure>=32&&this.cooldown<=0)this.score+=3;}
 hit(id){if(this.done)return false;const i=this.hearts.findIndex(h=>h.id===id);if(i<0)return false;const h=this.hearts.splice(i,1)[0];this.score+=(this.pressure>=32&&this.pressure<=72&&this.cooldown<=0)?45:10;this.events.push({type:'heart',x:h.x,y:h.y});return true;}
 update(dt){if(this.done)return;dt=Math.min(dt,this.left);this.left=Math.max(0,this.left-dt);this.pressure=Math.max(0,this.pressure-19*dt);this.cooldown=Math.max(0,this.cooldown-dt);if(this.pressure>=32&&this.pressure<=72&&this.cooldown<=0)this.score+=5*dt;this.hearts.forEach(h=>h.life-=dt);this.hearts=this.hearts.filter(h=>h.life>0);this.spawn-=dt;if(this.spawn<=0){const free=this.points.filter(p=>!this.hearts.some(h=>h.x===p.x&&h.y===p.y));if(free.length){const p=free[Math.floor(this.rng()*free.length)];this.hearts.push({...p,life:1.65,id:++Cylinder.serial});}this.spawn=.7+this.rng()*.55;}if(this.left<=1e-7)this.done=true;}
 result(){return{score:Math.floor(this.score),ratio:clamp(this.score/this.goal,0,1),success:this.score>=this.goal,detail:Math.floor(this.score)+' / '+this.goal+'점 · 초과 '+this.overflows+'회'};}
}
Cylinder.serial=0;
const api={Water,Rope,Cylinder,LEVELS,TILES,intersects,clamp};root.LifeGameModels=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
