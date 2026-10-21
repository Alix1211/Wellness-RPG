// GAIA CITY: DETECTIVE — 규칙 수치 (한 곳에서 조정)
// '임시' 표시는 아직 확정되지 않은 규칙입니다. 값만 바꾸면 전체에 반영됩니다.
window.GAIA = window.GAIA || {};
GAIA.config = {
  player: { maxHp: 80, energy: 3, draw: 5, handLimit: 10 },
  dopamine: { max: 100, hitRatio: 1.0 },            // 피격 피해(방어도 계산 전)의 50%(내림)
  orgasm: { energyBonus: 2, damageMult: 2 },         // 절정: 에너지 +2, 공격 카드 2배. 발동 다음 턴은 재발동 불가
  tight: { max: 40, perHit: 1, reflectRatio: 0.5, enemyStrDown: 1, enemyStrFloor: -4, strDownMinTight: 1 },
  lube: { max: 100, drawThreshold: 30, discountThreshold: 70, decayPerTurn: 10 },
  weakMult: 0.75, vulnMult: 1.5,
  // ── 임시 규칙 (미확정) ──
  disgustEliteImmuneTurns: 2,     // 임시: 엘리트는 질림이 발동한 뒤 2턴 면역, 보스는 첫 공격 행동 1개만 취소
  lubeShortage: 'cannotPlay',     // 임시: 윤활도 소모가 모자라면 카드를 낼 수 없음
  fleeRatio: { normal: 0.2, elite: 0.15, boss: 0.1 }, // 임시: 기력이 이 비율 이하가 되면 도주 시도
  bossFledIsDefeat: true,         // 임시: 보스를 놓치면 패배
  starterDeck: ['C01','C01','C01','C01','C02','C02','C02','C02','C03','C04','C08','C09'] // 임시: 기본 4종 + 봉쇄·질림 체험용 2장
};
