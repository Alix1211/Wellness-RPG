#!/usr/bin/env python3
"""R26: street encounters pick one of cylinder / squat / batting at random; squat+batting results are adapted to the
travel settle (success -> reward, fail -> spanking penalty then settle, back -> existing flee card). Also 6F stat harmony
(back-looking game ge8 ki5 um3 bo2). Usage: street-three-patch.py WORKDIR"""
import sys
from pathlib import Path
W=Path(sys.argv[1])
def rd(n):return (W/n).read_text(encoding='utf8')
def wr(n,s):(W/n).write_text(s,encoding='utf8')
def sub(s,old,new,n=1):
    assert s.count(old)==n,(old[:90],s.count(old))
    return s.replace(old,new)
s=rd('script-07.js');s=sub(s,"4:{ge:8,um:5,bo:4,ki:2}","4:{ge:8,ki:5,um:3,bo:2}");wr('script-07.js',s)
s=rd('script-16.js')
s=sub(s,"function battingConfig(){","let cityKind='cylinder';\nfunction battingConfig(){")
s=sub(s,"get paused(){try{return BattingGame.state.paused}","get started(){return true},get paused(){try{return BattingGame.state.paused}")
s=sub(s,"function startRoomPenalty(d){session.pending=d;const r=roomContext.r,","function startRoomPenalty(d){session.pending=d;launchPenalty(d);}\nfunction startStreetPenalty(d){launchPenalty(d);}\nfunction launchPenalty(d){const r=roomContext.r,")
branch=r"""cityKind=['cylinder','squat','batting'][Math.floor(Math.random()*3)];if(cityKind!=='cylinder'){const c2={outfit:options.outfit,kind:cityKind,roomId:r.id,autoStart:true,audio:[],controlArt:{run:ROOM_ART.ui.action,jump:ROOM_ART.ui.jump},cylinder:{...life.battle},layout,background:ART['bg/../city/park'],difficultyMultiplier:1};if(cityKind==='squat'){c2.squat=squatConfig();const bk=c2.squat.bgKey;if(bk&&ART[bk])c2.background=ART[bk];$('#miniFrame').srcdoc=injectGame(SQUAT_DOCUMENT.replace('/*LIFE_CONFIG*/',JSON.stringify(c2).replace(/</g,'\\u003c')),c2);}else{c2.batting=battingConfig();c2.batting.difficulty=Math.min(3,(life.battle.difficulty||1)+cityBump);$('#miniFrame').srcdoc=injectBatting(BATTING_DOCUMENT,c2);}return;}
"""
s=sub(s,"if(CityTravel.encounter?.id!==options.id)return;try{\n const config={outfit:options.outfit,kind:'cylinder'","if(CityTravel.encounter?.id!==options.id)return;try{\n"+branch+" const config={outfit:options.outfit,kind:'cylinder'")
hand=r"""if(CityTravel.encounter){if(cityKind!=='cylinder'&&d?.type==='wellness-result'){const en=CityTravel.encounter;if(en.result)return;if(d.penalty)en.result={...d,type:'city-route-result',success:!!d.success,penalty:true};else if(d.success??(+d.ratio>=.4))en.result={type:'city-route-result',success:true,penalty:false,score:(+d.ratio>=.8?1100:800),ratio:+d.ratio||0};else startStreetPenalty(d);return;}"""
s=sub(s,"if(CityTravel.encounter){if(d?.type==='city-route-result')",hand+"if(d?.type==='city-route-result')")
wr('script-16.js',s);print('street patched')
