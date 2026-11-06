import cv2,numpy as np,base64,json,io
from PIL import Image,ImageDraw,ImageFilter
SHEET='/mnt/user-data/attachments/5e1cc2b5-7932-510e-9fbb-5c03e5355332/4ace62e1-image.png'
im=cv2.imread(SHEET,cv2.IMREAD_UNCHANGED)
Z='../zip1/GAIA_Corridor_UI_and_Exit_Doors/'
out={}
def webp(arr,key,q=None,lossless=True,scale=None):
    rgba=cv2.cvtColor(arr,cv2.COLOR_BGRA2RGBA)
    p=Image.fromarray(rgba)
    if scale:p=p.resize((int(p.width*scale),int(p.height*scale)),Image.LANCZOS)
    b=io.BytesIO();p.save(b,'WEBP',lossless=lossless,quality=q or 90,method=6)
    out[key]='data:image/webp;base64,'+base64.b64encode(b.getvalue()).decode()
    print(key,len(b.getvalue()),p.size);p.save(f'a/{key}.png')
# frame
fr=cv2.imread('frame.png',-1)
fr[:,:,3]=np.where(fr[:,:,3]<40,0,fr[:,:,3])
webp(fr,'frame')
def clean_alpha(c):
    c=c.copy();a=c[:,:,3].astype(np.float32);a=np.clip((a-150)/70,0,1)*255;c[:,:,3]=a.astype(np.uint8);return c
def bbox_crop(x0,y0,x1,y1,sat=False,rad=0.5):
    c=im[y0:y1,x0:x1].copy()
    if sat:
        hsv=cv2.cvtColor(c[:,:,:3],cv2.COLOR_BGR2HSV);ys,xs=np.where((hsv[:,:,1]>90)&(c[:,:,3]>200))
        c=c[ys.min():ys.max()+1,xs.min():xs.max()+1]
    h,w=c.shape[:2];ins=1.5
    yy,xx=np.mgrid[:h,:w].astype(np.float32);xx+=.5;yy+=.5
    r=h*rad
    qx=np.abs(xx-w/2)-(w/2-r);qy=np.abs(yy-h/2)-(h/2-r)
    d=np.hypot(np.maximum(qx,0),np.maximum(qy,0))+np.minimum(np.maximum(qx,qy),0)-r+ins
    c[:,:,3]=(np.clip(-d,0,1)*255).astype(np.uint8);return c
def widen(c,cap,W):
    h,w=c.shape[:2];mid=cv2.resize(c[:,cap:w-cap],(W-2*cap,h),interpolation=cv2.INTER_LINEAR)
    return np.hstack([c[:,:cap],mid,c[:,w-cap:]])
pp=bbox_crop(80,228,375,325,sat=True);print('pill',pp.shape)
webp(widen(pp,48,640),'pill1')
t1=bbox_crop(815,142,1040,212,sat=True);webp(widen(t1,40,520),'tab1')
t2=bbox_crop(1044,147,1262,209);webp(widen(t2,40,520),'tab2')
ib=bbox_crop(797,232,1538,289,rad=0.45);webp(widen(ib,34,700),'input')
# X
def circ(cx,cy,r):
    S=2*r;c=im[cy-r:cy+r,cx-r:cx+r].copy();yy,xx=np.mgrid[:S,:S];d=np.hypot(xx-r+.5,yy-r+.5)
    c[:,:,3]=(np.clip((r-d)/1.5,0,1)*255).astype(np.uint8);return c
webp(circ(1517,124,31),'close')
webp(circ(645,808,124),'run',scale=.6);webp(circ(962,808,124),'check',scale=.6)
# base + icons
base=cv2.imread('a/base.png',-1)
def icon(kind):
    S=base.shape[0];K=4;L=Image.new('RGBA',(S*K,S*K),(0,0,0,0));d=ImageDraw.Draw(L)
    cx=cy=S*K/2;cy-=S*K*0.03
    col=(255,247,238,255)
    if kind=='menu':
        w=S*K*0.46;h=S*K*0.075
        for dy in(-0.17,0,0.17):
            y=cy+dy*S*K;d.rounded_rectangle([cx-w/2,y-h/2,cx+w/2,y+h/2],h/2,fill=col)
    else:
        import math
        R=S*K*0.215;ro=S*K*0.285;n=8
        pts=[]
        for i in range(n):
            a=2*math.pi*i/n
            for da,r in((-0.20,R),(-0.16,ro),(0.16,ro),(0.20,R)):
                pts.append((cx+math.cos(a+da)*r,cy+math.sin(a+da)*r))
        d.polygon(pts,fill=col);d.ellipse([cx-R*1.02,cy-R*1.02,cx+R*1.02,cy+R*1.02],fill=col)
        r2=S*K*0.095;d.ellipse([cx-r2,cy-r2,cx+r2,cy+r2],fill=(244,150,180,255))
    sh=L.split()[3].filter(ImageFilter.GaussianBlur(S*K*0.012))
    shadow=Image.new('RGBA',L.size,(190,70,110,0));shadow.putalpha(sh.point(lambda v:int(v*0.55)))
    shadow=shadow.transform(L.size,Image.AFFINE,(1,0,0,0,1,-S*K*0.012))
    comp=Image.alpha_composite(shadow,L).resize((S,S),Image.LANCZOS)
    b=Image.fromarray(cv2.cvtColor(base,cv2.COLOR_BGRA2RGBA));b=Image.alpha_composite(b,comp)
    return cv2.cvtColor(np.array(b),cv2.COLOR_RGBA2BGRA)
webp(icon('menu'),'menu',scale=.6);webp(icon('gear'),'gear',scale=.6)
# HUD & doors
h=cv2.imread(Z+'01_portrait_hp_m_hud.png',-1);webp(h,'hud',scale=.75)
webp(cv2.imread(Z+'02_exit_door_pink.png',-1),'door_pink',scale=.5)
webp(cv2.imread(Z+'03_exit_door_gray.png',-1),'door_gray',scale=.5)
json.dump(out,open('assets.json','w'))
print(sum(len(v) for v in out.values()))
