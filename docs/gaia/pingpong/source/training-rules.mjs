// GAIA PINGPONG v5: 12 / 16 / 20 fixed minigame nodes, without changing v4 placements.
// The primary/secondary gains come from gaia-pingpong-design.md.
export const TRAINING_DATA=[
 {id:'wiggle',name:'움찔 찾기',total:3,main:'spin',sub:'defense'},
 {id:'behind',name:'뒤를 조심!!',total:3,main:'spin',sub:'defense'},
 {id:'balance',name:'균형 잡기',total:3,main:'charm',sub:'spin'},
 {id:'squat',name:'스쿼트',total:3.7,main:'charm',sub:'defense'},
 {id:'cylinder',name:'리듬 실린더',total:3.7,main:'power',sub:'charm'},
 {id:'tap',name:'백만 대 챌린지',total:3.7,main:'defense',sub:'power'},
 {id:'batting',name:'컨베이어 배팅',total:4.4,main:'power',sub:'spin'},
 {id:'fetch',name:'물어와!',total:4.4,main:'defense',sub:'charm'}
];
export const TRAINING_LOOKUP=Object.fromEntries(TRAINING_DATA.map(g=>[g.id,g]));

// Keep the exact v4 game/stage on every original training node for save compatibility.
const V4_GAME_ORDER=[
 ['balance','cylinder','tap','wiggle','squat','batting','fetch','behind','squat','batting','fetch','behind'],
 ['behind','squat','batting','fetch','wiggle','balance','cylinder','tap'],
 ['fetch','tap','cylinder','balance','behind','batting','squat','wiggle']
];
const V4_EXTRA_TRAINING={1:['9','25','40'],2:['41']};
const V4_NODE_IDS=[
 ['2','4','9','11','14','18','20','23','25','26','28','30'],
 ['2','9','12','22','25','27','40','47'],
 ['2','12','22','27','37','41','47','57']
];
// Only former blank nodes become training; match, fork, shop, cup and events stay intact.
const V5_NEW_NODES={
 1:['4','14','18','30','34','36','39','43'],
 2:['4','9','14','18','25','30','34','39','40','48','54','58']
};
const V5_NEW_GAMES={
 1:['tap','cylinder','balance','wiggle','fetch','batting','squat','behind'],
 2:['balance','cylinder','tap','wiggle','squat','batting','fetch','behind','balance','cylinder','tap','wiggle']
};
export function assignTrainingNodes(base,region){
 for(const id of V4_EXTRA_TRAINING[region]||[]){
  if(base[id]?.kind!=='blank')throw Error('Changed v4 training node '+region+'/'+id);
  base[id].kind='train';
 }
 const v4ids=V4_NODE_IDS[region],v4games=V4_GAME_ORDER[region];
 if(!v4ids||v4ids.length!==v4games.length)throw Error('Unrecognized region '+region);
 v4ids.forEach((nodeId,i)=>{
  const node=base[nodeId];
  if(!node||node.kind!=='train')throw Error('Missing v4 training node '+region+'/'+nodeId);
  const stage=region===0?1+Math.floor(i*3/v4ids.length):
   region===1?4+Math.floor(i*3/v4ids.length):7+Math.floor(i*4/v4ids.length);
  node.training={id:v4games[i],stage};
 });
 for(const [i,nodeId] of (V5_NEW_NODES[region]||[]).entries()){
  const node=base[nodeId];
  if(!node||node.kind!=='blank')throw Error('Cannot replace nonblank tour node '+region+'/'+nodeId);
  node.kind='train';
  const stage=region===1?Math.min(6,4+Math.floor(node.n/48*3)):
   Math.min(10,7+Math.floor(node.n/60*4));
  node.training={id:V5_NEW_GAMES[region][i],stage};
 }
 const train=Object.values(base).filter(n=>n.kind==='train');
 if(train.length!==[12,16,20][region]||train.some(n=>!n.training))
  throw Error('Unexpected v5 training node layout in region '+region);
 return base;
}

export function normalizeTrainingState(s){
 if(!s.trainingClears||typeof s.trainingClears!=='object'||Array.isArray(s.trainingClears))s.trainingClears={};
 for(const [id,v]of Object.entries(s.trainingClears)){
  if(!TRAINING_LOOKUP[id]||!Array.isArray(v)||v.length>10||
   v.some((n,i)=>!Number.isInteger(n)||n<1||n>10||(i>0&&n<=v[i-1])))delete s.trainingClears[id];
 }
 if(s.lastTraining&&!TRAINING_LOOKUP[s.lastTraining])s.lastTraining=null;
 return s;
}

export function resolveTraining(s,input,nodeTraining){
 const p=s.pending,g=TRAINING_LOOKUP[input.game],stage=input.stage;
 // A result from a different game or stage cannot award anything at this node.
 if(!p||p.kind!=='train'||p.id!==input.id||!g||!nodeTraining||
  nodeTraining.id!==input.game||nodeTraining.stage!==stage||
  !Number.isInteger(stage)||stage<1||stage>10)return null;
 normalizeTrainingState(s);
 const ratio=Math.max(0,Math.min(1,Number(input.ratio)||0));
 const success=input.success===true,repeat=s.lastTraining===g.id;
 const cap=25+7.5*stage;
 const weight=(success?.75+.25*ratio:.22)*(repeat?.6:1)*(s.stats[g.main]>cap?.25:1);
 const gains={charm:0,power:0,defense:0,spin:0};
 gains[g.main]=+(g.total*2/3*weight).toFixed(2);
 gains[g.sub]=+(g.total/3*weight).toFixed(2);
 for(const [id,v]of Object.entries(gains))s.stats[id]=Math.min(100,+(s.stats[id]+v).toFixed(2));
 const clear=s.trainingClears[g.id]??(s.trainingClears[g.id]=[]);
 if(success&&!clear.includes(stage)){clear.push(stage);clear.sort((a,b)=>a-b);}
 s.lastTraining=g.id;
 s.hp=Math.max(0,s.hp-12);
 let detail=stage+'단계 · '+(success?'성공':'도전 완료')+' · 달성률 '+Math.round(ratio*100)+'%';
 if(repeat)detail+=' · 연속 훈련 보정';
 if(s.hp===0){s.hp=35;s.turn+=2;detail+=' · 회복 2턴';}
 if(s.turn>[18,22,26][s.region]){s.fame=Math.max(0,s.fame-1);detail+=' · 일정 초과 명성 -1';}
 const title=g.name+(success?' 성공!':' 훈련 완료');
 s.history.unshift({turn:s.turn,region:s.region,title,detail});
 s.history=s.history.slice(0,45);
 s.pending=null;
 return{title,detail,gains,cash:0,success,game:g.id,stage};
}
