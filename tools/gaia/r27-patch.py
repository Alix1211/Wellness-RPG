#!/usr/bin/env python3
"""R27 (on top of R26 scripts): usage r27-patch.py WORKDIR REPO_ROOT
 - squat game: plea line instead of intro, minimal result card (patches src/gaia-life/squat-game.html in place)
 - re-embed SQUAT_DOCUMENT / BATTING_DOCUMENT from the repo files
 - plea per place (street '죄송합니다!', centre '훈련 부탁드립니다!', company '부탁드립니다!'), street batting uses street outfit
 - flee result screens: static (no animation, no card box)
 - quest button always present, mint, disabled when there is no quest
 - living alone (home, not married): male portrait hidden, only the female lines, shown as 혼잣말"""
import sys,json
from pathlib import Path
W=Path(sys.argv[1]);R=Path(sys.argv[2])
def rd(n):return (W/n).read_text(encoding='utf8')
def wr(n,s):(W/n).write_text(s,encoding='utf8')
def sub(s,old,new,n=1):
    assert s.count(old)==n,(old[:90],s.count(old))
    return s.replace(old,new)
def enc(v):return json.dumps(v).replace('<','\\u003c')
# ---- squat source
sq=R/'src/gaia-life/squat-game.html';q=sq.read_text(encoding='utf8')
q=sub(q,"'<h1>스쿼트</h1><p>링이 공에 닿는 순간 눌러요</p><div class=\"stats\"><span>'+RULE.name+'</span><span>'+RULE.bpm+' BPM</span></div><div class=\"stats\">","'<h1>'+(SQ.plea||'스쿼트')+'</h1><div class=\"stats\">")
q=sub(q,"'</h1><div class=\"stats\"><span>완벽 '+counts.perfect+'</span><span>좋아요 '+counts.good+'</span><span>놓침 '+counts.miss+'</span></div><p>'+Math.round(pts)+'점 · 최고 '+best+' 콤보</p><div class=\"row\"><button class=\"btn alt\" id=\"again\">다시</button><button class=\"btn\" id=\"close\">닫기</button></div>';","'</h1><p>'+Math.round(pts)+'점</p><div class=\"row\">'+(parent===window?'<button class=\"btn alt\" id=\"again\">다시</button>':'')+'<button class=\"btn\" id=\"close\">닫기</button></div>';")
q=sub(q,"$('#again').onclick=","if($('#again'))$('#again').onclick=")
sq.write_text(q,encoding='utf8')
bat=(R/'modules/minigames/minigame-conveyor-batting.html').read_text(encoding='utf8')
# ---- script-13: re-embed docs
s=rd('script-13.js')
for key,doc in (('const SQUAT_DOCUMENT=',q),('const BATTING_DOCUMENT=',bat)):
    i=s.index(key)+len(key);old,end=json.JSONDecoder().raw_decode(s[i:])
    s=s[:i]+enc(doc)+s[i+end:]
wr('script-13.js',s)
# ---- script-16
s=rd('script-16.js')
s=sub(s,"let cityKind='cylinder';\nfunction battingConfig(){","let cityKind='cylinder';\nfunction pleaText(){const p=place();return p==='street'?'죄송합니다!':p==='company'?'부탁드립니다!':'훈련 부탁드립니다!';}\nfunction battingConfig(){")
s=sub(s,"tapStart:true,goal:null};}","tapStart:true,plea:pleaText(),goal:null};}")
s=sub(s,"return{difficulty:Math.min(3,base+","return{plea:pleaText(),difficulty:Math.min(3,base+")
s=sub(s,"c2.squat=squatConfig();const bk=","c2.squat=squatConfig();c2.squat.plea='죄송합니다!';const bk=")
s=sub(s,"c2.batting=battingConfig();c2.batting.difficulty=","c2.batting=battingConfig();c2.batting.location='street';c2.batting.plea='죄송합니다!';c2.batting.difficulty=")
# flee screens static
s=sub(s,"const card=fleeCard(H.run,'도망쳤습니다!','',[]);const im=card.querySelector('img');try{im?.animate([{transform:'translateX(-18vw) scale(1)',opacity:1},{transform:'translateX(70vw) scale(.7)',opacity:.1}],{duration:1500,easing:'ease-in',fill:'forwards'});}catch{}setTimeout(","const card=fleeCard(H.run,'도망쳤습니다!','',[]);fleeBare(card);setTimeout(")
s=sub(s,"const card=fleeCard(H.kneel,'붙잡혔습니다……','미션이 더 어려워집니다',[['다시 시작',()=>{fleeClose();fleePaused=false;cityBump=Math.min(2,cityBump+1);cityEncounter(cityLast,{retry:true});},true]]);try{card.querySelector('img')?.animate([{transform:'translateX(-6px)'},{transform:'translateX(6px)'},{transform:'translateX(0)'}],{duration:260,iterations:2});}catch{}}};","const card=fleeCard(H.kneel,'붙잡혔습니다……','미션이 더 어려워집니다',[['다시 시작',()=>{fleeClose();fleePaused=false;cityBump=Math.min(2,cityBump+1);cityEncounter(cityLast,{retry:true});},true]]);fleeBare(card);}};")
s=sub(s,"function cityFleeAsk(){","function fleeBare(card){card.style.background='none';card.style.boxShadow='none';card.style.color='#fff';card.style.textShadow='0 2px 8px #000a';const sub=card.children[card.children.length-1];card.querySelectorAll('div').forEach(d=>{if(d.style.opacity)d.style.opacity='1';});}\nfunction cityFleeAsk(){")
# quest button
s=sub(s,"if(quests.length)items.push({label:'퀘스트',run:()=>cmQuestMenu(r,quests,back)});","items.push({label:'퀘스트',cls:'quest',disabled:!quests.length,run:()=>cmQuestMenu(r,quests,back)});",3)
s=sub(s,"if(quests.length)items.push({label:'퀘스트',run:()=>cmQuestMenu(r,quests,()=>cmNext(r))});","items.push({label:'퀘스트',cls:'quest',disabled:!quests.length,run:()=>cmQuestMenu(r,quests,()=>cmNext(r))});")
s=sub(s,"b.className='cm-item';b.textContent=it.label;","b.className='cm-item'+(it.cls?' '+it.cls:'');b.textContent=it.label;")
s=sub(s,"body.city-road #storyPeek{","#choiceMenu .cm-item.quest{filter:hue-rotate(190deg) saturate(.9)}#choiceMenu .cm-item.quest.focus{filter:hue-rotate(190deg) saturate(.9) brightness(1.1) drop-shadow(0 0 8px #fff9)}#choiceMenu .cm-item:disabled,#choiceMenu .cm-item.quest:disabled{opacity:.45;filter:grayscale(1)}#roomScene.solo-home #malePortraitSlot,#roomScene.solo-home #malePortrait{display:none!important}\nbody.city-road #storyPeek{")
# living alone monologue
s=sub(s,"function linesFor(r){return originalLinesFor(r);}","function soloHome(){return place()==='home'&&!life.living.married;}\nfunction linesFor(r){const L0=originalLinesFor(r);if(!soloHome())return L0;return L0.filter(l=>!l.male).map(l=>({...l,speaker:'혼잣말',male:false}));}")
s=sub(s,"$('#roomName').textContent=r.name;currentLines=","$('#roomName').textContent=r.name;$('#roomScene').classList.toggle('solo-home',soloHome());currentLines=")
wr('script-16.js',s);print('r27 patched')
