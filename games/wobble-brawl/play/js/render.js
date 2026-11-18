/* Rendering: world, fighters, items, particles, HUD, banners, replay overlay. */
(function () {
  'use strict';
  var G = window.G, W = G.W, H = G.H, TAU = Math.PI * 2, INK = '#1b1b2f';
  G.SKINS = [
    { id: 'red', col: '#ff5a4f', cost: 0 }, { id: 'blue', col: '#3fa9ff', cost: 0 }, { id: 'lime', col: '#8ee53f', cost: 100 }, { id: 'sun', col: '#ffd23f', cost: 100 },
    { id: 'gum', col: '#ff8fd0', cost: 150 }, { id: 'violet', col: '#a77bff', cost: 150 }, { id: 'ghost', col: '#f4f6ff', cost: 250 }, { id: 'shadow', col: '#34364e', cost: 300, out: '#f4f6ff' },
    { id: 'gold', col: '#ffc400', cost: 500 }, { id: 'rainbow', col: '#ff5a4f', cost: 800 }
  ];
  G.HATS = [
    { id: 'none', cost: 0 }, { id: 'cap', cost: 80 }, { id: 'band', cost: 100 }, { id: 'party', cost: 120 }, { id: 'top', cost: 160 },
    { id: 'cone', cost: 200 }, { id: 'chef', cost: 200 }, { id: 'prop', cost: 260 }, { id: 'halo', cost: 320 }, { id: 'crown', cost: 450 }
  ];
  var SK = {}; G.SKINS.forEach(function (s) { SK[s.id] = s; });
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function skinCol(id, now) { if (id === 'rainbow') return 'hsl(' + ((now * 140) % 360 | 0) + ',95%,62%)'; return (SK[id] || SK.red).col; }
  G.skinCol = skinCol;

  function drawHat(c, hat, now) {
    switch (hat) {
      case 'cap': c.fillStyle = INK; c.beginPath(); c.arc(0, -3, 13.5, Math.PI, TAU); c.fill(); c.fillRect(0, -6.5, 22, 6); c.fillStyle = '#e63946'; c.beginPath(); c.arc(0, -4, 11.5, Math.PI, TAU); c.fill(); c.fillRect(2, -6, 18, 3); c.fillStyle = '#fff'; c.beginPath(); c.arc(0, -15, 2, 0, TAU); c.fill(); break;
      case 'band': c.strokeStyle = INK; c.lineWidth = 8; c.beginPath(); c.moveTo(-11, -5); c.lineTo(11, -5); c.stroke(); c.strokeStyle = '#e63946'; c.lineWidth = 5; c.beginPath(); c.moveTo(-11, -5); c.lineTo(11, -5); c.stroke(); c.lineWidth = 4; c.beginPath(); var w = Math.sin(now * 9) * 4; c.moveTo(-11, -5); c.quadraticCurveTo(-20, -8 + w, -27, -2 + w); c.moveTo(-11, -5); c.quadraticCurveTo(-19, 0 - w, -24, 7 - w); c.stroke(); break;
      case 'party': c.fillStyle = INK; c.beginPath(); c.moveTo(-11, -7); c.lineTo(2, -36); c.lineTo(12, -7); c.fill(); c.fillStyle = '#4cc9f0'; c.beginPath(); c.moveTo(-8, -8); c.lineTo(2, -32); c.lineTo(9, -8); c.fill(); c.fillStyle = '#ffd166'; c.fillRect(-5, -14, 12, 3); c.beginPath(); c.arc(2, -34, 4, 0, TAU); c.fill(); break;
      case 'top': c.fillStyle = INK; c.fillRect(-16, -11, 32, 6); c.fillRect(-10.5, -34, 21, 25); c.fillStyle = '#e63946'; c.fillRect(-10.5, -16, 21, 5); c.fillStyle = 'rgba(255,255,255,0.25)'; c.fillRect(-8, -32, 4, 14); break;
      case 'cone': c.fillStyle = INK; c.beginPath(); c.moveTo(-15, -5); c.lineTo(15, -5); c.lineTo(15, -10); c.lineTo(5, -36); c.lineTo(-5, -36); c.lineTo(-15, -10); c.fill(); c.fillStyle = '#ff7b00'; c.beginPath(); c.moveTo(-10, -9); c.lineTo(10, -9); c.lineTo(3.5, -33); c.lineTo(-3.5, -33); c.fill(); c.fillRect(-13, -9, 26, 3); c.fillStyle = '#fff'; c.beginPath(); c.moveTo(-7.6, -18); c.lineTo(7.6, -18); c.lineTo(5.8, -24); c.lineTo(-5.8, -24); c.fill(); break;
      case 'chef': c.fillStyle = INK; c.beginPath(); c.arc(-7, -24, 10, 0, TAU); c.arc(7, -24, 10, 0, TAU); c.arc(0, -29, 10, 0, TAU); c.fill(); c.fillRect(-11, -22, 22, 16); c.fillStyle = '#fff'; c.beginPath(); c.arc(-7, -24, 7.5, 0, TAU); c.arc(7, -24, 7.5, 0, TAU); c.arc(0, -29, 7.5, 0, TAU); c.fill(); c.fillRect(-8.5, -22, 17, 13.5); c.fillStyle = '#dfe6f0'; c.fillRect(-8.5, -12, 17, 3); break;
      case 'prop': c.fillStyle = INK; c.beginPath(); c.arc(0, -3, 13.5, Math.PI, TAU); c.fill(); c.fillStyle = '#06d6a0'; c.beginPath(); c.arc(0, -4, 11.5, Math.PI, TAU); c.fill(); c.fillStyle = '#ffd166'; c.beginPath(); c.moveTo(0, -4); c.arc(0, -4, 11.5, Math.PI * 1.33, Math.PI * 1.67); c.fill(); c.strokeStyle = INK; c.lineWidth = 3; c.beginPath(); c.moveTo(0, -15); c.lineTo(0, -22); c.stroke(); var pw = Math.cos(now * 24) * 13; c.lineWidth = 6; c.beginPath(); c.moveTo(-pw, -22); c.lineTo(pw, -22); c.stroke(); c.strokeStyle = '#e63946'; c.lineWidth = 3; c.beginPath(); c.moveTo(-pw, -22); c.lineTo(pw, -22); c.stroke(); break;
      case 'halo': c.strokeStyle = INK; c.lineWidth = 6; c.beginPath(); c.ellipse(0, -20 + Math.sin(now * 4) * 1.5, 12, 4, 0, 0, TAU); c.stroke(); c.strokeStyle = '#ffe45c'; c.lineWidth = 3; c.stroke(); break;
      case 'crown': c.fillStyle = INK; c.beginPath(); c.moveTo(-13, -5); c.lineTo(-15, -26); c.lineTo(-6, -17); c.lineTo(0, -29); c.lineTo(6, -17); c.lineTo(15, -26); c.lineTo(13, -5); c.fill(); c.fillStyle = '#ffc400'; c.beginPath(); c.moveTo(-10.5, -7.5); c.lineTo(-12, -20); c.lineTo(-5.5, -13.5); c.lineTo(0, -24); c.lineTo(5.5, -13.5); c.lineTo(12, -20); c.lineTo(10.5, -7.5); c.fill(); c.fillStyle = '#e63946'; c.beginPath(); c.arc(0, -12, 2.4, 0, TAU); c.fill(); break;
    }
  }
  function drawWeapon(c, type, x, y, ang, lit, now) {
    c.save(); c.translate(x, y); c.rotate(ang); c.lineCap = 'round';
    if (type === 'noodle') {
      c.strokeStyle = INK; c.lineWidth = 13; c.beginPath(); c.moveTo(-6, 0); c.lineTo(62, 0); c.stroke();
      c.strokeStyle = '#ff70a6'; c.lineWidth = 8; c.beginPath(); c.moveTo(-6, 0); c.lineTo(62, 0); c.stroke();
      c.strokeStyle = 'rgba(255,255,255,0.55)'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(-2, -2); c.lineTo(58, -2); c.stroke();
    } else if (type === 'hammer') {
      c.strokeStyle = INK; c.lineWidth = 9; c.beginPath(); c.moveTo(-6, 0); c.lineTo(36, 0); c.stroke(); c.strokeStyle = '#ffd166'; c.lineWidth = 5; c.beginPath(); c.moveTo(-6, 0); c.lineTo(36, 0); c.stroke();
      c.fillStyle = INK; G.rr(c, 30, -24, 26, 48, 8); c.fill(); c.fillStyle = '#ef233c'; G.rr(c, 32.5, -21.5, 21, 43, 6); c.fill();
      c.fillStyle = '#ffd166'; c.fillRect(32.5, -21.5, 21, 7); c.fillRect(32.5, 14.5, 21, 7); c.fillStyle = 'rgba(255,255,255,0.4)'; c.fillRect(35, -12, 4, 24);
    } else if (type === 'shield') {
      c.fillStyle = INK; c.beginPath(); c.ellipse(9, 0, 9.5, 24, 0, 0, TAU); c.fill(); c.fillStyle = '#adb5bd'; c.beginPath(); c.ellipse(9, 0, 7, 21.5, 0, 0, TAU); c.fill();
      c.fillStyle = '#e9ecef'; c.beginPath(); c.ellipse(11, -4, 3, 13, 0, 0, TAU); c.fill(); c.fillStyle = INK; c.beginPath(); c.arc(17, 0, 4.5, 0, TAU); c.fill();
    } else if (type === 'cracker') {
      c.strokeStyle = INK; c.lineWidth = 14; c.beginPath(); c.moveTo(-4, 0); c.lineTo(16, 0); c.stroke(); c.strokeStyle = '#ef233c'; c.lineWidth = 9; c.beginPath(); c.moveTo(-4, 0); c.lineTo(16, 0); c.stroke();
      c.strokeStyle = '#ffd166'; c.lineWidth = 9; c.lineCap = 'butt'; c.beginPath(); c.moveTo(3, 0); c.lineTo(8, 0); c.stroke();
      c.strokeStyle = INK; c.lineWidth = 2; c.beginPath(); c.moveTo(20, 0); c.quadraticCurveTo(26, -6, 30, -2); c.stroke();
      var fl = 3 + Math.sin(now * 40) * 2; c.fillStyle = lit ? '#fff' : '#ffd166'; c.beginPath(); c.arc(30, -2, lit ? fl + 2 : fl * 0.6, 0, TAU); c.fill();
    }
    c.restore();
  }
  G.drawWeapon = drawWeapon;

  function drawFighter(c, s, now) {
    if (s.gone) return; if (s.blink && ((now * 16) | 0) % 2) return;
    var p = s.p, sk = SK[s.skin] || SK.red, col = s.flash ? '#ffffff' : skinCol(s.skin, now), out = sk.out || INK, i;
    c.lineCap = 'round'; c.lineJoin = 'round';
    if (s.tr) { c.strokeStyle = 'rgba(255,255,255,0.55)'; for (i = 2; i < s.tr.length; i += 2) { c.lineWidth = 3 + i * 0.9; c.beginPath(); c.moveTo(s.tr[i - 2], s.tr[i - 1]); c.lineTo(s.tr[i], s.tr[i + 1]); c.stroke(); } }
    function back() { c.moveTo(p[2], p[3]); c.lineTo(p[10], p[11]); c.lineTo(p[12], p[13]); c.moveTo(p[4], p[5]); c.lineTo(p[18], p[19]); c.lineTo(p[20], p[21]); }
    function front() { c.moveTo(p[2], p[3]); c.lineTo(p[4], p[5]); c.lineTo(p[14], p[15]); c.lineTo(p[16], p[17]); c.moveTo(p[2], p[3]); c.lineTo(p[6], p[7]); c.lineTo(p[8], p[9]); }
    c.strokeStyle = out; c.lineWidth = 12.5; c.beginPath(); back(); c.stroke();
    c.strokeStyle = col; c.lineWidth = 7.5; c.beginPath(); back(); c.stroke(); c.strokeStyle = 'rgba(0,0,20,0.25)'; c.beginPath(); back(); c.stroke();
    if (s.wp) drawWeapon(c, s.wp, p[8], p[9], s.wa, false, now);
    c.strokeStyle = out; c.lineWidth = 12.5; c.beginPath(); front(); c.stroke();
    c.fillStyle = out; c.beginPath(); c.arc(p[0], p[1], 13.5, 0, TAU); c.fill();
    c.strokeStyle = col; c.lineWidth = 7.5; c.beginPath(); front(); c.stroke();
    c.fillStyle = col; c.beginPath(); c.arc(p[0], p[1], 11, 0, TAU); c.fill();
    if (s.skin === 'gold' && !s.flash) { c.fillStyle = 'rgba(255,255,255,0.55)'; c.beginPath(); c.arc(p[0] - 3, p[1] - 4, 3.5, 0, TAU); c.fill(); }
    // face + hat in head frame
    var tilt = Math.atan2(p[1] - p[3], p[0] - p[2]) + Math.PI / 2;
    c.save(); c.translate(p[0], p[1]); c.rotate(tilt); c.scale(s.face, 1);
    var ek = sk.out ? '#f4f6ff' : INK; c.fillStyle = ek; c.strokeStyle = ek; c.lineWidth = 2.2;
    var e = s.eyes;
    if (e === 2) { c.beginPath(); for (i = 0; i < 2; i++) { var ex = 1 + i * 7; c.moveTo(ex - 2.4, -3.4); c.lineTo(ex + 2.4, 1.4); c.moveTo(ex + 2.4, -3.4); c.lineTo(ex - 2.4, 1.4); } c.stroke(); c.beginPath(); c.arc(5, 6, 2.2, 0, TAU); c.stroke(); }
    else if (e === 1) { c.beginPath(); c.moveTo(-1, -3.5); c.lineTo(3, -1); c.lineTo(-1, 1.5); c.moveTo(10, -3.5); c.lineTo(6, -1); c.lineTo(10, 1.5); c.stroke(); c.beginPath(); c.ellipse(5, 6, 2.5, 3, 0, 0, TAU); c.fill(); }
    else if (e === 3) { c.beginPath(); c.arc(1.5, -0.5, 2.6, Math.PI, TAU); c.moveTo(11.1, -0.5); c.arc(8.5, -0.5, 2.6, Math.PI, TAU); c.stroke(); c.beginPath(); c.arc(5, 3, 4, 0.1, Math.PI - 0.1); c.fill(); }
    else { c.beginPath(); c.arc(2, -1.5, 2.1, 0, TAU); c.arc(8.6, -1.5, 2.1, 0, TAU); c.fill(); if (e === 4) { c.beginPath(); c.moveTo(-1.5, -6.5); c.lineTo(4.5, -4.2); c.moveTo(11.5, -6.5); c.lineTo(6, -4.2); c.stroke(); } }
    if (s.hat && s.hat !== 'none') drawHat(c, s.hat, now);
    c.restore();
  }
  G.drawFighter = drawFighter;

  function star(c, x, y, r, rot) { c.beginPath(); for (var i = 0; i < 8; i++) { var a = rot + i * Math.PI / 4, rr = i % 2 ? r * 0.42 : r; c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } c.closePath(); c.fill(); }
  function banner(c, txt, x, y, size, col, sc, alpha, rot) {
    c.save(); c.translate(x, y); if (rot) c.rotate(rot); c.scale(sc, sc); c.globalAlpha = clamp(alpha, 0, 1);
    c.font = 'italic 900 ' + size + 'px ' + G.FONT; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round';
    c.fillStyle = 'rgba(0,0,0,0.35)'; c.fillText(txt, 5, 8);
    c.strokeStyle = INK; c.lineWidth = size * 0.2; c.strokeText(txt, 0, 0); c.fillStyle = col; c.fillText(txt, 0, 0);
    c.restore();
  }
  function label(c, txt, x, y, size, col, align) { c.font = '900 ' + size + 'px ' + G.FONT; c.textAlign = align || 'left'; c.textBaseline = 'middle'; c.lineJoin = 'round'; c.strokeStyle = INK; c.lineWidth = size * 0.28; c.strokeText(txt, x, y); c.fillStyle = col; c.fillText(txt, x, y); }
  function easeOutBack(t) { t = clamp(t, 0, 1); var s = 1.9; t -= 1; return t * t * ((s + 1) * t + s) + 1; }

  function hud(c, M, now) {
    for (var i = 0; i < 2; i++) {
      var f = M.f[i], col = f.skin === 'shadow' ? '#b9bbd6' : skinCol(f.skin, now), x0 = i === 0 ? 44 : W - 44, dir = i === 0 ? 1 : -1, bw = 470, y = 30, h = 28;
      function bar(w, fill) { c.fillStyle = fill; c.beginPath(); c.moveTo(x0, y); c.lineTo(x0 + dir * w, y); c.lineTo(x0 + dir * (w - 12), y + h); c.lineTo(x0 - dir * 12, y + h); c.closePath(); c.fill(); }
      c.save(); c.lineJoin = 'round';
      c.strokeStyle = INK; c.lineWidth = 9; c.beginPath(); c.moveTo(x0, y); c.lineTo(x0 + dir * bw, y); c.lineTo(x0 + dir * (bw - 12), y + h); c.lineTo(x0 - dir * 12, y + h); c.closePath(); c.stroke();
      bar(bw, '#2b2d42'); if (f.hpShow > 0.5) bar(bw * f.hpShow / 100, '#ffffff');
      var low = f.hp <= 30 && ((now * 6) | 0) % 2; if (f.hp > 0) bar(bw * f.hp / 100, low ? '#ff3b3b' : col);
      c.fillStyle = 'rgba(255,255,255,0.28)'; c.fillRect(Math.min(x0, x0 + dir * bw * f.hp / 100), y + 3, Math.max(0, bw * f.hp / 100 - 8), 6);
      c.restore();
      label(c, f.name, x0 + dir * 2, y + h + 22, 22, '#fff', i === 0 ? 'left' : 'right');
      for (var k = 0; k < 2; k++) { var px = x0 + dir * (bw - 26 - k * 30), py = y + h + 20; c.fillStyle = INK; c.beginPath(); c.arc(px, py, 12, 0, TAU); c.fill(); c.fillStyle = k < M.score[i] ? '#ffd23f' : '#4a4e69'; c.beginPath(); c.arc(px, py, 8, 0, TAU); c.fill(); }
      if (f.weapon) { var wx = x0 + dir * 150; c.save(); c.translate(wx, y + h + 22); c.scale(0.55, 0.55); G.drawWeapon(c, f.weapon.type, -24, 0, 0, false, now); c.restore(); for (var u = 0; u < f.weapon.uses; u++) { var ux = wx + dir * (34 + u * 9) - 3; c.fillStyle = '#fff'; c.fillRect(ux, y + h + 16, 5, 12); c.strokeStyle = INK; c.lineWidth = 1.5; c.strokeRect(ux, y + h + 16, 5, 12); } }
    }
    var tt = Math.max(0, Math.ceil(M.timer)), hot = tt <= 5 && M.phase === 'fight', sc = hot ? 1 + (1 - (M.timer % 1)) * 0.12 : 1;
    c.save(); c.translate(W / 2, 46); c.scale(sc, sc); c.fillStyle = INK; c.beginPath(); c.arc(0, 0, 40, 0, TAU); c.fill(); c.fillStyle = hot ? '#ff3b3b' : '#2b2d42'; c.beginPath(); c.arc(0, 0, 34, 0, TAU); c.fill();
    c.font = '900 38px ' + G.FONT; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#fff'; c.fillText(tt, 0, 3); c.restore();
  }

  function world(c, M, v, now) {
    var i, ps = M.map.plats;
    c.drawImage(M.map.bg, 0, 0, W, H);
    M.map.def.anim(c, v.t);
    for (i = 0; i < ps.length; i++) G.maps.drawPlat(c, ps[i], v.t);
    for (i = 0; i < v.it.length; i++) {
      var it = v.it[i]; if (it.blink && ((now * 10) | 0) % 2) continue;
      if (!it.lit) { c.fillStyle = 'rgba(255,255,255,' + (0.16 + Math.sin(now * 6) * 0.08) + ')'; c.beginPath(); c.arc(it.x, it.y, 30, 0, TAU); c.fill(); }
      var off = it.type === 'noodle' ? -28 : it.type === 'hammer' ? -22 : -6;
      c.save(); c.translate(it.x, it.y - 4); c.rotate(it.ang); drawWeapon(c, it.type, off, 0, 0, it.lit, now); c.restore();
    }
    // draw the fighter being held behind the holder, attackers on top
    var order = (M.f[0].state === 'atk' || M.f[1].state === 'held' || M.f[1].state === 'dead') ? [1, 0] : [0, 1];
    for (i = 0; i < 2; i++) drawFighter(c, v.f[order[i]], now);
    for (i = 0; i < v.fx.length; i++) { var fx = v.fx[i], k = fx.t / 0.16, r = (fx.big ? 60 : 34) * (0.5 + k * 0.7); c.globalAlpha = 1 - k; c.fillStyle = '#fff'; star(c, fx.x, fx.y, r, k * 0.6); c.fillStyle = '#ffe45c'; star(c, fx.x, fx.y, r * 0.6, -k); c.globalAlpha = 1; }
  }
  function particles(c, M) {
    var i, p, a;
    for (i = 0; i < M.parts.length; i++) {
      p = M.parts[i]; a = p.life / p.max;
      if (p.kind === 0) { c.globalAlpha = a * 0.8; c.fillStyle = p.col; c.beginPath(); c.arc(p.x, p.y, p.size, 0, TAU); c.fill(); }
      else if (p.kind === 1) { c.globalAlpha = Math.min(1, a * 2); c.fillStyle = INK; star(c, p.x, p.y, p.size + 2.5, p.rot); c.fillStyle = p.col; star(c, p.x, p.y, p.size, p.rot); }
      else if (p.kind === 2) { c.globalAlpha = Math.min(1, a * 1.6); c.strokeStyle = p.col; c.lineWidth = p.size; c.lineCap = 'round'; c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(p.x - p.vx * 0.03, p.y - p.vy * 0.03); c.stroke(); }
      else if (p.kind === 3) { c.globalAlpha = a; c.strokeStyle = p.col; c.lineWidth = 6 * a + 1; c.beginPath(); c.arc(p.x, p.y, p.size + (1 - a) * 70, 0, TAU); c.stroke(); }
      else { c.globalAlpha = Math.min(1, a * 3); c.fillStyle = p.col; c.save(); c.translate(p.x, p.y); c.rotate(p.rot); c.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2); c.restore(); }
    }
    c.globalAlpha = 1;
    for (i = 0; i < M.pops.length; i++) { var q = M.pops[i], sc = easeOutBack(q.t / 0.14); banner(c, q.txt, q.x, q.y - q.t * 40, q.size, q.col, sc, q.t > 0.45 ? 1 - (q.t - 0.45) / 0.25 : 1, q.rot); }
  }

  function keycap(c, x, y, txt, w) {
    w = w || 44; c.fillStyle = INK; G.rr(c, x - w / 2 - 3, y - 22, w + 6, 50, 11); c.fill(); c.fillStyle = '#c9cbe0'; G.rr(c, x - w / 2, y - 19, w, 44, 9); c.fill(); c.fillStyle = '#fff'; G.rr(c, x - w / 2, y - 19, w, 37, 9); c.fill();
    c.font = '900 ' + (txt.length > 1 ? 17 : 24) + 'px ' + G.FONT; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = INK; c.fillText(txt, x, y);
  }
  function tutorial(c, M, now, a) {
    var acts = ['move', 'jump', 'punch', 'kick', 'grab'], touch = M.cfg.touch, two = M.mode === '2p', i;
    var k1 = [['A', 'D'], ['W'], ['F'], ['G'], ['H']], k2 = [['\u2190', '\u2192'], ['\u2191'], ['J'], ['K'], ['L']];
    var tc = ['#ffffff', '#8ef0a8', '#ffd23f', '#ff9ecb', '#6ecbff'], tl = [G.t('stickL'), 'JUMP', 'HIT', 'KICK', 'GRAB'];
    if (G.lang === 'ko') tl = [G.t('stickL'), '점프', '펀치', '킥', '잡기'];
    c.save(); c.globalAlpha = clamp(a, 0, 1);
    c.fillStyle = 'rgba(13,11,30,0.6)'; c.fillRect(0, 0, W, H);
    var ph = touch ? 400 : 452, py = (H - ph) / 2 + 10;
    c.fillStyle = INK; G.rr(c, 86, py - 6, W - 172, ph + 18, 34); c.fill(); c.fillStyle = '#2b2d52'; G.rr(c, 92, py, W - 184, ph, 28); c.fill();
    banner(c, G.t('howto'), W / 2, py + 44, 50, '#ffd23f', 1, a, -0.02);
    for (i = 0; i < 5; i++) {
      var x = 212 + i * 214, y = py + 92;
      c.fillStyle = i === 3 ? '#4a3f7a' : '#3a3c6a'; G.rr(c, x - 96, y, 192, ph - 112, 20); c.fill();
      if (i === 3) { c.strokeStyle = '#ff9ecb'; c.lineWidth = 4; G.rr(c, x - 96, y, 192, ph - 112, 20); c.stroke(); }
      var p = G.posePts(x - (i === 3 || i === 2 || i === 4 ? 12 : 0), y + 138, acts[i], now);
      drawFighter(c, { p: p, face: 1, eyes: i >= 2 ? 4 : 0, wp: null, wa: 0, skin: M.f[0].skin, hat: M.f[0].hat, flash: false, blink: false, gone: false, tr: null }, now);
      label(c, G.t('a_' + acts[i]), x, y + 168, 21, '#fff', 'center');
      if (touch) { c.fillStyle = INK; c.beginPath(); c.arc(x, y + 228, 36, 0, TAU); c.fill(); c.fillStyle = tc[i]; c.beginPath(); c.arc(x, y + 228, 31, 0, TAU); c.fill(); c.font = '900 16px ' + G.FONT; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = INK; c.fillText(tl[i], x, y + 229); }
      else {
        var ks = k1[i], kk; for (kk = 0; kk < ks.length; kk++) keycap(c, x + (kk - (ks.length - 1) / 2) * 54, y + 216, ks[kk]);
        c.font = '700 15px ' + G.FONT; c.textAlign = 'center'; c.fillStyle = '#c9cbe0'; c.fillText(two ? 'P2' : G.t('orKeys'), x, y + 258);
        ks = k2[i]; c.save(); c.translate(x, y + 296); c.scale(0.8, 0.8); for (kk = 0; kk < ks.length; kk++) keycap(c, (kk - (ks.length - 1) / 2) * 54, 0, ks[kk]); c.restore();
        if (two && i === 0) label(c, 'P1', x - 78, y + 216, 16, '#ffd23f', 'center');
      }
    }
    c.font = '700 16px ' + G.FONT; c.textAlign = 'center'; c.fillStyle = 'rgba(255,255,255,0.7)'; c.fillText(G.t('tapSkip'), W / 2, py + ph - 2 + 26);
    c.restore();
  }
  G.render = function (c, M, S, now) {
    var v, cx, cy, z, replay = M.phase === 'replay', i;
    c.setTransform(S, 0, 0, S, 0, 0);
    if (replay) {
      v = M.ring[clamp(Math.floor(M.rp), 0, M.ring.length - 1)]; G.maps.setTime(M.map, v.t, 0);
      var l = M.roundWinner === 0 ? 1 : 0, lp = v.f[l].p, wp = v.f[1 - l].p, u = clamp((M.rp - M.rp0) / Math.max(1, M.rp1 - M.rp0), 0, 1);
      cx = clamp(lp[4] * 0.7 + wp[4] * 0.3, 60, W - 60); cy = clamp(lp[5] * 0.7 + wp[5] * 0.3, 80, 640) - 30; z = 1.35 + u * 0.2;
    } else { v = G.snapshot(M); cx = M.cam.x; cy = M.cam.y; z = M.cam.z; }
    z = Math.max(z, 1.035); var vw = W / z, vh = H / z; cx = clamp(cx, vw / 2, W - vw / 2); cy = clamp(cy, vh / 2, H - vh / 2);
    c.save(); c.translate(W / 2 + (replay ? 0 : M.shx), H / 2 + (replay ? 0 : M.shy * 0.5)); c.scale(z, z); c.translate(-cx, -cy);
    world(c, M, v, now);
    if (!replay) particles(c, M);
    // name markers
    if (!M.demo && (M.phase === 'intro' || (M.phase === 'fight' && M.pt < 2.6))) {
      for (i = 0; i < 2; i++) { var f = M.f[i], hx = f.pts[0].x, hy = f.pts[0].y - 44 + Math.sin(now * 6) * 3, col = G.skinCol(f.skin, now); label(c, f.name, hx, hy - 14, 20, '#fff', 'center'); c.fillStyle = INK; c.beginPath(); c.moveTo(hx - 10, hy); c.lineTo(hx + 10, hy); c.lineTo(hx, hy + 13); c.fill(); c.fillStyle = col; c.beginPath(); c.moveTo(hx - 6, hy + 2); c.lineTo(hx + 6, hy + 2); c.lineTo(hx, hy + 10); c.fill(); }
    }
    c.restore();
    if (M.demo) { c.fillStyle = 'rgba(16,12,40,0.38)'; c.fillRect(0, 0, W, H); return; }
    if (replay) {
      c.fillStyle = 'rgba(8,8,20,0.92)'; c.fillRect(0, 0, W, 64); c.fillRect(0, H - 64, W, 64);
      if (((now * 3) | 0) % 2) { c.fillStyle = '#ff3b3b'; c.beginPath(); c.arc(60, 32, 10, 0, TAU); c.fill(); }
      label(c, G.t('replay'), 82, 33, 28, '#fff', 'left');
      return;
    }
    hud(c, M, now);
    var pt = M.phase === 'intro' ? M.pt - (M.io || 0) : -1, t;
    if (M.phase === 'intro' && pt < 0) { tutorial(c, M, now, Math.min(1, M.pt / 0.2, -pt / 0.2)); return; }
    if (M.phase === 'intro') {
      if (pt < 0.95) banner(c, G.t('round', M.round), W / 2, 300, 92, '#fff', easeOutBack(pt / 0.25), pt > 0.8 ? (0.95 - pt) / 0.15 : 1, -0.04);
      else banner(c, G.t('fight'), W / 2, 300, 130, '#ffd23f', easeOutBack((pt - 0.95) / 0.18), 1, -0.04);
    } else if (M.phase === 'fight' && M.pt < 0.45) banner(c, G.t('fight'), W / 2, 300, 130, '#ffd23f', 1 + M.pt * 0.5, 1 - M.pt / 0.45, -0.04);
    else if (M.phase === 'ko') {
      t = M.pt; var kk = M.koKind; if (t < 0.14 && (kk === 'ko' || kk === 'out')) { c.fillStyle = 'rgba(255,255,255,' + (0.7 * (1 - t / 0.14)) + ')'; c.fillRect(0, 0, W, H); }
      banner(c, G.t(kk === 'ko' ? 'ko' : kk === 'out' ? 'ringout' : kk === 'time' ? 'timeup' : 'draw'), W / 2, 290, kk === 'ko' ? 170 : (G.lang === 'ko' ? 130 : 112), kk === 'ko' ? '#ff3b3b' : '#ffd23f', 1.7 - 0.7 * clamp(t / 0.12, 0, 1), clamp(t / 0.06, 0, 1), -0.05);
    } else if (M.phase === 'post' || M.phase === 'end') {
      t = M.phase === 'end' ? 1 : M.pt; var w = M.roundWinner, done = M.score[0] >= 2 || M.score[1] >= 2;
      if (M.phase === 'post') banner(c, w < 0 ? G.t('suddenTie') : done ? G.t('wins', M.f[w].name) : G.t('roundTo', M.f[w].name), W / 2, 250, w < 0 ? 70 : 96, w < 0 ? '#fff' : G.skinCol(M.f[w].skin, now), easeOutBack(t / 0.25), 1, -0.03);
    }
    if (M.hint && M.round === 1 && (M.phase === 'intro' || (M.phase === 'fight' && M.pt < 7))) {
      var lines = M.hint, a = M.phase === 'fight' && M.pt > 6 ? 7 - M.pt : 1; c.globalAlpha = clamp(a, 0, 1);
      c.fillStyle = 'rgba(16,12,40,0.72)'; G.rr(c, 140, H - 44 - lines.length * 30, W - 280, lines.length * 30 + 16, 14); c.fill();
      c.font = '700 20px ' + G.FONT; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#fff';
      for (i = 0; i < lines.length; i++) c.fillText(lines[i], W / 2, H - 22 - (lines.length - i) * 30 + 8);
      c.globalAlpha = 1;
    }
  };

  /* shop / menu preview of a standing fighter */
  G.drawPreview = function (cv, skin, hat, now, wp) {
    var c = cv.getContext('2d'), w = cv.width, h = cv.height, sc = h / 150;
    c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, w, h); c.setTransform(sc, 0, 0, sc, 0, 0);
    var p = G.idlePts(w / sc / 2 - 4, 136, now);
    drawFighter(c, { p: p, face: 1, eyes: 0, wp: wp || null, wa: -1.15, skin: skin, hat: hat, flash: false, blink: false, gone: false, tr: null }, now);
  };
})();
