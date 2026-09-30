// game.js — 충치 대작전: 화면·손·소리·저장. 규칙은 logic.js.
(function () {
  'use strict';
  const { W, UPGRADES, Game, layout } = window.ChungLogic;
  const S = window.Sound;
  const cv = document.getElementById('cv');
  const c = cv.getContext('2d');
  const FONT = "'Apple SD Gothic Neo','Noto Sans KR','Malgun Gothic',system-ui,-apple-system,sans-serif";
  const TAU = Math.PI * 2;

  // ---------------- 글 ----------------
  const T = {
    ko: {
      title: '충치 대작전', sub: '칫솔을 피해서 이빨을 냠냠!',
      st1: '1단계', st2: '2단계', stn1: '칫솔이 온다!', stn2: '치실도 온다!',
      locked: '1단계를 깨면 열려요', best: '최고 기록', play: '시작',
      tipDrag: '화면 아무 데나 끌어서 움직여요', tipEat: '이빨에 붙어 있으면 냠냠 먹어요',
      tipBrush: '노란 줄이 반짝이면 칫솔이 와요. 피해요!', tipSugar: '사탕을 모아 아래 단추로 더 세져요',
      tipFloss: '초록 점선에는 치실이 내려와요!', tipSpread: '다 먹은 이빨은 옆으로 번져요',
      tapStart: '눌러서 시작!',
      up_eat: '냠냠', up_spread: '번짐', up_sticky: '끈적', up_speed: '날쌘',
      paused: '잠깐 쉬어요', resume: '계속하기', home: '처음으로', retry: '다시 하기', next: '다음 단계',
      winTitle: '이빨을 다 먹었다!', winAll: '모든 단계를 깼어요!',
      loseTitle: '뽀득뽀득! 다 닦였다', loseSub: '이번엔 칫솔이 이겼어요',
      time: '걸린 시간', record: '새 기록!',
      moralHead: '게임은 게임!', moral: '진짜 이는 하루 세 번, 3분씩 닦아요',
      moralLose: '진짜 입 속에서도 칫솔이 이겨야 해요',
      soon: '다음엔 가글이 와요... 기대해요!',
      sound: '소리', on: '켬', off: '끔', lang: 'English',
      hint: '끌어서 움직이기',
    },
    en: {
      title: 'Cavity Quest', sub: 'Dodge the brush, munch the teeth!',
      st1: 'Stage 1', st2: 'Stage 2', stn1: 'Here comes the brush!', stn2: 'Floss joins in!',
      locked: 'Clear Stage 1 to unlock', best: 'Best', play: 'Play',
      tipDrag: 'Drag anywhere on the screen to move', tipEat: 'Stay on a tooth to munch it',
      tipBrush: 'Yellow stripe = brush coming. Dodge!', tipSugar: 'Grab candy, buy power-ups below',
      tipFloss: 'Green dotted line = floss drops down!', tipSpread: 'Rotten teeth spread to neighbors',
      tapStart: 'Tap to start!',
      up_eat: 'Munch', up_spread: 'Spread', up_sticky: 'Sticky', up_speed: 'Zoom',
      paused: 'Paused', resume: 'Resume', home: 'Home', retry: 'Retry', next: 'Next stage',
      winTitle: 'All teeth munched!', winAll: 'You cleared every stage!',
      loseTitle: 'Squeaky clean!', loseSub: 'The toothbrush won this time',
      time: 'Time', record: 'New best!',
      moralHead: 'A game is just a game!', moral: 'For real teeth: brush 3 times a day, 3 minutes',
      moralLose: 'In your real mouth, the brush should always win',
      soon: 'Next time: mouthwash is coming...',
      sound: 'Sound', on: 'On', off: 'Off', lang: '한국어',
      hint: 'Drag to move',
    },
  };

  // ---------------- 저장 ----------------
  const KEY = 'chungchi.v1';
  let save = { lang: null, sound: true, music: true, unlocked: 1, best: {} };
  try { const s = JSON.parse(localStorage.getItem(KEY) || 'null'); if (s) save = Object.assign(save, s); } catch (e) { }
  const qs = new URLSearchParams(location.search);
  if (!save.lang) save.lang = (qs.get('lang') || navigator.language || 'ko').toLowerCase().startsWith('ko') ? 'ko' : 'en';
  if (qs.get('lang')) save.lang = qs.get('lang') === 'en' ? 'en' : 'ko';
  function persist() { try { localStorage.setItem(KEY, JSON.stringify(save)); } catch (e) { } }
  const t = k => (T[save.lang] && T[save.lang][k]) || T.ko[k] || k;
  S.on = save.sound; S.music = save.sound;
  document.documentElement.lang = save.lang;

  // ---------------- 화면 크기 ----------------
  const app = { H: 760, scale: 1, dpr: 1, screen: 'title', game: null, time: 0, shake: 0, flash: 0,
    parts: [], btns: [], press: null, drag: null, acc: { x: 0, y: 0 }, keys: {}, endTimer: 0, stageSel: 1,
    newRecord: false, hintT: 0, cardShake: {}, cardFlash: {}, toothShake: new Array(16).fill(0), sndGate: {} };
  window.__cc = app; // 시험용

  function resize() {
    const iw = window.innerWidth, ih = window.innerHeight;
    let H = app.game && app.screen !== 'title' ? app.game.L.H : Math.round(Math.max(640, Math.min(860, ih / iw * W)));
    app.H = H;
    const s = Math.min(iw / W, ih / H);
    app.scale = s; app.dpr = Math.min(window.devicePixelRatio || 1, 3);
    cv.style.width = Math.round(W * s) + 'px'; cv.style.height = Math.round(H * s) + 'px';
    cv.width = Math.round(W * s * app.dpr); cv.height = Math.round(H * s * app.dpr);
    app.bgL = layout(H);
  }
  window.addEventListener('resize', resize);
  resize();

  // ---------------- 그리기 도구 ----------------
  function rr(x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
  }
  function txt(s, x, y, size, color, align, weight, stroke, sw) {
    c.font = (weight || 800) + ' ' + size + 'px ' + FONT;
    c.textAlign = align || 'center'; c.textBaseline = 'middle';
    if (stroke) { c.lineJoin = 'round'; c.lineWidth = sw || 6; c.strokeStyle = stroke; c.strokeText(s, x, y); }
    c.fillStyle = color; c.fillText(s, x, y);
  }
  function wrap(s, maxW, size, weight) {
    c.font = (weight || 700) + ' ' + size + 'px ' + FONT;
    const words = s.split(' '), lines = []; let cur = '';
    for (const w of words) {
      const test = cur ? cur + ' ' + w : w;
      if (c.measureText(test).width > maxW && cur) { lines.push(cur); cur = w; } else cur = test;
    }
    if (cur) lines.push(cur);
    return lines;
  }
  function heart(x, y, s, fill, stroke) {
    c.save(); c.translate(x, y); c.scale(s / 20, s / 20);
    c.beginPath(); c.moveTo(0, 7);
    c.bezierCurveTo(-12, -2, -10, -13, -4.5, -11); c.bezierCurveTo(-1.5, -10, 0, -7, 0, -6);
    c.bezierCurveTo(0, -7, 1.5, -10, 4.5, -11); c.bezierCurveTo(10, -13, 12, -2, 0, 7); c.closePath();
    c.fillStyle = fill; c.fill();
    if (stroke) { c.lineWidth = 2.2; c.strokeStyle = stroke; c.stroke(); }
    c.beginPath(); c.ellipse(-4.5, -6.5, 2.2, 1.4, -0.6, 0, TAU); c.fillStyle = 'rgba(255,255,255,.7)'; c.fill();
    c.restore();
  }
  function candyIcon(x, y, s, rot) {
    c.save(); c.translate(x, y); c.rotate(rot || 0); c.scale(s / 20, s / 20);
    c.fillStyle = '#ff5c8a';
    c.beginPath(); c.moveTo(-8, 0); c.lineTo(-16, -7); c.lineTo(-15, 7); c.closePath(); c.fill();
    c.beginPath(); c.moveTo(8, 0); c.lineTo(16, -7); c.lineTo(15, 7); c.closePath(); c.fill();
    c.beginPath(); c.arc(0, 0, 9, 0, TAU); c.fillStyle = '#fff'; c.fill();
    c.save(); c.clip();
    c.strokeStyle = '#ff5c8a'; c.lineWidth = 3.4;
    for (let i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(i * 7 - 10, -10); c.lineTo(i * 7 + 10, 10); c.stroke(); }
    c.restore();
    c.beginPath(); c.arc(0, 0, 9, 0, TAU); c.lineWidth = 1.6; c.strokeStyle = '#d63e6c'; c.stroke();
    c.beginPath(); c.arc(-3, -3.5, 2.2, 0, TAU); c.fillStyle = 'rgba(255,255,255,.9)'; c.fill();
    c.restore();
  }

  // ---------------- 충치콩 (주인공) ----------------
  function drawGerm(x, y, r, o) {
    o = o || {};
    const tm = app.time;
    c.save(); c.translate(x, y);
    const sq = o.squash || 0;
    c.scale(1 + sq, 1 - sq);
    if (o.alpha != null) c.globalAlpha = o.alpha;
    // 그림자
    c.beginPath(); c.ellipse(0, r * 0.95, r * 0.8, r * 0.22, 0, 0, TAU); c.fillStyle = 'rgba(40,0,30,.22)'; c.fill();
    // 몸 (말랑한 테두리)
    c.beginPath();
    const N = 48;
    for (let i = 0; i <= N; i++) {
      const a = i / N * TAU;
      const rr2 = r * (1 + 0.075 * Math.sin(a * 7 + tm * 4) + 0.03 * Math.sin(a * 3 - tm * 2.3));
      const px = Math.cos(a) * rr2, py = Math.sin(a) * rr2 * 0.94;
      i ? c.lineTo(px, py) : c.moveTo(px, py);
    }
    c.closePath();
    const g = c.createRadialGradient(-r * 0.35, -r * 0.4, r * 0.1, 0, 0, r * 1.15);
    g.addColorStop(0, o.hurt ? '#ffd0e8' : '#d7b4ff'); g.addColorStop(0.55, o.hurt ? '#ff9ccf' : '#a46cff'); g.addColorStop(1, o.hurt ? '#e06aa8' : '#7440e0');
    c.fillStyle = g; c.fill();
    c.lineWidth = 2.4; c.strokeStyle = o.hurt ? '#b8407e' : '#5a2bb8'; c.stroke();
    // 뿔 두 개 (동글)
    for (const s of [-1, 1]) {
      c.beginPath(); c.arc(s * r * 0.55, -r * 0.88, r * 0.2, 0, TAU);
      c.fillStyle = o.hurt ? '#ff9ccf' : '#b98bff'; c.fill(); c.lineWidth = 2; c.strokeStyle = o.hurt ? '#b8407e' : '#5a2bb8'; c.stroke();
    }
    // 반짝
    c.beginPath(); c.ellipse(-r * 0.42, -r * 0.45, r * 0.22, r * 0.13, -0.6, 0, TAU); c.fillStyle = 'rgba(255,255,255,.55)'; c.fill();
    // 볼
    c.fillStyle = 'rgba(255,120,170,.55)';
    c.beginPath(); c.ellipse(-r * 0.58, r * 0.2, r * 0.17, r * 0.11, 0, 0, TAU); c.fill();
    c.beginPath(); c.ellipse(r * 0.58, r * 0.2, r * 0.17, r * 0.11, 0, 0, TAU); c.fill();
    // 눈
    const lx = (o.lookX || 0) * r * 0.1, ly = (o.lookY || 0) * r * 0.1;
    const blink = (Math.sin(tm * 1.3 + (o.seed || 0)) > 0.985) || o.dizzy;
    for (const s of [-1, 1]) {
      const ex = s * r * 0.3, ey = -r * 0.12;
      if (o.dizzy) {
        c.strokeStyle = '#2a1245'; c.lineWidth = 2; c.beginPath();
        for (let k = 0; k < 14; k++) { const a = k * 0.6 + tm * 8, rad = k * 0.45; c.lineTo(ex + Math.cos(a) * rad, ey + Math.sin(a) * rad); }
        c.stroke(); continue;
      }
      if (blink) { c.strokeStyle = '#2a1245'; c.lineWidth = 2.4; c.beginPath(); c.arc(ex, ey, r * 0.16, 0.15 * Math.PI, 0.85 * Math.PI); c.stroke(); continue; }
      c.beginPath(); c.ellipse(ex, ey, r * 0.21, r * 0.26, 0, 0, TAU); c.fillStyle = '#fff'; c.fill();
      c.beginPath(); c.ellipse(ex + lx, ey + ly + r * 0.03, r * 0.12, r * 0.15, 0, 0, TAU); c.fillStyle = '#2a1245'; c.fill();
      c.beginPath(); c.arc(ex + lx - r * 0.04, ey + ly - r * 0.04, r * 0.05, 0, TAU); c.fillStyle = '#fff'; c.fill();
    }
    // 입
    const my = r * 0.36;
    if (o.eat) {
      const open = 0.35 + 0.65 * Math.abs(Math.sin(tm * 11));
      c.beginPath(); c.ellipse(0, my, r * 0.3, r * 0.26 * open + 1, 0, 0, TAU); c.fillStyle = '#4a0f3a'; c.fill();
      c.fillStyle = '#fff';
      c.beginPath(); c.moveTo(-r * 0.16, my - r * 0.26 * open); c.lineTo(-r * 0.08, my - r * 0.26 * open + r * 0.14); c.lineTo(0, my - r * 0.26 * open); c.fill();
      c.beginPath(); c.moveTo(r * 0.16, my - r * 0.26 * open); c.lineTo(r * 0.08, my - r * 0.26 * open + r * 0.14); c.lineTo(0, my - r * 0.26 * open); c.fill();
      c.beginPath(); c.ellipse(0, my + r * 0.12 * open, r * 0.14, r * 0.07 * open, 0, 0, TAU); c.fillStyle = '#ff7aa8'; c.fill();
    } else if (o.dizzy) {
      c.beginPath(); c.strokeStyle = '#2a1245'; c.lineWidth = 2;
      for (let k = 0; k <= 8; k++) c.lineTo(-r * 0.25 + k * r * 0.0625, my + Math.sin(k * 1.6) * 2);
      c.stroke();
    } else {
      c.beginPath(); c.arc(0, my - r * 0.08, r * 0.2, 0.15 * Math.PI, 0.85 * Math.PI); c.lineWidth = 2.4; c.strokeStyle = '#2a1245'; c.lineCap = 'round'; c.stroke();
      c.beginPath(); c.moveTo(r * 0.06, my + r * 0.1); c.lineTo(r * 0.12, my + r * 0.2); c.lineTo(r * 0.16, my + r * 0.09); c.fillStyle = '#fff'; c.fill();
    }
    c.restore();
  }

  // ---------------- 이빨 ----------------
  const SPOTS = [];
  for (let i = 0; i < 16; i++) {
    let s = (i + 1) * 9301 + 49297; const R = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
    const arr = [];
    for (let k = 0; k < 7; k++) arr.push({ u: 0.22 + R() * 0.56, v: 0.3 + R() * 0.6, s: 3.2 + R() * 4.2 });
    SPOTS.push(arr);
  }
  function toothPath(tt, dx) {
    const x = tt.x + (dx || 0), y = tt.y, w = tt.w, h = tt.h, r = Math.min(w * 0.45, 16);
    c.beginPath();
    if (tt.row === 0) {
      c.moveTo(x + 1, y); c.lineTo(x + w - 1, y);
      c.quadraticCurveTo(x + w + 1.5, y + h * 0.5, x + w, y + h - r);
      c.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      c.quadraticCurveTo(x + w / 2, y + h + 2.5, x + r, y + h);
      c.quadraticCurveTo(x, y + h, x, y + h - r);
      c.quadraticCurveTo(x - 1.5, y + h * 0.5, x + 1, y);
    } else {
      c.moveTo(x + 1, y + h); c.lineTo(x + w - 1, y + h);
      c.quadraticCurveTo(x + w + 1.5, y + h * 0.5, x + w, y + r);
      c.quadraticCurveTo(x + w, y, x + w - r, y);
      c.quadraticCurveTo(x + w / 2, y - 2.5, x + r, y);
      c.quadraticCurveTo(x, y, x, y + r);
      c.quadraticCurveTo(x - 1.5, y + h * 0.5, x + 1, y + h);
    }
    c.closePath();
  }
  function drawTooth(tt, i, eatingMe) {
    const dx = app.toothShake[i] > 0 ? Math.sin(app.time * 60) * 1.4 : 0;
    const inf = tt.inf, done = tt.done;
    toothPath(tt, dx);
    const g = c.createLinearGradient(tt.x, 0, tt.x + tt.w, 0);
    if (done) { g.addColorStop(0, '#d9c09a'); g.addColorStop(0.5, '#caa77c'); g.addColorStop(1, '#a9865d'); }
    else { g.addColorStop(0, '#ffffff'); g.addColorStop(0.55, '#f6f8fc'); g.addColorStop(1, '#dde4ef'); }
    c.fillStyle = g; c.fill();
    c.save(); c.clip();
    // 누렇게 물든다
    if (inf > 0 && !done) { c.fillStyle = 'rgba(214,170,90,' + (inf * 0.4) + ')'; c.fillRect(tt.x - 2, tt.y - 2, tt.w + 4, tt.h + 4); }
    // 점 (구멍)
    const sp = SPOTS[i], n = done ? 7 : inf * 7;
    for (let k = 0; k < sp.length; k++) {
      const f = Math.max(0, Math.min(1, n - k)); if (f <= 0) break;
      const s = sp[k], v = tt.row === 0 ? s.v : 1 - s.v;
      const px = tt.x + dx + s.u * tt.w, py = tt.y + v * tt.h, rad = s.s * (0.4 + 0.6 * f) * (done ? 1.15 : 1);
      c.beginPath(); c.arc(px, py, rad + 1.4, 0, TAU); c.fillStyle = 'rgba(120,70,40,.35)'; c.fill();
      c.beginPath(); c.arc(px, py, rad, 0, TAU); c.fillStyle = done ? '#5b3a6e' : '#6b4128'; c.fill();
      c.beginPath(); c.arc(px - rad * 0.3, py - rad * 0.3, rad * 0.35, 0, TAU); c.fillStyle = 'rgba(255,255,255,.18)'; c.fill();
    }
    // 반짝 줄
    if (!done) {
      c.fillStyle = 'rgba(255,255,255,.9)';
      rr(tt.x + dx + tt.w * 0.16, tt.row === 0 ? tt.y + 10 : tt.y + tt.h * 0.25, tt.w * 0.13, tt.h * 0.48, 4); c.fill();
    }
    c.restore();
    toothPath(tt, dx); c.lineWidth = 1.6; c.strokeStyle = done ? '#8a6640' : '#c9d2e0'; c.stroke();
    // 얼굴
    const fx = tt.x + dx + tt.w / 2, fy = tt.row === 0 ? tt.y + tt.h * 0.6 : tt.y + tt.h * 0.42;
    const es = tt.w * 0.19;
    c.lineCap = 'round'; c.strokeStyle = '#3a2a3a'; c.fillStyle = '#3a2a3a'; c.lineWidth = 2;
    if (done) {
      for (const s of [-1, 1]) {
        const ex = fx + s * es, ey = fy - 3;
        c.beginPath(); c.moveTo(ex - 3, ey - 3); c.lineTo(ex + 3, ey + 3); c.moveTo(ex + 3, ey - 3); c.lineTo(ex - 3, ey + 3); c.stroke();
      }
      c.beginPath(); for (let k = 0; k <= 6; k++) c.lineTo(fx - 6 + k * 2, fy + 6 + (k % 2 ? 1.6 : -1.6)); c.stroke();
    } else if (inf < 0.02) {
      for (const s of [-1, 1]) { c.beginPath(); c.arc(fx + s * es, fy - 2, 3, Math.PI * 1.1, Math.PI * 1.9); c.stroke(); }
      c.beginPath(); c.arc(fx, fy + 3, 4, 0.15 * Math.PI, 0.85 * Math.PI); c.stroke();
      c.fillStyle = 'rgba(255,140,170,.45)';
      c.beginPath(); c.ellipse(fx - es - 4, fy + 3, 3.5, 2.2, 0, 0, TAU); c.fill();
      c.beginPath(); c.ellipse(fx + es + 4, fy + 3, 3.5, 2.2, 0, 0, TAU); c.fill();
    } else {
      for (const s of [-1, 1]) {
        c.beginPath(); c.arc(fx + s * es, fy - 1, 2.3, 0, TAU); c.fill();
        if (inf > 0.45) { c.beginPath(); c.moveTo(fx + s * (es + 4), fy - 7); c.lineTo(fx + s * (es - 3), fy - 5); c.stroke(); }
      }
      if (inf > 0.45 || eatingMe) { c.beginPath(); c.ellipse(fx, fy + 6, 3, 3.6, 0, 0, TAU); c.fill(); }
      else { c.beginPath(); c.moveTo(fx - 4, fy + 6); c.lineTo(fx + 4, fy + 6); c.stroke(); }
      if (inf > 0.6) { // 땀
        const sx = fx + tt.w * 0.36, sy = fy - 8 + (app.time * 12 % 6);
        c.beginPath(); c.moveTo(sx, sy - 4); c.quadraticCurveTo(sx + 3.5, sy + 1, sx, sy + 3); c.quadraticCurveTo(sx - 3.5, sy + 1, sx, sy - 4);
        c.fillStyle = '#7fd3ff'; c.fill();
      }
    }
  }

  // ---------------- 입 배경 ----------------
  function drawBackdrop(L) {
    const H = L.H;
    const g = c.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#ffe6ee'); g.addColorStop(1, '#ffd2df');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    c.fillStyle = 'rgba(255,255,255,.45)';
    for (let y = 18; y < H; y += 34) for (let x = (y / 34 % 2) * 17 + 8; x < W; x += 34) { c.beginPath(); c.arc(x, y, 2.4, 0, TAU); c.fill(); }
  }
  function mouthClip(L) { rr(L.mL, L.mT, L.mR - L.mL, L.mB - L.mT, 44); }
  function drawMouth(L, teeth, eating) {
    // 입술
    c.save();
    rr(L.mL - 6, L.mT - 6, L.mR - L.mL + 12, L.mB - L.mT + 12, 50);
    c.fillStyle = '#ff6f91'; c.fill();
    mouthClip(L);
    const g = c.createRadialGradient(W / 2, (L.mT + L.mB) / 2, 40, W / 2, (L.mT + L.mB) / 2, (L.mB - L.mT) * 0.7);
    g.addColorStop(0, '#8c2c52'); g.addColorStop(1, '#561533');
    c.fillStyle = g; c.fill();
    c.clip();
    // 목구멍 (깊이감)
    const my0 = (L.mid[0] + L.mid[1]) / 2;
    const tg0 = c.createRadialGradient(W / 2, my0 - 10, 10, W / 2, my0 - 10, 120);
    tg0.addColorStop(0, 'rgba(40,5,20,.65)'); tg0.addColorStop(1, 'rgba(40,5,20,0)');
    c.fillStyle = tg0; c.beginPath(); c.ellipse(W / 2, my0 - 10, 120, 90, 0, 0, TAU); c.fill();
    // 혀
    const ty = L.mid[1] - 30;
    const tg = c.createLinearGradient(0, ty - 90, 0, ty + 80);
    tg.addColorStop(0, '#ff9ab4'); tg.addColorStop(1, '#e8577f');
    c.beginPath(); c.moveTo(W / 2 - 150, ty + 80);
    c.bezierCurveTo(W / 2 - 160, ty - 40, W / 2 - 90, ty - 95, W / 2, ty - 92);
    c.bezierCurveTo(W / 2 + 90, ty - 95, W / 2 + 160, ty - 40, W / 2 + 150, ty + 80); c.closePath();
    c.fillStyle = tg; c.fill();
    c.beginPath(); c.moveTo(W / 2, ty - 60); c.quadraticCurveTo(W / 2 + 5, ty, W / 2, ty + 70);
    c.lineWidth = 3; c.strokeStyle = 'rgba(190,50,90,.35)'; c.stroke();
    c.fillStyle = 'rgba(255,255,255,.2)';
    c.beginPath(); c.ellipse(W / 2 - 62, ty - 48, 30, 12, -0.35, 0, TAU); c.fill();
    // 잇몸
    c.fillStyle = '#ff8fa8';
    c.fillRect(L.mL, L.mT, L.mR - L.mL, L.gumTopY - L.mT - 16);
    c.fillRect(L.mL, L.gumBotY + 16, L.mR - L.mL, L.mB - L.gumBotY);
    for (const tt of teeth) {
      c.beginPath();
      if (tt.row === 0) c.ellipse(tt.cx, tt.y + 6, tt.w / 2 + 3, 14, 0, 0, TAU);
      else c.ellipse(tt.cx, tt.y + tt.h - 6, tt.w / 2 + 3, 14, 0, 0, TAU);
      c.fill();
    }
    for (let i = 0; i < 16; i++) drawTooth(teeth[i], i, eating === i);
    c.restore();
    // 입술 반짝
    c.save(); rr(L.mL - 2, L.mT - 2, L.mR - L.mL + 4, L.mB - L.mT + 4, 46);
    c.lineWidth = 3; c.strokeStyle = 'rgba(255,200,215,.9)'; c.stroke(); c.restore();
  }

  // ---------------- 칫솔·치실 ----------------
  function drawBrushWarn(h, L) {
    const a = 0.16 + 0.12 * Math.sin(app.time * 18);
    c.save(); mouthClip(L); c.clip();
    c.fillStyle = 'rgba(255,225,80,' + a + ')'; c.fillRect(0, h.y0, W, h.y1 - h.y0);
    c.setLineDash([10, 8]); c.lineDashOffset = -app.time * 40 * h.dir; c.lineWidth = 3; c.strokeStyle = 'rgba(255,236,120,.95)';
    c.beginPath(); c.moveTo(0, h.y0 + 2); c.lineTo(W, h.y0 + 2); c.moveTo(0, h.y1 - 2); c.lineTo(W, h.y1 - 2); c.stroke();
    c.setLineDash([]);
    c.restore();
    // 들어오는 쪽 표시
    const cy = (h.y0 + h.y1) / 2, sx = h.dir > 0 ? 30 : W - 30;
    const k = 1 + 0.12 * Math.sin(app.time * 20);
    c.save(); c.translate(sx, cy); c.scale(k, k);
    c.beginPath(); c.arc(0, 0, 19, 0, TAU); c.fillStyle = '#ffd84d'; c.fill(); c.lineWidth = 3; c.strokeStyle = '#fff'; c.stroke();
    txt('!', 0, 1, 24, '#b34700', 'center', 900);
    c.restore();
    c.save(); c.translate(sx + h.dir * 32, cy); c.scale(h.dir, 1);
    c.fillStyle = 'rgba(255,230,90,.9)';
    for (let i = 0; i < 2; i++) { c.beginPath(); c.moveTo(i * 12, -8); c.lineTo(i * 12 + 9, 0); c.lineTo(i * 12, 8); c.closePath(); c.fill(); }
    c.restore();
  }
  function drawBrush(h, L) {
    const cy = (h.y0 + h.y1) / 2, bh = Math.min(h.y1 - h.y0, 150);
    // 솔 뒷판이 어느 쪽인가: 윗니면 위, 아랫니면 아래
    const backTop = h.lane !== 'bot';
    c.save();
    c.translate(h.x, cy);
    // 손잡이 (뒤쪽으로 길게)
    const hd = -h.dir;
    const hy = backTop ? -bh / 2 + 8 : bh / 2 - 8;
    const hg = c.createLinearGradient(0, hy - 10, 0, hy + 10);
    hg.addColorStop(0, '#7fd8ff'); hg.addColorStop(1, '#2f9fe0');
    c.fillStyle = hg;
    c.beginPath(); rr(hd > 0 ? 40 : -440, hy - 9, 400, 18, 9); c.fill();
    c.fillStyle = '#ffd24d'; rr(hd > 0 ? 120 : -170, hy - 9, 50, 18, 6); c.fill();
    // 머리
    c.fillStyle = hg; rr(-56, hy - 11, 112, 22, 11); c.fill();
    c.fillStyle = 'rgba(255,255,255,.5)'; rr(-48, hy - 8, 70, 5, 3); c.fill();
    // 솔
    const tufts = 8, top = backTop ? hy + 10 : hy - 10, len = bh - 26;
    for (let i = 0; i < tufts; i++) {
      const x = -50 + i * (100 / (tufts - 1));
      const wig = Math.sin(app.time * 30 + i) * 2;
      const col = i % 3 === 1 ? '#8ef0d8' : '#ffffff';
      c.fillStyle = col;
      if (backTop) rr(x - 5 + wig, top, 10, len, 5); else rr(x - 5 + wig, top - len, 10, len, 5);
      c.fill();
      c.strokeStyle = 'rgba(80,160,200,.35)'; c.lineWidth = 1; c.stroke();
    }
    c.restore();
  }
  function drawFloss(h, L) {
    if (h.st === 'warn') {
      c.save(); mouthClip(L); c.clip();
      const a = 0.5 + 0.5 * Math.sin(app.time * 18);
      c.setLineDash([8, 8]); c.lineDashOffset = -app.time * 50; c.lineWidth = 4; c.strokeStyle = 'rgba(120,255,200,' + (0.4 + a * 0.5) + ')';
      c.beginPath(); c.moveTo(h.x, L.mT); c.lineTo(h.x, L.mB); c.stroke(); c.setLineDash([]);
      c.restore();
      c.save(); c.translate(h.x, L.mT + 22); const k = 1 + 0.12 * Math.sin(app.time * 20); c.scale(k, k);
      c.beginPath(); c.arc(0, 0, 17, 0, TAU); c.fillStyle = '#6fe3b8'; c.fill(); c.lineWidth = 3; c.strokeStyle = '#fff'; c.stroke();
      txt('!', 0, 1, 22, '#0b6b4c', 'center', 900); c.restore();
      return;
    }
    const tip = Math.min(h.yTip, L.mB);
    c.save();
    c.lineCap = 'round';
    c.lineWidth = 5; c.strokeStyle = 'rgba(40,140,110,.35)'; c.beginPath(); c.moveTo(h.x + 2, L.mT + 8); c.lineTo(h.x + 2, tip); c.stroke();
    c.lineWidth = 3.5; c.strokeStyle = '#7dffd2'; c.beginPath(); c.moveTo(h.x, L.mT + 8); c.lineTo(h.x, tip); c.stroke();
    c.lineWidth = 1.2; c.strokeStyle = '#fff'; c.beginPath(); c.moveTo(h.x - 1, L.mT + 8); c.lineTo(h.x - 1, tip); c.stroke();
    // 치실 손잡이
    c.fillStyle = '#35c48f'; rr(h.x - 16, L.mT + 2, 32, 14, 7); c.fill();
    c.fillStyle = 'rgba(255,255,255,.5)'; rr(h.x - 11, L.mT + 5, 14, 4, 2); c.fill();
    c.restore();
  }

  // ---------------- 입자 ----------------
  function burst(x, y, n, kind, color, sp) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * TAU, v = (sp || 80) * (0.4 + Math.random());
      app.parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - (kind === 'crumb' ? 40 : 0), life: 0, max: 0.5 + Math.random() * 0.5,
        kind, color: color || '#fff', size: kind === 'star' ? 5 + Math.random() * 4 : 2 + Math.random() * 3, rot: Math.random() * TAU });
    }
  }
  function floatText(x, y, s, color, candy) { app.parts.push({ x, y, vx: 0, vy: -38, life: 0, max: 1.0, kind: 'text', s, color, candy }); }
  function star(x, y, r) {
    c.beginPath();
    for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5 - Math.PI / 2, rad = i % 2 ? r * 0.45 : r; c.lineTo(x + Math.cos(a) * rad, y + Math.sin(a) * rad); }
    c.closePath();
  }
  function updParts(dt) {
    for (const p of app.parts) {
      p.life += dt; p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.kind === 'crumb' || p.kind === 'confetti') p.vy += 260 * dt;
      if (p.kind === 'bubble') { p.vy -= 20 * dt; p.vx *= 0.97; }
      if (p.kind === 'star' || p.kind === 'spark') { p.vx *= 0.92; p.vy *= 0.92; }
      p.rot += dt * 5;
    }
    app.parts = app.parts.filter(p => p.life < p.max);
  }
  function drawParts() {
    for (const p of app.parts) {
      const k = 1 - p.life / p.max;
      c.globalAlpha = Math.min(1, k * 1.6);
      if (p.kind === 'text') {
        const sc = p.life < 0.12 ? 0.6 + p.life / 0.12 * 0.4 : 1;
        c.save(); c.translate(p.x, p.y); c.scale(sc, sc);
        txt(p.s, p.candy ? -6 : 0, 0, 17, p.color, 'center', 900, '#fff', 5);
        if (p.candy) candyIcon(18, 0, 16);
        c.restore();
      } else if (p.kind === 'star') {
        c.save(); c.translate(p.x, p.y); c.rotate(p.rot); star(0, 0, p.size); c.fillStyle = p.color; c.fill(); c.restore();
      } else if (p.kind === 'bubble') {
        c.beginPath(); c.arc(p.x, p.y, p.size * 1.6, 0, TAU); c.fillStyle = 'rgba(255,255,255,.55)'; c.fill();
        c.lineWidth = 1; c.strokeStyle = 'rgba(160,220,255,.9)'; c.stroke();
      } else if (p.kind === 'confetti') {
        c.save(); c.translate(p.x, p.y); c.rotate(p.rot); c.fillStyle = p.color; c.fillRect(-p.size, -p.size * 0.6, p.size * 2, p.size * 1.2); c.restore();
      } else {
        c.beginPath(); c.arc(p.x, p.y, p.size, 0, TAU); c.fillStyle = p.color; c.fill();
      }
    }
    c.globalAlpha = 1;
  }

  // ---------------- 단추 ----------------
  function button(id, x, y, w, h, label, style, action, extra) {
    app.btns.push({ id, x, y, w, h, action });
    const pressed = app.press && app.press.id === id;
    const sc = pressed ? 0.95 : 1;
    c.save(); c.translate(x + w / 2, y + h / 2); c.scale(sc, sc);
    const st = style || {};
    const col = st.bg || '#8a5cf6', dark = st.dark || '#5b34c9', fg = st.fg || '#fff';
    rr(-w / 2, -h / 2 + 4, w, h, h / 2.2); c.fillStyle = dark; c.fill();
    rr(-w / 2, -h / 2, w, h, h / 2.2); c.fillStyle = col; c.fill();
    c.save(); rr(-w / 2, -h / 2, w, h, h / 2.2); c.clip(); c.fillStyle = 'rgba(255,255,255,.18)'; c.fillRect(-w / 2, -h / 2, w, h * 0.45); c.restore();
    txt(label, 0, extra ? -7 : 1, st.size || 20, fg, 'center', 900);
    if (extra) txt(extra, 0, 14, 12, st.fg2 || 'rgba(255,255,255,.85)', 'center', 700);
    c.restore();
  }

  // ---------------- 업그레이드 아이콘 ----------------
  function upIcon(k, x, y, s) {
    c.save(); c.translate(x, y); c.scale(s / 24, s / 24); c.lineCap = 'round'; c.lineJoin = 'round';
    if (k === 'eat') {
      c.beginPath(); c.arc(0, 0, 11, 0.25 * Math.PI, 1.75 * Math.PI); c.lineTo(0, 0); c.closePath(); c.fillStyle = '#a46cff'; c.fill();
      c.fillStyle = '#fff'; c.beginPath(); c.moveTo(5, -5); c.lineTo(8, -1); c.lineTo(10, -5); c.fill();
      c.beginPath(); c.arc(-2, -5, 1.8, 0, TAU); c.fillStyle = '#2a1245'; c.fill();
    } else if (k === 'spread') {
      c.strokeStyle = '#a46cff'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(-7, 5); c.lineTo(0, -6); c.lineTo(7, 5); c.lineTo(-7, 5); c.stroke();
      for (const [a, b] of [[-7, 5], [0, -6], [7, 5]]) { c.beginPath(); c.arc(a, b, 4.5, 0, TAU); c.fillStyle = '#b98bff'; c.fill(); c.lineWidth = 1.6; c.strokeStyle = '#5a2bb8'; c.stroke(); }
    } else if (k === 'sticky') {
      c.beginPath(); c.moveTo(0, -11); c.bezierCurveTo(8, -2, 9, 3, 9, 5); c.arc(0, 5, 9, 0, Math.PI); c.bezierCurveTo(-9, 3, -8, -2, 0, -11);
      c.fillStyle = '#7ee08a'; c.fill(); c.lineWidth = 1.8; c.strokeStyle = '#2f9a45'; c.stroke();
      c.beginPath(); c.ellipse(-3, 3, 2, 3.5, -0.3, 0, TAU); c.fillStyle = 'rgba(255,255,255,.7)'; c.fill();
    } else {
      c.beginPath(); c.moveTo(3, -12); c.lineTo(-7, 2); c.lineTo(0, 2); c.lineTo(-3, 12); c.lineTo(8, -3); c.lineTo(1, -3); c.closePath();
      c.fillStyle = '#ffcf3f'; c.fill(); c.lineWidth = 1.6; c.strokeStyle = '#d18a00'; c.stroke();
    }
    c.restore();
  }

  // ---------------- 게임 화면 ----------------
  function drawHUD(g, L) {
    // 하트
    for (let i = 0; i < g.maxHearts; i++) {
      const on = i < g.hearts;
      const bob = on ? Math.sin(app.time * 3 + i) * 1.2 : 0;
      heart(28 + i * 30, 34 + bob, 26, on ? '#ff4d7a' : 'rgba(255,255,255,.7)', on ? '#c2185b' : '#f2a5bb');
    }
    // 진행
    const n = g.doneCount();
    const bx = 120, bw = 150, by = 26;
    rr(bx, by, bw, 18, 9); c.fillStyle = 'rgba(255,255,255,.85)'; c.fill();
    const f = n / 16;
    if (f > 0) { rr(bx + 2, by + 2, Math.max(14, (bw - 4) * f), 14, 7); const pg = c.createLinearGradient(bx, 0, bx + bw, 0); pg.addColorStop(0, '#b98bff'); pg.addColorStop(1, '#7440e0'); c.fillStyle = pg; c.fill(); }
    txt(n + ' / 16', bx + bw / 2, by + 9.5, 12, n / 16 > 0.45 ? '#fff' : '#6a3fd0', 'center', 900);
    // 작은 이빨 그림
    c.save(); c.translate(bx - 2, by + 9);
    c.beginPath(); c.moveTo(-9, -8); c.quadraticCurveTo(-4, -11, 0, -8); c.quadraticCurveTo(4, -11, 9, -8); c.quadraticCurveTo(10, 0, 6, 9); c.lineTo(3, 3); c.lineTo(-3, 3); c.lineTo(-6, 9); c.quadraticCurveTo(-10, 0, -9, -8); c.closePath();
    c.fillStyle = '#fff'; c.fill(); c.lineWidth = 1.8; c.strokeStyle = '#b48be0'; c.stroke(); c.restore();
    txt(fmtTime(g.t), bx + bw / 2, by + 30, 11, '#b0587a', 'center', 800);
    // 설탕
    candyIcon(300, 35, 22, Math.sin(app.time * 2) * 0.15);
    txt(String(g.sugar), 318, 36, 20, '#d63e6c', 'left', 900, '#fff', 5);
    // 멈춤
    const px = W - 34, py = 34;
    app.btns.push({ id: 'pause', x: px - 22, y: py - 22, w: 44, h: 44, action: () => { app.screen = 'pause'; S.play('tap'); } });
    c.beginPath(); c.arc(px, py + 2, 17, 0, TAU); c.fillStyle = '#e8a6bd'; c.fill();
    c.beginPath(); c.arc(px, py, 17, 0, TAU); c.fillStyle = '#fff'; c.fill();
    c.fillStyle = '#d6507e'; rr(px - 6, py - 7, 4.5, 14, 2); c.fill(); rr(px + 1.5, py - 7, 4.5, 14, 2); c.fill();
  }
  function fmtTime(s) { s = Math.floor(s); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); }

  function drawUpgrades(g, L) {
    const y = L.barY + 6, h = 86, gap = 8, w = (W - 24 - gap * 3) / 4;
    for (let i = 0; i < 4; i++) {
      const u = UPGRADES[i], x = 12 + i * (w + gap);
      const cost = g.upCost(u.k), lv = g.up[u.k];
      const can = cost != null && g.sugar >= cost;
      const pressed = app.press && app.press.id === 'up' + i;
      const shk = (app.cardShake[u.k] || 0) > 0 ? Math.sin(app.time * 70) * 3 : 0;
      c.save(); c.translate(x + w / 2 + shk, y + h / 2); if (pressed) c.scale(0.95, 0.95);
      const glow = can ? 0.5 + 0.5 * Math.sin(app.time * 5) : 0;
      if (can) { rr(-w / 2 - 3, -h / 2 - 3, w + 6, h + 6, 18); c.fillStyle = 'rgba(255,215,90,' + (0.45 + glow * 0.45) + ')'; c.fill(); }
      rr(-w / 2, -h / 2 + 4, w, h, 16); c.fillStyle = can ? '#e9b9cc' : '#e7c9d4'; c.fill();
      rr(-w / 2, -h / 2, w, h, 16); c.fillStyle = cost == null ? '#f3eafd' : (can ? '#ffffff' : '#fbf1f5'); c.fill();
      if ((app.cardFlash[u.k] || 0) > 0) { c.fillStyle = 'rgba(255,240,150,' + app.cardFlash[u.k] + ')'; c.fill(); }
      c.globalAlpha = can || cost == null ? 1 : 0.62;
      upIcon(u.k, 0, -h / 2 + 22, 26);
      txt(t('up_' + u.k), 0, -h / 2 + 46, 14, '#5b2a86', 'center', 900);
      for (let k = 0; k < 3; k++) { c.beginPath(); c.arc(-12 + k * 12, -h / 2 + 61, 3.6, 0, TAU); c.fillStyle = k < lv ? '#a46cff' : '#e5d8f5'; c.fill(); }
      if (cost == null) txt('MAX', 0, h / 2 - 12, 13, '#a46cff', 'center', 900);
      else { candyIcon(-10, h / 2 - 12, 14); txt(String(cost), 6, h / 2 - 11, 14, can ? '#d63e6c' : '#b08a99', 'left', 900); }
      c.globalAlpha = 1;
      c.restore();
      app.btns.push({ id: 'up' + i, x, y, w, h, action: () => {
        if (app.game.buy(u.k)) { app.cardFlash[u.k] = 0.8; burst(x + w / 2, y + 20, 14, 'star', '#ffd24d', 120); S.vibrate(20); }
        else { app.cardShake[u.k] = 0.3; S.play('deny'); }
      } });
    }
  }

  function drawPlay(dt) {
    const g = app.game, L = g.L;
    drawBackdrop(L);
    c.save();
    if (app.shake > 0) c.translate((Math.random() - 0.5) * app.shake, (Math.random() - 0.5) * app.shake);
    drawMouth(L, g.teeth, g.p.eating);
    // 먹는 중 표시 (고리)
    if (g.p.eating >= 0) {
      const tt = g.teeth[g.p.eating];
      const ry = tt.row === 0 ? tt.y + tt.h + 12 : tt.y - 12;
      c.beginPath(); c.arc(tt.cx, ry, 8, 0, TAU); c.fillStyle = 'rgba(40,0,40,.45)'; c.fill();
      c.beginPath(); c.moveTo(tt.cx, ry); c.arc(tt.cx, ry, 7, -Math.PI / 2, -Math.PI / 2 + TAU * tt.inf); c.closePath(); c.fillStyle = '#c69cff'; c.fill();
    }
    c.save(); mouthClip(L); c.clip();
    // 사탕
    for (const cd of g.candies) {
      if (cd.life < 2 && Math.floor(app.time * 8) % 2) continue;
      const pop = Math.min(1, cd.age * 4);
      c.save(); c.translate(cd.x, cd.y + Math.sin(app.time * 3 + cd.x) * 3); c.scale(pop, pop);
      c.beginPath(); c.arc(0, 0, 20, 0, TAU); c.fillStyle = 'rgba(255,240,150,.25)'; c.fill();
      if (cd.kind === 'heart') heart(0, 0, 30, '#ff4d7a', '#c2185b');
      else candyIcon(0, 0, 30, Math.sin(app.time * 2 + cd.y) * 0.3);
      c.restore();
    }
    for (const h of g.hz) if (h.st === 'warn') (h.kind === 'brush' ? drawBrushWarn : drawFloss)(h, L);
    c.restore();
    // 주인공
    const p = g.p;
    const sp = Math.hypot(p.vx, p.vy);
    const hurt = p.inv > 0;
    if (!(hurt && Math.floor(app.time * 14) % 2 && p.inv < 1.2)) {
      drawGerm(p.x, p.y + Math.sin(app.time * 5) * 1.5, p.r, {
        squash: Math.min(0.12, sp / 1800) * (Math.abs(p.vx) > Math.abs(p.vy) ? 1 : -1) + (p.eating >= 0 ? Math.sin(app.time * 22) * 0.05 : 0),
        lookX: Math.max(-1, Math.min(1, p.vx / 150)), lookY: Math.max(-1, Math.min(1, p.vy / 150)),
        eat: p.eating >= 0, hurt: hurt && p.inv > 1.0, dizzy: hurt && p.inv > 1.0,
      });
      if (hurt && p.inv > 1.0) for (let k = 0; k < 3; k++) { const a = app.time * 6 + k * TAU / 3; star(p.x + Math.cos(a) * 20, p.y - 22 + Math.sin(a) * 5, 5); c.fillStyle = '#ffe066'; c.fill(); }
    }
    // 처음 몇 초 손 안내
    if (app.hintT > 0 && g.t < 6) {
      const a = Math.min(1, app.hintT);
      c.globalAlpha = a;
      const hx = p.x + 40 + Math.sin(app.time * 3) * 26, hy = p.y + 70;
      c.beginPath(); c.arc(hx, hy, 14, 0, TAU); c.fillStyle = 'rgba(255,255,255,.75)'; c.fill();
      c.beginPath(); c.arc(hx, hy, 7, 0, TAU); c.fillStyle = '#ff6f91'; c.fill();
      txt(t('hint'), p.x, p.y + 100, 15, '#fff', 'center', 900, '#b0406a', 5);
      c.globalAlpha = 1;
    }
    // 칫솔·치실
    for (const h of g.hz) if (h.st !== 'warn') {
      if (h.kind === 'brush') {
        drawBrush(h, L);
        if (Math.random() < 0.6) app.parts.push({ x: h.x + (Math.random() - 0.5) * 100, y: h.y0 + Math.random() * (h.y1 - h.y0), vx: -h.dir * 40 * Math.random(), vy: -10, life: 0, max: 0.8, kind: 'bubble', size: 2 + Math.random() * 3, rot: 0 });
      } else drawFloss(h, L);
    }
    drawParts();
    c.restore();
    if (app.flash > 0) { c.fillStyle = 'rgba(255,90,140,' + app.flash * 0.35 + ')'; c.fillRect(0, 0, W, L.H); }
    drawHUD(g, L);
    drawUpgrades(g, L);
  }

  // ---------------- 사건 처리 ----------------
  function gate(name, gap) { const now = app.time; if ((app.sndGate[name] || 0) > now) return false; app.sndGate[name] = now + gap; return true; }
  function handleEvents(g) {
    for (const e of g.ev) {
      switch (e.type) {
        case 'chomp':
          S.play('chomp'); burst(g.p.x + g.p.face * 6, g.p.y + 6, 3, 'crumb', '#fff', 70);
          { const i = g.p.eating; if (i >= 0) app.toothShake[i] = 0.12; }
          break;
        case 'conquer':
          S.play('conquer'); S.vibrate(25);
          burst(e.x, e.y, 16, 'star', '#c69cff', 140); burst(e.x, e.y, 8, 'spark', '#fff', 100);
          break;
        case 'sugar': if (gate('sugar', 0.08)) S.play('sugar'); floatText(e.x, e.y - 10, '+' + e.n, '#d63e6c', true); break;
        case 'spread': S.play('spread'); burst(e.x, e.y, 10, 'spark', '#b98bff', 60); break;
        case 'warn': S.play('warn'); break;
        case 'swish': S.play('swish'); break;
        case 'floss': S.play('floss'); break;
        case 'clean': if (gate('clean', 0.06)) S.play('clean'); burst(e.x, e.y, 6, 'star', '#ffffff', 90); burst(e.x, e.y, 4, 'star', '#9ff3ff', 70); break;
        case 'hit': S.play('hit'); S.vibrate([90, 50, 90]); app.shake = 12; app.flash = 1; burst(e.x, e.y, 18, 'bubble', '#fff', 120); break;
        case 'candy': S.play('candy'); burst(e.x, e.y, 12, 'star', '#ff8fb1', 110); break;
        case 'upgrade': S.play('upgrade'); break;
        case 'heal': S.play('candy'); burst(e.x, e.y, 14, 'star', '#ff4d7a', 110); floatText(e.x, e.y - 12, '+1 ♥', '#ff4d7a'); break;
        case 'win': app.endTimer = 1.1; S.play('win'); S.vibrate([30, 40, 30, 40, 80]); finish(true); break;
        case 'lose': app.endTimer = 1.1; S.play('lose'); finish(false); break;
      }
    }
    g.ev.length = 0;
  }
  function finish(won) {
    const g = app.game;
    S.stopMusic();
    app.newRecord = false;
    if (won) {
      const b = save.best[g.stage];
      if (!b || g.t < b) { save.best[g.stage] = Math.round(g.t * 10) / 10; app.newRecord = true; }
      if (g.stage === 1 && save.unlocked < 2) save.unlocked = 2;
      persist();
      for (let i = 0; i < 70; i++) app.parts.push({ x: Math.random() * W, y: -10 - Math.random() * 200, vx: (Math.random() - 0.5) * 60, vy: 60 + Math.random() * 100, life: 0, max: 3 + Math.random() * 2, kind: 'confetti', color: ['#ff6f91', '#ffd24d', '#a46cff', '#6fe3b8', '#7fd8ff'][i % 5], size: 4 + Math.random() * 3, rot: Math.random() * TAU });
    }
  }

  // ---------------- 시작 ----------------
  function startStage(n) {
    S.unlock();
    const H = Math.round(Math.max(640, Math.min(860, window.innerHeight / window.innerWidth * W)));
    app.game = new Game(H, n);
    app.parts = []; app.screen = 'intro'; app.hintT = 3; app.shake = 0; app.flash = 0;
    app.cardShake = {}; app.cardFlash = {}; app.acc = { x: 0, y: 0 };
    resize();
  }
  function beginPlay() { app.screen = 'play'; S.play('tap'); S.startMusic(app.game.stage === 2); }

  // ---------------- 첫 화면 ----------------
  function drawTitle() {
    const L = app.bgL, H = app.H;
    drawBackdrop(L);
    // 큰 이빨
    const cx = W / 2, cy = H * 0.38;
    c.save(); c.translate(cx, cy + Math.sin(app.time * 1.6) * 4);
    c.beginPath(); c.ellipse(0, 105, 90, 16, 0, 0, TAU); c.fillStyle = 'rgba(200,80,120,.18)'; c.fill();
    c.beginPath();
    c.moveTo(-78, -60); c.bezierCurveTo(-80, -110, -20, -112, 0, -88); c.bezierCurveTo(20, -112, 80, -110, 78, -60);
    c.bezierCurveTo(76, -10, 62, 30, 52, 90); c.quadraticCurveTo(44, 106, 32, 92); c.lineTo(14, 30); c.quadraticCurveTo(0, 20, -14, 30);
    c.lineTo(-32, 92); c.quadraticCurveTo(-44, 106, -52, 90); c.bezierCurveTo(-62, 30, -76, -10, -78, -60); c.closePath();
    const tg = c.createLinearGradient(-80, 0, 80, 0); tg.addColorStop(0, '#fff'); tg.addColorStop(1, '#e4eaf4');
    c.fillStyle = tg; c.fill(); c.lineWidth = 4; c.strokeStyle = '#c9b3e6'; c.stroke();
    c.fillStyle = 'rgba(255,255,255,.95)'; rr(-58, -78, 16, 70, 8); c.fill();
    // 구멍 몇 개 + 걱정 얼굴
    c.fillStyle = '#6b4128';
    c.beginPath(); c.arc(40, -40, 9, 0, TAU); c.fill(); c.beginPath(); c.arc(28, 12, 6, 0, TAU); c.fill();
    c.fillStyle = '#3a2a3a';
    c.beginPath(); c.arc(-22, -30, 6, 0, TAU); c.fill(); c.beginPath(); c.arc(18, -30, 6, 0, TAU); c.fill();
    c.fillStyle = '#fff'; c.beginPath(); c.arc(-24, -32, 2, 0, TAU); c.fill(); c.beginPath(); c.arc(16, -32, 2, 0, TAU); c.fill();
    c.beginPath(); c.ellipse(-2, -6, 8, 10, 0, 0, TAU); c.fillStyle = '#3a2a3a'; c.fill();
    c.strokeStyle = '#3a2a3a'; c.lineWidth = 3; c.lineCap = 'round';
    c.beginPath(); c.moveTo(-32, -46); c.lineTo(-14, -42); c.moveTo(28, -46); c.lineTo(10, -42); c.stroke();
    c.beginPath(); c.moveTo(58, -64); c.quadraticCurveTo(66, -50, 58, -46); c.quadraticCurveTo(50, -50, 58, -64); c.fillStyle = '#7fd3ff'; c.fill();
    c.restore();
    // 충치콩이 이빨 위에서 깡충
    const jy = Math.abs(Math.sin(app.time * 3.2)) * 26;
    drawGerm(cx - 70, cy + 70 - jy, 30, { eat: Math.sin(app.time * 3.2) < 0, lookX: 0.8, lookY: -0.3, squash: jy < 4 ? 0.1 : -0.04 });
    // 제목
    const ty = H * 0.1;
    c.save(); c.translate(W / 2, ty); c.rotate(-0.03);
    txt(t('title'), 0, 4, save.lang === 'ko' ? 52 : 46, '#5b2a86', 'center', 900, '#5b2a86', 14);
    txt(t('title'), 0, 0, save.lang === 'ko' ? 52 : 46, '#fff', 'center', 900, '#a46cff', 10);
    c.restore();
    txt(t('sub'), W / 2, ty + 48, 17, '#b0406a', 'center', 800);
    // 단계 단추
    const by = H * 0.64;
    const b1 = save.best[1] ? t('best') + ' ' + fmtTime(save.best[1]) : t('stn1');
    button('s1', 40, by, W - 80, 64, t('st1') + ' · ' + t('play'), { bg: '#ff6f91', dark: '#c73e67', size: 22 }, () => startStage(1), b1);
    const locked = save.unlocked < 2;
    const b2 = locked ? t('locked') : (save.best[2] ? t('best') + ' ' + fmtTime(save.best[2]) : t('stn2'));
    button('s2', 40, by + 80, W - 80, 64, t('st2') + (locked ? '' : ' · ' + t('play')),
      locked ? { bg: '#d9c7d0', dark: '#b5a0aa', size: 22, fg: '#fff' } : { bg: '#8a5cf6', dark: '#5b34c9', size: 22 },
      () => { if (locked) { S.unlock(); S.play('deny'); } else startStage(2); }, b2);
    // 작은 단추들
    const sy = by + 166;
    button('lang', 40, sy, (W - 96) / 2, 44, t('lang'), { bg: '#fff', dark: '#e2b6c6', fg: '#b0406a', size: 16 }, () => {
      save.lang = save.lang === 'ko' ? 'en' : 'ko'; document.documentElement.lang = save.lang; persist(); S.unlock(); S.play('tap');
    });
    button('snd', 56 + (W - 96) / 2, sy, (W - 96) / 2, 44, t('sound') + ' ' + (save.sound ? t('on') : t('off')), { bg: '#fff', dark: '#e2b6c6', fg: '#b0406a', size: 16 }, () => {
      save.sound = !save.sound; S.on = save.sound; S.setMusic(save.sound); persist(); S.unlock(); S.play('tap');
    });
    txt('ledeuxions.com', W / 2, H - 18, 12, 'rgba(176,64,106,.55)', 'center', 700);
  }

  // ---------------- 겹쳐 뜨는 카드 ----------------
  function dim() { c.fillStyle = 'rgba(60,10,40,.55)'; c.fillRect(0, 0, W, app.H); }
  function card(y, h) {
    rr(24, y + 6, W - 48, h, 28); c.fillStyle = 'rgba(120,30,80,.35)'; c.fill();
    rr(24, y, W - 48, h, 28); c.fillStyle = '#fff8fb'; c.fill();
    c.lineWidth = 4; c.strokeStyle = '#ffc2d4'; c.stroke();
  }
  function drawIntro() {
    const g = app.game, H = app.H;
    dim();
    const tips = [['drag', t('tipDrag')], ['eat', t('tipEat')], ['brush', t('tipBrush')]];
    if (g.stage === 2) tips.push(['floss', t('tipFloss')]); else tips.push(['spread', t('tipSpread')]);
    tips.push(['sugar', t('tipSugar')]);
    const ch = 160 + tips.length * 58, y = (H - ch) / 2;
    card(y, ch);
    txt(g.stage === 1 ? t('st1') : t('st2'), W / 2, y + 36, 16, '#b0406a', 'center', 800);
    txt(g.stage === 1 ? t('stn1') : t('stn2'), W / 2, y + 66, 26, '#5b2a86', 'center', 900);
    tips.forEach(([k, s], i) => {
      const ty = y + 110 + i * 58;
      c.beginPath(); c.arc(64, ty, 22, 0, TAU); c.fillStyle = '#ffe3ec'; c.fill();
      if (k === 'drag') { c.beginPath(); c.arc(64, ty, 9, 0, TAU); c.fillStyle = '#ff6f91'; c.fill(); c.lineWidth = 2; c.strokeStyle = '#ff6f91'; c.beginPath(); c.moveTo(50, ty + 12); c.lineTo(78, ty + 12); c.stroke(); }
      else if (k === 'eat') drawGerm(64, ty, 14, { eat: true });
      else if (k === 'brush') { c.fillStyle = '#4fb6f0'; rr(46, ty - 4, 36, 8, 4); c.fill(); c.fillStyle = '#fff'; for (let q = 0; q < 4; q++) { rr(48 + q * 6, ty - 14, 4, 10, 2); c.fill(); } }
      else if (k === 'floss') { c.lineWidth = 3; c.strokeStyle = '#35c48f'; c.beginPath(); c.moveTo(64, ty - 16); c.lineTo(64, ty + 16); c.stroke(); }
      else if (k === 'spread') upIcon('spread', 64, ty, 26);
      else candyIcon(64, ty, 28);
      const lines = wrap(s, W - 150, 15, 700);
      lines.forEach((ln, j) => txt(ln, 98, ty + (j - (lines.length - 1) / 2) * 19, 15, '#4a2a5a', 'left', 700));
    });
    const pulse = 1 + Math.sin(app.time * 5) * 0.04;
    c.save(); c.translate(W / 2, y + ch - 36); c.scale(pulse, pulse);
    txt(t('tapStart'), 0, 0, 22, '#ff4d7a', 'center', 900);
    c.restore();
    app.btns.push({ id: 'begin', x: 0, y: 0, w: W, h: H, action: beginPlay });
  }
  function drawPause() {
    dim();
    const y = app.H / 2 - 130;
    card(y, 260);
    txt(t('paused'), W / 2, y + 50, 26, '#5b2a86', 'center', 900);
    button('resume', 60, y + 90, W - 120, 58, t('resume'), { bg: '#ff6f91', dark: '#c73e67' }, () => { app.screen = 'play'; S.play('tap'); });
    button('home', 60, y + 166, W - 120, 58, t('home'), { bg: '#8a5cf6', dark: '#5b34c9' }, () => { app.screen = 'title'; S.stopMusic(); S.play('tap'); resize(); });
  }
  function drawEnd(won) {
    const g = app.game, H = app.H;
    dim();
    const ch = 470, y = (H - ch) / 2;
    card(y, ch);
    if (won) {
      // 별
      const stars = g.hearts;
      for (let i = 0; i < 3; i++) {
        const sx = W / 2 + (i - 1) * 56, sy = y + 52 - (i === 1 ? 10 : 0);
        const on = i < stars;
        const pop = Math.min(1, Math.max(0, (app.endT - 0.3 - i * 0.25) * 4));
        c.save(); c.translate(sx, sy); c.scale(on ? pop : 1, on ? pop : 1);
        star(0, 0, 24); c.fillStyle = on ? '#ffd24d' : '#eadbe3'; c.fill(); c.lineWidth = 3; c.strokeStyle = on ? '#e89a00' : '#d6c3cd'; c.stroke();
        c.restore();
      }
      txt(t('winTitle'), W / 2, y + 110, 26, '#5b2a86', 'center', 900);
      if (g.stage === 2) txt(t('winAll'), W / 2, y + 140, 15, '#b0406a', 'center', 800);
      drawGerm(W / 2, y + 190 + Math.sin(app.time * 6) * 4, 30, { eat: true });
    } else {
      txt(t('loseTitle'), W / 2, y + 56, 26, '#2f7fb8', 'center', 900);
      txt(t('loseSub'), W / 2, y + 90, 16, '#6a86a0', 'center', 800);
      drawGerm(W / 2, y + 170, 30, { dizzy: true, hurt: true });
      for (let k = 0; k < 6; k++) { const a = app.time * 2 + k; c.beginPath(); c.arc(W / 2 + Math.cos(a) * 46, y + 170 + Math.sin(a * 1.3) * 30, 5 + (k % 3) * 2, 0, TAU); c.fillStyle = 'rgba(160,220,255,.6)'; c.fill(); }
    }
    txt(t('time') + ' ' + fmtTime(g.t) + (won && app.newRecord ? '  ·  ' + t('record') : ''), W / 2, y + 240, 15, '#8a6a7a', 'center', 800);
    // 교훈 상자
    rr(44, y + 262, W - 88, 84, 18); c.fillStyle = '#e8f7ff'; c.fill(); c.lineWidth = 2; c.strokeStyle = '#a6dcf5'; c.stroke();
    txt(t('moralHead'), W / 2, y + 284, 15, '#2f7fb8', 'center', 900);
    const ml = wrap(won ? t('moral') : t('moralLose'), W - 120, 14, 700);
    ml.forEach((ln, j) => txt(ln, W / 2, y + 308 + j * 18, 14, '#335a74', 'center', 700));
    if (won && g.stage === 2) txt(t('soon'), W / 2, y + 358, 13, '#a46cff', 'center', 800);
    const b1y = y + ch - 104;
    if (won && g.stage === 1) button('next', 50, b1y, W - 100, 52, t('next'), { bg: '#ff6f91', dark: '#c73e67' }, () => startStage(2));
    else button('retry', 50, b1y, W - 100, 52, t('retry'), { bg: '#ff6f91', dark: '#c73e67' }, () => startStage(g.stage));
    button('home2', 50, b1y + 62, W - 100, 44, t('home'), { bg: '#8a5cf6', dark: '#5b34c9', size: 17 }, () => { app.screen = 'title'; S.play('tap'); resize(); });
  }

  // ---------------- 손 ----------------
  function toLocal(e) {
    const r = cv.getBoundingClientRect();
    return { x: (e.clientX - r.left) / app.scale, y: (e.clientY - r.top) / app.scale };
  }
  function hitBtn(pt) {
    for (let i = app.btns.length - 1; i >= 0; i--) {
      const b = app.btns[i];
      if (pt.x >= b.x && pt.x <= b.x + b.w && pt.y >= b.y && pt.y <= b.y + b.h) return b;
    }
    return null;
  }
  cv.addEventListener('pointerdown', e => {
    e.preventDefault();
    S.unlock();
    const pt = toLocal(e);
    const b = hitBtn(pt);
    if (b) { app.press = { id: b.id, pid: e.pointerId }; if (app.screen === 'play' && b.id.startsWith('up')) { b.action(); app.pressFired = true; } else app.pressFired = false; return; }
    if (app.screen === 'play') { app.drag = { id: e.pointerId, x: pt.x, y: pt.y }; app.hintT = Math.min(app.hintT, 0.6); }
  });
  cv.addEventListener('pointermove', e => {
    if (!app.drag || app.drag.id !== e.pointerId) return;
    const pt = toLocal(e);
    app.acc.x += (pt.x - app.drag.x) * 1.35; app.acc.y += (pt.y - app.drag.y) * 1.35;
    app.drag.x = pt.x; app.drag.y = pt.y;
  });
  function up(e) {
    if (app.drag && app.drag.id === e.pointerId) app.drag = null;
    if (app.press && app.press.pid === e.pointerId) {
      const pt = toLocal(e);
      const b = hitBtn(pt);
      const id = app.press.id; app.press = null;
      if (b && b.id === id && !app.pressFired) b.action();
    }
  }
  cv.addEventListener('pointerup', up);
  cv.addEventListener('pointercancel', e => { app.drag = null; app.press = null; });
  window.addEventListener('keydown', e => {
    app.keys[e.key] = true;
    if (e.key === 'Escape' || e.key === 'p') { if (app.screen === 'play') app.screen = 'pause'; else if (app.screen === 'pause') app.screen = 'play'; }
    if ((e.key === ' ' || e.key === 'Enter') && app.screen === 'intro') beginPlay();
    if (['1', '2', '3', '4'].includes(e.key) && app.screen === 'play') app.game.buy(UPGRADES[+e.key - 1].k);
  });
  window.addEventListener('keyup', e => { app.keys[e.key] = false; });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { if (app.screen === 'play') app.screen = 'pause'; if (S.ctx) S.ctx.suspend(); }
    else if (S.ctx) S.ctx.resume();
  });
  document.addEventListener('contextmenu', e => e.preventDefault());
  document.addEventListener('touchend', () => S.unlock(), { passive: true });

  // ---------------- 한 장면 ----------------
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    step(dt);
    requestAnimationFrame(frame);
  }
  function step(dt) {
    app.time += dt;
    app.btns = [];
    c.setTransform(app.scale * app.dpr, 0, 0, app.scale * app.dpr, 0, 0);
    const g = app.game;
    if (app.screen === 'play' && g) {
      const k = app.keys; let kx = 0, ky = 0;
      if (k.ArrowLeft || k.a) kx--; if (k.ArrowRight || k.d) kx++; if (k.ArrowUp || k.w) ky--; if (k.ArrowDown || k.s) ky++;
      const sp = g.speed() * dt;
      const inp = { dx: app.acc.x + kx * sp, dy: app.acc.y + ky * sp };
      app.acc.x = 0; app.acc.y = 0;
      g.update(dt, inp);
      handleEvents(g);
      if (app.hintT > 0 && g.t > 3) app.hintT -= dt;
    }
    if (g && (app.screen === 'play' || app.screen === 'win' || app.screen === 'lose')) {
      if (g.status !== 'play' && app.screen === 'play') {
        app.endTimer -= dt;
        if (app.endTimer <= 0) { app.screen = g.status; app.endT = 0; }
      }
    }
    if (app.screen === 'win' || app.screen === 'lose') app.endT = (app.endT || 0) + dt;
    app.shake = Math.max(0, app.shake - dt * 40);
    app.flash = Math.max(0, app.flash - dt * 2.5);
    for (const k in app.cardShake) app.cardShake[k] -= dt;
    for (const k in app.cardFlash) app.cardFlash[k] = Math.max(0, app.cardFlash[k] - dt * 2);
    for (let i = 0; i < 16; i++) if (app.toothShake[i] > 0) app.toothShake[i] -= dt;
    if (app.screen !== 'pause' && app.screen !== 'intro') updParts(dt);

    // 판 밖(여백) 색
    c.fillStyle = '#ffd2df'; c.fillRect(0, 0, W, app.H);
    if (app.screen === 'title') drawTitle();
    else {
      const btnsBefore = app.btns.length;
      drawPlay(dt);
      if (app.screen !== 'play') app.btns.length = btnsBefore; // 겹친 화면에선 판 단추 끔
      if (app.screen === 'intro') drawIntro();
      else if (app.screen === 'pause') drawPause();
      else if (app.screen === 'win') { drawEnd(true); drawParts(); }
      else if (app.screen === 'lose') drawEnd(false);
    }
  }
  app.step = step; app.startStage = startStage; app.beginPlay = beginPlay; app.save = save;
  requestAnimationFrame(frame);
})();
