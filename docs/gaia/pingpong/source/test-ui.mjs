import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
const standalone=fs.existsSync(new URL('../release/GAIA-Pingpong-v5.html',import.meta.url))?
 new URL('../release/GAIA-Pingpong-v5.html',import.meta.url):new URL('../GAIA-Pingpong-v5.html',import.meta.url);
const html=fs.readFileSync(standalone,'utf8');
const from=html.lastIndexOf('<script type="module">')+'<script type="module">'.length;
const to=html.indexOf('</script>',from);
const sent=[];
const element=(props={})=>({innerHTML:'',hidden:false,dataset:{},classList:{add(){},remove(){}},focus(){},setAttribute(){},...props});
const frame=element({src:'',contentWindow:{postMessage(d){sent.push(d);}}});
const ui=new Map([
 ['#app',element({clientWidth:1280})],['#overlay',element({hidden:true})],
 ['#toast',element({textContent:''})],['#gameFrame',frame],
 ['#game',element({hidden:true})],['#gameBack',element()],
 ['.node-scroll',element({scrollTop:0,clientHeight:600})]
]);
const nodes=new Map();
const document={
 querySelector(sel){
  const m=/^\.node\[data-value="([^"]+)"\]$/.exec(sel);
  if(m){if(!nodes.has(m[1]))nodes.set(m[1],element());return nodes.get(m[1]);}
  return ui.get(sel)||null;
 },
 querySelectorAll(){return[];},addEventListener(){}
};
const storage=new Map();
const context=vm.createContext({
 document,window:{addEventListener(){}},crypto:webcrypto,URLSearchParams,
 location:{protocol:'file:',origin:'null'},
 localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},
 setTimeout(){return 1;},clearTimeout(){},console
});
new vm.Script(html.slice(from,to),{filename:'GAIA-Pingpong-v5.html'}).runInContext(context);
vm.runInContext("goto('board')",context);
assert.equal(nodes.size,12);
assert(nodes.get('2').innerHTML.includes('균형'));
assert(nodes.get('4').innerHTML.includes('실린더'));
assert(nodes.get('9').innerHTML.includes('챌린지'));
assert.equal(nodes.get('2').dataset.statLabel,'색기 ↑');

vm.runInContext("state.position='2';state.pending={id:'test-train',kind:'train',stage:'arrived',round:0,opponents:[]};showPending();",context);
assert.equal(frame.src,'GAIA-Pingpong-v3-Casual.html');
assert.equal(ui.get('#game').hidden,false);
assert(!ui.get('#overlay').innerHTML.includes('게임 선택'));
frame.onload();
assert.equal(sent[0].type,'gaia-pong-start');
assert.equal(sent[0].game,'balance');
assert.equal(sent[0].stage,1);
vm.runInContext("handleGame({game:'balance',stage:1,success:true,ratio:1})",context);
assert.equal(ui.get('#game').hidden,true);
assert.equal(vm.runInContext('state.trainingClears.balance[0]',context),1);
assert.equal(vm.runInContext('state.hp',context),88);
assert.equal(vm.runInContext('state.pending',context),null);
assert(ui.get('#overlay').innerHTML.includes('균형 잡기 성공'));

nodes.clear();
vm.runInContext("state.region=1;state.maxRegion=1;state.position='4';state.pending={id:'national-train',kind:'train',stage:'arrived',round:0,opponents:[]};goto('board');showPending();",context);
assert.equal(nodes.size,16);
assert(nodes.get('4').innerHTML.includes('챌린지'));
frame.onload();
assert.equal(sent.at(-1).game,'tap');
vm.runInContext("handleGame({game:'tap',stage:4,success:true,ratio:.9})",context);
assert.equal(vm.runInContext('state.pending',context),null);

nodes.clear();
vm.runInContext("state.region=2;state.maxRegion=2;state.position='57';state.pending={id:'world-train',kind:'train',stage:'arrived',round:0,opponents:[]};goto('board');showPending();",context);
assert.equal(nodes.size,20);
frame.onload();
assert.equal(sent.at(-1).stage,10);
vm.runInContext("handleGame({game:'wiggle',stage:10,success:true,ratio:.85})",context);
// The 10th stage must have been checked against the exact assigned game.
assert.equal(vm.runInContext('state.pending',context),null);
console.log('v5 UI 검증 통과: 12/16/20 게임명 노드 표시 → 자동 진입 → 스탯 보상 → 세계 10단계');
