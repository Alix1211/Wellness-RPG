// 초상화 대화 장면: 아래 대화창 + 좌(로지)·우(상대) 그림. 탭하면 다음 줄, 건너뛰기 가능. 본 장면은 런에 기록해 한 번만 나온다.
(function () {
  const G = window.GAIA, $ = id => document.getElementById(id), S = G.story;
  const imgSrc = f => window.GAIA_IMG ? (window.GAIA_IMG[f] || '') : (f.indexOf('/') > 0 ? '../assets/gaia-detective/' + f : G.assets.base + f);
  const heroImg = k => imgSrc(G.assets.hero[k] || G.assets.hero.idle);
  let lines = null, i = 0, typing = null, done = null;

  function nextName() {
    const r = G.run.get(), st = (r.lap > 1 && G.flow.steps2 ? G.flow.steps2 : G.flow.steps)[r.step]; if (!st) return '현장';
    const sp = G.map.data.sheets.reduce((a, s) => a.concat(s.spots), []).find(x => x.id === st.spot); return sp ? sp.name : '현장';
  }
  function show() {
    const L = lines[i], hero = L.who === 'hero', n = S.npc[L.who];
    const hi = $('stHero'), ni = $('stNpc');
    hi.src = heroImg(hero ? (L.pose || 'idle') : (lines.heroPose || 'idle')); hi.classList.toggle('dim', !hero);
    const other = lines.find(x => x.who !== 'hero'); const nn = S.npc[hero ? (other ? other.who : 'chief') : L.who];
    ni.src = imgSrc(nn.img); ni.classList.toggle('dim', hero);
    $('stName').textContent = hero ? '로지' : n.name; $('stName').className = hero ? 'hero' : 'npc';
    const txt = L.text.replace('{next}', nextName()), el = $('stText'); el.textContent = ''; let k = 0;
    clearInterval(typing); typing = setInterval(() => { el.textContent = txt.slice(0, ++k); if (k >= txt.length) { clearInterval(typing); typing = null; $('stMore').style.opacity = 1; } }, 28);
    el.dataset.full = txt; $('stMore').style.opacity = 0;
  }
  function advance() {
    if (typing) { clearInterval(typing); typing = null; $('stText').textContent = $('stText').dataset.full; $('stMore').style.opacity = 1; return; }
    if (++i >= lines.length) return end(); show();
  }
  function end() { clearInterval(typing); typing = null; $('story').classList.add('hidden'); lines = null; const d = done; done = null; if (d) d(); }
  function play(key, cb) {
    const sc = S.scenes[key]; if (!sc) { if (cb) cb(); return; }
    lines = sc.slice(); i = 0; done = cb; $('story').classList.remove('hidden'); if (G.sfx) G.sfx.play('click'); show();
  }
  // 지도가 열릴 때: 이 런에서 처음이면 장면 재생(1막/2막 각각 한 번)
  function onMap() {
    const r = G.run.get(); r.seen = r.seen || {}; const key = r.lap > 1 ? 'act2' : 'act1'; if (r.seen[key] || !S.scenes[key]) return;
    r.seen[key] = 1; G.run.save(); play(key);
  }
  document.addEventListener('DOMContentLoaded', () => {
    $('story').addEventListener('click', e => { if (e.target.id === 'stSkip') return; if (G.sfx) G.sfx.play('click'); advance(); });
    $('stSkip').addEventListener('click', e => { e.stopPropagation(); if (G.sfx) G.sfx.play('click'); end(); });
  });
  G.story.play = play; G.story.onMap = onMap;
})();
