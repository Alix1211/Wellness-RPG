import {GAIA_TOILET_IMAGES} from './toilet-art-data.mjs';

// Modify only the water-game's missing four default tile slots, leaving
// movement, scoring, dialogue and local user image overrides unchanged.
export function fixToiletTiles(html){
 const scripts=[...html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script\s*>/g)];
 if(scripts.length!==25)throw Error('Expected latest LIVING/COHAB 25-script game');
 const m=scripts[2],start=m.index+m[0].indexOf(m[2]);
 const before='async function loadArt(){';
 if(m[2].split(before).length!==2)throw Error('Missing unique water tile loader');
 const pairs=Object.entries(GAIA_TOILET_IMAGES);
 if(pairs.length!==4||pairs.some(([id,src],i)=>id!=='tile'+i||!src.startsWith('data:image/')))throw Error('Four original tile images required');
 const code="if(kind==='water')await Promise.all("+JSON.stringify(pairs)+".map(([id,url])=>decode(id,url).catch(()=>{})));";
 // SUITE_DOCUMENT is a JS string literal. Escape this insertion once so the
 // inner iframe receives unescaped, valid code with its original image bytes.
 const escaped=JSON.stringify(code).slice(1,-1);
 const updated=m[2].replace(before,before+escaped);
 return html.slice(0,start)+updated+html.slice(start+m[2].length);
}
