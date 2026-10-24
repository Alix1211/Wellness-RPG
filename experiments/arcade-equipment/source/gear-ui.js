(()=>{
 const G=GearModel;
 G.ensure(state);
 function icon(item,large=false){
  const color=item?.color||'#ee8cb4',kind=item?.kind||'racket',theme=item?.theme||0;
  const motifs=['♡','✦','❀','☾','ϟ','♛'];
  const shape=kind==='ball'?'<circle cx="40" cy="39" r="29" fill="'+color+'"/><path d="M20 21Q40 9 59 26" stroke="#fff9" stroke-width="5" fill="none"/>':'<rect x="34" y="51" width="12" height="28" rx="5" fill="#bc875c"/><circle cx="40" cy="31" r="27" fill="'+color+'" stroke="#fff4eb" stroke-width="4"/>';
  return'<svg class="gear-icon '+(large?'large':'')+'" viewBox="0 0 80 82" aria-hidden="true">'+shape+'<text x="40" y="'+(kind==='ball'?49:40)+'" text-anchor="middle" fill="#fff5e8" font-size="29" font-family="sans-serif">'+motifs[theme]+'</text></svg>';
 }
 function options(item){return item.options.map(o=>'<li>'+G.stats[o.key]+' <b>+'+o.value+'%</b></li>').join('')}
 function card(item,actions=true){const g=G.ensure(state),worn=g.equipped[item.kind]===item.id;return'<article class="gear-card grade-'+item.grade+'" data-gear-id="'+item.id+'">'+icon(item)+'<div class="gear-card-copy"><small>'+G.grades[item.grade].name+' · '+(item.kind==='racket'?'탁구채':'공')+(worn?' · 장착 중':'')+'</small><strong>'+G.name(item)+'</strong><ul>'+options(item)+'</ul></div>'+(actions?'<div class="gear-card-actions"><button data-action="gear-equip" data-value="'+item.id+'" '+(worn?'disabled':'')+'>'+(worn?'장착 중':'장착')+'</button><button class="secondary" data-action="gear-discard" data-value="'+item.id+'">버리기</button></div>':'')+'</article>'}
 function summary(){const p=G.payload(state);return'<div class="gear-equipped">'+['racket','ball'].map(k=>'<div>'+icon(p[k]||{kind:k})+'<span><small>'+(k==='racket'?'탁구채':'공')+'</small><b>'+(p[k]?G.name(p[k]):'기본 '+(k==='racket'?'탁구채':'공'))+'</b>'+(p[k]?'<button class="gear-clear" data-action="gear-clear" data-value="'+k+'">기본으로</button>':'')+'</span></div>').join('')+'</div><p class="gear-total">'+Object.entries(p.bonuses).filter(([,v])=>v).map(([k,v])=>G.stats[k]+' +'+v+'%').join(' · ')+'</p>'}
 const oldLobby=lobby;
 lobby=function(){oldLobby();const panel=$('.v10-roster-panel');if(panel)panel.insertAdjacentHTML('afterbegin','<div class="gear-toolbar"><span class="gear-coins">◈ '+G.ensure(state).coins+' 코인</span><button data-action="gear-shop">장비 상점</button><button data-action="gear-bag">장착 / 보관함</button></div>')};
 const oldProfile=profile;
 profile=function(){oldProfile();$('#overlay .modal').insertAdjacentHTML('beforeend','<section class="gear-profile"><h3>장착 장비</h3>'+summary()+'<button data-action="gear-bag">장비 선택</button></section>')};
 let filter='all',page=0;
 function bag(){const g=G.ensure(state),items=g.items.filter(x=>filter==='all'||x.kind===filter).slice().reverse(),pages=Math.max(1,Math.ceil(items.length/12));page=Math.max(0,Math.min(page,pages-1));modal('<div class="gear-view"><div class="gear-heading"><h2>미주의 장비</h2><button data-action="close" aria-label="닫기">×</button></div>'+summary()+'<nav class="gear-tabs">'+[['all','전체'],['racket','탁구채'],['ball','공']].map(([v,n])=>'<button data-action="gear-filter" data-value="'+v+'" aria-pressed="'+(filter===v)+'">'+n+'</button>').join('')+'</nav><div class="gear-grid">'+(items.length?items.slice(page*12,page*12+12).map(x=>card(x)).join(''):'<p class="gear-empty">아케이드에서 코인을 모으거나<br>챔피언을 이겨 장비를 획득하세요.</p>')+'</div><div class="gear-pagination"><button data-action="gear-page" data-value="-1" '+(!page?'disabled':'')+'>‹</button><span>'+ (page+1)+' / '+pages+' · '+items.length+'개</span><button data-action="gear-page" data-value="1" '+(page>=pages-1?'disabled':'')+'>›</button></div></div>');$('#overlay .modal').classList.add('gear-modal')}
 function shop(){const g=G.ensure(state);modal('<div class="gear-view"><div class="gear-heading"><h2>아케이드 장비 상점</h2><button data-action="close" aria-label="닫기">×</button></div><p class="gear-coins">◈ '+g.coins+' 코인</p><div class="gear-box-art">'+icon({kind:'racket',color:'#ee7eae',theme:0},true)+icon({kind:'ball',color:'#71d9c7',theme:1},true)+'</div><h3>장비 상자 · 80코인</h3><p>탁구채 또는 컬러 공 1개<br>일반 65% · 희귀 28% · 특급 7%</p><button data-action="gear-buy" '+(g.coins<80?'disabled':'')+'>80코인으로 열기</button><p class="gear-help">일반 경기 승리 20 · 패배 8코인<br>챔피언 승리 시 장비 1개 확정<br>장착 효과는 월드투어와 아케이드에 함께 적용됩니다.</p><button class="secondary" data-action="gear-bag">장착 / 보관함</button></div>');$('#overlay .modal').classList.add('gear-modal')}
 function found(item,title='장비 획득'){modal('<div class="gear-view"><h2>'+title+'</h2>'+card(item,false)+'<div class="actions"><button data-action="gear-equip-found" data-value="'+item.id+'">바로 장착</button><button class="secondary" data-action="gear-bag">보관함</button><button class="secondary" data-action="gear-shop">상점</button></div></div>');$('#overlay .modal').classList.add('gear-modal')}
 const oldOpen=openGame;
 openGame=function(...args){const r=oldOpen(...args);if(args[0]!=='train'&&activeGame&&window.GAIA_MATCH_DATA){const p=G.payload(state),data=window.GAIA_MATCH_DATA,q=new URLSearchParams(data.boot);q.set('gear',JSON.stringify(p));data.boot=q.toString();}return r};
 const oldHandle=handleGame;
 handleGame=function(data){
  const game=activeGame,arcade=game?.arcade&&!game.storyMode&&game.type!=='train';let reward=null;
  if(arcade){const n=game.npc,max=Math.max(...ROSTER.filter(x=>x.region===n.region).map(x=>x.index));reward=G.reward(state,{token:game.token,won:data.won===true,champion:n.index===max,region:n.region,quit:data.score==='중도 종료'});}
  const r=oldHandle(data);
  if(reward){save();const modal=$('#overlay .modal');if(modal)modal.insertAdjacentHTML('beforeend','<section class="gear-result"><p class="gear-coins">◈ +'+reward.coins+' 코인</p>'+(reward.item?'<h3>챔피언 장비</h3>'+card(reward.item,false):'')+'<div class="actions"><button data-action="gear-bag">장착 / 보관함</button><button class="secondary" data-action="gear-shop">장비 상점</button></div></section>');}
  return r;
 };
 document.addEventListener('click',e=>{
  const b=e.target.closest('[data-action^="gear-"]');if(!b||b.disabled)return;e.preventDefault();e.stopImmediatePropagation();const a=b.dataset.action,v=b.dataset.value;
  try{
   if(a==='gear-shop')shop();
   else if(a==='gear-bag'){page=0;bag()}
   else if(a==='gear-filter'){filter=v;page=0;bag()}
   else if(a==='gear-page'){page+=Number(v);bag()}
   else if(a==='gear-buy'){const item=G.buy(state);save();found(item)}
   else if(a==='gear-equip'||a==='gear-equip-found'){G.equip(state,v);save();if(a==='gear-equip-found')found(G.ensure(state).items.find(x=>x.id===v),'장착 완료');else bag();toast('장비를 장착했습니다.')}
   else if(a==='gear-clear'&&['racket','ball'].includes(v)){G.ensure(state).equipped[v]=null;save();bag()}
   else if(a==='gear-discard'){const item=G.ensure(state).items.find(x=>x.id===v);if(!item)return;modal('<div class="gear-view"><h2>이 장비를 버릴까요?</h2>'+card(item,false)+'<p>버린 장비는 돌아오지 않습니다.</p><div class="actions"><button data-action="gear-discard-confirm" data-value="'+v+'">버리기</button><button class="secondary" data-action="gear-bag">취소</button></div></div>')}
   else if(a==='gear-discard-confirm'){G.remove(state,v);save();bag();if(screen==='lobby'){/* toolbar redraws on return to lobby */}}
   const wallet=$('.gear-toolbar .gear-coins');if(wallet)wallet.textContent='◈ '+G.ensure(state).coins+' 코인';
  }catch(error){toast(error.message)}
 },true);
 window.GaiaGear={model:G,bag,shop,payload:()=>G.payload(state)};
})();
