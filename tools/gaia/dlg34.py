#!/usr/bin/env python3
"""대사 문서(ROOM_DIALOGUE_v3 / DIALOGUE_FULL_3) -> 게임 데이터 JSON.  usage: dlg34.py OUT.json
 persons: 이름 -> {1..4: [ [ [화자,대사],... ], ... ]}   (stage 1 입문 2 적응 3 몰입 4 만개)
 extras : 방 키 -> [ [ [화자,대사],... ], ... ]            (조연 R1~R17)
 results: 게임키 -> {s:[ [[화자,대사],..] ], f:[...]}
 story  : M01.. -> {title, place, stage, lines}
 home   : 키 -> [ [[화자,대사],..] ]"""
import re,sys,json
from pathlib import Path
D=Path('/home/claude/wellness-rpg/docs/gaia')
STAGE={'입문':1,'적응':2,'몰입':3,'만개':4}
SPK=re.compile(r'^([가-힣A-Za-z0-9]{1,6}(?: ?[가-힣A-Z0-9]{1,3})?): (.+)$')
BLK=re.compile(r'^\*\*([^*]+)\*\*\s*(.*)$')
def parse_blocks(lines):
    """-> list of (label, [[spk,text],...]) ; label = text between ** **"""
    out=[];cur=None
    for raw in lines:
        t=raw.rstrip()
        if not t.strip():
            continue
        m=BLK.match(t)
        if m:
            cur=[m.group(1).strip(),[]];out.append(cur)
            rest=m.group(2).strip()
            if rest:
                m2=SPK.match(rest)
                if m2:cur[1].append([m2.group(1),m2.group(2)])
            continue
        if t.startswith('#') or t.startswith('---'):
            cur=None;continue
        if cur is None:continue
        m2=SPK.match(t)
        if m2:cur[1].append([m2.group(1),m2.group(2)])
    return [(a,b) for a,b in out if b]
def sections(text):
    """split by '## ' headings -> list of (heading, [lines], top) top=nearest '# ' heading"""
    res=[];top='';head=None;buf=[]
    for ln in text.split('\n'):
        if ln.startswith('# '):
            if head is not None:res.append((head,buf,toph))
            head=None;buf=[];top=ln[2:].strip();continue
        if ln.startswith('## '):
            if head is not None:res.append((head,buf,toph))
            head=ln[3:].strip();buf=[];toph=top;continue
        if head is not None:buf.append(ln)
    if head is not None:res.append((head,buf,toph))
    return res
def main(out):
    v3=(D/'ROOM_DIALOGUE_v3.md').read_text(encoding='utf8')
    f3=(D/'DIALOGUE_FULL_3.md').read_text(encoding='utf8')
    data={'persons':{},'extras':{},'results':{},'story':{},'home':{},'kinds':{}}
    # ---- v3
    for head,buf,top in sections(v3):
        if top.startswith('센터') or top.startswith('회사'):
            name=head.split(' · ')[0].strip()
            n=0
            for lab,ls in parse_blocks(buf):
                st=None
                for k,v in STAGE.items():
                    if k in lab:st=v
                n+=1
                if st is None:
                    st=min(n,4)   # 단계 표기 없는 인물(유리·송 회장·오 부장·지안·건우)은 순서대로 1~4
                data['persons'].setdefault(name,{}).setdefault(str(st),[]).append(ls)
        elif top.startswith('방마다'):
            data['extras'].setdefault(head,[])
            for lab,ls in parse_blocks(buf):data['extras'][head].append(ls)
        elif top.startswith('게임'):
            key=head
            bl=parse_blocks(buf)
            cur=None
            d=data['results'].setdefault(key,{'s':[],'f':[]})
            # blocks '**성공**'/'**실패**' with following 주인공 line captured by parser
            for lab,ls in bl:
                if lab.startswith('성공'):d['s'].append(ls)
                elif lab.startswith('실패'):d['f'].append(ls)
    # ---- FULL_3: A story / B home
    for head,buf,top in sections(f3):
        m=re.match(r'^(M\d\d) (.+?) · (.+?) \[(.+?)\]$',head)
        if m:
            ls=[]
            for t in buf:
                t=t.rstrip()
                if not t or t.startswith('#') or t.startswith('---'):continue
                m2=SPK.match(t)
                if m2:ls.append([m2.group(1),m2.group(2)])
            data['story'][m.group(1)]={'title':m.group(2),'place':m.group(3),'stage':STAGE[m.group(4)],'lines':ls}
        elif top.startswith('B.') :
            for lab,ls in parse_blocks(buf):
                data['home'].setdefault(head,{})[lab]=ls
    # ---- 4권: A 빠진 단계 / B 3인방
    f4=(D/'DIALOGUE_FULL_4.md').read_text(encoding='utf8')
    for head,buf,top in sections(f4):
        if top.startswith('A.') or top.startswith('B.'):
            name=re.split(r' [(·]',head)[0].strip()
            for lab,ls in parse_blocks(buf):
                st=None
                for k,v in STAGE.items():
                    if k in lab:st=v
                who=name
                if '추가' in head:
                    st=4;who=ls[0][0]
                if st is None:continue
                data['persons'].setdefault(who,{}).setdefault(str(st),[]).append(ls)
    # ---- 5권: A 조교 방문 / B 회사 방문 -> visit
    f5=(D/'DIALOGUE_FULL_5.md').read_text(encoding='utf8')
    data['visit']={}
    for head,buf,top in sections(f5):
        if top.startswith('A.') or top.startswith('B.'):
            name=re.split(r' [(·]',head)[0].strip()
            for lab,ls in parse_blocks(buf):
                st=None
                for k,v in STAGE.items():
                    if k in lab:st=v
                if st is None:continue
                data['visit'].setdefault(name,{}).setdefault(str(st),[]).append(ls)
    json.dump(data,open(out,'w',encoding='utf8'),ensure_ascii=False)
    print('persons',{k:{s:len(v) for s,v in d.items()} for k,d in data['persons'].items()})
    print('extras',{k:len(v) for k,v in data['extras'].items()})
    print('results',{k:(len(v['s']),len(v['f'])) for k,v in data['results'].items()})
    print('visit',{k:{s:len(v) for s,v in d.items()} for k,d in data['visit'].items()})
    print('story',len(data['story']),'home',{k:list(v) for k,v in data['home'].items()})
main(sys.argv[1])
