# 벨트스크롤 (GAIA CITY: DETECTIVE 벨트액션판) 인수인계 — 2026-10-28

## 이 폴더
GPT가 만든 벨트스크롤 소스를 Claude가 이어서 확장한 것. 카드게임(`gaia-detective/`)과는 별개 폴더.
빌드: `python3 build_portable.py` → `GAIA_Detective_All_Stages.html` (단일 파일, 약 59MB) + `js/mini-assets.js`(자동 생성, 저장소엔 없음).
주의: build_portable은 `assets/...` 글자 그대로 쓰인 경로만 파일에 넣는다(문자열 이어붙이기로 만든 경로는 안 들어감).

## 지금까지 한 것 (Claude)
- 카드 시스템(50장+소모품 10, 보관함/상점/단련), 카드 사용 연출, 도파민 게이지/절정, 스탯, 단련 미니게임 2종, 왼쪽 떠다니는 조이스틱
- 한 판 길이 단축(스테이지별), 점프 악용 완화, 적 상태 연출(속박 떨림·머리 위 새/별)
- 적 9종(punk,paddleBrute,goth,whip,boxer,hippie,flameGuy,rocketeer,grenadier) 두번째 동작 움짤 + 날아가는 컷 (`assets/enemy/`, `js/enemy-art.js`). 채찍 여전사는 새 컷에서 물리 밧줄 숨김.
- 버그: 클럽 스테이지 `e.strikes` null 오류 수정
- 보스 그림 12명은 이미 코드에 연결돼 있음(`js/campaign.js` types, 그림은 `assets/regions/` + `js/region-art.js`). 10/27 문서의 "코드에 없음"은 틀린 내용이었음.
- **APK**: `android/` (패키지 com.gaia.beltscroll, 가로 고정, 서명키 저장소 고정). `.github/workflows/beltscroll-apk.yml` 이 belt-scroll 푸시 때마다 빌드해 릴리스 `beltscroll-app-latest` 에 올림. 앱 이름 "큐티너클"(임시, `AndroidManifest.xml` label 한 줄), 아이콘은 케인이 준 그림.
- **진동**: 카드게임 방식 이식(`js/haptics.js` + 앱 `GaiaBridge.vibrate`, 최대 세기). 타격·쓰러짐·피격마다. 앱을 새로 설치해야 반영.
- **소리**: 케인이 준 죽는 소리(남 19·여 7)를 잘라 `js/die-voices.js` 로 번들, 적이 쓰러질 때 `AlleyAudio.die(kind)`(여성=whip·heiress만, 나머지 남성). 로지 타격 소리 `rosie_strain`/`rosie_pant` 은 뒤쪽 두 번째 소리("으꾸" 꼬리)를 잘라 교체(구간 분석 기준, 귀로 확인 못 함).
- 하트 속박 스킬(Q) 제거: 버튼 숨김 + `pushSkill()` 무력화. 적 하트 발사·하트 퇴장 연출은 별개라 그대로.
- 폰 검은 띠: 가로로 긴 화면(최대 21:9)에서는 장면 폭 `W`를 넓혀 채움(`fitView`). 16:9 이하(태블릿)는 기존 그대로.
- 지도 Lv.: 클리어 스테이지 3개당 1(단련 미니게임 난이도에 쓰던 월드 레벨과 같은 값). 경험치식 플레이어 레벨은 없음(성장은 스탯·단련·카드).
- **카지노(스테이지 14)**: 4구역 + 경호 부대 구역, 보스 없음, 전투 배경은 호텔 그림 임시. 클리어 뒤 재방문하면 슬롯머신(`js/slot.js`, 카드게임 슬롯 이식, 현장 자금 G 사용, 출동 한 번 끝날 때마다 10회 충전). 수치는 `slot.js` 의 SLOT, 전부 임시.

## 케인 설정
농장(과학자→농장 마초) / 호텔(마피아 4인→마피아 보스) / 촬영소(AV감독→재벌 미녀→뒤에 호스트) / 환락가(포주→학생 미남+도살자 칼) / 공원(이벤트, 일반 적+보스급 혼합). 원문은 `BOSS_SCENARIO.md`, 보스 그림은 `art-source/bosses/`.

## 남은 일 / 보류
- 보스 연출(공격 예고·빈틈·코믹한 패배·체포)은 미작성. 케인 판단: 큰 일러스트 대신 **보스 직전·격파 직후 초상화 한 줄 대사**가 가성비 좋다고 제안함(아직 미결정, 대사는 케인이 쓸 것, 없음).
- 시작·끝 초상화 대사 연출은 코드에 없음.
- 카드·돈 개념이 약함(카드값 균형 미확인). 보상·카드값을 한 번에 묶어 조정하자고 제안함(미결정).
- 카지노 전투 배경 전용 그림 없음(호텔 그림 임시).
- 마피아 4인: 둘씩 등을 맞대고 다니며 사격(케인 아이디어). 약점은 Claude 임시안: 짝이 쓰러지면 남은 쪽 멈칫 / 쌍이 서로 다른 방향이라 한 쌍 뒤에 붙으면 다른 쌍은 못 쏨 / 맞으면 쌍이 흩어짐.
- 날아가는 적 대사(`FLY_LINES`, 임시)는 케인이 정할 것.
- 종합 검토 대화: 카드바 스타일, 카드게임과의 관계(대체/병합), 파일 크기(APK 약 85MB).
- 저장소는 개발 완료까지 공개, 이후 비공개 전환 예정(케인).

## 케인 작업 규칙 (요약)
존댓말만 / 도구 쓰기 전 한 줄 설명 / 임의 창작은 '임시' 표시 / 피드백은 모아서 한 번에 / 푸시·MD는 마지막에 한 번 / 비활성 버튼은 회색 / 진동은 길고 아주 세게 / 기술 설명 최소화·결과와 케인이 할 일만 / 근거 없이 추측 금지 / 토큰 많이 드는 작업은 먼저 말하기.


## 자동 업데이트 (2026-10-28)
- 앱이 켜질 때 GitHub 릴리스 `beltscroll-web-latest`의 `update.json`(파일별 해시 목록)을 읽고, APK 안 파일과 다른 것만 `raw.githubusercontent.com`에서 받는다. 전부 받은 뒤에만 교체(원자적), 실패·오프라인이면 이전 버전/APK 그대로. 저장은 그대로 유지.
- 구성: `android/app/src/main/java/com/gaia/beltscroll/WebUpdates.java`, `android/build_web.py`(목록 생성), `.github/workflows/beltscroll-apk.yml`(APK + 목록 게시).
- 이를 위해 `game.js` 안의 큰 그림 묶음을 `js/game-art.js`로 분리(게임 코드 124KB만 바뀌어도 가볍게 받도록).
- 예외: `js/mini-assets.js`는 업데이트 대상이 아님. 다만 스쿼트 코드(`js/minigame_squat.js`)는 업데이트되며, 컨베이어는 10/28 사운드 점검 이후 `assets/minigame/batting_police/game.html`을 직접 읽으므로 문서도 업데이트된다. mini-assets 안에 고정된 그림·음원을 바꾸는 경우와 앱 자체(Java) 변경은 별도 대응/재설치가 필요.
- 저장소를 비공개로 바꾸면 이 업데이트(와 카드게임 앱 업데이트)는 동작하지 않는다.


## 2026-10-28 경찰서 미니게임 사운드 점검 (GPT)
- 적용 브랜치: gaia-detective-assets, 대상 폴더 belt-scroll/ (카드게임 폴더는 변경하지 않음).
- 스쿼트: 모든 난이도 음악 전용 Gain을 2배(+6.02 dB, 압축기 전단)로 변경. 쉬움 1.1→2.2, 보통/어려움 1→2. 박자 트랙 .62, 타격 .7, 음성 .55와 기존 압축기/마스터는 유지. 체감 음량은 태블릿 확인 필요.
- 컨베이어: 내장 hit_slap/hit_punch/miss/normal/perfect/homerun 및 BGM 3곡의 파일 디코딩 정상(FFmpeg). 실제 기본 판정은 정타 hit_punch+homerun, 그 외 적중 hit_slap+normal, 실패 miss. perfect 파일은 존재하지만 기본 판정에서 별도 사용되지 않음.
- 기존 wellness-sfx 메시지는 공통 호스트가 처리하지 않아 swing 요청이 무음이었음. 컨베이어 등록의 transformDoc에서 짧은 바람 소리를 게임 내부 Sound 경로에 연결. 이미 직접 재생하는 타격/실패 소리는 중복 추가하지 않음.
- 자동 업데이트: 컨베이어 docUrl을 업데이트되는 원본 문서로 전환, 공통 실행부는 선택적 transformDoc 적용 지원. mini-assets의 오래된 문서에 고정되지 않도록 함. 기존 미니게임 등록에는 영향 없음.
- 검증: JS 및 iframe 내부 스크립트 문법 검사, 내장 음원 9개 디코딩, AudioContext 모형으로 효과/음성 7개 및 BGM 3곡 시작 경로, 스쿼트 3난이도 음악 2배/박자 유지 확인. 이 환경에 브라우저 실행 파일이 없어 실제 브라우저·APK 청취는 미확인. 실제 기기 음량/일시정지·재개는 사용자 확인 필요.
- 다음: 자동 빌드가 beltscroll-web-latest/update.json 게시 후 앱 완전 종료→재실행하여 음악과 효과음 확인. 기기 볼륨 균형 피드백에 따라 음악만 추가 조정.
