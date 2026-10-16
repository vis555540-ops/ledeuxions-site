// 통합판 공용 진행 계산 — 허브(index.html)와 2D·3D 게임이 같이 씀.
// 형 지시(10/12): 장마다 '쉬움' 10판(본편) + '어려움' 10판(쉬움을 다 깨면 열림).
//   2D 번호: 1–10 나무 쉬움 · 11–20 RC 쉬움 · 21–30 나무 어려움 · 31–40 RC 어려움
//   3D 번호: 1–10 나무 쉬움 · 11–20 RC 쉬움 · 21–30 나무 어려움 · 31–40 RC 어려움 (어려움 id = 쉬움 id + '_h')
// 2D 는 'qr-progress' {v:2, stars:[40], unlocked}, 3D 는 'qr3d:stars:<id>' 를 읽는다.
// 깬 판 기록은 'qr-hub-clear' {"2d":[..], "3d":[..]} (별 0개로 깬 경우도 잡으려고).
// 옛 60판(쉬움·보통·어려움 3판씩) 저장은 처음 열 때 한 번 새 번호로 옮긴다 (옛것은 'qr-progress-v1' 에 남겨 둠).
(function () {
  const get = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } };
  const set = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} if (globalThis.CG) CG.dirty(); };
  const IDS3 = ['hut', 'stilts', 'window', 'shop', 'long', 'slope', 'tile', 'lshape', 'budget', 'three',
    'rc_office', 'rc_piloti', 'rc_ribbon', 'rc_corner', 'rc_corridor', 'rc_tank', 'rc_setback', 'rc_weakcol', 'rc_budget', 'rc_five'];
  const N2 = 40, N3 = 40;
  const CH = [
    { id: 1, game: '2d', from: 1, to: 10, hard: [21, 30], name: { en: 'Wooden house', ko: '나무집' } },
    { id: 2, game: '2d', from: 11, to: 20, hard: [31, 40], name: { en: 'Reinforced concrete', ko: '철근콘크리트' } },
    { id: 3, game: '3d', from: 1, to: 10, hard: [21, 30], name: { en: 'Wooden house', ko: '나무집' } },
    { id: 4, game: '3d', from: 11, to: 20, hard: [31, 40], name: { en: 'Reinforced concrete', ko: '철근콘크리트' } },
  ];

  // ---- 옛 저장 옮기기 (2D 60판 → 40판) ----
  // 옛 번호 n(1..60): 개념 c = ⌊(n−1)/3⌋, 변형 v = (n−1)%3 (0 쉬움 1 보통 2 어려움)
  const old2new = (n) => {
    const c = Math.floor((n - 1) / 3), v = (n - 1) % 3, wood = c < 10, k = wood ? c : c - 10;
    return v < 2 ? (wood ? 1 : 11) + k : (wood ? 21 : 31) + k;
  };
  (function migrate() {
    const p = get('qr-progress', null);
    if (p && Array.isArray(p.stars) && !p.v) {
      set('qr-progress-v1', p);
      const stars = new Array(N2).fill(0);
      p.stars.forEach((s, i) => { if (!s) return; const n = old2new(i + 1) - 1; stars[n] = Math.max(stars[n], s); });
      let hi = 0; for (let i = 0; i < 20; i++) if (stars[i] > 0) hi = i + 1;
      set('qr-progress', { v: 2, stars, unlocked: Math.min(20, Math.max(1, hi + 1)) });
    }
    const c = get('qr-hub-clear', null);
    if (c && !c.v2) {
      if (Array.isArray(c['2d'])) c['2d'] = [...new Set(c['2d'].map(old2new))];
      c.v2 = 1; set('qr-hub-clear', c);
    }
    const last = get('qr-hub-last', null);
    if (last && last.game === '2d' && !last.v2) set('qr-hub-last', { game: '2d', level: old2new(last.level), v2: 1 });
  })();

  function starsOf(game, n) {
    if (game === '2d') return (get('qr-progress', {}).stars || [])[n - 1] || 0;
    const id = n <= 20 ? IDS3[n - 1] : IDS3[n - 21] + '_h';
    return +get('qr3d:stars:' + id, 0) || 0;
  }
  function cleared(game, n) {
    return starsOf(game, n) > 0 || (get('qr-hub-clear', {})[game] || []).includes(n);
  }
  function markClear(game, n) {
    const c = get('qr-hub-clear', { v2: 1 }); c[game] = c[game] || []; c.v2 = 1;
    if (!c[game].includes(n)) { c[game].push(n); set('qr-hub-clear', c); }
  }
  function setLast(game, n) { set('qr-hub-last', { game, level: n, v2: 1 }); }
  // n 이 들어 있는 장과 어려움 여부
  function chapterOf(game, n) {
    for (const c of CH) {
      if (c.game !== game) continue;
      if (n >= c.from && n <= c.to) return { c, hard: false };
      if (n >= c.hard[0] && n <= c.hard[1]) return { c, hard: true };
    }
    return null;
  }
  const easyDone = (c) => { for (let n = c.from; n <= c.to; n++) if (!cleared(c.game, n)) return false; return true; };
  function summary(force) {
    const out = CH.map((c) => {
      let stars = 0, done = 0, hStars = 0, hDone = 0;
      for (let n = c.from; n <= c.to; n++) { stars += starsOf(c.game, n); if (cleared(c.game, n)) done++; }
      for (let n = c.hard[0]; n <= c.hard[1]; n++) { hStars += starsOf(c.game, n); if (cleared(c.game, n)) hDone++; }
      const count = c.to - c.from + 1;
      return { ...c, stars, total: count * 3, done, count, hardStars: hStars, hardDone: hDone, hardOpen: done >= count };
    });
    out[0].open = true; out[1].open = true;
    out[2].open = out[0].hardOpen;                 // 3D 나무 = 2D 나무 쉬움 다 깨기
    out[3].open = out[1].hardOpen && out[2].done >= 5; // 3D RC = 2D RC 쉬움 다 깨기 + 3D 나무 5판
    if (force) out.forEach((c) => { c.open = true; c.hardOpen = true; });
    return out;
  }
  // 이 판을 열 수 있나 (장이 열렸고, 어려움이면 그 장 쉬움을 다 깼나)
  function isOpen(game, n, force) {
    const r = chapterOf(game, n); if (!r) return false;
    const s = summary(force)[r.c.id - 1];
    return s.open && (!r.hard || s.hardOpen);
  }
  // 이 판을 깨서 장이 끝났나? (게임의 결과 창에서 씀) — 쉬움 마지막 판이면 어려움이 열렸는지·다음 장이 열렸는지
  function chapterEnd(game, n) {
    const r = chapterOf(game, n); if (!r) return null;
    const S = summary(), s = S[r.c.id - 1], next = S[r.c.id];
    if (!r.hard && n === r.c.to) return { chapter: r.c.id, hardOpen: s.hardOpen, nextOpen: !!(next && next.open), last: !next };
    if (r.hard && n === r.c.hard[1]) return { chapter: r.c.id, hard: true, nextOpen: !!(next && next.open), last: !next };
    return null;
  }
  globalThis.QRHUB = { CH, IDS3, starsOf, cleared, markClear, setLast, summary, chapterOf, isOpen, chapterEnd, get, old2new };
})();
