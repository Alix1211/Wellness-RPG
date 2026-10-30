window.BeltCards=(()=>{
 const ALL=window.BELT_CARDS||[],by=id=>ALL.find(c=>c.id===id),S=()=>DetectiveApp.state,$=id=>document.getElementById(id);
 const COL={회복:'#4fae82',공격:'#d4577f',버프:'#d39a3f'},FAMS=['회복','공격','버프'];
 const tierOf=n=>n<=4?2:n<=9?3:4;
 let ui={tab:'box',fam:'전체',selected:null,slot:0,query:'',sort:'default',qty:1,notice:'',zoom:false},cur=[],bar=null;
 function box(){
  const s=S();
  if(!s.cards){s.cards={};s.loadout=[];for(const f of FAMS)ALL.filter(c=>c.fam===f&&c.price<=90).slice(0,2).forEach(c=>{s.cards[c.id]=(s.cards[c.id]||0)+1;});
   const a=ALL.find(c=>s.cards[c.id]&&c.fam==='회복'),b=ALL.find(c=>s.cards[c.id]&&c.fam==='공격');s.loadout=[a&&a.id,b&&b.id].filter(Boolean);}
  s.loadout=(s.loadout||[]).filter(id=>(s.cards[id]||0)>0);return s.cards;
 }
 function cap(){const s=S();let n=1;while(n<13&&s['stage'+n])n++;return Math.min(4,tierOf(n)+(window.BeltItems?.bonuses?.().drawPlus||0));}
 function equipped(id){return (S().loadout||[]).filter(x=>x===id).length;}
 function esc(t){return String(t??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
 function mount(){
  let el=$('cardBox');if(el)return el;el=document.createElement('div');el.id='cardBox';
  const act=document.querySelector('#missionEntry .entryActions');act.parentNode.insertBefore(el,act);return el;
 }
 function slotIndex(){return Math.max(0,Math.min(ui.slot,S().loadout.length,cap()-1));}
 function select(id){ui.selected=id;ui.qty=1;ui.zoom=false;}
 function slotsHtml(){
  const s=S(),C=cap(),target=slotIndex();let h=`<section class="cbLoadout"><div class="cbLoadoutTitle"><b>출동 카드 ${s.loadout.length}/${C}</b><small>슬롯 선택 후 교체</small></div><div class="cbSlots">`;
  for(let i=0;i<C;i++){const c=by(s.loadout[i]);h+=`<div class="cbLoadoutItem ${i===target?'target':''}"><button class="cbSlot ${c?'':'empty'}" data-slot="${i}" aria-pressed="${i===target}" aria-label="${i+1}번 슬롯${c?' · '+esc(c.name):' · 비어 있음'}" style="--family:${c?COL[c.fam]:'#d9bdc9'}"><span class="cbSlotNumber">${i+1}</span>${c?.img?`<img src="${esc(c.img)}" alt="">`:''}<span>${c?esc(c.name):'비어 있음'}</span></button>${c?`<button class="cbRemove" data-un="${i}" aria-label="${i+1}번 카드 장착 해제">×</button>`:''}</div>`;}
  return h+'</div></section>';
 }
 function detailHtml(c){
  if(!c)return '<div class="cbDetail cbEmptyDetail">카드를 선택하면<br>그림과 효과를 크게 볼 수 있습니다.</div>';
  const s=S(),n=s.cards[c.id]||0,eq=equipped(c.id),target=slotIndex(),same=s.loadout[target]===c.id,swap=!!s.loadout[target],price=c.price;
  ui.qty=Math.max(1,Math.min(ui.qty,99,Math.max(1,Math.floor(s.gold/price))));
  const canEquip=!same&&n>eq,canBuy=s.gold>=price*ui.qty;
  const action=same?'장착 중':swap?`${target+1}번 교체`:`${target+1}번 장착`;
  const buyEquip=!same&&!canEquip&&ui.tab==='shop';
  return `<section class="cbDetail" style="--family:${COL[c.fam]}"><div class="cbDetailMain"><button class="cbPreview" data-zoom="1" aria-label="${esc(c.name)} 이미지 크게 보기">${c.img?`<img src="${esc(c.img)}" alt="${esc(c.name)}">`:'<span>✦</span>'}<small>크게 보기 ⤢</small></button><div class="cbDetailText"><span class="cbFamily">${esc(c.grade)} · ${c.fam}</span><h2>${esc(c.name)}</h2><p>${esc(c.fx)}</p><div class="cbOwned">보유 <b>${n}</b>장 · 장착 <b>${eq}</b>장</div></div></div><div class="cbDetailActions ${ui.tab==='shop'?'withPurchase':''}">${ui.tab==='shop'?`<div class="cbPurchase"><div class="cbQuantity"><button data-qty="-1" ${ui.qty<=1?'disabled':''} aria-label="구매 수량 줄이기">−</button><output aria-label="구매 수량">${ui.qty}장</output><button data-qty="1" ${ui.qty>=99||s.gold<(ui.qty+1)*price?'disabled':''} aria-label="구매 수량 늘리기">+</button></div><button class="cbBuy" data-buy="${c.id}" ${canBuy?'':'disabled'}>구매 · ${price*ui.qty} G</button></div>`:''}<button class="cbEquip" ${buyEquip?`data-buy-eq="${c.id}" ${s.gold>=price?'':'disabled'}`:`data-eq="${c.id}" ${canEquip?'':'disabled'}`}>${buyEquip?`1장 구매 후 ${action} · ${price} G`:action}</button><small class="cbActionHint">${same?'다른 슬롯을 선택하면 추가 장착할 수 있습니다.':buyEquip&&s.gold<price?'자금이 부족합니다.':!canEquip&&!buyEquip?'남은 카드가 없습니다. 상점에서 구매할 수 있습니다.':swap?'선택 슬롯의 기존 카드는 보관함으로 돌아갑니다.':'장착한 카드는 전투에서 사용하면 1장 소모됩니다.'}</small></div></section>`;
 }
 function render(){
  const el=mount(),s=S(),cards=box(),C=cap(),oldGrid=el.querySelector('.cbGrid'),scroll=oldGrid?.scrollTop||0,oldDetail=el.querySelector('.cbDetailMain'),detailScroll=oldDetail?.scrollTop||0;
  const focus=document.activeElement?.matches?.('[data-search]'),caret=focus?document.activeElement.selectionStart:null;
  while(s.loadout.length>C)s.loadout.pop();
  let h=`<div class="cbHeader"><div><strong>경찰서</strong><span>카드 관리 · 단련</span></div><b class="cbGold">${s.gold.toLocaleString()} G</b></div><div class="cbTabs" role="group" aria-label="경찰서 메뉴">`;
  for(const [tab,label]of [['box','보관함'],['shop','상점'],['train','단련']])h+=`<button data-tab="${tab}" class="${ui.tab===tab?'on':''}" aria-pressed="${ui.tab===tab}">${label}</button>`;
  if(ui.tab!=='train'){h+='<div class="cbFilters" role="group" aria-label="카드 종류">';for(const f of ['전체',...FAMS])h+=`<button data-fam="${f}" class="${ui.fam===f?'on':''}" aria-pressed="${ui.fam===f}">${f}</button>`;h+='</div>';}
  h+='</div>';
  if(ui.tab==='train'){el.innerHTML=h+trainHtml();return;}
  const query=ui.query.trim().toLocaleLowerCase();let list=ALL.filter(c=>(ui.fam==='전체'||c.fam===ui.fam)&&(ui.tab==='shop'||cards[c.id]>0)&&(!query||(c.name+' '+c.fx+' '+c.grade).toLocaleLowerCase().includes(query)));
  if(ui.sort==='price')list.sort((a,b)=>a.price-b.price);else if(ui.sort==='owned')list.sort((a,b)=>(cards[b.id]||0)-(cards[a.id]||0));
  if(!list.some(c=>c.id===ui.selected))select(list[0]?.id||null);
  h+=`<div class="cbWorkspace"><section class="cbBrowse" aria-label="카드 목록"><div class="cbTools"><input type="search" data-search placeholder="카드 이름·효과 검색" value="${esc(ui.query)}" aria-label="카드 이름 또는 효과 검색"><select data-sort aria-label="카드 정렬">${[['default','기본 순'],['price','가격 낮은순'],['owned','보유 많은순']].map(([v,t])=>`<option value="${v}" ${ui.sort===v?'selected':''}>${t}</option>`).join('')}</select><small>${list.length}종</small></div><div class="cbGrid">`;
  if(!list.length)h+=`<div class="cbNone">${query?'검색 결과가 없습니다.':ui.tab==='box'?'보유 카드가 없습니다. 상점에서 구매해 주세요.':'해당 카드가 없습니다.'}</div>`;
  for(const c of list){const n=cards[c.id]||0,eq=equipped(c.id);h+=`<button class="cbTile ${c.id===ui.selected?'selected':''}" data-select="${c.id}" aria-pressed="${c.id===ui.selected}" style="--family:${COL[c.fam]}"><div class="cbTileArt">${c.img?`<img loading="lazy" src="${esc(c.img)}" alt="">`:'<span>✦</span>'}<span class="cbTileFamily">${c.fam}</span>${eq?`<span class="cbEquipped">장착 ${eq}</span>`:''}</div><b>${esc(c.name)}</b><div class="cbTileMeta"><span>보유 ${n}장</span><strong>${ui.tab==='shop'?c.price+' G':esc(c.grade)}</strong></div></button>`;}
  h+=`</div></section><aside class="cbAside">${slotsHtml()}${detailHtml(by(ui.selected))}</aside></div><div class="cbNotice" role="status" aria-live="polite">${esc(ui.notice)}</div>`;
  if(ui.zoom){const c=by(ui.selected);if(c)h+=`<div class="cbZoom" role="dialog" aria-modal="true" aria-label="카드 크게 보기"><button class="cbZoomBackdrop" data-zoom-close="1" aria-label="확대 보기 닫기"></button><section><button class="cbZoomClose" data-zoom-close="1" aria-label="확대 보기 닫기">닫기 ×</button>${c.img?`<img src="${esc(c.img)}" alt="${esc(c.name)}">`:''}<b>${esc(c.name)}</b><p>${esc(c.fx)}</p></section></div>`;}
  el.innerHTML=h;
  const grid=el.querySelector('.cbGrid');if(grid)grid.scrollTop=scroll;
  const detail=el.querySelector('.cbDetailMain');if(detail)detail.scrollTop=detailScroll;
  if(focus){const input=el.querySelector('[data-search]');input?.focus({preventScroll:true});if(caret!==null)try{input.setSelectionRange(caret,caret);}catch{}}
 }
 function equip(id,purchase=false){
  const s=S(),c=by(id),target=slotIndex();if(!c||s.loadout[target]===id)return false;
  if(purchase){if(s.gold<c.price)return false;s.gold-=c.price;s.cards[id]=(s.cards[id]||0)+1;}
  else if((s.cards[id]||0)<=equipped(id))return false;
  if(target<s.loadout.length)s.loadout[target]=id;else s.loadout.push(id);
  ui.notice=`${target+1}번 슬롯에 장착했습니다.${purchase?' ('+c.price+' G 구매)':''}`;
  if(s.loadout.length<cap())ui.slot=s.loadout.length;return true;
 }
 function openBox(){box();ui.tab='box';ui.notice='';ui.zoom=false;render();mount().classList.remove('hidden');$('missionEntry').classList.add('card-mode');
  const el=mount();el.onclick=ev=>{const b=ev.target.closest('button');if(!b||b.disabled)return;const s=S();ui.notice='';
   if(b.dataset.tab){ui.tab=b.dataset.tab;ui.zoom=false;}
   else if(b.dataset.fam){ui.fam=b.dataset.fam;}
   else if(b.dataset.select){select(b.dataset.select);}
   else if(b.dataset.slot!==undefined){ui.slot=Math.min(+b.dataset.slot,s.loadout.length);const id=s.loadout[ui.slot];if(id){ui.fam='전체';ui.query='';select(id);}}
   else if(b.dataset.un!==undefined){const i=+b.dataset.un;if(i<s.loadout.length){s.loadout.splice(i,1);ui.slot=s.loadout.length;ui.notice='장착을 해제했습니다.';}}
   else if(b.dataset.eq){equip(b.dataset.eq);}
   else if(b.dataset.buyEq){equip(b.dataset.buyEq,true);DetectiveApp.sync();}
   else if(b.dataset.play){playTrain(b.dataset.play);return;}
   else if(b.dataset.qty){ui.qty=Math.max(1,Math.min(99,ui.qty+Number(b.dataset.qty)));}
   else if(b.dataset.zoom){ui.zoom=true;}
   else if(b.dataset.zoomClose){ui.zoom=false;}
   else if(b.dataset.buy){const c=by(b.dataset.buy),q=ui.qty;if(c&&s.gold>=c.price*q){s.gold-=c.price*q;s.cards[c.id]=(s.cards[c.id]||0)+q;ui.notice=`${q}장을 구매했습니다. (${c.price*q} G)`;DetectiveApp.sync();}}
   DetectiveApp.save();render();if(ui.zoom)el.querySelector('.cbZoomClose')?.focus({preventScroll:true});};
  el.oninput=ev=>{if(!ev.isComposing&&ev.target.matches('[data-search]')){ui.query=ev.target.value;ui.notice='';render();}};
  el.oncompositionend=ev=>{if(ev.target.matches('[data-search]')){ui.query=ev.target.value;ui.notice='';render();}};
  el.onchange=ev=>{if(ev.target.matches('[data-sort]')){ui.sort=ev.target.value;render();}};
 }
 function closeBox(){const el=$('cardBox');if(el){el.classList.add('hidden');el.onclick=null;el.oninput=null;el.onchange=null;el.oncompositionend=null;}ui.zoom=false;$('missionEntry')?.classList.remove('card-mode');}
 document.addEventListener('keydown',ev=>{if(ev.key==='Escape'&&ui.zoom){ui.zoom=false;render();mount().querySelector('[data-zoom]')?.focus();}});
 // ---- 단련 ----
 const STATS={색기:'이동속도 · 회피',음란도:'공격력',복종도:'방어력 · 도파민 충전',개방성:'스킬 위력 · M 회복'};
 const fxOf=(k,L)=>({색기:`이동 +${(1.5*L).toFixed(0)}% · 회피 ${Math.min(30,L)}%`,음란도:`공격력 +${3*L}%`,복종도:`받는 피해 -${Math.round((1-1/(1+.025*L))*100)}% · 도파민 +${4*L}%`,개방성:`스킬 위력 +${4*L}% · M 회복 +${3*L}%`})[k];
 function trainHtml(){
  const s=S();let h=`<div class="cbTrain"><p>단련권 <b>${s.tickets}</b>장 · 스테이지 승리 +2, 패배 +1 (최대 9)</p><div class="cbList">`;
  for(const k of Object.keys(STATS)){const L=Math.min(30,s.stats[k]||0);h+=`<div class="cbStat"><b>${k}</b><span class="bar"><i style="width:${L/30*100}%"></i></span><em>${L}/30</em><small>${fxOf(k,L)}</small></div>`;}
  return h+`</div><div class="cbTrainBtns"><button data-play="squat" ${s.tickets<=0?'disabled':''}>스쿼트 (색기·개방성)</button><button data-play="batting" ${s.tickets<=0?'disabled':''}>맷집 배팅 (복종도·음란도)</button></div></div>`;
 }
 const GAIN={squat:{great:{색기:2,개방성:1},ok:{색기:1}},batting:{great:{복종도:2,음란도:1},ok:{복종도:1,음란도:1}}};
 function playTrain(id){
  const s=S();if(s.tickets<=0||!window.GAIA||!GAIA.minigame)return;
  const cleared=Object.keys(s).filter(k=>/^stage\d+$/.test(k)&&s[k]).length,wl=Math.floor(cleared/3);
  AlleyAudio.bgm(null);
  GAIA.minigame.play(id,{wl,canRetry:()=>S().tickets>0,
   onResult:r=>{const tier=r.ratio>=.8?'great':r.success?'ok':'fail',g=(GAIA_GAIN[id]||{})[tier]||{};S().tickets=Math.max(0,S().tickets-1);for(const k of Object.keys(g))S().stats[k]=Math.min(30,(S().stats[k]||0)+g[k]);DetectiveApp.save();},
   onClose:()=>{AlleyAudio.bgm('map');render();}});
 }
 const GAIA_GAIN=GAIN;
 // ---- 전투 ----
 function begin(stage){
  const s=S(),cards=box(),want=Math.min(4,tierOf(stage)+(window.BeltItems?.bonuses?.().drawPlus||0)),ids=s.loadout.slice(0,want),left={...cards};ids.forEach(id=>{left[id]=(left[id]||0)-1;});
  while(ids.length<want){const have=new Set(ids.map(id=>by(id).fam)),pool=ALL.filter(c=>left[c.id]>0);if(!pool.length)break;
   const c=pool.find(c=>!have.has(c.fam))||pool[0];ids.push(c.id);left[c.id]--;}
  s.loadout=ids;DetectiveApp.save();cur=ids.map(id=>({id,used:false}));buildBar();
 }
 function buildBar(){
  if(!bar){bar=document.createElement('div');bar.id='cardBar';$('game-shell').appendChild(bar);bar.addEventListener('pointerdown',down);}
  bar.innerHTML=cur.map((k,i)=>{const c=by(k.id);return `<div class="cb ${k.used?'used':''}" data-i="${i}" style="--c:${COL[c.fam]};--r:${((i-(cur.length-1)/2)*5).toFixed(1)}deg;${c.img?`background-image:url(${c.img})`:''}"><b>${esc(c.name)}</b><small>${esc(c.fx)}</small></div>`;}).join('');
  bar.classList.toggle('hidden',!cur.length);
 }
 let drag=null;
 function down(ev){
  const el=ev.target.closest('.cb');if(!el||el.classList.contains('used'))return;
  drag={el,i:+el.dataset.i,y0:ev.clientY,id:ev.pointerId};try{bar.setPointerCapture(ev.pointerId);}catch(e){}
  el.classList.add('drag');window.addEventListener('pointermove',move);window.addEventListener('pointerup',up);window.addEventListener('pointercancel',up);
 }
 function move(ev){if(!drag)return;const dy=Math.min(0,ev.clientY-drag.y0);drag.el.style.transform=`translateY(${dy}px) scale(${1+Math.min(.3,-dy/300)})`;drag.dy=dy;}
 function up(ev){
  window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',up);window.removeEventListener('pointercancel',up);
  if(!drag)return;const d=drag;drag=null;d.el.classList.remove('drag');d.el.style.transform='';
  if((ev.clientY-d.y0)<-70)use(d.i);
 }
 function use(i){
  const k=cur[i];if(!k||k.used||!window.AlleyGame.canUseCard())return;
  const c=by(k.id),s=S();k.used=true;s.cards[k.id]=Math.max(0,(s.cards[k.id]||0)-1);
  const at=s.loadout.indexOf(k.id);if(at>=0)s.loadout.splice(at,1);DetectiveApp.save();
  const fx=document.createElement('div');fx.className='cardFx';fx.style.setProperty('--c',COL[c.fam]);fx.innerHTML=(c.img?`<img src="${c.img}" alt="">`:`<div class="noimg"></div>`)+`<b>${esc(c.name)}</b><small>${esc(c.fx)}</small>`;$('game-shell').appendChild(fx);AlleyGame.hold(1.5);
  setTimeout(()=>fx.remove(),1500);setTimeout(()=>AlleyGame.useCard(c),1150);buildBar();
 }
 document.addEventListener('keydown',ev=>{if(!document.body.classList.contains('inbattle'))return;const n=+ev.key;if(n>=1&&n<=4&&cur[n-1])use(n-1);});
 function reward(stage){
  const t=tierOf(stage),w={기본:t===2?5:2,일반:6,특별:t+1,희귀:t-1,소모품:5},pool=[];
  for(const c of ALL)for(let k=0;k<(w[c.grade]||1);k++)pool.push(c);
  const c=pool[Math.floor(Math.random()*pool.length)],s=S();box();s.cards[c.id]=(s.cards[c.id]||0)+1;return c.name;
 }
 return {openBox,closeBox,begin,reward,render,all:ALL};
})();

