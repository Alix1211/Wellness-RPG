# GAIA CITY — CASUAL-02

사용자가 기존 게임을 모두 유지하도록 명확히 지시했습니다. 게임을 임의로 빼지 않습니다. 스쿼트는 가장 재미있게 했던 게임이므로 맨 앞에 배치했습니다.

- 분기 `codex/gaia-casual-01`, main R60 보존.
- 게임 11종: 스쿼트, 물병, 줄 자르기, 균형, 물어와, 배팅, 움찔 찾기, 소시지 합치기, 백만대, 뒤를 조심, 실린더.
- 각 10단계, 총 110단계. 문서 생성/문법 검사는 전체 통과. 전체 110단계 실플레이/난이도 검증은 아직 안 됨.
- 빠진 다섯 게임을 복원. 기존 캐주얼 저장은 스탯/기록 유지, 새 게임 기록만 초기화해 추가. 저장 키 `gaia-casual-save-v1` 유지.
- 네이티브 직접 진동: GaiaHaptics Java 브리지 → VibratorManager(31+)/Vibrator → VibrationEffect. VIBRATE 권한. 터치/정타/충돌/점프/줄 절단/성공/실패. 반복 없음, 호출 제한, 백그라운드 취소.
- 집에서 진동 켜기/끄기 + 진동 테스트. 소리 설정과 독립. 브라우저에서는 직접 진동 기능을 사용할 수 없음을 표시.
- APK `GAIA-CASUAL-02.apk`, `com.gaia.casual`, versionCode 2, 1.1-CASUAL-02. 기존 CASUAL-01 위에 업데이트 설치, 삭제하지 않음. 같은 서명 키 유지.
- `verification-02.json`: 93개 브라우저 검사 통과. 스쿼트 별도 자연 종료/성공 검사 `squat-play-verification.json`: DOM 입력으로 2800점, 성공 및 보상. 점수 주입 없음.
- 실기기 설치/터치/음향/진동 모터는 아직 확인 못 함. APK 컴파일/서명/정렬/내장 HTML 일치 검증과 실제 기기 검증을 혼동하지 않음.

재현과 구현: [casual/README.md](casual/README.md). 작업 이력: [casual/WORKLOG.md](casual/WORKLOG.md).
