import assert from 'node:assert/strict';
import fs from 'node:fs';
import {fresh,board as originalBoard,validate} from './model-v2.js';
import {TRAINING_DATA,TRAINING_LOOKUP,assignTrainingNodes,normalizeTrainingState,resolveTraining} from './training-rules.mjs';

assert.equal(TRAINING_DATA.length,8);
assert.equal(new Set(TRAINING_DATA.map(g=>g.id)).size,8);
for(const region of [0,1,2]){
 const b=assignTrainingNodes(originalBoard(region),region);
 const training=Object.values(b).filter(node=>node.training);
 assert.equal(training.length,[12,16,20][region]);
 for(const g of TRAINING_DATA)assert(training.some(n=>n.training.id===g.id),g.name+' missing in '+region);
 const tally={charm:0,power:0,defense:0,spin:0};
 for(const n of training){
  const g=TRAINING_LOOKUP[n.training.id];
  tally[g.main]++;
  assert(n.training.stage>=[1,4,7][region]);
  assert(n.training.stage<=[3,6,10][region]);
 }
 const count=[3,4,5][region];
 assert.deepEqual(tally,{charm:count,power:count,defense:count,spin:count});
 // No other type of board location may be replaced by training.
 for(const [id,old] of Object.entries(originalBoard(region))){
  if(old.kind!=='blank'&&old.kind!=='train')assert.equal(b[id].kind,old.kind);
  assert.deepEqual(b[id].next,old.next);
 }
}
// Existing saves still land on exactly the same 28 minigames and stages as v4.
const v4positions=[
 ['2','4','9','11','14','18','20','23','25','26','28','30'],
 ['2','9','12','22','25','27','40','47'],
 ['2','12','22','27','37','41','47','57']
];
const v4games=[
 ['balance','cylinder','tap','wiggle','squat','batting','fetch','behind','squat','batting','fetch','behind'],
 ['behind','squat','batting','fetch','wiggle','balance','cylinder','tap'],
 ['fetch','tap','cylinder','balance','behind','batting','squat','wiggle']
];
for(const region of [0,1,2]){
 const b=assignTrainingNodes(originalBoard(region),region);
 v4positions[region].forEach((id,i)=>{
  const stage=[1,4,7][region]+Math.floor(i*[3,3,4][region]/v4positions[region].length);
  assert.deepEqual(b[id].training,{id:v4games[region][i],stage});
 });
}
for(const region of [0,1,2]){
 const nodes=Object.values(assignTrainingNodes(originalBoard(region),region)).filter(n=>n.training);
 for(const node of nodes){
  const s=normalizeTrainingState(fresh(42));
  s.region=region;s.maxRegion=region;s.position=node.id;
  s.pending={id:'pending-'+region+'-'+node.id,kind:'train',stage:'arrived',round:0,opponents:[]};
  const expected=node.training,id=s.pending.id;
  const other=TRAINING_DATA.find(g=>g.id!==expected.id);
  assert.equal(resolveTraining(s,{id,game:other.id,stage:expected.stage,success:true,ratio:1},expected),null);
  const wrongStage=expected.stage===10?9:expected.stage+1;
  assert.equal(resolveTraining(s,{id,game:expected.id,stage:wrongStage,success:true,ratio:1},expected),null);
  assert.equal(s.pending.id,id);
  const r=resolveTraining(s,{id,game:expected.id,stage:expected.stage,success:true,ratio:1},expected);
  assert.equal(r.game,expected.id);
  assert(r.gains[TRAINING_LOOKUP[expected.id].main]>0);
  assert.deepEqual(s.trainingClears[expected.id],[expected.stage]);
  assert.equal(s.hp,88);
  assert.equal(s.pending,null);
  validate(JSON.parse(JSON.stringify(s)));
 }
}
const s=normalizeTrainingState(fresh(9));
s.trainingClears.fetch=[2,6,9];
normalizeTrainingState(s);
assert.deepEqual(s.trainingClears.fetch,[2,6,9]);
assert.equal(resolveTraining(s,{id:'bad',game:'fetch',stage:1,success:true,ratio:1},{id:'fetch',stage:1}),null);
const root=fs.existsSync(new URL('../release/GAIA-Pingpong-v5.html',import.meta.url))?
 new URL('../release/',import.meta.url):new URL('../',import.meta.url);
const main=fs.readFileSync(new URL('GAIA-Pingpong-v5.html',root),'utf8');
const casual=fs.statSync(new URL('GAIA-Pingpong-v3-Casual.html',root));
assert(casual.size>80e6);
assert(main.includes('function assignTrainingNodes('));
assert(main.includes('class="node-game-title"'));
assert(main.includes('frame.src=\'GAIA-Pingpong-v3-Casual.html\''));
assert(!main.includes('미니게임 선택'));
assert(main.includes('const EMBEDDED_MATCH='));
assert(!main.includes('const EMBEDDED_SQUAT='));
console.log('v5 모델 검증 통과: 3지역 48훈련 노드·8종·스탯 균등 배치·v4 호환·단계 자동·결과 검증·저장');
