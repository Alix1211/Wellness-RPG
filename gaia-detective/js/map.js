// 스테이지 지도 화면 — 손가락으로 밀어서 이동. 가로 = 좌우 배치, 세로 = 위아래 배치.
(function () {
  const G = window.GAIA, D = G.map.data;
  const $ = id => document.getElementById(id);
  const src = n => window.GAIA_IMG ? (window.GAIA_IMG['map/' + n + '.webp'] || '') : D.base + n + '.webp';
  const root = $('map'), pan = $('mapPan'), card = $('mapCard');
  let s = 1, z = 1, sBase = 1, ox = 0, oy = 0, vw = 0, vh = 0, W = 0, H = 0, land = true, curId = null;
  const spots = {}, PAD = 140; // PAD: 지도 둘레에 더 보이는 잔디 여백(지도 픽셀, 임시)

  function build() {
    pan.innerHTML = ''; root.style.setProperty('--map-grass', 'url(' + src('grass_tile') + ')'); // 지도 바깥 잔디(케인 그림, 이음새 제거 타일)
    D.sheets.forEach((sh, si) => {
      const el = document.createElement('div'); el.className = 'sheet'; el.dataset.si = si;
      const g = document.createElement('img'); g.src = src(sh.ground); g.draggable = false; el.appendChild(g);
      sh.spots.forEach(sp => {
        const d = document.createElement('div'); d.className = 'spot locked' + (sp.layer ? '' : ' nolayer');
        d.style.cssText = 'left:' + sp.x + 'px;top:' + sp.y + 'px;width:' + sp.w + 'px;height:' + sp.h + 'px';
        d.dataset.id = sp.id;
        if (sp.layer) { const im = document.createElement('img'); im.src = src(sp.layer); im.draggable = false; d.appendChild(im); }
        const t = document.createElement('div'); t.className = 'tag'; d.appendChild(t);
        el.appendChild(d); spots[sp.id] = { sp: sp, el: d, sheet: si };
      });
      pan.appendChild(el);
    });
  }

  // 런 상태에 맞춰 건물 상태(열림/완료/잠김)와 이름표를 다시 그린다
  function refresh() {
    Object.keys(spots).forEach(id => {
      const o = spots[id], inf = G.run.spotInfo(id);
      o.el.classList.remove('open', 'locked', 'clear'); o.el.classList.add(inf.state);
      o.el.querySelector('.tag').textContent = (inf.state === 'clear' ? '✔ ' : '') + o.sp.name;
    });
    const r = G.run.get();
    $('mapInfo').querySelector('.s1').textContent = 'Lv.' + r.wl; $('mapInfo').querySelector('.s2').textContent = r.hp + '/' + G.config.player.maxHp; $('mapInfo').querySelector('.s3').textContent = r.deck.length;
  }

  function layout() {
    vw = root.clientWidth; vh = root.clientHeight; if (!vw || !vh) return;
    land = vw >= vh;
    sBase = land ? vh / D.h : Math.max(vw / D.w, 0.7 * vh / D.h); s = sBase * z;
    const sheets = pan.children;
    for (let i = 0; i < sheets.length; i++) { sheets[i].style.left = (land ? i * D.w : 0) + 'px'; sheets[i].style.top = (land ? 0 : i * D.h) + 'px'; }
    W = D.w * (land ? D.sheets.length : 1); H = D.h * (land ? 1 : D.sheets.length);
    apply();
  }
  function clamp() {
    const cw = W * s, ch = H * s;
    const p = PAD * s; // 지도 둘레 잔디 여백
    ox = cw + 2 * p <= vw ? (vw - cw) / 2 : Math.min(p, Math.max(vw - cw - p, ox));
    oy = ch + 2 * p <= vh ? (vh - ch) / 2 : Math.min(p, Math.max(vh - ch - p, oy));
  }
  function apply() { clamp(); pan.style.transform = 'translate(' + ox + 'px,' + oy + 'px) scale(' + s + ')'; root.style.backgroundSize = (836 * s) + 'px ' + (836 * s) + 'px'; root.style.backgroundPosition = ox + 'px ' + oy + 'px'; }
  function center(id) {
    const o = spots[id]; if (!o) return;
    const bx = (land ? o.sheet * D.w : 0) + o.sp.x + o.sp.w / 2, by = (land ? 0 : o.sheet * D.h) + o.sp.y + o.sp.h / 2;
    ox = vw / 2 - bx * s; oy = vh / 2 - by * s; apply();
  }

  // 드래그 이동 / 탭 선택 / 두 손가락 오므리고 벌려 확대·축소(휠도 가능)
  const zr = () => [Math.min(1, Math.min(vw / (W + 2 * PAD), vh / (H + 2 * PAD)) / sBase), 2.5]; // 줌 범위: 지도 전체가 보이는 정도 ~ 기본의 2.5배
  const pts = {}; let dn = null, pinch = null;
  const mid = () => { const k = Object.keys(pts), a = pts[k[0]], b = pts[k[1]]; return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, d: Math.hypot(a.x - b.x, a.y - b.y) || 1 }; };
  function zoomAt(nz, cx, cy, wx, wy) { const r = zr(); z = Math.max(r[0], Math.min(r[1], nz)); s = sBase * z; ox = cx - wx * s; oy = cy - wy * s; apply(); }
  root.addEventListener('pointerdown', e => {
    if (e.target.closest('#mapCard') || e.target.closest('#mapBag') || e.target.closest('#mapFs')) return;
    const rc = root.getBoundingClientRect(); pts[e.pointerId] = { x: e.clientX - rc.left, y: e.clientY - rc.top };
    try { root.setPointerCapture(e.pointerId); } catch (x) {}
    if (Object.keys(pts).length === 2) { const m = mid(); pinch = { d0: m.d, z0: z, wx: (m.x - ox) / s, wy: (m.y - oy) / s }; dn = null; root.classList.add('panning'); closeCard(); return; }
    if (Object.keys(pts).length > 2) return;
    dn = { x: e.clientX, y: e.clientY, ox: ox, oy: oy, moved: false, spot: (e.target.closest('.spot') || {}).dataset ? e.target.closest('.spot').dataset.id : null };
  });
  root.addEventListener('pointermove', e => {
    if (pts[e.pointerId]) { const rc = root.getBoundingClientRect(); pts[e.pointerId] = { x: e.clientX - rc.left, y: e.clientY - rc.top }; }
    if (pinch && Object.keys(pts).length >= 2) { const m = mid(); zoomAt(pinch.z0 * m.d / pinch.d0, m.x, m.y, pinch.wx, pinch.wy); return; }
    if (!dn) return; const dx = e.clientX - dn.x, dy = e.clientY - dn.y;
    if (!dn.moved && Math.hypot(dx, dy) > 8) { dn.moved = true; root.classList.add('panning'); }
    if (dn.moved) { ox = dn.ox + dx; oy = dn.oy + dy; apply(); }
  });
  function up(e) {
    delete pts[e.pointerId];
    if (pinch) { if (Object.keys(pts).length < 2) { pinch = null; dn = null; root.classList.remove('panning'); } return; }
    if (!dn) return; const d = dn; dn = null; root.classList.remove('panning');
    if (!d.moved) { if (d.spot) pick(d.spot); else closeCard(); }
  }
  root.addEventListener('pointerup', up);
  root.addEventListener('pointercancel', e => { delete pts[e.pointerId]; if (Object.keys(pts).length < 2) pinch = null; dn = null; root.classList.remove('panning'); });
  root.addEventListener('wheel', e => { e.preventDefault(); const rc = root.getBoundingClientRect(), cx = e.clientX - rc.left, cy = e.clientY - rc.top; zoomAt(z * (e.deltaY < 0 ? 1.12 : 1 / 1.12), cx, cy, (cx - ox) / s, (cy - oy) / s); }, { passive: false });

  // 건물 카드
  function pick(id) {
    const o = spots[id]; if (!o) return; curId = id;
    Object.values(spots).forEach(x => x.el.classList.toggle('sel', x === o));
    const inf = G.run.spotInfo(id);
    $('mcName').textContent = o.sp.name;
    $('mcSub').textContent = (inf.title ? inf.title + ' · ' : '') + inf.sub;
    const go = $('mcGo'); go.disabled = !inf.go; go.textContent = inf.go || (inf.state === 'clear' ? '완료' : '갈 수 없음');
    card.classList.remove('hidden');
    if (G.sfx) G.sfx.play('click');
  }
  function closeCard() { curId = null; card.classList.add('hidden'); Object.values(spots).forEach(x => x.el.classList.remove('sel')); }
  $('mcClose').addEventListener('click', closeCard);
  $('mcGo').addEventListener('click', () => {
    const id = curId; if (!id || !G.run.spotInfo(id).go) return;
    lastId = id; closeCard(); G.run.enter(id);
  });

  let lastId = null, built = false;
  function open() {
    if (!built) { build(); built = true; }
    root.classList.remove('hidden'); closeCard(); refresh(); layout(); center(lastId || D.start); if (G.sfx) G.sfx.bgm('map');
    const h = $('mapHint'); h.classList.remove('fade'); void h.offsetWidth; h.classList.add('fade');
    if (G.story && G.story.onMap) G.story.onMap();
  }
  window.addEventListener('resize', () => { if (!root.classList.contains('hidden')) { layout(); } });
  G.map.refresh = refresh; G.map.open = open; G.map.close = () => root.classList.add('hidden');
})();
