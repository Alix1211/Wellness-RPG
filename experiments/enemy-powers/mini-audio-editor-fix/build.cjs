const fs=require('fs'),path=require('path');
const base=process.argv[2]||'enemy-input/release/GAIA-Pingpong-v12.11.html';
const out=process.argv[3]||'mini-audio-editor-fix/release/GAIA-Pingpong-v12.11.html';
let html=fs.readFileSync(base,'utf8');
function replace(a,b){if(html.split(a).length!==2)throw Error('Expected one anchor: '+a.slice(0,80));html=html.replace(a,b);}
const source=fs.readFileSync(path.join(__dirname,'mini-audio-editor-fix.js'),'utf8');
replace('const DirectMinigames=(()=>{',source+'\nconst DirectMinigames=(()=>{');
replace("let doc=expand(MINI_DOCS[d.game+'-'+d.stage]);", "let doc=gaiaMiniAudioEditorFix(expand(MINI_DOCS[d.game+'-'+d.stage]),d.game);");
replace("w.MEDIA_BACKGROUND=slot.value!=='bg'||!w.LifeMini.images?.bg;",'w.MEDIA_BACKGROUND=!w.LifeMini.images?.bg;');
fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,html);console.log(out,fs.statSync(out).size);
