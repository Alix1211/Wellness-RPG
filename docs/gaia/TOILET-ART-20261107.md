# 2026-11-07 화장실 그림 1~4 복구

- 기준: `GAIA-R60-LIVING-COHAB-ENDING.html`, SHA256 `bae1b7646bafda7ff9522c47cb45de8e8d0a5c7a71dc4a73d3e0472ae18db5ab`.
- 작업 전 GitHub 복구 브랜치: `backup/r60-before-toilet-tiles-20261107-23a112f`.
- 화장실 물병 채우기(`SUITE_DOCUMENT`, kind=`water`)의 `tile0`~`tile3` 기본 이미지가 비어 있어 사용자가 올린 이미지 4장을 다음과 같이 연결:
  1. `1000110004.png`(실제 JPEG) → `tile0`
  2. `1000110005.png`(실제 JPEG) → `tile1`
  3. `1000110006.png`(실제 JPEG) → `tile2`
  4. `1000110007.png`(실제 PNG) → `tile3`
- 원본 이미지 바이트 그대로 삽입. 표시·판정 좌표, 미니게임 점수/시간, 미션, 대사, 다른 에셋은 변경하지 않음. 기존 사용자가 편집 메뉴에서 직접 저장한 이미지가 있으면 그 로컬 이미지가 우선 적용됨.
- 검사: `python3 tools/gaia/restore.py` → `node tools/gaia/test-toilet-tiles.mjs`; 기존 동거·엔딩 테스트는 `node tools/gaia/test-cohab.mjs`.
- 최종 파일: `GAIA-R60-LIVING-COHAB-TOILET-TILES.html` / 91,993,636바이트 / SHA256 `78770b6495ba41eed35bb86a6f431f65ef60be87f48378d2ff9e79c2799c5ccb`.
- Android 실기기 시각 검증은 별도.
