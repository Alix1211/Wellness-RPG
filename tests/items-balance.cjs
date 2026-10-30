// Deterministic, seed-based balance checks for the postgame park loot economy.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'../belt-scroll/js');
const seeded=Object.create(Math);let seed=1029384756;
seeded.random=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};
const s={gold:100000,hp:160,mp:100,itemBag:[],itemEquip:[],itemUidSeq:0};
let world=2;
const ctx={console,Math:seeded,window:null,GAIA:{run:{get:()=>({wl:world})}},DetectiveApp:{state:s,save(){},sync(){}}};
ctx.window=ctx;vm.createContext(ctx);
for(const name of ['items-data.js','items.js'])vm.runInContext(fs.readFileSync(path.join(root,name),'utf8'),ctx);
const {items}=ctx.GAIA,sys=ctx.BeltItems;
const relics=items.list.filter(d=>d.type==='relic');
const tier1=relics.filter(d=>d.tier===1),tier2=relics.filter(d=>d.tier===2),tier3=relics.filter(d=>d.tier===3);
assert.equal(tier1.length,12);assert.equal(tier2.length,8);assert.equal(tier3.length,3);
assert(tier1.every(d=>sys.priceOf(d,1)>=2000&&sys.priceOf(d,1)<=4000));
assert(tier2.every(d=>sys.priceOf(d,1)>=5000&&sys.priceOf(d,1)<=10000));
assert(tier3.every(d=>sys.priceOf(d,1)>=15000));
assert(tier3.every(d=>d.src.length===1&&d.src[0]==='casino'));
assert.equal(sys.sellValue({id:'b00',level:4,origin:'mart'}),items.sell(items.byId.b00),'old cheap mart relics must not create a resale windfall');
const stock=sys.stock(),purchased=new Set();
assert.equal(stock.filter(x=>items.byId[x.id].type==='relic').length,4);
assert(stock.every(x=>!['b14','c06','b18'].includes(x.id)));
for(let i=0;i<4;i++){assert.match(sys.buy(i),/구매 완료/);purchased.add(stock[i].id);assert.match(sys.buy(i),/품절/);}
assert.equal(purchased.size,4);
function countDrops(stage,count=5000){
 let relic=0,other=0;for(let i=0;i<count;i++){
  s.itemBag=[];s.itemEquip=[];
  const got=sys.dropEnemy(false,stage)?.item;
  if(!got)continue;
  const d=items.byId[got.id];
  if(d.type==='relic'){relic++;assert(d.src.includes('drop'),'casino-exclusive relic cannot drop in combat');}
  else other++;
 }
 return {relic,other};
}
const story=countDrops(5),park=countDrops(13);
assert(park.relic>story.relic*3,`park ${park.relic} should beat ordinary map ${story.relic}`);
assert(park.relic<450&&story.relic<130,'ordinary combat must not shower relics');
let highPark=0,highStory=0,extraPark=0,extraStory=0;
world=4;
for(let i=0;i<1000;i++){
 const parkItem=sys.roll('b00','park'),ordinary=sys.roll('b00','drop');
 if(parkItem.quality==='희귀')highPark++;
 if(ordinary.quality==='희귀')highStory++;
 if(Object.keys(parkItem.fx).length>1)extraPark++;
 if(Object.keys(ordinary.fx).length>1)extraStory++;
}
assert(highPark>highStory*3,'park increases rare-quality rolls');
assert(extraPark>extraStory*2,'park increases multiple-effect rolls');
console.log(`PASS prices, one-per-world mart, exclusive relic sources, park drops ${park.relic}/5000 vs story ${story.relic}/5000, rare rolls ${highPark}/1000 vs ${highStory}/1000.`);
