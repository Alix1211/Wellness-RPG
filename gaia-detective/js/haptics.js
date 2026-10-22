// 진동: 앱(안드로이드)에서는 GaiaBridge.vibrate 로 직접 울린다(웹 진동은 일부 기기에서 안 울려서 직접 방식이 필요함).
// 브라우저에서는 navigator.vibrate 로 대신한다. 설정(켜짐/꺼짐)은 gaia_vib 에 저장된다.
(function (root) {
  'use strict';
  if (root.GAIA_HAPTICS) return;
  const KEY = 'gaia_vib';
  let enabled = true, holdUntil = 0, holdPri = -1, last = -1000;
  try { enabled = localStorage.getItem(KEY) !== '0'; } catch (e) {}
  const now = () => performance.now();
  const norm = a => (Array.isArray(a) ? a : [a]).slice(0, 99).map(n => Math.max(0, Math.min(10000, Math.floor(Number(n) || 0))));
  function toast(t) {
    try {
      const d = document.createElement('div'); d.textContent = t;
      d.style.cssText = 'position:fixed;left:50%;top:12vh;transform:translateX(-50%);z-index:2147483646;background:rgba(90,30,70,.92);color:#fff;font:800 2.4vh sans-serif;padding:1.2vh 3vh;border-radius:2vh;pointer-events:none';
      document.body.appendChild(d); setTimeout(() => d.remove(), 1600);
    } catch (e) {}
  }
  function raw(p) {
    try {
      if (root.GaiaBridge && typeof root.GaiaBridge.vibrate === 'function') { if (root.GaiaBridge.vibrate(p.join(',')) === 'ok') return true; }
      if (typeof navigator.vibrate === 'function') return navigator.vibrate(p.length > 1 ? p : p[0]) === true;
    } catch (e) {}
    return false;
  }
  // pri: 0 약한 반응(틱) < 1 타격 < 2 피격·체포 < 3 절정·테스트. 진행 중인 더 센 진동을 약한 것이 끊지 않는다.
  function request(input, pri, force) {
    const p = norm(input), dur = p.reduce((a, b) => a + b, 0);
    if (!dur) return stop();
    if (!enabled || document.hidden) return false;
    pri = Math.max(0, Math.min(3, pri | 0)); const t = now();
    if (!force && t < holdUntil && pri <= holdPri) return false;
    if (!force && pri === 0 && t - last < 90) return false;
    if (!raw(p)) return false;
    last = t; holdPri = pri; holdUntil = t + dur; return true;
  }
  function stop() { holdUntil = 0; holdPri = -1; try { if (root.GaiaBridge) root.GaiaBridge.vibrate('0'); if (navigator.vibrate) navigator.vibrate(0); } catch (e) {} return true; }
  function set(v) { enabled = !!v; try { localStorage.setItem(KEY, enabled ? '1' : '0'); } catch (e) {} if (!enabled) stop(); return enabled; }
  const fx = {
    tick: () => request([9], 0),
    hit: () => request([30], 1),
    bigHit: () => request([45, 30, 70], 1),
    hurt: () => request([55, 45, 55], 2),
    heavyHurt: () => request([80, 40, 80, 40, 120], 2),
    arrest: () => request([35, 40, 35, 40, 140], 2),
    orgasm: () => request([90, 60, 90, 60, 160, 70, 420], 3),
    victory: () => request([40, 50, 40, 50, 200], 2)
  };
  root.GAIA_HAPTICS = {
    request, stop, fx, get enabled() { return enabled; }, setEnabled: set,
    toggle() { const v = set(!enabled); toast(v ? '진동 켜짐' : '진동 꺼짐'); if (v) request([120, 60, 160], 3, true); return v; },
    test() { set(true); toast('진동 테스트'); return request([500, 120, 650], 3, true); }
  };
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
})(window);
