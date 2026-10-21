#!/usr/bin/env python3
"""R36: usage r36-patch.py WORKDIR REPO_ROOT   (r34/r35 위에 적용)
 1) 남성 초상화·거리 남성/주인공 포즈를 원본 해상도로 교체 (예전 0.6/0.55배 축소 제거)
 2) 방 대사에서 조연(R1~R17)을 빼고 방 담당 인물만 말하게 함. 조연 대사는 EXTRA_LINES로 따로 보관(걸어 다니는 조연용)"""
import sys,json,re,base64
from pathlib import Path
W=Path(sys.argv[1]);R=Path(sys.argv[2])
def rd(n):return (W/n).read_text(encoding='utf8')
def wr(n,s):(W/n).write_text(s,encoding='utf8')
def sub(s,old,new,n=1):
    assert s.count(old)==n,(old[:80],s.count(old));return s.replace(old,new)
def jd(o):return json.dumps(o,ensure_ascii=False,separators=(',',':'))
def url(p):return 'data:image/webp;base64,'+base64.b64encode(p.read_bytes()).decode()
D=R/'assets/characters/dialogue-men';E=R/'assets/characters/encounter'
# ---- 1) 이미지
cnt={'suit':12,'tracksuit':12,'casual':8}
art='window.DIALOGUE_MEN={'+','.join(k+':['+','.join(json.dumps(url(D/('%s_%02d.webp'%(k,i)))) for i in range(1,c+1))+']' for k,c in cnt.items())+'};\n'
OUT=['jeans','office','lavender-yoga']
cast='window.CAST_ART={men:['+','.join(json.dumps(url(E/('man_%02d.webp'%i))) for i in range(1,11))+'],hero:{'+','.join(json.dumps(o)+':{'+','.join('%s:%s'%(p,json.dumps(url(E/('hero_%s_%s.webp'%(o,p))))) for p in ['bow','pray','surprised','kneel','run'])+'}' for o in OUT)+'}};\n'
s=rd('script-13.js')
a=s.find('window.DIALOGUE_MEN=');b=s.find('};\n',a)+3
assert a>0 and b>a
s=s[:a]+art+s[b:]
a=s.find('window.CAST_ART=');b=s.find('}};\n',a)+4
assert a>0 and b>a
s=s[:a]+cast+s[b:]
# 거리 남성/주인공 크기 기준: 예전 0.55배 이미지 기준 511px -> 원본 해상도 기준 929px (화면 크기는 그대로)
s=sub(s,'/511*','/929*')
wr('script-13.js',s)
# ---- 2) 조연 분리
s=rd('script-05.js')
key='const ORIGINAL_DIALOGUE=';i=s.find(key);j=i+len(key)
obj,end=json.JSONDecoder().raw_decode(s[j:])
extra={}
for k,v in obj.items():
    if k.startswith(('n:','o:')):
        keep=[x for x in v if x.get('s')]
        extra[k]=[x for x in v if not x.get('s')]
        obj[k]=keep
s=s[:j]+jd(obj)+s[j+end:]
s=sub(s,key,'const EXTRA_LINES='+jd(extra)+';'+key)
wr('script-05.js',s)
print('r36 patched; extra kept for',{k:len(v) for k,v in extra.items() if v})
