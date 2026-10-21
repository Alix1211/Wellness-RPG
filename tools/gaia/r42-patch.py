#!/usr/bin/env python3
"""R42: 거리 행인(얼굴 없는 NPC 서 있는 자세 8명)을 건물 옆에 장식용으로 배치. usage: r42-patch.py WORKDIR REPO (r41 위에 적용)
 기능 없음(마크·대화·이벤트 없음). 건물 종류에 어울리는 인물만, 억지 배치 없음. 방망이 빨강 트레이닝복은 거리 이벤트용이라 행인에서 제외."""
import sys,io,base64,json
from pathlib import Path
from PIL import Image
W=Path(sys.argv[1]);R=Path(sys.argv[2])
D=R/'assets/characters/npcs/standing'
names=['auntie_bag','apron_green','uniform_blue','yoga_white_paddle','hoodie_youth','suit_black','elder_jacket']
art={}
for n in names:
    im=Image.open(D/(n+'.png')).convert('RGBA');h=340;im=im.resize((round(im.width*h/im.height),h),Image.LANCZOS)
    b=io.BytesIO();im.save(b,'WEBP',quality=88,method=6);art[n]='data:image/webp;base64,'+base64.b64encode(b.getvalue()).decode()
s=(W/'script-16.js').read_text(encoding='utf8')
def sub(s,o,n,c=1):
    assert s.count(o)==c,(o[:70],s.count(o));return s.replace(o,n)
block=("const STREET_PEDS=(()=>{const A="+json.dumps(art,ensure_ascii=False,separators=(',',':'))+";const o={};for(const k of Object.keys(A)){const i=new Image();i.src=A[k];o[k]=i;}return o;})();"
"const STREET_PED_FIT={centerGate:['yoga_white_paddle'],companyGate:['suit_black'],cafe:['hoodie_youth','auntie_bag'],store:['apron_green','uniform_blue','auntie_bag'],market:['apron_green','uniform_blue','auntie_bag'],park:['elder_jacket','auntie_bag'],book:['hoodie_youth','elder_jacket'],bus:['elder_jacket','suit_black','hoodie_youth']};"
"function drawStreetPed(r,i){const fit=STREET_PED_FIT[r.kind];if(!fit)return;const k=fit[(i*7+3)%fit.length],im=STREET_PEDS[k];if(!im||!im.complete||!im.naturalWidth)return;const side=i%2?1:-1,h=170,w=h*im.naturalWidth/im.naturalHeight,x=r.x+side*175,y=592;ctx.save();ctx.translate(x,y);ctx.fillStyle='#442a3925';ctx.beginPath();ctx.ellipse(0,1,w*.32,6,0,0,Math.PI*2);ctx.fill();if(i%3===0)ctx.scale(-1,1);ctx.drawImage(im,-w/2,-h,w,h);ctx.restore();}\n")
s=sub(s,"function drawStreet(){",block+"function drawStreet(){")
s=sub(s,"ctx.drawImage(im,r.x-w/2,450-h,w,h);}box(r.x-110","ctx.drawImage(im,r.x-w/2,450-h,w,h);}drawStreetPed(r,i);box(r.x-110")
(W/'script-16.js').write_text(s,encoding='utf8');print('r42 patched',{k:len(v) for k,v in art.items()})
# (R42 추가 직접 수정) drawStreet 말풍선: 거리 건물에 전용 대사가 없으면 센터 로비 대사를 빌려 쓰지 않는다
