// Lives inside the original host closure; only the original document factories run.
// The RPG load/frame loop and its persistence are disabled by build.py.
window.CasualSources={
 art:ART,portraits:PORTRAITS,
 audioCatalog(id){
  let sources=window.GAIA_SOUND_SOURCES||{};
  if(id==='batting'){if(!window.__casualBatAudio){const m=BATTING_DOCUMENT.match(/const AUDIO\s*=\s*(\{.*?\});/s);window.__casualBatAudio=m?JSON.parse(m[1]):{};}sources=window.__casualBatAudio;}
  const common=['hit_slap','hit_punch','reaction_effort','reaction_surprise','reaction_whine','reaction_happy','reaction_sigh','reaction_cry','reaction_displeased'];
  const extra={squat:['squat90_bgm','squat120_bgm','squat150_bgm','squat90_bed','squat120_bed','squat150_bed',...Array.from({length:7},(_,i)=>'perfect_0'+(i+1))],water:['water_shoot','reaction_pant'],rope:['rope_bed','rope_scream','rope_disappoint'],balance:['balance_bed'],cylinder:['cylinder120_bed','cylinder150_bed'],tap:Object.keys(sources).filter(k=>k.startsWith('tap_mix_'))};
  const names={hit_slap:'찰싹 타격음',hit_punch:'강한 타격음',reaction_effort:'힘주는 반응',reaction_surprise:'놀란 반응',reaction_whine:'작은 탄식',reaction_happy:'기쁜 반응',reaction_sigh:'한숨',reaction_cry:'우는 반응',reaction_displeased:'불만 반응',reaction_pant:'숨 고르기',water_shoot:'물 분사음',rope_bed:'줄 자르기 배경음',rope_scream:'줄 자르기 반응',rope_disappoint:'실패 반응',balance_bed:'균형 배경음',cylinder120_bed:'실린더 배경음 120',cylinder150_bed:'실린더 배경음 150',miss:'실패 소리',normal:'일반 타격 반응',perfect:'정타 효과',homerun:'정타 반응',bgm1:'배경음악 1',bgm2:'배경음악 2',bgm3:'배경음악 3'};
  const result=[...new Set(id==='batting'?Object.keys(sources):[...(extra[id]||[]),...common])].filter(k=>sources[k]).map(key=>({key,src:sources[key],name:names[key]||key.replace(/^squat(\d+)_bgm$/,'스쿼트 배경음악 $1').replace(/^squat(\d+)_bed$/,'스쿼트 박자 트랙 $1').replace(/^perfect_0/,'정타 효과 ').replace(/^tap_mix_/,'연타 반응 ')}));
  if(['water','fetch','wiggle','merge','tap','behind'].includes(id))result.unshift({key:'casual_bgm',name:'배경음악',src:''});return result;
 },
 make(id,stage,outfit,location,media={}){
  if(!window.__casualNativeAudioFixed){
   window.GAIA_NATIVE_AUDIO=window.GAIA_NATIVE_AUDIO
    .replace('.then(a=>ctx.decodeAudioData(a)).catch', '.then(a=>ctx.decodeAudioData(a)).then(b=>window.GaiaAudioTools.prepare(b,name)).catch')
    .replace('node.start();events[name]', 'node.start();window.GaiaAudioTools.note(name,vol);events[name]')
    .replace("gap=activeKind===3?290:520","gap=activeKind===3?420:650")
    .replace('(!forced&&Math.random()>opts.voiceChance)','false')
    .replace("if(Math.random()<.6)react(0,true)","react(0,true)")
    .replace("if(Math.random()<.16)react(0)","react(0,false,'blush')")
    .replace("else if(name==='bonk')hit('punch');break;","else if(name==='bonk')hit('punch');else if(name==='pop'||name==='boing'){hit('slap');react(actor||0,true,'blush');}else if(name==='whoosh')react(actor||0,true,'surprise');else if(name==='ding')resultCue(true);break;")
    .replace("play(choices[Math.floor(Math.random()*choices.length)],.5,'voice');","play(choices[Math.floor(Math.random()*choices.length)],.35,'voice');play(['reaction_effort','reaction_surprise','reaction_whine'][i],.85,'voice');")
    .replace("n==='reaction_cry'?.5:.65","n==='reaction_cry'?.65:.85");
   window.GAIA_GAME_BRIDGE=window.GAIA_GAME_BRIDGE.replace("name==='slap'||name==='bonk'","['slap','bonk','pop','boing','whoosh','ding'].includes(name)").replace("const playing=!!document.querySelector('#mgDialog[open] .mg-controls');","const playing=!window.MEDIA_PAUSED&&!!document.querySelector('#mgDialog[open] .mg-controls');");
   window.__casualNativeAudioFixed=true;
  }
  world.outfit=outfit;const kind={wiggle:0,merge:1,balance:2,tap:3,behind:4,fetch:5}[id]??id;
  const r={id:'casual-'+id,name:'',bg:location==='company'?'company/meeting':id==='fetch'?'../city/park':'요가실'};
  const config={kind,roomId:r.id,outfit,autoStart:false,audio:[],casual:true,stage,
   layout:{portrait:{},landscape:{},targets:{}},background:ART['bg/'+r.bg],
   controlArt:{run:ROOM_ART.ui.action,jump:ROOM_ART.ui.jump},difficultyMultiplier:1,
   water:{level:stage<4?1:2,goal:30+stage*12,duration:40+stage*2},
   cylinder:{duration:35+stage*2,goal:200+stage*55,difficulty:stage<4?1:stage<8?2:3,penalty:false},
   batting:{location:location==='company'?'company':'center',difficulty:stage<4?1:stage<8?2:3,tapStart:true,goal:100+stage*27,plea:'다가오는 순간에 맞춰 터치하세요.'}};
  if(id==='rope')config.layout.targets.goal={x:.5,y:789/1280,z:(190-stage*9)/150,sx:1,sy:1,r:0};
  if(id==='cylinder')config.layout.targets.main={x:.5,y:.5,z:1,sx:1,sy:1,r:0,src:PORTRAITS[outfit]};
  if(id==='squat'){config.squat={...squatConfig(),difficulty:stage<4?1:stage<8?2:3,stage,plea:'스쿼트 · '+stage+'단계'};config.background=ART[config.squat.bgKey]||config.background;}
  let doc;
  if(typeof kind==='number'){
   doc=legacyHost(kind,r,config);
   const init='<script>window.CASUAL_STAGE='+stage+';window.GAME_SCENE='+JSON.stringify(config).replace(/</g,'\\u003c')+';</'+'script>';
   doc=doc.replace('<head>','<head>'+init);
   // Stage controls are fixed by the parent, with no second difficulty picker.
   doc=doc.replace('mgRound.difficulty=0;', 'mgRound.difficulty=Math.min(2,Math.floor((window.CASUAL_STAGE-1)/4));');
   doc=doc.replace('drawLevel(0);','drawLevel(mgRound.difficulty);levels.hidden=true;');
   doc=doc.replace('let left=false,right=false,time=25,','let left=false,right=false,time=25,');
   doc=doc.replace('const scale=Math.min(540/pose.naturalWidth',
    'cfg.wind*=.55+window.CASUAL_STAGE*.09;cfg.limit*=1.25-window.CASUAL_STAGE*.035;const scale=Math.min(540/pose.naturalWidth');
   doc=doc.replace('Math.sin(elapsed*3.7)*.1','Math.sin(elapsed*(2.4+window.CASUAL_STAGE*.21))*.1');
   doc=doc.replace('this.goal=18000;', 'this.goal=10000+window.CASUAL_STAGE*1400;');
   doc=doc.replace('d+=1080+(i%4)*125;', 'd+=Math.max(560,1480-window.CASUAL_STAGE*75)+(i%4)*95;');
   doc=doc.replace('s.speed=Math.max(0,s.speed-(s.stagger>0?300:155)*dt);',
    's.speed=Math.max(s.stagger>0?130:270+window.CASUAL_STAGE*7,s.speed-(s.stagger>0?300:155)*dt);');
   // Stop completion bookkeeping before constructing the old result panel.
   doc=doc.replace('return finishOriginal(score,ratio,message);','mgCleanup();mgStopVoice();if(mgRound)mgRound.finished=true;');
   doc=doc.replace("ratio},'*');", "ratio,success:ratio>=(.35+window.CASUAL_STAGE*.035)},'*');");
   doc=doc.replace(/<p class="mg-small"[^>]*>.*?<\/p>/g,'');
   doc=doc.replace('windowT=Math.max(.95,1.35-(25-time)*.016);','windowT=Math.max(.55,1.65-window.CASUAL_STAGE*.07-(25-time)*.012);');
   doc=doc.replace('Math.min(1,score/500)','Math.min(1,score/(230+window.CASUAL_STAGE*35))');
   doc=doc.replace('(7.5+elapsed*.35)','(5+window.CASUAL_STAGE*.5+elapsed*(.20+window.CASUAL_STAGE*.02))');
   doc=doc.replace("onEvent:event=>{","onEvent:event=>{if(['collision','jump','clear'].includes(event))parent.postMessage({type:'gaia-haptic',event:event==='clear'?'tick':event},'*');");
   doc=doc.replace('falls++;reset=1.1;',"falls++;parent.postMessage({type:'gaia-haptic',event:'collision'},'*');reset=1.1;");
   doc=injectGame(doc,config);
   const localAudio='<script>window.GAIA_SOUND_SOURCES='+JSON.stringify(window.GAIA_SOUND_SOURCES)+';'+window.GAIA_NATIVE_AUDIO+'</'+'script>';
   doc=doc.replace('<meta',localAudio+'<meta');
  }else if(id==='squat'){
   doc=SQUAT_DOCUMENT.replace('/*LIFE_CONFIG*/',JSON.stringify(config).replace(/</g,'\\u003c'));
   doc=doc.replace("+(img.floor?1:0);if(bgKey!==key)","+(img.floor?1:0)+'|'+(window.CASUAL_MEDIA_VERSION||0);if(bgKey!==key)");
   doc=doc.replace('g.drawImage(bgc,0,0,W,H);',"if(!window.CasualCanvasBackground?.(g,W,H))g.drawImage(bgc,0,0,W,H);window.CasualCanvasLayer?.(g,'board',W,H);");
   doc=doc.replace('const PER=60/RULE.bpm', 'RULE.perfect*=1-(CFG.stage-1)*.018;RULE.good*=1-(CFG.stage-1)*.018;RULE.beats+=(CFG.stage<4?CFG.stage-1:CFG.stage<8?CFG.stage-4:CFG.stage-8)*2;const PER=60/RULE.bpm');
   doc=doc.replace("{type:'wellness-result',score:","{type:'wellness-result',roomId:CFG.roomId,score:");
   doc=doc.replace('showReady();', "window.SquatGame.setSound=function(v){window.__sqSound=v;if(master)master.gain.value=v?volume():0;};showReady();");
   doc=doc.replace('master.gain.value=soundOn()?volume():0;', 'master.gain.value=window.__sqSound===false?0:soundOn()?volume():0;');
   doc=doc.replace("function judge(res,e,err){", "function judge(res,e,err){parent.postMessage({type:'gaia-haptic',event:res==='perfect'?'hit':res==='good'?'tick':'collision'},'*');");
   // Add the missing slap sample to the subset used by the squat document.
   doc=injectGame(doc,config);
   doc=doc.replace('<meta','<script>window.GAIA_SOUND_SOURCES.hit_slap='+JSON.stringify(window.GAIA_SOUND_SOURCES.hit_slap)+';</'+'script><meta');
   doc=doc.replace("'hit_punch','reaction_happy'", "'hit_slap','hit_punch','reaction_happy'");
   doc=doc.replace('.then(a=>ac.decodeAudioData(a)).catch', '.then(a=>ac.decodeAudioData(a)).then(b=>window.GaiaAudioTools.prepare(b,name)).catch');
   doc=doc.replace('s.start(Math.max(when,ac.currentTime));sched.push(s);','s.start(Math.max(when,ac.currentTime));window.GaiaAudioTools.note(name,vol);sched.push(s);');
   doc=doc.replace("shot('hit_punch',ac.currentTime+.13,.7)","shot('hit_slap',ac.currentTime,.85)");
   doc=doc.replace('else{combo++;best=',"else{shot('hit_slap',ac.currentTime,.85);combo++;best=");
   doc=doc.replace("lastPerfect=i;voice(PERFECTS[i],.55);", "lastPerfect=i;shot(PERFECTS[i],0,.36);voice(['reaction_happy','reaction_surprise','reaction_whine'][i%3],.88);");
   doc=doc.replace("else voice('reaction_surprise',.55);", "else voice('reaction_surprise',.88);");
   doc=doc.replace("voice('reaction_whine',.55)","voice('reaction_whine',.82)");
   doc=doc.replace('gn.gain.value=RULE.bgmg||1;', 'gn.gain.value=.38;');
   doc=doc.replace('gn.gain.value=.62;', 'gn.gain.value=.28;');
  }else if(id==='batting'){
   doc=injectBatting(BATTING_DOCUMENT,config);
   doc=doc.replace('let images={}', 'window.CasualAssetNames=ASSETS;let images={}');
   doc=doc.replace('drawBackground();ctx.save();',"if(!window.CasualCanvasBackground?.(ctx,W,H))drawBackground();window.CasualCanvasLayer?.(ctx,'board',W,H);ctx.save();");
   doc=doc.replace("(fade?1.15:.60)","(fade?1.15:.88)");
   doc=doc.replace("Sound.play(p?'hit_punch':'hit_slap');shake","Sound.play(p?'hit_punch':'hit_slap');Sound.play(p?'homerun':'normal',true);shake");
   doc=doc.replace('node.start(startAt,starts.get(k)||0);','node.start(startAt,starts.get(k)||0);window.GaiaAudioTools.note(k,voice?1:.95);');
   doc=doc.replace('rule=RULES[CFG.difficulty];',
    'rule={...RULES[CFG.difficulty],window:.19-window.GAME_SCENE.stage*.009,speed:245+window.GAME_SCENE.stage*12,amplitude:Math.max(0,window.GAME_SCENE.stage-3)*8};');
  }else{
   doc=SUITE_DOCUMENT.replaceAll('root.__ropeH','window.__ropeH');
   const a=doc.indexOf('const LEVELS=['),b=doc.indexOf('function intersects',a);
   const levels=[
    {name:'첫 절단',ball:[360,220],anchors:[[360,65]],velocity:[0,0],obstacles:[]},
    {name:'작은 흔들림',ball:[310,240],anchors:[[360,65]],velocity:[0,0],obstacles:[]},
    {name:'반대 방향',ball:[410,240],anchors:[[360,65]],velocity:[0,0],obstacles:[]},
    {name:'두 줄',ball:[360,245],anchors:[[190,65],[530,65]],velocity:[0,0],obstacles:[]},
    {name:'낮은 턱',ball:[290,245],anchors:[[360,65]],velocity:[0,0],obstacles:[{x:80,y:390,w:100,h:22}]},
    {name:'좁은 입구',ball:[430,245],anchors:[[360,65]],velocity:[0,0],obstacles:[]},
    {name:'양쪽 장애물',ball:[360,245],anchors:[[190,65],[530,65]],velocity:[0,0],obstacles:[{x:100,y:430,w:95,h:22},{x:525,y:430,w:95,h:22}]},
    {name:'세 줄의 순서',ball:[360,255],anchors:[[190,65],[530,65],[360,55]],velocity:[0,0],obstacles:[]},
    {name:'흔들림과 절단',ball:[280,255],anchors:[[190,65],[530,65]],velocity:[30,0],obstacles:[{x:90,y:430,w:100,h:22}]},
    {name:'마지막 절단',ball:[440,255],anchors:[[190,65],[530,65],[360,55]],velocity:[-30,0],obstacles:[{x:100,y:450,w:100,h:22},{x:520,y:450,w:100,h:22}]}
   ];
   doc=doc.slice(0,a)+'const LEVELS='+JSON.stringify(levels)+';\n'+doc.slice(b);
   doc=doc.replace('ropeIndex=0,','ropeIndex='+(stage-1)+',');
   doc=doc.replace("if(kind==='rope'&&model.won&&ropeIndex<M.LEVELS.length-1)","if(false)");
   doc=doc.replace('if(model.done)finish();',"if(kind==='water'&&model.caught>=model.goal)model.done=true;if(kind==='rope'&&model.time>60)model.done=true;if(model.done)finish();");
   doc=doc.replace('this.bandWidth=[44,30,18][this.difficulty-1];','this.bandWidth=54-GAME_CONFIG.stage*3.6;');
   doc=doc.replace('this.pressure=42;', 'this.pressure=56;');
   doc=doc.replace('width:(root.__ropeH?150:104)', 'width:(root.__ropeH?Math.max(90,190-GAME_CONFIG.stage*9):104)');
   doc=doc.replace("showResult(r);","/* Parent owns results and disposes this frame. */");
   doc=doc.replace('(model.tiles.length*100):kind', 'model.goal:kind');
   doc=doc.replace('/*LIFE_CONFIG*/',JSON.stringify(config).replace(/</g,'\\u003c'));
   doc=injectGame(doc,config);
  }
  if(typeof kind!=='number'&&id!=='batting')doc=doc.replace('<meta','<script>Object.assign(window.GAIA_SOUND_SOURCES,'+JSON.stringify(window.GAIA_SOUND_SOURCES)+');</'+'script><meta');
  const fontFace=id==='batting'?'<style>'+GAME_SKIN.match(/@font-face\s*\{[^}]*\}/g).join('')+'</style>':'';
  const css=`<style>html,body,button,#time,#score{font-family:Gaia,system-ui,sans-serif!important}html,body{overscroll-behavior:none}#art,#retry,#pause,#sound,.mg-side,.mg-small,.mg-difficulty{display:none!important}.mg-scene{grid-template-columns:1fr!important;grid-template-rows:1fr!important}.mg-board{padding-bottom:8px!important}.mg-preview,.mg-result,.mg-animal-grid,.mg-canvas-wrap{margin-bottom:0!important;padding-bottom:0!important}#mgDialog{width:100vw!important;height:100dvh!important;max-width:none!important;max-height:none!important;margin:0!important;border:0!important;border-radius:0!important}.mg-head{display:none!important}.mg-scene{height:100%!important}.mg-controls button{min-height:58px!important}#sceneMenu,#sceneMenuPanel,#studioButton,#sceneEditorToggle{display:none!important}</style>`;
  // All games pause on document lifecycle, including pointer holds and sound.
  const end='<script>document.addEventListener("pointerdown",e=>{if(!window.MEDIA_PAUSED&&e.button<=0)parent.postMessage({type:"gaia-haptic",event:"tap"},"*");},true);let hcuts=0;setInterval(()=>{const n=window.LifeMini?.model?.cuts||0;if(n>hcuts)parent.postMessage({type:"gaia-haptic",event:"tick"},"*");hcuts=n;},90);addEventListener("pagehide",()=>{window.MEDIA_PAUSED=true;try{window.LifeMini?.pause(true);window.GaiaAudioStatus?.reset();if(typeof mgCleanup==="function")mgCleanup();if(typeof mgStopVoice==="function")mgStopVoice();document.querySelectorAll("audio,video").forEach(x=>x.pause());}catch{}});</'+'script>';
  if(id==='cylinder')doc=doc.replace('</html>','<script>'+window.CASUAL_CYLINDER_MEDIA+'</'+'script></html>');
  for(const slot of this.audioCatalog(id)){const custom=media.audio?.[slot.key]?.src;if(custom&&slot.src)doc=doc.replaceAll(slot.src,custom);}
  const mediaBoot='<script>window.CASUAL_MEDIA_RECORD='+JSON.stringify(media).replace(/</g,'\\u003c')+';'+window.CASUAL_MEDIA_CHILD+'</'+'script>';
  doc=doc.replace('<meta',mediaBoot+'<meta');
  return doc.replace('<meta','<script>'+window.CASUAL_AUDIO_TOOLS+'</'+'script>'+fontFace+css+'<meta').replace('</html>',end+'</html>');
 }
};
mode='casual';

