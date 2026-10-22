# 단일 HTML 빌드: python3 tools/build_single.py [출력경로]  (gaia-detective 폴더에서 실행)
import re, base64, os, sys
G='../assets/gaia-detective/game/'; CARDS='../assets/gaia-detective/cards/'; BG='../assets/gaia-detective/bg/'; BUB='../assets/gaia-detective/ui/bubbles/'; SFX='../assets/gaia-detective/sfx/'
out=sys.argv[1] if len(sys.argv)>1 else 'GAIA_CITY_DETECTIVE.html'
html=open('index.html',encoding='utf-8').read()
html=html.replace('<link rel="stylesheet" href="style.css">','<style>'+open('style.css',encoding='utf-8').read()+'</style>')
def b64(path,mime): return 'data:%s;base64,%s'%(mime,base64.b64encode(open(path,'rb').read()).decode())
imgs={}
for f in os.listdir(G):
    if f.endswith(('.png','.jpg')): imgs[f]=b64(G+f,'image/jpeg' if f.endswith('.jpg') else 'image/png')
for f in os.listdir(CARDS):
    if f.endswith('.webp'): imgs['cards/'+f]=b64(CARDS+f,'image/webp')
BGV='../assets/gaia-detective/bg/v2/'
import io
from PIL import Image
for f in sorted(os.listdir(BGV)):
    if f.endswith('.jpg'):
        buf=io.BytesIO(); Image.open(BGV+f).convert('RGB').save(buf,'WEBP',quality=80,method=6)
        imgs['bg/v2/'+f[:-4]+'.webp']='data:image/webp;base64,'+base64.b64encode(buf.getvalue()).decode()
for f in (os.listdir(BUB) if os.path.isdir(BUB) else []):
    if f.endswith('.png'): imgs['ui/bubbles/'+f]=b64(BUB+f,'image/png')
MAP='../assets/gaia-detective/map/layers/'
for f in (os.listdir(MAP) if os.path.isdir(MAP) else []):
    if f.endswith('.webp'): imgs['map/'+f]=b64(MAP+f,'image/webp')
ICO='../assets/gaia-detective/ui/icons/'
for f in (os.listdir(ICO) if os.path.isdir(ICO) else []):
    if f.endswith('.png'): imgs['ui/icons/'+f]=b64(ICO+f,'image/png')
CARDUI='../assets/gaia-detective/ui/card/'
for f in (os.listdir(CARDUI) if os.path.isdir(CARDUI) else []):
    if f.endswith('.webp'): imgs['ui/card/'+f]=b64(CARDUI+f,'image/webp')
SKIN='../assets/gaia-detective/ui/skin/'
for f in (os.listdir(SKIN) if os.path.isdir(SKIN) else []):
    if f.endswith('.webp'): imgs['ui/skin/'+f]=b64(SKIN+f,'image/webp')
ITEMS='../assets/gaia-detective/ui/items/'
for f in (os.listdir(ITEMS) if os.path.isdir(ITEMS) else []):
    if f.endswith('.webp'): imgs['ui/items/'+f]=b64(ITEMS+f,'image/webp')
CLERK='../assets/gaia-detective/ui/clerk/'
for f in (os.listdir(CLERK) if os.path.isdir(CLERK) else []):
    if f.endswith('.webp'): imgs['ui/clerk/'+f]=b64(CLERK+f,'image/webp')
SLOTD='../assets/gaia-detective/ui/slot/'
for f in (os.listdir(SLOTD) if os.path.isdir(SLOTD) else []):
    if f.endswith('.webp'): imgs['ui/slot/'+f]=b64(SLOTD+f,'image/webp')
PLACE='../assets/gaia-detective/place/'
for k in ('mart','casino','police','studio','park','villa','club','farm'):
    for o in ('port','land'):
        if os.path.exists(PLACE+k+'_'+o+'.webp'): imgs['place/'+k+'_'+o+'.webp']=b64(PLACE+k+'_'+o+'.webp','image/webp')
MG='../assets/gaia-detective/minigame/squat_home/'
for f in ('squat_front_sheet_1650x912.webp','squat_back_sheet_1650x912.webp','ball.webp','stand.png'):
    imgs['minigame/squat_home/'+f]=b64(MG+f,'image/webp' if f.endswith('.webp') else 'image/png')
for f in ('ph','pp','fs','fo'): imgs['minigame/squat_home/fx/'+f+'.webp']=b64(MG+'fx/'+f+'.webp','image/webp')
BT='../assets/gaia-detective/minigame/batting_police/'
for f in sorted(os.listdir(BT)):
    if f.endswith('.png'): imgs['minigame/batting_police/'+f]=b64(BT+f,'image/png')
for f in ('police_2','police_4'): imgs['npc/police/'+f+'.webp']=b64('../assets/gaia-detective/npc/police/'+f+'.webp','image/webp')
FXD='../assets/gaia-detective/ui/fx/'
for f in (sorted(os.listdir(FXD)) if os.path.isdir(FXD) else []):
    if f.endswith('.webp'): imgs['ui/fx/'+f]=b64(FXD+f,'image/webp')
for k in ('police',):
    for o in ('port','land'):
        if os.path.exists(PLACE+k+'_'+o+'.webp'): imgs['place/'+k+'_'+o+'.webp']=b64(PLACE+k+'_'+o+'.webp','image/webp')
import json as _json
docs={'batting':open(BT+'game.html',encoding='utf-8').read()}
docjs='window.GAIA_DOC='+_json.dumps(docs,ensure_ascii=False).replace('</','<\\/')+';\n'
minid={os.path.splitext(f)[0]:b64(MG+'snd/'+f,'audio/ogg') for f in sorted(os.listdir(MG+'snd'))}
PUNCH='../assets/audio/freesound_community-face-punch-91909.mp3'
sfxd={os.path.splitext(f)[0]:b64(SFX+f,'audio/ogg' if f.endswith('.ogg') else 'audio/mpeg') for f in sorted(os.listdir(SFX)) if os.path.isfile(SFX+f)} if os.path.isdir(SFX) else {}
STM=SFX+'steam/'
stmd={}
for sub in ('voice','results','bgm'):
    if os.path.isdir(STM+sub):
        for f in sorted(os.listdir(STM+sub)):
            if f.endswith('.ogg'): stmd[sub+'/'+f[:-4]]=b64(STM+sub+'/'+f,'audio/ogg')
snd='window.GAIA_SND={"punch":"%s","sfx":{%s},"mini":{%s},"stm":{%s}};\n'%(b64(PUNCH,'audio/mpeg') if os.path.exists(PUNCH) else '', ','.join('"%s":"%s"'%(k,v) for k,v in sfxd.items()), ','.join('"%s":"%s"'%(k,v) for k,v in minid.items()), ','.join('"%s":"%s"'%(k,v) for k,v in stmd.items()))
pre=snd+docjs+'window.GAIA_IMG={'+','.join('"%s":"%s"'%(k,v) for k,v in sorted(imgs.items()))+'};\n'
for m in re.finditer(r'<script src="([^"]+)"></script>',html):
    s=open(m.group(1),encoding='utf-8').read()
    if m.group(1)=='data/config.js': s=pre+s
    html=html.replace(m.group(0),'<script>'+s+'</script>')
reps=[("A.base + A.hero[k]","(window.GAIA_IMG[A.hero[k]]||'')"),
("A.base + e.def.sprite + '.png'","(window.GAIA_IMG[e.def.sprite + '.png']||'')")]
for a,b in reps:
    assert a in html,a; html=html.replace(a,b)
open(out,'w',encoding='utf-8').write(html); print(out, os.path.getsize(out)//1024,'KB')
