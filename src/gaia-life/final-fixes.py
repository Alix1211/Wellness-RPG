# Preserve user-authored dialogue data and use it instead of generated ambient replacements.
s=parts[15].replace('function linesFor(r){return ambient(r);}', 'function linesFor(r){return originalLinesFor(r);}')
a=s.index('function ambient(r)');b=s.index('\nfunction serviceButtons',a);s=s[:a]+s[b:]
original_story_source=Path(ROOT/'source/script-5.js').read_text();m=re.search(r'const STORY\s*=\s*',original_story_source);original_story,_=json.JSONDecoder().raw_decode(original_story_source[m.end():])
parts[5]=js_value(parts[5],'STORY',lambda _:original_story)
s=s.replace("if(id==='life-reception')", "if(id==='M01')")
# Keep narrative movement without replacing room/game dialogue with invented post-game chatter.
s=s.replace("flowSet(next[stage]);life.living.flowLine=lines[stage];", "flowSet(next[stage]);")
s=s.replace("life.living.flowLine='살겠다. 이제 내 페이스대로 다녀보자.';flowSpeak();", "")
s=s.replace("lifeNote('잠깐 쉬었다 · 체력 +'+r.amount);", "lifeNote('체력 +'+r.amount+' · M파워 +'+Math.ceil(r.amount/2));")
s=s.replace("const r=L.recovery(life,world.hp,world.mp);world.hp=r.hp;", "const r=L.recovery(life,world.hp,world.mp);if(!r){toast('오늘 휴식 완료');return;}world.hp=r.hp;")
s=s.replace("if(offers.length||active)add((offers.length?'! ':'')+'부탁',questMenu);", "if(!active&&offers.length)add('! 부탁',questMenu);if(active&&r.kind===active.at&&p?.stage!=='deliver')add('의뢰 취소',()=>{life.active=null;save();closeRoom();});")
# No remote cancellation from unrelated rooms, even when the journal is invoked directly.
s=s.replace("button(p,'부탁 취소',()=>{life.active=null;save();});", "if(kind===active.at)button(p,'부탁 취소',()=>{life.active=null;save();});")
# Short recovery is finite per day, displayed as an action state rather than instruction text.
s=s.replace("function serviceButtons(r){", "function serviceButtons(r){")
s=s.replace("out.append(b);return b;", "out.append(b);if(['잠깐 쉬기','쉬어가기'].includes(label)&&life.living.recovery.day===life.day&&life.living.recovery.count>=2){b.disabled=true;b.textContent='휴식 완료';}return b;")
# One cleanup path closes stale dialogs/iframes, invalidates async room opening, and releases touch capture.
cleanup="""function restoreFieldInput(){resetInput();openRoom.sequence=(openRoom.sequence||0)+1;for(const el of [canvas,$('#jump'),$('#action')]){if(!el)continue;for(let id=0;id<20;id++)try{if(el.hasPointerCapture?.(id))el.releasePointerCapture(id);}catch{}}if($('#panel').open)$('#panel').close();if(liftState?.phase==='choosing')liftState=null;world.player.jumpTime=0;world.player.jump=0;world.player.jumpDir=null;window.MEDIA_PAUSED=false;$('#miniLayer').hidden=true;$('#miniLayer').style.pointerEvents='none';$('#roomScene').style.pointerEvents='none';}
"""
s=s.replace("function closeRoom(){resetInput();mode='field';", cleanup+"function closeRoom(){restoreFieldInput();mode='field';")
s=s.replace("mode='dialogue';resetInput();$('#roomScene').hidden=false;", "mode='dialogue';resetInput();$('#roomScene').style.pointerEvents='';$('#roomScene').hidden=false;")
s=s.replace("$('#miniLayer').hidden=false;", "$('#miniLayer').style.pointerEvents='';$('#miniLayer').hidden=false;")
s=s.replace("mode='field';roomContext=null;session=null;resetInput();", "mode='field';roomContext=null;session=null;restoreFieldInput();")
# Cancel a pending Studio.resolve() without allowing it to resurrect an invisible iframe.
s=s.replace("const layout=await Studio.resolve(roomContext.r.id);const config=", "const launchContext=roomContext,launchSession=session;const layout=await Studio.resolve(launchContext.r.id);if(mode!=='game'||roomContext!==launchContext||session!==launchSession)return;const config=")
# All embedded controls use the user's existing action/jump artwork.
s=s.replace("audio:[],autoStart:true,", "audio:[],controlArt:{run:ROOM_ART.ui.action,jump:ROOM_ART.ui.jump},autoStart:true,")
s=s.replace("background:ART['bg/'+roomContext.r.bg],difficultyMultiplier", "background:ART['bg/'+roomContext.r.bg],difficultyMultiplier")
# Append the child hook after the existing bridge so the saved dialogue/art remain untouched.
s=s.replace("+gaiaBridge+'</html>'", "+gaiaBridge+'<script>'+"+json.dumps((ROOT/'final-child.js').read_text()).replace('<',chr(92)+'u003c')+"+'</'+'script></html>'")
parts[15]=s
# Restore authored pre-game/room dialogue visibility; don't remove its contents.
parts[6]=js_value(parts[6],'GAME_SKIN',lambda css:css.replace('.overlay p{display:none}','')+'''\n.fetch-controls{position:fixed!important;inset:0!important;display:block!important;width:100vw!important;height:100dvh!important;padding:0!important;pointer-events:none!important;z-index:1000!important}.fetch-controls button{position:absolute!important;bottom:max(18px,env(safe-area-inset-bottom))!important;width:86px!important;height:86px!important;min-width:86px!important;background:transparent var(--gaia-control-art) center/contain no-repeat!important;box-shadow:none!important;border:0!important;border-radius:0!important;padding:0!important;touch-action:none!important;pointer-events:auto!important}.fetch-controls button[data-action=jump]{left:12px!important;right:auto!important}.fetch-controls button[data-action=run]{right:12px!important;left:auto!important}.fetch-controls button b,.fetch-controls button small{display:none!important}\n''')
# Keep original script data; only adjust the shared recovery model policy.
parts[7]=parts[7].replace("const amount=[40,25,12][Math.min(l.recovery.count++,2)];", "if(l.recovery.count>=2)return null;const amount=[40,25][l.recovery.count++];")
parts[6]=js_value(parts[6],'GAME_STUDIO',lambda v:v.replace("art.querySelector('video')", "art.querySelector('video:not([data-backdrop])')"))
def water_audio(doc):
    old="function voice(){if(!soundOn||!ac||paused||!started||document.hidden)return;"
    new="function voice(){if(kind==='water'&&soundOn&&!paused&&started&&!document.hidden){try{parent.GaiaAudioStatus?.unlock();parent.postMessage({type:'gaia-audio-event',kind:'water',event:'water-voice'},'*');}catch{}}if(!soundOn||!ac||paused||!started||document.hidden)return;"
    assert old in doc
    return doc.replace(old,new)
parts[2]=js_value(parts[2],'SUITE_DOCUMENT',water_audio)
parts[6]=js_value(parts[6],'GAME_SKIN',lambda css:css+'\n.fetch-controls button:focus{outline:none!important}\n')
s=parts[15]
s=re.sub(r"const lines=\{[^}]*\};flowSet\(next\[stage\]\);", "flowSet(next[stage]);", s)
s=s.replace('function restoreFieldInput(){resetInput();', "const fieldPointers=new Set();document.addEventListener('pointerdown',e=>fieldPointers.add(e.pointerId),true);for(const type of ['pointerup','pointercancel'])document.addEventListener(type,e=>fieldPointers.delete(e.pointerId),true);\nfunction restoreFieldInput(){const ids=[...fieldPointers];if(joystick.id!==null)ids.push(joystick.id);resetInput();")
s=s.replace('for(let id=0;id<20;id++)try{', 'for(const id of ids)try{')
s=s.replace("if($('#panel').open)$('#panel').close();if(liftState", "fieldPointers.clear();if($('#panel').open)$('#panel').close();if(liftState")
parts[15]=s
