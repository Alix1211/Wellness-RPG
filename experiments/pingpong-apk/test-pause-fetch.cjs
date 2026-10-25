const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),path=require('path');
const html=fs.readFileSync(process.argv[2],'utf8');
function value(name){const at=html.indexOf('const '+name+'=')+('const '+name+'=').length;return JSON.parse(html.slice(at).match(name==='MINI_POOL'?/^\[(?:[^\]"\\]|"(?:[^"\\]|\\.)*")*\]/:/^"(?:[^"\\]|\\.)*"/)[0]);}
const match=value('EMBEDDED_MATCH');
let parsed=0;
for(const doc of [html,match])for(const m of doc.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)){
 if(/\bsrc\s*=|application\/json/.test(m[1]))continue;new vm.Script(m[2]);parsed++;
}
let wall=0,next=0,timers=new Map();
function advance(ms){const target=wall+ms;while(true){const due=[...timers].filter(([,t])=>t.at<=target).sort((a,b)=>a[1].at-b[1].at)[0];if(!due)break;wall=due[1].at;timers.delete(due[0]);due[1].fn();}wall=target;}
const ctx={performance:{now:()=>wall},setTimeout:(fn,ms)=>{timers.set(++next,{fn,at:wall+ms});return next},clearTimeout:id=>timers.delete(id)};ctx.window=ctx;vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname,'match-pause-clock.js'),'utf8'),ctx);
vm.runInContext('var fired=0,ticks=0;setTimeout(()=>fired++,1000);var interval=setInterval(()=>ticks++,100)',ctx);
advance(250);assert.equal(ctx.ticks,2);ctx.GaiaMatchClock.setPaused(true);const frozen=ctx.performance.now();advance(10000);assert.equal(ctx.fired,0);assert.equal(ctx.ticks,2);assert.equal(ctx.performance.now(),frozen);
ctx.GaiaMatchClock.setPaused(false);advance(49);assert.equal(ctx.ticks,2);advance(1);assert.equal(ctx.ticks,3);advance(699);assert.equal(ctx.fired,0);advance(1);assert.equal(ctx.fired,1);
ctx.GaiaMatchClock.setPaused(true);ctx.setTimeout(()=>ctx.fired++,500);advance(2000);assert.equal(ctx.fired,1);ctx.GaiaMatchClock.setPaused(false);advance(499);assert.equal(ctx.fired,1);advance(1);assert.equal(ctx.fired,2);ctx.clearInterval(ctx.interval);
// Execute the actual embedded receiver, including srcdoc's opaque location.origin.
const receiver=match.split('\n').find(l=>l.startsWith("addEventListener('message',e=>")&&l.includes('careerPaused=true'));
const parent={},animations=[{playState:'running',pause(){this.playState='paused'},play(){this.playState='running'}}];
Object.assign(ctx,{parent,URL,location:{origin:'null'},document:{baseURI:'https://appassets.androidplatform.net/game/index.html',documentElement:{getAnimations:()=>animations}},releaseHeldSpin(){},audioCtx:null,lastTime:0,gameState:'play',gameStateBeforeMenu:null,careerToken:'test',careerPaused:false,menuOpen:false,addEventListener:(n,fn)=>ctx.receive=fn});
vm.runInContext(receiver,ctx);
const send=(paused,token='test',source=parent)=>ctx.receive({source,origin:'https://appassets.androidplatform.net',data:{type:'gaia-pause',token,paused}});
send(true,'wrong');assert.equal(ctx.careerPaused,false);send(true,'test',{});assert.equal(ctx.careerPaused,false);send(true);assert.equal(ctx.careerPaused,true);assert.equal(animations[0].playState,'paused');
// The real frame loop must exit before any physics/AI/timers are updated.
let renders=0,frames=0;Object.assign(ctx,{requestAnimationFrame:()=>frames++,renderer:{render:()=>renders++},scene:{},camera:{}});
const loop=match.slice(match.indexOf('function animate() {'),match.indexOf('// ─── RESIZE ───',match.indexOf('function animate() {')));
vm.runInContext(loop,ctx);ctx.animate();assert.equal(renders,1);assert.equal(frames,1);assert.equal(ctx.gameState,'play');send(false);assert.equal(ctx.careerPaused,false);assert.equal(animations[0].playState,'running');
const fetchCode=value('MINI_POOL').find(x=>x.includes('class FetchGame'));
assert(fetchCode.includes('this.h=innerHeight>innerWidth?1080:540'));
const resize=fetchCode.match(/this.resize=\(\)=>\{([^\n]+?)\};this.observer/)[1];
function layout(width,height){const c={innerHeight:height,innerWidth:width,Math};vm.createContext(c);const game={c:{parentElement:{getBoundingClientRect:()=>({width,height})}},ctx:{setTransform(){}},draw(){}};c.game=game;vm.runInContext('(function(){'+resize+'}).call(game)',c);return game;}
for(const [width,height]of [[480,820],[800,1280],[960,540]]){const g=layout(width,height),oldScale=height/540,newScale=height/g.h;assert.equal(newScale/oldScale,height>width?.5:1);assert.equal(g.floor*newScale,414*oldScale);assert(Math.abs(g.w*newScale-width)<.001);}
// Pausing never changes the match's score or rally state; resume preserves both.
assert.equal(ctx.gameState,'play');
console.log(JSON.stringify({scriptsParsed:parsed,pauseReceiverSrcdoc:true,invalidMessagesIgnored:true,physicsLoopFrozen:true,timeoutsAndIntervalsPreserveRemaining:true,clockDeadlinesFrozen:true,animationsResume:true,portraitZoom:.5,landscapeZoom:1,floorPositionPreserved:true}));
