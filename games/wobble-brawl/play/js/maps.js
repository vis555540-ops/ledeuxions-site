/* Maps: platform layouts, moving parts, painted backgrounds. World is 1280x720. */
(function () {
  'use strict';
  var G = window.G, W = G.W, H = G.H, TAU = Math.PI * 2;
  function rng(seed) { var s = seed >>> 0; return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  function P(x, y, w, h, style, o) {
    var p = { cx: x + w / 2, cy: y + h / 2, hw: w / 2, hh: h / 2, ang: 0, vx: 0, vy: 0, w: 0, thin: false, fric: 1, bounce: 0, style: style, sq: 0, upd: null, col: null, legs: 0, cable: false };
    if (o) for (var k in o) p[k] = o[k];
    p.bx = p.cx; p.by = p.cy; return p;
  }
  function grad(c, x0, y0, x1, y1, stops) { var g = c.createLinearGradient(x0, y0, x1, y1); for (var i = 0; i < stops.length; i += 2) g.addColorStop(stops[i], stops[i + 1]); return g; }
  function rr(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.lineTo(x + w - r, y); c.quadraticCurveTo(x + w, y, x + w, y + r); c.lineTo(x + w, y + h - r); c.quadraticCurveTo(x + w, y + h, x + w - r, y + h); c.lineTo(x + r, y + h); c.quadraticCurveTo(x, y + h, x, y + h - r); c.lineTo(x, y + r); c.quadraticCurveTo(x, y, x + r, y); c.closePath(); }
  G.rr = rr;
  function cloud(c, x, y, s, col) { c.fillStyle = col; c.beginPath(); c.arc(x, y, 22 * s, 0, TAU); c.arc(x + 26 * s, y - 10 * s, 28 * s, 0, TAU); c.arc(x + 58 * s, y, 24 * s, 0, TAU); c.arc(x + 28 * s, y + 8 * s, 26 * s, 0, TAU); c.fill(); }
  function skyline(c, r, baseY, col, minH, maxH, win) {
    var x = -20;
    while (x < W + 20) {
      var bw = 50 + r() * 80, bh = minH + r() * (maxH - minH);
      c.fillStyle = col; c.fillRect(x, baseY - bh, bw, bh + 400);
      if (win) { c.fillStyle = win; for (var wy = baseY - bh + 12; wy < baseY + 200; wy += 22) for (var wx = x + 8; wx < x + bw - 10; wx += 16) if (r() < 0.35) c.fillRect(wx, wy, 7, 10); }
      x += bw + 4 + r() * 10;
    }
  }
  function pitFog(c, col) { c.fillStyle = grad(c, 0, H - 150, 0, H, [0, 'rgba(0,0,0,0)', 1, col]); c.fillRect(0, H - 150, W, 150); }

  var DEFS = {
    roof: {
      name: 'm_roof', spawns: [[330, 540], [950, 540]], items: [250, 400, 640, 880, 1030], wind: 0, accent: '#ff9d5c',
      plats: function () {
        return [
          P(160, 540, 960, 220, 'roof'),
          P(570, 486, 140, 54, 'ac'),
          P(270, 396, 170, 16, 'thin', { thin: true, legs: 144, col: '#e9c46a' }),
          P(840, 396, 170, 16, 'thin', { thin: true, legs: 144, col: '#e76f51' })
        ];
      },
      bg: function (c) {
        var r = rng(7);
        c.fillStyle = grad(c, 0, 0, 0, H, [0, '#2b1b5a', 0.45, '#c24b7a', 0.75, '#ff9d5c', 1, '#ffd08a']); c.fillRect(0, 0, W, H);
        c.fillStyle = 'rgba(255,240,200,0.9)'; c.beginPath(); c.arc(930, 470, 90, 0, TAU); c.fill();
        c.fillStyle = 'rgba(255,220,170,0.25)'; c.beginPath(); c.arc(930, 470, 130, 0, TAU); c.fill();
        cloud(c, 150, 150, 1.3, 'rgba(255,190,200,0.35)'); cloud(c, 720, 90, 1, 'rgba(255,190,200,0.3)'); cloud(c, 1050, 210, 1.5, 'rgba(255,200,180,0.3)');
        skyline(c, r, 600, '#7b3f7e', 60, 220, null);
        skyline(c, r, 680, '#4a2a63', 60, 200, 'rgba(255,214,130,0.75)');
        pitFog(c, 'rgba(30,14,50,0.85)');
      },
      anim: function (c, t) { }
    },
    crane: {
      name: 'm_crane', spawns: [[220, 560], [1060, 560]], items: [150, 330, 640, 950, 1130], wind: 0, accent: '#ffcf3f',
      plats: function () {
        return [
          P(50, 560, 360, 200, 'scaf'),
          P(870, 560, 360, 200, 'scaf'),
          P(530, 500, 220, 26, 'beam', { thin: true, cable: true, upd: function (p, t) { p.cx = 640 + Math.sin(t * 0.8) * 165; } }),
          P(150, 392, 170, 16, 'thin', { thin: true, legs: 168, col: '#f4a261' }),
          P(960, 392, 170, 16, 'thin', { thin: true, legs: 168, col: '#f4a261' }),
          P(575, 300, 130, 16, 'thin', { thin: true, col: '#ffcf3f', cable: true, upd: function (p, t) { p.cy = 300 + Math.sin(t * 0.7 + 1) * 46; } })
        ];
      },
      bg: function (c) {
        var r = rng(21);
        c.fillStyle = grad(c, 0, 0, 0, H, [0, '#4aa8ff', 0.7, '#b9e4ff', 1, '#e8f6ff']); c.fillRect(0, 0, W, H);
        cloud(c, 120, 120, 1.5, 'rgba(255,255,255,0.8)'); cloud(c, 560, 190, 1.1, 'rgba(255,255,255,0.7)'); cloud(c, 980, 100, 1.6, 'rgba(255,255,255,0.8)');
        skyline(c, r, 640, '#9cc6e6', 40, 200, null);
        c.strokeStyle = '#7fa9cc'; c.lineWidth = 6;
        for (var i = 0; i < 2; i++) { var x = 250 + i * 620; c.beginPath(); c.moveTo(x, 720); c.lineTo(x, 190); c.moveTo(x - 80, 205); c.lineTo(x + 260, 205); c.moveTo(x, 150); c.lineTo(x + 260, 205); c.moveTo(x, 150); c.lineTo(x - 80, 205); c.moveTo(x, 150); c.lineTo(x, 190); c.stroke(); }
        // top crane jib that the beam hangs from
        c.fillStyle = '#f2b705'; c.fillRect(0, 34, W, 16); c.fillStyle = '#c79100'; c.fillRect(0, 50, W, 5);
        c.strokeStyle = '#c79100'; c.lineWidth = 3; c.beginPath(); for (var k = 0; k < W; k += 40) { c.moveTo(k, 34); c.lineTo(k + 20, 10); c.lineTo(k + 40, 34); } c.moveTo(0, 10); c.lineTo(W, 10); c.stroke();
        pitFog(c, 'rgba(60,90,120,0.8)');
      },
      anim: function (c, t) { }
    },
    train: {
      name: 'm_train', spawns: [[330, 520], [950, 520]], items: [200, 430, 560, 760, 1000, 1090], wind: -150, accent: '#ffd166',
      plats: function () {
        return [
          P(110, 520, 480, 180, 'car'),
          P(690, 520, 480, 180, 'car'),
          P(250, 468, 76, 52, 'crate'),
          P(900, 468, 76, 52, 'crate')
        ];
      },
      bg: function (c) {
        c.fillStyle = grad(c, 0, 0, 0, H, [0, '#16425b', 0.5, '#3a7ca5', 0.8, '#f6c177', 1, '#ffe2a8']); c.fillRect(0, 0, W, H);
        c.fillStyle = 'rgba(255,245,210,0.9)'; c.beginPath(); c.arc(260, 170, 46, 0, TAU); c.fill();
      },
      anim: function (c, t) {
        var i, x;
        // far hills
        c.fillStyle = '#2f6690'; c.beginPath(); c.moveTo(0, H);
        for (x = 0; x <= W; x += 20) { var xx = x + t * 40; c.lineTo(x, 470 - Math.sin(xx * 0.006) * 50 - Math.sin(xx * 0.017) * 22); }
        c.lineTo(W, H); c.fill();
        c.fillStyle = '#1f4e6e'; c.beginPath(); c.moveTo(0, H);
        for (x = 0; x <= W; x += 20) { var x2 = x + t * 130; c.lineTo(x, 560 - Math.sin(x2 * 0.008) * 34 - Math.sin(x2 * 0.021) * 14); }
        c.lineTo(W, H); c.fill();
        // poles
        c.fillStyle = '#12303f';
        for (i = 0; i < 4; i++) { x = W + 60 - ((t * 900 + i * 420) % (W + 400)); c.fillRect(x, 300, 12, 420); c.fillRect(x - 34, 316, 80, 8); }
        // ground + speed lines
        c.fillStyle = '#12303f'; c.fillRect(0, 690, W, 30);
        c.strokeStyle = 'rgba(255,255,255,0.25)'; c.lineWidth = 3; c.beginPath();
        for (i = 0; i < 9; i++) { x = W - ((t * 1500 + i * 190) % (W + 200)); var y = 120 + ((i * 97) % 520); c.moveTo(x, y); c.lineTo(x + 90, y); }
        c.stroke();
      }
    },
    ice: {
      name: 'm_ice', spawns: [[270, 560], [1010, 560]], items: [200, 380, 640, 900, 1080], wind: 0, accent: '#9be7ff',
      plats: function () {
        return [
          P(110, 560, 330, 200, 'ice', { fric: 0.1 }),
          P(840, 560, 330, 200, 'ice', { fric: 0.1 }),
          P(505, 520, 270, 60, 'ice', { fric: 0.1, upd: function (p, t) { p.cy = 550 + Math.sin(t * 1.3) * 14; p.cx = 640 + Math.sin(t * 0.5) * 24; } }),
          P(545, 360, 190, 18, 'thin', { thin: true, fric: 0.1, col: '#c9f2ff' })
        ];
      },
      bg: function (c) {
        var r = rng(99), i;
        c.fillStyle = grad(c, 0, 0, 0, H, [0, '#07133a', 0.6, '#16407a', 1, '#2e7fb3']); c.fillRect(0, 0, W, H);
        c.fillStyle = '#fff'; for (i = 0; i < 90; i++) { c.globalAlpha = 0.3 + r() * 0.7; c.fillRect(r() * W, r() * 420, 2, 2); } c.globalAlpha = 1;
        for (i = 0; i < 3; i++) { c.strokeStyle = ['rgba(90,255,190,0.16)', 'rgba(120,200,255,0.14)', 'rgba(200,130,255,0.12)'][i]; c.lineWidth = 46; c.beginPath(); c.moveTo(-40, 170 + i * 46); c.bezierCurveTo(320, 40 + i * 50, 700, 300 + i * 30, 1320, 110 + i * 54); c.stroke(); }
        c.fillStyle = '#5fa8d3';
        for (i = 0; i < 5; i++) { var x = 40 + i * 280 + r() * 60, h = 90 + r() * 120; c.beginPath(); c.moveTo(x - 110, 640); c.lineTo(x - 30, 640 - h); c.lineTo(x + 10, 640 - h * 0.8); c.lineTo(x + 50, 640 - h * 1.1); c.lineTo(x + 130, 640); c.fill(); }
        c.fillStyle = 'rgba(255,255,255,0.3)';
        for (i = 0; i < 5; i++) { c.fillRect(60 + i * 270, 600, 80, 3); }
      },
      anim: function (c, t) {
        c.fillStyle = 'rgba(18,60,110,0.92)'; c.beginPath(); c.moveTo(0, H);
        for (var x = 0; x <= W; x += 16) c.lineTo(x, 668 + Math.sin(x * 0.02 + t * 2) * 5 + Math.sin(x * 0.047 - t * 1.3) * 3);
        c.lineTo(W, H); c.fill();
      }
    },
    tramp: {
      name: 'm_tramp', spawns: [[150, 540], [1130, 540]], items: [150, 410, 640, 870, 1130], wind: 0, accent: '#ff6b9d',
      plats: function () {
        return [
          P(50, 540, 210, 220, 'pod'),
          P(1020, 540, 210, 220, 'pod'),
          P(310, 590, 190, 22, 'tramp', { bounce: 1060 }),
          P(545, 590, 190, 22, 'tramp', { bounce: 1060 }),
          P(780, 590, 190, 22, 'tramp', { bounce: 1060 }),
          P(530, 318, 220, 16, 'thin', { thin: true, col: '#ffd166' })
        ];
      },
      bg: function (c) {
        var i;
        c.fillStyle = grad(c, 0, 0, 0, H, [0, '#ffb3c6', 0.6, '#ffe5b4', 1, '#fff3d6']); c.fillRect(0, 0, W, H);
        cloud(c, 200, 130, 1.4, 'rgba(255,255,255,0.7)'); cloud(c, 900, 170, 1.2, 'rgba(255,255,255,0.7)');
        // big top tent
        for (i = 0; i < 12; i++) { c.fillStyle = i % 2 ? '#ff8fab' : '#fff0f3'; c.beginPath(); c.moveTo(640, 150); c.lineTo(160 + i * 80, 470); c.lineTo(240 + i * 80, 470); c.fill(); }
        for (i = 0; i < 12; i++) { c.fillStyle = i % 2 ? '#fb6f92' : '#ffe5ec'; c.fillRect(160 + i * 80, 470, 80, 260); }
        c.fillStyle = '#ffd166'; c.beginPath(); c.moveTo(640, 150); c.lineTo(640, 100); c.lineTo(690, 115); c.lineTo(640, 130); c.fill();
        // bunting
        c.strokeStyle = 'rgba(90,50,70,0.5)'; c.lineWidth = 2; c.beginPath(); c.moveTo(0, 60); c.quadraticCurveTo(640, 150, W, 60); c.stroke();
        var cols = ['#ff6b9d', '#ffd166', '#06d6a0', '#4cc9f0', '#b388ff'];
        for (i = 0; i < 26; i++) { var u = i / 25, x = u * W, y = 60 + 90 * (1 - Math.pow(2 * u - 1, 2)) * 1; c.fillStyle = cols[i % 5]; c.beginPath(); c.moveTo(x - 12, y); c.lineTo(x + 12, y); c.lineTo(x, y + 24); c.fill(); }
        pitFog(c, 'rgba(120,60,90,0.75)');
      },
      anim: function (c, t) {
        var cols = ['#ff6b9d', '#4cc9f0', '#06d6a0', '#ffd166'];
        for (var i = 0; i < 4; i++) { var x = 90 + i * 360 + Math.sin(t * 0.6 + i) * 18, y = 260 + Math.sin(t * 0.9 + i * 2) * 20 + (i % 2) * 60; c.strokeStyle = 'rgba(90,50,70,0.4)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(x, y + 22); c.quadraticCurveTo(x + 8, y + 60, x, y + 100); c.stroke(); c.fillStyle = cols[i]; c.beginPath(); c.ellipse(x, y, 18, 22, 0, 0, TAU); c.fill(); c.fillStyle = 'rgba(255,255,255,0.5)'; c.beginPath(); c.ellipse(x - 6, y - 8, 4, 6, 0, 0, TAU); c.fill(); }
      }
    },
    spin: {
      name: 'm_spin', spawns: [[200, 540], [1080, 540]], items: [150, 290, 640, 990, 1130], wind: 0, accent: '#b388ff',
      plats: function () {
        return [
          P(70, 540, 300, 220, 'metal'),
          P(910, 540, 300, 220, 'metal'),
          P(430, 437, 420, 26, 'spin', { upd: function (p, t) { p.ang = t * 0.4; } }),
          P(140, 350, 150, 16, 'thin', { thin: true, col: '#7df9ff' }),
          P(990, 350, 150, 16, 'thin', { thin: true, col: '#7df9ff' })
        ];
      },
      bg: function (c) {
        c.fillStyle = grad(c, 0, 0, 0, H, [0, '#1a0b3b', 0.6, '#3c1a78', 1, '#6a2c91']); c.fillRect(0, 0, W, H);
        c.strokeStyle = 'rgba(180,130,255,0.14)'; c.lineWidth = 2; c.beginPath();
        for (var x = 0; x <= W; x += 64) { c.moveTo(x, 0); c.lineTo(x, H); } for (var y = 0; y <= H; y += 64) { c.moveTo(0, y); c.lineTo(W, y); } c.stroke();
        c.fillStyle = 'rgba(10,4,30,0.6)'; c.fillRect(0, 640, W, 80);
        c.fillStyle = '#2a1259'; c.fillRect(100, 80, 22, 560); c.fillRect(1158, 80, 22, 560); c.fillRect(0, 70, W, 20);
        for (var i = 0; i < 16; i++) { c.fillStyle = i % 2 ? '#ffcf3f' : '#2a1259'; c.fillRect(i * 80, 86, 80, 6); }
        pitFog(c, 'rgba(10,4,30,0.9)');
      },
      anim: function (c, t) {
        function gear(x, y, r, a, col) { c.save(); c.translate(x, y); c.rotate(a); c.fillStyle = col; c.beginPath(); for (var i = 0; i < 12; i++) { var a0 = i / 12 * TAU; c.lineTo(Math.cos(a0) * r, Math.sin(a0) * r); c.lineTo(Math.cos(a0 + 0.14) * (r + 16), Math.sin(a0 + 0.14) * (r + 16)); c.lineTo(Math.cos(a0 + 0.38) * (r + 16), Math.sin(a0 + 0.38) * (r + 16)); c.lineTo(Math.cos(a0 + 0.52) * r, Math.sin(a0 + 0.52) * r); } c.fill(); c.fillStyle = '#2c1362'; c.beginPath(); c.arc(0, 0, r * 0.35, 0, TAU); c.fill(); c.restore(); }
        c.save(); c.globalAlpha = 0.5; gear(360, 250, 90, t * 0.4, '#4b2390'); gear(538, 196, 56, -t * 0.64 + 0.2, '#5a2ca8'); gear(900, 280, 110, -t * 0.3, '#4b2390'); c.restore();
      }
    }
  };
  var ORDER = ['roof', 'crane', 'train', 'ice', 'tramp', 'spin'];
  var M = G.maps = { order: ORDER, defs: DEFS };

  M.build = function (id, pxScale) {
    var d = DEFS[id], m = { id: id, def: d, plats: d.plats(), spawns: d.spawns, items: d.items, wind: d.wind, t: 0 };
    var q = Math.max(0.5, Math.min(2, pxScale || 1));
    var cv = document.createElement('canvas'); cv.width = Math.round(W * q); cv.height = Math.round(H * q);
    var c = cv.getContext('2d'); c.scale(q, q); d.bg(c); m.bg = cv;
    M.setTime(m, 0, 0);
    return m;
  };
  M.setTime = function (m, t, dt) {
    m.t = t;
    for (var i = 0; i < m.plats.length; i++) {
      var p = m.plats[i]; if (!p.upd) continue;
      var ox = p.cx, oy = p.cy, oa = p.ang; p.upd(p, t);
      if (dt > 0) { p.vx = (p.cx - ox) / dt; p.vy = (p.cy - oy) / dt; p.w = (p.ang - oa) / dt; }
    }
  };

  /* ---------- platform painting (local space, centred) ---------- */
  M.drawPlat = function (c, p, t) {
    var hw = p.hw, hh = p.hh, i, x;
    c.save(); c.translate(p.cx, p.cy); if (p.ang) c.rotate(p.ang);
    switch (p.style) {
      case 'roof':
        c.fillStyle = '#3b2a55'; c.fillRect(-hw + 14, -hh + 16, hw * 2 - 28, 400);
        c.fillStyle = 'rgba(255,214,130,0.8)';
        for (var wy = -hh + 50; wy < hh + 40; wy += 44) for (x = -hw + 50; x < hw - 60; x += 62) if (((x * 7 + wy * 13) | 0) % 5 !== 0) c.fillRect(x, wy, 26, 22);
        c.fillStyle = '#8d7aa8'; c.fillRect(-hw, -hh, hw * 2, 20); c.fillStyle = '#b9a7d1'; c.fillRect(-hw, -hh, hw * 2, 6); c.fillStyle = '#5a4777'; c.fillRect(-hw, -hh + 20, hw * 2, 5);
        break;
      case 'ac':
        c.fillStyle = '#9aa5b1'; rr(c, -hw, -hh, hw * 2, hh * 2, 6); c.fill(); c.fillStyle = '#c8d1da'; c.fillRect(-hw, -hh, hw * 2, 7);
        c.strokeStyle = '#6b7785'; c.lineWidth = 3; c.beginPath(); for (i = -hh + 18; i < hh - 6; i += 9) { c.moveTo(-hw + 12, i); c.lineTo(hw - 50, i); } c.stroke();
        c.fillStyle = '#56616e'; c.beginPath(); c.arc(hw - 26, 2, 16, 0, TAU); c.fill(); c.strokeStyle = '#c8d1da'; c.lineWidth = 3; c.beginPath(); var fa = t * 9; for (i = 0; i < 3; i++) { c.moveTo(hw - 26, 2); c.lineTo(hw - 26 + Math.cos(fa + i * 2.094) * 13, 2 + Math.sin(fa + i * 2.094) * 13); } c.stroke();
        break;
      case 'thin':
        if (p.legs) { c.strokeStyle = 'rgba(40,30,60,0.75)'; c.lineWidth = 6; c.beginPath(); c.moveTo(-hw + 16, hh); c.lineTo(-hw + 16, hh + p.legs); c.moveTo(hw - 16, hh); c.lineTo(hw - 16, hh + p.legs); c.stroke(); c.lineWidth = 3; c.beginPath(); c.moveTo(-hw + 16, hh + 10); c.lineTo(hw - 16, hh + p.legs * 0.6); c.moveTo(hw - 16, hh + 10); c.lineTo(-hw + 16, hh + p.legs * 0.6); c.stroke(); }
        if (p.cable) { c.strokeStyle = 'rgba(30,30,40,0.7)'; c.lineWidth = 3; c.beginPath(); c.moveTo(-hw + 12, -hh); c.lineTo(-hw + 12, -720); c.moveTo(hw - 12, -hh); c.lineTo(hw - 12, -720); c.stroke(); }
        c.fillStyle = 'rgba(0,0,0,0.25)'; rr(c, -hw, -hh + 4, hw * 2, hh * 2, 6); c.fill();
        c.fillStyle = p.col || '#ddd'; rr(c, -hw, -hh, hw * 2, hh * 2, 6); c.fill();
        c.fillStyle = 'rgba(255,255,255,0.45)'; rr(c, -hw + 3, -hh + 2, hw * 2 - 6, 4, 2); c.fill();
        break;
      case 'scaf':
        c.strokeStyle = '#6c757d'; c.lineWidth = 7; c.beginPath();
        for (x = -hw + 20; x <= hw - 20; x += (hw * 2 - 40) / 3) { c.moveTo(x, -hh + 10); c.lineTo(x, 400); }
        c.stroke(); c.lineWidth = 4; c.beginPath();
        for (i = 0; i < 3; i++) { var x0 = -hw + 20 + i * (hw * 2 - 40) / 3, x1 = x0 + (hw * 2 - 40) / 3; c.moveTo(x0, -hh + 30); c.lineTo(x1, -hh + 130); c.moveTo(x1, -hh + 30); c.lineTo(x0, -hh + 130); c.moveTo(x0, -hh + 130); c.lineTo(x1, -hh + 130); }
        c.stroke();
        c.fillStyle = '#b5651d'; c.fillRect(-hw, -hh, hw * 2, 20); c.fillStyle = '#d98e45'; c.fillRect(-hw, -hh, hw * 2, 6);
        c.fillStyle = 'rgba(0,0,0,0.2)'; for (x = -hw + 60; x < hw; x += 60) c.fillRect(x, -hh, 2, 20);
        for (i = 0; i < 6; i++) { c.fillStyle = i % 2 ? '#222' : '#ffcf3f'; c.fillRect(-hw + i * (hw * 2 / 6), -hh + 20, hw * 2 / 6, 6); }
        break;
      case 'beam':
        c.strokeStyle = 'rgba(30,30,40,0.8)'; c.lineWidth = 3; c.beginPath(); c.moveTo(-hw + 20, -hh); c.lineTo(0, -160); c.moveTo(hw - 20, -hh); c.lineTo(0, -160); c.moveTo(0, -160); c.lineTo(0, -720); c.stroke();
        c.fillStyle = '#c1121f'; c.fillRect(-hw, -hh, hw * 2, 8); c.fillRect(-hw, hh - 8, hw * 2, 8); c.fillStyle = '#9d0208'; c.fillRect(-hw + 4, -hh + 8, hw * 2 - 8, hh * 2 - 16);
        c.fillStyle = '#e85d04'; c.fillRect(-hw, -hh, hw * 2, 3);
        c.fillStyle = 'rgba(0,0,0,0.3)'; for (x = -hw + 14; x < hw; x += 28) { c.beginPath(); c.arc(x, 0, 2.5, 0, TAU); c.fill(); }
        break;
      case 'car':
        c.fillStyle = '#1b3a4b'; c.fillRect(-hw + 30, hh - 24, hw * 2 - 60, 30);
        c.fillStyle = '#ae2012'; rr(c, -hw, -hh + 10, hw * 2, hh * 2 - 30, 10); c.fill();
        c.fillStyle = '#ca6702'; c.fillRect(-hw, -hh + 70, hw * 2, 10);
        c.fillStyle = '#ffe8a3'; for (x = -hw + 30; x < hw - 50; x += 74) { rr(c, x, -hh + 30, 46, 30, 5); c.fill(); }
        c.fillStyle = '#e9d8a6'; rr(c, -hw - 4, -hh, hw * 2 + 8, 16, 7); c.fill(); c.fillStyle = 'rgba(255,255,255,0.5)'; c.fillRect(-hw, -hh + 2, hw * 2, 3);
        c.fillStyle = '#0b1f2a';
        for (i = 0; i < 4; i++) { x = -hw + 60 + i * (hw * 2 - 120) / 3; c.beginPath(); c.arc(x, hh - 2, 20, 0, TAU); c.fill(); c.strokeStyle = '#94a3ad'; c.lineWidth = 3; c.beginPath(); var wa = t * 20; c.moveTo(x + Math.cos(wa) * 16, hh - 2 + Math.sin(wa) * 16); c.lineTo(x - Math.cos(wa) * 16, hh - 2 - Math.sin(wa) * 16); c.stroke(); }
        break;
      case 'crate':
        c.fillStyle = '#a47148'; rr(c, -hw, -hh, hw * 2, hh * 2, 4); c.fill(); c.strokeStyle = '#6f4518'; c.lineWidth = 4; c.strokeRect(-hw + 4, -hh + 4, hw * 2 - 8, hh * 2 - 8);
        c.beginPath(); c.moveTo(-hw + 4, -hh + 4); c.lineTo(hw - 4, hh - 4); c.moveTo(hw - 4, -hh + 4); c.lineTo(-hw + 4, hh - 4); c.stroke();
        c.fillStyle = '#d4a373'; c.fillRect(-hw, -hh, hw * 2, 5);
        break;
      case 'ice':
        c.fillStyle = grad(c, 0, -hh, 0, hh, [0, '#bfefff', 0.25, '#7cc6e8', 1, '#3a86c8']); rr(c, -hw, -hh, hw * 2, hh * 2 + 60, 14); c.fill();
        c.fillStyle = '#f4fdff'; rr(c, -hw, -hh, hw * 2, 12, 6); c.fill();
        c.fillStyle = 'rgba(255,255,255,0.35)'; c.beginPath(); c.moveTo(-hw + 30, -hh + 24); c.lineTo(-hw + 70, -hh + 24); c.lineTo(-hw + 40, -hh + 70); c.lineTo(-hw + 20, -hh + 70); c.fill();
        c.beginPath(); c.moveTo(hw - 90, -hh + 30); c.lineTo(hw - 70, -hh + 30); c.lineTo(hw - 92, -hh + 60); c.lineTo(hw - 104, -hh + 60); c.fill();
        break;
      case 'pod':
        for (i = 0; i < 6; i++) { c.fillStyle = i % 2 ? '#ef476f' : '#fff1e6'; c.fillRect(-hw + i * hw / 3, -hh + 14, hw / 3, 400); }
        c.fillStyle = '#ffd166'; rr(c, -hw - 6, -hh, hw * 2 + 12, 20, 8); c.fill(); c.fillStyle = 'rgba(255,255,255,0.6)'; c.fillRect(-hw, -hh + 3, hw * 2, 3);
        break;
      case 'tramp':
        var dip = p.sq * 16;
        c.strokeStyle = '#495057'; c.lineWidth = 7; c.beginPath(); c.moveTo(-hw + 8, 0); c.lineTo(-hw - 6, 150); c.moveTo(hw - 8, 0); c.lineTo(hw + 6, 150); c.stroke();
        c.strokeStyle = '#adb5bd'; c.lineWidth = 3; c.beginPath(); for (x = -hw + 14; x < hw - 8; x += 14) { c.moveTo(x, hh - 2); c.lineTo(x + 5, -hh + 6 + dip * (1 - Math.abs(x / hw))); } c.stroke();
        c.fillStyle = '#343a40'; rr(c, -hw, -hh + 6, hw * 2, hh * 2 - 6, 8); c.fill();
        c.strokeStyle = '#4cc9f0'; c.lineWidth = 8; c.lineCap = 'round'; c.beginPath(); c.moveTo(-hw + 6, -hh + 3); c.quadraticCurveTo(0, -hh + 3 + dip * 2, hw - 6, -hh + 3); c.stroke();
        c.strokeStyle = 'rgba(255,255,255,0.6)'; c.lineWidth = 2; c.beginPath(); c.moveTo(-hw + 10, -hh + 1); c.quadraticCurveTo(0, -hh + 1 + dip * 2, hw - 10, -hh + 1); c.stroke();
        break;
      case 'metal':
        c.fillStyle = '#2a1259'; c.fillRect(-hw + 10, -hh + 10, hw * 2 - 20, 400);
        c.strokeStyle = 'rgba(180,130,255,0.35)'; c.lineWidth = 3; c.beginPath(); for (x = -hw + 40; x < hw - 20; x += 50) { c.moveTo(x, -hh + 30); c.lineTo(x, 300); } c.stroke();
        c.fillStyle = '#8d99ae'; c.fillRect(-hw, -hh, hw * 2, 20); c.fillStyle = '#dfe6f0'; c.fillRect(-hw, -hh, hw * 2, 5);
        for (i = 0; i < 9; i++) { c.fillStyle = i % 2 ? '#222' : '#ffcf3f'; c.fillRect(-hw + i * (hw * 2 / 9), -hh + 20, hw * 2 / 9, 6); }
        break;
      case 'spin':
        c.fillStyle = '#8d99ae'; rr(c, -hw, -hh, hw * 2, hh * 2, 12); c.fill();
        c.save(); rr(c, -hw, -hh, hw * 2, hh * 2, 12); c.clip();
        c.fillStyle = '#ffcf3f'; for (x = -hw - 20; x < hw; x += 44) { c.beginPath(); c.moveTo(x, hh); c.lineTo(x + 22, hh); c.lineTo(x + 44, -hh); c.lineTo(x + 22, -hh); c.fill(); }
        c.fillStyle = 'rgba(255,255,255,0.4)'; c.fillRect(-hw, -hh, hw * 2, 4); c.fillStyle = 'rgba(0,0,0,0.25)'; c.fillRect(-hw, hh - 4, hw * 2, 4); c.restore();
        c.fillStyle = '#2b2d42'; c.beginPath(); c.arc(0, 0, 22, 0, TAU); c.fill(); c.fillStyle = '#edf2f4'; c.beginPath(); c.arc(0, 0, 9, 0, TAU); c.fill();
        break;
    }
    c.restore();
  };
})();
