/* Single-game stress prototype. Mechanics and physics parameters follow
 * Wellness/minigames.js mgMerge; the six food textures are generated locally. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const viewport = $('viewport');
  const canvas = $('game');
  const ctx = canvas.getContext('2d', { alpha: true });
  const video = $('backgroundVideo');
  const W = 640, H = 510, LEFT = 43, RIGHT = W - 43, FLOOR = H - 16, CEILING = 100;
  const lengths = [72, 94, 120, 151, 187, 228];
  const heights = [30, 35, 41, 48, 57, 67];
  const palette = [
    ['#ffbf76', '#bc604a'], ['#f6d483', '#b97742'], ['#f4a6a7', '#b04b68'],
    ['#9dd9a2', '#488c67'], ['#9ac9e9', '#4775a6'], ['#cfaae6', '#85539f']
  ];
  const sprites = palette.map(([light, dark], level) => {
    const c = document.createElement('canvas');
    c.width = 512; c.height = 160;
    const g = c.getContext('2d');
    const grad = g.createLinearGradient(0, 22, 0, 138);
    grad.addColorStop(0, '#fff6d6'); grad.addColorStop(.25, light);
    grad.addColorStop(1, dark);
    g.fillStyle = grad; g.strokeStyle = '#563d3e'; g.lineWidth = 8;
    g.beginPath(); g.roundRect(14, 27, 484, 106, 53); g.fill(); g.stroke();
    g.fillStyle = '#fff8dcaa';
    g.beginPath(); g.roundRect(40, 40, 430, 22, 11); g.fill();
    g.fillStyle = '#593a3eaa'; g.font = 'bold 46px system-ui'; g.textAlign = 'center';
    g.fillText(String(level + 1), 256, 109);
    return c;
  });

  let engine, bodies, mergeQueue, queued, collisionHandler;
  let time, score, next, aim, cool, elapsed, accumulator, overflow, pops, auto, ended, raf, lastFrame;
  let videoUrl = null;
  let frames = 0, dropped = 0, sampleStart = 0, measured = [], nominalMs = 1000 / 60;
  let drawWidth = 0, drawHeight = 0, scale = 1, offsetX = 0, offsetY = 0;
  const { Engine, World, Bodies, Body, Events } = Matter;

  function makeBody(level, x, y, angle = Math.PI / 2) {
    const length = lengths[level], height = heights[level];
    const r = height / 2, half = (length - height) / 2;
    const opts = { friction: .45, restitution: .3, frictionAir: .008, density: .002 };
    const parts = [
      Bodies.rectangle(x, y, Math.max(3, 2 * half), height, opts),
      Bodies.circle(x - half, y, r, opts),
      Bodies.circle(x + half, y, r, opts)
    ];
    const b = Body.create({ ...opts, parts });
    Body.setAngle(b, angle);
    b.food = { level, born: elapsed, pop: 0 };
    bodies.push(b);
    World.add(engine.world, b);
    return b;
  }

  function onCollision(event) {
    for (const pair of event.pairs) {
      const a = pair.bodyA.parent, b = pair.bodyB.parent;
      if (a === b || !a.food || !b.food ||
          a.food.level !== b.food.level || a.food.level >= 5 ||
          queued.has(a.id) || queued.has(b.id) ||
          elapsed - a.food.born < .18 || elapsed - b.food.born < .18) continue;
      queued.add(a.id); queued.add(b.id); mergeQueue.push([a, b]);
    }
  }

  function teardown() {
    if (raf) cancelAnimationFrame(raf);
    if (engine) {
      Events.off(engine, 'collisionStart', collisionHandler);
      Events.off(engine, 'collisionActive', collisionHandler);
      World.clear(engine.world, false);
      Engine.clear(engine);
    }
    engine = null;
  }

  function reset() {
    teardown();
    engine = Engine.create({ positionIterations: 8, velocityIterations: 8 });
    engine.gravity.y = 1.25;
    World.add(engine.world, [
      Bodies.rectangle(LEFT - 15, H / 2, 30, H * 2, { isStatic: true, friction: .4 }),
      Bodies.rectangle(RIGHT + 15, H / 2, 30, H * 2, { isStatic: true, friction: .4 }),
      Bodies.rectangle(W / 2, FLOOR + 15, W, 30, { isStatic: true, friction: .5 })
    ]);
    bodies = []; mergeQueue = []; queued = new Set();
    collisionHandler = onCollision;
    Events.on(engine, 'collisionStart', collisionHandler);
    Events.on(engine, 'collisionActive', collisionHandler);
    time = 60; score = 0; next = 0; aim = W / 2; cool = 0;
    elapsed = 0; accumulator = 0; overflow = 0; pops = [];
    auto = false; ended = false; lastFrame = 0;
    frames = 0; dropped = 0; sampleStart = 0; measured = []; nominalMs = 1000 / 60;
    $('fps').textContent = '—'; $('drops').textContent = '0';
    $('result').hidden = true;
    $('autoButton').textContent = '자동 투하 끔';
    $('autoButton').setAttribute('aria-pressed', 'false');
    refreshHud(); drawNext(); resize();
    raf = requestAnimationFrame(frame);
  }

  function drop() {
    if (ended || cool > 0 || !engine) return;
    makeBody(next, aim, 55);
    next = Math.floor(Math.random() * 3);
    cool = .4;
    drawNext();
  }

  function merge() {
    for (const [a, b] of mergeQueue) {
      const level = a.food.level + 1;
      const x = (a.position.x + b.position.x) / 2;
      const y = (a.position.y + b.position.y) / 2;
      const angle = (a.angle + b.angle) / 2;
      World.remove(engine.world, a); World.remove(engine.world, b);
      bodies = bodies.filter(v => v !== a && v !== b);
      const n = makeBody(level, x, y, angle);
      Body.setVelocity(n, { x: (a.velocity.x + b.velocity.x) * .2, y: -1.7 });
      Body.setAngularVelocity(n, (a.angularVelocity + b.angularVelocity) * .3);
      n.food.pop = .25;
      score += 20 * level;
      pops.push({ x, y, life: .65, level });
    }
    mergeQueue = [];
    queued.clear();
  }

  function finish(reason) {
    ended = true;
    auto = false;
    $('autoButton').setAttribute('aria-pressed', 'false');
    $('autoButton').textContent = '자동 투하 끔';
    $('resultTitle').textContent = reason;
    $('resultText').textContent = score + '점 · 최고 ' +
      (1 + Math.max(0, ...bodies.map(b => b.food.level))) +
      '단계 · 누락 ' + dropped + '프레임';
    $('result').hidden = false;
  }

  function step(dt) {
    if (ended) return;
    time -= dt; elapsed += dt; cool = Math.max(0, cool - dt);
    if (auto && cool === 0) drop();
    accumulator += dt;
    let steps = 0;
    while (accumulator >= 1 / 120 && steps < 5) {
      Engine.update(engine, 1000 / 120);
      accumulator -= 1 / 120;
      steps++;
    }
    // Prevent an unbounded catch-up loop after tab suspension.
    if (steps === 5) accumulator = 0;
    merge();
    const danger = bodies.some(b => elapsed - b.food.born > 1.8 && b.bounds.min.y < CEILING);
    overflow = danger ? overflow + dt : Math.max(0, overflow - dt * 2);
    pops = pops.filter(p => (p.life -= dt) > 0);
    for (const b of bodies) b.food.pop = Math.max(0, b.food.pop - dt);
    if (time <= 0 || overflow >= 2) finish(overflow >= 2 ? '팬이 가득 찼습니다' : '시간 종료');
    refreshHud();
  }

  function refreshHud() {
    $('time').textContent = Math.max(0, Math.ceil(time));
    $('score').textContent = score;
    $('bodies').textContent = bodies.length;
    $('level').textContent = 1 + Math.max(0, ...bodies.map(b => b.food.level));
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const width = Math.max(1, Math.round(rect.width * dpr));
    const height = Math.max(1, Math.round(rect.height * dpr));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width; canvas.height = height;
    }
    drawWidth = width; drawHeight = height;
    scale = Math.min(width / W, height / H);
    offsetX = (width - W * scale) / 2;
    offsetY = (height - H * scale) / 2;
  }

  function drawFood(g, sprite, x, y, w, h, angle = 0) {
    g.save(); g.translate(x, y); g.rotate(angle);
    g.drawImage(sprite, -w / 2, -h / 2, w, h); g.restore();
  }

  function draw() {
    if (!drawWidth || !drawHeight) return;
    ctx.clearRect(0, 0, drawWidth, drawHeight);
    ctx.save(); ctx.translate(offsetX, offsetY); ctx.scale(scale, scale);
    // The backdrop is a separate translucent DOM layer; game art stays full opacity.
    ctx.fillStyle = '#132f3888'; ctx.beginPath();
    ctx.roundRect(LEFT - 9, CEILING + 8, RIGHT - LEFT + 18, FLOOR - CEILING + 12, 26); ctx.fill();
    ctx.strokeStyle = '#f1caa9'; ctx.lineWidth = 10;
    for (const x of [LEFT - 11, RIGHT + 11]) {
      ctx.beginPath(); ctx.roundRect(x - 13, (CEILING + FLOOR) / 2 - 48, 26, 96, 10); ctx.stroke();
    }
    ctx.strokeStyle = '#ffe3c6'; ctx.lineWidth = 12; ctx.beginPath();
    ctx.moveTo(LEFT, CEILING); ctx.lineTo(LEFT, FLOOR);
    ctx.lineTo(RIGHT, FLOOR); ctx.lineTo(RIGHT, CEILING); ctx.stroke();
    ctx.setLineDash([9, 8]); ctx.lineWidth = 2;
    ctx.strokeStyle = overflow > 0 ? '#ff6c83' : '#f8dfb5';
    ctx.beginPath(); ctx.moveTo(LEFT, CEILING); ctx.lineTo(RIGHT, CEILING); ctx.stroke();
    ctx.setLineDash([]);
    ctx.strokeStyle = '#f5e9ce'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(aim, 12); ctx.lineTo(aim, FLOOR); ctx.stroke();
    ctx.globalAlpha = cool > 0 ? .5 : 1;
    drawFood(ctx, sprites[next], aim, 53, lengths[next], heights[next], Math.PI / 2);
    ctx.globalAlpha = 1;
    for (const b of bodies) {
      const f = b.food, pulse = 1 + Math.sin(f.pop / .25 * Math.PI) * .18;
      drawFood(ctx, sprites[f.level], b.position.x, b.position.y,
        lengths[f.level] * pulse, heights[f.level] * pulse, b.angle);
    }
    ctx.textAlign = 'center'; ctx.fillStyle = '#fff0b5'; ctx.font = 'bold 25px system-ui';
    for (const p of pops) ctx.fillText('+' + 20 * p.level, p.x, p.y - 25 - (.65 - p.life) * 30);
    if (overflow > 0) {
      ctx.fillStyle = '#ff9e9e'; ctx.font = 'bold 18px system-ui';
      ctx.fillText('넘치기 직전! ' + (2 - overflow).toFixed(1) + '초', W / 2, CEILING + 29);
    }
    ctx.restore();
  }

  function drawNext() {
    const c = $('next'), g = c.getContext('2d');
    g.clearRect(0, 0, c.width, c.height);
    drawFood(g, sprites[next], 65, 24, 116, 34);
    $('nextLevel').textContent = (next + 1) + '단계';
  }

  function samplePerformance(now, delta) {
    if (!sampleStart) sampleStart = now;
    frames++;
    if (delta > 4 && delta < 30 && measured.length < 120) {
      measured.push(delta);
      if (measured.length === 120) {
        const sorted = [...measured].sort((a, b) => a - b);
        nominalMs = Math.max(1000 / 144, Math.min(1000 / 50, sorted[12]));
      }
    }
    if (delta > nominalMs * 1.5) dropped += Math.max(1, Math.round(delta / nominalMs) - 1);
    if (now - sampleStart >= 1000) {
      $('fps').textContent = Math.round(frames * 1000 / (now - sampleStart));
      $('drops').textContent = dropped;
      frames = 0; sampleStart = now;
      if (viewport.classList.contains('has-video') && video.getVideoPlaybackQuality) {
        $('videoDrops').textContent = video.getVideoPlaybackQuality().droppedVideoFrames;
      } else $('videoDrops').textContent = '—';
    }
  }

  function frame(now) {
    raf = requestAnimationFrame(frame);
    if (document.hidden) { lastFrame = 0; return; }
    const delta = lastFrame ? now - lastFrame : 0;
    lastFrame = now;
    if (delta > 0) samplePerformance(now, delta);
    step(Math.min(.04, delta / 1000));
    draw();
  }

  function setAim(e) {
    const r = canvas.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const dpr = drawWidth / r.width;
    const x = (e.clientX - r.left) * dpr;
    aim = Math.max(LEFT + 35, Math.min(RIGHT - 35, (x - offsetX) / scale));
  }
  canvas.addEventListener('pointermove', setAim);
  canvas.addEventListener('pointerdown', e => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    e.preventDefault(); setAim(e); drop();
  });
  $('dropButton').addEventListener('click', drop);
  $('autoButton').addEventListener('click', () => {
    auto = !auto;
    $('autoButton').textContent = '자동 투하 ' + (auto ? '켬' : '끔');
    $('autoButton').setAttribute('aria-pressed', String(auto));
  });
  $('resetButton').addEventListener('click', reset);
  $('resultRestart').addEventListener('click', reset);
  window.addEventListener('keydown', e => {
    if (e.code === 'Space' && e.target.tagName !== 'BUTTON' && e.target.tagName !== 'INPUT') {
      e.preventDefault(); drop();
    }
  });
  window.addEventListener('resize', resize);
  new ResizeObserver(resize).observe(canvas.parentElement);

  function clearVideo() {
    video.pause(); video.removeAttribute('src'); video.load();
    viewport.classList.remove('has-video');
    $('videoDrops').textContent = '—';
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    videoUrl = null;
    $('videoFile').value = '';
    $('videoStatus').textContent = '기본 배경 · 영상 파일은 기기에만 남습니다.';
  }
  $('clearVideo').addEventListener('click', clearVideo);
  $('videoFile').addEventListener('change', async e => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.type && file.type !== 'video/mp4' || !/\.mp4$/i.test(file.name)) {
      clearVideo(); $('videoStatus').textContent = 'MP4 파일을 선택해 주세요.'; return;
    }
    clearVideo();
    videoUrl = URL.createObjectURL(file);
    video.src = videoUrl;
    video.muted = true; video.loop = true; video.playsInline = true;
    $('videoStatus').textContent = '영상을 불러오는 중…';
    try {
      await video.play();
      viewport.classList.add('has-video');
      $('videoStatus').textContent = file.name + ' · 기기에서만 재생 중';
    } catch {
      $('videoStatus').textContent = '재생 대기 중 · 화면을 눌러 다시 시도하세요.';
    }
  });
  video.addEventListener('error', () => {
    if (videoUrl) { clearVideo(); $('videoStatus').textContent = '이 MP4는 재생할 수 없습니다.'; }
  });
  viewport.addEventListener('pointerdown', () => {
    if (videoUrl && video.paused) video.play().then(() => {
      viewport.classList.add('has-video');
      $('videoStatus').textContent = '선택한 MP4 · 기기에서만 재생 중';
    }).catch(() => {});
  });
  window.addEventListener('pagehide', () => { teardown(); clearVideo(); });
  $('opacity').addEventListener('input', e => {
    const value = Number(e.target.value);
    viewport.style.setProperty('--backdrop-alpha', String(value / 100));
    $('opacityValue').textContent = value + '%';
  });
  viewport.style.setProperty('--backdrop-alpha', '.55');
  reset();
})();

