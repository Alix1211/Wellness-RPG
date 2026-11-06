#!/usr/bin/env node
// Deterministic tests of the actual injected runtime with an in-memory game host.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {COHAB_DATA} from '../../src/gaia-life/cohab-ending-data.mjs';
import {fixCohabEnding} from '../../src/gaia-life/cohab-ending-patch.mjs';

const runtime=readFileSync(new URL('../../src/gaia-life/cohab-ending-runtime.js',import.meta.url),'utf8');
const candidates=['서하준','이안','윤서','도윤','한시우','정민호','오 선생','강태오','재현','백도현','차재원','송 회장'];
const conversation={
 '유리':Array.from({length:8},(_,i)=>({l:[[ '유리',i===6?'Yr7 original':'other' ]]})),
 '지안':Array.from({length:8},(_,i)=>({l:[[ '지안',i===6?'Ji7 original':'other' ]]})),
 '오 부장':Array.from({length:9},(_,i)=>({l:[[ '오 부장',i===7?'Ob8 original':'other' ]]})),
};
function setup(){
 const events=[],notes=[],q30={id:'Q30',repeatable:false};
 const life={day:1,slot:8,stats:{ki:90,um:90,bo:90,ge:90},living:{registered:true,married:false,cohab:false,events:[]}};
 const sandbox={
  life,COHAB_DATA,PERSON_LINES:conversation,QUESTS:[q30],
  M:{FLOORS:Array.from({length:12},(_,i)=>({rooms:[{kind:'villa',id:'house',name:'집'}]})),changeFloor(world,floor){world.scene.floor=floor;}},
  CityTravel:{destinations:[{id:'family',name:'가정집'}]},
  roomContext:{r:{kind:'villa',name:'집'}},world:{scene:{floor:11}},L:{gates(){}},
  autoOutfit(){},
  save(){},closeRoom(){},lifeNote(x){notes.push(x);},
  average(){return Object.values(life.stats).reduce((a,b)=>a+b,0)/4},
  gaiaStage(){return 4;},place(){return 'home';},
  openRoom(r,opts){events.push(opts.lines.map(x=>[x.speaker,x.text]));if(opts.onFinish)opts.onFinish();},
  panel(){return {append(){}};},button(){return {disabled:false};},document:{createElement(){return {textContent:''}}}
 };
 const context=vm.createContext(sandbox);
 vm.runInContext(runtime,context);
 assert.equal(q30.repeatable,true);
 return {context,life,events,notes,call:(code)=>vm.runInContext(code,context)};
}
for(const name of candidates){
 const state=setup();
 for(const [person,text] of Object.entries({'유리':'Yr7 original','지안':'Ji7 original','오 부장':'Ob8 original'}))
  state.context.gaiaTrackTalk(person,[{text}]);
 assert.equal(state.call('gaiaWitnessReady()'),true);
 state.call('gaiaCohabBegin()');
 assert.equal(state.life.living.cohab,true,'cohab flag');
 assert.deepEqual(state.events.slice(0,5).map(e=>e[0][1]),['GP-1','GP-2','GP-3','D1','cohabStart'].map(k=>COHAB_DATA[k][0][1]));
 for(let day=1;day<=4;day++){state.life.day=day;state.context.gaiaTrackTalk(name,[{text:'source stage '+day}]);}
 assert.equal(state.context.gaiaBondStage(name),4,'mature bond');
 state.call('gaiaEvaluate()');
 assert.equal(state.call('gaiaState().evaluated'),true);
 state.context.gaiaPropose(name);
 assert.equal(state.life.living.married,true);
 assert.equal(state.life.living.partner.name,name);
 assert.equal(state.call('gaiaState().husband'),name);
 const proposal=state.events[6];
 assert.equal(proposal[0][0],name,'named proposal actor');
 for(const e of state.events.slice(7,10))assert.ok(e.some(x=>x[0]===name),'F3/F4/D5 use selected man');
 state.life.day=5;
 state.call('gaiaFirstMorning()');
 assert.equal(state.call('gaiaState().morning'),true);
 state.call('gaiaEnding()');
 assert.equal(state.call('gaiaState().ended'),true);
 assert.equal(state.life.living.married,true,'post-ending married');
 assert.equal(state.life.living.cohab,true,'post-ending cohab');
 const count=state.events.length;
 state.call('gaiaEnding()');
 assert.equal(state.events.length,count,'ending never repeats');
}

// Exact data source is checked in. Every line appears verbatim in its source.
const allSources=['가이아_동거_결혼_엔딩_시나리오.md','가이아_대사_v4_무삭제_3권.md','가이아_대사_v4_무삭제_4권.md','가이아_대사_v4_무삭제_5권.md'].map(n=>readFileSync(new URL('../../docs/gaia/cohab-original/'+n,import.meta.url),'utf8'));
for(const [key,lines] of Object.entries(COHAB_DATA))for(const [speaker,spoken] of lines){
 if(!allSources.some(src=>src.includes(spoken)))throw Error('Dialogue changed or missing in source: '+key+' '+speaker+': '+spoken);
}
const base=readFileSync('GAIA-LIFE-R60-CONTROLS.html','utf8');
const combined=fixCohabEnding(base,runtime);
const scripts=[...combined.matchAll(/<script([^>]*)>([\s\S]*?)<\/script\s*>/g)];
assert.equal(scripts.length,23);
new vm.Script(scripts[16][2]);
assert.ok(!scripts[16][2].includes("add('! 기다리는 사람',meetPartner)"),'no instant marriage shortcut');
assert.ok(scripts[16][2].includes("gaiaHomeServices(r,add)"),'house menu mounted');
assert.ok(scripts[16][2].includes("id==='family'&&life.living.cohab&&!life.living.homeLocked"),'cohab residence can be reached before marriage');
const qGateText=scripts[16][2].match(/function qGate\(q\)\{[^\n]+/)[0];
const qContext=vm.createContext({life:{day:7,slot:7,stats:{},living:{married:false,cohab:true},quests:{}},L:{nightly:()=>false}});
vm.runInContext(qGateText,qContext);
assert.equal(vm.runInContext("qGate({id:'Q30',cohab:true})",qContext),true,'Sunday afternoon Q30 opens');
qContext.life.day=6;
assert.equal(vm.runInContext("qGate({id:'Q30',cohab:true})",qContext),false,'Q30 is not offered on Saturday');
qContext.life.day=7;qContext.life.slot=13;
assert.equal(vm.runInContext("qGate({id:'Q30',cohab:true})",qContext),false,'Q30 is not offered at night');
console.log('PASS: 12 candidate end-to-end flows, original lines, no instant marriage, 23-script HTML syntax');
