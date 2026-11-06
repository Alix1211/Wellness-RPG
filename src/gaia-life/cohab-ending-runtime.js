/* GAIA CITY LIFE — additive cohabitation/marriage/ending connection.
 * Dialogue data comes exclusively from the user's exact v4 handoff.
 * This file runs INSIDE the existing GameHost closure, after const L=GaiaLife.
 */
const GAIA_MEN=['서하준','이안','윤서','도윤','한시우','정민호','오 선생','강태오','재현','백도현','차재원','송 회장'];
const GAIA_P_ID={'오 선생':'오선생','송 회장':'송회장'};
const GAIA_WITNESS={'유리':6,'지안':6,'오 부장':7};
let gaiaPendingHusband=null;
function gaiaState(){
 const l=life.living;
 if(!l.gaiaStory)l.gaiaStory={version:1,witness:{},bonds:{},cohab:false,evaluated:false,husband:null,marriedDay:null,morning:false,ended:false,seen:{},daily:{},lockNotice:false};
 const g=l.gaiaStory;
 g.witness||={};g.bonds||={};g.seen||={};g.daily||={};
 if(l.cohab)g.cohab=true;
 if(g.cohab)l.cohab=true;
 return g;
}
function gaiaTrackTalk(name,lines){
 if(!Array.isArray(lines)||!lines.length)return;
 const g=gaiaState();
 if(Object.hasOwn(GAIA_WITNESS,name)){
  const expected=PERSON_LINES[name]?.[GAIA_WITNESS[name]]?.l?.[0]?.[1];
  if(expected&&lines[0].text===expected)g.witness[name]=true;
 }
 if(GAIA_MEN.includes(name)){
  const b=g.bonds[name]||={days:[],stage:0};
  if(!b.days.includes(life.day))b.days.push(life.day);
  b.stage=Math.min(4,b.days.length);
 }
 save();
}
function gaiaNamedLine([speaker,text]){
 const g=gaiaState();
 const husband=gaiaPendingHusband||g.husband||life.living.partner?.name;
 if(husband&&(speaker==='남편'||speaker==='남성'))speaker=husband;
 const woman=['유리','지안','오 부장','유리·지안·오 부장','지안·유리·오 부장'].includes(speaker);
 return {speaker,text,male:!!speaker&&!woman&&speaker!=='주인공'&&speaker!=='나'&&speaker!=='혼잣말'};
}
function gaiaLines(id){
 const lines=COHAB_DATA[id];
 if(!lines)throw Error('GAIA dialogue block missing: '+id);
 return lines.map(gaiaNamedLine);
}
function gaiaScenes(ids,onComplete){
 const r=roomContext?.r||M.FLOORS[11].rooms[0];
 const next=(index)=>{
  if(index>=ids.length){onComplete?.();save();closeRoom();return;}
  openRoom(r,{story:false,lines:gaiaLines(ids[index]),continueLabel:'계속',onFinish:()=>next(index+1)});
 };
 next(0);
}
function gaiaWitnessReady(){const w=gaiaState().witness;return ['유리','지안','오 부장'].every(n=>w[n]);}
function gaiaBondStage(name){return gaiaState().bonds[name]?.stage||0;}
function gaiaCohabBegin(){
 if(gaiaState().cohab||!gaiaWitnessReady()||average()<60)return;
 gaiaScenes(['GP-1','GP-2','GP-3','D1','cohabStart'],()=>{
  const g=gaiaState();g.cohab=true;life.living.cohab=true;g.seen.move=true;
  const destination=CityTravel.destinations.find(d=>d.id==='family');
  if(destination)destination.name='우리 집 · 동거';
  M.changeFloor(world,9);autoOutfit();
  lifeNote('3인방 동거 시작');L.gates(life);
 });
}
function gaiaEvaluate(){
 const g=gaiaState();
 if(!g.cohab||g.evaluated||average()<80||!GAIA_MEN.some(n=>gaiaBondStage(n)>=4))return;
 gaiaScenes(['GP-4'],()=>{g.evaluated=true;lifeNote('배우자 후보 평가 시작');});
}
function gaiaPropose(name){
 const g=gaiaState();
 if(!g.evaluated||g.husband||gaiaBondStage(name)<4)return;
 const id=GAIA_P_ID[name]||name;
 gaiaPendingHusband=name;
 gaiaScenes(['P-'+id,'F3','F4','D5'],()=>{
  g.husband=name;g.marriedDay=life.day;
  gaiaPendingHusband=null;
  life.living.married=true;
  life.living.partner={id:name,name,since:life.day};
  L.gates(life);
  lifeNote(name+' · 결혼 확정');
 });
}
function gaiaCandidates(){
 const g=gaiaState(),p=panel('배우자 후보');
 if(!g.evaluated){const t=document.createElement('p');t.textContent='오 부장 평가 후 선택할 수 있습니다.';p.append(t);}
 for(const name of GAIA_MEN){
  const stage=gaiaBondStage(name);
  const b=button(p,name+' · '+(['입문 전','입문','적응','몰입','만개'][stage]),()=>{
   const confirm=panel(name);
   button(confirm,'이 사람으로 정한다',()=>gaiaPropose(name));
   button(confirm,'뒤로',gaiaCandidates);
  });
  b.disabled=!g.evaluated||!!g.husband||stage<4;
 }
}
function gaiaFirstMorning(){
 const g=gaiaState();
 if(!g.husband||g.morning||life.day<=g.marriedDay)return;
 gaiaScenes(['H-'+(GAIA_P_ID[g.husband]||g.husband)],()=>{
  g.morning=true;lifeNote('신혼 첫 아침');
 });
}
function gaiaEnding(){
 const g=gaiaState();
 if(!g.morning||g.ended)return;
 gaiaScenes(['ED-1','ED-2'],()=>{
  g.ended=true;g.endingDay=life.day;
  lifeNote('엔딩 완료 · 같은 저장에서 생활 계속');
 });
}
function gaiaDailyEvent(id){
 const g=gaiaState();
 if(g.daily[id]===life.day)return;
 gaiaScenes([id],()=>{g.daily[id]=life.day;});
}
function gaiaLivingMenu(){
 const g=gaiaState(),p=panel('동거 생활');
 const pre=['D-이사1','D-이사3','D3','D-표1','D-표2','D-식탁1','D-방문1','D-방문2'];
 const married=['cohabMorning','cohabEvening','D-이사2','D-표3','D-식탁2','D-식탁3','D-남편1','D-남편3'];
 const caption={'D-이사1':'이사 첫날','D-이사3':'이사 후 일정','D3':'세션 구경하기','D-표1':'냉장고 스케줄표 1','D-표2':'냉장고 스케줄표 2','D-식탁1':'식탁 아침','D-방문1':'유리의 방문객','D-방문2':'오 부장의 방문객','cohabMorning':'동거 아침','cohabEvening':'동거 저녁','D-이사2':'방 배정','D-표3':'냉장고 스케줄표 3','D-식탁2':'식탁 저녁','D-식탁3':'일요일 식탁','D-남편1':'남편과 동거인들 1','D-남편3':'남편과 동거인들 3','D4':'금단 주의보','E12':'새벽 금단'};
 for(const id of [...pre,...(g.husband?married:[])]){
  const b=button(p,caption[id]||id,()=>gaiaDailyEvent(id));b.disabled=g.daily[id]===life.day;
 }
 if(L.nightly(life)){
  for(const id of ['D4','E12']){
   const b=button(p,caption[id],()=>gaiaDailyEvent(id));b.disabled=g.daily[id]===life.day;
  }
 }
 if(g.husband){
  const stage=['입문','적응','몰입','만개'][gaiaStage()-1];
  for(const segment of ['아침','저녁']){
   const id='spouse:'+segment+':'+stage;
   const b=button(p,'남편 · '+segment+' ('+stage+')',()=>gaiaDailyEvent(id));b.disabled=g.daily[id]===life.day;
  }
  if(L.nightly(life)){
   const id='date:공원';const b=button(p,'남편 · 야간 데이트',()=>gaiaDailyEvent(id));b.disabled=g.daily[id]===life.day;
  }
  // D-남편2 belongs only to Ji-an's birthday; no birthday date exists in the source.
 }
}
function gaiaHomeServices(r,add){
 if(!['villa','homeLiving','homeRoom'].includes(r.kind))return;
 const g=gaiaState();
 if(life.living.married&&!g.husband)return; // Preserve old saves made by the legacy park encounter.
 if(g.cohab&&r.kind!=='villa'){
  add('잠자기',()=>{closeRoom();rest(true);});
  add('잠깐 쉬기',()=>{closeRoom();rest(false);});
 }
 if(r.kind==='homeRoom')return;
 if(!g.cohab){
  const unmet=['유리','지안','오 부장'].filter(n=>!g.witness[n]);
  const b=add(unmet.length?'! 동거 준비 · '+unmet.join('·'):'! 동거 시작 · 평균 60',gaiaCohabBegin);
  b.disabled=unmet.length>0||average()<60;
  return;
 }
 if(!g.evaluated&&!g.husband){
  const top=Math.max(...GAIA_MEN.map(gaiaBondStage));
  const b=add('! 후보 평가 · 평균 80 / 유대 '+top+'/4',gaiaEvaluate);
  b.disabled=average()<80||top<4;
 }
 if(g.evaluated&&!g.husband)add('! 배우자 후보 선택',gaiaCandidates);
 if(g.husband&&!g.morning){
  const b=add('! 신혼 첫 아침 · 다음 날',gaiaFirstMorning);
  b.disabled=life.day<=g.marriedDay;
 }
 if(g.morning&&!g.ended)add('! 결혼식 · 엔딩',gaiaEnding);
 add('동거 생활',gaiaLivingMenu);
 if(!g.ended&&!g.husband&&g.evaluated){
  for(const id of ['F1','F2']){
   const b=add(id==='F1'?'평가 · 거절 1':'평가 · 거절 2',()=>gaiaScenes([id],()=>{g.seen[id]=true;}));
   b.disabled=!!g.seen[id];
  }
 }
 if(g.lockNotice&&!life.living.homeLocked){
  const b=add('! 재교육 복귀',()=>gaiaScenes(['homeReturn'],()=>{g.lockNotice=false;}));
  b.disabled=average()<80;
 }
}
function gaiaNewGoal(){
 const g=gaiaState();
 if(life.living.married&&!g.husband)return '기존 결혼 진행 유지';
 if(!g.cohab)return '동거 준비 · 유리·지안·오 부장 / 평균 60';
 if(!g.evaluated)return '남성 유대 만개 / 평균 80 → 오 부장 평가';
 if(!g.husband)return '배우자 후보 선택';
 if(!g.morning)return '결혼 다음 날 · 집에서 첫 아침';
 if(!g.ended)return '집에서 결혼식과 엔딩';
 if(life.living.homeLocked)return '재교육 · 평균 80으로 귀가 복귀';
 return '엔딩 이후 자유 생활 · 동거인들과 함께';
}
function gaiaLockMessage(){
 const g=gaiaState();
 if(!g.husband||!life.living.homeLocked)return;
 if(g.lockNotice)return;
 g.lockNotice=true;
 gaiaScenes(['homeLocked'],()=>{lifeNote('집 출입 보류 · 센터에서 재교육');});
}
// Q30 was originally incorrectly marked one-time. Sunday afternoon once weekly.
const gaiaQ30=QUESTS.find(q=>q.id==='Q30');
if(gaiaQ30)gaiaQ30.repeatable=true;
if(gaiaState().cohab){
 const destination=CityTravel.destinations.find(d=>d.id==='family');
 if(destination)destination.name='우리 집 · 동거';
}
