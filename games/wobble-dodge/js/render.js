/* Rendering: gym + court, wobbly fighters (Wobble Brawl drawFighter), balls per special, juice, HUD. */
(function () {
  'use strict';
  var G = window.G, W = G.W, H = G.H, TAU = Math.PI * 2, INK = '#1b1b2f', FY = G.FY, ZPX = G.ZPX, CX = G.CX, BL = G.BL, BR = G.BR;
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function rr(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  G.rr = rr;

  function drawHat(c, hat, now) {
    switch (hat) {
      case 'spiky': for (var si = 0; si < 5; si++) { var sa = -2.6 + si * 0.48, sx = Math.cos(sa) * 11, sy = Math.sin(sa) * 11 - 2; c.fillStyle = INK; c.beginPath(); c.moveTo(sx - 5, sy + 3); c.lineTo(sx * 1.9, sy * 1.9 - 4); c.lineTo(sx + 5, sy + 3); c.fill(); c.fillStyle = '#ffe14d'; c.beginPath(); c.moveTo(sx - 3, sy + 2); c.lineTo(sx * 1.8, sy * 1.8 - 3); c.lineTo(sx + 3, sy + 2); c.fill(); }
        if (((now * 6) | 0) % 3 === 0) { c.strokeStyle = '#bff0ff'; c.lineWidth = 2; c.beginPath(); c.moveTo(12, -22); c.lineTo(17, -27); c.lineTo(14, -28); c.lineTo(20, -34); c.stroke(); } break;
      case 'longhair': c.fillStyle = INK; c.beginPath(); c.moveTo(-6, -14); c.quadraticCurveTo(-30, -8 + Math.sin(now * 5) * 3, -40, 10 + Math.sin(now * 4) * 4); c.quadraticCurveTo(-22, 4, -10, 6); c.closePath(); c.fill(); c.beginPath(); c.arc(0, -3, 14, Math.PI * 0.95, TAU * 0.98); c.fill();
        c.fillStyle = '#5b3fb3'; c.beginPath(); c.moveTo(-6, -11); c.quadraticCurveTo(-28, -6 + Math.sin(now * 5) * 3, -36, 8 + Math.sin(now * 4) * 4); c.quadraticCurveTo(-21, 2, -10, 3); c.closePath(); c.fill(); c.beginPath(); c.arc(0, -3, 11.5, Math.PI, TAU * 0.97); c.fill(); break;
      case 'scarf': c.strokeStyle = INK; c.lineWidth = 8; c.lineCap = 'round'; c.beginPath(); c.moveTo(-4, 11); c.quadraticCurveTo(-18, 12 + Math.sin(now * 9) * 4, -34, 6 + Math.sin(now * 7) * 6); c.stroke(); c.strokeStyle = '#e63946'; c.lineWidth = 4.5; c.stroke();
        c.strokeStyle = INK; c.lineWidth = 7; c.beginPath(); c.moveTo(-12, -6); c.lineTo(12, -6); c.stroke(); c.strokeStyle = '#2b2d52'; c.lineWidth = 4; c.stroke(); break;
      case 'gourd': c.strokeStyle = INK; c.lineWidth = 3; c.beginPath(); c.moveTo(-9, -9); c.lineTo(-17, -1); c.stroke(); c.fillStyle = INK; c.beginPath(); c.arc(-19, 4, 7, 0, TAU); c.arc(-18, -4, 5, 0, TAU); c.fill();
        c.fillStyle = '#e8a33d'; c.beginPath(); c.arc(-19, 4, 5, 0, TAU); c.arc(-18, -4, 3.4, 0, TAU); c.fill(); c.fillStyle = '#e63946'; c.fillRect(-20, -1, 4, 2); break;
      case 'headset': c.strokeStyle = INK; c.lineWidth = 5; c.beginPath(); c.arc(0, -2, 14, Math.PI * 1.05, TAU * 0.97); c.stroke(); c.strokeStyle = '#ff70b8'; c.lineWidth = 2.5; c.stroke();
        c.fillStyle = INK; c.beginPath(); c.arc(12, -1, 4.5, 0, TAU); c.fill(); c.strokeStyle = INK; c.lineWidth = 2; c.beginPath(); c.moveTo(13, 1); c.quadraticCurveTo(14, 9, 8, 10); c.stroke(); c.fillStyle = '#ffd23f'; star5(c, -4, -18, 5); break;
      case 'flame': for (var fl = 0; fl < 3; fl++) { var fx2 = -8 + fl * 8, fh = 16 + 6 * Math.sin(now * 12 + fl * 2); c.fillStyle = INK; c.beginPath(); c.moveTo(fx2 - 7, -8); c.quadraticCurveTo(fx2 - 5, -8 - fh, fx2 + 1, -10 - fh - 4); c.quadraticCurveTo(fx2 + 6, -8 - fh * 0.6, fx2 + 7, -8); c.fill(); c.fillStyle = fl === 1 ? '#ffd23f' : '#ff5a4f'; c.beginPath(); c.moveTo(fx2 - 5, -8); c.quadraticCurveTo(fx2 - 3, -8 - fh * 0.85, fx2 + 1, -9 - fh); c.quadraticCurveTo(fx2 + 4, -8 - fh * 0.5, fx2 + 5, -8); c.fill(); } break;
      case 'catears': for (var ce = -1; ce <= 1; ce += 2) { c.fillStyle = INK; c.beginPath(); c.moveTo(ce * 3, -11); c.lineTo(ce * 13, -27); c.lineTo(ce * 15, -6); c.fill(); c.fillStyle = '#ff8fd0'; c.beginPath(); c.moveTo(ce * 6, -11); c.lineTo(ce * 12, -21); c.lineTo(ce * 12.5, -9); c.fill(); } break;
      case 'shades': c.fillStyle = INK; c.fillRect(-4, -5, 17, 3); c.beginPath(); c.ellipse(1.5, -1.5, 4.5, 3.4, 0, 0, TAU); c.ellipse(9.5, -1.5, 4.5, 3.4, 0, 0, TAU); c.fill(); c.fillStyle = 'rgba(255,255,255,0.5)'; c.fillRect(0, -3.5, 2, 1.5); c.fillRect(8, -3.5, 2, 1.5); break;
      case 'antenna': for (var an = -1; an <= 1; an += 2) { var aw = Math.sin(now * 6 + an) * 3; c.strokeStyle = INK; c.lineWidth = 2.5; c.beginPath(); c.moveTo(an * 5, -12); c.quadraticCurveTo(an * 8, -24, an * 10 + aw, -30); c.stroke(); c.fillStyle = INK; c.beginPath(); c.arc(an * 10 + aw, -30, 4.5, 0, TAU); c.fill(); c.fillStyle = '#ffd23f'; c.beginPath(); c.arc(an * 10 + aw, -30, 3, 0, TAU); c.fill(); }
        c.strokeStyle = 'rgba(27,27,47,0.55)'; c.lineWidth = 3; c.beginPath(); c.moveTo(-12, 2); c.lineTo(12, 2); c.moveTo(-13, 7); c.lineTo(13, 7); c.stroke(); break;
      case 'cloud': c.fillStyle = INK; c.beginPath(); c.arc(-9, -12, 9, 0, TAU); c.arc(2, -17, 11, 0, TAU); c.arc(12, -11, 8, 0, TAU); c.fill(); c.fillStyle = '#ffffff'; c.beginPath(); c.arc(-9, -12, 7, 0, TAU); c.arc(2, -17, 9, 0, TAU); c.arc(12, -11, 6, 0, TAU); c.fill(); break;
      case 'goggles': c.strokeStyle = INK; c.lineWidth = 6; c.beginPath(); c.moveTo(-13, -9); c.lineTo(13, -9); c.stroke(); c.strokeStyle = '#8a5a2b'; c.lineWidth = 3.5; c.stroke();
        for (var gg = 0; gg < 2; gg++) { c.fillStyle = INK; c.beginPath(); c.arc(-1 + gg * 10, -11, 5.5, 0, TAU); c.fill(); c.fillStyle = '#6ecbff'; c.beginPath(); c.arc(-1 + gg * 10, -11, 3.6, 0, TAU); c.fill(); } break;
      case 'star': c.strokeStyle = INK; c.lineWidth = 7; c.beginPath(); c.moveTo(-12, -7); c.lineTo(12, -7); c.stroke(); c.strokeStyle = '#ff5a4f'; c.lineWidth = 4; c.stroke();
        c.save(); c.translate(0, -16); c.rotate(Math.sin(now * 3) * 0.15); c.fillStyle = INK; star5(c, 0, 0, 12); c.fillStyle = '#ffd23f'; star5(c, 0, 0, 8.5); c.restore(); break;
      case 'flower': c.strokeStyle = INK; c.lineWidth = 6; c.beginPath(); c.arc(0, 0, 13, Math.PI * 1.1, Math.PI * 1.9); c.stroke(); c.strokeStyle = '#8ee53f'; c.lineWidth = 3; c.stroke();
        var fc = ['#ff8fd0', '#ffd23f', '#6ecbff']; for (var fi = 0; fi < 3; fi++) { var fx = -9 + fi * 9, fy = -12 - (fi === 1 ? 4 : 0); c.fillStyle = INK; c.beginPath(); c.arc(fx, fy, 6.5, 0, TAU); c.fill(); c.fillStyle = fc[fi]; c.beginPath(); c.arc(fx, fy, 4.6, 0, TAU); c.fill(); c.fillStyle = '#fff3b0'; c.beginPath(); c.arc(fx, fy, 1.8, 0, TAU); c.fill(); } break;
      case 'wizard': c.fillStyle = INK; c.beginPath(); c.moveTo(-18, -5); c.lineTo(18, -5); c.lineTo(14, -10); c.lineTo(4, -44); c.lineTo(-14, -10); c.closePath(); c.fill();
        c.fillStyle = '#6a3fd1'; c.beginPath(); c.moveTo(-14, -8); c.lineTo(14, -8); c.lineTo(11, -11); c.lineTo(4, -39); c.lineTo(-11, -11); c.closePath(); c.fill();
        c.fillStyle = '#ffd23f'; star5(c, -2, -20, 4.5); star5(c, 5, -30, 3); break;
      case 'pirate': c.fillStyle = INK; c.beginPath(); c.moveTo(-20, -6); c.quadraticCurveTo(0, -38, 20, -6); c.quadraticCurveTo(0, -14, -20, -6); c.fill();
        c.fillStyle = '#2b2d52'; c.beginPath(); c.moveTo(-16, -8); c.quadraticCurveTo(0, -33, 16, -8); c.quadraticCurveTo(0, -15, -16, -8); c.fill();
        c.fillStyle = '#fff'; c.beginPath(); c.arc(0, -18, 3.4, 0, TAU); c.fill(); c.strokeStyle = '#fff'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(-4, -12); c.lineTo(4, -15); c.moveTo(4, -12); c.lineTo(-4, -15); c.stroke(); break;
      case 'viking': for (var vh = -1; vh <= 1; vh += 2) { c.fillStyle = INK; c.beginPath(); c.moveTo(vh * 10, -8); c.quadraticCurveTo(vh * 24, -12, vh * 22, -30); c.quadraticCurveTo(vh * 17, -17, vh * 6, -13); c.fill(); c.fillStyle = '#fff3d6'; c.beginPath(); c.moveTo(vh * 10, -10); c.quadraticCurveTo(vh * 21, -13, vh * 20.5, -26); c.quadraticCurveTo(vh * 16, -17, vh * 8, -13); c.fill(); }
        c.fillStyle = INK; c.beginPath(); c.arc(0, -3, 14.5, Math.PI, TAU); c.fill(); c.fillStyle = '#aab4c3'; c.beginPath(); c.arc(0, -4, 12, Math.PI, TAU); c.fill(); c.fillStyle = '#c9a227'; c.fillRect(-12, -7, 24, 3.5); break;
      case 'goldcrown': c.fillStyle = INK; c.beginPath(); c.moveTo(-15, -5); c.lineTo(-17, -30); c.lineTo(-8, -19); c.lineTo(0, -35); c.lineTo(8, -19); c.lineTo(17, -30); c.lineTo(15, -5); c.fill();
        c.fillStyle = '#ffd23f'; c.beginPath(); c.moveTo(-12, -8); c.lineTo(-13.5, -25); c.lineTo(-7, -16); c.lineTo(0, -30); c.lineTo(7, -16); c.lineTo(13.5, -25); c.lineTo(12, -8); c.fill();
        var gl = 0.5 + 0.5 * Math.sin(now * 6); c.fillStyle = 'rgba(255,255,255,' + (0.4 + 0.5 * gl) + ')'; star5(c, 0, -22, 3 + gl * 2); c.fillStyle = '#ff5a4f'; c.beginPath(); c.arc(-7, -11, 2.4, 0, TAU); c.arc(7, -11, 2.4, 0, TAU); c.fill(); c.fillStyle = '#6ecbff'; c.beginPath(); c.arc(0, -11, 2.6, 0, TAU); c.fill(); break;
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
      case 'hero':   // the kid from the opening: messy brown hair + band-aid (hood is on the body)
        c.fillStyle = INK; c.beginPath(); c.moveTo(-6, 11); c.quadraticCurveTo(-16.5, 5, -15, -5); c.lineTo(-18, -8); c.lineTo(-14, -10); c.lineTo(-14.5, -15); c.lineTo(-8.5, -15); c.lineTo(-6, -20); c.lineTo(-1, -16); c.lineTo(3, -20.5); c.lineTo(6, -15.5); c.lineTo(12, -17); c.lineTo(11.5, -11.5); c.lineTo(17.5, -9); c.lineTo(11, -6.5); c.quadraticCurveTo(6, -9, 2, -5.5); c.quadraticCurveTo(-3, -4, -5, 0); c.quadraticCurveTo(-6, 6, -6, 11); c.fill();
        c.fillStyle = '#6e3f1f'; c.beginPath(); c.moveTo(-5.2, 9); c.quadraticCurveTo(-15, 4.5, -13.6, -5); c.lineTo(-15.8, -7.8); c.lineTo(-12.6, -9.2); c.lineTo(-13, -13.6); c.lineTo(-8, -13.6); c.lineTo(-5.6, -17.8); c.lineTo(-1.2, -14.4); c.lineTo(2.8, -18.4); c.lineTo(5.4, -14); c.lineTo(10.6, -15.4); c.lineTo(10.2, -10.6); c.lineTo(15, -8.8); c.lineTo(10.6, -7.6); c.quadraticCurveTo(6, -10.4, 1.4, -6.8); c.quadraticCurveTo(-4.2, -5.4, -6.2, -0.6); c.quadraticCurveTo(-6.6, 5, -5.2, 9); c.fill();
        c.save(); c.translate(4.2, 4.6); c.rotate(-0.3); c.fillStyle = INK; c.fillRect(-3.4, -1.6, 6.8, 3.2); c.fillStyle = '#f4d9a8'; c.fillRect(-2.9, -1.1, 5.8, 2.2); c.restore(); break;
      case 'dexcap':   // Dex: curly black hair + backwards blue cap (brim to the back)
        c.fillStyle = INK; c.beginPath(); for (var dq = 0; dq < 5; dq++) { var da = Math.PI * (0.62 + dq * 0.12); c.moveTo(Math.cos(da) * 12.5 + 4.6, Math.sin(da) * 12.5 - 1); c.arc(Math.cos(da) * 12.5, Math.sin(da) * 12.5 - 1, 4.6, 0, TAU); } c.fill();
        c.fillStyle = '#24201f'; c.beginPath(); for (dq = 0; dq < 5; dq++) { da = Math.PI * (0.62 + dq * 0.12); c.moveTo(Math.cos(da) * 12.5 + 3.4, Math.sin(da) * 12.5 - 1); c.arc(Math.cos(da) * 12.5, Math.sin(da) * 12.5 - 1, 3.4, 0, TAU); } c.fill();
        c.fillStyle = INK; c.beginPath(); c.arc(0, -3, 14.4, Math.PI, TAU); c.fill(); c.fillRect(-23, -6.5, 15, 6);
        c.fillStyle = '#2f7de1'; c.beginPath(); c.arc(0, -4, 12.4, Math.PI, TAU); c.fill(); c.fillRect(-21.5, -5.2, 13, 3); c.fillStyle = '#1f5fb3'; c.fillRect(-12.4, -6.2, 24.8, 2.2); c.fillStyle = INK; c.beginPath(); c.arc(0, -16.6, 2, 0, TAU); c.fill(); break;
      case 'crown': c.fillStyle = INK; c.beginPath(); c.moveTo(-13, -5); c.lineTo(-15, -26); c.lineTo(-6, -17); c.lineTo(0, -29); c.lineTo(6, -17); c.lineTo(15, -26); c.lineTo(13, -5); c.fill(); c.fillStyle = '#ffc400'; c.beginPath(); c.moveTo(-10.5, -7.5); c.lineTo(-12, -20); c.lineTo(-5.5, -13.5); c.lineTo(0, -24); c.lineTo(5.5, -13.5); c.lineTo(12, -20); c.lineTo(10.5, -7.5); c.fill(); c.fillStyle = '#e63946'; c.beginPath(); c.arc(0, -12, 2.4, 0, TAU); c.fill(); break;
    }
  }
  function star5(c, x, y, r) { c.beginPath(); for (var i = 0; i < 10; i++) { var a = -Math.PI / 2 + i * Math.PI / 5, q = i % 2 ? r * 0.45 : r; c.lineTo(x + Math.cos(a) * q, y + Math.sin(a) * q); } c.closePath(); c.fill(); }
  G.drawHat = drawHat;
  /* ---------- in-match face heads: one small sprite sheet (art_game/faces/heads_64.png ~25 KB, or heads_96.png on hi-dpi; made by art/faces/gen_ingame.py).
     Cell = 3.2R square, face circle centre at (1.6R, 2.1R), radius R, 6 x 4 cells in G.CHARS order. Not fetched before the first
     input, so it never competes with the first "TAP TO PLAY"; a match decides once (before the ball is live) whether it
     shows faces, so heads never pop mid-rally. G.faceHeads = false -> the old drawn heads (A/B and fallback). */
  var HD = { ok: false, img: null, white: null, cell: 64, n: 24 }, FR = 13.5 * 1.4, COSM = { star: 1, flower: 1, wizard: 1, pirate: 1, viking: 1, goldcrown: 1 };
  // tight box of each face inside its cell, in 1/64 cell units (x, y, w, h): only these pixels are drawn (about half the cell = half the raster work)
  var HBOX = [6,0,52,64,11,1,47,63,0,21,58,43,10,0,48,64,9,0,49,64,8,0,50,64,10,7,50,57,10,16,54,48,11,10,47,54,11,10,47,54,8,5,52,59,7,10,51,54,3,10,55,54,10,19,48,45,0,20,58,44,11,20,47,44,0,21,58,43,7,10,51,54,10,0,50,64,10,9,54,55,11,20,47,44,11,0,47,64,9,7,49,57,9,19,49,45,
    1,13,58,51,0,12,58,52];   // side-view sheet (art/faces/side/HBOX_side.txt) + row 5: hero, Dex (art/faces/story/post_story.py)
  G.faceHeads = true; G.headSheet = HD;
  (function () {
    var vq = (/\?v=[^&#]*/.exec((document.currentScript && document.currentScript.src) || '') || [''])[0];
    function go() {
      var im = new Image(); im.decoding = 'async';
      im.onload = function () {
        function fin() {
          try {   // flash variant baked once: the sprite washed white (hit flash), no per-frame filters
            var w = document.createElement('canvas'); w.width = im.width; w.height = im.height; var g = w.getContext('2d');
            g.drawImage(im, 0, 0); g.globalCompositeOperation = 'source-atop'; g.fillStyle = 'rgba(255,255,255,0.78)'; g.fillRect(0, 0, w.width, w.height);
            HD.white = w;
          } catch (e) { HD.white = im; }
          HD.img = im; HD.cell = im.width / 6; HD.n = Math.min(G.CHARS.length, Math.round(im.height / HD.cell) * 6, HBOX.length / 4); HD.ok = true;
        }
        if (im.decode) im.decode().then(fin, fin); else fin();
      };
      // 64 px cells (face R 20) for 1x screens / LITE (the slow-laptop case); 96 px cells (R 30, ~42 KB) on hi-dpi so faces stay sharp
      im.src = 'art_game/faces/heads_side_' + ((window.devicePixelRatio || 1) >= 1.5 && !G.lite ? 96 : 64) + '.png' + vq;
    }
    // first load stays untouched (검증/select_kof: no face art before the first tap): fetch on the first input, or when a match
    // that is not the waiting tutorial gets drawn. The tap that starts the tutorial leaves ~0.3 s of intro, usually enough.
    var started = false, EV = ['pointerdown', 'keydown', 'touchstart'];
    function kick() { if (started) return; started = true; EV.forEach(function (n) { window.removeEventListener(n, kick, true); }); setTimeout(go, 0); }
    EV.forEach(function (n) { window.addEventListener(n, kick, { capture: true, passive: true }); });
    HD.kick = kick;
  })();
  function useFaces(M) {
    if (!M.waitInput) HD.kick();
    if (M.fh === undefined) { if (HD.ok && G.faceHeads) M.fh = 1; else if (M.state === 'play' && !M.waitInput) M.fh = 0; }
    return M.fh === 1 && G.faceHeads;
  }
  function headSprite(c, b, e, now) {   // in head space (origin = head centre, x = facing, 1 unit = z*hs)
    var ch = b.ch, cs = HD.cell, R = FR, u = cs / 64, d = 0.05 * R, j = ch * 4, bx = HBOX[j], by = HBOX[j + 1], bw = HBOX[j + 2], bh = HBOX[j + 3];
    if (e === 1 || e === 2) c.scale(1.07, 0.9);   // hit / KO squash
    c.drawImage(b.flash > 0 ? HD.white : HD.img, (ch % 6) * cs + bx * u, ((ch / 6) | 0) * cs + by * u, bw * u, bh * u, -1.6 * R + bx * d, -2.1 * R + by * d, bw * d, bh * d);
    if (e === 2 || e === 1) {   // KO = X eyes, hit = > < eyes, stuck on over the art's eyes
      var ex = 0.51 * R, ey = -0.08 * R, er = 0.27 * R, q = 0.17 * R;   // side view: one eye, forward of centre
      c.fillStyle = '#fff'; c.beginPath(); c.arc(ex, ey, er, 0, TAU); c.fill();
      c.strokeStyle = INK; c.lineWidth = 0.13 * R; c.lineCap = 'round'; c.beginPath();
      if (e === 2) { c.moveTo(ex - q, ey - q); c.lineTo(ex + q, ey + q); c.moveTo(ex + q, ey - q); c.lineTo(ex - q, ey + q); }
      else { c.moveTo(ex - q, ey - q); c.lineTo(ex + q, ey); c.lineTo(ex - q, ey + q); }
      c.stroke();
    }
    if (COSM[b.hat]) { c.save(); c.translate(0, -R * 0.62); c.scale(1.05, 1.05); drawHat(c, b.hat, now); c.restore(); }   // earned cosmetic hat on top of the art
  }
  var P = new Float32Array(22), SHADE = {};
  function shade(h) {   // h under rgba(0,0,20,.25)
    var r = SHADE[h]; if (r) return r;
    var x = h.length === 4 ? '#' + h[1] + h[1] + h[2] + h[2] + h[3] + h[3] : h, n = parseInt(x.slice(1), 16);
    if (x.length !== 7 || isNaN(n)) return (SHADE[h] = h);
    return (SHADE[h] = 'rgb(' + Math.round((n >> 16) * 0.75) + ',' + Math.round(((n >> 8) & 255) * 0.75) + ',' + Math.round((n & 255) * 0.75 + 5) + ')');
  }
  /* ---------- cartoon body (matches the 2D face art: bold ink outline, flat colours, chunky shapes) ----------
     Same 11-point skeleton (0 head, 1 neck, 2 hip, 3/4 front elbow/hand, 5/6 back elbow/hand, 7/8 front knee/foot, 9/10 back).
     Limbs = round-capped strokes, batched: one wide ink stroke under legs + sneakers + back arm, then a colour stroke each; the
     front arm (over the jersey) gets its own ink + colour stroke. Jersey + shorts = 3 fills of cached Path2Ds (ink silhouette,
     team-colour jersey, white shorts + belly stripe) in a hip->neck frame; plain fills measured cheaper than strokes or a
     rotated sprite. No shadows / filters. LITE tier: no ink under legs / back arm (front arm + jersey keep theirs).
     Cost vs the stick bodies: 검증/body_perf.mjs (G.cartoonBody = false draws the old renderer for A/B). */
  var SKIN = ['#f9b7db', '#b5d55c', '#f8e5cb', '#fb9355', '#ca81f8', '#58ccf8', '#f8d72c', '#26c2b9', '#eccbf5', '#ee3b38', '#f4ad7f', '#d1eb63',
    '#6ddaf9', '#ede8f4', '#5b83a5', '#f7a576', '#f0caa9', '#f9b7db', '#f98b4e', '#f9ebaf', '#494a6d', '#f8d72c', '#dcf1f9', '#87cf55',
    '#f7c693', '#ae673d'];   // sampled from heads_96.png (G.CHARS order); last two = the story kids (hero, Dex)
  var TORSO = {}, TL = 31, OL = 2.3;   // neck-hip length in skeleton units, ink outline thickness
  // local frame: hip = (0,0), neck = (0,-TL); o grows the shape by o on every side (for the ink silhouette)
  function jersey(P, th, o) {
    var sw = 14.5 * th + o, ww = 10.2 * th + o, t = -TL - 1 - o, hb = 2.5 + o;
    P.moveTo(-sw + 5, t); P.lineTo(sw - 5, t); P.quadraticCurveTo(sw + 1, t + 1, sw, t + 8);
    P.lineTo(ww + 0.5, hb - 4); P.quadraticCurveTo(ww + 1, hb, ww - 3, hb); P.lineTo(-ww + 3, hb); P.quadraticCurveTo(-ww - 1, hb, -ww - 0.5, hb - 4);
    P.lineTo(-sw, t + 8); P.quadraticCurveTo(-sw - 1, t + 1, -sw + 5, t); P.closePath();
  }
  function shorts(P, th, o) {   // starts under the jersey hem: the gap shows the ink silhouette = the hem line
    var t = 2.5 + OL - o, hw = 11.8 * th + o, w0 = 10.2 * th + o, bt = 13 + o;
    P.moveTo(-w0, t); P.lineTo(w0, t); P.lineTo(hw, bt - 2); P.quadraticCurveTo(hw, bt, hw - 2, bt); P.lineTo(-hw + 2, bt); P.quadraticCurveTo(-hw, bt, -hw, bt - 2); P.closePath();
  }
  function torso(th) {
    var t = TORSO[th]; if (t) return t;
    var o = new Path2D(), j = new Path2D(), s = new Path2D(), sw = 14.5 * th, ww = 10.2 * th;
    jersey(o, th, OL); shorts(o, th, OL); jersey(j, th, 0); shorts(s, th, 0);
    // white band across the belly (the part the arms and the big head cover least)
    var a = -12, b2 = -7.5, wf = function (y) { return sw + (ww - sw) * (y + TL - 7) / (TL - 6.5) - 0.3; };
    s.moveTo(-wf(a), a); s.lineTo(wf(a), a); s.lineTo(wf(b2), b2); s.lineTo(-wf(b2), b2); s.closePath();   // same fill as the shorts (one call)
    return (TORSO[th] = { o: o, j: j, s: s });
  }
  // one limb chain a-b-c
  function limb(c, p, a, b2, e) { c.moveTo(p[a], p[a + 1]); c.lineTo(p[b2], p[b2 + 1]); c.lineTo(p[e], p[e + 1]); }
  // sneaker: a short segment from the foot point forward, square to the shin; the leg's round cap later covers its heel
  function shoe(c, p, k, e, z, f) {
    var dx = p[e] - p[k], dy = p[e + 1] - p[k + 1], d = Math.sqrt(dx * dx + dy * dy) || 1, fx = dy / d * f * z, fy = -dx / d * f * z, x = p[e], y = p[e + 1];
    c.moveTo(x - fx, y - fy); c.lineTo(x + fx * 7, y + fy * 7);
  }
  // the two story kids wear their own clothes (G.CHARS[ch].fit); same strokes and fills as the jersey body, plus a hood lump,
  // a pocket / sleeves, skin hands and a team-colour armband (the team marker, since the shirt is not the team colour)
  var FIT = { hoodie: { top: '#e3342f', top2: '#c4261f', arm: '#e3342f', leg: '#4a7cc4', pants: '#4a7cc4', hood: 1 },
    tee: { top: '#ffd23f', top2: '#e8b820', arm: null, leg: null, pants: '#2b3f73', sleeve: 1 } };
  function fitParts(th) {   // cached per limb thickness: shorts without the belly stripe, hood (+ ink), kangaroo pocket, drawstrings
    var T = torso(th); if (T.x) return T.x;
    var sh = new Path2D(), ho = new Path2D(), hd = new Path2D(), ds = new Path2D(), sw = 14.5 * th, ww = 10.2 * th;
    shorts(sh, th, 0);
    ho.ellipse(sw * 0.72, -TL + 1.5, 8.8 + OL, 6.4 + OL, 0.35, 0, TAU); hd.ellipse(sw * 0.72, -TL + 1.5, 8.8, 6.4, 0.35, 0, TAU);
    hd.moveTo(-ww * 0.72, -13); hd.lineTo(ww * 0.72, -13); hd.lineTo(ww * 0.9, -3.5); hd.lineTo(-ww * 0.9, -3.5); hd.closePath();   // + kangaroo pocket (same fill)
    ds.rect(-sw * 0.42, -TL + 1, 1.6, 9); ds.rect(-sw * 0.12, -TL + 1, 1.6, 8);
    return (T.x = { sh: sh, ho: ho, hd: hd, ds: ds });
  }
  function drawToon(c, b, uni, p, z, col) {
    var th = b.th || 1, zt = z * th, flash = b.flash > 0, f = b.face < 0 ? -1 : 1, C = G.CHARS[b.ch], F = C && C.fit ? FIT[C.fit] : null;
    if (F) { drawFit(c, b, uni, p, z, col, F, th, zt, flash, f); return; }
    var lw = 9.2 * zt, ow = lw + 4.6 * z, lite = G.lite || G.qDown >= 2;
    var jer = flash ? '#fff' : uni;
    // 1) one ink pass under all legs, both sneakers and the back arm; then sneakers, back limbs (shaded), front leg
    if (!lite) { c.beginPath(); limb(c, p, 2, 10, 12); limb(c, p, 4, 18, 20); limb(c, p, 4, 14, 16); shoe(c, p, 18, 20, z, f); shoe(c, p, 14, 16, z, f); c.strokeStyle = INK; c.lineWidth = ow; c.stroke(); }
    c.lineWidth = lw;
    c.beginPath(); shoe(c, p, 18, 20, z, f); shoe(c, p, 14, 16, z, f); c.strokeStyle = '#fff'; c.stroke();
    c.beginPath(); limb(c, p, 2, 10, 12); limb(c, p, 4, 18, 20); c.strokeStyle = shade(col); c.stroke();
    c.beginPath(); limb(c, p, 4, 14, 16); c.strokeStyle = col; c.stroke();
    // shorts + jersey in the hip->neck frame
    var dx = p[2] - p[4], dy = p[3] - p[5], d = Math.sqrt(dx * dx + dy * dy) || 1, s = d / TL, T = torso(th);
    c.save(); c.transform(-dy / d * s, dx / d * s, -dx / d * s, -dy / d * s, p[4], p[5]);
    c.fillStyle = INK; c.fill(T.o); c.fillStyle = jer; c.fill(T.j); c.fillStyle = '#fff'; c.fill(T.s);   // white shorts + belly stripe = one fill
    c.restore();
    // 2) front arm over the jersey
    c.beginPath(); limb(c, p, 2, 6, 8);
    c.strokeStyle = INK; c.lineWidth = ow; c.stroke();   // kept in LITE too: the arm crossing the jersey needs its outline
    c.strokeStyle = col; c.lineWidth = lw; c.stroke();
  }
  function drawFit(c, b, uni, p, z, col, F, th, zt, flash, f) {
    var lw = 9.2 * zt, ow = lw + 4.6 * z, lite = G.lite || G.qDown >= 2, X = fitParts(th), T = torso(th);
    var arm = flash ? '#fff' : F.arm || col, leg = flash ? '#fff' : F.leg || col, top = flash ? '#fff' : F.top;
    if (!lite) { c.beginPath(); limb(c, p, 2, 10, 12); limb(c, p, 4, 18, 20); limb(c, p, 4, 14, 16); shoe(c, p, 18, 20, z, f); shoe(c, p, 14, 16, z, f); c.strokeStyle = INK; c.lineWidth = ow; c.stroke(); }
    c.lineWidth = lw;
    c.beginPath(); shoe(c, p, 18, 20, z, f); shoe(c, p, 14, 16, z, f); c.strokeStyle = '#fff'; c.stroke();
    c.beginPath(); limb(c, p, 4, 18, 20); c.strokeStyle = shade(leg); c.stroke();
    c.beginPath(); limb(c, p, 2, 10, 12); c.strokeStyle = shade(arm); c.stroke();
    if (F.sleeve && !lite) { c.beginPath(); c.moveTo(p[2], p[3]); c.lineTo(p[2] + (p[10] - p[2]) * 0.5, p[3] + (p[11] - p[3]) * 0.5); c.strokeStyle = shade(top); c.lineWidth = lw * 1.2; c.stroke(); c.lineWidth = lw; }
    c.beginPath(); limb(c, p, 4, 14, 16); c.strokeStyle = leg; c.stroke();
    // top + pants in the hip->neck frame (x mirrored with the facing so the hood sits at the back)
    var dx = p[2] - p[4], dy = p[3] - p[5], d = Math.sqrt(dx * dx + dy * dy) || 1, s = d / TL;
    c.save(); c.transform(-dy / d * s, dx / d * s, -dx / d * s, -dy / d * s, p[4], p[5]); if (f < 0) c.scale(-1, 1);
    c.fillStyle = INK; c.fill(T.o);
    c.fillStyle = top; c.fill(T.j); c.fillStyle = flash ? '#fff' : F.pants; c.fill(X.sh);
    if (F.hood) { c.fillStyle = INK; c.fill(X.ho); c.fillStyle = flash ? '#fff' : F.top2; c.fill(X.hd); if (!flash && !lite) { c.fillStyle = '#fff'; c.fill(X.ds); } }
    c.restore();
    // front arm over the top: ink, sleeve/skin, hand, armband in the team colour
    c.beginPath(); limb(c, p, 2, 6, 8);
    c.strokeStyle = INK; c.lineWidth = ow; c.stroke();
    c.strokeStyle = arm; c.lineWidth = lw; c.stroke();
    var ex = p[2] + (p[6] - p[2]) * 0.55, ey = p[3] + (p[7] - p[3]) * 0.55;
    if (F.sleeve) { c.beginPath(); c.moveTo(p[2], p[3]); c.lineTo(ex, ey); c.strokeStyle = INK; c.lineWidth = ow * 1.12; c.stroke(); c.strokeStyle = top; c.lineWidth = lw * 1.2; c.stroke(); }
    if (F.arm && !lite) { c.fillStyle = flash ? '#fff' : col; c.beginPath(); c.arc(p[8], p[9], lw * 0.42, 0, TAU); c.moveTo(p[12] + lw * 0.42, p[13]); c.arc(p[12], p[13], lw * 0.42, 0, TAU); c.fill(); }   // both hands out of the sleeves (one fill)
    var ax = p[2] + (p[6] - p[2]) * (F.sleeve ? 0.62 : 0.5), ay = p[3] + (p[7] - p[3]) * (F.sleeve ? 0.62 : 0.5), ux = (p[6] - p[2]) * 0.16, uy = (p[7] - p[3]) * 0.16;
    c.lineCap = 'butt'; c.beginPath(); c.moveTo(ax - ux, ay - uy); c.lineTo(ax + ux, ay + uy);
    c.strokeStyle = INK; c.lineWidth = ow * 1.1; c.stroke(); c.strokeStyle = flash ? '#fff' : uni; c.lineWidth = lw * 1.15; c.stroke(); c.lineCap = 'round';
  }
  G.cartoonBody = true;
  function drawBody(c, b, uni, now, fh) {
    var i, z = b.sc, col = b.flash > 0 ? '#ffffff' : b.skin, out = INK, th = b.th || 1, hs = b.hs || 1, zt = z * th;
    fh = fh && b.ch >= 0 && b.ch < HD.n;
    for (i = 0; i < 11; i++) { P[i * 2] = b.pts[i].x; P[i * 2 + 1] = b.pts[i].y; }
    var p = P;
    c.save(); if (b.role === 'toOut' || b.role === 'toIn') c.globalAlpha = 0.55;
    c.lineCap = 'round'; c.lineJoin = 'round';
    if (G.cartoonBody) {
      if (fh && b.flash <= 0) col = SKIN[b.ch];
      drawToon(c, b, uni, p, z, col);
      var tl = Math.atan2(p[1] - p[3], p[0] - p[2]) + Math.PI / 2;
      if (fh) { c.save(); c.translate(p[0], p[1]); c.rotate(tl); c.scale(b.face * z * hs, z * hs); headSprite(c, b, b.eyes, now); c.restore(); c.restore(); return; }
      c.fillStyle = out; c.beginPath(); c.arc(p[0], p[1], 13.5 * z * hs, 0, TAU); c.fill();
      drawHead(c, b, now, p, z, hs, col, tl); return;
    }
    function back() { c.moveTo(p[2], p[3]); c.lineTo(p[10], p[11]); c.lineTo(p[12], p[13]); c.moveTo(p[4], p[5]); c.lineTo(p[18], p[19]); c.lineTo(p[20], p[21]); }
    function front() { c.moveTo(p[2], p[3]); c.lineTo(p[4], p[5]); c.lineTo(p[14], p[15]); c.lineTo(p[16], p[17]); c.moveTo(p[2], p[3]); c.lineTo(p[6], p[7]); c.lineTo(p[8], p[9]); }
    c.strokeStyle = out; c.lineWidth = 12.5 * zt; c.beginPath(); back(); c.stroke();
    c.strokeStyle = shade(col); c.lineWidth = 7.5 * zt; c.beginPath(); back(); c.stroke();
    c.strokeStyle = out; c.lineWidth = 12.5 * zt; c.beginPath(); front(); c.stroke();
    if (!fh) { c.fillStyle = out; c.beginPath(); c.arc(p[0], p[1], 13.5 * z * hs, 0, TAU); c.fill(); }
    c.strokeStyle = col; c.lineWidth = 7.5 * zt; c.beginPath(); front(); c.stroke();
    // team jersey: a thick stripe on the torso
    c.strokeStyle = out; c.lineWidth = 15 * zt; c.beginPath(); c.moveTo(p[2], p[3] + 3 * z); c.lineTo(p[4], p[5] - 4 * z); c.stroke();
    c.strokeStyle = b.flash > 0 ? '#fff' : uni; c.lineWidth = 10 * zt; c.beginPath(); c.moveTo(p[2], p[3] + 3 * z); c.lineTo(p[4], p[5] - 4 * z); c.stroke();
    var tilt = Math.atan2(p[1] - p[3], p[0] - p[2]) + Math.PI / 2;
    if (fh) {   // 2D face art: one drawImage (team = the jersey stripe, as before)
      c.save(); c.translate(p[0], p[1]); c.rotate(tilt); c.scale(b.face * z * hs, z * hs);
      headSprite(c, b, b.eyes, now);
      c.restore(); c.restore(); return;
    }
    drawHead(c, b, now, p, z, hs, col, tilt);
  }
  function drawHead(c, b, now, p, z, hs, col, tilt) {   // the old drawn head (portraits / story / fallback); closes drawBody's save
    var i;
    c.fillStyle = col; c.beginPath(); c.arc(p[0], p[1], (13.5 * hs - 2.5) * z, 0, TAU); c.fill();
    c.save(); c.translate(p[0], p[1]); c.rotate(tilt); c.scale(b.face * z * hs, z * hs);
    c.fillStyle = INK; c.strokeStyle = INK; c.lineWidth = 2.2;
    var e = b.eyes;
    if (b.catchT > 0 && !e) e = 4;
    if (e === 2) { c.beginPath(); for (i = 0; i < 2; i++) { var ex = 1 + i * 7; c.moveTo(ex - 2.4, -3.4); c.lineTo(ex + 2.4, 1.4); c.moveTo(ex + 2.4, -3.4); c.lineTo(ex - 2.4, 1.4); } c.stroke(); c.beginPath(); c.arc(5, 6, 2.2, 0, TAU); c.stroke(); }
    else if (e === 1) { c.beginPath(); c.moveTo(-1, -3.5); c.lineTo(3, -1); c.lineTo(-1, 1.5); c.moveTo(10, -3.5); c.lineTo(6, -1); c.lineTo(10, 1.5); c.stroke(); c.beginPath(); c.ellipse(5, 6, 2.5, 3, 0, 0, TAU); c.fill(); }
    else if (b.cheer) { c.beginPath(); c.arc(1.5, -0.5, 2.6, Math.PI, TAU); c.moveTo(11.1, -0.5); c.arc(8.5, -0.5, 2.6, Math.PI, TAU); c.stroke(); c.beginPath(); c.arc(5, 3, 4, 0.1, Math.PI - 0.1); c.fill(); }
    else { c.beginPath(); c.arc(2, -1.5, 2.1, 0, TAU); c.arc(8.6, -1.5, 2.1, 0, TAU); c.fill(); if (e === 4 || b.charging) { c.beginPath(); c.moveTo(-1.5, -6.5); c.lineTo(4.5, -4.2); c.moveTo(11.5, -6.5); c.lineTo(6, -4.2); c.stroke(); } if (b.sad) { c.beginPath(); c.arc(5, 7, 2.5, Math.PI + 0.3, TAU - 0.3); c.stroke(); } }
    var C = G.CHARS[b.ch]; if (C && C.story && b.hat !== C.hat) drawHat(c, C.hat, now);
    drawHat(c, b.hat, now);
    c.restore(); c.restore();
  }

  /* ---------- background (cached) ---------- */
  var bg = null, bgK = 0;
  /* ---------- crowd = a pre-baked pixel video ----------
     The crowd is baked ONCE into a tiny strip (1 crowd pixel = CP world units, 320x58 px per frame): 6 idle frames + 4 cheer frames.
     Every frame the game draws one frame of it scaled up with smoothing off (one drawImage, chunky pixels on purpose). */
  var FCOL = ['#ff5a4f', '#3fa9ff', '#8ee53f', '#ffd23f', '#ff8fd0', '#a77bff', '#ff9d5c', '#4cd9c0'];
  var CP = 4, CY0 = 76, CFW = Math.ceil(W / CP), CFH = 58, C_IDLE = 6, C_CHEER = 4, crowdAtlas = null, crowdT = 0, crowdLast = -1;
  function bakeCrowd() {
    var cv = document.createElement('canvas'); cv.width = CFW; cv.height = CFH * (C_IDLE + C_CHEER);
    var g = cv.getContext('2d'), seed = 11;
    function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
    function px(x, y, w, h, col) { g.fillStyle = col; g.fillRect(x, y, w, h); }
    function disc(cx, cy, d, col) {   // crisp pixel disc, d px wide, centred on (cx, cy)
      g.fillStyle = col; var R = d / 2;
      for (var j = 0; j < d; j++) { var yy = j + 0.5 - R, hw = Math.sqrt(Math.max(0, R * R - yy * yy)); var x0 = Math.round(cx - hw), x1 = Math.round(cx + hw); if (x1 > x0) g.fillRect(x0, Math.round(cy - R) + j, x1 - x0, 1); }
    }
    function dark(h) { var n = parseInt(h.slice(1), 16), f = 0.62; return 'rgb(' + (((n >> 16) * f) | 0) + ',' + ((((n >> 8) & 255) * f) | 0) + ',' + (((n & 255) * f) | 0) + ')'; }
    var fans = [];
    for (var r = 0; r < 4; r++) for (var i = 0; i < 30; i++) {
      var ci = (i * 7 + r * 3) % 8;
      fans.push({ x: Math.round((20 + i * 42 + (r % 2) * 21) / CP), y: Math.round((120 + r * 52 - CY0) / CP), col: FCOL[ci], sh: dark(FCOL[ci]), ph: rnd() * Math.PI });
    }
    for (var fr = 0; fr < C_IDLE + C_CHEER; fr++) {
      var cheer = fr >= C_IDLE, oy = fr * CFH;
      g.save(); g.beginPath(); g.rect(0, oy, CFW, CFH); g.clip();
      for (var q = 0; q < fans.length; q++) {
        var f = fans[q], a = cheer ? Math.PI * (fr - C_IDLE) / C_CHEER : Math.PI * fr / C_IDLE;
        var up = Math.round(Math.abs(Math.sin(a + f.ph)) * (cheer ? 5 : 1.4)), x = f.x, y = oy + f.y - up;
        // shoulders + head (ink outline, colour, two eye pixels)
        px(x - 4, y + 4, 9, 4, INK); px(x - 3, y + 5, 7, 3, f.sh);
        disc(x + 0.5, y + 0.5, 8, INK); disc(x + 0.5, y + 0.5, 6, f.col);
        px(x - 1, y, 1, 1, INK); px(x + 2, y, 1, 1, INK);
        if (cheer) {   // arms up + open mouth
          var lift = up > 2 ? 1 : 0;
          px(x - 5, y + 2, 1, 2, INK); px(x - 6, y - lift, 1, 2, INK); px(x - 6, y - 2 - lift, 1, 2, INK);
          px(x + 5, y + 2, 1, 2, INK); px(x + 6, y - lift, 1, 2, INK); px(x + 6, y - 2 - lift, 1, 2, INK);
          px(x, y + 2, 2, 1, INK);
        }
      }
      g.restore();
    }
    return cv;
  }
  // the top of the gym (wall + bleachers) is one opaque canvas = bg + the current crowd frame. It is rebuilt only when the crowd frame
  // changes (6-12 times a second); every frame is then two plain 1:1 copies (top + rest of bg), same cost as the bg alone.
  var CY1 = CY0 + CFH * CP, topCv = null, topG = null, topBg = null, topFr = -1;
  function drawBgCrowd(c, hype, now, ox, oy) {
    if (!crowdAtlas) crowdAtlas = bakeCrowd();
    var dt = crowdLast < 0 ? 0 : Math.min(0.1, Math.max(0, now - crowdLast)); crowdLast = now;
    var cheer = hype > 0.4, n = cheer ? C_CHEER : C_IDLE;
    crowdT += dt * (3 + hype * 6) / Math.PI * n;   // same tempo as the old per-head bob
    var fr = (cheer ? C_IDLE : 0) + (Math.floor(crowdT) % n), top = Math.min(bg.height, Math.round(CY1 * bgK));
    if (topBg !== bg) { topBg = bg; topFr = -1; topCv = document.createElement('canvas'); topCv.width = bg.width; topCv.height = top; topG = topCv.getContext('2d', { alpha: false }); }
    if (fr !== topFr) {
      topFr = fr; topG.setTransform(1, 0, 0, 1, 0, 0); topG.drawImage(bg, 0, 0, bg.width, top, 0, 0, bg.width, top);
      topG.setTransform(bg.width / W, 0, 0, bg.height / H, 0, 0); topG.imageSmoothingEnabled = false;
      topG.drawImage(crowdAtlas, 0, fr * CFH, CFW, CFH, 0, CY0, CFW * CP, CFH * CP);
    }
    c.save(); c.setTransform(1, 0, 0, 1, ox, oy);
    c.drawImage(topCv, 0, 0);
    c.drawImage(bg, 0, top, bg.width, bg.height - top, 0, top, bg.width, bg.height - top);
    c.restore();
  }

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
  G.fitLabel = fitLabel;
  function easeOutBack(t) { t = clamp(t, 0, 1); var s = 1.9; t -= 1; return t * t * ((s + 1) * t + s) + 1; }

  /* ---------- main render ---------- */
  var ENTS = [], BALLS = [], EPOOL = [];
  function ent(i, z, b, B) { var e = EPOOL[i] || (EPOOL[i] = {}); e.z = z; e.b = b; e.B = B; return e; }
  function bySortZ(a, b2) { return a.z - b2.z; }
  G.render = function (c, M, now, V) {
    var k = V.k, SW = V.SW;
    if (!bg || bgK !== k) buildBg(k);
    c.setTransform(1, 0, 0, 1, 0, 0);
    var sx = 0, sy = 0; if (M && M.shake > 0.3 && !G.lite) { sx = (Math.random() - 0.5) * M.shake * 1.4; sy = (Math.random() - 0.5) * M.shake * 1.4; }
    var ox = Math.round((-V.camX + sx) * k), oy = Math.round(sy * k), hype = M ? M.crowd : 0, i;
    // gym background + crowd (one frame of the pre-baked pixel strip)
    drawBgCrowd(c, hype, now, ox, oy);
    c.setTransform(k, 0, 0, k, ox, oy);
    if (!M) return;
    var ents = ENTS, b, ne = 0;
    ents.length = 0;
    for (i = 0; i < M.bodies.length; i++) ents.push(ent(ne++, M.bodies[i].z, M.bodies[i], null));
    var balls = BALLS; balls.length = 0; balls.push(M.ball); for (i = 0; i < M.fakes.length; i++) balls.push(M.fakes[i]);
    for (i = 0; i < balls.length; i++) ents.push(ent(ne++, balls[i].z + 0.001, null, balls[i]));
    // shadows
    if (G.cartoonBody) {   // all body shadows in one fill (pays for part of the cartoon bodies' extra calls)
      c.fillStyle = 'rgba(0,0,0,0.22)'; c.beginPath();
      for (i = 0; i < M.bodies.length; i++) { var o = M.bodies[i], w = 24 * o.sc, sx2 = o.mode === 'rag' ? o.pts[2].x : o.x; c.moveTo(sx2 + w, FY(o.z)); c.ellipse(sx2, FY(o.z), w, w * 0.32, 0, 0, TAU); }
      c.fill();
    } else M.bodies.forEach(function (o) { var w = 24 * o.sc; c.fillStyle = 'rgba(0,0,0,0.22)'; c.beginPath(); c.ellipse(o.mode === 'rag' ? o.pts[2].x : o.x, FY(o.z), w, w * 0.32, 0, 0, TAU); c.fill(); });   // G.cartoonBody = false: the old look (A/B in 검증/body_perf.mjs)
    balls.forEach(function (B) { if (B.sp === 'ghost' && B.st === 'fly') return; var s = clamp(1 - B.h / 400, 0.3, 1), rs = B.r * G.scz(clamp(B.z, 0, 1)); c.fillStyle = 'rgba(0,0,0,' + 0.25 * s + ')'; c.beginPath(); c.ellipse(B.x, FY(clamp(B.z, 0, 1)), rs * s * 1.1, rs * s * 0.38, 0, 0, TAU); c.fill(); });
    // aim marker (my holder)
    var me = M.ctrl >= 0 ? M.bodies[M.ctrl] : null;
    if (me && me.hold && M.state === 'play') { var tg = G.pickTarget(M, me); if (tg) { c.strokeStyle = '#ff3b3b'; c.lineWidth = 4; c.beginPath(); c.ellipse(tg.x, FY(tg.z), 30 * tg.sc, 10 * tg.sc, 0, 0, TAU); c.stroke(); } }
    ents.sort(bySortZ);
    var fh = useFaces(M);
    for (i = 0; i < ents.length; i++) {
      var e = ents[i];
      if (e.b) { var td = e.b.team ? M.team : M.myTm || G.MYTEAM; drawBody(c, e.b, td.uni, now, fh); }
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

  // team panels change a few times per rally (outs, meter, labels) but cost ~10% of a frame (outlined text, 14 small faces):
  // each is baked into its own canvas and re-baked only when what it shows changes (1 drawImage per frame otherwise)
  var PNL = [{}, {}];
  function teamPanel(c, M, t, x, w, alignR, now, k) {
    if (!G.cartoonBody) { drawPanel(c, M, t, x, w, alignR, now); return; }   // A/B: the pre-change renderer
    var P = PNL[t], n = M.bodies.length / 2, m = M.meter[t], full = m >= 1, mask = '', fh = M.fh === 1 && G.faceHeads, i;
    for (i = 0; i < n; i++) mask += G.alive(M.bodies[t * n + i]) ? 1 : 0;
    var key = [w, k, alignR, fh, mask, Math.round(m * w), full ? ((now * 8) | 0) % 2 : -1, M.nextSp[t], G.lang, M.myTm ? 1 : 0, M.versus ? 1 : 0, document.fonts ? document.fonts.status : ''].join('|');
    if (P.M !== M || P.key !== key) {
      P.M = M; P.key = key;
      var cw = Math.ceil((w + 8) * k), ch = Math.ceil(110 * k);
      if (!P.cv) P.cv = document.createElement('canvas');
      if (P.cv.width !== cw || P.cv.height !== ch) { P.cv.width = cw; P.cv.height = ch; } else P.cv.getContext('2d').clearRect(0, 0, cw, ch);
      var g = P.cv.getContext('2d'); g.setTransform(k, 0, 0, k, 4 * k, 0); drawPanel(g, M, t, 0, w, alignR, now);
    }
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.drawImage(P.cv, Math.round((x - 4) * k), 0); c.restore();
  }
  function drawPanel(c, M, t, x, w, alignR, now) {
    var td = t ? M.team : M.myTm || G.MYTEAM, nm = t || M.myTm ? G.t(td.key) : G.t(M.versus ? 'pHost' : 'my');
    c.fillStyle = 'rgba(27,27,47,0.88)'; rr(c, x, 10, w, 92, 16); c.fill();
    var l = alignR ? x + w - 14 : x + 14;
    fitLabel(c, nm, l, 30, 20, t ? '#ff9d5c' : '#6ecbff', alignR ? 'right' : 'left', w - 36 - Math.min(30, (w * 0.62) / (M.bodies.length / 2)) * M.bodies.length / 2);
    // heads: alive / out
    var n = M.bodies.length / 2, hs = Math.min(30, (w * 0.62) / n), hr = Math.min(12, hs * 0.42), fh = M.fh === 1 && G.faceHeads;
    for (var i = 0; i < n; i++) {
      var b = M.bodies[t * n + i], hx = alignR ? x + 12 + hr + i * hs : x + w - 12 - hr - i * hs, al = G.alive(b);
      c.fillStyle = INK; c.beginPath(); c.arc(hx, 30, hr, 0, TAU); c.fill(); c.fillStyle = al ? (fh ? '#3a3c5a' : b.skin) : '#4a4e69'; c.beginPath(); c.arc(hx, 30, hr * 0.75, 0, TAU); c.fill();
      if (fh && b.ch >= 0 && b.ch < HD.n) { var fr = hr * 0.9, cs = HD.cell; if (!al) c.globalAlpha = 0.4; c.drawImage(HD.img, (b.ch % 6) * cs, ((b.ch / 6) | 0) * cs, cs, cs, hx - 1.6 * fr, 30 - 2.1 * fr, 3.2 * fr, 3.2 * fr); c.globalAlpha = 1; }
      if (!al) { var q = hr * 0.5; c.strokeStyle = '#ff5a4f'; c.lineWidth = 3; c.beginPath(); c.moveTo(hx - q, 30 - q); c.lineTo(hx + q, 30 + q); c.moveTo(hx + q, 30 - q); c.lineTo(hx - q, 30 + q); c.stroke(); }
    }
    // special meter
    var m = M.meter[t], bx = x + 14, bw = w - 28, full = m >= 1;
    c.fillStyle = INK; rr(c, bx - 2, 50, bw + 4, 18, 9); c.fill(); c.fillStyle = '#3a3c5a'; rr(c, bx, 52, bw, 14, 7); c.fill();
    if (m > 0) { c.fillStyle = full ? (((now * 8) | 0) % 2 ? '#ffd23f' : '#ff5a4f') : '#ffd23f'; var fw = Math.max(14, bw * m); rr(c, alignR ? bx + bw - fw : bx, 52, fw, 14, 7); c.fill(); }
    var sp = G.t('sp_' + M.nextSp[t]), lab = full ? G.t('spReady') + '  ' + sp : G.t('nextSp') + ': ' + sp;
    fitLabel(c, lab, alignR ? x + w - 14 : x + 14, 85, 14, full ? '#ffd23f' : '#c9cbe0', alignR ? 'right' : 'left', w - 24);
  }
  // SPECIAL hint glow: shadowBlur once, cached
  var GPAD = 40, glowC = null, glowK = '';
  function glow(tw, k) {
    var key = Math.round(tw) + '|' + k; if (glowC && glowK === key) return glowC;
    glowK = key; glowC = document.createElement('canvas'); glowC.width = Math.ceil((tw + 2 * GPAD) * k); glowC.height = Math.ceil((44 + 2 * GPAD) * k);
    var g = glowC.getContext('2d'), off = 10000; g.setTransform(k, 0, 0, k, 0, 0);
    g.shadowColor = '#ffd23f'; g.shadowBlur = 22; g.shadowOffsetX = off * k; g.fillStyle = '#000'; rr(g, GPAD - off, GPAD, tw, 44, 22); g.fill();
    return glowC;
  }
  var V = {};
  function hud(c, M, now, view) {
    V = view; var SW = view.SW, pw = Math.min(330, SW * 0.37);
    teamPanel(c, M, 0, 10, pw, false, now, view.k); teamPanel(c, M, 1, SW - 10 - pw, pw, true, now, view.k);
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
      var gl = glow(tw, view.k); c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 0.45 + 0.55 * pu; c.drawImage(gl, Math.round(((SW - tw) / 2 - GPAD) * view.k), Math.round((py - 22 - GPAD) * view.k)); c.restore();
      c.fillStyle = 'rgba(255,90,79,' + (0.85 + 0.15 * pu) + ')'; rr(c, (SW - tw) / 2, py - 22, tw, 44, 22); c.fill();
      c.strokeStyle = '#ffd23f'; c.lineWidth = 3; rr(c, (SW - tw) / 2, py - 22, tw, 44, 22); c.stroke();
      fitLabel(c, txt, SW / 2, py, 26, '#fff', 'center', tw - 24, true);
    }
    if (M.guide || M.waitInput) guideHud(c, M, now, view);
    // first-match hint
    if (M.hint && !M.guide && view.touch && M.round === 1 && M.time > G.ROUND_T - 9 && M.state !== 'intro') {
      var ht = view.touch ? G.t('hintT') : G.t('hintK'); c.font = '700 15px ' + G.FONT; var hw = Math.min(SW - 30, c.measureText(ht).width + 30);
      c.fillStyle = 'rgba(16,12,40,0.82)'; rr(c, (SW - hw) / 2, H - 50, hw, 36, 12); c.fill(); fitLabel(c, ht, SW / 2, H - 32, 15, '#fff', 'center', hw - 20);
    }
  }
  // guided first match: one short line in context, big and readable; what to press depends on keyboard / touch
  G.guideTip = function (M, touch) {
    if (M.waitInput) return touch ? 'gTapStart' : 'gKeyStart';
    if (M.state !== 'play' || M.ctrl < 0) return null;
    var me = M.bodies[M.ctrl], g = M.guide;
    if (M.guideSlow) return touch ? 'gCatchT' : 'gCatchK';
    if (me.hold && M.meter[0] >= 1 && g.thr < 6) return touch ? 'gSpT' : 'gSpK';
    if (me.hold && g.thr < 3) return me.charging ? 'gRelease' : touch ? 'gThrowT' : 'gThrowK';
    if (me.hold && !me.charging && g.thr >= 2 && g.thr < 6 && !g.pass && M.bodies.some(function (o) { return o.team === 0 && o !== me && o.role === 'in' && !o.pendingOut; })) return touch ? 'gPassT' : 'gPassK';
    if (!me.hold && M.ball.st === 'loose' && g.thr < 3 && M.chaser[0] === null && Math.abs(M.ball.x - me.x) < 500) return touch ? 'gGetT' : 'gGetK';
    return null;
  };
  function guideHud(c, M, now, view) {
    var SW = view.SW, key = G.guideTip(M, view.touch);
    if (M.waitInput) {
      c.fillStyle = 'rgba(13,11,30,0.45)'; c.fillRect(0, 0, SW, H);
      var pu = 1 + 0.06 * Math.sin(now * 6);
      c.save(); c.translate(SW / 2, H * 0.4); c.scale(pu, pu); fitLabel(c, G.t(key), 0, 0, 64, '#ffd23f', 'center', SW * 0.9, true); c.restore();
      fitLabel(c, G.t(view.touch ? 'gHowT' : 'gHowK'), SW / 2, H * 0.4 + 70, 26, '#fff', 'center', SW * 0.92);
      return;
    }
    if (!key) return;
    var txt = G.t(key), urgent = key === 'gCatchT' || key === 'gCatchK', fs = urgent ? 40 : 30, y = urgent ? H * 0.27 : H - 62;
    c.font = 'italic 900 ' + fs + 'px ' + G.FONT; var tw = Math.min(SW - 24, c.measureText(txt).width + 50);
    var pu2 = 0.5 + 0.5 * Math.sin(now * 10);
    c.fillStyle = urgent ? 'rgba(46,160,90,' + (0.85 + 0.15 * pu2) + ')' : 'rgba(16,12,40,0.86)'; rr(c, (SW - tw) / 2, y - fs * 0.85, tw, fs * 1.7, 18); c.fill();
    c.strokeStyle = '#ffd23f'; c.lineWidth = 3; rr(c, (SW - tw) / 2, y - fs * 0.85, tw, fs * 1.7, 18); c.stroke();
    fitLabel(c, txt, SW / 2, y, fs, '#fff', 'center', tw - 28, true);
  }
  G.drawBody = drawBody;
  // a character portrait into a 2d context: feet at (x, y), height px tall; team decides the jersey colour
  G.drawChar = function (c, ch, x, y, hpx, now, uni, cheer, flip, hat) {
    var b = G.posed(ch, 0, now, cheer), s = hpx / 135; if (hat) b.hat = hat;
    c.save(); c.translate(x, y); c.scale(flip ? -s : s, s); drawBody(c, b, uni || '#2a7fd4', now); c.restore();
  };
})();
