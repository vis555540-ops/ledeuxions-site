// game.js — 충치의 역습 v2: 화면·손·소리·저장. 규칙은 logic.js.
// v2: 비스듬히 내려다본 입 속, 그림자 숨기, 위아래 뒤집기, 테크 나무·통증 지수.
(function () {
  'use strict';
  const { W, NT, SQ, TECH, Game, layout, archAt } = window.ChungLogic;
  const S = window.Sound;
  const cv = document.getElementById('cv');
  const c = cv.getContext('2d');
  const FONT = "'Apple SD Gothic Neo','Noto Sans KR','Malgun Gothic',system-ui,-apple-system,sans-serif";
  const TAU = Math.PI * 2;

  // ---------------- 글 ----------------
  const T = {
    ko: {
      title: '충치의 역습', sub: '칫솔 눈을 피해 그림자에 숨어 냠냠!',
      st1: '1단계', st2: '2단계', stn1: '칫솔이 온다!', stn2: '치실도 온다!',
      locked: '1단계를 깨면 열려요', best: '최고 기록', play: '시작',
      tipDrag: '화면 아무 데나 끌어서 움직여요', tipEat: '이 위에 올라가면 빨리, 옆에 붙으면 조금씩 먹어요',
      tipShade: '그림자에 숨으면 칫솔이 못 찾아요. 오래는 못 숨어요!',
      tipFlip: '두 번 톡톡(또는 ⇅ 단추) 하면 위아래 턱으로 휙 뒤집어요',
      tipBrush: '칫솔은 눈이 있어요. 보이면 쫓아와요!',
      tipFloss: '치실은 이 틈 그림자까지 훑어요. 초록 자리는 피해요!',
      tipTech: '사탕으로 진화! 세질수록 아야 지수가 올라요. 100이면 치과행',
      tapStart: '눌러서 시작!',
      paused: '잠깐 쉬어요', resume: '계속하기', home: '처음으로', retry: '다시 하기', next: '다음 단계',
      winTitle: '이빨을 다 먹었다!', winAll: '모든 단계를 깼어요!',
      loseTitle: '뽀득뽀득! 다 닦였다', loseSub: '이번엔 칫솔이 이겼어요',
      dentTitle: '치과에 갔다!', dentSub: '너무 아파서 주인이 치과에 갔어요. 위잉~',
      dentTip: '진정 가지(살금살금·마취)로 아야 지수를 낮춰요',
      time: '걸린 시간', record: '새 기록!',
      moralHead: '게임은 게임!', moral: '진짜 이는 하루 세 번, 3분씩 닦아요',
      moralLose: '진짜 입 속에서도 칫솔이 이겨야 해요',
      soon: '다음엔 가글이 와요... 기대해요!',
      sound: '소리', on: '켬', off: '끔', lang: 'English',
      hint: '끌어서 움직이기', flip: '뒤집기', tech: '진화', canBuy: '살 수 있어요!', pain: '아야 지수',
      painHigh: '너무 아파! 진정시켜요', hidden: '쉿!', found: '들켰다!', phew: '휴~',
      techTitle: '진화 나무', close: '돌아가기', buy: '사기', own: '가짐', lockedNode: '위 칸 먼저',
      needSugar: '사탕이 모자라요', painUp: '아야', painDown: '아야',
      br0: '퍼뜨리기', br1: '숨기', br2: '진정',
      n_eat1: '냠냠', n_spread1: '번짐', n_eat2: '와작', n_spread2: '대번짐',
      n_shade1: '그늘', n_blur: '흐릿', n_sticky: '끈적', n_ghost: '투명',
      n_quiet: '살금살금', n_speed: '날쌘', n_numb: '마취', n_calm: '진정',
      d_eat1: '이를 더 빨리 먹어요', d_spread1: '옆 이로 더 빨리 번져요', d_eat2: '이를 훨씬 더 빨리 먹어요', d_spread2: '번짐이 아주 빨라져요',
      d_shade1: '그림자에 더 오래 숨어요', d_blur: '칫솔 눈이 흐려져서 잘 못 봐요', d_sticky: '칫솔에 덜 닦여요',
      d_ghost: '반투명! 숨는 시간이 천천히 줄고 칫솔 눈이 더 나빠져요',
      d_quiet: '먹을 때 덜 아파요 (아야 조금 내려감)', d_speed: '더 빨리 움직이고 자주 뒤집어요',
      d_numb: '아야 지수가 확 내려가고 빨리 가라앉아요', d_calm: '이를 다 먹어도 덜 아파요',
      tapNode: '동그라미를 눌러 골라요',
    },
    en: {
      title: 'Revenge of the Cavity', sub: 'Hide in the shadows, munch the teeth!',
      st1: 'Stage 1', st2: 'Stage 2', stn1: 'Here comes the brush!', stn2: 'Floss joins in!',
      locked: 'Clear Stage 1 to unlock', best: 'Best', play: 'Play',
      tipDrag: 'Drag anywhere on the screen to move', tipEat: 'On top of a tooth = fast munch, beside it = slow nibble',
      tipShade: 'Hide in a shadow and the brush can\'t find you. Not for long!',
      tipFlip: 'Double-tap (or the ⇅ button) to flip to the other jaw',
      tipBrush: 'The brush has eyes. If it sees you, it chases!',
      tipFloss: 'Floss sweeps the gap shadows too. Avoid the green zone!',
      tipTech: 'Evolve with candy! Power raises the Ouch meter. 100 = dentist',
      tapStart: 'Tap to start!',
      paused: 'Paused', resume: 'Resume', home: 'Home', retry: 'Retry', next: 'Next stage',
      winTitle: 'All teeth munched!', winAll: 'You cleared every stage!',
      loseTitle: 'Squeaky clean!', loseSub: 'The toothbrush won this time',
      dentTitle: 'Off to the dentist!', dentSub: 'It hurt too much. Bzzzz goes the drill!',
      dentTip: 'Use the Soothe branch (Tiptoe, Numb) to lower Ouch',
      time: 'Time', record: 'New best!',
      moralHead: 'A game is just a game!', moral: 'For real teeth: brush 3 times a day, 3 minutes',
      moralLose: 'In your real mouth, the brush should always win',
      soon: 'Next time: mouthwash is coming...',
      sound: 'Sound', on: 'On', off: 'Off', lang: '한국어',
      hint: 'Drag to move', flip: 'Flip', tech: 'Evolve', canBuy: 'Ready!', pain: 'Ouch meter',
      painHigh: 'Too painful! Soothe it', hidden: 'Shh!', found: 'Spotted!', phew: 'Phew~',
      techTitle: 'Evolution tree', close: 'Back', buy: 'Buy', own: 'Owned', lockedNode: 'Get the one above first',
      needSugar: 'Need more candy', painUp: 'Ouch', painDown: 'Ouch',
      br0: 'Spread', br1: 'Stealth', br2: 'Soothe',
      n_eat1: 'Munch', n_spread1: 'Spread', n_eat2: 'Crunch', n_spread2: 'Outbreak',
      n_shade1: 'Shade', n_blur: 'Blur', n_sticky: 'Sticky', n_ghost: 'Ghost',
      n_quiet: 'Tiptoe', n_speed: 'Zoom', n_numb: 'Numb', n_calm: 'Soothe',
      d_eat1: 'Eat teeth faster', d_spread1: 'Spread to neighbors faster', d_eat2: 'Eat teeth much faster', d_spread2: 'Spreading gets very fast',
      d_shade1: 'Hide in shadows longer', d_blur: 'The brush\'s eyes get blurry', d_sticky: 'Brushes clean you less',
      d_ghost: 'See-through! Hiding lasts longer, brush sees even less',
      d_quiet: 'Eating hurts less (Ouch goes down a bit)', d_speed: 'Move faster, flip more often',
      d_numb: 'Ouch drops a lot and calms faster', d_calm: 'Finished teeth hurt less',
      tapNode: 'Tap a circle to choose',
    },
  };

  // ---------------- 저장 ----------------
  const KEY = 'chungchi.v2';
  let save = { lang: null, sound: true, music: true, unlocked: 1, best: {} };
  try {
    const old = JSON.parse(localStorage.getItem('chungchi.v1') || 'null');
    if (old) { save.lang = old.lang; save.sound = old.sound; }
    const s = JSON.parse(localStorage.getItem(KEY) || 'null'); if (s) save = Object.assign(save, s);
  } catch (e) { }
  const qs = new URLSearchParams(location.search);
  if (!save.lang) save.lang = (qs.get('lang') || navigator.language || 'ko').toLowerCase().startsWith('ko') ? 'ko' : 'en';
  if (qs.get('lang')) save.lang = qs.get('lang') === 'en' ? 'en' : 'ko';
  function persist() { try { localStorage.setItem(KEY, JSON.stringify(save)); } catch (e) { } }
  const t = k => (T[save.lang] && T[save.lang][k]) || T.ko[k] || k;
  S.on = save.sound; S.music = save.sound;
  document.documentElement.lang = save.lang;

  // ---------------- 화면 크기 ----------------
  const app = { H: 760, scale: 1, dpr: 1, screen: 'title', game: null, time: 0, shake: 0, flash: 0,
    parts: [], btns: [], press: null, drag: null, acc: { x: 0, y: 0 }, keys: {}, endTimer: 0,
    newRecord: false, hintT: 0, toothShake: new Array(20).fill(0), sndGate: {}, lastTap: 0, techSel: null, painShake: 0, geo: null };
  window.__cc = app; // 시험용

  function resize() {
    const iw = window.innerWidth, ih = window.innerHeight;
    const H = app.game && app.screen !== 'title' ? app.game.L.H : Math.round(Math.max(640, Math.min(860, ih / iw * W)));
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
    if (o.rot) c.rotate(o.rot);
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

  // ---------------- 입체 도형 도구 ----------------
  function hull(P) {
    P = P.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    const lo = [], up = [];
    for (const p of P) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
    for (let i = P.length - 1; i >= 0; i--) { const p = P[i]; while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); }
    up.pop(); lo.pop();
    return lo.concat(up);
  }
  function polyPath(P, dx, dy) { dx = dx || 0; dy = dy || 0; c.moveTo(P[0][0] + dx, P[0][1] + dy); for (let i = 1; i < P.length; i++) c.lineTo(P[i][0] + dx, P[i][1] + dy); c.closePath(); }
  function ellPts(t, grow, N) {
    N = N || 36; const out = [];
    const ca = Math.cos(t.ang), sa = Math.sin(t.ang), a = t.w / 2 + (grow || 0), b = t.d / 2 + (grow || 0);
    for (let k = 0; k < N; k++) {
      const th = k / N * TAU;
      // 모서리가 조금 네모난 이 모양 (초타원)
      const cs = Math.cos(th), sn = Math.sin(th);
      const u = Math.sign(cs) * Math.pow(Math.abs(cs), 0.72) * a, v = Math.sign(sn) * Math.pow(Math.abs(sn), 0.72) * b;
      out.push([t.cx + u * ca - v * sa, t.cy + (u * sa + v * ca) * SQ]);
    }
    return out;
  }
  function buildGeo(L) {
    const geo = [];
    for (const tt of L.teeth) {
      const top = ellPts(tt, 0);
      const side = hull(top.concat(top.map(p => [p[0], p[1] + tt.h * tt.dir])));
      geo.push({ top, side, rim: ellPts(tt, -tt.d * 0.16) });
    }
    return geo;
  }
  function archPath(L, jaw, s0, s1, off, dy) {
    c.beginPath();
    let first = true;
    for (let s = s0; s <= s1 + 0.1; s += 6) {
      const P = archAt(L, jaw, Math.min(s, s1));
      const x = P.x + P.nx * (off || 0), y = P.y + P.ny * (off || 0) + (dy || 0);
      if (first) { c.moveTo(x, y); first = false; } else c.lineTo(x, y);
    }
  }

  // ---------------- 입 속 ----------------
  function drawBackdrop(L) {
    const H = L.H;
    const g = c.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#ffe6ee'); g.addColorStop(1, '#ffd2df');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    c.fillStyle = 'rgba(255,255,255,.45)';
    for (let y = 18; y < H; y += 34) for (let x = (y / 34 % 2) * 17 + 8; x < W; x += 34) { c.beginPath(); c.arc(x, y, 2.4, 0, TAU); c.fill(); }
  }
  function mouthClip(L) { rr(L.mL, L.mT, L.mR - L.mL, L.mB - L.mT, 48); }

  function drawMouth(L, g) {
    const A = L.arch, mid = L.midY;
    c.save();
    // 입술
    rr(L.mL - 6, L.mT - 6, L.mR - L.mL + 12, L.mB - L.mT + 12, 54); c.fillStyle = '#ff6f91'; c.fill();
    mouthClip(L);
    const bg = c.createRadialGradient(W / 2, mid, 30, W / 2, mid, (L.mB - L.mT) * 0.62);
    bg.addColorStop(0, '#5a1333'); bg.addColorStop(0.55, '#8c2c52'); bg.addColorStop(1, '#b8466f');
    c.fillStyle = bg; c.fill();
    c.clip();
    // 입천장 (위 턱 안쪽): 주름 무늬
    const pal = c.createRadialGradient(W / 2, A.yF - 60 - (A.yF - mid) * 0 , 10, W / 2, 2 * mid - (A.yF + A.yB) / 2, 150);
    c.save();
    c.beginPath(); c.ellipse(W / 2, 2 * mid - (A.yB + A.yF) / 2 + 6, A.rx - 36, (A.yF - A.yB) / 2 + 8, 0, 0, TAU);
    const pg = c.createLinearGradient(0, L.mT, 0, mid);
    pg.addColorStop(0, '#ff9fb8'); pg.addColorStop(1, '#d9557e');
    c.fillStyle = pg; c.fill();
    c.clip();
    c.strokeStyle = 'rgba(255,220,230,.35)'; c.lineWidth = 3; c.lineCap = 'round';
    const pcy = 2 * mid - A.yF + 40;
    for (let k = 0; k < 4; k++) {
      c.beginPath(); c.moveTo(W / 2 - 18 - k * 8, pcy + k * 22); c.quadraticCurveTo(W / 2 - 50 - k * 10, pcy + k * 22 + 10, W / 2 - 70 - k * 8, pcy + k * 22 - 4); c.stroke();
      c.beginPath(); c.moveTo(W / 2 + 18 + k * 8, pcy + k * 22); c.quadraticCurveTo(W / 2 + 50 + k * 10, pcy + k * 22 + 10, W / 2 + 70 + k * 8, pcy + k * 22 - 4); c.stroke();
    }
    c.beginPath(); c.moveTo(W / 2, pcy - 20); c.lineTo(W / 2, mid - 40); c.stroke();
    c.restore();
    // 혀 (아래 턱 안쪽)
    const ty = (A.yB + A.yF) / 2 + 4;
    const tg = c.createLinearGradient(0, mid, 0, A.yF);
    tg.addColorStop(0, '#d94f78'); tg.addColorStop(0.35, '#ff8fae'); tg.addColorStop(1, '#ff7aa0');
    c.beginPath(); c.ellipse(W / 2, ty, A.rx - 34, (A.yF - A.yB) / 2 + 4, 0, 0, TAU); c.fillStyle = tg; c.fill();
    c.beginPath(); c.moveTo(W / 2, ty - 40); c.quadraticCurveTo(W / 2 + 4, ty + 10, W / 2, ty + 70);
    c.lineWidth = 3; c.strokeStyle = 'rgba(190,50,90,.35)'; c.stroke();
    c.fillStyle = 'rgba(255,255,255,.22)';
    c.beginPath(); c.ellipse(W / 2 - 34, ty + 20, 22, 9, -0.4, 0, TAU); c.fill();
    // 가운데 (위아래 턱 사이) 어두운 틈
    const mg = c.createLinearGradient(0, mid - 26, 0, mid + 26);
    mg.addColorStop(0, 'rgba(40,4,22,0)'); mg.addColorStop(0.5, 'rgba(40,4,22,.75)'); mg.addColorStop(1, 'rgba(40,4,22,0)');
    c.fillStyle = mg; c.fillRect(0, mid - 26, W, 52);
    c.setLineDash([6, 10]); c.lineDashOffset = -app.time * 12; c.strokeStyle = 'rgba(255,200,230,.28)'; c.lineWidth = 2;
    c.beginPath(); c.moveTo(0, mid); c.lineTo(W, mid); c.stroke(); c.setLineDash([]);
    // 빛 (입 앞에서 들어오는 램프)
    const la = g ? g.lightA : -Math.PI / 2;
    for (const jaw of [0, 1]) {
      const lx = W / 2 - Math.cos(la) * 150, ly = jaw ? L.mB + 8 : L.mT - 8;
      const lg = c.createRadialGradient(lx, ly, 4, lx, ly, 150);
      lg.addColorStop(0, 'rgba(255,248,200,.35)'); lg.addColorStop(1, 'rgba(255,248,200,0)');
      c.fillStyle = lg; c.fillRect(lx - 150, ly - 150, 300, 300);
    }
    // 잇몸 (앞면 → 윗면)
    for (const jaw of [0, 1]) {
      const dir = jaw ? 1 : -1;
      c.lineCap = 'round'; c.lineJoin = 'round';
      archPath(L, jaw, 0, L.archLen, 0, 11 * dir); c.lineWidth = 72; c.strokeStyle = '#d9577f'; c.stroke();
      archPath(L, jaw, 0, L.archLen, 0, 0); c.lineWidth = 72; c.strokeStyle = '#ff8fa8'; c.stroke();
      archPath(L, jaw, 0, L.archLen, -4, 0); c.lineWidth = 50; c.strokeStyle = '#ffa3b9'; c.stroke();
    }
    // 그림자 (한 번에 칠해서 겹쳐도 같은 진하기)
    if (g) {
      for (const jaw of [0, 1]) {
        c.beginPath();
        for (let k = 0; k < NT; k++) {
          const i = jaw * NT + k, tt = g.teeth[i];
          const [sx, sy] = g.shadowVec(tt);
          const top = app.geo[i].top;
          polyPath(hull(top.concat(top.map(p => [p[0] + sx, p[1] + sy]))));
        }
        c.fillStyle = 'rgba(28,0,48,.55)'; c.fill('nonzero');
      }
    }
    c.restore();
  }

  const SPOTS = [];
  for (let i = 0; i < 20; i++) {
    let s = (i + 1) * 9301 + 49297; const R = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
    const arr = [];
    for (let k = 0; k < 7; k++) { const a = R() * TAU, r = Math.sqrt(R()) * 0.62; arr.push({ u: Math.cos(a) * r, v: Math.sin(a) * r, s: 2.8 + R() * 3.6 }); }
    SPOTS.push(arr);
  }
  function drawTooth(g, tt, eatingMe) {
    const i = tt.i, geo = app.geo[i];
    const dx = app.toothShake[i] > 0 ? Math.sin(app.time * 60) * 1.3 : 0;
    const inf = tt.inf, done = tt.done;
    c.save(); c.translate(dx, 0);
    // 옆면
    c.beginPath(); polyPath(geo.side);
    const sg = c.createLinearGradient(0, tt.cy - tt.d * 0.4, 0, tt.cy + tt.h * tt.dir + tt.d * 0.4 * tt.dir);
    if (done) { sg.addColorStop(0, '#b08a60'); sg.addColorStop(1, '#7d5a3a'); }
    else { sg.addColorStop(0, '#e6ebf3'); sg.addColorStop(1, '#aab5c9'); }
    c.fillStyle = sg; c.fill();
    c.lineWidth = 1.4; c.strokeStyle = done ? '#6e4c2e' : '#98a4ba'; c.stroke();
    // 윗면
    c.beginPath(); polyPath(geo.top);
    const tg = c.createRadialGradient(tt.cx - tt.w * 0.2, tt.cy - tt.d * 0.25 * SQ, 2, tt.cx, tt.cy, Math.max(tt.w, tt.d) * 0.7);
    if (done) { tg.addColorStop(0, '#dcc39e'); tg.addColorStop(1, '#b8946a'); }
    else { tg.addColorStop(0, '#ffffff'); tg.addColorStop(0.7, '#f5f8fc'); tg.addColorStop(1, '#dfe6f0'); }
    c.fillStyle = tg; c.fill();
    c.save(); c.clip();
    if (inf > 0 && !done) { c.fillStyle = 'rgba(214,170,90,' + (inf * 0.45) + ')'; c.fillRect(tt.cx - 60, tt.cy - 60, 120, 120); }
    // 어금니 홈
    if (tt.molar) {
      c.strokeStyle = done ? 'rgba(90,60,30,.4)' : 'rgba(150,165,190,.55)'; c.lineWidth = 1.6; c.lineCap = 'round';
      c.beginPath(); polyPath(geo.rim); c.stroke();
    }
    // 구멍
    const sp = SPOTS[i], n = done ? 7 : inf * 7, ca = Math.cos(tt.ang), sa = Math.sin(tt.ang);
    for (let k = 0; k < sp.length; k++) {
      const f = Math.max(0, Math.min(1, n - k)); if (f <= 0) break;
      const q = sp[k], u = q.u * tt.w / 2, v = q.v * tt.d / 2;
      const px = tt.cx + u * ca - v * sa, py = tt.cy + (u * sa + v * ca) * SQ, rad = q.s * (0.4 + 0.6 * f) * (done ? 1.15 : 1) * tt.pf;
      c.beginPath(); c.ellipse(px, py, rad + 1.3, (rad + 1.3) * 0.85, 0, 0, TAU); c.fillStyle = 'rgba(120,70,40,.35)'; c.fill();
      c.beginPath(); c.ellipse(px, py, rad, rad * 0.85, 0, 0, TAU); c.fillStyle = done ? '#5b3a6e' : '#6b4128'; c.fill();
    }
    // 반짝
    if (!done) { c.beginPath(); c.ellipse(tt.cx - tt.w * 0.18, tt.cy - tt.d * 0.18 * SQ, tt.w * 0.14, tt.d * 0.09, tt.ang - 0.4, 0, TAU); c.fillStyle = 'rgba(255,255,255,.95)'; c.fill(); }
    c.restore();
    c.beginPath(); polyPath(geo.top); c.lineWidth = 1.3; c.strokeStyle = done ? '#8a6640' : '#c3cddd'; c.stroke();
    // 얼굴 (앞면 쪽에 작게)
    const fx = tt.cx, fy = tt.cy + tt.d * 0.08 * tt.dir, es = Math.min(tt.w, 44) * 0.16, sc = tt.pf;
    c.lineCap = 'round'; c.strokeStyle = '#3a2a3a'; c.fillStyle = '#3a2a3a'; c.lineWidth = 1.8;
    if (done) {
      for (const s of [-1, 1]) { const ex = fx + s * es, ey = fy - 3; c.beginPath(); c.moveTo(ex - 2.6, ey - 2.6); c.lineTo(ex + 2.6, ey + 2.6); c.moveTo(ex + 2.6, ey - 2.6); c.lineTo(ex - 2.6, ey + 2.6); c.stroke(); }
      c.beginPath(); for (let k = 0; k <= 5; k++) c.lineTo(fx - 5 + k * 2, fy + 4 + (k % 2 ? 1.4 : -1.4)); c.stroke();
    } else if (inf < 0.02) {
      for (const s of [-1, 1]) { c.beginPath(); c.arc(fx + s * es, fy - 2, 2.6 * sc, Math.PI * 1.1, Math.PI * 1.9); c.stroke(); }
      c.beginPath(); c.arc(fx, fy + 2, 3.4 * sc, 0.15 * Math.PI, 0.85 * Math.PI); c.stroke();
      c.fillStyle = 'rgba(255,140,170,.5)';
      c.beginPath(); c.ellipse(fx - es - 4, fy + 2, 3, 1.9, 0, 0, TAU); c.fill();
      c.beginPath(); c.ellipse(fx + es + 4, fy + 2, 3, 1.9, 0, 0, TAU); c.fill();
    } else {
      for (const s of [-1, 1]) {
        c.beginPath(); c.arc(fx + s * es, fy - 1, 2, 0, TAU); c.fill();
        if (inf > 0.45) { c.beginPath(); c.moveTo(fx + s * (es + 3.5), fy - 6); c.lineTo(fx + s * (es - 2.5), fy - 4.5); c.stroke(); }
      }
      if (inf > 0.45 || eatingMe) { c.beginPath(); c.ellipse(fx, fy + 4.5, 2.6, 3.1, 0, 0, TAU); c.fill(); }
      else { c.beginPath(); c.moveTo(fx - 3.5, fy + 4.5); c.lineTo(fx + 3.5, fy + 4.5); c.stroke(); }
      if (inf > 0.6) {
        const sx = fx + tt.w * 0.34, sy = fy - 7 + (app.time * 12 % 6);
        c.beginPath(); c.moveTo(sx, sy - 4); c.quadraticCurveTo(sx + 3.5, sy + 1, sx, sy + 3); c.quadraticCurveTo(sx - 3.5, sy + 1, sx, sy - 4);
        c.fillStyle = '#7fd3ff'; c.fill();
      }
    }
    c.restore();
  }
  function drawTeeth(g) {
    // 뒤(가운데 쪽)부터 앞(바깥쪽)으로
    const lower = g.teeth.slice(NT).sort((a, b) => a.cy - b.cy);
    const upper = g.teeth.slice(0, NT).sort((a, b) => b.cy - a.cy);
    for (const tt of upper) drawTooth(g, tt, g.p.eating === tt.i);
    for (const tt of lower) drawTooth(g, tt, g.p.eating === tt.i);
  }

  // ---------------- 칫솔·치실 ----------------
  function bubbleSign(x, y, s, bg, fg) {
    c.save(); c.translate(x, y);
    c.beginPath(); c.arc(0, 0, 13, 0, TAU); c.fillStyle = bg; c.fill(); c.lineWidth = 2.5; c.strokeStyle = '#fff'; c.stroke();
    c.beginPath(); c.moveTo(-4, 11); c.lineTo(0, 18); c.lineTo(4, 11); c.fillStyle = bg; c.fill();
    txt(s, 0, 1, 17, fg, 'center', 900);
    c.restore();
  }
  function drawBrushWarn(g, h, L) {
    const a = 0.14 + 0.12 * Math.sin(app.time * 18);
    c.save(); mouthClip(L); c.clip();
    c.lineCap = 'round'; c.lineJoin = 'round';
    if (h.mode === 'sweep') { archPath(L, h.jaw, 0, L.archLen, 0); c.lineWidth = 86; }
    else { archPath(L, h.jaw, h.s0 - 70, h.s0 + 70, 0); c.lineWidth = 96; }
    c.strokeStyle = 'rgba(255,225,80,' + a + ')'; c.stroke();
    c.setLineDash([10, 8]); c.lineDashOffset = -app.time * 40; c.lineWidth = 3; c.strokeStyle = 'rgba(255,236,120,.9)';
    if (h.mode === 'sweep') { archPath(L, h.jaw, 0, L.archLen, 43); c.stroke(); archPath(L, h.jaw, 0, L.archLen, -43); c.stroke(); }
    else { archPath(L, h.jaw, h.s0 - 70, h.s0 + 70, 48); c.stroke(); archPath(L, h.jaw, h.s0 - 70, h.s0 + 70, -48); c.stroke(); }
    c.setLineDash([]);
    c.restore();
    const P = h.mode === 'sweep' ? archAt(L, h.jaw, h.dir > 0 ? 18 : L.archLen - 18) : archAt(L, h.jaw, h.s0);
    const k = 1 + 0.12 * Math.sin(app.time * 20);
    c.save(); c.translate(P.x + P.nx * 50, P.y + P.ny * 50); c.scale(k, k);
    c.beginPath(); c.arc(0, 0, 18, 0, TAU); c.fillStyle = '#ffd84d'; c.fill(); c.lineWidth = 3; c.strokeStyle = '#fff'; c.stroke();
    txt('!', 0, 1, 23, '#b34700', 'center', 900);
    c.restore();
  }
  function brushShape(h, L, shadow) {
    const hd = h.jaw ? 1 : -1;
    const ang = Math.atan2(h.ty, h.tx);
    // 손잡이는 입 밖(앞쪽)으로
    const ex = W / 2 + (h.x - W / 2) * 0.35, ey = h.jaw ? L.H + 220 : -220;
    c.save();
    c.lineCap = 'round';
    c.beginPath(); c.moveTo(h.x, h.y); c.lineTo(ex, ey);
    c.lineWidth = 17; c.strokeStyle = shadow ? 'rgba(40,0,30,.3)' : '#3fb0ec'; c.stroke();
    if (!shadow) { c.lineWidth = 5; c.strokeStyle = 'rgba(255,255,255,.45)'; c.beginPath(); c.moveTo(h.x - 4, h.y); c.lineTo(ex - 4, ey); c.stroke(); }
    c.translate(h.x, h.y); c.rotate(ang);
    rr(-44, -17, 88, 34, 16); c.fillStyle = shadow ? 'rgba(40,0,30,.3)' : '#4fbef5'; c.fill();
    if (!shadow) {
      c.lineWidth = 2; c.strokeStyle = '#2a8fcc'; c.stroke();
      // 솔 (위에서 본 털 뭉치)
      for (let r = -1; r <= 1; r++) for (let q = 0; q < 7; q++) {
        const bx = -33 + q * 11 + Math.sin(app.time * 30 + q + r) * 1.2, by = r * 9;
        c.beginPath(); c.arc(bx, by, 4.2, 0, TAU); c.fillStyle = (q + r) % 3 === 0 ? '#9ff3dc' : '#ffffff'; c.fill();
      }
    }
    c.restore();
  }
  function drawBrush(g, h, L) {
    const sight = g.brushSight();
    const p = g.p;
    // 칫솔의 눈이 보는 범위
    const over = Math.max(-h.s, h.s - L.archLen, 0), fade = Math.max(0, Math.min(1, 1 - over / 50));
    c.save(); c.globalAlpha = fade; mouthClip(L); c.clip();
    c.beginPath(); c.rect(0, h.jaw ? L.midY : 0, W, h.jaw ? L.H : L.midY); c.clip();
    c.beginPath(); c.arc(h.x, h.y, sight, 0, TAU);
    c.fillStyle = h.spot ? 'rgba(255,90,110,.13)' : 'rgba(255,250,200,.09)'; c.fill();
    c.setLineDash([7, 7]); c.lineDashOffset = app.time * 20; c.lineWidth = 2; c.strokeStyle = h.spot ? 'rgba(255,110,130,.8)' : 'rgba(255,245,170,.55)'; c.stroke(); c.setLineDash([]);
    c.restore();
    // 떠 있는 칫솔 그림자
    c.save(); c.globalAlpha = fade;
    const [lx, ly] = [Math.cos(g.lightA) * 20, Math.sin(g.lightA) * 20 * (h.jaw ? 1 : -1)];
    c.save(); c.translate(lx, ly); brushShape(h, L, true); c.restore();
    brushShape(h, L, false);
    // 눈 두 개
    const ang = Math.atan2(h.ty, h.tx);
    let lookX = Math.cos(app.time * 2.3) * 0.8, lookY = Math.sin(app.time * 3.1) * 0.6;
    if (h.spot) { const d = Math.hypot(p.x - h.x, p.y - h.y) || 1; lookX = (p.x - h.x) / d; lookY = (p.y - h.y) / d; }
    for (const s of [-1, 1]) {
      const ex = h.x + Math.cos(ang) * s * 13 + h.nx * 0, ey = h.y + Math.sin(ang) * s * 13 - 16;
      c.beginPath(); c.ellipse(ex, ey, 8, 9, 0, 0, TAU); c.fillStyle = '#fff'; c.fill(); c.lineWidth = 2; c.strokeStyle = '#2a8fcc'; c.stroke();
      c.beginPath(); c.arc(ex + lookX * 3.2, ey + lookY * 3.2, 3.6, 0, TAU); c.fillStyle = '#12334d'; c.fill();
      if (h.spot) { c.lineWidth = 2.4; c.strokeStyle = '#12334d'; c.beginPath(); c.moveTo(ex - 7, ey - 12 + s * 2); c.lineTo(ex + 7, ey - 12 - s * 2); c.stroke(); }
    }
    if (h.spot) bubbleSign(h.x, h.y - 48, '!', '#ff4d6d', '#fff');
    else if (h.lostAt != null && g.t - h.lostAt < 1.0) bubbleSign(h.x, h.y - 48, '?', '#7fd8ff', '#12334d');
    c.restore();
  }
  function drawFloss(g, h, L) {
    const z = g.flossZone(h);
    if (h.st === 'warn') {
      const a = 0.5 + 0.5 * Math.sin(app.time * 18);
      c.save(); c.lineCap = 'round';
      c.beginPath(); c.moveTo(z.ax, z.ay); c.lineTo(z.bx, z.by); c.lineWidth = z.r1 * 2; c.strokeStyle = 'rgba(110,255,190,' + (0.15 + a * 0.15) + ')'; c.stroke();
      c.beginPath(); c.moveTo(z.cx, z.cy); c.lineTo(z.dx, z.dy); c.lineWidth = z.r2 * 2; c.stroke();
      c.setLineDash([7, 7]); c.lineDashOffset = -app.time * 50; c.lineWidth = 3; c.strokeStyle = 'rgba(140,255,210,' + (0.5 + a * 0.5) + ')';
      c.beginPath(); c.moveTo(z.ax, z.ay); c.lineTo(z.bx, z.by); c.stroke(); c.setLineDash([]);
      c.restore();
      const k = 1 + 0.12 * Math.sin(app.time * 20);
      c.save(); c.translate(z.ax - h.g.nx * 20, z.ay - h.g.ny * 20); c.scale(k, k);
      c.beginPath(); c.arc(0, 0, 16, 0, TAU); c.fillStyle = '#6fe3b8'; c.fill(); c.lineWidth = 3; c.strokeStyle = '#fff'; c.stroke();
      txt('!', 0, 1, 21, '#0b6b4c', 'center', 900); c.restore();
      return;
    }
    const f = h.st === 'go' ? h.sweep : 1;
    const al = h.st === 'up' ? Math.max(0, 1 - h.t / 0.3) : 1;
    const ox = (z.dx - z.cx) * f, oy = (z.dy - z.cy) * f;
    c.save(); c.globalAlpha = al; c.lineCap = 'round';
    // 치실 줄
    c.lineWidth = 5; c.strokeStyle = 'rgba(20,90,70,.3)'; c.beginPath(); c.moveTo(z.ax + ox + 3, z.ay + oy + 3); c.lineTo(z.bx + ox + 3, z.by + oy + 3); c.stroke();
    c.lineWidth = 3.4; c.strokeStyle = '#7dffd2'; c.beginPath(); c.moveTo(z.ax + ox, z.ay + oy); c.lineTo(z.bx + ox, z.by + oy); c.stroke();
    c.lineWidth = 1.2; c.strokeStyle = '#fff'; c.beginPath(); c.moveTo(z.ax + ox, z.ay + oy - 1); c.lineTo(z.bx + ox, z.by + oy - 1); c.stroke();
    // 치실 손잡이 (Y 자): 줄 양끝에서 바깥(볼 쪽)으로
    const nx = -h.g.nx, ny = -h.g.ny, A = [z.ax + ox, z.ay + oy], B = [z.bx + ox, z.by + oy];
    const out = A[0] * nx + A[1] * ny > B[0] * nx + B[1] * ny ? A : B, inn = out === A ? B : A;
    c.lineWidth = 6; c.strokeStyle = '#35c48f'; c.lineJoin = 'round';
    c.beginPath(); c.moveTo(inn[0], inn[1]); c.quadraticCurveTo(inn[0] + h.g.tx * 26, inn[1] + h.g.ty * 26, out[0] + h.g.tx * 16, out[1] + h.g.ty * 16); c.lineTo(out[0], out[1]); c.stroke();
    c.lineWidth = 8; c.beginPath(); c.moveTo(out[0] + h.g.tx * 16, out[1] + h.g.ty * 16); c.lineTo(out[0] + h.g.tx * 16 + nx * 44, out[1] + h.g.ty * 16 + ny * 44); c.stroke();
    c.fillStyle = 'rgba(255,255,255,.6)'; c.beginPath(); c.arc(out[0] + h.g.tx * 16 + nx * 20, out[1] + h.g.ty * 16 + ny * 20, 2, 0, TAU); c.fill();
    c.restore();
  }

  // ---------------- 테크 아이콘 ----------------
  function techIcon(k, x, y, s, col) {
    if (['eat1', 'spread1', 'sticky', 'speed'].includes(k)) return upIcon(k === 'eat1' ? 'eat' : k === 'spread1' ? 'spread' : k, x, y, s);
    c.save(); c.translate(x, y); c.scale(s / 24, s / 24); c.lineCap = 'round'; c.lineJoin = 'round';
    if (k === 'eat2') { c.restore(); upIcon('eat', x - s * 0.12, y, s); star(x + s * 0.34, y - s * 0.3, s * 0.2); c.fillStyle = '#ffcf3f'; c.fill(); return; }
    if (k === 'spread2') { c.restore(); upIcon('spread', x, y, s * 1.1); star(x + s * 0.36, y - s * 0.32, s * 0.2); c.fillStyle = '#ffcf3f'; c.fill(); return; }
    if (k === 'shade1') {
      c.beginPath(); c.arc(0, 0, 11, 0, TAU); c.fillStyle = '#3d3b8e'; c.fill();
      c.beginPath(); c.arc(5, -3, 9, 0, TAU); c.fillStyle = col || '#fff'; c.fill();
      star(-4, 3, 2.5); c.fillStyle = '#ffe98a'; c.fill();
    } else if (k === 'blur') {
      c.beginPath(); c.moveTo(-11, 0); c.quadraticCurveTo(0, -11, 11, 0); c.quadraticCurveTo(0, 11, -11, 0); c.fillStyle = '#fff'; c.fill(); c.lineWidth = 2; c.strokeStyle = '#3d3b8e'; c.stroke();
      c.beginPath(); c.arc(0, 0, 4, 0, TAU); c.fillStyle = '#3d3b8e'; c.fill();
      c.lineWidth = 2; c.strokeStyle = 'rgba(61,59,142,.55)';
      for (const yy of [-8, 8]) { c.beginPath(); c.moveTo(-10, yy); c.quadraticCurveTo(-5, yy - 3, 0, yy); c.quadraticCurveTo(5, yy + 3, 10, yy); c.stroke(); }
    } else if (k === 'ghost') {
      c.beginPath(); c.moveTo(-9, 10); c.lineTo(-9, -2); c.arc(0, -2, 9, Math.PI, 0); c.lineTo(9, 10);
      for (let q = 0; q < 3; q++) { c.lineTo(9 - q * 6 - 3, 6); c.lineTo(9 - q * 6 - 6, 10); }
      c.closePath(); c.fillStyle = 'rgba(255,255,255,.85)'; c.fill(); c.lineWidth = 2; c.strokeStyle = '#6a5acd'; c.stroke();
      c.fillStyle = '#3d3b8e'; c.beginPath(); c.arc(-3.5, -2, 1.8, 0, TAU); c.arc(3.5, -2, 1.8, 0, TAU); c.fill();
    } else if (k === 'quiet') {
      c.fillStyle = '#2f9a6a';
      c.beginPath(); c.ellipse(-4, 3, 4, 6.5, -0.2, 0, TAU); c.fill(); c.beginPath(); c.ellipse(5, -4, 4, 6.5, 0.2, 0, TAU); c.fill();
      for (const [a, b] of [[-6, -5], [-2, -6], [3, -12], [7, -13]]) { c.beginPath(); c.arc(a, b, 1.6, 0, TAU); c.fill(); }
    } else if (k === 'numb') {
      rr(-10, -10, 20, 20, 5); c.fillStyle = '#bfefff'; c.fill(); c.lineWidth = 2; c.strokeStyle = '#4bb4dc'; c.stroke();
      c.fillStyle = 'rgba(255,255,255,.9)'; rr(-7, -7, 6, 10, 3); c.fill();
      c.strokeStyle = '#4bb4dc'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(3, 2); c.lineTo(6, 6); c.stroke();
    } else if (k === 'calm') {
      c.beginPath(); c.moveTo(-10, 9); c.quadraticCurveTo(-10, -10, 10, -10); c.quadraticCurveTo(10, 9, -10, 9); c.fillStyle = '#6fd18f'; c.fill(); c.lineWidth = 1.8; c.strokeStyle = '#2f9a45'; c.stroke();
      c.beginPath(); c.moveTo(-8, 7); c.quadraticCurveTo(0, 0, 7, -7); c.stroke();
    }
    c.restore();
  }

  // ---------------- 위 (하트·진행·사탕·아야 지수) ----------------
  function drawHUD(g, L) {
    for (let i = 0; i < g.maxHearts; i++) {
      const on = i < g.hearts;
      const bob = on ? Math.sin(app.time * 3 + i) * 1.2 : 0;
      heart(24 + i * 27, 22 + bob, 23, on ? '#ff4d7a' : 'rgba(255,255,255,.7)', on ? '#c2185b' : '#f2a5bb');
    }
    const n = g.doneCount(), N = g.teeth.length;
    const bx = 116, bw = 138, by = 13;
    rr(bx, by, bw, 18, 9); c.fillStyle = 'rgba(255,255,255,.85)'; c.fill();
    const f = n / N;
    if (f > 0) { rr(bx + 2, by + 2, Math.max(14, (bw - 4) * f), 14, 7); const pg = c.createLinearGradient(bx, 0, bx + bw, 0); pg.addColorStop(0, '#b98bff'); pg.addColorStop(1, '#7440e0'); c.fillStyle = pg; c.fill(); }
    txt(n + ' / ' + N + '  ·  ' + fmtTime(g.t), bx + bw / 2, by + 9.5, 11, '#6a3fd0', 'center', 900, '#fff', 3);
    candyIcon(282, 22, 20, Math.sin(app.time * 2) * 0.15);
    txt(String(g.sugar), 298, 23, 19, '#d63e6c', 'left', 900, '#fff', 5);
    const px = W - 30, py = 22;
    app.btns.push({ id: 'pause', x: px - 22, y: py - 20, w: 44, h: 44, action: () => { app.screen = 'pause'; S.play('tap'); } });
    c.beginPath(); c.arc(px, py + 2, 16, 0, TAU); c.fillStyle = '#e8a6bd'; c.fill();
    c.beginPath(); c.arc(px, py, 16, 0, TAU); c.fillStyle = '#fff'; c.fill();
    c.fillStyle = '#d6507e'; rr(px - 6, py - 7, 4.5, 14, 2); c.fill(); rr(px + 1.5, py - 7, 4.5, 14, 2); c.fill();
    drawPain(g, 50, 44, W - 64, 16);
  }
  function drawPain(g, x, y, w, h) {
    const pv = g.pain / 100, hot = g.pain >= 75;
    const sh = hot ? Math.sin(app.time * 40) * 1.5 : 0;
    c.save(); c.translate(sh, 0);
    // 아픈 이 아이콘
    c.save(); c.translate(x - 22, y + h / 2);
    c.beginPath(); c.moveTo(-9, -8); c.quadraticCurveTo(-4, -11, 0, -8); c.quadraticCurveTo(4, -11, 9, -8); c.quadraticCurveTo(10, 0, 6, 9); c.lineTo(3, 3); c.lineTo(-3, 3); c.lineTo(-6, 9); c.quadraticCurveTo(-10, 0, -9, -8); c.closePath();
    c.fillStyle = hot ? '#ffd6de' : '#fff'; c.fill(); c.lineWidth = 1.8; c.strokeStyle = hot ? '#e0294f' : '#e07a98'; c.stroke();
    c.strokeStyle = '#e0294f'; c.lineWidth = 1.6;
    const k = 1 + (hot ? Math.sin(app.time * 14) * 0.2 : 0);
    for (const s of [-1, 1]) { c.beginPath(); c.moveTo(s * 11 * k, -9); c.lineTo(s * 15 * k, -13); c.moveTo(s * 12 * k, -3); c.lineTo(s * 17 * k, -3); c.stroke(); }
    c.restore();
    rr(x, y, w, h, h / 2); c.fillStyle = 'rgba(255,255,255,.9)'; c.fill();
    if (pv > 0) {
      rr(x + 2, y + 2, Math.max(h - 4, (w - 4) * pv), h - 4, (h - 4) / 2);
      const gg = c.createLinearGradient(x, 0, x + w, 0);
      gg.addColorStop(0, '#7fdc8a'); gg.addColorStop(0.5, '#ffd24d'); gg.addColorStop(0.8, '#ff8a3d'); gg.addColorStop(1, '#ff2d55');
      c.fillStyle = gg; c.fill();
    }
    for (const m of [0.25, 0.5, 0.75]) { c.fillStyle = 'rgba(160,100,120,.35)'; c.fillRect(x + w * m - 0.5, y + 3, 1, h - 6); }
    txt(t('pain') + ' ' + Math.round(g.pain), x + w / 2, y + h / 2 + 0.5, 11, pv > 0.45 ? '#fff' : '#b0406a', 'center', 900, pv > 0.45 ? 'rgba(160,30,60,.7)' : null, 3);
    c.restore();
  }
  function fmtTime(s) { s = Math.floor(s); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); }

  function buyableCount(g) { let n = 0; for (const x of TECH) if (g.techState(x.k) === 'buy') n++; return n; }
  function drawBar(g, L) {
    const y = L.barY + 8;
    // 진화 단추
    const nb = buyableCount(g);
    const bw = W - 128;
    const pressed = app.press && app.press.id === 'techBtn';
    c.save(); c.translate(12 + bw / 2, y + 40); if (pressed) c.scale(0.96, 0.96);
    if (nb) { const gl = 0.5 + 0.5 * Math.sin(app.time * 5); rr(-bw / 2 - 3, -43, bw + 6, 86, 22); c.fillStyle = 'rgba(255,215,90,' + (0.4 + gl * 0.5) + ')'; c.fill(); }
    rr(-bw / 2, -36, bw, 76, 20); c.fillStyle = '#e9b9cc'; c.fill();
    rr(-bw / 2, -40, bw, 76, 20); c.fillStyle = '#fff'; c.fill();
    // 작은 나무 그림
    c.lineWidth = 2.5; c.strokeStyle = '#d7c3ea';
    c.beginPath(); c.moveTo(-bw / 2 + 36, 14); c.lineTo(-bw / 2 + 36, -4); c.moveTo(-bw / 2 + 22, -16); c.lineTo(-bw / 2 + 36, -4); c.lineTo(-bw / 2 + 50, -16); c.stroke();
    const cols = ['#a46cff', '#3d3b8e', '#2fb36a'];
    [[-bw / 2 + 22, -18], [-bw / 2 + 50, -18], [-bw / 2 + 36, 16]].forEach(([a, b], i) => { c.beginPath(); c.arc(a, b, 7, 0, TAU); c.fillStyle = cols[i]; c.fill(); c.lineWidth = 2; c.strokeStyle = '#fff'; c.stroke(); });
    txt(t('tech'), -bw / 2 + 70, -12, 21, '#5b2a86', 'left', 900);
    candyIcon(-bw / 2 + 80, 14, 16);
    txt(String(g.sugar), -bw / 2 + 93, 15, 15, '#d63e6c', 'left', 900);
    if (nb) { txt(t('canBuy'), bw / 2 - 12, 15, 12, '#e07a00', 'right', 900); c.beginPath(); c.arc(bw / 2 - 14, -22, 11, 0, TAU); c.fillStyle = '#ff4d7a'; c.fill(); txt(String(nb), bw / 2 - 14, -21.5, 13, '#fff', 'center', 900); }
    c.restore();
    app.btns.push({ id: 'techBtn', x: 12, y, w: bw, h: 80, action: openTech });
    // 뒤집기 단추
    const fx = W - 58, fy = y + 38, R = 38;
    const ready = g.canFlip(), cd = g.p.flipCd / g.flipCdMax();
    const fp = app.press && app.press.id === 'flipBtn';
    c.save(); c.translate(fx, fy); if (fp) c.scale(0.94, 0.94);
    c.beginPath(); c.arc(0, 4, R, 0, TAU); c.fillStyle = '#5b34c9'; c.fill();
    c.beginPath(); c.arc(0, 0, R, 0, TAU); c.fillStyle = ready ? '#8a5cf6' : '#b7a6dc'; c.fill();
    if (!ready && cd > 0) { c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, R, -Math.PI / 2, -Math.PI / 2 + TAU * cd); c.closePath(); c.fillStyle = 'rgba(70,40,140,.35)'; c.fill(); }
    c.fillStyle = '#fff';
    const bob = ready ? Math.sin(app.time * 4) * 2 : 0;
    c.beginPath(); c.moveTo(-9, -6 - bob); c.lineTo(-9, -24 - bob + 6); c.lineTo(-17, -12 - bob); c.moveTo(-9, -24 - bob + 6); c.lineTo(-1, -12 - bob); c.lineWidth = 4.5; c.strokeStyle = '#fff'; c.lineCap = 'round'; c.lineJoin = 'round'; c.stroke();
    c.beginPath(); c.moveTo(9, 6 + bob - 12); c.lineTo(9, 18 + bob - 6); c.moveTo(1, 6 + bob); c.lineTo(9, 18 + bob - 6); c.lineTo(17, 6 + bob); c.stroke();
    txt(t('flip'), 0, 26, 12, '#fff', 'center', 900);
    c.restore();
    app.btns.push({ id: 'flipBtn', x: fx - R - 6, y: fy - R - 6, w: R * 2 + 12, h: R * 2 + 12, action: () => tryFlip() });
  }
  function tryFlip() { const g = app.game; if (g && app.screen === 'play') { if (!g.doFlip()) S.play('deny'); } }
  function openTech() { if (app.screen !== 'play') return; app.screen = 'tech'; app.techSel = null; S.play('tap'); }

  // ---------------- 게임 화면 ----------------
  function drawGermP(g) {
    const p = g.p;
    const sp = Math.hypot(p.vx, p.vy);
    const hurt = p.inv > 0;
    if (hurt && Math.floor(app.time * 14) % 2 && p.inv < 1.2) return;
    let rot = p.jaw === 0 ? Math.PI : 0, x = p.x, y = p.y, r = p.r, lift = 0;
    if (p.flip) {
      const k = Math.min(1, p.flip.t / p.flip.dur);
      c.save(); c.setLineDash([6, 8]); c.lineDashOffset = -app.time * 60; c.lineWidth = 3; c.strokeStyle = 'rgba(215,180,255,.8)';
      c.beginPath(); c.moveTo(p.flip.x0, p.flip.y0); c.lineTo(p.flip.x1, p.flip.y1); c.stroke(); c.setLineDash([]);
      c.beginPath(); c.ellipse(p.flip.x1, p.flip.y1, 20 + 4 * Math.sin(app.time * 12), 9, 0, 0, TAU); c.lineWidth = 3; c.strokeStyle = 'rgba(215,180,255,.9)'; c.stroke();
      c.restore();
      rot = (p.flip.to === 0 ? 0 : Math.PI) + (p.flip.to === 0 ? 1 : -1) * Math.PI * k;
      lift = Math.sin(k * Math.PI);
      r = p.r * (1 + 0.35 * lift);
      // 날아가는 꼬리
      for (let q = 1; q <= 4; q++) { c.beginPath(); c.arc(x, y - (p.flip.y1 - p.flip.y0) * 0.03 * q, r * (1 - q * 0.18), 0, TAU); c.fillStyle = 'rgba(190,150,255,' + (0.18 - q * 0.035) + ')'; c.fill(); }
    }
    const ghost = g.has('ghost');
    const alpha = p.hidden ? (ghost ? 0.32 : 0.45) : 1;
    const bobY = p.flip ? 0 : Math.sin(app.time * 5) * 1.5 * (p.jaw ? 1 : -1);
    drawGerm(x, y + bobY, r, {
      rot, alpha,
      squash: p.flip ? 0 : Math.min(0.12, sp / 1800) * (Math.abs(p.vx) > Math.abs(p.vy) ? 1 : -1) + (p.eating >= 0 ? Math.sin(app.time * (p.nibble ? 12 : 22)) * 0.05 : 0),
      lookX: Math.max(-1, Math.min(1, p.vx / 150)) * (p.jaw ? 1 : -1), lookY: Math.max(-1, Math.min(1, p.vy / 150)) * (p.jaw ? 1 : -1),
      eat: p.eating >= 0, hurt: hurt && p.inv > 1.0, dizzy: hurt && p.inv > 1.0,
    });
    if (hurt && p.inv > 1.0) for (let k = 0; k < 3; k++) { const a = app.time * 6 + k * TAU / 3; star(x + Math.cos(a) * 20, y - 22 * (p.jaw ? 1 : -1) + Math.sin(a) * 5, 5); c.fillStyle = '#ffe066'; c.fill(); }
    // 숨기 표시: 그림자 속이면 달 모양 게이지
    if (!p.flip && (p.shade || p.hide < g.hideMax() - 0.01)) {
      const f = p.hide / g.hideMax();
      const gx = x + 20, gy = y - 20 * (p.jaw ? 1 : -1);
      c.beginPath(); c.arc(gx, gy, 9, 0, TAU); c.fillStyle = 'rgba(30,20,70,.55)'; c.fill();
      c.beginPath(); c.moveTo(gx, gy); c.arc(gx, gy, 7.5, -Math.PI / 2, -Math.PI / 2 + TAU * f); c.closePath();
      c.fillStyle = p.exposed ? '#ff6b81' : '#b9b5ff'; c.fill();
      if (p.hidden) txt(t('hidden'), x, y + 30 * (p.jaw ? 1 : -1), 12, '#fff', 'center', 900, 'rgba(40,20,80,.7)', 4);
    }
    if (p.exposed && p.shade && Math.floor(app.time * 6) % 2) bubbleSign(x, y - 34 * (p.jaw ? 1 : -1), '!', '#ff4d6d', '#fff');
  }

  function drawPlay(dt) {
    const g = app.game, L = g.L;
    if (!app.geo || app.geoG !== g) { app.geo = buildGeo(g.L); app.geoG = g; }
    drawBackdrop(L);
    c.save();
    if (app.shake > 0) c.translate((Math.random() - 0.5) * app.shake, (Math.random() - 0.5) * app.shake);
    drawMouth(L, g);
    c.save(); mouthClip(L); c.clip();
    // 사탕 (바닥에 붙어 있다)
    for (const cd of g.candies) {
      if (cd.life < 2 && Math.floor(app.time * 8) % 2) continue;
      const pop = Math.min(1, cd.age * 4);
      c.save(); c.translate(cd.x, cd.y + Math.sin(app.time * 3 + cd.x) * 3); c.scale(pop, pop);
      c.beginPath(); c.arc(0, 0, 20, 0, TAU); c.fillStyle = 'rgba(255,240,150,.25)'; c.fill();
      if (cd.kind === 'heart') heart(0, 0, 28, '#ff4d7a', '#c2185b');
      else candyIcon(0, 0, 28, Math.sin(app.time * 2 + cd.y) * 0.3);
      c.restore();
    }
    drawTeeth(g);
    for (const h of g.hz) if (h.st === 'warn') (h.kind === 'brush' ? drawBrushWarn : drawFloss)(g, h, L);
    // 먹는 중 표시 (고리)
    if (g.p.eating >= 0) {
      const tt = g.teeth[g.p.eating];
      const ry = tt.cy - (tt.d * 0.5 + 12) * tt.dir;
      c.beginPath(); c.arc(tt.cx, ry, 8, 0, TAU); c.fillStyle = 'rgba(40,0,40,.5)'; c.fill();
      c.beginPath(); c.moveTo(tt.cx, ry); c.arc(tt.cx, ry, 7, -Math.PI / 2, -Math.PI / 2 + TAU * tt.inf); c.closePath(); c.fillStyle = g.p.nibble ? '#9e8cd8' : '#c69cff'; c.fill();
    }
    for (const h of g.hz) if (h.st !== 'warn' && h.kind === 'floss') drawFloss(g, h, L);
    drawGermP(g);
    // 처음 몇 초 손 안내
    if (app.hintT > 0 && g.t < 6) {
      const p = g.p, a = Math.min(1, app.hintT);
      c.globalAlpha = a;
      const hx = p.x + 40 + Math.sin(app.time * 3) * 26, hy = p.y - 70;
      c.beginPath(); c.arc(hx, hy, 14, 0, TAU); c.fillStyle = 'rgba(255,255,255,.75)'; c.fill();
      c.beginPath(); c.arc(hx, hy, 7, 0, TAU); c.fillStyle = '#ff6f91'; c.fill();
      txt(t('hint'), p.x, p.y - 100, 15, '#fff', 'center', 900, '#b0406a', 5);
      c.globalAlpha = 1;
    }
    for (const h of g.hz) if (h.st !== 'warn' && h.kind === 'brush') {
      drawBrush(g, h, L);
      if (Math.random() < 0.5) app.parts.push({ x: h.x + (Math.random() - 0.5) * 70, y: h.y + (Math.random() - 0.5) * 30, vx: (Math.random() - 0.5) * 40, vy: -10, life: 0, max: 0.8, kind: 'bubble', size: 2 + Math.random() * 3, rot: 0 });
    }
    c.restore();
    drawParts();
    c.restore();
    if (app.flash > 0) { c.fillStyle = 'rgba(255,90,140,' + app.flash * 0.35 + ')'; c.fillRect(0, 0, W, L.H); }
    if (g.pain >= 70) { const a = (g.pain - 70) / 30 * (0.32 + 0.12 * Math.sin(app.time * 8)); const rg = c.createRadialGradient(W / 2, L.H / 2, L.H * 0.3, W / 2, L.H / 2, L.H * 0.7); rg.addColorStop(0, 'rgba(255,40,80,0)'); rg.addColorStop(1, 'rgba(255,40,80,' + a + ')'); c.fillStyle = rg; c.fillRect(0, 0, W, L.H); }
    drawHUD(g, L);
    drawBar(g, L);
  }

  // ---------------- 사건 처리 ----------------
  function gate(name, gap) { const now = app.time; if ((app.sndGate[name] || 0) > now) return false; app.sndGate[name] = now + gap; return true; }
  function handleEvents(g) {
    for (const e of g.ev) {
      switch (e.type) {
        case 'chomp':
          if (!e.nibble || gate('nib', 0.4)) S.play('chomp');
          burst(g.p.x + g.p.face * 6, g.p.y + 6 * (g.p.jaw ? 1 : -1), e.nibble ? 1 : 3, 'crumb', '#fff', 70);
          app.toothShake[e.i] = 0.12;
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
        case 'upgrade': S.play('upgrade'); if (e.pain) floatText(W / 2, 70, t('pain') + (e.pain > 0 ? ' +' : ' ') + e.pain, e.pain > 0 ? '#e0294f' : '#2f9a45'); break;
        case 'heal': S.play('candy'); burst(e.x, e.y, 14, 'star', '#ff4d7a', 110); floatText(e.x, e.y - 12, '+1 ♥', '#ff4d7a'); break;
        case 'flip': S.play('flip'); S.vibrate(15); burst(g.p.x, g.p.y, 10, 'spark', '#d7b4ff', 90); break;
        case 'land': S.play('land'); burst(e.x, e.y, 8, 'star', '#d7b4ff', 80); break;
        case 'hide': if (gate('hide', 0.5)) S.play('hide'); break;
        case 'exposed': S.play('exposed'); floatText(e.x, e.y - 30, t('found'), '#e0294f'); break;
        case 'spot': if (gate('spot', 0.4)) S.play('spot'); break;
        case 'lost': if (e.hidden) S.play('lost'); break;
        case 'sneak': S.play('sneak'); floatText(e.x, e.y - 34, t('phew'), '#6a5acd'); break;
        case 'painWarn': S.play('ouch'); S.vibrate([40, 40, 40]); floatText(W / 2, 90, t('painHigh'), '#e0294f'); break;
        case 'dentist': S.play('drill'); break;
        case 'win': app.endTimer = 1.1; S.play('win'); S.vibrate([30, 40, 30, 40, 80]); finish(true); break;
        case 'lose': app.endTimer = 1.1; if (g.reason !== 'dentist') S.play('lose'); finish(false); break;
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
    app.geo = null;
    app.parts = []; app.screen = 'intro'; app.hintT = 3; app.shake = 0; app.flash = 0; app.acc = { x: 0, y: 0 };
    resize();
  }
  function beginPlay() { app.screen = 'play'; S.play('tap'); S.startMusic(app.game.stage === 2); }

  // ---------------- 첫 화면 ----------------
  function drawTitle() {
    const L = app.bgL, H = app.H;
    drawBackdrop(L);
    const cx = W / 2, cy = H * 0.38;
    c.save(); c.translate(cx, cy + Math.sin(app.time * 1.6) * 4);
    // 그림자 (비스듬한 빛)
    c.save(); c.translate(34, -18); c.globalAlpha = 0.22;
    c.beginPath(); c.moveTo(-78, -60); c.bezierCurveTo(-80, -110, -20, -112, 0, -88); c.bezierCurveTo(20, -112, 80, -110, 78, -60);
    c.bezierCurveTo(76, -10, 62, 30, 52, 90); c.quadraticCurveTo(44, 106, 32, 92); c.lineTo(14, 30); c.quadraticCurveTo(0, 20, -14, 30);
    c.lineTo(-32, 92); c.quadraticCurveTo(-44, 106, -52, 90); c.bezierCurveTo(-62, 30, -76, -10, -78, -60); c.closePath();
    c.fillStyle = '#5a1333'; c.fill(); c.restore();
    c.beginPath();
    c.moveTo(-78, -60); c.bezierCurveTo(-80, -110, -20, -112, 0, -88); c.bezierCurveTo(20, -112, 80, -110, 78, -60);
    c.bezierCurveTo(76, -10, 62, 30, 52, 90); c.quadraticCurveTo(44, 106, 32, 92); c.lineTo(14, 30); c.quadraticCurveTo(0, 20, -14, 30);
    c.lineTo(-32, 92); c.quadraticCurveTo(-44, 106, -52, 90); c.bezierCurveTo(-62, 30, -76, -10, -78, -60); c.closePath();
    const tg = c.createLinearGradient(-80, 0, 80, 0); tg.addColorStop(0, '#fff'); tg.addColorStop(1, '#e4eaf4');
    c.fillStyle = tg; c.fill(); c.lineWidth = 4; c.strokeStyle = '#c9b3e6'; c.stroke();
    c.fillStyle = 'rgba(255,255,255,.95)'; rr(-58, -78, 16, 70, 8); c.fill();
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
    // 그림자 속에 반쯤 숨은 충치콩 + 두리번거리는 칫솔
    const peek = (Math.sin(app.time * 1.4) + 1) / 2;
    drawGerm(cx + 100, cy - 18 + Math.sin(app.time * 1.6) * 4, 24, { alpha: 0.4 + 0.6 * peek, eat: peek > 0.7, lookX: -0.8, lookY: 0.2 });
    const jy = Math.abs(Math.sin(app.time * 3.2)) * 20;
    drawGerm(cx - 78, cy + 76 - jy, 22, { rot: Math.PI, lookX: 0.6, squash: jy < 4 ? 0.1 : -0.04 });
    // 제목
    const ty = H * 0.1;
    c.save(); c.translate(W / 2, ty); c.rotate(-0.03);
    txt(t('title'), 0, 4, save.lang === 'ko' ? 52 : 44, '#5b2a86', 'center', 900, '#5b2a86', 14);
    txt(t('title'), 0, 0, save.lang === 'ko' ? 52 : 44, '#fff', 'center', 900, '#a46cff', 10);
    c.restore();
    txt(t('sub'), W / 2, ty + 48, 16, '#b0406a', 'center', 800);
    const by = H * 0.64;
    const b1 = save.best[1] ? t('best') + ' ' + fmtTime(save.best[1]) : t('stn1');
    button('s1', 40, by, W - 80, 64, t('st1') + ' · ' + t('play'), { bg: '#ff6f91', dark: '#c73e67', size: 22 }, () => startStage(1), b1);
    const locked = save.unlocked < 2;
    const b2 = locked ? t('locked') : (save.best[2] ? t('best') + ' ' + fmtTime(save.best[2]) : t('stn2'));
    button('s2', 40, by + 80, W - 80, 64, t('st2') + (locked ? '' : ' · ' + t('play')),
      locked ? { bg: '#d9c7d0', dark: '#b5a0aa', size: 22, fg: '#fff' } : { bg: '#8a5cf6', dark: '#5b34c9', size: 22 },
      () => { if (locked) { S.unlock(); S.play('deny'); } else startStage(2); }, b2);
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
  function card(y, h, x, w) {
    x = x == null ? 24 : x; w = w == null ? W - 48 : w;
    rr(x, y + 6, w, h, 28); c.fillStyle = 'rgba(120,30,80,.35)'; c.fill();
    rr(x, y, w, h, 28); c.fillStyle = '#fff8fb'; c.fill();
    c.lineWidth = 4; c.strokeStyle = '#ffc2d4'; c.stroke();
  }
  function drawIntro() {
    const g = app.game, H = app.H;
    dim();
    const tips = [['drag', t('tipDrag')], ['eat', t('tipEat')], ['shade', t('tipShade')], ['flip', t('tipFlip')]];
    tips.push(g.stage === 2 ? ['floss', t('tipFloss')] : ['brush', t('tipBrush')]);
    tips.push(['tech', t('tipTech')]);
    const ch = 150 + tips.length * 60, y = Math.max(8, (H - ch) / 2);
    card(y, ch, 16, W - 32);
    txt(g.stage === 1 ? t('st1') : t('st2'), W / 2, y + 32, 16, '#b0406a', 'center', 800);
    txt(g.stage === 1 ? t('stn1') : t('stn2'), W / 2, y + 62, 26, '#5b2a86', 'center', 900);
    tips.forEach(([k, s], i) => {
      const ty = y + 108 + i * 60;
      c.beginPath(); c.arc(56, ty, 22, 0, TAU); c.fillStyle = '#ffe3ec'; c.fill();
      if (k === 'drag') { c.beginPath(); c.arc(56, ty, 9, 0, TAU); c.fillStyle = '#ff6f91'; c.fill(); c.lineWidth = 2; c.strokeStyle = '#ff6f91'; c.beginPath(); c.moveTo(42, ty + 12); c.lineTo(70, ty + 12); c.stroke(); }
      else if (k === 'eat') drawGerm(56, ty, 14, { eat: true });
      else if (k === 'shade') { c.beginPath(); c.arc(56, ty, 22, 0, TAU); c.fillStyle = 'rgba(48,0,34,.35)'; c.fill(); drawGerm(56, ty, 13, { alpha: 0.45 }); }
      else if (k === 'flip') { drawGerm(48, ty - 6, 9, { rot: Math.PI }); drawGerm(64, ty + 8, 9, {}); }
      else if (k === 'brush') { c.fillStyle = '#4fbef5'; rr(38, ty - 2, 36, 12, 6); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.ellipse(49, ty - 8, 5, 6, 0, 0, TAU); c.ellipse(63, ty - 8, 5, 6, 0, 0, TAU); c.fill(); c.fillStyle = '#12334d'; c.beginPath(); c.arc(50, ty - 7, 2.4, 0, TAU); c.arc(64, ty - 7, 2.4, 0, TAU); c.fill(); }
      else if (k === 'floss') { c.lineWidth = 3; c.strokeStyle = '#35c48f'; c.beginPath(); c.moveTo(40, ty); c.lineTo(72, ty); c.stroke(); c.lineWidth = 5; c.beginPath(); c.moveTo(40, ty); c.lineTo(40, ty + 14); c.moveTo(72, ty); c.lineTo(72, ty + 14); c.stroke(); }
      else { c.lineWidth = 2.5; c.strokeStyle = '#ff2d55'; rr(38, ty + 6, 36, 8, 4); c.fillStyle = '#ffd24d'; c.fill(); techIcon('numb', 56, ty - 6, 18); }
      const lines = wrap(s, W - 124, 14, 700);
      lines.forEach((ln, j) => txt(ln, 88, ty + (j - (lines.length - 1) / 2) * 18, 14, '#4a2a5a', 'left', 700));
    });
    const pulse = 1 + Math.sin(app.time * 5) * 0.04;
    c.save(); c.translate(W / 2, y + ch - 30); c.scale(pulse, pulse);
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

  // ---------------- 진화 나무 ----------------
  const BRC = [{ bg: '#a46cff', dk: '#6a3fd0', lt: '#efe4ff' }, { bg: '#4b48b0', dk: '#2e2c7a', lt: '#e4e4fb' }, { bg: '#2fb36a', dk: '#1d7d48', lt: '#dcf6e7' }];
  function drawTech() {
    const g = app.game, H = app.H;
    dim();
    const y0 = 14, ch = H - 28;
    card(y0, ch, 10, W - 20);
    txt(t('techTitle'), W / 2, y0 + 30, 22, '#5b2a86', 'center', 900);
    candyIcon(W - 70, y0 + 30, 20); txt(String(g.sugar), W - 56, y0 + 31, 18, '#d63e6c', 'left', 900);
    drawPain(g, 52, y0 + 52, W - 84, 16);
    const colX = [W / 2 - 118, W / 2, W / 2 + 118];
    const top = y0 + 116, gapY = Math.min(104, (ch - 360) / 3.3);
    for (let b = 0; b < 3; b++) {
      const x = colX[b];
      rr(x - 54, top - 34, 108, gapY * 3 + 118, 22); c.fillStyle = BRC[b].lt; c.fill();
      txt(t('br' + b), x, top - 14, 14, BRC[b].dk, 'center', 900);
      c.lineWidth = 4; c.strokeStyle = 'rgba(0,0,0,.08)';
      c.beginPath(); c.moveTo(x, top + 22); c.lineTo(x, top + 22 + gapY * 3); c.stroke();
    }
    for (const n of TECH) {
      const x = colX[n.br], y = top + 22 + n.tier * gapY;
      const st = g.techState(n.k), col = BRC[n.br];
      const sel = app.techSel === n.k;
      c.save(); c.translate(x, y);
      if (st === 'buy') { const gl = 0.5 + 0.5 * Math.sin(app.time * 5); c.beginPath(); c.arc(0, 0, 29, 0, TAU); c.fillStyle = 'rgba(255,215,90,' + (0.45 + 0.45 * gl) + ')'; c.fill(); }
      if (sel) { c.beginPath(); c.arc(0, 0, 31, 0, TAU); c.lineWidth = 3; c.strokeStyle = '#ff4d7a'; c.stroke(); }
      c.beginPath(); c.arc(0, 3, 23, 0, TAU); c.fillStyle = st === 'own' ? col.dk : '#d9ccd6'; c.fill();
      c.beginPath(); c.arc(0, 0, 23, 0, TAU); c.fillStyle = st === 'own' ? col.bg : st === 'locked' ? '#efe8ee' : '#fff'; c.fill();
      if (st === 'own') { c.beginPath(); c.arc(0, 0, 17, 0, TAU); c.fillStyle = '#fff'; c.fill(); }
      c.globalAlpha = st === 'locked' ? 0.35 : st === 'poor' ? 0.6 : 1;
      techIcon(n.k, 0, -1, st === 'own' ? 20 : 24, '#fff');
      c.globalAlpha = 1;
      if (st === 'own') { c.beginPath(); c.arc(16, -16, 8, 0, TAU); c.fillStyle = '#fff'; c.fill(); c.lineWidth = 2.6; c.strokeStyle = '#2fb36a'; c.beginPath(); c.moveTo(12, -16); c.lineTo(15, -12.5); c.lineTo(20, -19); c.stroke(); }
      c.restore();
      txt(t('n_' + n.k), x, y + 40, 13, st === 'locked' ? '#b9a6b3' : '#4a2a5a', 'center', 900);
      if (st !== 'own') {
        candyIcon(x - 22, y + 58, 11); txt(String(n.cost), x - 14, y + 58.5, 11, '#d63e6c', 'left', 900);
      }
      if (n.pain) txt((n.pain > 0 ? '+' : '') + n.pain, x + (st === 'own' ? 0 : 20), y + 58.5, 11, n.pain > 0 ? '#e0294f' : '#1d9d57', 'center', 900);
      app.btns.push({ id: 'node_' + n.k, x: x - 40, y: y - 30, w: 80, h: 84, action: () => { app.techSel = n.k; S.play('tap'); } });
    }
    // 아래 설명
    const dy = top + gapY * 3 + 100;
    rr(26, dy, W - 52, 118, 18); c.fillStyle = '#fff'; c.fill(); c.lineWidth = 2; c.strokeStyle = '#ffd3e0'; c.stroke();
    if (app.techSel) {
      const n = TECH.find(x => x.k === app.techSel), st = g.techState(n.k);
      techIcon(n.k, 54, dy + 30, 26, BRC[n.br].bg);
      txt(t('n_' + n.k), 76, dy + 24, 17, BRC[n.br].dk, 'left', 900);
      if (n.pain) txt(t('pain') + ' ' + (n.pain > 0 ? '+' : '') + n.pain, W - 40, dy + 24, 13, n.pain > 0 ? '#e0294f' : '#1d9d57', 'right', 900);
      const lines = wrap(t('d_' + n.k), W - 90, 13, 700);
      lines.slice(0, 2).forEach((ln, j) => txt(ln, 40, dy + 50 + j * 17, 13, '#5a3a66', 'left', 700));
      if (st === 'buy') button('buy', W / 2 - 70, dy + 68, 140, 40, t('buy') + '  ' + n.cost, { bg: '#ff6f91', dark: '#c73e67', size: 16 }, () => { if (g.buy(n.k)) { burst(W / 2, dy, 16, 'star', '#ffd24d', 120); S.vibrate(20); } });
      else txt(st === 'own' ? t('own') : st === 'locked' ? t('lockedNode') : t('needSugar'), W / 2, dy + 88, 13, '#b08a99', 'center', 800);
    } else txt(t('tapNode'), W / 2, dy + 52, 14, '#b08a99', 'center', 800);
    button('closeTech', W / 2 - 90, y0 + ch - 60, 180, 46, t('close'), { bg: '#8a5cf6', dark: '#5b34c9', size: 17 }, () => { app.screen = 'play'; S.play('tap'); });
    drawParts();
  }

  function drawDrill(x, y, s) {
    c.save(); c.translate(x, y); c.scale(s, s); c.rotate(-0.5);
    rr(-8, -60, 16, 70, 8); c.fillStyle = '#cfd8e3'; c.fill(); c.lineWidth = 2; c.strokeStyle = '#8a97a8'; c.stroke();
    rr(-11, -80, 22, 26, 8); c.fillStyle = '#7fb3d9'; c.fill(); c.stroke();
    c.beginPath(); c.moveTo(-3, 10); c.lineTo(3, 10); c.lineTo(0, 26); c.closePath(); c.fillStyle = '#9aa6b5'; c.fill();
    for (let k = 0; k < 3; k++) { c.beginPath(); c.arc(0, 30, 8 + k * 6 + (app.time * 30 % 6), -0.6, 0.6); c.lineWidth = 2; c.strokeStyle = 'rgba(120,140,160,.6)'; c.stroke(); }
    c.restore();
  }
  function drawEnd(won) {
    const g = app.game, H = app.H;
    dim();
    const ch = 470, y = (H - ch) / 2;
    card(y, ch);
    const dent = !won && g.reason === 'dentist';
    if (won) {
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
    } else if (dent) {
      txt(t('dentTitle'), W / 2, y + 50, 26, '#e0294f', 'center', 900);
      const l = wrap(t('dentSub'), W - 100, 14, 800);
      l.forEach((ln, j) => txt(ln, W / 2, y + 80 + j * 18, 14, '#8a4a5a', 'center', 800));
      drawGerm(W / 2 - 20, y + 175, 30, { dizzy: true, hurt: true });
      drawDrill(W / 2 + 62 + Math.sin(app.time * 50) * 1.5, y + 186, 0.8);
      const tl = wrap(t('dentTip'), W - 110, 12, 800);
      tl.forEach((ln, j) => txt(ln, W / 2, y + 224 + j * 15, 12, '#1d9d57', 'center', 800));
    } else {
      txt(t('loseTitle'), W / 2, y + 56, 26, '#2f7fb8', 'center', 900);
      txt(t('loseSub'), W / 2, y + 90, 16, '#6a86a0', 'center', 800);
      drawGerm(W / 2, y + 170, 30, { dizzy: true, hurt: true });
      for (let k = 0; k < 6; k++) { const a = app.time * 2 + k; c.beginPath(); c.arc(W / 2 + Math.cos(a) * 46, y + 170 + Math.sin(a * 1.3) * 30, 5 + (k % 3) * 2, 0, TAU); c.fillStyle = 'rgba(160,220,255,.6)'; c.fill(); }
    }
    txt(t('time') + ' ' + fmtTime(g.t) + (won && app.newRecord ? '  ·  ' + t('record') : ''), W / 2, y + 250, 15, '#8a6a7a', 'center', 800);
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
    if (b) { app.press = { id: b.id, pid: e.pointerId }; if (app.screen === 'play' && b.id === 'flipBtn') { b.action(); app.pressFired = true; } else app.pressFired = false; return; }
    if (app.screen === 'play') {
      // 두 번 톡톡 = 뒤집기
      const now = performance.now();
      if (now - app.lastTap < 300 && Math.hypot(pt.x - app.lastTapX, pt.y - app.lastTapY) < 40) { tryFlip(); app.lastTap = 0; }
      else { app.lastTap = now; app.lastTapX = pt.x; app.lastTapY = pt.y; }
      app.drag = { id: e.pointerId, x: pt.x, y: pt.y }; app.hintT = Math.min(app.hintT, 0.6);
    }
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
    if (e.key === 'Escape' || e.key === 'p') { if (app.screen === 'play') app.screen = 'pause'; else if (app.screen === 'pause' || app.screen === 'tech') app.screen = 'play'; }
    if ((e.key === ' ' || e.key === 'Enter') && app.screen === 'intro') beginPlay();
    else if (e.key === ' ' && app.screen === 'play') { e.preventDefault(); tryFlip(); }
    if (e.key === 't' || e.key === 'e') { if (app.screen === 'play') openTech(); else if (app.screen === 'tech') app.screen = 'play'; }
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
    for (let i = 0; i < 20; i++) if (app.toothShake[i] > 0) app.toothShake[i] -= dt;
    if (app.screen !== 'pause' && app.screen !== 'intro') updParts(dt);

    c.fillStyle = '#ffd2df'; c.fillRect(0, 0, W, app.H);
    if (app.screen === 'title') drawTitle();
    else {
      const btnsBefore = app.btns.length;
      drawPlay(dt);
      if (app.screen !== 'play') app.btns.length = btnsBefore;
      if (app.screen === 'intro') drawIntro();
      else if (app.screen === 'pause') drawPause();
      else if (app.screen === 'tech') drawTech();
      else if (app.screen === 'win') { drawEnd(true); drawParts(); }
      else if (app.screen === 'lose') drawEnd(false);
    }
  }
  app.step = step; app.startStage = startStage; app.beginPlay = beginPlay; app.save = save; app.openTech = openTech;
  requestAnimationFrame(frame);
})();
