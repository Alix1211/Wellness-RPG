# 단일 HTML 빌드: python3 tools/build_single.py [출력경로]  (gaia-detective 폴더에서 실행)
import re, base64, os, sys
G='../assets/gaia-detective/game/'; CARDS='../assets/gaia-detective/cards/'
out=sys.argv[1] if len(sys.argv)>1 else 'GAIA_CITY_DETECTIVE.html'
html=open('index.html',encoding='utf-8').read()
html=html.replace('<link rel="stylesheet" href="style.css">','<style>'+open('style.css',encoding='utf-8').read()+'</style>')
def b64(path,mime): return 'data:%s;base64,%s'%(mime,base64.b64encode(open(path,'rb').read()).decode())
imgs={}
for f in os.listdir(G):
    if f.endswith(('.png','.jpg')): imgs[f]=b64(G+f,'image/jpeg' if f.endswith('.jpg') else 'image/png')
for f in os.listdir(CARDS):
    if f.endswith('.webp'): imgs['cards/'+f]=b64(CARDS+f,'image/webp')
pre='window.GAIA_IMG={'+','.join('"%s":"%s"'%(k,v) for k,v in sorted(imgs.items()))+'};\n'
for m in re.finditer(r'<script src="([^"]+)"></script>',html):
    s=open(m.group(1),encoding='utf-8').read()
    if m.group(1)=='data/config.js': s=pre+s
    html=html.replace(m.group(0),'<script>'+s+'</script>')
reps=[("A.base + A.hero[k]","(window.GAIA_IMG[A.hero[k]]||'')"),
("A.base + e.def.sprite + '.png'","(window.GAIA_IMG[e.def.sprite + '.png']||'')"),
("'url(' + A.base + A.bg[(bgN++) % A.bg.length] + ')'","'url(' + (window.GAIA_IMG[A.bg[(bgN++) % A.bg.length]]||'') + ')'")]
for a,b in reps:
    assert a in html,a; html=html.replace(a,b)
open(out,'w',encoding='utf-8').write(html); print(out, os.path.getsize(out)//1024,'KB')
