#!/usr/bin/env python3
"""R31: usage r31-patch.py WORKDIR
 - Toilet (water) and rope rooms: failing now leads to the 맴매 game like every other room game.
 - Water game: yellow water and gauge, larger catch rings, louder shooting sound."""
import sys
from pathlib import Path
W=Path(sys.argv[1])
def rd(n):return (W/n).read_text(encoding='utf8')
def wr(n,s):(W/n).write_text(s,encoding='utf8')
def sub(s,old,new,n=1):
    assert s.count(old)==n,(old[:80],s.count(old));return s.replace(old,new)
s=rd('script-16.js')
s=sub(s,"if(['cylinder','rope','water'].includes(session.game))return false;","if(['cylinder'].includes(session.game))return false;")
wr('script-16.js',s)
for n in ('script-02.js','script-13.js'):
    s=rd(n)
    if "fill='#60b9e4bb'" in s or "ctx.fillStyle='#60b9e4bb'" in s:
        s=s.replace("'#60b9e4bb'","'#f1c93acc'").replace("'#69b0bc'","'#e6c03a'")
        s=s.replace("rx:this.level===1?32:19,ry:this.level===1?32:19","rx:this.level===1?46:28,ry:this.level===1?46:28")
        wr(n,s);print('water patched in',n)
s=rd('script-19.js')
print('shoot gain count',s.count("linearRampToValueAtTime(.6,t+.03)"))
s=s.replace("linearRampToValueAtTime(.6,t+.03)","linearRampToValueAtTime(1.5,t+.03)")
wr('script-19.js',s)
# --- portraits: one person per room, other women get their own (faceless, provisional) image, no old heroine picture ---
import base64
s=rd('script-16.js')
s=sub(s,"$('#femalePortrait').src=portrait();$('#malePortrait').src=dialogueMan(r)||ROOM_ART.silhouettes[String((world.scene.floor+world.scene.room)%3+4).padStart(2,'0')]||ROOM_ART.silhouettes['01'];",
 "$('#femalePortrait').src=(window.PortraitLibrary&&PortraitLibrary.get(world.outfit,'shy'))||portrait();{const ms=dialogueMan(r)||ROOM_ART.silhouettes[String((world.scene.floor+world.scene.room)%3+4).padStart(2,'0')]||ROOM_ART.silhouettes['01'];roomContext.manSrc=ms;$('#malePortrait').src=ms;}")
old="if(!line.male){const src=PortraitLibrary.get(world.outfit,line.portrait||'shy');if(src)$('#femalePortrait').src=src;}$('#roomScene').classList.toggle('male-speaking',line.male);$('#malePortrait').classList.toggle('speaking',line.male);$('#femalePortrait').classList.toggle('speaking',!line.male);window.DialoguePresentation?.update(line.male);"
new="const WOM={'지안':'suit','유리':'yoga','오 부장':'elder','점원':'clerk','참가자':'cardigan','고객':'grocer','방문객':'aunt','여직원':'cardigan','여팀장':'suit','여상무':'elder','여이사':'elder','여전무':'elder'},wk=WOM[line.speaker],wimg=wk&&window.DIALOGUE_WOMEN?.[wk],other=!!line.male||!!wimg;if(wimg)$('#malePortrait').src=wimg;else if(line.male&&roomContext?.manSrc)$('#malePortrait').src=roomContext.manSrc;if(!other){const src=PortraitLibrary.get(world.outfit,line.portrait||'shy');if(src)$('#femalePortrait').src=src;}$('#roomScene').classList.toggle('male-speaking',other);$('#malePortrait').classList.toggle('speaking',other);$('#femalePortrait').classList.toggle('speaking',!other);window.DialoguePresentation?.update(other);"
s=sub(s,old,new)
wr('script-16.js',s)
s=rd('script-13.js')
anchor="document.head.append(Object.assign(document.createElement('style'),{textContent:\"#roomScene #malePortraitSlot{translate:none!important}"
keys=['elder','suit','cardigan','clerk','yoga','grocer','aunt']
d={k:'data:image/webp;base64,'+base64.b64encode(open(f'/home/claude/wellness-rpg/assets/characters/npcs/women/{k}.webp','rb').read()).decode() for k in keys}
import json
s=sub(s,anchor,"window.DIALOGUE_WOMEN="+repr(d)+"; "+anchor)
wr('script-13.js',s)
print('r31 patched')
