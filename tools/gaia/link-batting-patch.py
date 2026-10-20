#!/usr/bin/env python3
"""Link conveyor batting into the host + failure/abandon rules (build R25).
Usage: link-batting-patch.py WORKDIR(extracted scripts) REPO_ROOT
 - rooms: centre gear rooms -> ['rope','batting'], company private offices -> [1,'batting'] (choice buttons appear)
 - stat tables: batting {ge9,ki4,bo4,um3}; squat rebalanced {um8,ge5,bo4,ki3} (5F harmony with balance game)
 - any room game that FAILS (not cylinder/rope/water, which already have their own penalty) -> spanking-penalty mini game
   (the cylinder doc in penalty-only mode, 10 s tap challenge). Penalty cleared: HP -3, failed: HP -5, fail reward as before.
 - leaving a game by back/close before it is done: extra HP -5
 - tap goal 40 -> 50 everywhere (defaults + migration of saves still at 40)"""
import sys,json
from pathlib import Path
W=Path(sys.argv[1]);R=Path(sys.argv[2])
def rd(n):return (W/n).read_text(encoding='utf8')
def wr(n,s):(W/n).write_text(s,encoding='utf8')
def sub(s,old,new,n=1):
    assert s.count(old)==n,(old[:90],s.count(old))
    return s.replace(old,new)
def enc(v):return json.dumps(v).replace('<','\\u003c')
# ---- script-02: suite doc penalty default
t=rd('script-02.js');t=sub(t,'GAME_CONFIG.cylinder?.penaltyGoal||40','GAME_CONFIG.cylinder?.penaltyGoal||50');wr('script-02.js',t)
# ---- script-07: rooms + stat tables
s=rd('script-07.js')
s=sub(s,"if(m)m.games=['squat'];}","if(m)m.games=['squat'];}\n FLOORS.forEach(f=>f.rooms.forEach(r=>{if(f.place==='center'&&r.kind==='gear')r.games=['rope','batting'];else if(f.place==='company'&&r.kind==='privateOffice')r.games=[1,'batting'];}));")
s=sub(s,"squat:{ki:6,bo:8,um:4,ge:2}","squat:{um:8,ge:5,bo:4,ki:3},batting:{ge:9,ki:4,bo:4,um:3}")
wr('script-07.js',s)
# ---- script-13: batting document, city doc penalty-only mode, goal 50
s=rd('script-13.js')
key='const CITY_ENCOUNTER_DOCUMENT='
i=s.index(key)+len(key);city,end=json.JSONDecoder().raw_decode(s[i:])
city=sub(city,"GAME_CONFIG.cylinder?.penaltyGoal||40","GAME_CONFIG.cylinder?.penaltyGoal||50")
city=sub(city,"else overlay(titles[kind],'','시작',begin);","else if(!GAME_CONFIG.penaltyOnly)overlay(titles[kind],'','시작',begin);")
city=sub(city,"window.CylinderArtReady=artReady;requestAnimationFrame(tick);","window.CylinderArtReady=artReady;requestAnimationFrame(tick);if(GAME_CONFIG.penaltyOnly){initialResult=GAME_CONFIG.penaltyFor||{score:0,ratio:0};startPenalty(1);}")
bat=(R/'modules/minigames/minigame-conveyor-batting.html').read_text(encoding='utf8')
s=s[:i]+enc(city)+s[i+end:]
s=sub(s,key,'const BATTING_DOCUMENT='+enc(bat)+';\n'+key)
s=sub(s,"host.life.battle?.penaltyGoal||40","host.life.battle?.penaltyGoal||50")
wr('script-13.js',s)
# ---- script-16: host rules
s=rd('script-16.js')
s=sub(s,"squat:'스쿼트'}[g]","squat:'스쿼트',batting:'배팅'}[g]")
n=s.count("life.battle||={goal:500,penaltyGoal:40,penalty:true};");assert n>=1,n
s=s.replace("life.battle||={goal:500,penaltyGoal:40,penalty:true};","life.battle||={goal:500,penaltyGoal:50,penalty:true};if(life.battle.penaltyGoal===40)life.battle.penaltyGoal=50;")
assert s.count("penaltyGoal:40")>=1;s=s.replace("penaltyGoal:40","penaltyGoal:50")
helpers="""function battingConfig(){const p=place();return{location:p==='company'?'company':p==='street'?'street':'center',difficulty:Math.min(3,Math.max(1,life.battle.difficulty||1)+((session&&session.night)||(roomContext&&roomContext.challenge)?1:0)),tapStart:true,goal:null};}
function injectBatting(doc,config){const boot='<script>window.GAME_SCENE='+JSON.stringify(config).replace(/</g,'\\\\u003c')+';window.LifeMini={pause(v){try{BattingGame.pause(!!v)}catch{}},get paused(){try{return BattingGame.state.paused}catch{return false}}};<'+'/script>';return doc.replace('<meta',boot+'<meta');}
function roomNeedsPenalty(d){if(!session||session.done||session.pending||d.penalty)return false;if(['cylinder','rope','water'].includes(session.game))return false;const ratio=Math.max(0,Math.min(1,+d.ratio||0));return !(d.success??ratio>=.4);}
function startRoomPenalty(d){session.pending=d;const r=roomContext.r,config={outfit:world.outfit,kind:'cylinder',roomId:r.id,autoStart:false,penaltyOnly:true,penaltyFor:{score:d.score||0,ratio:+d.ratio||0},cityEncounter:false,cylinder:{goal:1,penaltyGoal:Math.max(10,Math.min(100,life.battle.penaltyGoal||50)),duration:20,difficulty:1,penalty:true},audio:[],layout:{portrait:{},landscape:{},targets:{}},background:ART['bg/'+r.bg],cityBefore:CITY_EXTRAS[world.outfit+'/before'],cityPlay:CITY_EXTRAS[world.outfit+'/play'],cityMint:'url('+DialoguePresentation.assets.mintSmall+')',cityButton:ROOM_ART.ui.button};const doc=CITY_ENCOUNTER_DOCUMENT.replace('/*LIFE_CONFIG*/',JSON.stringify(config).replace(/</g,'\\\\u003c'));$('#miniFrame').srcdoc=injectGame(doc,config);}
function roomPenaltyDone(d){const p=session.pending;session.pending=null;reward(p);const loss=d.success?3:5;world.hp=Math.max(0,world.hp-loss);toast('맴매 '+(d.success?'버팀':'실패')+' · 체력 −'+loss);hud();save();}
function squatConfig(){"""
s=sub(s,"function squatConfig(){",helpers)
s=sub(s,"if(bk&&ART[bk])config.background=ART[bk];}const doc=","if(bk&&ART[bk])config.background=ART[bk];}if(game==='batting')config.batting=battingConfig();const doc=")
s=sub(s,"$('#miniFrame').srcdoc=injectGame(doc,config);}\nfunction endGame(){","$('#miniFrame').srcdoc=game==='batting'?injectBatting(BATTING_DOCUMENT,config):injectGame(doc,config);}\nfunction endGame(){")
s=sub(s,"if(d?.type==='wellness-result'){reward(d);}","if(d?.type==='wellness-result'){if(session&&session.pending&&d.penalty)roomPenaltyDone(d);else if(roomNeedsPenalty(d))startRoomPenalty(d);else reward(d);}")
s=sub(s,"score:'중단'});life.history=life.history.slice(0,160);tickTime(1);}","score:'중단'});life.history=life.history.slice(0,160);world.hp=Math.max(0,world.hp-5);toast('포기 · 체력 −5');hud();tickTime(1);}")
wr('script-16.js',s)
print('linked')
