// Lives inside the original host closure; only the original document factories run.
// The RPG load/frame loop and its persistence are disabled by build.py.
window.CasualSources={
 art:ART,portraits:PORTRAITS,
 make(id,stage,outfit,location){
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
  if(id==='water')for(let i=0;i<(stage<4?2:4);i++){const t=(stage<4?[{x:80,y:230},{x:390,y:230}]:[{x:80,y:62},{x:390,y:62},{x:80,y:336},{x:390,y:336}])[i];config.layout.targets['water'+i]={x:(t.x+125)/720,y:(t.y+125)/720,z:(50-stage*2)/(stage<4?32:19),sx:1,sy:1,r:0};}
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
   doc=doc.replace('model.aim(model.muzzle.x,model.muzzle.y-220);','model.aim(p.x,p.y);');
   doc=doc.replace('const dx=p.x-lastCut.x,dy=p.y-lastCut.y,power=e.pointerType===\'pen\'&&e.pressure>.05?e.pressure*500:220+dy*2.5;model.aim(model.muzzle.x-dx*2.2,model.muzzle.y-M.clamp(power,120,630));','model.aim(p.x,p.y);');
   doc=doc.replace('this.bandWidth=[44,30,18][this.difficulty-1];','this.bandWidth=54-GAME_CONFIG.stage*3.6;');
   doc=doc.replace('this.pressure=42;', 'this.pressure=56;');
   doc=doc.replace('this.level===1?46:28','Math.max(25,50-GAME_CONFIG.stage*2)').replace('this.level===1?46:28','Math.max(25,50-GAME_CONFIG.stage*2)');
   doc=doc.replace('if(this.done)return;dt=Math.min(dt,this.left);this.left=',
    'if(this.done)return;if(GAME_CONFIG.stage>=7){this.tiles.forEach((t,i)=>{if(!t.baseX)t.baseX=t.x;t.x=t.baseX+Math.sin((this.duration-this.left)*(.6+GAME_CONFIG.stage*.035)+i)*((GAME_CONFIG.stage-6)*5);t.cx=t.x+t.size/2;});}dt=Math.min(dt,this.left);this.left=');
   doc=doc.replace('width:(root.__ropeH?150:104)', 'width:(root.__ropeH?Math.max(90,190-GAME_CONFIG.stage*9):104)');
   doc=doc.replace("showResult(r);","/* Parent owns results and disposes this frame. */");
   // Bottle art follows the actual hit opening and fill amount.
   const wa=doc.indexOf('function drawWater(){'),wb=doc.indexOf('function drawRope(){',wa);
   doc=doc.slice(0,wa)+`function drawWater(){for(const [i,t]of model.tiles.entries()){const x=t.cx,y=t.cy;ctx.save();ctx.shadowColor='#345b4420';ctx.shadowBlur=10;round(x-65,y+24,130,122,25,'#f7fff9df','#76a8a0');ctx.restore();ctx.fillStyle='#8bcfd5';ctx.globalAlpha=.7;ctx.fillRect(x-58,y+138-t.fill*.95,116,t.fill*.95);ctx.globalAlpha=1;round(x-38,y-7,76,38,10,'#e4f4ec','#76a8a0');ctx.fillStyle='#334f52';ctx.beginPath();ctx.ellipse(x,y,Math.max(15,t.rx),Math.max(10,t.ry*.38),0,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=4;ctx.stroke();txt(Math.floor(t.fill)+'%',x,y+174,22,'#365d57');}for(const p of model.particles){ctx.fillStyle='#78c8e8';ctx.beginPath();ctx.ellipse(p.x,p.y,4,7,.3,0,Math.PI*2);ctx.fill();}const o=model.muzzle,ang=Math.atan2(model.target.y-o.y,model.target.x-o.x)+Math.PI/2;ctx.save();ctx.translate(o.x,o.y);ctx.rotate(ang);round(-12,-15,24,48,5,'#6faec2');round(-42,13,44,24,12,'#a2cba6');round(-8,32,16,25,4,'#578591');ctx.restore();}
`+doc.slice(wb);
   doc=doc.replace('(model.tiles.length*100):kind', 'model.goal:kind');
   doc=doc.replace('/*LIFE_CONFIG*/',JSON.stringify(config).replace(/</g,'\\u003c'));
   doc=injectGame(doc,config);
  }
  if(typeof kind!=='number'&&id!=='batting')doc=doc.replace('<meta','<script>Object.assign(window.GAIA_SOUND_SOURCES,'+JSON.stringify(window.GAIA_SOUND_SOURCES)+');</'+'script><meta');
  const fontFace=id==='batting'?'<style>'+GAME_SKIN.match(/@font-face\s*\{[^}]*\}/g).join('')+'</style>':'';
  const css=`<style>html,body,button,#time,#score{font-family:Gaia,system-ui,sans-serif!important}html,body{overscroll-behavior:none}#art,#retry,#pause,#sound,.mg-side,.mg-small,.mg-difficulty{display:none!important}.mg-scene{grid-template-columns:1fr!important;grid-template-rows:1fr!important}.mg-board{padding-bottom:8px!important}.mg-preview,.mg-result,.mg-animal-grid,.mg-canvas-wrap{margin-bottom:0!important;padding-bottom:0!important}#mgDialog{width:100vw!important;height:100dvh!important;max-width:none!important;max-height:none!important;margin:0!important;border:0!important;border-radius:0!important}.mg-head{display:none!important}.mg-scene{height:100%!important}.mg-controls button{min-height:58px!important}#sceneMenu,#sceneMenuPanel,#studioButton,#sceneEditorToggle{display:none!important}</style>`;
  // All games pause on document lifecycle, including pointer holds and sound.
  const end='<script>document.addEventListener("pointerdown",e=>{if(!window.MEDIA_PAUSED&&e.button<=0)parent.postMessage({type:"gaia-haptic",event:"tap"},"*");},true);let hcuts=0;setInterval(()=>{const n=window.LifeMini?.model?.cuts||0;if(n>hcuts)parent.postMessage({type:"gaia-haptic",event:"tick"},"*");hcuts=n;},90);addEventListener("pagehide",()=>{window.MEDIA_PAUSED=true;try{window.LifeMini?.pause(true);window.GaiaAudioStatus?.reset();if(typeof mgCleanup==="function")mgCleanup();if(typeof mgStopVoice==="function")mgStopVoice();document.querySelectorAll("audio,video").forEach(x=>x.pause());}catch{}});</'+'script>';
  return doc.replace('<meta','<script>'+window.CASUAL_AUDIO_TOOLS+'</'+'script>'+fontFace+css+'<meta').replace('</html>',end+'</html>');
 }
};
mode='casual';
