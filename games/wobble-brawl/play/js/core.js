/* Core simulation: verlet ragdoll fighters, platform collisions, combat, items, AI, round flow. */
(function () {
  'use strict';
  var G = window.G, W = G.W, H = G.H;
  var DT = 1 / 120, GRAV = 2100, RUN = 310, JUMP = 790, JUMP2 = 700, R = 14;
  // point indices: 0 head,1 neck,2 hip,3 elbowF,4 handF,5 elbowB,6 handB,7 kneeF,8 footF,9 kneeB,10 footB
  var STICKS = [[0, 1, 14], [1, 2, 31], [1, 3, 18], [3, 4, 18], [1, 5, 18], [5, 6, 18], [2, 7, 21], [7, 8, 21], [2, 9, 21], [9, 10, 21]];
  var PR = [11, 5, 6, 4, 5, 4, 5, 4, 5, 4, 5];
  var MV = {
    jab: { id: 'jab', dur: 0.25, a0: 0.07, a1: 0.15, dmg: 6, kb: 250, ang: 0.25, r: 21, limb: 4 },
    jab2: { id: 'jab', dur: 0.25, a0: 0.07, a1: 0.15, dmg: 6, kb: 250, ang: 0.25, r: 21, limb: 6 },
    upper: { id: 'upper', dur: 0.42, a0: 0.1, a1: 0.22, dmg: 10, kb: 560, ang: 1.15, r: 25, limb: 4, launch: 1 },
    kick: { id: 'kick', dur: 0.44, a0: 0.13, a1: 0.25, dmg: 11, kb: 470, ang: 0.42, r: 25, limb: 8, sfx: 'kick' },
    airkick: { id: 'airkick', dur: 0.4, a0: 0.07, a1: 0.3, dmg: 9, kb: 430, ang: 0.2, r: 25, limb: 8, sfx: 'kick' },
    noodle: { id: 'swing', dur: 0.34, a0: 0.1, a1: 0.22, dmg: 8, kb: 400, ang: 0.4, r: 22, limb: -1, sfx: 'noodle' },
    hammer: { id: 'swing', dur: 0.54, a0: 0.2, a1: 0.33, dmg: 15, kb: 660, ang: 0.75, r: 30, limb: -1, launch: 1, sfx: 'squeak' },
    bash: { id: 'bash', dur: 0.36, a0: 0.08, a1: 0.2, dmg: 6, kb: 520, ang: 0.3, r: 28, limb: 4, sfx: 'clang' },
    thrown: { id: 'thrown', dmg: 7, kb: 380, ang: 0.4 },
    boom: { id: 'boom', dmg: 12, kb: 680, ang: 0.8, launch: 1, unblock: 1, sfx: 'pop' },
    toss: { id: 'toss', dmg: 9 }
  };
  var IT = G.ITEMS = { noodle: { uses: 8, len: 62 }, hammer: { uses: 5, len: 46 }, shield: { uses: 6, len: 0 }, cracker: { uses: 1, len: 0 } };
  var ITYPES = ['noodle', 'hammer', 'shield', 'cracker', 'noodle', 'hammer', 'cracker'];
  var LV = [
    { react: 0.66, aggr: 0.25, err: 0.55, grab: 0.03, dodge: 0, item: 0.2, chase: 0.4, rec: 0.5, kick: 0.07, gap: 0.55 },
    { react: 0.52, aggr: 0.42, err: 0.44, grab: 0.06, dodge: 0.02, item: 0.4, chase: 0.65, rec: 0.68, kick: 0.12, gap: 0.48 },
    { react: 0.12, aggr: 0.92, err: 0.06, grab: 0.2, dodge: 0.35, item: 0.9, chase: 1, rec: 1, kick: 0.24, gap: 0.2 }
  ];
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function sfx(n) { G.audio.sfx(n); }

  /* ---------- collision primitives ---------- */
  var _n = { x: 0, y: 0, pen: 0 };
  function circVsPlat(x, y, r, p) {
    var dx = x - p.cx, dy = y - p.cy, lx = dx, ly = dy, c = 1, s = 0;
    if (p.ang) { c = Math.cos(p.ang); s = Math.sin(p.ang); lx = dx * c + dy * s; ly = -dx * s + dy * c; }
    if (lx < -p.hw - r || lx > p.hw + r || ly < -p.hh - r || ly > p.hh + r) return false;
    var qx = lx < -p.hw ? -p.hw : lx > p.hw ? p.hw : lx, qy = ly < -p.hh ? -p.hh : ly > p.hh ? p.hh : ly;
    var ex = lx - qx, ey = ly - qy, nx, ny, pen;
    if (ex === 0 && ey === 0) {
      var px1 = p.hw - Math.abs(lx), py1 = p.hh - Math.abs(ly);
      if (py1 <= px1) { nx = 0; ny = ly < 0 ? -1 : 1; pen = py1 + r; } else { nx = lx < 0 ? -1 : 1; ny = 0; pen = px1 + r; }
    } else { var d2 = ex * ex + ey * ey; if (d2 >= r * r) return false; var d = Math.sqrt(d2); nx = ex / d; ny = ey / d; pen = r - d; }
    _n.x = nx * c - ny * s; _n.y = nx * s + ny * c; _n.pen = pen; return true;
  }
  function unsafe(p) { return !!p.upd && p.ang !== 0 && Math.abs(Math.sin(p.ang + 0.2)) > 0.4; }
  function flat(p) { return Math.abs(Math.sin(p.ang)) < 0.42; }
  function groundAt(M, x, yFrom) {
    var best = null, ps = M.map.plats;
    for (var i = 0; i < ps.length; i++) {
      var p = ps[i]; if (!flat(p)) continue;
      var ca = Math.cos(p.ang), sa = Math.sin(p.ang), aca = Math.abs(ca);
      if (Math.abs(x - p.cx) > p.hw * aca) continue;
      var top = p.cy + (x - p.cx) * (sa / ca) - p.hh / aca;
      if (top >= yFrom - 6 && (!best || top < best.y)) best = { y: top, p: p };
    }
    return best;
  }
  function nearestPlat(M, x, y, notP) {
    var best = null, bc = 1e9, ps = M.map.plats;
    for (var i = 0; i < ps.length; i++) {
      var p = ps[i]; if (p === notP || !flat(p) || p.hw < 60) continue;
      if (p.ang && Math.abs(Math.sin(p.ang)) > 0.2) continue;
      var e = p.hw - 30, tx = clamp(x, p.cx - e, p.cx + e), top = p.cy - p.hh;
      var cost = Math.abs(tx - x) + Math.max(0, (y - top) - 150) * 4 + (p.bounce ? 0 : 0);
      if (cost < bc) { bc = cost; best = { x: tx, y: top, p: p }; }
    }
    return best;
  }

  /* ---------- particles ---------- */
  function part(M, x, y, vx, vy, life, size, col, kind, g) {
    if (M.parts.length > 260) M.parts.shift();
    M.parts.push({ x: x, y: y, vx: vx, vy: vy, life: life, max: life, size: size, col: col, kind: kind, g: g || 0, rot: Math.random() * 6.28, vr: rnd(-8, 8) });
  }
  function dust(M, x, y, n, sp) { for (var i = 0; i < n; i++) part(M, x + rnd(-8, 8), y - 2, rnd(-1, 1) * (sp || 90), rnd(-70, -10), rnd(0.25, 0.5), rnd(4, 9), 'rgba(255,255,255,0.75)', 0, 0); }
  function stars(M, x, y, n, dir, col) { for (var i = 0; i < n; i++) { var a = rnd(-1.2, 1.2), s = rnd(160, 520); part(M, x, y, Math.cos(a) * s * dir, Math.sin(a) * s - 80, rnd(0.25, 0.55), rnd(5, 10), col || (Math.random() < 0.5 ? '#ffe45c' : '#ffffff'), 1, 900); } }
  function sparks(M, x, y, n, cols) { for (var i = 0; i < n; i++) { var a = rnd(0, 6.28), s = rnd(120, 620); part(M, x, y, Math.cos(a) * s, Math.sin(a) * s, rnd(0.3, 0.9), rnd(3, 6), cols[(Math.random() * cols.length) | 0], 2, 700); } }
  function ring(M, x, y, col) { part(M, x, y, 0, 0, 0.3, 12, col || '#fff', 3, 0); }
  function confetti(M, x, y, n) { var cols = ['#ff6b9d', '#ffd166', '#06d6a0', '#4cc9f0', '#b388ff']; for (var i = 0; i < n; i++) part(M, x + rnd(-40, 40), y, rnd(-260, 260), rnd(-620, -200), rnd(1, 1.8), rnd(5, 9), cols[i % 5], 4, 900); }
  function pop(M, x, y, txt, col, size) { M.pops.push({ x: x, y: y, txt: txt, t: 0, rot: rnd(-0.25, 0.25), col: col || '#ffe45c', size: size || 40 }); if (M.pops.length > 6) M.pops.shift(); }
  G.fxConfetti = confetti;

  /* ---------- fighter ---------- */
  function mkFighter(i, cfg) {
    var f = { i: i, name: cfg.name, skin: cfg.skin, hat: cfg.hat, src: cfg.src || [], ai: cfg.ai != null ? { lvl: cfg.ai, cd: 0.4, t: 0, goalX: null, jcd: 0, retreat: 0, stuck: 0, wantItem: false, itemT: 0, idle: 0 } : null, human: !!cfg.human, pts: [], tg: new Float32Array(22), trail: [] };
    for (var k = 0; k < 11; k++) f.pts.push({ x: 0, y: 0, px: 0, py: 0 });
    f.ft = [{ x: 0, sx: 0, tx: 0, t: 1, dur: 0.15, lift: 0, h: 8, thr: 16, j: 0 }, { x: 0, sx: 0, tx: 0, t: 1, dur: 0.15, lift: 0, h: 8, thr: 16, j: 0 }];
    f.inp = { mx: 0, down: false, up: false }; f.buf = { jump: 0, atk: 0, kick: 0, grab: 0 };
    return f;
  }
  function resetFighter(M, f, x, y, face) {
    f.x = x; f.y = y; f.vx = 0; f.vy = 0; f.face = face; f.ground = null; f.wasG = true; f.gp = null; f.coyote = 0; f.jumps = 0; f.prevY = y;
    f.hp = 100; f.hpShow = 100; f.state = 'free'; f.st = 0; f.mv = null; f.didHit = false; f.combo = 0; f.comboT = 0; f.k = 1; f.inv = 0; f.flash = 0;
    f.weapon = null; f.holding = null; f.heldBy = null; f.out = false; f.grabCd = 0; f.pickCd = 0; f.animT = Math.random() * 3; f.runPh = 0; f.wAng = -1.15; f.wAngW = 0;
    f.sw = 0; f.swv = 0; f.pvx = 0; f.hb = 2; f.hbv = 0; f.feetOn = false; f.swPh = Math.random() * 6; f.ragMin = 0; f.ragGround = false; f.thud = 0; f.stunT = 0; f.lastHitBy = -1; f.lastHitT = -9; f.trail.length = 0; f.jumpCut = false; f.gone = false;
    f.buf.jump = f.buf.atk = f.buf.kick = f.buf.grab = 0;
    if (f.ai) { f.ai.goalX = null; f.ai.cd = rnd(0.2, 0.5); f.ai.retreat = 0; }
    pose(f); for (var k = 0; k < 11; k++) { var p = f.pts[k]; p.x = p.px = f.tg[k * 2]; p.y = p.py = f.tg[k * 2 + 1]; }
  }
  var _ik = [0, 0];
  function ik(ax, ay, bx, by, l1, l2, bend) {
    var dx = bx - ax, dy = by - ay, d = Math.sqrt(dx * dx + dy * dy), m = l1 + l2 - 0.05;
    if (d > m) { dx *= m / d; dy *= m / d; d = m; } if (d < 0.01) { d = 0.01; dx = 0.01; dy = 0; }
    var a = (l1 * l1 - l2 * l2 + d * d) / (2 * d), h = Math.sqrt(Math.max(0, l1 * l1 - a * a));
    _ik[0] = ax + dx * a / d - dy / d * h * bend; _ik[1] = ay + dy * a / d + dx / d * h * bend;
    return [ax + dx, ay + dy];
  }
  function ext(st, m) { var e = st < m.a0 ? st / m.a0 : st < m.a1 ? 1 : 1 - (st - m.a1) / (m.dur - m.a1); e = clamp(e, 0, 1); return e * e * (3 - 2 * e); }
  function pose(f) {
    var t = f.animT, st = f.st, s = f.state, air = !f.ground && f.coyote <= 0, tg = f.tg, fc = f.face;
    var hx = 0, hy = -40, lean = 3, hFx = 16, hFy = -58, hBx = 8, hBy = -52, fFx = 9, fFy = 0, fBx = -9, fBy = 0, wa = -1.15, e;
    if (f.weapon) { if (f.weapon.type === 'shield') { hFx = 22; hFy = -56; wa = 0; } else { hFx = 15; hFy = -50; } }
    if (s === 'win') {
      var b = Math.abs(Math.sin(t * 7)); hy = -40 - b * 12; fFy = -b * 9; fBy = -b * 9; hFx = 15; hFy = -96 + Math.sin(t * 14) * 6; hBx = -15; hBy = -96 - Math.sin(t * 14) * 6; lean = 0;
    } else if (s === 'atk') {
      var m = f.mv; e = ext(st, m);
      if (m.id === 'jab') { if (m.limb === 6) { hBx = lerp(8, 41, e); hBy = lerp(-52, -61, e); } else { hFx = lerp(16, 41, e); hFy = lerp(-58, -61, e); } lean = 3 + e * 9; hx = e * 5; fFx = 9 + e * 6; }
      else if (m.id === 'upper') { hFx = lerp(12, 27, e); hFy = lerp(-38, -98, e); hy = -34 - e * 12; lean = 4 + e * 4; fFy = -e * 6; fBy = -e * 6; }
      else if (m.id === 'kick') { fFx = lerp(9, 45, e); fFy = lerp(0, -47, e); lean = 3 - e * 15; hx = -e * 3; hFx = 4; hFy = -60; hBx = -14; hBy = -50; }
      else if (m.id === 'airkick') { fFx = lerp(8, 38, e); fFy = lerp(-6, -12, e); fBx = -12; fBy = -18; lean = -5 * e; hFx = -4; hFy = -76; hBx = -16; hBy = -66; }
      else if (m.id === 'swing') {
        var th = st < m.a0 ? lerp(-1.15, -2.4, st / m.a0) : st < m.a1 ? lerp(-2.4, 0.6, (st - m.a0) / (m.a1 - m.a0)) : lerp(0.6, -1.15, Math.pow((st - m.a1) / (m.dur - m.a1), 2));
        hFx = 3 + Math.cos(th) * 25; hFy = -66 + Math.sin(th) * 25; wa = th; lean = 5 + (th + 1) * 4; hx = e * 4;
      } else if (m.id === 'bash') { hFx = lerp(22, 42, e); hFy = -56; lean = 3 + e * 10; hx = e * 8; wa = 0; }
      if (air && m.id !== 'airkick') { fFx = 8; fFy = -8; fBx = -9; fBy = -4; }
    } else if (s === 'grab') {
      if (f.holding) { hFx = 25; hFy = -72; hBx = 21; hBy = -64; lean = -3; }
      else { e = Math.sin(Math.min(1, st / 0.26) * Math.PI); hFx = 16 + e * 23; hFy = -60; hBx = 10 + e * 23; hBy = -52; lean = 3 + e * 9; }
    } else if (air) {
      if (f.vy < 0) { fFx = 10; fFy = -13; fBx = -8; fBy = -3; if (!f.weapon) { hFx = 14; hFy = -82; } hBx = -12; hBy = -76; lean = 5; }
      else { var fl = Math.sin(t * 22) * 5; fFx = 7; fFy = -3; fBx = -11; fBy = -10; if (!f.weapon) { hFx = 18; hFy = -78 + fl; } hBx = -16; hBy = -78 - fl; lean = 2; }
    } else {
      var sp = Math.abs(f.vx);
      if (sp > 45) {
        var sn = Math.sin(f.runPh), cs = Math.cos(f.runPh), bk = f.vx * fc < 0 ? -1 : 1;
        hy = -38 - Math.abs(cs) * 2.5; lean = 9 * bk; fFx = sn * 18; fFy = -Math.max(0, cs * bk) * 11; fBx = -sn * 18; fBy = -Math.max(0, -cs * bk) * 11;
        if (!f.weapon) { hFx = -sn * 15 + 7; hFy = -52; } hBx = sn * 15 + 3; hBy = -52;
      } else { var bob = Math.sin(t * 5) * 1.5; hy = -39 + bob; hFy += bob; hBy += bob; }
      if (s === 'getup') { var g = 1 - Math.min(1, st / 0.46); hy += g * 20; lean += g * 12; }
      if (s === 'stun') { lean = -9; hFx = 3; hFy = -72; hBx = -11; hBy = -66; }
    }
    if (s !== 'win') { var sw = f.sw * fc, asw = Math.abs(f.sw); lean += sw * 0.75; hx += sw * 0.6;
      if (s !== 'atk' && s !== 'grab' && asw > 9) { var fl2 = (asw - 9) * 0.9, wv = Math.sin(t * 17) * fl2 * 0.5; hFy -= fl2 + wv; hBy -= fl2 - wv; hFx -= sw * 0.5; hBx -= sw * 0.7; } }
    // feet are planted in the world; the hip hangs between them, so shifting weight bends the knees
    if (f.feetOn && f.ground && s !== 'win') {
      var kf = s === 'atk' && f.mv && f.mv.id === 'kick', F0 = f.ft[0], F1 = f.ft[1];
      if (!kf) { fFx = (F0.x - f.x) * fc; fFy = -F0.lift; } fBx = (F1.x - f.x) * fc; fBy = -F1.lift;
      var d0 = kf ? 0 : Math.abs(fFx - hx) * (F0.t < 1 ? 0.55 : 1), d1 = Math.abs(fBx - hx) * (F1.t < 1 ? 0.55 : 1), dm = d0 > d1 ? d0 : d1;
      var reach = Math.sqrt(Math.max(324, 1681 - dm * dm)), hb = f.hb < -3 ? -3 : f.hb > 13 ? 13 : f.hb;
      hy = -reach + 1 + hb + (hy + 40) + (s === 'stun' ? 5 : 0); if (hy > -17) hy = -17;
    }
    var nx = hx + lean, ny = hy - 31, r;
    tg[0] = nx + lean * 0.35 + 1.5; tg[1] = ny - 14; tg[2] = nx; tg[3] = ny; tg[4] = hx; tg[5] = hy;
    r = ik(nx, ny, hFx, hFy, 18, 18, 1); tg[6] = _ik[0]; tg[7] = _ik[1]; tg[8] = r[0]; tg[9] = r[1];
    r = ik(nx, ny, hBx, hBy, 18, 18, 1); tg[10] = _ik[0]; tg[11] = _ik[1]; tg[12] = r[0]; tg[13] = r[1];
    r = ik(hx, hy, fFx, fFy, 21, 21, -1); tg[14] = _ik[0]; tg[15] = _ik[1]; tg[16] = r[0]; tg[17] = r[1];
    r = ik(hx, hy, fBx, fBy, 21, 21, -1); tg[18] = _ik[0]; tg[19] = _ik[1]; tg[20] = r[0]; tg[21] = r[1];
    for (var i = 0; i < 22; i += 2) { tg[i] = f.x + tg[i] * fc; tg[i + 1] = f.y + tg[i + 1]; }
    f.wAng = wa; f.wAngW = fc > 0 ? wa : Math.PI - wa;
  }
  // per-point spring: [stiffness, damping, how much of the root motion it follows]. Upper body is loose and trails behind.
  var SPK = [0.045, 0.075, 0.34, 0.045, 0.034, 0.045, 0.034, 0.10, 0.12, 0.10, 0.12];
  var SPD = [0.945, 0.92, 0.6, 0.93, 0.94, 0.93, 0.94, 0.82, 0.74, 0.82, 0.74];
  var SPC = [0.35, 0.5, 0.82, 0.42, 0.36, 0.42, 0.36, 0.5, 0.12, 0.5, 0.12];
  var CHAIN = [[2, 1, 31], [1, 0, 14], [1, 3, 18], [3, 4, 18], [1, 5, 18], [5, 6, 18], [2, 7, 21], [7, 8, 21], [2, 9, 21], [9, 10, 21]];
  function springPts(f, dxr, dyr) {
    var k = f.k, tg = f.tg, pts = f.pts, i, p, atk = f.state === 'atk' || f.state === 'grab', lim = f.mv ? f.mv.limb : -9;
    for (i = 0; i < 11; i++) {
      p = pts[i]; var c = SPC[i]; p.x += dxr * c; p.px += dxr * c; p.y += dyr * c; p.py += dyr * c;
      var st = SPK[i] * k, d = SPD[i];
      if (atk && i > 2) { if (i === lim || i === lim - 1 || (lim < 0 && (i === 3 || i === 4)) || f.state === 'grab') { st = 0.5 * k; d = 0.45; } }
      var vx = (p.x - p.px) * d, vy = (p.y - p.py) * d;
      p.px = p.x; p.py = p.y; p.x += vx + (tg[i * 2] - p.x) * st; p.y += vy + (tg[i * 2 + 1] - p.y) * st + (1 - k) * GRAV * DT * DT;
    }
    for (i = 0; i < CHAIN.length; i++) { var a = pts[CHAIN[i][0]], b = pts[CHAIN[i][1]], dx = b.x - a.x, dy = b.y - a.y, dd = Math.sqrt(dx * dx + dy * dy) || 0.001, q = CHAIN[i][2] / dd; b.x = a.x + dx * q; b.y = a.y + dy * q; }
    if (f.ground) { if (pts[8].y > f.y + 1) pts[8].y = f.y + 1; if (pts[10].y > f.y + 1) pts[10].y = f.y + 1; }
    if (k < 0.99) solveSticks(f, 2);
  }
  /* procedural stepping: a foot stays where it was put down; when the balance point drifts too far from it, that foot takes a (sloppy) step */
  function stepFeet(f, dt, cdx) {
    var ft = f.ft, i, a, sp = Math.abs(f.vx), fc = f.face;
    if (!f.feetOn) { for (i = 0; i < 2; i++) { a = ft[i]; a.x = f.x + (i ? -9 : 9) * fc + f.vx * 0.03; a.t = 1; a.lift = 0; a.j = 0; a.thr = 16; } f.feetOn = true; }
    var B = f.x + f.sw * 1.15 + f.vx * 0.07, hipX = f.x + f.sw * 0.6, dur = 0.2 - Math.min(1, sp / 310) * 0.09;
    for (i = 0; i < 2; i++) {
      a = ft[i]; a.x += cdx;
      if (a.t < 1) {
        a.sx += cdx; a.tx += cdx; a.t += dt / a.dur;
        if (a.t >= 1) { a.t = 1; a.x = a.tx; a.lift = 0; f.hbv += 26 + sp * 0.06; }
        else { var u = a.t, e = u * u * (3 - 2 * u); a.x = a.sx + (a.tx - a.sx) * e; a.lift = Math.sin(Math.PI * u) * a.h; }
      }
    }
    var best = -1, be = 0, bo = 0;
    for (i = 0; i < 2; i++) {
      a = ft[i]; if (a.t < 1) continue;
      var off = (i ? -9 : 9) * fc, err = B + off + a.j - a.x, ae = Math.abs(err), o = ft[1 - i];
      if (ae > a.thr && (o.t >= 1 || o.t > 0.6 || ae > 44) && ae > be) { best = i; be = ae; bo = off; }
    }
    if (best >= 0) {
      a = ft[best]; var lead = f.vx * dur * 0.8; if (lead > 26) lead = 26; else if (lead < -26) lead = -26;
      var tx = B + bo + a.j + lead + (B + bo - a.x > 0 ? 1 : -1) * Math.min(12, be * 0.3) + rnd(-7, 7);
      if (tx > hipX + 23 + lead * 0.4) tx = hipX + 23 + lead * 0.4; else if (tx < hipX - 23 + lead * 0.4) tx = hipX - 23 + lead * 0.4;
      a.sx = a.x; a.tx = tx; a.t = 0; a.dur = dur * rnd(0.8, 1.3); a.h = 6 + sp * 0.02 + rnd(0, 6) + Math.abs(f.sw) * 0.25;
      a.thr = rnd(12, 24); a.j = Math.random() < 0.14 ? -bo * 1.7 : rnd(-7, 7);
    }
    for (i = 0; i < 2; i++) { a = ft[i]; var dx = a.x - hipX; if (dx > 28) a.x = hipX + 28; else if (dx < -28) a.x = hipX - 28; }
  }

  function solveSticks(f, n, pin) {
    var pts = f.pts;
    for (var it = 0; it < n; it++) {
      for (var j = 0; j < STICKS.length; j++) {
        var s = STICKS[j], a = pts[s[0]], b = pts[s[1]], dx = b.x - a.x, dy = b.y - a.y, d = Math.sqrt(dx * dx + dy * dy) || 0.001, df = (d - s[2]) / d * 0.5;
        a.x += dx * df; a.y += dy * df; b.x -= dx * df; b.y -= dy * df;
      }
      var h = pts[0], hp = pts[2], ddx = hp.x - h.x, ddy = hp.y - h.y, dd = Math.sqrt(ddx * ddx + ddy * ddy) || 0.001;
      if (dd < 40) { var q = (dd - 40) / dd * 0.5; h.x += ddx * q; h.y += ddy * q; hp.x -= ddx * q; hp.y -= ddy * q; }
      if (pin) { pts[1].x = pin.x; pts[1].y = pin.y; }
    }
  }
  function handPos(f) { return { x: f.tg[8], y: f.tg[9] }; }

  function dropWeapon(M, f, vx, vy) {
    if (!f.weapon) return; var h = handPos(f);
    M.items.push({ type: f.weapon.type, uses: f.weapon.uses, x: h.x, y: h.y - 6, vx: vx, vy: vy, ang: f.wAngW, spin: rnd(-8, 8), state: 'drop', owner: null, t: 0, life: 9 });
    f.weapon = null;
  }
  function useWeapon(M, f) {
    if (!f.weapon) return; f.weapon.uses--;
    if (f.weapon.uses <= 0) { var h = handPos(f); sparks(M, h.x, h.y, 10, ['#fff', '#ffd166', '#ddd']); sfx('break'); f.weapon = null; }
  }
  function release(M, g) { if (g && g.holding) { g.holding.heldBy = null; g.holding = null; } }
  function toRagdoll(M, f, vx, vy, minT) {
    if (f.heldBy) { f.heldBy.holding = null; f.heldBy.state = 'free'; f.heldBy.st = 0; f.heldBy = null; }
    if (f.holding) { var v = f.holding; f.holding = null; v.heldBy = null; if (v.state === 'held') { v.state = 'rag'; v.st = 0; v.ragMin = 0.4; } }
    dropWeapon(M, f, vx * 0.3 + rnd(-80, 80), -300);
    f.state = f.hp <= 0 ? 'dead' : 'rag'; f.st = 0; f.ragMin = minT || 0.7; f.ragGround = false; f.mv = null; f.trail.length = 0; f.ground = null; f.gp = null;
    for (var i = 0; i < 11; i++) { var p = f.pts[i], up = i === 0 ? 1.25 : i >= 7 ? 0.8 : 1; p.px = p.x - (vx * up + rnd(-70, 70)) * DT; p.py = p.y - (vy + rnd(-70, 70)) * DT; }
  }
  function applyHit(M, att, vic, mv, hx, hy, dir) {
    if (vic.inv > 0 || vic.out || vic.state === 'dead' || M.phase !== 'fight') return false;
    if (vic.weapon && vic.weapon.type === 'shield' && !mv.unblock && (vic.state === 'free' || vic.state === 'atk') && vic.face === -dir) {
      vic.hp = Math.max(1, vic.hp - Math.ceil(mv.dmg * 0.2)); vic.vx += dir * 170; useWeapon(M, vic); sfx('clang');
      sparks(M, hx, hy, 8, ['#fff', '#cfe8ff']); M.hitstop = Math.max(M.hitstop, 0.05); M.shake = Math.max(M.shake, 4); M.fx.push({ x: hx, y: hy, t: 0, big: 0 });
      if (att) { att.vx -= dir * 120; } return true;
    }
    var dm = mv.dmg; if (M.mode === 'cpu' && att && att !== vic) dm *= att.i === 1 ? (M.cfg.cpuDmg || 1) : (M.cfg.plDmg || 1);
    vic.hp = Math.max(0, vic.hp - dm);
    var kb = mv.kb * (0.5 + 1.4 * (1 - vic.hp / 100)) * (M.mode === 'cpu' && att && att !== vic ? (att.i === 1 ? (M.cfg.cpuKb || 1) : (M.cfg.plKb || 1)) : 1), vx = dir * kb * Math.cos(mv.ang), vy = -kb * Math.sin(mv.ang);
    var launch = mv.launch || kb > 500 || vic.hp <= 0 || vic.state === 'rag' || vic.state === 'held' || (!vic.ground && kb > 330);
    if (vic.hp <= 0) { vx *= 1.5; vy = vy * 1.3 - 280; }
    if (launch) toRagdoll(M, vic, vx, vy, 0.26 + (1 - vic.hp / 100) * 0.85 + (mv.launch ? 0.08 : 0));
    else { vic.state = 'stun'; vic.st = 0; vic.mv = null; vic.stunT = 0.15 + mv.dmg * 0.014; vic.vx = vx; if (vy < vic.vy) vic.vy = vy * 0.6; vic.pts[0].px -= dir * 5; vic.pts[4].px -= dir * 6; vic.pts[6].px -= dir * 6; vic.swv += dir * (60 + kb * 0.4); vic.hbv += 170 + mv.dmg * 10; release(M, vic); }
    vic.flash = 0.1; vic.lastHitBy = att ? att.i : -1; vic.lastHitT = M.time; M.lastHitFrame = M.ringN;
    var big = launch || mv.dmg >= 10;
    M.hitstop = Math.max(M.hitstop, vic.hp <= 0 ? 0.2 : big ? 0.11 : 0.055); M.shake = Math.max(M.shake, vic.hp <= 0 ? 20 : big ? 13 : 5);
    M.fx.push({ x: hx, y: hy, t: 0, big: big ? 1 : 0 }); stars(M, hx, hy, big ? 10 : 5, dir); if (big) { ring(M, hx, hy, '#fff'); var w = G.t('pow'); pop(M, hx, hy - 30, w[(Math.random() * w.length) | 0], '#ffe45c', vic.hp <= 0 ? 60 : 42); }
    sfx(mv.sfx || (big ? 'heavy' : 'punch')); if (big && mv.sfx && mv.sfx !== 'pop') sfx('heavy');
    if (att && att !== vic) { att.didHit = true; att.comboT = 0.6; M.stat(att, 'hits', 1); }
    return true;
  }
  function explode(M, it) {
    sfx('pop'); M.shake = Math.max(M.shake, 16); M.hitstop = Math.max(M.hitstop, 0.07);
    sparks(M, it.x, it.y, 46, ['#ff6b9d', '#ffd166', '#06d6a0', '#4cc9f0', '#fff']); ring(M, it.x, it.y, '#ffd166'); pop(M, it.x, it.y - 40, G.lang === 'ko' ? '펑!' : 'BANG!', '#ff9d5c', 54);
    for (var i = 0; i < 2; i++) {
      var f = M.f[i], dx = f.pts[2].x - it.x, dy = f.pts[2].y - 20 - it.y, d = Math.sqrt(dx * dx + dy * dy);
      if (d < 135) { var att = it.owner != null ? M.f[it.owner] : null; applyHit(M, att === f ? null : att, f, MV.boom, f.pts[1].x, f.pts[1].y, dx >= 0 ? 1 : -1); }
    }
  }

  /* ---------- fighter step ---------- */
  function startAtk(M, f, mv) { f.state = 'atk'; f.st = 0; f.mv = mv; f.didHit = false; f.hitDone = false; f.trail.length = 0; sfx('whoosh'); }
  function hitScan(M, f) {
    var m = f.mv, o = M.f[1 - f.i], hx, hy, n = 1, k, j;
    if (o.inv > 0 || o.out || o.state === 'dead' || o.heldBy === f) return;
    var xs = [], ys = [];
    if (m.limb >= 0) { xs.push(f.tg[m.limb * 2]); ys.push(f.tg[m.limb * 2 + 1]); xs.push((f.tg[m.limb * 2] + f.tg[2]) / 2); ys.push((f.tg[m.limb * 2 + 1] + f.tg[3]) / 2); }
    else { var L = IT[f.weapon ? f.weapon.type : 'noodle'].len, ca = Math.cos(f.wAngW), sa = Math.sin(f.wAngW); for (k = 1; k <= 3; k++) { xs.push(f.tg[8] + ca * L * k / 3); ys.push(f.tg[9] + sa * L * k / 3); } }
    for (k = 0; k < xs.length; k++) {
      for (j = 0; j < 4; j++) {
        var px = j < 3 ? o.pts[j].x : (o.pts[1].x + o.pts[2].x) / 2, py = j < 3 ? o.pts[j].y : (o.pts[1].y + o.pts[2].y) / 2;
        var dx = px - xs[k], dy = py - ys[k], rr = m.r + (j === 0 ? 11 : 8);
        if (dx * dx + dy * dy < rr * rr) {
          f.hitDone = true;
          var dir = f.face;
          if (applyHit(M, f, o, m, (px + xs[k]) / 2, (py + ys[k]) / 2, dir) && m.limb < 0) useWeapon(M, f);
          if (m.id === 'bash') useWeapon(M, f);
          return;
        }
      }
    }
  }
  function collideFighter(M, f) {
    var ps = M.map.plats; f.ground = null;
    for (var i = 0; i < ps.length; i++) {
      var p = ps[i];
      if (p.thin) { if (f.vy - p.vy < -1) continue; if (f.prevY > p.cy - p.hh + 7 + Math.abs(p.vy) * DT * 2) continue; }
      if (!circVsPlat(f.x, f.y - R, R, p)) continue;
      if (p.thin && _n.y > -0.5) continue;
      f.x += _n.x * _n.pen; f.y += _n.y * _n.pen;
      var vn = f.vx * _n.x + f.vy * _n.y;
      if (vn < 0) {
        if (p.bounce && _n.y < -0.7 && f.vy > 60) {
          f.vy = -(f.inp.up || f.vy > 700 ? p.bounce : p.bounce * 0.66); p.sq = 1; f.jumps = 1; f.jumpCut = true; sfx('boing'); dust(M, f.x, f.y, 4, 120); continue;
        }
        f.vx -= vn * _n.x; f.vy -= vn * _n.y;
      }
      if (_n.y < -0.75) f.ground = p;
    }
  }
  function stepFighter(M, f) {
    var dt = DT, o = M.f[1 - f.i], inp = f.inp, b = f.buf, s;
    f.st += dt; f.animT += dt; if (f.inv > 0) f.inv -= dt; if (f.flash > 0) f.flash -= dt; if (f.grabCd > 0) f.grabCd -= dt; if (f.pickCd > 0) f.pickCd -= dt; if (f.thud > 0) f.thud -= dt;
    if (f.comboT > 0) { f.comboT -= dt; if (f.comboT <= 0) f.combo = 0; }
    b.jump -= dt; b.atk -= dt; b.kick -= dt; b.grab -= dt;
    if (f.out) return;
    s = f.state;
    if (s === 'rag' || s === 'dead' || s === 'held') { stepRag(M, f); return; }
    if (s === 'stun' && f.st >= f.stunT) { f.state = s = 'free'; f.st = 0; }
    if (s === 'getup') { f.k = Math.min(1, 0.15 + f.st / 0.5); if (f.st >= 0.46) { f.state = s = 'free'; f.k = 1; f.swv += rnd(-70, 70); } } else if (s === 'stun') f.k = 0.3; else f.k = 1;
    if (s === 'atk') {
      var m = f.mv;
      if (!f.hitDone && f.st >= m.a0 && f.st <= m.a1) { hitScan(M, f); var li = m.limb >= 0 ? m.limb : 4; if (m.limb < 0 && f.weapon) { var L = IT[f.weapon.type].len; f.trail.push(f.tg[8] + Math.cos(f.wAngW) * L, f.tg[9] + Math.sin(f.wAngW) * L); } else f.trail.push(f.tg[li * 2], f.tg[li * 2 + 1]); if (f.trail.length > 14) f.trail.splice(0, 2); }
      else if (f.trail.length && (M.sub & 1)) f.trail.splice(0, 2);
      if (f.state === 'atk' && f.st >= m.dur) { f.state = s = 'free'; f.st = 0; f.mv = null; }
      s = f.state;
    } else if (f.trail.length) f.trail.length = 0;
    if (s === 'grab') {
      if (f.holding) {
        if (f.st >= 0.3) doThrow(M, f);
      } else {
        if (f.st > 0.07 && f.st < 0.2 && o.inv <= 0 && !o.out && (o.state === 'free' || o.state === 'atk' || o.state === 'stun' || o.state === 'getup' || o.state === 'grab') && !o.holding) {
          var gx = (o.x - f.x) * f.face, gy = Math.abs(o.y - f.y);
          if (gx > -8 && gx < 56 && gy < 48) { f.holding = o; o.heldBy = f; o.state = 'held'; o.st = 0; o.mv = null; dropWeapon(M, o, f.face * 120, -260); f.st = 0; sfx('grab'); M.hitstop = Math.max(M.hitstop, 0.05); for (var q = 0; q < 11; q++) { o.pts[q].px = o.pts[q].x; o.pts[q].py = o.pts[q].y; } }
        }
        if (f.st >= 0.4) { f.state = 'free'; f.st = 0; }
      }
      s = f.state;
    }
    var canAct = s === 'free' && !f.lock;
    if (canAct) {
      if (inp.mx) f.face = inp.mx > 0 ? 1 : -1;
      if (b.grab > 0) {
        b.grab = 0;
        if (f.weapon) throwWeapon(M, f);
        else if (f.grabCd <= 0) { f.state = 'grab'; f.st = 0; f.grabCd = 0.7; sfx('whoosh'); }
      } else if (b.atk > 0 || b.kick > 0) {
        var kick = b.kick > 0 || inp.down; b.atk = 0; b.kick = 0;
        if (f.weapon) {
          var wt = f.weapon.type;
          if (wt === 'cracker') throwWeapon(M, f); else startAtk(M, f, wt === 'shield' ? MV.bash : MV[wt]);
          if (f.ground) f.vx += f.face * 90;
        } else if (!f.ground && f.coyote <= 0) startAtk(M, f, MV.airkick);
        else if (kick) { startAtk(M, f, MV.kick); f.vx += f.face * 80; f.combo = 0; }
        else { if (f.combo >= 2) { startAtk(M, f, MV.upper); f.combo = 0; f.comboT = 0; } else { startAtk(M, f, f.combo === 1 ? MV.jab2 : MV.jab); f.combo++; f.comboT = 0.6; } f.vx += f.face * 130; }
      }
    }
    // jump (allowed while attacking in air too)
    if (b.jump > 0 && !f.lock && (s === 'free' || ((s === 'atk' || s === 'getup') && !f.ground))) {
      if (f.ground || f.coyote > 0) { f.swv += rnd(-45, 45); f.vy = -JUMP; f.jumps = 1; f.coyote = 0; f.ground = null; f.gp = null; b.jump = 0; f.jumpCut = false; sfx('jump'); dust(M, f.x, f.y, 4); }
      else if (f.jumps < 2) { f.vy = -JUMP2; f.jumps++; b.jump = 0; f.jumpCut = true; sfx('djump'); ring(M, f.x, f.y, 'rgba(255,255,255,0.8)'); }
    }
    if (!f.jumpCut && f.vy < -200 && !inp.up) { f.vy *= 0.55; f.jumpCut = true; }
    // horizontal control
    var want = (s === 'free' && !f.lock) ? inp.mx * (f.weapon && f.weapon.type === 'hammer' ? RUN * 0.85 : RUN) : 0;
    if (s === 'atk') want = f.ground ? 0 : inp.mx * RUN * 0.7;
    var fr = f.gp ? f.gp.fric : 1, acc = f.gp ? 3800 * fr : 1900;
    if (s === 'stun') acc = f.gp ? 1400 * fr : 300; else if (Math.abs(f.sw) > 20 && f.gp) { acc *= 0.45; want *= 0.6; }
    if (s === 'atk' && f.gp) acc = 1700 * fr;
    if (f.vx < want) f.vx = Math.min(want, f.vx + acc * dt); else if (f.vx > want) f.vx = Math.max(want, f.vx - acc * dt);
    if (!f.gp && M.map.wind) f.vx += M.map.wind * dt;
    f.vy = Math.min(1500, f.vy + GRAV * dt);
    var ox = f.x, oy = f.y; f.prevY = f.y;
    var cdx = 0; if (f.gp) { var gp = f.gp; cdx = (gp.vx - gp.w * (f.y - gp.cy)) * dt; f.x += cdx; f.y += (gp.vy + gp.w * (f.x - gp.cx)) * dt; }
    f.x += f.vx * dt; f.y += f.vy * dt;
    var vyIn = f.vy; collideFighter(M, f);
    if (f.ground) {
      if (!f.gp && vyIn > 260) { sfx('land'); dust(M, f.x, f.y, vyIn > 700 ? 7 : 4); f.swv += f.vx * 0.16 + rnd(-1, 1) * Math.min(90, vyIn * 0.08); f.hbv += Math.min(280, vyIn * 0.24); }
      f.coyote = 0.09; f.jumps = 0; f.jumpCut = false;
      f.runPh += Math.abs(f.vx) * dt * 0.058;
    } else if (f.coyote > 0) f.coyote -= dt;
    f.gp = f.ground;
    if (f.holding) { f.vx *= 0.8; }
    // balance: the torso sways like an inverted pendulum; too much sway = topple over
    var dvx = f.vx - f.pvx; f.pvx = f.vx; if (dvx > 40) dvx = 40; else if (dvx < -40) dvx = -40; f.swv -= dvx * 0.38; if (f.ground) f.swv += Math.sin(f.runPh) * 2500 * dt * Math.min(1, Math.abs(f.vx) / 310);
    var idle = 1 - Math.min(1, Math.abs(f.vx) / 200), drift = (Math.sin(f.animT * 1.9 + f.swPh) * 9 + Math.sin(f.animT * 0.83 + f.swPh * 2) * 7) * (0.35 + 0.65 * idle);
    f.swv += (-(f.sw - drift) * 34 - f.swv * 1.6) * dt + (Math.random() - 0.5) * 1.6; f.sw += f.swv * dt;
    f.hbv += (-(f.hb - (2.5 + Math.cos(f.animT * 1.9 + f.swPh) * 3 * idle)) * 70 - f.hbv * 5.5) * dt; f.hb += f.hbv * dt;
    if (f.ground) stepFeet(f, dt, cdx); else if (f.coyote <= 0) f.feetOn = false;
    var lim = M.time - f.lastHitT < 1.3 ? 46 : 29; if (f.sw > lim) { f.sw = lim; if (f.swv > 0) f.swv *= 0.5; } else if (f.sw < -lim) { f.sw = -lim; if (f.swv < 0) f.swv *= 0.5; }
    if (Math.abs(f.sw) > 37 && G.debug && G.debug.auto) G.debug.trips = (G.debug.trips || 0) + (f.ground && M.time - f.lastHitT < 1.3 ? 1 : 0);
    if (Math.abs(f.sw) > 37 && f.ground && M.time - f.lastHitT < 1.3 && f.state !== 'grab' && f.state !== 'win' && !f.lock && M.phase === 'fight') { var td = f.sw > 0 ? 1 : -1; toRagdoll(M, f, f.vx * 0.5 + td * 170, -150, 0.5); sfx('whoosh'); return; }
    pose(f); springPts(f, f.x - ox, f.y - oy);
  }
  function throwWeapon(M, f) {
    var w = f.weapon, h = handPos(f), cr = w.type === 'cracker';
    M.items.push({ type: w.type, uses: w.uses, x: h.x + f.face * 8, y: h.y - 6, vx: f.face * (cr ? 640 : 800) + f.vx * 0.4, vy: cr ? -300 : -170, ang: f.wAngW, spin: f.face * 16, state: 'thrown', owner: f.i, t: 0, life: 9 });
    f.weapon = null; f.pickCd = 0.6; f.state = 'atk'; f.mv = MV.jab; f.st = 0.06; f.hitDone = true; sfx('throw');
  }
  function doThrow(M, f) {
    var v = f.holding, inp = f.inp, sc = (0.62 + 1.05 * (1 - v.hp / 100)) * (M.mode === 'cpu' ? (f.i === 1 ? (M.cfg.cpuKb || 1) : (M.cfg.plKb || 1)) : 1), vx, vy, dir = f.face;
    if (inp.mx && (inp.mx > 0 ? 1 : -1) !== f.face) { dir = -f.face; f.face = dir; vx = dir * 640; vy = -400; }
    else if (inp.up) { vx = dir * 170; vy = -860; } else { vx = dir * 660; vy = -380; }
    f.holding = null; v.heldBy = null; v.hp = Math.max(0, v.hp - MV.toss.dmg);
    toRagdoll(M, v, vx * sc, vy * sc, 0.3 + (1 - v.hp / 100) * 0.8); v.inv = 0; v.lastHitBy = f.i; v.lastHitT = M.time; M.lastHitFrame = M.ringN; v.flash = 0.1;
    f.state = 'atk'; f.mv = MV.jab; f.st = 0.08; f.hitDone = true;
    M.hitstop = Math.max(M.hitstop, 0.09); M.shake = Math.max(M.shake, 10); sfx('throw'); stars(M, v.pts[1].x, v.pts[1].y, 8, dir); M.stat(f, 'throws', 1);
  }
  function stepRag(M, f) {
    var pts = f.pts, i, p, held = f.state === 'held', pin = null, ps = M.map.plats, wind = M.map.wind * DT * DT;
    if (held) {
      var g = f.heldBy; if (!g || g.holding !== f) { f.state = 'rag'; f.st = 0; f.ragMin = 0.3; held = false; }
      else pin = { x: (g.tg[8] + g.tg[12]) / 2 + g.face * 6, y: (g.tg[9] + g.tg[13]) / 2 };
    }
    for (i = 0; i < 11; i++) { p = pts[i]; var vx = (p.x - p.px) * 0.999, vy = (p.y - p.py) * 0.999; p.px = p.x; p.py = p.y; p.x += vx + wind; p.y += vy + GRAV * DT * DT; }
    f.ragGround = false;
    solveSticks(f, 4, pin);
    for (i = 0; i < 11; i++) {
      p = pts[i]; var r = PR[i];
      for (var j = 0; j < ps.length; j++) {
        var pl = ps[j];
        if (pl.thin) { if (p.py > pl.cy - pl.hh + 2 || p.y < p.py) continue; }
        if (!circVsPlat(p.x, p.y, r, pl)) continue;
        if (pl.thin && _n.y > -0.5) continue;
        var vx2 = p.x - p.px, vy2 = p.y - p.py;
        p.x += _n.x * _n.pen; p.y += _n.y * _n.pen;
        var pvx = (pl.vx - pl.w * (p.y - pl.cy)) * DT, pvy = (pl.vy + pl.w * (p.x - pl.cx)) * DT;
        vx2 -= pvx; vy2 -= pvy;
        var vn = vx2 * _n.x + vy2 * _n.y;
        if (vn < 0) {
          var e = pl.bounce ? 0.92 : 0.22;
          if (pl.bounce && vn < -2) { pl.sq = 1; if (f.thud <= 0) { sfx('boing'); f.thud = 0.25; } }
          else if (vn < -7 && f.thud <= 0 && i < 3) { sfx('land'); dust(M, p.x, p.y + r, 5, 140); f.thud = 0.25; if (vn < -11) M.shake = Math.max(M.shake, 5); }
          vx2 -= (1 + e) * vn * _n.x; vy2 -= (1 + e) * vn * _n.y;
          var tx = -_n.y, ty = _n.x, vt = vx2 * tx + vy2 * ty, fk = 0.1 * pl.fric; vx2 -= vt * fk * tx; vy2 -= vt * fk * ty;
        }
        vx2 += pvx; vy2 += pvy; p.px = p.x - vx2; p.py = p.y - vy2;
        if (_n.y < -0.5) f.ragGround = true;
      }
    }
    if (pin) { pts[1].x = pin.x; pts[1].y = pin.y; }
    var hp = pts[2]; f.x = hp.x; f.y = hp.y + 40; f.vx = (hp.x - hp.px) / DT; f.vy = (hp.y - hp.py) / DT;
    if (f.state === 'rag' && !f.lockRag) {
      var sp = Math.abs(f.vx) + Math.abs(f.vy);
      if ((f.st > f.ragMin && ((f.ragGround && sp < 260) || (!f.ragGround && f.st > f.ragMin + 0.12))) || f.st > f.ragMin + 1.5) {
        f.state = 'getup'; f.st = 0; f.k = 0; f.sw = 0; f.swv = 0; f.pvx = f.vx; f.inv = 0.6; f.y = hp.y + (f.ragGround ? 10 : 40); f.prevY = f.y - 30; f.vx *= 0.4; f.vy = f.ragGround ? 0 : Math.min(f.vy, 300); f.jumps = 0; f.jumpCut = true; f.ground = null; f.gp = null; f.coyote = 0;
        if (pts[0].x !== hp.x) f.face = (M.f[1 - f.i].x > f.x) ? 1 : -1;
      }
    }
  }

  /* ---------- items ---------- */
  function stepItems(M) {
    var ps = M.map.plats, i, j, k;
    for (i = M.items.length - 1; i >= 0; i--) {
      var it = M.items[i]; it.t += DT;
      var py = it.y; it.vy += GRAV * 0.85 * DT; it.x += it.vx * DT; it.y += it.vy * DT; it.ang += it.spin * DT; if (M.map.wind && it.state !== 'ground') it.vx += M.map.wind * 0.3 * DT;
      var hitPlat = false;
      for (j = 0; j < ps.length; j++) {
        var p = ps[j]; if (p.thin && (it.vy < 0 || py > p.cy - p.hh + 2)) continue;
        if (!circVsPlat(it.x, it.y, 9, p)) continue; if (p.thin && _n.y > -0.5) continue;
        it.x += _n.x * _n.pen; it.y += _n.y * _n.pen; hitPlat = true;
        var vn = it.vx * _n.x + (it.vy - p.vy) * _n.y;
        if (vn < 0) { var e = p.bounce ? 0.9 : 0.3; it.vx -= (1 + e) * vn * _n.x; it.vy -= (1 + e) * vn * _n.y; }
        if (_n.y < -0.6) { it.x += (p.vx - p.w * (it.y - p.cy)) * DT; it.vx *= (1 - 0.06 * p.fric); it.spin *= 0.9; if (Math.abs(it.vy) < 90 && !p.bounce) { it.vy = 0; if (it.state === 'drop') it.state = 'ground'; if (it.state === 'ground') { it.spin = 0; it.ang *= 0.9; } } }
      }
      if (it.state === 'thrown') {
        if (hitPlat) { if (it.type === 'cracker') { explode(M, it); M.items.splice(i, 1); continue; } it.state = 'drop'; it.vx *= 0.5; }
        else for (k = 0; k < 2; k++) {
          var f = M.f[k]; if (f.out || (k === it.owner && it.t < 0.35) || f.inv > 0 || f.state === 'dead') continue;
          var dx = f.pts[1].x - it.x, dy = (f.pts[1].y + f.pts[2].y) / 2 - it.y;
          if (dx * dx + dy * dy < 30 * 30 || Math.pow(f.pts[0].x - it.x, 2) + Math.pow(f.pts[0].y - it.y, 2) < 22 * 22) {
            if (it.type === 'cracker') { explode(M, it); M.items.splice(i, 1); it = null; break; }
            applyHit(M, it.owner != null ? M.f[it.owner] : null, f, MV.thrown, it.x, it.y, it.vx >= 0 ? 1 : -1);
            it.state = 'drop'; it.vx *= -0.3; it.vy = -260; it.uses--; if (it.uses <= 0) { sparks(M, it.x, it.y, 8, ['#fff', '#ffd166']); M.items.splice(i, 1); it = null; } break;
          }
        }
        if (!it) continue;
      } else if (it.t > 0.25) {
        for (k = 0; k < 2; k++) {
          var g = M.f[k]; if (g.weapon || g.pickCd > 0 || g.out || g.lock || !(g.state === 'free' || g.state === 'atk')) continue;
          var ddx = g.x - it.x, ddy = g.y - 30 - it.y;
          if (ddx * ddx + ddy * ddy < 44 * 44) { g.weapon = { type: it.type, uses: it.uses }; M.items.splice(i, 1); sfx('pickup'); ring(M, it.x, it.y, '#9bf6ff'); M.stat(g, 'items', 1); it = null; break; }
        }
        if (!it) continue;
        if (it.state === 'ground') { it.life -= DT; if (it.life <= 0) { dust(M, it.x, it.y, 5); M.items.splice(i, 1); continue; } }
      }
      if (it.y > H + 120 || it.x < -200 || it.x > W + 200) M.items.splice(i, 1);
    }
    if (M.phase === 'fight') {
      M.itemT -= DT;
      if (M.itemT <= 0) {
        M.itemT = rnd(5.5, 8);
        if (M.items.length < 2) { var xs = M.map.items, x = xs[(Math.random() * xs.length) | 0] + rnd(-20, 20), ty = ITYPES[(Math.random() * ITYPES.length) | 0]; M.items.push({ type: ty, uses: IT[ty].uses, x: x, y: -30, vx: 0, vy: 120, ang: rnd(-1, 1), spin: rnd(-3, 3), state: 'drop', owner: null, t: 0, life: 12 }); sfx('spawn'); }
      }
    }
  }

  /* ---------- AI ---------- */
  function think(M, f, dt) {
    var ai = f.ai, L = ai.L || LV[ai.lvl], o = M.f[1 - f.i], inp = f.inp, b = f.buf;
    inp.mx = 0; inp.down = false; inp.up = false;
    var s = f.state; if (s === 'rag' || s === 'held' || s === 'dead' || s === 'win' || f.out || f.lock) return;
    ai.cd -= dt; ai.jcd -= dt; ai.itemT -= dt; if (ai.retreat > 0) ai.retreat -= dt; if (ai.idle > 0) ai.idle -= dt;
    var dxo = o.x - f.x, adxo = Math.abs(dxo), dyo = o.y - f.y, odir = dxo >= 0 ? 1 : -1;
    var oOn = !o.out && o.y < 700 && (o.ground || groundAt(M, o.x, o.y - 60));
    var hit = o.inv <= 0 && o.state !== 'held' && o.state !== 'dead' && !o.out;
    if (!f.ground && f.coyote <= 0) {
      inp.up = true;
      var gb = groundAt(M, f.x, f.y - 10), tgt = null, hd = 0;
      if (ai.goalX != null) { if (Math.abs(ai.goalX - f.x) > 14) inp.mx = ai.goalX > f.x ? 1 : -1; var gg = groundAt(M, ai.goalX, f.y - 200); tgt = gg ? gg.y : null; if (gb && Math.abs(ai.goalX - f.x) < 40) ai.goalX = null; }
      else if (!gb || (gb.p.ang && !flat(gb.p))) { var np = nearestPlat(M, f.x, f.y, null); if (np) { hd = Math.abs(np.x - f.x); if (hd > 10) inp.mx = np.x > f.x ? 1 : -1; tgt = np.y; } }
      else if (f.vy > -200 && (function () { var dy = gb.y - f.y, tf = dy > 0 ? (-f.vy + Math.sqrt(f.vy * f.vy + 2 * GRAV * dy)) / GRAV : 0, lx = f.x + f.vx * tf; return !groundAt(M, lx, f.y - 10) || Math.abs(lx - gb.p.cx) > gb.p.hw * Math.abs(Math.cos(gb.p.ang)) - 16; })()) { inp.mx = gb.p.cx > f.x ? 1 : -1; }
      else if (oOn && adxo > 40 && ai.retreat <= 0) { var ah = groundAt(M, f.x + odir * 50, f.y - 40) || groundAt(M, f.x + odir * 120, f.y - 40); if (ah) inp.mx = odir; else if (f.vx * odir > 60) inp.mx = -odir; }
      if (f.vy > 40 && f.jumps < 2 && Math.random() < L.rec) {
        if ((!gb && (tgt == null || f.y > tgt - 40 || hd > 90)) || f.y > 640) b.jump = 0.1;
      }
      if (hit && adxo < 62 && Math.abs(dyo) < 64 && ai.cd <= 0 && s === 'free') { f.face = odir; b.atk = 0.1; ai.cd = L.react + 0.25; }
      return;
    }
    ai.goalX = null;
    if (ai.idle > 0) return;
    var gp = f.ground;
    // unsafe footing (tilting bar): leave for a stable platform
    if (gp && unsafe(gp)) {
      var sp = nearestPlat(M, f.x, f.y, gp);
      if (sp) { inp.mx = sp.x > f.x ? 1 : -1; ai.goalX = sp.x; if (ai.jcd <= 0 && (Math.abs(sp.x - f.x) < 400 || Math.abs(Math.sin(gp.ang)) > 0.45)) { b.jump = 0.1; inp.up = true; ai.jcd = 0.3; } return; }
    }
    // pick target
    var tx = o.x, ty = o.y, isOpp = true;
    if (ai.itemT <= 0) { ai.itemT = 1.2; ai.wantItem = Math.random() < L.item; }
    if (!f.weapon && ai.wantItem && M.items.length) {
      var bi = null, bd = 1e9; for (var i = 0; i < M.items.length; i++) { var it = M.items[i]; if (it.state === 'thrown' || it.y < 0) continue; var d = Math.abs(it.x - f.x) + Math.abs(it.y - f.y) * 1.5; if (d < bd && groundAt(M, it.x, it.y - 30)) { bd = d; bi = it; } }
      if (bi && bd < adxo * 1.6 + 120) { tx = bi.x; ty = bi.y + 20; isOpp = false; }
    }
    if (isOpp && !oOn) { var home = nearestPlat(M, f.x, f.y, null); tx = home ? home.p.cx : 640; ty = f.y; isOpp = false; if (Math.abs(tx - f.x) < 60) return; }
    var cr = f.weapon && f.weapon.type === 'cracker';
    if (isOpp && (ai.retreat > 0 || (cr && adxo < 130))) { tx = f.x - odir * 200; isOpp = false; }
    var dx = tx - f.x, adx = Math.abs(dx), dir = dx >= 0 ? 1 : -1;
    var range = f.weapon ? (f.weapon.type === 'noodle' ? 74 : f.weapon.type === 'hammer' ? 60 : 46) : 46;
    var close = isOpp && adx < range - 8 && Math.abs(dyo) < 50;
    if (!close && adx > 8) {
      inp.mx = dir;
      var brake = gp && f.vx * dir > 0 ? (f.vx * f.vx) / (7600 * gp.fric) : 0;
      var ahead = groundAt(M, f.x + dir * 34, f.y - 30); if (ahead && brake > 30) ahead = groundAt(M, f.x + dir * (34 + brake), f.y - 30);
      if (!ahead || ahead.y > f.y + 150) {
        var land = 0, ds = [90, 140, 190, 240, 290];
        for (var q = 0; q < ds.length; q++) { var g2 = groundAt(M, f.x + dir * ds[q], f.y - 190); if (g2 && g2.y < f.y + 240 && !(g2.p.upd && g2.p.ang !== 0 && Math.abs(Math.sin(g2.p.ang + 0.3)) > 0.3)) { land = ds[q]; break; } }
        if (land && adx > 50 && ai.jcd <= 0 && Math.random() < L.chase) { b.jump = 0.1; inp.up = true; ai.goalX = f.x + dir * (land + 34); ai.jcd = 0.4; }
        else { inp.mx = f.vx * dir > 70 ? -dir : 0; if (!land || ai.jcd <= 0) ai.jcd = 0.25; }
      } else if (ty < f.y - 60 && adx < 180 && ai.jcd <= 0) { b.jump = 0.1; inp.up = true; ai.jcd = 0.55; }
      if (inp.mx && Math.abs(f.vx) < 25) { ai.stuck += dt; if (ai.stuck > 0.18 && ai.jcd <= 0) { b.jump = 0.1; inp.up = true; ai.jcd = 0.4; ai.stuck = 0; } } else ai.stuck = 0;
    } else if (isOpp && s === 'free') f.face = odir;
    if (!hit || s !== 'free') return;
    if (cr) { if (adxo > 110 && adxo < 430 && Math.abs(dyo) < 100 && ai.cd <= 0) { f.face = odir; b.atk = 0.1; ai.cd = 0.5; } return; }
    if (o.state === 'atk' && o.st < 0.08 && adxo < 84 && Math.random() < L.dodge * dt * 28) { b.jump = 0.1; inp.up = true; inp.mx = -odir; ai.retreat = 0.25; return; }
    if (adxo < range && Math.abs(dyo) < 48 && ai.cd <= 0) {
      f.face = odir;
      if (Math.random() < L.err) { ai.cd = rnd(0.2, 0.5); if (ai.lvl === 0 && Math.random() < 0.3) ai.idle = rnd(0.2, 0.5); return; }
      var r = Math.random();
      if (!f.weapon && o.state !== 'rag' && adxo < 50 && f.grabCd <= 0 && r < L.grab) { b.grab = 0.1; ai.cd = 0.55; }
      else if (!f.weapon && r < L.grab + L.kick + (o.hp < 45 ? L.kick : 0)) { b.kick = 0.1; ai.cd = L.react + 0.5; }
      else { b.atk = 0.1; ai.cd = f.combo > 0 ? L.gap + L.react * 0.5 : L.react * rnd(0.8, 1.5) + 0.16; if (f.combo >= 2 && ai.lvl < 2) ai.cd += 0.35; }
      if (Math.random() < (1 - L.aggr) * 0.5) { ai.retreat = rnd(0.4, 0.9); if (ai.lvl === 0) ai.idle = rnd(0.2, 0.5); }
    }
  }

  /* ---------- match ---------- */
  G.newMatch = function (cfg) {
    var M = { cfg: cfg, mode: cfg.mode, demo: cfg.mode === 'demo', map: G.maps.build(cfg.map, cfg.pxScale), f: [], items: [], parts: [], pops: [], fx: [], ring: [],
      t: 0, time: 0, frame: 0, sub: 0, acc: 0, round: 1, score: [0, 0], phase: 'intro', pt: 0, timer: 30, hitstop: 0, slow: 1, shake: 0, shx: 0, shy: 0,
      cam: { x: W / 2, y: H / 2, z: 1 }, itemT: 4, lastHitFrame: -999, ringN: 0, ringAcc: 0, koKind: '', roundWinner: -1, winner: -1, rp: 0, rp0: 0, rp1: 0, draws: 0, beeped: 0,
      stats: [{ hits: 0, throws: 0, outs: 0, items: 0, rounds: 0 }, { hits: 0, throws: 0, outs: 0, items: 0, rounds: 0 }], ended: false };
    M.stat = function (f, k, n) { M.stats[f.i][k] += n; };
    M.f.push(mkFighter(0, cfg.p[0])); M.f.push(mkFighter(1, cfg.p[1]));
    if (cfg.mercy) M.f.forEach(function (f) { if (f.ai && !cfg.p[f.i].noMercy) { var b = LV[f.ai.lvl], L = {}; for (var k in b) L[k] = b[k]; L.react *= 1.5; L.err = Math.min(0.7, L.err + 0.2); L.aggr *= 0.7; L.gap += 0.2; L.grab *= 0.5; f.ai.L = L; } });
    startRound(M);
    return M;
  };
  function startRound(M) {
    M.items.length = 0; M.parts.length = 0; M.pops.length = 0; M.fx.length = 0; M.ring.length = 0; M.ringN = 0; M.phase = 'intro'; M.pt = 0; M.timer = 30; M.slow = 1; M.hitstop = 0; M.itemT = rnd(3, 5); M.lastHitFrame = -999; M.beeped = 0; M.roundWinner = -1; M.koKind = '';
    for (var i = 0; i < 2; i++) { var sp = M.map.spawns[i], f = M.f[i]; resetFighter(M, f, sp[0], sp[1] - 2, i === 0 ? 1 : -1); f.lock = true; }
    G.gameEvent('round', M);
  }
  function endRound(M, w, kind) {
    M.phase = 'ko'; M.pt = 0; M.koKind = kind; M.roundWinner = w;
    if (G.debug && G.debug.auto) (G.debug.rounds = G.debug.rounds || []).push(kind + ':' + (30 - M.timer).toFixed(0));
    for (var i = 0; i < 2; i++) { var f = M.f[i]; f.lock = true; f.inp.mx = 0; }
    if (kind === 'ko' || kind === 'out') { M.slow = 0.2; sfx(kind === 'ko' ? 'ko' : 'out'); M.shake = Math.max(M.shake, 16); }
    else sfx('go');
    if (w >= 0) { M.score[w]++; M.stats[w].rounds++; if (kind === 'out') M.stats[w].outs++; } else M.draws++;
    G.gameEvent('ko', M);
  }
  function checkEnd(M) {
    var a = M.f[0], b = M.f[1], la = a.out || a.hp <= 0, lb = b.out || b.hp <= 0;
    if (la || lb) { var kind = ((la && a.out) || (lb && b.out)) ? 'out' : 'ko'; endRound(M, la && lb ? -1 : la ? 1 : 0, la && lb ? 'draw' : kind); return; }
    if (M.timer <= 0) { var w = a.hp === b.hp ? -1 : a.hp > b.hp ? 0 : 1; endRound(M, w, w < 0 ? 'draw' : 'time'); }
  }
  function snapshot(M) {
    var s = { t: M.t, f: [], it: [], fx: [] }, i;
    for (i = 0; i < 2; i++) {
      var f = M.f[i], p = new Float32Array(22); for (var k = 0; k < 11; k++) { p[k * 2] = f.pts[k].x; p[k * 2 + 1] = f.pts[k].y; }
      var eyes = f.state === 'dead' ? 2 : (f.state === 'rag' || f.state === 'stun' || f.state === 'held') ? 1 : f.state === 'win' ? 3 : f.state === 'atk' || f.state === 'grab' ? 4 : 0;
      s.f.push({ p: p, face: f.face, eyes: eyes, wp: f.weapon ? f.weapon.type : null, wa: f.wAngW, skin: f.skin, hat: f.hat, flash: f.flash > 0, blink: f.inv > 0 && f.state !== 'rag', gone: f.gone, tr: f.trail.length > 3 ? f.trail.slice() : null, i: i });
    }
    for (i = 0; i < M.items.length; i++) { var it = M.items[i]; s.it.push({ type: it.type, x: it.x, y: it.y, ang: it.ang, lit: it.state === 'thrown', blink: it.state === 'ground' && it.life < 2.5 }); }
    for (i = 0; i < M.fx.length; i++) s.fx.push({ x: M.fx[i].x, y: M.fx[i].y, t: M.fx[i].t, big: M.fx[i].big });
    return s;
  }
  G.snapshot = snapshot;

  G.stepMatch = function (M, dt) {
    var i, f, demo = M.demo;
    M.pt += dt; M.frame++;
    // phase flow
    if (M.phase === 'intro') {
      var io = (M.cfg.tut && M.round === 1 && !M.draws) ? 3 : 0; M.io = io; if (io && M.skipTut) { M.pt = Math.max(M.pt, io); M.skipTut = false; }
      if (M.beeped === 0 && M.pt > 0.05 + io) { M.beeped = 1; sfx('beep'); }
      if (M.beeped === 1 && M.pt > (demo ? 0.5 : 0.95) + io) { M.beeped = 2; sfx('go'); }
      if (M.pt > (demo ? 0.6 : 1.25) + io) { M.phase = 'fight'; M.pt = 0; M.f[0].lock = M.f[1].lock = false; G.gameEvent('fight', M); }
    } else if (M.phase === 'ko') {
      var big = M.koKind === 'ko' || M.koKind === 'out';
      if (big) M.slow = M.pt < 0.5 ? 0.22 : 1;
      if (M.pt > (big ? 0.9 : 0.9)) {
        M.slow = 1;
        var n = M.ring.length;
        if (big && !demo && n > 30) {
          var back = M.ringN - M.lastHitFrame + 10; if (back > 80 || back < 34) back = 40; back = Math.min(n - 1, back);
          M.rp0 = n - 1 - back; M.rp1 = Math.min(n - 1, M.rp0 + 40); M.rp = M.rp0; M.phase = 'replay'; M.pt = 0;
        } else { M.phase = 'post'; M.pt = 0; postStart(M); }
      }
    } else if (M.phase === 'replay') {
      M.rp += dt * 60 * 0.6;
      if (M.rp >= M.rp1 || M.skipReplay) { M.skipReplay = false; M.phase = 'post'; M.pt = 0; G.maps.setTime(M.map, M.t, 0); postStart(M); }
      return;
    } else if (M.phase === 'post') {
      if (M.pt > (demo ? 1.1 : 1.5)) {
        if (M.score[0] >= 2 || M.score[1] >= 2) { M.phase = 'end'; M.pt = 0; M.winner = M.score[0] >= 2 ? 0 : 1; M.ended = true; G.gameEvent('end', M); }
        else { if (M.roundWinner >= 0) M.round++; startRound(M); }
      }
    }
    // inputs
    for (i = 0; i < 2; i++) { f = M.f[i]; if (f.ai) think(M, f, dt); else G.readInput(f); }
    // time
    var sdt;
    if (M.hitstop > 0) { M.hitstop -= dt; sdt = 0; } else sdt = dt * M.slow;
    if (M.phase === 'fight' && sdt > 0) { M.timer -= sdt; if (!demo && M.timer < 5.02 && Math.ceil(M.timer) !== M.lastBeep) { M.lastBeep = Math.ceil(M.timer); if (M.timer > 0) sfx('beep'); } }
    M.acc += sdt; var guard = 0;
    while (M.acc >= DT && guard++ < 8) {
      M.acc -= DT; M.sub++; M.t += DT; M.time += DT;
      G.maps.setTime(M.map, M.t, DT);
      if (M.sub & 1) { stepFighter(M, M.f[0]); stepFighter(M, M.f[1]); } else { stepFighter(M, M.f[1]); stepFighter(M, M.f[0]); }
      stepItems(M);
      for (i = 0; i < 2; i++) {
        f = M.f[i];
        if (!f.out && (f.pts[2].y > H + 90 || f.x < -190 || f.x > W + 190)) {
          f.out = true; if (G.debug && G.debug.auto && M.phase === 'fight') (G.debug.outs = G.debug.outs || []).push([M.map.id, f.i, Math.round(f.x), +(30 - M.timer).toFixed(1), f.state, +(M.time - f.lastHitT).toFixed(1), f.ai && f.ai.goalX != null ? Math.round(f.ai.goalX) : null, Math.round(f.hp)].join(' '));
          if (f.holding) release(M, f); if (f.heldBy) { f.heldBy.holding = null; f.heldBy = null; }
          var ex = clamp(f.x, 30, W - 30), ey = clamp(f.pts[2].y, 40, H - 10);
          sparks(M, ex, ey, 26, ['#fff', '#ffe45c', '#9bf6ff']); ring(M, ex, ey, '#fff'); M.shake = Math.max(M.shake, 14);
          if (M.phase !== 'fight') f.gone = true;
        }
      }
      if (M.phase === 'fight') checkEnd(M);
    }
    if (guard >= 8) M.acc = 0;
    // fx timers (real-time scaled by slow so they freeze during hit-stop)
    var ps = M.map.plats; for (i = 0; i < ps.length; i++) if (ps[i].sq > 0) ps[i].sq = Math.max(0, ps[i].sq - dt * 5);
    for (i = M.fx.length - 1; i >= 0; i--) { M.fx[i].t += dt; if (M.fx[i].t > 0.16) M.fx.splice(i, 1); }
    for (i = M.parts.length - 1; i >= 0; i--) { var p = M.parts[i]; p.life -= sdt; if (p.life <= 0) { M.parts.splice(i, 1); continue; } p.vy += p.g * sdt; p.x += p.vx * sdt; p.y += p.vy * sdt; p.rot += p.vr * sdt; if (p.kind === 0) { p.vx *= 0.94; p.size += sdt * 14; } }
    for (i = M.pops.length - 1; i >= 0; i--) { M.pops[i].t += dt; if (M.pops[i].t > 0.7) M.pops.splice(i, 1); }
    for (i = 0; i < 2; i++) { f = M.f[i]; f.hpShow += (f.hp - f.hpShow) * Math.min(1, dt * 4); if (f.out) f.gone = true; }
    if (M.shake > 0) { M.shx = rnd(-1, 1) * M.shake; M.shy = rnd(-1, 1) * M.shake; M.shake = Math.max(0, M.shake - dt * 60); if (M.shake < 0.4) M.shake = 0; } else { M.shx = M.shy = 0; }
    // camera
    var a = M.f[0], b = M.f[1], cx, cy, z;
    var ax = clamp(a.pts[2].x, 60, W - 60), bx = clamp(b.pts[2].x, 60, W - 60), ay = clamp(a.pts[2].y, 80, 640), by = clamp(b.pts[2].y, 80, 640);
    if (M.phase === 'ko' && M.roundWinner >= 0 && (M.koKind === 'ko' || M.koKind === 'out')) { var l = M.roundWinner === 0 ? b : a; cx = clamp(l.pts[2].x, 60, W - 60); cy = clamp(l.pts[2].y, 80, 640) - 20; z = 1.42; }
    else { cx = (ax + bx) / 2; cy = (ay + by) / 2 - 50; var dist = Math.max(Math.abs(ax - bx), Math.abs(ay - by) * 1.9); z = clamp(1.45 - dist / 760, 1, 1.22); cy = Math.max(cy, 300); if (demo) z = Math.min(z, 1.12); }
    var c = M.cam, kz = Math.min(1, dt * (M.phase === 'ko' ? 7 : 2.6));
    c.z += (z - c.z) * kz; c.x += (cx - c.x) * kz; c.y += (cy - c.y) * kz;
    if (M.phase === 'fight' || M.phase === 'ko') { M.ringAcc += sdt; if (M.ringAcc >= 1 / 60) { M.ringAcc = 0; M.ringN++; M.ring.push(snapshot(M)); if (M.ring.length > 150) M.ring.shift(); } }
  };
  function postStart(M) {
    var w = M.roundWinner;
    if (w >= 0) { var f = M.f[w]; if (!f.out && f.state !== 'rag' && f.state !== 'held' && f.state !== 'dead') { f.state = 'win'; f.st = 0; f.mv = null; } confetti(M, clamp(f.x, 80, W - 80), clamp(f.y - 120, 60, 600), 26); }
    G.gameEvent('post', M);
  }
  G.DT = DT;
  G.posePts = function (x, y, kind, t) {
    if (!_pf) _pf = mkFighter(0, { name: '' }); var f = _pf; resetFighter(null, f, x, y, 1); f.animT = t; f.ground = {}; f.coyote = 1;
    if (kind === 'move') { f.vx = 300; f.runPh = t * 14; }
    else if (kind === 'jump') { f.ground = null; f.coyote = 0; f.vy = -300; f.y = y - 14 - Math.abs(Math.sin(t * 4)) * 14; }
    else { var u = (t * 1.6) % 1; f.state = kind === 'grab' ? 'grab' : 'atk'; f.mv = kind === 'kick' ? MV.kick : MV.jab; var hold = u < 0.25 ? u / 0.25 : u < 0.8 ? 1 : 1 - (u - 0.8) / 0.2; f.st = kind === 'grab' ? hold * 0.13 : hold * (f.mv.a0 + 0.02); }
    pose(f); return f.tg;
  };
  var _pf = null;
  G.idlePts = function (x, y, t) { if (!_pf) _pf = mkFighter(0, { name: '' }); resetFighter(null, _pf, x, y, 1); _pf.animT = t || 0; _pf.ground = {}; pose(_pf); return _pf.tg; };
})();
