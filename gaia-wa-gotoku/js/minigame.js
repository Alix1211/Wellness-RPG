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
      if (d.type === 'wellness-result') G.minigame.onResult(d);
      else if (d.type === 'wellness-close') close();
      else if (d.type === 'game-retry') { if (cur.opts.canRetry && !cur.opts.canRetry()) close(); else launch(); }
    });
  }
  // 게임 문서: 등록 때 직접 주거나(doc), 단일 빌드에 넣어 둔 것(GAIA_DOC), 아니면 파일(docUrl)에서 불러온다
  function getDoc(def) {
    if (def.doc) return Promise.resolve(def.doc);
    if (window.GAIA_DOC && window.GAIA_DOC[def.id]) return Promise.resolve(window.GAIA_DOC[def.id]);
    return fetch(def.docUrl).then(r => r.text()).then(t => { def.doc = t; return t; });
  }
  function launch() {
    const def = cur.def, cfg = def.cfg(cur.opts), c0 = cur;
    getDoc(def).then(doc => {
      if (cur !== c0) return;
      if (def.transformDoc) doc = def.transformDoc(doc);
      const boot = '<script>window.GAIA_SOUND_SOURCES=' + JSON.stringify(def.sounds ? def.sounds() : {}) + ';<\/script>';
      fr.srcdoc = doc.replace('/*LIFE_CONFIG*/', JSON.stringify(cfg).replace(/</g, '\\u003c')).replace('<meta', boot + '<meta');
      root.classList.remove('hidden');
    }).catch(() => close());
  }
  let prevBgm = null; // 게임 중에는 본게임 BGM을 끄고, 닫으면 원래 곡으로
  function play(id, opts) { ensure(); const def = defs[id]; if (!def) return; cur = { def: def, opts: opts || {} }; if (G.sfx && G.sfx.bgmGet) { prevBgm = G.sfx.bgmGet(); G.sfx.bgm(null); } if(window.BeltStory)BeltStory.play('police.training',{title:'경찰서 · 단련',...window.BeltDialogue.actors.chief},()=>{if(cur?.def===def)launch();});else launch(); }
  function close() { if (!cur) return; const c = cur; cur = null; fr.srcdoc = ''; root.classList.add('hidden'); if (G.sfx && G.sfx.bgm && prevBgm) G.sfx.bgm(prevBgm); prevBgm = null; if (c.opts.onClose) c.opts.onClose(); }
  G.minigame = {
    register: (id, d) => { d.id = id; defs[id] = d; }, play: play, close: close, layout: {},
    onResult: r => { if (cur && cur.opts.onResult) cur.opts.onResult(r); },
    canRetry: () => !cur || !cur.opts.canRetry || cur.opts.canRetry()
  };
})();
