const fs=require('fs'),path=require('path');
const base=process.argv[2]||'cylinder-video-fix/release/GAIA-Pingpong-v12.11.html',out=process.argv[3]||'dialogue-feather-fix/release/GAIA-Pingpong-v12.11.html';
let html=fs.readFileSync(base,'utf8');
const css=fs.readFileSync(path.join(__dirname,'dialogue-feather.css'),'utf8'),js=fs.readFileSync(path.join(__dirname,'dialogue-feather.js'),'utf8');
if(html.includes('id="gaia-dialogue-feather"'))throw Error('Already patched');
html=html.replace('</head>','<style id="gaia-dialogue-feather">'+css+'</style></head>');
const end=html.lastIndexOf('</body>');if(end<0)throw Error('Body missing');html=html.slice(0,end)+'<script>'+js+'</script>'+html.slice(end);
fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,html);
