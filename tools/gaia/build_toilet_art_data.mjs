#!/usr/bin/env node
// Preserve the four user-uploaded tile images byte-for-byte in the build source.
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

const args=process.argv.slice(2);
if(args.length!==4)throw Error('Usage: node build_toilet_art_data.mjs IMAGE1 IMAGE2 IMAGE3 IMAGE4');
const images={};
for(let i=0;i<args.length;i++){
 const raw=readFileSync(args[i]);
 const jpeg=raw[0]===0xff&&raw[1]===0xd8&&raw[2]===0xff;
 const png=raw.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
 if(!jpeg&&!png)throw Error('Not an original PNG/JPEG: '+args[i]);
 images['tile'+i]='data:image/'+(jpeg?'jpeg':'png')+';base64,'+raw.toString('base64');
 console.log('화장실 그림 '+(i+1),raw.length,createHash('sha256').update(raw).digest('hex'));
}
writeFileSync(new URL('../../src/gaia-life/toilet-art-data.mjs',import.meta.url),
 '/* User-provided original images, unmodified pixels; tile0..tile3. */\n'
 +'export const GAIA_TOILET_IMAGES='+JSON.stringify(images)+';\n');
