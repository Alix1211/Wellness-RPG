# Regressions and the continuous first-day route.
s=parts[15]
s=s.replace("night=place()==='center'&&life.living.nightMode", "night=place()==='center'&&L.nightly(life)")
s=s.replace("function hud(){", "function hud(){flowHUD();")
s=s.replace("window.GameHost={lifeJournal,", (ROOT/'flow-host.js').read_text()+"\nwindow.GameHost={flowGoal,lifeJournal,")
s=s.replace("if(id==='life-reception')register();", "if(id==='life-reception'){register();flowSet('basic');}")
s=s.replace("session.result=rec;tickTime", "session.result=rec;flowAfterGame(rec);tickTime")
s=s.replace("}save();}\nfunction legacyHost", "}save();flowSpeak();}\nfunction legacyHost")
s=s.replace("p.stage='done';p.count", "p.stage='done';if(q.id==='L05')flowDinner();p.count")
s=s.replace("else toast(destination.name+' 도착');", "else toast(destination.name+' 도착');flowArrival(destination);")
s=s.replace("const b=button(p,'',()=>{liftState", "const b=button(p,'',()=>{liftState")
s=s.replace("b.dataset.floor=i;", "b.dataset.floor=i;b.classList.toggle('quest-target',f.rooms.some(r=>flowGoal().kind===r.kind));")
# Show a destination's goal without more labels.
s=s.replace("if(questSignal(r))text('!',r.x+160,185+Math.sin(time*4)*4,34,'#df6198');", "if(questSignal(r)){ctx.save();ctx.strokeStyle='#ef75aa';ctx.shadowColor='#ef75aa';ctx.shadowBlur=12+Math.sin(time*4)*6;ctx.lineWidth=5;ctx.strokeRect(b.x,b.y,b.w,b.h);ctx.restore();text('!',r.x+160,185+Math.sin(time*4)*7,34,'#df6198');}")
s=s.replace("lifeNote('잠깐 쉬었다 · 체력 +'+r.amount);", "lifeNote('잠깐 쉬었다 · 체력 +'+r.amount);if(life.living.flow==='recovery'){flowSet('free');life.living.flowLine='살겠다. 이제 내 페이스대로 다녀보자.';flowSpeak();}")
# Awaiting story is never silently registered by backing out.
s=s.replace("if(roomContext?.story==='life-reception'){register();completeStory();}", "")
# Remove redundant single-choice game-name buttons, keep actual selection when needed.
s=s.replace("for(const g of games(r)){", "for(const g of (games(r).length>1?games(r):[])){")
s=s.replace("toast(q.task==='delivery'?'목적지에서 물건을 받아 돌아오세요':'해당 방에서 과제를 시작하세요');", "if(q.id==='L05')flowDinner();flowSpeak();")
# First reception has a short natural handoff to the first lesson.
s=s.replace("기초반은 2층. 쉬는 방은 여기 아래.", "2층 기초반부터 가. 자리 비워 놨어.")
parts[15]=s
# Map signals refresh after movement and save changes.
parts[13]=parts[13].replace("rail.append(b);", "b.classList.toggle('quest-target',host.flowGoal().destination===d.id);rail.append(b);")
# Contain means one image, with uncovered space kept blank.
parts[6]=js_value(parts[6],'GAME_STUDIO',lambda v:v.replace("art.style.backgroundSize=", "art.style.backgroundRepeat='no-repeat';art.style.backgroundColor='#25212b';art.style.backgroundSize="))
# Remove the diagnostic overlay entirely; preserve audio playback and lifecycle.
a=parts[18].index('  // Mixer only while');b=parts[18].index('  window.GaiaAudioStatus=',a)
parts[18]=parts[18][:a]+"  function visibility(){const ml=document.querySelector('#miniLayer');if(!ml||ml.hidden){if(bed||bedPending||voices.length||effects.length)reset();}}\n  setInterval(visibility,260);\n"+parts[18][b:]
# A child may post bed-start before the srcdoc observer runs. Reset synchronously at navigation instead.
parts[18]=parts[18].replace("if(miniFrame)new MutationObserver(reset).observe(miniFrame,{attributes:true,attributeFilter:['srcdoc']});", "if(miniFrame)miniFrame.addEventListener('load',()=>{const m=miniFrame.contentWindow?.LifeMini;if(m?.started&&!m.paused&&m.sound?.enabled)onGame('bed-start',m.kind??'cylinder');});")
# The opening errand remains available before center registration.
parts[15]=parts[15].replace("if(!life.living.registered||q.employed", "if(!life.living.registered&&q.id!=='L05'||q.employed")
parts[15]=parts[15].replace("settleQuest(active,true);closeRoom();", "settleQuest(active,true);closeRoom();flowSpeak();")
# Jump stays an explicit touch action after leaving every embedded game.
parts[15]=parts[15].replace("function closeRoom(){mode='field';", "function closeRoom(){resetInput();mode='field';")
parts[15]=parts[15].replace("if(e.key===' '){e.preventDefault();if(mode==='field')M.startJump(world);}", "if(e.key===' '){e.preventDefault();if(mode==='field'){if(CityTravel.active)CityTravel.jump();else M.startJump(world);}}")
# No gameplay instruction banners on road entry.
parts[13]=parts[13].replace("flash('왼손 점프 · 오른손 연타 가속');", "")
parts[15]=parts[15].replace("mode='game';", "mode='game';flowHUD();")
