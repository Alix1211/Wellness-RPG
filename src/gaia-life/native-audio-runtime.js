(()=>{'use strict';
  if(!window.GAIA_SOUND_SOURCES)return;
  const sources=window.GAIA_SOUND_SOURCES;
  const cap=(v,a,b)=>Math.min(b,Math.max(a,v));
  let saved={};try{saved=JSON.parse(localStorage.getItem('gaia-audio-options-v1')||'{}')}catch{}
  const option=(key,def,low,high)=>{const n=Number(saved[key]);return Number.isFinite(n)&&n>=low&&n<=high?n:def;};
  const opts={volume:option('volume',.8,.05,1),hitGap:option('hitGap',140,55,800),voiceChance:option('voiceChance',.75,.15,1)};
  const save=()=>{try{localStorage.setItem('gaia-audio-options-v1',JSON.stringify(opts));}catch{}};
  const AudioContextClass=window.AudioContext||window.webkitAudioContext;
  let ac=null,master=null,compressor=null,bed=null,bedPending=null,bedToken=0,epoch=0;
  let lastHit=-100000,lastVoice=-100000,activeKind=null,tapTimes=[],voices=[],effects=[];
  const caches=new Map(),errors=[],events={};
  const noteError=(label,err)=>{const msg=label+': '+String(err?.message||err);errors.push(msg);if(errors.length>12)errors.shift();console.warn('[GAIA audio]',msg);};
  function ensureContext(){
    if(!AudioContextClass)return null;
    if(ac)return ac;
    try{
      ac=new AudioContextClass({latencyHint:'interactive'});
      compressor=ac.createDynamicsCompressor();compressor.threshold.value=-14;compressor.knee.value=12;compressor.ratio.value=6;
      compressor.attack.value=.002;compressor.release.value=.16;
      master=ac.createGain();master.gain.value=opts.volume;
      master.connect(compressor);compressor.connect(ac.destination);
      return ac;
    }catch(e){noteError('AudioContext',e);return null;}
  }
  function unlock(){
    const ctx=ensureContext();if(!ctx)return;
    if(ctx.state==='suspended'){
      ctx.resume().catch(e=>noteError('AudioContext resume',e));
      // Starting a silent source in the same trusted gesture unlocks Android/iOS WebAudio playback.
      try{const src=ctx.createBufferSource();src.buffer=ctx.createBuffer(1,1,22050);src.connect(master);src.start();}catch(e){noteError('unlock source',e);}
    }
  }
  // Input capture occurs in the parent BEFORE startGame() awaits Studio.resolve(),
  // so no child auto-start or cross-frame postMessage needs to carry user activation.
  document.addEventListener('pointerdown',unlock,{capture:true,passive:true});
  document.addEventListener('touchstart',unlock,{capture:true,passive:true});
  document.addEventListener('keydown',unlock,{capture:true});
  document.addEventListener('click',unlock,{capture:true});
  async function load(name){
    if(!sources[name])return null;
    const ctx=ensureContext();if(!ctx)return null;
    if(!caches.has(name)){
      const task=Promise.resolve().then(()=>{const raw=atob(sources[name].split(',')[1]);return Uint8Array.from(raw,c=>c.charCodeAt(0)).buffer;}).then(a=>ctx.decodeAudioData(a)).catch(e=>{caches.delete(name);noteError('decode '+name,e);return null;});
      caches.set(name,task);
    }
    return caches.get(name);
  }
  function disconnectSource(item){
    if(!item)return;
    try{item.node.onended=null;item.node.stop();}catch{}
    try{item.node.disconnect();item.gain.disconnect()}catch{}
  }
  function clearPool(pool){for(const item of pool.splice(0))disconnectSource(item);}
  async function play(name,vol=.5,group='effect'){
    if(!sources[name]||document.hidden)return null;
    const requestEpoch=epoch;
    const buffer=await load(name),ctx=ac;
    if(!buffer||!ctx||requestEpoch!==epoch||document.hidden)return null;
    try{
      const node=ctx.createBufferSource(),gain=ctx.createGain();
      node.buffer=buffer;gain.gain.value=vol;
      node.connect(gain).connect(master);
      const pool=group==='voice'?voices:effects,max=group==='voice'?2:6;
      while(pool.length>=max)disconnectSource(pool.shift());
      const item={node,gain,name};pool.push(item);
      node.onended=()=>{const i=pool.indexOf(item);if(i>=0)pool.splice(i,1);try{node.disconnect();gain.disconnect()}catch{}};
      node.start();events[name]=(events[name]||0)+1;
      if(ctx.state!=='running')noteError('AudioContext not running for '+name,ctx.state);
      return item;
    }catch(e){noteError('play '+name,e);return null;}
  }
  function stopBed(){bedToken++;bedPending=null;if(bed){disconnectSource(bed);bed=null;}}
  async function startBed(name){
    if(!name||!sources[name]){stopBed();return;}
    if(bed?.name===name||bedPending===name)return;
    stopBed();const tok=bedToken,gameEpoch=epoch;
    bedPending=name;
    const buffer=await load(name),ctx=ac;
    if(tok!==bedToken||gameEpoch!==epoch||bedPending!==name||document.hidden)return;
    bedPending=null;
    if(!buffer||!ctx)return;
    try{
      const node=ctx.createBufferSource(),gain=ctx.createGain();node.buffer=buffer;node.loop=true;
      gain.gain.value=.6;node.connect(gain).connect(master);node.start();
      bed={node,gain,name};events[name]=(events[name]||0)+1;
      if(ctx.state!=='running')noteError('AudioContext not running for '+name,ctx.state);
    }catch(e){noteError('bed '+name,e);}
  }
  const bedFor=kind=>kind==='rope'?'rope_bed':kind===2?'balance_bed':kind==='cylinder'?'cylinder120_bed':null;
  function react(actor=0,forced=false,mood=''){
    const now=performance.now(),gap=activeKind===3?290:520;
    if(now-lastVoice<gap||(!forced&&Math.random()>opts.voiceChance))return;
    lastVoice=now;
    if(activeKind===3){const i=cap(actor|0,0,2),choices=[1,2,3].map(n=>`tap_mix_${i+1}_${n}`);play(choices[Math.floor(Math.random()*choices.length)],.5,'voice');}
    else{
      const pools={cry:['reaction_cry','reaction_whine'],tear:['reaction_whine','reaction_sigh'],surprise:['reaction_surprise','reaction_effort'],blush:['reaction_happy','reaction_sigh'],calm:['reaction_displeased','reaction_effort']};
      const list=pools[mood]||['reaction_surprise','reaction_effort','reaction_whine','reaction_displeased','reaction_happy'];
      const n=list[Math.floor(Math.random()*list.length)];play(n,n==='reaction_cry'?.5:.65,'voice');
    }
  }
  function hit(which='slap'){
    const now=performance.now();if(now-lastHit<opts.hitGap)return;
    lastHit=now;play(which==='punch'?'hit_punch':'hit_slap',which==='punch'?.7:.65,'effect');
  }
  function reset(){epoch++;stopBed();clearPool(voices);clearPool(effects);tapTimes=[];lastHit=-100000;lastVoice=-100000;activeKind=null;}
  function resultCue(win){const c=ensureContext();if(!c)return;const notes=win?[392,494,587]:[392,330,247];notes.forEach((hz,i)=>{const o=c.createOscillator(),g=c.createGain(),at=c.currentTime+i*.16;o.type='sine';o.frequency.value=hz;g.gain.setValueAtTime(0,at);g.gain.linearRampToValueAtTime(.1,at+.015);g.gain.exponentialRampToValueAtTime(.001,at+.24);o.connect(g).connect(master);o.start(at);o.stop(at+.25);o.onended=()=>{o.disconnect();g.disconnect()};});events[win?'result_win':'result_fail']=(events[win?'result_win':'result_fail']||0)+1;}
  function onGame(event,kind,actor,name,mood,force){
    if(event==='bridge-ready')return;if(window.LifeMini?.sound.enabled===false&&event!=='bed-stop'&&event!=='voices-stop')return;unlock();
    activeKind=kind;
    switch(event){
      case 'outcome-fail':stopBed();clearPool(voices);play('reaction_sigh',.6,'voice');resultCue(false);break;
      case 'outcome-win':stopBed();resultCue(true);play('reaction_happy',.6,'voice');break;
      case 'bed-start':startBed(bedFor(kind));break;
      case 'bed-stop':stopBed();break;
      case 'voices-stop':clearPool(voices);break;
      case 'effect':if(name==='slap')hit(Math.random()<.22?'punch':'slap');else if(name==='bonk')hit('punch');break;
      case 'voice':react(actor||0,!!force,mood||'');break;
      case 'penalty-hit':hit('slap');react(0);break;
      case 'rope-cut':hit('slap');if(Math.random()<.6)react(0,true);break;
      case 'water-voice':{
        const list=['reaction_effort','reaction_pant','reaction_sigh','reaction_whine'];
        const sample=list[Math.floor(Math.random()*list.length)];
        // Water input must be audible even on short taps, and independent of the bed tracks.
        if(performance.now()-lastVoice>650){lastVoice=performance.now();play(sample,sample==='reaction_pant'?.43:.62,'voice');}break;
      }
      case 'cylinder-tap':{
        const t=performance.now();tapTimes.push(t);tapTimes=tapTimes.filter(v=>t-v<1800);
        if(tapTimes.length>=5&&sources.cylinder150_bed)startBed('cylinder150_bed');
        else if(tapTimes.length<=3)startBed('cylinder120_bed');
        if(Math.random()<.16)react(0);break;
      }
    }
  }
  document.addEventListener('visibilitychange',()=>{if(document.hidden)reset()});
  addEventListener('pagehide',reset);
  window.GaiaAudioStatus={
    get activeKind(){return activeKind},get options(){return {...opts}},get state(){return ac?.state||'uninitialized'},
    get playing(){return{bed:bed?.name||null,pending:bedPending,voices:voices.length,effects:effects.length}},
    get events(){return {...events}},get errors(){return [...errors]},sources:Object.keys(sources),unlock,reset,event:onGame,
  };
})();

