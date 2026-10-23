// GAIA UI v6. Runs after training-addon.js, without altering the game or save model.
// The existing generic sports-drama lines are intentionally left unused until
// the designer approves actual GAIA dialogue. Never substitute new filler text.
const gaiaOldGoto=goto;
goto=function(next){
 if(next==='dialogue'){
  if(!state.introSeen.includes(state.region)){
   state.introSeen.push(state.region);
   save();
  }
  return gaiaOldGoto('board');
 }
 return gaiaOldGoto(next);
};

const gaiaOldLobby=lobby;
lobby=function(){
 gaiaOldLobby();
 document.querySelectorAll('.tabs [data-action="tab"]').forEach(tabButton=>{
  const index=Number(tabButton.dataset.value);
  const emblem=document.createElement('span');
  emblem.className='gaia-tab-medal';
  emblem.dataset.region=String(index);
  emblem.setAttribute('aria-hidden','true');
  tabButton.prepend(emblem);
 });
 document.querySelectorAll('.opponent.locked strong').forEach(name=>{
  name.textContent=name.textContent.replace(' · LOCK','');
 });
};

const gaiaOldTour=tour;
tour=function(){
 // The training add-on owns mini-game names. Only decorate the OTHER nodes.
 gaiaOldTour.recenter=tour.recenter;
 gaiaOldTour();
 tour.recenter=gaiaOldTour.recenter;
 Object.values(board(state.region)).forEach(node=>{
  const target=document.querySelector('.node[data-value="'+node.id+'"]');
  if(!target||target.classList.contains('training-node'))return;
  target.classList.add('gaia-map-node','gaia-map-'+node.kind);
  let col=1,row=0;
  if(node.kind==='match'){col=2;row=0;}
  if(node.kind==='cup'||node.kind==='final'){col=state.region;row=1;}
  if(node.kind==='shop'){col=2;row=2;}
  if(node.kind==='rest'){col=1;row=3;}
  if(node.kind==='event'){col=1;row=2;}
  if(node.kind==='blank'){col=0;row=0;}
  target.innerHTML='<span class="gaia-node-medal" style="background-position:'+(col*50)+'% '+(row*100/3)+'%" aria-hidden="true"></span>';
  target.title=KINDS[node.kind].name;
 });
};

opponent=function(id){
 const npc=NPC_BY_ID[id];
 if(!npc||!state.wins.includes(id)){
  // No lengthy page explaining the player's own unlock rule.
  toast('🔒');
  return;
 }
 const record=state.arcadeRecords[id]||{wins:0,losses:0};
 modal('<span class="eyebrow">ARCADE · '+REGIONS[npc.region].name+'</span>'+
  '<h2>'+npc.name+'</h2>'+image(npc.image,'feature')+
  '<div class="gaia-arcade-record"><span>🏆 '+record.wins+'</span><span>♡ '+record.losses+'</span></div>'+
  '<div class="actions"><button class="primary" data-action="play-arcade" data-value="'+id+'">경기 시작</button>'+
  button('닫기','close','secondary')+'</div>');
};

const gaiaOldShowPending=showPending;
showPending=function(){
 const p=state.pending;
 if(!p)return;
 if(p.kind==='train'||['blank','fork','start'].includes(p.kind))return gaiaOldShowPending();
 if(p.kind==='season'){
  modal('<h2>투어 종료</h2><div class="actions">'+
   button('새 투어','restart')+button('타이틀','home','secondary')+'</div>');
  return;
 }
 if(p.kind==='shop')return shop();
 if(['match','cup','final'].includes(p.kind)){
  const cup=p.kind!=='match';
  const npc=NPC_BY_ID[p.opponents[p.round]];
  const portraits=cup?'<div class="round-portraits">'+p.opponents.map((id,i)=>
    '<figure class="'+(i===p.round?'active':'')+'">'+image(NPC_BY_ID[id].image)+
    '<figcaption>'+(i+1)+'R · '+NPC_BY_ID[id].name+'</figcaption></figure>').join('')+'</div>':image(npc.image,'feature');
  modal('<h2>'+npc.name+'</h2>'+portraits+
   '<div class="actions">'+button('경기 시작','play-story')+button('닫기','close','secondary')+'</div>');
  return;
 }
 const label=p.kind==='rest'?'휴식':p.kind==='event'?'이벤트':KINDS[p.kind].name;
 modal('<h2>'+label+'</h2><div class="actions">'+button('확인','resolve')+
  button('닫기','close','secondary')+'</div>');
};

shop=function(){
 modal('<span class="eyebrow">SHOP · '+state.money+' G</span><h2>상점</h2>'+
  '<div class="shop-items"><button data-action="buy" data-value="heal">♥ +35 <small>35 G</small></button>'+
  [1,2,3,4].map(n=>'<button data-action="buy" data-value="'+n+'">🎟 '+n+' <small>45 G</small></button>').join('')+
  '</div><div class="actions">'+button('닫기','resolve')+'</div>');
};

const gaiaOldFinish=finish;
finish=function(input){
 gaiaOldFinish(input);
 // Leave scores and actual earned values visible. Remove flavorless narration.
 if(!$('#overlay').hidden){
  document.querySelectorAll('#overlay .modal>p:not(.notice)').forEach(p=>{
   if(!/^\+\d+ G$/.test(p.textContent.trim()))p.remove();
  });
 }
};

const gaiaOldMenu=menu;
menu=function(){gaiaOldMenu();$('#overlay .saved-note')?.remove();};
const gaiaOldProfile=profile;
profile=function(){gaiaOldProfile();$('#overlay .notice')?.remove();};
