// 새 여성 적 3종. 모든 프레임은 서 있는 키 169 기준으로 사전 환산(임시).
// 눕거나 날아가는 프레임을 개별 높이에 맞춰 확대하지 않는다.
window.FemaleEnemies=(()=>{
 const DATA={"yoga":{"src":"assets/enemy/female/yoga.webp","frames":{"hip0":{"rect":[0,0,210,331],"anchor":[41.836353778664794,165.5]},"hip1":{"rect":[512,0,264,332],"anchor":[67.21931935583378,166.0]},"jump0":{"rect":[1024,0,169,260],"anchor":[44.310342976874395,130.0]},"jump1":{"rect":[1536,0,225,320],"anchor":[96.87036782335558,160.0]},"jump2":{"rect":[0,384,170,294],"anchor":[65.55725186101651,147.0]},"jump3":{"rect":[512,384,166,257],"anchor":[45.59681811442425,128.5]},"dive0":{"rect":[1024,384,348,233],"anchor":[87.0,58.25]},"dive1":{"rect":[1536,384,411,115],"anchor":[102.75,28.75]},"dive2":{"rect":[0,768,319,121],"anchor":[79.75,30.25]},"state0":{"rect":[512,768,225,340],"anchor":[57.03390379653863,170.0]},"state1":{"rect":[1024,768,342,322],"anchor":[82.96890635822471,161.0]},"state2":{"rect":[1536,768,431,124],"anchor":[107.75,60.0]}},"worldHeight":169},"bikini":{"src":"assets/enemy/female/bikini.webp","frames":{"hip0":{"rect":[0,0,191,333],"anchor":[36.90477911410671,166.5]},"hip1":{"rect":[512,0,239,328],"anchor":[54.82792947048216,164.0]},"jump0":{"rect":[1024,0,195,257],"anchor":[48.28733541939948,128.5]},"jump1":{"rect":[1536,0,233,332],"anchor":[98.0688684816091,166.0]},"jump2":{"rect":[0,384,183,288],"anchor":[74.94954008355597,144.0]},"jump3":{"rect":[512,384,186,257],"anchor":[47.26333841375007,128.5]},"dive0":{"rect":[1024,384,357,241],"anchor":[89.25,60.25]},"dive1":{"rect":[1536,384,388,130],"anchor":[97.0,32.5]},"dive2":{"rect":[0,768,309,167],"anchor":[77.25,41.75]},"state0":{"rect":[512,768,266,340],"anchor":[66.04424508897871,170.0]},"state1":{"rect":[1024,768,335,315],"anchor":[41.461504580166306,157.5]},"state2":{"rect":[1536,768,438,115],"anchor":[109.5,55.5]}},"worldHeight":169},"queen":{"src":"assets/enemy/female/queen.webp","frames":{"shoot0":{"rect":[0,0,203,340],"anchor":[54.84114670287678,170.0]},"shoot1":{"rect":[512,0,262,335],"anchor":[84.61065277845539,167.5]},"shoot2":{"rect":[1024,0,318,330],"anchor":[93.65740115426193,165.0]},"walk0":{"rect":[1536,0,229,339],"anchor":[51.625356342515666,169.5]},"walk1":{"rect":[0,384,225,338],"anchor":[59.67869911383557,169.0]},"walk2":{"rect":[512,384,230,340],"anchor":[52.87208886050719,170.0]},"walk3":{"rect":[1024,384,221,340],"anchor":[52.92595205427935,170.0]},"state0":{"rect":[1536,384,238,340],"anchor":[37.80553076093906,170.0]},"state1":{"rect":[0,768,351,250],"anchor":[154.0932221891897,125.0]},"state2":{"rect":[512,768,389,145],"anchor":[97.25,70.5]}},"worldHeight":169}};
 const CHAR={yogaFighter:'yoga',bikiniFighter:'bikini',waterQueen:'queen'};
 const assets={female_yoga:'assets/enemy/female/yoga.webp',female_bikini:'assets/enemy/female/bikini.webp',female_queen:'assets/enemy/female/queen.webp'};
 const types={
  yogaFighter:{name:'핑크 요가 파이터',female:true,regional:true,frames:['female_yoga'],hp:48,attack:7,speed:95,drawH:169,reach:106,spacing:86,telegraph:.62,interval:1.85,style:'hip',pattern:['hip','dive'],reward:5},
  bikiniFighter:{name:'비키니 파이터',female:true,regional:true,frames:['female_bikini'],hp:46,attack:8,speed:108,drawH:169,reach:114,spacing:90,telegraph:.68,interval:2.05,style:'dive',pattern:['dive','hip'],reward:5},
  waterQueen:{name:'물총 여왕',female:true,regional:true,frames:['female_queen'],hp:58,attack:7,speed:78,drawH:169,reach:90,spacing:260,keep:260,telegraph:.85,interval:2.6,style:'water',pattern:['water'],reward:7}
 };
 function frame(ctx,images,kind,key){
  const char=CHAR[kind],data=DATA[char],f=data?.frames[key],im=images['female_'+char];
  if(!f||!im||!im.complete||!im.naturalWidth)return false;
  const [x,y,w,h]=f.rect;ctx.drawImage(im,x,y,w,h,-f.anchor[0],-f.anchor[1],w/2,h/2);return true;
 }
 function pose(e,time){
  const queen=e.kind==='waterQueen';let key=queen?'shoot0':'state0',lift=0,angle=0,fade=1;
  if(e.exit){const t=e.exit.age;key=t<.42?(queen?'state1':'state1'):'state2';lift=t<.42?Math.sin(t/.42*Math.PI)*38:0;fade=t>.9?Math.max(0,(e.exit.duration-t)/(e.exit.duration-.9)):1;}
  else if(e.air){key='state1';lift=e.air.lift||0;angle=Math.sin(e.air.age*6)*.12;}
  else if(e.floorTime>0){key='state2';lift=e.floorLift||0;}
  else if(e.hurt>0){key=queen?'state0':'state1';}
  else if(e.dive){const t=e.dive.age/e.dive.duration;key=t<.2?'dive0':t<.75?'dive1':'dive2';lift=78+Math.sin(t*Math.PI)*18;}
  else if(e.windup>0){key=queen?'shoot1':e.windupStyle==='dive'?'jump0':'hip0';}
  else if(e.swing>0){key=queen?'shoot2':e.swingStyle==='dive'?'dive2':'hip1';if(key==='dive2')lift=68;}
  else if(e.walking){const n=Math.floor((e.motionPhase||time*7)*.65)%4;key=(queen?'walk':'jump')+n;if(!queen)lift=n===1?13:n===2?17:0;}
  return {key,lift,angle,fade};
 }
 function draw(ctx,images,e,game){
  const p=pose(e,game.elapsed);ctx.save();ctx.translate(e.x-game.camera,e.y);
  ctx.fillStyle='#6047634d';ctx.beginPath();ctx.ellipse(0,-2,30,9,0,0,Math.PI*2);ctx.fill();
  ctx.translate(0,-p.lift);ctx.scale(-e.face,1);ctx.rotate(p.angle);ctx.globalAlpha=p.fade;
  frame(ctx,images,e.kind,p.key);ctx.restore();
 }
 function decorate(plan,stage){
  plan.forEach((w,i)=>{if(w.boss||w.eventBoss)return;
   if(i%2===0&&w.packs[0]?.length){const p=w.packs[0];p[p.length-1]=i%4===0?'yogaFighter':'bikiniFighter';}
   if(i%3===1&&w.packs[1]?.length){const p=w.packs[1];p[p.length-1]='waterQueen';}
  });
  if(stage===1&&plan[0]?.packs[1]?.length){const p=plan[0].packs[1];p[p.length-1]='bikiniFighter';}
  return plan;
 }
 return {types,assets,frame,draw,pose,decorate,data:DATA};
})();
