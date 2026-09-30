// logic.js — 충치의 역습 v3: 그림 없이 규칙만. 브라우저와 node(시험용) 양쪽에서 돈다.
// v3 (형 9/30 「병균 세계 퍼트리는 게임처럼」): 입 = 세계지도, 이빨 = 나라.
//  충치는 저절로 옆 이·맞닿은 위아래 이로 번진다. 플레이어는 방울 톡(사탕 = DNA)·진화 나무·특수기(숨기/대피).
//  주인 쪽 「치과 예약」 막대(= 치료제)가 다 차기 전에 모든 이를 먹으면 승리.
(function (root) {
  'use strict';
  const W = 390;
  const NT = 10;          // 한 턱에 이 10개 (젖니)
  const SQ = 0.8;         // 비스듬히 봐서 위아래가 눌려 보이는 정도

  // 단계별 세기. 1단계는 처음 하는 사람도 이기게 (형 「1탄부터 너무 쎄」).
  const STAGES = [
    { id: 1, grow: 0.042, spread: 0.08, face: 0.04, doneSpread: 0.8,
      brushEvery: [11, 14], brushFirst: 14, brushWarn: 2.8, brushZone: 3, brushSpeed: 110, brushTarget: 0.3, clean: 0.3, brushBack: false,
      floss: false, gargle: false,
      research: 0.2, discover: 16, bubbleEvery: 4.6, bubbleLife: 8,
      hideMax: 3, hideRe: 7, evacCd: 12, eventEvery: [13, 18],
      events: { candy: 4, juice: 3, sleep: 3, mom: 1, ad: 1, water: 1 } },
    { id: 2, grow: 0.038, spread: 0.072, face: 0.036, doneSpread: 0.75,
      brushEvery: [8.5, 11], brushFirst: 11, brushWarn: 2.4, brushZone: 4, brushSpeed: 130, brushTarget: 0.5, clean: 0.36, brushBack: true,
      floss: true, flossEvery: [9, 12], flossWarn: 1.8, flossClean: 0.45, gargle: false,
      research: 0.32, discover: 12, bubbleEvery: 4.6, bubbleLife: 7,
      hideMax: 3, hideRe: 7, evacCd: 12, eventEvery: [12, 17],
      events: { candy: 3, juice: 2, sleep: 2, mom: 2, ad: 2, water: 1 } },
    { id: 3, grow: 0.036, spread: 0.068, face: 0.032, doneSpread: 0.7,
      brushEvery: [7.5, 10], brushFirst: 10, brushWarn: 2.2, brushZone: 4, brushSpeed: 140, brushTarget: 0.65, clean: 0.4, brushBack: true,
      floss: true, flossEvery: [8, 11], flossWarn: 1.6, flossClean: 0.5,
      gargle: true, gargleEvery: [22, 28], gargleFirst: 30, gargleWarn: 3.0, gargleClean: 0.3,
      research: 0.78, discover: 10, bubbleEvery: 4.6, bubbleLife: 6.5,
      hideMax: 3, hideRe: 7, evacCd: 12, eventEvery: [11, 16],
      events: { candy: 3, juice: 2, sleep: 1, mom: 3, ad: 2, water: 2, call: 1 } },
  ];

  // 진화 나무 (Plague Inc 의 전염성·은밀성·치명성 대신: 번짐 / 숨기 / 진정)
  // pain: 사면 아야 지수가 이만큼 늘 붙는다(음수면 내려간다).
  const TECH = [
    { k: 'eat1', br: 0, tier: 0, cost: 4, pain: 5 },
    { k: 'spread1', br: 0, tier: 1, cost: 7, pain: 6 },
    { k: 'jump', br: 0, tier: 2, cost: 10, pain: 8 },
    { k: 'spread2', br: 0, tier: 3, cost: 14, pain: 10 },
    { k: 'shade1', br: 1, tier: 0, cost: 4, pain: 2 },
    { k: 'sticky', br: 1, tier: 1, cost: 7, pain: 3 },
    { k: 'blur', br: 1, tier: 2, cost: 9, pain: 0 },
    { k: 'ghost', br: 1, tier: 3, cost: 12, pain: 3 },
    { k: 'quiet', br: 2, tier: 0, cost: 4, pain: -8 },
    { k: 'numb', br: 2, tier: 1, cost: 7, pain: -15 },
    { k: 'calm', br: 2, tier: 2, cost: 10, pain: -6 },
    { k: 'sleep', br: 2, tier: 3, cost: 13, pain: -6 },
  ];

  // 이 모양: 왼쪽 끝 어금니 → 가운데 앞니 → 오른쪽 끝 어금니
  const BW = [48, 44, 34, 30, 32, 32, 30, 34, 44, 48];
  const BD = [52, 48, 36, 28, 26, 26, 28, 36, 48, 52];

  function layout(H) {
    const L = { W, H, SQ };
    L.hudH = 96;
    L.mT = 102; L.mB = H - 118; L.mL = 8; L.mR = W - 8;
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

  function Game(H, stageNo, rnd) {
    this.rnd = rnd || Math.random;
    this.L = layout(H);
    this.cfg = STAGES[stageNo - 1];
    this.stage = stageNo;
    this.teeth = this.L.teeth.map(t => Object.assign({}, t, { inf: 0, done: false, hurt: 0, shield: 0, half: false }));
    const start = this.teeth[NT + 4];
    start.inf = 0.3;
    this.zero = start.i;
    this.sugar = 2;
    this.pain = 0; this.techPain = 0; this.painWarn = false;
    this.found = false; this.cure = 0; this.cureMarks = {};
    this.tech = {};
    this.hideN = this.hideMax(); this.hideT = 0;
    this.evacT = 0;
    this.hz = []; this.bubbles = []; this.bid = 0; this.hid = 0;
    this.t = 0; this.status = 'play'; this.reason = ''; this.ev = [];
    this.nextBrush = this.cfg.brushFirst; this.nextFloss = 16; this.nextGargle = this.cfg.gargleFirst || 99;
    this.nextBubble = 2; this.nextEvent = 9;
    this.fx = {}; // 뉴스 효과: 이름 → 남은 시간
    this.news = null; this.newsQ = [];
    this.popped = 0; this.sneaks = 0; this.evacs = 0; this.hides = 0;
    this.lightA = -Math.PI / 2;
    this.say('start');
  }
  const G = Game.prototype;
  G.emit = function (type, o) { this.ev.push(Object.assign({ type }, o || {})); };
  G.range = function (a) { return a[0] + this.rnd() * (a[1] - a[0]); };
  G.doneCount = function () { let n = 0; for (const t of this.teeth) if (t.done) n++; return n; };
  G.infCount = function () { let n = 0; for (const t of this.teeth) if (t.inf > 0) n++; return n; };
  G.has = function (k) { return !!this.tech[k]; };
  // --- 세기 (진화·뉴스가 곱해진다)
  G.growMul = function () { return (this.has('eat1') ? 1.25 : 1) * (this.has('spread2') ? 1.2 : 1) * (this.fx.sweet > 0 ? 1.5 : 1); };
  G.spreadMul = function () { return (this.has('spread1') ? 1.35 : 1) * (this.has('spread2') ? 1.35 : 1) * (this.fx.sweet > 0 ? 1.5 : 1); };
  G.faceMul = function () { return this.has('jump') ? 2 : 1; };
  G.cleanMul = function () { return (this.has('sticky') ? 0.7 : 1) * (this.has('ghost') ? 0.65 : 1); };
  G.resMul = function () { return (this.has('blur') ? 0.8 : 1) * (this.has('calm') ? 0.75 : 1) * (this.has('sleep') ? 0.8 : 1) * (this.fx.sleep > 0 ? 0 : 1); };
  G.brushGap = function () { return (this.has('sleep') ? 1.25 : 1) * (this.fx.mom > 0 ? 0.55 : 1); };
  G.hideMax = function () { return this.cfg.hideMax + (this.has('shade1') ? 2 : 0); };
  G.hideRe = function () { return this.cfg.hideRe * (this.has('shade1') ? 0.6 : 1); };
  G.evacCdMax = function () { return this.cfg.evacCd * (this.has('ghost') ? 0.6 : 1); };
  G.discoverAt = function () { return this.cfg.discover + (this.has('blur') ? 10 : 0); };

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
    this.techPain += n.pain;
    if (k === 'shade1') this.hideN = Math.min(this.hideMax(), this.hideN + 2);
    this.calcPain();
    this.emit('upgrade', { k, pain: n.pain });
    return true;
  };
  G.addSugar = function (n, x, y) { this.sugar += n; this.emit('sugar', { n, x, y }); };

  // 이웃 나라: 같은 턱 양옆 + 맞닿은 반대 턱 이
  G.neighbors = function (i) {
    const t = this.teeth[i], out = [], base = t.jaw * NT;
    if (t.idx > 0) out.push(base + t.idx - 1);
    if (t.idx < NT - 1) out.push(base + t.idx + 1);
    return out;
  };
  G.facing = function (i) { const t = this.teeth[i]; return (1 - t.jaw) * NT + t.idx; };

  // 빛·그림자 (그림: 이 그림자 속에 충치가 숨는다)
  G.shadowVec = function (t) {
    const a = this.lightA, l = t.h * 2.9;
    return [Math.cos(a) * l, Math.sin(a) * l * t.dir];
  };

  // --- 뉴스 한 줄
  G.say = function (key, o) {
    const n = Object.assign({ key, t: 0 }, o || {});
    if (!this.news || this.news.t > 2.2) { this.news = n; this.emit('news', n); }
    else if (this.newsQ.length < 3) this.newsQ.push(n);
  };

  // --- 방울 (Plague Inc 의 DNA 방울)
  G.spawnBubble = function (i, kind) {
    const t = this.teeth[i];
    if (this.bubbles.length >= 7) return null;
    const n = kind === 'gold' ? 3 : kind === 'red' ? 2 : 1; // 주황 1 · 빨강 2 · 금 3
    const b = { id: ++this.bid, i, kind, n, x: t.cx + (this.rnd() - 0.5) * 16, y: t.cy - (t.d * 0.5 + 18) * t.dir * SQ, age: 0, life: this.cfg.bubbleLife };
    // 겹치면 조금 비킨다
    for (const q of this.bubbles) if (Math.hypot(q.x - b.x, q.y - b.y) < 30) { b.x += (b.x < W / 2 ? 1 : -1) * 26; b.y -= 10 * t.dir; }
    b.x = Math.max(24, Math.min(W - 24, b.x));
    this.bubbles.push(b);
    this.emit('bubble', { id: b.id, x: b.x, y: b.y, kind });
    return b;
  };
  G.pop = function (id) {
    const k = this.bubbles.findIndex(b => b.id === id);
    if (k < 0 || this.status !== 'play') return false;
    const b = this.bubbles[k];
    this.bubbles.splice(k, 1);
    this.popped++;
    this.addSugar(b.n, b.x, b.y);
    this.emit('pop', { x: b.x, y: b.y, kind: b.kind });
    return true;
  };

  G.infect = function (t, amt) {
    if (t.done || amt <= 0) return;
    const was = t.inf;
    t.inf = Math.min(1, t.inf + amt);
    if (was === 0) { this.emit('spread', { i: t.i, x: t.cx, y: t.cy }); if (this.rnd() < 0.6) this.spawnBubble(t.i, 'orange'); }
    if (!t.half && t.inf >= 0.5) { t.half = true; t.root = true; this.emit('half', { i: t.i, x: t.cx, y: t.cy }); }
    if (t.inf >= 1) {
      t.done = true; t.inf = 1;
      this.emit('conquer', { i: t.i, x: t.cx, y: t.cy });
      const n = this.doneCount();
      if (n === 1 || n === 10 || n === 17) this.spawnBubble(t.i, 'gold'); else if (this.rnd() < 0.5) this.spawnBubble(t.i, 'red');
      if (n === 1) this.say('firstDone');
      else if (n === 10) this.say('halfDone');
      else if (n === 17) this.say('almost');
    }
  };

  G.calcPain = function () {
    let s = 0;
    for (const t of this.teeth) s += t.done ? 3.2 : t.inf * 2;
    this.pain = Math.max(0, Math.min(100, s + this.techPain));
  };

  // --- 특수기 1: 숨기 (칫솔이 오는 이의 충치를 톡 → 이 그림자에 숨는다)
  G.threatOf = function (i) {
    const t = this.teeth[i];
    for (const h of this.hz) {
      if (h.st === 'done') continue;
      if (h.kind === 'brush') { if (h.jaw === t.jaw && !h.cleaned[i] && t.s > h.s0 - 20 && t.s < h.s1 + 20) return h; }
      else if (h.kind === 'floss') { if ((h.a === i || h.b === i) && h.st === 'warn') return h; }
      else if (h.kind === 'gargle') { if (!h.cleaned[i]) return h; }
    }
    return null;
  };
  G.canHide = function (i) {
    const t = this.teeth[i];
    return this.status === 'play' && t && !t.done && t.inf > 0 && t.shield <= 0 && this.hideN >= 1 && !!this.threatOf(i);
  };
  G.hide = function (i) {
    if (!this.canHide(i)) return false;
    const h = this.threatOf(i), t = this.teeth[i];
    t.shield = h.kind === 'gargle' ? 6 : h.kind === 'floss' ? 3.5 : 7;
    t.shieldBy = h.id;
    this.hideN -= 1; this.hides++;
    this.emit('hide', { i, x: t.cx, y: t.cy });
    return true;
  };

  // --- 특수기 2: 대피 (위아래 뒤집기). 닦일 턱의 충치가 맞은편 턱으로 휙 뛰어 옮는다.
  G.evacTarget = function () {
    let best = null;
    for (const h of this.hz) if (h.kind === 'brush' && h.st !== 'done' && (!best || h.t < best.t)) best = h;
    return best;
  };
  G.canEvac = function () {
    if (this.status !== 'play' || this.evacT > 0) return false;
    const h = this.evacTarget(); if (!h) return false;
    for (let k = 0; k < NT; k++) { const t = this.teeth[h.jaw * NT + k]; if (!t.done && t.inf > 0 && !h.cleaned[t.i] && t.s > h.s0 - 20 && t.s < h.s1 + 20) return true; }
    return false;
  };
  G.evac = function () {
    if (!this.canEvac()) return false;
    const h = this.evacTarget(), jumps = [];
    for (let k = 0; k < NT; k++) {
      const t = this.teeth[h.jaw * NT + k];
      if (t.done || t.inf <= 0 || h.cleaned[t.i] || t.s < h.s0 - 20 || t.s > h.s1 + 20) continue;
      const o = this.teeth[this.facing(t.i)];
      jumps.push({ from: t.i, to: o.i });
      this.infect(o, 0.12 + t.inf * 0.35);
    }
    this.evacT = this.evacCdMax(); this.evacs++;
    this.emit('flip', { jumps, to: 1 - h.jaw });
    return true;
  };

  // --- 뉴스 사건
  G.doEvent = function () {
    const ws = this.cfg.events, keys = Object.keys(ws);
    let sum = 0; for (const k of keys) sum += ws[k];
    let r = this.rnd() * sum, key = keys[0];
    for (const k of keys) { r -= ws[k]; if (r <= 0) { key = k; break; } }
    if (key === 'candy') {
      this.fx.sweet = 12;
      const inf = this.teeth.filter(t => t.inf > 0);
      for (let k = 0; k < 2 && inf.length; k++) this.spawnBubble(inf[Math.floor(this.rnd() * inf.length)].i, 'orange');
    } else if (key === 'juice') {
      this.fx.sweet = 8;
    } else if (key === 'sleep') {
      this.fx.sleep = 12; this.nextBrush = Math.max(this.nextBrush, 12);
    } else if (key === 'mom') {
      this.fx.mom = 14; this.nextBrush = Math.min(this.nextBrush, 1.2);
    } else if (key === 'ad') {
      if (!this.found) this.discover(); else this.cure = Math.min(99, this.cure + 6);
    } else if (key === 'water') {
      for (const t of this.teeth) if (!t.done && t.inf > 0 && t.shield <= 0) t.inf = Math.max(0.02, t.inf - 0.05);
    } else if (key === 'call') {
      if (!this.found) this.discover(); else this.cure = Math.min(99, this.cure + 8);
    }
    this.say('ev_' + key, { good: key === 'candy' || key === 'juice' || key === 'sleep' });
    this.emit('event', { key });
  };
  G.discover = function () {
    if (this.found) return;
    this.found = true;
    this.say('found');
    this.emit('found');
  };

  G.update = function (dt) {
    if (this.status !== 'play') return;
    dt = Math.min(dt, 0.05);
    this.t += dt;
    const L = this.L, cfg = this.cfg;
    this.lightA = -Math.PI / 2 + 0.5 * Math.sin(this.t * 0.3);
    for (const k in this.fx) if (this.fx[k] > 0) this.fx[k] -= dt;
    if (this.evacT > 0) this.evacT -= dt;
    if (this.hideN < this.hideMax()) { this.hideT += dt; if (this.hideT >= this.hideRe()) { this.hideT = 0; this.hideN++; } } else this.hideT = 0;

    // --- 뉴스 줄
    if (this.news) { this.news.t += dt; if (this.news.t > 5.5) { this.news = null; } }
    if ((!this.news || this.news.t > 2.2) && this.newsQ.length) { this.news = this.newsQ.shift(); this.emit('news', this.news); }

    // --- 번짐 (저절로 자라고, 옆 나라로 옮는다)
    const gm = this.growMul(), sm = this.spreadMul(), fm = this.faceMul();
    const add = new Array(this.teeth.length).fill(0);
    for (const t of this.teeth) {
      if (t.inf <= 0) continue;
      if (!t.done) add[t.i] += cfg.grow * gm * dt * (0.35 + t.inf);
      if (t.inf < 0.3) continue;
      const pw = t.done ? cfg.doneSpread * (this.has('jump') ? 1.3 : 1) : t.inf;
      // 옆 이: 확률로 새로 옮고, 이미 옮은 이는 더 빨리 자란다
      for (const j of this.neighbors(t.i)) {
        const o = this.teeth[j]; if (o.done) continue;
        if (o.inf <= 0) { if (this.rnd() < cfg.spread * sm * pw * dt) add[j] += 0.06; }
        else add[j] += cfg.grow * 0.25 * sm * pw * dt;
      }
      const o = this.teeth[this.facing(t.i)];
      if (!o.done) {
        if (o.inf <= 0) { if (this.rnd() < cfg.face * sm * fm * pw * dt) add[o.i] += 0.06; }
        else add[o.i] += cfg.grow * 0.15 * fm * pw * dt;
      }
    }
    for (const t of this.teeth) if (add[t.i] > 0) this.infect(t, add[t.i]);

    // --- 아야 지수 → 주인이 알아채고 → 치과 예약 막대
    this.calcPain();
    if (!this.found && this.pain >= this.discoverAt()) this.discover();
    if (this.pain >= 75 && !this.painWarn) { this.painWarn = true; this.say('pain'); this.emit('painWarn'); }
    if (this.pain < 60) this.painWarn = false;
    if (this.found) {
      this.cure += cfg.research * (0.5 + 1.2 * this.pain / 100) * this.resMul() * dt;
      for (const m of [50, 80]) if (this.cure >= m && !this.cureMarks[m]) { this.cureMarks[m] = 1; this.say('cure' + m); }
      if (this.cure >= 100) { this.cure = 100; this.status = 'lose'; this.reason = 'dentist'; this.emit('dentist'); this.emit('lose'); return; }
    }

    // --- 방울
    this.nextBubble -= dt;
    if (this.nextBubble <= 0) {
      this.nextBubble = cfg.bubbleEvery * (0.7 + this.rnd() * 0.6);
      const inf = this.teeth.filter(t => t.inf > 0);
      if (inf.length) this.spawnBubble(inf[Math.floor(this.rnd() * inf.length)].i, 'orange');
    }
    for (const b of this.bubbles) { b.age += dt; b.life -= dt; }
    this.bubbles = this.bubbles.filter(b => b.life > 0);

    // --- 뉴스 사건
    this.nextEvent -= dt;
    if (this.nextEvent <= 0) { this.nextEvent = this.range(cfg.eventEvery); this.doEvent(); }

    // --- 방역: 칫솔·치실·가글
    if (!(this.fx.sleep > 0)) {
      this.nextBrush -= dt;
      if (this.nextBrush <= 0) { this.spawnBrush(); this.nextBrush = this.range(cfg.brushEvery) * this.brushGap(); }
      if (cfg.floss) { this.nextFloss -= dt; if (this.nextFloss <= 0) { this.spawnFloss(); this.nextFloss = this.range(cfg.flossEvery); } }
      if (cfg.gargle) { this.nextGargle -= dt; if (this.nextGargle <= 0) { this.spawnGargle(); this.nextGargle = this.range(cfg.gargleEvery); } }
    }
    for (const h of this.hz) this.updHazard(h, dt);
    this.hz = this.hz.filter(h => !h.gone);
    for (const t of this.teeth) { if (t.hurt > 0) t.hurt -= dt; if (t.shield > 0) { t.shield -= dt; if (t.shield <= 0 || (t.shieldBy && !this.hz.some(h => h.id === t.shieldBy))) t.shield = 0; } }

    if (this.doneCount() === this.teeth.length) { this.status = 'win'; this.emit('win'); return; }
    if (this.infCount() === 0) { this.status = 'lose'; this.reason = 'clean'; this.emit('lose'); }
  };

  // 칫솔: 한 구역(이 몇 개)을 쓱쓱. 단계가 오를수록 넓고, 충치 있는 곳을 잘 찾는다.
  G.spawnBrush = function () {
    const cfg = this.cfg, L = this.L;
    let jaw, ci;
    const live = this.teeth.filter(t => t.inf > 0 && !t.done);
    if (live.length && this.rnd() < cfg.brushTarget) { const t = live[Math.floor(this.rnd() * live.length)]; jaw = t.jaw; ci = t.idx; }
    else { jaw = this.rnd() < 0.5 ? 0 : 1; ci = Math.floor(this.rnd() * NT); }
    const z = cfg.brushZone;
    let a = Math.max(0, Math.min(NT - z, ci - Math.floor((z - 1) / 2) - (this.rnd() < 0.5 ? 0 : 1)));
    const ta = this.teeth[jaw * NT + a], tb = this.teeth[jaw * NT + a + z - 1];
    const s0 = ta.s - ta.w / ta.pf / 2 - 8, s1 = tb.s + tb.w / tb.pf / 2 + 8;
    const dir = this.rnd() < 0.5 ? 1 : -1;
    const h = { id: ++this.hid, kind: 'brush', jaw, s0, s1, a, z, dir, s: dir > 0 ? s0 - 30 : s1 + 30, off: 0, st: 'warn', tw: cfg.brushWarn, t: 0,
      cleaned: {}, back: cfg.brushBack, pass: 0, gone: false };
    this.headPos(h);
    this.hz.push(h);
    this.emit('warn', { kind: 'brush', jaw });
    if (!this._brushSaid) { this._brushSaid = true; this.say('brush'); }
  };
  G.headPos = function (h) {
    const P = archAt(this.L, h.jaw, h.s);
    h.x = P.x + P.nx * h.off; h.y = P.y + P.ny * h.off; h.tx = P.tx; h.ty = P.ty; h.nx = P.nx; h.ny = P.ny;
    h.ax = P.x; h.ay = P.y;
  };
  G.spawnFloss = function () {
    const L = this.L;
    // 충치 있는 이 옆 틈을 노린다
    let gs = L.gaps.filter(g => { const A = this.teeth[g.a], B = this.teeth[g.b]; return (A.inf > 0 && !A.done) || (B.inf > 0 && !B.done); });
    if (!gs.length || this.rnd() < 0.3) gs = L.gaps;
    const g = gs[Math.floor(this.rnd() * gs.length)];
    this.hz.push({ id: ++this.hid, kind: 'floss', g, jaw: g.jaw, a: g.a, b: g.b, st: 'warn', tw: this.cfg.flossWarn, t: 0, sweep: 0, cleaned: {}, gone: false });
    this.emit('warn', { kind: 'floss' });
    if (!this._flossSaid) { this._flossSaid = true; this.say('floss'); }
  };
  G.spawnGargle = function () {
    this.hz.push({ id: ++this.hid, kind: 'gargle', st: 'warn', tw: this.cfg.gargleWarn, t: 0, y: this.L.mT - 40, cleaned: {}, gone: false });
    this.emit('warn', { kind: 'gargle' });
    this.say('gargle');
  };
  G.flossZone = function (h) {
    const g = h.g, a = this.lightA, l = 58;
    const sx = Math.cos(a) * l, sy = Math.sin(a) * l * (g.jaw === 1 ? 1 : -1);
    const e = g.d / 2 + 12;
    return { ax: g.x - g.nx * e, ay: g.y - g.ny * e, bx: g.x + g.nx * e, by: g.y + g.ny * e, r1: 13,
      cx: g.x, cy: g.y, dx: g.x + sx, dy: g.y + sy, r2: 22 };
  };

  G.cleanTooth = function (i, amt, h) {
    const t = this.teeth[i];
    if (t.done || t.inf <= 0) return;
    if (t.shield > 0) { this.sneaks++; this.addSugar(1, t.cx, t.cy - 24 * t.dir); this.emit('sneak', { i, x: t.cx, y: t.cy }); return; }
    // 반쯤 먹은 적 있는 이는 뿌리가 남는다(0.1) — 처음 옮은 이만 싹 지워진다
    t.inf = Math.max(t.root ? 0.1 : 0, t.inf - amt * this.cleanMul());
    if (t.inf < 0.5) t.half = false;
    if (t.inf <= 0.015) { t.inf = 0; this.emit('wiped', { i, x: t.cx, y: t.cy }); }
    t.hurt = 0.5;
    this.emit('clean', { i, x: t.cx, y: t.cy });
  };

  G.updHazard = function (h, dt) {
    const cfg = this.cfg, L = this.L;
    h.t += dt;
    if (h.st === 'warn') {
      if (h.t >= h.tw) { h.st = 'go'; h.t = 0; this.emit(h.kind === 'brush' ? 'swish' : h.kind === 'floss' ? 'floss' : 'gargle', { jaw: h.jaw }); }
      return;
    }
    if (h.kind === 'brush') {
      h.s += h.dir * cfg.brushSpeed * dt;
      h.off = 6 * Math.sin(h.t * 16);
      this.headPos(h);
      for (let k = h.a; k < h.a + h.z; k++) {
        const t = this.teeth[h.jaw * NT + k];
        const key = t.i + ':' + h.pass;
        if (!h.cleaned[key] && Math.abs(t.s - h.s) < 8) { h.cleaned[key] = 1; if (h.pass === 0) h.cleaned[t.i] = 1; this.cleanTooth(t.i, cfg.clean * (h.pass ? 0.5 : 1), h); }
      }
      const out = h.dir > 0 ? h.s > h.s1 + 30 : h.s < h.s0 - 30;
      if (out) {
        if (h.back && h.pass === 0) { h.pass = 1; h.dir = -h.dir; }
        else { h.st = 'done'; h.gone = true; }
      }
    } else if (h.kind === 'floss') {
      if (h.st === 'go') {
        h.sweep = Math.min(1, h.t / 0.45);
        for (const i of [h.a, h.b]) if (!h.cleaned[i]) { h.cleaned[i] = 1; this.cleanTooth(i, cfg.flossClean, h); }
        if (h.t > 0.6) { h.st = 'up'; h.t = 0; }
      } else if (h.st === 'up') { if (h.t > 0.3) { h.st = 'done'; h.gone = true; } }
    } else {
      // 가글: 물결이 위에서 아래로 쏴아
      h.y = L.mT - 40 + (L.mB - L.mT + 80) * Math.min(1, h.t / 1.8);
      for (const t of this.teeth) if (!h.cleaned[t.i] && h.y >= t.cy) { h.cleaned[t.i] = 1; this.cleanTooth(t.i, cfg.gargleClean, h); }
      if (h.t > 2.2) { h.st = 'done'; h.gone = true; }
    }
  };

  const api = { W, NT, SQ, STAGES, TECH, layout, archAt, toLocal, Game };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.ChungLogic = api;
})(typeof window !== 'undefined' ? window : this);
