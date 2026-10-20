/* 흐물 피구 — simulation (no DOM): Wobble skeleton with spring pose (from 흐물 다리 sim.js) + verlet ragdoll on hit,
   one dodgeball, rules (out / catch / outfield / back in), AI, and the special shots. Fixed 1/120 s steps. */
(function () {
  'use strict';
  var G = window.G;
  var W = 1280, H = 720, DT = 1 / 120, ZPX = 270, FY0 = 392, CX = 640, BL = 130, BR = 1150, GRAV = 2100, GB = 950;
  var ROUND_T = 90;
  G.W = W; G.H = H; G.DT = DT; G.ZPX = ZPX; G.CX = CX; G.BL = BL; G.BR = BR; G.ROUND_T = ROUND_T;
  function FY(z) { return FY0 + z * ZPX; } G.FY = FY;
  function scz(z) { return 0.8 + 0.28 * z; } G.scz = scz;
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function sgn(v) { return v < 0 ? -1 : 1; }
  function tri(s) { return 2 / Math.PI * Math.asin(Math.sin(Math.PI * s)); }
  G.clamp = clamp; G.lerp = lerp; G.rnd = rnd;
  function T(k) { return G.t(k); }

  /* ---------- skeleton (Wobble Brawl point layout, SC = 1) ---------- */
  // 0 head,1 neck,2 hip,3 elbowF,4 handF,5 elbowB,6 handB,7 kneeF,8 footF,9 kneeB,10 footB
  var STAT = G.STAT = { thr: 0, hit: 0, cat: 0, dTry: 0, cTry: 0, dOk: 0, jump: 0, side: 0, late: 0 };
  var ST = [[0, 1, 14], [1, 2, 31], [1, 3, 18], [3, 4, 18], [1, 5, 18], [5, 6, 18], [2, 7, 21], [7, 8, 21], [2, 9, 21], [9, 10, 21]];
  var CHAIN = [[2, 1, 31], [1, 0, 14], [1, 3, 18], [3, 4, 18], [1, 5, 18], [5, 6, 18], [2, 7, 21], [7, 8, 21], [2, 9, 21], [9, 10, 21]];
  var PR = [11, 5, 6, 4, 5, 4, 5, 4, 5, 4, 5];
  var SPK = [0.045, 0.075, 0.34, 0.06, 0.05, 0.06, 0.05, 0.10, 0.12, 0.10, 0.12];
  var SPD = [0.945, 0.92, 0.6, 0.92, 0.93, 0.92, 0.93, 0.82, 0.74, 0.82, 0.74];
  var SPC = [0.35, 0.5, 0.82, 0.42, 0.36, 0.42, 0.36, 0.5, 0.12, 0.5, 0.12];
  var BODY_H = 100;

  /* ---------- teams ---------- */
  G.TEAMS = [
    { key: 't0', skins: ['#ff8fd0', '#ffb3e1', '#ff70b8'], hats: ['party', 'party', 'halo'], uni: '#ff4fa3', L: 0 },
    { key: 't1', skins: ['#ff9d5c', '#ffb37a', '#f07c3a'], hats: ['cap', 'band', 'cap'], uni: '#e8692b', L: 1 },
    { key: 't2', skins: ['#ffe14d', '#fff08a', '#ffd23f'], hats: ['cone', 'band', 'prop'], uni: '#f4b400', L: 2 },
    { key: 't3', skins: ['#aab4c3', '#c9d1dc', '#8f9aab'], hats: ['chef', 'top', 'chef'], uni: '#5b6b80', L: 3 },
    { key: 't4', skins: ['#a77bff', '#c3a3ff', '#8a5cf0'], hats: ['crown', 'top', 'crown'], uni: '#6a3fd1', L: 4 }
  ];
  G.MYTEAM = { key: 'my', skins: ['#3fa9ff', '#8ee53f', '#4cd9c0'], hats: ['cap', 'band', 'prop'], uni: '#2a7fd4' };
  G.FRIEND = { key: 'pGuest', skins: ['#ff9d5c', '#ffb37a', '#f07c3a'], hats: ['cap', 'band', 'cap'], uni: '#e8692b', L: 2 };
  G.SPECIALS = ['banana', 'fart', 'chicken', 'giant', 'clone', 'slow', 'boomer', 'zigzag', 'ghost', 'flip', 'sneeze', 'bouncy'];

  function params(L) {
    return { hold: 2.3 - 0.22 * L, catchP: 0.1 + 0.045 * L, dodgeP: 0.6 + 0.05 * L, react: 0.3 - 0.03 * L, err: 0.2 - 0.035 * L,
      pow: 0.35 + 0.14 * L, passP: 0.15 + 0.04 * L, spd: 0.86 + 0.045 * L };
  }

  /* ---------- bodies ---------- */
  function mkBody(M, team, i, skin, hat) {
    var b = { id: team * M.n + i, team: team, i: i, skin: skin, hat: hat, pts: [], tg: new Float32Array(22), x: 0, z: 0.5, h: 0, vh: 0, vx: 0, vz: 0,
      face: team ? -1 : 1, mode: 'stand', role: 'in', pendingOut: false, hold: false, charge: 0, charging: false, throwT: 0, catchT: 0, catchCD: 0,
      animT: i * 0.7, runPh: 0, ragT: 0, eyes: 0, sc: 1, rsc: 1, rx: 0, ry: 0, spd: 0, noPick: 0, flipping: false, sad: false, cheer: false, flash: 0, dest: null,
      ai: { t: 0, tx: 0, tz: 0.5, holdT: null, dec: -1, dodgeT: 0, dodgeZ: 0 } };
    for (var k = 0; k < 11; k++) b.pts.push({ x: 0, y: 0, px: 0, py: 0 });
    return b;
  }
  function place(b, x, z) {
    b.x = x; b.z = z; b.h = 0; b.vh = 0; b.vx = 0; b.vz = 0; b.mode = 'stand'; b.role = 'in'; b.pendingOut = false; b.hold = false; b.charging = false;
    b.charge = 0; b.throwT = 0; b.catchT = 0; b.catchCD = 0; b.eyes = 0; b.flipping = false; b.sad = false; b.cheer = false; b.flash = 0; b.dest = null; b.noPick = 0;
    b.face = b.team ? -1 : 1; b.ai.holdT = null; b.ai.t = rnd(0.2, 0.8); b.ai.dec = -1; b.ai.dodgeT = 0;
    b.sc = scz(z); b.rx = x; b.ry = FY(z); pose(b);
    for (var k = 0; k < 11; k++) { var p = b.pts[k]; p.x = p.px = b.tg[k * 2]; p.y = p.py = b.tg[k * 2 + 1]; }
  }
  function zoneOf(b) {
    var r = b.role;
    if (r === 'in') return b.team ? [CX + 14, 1240] : [40, CX - 14];
    if (r === 'out') return b.team ? [25, BL - 12] : [BR + 12, 1255];
    return [20, 1260];
  }
  G.zoneOf = zoneOf;
  function alive(b) { return (b.role === 'in' || b.role === 'toIn') && !b.pendingOut; }
  G.alive = alive;
  function enemyDir(b) { return b.role === 'out' ? (b.team ? 1 : -1) : (b.team ? -1 : 1); }

  /* ---------- pose (Wobble targets + IK) ---------- */
  var _ik = [0, 0];
  function ik(ax, ay, bx, by, l1, l2, bend) {
    var dx = bx - ax, dy = by - ay, d = Math.sqrt(dx * dx + dy * dy), m = l1 + l2 - 0.05;
    if (d > m) { dx *= m / d; dy *= m / d; d = m; } if (d < 0.01) { d = 0.01; dx = 0.01; dy = 0; }
    var a = (l1 * l1 - l2 * l2 + d * d) / (2 * d), h = Math.sqrt(Math.max(0, l1 * l1 - a * a));
    _ik[0] = ax + dx * a / d - dy / d * h * bend; _ik[1] = ay + dy * a / d + dx / d * h * bend; return [ax + dx, ay + dy];
  }
  function pose(b) {
    var t = b.animT, tg = b.tg, fc = b.face, air = b.h > 1, sc = b.sc;
    var hx = 0, hy = -40, lean = 3, hFx = 13, hFy = -44, hBx = -9, hBy = -40, fFx = 9, fFy = 0, fBx = -9, fBy = 0;
    if (b.cheer) {
      var bb = Math.abs(Math.sin(t * 7 + b.i)); hy = -40 - bb * 12; fFy = -bb * 9; fBy = -bb * 9; hFx = 15; hFy = -96 + Math.sin(t * 14) * 6; hBx = -15; hBy = -96 - Math.sin(t * 14) * 6; lean = Math.sin(t * 5 + b.i) * 9;
    } else if (air) {
      if (b.vh > 0) { fFx = 10; fFy = -13; fBx = -8; fBy = -3; hFx = 14; hFy = -82; hBx = -12; hBy = -76; lean = 5; }
      else { var fl = Math.sin(t * 22) * 6; fFx = 7 + fl * 0.5; fFy = -3; fBx = -11; fBy = -10 - fl * 0.5; hFx = 18; hFy = -86 + fl; hBx = -16; hBy = -84 - fl; lean = 2; }
    } else if (b.spd > 30) {
      var sn = Math.sin(b.runPh), cs = Math.cos(b.runPh);
      hy = -38 - Math.abs(cs) * 2.5; lean = 9; fFx = sn * 16; fFy = -Math.max(0, cs) * 10; fBx = -sn * 16; fBy = -Math.max(0, -cs) * 10;
      hFx = -sn * 15 + 7; hFy = -46; hBx = sn * 15 + 3; hBy = -46;
    } else { var bob = Math.sin(t * 4 + b.i) * 1.5; hy = -39 + bob; hFy += bob; hBy += bob; }
    if (b.sad) { hFx = 5; hFy = -34; hBx = -3; hBy = -34; lean = -2; }
    if (b.catchT > 0) { hFx = 27; hFy = -62; hBx = 25; hBy = -50; lean = 7; }
    else if (b.charging) { var c = b.charge; hFx = -20 - c * 9; hFy = -84 - c * 8 + Math.sin(t * 40) * c * 2; hBx = 18; hBy = -62; lean = -3 - c * 6; }
    else if (b.throwT > 0) { hFx = 33; hFy = -58; hBx = -16; hBy = -40; lean = 13; }
    else if (b.hold) { hFx = 17; hFy = -58; }
    var nx = hx + lean, ny = hy - 31, r;
    tg[0] = nx + lean * 0.35 + 1.5; tg[1] = ny - 14; tg[2] = nx; tg[3] = ny; tg[4] = hx; tg[5] = hy;
    r = ik(nx, ny, hFx, hFy, 18, 18, 1); tg[6] = _ik[0]; tg[7] = _ik[1]; tg[8] = r[0]; tg[9] = r[1];
    r = ik(nx, ny, hBx, hBy, 18, 18, 1); tg[10] = _ik[0]; tg[11] = _ik[1]; tg[12] = r[0]; tg[13] = r[1];
    r = ik(hx, hy, fFx, fFy, 21, 21, -1); tg[14] = _ik[0]; tg[15] = _ik[1]; tg[16] = r[0]; tg[17] = r[1];
    r = ik(hx, hy, fBx, fBy, 21, 21, -1); tg[18] = _ik[0]; tg[19] = _ik[1]; tg[20] = r[0]; tg[21] = r[1];
    for (var i = 0; i < 22; i += 2) { tg[i] = b.rx + tg[i] * fc * sc; tg[i + 1] = b.ry + tg[i + 1] * sc; }
  }
  function springPts(b, dxr, dyr) {
    var tg = b.tg, pts = b.pts, i, p, sc = b.sc;
    for (i = 0; i < 11; i++) {
      p = pts[i]; var c = SPC[i]; p.x += dxr * c; p.px += dxr * c; p.y += dyr * c; p.py += dyr * c;
      var st = SPK[i], d = SPD[i], vx = (p.x - p.px) * d, vy = (p.y - p.py) * d;
      p.px = p.x; p.py = p.y; p.x += vx + (tg[i * 2] - p.x) * st; p.y += vy + (tg[i * 2 + 1] - p.y) * st;
    }
    for (i = 0; i < CHAIN.length; i++) { var a = pts[CHAIN[i][0]], q = pts[CHAIN[i][1]], dx = q.x - a.x, dy = q.y - a.y, dd = Math.sqrt(dx * dx + dy * dy) || 0.001, k = CHAIN[i][2] * sc / dd; q.x = a.x + dx * k; q.y = a.y + dy * k; }
    if (b.h <= 0) { if (pts[8].y > b.ry + 1) pts[8].y = b.ry + 1; if (pts[10].y > b.ry + 1) pts[10].y = b.ry + 1; }
  }

  /* ---------- stand-mode movement ---------- */
  function standStep(M, b, inp) {
    var spd = (b.role === 'in' ? 255 : b.role === 'out' ? 235 : 430) * (inp.spd || 1);
    if (b.charging) spd *= 0.55; if (b.catchT > 0) spd *= 0.5;
    var mx = inp.mx || 0, mz = inp.mz || 0, l = Math.sqrt(mx * mx + mz * mz); if (l > 1) { mx /= l; mz /= l; }
    b.vx += clamp(mx * spd - b.vx, -3200 * DT, 3200 * DT); b.vz += clamp(mz * spd * 0.8 - b.vz, -3200 * DT, 3200 * DT);
    if (b.hold || b.charging || b.catchT > 0 || (b.role === 'in' && !mx) || b.role === 'out' && !mx) b.face = enemyDir(b);
    else if (mx) b.face = mx > 0 ? 1 : -1;
    var zn = zoneOf(b);
    b.x = clamp(b.x + b.vx * DT, zn[0], zn[1]); b.z = clamp(b.z + b.vz / ZPX * DT, 0, 1);
    if (b.x === zn[0] || b.x === zn[1]) b.vx = 0;
    if (inp.jump && b.h <= 0 && !b.catchT) { b.vh = 640; b.h = 0.01; G.sfx('jump'); }
    if (b.h > 0) { b.h += b.vh * DT; b.vh -= GRAV * DT; if (b.h <= 0) { b.h = 0; b.vh = 0; G.sfx('land'); } }
    if (b.charging) b.charge = Math.min(1, b.charge + DT * 1.3);
    b.sc = scz(b.z);
    var nrx = b.x, nry = FY(b.z) - b.h, dxr = nrx - b.rx, dyr = nry - b.ry; b.rx = nrx; b.ry = nry;
    b.spd = Math.sqrt(b.vx * b.vx + b.vz * b.vz); b.runPh += b.spd * DT * 0.075; b.animT += DT;
    pose(b); springPts(b, dxr, dyr);
  }

  /* ---------- ragdoll ---------- */
  function launch(b, dirx, pw, upMul) {
    b.mode = 'rag'; b.ragT = 0; b.hold = false; b.charging = false; b.catchT = 0; b.throwT = 0; b.eyes = 2; b.rsc = b.sc; b.flash = 0.14;
    var vx = dirx * (330 + 470 * pw), vy = -(260 + 360 * pw) * (upMul == null ? 1 : upMul);
    for (var k = 0; k < 11; k++) {
      var p = b.pts[k], f = k === 0 ? 1.3 : k === 1 ? 1.15 : k === 2 ? 1 : k >= 7 ? 0.55 : 1.1, fy = k >= 7 ? 0.7 : 1;
      p.px = p.x - vx * f * DT; p.py = p.y - vy * fy * DT;
    }
  }
  function flipLaunch(b) {   // thrower somersault: spin around the hip and hop up
    b.mode = 'rag'; b.ragT = 0; b.flipping = true; b.rsc = b.sc; b.eyes = 1;
    var hp = b.pts[2], w = -18 * b.face;
    for (var k = 0; k < 11; k++) { var p = b.pts[k], rx = p.x - hp.x, ry = p.y - hp.y, vx = -w * ry, vy = w * rx - 720; p.px = p.x - vx * DT; p.py = p.y - vy * DT; }
  }
  function ragStep(M, b) {
    var i, j, p, it, s = b.rsc, fy = FY(b.z);
    for (i = 0; i < 11; i++) { p = b.pts[i]; var vx = clamp((p.x - p.px) * 0.995, -38, 38), vy = clamp((p.y - p.py) * 0.995, -38, 38); p.px = p.x; p.py = p.y; p.x += vx; p.y += vy + GRAV * DT * DT; }
    for (it = 0; it < 8; it++) {
      var pts = b.pts;
      for (j = 0; j < ST.length; j++) { var c = ST[j], a = pts[c[0]], q = pts[c[1]], dx = q.x - a.x, dy = q.y - a.y, d = Math.sqrt(dx * dx + dy * dy) || 0.001, df = (d - c[2] * s) / d * 0.5; a.x += dx * df; a.y += dy * df; q.x -= dx * df; q.y -= dy * df; }
      var hd = pts[0], hpp = pts[2], ddx = hpp.x - hd.x, ddy = hpp.y - hd.y, dd = Math.sqrt(ddx * ddx + ddy * ddy) || 0.001;
      if (dd < 40 * s) { var qq = (dd - 40 * s) / dd * 0.5; hd.x += ddx * qq; hd.y += ddy * qq; hpp.x -= ddx * qq; hpp.y -= ddy * qq; }
      for (i = 0; i < 11; i++) {
        p = pts[i]; var r = PR[i] * s;
        if (p.y > fy - r) { var vy2 = p.y - p.py; p.y = fy - r; if (it === 7) { p.px += (p.x - p.px) * 0.18; if (vy2 > 6) p.py = p.y + vy2 * 0.35; } }
        if (p.x < 10) { p.x = 10; if (it === 7) p.px = p.x + (p.x - p.px) * 0.5; } else if (p.x > W - 10) { p.x = W - 10; if (it === 7) p.px = p.x + (p.x - p.px) * 0.5; }
      }
    }
    b.ragT += DT; b.animT += DT; b.x = clamp(b.pts[2].x, 12, W - 12); b.rx = b.x; b.ry = FY(b.z); b.spd = 0;
    if (b.ragT < 0.5 && b.ragT > 0.08 && Math.abs(b.pts[0].y - b.pts[0].py) < 0.5 && b.pts[0].y > fy - 20 && !b.landed) { b.landed = 1; G.sfx('land'); M.shake = Math.max(M.shake, 3); }
    var hp = b.pts[2], v = Math.sqrt(Math.pow(hp.x - hp.px, 2) + Math.pow(hp.y - hp.py, 2)) / DT;
    var up = b.flipping ? b.ragT > 0.75 : (b.ragT > 1.15 && v < 170) || b.ragT > 2.6;
    if (up) {
      b.mode = 'stand'; b.landed = 0; b.eyes = 0; b.h = 0; b.vh = 0; b.vx = b.vz = 0;
      if (b.flipping) { b.flipping = false; b.h = Math.max(0, Math.min(140, fy - b.pts[8].y - 4)); b.vh = 0; }
      var zn = zoneOf(b); b.x = clamp(b.x, zn[0], zn[1]);
      if (b.pendingOut) {
        b.pendingOut = false; b.role = 'toOut'; b.sad = true;
        var oz = b.team ? [25, BL - 12] : [BR + 12, 1255]; b.dest = { x: rnd(oz[0] + 10, oz[1] - 10), z: rnd(0.15, 0.85), role: 'out' };
      }
    }
  }

  /* ---------- ball ---------- */
  function mkBall() { return { x: CX, z: 0.5, h: 11, vx: 0, vz: 0, vh: 0, st: 'loose', holder: null, team: -1, thrower: null, sp: null, t: 0, path: null, prog: 0, r: 11, fake: false, pass: false, side: {}, alive: true, trail: [], id: 0, spin: 0, pow: 0, lx: 0, lz: 0, lh: 0 }; }
  function giveBall(M, B, b) {
    B.st = 'held'; B.holder = b; B.path = null; B.sp = null; B.pass = false; B.team = b.team; B.r = 11; B.trail = []; B.fakeLook = null;
    b.hold = true; b.charging = false; b.charge = 0; b.ai.holdT = null; b.catchT = 0;
    if (b.team === 0 && M.ctrl >= 0) M.ctrl = b.id;
    if (b.team === 1 && M.ctrl2 >= 0) M.ctrl2 = b.id;
    M.fakes.forEach(function (f) { f.alive = false; });
  }
  function pickTarget(M, b) {
    var best = null, bd = 1e9, cands = M.bodies.filter(function (o) { return o.team !== b.team && o.role === 'in' && !o.pendingOut && o.mode === 'stand'; });
    if (!cands.length) return null;
    var human = isHuman(M, b);
    cands.forEach(function (o) { var d = Math.abs(o.x - b.x) + 2.2 * Math.abs(o.z - b.z) * ZPX + (human ? 0 : rnd(0, 160)); if (d < bd) { bd = d; best = o; } });
    return best;
  }
  G.pickTarget = pickTarget;
  function mkPath(B, x0, z0, h0, x1, z1, h1, v, arc) {
    var d = Math.sqrt((x1 - x0) * (x1 - x0) + Math.pow((z1 - z0) * ZPX, 2));
    B.path = { x0: x0, z0: z0, h0: h0, x1: x1, z1: z1, h1: h1, D: Math.max(0.16, d / v), arc: arc, side: Math.random() < 0.5 ? -1 : 1, dir: sgn(x1 - x0) };
    B.prog = 0; B.t = 0;
  }
  function throwBall(M, b, charge, spId) {
    var B = M.ball, tg = pickTarget(M, b), P = M.P[b.team], human = isHuman(M, b);
    if (b.h > 20 && !spId) charge = Math.min(1.3, charge + 0.35);   // jump-throw: extra power
    STAT.thr++; B.st = 'fly'; B.holder = null; B.team = b.team; B.thrower = b; B.pow = charge; B.sp = spId || null; B.pass = false; B.r = 11; B.id = ++M.ballId; B.side = {}; B.trail = [];
    B.boost = 0; B.ph = 0; B.co = 0; B.fake = false; B.bn = 0; B.bk = 0;
    b.hold = false; b.charging = false; b.charge = 0; b.throwT = 0.22; b.noPick = 0.5;
    var x0 = B.x, z0 = b.z, h0 = Math.max(30, B.h), x1, z1, h1;
    if (tg) { x1 = tg.x + tg.vx * 0.12; z1 = tg.z + tg.vz / ZPX * 0.12; h1 = 52 * tg.sc; }
    else { x1 = b.team ? 250 : 1030; z1 = b.z; h1 = 45; }
    if (!human) { z1 += rnd(-P.err, P.err); x1 += rnd(-1, 1) * P.err * 180; }
    z1 = clamp(z1, 0, 1);
    var v = spId ? 1050 : 650 + 850 * Math.min(1.3, charge);
    mkPath(B, x0, z0, h0, x1, z1, h1, v, spId ? 0 : 10 + (1 - Math.min(1, charge)) * 40);
    M.bodies.forEach(function (o) { B.side[o.id] = sgn(o.x - x0); });
    if (spId) {
      var S = SPEC[spId]; B.path.D = Math.max(0.6, B.path.D) * (S.dm || 1); if (S.arc != null) B.path.arc = S.arc; if (S.start) S.start(M, B, b);
      M.spFired[spId] = (M.spFired[spId] || 0) + 1; M.meter[b.team] = 0; M.nextSp[b.team] = pickSp(spId);
      M.ban = { txt: T('sp_' + spId), sub: T('ss_' + spId), k: 'sp_' + spId, ks: 'ss_' + spId, col: S.col, t: 0, dur: 1.5, sp: spId, team: b.team };
      M.flash = 0.22; M.shake = Math.max(M.shake, 6); G.sfx('special'); G.sfx('sp_' + spId); crowd(M, 1);
    } else G.sfx('throw');
    if (human && b.role === 'out') { var n = nearestIn(M, b.team, b); if (n) setCtrl(M, b.team, n.id); }
  }
  function isHuman(M, b) { return b.id === M.ctrl || b.id === M.ctrl2; }
  function setCtrl(M, t, id) { if (t) M.ctrl2 = id; else M.ctrl = id; }
  G.isHuman = isHuman;
  function nearestIn(M, team, ref) { var best = null, bd = 1e9; M.bodies.forEach(function (o) { if (o.team === team && o.role === 'in' && !o.pendingOut && o.mode === 'stand') { var d = Math.abs(o.x - ref.x) + Math.abs(o.z - ref.z) * ZPX; if (d < bd) { bd = d; best = o; } } }); return best; }
  function pass(M, b) {
    var mates = M.bodies.filter(function (o) { return o.team === b.team && o !== b && o.mode === 'stand' && (o.role === 'in' || o.role === 'out') && !o.pendingOut; });
    if (!mates.length) return false;
    var outs = mates.filter(function (o) { return o.role === 'out'; }), r = b.role === 'in' && outs.length ? outs[0] : mates[(M.passRR++) % mates.length];
    var B = M.ball; B.st = 'fly'; B.pass = true; B.recv = r; B.holder = null; B.team = b.team; B.thrower = b; B.sp = null; B.id = ++M.ballId; B.trail = []; B.side = {};
    b.hold = false; b.charging = false; b.throwT = 0.18; b.noPick = 0.4;
    mkPath(B, B.x, b.z, Math.max(30, B.h), r.x, r.z, 60 * r.sc, 1100, 90);
    r.ai.t = 0.6; G.sfx('pass');
    return true;
  }
  function pickSp(prev) { var l = G.SPECIALS, s; do { s = l[(Math.random() * l.length) | 0]; } while (s === prev); return s; }

  /* ---------- special shots ---------- */
  function puff(M, x, y, n, col, sz, sp) { for (var i = 0; i < n; i++) M.fx.push({ k: 'puff', x: x + rnd(-6, 6), y: y + rnd(-6, 6), vx: rnd(-1, 1) * (sp || 60), vy: rnd(-1, 1) * (sp || 60) - 20, life: 0, max: rnd(0.4, 0.8), col: col, s: sz * rnd(0.7, 1.3) }); }
  function bsy(B) { return FY(B.z) - B.h; }
  var SPEC = {
    banana: { col: '#ffe14d', dm: 1.35, off: function (M, B, u, q) { q[1] += B.path.side * 0.45 * Math.sin(Math.PI * u); } },
    fart: { col: '#9be564', dm: 0.95, rate: function (M, B) {
      if (B.t < 0.6) return 0.22;
      if (!B.boost) { B.boost = 1; G.sfx('fartBoost'); puff(M, B.x, bsy(B), 14, '#b5e48c', 22, 160); M.shake = Math.max(M.shake, 7); pop(M, B.x, bsy(B) - 40, T('toot'), '#9be564', 36); crowd(M, 0.5); }
      return 2.7;
    }, tick: function (M, B) { if (Math.random() < (B.boost ? 0.9 : 0.35)) puff(M, B.x - B.path.dir * 12, bsy(B), 1, '#b5e48c', B.boost ? 16 : 10, 30); } },
    chicken: { col: '#ffffff', dm: 1.6, off: function (M, B, u, q) { q[2] += (Math.sin(B.t * 13) * 30 + Math.sin(B.t * 29) * 12) * Math.sin(Math.PI * u); q[1] += Math.sin(B.t * 6.7) * 0.13 * Math.sin(Math.PI * u); },
      tick: function (M, B) { if (Math.random() < 0.08) M.fx.push({ k: 'feather', x: B.x, y: bsy(B), vx: rnd(-60, 60), vy: rnd(-80, 0), life: 0, max: 1.2, col: '#fff', s: 7, rot: rnd(0, 6) }); if (B.t - B.bk > 0.45) { B.bk = B.t; G.sfx('bawk'); } } },
    giant: { col: '#ff7b3d', dm: 1.5, tick: function (M, B) { B.r = 11 + 40 * Math.min(1, B.t / 0.6); } },
    clone: { col: '#b388ff', dm: 1.05, start: function (M, B) {
      var offs = [-0.3, 0, 0.3].sort(function () { return Math.random() - 0.5; });
      B.co = offs[0];
      for (var i = 1; i < 3; i++) { var f = mkBall(); for (var k in B) if (k !== 'trail' && k !== 'path' && k !== 'side') f[k] = B[k]; f.path = {}; for (k in B.path) f.path[k] = B.path[k]; f.side = {}; f.trail = []; f.fake = true; f.co = offs[i]; f.alive = true; M.fakes.push(f); }
      puff(M, B.x, bsy(B), 8, '#d7c4ff', 14, 90);
    }, off: function (M, B, u, q) { q[1] += B.co * (B.fake ? Math.min(1, u * 2.4) : Math.sin(Math.PI * u)); } },
    slow: { col: '#6ecbff', dm: 0.9, rate: function (M, B) {
      if (B.t < 1.25) { if (Math.random() < 0.05) M.fx.push({ k: 'txt', txt: 'z', x: B.x, y: bsy(B) - 14, vx: rnd(-10, 10), vy: -40, life: 0, max: 1, col: '#9be7ff', s: 20 }); return 0.1; }
      if (!B.boost) { B.boost = 1; G.sfx('zoom'); pop(M, B.x, bsy(B) - 40, T('zoom'), '#6ecbff', 36); M.shake = Math.max(M.shake, 5); }
      return 3.4;
    } },
    boomer: { col: '#ff9ecb', dm: 1.9, arc: 50, pos: function (M, B, u) {
      var P = B.path, cx = clamp(P.x1 + P.dir * 400, 60, W - 60), p1x = cx, p1z = P.z0 + P.side * 0.95, p2x = cx, p2z = P.z1 - P.side * 0.95, m = 1 - u;
      var x = m * m * m * P.x0 + 3 * m * m * u * p1x + 3 * m * u * u * p2x + u * u * u * P.x1, z = m * m * m * P.z0 + 3 * m * m * u * p1z + 3 * m * u * u * p2z + u * u * u * P.z1;
      return [x, z, lerp(P.h0, P.h1, u) + P.arc * 4 * u * m];
    } },
    zigzag: { col: '#8ef0a8', dm: 1.3, off: function (M, B, u, q) { q[1] += 0.3 * tri(u * 5); } },
    ghost: { col: '#e8e9f5', dm: 0.8 },
    flip: { col: '#ffb703', dm: 1.35, arc: 420, start: function (M, B, b) { B.path.h0 = Math.max(B.path.h0, 100); flipLaunch(b); } },
    sneeze: { col: '#c9f0ff', dm: 1.0, rate: function (M, B) {
      if (B.ph === 0) { if (B.prog >= 0.42) { B.ph = 1; B.w = 1.0; pop(M, B.x, bsy(B) - 36, T('ah'), '#c9f0ff', 28); } return 1; }
      if (B.ph === 1) { B.w -= DT; if (B.w < 0.5 && !B.ah2) { B.ah2 = 1; G.sfx('ah2'); pop(M, B.x, bsy(B) - 56, T('ah'), '#c9f0ff', 34); }
        if (B.w <= 0) { B.ph = 2; G.sfx('achoo'); pop(M, B.x, bsy(B) - 50, T('achoo'), '#ffffff', 44); M.shake = Math.max(M.shake, 10); for (var i = 0; i < 12; i++) M.fx.push({ k: 'drop', x: B.x, y: bsy(B), vx: B.path.dir * rnd(100, 400), vy: rnd(-200, 60), life: 0, max: 0.7, col: '#9be7ff', s: 4 }); }
        return 0; }
      return 3.2;
    } },
    bouncy: { col: '#ff70a6', dm: 1.4, off: function (M, B, u, q) {
      var s = Math.abs(Math.sin(Math.PI * (0.5 + u * 3))); q[2] = B.r + (B.path.h1 + 40 - B.r) * s;
      var bn = Math.floor(0.5 + u * 3); if (bn !== B.bn) { B.bn = bn; G.sfx('boing'); puff(M, B.x, FY(B.z), 3, '#fff', 8, 40); }
    } }
  };
  G.SPEC = SPEC;
  function special(M, b, id) { throwBall(M, b, 1, id); }

  function pathStep(M, B) {
    var P = B.path, S = B.sp ? SPEC[B.sp] : null, rate = S && S.rate ? S.rate(M, B) : 1;
    if (B.pass && B.recv) { P.x1 = B.recv.x; P.z1 = B.recv.z; }
    B.prog += DT * rate / P.D;
    var u = Math.min(1, B.prog), q;
    if (S && S.pos) q = S.pos(M, B, u);
    else q = [lerp(P.x0, P.x1, u), lerp(P.z0, P.z1, u), lerp(P.h0, P.h1, u) + P.arc * 4 * u * (1 - u)];
    if (S && S.off) S.off(M, B, u, q);
    B.x = q[0]; B.z = clamp(q[1], -0.08, 1.08); B.h = Math.max(B.r, q[2]);
    B.vx = (B.x - B.lx) / DT; B.vz = (B.z - B.lz) * ZPX / DT; B.vh = (B.h - B.lh) / DT;
    if (S && S.tick) S.tick(M, B, u);
    if (B.prog >= 1) {
      B.path = null;
      if (B.pass) { var r = B.recv; if (r && r.mode === 'stand' && (r.role === 'in' || r.role === 'out') && !r.pendingOut) { giveBall(M, B, r); G.sfx('catch'); } else { B.st = 'loose'; B.pass = false; } }
    }
  }
  function ballStep(M, B) {
    if (B.st === 'held') { var hb = B.holder, hp = hb.pts[4]; B.x = hp.x + hb.face * 3; B.z = hb.z; B.h = Math.max(B.r, FY(hb.z) - hp.y); B.vx = B.vz = B.vh = 0; return; }
    B.lx = B.x; B.lz = B.z; B.lh = B.h; B.t += DT;
    if (B.path) pathStep(M, B);
    else {
      B.vh -= GB * DT; B.x += B.vx * DT; B.z += B.vz / ZPX * DT; B.h += B.vh * DT;
      if (B.h < B.r) {
        B.h = B.r; if (B.st === 'fly') dead(M, B);
        if (B.vh < -140) { B.vh = -B.vh * 0.55; if (!B.fake) G.sfx('bounce'); } else B.vh = 0;
        B.vx *= 0.85; B.vz *= 0.85;
      }
      if (B.h <= B.r + 0.5 && B.vh === 0) { var k = Math.exp(-2.4 * DT); B.vx *= k; B.vz *= k; }
      if (B.st === 'loose' && Math.abs(B.x - CX) < 20 && Math.abs(B.vx) < 40) B.vx = sgn(B.x - CX + (M.round % 2 ? 0.1 : -0.1)) * 70;
    }
    if (B.x < 12) { B.x = 12; B.vx = Math.abs(B.vx) * 0.5; if (B.st === 'fly' && !B.path) dead(M, B); }
    if (B.x > W - 12) { B.x = W - 12; B.vx = -Math.abs(B.vx) * 0.5; if (B.st === 'fly' && !B.path) dead(M, B); }
    if (!B.path) { if (B.z < 0) { B.z = 0; B.vz = Math.abs(B.vz) * 0.5; } if (B.z > 1) { B.z = 1; B.vz = -Math.abs(B.vz) * 0.5; } }
    B.spin += (Math.abs(B.vx) + Math.abs(B.vz)) * DT * 0.05;
    if (B.st === 'fly' && !B.pass && M.state === 'play') liveCheck(M, B);
    if (B.st === 'loose' && !B.fake && M.state === 'play') pickupCheck(M, B);
    if (B.st === 'fly') { B.trail.push(B.x, bsy(B)); if (B.trail.length > 24) B.trail.splice(0, 2); } else if (B.trail.length) B.trail.splice(0, 2);
  }
  function dead(M, B) {
    if (B.fake) { B.alive = false; puff(M, B.x, bsy(B), 6, '#d7c4ff', 12, 70); G.sfx('poof'); return; }
    B.st = 'loose'; B.path = null; B.pass = false; B.team = -1; B.sp = null; B.r = 11;
  }
  function liveCheck(M, B) {
    var i, b;
    for (i = 0; i < M.bodies.length; i++) {
      b = M.bodies[i]; if (b.team === B.team || b.role !== 'in' || b.pendingOut || b.mode !== 'stand') continue;
      var sc = b.sc, r = B.r, dx = Math.abs(B.x - b.x), dz = Math.abs(B.z - b.z) * ZPX, top = b.h + BODY_H * sc;
      // generous catch: bigger box, while the catch window is open
      if (b.catchT > 0 && !B.fake && B.sp !== 'giant' && dx < 34 * sc + r && dz < 32 + r && B.h - r < top + 20 && B.h + r > b.h) { catchBall(M, B, b); return; }
      if (dx < 16 * sc + r && dz < 15 + r * 0.8 && B.h - r < top && B.h + r > b.h + 4) {
        if (B.fake) { dead(M, B); return; }
        if (b.catchT > 0 && B.sp === 'giant') pop(M, b.x, FY(b.z) - 170, T('tooBig'), '#ff7b3d', 30);
        hitBody(M, B, b); return;
      }
      if (!B.fake && B.side[b.id] && sgn(b.x - B.x) !== B.side[b.id]) {
        B.side[b.id] = 0;
        if (dz < 70 + r || (dx < 40 && b.h > 20)) { meterAdd(M, b.team, 0.17); STAT.dOk++; pop(M, b.x, FY(b.z) - b.h - 125 * sc, T('dodge'), '#9be7ff', 26); G.sfx('dodge'); }
      }
    }
  }
  function sparks(M, x, y, n, col, sp) { for (var i = 0; i < n; i++) { var a = rnd(0, 6.283), v = rnd(0.3, 1) * sp; M.fx.push({ k: 'spark', x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0, max: rnd(0.18, 0.4), col: col, s: rnd(3, 6) }); } }
  function hitBody(M, B, b) {
    var pw = B.sp ? (B.sp === 'giant' ? 2.5 : 1.8) : 0.55 + Math.min(1.3, B.pow) * 1.05;
    var dir = Math.abs(B.vx) > 30 ? sgn(B.vx) : (b.team ? 1 : -1);
    var hy = bsy(B);
    launch(b, dir, pw); b.pendingOut = true; M.hits[B.team]++; STAT.hit++;
    // the hit feel: hit-stop, shake, white body flash, impact ring + sparks, crunchy thump
    M.hitstop = 0.06 + 0.06 * pw; M.shake = Math.max(M.shake, 8 + 9 * pw); M.flash = Math.max(M.flash, 0.06 + 0.05 * pw);
    M.fx.push({ k: 'ring', x: B.x, y: hy, life: 0, max: 0.28, col: '#fff', s: 20 + 30 * pw });
    M.fx.push({ k: 'burst', x: B.x, y: hy, life: 0, max: 0.12, col: '#fff', s: 26 + 22 * pw });
    sparks(M, B.x, hy, 10 + (pw * 6 | 0), '#ffe45c', 380 + 260 * pw);
    G.sfx(pw > 1.2 ? 'bigHit' : 'hit'); if (pw > 1.2) G.audio.buzz(40);
    crowd(M, pw);
    pop(M, b.x, FY(b.z) - 150 * b.sc, T('out'), '#ff5a4f', 30 + pw * 8);
    meterAdd(M, B.team, 0.15);
    var th = B.thrower; if (th && th.role === 'out' && th.mode === 'stand') { th.role = 'toIn'; th.sad = false; th.dest = { x: th.team ? rnd(CX + 120, 1000) : rnd(280, CX - 120), z: rnd(0.2, 0.8), role: 'in' }; pop(M, th.x, FY(th.z) - 150, T('backIn'), '#8ef0a8', 30); G.sfx('revive'); }
    B.path = null; B.st = 'loose'; B.team = -1; B.sp = null; B.r = 11; B.vx = -B.vx * 0.22; B.vz *= 0.3; B.vh = 380;
    M.fakes.forEach(function (f) { if (f.alive) dead(M, f); });
    if (isHuman(M, b)) { var n = nearestIn(M, b.team, b); if (n) setCtrl(M, b.team, n.id); }
    checkRoundEnd(M);
  }
  function catchBall(M, B, b) {
    giveBall(M, B, b); b.throwT = 0; STAT.cat++;   // rule: a catch only keeps the ball (no out for the thrower)
    G.sfx('catch'); pop(M, b.x, FY(b.z) - 150 * b.sc, T('catch'), '#8ef0a8', 34); meterAdd(M, b.team, 0.4);
    M.hitstop = 0.08; M.shake = Math.max(M.shake, 6); crowd(M, 0.8); sparks(M, B.x, bsy(B), 8, '#8ef0a8', 300);
    M.fx.push({ k: 'ring', x: B.x, y: bsy(B), life: 0, max: 0.25, col: '#8ef0a8', s: 40 });
  }
  function pickupCheck(M, B) {
    if (B.h > 55) return;
    for (var i = 0; i < M.bodies.length; i++) {
      var b = M.bodies[i]; if (b.mode !== 'stand' || b.noPick > 0 || !(b.role === 'in' || b.role === 'out') || b.pendingOut) continue;
      if (Math.abs(B.x - b.x) < 34 && Math.abs(B.z - b.z) * ZPX < 30) { giveBall(M, B, b); G.sfx('click'); return; }
    }
  }
  function meterAdd(M, t, v) {
    if (t < 0) return; var was = M.meter[t]; M.meter[t] = Math.min(1, M.meter[t] + v);
    if (was < 1 && M.meter[t] >= 1) { G.sfx('ready'); pop(M, t ? 1000 : 280, 330, T('spReady'), '#ffd23f', 30); }
  }
  function pop(M, x, y, txt, col, size) { M.pops.push({ x: x, y: y, txt: txt, col: col || '#ffe45c', size: size || 30, t: 0 }); if (M.pops.length > 10) M.pops.shift(); }
  G.pop = pop;
  function crowd(M, p) {
    M.crowd = Math.min(1.5, M.crowd + 0.5 * p); var w = G.t('wows'), n = p > 1.2 ? 3 : p > 0.6 ? 2 : 1;
    for (var i = 0; i < n; i++) M.wows.push({ x: rnd(80, W - 80), y: rnd(60, 250), txt: w[(Math.random() * w.length) | 0], t: 0, s: rnd(26, 40) * (0.8 + p * 0.3) });
    if (M.wows.length > 8) M.wows.splice(0, M.wows.length - 8);
    G.sfx('crowd');
  }
  function counts(M) { var c = [0, 0]; M.bodies.forEach(function (b) { if (alive(b)) c[b.team]++; }); return c; }
  G.counts = counts;
  function checkRoundEnd(M) {
    if (M.state !== 'play') return;
    var c = counts(M);
    if (c[0] && c[1]) { matchPointCheck(M, c); return; }
    var w = c[0] ? 0 : 1; M.state = 'ko'; M.st = 0; M.roundWin = w; M.slow = M.score[w] >= 1 ? 1.6 : 1.0; G.sfx('whistle2');
  }
  function matchPointCheck(M, c) {
    for (var t = 0; t < 2; t++) if (c[t] === 1 && M.score[1 - t] >= 1 && M.mp !== M.round) { M.mp = M.round; M.mpTeam = t; M.ban = { txt: T('matchPoint'), k: 'matchPoint', col: '#ff5a4f', t: 0, dur: 1.3 }; G.sfx('ready'); }
  }

  /* ---------- AI ---------- */
  function walkTo(o, b, x, z, k) { var dx = x - b.x, dz = (z - b.z) * ZPX; o.mx = Math.abs(dx) > 6 ? clamp(dx / 40, -1, 1) * (k || 1) : 0; o.mz = Math.abs(dz) > 5 ? clamp(dz / 30, -1, 1) * (k || 1) : 0; }
  function threat(M, b) {   // the live enemy ball coming at b: {B, tt, miss} or null
    var all = [M.ball].concat(M.fakes), best = null;
    for (var i = 0; i < all.length; i++) {
      var B = all[i]; if (!B.alive || B.st !== 'fly' || B.pass || B.team === b.team) continue;
      var vx = B.vx, vz = B.vz, sp2 = vx * vx + vz * vz; if (sp2 < 400) continue;
      var rx = b.x - B.x, rz = (b.z - B.z) * ZPX, tt = (rx * vx + rz * vz) / sp2; if (tt < 0) continue;
      var mx = rx - vx * tt, mz = rz - vz * tt, miss = Math.sqrt(mx * mx + mz * mz);
      if (miss < 50 + B.r && (!best || tt < best.tt)) best = { B: B, tt: tt, miss: miss, mz: mz };
    }
    return best;
  }
  G.threat = threat;
  function aiInput(M, b) {
    var a = b.ai, P = M.P[b.team], o = { mx: 0, mz: 0, jump: false, spd: P.spd }, B = M.ball;
    a.t -= DT;
    if (M.state !== 'play') { if (b.hold && M.state === 'intro') return o; return o; }
    if (b.hold) {
      if (a.holdT == null) { a.holdT = rnd(P.hold, P.hold * 1.7); a.tx = b.role === 'in' ? (b.team ? rnd(CX + 40, CX + 190) : rnd(CX - 190, CX - 40)) : b.x; a.tz = clamp(b.z + rnd(-0.25, 0.25), 0.05, 0.95); a.useSp = M.meter[b.team] >= 1; a.jt = Math.random() < 0.25 * (P.pow + 0.3); }
      a.holdT -= DT; walkTo(o, b, a.tx, a.tz, 0.8);
      if (a.holdT < 0.5 && !b.charging && !a.useSp) { b.charging = true; b.charge = Math.max(0, P.pow - 0.6); }
      if (a.jt && a.holdT < 0.2 && b.h <= 0) { o.jump = true; a.jt = false; }
      if (a.holdT <= 0 && (b.h <= 0 || b.h > 40)) {
        a.holdT = null;
        var outs = M.bodies.some(function (x) { return x.team === b.team && x.role === 'out' && x.mode === 'stand'; });
        if (a.useSp && M.meter[b.team] >= 1) special(M, b, M.nextSp[b.team]);
        else if (b.role === 'in' && outs && Math.random() < P.passP) pass(M, b);
        else throwBall(M, b, b.charging ? b.charge : P.pow);
      }
      return o;
    }
    b.charging = false;
    // incoming ball: decide once per throw
    var th = threat(M, b);
    if (th && b.role === 'in' && th.tt < 0.38 && a.dec !== th.B.id) {
      a.dec = th.B.id;
      var cp = P.catchP, dp = P.dodgeP, Bt = th.B;
      if (Bt.sp) { cp *= 0.45; dp *= 0.75; } if (Bt.sp === 'giant') cp = 0; if (Bt.sp === 'ghost') { cp *= 0.6; dp *= 0.6; }
      if (th.tt < P.react) { cp *= 0.4; dp *= 0.4; STAT.late++; }
      var r = Math.random();
      if (r < cp && b.catchCD <= 0) { b.catchT = 0.42; b.catchCD = 0.6; STAT.cTry++; }
      else if (r < cp + dp) { STAT.dTry++; if (th.tt > 0.11 && Bt.h < 90 && Math.random() < 0.55 && b.h <= 0) { o.jump = true; STAT.jump++; } else { STAT.side++; a.dodgeT = 0.38; a.dodgeZ = th.mz !== 0 ? sgn(th.mz) : (b.z > 0.5 ? -1 : 1); if ((b.z < 0.08 && a.dodgeZ < 0) || (b.z > 0.92 && a.dodgeZ > 0)) a.dodgeZ = -a.dodgeZ; } }
    }
    if (a.dodgeT > 0) { a.dodgeT -= DT; o.mz = a.dodgeZ; return o; }
    if (b.role === 'toOut' || b.role === 'toIn') return o;
    // loose ball: the nearest teammate who can reach it goes for it
    if (B.st === 'loose' && M.chaser[b.team] === b) { walkTo(o, b, B.x, B.z, 1); return o; }
    if (B.st === 'fly' && B.pass && B.recv === b) return o;
    if (a.t <= 0) {
      a.t = rnd(0.9, 2.2);
      var zn = zoneOf(b), mine = B.holder && B.holder.team === b.team;
      if (b.role === 'in') {
        var back = b.team ? [CX + 160, BR - 40] : [BL + 40, CX - 160], fwd = b.team ? [CX + 60, CX + 300] : [CX - 300, CX - 60], rg = mine ? fwd : back;
        a.tx = rnd(rg[0], rg[1]);
      } else a.tx = rnd(zn[0] + 5, zn[1] - 5);
      a.tz = rnd(0.08, 0.92);
      // stay off the line of an enemy holder
      if (B.holder && B.holder.team !== b.team && Math.abs(a.tz - B.holder.z) < 0.15) a.tz = clamp(a.tz + (a.tz > B.holder.z ? 0.2 : -0.2), 0.05, 0.95);
    }
    walkTo(o, b, a.tx, a.tz, 0.75);
    return o;
  }
  function chasers(M) {
    var B = M.ball; M.chaser = [null, null]; if (B.st !== 'loose') return;
    for (var t = 0; t < 2; t++) {
      var best = null, bd = 1e9, hum = null;
      M.bodies.forEach(function (b) {
        if (b.team !== t || b.mode !== 'stand' || b.pendingOut || !(b.role === 'in' || b.role === 'out')) return;
        var zn = zoneOf(b); if (B.x < zn[0] - 30 || B.x > zn[1] + 30) return;
        var d = Math.abs(b.x - B.x) + Math.abs(b.z - B.z) * ZPX;
        if (isHuman(M, b)) { hum = d; return; }
        if (d < bd) { bd = d; best = b; }
      });
      if (hum !== null && hum < bd) best = null;
      M.chaser[t] = best;
    }
  }

  /* ---------- match / round ---------- */
  G.newMatch = function (opt) {
    var N = G.TEAM_SIZES.indexOf(opt.n) >= 0 ? opt.n : 5;
    var tm = opt.versus ? G.FRIEND : G.TEAMS[opt.lvl], M = { lvl: opt.lvl, team: tm, round: 1, score: [0, 0], state: 'intro', st: 0, time: ROUND_T, bodies: [], ball: mkBall(), fakes: [],
      meter: [0, 0], nextSp: [pickSp(), pickSp()], fx: [], pops: [], wows: [], ban: null, shake: 0, hitstop: 0, slow: 0, flash: 0, crowd: 0,
      n: N, ctrl: opt.auto ? -1 : 0, ctrl2: opt.versus ? N : -1, versus: !!opt.versus, auto: !!opt.auto, P: [params(1.8), params(opt.versus ? 1.8 : tm.L)], spFired: {}, hits: [0, 0], mp: 0, roundWin: -1, serve: 0, ballId: 0, passRR: 0, chaser: [null, null], winner: -1, hint: !!opt.hint, nearSlow: 0, frame: 0 };
    for (var t = 0; t < 2; t++) { var td = t ? tm : G.MYTEAM; for (var i = 0; i < N; i++) M.bodies.push(mkBody(M, t, i, td.skins[i % 3], td.hats[(i + (i / 3 | 0)) % 3])); }
    setupRound(M);
    return M;
  };
  // starting spots per team size: x on the left half (mirrored for the right team), z depth
  var FORM = { 3: [[470, 330, 330], [0.5, 0.18, 0.82]],
    5: [[480, 390, 390, 250, 250], [0.5, 0.14, 0.86, 0.36, 0.64]],
    7: [[490, 410, 410, 300, 300, 200, 200], [0.5, 0.12, 0.88, 0.32, 0.68, 0.1, 0.9]] };
  G.TEAM_SIZES = [3, 5, 7];
  function setupRound(M) {
    var F = FORM[M.n], X0 = F[0], Z0 = F[1];
    M.bodies.forEach(function (b) { place(b, b.team ? W - X0[b.i] : X0[b.i], Z0[b.i]); });
    M.ball = mkBall(); M.fakes = []; M.time = ROUND_T; M.state = 'intro'; M.st = 0; M.roundWin = -1; M.slow = 0; M.nearSlow = 0;
    giveBall(M, M.ball, M.bodies[M.serve * M.n]);
    if (M.ctrl >= 0) M.ctrl = 0;
    if (M.ctrl2 >= 0) M.ctrl2 = M.n;
    M.ban = { txt: T('round', M.round), sub: T('ready'), k: 'round', a: M.round, ks: 'ready', col: '#ffd23f', t: 0, dur: 1.4 };
    G.sfx('beep');
  }
  function endRound(M, w, timeUp) {
    M.state = 'roundEnd'; M.st = 0; M.roundWin = w; (G.rlog = G.rlog || []).push({ lvl: M.lvl, len: Math.round(ROUND_T - M.time), w: w });
    if (w >= 0) M.score[w]++;
    M.bodies.forEach(function (b) { b.cheer = w >= 0 && b.team === w && b.mode === 'stand'; b.charging = false; });
    var tk = w < 0 ? 'draw' : w === 0 ? 'roundWin' : 'roundLose', txt = T(tk);
    M.ban = { txt: timeUp ? T('timeUp') : txt, sub: timeUp ? txt : null, k: timeUp ? 'timeUp' : tk, ks: timeUp ? tk : null, col: w === 0 ? '#8ef0a8' : w === 1 ? '#ff9d5c' : '#fff', t: 0, dur: 2.4 };
    if (w === 0) G.sfx('win'); else if (w === 1) G.sfx('lose');
    M.serve = w === 0 ? 1 : 0;
  }
  G.step = function (M, inp, inp2) {
    var i, b, bs = M.bodies;
    M.frame++;
    if (M.state === 'intro') { M.st += DT; if (M.st > 1.5) { M.state = 'play'; M.ban = { txt: T('go'), k: 'go', col: '#ff5a4f', t: 0, dur: 0.9 }; G.sfx('whistle'); G.audio.intensity = 1; } }
    else if (M.state === 'play') {
      M.time -= DT;
      if (M.time <= 0) { var c = counts(M), w = c[0] > c[1] ? 0 : c[1] > c[0] ? 1 : M.hits[0] > M.hits[1] ? 0 : M.hits[1] > M.hits[0] ? 1 : -1; endRound(M, w, true); }
    } else if (M.state === 'ko') { M.st += DT; if (M.st > 1.7) endRound(M, M.roundWin, false); }
    else if (M.state === 'roundEnd') {
      M.st += DT;
      if (M.st > 2.6) {
        if (M.score[0] >= 2 || M.score[1] >= 2 || M.round >= 5) { M.state = 'over'; M.winner = M.score[0] > M.score[1] ? 0 : M.score[1] > M.score[0] ? 1 : -1; G.audio.intensity = 0; }
        else { M.round++; M.hits = [0, 0]; setupRound(M); }
      }
    }
    if (M.state === 'over') return;
    chasers(M);
    // keep control on someone useful
    [M.ctrl, M.ctrl2].forEach(function (cid, t) { if (cid < 0) return; var cb = bs[cid]; if (!(cb.role === 'in' && !cb.pendingOut) && !(cb.role === 'out' && cb.hold)) { var n = nearestIn(M, t, cb); if (n) setCtrl(M, t, n.id); } });
    for (i = 0; i < bs.length; i++) {
      b = bs[i];
      if (b.catchT > 0) b.catchT -= DT; if (b.catchCD > 0) b.catchCD -= DT; if (b.throwT > 0) b.throwT -= DT; if (b.noPick > 0) b.noPick -= DT; if (b.flash > 0) b.flash -= DT;
      if (b.mode === 'rag') { ragStep(M, b); continue; }
      var o;
      if (b.role === 'toOut' || b.role === 'toIn') {
        o = { mx: 0, mz: 0 }; walkTo(o, b, b.dest.x, b.dest.z, 1);
        if (Math.abs(b.x - b.dest.x) < 10 && Math.abs(b.z - b.dest.z) * ZPX < 10) { b.role = b.dest.role; b.sad = false; b.dest = null; b.ai.t = 0; }
      } else if (b.id === M.ctrl && M.state === 'play') o = humanInput(M, b, inp);
      else if (b.id === M.ctrl2 && M.state === 'play') o = humanInput(M, b, inp2);
      else if (b.id === M.ctrl) o = { mx: inp ? inp.mx : 0, mz: inp ? inp.mz : 0 };
      else if (b.id === M.ctrl2) o = { mx: inp2 ? inp2.mx : 0, mz: inp2 ? inp2.mz : 0 };
      else o = aiInput(M, b);
      standStep(M, b, o);
    }
    ballStep(M, M.ball);
    for (i = 0; i < M.fakes.length; i++) if (M.fakes[i].alive) ballStep(M, M.fakes[i]);
    M.fakes = M.fakes.filter(function (f) { return f.alive; });
    // match-point slow-mo: the deciding ball closing in on the last one standing
    M.nearSlow = 0;
    if (M.mp === M.round && M.state === 'play') { var last = bs.filter(function (x) { return x.team === M.mpTeam && alive(x) && x.mode === 'stand'; })[0], tht = last && threat(M, last); if (tht && tht.tt < 0.3 && tht.miss < 40) M.nearSlow = 1; }
    stepFx(M);
  };
  function humanInput(M, b, inp) {
    inp = inp || {};
    var o = { mx: inp.mx || 0, mz: inp.mz || 0, jump: !!inp.jumpP };
    if (inp.catchP && !b.hold && b.catchCD <= 0) { b.catchT = 0.42; b.catchCD = 0.7; }
    if (b.hold) {
      if (inp.spP && M.meter[b.team] >= 1) special(M, b, M.nextSp[b.team]);
      else if (inp.passP) pass(M, b);
      else if (inp.throwHeld) { if (!b.charging) { b.charging = true; b.charge = 0; } }
      else if (b.charging) throwBall(M, b, Math.max(0.12, b.charge));
    } else { b.charging = false; if (inp.passP) switchCtrl(M, b.team); }
    return o;
  }
  function switchCtrl(M, t) {
    t = t || 0; var cur = t ? M.ctrl2 : M.ctrl, list = M.bodies.filter(function (o) { return o.team === t && o.role === 'in' && !o.pendingOut && o.mode === 'stand'; });
    if (list.length < 2) return; var k = list.indexOf(M.bodies[cur]); setCtrl(M, t, list[(k + 1) % list.length].id); G.sfx('click');
  }
  G.stepFx = stepFx;
  function stepFx(M) {
    var i, f;
    for (i = M.fx.length - 1; i >= 0; i--) { f = M.fx[i]; f.life += DT; if (f.life > f.max) { M.fx.splice(i, 1); continue; } f.x += (f.vx || 0) * DT; f.y += (f.vy || 0) * DT; if (f.k === 'spark' || f.k === 'drop') f.vy += 900 * DT; if (f.k === 'feather') { f.vy += 60 * DT; f.vx *= 0.99; f.rot += DT * 4; } }
    if (M.fx.length > 220) M.fx.splice(0, M.fx.length - 220);
    for (i = M.pops.length - 1; i >= 0; i--) { M.pops[i].t += DT; if (M.pops[i].t > 1.0) M.pops.splice(i, 1); }
    for (i = M.wows.length - 1; i >= 0; i--) { M.wows[i].t += DT; if (M.wows[i].t > 1.1) M.wows.splice(i, 1); }
    if (M.ban) { M.ban.t += DT; if (M.ban.t > M.ban.dur) M.ban = null; }
    M.crowd = Math.max(0, M.crowd - DT * 0.5);
  }
  G.giveTo = function (M, id) { var b = M.bodies[id]; if (!b) return false; if (M.ball.holder) M.ball.holder.hold = false; giveBall(M, M.ball, b); return true; };   // debug/test
  G.fire = function (M, id) {   // debug: give the ball to a standing team-0 inside player and fire a special
    var b = M.bodies.filter(function (o) { return o.team === 0 && o.role === 'in' && !o.pendingOut && o.mode === 'stand'; })[0];
    if (!b || !pickTarget(M, b)) return false;
    if (M.ball.holder) M.ball.holder.hold = false;
    giveBall(M, M.ball, b); M.ball.x = b.pts[4].x; M.ball.h = 70; special(M, b, id); return true;
  };
})();
