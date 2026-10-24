// v12.12: small regression fixes. Keep the original world-tour and match logic.
// The selection state is already present in the enclosing v12.11 game script.
const v1212OriginalTour=tour;
let v1212LastMapKey='';
tour=function(){
 const old=$('.node-scroll');
 const prior=old?{left:old.scrollLeft,top:old.scrollTop}:null;
 const key=[state.region,state.position,$('#app').clientWidth,$('#app').clientHeight].join(':');
 const needsFocus=!prior||key!==v1212LastMapKey||!!tour.recenter;
 v1212OriginalTour();
 const next=$('.node-scroll');
 if(next&&!needsFocus){next.scrollLeft=prior.left;next.scrollTop=prior.top;}
 v1212LastMapKey=key;
 tour.recenter=false;
};

function v1212RefreshCardSelection(){
 if(screen!=='board'||!$('.node-scroll'))return;
 const hand=selection?(selection.ticket?state.tickets:state.hand):null;
 const card=hand?.[selection.index];
 const reaches=card==null?[]:paths(state,card);
 const reachable=new Set(reaches.map(path=>path.at(-1)));
 $$('.node-scroll .node[data-action="node"]').forEach(node=>{
  node.classList.toggle('reachable',reachable.has(node.dataset.value));
 });
 $$('.move-card').forEach(button=>{
  button.classList.toggle('selected',!!selection&&!selection.ticket&&Number(button.dataset.value)===selection.index);
 });
 $$('.ticket-row button').forEach(button=>{
  button.classList.toggle('selected',!!selection&&selection.ticket&&Number(button.dataset.value)===selection.index);
 });
 const hint=$('.hand-hint');
 if(hint)hint.textContent=selection?'빛나는 도착 노드를 선택하세요':'이동 카드를 골라주세요';
 let cancel=$('.selection-cancel');
 if(selection&&!cancel){
  cancel=document.createElement('button');
  cancel.className='glass selection-cancel';
  cancel.dataset.action='cancel-select';
  cancel.textContent='선택 취소';
  $('.board')?.appendChild(cancel);
 }else if(!selection&&cancel)cancel.remove();
}

choose=function(index,ticket=false){
 if(state.pending||state.champion){if(state.pending)showPending();return;}
 const cards=ticket?state.tickets:state.hand;
 if(!Number.isInteger(index)||index<0||index>=cards.length)return;
 selection={index,ticket};
 // Selecting a movement card changes only the highlights, never the map DOM
 // or the player's camera/scroll position.
 v1212RefreshCardSelection();
};

document.addEventListener('click',event=>{
 const button=event.target.closest('[data-action="cancel-select"]');
 if(!button||screen!=='board')return;
 event.preventDefault();
 event.stopImmediatePropagation();
 selection=null;
 v1212RefreshCardSelection();
},true);

document.head.insertAdjacentHTML('beforeend',`<style id="gaia-v1212-overrides">
/* In minigames, the old large text pause button covered score labels.
   Leave a discrete exit/pause control reachable without covering the HUD. */
#game[data-v12-match="false"] #gameBack{
 position:absolute!important;left:6px!important;right:auto!important;
 top:auto!important;bottom:6px!important;min-width:30px!important;
 width:30px!important;height:30px!important;padding:0!important;
 font-size:0!important;line-height:30px!important;opacity:.28!important;
 border-radius:50%!important;z-index:999!important;
 transition:opacity .2s ease!important;
}
#game[data-v12-match="false"] #gameBack::before{
 content:'Ⅱ';font-size:14px;line-height:30px;
}
#game[data-v12-match="false"] #gameBack:focus-visible,
#game[data-v12-match="false"] #gameBack:hover{opacity:1!important;}
.ticket-row button.selected{outline:2px solid #eb84ab;outline-offset:2px;}
</style>`);
