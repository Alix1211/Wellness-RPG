const {chromium}=require('playwright');
const file=require('path').resolve(__dirname,'../../GAIA-LIFE-20261020.html'),only=process.argv[2];
const scenarios={
 S1_save_throws_on_exit:async(p)=>{await p.evaluate(()=>CityTravel.beginEncounter());await p.waitForFunction(()=>document.querySelector('#miniFrame').contentWindow.LifeMini);await p.evaluate(()=>{const o=Storage.prototype.setItem;Storage.prototype.setItem=function(){throw new DOMException('quota','QuotaExceededError')};window.__restoreLS=()=>{Storage.prototype.setItem=o}});await p.locator('#miniBack').tap();await p.waitForTimeout(600);},
 S2_studio_rejects_on_entry:async(p)=>{await p.evaluate(()=>{Studio.resolve=()=>Promise.reject(new Error('idb fail'))});await p.evaluate(()=>CityTravel.beginEncounter());await p.waitForTimeout(800);const b=await p.locator('#miniBack').isVisible();console.log('  miniBack visible after failed entry:',b);if(b)await p.locator('#miniBack').tap({timeout:3000}).catch(e=>console.log('  miniBack tap fail',e.message.slice(0,90)));await p.waitForTimeout(600);},
 S3_studio_hangs_on_entry:async(p)=>{await p.evaluate(()=>{Studio.resolve=()=>new Promise(()=>{})});await p.evaluate(()=>CityTravel.beginEncounter());await p.waitForTimeout(800);const b=await p.locator('#miniBack').isVisible();console.log('  miniBack visible while hung:',b);if(b)await p.locator('#miniBack').tap({timeout:3000}).catch(e=>console.log('  miniBack tap fail',e.message.slice(0,90)));await p.waitForTimeout(600);},
 S4_normal:async(p)=>{await p.evaluate(()=>CityTravel.beginEncounter());await p.waitForFunction(()=>document.querySelector('#miniFrame').contentWindow.LifeMini);await p.locator('#miniBack').tap();await p.waitForTimeout(600);},
};
(async()=>{
const browser=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--autoplay-policy=user-gesture-required']});
for(const [name,fn] of Object.entries(scenarios)){
 if(only&&!name.startsWith(only))continue;
 const p=await browser.newPage({viewport:{width:412,height:850},hasTouch:true,isMobile:true});p.setDefaultTimeout(30000);
 const errs=[];p.on('pageerror',e=>errs.push(e.message.slice(0,100)));
 await p.goto('file://'+file,{timeout:90000});await p.locator('#loading').waitFor({state:'detached',timeout:90000});
 await p.locator('#startGame').tap();await p.evaluate(()=>CityTravel.start('center'));
 await fn(p);
 const s=await p.evaluate(()=>{const sp0=CityTravel.route&&CityTravel.route.speed;const j=CityTravel.jump(),bo=CityTravel.boost();return {mode:GameHost.mode(),enc:!!CityTravel.encounter,miniHidden:document.querySelector('#miniLayer').hidden,fieldHidden:document.querySelector('#fieldUI').hidden,jumpWorks:j,boostWorks:bo}});
 const recovered=s.mode==='field'&&!s.enc&&s.jumpWorks;
 if(!recovered)process.exitCode=1;
 console.log(name,recovered?'RECOVERED':'*** SOFT-LOCK ***',JSON.stringify(s),'errors:',errs);
 await p.close();
}
await browser.close();
})().catch(e=>{console.error('FATAL',e.message);process.exit(1)});
