const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'../belt-scroll');
const seed={gold:7500,hp:125,mp:95,tickets:5,stats:{색기:8,음란도:10,복종도:24,개방성:1}};
const html=`<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/style.css"><body>
<header id="cityTop"><div class="cityStats"><span><b id="cityGold">7,500 G</b></span><span><b id="cityHP">125 / 160</b></span><button id="cityInventory">장비·가방</button></div></header>
<script>window.GAIA={run:{get:()=>({wl:1})}};window.DetectiveApp={
state:JSON.parse(localStorage.getItem('inventory-ui-test')||JSON.stringify(${JSON.stringify(seed)})),
save(){localStorage.setItem('inventory-ui-test',JSON.stringify(this.state))},
sync(){document.getElementById('cityGold').textContent=this.state.gold+' G';document.getElementById('cityHP').textContent=this.state.hp+' / 160'}
};</script><script src="/js/items-data.js"></script><script src="/js/items.js"></script><script>BeltItems.init()</script></body></html>`;
const server=http.createServer((req,res)=>{if(req.url==='/'){res.setHeader('Content-Type','text/html');return res.end(html);}
 const name=decodeURIComponent(req.url.split('?')[0]),p=path.join(root,name);
 if(!p.startsWith(root+path.sep)||!fs.existsSync(p)){res.statusCode=404;return res.end();}
 res.setHeader('Content-Type',p.endsWith('.css')?'text/css':p.endsWith('.js')?'application/javascript':'image/webp');res.end(fs.readFileSync(p));
});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({headless:true,args:['--no-sandbox'],...(process.env.CHROMIUM_EXECUTABLE?{executablePath:process.env.CHROMIUM_EXECUTABLE}:{})});
 try{
  const page=await browser.newPage({viewport:{width:1100,height:640}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:'+server.address().port);
  await page.locator('#cityInventory').click();
  assert.equal(await page.locator('.biEquipUnit').count(),3);
  await page.locator('[data-tab="mart"]').click();assert.equal(await page.locator('.biTile').count(),20);
  await page.locator('[data-item="shop0"]').click();await page.locator('[data-buy="0"]').click();
  assert.equal(await page.locator('.biTile').count(),1);
  await page.locator('[data-equip]').click();
  assert.equal((await page.evaluate(()=>DetectiveApp.state.itemEquip)).filter(Boolean).length,1);
  await page.locator('[data-tab="status"]').click();assert.match(await page.locator('.biStatus').innerText(),/방어막/);
  await page.reload();await page.locator('#cityInventory').click();
  assert.equal(await page.locator('.biEquipUnit img').count(),1,'equipment persisted after reload');
  for(const size of [{width:1100,height:640},{width:768,height:345},{width:390,height:844},{width:360,height:640}]){
   await page.setViewportSize(size);await page.locator('[data-tab="mart"]').click();
   const rect=await page.locator('.biWindow').boundingBox();
   assert(rect.x>=0&&rect.y>=0&&rect.x+rect.width<=size.width+1&&rect.y+rect.height<=size.height+1,JSON.stringify({size,rect}));
   assert(await page.locator('.biEquipUnit').count()===3);
  }
  assert.equal(errors.length,0,errors.join('\n'));
  console.log('PASS real browser UI: mart buy, three-slot equip, status, persistence, responsive layouts');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>server.close());
