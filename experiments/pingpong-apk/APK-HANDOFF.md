# 최신 버전: 12.12.2

현재 설치·변경·검증은 UPDATE-12.12.2.md를 기준으로 합니다. 아래는 초기 APK 12.12.1의 이력입니다.

# GAIA Pingpong APK 12.12.1 — 2026-10-25 KST

## 결과
- APK: GAIA-Pingpong-v12.12.1.apk
- package: com.gaia.pingpong (Wellness RPG와 별도 앱)
- versionCode: 2026102501, versionName: 12.12.1
- Android 8(API26) 이상 / target API35 / 가로·세로 회전 허용(fullSensor).
- 크기: 70717642 bytes
- SHA256: f829c8686c4611930f9148e2634125e006720158a3d7753ac82f7b85cefada9a

## 기준 자료
최신 완성본 GAIA-v12.12.zip (파일 568개, 72,520,060 bytes) 중 장비 업데이트가 들어 있는 GAIA-Pingpong-v12.12.html 사용. 구형 v12.11 HTML과 source/QA 파일을 APK에 중복 포함하지 않음.
원본 HTML SHA256: 874401d50fdefc652c7b8c7d752b6c85b70d8c2781713d8939f76e7e36f7a8cb.
별도로 주신 gaia_pingpong_paddle_skins_1200.zip 6장도 다시 확보해 1200×1200 PNG 원본 그대로 포함.
기존 장비 능력치·코인·드롭·보상·캐릭터·게임 규칙은 유지.

## 구현
- Android WebView에서 내장 게임/에셋을 오프라인 실행. appassets HTTPS 원점으로 IndexedDB·WebGL·srcdoc 상대 경로 제공.
- ARPG MainActivity의 직접 진동 호출, SAF 문서 연결 및 baseT 동기화 흐름을 탁구용으로 이식.
- 설정에 진동 ON/OFF 추가. 라켓 접촉 18ms, 실점 65ms, 승리 25/30/25ms. 연속 호출 80ms 간격 제한, 백그라운드 취소.
- 설정에 드라이브 파일 연결/지금 동기화/상태 추가. Google 로그인·API 키 없음. Android 문서 선택기 사용.
- 처음은 새 파일 만들기, 다른 기기는 같은 기존 파일 연결. 동시 실시간 플레이 연동을 의미하지 않음.
- 저장은 WebView localStorage와 앱 내부 store에 함께 보관. 클라우드 연결 URI는 백업에 넣지 않음.
- 저장 시각끼리 겨루지 않고 마지막 맞춘 baseT와 로컬/파일 변경을 비교. 양쪽 변경·기준 불명은 선택창으로 확인. 자동 덮어쓰기 안 함.
- 시작·복귀·네트워크 복구에 파일 재확인. 저장 자체는 확인 후 쓰기만 함. 읽기 실패 시 파일 유지, 빈/깨진 파일은 유효한 기기 저장으로 복구. 다른 게임의 정상 JSON을 선택한 경우는 쓰지 않고 중단.
- 동기화/선택 중 게임 저장 차단. 대기 중 변경은 종료 후 다시 저장. 복원 시 timestamp 보존.
- 유휴 플레이 시간만 늘어나는 자동 저장은 동기화 t를 올리지 않음. 실제 게임 진행·코인·장비 등 내용 변경 시만 t 증가.
- 백그라운드 진입 시 게임 일시정지/저장, 복귀 시 필요 시 재개.
- Android 파일 선택기 및 MP4 폴더 선택 지원: 하위 6단계, 최대 500 MP4. 선택한 파일은 기존 IndexedDB 코드에서 보관.
- 스킨 6종은 보관함 아이콘과 미주 라켓 텍스처에 연결. PNG 크롭·재생성·색 변경 없음. 상대 라켓과 공 능력치 미변경.
- 뒤로 버튼: 열린 게임 창 처리, 경기 일시정지, 일반 화면에서는 앱 메뉴. 메뉴에서 설정/저장 연동 또는 종료.

## 저장 범위
기존 브라우저 진행 자동 이관 없음. 사용자 지시대로 APK에서 새로 시작.
Drive JSON에 진행·장비·코인 포함. 선택한 MP4 등 IndexedDB 원본 미디어는 이 JSON에 포함되지 않으므로 기기마다 별도 선택 필요.
동일 패키지+서명 APK 업데이트는 앱 데이터 유지. 앱 삭제/데이터 삭제는 로컬 진행을 지움.

## 검증 완료
- Java compile → D8 dex → aapt2 → zipalign → apksigner 빌드.
- APK v2/v3 서명·zipalign 검증, ZIP CRC 및 내장 HTML/532개 에셋 바이트 일치 검사.
- JVM 실제 네이티브 메서드 검사: 초기 충돌, 로컬만/파일만/양쪽 변경, 동일, 파일/로컬 부재, 빈·깨진 파일, 다른 게임 JSON 보호, 진동 타이밍, 탁구 저장 스키마.
- Node VM 검사: 유휴 시간 증가 시 t 유지, 실제 코인 변경 시 t 증가, sync 중 저장 차단, 대기한 저장 재반영, 진동 OFF/ON, 복원 timestamp 보존.
- 실제 내장 HTML과 embedded match의 인라인 JavaScript 구문 검사 통과.

## 미확인
실제 Android 설치·실행, 기기별 WebView GPU/터치/회전, 실제 진동 모터, Google Drive 제공자의 업로드 지연/문서 선택기, MP4 폴더 반환, 모든 미니게임 완주는 아직 실기기 미검증.
이전 브라우저 검증과 이번 APK 빌드 검증을 실기기 검증으로 보고하지 않음.
효과음·배경음 별도 슬라이더는 받은 완성본에 없고 이번 APK에도 추가하지 않음. 현재 소리 켜기/끄기와 새 진동 설정 제공.
자동 온라인 게임 업데이트는 없음. 게임 변경은 동일 서명 APK로 다시 빌드.

## 서명 키
새 탁구 앱의 첫 키를 생성. alias gaia-pingpong / PKCS12 / RSA3072.
인증서 SHA256: e1f0baf36f7f7f81a77a1892d10f000b9a165b90666879dac8cd289ef2a852e9.
GAIA-Pingpong-Signing-Backup.zip은 개인 보관용이며 GitHub에 올리지 않음.
업데이트 빌드는 반드시 같은 키·비밀번호 파일을 private/에 복원. 키가 없으면 build_apk.py가 중단하며, 최초 빌드만 --first-build 허용.

## 재현 소스
android/app/src/main/java/com/gaia/pingpong/MainActivity.java
android/app/src/main/AndroidManifest.xml, drawable/ic_launcher.xml
native-boot.js, native-ui.js, prepare_game.py, build_apk.py
NativeCoreTest.java, test-native-js.cjs, test-native-js.json, game-preparation.json, build-result.json
소스는 별도 브랜치/폴더에 기록. main과 Wellness Android 앱은 변경하지 않음.
