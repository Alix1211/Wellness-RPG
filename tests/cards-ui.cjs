// Install Playwright, then: node tests/cards-ui.cjs
// Optional: CHROMIUM_EXECUTABLE=/path/to/chromium UI_SCREENSHOT_DIR=/tmp/cards node tests/cards-ui.cjs
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'../belt-scroll'),entry=fs.readFileSync(path.join(root,'index.html'),'utf8').match(/<div id="missionEntry"[\s\S]*?(?=<main)/)[0];
const seed={gold:1280,hp:140,mp:100,tickets:3,stats:{},cards:{C01:2,C02:2,C03:1,C04:1,C05:1,C06:1},loadout:['C04','C02']};
const html=`<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/style.css">${entry}<script>window.DetectiveApp={state:${JSON.stringify(seed)},save(){localStorage.setItem('test-save',JSON.stringify(this.state))},sync(){this.syncs=(this.syncs||0)+1}};window.AlleyAudio={bgm(){}};window.GAIA={minigame:{play(id,o){window.training={id,options:o}}}};</script><script src="/js/cards-data.js"></script><script src="/js/cards.js"></script><script>document.getElementById('missionEntry').classList.remove('hidden');document.getElementById('deploy').textContent='휴식';document.getElementById('entryBack').onclick=()=>{BeltCards.closeBox();document.getElementById('missionEntry').classList.add('hidden')};BeltCards.openBox();</script>`;
const server=http.createServer((req,res)=>{if(req.url==='/'){res.setHeader('Content-Type','text/html; charset=utf-8');return res.end(html);}const p=path.join(root,decodeURIComponent(req.url.split('?')[0]));if(!p.startsWith(root+path.sep)){res.statusCode=403;return res.end();}if(!fs.existsSync(p)){res.statusCode=404;return res.end();}res.setHeader('Content-Type',p.endsWith('.css')?'text/css':p.endsWith('.js')?'application/javascript':p.endsWith('.webp')?'image/webp':'application/octet-stream');res.end(fs.readFileSync(p));});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const port=server.address().port;
 const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_EXECUTABLE?{executablePath:process.env.CHROMIUM_EXECUTABLE}:{}),args:['--no-sandbox']});
 try{
 const page=await browser.newPage({viewport:{width:1024,height:600}}),errors=[];page.setDefaultTimeout(6000);page.on('pageerror',e=>errors.push(e.message));await page.goto(`http://127.0.0.1:${port}`);
 const state=()=>page.evaluate(()=>JSON.parse(JSON.stringify(DetectiveApp.state)));
 assert.equal(await page.locator('.cbTile').count(),6);
 await page.locator('[data-select="C03"]').click();await page.locator('[data-eq="C03"]').click();let s=await state();assert.deepEqual(s.loadout,['C03','C02']);assert.equal(s.cards.C04,1);assert.equal(s.gold,1280);
 await page.locator('[data-slot="1"]').click();await page.locator('[data-select="C01"]').click();await page.locator('[data-eq="C01"]').click();s=await state();assert.deepEqual(s.loadout,['C03','C01']);assert.equal(s.cards.C02,2);
 await page.locator('[data-un="0"]').click();s=await state();assert.deepEqual(s.loadout,['C01']);await page.locator('[data-eq="C01"]').click();s=await state();assert.deepEqual(s.loadout,['C01','C01']);assert(await page.locator('[data-eq="C01"]').isDisabled());
 console.log('PASS full loadout replacement, separate unequip, duplicate stock limit, no unintended gold/stock loss');
 await page.locator('[data-tab="shop"]').click();await page.locator('[data-select="C03"]').click();await page.locator('[data-qty="1"]').click();await page.locator('[data-buy="C03"]').click();s=await state();assert.equal(s.cards.C03,3);assert.equal(s.gold,1200);assert.deepEqual(s.loadout,['C01','C01']);
 await page.locator('[data-slot="0"]').click();await page.locator('[data-select="C07"]').click();assert.equal((await state()).cards.C07,undefined);await page.locator('[data-buy-eq="C07"]').click();s=await state();assert.equal(s.gold,1120);assert.equal(s.cards.C07,1);assert.deepEqual(s.loadout,['C07','C01']);assert.equal(s.cards.C01,2);
 assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('test-save'))),s);
 console.log('PASS quantity purchase charges exact total; purchase-and-equip changes chosen slot only; save matches displayed state');
 await page.locator('[data-search]').fill('무적');assert(await page.locator('.cbTile').count()>0);assert(await page.locator('[data-search]').evaluate(e=>document.activeElement===e));assert.equal(await page.locator('[data-search]').inputValue(),'무적');
 await page.locator('[data-search]').fill('없는카드XYZ');assert.equal(await page.locator('.cbTile').count(),0);assert.equal(await page.locator('.cbDetail .cbEquip').count(),0);
 await page.locator('[data-search]').fill('');await page.locator('[data-fam="버프"]').click();assert(await page.locator('.cbTile').count()>0);assert((await page.locator('.cbTileFamily').allTextContents()).every(x=>x==='버프'));await page.locator('[data-fam="전체"]').click();
 await page.locator('[data-sort]').selectOption('price');const prices=await page.locator('.cbTileMeta strong').allTextContents();assert(prices.every((x,i)=>i===0||parseInt(x)>=parseInt(prices[i-1])));
 await page.locator('.cbGrid').evaluate(e=>e.scrollTop=200);const scroll=await page.locator('.cbGrid').evaluate(e=>e.scrollTop);await page.locator('[data-qty="1"]').click();assert.equal(await page.locator('.cbGrid').evaluate(e=>e.scrollTop),scroll);
 await page.locator('[data-search]').evaluate(e=>{window.composingInput=e;e.dispatchEvent(new CompositionEvent('compositionstart',{bubbles:true}));e.value='무';e.dispatchEvent(new InputEvent('input',{bubbles:true,isComposing:true}));});assert(await page.locator('[data-search]').evaluate(e=>e===window.composingInput));await page.locator('[data-search]').evaluate(e=>{e.value='무적';e.dispatchEvent(new CompositionEvent('compositionend',{bubbles:true,data:'무적'}));});assert.equal(await page.locator('[data-search]').inputValue(),'무적');await page.locator('[data-search]').fill('');
 console.log('PASS effect/name search, typing focus, empty results, family filtering, price ordering and preserved scroll');
 await page.locator('[data-search]').fill('CANNOT_MATCH');await page.locator('[data-slot="0"]').click();assert.equal(await page.locator('[data-search]').inputValue(),'');
 await page.locator('[data-select="C01"]').click();await page.locator('[data-zoom]').click();assert(await page.locator('.cbZoom').isVisible());await page.keyboard.press('Escape');assert.equal(await page.locator('.cbZoom').count(),0);
 await page.evaluate(()=>{DetectiveApp.state.gold=0;BeltCards.render()});assert(await page.locator('[data-buy]').isDisabled());await page.locator('[data-select="C08"]').click();assert(await page.locator('[data-buy-eq]').isDisabled());assert(await page.locator('[data-qty="1"]').isDisabled());
 console.log('PASS full image preview, Escape close, slot selection clears incompatible filter, unavailable purchase controls disabled');
 await page.evaluate(()=>{const s=DetectiveApp.state;s.gold=1280;for(let n=1;n<=10;n++)s['stage'+n]=true;BeltCards.render()});assert.equal(await page.locator('[data-slot]').count(),4);
 for(const size of [{width:1536,height:691},{width:1024,height:600},{width:960,height:540},{width:768,height:345},{width:390,height:844},{width:360,height:640}]){
  await page.setViewportSize(size);await page.locator('[data-select="C01"]').click();
  if(process.env.UI_SCREENSHOT_DIR){fs.mkdirSync(process.env.UI_SCREENSHOT_DIR,{recursive:true});await page.screenshot({path:path.join(process.env.UI_SCREENSHOT_DIR,`police-${size.width}x${size.height}.png`)});}
  const rects=await page.evaluate(()=>Object.fromEntries(['.entryPanel','.cbGrid','.cbAside','.cbDetailActions','.cbDetailMain','#entryBack','#deploy'].map(sel=>{const r=document.querySelector(sel).getBoundingClientRect();return [sel,{x:r.x,y:r.y,right:r.right,bottom:r.bottom,w:r.width,h:r.height}]})));
  for(const [sel,r]of Object.entries(rects)){assert(r.h>0&&r.w>0,JSON.stringify({size,sel,r}));assert(r.x>=-1&&r.y>=-1&&r.right<=size.width+1&&r.bottom<=size.height+1,JSON.stringify({size,sel,r}));}
  assert(rects['.cbDetailMain'].h>=55,JSON.stringify({size,rects}));
  assert(rects['.cbGrid'].h>=70,JSON.stringify({size,rects}));
  assert(await page.locator('.cbEquip').isVisible());
 }
 console.log('PASS 2/4-slot layouts: 1536×691, 1024×600, 960×540, 768×345, 390×844, 360×640; actions and navigation stay inside viewport');
 await page.locator('[data-tab="train"]').click();assert.equal(await page.locator('.cbStat').count(),4);await page.locator('[data-play="batting"]').click();await page.evaluate(()=>{training.options.onResult({success:true,ratio:.6});training.options.onClose()});s=await state();assert.equal(s.tickets,2);assert.equal(s.stats.복종도,1);assert.equal(s.stats.음란도,1);
 await page.locator('[data-tab="box"]').click();await page.locator('#entryBack').click();assert(!(await page.locator('#missionEntry').evaluate(e=>e.classList.contains('card-mode'))));assert.equal(errors.length,0,errors.join('\n'));
 const mobile=await browser.newContext({viewport:{width:768,height:345},hasTouch:true,isMobile:true});const touch=await mobile.newPage();await touch.goto(`http://127.0.0.1:${port}`);await touch.locator('[data-tab="shop"]').tap();const grid=await touch.locator('.cbGrid').boundingBox(),cdp=await mobile.newCDPSession(touch);const x=grid.x+grid.width*.45,start=grid.y+grid.height-15,end=grid.y+15;
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y:start}]});for(let j=1;j<=8;j++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:start+(end-start)*j/8}]});await touch.waitForTimeout(20);}await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await touch.waitForTimeout(120);assert(await touch.locator('.cbGrid').evaluate(e=>e.scrollTop>20));await mobile.close();console.log('PASS real touch swipe scrolls cards despite the game page touch restrictions; Korean IME composition preserves its input element');
 console.log('PASS training rewards/tickets unchanged; leaving police removes only scoped card layout; no JS runtime errors');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>server.close());
