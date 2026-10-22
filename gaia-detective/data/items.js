// 아이템 도감 — 64종. 그림 키(a00~c19)는 assets/gaia-detective/ui/items/<키>.webp 와 같습니다.
// type: relic(유물: 착용 최대 6, 패시브) / cons(소모품: 전투 중 사용) / junk(잡템: 효과 없음, 팔아서 용돈)
// src: 얻는 곳 — drop(몹 드롭) / mart / casino / slot(슬롯머신 경품). 마트·카지노·슬롯 화면은 아직 없음(데이터만 표시).
// price: 사는 가격. 파는 값은 sellRate(절반).
window.GAIA = window.GAIA || {};
(function () {
  const L = [], by = {};
  const J = ['drop', 'slot', 'mart'], K = ['drop', 'mart', 'casino'], R = ['drop', 'casino'], R2 = ['casino'];
  const add = (id, name, type, price, fx, src) => { const d = { id: id, name: name, type: type, price: price, fx: fx || {}, src: src, tier: type === 'relic' ? (price >= 380 ? 3 : price >= 200 ? 2 : 1) : 0 }; L.push(d); by[id] = d; };
  // ── 잡템 (효과 없음) ──
  [['a00', '분홍 방긋이', 30], ['a01', '보라 리본이', 35], ['a02', '하트눈 컵', 40], ['a03', '보라 줄무늬 컵', 40], ['a04', '토끼 진동이', 55], ['a05', '하늘 말랑이', 30],
   ['a06', '하트 마개', 45], ['a07', '보라 누움이', 35], ['a11', '분홍 매듭 밧줄', 25], ['a12', '분홍 채찍', 50], ['a13', '하트 찰싹이', 45], ['a16', '분홍 방망이', 60],
   ['a17', '깃털 먼지털이', 25], ['a19', '하트 집게 사슬', 40], ['b04', '분홍 안락의자', 70], ['b06', '보라 X 수갑', 65], ['b07', '하트 가로대', 40], ['b08', '보라 방울 재갈', 45],
   ['b09', '하트 손잡이 찰싹이', 50], ['b12', '하트 자물쇠 삼형제', 35], ['b16', '매달림 수갑 A', 45], ['b17', '매달림 수갑 B', 45], ['b19', '분홍 리본 밧줄', 30], ['b20', '분홍 가방 상자', 55],
   ['c03', '둥근 밧줄', 25], ['c04', '리본 술 채찍', 50], ['c05', '검정 하트 찰싹이', 55], ['c08', '분홍 방망이 2호', 60], ['c09', '날씬 진동이', 55], ['c10', '보석 하트 마개', 90], ['c11', '검정 하트 마개', 70]
  ].forEach(x => add(x[0], x[1], 'junk', x[2], {}, J));
  // ── 소모품 (전투 중 사용) ──
  add('a18', '드림 오일', 'cons', 50, { lube: 40 }, K); add('a20', '러브 글라이드', 'cons', 90, { lube: 70 }, K); add('a21', '방긋 향초', 'cons', 55, { dopa: 25 }, K);
  add('b10', '하트 테이프', 'cons', 55, { tight: 6 }, K); add('c12', '간지럼 깃털', 'cons', 80, { vulnAll: 2 }, K); add('c13', '분홍 하트 집게', 'cons', 120, { energy: 1 }, K);
  add('c14', '펌프 보틀', 'cons', 60, { heal: 15 }, K); add('c15', '튜브 로션', 'cons', 45, { block: 10 }, K); add('c16', '하트 향초', 'cons', 100, { dopa: 50 }, K); add('c17', '리본 테이프', 'cons', 100, { tight: 12 }, K);
  // ── 유물 (착용, 최대 6) ──
  add('a10', '하트 방울 초커', 'relic', 120, { startBlock: 4 }, R); add('b05', '자물쇠 목걸이', 'relic', 120, { startTight: 4 }, R); add('c02', '보라 리본 초커', 'relic', 130, { startLube: 20 }, R);
  add('c18', '하트 초커', 'relic', 130, { startDopa: 10 }, R); add('c19', '보라 리본 안대', 'relic', 140, { startBlock: 5 }, R); add('a08', '하트 수갑', 'relic', 150, { healAfter: 5 }, R);
  add('c07', '눈웃음 안대', 'relic', 150, { startTight: 5 }, R); add('b11', '리본 안대', 'relic', 160, { startLube: 25 }, R); add('b02', '폭신 자물쇠 수갑', 'relic', 170, { startBlock: 6 }, R);
  add('b03', '폭신 자물쇠 팔찌', 'relic', 170, { startTight: 6 }, R); add('c00', '은사슬 하트 수갑', 'relic', 180, { goldPlus: 25 }, R); add('b21', '고양이 반가면', 'relic', 190, { startDopa: 15 }, R);
  add('b15', '보라 허벅지 하네스', 'relic', 200, { startLube: 30 }, R); add('a15', '잠꾸러기 안대', 'relic', 200, { healAfter: 8 }, R); add('b00', '하트 하네스 조끼', 'relic', 240, { startBlock: 8 }, R);
  add('b01', '보라 코르셋', 'relic', 240, { startTight: 8 }, R); add('c01', '하트 방울 퍼 수갑', 'relic', 240, { startDopa: 20 }, R); add('b13', '분홍 장갑', 'relic', 260, { strPlus: 1 }, R);
  add('a09', '보송 수갑 세트', 'relic', 260, { healAfter: 10 }, R); add('a14', '보라 냥이 안대', 'relic', 300, { goldPlus: 50 }, R); add('b14', '하트 리드줄', 'relic', 380, { drawPlus: 1 }, R2);
  add('c06', '보라 냥이 눈가면', 'relic', 450, { strPlus: 2 }, R2); add('b18', '보라 왕관 새장', 'relic', 520, { energyPlus: 1 }, R2);
  const TXT = { startBlock: n => '전투 시작 시 방어도 +' + n, startTight: n => '전투 시작 시 조임력 +' + n, startLube: n => '전투 시작 시 윤활도 +' + n, startDopa: n => '전투 시작 시 도파민 +' + n,
    strPlus: n => '공격 피해 +' + n, drawPlus: n => '매 턴 카드 +' + n + '장', energyPlus: n => '매 턴 에너지 +' + n, healAfter: n => '전투 승리 시 체력 +' + n, goldPlus: n => '용돈 +' + n + '%',
    lube: n => '윤활도 +' + n, tight: n => '조임력 +' + n, dopa: n => '도파민 +' + n, heal: n => '체력 +' + n, block: n => '방어도 +' + n, energy: n => '에너지 +' + n, draw: n => '카드 +' + n + '장', vulnAll: n => '모든 적 취약 ' + n };
  GAIA.items = { list: L, byId: by, slots: 20, equipMax: 6, sellRate: 0.5, typeName: { relic: '유물', cons: '소모품', junk: '잡템' },
    describe: d => d.type === 'junk' ? '효과 없음 — 마트에 팔 수 있습니다' : Object.keys(d.fx).map(k => TXT[k](d.fx[k])).join(', ') + (d.type === 'cons' ? ' (전투 중 사용)' : ''),
    sell: d => Math.floor(d.price * 0.5) };
})();
