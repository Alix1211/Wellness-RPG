#!/usr/bin/env node
// The same transformation order and hashes as the served index.html.
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fixQuestRhythm} from '../../src/gaia-life/quest-rhythm-transform.mjs';
import {fixLivingCorridors} from '../../src/gaia-life/living-corridors-transform.mjs';
import {fixCohabEnding} from '../../src/gaia-life/cohab-ending-patch.mjs';

if(process.argv.length!==5)throw Error('Usage: node tools/gaia/build-latest.mjs CONTROLS MANIFEST OUTPUT');
const m=JSON.parse(readFileSync(process.argv[3],'utf8'));
let html=readFileSync(process.argv[2],'utf8');
function check(label,size,sha){
 const bytes=Buffer.byteLength(html),digest=createHash('sha256').update(html).digest('hex');
 if(bytes!==size||digest!==sha)throw Error(`${label} checksum: ${bytes} / ${digest}`);
 console.log(label,bytes,digest);
}
check('R60 controls',m.output_size,m.output_sha256);
if(m.quest_transform!=='gaia-quest-rhythm-v1'||m.living_transform!=='gaia-living-corridors-v1'||m.story_transform!=='gaia-cohab-ending-v1')throw Error('Unknown transform sequence');
html=fixQuestRhythm(html);
check('QUEST-RHYTHM original',m.quest_output_size,m.quest_output_sha256);
html=fixLivingCorridors(html);
check('LIVING-CORRIDORS original',m.living_output_size,m.living_output_sha256);
html=fixCohabEnding(html,readFileSync(new URL('../../src/gaia-life/cohab-ending-runtime.js',import.meta.url),'utf8'));
check('LIVING + COHAB/ENDING',m.story_output_size,m.story_output_sha256);
writeFileSync(process.argv[4],html);
