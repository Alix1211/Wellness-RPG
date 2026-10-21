# 캐스팅 지도 (인물 ↔ 초상화 ↔ SD 캐릭터 ↔ 방) — 한 번 정하면 여기만 본다

새 이름은 만들지 않는다. 이름은 DIALOGUE 1~5권·QUESTS_DRAFT_1에 이미 있는 것만 쓴다.
(임시 표시: 도윤→화장실 훈련방 담당, 한시우 야간반 조교/남신입 이름은 케인 확정 전까지 임시)

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
