#!/usr/bin/env python3
"""R45: 센터 전면 개편 — 2D 단면(횡스크롤) 5층, 구역별 NPC, 말걸기→블러 대화창, 머리 위 퀘스트 마커, 유리/지안 시간대별 한 곳.
usage: r45-patch.py WORKDIR REPO   (r44 위에 적용)
층↔그림: 1F=2,3 / 2F=4,1 / 3F=9,7 / 4F=8,10 / 5F=6,5  (각 그림을 가운데에서 둘로 나눠 한 층 4구역)"""
import sys,io,base64,json
from pathlib import Path
import numpy as np
from PIL import Image
from scipy import ndimage
W=Path(sys.argv[1]);R=Path(sys.argv[2]);D=R/'assets/floors-v2'
T_STORE,T_DRAW,FL_Y,BAY=560,600,100,360
FLOOR_STRIPS=[[2,3],[4,1],[9,7],[8,10],[6,5]]
# ---------- 그림 처리 ----------
strips={};info={}
for i in range(1,11):
    im=Image.open(D/f'strip_{i:02d}.png').convert('RGB');a=np.asarray(im).astype(int)
    nw=a.sum(2)<740;ys=np.where(nw.any(1))[0];y0,y1=ys.min(),ys.max()+1
    c=im.crop((0,y0,im.width,y1));h=y1-y0
    ws=round(im.width*T_STORE/h);c2=c.resize((ws,T_STORE),Image.LANCZOS)
    b=io.BytesIO();c2.save(b,'WEBP',quality=82,method=6)
    strips[i]='data:image/webp;base64,'+base64.b64encode(b.getvalue()).decode()
    top=np.asarray(c2)[:3].reshape(-1,3).mean(0).astype(int);bot=np.asarray(c2)[-3:].reshape(-1,3).mean(0).astype(int)
    info[i]={'w':round(ws*T_DRAW/T_STORE),'h':h,'tc':'#%02x%02x%02x'%tuple(top),'bc':'#%02x%02x%02x'%tuple(bot),'kb':len(b.getvalue())//1024}
print({k:(v['w'],v['kb']) for k,v in info.items()})
# 엘리베이터(투명 PNG): 바깥 잡티 제거 후 작게
E=Image.open(D/'elevator.png').convert('RGBA');ea=np.asarray(E).copy()
lab,n=ndimage.label(ea[...,3]>40);big=np.argmax(ndimage.sum(np.ones_like(lab),lab,range(1,n+1)))+1
ea[...,3]=np.where(lab==big,ea[...,3],0);E=Image.fromarray(ea)
EH=520;E=E.resize((round(E.width*EH/E.height),EH),Image.LANCZOS);b=io.BytesIO();E.save(b,'WEBP',quality=90,method=6)
elev='data:image/webp;base64,'+base64.b64encode(b.getvalue()).decode();print('elevator',E.size,len(b.getvalue())//1024,'KB')
layout=[[ {'k':'s%02d'%s,'w':info[s]['w'],'tc':info[s]['tc'],'bc':info[s]['bc']} for s in fs] for fs in FLOOR_STRIPS]
DOOR=round(330*T_DRAW/info[2]['h'])  # 1층 첫 그림의 현관문 중심(원본 x=330)
# ---------- script-07: 층 구조 ----------
p7=W/'script-07.js';s=p7.read_text(encoding='utf8')
def sub(s,old,new,n=1):
    assert s.count(old)==n,(s.count(old),old[:90]);return s.replace(old,new)
i=s.index("const FLOORS=specs.map(");j=s.index("\n",i)
ZONES=[
 ['로비 · 편의시설',[['lobby','현관','f1-lobby-1'],['lobby','로비','f1-lobby-2'],['shop','매점','f1-shop-2'],['recovery','휴게실','f1-recovery-3']]],
 ['기초 훈련층',[['basic','기초반 A','f2-basic-1'],['basic','기초반 B','f2-basic-3'],['toilet','화장실','f2-toilet-4'],['recovery','휴게실','f2-recovery-5']]],
 ['기구 훈련층',[['gear','기구방 A','f3-gear-1'],['gear','기구방 B','f3-gear-2'],['gear','기구방 C','f3-gear-3'],['recovery','휴게실','f3-recovery-4']]],
 ['단체 · 요가층',[['group','단체방 A','f4-group-1'],['group','단체방 B','f4-group-3'],['posture','요가방 A','f4-posture-3'],['posture','요가방 B','f4-posture-4']]],
 ['집중 훈련층',[['punish','통창방 A','f6-punish-1'],['punish','통창방 B','f6-punish-2'],['toilet','화장실','f5-toilet-3'],['recovery','휴게실','f5-recovery-4']]]]
new=("const FL_BAY=%d,FL_ZONES=%s,FL_STRIPW=%s;\n"%(BAY,json.dumps(ZONES,ensure_ascii=False),json.dumps([[x['w'] for x in fl] for fl in layout]))+
"const FLOORS=FL_ZONES.map(([name,zs],fi)=>{let x=FL_BAY;const ws=FL_STRIPW[fi];const rooms=zs.map(([kind,nm,id],i)=>{const zw=ws[i>>1]/2,x0=x;x+=zw;return {id,kind,number:`${fi+1}${String(i+1).padStart(2,'0')}`,x:Math.round((x0+x)/2),x0:Math.round(x0),x1:Math.round(x),...TYPES[kind],name:nm,entry:fi===0&&i===0};});return {number:fi+1,name,width:Math.round(FL_BAY+ws[0]+ws[1]),bay:FL_BAY,rooms};});\n"
"FLOORS.push({number:6,name:'(미사용)',width:1280,rooms:[]});FLOORS[0].doorX=FL_BAY+%d;"%DOOR)
s=s[:i]+new+s[j:]
s=sub(s,"FLOORS.forEach(f=>f.place='center');","FLOORS.forEach(f=>f.place='center');FLOORS[5].place='unused';")
s=sub(s,"if(scene.type==='corridor')return {left:60,right:FLOORS[scene.floor].width-60,top:443,bottom:672};","if(scene.type==='corridor'){const cf=FLOORS[scene.floor],ct=cf.place==='center';return {left:60,right:cf.width-60,top:ct?575:443,bottom:ct?650:672};}")
s=sub(s,"const api={TYPES,FLOORS,","const api={BAY:FL_BAY,TYPES,FLOORS,")
p7.write_text(s,encoding='utf8')
# ---------- script-08: 구역 NPC ----------
p8=W/'script-08.js';s=p8.read_text(encoding='utf8')
s=sub(s,"Math.max(b.left,x-(corridor?240:140)),right:Math.min(b.right,x+(corridor?240:140))","Math.max(b.left,x-(corridor?(f.place==='center'?100:240):140)),right:Math.min(b.right,x+(corridor?(f.place==='center'?100:240):140))")
s=sub(s,"  if(scene.floor%3===0)add(pick(men,scene.floor),1720,571,2);",
"  if(f.place==='center'){f.rooms.forEach((r,zi)=>{const plan=root.CastPlan?.(scene,r);if(!plan)return;const lead=root.CastLead?.(r);plan.forEach((p,i)=>{const w=Math.max(200,r.x1-r.x0-200),x=r.x0+100+M.clamp((p.x-120)/1000,0,1)*w,y=592+M.clamp((p.y-555)/80,0,1)*26;add(pool(p.role)[p.idx],x,y,zi*10+i,!!p.staff,p.n);const n=list[list.length-1];n.zone=zi;n.zkind=r.kind;n.lead=!!p.n&&p.n===lead;});});}\n  else if(scene.floor%3===0)add(pick(men,scene.floor),1720,571,2);")
s=sub(s,".includes(window.GameHost?.room()?.kind);const index",".includes(n.zkind||window.GameHost?.room()?.kind);const index")
s=sub(s,"if(a.kind==='pose')return a.frames[n.mode==='pose'?1:0];","if(a.kind==='pose')return a.frames[n.mode==='pose'&&a.role!=='boss'?1:0];")
p8.write_text(s,encoding='utf8')
# ---------- script-18: 스튜디오가 쓰는 옛 방 id 고정 ----------
p18=W/'script-18.js';s=p18.read_text(encoding='utf8')
s=sub(s,"const games=[[0,3,0],[1,9,3],[2,4,0],[3,5,0],[4,5,1],[5,1,0],['water',0,4],['rope',2,0],['cylinder',7,0]].map(([kind,f,r])=>({kind,id:CenterModel.FLOORS[f].rooms[r].id}));","const games=[[0,'f4-group-1'],[1,'home-homeBedroom'],[2,'f5-posture-1'],[3,'f6-punish-1'],[4,'f6-punish-2'],[5,'f2-basic-1'],['water','f1-toilet-5'],['rope','f3-gear-1'],['cylinder','company-f2-sharedOffice-1']].map(([kind,id])=>({kind,id}));")
p18.write_text(s,encoding='utf8')
# ---------- script-12: 스튜디오 레이아웃이 배경을 덮어쓰지 않게 ----------
p12=W/'script-12.js';s=p12.read_text(encoding='utf8')
s=sub(s,"if(c)el.style.backgroundImage=`url(\"${ART['bg/'+c.r.bg]}\")`;","if(c){el.style.backgroundImage=`url(\"${window.__talkShot||ART['bg/'+c.r.bg]}\")`;el.classList.toggle('shot',!!window.__talkShot);}")
p12.write_text(s,encoding='utf8')
# ---------- script-16 ----------
p=W/'script-16.js';s=p.read_text(encoding='utf8')
# (1) 배역 별칭 + 시간대 일정
k=s.index('const CAST_PLAN=');d=0;q=k+len('const CAST_PLAN=')
while True:
    c=s[q]
    if c in '{[':d+=1
    elif c in '}]':
        d-=1
        if d==0:break
    q+=1
q=s.index(';',q)+1
alias={'f1-lobby-2':None,'f2-recovery-5':'f1-recovery-4','f3-recovery-4':'f1-recovery-4','f4-posture-3':'f5-posture-2','f4-posture-4':'f5-posture-1','f5-toilet-3':'f5-toilet-4','f5-recovery-4':'f6-recovery-4'}
code=("\nfor(const[n,o]of Object.entries(%s)){if(o){CAST_DEF[n]=CAST_DEF[o];CAST_PLAN[n]=CAST_PLAN[o];}}\n"%json.dumps(alias,ensure_ascii=False)+
"CAST_DEF['f1-lobby-2']={lead:'윤서',people:[{n:'윤서'}]};CAST_PLAN['f1-lobby-2']=[{n:'윤서',role:'trainer',idx:4,x:820,y:567,staff:true},{n:'',role:'member',idx:3,x:300,y:590,staff:false}];\n"
"{const IDX={'서하준':0,'이안':3,'윤서':4,'도윤':5,'한시우':6,'정민호':7,'오 선생':8};for(const[id,nm]of Object.entries({'f2-basic-3':'이안','f3-gear-3':'한시우','f4-group-3':'서하준','f4-posture-3':'윤서','f4-posture-4':'이안','f6-punish-2':'한시우'})){const d=JSON.parse(JSON.stringify(CAST_DEF[id])),pl=JSON.parse(JSON.stringify(CAST_PLAN[id])),o=d.lead;d.lead=nm;d.people=d.people.map(x=>x.n===o?{...x,n:nm}:x);for(const x of pl)if(x.n===o){x.n=nm;x.idx=IDX[nm];}CAST_DEF[id]=d;CAST_PLAN[id]=pl;}}\n"
"const SCHED_NAMES=['유리','지안','오 부장'];\n"
"function schedZone(name,r){const pl=M.FLOORS.find(f=>f.rooms.includes(r))?.place,cand=[];for(const f of M.FLOORS){if(f.place!==pl)continue;for(const z of f.rooms){const d=CAST_DEF[z.id];if(d&&d.people.some(p=>p.n===name))cand.push(z.id);}}if(!cand.length)return r.id;let h=(life.day*131+life.slot*17+12345)>>>0;for(const ch of name)h=(Math.imul(h,31)+ch.charCodeAt(0))>>>0;h=Math.imul(h^(h>>>15),2246822519)>>>0;return cand[(h>>>7)%cand.length];}\n"
"window.CastPlan=(scene,r)=>{const k=castKey(r);const pl=k?CAST_PLAN[k]:null;if(!pl)return pl;const lead=CAST_DEF[k].lead;return pl.filter(p=>p.n===lead||!SCHED_NAMES.includes(p.n)||schedZone(p.n,r)===r.id);};\n"
"window.CastLead=r=>{const k=castKey(r);return k?CAST_DEF[k].lead:null;};\n")
s=s[:q]+code+s[q:]
s=sub(s,"window.CastPlan=(scene,r)=>{const k=castKey(r);return k?CAST_PLAN[k]:null;};","")
# (2) 그리기 / 상호작용 코드 묶음
js=("const FLOORIMG=(()=>{const A=%s;const o={};for(const k of Object.keys(A)){const i=new Image();i.src=A[k];o[k]=i;}return o;})();\n"%json.dumps({'s%02d'%i:strips[i] for i in strips},separators=(',',':'))+
"const ELEV_IMG=(()=>{const i=new Image();i.src=%s;return i;})();\n"%json.dumps(elev)+
"const FL_LAYOUT=%s,FL_Y=%d,FL_T=%d;\n"%(json.dumps(layout),FL_Y,T_DRAW)+
r"""let schedKey=-1;window.__talkShot=null;
document.head.append(Object.assign(document.createElement('style'),{textContent:'#roomBackground.shot{filter:blur(13px) brightness(.93);transform:scale(1.08)}@media (orientation:portrait){#roomScene #malePortrait{width:auto!important;height:76%!important;top:auto!important;bottom:0!important}}'}));
function drawLift(f){const im=ELEV_IMG;if(!im.complete||!im.naturalWidth)return;const h=440,w=h*im.naturalWidth/im.naturalHeight,x=(f.bay-w)/2,y=652-h,k=w/im.naturalWidth;ctx.drawImage(im,x,y,w,h);const open=liftState?.open||0;const u=im.naturalWidth/1086;
 const dx0=x+245*u*k,dx1=x+840*u*k,dy0=y+345*u*k,dy1=y+1285*u*k;
 if(open>.01){const g=ctx.createLinearGradient(0,dy0,0,dy1);g.addColorStop(0,'#fff0f2');g.addColorStop(1,'#f2c3cb');ctx.fillStyle=g;ctx.fillRect(dx0,dy0,dx1-dx0,dy1-dy0);const mid=(dx0+dx1)/2,pw=(mid-dx0)*(1-open);if(pw>1){ctx.drawImage(im,245*u,345*u,543*u-245*u,940*u,dx0,dy0,pw,dy1-dy0);ctx.drawImage(im,543*u,345*u,840*u-543*u,940*u,dx1-pw,dy0,pw,dy1-dy0);}}
 const bx=x+435*u*k,by=y+172*u*k,bw=225*u*k,bh=92*u*k;ctx.fillStyle='#5f3f4d';ctx.beginPath();ctx.roundRect(bx,by,bw,bh,8);ctx.fill();ctx.fillStyle='#ffc9d8';ctx.font='700 '+Math.round(bh*.62)+'px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('▲ '+f.number,bx+bw/2,by+bh/2+1);ctx.textBaseline='alphabetic';}
function drawCenterFloor(){const f=floor(),fi=M.FLOORS.indexOf(f),L=FL_LAYOUT[fi];if(!L)return;const v=view();
 ctx.fillStyle='#f0a9b7';ctx.fillRect(0,0,f.width,H);
 const wall=ctx.createLinearGradient(0,FL_Y,0,FL_Y+FL_T);wall.addColorStop(0,'#c98a96');wall.addColorStop(1,'#b87884');ctx.fillStyle=wall;ctx.fillRect(0,FL_Y,f.bay,FL_T);
 ctx.fillStyle='#f3c8cf';ctx.fillRect(0,FL_Y+FL_T*.78,f.bay,FL_T*.16);ctx.fillStyle='#d79aa4';ctx.fillRect(0,FL_Y+FL_T*.94,f.bay,FL_T*.06);
 let x=f.bay;for(const s of L){const im=FLOORIMG[s.k];if(x+s.w>=v.cam-20&&x<=v.cam+v.width+20){ctx.fillStyle=s.tc;ctx.fillRect(x,0,s.w,FL_Y+2);ctx.fillStyle=s.bc;ctx.fillRect(x,FL_Y+FL_T-2,s.w,H-FL_Y-FL_T+2);if(im&&im.complete&&im.naturalWidth)ctx.drawImage(im,x,FL_Y,s.w,FL_T);}x+=s.w;}
 drawLift(f);
 for(const r of f.rooms){if(r.x<v.cam-300||r.x>v.cam+v.width+300||r.entry&&false)continue;box(r.x-74,112,148,28,12,'#fff5e8e0');text(r.name,r.x,131,16,'#79516a');}
 if(world.scene.floor===0){const dx=f.doorX;if(dx>v.cam-100&&dx<v.cam+v.width+100){text('▲ 거리',dx,FL_Y+FL_T*.26,15,'#79516a');}}}
function ensureSceneValid(){const s=world.scene,f=M.FLOORS[s.floor];if(!f||f.place==='unused'){M.changeFloor(world,0);return;}if(f.place==='center'&&(s.type==='room'||!f.rooms[s.room])){world.scene={type:'corridor',floor:s.floor,room:0};world.player.x=220;world.player.y=600;world.target=null;world.camera=0;}}
function schedTick(){const k=life.day*100+life.slot;if(k!==schedKey){if(schedKey!==-1)CenterLife.cache.clear();schedKey=k;}}
function liftHidden(){const l=liftState;return !!l&&(l.phase==='choosing'||(l.phase==='closing'&&l.open<.6)||(l.phase==='arrive'&&l.open<.3));}
function drawQuestMarks(){if(world.scene.type!=='corridor'||place()!=='center')return;const f=floor();for(const n of CenterLife.get(world.scene)){if(n.zone==null||!n.lead)continue;const r=f.rooms[n.zone];if(r.entry||!questSignal(r))continue;ctx.save();ctx.translate(n.x,n.y-236+Math.sin(time*4+n.zone)*6);ctx.fillStyle='#ef75aa';ctx.strokeStyle='#fff';ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,17,0,6.283);ctx.fill();ctx.stroke();ctx.fillStyle='#fff';ctx.font='700 24px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('!',0,1);ctx.restore();}}
function captureBg(){try{window.__noActors=true;render();const d=canvas.width/innerWidth,v=view(),y0=Math.max(0,Math.round(v.y*d)),h=Math.min(canvas.height-y0,Math.round(H*v.s*d)),c=document.createElement('canvas');c.width=canvas.width;c.height=h;c.getContext('2d').drawImage(canvas,0,y0,canvas.width,h,0,0,canvas.width,h);const u=c.toDataURL('image/jpeg',.72);window.__noActors=false;render();return u;}catch(e){window.__noActors=false;console.error('captureBg',e&&e.message);return null;}}
function talkTo(n){if(mode!=='field')return false;world.scene.room=n.zone;const r=floor().rooms[n.zone];window.__talkShot=captureBg();openRoom(r,{castPerson:n.name});return true;}
function talkNear(){const p=world.player,list=CenterLife.get(world.scene).filter(n=>n.name&&n.zone!=null).map(n=>({n,d:Math.abs(n.x-p.x)+Math.abs(n.y-p.y)*.6})).sort((a,b)=>a.d-b.d);const t=list[0];if(!t||t.d>170)return false;return talkTo(t.n);}
function centerAction(){if(talkNear())return;const p=world.player,f=floor();if(p.x<f.bay-20){elevator();return;}if(world.scene.floor===0&&Math.abs(p.x-f.doorX)<170){streetExit();return;}toast('사람 가까이 가서 눌러 보세요');}
function centerEdge(dy){const p=world.player,b=M.bounds(world.scene),f=floor();if(!(p.y<=b.top+3&&dy<-.1))return;if(p.x<f.bay-30)elevator();else if(world.scene.floor===0&&Math.abs(p.x-f.doorX)<140)streetExit();}
function centerTap(x,y,joy){const f=floor(),p=world.player;if(x<f.bay-10&&y>210&&y<660){if(p.x<f.bay+160)elevator();else toast('엘리베이터 가까이 가세요');return true;}if(world.scene.floor===0&&Math.abs(x-f.doorX)<100&&y>250&&y<640){if(Math.abs(p.x-f.doorX)<300)streetExit();else toast('현관 가까이 가세요');return true;}if(joy)return false;for(const n of CenterLife.get(world.scene)){if(!n.name||n.zone==null)continue;if(Math.abs(x-n.x)<60&&y>n.y-205&&y<n.y+16){if(Math.abs(p.x-n.x)<330)talkTo(n);else toast('가까이 가서 말을 거세요');return true;}}return false;}
""")
s=sub(s,"function drawCorridor(){_drawCorridor();drawCorridorDecor();}",js+"function drawCorridor(){if(place()==='center')drawCenterFloor();else _drawCorridor();drawCorridorDecor();}")
# (3) update
s=sub(s,"function update(dt){if(CityTravel.update(dt))return;time+=dt;","function update(dt){if(CityTravel.update(dt))return;ensureSceneValid();schedTick();time+=dt;")
s=sub(s,"const man=CenterLife.get(world.scene).find(n=>['trainer','office','casual'].includes(n.actor.role)&&","const man=CenterLife.get(world.scene).find(n=>n.zone==null&&['trainer','office','casual'].includes(n.actor.role)&&")
s=sub(s,"const n=floor().rooms.findIndex(r=>Math.abs(world.player.x-r.x)<260);if(n!==nearRoom)","const n=place()==='center'?floor().rooms.findIndex(r=>world.player.x>=r.x0&&world.player.x<r.x1):floor().rooms.findIndex(r=>Math.abs(world.player.x-r.x)<260);if(n!==nearRoom)")
s=sub(s,"{if(world.player.y<490&&dy<-.1){if(place()!=='street'&&world.player.x<290)elevator();","{if(place()==='center'){centerEdge(dy);}else if(world.player.y<490&&dy<-.1){if(place()!=='street'&&world.player.x<290)elevator();")
s=sub(s,"world.player.y+=(445-world.player.y)*Math.min(1,dt*8);","world.player.y+=((place()==='center'?612:445)-world.player.y)*Math.min(1,dt*8);")
s=sub(s,"world.player.x=180;world.player.y=455;l.phase='arrive'","world.player.x=180;world.player.y=place()==='center'?612:455;l.phase='arrive'")
s=sub(s,"world.player.y+=(575-world.player.y)*Math.min(1,dt*4);","world.player.y+=((place()==='center'?612:575)-world.player.y)*Math.min(1,dt*4);")
# (4) render
s=sub(s,"function render(){if(CityTravel.draw(ctx,canvas))return;","function render(){if(CityTravel.draw(ctx,canvas))return;ensureSceneValid();")
s=sub(s,"const drawList=CenterLife.get(world.scene).map(n=>({y:n.y,draw:()=>CenterLife.draw(n,ctx,images,0,n.name||'')}));drawList.push({y:world.player.y,draw:drawHero});","const drawList=window.__noActors?[]:CenterLife.get(world.scene).map(n=>({y:n.y,draw:()=>CenterLife.draw(n,ctx,images,0,n.name||'')}));if(!window.__noActors&&!liftHidden())drawList.push({y:world.player.y,draw:drawHero});")
s=sub(s,"for(const p of drawList)p.draw();CorridorDecor.outline(ctx);","for(const p of drawList)p.draw();if(!window.__noActors)drawQuestMarks();CorridorDecor.outline(ctx);")
# (5) 행동 버튼 / 탭
s=sub(s,"function action(){if(CityTravel.active){CityTravel.boost();return;}if(mode!=='field'||$('#panel').open)return;","function action(){if(CityTravel.active){CityTravel.boost();return;}if(mode!=='field'||$('#panel').open)return;if(world.scene.type==='corridor'&&place()==='center'){centerAction();return;}")
s=sub(s,"if(y>130&&y<440){const i=floor().rooms.findIndex(r=>Math.abs(x-r.x)<194);","if(place()==='center'){if(centerTap(x,y,e.clientX<=innerWidth*.55&&e.clientY>=innerHeight*.38)){e.preventDefault();return;}}else if(y>130&&y<440){const i=floor().rooms.findIndex(r=>Math.abs(x-r.x)<194);")
s=sub(s,"&&place()!=='street'){const v=view(),hit=CenterGallery.hit(","&&place()!=='street'&&place()!=='center'){const v=view(),hit=CenterGallery.hit(")
# (6) 대화창 배경: NPC 뒤 화면을 흐리게
s=sub(s,"$('#roomBackground').style.backgroundImage=`url(\"${ART['bg/'+r.bg]}\")`;","$('#roomBackground').style.backgroundImage=`url(\"${window.__talkShot||ART['bg/'+r.bg]}\")`;$('#roomBackground').classList.toggle('shot',!!window.__talkShot);")
s=sub(s,"function closeRoom(){restoreFieldInput();","function closeRoom(){window.__talkShot=null;restoreFieldInput();")
# (7) 거리 → 센터 현관
s=sub(s,"M.changeFloor(world,0);world.player.x=95;world.player.y=590;","M.changeFloor(world,0);world.player.x=M.FLOORS[0].doorX;world.player.y=605;")
p.write_text(s,encoding='utf8');print('r45 patched')
