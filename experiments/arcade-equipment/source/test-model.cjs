const assert=require('assert/strict'),fs=require('fs'),G=require('./gear-model.js');
let seed=20261024;const random=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);
const counts=[0,0,0];for(let i=0;i<20000;i++){const x=G.roll({random,id:'item-'+i});assert(G.validItem(x));assert(x.options.every(o=>o.value>0));counts[x.grade]++}for(const[i,p]of [.65,.28,.07].entries())assert(Math.abs(counts[i]/20000-p)<.015);
const s={};let g=G.ensure(s);assert.equal(g.coins,0);assert.throws(()=>G.buy(s),/부족/);
for(let i=0;i<4;i++)G.reward(s,{token:'win-'+i,won:true});assert.equal(g.coins,80);
const item=G.buy(s,{random});assert.equal(g.coins,0);G.equip(s,item.id);assert.equal(g.equipped[item.kind],item.id);
assert.equal(G.reward(s,{token:'win-0',won:true}),null);assert.equal(g.coins,0);
assert.equal(G.reward(s,{token:'quit',won:false,quit:true}),null);assert.equal(g.coins,0);
G.reward(s,{token:'loss',won:false});assert.equal(g.coins,8);
const champions=[];for(let region=0;region<3;region++){const drops=[0,0,0];for(let i=0;i<3000;i++){const x=G.roll({random,id:'champ-'+region+'-'+i,champion:true,region});assert(G.validItem(x));assert(x.grade>=1);assert.equal(x.region,region);drops[x.grade]++}assert(Math.abs(drops[2]/3000-[.2,.3,.4][region])<.035);champions.push({region,drops})}
const keepCoins=g.coins;assert(G.remove(s,item.id));assert.equal(g.coins,keepCoins);assert.equal(g.equipped[item.kind],null);
for(const kind of ['racket','ball']){const x={id:kind,kind,grade:2,theme:0,color:'#ee99aa',region:2,options:[{key:'power',value:6},{key:'spin',value:6},{key:'control',value:6}]};g.items.push(x);G.equip(s,x.id)}assert.deepEqual(G.payload(s).bonuses,{power:10,spin:10,speed:0,control:10});
const restored=JSON.parse(JSON.stringify(s));assert.deepEqual(G.payload(restored),G.payload(s));assert.equal(G.ensure(restored).coins,g.coins);
const expectations=new Map();function games(c){if(c>=80)return 0;if(!expectations.has(c))expectations.set(c,1+.7*games(c+20)+.3*games(c+8));return expectations.get(c)}
const results={draws:20000,gradeCounts:counts,champions,expectedGamesFirstBox:games(0),coinsPerGame:.7*20+.3*8,steadyGamesPerBox:80/(.7*20+.3*8),checks:['insufficient coins','purchase','deduplicated reward','no quit reward','loss coins','positive distinct options','champion drops','discard no refund','cap 10 percent','JSON persistence']};fs.mkdirSync('item-update/qa',{recursive:true});fs.writeFileSync('item-update/qa/model.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results));
