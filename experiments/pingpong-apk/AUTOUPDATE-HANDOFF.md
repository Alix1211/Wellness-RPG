# GAIA Pingpong v12.12.3 — 자동업데이트

기존 com.gaia.pingpong 앱 위에 동일 서명 APK 설치. 앱 삭제 금지. 기존 세이브/장비/MP4 폴더 데이터 유지.

앱 시작 시 공개 GitHub 브랜치의 experiments/pingpong-apk/updates/update.properties를 자동 확인한다. 신규 build가 있으면 parts 순서대로 ZIP을 내려받고 총 크기/SHA256/경로/게임 HTML을 검증한다. 버전별 디렉터리와 원자적 current.txt 교체로 보관한다. 현재 실행 중 게임은 기존 디렉터리를 계속 사용하며 다음 Activity 시작부터 새 버전 사용. 게임 도중 강제 새로고침 없음. 오프라인/다운로드/검증 오류는 기존 게임 유지. 설정에 업데이트 상태와 수동 확인 버튼 추가. Android WebView origin은 기존 appassets 주소 유지하고 네이티브 저장/IndexedDB 이름 변경 없음.

배포 주소: https://raw.githubusercontent.com/Alix1211/Wellness-RPG/gaia-pingpong-apk-20261025/experiments/pingpong-apk/updates/update.properties

배포 규칙: 다음 게임 배포 때 build를 단조 증가시킨다. ZIP은 index.html 필수, assets/ 선택. 새로운 패키지는 최초 APK 기준 누적 에셋 변경 전부를 포함해야 한다(이전 다운로드 오버레이 상속 없음). minNative는 이 APK 2026102503. 네이티브 기능/권한 변경은 APK 업데이트 필요. prepare_update.py로 ZIP/parts/manifest 생성 후 버전 파일을 먼저 GitHub에 저장하고 update.properties를 같은 커밋 또는 마지막 커밋에서 갱신. 배포 중인 과거 parts는 지우지 않는다. 서명키/비밀번호를 저장소에 넣지 않는다.

검증: Java17/D8/aapt2 APK 빌드, v2/v3 서명 및 기존 인증서 일치, zipalign/CRC/내장 에셋 동일성 통과. Java 업데이트 설치/해시 오류/경로 탈출/불완전 패키지/이전 실행 버전 보존/다운그레이드/외부 호스트 거부 통과. 기존 저장 타임스탬프/동기화 gate/진동 OFF 및 실제 내장 JS 구문 검사 통과.

미확인: 실제 Android 기기 설치/모터 진동/앱 재실행 후 자동 적용은 기기가 연결되지 않아 직접 확인 못 함. 이번 검증에서 8개 미니게임 전체 완주나 시청각 실기 테스트를 수행했다고 주장하지 않음. 기존 v12.12.2 게임 수정(일반 타구 진동, 음량 분리, 카메라 위치/스킬 추적 제거, 실린더 진입별 랜덤)은 유지.
