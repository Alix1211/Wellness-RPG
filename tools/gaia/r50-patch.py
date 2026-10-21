#!/usr/bin/env python3
"""R50: UI 개편 — 새 UI 시트(assets/ui-v2/sheet-flower.png)로 창 틀·버튼·탭·슬롯·바 교체, 메뉴 정리.
 - 창(#panel): 꽃·리본 틀(9분할), 제목 중앙, 닫기 버튼 틀 안쪽
 - 메뉴: 캐릭터·생활·부탁·복장·음악·설정 6개 (화면 편집·복도 꾸미기·체험 설정 삭제, 기록은 생활로 합침, 저장·새 생활·전체화면은 설정으로)
usage: r50-patch.py WORKDIR REPO   (r49 위에 적용)"""
import sys,io,base64
from pathlib import Path
from PIL import Image,ImageDraw
W=Path(sys.argv[1]);R=Path(sys.argv[2])
sh=Image.open(R/'assets/ui-v2/sheet-flower.png').convert('RGBA')
def uri(im,q=88):
    b=io.BytesIO();im.save(b,'WEBP',quality=q,method=6);return 'data:image/webp;base64,'+base64.b64encode(b.getvalue()).decode()
# 누끼 정리본(assets/ui-v2/cut): 시트에서 최대 덩어리만 남기고 속·이음새를 정리한 이미지
frame=Image.open(R/'assets/ui-v2/cut/frame.png').convert('RGBA');pill1=Image.open(R/'assets/ui-v2/cut/pill1.png').convert('RGBA');pill2=Image.open(R/'assets/ui-v2/cut/pill2.png').convert('RGBA');pill3=pill2;slot=sh.crop((893,632,957,698))
V={'frame':uri(frame,92),'pill1':uri(pill1),'pill2':uri(pill2),'pill3':uri(pill3),'slot':uri(slot)}
CSS=""":root{--u2-frame:url(@@frame@@);--u2-pill1:url(@@pill1@@);--u2-pill2:url(@@pill2@@);--u2-pill3:url(@@pill3@@);--u2-slot:url(@@slot@@)}
dialog#panel{border-style:solid!important;border-color:transparent!important;border-width:60px 38px 44px!important;border-image:var(--u2-frame) 52 fill/70px/0 stretch!important;background:none!important;box-shadow:none!important;border-radius:0!important;padding:4px 8px!important;width:min(94vw,640px)!important;max-height:92dvh!important;color:#7a4a60;overflow:auto;scrollbar-width:thin}
dialog#panel.compact-menu{width:min(94vw,520px)!important}
dialog#panel h2{margin:0 0 10px!important;text-align:center;font-size:20px!important;font-weight:700;color:#8a4a68;letter-spacing:.04em}
dialog#panel h2:empty,dialog#panel:has(.profile-tabs) h2{display:none}
dialog#panel{background-color:transparent}
dialog#panel.compact-menu .panel-list{padding-top:36px!important}
dialog#panel .close{position:absolute!important;top:2px;right:6px;float:none;margin:0;float:none;width:36px;height:36px;border:2px solid #e6a24e;border-radius:50%;background:radial-gradient(circle at 35% 30%,#ffd1de,#f08aaa);color:#fff;font-size:22px;line-height:1;box-shadow:0 2px 6px #8a3f5e55;z-index:3}
dialog#panel .panel-list{gap:10px 14px}
dialog#panel.compact-menu .panel-list{display:grid;grid-template-columns:1fr 1fr}
dialog#panel .panel-button,dialog#panel:not(.compact-menu) .panel-button{box-sizing:border-box;height:46px!important;min-height:46px!important;aspect-ratio:auto!important;padding:0 8px!important;border:0 solid transparent!important;border-width:0 27px 0 26px!important;border-image:var(--u2-pill1) 0 34 0 36 fill/0 26px 0 27px stretch!important;background:none!important;background-color:transparent!important;box-shadow:none!important;color:#fff!important;font-weight:700;font-size:15px!important;text-shadow:0 1px 2px #b04a7a99;display:flex;align-items:center;justify-content:center;text-align:center;line-height:1.15}
dialog#panel .panel-button:active{filter:brightness(.94);transform:translateY(1px)}
dialog#panel .panel-button:disabled{filter:grayscale(1) brightness(1.05);opacity:.6}
dialog#panel .profile-tabs{display:flex;gap:8px;margin:0 0 8px;padding-right:44px}
dialog#panel .profile-tabs button{flex:1;box-sizing:border-box;height:42px;border:0 solid transparent!important;border-width:0 24px!important;border-image:var(--u2-pill2) 0 34 0 34 fill/0 24px 0 24px stretch!important;background:none!important;color:#fff;font-weight:700;font-size:14px;padding:0 4px;text-shadow:0 1px 2px #6a4a9a88;border-radius:0}
dialog#panel .profile-tabs button.selected{border-image:var(--u2-pill1) 0 34 0 36 fill/0 24px 0 25px stretch!important;text-shadow:0 1px 2px #b04a7a99}
dialog#panel input:not([type=range]):not([type=number]){width:100%;box-sizing:border-box;margin:0 0 4px;padding:6px 12px;border:2px solid #efc58c;border-radius:12px;background:#fffaf1;color:#7a4a60;font:inherit}
dialog#panel .stat-row{grid-template-columns:78px 1fr 46px;padding:3px 4px;font-size:15px;color:#7a4a60}
dialog#panel .stat-row progress{appearance:none;-webkit-appearance:none;height:18px;border:2px solid #e6a24e;border-radius:10px;background:#5d4141;overflow:hidden;accent-color:#f0507f}
dialog#panel .stat-row progress::-webkit-progress-bar{background:#5d4141}
dialog#panel .stat-row progress::-webkit-progress-value{background:linear-gradient(#ffb0c6,#f0507f 60%,#e03a6e);border-radius:8px}
dialog#panel .stat-row progress::-moz-progress-bar{background:linear-gradient(#ffb0c6,#f0507f 60%,#e03a6e);border-radius:8px}
dialog#panel .stat-row b{text-align:right;font-size:14px;color:#a14a72}
dialog#panel .inventory-grid{grid-template-columns:repeat(5,1fr);gap:8px}
dialog#panel .inventory-grid button{aspect-ratio:1;border:0;border-radius:0;background:var(--u2-slot) center/100% 100% no-repeat;color:#7a4a60;font-size:11px;line-height:1.2;padding:4px;word-break:keep-all}
dialog#panel .inventory-grid button:disabled{opacity:1}
dialog#panel p,dialog#panel small{color:#7a4a60}
dialog#panel .panel-list>p{margin:5px 2px}
dialog#panel .life-log{display:block;margin:2px 0;font-size:12px}
@media (max-height:460px){dialog#panel{border-width:56px 34px 40px!important;max-height:94dvh!important}dialog#panel .panel-button{height:42px!important;min-height:42px!important;font-size:14px!important}dialog#panel .inventory-grid button{font-size:10px}}
"""
for k,v in V.items():CSS=CSS.replace("@@"+k+"@@",v)
p=W/'script-16.js';s=p.read_text(encoding='utf8')
def sub(s,old,new,n=1):
    assert s.count(old)==n,(s.count(old),old[:90]);return s.replace(old,new)
# 스타일 주입 (퀘스트 규칙 앞쪽 주입과 같은 방식)
s=sub(s,"let schedKey=-1;window.__talkShot=null;","let schedKey=-1;window.__talkShot=null;document.head.append(Object.assign(document.createElement('style'),{id:'ui2Style',textContent:%s}));"%__import__('json').dumps(CSS))
# 메뉴 정리
i=s.index('function menu(){');j=s.index('function average(){')
newmenu=r"""function settingsMenu(){const p=panel('설정');button(p,'저장 내보내기',exportSave);button(p,'저장 불러오기',()=>$('#saveFile').click());button(p,'새 생활',newLifeMenu);button(p,'전체화면',()=>document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen?.());}
function menu(){const p=panel('');$('#panel').classList.add('compact-menu');button(p,'캐릭터',()=>profile());button(p,'생활',lifeJournal);button(p,'부탁',questMenu);button(p,'복장',()=>{const a=panel('복장');for(const[k,t]of Object.entries({'lavender-yoga':'센터복',office:'오피스룩',jeans:'홈웨어'}))button(a,t,()=>{world.outfit=k;save();});});button(p,'음악',bgmSettings);button(p,'설정',settingsMenu);}
"""
s=s[:i]+newmenu+s[j:]
s=sub(s,"for(const e of life.living.events.slice(0,8)){const x=document.createElement('small');x.className='life-log';x.textContent=e.day+'일 · '+e.text;p.append(x);}}",
 "for(const e of life.living.events.slice(0,8)){const x=document.createElement('small');x.className='life-log';x.textContent=e.day+'일 · '+e.text;p.append(x);}if(life.history.length){const hh=document.createElement('p');hh.textContent='미니게임 기록';p.append(hh);for(const r of life.history.slice(0,6)){const t=document.createElement('small');t.className='life-log';t.textContent=r.day+'일 · '+gameName(r.game)+' · '+r.score;p.append(t);}}}")
s=sub(s,"else{const grid=document.createElement('div');grid.className='inventory-grid';for(const skill of life.skills){const b=document.createElement('button');b.textContent=skill.name||skill;grid.append(b);}p.append(grid);}}",
 "else{if(!life.skills.length){const e=document.createElement('p');e.textContent='아직 익힌 스킬이 없습니다.';e.style.textAlign='center';p.append(e);}else{const grid=document.createElement('div');grid.className='inventory-grid';for(const skill of life.skills){const b=document.createElement('button');b.textContent=skill.name||skill;grid.append(b);}p.append(grid);}}}")
s=sub(s,"for(let i=0;i<20;i++){const item=Object.entries(life.inventory)[i]","for(let i=0;i<10;i++){const item=Object.entries(life.inventory)[i]")
p.write_text(s,encoding='utf8');print('r50 patched')
