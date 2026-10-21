# GAIA CITY — CASUAL-01

현재 분기는 기존 RPG를 보존한 캐주얼 전환 테스트판입니다. main은 R60 그대로 유지됩니다.

- 작업 분기: `codex/gaia-casual-01`.
- 새 코드/재현 절차: [casual/README.md](casual/README.md).
- 선택 → 게임 → 결과 → 성장 → 다음 단계 흐름. 여섯 게임, 게임별 10단계.
- 강제미션·퀘스트·생활비·스탯 감소·입장 체력·실패 후 강제 후속 게임은 새 플레이 경로에서 제외.
- HTML `GAIA-CASUAL-01.html`, 별도 Android 패키지 `com.gaia.casual` / GAIA CASUAL.
- 저장 `gaia-casual-save-v1`; 기존 RPG 저장과 원본 HTML은 보존. 기존판 자동변환/삭제 없음.
- 브라우저 검증 55항목: 실제 물병/줄 1단계 성공, 여섯 게임의 생명주기·실패·중단·재도전, 저장과 중복 보상 등.
- 60단계 조합 문서 생성과 JS 문법 검사 통과. **60단계 전체 플레이/난이도 검증은 미완료**.
- APK 서명/정렬/CRC/내장 HTML 해시 검증. **실기기 설치·터치·스피커 확인은 미완료**.
- 실패한 검증 시도와 수정 이력: [casual/WORKLOG.md](casual/WORKLOG.md).
- 다음: 사용자 기기에서 새 앱 테스트 후, 게임별 난이도와 연출을 하나씩 조정. 사용자가 요청하기 전 기존 RPG/main을 교체하지 않음.
