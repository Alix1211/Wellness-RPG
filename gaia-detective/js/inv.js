// 인벤·스탯 창 — 착용 칸 6 + 소지품 칸 20. 런 데이터(G.run.get()): items(소지품), equip(착용), gold.
// 열기: G.inv.open({battle:true|false}). 전투 중에는 소모품 사용만 가능하고 착용 변경·버리기는 회색.
(function () {
  const G = window.GAIA, $ = id => document.getElementById(id), IT = G.items;
  const art = k => window.GAIA_IMG ? (window.GAIA_IMG['ui/items/' + k + '.webp'] || '') : '../assets/gaia-detective/ui/items/' + k + '.webp';
  const W = 1448, H = 1086;
  const pos = (x, y, w, h) => 'left:' + (x / W * 100) + '%;top:' + (y / H * 100) + '%;width:' + (w / W * 100) + '%;height:' + (h / H * 100) + '%';
  const EQ = [[58, 307], [58, 472], [58, 640], [503, 307], [503, 472], [503, 640]].map(p => [p[0] + 2, p[1] + 2, 116, 116]);
  const BG = []; [272, 425, 580, 733].forEach(y => [665, 810, 955, 1100, 1243].forEach(x => BG.push([x + 3, y + 3, 124, 124])));
  let root, win, mode = { battle: false }, sel = null, tipEl, confirmDrop = false;
  const run = () => G.run.get();
  const inBattleNow = () => { const S = G.ui && G.ui.state(); return mode.battle && S && S.phase === 'player' && !S.result; };

  function build() {
    root = document.createElement('div'); root.id = 'inv'; root.className = 'hidden';
    root.innerHTML = '<div class="invwin"><div class="invtitle"></div><div class="invx"></div></div>';
    document.getElementById('app').appendChild(root);
    win = root.firstChild;
    EQ.forEach((p, i) => { const d = document.createElement('div'); d.className = 'isl eq'; d.dataset.k = 'eq'; d.dataset.i = i; d.style.cssText = pos.apply(null, p); win.appendChild(d); });
    BG.forEach((p, i) => { const d = document.createElement('div'); d.className = 'isl bg'; d.dataset.k = 'bg'; d.dataset.i = i; d.style.cssText = pos.apply(null, p); win.appendChild(d); });
    [['istat s1', [165, 932, 310, 66]], ['istat s2', [570, 932, 320, 66]], ['istat s3', [1068, 934, 238, 64]]].forEach(a => { const d = document.createElement('div'); d.className = a[0]; d.style.cssText = pos.apply(null, a[1]); win.appendChild(d); });
    tipEl = document.createElement('div'); tipEl.className = 'itip hidden'; win.appendChild(tipEl);
    win.querySelector('.invx').addEventListener('click', close);
    root.addEventListener('pointerdown', e => { if (e.target === root) close(); });
    win.addEventListener('click', e => {
      const s = e.target.closest('.isl'); if (s) { const k = s.dataset.k, i = +s.dataset.i, has = k === 'eq' ? run().equip[i] : run().items[i]; if (!has) { sel = null; } else sel = (sel && sel.k === k && sel.i === i) ? null : { k: k, i: i }; confirmDrop = false; paint(); return; }
      if (!e.target.closest('.itip') && !e.target.closest('.invx')) { sel = null; confirmDrop = false; paint(); }
    });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && !root.classList.contains('hidden')) close(); });
  }

  function paint() {
    const r = run(), bt = inBattleNow();
    [].forEach.call(win.querySelectorAll('.isl'), el => {
      const k = el.dataset.k, i = +el.dataset.i, id = k === 'eq' ? r.equip[i] : r.items[i];
      el.innerHTML = id ? '<img alt="" draggable="false" src="' + art(id) + '">' : '';
      el.classList.toggle('on', !!(sel && sel.k === k && sel.i === i));
    });
    win.querySelector('.invtitle').textContent = '소지품 ' + r.items.length + ' / ' + IT.slots + (mode.battle ? '  ·  전투 중' : '');
    win.querySelector('.s1').textContent = '체력 ' + (G.ui.state() && mode.battle ? G.ui.state().p.hp : r.hp) + ' / ' + G.config.player.maxHp;
    win.querySelector('.s2').textContent = '덱 ' + r.deck.length + '장';
    win.querySelector('.s3').textContent = r.gold + '원';
    paintTip(bt);
  }

  function btn(txt, fn, dis, purple) { const b = document.createElement('button'); b.textContent = txt; b.disabled = !!dis; if (purple) b.className = 'pu'; b.addEventListener('click', e => { e.stopPropagation(); if (G.sfx) G.sfx.play('click'); fn(); }); return b; }
  function paintTip(bt) {
    if (!sel) { tipEl.classList.add('hidden'); return; }
    const r = run(), id = sel.k === 'eq' ? r.equip[sel.i] : r.items[sel.i], d = IT.byId[id]; if (!d) { sel = null; tipEl.classList.add('hidden'); return; }
    tipEl.innerHTML = '<b></b><em></em><span></span><div class="row"></div>';
    tipEl.querySelector('b').textContent = d.name; tipEl.querySelector('em').textContent = IT.typeName[d.type] + ' · ' + d.price + '원 (판매 ' + IT.sell(d) + '원)';
    tipEl.querySelector('span').textContent = IT.describe(d);
    const row = tipEl.querySelector('.row'), fullEq = r.equip.length >= IT.equipMax;
    if (d.type === 'relic' && sel.k === 'bg') row.appendChild(btn(fullEq ? '착용 칸 가득' : '착용', () => equip(sel.i), bt || mode.battle || fullEq));
    if (d.type === 'relic' && sel.k === 'eq') row.appendChild(btn('해제', () => unequip(sel.i), mode.battle || r.items.length >= IT.slots));
    if (d.type === 'cons') { const heal = d.fx.heal && Object.keys(d.fx).length === 1; row.appendChild(btn('사용', () => useIt(sel.i, d), mode.battle ? !bt : !heal || r.hp >= G.config.player.maxHp)); }
    if (sel.k === 'bg') row.appendChild(btn(confirmDrop ? '정말 버림?' : '버리기', () => { if (!confirmDrop) { confirmDrop = true; paint(); return; } r.items.splice(sel.i, 1); sel = null; confirmDrop = false; G.run.save(); paint(); }, mode.battle, true));
    // 위치: 선택한 칸 아래(공간이 모자라면 위), 창 안으로 맞춤
    const slot = win.querySelector('.isl[data-k="' + sel.k + '"][data-i="' + sel.i + '"]'), wr = win.getBoundingClientRect(), sr = slot.getBoundingClientRect();
    tipEl.classList.remove('hidden');
    const tw = tipEl.offsetWidth, th = tipEl.offsetHeight;
    let x = sr.left - wr.left + sr.width / 2 - tw / 2, y = sr.bottom - wr.top + 4;
    if (y + th > wr.height - 6) y = sr.top - wr.top - th - 4;
    x = Math.max(4, Math.min(wr.width - tw - 4, x)); tipEl.style.left = x + 'px'; tipEl.style.top = Math.max(4, y) + 'px';
  }

  function equip(i) { const r = run(), id = r.items[i]; if (!id || r.equip.length >= IT.equipMax) return; r.items.splice(i, 1); r.equip.push(id); sel = { k: 'eq', i: r.equip.length - 1 }; G.run.save(); paint(); }
  function unequip(i) { const r = run(), id = r.equip[i]; if (!id || r.items.length >= IT.slots) return; r.equip.splice(i, 1); r.items.push(id); sel = { k: 'bg', i: r.items.length - 1 }; G.run.save(); paint(); }
  function useIt(i, d) {
    const r = run();
    if (mode.battle) { if (G.ui.useItem(d.id)) { sel = null; paint(); } return; }
    if (d.fx.heal) { r.hp = Math.min(G.config.player.maxHp, r.hp + d.fx.heal); r.items.splice(i, 1); sel = null; G.run.save(); if (G.map.refresh) G.map.refresh(); paint(); }
  }
  function open(o) { if (!root) build(); mode = { battle: !!(o && o.battle) }; sel = null; confirmDrop = false; root.classList.remove('hidden'); paint(); }
  function close() { root.classList.add('hidden'); sel = null; if (G.map.refresh) G.map.refresh(); }

  const dv = document.getElementById('devItems');
  if (dv) dv.addEventListener('click', () => { const r = run(); for (let n = 0; n < 6 && r.items.length < IT.slots; n++) r.items.push(IT.list[Math.floor(Math.random() * IT.list.length)].id); G.run.save(); });
  const mb = document.getElementById('mapBag'); if (mb) mb.addEventListener('click', () => { if (G.sfx) G.sfx.play('click'); open({ battle: false }); });
  G.inv = { open: open, close: close };
})();
