"""Extract original grid/component frames to a common pivot; never overwrite source PNGs.

The original sheets contain disconnected alpha flecks. Keep the connected actor
and its antialiased rim; normalize by head width, not changing full-body pose height.
"""
from pathlib import Path
import base64,io,json,hashlib
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

def components(image,nr):
    rgba=np.array(image);labels,count=nd.label(rgba[:,:,3]>40)
    sizes=np.bincount(labels.ravel());sizes[0]=0
    ids=np.argsort(sizes)[-(nr*4):]
    assert len(ids)==nr*4 and min(sizes[ids])>2000,'Not enough actor components'
    records=[]
    for label in ids:
        yy,xx=np.where(labels==label)
        box=[max(0,int(xx.min())-2),max(0,int(yy.min())-2),min(image.width,int(xx.max())+3),min(image.height,int(yy.max())+3)]
        records.append({'label':int(label),'box':box,'cx':(xx.min()+xx.max())/2,'cy':(yy.min()+yy.max())/2})
    records.sort(key=lambda a:a['cy'])
    ordered=[]
    for row in range(nr):ordered.extend(sorted(records[row*4:(row+1)*4],key=lambda a:a['cx']))
    out=[]
    for a in ordered:
        keep=nd.binary_dilation(labels==a['label'],iterations=2)
        part=rgba.copy();part[:,:,3]=np.where(keep,part[:,:,3],0)
        # Bright red/yellow removal specks occur at the source's transparency edge.
        # Keep lip/eye/clothing interiors; clean only the outer three-pixel rim.
        border=keep & ~nd.binary_erosion(labels==a['label'],iterations=3)
        rgb=part[:,:,:3].astype(float)
        vivid_red=(rgb[:,:,0]>155)&(rgb[:,:,1]<85)&(rgb[:,:,2]<115)
        vivid_yellow=(rgb[:,:,0]>175)&(rgb[:,:,1]>125)&(rgb[:,:,2]<95)
        part[:,:,3]=np.where(border & (vivid_red|vivid_yellow),0,part[:,:,3])
        x0,y0,x1,y1=a['box'];out.append((Image.fromarray(part).crop((x0,y0,x1,y1)),a['box']))
    return out

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
        detected=components(image,nr) if sheet.get('extraction')=='components-v3' else None
        source_boxes=[]
        for row in range(nr):
            for col in range(4):
                y0,y1=(round(row*image.height/nr),round((row+1)*image.height/nr)) if nr==4 else ((0,split) if row==0 else (split,image.height))
                x0,x1=round(col*image.width/4),round((col+1)*image.width/4)
                if detected:
                    cell,rect=detected[row*4+col];x0,y0,x1,y1=rect
                else:cell=image.crop((x0,y0,x1,y1))
                source_boxes.append([x0,y0,x1,y1])
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
                metadata[key]={'tile':list(TILE),'pivot':list(PIVOT),'sourceCell':[x0,y0,x1,y1],'actorBounds':box,'headWidth':round(head_width,2),'scale':round(scale,6),'placement':[left,top],'source':sheet['path'],'sourceSha256':hashlib.sha256((ROOT/sheet['path']).read_bytes()).hexdigest(),'sourceBoundsTouchingEdge':bool(x0==0 or y0==0 or x1==image.width or y1==image.height)}
                cells.append(frame)
        sheet['frames']=source_boxes
        previews.append((sheet['outfit']+' '+sheet['type'],cells))
    (HERE/'source-frame-rects.json').write_text(json.dumps(source,ensure_ascii=False,indent=2)+'\n')
    (HERE/'prepared-assets.json').write_text(json.dumps(assets,ensure_ascii=False))
    (HERE/'sprite-alignment.json').write_text(json.dumps({'version':3,'tile':list(TILE),'pivot':list(PIVOT),'frames':metadata},ensure_ascii=False,indent=2)+'\n')
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
