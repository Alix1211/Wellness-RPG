// 경찰서 맷집 강화 훈련 — 컨베이어 배팅 미니게임. Wellness 컨베이어 배팅을 새 그림(경찰관 타자·로지 대기·비행)으로 바꾼 것.
// 게임 본체는 assets/gaia-detective/minigame/batting_police/game.html (단일 빌드에서는 GAIA_DOC 로 들어감). 규칙 수치는 그 문서 안 RULES 에 있음.
// 그림 배정: images = [배경(경찰서 장소 배경), 대기(숙인 뒷모습), 비행, 타자 스윙 6컷]. 시작 화면은 탭 시작(tapStart)으로 최소화.
(function () {
  const G = window.GAIA;
  const MINI=p=>(window.MINI_ASSETS&&window.MINI_ASSETS[p])||('assets/'+p);
  const img = k => MINI('minigame/batting_police/' + k);
  const place = () => MINI('place/police_' + (innerWidth > innerHeight * 1.15 ? 'land' : 'port') + '.webp');
  const tierOf = wl => Math.max(1, Math.min(3, 1 + Math.floor((wl || 0) / 2))); // 난이도: 월드 레벨에 따라 쉬움→보통→어려움 [임시]
  G.minigame.register('batting', {
    // APK에 고정된 mini-assets 대신 자동 업데이트되는 원본 문서를 읽는다.
    docUrl: 'assets/minigame/batting_police/game.html',
    transformDoc: doc => doc
      .replace("function makeHit(k){", "function makeHit(k){if(k==='swing'){const rate=ac.sampleRate,b=ac.createBuffer(1,Math.ceil(rate*.16),rate),a=b.getChannelData(0);let low=0;for(let i=0;i<a.length;i++){const t=i/a.length,n=Math.random()*2-1;low+=.12*(n-low);a[i]=(n-low)*Math.sin(Math.PI*t)*.24;}return b;}")
      .replace("(k==='hit_slap'||k==='hit_punch')", "(k==='hit_slap'||k==='hit_punch'||k==='swing')")
      .replace("function sfx(name){if(!solo)send('wellness-sfx',{name});}", "function sfx(name){if(name==='swing')Sound.play('swing');else if(!solo)send('wellness-sfx',{name});}"),
    cfg: opts => ({
      tapStart: true, difficulty: tierOf(opts.wl), location: 'center',
      images: [place(), img('standby.png'), img('flight.png'), img('batter_0.png'), img('batter_1.png'), img('batter_2.png'), img('batter_3.png'), img('batter_4.png'), img('batter_5.png')]
    }),
    sounds: () => ({})
  });
})();
