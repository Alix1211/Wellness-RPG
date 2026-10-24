# GAIA Pingpong Android · 12.12.2

개인 설치 테스트용 APK. Android 8 이상, 가로/세로 회전 지원.
기존 앱을 지우지 않고 업데이트 APK를 덮어설치하세요. 모든 화면 우상단 설정에서 배경음/효과음 음량, 진동과 저장 연결을 사용합니다.

최신 변경·검증은 UPDATE-12.12.2.md를 확인하세요.

## 드라이브 저장
첫 기기: 설정 → 드라이브 파일 연결 → 새 파일 만들기.
다른 기기: 설정 → 드라이브 파일 연결 → 기존 파일 연결 → 같은 파일 선택.
두 기기 모두 진행했다면 선택창에서 이어갈 진행을 고릅니다.
연결 파일은 gaia-pingpong-save.json이며 진행/장비/코인을 포함합니다. 커스텀 MP4는 별도입니다.

## 빌드
Java17(compiler 모듈), Python3, Android platform35 및 build-tools35.0.0 필요.
이 폴더의 sdk/android-35/android.jar, sdk/android-15/에 SDK 압축 파일 내용을 놓습니다.
GAIA-v12.12.zip을 game/으로 풀어 game/GAIA-v12.11-1/GAIA-Pingpong-v12.12.html 및 assets가 있도록 놓습니다.
스킨 ZIP은 paddle-skins/에 풀어 6 PNG를 놓습니다.
private/에 개인 서명 백업의 키와 비밀번호를 복원한 뒤 실행:

```sh
python3 prepare_game.py
python3 build_apk.py
```

최초 앱만 --first-build로 새 키 생성. 기존 앱 업데이트 시 새 키 생성 금지.
키/비밀번호/개인 세이브를 GitHub에 올리지 마세요.
APK 결과는 build/GAIA-Pingpong-v12.12.2.apk. 세부 검증 및 미확인 사항은 APK-HANDOFF.md.
