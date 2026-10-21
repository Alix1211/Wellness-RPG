#!/usr/bin/env python3
"""Build the isolated casual edition using the supplied R61 assets/game factories.
Original source and RPG saves are never overwritten. Output is self-contained.
"""
from pathlib import Path
import re,hashlib,json
root=Path(__file__).resolve().parents[1];here=Path(__file__).resolve().parent
source=root/'GAIA-LIFE-20261020.html';s=source.read_text()
assert hashlib.sha256(source.read_bytes()).hexdigest()=='e977dd33bbe5ddc2b4d4df86fa7c423e072f21d066b536efc83cec78443f1f66','Restore the recorded R61 baseline before building.'
a="CorridorDecor.bind(window.GameHost,canvas);resize();addEventListener('resize',resize);load().catch(e=>{console.error(e);$('#loading').textContent='불러오기 실패';});requestAnimationFrame(frame);"
assert s.count(a)==1;s=s.replace(a,(here/'factory.js').read_text())
s=s.replace("function save(){life.location=", "function save(){return;life.location=")
s=s.replace("KEY='gaia-rpg-road-v1',oldWorld='gaia-rpg-road-world-v1'", "KEY='gaia-casual-unused-rpg',oldWorld='gaia-casual-unused-world'")
# Never read old RPG fallback slots in this edition, even during factory setup.
s=s.replace("localStorage.getItem('gaia-rpg-rebuild-v12')",'null').replace("localStorage.getItem('gaia-rpg-play-v11')",'null').replace("localStorage.getItem('wellness-rpg-center-v1')",'null')
s=s.replace("if(e.source!==$('#miniFrame').contentWindow||mode!=='game')","if(mode!=='game'||e.source!==$('#miniFrame')?.contentWindow)")
# Register the already-embedded Korean font for the new shell.
font_script='<script>document.head.insertAdjacentHTML("beforeend","<style>"+GAME_SKIN.match(/@font-face\\s*\\{[^}]*\\}/g).join("\\n")+"</style>");</script>'
# Keep the old DOM for inert factory references, but avoid duplicate frame IDs.
s=s.replace('id="miniFrame"','id="rpgMiniFrame"')
pos=s.rfind('</body>');assert pos>0
s=s[:pos]+font_script+(here/'shell.html').read_text()+'<script>\n'+(here/'app.js').read_text()+'\n</script>'+s[pos:]
s=s.replace('<title>GAIA', '<title>GAIA CASUAL')
output=root/'GAIA-CASUAL-02.html';output.write_text(s)
data=output.read_bytes();manifest={'build':'CASUAL-02','size':len(data),'sha256':hashlib.sha256(data).hexdigest(),'baseline':'R61','edition':'casual','storageKey':'gaia-casual-save-v1'}
(here/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n');print(json.dumps(manifest))
