// 스테이지 지도 데이터 — 지도 2장(기존 5곳 + 새 6곳). 가로 화면은 좌우, 세로 화면은 위아래로 이어 붙인다.
// 좌표는 지도 원본(1672×941) 기준 픽셀. 건물은 낱장 레이어라 상태(잠김/열림)를 건물 단위로 준다.
// enc: 임시로 연결해 둔 전투(스테이지 구조 확정 전). null 이면 아직 연결 안 된 곳(회색, 출동 불가).
window.GAIA = window.GAIA || {};
(function () {
  GAIA.map = GAIA.map || {};
  GAIA.map.data = {
    base: '../assets/gaia-detective/map/layers/',
    w: 1672, h: 941,
    start: 'police',
    sheets: [
      { id: 'old', ground: 'old_ground', spots: [
        { id: 'police',    name: '경찰서',   layer: 'old_police',    x: 186,  y: 70,  w: 328, h: 291, enc: null },
        { id: 'hotel',     name: '호텔',     layer: 'old_hotel',     x: 827,  y: 38,  w: 409, h: 361, enc: 'e5' },
        { id: 'warehouse', name: '뒷골목',   layer: 'old_warehouse', x: 28,   y: 512, w: 534, h: 340, enc: 'e1' },
        { id: 'club',      name: '클럽',     layer: 'old_club',      x: 791,  y: 475, w: 441, h: 399, enc: 'e2' },
        { id: 'farm',      name: '착유농장', layer: 'old_farm',      x: 1390, y: 347, w: 242, h: 224, enc: 'e4' }
      ] },
      { id: 'new', ground: 'new_ground', spots: [
        { id: 'casino',   name: '카지노',      layer: 'new_casino',   x: 170, y: 2,   w: 493, h: 245, enc: null },
        { id: 'district', name: '환락가',      layer: 'new_district', x: 810, y: 64,  w: 383, h: 244, enc: null },
        { id: 'studio',   name: '영화 촬영소', layer: 'new_studio',   x: 65,  y: 387, w: 531, h: 233, enc: null },
        { id: 'mart',     name: '마트',        layer: 'new_mart',     x: 826, y: 424, w: 325, h: 186, enc: null },
        { id: 'villa',    name: '주인공 집',   layer: 'new_villa',    x: 299, y: 654, w: 277, h: 192, enc: null },
        { id: 'park',     name: '공원',        layer: null,           x: 1215, y: 230, w: 430, h: 570, enc: null }
      ] }
    ]
  };
})();
