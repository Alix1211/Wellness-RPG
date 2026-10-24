// GAIA Pingpong: optional, one-use-per-match arcade powers prototype.
// This code is injected inside the embedded 3D match script. It deliberately
// does not alter career rewards, saves, cards, or standard momentum skills.
const ARCADE_POWER_BASE_RADIUS = 0.08;
const arcadePower = { used: false, active: null, remaining: 0, bombLeft: 0,
  slipVX: 0, slipVZ: 0, panelOpen: false };

const ARCADE_POWER_OPTIONS = [
  { id: 'bigBall', icon: '🏐', name: '거대 공', description: '공 1.8배 · 이번 랠리' },
  { id: 'tinyBall', icon: '🫧', name: '초소형 공', description: '공 0.55배 · 이번 랠리' },
  { id: 'bombBall', icon: '💣', name: '10초 폭탄', description: '10초 후 공 위치에서 폭발' },
  { id: 'bigRacket', icon: '🏓', name: '거대 라켓', description: '내 라켓 1.5배 · 이번 랠리' },
  { id: 'tinyRacket', icon: '🪄', name: '초소형 라켓', description: '상대 라켓 0.55배 · 이번 랠리' },
  { id: 'slippery', icon: '🧊', name: '미끄러운 바닥', description: '상대 이동 관성 · 2초' },
  { id: 'paint', icon: '🎨', name: '핑크 물감', description: '상대 코트 물감 · 2초' },
  { id: 'pinkFog', icon: '🌫️', name: '핑크 안개', description: '상대 코트 안개 · 2초' },
];

// Small 3D fuse so the bomb reads as an object, not just a dark recolor.
const arcadeBombFuse = new THREE.Group();
const arcadeWick = new THREE.Mesh(
  new THREE.CylinderGeometry(0.011, 0.015, 0.14, 7),
  new THREE.MeshBasicMaterial({color:0x4e344d})
);
arcadeWick.position.y = 0.125;
arcadeBombFuse.add(arcadeWick);
const arcadeSpark = new THREE.Mesh(
  new THREE.SphereGeometry(0.031, 8, 8),
  new THREE.MeshBasicMaterial({color:0xffeb63})
);
arcadeSpark.position.y = 0.21;
arcadeBombFuse.add(arcadeSpark);
arcadeBombFuse.visible = false;
ballMesh.add(arcadeBombFuse);

function arcadeResetPoint() {
  BALL_R = ARCADE_POWER_BASE_RADIUS;
  ballMesh.scale.setScalar(1);
  playerRacket.scale.setScalar(1);
  oppRacket.scale.setScalar(1);
  arcadePower.active = null;
  arcadePower.remaining = 0;
  arcadePower.bombLeft = 0;
  arcadePower.slipVX = 0;
  arcadePower.slipVZ = 0;
  ballMat.color.setHex(0xffaa00);
  ballMat.emissive.setHex(0x553300);
  arcadeBombFuse.visible = false;
  const fx = document.getElementById('arcade-screen-fx');
  if (fx) fx.className = '';
  const timer = document.getElementById('arcade-bomb-timer');
  if (timer) timer.hidden = true;
}

function arcadeResetMatch() {
  arcadeResetPoint();
  arcadePower.used = false;
  arcadeSetPanel(false);
  arcadeRefreshButton();
}

function arcadeSetPanel(open) {
  arcadePower.panelOpen = !!open;
  const panel = document.getElementById('arcade-power-panel');
  if (panel) panel.hidden = !open;
}

function arcadeRefreshButton() {
  const button = document.getElementById('arcade-power-trigger');
  if (!button) return;
  button.disabled = arcadePower.used;
  button.textContent = arcadePower.used ? '✓ 사용 완료' : '🎲 변칙 기술';
}

function arcadeUsePower(id) {
  if (arcadePower.used || trainingActive || menuOpen || !['serve', 'play'].includes(gameState)) return;
  if (!ARCADE_POWER_OPTIONS.some(option => option.id === id)) return;
  arcadePower.used = true;
  arcadePower.active = id;
  arcadePower.remaining = ['slippery', 'paint', 'pinkFog'].includes(id) ? 2 : 0;
  arcadePower.bombLeft = id === 'bombBall' ? 10 : 0;
  if (id === 'bigBall' || id === 'tinyBall') {
    const ratio = id === 'bigBall' ? 1.8 : 0.55;
    BALL_R = ARCADE_POWER_BASE_RADIUS * ratio;
    ballMesh.scale.setScalar(ratio);
  }
  if (id === 'bigRacket') playerRacket.scale.setScalar(1.5);
  if (id === 'tinyRacket') oppRacket.scale.setScalar(0.55);
  if (id === 'bombBall') {
    ballMat.color.setHex(0x292433);
    ballMat.emissive.setHex(0x9d184d);
    arcadeBombFuse.visible = true;
    document.getElementById('arcade-bomb-timer').hidden = false;
  }
  if (id === 'slippery' || id === 'paint' || id === 'pinkFog') {
    document.getElementById('arcade-screen-fx').className = id;
  }
  if (id === 'paint' || id === 'pinkFog') {
    // Unlike a human, the AI has no rendered viewport. Its reaction/accuracy
    // is reduced separately in updateOpponent while the overlay is active.
    resetOpponentRead();
  }
  arcadeSetPanel(false);
  arcadeRefreshButton();
  const chosen = ARCADE_POWER_OPTIONS.find(option => option.id === id);
  const label = document.getElementById('arcade-power-notice');
  label.textContent = chosen.icon + ' ' + chosen.name + '!';
  label.classList.remove('pop');
  void label.offsetWidth;
  label.classList.add('pop');
}

function arcadeTick(realDt) {
  if (!arcadePower.active || menuOpen || gameState !== 'play') return;
  if (arcadePower.active === 'bombBall') {
    arcadePower.bombLeft = Math.max(0, arcadePower.bombLeft - realDt);
    const timer = document.getElementById('arcade-bomb-timer');
    timer.textContent = '💣 ' + arcadePower.bombLeft.toFixed(1) + '초';
    ballMat.color.setHex(0x292433);
    ballMat.emissive.setHex(Math.floor(performance.now() / 200) % 2 ? 0x9d184d : 0xe94f24);
    if (arcadePower.bombLeft <= 0) {
      // The side occupied by the ball loses the rally. A normal point ends
      // the bomb as well; it never survives to another point.
      const loser = ballPos.z >= 0 ? 'player' : 'opponent';
      scorePoint(loser === 'player' ? 'opponent' : 'player', '폭탄 폭발!');
      return;
    }
  }
  if (arcadePower.remaining > 0) {
    arcadePower.remaining -= realDt;
    if (arcadePower.remaining <= 0) {
      const completed = arcadePower.active;
      arcadeResetPoint();
      if (completed === 'slippery') resetOpponentRead();
    }
  }
}

function arcadeInstallUI() {
  const style = document.createElement('style');
  style.textContent = `
    #arcade-power-trigger{position:absolute;right:10px;bottom:max(14px,env(safe-area-inset-bottom));
      z-index:40;pointer-events:auto;touch-action:manipulation;padding:10px 13px;
      border-radius:18px;background:#b44989e8;border:2px solid #ffe7f4;color:white;
      font:700 12px system-ui;box-shadow:0 4px 12px #33182d66}
    #arcade-power-trigger:disabled{opacity:.52;background:#6f596b}
    #arcade-power-panel{position:absolute;right:8px;bottom:58px;z-index:50;
      width:min(300px,calc(100vw - 16px));max-height:65vh;overflow:auto;pointer-events:auto;
      background:#271e37ef;border:2px solid #f4a4d1;border-radius:18px;color:white;
      padding:9px;box-shadow:0 8px 30px #0009}
    #arcade-power-panel[hidden]{display:none}
    #arcade-power-panel header{display:flex;align-items:center;justify-content:space-between;
      font:700 14px system-ui;margin:1px 5px 9px}
    #arcade-power-panel .power-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px}
    #arcade-power-panel button{pointer-events:auto;touch-action:manipulation;color:#fff;
      border:1px solid #dd9dc5;background:#775574;min-height:57px;border-radius:12px;
      padding:7px 5px;font:700 12px system-ui;text-align:left}
    #arcade-power-panel button small{display:block;font:400 10px system-ui;opacity:.85}
    #arcade-power-panel .close-power{min-height:26px;background:transparent;padding:3px 9px}
    #arcade-power-notice{position:absolute;top:23%;left:50%;transform:translateX(-50%);
      z-index:35;pointer-events:none;opacity:0;white-space:nowrap;color:#ffeff7;
      text-shadow:0 2px 11px #ac0c70,0 0 16px #901565;font:900 clamp(18px,4vw,26px) system-ui}
    #arcade-power-notice.pop{animation:arcadePowerPop 1s ease-out forwards}
    @keyframes arcadePowerPop{0%{opacity:0;transform:translate(-50%,18px) scale(.8)}
      25%{opacity:1;transform:translate(-50%,0) scale(1.07)}70%{opacity:1}
      100%{opacity:0;transform:translate(-50%,-18px)}}
    #arcade-bomb-timer{position:absolute;top:19%;left:50%;transform:translateX(-50%);
      z-index:36;background:#2c1e34db;color:#fff;font:800 17px system-ui;
      padding:5px 14px;border:2px solid #ef4b97;border-radius:17px;pointer-events:none}
    #arcade-bomb-timer[hidden]{display:none}
    #arcade-screen-fx{position:absolute;left:0;top:0;width:100%;height:67%;z-index:3;
      pointer-events:none;overflow:hidden}
    #arcade-screen-fx.paint{background:
      radial-gradient(ellipse 18% 27% at 31% 35%,#fc58b5c9 0 69%,transparent 75%),
      radial-gradient(ellipse 12% 21% at 61% 15%,#fe6f9c9e 0 68%,transparent 74%),
      radial-gradient(ellipse 21% 24% at 75% 66%,#ed2f86a8 0 70%,transparent 76%)}
    #arcade-screen-fx.slippery{background:
      repeating-linear-gradient(107deg,transparent 0 34px,#c3ecff27 37px 47px,transparent 50px 85px);
      opacity:.75}
    #arcade-screen-fx.pinkFog{background:linear-gradient(180deg,#ee84bed6 0%,#f6b8d19e 58%,transparent 100%);
      backdrop-filter:blur(5px);animation:arcadeFogPulse .65s ease-in-out infinite alternate}
    @keyframes arcadeFogPulse{from{opacity:.72}to{opacity:1}}
    @media (orientation:portrait){#arcade-power-trigger{bottom:10px;right:7px;padding:9px 10px}
      #arcade-power-panel{bottom:52px;max-height:49vh}}
    @media(max-height:450px){#arcade-power-panel{max-height:76vh}}
  `;
  document.head.appendChild(style);
  const ui = document.getElementById('ui');
  const trigger = document.createElement('button');
  trigger.id = 'arcade-power-trigger';
  trigger.type = 'button';
  trigger.onclick = event => {
    event.stopPropagation();
    if (!arcadePower.used && !trainingActive && !menuOpen && ['serve', 'play'].includes(gameState)) {
      arcadeSetPanel(!arcadePower.panelOpen);
    }
  };
  ui.appendChild(trigger);
  const panel = document.createElement('section');
  panel.id = 'arcade-power-panel';
  panel.hidden = true;
  const head = document.createElement('header');
  head.textContent = '경기당 한 번만 사용';
  const close = document.createElement('button');
  close.className = 'close-power';
  close.textContent = '✕';
  close.onclick = event => { event.stopPropagation(); arcadeSetPanel(false); };
  head.appendChild(close);
  panel.appendChild(head);
  const grid = document.createElement('div');
  grid.className = 'power-grid';
  for (const option of ARCADE_POWER_OPTIONS) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = option.icon + ' ' + option.name;
    const small = document.createElement('small');
    small.textContent = option.description;
    button.appendChild(small);
    button.onclick = event => { event.stopPropagation(); arcadeUsePower(option.id); };
    grid.appendChild(button);
  }
  panel.appendChild(grid);
  ui.appendChild(panel);
  const notice = document.createElement('div');
  notice.id = 'arcade-power-notice';
  ui.appendChild(notice);
  const fx = document.createElement('div');
  fx.id = 'arcade-screen-fx';
  ui.appendChild(fx);
  const timer = document.createElement('div');
  timer.id = 'arcade-bomb-timer';
  timer.hidden = true;
  ui.appendChild(timer);
  arcadeRefreshButton();
}

arcadeInstallUI();
