const assert=require('node:assert/strict'),path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROME,headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 const page=await browser.newPage({viewport:{width:1280,height:720},hasTouch:true});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const url=pathToFileURL(path.resolve(__dirname,'../index.html')).href;
 await page.goto(url);await page.locator('#loading').waitFor({state:'detached'});
 const result=await page.evaluate(()=>{const C=WellnessCenter;let rooms=0,moved=false,gesture=false,pose=false,hopped=false;const sources=new Set();
 for(let f=0;f<6;f++){C.changeFloor(f);for(let r=-1;r<C.model.FLOORS[f].rooms.length;r++){
  if(r>=0){C.enterRoom(r);rooms++;}const scene={...C.state.scene},people=C.life.get(scene);const start=people.map(n=>[n.x,n.y]);
  for(const n of people){sources.add(n.actor.source);if(n.staff&&r>=0)assertStaff(n);}
  for(let i=0;i<800;i++){C.life.update(scene,.05);for(let j=0;j<people.length;j++){const n=people[j],b=C.model.bounds(scene);if(n.x<b.left||n.x>b.right||n.y<b.top||n.y>b.bottom)throw new Error('NPC outside scene '+n.id);if(!C.images[C.life.frame(n)])throw new Error('Missing NPC frame');moved ||=Math.hypot(n.x-start[j][0],n.y-start[j][1])>15;gesture ||=n.mode==='greet'||n.mode==='turn';pose ||=n.mode==='pose';hopped ||=n.mode==='hop';}}
 }}C.changeFloor(0);C.render();return {rooms,moved,gesture,pose,hopped,sources:[...sources],frames:Object.keys(C.images).filter(k=>k.startsWith('npc/')).length};
 function assertStaff(n){if(n.x!==820)throw new Error('Staff interaction mismatch');}
 });
 assert.equal(result.rooms,26);assert.equal(result.frames,148);assert.equal(result.sources.length,14);for(const k of ['moved','gesture','pose','hopped'])assert(result[k],k);console.log('All 32 scenes: bounds, 14 source sheets, 148 frames, gestures, travel and poses PASS');
 await page.waitForTimeout(300);await page.screenshot({path:'/tmp/center-life-corridor.png'});
 // Real gallery hit target, file chooser, durable reload, reset and per-floor isolation.
 await page.locator('#stage').tap({position:{x:855,y:282}});await page.getByRole('heading',{name:'복도 액자',exact:true}).waitFor();
 await page.getByRole('button',{name:'사진 변경',exact:true}).click();
 const fixture=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=36;c.height=24;const x=c.getContext('2d');x.fillStyle='#bb4455';x.fillRect(0,0,36,24);return c.toDataURL('image/png').split(',')[1];});
 await page.locator('#photoFile').setInputFiles({name:'gallery-test.png',mimeType:'image/png',buffer:Buffer.from(fixture,'base64')});
 await page.waitForFunction(()=>WellnessCenter.gallery.photos.has('f1-art-1'));
 assert.equal(await page.evaluate(()=>WellnessCenter.gallery.photos.size),1);
 await page.reload();await page.locator('#loading').waitFor({state:'detached'});assert(await page.evaluate(()=>WellnessCenter.gallery.photos.has('f1-art-1')));
 await page.getByRole('button',{name:'액자 사진 변경'}).click();await page.getByRole('button',{name:'1번 액자',exact:true}).click();await page.getByRole('button',{name:'기본 그림으로',exact:true}).click();await page.waitForFunction(()=>!WellnessCenter.gallery.photos.has('f1-art-1'));
 await page.reload();await page.locator('#loading').waitFor({state:'detached'});assert.equal(await page.evaluate(()=>WellnessCenter.gallery.photos.size),0);
 console.log('Canvas frame hit; image upload; reload persistence; reset persistence PASS');
 await page.evaluate(()=>{WellnessCenter.changeFloor(3);WellnessCenter.enterRoom(1);});await page.waitForTimeout(400);await page.screenshot({path:'/tmp/center-life-room.png'});
 await page.setViewportSize({width:800,height:1280});await page.waitForTimeout(150);await page.screenshot({path:'/tmp/center-life-portrait.png'});
 await page.evaluate(()=>{WellnessCenter.leaveRoom();WellnessCenter.changeFloor(2);WellnessCenter.state.player.x=855;WellnessCenter.state.camera=650;WellnessCenter.render();});
 // Clicking the toolbar works in portrait and from any room/camera position.
 await page.getByRole('button',{name:'액자 사진 변경'}).click();await page.getByRole('button',{name:'1번 액자',exact:true}).click();await page.getByRole('heading',{name:'복도 액자',exact:true}).waitFor();await page.getByRole('button',{name:'닫기',exact:true}).click();
 assert.deepEqual(errors,[]);await browser.close();console.log('Landscape/portrait, gallery toolbar, no browser errors PASS');
})().catch(e=>{console.error(e);process.exitCode=1;});
