/* 흐물 피구 — online "play with a friend". Host-authoritative:
   host runs the real simulation and sends compact snapshots (20 Hz) + events (sounds, effects, banners);
   guest sends only its inputs and renders the snapshots ~110 ms in the past with interpolation. */
(function () {
  'use strict';
  var G = window.G;
  var SNAP_MS = 50, INP_MS = 33, IDLE_MS = 250, DELAY = 110, TIMEOUT = 8000;
  var STATES = ['intro', 'play', 'ko', 'roundEnd', 'over'], ROLES = ['in', 'out', 'toOut', 'toIn'], BST = ['loose', 'held', 'fly'];
  function r1(v) { return Math.round(v); }
  function r3(v) { return Math.round(v * 1000); }

  var N = G.net = { role: null, code: null, ws: null, open: false, lastRx: 0, onEvent: null, gin: newGin(), stats: { tx: 0, rx: 0, txB: 0, rxB: 0, rtt: 0 } };
  function newGin() { return { mx: 0, mz: 0, throwHeld: false, catchP: false, jumpP: false, passP: false, spP: false, thrSeen: true, relPending: false }; }

  /* ---------- socket ---------- */
  N.connect = function (role, code, onEvent) {
    N.close(true);
    N.role = role; N.code = code; N.onEvent = onEvent; N.open = false; N.gin = newGin(); N.buf = []; N.off = null; N.view = null; N.lastRx = performance.now();
    N.wasOpen = false; N.gotSnap = false; N.evq = []; N.lastBan = null; N.lastSnap = 0; N.seq = 0; N.inSeq = 0; N.lastInp = null; N.lastInpT = 0; N.pend = { c: 0, j: 0, p: 0, s: 0, thr: 0 };
    var ws;
    try { ws = N.ws = new WebSocket(G.ROOM_SERVER + '/room/' + code + '?role=' + role); } catch (e) { setTimeout(function () { onEvent({ t: 'neterr' }); }, 0); return; }
    var mine = ws;
    ws.onopen = function () { if (N.ws !== mine) return; N.open = true; N.wasOpen = true; };
    ws.onmessage = function (ev) {
      if (N.ws !== mine) return;
      N.lastRx = performance.now(); N.stats.rx++; N.stats.rxB += ev.data.length || 0;
      if (ev.data === 'pong') { if (N.pingT) N.stats.rtt = performance.now() - N.pingT; return; }
      var m; try { m = JSON.parse(ev.data); } catch (e) { return; }
      if (m.t === 's' && N.role === 'guest') { onSnap(m); }
      else if (m.t === 'i' && N.role === 'host') { onInput(m); }
      else if (m.t === 'png') { send({ t: 'pog', k: m.k }); }
      else if (m.t === 'pog') { N.stats.rtt = performance.now() - m.k; }
      else onEvent(m);
    };
    ws.onclose = function (ev) { if (N.ws !== mine) return; N.ws = null; N.open = false; onEvent({ t: 'closed', code: ev.code, reason: ev.reason, opened: N.wasOpen }); };
    ws.onerror = function () { };
    clearInterval(N.pingI);
    N.pingI = setInterval(function () { if (N.open && N.ws) { try { N.ws.send('ping'); } catch (e) { } } }, 5000);
  };
  N.close = function (silent) {
    clearInterval(N.pingI);
    var ws = N.ws; N.ws = null; N.open = false;
    if (ws) { try { ws.close(1000, 'bye'); } catch (e) { } }
    if (!silent) { N.role = null; N.code = null; }
  };
  function send(o) { if (!N.open || !N.ws) return; var s = JSON.stringify(o); try { N.ws.send(s); N.stats.tx++; N.stats.txB += s.length; } catch (e) { } }
  N.send = send;
  N.timedOut = function (now) { return N.open && now - N.lastRx > TIMEOUT; };
  N.measure = function () { send({ t: 'png', k: performance.now() }); };

  /* ---------- host: sound capture ---------- */
  var origSfx = G.sfx;
  G.sfx = function (n) { if (N.role === 'host' && N.rec) { N.evq.push(n); if (N.evq.length > 40) N.evq.shift(); } origSfx(n); };

  /* ---------- host: guest input ---------- */
  function onInput(m) {
    if (typeof m.q !== 'number' || m.q <= N.inSeq) return; N.inSeq = m.q;
    var g = N.gin;
    g.mx = Math.max(-1, Math.min(1, +m.mx || 0)); g.mz = Math.max(-1, Math.min(1, +m.mz || 0));
    if (m.c) g.catchP = true; if (m.j) g.jumpP = true; if (m.p) g.passP = true; if (m.s) g.spP = true;
    if (m.thr) { if (!g.throwHeld) g.thrSeen = false; g.throwHeld = true; g.relPending = false; }
    else if (g.throwHeld) { if (g.thrSeen) g.throwHeld = false; else g.relPending = true; }
  }
  N.afterStep = function () {   // host: one simulation step has seen the guest's presses
    var g = N.gin; g.catchP = g.jumpP = g.passP = g.spP = false; g.thrSeen = true;
    if (g.relPending) { g.relPending = false; g.throwHeld = false; }
  };

  /* ---------- host: snapshots ---------- */
  function encBody(b) {
    var f = (b.mode === 'rag' ? 1 : 0) | (b.hold ? 2 : 0) | (b.charging ? 4 : 0) | (b.cheer ? 8 : 0) | (b.sad ? 16 : 0) | (b.pendingOut ? 32 : 0) | (b.catchT > 0 ? 64 : 0) | (b.flash > 0 ? 128 : 0);
    var a = [r1(b.x), r3(b.z), r1(b.h), b.face, Math.round(b.sc * 100), f, ROLES.indexOf(b.role), b.eyes, Math.round(b.charge * 100)];
    for (var k = 0; k < 11; k++) a.push(r1(b.pts[k].x), r1(b.pts[k].y));
    return a;
  }
  function encBall(B) {
    return [r1(B.x), r3(B.z), r1(B.h), r1(B.r), BST.indexOf(B.st), B.sp ? G.SPECIALS.indexOf(B.sp) : -1, r1(B.vx), r1(B.vz), Math.round(B.spin * 100) / 100, B.holder ? B.holder.id : -1, B.ph || 0, B.alive ? 1 : 0, B.team, B.pass ? 1 : 0];
  }
  function rnd(o) { var c = {}; for (var k in o) { var v = o[k]; if (k === '_s') continue; c[k] = typeof v === 'number' ? Math.round(v * 10) / 10 : v; } return c; }
  N.hostSend = function (M, now, force) {
    if (!N.open || N.role !== 'host' || !M) return;
    if (!force && now - N.lastSnap < SNAP_MS) return; N.lastSnap = now;
    var e = {}, i, x;
    if (N.evq.length) { e.s = N.evq; N.evq = []; }
    var fx = []; for (i = 0; i < M.fx.length; i++) { x = M.fx[i]; if (!x._s) { x._s = 1; if (fx.length < 40) fx.push(rnd(x)); } } if (fx.length) e.fx = fx;
    var pp = []; for (i = 0; i < M.pops.length; i++) { x = M.pops[i]; if (!x._s) { x._s = 1; pp.push(rnd(x)); } } if (pp.length) e.p = pp;
    var ww = []; for (i = 0; i < M.wows.length; i++) { x = M.wows[i]; if (!x._s) { x._s = 1; ww.push(rnd(x)); } } if (ww.length) e.w = ww;
    if (M.ban !== N.lastBan) { N.lastBan = M.ban; if (M.ban) { var bn = M.ban; e.ban = { k: bn.k, a: bn.a, ks: bn.ks, txt: bn.txt, sub: bn.sub, col: bn.col, dur: bn.dur, sp: bn.sp, team: bn.team }; } }
    send({ t: 's', n: ++N.seq, ht: Math.round(now), L: G.lang,
      g: [STATES.indexOf(M.state), M.round, M.score[0], M.score[1], Math.round(M.time * 10), Math.round(M.meter[0] * 100), Math.round(M.meter[1] * 100), G.SPECIALS.indexOf(M.nextSp[0]), G.SPECIALS.indexOf(M.nextSp[1]),
        Math.round(M.shake), Math.round(M.flash * 100), Math.round(M.crowd * 100), M.slow > 0 ? 1 : 0, M.nearSlow ? 1 : 0, M.ctrl, M.ctrl2, M.winner, M.mp === M.round ? 1 : 0],
      C: M.bodies.map(function (b) { return b.ch; }), b: M.bodies.map(encBody), B: encBall(M.ball), F: M.fakes.filter(function (f) { return f.alive; }).map(encBall), e: e });
  };

  /* ---------- guest: input ---------- */
  N.guestSend = function (inp, now) {   // inp from main.readInput(); one-shot presses accumulate until sent
    var P = N.pend, L = N.lastInp, held = inp.throwHeld ? 1 : 0;
    if (inp.catchP) P.c = 1; if (inp.jumpP) P.j = 1; if (inp.passP) P.p = 1; if (inp.spP) P.s = 1;
    if (held && !(L && L.thr)) P.thr = 1;   // a THROW press the host has not heard about yet (catches very quick taps)
    var mx = Math.round(inp.mx * 10) / 10, mz = Math.round(inp.mz * 10) / 10, thr = held || P.thr ? 1 : 0;
    var changed = !L || L.mx !== mx || L.mz !== mz || L.thr !== thr || P.c || P.j || P.p || P.s;
    if (now - N.lastInpT < INP_MS) return;
    if (!changed && now - N.lastInpT < IDLE_MS) return;
    send({ t: 'i', q: ++N.inSeq, mx: mx, mz: mz, thr: thr, c: P.c, j: P.j, p: P.p, s: P.s });
    N.lastInpT = now; N.lastInp = { mx: mx, mz: mz, thr: thr };
    N.pend = { c: 0, j: 0, p: 0, s: 0, thr: 0 };
  };

  /* ---------- guest: snapshots -> interpolated view ---------- */
  function onSnap(m) {
    var now = performance.now(), est = m.ht - now;
    if (N.off == null || est > N.off) N.off = est; else N.off += (est - N.off) * 0.002;
    if (N.buf.length && m.ht <= N.buf[N.buf.length - 1].ht) return;
    N.buf.push(m); if (N.buf.length > 40) N.buf.shift();
    if (N.onEvent && !N.gotSnap) { N.gotSnap = true; N.onEvent({ t: 'first_snap' }); }
  }
  function mkView(n) {
    var V = { versus: true, myTeam: 1, team: G.FRIEND, bodies: [], ball: mkB(), fakes: [], fx: [], pops: [], wows: [], ban: null, hint: false, hitstop: 0,
      score: [0, 0], meter: [0, 0], nextSp: ['banana', 'banana'], state: 'intro', round: 1, time: G.ROUND_T, shake: 0, flash: 0, crowd: 0, slow: 0, nearSlow: 0, ctrl: n, ctrl2: -1, n: n, winner: -1, mp: 0, spFired: {}, appliedHt: 0 };
    for (var t = 0; t < 2; t++) { var td = t ? G.FRIEND : G.MYTEAM; for (var i = 0; i < n; i++) { var b = { id: t * n + i, team: t, i: i, skin: td.skins[i % 3], hat: td.hats[(i + (i / 3 | 0)) % 3], pts: [], x: 0, z: 0.5, h: 0, vx: 0, vz: 0, face: 1, sc: 1, mode: 'stand', role: 'in' }; for (var k = 0; k < 11; k++) b.pts.push({ x: 0, y: 0 }); V.bodies.push(b); } }
    return V;
  }
  function mkB() { return { x: 0, z: 0.5, h: 11, r: 11, st: 'loose', sp: null, vx: 0, vz: 0, spin: 0, holder: null, ph: 0, alive: true, team: -1, pass: false, trail: [] }; }
  function L(a, b, u) { return a + (b - a) * u; }
  function decBody(o, a, c, u) {   // a = earlier snapshot body, c = later
    o.x = L(a[0], c[0], u); o.z = L(a[1], c[1], u) / 1000; o.h = L(a[2], c[2], u); o.face = a[3]; o.sc = L(a[4], c[4], u) / 100;
    var f = a[5]; o.mode = f & 1 ? 'rag' : 'stand'; o.hold = !!(f & 2); o.charging = !!(f & 4); o.cheer = !!(f & 8); o.sad = !!(f & 16); o.pendingOut = !!(f & 32); o.catchT = f & 64 ? 0.2 : 0; o.flash = f & 128 ? 0.1 : 0;
    o.role = ROLES[a[6]] || 'in'; o.eyes = a[7]; o.charge = a[8] / 100;
    o.vx = (c[0] - a[0]) * 20; o.vz = (c[1] - a[1]) / 1000 * G.ZPX * 20;
    for (var k = 0; k < 11; k++) { o.pts[k].x = L(a[9 + k * 2], c[9 + k * 2], u); o.pts[k].y = L(a[10 + k * 2], c[10 + k * 2], u); }
  }
  function decBall(o, a, c, u, V) {
    var same = c && a[4] === c[4]; if (!same) { c = a; u = 0; }
    o.x = L(a[0], c[0], u); o.z = L(a[1], c[1], u) / 1000; o.h = L(a[2], c[2], u); o.r = L(a[3], c[3], u);
    o.st = BST[a[4]] || 'loose'; o.sp = a[5] >= 0 ? G.SPECIALS[a[5]] : null; o.vx = a[6]; o.vz = a[7]; o.spin = L(a[8], c[8], u); o.holder = a[9] >= 0 ? V.bodies[a[9]] : null; o.ph = a[10]; o.alive = !!a[11]; o.team = a[12]; o.pass = !!a[13];
  }
  var SWAP = { roundWin: 'roundLose', roundLose: 'roundWin' }, SWCOL = { '#8ef0a8': '#ff9d5c', '#ff9d5c': '#8ef0a8' };
  function applyEvents(V, s) {
    var e = s.e || {}, i;
    if (e.s) e.s.forEach(function (n) { origSfx(n === 'win' ? 'lose' : n === 'lose' ? 'win' : n); });
    if (e.fx) for (i = 0; i < e.fx.length; i++) V.fx.push(e.fx[i]);
    if (V.fx.length > 220) V.fx.splice(0, V.fx.length - 220);
    if (e.p) for (i = 0; i < e.p.length; i++) { var p = e.p[i]; p.txt = G.tr(p.txt, s.L); p.t = 0; V.pops.push(p); }
    if (e.w) for (i = 0; i < e.w.length; i++) { var w = e.w[i]; w.txt = G.tr(w.txt, s.L); w.t = 0; V.wows.push(w); }
    if (e.ban) {
      var b = e.ban, sw = b.k === 'roundWin' || b.k === 'roundLose' || b.ks === 'roundWin' || b.ks === 'roundLose';
      V.ban = { txt: b.k ? G.t(SWAP[b.k] || b.k, b.a) : b.txt, sub: b.ks ? G.t(SWAP[b.ks] || b.ks) : (b.sub || null), col: sw ? (SWCOL[b.col] || b.col) : b.col, dur: b.dur, sp: b.sp, team: b.team, t: 0 };
    }
  }
  N.guestView = function (now) {
    var buf = N.buf;
    if (!buf.length) return N.view || (N.view = mkView(5));
    var nb = buf[buf.length - 1].b.length / 2;
    if (!N.view || N.view.n !== nb) { N.view = mkView(nb); buf.forEach(function (s) { s.done = 1; }); buf.splice(0, buf.length - 1); }
    var V = N.view;
    var rt = now + N.off - DELAY, i0 = 0;
    while (i0 < buf.length - 1 && buf[i0 + 1].ht <= rt) i0++;
    var s0 = buf[i0], s1 = buf[Math.min(i0 + 1, buf.length - 1)], u = s1.ht > s0.ht ? Math.max(0, Math.min(1, (rt - s0.ht) / (s1.ht - s0.ht))) : 0;
    // events of every snapshot whose time has passed
    for (var j = 0; j < buf.length; j++) { var sj = buf[j]; if (!sj.done && (sj.ht <= rt || j < i0)) { sj.done = 1; applyEvents(V, sj); } }
    if (i0 > 2) buf.splice(0, i0 - 2);
    var g = s0.g, g1 = s1.g;
    V.state = STATES[g[0]]; V.round = g[1]; V.score[0] = g[2]; V.score[1] = g[3]; V.time = L(g[4], g1[4], u) / 10; V.meter[0] = g[5] / 100; V.meter[1] = g[6] / 100;
    V.nextSp[0] = G.SPECIALS[g[7]]; V.nextSp[1] = G.SPECIALS[g[8]]; V.shake = g1[9]; V.flash = g1[10] / 100; V.crowd = g1[11] / 100; V.slow = g[12]; V.nearSlow = g[13];
    V.ctrl = g[15]; V.ctrl2 = -1; V.winner = g[16]; V.mp = g[17] ? V.round : 0;
    if (s0.b.length !== V.bodies.length) s0 = s1;
    if (s1.b.length !== V.bodies.length) s1 = s0;
    // character looks (optional field C: one character id per body)
    if (s0.C && s0.C.length === V.bodies.length && s0.C.join() !== V.cIds) { V.cIds = s0.C.join(); V.bodies.forEach(function (o, k) { var C = G.CHARS[s0.C[k]]; if (!C) return; o.ch = s0.C[k]; o.skin = C.skin; o.hat = C.hat; o.hs = C.hs; o.th = C.th; o.sp = C.sp; }); }
    for (var k = 0; k < V.bodies.length; k++) decBody(V.bodies[k], s0.b[k], s1.b[k], u);
    var pb = V.ball.st;
    decBall(V.ball, s0.B, s1.B, u, V);
    var B = V.ball; if (B.st === 'fly') { B.trail.push(B.x, G.FY(B.z) - B.h); if (B.trail.length > 24) B.trail.splice(0, 2); } else if (B.trail.length) B.trail.splice(0, 2); if (pb !== B.st && B.st === 'fly') B.trail = [];
    while (V.fakes.length < s0.F.length) V.fakes.push(mkB()); V.fakes.length = s0.F.length;
    for (k = 0; k < s0.F.length; k++) decBall(V.fakes[k], s0.F[k], s1.F[k], u, V);
    G.audio.intensity = V.state === 'over' ? 0 : 1;
    return V;
  };
  N.lagMs = function () { return N.buf && N.buf.length ? Math.round(performance.now() + N.off - N.buf[N.buf.length - 1].ht) : 0; };
})();
