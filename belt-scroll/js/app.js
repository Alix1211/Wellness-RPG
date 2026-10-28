window.AlleyAudio=(()=>{
  let music=null,musicKey='',muted=false,context=null,master=null,voiceNode=null,lastVoiceAt=-1000,lastVoiceKey='',lastDieKey='',lastEnemyAt=-1000,duckUntil=0,epoch=0;
  const buffers={},pending={},active=new Set(),history=[];
  function init(){
    if(!context){context=new (window.AudioContext||window.webkitAudioContext)();master=context.createGain();master.gain.value=.84*(window.GaiaSettings?.effects??1);const limiter=context.createDynamicsCompressor();limiter.threshold.value=-5;limiter.knee.value=10;limiter.ratio.value=5;master.connect(limiter);limiter.connect(context.destination);}
    if(context.state==='suspended')context.resume().catch(()=>{});return context;
  }
  async function buffer(key){
    if(buffers[key])return buffers[key];if(pending[key])return pending[key];const src=AUDIO_ASSETS[key];if(!src)return null;
    return pending[key]=(async()=>{try{const c=init(),raw=atob(src.slice(src.indexOf(',')+1)),bytes=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);return buffers[key]=await c.decodeAudioData(bytes.buffer);}catch{return null;}})();
  }
  function remember(type,key){history.push({type,key,at:performance.now()});if(history.length>60)history.shift();}
  function preload(){try{init();const dv=window.DIE_VOICES||{male:[],female:[]};for(const key of ['rosie_strain','rosie_pant','rosie_sigh','rosie_surprise','rosie_yelp','rosie_cry','hit','enemy_m01','enemy_m05','enemy_m11','enemy_m16',...dv.male,...dv.female])buffer(key);}catch{}}
  // 적이 쓰러질 때 비명: 남성은 '으악' 계열, 여성(채찍 여전사·제작사 회장)은 신음 한 번. 직전과 같은 소리는 피한다.
  function die(kind){
    if(muted)return;const dv=window.DIE_VOICES;if(!dv)return;const pool=(['whip','heiress'].includes(kind)?dv.female:dv.male)||[];if(!pool.length)return;
    const opts=pool.filter(k=>k!==lastDieKey),pick=opts.length?opts:pool,key=pick[Math.floor(Math.random()*pick.length)];
    lastDieKey=key;remember('die',key);play(key,.95,1.7,false);
  }
  async function play(key,volume=.5,limit=0,voice=false){
    if(muted)return;const ticket=epoch,b=await buffer(key);if(!b||muted||ticket!==epoch)return;
    const c=init(),node=c.createBufferSource(),gain=c.createGain();node.buffer=b;node.connect(gain);gain.connect(master);
    const duration=limit?Math.min(b.duration,limit):b.duration,now=c.currentTime;
    gain.gain.setValueAtTime(volume,now);if(duration>.13){gain.gain.setValueAtTime(volume,now+duration-.1);gain.gain.linearRampToValueAtTime(.001,now+duration);}
    if(voice&&voiceNode){try{voiceNode.stop();}catch{}}
    if(voice)voiceNode=node;active.add(node);node.onended=()=>{active.delete(node);if(voiceNode===node)voiceNode=null;};node.start(now);node.stop(now+duration+.01);
  }
  function hero(action){
    if(muted)return;const now=performance.now();if(now-lastVoiceAt<290&&!['hurt','down','slam'].includes(action))return;
    const bank={upper:['rosie_strain','rosie_pant'],lower:['rosie_pant','rosie_strain'],slam:['rosie_strain','rosie_pant'],jump:['rosie_sigh','rosie_pant'],guard:['rosie_strain'],hurt:['rosie_yelp','rosie_surprise','rosie_pant'],down:['rosie_cry','rosie_yelp']}[action]||['rosie_pant'];
    const options=bank.filter(k=>k!==lastVoiceKey),pool=options.length?options:bank,key=pool[Math.floor(Math.random()*pool.length)];
    lastVoiceAt=now;lastVoiceKey=key;remember('hero:'+action,key);duckUntil=now+850;
    if(music)music.volume=.11*(window.GaiaSettings?.music??1);play(key,action==='down'?.85:action==='hurt'?.82:1.0,action==='down'?1.5:action==='lower'||action==='slam'?1.05:.75,true);
  }
  function impact(strong,kind){
    remember('impact','hit');play('hit',strong?.7:.55,.27,false);
    const now=performance.now();if(now-lastEnemyAt<680)return;lastEnemyAt=now;
    if(!['whip','grenadier'].includes(kind)){const keys=['enemy_m01','enemy_m05','enemy_m11','enemy_m16'];play(keys[Math.floor(Math.random()*keys.length)],.45,.7);}
  }
  function cartoon(kind){
    if(muted)return;try{const c=init(),now=c.currentTime,osc=c.createOscillator(),gain=c.createGain();osc.connect(gain);gain.connect(master);osc.type=kind==='boss'?'triangle':'sine';
      const notes=kind==='spring'?[[0,180],[.08,570],[.18,250],[.32,760]]:kind==='cuffs'?[[0,1300],[.07,900],[.12,1700]]:kind==='boss'?[[0,95],[.12,40],[.22,65]]:[[0,460],[.1,730],[.2,260]];
      for(const [t,f] of notes)osc.frequency.exponentialRampToValueAtTime(f,now+t+.001);
      gain.gain.setValueAtTime(kind==='boss'?.32:.11,now);gain.gain.exponentialRampToValueAtTime(.001,now+.39);active.add(osc);osc.onended=()=>active.delete(osc);osc.start(now);osc.stop(now+.4);remember('exit',kind);
    }catch{}
  }
  function weapon(kind){
    if(muted)return;try{const c=init(),now=c.currentTime,duration=kind==='whip'?.065:kind==='bullet'?.075:kind==='flame'?.3:kind==='rocket'?.23:.10;
      const count=Math.ceil(c.sampleRate*duration),b=c.createBuffer(1,count,c.sampleRate),a=b.getChannelData(0);
      for(let i=0;i<count;i++)a[i]=(Math.random()*2-1)*Math.pow(1-i/count,1.8);
      const n=c.createBufferSource(),filter=c.createBiquadFilter(),gain=c.createGain();n.buffer=b;filter.type='bandpass';filter.frequency.setValueAtTime(kind==='whip'?4300:kind==='flame'?900:kind==='rocket'?450:1400,now);filter.Q.value=.7;gain.gain.value=kind==='whip'?.25:.18;n.connect(filter);filter.connect(gain);gain.connect(master);active.add(n);n.onended=()=>active.delete(n);n.start(now);remember('weapon',kind);
    }catch{}
  }
  function bgm(next){
    preload();if(musicKey===next){if(music&&!muted)music.play().catch(()=>{});return;}
    if(music){music.pause();music.src='';}musicKey=next;if(!next||!AUDIO_ASSETS[next]){music=null;return;}
    music=new Audio(AUDIO_ASSETS[next]);music.loop=true;music.volume=(next==='map'?.2:.24)*(window.GaiaSettings?.music??1);if(!muted)music.play().catch(()=>{});
  }
  function pause(){epoch++;music?.pause();for(const n of active){try{n.stop();}catch{}}active.clear();}
  function effect(name,volume=.4){remember('effect',name);play(name,volume);}
  function mute(v){muted=v;if(v)pause();else if(music)music.play().catch(()=>{});}
  function tick(){if(music&&!muted&&performance.now()>duckUntil){const target=(musicKey==='map'?.2:.24)*(window.GaiaSettings?.music??1);music.volume=Math.min(target,music.volume+.007);}}
  function setLevels(){if(master)master.gain.value=.84*(window.GaiaSettings?.effects??1);if(music)music.volume=(performance.now()<duckUntil?.11:musicKey==='map'?.2:.24)*(window.GaiaSettings?.music??1);}
  return {setLevels,bgm,pause,effect,mute,hero,impact,die,preload,tick,cartoon,weapon,debug:()=>({muted,history:history.slice(),loaded:Object.keys(buffers),context:context?.state,active:active.size})};
})();

window.GAIA=window.GAIA||{};
window.DetectiveApp=(()=>{
 const KEY='gaia_detective_alley_campaign_v1',C=GaiaCampaign;
 const fresh=()=>({version:1,gold:80,hp:160,mp:100,stage1:false,stage2:false,stage3:false,stage4:false,arrests:0,checkpoint:{},records:{},last:'police',eventRuns:0});
 let state=fresh();try{const v=JSON.parse(localStorage.getItem(KEY));if(v?.version===1)state={...state,...v};}catch{}
 state.checkpoint=state.checkpoint||{};state.stats=Object.assign({색기:0,음란도:0,복종도:0,개방성:0},state.stats||{});if(typeof state.tickets!=='number')state.tickets=3;state.records=state.records||{};state.mp=Math.max(0,Math.min(100,Number(state.mp)||0));
 let chosen=state.stage1?2:1,locationId='warehouse',engineReady=false;
 const $=id=>document.getElementById(id),region=()=>C.regions[locationId];
 function save(){try{localStorage.setItem(KEY,JSON.stringify(state));}catch{}}
 function closeEntry(){$('missionEntry').classList.add('hidden');BeltCards.closeBox();}
 function sync(){$('cityGold').textContent=state.gold+' G';$('cityHP').textContent=Math.ceil(state.hp)+' / 160';$('cityProgress').textContent=state.stage12?'환락가 수사 완료':state.stage8?'1막 수사 완료':state.stage4?'클럽 수사 완료':'수사 진행';if(GAIA.map.refresh)GAIA.map.refresh();}
 function city(){closeEntry();$('game-shell').classList.add('hidden');document.body.classList.remove('inbattle');$('cityTop').classList.remove('hidden');AlleyAudio.bgm('map');GAIA.map.open();sync();}
 // 시나리오 순서대로 개방: 앞 지역의 스테이지를 모두 깨야 다음 지역이 열린다.
 const ORDER=['warehouse','club','farm','hotel','studio','district','park','casino'];
 const regionDone=id=>C.regions[id].stages.every(n=>state['stage'+n]);
 const regionOpen=id=>{const i=ORDER.indexOf(id);return i<=0||regionDone(ORDER[i-1]);};
 function enter(id){
  if(id!=='police'&&(!C.regions[id]||!regionOpen(id)))return;state.last=id;save();AlleyAudio.bgm('map');
  if(id==='police'){$('entryTitle').textContent='경찰서';$('stageChoices').classList.add('hidden');$('entryArt').style.backgroundImage=`url('${GAIA_IMG['place/police_land.webp']}')`;$('deploy').textContent=state.hp<160||state.mp<100?'휴식':'회복 완료';$('deploy').disabled=state.hp>=160&&state.mp>=100;$('deploy').onclick=()=>{state.hp=160;state.mp=100;save();sync();enter('police');};BeltCards.openBox();}
  else{BeltCards.closeBox();locationId=id;const r=region();if(!r.stages.includes(chosen))chosen=r.stages.find(n=>!state['stage'+n])||r.stages[0];$('entryTitle').textContent=r.name;$('stageChoices').classList.remove('hidden');choose(chosen);}
  $('missionEntry').classList.remove('hidden');
 }
 function choose(stage){
  const r=region();if(!r||!r.stages.includes(stage)||r.stages.indexOf(stage)>0&&!state['stage'+r.stages[0]])return;chosen=stage;
  const first=r.stages[0],second=r.stages[1];$('stageOne').classList.toggle('selected',stage===first);$('stageTwo').classList.toggle('selected',stage===second);$('stageTwo').classList.toggle('hidden',!second);$('stageChoices').style.gridTemplateColumns=second?'':'1fr';$('stageTwo').disabled=!!second&&!state['stage'+first];
  $('stageOne').querySelector('b').textContent=(r.stages.length===1?(stage===14?(state.stage14?'슬롯머신':'출동'):'이벤트 출동'):'01')+(state['stage'+first]?' ✓':'');$('stageTwo').querySelector('b').textContent='02'+(state['stage'+second]?' ✓':'');
  const bg=C.stages[stage].entry||C.stages[stage].bg,src=window.REGION_ART?.[bg]||'assets/'+bg+'.webp';$('entryArt').style.backgroundImage=`url('${src}')`;
  const cp=state.checkpoint[stage]||0;$('deploy').textContent=engineReady?(cp?'이어서':'출동'):'…';$('deploy').disabled=!engineReady;$('deploy').onclick=()=>start(stage,cp);if(stage===14&&state.stage14){$('deploy').textContent='슬롯머신';$('deploy').disabled=false;$('deploy').onclick=()=>{const open=()=>BeltSlot.open();if(window.BeltStory)BeltStory.play('casino.revisit',{title:'카지노 · 재방문',name:'카지노 경호원',portrait:window.__GAME_ASSET?.bouncer||''},open);else open();};}
 }
 function start(stage,checkpoint=0){const info=C.stages[stage];if(!engineReady||!info)return;const r=C.regions[info.region];if(r.stages.indexOf(stage)>0&&!state['stage'+r.stages[0]])return;locationId=info.region;state.last=locationId;closeEntry();GAIA.map.close();document.body.classList.add('inbattle');$('cityTop').classList.add('hidden');$('game-shell').classList.remove('hidden');AlleyGame.start(stage,checkpoint);AlleyGame.focus();}
 function result(info){state.hp=Math.max(1,info.hp);state.mp=Math.max(0,Math.min(100,info.mp??state.mp));state.arrests+=info.arrests;state.slotUsed=0;state.lastReward='';state.tickets=Math.min(9,state.tickets+(info.won?2:1));if(!info.won){state.hp=Math.min(160,state.hp+30);state.stats.복종도=Math.min(30,state.stats.복종도+1);}const n=info.stage,r=C.regions[C.stages[n].region];if(info.won){state['stage'+n]=true;state.checkpoint[n]=0;if(r.stages.length>1&&n===r.stages[0])chosen=n+1;const old=state.records[n];state.records[n]={time:old?Math.min(old.time,info.elapsed):info.elapsed,arrests:info.arrests};state.hp=Math.min(160,state.hp+40);state.lastReward=BeltCards.reward(n);if(n===13)state.eventRuns=(state.eventRuns||0)+1;if(n===10)state.last='district';}save();sync();}
 GAIA.config={player:{maxHp:160}};GAIA.run={get:()=>({wl:Math.floor(Object.keys(state).filter(k=>/^stage\d+$/.test(k)&&state[k]).length/3),hp:Math.ceil(state.hp),deck:[]}),spotInfo:id=>id==='police'?{state:'open',title:'경찰서',sub:'',go:'들어가기'}:C.regions[id]?(!regionOpen(id)?{state:'locked',title:C.regions[id].name,sub:'앞 지역을 먼저 클리어하세요',go:null}:regionDone(id)?{state:'clear',title:C.regions[id].name,sub:'클리어',go:id==='casino'?'슬롯머신':'다시 출동'}:{state:'open',title:C.regions[id].name,sub:'',go:'출동'}):{state:'locked',sub:'',go:null},enter};
 function init(){$('entryBack').onclick=closeEntry;$('stageOne').onclick=()=>choose(region().stages[0]);$('stageTwo').onclick=()=>choose(region().stages[1]);$('mapBag').textContent='경찰서';$('mapBag').onclick=()=>enter('police');$('cityFocus').onclick=()=>enter('warehouse');$('cityClub').onclick=()=>enter('club');city();if(window.BeltStory&&!state.storySeen?.policeBegin){BeltStory.play('police.begin',{title:'경찰서 · 출근',...window.BeltDialogue.actors.chief},()=>{state.storySeen={...state.storySeen,policeBegin:true};save();});}}
 function ready(){engineReady=true;sync();if(!$('missionEntry').classList.contains('hidden')&&C.regions[state.last])choose(chosen);}
 return {state,sync,save,city,enter,start,result,ready,init};
})();
