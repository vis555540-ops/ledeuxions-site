// logic.js — 충치의 역습: 그림 없이 규칙만. 브라우저와 node(시험용) 양쪽에서 돈다.
(function (root) {
  'use strict';
  const W = 390;

  // 단계별 세기. 숫자는 node 시험(test_sim.js)으로 맞춘 값.
  const STAGES = [
    { id: 1, brushEvery: [2.9, 4.3], warn: 1.35, brushSpeed: 290, clean: 0.55, chaseP: 0.30,
      floss: false, candyEvery: 8, grow: 0.004, spread: 0.011 },
    { id: 2, brushEvery: [2.6, 3.8], warn: 1.0, brushSpeed: 340, clean: 0.6, chaseP: 0.35,
      floss: true, flossEvery: [6.0, 9.0], flossWarn: 1.05, flossClean: 0.7, candyEvery: 8,
      grow: 0.004, spread: 0.011 },
  ];

  // 업그레이드 (Plague Inc. 의 진화). 설탕으로 산다.
  const UPGRADES = [
    { k: 'eat', max: 3, cost: [3, 6, 10] },
    { k: 'spread', max: 3, cost: [4, 7, 11] },
    { k: 'sticky', max: 3, cost: [4, 7, 11] },
    { k: 'speed', max: 3, cost: [3, 5, 8] },
  ];

  const UW = [48, 44, 40, 42, 42, 40, 44, 48];
  const UH = [72, 78, 84, 92, 92, 84, 78, 72];
  const LH = [66, 70, 74, 80, 80, 74, 70, 66];

  function layout(H) {
    const L = { W, H };
    L.hudH = 66;
    L.mT = 72; L.mB = H - 112; L.mL = 8; L.mR = W - 8;
    L.barY = H - 102;
    L.gumTopY = L.mT + 44;   // 윗잇몸 아래 끝
    L.gumBotY = L.mB - 44;   // 아랫잇몸 위 끝
    const teeth = [];
    let x = (W - UW.reduce((a, b) => a + b, 0)) / 2;
    for (let i = 0; i < 8; i++) {
      const w = UW[i], cx = x + w / 2;
      const off = 16 * (1 - Math.pow((cx - W / 2) / 185, 2));
      teeth.push({ row: 0, idx: i, x: x + 1, w: w - 2, y: L.gumTopY - 8 + off, h: UH[i] });
      x += w;
    }
    x = (W - UW.reduce((a, b) => a + b, 0)) / 2;
    for (let i = 0; i < 8; i++) {
      const w = UW[i], cx = x + w / 2;
      const off = 14 * (1 - Math.pow((cx - W / 2) / 185, 2));
      const h = LH[i];
      teeth.push({ row: 1, idx: i, x: x + 1, w: w - 2, y: L.gumBotY + 8 - off - h, h });
      x += w;
    }
    for (const t of teeth) { t.cx = t.x + t.w / 2; t.cy = t.y + t.h / 2; }
    L.teeth = teeth;
    const upBot = Math.max(...teeth.filter(t => t.row === 0).map(t => t.y + t.h));
    const loTop = Math.min(...teeth.filter(t => t.row === 1).map(t => t.y));
    L.bandTop = [L.mT, upBot + 16];
    L.bandBot = [loTop - 16, L.mB];
    L.mid = [upBot + 16, loTop - 16];
    L.pMinX = L.mL + 20; L.pMaxX = L.mR - 20;
    L.pMinY = L.mT + 34; L.pMaxY = L.mB - 34;
    return L;
  }

  function Game(H, stageNo, rnd) {
    this.rnd = rnd || Math.random;
    this.L = layout(H);
    this.cfg = STAGES[stageNo - 1];
    this.stage = stageNo;
    this.teeth = this.L.teeth.map(t => Object.assign({}, t, { inf: 0, done: false, hurt: 0, eaten: 0 }));
    const start = this.teeth[3];
    start.inf = 0.12;
    this.p = { x: start.cx, y: start.cy, r: 17, vx: 0, vy: 0, inv: 0, eating: -1, face: 1 };
    this.hearts = 3; this.maxHearts = 3;
    this.sugar = 0; this.sugarAcc = 0;
    this.up = { eat: 0, spread: 0, sticky: 0, speed: 0 };
    this.hz = []; this.candies = [];
    this.t = 0; this.status = 'play'; this.ev = [];
    this.nextBrush = 2.6; this.nextFloss = 7; this.nextCandy = 5;
    this.pending = { x: 0, y: 0 };
    this.hits = 0;
  }
  const G = Game.prototype;
  G.emit = function (type, o) { this.ev.push(Object.assign({ type }, o || {})); };
  G.range = function (a) { return a[0] + this.rnd() * (a[1] - a[0]); };
  G.doneCount = function () { let n = 0; for (const t of this.teeth) if (t.done) n++; return n; };
  G.eatRate = function () { return 0.17 * Math.pow(1.3, this.up.eat); };
  G.spreadMul = function () { return Math.pow(1.45, this.up.spread); };
  G.cleanMul = function () { return Math.pow(0.7, this.up.sticky); };
  G.speed = function () { return 170 * Math.pow(1.13, this.up.speed); };
  G.upCost = function (k) {
    const u = UPGRADES.find(u => u.k === k); const lv = this.up[k];
    return lv >= u.max ? null : u.cost[lv];
  };
  G.buy = function (k) {
    const c = this.upCost(k);
    if (c == null || this.sugar < c || this.status !== 'play') return false;
    this.sugar -= c; this.up[k]++;
    this.emit('upgrade', { k }); return true;
  };
  G.addSugar = function (n, x, y) { this.sugar += n; this.emit('sugar', { n, x, y }); };

  G.neighbors = function (i) {
    const t = this.teeth[i], out = [];
    const base = t.row * 8;
    if (t.idx > 0) out.push(base + t.idx - 1);
    if (t.idx < 7) out.push(base + t.idx + 1);
    // 어금니는 위아래가 닿는다
    if (t.idx === 0 || t.idx === 7) out.push((1 - t.row) * 8 + t.idx);
    return out;
  };

  G.infect = function (t, amt, byPlayer) {
    if (t.done || amt <= 0) return;
    const before = t.inf;
    t.inf = Math.min(1, t.inf + amt);
    if (byPlayer) {
      this.sugarAcc += t.inf - before;
      while (this.sugarAcc >= 0.34) { this.sugarAcc -= 0.34; this.addSugar(1, t.cx, t.cy); }
    }
    if (t.inf >= 1) {
      t.done = true; t.inf = 1;
      this.addSugar(byPlayer ? 2 : 1, t.cx, t.cy);
      this.emit('conquer', { i: this.teeth.indexOf(t), x: t.cx, y: t.cy, byPlayer: !!byPlayer });
    }
  };

  G.update = function (dt, input) {
    if (this.status !== 'play') return;
    dt = Math.min(dt, 0.05);
    this.t += dt;
    const p = this.p, L = this.L, cfg = this.cfg;

    // --- 움직임: 손가락이 끈 만큼(상대 이동) 따라간다. 최고 속도는 제한.
    if (input) { this.pending.x += input.dx || 0; this.pending.y += input.dy || 0; }
    const pm = Math.hypot(this.pending.x, this.pending.y);
    if (pm > 70) { this.pending.x *= 70 / pm; this.pending.y *= 70 / pm; }
    const maxStep = this.speed() * dt;
    let mx = this.pending.x, my = this.pending.y;
    const m = Math.hypot(mx, my);
    if (m > maxStep) { mx *= maxStep / m; my *= maxStep / m; }
    this.pending.x -= mx; this.pending.y -= my;
    const ox = p.x, oy = p.y;
    p.x = Math.max(L.pMinX, Math.min(L.pMaxX, p.x + mx));
    p.y = Math.max(L.pMinY, Math.min(L.pMaxY, p.y + my));
    p.vx = (p.x - ox) / dt; p.vy = (p.y - oy) / dt;
    if (Math.abs(mx) > 0.3) p.face = mx > 0 ? 1 : -1;
    if (p.inv > 0) p.inv -= dt;

    // --- 먹기
    let best = -1, bd = 1e9;
    for (let i = 0; i < this.teeth.length; i++) {
      const t = this.teeth[i];
      if (t.done) continue;
      if (p.x > t.x - 5 && p.x < t.x + t.w + 5 && p.y > t.y - 6 && p.y < t.y + t.h + 6) {
        const d = Math.abs(p.x - t.cx) + Math.abs(p.y - t.cy) * 0.5;
        if (d < bd) { bd = d; best = i; }
      }
    }
    const wasEating = p.eating;
    p.eating = (p.inv > 1.0) ? -1 : best;
    if (p.eating >= 0) {
      const t = this.teeth[p.eating];
      this.infect(t, this.eatRate() * dt, true);
      t.eaten += dt;
      if (p.eating !== wasEating || Math.floor(t.eaten / 0.28) !== Math.floor((t.eaten - dt) / 0.28))
        this.emit('chomp', { x: t.cx, y: t.cy, row: t.row });
    }

    // --- 번짐 (저절로 자라고, 옆으로 옮는다)
    const sm = this.spreadMul();
    const add = new Array(16).fill(0);
    for (let i = 0; i < 16; i++) {
      const t = this.teeth[i];
      if (t.inf <= 0) continue;
      if (!t.done) add[i] += cfg.grow * sm * dt * (0.4 + t.inf);
      if (t.inf >= 0.5) {
        for (const j of this.neighbors(i)) {
          if (!this.teeth[j].done) add[j] += cfg.spread * sm * dt * t.inf;
        }
      }
    }
    for (let i = 0; i < 16; i++) if (add[i] > 0) {
      const t = this.teeth[i];
      const was = t.inf;
      this.infect(t, add[i], false);
      if (was === 0 && t.inf > 0) this.emit('spread', { i, x: t.cx, y: t.cy });
    }

    // --- 칫솔
    this.nextBrush -= dt;
    if (this.nextBrush <= 0) { this.spawnBrush(); this.nextBrush = this.range(cfg.brushEvery); }
    if (cfg.floss) {
      this.nextFloss -= dt;
      if (this.nextFloss <= 0) { this.spawnFloss(); this.nextFloss = this.range(cfg.flossEvery); }
    }
    for (const h of this.hz) this.updHazard(h, dt);
    this.hz = this.hz.filter(h => !h.gone);

    // --- 사탕
    this.nextCandy -= dt;
    if (this.nextCandy <= 0) {
      this.nextCandy = cfg.candyEvery + this.rnd() * 3;
      if (this.candies.length < 2) this.candies.push({
        kind: (this.hearts < this.maxHearts && this.rnd() < 0.35) ? 'heart' : 'candy',
        x: L.pMinX + 20 + this.rnd() * (L.pMaxX - L.pMinX - 40),
        y: L.mid[0] + 30 + this.rnd() * (L.mid[1] - L.mid[0] - 60), life: 8, age: 0 });
    }
    for (const c of this.candies) {
      c.age += dt; c.life -= dt;
      if (Math.hypot(c.x - p.x, c.y - p.y) < p.r + 14) {
        c.life = -1;
        if (c.kind === 'heart' && this.hearts < this.maxHearts) { this.hearts++; this.emit('heal', { x: c.x, y: c.y }); }
        else { this.addSugar(3, c.x, c.y); this.emit('candy', { x: c.x, y: c.y }); }
      }
    }
    this.candies = this.candies.filter(c => c.life > 0);

    for (const t of this.teeth) if (t.hurt > 0) t.hurt -= dt;

    // --- 끝
    if (this.doneCount() === 16) { this.status = 'win'; this.emit('win'); }
  };

  G.bandOf = function (y) {
    const L = this.L;
    if (y < L.mid[0]) return 'top';
    if (y > L.mid[1]) return 'bot';
    return 'mid';
  };

  G.spawnBrush = function () {
    const L = this.L, p = this.p, cfg = this.cfg;
    let lane;
    const r = this.rnd();
    const pb = this.bandOf(p.y);
    if (r < cfg.chaseP) lane = 'chase';
    else if (r < cfg.chaseP + 0.3) lane = pb === 'mid' ? (this.rnd() < 0.5 ? 'top' : 'bot') : pb;
    else lane = this.rnd() < 0.5 ? 'top' : 'bot';
    let y0, y1;
    if (lane === 'top') { y0 = L.bandTop[0]; y1 = L.bandTop[1]; }
    else if (lane === 'bot') { y0 = L.bandBot[0]; y1 = L.bandBot[1]; }
    else {
      const cy = L.mid[1] - L.mid[0] < 110 ? (L.mid[0] + L.mid[1]) / 2 : Math.max(L.mid[0] + 50, Math.min(L.mid[1] - 50, p.y));
      y0 = cy - 55; y1 = cy + 55;
    }
    const dir = this.rnd() < 0.5 ? 1 : -1;
    this.hz.push({ kind: 'brush', lane, y0, y1, dir, x: dir > 0 ? -90 : W + 90, st: 'warn', tw: cfg.warn, t: 0, cleaned: {}, gone: false });
    this.emit('warn', { kind: 'brush' });
  };

  G.spawnFloss = function () {
    const L = this.L;
    // 이와 이 사이 틈 하나
    let k = 1 + Math.floor(this.rnd() * 6);
    if (this.rnd() < 0.5) {
      // 충치 가까운 틈을 노린다
      k = Math.max(0, Math.min(6, Math.round((this.p.x - this.teeth[0].x) / 44 - 0.5)));
    }
    const a = this.teeth[k], x = a.x + a.w + 1;
    this.hz.push({ kind: 'floss', k, x, st: 'warn', tw: this.cfg.flossWarn, t: 0, yTip: L.mT - 20, cleaned: {}, gone: false });
    this.emit('warn', { kind: 'floss' });
  };

  G.hitPlayer = function (h) {
    const p = this.p;
    if (p.inv > 0 || this.status !== 'play') return;
    this.hearts--; this.hits++;
    p.inv = 1.8;
    // 밀려난다
    if (h.kind === 'brush') {
      const mid = (h.y0 + h.y1) / 2;
      this.pending.x = 0; this.pending.y = (p.y < mid ? -1 : 1) * 60;
    } else { this.pending.x = (p.x < h.x ? -1 : 1) * 60; this.pending.y = 0; }
    this.emit('hit', { x: p.x, y: p.y, kind: h.kind });
    if (this.hearts <= 0) { this.status = 'lose'; this.emit('lose'); }
  };

  G.cleanTooth = function (i, amt) {
    const t = this.teeth[i];
    if (t.done || t.inf <= 0) return;
    t.inf = Math.max(0, t.inf - amt * this.cleanMul());
    t.hurt = 0.5;
    this.emit('clean', { i, x: t.cx, y: t.cy });
  };

  G.updHazard = function (h, dt) {
    const p = this.p, cfg = this.cfg;
    h.t += dt;
    if (h.st === 'warn') {
      if (h.t >= h.tw) { h.st = 'go'; h.t = 0; this.emit(h.kind === 'brush' ? 'swish' : 'floss'); }
      return;
    }
    if (h.kind === 'brush') {
      h.x += h.dir * cfg.brushSpeed * dt;
      for (let i = 0; i < 16; i++) {
        const t = this.teeth[i];
        if (h.cleaned[i]) continue;
        if (t.y + t.h < h.y0 || t.y > h.y1) continue;
        if (Math.abs(t.cx - h.x) < 22) { h.cleaned[i] = 1; this.cleanTooth(i, cfg.clean); }
      }
      if (p.y + p.r * 0.6 > h.y0 && p.y - p.r * 0.6 < h.y1 && Math.abs(p.x - h.x) < 50 + p.r * 0.5) this.hitPlayer(h);
      if ((h.dir > 0 && h.x > W + 120) || (h.dir < 0 && h.x < -120)) h.gone = true;
    } else {
      const L = this.L;
      if (h.st === 'go') {
        h.yTip += 900 * dt;
        for (let i = 0; i < 16; i++) {
          const t = this.teeth[i];
          if (h.cleaned[i] || t.y > h.yTip) continue;
          if (t.idx === h.k || t.idx === h.k + 1) { h.cleaned[i] = 1; this.cleanTooth(i, cfg.flossClean); }
        }
        if (Math.abs(p.x - h.x) < 8 + p.r * 0.7 && p.y - p.r < h.yTip) this.hitPlayer(h);
        if (h.yTip > L.mB + 20) { h.st = 'hold'; h.t = 0; }
      } else if (h.st === 'hold') {
        if (Math.abs(p.x - h.x) < 8 + p.r * 0.7) this.hitPlayer(h);
        if (h.t > 0.35) { h.st = 'up'; h.t = 0; }
      } else if (h.st === 'up') {
        h.yTip -= 1200 * dt;
        if (h.yTip < L.mT - 30) h.gone = true;
      }
    }
  };

  const api = { W, STAGES, UPGRADES, layout, Game };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.ChungLogic = api;
})(typeof window !== 'undefined' ? window : this);
