#!/usr/bin/env python3
"""케인님 제작 얼굴 없는 NPC 시트(투명 배경)를 낱개 PNG로 자른다. 알파 연결 성분 기준, 좌->우 순서."""
from PIL import Image
import numpy as np
from scipy import ndimage as ndi
D='assets/characters/npcs/standing/'
def cut(sheet,names,rows=1):
    im=Image.open(D+sheet).convert('RGBA');a=np.array(im);m=a[:,:,3]>128
    lab,n=ndi.label(ndi.binary_opening(m,iterations=2));sz=ndi.sum(m,lab,range(1,n+1))
    ids=[i+1 for i in np.argsort(sz)[::-1][:len(names)]]
    objs=ndi.find_objects(lab);items=[]
    for i in ids:
        o=objs[i-1];items.append((o[0].start,o[1].start,i,o))
    H=im.height;items.sort(key=lambda t:(round(t[0]/(H/rows)-0.35) if rows>1 else 0,t[1]))
    if rows>1:
        top=[t for t in items if t[0]<H/rows*0.9];bot=[t for t in items if t not in top]
        items=sorted(top,key=lambda t:t[1])+sorted(bot,key=lambda t:t[1])
    for nm,(y,x,i,o) in zip(names,items):
        keep=ndi.binary_dilation(lab==i,iterations=3)
        sub=a[o[0],o[1]].copy();k=keep[o[0],o[1]];sub[:,:,3]=np.where(k,sub[:,:,3],0)
        c=Image.fromarray(sub);bb=c.getbbox();c.crop(bb).save(D+nm+'.png');print(nm,c.crop(bb).size)
cut('male4_casual_sheet.png',['m_hoodie_jeans','m_sweater_fat','m_tracksuit_olive_whip','m_blazer_navy'])
cut('male4_tracksuit_sheet.png',['m_tracksuit_green','m_tracksuit_purple','m_tracksuit_navy','m_tracksuit_orange'])
cut('women8_crawl_sheet.png',['w_office_brown_black','w_office_bun_green','w_office_pony_blue','w_office_curly_floral','w_yoga_blonde_white','w_yoga_bob_purple','w_yoga_pony_purple','w_yoga_bun_black'],rows=2)
