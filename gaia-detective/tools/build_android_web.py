#!/usr/bin/env python3
"""안드로이드 앱용 게임 파일 묶음을 만든다.
 - android/web/        : APK 안에 들어가는 게임 전체(코드 + 그림·소리). 앱의 /assets/ 주소로 열린다.
 - detective-web.zip   : 온라인 업데이트용 코드 묶음(html/js/css/json 만). 그림·소리는 해시로만 적어 두고 앱이 필요할 때 받는다.
 - android/web/bundled_media.json : APK 에 들어 있는 그림·소리의 해시 목록(업데이트 때 바뀐 것만 받기 위함).
모든 경로는 '앱 주소 기준'이다: index.html, js/..., gaia-detective/<그림·소리>, audio/<효과음>.
(게임 코드가 '../assets/gaia-detective/..' 로 부르므로 앱 주소 /assets/index.html 에서 /assets/gaia-detective/.. 로 맞는다)
"""
import os, sys, json, hashlib, shutil, zipfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
GAME = HERE.parent                      # gaia-detective/
REPO = GAME.parent                      # 저장소 루트
OUT = GAME / 'android' / 'web'
ZIP = REPO / 'detective-web.zip'
ASSET = REPO / 'assets'
CODE_EXT = {'.html', '.js', '.css', '.json'}

# 앱에 넣는 그림·소리 폴더(assets/gaia-detective/ 아래). 시트 원본·작업용 폴더는 제외.
MEDIA_DIRS = ['bg', 'cards', 'enemies', 'game', 'map/layers', 'minigame/batting_police', 'minigame/squat_home',
              'place', 'sfx', 'ui/bubbles', 'ui/card', 'ui/clerk', 'ui/fx', 'ui/icons', 'ui/items', 'ui/skin', 'ui/slot']
MEDIA_FILES = ['npc/police/police_2.webp', 'npc/police/police_4.webp']
EXTRA = [('audio/freesound_community-face-punch-91909.mp3', ASSET / 'audio' / 'freesound_community-face-punch-91909.mp3')]
SKIP_PARTS = {'_src', 'incoming', '__pycache__'}


def sha(p: Path) -> str:
    return hashlib.sha256(p.read_bytes()).hexdigest()


def main():
    if OUT.exists():
        shutil.rmtree(OUT)
    OUT.mkdir(parents=True)
    code, media = [], {}

    # 1) 게임 코드: index.html, style.css, js/, data/
    for rel in ['index.html', 'style.css']:
        code.append((GAME / rel, rel))
    for sub in ['js', 'data']:
        for p in sorted((GAME / sub).rglob('*')):
            if p.is_file() and p.suffix in CODE_EXT:
                code.append((p, p.relative_to(GAME).as_posix()))

    # 2) 그림·소리
    gd = ASSET / 'gaia-detective'
    files = []
    for d in MEDIA_DIRS:
        for p in sorted((gd / d).rglob('*')):
            if p.is_file() and not (set(p.relative_to(gd).parts) & SKIP_PARTS) and p.name != 'README.md':
                files.append((p, 'gaia-detective/' + p.relative_to(gd).as_posix()))
    for rel in MEDIA_FILES:
        files.append((gd / rel, 'gaia-detective/' + rel))
    for rel, p in EXTRA:
        files.append((p, rel))
    for p, name in files:
        if p.suffix in CODE_EXT:            # 미니게임 문서(game.html)는 코드로 취급 → 업데이트에 포함
            code.append((p, name))
        else:
            media[name] = sha(p)

    for p, name in code + [(p, n) for p, n in files if n in media]:
        dst = OUT / name
        dst.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(p, dst)

    version = os.environ.get('GITHUB_SHA', 'local' + '0' * 35)[:40].ljust(40, '0')
    manifest = json.dumps({'version': version, 'media': media}, separators=(',', ':'))
    (OUT / 'bundled_media.json').write_text(manifest)
    with zipfile.ZipFile(ZIP, 'w', zipfile.ZIP_DEFLATED) as z:
        for p, name in code:
            z.write(p, name)
        z.writestr('update.json', manifest)
    total = sum(f.stat().st_size for f in OUT.rglob('*') if f.is_file())
    print('앱 묶음: 코드 %d개, 그림·소리 %d개, 합계 %.1fMB / 업데이트 zip %.2fMB' % (len(code), len(media), total / 1e6, ZIP.stat().st_size / 1e6))


if __name__ == '__main__':
    sys.exit(main())
