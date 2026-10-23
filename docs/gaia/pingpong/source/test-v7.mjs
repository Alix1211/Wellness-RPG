import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {board as originalBoard, fresh, paths as originalPaths} from './model-v2.js';
import {assignTrainingNodes, TRAINING_DATA} from './training-rules.mjs';
import {balanceTourBoard} from './v7-rules.mjs';

const here=path.dirname(fileURLToPath(import.meta.url));
const release=path.join(here,'../release');
const main=fs.readFileSync(path.join(release,'GAIA-Pingpong-v7.html'),'utf8');
const sidecar=fs.readFileSync(path.join(release,'GAIA-Pingpong-v7-Casual.html'),'utf8');
const kinds=['start','blank','train','match','rest','shop','event','cup','final','fork'];
const counts=[];
for(let region=0;region<3;region++){
 const prior=assignTrainingNodes(originalBoard(region),region);
 const before=Object.values(prior).filter(n=>n.kind==='match').length;
 const b=balanceTourBoard(prior,region);
 const values=Object.values(b);
 const count=Object.fromEntries(kinds.map(kind=>[kind,values.filter(n=>n.kind===kind).length]));
 assert.ok(count.match>before,'matches must become more frequent');
 assert.ok(count.blank>=10,'map must have visible free nodes');
 assert.ok(count.rest>=7&&count.shop>=5,'rest and shops remain accessible');
 assert.equal(count.train,[8,12,14][region],'training must not dominate the route');
 assert.deepEqual(new Set(values.filter(n=>n.training).map(n=>n.training.id)),
  new Set(TRAINING_DATA.map(g=>g.id)),'all original mini-games retained');
 assert.ok(values.every(n=>n.next.every(id=>b[id])),'all paths point to valid nodes');
 counts.push(count);
}
// A v6 save can be standing in a training location that v7 turns into a
// blank; that particular training is kept for its pending result only.
const pending=balanceTourBoard(assignTrainingNodes(originalBoard(0),0),0,'25');
assert.equal(pending['25'].kind,'train');
assert.equal(pending['26'].kind,'blank');
// New players can still reach real pingpong by normal card movement.
const freshState=fresh(12345);
assert.ok(originalPaths(freshState,3).some(p=>p.at(-1)==='3'));
assert.equal(balanceTourBoard(assignTrainingNodes(originalBoard(0),0),0)['3'].kind,'match');

assert.match(main,/<title>GAIA · 핑퐁 챔피언 v7<\/title>/);
assert.ok(main.includes('gaia-quick-table')&&main.includes("openGame('match',npc,true)"),
 'real table tennis is directly playable');
assert.ok(main.includes('gaia-tour-blank')&&main.includes('gaia-tour-art'));
assert.ok(main.includes('v7-art-card')&&main.includes('V7_ART'));
assert.ok(!main.includes('__GAIA_PANEL_')&&!main.includes('__PINK_ICONS__'));
assert.ok(main.includes('GAIA-Pingpong-v7-Casual.html'));
assert.ok(main.includes('gaia-pingpong-champion-v2'),'existing saves retained');
assert.ok(main.includes('gaia-tab-medal'),'ornamental region icons retained');
assert.ok(main.includes('gaia-pong-ack'),'mini launch tracks readiness');
assert.ok(sidecar.includes('gaia-pong-ack')&&sidecar.includes('window.GAIA_PONG_TOKEN'));
assert.ok(Buffer.byteLength(sidecar)>80e6,'full old minigame collection kept');
const tag='<script type="module">';
const from=main.indexOf(tag)+tag.length;
const to=main.lastIndexOf('</script>');
assert.ok(from>tag.length&&to>from);
new vm.Script(main.slice(from,to),{filename:'GAIA-Pingpong-v7 inline module'});
assert.equal(fs.statSync(path.join(here,'ui-art/move-cards-user.png')).size>1000,true);
console.log('v7 passed: JS syntax, all 3 regions, 8 training titles each, blank/rest/shop, real match routes, artwork, companion');
console.log(counts.map((n,i)=>`region${i}: matches ${n.match}, training ${n.train}, blanks ${n.blank}, rest ${n.rest}, shop ${n.shop}`).join('\n'));
