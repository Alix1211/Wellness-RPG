#!/usr/bin/env python3
"""R28 (on top of R27 scripts): usage r28-patch.py WORKDIR REPO_ROOT
 - water-gun sound louder: assets/audio/toilet_bed_loop.ogg normalised (mean -22 -> about -17 dB), playback gain .55 -> .6
 - rooms with 2+ games are split: centre 3F gear rooms rope / batting / rope, company 3F private offices sausage(1) / batting"""
import sys,json,base64
from pathlib import Path
W=Path(sys.argv[1]);R=Path(sys.argv[2])
def rd(n):return (W/n).read_text(encoding='utf8')
def wr(n,s):(W/n).write_text(s,encoding='utf8')
def sub(s,old,new,n=1):
    assert s.count(old)==n,(old[:90],s.count(old))
    return s.replace(old,new)
s=rd('script-19.js')
key='window.GAIA_SOUND_SOURCES='
i=s.index(key)+len(key);d,end=json.JSONDecoder().raw_decode(s[i:])
assert d['water_shoot'].startswith('data:audio/ogg;base64,')
d['water_shoot']='data:audio/ogg;base64,'+base64.b64encode((R/'assets/audio/toilet_bed_loop.ogg').read_bytes()).decode()
s=s[:i]+json.dumps(d,separators=(',',':'),ensure_ascii=False).replace('<','\\u003c')+s[i+end:]
s=sub(s,"linearRampToValueAtTime(.55,t+.03)","linearRampToValueAtTime(.6,t+.03)")
wr('script-19.js',s)
s=rd('script-07.js')
s=sub(s,"FLOORS.forEach(f=>f.rooms.forEach(r=>{if(f.place==='center'&&r.kind==='gear')r.games=['rope','batting'];else if(f.place==='company'&&r.kind==='privateOffice')r.games=[1,'batting'];}));","FLOORS.forEach(f=>{let gi=0,pi=0;f.rooms.forEach(r=>{if(f.place==='center'&&r.kind==='gear')r.games=[['rope','batting','rope'][gi++%3]];else if(f.place==='company'&&r.kind==='privateOffice')r.games=[[1,'batting'][pi++%2]];});});")
wr('script-07.js',s)
# runtime source copy
p=R/'src/gaia-life/native-audio-runtime.js';t=p.read_text(encoding='utf8');t=sub(t,"linearRampToValueAtTime(.55,t+.03)","linearRampToValueAtTime(.6,t+.03)");p.write_text(t,encoding='utf8')
print('r28 patched')
