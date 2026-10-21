#!/usr/bin/env python3
"""cast4 시트 -> 게임용 에셋. usage: make-cast4-assets.py OUT_DIR
 - 초상화(원본 해상도): 요가(four_standing_front_yoga)·오피스(four_office_standing_bright)에서 노란(유리)·단발(지안)·올린머리(오 부장)
 - SD(걷기 타일 224x208): 유리=yellow, 지안=bob, 오 부장=updo.  요가=4포즈 시트(기기·엎드림), 오피스/청바지=8컷 시트(걷기4+점프4)
 생성 이미지는 만들지 않고 원본 픽셀만 잘라 쓴다(배경 얼룩은 가장 큰 덩어리만 남겨 제거)."""
import sys,json
from pathlib import Path
from PIL import Image
import numpy as np
from scipy import ndimage as nd
SRC=Path('/home/claude/wellness-rpg/assets/characters/cast4');OUT=Path(sys.argv[1]);OUT.mkdir(parents=True,exist_ok=True)
def comps(file,n):
    a=np.array(Image.open(file).convert('RGBA'));mask=a[:,:,3]>100
    lab,k=nd.label(mask);sizes=np.bincount(lab.ravel());sizes[0]=0;boxes=nd.find_objects(lab)
    ids=list(np.argsort(sizes)[-n:]);out=[]
    for i in ids:
        sy,sx=boxes[i-1];comp=lab==i;keep=nd.binary_dilation(nd.binary_fill_holes(comp),iterations=2)
        rgba=a.copy();rgba[:,:,3]=np.where(keep,rgba[:,:,3],0)
        im=Image.fromarray(rgba[sy.start:sy.stop,sx.start:sx.stop]);im=im.crop(im.getbbox())
        out.append(((sy.start+sy.stop)/2,(sx.start+sx.stop)/2,im,sy,sx))
    return out
def order(cs,cols,rows):
    cs=sorted(cs,key=lambda c:c[0]);res=[]
    for r in range(rows):res+=sorted(cs[r*cols:(r+1)*cols],key=lambda c:c[1])
    return [c[2] for c in res]
# ---- 초상화
who=['hero','yuri','jian','boss']
for tag,f in [('yoga','four_standing_front_yoga.png'),('office','four_office_standing_bright.png')]:
    ims=order(comps(SRC/f,4),4,1)
    for w,im in zip(who,ims):
        if w=='hero':continue
        im.save(OUT/f'portrait_{w}_{tag}.webp','WEBP',quality=96,alpha_quality=100,method=6);print(w,tag,im.size)
# ---- SD
TILE=(224,208)
def tiles(role,idx,kind,ims):
    scale=min(176/max(c.height for c in ims),204/max(c.width for c in ims));frames=[];met=[]
    for i,c in enumerate(ims):
        c=c.resize((round(c.width*scale),round(c.height*scale)),Image.Resampling.LANCZOS)
        t=Image.new('RGBA',TILE);t.alpha_composite(c,((224-c.width)//2,190-c.height))
        name=f'npc_{role}_{idx}_{i}.webp';t.save(OUT/name,'WEBP',quality=90,method=6)
        bb=t.getbbox();met.append({'center':(bb[0]+bb[2])/2,'ground':189,'height':c.height})
    return {'id':f'{role}-{idx}','kind':kind,'role':role,'frames':[f'npc/{role}/{idx}/{i}' for i in range(len(ims))],'source':'cast4'},met
actors=[];metrics={}
SHEETS={'yuri':('yellow_yoga_tpose_prone_handstand_crawl.png','yellow_office_crawl_jump_8f.png'),
 'jian':('bob_yoga_tpose_prone_handstand_crawl.png','bob_office_crawl_jump_8f.png'),
 'boss':('updo_yoga_tpose_prone_handstand_crawl.png','updo_jeans_crawl_jump_8f.png')}
for role,(yg,of) in SHEETS.items():
    y=order(comps(SRC/'chibi'/yg,4),2,2)   # T자, 엎드림 / 물구나무, 기기
    a,m=tiles(role,0,'pose',[y[3],y[1]]);actors.append(a);metrics[role+'0']=m
    o=order(comps(SRC/'chibi'/of,8),4,2)
    a,m=tiles(role,1,'side',o);actors.append(a);metrics[role+'1']=m
# ---- 오 부장: 케인님의 이전 시뮬레이터(Wellness) 에셋으로 교체 — 센터=기어가기 4컷(걷기), 회사=오피스 서기·합장
B=SRC/'boss'
runs=[]
for i in range(1,5):
    im=Image.open(B/f'run0{i}.webp').convert('RGBA');runs.append(im.crop(im.getbbox()))
actors=[a for a in actors if a['role']!='boss'];metrics={k:v for k,v in metrics.items() if not k.startswith('boss')}
a,m=tiles('boss',0,'side',runs+runs);actors.append(a);metrics['boss0']=m
def cellcrop(file,box):
    a=np.array(Image.open(file).convert('RGBA'));x0,y0,x1,y1=box;a=a[y0:y1,x0:x1].copy();mask=a[:,:,3]>100
    lab,k=nd.label(mask);sizes=np.bincount(lab.ravel());sizes[0]=0
    keep=np.isin(lab,[i for i in range(1,k+1) if sizes[i]>2500]);keep=nd.binary_dilation(nd.binary_fill_holes(keep),iterations=2)
    a[:,:,3]=np.where(keep,a[:,:,3],0);im=Image.fromarray(a);return im.crop(im.getbbox())
SH=B/'office_yoga_basic_sheet.png'
cells=[cellcrop(SH,(60,0,360,400)),cellcrop(SH,(60,410,360,800))]
a,m=tiles('boss',1,'pose',[cells[0],cells[1]]);actors.append(a);metrics['boss1']=m
json.dump({'actors':actors,'metrics':metrics},open(OUT/'npc.json','w'))
print(len(actors),'actors')
