#!/usr/bin/env python3
"""Conveyor batting R5 (apply on top of R4): embedded-in-host mode. Reads config from window.GAME_SCENE.batting,
sound works inside the host iframe, a tap-to-start intro (audio needs a gesture), result card with close, pause card works.
Usage: batting-r5-patch.py [HTML]"""
import sys
from pathlib import Path
R=Path(__file__).resolve().parents[2]
P=Path(sys.argv[1]) if len(sys.argv)>1 else R/'modules/minigames/minigame-conveyor-batting.html'
s=P.read_text(encoding='utf8')
def sub(old,new,n=1):
    global s
    assert s.count(old)==n,(old[:80],s.count(old))
    s=s.replace(old,new)
sub("const CFG=Object.assign({roomId:'test',kind:'batting',location:'center',difficulty:1,goal:null,images:[],lines:{}},window.GAME_CONFIG||{});",
"const HOST=()=>window.GAME_CONFIG||(window.GAME_SCENE&&window.GAME_SCENE.batting)||{};\nconst CFG=Object.assign({roomId:'test',kind:'batting',location:'center',difficulty:1,goal:null,images:[],lines:{}},HOST(),{roomId:(window.GAME_SCENE&&window.GAME_SCENE.roomId)||'test'});")
sub("Object.assign(CFG,window.GAME_CONFIG||{});","Object.assign(CFG,HOST());")
# sound also when embedded
sub("function unlock(){if(!solo||mute)return;","function unlock(){if(mute)return;")
sub("async function play(k,voice=false,fade=false){if(!solo||mute||document.hidden)return;","async function play(k,voice=false,fade=false){if(mute||document.hidden)return;")
sub("async function bgm(i,pos=0){if(!solo||mute||document.hidden)return false;","async function bgm(i,pos=0){if(mute||document.hidden)return false;")
sub("function resumeBgm(){if(!solo||mute||paused||","function resumeBgm(){if(mute||paused||")
sub("if(solo&&!mute){bgmWait=true;","if(!mute){bgmWait=true;")
# embedded: tap-to-start intro (no place/difficulty pickers), result card + pause card
sub("if(!solo){document.body.classList.add('embedded');$('intro').hidden=true;readyCount++;send('wellness-ready');}",
"if(!solo){document.body.classList.add('embedded');if(HOST().tapStart){$('locations').hidden=true;$('difficulties').hidden=true;$('again').hidden=true;}else $('intro').hidden=true;readyCount++;send('wellness-ready');}")
sub("if(solo){$('total').textContent=score;","if(solo||HOST().tapStart){$('total').textContent=score;")
sub("if(solo)$('paused').hidden=false;","if(solo||HOST().tapStart)$('paused').hidden=false;")
P.write_text(s,encoding='utf8');print('patched',len(s))
