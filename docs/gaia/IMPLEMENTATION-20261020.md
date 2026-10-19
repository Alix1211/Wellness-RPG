# GAIA CITY R3 — 입력·음향·미니게임 전환 점검 인계

## 최신 기준
- 수정본: `GAIA-LIFE-20261020-R3.html` (동일 바이트의 저장소 복원 파일은 `GAIA-LIFE-20261020.html`).
- 빌드 식별자: `window.GAIA_BUILD === '20261020-R3'`.
- SHA256: `473d1d4039ab80950a6e60be38f92b0b72be68d316f85d5d0a33f3b71f48ce0b`
- 크기: 62402280 bytes.
- 이전 기준: GitHub main `03d8a24f664adf23f68a3052bed07e52674dfd57`, R2 SHA `a79f04b4707ccaecdb23cf34593d88a15d7534a72e4d3927a530c9e1087142b0`.
- 최신을 원본 v6나 예전 빌더 결과로 덮어쓰지 말 것.

## 사용자 보고와 처리
1. 거리 실린더 진입 즉시 버튼 먹통, 취소/전체화면 전환 후 간헐 먹통.
   - resetInput이 이전에는 조이스틱 값만 초기화했다. 실제 gotpointercapture의 pointerId/element를 기록하고 진입·복귀·blur·화면 숨김 때 캡처를 해제한다. 임의의 0~19 ID 추측 대신 실제 ID를 사용한다.
   - 거리 미니게임 진입 때 남아 있는 부모 모달도 닫는다. 기존 비동기 Studio.resolve 취소 토큰 검사는 유지한다.
   - legacy 게임은 모달 dialog 안에 메뉴/메뉴 패널을 넣는다. dialog 밖의 버튼은 z-index가 높아도 모달 때문에 비활성화된다.
2. 물병은 첫 시작부터 무음, 밧줄/거리 실린더도 무음.
   - 네이티브 3종은 각 iframe 내부의 단일 WebAudio mixer를 사용한다. 시작/터치 제스처와 AudioContext.resume이 같은 문서에서 실행된다. 부모 전역 변수 접근이나 postMessage를 통해 재생 허가를 얻는 경로에 의존하지 않는다.
   - 기존 음원 바이트를 config에 전달하고 base64에서 직접 decodeAudioData한다. 네트워크 요청은 없다. 부모 mixer는 숫자형 legacy 게임용으로 남긴다. 네이티브 이벤트를 중복 재생하지 않는다.
   - 물병 실제 발사, 밧줄 cuts 증가, 실린더 실제 입력/배경 트랙을 연결했다.
   - 기존 wellness-life-sound='off' 설정을 무시하거나 강제로 초기화하지 않는다. 숨겨졌던 소리 설정은 기존 ☰ 메뉴의 '소리 켬/끔'으로 다시 조절할 수 있다. 사용자의 실제 설정이 off였는지는 확인하지 못했다.
3. 시작 선택창이 번쩍한 뒤 강제 시작.
   - GAME_STUDIO의 LifeMini.begin 자동 호출, legacy의 mg-start 자동 클릭을 제거했다.
   - 기존 시작창에서 직접 시작을 누른다. 그 전에는 모델의 시간이 흐르지 않는다. skin/config/audio는 첫 화면 이전에 설치한다.
4. 끝날 때 창이 번쩍하고 강제 복귀.
   - 부모의 220ms 자동 종료를 제거했다. 네이티브 결과는 '확인', legacy는 기존 복귀 버튼까지 유지한다.
   - 센터 보상은 기존 session.done으로 1회 처리한다. 거리 결과는 encounter.result에 대기시킨 후 확인/뒤로 시 settle로 1회 처리한다. 결과 전 취소는 기존 취소 규칙이다.

## 보존 범위
STORY / ORIGINAL_DIALOGUE / MINI_SOURCE 데이터는 R2와 전체 동등성 검사했다. 사용자가 직접 바꾼 대사를 새로 쓰지 않았다. 집 이미지 교체, 옥상 추가, 확인/취소 공통 조작계 재설계, APK 빌드는 하지 않았다. 기존 하루 2회 휴식, 의뢰인/목적지 제한, 물어와 양끝 그림 버튼, 세로 실린더 contain + 흐린 배경 유지.

## 검사와 한계 — 반드시 구분
- `tests/gaia/runtime-r3-verification.json`: file://, 세로 412×850 및 412×915, 보안 제한을 끄지 않은 Chromium, autoplay=user-gesture-required. 실제 터치/스와이프, 달리기 누른 상태에서 거리 진입, 시작 전 취소와 재진입, 종료 후 점프, 실제 게임 tick을 통한 종료/결과 유지.
- 소리는 이벤트 횟수만 세지 않았다. 테스트용 AnalyserNode로 mixer 출력의 **0이 아닌 PCM 진폭**을 측정했다. 물병 첫 발사/음소거 해제, 밧줄 첫 시작, 거리 실린더 첫 시작에서 측정. 밧줄 실제 스와이프 후 cuts 및 hit_slap도 검사.
- `tests/gaia/regression-r3-verification.json`: 원본 방 대사, 취소 경합, 의뢰 범위, 휴식 제한/재실행, 물병 길게 발사, 물어와 양끝 조작 및 메뉴, legacy 결과 유지, 세로 실린더 미디어.
- `tests/gaia/runtime-r3-preservation.json`: 대사/원본 게임 데이터 동등성.
- 이전 테스트는 @sparticuz/chromium 기본 args의 `--disable-web-security`를 그대로 사용했다. 이번 검사는 해당 옵션과 site isolation 해제 옵션을 제외했다.
- **Android Chrome의 content://downloads 및 실제 스피커 청취/전체화면 전환은 이 환경에서 직접 검증하지 못했다.** viewport resize는 실제 Android 전체화면과 동일하지 않다.
- 이전 R2도 데스크톱 Chromium file://의 단순 진입에서는 소리 이벤트 및 입력이 통과했다. 따라서 사용자 기기의 먹통/무음 원인을 완전히 재현했다고 쓰지 말 것. R3은 확인된 자동 시작·자동 종료·숨겨진 음소거와 취약한 입력/음향 경로를 수정하고 위 범위에서 검증한 빌드다.

## 다음 AI가 바로 확인할 순서
1. 최신 복원 파일과 위 SHA를 확인. 사용자에게 구버전 다운로드를 시험시키지 말 것.
2. Android에서 다운로드 파일을 직접 열기 → 거리 달리기 중 실린더 진입 → 시작 대기 → 시작 → 터치 → 취소 → 즉시 점프/달리기. 전체화면 진입/해제 후 반복.
3. 물병 첫 발사/길게 발사, 밧줄 첫 시작/절단, 실린더 배경/터치 소리를 실제 청취. ☰ 소리 상태도 기록.
4. 결과창이 확인 전 유지되고, 복귀 시 보상/시간이 중복 반영되지 않는지 확인.
5. 문제가 남으면 기기/Chrome 버전, 실행 URL의 scheme, GAIA_BUILD, 발생 게임/순서, 그 iframe의 LifeMini 및 GaiaAudioStatus.state/errors를 확인. 사용자에게 음향 테스트창을 상시 노출하지 말 것.

## 복원·편집·실행
```sh
python3 tools/gaia/restore.py
python3 tools/gaia/edit-html.py extract --html GAIA-LIFE-20261020.html
```
편집 도구의 사용법은 `python3 tools/gaia/edit-html.py --help` 참고. index.html은 HTTP용 gzip 조각 로더이며 다운로드 단일 HTML이 아니다. 복원 파일은 오프라인 실행 가능하다.

현재 유지보수는 복원한 최신 HTML을 추출/편집/재조립하는 흐름을 사용한다. `src/gaia-life/build-life.py`는 예전 원본 자산 경로를 요구하며 R3 기준 빌더가 아니다. `patch-runtime.py`는 변경 기록이자 R2→R3 재현 도구이며 SHA가 일치하는 R2 HTML이 필요하다. 원본 v6에 적용하면 안 된다. `native-audio-runtime.js`는 그 패치가 생성하는 네이티브 mixer 소스다.

테스트: Playwright 설치 후 `CHROMIUM_PATH`로 시스템 Chromium을 지정하거나 Playwright 설치 브라우저를 사용한다. `node tests/gaia/verify-runtime-r3.cjs`, `SKIP_SHOTS=1 node tests/gaia/verify-regression-r3.cjs`. 과거 verify-final/verify-repair는 자동 시작/자동 종료를 전제로 하므로 R3 합격 기준으로 사용하지 말 것.
