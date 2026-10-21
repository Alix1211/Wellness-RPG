#!/usr/bin/env python3
"""R38: 얼굴 있는 여성 4인(유리·지안·오 부장) 시트 연결 + 방 배치 재구성 + 대화 나가기는 방에 머묾.
usage: r38-patch.py WORKDIR DLG.json REPO   (r37 위에 적용). 기준: docs/gaia/CAST_MAP.md"""
import sys,json,re,base64
from pathlib import Path
W=Path(sys.argv[1]);DL=json.load(open(sys.argv[2],encoding='utf8'));R=Path(sys.argv[3])
G=R/'assets/characters/cast4/game'
def rd(n):return (W/n).read_text(encoding='utf8')
def wr(n,s):(W/n).write_text(s,encoding='utf8')
def sub(s,old,new,n=1):
    assert s.count(old)==n,(old[:80],s.count(old));return s.replace(old,new)
def jd(o):return json.dumps(o,ensure_ascii=False,separators=(',',':'))
def url(p):return 'data:image/webp;base64,'+base64.b64encode(p.read_bytes()).decode()
NPC=json.load(open(G/'npc.json'))
# ---- script-01: 이미지·매니페스트
s=rd('script-01.js')
k='const NPC_ART=';i=s.find(k)+len(k);art,end=json.JSONDecoder().raw_decode(s[i:])
for a in NPC['actors']:
    for f in a['frames']:
        _,role,idx,n=f.split('/');art[f]=url(G/f'npc_{role}_{idx}_{n}.webp')
s=s[:i]+json.dumps(art,ensure_ascii=False)+s[i+end:]
k='const NPC_MANIFEST=';i=s.find(k)+len(k);man,end=json.JSONDecoder().raw_decode(s[i:])
man['actors']+=NPC['actors']
s=s[:i]+json.dumps(man,ensure_ascii=False)+s[i+end:]
wr('script-01.js',s)
# ---- script-11: 메트릭 (그려지는 키 높이 120 기준)
s=rd('script-11.js');k='window.CharacterMetrics=';i=s.find(k)+len(k);met,end=json.JSONDecoder().raw_decode(s[i:])
for a in NPC['actors']:
    ms=NPC['metrics'][a['role']+a['id'].split('-')[1]];sc=120/ms[0]['height']
    for f,m in zip(a['frames'],ms):met[f]={'center':m['center'],'ground':m['ground'],'height':m['height'],'scale':sc}
s=s[:i]+jd(met)+s[i+end:]
wr('script-11.js',s)
# ---- script-13: 여성 초상화
s=rd('script-13.js')
new=','.join(json.dumps(w+'_'+t)+':'+json.dumps(url(G/f'portrait_{w}_{t}.webp')) for w in ['yuri','jian','boss'] for t in ['yoga','office'])
s=sub(s,"window.DIALOGUE_WOMEN={","window.DIALOGUE_WOMEN={"+new+",")
wr('script-13.js',s)
# ---- 방 배치
M={'서하준','이안','윤서','도윤','한시우','정민호','오 선생','강태오','재현','백도현','차재원','송 회장'}
ROLE={'서하준':('trainer',0),'이안':('trainer',3),'윤서':('trainer',4),'도윤':('trainer',5),'한시우':('trainer',6),'정민호':('trainer',7),'오 선생':('trainer',8),
 '강태오':('office',4),'재현':('office',5),'백도현':('office',6),'차재원':('office',7),'송 회장':('office',8)}
WROLE={'유리':'yuri','지안':'jian','오 부장':'boss'}
Y={'lobby':582,'shop':575,'recovery':567,'toilet':567,'basic':555,'gear':560,'group':555,'posture':555,'punish':602}
R_=[('f1-lobby-1','lobby',['도윤','유리'],1),('f1-shop-2','shop',['점원','서하준'],1),('f1-recovery-3','recovery',['오 선생'],1),('f1-recovery-4','recovery',['오 선생'],0),('f1-toilet-5','toilet',['도윤'],0),
 ('f2-basic-1','basic',['서하준','유리'],1),('f2-basic-2','basic',['서하준'],2),('f2-basic-3','basic',['서하준','지안'],1),('f2-toilet-4','toilet',['도윤'],0),
 ('f3-gear-1','gear',['윤서','지안'],1),('f3-gear-2','gear',['이안'],1),('f3-gear-3','gear',['윤서'],2),('f3-toilet-4','toilet',['도윤'],0),
 ('f4-group-1','group',['한시우','유리'],2),('f4-group-2','group',['한시우'],2),('f4-group-3','group',['한시우','지안'],1),('f4-toilet-4','toilet',['도윤'],0),
 ('f5-posture-1','posture',['한시우'],1),('f5-posture-2','posture',['한시우','유리'],1),('f5-posture-3','posture',['한시우'],2),('f5-toilet-4','toilet',['도윤'],0),
 ('f6-punish-1','punish',['정민호'],1),('f6-punish-2','punish',['정민호'],1),('f6-punish-3','punish',['정민호'],1),('f6-recovery-4','recovery',['오 선생','유리'],0),('f6-toilet-5','toilet',['도윤'],0),
 ('company-f1-companyLobby-1','companyLobby',['강태오','송 회장','지안'],1),('company-f1-lounge-2','lounge',['오 부장','지안'],0),('company-f1-pantry-3','pantry',['오 부장','유리'],0),('company-f1-companyToilet-4','companyToilet',['지안','오 부장'],0),
 ('company-f2-sharedOffice-1','sharedOffice',['재현','지안'],1),('company-f2-sharedOffice-2','sharedOffice',['강태오','유리'],2),('company-f2-meeting-3','meeting',['재현','강태오'],1),
 ('company-f2-pantry-4','pantry',['오 부장','지안'],0),('company-f2-companyToilet-5','companyToilet',['오 부장','유리'],0),
 ('company-f3-privateOffice-1','privateOffice',['백도현','오 부장'],0),('company-f3-privateOffice-2','privateOffice',['차재원','송 회장'],0),
 ('company-f3-meeting-3','meeting',['재현','강태오'],1),('company-f3-lounge-4','lounge',['오 부장','유리'],0),('company-f3-companyToilet-5','companyToilet',['지안','오 부장'],0)]
SLOT=[820,330,1000];BG=[(160,15),(1100,40)]
PLAN={};DEF={};cnt=0
for rid,kind,names,nb in R_:
    comp=rid.startswith('company');y=Y.get(kind,555);plan=[];people=[]
    for i,n in enumerate(names):
        if n in ROLE:role,idx=ROLE[n]
        elif n in WROLE:role,idx=WROLE[n],(1 if comp else 0)
        else:role,idx='yoga-member',0   # 점원
        plan.append({'n':n,'role':role,'idx':idx,'x':SLOT[i],'y':y if i==0 else y+(50 if i==1 else 30),'staff':True});people.append({'n':n})
    for j in range(nb):   # 이름·얼굴 없는 배경 여성: 말은 못 건다
        cnt+=1;role='office-member' if comp else ('yoga-member' if cnt%2 else 'member');idx=[1,2,4,5][cnt%4] if role=='office-member' else (cnt*2)%(6 if role=='yoga-member' else 7)
        plan.append({'n':'','role':role,'idx':idx,'x':BG[j][0],'y':y+BG[j][1],'staff':False})
    PLAN[rid]=plan;DEF[rid]={'lead':names[0],'people':people}
s=rd('script-16.js')
k='window.CAST_DEF=';i=s.find(k)+len(k);_,end=json.JSONDecoder().raw_decode(s[i:]);s=s[:i]+jd(DEF)+s[i+end:]
k='const CAST_PLAN=';i=s.find(k)+len(k);_,end=json.JSONDecoder().raw_decode(s[i:]);s=s[:i]+jd(PLAN)+s[i+end:]
# 시트 얼굴: 유리·지안·오 부장은 장소에 따라 요가복/오피스 초상화
s=sub(s,"function castWomSrc(c,name){const d=c&&c.people.find(p=>p.n===name),k=d?.wom||CAST_WOM[name];",
 "function castWk(sp){const b={'유리':'yuri','지안':'jian','오 부장':'boss'}[sp];return b?b+'_'+(place()==='company'?'office':'yoga'):null;}\n  function castWomSrc(c,name){const d=c&&c.people.find(p=>p.n===name),k=castWk(name)||d?.wom||CAST_WOM[name];")
s=sub(s,"wk=line.wom||WOM[line.speaker]","wk=line.wom||castWk(line.speaker)||WOM[line.speaker]")
# 대화 중 '나가기/취소'는 걷는 방에서는 방 안에 머문다 (방을 나가려면 문 쪽으로 걸어감)
s=sub(s,"if(world.scene.type==='room'&&place()!=='home')M.leaveRoom(world);portalCooldown=.7;","if(world.scene.type==='room'&&place()!=='home'&&!roomCastFor(room()))M.leaveRoom(world);portalCooldown=.7;")
wr('script-16.js',s)
print('r38 patched',len(PLAN),'rooms')
