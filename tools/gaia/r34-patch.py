#!/usr/bin/env python3
"""R34 (1단계): 대사 1~5권을 게임에 반영.  usage: r34-patch.py WORKDIR DLG.json   (r33 위에 적용)
 - script-05: ORIGINAL_DIALOGUE(방 담당·조연) 전체 교체, STORY 24편 교체
 - script-16: 단계(입문~만개) 선택, 인물 구분 말하기, 담당 방 대사, 게임 결과 대사, 문 밖 소리 제거"""
import sys,json,re
from pathlib import Path
W=Path(sys.argv[1]);DL=json.load(open(sys.argv[2],encoding='utf8'))
def rd(n):return (W/n).read_text(encoding='utf8')
def wr(n,s):(W/n).write_text(s,encoding='utf8')
def sub(s,old,new,n=1):
    assert s.count(old)==n,(old[:80],s.count(old));return s.replace(old,new)
def jd(o):return json.dumps(o,ensure_ascii=False,separators=(',',':'))
P=DL['persons']
def sets_of(name,extra_stage=None):
    out=[]
    for st,L in P.get(name,{}).items():
        for l in L:out.append({'s':int(st),'l':l})
    return out
# 방 키 -> 담당 인물
ROOMMAP={
 'n:lobby':['도윤','유리'],'n:basic':['서하준'],'n:shop':['점원','서하준'],'n:gear':['이안','윤서'],
 'n:group':['한시우'],'n:posture':['한시우'],'n:punish':['정민호'],'n:special':['정민호'],'n:recovery':['오 선생'],
 'o:lobby':['강태오','송 회장'],'o:open':['재현','강태오','지안'],'o:exec':['백도현','차재원','오 부장','송 회장'],
 'o:wc':['지안','오 부장'],'o:lounge':['오 부장','지안']}
EXTRA={ # 조연(R1~R17) -> 방 키
 'n:basic':['센터 · 기초방 회원'],'n:gear':['센터 · 기구방 회원'],'n:group':['센터 · 단체방 회원'],'n:posture':['센터 · 단체방 회원'],
 'n:punish':['센터 · 체벌방 회원'],'n:recovery':['센터 · 회복실 회원'],'n:lobby':['센터 · 로비 회원'],'n:special':['센터 · 화장실 훈련방 회원'],
 'o:lobby':['회사 · 로비 안내 직원'],'o:open':['회사 · 공용 사무실 직원','회사 · 회의실 참석자'],'o:exec':['회사 · 개인 사무실 비서'],'o:lounge':['회사 · 휴게실·탕비실 직원']}
OD={}
for k,names in ROOMMAP.items():
    arr=[]
    for n in names:arr+=sets_of(n)
    for h in EXTRA.get(k,[]):
        for l in DL['extras'].get(h,[]):arr.append({'s':0,'l':l})
    OD[k]=arr
# 집 혼잣말
HM=DL['home']['혼자 사는 동안 (혼잣말)']
def hs(*labels):
    out=[]
    for lab in labels:
        if lab in HM:
            s=1 if lab.endswith('입문') else 4 if lab.endswith('만개') else 0
            out.append({'s':s,'l':HM[lab]})
    return out
OD['h:living']=hs('거실 입문','거실 만개','서재 입문','서재 만개')
OD['h:bed']=hs('침실 입문','침실 만개')
OD['h:bath']=hs('욕실 입문','욕실 만개')
OD['h:punish']=hs('지하실')
# 게임 결과
RESKEY={'화장실 물병':'water','줄 자르기':'rope','배팅 (주인공이 공)':'batting','실린더':'cylinder','균형':2,'움찔 찾기':0,
 '백만 대 (체벌 허용)':3,'뒤를 조심 (체벌 허용)':4,'물어와 (기초방)':5,'소시지 합치기':1,'스쿼트':'squat'}
RES={}
for k,v in DL['results'].items():
    if k in RESKEY:RES[str(RESKEY[k])]={'s':v['s'],'f':v['f']}
# ---- script-05
s=rd('script-05.js')
def swap_json(s,name,newobj,opener):
    key='const '+name+'='
    i=s.find(key);assert i>=0 and s.count(key)==1,name
    j=i+len(key)
    obj,end=json.JSONDecoder().raw_decode(s[j:])
    return s[:j]+jd(newobj)+s[j+end:],obj
s,_=swap_json(s,'ORIGINAL_DIALOGUE',OD,'{')
s,STORY=swap_json(s,'STORY',[],'[')   # placeholder to read
# rebuild STORY with new text
MALE=set(['도윤','서하준','이안','윤서','한시우','정민호','오 선생','강태오','재현','백도현','차재원','송 회장','건우','남신입','남편','남성','조교','손님','정육','바리스타','청소원','노인','파트너'])
newS=[]
for q in STORY:
    d=DL['story'].get(q['id'])
    if d:
        q=dict(q);q['title']=d['title']
        q['lines']=[{'speaker':sp,'text':tx,'male':sp not in ('주인공','나')} for sp,tx in d['lines']]
    newS.append(q)
# swap_json replaced STORY with [] — put the real one back
key='const STORY=';i=s.find(key);j=i+len(key);assert s[j:j+2]=='[]'
s=s[:j]+jd(newS)+s[j+2:]
wr('script-05.js',s)
# ---- script-16
s=rd('script-16.js')
CL={'shop':{'점원':sets_of('점원'),'서하준':sets_of('서하준')},'bat':{'이안':sets_of('이안')},'rope':{'윤서':sets_of('윤서')}}
# CAST_LINES 교체
a=s.find('window.CAST_LINES=');b=s.find(';window.CAST_DEF=')
assert a>0 and b>a
s=s[:a]+'window.CAST_LINES='+jd(CL)+s[b:]
# 새 도우미 함수 (originalLinesFor 앞에 삽입)
HELP=r"""
const GAIA_WOM={'회원':'yoga','회원 A':'yoga','회원 B':'cardigan','직원':'cardigan','비서':'suit','참석자':'suit','여성 A':'cardigan','여성 B':'yoga','승객':'cardigan','이용자':'yoga','계산원':'grocer','점원':'clerk'};
function gaiaStage(){const a=average();return a<25?1:a<45?2:a<65?3:4;}
function gaiaPick(sets,seed){if(!sets||!sets.length)return null;const st=gaiaStage();let pool=sets.filter(x=>x.s===st);const any=sets.filter(x=>!x.s);if(!pool.length){const lo=sets.filter(x=>x.s&&x.s<=st);if(lo.length){const mx=Math.max(...lo.map(x=>x.s));pool=lo.filter(x=>x.s===mx);}}if(!pool.length){const hi=sets.filter(x=>x.s);if(hi.length){const mn=Math.min(...hi.map(x=>x.s));pool=hi.filter(x=>x.s===mn);}}pool=pool.concat(any);return pool[Math.abs(seed)%Math.max(1,pool.length)]||null;}
function gLine(p){const speaker=p[0],text=p[1],portrait=p[2]||'shy';return {speaker,text,portrait,male:!/^(나|주인공|혼잣말)$/.test(speaker)};}
"""
s=sub(s,"function originalLinesFor(r){",HELP+"function originalLinesFor(r){")
# originalLinesFor 본문 교체
m=re.search(r"function originalLinesFor\(r\)\{\{const c=roomCastFor\(r\);if\(c\)\{const L=castLinesOf\(c,c\.lead,castSeed\(r\)\);if\(L\.length\)return L;\}\}const sets=ORIGINAL_DIALOGUE\[dialogueKey\(r\)\]\|\|\[\];return \(sets\[.*?\]\?\.l\|\|\[\]\)\.map\(.*?\)\);\}",s,re.S)
assert m
newf="function originalLinesFor(r){{const c=roomCastFor(r);if(c){const L=castLinesOf(c,c.lead,castSeed(r));if(L.length)return L;}}const set=gaiaPick(ORIGINAL_DIALOGUE[dialogueKey(r)]||[],life.day+world.scene.floor+world.scene.room);return (set?.l||[]).map(gLine);}"
s=s[:m.start()]+newf+s[m.end():]
# castLinesOf 교체
m=re.search(r"function castLinesOf\(c,name,seed\)\{.*?\}\n",s,re.S)
assert m
s=s[:m.start()]+"function castLinesOf(c,name,seed){const set=gaiaPick(CAST_LINES[c.key]?.[name]||[],seed);return (set?.l||[]).map(gLine);}\n"+s[m.end():]
# 문 밖 소리 제거
m=re.search(r"function castNoise\(r\)\{.*?\}\n",s,re.S)
assert m
s=s[:m.start()]+"function castNoise(r){return '';}\n"+s[m.end():]
# 화자 표시: 회원은 이제 다른 사람
s=sub(s,"/^(나|주인공|회원)$/.test(line.speaker)","/^(나|주인공)$/.test(line.speaker)")
s=sub(s,"const WOM={'지안':'suit',","const WOM={...GAIA_WOM,'지안':'suit',")
# 게임 결과 대사
a=s.find('RESULT_LINES={');assert a>0
s=sub(s,"function pickResultLine(rec){const set=RESULT_LINES[rec.game];if(!set)return '';const pool=rec.success?set.s:set.f;return pool[Math.floor(Math.random()*pool.length)]||'';}",
 "const RES34="+jd(RES)+";\nfunction pickResultLine(rec){const n=RES34[String(rec.game)];if(n){const pool=rec.success?n.s:n.f;if(pool&&pool.length)return pool[Math.floor(Math.random()*pool.length)];}const set=RESULT_LINES[rec.game];if(!set)return '';const pool=rec.success?set.s:set.f;return pool[Math.floor(Math.random()*pool.length)]||'';}\nwindow.G34T={pick:pickResultLine,get speak(){return flowSpeak},stage:gaiaStage};")
s=sub(s,"const lines=[res,flow].filter(Boolean).map(text=>({speaker:'주인공',text,male:false}));",
 "const lines=[].concat(Array.isArray(res)?res.map(gLine):res?[{speaker:'주인공',text:res,male:false}]:[],flow?[{speaker:'주인공',text:flow,male:false}]:[]);")
wr('script-16.js',s)
print('r34 patched; rooms',len(OD),'story',len(newS),'results',list(RES))
