const fs=require('fs'),http=require('http'),path=require('path'),assert=require('assert/strict'),vm=require('vm'),{chromium}=require('playwright');
(async()=>{
 const root=process.cwd(),dir=root+'/cylinder-video-fix/release',html=fs.readFileSync(dir+'/GAIA-Pingpong-v12.11.html','utf8');
 const hook="window.__miniQA=(game,stage=1)=>{document.querySelector('#game').hidden=false;return DirectMinigames.launch({game,stage,token:'qa',muted:false})};";
 const fixture=html.replace('save();render();',hook+'save();render();');
 const server=http.createServer((q,r)=>{const url=decodeURIComponent(q.url.split('?')[0]);if(url==='/qa.html'){r.setHeader('Content-Type','text/html;charset=utf-8');return r.end(fixture)}let file;for(const d of [dir,root+'/v12.11-download/release']){file=d+url;if(fs.existsSync(file))break}if(!fs.existsSync(file)){r.writeHead(404);return r.end()}r.setHeader('Content-Type',file.endsWith('.svg')?'image/svg+xml':file.endsWith('.jpg')?'image/jpeg':'application/octet-stream');fs.createReadStream(file).pipe(r)});
 await new Promise(r=>server.listen(8821,'127.0.0.1',r));
 const browser=await chromium.launch({executablePath:root+'/browser/chromium-runtime/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--autoplay-policy=no-user-gesture-required'],env:{...process.env,LD_LIBRARY_PATH:root+'/browser/chromium-runtime'}});
 const results=[];
 try{
  const page=await browser.newPage({viewport:{width:480,height:820},hasTouch:true});const errors=[];page.on('pageerror',e=>{errors.push(e.message);console.log('ERROR',e.message)});page.on('console',m=>{if(m.type()==='error')console.log('CONSOLE',m.text())});
  await page.goto('http://127.0.0.1:8821/qa.html');
  for(const stage of [1,5,10]){
   await page.evaluate(stage=>__miniQA('cylinder',stage),stage);await page.waitForFunction(()=>document.querySelector('#gameFrame').contentWindow.LifeMini?.started);
   const f=page.frames()[1],model=await f.evaluate(()=>({duration:LifeMini.model.duration,goal:LifeMini.model.goal,original:GAME_SCENE.cylinder.goal}));assert.equal(model.duration,10);assert.equal(model.goal,Math.round(model.original*.3));results.push({stage,...model});
  }
  let f=page.frames()[1];await f.locator('#art').click();await f.locator('#settings').waitFor({state:'visible'});
  const mp4=fs.readFileSync(root+'/cylinder-video-fix/test.mp4');
  await f.evaluate(bytes=>window.__mp4=bytes,[...mp4]);await f.locator('#upload').evaluate(el=>{const dt=new DataTransfer();for(const name of ['b.mp4','a.mp4','ignore.txt']){const f=new File([new Uint8Array(window.__mp4)],name,{type:name.endsWith('.mp4')?'video/mp4':'text/plain'});Object.defineProperty(f,'webkitRelativePath',{value:'videos/'+name});dt.items.add(f)}el.files=dt.files;el.dispatchEvent(new Event('change',{bubbles:true}))});
  await f.waitForFunction(()=>CylinderVideo.ready);assert.deepEqual(await f.evaluate(()=>CylinderVideo.files),['videos/a.mp4','videos/b.mp4']);assert(await f.locator('#upload').getAttribute('webkitdirectory')!==null);
  const select=f.locator('select[aria-label="재생할 MP4 영상"]');await select.selectOption('1');await f.waitForFunction(()=>CylinderVideo.selected===1&&CylinderVideo.ready);await f.locator('#settingsClose').click();await f.waitForFunction(()=>CylinderVideo.video.currentTime>0);assert.equal(await f.evaluate(()=>CylinderVideo.video.paused),false);
  await page.setViewportSize({width:900,height:480});await page.waitForTimeout(150);assert.equal(await f.evaluate(()=>LifeMini.images.main.tagName),'VIDEO');
  await f.locator('#art').click();assert.equal(await f.evaluate(()=>CylinderVideo.video.paused),true);await f.locator('#settingsClose').click();await f.waitForFunction(()=>!CylinderVideo.video.paused);
  await page.evaluate(()=>__miniQA('cylinder'));await page.waitForFunction(()=>document.querySelector('#gameFrame').contentWindow.LifeMini?.started&&document.querySelector('#gameFrame').contentWindow.CylinderVideo?.ready);
  f=page.frames()[1];assert.equal(await f.evaluate(()=>CylinderVideo.selected),1);await f.locator('#art').click();await f.locator('#restore').click();await f.waitForFunction(()=>!CylinderVideo.video);assert.equal(await f.evaluate(()=>LifeMini.images.main.tagName),'IMG');await f.locator('#settingsClose').click();
  await page.evaluate(()=>{window.__results=[];addEventListener('message',e=>{if(e.data?.type==='wellness-result')__results.push(e.data)})});
  await page.evaluate(()=>__miniQA('cylinder'));await page.waitForFunction(()=>document.querySelector('#gameFrame').contentWindow.LifeMini?.started);f=page.frames()[1];assert.equal(await f.evaluate(()=>CylinderVideo.files.length),0);
  await f.evaluate(()=>LifeMini.model.score=LifeMini.model.goal);await page.waitForFunction(()=>window.__results.length>0,null,{timeout:14000});const result=await page.evaluate(()=>__results[0]);assert.equal(result.success,true);results.push({folderUpload:true,mp4Decoded:true,playing:true,selectionPersisted:true,rotation:true,pauseResume:true,restorePersisted:true,tenSecondResult:result});
  assert.deepEqual(errors,[]);fs.mkdirSync(root+'/cylinder-video-fix/qa',{recursive:true});fs.writeFileSync(root+'/cylinder-video-fix/qa/results.json',JSON.stringify(results,null,2));console.log('PASS',JSON.stringify(results));
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);process.exit(1)});
