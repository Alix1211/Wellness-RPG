import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const target=path.resolve(process.argv[2]||path.join(here,'../release'));
const read=name=>fs.readFile(path.join(here,name),'utf8');
let html=await read('GAIA-Pingpong-v2.html');
const rules=(await read('training-rules.mjs')).replace(/^export /gm,'');
const addon=await read('training-addon.js');
const polish=await read('ui-polish-addon.js');
const css=await read('dist/training.css');
let polishCss=await read('ui-polish.css');
const icon=(await fs.readFile(path.join(here,'ui-art/pink-icons.png'))).toString('base64');
polishCss=polishCss.replaceAll('__PINK_ICONS__','data:image/png;base64,'+icon);
// Precisely cropped, unredesigned frames from the original 3-panel PNG.
const plates={
 '__GAIA_PANEL_SQUARE__':'panel-square.png',
 '__GAIA_PANEL_PORTRAIT__':'panel-portrait.png',
 '__GAIA_PANEL_WIDE__':'panel-wide.png'
};
for(const [placeholder,file] of Object.entries(plates)){
 const buffer=await fs.readFile(path.join(here,'ui-art',file));
 polishCss=polishCss.replaceAll(placeholder,'data:image/png;base64,'+buffer.toString('base64'));
}
const marker='save();render();';
const injection=html.lastIndexOf(marker);
if(injection<0||html.indexOf(marker)!==injection)throw Error('Original Pingpong script signature changed.');
html=html.slice(0,injection)+rules+'\n'+addon+'\n'+polish+'\n'+html.slice(injection);
const oldSquat=html.indexOf('const EMBEDDED_SQUAT='),next=html.indexOf('const SAVE_KEY=',oldSquat);
if(oldSquat<0||next<oldSquat)throw Error('Expected v2 embedded squat block missing.');
html=html.slice(0,oldSquat)+html.slice(next);
html=html.replace('</style>','\n'+css+'\n'+polishCss+'\n</style>')
 .replace('GAIA · 핑퐁 챔피언</title>','GAIA · 핑퐁 챔피언 v6</title>')
 .replace('CHAMPION · MVP 02','CHAMPION · v6');
await fs.mkdir(target,{recursive:true});
const companion=path.join(target,'GAIA-Pingpong-v3-Casual.html');
if((await fs.stat(companion)).size<80e6)throw Error('Original GAIA CASUAL mini-game companion missing.');
const output=path.join(target,'GAIA-Pingpong-v6.html');
await fs.writeFile(output,html);
console.log(output+' '+(Buffer.byteLength(html)/1048576).toFixed(1)+' MiB');
