// World progression must belong to a completed story lap, not a stage count.
// Rosie's earned card slots and belongings must survive every new lap.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const base=path.join(__dirname,'../belt-scroll/js');
const script=name=>fs.readFileSync(path.join(base,name),'utf8');

function boot(saved){
 const db=new Map();if(saved)db.set('gaia_detective_alley_campaign_v1',JSON.stringify(saved));
 const dom=new Map();const element=id=>{if(!dom.has(id))dom.set(id,{
  textContent:'',style:{},classList:{toggle(){},add(){},remove(){}},
  appendChild(){},addEventListener(){},querySelector(){return null;},
 });return dom.get(id);};
 const ctx={console,Math,JSON,performance:{now:()=>0},
  localStorage:{getItem:key=>db.get(key)||null,setItem:(key,val)=>db.set(key,val)},
  document:{getElementById:element,createElement:()=>({innerHTML:'',addEventListener(){},classList:{toggle(){}}}),addEventListener(){}},
  BELT_CARDS:[
   {id:'heal',name:'회복',fam:'회복',grade:'일반',price:10,fx:'치유'},
   {id:'hit',name:'공격',fam:'공격',grade:'일반',price:10,fx:'타격'},
   {id:'buff',name:'지원',fam:'버프',grade:'일반',price:10,fx:'강화'},
  ],
 };
 ctx.window=ctx;ctx.GAIA={map:{refresh(){}}};ctx.BeltItems={bonuses:()=>({})};
 vm.createContext(ctx);for(const file of ['campaign.js','app.js','cards.js'])vm.runInContext(script(file),ctx,{filename:file});
 return ctx;
}

const e=boot(),app=e.DetectiveApp,cards=e.BeltCards;
assert.equal(e.GAIA.run.get().wl,1,'a new campaign begins at world 1');
assert.equal(cards.capacity(),2,'initial two card slots');
assert.equal(e.GAIA.run.spotInfo('park').state,'locked','park is post-ending content');
assert.equal(e.GAIA.run.spotInfo('casino').state,'locked','casino is post-ending content');

for(let stage=1;stage<=12;stage++){
 app.result({won:true,stage,hp:160,mp:100,arrests:1,elapsed:50});
 assert.equal(e.GAIA.run.get().wl,1,`stage ${stage} must not raise world level`);
 if(stage===4)assert.equal(cards.capacity(),3,'card slot 3 earned after stage 4');
 if(stage===9)assert.equal(cards.capacity(),4,'card slot 4 earned after stage 9');
}
assert.equal(app.state.endingPending,true,'final boss schedules ending');
assert.equal(e.GAIA.run.spotInfo('district').go,'엔딩 보기','unfinished ending is recoverable on the map');
assert.equal(e.GAIA.run.spotInfo('park').state,'locked','postgame waits until ending');
const money=app.state.gold,stats=JSON.stringify(app.state.stats);
app.state.loadout=['heal','hit','buff','heal'];app.state.cards={heal:6,hit:5,buff:6};
const owned=JSON.stringify(app.state.cards);
assert.equal(app.advanceWorld(),true,'completed ending opens next lap');
assert.equal(e.GAIA.run.get().wl,2);
assert.equal(app.advanceWorld(),false,'cannot increment the same ending twice');
assert.equal(app.state.cardSlots,4,'earned slots remain on Rosie');
assert.equal(cards.capacity(),4,'card capacity ignores reset map');
assert.equal(app.state.gold,money,'gold preserved');
assert.equal(JSON.stringify(app.state.stats),stats,'training preserved');
assert.equal(JSON.stringify(app.state.cards),owned,'owned card quantities preserved');
assert.equal(app.state.loadout.length,4,'equipped cards preserved');
for(let stage=1;stage<=12;stage++)assert.equal(app.state['stage'+stage],false,'story map locks reset');
assert.equal(e.GAIA.run.spotInfo('warehouse').state,'open','new lap starts at alley');
assert.equal(e.GAIA.run.spotInfo('club').state,'locked');
assert.equal(e.GAIA.run.spotInfo('park').state,'open','park opens from world 2');
assert.equal(e.GAIA.run.spotInfo('casino').state,'open','casino opens from world 2');
cards.begin(1);
assert.equal(app.state.loadout.length,4,'a world 2 alley battle retains four card slots');
for(let stage=1;stage<=12;stage++)app.result({won:true,stage,hp:160,mp:100,arrests:0,elapsed:60});
assert.equal(e.GAIA.run.get().wl,2,'world 2 stays fixed until the next ending');
assert.equal(app.advanceWorld(),true,'the second complete lap opens world 3');
assert.equal(e.GAIA.run.get().wl,3);
assert.equal(cards.capacity(),4);

// An older save that finished district before this patch must not be erased.
const prior={version:1,gold:7315,stage12:true,stage9:true,stage4:true,loadout:['heal','hit','buff','heal'],stats:{색기:8,음란도:10,복종도:24,개방성:1},itemBag:[{id:'b00',uid:'gi1'}],itemEquip:['gi1',null,null]};
const migrated=boot(prior).DetectiveApp;
assert.equal(migrated.state.worldLevel,1);
assert.equal(migrated.state.endingPending,true,'legacy completed save can watch the ending');
assert.equal(migrated.state.cardSlots,4);
assert.equal(migrated.advanceWorld(),true);
assert.equal(migrated.state.gold,7315);
assert.equal(migrated.state.itemBag.length,1);
assert.equal(migrated.state.itemEquip[0],'gi1');
assert.equal(migrated.state.stats.복종도,24);
assert.equal(migrated.state.worldLevel,2);

const dialogues=boot();vm.runInContext(script('story-data.js'),dialogues);
assert.equal(dialogues.BeltDialogue.scenes['district.ending'].length,7,'ending dialogue is available');
console.log('PASS world levels advance only after ending, chapter locks reset, park/casino unlock, card slots and player belongings persist, legacy saves migrate.');
