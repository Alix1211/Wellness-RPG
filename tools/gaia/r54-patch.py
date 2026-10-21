#!/usr/bin/env python3
"""R54: 줄 자르기 기본 그림 — X자 틀 그림의 가랑이를 입구(360,900)에 맞춰 720x1280 배경으로 합성해 기본값으로 넣음.
(배경 슬롯과 별개의 층으로 그려서, 게임 안에서 방 배경이 깔려도 항상 보임)
usage: r54-patch.py WORKDIR REPO   (r53 위에 적용)"""
import sys,io,base64
from pathlib import Path
from PIL import Image
W=Path(sys.argv[1]);R=Path(sys.argv[2])
def sub(s,old,new,n=1):
    assert s.count(old)==n,(old[:60],s.count(old));return s.replace(old,new)
fig=Image.open(R/'assets/rope-v2/figure-cross.png').convert('RGBA')
CX,CY=200,190         # 그림 속 가랑이 점
SC=1.5               # 가랑이 아래로 약 350px 남게 (판 높이 1280, 입구 900)
im=fig.resize((round(fig.width*SC),round(fig.height*SC)),Image.LANCZOS)
cv=Image.new('RGBA',(720,1280),(0,0,0,0))
cv.alpha_composite(im,(round(360-CX*SC),round(900-CY*SC)))
b=io.BytesIO();cv.save(b,'WEBP',quality=88,method=6)
uri='data:image/webp;base64,'+base64.b64encode(b.getvalue()).decode()
p=W/'script-02.js';s=p.read_text(encoding='utf8')
s=sub(s,"try{const d=await db();const values=","if(kind==='rope'){const im=new Image();im.src='"+uri+"';window.__ropeFig=im;}try{const d=await db();const values=")
s=sub(s,"function drawRope(){const p=model.ball;","function drawRope(){const p=model.ball;if(window.__ropeFig&&window.__ropeFig.complete&&window.__ropeFig.naturalWidth)ctx.drawImage(window.__ropeFig,0,0,720,1280);")
p.write_text(s,encoding='utf8');print('r54 patched',len(uri))
