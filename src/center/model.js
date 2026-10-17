/* Indoor-only map model. Coordinates are feet positions, not sprite bounds. */
(function(root){
 const TYPES={
  lobby:{name:'로비',bg:'휴게실',color:'#71b5aa',service:'reception',games:[]},
  basic:{name:'기초방',bg:'요가실',color:'#b2a0d9',games:[5]},
  gear:{name:'기구방',bg:'트레이닝실',color:'#91b3c8',games:[]},
  group:{name:'단체방',bg:'체육관',color:'#e8b67e',games:[0]},
  posture:{name:'자세 점검방',bg:'운동실',color:'#9fc3a6',games:[2]},
  punish:{name:'체벌방',bg:'마사지실',color:'#d5a0ab',games:[3,4]},
  toilet:{name:'화장실 훈련방',bg:'개방형화장실',color:'#82bacb',games:[]},
  recovery:{name:'회복방',bg:'샤워실',color:'#88bcbc',service:'recovery',games:[]},
  shop:{name:'매점',bg:'매점',color:'#d6ba81',service:'shop',games:[]}
 };
 const specs=[['로비 · 편의시설',['lobby','shop','recovery','recovery','toilet']],['기초 훈련층',['basic','basic','basic','toilet']],['기구 훈련층',['gear','gear','gear','toilet']],['단체 훈련층',['group','group','group','toilet']],['자세 점검층',['posture','posture','posture','toilet']],['집중 훈련층',['punish','punish','punish','recovery','toilet']]];
 const FLOORS=specs.map(([name,kinds],fi)=>({number:fi+1,name,width:420+kinds.length*570,rooms:kinds.map((kind,i)=>({id:`f${fi+1}-${kind}-${i+1}`,kind,number:`${fi+1}${String(i+1).padStart(2,'0')}`,x:570+i*570,...TYPES[kind]}))}));
 const COMPANY_TYPES={
  companyLobby:{name:'회사 로비',bg:'company/lobby',color:'#8daec5',service:'companyReception',games:[]},
  sharedOffice:{name:'공용 사무실',bg:'company/shared',color:'#89acc7',service:'office',games:[]},
  privateOffice:{name:'개인 사무실',bg:'company/private',color:'#9faac1',service:'office',games:[]},
  meeting:{name:'회의실',bg:'company/meeting',color:'#96b9c6',service:'meeting',games:[]},
  lounge:{name:'휴게실',bg:'company/lounge',color:'#9bbda9',service:'recovery',games:[]},
  pantry:{name:'탕비실',bg:'company/pantry',color:'#bdb494',service:'pantry',games:[]},
  companyToilet:{name:'화장실',bg:'company/toilet',color:'#9ab9c5',service:'companyToilet',games:[]}
 };
 Object.assign(TYPES,COMPANY_TYPES);
 FLOORS.forEach(f=>f.place='center');
 const companySpecs=[['로비 · 지원시설',['companyLobby','lounge','pantry','companyToilet']],['공용 업무층',['sharedOffice','sharedOffice','meeting','pantry','companyToilet']],['개인 업무층',['privateOffice','privateOffice','meeting','lounge','companyToilet']]];
 companySpecs.forEach(([name,kinds],fi)=>FLOORS.push({place:'company',number:fi+1,name,width:420+kinds.length*570,rooms:kinds.map((kind,i)=>({id:`company-f${fi+1}-${kind}-${i+1}`,kind,number:`${fi+1}${String(i+1).padStart(2,'0')}`,x:570+i*570,...TYPES[kind]}))}));
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 function bounds(scene){
  if(scene.type==='corridor')return {left:60,right:FLOORS[scene.floor].width-60,top:443,bottom:672};
  const k=FLOORS[scene.floor].rooms[scene.room].kind;
  return {left:75,right:1205,top:FLOORS[scene.floor].place==='company'?515:k==='punish'?590:k==='recovery'?555:k==='lobby'?570:k==='shop'?570:k==='toilet'?555:500,bottom:674};
 }
 function entrance(floor,index){return {x:FLOORS[floor].rooms[index].x,y:455};}
 const JUMP_DURATION=.7;
 function makeState(){return {scene:{type:'corridor',floor:0,room:0},player:{x:340,y:584,dir:'left',walk:0,moving:false,jump:0,jumpTime:0,jumpDir:null,airX:0,airY:0,moveX:0,moveY:0,lastMoveAge:1},target:null,camera:0,outfit:'lavender-yoga',visited:{},records:{},hp:100,mp:100};}
 function changeFloor(s,floor){if(floor<0||floor>=FLOORS.length)return false;s.scene={type:'corridor',floor,room:0};s.player.x=220;s.player.y=575;s.target=null;s.camera=0;return true;}
 function enterRoom(s,index){const f=FLOORS[s.scene.floor];if(!f.rooms[index])return false;s.scene={type:'room',floor:s.scene.floor,room:index};s.player.x=640;s.player.y=644;s.player.dir='up';s.target=null;s.camera=0;s.visited[f.rooms[index].id]=true;return true;}
 function leaveRoom(s){const p=entrance(s.scene.floor,s.scene.room);s.scene={...s.scene,type:'corridor'};s.player.x=p.x;s.player.y=560;s.player.dir='down';s.target=null;return true;}
 function startJump(s){const p=s.player;if(p.jumpTime>0)return false;p.jumpTime=JUMP_DURATION;p.jumpDir=p.dir;p.airX=p.lastMoveAge<.18?p.moveX:0;p.airY=p.lastMoveAge<.18?p.moveY:0;return true;}
 function jumpFrame(p){const t=1-p.jumpTime/JUMP_DURATION;return t<.14?0:t<.46?1:t<.8?2:3;}
 function step(s,dx,dy,dt){
  const b=bounds(s.scene),p=s.player,m=Math.hypot(dx,dy),air=p.jumpTime>0,ox=p.x,oy=p.y;
  p.lastMoveAge+=dt;let ux=0,uy=0;
  if(m>.08){ux=dx/m;uy=dy/m;p.moveX=ux;p.moveY=uy;p.lastMoveAge=0;if(air){p.airX=ux;p.airY=uy;}}
  else if(air){ux=p.airX;uy=p.airY;}
  p.x=clamp(p.x+ux*245*dt,b.left,b.right);p.y=clamp(p.y+uy*190*dt,b.top,b.bottom);
  p.moving=Math.hypot(p.x-ox,p.y-oy)>.001;
  if(p.moving){if(!air)p.dir=Math.abs(ux)>Math.abs(uy)*1.35?(ux<0?'left':'right'):(uy<0?'up':'down');p.walk=(p.walk+dt*8.2)%4;}
  if(air){p.jumpTime=Math.max(0,p.jumpTime-dt);const t=1-p.jumpTime/JUMP_DURATION;p.jump=Math.sin(clamp((t-.1)/.76,0,1)*Math.PI)*65;if(!p.jumpTime){p.jump=0;p.jumpDir=null;p.airX=p.airY=0;}}
  else p.jump=0;
 }
 function nearby(s){const p=s.player;if(s.scene.type==='corridor'){if(p.x<330&&p.y<610)return {type:'lift',label:'층 이동',x:180,y:440};const f=FLOORS[s.scene.floor];for(let i=0;i<f.rooms.length;i++)if(Math.abs(p.x-f.rooms[i].x)<155&&p.y<568)return {type:'enter',index:i,label:`${f.rooms[i].name} ${f.rooms[i].number}호`,x:f.rooms[i].x,y:448};return null;}
  const r=FLOORS[s.scene.floor].rooms[s.scene.room];if(p.y>635&&Math.abs(p.x-640)<165)return {type:'exit',label:'복도로',x:640,y:690};if(p.x<145)return {type:'adjacent',delta:-1,label:s.scene.room>0?'이전 방':'복도로',x:90,y:610};if(p.x>1135)return {type:'adjacent',delta:1,label:s.scene.room<FLOORS[s.scene.floor].rooms.length-1?'다음 방':'복도로',x:1190,y:610};if(Math.abs(p.x-820)<180)return {type:'activity',label:r.service==='recovery'?'쉬어가기':r.service==='shop'?'상품 보기':r.service==='reception'?'안내 보기':r.games.length?'미션 선택':'시설 살펴보기',x:820,y:560};return null;
 }
 const api={TYPES,FLOORS,clamp,bounds,entrance,makeState,changeFloor,enterRoom,leaveRoom,step,startJump,jumpFrame,JUMP_DURATION,nearby};root.CenterModel=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
