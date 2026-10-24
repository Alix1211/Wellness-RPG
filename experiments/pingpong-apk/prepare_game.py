from pathlib import Path
import re,json,hashlib,shutil
p=Path(__file__).parent;source=p/'game/GAIA-v12.11-1/GAIA-Pingpong-v12.12.html'
s=source.read_text();boot=(p/'native-boot.js').read_text();ui=(p/'native-ui.js').read_text()
skin_names=[f.name for f in sorted((p/'paddle-skins').glob('*.png'))]
assert len(skin_names)==6
skin_urls=['assets/paddles/'+name for name in skin_names]
s=s.replace('function icon(item,large=false){','function icon(item,large=false){if(item?.kind!==\'ball\')return \'<img class="gear-icon \'+(large?\'large\':\'\')+\'" src="\'+GAIA_PADDLE_SKINS[item?.theme||0]+\'" alt="탁구채 스킨">\';',1)
s=s.replace('const p=G.payload(state),data=window.GAIA_MATCH_DATA,','const p=G.payload(state);if(p.racket)p.racket={...p.racket,texture:GAIA_PADDLE_SKINS[p.racket.theme]};const data=window.GAIA_MATCH_DATA,',1)
s=s.replace('const GearModel=(()=>{','const GAIA_PADDLE_SKINS='+json.dumps(skin_urls)+';\nconst GearModel=(()=>{',1)
s=s.replace('<head>','<head><script>'+boot+'</script>',1)
at=s.lastindex if False else s.rfind('save();render();')
assert at>=0;s=s[:at]+ui+'\nsave();render();'+s[at+len('save();render();'):]
# Add only a haptic notification to the match's existing sound function.
anchor='const EMBEDDED_MATCH=';a=s.index(anchor)+len(anchor);m=re.match(r'"(?:[^"\\]|\\.)*"',s[a:]);match=json.loads(m[0])
needle='function playSound(type) {';assert match.count(needle)==1
match=match.replace(needle,needle+"try{parent.GaiaNativeHit?.(type)}catch{}",1)
skin_code="""(()=>{const item=gaiaGearLoad.racket;if(!item?.texture)return;window.GAIA_SKIN_STATUS='loading';new THREE.TextureLoader().load(item.texture,tex=>{tex.encoding=THREE.sRGBEncoding;tex.anisotropy=4;const rim=new THREE.MeshStandardMaterial({color:0xffd6a4,roughness:.65}),face=new THREE.MeshStandardMaterial({map:tex,color:0xffffff,roughness:.65});playerRacket.children[1].material=[rim,face,face];playerRacket.children[2].material=[rim,face,face];window.GAIA_SKIN_STATUS='ready';},undefined,()=>{window.GAIA_SKIN_STATUS='failed'});})();"""
end=match.rfind('</body>');match=match[:end]+'<script>'+skin_code+'</script>'+match[end:]
s=s[:a]+json.dumps(match,ensure_ascii=False).replace('<','\\u003c')+s[a+len(m[0]):]
assets=p/'android/app/src/main/assets/game';assets.mkdir(parents=True,exist_ok=True)
shutil.copytree(source.parent/'assets',assets/'assets',dirs_exist_ok=True)
(assets/'assets/paddles').mkdir(exist_ok=True)
for f in (p/'paddle-skins').glob('*.png'):shutil.copyfile(f,assets/'assets/paddles'/f.name)
(assets/'index.html').write_text(s)
checks={'source':source.name,'source_sha256':hashlib.sha256(source.read_bytes()).hexdigest(),'bundled_sha256':hashlib.sha256(s.encode()).hexdigest(),'native_changes':['early native local mirror','save sync gate and meaningful-change timestamp','vibration option','Drive file connection/status/conflict choices','racket/point haptic notification'],'assets_files':sum(f.is_file() for f in (assets/'assets').rglob('*'))}
(p/'game-preparation.json').write_text(json.dumps(checks,indent=2))
print(json.dumps(checks))
