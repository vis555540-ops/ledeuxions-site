/* Rendering: gym + court, wobbly fighters (Wobble Brawl drawFighter), balls per special, juice, HUD. */
(function () {
  'use strict';
  var G = window.G, W = G.W, H = G.H, TAU = Math.PI * 2, INK = '#1b1b2f', FY = G.FY, ZPX = G.ZPX, CX = G.CX, BL = G.BL, BR = G.BR;
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function rr(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  G.rr = rr;

  function drawHat(c, hat, now) {
    switch (hat) {
      case 'cap': c.fillStyle = INK; c.beginPath(); c.arc(0, -3, 13.5, Math.PI, TAU); c.fill(); c.fillRect(0, -6.5, 22, 6); c.fillStyle = '#e63946'; c.beginPath(); c.arc(0, -4, 11.5, Math.PI, TAU); c.fill(); c.fillRect(2, -6, 18, 3); c.fillStyle = '#fff'; c.beginPath(); c.arc(0, -15, 2, 0, TAU); c.fill(); break;
      case 'band': c.strokeStyle = INK; c.lineWidth = 8; c.beginPath(); c.moveTo(-11, -5); c.lineTo(11, -5); c.stroke(); c.strokeStyle = '#e63946'; c.lineWidth = 5; c.beginPath(); c.moveTo(-11, -5); c.lineTo(11, -5); c.stroke(); c.lineWidth = 4; c.beginPath(); var w = Math.sin(now * 9) * 4; c.moveTo(-11, -5); c.quadraticCurveTo(-20, -8 + w, -27, -2 + w); c.moveTo(-11, -5); c.quadraticCurveTo(-19, 0 - w, -24, 7 - w); c.stroke(); break;
      case 'party': c.fillStyle = INK; c.beginPath(); c.moveTo(-11, -7); c.lineTo(2, -36); c.lineTo(12, -7); c.fill(); c.fillStyle = '#4cc9f0'; c.beginPath(); c.moveTo(-8, -8); c.lineTo(2, -32); c.lineTo(9, -8); c.fill(); c.fillStyle = '#ffd166'; c.fillRect(-5, -14, 12, 3); c.beginPath(); c.arc(2, -34, 4, 0, TAU); c.fill(); break;
      case 'top': c.fillStyle = INK; c.fillRect(-16, -11, 32, 6); c.fillRect(-10.5, -34, 21, 25); c.fillStyle = '#e63946'; c.fillRect(-10.5, -16, 21, 5); c.fillStyle = 'rgba(255,255,255,0.25)'; c.fillRect(-8, -32, 4, 14); break;
      case 'cone': c.fillStyle = INK; c.beginPath(); c.moveTo(-15, -5); c.lineTo(15, -5); c.lineTo(15, -10); c.lineTo(5, -36); c.lineTo(-5, -36); c.lineTo(-15, -10); c.fill(); c.fillStyle = '#ff7b00'; c.beginPath(); c.moveTo(-10, -9); c.lineTo(10, -9); c.lineTo(3.5, -33); c.lineTo(-3.5, -33); c.fill(); c.fillRect(-13, -9, 26, 3); c.fillStyle = '#fff'; c.beginPath(); c.moveTo(-7.6, -18); c.lineTo(7.6, -18); c.lineTo(5.8, -24); c.lineTo(-5.8, -24); c.fill(); break;
      case 'chef': c.fillStyle = INK; c.beginPath(); c.arc(-7, -24, 10, 0, TAU); c.arc(7, -24, 10, 0, TAU); c.arc(0, -29, 10, 0, TAU); c.fill(); c.fillRect(-11, -22, 22, 16); c.fillStyle = '#fff'; c.beginPath(); c.arc(-7, -24, 7.5, 0, TAU); c.arc(7, -24, 7.5, 0, TAU); c.arc(0, -29, 7.5, 0, TAU); c.fill(); c.fillRect(-8.5, -22, 17, 13.5); break;
      case 'prop': c.fillStyle = INK; c.beginPath(); c.arc(0, -3, 13.5, Math.PI, TAU); c.fill(); c.fillStyle = '#06d6a0'; c.beginPath(); c.arc(0, -4, 11.5, Math.PI, TAU); c.fill(); c.strokeStyle = INK; c.lineWidth = 3; c.beginPath(); c.moveTo(0, -15); c.lineTo(0, -22); c.stroke(); var pw = Math.cos(now * 24) * 13; c.lineWidth = 6; c.beginPath(); c.moveTo(-pw, -22); c.lineTo(pw, -22); c.stroke(); c.strokeStyle = '#e63946'; c.lineWidth = 3; c.beginPath(); c.moveTo(-pw, -22); c.lineTo(pw, -22); c.stroke(); break;
      case 'halo': c.strokeStyle = INK; c.lineWidth = 6; c.beginPath(); c.ellipse(0, -20 + Math.sin(now * 4) * 1.5, 12, 4, 0, 0, TAU); c.stroke(); c.strokeStyle = '#ffe45c'; c.lineWidth = 3; c.stroke(); break;
      case 'sprout': c.strokeStyle = INK; c.lineWidth = 5; c.beginPath(); c.moveTo(0, -10); c.lineTo(0, -24); c.stroke(); c.strokeStyle = '#3c9d3a'; c.lineWidth = 2.5; c.stroke();
        var sw = Math.sin(now * 3) * 0.2; c.fillStyle = INK; c.save(); c.translate(0, -24); c.rotate(sw); c.beginPath(); c.ellipse(-8, -2, 10, 6, -0.5, 0, TAU); c.ellipse(8, -2, 10, 6, 0.5, 0, TAU); c.fill(); c.fillStyle = '#6ad04f'; c.beginPath(); c.ellipse(-8, -2, 7.5, 4, -0.5, 0, TAU); c.ellipse(8, -2, 7.5, 4, 0.5, 0, TAU); c.fill(); c.restore(); break;
      case 'bow': c.fillStyle = INK; c.beginPath(); c.moveTo(0, -12); c.lineTo(-16, -22); c.lineTo(-16, -2); c.closePath(); c.moveTo(0, -12); c.lineTo(16, -22); c.lineTo(16, -2); c.closePath(); c.fill(); c.fillStyle = '#ff4fa3'; c.beginPath(); c.moveTo(0, -12); c.lineTo(-13, -19); c.lineTo(-13, -5); c.closePath(); c.moveTo(0, -12); c.lineTo(13, -19); c.lineTo(13, -5); c.closePath(); c.fill(); c.fillStyle = INK; c.beginPath(); c.arc(0, -12, 5, 0, TAU); c.fill(); c.fillStyle = '#ff9ecb'; c.beginPath(); c.arc(0, -12, 3, 0, TAU); c.fill(); break;
      case 'horns': for (var hn = -1; hn <= 1; hn += 2) { c.fillStyle = INK; c.beginPath(); c.moveTo(hn * 5, -7); c.quadraticCurveTo(hn * 16, -14, hn * 15, -28); c.quadraticCurveTo(hn * 11, -16, hn * 12, -5); c.fill(); c.fillStyle = '#fff3d6'; c.beginPath(); c.moveTo(hn * 7, -8); c.quadraticCurveTo(hn * 14, -14, hn * 14, -23); c.quadraticCurveTo(hn * 11, -15, hn * 11, -7); c.fill(); } break;
      case 'beanie': c.fillStyle = INK; c.beginPath(); c.arc(0, -4, 14, Math.PI, TAU); c.fill(); c.fillRect(-15, -7, 30, 7); c.fillStyle = '#3d5afe'; c.beginPath(); c.arc(0, -5, 11.5, Math.PI, TAU); c.fill(); c.fillStyle = '#ffd23f'; c.fillRect(-13, -6, 26, 4); c.fillStyle = INK; c.beginPath(); c.arc(0, -19, 6, 0, TAU); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.arc(0, -19, 4, 0, TAU); c.fill(); break;
      case 'crown': c.fillStyle = INK; c.beginPath(); c.moveTo(-13, -5); c.lineTo(-15, -26); c.lineTo(-6, -17); c.lineTo(0, -29); c.lineTo(6, -17); c.lineTo(15, -26); c.lineTo(13, -5); c.fill(); c.fillStyle = '#ffc400'; c.beginPath(); c.moveTo(-10.5, -7.5); c.lineTo(-12, -20); c.lineTo(-5.5, -13.5); c.lineTo(0, -24); c.lineTo(5.5, -13.5); c.lineTo(12, -20); c.lineTo(10.5, -7.5); c.fill(); c.fillStyle = '#e63946'; c.beginPath(); c.arc(0, -12, 2.4, 0, TAU); c.fill(); break;
    }
  }
  var P = new Float32Array(22);
  function drawBody(c, b, uni, now) {
    var i, z = b.sc, col = b.flash > 0 ? '#ffffff' : b.skin, out = INK, th = b.th || 1, hs = b.hs || 1, zt = z * th;
    for (i = 0; i < 11; i++) { P[i * 2] = b.pts[i].x; P[i * 2 + 1] = b.pts[i].y; }
    var p = P;
    c.save(); if (b.role === 'toOut' || b.role === 'toIn') c.globalAlpha = 0.55;
    c.lineCap = 'round'; c.lineJoin = 'round';
    function back() { c.moveTo(p[2], p[3]); c.lineTo(p[10], p[11]); c.lineTo(p[12], p[13]); c.moveTo(p[4], p[5]); c.lineTo(p[18], p[19]); c.lineTo(p[20], p[21]); }
    function front() { c.moveTo(p[2], p[3]); c.lineTo(p[4], p[5]); c.lineTo(p[14], p[15]); c.lineTo(p[16], p[17]); c.moveTo(p[2], p[3]); c.lineTo(p[6], p[7]); c.lineTo(p[8], p[9]); }
    c.strokeStyle = out; c.lineWidth = 12.5 * zt; c.beginPath(); back(); c.stroke();
    c.strokeStyle = col; c.lineWidth = 7.5 * zt; c.beginPath(); back(); c.stroke(); c.strokeStyle = 'rgba(0,0,20,0.25)'; c.beginPath(); back(); c.stroke();
    c.strokeStyle = out; c.lineWidth = 12.5 * zt; c.beginPath(); front(); c.stroke();
    c.fillStyle = out; c.beginPath(); c.arc(p[0], p[1], 13.5 * z * hs, 0, TAU); c.fill();
    c.strokeStyle = col; c.lineWidth = 7.5 * zt; c.beginPath(); front(); c.stroke();
    // team jersey: a thick stripe on the torso
    c.strokeStyle = out; c.lineWidth = 15 * zt; c.beginPath(); c.moveTo(p[2], p[3] + 3 * z); c.lineTo(p[4], p[5] - 4 * z); c.stroke();
    c.strokeStyle = b.flash > 0 ? '#fff' : uni; c.lineWidth = 10 * zt; c.beginPath(); c.moveTo(p[2], p[3] + 3 * z); c.lineTo(p[4], p[5] - 4 * z); c.stroke();
    c.fillStyle = col; c.beginPath(); c.arc(p[0], p[1], (13.5 * hs - 2.5) * z, 0, TAU); c.fill();
    var tilt = Math.atan2(p[1] - p[3], p[0] - p[2]) + Math.PI / 2;
    c.save(); c.translate(p[0], p[1]); c.rotate(tilt); c.scale(b.face * z * hs, z * hs);
    c.fillStyle = INK; c.strokeStyle = INK; c.lineWidth = 2.2;
    var e = b.eyes;
    if (b.catchT > 0 && !e) e = 4;
    if (e === 2) { c.beginPath(); for (i = 0; i < 2; i++) { var ex = 1 + i * 7; c.moveTo(ex - 2.4, -3.4); c.lineTo(ex + 2.4, 1.4); c.moveTo(ex + 2.4, -3.4); c.lineTo(ex - 2.4, 1.4); } c.stroke(); c.beginPath(); c.arc(5, 6, 2.2, 0, TAU); c.stroke(); }
    else if (e === 1) { c.beginPath(); c.moveTo(-1, -3.5); c.lineTo(3, -1); c.lineTo(-1, 1.5); c.moveTo(10, -3.5); c.lineTo(6, -1); c.lineTo(10, 1.5); c.stroke(); c.beginPath(); c.ellipse(5, 6, 2.5, 3, 0, 0, TAU); c.fill(); }
    else if (b.cheer) { c.beginPath(); c.arc(1.5, -0.5, 2.6, Math.PI, TAU); c.moveTo(11.1, -0.5); c.arc(8.5, -0.5, 2.6, Math.PI, TAU); c.stroke(); c.beginPath(); c.arc(5, 3, 4, 0.1, Math.PI - 0.1); c.fill(); }
    else { c.beginPath(); c.arc(2, -1.5, 2.1, 0, TAU); c.arc(8.6, -1.5, 2.1, 0, TAU); c.fill(); if (e === 4 || b.charging) { c.beginPath(); c.moveTo(-1.5, -6.5); c.lineTo(4.5, -4.2); c.moveTo(11.5, -6.5); c.lineTo(6, -4.2); c.stroke(); } if (b.sad) { c.beginPath(); c.arc(5, 7, 2.5, Math.PI + 0.3, TAU - 0.3); c.stroke(); } }
    drawHat(c, b.hat, now);
    c.restore(); c.restore();
  }

  /* ---------- background (cached) ---------- */
  var bg = null, bgK = 0;
  var fans = []; (function () { var cols = ['#ff5a4f', '#3fa9ff', '#8ee53f', '#ffd23f', '#ff8fd0', '#a77bff', '#ff9d5c', '#4cd9c0']; for (var r = 0; r < 4; r++) for (var i = 0; i < 30; i++) fans.push({ x: 20 + i * 42 + (r % 2) * 21, y: 120 + r * 52, c: cols[(i * 7 + r * 3) % 8], ph: Math.random() * 6 }); })();
  function buildBg(k) {
    bg = document.createElement('canvas'); bg.width = Math.round(W * k); bg.height = Math.round(H * k); bgK = k;
    var c = bg.getContext('2d'); c.scale(k, k);
    var g = c.createLinearGradient(0, 0, 0, 380); g.addColorStop(0, '#2a2058'); g.addColorStop(1, '#3d2f73'); c.fillStyle = g; c.fillRect(0, 0, W, 400);
    // banners
    var bc = ['#ff5a4f', '#ffd23f', '#3fa9ff', '#8ee53f', '#ff8fd0'];
    for (var i = 0; i < 26; i++) { c.fillStyle = bc[i % 5]; c.beginPath(); c.moveTo(i * 50, 10); c.lineTo(i * 50 + 50, 10); c.lineTo(i * 50 + 25, 44); c.fill(); }
    c.strokeStyle = INK; c.lineWidth = 3; c.beginPath(); c.moveTo(0, 10); c.lineTo(W, 10); c.stroke();
    // bleachers
    for (var r = 0; r < 4; r++) { c.fillStyle = r % 2 ? '#4a3d86' : '#54479a'; c.fillRect(0, 140 + r * 52, W, 52); c.fillStyle = 'rgba(0,0,0,0.25)'; c.fillRect(0, 186 + r * 52, W, 6); }
    // wall + floor
    c.fillStyle = '#2b2350'; c.fillRect(0, 348, W, 28);
    c.fillStyle = '#1b1b2f'; c.fillRect(0, 372, W, 6);
    var fg = c.createLinearGradient(0, 378, 0, H); fg.addColorStop(0, '#c98c4f'); fg.addColorStop(1, '#e6a861'); c.fillStyle = fg; c.fillRect(0, 378, W, H - 378);
    c.strokeStyle = 'rgba(120,70,30,0.25)'; c.lineWidth = 2; for (var y = 392; y < H; y += 22) { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }
    // outfield strips (behind each baseline)
    c.fillStyle = 'rgba(40,120,220,0.18)'; c.fillRect(BR, FY(0) - 6, W - BR, FY(1) - FY(0) + 12);
    c.fillStyle = 'rgba(230,80,60,0.18)'; c.fillRect(0, FY(0) - 6, BL, FY(1) - FY(0) + 12);
    // court halves
    c.fillStyle = 'rgba(63,169,255,0.16)'; c.fillRect(BL, FY(0) - 6, CX - BL, FY(1) - FY(0) + 12);
    c.fillStyle = 'rgba(255,90,79,0.16)'; c.fillRect(CX, FY(0) - 6, BR - CX, FY(1) - FY(0) + 12);
    c.strokeStyle = '#fff'; c.lineWidth = 5; c.strokeRect(BL, FY(0) - 6, BR - BL, FY(1) - FY(0) + 12);
    c.beginPath(); c.moveTo(CX, FY(0) - 6); c.lineTo(CX, FY(1) + 6); c.stroke();
    c.lineWidth = 3; c.beginPath(); c.ellipse(CX, (FY(0) + FY(1)) / 2, 60, 40, 0, 0, TAU); c.stroke();
  }

  /* ---------- balls ---------- */
  function ballLook(B) { return B.sp || (B.fakeLook) || null; }
  function drawBall(c, B, now) {
    var x = B.x, y = FY(B.z) - B.h, r = B.r * G.scz(clamp(B.z, 0, 1)), sp = ballLook(B), S = sp && G.SPEC[sp], col = S ? S.col : '#ff5a4f';
    // trail
    if (B.trail.length > 4 && B.st === 'fly') {
      c.lineCap = 'round';
      for (var i = 2; i < B.trail.length; i += 2) { var a = i / B.trail.length; c.strokeStyle = sp === 'flip' ? 'rgba(255,140,0,' + a * 0.8 + ')' : sp ? hexA(col, a * 0.6) : 'rgba(255,255,255,' + a * 0.35 + ')'; c.lineWidth = r * (sp === 'flip' ? 1.6 : 1.1) * a; c.beginPath(); c.moveTo(B.trail[i - 2], B.trail[i - 1]); c.lineTo(B.trail[i], B.trail[i + 1]); c.stroke(); }
    }
    if (sp === 'ghost' && B.st === 'fly' && ((now * 10) | 0) % 3) { c.globalAlpha = 0.08; }
    if (sp === 'banana') {
      c.save(); c.translate(x, y); c.rotate(B.spin * 3); c.fillStyle = INK; c.beginPath(); c.arc(0, 0, r * 1.5, -0.3, Math.PI + 0.3); c.arc(0, -r * 0.5, r * 1.1, Math.PI + 0.2, -0.2, true); c.closePath(); c.fill();
      c.fillStyle = '#ffe14d'; c.beginPath(); c.arc(0, 0, r * 1.3, -0.2, Math.PI + 0.2); c.arc(0, -r * 0.5, r * 1.15, Math.PI + 0.15, -0.15, true); c.closePath(); c.fill();
      c.fillStyle = '#6b4a1e'; c.beginPath(); c.arc(-r * 1.3, 0, 2.5, 0, TAU); c.arc(r * 1.3, 0, 2.5, 0, TAU); c.fill(); c.restore();
    } else if (sp === 'chicken') {
      var fl = Math.sin(now * 30), d = B.vx >= 0 ? 1 : -1; c.save(); c.translate(x, y); c.scale(d, 1);
      c.fillStyle = INK; c.beginPath(); c.ellipse(0, 0, r * 1.6, r * 1.25, 0, 0, TAU); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.ellipse(0, 0, r * 1.4, r * 1.05, 0, 0, TAU); c.fill();
      c.fillStyle = '#fff'; c.strokeStyle = INK; c.lineWidth = 2; c.beginPath(); c.ellipse(-r * 0.3, -r * 0.2 - fl * r * 0.8, r * 0.9, r * 0.4, -0.5 - fl * 0.6, 0, TAU); c.fill(); c.stroke();
      c.fillStyle = '#ff3b3b'; c.beginPath(); c.arc(r * 1.1, -r * 1.05, r * 0.32, 0, TAU); c.arc(r * 0.8, -r * 1.15, r * 0.3, 0, TAU); c.fill();
      c.fillStyle = '#ffb703'; c.beginPath(); c.moveTo(r * 1.5, -r * 0.4); c.lineTo(r * 2.1, -r * 0.2); c.lineTo(r * 1.5, 0); c.fill();
      c.fillStyle = INK; c.beginPath(); c.arc(r * 1.05, -r * 0.45, 2, 0, TAU); c.fill();
      c.strokeStyle = '#ffb703'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(-r * 0.2, r * 1.0); c.lineTo(-r * 0.4, r * 1.6); c.moveTo(r * 0.3, r * 1.0); c.lineTo(r * 0.2, r * 1.6); c.stroke(); c.restore();
    } else {
      c.fillStyle = INK; c.beginPath(); c.arc(x, y, r + 3, 0, TAU); c.fill();
      c.fillStyle = col; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
      c.save(); c.beginPath(); c.arc(x, y, r, 0, TAU); c.clip(); c.strokeStyle = sp ? 'rgba(255,255,255,0.7)' : '#fff'; c.lineWidth = r * 0.35; var o = Math.sin(B.spin) * r; c.beginPath(); c.ellipse(x + o * 0.5, y, Math.abs(Math.cos(B.spin)) * r * 0.5 + 1, r * 1.2, 0, 0, TAU); c.stroke(); c.restore();
      c.fillStyle = 'rgba(255,255,255,0.55)'; c.beginPath(); c.arc(x - r * 0.35, y - r * 0.4, r * 0.28, 0, TAU); c.fill();
      if (sp === 'giant' && r > 20) { c.fillStyle = INK; c.beginPath(); c.arc(x - r * 0.25, y - r * 0.05, r * 0.1, 0, TAU); c.arc(x + r * 0.25, y - r * 0.05, r * 0.1, 0, TAU); c.fill(); c.lineWidth = 3; c.strokeStyle = INK; c.beginPath(); c.arc(x, y + r * 0.2, r * 0.25, 0.2, Math.PI - 0.2); c.stroke(); }
      if (sp === 'sneeze' && B.ph === 1) { c.fillStyle = INK; c.beginPath(); c.arc(x - r * 0.3, y - r * 0.1, 1.8, 0, TAU); c.arc(x + r * 0.3, y - r * 0.1, 1.8, 0, TAU); c.fill(); c.beginPath(); c.ellipse(x, y + r * 0.35, r * 0.2, r * 0.3, 0, 0, TAU); c.fill(); }
    }
    c.globalAlpha = 1;
  }
  function hexA(h, a) { if (h.length === 4) h = '#' + h[1] + h[1] + h[2] + h[2] + h[3] + h[3]; var n = parseInt(h.slice(1), 16); return 'rgba(' + (n >> 16) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + clamp(a, 0, 1) + ')'; }

  function label(c, txt, x, y, size, col, align, italic) { c.font = (italic ? 'italic ' : '') + '900 ' + size + 'px ' + G.FONT; c.textAlign = align || 'left'; c.textBaseline = 'middle'; c.lineJoin = 'round'; c.strokeStyle = INK; c.lineWidth = size * 0.26; c.strokeText(txt, x, y); c.fillStyle = col; c.fillText(txt, x, y); }
  function fitLabel(c, txt, x, y, size, col, align, maxW, italic) { c.font = (italic ? 'italic ' : '') + '900 ' + size + 'px ' + G.FONT; var w = c.measureText(txt).width; if (w > maxW) size = Math.max(10, Math.floor(size * maxW / w)); label(c, txt, x, y, size, col, align, italic); }
  function easeOutBack(t) { t = clamp(t, 0, 1); var s = 1.9; t -= 1; return t * t * ((s + 1) * t + s) + 1; }

  /* ---------- main render ---------- */
  G.render = function (c, M, now, V) {
    var k = V.k, SW = V.SW;
    if (!bg || bgK !== k) buildBg(k);
    c.setTransform(1, 0, 0, 1, 0, 0);
    var sx = 0, sy = 0; if (M && M.shake > 0.3) { sx = (Math.random() - 0.5) * M.shake * 1.4; sy = (Math.random() - 0.5) * M.shake * 1.4; }
    c.setTransform(k, 0, 0, k, (-V.camX + sx) * k, sy * k);
    c.drawImage(bg, 0, 0, W, H);
    // crowd heads
    var hype = M ? M.crowd : 0;
    for (var i = 0; i < fans.length; i++) { var f = fans[i], j = Math.abs(Math.sin(now * (3 + hype * 6) + f.ph)) * (3 + hype * 14); c.fillStyle = INK; c.beginPath(); c.arc(f.x, f.y - j, 13, 0, TAU); c.fill(); c.fillStyle = f.c; c.beginPath(); c.arc(f.x, f.y - j, 10, 0, TAU); c.fill(); if (hype > 0.4) { c.strokeStyle = INK; c.lineWidth = 4; c.beginPath(); c.moveTo(f.x - 9, f.y - j + 8); c.lineTo(f.x - 15, f.y - j - 10); c.moveTo(f.x + 9, f.y - j + 8); c.lineTo(f.x + 15, f.y - j - 10); c.stroke(); } }
    if (!M) return;
    var ents = [], b;
    M.bodies.forEach(function (o) { ents.push({ z: o.z, b: o }); });
    var balls = [M.ball].concat(M.fakes);
    balls.forEach(function (B) { ents.push({ z: B.z + 0.001, B: B }); });
    // shadows
    M.bodies.forEach(function (o) { var w = 24 * o.sc; c.fillStyle = 'rgba(0,0,0,0.22)'; c.beginPath(); c.ellipse(o.mode === 'rag' ? o.pts[2].x : o.x, FY(o.z), w, w * 0.32, 0, 0, TAU); c.fill(); });
    balls.forEach(function (B) { if (B.sp === 'ghost' && B.st === 'fly') return; var s = clamp(1 - B.h / 400, 0.3, 1), rs = B.r * G.scz(clamp(B.z, 0, 1)); c.fillStyle = 'rgba(0,0,0,' + 0.25 * s + ')'; c.beginPath(); c.ellipse(B.x, FY(clamp(B.z, 0, 1)), rs * s * 1.1, rs * s * 0.38, 0, 0, TAU); c.fill(); });
    // aim marker (my holder)
    var me = M.ctrl >= 0 ? M.bodies[M.ctrl] : null;
    if (me && me.hold && M.state === 'play') { var tg = G.pickTarget(M, me); if (tg) { c.strokeStyle = '#ff3b3b'; c.lineWidth = 4; c.beginPath(); c.ellipse(tg.x, FY(tg.z), 30 * tg.sc, 10 * tg.sc, 0, 0, TAU); c.stroke(); } }
    ents.sort(function (a, b2) { return a.z - b2.z; });
    for (i = 0; i < ents.length; i++) {
      var e = ents[i];
      if (e.b) { var td = e.b.team ? M.team : G.MYTEAM; drawBody(c, e.b, td.uni, now); }
      else if (e.B.alive && !(e.B.st === 'held' && e.B.holder.mode === 'rag')) drawBall(c, e.B, now);
    }
    // my marker + catch timing ring
    if (me) {
      var hx = me.pts[0].x, hy = me.pts[0].y - 30 * me.sc - Math.abs(Math.sin(now * 5)) * 4;
      c.fillStyle = INK; c.beginPath(); c.moveTo(hx - 12, hy - 14); c.lineTo(hx + 12, hy - 14); c.lineTo(hx, hy + 3); c.fill(); c.fillStyle = '#ffd23f'; c.beginPath(); c.moveTo(hx - 8, hy - 11); c.lineTo(hx + 8, hy - 11); c.lineTo(hx, hy - 1); c.fill();
      if (me.charging) { var cw = 50; c.fillStyle = INK; rr(c, me.x - cw / 2 - 3, hy - 32, cw + 6, 12, 6); c.fill(); c.fillStyle = me.charge >= 1 ? '#ff5a4f' : '#ffd23f'; rr(c, me.x - cw / 2, hy - 29, cw * me.charge, 6, 3); c.fill(); }
      var th = M.state === 'play' && me.role === 'in' ? G.threat(M, me) : null;
      if (th && th.tt < 0.9 && th.B.sp !== 'ghost') {
        var cyy = FY(me.z) - me.h - 55 * me.sc, ok = th.tt < 0.4, rad = 34 + th.tt * 90;
        c.strokeStyle = ok ? '#8ef0a8' : 'rgba(255,255,255,0.8)'; c.lineWidth = ok ? 5 : 3; c.beginPath(); c.arc(me.x, cyy, rad, 0, TAU); c.stroke();
        c.strokeStyle = 'rgba(255,255,255,0.35)'; c.lineWidth = 2; c.beginPath(); c.arc(me.x, cyy, 34, 0, TAU); c.stroke();
        if (ok && me.catchT <= 0) label(c, G.t('catchNow'), me.x, cyy - rad - 14, 20, '#8ef0a8', 'center');
      }
    }
    // fx
    for (i = 0; i < M.fx.length; i++) {
      var f2 = M.fx[i], a = 1 - f2.life / f2.max;
      if (f2.k === 'puff') { c.fillStyle = hexA(f2.col, a * 0.75); c.beginPath(); c.arc(f2.x, f2.y, f2.s * (1 + (1 - a) * 1.2), 0, TAU); c.fill(); }
      else if (f2.k === 'spark') { c.strokeStyle = hexA(f2.col, a); c.lineWidth = f2.s; c.lineCap = 'round'; c.beginPath(); c.moveTo(f2.x, f2.y); c.lineTo(f2.x - f2.vx * 0.03, f2.y - f2.vy * 0.03); c.stroke(); }
      else if (f2.k === 'ring') { c.strokeStyle = hexA(f2.col, a); c.lineWidth = 8 * a + 1; c.beginPath(); c.arc(f2.x, f2.y, f2.s * (0.4 + (1 - a) * 1.8), 0, TAU); c.stroke(); }
      else if (f2.k === 'burst') { c.fillStyle = hexA('#ffffff', a); star(c, f2.x, f2.y, f2.s * (1.2 - a * 0.4), now * 3); c.fillStyle = hexA('#ffe45c', a); star(c, f2.x, f2.y, f2.s * 0.6, now * 3 + 0.4); }
      else if (f2.k === 'feather') { c.save(); c.translate(f2.x, f2.y); c.rotate(f2.rot); c.globalAlpha = a; c.fillStyle = '#fff'; c.strokeStyle = INK; c.lineWidth = 1.5; c.beginPath(); c.ellipse(0, 0, f2.s, f2.s * 0.35, 0, 0, TAU); c.fill(); c.stroke(); c.restore(); }
      else if (f2.k === 'drop') { c.fillStyle = hexA(f2.col, a); c.beginPath(); c.arc(f2.x, f2.y, f2.s, 0, TAU); c.fill(); }
      else if (f2.k === 'txt') { c.globalAlpha = a; label(c, f2.txt, f2.x, f2.y, f2.s, f2.col, 'center'); c.globalAlpha = 1; }
    }
    // world pops
    for (i = 0; i < M.pops.length; i++) { var p = M.pops[i], sc = easeOutBack(p.t / 0.18), al = p.t > 0.7 ? 1 - (p.t - 0.7) / 0.3 : 1; c.save(); c.globalAlpha = clamp(al, 0, 1); c.translate(clamp(p.x, V.camX + 70, V.camX + SW - 70), p.y - p.t * 40); c.scale(sc, sc); label(c, p.txt, 0, 0, p.size, p.col, 'center', true); c.restore(); }
    for (i = 0; i < M.wows.length; i++) { var w = M.wows[i], a2 = w.t < 0.15 ? w.t / 0.15 : 1 - (w.t - 0.15) / 0.95; c.save(); c.globalAlpha = clamp(a2, 0, 1); c.translate(w.x, w.y - w.t * 20); c.rotate(Math.sin(w.x) * 0.2); label(c, w.txt, 0, 0, w.s, '#fff', 'center', true); c.restore(); }
    // ---- screen space ----
    c.setTransform(k, 0, 0, k, 0, 0);
    if (M.flash > 0) { c.fillStyle = 'rgba(255,255,255,' + clamp(M.flash * 2.2, 0, 0.6) + ')'; c.fillRect(0, 0, SW, H); }
    if (M.slow > 0 || M.nearSlow) { var vg = c.createRadialGradient(SW / 2, H / 2, H * 0.3, SW / 2, H / 2, H * 0.85); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(10,0,30,0.55)'); c.fillStyle = vg; c.fillRect(0, 0, SW, H); }
    hud(c, M, now, V);
  };
  function star(c, x, y, r, rot) { c.beginPath(); for (var i = 0; i < 16; i++) { var a = rot + i * Math.PI / 8, q = i % 2 ? r * 0.4 : r; c.lineTo(x + Math.cos(a) * q, y + Math.sin(a) * q); } c.closePath(); c.fill(); }

  function teamPanel(c, M, t, x, w, alignR, now) {
    var td = t ? M.team : G.MYTEAM, nm = t ? G.t(td.key) : G.t(M.versus ? 'pHost' : 'my');
    c.fillStyle = 'rgba(27,27,47,0.88)'; rr(c, x, 10, w, 92, 16); c.fill();
    var l = alignR ? x + w - 14 : x + 14;
    fitLabel(c, nm, l, 30, 20, t ? '#ff9d5c' : '#6ecbff', alignR ? 'right' : 'left', w - 36 - Math.min(30, (w * 0.62) / (M.bodies.length / 2)) * M.bodies.length / 2);
    // heads: alive / out
    var n = M.bodies.length / 2, hs = Math.min(30, (w * 0.62) / n), hr = Math.min(12, hs * 0.42);
    for (var i = 0; i < n; i++) {
      var b = M.bodies[t * n + i], hx = alignR ? x + 12 + hr + i * hs : x + w - 12 - hr - i * hs, al = G.alive(b);
      c.fillStyle = INK; c.beginPath(); c.arc(hx, 30, hr, 0, TAU); c.fill(); c.fillStyle = al ? b.skin : '#4a4e69'; c.beginPath(); c.arc(hx, 30, hr * 0.75, 0, TAU); c.fill();
      if (!al) { var q = hr * 0.5; c.strokeStyle = '#ff5a4f'; c.lineWidth = 3; c.beginPath(); c.moveTo(hx - q, 30 - q); c.lineTo(hx + q, 30 + q); c.moveTo(hx + q, 30 - q); c.lineTo(hx - q, 30 + q); c.stroke(); }
    }
    // special meter
    var m = M.meter[t], bx = x + 14, bw = w - 28, full = m >= 1;
    c.fillStyle = INK; rr(c, bx - 2, 50, bw + 4, 18, 9); c.fill(); c.fillStyle = '#3a3c5a'; rr(c, bx, 52, bw, 14, 7); c.fill();
    if (m > 0) { c.fillStyle = full ? (((now * 8) | 0) % 2 ? '#ffd23f' : '#ff5a4f') : '#ffd23f'; var fw = Math.max(14, bw * m); rr(c, alignR ? bx + bw - fw : bx, 52, fw, 14, 7); c.fill(); }
    var sp = G.t('sp_' + M.nextSp[t]), lab = full ? G.t('spReady') + '  ' + sp : G.t('nextSp') + ': ' + sp;
    fitLabel(c, lab, alignR ? x + w - 14 : x + 14, 85, 14, full ? '#ffd23f' : '#c9cbe0', alignR ? 'right' : 'left', w - 24);
  }
  var V = {};
  function hud(c, M, now, view) {
    V = view; var SW = view.SW, pw = Math.min(330, SW * 0.37);
    teamPanel(c, M, 0, 10, pw, false, now); teamPanel(c, M, 1, SW - 10 - pw, pw, true, now);
    // center: round score + timer
    var cx = SW / 2, cw = SW - 2 * pw - 40; if (cw > 170) cw = 170;
    c.fillStyle = 'rgba(27,27,47,0.88)'; rr(c, cx - cw / 2, 10, cw, 70, 16); c.fill();
    var tt = Math.max(0, Math.ceil(M.time)), ts = (tt / 60 | 0) + ':' + ('0' + tt % 60).slice(-2);
    label(c, ts, cx, 34, 26, tt <= 10 && M.state === 'play' ? '#ff5a4f' : '#fff', 'center');
    for (var i = 0; i < 2; i++) for (var j = 0; j < 2; j++) { var dx = cx + (i ? 14 + j * 18 : -14 - j * 18); c.fillStyle = INK; c.beginPath(); c.arc(dx, 62, 8, 0, TAU); c.fill(); c.fillStyle = M.score[i] > j ? (i ? '#ff9d5c' : '#6ecbff') : '#4a4e69'; c.beginPath(); c.arc(dx, 62, 5.5, 0, TAU); c.fill(); }
    // banner
    if (M.ban) {
      var bn = M.ban, t = bn.t, sc = easeOutBack(t / 0.22), al = t > bn.dur - 0.25 ? (bn.dur - t) / 0.25 : 1, by = H * 0.42;
      c.save(); c.globalAlpha = clamp(al, 0, 1);
      if (bn.sp) {   // special announcement: big slanted strip
        var sw2 = SW * clamp(t / 0.15, 0, 1); c.fillStyle = INK; c.save(); c.translate(SW / 2, by); c.rotate(-0.06); c.fillRect(-sw2 / 2, -62, sw2, 124); c.fillStyle = bn.col; c.fillRect(-sw2 / 2, -54, sw2, 108);
        c.fillStyle = 'rgba(255,255,255,0.25)'; for (var q = -8; q < 8; q++) { var ox = ((q * 90 + now * 600) % (SW + 180)) - SW / 2; c.beginPath(); c.moveTo(ox, -54); c.lineTo(ox + 30, -54); c.lineTo(ox - 10, 54); c.lineTo(ox - 40, 54); c.fill(); }
        c.restore();
        c.translate(SW / 2, by - 10); c.rotate(-0.06); c.scale(sc, sc);
        fitLabel(c, bn.txt, 0, -4, 66, '#fff', 'center', SW * 0.9, true);
        if (bn.sub) fitLabel(c, bn.sub, 0, 44, 24, '#1b1b2f' === bn.col ? '#fff' : '#fff', 'center', SW * 0.8);
      } else {
        c.translate(SW / 2, by); c.scale(sc, sc); fitLabel(c, bn.txt, 0, 0, 78, bn.col, 'center', SW * 0.9, true);
        if (bn.sub) fitLabel(c, bn.sub, 0, 62, 30, '#fff', 'center', SW * 0.85);
      }
      c.restore();
    }
    // special ready: glowing hint for my team
    var my = M.myTeam || 0;
    if (M.meter[my] >= 1 && M.state === 'play' && (M.ctrl >= 0 || M.versus)) {
      var pu = 0.5 + 0.5 * Math.sin(now * 9), txt = '\u2605 ' + G.t('spHow') + ' \u2605';
      c.font = 'italic 900 26px ' + G.FONT; var tw = Math.min(SW - 30, c.measureText(txt).width + 44), py = view.port ? 128 : 160;
      c.save(); c.shadowColor = '#ffd23f'; c.shadowBlur = 14 + 16 * pu; c.fillStyle = 'rgba(255,90,79,' + (0.85 + 0.15 * pu) + ')'; rr(c, (SW - tw) / 2, py - 22, tw, 44, 22); c.fill(); c.restore();
      c.strokeStyle = '#ffd23f'; c.lineWidth = 3; rr(c, (SW - tw) / 2, py - 22, tw, 44, 22); c.stroke();
      fitLabel(c, txt, SW / 2, py, 26, '#fff', 'center', tw - 24, true);
    }
    // first-match hint
    if (M.hint && view.touch && M.round === 1 && M.time > G.ROUND_T - 9 && M.state !== 'intro') {
      var ht = view.touch ? G.t('hintT') : G.t('hintK'); c.font = '700 15px ' + G.FONT; var hw = Math.min(SW - 30, c.measureText(ht).width + 30);
      c.fillStyle = 'rgba(16,12,40,0.82)'; rr(c, (SW - hw) / 2, H - 50, hw, 36, 12); c.fill(); fitLabel(c, ht, SW / 2, H - 32, 15, '#fff', 'center', hw - 20);
    }
  }
  G.drawBody = drawBody;
  // a character portrait into a 2d context: feet at (x, y), height px tall; team decides the jersey colour
  G.drawChar = function (c, ch, x, y, hpx, now, uni, cheer, flip) {
    var b = G.posed(ch, 0, now, cheer), s = hpx / 135;
    c.save(); c.translate(x, y); c.scale(flip ? -s : s, s); drawBody(c, b, uni || '#2a7fd4', now); c.restore();
  };
})();
