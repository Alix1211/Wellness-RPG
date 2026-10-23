// Appended inside the original Pingpong module; other modes keep their logic.
KINDS.train.name='훈련';
const baseBoard=board;
board=function(region=0){return assignTrainingNodes(baseBoard(region),region);};
const baseTour=tour;
const baseShowPending=showPending;
const baseOpenGame=openGame;
const baseCloseGame=closeGame;
const baseHandleGame=handleGame;
const baseFinish=finish;

const GAME_NODE_LABELS={
 wiggle:'움찔<br>찾기',behind:'뒤를<br>조심!!',balance:'균형<br>잡기',
 squat:'스쿼트',cylinder:'리듬<br>실린더',tap:'백만 대<br>챌린지',
 batting:'컨베이어<br>배팅',fetch:'물어와!'
};
tour=function(){
 // Preserve the existing scrolling/current-position behavior of the map.
 baseTour.recenter=tour.recenter;
 baseTour();
 tour.recenter=baseTour.recenter;
 for(const node of Object.values(board(state.region))){
  if(!node.training)continue;
  const g=TRAINING_LOOKUP[node.training.id];
  const target=document.querySelector('.node[data-value="'+node.id+'"]');
  if(!target)continue;
  target.classList.add('training-node');
  target.dataset.main=g.main;
  target.dataset.statLabel=STATS.find(([id])=>id===g.main)[1]+' ↑';
  target.innerHTML='<span class="node-game-title">'+GAME_NODE_LABELS[g.id]+'</span>';
  target.setAttribute('aria-label',node.n+'번 '+g.name+' '+node.training.stage+'단계 훈련');
  target.title=g.name+' · '+node.training.stage+'단계';
 }
};

function currentNodeTraining(){return board(state.region)[state.position]?.training||null;}
showPending=function(){
 if(state.pending?.kind==='train'){
  const training=currentNodeTraining();
  if(training)openGame('train',null,false,training);
  else toast('훈련 노드를 확인할 수 없습니다.');
  return;
 }
 return baseShowPending();
};
openGame=function(type,npc,arcade=false,training=null){
 if(type!=='train')return baseOpenGame(type,npc,arcade);
 const planned=currentNodeTraining();
 if(!state.pending||state.pending.kind!=='train'||!training||!planned||
  training.id!==planned.id||training.stage!==planned.stage){
  toast('현재 노드의 훈련만 시작할 수 있습니다.');return;
 }
 closeModal();
 const token=state.pending.id+'-'+crypto.getRandomValues(new Uint32Array(1))[0];
 activeGame={type:'train',token,pendingId:state.pending.id,training:{...planned}};
 state.pending.stage='playing';
 save();
 const frame=$('#gameFrame');
 frame.onload=()=>{
  if(activeGame?.token!==token)return;
  frame.contentWindow?.postMessage({
   type:'gaia-pong-start',token,game:training.id,stage:training.stage,muted:!!settings.muted
  },'*');
 };
 frame.src='GAIA-Pingpong-v3-Casual.html';
 $('#game').hidden=false;
};
closeGame=function(){
 $('#gameFrame').onload=null;
 return baseCloseGame();
};
finish=function(input){
 if(state.pending?.kind!=='train')return baseFinish(input);
 const r=resolveTraining(state,input,currentNodeTraining());
 if(!r)return;
 save();tour();
 const gain=STATS.filter(([k])=>r.gains[k]).map(([k,name])=>name+' +'+r.gains[k].toFixed(2)).join(' · ');
 modal('<span class="eyebrow">WORLD TOUR</span><h2>'+r.title+'</h2><p>'+r.detail+
 '</p><p class="notice">'+gain+'</p><div class="actions">'+button('계속','result-close')+'</div>');
};
handleGame=function(data){
 if(activeGame?.type!=='train')return baseHandleGame(data);
 const g=activeGame,t=g.training,p=state.pending;
 const quit=data.score==='중도 종료'&&data.game==null;
 if(!quit&&(data.game!==t.id||data.stage!==t.stage))return;
 if(!p||p.kind!=='train'||p.id!==g.pendingId){closeGame();return;}
 closeGame();
 finish({id:p.id,game:t.id,stage:t.stage,ratio:data.ratio,success:data.success===true});
};
normalizeTrainingState(state);
