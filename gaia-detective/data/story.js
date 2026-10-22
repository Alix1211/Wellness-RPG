// 지도 대화 장면 — 전부 임시 대사(케인이 "네가 하세요"라고 맡김, 2026-10-22). 고치려면 여기 대사만 바꾸면 된다.
// who: 'hero'(로지) 또는 npc 키. pose: 주인공 표정(shy/idle/serious/cry). {next}: 지금 불 켜진 장소 이름으로 바뀐다.
window.GAIA = window.GAIA || {};
GAIA.story = GAIA.story || {};
GAIA.story.npc = {
  chief: { name: '반장', img: 'npc/police/police_2.webp' },
  mate:  { name: '선배 경찰', img: 'npc/police/police_4.webp' }
};
GAIA.story.scenes = {
  // 처음 지도가 열릴 때(1막)
  act1: [
    { who: 'chief', text: '왔냐, 로지. 오늘부터 가이아 시티 순찰이다. 지도에서 불 켜진 곳이 오늘 갈 현장이야.' },
    { who: 'hero', pose: 'shy', text: '불 켜진 곳만 갈 수 있는 거죠? 꺼진 곳은 아직 못 들어가고요…' },
    { who: 'chief', text: '그래. 순서대로 하나씩이다. 지금 불 켜진 곳은 {next}. 건물을 눌러서 들어가라.' },
    { who: 'hero', pose: 'idle', text: '알겠습니다, 반장님! 오늘도 체포 실적 쌓아 오겠습니다!' },
    { who: 'chief', text: '…맞고 오지나 마라. 힘들면 경찰서에서 쉬고, 카드 정비도 거기서 한다.' }
  ],
  // 새 지도가 열릴 때(2막)
  act2: [
    { who: 'mate', text: '로지! 관할 구역이 넓어졌어. 새 지도 받았지?' },
    { who: 'hero', pose: 'idle', text: '마트, 카지노, 촬영소… 처음 보는 곳이 많네요.' },
    { who: 'mate', text: '이번에도 불 켜진 곳이 오늘 갈 곳이야. 지금은 {next}.' },
    { who: 'mate', text: '집은 언제든 들러서 체력단련 할 수 있고, 마트랑 카지노도 언제든 이용할 수 있어. 월급은 아껴 써.' },
    { who: 'hero', pose: 'shy', text: '넵! 단속하고 장도 보고 오겠습니다!' }
  ]
};
