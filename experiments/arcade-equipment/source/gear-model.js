const GearModel=(()=>{
 const stats={power:'파워',spin:'스핀',speed:'속도',control:'컨트롤'};
 const grades=[{name:'일반',count:1,low:1,high:3},{name:'희귀',count:2,low:2,high:4},{name:'특급',count:3,low:3,high:5}];
 const colors=['#f16fa7','#69d8c7','#ffbb89','#b79aee','#83b7ef','#f1d47b'];
 const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
 const int=(r,a,b)=>a+Math.floor(clamp(r(),0,.999999999)*(b-a+1));
 function validItem(x){return x&&typeof x.id==='string'&&/^[a-zA-Z0-9_-]{1,99}$/.test(x.id)&&['racket','ball'].includes(x.kind)&&Number.isInteger(x.grade)&&grades[x.grade]&&/^#[0-9a-f]{6}$/i.test(x.color)&&Number.isInteger(x.theme)&&x.theme>=0&&x.theme<6&&Number.isInteger(x.region)&&x.region>=-1&&x.region<=2&&Array.isArray(x.options)&&x.options.length===grades[x.grade].count&&x.options.every(o=>o&&Object.hasOwn(stats,o.key)&&Number.isInteger(o.value)&&o.value>=1&&o.value<=6)&&new Set(x.options.map(o=>o.key)).size===x.options.length}
 function ensure(s){
  let g=s.gear;
  if(!g||g.version!==1)g=s.gear={version:1,coins:0,items:[],equipped:{racket:null,ball:null},claimed:[]};
  g.coins=Number.isSafeInteger(g.coins)?clamp(g.coins,0,1e9):0;
  const ids=new Set();g.items=(Array.isArray(g.items)?g.items:[]).filter(x=>validItem(x)&&!ids.has(x.id)&&ids.add(x.id));
  if(!g.equipped||typeof g.equipped!=='object')g.equipped={};
  for(const kind of ['racket','ball'])if(!g.items.some(x=>x.id===g.equipped[kind]&&x.kind===kind))g.equipped[kind]=null;
  g.claimed=(Array.isArray(g.claimed)?g.claimed:[]).filter(x=>typeof x==='string').slice(-1000);
  return g;
 }
 function roll({random=Math.random,id=globalThis.crypto.randomUUID(),champion=false,region=-1}={}){
  const r=random,kind=r()<.5?'racket':'ball',p=r();
  const grade=champion?(p<[.20,.30,.40][region]?2:1):(p<.65?0:p<.93?1:2);
  const rule=grades[grade],keys=Object.keys(stats),options=[];
  for(let i=0;i<rule.count;i++){
   const key=keys.splice(int(r,0,keys.length-1),1)[0];
   const low=champion?Math.min(6,rule.low+Math.max(0,region)):rule.low;
   const high=champion?Math.min(6,rule.high+Math.max(0,region)):rule.high;
   options.push({key,value:int(r,low,high)});
  }
  const theme=champion?region:int(r,0,5);
  return{id,kind,grade,region:champion?region:-1,theme,color:colors[theme],options};
 }
 function buy(s,options={}){const g=ensure(s);if(g.coins<80)throw Error('코인이 부족합니다.');const item=roll(options);g.coins-=80;g.items.push(item);return item}
 function reward(s,{token,won,champion=false,region=0,quit=false,random=Math.random}={}){
  const g=ensure(s);if(!token||quit||g.claimed.includes(token))return null;
  g.claimed.push(token);g.claimed=g.claimed.slice(-1000);const coins=won?20:8;g.coins=Math.min(1e9,g.coins+coins);
  const item=won&&champion?roll({random,champion:true,region}):null;if(item)g.items.push(item);
  return{coins,item};
 }
 function equip(s,id){const g=ensure(s),item=g.items.find(x=>x.id===id);if(!item)throw Error('보유한 장비가 아닙니다.');g.equipped[item.kind]=id;return item}
 function remove(s,id){const g=ensure(s),item=g.items.find(x=>x.id===id);if(!item)return false;for(const k of ['racket','ball'])if(g.equipped[k]===id)g.equipped[k]=null;g.items=g.items.filter(x=>x.id!==id);return true}
 function payload(s){const g=ensure(s),equipped=Object.fromEntries(['racket','ball'].map(k=>[k,g.items.find(x=>x.id===g.equipped[k])||null]));const bonuses=Object.fromEntries(Object.keys(stats).map(k=>[k,0]));for(const item of Object.values(equipped))for(const o of item?.options||[])bonuses[o.key]=Math.min(10,bonuses[o.key]+o.value);return{bonuses,racket:equipped.racket,ball:equipped.ball}}
 function name(item){return(item.region>=0?['동네','국내','국제'][item.region]+' 챔피언의 ':['핑크 하트 ','민트 스타 ','살구 리본 ','라벤더 문 ','블루 스파크 ','골드 크라운 '][item.theme])+(item.kind==='racket'?'탁구채':'컬러 공')}
 return{stats,grades,colors,validItem,ensure,roll,buy,reward,equip,remove,payload,name};
})();
if(typeof module!=='undefined')module.exports=GearModel;
