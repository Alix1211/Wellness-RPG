#!/usr/bin/env python3
"""R57: 줄 자르기 난이도 완화 — 입구를 조금 올리고(900→822) 넓힘(폭 104→150), 결과 효과음(성공=비명, 실패=한숨).
usage: r57-patch.py WORKDIR REPO   (r54 위에 적용)"""
import sys
from pathlib import Path
W=Path(sys.argv[1]);R=Path(sys.argv[2])
def sub(s,old,new,n=1):
    assert s.count(old)==n,(old[:60],s.count(old));return s.replace(old,new)
p=W/'script-02.js';s=p.read_text(encoding='utf8')
s=sub(s,"this.goal={x:360,y:(root.__ropeH?900:650),width:104};","this.goal={x:360,y:(root.__ropeH?822:650),width:(root.__ropeH?150:104)};")
# 결과는 창 문구가 아니라 효과음으로: 성공=비명(rope_scream), 실패=실망(rope_disappoint)
s=sub(s,"if(kind==='rope'&&model.won&&ropeIndex\\u003cM.LEVELS.length-1){overlay(","if(kind==='rope'&&model.won&&ropeIndex\\u003cM.LEVELS.length-1){window.GaiaAudioStatus?.event('rope-win','rope');overlay(")
s=sub(s,"return;}report(r);showResult(r);}","return;}if(kind==='rope')window.GaiaAudioStatus?.event(r.success?'rope-win':'rope-lose','rope');report(r);showResult(r);}")
p.write_text(s,encoding='utf8')
p=W/'script-06.js';s=p.read_text(encoding='utf8')
s=sub(s,"y:(cfg.kind==='rope'?900/1280:650/720),","y:(cfg.kind==='rope'?822/1280:650/720),")
s=sub(s,"width:104*v.z,rotation:v.r*Math.PI/180","width:(cfg.kind==='rope'?150:104)*v.z,rotation:v.r*Math.PI/180")
p.write_text(s,encoding='utf8')
import base64
def b64(f):return 'data:audio/mpeg;base64,'+base64.b64encode((R/'assets/rope-v2/sfx'/f).read_bytes()).decode()
p=W/'script-19.js';s=p.read_text(encoding='utf8')
s=sub(s,'";window.GAIA_GAME_BRIDGE="','";window.GAIA_SOUND_SOURCES.rope_scream="'+b64('rope_scream.mp3')+'";window.GAIA_SOUND_SOURCES.rope_disappoint="'+b64('rope_disappoint.mp3')+'";window.GAIA_GAME_BRIDGE="')
s=sub(s,"case 'outcome-fail':stopBed();","case 'rope-win':clearPool(voices);play('rope_scream',.85,'voice');break;case 'rope-lose':clearPool(voices);play('rope_disappoint',.85,'voice');break;case 'outcome-fail':stopBed();",2)
p.write_text(s,encoding='utf8')
p=W/'script-16.js';s=p.read_text(encoding='utf8')
s=sub(s,"'reaction_effort','reaction_surprise','reaction_displeased'];const sources=","'reaction_effort','reaction_surprise','reaction_displeased','rope_scream','rope_disappoint'];const sources=")
p.write_text(s,encoding='utf8');print('r57 patched')
