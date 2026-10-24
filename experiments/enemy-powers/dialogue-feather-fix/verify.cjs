const fs=require('fs'),http=require('http'),path=require('path'),assert=require('assert/strict'),vm=require('vm'),{chromium}=require('playwright');
(async()=>{
 const root=process.cwd(),dir=root+'/dialogue-feather-fix/release',html=fs.readFileSync(dir+'/GAIA-Pingpong-v12.11.html','utf8');
 const hook="window.__dialogQA=()=>{document.querySelector('#game').hidden=true;ensureStory(state).run={items:[{id:'qa',flag:'qa',lines:[{speaker:'미주',text:'초상화의 하단 배치와 대화창 가독성을 확인합니다.'}]}],scene:0,line:0,after:'pending'};renderStory();};window.__storyAudit=()=>({scenes:Object.fromEntries(Object.entries(STORY_SCENES).map(([id,lines])=>[id,lines.length])),prologue:ensureStory(state).prologue,seen:Object.keys(ensureStory(state).flags)});";
 const fixture=html.replace('save();render();',hook+'save();render();');
 const server=http.createServer((q,r)=>{const url=decodeURIComponent(q.url.split('?')[0]);if(url==='/qa.html'){r.setHeader('Content-Type','text/html;charset=utf-8');return r.end(fixture)}let file;for(const d of [dir,root+'/v12.11-download/release']){file=d+url;if(fs.existsSync(file))break}if(!fs.existsSync(file)){r.writeHead(404);return r.end()}r.setHeader('Content-Type',file.endsWith('.svg')?'image/svg+xml':file.endsWith('.jpg')?'image/jpeg':'application/octet-stream');fs.createReadStream(file).pipe(r)});
 await new Promise(r=>server.listen(8821,'127.0.0.1',r));
 const browser=await chromium.launch({executablePath:root+'/browser/chromium-runtime/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--autoplay-policy=no-user-gesture-required'],env:{...process.env,LD_LIBRARY_PATH:root+'/browser/chromium-runtime'}});
 const results=[];fs.mkdirSync(root+'/dialogue-feather-fix/qa',{recursive:true});
 try{
  const page=await browser.newPage({viewport:{width:480,height:820},hasTouch:true});const errors=[];page.on('pageerror',e=>{errors.push(e.message);console.log('ERROR',e.message)});page.on('console',m=>{if(m.type()==='error')console.log('CONSOLE',m.text())});
  await page.goto('http://127.0.0.1:8821/qa.html');
  await page.evaluate(()=>__dialogQA());
  for(const [width,height]of [[480,820],[960,540],[1440,900]]){
   await page.setViewportSize({width,height});await page.waitForTimeout(150);await page.locator('.dialogue-person').first().evaluate(im=>im.decode());
   const geometry=await page.evaluate(()=>{const scene=document.querySelector('.dialogue'),person=scene.querySelector('.dialogue-person'),people=scene.querySelector('.dialogue-people'),panel=scene.querySelector('.speech'),r=people.getBoundingClientRect(),p=panel.getBoundingClientRect();return{mask:getComputedStyle(person).maskImage,bottom:r.bottom,panelTop:p.top,panelBottom:p.bottom,height:innerHeight,width:innerWidth,peopleZ:getComputedStyle(people).zIndex,panelZ:getComputedStyle(panel).zIndex}});
   assert(geometry.mask.includes('linear-gradient'));assert(geometry.bottom>geometry.panelTop);assert(geometry.panelBottom<=height+1);assert(+geometry.panelZ>+geometry.peopleZ);results.push(geometry);
   await page.screenshot({path:root+'/dialogue-feather-fix/qa/'+width+'x'+height+'.png'});
  }
  results.push({storyAudit:await page.evaluate(()=>__storyAudit())});
  assert.deepEqual(errors,[]);fs.mkdirSync(root+'/dialogue-feather-fix/qa',{recursive:true});fs.writeFileSync(root+'/dialogue-feather-fix/qa/results.json',JSON.stringify(results,null,2));console.log('PASS',JSON.stringify(results));
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);process.exit(1)});
