"""Build a shared, square minigame host. Art is local and independent of hit geometry."""
from pathlib import Path
import json
HERE=Path(__file__).parent

def document(config=None):
 config=config or {'kind':'water','roomId':'standalone','audio':[]}
 html='''<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>GAIA · 미니게임</title><style>STYLE</style><div id="app"><header class="hud"><strong class="title" id="name"></strong><div class="stats"><span id="time"></span><span id="score"></span></div></header><div class="play"><canvas width="720" height="720" aria-label="터치로 조작하는 미니게임"></canvas><div class="overlay" id="overlay"><h2 id="heading"></h2><p id="body"></p><button id="start"></button></div><section id="settings" hidden><h3>그림 변경</h3><select id="slot" aria-label="교체할 그림"></select><input id="upload" type="file" accept="image/*" aria-label="이미지 선택"><button id="restore">기본 그림으로</button><p>이 기기에만 저장됩니다. 그림을 바꿔도 입구와 판정 위치는 유지됩니다.</p><div id="notice" role="status"></div><button id="settingsClose">닫기</button></section></div><nav class="toolbar"><button id="pause">일시정지</button><button id="retry">다시 하기</button><button id="sound">소리 켬</button><button id="art">그림 변경</button></nav></div>SCRIPTS</html>'''
 def script(s):return '<script>'+s.replace('</script','<\\/script')+'</script>'
 return html.replace('STYLE',(HERE/'style.css').read_text()).replace('SCRIPTS',script('const GAME_CONFIG='+('/*LIFE_CONFIG*/' if config.get('template') else json.dumps(config,ensure_ascii=False))+';')+script((HERE/'models.js').read_text())+script((HERE/'game.js').read_text()))
if __name__=='__main__':
 root=HERE.parents[2]
 for kind in ['water','rope','cylinder']:
  path=root/'tests'/('life-'+kind+'.html');path.write_text(document({'kind':kind,'roomId':'standalone','audio':[]}));print(path)
