import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url));
const target=path.resolve(process.argv[2]||path.join(here,'../release'));
let html=await fs.readFile(path.join(here,'GAIA-Pingpong-v2.html'),'utf8');
const rules=(await fs.readFile(path.join(here,'training-rules.mjs'),'utf8')).replace(/^export /gm,'');
const addon=await fs.readFile(path.join(here,'training-addon.js'),'utf8');
const css=await fs.readFile(path.join(here,'dist/training.css'),'utf8');
const marker='save();render();';
const injection=html.lastIndexOf(marker);
if(injection<0||html.indexOf(marker)!==injection)throw Error('Original Pingpong script signature changed.');
html=html.slice(0,injection)+rules+'\n'+addon+'\n'+html.slice(injection);
const oldSquat=html.indexOf('const EMBEDDED_SQUAT='),next=html.indexOf('const SAVE_KEY=',oldSquat);
if(oldSquat<0||next<oldSquat)throw Error('Expected v2 embedded squat block missing.');
html=html.slice(0,oldSquat)+html.slice(next);
html=html.replace('</style>','\n'+css+'\n</style>')
 .replace('GAIA · 핑퐁 챔피언</title>','GAIA · 핑퐁 챔피언 v5</title>')
 .replace('CHAMPION · MVP 02','CHAMPION · MVP 05');
await fs.mkdir(target,{recursive:true});
const companion=path.join(target,'GAIA-Pingpong-v3-Casual.html');
if((await fs.stat(companion)).size<80e6)throw Error('The original GAIA CASUAL minigame sidecar is missing.');
const output=path.join(target,'GAIA-Pingpong-v5.html');
await fs.writeFile(output,html);
console.log(output+' '+(Buffer.byteLength(html)/1048576).toFixed(1)+' MiB');
