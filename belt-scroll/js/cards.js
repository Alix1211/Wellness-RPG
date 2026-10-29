window.BeltCards=(()=>{
 const ALL=window.BELT_CARDS||[],by=id=>ALL.find(c=>c.id===id),S=()=>DetectiveApp.state,$=id=>document.getElementById(id);
 const COL={회복:'#4fae82',공격:'#d4577f',버프:'#d39a3f'},FAMS=['회복','공격','버프'];
 const tierOf=n=>n<=4?2:n<=9?3:4;
 let ui={tab:'box',fam:'전체'},cur=[],bar=null;
 function box(){
  const s=S();
  if(!s.cards){s.cards={};s.loadout=[];for(const f of FAMS)ALL.filter(c=>c.fam===f&&c.price<=90).slice(0,2).forEach(c=>{s.cards[c.id]=(s.cards[c.id]||0)+1;});
   const a=ALL.find(c=>s.cards[c.id]&&c.fam==='회복'),b=ALL.find(c=>s.cards[c.id]&&c.fam==='공격');s.loadout=[a&&a.id,b&&b.id].filter(Boolean);}
  s.loadout=(s.loadout||[]).filter(id=>(s.cards[id]||0)>0);return s.cards;
 }
 function cap(){const s=S();let n=1;while(n<13&&s['stage'+n])n++;return tierOf(n);}
 function equipped(id){return (S().loadout||[]).filter(x=>x===id).length;}
 function esc(t){return String(t).replace(/[<>&]/g,'');}
 function mount(){
  let el=$('cardBox');if(el)return el;el=document.createElement('div');el.id='cardBox';
  const act=document.querySelector('#missionEntry .entryActions');act.parentNode.insertBefore(el,act);return el;
 }
 function render(){
  const el=mount(),s=S(),cards=box(),C=cap();
  while(s.loadout.length>C)s.loadout.pop();
  let h=`<div class="cbSlots"><span>출동 카드 ${s.loadout.length}/${C}</span>`;
  for(let i=0;i<C;i++){const c=by(s.loadout[i]);h+=c?`<button class="cbSlot" data-un="${i}" style="border-color:${COL[c.fam]}"><b>${esc(c.name)}</b><small>${esc(c.fx)}</small></button>`:`<button class="cbSlot empty" disabled>비어 있음</button>`;}
  h+=`</div><div class="cbTabs"><button data-tab="box" class="${ui.tab==='box'?'on':''}">보관함</button><button data-tab="shop" class="${ui.tab==='shop'?'on':''}">상점</button><button data-tab="train" class="${ui.tab==='train'?'on':''}">단련</button><i></i>`;
  if(ui.tab!=='train')for(const f of ['전체',...FAMS])h+=`<button data-fam="${f}" class="${ui.fam===f?'on':''}">${f}</button>`;
  h+=`</div>`;
  if(ui.tab==='train'){el.innerHTML=h+trainHtml();return;}
  h+=`<div class="cbList">`;
  const list=ALL.filter(c=>(ui.fam==='전체'||c.fam===ui.fam)&&(ui.tab==='shop'||cards[c.id]>0));
  if(!list.length)h+=`<p class="cbNone">카드가 없습니다. 상점에서 구입하세요.</p>`;
  for(const c of list){
   const n=cards[c.id]||0,free=n-equipped(c.id);
   h+=`<div class="cbRow"><i style="background:${COL[c.fam]}"></i>${c.img?`<img class="cbThumb" src="${c.img}" alt="">`:''}<div><b>${esc(c.name)}</b><small>${c.grade} · ${c.fam} · ${esc(c.fx)}</small></div><em>×${n}</em>`;
   h+=ui.tab==='shop'?`<button data-buy="${c.id}" ${s.gold<c.price?'disabled':''}>${c.price} G</button>`:`<button data-eq="${c.id}" ${(free<=0||s.loadout.length>=C)?'disabled':''}>장착</button>`;
   h+=`</div>`;
  }
  el.innerHTML=h+`</div>`;
 }
 function openBox(){box();ui.tab='box';render();mount().classList.remove('hidden');
  const el=mount();el.onclick=ev=>{const b=ev.target.closest('button');if(!b||b.disabled)return;const s=S();
   if(b.dataset.tab){ui.tab=b.dataset.tab;}else if(b.dataset.fam){ui.fam=b.dataset.fam;}
   else if(b.dataset.un!==undefined){s.loadout.splice(+b.dataset.un,1);}
   else if(b.dataset.eq){s.loadout.push(b.dataset.eq);}
   else if(b.dataset.play){playTrain(b.dataset.play);return;}
   else if(b.dataset.buy){const c=by(b.dataset.buy);if(s.gold>=c.price){s.gold-=c.price;s.cards[c.id]=(s.cards[c.id]||0)+1;DetectiveApp.sync();}}
   DetectiveApp.save();render();};}
 function closeBox(){const el=$('cardBox');if(el){el.classList.add('hidden');el.onclick=null;}}

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
  const s=S(),cards=box(),want=tierOf(stage),ids=s.loadout.slice(0,want),left={...cards};ids.forEach(id=>{left[id]=(left[id]||0)-1;});
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
