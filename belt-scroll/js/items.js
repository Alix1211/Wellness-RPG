/* GAIA CITY: DETECTIVE — original 64-item catalog adapted for the brawler.
   Independent of the police card inventory; no save migration or world-level writes. */
window.BeltItems=(()=>{
 'use strict';
 const DB=()=>window.GAIA.items,S=()=>DetectiveApp.state,$=id=>document.getElementById(id);
 const TYPES=['전체','유물','소모품','잡템'],KIND={relic:'유물',cons:'소모품',junk:'잡템'};
 const NAMES={startBlock:'방어막',startTight:'시작 M',startLube:'이동속도',startDopa:'시작 도파민',healAfter:'승리 회복',goldPlus:'골드 증가',strPlus:'공격 증가',drawPlus:'추가 카드',energyPlus:'최대 M',heal:'체력 회복',lube:'다음 전투 가속',tight:'다음 전투 M',dopa:'다음 전투 도파민',block:'다음 전투 방어막',energy:'다음 전투 M',vulnAll:'다음 전투 첫 적 약화'};
 let tab='bag',filter='전체',selected=null,slot=0,note='';
 const esc=t=>String(t??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','&quot;':'&quot;',"'":'&#39;'}[c]));
 const max=()=>DB().slots,level=()=>Math.max(1,GAIA.run?.get?.().wl||0);
 function ensure(){
  const s=S();if(!Array.isArray(s.itemBag))s.itemBag=[];
  if(!Array.isArray(s.itemEquip))s.itemEquip=[];
  if(!Number.isFinite(s.itemUidSeq))s.itemUidSeq=0;
  if(!s.itemPrepared||typeof s.itemPrepared!=='object')s.itemPrepared={};
  const used=new Set();
  s.itemEquip=[0,1,2].map(i=>{const uid=s.itemEquip[i];if(!uid||used.has(uid)||!s.itemBag.some(x=>x.uid===uid&&DB().byId[x.id]?.type==='relic'))return null;used.add(uid);return uid;});
  return s;
 }
 function formatFx(fx){
  return Object.entries(fx).map(([k,v])=>{
   if(k==='startTight')return '전투 시작 M +'+(v*2);
   if(k==='startLube')return '이동속도 +'+Math.round(v/2.5)+'%';
   if(k==='startBlock'||k==='block')return NAMES[k]+' +'+v;
   if(k==='goldPlus')return '획득 골드 +'+v+'%';
   if(k==='strPlus')return '공격력 +'+(v*8)+'%';
   if(k==='energyPlus')return '최대 M +'+(v*15);
   if(k==='drawPlus')return '출동 카드 +'+v+'장 (최대 4장)';
   if(k==='lube')return '다음 전투 가속 '+Math.max(1,Math.round(v/10))+'초';
   if(k==='tight')return '다음 전투 시작 M +'+(v*2);
   if(k==='vulnAll')return '다음 전투 첫 적 피해 +20%';
   return (NAMES[k]||k)+' +'+v;
  }).join(' · ');
 }
 function effectText(item){
  const d=DB().byId[item.id];if(!d)return '';
  if(d.type==='junk')return '효과 없음 · 마트 판매용';
  return formatFx(item.fx||d.fx);
 }
 function itemAt(uid){return ensure().itemBag.find(i=>i.uid===uid);}
 function bonuses(){
  const s=ensure(),fx={};
  for(const uid of s.itemEquip){const it=s.itemBag.find(i=>i.uid===uid);if(!it)continue;
   for(const [k,v] of Object.entries(it.fx||DB().byId[it.id]?.fx||{}))fx[k]=(fx[k]||0)+Number(v||0);
  }
  return fx;
 }
 function roll(id,origin='drop'){
  const d=DB().byId[id];if(!d)return null;
  const n=level(),r={id,level:n,fx:{...d.fx},origin};
  if(d.type==='relic'){
   const multiplier=1+Math.max(0,n-1)*.09+Math.random()*.12;
   for(const [k,v] of Object.entries(r.fx))r.fx[k]=Math.max(1,Math.round(v*multiplier));
   // Repeated world laps yield distinct bonuses, even for the same relic.
   if(n>=2&&Math.random()<Math.min(.7,.16+.1*n)){
    const list=['healAfter','goldPlus','strPlus'],extra=list[Math.floor(Math.random()*list.length)];
    if(!(extra in r.fx))r.fx[extra]=extra==='goldPlus'?Math.max(2,3*n):extra==='strPlus'?Math.max(1,Math.floor(n/3)):Math.max(1,n);
   }
  }
  return r;
 }
 function add(item){
  const s=ensure();if(s.itemBag.length>=max())return null;
  const next={...item,uid:'gi'+(++s.itemUidSeq)};s.itemBag.push(next);DetectiveApp.save();return next;
 }
 function dropEnemy(boss=false){
  const s=ensure();if(s.itemBag.length>=max())return {full:true};
  if(!boss&&Math.random()>.24)return null;
  const t=boss?'relic':Math.random()<.12?'relic':Math.random()<.42?'cons':'junk';
  const choices=DB().list.filter(d=>d.type===t&&(t!=='relic'||d.tier<=Math.min(3,1+Math.floor(level()/2))));
  const d=choices[Math.floor(Math.random()*choices.length)];if(!d)return null;
  const item=add(roll(d.id));return item?{item,name:d.name}:null;
 }
 function stock(){
  const s=ensure(),cycle=level();
  if(s.itemMart?.cycle===cycle&&Array.isArray(s.itemMart.goods))return s.itemMart.goods;
  const all=DB().list;
  function pick(type,num,exclude=[]){const pool=all.filter(d=>d.type===type&&!exclude.includes(d.id)&&(type!=='relic'||d.tier<=Math.min(3,1+Math.floor(cycle/2))));
   pool.sort(()=>Math.random()-.5);return pool.slice(0,num).map(d=>roll(d.id,'mart'));
  }
  const pinned=['b00','b15'].map(id=>roll(id,'mart'));
  const goods=[...pinned,...pick('relic',6,pinned.map(i=>i.id)),...pick('cons',6),...pick('junk',6)];
  s.itemMart={cycle,goods};DetectiveApp.save();return goods;
 }
 function buy(index){
  const s=ensure(),x=stock()[index],d=DB().byId[x?.id];
  if(!d)return '상품이 없습니다.';
  if(s.gold<d.price)return '골드가 부족합니다.';
  if(s.itemBag.length>=max())return '가방이 가득 찼습니다. 먼저 물건을 판매하세요.';
  const it=add(x);if(!it)return '가방이 가득 찼습니다.';
  s.gold-=d.price;DetectiveApp.save();DetectiveApp.sync();selected=it.uid;return d.name+' 구매 완료 · '+d.price+' G';
 }
 function sell(uid){
  const s=ensure(),it=itemAt(uid),d=DB().byId[it?.id];if(!d)return '선택한 물건이 없습니다.';
  if(s.itemEquip.includes(uid))return '장착 해제한 뒤 판매할 수 있습니다.';
  s.itemBag=s.itemBag.filter(i=>i.uid!==uid);s.gold+=DB().sell(d);selected=null;
  DetectiveApp.save();DetectiveApp.sync();return d.name+' 판매 · +'+DB().sell(d)+' G';
 }
 function equip(uid){
  const s=ensure(),it=itemAt(uid);if(!it||DB().byId[it.id]?.type!=='relic')return '유물만 장착할 수 있습니다.';
  if(s.itemEquip.includes(uid))return '이미 장착 중입니다.';
  s.itemEquip[slot]=uid;
  const empty=s.itemEquip.findIndex(x=>!x);if(empty>=0)slot=empty;
  DetectiveApp.save();return DB().byId[it.id].name+' 장착 완료';
 }
 function unequip(index){
  const s=ensure();if(index<0||index>=3||!s.itemEquip[index])return '';
  s.itemEquip[index]=null;slot=index;DetectiveApp.save();return '유물 장착을 해제했습니다.';
 }
 function use(uid){
  const s=ensure(),it=itemAt(uid),d=DB().byId[it?.id];if(!d||d.type!=='cons')return '소모품을 선택하세요.';
  const fx=it.fx||d.fx;
  if(fx.heal){const before=s.hp;s.hp=Math.min(160,(s.hp||0)+fx.heal);if(s.hp===before)return '체력이 이미 가득 찼습니다.';}
  else for(const [k,v] of Object.entries(fx))s.itemPrepared[k]=(s.itemPrepared[k]||0)+v;
  s.itemBag=s.itemBag.filter(x=>x.uid!==uid);selected=null;DetectiveApp.save();DetectiveApp.sync();
  return d.name+(fx.heal?' 사용 완료':' 사용 · 다음 출동에 적용');
 }
 function stageStart(){
  const s=ensure(),b=bonuses(),p={...s.itemPrepared};
  s.itemPrepared={};DetectiveApp.save();
  return {shield:(b.startBlock||0)+(p.block||0),startMp:2*((b.startTight||0)+(p.tight||0))+15*(p.energy||0),
   speedSec:Math.max(0,(p.lube||0)/10),dopa:(b.startDopa||0)+(p.dopa||0),
   vulnAll:p.vulnAll||0,maxMp:100+15*(b.energyPlus||0)};
 }
 function markupItem(item,index,shop=false){
  const d=DB().byId[item.id],eq=ensure().itemEquip.includes(item.uid),active=(shop?selected==='shop'+index:selected===item.uid);
  return `<button class="biTile ${active?'active':''}" data-item="${shop?'shop'+index:esc(item.uid)}" aria-pressed="${active}">
   <img loading="lazy" src="assets/items/${d.id}.webp" alt=""><span><b>${esc(d.name)}</b><small>${KIND[d.type]} ${d.type==='relic'?'· Lv.'+item.level:''}</small>
   <em>${shop?d.price+' G':eq?'장착 중':d.type==='junk'?'판매 '+DB().sell(d)+' G':'보유 중'}</em></span></button>`;
 }
 function render(){
  const el=$('itemPanel');if(!el||el.classList.contains('hidden'))return;
  const s=ensure(),b=bonuses(),items=tab==='mart'?stock():s.itemBag;
  const list=items.map((x,i)=>({...x,_i:i})).filter(x=>filter==='전체'||KIND[DB().byId[x.id]?.type]===filter);
  if(!list.some(x=>(tab==='mart'?'shop'+x._i:x.uid)===selected))selected= list.length?(tab==='mart'?'shop'+list[0]._i:list[0].uid):null;
  const chosen=tab==='mart'?items[Number(String(selected).replace('shop',''))]:s.itemBag.find(i=>i.uid===selected);
  const d=chosen&&DB().byId[chosen.id],isEquipped=chosen&&s.itemEquip.includes(chosen.uid);
  let h=`<section class="biWindow" role="dialog" aria-modal="true" aria-label="가이아 시티 아이템"><header class="biHeader"><div><strong>로지의 소지품</strong><small>유물 · 마트 · 성장</small></div><b>${s.gold.toLocaleString()} G</b><button data-close="1" aria-label="닫기">×</button></header>
    <nav class="biTabs">${[['mart','마트'],['bag','가방 · 장비'],['status','상태']].map(([k,t])=>`<button data-tab="${k}" class="${tab===k?'active':''}">${t}</button>`).join('')}</nav>`;
  if(tab==='status'){
   const stats=s.stats||{},wl=GAIA.run?.get?.().wl||0,cleared=Object.keys(s).filter(k=>/^stage\d+$/.test(k)&&s[k]).length;
   h+=`<section class="biStatus"><h3>로지 로프 · 현황</h3><div class="biNumbers"><span>골드 <b>${s.gold.toLocaleString()} G</b></span><span>체력 <b>${Math.ceil(s.hp)} / 160</b></span><span>M <b>${Math.ceil(s.mp??100)} / 100</b></span><span>단련권 <b>${s.tickets||0}장</b></span><span>현재 월드 레벨 <b>${wl}</b></span><span>완료 스테이지 <b>${cleared}</b></span></div><h4>단련</h4><div class="biNumbers">${['색기','음란도','복종도','개방성'].map(k=>`<span>${k} <b>${stats[k]||0}/30</b></span>`).join('')}</div><h4>장착 유물 효과</h4><p>${Object.keys(b).length?esc(formatFx(b)):'장착된 유물이 없습니다.'}</p><h4>출동 준비 효과</h4><p>${Object.entries(s.itemPrepared||{}).map(([k,v])=>esc((NAMES[k]||k)+' +'+v)).join(' · ')||'없음'}</p></section>`;
  }else{
   h+=`<div class="biBody"><section class="biShelf"><div class="biToolbar"><div>${TYPES.map(k=>`<button data-filter="${k}" class="${filter===k?'active':''}">${k}</button>`).join('')}</div><small>${tab==='mart'?'월드 단계별 상품 구성':s.itemBag.length+'/'+max()+'칸'}</small></div><div class="biGrid">${list.map(it=>markupItem(it,it._i,tab==='mart')).join('')||'<p class="biEmpty">물건이 없습니다.</p>'}</div></section>
   <aside class="biAside"><div class="biEquip"><h3>유물 장비 <small>${s.itemEquip.filter(Boolean).length}/3</small></h3><div class="biEquipGrid">${[0,1,2].map(i=>{const it=itemAt(s.itemEquip[i]);return `<div class="biEquipUnit"><button data-slot="${i}" class="${slot===i?'active':''}">${it?`<img src="assets/items/${it.id}.webp" alt=""><b>${esc(DB().byId[it.id].name)}</b>`:`<b>+ 빈 슬롯 ${i+1}</b>`}</button>${it?`<button class="biUn" data-un="${i}" aria-label="${i+1}번 유물 장착 해제">×</button>`:''}</div>`;}).join('')}</div><small>슬롯을 선택하면 해당 칸에 유물을 장착합니다.</small></div>
   <section class="biDetail">${d?`<img src="assets/items/${d.id}.webp" alt="${esc(d.name)}"><div><small>${KIND[d.type]} ${d.type==='relic'?'· 월드 Lv.'+chosen.level:''}</small><h3>${esc(d.name)}</h3><p>${esc(effectText(chosen))}</p></div><div class="biActions">${tab==='mart'?`<button data-buy="${Number(String(selected).replace('shop',''))}" ${s.gold<d.price||s.itemBag.length>=max()?'disabled':''}>구매 · ${d.price} G</button>`:d.type==='relic'?`<button data-equip="${esc(chosen.uid)}" ${isEquipped?'disabled':''}>유물 장착</button><button data-sell="${esc(chosen.uid)}" ${isEquipped?'disabled':''}>판매 · ${DB().sell(d)} G</button>`:d.type==='cons'?`<button data-use="${esc(chosen.uid)}">사용</button><button data-sell="${esc(chosen.uid)}">판매 · ${DB().sell(d)} G</button>`:`<button data-sell="${esc(chosen.uid)}">판매 · ${DB().sell(d)} G</button>`}</div>`:'<p>물건을 선택해 주세요.</p>'}</section></aside></div>`;
  }
  h+=`<footer class="biFooter"><span role="status">${esc(note)}</span><button data-close="1">닫기</button></footer></section>`;el.innerHTML=h;
 }
 function open(next='bag'){
  ensure();tab=next==='mart'?'mart':next==='status'?'status':'bag';selected=null;slot=0;filter='전체';note='';$('itemPanel').classList.remove('hidden');render();
 }
 function close(){$('itemPanel')?.classList.add('hidden');}
 function init(){
  if($('itemPanel'))return;const div=document.createElement('div');div.id='itemPanel';div.className='hidden';
  document.body.appendChild(div);
  div.addEventListener('click',e=>{
   if(e.target===div){close();return;}
   const b=e.target.closest('button');if(!b||b.disabled)return;
   const a=b.dataset;
   if(a.close){close();return;}
   if(a.tab){tab=a.tab;selected=null;note='';}
   else if(a.filter){filter=a.filter;selected=null;}
   else if(a.item){selected=a.item;}
   else if(a.slot!==undefined){slot=Number(a.slot);const uid=ensure().itemEquip[slot];if(uid&&tab==='bag')selected=uid;else if(uid&&tab==='mart')note='가방에서 장착 해제하거나 교체할 수 있습니다.';}
   else if(a.buy!==undefined){note=buy(Number(a.buy));tab='bag';filter='전체';}
   else if(a.sell){note=sell(a.sell);}
   else if(a.equip){note=equip(a.equip);}
   else if(a.un!==undefined){note=unequip(Number(a.un));}
   else if(a.use){note=use(a.use);}
   render();
  });
  div.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();close();}});
  $('cityInventory')?.addEventListener('click',()=>open('bag'));
 }
 return {init,open,close,ensure,bonuses,stageStart,dropEnemy,add,roll,effectText,buy,sell,equip,unequip,use,stock};
})();
