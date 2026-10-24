const fs=require('fs'),http=require('http'),path=require('path'),assert=require('assert/strict'),vm=require('vm'),{chromium}=require('playwright');
(async()=>{
 const root=process.cwd(),dir=root+'/tap-image-fix/release',html=fs.readFileSync(dir+'/GAIA-Pingpong-v12.11.html','utf8');
 const hook="window.__tapQA=stage=>{document.querySelector('#game').hidden=false;return DirectMinigames.launch({game:'tap',stage,token:'qa',muted:true})};";
 const fixture=html.replace('save();render();',hook+'save();render();');
 const server=http.createServer((q,r)=>{const url=decodeURIComponent(q.url.split('?')[0]);if(url==='/qa.html'){r.setHeader('Content-Type','text/html;charset=utf-8');return r.end(fixture)}let file;for(const d of [dir,root+'/v12.11-download/release']){file=d+url;if(fs.existsSync(file))break}if(!fs.existsSync(file)){r.writeHead(404);return r.end()}r.setHeader('Content-Type',file.endsWith('.svg')?'image/svg+xml':file.endsWith('.jpg')?'image/jpeg':file.endsWith('.png')?'image/png':'application/octet-stream');fs.createReadStream(file).pipe(r)});
 await new Promise(r=>server.listen(8821,'127.0.0.1',r));
 const browser=await chromium.launch({executablePath:root+'/browser/chromium-runtime/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--autoplay-policy=no-user-gesture-required'],env:{...process.env,LD_LIBRARY_PATH:root+'/browser/chromium-runtime'}});
 const results=[];fs.mkdirSync(root+'/tap-image-fix/qa',{recursive:true});
 try{
  const page=await browser.newPage({viewport:{width:480,height:820},hasTouch:true});const errors=[];page.on('pageerror',e=>{errors.push(e.message);console.log('ERROR',e.message)});page.on('console',m=>{if(m.type()==='error')console.log('CONSOLE',m.text())});
  await page.goto('http://127.0.0.1:8821/qa.html');
  for(const [width,height,stage]of [[480,820,1],[960,540,10]]){
   await page.setViewportSize({width,height});await page.evaluate(stage=>__tapQA(stage),stage);
   await page.waitForFunction(()=>document.querySelector('#gameFrame').contentWindow.document.querySelectorAll('.mg-tap-target').length===3,null,{timeout:20000});
   const f=page.frames()[1];await f.waitForFunction(()=>[...document.querySelectorAll('.mg-tap-person>.mg-actor-sprite')].every(im=>im.complete&&im.naturalWidth));
   await page.waitForTimeout(150);
   const positions=await f.evaluate(()=>[...document.querySelectorAll('.mg-tap-person')].map(a=>{const im=a.querySelector('.mg-actor-sprite'),t=a.querySelector('.mg-tap-target'),r=t.getBoundingClientRect(),ar=a.getBoundingClientRect(),rh=ar.height-20,dh=Math.min(rh,ar.width/(im.naturalWidth/im.naturalHeight)),dw=dh*im.naturalWidth/im.naturalHeight;return{src:im.getAttribute('src'),image:[im.naturalWidth,im.naturalHeight],hit:{x:r.x+r.width/2,y:r.y+r.height/2,w:r.width,h:r.height},expected:{x:ar.x+(ar.width-dw)/2+dw*Number(t.dataset.pointX),y:ar.bottom-dh+dh*Number(t.dataset.pointY)}}}));
   for(let i=0;i<3;i++){const p=positions[i];assert(p.src.endsWith('miju-tap-'+(i+1)+'.png'));assert(Math.abs(p.hit.x-p.expected.x)<1&&Math.abs(p.hit.y-p.expected.y)<1);assert(p.hit.w>=44&&p.hit.h>=44);await f.locator('.mg-tap-target').nth(i).tap();}
   assert((await f.locator('.mg-stats').innerText()).includes('3회'));
   const before=await f.locator('.mg-stats').innerText();await f.locator('.mg-tap-person').first().click({position:{x:5,y:5}});assert((await f.locator('.mg-stats').innerText()).includes('3회'));
   await page.waitForTimeout(750);
   await page.screenshot({path:root+'/tap-image-fix/qa/'+width+'x'+height+'.png'});
   results.push({width,height,stage,positions,threeClicks:true,outsideIgnored:true});
  }
  assert.deepEqual(errors,[]);fs.mkdirSync(root+'/tap-image-fix/qa',{recursive:true});fs.writeFileSync(root+'/tap-image-fix/qa/results.json',JSON.stringify(results,null,2));console.log('PASS',JSON.stringify(results));
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);process.exit(1)});
