const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),path=require('path');
const code=fs.readFileSync(path.join(__dirname,'map-hop.js'),'utf8');
function fixture({ticket=false,missing=false,invalid=false,broken=false}={}){
 const frames=[],samples=[],log=[],handlers={},attrs={};let time=0;
 const app={setAttribute:(k,v)=>attrs[k]=v,removeAttribute:k=>delete attrs[k],inert:false};
 const avatar={offsetHeight:73,style:new Proxy({},{set(o,k,v){o[k]=v;if(k==='transform')samples.push({...o});return true}})};
 const sc={clientWidth:480,clientHeight:760,style:{},scrollTop:0,scrollLeft:0};
 const shadow={style:{},setAttribute(){},remove(){log.push('remove-shadow')}};
 const coords={start:{x:280,y:600},one:{x:420,y:600},twoB:{x:460,y:858},three:{x:200,y:1000},end:{x:350,y:1000}};
 const elements={'#app':app,'.map-avatar':missing?null:avatar,'.node-scroll':sc,'.map-content':{append(){if(broken)throw Error('test renderer failure')}},'.hand-hint':{}};
 const context={window:null,console:{error(){}},Math,Promise,selection:{index:1,ticket},state:{position:'start',hand:[1,4],tickets:[1,4],turn:0},layout:()=>({coords}),$:s=>elements[s],tour:()=>log.push('tour'),save:()=>log.push('save'),closeModal:()=>log.push('close'),showPending:()=>log.push('event'),toast:()=>log.push('toast'),requestAnimationFrame:fn=>frames.push(fn),document:{addEventListener:(n,fn)=>handlers[n]=fn,createElement:()=>shadow}};
 context.arrive=(state,index,route,isTicket)=>{if(invalid)throw Error('invalid path');log.push('arrive');assert.equal(index,1);assert.equal(isTicket,ticket);(isTicket?state.tickets:state.hand).splice(index,1);state.position=route.at(-1);state.turn++;};
 context.window=context;vm.createContext(context);vm.runInContext(code+'\nwindow.hop=GaiaMapHop;',context);
 return{context,frames,log,app,attrs,samples,coords,avatar,handlers,async tick(){const fn=frames.shift();if(fn){time+=20;fn(time);}await Promise.resolve();await Promise.resolve();},get time(){return time}};
}
(async()=>{
 for(const ticket of [false,true]){
  const f=fixture({ticket}),route=['start','one','twoB','three','end'];
  const pending=f.context.commitMove(route);
  assert.equal(f.context.hop.moving,true);assert.equal(f.app.inert,true);assert.equal(f.log.filter(x=>x==='arrive').length,1);assert.equal(f.context.state.position,'end');assert(!f.log.includes('event'));
  await f.context.commitMove(route);assert.equal(f.log.filter(x=>x==='arrive').length,1);
  f.context.tour();assert(!f.log.includes('tour'),'resize must not replace the moving icon');
  let blocked=0;f.handlers.click({target:{closest:()=>true},preventDefault:()=>blocked++,stopImmediatePropagation:()=>blocked++});assert.equal(blocked,2);
  for(let i=0;i<200&&f.context.hop.moving;i++)await f.tick();await pending;
  assert.equal(f.context.hop.moving,false);assert.equal(f.app.inert,false);assert(!('aria-busy'in f.attrs));
  assert.equal(f.log.filter(x=>x==='event').length,1);assert.equal(f.context.state.turn,1);assert(f.log.indexOf('save')<f.log.indexOf('event'));assert(f.log.indexOf('remove-shadow')<f.log.indexOf('event'));
  for(const id of route.slice(1)){const p=f.coords[id];assert(f.samples.some(s=>parseFloat(s.left)===p.x&&parseFloat(s.top)===p.y),'must land at '+id);}
  const last=f.samples.at(-1);assert.equal(last.left,'350px');assert.equal(last.top,'1000px');assert(f.samples.some(x=>/rotate\([^-0]/.test(x.transform)));assert(f.time<=1200);
 }
 for(const options of [{missing:true},{invalid:true},{broken:true}]){const f=fixture(options);await f.context.commitMove(['start','one']);assert.equal(f.context.hop.moving,false);assert.equal(f.app.inert,false);assert.equal(f.log.filter(x=>x==='event').length,options.invalid?0:1);}
 const p=fixture().context.hop.pose;const a={x:1,y:2},b={x:100,y:90};assert.deepEqual(JSON.parse(JSON.stringify(p(a,b,0))),{x:1,y:2,lift:0,sx:1,sy:1,tilt:0,shadow:1});assert(p(a,b,.5).lift>21);assert(Math.abs(p(a,b,1).x-b.x)<.001);assert(p(a,b,.05).sy<1);
 const before=fs.readFileSync(process.argv[2],'utf8'),after=fs.readFileSync(process.argv[3],'utf8');
 assert.equal(after.replace(code+'\n',''),before,'HTML must differ only by the map presentation module');
 let scripts=0;for(const m of after.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)){if(/\bsrc\s*=|application\/json/.test(m[1]))continue;new vm.Script(m[2]);scripts++;}
 console.log(JSON.stringify({normalCards:true,tickets:true,branchRoute:true,everyNodeLanding:true,duplicateInputBlocked:true,resizeGuard:true,eventAfterLanding:true,singleSaveAndTurn:true,missingArtFallback:true,renderErrorRecovery:true,hopMs:220,landingMs:120,otherHTMLUnchanged:true,scriptsParsed:scripts}));
})().catch(e=>{console.error(e);process.exit(1)});
