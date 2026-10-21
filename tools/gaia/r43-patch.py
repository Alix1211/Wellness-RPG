#!/usr/bin/env python3
"""R43: 얼굴 없는 NPC 24명(서 있는 15 + 기어가기 여성 8 + 위 7명 중복 없이)을 거리·센터·회사 복도에 장식 배치. usage: r43-patch.py WORKDIR REPO (r42 위에 적용)
 장식 전용(마크·대화·이벤트 없음). 장소에 어울리는 인물만, 빨강 방망이 트레이닝복은 거리 이벤트용이라 제외."""
import sys,io,base64,json,re
from pathlib import Path
from PIL import Image
W=Path(sys.argv[1]);R=Path(sys.argv[2]);D=R/'assets/characters/npcs/standing'
STAND=['auntie_bag','apron_green','uniform_blue','yoga_white_paddle','hoodie_youth','suit_black','elder_jacket','m_sweater_fat','m_tracksuit_olive_whip','m_blazer_navy','m_tracksuit_green','m_tracksuit_purple','m_tracksuit_navy','m_tracksuit_orange']
CRAWL=['w_office_brown_black','w_office_bun_green','w_office_pony_blue','w_office_curly_floral','w_yoga_blonde_white','w_yoga_bob_purple','w_yoga_pony_purple','w_yoga_bun_black']
art={}
for n,h in [(x,340) for x in STAND]+[(x,260) for x in CRAWL]:
    im=Image.open(D/(n+'.png')).convert('RGBA');im=im.resize((round(im.width*h/im.height),h),Image.LANCZOS)
    b=io.BytesIO();im.save(b,'WEBP',quality=86,method=6);art[n]='data:image/webp;base64,'+base64.b64encode(b.getvalue()).decode()
s=(W/'script-16.js').read_text(encoding='utf8')
a=s.index('const STREET_PEDS=(()=>');b=s.index('function drawStreet(){')
code=("const DECOR_IMG=(()=>{const A="+json.dumps(art,ensure_ascii=False,separators=(',',':'))+";const o={};for(const k of Object.keys(A)){const i=new Image();i.src=A[k];o[k]=i;}return o;})();\n"
"const DECOR_STREET_FIT={centerGate:['yoga_white_paddle','m_tracksuit_olive_whip'],companyGate:['suit_black','m_blazer_navy'],cafe:['hoodie_youth','auntie_bag'],store:['apron_green','uniform_blue','auntie_bag'],market:['apron_green','uniform_blue','auntie_bag'],park:['elder_jacket','auntie_bag','m_sweater_fat'],book:['hoodie_youth','elder_jacket','m_sweater_fat'],bus:['elder_jacket','suit_black','hoodie_youth','m_blazer_navy']};\n"
"const DECOR_CENTER={stand:['m_tracksuit_green','m_tracksuit_purple','m_tracksuit_navy','m_tracksuit_orange','m_tracksuit_olive_whip','yoga_white_paddle'],crawl:['w_yoga_blonde_white','w_yoga_bob_purple','w_yoga_pony_purple','w_yoga_bun_black']};\n"
"const DECOR_COMPANY={stand:['suit_black','m_blazer_navy','m_sweater_fat','elder_jacket'],crawl:['w_office_brown_black','w_office_bun_green','w_office_pony_blue','w_office_curly_floral']};\n"
"function decorPut(k,x,i,flip,crawl){const im=DECOR_IMG[k];if(!im||!im.complete||!im.naturalWidth)return;const h=crawl?118:170,w=h*im.naturalWidth/im.naturalHeight,y=crawl?596:592;ctx.save();ctx.translate(x,y);ctx.fillStyle='#442a3925';ctx.beginPath();ctx.ellipse(0,1,w*(crawl?.38:.32),6,0,0,Math.PI*2);ctx.fill();if(flip)ctx.scale(-1,1);ctx.drawImage(im,-w/2,-h,w,h);ctx.restore();}\n"
"function drawStreetPed(r,i){const fit=DECOR_STREET_FIT[r.kind];if(fit)decorPut(fit[(i*7+3)%fit.length],r.x+(i%2?1:-1)*175,i,i%3===0,false);const ps=floor().rooms;if(i<ps.length-1&&r.kind!=='homeGate'){const pool=(i%2)?DECOR_COMPANY.crawl:DECOR_CENTER.crawl;decorPut(pool[(i*5+1)%pool.length],r.x+(ps[i+1].x-r.x)*.52,i,i%2===0,true);}}\n"
"function drawCorridorDecor(){const f=floor();if(f.place!=='center'&&f.place!=='company')return;const P=f.place==='company'?DECOR_COMPANY:DECOR_CENTER,fi=M.FLOORS.indexOf(f),v=view();const rs=f.rooms||[];for(let i=0;i<rs.length;i++){const r=rs[i];if(r.x<v.cam-300||r.x>v.cam+v.width+300)continue;const sd=(fi*3+i)%2?1:-1;if(((fi+i)%3)!==2)decorPut(P.stand[(fi*5+i*3)%P.stand.length],r.x+sd*190,i,(fi+i)%2===0,false);if(i<rs.length-1&&((fi*2+i)%3)!==1)decorPut(P.crawl[(fi*3+i*7)%P.crawl.length],r.x+(rs[i+1].x-r.x)*.55,i,(fi+i)%2===1,true);}}\n")
s=s[:a]+code+s[b:]
# 복도: 기존 drawCorridor 뒤에 장식을 덧그린다
o="function drawCorridor(){"
assert s.count(o)==1
s=s.replace(o,"function drawCorridor(){_drawCorridor();drawCorridorDecor();}\nfunction _drawCorridor(){")
(W/'script-16.js').write_text(s,encoding='utf8');print('r43 patched',len(art),'images')
