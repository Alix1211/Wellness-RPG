#!/usr/bin/env python3
"""Conveyor batting R6 (on top of R5): embedded (host) mode shows only necessary information.
 - landscape world height 1000 -> LANDH (characters no longer smaller than portrait)
 - tapStart (host) mode: no brand/title/place/difficulty, intro = host-provided plea line + start button,
   goal line = '목표 N m', result = title + distance + close only
Usage: batting-r6-patch.py [HTML]"""
import sys
from pathlib import Path
R=Path(__file__).resolve().parents[2]
P=Path(sys.argv[1]) if len(sys.argv)>1 else R/'modules/minigames/minigame-conveyor-batting.html'
s=P.read_text(encoding='utf8')
def sub(old,new,n=1):
    global s
    assert s.count(old)==n,(old[:80],s.count(old))
    s=s.replace(old,new)
sub("if(wide){H=1000;W=r.width/r.height*H;}","if(wide){H=LANDH;W=r.width/r.height*H;}")
sub("const RING={R0:250,","const LANDH=760;\nconst RING={R0:250,")
sub("<p>“저도 도전! 멀리 보내 주세요~!”</p>","<p id=\"pleaLine\">“저도 도전! 멀리 보내 주세요~!”</p>")
sub("body.embedded .hint{display:none}","body.embedded .hint{display:none}body.tap .head,body.tap #intro .brand,body.tap #intro .crest,body.tap #intro h1,body.tap #result .crest,body.tap #result .ribbon,body.tap #result .summary,body.tap #result p{display:none}body.tap .score-row{margin-top:0}body.tap #pleaLine{font-size:22px;font-weight:850;color:var(--ink);margin:4px 0 6px;letter-spacing:-.04em}")
sub("$('again').hidden=true;}else $('intro').hidden=true;","$('again').hidden=true;document.body.classList.add('tap');if(HOST().plea)$('pleaLine').textContent=HOST().plea;}else $('intro').hidden=true;")
sub("$('goal').textContent=place.name+' · '+['','쉬움','보통','어려움'][CFG.difficulty]+' · 목표 '+goal()+'m';","$('goal').textContent=(HOST().tapStart?'':place.name+' · '+['','쉬움','보통','어려움'][CFG.difficulty]+' · ')+'목표 '+goal()+'m';")
P.write_text(s,encoding='utf8');print('patched',len(s))
