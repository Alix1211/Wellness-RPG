// 마트·카지노 상점 — 지도에서 건물을 눌러 언제든 입장. 사기/팔기: 칸을 한 번 누르면 정보, 두 번 연속(더블클릭·더블탭)하면 바로 거래.
// 진열은 한 바퀴(run.lap)마다 새로 바뀌고, 산 칸은 품절. 슬롯머신은 케인이 준 틀 그림(ui/slot/frame.webp) 위에서 동작.
(function () {
  const G = window.GAIA, $ = id => document.getElementById(id), IT = G.items;
  const art = k => window.GAIA_IMG ? (window.GAIA_IMG['ui/items/' + k + '.webp'] || '') : '../assets/gaia-detective/ui/items/' + k + '.webp';
  const clerkSrc = k => window.GAIA_IMG ? (window.GAIA_IMG['ui/clerk/' + k + '.webp'] || '') : '../assets/gaia-detective/ui/clerk/' + k + '.webp'; // 점원 초상화(없으면 숨김)
  const KINDS = { mart: { name: '마트', shop: true }, casino: { name: '카지노', shop: true }, police: { name: '경찰서', who: 'ma' }, studio: { name: '촬영소', who: 'studio' }, park: { name: '공원', who: 'civ7' }, villa: { name: '주인공 빌라', who: 'yoon', home: true }, club: { name: '클럽', who: 'civ1' }, farm: { name: '착유농장', who: 'civ5' } };
  const rnd = a => a[Math.floor(Math.random() * a.length)];
  const pickN = (a, n) => { const b = a.slice(), o = []; while (o.length < n && b.length) o.push(b.splice(Math.floor(Math.random() * b.length), 1)[0]); return o; };
  // 슬롯머신 규칙(수치는 여기서만 조정): 3×3 릴, 심볼 8종(무작위 아이템 7종 + 골드). 줄 수(1·3·5)×줄당 판돈이 한 번 돌릴 때의 판돈.
  // 한 줄에 3개 일치=그 아이템 경품(골드3=줄당×gold3), 골드2=줄당×gold2, 다른 그림 2개=줄당×pair. 한 바퀴(run.lap)당 LIMIT번까지, 다 쓰면 바니맨이 나타나 막음.
  const SLOT = { bets: [10, 20, 50], lines: [1, 3, 5], gold3: 30, gold2: 3, pair: 2, limit: 10 };
  const ROWS = [[[0, 0], [0, 1], [0, 2]], [[1, 0], [1, 1], [1, 2]], [[2, 0], [2, 1], [2, 2]]], DIAG = [[[0, 0], [1, 1], [2, 2]], [[2, 0], [1, 1], [0, 2]]];
  const FW = 1225, FH = 1015, WX = [[240, 454], [490, 706], [741, 956]], WY = [[171, 390], [424, 635], [670, 879]]; // 틀 그림 속 릴 창 9칸(1225×1015 기준)
  const placeSrc = k => window.GAIA_IMG ? (window.GAIA_IMG['place/' + k + '_port.webp'] || '') : '../assets/gaia-detective/place/' + k + '_port.webp'; // 장소 세로 배경
  const setBg = dim => { const u = placeSrc(kind); root.style.background = (u ? 'linear-gradient(rgba(60,20,50,' + dim + '),rgba(60,20,50,' + dim + ')),url(' + u + ') center/cover no-repeat' : ''); };
  const slotArt = k => window.GAIA_IMG ? (window.GAIA_IMG['ui/slot/' + k + '.webp'] || '') : '../assets/gaia-detective/ui/slot/' + k + '.webp';
  let root, kind = 'mart', sel = null, last = { t: 0, key: '' }, msg = '', mode = 'shop', syms = null, spinning = false, slotMsg = '', grid = null, nLines = 0, nBet = 1;
  const run = () => G.run.get();

  function stockOf(k) {
    const r = run(); r.stock = r.stock || {};
    const s = r.stock[k];
    if (!s || s.lap !== r.lap) {
      let ids;
      if (k === 'mart') ids = IT.list.filter(d => d.type === 'cons').map(d => d.id).concat(pickN(IT.list.filter(d => d.type === 'junk').map(d => d.id), 10));
      else ids = pickN(IT.list.filter(d => d.type === 'relic' && d.src.indexOf('casino') >= 0).map(d => d.id), 15).concat(pickN(IT.list.filter(d => d.type === 'cons' && d.src.indexOf('casino') >= 0).map(d => d.id), 5));
      r.stock[k] = { lap: r.lap, ids: ids }; G.run.save();
    }
    return r.stock[k].ids;
  }

  function build() {
    root = $('shop');
    root.addEventListener('pointerdown', e => { if (e.target === root) close(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && !root.classList.contains('hidden')) close(); });
  }
  function tile(key, id, onTap) {
    const t = document.createElement('div'); t.className = 'stl' + (sel && sel.key === key ? ' on' : '');
    if (id) t.innerHTML = '<img alt="" draggable="false" src="' + art(id) + '">';
    if (id) t.addEventListener('click', () => {
      const now = Date.now(), dbl = last.key === key && now - last.t < 380; last = { t: now, key: key };
      sel = { key: key, id: id, side: key.charAt(0) === 's' ? 'buy' : 'sell', idx: +key.slice(1) };
      if (dbl) { act(); last = { t: 0, key: '' }; } else { msg = ''; paint(); }
    });
    return t;
  }
  function can() {
    if (!sel) return { ok: false, why: '' };
    const r = run(), d = IT.byId[sel.id];
    if (sel.side === 'buy') { if (r.gold < d.price) return { ok: false, why: '용돈이 모자랍니다' }; if (r.items.length >= IT.slots) return { ok: false, why: '소지품이 가득 찼습니다' }; return { ok: true }; }
    return { ok: true };
  }
  function act() {
    if (!sel) return; const c = can(); if (!c.ok) { msg = c.why; paint(); return; }
    const r = run(), d = IT.byId[sel.id];
    if (sel.side === 'buy') { const st = stockOf(kind); r.gold -= d.price; r.items.push(d.id); st[sel.idx] = null; msg = d.name + ' 구매!'; }
    else { r.gold += IT.sell(d); r.items.splice(sel.idx, 1); msg = d.name + ' 판매 +' + IT.sell(d) + '원'; }
    sel = null; G.run.save(); if (G.sfx) G.sfx.play('click'); paint();
  }
  function paint() {
    if (mode === 'slot') return drawSlot();
    if (mode === 'entry') return drawEntry();
    const r = run(), st = stockOf(kind);
    root.innerHTML = '<div class="shwin"><h2></h2><div class="shbody"><div class="shcol"><b>진열대</b><div class="shgrid" id="shStock"></div></div><div class="shcol"><b>내 소지품 <i></i></b><div class="shgrid" id="shMine"></div></div></div><div class="shinfo"><div class="shtxt"></div><div class="shbtns"></div></div></div>';
    const w = root.firstChild; w.querySelector('h2').textContent = KINDS[kind].name;
    const A = $('shStock'), B = $('shMine');
    for (let i = 0; i < 20; i++) A.appendChild(tile('s' + i, st[i], null));
    for (let i = 0; i < IT.slots; i++) B.appendChild(tile('m' + i, r.items[i], null));
    w.querySelector('.shcol:last-child i').textContent = r.items.length + '/' + IT.slots;
    const tx = w.querySelector('.shtxt'), bt = w.querySelector('.shbtns');
    if (sel) { const d = IT.byId[sel.id]; tx.innerHTML = '<b></b><span></span>'; tx.firstChild.textContent = d.name + ' · ' + IT.typeName[d.type] + ' · ' + (sel.side === 'buy' ? d.price + '원' : '판매 ' + IT.sell(d) + '원'); tx.lastChild.textContent = msg || IT.describe(d); }
    else tx.innerHTML = '<span></span>', tx.firstChild.textContent = msg || '칸을 누르면 정보가 보이고, 두 번 연속 누르면 바로 거래합니다';
    const c = can();
    mk(bt, sel && sel.side === 'sell' ? '팔기' : '사기', act, !sel || !c.ok, false);
    if (kind === 'casino') mk(bt, '슬롯머신', openSlot, false, true);
    const g = document.createElement('div'); g.className = 'shgold'; g.textContent = r.gold + '원'; bt.appendChild(g);
    mk(bt, '나가기', toEntry, false, true);
  }
  // ── 입장 화면: 장소 세로 배경 + 점원 + 대사 + 선택지 ──
  const LN = () => {
    const D = G.dialogue || {}, K = KINDS[kind];
    if (K.shop) return (D.shop && D.shop[kind]) || {};
    if (K.who === 'studio') { const o = (D.shop && D.shop.studio) || {}; return { name: o.name, enter: o.enter, talk: o.enter, leave: o.leave }; }
    const n = (D.npc && D.npc[K.who]) || {}; return { name: n.name, enter: n.start, talk: (n.start || []).concat(n.attack || []), leave: n.flee };
  };
  // ── 집 체력단련(스쿼트 미니게임) — 수치는 여기서만 조정. 스탯(run.stat)은 아직 전투에 연결되지 않은 기록용 [임시] ──
  const TRAIN = { limit: 3, stat: '체력', gain: { fail: 0, ok: 1, great: 2 } };
  const usedT = () => { const r = run(); if (!r.train || r.train.lap !== r.lap) r.train = { lap: r.lap, n: 0 }; return r.train; };
  let trainMsg = '';
  function train() {
    if (usedT().n >= TRAIN.limit) return;
    G.minigame.play('squat', {
      wl: run().wl,
      canRetry: () => usedT().n < TRAIN.limit,
      onResult: r => {
        const rr = run(), t = usedT(), tier = r.ratio >= 0.8 ? 'great' : r.success ? 'ok' : 'fail', gain = TRAIN.gain[tier];
        t.n++; rr.stat = rr.stat || {}; rr.stat[TRAIN.stat] = (rr.stat[TRAIN.stat] || 0) + gain; G.run.save();
        trainMsg = gain ? TRAIN.stat + ' +' + gain + ' (누적 ' + rr.stat[TRAIN.stat] + ')' : '이번에는 오르지 않았습니다';
      },
      onClose: () => { const m = trainMsg; trainMsg = ''; if (mode === 'entry') drawEntry(m || undefined); }
    });
  }
  function toEntry() { mode = 'entry'; sel = null; setBg(.05); paint(); }
  function drawEntry(line) {
    const K = KINDS[kind], h = G.run.here(kind), npc = !K.home || !!h, L = npc ? LN() : {}, q = (G.shop.quest || {})[kind]; // 집은 이번 단계가 아닐 땐 상대(NPC) 없이 조용히
    root.innerHTML = '<div class="entry"><div class="enplace"></div><img class="enpc" alt="" draggable="false" src="' + (npc ? clerkSrc(kind) : '') + '"><div class="enbox"><b class="enname"></b><p class="entxt"></p><div class="enbtns"></div></div></div>';
    root.querySelector('.enplace').textContent = KINDS[kind].name;
    const pc0 = root.querySelector('.enpc'); pc0.onerror = () => pc0.remove();
    root.querySelector('.enname').textContent = L.name || '';
    root.querySelector('.entxt').textContent = line || (npc ? rnd(L.enter || ['어서 오세요']) : '');
    const bt = root.querySelector('.enbtns');
    if (K.shop) mk(bt, kind === 'casino' ? '상점' : '물건 사기', () => { mode = 'shop'; setBg(.28); paint(); }, false, false);
    if (kind === 'casino') mk(bt, '슬롯머신', openSlot, false, true);
    if (K.home) { const u = usedT(); mk(bt, '운동하기 ' + (TRAIN.limit - u.n) + '/' + TRAIN.limit, train, u.n >= TRAIN.limit, true); }
    mk(bt, h && h.kind === 'rest' ? '들어가기' : '출동', () => { if (!h) return; root.classList.add('hidden'); G.run.go(kind); }, !h, false);
    const tk = npc ? mk(bt, '대화하기', () => drawEntry(rnd(L.talk || L.enter || ['…'])), false, true) : null; if (q && tk) tk.classList.add('blink');
    mk(bt, '나가기', () => { if (L.leave) { drawEntry(rnd(L.leave)); setTimeout(close, 900); } else close(); }, false, false);
  }

  function fetchClerk(el, src) { if (!src) { el.classList.add('hidden'); return; } const im = new Image(); im.onload = () => { el.classList.remove('hidden'); el.innerHTML = ''; el.appendChild(im); }; im.onerror = () => el.classList.add('hidden'); el.classList.add('hidden'); im.src = src; }
  function mk(parent, txt, fn, dis, purple) { const b = document.createElement('button'); b.textContent = txt; b.disabled = !!dis; if (purple) b.className = 'pu'; b.addEventListener('click', () => { if (G.sfx) G.sfx.play('click'); fn(); }); parent.appendChild(b); return b; }
  // ── 슬롯머신 ──
  const symHTML = id => id === 'gold' ? '<i class="coin"></i>' : '<img alt="" draggable="false" src="' + art(id) + '">';
  const pc = (v, t) => (v / t * 100).toFixed(3) + '%';
  const used = () => { const r = run(); if (!r.slot || r.slot.lap !== r.lap) r.slot = { lap: r.lap, n: 0 }; return r.slot; };
  const total = () => SLOT.lines[nLines] * SLOT.bets[nBet];
  function newSyms() { syms = pickN(IT.list.map(d => d.id), 7).concat(['gold']); grid = null; }
  function openSlot() {
    mode = 'slot'; spinning = false;
    if (!grid) grid = [0, 1, 2].map(() => [0, 1, 2].map(() => rnd(syms)));
    slotMsg = used().n >= SLOT.limit ? '오늘은 여기까지' : '돌려 보세요';
    setBg(.1); drawSlot();
  }
  function drawSlot() {
    root.innerHTML = '<div class="slotscr"><div class="slhud"><button id="slExit">나가기</button><div class="grp"><div class="shgold" id="slCnt"></div><div class="shgold" id="slGold"></div></div></div>' +
      '<div class="slstage"><img class="bgirl" alt="" draggable="false" src="' + clerkSrc('casino') + '"><div class="slm" id="slm"></div><div class="jp hidden" id="slJp"></div></div></div>';
    const m = $('slm'); let h = '';
    for (let c = 0; c < 3; c++) {
      const cx = (WX[c][0] + WX[c][1]) / 2;
      h += '<div class="rc" id="rc' + c + '" style="left:' + pc(cx - 107.5, FW) + '"><div class="strip" id="st' + c + '"></div></div>';
    }
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) h += '<div class="wn" id="wn' + r + c + '" style="left:' + pc(WX[c][0], FW) + ';top:' + pc(WY[r][0], FH) + ';width:' + pc(WX[c][1] - WX[c][0], FW) + ';height:' + pc(WY[r][1] - WY[r][0], FH) + '"></div>';
    h += '<img class="slframe" alt="" draggable="false" src="' + slotArt('frame') + '"><div class="slplate" id="slPlate"></div>';
    [462, 597, 733].forEach((x, i) => { h += '<button class="slb" id="slB' + i + '" style="left:' + pc(x - 50, FW) + '"></button>'; });
    h += '<button class="sllev" id="slLev" aria-label="레버"></button>';
    m.innerHTML = h;
    for (let c = 0; c < 3; c++) showCol(c, [grid[0][c], grid[1][c], grid[2][c]]);
    $('slExit').addEventListener('click', () => { if (spinning) return; if (G.sfx) G.sfx.play('click'); mode = 'entry'; setBg(.05); paint(); });
    $('slB0').addEventListener('click', () => { if (spinning || used().n >= SLOT.limit) return; nLines = (nLines + 1) % SLOT.lines.length; clk(); slotMsg = ''; hud(); });
    $('slB1').addEventListener('click', () => { if (spinning || used().n >= SLOT.limit) return; nBet = (nBet + 1) % SLOT.bets.length; clk(); slotMsg = ''; hud(); });
    $('slB2').addEventListener('click', spin); $('slLev').addEventListener('click', spin);
    if (used().n >= SLOT.limit) showBunnyMan();
    hud();
  }
  const clk = () => { if (G.sfx) G.sfx.play('click'); };
  function showCol(c, v) { // 릴 한 줄에 세 심볼을 그대로 보여 줌
    const st = $('st' + c); st.style.height = '100%'; st.style.transition = 'none'; st.style.transform = 'none';
    st.innerHTML = v.map(id => '<div class="cell" style="height:' + (100 / 3).toFixed(3) + '%">' + symHTML(id) + '</div>').join('');
  }
  function hud() {
    const r = run(), n = used().n, lim = n >= SLOT.limit, tot = total();
    $('slGold').textContent = r.gold + '원'; $('slCnt').textContent = '오늘 ' + n + '/' + SLOT.limit + '회';
    $('slB0').textContent = SLOT.lines[nLines] + '줄'; $('slB1').textContent = SLOT.bets[nBet] + '원'; $('slB2').textContent = '돌리기';
    $('slB0').disabled = $('slB1').disabled = spinning || lim;
    const cant = spinning || lim || r.gold < tot;
    $('slB2').disabled = cant; $('slLev').disabled = cant;
    $('slExit').disabled = spinning; $('slExit').style.filter = spinning ? 'grayscale(1) opacity(.55)' : '';
    $('slPlate').textContent = slotMsg || (lim ? '오늘은 여기까지' : r.gold < tot ? '용돈이 모자랍니다' : '판돈 ' + tot + '원');
  }
  function showBunnyMan() {
    const st = document.querySelector('.slstage'); if (!st || st.querySelector('.bman')) return;
    const im = document.createElement('img'); im.className = 'bman'; im.alt = ''; im.draggable = false; im.src = slotArt('bunnyman'); st.appendChild(im);
  }
  function lineSet() { const n = SLOT.lines[nLines]; return n === 1 ? [ROWS[1]] : n === 3 ? ROWS : ROWS.concat(DIAG); }
  function spin() {
    const r = run(), tot = total(), sc = used(); if (spinning || sc.n >= SLOT.limit || r.gold < tot) return;
    r.gold -= tot; sc.n++; G.run.save(); spinning = true; slotMsg = '두근두근…'; hud();
    document.querySelectorAll('.wn').forEach(e => e.classList.remove('on'));
    const res = [0, 1, 2].map(() => [0, 1, 2].map(() => rnd(syms)));
    for (let c = 0; c < 3; c++) {
      const prev = [grid[0][c], grid[1][c], grid[2][c]], ids = prev.slice(), N = 12 + c * 5;
      for (let i = 0; i < N; i++) ids.push(rnd(syms));
      const fin = [res[0][c], res[1][c], res[2][c]]; ids.push.apply(ids, fin);
      const st = $('st' + c), len = ids.length;
      st.style.transition = 'none'; st.style.height = (len / 3 * 100).toFixed(3) + '%'; st.style.transform = 'translateY(0)';
      st.innerHTML = ids.map(id => '<div class="cell" style="height:' + (100 / len).toFixed(4) + '%">' + symHTML(id) + '</div>').join('');
      $('rc' + c).classList.add('mv'); void st.offsetHeight;
      const dur = 1000 + c * 450;
      st.style.transition = 'transform ' + dur + 'ms cubic-bezier(.17,.7,.22,1)';
      st.style.transform = 'translateY(-' + ((len - 3) / len * 100).toFixed(4) + '%)';
      setTimeout(() => { $('rc' + c).classList.remove('mv'); clk(); if (c === 2) { grid = res; settle(res); } }, dur);
    }
  }
  function settle(res) {
    const r = run(), per = SLOT.bets[nBet]; let gold = 0, jackpot = false; const items = [], win = [], full = [];
    lineSet().forEach(L => {
      const s = L.map(p => res[p[0]][p[1]]), cnt = {}; s.forEach(x => { cnt[x] = (cnt[x] || 0) + 1; });
      const top = Object.keys(cnt).sort((a, b) => cnt[b] - cnt[a])[0], n = cnt[top];
      if (n === 3 && top === 'gold') { gold += per * SLOT.gold3; jackpot = true; }
      else if (n === 3) { items.push(top); jackpot = true; }
      else if (n === 2 && top === 'gold') gold += per * SLOT.gold2;
      else if (n === 2) gold += per * SLOT.pair;
      else return;
      L.forEach(p => { if (res[p[0]][p[1]] === top) win.push(p); });
    });
    items.forEach(id => { const d = IT.byId[id]; if (r.items.length < IT.slots) r.items.push(id); else { gold += IT.sell(d); full.push(d.name); } });
    r.gold += gold; G.run.save();
    win.forEach(p => { const e = $('wn' + p[0] + p[1]); if (e) e.classList.add('on'); });
    const parts = []; if (gold) parts.push('+' + gold + '원'); if (items.length) parts.push('경품 ' + items.length + '개');
    slotMsg = parts.length ? (jackpot ? '잭팟! ' : '') + parts.join(' ') : '꽝…';
    spinning = false; hud();
    if (items.length) prizeToast(items, full);
    if (jackpot) jackpotFx();
    if (used().n >= SLOT.limit) setTimeout(() => { if (mode === 'slot') { showBunnyMan(); slotMsg = '오늘은 여기까지'; hud(); } }, jackpot ? 2200 : 900);
  }
  function prizeToast(ids, full) {
    const st = document.querySelector('.slstage'); if (!st) return;
    const d = document.createElement('div'); d.className = 'slprize';
    d.innerHTML = '<div class="pi">' + ids.map(id => '<img alt="" src="' + art(id) + '">').join('') + '</div><b></b>';
    d.querySelector('b').textContent = ids.map(id => IT.byId[id].name).join(', ') + (full.length ? ' (가득 차서 판매됨)' : '');
    st.appendChild(d); setTimeout(() => d.remove(), 2700);
  }
  function jackpotFx() {
    const j = $('slJp'); if (!j) return;
    j.innerHTML = '<img alt="" src="' + slotArt('jp_girl') + '"><img alt="" src="' + slotArt('jp_boy') + '">'; j.classList.remove('hidden');
    setTimeout(() => { if (j) j.classList.add('hidden'); }, 2500);
  }

  function open(k) { if (!root) build(); kind = k; sel = null; msg = ''; mode = 'entry'; spinning = false; last = { t: 0, key: '' }; if (k === 'casino') newSyms(); root.classList.remove('hidden'); setBg(.05); paint(); if (G.sfx) G.sfx.bgm('map'); }
  function close() { if (spinning) return; root.classList.add('hidden'); if (G.map.refresh) G.map.refresh(); }
  G.shop = { open: open, close: close, kinds: KINDS, quest: {} }; // quest[장소]=true 이면 '대화하기' 버튼이 깜빡임
})();
