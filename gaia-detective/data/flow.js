// 한 바퀴(일상 루프) 진행표 — 임시(케인과 상의한 7번 초안). 장소·전투 연결은 여기서만 바꾼다.
// kind: 'rest'(경찰서 휴식) / 'fight'. fights: 순서대로 치르는 전투(G.encounters 의 id). folders: 그 장소 보상에서 더 잘 나오는 카드 폴더.
window.GAIA = window.GAIA || {};
GAIA.flow = {
  steps: [
    { spot: 'police',    kind: 'rest',  title: '경찰서 — 출근, 심기일전' },
    { spot: 'club',      kind: 'fight', title: '클럽 — 댄서 잠입',        fights: ['e2', 'e3'],       folders: ['클럽', '스트립 댄서'] },
    { spot: 'warehouse', kind: 'fight', title: '뒷골목 — 쫓겨나서 당함',   fights: ['e1', 'e3', 'e5'], folders: ['뒷골목'] },
    { spot: 'police',    kind: 'rest',  title: '경찰서 — 심기일전' },
    { spot: 'club',      kind: 'fight', title: '클럽 — 재잠입',           fights: ['e2', 'e4'],       folders: ['클럽', '스트립 댄서'] },
    { spot: 'hotel',     kind: 'fight', title: '호텔 로비 — 발각',         fights: ['e5'],             folders: ['란제리'] },
    { spot: 'farm',      kind: 'fight', title: '착유농장 — 탈출',          fights: ['e3', 'e4'],       folders: ['트레이닝', '란제리'] },
    { spot: 'police',    kind: 'rest',  title: '경찰서 — 마지막 심기일전' },
    { spot: 'hotel',     kind: 'fight', title: '스위트룸 — 보스전',        fights: ['e6'],             folders: ['경찰관'] }
  ],
  // 2막 이후(한 바퀴 = 9단계). 3막부터는 이 표를 월드 레벨만 올리며 반복(임시). 마트·카지노는 입장 후 '출동'으로 전투.
  steps2: [
    { spot: 'police', kind: 'rest',  title: '경찰서 — 월급날' },
    { spot: 'mart',   kind: 'fight', title: '마트 — 장보기',         fights: ['e11'], folders: ['트레이닝'] },
    { spot: 'casino', kind: 'fight', title: '카지노 — 단속',         fights: ['e12'], folders: ['클럽'] },
    { spot: 'police', kind: 'rest',  title: '경찰서 — 심기일전' },
    { spot: 'studio', kind: 'fight', title: '촬영소 — 저질 영화 현장', fights: ['e13'], folders: ['란제리', '스트립 댄서'] },
    { spot: 'park',   kind: 'fight', title: '공원 — 산책',           fights: ['e14'], folders: ['트레이닝'] },
    { spot: 'villa',  kind: 'fight', title: '주인공 빌라 — 귀가',     fights: ['e15'], folders: ['란제리'] },
    { spot: 'police', kind: 'rest',  title: '경찰서 — 마지막 심기일전' },
    { spot: 'casino', kind: 'fight', title: 'VIP룸 — 보스전',        fights: ['e16'], folders: ['경찰관'] }
  ],
  // 보상 카드 등급 확률(%) — 임시
  reward: { normal: { '일반': 60, '특별': 33, '희귀': 7 }, elite: { '일반': 30, '특별': 50, '희귀': 20 }, boss: { '특별': 40, '희귀': 60 }, folderBoost: 2, count: 3 },
  rest: { healRatio: 0.4, minDeck: 6 },     // 임시: 휴식은 체력 40% 회복, 카드 정비는 1장 제거(덱 최소 6장)
  defeatHpRatio: 0.5                        // 임시: 패배하면 직전 경찰서로 후송, 체력 50%
};
