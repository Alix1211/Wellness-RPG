# GPT 인수인계 — 벨트스크롤 "GAIA CITY: DETECTIVE" (2026-10-28, Claude 작성)

이 문서는 **어디에 무엇이 있고, 고치면 어떻게 폰에 반영되는지**를 먼저 적었습니다. 게임 내용 설명은 기존 `HANDOFF.md`에 있습니다(이 문서 마지막 "관련 문서" 참고).

## 1. 위치 (정확한 경로)
| 항목 | 값 |
|---|---|
| 저장소 | `Alix1211/Wellness-RPG` → https://github.com/Alix1211/Wellness-RPG (소문자 `wellness-rpg` 주소는 자동 이동됨) |
| **작업 브랜치** | **`gaia-detective-assets`** (지금 모든 작업이 여기. `main`에는 아직 합치지 않음) |
| 게임 폴더 | 저장소 안 **`belt-scroll/`** (카드게임 `gaia-detective/`와 별개) |
| 빌드 설정 | `.github/workflows/beltscroll-apk.yml` |
| APK 만드는 스크립트 | `belt-scroll/android/build_web.py` |
| 자동 업데이트(앱 쪽 코드) | `belt-scroll/android/app/src/main/java/com/gaia/beltscroll/WebUpdates.java`, `MainActivity.java` |
| 서명 키 | `belt-scroll/android/gaia-beltscroll.keystore` (**절대 바꾸지 말 것** — 바뀌면 덮어 설치가 안 되고 저장이 사라짐) |

바로 읽기용: `https://raw.githubusercontent.com/Alix1211/Wellness-RPG/gaia-detective-assets/belt-scroll/<경로>`

## 2. 고치고 폰에 반영되는 방법 (핵심)
**게임 파일을 고치고 `gaia-detective-assets`에 푸시하면 끝입니다.** 케인이 할 일은 앱을 껐다 켜는 것뿐입니다(켜질 때 "업데이트 받는 중…" 후 새 버전 실행).

푸시 후 일어나는 일(약 1분):
1. GitHub Actions `GAIA BELTSCROLL APK`가 자동 실행 (`belt-scroll/**` 안 파일이 바뀐 푸시일 때만. 트리거 브랜치는 `main`, `gaia-detective-assets`).
2. 순서: 문법 검사(`node --check js/*.js`) → `build_web.py`(게임 파일을 `android/web`에 모으고 파일별 해시 목록 생성) → APK 컴파일 → 두 곳에 게시:
   - 릴리스 **`beltscroll-app-latest`** : APK (`gaia-beltscroll.apk`) — 새로 설치용
   - 릴리스 **`beltscroll-web-latest`** : `update.json` (버전=커밋 SHA, 파일별 SHA-256) — **자동 업데이트용**
3. 앱이 켜질 때 `update.json`을 읽어, 자기 APK 안 파일과 해시가 다른 파일만 `raw.githubusercontent.com/Alix1211/Wellness-RPG/<커밋SHA>/belt-scroll/<경로>`에서 받아 둡니다. **전부 받은 뒤에만 교체**하고, 실패·오프라인이면 이전 버전/APK 그대로 실행합니다. 저장(localStorage)은 유지됩니다.

푸시 후 확인: Actions 탭에서 초록 체크(성공). 빨간 X면 대개 JS 문법 오류 — `node --check belt-scroll/js/game.js`로 먼저 확인.
푸시 전 로컬 검사 습관: `for f in belt-scroll/js/*.js; do node --check "$f"; done`

### 업데이트로 반영되는 것 / 안 되는 것
| 바꾼 것 | 반영 방법 |
|---|---|
| `index.html`, `style.css`, `js/*.js`(아래 예외 제외), `assets/` 그림·소리 | **푸시만 하면 자동 업데이트** |
| `js/mini-assets.js` (미니게임 문서·소리를 묶은 파일, 자동 생성, 저장소엔 없음) | 업데이트 대상 **아님** → APK 재설치 필요. 다만 `js/minigame_squat.js`, `assets/minigame/batting_police/game.html`은 업데이트됨 |
| Java 코드(`WebUpdates.java`, `MainActivity.java`), `AndroidManifest.xml`(앱 이름·아이콘·권한), 진동 브리지 등 | **APK 재설치 필요** — 케인에게 "릴리스 `beltscroll-app-latest`의 APK를 한 번 덮어 설치하세요"라고 안내. 덮어 설치하면 저장 유지 |
| 서명 키 | 건드리지 말 것 |

APK 다운로드 주소(고정): `https://github.com/Alix1211/Wellness-RPG/releases/download/beltscroll-app-latest/gaia-beltscroll.apk`

### 업데이트가 안 먹을 때 점검 순서
1. Actions가 성공했는지(실패하면 `update.json`이 안 올라가 이전 버전 유지).
2. **저장소가 공개(Public)인지.** 비공개로 바꾸면 앱이 `raw.githubusercontent.com`에서 못 받아 **업데이트가 전부 멈춤**(조용히 이전 버전으로 실행). 케인이 "개발 끝나면 비공개 예정"이라 했으니 그 시점에 반드시 알릴 것.
3. 앱이 아주 옛 APK인지 — 자동 업데이트 기능이 들어 있는 APK(10/28 이후)를 한 번은 설치해야 함.
4. 인터넷 불안정 → 다음 실행 때 다시 시도하니 앱을 껐다 켜 보게 할 것.
5. `main`과 `gaia-detective-assets` **두 브랜치 모두** 같은 릴리스 `beltscroll-web-latest`에 덮어씁니다(마지막에 푸시한 쪽이 이김). 케인이 폰에서 보는 건 항상 "마지막에 푸시된 브랜치"의 내용이므로, 다른 브랜치에 푸시하면 의도치 않게 바뀔 수 있음. 워크플로는 동시 실행 시 앞선 것을 취소(`cancel-in-progress`)함.

## 3. 파일 구조 (고칠 때 알아야 할 것)
- `belt-scroll/js/game.js` — 전투 전부(IIFE 하나). 자주 만지는 곳:
  - 난이도: `BOSS_HP`, `BOSS_HP_DEFAULT`(2.6), `BOSS_ATK`(1.25), `worldLevel()`(클리어 스테이지 3개당 1), `applyDifficulty()`
  - 보스 압박(10/28 추가, **수치 전부 임시**): `fireBarrage`(탄막 발수·속도·간격), `updateBossPressure`(쿨타임·밀쳐내기), `updateReinforcements`(증원 주기·동시 상한), `updateEnemyFlights`(날아간 졸개가 보스에 부딪힐 때 최대체력 6%·연쇄 4%)
  - 부서지는 진열대·아이템: `OBJ_SPEC`, `ITEM_SPEC`, `ITEM_POOL`, `DROP`, `planBreakables`/`spawnBreakables`(스테이지당 5~6개)
  - 플레이어 기술: `moves`(punch 13, kick 28), `resolveAttack`, `landSlam`, `hitEnemy`, `launchEnemy`
  - 파일 끝 `window.__gaiaProps` — 점검용 훅(`spawnWave`, `spawnPack`, `WAVES`, `TYPES`, `game`, `player`, `worldLevel`…)
- `belt-scroll/js/campaign.js` — 지역·스테이지·적/보스 정의(`TYPES`, `boss(...)` 헬퍼)
- `belt-scroll/js/story.js` + `story-data.js` — 대사 엔진과 대사(`window.BeltDialogue`). **대사 원문은 케인 것이라 임의로 고치지 말 것**(빈칸을 채운 곳은 `DIALOGUE_REVIEW.md`에 `[임시]` 표시)
- `belt-scroll/js/app.js` — 지도·지역 순차 해금·출동
- `js/game-art.js`(약 25MB), `js/data.js`, `js/region-art.js`, `js/die-voices.js` — **그림·소리를 글자(base64)로 묶은 파일**. 손으로 열어 고치지 말고 다룰 일이 있으면 사전 협의. `game.js`는 약 124KB라 자주 고쳐도 업데이트가 가볍게 받아짐(이 분리를 유지할 것)
- `belt-scroll/assets/` — 그림·소리. 새 그림은 여기에 넣고 코드에서 경로로 부르면 됨(APK에도 자동 포함, 업데이트로도 배포)
- `build_portable.py` — PC용 단일 HTML 만들기(자동 업데이트와 무관). `assets/...` 글자 그대로 쓴 경로만 포함하므로 경로를 문자열 이어붙이기로 만들면 이쪽에 빠짐

## 4. 로컬 점검 방법 (PC·헤드리스)
```bash
cd belt-scroll && python3 -m http.server 8765   # 같은 명령 안에서 시작·사용·종료(도구 호출 사이에 서버가 죽는 환경이 있음)
```
Playwright로 `http://127.0.0.1:8765/index.html` 접속 → `localStorage.clear()` 후 재로드 → `DetectiveApp.start(스테이지,0)` → `__gaiaProps.spawnWave(__gaiaProps.WAVES.findIndex(w=>w.boss))` 로 보스 구간 진입. 보스 등장 대사 중에는 `game.mode==='dialogue'`라 멈춰 있으니 테스트에서는 `__gaiaProps.game.mode='playing'`으로 풀기. 보스는 첫 묶음에 안 나올 수 있어 `spawnPack()`을 반복.
실제 폰에서의 손맛·화면 배치는 헤드리스로 확인 불가 — 케인이 직접 보고 알려 줌.

## 5. 케인 작업 규칙 (꼭 지킬 것)
- **존댓말만**. 케인은 프로그래머가 아님 → 기술 설명 최소, **결과 + 케인이 할 일만** 짧게.
- 케인이 쓴 대사·원고는 **그대로**. 안 되는 건 몰래 바꾸지 말고 바로 말하기.
- 내가 지어낸 내용은 **'임시'** 표시. 수치(난이도·탄막·드랍)는 전부 임시이며 케인이 플레이 후 "많다/적다"로 알려 주면 조정.
- 지적·피드백은 **모아서 한 번에** 고치고, **푸시·문서는 마지막에 한 번만**(푸시마다 비용이 든다고 싫어함).
- 쓸 수 없는 버튼은 **회색 비활성**. 진동은 **길고 아주 세게**. 일반 펀치·킥 데미지는 보스에게도 줄이지 말 것(케인이 명시적으로 거절함 — 접근을 어렵게 하는 쪽으로).
- 토큰이 많이 드는 작업은 먼저 말하고, 모르는 건 코드를 뒤지지 말고 케인에게 질문.

## 6. 남은 일 / 보류 (케인 결정 대기)
- 보스 탄막·증원 수치 조정(케인 플레이 후 피드백) / 보스 2페이즈·난이도 선택은 제안만 했고 **미승인**
- 지역별 부서지는 오브제(케인이 그림 줄 예정) / 월드 레벨에 따른 로지 성장은 "나중에"
- 보스 등장·격파 초상화 대사는 케인이 쓸 예정(없음) / 웃는 남자 첫 대사 문구 결정 대기
- 카드·돈 균형, 카지노 전투 배경(호텔 그림 임시), 용량(APK 약 85MB)
- 저장소 비공개 전환 시 자동 업데이트 중단(위 2번 참고)

## 2026-10-29 현재 상태 — 연속기 전면 취소
- 케인 요청으로 연속기 4종, 입력 순서 기록, 1.05초 판정 간격·3.2초 입력 대기 처리를 모두 제거.
- `js/game.js`를 연속기 추가 직전 커밋 `8cbbcd889fdf514bd1423916797645b5ba16530c`의 파일과 완전히 동일하게 복구. 기존 공격·점프·버튼 입력·타격 처리로 돌아감. 연속기 전용 테스트 파일도 삭제.
- 잔디는 원래 그림 타일(`grass_tile`, 836px 반복)로 복구된 상태 유지. 전체 화면 파란 터치 강조 차단 유지.
- 대사 원문 수정 없음. 웹 자동 업데이트 대상이므로 앱 완전 종료 후 재실행으로 반영.

## 7. 관련 문서
`HANDOFF.md`(전체 내역·날짜별 기록) · `DIALOGUE_REVIEW.md`(대사 검토, [임시] 표시) · `BOSS_SCENARIO.md`(보스 원문 시나리오) · `README.md`
