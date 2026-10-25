const fs=require('fs'),vm=require('vm'),assert=require('assert');
const path=require('path');const ui=fs.readFileSync(path.join(__dirname,'native-ui.js'),'utf8');
const fn=ui.match(/window.GaiaNativeHit=type=>\{[^\n]+/)[0];
let now=1000;const requests=[];const c={window:{},settings:{vibration:true},performance:{now:()=>now},B:{vibrate:s=>requests.push(s)},lastHit:0};vm.createContext(c);vm.runInContext(fn,c);
c.window.GaiaNativeHit('playerHit');assert.equal(requests.pop(),'100');now+=200;c.window.GaiaNativeHit('serve');assert.equal(requests.pop(),'80');now+=200;c.window.GaiaNativeHit('pointLost');assert.equal(requests.pop(),'65');
c.settings.muted=true;now+=200;c.window.GaiaNativeHit('playerHit');assert.equal(requests.pop(),'100');
c.settings.vibration=false;now+=200;c.window.GaiaNativeHit('playerHit');assert.equal(requests.length,0);
c.settings.vibration=true;now+=200;c.window.GaiaNativeHit('playerHit');c.window.GaiaNativeHit('playerHit');assert.deepEqual(requests,['100']);assert(ui.includes("if(settings.vibration)B.vibrate('100')"));
const htmlPath=process.argv[2]||[path.join(__dirname,'index.html'),path.join(__dirname,'android/app/src/main/assets/game/index.html')].find(p=>fs.existsSync(p));if(!htmlPath)throw Error('Prepare the game HTML first, or pass its path as the first argument');const html=fs.readFileSync(htmlPath,'utf8');assert(html.includes(fn));let i=0;for(const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)){if(/\bsrc\s*=/.test(m[1])||/application\/(?:json|ld\+json)/.test(m[1]))continue;new vm.Script(m[2]);i++;}
console.log(JSON.stringify({playerHit:100,serve:80,pointLost:65,settingsPreview:100,muteIndependent:true,vibrationOff:true,cooldown:true,rootScriptsParsed:i}));
