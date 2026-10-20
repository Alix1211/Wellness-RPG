# R4 — 도로 실린더 게임 이후 터치 먹통 (soft-lock) 수정

## 재현된 원인
- `CityTravel.settle()` 이 `hooks.resolve()` 를 호출한 뒤에 `encounter=null` 을 실행했다.
  `resolve` 안의 `save()` 는 `localStorage.setItem` 을 직접 호출하므로, 저장이 실패(저장 공간 부족, content:// 등 불투명 출처)하면 예외가
  `settle()` 를 끊고 `encounter` 가 남는다. 화면은 정상으로 보이지만 `boost()`/`jump()`/`update()` 가 `encounter` 때문에 영구히 무시된다.
- 진입 쪽: `cityEncounter()` 는 `await Studio.resolve()` 가 멈추거나 실패하면 빈 레이어가 화면을 덮은 채 끝났다.

## 수정 (R4)
- `save()` : 저장 실패를 삼키고(콘솔 경고 + 1회 토스트) 호출자를 중단시키지 않는다.
- `CityTravel.settle()` : `resolve` 예외와 무관하게 항상 `encounter=null`, `held=false`.
- `update()` : `settled` 인데 남은 encounter 를 자동 해제(안전망).
- 훅 `resolve` : 예외가 나도 미니게임 레이어를 닫고 필드 입력을 복원.
- `cityEncounter()` : Studio 레이아웃 읽기에 3초 제한 + 실패 시 기본 레이아웃, 나머지 구간은 try/catch 로 실패 시 정상 취소.

## 검증
- `tests/gaia/verify-softlock-r4.cjs` : 저장 실패 / Studio 실패 / Studio 멈춤 / 정상 4개 시나리오가 모두 복구되어야 통과 (R3 에서는 저장 실패 시나리오가 soft-lock).
- `tests/gaia/verify-runtime-r3.cjs` : R4 에서 통과(마지막 3회 중 1회는 고정 좌표 탭이 하트를 놓쳐 `taps>0` 에서 흔들림 — 기존 테스트의 불안정성).
- 실제 기기에서 먼저 무엇이 실패했는지는 확인하지 못했다(원인 후보를 코드와 오류 주입으로 재현한 것).
