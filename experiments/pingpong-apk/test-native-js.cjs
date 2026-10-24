const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
class Storage{getItem(k){return this[k]??null}setItem(k,v){this[k]=String(v)}removeItem(k){delete this[k]}}
const key='gaia-pingpong-champion-items-v1',storage=new Storage(),native={},nodes=new Map(),calls=[];
const sample={version:2,id:'test',region:0,turn:0,hp:100,money:120,stats:{charm:0,power:0,defense:0,spin:0},wins:[],hand:[1,2,3,4],gear:{version:1,coins:0,items:[],equipped:{}},career:{level:1,seconds:0}};
let ctx;
const body={insertAdjacentHTML(p,html){if(html.includes('gaia-native-gate'))nodes.set('gaia-native-gate',{remove(){nodes.delete('gaia-native-gate')}})},append(n){nodes.set(n.id,n)}};
const document={body,querySelector(s){return nodes.get(s.replace('#',''))||null},createElement(){return{style:{},querySelector(){return{}},remove(){nodes.delete(this.id)}}},addEventListener(){}};
const B={load:()=>JSON.stringify(native),reconcileLocal:t=>t,put:(k,v)=>{native[k]=v;calls.push(['put',k])},del:k=>delete native[k],webReady:()=>ctx.onGaiaSyncDone(),backupStatus:()=>JSON.stringify({}),vibrate:p=>calls.push(['vibrate',p]),pickBackup(){},syncBackup(){},cancelRestore(){}};
const overlay={hidden:true};
ctx={Storage,localStorage:storage,GaiaBridge:B,document,state:structuredClone(sample),settings:{},activeGame:null,SAVE_KEY:key,save:()=>storage.setItem(key,JSON.stringify(ctx.state)),settingsModal(){},validate:s=>{assert.equal(s.version,2);return s},$:s=>s==='#overlay'?overlay:null,pauseGame(){},resumeGame(){},closeModal(){},toast(){},performance:{now:()=>1000},Date,JSON,Number,Object,Array,console,setTimeout:()=>1,clearTimeout(){},location:{reload(){calls.push(['reload'])}},confirm:()=>true};ctx.window=ctx;
vm.createContext(ctx);vm.runInContext(fs.readFileSync('apk-work/native-boot.js','utf8'),ctx);storage.setItem(key,'blocked');assert.equal(storage.getItem(key),null);
vm.runInContext(fs.readFileSync('apk-work/native-ui.js','utf8'),ctx);
assert.equal(ctx.GAIA_NATIVE_GATE,false);assert(native[key]);const stamp=ctx.state.t;
ctx.state.career.seconds=100;ctx.save();assert.equal(ctx.state.t,stamp,'idle playtime must not advance sync timestamp');
ctx.state.gear.coins=20;ctx.save();assert(ctx.state.t>stamp);assert.equal(JSON.parse(native[key]).gear.coins,20);
ctx.onGaiaSyncStart();const kept=native[key];ctx.state.gear.coins=40;ctx.save();assert.equal(native[key],kept,'sync must block saving');ctx.onGaiaSyncDone();assert.equal(JSON.parse(native[key]).gear.coins,40,'queued change must flush');
ctx.settings.vibration=false;ctx.GaiaNativeHit('playerHit');assert(!calls.some(x=>x[0]==='vibrate'));ctx.settings.vibration=true;ctx.GaiaNativeHit('playerHit');assert(calls.some(x=>x[0]==='vibrate'&&x[1]==='35'));
const remote=structuredClone(sample);remote.t=991;remote.gear.coins=777;ctx.onGaiaBackupApplied(JSON.stringify({[key]:JSON.stringify(remote)}));assert.equal(JSON.parse(storage.getItem(key)).t,991);assert.equal(JSON.parse(storage.getItem(key)).gear.coins,777);assert(calls.some(x=>x[0]==='reload'));
// Compile every actual inline script and the embedded match, without evaluating game state.
const html=fs.readFileSync('apk-work/android/app/src/main/assets/game/index.html','utf8');let scripts=0;for(const m of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)){new vm.Script(m[1]);scripts++}
const anchor='const EMBEDDED_MATCH=',a=html.indexOf(anchor)+anchor.length,m=html.slice(a).match(/^"(?:[^"\\]|\\.)*"/),match=JSON.parse(m[0]);for(const x of match.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g))new vm.Script(x[1]);assert(match.includes('GAIA_SKIN_STATUS'));assert(html.includes('GAIA_PADDLE_SKINS'));
const result={syncTimestampIgnoresIdle:true,progressChangesTimestamp:true,savingBlockedDuringSync:true,queuedSaveRetained:true,vibrationToggle:true,restorePreservesTimestamp:true,actualInlineSyntax:true,rootScripts:scripts};fs.writeFileSync('apk-work/test-native-js.json',JSON.stringify(result,null,2));console.log(result);
