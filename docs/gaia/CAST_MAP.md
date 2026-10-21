# 캐스팅 지도 (인물 ↔ 초상화 ↔ SD 캐릭터 ↔ 방) — 한 번 정하면 여기만 본다

새 이름은 만들지 않는다. 이름은 DIALOGUE 1~5권·QUESTS_DRAFT_1에 이미 있는 것만 쓴다.
(임시 표시: 도윤→화장실 훈련방 담당, 한시우 야간반 조교/남신입 이름은 케인 확정 전까지 임시)

## 얼굴 있는 여성 4인 (케인 확정 — 절대 다시 묻지 않는다)
에셋: `assets/characters/cast4/` (표정·포즈 시트), `cast4/chibi/` (SD 시트). 갈색 긴 웨이브 = 주인공.
| 인물 | 외형 | 관계 | SD 시트 |
|---|---|---|---|
| 유리 | 노란 포니테일 | 동네 언니 · 센터 선배 · 직장 선배 | 센터=yellow_yoga(기기·엎드림), 회사=yellow_office(8컷) |
| 지안 | 검정 단발 | 친구 | 센터=bob_yoga, 회사=bob_office(8컷) |
| 오 부장 | 올린머리 | 회사 부장님 | 센터=updo_yoga, 회사=updo_jeans(8컷, 오피스 시트 없음) |
(cast4 문서의 신다은·박소라·장세영은 AI가 붙인 제안 이름이라 쓰지 않는다. 3인방 동거 = 유리·지안·오 부장.)
이 셋이 센터·회사·거리·집에 두루 나오는 이름 있는 얼굴 조연이다. 방마다 이름 없는 "회원 A·B"로 채우지 않는다.

## 에셋 현황 (조사 끝, 다시 조사하지 않음)
- 남성 큰 초상화: tracksuit 12 / suit 12 / casual 8 (`DIALOGUE_MEN`, 원본 해상도)
- 남성 SD(서 있는 치비): trainer 0~11 / office 0~11 / casual 0~11
- 여성 큰 초상화 7종(`DIALOGUE_WOMEN`): elder, suit, cardigan, clerk, yoga, grocer, aunt  ← 케인이 더 많이 보유(추가 시 키만 늘리면 됨)
- 여성 SD: yoga-member 0~5(서 있는 포즈), office-member 0~5(서 있는 포즈), member 0~6(옆모습 기어다님), casual-member 0~1(정면)
- 큰 초상화 ↔ 치비 짝: tracksuit i ↔ trainer (0↔4,1↔5,2↔6,3↔7,4↔0,5↔1,6↔2,7↔3,8~11 동일), suit i ↔ office (동일 규칙)

## 담당 인물 (초상화 / 치비)
| 인물 | 초상화 | 치비 |
|---|---|---|
| 서하준 | tracksuit 4 | trainer 0 |
| 이안 | tracksuit 7 | trainer 3 |
| 윤서 | tracksuit 0 | trainer 4 |
| 도윤 | tracksuit 1 | trainer 5 |
| 한시우 | tracksuit 2 | trainer 6 |
| 정민호 | tracksuit 3 | trainer 7 |
| 오 선생 | tracksuit 8 | trainer 8 |
| 강태오 | suit 0 | office 4 |
| 재현 | suit 1 | office 5 |
| 백도현 | suit 2 | office 6 |
| 차재원 | suit 3 | office 7 |
| 송 회장 | suit 8 | office 8 |
| 유리(여) | yoga | yoga-member |
| 지안(여) | suit | office-member |
| 오 부장(여) | elder | office-member |
| 점원(여) | clerk | yoga-member 0 |

## 방 → 담당 (선두=820 위치, 둘째=430, 조연 여성=왼쪽/가운데)
센터: 1층 로비=도윤+유리 / 매점=점원+서하준 / 회복실(1층 2곳·6층)=오 선생 / 화장실 훈련방=도윤 / 기초방=서하준 / 기구방=윤서(줄), 이안(배팅) / 단체방·자세점검=한시우 / 체벌방=정민호
회사: 로비=강태오+송 회장 / 공용 사무실=재현·강태오+지안 / 회의실=재현+강태오 / 개인 사무실=백도현+오 부장, 차재원+송 회장 / 화장실=지안+오 부장 / 휴게실·탕비실=오 부장+지안
조연 여성: 센터=회원, 회사=직원/비서/참석자 (대사는 EXTRA_LINES, 스프라이트는 방마다 돌려 씀)

## R38 적용 상태
- 초상화: 센터=요가복(four_standing_front_yoga), 회사=오피스(four_office_standing_bright) 원본 해상도. 추출 `tools/gaia/make-cast4-assets.py` → `assets/characters/cast4/game/`.
- 이름 있는 얼굴 조연(대화 가능): 유리·지안·오 부장·점원. 이름 없는 배경 여성(회원/직원)은 말을 못 건다.
- 센터: 유리=로비·기초방1·단체방1·자세점검2·회복실(6층), 지안=기초방3·기구방1·단체방3. 회사: 지안=로비·공용사무실1·휴게실 등, 오 부장=휴게실·탕비실·개인사무실1·화장실, 유리=탕비실·공용사무실2·휴게실(3층).
- 대화 중 취소/나가기는 걷는 방에서는 방 안에 머문다(방 나가기는 문 쪽으로 걸어서).
