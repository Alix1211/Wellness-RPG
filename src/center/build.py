"""Build an offline single-file center; source images remain unmodified."""
from pathlib import Path
import base64,json,hashlib,runpy
ROOT=Path(__file__).resolve().parents[2]
legacy=ROOT/'src/minigames/legacy-wellness'
def data(path):
 ext=path.suffix.lower();mime={'.webp':'image/webp','.png':'image/png','.ogg':'audio/ogg'}[ext]
 return 'data:'+mime+';base64,'+base64.b64encode(path.read_bytes()).decode()
assets={}
for path in legacy.rglob('*'):
 if path.is_file() and path.suffix in ['.webp','.png','.ogg']:assets[path.relative_to(legacy).as_posix()]=data(path)
source={key:(legacy/path).read_text() for key,path in [('main','minigames.js'),('behind','minigame_behind.js'),('fetch','fetch-game.js'),('matter','vendor/matter.min.js')]}
prepared=ROOT/'src/center/prepared-assets.json'
sprites=ROOT/'src/center/sprite-manifest.json'
def script(s):return '<script>'+s.replace('</script','<\\/script')+'</script>'
prepared_data=json.loads(prepared.read_text())
for path in sorted((ROOT/'assets/backgrounds/home').glob('*.webp')):prepared_data['bg/home/'+path.stem]=data(path)
bundle=script('const ART='+json.dumps(prepared_data,ensure_ascii=False)+';const SPRITES='+sprites.read_text()+';const MINI_ASSETS='+json.dumps(assets,ensure_ascii=False)+';const MINI_SOURCE='+json.dumps(source,ensure_ascii=False)+';')
bundle+=script('const NPC_ART='+(ROOT/'src/center/npc-assets.json').read_text()+';const NPC_MANIFEST='+(ROOT/'src/center/npc-manifest.json').read_text()+';')
suite=runpy.run_path(str(ROOT/'src/minigames/life-suite/build.py'))['document']({'template':True})
bundle+=script('const SUITE_DOCUMENT='+json.dumps(suite,ensure_ascii=False)+';')
bundle+=script('const PORTRAITS='+json.dumps({p.stem:data(p) for p in (ROOT/'assets/characters/portraits/defaults-v8').glob('*.webp')})+';')
bundle+=script((ROOT/'src/center/media.js').read_text())
bundle+=script((ROOT/'src/center/model.js').read_text())+script((ROOT/'src/center/life.js').read_text())+script((ROOT/'src/center/gallery.js').read_text())+script((ROOT/'src/center/app.js').read_text())
license=(legacy/'vendor/MATTER-LICENSE.txt').read_text()
out=(ROOT/'src/center/shell.html').read_text().replace('<!--BUNDLES-->',bundle)
out=out.replace('<html lang="ko">','<html lang="ko"><!--\nMatter.js license\n'+license+'\n--> ',1)
(ROOT/'index.html').write_text(out)
print('Built',ROOT/'index.html',len(out.encode()),'bytes')

