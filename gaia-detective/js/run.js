// 런 상태(덱·체력·진행) 저장 + 스테이지 진행·보상·휴식. 모든 규칙은 임시(HANDOFF 참고).
(function () {
  const G = window.GAIA, C = G.config, F = G.flow;
  const KEY = 'gaia_run_v1';
  const $ = id => document.getElementById(id);
  const rnd = a => a[Math.floor(Math.random() * a.length)];
  let run = null;

  function fresh() { return { v: 1, deck: C.starterDeck.slice(), hp: C.player.maxHp, gold: 0, items: [], wl: 0, lap: 1, step: 0, fi: 0, cleared: [] }; }
  function load() { try { const r = JSON.parse(localStorage.getItem(KEY)); if (r && r.v === 1 && Array.isArray(r.deck)) return r; } catch (e) {} return null; }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(run)); } catch (e) {} }
  run = load() || fresh();

  const cur = () => F.steps[run.step];
  function spotInfo(id) {
    const idxs = []; F.steps.forEach((s, i) => { if (s.spot === id) idxs.push(i); });
    if (!idxs.length) return { state: 'locked', sub: '아직 연결되지 않은 장소입니다', go: null };
    const c = cur();
    if (c.spot === id) return { state: 'open', title: c.title, go: c.kind === 'rest' ? '들어가기' : '출동',
      sub: c.kind === 'rest' ? '체력 회복 · 카드 정비' : '전투 ' + (run.fi + 1) + ' / ' + c.fights.length };
    if (idxs.every(i => run.cleared.indexOf(i) >= 0)) return { state: 'clear', sub: '이번 바퀴에서는 끝났습니다', go: null };
    return { state: 'locked', sub: '아직 갈 차례가 아닙니다', go: null };
  }

  // ── 패널(보상·휴식·안내) ──
  function panel(o) {
    $('pnTitle').textContent = o.title || ''; $('pnMsg').textContent = o.msg || '';
    const box = $('pnCards'); box.innerHTML = ''; box.className = o.cardsClass || '';
    if (o.cardsEl) box.appendChild(o.cardsEl);
    const bt = $('pnBtns'); bt.innerHTML = '';
    (o.buttons || []).forEach(b => { const e = document.createElement('button'); e.textContent = b.text; e.disabled = !!b.disabled; e.addEventListener('click', () => { if (G.sfx) G.sfx.play('click'); b.fn(e); }); bt.appendChild(e); b.el = e; });
    $('panel').classList.remove('hidden');
    return o;
  }
  const closePanel = () => $('panel').classList.add('hidden');
  const kFor = n => Math.max(0.55, Math.min(1.05, (innerWidth * 0.9 / n - 8) / (15.6 * innerHeight / 100)));

  // ── 흐름 ──
  function enter(spotId) {
    const c = cur(); if (!c || c.spot !== spotId) return;
    if (c.kind === 'rest') return rest();
    fight();
  }
  function fight() {
    const c = cur(), enc = G.encounters.find(e => e.id === c.fights[run.fi]);
    G.map.close(); G.ui.start(enc.id, { run: true, deck: run.deck, hp: run.hp, wl: run.wl });
  }
  function encKind(S) { return S.enemies.some(e => e.kind === 'boss') ? 'boss' : S.enemies.some(e => e.kind === 'elite') ? 'elite' : 'normal'; }

  function rewardCards(kind) {
    const w = F.reward[kind], boost = cur().folders || [], pool = G.cardList.filter(c => w[c.grade]);
    const out = [];
    while (out.length < Math.min(F.reward.count, pool.length)) {
      const wt = pool.filter(c => out.indexOf(c) < 0).map(c => [c, w[c.grade] * (boost.indexOf(c.folder) >= 0 ? F.reward.folderBoost : 1)]);
      let r = Math.random() * wt.reduce((s, x) => s + x[1], 0);
      for (const x of wt) { r -= x[1]; if (r <= 0) { out.push(x[0]); break; } }
    }
    return out;
  }
  function cardRow(list, k, onPick, selId) {
    const row = document.createElement('div'); row.className = 'cardrow'; row.style.setProperty('--k', k);
    list.forEach((d, i) => { const el = G.ui.cardEl(d.id, d.cost); el.classList.add('pick'); el.addEventListener('click', () => onPick(d, el, i)); row.appendChild(el); });
    return row;
  }

  function onEnd(S) {
    run.hp = Math.max(1, S.p.hp);
    if (!S.result.win) {
      save();
      return panel({ title: '수사 실패…', msg: S.result.reason + ' — 경찰서로 후송됩니다.', buttons: [{ text: '경찰서로', fn: () => { closePanel(); defeat(); } }] });
    }
    save();
    if (!S.result.reward) return afterFight();
    const kind = encKind(S), list = rewardCards(kind);
    const row = cardRow(list, kFor(list.length), d => {
      run.deck.push(d.id); save(); closePanel(); afterFight();
    });
    panel({ title: '보상 카드 선택', msg: '한 장을 덱에 넣습니다 (덱 ' + run.deck.length + '장)', cardsEl: row,
      buttons: [{ text: '넘기기', fn: () => { closePanel(); afterFight(); } }] });
  }
  function afterFight() {
    const c = cur(); run.fi++;
    if (run.fi < c.fights.length) { save(); return fight(); }
    stepDone();
  }
  function stepDone() {
    run.cleared.push(run.step); run.step++; run.fi = 0;
    if (run.step >= F.steps.length) {
      run.wl++; run.lap++; run.step = 0; run.cleared = []; save();
      return panel({ title: '한 바퀴 완료!', msg: '월드 레벨이 ' + run.wl + '이 되었습니다. 적이 더 강해집니다.', buttons: [{ text: '다음 바퀴', fn: () => { closePanel(); G.map.open(); } }] });
    }
    save(); G.map.open();
  }
  function defeat() {
    let i = run.step; while (i > 0 && F.steps[i].kind !== 'rest') i--;
    run.step = i; run.fi = 0; run.cleared = run.cleared.filter(x => x < i);
    run.hp = Math.max(run.hp, Math.round(C.player.maxHp * F.defeatHpRatio)); save(); G.map.open();
  }
  function rest() {
    const heal = Math.round(C.player.maxHp * F.rest.healRatio), full = run.hp >= C.player.maxHp;
    panel({ title: F.steps[run.step].title, msg: '체력 ' + run.hp + ' / ' + C.player.maxHp + ' · 덱 ' + run.deck.length + '장', buttons: [
      { text: '휴식 (체력 +' + heal + ')', disabled: full, fn: () => { run.hp = Math.min(C.player.maxHp, run.hp + heal); save(); closePanel(); stepDone(); } },
      { text: '카드 정비 (1장 제거)', disabled: run.deck.length <= F.rest.minDeck, fn: () => { closePanel(); trim(); } },
      { text: '그냥 나가기', fn: () => { closePanel(); stepDone(); } },
      { text: '지도로', fn: () => { closePanel(); G.map.open(); } }
    ] });
  }
  function trim() {
    let sel = -1;
    const ids = run.deck.map((id, i) => ({ id: id, i: i })).sort((a, b) => G.cards[a.id].no - G.cards[b.id].no);
    const row = cardRow(ids.map(x => G.cards[x.id]), 0.62, (d, el, n) => {
      sel = ids[n].i; [].forEach.call(row.children, c => c.classList.remove('chosen')); el.classList.add('chosen'); p.buttons[0].el.disabled = false;
    });
    row.classList.add('wrap');
    const p = panel({ title: '카드 정비', msg: '덱에서 뺄 카드 1장을 고르세요', cardsEl: row, cardsClass: 'scroll', buttons: [
      { text: '이 카드 제거', disabled: true, fn: () => { if (sel < 0) return; run.deck.splice(sel, 1); save(); closePanel(); stepDone(); } },
      { text: '취소', fn: () => { closePanel(); rest(); } }
    ] });
  }

  G.run = { get: () => run, save: save, spotInfo: spotInfo, enter: enter, onEnd: onEnd,
    reset: () => { run = fresh(); save(); },
    stepTitle: () => cur().title };
})();
