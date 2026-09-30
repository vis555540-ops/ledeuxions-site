// logic.js — 충치의 역습 v2: 그림 없이 규칙만. 브라우저와 node(시험용) 양쪽에서 돈다.
// v2: 위에서 비스듬히 본 입 속(윗니·아랫니 두 줄), 그림자에 숨기, 위아래 뒤집기, 테크(3가지)·통증 지수.
(function (root) {
  'use strict';
  const W = 390;
  const NT = 10;          // 한 턱에 이 10개 (젖니)
  const SQ = 0.8;         // 비스듬히 봐서 위아래가 눌려 보이는 정도

  // 단계별 세기. 9/30 형 「치솔 너무 쎄 1탄부터」 → 칫솔 느리게·늦게·덜 쫓게 낮춤.
  const STAGES = [
    { id: 1, brushEvery: [4.0, 5.4], warn: 1.9, brushSpeed: 210, clean: 0.5, sight: 95, steer: 115, offMax: 60,
      chaseP: 0.45, scrubP: 0.35, doubleP: 0, floss: false, candyEvery: 8, grow: 0.004, spread: 0.012,
      sway: 0.5, swaySpd: 0.32, painEat: 1.5, painDecay: 0.8 },
    { id: 2, brushEvery: [3.4, 4.7], warn: 1.6, brushSpeed: 270, clean: 0.5, sight: 115, steer: 150, offMax: 70,
      chaseP: 0.6, scrubP: 0.5, doubleP: 0.15, floss: true, flossEvery: [6.5, 9.0], flossWarn: 1.1, flossClean: 0.7,
      candyEvery: 8, grow: 0.004, spread: 0.012, sway: 0.7, swaySpd: 0.5, painEat: 1.7, painDecay: 0.8 },
  ];

  // 테크 (Plague Inc 의 진화 나무). 세 가지: 번짐 / 숨기 / 진정.
  // pain: 사면 통증이 이만큼 오른다(음수면 내려간다).
  const TECH = [
    { k: 'eat1', br: 0, tier: 0, cost: 3, pain: 8 },
    { k: 'spread1', br: 0, tier: 1, cost: 5, pain: 10 },
    { k: 'eat2', br: 0, tier: 2, cost: 8, pain: 12 },
    { k: 'spread2', br: 0, tier: 3, cost: 11, pain: 15 },
    { k: 'shade1', br: 1, tier: 0, cost: 3, pain: 6 },
    { k: 'blur', br: 1, tier: 1, cost: 5, pain: 8 },
    { k: 'sticky', br: 1, tier: 2, cost: 7, pain: 10 },
    { k: 'ghost', br: 1, tier: 3, cost: 10, pain: 12 },
    { k: 'quiet', br: 2, tier: 0, cost: 3, pain: -8 },
    { k: 'speed', br: 2, tier: 1, cost: 4, pain: 0 },
    { k: 'numb', br: 2, tier: 2, cost: 6, pain: -35 },
    { k: 'calm', br: 2, tier: 3, cost: 8, pain: -12 },
  ];

  // 이 모양: 왼쪽 끝 어금니 → 가운데 앞니 → 오른쪽 끝 어금니
  const BW = [48, 44, 34, 30, 32, 32, 30, 34, 44, 48];
  const BD = [52, 48, 36, 28, 26, 26, 28, 36, 48, 52];

  function layout(H) {
    const L = { W, H, SQ };
    L.hudH = 66;
    L.mT = 76; L.mB = H - 118; L.mL = 8; L.mR = W - 8;
    L.barY = H - 104;
    const midY = L.midY = Math.round((L.mT + L.mB) / 2);
    // 아랫니 치열궁 (U). 윗니는 가운데 줄을 기준으로 거울.
    const cx = W / 2, rx = 132, yB = midY + 30, yF = L.mB - 46;
    L.arch = { cx, rx, yB, yF };
    const N = 1600, raw = [];
    let len = 0, px = 0, py = 0;
    for (let k = 0; k <= N; k++) {
      const a = -Math.PI / 2 + Math.PI * k / N;
      const x = cx + rx * Math.sin(a), y = yB + (yF - yB) * Math.cos(a);
      if (k) len += Math.hypot(x - px, y - py);
      raw.push({ x, y, s: len }); px = x; py = y;
    }
    // 4px 간격으로 다시 뽑기
    const DS = 4, pts = [];
    let j = 0;
    for (let s = 0; s <= len; s += DS) {
      while (j < raw.length - 2 && raw[j + 1].s < s) j++;
      const a = raw[j], b = raw[j + 1], f = (s - a.s) / Math.max(1e-6, b.s - a.s);
      pts.push({ x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f, s });
    }
    for (let k = 0; k < pts.length; k++) {
      const a = pts[Math.max(0, k - 1)], b = pts[Math.min(pts.length - 1, k + 1)];
      const d = Math.hypot(b.x - a.x, b.y - a.y) || 1;
      pts[k].tx = (b.x - a.x) / d; pts[k].ty = (b.y - a.y) / d;
    }
    L.archPts = pts; L.archLen = len; L.DS = DS;

    const margin = 10, gap = 3;
    const k = (len - 2 * margin - (NT - 1) * gap) / BW.reduce((a, b) => a + b, 0);
    const teeth = [];
    let s = margin;
    for (let i = 0; i < NT; i++) {
      const w0 = BW[i] * k;
      const sc = s + w0 / 2;
      s += w0 + gap;
      const P = archAt(L, 1, sc);
      const pf = 0.84 + 0.16 * (P.y - yB) / (yF - yB);   // 앞쪽(가까운 쪽)이 조금 크다
      const t = { jaw: 1, idx: i, s: sc, cx: P.x, cy: P.y, ang: Math.atan2(P.ty, P.tx),
        w: w0 * pf, d: BD[i] * k * 0.95 * pf, h: 15 * pf, pf, molar: i < 2 || i > 7 };
      teeth.push(t);
    }
    // 윗니 = 거울 (위쪽 0..9, 아래쪽 10..19)
    const upper = teeth.map(t => Object.assign({}, t, { jaw: 0, cy: 2 * midY - t.cy, ang: -t.ang }));
    L.teeth = upper.concat(teeth);
    L.teeth.forEach((t, i) => { t.i = i; t.dir = t.jaw === 1 ? 1 : -1; });
    // 이 사이 틈
    L.gaps = [];
    for (const jaw of [0, 1]) for (let i = 0; i < NT - 1; i++) {
      const a = L.teeth[jaw * NT + i], b = L.teeth[jaw * NT + i + 1];
      const sg = (a.s + a.w / 2 / a.pf + b.s - b.w / 2 / b.pf) / 2;
      const P = archAt(L, jaw, sg);
      L.gaps.push({ jaw, k: i, s: sg, x: P.x, y: P.y, nx: P.nx, ny: P.ny, tx: P.tx, ty: P.ty, d: (a.d + b.d) / 2, a: a.i, b: b.i });
    }
    L.pMinX = L.mL + 18; L.pMaxX = L.mR - 18;
    L.jawY = [[L.mT + 22, midY - 10], [midY + 10, L.mB - 20]];
    return L;
  }

  // 치열궁 위의 점 (s = 왼쪽 끝부터 길이). 밖으로 나가면 끝 방향으로 곧게 늘인다.
  function archAt(L, jaw, s) {
    const pts = L.archPts, n = pts.length;
    let x, y, tx, ty;
    if (s <= 0) { const p = pts[0]; tx = p.tx; ty = p.ty; x = p.x + tx * s; y = p.y + ty * s; }
    else if (s >= pts[n - 1].s) { const p = pts[n - 1]; tx = p.tx; ty = p.ty; const e = s - p.s; x = p.x + tx * e; y = p.y + ty * e; }
    else {
      const k = Math.min(n - 2, Math.floor(s / L.DS)), a = pts[k], b = pts[k + 1], f = (s - a.s) / L.DS;
      x = a.x + (b.x - a.x) * f; y = a.y + (b.y - a.y) * f;
      tx = a.tx + (b.tx - a.tx) * f; ty = a.ty + (b.ty - a.ty) * f;
      const d = Math.hypot(tx, ty) || 1; tx /= d; ty /= d;
    }
    // 안쪽(혀 쪽) 법선: 접선을 반시계로 90°
    let nx = ty, ny = -tx;
    if (jaw === 0) { y = 2 * L.midY - y; ty = -ty; ny = -ny; }
    return { x, y, tx, ty, nx, ny };
  }
  function nearestS(L, jaw, x, y) {
    if (jaw === 0) y = 2 * L.midY - y;
    let best = 0, bd = 1e18;
    for (const p of L.archPts) { const d = (p.x - x) * (p.x - x) + (p.y - y) * (p.y - y); if (d < bd) { bd = d; best = p.s; } }
    return best;
  }

  // 이 발자국(타원) 기준 좌표로 바꾸기: 1 안쪽이면 이 위
  function toLocal(t, x, y, grow) {
    const dx = x - t.cx, dy = (y - t.cy) / SQ;
    const c = Math.cos(-t.ang), s = Math.sin(-t.ang);
    const u = dx * c - dy * s, v = dx * s + dy * c;
    return [u / (t.w / 2 + (grow || 0)), v / (t.d / 2 + (grow || 0))];
  }
  function segDist(px, py, ax, ay, bx, by) {
    const vx = bx - ax, vy = by - ay, l2 = vx * vx + vy * vy;
    let f = l2 ? ((px - ax) * vx + (py - ay) * vy) / l2 : 0; f = Math.max(0, Math.min(1, f));
    return Math.hypot(px - ax - vx * f, py - ay - vy * f);
  }

  function Game(H, stageNo, rnd) {
    this.rnd = rnd || Math.random;
    this.L = layout(H);
    this.cfg = STAGES[stageNo - 1];
    this.stage = stageNo;
    this.teeth = this.L.teeth.map(t => Object.assign({}, t, { inf: 0, done: false, hurt: 0, eaten: 0 }));
    const start = this.teeth[NT + 4];
    start.inf = 0.12;
    this.p = { x: start.cx, y: start.cy - 2, r: 15, vx: 0, vy: 0, inv: 0, eating: -1, nibble: false, face: 1, jaw: 1,
      hide: 0, hidden: false, shade: false, exposed: false, flip: null, flipCd: 0 };
    this.hearts = 3; this.maxHearts = 3;
    this.sugar = 0; this.sugarAcc = 0;
    this.pain = 0; this.painWarn = false;
    this.tech = {};
    this.p.hide = this.hideMax();
    this.hz = []; this.candies = [];
    this.t = 0; this.status = 'play'; this.reason = ''; this.ev = [];
    this.nextBrush = 4; this.nextFloss = 6; this.nextCandy = 5;
    this.pending = { x: 0, y: 0 };
    this.hits = 0; this.flips = 0; this.sneaks = 0;
    this.lightA = -Math.PI / 2;
  }
  const G = Game.prototype;
  G.emit = function (type, o) { this.ev.push(Object.assign({ type }, o || {})); };
  G.range = function (a) { return a[0] + this.rnd() * (a[1] - a[0]); };
  G.doneCount = function () { let n = 0; for (const t of this.teeth) if (t.done) n++; return n; };
  G.has = function (k) { return !!this.tech[k]; };
  G.eatRate = function () { return 0.2 * (this.has('eat1') ? 1.35 : 1) * (this.has('eat2') ? 1.35 : 1); };
  G.spreadMul = function () { return (this.has('spread1') ? 1.5 : 1) * (this.has('spread2') ? 1.5 : 1); };
  G.cleanMul = function () { return this.has('sticky') ? 0.6 : 1; };
  G.speed = function () { return 175 * (this.has('speed') ? 1.2 : 1); };
  G.hideMax = function () { return 2.2 * (this.has('shade1') ? 1.5 : 1); };
  G.sightMul = function () { return (this.has('blur') ? 0.72 : 1) * (this.has('ghost') ? 0.8 : 1); };
  G.flipCdMax = function () { return this.has('speed') ? 1.3 : 1.9; };
  G.painEatMul = function () { return this.has('quiet') ? 0.55 : 1; };
  G.painDecay = function () { return this.cfg.painDecay + (this.has('numb') ? 0.8 : 0) + (this.has('calm') ? 0.6 : 0); };
  G.conquerPain = function (byPlayer) { return (byPlayer ? 4 : 2.5) * (this.has('calm') ? 0.4 : 1); };

  G.techState = function (k) {
    const n = TECH.find(x => x.k === k);
    if (this.tech[k]) return 'own';
    const prev = TECH.find(x => x.br === n.br && x.tier === n.tier - 1);
    if (prev && !this.tech[prev.k]) return 'locked';
    return this.sugar >= n.cost ? 'buy' : 'poor';
  };
  G.buy = function (k) {
    const n = TECH.find(x => x.k === k);
    if (!n || this.status !== 'play' || this.techState(k) !== 'buy') return false;
    this.sugar -= n.cost; this.tech[k] = 1;
    this.addPain(n.pain);
    if (k === 'shade1') this.p.hide = this.hideMax();
    this.emit('upgrade', { k, pain: n.pain });
    return true;
  };
  G.addSugar = function (n, x, y) { this.sugar += n; this.emit('sugar', { n, x, y }); };
  G.addPain = function (n) {
    this.pain = Math.max(0, Math.min(100, this.pain + n));
    if (this.pain >= 100 && this.status === 'play') { this.status = 'lose'; this.reason = 'dentist'; this.emit('dentist'); this.emit('lose'); }
  };

  G.neighbors = function (i) {
    const t = this.teeth[i], out = [], base = t.jaw * NT;
    if (t.idx > 0) out.push(base + t.idx - 1);
    if (t.idx < NT - 1) out.push(base + t.idx + 1);
    return out;
  };

  // 빛: 입 앞쪽(화면 위·아래 가장자리)에서 들어와 가운데로 그림자를 드리운다. 천천히 흔들린다.
  G.shadowVec = function (t) {
    const a = this.lightA, l = t.h * 2.9;
    return [Math.cos(a) * l, Math.sin(a) * l * t.dir];
  };
  G.onTooth = function (x, y, grow) {
    for (const t of this.teeth) { const [u, v] = toLocal(t, x, y, grow || 0); if (u * u + v * v <= 1) return t.i; }
    return -1;
  };
  G.inShadow = function (x, y) {
    if (this.onTooth(x, y, 2) >= 0) return false;
    for (const t of this.teeth) {
      if (Math.abs(x - t.cx) > 90 || Math.abs(y - t.cy) > 90) continue;
      const [u, v] = toLocal(t, x, y);
      const [sx, sy] = this.shadowVec(t);
      const [a, b] = toLocal(t, t.cx + sx, t.cy + sy);
      if (segDist(u, v, 0, 0, a, b) <= 1) return true;
    }
    return false;
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
      this.emit('conquer', { i: t.i, x: t.cx, y: t.cy, byPlayer: !!byPlayer });
      this.addPain(this.conquerPain(byPlayer));
    }
  };

  // 위아래 뒤집기 (중력 반전)
  G.canFlip = function () { return this.status === 'play' && !this.p.flip && this.p.flipCd <= 0; };
  G.doFlip = function () {
    if (!this.canFlip()) return false;
    const p = this.p, L = this.L;
    const tj = 1 - p.jaw;
    let ty = 2 * L.midY - p.y;
    ty = Math.max(L.jawY[tj][0], Math.min(L.jawY[tj][1], ty));
    p.flip = { t: 0, dur: 0.42, x0: p.x, y0: p.y, x1: p.x, y1: ty, to: tj };
    p.flipCd = this.flipCdMax();
    this.pending.x = 0; this.pending.y = 0;
    this.flips++;
    this.emit('flip', { to: tj });
    return true;
  };

  G.update = function (dt, input) {
    if (this.status !== 'play') return;
    dt = Math.min(dt, 0.05);
    this.t += dt;
    const p = this.p, L = this.L, cfg = this.cfg;
    this.lightA = -Math.PI / 2 + cfg.sway * Math.sin(this.t * cfg.swaySpd);

    if (p.flipCd > 0) p.flipCd -= dt;
    if (p.inv > 0) p.inv -= dt;

    if (p.flip) {
      const f = p.flip; f.t += dt;
      const k = Math.min(1, f.t / f.dur), e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      p.x = f.x0 + (f.x1 - f.x0) * e; p.y = f.y0 + (f.y1 - f.y0) * e;
      if (k >= 1) { p.flip = null; p.jaw = f.to; this.emit('land', { x: p.x, y: p.y }); }
      p.vx = 0; p.vy = 0; p.eating = -1; p.hidden = false; p.shade = false;
      if (input) { input.dx = 0; input.dy = 0; }
    } else {
      // --- 움직임: 손가락이 끈 만큼(상대 이동) 따라간다. 최고 속도는 제한. 자기 턱 안에서만.
      if (input) { this.pending.x += input.dx || 0; this.pending.y += input.dy || 0; }
      const pm = Math.hypot(this.pending.x, this.pending.y);
      if (pm > 70) { this.pending.x *= 70 / pm; this.pending.y *= 70 / pm; }
      const maxStep = this.speed() * dt;
      let mx = this.pending.x, my = this.pending.y;
      const m = Math.hypot(mx, my);
      if (m > maxStep) { mx *= maxStep / m; my *= maxStep / m; }
      this.pending.x -= mx; this.pending.y -= my;
      const ox = p.x, oy = p.y, jy = L.jawY[p.jaw];
      p.x = Math.max(L.pMinX, Math.min(L.pMaxX, p.x + mx));
      p.y = Math.max(jy[0], Math.min(jy[1], p.y + my));
      p.vx = (p.x - ox) / dt; p.vy = (p.y - oy) / dt;
      if (Math.abs(mx) > 0.3) p.face = mx > 0 ? 1 : -1;

      // --- 그림자에 숨기 (숨는 시간은 짧다)
      const sh = this.inShadow(p.x, p.y);
      const wasHidden = p.hidden;
      p.shade = sh;
      if (sh && !p.exposed) {
        p.hide -= dt * (this.has('ghost') ? 0.6 : 1);
        if (p.hide <= 0) { p.hide = 0; p.exposed = true; this.emit('exposed', { x: p.x, y: p.y }); }
      } else if (!sh) p.hide = Math.min(this.hideMax(), p.hide + dt * 0.55);
      if (p.exposed && !sh && p.hide >= this.hideMax() * 0.45) p.exposed = false;
      p.hidden = sh && !p.exposed;
      if (p.hidden && !wasHidden) this.emit('hide', { x: p.x, y: p.y });

      // --- 먹기: 이 위면 냠냠 빨리, 옆(그림자)이면 조금씩
      let best = -1, bd = 1e9, top = false;
      for (const t of this.teeth) {
        if (t.done || t.jaw !== p.jaw) continue;
        const [u, v] = toLocal(t, p.x, p.y, 4);
        const d0 = u * u + v * v;
        if (d0 <= 1) { if (!top || d0 < bd) { top = true; bd = d0; best = t.i; } }
        else if (!top) {
          const [u2, v2] = toLocal(t, p.x, p.y, p.r + 4);
          const d2 = u2 * u2 + v2 * v2;
          if (d2 <= 1 && d2 < bd) { bd = d2; best = t.i; }
        }
      }
      const wasEating = p.eating;
      p.eating = (p.inv > 1.0) ? -1 : best;
      p.nibble = p.eating >= 0 && !top;
      if (p.eating >= 0) {
        const t = this.teeth[p.eating];
        const mul = p.nibble ? 0.38 : 1;
        this.infect(t, this.eatRate() * mul * dt, true);
        this.addPain(cfg.painEat * this.painEatMul() * (p.nibble ? 0.35 : 1) * dt);
        t.eaten += dt * mul;
        if (p.eating !== wasEating || Math.floor(t.eaten / 0.28) !== Math.floor((t.eaten - dt * mul) / 0.28))
          this.emit('chomp', { x: t.cx, y: t.cy, i: t.i, nibble: p.nibble });
      } else this.addPain(-this.painDecay() * dt);
      if (p.eating >= 0) this.addPain(-this.painDecay() * 0.35 * dt);
    }
    if (this.status !== 'play') return;
    if (this.pain >= 75 && !this.painWarn) { this.painWarn = true; this.emit('painWarn'); }
    if (this.pain < 60) this.painWarn = false;

    // --- 번짐 (저절로 자라고, 옆으로 옮는다)
    const sm = this.spreadMul();
    const add = new Array(this.teeth.length).fill(0);
    for (const t of this.teeth) {
      if (t.inf <= 0) continue;
      if (!t.done) add[t.i] += cfg.grow * sm * dt * (0.4 + t.inf);
      if (t.inf >= 0.5) for (const j of this.neighbors(t.i)) if (!this.teeth[j].done) add[j] += cfg.spread * sm * dt * t.inf;
    }
    for (const t of this.teeth) if (add[t.i] > 0) {
      const was = t.inf;
      this.infect(t, add[t.i], false);
      if (was === 0 && t.inf > 0) this.emit('spread', { i: t.i, x: t.cx, y: t.cy });
    }
    if (this.status !== 'play') return;

    // --- 칫솔·치실
    this.nextBrush -= dt;
    if (this.nextBrush <= 0) {
      if (this.rnd() < cfg.doubleP) { this.spawnBrush(0, 'sweep'); this.spawnBrush(1, 'sweep'); }
      else this.spawnBrush();
      this.nextBrush = this.range(cfg.brushEvery);
    }
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
      if (this.candies.length < 2) {
        const jaw = this.rnd() < 0.5 ? 0 : 1, jy = L.jawY[jaw];
        let x = 0, y = 0;
        for (let k = 0; k < 12; k++) {
          x = L.pMinX + 20 + this.rnd() * (L.pMaxX - L.pMinX - 40);
          y = jy[0] + 16 + this.rnd() * (jy[1] - jy[0] - 32);
          if (this.onTooth(x, y, 10) < 0) break;
        }
        this.candies.push({ kind: (this.hearts < this.maxHearts && this.rnd() < 0.35) ? 'heart' : 'candy', x, y, jaw, life: 8, age: 0 });
      }
    }
    for (const c of this.candies) {
      c.age += dt; c.life -= dt;
      if (!p.flip && Math.hypot(c.x - p.x, c.y - p.y) < p.r + 14) {
        c.life = -1;
        if (c.kind === 'heart' && this.hearts < this.maxHearts) { this.hearts++; this.emit('heal', { x: c.x, y: c.y }); }
        else { this.addSugar(3, c.x, c.y); this.emit('candy', { x: c.x, y: c.y }); }
      }
    }
    this.candies = this.candies.filter(c => c.life > 0);

    for (const t of this.teeth) if (t.hurt > 0) t.hurt -= dt;

    if (this.doneCount() === this.teeth.length && this.status === 'play') { this.status = 'win'; this.emit('win'); }
  };

  G.spawnBrush = function (forceJaw, forceMode) {
    const L = this.L, p = this.p, cfg = this.cfg;
    const jaw = forceJaw != null ? forceJaw : (this.rnd() < cfg.chaseP ? p.jaw : (this.rnd() < 0.5 ? 0 : 1));
    const mode = forceMode || (this.rnd() < cfg.scrubP && jaw === p.jaw ? 'scrub' : 'sweep');
    const len = L.archLen;
    const h = { kind: 'brush', jaw, mode, off: 0, st: 'warn', tw: cfg.warn, t: 0, cleaned: {}, spot: false, sneak: false, gone: false };
    if (mode === 'sweep') {
      h.dir = this.rnd() < 0.5 ? 1 : -1;
      h.s = h.dir > 0 ? -45 : len + 45;
    } else {
      h.s0 = Math.max(70, Math.min(len - 70, nearestS(L, jaw, p.x, p.y) + (this.rnd() - 0.5) * 60));
      h.s = h.s0; h.ph = 0; h.life = 2.3; h.dir = 1;
    }
    this.headPos(h);
    this.hz.push(h);
    this.emit('warn', { kind: 'brush' });
  };
  G.headPos = function (h) {
    const P = archAt(this.L, h.jaw, h.s);
    h.x = P.x + P.nx * h.off; h.y = P.y + P.ny * h.off; h.tx = P.tx; h.ty = P.ty; h.nx = P.nx; h.ny = P.ny;
    h.ax = P.x; h.ay = P.y;
  };

  G.spawnFloss = function () {
    const L = this.L, p = this.p;
    const jaw = this.rnd() < 0.7 ? p.jaw : 1 - p.jaw;
    const gs = L.gaps.filter(g => g.jaw === jaw);
    let g;
    if (this.rnd() < 0.65) { let bd = 1e9; for (const q of gs) { const d = Math.hypot(q.x - p.x, q.y - p.y); if (d < bd) { bd = d; g = q; } } }
    else g = gs[Math.floor(this.rnd() * gs.length)];
    this.hz.push({ kind: 'floss', g, jaw, st: 'warn', tw: this.cfg.flossWarn, t: 0, sweep: 0, cleaned: {}, gone: false });
    this.emit('warn', { kind: 'floss' });
  };
  // 치실이 닿는 곳: 이 사이 틈을 가로지르는 줄 + 틈 그림자 쪽으로 훑는 자리
  G.flossZone = function (h) {
    const g = h.g, a = this.lightA, l = 58;
    const sx = Math.cos(a) * l, sy = Math.sin(a) * l * (g.jaw === 1 ? 1 : -1);
    const e = g.d / 2 + 12;
    return { ax: g.x - g.nx * e, ay: g.y - g.ny * e, bx: g.x + g.nx * e, by: g.y + g.ny * e, r1: 13,
      cx: g.x, cy: g.y, dx: g.x + sx, dy: g.y + sy, r2: 22 };
  };
  G.inFloss = function (h, x, y) {
    const z = this.flossZone(h);
    return segDist(x, y, z.ax, z.ay, z.bx, z.by) < z.r1 + this.p.r * 0.5 || segDist(x, y, z.cx, z.cy, z.dx, z.dy) < z.r2 + this.p.r * 0.4;
  };

  G.hitPlayer = function (h) {
    const p = this.p;
    if (p.inv > 0 || p.flip || this.status !== 'play') return;
    this.hearts--; this.hits++;
    p.inv = 1.8;
    const dx = p.x - (h.x || p.x), dy = p.y - (h.y || p.y), d = Math.hypot(dx, dy) || 1;
    this.pending.x = dx / d * 50; this.pending.y = dy / d * 50;
    this.emit('hit', { x: p.x, y: p.y, kind: h.kind });
    if (this.hearts <= 0) { this.status = 'lose'; this.reason = 'clean'; this.emit('lose'); }
  };

  G.cleanTooth = function (i, amt) {
    const t = this.teeth[i];
    if (t.done || t.inf <= 0) return;
    t.inf = Math.max(0, t.inf - amt * this.cleanMul());
    t.hurt = 0.5;
    this.emit('clean', { i, x: t.cx, y: t.cy });
  };

  G.brushSight = function () { return this.cfg.sight * this.sightMul(); };

  G.updHazard = function (h, dt) {
    const p = this.p, cfg = this.cfg, L = this.L;
    h.t += dt;
    if (h.st === 'warn') {
      if (h.t >= h.tw) { h.st = 'go'; h.t = 0; this.emit(h.kind === 'brush' ? 'swish' : 'floss', { jaw: h.jaw }); }
      return;
    }
    if (h.kind === 'brush') {
      // 칫솔의 눈: 보이면(그림자 밖) 쫓아오고, 숨으면 놓친다
      const sameJaw = !p.flip && p.jaw === h.jaw;
      const d = Math.hypot(p.x - h.x, p.y - h.y);
      const seeing = sameJaw && !p.hidden && d < this.brushSight();
      if (seeing) {
        if (!h.spot) { h.spot = true; this.emit('spot', { x: h.x, y: h.y }); }
        const want = Math.max(-cfg.offMax, Math.min(cfg.offMax, (p.x - h.ax) * h.nx + (p.y - h.ay) * h.ny));
        const st = cfg.steer * dt;
        h.off += Math.max(-st, Math.min(st, want - h.off));
        if (h.mode === 'scrub') {
          const ps = nearestS(L, h.jaw, p.x, p.y);
          h.s0 += Math.max(-70 * dt, Math.min(70 * dt, ps - h.s0));
        }
      } else {
        if (h.spot) { h.spot = false; h.lostAt = this.t; this.emit('lost', { x: h.x, y: h.y, hidden: p.hidden && sameJaw }); }
        const st = cfg.steer * 0.5 * dt;
        h.off += Math.max(-st, Math.min(st, -h.off));
      }
      if (h.mode === 'sweep') {
        h.s += h.dir * cfg.brushSpeed * (seeing ? 0.6 : 1) * dt;
        if (h.s < -55 || h.s > L.archLen + 55) h.gone = true;
      } else {
        h.ph += dt * 5.5; h.life -= dt;
        h.s = h.s0 + 62 * Math.sin(h.ph);
        if (h.life <= 0) h.gone = true;
      }
      this.headPos(h);
      // 닦기
      if (Math.abs(h.off) < 45) for (let k = 0; k < NT; k++) {
        const t = this.teeth[h.jaw * NT + k];
        if (Math.abs(t.s - h.s) < t.w / 2 + 18) {
          const last = h.cleaned[t.i];
          if (last == null || (h.mode === 'scrub' && this.t - last > 0.6)) { h.cleaned[t.i] = this.t; this.cleanTooth(t.i, cfg.clean * (h.mode === 'scrub' ? 0.55 : 1)); }
        }
      }
      if (sameJaw && d < 26 + p.r * 0.6) {
        if (!p.hidden) this.hitPlayer(h);
        else if (!h.sneak) { h.sneak = true; this.sneaks++; this.addSugar(1, p.x, p.y - 20); this.emit('sneak', { x: p.x, y: p.y }); }
      }
    } else {
      if (h.st === 'go') {
        h.sweep = Math.min(1, h.t / 0.45);
        for (const i of [h.g.a, h.g.b]) if (!h.cleaned[i]) { h.cleaned[i] = 1; this.cleanTooth(i, cfg.flossClean); }
        if (!p.flip && p.jaw === h.jaw && this.inFloss(h, p.x, p.y)) this.hitPlayer({ kind: 'floss', x: h.g.x, y: h.g.y });
        if (h.t > 0.6) { h.st = 'up'; h.t = 0; }
      } else if (h.st === 'up') {
        if (h.t > 0.3) h.gone = true;
      }
    }
  };

  const api = { W, NT, SQ, STAGES, TECH, layout, archAt, toLocal, Game };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.ChungLogic = api;
})(typeof window !== 'undefined' ? window : this);
