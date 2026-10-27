from pathlib import Path
import re,base64,mimetypes

root=Path(__file__).resolve().parent
import json
def mini_assets():
    m={}
    for p in sorted((root/'assets/minigame').rglob('*'))+sorted((root/'assets/place').glob('*')):
        if not p.is_file():continue
        rel=p.relative_to(root/'assets').as_posix()
        if p.suffix=='.html':m[rel]=p.read_text()
        else:m[rel]='data:'+(mimetypes.guess_type(p.name)[0] or 'audio/ogg' if p.suffix!='.ogg' else 'audio/ogg')+';base64,'+base64.b64encode(p.read_bytes()).decode()
    (root/'js/mini-assets.js').write_text('window.MINI_ASSETS='+json.dumps(m,ensure_ascii=False).replace('</','<\\/')+';')
mini_assets()
html=(root/'index.html').read_text()
html=html.replace('<link rel="stylesheet" href="style.css">','<style>'+(root/'style.css').read_text()+'</style>')
html=re.sub(r'<script src="([^"]+)"></script>',lambda m:'<script>'+(root/m[1]).read_text()+'</script>',html)
refs=sorted(set(re.findall(r'assets/[A-Za-z0-9_./-]+\.(?:png|webp|jpg|mp3|ogg)',html)),key=len,reverse=True)
for ref in refs:
    p=root/ref
    if not p.exists():continue
    mime=mimetypes.guess_type(p.name)[0] or 'application/octet-stream'
    html=html.replace(ref,'data:'+mime+';base64,'+base64.b64encode(p.read_bytes()).decode())
out=root/'GAIA_Detective_All_Stages.html'
out.write_text(html)
print(out.name,out.stat().st_size,'bytes')
