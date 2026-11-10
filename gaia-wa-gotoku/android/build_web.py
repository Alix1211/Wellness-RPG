#!/usr/bin/env python3
"""벨트스크롤 게임 파일을 APK 안에 넣을 묶음(android/web)으로 만든다.
앱 주소 /assets/ 아래에 index.html, style.css, js/, assets/ 가 그대로 놓인다(게임이 부르는 상대 경로와 같다)."""
import json, base64, mimetypes, shutil, hashlib, os, subprocess
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


# 자동 업데이트 대상에서 빼는 파일: 미니게임 묶음(앱 안 것을 항상 사용), 목록 파일 자신.
NO_UPDATE = {'js/mini-assets.js', 'bundled_files.json', 'update.json'}


def sha(p):
    return hashlib.sha256(p.read_bytes()).hexdigest()


def make_update_manifest():
    """android/web 의 모든 파일 해시 목록을 만든다.
     - web/bundled_files.json : 이 APK 안에 들어 있는 파일들의 해시(앱이 '바뀐 것만' 받기 위한 기준)
     - android/update.json    : 최신 게임 파일 해시 목록 + 버전(커밋). 릴리스에 올라가 앱이 켜질 때 읽는다."""
    files = {}
    for f in sorted(OUT.rglob('*')):
        if f.is_file():
            rel = f.relative_to(OUT).as_posix()
            if rel not in NO_UPDATE:
                files[rel] = sha(f)
    (OUT / 'bundled_files.json').write_text(json.dumps(files, ensure_ascii=False))
    ver = os.environ.get('GITHUB_SHA') or subprocess.run(['git', 'rev-parse', 'HEAD'], cwd=GAME, capture_output=True, text=True).stdout.strip()
    (OUT.parent / 'update.json').write_text(json.dumps({'version': ver, 'files': files}, ensure_ascii=False))
    print('업데이트 목록', len(files), '개 파일, 버전', ver[:8])


def main():
    make_mini_assets()
    if OUT.exists():
        shutil.rmtree(OUT)
    OUT.mkdir(parents=True)
    for name in ['index.html', 'style.css']:
        shutil.copy2(GAME / name, OUT / name)
    shutil.copytree(GAME / 'js', OUT / 'js')
    shutil.copytree(GAME / 'assets', OUT / 'assets')
    make_update_manifest()
    total = sum(f.stat().st_size for f in OUT.rglob('*') if f.is_file())
    print('web 묶음 완료', round(total / 1e6, 1), 'MB')


if __name__ == '__main__':
    main()
