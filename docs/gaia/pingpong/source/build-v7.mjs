import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const sharp=require('sharp');

const here=path.dirname(fileURLToPath(import.meta.url));
const target=path.resolve(process.argv[2]||path.join(here,'../release'));
const read=name=>fs.readFile(path.join(here,name),'utf8');
const readBinary=name=>fs.readFile(path.join(here,name));
let html=await read('GAIA-Pingpong-v2.html');
const rules=(await read('training-rules.mjs')).replace(/^export /gm,'');
const v7rules=(await read('v7-rules.mjs')).replace(/^export /gm,'');
const addon=(await read('training-addon.js'))
 .replace("frame.src='GAIA-Pingpong-v3-Casual.html';","frame.src='GAIA-Pingpong-v7-Casual.html';");
if(!addon.includes("frame.src='GAIA-Pingpong-v7-Casual.html';"))throw Error('Training iframe target not replaced');
const polish=await read('ui-polish-addon.js');
const v7addon=await read('v7-addon.js');
let css=await read('ui-polish.css');
const iconSource=await readBinary('ui-art/pink-icons.png');
css=css.replaceAll('__PINK_ICONS__','data:image/png;base64,'+iconSource.toString('base64'));
for(const [key,file]of Object.entries({
 '__GAIA_PANEL_SQUARE__':'panel-square.png',
 '__GAIA_PANEL_PORTRAIT__':'panel-portrait.png',
 '__GAIA_PANEL_WIDE__':'panel-wide.png'
}))css=css.replaceAll(key,'data:image/png;base64,'+(await readBinary('ui-art/'+file)).toString('base64'));

// Exact cell crops of the designer's own icon and movement-card sheets.
// No repainting, text replacement, or approximate chroma-key cutouts.
const icons={};
for(const [kind,col,row]of [
 ['start',0,0],['fork',1,0],['match',2,0],['cup-local',0,1],
 ['cup-national',1,1],['cup-world',2,1],['event',0,2],
 ['rest',1,3],['shop',2,2]
]){
 const buf=await sharp(iconSource).extract({left:col*362,top:row*362,width:362,height:362}).png().toBuffer();
 icons[kind]='data:image/png;base64,'+buf.toString('base64');
}
const cardSource=await readBinary('ui-art/move-cards-user.png');
const cards={};
for(let row=0;row<2;row++)for(let i=0;i<5;i++){
 const buf=await sharp(cardSource).extract({left:165+i*330,top:row*397,width:330,height:396}).png().toBuffer();
 cards[row+'-'+(i+1)]='data:image/png;base64,'+buf.toString('base64');
}

const marker='save();render();';
const injection=html.lastIndexOf(marker);
if(injection<0||html.indexOf(marker)!==injection)throw Error('Original Pingpong script signature changed.');
const art='const V7_ART='+JSON.stringify({icons,cards}).replaceAll('<','\\u003c')+';\n';
html=html.slice(0,injection)+rules+'\n'+v7rules+'\n'+addon+'\n'+polish+'\n'+art+v7addon+'\n'+html.slice(injection);
const oldSquat=html.indexOf('const EMBEDDED_SQUAT='),next=html.indexOf('const SAVE_KEY=',oldSquat);
if(oldSquat<0||next<oldSquat)throw Error('Expected original embedded game section missing.');
html=html.slice(0,oldSquat)+html.slice(next);
html=html.replace('</style>','\n'+(await read('dist/training.css'))+'\n'+css+'\n'+(await read('v7.css'))+'\n</style>')
 .replace('GAIA · 핑퐁 챔피언</title>','GAIA · 핑퐁 챔피언 v7</title>');

await fs.mkdir(target,{recursive:true});
const oldCasual=await readBinary('../release/GAIA-Pingpong-v3-Casual.html');
if(oldCasual.length<80e6)throw Error('Original GAIA Casual sidecar is missing');
let casual=oldCasual.toString('utf8');
// Acknowledge only once the actual mini-game iframe has loaded, not when the
// outer companion has merely accepted a launch request.
const signature="f.onload=()=>{if(!run||run.id!==token)return;load.hidden=true;";
if(casual.indexOf(signature)<0||casual.indexOf(signature)!==casual.lastIndexOf(signature))throw Error('Casual inner iframe signature changed');
casual=casual.replace(signature,signature+
 "if(window.GAIA_PONG_BRIDGE)parent.postMessage({type:'gaia-pong-ack',token:window.GAIA_PONG_TOKEN,game:id,stage},'*');");
await fs.writeFile(path.join(target,'GAIA-Pingpong-v7-Casual.html'),casual);
await fs.writeFile(path.join(target,'GAIA-Pingpong-v7.html'),html);
console.log('v7 built',Math.round(Buffer.byteLength(html)/1048576)+' MB main',Math.round(Buffer.byteLength(casual)/1048576)+' MB casual');
