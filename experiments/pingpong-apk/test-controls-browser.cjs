const fs=require('fs'),http=require('http'),assert=require('assert/strict'),{chromium}=require('playwright');
(async()=>{
 const root=process.cwd(),dir=root+'/apk-work/android/app/src/main/assets/game',results=[],errors=[];
 let html=fs.readFileSync(dir+'/index.html','utf8');const at=html.lastIndexOf('save();render();');
 const hook=`window.__controlsQA={get settings(){return settings},open:()=>openGame('match',NPC_BY_ID['r0-0'],true),show:()=>settingsModal(),title:()=>goto('title'),mini:(game='squat')=>{closeGame();document.querySelector('#game').hidden=false;activeGame={type:'train',token:'qa-squat',training:{id:game,stage:1}};return DirectMinigames.launch({game,stage:1,token:'qa-squat',muted:false})}};`;
 html=html.slice(0,at)+hook+html.slice(at);
 const server=http.createServer((q,r)=>{const u=decodeURIComponent(q.url.split('?')[0]);if(u==='/'){r.setHeader('Content-Type','text/html;charset=utf-8');return r.end(html)}const f=dir+u;if(!fs.existsSync(f)||!fs.statSync(f).isFile()){r.writeHead(404);return r.end()}const ext=f.split('.').pop();r.setHeader('Content-Type',({png:'image/png',webp:'image/webp',woff2:'font/woff2',jpg:'image/jpeg',svg:'image/svg+xml'})[ext]||'application/octet-stream');fs.createReadStream(f).pipe(r)});
 await new Promise(ok=>server.listen(8830,'127.0.0.1',ok));
 const exe=root+'/apk-work/browser/chrome-headless-shell-linux64/chrome-headless-shell';fs.chmodSync(exe,0o755);
 const browser=await chromium.launch({executablePath:exe,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader','--autoplay-policy=no-user-gesture-required']});
 try{
  const page=await browser.newPage({viewport:{width:480,height:820},hasTouch:true});
  await page.addInitScript(()=>{window.__nativeCalls=[];window.GaiaBridge={load:()=> '{}',reconcileLocal:t=>t,put(){},del(){},webReady(){queueMicrotask(()=>window.onGaiaSyncDone?.())},vibrate:p=>window.__nativeCalls.push(p),backupStatus:()=> '{}',pickBackup(){},syncBackup(){},cancelRestore(){}};if(parent!==window)Math.random=()=>parent.__qaRandom??.6;});
  page.on('pageerror',e=>{errors.push(e.message);console.log('ERROR',e.message)});
  await page.goto('http://127.0.0.1:8830/');await page.waitForFunction(()=>window.__controlsQA&&!window.GAIA_NATIVE_GATE);
  assert.equal(await page.locator('#gaia-global-settings').count(),1);
  await page.locator('#gaia-global-settings').tap();assert.equal(await page.locator('[data-volume]').count(),2);
  async function volume(key,value){await page.locator('[data-volume="'+key+'"]').evaluate((el,value)=>{el.value=value;el.dispatchEvent(new Event('input',{bubbles:true}))},value)}
  await volume('musicVolume',30);await volume('effectsVolume',0);
  assert.deepEqual(await page.evaluate(()=>GaiaAudioMix.values),{music:.3,effects:0,muted:false});
  const routes=await page.evaluate(async()=>{const ctx=new AudioContext(),music=ctx.createBuffer(1,48000,48000),fx=ctx.createBuffer(1,48000,48000);GaiaAudioMix.tagBuffer(music,'squat90_bgm');for(const b of[music,fx]){const s=ctx.createBufferSource();s.buffer=b;s.loop=true;s.connect(ctx.destination);s.start()}await ctx.resume();window.__mixCtx=ctx;return GaiaAudioMix.status()});
  assert(routes.sources.some(x=>x.kind==='music'&&Math.abs(x.gain-.3)<.001));assert(routes.sources.some(x=>x.kind==='effects'&&x.gain===0));
  await volume('musicVolume',0);await volume('effectsVolume',70);const changed=await page.evaluate(()=>GaiaAudioMix.status());assert(changed.sources.some(x=>x.kind==='music'&&x.gain===0));assert(changed.sources.some(x=>x.kind==='effects'&&Math.abs(x.gain-.7)<.001));
  await page.locator('[data-action="close"]').tap();await page.evaluate(()=>__controlsQA.open());
  await page.waitForFunction(()=>document.querySelector('#gameFrame').contentWindow.v12ReadyTime,null,{timeout:30000});let f=page.frames()[1];
  for(const [width,height]of [[480,820],[960,540]]){await page.setViewportSize({width,height});await page.waitForTimeout(150);const setting=await page.locator('#gaia-global-settings').boundingBox(),camera=await f.locator('#rally-camera-btn').boundingBox();assert(camera.y>=setting.y+setting.height+5);results.push({width,height,setting,camera});}
  await page.locator('#gaia-global-settings').tap();await volume('musicVolume',50);await volume('effectsVolume',0);await page.locator('[data-action="sound"]').tap();await page.locator('[data-action="close"]').tap();
  await f.evaluate(()=>{gameState='play';rallyPhase='rally';playerSideBounces=1;lastHitter='opponent';smashAiming=false;enemyState.presenting=false;enemyState.shield=0;playerHit()});
  assert((await page.evaluate(()=>__nativeCalls)).includes('35'),'normal return must vibrate even while muted');
  const camera=await f.evaluate(()=>{menuOpen=false;gameState='play';smashAiming=false;specialShotInFlight=true;rallyCameraEnabled=true;Object.assign(ballPos,{x:0,y:3,z:-1});Object.assign(ballVel,{x:0,y:0,z:-2});cameraCurrentPos.copy(baseCameraPos);cameraCurrentTarget.set(0,TABLE_H,0);cameraShakeTime=0;return{base:baseCameraPos.z,chase:ballPos.z+2.5}});
  await page.waitForTimeout(130);const current=await f.evaluate(()=>({z:camera.position.z,special:specialShotInFlight}));assert(Math.abs(current.z-camera.base)<.2,'skill must not chase toward the opponent court');
  // Test actual squat music/voice decoding through the shared mixer.
  await page.evaluate(()=>{__controlsQA.settings.muted=false;GaiaAudioMix.configure({muted:false,music:.5,effects:0});return __controlsQA.mini()});await page.waitForFunction(()=>document.querySelector('#gameFrame').contentWindow.SquatGame,null,{timeout:20000});f=page.frames()[1];await f.locator('#go').tap();await f.waitForFunction(()=>SquatGame.audio.music,null,{timeout:20000});const squat=await f.evaluate(()=>({audio:SquatGame.audio,mix:GaiaAudioMix.status()}));assert(squat.mix.sources.some(x=>x.kind==='music'&&x.gain===.5));assert(squat.mix.sources.some(x=>x.kind==='effects'&&x.gain===0));
  await page.locator('#gaia-global-settings').tap();assert.equal(await page.locator('[data-volume]').count(),2);await volume('musicVolume',25);await volume('effectsVolume',40);const live=await f.evaluate(()=>GaiaAudioMix.status());assert(live.sources.some(x=>x.kind==='music'&&x.gain===.25));assert(live.sources.some(x=>x.kind==='effects'&&Math.abs(x.gain-.4)<.001));
  await page.screenshot({path:root+'/apk-work/controls-settings.png'});await page.reload();await page.waitForFunction(()=>window.__controlsQA&&!window.GAIA_NATIVE_GATE);assert.equal(await page.evaluate(()=>__controlsQA.settings.musicVolume),.25);assert.equal(await page.evaluate(()=>__controlsQA.settings.effectsVolume),.4);
  const bytes=[...fs.readFileSync(root+'/apk-work/qa-video.mp4')];
  await page.evaluate(async bytes=>{const db=await new Promise(ok=>{const r=indexedDB.open('wellness-life-art-v1',1);r.onupgradeneeded=()=>r.result.createObjectStore('art');r.onsuccess=()=>ok(r.result)});await new Promise(ok=>{const tx=db.transaction('art','readwrite');tx.objectStore('art').put({files:['one.mp4','two.mp4','three.mp4'].map(name=>({name,blob:new Blob([new Uint8Array(bytes)],{type:'video/mp4'})})),selected:2},'cylinder/mp4-folder');tx.oncomplete=ok});db.close()},bytes);
  const choices=[];for(const random of [.6,.1]){await page.evaluate(random=>{window.__qaRandom=random;return __controlsQA.mini('cylinder')},random);await page.waitForFunction(()=>document.querySelector('#gameFrame').contentWindow.CylinderVideo?.ready,null,{timeout:20000});choices.push(await page.frames()[1].evaluate(()=>CylinderVideo.selected))}assert.deepEqual(choices,[1,0]);
  assert.deepEqual(errors,[]);const result={layouts:results,independentWebAudioMix:true,liveGainChange:true,normalHitHapticWithSoundMuted:true,skillCameraNoChase:true,camera,after:current,squat:{music:squat.audio.music,bed:squat.audio.bed,liveChannels:true},globalSettingsOnTitleMatchMinigame:true,settingsPersisted:true,cylinderRandomSelections:choices};fs.writeFileSync(root+'/apk-work/controls-browser.json',JSON.stringify(result,null,2));console.log('PASS',JSON.stringify(result));
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);process.exit(1)});
