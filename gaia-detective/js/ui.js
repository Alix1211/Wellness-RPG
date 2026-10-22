// 전투 화면 — 엔진 상태 S 를 그리고, S.events 를 연출로 재생한다.
(function () {
  const G = window.GAIA, C = G.config, A = G.assets;
  const $ = id => document.getElementById(id);
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const ic = (k, fb) => G.icons ? G.icons.html(k, fb) : fb;
  const hyd = () => { if (G.icons) G.icons.hydrate(document); };
  let S = null, runMode = false, encId = 'e1', selUid = null, busy = false, bgN = 0, heroOverride = null, lowSaid = false, dopaSaid = false;

  // ── 이미지 경로 ──
  const heroSrc = k => A.base + A.hero[k];
  const isPort = () => innerHeight > innerWidth;
  const bgSrc = n => {
    const m = /^bg_([a-z]+)\d*\.jpg$/.exec(n || ''), b = m ? 'bg_' + m[1] : 'bg_alley', o = isPort() ? 'port' : 'land';
    return window.GAIA_IMG ? (window.GAIA_IMG['bg/v2/' + b + '_' + o + '.webp'] || '') : '../assets/gaia-detective/bg/v2/' + b + '_' + o + '.jpg';
  };
  let curBg = null;
  const applyBg = () => { if (curBg) $('bg').style.backgroundImage = 'url(' + bgSrc(curBg) + ')'; };
  const cardFrame = type => { const f = 'frame_' + (type === '스킬' ? 'mint' : 'pink') + '.webp'; return window.GAIA_IMG ? (window.GAIA_IMG['ui/card/' + f] || '') : '../assets/gaia-detective/ui/card/' + f; };
  const cardImg = id => window.GAIA_IMG ? (window.GAIA_IMG['cards/' + id + '.webp'] || '') : A.cardArt + id + '.webp';
  const sprite = e => A.base + e.def.sprite + '.png';

  // ── 시작 ──
  function start(id, opts) {
    opts = opts || {}; runMode = !!opts.run;
    encId = id || encId;
    const enc = G.encounters.find(x => x.id === encId);
    S = G.newBattle({ enemies: enc.enemies, deck: opts.deck, hp: opts.hp, wl: opts.wl, relics: opts.relics });
    selUid = null; busy = false; heroOverride = null; lowSaid = false; dopaSaid = false;
    $('overlay').classList.add('hidden');
    curBg = enc.bg || A.bg[(bgN++) % A.bg.length]; applyBg();
    buildEnemies();
    S.events = [];
    render();
    banner('수사 개시!'); SFX.play('start');
    setTimeout(() => { heroSay('start'); const live = liveIdx(); if (live.length) setTimeout(() => enemySay(live[0], 'start'), 900); }, 700);
  }

  // ── 렌더 ──
  function pct(v, m) { return Math.max(0, Math.min(100, v / m * 100)) + '%'; }
  function heroPose() {
    if (heroOverride) return heroOverride;
    if (S.p.orgActive) return 'serious';
    if (S.p.hp / S.p.maxHp <= 0.3) return 'cry';
    return 'shy';
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
    for (let i = 0; i < total; i++) { const o = document.createElement('div'); o.className = 'orb' + (i < p.energy ? '' : ' off'); o.innerHTML = ic(i < p.energy ? 'energy_on' : 'energy_off', '●'); en.appendChild(o); }
    $('blockTag').innerHTML = p.block > 0 ? ic('block', '🛡') + ' ' + p.block : '';
    $('heroImg').src = heroSrc(heroPose());
    $('field').classList.toggle('orgmode', p.orgActive);
    $('field').classList.toggle('warm', !p.orgActive && p.dopa >= 70);
    renderEnemies();
    renderHand();
    $('nDraw').textContent = S.drawPile.length; $('nDisc').textContent = S.discard.length;
    $('nExh').textContent = S.exhaust.length ? '소멸 ' + S.exhaust.length : '';
    hyd();
    $('endTurn').disabled = busy || S.phase !== 'player';
    const needT = selUid != null;
    $('hintBar').classList.toggle('on', needT);
    if (needT) $('hintBar').textContent = '대상을 선택하세요 (카드를 다시 누르면 취소)';
  }

  function enemyH(e) {
    const n = Math.max(1, S.enemies.length), ar = innerWidth / innerHeight * 100;
    const base = Math.min(isPort() ? 19.5 : 34, (isPort() ? 0.66 : 0.5) * ar / (0.85 * n));
    return Math.round(base * (e.def.h || 1) * 10) / 10;
  }
  function buildEnemies() {
    const box = $('enemies'); box.innerHTML = '';
    S.enemies.forEach((e, i) => {
      const el = document.createElement('div'); el.className = 'enemy'; el.dataset.i = i;
      el.innerHTML = '<div class="intent"></div><img class="spr" alt="" style="height:' + enemyH(e) + 'vh"><div class="estat"><div class="ename"></div><div class="bar"><span class="trk"><i></i></span><b></b></div><div class="chips"></div></div><div class="sbub"><span></span></div>';
      el.querySelector('img.spr').src = sprite(e);
      el.addEventListener('click', () => onEnemy(i));
      box.appendChild(el);
    });
  }
  function renderEnemies() {
    const els = $('enemies').children;
    S.enemies.forEach((e, i) => {
      const el = els[i]; if (!el) return;
      const live = !e.arrested && !e.fled;
      el.querySelector('img.spr').style.height = enemyH(e) + 'vh';
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
        if (a.kind === 'atk') return '<span class="atk' + (e.disgust > 0 ? ' dis' : a.hits > 1 ? ' multi' : '') + '">' + (e.disgust > 0 ? ic('intent_disgust', '🚫') : (a.hits > 1 ? ic('intent_multi', '⚔') : ic('intent_atk', '⚔'))) + a.n + (a.hits > 1 ? '×' + a.hits : '') + '</span>';
        if (a.kind === 'buff') return '<span class="buff">' + ic('intent_buff', '💪') + '+' + a.n + '</span>';
        return '<span class="flee">' + ic('intent_flee', '💨') + ' 도주!</span>';
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
      if ((e.arrested || e.fled) && !st) { st = document.createElement('div'); st.className = 'stamp' + (e.arrested ? ' art' : ''); st.textContent = e.arrested ? '체포!' : '놓침…'; el.appendChild(st); }
    });
  }
  function needsTargetNow() { const c = S.hand.find(h => h.uid === selUid); return c && G.cards[c.id].needsTarget; }

  // 손패: 카드를 최대한 크게(--k), 펼쳐서 겹침 없이. 장수가 많아 자리가 모자랄 때만 줄이고 그래도 모자라면 겹친다.
  function renderHand() {
    const h = $('hand'); h.innerHTML = '';
    const n = S.hand.length, vh = innerHeight / 100, avail = Math.max(200, h.clientWidth - 1.5 * vh);
    const need = k => n * 18 * k * vh + Math.max(0, n - 1) * 0.8 * k * vh;
    let k = 1.05; while (k > 0.95 && need(k) > avail) k = Math.round((k - 0.05) * 100) / 100;
    document.documentElement.style.setProperty('--k', k);
    const cw = 18 * k * vh; let step = cw + 0.8 * k * vh;
    if (n > 1 && need(k) > avail) step = (avail - cw) / (n - 1);
    S.hand.forEach((c, i) => {
      const d = G.cards[c.id], chk = G.canPlay(S, c.uid), cost = G.cost(S, c);
      const el = cardEl(d.id, cost);
      el.className += (chk.ok ? '' : ' dis') + (selUid === c.uid ? ' sel' : '');
      el.style.marginLeft = i ? (step - cw) + 'px' : '0';
      el.style.rotate = ((i - (n - 1) / 2) * 2.2) + 'deg';
      el.style.translate = '0 ' + (Math.pow(Math.abs(i - (n - 1) / 2), 1.7) * 0.4 * k).toFixed(2) + 'vh';
      el.dataset.uid = c.uid; el.title = chk.ok ? '' : chk.reason;
      el.addEventListener('dragstart', ev => ev.preventDefault());
      el.addEventListener('pointerdown', ev => onCardDown(ev, c.uid, el));
      h.appendChild(el);
    });
  }
  function cardEl(id, cost) {
    const d = G.cards[id], el = document.createElement('div'); if (cost == null) cost = d.cost;
    el.className = 'card t-' + d.type + ' g-' + d.grade;
    const nm = d.name.length, tl = d.text.length;
    el.innerHTML = '<div class="art" style="background:' + artColor(d) + '"><img alt="" draggable="false" onerror="this.remove()" src="' + cardImg(d.id) + '"><span>' + d.folder + '</span></div>' +
      '<img class="frame" alt="" draggable="false" src="' + cardFrame(d.type) + '">' +
      '<div class="cost' + (cost < d.cost ? ' dc' : '') + '">' + cost + '</div>' +
      '<div class="cname n' + (nm > 10 ? 4 : nm > 8 ? 3 : nm > 6 ? 2 : 1) + '">' + d.name + '</div>' +
      '<div class="ctag">' + d.type + (d.exhaust ? ' · 소멸' : '') + '</div>' +
      '<div class="ctext t' + (tl > 30 ? 3 : tl > 18 ? 2 : 1) + '"><span>' + d.text + '</span></div>';
    return el;
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

  // ── 드래그: 공격 카드는 끌면 조준선이 생기고 적 위에 놓으면 사용, 대상 없는 카드는 필드로 끌어다 놓으면 사용. 짧게 톡 누르면 기존처럼 선택. ──
  let drag = null;
  function liveIdx() { return S.enemies.map((e, i) => i).filter(i => !S.enemies[i].arrested && !S.enemies[i].fled); }
  function enemyAt(x, y) {
    for (const el of document.elementsFromPoint(x, y)) {
      const en = el.closest && el.closest('.enemy'); if (!en) continue;
      const i = +en.dataset.i, e = S.enemies[i]; if (e && !e.arrested && !e.fled) return i;
    }
    return -1;
  }
  function overField(y) { return y < $('bottom').getBoundingClientRect().top; }
  function onCardDown(ev, uid, el) {
    if (ev.button > 0 || busy || !S || S.phase !== 'player') return;
    drag = { uid: uid, el: el, sx: ev.clientX, sy: ev.clientY, on: false };
    window.addEventListener('pointermove', onDragMove);
    window.addEventListener('pointerup', onDragEnd);
    window.addEventListener('pointercancel', onDragCancel);
  }
  function dragStart() {
    const d = G.cards[S.hand.find(h => h.uid === drag.uid).id];
    drag.on = true; drag.need = !!d.needsTarget; drag.over = -1;
    document.body.classList.add('dragging');
    const r = drag.el.getBoundingClientRect();
    if (drag.need) {
      drag.el.classList.add('sel');
      drag.ox = r.left + r.width / 2; drag.oy = r.top - 3 * innerHeight / 100;
      const a = document.createElement('div'); a.id = 'aim'; a.innerHTML = '<i></i>'; document.body.appendChild(a); drag.aim = a;
      [].forEach.call($('enemies').children, (el, i) => { const e = S.enemies[i]; if (e && !e.arrested && !e.fled) el.classList.add('targetable'); });
      $('hintBar').textContent = '적에게 끌어다 놓으세요'; $('hintBar').classList.add('on');
    } else {
      const g = drag.el.cloneNode(true); g.classList.add('dragghost'); g.style.width = r.width + 'px'; g.style.height = r.height + 'px'; g.style.margin = '0';
      document.body.appendChild(g); drag.ghost = g; drag.el.style.opacity = '.25';
      $('hintBar').textContent = '위쪽 필드에 놓으면 사용'; $('hintBar').classList.add('on');
    }
  }
  function onDragMove(ev) {
    if (!drag) return;
    if (!drag.on) {
      if (Math.hypot(ev.clientX - drag.sx, ev.clientY - drag.sy) < 10) return;
      if (!G.canPlay(S, drag.uid).ok) return;          // 쓸 수 없는 카드는 끌리지 않음(톡 누르면 이유 표시)
      dragStart();
    }
    const x = ev.clientX, y = ev.clientY;
    if (drag.need) {
      const dx = x - drag.ox, dy = y - drag.oy, len = Math.hypot(dx, dy);
      drag.aim.style.cssText = 'left:' + drag.ox + 'px;top:' + drag.oy + 'px;width:' + len + 'px;transform:rotate(' + Math.atan2(dy, dx) + 'rad)';
      const idx = enemyAt(x, y); drag.over = idx; drag.aim.classList.toggle('hit', idx >= 0);
      [].forEach.call($('enemies').children, (el, i) => el.classList.toggle('aimhit', i === idx));
    } else {
      const r = drag.ghost.getBoundingClientRect();
      drag.ghost.style.left = (x - r.width / 2) + 'px'; drag.ghost.style.top = (y - r.height / 2) + 'px';
      $('field').classList.toggle('dropok', overField(y));
    }
  }
  function dragClean() {
    window.removeEventListener('pointermove', onDragMove); window.removeEventListener('pointerup', onDragEnd); window.removeEventListener('pointercancel', onDragCancel);
    if (drag) {
      if (drag.aim) drag.aim.remove(); if (drag.ghost) drag.ghost.remove();
      if (drag.el) { drag.el.style.opacity = ''; if (drag.on) drag.el.classList.remove('sel'); }
    }
    document.body.classList.remove('dragging'); $('field').classList.remove('dropok');
    [].forEach.call($('enemies').children, el => el.classList.remove('aimhit'));
  }
  function onDragCancel() { dragClean(); if (drag && drag.on) { drag = null; render(); } else drag = null; }
  function onDragEnd(ev) {
    const dr = drag; if (!dr) return;
    const x = ev.clientX, y = ev.clientY;
    dragClean(); drag = null;
    if (!dr.on) { onCard(dr.uid); return; }           // 톡 누름
    if (dr.need) {
      let t = enemyAt(x, y);
      if (t < 0 && overField(y) && liveIdx().length === 1) t = liveIdx()[0];   // 적이 한 명이면 필드 아무 데나 놓아도 됨
      if (t >= 0) { play(dr.uid, t); return; }
    } else if (overField(y)) { play(dr.uid, null); return; }
    render();                                         // 취소: 카드는 손패로 복귀
  }

  async function play(uid, tIdx) {
    busy = true; selUid = null;
    const card = S.hand.find(h => h.uid === uid), d = G.cards[card.id];
    const cardEl = $('hand').querySelector('[data-uid="' + uid + '"]');
    SFX.play('card'); flyCard(cardEl, tIdx, !!d.needsTarget || d.type === '공격');
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
  const bubSrc = n => window.GAIA_IMG ? (window.GAIA_IMG['ui/bubbles/' + n + '.png'] || '') : '../assets/gaia-detective/ui/bubbles/' + n + '.png';
  function showBubble(el, text, color) {
    if (!el) return;
    const small = text.length <= 9, sp = el.querySelector('span');
    el.className = 'sbub ' + (small ? 'small' : 'large') + ' on';
    el.style.setProperty('--bg', 'url(' + bubSrc(color + '_' + (small ? 'small' : 'large')) + ')');
    sp.textContent = text; sp.style.fontSize = (small ? 1.8 : text.length > 30 ? 1.45 : 1.7) + 'vh';
    clearTimeout(el._t); el._t = setTimeout(() => el.classList.remove('on'), 2100);
  }
  function say(text) { if (!text) return; showBubble($('bubble'), text, 'pink'); }
  const rnd = a => a[Math.floor(Math.random() * a.length)];
  function heroSay(key, chance) {
    const L = G.dialogue && G.dialogue.hero[key]; if (!L || (chance != null && Math.random() > chance)) return false;
    say(rnd(L)); return true;
  }
  function enemySay(i, key, chance) {
    const e = S.enemies[i]; if (!e) return;
    const D = G.dialogue && G.dialogue.enemy[e.def.id]; const L = D && D[key]; if (!L || (chance != null && Math.random() > chance)) return;
    showBubble($('enemies').children[i] && $('enemies').children[i].querySelector('.sbub'), rnd(L), 'green');
  }
  function shakeEnemy(i) { const el = $('enemies').children[i]; if (!el) return; el.classList.remove('hurt'); void el.offsetWidth; el.classList.add('hurt'); }

  const SFX = G.sfx || { play: function () {}, toggle: function () {}, isMuted: function () { return false; }, unlock: function () {} };
  const HITS = ['퍽!', '짜악!', '철썩!', '탁!', '뿅!'], HURT = ['앗!', '흐앙!', '꺄악!'];
  function burst(where, list, n, spread) {
    const p = pos(where);
    for (let i = 0; i < n; i++) {
      const el = document.createElement('div'); el.className = 'pt'; const it = list[i % list.length];
      if ((it === '💖' || it === '💗' || it === '💘') && G.icons && G.icons.src('heart')) { el.className = 'pt hp'; el.innerHTML = '<img alt="" src="' + G.icons.src('heart') + '">'; } else el.textContent = it;
      const a = Math.random() * Math.PI * 2, r = (spread || 9) * (0.5 + Math.random()) * innerHeight / 100;
      el.style.left = p.x + 'px'; el.style.top = p.y + 'px';
      el.style.setProperty('--dx', Math.cos(a) * r + 'px'); el.style.setProperty('--dy', (Math.sin(a) * r - 3 * innerHeight / 100) + 'px'); el.style.setProperty('--rot', (Math.random() * 90 - 45) + 'deg');
      $('fx').appendChild(el); setTimeout(() => el.remove(), 950);
    }
  }
  function comic(txt, where) {
    const p = pos(where), el = document.createElement('div'); el.className = 'comic'; el.textContent = txt;
    el.style.left = p.x + 'px'; el.style.top = (p.y - 2 * innerHeight / 100) + 'px'; el.style.setProperty('--r', (Math.random() * 20 - 10) + 'deg');
    $('fx').appendChild(el); setTimeout(() => el.remove(), 800);
  }
  // ── 화려한 연출: 베기·충격·바람·안개·하트비 ──
  const vh = () => innerHeight / 100;
  function fxAdd(el, ms) { $('fx').appendChild(el); setTimeout(() => el.remove(), ms); return el; }
  function slash(where, n, foe) {
    const p = pos(where);
    for (let i = 0; i < n; i++) {
      const el = document.createElement('div'); el.className = 'sl' + (foe ? ' foe' : '');
      const base = foe ? 160 : -28; el.style.setProperty('--r', (base + (n > 1 ? (i ? 56 : 0) : 0) + (Math.random() * 14 - 7)) + 'deg');
      el.style.left = p.x + 'px'; el.style.top = (p.y - 1 * vh()) + 'px'; el.style.animationDelay = (i * 70) + 'ms';
      fxAdd(el, 700);
    }
  }
  function impact(where, big) {
    const p = pos(where);
    const f = document.createElement('div'); f.className = 'ifl' + (big ? ' big' : ''); f.style.left = p.x + 'px'; f.style.top = p.y + 'px'; fxAdd(f, 500);
    const r = document.createElement('div'); r.className = 'ring' + (big ? ' big' : ''); r.style.left = p.x + 'px'; r.style.top = p.y + 'px'; fxAdd(r, 600);
  }
  let windT = 0;
  function wind(fromRight, n) {
    if (Date.now() - windT < 350) return; windT = Date.now();
    const W = $('field').clientWidth, H = $('field').clientHeight;
    for (let i = 0; i < (n || 9); i++) {
      const el = document.createElement('div'); el.className = 'wl' + (fromRight ? ' rev' : '');
      const w = (16 + Math.random() * 26) * vh();
      el.style.width = w + 'px'; el.style.top = (H * (0.22 + Math.random() * 0.5)) + 'px'; el.style.left = (fromRight ? W * 0.55 + Math.random() * W * 0.45 : Math.random() * W * 0.45) + 'px';
      el.style.animationDelay = (Math.random() * 120) + 'ms'; el.style.animationDuration = (0.28 + Math.random() * 0.2) + 's';
      fxAdd(el, 800);
    }
  }
  function fogPuff(where, n) {
    const p = pos(where);
    for (let i = 0; i < (n || 6); i++) {
      const el = document.createElement('div'); el.className = 'puff';
      const a = Math.random() * Math.PI * 2, r = (6 + Math.random() * 12) * vh(), sz = (14 + Math.random() * 16) * vh();
      el.style.width = el.style.height = sz + 'px'; el.style.left = p.x + 'px'; el.style.top = p.y + 'px';
      el.style.setProperty('--dx', Math.cos(a) * r + 'px'); el.style.setProperty('--dy', Math.sin(a) * r * 0.6 + 'px');
      fxAdd(el, 1500);
    }
  }
  function heartRain(n) {
    const src = G.icons && G.icons.src('heart'); const W = $('field').clientWidth, H = $('field').clientHeight;
    for (let i = 0; i < (n || 22); i++) {
      const el = document.createElement('div'); el.className = 'hr';
      const sz = (2.4 + Math.random() * 3.6) * vh();
      el.style.width = el.style.height = sz + 'px'; el.style.left = (Math.random() * W) + 'px'; el.style.top = (H * (0.6 + Math.random() * 0.4)) + 'px';
      el.style.setProperty('--dy', -(H * (0.35 + Math.random() * 0.5)) + 'px'); el.style.setProperty('--dx', (Math.random() * 12 - 6) * vh() + 'px'); el.style.setProperty('--rot', (Math.random() * 60 - 30) + 'deg');
      el.style.animationDelay = (Math.random() * 450) + 'ms';
      el.innerHTML = src ? '<img alt="" src="' + src + '">' : '💖';
      fxAdd(el, 2000);
    }
  }
  function softFlash() { const f = $('flash'); f.classList.remove('on', 'soft'); void f.offsetWidth; f.classList.add('soft', 'on'); setTimeout(() => f.classList.remove('soft'), 400); }
  (function () { const f = document.createElement('div'); f.id = 'fog'; f.innerHTML = '<i></i><i></i><i></i><i></i><i></i>'; $('field').insertBefore(f, $('hintBar')); })();
  function fieldShake() { const f = $('field'); f.classList.remove('shake'); void f.offsetWidth; f.classList.add('shake'); }
  function flash() { const f = $('flash'); f.classList.remove('on'); void f.offsetWidth; f.classList.add('on'); }
  // 카드가 손패에서 목표로 날아가는 모션
  function flyCard(el, tIdx, atk) {
    if (!el) return;
    const r = el.getBoundingClientRect(), f = $('field').getBoundingClientRect();
    const c = el.cloneNode(true); c.className = 'card flycard'; c.style.cssText = 'left:' + r.left + 'px;top:' + r.top + 'px;width:' + r.width + 'px;height:' + r.height + 'px;margin:0;rotate:' + (el.style.rotate || '0deg');
    document.body.appendChild(c);
    const tp = atk && tIdx != null ? pos(tIdx) : pos('heroCenter');
    const dx = f.left + tp.x - (r.left + r.width / 2), dy = f.top + tp.y - (r.top + r.height / 2);
    requestAnimationFrame(() => requestAnimationFrame(() => { c.style.transform = 'translate(' + dx + 'px,' + dy + 'px) scale(.35) rotate(25deg)'; c.style.opacity = '0'; }));
    setTimeout(() => c.remove(), 450);
  }

  async function playEvents(enemyPhase) {
    const evs = S.events; S.events = [];
    for (const e of evs) {
      switch (e.type) {
        case 'play': if (S.p.orgActive && Math.random() < 0.5) heroSay('orgAttack'); else if (!e.line || Math.random() < 0.3) { if (!heroSay('attack')) say(e.line); } else say(e.line); await sleep(160); break;
        case 'edmg': SFX.play(e.kind === 'reflect' ? 'stat' : 'hit'); if (e.kind !== 'reflect') { comic(HITS[Math.floor(Math.random() * HITS.length)], e.idx); slash(e.idx, e.amount >= 14 ? 2 : 1); impact(e.idx, e.amount >= 14); wind(false); burst(e.idx, ['✨', '💥', '⭐', '💖'], 7, 8); if (e.amount >= 14) { fieldShake(); softFlash(); } } float((e.kind === 'reflect' ? '↩' : '') + e.amount, e.idx, e.kind === 'reflect' ? 'st' : ''); shakeEnemy(e.idx); renderEnemies(); await sleep(150); break;
        case 'arrest': heroSay('arrest', 0.8); enemySay(e.idx, 'arrested'); SFX.play('arrest'); burst(e.idx, ['⭐', '💖', '✨', '🎀', '💖'], 18, 14); fogPuff(e.idx, 5); impact(e.idx, true); float('체포!', e.idx, 'say'); await sleep(350); break;
        case 'block': heroSay('block', 0.25); SFX.play('block'); burst('heroCenter', ['🛡️', '✨'], 4, 6); impact('heroCenter'); float('🛡+' + e.amount, 'heroCenter', 'blk'); break;
        case 'stat': if (e.stat === 'dopa' && S.p.dopa >= 70 && !dopaSaid && !S.p.orgActive) { dopaSaid = true; heroSay('dopa70'); } SFX.play(e.stat === 'dopa' ? 'dopa' : e.stat === 'tight' ? 'tight' : 'stat'); burst('heroCenter', e.stat === 'dopa' ? ['💗', '✨'] : e.stat === 'tight' ? ['💜', '✨'] : ['💧', '✨'], 5, 7); float((e.stat === 'dopa' ? '도파민' : e.stat === 'tight' ? '조임력' : '윤활도') + ' +' + e.amount, 'heroCenter', 'dopa'); break;
        case 'heal': SFX.play('heal'); burst('heroCenter', ['💚', '✨'], 6, 8); float('+' + e.amount, 'heroCenter', 'heal'); break;
        case 'status': float(e.what, e.idx, 'st'); break;
        case 'pdmg':
          if (e.self) { float('-' + e.amount, 'heroCenter'); break; }
          if (e.idx != null) { const img = $('heroImg'); const hp = e.amount >= 14 ? 'fly' : 'cry'; heroOverride = hp; $('heroImg').src = heroSrc(hp); img.classList.remove('hit'); void img.offsetWidth; img.classList.add('hit'); }
          enemySay(e.idx, 'attack', 0.7); SFX.play('hurt'); if (!lowSaid && S.p.hp / S.p.maxHp <= 0.3) { lowSaid = true; setTimeout(() => { SFX.play('low'); heroSay('lowHp'); }, 700); } else if (Math.random() < 0.4) setTimeout(() => heroSay('hit'), 450); if (!e.blocked) { comic(HURT[Math.floor(Math.random() * HURT.length)], 'heroCenter'); } slash('heroCenter', 1, true); wind(true, 7); fieldShake(); float(e.blocked ? '-' + e.amount + ' (🛡' + e.blocked + ')' : '-' + e.amount, 'heroCenter'); await sleep(320); break;
        case 'disgust': heroSay(Math.random() < 0.5 ? 'kicked' : 'disgust', 0.7); SFX.play('disgust'); burst(e.idx, ['💦', '😑'], 5, 7); float('질림… 공격 취소!', e.idx, 'st'); await sleep(350); break;
        case 'fleeFail': float('봉쇄! 못 도망쳐', e.idx, 'st'); await sleep(350); break;
        case 'flee': enemySay(e.idx, 'flee'); heroSay('fleeMissed', 0.8); SFX.play('flee'); float('도주!', e.idx, 'say'); await sleep(300); break;
        case 'orgasm': heroSay('orgasm'); SFX.play('orgasm'); flash(); fogPuff('heroCenter', 9); heartRain(26); wind(false, 12); burst('heroCenter', ['💖', '💗', '✨', '⭐', '🎀'], 30, 24); banner('절정!!', true); await sleep(900); break;
        case 'orgasmEnd': break;
        case 'token': SFX.play('stat'); float('절정 유도 카드 생성', 'heroCenter', 'st'); break;
        case 'turn': if (enemyPhase) { SFX.play('turn'); banner('TURN ' + e.turn); } break;
        case 'shuffle': float('덱 셔플', 'heroCenter', 'st'); break;
      }
    }
    heroOverride = null;
    render();
  }

  function finish() {
    const r = S.result, ov = $('overlay'); SFX.play(r.win ? 'win' : 'lose'); heroSay(r.win ? 'victory' : 'defeat');
    if (runMode) { setTimeout(() => G.run.onEnd(S), 1300); return; }
    $('ovTitle').textContent = r.win ? (r.reward ? '전원 체포!' : '체포 완료') : '수사 실패…';
    $('ovMsg').textContent = r.win ? (r.reward ? '보상 획득 (개발용 전투에서는 보상이 없습니다)' : '놓친 용의자가 있어 보상이 없습니다') : r.reason;
    setTimeout(() => ov.classList.remove('hidden'), 600);
  }

  // ── 개발용 패널 ──
  const sel = $('devEnc'); G.encounters.forEach(e => { const o = document.createElement('option'); o.value = e.id; o.textContent = e.name; sel.appendChild(o); });
  const cs = $('devCard'); G.cardListAll.concat([G.cards.T01]).forEach(c => { const o = document.createElement('option'); o.value = c.id; o.textContent = (c.no ? c.no + '. ' : '') + c.name + (c.draft ? ' (초안)' : ''); cs.appendChild(o); });
  $('devBtn').addEventListener('click', () => $('dev').classList.toggle('hidden'));
  window.addEventListener('resize', () => { applyBg(); if (S) render(); });
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
  $('devReset').addEventListener('click', () => { G.run.reset(); $('dev').classList.add('hidden'); $('overlay').classList.add('hidden'); G.map.open(); });
  $('ovAgain').addEventListener('click', () => start(encId));
  $('ovDev').addEventListener('click', () => { $('overlay').classList.add('hidden'); $('dev').classList.remove('hidden'); });

  const mb = $('muteBtn'); const setMb = () => { mb.innerHTML = SFX.isMuted() ? ic('sound_off', '🔇') : ic('sound_on', '🔊'); hyd(); }; setMb();
  mb.addEventListener('click', () => { SFX.toggle(); setMb(); SFX.play('click'); });
  document.addEventListener('pointerdown', () => SFX.unlock(), { once: true });
  // 소모품 사용: 엔진이 허락(내 턴·전투 중)하면 소지품에서 1개 빼고 화면을 갱신
  function useItem(id) {
    if (!S || busy || !G.useItem(S, id)) return false;
    const r = G.run.get(), i = r.items.indexOf(id); if (i >= 0) r.items.splice(i, 1); G.run.save();
    SFX.play('click'); float(G.items.byId[id].name, 'heroCenter', 'st'); render(); return true;
  }
  // 전체화면 버튼 (지원하지 않는 브라우저에서는 숨김)
  const fsOk = !!(document.documentElement.requestFullscreen && document.fullscreenEnabled !== false);
  const fsBtns = [].slice.call(document.querySelectorAll('.fsbtn'));
  const fsLabel = () => fsBtns.forEach(b => { b.textContent = document.fullscreenElement ? '전체화면 끄기' : '전체화면'; });
  fsBtns.forEach(b => { if (!fsOk) { b.classList.add('hidden'); return; } b.addEventListener('click', () => { SFX.play('click'); try { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen(); } catch (e) {} }); });
  document.addEventListener('fullscreenchange', () => { fsLabel(); setTimeout(() => { applyBg(); if (S) render(); }, 200); });
  const bagB = $('bagBtn'); if (bagB) bagB.addEventListener('click', () => { SFX.play('click'); G.inv.open({ battle: !!(S && runMode && !S.result) }); });
  window.GAIA.ui = { start: start, cardEl: cardEl, state: () => S, render: () => render(), useItem: useItem };
  const q = new URLSearchParams(location.search);
  $('ovMap').addEventListener('click', () => { $('overlay').classList.add('hidden'); G.map.open(); });
  if (q.get('enc')) start(q.get('enc')); else G.map.open();
})();
