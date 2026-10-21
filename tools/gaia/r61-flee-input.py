#!/usr/bin/env python3
"""R61: dispose street encounters and stale flee UI before restoring field input."""
from pathlib import Path
import sys,hashlib
p=Path(sys.argv[1]) if len(sys.argv)>1 else Path(__file__).resolve().parents[2]/'GAIA-LIFE-20261020.html'
s=p.read_text()
if 'function cityDisposeFrame()' in s:raise SystemExit('R61 already applied')
def replace(old,new):
 global s
 assert s.count(old)==1,(old[:70],s.count(old));s=s.replace(old,new)
replace('function fleeClose(){if(fleeBox){fleeBox.remove();fleeBox=null;}}', '''let cityEncounterSequence=0,fleeTimer=0;
function fleeClose(){clearTimeout(fleeTimer);fleeTimer=0;for(const el of document.querySelectorAll('#cityFlee')){el.style.pointerEvents='none';el.remove();}fleeBox=null;}
function cityDisposeFrame(){const old=$('#miniFrame');try{old.contentWindow.LifeMini?.pause(true);old.contentDocument?.querySelectorAll('audio,video').forEach(m=>m.pause());old.contentWindow.blur();}catch{}const fresh=old.cloneNode(false);fresh.removeAttribute('src');fresh.srcdoc='';old.replaceWith(fresh);}
function cityRestoreField(){++cityEncounterSequence;fleeClose();fleePaused=false;document.querySelector('#pleaScene')?.remove();try{cityDisposeFrame();}catch(err){console.error('street frame cleanup failed',err);}try{window.GaiaAudioStatus?.reset();}catch{}mode='field';roomContext=null;session=null;$('#roomScene').hidden=true;$('#fieldUI').hidden=false;restoreFieldInput();try{canvas.tabIndex=-1;canvas.focus({preventScroll:true});}catch{}flowHUD();}''')
replace("setTimeout(()=>{fleeClose();fleePaused=false;CityTravel.settle({success:false,penalty:false,fled:true,taps:0});},1500);", "const encounterId=enc.id;fleeTimer=setTimeout(()=>{fleeTimer=0;if(CityTravel.encounter?.id!==encounterId){fleeClose();return;}CityTravel.settle({success:false,penalty:false,fled:true,taps:0});},1500);")
replace("async function cityEncounter(options,extra={}){if(!extra.retry)cityBump=0;", "async function cityEncounter(options,extra={}){const encounterSequence=++cityEncounterSequence;fleeClose();fleePaused=false;if(extra.retry&&CityTravel.encounter)delete CityTravel.encounter.result;cityDisposeFrame();if(!extra.retry)cityBump=0;")
replace("if(CityTravel.encounter?.id!==options.id)return;try{", "if(encounterSequence!==cityEncounterSequence||CityTravel.encounter?.id!==options.id||mode!=='game')return;try{")
a=s.index('function cityResolve(result){');b=s.index('\n/* Lives inside the current GameHost',a)
old=s[a:b]
new='''function cityResolve(result){let great=false,gainText='';try{if(!life.processed.includes(result.id)){life.processed.push(result.id);const hpLoss=result.penalty?(result.success?3:5):0;world.hp=Math.max(0,world.hp-hpLoss);great=!!(result.success&&!result.penalty&&(result.score||0)>=1100);const gold=result.success?(great?18:12):0;life.gold+=gold;const gained=result.success?L.randomPair():[];for(const k of gained)life.stats[k]=Math.min(100,(life.stats[k]||0)+1);gainText=gained.map(k=>STAT_NAMES[k]+' +1').join(' · ');life.history.unshift({id:result.id,game:'cylinder',day:life.day,room:'거리',routeId:result.routeId,distance:result.distance,score:result.penalty?(result.taps||0)+' / '+(result.goal||life.battle.penaltyGoal):String(result.score||0),success:!!result.success,gold,hpLoss,penalty:!!result.penalty,cancelled:!!result.cancelled,fled:!!result.fled});life.history=life.history.slice(0,160);}}finally{cityRestoreField();}
 save();toast(result.fled?'도망쳤습니다 · 보상 없음':result.success?(result.penalty?'체력 -3 · 보상 +12 G · '+gainText:(great?'우수! 보상 +18 G · ':'보상 +12 G · ')+gainText):'체력 -5 · 보상 없음');
}
'''
s=s[:a]+new+s[b:]
p.write_text(s)
print(p,len(s.encode()),hashlib.sha256(s.encode()).hexdigest())
