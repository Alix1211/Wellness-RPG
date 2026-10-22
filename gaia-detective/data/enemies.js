// 적 데이터 — 1막. 기력(hp)이 0이 되면 탈진 = 체포. 임시 그림은 시트에서 잘라 쓴 것.
// 행동: atk(n, hits) / buff(str) / flee. cycle 을 순서대로 반복, 기력이 도주 비율 이하가 되면 도주를 시도.
window.GAIA = window.GAIA || {};
(function () {
  const A = (n, hits) => ({ t: 'atk', n: n, hits: hits || 1 });
  const B = (s) => ({ t: 'buff', str: s });
  const E = {
    barbari: { id:'barbari', name:'바바리맨',          kind:'normal', hp:42,  sprite:'enemy_barbari', h:1.00, cycle:[[A(6)],[A(7)],[A(8)],[A(6,2)]] },
    bouncer: { id:'bouncer', name:'클럽 바운서',        kind:'normal', hp:50,  sprite:'enemy_bouncer', h:1.08, cycle:[[A(8)],[B(1)],[A(10)],[A(7,2)]] },
    mohawk:  { id:'mohawk',  name:'모히칸 양아치',      kind:'normal', hp:38,  sprite:'enemy_mohawk',  h:1.00, cycle:[[A(5,2)],[A(7)],[A(4,3)],[B(1)]] },     // 임시 이름
    leopard: { id:'leopard', name:'레오파드 사장',      kind:'normal', hp:50,  sprite:'enemy_leopard', h:1.00, cycle:[[A(6)],[B(1)],[A(8)],[A(4,2)]] },     // 임시 이름
    macho:   { id:'macho',   name:'마초 강',           kind:'elite',  hp:105, sprite:'enemy_leopard', h:1.30, cycle:[[A(12)],[B(2)],[A(8,2)],[A(14)]] },    // 임시 그림
    // ── 2막: 경찰·시민(그림은 npc 컷아웃). 수치는 1막 적과 같은 눈금(임시) ──
    han:  { id:'han',  name:'신참 한동수',   kind:'normal', hp:36,  sprite:'enemy_han',  h:1.00, cycle:[[A(5)],[A(4,2)],[B(1)],[A(6)]] },
    seo:  { id:'seo',  name:'서 주임',       kind:'normal', hp:48,  sprite:'enemy_seo',  h:1.00, cycle:[[A(7)],[B(1)],[A(9)],[A(5,2)]] },
    yoon: { id:'yoon', name:'윤 순경',       kind:'elite',  hp:90,  sprite:'enemy_yoon', h:1.15, cycle:[[A(5,2)],[B(2)],[A(7,2)],[A(10)]] },
    ma:   { id:'ma',   name:'마 반장',       kind:'boss',   hp:240, sprite:'enemy_ma',   h:1.70, cycle:[[A(12)],[A(7,2)],[B(2),A(8)],[A(10,2)],[A(22)]] },
    civ1: { id:'civ1', name:'블랙 팀장',     kind:'elite',  hp:100, sprite:'enemy_civ1', h:1.25, cycle:[[A(11)],[B(2)],[A(8,2)],[A(13)]] },
    civ2: { id:'civ2', name:'레드',          kind:'normal', hp:44,  sprite:'enemy_civ2', h:1.00, cycle:[[A(6,2)],[A(9)],[B(1)],[A(7)]] },
    civ3: { id:'civ3', name:'중절모 사장님', kind:'normal', hp:46,  sprite:'enemy_civ3', h:1.00, cycle:[[A(6)],[B(1)],[A(8)],[A(4,3)]] },
    civ4: { id:'civ4', name:'복학생 민수',   kind:'normal', hp:36,  sprite:'enemy_civ4', h:1.00, cycle:[[A(4,2)],[A(6)],[A(3,3)],[B(1)]] },
    civ5: { id:'civ5', name:'오 예비역',     kind:'elite',  hp:95,  sprite:'enemy_civ5', h:1.20, cycle:[[A(10)],[B(2)],[A(7,2)],[A(12)]] },
    civ6: { id:'civ6', name:'푸른 알바생',   kind:'normal', hp:38,  sprite:'enemy_civ6', h:1.00, cycle:[[A(5)],[A(4,2)],[A(7)],[B(1)]] },
    civ7: { id:'civ7', name:'신문 아저씨',   kind:'normal', hp:42,  sprite:'enemy_civ7', h:1.00, cycle:[[A(6)],[B(1)],[A(7)],[A(8)]] },
    titan:   { id:'titan',   name:'타이탄 박',         kind:'boss',   hp:220, sprite:'enemy_bouncer', h:1.70, cycle:[[A(12)],[A(7,2)],[B(2),A(8)],[A(20)]] } // 임시 그림
  };
  GAIA.enemies = E;
  // 개발용 전투 목록
  GAIA.encounters = [
    // bg 는 개발용 임시 배정(스테이지 구조 확정 전)
    { id:'e1', name:'바바리맨 1명',            enemies:['barbari'], bg:'bg_alley.jpg' },
    { id:'e2', name:'바운서 1명',              enemies:['bouncer'], bg:'bg_club.jpg' },
    { id:'e3', name:'양아치 + 레오파드 사장',   enemies:['mohawk','leopard'], bg:'bg_lounge2.jpg' },
    { id:'e4', name:'바바리맨 + 양아치 + 바운서', enemies:['barbari','mohawk','bouncer'], bg:'bg_stage.jpg' },
    { id:'e5', name:'엘리트 마초 강',          enemies:['macho'], bg:'bg_lobby2.jpg' },
    { id:'e6', name:'보스 타이탄 박',          enemies:['titan'], bg:'bg_wedding.jpg' },
    // ── 2막 (bg 'place_<장소>' = place/<장소>_port|land.webp) ──
    { id:'e11', name:'마트 장보기',     enemies:['seo','civ4'],  bg:'place_mart' },
    { id:'e12', name:'카지노 단속',     enemies:['han','civ6'],  bg:'place_casino' },
    { id:'e13', name:'촬영소 저질 영화', enemies:['civ3','civ1'], bg:'place_studio' },
    { id:'e14', name:'공원 산책',       enemies:['civ7','civ2'], bg:'place_park' },
    { id:'e15', name:'빌라 귀가',       enemies:['yoon'],        bg:'place_villa' },
    { id:'e16', name:'VIP룸 보스 마 반장', enemies:['civ6','ma','civ4'], bg:'place_casino' }
  ];
  GAIA.assets = {
    base: '../assets/gaia-detective/game/',
    hero: { idle:'hero_idle.png', shy:'hero_shy.png', cry:'hero_cry.png', serious:'hero_serious_guard.png', jab:'hero_serious_jab.png', kick:'hero_serious_kick.png', fly:'hero_flyback.png' },
    bgBase: '../assets/gaia-detective/bg/',
    bg: ['bg_lobby2.jpg', 'bg_lounge2.jpg', 'bg_alley.jpg', 'bg_club.jpg', 'bg_stage.jpg', 'bg_wedding.jpg'],
    sfxBase: '../assets/gaia-detective/sfx/',
    cardArt: '../assets/gaia-detective/cards/'
  };
})();
