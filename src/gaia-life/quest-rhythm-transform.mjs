import {QUEST_RHYTHM_DELTA as D} from './quest-rhythm-data.mjs';

// Deterministic, byte-exact reconstruction of the user's QUEST-RHYTHM HTML
// from the unmodified R60 controls/cast build. Its own quest logic stays intact.
function only(src,before,after){
 const p=src.indexOf(before);
 if(p<0||src.indexOf(before,p+before.length)>=0)throw Error('QUEST-RHYTHM source drift');
 return src.slice(0,p)+after+src.slice(p+before.length);
}
function scripts(src){
 const m=[...src.matchAll(/<script([^>]*)>([\s\S]*?)<\/script\s*>/g)];
 if(m.length!==23)throw Error('Expected R60 23-script source, got '+m.length);
 return m;
}
function scriptReplace(html,index,changes){
 const m=scripts(html)[index],start=m.index+m[0].indexOf(m[2]);
 let text=m[2];
 for(const [before,after] of changes)text=only(text,before,after);
 return html.slice(0,start)+text+html.slice(start+m[2].length);
}
export function fixQuestRhythm(html){
 html=only(html,...D.head);
 html=scriptReplace(html,2,[D.suite]);
 html=scriptReplace(html,17,[D.dialogue]);
 const m=scripts(html)[16],start=m.index+m[0].indexOf(m[2]);
 let host=m[2];
 for(const [before,after] of D.host)host=only(host,before,after);
 html=html.slice(0,start)+D.extra+'</script>\n<script>'+host+html.slice(start+m[2].length);
 return html;
}
