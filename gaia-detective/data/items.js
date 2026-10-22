// 소모품(포션) 데이터 — 뼈대만 있음. 종류·효과·가격은 케인과 정한 뒤 채운다. (런 상태의 gold, items 에 연결될 자리)
// 예정 구조: { id, name, icon(키), effect: { op:'heal'|'dopa'|'lube'|..., n }, price, slotType:'potion' } / 소지 한도 3칸
window.GAIA = window.GAIA || {};
GAIA.items = { list: [], slots: 3 };
