import {LIVING_CORRIDORS_DELTA as D} from './living-corridors-data.mjs';

// Apply the user's supplied script verbatim on top of QUEST-RHYTHM.
function only(source,before,after){
 const at=source.indexOf(before);
 if(at<0||source.indexOf(before,at+before.length)>=0)throw Error('LIVING-CORRIDORS source drift');
 return source.slice(0,at)+after+source.slice(at+before.length);
}
export function fixLivingCorridors(html){
 const scripts=[...html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script\s*>/g)];
 if(scripts.length!==24)throw Error('LIVING-CORRIDORS requires 24-script QUEST-RHYTHM');
 const m=scripts[17],start=m.index+m[0].indexOf(m[2]);
 let host=m[2];
 for(const [before,after] of D.host)host=only(host,before,after);
 return html.slice(0,start)+D.extra+'</script>\n<script>'+host+html.slice(start+m[2].length);
}
