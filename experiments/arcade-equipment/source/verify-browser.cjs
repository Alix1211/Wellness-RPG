const fs=require('fs'),http=require('http'),path=require('path'),assert=require('assert/strict'),{chromium}=require('playwright');
(async()=>{
 const root=process.cwd(),dir=root+'/item-update/release',results=[],errors=[];fs.mkdirSync(root+'/item-update/qa',{recursive:true});
 let html=fs.readFileSync(dir+'/GAIA-Pingpong-v12.12.html','utf8');
 const hook=`window.__itemQA={get state(){return state},get active(){return activeGame},get key(){return SAVE_KEY},lobby:()=>{closeModal();screen='lobby';lobby()},profile:()=>profile(),fresh:()=>{state=fresh();career(state);GearModel.ensure(state);save()},save:()=>save(),handle:data=>handleGame(data),finish:(id,won,token,quit=false)=>{activeGame={type:'match',npc:NPC_BY_ID[id],arcade:true,token};handleGame({won,score:quit?'중도 종료':'11 : 5'})},open:(id,arcade=true)=>{if(!arcade)state.pending={id:'qa-tour',kind:'match',stage:'arrived',round:0,opponents:[id]};openGame('match',NPC_BY_ID[id],arcade)}};`;
 const final=html.lastIndexOf('save();render();');html=html.slice(0,final)+hook+html.slice(final);
 const roots=[dir,root+'/v12.11-download/release',root+'/enemy-cutin/release'];
 const server=http.createServer((q,r)=>{const url=decodeURIComponent(q.url.split('?')[0]);if(url==='/qa.html'){r.setHeader('Content-Type','text/html;charset=utf-8');return r.end(html)}let file;for(const d of roots){file=d+url;if(fs.existsSync(file)&&fs.statSync(file).isFile())break}if(!file||!fs.existsSync(file)){r.writeHead(404);return r.end()}const ext=path.extname(file);r.setHeader('Content-Type',({'.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.woff2':'font/woff2','.jpg':'image/jpeg'})[ext]||'application/octet-stream');fs.createReadStream(file).pipe(r)});
 await new Promise(r=>server.listen(8824,'127.0.0.1',r));
 const browser=await chromium.launch({executablePath:root+'/browser/chromium-runtime/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader'],env:{...process.env,LD_LIBRARY_PATH:root+'/browser/chromium-runtime'}});
 try{
  const context=await browser.newContext({viewport:{width:480,height:820},hasTouch:true}),page=await context.newPage();page.on('pageerror',e=>{errors.push(e.message);console.log('ERROR',e.message)});
  await page.addInitScript(()=>localStorage.setItem('gaia-pingpong-champion-v2',JSON.stringify({oldCareerSentinel:true})));
  await page.goto('http://127.0.0.1:8824/qa.html');await page.evaluate(()=>{__itemQA.fresh();__itemQA.lobby()});
  assert.equal(await page.evaluate(()=>__itemQA.state.gear.coins),0);assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('gaia-pingpong-champion-v2')).oldCareerSentinel),true);
  const before=await page.evaluate(()=>JSON.stringify({stats:__itemQA.state.stats,career:__itemQA.state.career}));
  for(let i=0;i<4;i++)await page.evaluate(i=>__itemQA.finish('r0-0',true,'test-win-'+i),i);
  assert.equal(await page.evaluate(()=>__itemQA.state.gear.coins),80);assert.equal(await page.evaluate(()=>JSON.stringify({stats:__itemQA.state.stats,career:__itemQA.state.career})),before);
  await page.evaluate(()=>__itemQA.lobby());await page.locator('#app [data-action="gear-shop"]').tap();await page.locator('[data-action="gear-buy"]').tap();
  assert.equal(await page.evaluate(()=>__itemQA.state.gear.items.length),1);assert.equal(await page.evaluate(()=>__itemQA.state.gear.coins),0);assert((await page.locator('.gear-toolbar .gear-coins').innerText()).includes('0 코인'));
  await page.locator('[data-action="gear-equip-found"]').tap();assert(await page.evaluate(()=>Object.values(__itemQA.state.gear.equipped).some(Boolean)));
  await page.locator('#overlay [data-action="gear-bag"]').tap();await page.locator('[data-action="gear-discard"]').tap();await page.locator('[data-action="gear-discard-confirm"]').tap();assert.equal(await page.evaluate(()=>__itemQA.state.gear.items.length),0);assert.equal(await page.evaluate(()=>__itemQA.state.gear.coins),0);
  for(const id of ['r0-7','r1-7','r2-9'])await page.evaluate(id=>__itemQA.finish(id,true,'champ-'+id),id);
  assert.equal(await page.evaluate(()=>__itemQA.state.gear.items.length),3);assert.equal(await page.evaluate(()=>__itemQA.state.gear.coins),60);
  await page.evaluate(()=>__itemQA.handle({won:true,score:'11:0'}));assert.equal(await page.evaluate(()=>__itemQA.state.gear.items.length),3);
  await page.evaluate(()=>__itemQA.finish('r0-0',false,'quit-token',true));assert.equal(await page.evaluate(()=>__itemQA.state.gear.coins),60);
  await page.evaluate(()=>__itemQA.finish('r0-0',false,'loss-token'));assert.equal(await page.evaluate(()=>__itemQA.state.gear.coins),68);
  await page.evaluate(()=>{const s=__itemQA.state,g=GaiaGear.model.ensure(s);for(const kind of ['racket','ball']){const x={id:'qa-'+kind,kind,grade:2,color:kind==='ball'?'#69d8c7':'#f16fa7',theme:kind==='ball'?1:0,region:-1,options:[{key:'power',value:5},{key:'spin',value:4},{key:'control',value:3}]};g.items.push(x);GaiaGear.model.equip(s,x.id)}__itemQA.save();GaiaGear.bag()});
  for(const [width,height]of [[480,820],[960,540]]){await page.setViewportSize({width,height});await page.waitForTimeout(120);const bounds=await page.locator('.gear-modal').boundingBox();assert(bounds.x>=-1&&bounds.y>=-1&&bounds.x+bounds.width<=width+1&&bounds.y+bounds.height<=height+1);await page.screenshot({path:root+'/item-update/qa/bag-'+width+'.png'})}
  const stored=await page.evaluate(()=>JSON.stringify(__itemQA.state.gear));await page.reload();assert.equal(await page.evaluate(()=>JSON.stringify(__itemQA.state.gear)),stored);
  const matchStats=[];
  for(const arcade of [true,false]){
   await page.evaluate(arcade=>__itemQA.open('r0-0',arcade),arcade);await page.waitForFunction(()=>document.querySelector('#gameFrame').contentWindow.v12ReadyTime,null,{timeout:30000});
   const f=page.frames()[1];const row=await f.evaluate(()=>({stats:{...playerStats},base:{speed:careerAbility(careerGrowth[0]),power:careerAbility(careerGrowth[1]),spin:careerAbility(careerGrowth[3]),accuracy:careerAbility(careerGrowth[3])},bonus:gaiaGearLoad.bonuses,color:ballMat.color.getHexString(),opponent:{...careerOpponent},racketMaterials:playerRacket.children[1].material.length,opponentMaterialArray:Array.isArray(oppRacket.children[1].material)}));
   assert.equal(row.bonus.power,10);assert.equal(row.stats.power,row.base.power*1.1);assert.equal(row.stats.spin,row.base.spin*1.08);assert.equal(row.stats.accuracy,row.base.accuracy*1.06);assert.equal(row.color,'69d8c7');assert.equal(row.racketMaterials,3);assert.equal(row.opponentMaterialArray,false);assert.equal(row.opponent.power,70);
   await f.evaluate(()=>{applyBallVisualEffect('dragonStrike');if(ballMat.color.getHexString()!=='69d8c7')throw Error('Ball colour lost on skill');enemyResetPoint();if(ballMat.color.getHexString()!=='69d8c7')throw Error('Ball colour lost after enemy reset')});
   const beforeCoins=await page.evaluate(()=>__itemQA.state.gear.coins);await f.evaluate(()=>careerSend(true));await page.waitForFunction(()=>document.querySelector('#game').hidden);const afterCoins=await page.evaluate(()=>__itemQA.state.gear.coins);assert.equal(afterCoins-beforeCoins,arcade?20:0);matchStats.push({arcade,...row,rewardCoins:afterCoins-beforeCoins});
  }
  await page.evaluate(()=>{__itemQA.profile()});assert.equal(await page.locator('.gear-profile [data-action="gear-bag"]').count(),1);
  results.push({newSaveNamespace:true,oldStorageUntouched:true,purchaseAndDiscard:true,noRefund:true,champions:['r0-7','r1-7','r2-9'],noArcadeGrowth:true,noDuplicateReward:true,noQuitReward:true,lossCoins:8,persistence:true,mobileLayout:true,matchStats});assert.deepEqual(errors,[]);
  fs.writeFileSync(root+'/item-update/qa/browser.json',JSON.stringify(results,null,2));console.log('PASS',JSON.stringify(results));await context.close();
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);process.exit(1)});
