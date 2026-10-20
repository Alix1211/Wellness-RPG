"""Extract embedded assets or rebuild the standalone module; Python standard library only."""
from pathlib import Path
import json,base64,sys
root=Path(__file__).resolve().parent
html=root.parent/'minigame-conveyor-batting.html'
assets=root/'assets'
def extract():
 s=html.read_text(encoding='utf-8');assets.mkdir(exist_ok=True)
 for var in ['ASSETS','AUDIO']:
  data,_=json.JSONDecoder().raw_decode(s.split('const '+var+'=',1)[1])
  if var=='AUDIO':(assets/'audio.json').write_text(json.dumps(data),encoding='utf-8');continue
  (assets/'order.json').write_text(json.dumps(list(data)),encoding='utf-8')
  for key,uri in data.items():
   mime,encoded=uri.split(',',1);ext='png' if 'image/png' in mime else 'webp'
   (assets/(key+'.'+ext)).write_bytes(base64.b64decode(encoded))
 print('Extracted assets to',assets)
def build():
 if not (assets/'audio.json').exists():extract()
 data={}
 for ext in ['png','webp']:
  for f in sorted(assets.glob('*.'+ext)):data[f.stem]='data:image/'+ext+';base64,'+base64.b64encode(f.read_bytes()).decode()
 data={key:data[key] for key in json.loads((assets/'order.json').read_text())}
 s=(root/'template.html').read_text(encoding='utf-8').replace('/*ASSETS*/',json.dumps(data)).replace('/*AUDIO*/',(assets/'audio.json').read_text(encoding='utf-8'))
 html.write_text(s,encoding='utf-8');print('Built',html)
if __name__=='__main__':
 if len(sys.argv)>1 and sys.argv[1]=='extract':extract()
 else:build()
