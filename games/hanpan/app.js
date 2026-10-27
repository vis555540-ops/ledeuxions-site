// 한판퍼즐 화면
(function () {
  'use strict';
  const P = window.Puzzles;
  const $ = id => document.getElementById(id);
  // ---------- 말 (한국어 / English) ----------
  const L = {
    ko: {
      names: { zip: '한붓길', queens: '왕관자리', bin: '바둑칸' },
      diffs: ['쉬움', '보통', '어려움', '지옥'],
      desc: {
        zip: '1부터 순서대로, 모든 칸을 한 번씩 지나는 한 붓 길',
        queens: '가로·세로·색마다 왕관 하나. 대각선으로도 안 닿게',
        bin: '줄마다 흑백 반반, 같은 색 셋 연속 금지',
      },
      rules: {
        zip: ['<b>1</b>에서 손가락을 대고 끌어서 길을 그려요.', '숫자는 <b>1 → 2 → 3…</b> 순서대로 지나야 해요.', '<b>모든 칸</b>을 딱 한 번씩 지나고, 마지막 숫자에서 끝나요.', '지난 칸을 다시 누르면 거기까지 돌아가요.'],
        queens: ['칸을 누르면 <b>✕ → 👑 → 빈칸</b>으로 바뀌어요. (✕는 메모)', '가로줄·세로줄·<b>같은 색 구역</b>마다 왕관이 딱 하나.', '왕관끼리는 <b>대각선으로도</b> 붙으면 안 돼요.'],
        bin: ['칸을 누르면 <b>⚫ → ⚪ → 빈칸</b>으로 바뀌어요.', '가로줄·세로줄마다 흑과 백이 <b>반반</b>.', '같은 색이 <b>세 개 연속</b>으로 붙으면 안 돼요.', '어두운 칸의 돌은 처음부터 놓인 돌이에요.'],
      },
      date: d => `${d.getMonth() + 1}월 ${d.getDate()}일 ${'일월화수목금토'[d.getDay()]}요일`,
      shortDate: d => `${d.getMonth() + 1}월 ${d.getDate()}일`,
      today: '오늘의 퍼즐', solvedAgain: t => `다 풀었음 ${t} — 다시 보기`, changes: '매일 종류가 바뀌어요',
      streak: '연속 일', done: '푼 판', todayRec: '오늘 기록', more: '더 하기', endless: '— 끝없이 새 판',
      foot: '판은 그때그때 새로 만들고, 답이 하나뿐인지 확인한 판만 냅니다.',
      best: '최고', making: '판 만드는 중…', cells: '칸', empty: '빈칸',
      undo: '↶ 무르기', clear: '지우기', check: '틀린 곳', rule: '규칙', ok: '알겠어, 시작!',
      win: '🎉 정답!', share: '공유하기', next: '한 판 더', home: '처음으로',
      wEnd: k => `마지막 숫자 ${k}에서 끝나야 해요. 남은 칸을 먼저 지나요`,
      wOrder: n => `번호 순서 확인! 다음은 ${n}이에요`,
      wLast: (k, n) => `${k}은 마지막 칸이에요. 남은 ${n}칸 먼저!`,
      almost: n => `거의 다 왔어요! ${n}칸 남았어요`,
      filledBad: '다 채웠는데 규칙에 안 맞는 곳이 있어요 — 「틀린 곳」',
      newBest: '최고 기록 새로!', days: n => `${n}일 연속`,
      copied: '복사했어요. 붙여넣기 하세요', copyPrompt: '복사해서 보내세요',
      hintNone: '오늘 무료 힌트를 다 썼어요. 내일 또 3개!', hintAdFail: '광고를 끝까지 보면 힌트를 드려요', hintFull: '더 줄 힌트가 없어요',
      settings: '설정', lang: '말', auto: '자동', close: '닫기', privacy: '개인정보처리방침', title: '한판퍼즐', logo: '한판<b>퍼즐</b>',
    },
    en: {
      names: { zip: 'One Stroke', queens: 'Crowns', bin: 'Stones' },
      diffs: ['Easy', 'Normal', 'Hard', 'Inferno'],
      desc: {
        zip: 'Draw one line through every cell, passing 1, 2, 3… in order',
        queens: 'One crown per row, column and color. No touching, even diagonally',
        bin: 'Half black, half white in every line. Never three in a row',
      },
      rules: {
        zip: ['Put your finger on <b>1</b> and drag to draw a path.', 'Pass the numbers in order: <b>1 → 2 → 3…</b>', 'Visit <b>every cell</b> exactly once and finish on the last number.', 'Tap a cell you already passed to go back to it.'],
        queens: ['Tap a cell to cycle <b>✕ → 👑 → empty</b>. (✕ is a note)', 'Exactly one crown in every row, column and <b>color region</b>.', 'Crowns may not touch each other, <b>not even diagonally</b>.'],
        bin: ['Tap a cell to cycle <b>⚫ → ⚪ → empty</b>.', 'Every row and column is <b>half black, half white</b>.', 'No <b>three of the same color</b> in a row.', 'Stones on darker cells are given from the start.'],
      },
      date: d => d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      shortDate: d => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      today: "Today's puzzle", solvedAgain: t => `Solved in ${t} — view again`, changes: 'A different kind every day',
      streak: 'day streak', done: 'solved', todayRec: 'today', more: 'More', endless: '— endless new boards',
      foot: 'Every board is freshly made and checked to have exactly one solution.',
      best: 'Best', making: 'Making a board…', cells: 'cells', empty: 'Empty',
      undo: '↶ Undo', clear: 'Clear', check: 'Mistakes', rule: 'Rules', ok: 'Got it, start!',
      win: '🎉 Solved!', share: 'Share', next: 'One more', home: 'Home',
      wEnd: k => `You must end on ${k}. Cover the other cells first`,
      wOrder: n => `Check the order! Next is ${n}`,
      wLast: (k, n) => `${k} is the last cell. ${n} cells left first!`,
      almost: n => `Almost there! ${n} cells left`,
      filledBad: 'All filled, but something breaks a rule — tap “Mistakes”',
      newBest: 'New best!', days: n => `${n}-day streak`,
      copied: 'Copied. Paste it anywhere', copyPrompt: 'Copy and send',
      hintNone: 'No free hints left today. 3 more tomorrow!', hintAdFail: 'Watch the whole ad to get a hint', hintFull: 'Nothing left to hint',
      settings: 'Settings', lang: 'Language', auto: 'Auto', close: 'Close', privacy: 'Privacy policy', title: 'OnePuzzle', logo: 'One<b>Puzzle</b>',
    },
  };
  const COLORS = ['#f6c89f', '#a8d5a2', '#9cc5ec', '#f2a7c3', '#f5e08a', '#c3b1ea', '#8fd6cb', '#d6d3ce', '#f39c8f', '#c8b18f'];
  const DIFF_EMO = ['🟢', '🟡', '🟠', '🔴'];

  // ---------- 저장 (실패해도 돌아감) ----------
  const KEY = 'hanpan.v1';
  let S = { daily: {}, best: {}, done: 0, seen: {}, lang: 'auto' };
  try { const t = JSON.parse(localStorage.getItem(KEY) || 'null'); if (t) S = Object.assign(S, t); } catch (e) {}
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} };
  const autoLang = () => ((navigator.languages && navigator.languages[0]) || navigator.language || 'ko').toLowerCase().startsWith('ko') ? 'ko' : 'en';
  let LANG = 'ko', T = L.ko;
  const NM = t => T.names[t], DF = d => T.diffs[d];
  // 앱 안(?app=1)이면 표시. 한 번 들어오면 이 창에선 계속 앱.
  let APP = false;
  try { APP = new URLSearchParams(location.search).has('app') || sessionStorage.getItem('hanpan.app') === '1'; if (APP) sessionStorage.setItem('hanpan.app', '1'); } catch (e) { APP = new URLSearchParams(location.search).has('app'); }
  if (APP) document.documentElement.classList.add('app');
  const PLAY = 'https://play.google.com/store/apps/details?id=com.ledeuxions.hanpan';
  function applyLang() {
    LANG = S.lang === 'ko' || S.lang === 'en' ? S.lang : autoLang(); T = L[LANG];
    document.documentElement.lang = LANG; document.title = T.title;
    document.querySelectorAll('[data-t]').forEach(e => { e.innerHTML = T[e.dataset.t]; });
    document.querySelectorAll('.langb').forEach(b => b.classList.toggle('on', b.dataset.l === (S.lang || 'auto')));
  }

  const pad = n => String(n).padStart(2, '0');
  const localDate = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const fmt = s => `${Math.floor(s / 60)}:${pad(s % 60)}`;
  function streak() {
    let n = 0; const d = new Date();
    if (!S.daily[localDate(d)]) d.setDate(d.getDate() - 1);
    while (S.daily[localDate(d)]) { n++; d.setDate(d.getDate() - 1); }
    return n;
  }
  function toast(t) { const e = $('toast'); e.textContent = t; e.style.display = 'block'; clearTimeout(toast.h); toast.h = setTimeout(() => e.style.display = 'none', 1800); }

  // ---------- 처음 화면 ----------
  const today = localDate();
  const TD = P.daily(today);
  function renderHome() {
    const d = new Date();
    $('hdate').textContent = T.date(d);
    $('todayT').textContent = `${P.TYPES[TD.type].icon} ${NM(TD.type)}`;
    const rec = S.daily[today];
    $('todayS').textContent = `${DIFF_EMO[TD.diff]} ${DF(TD.diff)} · ` + (rec ? T.solvedAgain(fmt(rec.t)) : T.changes);
    $('stStreak').textContent = streak();
    $('stDone').textContent = S.done;
    $('stToday').textContent = rec ? fmt(rec.t) : '-';
    const box = $('types'); box.innerHTML = '';
    for (const t of Object.keys(P.TYPES)) {
      const div = document.createElement('div'); div.className = 'ptype';
      div.innerHTML = `<div class="nm">${P.TYPES[t].icon} ${NM(t)}</div><div class="ds">${T.desc[t]}</div><div class="chips"></div>`;
      T.diffs.forEach((nm, i) => {
        const b = document.createElement('button'); b.className = 'chip d' + i;
        const best = S.best[t + i];
        b.innerHTML = `${nm}<small>${best ? T.best + ' ' + fmt(best) : '&nbsp;'}</small>`;
        b.onclick = () => start({ type: t, diff: i, seed: 'more-' + Date.now() + '-' + Math.random(), daily: false });
        div.querySelector('.chips').appendChild(b);
      });
      box.appendChild(div);
    }
  }
  $('todayBtn').onclick = () => start(Object.assign({ daily: true }, TD));

  // ---------- 게임 ----------
  let G = null; // 지금 판
  let timerH = null;
  function start(spec) {
    $('home').style.display = 'none'; $('game').style.display = 'block';
    $('board').innerHTML = '<div style="text-align:center;padding:40px;color:var(--sub)">' + T.making + '</div>';
    $('gTitle').innerHTML = `${NM(spec.type)}<small>${spec.daily ? T.today + ' · ' : ''}${DIFF_EMO[spec.diff]} ${DF(spec.diff)}</small>`;
    setTimeout(() => {
      const t0 = performance.now();
      const pz = P.generate(spec.type, spec.diff, spec.seed);
      G = { spec, pz, genMs: performance.now() - t0, hist: [], check: false, solved: false, sec: 0 };
      if (spec.type === 'zip') { G.path = [pz.clue.indexOf(1)]; pz.K = Math.max(...pz.clue); }
      if (spec.type === 'queens') G.st = new Array(pz.N * pz.N).fill(0);
      if (spec.type === 'bin') G.st = pz.givens.slice();
      $('checkBtn').classList.remove('on');
      layout(); draw(); hintBadge();
      clearInterval(timerH); $('timer').textContent = '0:00';
      timerH = setInterval(() => { if (!G.solved && !document.hidden) { G.sec++; $('timer').textContent = fmt(G.sec); } }, 1000);
      if (!S.seen[spec.type]) showRules();
    }, 30);
  }
  $('backBtn').onclick = () => { clearInterval(timerH); $('game').style.display = 'none'; $('home').style.display = 'block'; renderHome(); };

  function layout() {
    const w = Math.min(document.querySelector('.wrap').clientWidth - 32, 480);
    const h = window.innerHeight - 220;
    const s = Math.max(240, Math.min(w, h));
    G.lw = window.innerWidth;
    const b = $('board'); b.style.width = s + 'px'; b.style.height = s + 'px';
    G.size = s;
  }
  window.addEventListener('resize', () => { if (G && $('game').style.display === 'block' && window.innerWidth !== G.lw) { layout(); draw(); } });

  function cellAt(e) {
    const r = $('board').getBoundingClientRect(), N = G.pz.N;
    const c = Math.floor((e.clientX - r.left) / r.width * N), rr = Math.floor((e.clientY - r.top) / r.height * N);
    if (c < 0 || rr < 0 || c >= N || rr >= N) return -1;
    return rr * N + c;
  }

  // ---------- 그리기 ----------
  function draw() {
    const { type } = G.spec, N = G.pz.N, b = $('board');
    const fs = Math.floor(G.size / N * 0.5);
    if (type === 'zip') return drawZip();
    let html = `<div class="grid" style="grid-template-columns:repeat(${N},minmax(0,1fr));grid-template-rows:repeat(${N},minmax(0,1fr))">`;
    const bad = G.check ? errors() : new Set();
    for (let i = 0; i < N * N; i++) {
      if (type === 'queens') {
        const v = G.st[i];
        const r = (i / N) | 0, c = i % N, g = G.pz.reg[i];
        const sh = [r > 0 && G.pz.reg[i - N] !== g ? 'inset 0 3px 0 #2b2622' : '', c > 0 && G.pz.reg[i - 1] !== g ? 'inset 3px 0 0 #2b2622' : ''].filter(Boolean).join(',');
        html += `<div class="cell${bad.has(i) ? ' bad' : ''}${i === G.hl ? ' hl' : ''}" style="background:${COLORS[g]};${sh ? 'box-shadow:' + sh + ';' : ''}font-size:${fs}px">${v === 2 ? `<span class="q${i === G.pop ? ' pop' : ''}">👑</span>` : v === 1 ? '<span class="q qx">✕</span>' : ''}</div>`;
      } else {
        const v = G.st[i], gv = G.pz.givens[i] >= 0;
        html += `<div class="cell${gv ? ' given' : ''}${bad.has(i) ? ' bad' : ''}${i === G.hl ? ' hl' : ''}">${v === 0 ? '<div class="stone b"></div>' : v === 1 ? '<div class="stone w"></div>' : ''}</div>`;
      }
    }
    b.innerHTML = html + '</div>';
    G.pop = -1; G.hl = -1;
    hint();
  }
  function drawZip() {
    const N = G.pz.N, path = G.path, clue = G.pz.clue;
    const xy = i => [(i % N) + 0.5, ((i / N) | 0) + 0.5];
    const bad = G.check ? errors() : new Set();
    let s = `<svg viewBox="0 0 ${N} ${N}" width="100%" height="100%" style="display:block;border:3px solid var(--ink);border-radius:8px;background:var(--card)">`;
    for (const i of bad) { const [x, y] = xy(i); s += `<rect x="${x - .5}" y="${y - .5}" width="1" height="1" fill="var(--bad)" opacity=".3"/>`; }
    for (let k = 1; k < N; k++) s += `<line x1="${k}" y1="0" x2="${k}" y2="${N}" stroke="var(--line)" stroke-width=".03"/><line x1="0" y1="${k}" x2="${N}" y2="${k}" stroke="var(--line)" stroke-width=".03"/>`;
    if (path.length > 1) s += `<polyline points="${path.map(i => xy(i).join(',')).join(' ')}" fill="none" stroke="var(--path)" stroke-width=".42" stroke-linecap="round" stroke-linejoin="round" opacity=".85"/>`;
    else { const [x, y] = xy(path[0]); s += `<circle cx="${x}" cy="${y}" r=".21" fill="var(--path)"/>`; }
    if (G.hl >= 0) { const [x, y] = xy(G.hl); s += `<rect class="hlz" x="${x - .46}" y="${y - .46}" width=".92" height=".92" rx=".12" fill="none" stroke="#f5b400" stroke-width=".1"/>`; G.hl = -1; }
    for (let i = 0; i < N * N; i++) if (clue[i]) {
      const [x, y] = xy(i);
      s += `<circle cx="${x}" cy="${y}" r=".33" fill="var(--ink)"/><text x="${x}" y="${y + .13}" font-size=".36" font-weight="800" text-anchor="middle" fill="var(--card)">${clue[i]}</text>`;
    }
    $('board').innerHTML = s + '</svg>';
    hint();
  }
  function hint() {
    const N = G.pz.N;
    if (G.spec.type === 'zip') $('hint').textContent = `${G.path.length} / ${N * N} ${T.cells}`;
    if (G.spec.type === 'queens') $('hint').textContent = `👑 ${G.st.filter(v => v === 2).length} / ${N}`;
    if (G.spec.type === 'bin') $('hint').textContent = `${T.empty} ${G.st.filter(v => v < 0).length}`;
  }

  // ---------- 틀린 곳 ----------
  function errors() {
    const N = G.pz.N, bad = new Set();
    if (G.spec.type === 'zip') { G.path.forEach((c, k) => { if (G.pz.solution[k] !== c) bad.add(c); }); return bad; }
    if (G.spec.type === 'queens') {
      const qs = []; G.st.forEach((v, i) => v === 2 && qs.push(i));
      for (const a of qs) for (const b of qs) {
        if (a >= b) continue;
        const ra = (a / N) | 0, ca = a % N, rb = (b / N) | 0, cb = b % N;
        if (ra === rb || ca === cb || G.pz.reg[a] === G.pz.reg[b] || (Math.abs(ra - rb) <= 1 && Math.abs(ca - cb) <= 1)) { bad.add(a); bad.add(b); }
      }
      return bad;
    }
    // 바둑칸
    const st = G.st;
    for (let i = 0; i < N; i++) {
      const lines = [Array.from({ length: N }, (_, c) => i * N + c), Array.from({ length: N }, (_, r) => r * N + i)];
      for (const L of lines) {
        for (let k = 0; k + 2 < N; k++) { const a = st[L[k]]; if (a >= 0 && a === st[L[k + 1]] && a === st[L[k + 2]]) { bad.add(L[k]); bad.add(L[k + 1]); bad.add(L[k + 2]); } }
        for (const v of [0, 1]) if (L.filter(j => st[j] === v).length > N / 2) L.forEach(j => st[j] === v && bad.add(j));
      }
    }
    return bad;
  }
  $('checkBtn').onclick = () => { G.check = !G.check; $('checkBtn').classList.toggle('on', G.check); draw(); };

  // ---------- 되돌리기·지우기 ----------
  const snap = () => G.hist.push(G.spec.type === 'zip' ? G.path.slice() : G.st.slice());
  $('undoBtn').onclick = () => { if (!G || G.solved || !G.hist.length) return; const h = G.hist.pop(); if (G.spec.type === 'zip') G.path = h; else G.st = h; draw(); };
  $('clearBtn').onclick = () => {
    if (!G || G.solved) return; snap();
    if (G.spec.type === 'zip') G.path = [G.pz.clue.indexOf(1)];
    if (G.spec.type === 'queens') G.st.fill(0);
    if (G.spec.type === 'bin') G.st = G.pz.givens.slice();
    draw();
  };

  // ---------- 손가락 ----------
  let drag = null;
  const board = $('board');
  board.addEventListener('pointerdown', e => {
    if (!G || G.solved) return;
    const i = cellAt(e); if (i < 0) return;
    board.setPointerCapture && board.setPointerCapture(e.pointerId);
    e.preventDefault();
    if (G.spec.type === 'zip') {
      const k = G.path.indexOf(i);
      const end = G.path[G.path.length - 1];
      if (k < 0 && !adj(i, end)) return;
      snap(); drag = { zip: true, moved: false };
      if (k >= 0) G.path.length = k + 1; else zipStep(i);
      draw(); return;
    }
    if (G.spec.type === 'queens') {
      snap();
      const nv = (G.st[i] + 1) % 3; G.st[i] = nv; G.pop = nv === 2 ? i : -1;
      drag = { mark: nv === 1, last: i };
    } else {
      if (G.pz.givens[i] >= 0) return;
      snap();
      const nv = G.st[i] === -1 ? 0 : G.st[i] === 0 ? 1 : -1; G.st[i] = nv;
      drag = { paint: nv, last: i };
    }
    draw(); won();
  });
  board.addEventListener('pointermove', e => {
    if (!drag || !G || G.solved) return;
    const i = cellAt(e); if (i < 0) return;
    if (drag.zip) { zipTo(i); return; }
    if (i === drag.last) return; drag.last = i;
    if (G.spec.type === 'queens') { if (drag.mark && G.st[i] === 0) { G.st[i] = 1; draw(); } }
    else if (G.pz.givens[i] < 0 && G.st[i] !== drag.paint) { G.st[i] = drag.paint; draw(); won(); }
  });
  const up = () => { const z = drag && drag.zip; drag = null; if (z && G && !G.solved) won(); };
  board.addEventListener('pointerup', up); board.addEventListener('pointercancel', up);

  function adj(a, b) { const N = G.pz.N; return (Math.abs(a - b) === N) || (Math.abs(a - b) === 1 && ((a / N) | 0) === ((b / N) | 0)); }
  function nextNum() { let n = 1; for (const c of G.path) if (G.pz.clue[c]) n = G.pz.clue[c]; return n + 1; }
  function zipStep(i) {
    const p = G.path, end = p[p.length - 1];
    if (p.length > 1 && i === p[p.length - 2]) { p.pop(); return true; }
    if (p.includes(i) || !adj(i, end)) return false;
    const K = G.pz.K;
    if (G.pz.clue[end] === K) { warn(T.wEnd(K)); return false; }
    const v = G.pz.clue[i];
    if (v && v !== nextNum()) { warn(T.wOrder(nextNum())); return false; }
    if (v === K && p.length + 1 < G.pz.N * G.pz.N) { warn(T.wLast(K, G.pz.N * G.pz.N - p.length - 1)); return false; }
    p.push(i); return true;
  }
  function warn(t) { const n = Date.now(); if (n - (warn.t || 0) > 1500 || warn.m !== t) { warn.t = n; warn.m = t; toast(t); } }
  function zipTo(i) {
    const N = G.pz.N; let changed = false;
    const k = G.path.indexOf(i);
    if (k >= 0 && k < G.path.length - 2) { G.path.length = k + 1; changed = true; }
    for (let guard = 0; guard < 2 * N; guard++) {
      const end = G.path[G.path.length - 1]; if (end === i) break;
      const er = (end / N) | 0, ec = end % N, tr = (i / N) | 0, tc = i % N;
      const step = Math.abs(tr - er) >= Math.abs(tc - ec) ? end + Math.sign(tr - er) * N : end + Math.sign(tc - ec);
      if (!zipStep(step)) break; changed = true;
    }
    if (changed) { draw(); won(); }
  }

  // ---------- 다 풀었나 ----------
  function won() {
    const N = G.pz.N, NN = N * N; let ok = false;
    if (G.spec.type === 'zip') ok = G.path.length === NN && G.pz.clue[G.path[NN - 1]] === Math.max(...G.pz.clue);
    if (G.spec.type === 'queens') ok = G.st.every((v, i) => (v === 2) === (G.pz.solution[i] === 1));
    if (G.spec.type === 'bin') ok = G.st.every((v, i) => v === G.pz.solution[i]);
    if (!ok) {
      if (G.spec.type === 'zip' && !drag) { const left = NN - G.path.length; if (left && G.path.length > NN / 2 && left <= 6) toast(T.almost(left)); }
      if (G.spec.type !== 'zip' && G.st.every(v => G.spec.type === 'queens' ? true : v >= 0) && (G.spec.type !== 'queens' || G.st.filter(v => v === 2).length === N)) toast(T.filledBad);
      return;
    }
    G.solved = true; clearInterval(timerH);
    const t = G.sec, key = G.spec.type + G.spec.diff;
    let info = '';
    S.done++;
    if (!S.best[key] || t < S.best[key]) { if (S.best[key]) info = T.newBest; S.best[key] = t; }
    if (G.spec.daily && !S.daily[today]) S.daily[today] = { t, type: G.spec.type, diff: G.spec.diff };
    save();
    $('wTitle').textContent = T.win;
    $('wTime').textContent = '⏱ ' + fmt(t);
    $('wInfo').textContent = [info, G.spec.daily ? `🔥 ${T.days(streak())}` : `${NM(G.spec.type)} ${DF(G.spec.diff)} ${T.best} ${fmt(S.best[key])}`].filter(Boolean).join(' · ');
    $('wNext').textContent = G.spec.daily ? T.more : T.next;
    HanpanAds.solved();
    setTimeout(() => $('winM').classList.add('show'), 400);
  }

  // ---------- 💡 힌트 (광고 보고 / 지금은 하루 3번 무료 — ads.js) ----------
  function hintBadge() { const b = HanpanAds.hintBadge(); $('hintN').textContent = b === 'ad' ? '▶' : b; }
  // 힌트 하나 놓기. 놓은 칸 번호, 줄 게 없으면 -1
  function giveHint() {
    const N = G.pz.N, sol = G.pz.solution;
    if (G.spec.type === 'zip') { // 맞게 온 데까지 두고 다음 칸 하나
      let k = 0; while (k < G.path.length && G.path[k] === sol[k]) k++;
      if (k >= sol.length) return -1;
      G.path.length = k; G.path.push(sol[k]); return sol[k];
    }
    if (G.spec.type === 'queens') { // 빠진 왕관 하나 (그 줄에 틀린 왕관 있으면 치움)
      const r = G.st.findIndex((v, i) => sol[i] === 1 && v !== 2);
      if (r < 0) { const w = G.st.findIndex((v, i) => v === 2 && sol[i] !== 1); if (w < 0) return -1; G.st[w] = 0; return w; }
      const row = (r / N) | 0;
      for (let c = 0; c < N; c++) if (G.st[row * N + c] === 2) G.st[row * N + c] = 0;
      G.st[r] = 2; G.pop = r; return r;
    }
    let i = G.st.findIndex(v => v < 0); // 바둑칸: 빈칸 하나 (없으면 틀린 칸 하나)
    if (i < 0) i = G.st.findIndex((v, j) => v !== sol[j]);
    if (i < 0) return -1;
    G.st[i] = sol[i]; return i;
  }
  let hintBusy = false;
  $('hintBtn').onclick = async () => {
    if (!G || G.solved || hintBusy) return;
    hintBusy = true;
    try {
      const b = HanpanAds.hintBadge();
      if (b !== 'ad' && b <= 0) { toast(T.hintNone); return; }
      const ok = await HanpanAds.rewardHint();
      if (!ok) { toast(b === 'ad' ? T.hintAdFail : T.hintNone); return; }
      if (!G || G.solved) return;
      snap();
      const i = giveHint();
      if (i < 0) { G.hist.pop(); toast(T.hintFull); return; }
      G.hints = (G.hints || 0) + 1; G.hl = i;
      draw(); won();
    } finally { hintBusy = false; hintBadge(); }
  };

  function shareText() {
    const d = new Date();
    const head = G.spec.daily ? `${T.title} ${T.shortDate(d)}` : T.title;
    const lines = [head, `${P.TYPES[G.spec.type].icon} ${NM(G.spec.type)} ${DIFF_EMO[G.spec.diff]} ${DF(G.spec.diff)}`, `⏱ ${fmt(G.sec)}` + (G.spec.daily ? ` · 🔥${T.days(streak())}` : '')];
    return lines.join('\n') + '\n' + (APP ? PLAY : location.origin + location.pathname);
  }
  $('wShare').onclick = async () => {
    const t = shareText();
    try { if (navigator.share) { await navigator.share({ text: t }); return; } } catch (e) {}
    try { await navigator.clipboard.writeText(t); toast(T.copied); }
    catch (e) { prompt(T.copyPrompt, t); }
  };
  $('wNext').onclick = async () => { $('winM').classList.remove('show'); await HanpanAds.between(); const s = G.spec; start({ type: s.type, diff: s.diff, seed: 'more-' + Date.now(), daily: false }); };
  $('wHome').onclick = async () => { $('winM').classList.remove('show'); await HanpanAds.between(); $('backBtn').onclick(); };

  // ---------- 규칙 (그림) ----------
  function demoSvg(type) {
    if (type === 'zip') {
      const pth = [0, 1, 2, 5, 4, 3, 6, 7, 8], xy = i => [(i % 3) + .5, ((i / 3) | 0) + .5];
      const nums = { 0: 1, 2: 2, 8: 3 };
      let s = `<svg viewBox="0 0 3 3" width="150" height="150" style="border:2px solid var(--ink);border-radius:6px;background:var(--card)"><polyline points="${pth.map(i => xy(i).join(',')).join(' ')}" fill="none" stroke="var(--path)" stroke-width=".4" stroke-linecap="round" stroke-linejoin="round"><animate attributeName="stroke-dasharray" values="0 20;9 20" dur="2.4s" repeatCount="indefinite"/></polyline>`;
      for (const k in nums) { const [x, y] = xy(+k); s += `<circle cx="${x}" cy="${y}" r=".3" fill="var(--ink)"/><text x="${x}" y="${y + .12}" font-size=".34" font-weight="800" text-anchor="middle" fill="var(--card)">${nums[k]}</text>`; }
      return s + '</svg>';
    }
    if (type === 'queens') {
      const reg = [0, 0, 1, 1, 0, 2, 2, 1, 3, 2, 2, 1, 3, 3, 2, 1], q = [1, 7, 8, 14];
      let h = '<div style="display:grid;grid-template-columns:repeat(4,36px);gap:1px;background:var(--line);border:2px solid var(--ink);border-radius:6px;overflow:hidden">';
      reg.forEach((g, i) => h += `<div style="width:36px;height:36px;display:flex;align-items:center;justify-content:center;font-size:22px;background:${COLORS[g]}">${q.includes(i) ? '👑' : ''}</div>`);
      return h + '</div>';
    }
    const g = [0, 1, 1, 0, 1, 0, 0, 1, 0, 0, 1, 1, 1, 1, 0, 0];
    let h = '<div style="display:grid;grid-template-columns:repeat(4,36px);gap:1px;background:var(--line);border:2px solid var(--ink);border-radius:6px;overflow:hidden">';
    g.forEach(v => h += `<div style="width:36px;height:36px;display:flex;align-items:center;justify-content:center;background:var(--card)"><div class="stone ${v ? 'w' : 'b'}"></div></div>`);
    return h + '</div>';
  }
  function showRules() {
    const t = G.spec.type;
    $('rTitle').textContent = `${P.TYPES[t].icon} ${NM(t)}`;
    $('rDemo').innerHTML = demoSvg(t);
    $('rList').innerHTML = T.rules[t].map(x => `<li>${x}</li>`).join('');
    $('ruleM').classList.add('show');
  }
  $('ruleBtn').onclick = () => G && showRules();
  $('rOk').onclick = () => { $('ruleM').classList.remove('show'); if (G) { S.seen[G.spec.type] = 1; save(); } };

  // 시험용: ?play=zip&d=2 바로 열기, &rules=0 규칙창 끔
  const q = new URLSearchParams(location.search);
  if (q.get('rules') === '0') S.seen = { zip: 1, queens: 1, bin: 1 };
  if (q.get('lang') === 'en' || q.get('lang') === 'ko') S.lang = q.get('lang');
  // 설정 창
  $('setBtn').onclick = () => $('setM').classList.add('show');
  $('setClose').onclick = () => $('setM').classList.remove('show');
  document.querySelectorAll('.langb').forEach(b => b.onclick = () => { S.lang = b.dataset.l; save(); applyLang(); renderHome(); if (G && $('game').style.display === 'block') { $('gTitle').innerHTML = `${NM(G.spec.type)}<small>${G.spec.daily ? T.today + ' · ' : ''}${DIFF_EMO[G.spec.diff]} ${DF(G.spec.diff)}</small>`; hint(); } });
  applyLang();
  renderHome();
  // 오프라인 — 서비스워커
  if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(() => {});
  if (q.get('play')) start({ type: q.get('play'), diff: +(q.get('d') || 0), seed: q.get('seed') || 'x', daily: false });
  window.__hanpan = () => G;
})();
