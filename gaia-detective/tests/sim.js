// 무작위 플레이 시뮬레이션: 오류·규칙 위반 점검 + 승률 확인
global.window = global;
const d = __dirname + '/../';
['data/config.js','data/cards.js','data/enemies.js','js/engine.js'].forEach(f => require(d + f));
const G = global.GAIA, C = G.config;
function check(S, where) {
  const p = S.p;
  const bad = [];
  if (p.hp > p.maxHp) bad.push('hp>max');
  if (p.dopa < 0 || p.dopa > 100) bad.push('dopa ' + p.dopa);
  if (p.tight < 0 || p.tight > 40) bad.push('tight ' + p.tight);
  if (p.lube < 0 || p.lube > 100) bad.push('lube ' + p.lube);
  if (p.energy < 0) bad.push('energy ' + p.energy);
  if (S.hand.length > C.player.handLimit) bad.push('hand ' + S.hand.length);
  S.enemies.forEach(e => { if (e.hp < 0) bad.push('enemy hp<0'); });
  if (bad.length) throw new Error(where + ': ' + bad.join(','));
}
function smart(S) {
  // 도주 인텐트가 보이면 봉쇄 우선, 공격 인텐트면 질림 우선, 그 외 무작위
  for (let guard = 0; guard < 40; guard++) {
    const playable = S.hand.filter(c => G.canPlay(S, c.uid).ok);
    if (!playable.length) break;
    const fleeIdx = S.enemies.findIndex(e => !e.arrested && !e.fled && e.intent.some(a => a.t === 'flee'));
    let pick = null, tgt;
    if (fleeIdx >= 0) { pick = playable.find(c => G.cards[c.id].ops.some(o => o.op === 'bind')); tgt = fleeIdx; }
    if (!pick) pick = playable[Math.floor(Math.random() * playable.length)];
    let t = S.enemies.findIndex(e => !e.arrested && !e.fled);
    if (tgt != null) t = tgt;
    G.playCard(S, pick.uid, t);
    check(S, 'play ' + pick.id);
    if (S.phase !== 'player') return;
  }
}
const N = +process.argv[2] || 300;
G.encounters.forEach(enc => {
  let win = 0, noReward = 0, lossBoss = 0, turns = 0, hpLeft = 0, orgs = 0;
  for (let i = 0; i < N; i++) {
    G.setSeed(1000 + i);
    const S = G.newBattle({ enemies: enc.enemies });
    let guard = 0;
    while (S.phase === 'player' && guard++ < 60) {
      smart(S); if (S.phase !== 'player') break;
      G.endTurn(S); check(S, 'endTurn');
      S.events.forEach(e => { if (e.type === 'orgasm') orgs++; }); S.events.length = 0;
    }
    if (S.phase === 'won') { win++; if (!S.result.reward) noReward++; hpLeft += S.p.hp; }
    else if (S.phase === 'lost' && S.result.reason.includes('보스')) lossBoss++;
    turns += S.turn;
    if (guard >= 60) throw new Error('무한 루프 의심: ' + enc.name);
  }
  console.log(enc.name.padEnd(22), '승률', (win / N * 100).toFixed(0) + '%', '| 놓침(보상없음)', noReward, '| 평균 턴', (turns / N).toFixed(1), '| 승리 시 평균 체력', win ? (hpLeft / win).toFixed(0) : '-', '| 절정 발동/판', (orgs / N).toFixed(2));
});
console.log('시뮬레이션 완료 — 규칙 위반 없음');
