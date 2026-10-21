#!/usr/bin/env python3
"""R44: 미니게임 시작 전 '청원 장면'(방 배경 + 무릎 꿇은 주인공 + 조교 시작 신호 대사(DIALOGUE_FULL_4 '게임 시작 대사') + 시작).
 게임 문서가 뒤에서 로딩되는 동안 화면을 덮어 옛 장소·난이도 선택/그림 준비 중 화면이 보이지 않게 한다. usage: r44-patch.py WORKDIR (r43 위)"""
import sys
from pathlib import Path
W=Path(sys.argv[1]);p=W/'script-16.js';s=p.read_text(encoding='utf8')
def sub(s,o,n,c=1):
    assert s.count(o)==c,(o[:70],s.count(o));return s.replace(o,n)
fn=r"""
const PLEA_LINES={water:['조교','병 들어. 물 틀어. 흘리지 마, 이년아.','네!! 최선을 다하겠습니다!!'],rope:['윤서','줄 풀었어. 시작해.','네!! 놓치지 않겠습니다!!'],batting:['이안','타석 앞으로 기어. 스윙 준비.','네!! 날아가겠습니다!!'],cylinder:['조교','박자 맞춰. 놓치면 처음부터.','네!! 박자에 맞추겠습니다!!'],squat:['정민호','50회. 시작.','네!! 하나, 둘, 셋!!'],0:['한시우','단체 정렬. 움찔한 년 찾아봐.','네!! 눈 크게 뜨겠습니다!!'],1:['백도현','소시지 합쳐봐. 손 쓰면 감점.','네!! 입으로 하겠습니다!!'],2:['한시우','유리잔 올려. 자세 유지.','네!! 버티겠습니다!!'],3:['정민호','자세 잡아. 시작한다.','네!! 감사히 받겠습니다!!'],4:['정민호','눈 감지 마. 언제 올지 몰라.','네!! 긴장하겠습니다!!'],5:['서하준','저쪽 물건 가져와. 입으로.','네!! 가져오겠습니다!!']};
function pleaScene(r,game,frame){const old=document.getElementById('pleaScene');if(old)old.remove();const L=PLEA_LINES[game];if(!L)return;const lead=roomCastFor(r)?.lead;const who=lead||L[0];const hero=CITY_EXTRAS[world.outfit+'/before'];const el=document.createElement('div');el.id='pleaScene';el.style.cssText='position:fixed;inset:0;z-index:99999;background:#f4e6d6 center/cover no-repeat;display:flex;flex-direction:column;justify-content:flex-end;font-family:Gaia,system-ui,sans-serif';const bg=ART['bg/'+r.bg];if(bg)el.style.backgroundImage='url("'+bg+'")';
el.innerHTML='<button id="pleaBack" style="position:absolute;top:max(12px,env(safe-area-inset-top));left:12px;width:40px;height:40px;border-radius:20px;border:0;background:#fff5e8e8;color:#77516b;font-size:20px">‹</button>'+(hero?'<img src="'+hero+'" style="position:absolute;left:50%;bottom:0;height:62%;max-width:70%;object-fit:contain;transform:translateX(-50%);filter:drop-shadow(0 6px 10px #0003)">':'')+'<div style="position:relative;margin:0 14px calc(18px + env(safe-area-inset-bottom));padding:14px 16px;border-radius:18px;background:#fff7eaf0;color:#77516b;box-shadow:0 4px 14px #0003"><div style="font-weight:700;font-size:15px;line-height:1.5"><span style="color:#b0507a">'+who+'</span> '+L[1]+'</div><div style="margin-top:6px;font-weight:700;font-size:15px;line-height:1.5"><span style="color:#b0507a">'+(life.name||'나')+'</span> '+L[2]+'</div><button id="pleaGo" disabled style="margin-top:12px;width:100%;height:44px;border:0;border-radius:22px;background:linear-gradient(#f07aa6,#d9537f);color:#fff;font-size:16px;font-weight:700;opacity:.55">준비 중…</button></div>';document.body.append(el);
const go=el.querySelector('#pleaGo');const ready=()=>{go.disabled=false;go.style.opacity='1';go.textContent='시작';};let n=0;const chk=setInterval(()=>{n++;let ok=false;try{const d=frame.contentDocument;ok=!!d&&d.readyState==='complete'&&!/그림 준비 중/.test(d.body.innerText||'');}catch{ok=true}if(ok||n>40){clearInterval(chk);setTimeout(ready,300);}},100);
el.querySelector('#pleaBack').onclick=()=>{clearInterval(chk);el.remove();endGame();};
go.onclick=()=>{clearInterval(chk);el.remove();let t=0;const tm=setInterval(()=>{t++;try{const d=frame.contentDocument;const b=[...d.querySelectorAll('button')].find(b=>/^시작/.test(b.textContent.trim())&&!b.disabled&&b.offsetParent!==null);if(b){b.click();clearInterval(tm);return;}}catch{}if(t>25)clearInterval(tm);},100);};}
"""
s=sub(s,"async function startGame(){",fn+"async function startGame(){")
o="$('#miniFrame').srcdoc=game==='batting'?injectBatting(BATTING_DOCUMENT,config):injectGame(doc,config);}"
n="const frame=$('#miniFrame');frame.srcdoc=game==='batting'?injectBatting(BATTING_DOCUMENT,config):injectGame(doc,config);pleaScene(launchContext.r,game,frame);}"
s=sub(s,o,n)
# 종료/중단 시 청원 장면이 남지 않게
s=sub(s,"function endGame(){","function endGame(){{const ps=document.getElementById('pleaScene');if(ps)ps.remove();}")
p.write_text(s,encoding='utf8');print('r44 patched')
