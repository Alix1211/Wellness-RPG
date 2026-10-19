import re,json,base64,hashlib
from pathlib import Path
ROOT=Path('/workspace/scratch/6ed83155481b')
original=Path('/workspace/scratch/90d34b178039/GAIA-FIXED.html').read_text()
scripts=list(re.finditer(r'<script([^>]*)>([\s\S]*?)</script\s*>',original))
parts=[m[2] for m in scripts]
def replace_function(s,name,new):
    pat=re.search(r'^(?:async )?function '+name+r'\(',s,re.M)
    assert pat,name
    start=pat.start(); nxt=re.search(r'\n(?:(?:async )?function |const gameName|let selectedPhoto|\$\(\x27saveFile|window\.GameHost)',s[pat.end():])
    assert nxt,name
    end=pat.end()+nxt.start()
    return s[:start]+new.rstrip()+'\n'+s[end:]
villa=base64.b64encode((ROOT/'found-room/분홍빛 판타지 공주 침실.png').read_bytes()).decode()
parts[7]+='\nCenterModel.FLOORS.push({place:"home",number:1,name:"단칸 빌라",width:1280,rooms:[{id:"starter-villa",kind:"villa",name:"단칸 빌라",bg:"starter-villa",x:640,games:[],service:"rest"}]});\n'
parts[7]+='\nART["bg/starter-villa"]="data:image/png;base64,'+villa+'";\n'
# A small, playable catalogue replaces the deferred, mismatched quest mappings.
def delivery(id,title,at,target,item,gold,lines):return dict(id=id,title=title,at=at,target=target,task='delivery',item=item,gold=gold,rounds=1,hp=0,slots=0,bonus={'선택 스탯':2},repeatable=True,weeklyLimit=3,dailyLimit=1,fromName={'lobby':'센터 로비','shop':'매점','park':'공원','companyLobby':'회사 로비','villa':'단칸 빌라'}.get(at,at),lines=lines,game=None)
quests=[
 delivery('L01','접수대 커피','lobby','cafe','커피 봉투',28,['커피 두 잔만 받아다 줄래? 내 이름으로 주문했어.','네. 제 것도 사서 올게요.']),
 delivery('L02','신상 7호 세트','shop','market','7호 세트',42,['마트에 맡긴 7호 세트 좀 가져와. 큰 봉투야.','응. 두 손 비우고 갈게.']),
 delivery('L03','정류장에 둔 가방','park','bus','분홍 가방',24,['정류장에 가방을 두고 왔네. 이름표 붙어 있어.','응. 여기서 기다려.']),
 delivery('L04','교재 반납','lobby','book','교재 영수증',25,['서점에 반납할 교재야. 영수증만 받아 와.','네. 다음 것도 예약할까요?']),
 delivery('L05','오늘 저녁거리','villa','market','장바구니',20,['냉장고가 비었네. 장부터 봐야겠다.','가는 김에 센터도 들르자.']),
 delivery('L06','회의실 음료','companyLobby','cafe','음료 상자',38,['회의 시작 전에 받아 와. 수량 적혀 있어.','네. 제 건 따로 계산하겠습니다.'])
]
for i,(title,at,game,stat,minimum) in enumerate([('추가 출석','basic',5,'bo',0),('자세 기록 갱신','posture',2,'ki',25),('시범 자리 하나','group',0,'ge',30),('새 기구 시험','gear','rope','um',30),('집중반 기록','punish',3,'bo',40),('퇴근 전 확인','sharedOffice','cylinder','um',50)]):
 quests.append(dict(id='T'+str(i+1),title=title,at=at,target=at,task='game',game=game,gold=18+i*3,rounds=1,hp=12,slots=1,bonus={stat:3},minAverage=minimum,employed=at=='sharedOffice',repeatable=True,weeklyLimit=7,dailyLimit=1,lines=['오늘 기록 하나 더 남겨.','네. 끝나면 바로 확인해주세요.']))
quests.append(dict(id='V01',title='회원 집에 두고 온 상자',at='shop',target='homeLiving',task='delivery',item='보관 상자',gold=48,rounds=1,hp=0,slots=0,bonus={'ge':3},repeatable=True,weeklyLimit=2,dailyLimit=1,fromName='매점',lines=['회원님 집 거실에 상자 하나 있어. 주소 줄게.','응. 받아서 바로 올게.'],game=None,visitHouse=True,minAverage=30))
story=[dict(id='life-reception',at='lobby',minAverage=0,employed=False,title='첫 접수',lines=[dict(speaker='접수 담당',text='처음이지? 수강료는 240. 외상으로 달아둘게.',male=True),dict(speaker='주인공',text='네. 취직하면 갚겠습니다.',male=False),dict(speaker='접수 담당',text='기초반은 2층. 쉬는 방은 여기 아래.',male=True)]),dict(id='life-basic',at='basic',minAverage=0,employed=False,title='기초반',lines=[dict(speaker='조교',text='처음 온 사람도 다시 온 사람도 여기서 시작해.',male=True),dict(speaker='주인공',text='네. 옆자리 비었죠?',male=False)]),dict(id='life-company',at='companyLobby',minAverage=0,employed=False,title='지원서',lines=[dict(speaker='상사',text='지원서는 여기. 평균 50 넘으면 다시 와.',male=True),dict(speaker='주인공',text='네. 복지 안내는 먼저 가져가도 되죠?',male=False)]),dict(id='life-after-job',at='sharedOffice',minAverage=0,employed=True,title='첫 근무',lines=[dict(speaker='상사',text='오늘부터 이 자리야. 끝나면 보고해.',male=True),dict(speaker='주인공',text='네. 월급날도 적어놨습니다.',male=False)]),dict(id='life-park',at='park',minAverage=75,employed=False,title='매번 마주치는 사람',lines=[dict(speaker='남성',text='이 시간에 자주 보네.',male=True),dict(speaker='주인공',text='네. 일부러 이쪽으로 다니거든요.',male=False)])]
s=parts[5]
for name,data in [('QUESTS',quests),('STORY',story)]:
 m=re.search(r'const '+name+r'\s*=\s*',s);v,end=json.JSONDecoder().raw_decode(s[m.end():]);s=s[:m.end()]+json.dumps(data,ensure_ascii=False,separators=(',',':'))+s[m.end()+end:]
parts[5]=s
s=parts[15]
s=s.replace("gold:10000,debt:480","gold:-120,debt:120")
s=s.replace("const STAT_NAMES=", "const freshLife=!localStorage.getItem(KEY)&&!localStorage.getItem('gaia-rpg-rebuild-v12')&&!localStorage.getItem('gaia-rpg-play-v11');\nconst STAT_NAMES=")
s=s.replace("life.battle||={goal:500", "GaiaLife.setup(life,freshLife);life.battle||={goal:500",1)
s=s.replace("function save(){life.hp", "function save(){life.debt=Math.max(0,-life.gold);life.hp")
s=s.replace("$('#day').textContent=life.day+'일'", "$('#day').textContent=life.day+'일 · '+dailyScene()")
s=s.replace("$('#gold').textContent=life.gold.toLocaleString();", "$('#gold').textContent=Math.round(life.gold).toLocaleString();$('#gold').parentElement.title='잔액 · 마이너스는 대출';")
s=s.replace("function linesFor(r){", "function originalLinesFor(r){",1)
s=s.replace("function showLine(){", "function linesFor(r){return ambient(r);}\nfunction showLine(){",1)
s=replace_function(s,'nextLine',"""function nextLine(){if(!currentLines.length)return;if(lineIndex<currentLines.length-1){lineIndex++;showLine();return;}if(roomContext?.onFinish){const fn=roomContext.onFinish;roomContext.onFinish=null;fn();return;}if(roomContext?.story){completeStory();currentLines=linesFor(roomContext.r);lineIndex=0;showLine();serviceButtons(roomContext.r);$('#startGame').hidden=roomContext.game===undefined;}lineTime=-1e6;}""")
s=s.replace("roomContext={r,game:options.game??games(r)[0],npc:options.npc,quest:options.quest,story:story?.id}","roomContext={r,game:options.game??games(r)[0],npc:options.npc,quest:options.quest,story:story?.id,onFinish:options.onFinish,continueLabel:options.continueLabel}")
s=s.replace("async function openRoom(r,options={}){", "async function openRoom(r,options={}){const openToken=openRoom.sequence=(openRoom.sequence||0)+1;")
s=s.replace("$('#startGame').hidden=roomContext.game===undefined;showLine();await applySceneLayout();", "$('#startGame').textContent=options.continueLabel||'시작';$('#startGame').hidden=roomContext.game===undefined&&!options.onFinish;showLine();await applySceneLayout();if(openToken!==openRoom.sequence||mode!=='dialogue'||roomContext?.r!==r)return;if(!roomContext.story&&!options.onFinish)serviceButtons(r);if(roomContext.story)$('#startGame').hidden=true;")
s=s.replace("function closeRoom(){mode='field';", "function closeRoom(){if(roomContext?.story==='life-reception'){register();completeStory();}mode='field';")
s=s.replace("if(place()==='street')CityTravel.openMap(life.city?.place||'center');", "if(place()==='street')CityTravel.openMap(life.city?.place||'center');roomContext=null;")
s=replace_function(s,'tickTime',"""function tickTime(n=1){const old=life.day,lock=life.living.jobLocked||life.living.homeLocked;L.advance(life,n);if(life.day!==old)lifeNote('새 아침'+' · 컨디션 갱신');if(!lock&&(life.living.jobLocked||life.living.homeLocked))lifeNote('재훈련 안내 · 관계와 직장은 그대로');save();CityTravel.refresh();}""")
s=replace_function(s,'rest',"""function rest(night=false){if(night){world.hp=100;world.mp=100;tickTime(L.R.slots-life.slot);lifeNote('푹 잤다 · 체력 / M파워 회복');}else{const r=L.recovery(life,world.hp,world.mp);world.hp=r.hp;world.mp=r.mp;tickTime(1);lifeNote('잠깐 쉬었다 · 체력 +'+r.amount);}save();}""")
s=replace_function(s,'reward',"""function reward(d){if(!session||session.done||life.processed.includes(session.id))return;session.done=true;life.processed.push(session.id);life.processed=life.processed.slice(-300);const ratio=L.R&&Math.max(0,Math.min(1,+d.ratio||0)),success=d.success??ratio>=.4;const delta=L.gain(life,session.game,ratio,success,session.night);let gold=0;const q=QUESTS.find(q=>q.id===session.quest);if(success){if(session.work&&life.living.worked!==life.day){gold+=L.R.workPay;life.living.worked=life.day;}if(session.challenge&&life.living.challengeDay!==life.day){gold+=45;life.living.challengeDay=life.day;}if(q){const p=life.quests[q.id]||(life.quests[q.id]={step:0});if(++p.step>=(q.rounds||1)){settleQuest(q,true,false);gold+=q.gold||0;}}life.gold+=gold;}else if(q){settleQuest(q,false);}const rec={id:session.id,day:life.day,room:session.room,game:session.game,score:d.score||0,ratio,success,gold,delta,night:session.night,penalties:[],before:session.before,after:{...life.stats}};life.history.unshift(rec);life.history=life.history.slice(0,160);session.result=rec;tickTime(session.work?2:1);save();}""")
s=s.replace("completeStory();const q=QUESTS.find(q=>q.id===life.active&&q.target===roomContext.r.kind),game=q?.game??roomContext.game,cost=game==='cylinder'?0:q?.hp?Math.ceil(q.hp/(q.rounds||1)):({water:18,rope:22,cylinder:24}[game]||24);", "if(roomContext.onFinish){const fn=roomContext.onFinish;roomContext.onFinish=null;fn();return;}if(roomContext.story){nextLine();return;}if(place()==='center'&&!life.living.registered){toast('센터 로비에서 먼저 접수');return;}if(place()==='company'&&!accessDestination('company').ok)return;const q=QUESTS.find(q=>q.id===life.active&&q.target===roomContext.r.kind&&q.task==='game'),game=q?.game??roomContext.game,night=place()==='center'&&life.living.nightMode,cost=night?L.R.nightHP:L.R.normalHP;")
s=s.replace("quest:q?.id,before:{...life.stats},done:false", "quest:q?.id,before:{...life.stats},night,work:!!roomContext.work,challenge:!!roomContext.challenge,done:false")
s=s.replace("background:ART['bg/'+roomContext.r.bg]};", "background:ART['bg/'+roomContext.r.bg],difficultyMultiplier:night||roomContext.challenge?2:1};")
s=s.replace("if(game==='cylinder')Object.assign(config", "if(game==='cylinder')Object.assign(config")
# Keep session result visible as a compact sticker over the existing field; no beige result dialog.
s=s.replace("openRoom(c.r,{npc:c.npc,game:c.game,story:false});save();", "closeRoom();if(session?.result){const rec=session.result;const changes=Object.entries(rec.delta||{}).filter(([,v])=>v>0).map(([k,v])=>STAT_NAMES[k]+' +'+v.toFixed(1)).join(' · ');lifeNote((rec.success?'성공':'다음엔 좀 더')+' · '+changes+(rec.gold?' · +'+rec.gold+' G':''));}save();")
s=s.replace("if(mode!=='game')return;try{$('#miniFrame')", "if(mode!=='game')return;if(session&&!session.done){session.done=true;life.history.unshift({id:session.id,day:life.day,game:session.game,room:session.room,success:false,abandoned:true,score:'중단'});life.history=life.history.slice(0,160);tickTime(1);}try{$('#miniFrame')")
s=replace_function(s,'average',"function average(){return L.average(life);}")
s=replace_function(s,'nextStory',"function nextStory(r){return STORY.find(q=>!life.story.seen.includes(q.id)&&q.at===r.kind&&(!q.minAverage||average()>=q.minAverage)&&(!q.employed||life.employed))||null;}")
s=s.replace("life.story.seen.push(id);life.story.index++;", "life.story.seen.push(id);life.story.index++;if(id==='life-reception')register();")
s=replace_function(s,'availableQuest',"""function availableQuest(q){const p=life.quests[q.id]||{},week=Math.floor((life.day-1)/7);if(!life.living.registered||q.employed&&!life.employed||q.minAverage&&average()<q.minAverage)return false;if(!q.repeatable&&p.done)return false;if(p.lastDay===life.day)return false;return p.week!==week||(p.count||0)<q.weeklyLimit;}""")
s=s.replace("p.done=true;p.count=(p.count||0)+1;", "p.done=true;p.lastDay=life.day;p.stage='done';p.count=(p.count||0)+1;life.living.questsDone++;lifeNote(q.title+' 완료 · +'+q.gold+' G');")
s=s.replace("let key={개방:'ge',복종:'bo',인내:'endurance',친밀:'affinity'}[k]", "let key={개방:'ge',복종:'bo',인내:'bo',친밀:'ge',ki:'ki',um:'um',bo:'bo',ge:'ge'}[k]")
s=s.replace("if(credit)life.gold+=success?q.gold||0:q.failGold||0;", "if(credit)life.gold+=success?q.gold||0:q.failGold||0;if(!success)p.lastDay=life.day;")
s=replace_function(s,'questMenu',"""function questMenu(){const p=panel('부탁'),kind=currentKind(),active=QUESTS.find(q=>q.id===life.active);if(active){const state=life.quests[active.id],target=state.stage==='deliver'?active.at:active.target,goal=M.FLOORS.flatMap(f=>f.rooms).find(r=>r.kind===target);const row=document.createElement('p');row.textContent=active.title+' → '+(goal?.name||target)+(state.stage==='deliver'?' · 전달':'');p.append(row);if(target===kind){button(p,state.stage==='deliver'?'전달하기':active.task==='delivery'?'물건 받기':'시작',()=>{if(state.stage==='deliver'){settleQuest(active,true);return;}if(active.task==='delivery'){state.stage='deliver';state.step=1;lifeNote(active.item+' 수령 · '+active.fromName+'에게 돌아가기');save();return;}openRoom(currentRoom(),{game:active.game,quest:active.id,story:false});});}button(p,'부탁 취소',()=>{life.active=null;save();});return;}for(const q of QUESTS.filter(q=>q.at===kind&&availableQuest(q)).slice(0,5)){button(p,q.title+' · '+q.gold+' G',()=>{life.active=q.id;life.quests[q.id]={...(life.quests[q.id]||{}),step:0,stage:q.task==='delivery'?'pickup':'game'};save();openRoom(currentRoom(),{story:false,lines:q.lines.map((text,i)=>({speaker:i%2?'주인공':'의뢰인',text,male:i%2===0&&place()==='company'})),continueLabel:'받았습니다',onFinish:()=>{closeRoom();toast(q.task==='delivery'?'목적지에서 물건을 받아 돌아오세요':'해당 방에서 과제를 시작하세요');}});});}if(!p.querySelector('button')){const row=document.createElement('p');row.textContent='지금은 부탁이 없다. 다른 방도 들러보자.';p.append(row);}}""")
s=replace_function(s,'action',"""function action(){if(CityTravel.active){CityTravel.boost();return;}if(mode!=='field'||$('#panel').open)return;if(world.scene.type==='corridor'){const i=floor().rooms.findIndex(r=>Math.abs(world.player.x-r.x)<230);if(i>=0){enterIndex(i);if(mode==='field')openRoom(room());}else toast('방 가까이 가세요');return;}openRoom(room());}""")
s=s.replace("button(p,'기록',()=>{", "button(p,'생활',lifeJournal);button(p,'음악',bgmSettings);button(p,'새 생활',newLifeMenu);button(p,'기록',()=>{")
s=s.replace("button(a,'체력과 M력 회복',()=>{world.hp=world.mp=100;save();});button(a,'골드 +10000',()=>{life.gold+=10000;save();});", "")
s=s.replace("const small=document.createElement('p');small.textContent='대출 '+life.debt+'G';", "const small=document.createElement('p');small.textContent=livingGoal()+' · 대출 '+Math.round(life.debt)+'G';")
s=s.replace("if(item?.[0]==='음료'&&item[1]>0){life.inventory[item[0]]--;world.hp=Math.min(100,world.hp+35);save();$('#panel').close();}", "if(item&&item[1]>0){const effect={음료:[30,10],샌드위치:[45,0],'따뜻한 차':[10,30]}[item[0]];if(effect){life.inventory[item[0]]--;world.hp=Math.min(100,world.hp+effect[0]);world.mp=Math.min(100,world.mp+effect[1]);save();$('#panel').close();toast(item[0]+' 사용');}}")
s=s.replace("if(place()==='company'&&world.scene.floor>6&&!life.employed)", "if(place()==='company'&&!accessDestination('company').ok)return;if(place()==='company'&&world.scene.floor>6&&!life.employed)")
s=s.replace("else if(p.x>=b.right-3&&dx>0)sceneChange(()=>M.homeStep(world,1));", "else if(p.x>=b.right-3&&dx>0){if(world.scene.floor===11)streetExit();else sceneChange(()=>M.homeStep(world,1));}")
s=s.replace("if(world.scene.room===0)streetExit();", "if(world.scene.floor===11||world.scene.room===0)streetExit();")
s=s.replace("if(destination.floor!==undefined){M.changeFloor(world,destination.floor);", "if(destination.id==='family'&&life.active==='V01'){/* guest invitation keeps the existing house accessible for this errand */}if(destination.floor!==undefined){M.changeFloor(world,destination.floor);")
s=s.replace("if(destination.floor===9||destination.floor===undefined)openRoom(room());", "if([9,11].includes(destination.floor)||destination.floor===undefined)openRoom(room());")
s=s.replace("tickTime(Math.max(1,Math.ceil(route.duration/30)));", "tickTime(1);")
s=s.replace("life={...life,...data.life};life.battle", "life={...life,...data.life};L.setup(life,false);if(data.world?.scene&&M.FLOORS[data.world.scene.floor]){world.scene={...data.world.scene};Object.assign(world.player,data.world.player||{});world.camera=data.world.camera||0;world.outfit=data.world.outfit||world.outfit;}life.battle")
s=s.replace("$('#startGame').onclick=e=>{e.stopPropagation();startGame();};", "$('#startGame').onclick=e=>{e.stopPropagation();if(roomContext?.onFinish){const fn=roomContext.onFinish;roomContext.onFinish=null;fn();}else startGame();};")
s=s.replace("loaded=true;$('#loading').remove();hud();save();", "loaded=true;$('#loading').remove();if(!life.living.opening)opening();else if(life.location&&M.FLOORS[life.location.floor]){world.scene={...life.location};world.player.x=life.position?.x||640;world.player.y=life.position?.y||610;world.outfit=life.outfit||'jeans';}hud();save();")
s=s.replace("function save(){life.debt", "function save(){life.location={...world.scene};life.position={x:world.player.x,y:world.player.y};life.outfit=world.outfit;life.debt")
# New games use actual night difficulty in a shared child bridge; all 9 keep their original art and edits.
s=s.replace("const code='<script>window.GAME_SCENE='", "const code='<script>window.GAME_SCENE='")
s=s.replace("+'<'+ '/script>';const gaiaBridge", "+'<'+ '/script>'+nightBridge(config);const gaiaBridge")
s=s.replace("window.GameHost={world,", (ROOT/'life-host.js').read_text()+"\nwindow.GameHost={lifeJournal,rest,tickTime,questMenu,register,accessDestination,livingGoal,world,")
parts[15]=s
# Additional runtime hooks: one clear marker, safe room taps, original side maps retained.
parts[15]=parts[15].replace("CityTravel.openMap(place());", "CityTravel.openMap(world.scene.floor===9?'family':place());")
parts[15]=parts[15].replace(".map(s=>'<script>'+esc(s)", ".map(s=>'<script>'+esc(config.difficultyMultiplier===2?s.replace('step(dt);','step(dt*2);').replace('this.step(dt);','this.step(dt*2);'):s)")
parts[15]=parts[15].replace("ctx.strokeRect(b.x-1,b.y-1,b.w+2,b.h+2);ctx.restore();", "ctx.strokeRect(b.x-1,b.y-1,b.w+2,b.h+2);ctx.restore();if(questSignal(r))text('!',r.x+160,185+Math.sin(time*4)*4,34,'#df6198');")
parts[15]=parts[15].replace("canvas.addEventListener('pointerdown',e=>{if(CityTravel.active)return;", "canvas.addEventListener('pointerdown',e=>{if(CityTravel.active)return;if(mode==='field'&&!$('#panel').open&&world.scene.type==='corridor'){const v=view(),x=e.clientX/v.s+v.cam,y=(e.clientY-v.y)/v.s;if(y>130&&y<440){const i=floor().rooms.findIndex(r=>Math.abs(x-r.x)<194);if(i>=0){e.preventDefault();enterIndex(i);if(mode==='field')openRoom(room());return;}}}")
# Grow media to the full viewport while containing its original aspect ratio.
def js_value(source,name,change):
    m=re.search(r'const '+name+r'\s*=\s*',source);assert m,name
    value,end=json.JSONDecoder().raw_decode(source[m.end():])
    return source[:m.end()]+json.dumps(change(value),ensure_ascii=False).replace('<',chr(92)+'u003c')+source[m.end()+end:]
def cylinder_media(doc):
    doc=doc.replace("GAME_CONFIG.layout?.targets?.main?.src&&images.main", "images.main&&(window.SCENE_LAYOUT?.targets?.main?.src||GAME_CONFIG.layout?.targets?.main?.src)")
    doc=doc.replace("SceneEditor.paint(ctx,id,im,-202.5,-338,405,676,false)", "SceneEditor.paint(ctx,id,im,-360/aspect,-360,720/aspect,720,false)")
    doc=doc.replace("SceneEditor.paint(ctx,'main',images.main,-202.5,-338,405,676,false)", "SceneEditor.paint(ctx,'main',images.main,-360*r.width/r.height,-360,720*r.width/r.height,720,false)")
    doc=doc.replace("const pulse=shake>0?1+Math.sin(shake*30)*.015:1", "const pulse=1")
    doc=doc.replace("ctx.scale(size/32,size/32*(kind==='cylinder'?9/16:1))", "ctx.scale(size/32*(kind==='cylinder'?canvas.getBoundingClientRect().height/canvas.getBoundingClientRect().width:1),size/32)")
    return doc
parts[13]=js_value(parts[13],'CITY_ENCOUNTER_DOCUMENT',cylinder_media)
def studio_media(studio):
    studio=studio.replace("const im=new Image();im.src=v.src;imgs[id]=im;", "if(imgs[id]?.tagName==='VIDEO')imgs[id].pause();const im=/video/.test(v.mime||'')?Object.assign(document.createElement('video'),{autoplay:true,loop:true,muted:true,playsInline:true}):new Image();im.src=v.src;imgs[id]=im;")
    studio=studio.replace("if(im)imgs[id]=im;else delete imgs[id];", "if(imgs[id]?.tagName==='VIDEO')imgs[id].pause();if(im)imgs[id]=im;else delete imgs[id];")
    studio=studio.replace("if(bg?.src&&/video/", "art.style.backgroundSize=cfg.kind==='cylinder'?'contain':'cover';if(bg?.src&&/video/")
    studio=studio.replace("video.src=bg.src;", "video.style.objectFit=cfg.kind==='cylinder'?'contain':'cover';video.src=bg.src;")
    studio=studio.replace("if(!im?.naturalWidth)return;const v=value(id);", "const iw=im?.videoWidth||im?.naturalWidth,ih=im?.videoHeight||im?.naturalHeight;if(!iw||!ih)return;const v=value(id);")
    studio=studio.replace("Math.max(w/im.width,h/im.height):Math.min(w/im.width,h/im.height)", "Math.max(w/iw,h/ih):Math.min(w/iw,h/ih)")
    studio=studio.replace("ctx.drawImage(im,-im.width*ratio/2,-im.height*ratio/2,im.width*ratio,im.height*ratio)", "ctx.drawImage(im,-iw*ratio/2,-ih*ratio/2,iw*ratio,ih*ratio)")
    studio=studio.replace("document.querySelectorAll('video').forEach(v=>", "[...document.querySelectorAll('video'),...Object.values(window.LifeMini?.images||{}).filter(v=>v.tagName==='VIDEO')].forEach(v=>")
    return studio
parts[6]=js_value(parts[6],'GAME_STUDIO',studio_media)
parts[6]=js_value(parts[6],'GAME_SKIN',lambda css:css+'''\n.cylinder-game .play{position:fixed!important;inset:0!important;width:100vw!important;height:100dvh!important;max-width:none!important;max-height:none!important;aspect-ratio:auto!important;margin:0!important;border-radius:0!important}.cylinder-game .hud{position:fixed!important;top:6px;left:12px;width:auto!important;z-index:20}.cylinder-game .play>canvas{width:100%!important;height:100%!important}\n''')
# Travel destinations distinguish starter accommodation, spouse's home and guest invitation.
s=parts[13].replace("{id:'home',name:'우리 집',icon:'house',pos:0,floor:9}","{id:'home',name:'단칸 빌라',icon:'house',pos:0,floor:11},\n {id:'family',name:'가정집',icon:'villa',pos:10,floor:9}")
s=s.replace("theme=h.life.city?.theme||'morning'", "theme=h.life.slot>=10?'night':h.life.slot>=5?'afternoon':'morning'")
s=s.replace("clock.onclick=()=>{theme=['morning','afternoon','night'][(['morning','afternoon','night'].indexOf(theme)+1)%3];remember();refresh();};", "clock.onclick=()=>{if(state!=='map')return;host.tickTime(host.life.slot<10?10-host.life.slot:16-host.life.slot);refresh();};")
s=s.replace("function refresh(){if(!host||!active)return;", "function refresh(){if(!host||!active)return;theme=host.life.slot>=10?'night':host.life.slot>=5?'afternoon':'morning';")
s=s.replace("const d=getDest(id),seconds=duration(origin,id);", "const d=getDest(id);const allowed=d.id==='family'&&host.life.active==='V01'?{ok:true}:host.accessDestination(d.id);if(!allowed.ok)return false;const seconds=duration(origin,id);")
s=s.replace("b.onclick=()=>d.id===origin?leaveMap():start(d.id);rail.append(b);", "const permission=d.id==='family'&&host.life.active==='V01'?{ok:true}:GaiaLife.access(host.life,d.id);b.disabled=!permission.ok;b.title=permission.why||'';if(!permission.ok){t.textContent=d.id==='family'?(host.life.living.married?'재훈련 후 귀가':'결혼 / 방문 의뢰'):'재훈련 후 출근';b.classList.add('locked');}b.onclick=()=>d.id===origin?leaveMap():start(d.id);rail.append(b);")
s=s.replace("origin=destinations.some(d=>d.id===from)?from:","origin=destinations.some(d=>d.id===from)?from:")
parts[13]=js_value(s,'CITY_ENCOUNTER_DOCUMENT',cylinder_media)
# Add model before host and before road; function declarations are hoisted in host.
parts[7]+='\n'+(ROOT/'life-model.js').read_text()
parts[15]=parts[15].replace("function injectGame(doc,config)","function nightBridge(config){return '<script>('+window.GaiaNightBridge.toString()+')('+JSON.stringify(config.difficultyMultiplier||1)+');</'+'script>';}\nfunction injectGame(doc,config)")
exec((ROOT/'repair-build.py').read_text())
exec((ROOT/'final-fixes.py').read_text())
out=original
for m,p in reversed(list(zip(scripts,parts))):out=out[:m.start(2)]+p+out[m.end(2):]
addon=(ROOT/'life-addon.js').read_text().replace('/*BGM_SOURCE*/',json.dumps('data:audio/ogg;base64,'+base64.b64encode((ROOT/'assets/music/loopcity.ogg').read_bytes()).decode()))
# Bridge declaration must exist before boot, while BGM attaches after host initialization.
out=out.replace('<script>\n/* GAIA rebuild.', '<script>\n/* GAIA rebuild.')
insert='<script>'+addon+'</script>'
hoststart=out.index('/* GAIA rebuild.')
scriptstart=out.rfind('<script',0,hoststart)
out=out[:scriptstart]+insert+out[scriptstart:]
out=out.replace('</head>', '<style>'+(ROOT/'life-style.css').read_text()+'</style></head>',1)
target=ROOT/'GAIA-LIFE-20261020.html';target.write_text(out)
for i,p in enumerate(parts):(ROOT/'source'/f'updated-{i}.js').write_text(p)
print(target,len(out.encode()),hashlib.sha256(out.encode()).hexdigest())
