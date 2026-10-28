// 카지노 슬롯머신 — 카드게임(gaia-detective/js/shop.js)의 슬롯을 벨트스크롤 쪽 돈(G)으로 돌리게 옮긴 것.
// 3×3 릴, 심볼 8종(카드 그림 7종 + 골드). 줄 수(1·3·5)×줄당 판돈이 한 번 돌릴 때의 판돈.
// 한 줄에 3개 일치: 골드=줄당×gold3, 카드 그림=줄당×triple. 2개 일치: 골드=줄당×gold2, 그림=줄당×pair.
// 출동(전투 결과)을 한 번 마치면 limit 횟수가 다시 채워진다. 수치는 아래 SLOT 에서만 조정(전부 [임시]).
window.REGION_ART=window.REGION_ART||{};
REGION_ART.casino_entry='assets/slot/entry.webp'; // 카지노 입장 화면 그림(literal 경로여야 단일 HTML 빌드에 들어간다)
window.BeltSlot=(()=>{
  const SLOT={bets:[10,20,50],lines:[1,3,5],gold3:30,gold2:3,pair:2,triple:12,limit:10};
  const ROWS=[[[0,0],[0,1],[0,2]],[[1,0],[1,1],[1,2]],[[2,0],[2,1],[2,2]]],DIAG=[[[0,0],[1,1],[2,2]],[[2,0],[1,1],[0,2]]];
  const FW=1225,FH=1015,WX=[[240,454],[490,706],[741,956]],WY=[[171,390],[424,635],[670,879]]; // 틀 그림 속 릴 창 9칸(1225×1015 기준)
  const COIN='data:image/svg+xml;utf8,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><radialGradient id="g" cx="35%" cy="30%" r="80%"><stop offset="0" stop-color="#fff6b8"/><stop offset=".55" stop-color="#ffc83d"/><stop offset="1" stop-color="#d98a12"/></radialGradient></defs><circle cx="50" cy="50" r="46" fill="url(#g)" stroke="#b06a0a" stroke-width="4"/><circle cx="50" cy="50" r="34" fill="none" stroke="#e8a21f" stroke-width="3"/><text x="50" y="64" font-family="sans-serif" font-weight="900" font-size="42" text-anchor="middle" fill="#a8610b">G</text></svg>');
  const rnd=a=>a[Math.floor(Math.random()*a.length)];
  const pickN=(a,n)=>{const b=a.slice(),o=[];while(o.length<n&&b.length)o.push(b.splice(Math.floor(Math.random()*b.length),1)[0]);return o;};
  const pc=(v,t)=>(v/t*100).toFixed(3)+'%';
  const $=id=>document.getElementById(id);
  const hap=n=>{try{const h=window.GAIA_HAPTICS;if(h&&h.fx&&h.fx[n])h.fx[n]();}catch(_){}};
  const sfx=(n,v)=>{try{AlleyAudio.effect(n,v);}catch(_){}};
  let root=null,syms=null,grid=null,spinning=false,msg='',nLines=0,nBet=0;
  const S=()=>DetectiveApp.state;
  const used=()=>S().slotUsed||0;
  const total=()=>SLOT.lines[nLines]*SLOT.bets[nBet];
  const art=id=>id==='gold'?COIN:((window.BELT_IMG&&BELT_IMG[id])||'');
  const symHTML=id=>'<img alt="" draggable="false" src="'+art(id)+'">';
  const newSyms=()=>{syms=pickN(Object.keys(window.BELT_IMG||{}),7).concat(['gold']);grid=null;};

  function build(){
    root=document.createElement('div');root.id='slotRoot';root.className='hidden';
    root.style.background='linear-gradient(rgba(60,20,50,.18),rgba(60,20,50,.18)),url(assets/slot/bg.webp) center/cover no-repeat';
    document.body.appendChild(root);
  }
  function open(){
    if(!root)build();newSyms();spinning=false;nLines=0;nBet=0;
    grid=[0,1,2].map(()=>[0,1,2].map(()=>rnd(syms)));
    msg=used()>=SLOT.limit?'한 판 뛰고 오세요':'돌려 보세요';
    root.classList.remove('hidden');draw();
  }
  function close(){if(spinning)return;root.classList.add('hidden');try{DetectiveApp.sync();}catch(_){}}
  function draw(){
    let h='<div class="sl-hud"><button id="slExit">나가기</button><div class="sl-grp"><div class="sl-gold" id="slCnt"></div><div class="sl-gold" id="slGold"></div></div></div>'+
      '<div class="sl-stage"><img class="sl-girl" alt="" draggable="false" src="assets/slot/girl.webp"><div class="sl-m" id="slm">';
    for(let c=0;c<3;c++){const cx=(WX[c][0]+WX[c][1])/2;h+='<div class="sl-rc" id="rc'+c+'" style="left:'+pc(cx-107.5,FW)+'"><div class="sl-strip" id="st'+c+'"></div></div>';}
    for(let r=0;r<3;r++)for(let c=0;c<3;c++)h+='<div class="sl-wn" id="wn'+r+c+'" style="left:'+pc(WX[c][0],FW)+';top:'+pc(WY[r][0],FH)+';width:'+pc(WX[c][1]-WX[c][0],FW)+';height:'+pc(WY[r][1]-WY[r][0],FH)+'"></div>';
    h+='<img class="sl-frame" alt="" draggable="false" src="assets/slot/frame.webp"><div class="sl-plate" id="slPlate"></div>';
    [462,597,733].forEach((x,i)=>{h+='<button class="sl-b" id="slB'+i+'" style="left:'+pc(x-50,FW)+'"></button>';});
    h+='<button class="sl-lev" id="slLev" aria-label="레버"></button></div><div class="sl-jp hidden" id="slJp"></div></div>';
    root.innerHTML=h;
    for(let c=0;c<3;c++)showCol(c,[grid[0][c],grid[1][c],grid[2][c]]);
    $('slExit').addEventListener('click',()=>{if(spinning)return;sfx('hit',.18);close();});
    $('slB0').addEventListener('click',()=>{if(spinning||used()>=SLOT.limit)return;nLines=(nLines+1)%SLOT.lines.length;sfx('hit',.18);msg='';hud();});
    $('slB1').addEventListener('click',()=>{if(spinning||used()>=SLOT.limit)return;nBet=(nBet+1)%SLOT.bets.length;sfx('hit',.18);msg='';hud();});
    $('slB2').addEventListener('click',spin);$('slLev').addEventListener('click',spin);
    if(used()>=SLOT.limit)showBunnyMan();
    hud();
  }
  function showCol(c,v){
    const st=$('st'+c);st.style.height='100%';st.style.transition='none';st.style.transform='none';
    st.innerHTML=v.map(id=>'<div class="sl-cell" style="height:'+(100/3).toFixed(3)+'%">'+symHTML(id)+'</div>').join('');
  }
  function hud(){
    const g=S().gold,n=used(),lim=n>=SLOT.limit,tot=total();
    $('slGold').textContent=g+' G';$('slCnt').textContent='이번 출동 '+n+'/'+SLOT.limit+'회';
    $('slB0').textContent=SLOT.lines[nLines]+'줄';$('slB1').textContent=SLOT.bets[nBet]+' G';$('slB2').textContent='돌리기';
    $('slB0').disabled=$('slB1').disabled=spinning||lim;
    const cant=spinning||lim||g<tot;
    $('slB2').disabled=cant;$('slLev').disabled=cant;$('slExit').disabled=spinning;
    $('slPlate').textContent=msg||(lim?'한 판 뛰고 오세요':g<tot?'자금이 모자랍니다':'판돈 '+tot+' G');
  }
  function showBunnyMan(){
    const st=root.querySelector('.sl-stage');if(!st||st.querySelector('.sl-man'))return;
    const im=document.createElement('img');im.className='sl-man';im.alt='';im.draggable=false;im.src='assets/slot/bunnyman.webp';st.appendChild(im);
  }
  const lineSet=()=>{const n=SLOT.lines[nLines];return n===1?[ROWS[1]]:n===3?ROWS:ROWS.concat(DIAG);};
  function spin(){
    const tot=total();if(spinning||used()>=SLOT.limit||S().gold<tot)return;
    S().gold-=tot;S().slotUsed=used()+1;DetectiveApp.save();try{DetectiveApp.sync();}catch(_){}
    spinning=true;msg='두근두근…';hud();root.querySelectorAll('.sl-wn').forEach(e=>e.classList.remove('on'));
    const res=[0,1,2].map(()=>[0,1,2].map(()=>rnd(syms)));
    for(let c=0;c<3;c++){
      const prev=[grid[0][c],grid[1][c],grid[2][c]],ids=prev.slice(),N=12+c*5;
      for(let i=0;i<N;i++)ids.push(rnd(syms));
      ids.push(res[0][c],res[1][c],res[2][c]);
      const st=$('st'+c),len=ids.length;
      st.style.transition='none';st.style.height=(len/3*100).toFixed(3)+'%';st.style.transform='translateY(0)';
      st.innerHTML=ids.map(id=>'<div class="sl-cell" style="height:'+(100/len).toFixed(4)+'%">'+symHTML(id)+'</div>').join('');
      $('rc'+c).classList.add('mv');void st.offsetHeight;
      const dur=1000+c*450;
      st.style.transition='transform '+dur+'ms cubic-bezier(.17,.7,.22,1)';
      st.style.transform='translateY(-'+((len-3)/len*100).toFixed(4)+'%)';
      setTimeout(()=>{$('rc'+c).classList.remove('mv');sfx('hit',.22);hap('tick');if(c===2){grid=res;settle(res);}},dur);
    }
  }
  function settle(res){
    const per=SLOT.bets[nBet];let gold=0,jackpot=false;const win=[];
    lineSet().forEach(L=>{
      const s=L.map(p=>res[p[0]][p[1]]),cnt={};s.forEach(x=>{cnt[x]=(cnt[x]||0)+1;});
      const top=Object.keys(cnt).sort((a,b)=>cnt[b]-cnt[a])[0],n=cnt[top];
      if(n===3&&top==='gold'){gold+=per*SLOT.gold3;jackpot=true;}
      else if(n===3){gold+=per*SLOT.triple;jackpot=true;}
      else if(n===2&&top==='gold')gold+=per*SLOT.gold2;
      else if(n===2)gold+=per*SLOT.pair;
      else return;
      L.forEach(p=>{if(res[p[0]][p[1]]===top)win.push(p);});
    });
    S().gold+=gold;DetectiveApp.save();try{DetectiveApp.sync();}catch(_){}
    win.forEach(p=>{const e=$('wn'+p[0]+p[1]);if(e)e.classList.add('on');});
    msg=gold?(jackpot?'잭팟! ':'')+'+'+gold+' G':'꽝…';
    spinning=false;hud();
    if(jackpot){jackpotFx();hap('orgasm');sfx('victory',.3);}else if(gold)hap('miniPerfect');else hap('miniBad');
    if(used()>=SLOT.limit)setTimeout(()=>{if(root&&!root.classList.contains('hidden')){showBunnyMan();msg='한 판 뛰고 오세요';hud();}},jackpot?2200:900);
  }
  function jackpotFx(){
    const jp=$('slJp');if(!jp)return;jp.innerHTML='<img alt="" src="assets/slot/jp_girl.webp"><img alt="" src="assets/slot/jp_boy.webp">';jp.classList.remove('hidden');
    setTimeout(()=>{if(jp)jp.classList.add('hidden');},2600);
  }
  return {open,close,config:SLOT};
})();
