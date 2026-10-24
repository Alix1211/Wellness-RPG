'use strict';
const fs=require('fs');
const path=require('path');
const vm=require('vm');
const assert=require('assert');

const source=fs.readFileSync(path.join(__dirname,'arcade-powers.js'),'utf8');
if(!source.trimEnd().endsWith('arcadeInstallUI();'))throw Error('Unexpected addon ending');

class Group {
  constructor(){this.children=[];this.visible=true;}
  add(x){this.children.push(x);}
}
class Mesh {
  constructor(){this.position={};this.scale={x:1,setScalar(v){this.x=v;}};this.children=[];}
  add(x){this.children.push(x);}
}
const elements=new Map();
function element(id){
  if(!elements.has(id))elements.set(id,{id,hidden:false,disabled:false,className:'',textContent:'',
    classList:{remove(){},add(){}},offsetWidth:99});
  return elements.get(id);
}
const context={
  THREE:{Group,Mesh,CylinderGeometry:class{},SphereGeometry:class{},MeshBasicMaterial:class{}},
  document:{getElementById:element},
  ballMesh:new Mesh(),playerRacket:new Mesh(),oppRacket:new Mesh(),
  ballMat:{color:{setHex(){}},emissive:{setHex(){}}},
  BALL_R:.08,trainingActive:false,menuOpen:false,gameState:'play',
  ballPos:{z:1},performance:{now:()=>1100},
  resetOpponentRead(){},scorePoint(scorer,reason){context.scored={scorer,reason};}
};
vm.createContext(context);
vm.runInContext(source.replace(/arcadeInstallUI\(\);\s*$/,''),context);
function evaluate(code){return vm.runInContext(code,context);}

for(const item of [
  ['bigBall',.144,'ballMesh'],
  ['tinyBall',.044,'ballMesh'],
  ['bigRacket',.08,'playerRacket'],
  ['tinyRacket',.08,'oppRacket'],
  ['slippery',.08,null],
  ['paint',.08,null],
  ['pinkFog',.08,null],
  ['bombBall',.08,null],
]){
  const [id,radius,target]=item;
  evaluate('arcadeResetMatch()');
  evaluate(`arcadeUsePower('${id}')`);
  assert.equal(evaluate('arcadePower.used'),true,id);
  assert.equal(evaluate('arcadePower.active'),id,id);
  assert(Math.abs(context.BALL_R-radius)<.0001,id+' collision radius');
  if(target){
    const scale=context[target].scale.x;
    const wanted={bigBall:1.8,tinyBall:.55,bigRacket:1.5,tinyRacket:.55}[id];
    assert.equal(scale,wanted,id+' mesh scale');
  }
  evaluate("arcadeUsePower('bigRacket')");
  assert.equal(evaluate('arcadePower.active'),id,'second use must be ignored');
  if(['slippery','paint','pinkFog'].includes(id)){
    evaluate('arcadeTick(2.1)');
    assert.equal(evaluate('arcadePower.active'),null,id+' expired');
  }
  if(id==='bombBall'){
    evaluate('arcadeTick(9.9)');
    assert.equal(context.scored,undefined,'bomb must not explode early');
    evaluate('arcadeTick(.2)');
    assert.equal(context.scored.scorer,'opponent','bomb on player side');
  }
  evaluate('arcadeResetPoint()');
  assert.equal(evaluate('arcadePower.used'),true,'one use survives rally reset');
  assert.equal(context.BALL_R,.08,'ball radius restores');
}
evaluate('arcadeResetMatch()');
assert.equal(evaluate('arcadePower.used'),false,'new match replenishes one use');
console.log('PASS: eight powers, collision sizes, one-use lock, effect expiry, bomb and match reset');
