// Check original GAIA Detective inventory assets map to all 10 new consumable cards.
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const context={};context.window=context;vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(root,'belt-scroll/js/cards-data.js'),'utf8'),context);
const names={a18:'드림 오일',a20:'러브 글라이드',a21:'방긋 향초',b10:'하트 테이프',c12:'간지럼 깃털',c13:'분홍 하트 집게',c14:'펌프 보틀',c15:'튜브 로션',c16:'하트 향초',c17:'리본 테이프'};
for(const [id,name] of Object.entries(names)){
 const card=context.BELT_CARDS.find(c=>c.id===id);
 assert(card,`missing item ${id}`);assert.equal(card.name,name);
 assert.equal(card.img,`assets/cards/items/${id}.webp`);
 const source=fs.readFileSync(path.join(root,`assets/gaia-detective/ui/items/${id}.webp`));
 const target=fs.readFileSync(path.join(root,'belt-scroll',card.img));
 assert(target.equals(source),`item ${id} differs from the exact original market image`);
}
assert.equal(context.BELT_CARDS.filter(c=>c.item).length,10);
console.log('PASS all 10 item cards use byte-identical original GAIA Detective mart images');
