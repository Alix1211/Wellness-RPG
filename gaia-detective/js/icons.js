// 아이콘 슬롯 — 화면의 이모지/글자를 '아이콘 파일'로 바꿔 끼우는 구조.
// assets/gaia-detective/ui/icons/<키>.png 파일이 있으면 자동으로 그 그림을, 없으면 지금의 이모지·글자를 쓴다. (키 목록은 같은 폴더 README.md)
(function () {
  const G = window.GAIA, cache = {};
  const src = k => window.GAIA_IMG ? (window.GAIA_IMG['ui/icons/' + k + '.png'] || '') : '../assets/gaia-detective/ui/icons/' + k + '.png';
  function probe(k) {
    cache[k] = null; const s = src(k); if (!s) { cache[k] = false; return; }
    const im = new Image(); im.onload = () => { cache[k] = true; hydrate(document); }; im.onerror = () => { cache[k] = false; }; im.src = s;
  }
  function hydrate(root) {
    [].forEach.call((root || document).querySelectorAll('.ic[data-ic]'), el => {
      const k = el.dataset.ic; if (cache[k] === undefined) probe(k);
      if (cache[k] === true && !el.querySelector('img')) { el.innerHTML = '<img alt="" draggable="false" src="' + src(k) + '">'; el.classList.add('has'); }
    });
  }
  G.icons = { hydrate: hydrate, html: (k, fb) => '<span class="ic" data-ic="' + k + '">' + fb + '</span>' };
})();
