const fs=require('fs'),http=require('http'),path=require('path'),assert=require('assert/strict'),vm=require('vm'),{chromium}=require('playwright');
(async()=>{
 const root=process.cwd(),dir=root+'/mini-audio-editor-fix/release',html=fs.readFileSync(dir+'/GAIA-Pingpong-v12.11.html','utf8');
 const hook="window.__miniQA=(game,stage=1)=>{document.querySelector('#game').hidden=false;return DirectMinigames.launch({game,stage,token:'qa',muted:false})};";
 const fixture=html.replace('save();render();',hook+'save();render();');
 const server=http.createServer((q,r)=>{const url=decodeURIComponent(q.url.split('?')[0]);if(url==='/qa.html'){r.setHeader('Content-Type','text/html;charset=utf-8');return r.end(fixture)}let file;for(const d of [dir,root+'/v12.11-download/release']){file=d+url;if(fs.existsSync(file))break}if(!fs.existsSync(file)){r.writeHead(404);return r.end()}r.setHeader('Content-Type',file.endsWith('.svg')?'image/svg+xml':file.endsWith('.jpg')?'image/jpeg':'application/octet-stream');fs.createReadStream(file).pipe(r)});
 await new Promise(r=>server.listen(8821,'127.0.0.1',r));
 const browser=await chromium.launch({executablePath:root+'/browser/chromium-runtime/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--autoplay-policy=no-user-gesture-required'],env:{...process.env,LD_LIBRARY_PATH:root+'/browser/chromium-runtime'}});
 const results=[];
 try{
  const page=await browser.newPage({viewport:{width:480,height:820},hasTouch:true});const errors=[];page.on('pageerror',e=>{errors.push(e.message);console.log('ERROR',e.message)});page.on('console',m=>{if(m.type()==='error')console.log('CONSOLE',m.text())});
  await page.goto('http://127.0.0.1:8821/qa.html');
  for(const stage of [1,4,8]){
   await page.evaluate(stage=>__miniQA('squat',stage),stage);
   await page.waitForFunction(()=>document.querySelector('#gameFrame').contentWindow.SquatGame);await page.frames()[1].locator('#go').click();
   await page.waitForFunction(()=>document.querySelector('#gameFrame').contentWindow.SquatGame?.audio.music,null,{timeout:20000}).catch(async e=>{console.log(await page.frames()[1].evaluate(()=>({text:document.body.innerText.slice(-400),audio:window.SquatGame?.audio})));throw e});
   const f=page.frames()[1],a=await f.evaluate(()=>({audio:SquatGame.audio,rule:SquatGame.rule,musicGain:eval('loopStatus.music.node').numberOfOutputs,contextTime:eval('ac.currentTime')}));
   assert(a.audio.music.endsWith('_bgm'));assert(a.audio.bed.endsWith('_bed'));assert.equal(a.audio.state,'running');
   const graph=await f.evaluate(()=>({music:eval('loopStatus.music.node.buffer.duration'),bed:eval('loopStatus.bed.node.buffer.duration'),t0:eval('t0')}));
   results.push({game:'squat',stage,audio:a.audio,bpm:a.rule.bpm,graph});console.log('squat',stage,a.audio.music,a.audio.bed);
  }
  await page.evaluate(()=>__miniQA('cylinder'));await page.waitForFunction(()=>document.querySelector('#gameFrame').contentWindow.LifeMini?.started);
  let f=page.frames()[1];await f.locator('#art').click();await f.locator('#settings').waitFor({state:'visible'});
  assert(await f.evaluate(()=>LifeMini.paused));const box=await f.locator('#settings').boundingBox();assert(box.width>100&&box.height>100);
  const svg=Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="80" height="120"><rect width="80" height="120" fill="lime"/></svg>');
  await f.locator('#slot').selectOption('main');await f.locator('#upload').setInputFiles({name:'test.svg',mimeType:'image/svg+xml',buffer:svg});
  await f.waitForFunction(()=>document.querySelector('#notice').textContent.includes('저장했습니다'));
  const src=await f.evaluate(()=>LifeMini.images.main.src);assert(src.startsWith('data:image/png'));
  await page.setViewportSize({width:900,height:480});await page.waitForTimeout(200);assert.equal(await f.evaluate(()=>LifeMini.images.main.src),src);
  await f.locator('#settingsClose').click();assert.equal(await f.evaluate(()=>LifeMini.paused),false);
  await page.evaluate(()=>__miniQA('cylinder'));await page.waitForFunction(()=>document.querySelector('#gameFrame').contentWindow.LifeMini?.started);
  f=page.frames()[1];assert.equal(await f.evaluate(()=>LifeMini.images.main.src),src);
  await f.locator('#art').click();await f.locator('#slot').selectOption('bg');await f.locator('#upload').setInputFiles({name:'test.svg',mimeType:'image/svg+xml',buffer:svg});await f.waitForFunction(()=>!!LifeMini.images.bg);
  await f.locator('#slot').selectOption('main');assert.equal(await f.evaluate(()=>MEDIA_BACKGROUND),false);
  await f.locator('#restore').click();await f.waitForFunction(()=>!CylinderCustomArt.has('main'));assert(!(await f.evaluate(()=>LifeMini.images.main.src)).startsWith('data:image/png'));
  await f.locator('#slot').selectOption('bg');await f.locator('#restore').click();await f.waitForFunction(()=>!LifeMini.images.bg&&MEDIA_BACKGROUND);
  await page.setViewportSize({width:480,height:820});await f.locator('#settingsClose').click();assert.equal(await f.evaluate(()=>LifeMini.paused),false);
  await f.evaluate(()=>LifeMini.pause(true));await f.locator('#art').click();await f.locator('#settingsClose').click();assert.equal(await f.evaluate(()=>LifeMini.paused),true);
  results.push({game:'cylinder',editorVisible:true,upload:true,rotation:true,reentry:true,restore:true,background:true,priorPausePreserved:true});
  assert.deepEqual(errors,[]);fs.mkdirSync(root+'/mini-audio-editor-fix/qa',{recursive:true});fs.writeFileSync(root+'/mini-audio-editor-fix/qa/results.json',JSON.stringify(results,null,2));console.log('PASS',JSON.stringify(results));
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);process.exit(1)});
