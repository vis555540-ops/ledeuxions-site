// 한판퍼즐 — 생성기 + 풀이기 (외부 라이브러리 없음). 브라우저/노드 둘 다.
(function (G) {
  'use strict';
  // ---------- 공통 ----------
  function rng(seed) {
    let h = 1779033703 ^ String(seed).length;
    for (const ch of String(seed)) { h = Math.imul(h ^ ch.charCodeAt(0), 3432918353); h = (h << 13) | (h >>> 19); }
    let a = h >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function shuffle(a, r) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  const nbCache = {};
  function nbrs(N) {
    if (nbCache[N]) return nbCache[N];
    const L = [];
    for (let i = 0; i < N * N; i++) {
      const r = (i / N) | 0, c = i % N, l = [];
      if (r > 0) l.push(i - N); if (r < N - 1) l.push(i + N); if (c > 0) l.push(i - 1); if (c < N - 1) l.push(i + 1);
      L.push(l);
    }
    return (nbCache[N] = L);
  }
  const range = n => Array.from({ length: n }, (_, i) => i);

  // ================= 한붓길 (번호 순서대로 모든 칸 한 번씩) =================
  function zipPath(N, r) {
    const p = [];
    for (let row = 0; row < N; row++) for (let k = 0; k < N; k++) p.push(row * N + (row % 2 ? N - 1 - k : k));
    const nb = nbrs(N), iters = N * N * N * 10;
    for (let it = 0; it < iters; it++) {
      if (r() < 0.5) p.reverse();
      const e = p[p.length - 1], cand = nb[e], n = cand[Math.floor(r() * cand.length)];
      const i = p.indexOf(n);
      if (i === p.length - 2) continue;
      let a = i + 1, b = p.length - 1;
      while (a < b) { const t = p[a]; p[a] = p[b]; p[b] = t; a++; b--; }
    }
    return p;
  }
  function zipSolve(N, clue, limit, budget) {
    const T = N * N, nb = nbrs(N);
    let start = -1, end = -1, K = 0;
    for (let i = 0; i < T; i++) if (clue[i] > K) { K = clue[i]; end = i; }
    for (let i = 0; i < T; i++) if (clue[i] === 1) start = i;
    const vis = new Uint8Array(T), seen = new Uint8Array(T), st = new Int32Array(T);
    let count = 0, nodes = 0, sol = null;
    const path = [start]; vis[start] = 1;
    function ok(head, cnt) {
      let forced = 0;
      for (let i = 0; i < T; i++) {
        if (vis[i]) continue;
        let d = 0, adjHead = false;
        const l = nb[i];
        for (let k = 0; k < l.length; k++) { const j = l[k]; if (!vis[j]) d++; else if (j === head) { d++; adjHead = true; } }
        if (i === end) { if (d < 1) return false; }
        else { if (d < 2) return false; if (d === 2 && adjHead) forced++; }
      }
      if (forced > 1) return false;
      // 연결성: head 에서 안 지난 칸이 다 닿아야
      seen.fill(0); let sp = 0, reach = 0;
      const l = nb[head];
      for (let k = 0; k < l.length; k++) { const j = l[k]; if (!vis[j] && !seen[j]) { seen[j] = 1; st[sp++] = j; } }
      while (sp) { const x = st[--sp]; reach++; const m = nb[x]; for (let k = 0; k < m.length; k++) { const j = m[k]; if (!vis[j] && !seen[j]) { seen[j] = 1; st[sp++] = j; } } }
      return reach === T - cnt;
    }
    function dfs(head, cnt, next) {
      nodes++;
      if (cnt === T) { if (head === end) { count++; if (!sol) sol = path.slice(); } return; }
      if (head === end) return;
      if (!ok(head, cnt)) return;
      const l = nb[head];
      for (let k = 0; k < l.length; k++) {
        const c = l[k];
        if (vis[c]) continue;
        const v = clue[c];
        if (v && v !== next) continue;
        if (v === K && cnt + 1 !== T) continue;
        vis[c] = 1; path.push(c);
        dfs(c, cnt + 1, v ? next + 1 : next);
        path.pop(); vis[c] = 0;
        if (count >= limit || nodes > budget) return;
      }
    }
    dfs(start, 1, 2);
    return { count, nodes, aborted: nodes > budget, sol };
  }
  function genZip(N, r, minClues, budget) {
    const p = zipPath(N, r), T = N * N;
    const keep = new Array(T).fill(true);
    let kept = T, lastNodes = 0;
    const build = () => { const c = new Array(T).fill(0); let n = 0; for (let i = 0; i < T; i++) if (keep[i]) c[p[i]] = ++n; return c; };
    for (const idx of shuffle(range(T - 2).map(i => i + 1), r)) {
      if (kept <= minClues) break;
      keep[idx] = false;
      const res = zipSolve(N, build(), 2, budget);
      if (res.count !== 1 || res.aborted) keep[idx] = true; else { kept--; lastNodes = res.nodes; }
    }
    return { type: 'zip', N, clue: build(), solution: p, score: lastNodes, clues: kept };
  }

  // ================= 왕관자리 (줄·칸·색마다 왕관 하나, 대각선도 안 닿게) =================
  function queensSolve(N, reg, limit) {
    const colU = new Uint8Array(N), regU = new Uint8Array(N), q = new Int8Array(N);
    let count = 0, nodes = 0; const sols = [];
    function rec(row) {
      nodes++;
      if (row === N) { count++; sols.push(Array.from(q)); return; }
      for (let c = 0; c < N; c++) {
        const g = reg[row * N + c];
        if (colU[c] || regU[g]) continue;
        if (row > 0 && Math.abs(q[row - 1] - c) <= 1) continue;
        colU[c] = 1; regU[g] = 1; q[row] = c;
        rec(row + 1);
        colU[c] = 0; regU[g] = 0;
        if (count >= limit) return;
      }
    }
    rec(0);
    return { count, nodes, sols };
  }
  // 사람처럼 푸는 논리 풀이: level 1 = 한 칸 남음 + 한 줄에 갇힘, level 2 = + "여기 두면 어디가 비어버림"
  function queensLogic(N, reg, level) {
    const T = N * N, cand = new Uint8Array(T).fill(1), queen = new Uint8Array(T);
    const units = [];
    for (let i = 0; i < N; i++) { units.push(range(N).map(c => i * N + c)); units.push(range(N).map(rr => rr * N + i)); }
    const regs = range(N).map(() => []); for (let i = 0; i < T; i++) regs[reg[i]].push(i); units.push(...regs);
    let placed = 0;
    function attackSet(i) {
      const r0 = (i / N) | 0, c0 = i % N, s = [];
      for (let j = 0; j < T; j++) { if (j === i) continue; const r1 = (j / N) | 0, c1 = j % N; if (r1 === r0 || c1 === c0 || reg[j] === reg[i] || (Math.abs(r1 - r0) <= 1 && Math.abs(c1 - c0) <= 1)) s.push(j); }
      return s;
    }
    const atk = range(T).map(attackSet);
    function place(i) { queen[i] = 1; cand[i] = 0; placed++; for (const j of atk[i]) cand[j] = 0; }
    for (let guard = 0; guard < 500; guard++) {
      if (placed === N) return true;
      let changed = false;
      for (const u of units) {
        if (u.some(i => queen[i])) continue;
        const cs = u.filter(i => cand[i]);
        if (cs.length === 0) return false;
        if (cs.length === 1) { place(cs[0]); changed = true; }
      }
      if (changed) continue;
      // 갇힘: 어떤 색의 후보가 한 줄(가로/세로)에 다 있으면 그 줄의 다른 칸 지움 (역방향도)
      for (const u of units) {
        if (u.some(i => queen[i])) continue;
        const cs = u.filter(i => cand[i]);
        const rows = new Set(cs.map(i => (i / N) | 0)), cols = new Set(cs.map(i => i % N)), rgs = new Set(cs.map(i => reg[i]));
        const elim = (pred) => { for (let j = 0; j < T; j++) if (cand[j] && !u.includes(j) && pred(j)) { cand[j] = 0; changed = true; } };
        if (rows.size === 1) { const rr = [...rows][0]; elim(j => ((j / N) | 0) === rr); }
        if (cols.size === 1) { const cc = [...cols][0]; elim(j => j % N === cc); }
        if (rgs.size === 1) { const g = [...rgs][0]; elim(j => reg[j] === g); }
      }
      if (changed) continue;
      if (level >= 2) {
        for (let i = 0; i < T && !changed; i++) {
          if (!cand[i]) continue;
          const kill = new Set(atk[i]); kill.add(i);
          for (const u of units) {
            if (u.some(j => queen[j])) continue;
            if (u.includes(i)) continue;
            if (u.every(j => !cand[j] || kill.has(j))) { cand[i] = 0; changed = true; break; }
          }
        }
      }
      if (!changed) return false;
    }
    return false;
  }
  function genQueens(N, r, want) {
    // want: {minLevel: 이 단계로 풀려야, notLevel: 이 단계로는 안 풀려야}
    for (let attempt = 0; attempt < 400; attempt++) {
      const q = [], used = new Array(N).fill(false);
      (function place(row) {
        if (row === N) return true;
        for (const c of shuffle(range(N), r)) {
          if (used[c] || (row > 0 && Math.abs(q[row - 1] - c) <= 1)) continue;
          used[c] = true; q[row] = c; if (place(row + 1)) return true; used[c] = false;
        }
        return false;
      })(0);
      const T = N * N, nb = nbrs(N), reg = new Int8Array(T).fill(-1);
      const order = shuffle(range(N), r);
      for (let row = 0; row < N; row++) reg[row * N + q[row]] = order[row];
      let left = T - N;
      while (left) {
        const i = Math.floor(r() * T);
        if (reg[i] >= 0) continue;
        const ns = nb[i].filter(j => reg[j] >= 0);
        if (!ns.length) continue;
        reg[i] = reg[ns[Math.floor(r() * ns.length)]]; left--;
      }
      const qcell = new Set(q.map((c, row) => row * N + c));
      let ok = false;
      for (let fix = 0; fix < 60; fix++) {
        const res = queensSolve(N, reg, 2);
        if (res.count === 1) { ok = true; break; }
        const alt = res.sols.find(s => s.some((c, row) => c !== q[row]));
        const cells = shuffle(alt.map((c, row) => row * N + c).filter(i => !qcell.has(i)), r);
        let moved = false;
        for (const cell of cells) {
          const from = reg[cell];
          const targets = shuffle(nb[cell].map(j => reg[j]).filter(g => g !== from), r);
          if (!targets.length) continue;
          reg[cell] = targets[0];
          if (connected(N, reg, from)) { moved = true; break; }
          reg[cell] = from;
        }
        if (!moved) break;
      }
      if (!ok) continue;
      if (want.minLevel && !queensLogic(N, reg, want.minLevel)) continue;
      if (want.notLevel && queensLogic(N, reg, want.notLevel) && attempt < 200) continue;
      const solution = new Array(T).fill(0); for (let row = 0; row < N; row++) solution[row * N + q[row]] = 1;
      return { type: 'queens', N, reg: Array.from(reg), solution, score: queensSolve(N, reg, 2).nodes };
    }
    return null;
  }
  function connected(N, reg, g) {
    const T = N * N, nb = nbrs(N); let first = -1, total = 0;
    for (let i = 0; i < T; i++) if (reg[i] === g) { total++; if (first < 0) first = i; }
    if (!total) return false;
    const seen = new Uint8Array(T), st = [first]; seen[first] = 1; let n = 0;
    while (st.length) { const x = st.pop(); n++; for (const j of nb[x]) if (!seen[j] && reg[j] === g) { seen[j] = 1; st.push(j); } }
    return n === total;
  }

  // ================= 바둑칸 (흑백 반반, 셋 연속 금지) =================
  // 칸: -1 빈칸, 0 흑, 1 백
  function binLines(N) {
    const L = [];
    for (let i = 0; i < N; i++) { L.push(range(N).map(c => i * N + c)); L.push(range(N).map(r => r * N + i)); }
    return L;
  }
  function binPropagate(N, g, lines) {
    const H = N / 2;
    let changed = true;
    while (changed) {
      changed = false;
      for (const L of lines) {
        let c0 = 0, c1 = 0;
        for (let k = 0; k < N; k++) { const v = g[L[k]]; if (v === 0) c0++; else if (v === 1) c1++; }
        if (c0 > H || c1 > H) return false;
        for (let k = 0; k + 2 < N; k++) {
          const a = g[L[k]], b = g[L[k + 1]], c = g[L[k + 2]];
          if (a >= 0 && a === b && b === c) return false;
          if (a >= 0 && a === b && c < 0) { g[L[k + 2]] = 1 - a; changed = true; }
          else if (b >= 0 && b === c && a < 0) { g[L[k]] = 1 - b; changed = true; }
          else if (a >= 0 && a === c && b < 0) { g[L[k + 1]] = 1 - a; changed = true; }
        }
        if ((c0 === H || c1 === H) && c0 + c1 < N) {
          const fill = c0 === H ? 1 : 0;
          for (let k = 0; k < N; k++) if (g[L[k]] < 0) { g[L[k]] = fill; changed = true; }
        }
      }
    }
    return true;
  }
  function binSolve(N, givens, limit, r, budget) {
    const lines = binLines(N); let count = 0, nodes = 0, sol = null;
    budget = budget || 1e9;
    function rec(g) {
      nodes++;
      if (nodes > budget) return;
      if (!binPropagate(N, g, lines)) return;
      const e = g.indexOf(-1);
      if (e < 0) { count++; if (!sol) sol = g.slice(); return; }
      const vals = r && r() < 0.5 ? [1, 0] : [0, 1];
      for (const v of vals) { const h = g.slice(); h[e] = v; rec(h); if (count >= limit || nodes > budget) return; }
    }
    rec(givens.slice());
    return { count, nodes, sol, aborted: nodes > budget };
  }
  function binEasy(N, givens) { const g = givens.slice(); return binPropagate(N, g, binLines(N)) && g.indexOf(-1) < 0; }
  function genBin(N, r, logicOnly, keepRatio) {
    const T = N * N;
    // 무작위 완성판: 빈판에 몇 칸 뿌리고 풀기
    let full = null;
    while (!full) {
      const g = new Array(T).fill(-1);
      for (const i of shuffle(range(T), r).slice(0, N)) g[i] = r() < 0.5 ? 0 : 1;
      const res = binSolve(N, g, 1, r, 3000);
      if (res.count) full = res.sol;
    }
    const puz = full.slice();
    let kept = T;
    const minKeep = Math.floor(T * (keepRatio || 0));
    let lastNodes = 0;
    for (const i of shuffle(range(T), r)) {
      if (kept <= minKeep) break;
      const v = puz[i]; puz[i] = -1;
      let good;
      if (logicOnly) good = binEasy(N, puz);
      else { const res = binSolve(N, puz, 2, null, 4000); good = res.count === 1 && !res.aborted; if (good) lastNodes = res.nodes; }
      if (good) kept--; else puz[i] = v;
    }
    return { type: 'bin', N, givens: puz, solution: full, score: lastNodes, clues: kept, needsGuess: !binEasy(N, puz) };
  }

  // ================= 난이도 표 =================
  const DIFFS = ['쉬움', '보통', '어려움', '지옥'];
  const TYPES = {
    zip: { name: '한붓길', icon: '〰️' },
    queens: { name: '왕관자리', icon: '👑' },
    bin: { name: '바둑칸', icon: '⚫' },
  };
  function generate(type, diff, seed) {
    const r = rng(seed);
    if (type === 'zip') {
      const cfg = [[5, 9, 4e4, 1], [6, 0, 6e4, 1], [7, 0, 6e4, 2], [8, 0, 6e4, 2]][diff];
      let best = null;
      for (let k = 0; k < cfg[3]; k++) { const p = genZip(cfg[0], r, cfg[1], cfg[2]); if (!best || p.clues < best.clues || (p.clues === best.clues && p.score > best.score)) best = p; }
      return best;
    }
    if (type === 'queens') {
      const cfg = [[6, { minLevel: 1 }], [7, { minLevel: 2 }], [8, { notLevel: 1 }], [9, { notLevel: 2 }]][diff];
      let p = null; while (!p) p = genQueens(cfg[0], r, cfg[1]);
      return p;
    }
    if (type === 'bin') {
      const cfg = [[6, true, 0.45], [8, true, 0], [10, false, 0], [12, false, 0]][diff];
      return genBin(cfg[0], r, cfg[1], cfg[2]);
    }
  }
  // 오늘의 퍼즐: 날짜로 종류(순환) + 요일로 난이도
  function daily(dateStr) {
    const d = new Date(dateStr + 'T00:00:00Z');
    const day = Math.floor(d.getTime() / 864e5);
    const type = ['zip', 'queens', 'bin'][((day % 3) + 3) % 3];
    const dow = d.getUTCDay(); // 0 일
    const diff = [1, 0, 1, 1, 2, 2, 3][dow];
    return { type, diff, seed: 'daily-' + dateStr };
  }

  const API = { rng, generate, daily, zipSolve, queensSolve, queensLogic, binSolve, binEasy, DIFFS, TYPES, nbrs };
  if (typeof module !== 'undefined' && module.exports) module.exports = API; else G.Puzzles = API;
})(typeof globalThis !== 'undefined' ? globalThis : this);
