#!/usr/bin/env python3
"""R49: 퀘스트 Q01~Q40 연결 (대사는 docs/gaia/ROOM_DIALOGUE_v3.md·QUESTS_DRAFT_1.md 본문 그대로).
 - 새 퀘스트 데이터를 script-05 QUESTS에 추가(옛 L02 '신상 7호 세트'는 Q01로 대체)
 - 조건(스탯·평균·입사·결혼·야간·일수·선행 퀘스트), 의뢰/진행/완료 대사, 보상(골드·스탯·HP), 도착형·대화형 퀘스트
 - 아직 없는 게임(짝맞추기·바닥 밀기)·동거 시스템이 필요한 퀘스트는 잠금(locked/cohab)
usage: r49-patch.py WORKDIR REPO   (r48 위에 적용)"""
import sys,json,importlib.util
from pathlib import Path
W=Path(sys.argv[1]);R=Path(sys.argv[2])
spec=importlib.util.spec_from_file_location('qp',R/'tools/gaia/quest_parse.py');qp=importlib.util.module_from_spec(spec);spec.loader.exec_module(qp)
Q=qp.load()
# id: (giver, at, target, task, game, gold, bonus, extra)
S={
1:('유리','lobby','market','delivery',None,30,{'ge':3},{'item':'7호 세트'}),
2:('회원','lobby','recovery','delivery',None,20,{'ge':2},{'item':'옐로우 리본'}),
3:('회원','gear','recovery','delivery',None,25,{'hp':10},{'item':'예약 확인증'}),
4:('오 부장','pantry','meeting','delivery',None,30,{'bo':2},{'item':'분홍 가방','employed':True}),
5:('남성','companyLobby','meeting','delivery',None,35,{'bo':3},{'item':'검은 장갑','employed':True}),
6:('직원','lobby','villa','delivery',None,25,{},{'item':'파란 파일'}),
7:('서하준','basic','basic','game',5,20,{'bo':7},{'need':{'bo':25}}),
8:('한시우','posture','posture','game',2,25,{'ki':8},{'need':{'ki':35}}),
9:('회원','group','group','game',0,25,{'ge':8},{'need':{'ge':40}}),
10:('윤서','gear','gear','game','rope',30,{'um':8},{'need':{'um':45}}),
11:('정민호','punish','punish','game',3,40,{'bo':10},{'need':{'bo':55}}),
12:('회원','punish','punish','game',4,40,{'ge':10},{'need':{'ge':60}}),
13:('재현','sharedOffice','sharedOffice','game','cylinder',40,{'um':10},{'need':{'um':60},'employed':True}),
14:('한시우','posture','posture','game',2,40,{'bo':6,'ki':6},{'need':{'bo':65},'night':True,'tentative':True}),
15:('남성','park','park','game','cylinder',50,{'um':12},{'need':{'um':70},'night':True}),
16:('서하준','basic','shop','delivery',None,15,{'bo':2},{'item':'세제'}),
17:('접수 직원','lobby','recovery','arrive',None,30,{'ge':3},{'minDay':5}),
18:('접수 직원','lobby','park','arrive',None,30,{'ki':3},{}),
19:('도윤','lobby','lobby','talk',None,40,{'ki':5},{'need':{'ki':30}}),
20:('회원','recovery','shop','delivery',None,25,{'ge':3},{'item':'생일 케이크','minAverage':35}),
21:('이안','gear','shop','delivery',None,15,{'hp':5},{'item':'물병'}),
22:('백도현','sharedOffice','pantry','delivery',None,25,{'um':3},{'item':'간식','employed':True}),
23:('차재원','sharedOffice','meeting','delivery',None,30,{'bo':3},{'item':'서명 서류','employed':True}),
24:('오 부장','companyLobby','meeting','arrive',None,40,{'bo':5},{'employed':True,'minDay':90,'after':'Q04'}),
25:('재현','sharedOffice','meeting','delivery',None,25,{'um':4},{'item':'세션룸 예약증','employed':True,'need':{'um':40}}),
26:('남편','villa','market','delivery',None,20,{'bo':2},{'item':'장바구니','married':True}),
27:('지안','homeLiving','book','delivery',None,15,{'ge':2},{'item':'신간','cohab':True}),
28:('유리','homeLiving','market','delivery',None,40,{'ge':5},{'item':'집들이 장보기','cohab':True,'after':'Q01'}),
29:('지안','homeLiving','homeLiving','talk',None,20,{'bo':3},{'cohab':True,'after':'Q27'}),
30:('오 부장','homeLiving','homeLiving','talk',None,30,{'um':4},{'cohab':True,'after':'Q24'}),
31:('이안','gear','gear','game','batting',25,{'um':6},{'need':{'um':35}}),
32:('한시우','posture','posture','game',None,25,{'ge':6},{'locked':True,'need':{'ge':30}}),
33:('윤서','gear','gear','game',None,25,{'bo':6},{'locked':True,'need':{'bo':30}}),
34:('백도현','pantry','pantry','game',1,25,{'um':7},{'employed':True,'need':{'um':40}}),
35:('건우','store','store','talk',None,30,{'um':4},{'night':True}),
36:('남성','park','park','talk',None,25,{'ki':4},{'night':True}),
37:('여행객 여성','bus','lobby','arrive',None,15,{'ge':2},{}),
38:('접수 직원','lobby','lobby','talk',None,40,{'all':2},{'minAverage':70}),
39:('송 회장','companyLobby','companyLobby','talk',None,50,{'um':5},{'employed':True,'minAverage':75}),
40:('유리','homeLiving','homeLiving','talk',None,50,{'ge':5},{'cohab':True,'after':'Q28','minAverage':80}),
}
new=[]
for n,(giver,at,target,task,game,gold,bonus,ex) in S.items():
    d=Q['Q%02d'%n]
    q={'id':d['id'],'title':d['title'],'giver':giver,'at':at,'target':target,'task':task,'game':game,'gold':gold,'bonus':bonus,'rounds':1,'hp':12 if task=='game' else 0,'slots':1 if task=='game' else 0,'repeatable':False,'weeklyLimit':99,'dailyLimit':1,'fromName':giver,'req':d['req'],'done':d['done']}
    if d['mid']:q['mid']=d['mid']
    if d['nudge']:q['nudge']=d['nudge']
    q.update(ex);new.append(q)
def sub(s,old,new,n=1):
    assert s.count(old)==n,(s.count(old),old[:90]);return s.replace(old,new)
# ---------- script-05: 데이터 ----------
p5=W/'script-05.js';s=p5.read_text(encoding='utf8')
a=s.index('const QUESTS=[')+len('const QUESTS=');arr,end=json.JSONDecoder().raw_decode(s[a:])
arr=[q for q in arr if q['id']!='L02']+new
s=s[:a]+json.dumps(arr,ensure_ascii=False,separators=(',',':'))+s[a+end:]
p5.write_text(s,encoding='utf8')
# ---------- script-16: 규칙·대사·화면 ----------
p=W/'script-16.js';s=p.read_text(encoding='utf8')
s=sub(s,"function availableQuest(q){const p=life.quests[q.id]||{},week=Math.floor((life.day-1)/7);",
 "function qGate(q){const st=life.stats;if(q.locked)return false;if(q.need)for(const[k,v]of Object.entries(q.need))if((st[k]||0)<v)return false;if(q.minDay&&life.day<q.minDay)return false;if(q.after&&!life.quests[q.after]?.done)return false;if(q.night&&!L.nightly(life))return false;if(q.married&&!life.living.married)return false;if(q.cohab&&!life.living.cohab)return false;return true;}\nfunction availableQuest(q){if(!qGate(q))return false;const p=life.quests[q.id]||{},week=Math.floor((life.day-1)/7);")
s=sub(s,"lifeNote(q.title+' 완료 · +'+q.gold+' G');for(const[k,n]of Object.entries(q.bonus||{})){let key=",
 "lifeNote(q.title+' 완료 · +'+q.gold+' G');queueDone(q);for(const[k,n]of Object.entries(q.bonus||{})){if(k==='all'){for(const sk of Object.keys(life.stats))life.stats[sk]=Math.min(100,life.stats[sk]+n);continue;}if(k==='hp'){world.hp=Math.min(100,world.hp+n);continue;}let key=")
i=s.index('function questMenu(){');j=s.index('function action(){')
newqm=r"""const QWOM={'회원':'yoga','직원':'cardigan','접수 직원':'cardigan','신입 회원':'yoga','여행객 여성':'cardigan'};
function qL(a){return a.map(p=>{const L=gLine(p);if(QWOM[p[0]])L.wom=QWOM[p[0]];return L;});}
function qOldLines(q){return q.lines.map((text,i)=>({speaker:i%2?'주인공':'의뢰인',text,male:i%2===0&&place()==='company'}));}
function queueDone(q){if(!q.done)return;const rr=roomContext?.r||currentRoom();(function t(n){if(mode==='field'&&!$('#panel').open&&!roomContext){openRoom(rr,{story:false,lines:qL(q.done),continueLabel:'',onFinish:closeRoom});}else if(n>0)setTimeout(()=>t(n-1),500);})(60);}
function qPickup(q,p,after){const go=()=>{if(q.task==='arrive'){settleQuest(q,true);after?.();return;}p.stage='deliver';p.step=1;lifeNote(q.item+' 수령 · '+q.giver+'에게 돌아가기');save();after?.();};if(q.mid){openRoom(currentRoom(),{story:false,lines:qL(q.mid),continueLabel:'',onFinish:()=>{closeRoom();go();}});}else{go();}}
function questMenu(){const p=panel('부탁'),kind=currentKind(),active=QUESTS.find(q=>q.id===life.active);if(active){const state=life.quests[active.id],target=state.stage==='deliver'?active.at:active.target,goal=M.FLOORS.flatMap(f=>f.rooms).find(r=>r.kind===target);const row=document.createElement('p');row.textContent=active.title+' → '+(goal?.name||target)+(state.stage==='deliver'?' · 전달':'');p.append(row);if(active.nudge?.length){const nr=document.createElement('small');nr.textContent=active.nudge[0][0]+': '+active.nudge[0][1];p.append(nr);}if(target===kind){button(p,state.stage==='deliver'?'전달하기':(active.task==='delivery'||active.task==='arrive')?(active.task==='arrive'?'도착':'물건 받기'):'시작',()=>{if(state.stage==='deliver'){settleQuest(active,true);return;}if(active.task==='delivery'||active.task==='arrive'){qPickup(active,state);return;}openRoom(currentRoom(),{game:active.game,quest:active.id,story:false});});}if(kind===active.at)button(p,'부탁 취소',()=>{life.active=null;save();});return;}for(const q of QUESTS.filter(q=>q.at===kind&&availableQuest(q)).slice(0,8)){button(p,q.title+' · '+q.gold+' G',()=>{life.active=q.id;life.quests[q.id]={...(life.quests[q.id]||{}),step:0,stage:q.task==='delivery'||q.task==='arrive'?'pickup':q.task==='talk'?'talk':'game'};save();openRoom(currentRoom(),{story:false,lines:q.req?qL(q.req):qOldLines(q),continueLabel:q.task==='talk'?'':'받았습니다',onFinish:()=>{closeRoom();if(q.task==='talk'){settleQuest(q,true);flowSpeak();return;}if(q.id==='L05')flowDinner();flowSpeak();}});});}if(!p.querySelector('button')){const row=document.createElement('p');row.textContent='지금은 부탁이 없다. 다른 방도 들러보자.';p.append(row);}}

"""
s=s[:i]+newqm+s[j:]
s=sub(s,"else if(active&&active.target===r.kind&&active.task==='delivery')add('! '+active.item+' 받기',()=>{p.stage='deliver';p.step=1;lifeNote(active.item+' 수령 · '+active.fromName+'에게 돌아가기');save();closeRoom();});",
 "else if(active&&active.target===r.kind&&(active.task==='delivery'||active.task==='arrive'))add(active.task==='arrive'?'! 도착 · '+active.title:'! '+active.item+' 받기',()=>{closeRoom();qPickup(active,p);});")
p.write_text(s,encoding='utf8');print('r49 patched',len(new),'quests')
