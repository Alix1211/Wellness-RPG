#!/usr/bin/env python3
"""R33: usage r33-patch.py WORKDIR (applied on top of r32)
Room = walkable map. Cast stands on the floor; walk up and press the check button to talk to that person only.
Entering a cast room no longer opens the dialogue screen by force."""
import sys
from pathlib import Path
W=Path(sys.argv[1])
def rd(n):return (W/n).read_text(encoding='utf8')
def wr(n,s):(W/n).write_text(s,encoding='utf8')
def sub(s,old,new,n=1):
    assert s.count(old)==n,(old[:80],s.count(old));return s.replace(old,new)
# ---- script-08: floor people come from a cast plan
s=rd('script-08.js')
s=sub(s,"function add(a,x,y,id,staff=false){","function add(a,x,y,id,staff=false,name=''){")
s=sub(s,"rng:r,staff,bounds:","rng:r,staff,name,bounds:")
s=sub(s,"  const r=f.rooms[scene.room],staffRole=company?'office':'trainer';","  const plan=root.CastPlan?.(scene,f.rooms[scene.room]);if(plan){plan.forEach((p,i)=>add(pool(p.role)[p.idx],p.x,p.y,i,!!p.staff,p.n));return list;}\n  const r=f.rooms[scene.room],staffRole=company?'office':'trainer';")
s=sub(s,"if(n.staff&&label){","if(label){")
wr('script-08.js',s)
# ---- script-16
s=rd('script-16.js')
# cast plan + nearest person
s=sub(s,"function castRender(r){","""window.CastPlan=(scene,r)=>{const k=castKey(r);return k?CAST_PLAN[k]:null;};
const CAST_PLAN={shop:[{n:'점원',role:'yoga-member',idx:0,x:820,y:575,staff:true},{n:'서하준',role:'trainer',idx:0,x:380,y:625}],bat:[{n:'이안',role:'trainer',idx:3,x:820,y:560,staff:true}],rope:[{n:'윤서',role:'trainer',idx:4,x:820,y:560,staff:true}]};
function castNearest(){const p=world.player,list=CenterLife.get(world.scene).filter(n=>n.name).map(n=>({name:n.name,d:Math.hypot(n.x-p.x,(n.y-p.y)*1.6)})).sort((a,b)=>a.d-b.d);return list[0]&&list[0].d<170?list[0]:null;}
function castRender(r){return;""")
s=sub(s,"roomContext.manSrc=ms;$('#malePortrait').src=ms;}castRender(r);","roomContext.manSrc=ms;$('#malePortrait').src=ms;}")
# door noise as a short toast, no explanatory prefix
s=sub(s,"nearClock=0;hud();save();if(world.scene.type==='room'&&(games(room()).length||nextStory(room())))openRoom(room());}","nearClock=0;hud();save();if(world.scene.type==='room'&&roomCastFor(room())){const nz=castNoise(room());if(nz)toast(nz.replace(/\\s+/g,' ').slice(0,60));return;}if(world.scene.type==='room'&&(games(room()).length||nextStory(room())))openRoom(room());}")
s=sub(s,"enterIndex(i);if(mode==='field')openRoom(room());}else toast('방 가까이 가세요');return;}openRoom(room());}","enterIndex(i);if(mode==='field'&&!roomCastFor(room()))openRoom(room());}else toast('방 가까이 가세요');return;}{const c=roomCastFor(room());if(c&&!soloHome()){const n=castNearest();if(n)openRoom(room(),{castPerson:n.name});else toast('말을 걸 사람 가까이 가세요');return;}}openRoom(room());}")
s=sub(s,"CenterLife.draw(n,ctx,images,0,'')","CenterLife.draw(n,ctx,images,0,n.name||'')")
# openRoom: talk to one person
s=sub(s,"const story=options.story===false?null:nextStory(r);roomContext={","const story=(options.story===false||(options.castPerson&&options.castPerson!==roomCastFor(r)?.lead))?null:nextStory(r);roomContext={")
s=sub(s,"roomContext.phase=story?'talk':'menu';$('#roomScene').classList.toggle('cm-managed',managed);$('#roomScene').classList.toggle('cm-menu',managed&&!story);","roomContext.phase=(story||options.castPerson)?'talk':'menu';$('#roomScene').classList.toggle('cm-managed',managed);$('#roomScene').classList.toggle('cm-menu',managed&&!story&&!options.castPerson);")
s=sub(s,"currentLines=options.lines||story?.lines||linesFor(r);","currentLines=options.lines||story?.lines||(options.castPerson?castLinesOf(roomCastFor(r),options.castPerson,castSeed(r)+(life.day||0)*3+Math.floor(Math.random()*7)):linesFor(r));")
s=sub(s,"roomContext.manSrc=ms;$('#malePortrait').src=ms;}","{const cm=options.castPerson&&castManSrc(options.castPerson);const ms2=cm||ms;roomContext.manSrc=ms2;$('#malePortrait').src=ms2;}}")
s=sub(s,"if(!roomContext.story)cmInit(r);}else if","if(!roomContext.story&&!options.castPerson)cmInit(r);}else if")
wr('script-16.js',s)
print('r33 patched')
