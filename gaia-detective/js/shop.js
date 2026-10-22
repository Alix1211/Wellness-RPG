// 마트·카지노 상점 — 지도에서 건물을 눌러 언제든 입장. 사기/팔기: 칸을 한 번 누르면 정보, 두 번 연속(더블클릭·더블탭)하면 바로 거래.
// 진열은 한 바퀴(run.lap)마다 새로 바뀌고, 산 칸은 품절. 슬롯머신은 버튼만(준비 중, 회색).
(function () {
  const G = window.GAIA, $ = id => document.getElementById(id), IT = G.items;
  const art = k => window.GAIA_IMG ? (window.GAIA_IMG['ui/items/' + k + '.webp'] || '') : '../assets/gaia-detective/ui/items/' + k + '.webp';
  const clerkSrc = k => window.GAIA_IMG ? (window.GAIA_IMG['ui/clerk/' + k + '.webp'] || '') : '../assets/gaia-detective/ui/clerk/' + k + '.webp'; // 점원 초상화(없으면 숨김)
  const KINDS = { mart: { name: '마트' }, casino: { name: '카지노' } };
  const rnd = a => a[Math.floor(Math.random() * a.length)];
  const pickN = (a, n) => { const b = a.slice(), o = []; while (o.length < n && b.length) o.push(b.splice(Math.floor(Math.random() * b.length), 1)[0]); return o; };
  // 슬롯머신 규칙(수치는 여기서만 조정): 릴 3개, 심볼 8종(무작위 아이템 7종 + 골드). 3개 일치=그 아이템 경품, 골드3=판돈×10, 골드2=판돈×2, 다른 그림 2개=판돈 반환
  const SLOT = { bet: 20, gold3: 10, gold2: 2, pair: 1 };
  let root, kind = 'mart', sel = null, last = { t: 0, key: '' }, msg = '', mode = 'shop', syms = null, spinning = false, slotMsg = '', reel = ['gold', 'gold', 'gold'];
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
    if (mode === 'slot') return paintSlot();
    const r = run(), st = stockOf(kind);
    root.innerHTML = '<div class="shwin"><h2></h2><div class="shbody"><div class="clerk"></div><div class="shcol"><b>진열대</b><div class="shgrid" id="shStock"></div></div><div class="shcol"><b>내 소지품 <i></i></b><div class="shgrid" id="shMine"></div></div></div><div class="shinfo"><div class="shtxt"></div><div class="shbtns"></div></div></div>';
    const w = root.firstChild; w.querySelector('h2').textContent = KINDS[kind].name;
    const cs = clerkSrc(kind); const cl = w.querySelector('.clerk'); fetchClerk(cl, cs);
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
    mk(bt, '나가기', close, false, true);
  }
  function fetchClerk(el, src) { if (!src) { el.classList.add('hidden'); return; } const im = new Image(); im.onload = () => { el.classList.remove('hidden'); el.innerHTML = ''; el.appendChild(im); }; im.onerror = () => el.classList.add('hidden'); el.classList.add('hidden'); im.src = src; }
  function mk(parent, txt, fn, dis, purple) { const b = document.createElement('button'); b.textContent = txt; b.disabled = !!dis; if (purple) b.className = 'pu'; b.addEventListener('click', () => { if (G.sfx) G.sfx.play('click'); fn(); }); parent.appendChild(b); }
  // ── 슬롯머신 ──
  const symHTML = id => id === 'gold' ? '<i class="coin"></i>' : '<img alt="" draggable="false" src="' + art(id) + '">';
  function newSyms() { syms = pickN(IT.list.map(d => d.id), 7).concat(['gold']); }
  function openSlot() { mode = 'slot'; slotMsg = '판돈 ' + SLOT.bet + '원 — 돌리기를 눌러 보세요'; paintSlot(); }
  function paintSlot() {
    const r = run();
    root.innerHTML = '<div class="shwin slotwin"><h2>슬롯머신</h2><div class="reels"></div><div class="legend"><b>오늘의 심볼</b><div class="lgrid"></div></div><div class="shinfo"><div class="shtxt"></div><div class="shbtns"></div></div></div>';
    const w = root.firstChild, rl = w.querySelector('.reels');
    for (let i = 0; i < 3; i++) { const d = document.createElement('div'); d.className = 'rl'; d.id = 'rl' + i; d.innerHTML = symHTML(reel[i]); rl.appendChild(d); }
    const lg = w.querySelector('.lgrid'); syms.forEach(id => { const d = document.createElement('div'); d.className = 'ls'; d.innerHTML = symHTML(id); lg.appendChild(d); });
    w.querySelector('.shtxt').innerHTML = '<span></span>'; w.querySelector('.shtxt').firstChild.textContent = slotMsg;
    const bt = w.querySelector('.shbtns');
    mk(bt, '돌리기 (' + SLOT.bet + '원)', spin, spinning || r.gold < SLOT.bet, false);
    const g = document.createElement('div'); g.className = 'shgold'; g.textContent = r.gold + '원'; bt.appendChild(g);
    mk(bt, '나가기', () => { if (spinning) return; mode = 'shop'; paint(); }, spinning, true);
  }
  function spin() {
    const r = run(); if (spinning || r.gold < SLOT.bet) return;
    r.gold -= SLOT.bet; G.run.save(); spinning = true; slotMsg = '두근두근…';
    const res = [0, 1, 2].map(() => rnd(syms));
    paintSlot();
    const stopAt = [700, 1100, 1500], timers = [];
    [0, 1, 2].forEach(i => {
      const el = $('rl' + i); el.classList.add('spin');
      timers[i] = setInterval(() => { el.innerHTML = symHTML(rnd(syms)); }, 70);
      setTimeout(() => { clearInterval(timers[i]); el.classList.remove('spin'); el.innerHTML = symHTML(res[i]); reel[i] = res[i]; if (G.sfx) G.sfx.play('click'); if (i === 2) settle(res); }, stopAt[i]);
    });
  }
  function settle(res) {
    const r = run(), cnt = {}; res.forEach(s => { cnt[s] = (cnt[s] || 0) + 1; });
    const top = Object.keys(cnt).sort((a, b) => cnt[b] - cnt[a])[0], n = cnt[top];
    if (n === 3 && top === 'gold') { const g = SLOT.bet * SLOT.gold3; r.gold += g; slotMsg = '골드 3개! 대박! +' + g + '원'; }
    else if (n === 3) {
      const d = IT.byId[top];
      if (r.items.length < IT.slots) { r.items.push(top); slotMsg = '3개 일치! ' + d.name + ' 획득!'; } else { r.gold += IT.sell(d); slotMsg = '3개 일치! ' + d.name + ' (소지품이 가득 차서 ' + IT.sell(d) + '원으로 받음)'; }
    }
    else if (n === 2 && top === 'gold') { const g = SLOT.bet * SLOT.gold2; r.gold += g; slotMsg = '골드 2개! +' + g + '원'; }
    else if (n === 2) { const g = SLOT.bet * SLOT.pair; r.gold += g; slotMsg = '2개 일치 — 판돈 ' + g + '원 돌려받음'; }
    else slotMsg = '아쉽네요… 꽝!';
    spinning = false; G.run.save(); paintSlot();
  }

  function open(k) { if (!root) build(); kind = k; sel = null; msg = ''; mode = 'shop'; spinning = false; last = { t: 0, key: '' }; if (k === 'casino') newSyms(); root.classList.remove('hidden'); paint(); }
  function close() { if (spinning) return; root.classList.add('hidden'); if (G.map.refresh) G.map.refresh(); }
  G.shop = { open: open, close: close, kinds: KINDS };
})();
