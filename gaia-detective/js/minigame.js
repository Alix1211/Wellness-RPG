// 미니게임 공통 — 전체 화면 iframe 위에 게임을 띄우고 결과를 받는다.
// 등록: G.minigame.register(id, { doc, cfg(opts), sounds() })  /  실행: G.minigame.play(id, { onResult, onClose, canRetry, wl })
// 게임 쪽(iframe)은 parent.GAIA.minigame.onResult(r) 로 결과를 알리고, '다시'가 가능한지는 canRetry() 로 묻는다.
(function () {
  const G = window.GAIA, defs = {};
  let cur = null, root = null, fr = null;
  function ensure() {
    if (root) return;
    root = document.createElement('div'); root.id = 'minigame'; root.className = 'hidden';
    fr = document.createElement('iframe'); fr.setAttribute('allow', 'autoplay'); root.appendChild(fr); document.body.appendChild(root);
    window.addEventListener('message', e => {
      if (!cur || e.source !== fr.contentWindow) return;
      const d = e.data || {};
      if (d.type === 'wellness-close') close();
      else if (d.type === 'game-retry') { if (cur.opts.canRetry && !cur.opts.canRetry()) close(); else launch(); }
    });
  }
  function launch() {
    const def = cur.def, cfg = def.cfg(cur.opts);
    const boot = '<script>window.GAIA_SOUND_SOURCES=' + JSON.stringify(def.sounds()) + ';<\/script>';
    fr.srcdoc = def.doc.replace('/*LIFE_CONFIG*/', JSON.stringify(cfg).replace(/</g, '\\u003c')).replace('<meta', boot + '<meta');
    root.classList.remove('hidden');
  }
  function play(id, opts) { ensure(); const def = defs[id]; if (!def) return; cur = { def: def, opts: opts || {} }; launch(); }
  function close() { if (!cur) return; const c = cur; cur = null; fr.srcdoc = ''; root.classList.add('hidden'); if (c.opts.onClose) c.opts.onClose(); }
  G.minigame = {
    register: (id, d) => { defs[id] = d; }, play: play, close: close, layout: {},
    onResult: r => { if (cur && cur.opts.onResult) cur.opts.onResult(r); },
    canRetry: () => !cur || !cur.opts.canRetry || cur.opts.canRetry()
  };
})();
