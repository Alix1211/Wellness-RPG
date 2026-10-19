# GAIA CITY · Wellness RPG

## 현재 테스트본 · 2026-10-20

실행 파일: **GAIA-LIFE-20261020.html**. 먼저 `python3 tools/gaia/restore.py`로 복원하면 외부 자산 없이 Chrome에서 실행합니다. `index.html`은 HTTP 서버에서 압축 조각을 읽는 진입 파일입니다.

**다른 AI의 점검은 [REVIEW-20261020.md](docs/gaia/REVIEW-20261020.md)부터 시작하세요.** 사용자 요구, 실제 구현과 기대의 차이, 재현 순서, 검증 한계, 코드 위치와 수정 방법이 있습니다.

- 센터 첫 도착10G → 자동 접수 → 기초반/방 체험/회복실로 진행 연결.
- 현재 목표 한 줄, 목적지 아이콘 움직임 및 방/층 강조.
- 수동 심야 버튼과 음향 테스트 UI 제거, 실린더 원본 비율/반복 방지 수정.
- 브라우저 검증 통과. **점프 먹통의 실기기 재현·실제 음향·이후 반복 플레이는 추가 점검 필요. APK 미빌드.**
- 주인공 집의 올바른 이미지는 사용자 제공 대기. 옥상 취소.

[현재 상태](PROJECT_STATUS.md) · [작업 기록](WORKLOG.md) · [인수인계](HANDOFF.md)

최신 SHA256: `66ccdcab6bce1d892e4a6114bd765fabe65d622b9fbd65479fc85c08ff016ca5` (62,380,581 bytes).
이전 v7/v8 빌더와 문서는 과거 기록입니다. `src/center/build.py`로 최신 index.html을 덮어쓰지 마세요.

실행: `python3 -m http.server 8000` → http://localhost:8000/index.html
수정용 추출/재조립: `python3 tools/gaia/edit-html.py extract`, `python3 tools/gaia/edit-html.py pack`.
전체 설명은 점검 문서를 보세요. `src/gaia-life/` 모듈은 읽기용 추가 로직이며, 수정만으로 실행 HTML이 바뀌지는 않습니다.

개인용 비공개 저장소. 원본 Alix1211/Wellness는 참조용이며 수정하지 않습니다. 사용자가 선택한 개인 사진/영상과 로컬 테스트 캡처는 커밋하지 않습니다.

이전 README는 [기록](docs/gaia/PRE-20261020-README.md)에 보존했습니다.
