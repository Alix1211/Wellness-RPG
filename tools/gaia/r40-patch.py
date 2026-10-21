#!/usr/bin/env python3
"""R40: 방·장소에 안 맞는 대사 걸러내기 (한번에 점검 결과). usage: r40-patch.py WORKDIR   (r39 위에 적용)
 - 인물 대사 세트에 장소 꼬리표: k=방 종류, p=c(센터)/o(회사). 맞는 세트만 뽑는다.
 - 담당 대사가 없는 방(화장실 훈련방)은 말 없이 바로 메뉴로.
 - 회사 배팅방 결과 대사의 '이안'은 '차재원'으로."""
import sys,json,re
from pathlib import Path
W=Path(sys.argv[1])
def rd(n):return (W/n).read_text(encoding='utf8')
def wr(n,s):(W/n).write_text(s,encoding='utf8')
def sub(s,old,new,n=1):
    assert s.count(old)==n,(old[:80],s.count(old));return s.replace(old,new)
def jd(o):return json.dumps(o,ensure_ascii=False,separators=(',',':'))
s=rd('script-16.js')
k='window.PERSON_LINES=';i=s.find(k)+len(k);PL,end=json.JSONDecoder().raw_decode(s[i:])
def tag(name,pred,**t):
    n=0
    for x in PL[name]:
        txt=' '.join(l[1] for l in x['l'])
        if pred(txt,x):x.update(t);n+=1
    assert n,(name,t)
# 도윤: 로비 접수 대사 전부 -> 로비에서만
tag('도윤',lambda t,x:True,k=['lobby'])
# 서하준: 단백질바 고르는 중 -> 매점에서만
tag('서하준',lambda t,x:'단백질바' in t,k=['shop'])
# 한시우: 단체방 대사는 단체방에서만
tag('한시우',lambda t,x:'단체' in t or '거울 앞 M자' in t,k=['group'])
# 유리: 처음 왔구나 줄 서 -> 센터 로비, 센터 이야기(수료증·방 번호) -> 센터에서만
tag('유리',lambda t,x:'줄 서' in t,k=['lobby'])
tag('유리',lambda t,x:('수료증' in t or '3번 방' in t) and 'k' not in x,p='c')
# 지안: 회사 이야기는 회사에서만
tag('지안',lambda t,x:any(w in t for w in ['팀장','회사 식당','복지 세션룸','결산','분기']),p='o')
s=s[:i]+jd(PL)+s[i+end:]
# 선택 규칙
s=sub(s,"const set=gaiaPick(PERSON_LINES[name]||[],seed);return (set?.l||[]).map(gLine);}",
 "const rr=room(),pl=place()==='company'?'o':'c';const sets=(PERSON_LINES[name]||[]).filter(x=>(!x.k||x.k.includes(rr.kind))&&(!x.p||x.p===pl));const set=gaiaPick(sets,seed);return (set?.l||[]).map(gLine);}")
# 담당 대사가 없으면 바로 메뉴 (화장실 훈련방)
s=sub(s,"if(!roomContext.story&&!options.castPerson)cmInit(r);","if(!roomContext.story&&(!options.castPerson||!currentLines.length))cmInit(r);")
# 회사 배팅방: 결과 대사의 담당 이름
s=sub(s,"if(pool&&pool.length)return pool[Math.floor(Math.random()*pool.length)];}","if(pool&&pool.length){let t=pool[Math.floor(Math.random()*pool.length)];if(place()==='company'&&String(rec.game)==='batting'&&Array.isArray(t))t=t.map(l=>[l[0],String(l[1]).replace(/이안/g,'차재원'),...l.slice(2)]);return t;}}")
wr('script-16.js',s)
print('r40 patched')
