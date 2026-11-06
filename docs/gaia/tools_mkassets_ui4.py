import cv2,numpy as np,base64,json,io
from PIL import Image
A='/mnt/user-data/attachments/5e1cc2b5-7932-510e-9fbb-5c03e5355332/'
Z='../zip2/'
out={}
def put(key,img,q=None,lossless=True,mode=None):
    b=io.BytesIO();img.save(b,'WEBP',lossless=lossless,quality=q or 85,method=6)
    out[key]='data:image/webp;base64,'+base64.b64encode(b.getvalue()).decode();print(key,len(b.getvalue()),img.size)
for c in ['Pink','Mint']:
    for s in ['Small','Medium','Large']:
        im=Image.open(f'{Z}{c}_{s}.png').convert('RGBA');put(f'{c[0].lower()}{s[0].lower()}',im)
lg=Image.open('logo_clean.png').convert('RGBA');lg=lg.resize((1100,int(lg.height*1100/lg.width)),Image.LANCZOS);put('logo',lg)
hero=Image.open(A+'acda138c-image.png').convert('RGB');put('hero',hero,q=80,lossless=False)
json.dump(out,open('assets4.json','w'))
print(sum(len(v) for v in out.values()))
