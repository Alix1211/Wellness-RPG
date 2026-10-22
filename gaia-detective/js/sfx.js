// 효과음 — 파일 없이 브라우저가 만든다. 타격음만 저장소 음원(face-punch)을 쓰고, 없으면 합성음으로 대체.
(function () {
  const G = window.GAIA; let ctx = null, muted = false, vol = 0.5;
  try { muted = localStorage.getItem('gaia_mute') === '1'; } catch (e) {}
  function ac() {
    if (!ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; } }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  function tone(type, f0, f1, dur, gain, delay) {
    const c = ac(); if (!c) return; const t = c.currentTime + (delay || 0);
    const o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t); if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain * vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(c.destination); o.start(t); o.stop(t + dur + 0.02);
  }
  function noise(dur, gain, f0, f1, delay) {
    const c = ac(); if (!c) return; const t = c.currentTime + (delay || 0);
    const len = Math.floor(c.sampleRate * dur), buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const s = c.createBufferSource(); s.buffer = buf;
    const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(f1 || f0, t + dur);
    const g = c.createGain(); g.gain.setValueAtTime(gain * vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f).connect(g).connect(c.destination); s.start(t);
  }
  let punch = null;
  function punchSrc() {
    if (window.GAIA_SND && window.GAIA_SND.punch) return window.GAIA_SND.punch;
    return '../assets/audio/freesound_community-face-punch-91909.mp3';
  }
  // 목소리(녹음 파일). 겹치면 시끄러우니 짧은 시간 안에는 하나만 재생한다.
  const VF = { surprise:'surprise.mp3', yelp:'yelp.mp3', scare1:'scare1.mp3', scare2:'scare2.mp3', strain:'strain.mp3', pant:'pant.mp3',
    displeased:'displeased.mp3', sigh:'sigh.mp3', cry:'cry.mp3', homerun:'homerun.mp3', start:'game_start.ogg', ambient:'ambient_loop.mp3' };
  let vLast = 0, vAudio = null;
  function vsrc(n) {
    const key = VF[n].replace(/\.\w+$/, '');
    if (window.GAIA_SND && window.GAIA_SND.sfx && window.GAIA_SND.sfx[key]) return window.GAIA_SND.sfx[key];
    return ((G.assets && G.assets.sfxBase) || '../assets/gaia-detective/sfx/') + VF[n];
  }
  // 녹음 파일은 WebAudio 버퍼로 재생한다(띠링 소리와 같은 경로). 일부 앱 내장 화면은 <audio> 재생을 막기 때문.
  const bufs = {}; let loading = false, vNode = null;
  function dataToBuf(u) { const b = atob(u.slice(u.indexOf(',') + 1)), a = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) a[i] = b.charCodeAt(i); return a.buffer; }
  function loadBuf(key, src) {
    const c = ac(); if (!c || bufs[key]) return;
    const get = src.indexOf('data:') === 0 ? Promise.resolve(dataToBuf(src)) : fetch(src).then(r => r.arrayBuffer());
    get.then(ab => new Promise((res, rej) => { const p = c.decodeAudioData(ab, res, rej); if (p && p.then) p.then(res, rej); }))
      .then(b => { bufs[key] = b; if (key === 'ambient') ambOn(); }).catch(() => {});
  }
  // 배경에 계속 깔리는 소리(짧은 루프). 첫 터치 후 시작, 음소거하면 멈춤.
  let amb = null;
  function ambOn() {
    if (amb || muted || !bufs.ambient || bwant) return; const c = ac(); if (!c) return;
    const s = c.createBufferSource(), g = c.createGain(); s.buffer = bufs.ambient; s.loop = true; g.gain.value = 0.45; s.connect(g).connect(c.destination); s.start(0); amb = s;
  }
  function ambOff() { if (amb) { try { amb.stop(); } catch (e) {} amb = null; } }
  function preload() {
    if (loading) return; loading = true;
    Object.keys(VF).forEach(n => loadBuf(n, vsrc(n)));
    loadBuf('punch', punchSrc());
  }
  function playBuf(key, gain) {
    const c = ac(), b = bufs[key]; if (!c || !b) return null;
    const s = c.createBufferSource(), g = c.createGain(); s.buffer = b; g.gain.value = gain; s.connect(g).connect(c.destination); s.start(0); return s;
  }
  function voice(n, force) {
    const now = Date.now(); if (!force && now - vLast < 700) return; vLast = now;
    try {
      if (vNode) { try { vNode.stop(); } catch (e) {} vNode = null; }
      const node = playBuf(n, Math.min(1.6, vol * 2.4));
      if (node) { vNode = node; return; }
      if (vAudio) vAudio.pause(); const a = new Audio(vsrc(n)); a.volume = Math.min(1, vol * 1.6); vAudio = a; a.play().catch(() => {});
    } catch (e) {}
  }
  // ── 스팀랩소디 소리(남성 비명·결과음·BGM) — 케인 저장소에서 가져온 것. 곡·소리 배정은 모두 임시 ──
  const stmSrc = p => (window.GAIA_SND && window.GAIA_SND.stm && window.GAIA_SND.stm[p]) || (((G.assets && G.assets.sfxBase) || '../assets/gaia-detective/sfx/') + 'steam/' + p + '.ogg');
  const sbuf = {}, sdone = {}, pad2 = n => (n < 10 ? '0' : '') + n;
  function sLoad(p, cx) {
    const c = cx || ac(); if (!c) return Promise.resolve(null); const key = (cx ? 'b:' : '') + p; if (sbuf[key]) return sbuf[key];
    const u = stmSrc(p);
    return (sbuf[key] = (u.indexOf('data:') === 0 ? Promise.resolve(dataToBuf(u)) : fetch(u).then(r => r.arrayBuffer()))
      .then(ab => new Promise((res, rej) => { const q = c.decodeAudioData(ab, res, rej); if (q && q.then) q.then(res, rej); }))
      .then(b => { if (!cx) sdone[p] = b; return b; }).catch(() => null));
  }
  function sPlay(p, gain) { sLoad(p).then(b => { if (!b || !ctx || muted) return; const s = ctx.createBufferSource(), g = ctx.createGain(); s.buffer = b; g.gain.value = gain; s.connect(g).connect(ctx.destination); s.start(0); }); }
  let scLast = 0;
  function scream() { const t = Date.now(); if (t - scLast < 450 || Math.random() > 0.8) return; scLast = t; sPlay('voice/m' + pad2(1 + Math.floor(Math.random() * 19)), 0.7); }
  function sPreload() { for (let i = 1; i <= 19; i++) sLoad('voice/m' + pad2(i)); ['defeat', 'victory_F_1', 'victory_F_2', 'victory_F_3'].forEach(n => sLoad('results/' + n)); }
  // BGM: 메모리 때문에 32kHz 전용 오디오 엔진으로 한 곡씩만 풀어 둔다. 지도·상점=여성 테마, 일반 전투=여성 전투, 보스전=악마 테마(임시)
  const BG = { map: 'bgm/female_theme', battle: 'bgm/female_battle', boss: 'bgm/demon' }, BGV = 0.3;
  let bctx = null, bnode = null, bgain = null, bwant = null, bplay = null, breq = 0;
  function bc() {
    if (!bctx) { try { bctx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 32000 }); } catch (e) { try { bctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (x) { return null; } } }
    if (bctx.state === 'suspended') bctx.resume(); return bctx;
  }
  function bgmHalt() { const n = bnode, g = bgain; bnode = bgain = bplay = null; if (!n) return; try { const t = bctx.currentTime; g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(g.gain.value, t); g.gain.linearRampToValueAtTime(0.0001, t + 0.6); n.stop(t + 0.65); } catch (e) {} }
  function bgmGo() {
    if (!bwant || muted || bplay === bwant) return; const c = bc(); if (!c) return; const key = bwant, id = ++breq;
    bgmHalt(); bplay = key; ambOff();
    Object.keys(sbuf).forEach(k => { if (k.indexOf('b:bgm/') === 0 && k !== 'b:' + BG[key]) delete sbuf[k]; }); // 다른 곡은 메모리에서 비움
    sLoad(BG[key], c).then(b => {
      if (!b || id !== breq || muted) { if (id === breq) bplay = null; return; }
      const s = c.createBufferSource(), g = c.createGain(); s.buffer = b; s.loop = true; g.gain.setValueAtTime(0.0001, c.currentTime); g.gain.linearRampToValueAtTime(BGV, c.currentTime + 1.2); s.connect(g).connect(c.destination); s.start(0); bnode = s; bgain = g;
    });
  }
  function bgmSet(k) { bwant = BG[k] ? k : null; if (!bwant) { bplay = null; breq++; bgmHalt(); return; } bgmGo(); }
  function bgmDuck(sec) { if (!bgain) return; try { const t = bctx.currentTime; bgain.gain.cancelScheduledValues(t); bgain.gain.setValueAtTime(bgain.gain.value, t); bgain.gain.linearRampToValueAtTime(BGV * 0.25, t + 0.2); bgain.gain.linearRampToValueAtTime(BGV, t + sec); } catch (e) {} }
  const pick = a => a[Math.floor(Math.random() * a.length)];
  let tickT = 0;
  const S = {
    click: () => { if (Date.now() - tickT < 400) return; tone('sine', 700, 500, 0.06, 0.25); }, // 버튼 틱이 방금 났으면 중복 안 냄
    tick: () => { tone('square', 1500, 1000, 0.035, 0.14); noise(0.02, 0.12, 4000, 3000); },
    card: () => noise(0.14, 0.5, 600, 2400),
    hit: () => {
      try { if (playBuf('punch', Math.min(1.6, vol * 2.4))) return; if (!punch) punch = new Audio(punchSrc()); const a = punch.cloneNode(); a.volume = Math.min(1, vol * 1.4); a.play().catch(() => synthHit()); }
      catch (e) { synthHit(); }
      scream();
    },
    hurt: () => { tone('sine', 220, 70, 0.22, 0.7); noise(0.1, 0.4, 900, 300); tone('triangle', 900, 500, 0.18, 0.25, 0.05); if (Math.random() < 0.85) voice(pick(['surprise', 'yelp', 'scare1', 'scare2'])); },
    block: () => { tone('square', 1100, 900, 0.12, 0.18); tone('sine', 1650, 1300, 0.2, 0.2, 0.02); if (Math.random() < 0.5) voice('strain'); },
    stat: () => { tone('sine', 700, 1100, 0.12, 0.25); tone('sine', 1100, 1650, 0.14, 0.2, 0.07); },
    dopa: () => { S.stat(); if (Math.random() < 0.5) voice('pant'); },
    tight: () => { S.stat(); if (Math.random() < 0.6) voice('strain'); },
    heal: () => { tone('sine', 523, 523, 0.18, 0.3); tone('sine', 784, 784, 0.25, 0.3, 0.1); },
    arrest: () => { noise(0.04, 0.6, 3000, 3000); noise(0.04, 0.6, 3500, 3500, 0.1); tone('sine', 1320, 1320, 0.4, 0.3, 0.2); tone('sine', 1760, 1760, 0.5, 0.25, 0.28); voice('homerun', true); },
    flee: () => { noise(0.35, 0.5, 400, 3000); },
    disgust: () => { tone('sawtooth', 420, 160, 0.4, 0.25); voice('displeased'); },
    orgasm: () => { [523, 659, 784, 1047, 1319, 1568].forEach((f, i) => tone('sine', f, f, 0.45, 0.28, i * 0.07)); noise(0.7, 0.35, 3000, 9000, 0.35); tone('triangle', 1568, 2093, 0.6, 0.2, 0.4); },
    turn: () => { tone('sine', 880, 880, 0.3, 0.25); tone('sine', 1175, 1175, 0.4, 0.2, 0.12); },
    win: () => { bgmDuck(3.5); const k = 'results/victory_F_' + (1 + Math.floor(Math.random() * 3)); if (sdone[k]) sPlay(k, 0.8); else [523, 659, 784, 1047].forEach((f, i) => tone('triangle', f, f, 0.3, 0.3, i * 0.12)); },
    lose: () => { bgmDuck(3); if (sdone['results/defeat']) sPlay('results/defeat', 0.9); else [392, 349, 311, 262].forEach((f, i) => tone('triangle', f, f, 0.35, 0.3, i * 0.18)); voice('cry', true); },
    low: () => voice('sigh', true),
    start: () => voice('start', true)
  };
  // 모든 버튼에 가벼운 틱(눌림 확인용). 비활성 버튼은 소리 없음 → 눌러도 안 되는 버튼을 구분할 수 있음
  document.addEventListener('pointerdown', e => { const b = e.target && e.target.closest && e.target.closest('button'); if (!b || b.disabled || muted) return; tickT = Date.now(); try { S.tick(); } catch (x) {} }, true);
  function synthHit() { tone('sine', 180, 50, 0.16, 0.8); noise(0.08, 0.6, 1500, 400); }
  G.sfx = {
    play: function (n) { if (muted || !S[n]) return; try { S[n](); } catch (e) {} },
    isMuted: () => muted,
    toggle: function () { muted = !muted; try { localStorage.setItem('gaia_mute', muted ? '1' : '0'); } catch (e) {} if (muted) { ambOff(); bplay = null; breq++; bgmHalt(); } else { ambOn(); bgmGo(); } return muted; },
    bgm: bgmSet,
    bgmGet: () => bwant,
    unlock: function () { const c = ac(); preload(); sPreload(); if (bwant && !bnode) { bplay = null; bgmGo(); } return c; }
  };
})();
