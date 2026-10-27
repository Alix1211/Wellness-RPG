#!/usr/bin/env python3
"""벨트스크롤 게임 파일을 APK 안에 넣을 묶음(android/web)으로 만든다.
앱 주소 /assets/ 아래에 index.html, style.css, js/, assets/ 가 그대로 놓인다(게임이 부르는 상대 경로와 같다)."""
import json, base64, mimetypes, shutil
from pathlib import Path

GAME = Path(__file__).resolve().parent.parent      # belt-scroll/
OUT = Path(__file__).resolve().parent / 'web'


def make_mini_assets():
    # build_portable.py 의 mini_assets() 와 같은 내용: 미니게임 문서·소리를 js/mini-assets.js 로 묶는다.
    m = {}
    files = sorted((GAME / 'assets/minigame').rglob('*')) + sorted((GAME / 'assets/place').glob('*'))
    for p in files:
        if not p.is_file():
            continue
        rel = p.relative_to(GAME / 'assets').as_posix()
        if p.suffix == '.html':
            m[rel] = p.read_text()
        else:
            mime = 'audio/ogg' if p.suffix == '.ogg' else (mimetypes.guess_type(p.name)[0] or 'audio/ogg')
            m[rel] = 'data:' + mime + ';base64,' + base64.b64encode(p.read_bytes()).decode()
    (GAME / 'js/mini-assets.js').write_text(
        'window.MINI_ASSETS=' + json.dumps(m, ensure_ascii=False).replace('</', '<\\/') + ';')


def main():
    make_mini_assets()
    if OUT.exists():
        shutil.rmtree(OUT)
    OUT.mkdir(parents=True)
    for name in ['index.html', 'style.css']:
        shutil.copy2(GAME / name, OUT / name)
    shutil.copytree(GAME / 'js', OUT / 'js')
    shutil.copytree(GAME / 'assets', OUT / 'assets')
    total = sum(f.stat().st_size for f in OUT.rglob('*') if f.is_file())
    print('web 묶음 완료', round(total / 1e6, 1), 'MB')


if __name__ == '__main__':
    main()
