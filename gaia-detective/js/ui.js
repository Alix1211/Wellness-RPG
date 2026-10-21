// 전투 화면 — 엔진 상태 S 를 그리고, S.events 를 연출로 재생한다.
(function () {
  const G = window.GAIA, C = G.config, A = G.assets;
  const $ = id => document.getElementById(id);
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  let S = null, encId = 'e1', selUid = null, busy = false, bgN = 0, heroOverride = null;

  // ── 이미지 경로 ──
  const heroSrc = k => A.base + A.hero[k];
  const sprite = e => A.base + e.def.sprite + '.png';

  // ── 시작 ──
  function start(id) {
    encId = id || encId;
    const enc = G.encounters.find(x => x.id === encId);
    S = G.newBattle({ enemies: enc.enemies });
    selUid = null; busy = false; heroOverride = null;
    $('overlay').classList.add('hidden');
    $('bg').style.backgroundImage = 'url(' + A.base + A.bg[(bgN++) % A.bg.length] + ')';
    buildEnemies();
    S.events = [];
    render();
    banner('수사 개시!');
  }

  // ── 렌더 ──
  function pct(v, m) { return Math.max(0, Math.min(100, v / m * 100)) + '%'; }
  function heroPose() {
    if (heroOverride) return heroOverride;
    if (S.p.orgActive) return 'serious';
    if (S.p.hp / S.p.maxHp <= 0.3) return 'cry';
    return 'idle';
  }
  function render() {
    const p = S.p;
    $('hpFill').style.width = pct(p.hp, p.maxHp); $('hpTxt').textContent = p.hp + ' / ' + p.maxHp;
    $('dopaFill').style.width = pct(p.dopa, C.dopamine.max); $('dopaTxt').textContent = p.dopa + (p.orgActive ? ' 절정!' : p.orgCd ? ' (휴식)' : '');
    $('dopaBar').classList.toggle('ready', p.dopa >= C.dopamine.max || p.orgActive);
    $('tightFill').style.width = pct(p.tight, C.tight.max); $('tightTxt').textContent = p.tight;
    $('lubeFill').style.width = pct(p.lube, C.lube.max); $('lubeTxt').textContent = p.lube;
    $('turnNo').textContent = S.turn;
    const en = $('energy'); en.innerHTML = '';
    const total = Math.max(C.player.energy + (p.orgActive ? C.orgasm.energyBonus : 0), p.energy);
    for (let i = 0; i < total; i++) { const o = document.createElement('div'); o.className = 'orb' + (i < p.energy ? '' : ' off'); en.appendChild(o); }
    $('blockTag').textContent = p.block > 0 ? '🛡 ' + p.block : '';
    $('heroImg').src = heroSrc(heroPose());
    $('field').classList.toggle('orgmode', p.orgActive);
    renderEnemies();
    renderHand();
    $('nDraw').textContent = S.drawPile.length; $('nDisc').textContent = S.discard.length;
    $('nExh').textContent = S.exhaust.length ? '소멸 ' + S.exhaust.length : '';
    $('endTurn').disabled = busy || S.phase !== 'player';
    const needT = selUid != null;
    $('hintBar').classList.toggle('on', needT);
    if (needT) $('hintBar').textContent = '대상을 선택하세요 (카드를 다시 누르면 취소)';
  }

  function buildEnemies() {
    const box = $('enemies'); box.innerHTML = '';
    S.enemies.forEach((e, i) => {
      const el = document.createElement('div'); el.className = 'enemy'; el.dataset.i = i;
      const hVh = 34 * (e.def.h || 1) / (S.enemies.length > 2 ? 1.12 : 1);
      el.innerHTML = '<div class="intent"></div><img alt="" style="height:' + hVh + 'vh"><div class="estat"><div class="ename"></div><div class="bar"><i></i><b></b></div><div class="chips"></div></div>';
      el.querySelector('img').src = sprite(e);
      el.addEventListener('click', () => onEnemy(i));
      box.appendChild(el);
    });
  }
  function renderEnemies() {
    const els = $('enemies').children;
    S.enemies.forEach((e, i) => {
      const el = els[i]; if (!el) return;
      const live = !e.arrested && !e.fled;
      el.classList.toggle('arrested', e.arrested);
      el.classList.toggle('fled', e.fled);
      el.classList.toggle('disgust', e.disgust > 0 && live);
      el.classList.toggle('targetable', live && selUid != null && needsTargetNow());
      el.querySelector('.ename').innerHTML = (e.kind === 'elite' ? '<em>엘리트</em>' : e.kind === 'boss' ? '<em>보스</em>' : '') + e.name;
      el.querySelector('.bar i').style.width = pct(e.hp, e.maxHp);
      el.querySelector('.bar b').textContent = e.hp + ' / ' + e.maxHp;
      const it = el.querySelector('.intent');
      if (!live) it.innerHTML = '';
      else it.innerHTML = G.intentInfo(S, e).map(a => {
        if (a.kind === 'atk') return '<span class="atk">' + (e.disgust > 0 ? '🚫' : '⚔') + a.n + (a.hits > 1 ? '×' + a.hits : '') + '</span>';
        if (a.kind === 'buff') return '<span class="buff">💪+' + a.n + '</span>';
        return '<span class="flee">💨 도주!</span>';
      }).join('');
      const chips = [];
      if (e.str) chips.push('힘 ' + (e.str > 0 ? '+' : '') + e.str);
      if (e.weak) chips.push('약화 ' + e.weak);
      if (e.vuln) chips.push('취약 ' + e.vuln);
      if (e.bound) chips.push('봉쇄');
      if (e.disgust) chips.push('질림');
      if (e.immune) chips.push('질림면역 ' + e.immune);
      el.querySelector('.chips').innerHTML = chips.map(c => '<span class="chip">' + c + '</span>').join('');
      let st = el.querySelector('.stamp');
      if ((e.arrested || e.fled) && !st) { st = document.createElement('div'); st.className = 'stamp'; st.textContent = e.arrested ? '체포!' : '놓침…'; el.appendChild(st); }
    });
  }
  function needsTargetNow() { const c = S.hand.find(h => h.uid === selUid); return c && G.cards[c.id].needsTarget; }

  function renderHand() {
    const h = $('hand'); h.innerHTML = '';
    const n = S.hand.length;
    S.hand.forEach((c, i) => {
      const d = G.cards[c.id], chk = G.canPlay(S, c.uid), cost = G.cost(S, c);
      const el = document.createElement('div');
      el.className = 'card t-' + d.type + ' g-' + d.grade + (chk.ok ? '' : ' dis') + (selUid === c.uid ? ' sel' : '');
      const reduced = cost < d.cost;
      el.innerHTML = '<div class="cost' + (reduced ? ' dc' : '') + '">' + cost + '</div><div class="cname">' + d.name + '</div>' +
        '<div class="art" style="background:' + artColor(d) + '"><img alt="" onerror="this.remove()" src="' + A.cardArt + d.id + '.webp"><span>' + d.folder + '</span></div>' +
        '<div class="meta">' + d.type + ' · ' + d.grade + '</div><div class="ctext">' + d.text + '</div>' + (d.exhaust ? '<div class="ex">소멸</div>' : '');
      if (n > 6) el.style.marginLeft = el.style.marginRight = (-0.6 - (n - 6) * 0.5) + 'vh';
      const rot = (i - (n - 1) / 2) * 2.2; el.style.rotate = rot + 'deg';
      el.title = chk.ok ? '' : chk.reason;
      el.addEventListener('click', () => onCard(c.uid));
      h.appendChild(el);
    });
  }
  function artColor(d) { return d.type === '공격' ? 'linear-gradient(135deg,#ff8fb8,#c46bd6)' : d.type === '스킬' ? 'linear-gradient(135deg,#7ec8ff,#8f74e6)' : 'linear-gradient(135deg,#ffd36b,#ff8fb8)'; }

  // ── 입력 ──
  function onCard(uid) {
    if (busy || S.phase !== 'player') return;
    if (selUid === uid) { selUid = null; render(); return; }
    const chk = G.canPlay(S, uid);
    if (!chk.ok) { float(chk.reason, 'heroCenter', 'st'); return; }
    const c = S.hand.find(h => h.uid === uid), d = G.cards[c.id];
    if (d.needsTarget) {
      const live = S.enemies.map((e, i) => i).filter(i => !S.enemies[i].arrested && !S.enemies[i].fled);
      if (live.length === 1) { play(uid, live[0]); return; }
      selUid = uid; render();
    } else play(uid, null);
  }
  function onEnemy(i) {
    if (selUid == null || busy) return;
    const e = S.enemies[i]; if (e.arrested || e.fled) return;
    const uid = selUid; selUid = null; play(uid, i);
  }

  async function play(uid, tIdx) {
    busy = true; selUid = null;
    const card = S.hand.find(h => h.uid === uid), d = G.cards[card.id];
    G.playCard(S, uid, tIdx);
    const hit = d.type === '공격';
    if (hit) { heroOverride = S.p.orgActive ? (d.cost >= 2 ? 'kick' : 'jab') : null; }
    render();
    if (hit) { $('heroImg').classList.add('lunge'); }
    await playEvents();
    $('heroImg').classList.remove('lunge');
    heroOverride = null; busy = false; render();
    if (S.phase === 'won' || S.phase === 'lost') finish();
  }

  $('endTurn').addEventListener('click', async () => {
    if (busy || S.phase !== 'player') return;
    busy = true; selUid = null; render();
    G.endTurn(S);
    await playEvents(true);
    busy = false; render();
    if (S.phase === 'won' || S.phase === 'lost') finish();
  });

  // ── 연출 ──
  function pos(idx) {
    if (idx === 'heroCenter') { const r = $('hero').getBoundingClientRect(), f = $('field').getBoundingClientRect(); return { x: r.left - f.left + r.width / 2, y: r.top - f.top + r.height * 0.3 }; }
    const el = $('enemies').children[idx]; if (!el) return { x: 100, y: 100 };
    const r = el.getBoundingClientRect(), f = $('field').getBoundingClientRect();
    return { x: r.left - f.left + r.width / 2, y: r.top - f.top + r.height * 0.35 };
  }
  function float(txt, where, cls) {
    const p = pos(where), el = document.createElement('div');
    el.className = 'fl ' + (cls || ''); el.textContent = txt;
    el.style.left = (p.x - 20 + (Math.random() * 30 - 15)) + 'px'; el.style.top = (p.y + (Math.random() * 20 - 10)) + 'px';
    $('fx').appendChild(el); setTimeout(() => el.remove(), 1000);
  }
  function banner(t, org) {
    const b = $('banner'); b.textContent = t; b.className = org ? 'org' : ''; void b.offsetWidth; b.classList.add('on');
  }
  function say(text) {
    const b = $('bubble'); b.textContent = text; b.classList.add('on');
    clearTimeout(say.t); say.t = setTimeout(() => b.classList.remove('on'), 1700);
  }
  function shakeEnemy(i) { const el = $('enemies').children[i]; if (!el) return; el.classList.remove('hurt'); void el.offsetWidth; el.classList.add('hurt'); }

  async function playEvents(enemyPhase) {
    const evs = S.events; S.events = [];
    for (const e of evs) {
      switch (e.type) {
        case 'play': say(e.line); await sleep(160); break;
        case 'edmg': float((e.kind === 'reflect' ? '↩' : '') + e.amount, e.idx, e.kind === 'reflect' ? 'st' : ''); shakeEnemy(e.idx); renderEnemies(); await sleep(150); break;
        case 'arrest': float('체포!', e.idx, 'say'); await sleep(250); break;
        case 'block': float('🛡+' + e.amount, 'heroCenter', 'blk'); break;
        case 'stat': float((e.stat === 'dopa' ? '도파민' : e.stat === 'tight' ? '조임력' : '윤활도') + ' +' + e.amount, 'heroCenter', 'dopa'); break;
        case 'heal': float('+' + e.amount, 'heroCenter', 'heal'); break;
        case 'status': float(e.what, e.idx, 'st'); break;
        case 'pdmg':
          if (e.self) { float('-' + e.amount, 'heroCenter'); break; }
          if (e.idx != null) { const img = $('heroImg'); heroOverride = 'shy'; $('heroImg').src = heroSrc('shy'); img.classList.remove('hit'); void img.offsetWidth; img.classList.add('hit'); }
          float(e.blocked ? '-' + e.amount + ' (🛡' + e.blocked + ')' : '-' + e.amount, 'heroCenter'); await sleep(320); break;
        case 'disgust': float('질림… 공격 취소!', e.idx, 'st'); await sleep(350); break;
        case 'fleeFail': float('봉쇄! 못 도망쳐', e.idx, 'st'); await sleep(350); break;
        case 'flee': float('도주!', e.idx, 'say'); await sleep(300); break;
        case 'orgasm': banner('절정!!', true); await sleep(700); break;
        case 'orgasmEnd': break;
        case 'token': float('절정 유도 카드 생성', 'heroCenter', 'st'); break;
        case 'turn': if (enemyPhase) banner('TURN ' + e.turn); break;
        case 'shuffle': float('덱 셔플', 'heroCenter', 'st'); break;
      }
    }
    heroOverride = null;
    render();
  }

  function finish() {
    const r = S.result, ov = $('overlay');
    $('ovTitle').textContent = r.win ? (r.reward ? '전원 체포!' : '체포 완료') : '수사 실패…';
    $('ovMsg').textContent = r.win ? (r.reward ? '보상 획득 (2단계에서 카드 선택 연결)' : '놓친 용의자가 있어 보상이 없습니다') : r.reason;
    setTimeout(() => ov.classList.remove('hidden'), 600);
  }

  // ── 개발용 패널 ──
  const sel = $('devEnc'); G.encounters.forEach(e => { const o = document.createElement('option'); o.value = e.id; o.textContent = e.name; sel.appendChild(o); });
  const cs = $('devCard'); G.cardList.concat([G.cards.T01]).forEach(c => { const o = document.createElement('option'); o.value = c.id; o.textContent = (c.no ? c.no + '. ' : '') + c.name; cs.appendChild(o); });
  $('devBtn').addEventListener('click', () => $('dev').classList.toggle('hidden'));
  $('devStart').addEventListener('click', () => { start(sel.value); $('dev').classList.add('hidden'); });
  $('devAdd').addEventListener('click', () => { if (!S || S.hand.length >= C.player.handLimit) return; S.hand.push({ uid: 9000 + Math.floor(Math.random() * 90000), id: cs.value }); render(); });
  document.querySelectorAll('[data-dev]').forEach(b => b.addEventListener('click', () => {
    if (!S) return; const k = b.dataset.dev, p = S.p;
    if (k === 'dopa30') p.dopa = Math.min(C.dopamine.max, p.dopa + 30);
    if (k === 'dopa100') p.dopa = C.dopamine.max;
    if (k === 'tight10') p.tight = Math.min(C.tight.max, p.tight + 10);
    if (k === 'lube50') p.lube = Math.min(C.lube.max, p.lube + 50);
    render();
  }));
  $('ovAgain').addEventListener('click', () => start(encId));
  $('ovDev').addEventListener('click', () => { $('overlay').classList.add('hidden'); $('dev').classList.remove('hidden'); });

  window.GAIA.ui = { start: start };
  const q = new URLSearchParams(location.search);
  start(q.get('enc') || 'e1');
})();
