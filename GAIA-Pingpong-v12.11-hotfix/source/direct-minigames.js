// Existing minigame documents run directly in the main game's one game frame.
// There is no Training.html container and no second, nested game frame.
const DirectMinigames=(()=>{
 let run=null,done=false,paused=false,startTimer=null;
 const frame=$('#gameFrame');
 function expand(text){return text.replace(/@@GAIA9_(\d+)@@/g,(_,n)=>expand(MINI_POOL[Number(n)]));}
 async function savedMedia(id){try{const db=await new Promise((ok,no)=>{const r=indexedDB.open('gaia-casual-media-v1',1);r.onupgradeneeded=()=>r.result.createObjectStore('games');r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error)});return await new Promise(ok=>{const r=db.transaction('games').objectStore('games').get(id);r.onsuccess=()=>{db.close();ok(r.result||{})};r.onerror=()=>{db.close();ok({})}})}catch{return {}}}
 function pause(value){paused=value;try{const w=frame.contentWindow;w.MEDIA_PAUSED=value;w.LifeMini?.pause(value);if(value){w.GaiaAudioStatus?.reset();w.mgStopVoice?.();w.document.querySelectorAll('audio,video').forEach(m=>m.pause());}else w.GaiaAudioStatus?.unlock();}catch{}}
 async function begin(){const expected=run,w=frame.contentWindow;if(!expected||done||w.GAME_SCENE?.roomId!=='casual-'+expected.game)return;
  try{w.localStorage.setItem('gaia-casual-sound',expected.muted?'off':'on');w.__casualSound=!expected.muted;
   if(['balance','fetch','wiggle','tap','behind'].includes(expected.game))w.eval('S.cfg.sound='+!expected.muted);
   if(w.SquatGame){w.SquatGame.setSound?.(!expected.muted);}
   else if(w.LifeMini){if(expected.game==='cylinder'){await w.CylinderArtReady;await Promise.all(Object.values(w.LifeMini.images||{}).filter(im=>im.tagName==='IMG').map(im=>im.decode?.().catch(()=>{})));if(done||run!==expected)return;
    const slot=w.document.querySelector('#slot'),upload=w.document.querySelector('#upload'),restore=w.document.querySelector('#restore');
    if(slot&&![...slot.options].some(o=>o.value==='bg'))slot.add(new w.Option('배경판','bg'));
    slot?.addEventListener('change',()=>{w.MEDIA_BACKGROUND=slot.value!=='bg'||!w.LifeMini.images?.bg;});
    upload?.addEventListener('change',()=>{if(slot?.value==='bg')w.MEDIA_BACKGROUND=false;});
    restore?.addEventListener('click',()=>{if(slot?.value==='bg')w.MEDIA_BACKGROUND=true;});
   }w.LifeMini.begin?.();}
   else if(w.BattingGame){const b=[...w.document.querySelectorAll('button')].find(b=>/^시작|게임 시작|배팅 시작/.test(b.textContent.trim()));b?.click();}
   else{const b=[...w.document.querySelectorAll('button')].find(b=>b.textContent.trim()==='시작!');if(b&&!b.disabled)b.click();}
   if(paused)pause(true);
  }catch(error){console.error('[GAIA minigame start]',error);toast('훈련 시작 오류: '+error.message);}
  finally{requestAnimationFrame(()=>requestAnimationFrame(()=>{if(run===expected&&!done)frame.style.visibility='visible';}));}
 }
 function dispose(){clearInterval(startTimer);startTimer=null;frame.onload=null;frame.style.visibility='visible';run=null;done=true;}
 async function launch(d){dispose();const expected=run={...d};done=false;paused=false;
  if(d.game==='fetch'||d.game==='batting')frame.style.visibility='hidden';
  let doc=expand(MINI_DOCS[d.game+'-'+d.stage]);const previous=await savedMedia(d.game);if(run!==expected)return;
  const images={...(previous.images||{})};for(const [oldKey,newKey]of Object.entries(MINI_IMAGE_ALIASES))if(images[oldKey]&&!images[newKey])images[newKey]=images[oldKey];
  const media={...previous,images,layout:{...(previous.layout||{}),portrait:{...(previous.layout?.portrait||{}),background:{src:MINI_BACKGROUNDS.portrait}},landscape:{...(previous.layout?.landscape||{}),background:{src:MINI_BACKGROUNDS.landscape}}}};
  doc=doc.replace('window.CASUAL_MEDIA_RECORD={};','window.CASUAL_MEDIA_RECORD='+JSON.stringify(media).replaceAll('<','\\u003c')+';');
  const transparent=d.game==='fetch'||d.game==='cylinder'?'<script>window.MEDIA_BACKGROUND=true;<\/script>':'';
  // The cylinder's image editor already exists in the original minigame, but
  // a shared embedded stylesheet hid both its toolbar and its image button.
  const cylinderEditor=d.game==='cylinder'?`<style id="gaia-cylinder-editor-restore">
   html body .toolbar{display:contents!important}
   html body .toolbar #art{display:block!important;position:fixed!important;left:auto!important;right:8px!important;top:auto!important;bottom:8px!important;z-index:999!important;height:32px!important;min-height:32px!important;padding:3px 10px!important;border:1px solid #fff9!important;border-radius:13px!important;background:#b56e94e6!important;color:white!important;font-size:12px!important}
   html body #settings{z-index:1001!important}
  </style>`:'';
  const head=transparent+MINI_BACKGROUND_HEAD+cylinderEditor;
  if(doc.includes('</head>'))doc=doc.replace('</head>',head+'</head>');else doc=doc.replace('<html lang="ko">','<html lang="ko"><head>'+head+'</head>');
  doc=doc.replaceAll('wellness-life-sound','gaia-casual-sound').replace('<head>','<head><script>try{localStorage.setItem("gaia-casual-sound",'+JSON.stringify(d.muted?'off':'on')+')}catch{}<\/script>');
  // Avoid flashing the old difficulty/outfit selectors before auto-start.
  const hideSetup=d.game==='fetch'||d.game==='batting';
  frame.style.visibility=hideSetup?'hidden':'visible';
  frame.onload=begin;frame.srcdoc=doc;
  if(hideSetup)setTimeout(()=>{if(run===expected&&!done)frame.style.visibility='visible';},1600);
  startTimer=setInterval(()=>{if(run!==expected||done||paused||d.game==='squat')return;try{const w=frame.contentWindow;if(w.GAME_SCENE?.roomId!=='casual-'+d.game)return;const b=[...w.document.querySelectorAll('button')].find(b=>/^시작!?$/.test(b.textContent.trim())&&b.offsetParent!==null&&!b.disabled);b?.click();}catch{}},350);
 }
 addEventListener('message',e=>{const d=e.data;if(e.source!==frame.contentWindow||!run||done||paused||activeGame?.token!==run.token||!d||typeof d!=='object')return;
  if(d.type==='wellness-result'&&d.roomId==='casual-'+run.game){done=true;clearInterval(startTimer);const ratio=Math.max(0,Math.min(1,Number(d.ratio)||0));pause(true);handleGame({type:'gaia-result',token:run.token,game:run.game,stage:run.stage,ratio,success:d.success??ratio>=.4,score:String(d.score??'').slice(0,40)});}
  else if(d.type==='wellness-close'){done=true;clearInterval(startTimer);pause(true);handleGame({type:'gaia-result',token:run.token,game:run.game,stage:run.stage,ratio:0,success:false,score:'중도 종료'});}
 });
 return{launch,pause,dispose,get status(){return run?{...run,done,paused}:null}};
})();
const beforeDirectOpen=openGame,beforeDirectClose=closeGame,beforeDirectPause=pauseGame,beforeDirectResume=resumeGame;
openGame=function(type,npc,arcade=false,training=null){
 if(type!=='train')return beforeDirectOpen(type,npc,arcade,training);
 const planned=currentNodeTraining(),chosen=training||planned;
 if(!state.pending||state.pending.kind!=='train'||!planned||chosen?.id!==planned.id||chosen.stage!==planned.stage||!MINI_DOCS[planned.id+'-'+planned.stage]){toast('현재 노드의 훈련만 시작할 수 있습니다.');return;}
 closeModal();const token=state.pending.id+'-'+crypto.getRandomValues(new Uint32Array(1))[0];activeGame={type:'train',token,pendingId:state.pending.id,training:{...planned}};state.pending.stage='playing';save();
 $('#game').dataset.v12Match='false';$('#game').dataset.v11Match='false';v12Curtain(false);$('#game').hidden=false;
 DirectMinigames.launch({token,game:planned.id,stage:planned.stage,muted:!!settings.muted}).catch(error=>{if(activeGame?.token!==token)return;console.error('[GAIA minigame load]',error);closeGame();toast('훈련 불러오기 오류: '+error.message);});
};
closeGame=function(){DirectMinigames.dispose();return beforeDirectClose();};
pauseGame=function(){if(activeGame?.type==='train')DirectMinigames.pause(true);return beforeDirectPause();};
resumeGame=function(){const training=activeGame?.type==='train';const result=beforeDirectResume();if(training)DirectMinigames.pause(false);return result;};
$('#gameBack').onclick=()=>pauseGame();
