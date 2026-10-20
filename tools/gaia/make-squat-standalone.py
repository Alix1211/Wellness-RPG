#!/usr/bin/env python3
"""Standalone squat test page: python3 make-squat-standalone.py WORKDIR(extracted scripts, R12) REPO_ROOT OUT.html"""
import sys,json,re,base64
from pathlib import Path
W=Path(sys.argv[1]);R=Path(sys.argv[2]);OUT=Path(sys.argv[3])
s19=(W/'script-19.js').read_text(encoding='utf8')
i=s19.index('window.GAIA_SOUND_SOURCES=')+len('window.GAIA_SOUND_SOURCES=')
srcs,_=json.JSONDecoder().raw_decode(s19[i:])
BP=R/'assets/audio/bpm'
SQ=R/'assets/audio/squat'
for k,f in [('squat90_bed','bpm090.ogg'),('squat120_bed','bpm120.ogg'),('squat150_bed','bpm150.ogg')]+[('squat%d_bgm'%b,'squat%d_bgm.ogg'%b) for b in (90,120,150)]+[('perfect_0%d'%i,'perfect_0%d.ogg'%i) for i in range(1,8)]:
    srcs[k]='data:audio/ogg;base64,'+base64.b64encode(((BP if f.startswith('bpm') else SQ)/f).read_bytes()).decode()
keep=['hit_punch','reaction_happy','reaction_surprise','reaction_whine','reaction_displeased','squat90_bed','squat120_bed','squat150_bed','squat90_bgm','squat120_bgm','squat150_bgm']+['perfect_0%d'%i for i in range(1,8)]
srcs={k:srcs[k] for k in keep}
s13=(W/'script-13.js').read_text(encoding='utf8')
j=s13.index('window.SQUAT_ART=')+len('window.SQUAT_ART=')
art,_=json.JSONDecoder().raw_decode(s13[j:])
s00=(W/'script-00.js').read_text(encoding='utf8')
def bg(name):
    m=re.search(r'"'+re.escape(name)+r'": "(data:image/(?:jpeg|webp);base64,[A-Za-z0-9+/=]+)"',s00);return m.group(1)
bgs={'yoga':bg('bg/운동실'),'office':bg('bg/company/meeting'),'jeans':bg('bg/운동실')}
doc=(R/'src/gaia-life/squat-game.html').read_text(encoding='utf8')
page=r'''<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover,user-scalable=no"><title>스쿼트 시험판</title><style>
html,body{margin:0;height:100%;background:#2a2230;font-family:system-ui,-apple-system,'Apple SD Gothic Neo','Noto Sans KR',sans-serif;color:#fff}
#menu{position:fixed;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;padding:20px;box-sizing:border-box}
h1{margin:0;font-size:28px}.row{display:flex;gap:10px;flex-wrap:wrap;justify-content:center}
button{border:0;border-radius:16px;padding:14px 20px;font:inherit;font-weight:800;font-size:17px;color:#fff;background:#8a7390}
button.on{background:#ee5f9b;box-shadow:0 0 0 3px #ffd0e6}
#go{background:#548b7a;padding:16px 46px;font-size:20px;margin-top:6px}
iframe{position:fixed;inset:0;width:100%;height:100%;border:0;background:#000}
#menu[hidden],iframe[hidden]{display:none}
small{opacity:.7}
</style></head><body>
<div id="menu"><h1>스쿼트 시험판</h1><div><small>의상</small></div><div class="row" id="o"><button data-v="yoga" class="on">요가복(센터)</button><button data-v="office">오피스(회사)</button><button data-v="jeans">청바지</button></div><div><small>난이도</small></div><div class="row" id="t"><button data-v="1" class="on">쉬움 90</button><button data-v="2">보통 120</button><button data-v="3">어려움 150</button></div><button id="go">시작</button></div>
<iframe id="f" hidden></iframe>
<script>
const DOC=__DOC__,ART=__ART__,SRC=__SRC__,BG=__BG__,FX=__FX__,BALL=__BALL__;
let outfit='yoga',tier=1;
for(const [id,set] of [['o',v=>outfit=v],['t',v=>tier=+v]])document.getElementById(id).addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;set(b.dataset.v);for(const x of document.getElementById(id).children)x.classList.toggle('on',x===b);});
function launch(){const A=ART[outfit],cfg={background:BG[outfit],squat:{difficulty:tier,front:A.front,back:A.back,fb:A.fb,bb:A.bb,ball:BALL,floor:A.floor,fx:FX}};
 const boot='<script>window.GAIA_SOUND_SOURCES='+JSON.stringify(SRC)+';<\/script>';
 const html=DOC.replace('/*LIFE_CONFIG*/',JSON.stringify(cfg).replace(/</g,'\\u003c')).replace('<meta',boot+'<meta');
 const f=document.getElementById('f');f.srcdoc=html;f.hidden=false;document.getElementById('menu').hidden=true;}
function back(){const f=document.getElementById('f');f.srcdoc='';f.hidden=true;document.getElementById('menu').hidden=false;}
document.getElementById('go').onclick=launch;
addEventListener('message',e=>{const d=e.data||{};if(d.type==='game-retry')launch();else if(d.type==='wellness-close')back();});
</script></body></html>'''
page=page.replace('__DOC__',json.dumps(doc).replace('</','<\\/')).replace('__ART__',json.dumps(art)).replace('__SRC__',json.dumps(srcs)).replace('__BG__',json.dumps(bgs)).replace('__BALL__',json.dumps('data:image/webp;base64,'+base64.b64encode((R/'assets/props/squat-object.webp').read_bytes()).decode())).replace('__FX__',json.dumps({k:'data:image/webp;base64,'+base64.b64encode((R/('assets/props/squat-fx/%s.webp'%n)).read_bytes()).decode() for k,n in [('ph','paddle-heart'),('pp','paddle-paw'),('fs','fx-slap'),('fo','fx-ouch')]}))
OUT.write_text(page,encoding='utf8');print(OUT,len(page)//1024,'KB')
