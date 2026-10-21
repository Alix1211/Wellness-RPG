#!/usr/bin/env python3
"""R37: 모든 센터·회사 방을 걸어 다니는 방으로: 방마다 담당 인물(초상화+SD)·조연 여성 배치. docs/gaia/CAST_MAP.md 기준.
usage: r37-patch.py WORKDIR DLG.json   (r36 위에 적용)"""
import sys,json,re
from pathlib import Path
W=Path(sys.argv[1]);DL=json.load(open(sys.argv[2],encoding='utf8'))
def rd(n):return (W/n).read_text(encoding='utf8')
def wr(n,s):(W/n).write_text(s,encoding='utf8')
def sub(s,old,new,n=1):
    assert s.count(old)==n,(old[:80],s.count(old));return s.replace(old,new)
def jd(o):return json.dumps(o,ensure_ascii=False,separators=(',',':'))
# ---- 인물: 이름 -> (초상화 그룹, 번호, SD role, SD 번호, 여성 초상화 키)
M={'서하준':('tracksuit',4,'trainer',0),'이안':('tracksuit',7,'trainer',3),'윤서':('tracksuit',0,'trainer',4),'도윤':('tracksuit',1,'trainer',5),
 '한시우':('tracksuit',2,'trainer',6),'정민호':('tracksuit',3,'trainer',7),'오 선생':('tracksuit',8,'trainer',8),
 '강태오':('suit',0,'office',4),'재현':('suit',1,'office',5),'백도현':('suit',2,'office',6),'차재원':('suit',3,'office',7),'송 회장':('suit',8,'office',8)}
F={'유리':('yoga','yoga-member',1),'지안':('suit','office-member',0),'오 부장':('elder','office-member',3),'점원':('clerk','yoga-member',0)}
CAST_PEOPLE={n:[v[0],v[1]] for n,v in M.items()}
CAST_WOM={n:v[0] for n,v in F.items()}
def sets_of(name):
    return [{'s':int(st),'l':l} for st,L in DL['persons'].get(name,{}).items() for l in L]
PL={n:sets_of(n) for n in list(M)+list(F)}
# ---- 방 배치표: (방 id, 담당들, 조연 수)
Y={'lobby':582,'shop':575,'recovery':567,'toilet':567,'basic':555,'gear':560,'group':555,'posture':555,'punish':602}
EXK={'lobby':'n:lobby','basic':'n:basic','gear':'n:gear','group':'n:group','posture':'n:posture','punish':'n:punish','recovery':'n:recovery','toilet':'n:special',
 'companyLobby':'o:lobby','sharedOffice':'o:open','meeting':'o:open','privateOffice':'o:exec','companyToilet':'o:lounge','pantry':'o:lounge','lounge':'o:lounge'}
ROOMS=[('f1-lobby-1','lobby',['도윤','유리'],2),('f1-recovery-3','recovery',['오 선생'],1),('f1-recovery-4','recovery',['오 선생'],1),('f1-toilet-5','toilet',['도윤'],1),
 ('f2-basic-1','basic',['서하준'],2),('f2-basic-2','basic',['서하준'],2),('f2-basic-3','basic',['서하준'],2),('f2-toilet-4','toilet',['도윤'],1),
 ('f3-gear-1','gear',['윤서'],1),('f3-gear-2','gear',['이안'],1),('f3-gear-3','gear',['윤서'],1),('f3-toilet-4','toilet',['도윤'],1),
 ('f4-group-1','group',['한시우'],2),('f4-group-2','group',['한시우'],2),('f4-group-3','group',['한시우'],2),('f4-toilet-4','toilet',['도윤'],1),
 ('f5-posture-1','posture',['한시우'],2),('f5-posture-2','posture',['한시우'],2),('f5-posture-3','posture',['한시우'],2),('f5-toilet-4','toilet',['도윤'],1),
 ('f6-punish-1','punish',['정민호'],1),('f6-punish-2','punish',['정민호'],1),('f6-punish-3','punish',['정민호'],1),('f6-recovery-4','recovery',['오 선생'],1),('f6-toilet-5','toilet',['도윤'],1),
 ('company-f1-companyLobby-1','companyLobby',['강태오','송 회장'],2),('company-f1-lounge-2','lounge',['오 부장','지안'],1),('company-f1-pantry-3','pantry',['오 부장','지안'],1),('company-f1-companyToilet-4','companyToilet',['지안','오 부장'],0),
 ('company-f2-sharedOffice-1','sharedOffice',['재현','지안'],2),('company-f2-sharedOffice-2','sharedOffice',['강태오','지안'],2),('company-f2-meeting-3','meeting',['재현','강태오'],1),
 ('company-f2-pantry-4','pantry',['오 부장','지안'],1),('company-f2-companyToilet-5','companyToilet',['지안','오 부장'],0),
 ('company-f3-privateOffice-1','privateOffice',['백도현','오 부장'],1),('company-f3-privateOffice-2','privateOffice',['차재원','송 회장'],1),
 ('company-f3-meeting-3','meeting',['재현','강태오'],1),('company-f3-lounge-4','lounge',['오 부장','지안'],1),('company-f3-companyToilet-5','companyToilet',['지안','오 부장'],0)]
POOL={'center':[('yoga-member',[0,1,2,3,4,5],'yoga'),('member',[0,1,2,3,4,5,6],None)],'company':[('office-member',[1,2,4,5],None),('casual-member',[0,1],'grocer')]}
MWOM=['aunt','grocer','cardigan']
def wom_of(role,idx,fixed):
    if fixed:return fixed
    if role=='member':return MWOM[idx%3]
    return 'suit' if idx%2==0 else 'cardigan'
def alt(w):return 'cardigan' if w!='cardigan' else 'yoga'
PLAN={};DEF={};cnt=0
for rid,kind,names,nw in ROOMS:
    comp=rid.startswith('company');y=Y.get(kind,555);plan=[];people=[]
    for i,n in enumerate(names):
        if n in M:g,gi,role,ci=M[n];e={'n':n}
        else:wk,role,ci=F[n];e={'n':n,'wom':wk}
        plan.append({'n':n,'role':role,'idx':ci,'x':820 if i==0 else 430,'y':y if i==0 else y+50,'staff':True});people.append(e)
    for j in range(nw):
        cnt+=1;pl=POOL['company' if comp else 'center'];role,idxs,fx=pl[(cnt+j)%len(pl)] if len(pl)>1 else pl[0]
        idx=idxs[(cnt*2+j)%len(idxs)];w=wom_of(role,idx,fx)
        lab=('직원' if comp else '회원')+' '+'AB'[j]
        plan.append({'n':lab,'role':role,'idx':idx,'x':[230,640][j],'y':y+[15,55][j],'staff':False})
        people.append({'n':lab,'wom':w,'wom2':alt(w),'ex':EXK[kind]})
    PLAN[rid]=plan;DEF[rid]={'lead':names[0],'people':people}
# 매점은 기존 그대로 (점원 + 서하준)
PLAN['f1-shop-2']=[{'n':'점원','role':'yoga-member','idx':0,'x':820,'y':575,'staff':True},{'n':'서하준','role':'trainer','idx':0,'x':380,'y':625,'staff':True},
 {'n':'회원 A','role':'member','idx':2,'x':230,'y':590,'staff':False}]
DEF['f1-shop-2']={'lead':'점원','people':[{'n':'점원','wom':'clerk'},{'n':'서하준'},{'n':'회원 A','wom':'aunt','wom2':'cardigan','ex':'n:lobby'}]}
# ---- script-16
s=rd('script-16.js')
a=s.find('window.CAST_PEOPLE=');e='"lead": "윤서"}};';b=s.find(e,a);assert a>0 and b>a
s=s[:a]+'window.CAST_PEOPLE='+jd(CAST_PEOPLE)+';window.CAST_WOM='+jd(CAST_WOM)+';window.PERSON_LINES='+jd(PL)+';window.CAST_DEF='+jd(DEF)+';'+s[b+len(e):]
# 함수 교체
m=re.search(r"function castKey\(r\)\{.*?\}\n",s,re.S);assert m
s=s[:m.start()]+"function castKey(r){if(!['center','company'].includes(place()))return null;return CAST_DEF[r.id]?r.id:null;}\n"+s[m.end():]
s=sub(s,"function castManSrc(name){const p=CAST_PEOPLE[name];return p&&window.DIALOGUE_MEN?.tracksuit?.[p[0]]||null;}",
 "function castManSrc(name){const p=CAST_PEOPLE[name];return p&&window.DIALOGUE_MEN?.[p[0]]?.[p[1]]||null;}\n  function castWomSrc(c,name){const d=c&&c.people.find(p=>p.n===name),k=d?.wom||CAST_WOM[name];return k&&window.DIALOGUE_WOMEN?.[k]||null;}")
m=re.search(r"function castLinesOf\(c,name,seed\)\{.*?\}\n",s,re.S);assert m
s=s[:m.start()]+("function castLinesOf(c,name,seed){const d=(c.people||[]).find(p=>p.n===name)||{n:name};"
 "if(d.ex){const sets=EXTRA_LINES[d.ex]||[];const set=sets.length?sets[Math.abs(seed)%sets.length]:null;return (set?.l||[]).map(p=>{const L=gLine(p);if(L.male)L.wom=/ B$/.test(L.speaker)?d.wom2:d.wom;return L;});}"
 "const set=gaiaPick(PERSON_LINES[name]||[],seed);return (set?.l||[]).map(gLine);}\n")+s[m.end():]
m=re.search(r"const CAST_PLAN=\{.*?\}\]\};\n",s,re.S);assert m
s=s[:m.start()]+"const CAST_PLAN="+jd(PLAN)+";\n"+s[m.end():]
s=sub(s,"window.CastPlan=(scene,r)=>{const k=castKey(r);return k?CAST_PLAN[k]:null;};","window.CastPlan=(scene,r)=>{const k=castKey(r);return k?CAST_PLAN[k]:null;};")
s=sub(s,"{const c0=roomCastFor(r);if(c0&&c0.man!=null&&A.tracksuit?.[c0.man])return A.tracksuit[c0.man];}","{const c0=roomCastFor(r);if(c0){const m0=castManSrc(c0.lead)||castWomSrc(c0,c0.lead);if(m0)return m0;}}")
s=sub(s,"wk=WOM[line.speaker]","wk=line.wom||WOM[line.speaker]")
s=sub(s,"const cm=options.castPerson&&castManSrc(options.castPerson);","const cm=options.castPerson&&(castManSrc(options.castPerson)||castWomSrc(roomCastFor(r),options.castPerson));")
wr('script-16.js',s)
print('r37 patched rooms',len(PLAN))
