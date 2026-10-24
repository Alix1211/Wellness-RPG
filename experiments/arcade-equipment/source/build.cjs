const fs=require('fs'),path=require('path'),vm=require('vm');
const base=process.argv[2]||'tap-image-fix/release/GAIA-Pingpong-v12.11.html',out=process.argv[3]||'item-update/release/GAIA-Pingpong-v12.12.html';
let html=fs.readFileSync(base,'utf8');
function once(a,b){if(html.split(a).length!==2)throw Error('Expected one main anchor: '+a.slice(0,90));html=html.replace(a,b)}
// This update starts a new career as requested. Old storage is left untouched.
once("const SAVE_KEY='gaia-pingpong-champion-v2',OLD_KEY='gaia-pingpong-career-v1';","const SAVE_KEY='gaia-pingpong-champion-items-v1',OLD_KEY='gaia-pingpong-career-v1';");
once("try{state=validate(JSON.parse(localStorage.getItem(SAVE_KEY)));}catch{try{state=validate(migrate(JSON.parse(localStorage.getItem(OLD_KEY))));}catch{state=fresh();}}","try{state=validate(JSON.parse(localStorage.getItem(SAVE_KEY)));}catch{state=fresh();}");
const matchAnchor='const EMBEDDED_MATCH=',begin=html.indexOf(matchAnchor)+matchAnchor.length;
const m=html.slice(begin).match(/^"(?:[^"\\]|\\.)*"/);if(!m)throw Error('Match JSON missing');let match=JSON.parse(m[0]);
function patch(a,b){if(match.split(a).length!==2)throw Error('Expected one match anchor: '+a.slice(0,100));match=match.replace(a,b)}
const config=`const gaiaGearLoad=(()=>{try{return JSON.parse(new URLSearchParams(window.GAIA_BOOT||location.search).get('gear')||'{}')}catch{return {}}})();
const gaiaGearBonus=k=>Math.max(0,Math.min(10,Number(gaiaGearLoad.bonuses?.[k])||0))/100;
`;
patch("function applyBallVisualEffect(effectId = 'normal') {",config+"function applyBallVisualEffect(effectId = 'normal') {");
patch('ballMat.color.setHex(effect.color);',"ballMat.color.setHex(gaiaGearLoad.ball&&/^#[0-9a-f]{6}$/i.test(gaiaGearLoad.ball.color)?parseInt(gaiaGearLoad.ball.color.slice(1),16):effect.color);");
const stats='const careerPlayerStats={speed:careerAbility(careerGrowth[0]),power:careerAbility(careerGrowth[1]),defense:careerAbility(careerGrowth[2]),spin:careerAbility(careerGrowth[3]),accuracy:careerAbility(careerGrowth[3])};';
patch(stats,stats+"\nfor(const [stat,key]of Object.entries({speed:'speed',power:'power',spin:'spin',accuracy:'control'}))careerPlayerStats[stat]*=1+gaiaGearBonus(key);\nif(gaiaGearLoad.ball&&/^#[0-9a-f]{6}$/i.test(gaiaGearLoad.ball.color))ballMat.color.set(gaiaGearLoad.ball.color);\n");
const matchJS=fs.readFileSync(path.join(__dirname,'gear-match.js'),'utf8');
const end=match.lastIndexOf('</body>');match=match.slice(0,end)+'<script>'+matchJS+'</script>'+match.slice(end);
html=html.slice(0,begin)+JSON.stringify(match).replaceAll('<','\\u003c')+html.slice(begin+m[0].length);
const source=['gear-model.js','gear-ui.js'].map(f=>fs.readFileSync(path.join(__dirname,f),'utf8')).join('\n');
const final=html.lastIndexOf('save();render();');if(final<0)throw Error('Boot missing');html=html.slice(0,final)+source+'\nsave();render();'+html.slice(final+'save();render();'.length);
const css=fs.readFileSync(path.join(__dirname,'gear.css'),'utf8');html=html.replace('</head>','<style id="gaia-equipment-style">'+css+'</style></head>');
fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,html);
fs.cpSync('tap-image-fix/release/assets',path.join(path.dirname(out),'assets'),{recursive:true});
console.log(out,fs.statSync(out).size);
