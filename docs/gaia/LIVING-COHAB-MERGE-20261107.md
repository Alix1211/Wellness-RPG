# 2026-11-07 GAIA CITY LIFE — 최신본 동거·결혼·엔딩 병합

## 기준·백업

- 사용자가 최종 기준으로 지정한 원본: `GAIA-R60-LIVING-CORRIDORS.html`.
- 원본 SHA256: `b73c2e2da92c4891d3d03b15ddb376358e8ab5f49f5831b443351044acf18d52` (90,558,555바이트).
- 작업 전 원본을 같은 SHA256으로 별도 보관. GitHub 기존 복구 브랜치 `backup/r60-before-cohab-marriage-ending-20261106-a91b2d4` 및 `backup/r60-before-quest-giver-routing-20261107-3119f92`는 그대로 유지.
- 직전 `GAIA-R60-QUEST-RHYTHM.html` SHA256: `126e8de99e8338a3c54956f687350e808fb8eaf41ae9a021be8110089fd19e11`.

## 변경 범위

1. 기존 R60 복원과 조작·캐릭터 수정은 유지.
2. 사용자가 작성한 QUEST-RHYTHM 기능을 **바이트 단위로 동일하게** 복원: 하루 0~2회, 담당자·장소 분산, 숨은 조건, 세로 초상화 처리.
3. 사용자 최신 LIVING-CORRIDORS 대사·혼잣말·마주침·복도 이벤트 코드를 **바이트 단위로 동일하게** 복원. 변경된 기존 플레이어 호스트는 정확히 10개 구간, 별도 복도 스크립트 1개를 원본에서 가져옴.
4. 위의 최신 파일에만 이전 동거→상대 선택→결혼→아침→엔딩 코드를 연결. 사용자 대사집 원문은 재작성·순화·삭제하지 않음.
5. APK는 빌드하지 않음.

## 재현·검사

```
python3 tools/gaia/restore.py
node tools/gaia/test-cohab.mjs
```

- 두 중간 게임 파일은 각각 사용자가 제공한 HTML과 SHA256 및 전체 바이트가 일치.
- 최종 결과: `GAIA-R60-LIVING-COHAB-ENDING.html`, 90,589,000바이트, SHA256 `bae1b7646bafda7ff9522c47cb45de8e8d0a5c7a71dc4a73d3e0472ae18db5ab`.
- 25개 `<script>`의 문법 검사 통과. 혼잣말·퀘스트 스크립트 원문 그대로 유지. 12명 상대 선택 → 동거·결혼·엔딩 모의 흐름 검사 통과, 대사집 일치 검사 통과.
- **미확인:** 실제 모바일 터치 조작으로 새 게임을 시작해 엔딩까지 전 과정을 플레이하는 실기기 테스트.
