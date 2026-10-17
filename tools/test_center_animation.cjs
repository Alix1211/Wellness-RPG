/* Run with playwright installed and CHROME pointing to a headless browser. */
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {pathToFileURL}=require('node:url');
const M=require('../src/center/model.js');
const base=path.resolve(__dirname,'..');
const aligned=JSON.parse(fs.readFileSync(path.join(base,'src/center/sprite-alignment.json'),'utf8'));
assert.equal(Object.keys(aligned.frames).length,72);
for(const [key,f] of Object.entries(aligned.frames)){
 assert.deepEqual(f.tile,[224,208],key);assert.deepEqual(f.pivot,[112,190],key);
 assert(Math.abs(f.headWidth*f.scale-74)<.01,key);
}
for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1],[1,-1]]){
 const s=M.makeState();s.player.x=1500;s.player.y=565;
 M.step(s,dx,dy,.08);const start={x:s.player.x,y:s.player.y};assert(M.startJump(s));assert.equal(M.startJump(s),false);
 let peak=0;for(let i=0;i<42;i++){M.step(s,0,0,1/60);peak=Math.max(peak,s.player.jump);}
 assert(peak>60);assert(Math.hypot(s.player.x-start.x,s.player.y-start.y)>80);assert.equal(s.player.jumpTime,0);assert.equal(s.player.jump,0);
}
const idle=M.makeState(),ix=idle.player.x,iy=idle.player.y;M.startJump(idle);for(let i=0;i<50;i++)M.step(idle,0,0,1/60);assert.equal(idle.player.x,ix);assert.equal(idle.player.y,iy);
console.log('72 aligned frames; five-direction airborne travel; idle jump; landing: PASS');
if(process.env.MODEL_ONLY)process.exit(0);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROME||undefined,headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 const page=await browser.newPage({viewport:{width:1280,height:720},hasTouch:true});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(pathToFileURL(path.join(base,'index.html')).href);await page.locator('#loading').waitFor({state:'detached'});
 const cdp=await page.context().newCDPSession(page);
 const send=(type,points)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:points.map(p=>({...p,radiusX:5,radiusY:5,force:1}))});
 const stick=await page.locator('#stick').boundingBox(),jump=await page.locator('#jump').boundingBox();
 const finger1={id:1,x:stick.x+stick.width*.9,y:stick.y+stick.height*.5};const finger2={id:2,x:jump.x+jump.width/2,y:jump.y+jump.height/2};
 await send('touchStart',[finger1]);await page.waitForTimeout(160);
 const x0=await page.evaluate(()=>WellnessCenter.state.player.x);
 await send('touchStart',[finger1,finger2]);await page.waitForTimeout(180);
 const mid=await page.evaluate(()=>({...WellnessCenter.state.player}));assert(mid.jumpTime>0);assert(mid.jump>15);assert(mid.x>x0+25);
 await page.screenshot({path:'/tmp/center-animation-moving-jump.png'});
 await send('touchEnd',[finger1]);await page.waitForTimeout(180);
 const still=await page.evaluate(()=>WellnessCenter.state.player.x);assert(still>mid.x+20,'Jump finger release must not cancel movement finger');
 await send('touchEnd',[]);await page.waitForTimeout(650);
 assert.equal(await page.evaluate(()=>WellnessCenter.state.player.jumpTime),0);
 console.log('Real two-finger hold-stick + jump, independent releases, landing: PASS');
 // Single finger: preserve recent movement momentum when moving to jump button.
 await send('touchStart',[finger1]);await page.waitForTimeout(150);await send('touchEnd',[]);await page.waitForTimeout(40);
 const before=await page.evaluate(()=>WellnessCenter.state.player.x);await send('touchStart',[finger2]);await page.waitForTimeout(180);await send('touchEnd',[]);
 const during=await page.evaluate(()=>({...WellnessCenter.state.player}));assert(during.x>before+20);assert(during.jump>15);
 console.log('Single-finger moving jump momentum: PASS');await page.waitForTimeout(650);
 for(const name of ['센터복','오피스룩','캐주얼']){
  await page.getByRole('button',{name:'복장 선택'}).click();await page.getByRole('button',{name,exact:true}).click();
  await page.keyboard.down('ArrowDown');await page.waitForTimeout(80);await page.keyboard.up('ArrowDown');
  await page.screenshot({path:'/tmp/center-animation-'+name+'.png'});
 }
 await page.setViewportSize({width:800,height:1280});await page.waitForTimeout(150);await page.screenshot({path:'/tmp/center-animation-portrait.png'});
 assert.deepEqual(errors,[]);await browser.close();console.log('Three outfits, portrait render, browser errors: PASS');
})().catch(e=>{console.error(e);process.exitCode=1;});
