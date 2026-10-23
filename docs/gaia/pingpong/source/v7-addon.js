// v7: repair the actual table-tennis route and replace improvised CSS art.
// This is appended after the v5 mini-game bridge and v6 decorations.
const v7BaseBoard=board;
board=function(region=0){
 const preserve=(state.pending?.kind==='train'&&state.region===region)?state.position:null;
 return balanceTourBoard(v7BaseBoard(region),region,preserve);
};

const v7PriorTour=tour;
tour=function(){
 v7PriorTour.recenter=tour.recenter;
 v7PriorTour();
 tour.recenter=v7PriorTour.recenter;
 const b=board(state.region);
 for(const node of Object.values(b)){
  const target=document.querySelector('.node[data-value="'+node.id+'"]');
  if(!target||node.kind==='train')continue;
  target.classList.add('gaia-tour-node','gaia-tour-'+node.kind);
  target.dataset.nodeKind=node.kind;
  target.setAttribute('aria-label',node.n+'번 '+KINDS[node.kind].name);
  if(node.kind==='blank'){
   target.innerHTML='';
   target.title='빈 노드';
   continue;
  }
  let art=node.kind;
  if(node.kind==='cup'||node.kind==='final'){
   art=['cup-local','cup-national','cup-world'][state.region];
  }
  const src=V7_ART.icons[art]||V7_ART.icons.start;
  const label=node.kind==='match'?'<span class="gaia-tour-label">탁구 경기</span>':'';
  target.innerHTML='<img class="gaia-tour-art" alt="" draggable="false" src="'+src+'">'+label;
  target.title=node.kind==='match'?'탁구 경기':KINDS[node.kind].name;
 }
 // Exact designer cards; these are movement cards, not text buttons.
 document.querySelectorAll('.move-card').forEach((button,i)=>{
  const number=Number(button.textContent.trim());
  const source=V7_ART.cards['0-'+number];
  if(!source)return;
  button.classList.add('v7-art-card');
  button.innerHTML='<img src="'+source+'" alt="" draggable="false">';
 });
 document.querySelectorAll('.ticket-row [data-action="ticket"]').forEach(button=>{
  const number=Number(button.textContent.replace(/\D/g,''));
  const source=V7_ART.cards['1-'+number];
  if(!source)return;
  button.classList.add('v7-ticket-art');
  button.innerHTML='<img src="'+source+'" alt="" draggable="false">';
 });
 // A real 3-D practice match can be reached immediately, regardless of cards.
 const quick=document.createElement('button');
 quick.type='button';
 quick.className='gaia-quick-table';
 quick.dataset.action='quick-pingpong';
 quick.setAttribute('aria-label','탁구 연습경기 시작');
 quick.innerHTML='<img alt="" draggable="false" src="'+V7_ART.icons.match+'"><span>탁구 연습</span>';
 document.querySelector('.screen.board')?.appendChild(quick);
};

// The quick match is deliberately free practice: no unlocks or stat rewards.
const v7PriorHandleGame=handleGame;
handleGame=function(data){
 if(activeGame?.quickPractice){
  const score=String(data.score||'').slice(0,24);
  closeGame();
  tour();
  modal('<h2>탁구 연습 종료</h2><p>'+score+'</p><div class="actions">'+
   button('다시 경기','quick-pingpong')+button('맵으로','close','secondary')+'</div>');
  return;
 }
 return v7PriorHandleGame(data);
};

function v7StartQuickMatch(){
 const npc=ROSTER.find(p=>p.region===state.region);
 if(!npc)return toast('선수 정보를 찾지 못했습니다.');
 openGame('match',npc,true);
 if(activeGame?.type==='match')activeGame.quickPractice=true;
}

// Large companion HTML may take time to initialize on Android. Confirm it
// received the start message instead of silently presenting a dead iframe.
let v7MiniWaitId=0;
function v7RemoveMiniLoader(){
 if(v7MiniWaitId){clearTimeout(v7MiniWaitId);v7MiniWaitId=0;}
 document.getElementById('gaia-mini-loading')?.remove();
}
const v7PriorOpenGame=openGame;
openGame=function(type,npc,arcade=false,training=null){
 v7PriorOpenGame(type,npc,arcade,training);
 if(type!=='train'||activeGame?.type!=='train')return;
 v7RemoveMiniLoader();
 const token=activeGame.token;
 const loading=document.createElement('div');
 loading.id='gaia-mini-loading';
 loading.innerHTML='<span>로딩 중…</span>';
 document.getElementById('game')?.appendChild(loading);
 v7MiniWaitId=setTimeout(()=>{
  if(activeGame?.token!==token||!document.getElementById('gaia-mini-loading'))return;
  loading.innerHTML='<span>미니게임 연결 실패</span><button type="button" data-action="retry-mini">다시 시도</button>';
 },24000);
};
const v7PriorCloseGame=closeGame;
closeGame=function(){v7RemoveMiniLoader();return v7PriorCloseGame();};
window.addEventListener('message',e=>{
 if(e.data?.type!=='gaia-pong-ack'||e.source!==document.getElementById('gameFrame')?.contentWindow)return;
 if(activeGame?.type==='train'&&e.data.token===activeGame.token)v7RemoveMiniLoader();
});

document.addEventListener('click',event=>{
 const action=event.target.closest('[data-action]')?.dataset.action;
 if(action!=='quick-pingpong'&&action!=='retry-mini')return;
 event.preventDefault();
 event.stopImmediatePropagation();
 if(action==='quick-pingpong')v7StartQuickMatch();
 else if(activeGame?.type==='train'){
  const frame=document.getElementById('gameFrame');
  frame.src='GAIA-Pingpong-v7-Casual.html?retry='+Date.now();
  const box=document.getElementById('gaia-mini-loading');
  if(box)box.innerHTML='<span>로딩 중…</span>';
  if(v7MiniWaitId)clearTimeout(v7MiniWaitId);
  const token=activeGame.token;
  v7MiniWaitId=setTimeout(()=>{
   if(activeGame?.token===token&&box)box.innerHTML='<span>미니게임 연결 실패</span><button type="button" data-action="retry-mini">다시 시도</button>';
  },24000);
 }
},true);

// The save/export/import buttons remain. Remove only the webpage-style lecture.
const v7PriorSettings=settingsModal;
settingsModal=function(){
 v7PriorSettings();
 document.querySelector('#overlay .modal p.notice')?.remove();
};
