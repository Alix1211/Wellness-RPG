#!/usr/bin/env python3
"""R47: 집을 새 그림·순수 2D 구조로 전환.
 - 단칸 빌라(11): 침실 + 욕실 한 줄
 - 가정집: 1층(9) 현관·거실, 2층(12) 서재·빈방·작은 침실·화장실·욕실·안방, 지하(13) 체벌방
 - 계단: 위층은 1층 오른쪽 끝, 지하는 1층 왼쪽 끝 (위·아래 키 / 행동 버튼)
 - 사람이 없는 구역은 행동 버튼으로 구역 메뉴(쉬기·미션 등)를 연다
usage: r47-patch.py WORKDIR REPO   (r46 위에 적용)"""
import sys,io,base64,json
from pathlib import Path
import numpy as np
from PIL import Image
W=Path(sys.argv[1]);R=Path(sys.argv[2]);D=R/'assets/home-v2'
T_STORE,T_DRAW,FL_Y=560,600,100
PAD=300
def hexc(v):return '#%02x%02x%02x'%tuple(int(x) for x in v)
# 층 정의: idx, 이름, gy, 그림[(파일,키,자르기,[(kind,이름,비율,id)])], 계단, 문, 시작 x
SH=lambda k,n,f,i=None:(k,n,f,i)
FLOORS=[
 dict(idx=9,name='우리 집 1층',gy=604,pad=PAD,door=PAD+150,entry=PAD+260,
  strips=[('shared_entrance_living','h1',False,[SH('homeEntrance','현관',.42,'home-homeEntrance'),SH('homeLiving','거실',.58,'home-homeLiving')])]),
 dict(idx=11,name='단칸 빌라',gy=None,pad=0,door=250,entry=620,
  strips=[('starter_villa','v1',True,[SH('villa','단칸 빌라',.5575,'starter-villa'),SH('villaBath','욕실',.4425,'starter-bath')])]),
 dict(idx=12,name='우리 집 2층',gy=604,pad=PAD,door=None,entry=PAD+200,
  strips=[('shared_room_empty','h2a',False,[SH('homeStudy','서재',.52,'home-homeStudy'),SH('homeSpare','빈방',.48,'home-homeSpare')]),
          ('shared_room_bath_small','h2b',False,[SH('homeRoom','작은 침실',.54,'home-homeRoom'),SH('homeToilet','화장실',.27,'home-homeToilet'),SH('homeBath','욕실',.19,'home-homeBath-1')]),
          ('shared_master_bath','h2c',False,[SH('homeBedroom','안방',.58,'home-homeBedroom'),SH('homeBath','안방 욕실',.42,'home-homeBath-2')])]),
 dict(idx=13,name='우리 집 지하',gy=None,pad=PAD+40,door=None,entry=PAD+160,
  strips=[('shared_basement_punish','h3',False,[SH('homeBasement','지하 체벌방',1.0,'home-homeBasement')])]),
]
KIND={'homeEntrance':('home/거실',None),'homeLiving':('home/거실','cylinder'),'homeStudy':('home/서재',None),'homeSpare':('home/빈방',None),'homeRoom':('home/침실',None),
      'homeBedroom':('home/침실','rest'),'homeToilet':('home/화장실','water'),'homeBath':('home/화장실',None),'homeBasement':('home/지하실',None),
      'villa':('starter-villa','rest'),'villaBath':('home/화장실',None)}
imgs={};layout={};out={};edge={}
for F in FLOORS:
    x=F['pad'];L=[];rooms=[];rn=0;els=[]
    for fn,key,crop,zs in F['strips']:
        im=Image.open(D/(fn+'.png')).convert('RGB')
        if crop:
            a=np.asarray(im).astype(int);bg=a[2,2];df=np.abs(a-bg).sum(2)>40;ys=np.where(df.any(1))[0];y0,y1=ys.min(),ys.max()+1
            im=im.crop((0,y0,im.width,y1));print(fn,'crop',y0,y1)
        h=im.height;ws=round(im.width*T_STORE/h);c2=im.resize((ws,T_STORE),Image.LANCZOS)
        b=io.BytesIO();c2.save(b,'WEBP',quality=82,method=6);imgs[key]='data:image/webp;base64,'+base64.b64encode(b.getvalue()).decode()
        arr=np.asarray(c2).astype(int);tc=hexc(arr[:3].reshape(-1,3).mean(0));bc=hexc(arr[-3:].reshape(-1,3).mean(0))
        w=round(ws*T_DRAW/T_STORE);L.append({'k':key,'w':w,'tc':tc,'bc':bc});els.append((arr,tc,bc))
        print(fn,key,w,len(b.getvalue())//1024,'KB')
        a0=x
        for kind,nm,fr,zid in zs:
            x0=a0;x1=a0+w*fr;rn+=1;bg_,sv=KIND[kind]
            rooms.append({'id':zid,'kind':kind,'name':nm,'bg':bg_,'service':sv,'number':'','color':'#d7b594','games':[],'x':round((x0+x1)/2),'x0':round(x0),'x1':round(x1)})
            a0=x1
        x+=w
    width=round(x+F['pad'])
    allp=np.concatenate([e[0] for e in els],axis=1)
    def band(a,b):
        h=allp.shape[0];return hexc(np.median(allp[int(h*a):int(h*b)].reshape(-1,3),axis=0))
    wallc=band(.22,.42);fa=band(.76,.80);fb=band(.90,.94)
    cc=[wallc]*4+[fa,fb]
    edge[F['idx']]={'l':cc+[els[0][1],els[0][2]],'r':cc+[els[-1][1],els[-1][2]]}
    layout[F['idx']]=L
    out[F['idx']]={'place':'home','strip':True,'locked':True,'gy':F['gy'],'number':1,'name':F['name'],'width':width,'bay':F['pad'],'padR':F['pad'],'edge':True,'rooms':rooms}
    if F['door'] is not None:out[F['idx']]['doorX']=F['door']
    out[F['idx']]['entryX']=F['entry']
# 바닥선: 빌라는 그림 기준
out[11]['gy']=618
out[13]['gy']=614
# 계단 (바닥 좌표 기준)
W9=out[9]['width'];W12=out[12]['width'];W13=out[13]['width']
out[9]['stairs']=[{'dir':'down','x0':60,'x1':PAD,'to':13,'ax':PAD+150,'label':'지하'},{'dir':'up','x0':W9-PAD,'x1':W9-60,'to':12,'ax':PAD+120,'label':'2층'}]
out[12]['stairs']=[{'dir':'down','x0':60,'x1':PAD,'to':9,'ax':W9-PAD+120,'label':'1층'}]
out[13]['stairs']=[{'dir':'up','x0':PAD+20,'x1':PAD+190,'to':9,'ax':150,'label':'1층'}]
def sub(s,old,new,n=1):
    assert s.count(old)==n,(s.count(old),old[:90]);return s.replace(old,new)
# ---------- script-07 ----------
p7=W/'script-07.js';s=p7.read_text(encoding='utf8')
old='CenterModel.FLOORS.push({place:"home",number:1,name:"단칸 빌라",width:1280,rooms:[{id:"starter-villa",kind:"villa",name:"단칸 빌라",bg:"starter-villa",x:640,games:[],service:"rest"}]});'
new="{const HS=%s;CenterModel.FLOORS[9]=HS['9'];CenterModel.FLOORS.push(HS['11'],HS['12'],HS['13']);}"%json.dumps(out,ensure_ascii=False)
s=sub(s,old,new)
s=sub(s,"s.player.x=FLOORS[floor].place==='home'&&!FLOORS[floor].strip?640:220;","s.player.x=FLOORS[floor].place==='home'&&!FLOORS[floor].strip?640:(FLOORS[floor].entryX??220);")
p7.write_text(s,encoding='utf8')
# ---------- script-16 ----------
p=W/'script-16.js';s=p.read_text(encoding='utf8')
# 그림
s=sub(s,",FL_Y=100,FL_T=600;",",FL_Y=100,FL_T=600;{const B=%s;for(const k of Object.keys(B)){const i=new Image();i.src=B[k];FLOORIMG[k]=i;}}Object.assign(FL_LAYOUT,%s);const FL_EDGE=%s;\n"%(json.dumps(imgs,separators=(',',':')),json.dumps(layout),json.dumps(edge)))
# 바닥 그리기: 엘리베이터 없는 층(집)은 양끝 여백을 그림 가장자리 색으로
s=sub(s," ctx.fillStyle='#f0a9b7';ctx.fillRect(0,0,f.width,H);\n const wall=ctx.createLinearGradient(0,FL_Y,0,FL_Y+FL_T);",
 " ctx.fillStyle='#f0a9b7';ctx.fillRect(0,0,f.width,H);\n if(f.edge){const E=FL_EDGE[fi],pad=(side,x0,x1)=>{const c=E[side],g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,c[6]);g.addColorStop(FL_Y/H,c[6]);for(let i=0;i<6;i++)g.addColorStop((FL_Y+(i+.5)/6*FL_T)/H,c[i]);g.addColorStop((FL_Y+FL_T)/H,c[7]);g.addColorStop(1,c[7]);ctx.fillStyle=g;ctx.fillRect(x0,0,x1-x0,H);};pad('l',0,f.bay+2);pad('r',f.width-f.padR-2,f.width);}else{\n const wall=ctx.createLinearGradient(0,FL_Y,0,FL_Y+FL_T);")
s=sub(s,"ctx.fillStyle='#d79aa4';ctx.fillRect(0,FL_Y+FL_T*.94,f.bay,FL_T*.06);","ctx.fillStyle='#d79aa4';ctx.fillRect(0,FL_Y+FL_T*.94,f.bay,FL_T*.06);}")
s=sub(s," drawLift(f);\n for(const r of f.rooms){"," if(!f.edge)drawLift(f);\n for(const r of f.rooms){")
s=sub(s,"text('▲ 거리',dx,FL_Y+FL_T*.26,15,'#79516a');}}}","text('▲ 거리',dx,FL_Y+FL_T*.26,15,'#79516a');}}if(f.stairs)for(const st of f.stairs){const mx=(st.x0+st.x1)/2;if(mx>v.cam-100&&mx<v.cam+v.width+100){box(mx-58,FL_Y+FL_T*.22-17,116,32,12,'#fff5e8e0');text((st.dir==='up'?'▲ ':'▼ ')+st.label,mx,FL_Y+FL_T*.22+5,15,'#79516a');}}}")
# 엘리베이터 없는 층에서는 엘리베이터 동작 금지 + 계단 + 구역 메뉴
s=sub(s,"function centerAction(){if(talkNear())return;const p=world.player,f=floor();if(p.x<f.bay-20){elevator();return;}",
 "function useStairs(st){sceneChange(()=>{M.changeFloor(world,st.to);world.player.x=st.ax;world.player.y=floor().gy;world.camera=0;});}\nfunction centerAction(){if(talkNear())return;const p=world.player,f=floor();{const st=f.stairs?.find(t=>p.x>=t.x0-50&&p.x<=t.x1+50);if(st){useStairs(st);return;}}if(!f.edge&&p.x<f.bay-20){elevator();return;}")
s=sub(s,"{streetExit();return;}toast('사람 가까이 가서 눌러 보세요');}","{streetExit();return;}if(f.place==='home'){const zi=f.rooms.findIndex(r=>p.x>=r.x0&&p.x<r.x1);if(zi>=0){world.scene.room=zi;window.__talkShot=captureBg();openRoom(f.rooms[zi]);return;}}toast('사람 가까이 가서 눌러 보세요');}")
s=sub(s,"function centerEdge(dy){const p=world.player,b=M.bounds(world.scene),f=floor();if(!(p.y<=b.top+3&&dy<-.1))return;if(p.x<f.bay-30)elevator();",
 "function centerEdge(dy){const p=world.player,b=M.bounds(world.scene),f=floor();if(f.stairs&&Math.abs(dy)>.1){const st=f.stairs.find(t=>(t.dir==='down'?dy>.1:dy<-.1)&&p.x>=t.x0&&p.x<=t.x1);if(st){useStairs(st);return;}}if(!(p.y<=b.top+3&&dy<-.1))return;if(!f.edge&&p.x<f.bay-30)elevator();")
s=sub(s,"function centerTap(x,y,joy){const f=floor(),p=world.player;if(x<f.bay-10&&y>210&&y<660){",
 "function centerTap(x,y,joy){const f=floor(),p=world.player;if(f.stairs)for(const st of f.stairs){const mx=(st.x0+st.x1)/2;if(Math.abs(x-mx)<100&&y>130&&y<660){if(Math.abs(p.x-mx)<300)useStairs(st);else toast('계단 가까이 가세요');return true;}}if(!f.edge&&x<f.bay-10&&y>210&&y<660){")
# 문(거리 출구): 집 1층·빌라는 위쪽 키가 아니라 문 앞에서 위쪽 → 이미 doorX 처리. 거리에서 집으로 올 때 문 안쪽에 서기
# 대화 줄 종류
s=sub(s,"homeToilet:'h:bath',","homeToilet:'h:bath',homeEntrance:'h:living',homeRoom:'h:bed',homeBath:'h:bath',villaBath:'h:bath',")
p.write_text(s,encoding='utf8');print('r47 patched')
