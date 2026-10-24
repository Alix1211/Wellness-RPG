'use strict';
const {chromium}=require('playwright');
const fs=require('fs');
const path=require('path');

const root=path.resolve(__dirname,'..');
const packed=fs.readFileSync(path.join(root,'deliverable/GAIA-Pingpong-Arcade-Powers-Trial.html'),'utf8');
const start=packed.indexOf('const EMBEDDED_MATCH=')+'const EMBEDDED_MATCH='.length;
const match=JSON.parse(/^"(?:\\.|[^"\\])*"/s.exec(packed.slice(start))[0]);

async function run(){
  const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--no-sandbox']});
  for(const [orientation,width,height] of [['landscape',960,540],['portrait',420,840]]){
    const page=await browser.newPage({viewport:{width,height}});
    const errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto('about:blank');
    await page.setContent(match,{waitUntil:'load',timeout:30000});
    await page.waitForTimeout(1000);
    const trigger=page.locator('#arcade-power-trigger');
    if(!(await trigger.count()))throw Error('Power button missing '+orientation);
    const before=await trigger.textContent();
    await trigger.click();
    if(!(await page.locator('#arcade-power-panel').isVisible()))throw Error('Selection panel not visible '+orientation);
    if((await page.locator('#arcade-power-panel .power-grid button').count())!==8)throw Error('Expected 8 powers');
    await page.locator('#arcade-power-panel .power-grid button').first().click();
    const result=await page.evaluate(()=>({
      used:arcadePower.used, id:arcadePower.active, ballRadius:BALL_R,
      meshScale:ballMesh.scale.x, reachable:getPlayerReachRadius(),
      once:document.getElementById('arcade-power-trigger').disabled,
      panelHidden:document.getElementById('arcade-power-panel').hidden
    }));
    if(!result.used||result.id!=='bigBall'||Math.abs(result.ballRadius-0.144)>.001||!result.once||!result.panelHidden){
      throw Error(orientation+': '+JSON.stringify(result));
    }
    await page.screenshot({path:path.join(root,'deliverable/preview-'+orientation+'.png')});
    await page.evaluate(()=>resetBall());
    const after=await page.evaluate(()=>({radius:BALL_R,used:arcadePower.used,active:arcadePower.active}));
    if(Math.abs(after.radius-0.08)>.001||!after.used||after.active)throw Error('Point reset failed '+orientation);
    if(errors.length)throw Error(orientation+' page errors: '+JSON.stringify(errors));
    console.log(JSON.stringify({orientation,before,result,after,errors}));
    await page.close();
  }
  await browser.close();
}
run().catch(e=>{console.error(e);process.exitCode=1;});
