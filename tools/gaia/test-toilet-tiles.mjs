#!/usr/bin/env node
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
import {GAIA_TOILET_IMAGES as IMAGES} from '../../src/gaia-life/toilet-art-data.mjs';
import {fixToiletTiles} from '../../src/gaia-life/toilet-art-transform.mjs';
import {fixQuestRhythm} from '../../src/gaia-life/quest-rhythm-transform.mjs';
import {fixLivingCorridors} from '../../src/gaia-life/living-corridors-transform.mjs';
import {fixCohabEnding} from '../../src/gaia-life/cohab-ending-patch.mjs';

const hashes=[
 '5ffe214d87c69af3b98c6317d0aec8a2f8cec5a528012663fbb166d4d5f1ca10',
 'f2cb71a42b6c9e6aa754d34fbec504e20b316af001827ea21fbffcacbacd6a4b',
 '9d33c5c48f71d18ab215df92b722a081c711e4ea0a95d1f53e524871d7a665b5',
 'c9460fe5f9faf95a06a9875ea36904f30b1ef665814d23546f03e59a74a07c2a',
];
for(let i=0;i<4;i++){
 const raw=Buffer.from(IMAGES['tile'+i].split(',')[1],'base64');
 assert.equal(createHash('sha256').update(raw).digest('hex'),hashes[i],'verbatim source image '+(i+1));
}
let before=fixLivingCorridors(fixQuestRhythm(readFileSync('GAIA-LIFE-R60-CONTROLS.html','utf8')));
before=fixCohabEnding(before,readFileSync('src/gaia-life/cohab-ending-runtime.js','utf8'));
const after=fixToiletTiles(before);
const getScripts=html=>[...html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script\s*>/g)].map(m=>m[2]);
const b=getScripts(before),a=getScripts(after);
assert.equal(a.length,25);
for(let i=0;i<a.length;i++){
 new vm.Script(a[i]);
 if(i!==2)assert.equal(a[i],b[i],'unchanged game script '+i);
}
const document=vm.runInNewContext(a[2]+'\nSUITE_DOCUMENT').replace('/*LIFE_CONFIG*/','{kind:"water",water:{level:2}}');
for(const image of Object.values(IMAGES))assert.ok(document.includes(image),'tile image is included in water game');
for(const src of getScripts(document))new vm.Script(src);
assert.ok(document.includes("decode(id,url)"));
const m=JSON.parse(readFileSync('builds/gaia-life-20261020/manifest.json','utf8'));
assert.equal(Buffer.byteLength(after),m.toilet_output_size);
assert.equal(createHash('sha256').update(after).digest('hex'),m.toilet_output_sha256);
console.log('PASS: four original images, exact game scripts, water scene, final checksum');
