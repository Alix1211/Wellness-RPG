"""Slice the 14 user-supplied NPC PNGs. The excluded JPG is the protagonist.
No generative edits; source bytes stay intact. Common scale within each sequence.
"""
from pathlib import Path
from PIL import Image,ImageDraw
from scipy import ndimage as nd
import numpy as np,io,base64,json,hashlib
HERE=Path(__file__).resolve().parent
ROOT=HERE.parents[1]
SOURCE=ROOT/'assets/characters/npcs/source'
TILE=(224,208);PIVOT=(112,190)
art={};actors=[];provenance=[];preview=[]
sheets={}
def components(file,cols,rows):
 if file in sheets:return sheets[file]
 a=np.array(Image.open(SOURCE/file).convert('RGBA')); rawmask=a[:,:,3]>100;mask=rawmask.copy()
 if file=='1000081091.png':
  mask &= a[:,:,3]>160
  rgb=a.astype(float);r,g,b=[rgb[:,:,i] for i in range(3)]
  mask &= ~((r>g*1.8)&(r>b*1.6)&(r>160))&~((r>210)&(g>160)&(b<100))
 labels,n=nd.label(mask);sizes=np.bincount(labels.ravel());sizes[0]=0;boxes=nd.find_objects(labels)
 ids=sorted(np.argsort(sizes)[-(cols*rows):],key=lambda i:(boxes[i-1][0].start+boxes[i-1][0].stop)/2)
 if file=='1000081091.png':
  selected=np.where(np.isin(labels,ids),labels,0)
  nearest=nd.distance_transform_edt(selected==0,return_distances=False,return_indices=True)
  labels=np.where(rawmask,selected[tuple(nearest)],0);boxes=nd.find_objects(labels)
 ordered=[]
 for row in range(rows):ordered.extend(sorted(ids[row*cols:(row+1)*cols],key=lambda i:boxes[i-1][1].start))
 frames=[]
 for i in ordered:
  sy,sx=boxes[i-1]; x0=max(0,sx.start-3);y0=max(0,sy.start-3);x1=min(a.shape[1],sx.stop+3);y1=min(a.shape[0],sy.stop+3)
  rgba=a[y0:y1,x0:x1].copy();component=labels[y0:y1,x0:x1]==i;keep=nd.binary_dilation(nd.binary_fill_holes(component),iterations=2)
  rgba[:,:,3]=np.where(keep,rgba[:,:,3],0)
  out=Image.fromarray(rgba);box=out.getbbox();frames.append((out.crop(box),[x0,y0,x1,y1],list(box)))
 sheets[file]=frames;return frames

def actor(file,cols,rows,index,kind,role,cell_indices):
 crops=[];rects=[];cells=components(file,cols,rows)
 for row,col in cell_indices:
  crop,rect,box=cells[row*cols+col];crops.append(crop);rects.append({'component':rect,'bounds':box})
 # One scale per sequence; jump height never changes the character size.
 scale=min(176/max(c.height for c in crops),204/max(c.width for c in crops))
 frames=[]
 for i,crop in enumerate(crops):
  crop=crop.resize((round(crop.width*scale),round(crop.height*scale)),Image.Resampling.LANCZOS)
  tile=Image.new('RGBA',TILE);tile.alpha_composite(crop,((224-crop.width)//2,190-crop.height))
  b=io.BytesIO();tile.save(b,'WEBP',quality=88,method=4)
  key=f'npc/{role}/{index}/{i}';art[key]='data:image/webp;base64,'+base64.b64encode(b.getvalue()).decode();frames.append(key)
  if i==0:preview.append((key,tile))
 aid=f'{role}-{index}';actors.append({'id':aid,'kind':kind,'role':role,'frames':frames,'source':file})
 provenance.append({'id':aid,'file':file,'scale':scale,'rects':rects})
for file,role in [('1000081094.png','trainer'),('1000081093.png','office'),('1000081092.png','casual')]:
 for i in range(12):actor(file,6,2,i,'standing',role,[(i//6,i%6)])
for i,file in enumerate(['1000081103.png','1000081102.png','1000081101.png','1000081100.png','1000081099.png','1000081098.png','1000081097.png']):
 actor(file,4,2,i,'side','member',[(r,c) for r in range(2) for c in range(4)])
for i,file in enumerate(['1000081105.png','1000081104.png']):
 actor(file,4,4,i,'front','casual-member',[(r,c) for r in range(4) for c in range(4)])
for file,role in [('1000081090.png','office-member'),('1000081091.png','yoga-member')]:
 for i in range(6):actor(file,6,2,i,'pose',role,[(0,i),(1,i)])
(HERE/'npc-assets.json').write_text(json.dumps(art,separators=(',',':')))
(HERE/'npc-manifest.json').write_text(json.dumps({'tile':list(TILE),'pivot':list(PIVOT),'actors':actors,'sources':[{'file':p.name,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in sorted(SOURCE.glob('*.png'))],'alignment':provenance},ensure_ascii=False,indent=2)+'\n')
out=Image.new('RGB',(8*224,8*230),'#dce6de');d=ImageDraw.Draw(out)
for i,(key,im) in enumerate(preview):
 x=i%8*224;y=i//8*230;out.paste(im,(x,y),im);d.text((x+4,y+208),key,fill='black')
out.save('/tmp/npc-extraction.jpg')
print(len(actors),'NPC appearances,',len(art),'frames,',len(list(SOURCE.glob('*.png'))),'unchanged sources')
