// 한 바퀴(진행표) 시뮬레이션: 체력 이월·보상·휴식 포함. 사용: node tests/run_sim.js [판수] [월드레벨들 예: 0,1,2]
global.window = global;
const d = __dirname + '/../';
['data/config.js','data/cards.js','data/enemies.js','data/dialogue.js','data/flow.js','js/engine.js'].forEach(f => { try { require(d + f); } catch (e) { if (!/dialogue/.test(f)) throw e; } });
const G = global.GAIA, C = G.config, F = G.flow;
const N = +process.argv[2] || 300, WLS = (process.argv[3] || '0,1,2').split(',').map(Number);
const pickPlay = S => {
  for (let g = 0; g < 40 && S.phase === 'player'; g++) {
    const pl = S.hand.filter(c => G.canPlay(S, c.uid).ok); if (!pl.length) break;
    const fi = S.enemies.findIndex(e => !e.arrested && !e.fled && e.intent.some(a => a.t === 'flee'));
    let c = null, t = S.enemies.findIndex(e => !e.arrested && !e.fled);
    if (fi >= 0) { c = pl.find(x => G.cards[x.id].ops.some(o => o.op === 'bind')); t = fi; }
    if (!c) c = pl[Math.floor(Math.random() * pl.length)];
    G.playCard(S, c.uid, t);
  }
};
function battle(enc, deck, hp, wl) {
  const S = G.newBattle({ enemies: enc.enemies, deck: deck, hp: hp, wl: wl }); let guard = 0;
  while (S.phase !== 'won' && S.phase !== 'lost' && guard++ < 80) { pickPlay(S); if (S.phase === 'player') G.endTurn(S); }
  return S;
}
function reward(kind, boost) {
  const w = F.reward[kind], pool = G.cardList.filter(c => w[c.grade]);
  const wt = pool.map(c => w[c.grade] * (boost.indexOf(c.folder) >= 0 ? F.reward.folderBoost : 1));
  let r = Math.random() * wt.reduce((a, b) => a + b, 0); for (let i = 0; i < pool.length; i++) { r -= wt[i]; if (r <= 0) return pool[i].id; } return pool[0].id;
}
WLS.forEach(wl => {
  let laps = 0, defeats = 0, hpLossByEnc = {}, cnt = {}, endHp = 0, bossWin = 0, bossTry = 0;
  for (let n = 0; n < N; n++) {
    let deck = C.starterDeck.slice(), hp = C.player.maxHp, step = 0, tries = 0, done = false;
    while (!done && tries++ < 60) {
      const s = F.steps[step];
      if (s.kind === 'rest') { hp = Math.min(C.player.maxHp, hp + Math.round(C.player.maxHp * F.rest.healRatio)); step++; if (step >= F.steps.length) done = true; continue; }
      let lost = false;
      for (const id of s.fights) {
        const enc = G.encounters.find(e => e.id === id), before = hp, S = battle(enc, deck, hp, wl);
        hpLossByEnc[id] = (hpLossByEnc[id] || 0) + (before - Math.max(0, S.p.hp)); cnt[id] = (cnt[id] || 0) + 1;
        if (id === 'e6') { bossTry++; if (S.result.win) bossWin++; }
        if (!S.result.win) { lost = true; break; }
        hp = Math.max(1, S.p.hp);
        if (S.result.reward) deck.push(reward(id === 'e6' ? 'boss' : id === 'e5' ? 'elite' : 'normal', s.folders || []));
      }
      if (lost) { defeats++; hp = Math.round(C.player.maxHp * F.defeatHpRatio); let i = step; while (i > 0 && F.steps[i].kind !== 'rest') i--; step = i; continue; }
      step++; if (step >= F.steps.length) done = true;
    }
    if (done) { laps++; endHp += hp; }
  }
  console.log('월드 Lv.' + wl + ' | 한 바퀴 완료 ' + laps + '/' + N + ' | 패배 평균 ' + (defeats / N).toFixed(2) + '회 | 보스전 승률 ' + (bossTry ? Math.round(bossWin / bossTry * 100) : '-') + '% | 전투별 평균 체력 손실 ' + Object.keys(cnt).sort().map(k => k + ':' + (hpLossByEnc[k] / cnt[k]).toFixed(1)).join(' '));
});
