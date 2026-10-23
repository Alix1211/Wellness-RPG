// GAIA CITY: DETECTIVE — 전투 엔진 (화면과 무관, 규칙만 담당)
// 상태 S 를 직접 바꾸고, 화면 연출용 이벤트를 S.events 에 쌓는다.
(function () {
  const G = window.GAIA, C = G.config;
  let rand = Math.random;
  G.setSeed = function (seed) {
    let a = seed >>> 0;
    rand = function () { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  };
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  let uidc = 1;
  const mk = id => ({ uid: uidc++, id: id });
  const def = c => G.cards[c.id];
  const ev = (S, e) => S.events.push(e);
  const alive = S => S.enemies.filter(e => !e.arrested && !e.fled);

  // ── 전투 시작 ──
  G.newBattle = function (opts) {
    opts = opts || {};
    const S = {
      p: { hp: opts.hp != null ? opts.hp : C.player.maxHp, maxHp: C.player.maxHp, block: 0, str: 0, dopa: 0, tight: 0, lube: 0,
           orgCd: false, orgActive: false, energy: 0, overclock: false, ocMade: 0, firstUsed: false },
      drawPile: [], hand: [], discard: [], exhaust: [], enemies: [], turn: 0, phase: 'player', events: [], result: null
    };
    // 유물(착용품) 효과 합산 — 전투 시작 보정·매 턴 보정
    const rel = {}; (opts.relics || []).forEach(id => { const d = G.items && G.items.byId[id]; if (d && d.type === 'relic') Object.keys(d.fx).forEach(k => { rel[k] = (rel[k] || 0) + d.fx[k]; }); });
    S.rel = rel; S.p.str = (rel.strPlus || 0) + Math.floor((opts.grit || 0) / 3); S.p.dopa = Math.min(C.dopamine.max, rel.startDopa || 0); S.p.tight = Math.min(C.tight.max, rel.startTight || 0); S.p.lube = Math.min(C.lube.max, rel.startLube || 0);
    (opts.deck || C.starterDeck).forEach(id => S.drawPile.push(mk(id)));
    shuffle(S.drawPile);
    (opts.enemies || ['barbari']).forEach(id => {
      const d = G.enemies[id];
      const wl = opts.wl || 0, hp0 = Math.round(d.hp * (1 + C.world.hpPerLevel * wl));
      const e = { id: id, def: d, name: d.name, kind: d.kind, wl: wl, hp: hp0, maxHp: hp0, str: 0, weak: 0, vuln: 0, bound: 0, disgust: 0, immune: 0, idx: 0, intent: [], fled: false, arrested: false };
      S.enemies.push(e);
      setIntent(e);
    });
    startPlayerTurn(S);
    if (rel.startBlock) S.p.block += rel.startBlock;
    return S;
  };

  function setIntent(e) {
    const fr = C.fleeRatio[e.kind];
    if (e.hp / e.maxHp <= fr) { e.intent = [{ t: 'flee' }]; return; }
    const cyc = e.def.cycle;
    e.intent = cyc[e.idx % cyc.length].map(a => { const o = Object.assign({}, a); if (o.t === 'atk' && e.wl) o.n = Math.round(o.n * (1 + C.world.atkPerLevel * e.wl)); return o; });
    e.idx++;
  }

  function drawCards(S, n) {
    for (let i = 0; i < n; i++) {
      if (S.hand.length >= C.player.handLimit) break;
      if (!S.drawPile.length) {
        if (!S.discard.length) break;
        S.drawPile = shuffle(S.discard); S.discard = [];
        ev(S, { type: 'shuffle' });
      }
      S.hand.push(S.drawPile.pop());
    }
  }

  function startPlayerTurn(S) {
    const p = S.p;
    S.turn++; S.phase = 'player';
    if (!p.keepBlock) p.block = 0;
    p.orgActive = false;
    if (p.orgCd) { p.orgCd = false; }                           // 절정 직후 한 턴은 재발동 불가
    else if (p.dopa >= C.dopamine.max) { p.orgActive = true; p.orgCd = true; ev(S, { type: 'orgasm' }); }
    p.energy = C.player.energy + (p.orgActive ? C.orgasm.energyBonus : 0) + (S.rel.energyPlus || 0);
    p.ocMade = 0; p.firstUsed = false;
    drawCards(S, C.player.draw + (p.lube >= C.lube.drawThreshold ? 1 : 0) + (S.rel.drawPlus || 0));
    ev(S, { type: 'turn', turn: S.turn });
  }

  // ── 소모품 사용 (전투 중, 내 턴에만) ──
  G.useItem = function (S, id) {
    const d = G.items.byId[id]; if (!d || d.type !== 'cons' || S.phase !== 'player' || S.result) return false;
    const p = S.p, f = d.fx;
    if (f.heal) p.hp = Math.min(p.maxHp, p.hp + f.heal);
    if (f.block) p.block += f.block;
    if (f.dopa) p.dopa = Math.min(C.dopamine.max, p.dopa + f.dopa);
    if (f.tight) p.tight = Math.min(C.tight.max, p.tight + f.tight);
    if (f.lube) p.lube = Math.min(C.lube.max, p.lube + f.lube);
    if (f.energy) p.energy += f.energy;
    if (f.draw) drawCards(S, f.draw);
    if (f.vulnAll) alive(S).forEach(e => { e.vuln += f.vulnAll; });
    return true;
  };

  // ── 카드 사용 가능 여부·비용 ──
  G.cost = function (S, card) {
    const d = def(card);
    let c = d.cost;
    if (S.p.lube >= C.lube.discountThreshold && !S.p.firstUsed) c = Math.max(0, c - 1);
    return c;
  };
  G.canPlay = function (S, uid) {
    if (S.phase !== 'player') return { ok: false, reason: '지금은 낼 수 없습니다' };
    const card = S.hand.find(c => c.uid === uid); if (!card) return { ok: false, reason: '손패에 없음' };
    const d = def(card);
    if (G.cost(S, card) > S.p.energy) return { ok: false, reason: '에너지 부족' };
    if (d.lubeCost && S.p.lube < d.lubeCost) return { ok: false, reason: '윤활도 부족' };
    if (d.needsTarget && !alive(S).length) return { ok: false, reason: '대상 없음' };
    return { ok: true };
  };

  // ── 피해 계산 ──
  function calcDamage(S, op, tgt) {
    const p = S.p;
    let base = op.n;
    if (op.addTightHalf) base += Math.floor(p.tight * C.tight.reflectRatio);
    if (op.orgBonus && p.orgActive) base += op.orgBonus;
    if (op.ratioMult && tgt.hp / tgt.maxHp <= op.ratioMult.ratio) base *= op.ratioMult.mult;
    let d = base + p.str;
    if (tgt.vuln > 0) d = Math.floor(d * C.vulnMult);
    if (p.orgActive) d *= C.orgasm.damageMult;
    return Math.max(0, Math.floor(d));
  }
  G.previewDamage = function (S, card, tgt) {
    const op = def(card).ops.find(o => o.op === 'dmg'); if (!op || !tgt) return null;
    return calcDamage(S, op, tgt);
  };

  function hurtEnemy(S, e, amt, kind) {
    if (e.arrested || e.fled || amt <= 0) return;
    e.hp -= amt;
    ev(S, { type: 'edmg', idx: S.enemies.indexOf(e), amount: amt, kind: kind || 'hit' });
    if (e.hp <= 0) { e.hp = 0; e.arrested = true; ev(S, { type: 'arrest', idx: S.enemies.indexOf(e) }); }
  }

  function targetsOf(S, op, tIdx) {
    if (op.all) return alive(S);
    const t = S.enemies[tIdx];
    return t && !t.arrested && !t.fled ? [t] : [];
  }

  // ── 카드 사용 ──
  G.playCard = function (S, uid, tIdx) {
    const chk = G.canPlay(S, uid); if (!chk.ok) return chk;
    const i = S.hand.findIndex(c => c.uid === uid), card = S.hand[i], d = def(card), p = S.p;
    if (d.needsTarget) {
      const live = alive(S);
      if (tIdx == null || !S.enemies[tIdx] || S.enemies[tIdx].arrested || S.enemies[tIdx].fled) tIdx = S.enemies.indexOf(live[0]);
    }
    p.energy -= G.cost(S, card);
    if (d.lubeCost) p.lube -= d.lubeCost;
    p.firstUsed = true;
    S.hand.splice(i, 1);
    ev(S, { type: 'play', card: d.id, line: d.line, ctype: d.type });
    d.ops.forEach(op => runOp(S, op, tIdx, d));
    if (d.type === '파워') S.exhaust.push(card);
    else if (d.exhaust) S.exhaust.push(card);
    else S.discard.push(card);
    checkEnd(S);
    return { ok: true };
  };

  function runOp(S, op, tIdx, d) {
    const p = S.p;
    switch (op.op) {
      case 'dmg': {
        // 조임력 소모형이 생길 때를 대비해 대상 목록 기준으로 계산
        targetsOf(S, op, tIdx).forEach(t => {
          const hits = op.hits || 1;
          for (let h = 0; h < hits; h++) hurtEnemy(S, t, calcDamage(S, op, t), 'hit');
        });
        break;
      }
      case 'block': p.block += op.n; ev(S, { type: 'block', amount: op.n }); break;
      case 'draw': drawCards(S, op.n); break;
      case 'dopa': p.dopa = clamp(p.dopa + op.n, 0, C.dopamine.max); ev(S, { type: 'stat', stat: 'dopa', amount: op.n }); break;
      case 'tight': p.tight = clamp(p.tight + op.n, 0, C.tight.max); ev(S, { type: 'stat', stat: 'tight', amount: op.n }); break;
      case 'lube': p.lube = clamp(p.lube + op.n, 0, C.lube.max); ev(S, { type: 'stat', stat: 'lube', amount: op.n }); break;
      case 'hpLoss': p.hp -= op.n; ev(S, { type: 'pdmg', amount: op.n, self: true }); break;
      case 'heal': p.hp = Math.min(p.maxHp, p.hp + op.n); ev(S, { type: 'heal', amount: op.n }); break;
      case 'weak': targetsOf(S, op, tIdx).forEach(t => { t.weak += op.n; ev(S, { type: 'status', idx: S.enemies.indexOf(t), what: '약화' }); }); break;
      case 'vuln': targetsOf(S, op, tIdx).forEach(t => { t.vuln += op.n; ev(S, { type: 'status', idx: S.enemies.indexOf(t), what: '취약' }); }); break;
      case 'bind': targetsOf(S, op, tIdx).forEach(t => { t.bound = 1; ev(S, { type: 'status', idx: S.enemies.indexOf(t), what: '봉쇄' }); }); break;
      case 'disgust': targetsOf(S, op, tIdx).forEach(t => {
        const idx = S.enemies.indexOf(t);
        if (t.immune > 0) ev(S, { type: 'status', idx: idx, what: '질림 면역' });
        else { t.disgust = 1; ev(S, { type: 'status', idx: idx, what: '질림' }); }
      }); break;
      case 'enemyStrDown': targetsOf(S, op, tIdx).forEach(t => { t.str = Math.max(C.tight.enemyStrFloor, t.str - op.n); ev(S, { type: 'status', idx: S.enemies.indexOf(t), what: '힘 -' + op.n }); }); break;
      case 'overclock': p.overclock = true; break;
    }
  }

  // ── 턴 종료 → 적 턴 ──
  G.endTurn = function (S) {
    if (S.phase !== 'player') return;
    const p = S.p;
    const keep = [], toss = [];
    S.hand.forEach(c => (def(c).retain ? keep : toss).push(c));
    S.discard = S.discard.concat(toss); S.hand = keep;
    p.lube = Math.max(0, p.lube - C.lube.decayPerTurn);
    if (p.orgActive) { p.dopa = 0; p.orgActive = false; ev(S, { type: 'orgasmEnd' }); }
    S.phase = 'enemy';
    ev(S, { type: 'enemyPhase' });
    for (const e of S.enemies) {
      if (e.arrested || e.fled) continue;
      enemyAct(S, e);
      if (S.p.hp <= 0) break;
      // 상태 감소
      if (e.weak > 0) e.weak--;
      if (e.vuln > 0) e.vuln--;
      e.bound = 0;
      if (e.immune > 0) e.immune--;
      if (!e.arrested && !e.fled) setIntent(e);
    }
    if (checkEnd(S)) return;
    startPlayerTurn(S);
  };

  function enemyAct(S, e) {
    const idx = S.enemies.indexOf(e);
    let acts = e.intent.slice();
    if (e.disgust > 0) {                                        // 질림: 공격 인텐트 취소
      const isAtk = a => a.t === 'atk';
      if (acts.some(isAtk)) {
        if (e.kind === 'boss') { const k = acts.findIndex(isAtk); acts.splice(k, 1); }
        else acts = acts.filter(a => !isAtk(a));
        ev(S, { type: 'disgust', idx: idx });
        if (e.kind === 'elite') e.immune = C.disgustEliteImmuneTurns + 1;
      }
      e.disgust = 0;
    }
    for (const a of acts) {
      if (e.arrested || S.p.hp <= 0) break;
      if (a.t === 'buff') { e.str += a.str; ev(S, { type: 'status', idx: idx, what: '힘 +' + a.str }); }
      else if (a.t === 'flee') {
        if (e.bound > 0) ev(S, { type: 'fleeFail', idx: idx });  // 봉쇄: 도주 차단
        else { e.fled = true; ev(S, { type: 'flee', idx: idx }); }
      } else if (a.t === 'atk') {
        for (let h = 0; h < (a.hits || 1); h++) {
          if (e.arrested || S.p.hp <= 0) break;
          enemyHit(S, e, a.n);
        }
      }
    }
  }

  function enemyHit(S, e, n) {
    const p = S.p, idx = S.enemies.indexOf(e);
    let raw = n + e.str;
    if (e.weak > 0) raw = Math.floor(raw * C.weakMult);
    raw = Math.max(0, raw);
    const blocked = Math.min(p.block, raw);
    p.block -= blocked;
    const loss = raw - blocked;
    p.hp -= loss;
    ev(S, { type: 'pdmg', idx: idx, amount: loss, blocked: blocked, raw: raw });
    p.dopa = clamp(p.dopa + Math.floor(raw * C.dopamine.hitRatio), 0, C.dopamine.max);
    // 조임력: 반사 + 적의 힘 감소 (타격 시점의 조임력 기준)
    const refl = Math.floor(p.tight * C.tight.reflectRatio);
    if (refl > 0) hurtEnemy(S, e, refl, 'reflect');
    if (p.tight >= C.tight.strDownMinTight) e.str = Math.max(C.tight.enemyStrFloor, e.str - C.tight.enemyStrDown);
    p.tight = clamp(p.tight + C.tight.perHit, 0, C.tight.max);
    if (p.overclock && p.ocMade < 2 && S.hand.length < C.player.handLimit) {
      S.hand.push(mk('T01')); p.ocMade++; ev(S, { type: 'token' });
    }
  }

  // ── 종료 판정 ──
  function checkEnd(S) {
    if (S.phase === 'won' || S.phase === 'lost') return true;
    if (S.p.hp <= 0) { S.p.hp = 0; S.phase = 'lost'; S.result = { win: false, reason: '체력이 바닥났습니다' }; ev(S, { type: 'end' }); return true; }
    const bossFled = S.enemies.some(e => e.kind === 'boss' && e.fled);
    if (bossFled && C.bossFledIsDefeat) { S.phase = 'lost'; S.result = { win: false, reason: '보스를 놓쳤습니다' }; ev(S, { type: 'end' }); return true; }
    if (!alive(S).length) {
      const fled = S.enemies.some(e => e.fled);
      S.phase = 'won'; S.result = { win: true, reward: !fled, fled: fled }; ev(S, { type: 'end' }); return true;
    }
    return false;
  }

  // 인텐트 요약 (화면 표시용)
  G.intentInfo = function (S, e) {
    const out = [];
    e.intent.forEach(a => {
      if (a.t === 'atk') {
        let raw = a.n + e.str; if (e.weak > 0) raw = Math.floor(raw * C.weakMult); raw = Math.max(0, raw);
        out.push({ kind: 'atk', n: raw, hits: a.hits || 1 });
      } else if (a.t === 'buff') out.push({ kind: 'buff', n: a.str });
      else out.push({ kind: 'flee' });
    });
    return out;
  };
})();
