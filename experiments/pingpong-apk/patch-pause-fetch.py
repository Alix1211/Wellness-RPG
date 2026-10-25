"""Apply the focused hotfix to a restored 2026102504 OTA HTML, preserving assets."""
from pathlib import Path
import argparse, json, re

p = argparse.ArgumentParser()
p.add_argument('input')
p.add_argument('output')
a = p.parse_args()
s = Path(a.input).read_text()
anchor = 'const EMBEDDED_MATCH='
start = s.index(anchor) + len(anchor)
match, end = json.JSONDecoder().raw_decode(s[start:])
clock = Path(__file__).with_name('match-pause-clock.js').read_text()
assert 'id="gaia-match-pause-clock"' not in match
match = match.replace('<head>', '<head><script id="gaia-match-pause-clock">'+clock+'</script>', 1)
old = '  lastTime = now;\n  if(enemyPresentationTick(presentationDt))'
assert match.count(old) == 1
match = match.replace(old, '  lastTime = now;\n  if(careerPaused || menuOpen){renderer.render(scene,camera);return;}\n  if(enemyPresentationTick(presentationDt))', 1)
old = "e.origin!==location.origin||e.data?.token!==careerToken||e.data.type!=='gaia-pause'"
assert match.count(old) == 1
match = match.replace(old, "e.origin!==new URL(document.baseURI).origin||e.data?.token!==careerToken||e.data.type!=='gaia-pause'", 1)
old = 'careerPaused=true;menuOpen=true;gameStateBeforeMenu=gameState;'
assert match.count(old) == 1
match = match.replace(old, 'careerPaused=true;menuOpen=true;gameStateBeforeMenu=gameState;releaseHeldSpin();window.GaiaMatchClock.setPaused(true);document.documentElement.getAnimations({subtree:true}).forEach(a=>{if(a.playState===\'running\'){a.pause();a.gaiaPaused=true;}});', 1)
old = 'careerPaused=false;menuOpen=false;if(audioCtx)'
assert match.count(old) == 1
match = match.replace(old, 'window.GaiaMatchClock.setPaused(false);careerPaused=false;menuOpen=false;lastTime=performance.now();document.documentElement.getAnimations({subtree:true}).forEach(a=>{if(a.gaiaPaused){a.gaiaPaused=false;a.play();}});if(audioCtx)', 1)
s = s[:start] + json.dumps(match,ensure_ascii=False).replace('<','\\u003c') + s[start+end:]
start = s.index('const MINI_POOL=') + len('const MINI_POOL=')
pool, end = json.JSONDecoder().raw_decode(s[start:])
old = 'this.w=540*r.width/r.height;this.x=Math.min(252,this.w*.30);this.c.width=Math.round(this.w*2);this.c.height=1080;'
new = 'this.h=innerHeight>innerWidth?1080:540;this.floor=414*this.h/540;this.w=this.h*r.width/r.height;this.x=Math.min(252,this.w*.30);this.c.width=Math.round(this.w*2);this.c.height=this.h*2;'
hits = 0
for i, code in enumerate(pool):
    if 'class FetchGame' in code:
        assert code.count(old) == 1
        pool[i] = code.replace(old,new,1)
        hits += 1
assert hits == 1
s = s[:start] + json.dumps(pool,ensure_ascii=False,separators=(',',':')).replace('<','\\u003c') + s[start+end:]
Path(a.output).write_text(s)
print('Patched match pause and portrait Fetch zoom (50%).')
