#!/usr/bin/env python3
"""R46: 순수 2D 횡스크롤(상하 이동 제거, 위·아래는 제자리 걸음) + 모든 인물 주인공 바닥선 통일 + 이동속도 25%↑
 + 회사 3개 층을 새 그림(assets/company-v2)·엘리베이터·구역 NPC 구조로 전환 + 회사 구역 담당자 층별 중복 제거 + 거리 y 고정.
usage: r46-patch.py WORKDIR REPO   (r45 위에 적용)"""
import sys,io,base64,json
from pathlib import Path
import numpy as np
from PIL import Image
W=Path(sys.argv[1]);R=Path(sys.argv[2]);D=R/'assets/company-v2'
T_STORE,T_DRAW=560,600
SPEED=1.25
CG=626      # 회사 바닥선(주인공·인물 발 위치)
CF=642      # 센터 바닥선
SG=620      # 거리 바닥선
# 층: [그림 파일, 구역[(종류, 이름, 비율)]]
CO=[('로비 · 지원시설',[('f1_a_lobby_lounge',[('companyLobby','회사 로비',.51),('lounge','휴게실',.49)]),('f1_b_pantry_toilet',[('pantry','탕비실',.5),('companyToilet','화장실',.5)])]),
    ('공용 업무층',[('f2_a_shared_office_x2',[('sharedOffice','공용 사무실 A',.53),('sharedOffice','공용 사무실 B',.47)]),('f2_b_meeting_pantry_toilet',[('meeting','회의실',.43),('pantry','탕비실',.31),('companyToilet','화장실',.26)])]),
    ('개인 업무층',[('f3_a_private_office_x2',[('privateOffice','개인 사무실 A',.53),('privateOffice','개인 사무실 B',.47)]),('f3_b_meeting_lounge_toilet',[('meeting','회의실',.30),('lounge','휴게실',.35),('companyToilet','화장실',.35)])])]
# ---------- 그림 처리 ----------
imgs={};info={}
for fi,(nm,sts) in enumerate(CO):
    for si,(fn,_) in enumerate(sts):
        key='c%d%s'%(fi+1,'ab'[si])
        im=Image.open(D/(fn+'.png')).convert('RGB');a=np.asarray(im).astype(int)
        bg=a[2,2];diff=np.abs(a-bg).sum(2)>26;ys=np.where(diff.any(1))[0];y0,y1=ys.min(),ys.max()+1
        c=im.crop((0,y0,im.width,y1));h=y1-y0
        ws=round(im.width*T_STORE/h);c2=c.resize((ws,T_STORE),Image.LANCZOS)
        b=io.BytesIO();c2.save(b,'WEBP',quality=82,method=6)
        imgs[key]='data:image/webp;base64,'+base64.b64encode(b.getvalue()).decode()
        top=np.asarray(c2)[:3].reshape(-1,3).mean(0).astype(int);bot=np.asarray(c2)[-3:].reshape(-1,3).mean(0).astype(int)
        info[key]={'w':round(ws*T_DRAW/T_STORE),'tc':'#%02x%02x%02x'%tuple(top),'bc':'#%02x%02x%02x'%tuple(bot)}
        print(key,'crop',y0,y1,'w',info[key]['w'],'kb',len(b.getvalue())//1024)
layout={}
spec=[]
for fi,(nm,sts) in enumerate(CO):
    L=[];S=[]
    for si,(fn,zs) in enumerate(sts):
        key='c%d%s'%(fi+1,'ab'[si]);L.append({'k':key,'w':info[key]['w'],'tc':info[key]['tc'],'bc':info[key]['bc']})
        S.append({'w':info[key]['w'],'z':[list(z) for z in zs]})
    layout[6+fi]=L;spec.append({'name':nm,'strips':S})
def sub(s,old,new,n=1):
    assert s.count(old)==n,(s.count(old),old[:90]);return s.replace(old,new)
# ---------- script-07 ----------
p7=W/'script-07.js';s=p7.read_text(encoding='utf8')
old="companySpecs.forEach(([name,kinds],fi)=>FLOORS.push({place:'company',number:fi+1,name,width:420+kinds.length*570,rooms:kinds.map((kind,i)=>({id:`company-f${fi+1}-${kind}-${i+1}`,kind,number:`${fi+1}${String(i+1).padStart(2,'0')}`,x:570+i*570,...TYPES[kind]}))}));"
new=("const CO_SPEC=%s;CO_SPEC.forEach((c,fi)=>{let x=FL_BAY,ri=0;const rooms=[];c.strips.forEach(st=>{let a=x;st.z.forEach(([kind,nm,fr])=>{const x0=a,x1=a+st.w*fr;ri++;rooms.push({id:`company-f${fi+1}-${kind}-${ri}`,kind,number:`${fi+1}${String(ri).padStart(2,'0')}`,...TYPES[kind],name:nm,x:Math.round((x0+x1)/2),x0:Math.round(x0),x1:Math.round(x1)});a=x1;});x+=st.w;});FLOORS.push({place:'company',strip:true,locked:true,gy:%d,number:fi+1,name:c.name,width:Math.round(x),bay:FL_BAY,rooms});});\n"
 "FLOORS.forEach(f=>{if(f.place==='center'){f.strip=true;f.locked=true;f.gy:=CF;}});"%(json.dumps(spec,ensure_ascii=False),CG)).replace('f.gy:=CF','f.gy=%d'%CF)
s=sub(s,old,new)
s=sub(s,"FLOORS.forEach(f=>{let gi=0,pi=0;","FLOORS.forEach(f=>{let gi=0,pi=0;",1)
# 센터·회사 문 위치, 거리 y 고정은 모든 층이 만들어진 뒤에 적용
s=sub(s,"const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));","FLOORS.find(f=>f.place==='company').doorX=FL_BAY+150;FLOORS.filter(f=>f.place==='street').forEach(f=>{f.locked=true;f.gy=%d;});\n const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));"%SG)
s=sub(s,"if(scene.type==='corridor'){const cf=FLOORS[scene.floor],ct=cf.place==='center';return {left:60,right:cf.width-60,top:ct?575:443,bottom:ct?650:672};}",
 "if(scene.type==='corridor'){const cf=FLOORS[scene.floor];if(cf.locked)return {left:60,right:cf.width-60,top:cf.gy,bottom:cf.gy};return {left:60,right:cf.width-60,top:443,bottom:672};}")
s=sub(s,"s.scene={type:FLOORS[floor].place==='home'?'room':'corridor',floor,room:0};s.player.x=FLOORS[floor].place==='home'?640:220;s.player.y=575;",
 "s.scene={type:FLOORS[floor].place==='home'&&!FLOORS[floor].strip?'room':'corridor',floor,room:0};s.player.x=FLOORS[floor].place==='home'&&!FLOORS[floor].strip?640:220;s.player.y=FLOORS[floor].gy||575;")
# 이동: 속도 +25%, 상하 이동 없음(위·아래 입력은 제자리 걸음)
s=sub(s,"p.x=clamp(p.x+ux*245*dt,b.left,b.right);p.y=clamp(p.y+uy*190*dt,b.top,b.bottom);\n  p.moving=Math.hypot(p.x-ox,p.y-oy)>.001;\n  if(p.moving){if(!air)p.dir=Math.abs(ux)>Math.abs(uy)*1.35?(ux<0?'left':'right'):(uy<0?'up':'down');p.walk=(p.walk+dt*10.25)%4;}",
 "const lock=b.top===b.bottom;if(lock){uy=0;if(p.dir==='up'||p.dir==='down')p.dir='right';}\n  p.x=clamp(p.x+ux*%.1f*dt,b.left,b.right);p.y=lock?b.top:clamp(p.y+uy*190*dt,b.top,b.bottom);\n  p.moving=Math.hypot(p.x-ox,p.y-oy)>.001||(lock&&!air&&m>.08);\n  if(p.moving){if(!air){if(lock){if(Math.abs(ux)>.12)p.dir=ux<0?'left':'right';}else p.dir=Math.abs(ux)>Math.abs(uy)*1.35?(ux<0?'left':'right'):(uy<0?'up':'down');}p.walk=(p.walk+dt*%.2f)%%4;}"%(245*SPEED,10.25*SPEED))
p7.write_text(s,encoding='utf8')
# ---------- script-08: 모든 인물을 주인공 바닥선에 ----------
p8=W/'script-08.js';s=p8.read_text(encoding='utf8')
s=sub(s,"x=M.clamp(x,b.left+45,b.right-45);y=M.clamp(y,b.top+12,b.bottom-28);","x=M.clamp(x,b.left+45,b.right-45);y=f.locked&&f.gy?f.gy:M.clamp(y,b.top+12,b.bottom-28);")
s=sub(s,"top:Math.max(b.top+22,y-26),bottom:Math.min(b.bottom-32,y+26)}});}","top:f.locked?y:Math.max(b.top+22,y-26),bottom:f.locked?y:Math.min(b.bottom-32,y+26)}});}")
s=sub(s,"(corridor?(f.place==='center'?100:240):140)","(corridor?(f.strip?100:240):140)",2)
s=sub(s,"if(f.place==='center'){f.rooms.forEach((r,zi)=>","if(f.strip){f.rooms.forEach((r,zi)=>")
s=sub(s,"y=592+M.clamp((p.y-555)/80,0,1)*26;add(","y=f.gy;add(")
p8.write_text(s,encoding='utf8')
# ---------- script-16 ----------
p=W/'script-16.js';s=p.read_text(encoding='utf8')
# (1) 회사 그림 + 층 배치
s=sub(s,",FL_Y=100,FL_T=600;",",FL_Y=100,FL_T=600;{const B=%s;for(const k of Object.keys(B)){const i=new Image();i.src=B[k];FLOORIMG[k]=i;}}Object.assign(FL_LAYOUT,%s);\n"%(json.dumps(imgs,separators=(',',':')),json.dumps(layout)))
# (2) 구조 판정: place()==='center' → 가로 스크롤 층(strip)
s=sub(s,"function drawCorridor(){if(place()==='center')drawCenterFloor();","function drawCorridor(){if(floor().strip)drawCenterFloor();")
s=sub(s,"if(f.place==='center'&&(s.type==='room'||!f.rooms[s.room])){world.scene={type:'corridor',floor:s.floor,room:0};world.player.x=220;world.player.y=600;world.target=null;world.camera=0;}}",
 "if(f.strip&&(s.type==='room'||!f.rooms[s.room])){world.scene={type:'corridor',floor:s.floor,room:0};world.player.x=220;world.player.y=f.gy;world.target=null;world.camera=0;}if(f.locked&&world.scene.type==='corridor')world.player.y=f.gy;}")
s=sub(s,"if(world.scene.type!=='corridor'||place()!=='center')return;const f=floor();for(const n of CenterLife.get","if(world.scene.type!=='corridor'||!floor().strip)return;const f=floor();for(const n of CenterLife.get")
s=sub(s,"world.player.y+=((place()==='center'?612:445)-world.player.y)*Math.min(1,dt*8);","world.player.y+=((floor().gy||445)-world.player.y)*Math.min(1,dt*8);")
s=sub(s,"world.player.y=place()==='center'?612:455;l.phase='arrive'","world.player.y=floor().gy||455;l.phase='arrive'")
s=sub(s,"world.player.y+=((place()==='center'?612:575)-world.player.y)*Math.min(1,dt*4);","world.player.y+=((floor().gy||575)-world.player.y)*Math.min(1,dt*4);")
s=sub(s,"const n=place()==='center'?floor().rooms.findIndex(r=>world.player.x>=r.x0&&world.player.x<r.x1)","const n=floor().strip?floor().rooms.findIndex(r=>world.player.x>=r.x0&&world.player.x<r.x1)")
s=sub(s,"if(place()==='center'){centerEdge(dy);}else if(world.player.y<490&&dy<-.1){","if(floor().strip){centerEdge(dy);}else if(floor().locked?dy<-.1:world.player.y<490&&dy<-.1){")
s=sub(s,"if(world.scene.type==='corridor'&&place()==='center'){centerAction();return;}","if(world.scene.type==='corridor'&&floor().strip){centerAction();return;}")
s=sub(s,"if(place()==='center'){if(centerTap(","if(floor().strip){if(centerTap(")
s=sub(s,"&&place()!=='street'&&place()!=='center'){const v=view(),hit=CenterGallery.hit(","&&place()!=='street'&&!floor().strip){const v=view(),hit=CenterGallery.hit(")
# 문(거리 출구): 센터 1층 외에 회사 1층도
s=sub(s,"if(world.scene.floor===0&&Math.abs(p.x-f.doorX)<170){streetExit();return;}","if(f.doorX!=null&&Math.abs(p.x-f.doorX)<170){streetExit();return;}")
s=sub(s,"else if(world.scene.floor===0&&Math.abs(p.x-f.doorX)<140)streetExit();}","else if(f.doorX!=null&&Math.abs(p.x-f.doorX)<140)streetExit();}")
s=sub(s,"if(world.scene.floor===0&&Math.abs(x-f.doorX)<100&&y>250&&y<640){","if(f.doorX!=null&&Math.abs(x-f.doorX)<100&&y>250&&y<640){")
s=sub(s,"if(world.scene.floor===0){const dx=f.doorX;if(dx>v.cam-100&&dx<v.cam+v.width+100){text('▲ 거리',dx,FL_Y+FL_T*.26,15,'#79516a');}}}","if(f.doorX!=null){const dx=f.doorX;if(dx>v.cam-100&&dx<v.cam+v.width+100){text('▲ 거리',dx,FL_Y+FL_T*.26,15,'#79516a');}}}")
# 장식 인물 · 걷기 애니메이션
s=sub(s,"y=crawl?596:592;ctx.save();","y=(floor().gy||592)+(crawl?4:0);ctx.save();")
s=sub(s,"world.player.motionClock=(world.player.motionClock||0)+dt*15;","world.player.motionClock=(world.player.motionClock||0)+dt*%.2f;"%(15*SPEED))
# (3) 거리 건물: 위쪽 키로 들어가기(y 고정). 회사·거리 도착 위치
s=sub(s,"M.changeFloor(world,6);world.outfit='office';","M.changeFloor(world,6);world.player.x=M.FLOORS[6].doorX;world.player.y=M.FLOORS[6].gy;world.outfit='office';")
# (4) 회사 층 이동은 입사 후
s=sub(s,"const b=button(p,'',()=>{liftState={open:1,phase:'closing',timer:0,target:i};});","const b=button(p,'',()=>{const blocked=floor().place==='company'&&i>6&&!life.employed;if(blocked)toast('입사 후 출입');liftState={open:1,phase:'closing',timer:0,target:blocked?world.scene.floor:i};});")
# (5) 회사 구역 담당자: 한 층에 같은 사람이 겹치지 않게, 유리/지안/오 부장은 시간대별 한 곳
anchor="window.CastLead=r=>{const k=castKey(r);return k?CAST_DEF[k].lead:null;};\n"
code=("{const IDX={'강태오':4,'재현':5,'백도현':6,'차재원':7,'송 회장':8};const LEAD={'company-f1-companyLobby-1':'강태오','company-f1-lounge-2':'재현','company-f1-pantry-3':'백도현','company-f1-companyToilet-4':'차재원',"
"'company-f2-sharedOffice-1':'재현','company-f2-sharedOffice-2':'강태오','company-f2-meeting-3':'백도현','company-f2-pantry-4':'차재원','company-f2-companyToilet-5':'송 회장',"
"'company-f3-privateOffice-1':'백도현','company-f3-privateOffice-2':'차재원','company-f3-meeting-3':'재현','company-f3-lounge-4':'강태오','company-f3-companyToilet-5':'송 회장'};"
"for(const[id,nm]of Object.entries(LEAD)){const d=CAST_DEF[id],pl=CAST_PLAN[id];if(!d||!pl||d.lead===nm)continue;const o=d.lead;const dup=d.people.find(x=>x.n===nm);d.lead=nm;if(dup)d.people=d.people.filter(x=>x.n!==o);else d.people=d.people.map(x=>x.n===o?{...x,n:nm}:x);for(let i=pl.length-1;i>=0;i--){const x=pl[i];if(x.n===nm&&x.n!==o&&dup){pl.splice(i,1);continue;}}for(const x of pl)if(x.n===o){x.n=nm;x.role='office';x.idx=IDX[nm];}}}\n")
s=sub(s,anchor,anchor+code)
p.write_text(s,encoding='utf8');print('r46 patched')
