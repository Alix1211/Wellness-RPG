# GAIA CITY — CASUAL-06 · 일반 BGM 충돌 수정 · 2026-10-22

사용자 보고: 일반 BGM이 계속 흘러 스쿼트 고유 음악이 들리지 않음.

- 재현 원인: 원래 RPG의 GaiaBGM은 GameHost.mode()만 보고 600ms 간격 및 pointer/message에서 재생을 재개함. 캐주얼 호스트는 mode=casual이므로 게임 중이라고 인식하지 못했음.
- 기존 BGM sync에 GaiaCasual.run 및 GaiaCasual.state.sound를 반영. 게임 중(준비/편집/일시정지 포함)에는 일반 BGM 정지, 메뉴에서만 재생. 게임 진입/메뉴 복귀/결과/소리 변경에 즉시 sync 호출해 타이머를 기다리지 않음.
- 스쿼트 자체 BGM/박자 트랙, 기존 효과·반응 음성은 변경하지 않음. 11종/편집 저장/기록/스탯/영상 폴더/진동 유지.
- CASE-05 실제 재현 후 CASE-06 검증. 스쿼트 고유 BGM과 박자 트랙 각각 AudioBufferSourceNode의 디코드 이름/시작/loop/AudioContext running/0보다 큰 gain 확인. 실제 스피커 청취 검증 아님.
- 11종 일반 BGM 중단, 메뉴 복귀 재개, 편집/일시정지 중 미재개, 집 소리 끄기/켜기, 스탯·진행 불변, JS 오류 없음. verification-06.json 및 verify-06.cjs.
- source-diff-06.json: 전달된 05와 비교 시 2개 script 블록(일반 BGM 컨트롤러/캐주얼 호스트)만 변경, 모든 내장 이미지·음원 데이터 동일.
- APK com.gaia.casual versionCode 6 / 1.5-CASUAL-06, 기존 개인 서명 그대로. 삭제 없이 업데이트 설치. 서명/zipalign/내장 HTML 해시 검사. 실제 Android 스피커/기기 동작 미검증.
- 작업공간 정리 후 전달했던 GAIA-CASUAL-05.html을 복구해 build-from-05.py로 해시를 검증한 뒤 재생성. 정상 R61 재빌드용 build.py에도 같은 bgm_gate.patch_html을 적용. 05 원본 SHA cf2af069dbc0740f6f4b74d01a765c8e6b044e2636e84f24a7a86074af6fcc77.
- main 보존. codex/gaia-casual-01 작업분기. 서명 키/비밀번호를 저장소나 게임 배포 파일에 넣지 않음.


## CASUAL-07 Android updater (2026-10-22)
- Same CASUAL-06 HTML and all 11 games/assets/save keys; APK wrapper versionCode 7, versionName 1.6-CASUAL-07, same signing key.
- First 07 launch configures official update URL automatically, including upgrade from empty/placeholder settings. One-time official_update_v1 marker; later user changes remain respected.
- Official endpoint: https://gaia-casual-updates.sagebean9.chatgpt.site/update.json
- Sites project: appgprj_6ad9f2ecfcf88191ad8b6bda5378d906. Source checkout /workspace/sites/gaia-casual-updates, remote source separate from private GitHub repo. Update-only files publicly downloadable; GitHub repository stays private.
- Current hosted content CASUAL-06, hash e3c79a7fcd0349aeb0aa2b6306779f27dcdc35ead4af1200e6ce98af4c1397d3, size 87107680. gzip split 4 parts each <=16 MiB.
- Future game updates: publish gzip parts first, then atomically publish update.json with uncompressed HTML SHA256 and size. Never publish signing keys, saves, private repo metadata.
- App checks on launch, asks Apply after verified download. Native changes still require APK installation.
