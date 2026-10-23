// 런 상태(덱·체력·진행) 저장 + 스테이지 진행·보상·휴식. 모든 규칙은 임시(HANDOFF 참고).
(function () {
  const G = window.GAIA, C = G.config, F = G.flow;
  const KEY = 'gaia_run_v1';
  const $ = id => document.getElementById(id);
  const rnd = a => a[Math.floor(Math.random() * a.length)];
  let run = null;

  function fresh() { return { v: 1, deck: C.starterDeck.slice(), hp: C.player.maxHp, gold: 0, items: [], equip: [], wl: 0, lap: 1, step: 0, fi: 0, cleared: [], grit: 0 }; }
  function load() { try { const r = JSON.parse(localStorage.getItem(KEY)); if (r && r.v === 1 && Array.isArray(r.deck)) return r; } catch (e) {} return null; }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(run)); } catch (e) {} }
  // 마조 성장(임시): 질 때마다 '단련'이 1씩 올라 최대 체력 +6, 3단계마다 공격력 +1 (최대 12단계)
  const GRIT_MAX = 12, GRIT_HP = 6;
  const BASE_HP = C.player.maxHp;
  function applyGrit() { C.player.maxHp = BASE_HP + GRIT_HP * (run.grit || 0); }
  run = load() || fresh(); run.grit = run.grit || 0; applyGrit(); run.equip = run.equip || []; run.items = run.items || []; run.gold = run.gold || 0;

  const STEPS = () => run.lap > 1 && F.steps2 ? F.steps2 : F.steps; // 1막(1바퀴) 뒤로는 2막 표를 반복
  const cur = () => STEPS()[run.step];
  const SHOPS = { mart: '마트', casino: '카지노' };
  const ENTRY = { police: 1, studio: 1, park: 1, villa: 1, club: 1, farm: 1 }; // 입장 화면(점원·선택지)이 있는 장소
  const HOME = { villa: 1 }; // 주인공 집 — 체력단련(스쿼트)은 언제든. 이번 단계가 집이면 전투도 이어서 가능
  const here = id => { const c = cur(); return c && c.spot === id ? c : null; };
  function spotInfo(id) {
    if (HOME[id]) { const h = here(id); return { state: 'open', title: h ? h.title : '', go: '들어가기', sub: h ? '전투 ' + (run.fi + 1) + ' / ' + h.fights.length + ' · 체력단련도 가능' : '체력단련 · 언제든 들를 수 있습니다' }; }
    if (SHOPS[id]) { const h = here(id); return { state: 'open', title: h ? h.title : SHOPS[id], sub: h ? '전투 ' + (run.fi + 1) + ' / ' + h.fights.length + ' · 상점도 이용 가능' : '언제든 들를 수 있습니다 (사고 팔기)', go: '들어가기' }; }
    const idxs = []; STEPS().forEach((s, i) => { if (s.spot === id) idxs.push(i); });
    if (!idxs.length) return { state: 'locked', sub: '아직 연결되지 않은 장소입니다', go: null };
    const c = cur();
    if (c.spot === id) return { state: 'open', title: c.title, go: ENTRY[id] || c.kind === 'rest' ? '들어가기' : '출동',
      sub: c.kind === 'rest' ? '체력 회복 · 카드 정비' : '전투 ' + (run.fi + 1) + ' / ' + c.fights.length };
    if (idxs.every(i => run.cleared.indexOf(i) >= 0)) return { state: 'clear', sub: '이번 바퀴에서는 끝났습니다', go: null };
    return { state: 'locked', sub: '아직 갈 차례가 아닙니다', go: null };
  }

  // ── 패널(보상·휴식·안내) ──
  function panel(o) {
    const pl = o.place ? (window.GAIA_IMG ? (window.GAIA_IMG['place/' + o.place + '_port.webp'] || '') : '../assets/gaia-detective/place/' + o.place + '_port.webp') : '';
    $('panel').style.background = pl ? 'linear-gradient(rgba(80,30,60,.22),rgba(80,30,60,.22)),url(' + pl + ') center/cover no-repeat' : '';
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
    if (SHOPS[spotId] || ENTRY[spotId]) return G.shop.open(spotId);
    go(spotId);
  }
  // 현재 단계가 이 장소면 휴식/전투 시작(입장 화면의 '출동'·'들어가기'가 부름)
  function go(spotId) {
    const c = cur(); if (!c || c.spot !== spotId) return;
    if (c.kind === 'rest') return rest();
    fight();
  }
  function fight() {
    const c = cur(), enc = G.encounters.find(e => e.id === c.fights[run.fi]);
    G.map.close(); G.ui.start(enc.id, { run: true, deck: run.deck, hp: run.hp, wl: run.wl, relics: run.equip, grit: run.grit });
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
    k = Math.min(k, Math.round(0.8 * innerWidth / innerHeight * 100 / (18 * Math.min(3, Math.max(1, list.length))) * 100) / 100);
    const row = document.createElement('div'); row.className = 'cardrow'; row.style.setProperty('--k', k);
    list.forEach((d, i) => { const el = G.ui.cardEl(d.id, d.cost); el.classList.add('pick'); el.addEventListener('click', () => onPick(d, el, i)); row.appendChild(el); });
    return row;
  }

  function onEnd(S) {
    run.hp = Math.max(1, S.p.hp);
    if (S.result.win && S.rel && S.rel.healAfter) run.hp = Math.min(C.player.maxHp, run.hp + S.rel.healAfter);
    if (!S.result.win) {
      const up = run.grit < GRIT_MAX; if (up) { run.grit++; applyGrit(); }
      save();
      return panel({ title: '수사 실패…', msg: S.result.reason + ' — 경찰서로 후송됩니다.' + (up ? '\n단련 Lv.' + run.grit + ' ↑ 최대 체력 ' + C.player.maxHp + (run.grit % 3 === 0 ? ' · 공격력 +1' : '') : '\n단련 최대치(Lv.' + GRIT_MAX + ')'), buttons: [{ text: '경찰서로', fn: () => { closePanel(); defeat(); } }] });
    }
    save();
    if (!S.result.reward) return afterFight();
    const kind = encKind(S), list = rewardCards(kind), loot = lootText(grantLoot(kind, S));
    const row = cardRow(list, kFor(list.length), d => {
      run.deck.push(d.id); save(); closePanel(); afterFight();
    });
    panel({ title: '보상 카드 선택', msg: loot + '한 장을 덱에 넣습니다 (덱 ' + run.deck.length + '장)', cardsEl: row,
      buttons: [{ text: '넘기기', fn: () => { closePanel(); afterFight(); } }] });
  }
  // ── 용돈·아이템 획득 (임시 수치) ──
  const IT = () => G.items.list;
  function pickItem(types, tiers) { const pool = IT().filter(d => types.indexOf(d.type) >= 0 && d.src.indexOf('drop') >= 0 && (!tiers || d.type !== 'relic' || tiers.indexOf(d.tier) >= 0)); return pool.length ? rnd(pool) : null; }
  function grantLoot(kind, S) {
    const base = { normal: 12, elite: 32, boss: 80 }[kind] * (1 + 0.1 * run.wl);
    const bonus = 1 + ((S.rel && S.rel.goldPlus) || 0) / 100;
    const gold = Math.round(base * (0.8 + Math.random() * 0.4) * bonus); run.gold += gold;
    let it = null, r = Math.random();
    if (kind === 'normal') { if (r < 0.35) it = pickItem(r < 0.1 ? ['cons'] : ['junk']); }
    else if (kind === 'elite') it = pickItem(r < 0.4 ? ['cons'] : r < 0.8 ? ['relic'] : ['junk'], [1, 2]);
    else it = pickItem(['relic'], [2, 3]);
    let full = false;
    if (it) { if (run.items.length < G.items.slots) run.items.push(it.id); else { full = true; } }
    save(); return { gold: gold, item: it, full: full };
  }
  const lootText = g => '용돈 +' + g.gold + '원' + (g.item ? (g.full ? ' · ' + g.item.name + '(소지품이 가득 차 놓침)' : ' · 획득: ' + g.item.name) : '') + '\n';
  function afterFight() {
    const c = cur(); run.fi++;
    if (run.fi < c.fights.length) { save(); return fight(); }
    stepDone();
  }
  function stepDone() {
    run.cleared.push(run.step); run.step++; run.fi = 0;
    if (run.step >= STEPS().length) {
      run.wl++; run.lap++; run.step = 0; run.cleared = []; save();
      return panel({ title: '한 바퀴 완료!', msg: '월드 레벨이 ' + run.wl + '이 되었습니다. 적이 더 강해집니다.', buttons: [{ text: '다음 바퀴', fn: () => { closePanel(); G.map.open(); } }] });
    }
    save(); G.map.open();
  }
  function defeat() {
    let i = run.step; while (i > 0 && STEPS()[i].kind !== 'rest') i--;
    run.step = i; run.fi = 0; run.cleared = run.cleared.filter(x => x < i);
    run.hp = Math.max(run.hp, Math.round(C.player.maxHp * F.defeatHpRatio)); save(); G.map.open();
  }
  function rest() {
    const heal = Math.round(C.player.maxHp * F.rest.healRatio), full = run.hp >= C.player.maxHp;
    panel({ place: 'police', title: cur().title, msg: '체력 ' + run.hp + ' / ' + C.player.maxHp + ' · 단련 Lv.' + run.grit + ' · 덱 ' + run.deck.length + '장', buttons: [
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

  G.run = { get: () => run, save: save, spotInfo: spotInfo, enter: enter, go: go, here: here, onEnd: onEnd,
    reset: () => { run = fresh(); applyGrit(); save(); },
    stepTitle: () => cur().title };
})();
