// 50장 전체(초안 포함)를 섞은 덱으로 무작위 플레이 — 오류·규칙 위반만 점검
global.window = global;
const d = __dirname + '/../';
['data/config.js','data/cards.js','data/enemies.js','js/engine.js'].forEach(f => require(d + f));
const G = global.GAIA, C = G.config; const ids = G.cardListAll.map(c => c.id);
const used = {}; let wins = 0, N = 300, bad = 0;
G.encounters.forEach(enc => {
  for (let i = 0; i < N; i++) {
    G.setSeed(5000 + i);
    const S = G.newBattle({ enemies: enc.enemies, deck: ids.concat(ids.slice(0, 10)) });
    let guard = 0;
    while (S.phase !== 'won' && S.phase !== 'lost' && guard++ < 60) {
      for (let k = 0; k < 40 && S.phase === 'player'; k++) {
        const pl = S.hand.filter(c => G.canPlay(S, c.uid).ok); if (!pl.length) break;
        const c = pl[Math.floor(Math.random() * pl.length)]; used[c.id] = (used[c.id] || 0) + 1;
        const t = S.enemies.findIndex(e => !e.arrested && !e.fled);
        G.playCard(S, c.uid, t);
        const p = S.p; if (p.dopa < 0 || p.dopa > 100 || p.tight < 0 || p.tight > 40 || p.lube < 0 || p.lube > 100 || p.energy < 0 || S.hand.length > C.player.handLimit || p.hp > p.maxHp) { bad++; }
      }
      if (S.phase === 'player') G.endTurn(S);
    }
    if (S.result && S.result.win) wins++;
  }
});
const missing = ids.filter(i => !used[i]);
console.log('전투', N * G.encounters.length, '승', wins, '규칙 위반', bad, '한 번도 안 쓰인 카드', missing.join(',') || '없음');
