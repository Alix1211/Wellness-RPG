#!/usr/bin/env python3
"""Slice the hero pose sheets (3 outfits) and casual-men sheets (4 men) into single transparent WebP figures
for the road encounter. Fringe pixels (faint red/blue edge) are removed and edge colours are pulled from the body."""
import sys,json
from pathlib import Path
import numpy as np
from PIL import Image
from scipy import ndimage as ndi
ROOT=Path(sys.argv[1]) if len(sys.argv)>1 else Path('.')
CH=ROOT/'assets/characters'; OUT=CH/'encounter'; OUT.mkdir(exist_ok=True)
K=0.55  # one scale for every figure so hero and men keep their relative size
def clean(a):
    al=a[...,3].astype(np.int32)
    keep=al>=110
    lab,n=ndi.label(ndi.binary_dilation(keep,iterations=3))
    if n:
        sizes=ndi.sum(keep,lab,range(1,n+1))
        small=np.isin(lab,[i+1 for i,s in enumerate(sizes) if s<500])
        keep&=~small
    solid=al>=250
    idx=ndi.distance_transform_edt(~solid,return_distances=False,return_indices=True)
    rgb=a[...,:3][idx[0],idx[1]]
    edge=keep&~solid
    rgb=np.where(edge[...,None],rgb,a[...,:3])
    new=np.where(keep,np.minimum(255,al*1.0),0)
    new=np.where(keep&(al>=190),255,new)
    out=np.dstack([rgb,new.astype(np.uint8)]).astype(np.uint8)
    return out
def split_cols(a,n):
    proj=(a[...,3]>40).sum(axis=0).astype(float)
    proj=ndi.uniform_filter1d(proj,25)
    W=a.shape[1];cuts=[0]
    for k in range(1,n):
        c=W*k//n;lo,hi=c-130,c+130
        cuts.append(int(lo+np.argmin(proj[lo:hi])))
    cuts.append(W);return cuts
def largest(a):
    lab,n=ndi.label(ndi.binary_dilation(a[...,3]>0,iterations=8))
    if n<2: return a
    sizes=ndi.sum(a[...,3]>0,lab,range(1,n+1));k=int(np.argmax(sizes))+1
    a=a.copy();a[lab!=k]=0;return a
def save(a,name):
    ys,xs=np.where(a[...,3]>0);box=(xs.min(),ys.min(),xs.max()+1,ys.max()+1)
    im=Image.fromarray(a).crop(box)
    im=im.resize((max(1,round(im.width*K)),max(1,round(im.height*K))),Image.LANCZOS)
    im.save(OUT/(name+'.webp'),'WEBP',quality=82,alpha_quality=92,method=6)
    return im.size
manifest={}
OUTFITS=['jeans','office','lavender-yoga']
for pose,f in [('bow','hero_bow_apology_3outfits'),('pray','hero_heart_pray_3outfits'),('surprised','hero_surprised_3outfits'),('kneel','hero_kneel_front_3outfits'),('run','hero_run_away_back_3outfits'),('crawl','hero_crawl_back_3outfits')]:
    a=np.array(Image.open(CH/'poses'/(f+'.png')).convert('RGBA'));cuts=split_cols(a,3)
    for i,o in enumerate(OUTFITS):
        cell=np.zeros_like(a);cell[:,cuts[i]:cuts[i+1]]=a[:,cuts[i]:cuts[i+1]]
        manifest[f'hero_{o}_{pose}']=save(clean(cell),f'hero_{o}_{pose}')
men=[('men_set1_casual',[0,1,2,3],1),('men_set2_casual',[0,1,2,3],5),('men_unsorted_casual_a',[2,3],9)]
for f,pick,start in men:
    a=np.array(Image.open(CH/'npcs/large'/(f+'.png')).convert('RGBA'));cuts=split_cols(a,4)
    for j,i in enumerate(pick):
        cell=np.zeros_like(a);cell[:,cuts[i]:cuts[i+1]]=a[:,cuts[i]:cuts[i+1]]
        manifest[f'man_{start+j:02}']=save(largest(clean(cell)),f'man_{start+j:02}')
(OUT/'manifest.json').write_text(json.dumps(manifest,indent=1))
print(len(manifest),'figures')
