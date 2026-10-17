/* Local ambience: no gameplay stats, collisions, or cross-scene timer work. */
(function(root){'use strict';
const cache=new Map(),actors=NPC_MANIFEST.actors;
const pool=role=>actors.filter(a=>a.role===role),pick=(list,n)=>list[((n%list.length)+list.length)%list.length];
function rand(n){let x=(n*1664525+1013904223)>>>0;return ()=>{x=(x*1664525+1013904223)>>>0;return x/4294967296;};}
function key(s){return s.type==='corridor'?`c${s.floor}`:`r${s.floor}-${s.room}`;}
function create(scene){const M=root.CenterModel,f=M.FLOORS[scene.floor],b=M.bounds(scene),corridor=scene.type==='corridor',seed=scene.floor*31+(corridor?0:scene.room+1)*71,rng=rand(seed+19),list=[];
 function add(a,x,y,id,staff=false){x=M.clamp(x,b.left+45,b.right-45);y=M.clamp(y,b.top+12,b.bottom-28);const r=rand(seed*100+id*37+5);list.push({id:`${key(scene)}-${id}`,actor:a,x,y,homeX:x,homeY:y,face:r()>.5?1:-1,phase:r()*6.28,timer:1+r()*4,mode:'idle',time:0,walk:0,target:null,rng:r,staff,bounds:{...b,left:Math.max(b.left,x-(corridor?240:140)),right:Math.min(b.right,x+(corridor?240:140)),top:Math.max(b.top+22,y-26),bottom:Math.min(b.bottom-32,y+26)}});}
 const members=[...pool('member'),...pool('casual-member')];
 if(corridor){
  add(pick(pool('casual'),scene.floor+4),365,505,0);
  for(let i=0;i<f.rooms.length;i++){
   add(pick(members,scene.floor*3+i),555+i*570,570+(i%2)*38,i*3+1);
   add(pick(pool(i%2?'office-member':'yoga-member'),scene.floor+i),830+i*570,520,i*3+2);
   if(i%2===0)add(pick(pool('trainer'),scene.floor*2+i),960+i*570,493,i*3+3);
  }
 }else{
  const r=f.rooms[scene.room],staffRole=r.service==='reception'?'office':r.service==='recovery'?'casual':'trainer';
  add(pick(pool(staffRole),scene.floor*3+scene.room),820,Math.max(b.top+12,555),0,true);
  const count=r.kind==='toilet'?2:r.kind==='group'?5:3;
  for(let i=0;i<count;i++){
   const x=[300,1040,475,950,180][i],y=Math.min(b.bottom-38,b.top+35+(i%2)*36);
   const a=i===1?pick(pool(r.service?'office-member':'yoga-member'),seed):pick(members,seed+i);
   add(a,x,y,i+1);
  }
 }
 return list;
}
function get(scene){const k=key(scene);if(!cache.has(k))cache.set(k,create(scene));return cache.get(k);}
function update(scene,dt){for(const n of get(scene)){
 n.time+=dt;n.timer-=dt;
 if(n.mode==='walk'&&n.target){const dx=n.target.x-n.x,dy=n.target.y-n.y,dist=Math.hypot(dx,dy),speed=43;
  if(dist<speed*dt+1){n.x=n.target.x;n.y=n.target.y;n.target=null;n.mode='idle';n.timer=2+n.rng()*4;n.time=0;}
  else{n.x+=dx/dist*speed*dt;n.y+=dy/dist*speed*dt;n.walk+=dt*6.2;if(Math.abs(dx)>1)n.face=dx>0?-1:1;}
 }
 if(['greet','turn','hop','pose'].includes(n.mode)&&n.time>(n.mode==='pose'?1.7:1.1)){n.mode='idle';n.time=0;n.timer=2+n.rng()*5;}
 if(n.timer<=0&&n.mode==='idle'){n.time=0;
  if(n.actor.kind==='standing'){n.mode=n.rng()>.45?'greet':'turn';n.face=n.rng()>.5?1:-1;n.timer=.9+n.rng()*.5;}
  else if((n.actor.kind==='side'||n.actor.kind==='front')&&n.rng()>.35){const b=n.bounds;n.mode='walk';n.timer=20;const x=n.actor.kind==='front'?n.homeX:b.left+n.rng()*(b.right-b.left);n.target={x,y:b.top+n.rng()*Math.max(0,b.bottom-b.top)};}
  else{n.mode=n.actor.kind==='side'&&n.rng()>.62?'hop':'pose';n.timer=1.2+n.rng()*1.3;}
 }
 }}
function frame(n){const a=n.actor;
 if(a.kind==='standing')return a.frames[0];
 if(a.kind==='pose')return a.frames[n.mode==='pose'?1:0];
 if(a.kind==='side'){if(n.mode==='hop')return a.frames[4+Math.min(3,Math.floor(n.time/.27))];return a.frames[n.mode==='walk'?Math.floor(n.walk)%4:n.mode==='pose'?3:0];}
 const back=n.target&&n.target.y<n.y;let row=back?1:0;if(n.mode==='pose')row+=2;return a.frames[row*4+(n.mode==='walk'?Math.floor(n.walk)%4:n.mode==='pose'?Math.min(3,Math.floor(n.time/.4)):0)];
}
function draw(n,ctx,images,camera,label){const im=images[frame(n)];if(!im)return;const stand=n.actor.kind==='standing',scale=stand?1.02:.83;let tilt=0,dip=0,hop=0;
 if(n.mode==='greet'){tilt=Math.sin(Math.min(1,n.time/1.1)*Math.PI)*.13;dip=Math.sin(Math.min(1,n.time/1.1)*Math.PI)*9;}
 if(n.mode==='turn')tilt=Math.sin(n.time*5)*.065;
 if(n.mode==='pose')dip=Math.sin(Math.min(1,n.time/1.7)*Math.PI)*4;
 if(n.mode==='hop')hop=Math.sin(Math.min(1,n.time/1.05)*Math.PI)*19;
 ctx.save();ctx.translate(n.x-camera,n.y);ctx.fillStyle='#23433828';ctx.beginPath();ctx.ellipse(0,3,stand?22:38,7,0,0,Math.PI*2);ctx.fill();ctx.translate(0,dip-hop);ctx.rotate(tilt);ctx.scale(scale*(n.actor.kind==='front'?1:n.face),scale);ctx.drawImage(im,-112,-190,224,208);ctx.restore();
 if(n.staff){ctx.save();ctx.translate(n.x-camera,n.y-202);ctx.fillStyle='#fffef3ed';ctx.beginPath();ctx.roundRect(-48,-12,96,24,9);ctx.fill();ctx.fillStyle='#476b5c';ctx.textAlign='center';ctx.font='600 12px system-ui';ctx.fillText(label,0,4);ctx.restore();}
 if(!n.staff&&n.mode==='greet'){ctx.save();ctx.translate(n.x-camera+30,n.y-192);ctx.fillStyle='#ffffffed';ctx.beginPath();ctx.roundRect(-17,-12,34,26,10);ctx.fill();ctx.fillStyle='#678e7a';ctx.font='bold 19px system-ui';ctx.textAlign='center';ctx.fillText('♪',0,7);ctx.restore();}
}
root.CenterLife={get,update,draw,frame,cache};
})(window);
