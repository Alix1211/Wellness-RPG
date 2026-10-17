"""Extract original grid frames to a common pivot; never overwrite source PNGs.

The original sheets contain disconnected alpha flecks. Keep the connected actor
and its antialiased rim; normalize by head width, not changing full-body pose height.
"""
from pathlib import Path
import base64,io,json
import numpy as np
from PIL import Image,ImageDraw
from scipy import ndimage as nd

ROOT=Path(__file__).resolve().parents[2]
HERE=Path(__file__).resolve().parent
TILE=(224,208)
PIVOT=(112,190)

def extract(cell):
    rgba=np.array(cell.convert('RGBA'))
    labels,count=nd.label(rgba[:,:,3]>40)
    sizes=np.bincount(labels.ravel());sizes[0]=0
    actor=labels==sizes.argmax()
    ys,xs=np.where(actor)
    x0,x1,y0,y1=xs.min(),xs.max()+1,ys.min(),ys.max()+1
    rgb=rgba.astype(float)
    hair=actor & (rgb[:,:,0]>rgb[:,:,1]*1.18) & (rgb[:,:,1]>rgb[:,:,2]*1.08) & (rgb[:,:,0]<220)
    hair &= np.indices(actor.shape)[0] < y0+(y1-y0)*.63
    hy,hx=np.where(hair)
    hx0,hx1=np.percentile(hx,[2,98])
    head_width=float(hx1-hx0)
    # A two-pixel rim retains soft hair/finger edges without detached colored dots.
    keep=nd.binary_dilation(actor,iterations=2)
    rgba[:,:,3]=np.where(keep,rgba[:,:,3],0)
    box=Image.fromarray(rgba).getbbox()
    return Image.fromarray(rgba).crop(box),head_width,((hx0+hx1)/2-box[0]),list(map(int,box))

def main():
    source=json.loads((HERE/'source-frame-rects.json').read_text())
    assets=json.loads((HERE/'prepared-assets.json').read_text())
    metadata={};previews=[]
    for sheet in source:
        image=Image.open(ROOT/sheet['path']).convert('RGBA')
        nr=4 if sheet['type']=='directions' else 2
        # Original side jump bun extends above the mathematical halfway point.
        split=505 if nr==2 else None
        cells=[]
        for row in range(nr):
            for col in range(4):
                y0,y1=(round(row*image.height/nr),round((row+1)*image.height/nr)) if nr==4 else ((0,split) if row==0 else (split,image.height))
                x0,x1=round(col*image.width/4),round((col+1)*image.width/4)
                cell=image.crop((x0,y0,x1,y1))
                crop,head_width,head_x,box=extract(cell)
                scale=74/head_width
                size=(round(crop.width*scale),round(crop.height*scale))
                crop=crop.resize(size,Image.Resampling.LANCZOS)
                target_head_x=PIVOT[0]-20 if nr==2 else PIVOT[0]
                left=round(target_head_x-head_x*scale);top=PIVOT[1]-size[1]
                assert left>=0 and top>=0 and left+size[0]<=TILE[0],(sheet['path'],row,col,size,left,top)
                frame=Image.new('RGBA',TILE);frame.alpha_composite(crop,(left,top))
                buf=io.BytesIO();frame.save(buf,format='WEBP',lossless=True)
                key=f"sprite/{sheet['outfit']}/{sheet['type']}/{row}/{col}"
                assets[key]='data:image/webp;base64,'+base64.b64encode(buf.getvalue()).decode()
                metadata[key]={'tile':list(TILE),'pivot':list(PIVOT),'sourceCell':[x0,y0,x1,y1],'actorBounds':box,'headWidth':round(head_width,2),'scale':round(scale,6),'placement':[left,top]}
                cells.append(frame)
        previews.append((sheet['outfit']+' '+sheet['type'],cells))
    (HERE/'prepared-assets.json').write_text(json.dumps(assets,ensure_ascii=False))
    (HERE/'sprite-alignment.json').write_text(json.dumps({'version':2,'tile':list(TILE),'pivot':list(PIVOT),'frames':metadata},ensure_ascii=False,indent=2)+'\n')
    out=Image.new('RGB',(4*TILE[0],sum(4 if len(c)==16 else 2 for _,c in previews)*TILE[1]),'#dce6de')
    y=0
    for name,frames in previews:
        for i,frame in enumerate(frames):
            xx=i%4*TILE[0];yy=y+i//4*TILE[1];out.paste(frame,(xx,yy),frame)
            ImageDraw.Draw(out).line((xx,yy+PIVOT[1],xx+TILE[0],yy+PIVOT[1]),fill='#8ca795')
        y+=(len(frames)//4)*TILE[1]
    out.thumbnail((896,2200));out.save('/tmp/center-sprite-alignment.jpg')
    print('Aligned 72 frames; common tile/pivot, 74px head reference; source PNGs preserved.')

if __name__=='__main__':main()
