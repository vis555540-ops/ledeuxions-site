// 3D 목조 물리 모델 (cannon-es). 렌더링 없음 → 브라우저와 node(튜닝·탐색) 양쪽에서 돈다.
// 원칙(형/건축가 지시):
//  · 기둥 밑동·모든 접합은 핀(회전 구속 없음). 철물은 "제한된" 회전·인발 저항만 — 고정단 아님.
//  · 보강 없는 뼈대 = 진짜 메커니즘. 층마다 바닥(지붕)은 한 덩어리 강막(도리·보 포함).
//  · 부재는 서로 뚫고 지나가지 않는다: 가새·합판은 벽 칸(기둥/샛기둥 사이 한 층) 안에만. X 가새끼리 엇갈림은 됨.
//  · 문은 양옆 샛기둥 + 인방. 문 칸은 막을 수 없고, 옆 좁은 칸에 가새를 댈 수 있다.
//  · 지진은 대각선: X:Z = QUAKE_XZ. 커졌다 멈춘 뒤 5초 고요 속에 서 있어야 성공.
import * as C from './lib/cannon-es.js';
export { C };

export const Y0 = 0.12;           // 토대 윗면
export const QUAKE_XZ = [1.0, 1.3]; // 지진 방향 비율 [X, Z] — 형 규칙: Z 쪽이 1.3배

// ===== 가격 (2D 판과 같은 방식: 길이·넓이에 따라) =====
export const PRICE = {
  brace: { base: 30000, perM: 20000 },
  ply: { base: 60000, perM2: 40000 },
  plate: { base: 40000 },
  post: { base: 60000, perM: 40000 },
  // 철근콘크리트 (2D 판과 같은 시공가)
  steelx: { base: 2000000, perM2: 500000 },  // 철골 X가새 프레임 1칸
  rcwall: { base: 3000000, perM2: 700000 },  // RC 전단벽 증설 1칸
  jacket: { base: 1500000, perM: 1500000 },  // 기둥 단면 증설
  frp: { base: 500000, perM: 600000 },       // 탄소섬유 감기
  wing: { base: 1000000, perM: 900000 },     // 날개벽
};
export const BAY_TOOLS = ['ply', 'steelx', 'rcwall'];
export const COL_TOOLS = ['jacket', 'frp', 'wing'];
// 기둥 보강 배율 (2D 판 materials.js 와 같은 값): 전단 V · 접합 휨 M
export const COL_MODS = { jacket: { V: 3.0, M: 2.6, k: 2.0, w: 0.66 }, frp: { V: 2.6, M: 1.3, k: 1.0, w: 0.47 }, wing: { V: 1.8, M: 1.8, k: 2.5, w: 0.45 } }; // k = 휨 강성 배율(2D jk 와 같음)
export const USD_RATE = 1350;
export const usdOf = (krw) => Math.max(5, Math.round(krw / USD_RATE / 5) * 5);

export const TUNE = {
  rho: 480,
  pinF: 2.2e4, plateM: 120, plateF: 2.0,
  baseUp: 7.0e3, holdUp: 3.0,
  braceT: 11000, braceC: 9500, braceLref: 4.0, bracePlate: 1.5, degrade: 0.04,
  plyPerM: 3050,              // 합판 모서리 한 곳 내력 = 이 값 × 칸 길이(m)
  rotBreak: 0.5,
  Amax: 0.19, fx: 0.9, fz: 0.96,
  rise: 4, peak: 1, decay: 1.5, calm: 5,
  dt: 1 / 120,
  // 철근콘크리트 (N, N·m). 오래된 비연성 골조도 옆 힘을 꽤 버틴다 (형 지적 10/12):
  //  실금(층간변위 rcThCr) → 강성 ↓ · 항복(기둥 현 회전 rcThY, 접합 모멘트가 My 에서 멈춤) → 소성 회전이 쌓일수록 내력 ↓(rcCum 에서 잔류 rcResid = 소성힌지 잃음)
  //  전단: 기둥 현 회전(변위/순높이)이 rcGamma 를 넘으면 빗금 파괴. 항복 뒤 연성비 μ 가 클수록 전단 내력 ↓(휨-전단). 짧은 기둥은 순높이가 짧아 먼저.
  panelK: 3e9,
  rcRotK: 2.7e7, rcShortK: 6,
  rcThCr: 0.0012, rcThY: 0.006, rcMy: 1.07e5, rcFootMy: 0.75, rcCum: 0.12, rcResid: 0.12, rcGamma: 0.03, rcGammaShort: 0.015, rcVM: 1.6, rcVdeg: 0.1,
  brickCrack: 0.6, brickDeg: 0.05, brickSlip: 0.06,
  brickPerM: 6e4, sxPerM: 1.2e5, rcwPerM: 2.0e5,
};

// ---------- 벡터 도우미
const V = (a) => new C.Vec3(a[0], a[1], a[2]);
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const mul = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const len = (a) => Math.hypot(a[0], a[1], a[2]);
const norm = (a) => mul(a, 1 / len(a));
export const dist = (a, b) => len(sub(a, b));
function basisQuat(x, y, z) {
  const m00 = x[0], m01 = y[0], m02 = z[0], m10 = x[1], m11 = y[1], m12 = z[1], m20 = x[2], m21 = y[2], m22 = z[2];
  const tr = m00 + m11 + m22; let qw, qx, qy, qz;
  if (tr > 0) { const s = Math.sqrt(tr + 1) * 2; qw = s / 4; qx = (m21 - m12) / s; qy = (m02 - m20) / s; qz = (m10 - m01) / s; }
  else if (m00 > m11 && m00 > m22) { const s = Math.sqrt(1 + m00 - m11 - m22) * 2; qw = (m21 - m12) / s; qx = s / 4; qy = (m01 + m10) / s; qz = (m02 + m20) / s; }
  else if (m11 > m22) { const s = Math.sqrt(1 + m11 - m00 - m22) * 2; qw = (m02 - m20) / s; qx = (m01 + m10) / s; qy = s / 4; qz = (m12 + m21) / s; }
  else { const s = Math.sqrt(1 + m22 - m00 - m11) * 2; qw = (m10 - m01) / s; qx = (m02 + m20) / s; qy = (m12 + m21) / s; qz = s / 4; }
  return new C.Quaternion(qx, qy, qz, qw);
}
function frame(dir, zh) {
  const y = norm(dir);
  let z = sub(zh, mul(y, dot(zh, y)));
  if (len(z) < 1e-6) z = Math.abs(y[1]) < 0.9 ? cross(y, [0, 1, 0]) : cross(y, [1, 0, 0]);
  z = norm(z);
  return { x: cross(y, z), y, z };
}
const r2 = (v) => Math.round(v * 100) / 100;

// =====================================================================
// 단계 → 기하 모델 (절점·기둥·벽 칸). 설계(기둥 추가)에 따라 칸이 나뉜다.
// 단계 형식: { xs, zs, hs:[층높이], cells?:['i,k'], noPost?:['i,k,s'], baseH?:{'i,k':h},
//   doors:[[s,'x'|'z',line,from]], windows:[[s,ax,line,from]], pre:[설계항목], floorKg, roofKg, roof?:[{x0,x1,z0,z1}] }
// 절점 이름: 'i,k,j' (j=0 땅, j=층 바닥/지붕 높이). 문 샛기둥: 'J<칸>L|R' + 'b|t'
// =====================================================================
export function makeModel(L, design = []) {
  const S = L.hs.length;
  const cxm = (L.xs[0] + L.xs.at(-1)) / 2, czm = (L.zs[0] + L.zs.at(-1)) / 2;
  const X = (i) => L.xs[i] - cxm, Z = (k) => L.zs[k] - czm;
  const allCells = L.xs.slice(1).flatMap((_, i) => L.zs.slice(1).map((__, k) => `${i},${k}`));
  // 층마다 바닥 모양 (storyCells 가 없으면 모든 층이 같음 — 위가 좁아지는 건물만 다름)
  const cellsS = [];
  for (let s = 0; s < S; s++) cellsS.push(new Set((L.storyCells && L.storyCells[s]) || L.cells || allCells));
  const cells = cellsS[0];
  const levelY = [Y0];
  for (let s = 0; s < S; s++) levelY.push(levelY[s] + L.hs[s]);
  const baseH = (i, k) => (L.baseH && L.baseH[`${i},${k}`]) || 0;
  const gp = (e, u) => (e.ax === 'x' ? [u, e.line] : [e.line, u]); // 변 위 격자점 (i,k)

  // 층마다 바깥 테두리 변 → 벽 줄(run). 줄 이름은 처음 나온 순서대로 r0, r1, …
  const runIds = {};
  let runN = 0;
  const edgesS = [], runsS = [], gridS = [];
  for (let s = 0; s < S; s++) {
    const cs = cellsS[s], occ = (i, k) => cs.has(`${i},${k}`);
    const edges = [];
    for (const c of cs) {
      const [i, k] = c.split(',').map(Number);
      if (!occ(i, k - 1)) edges.push({ ax: 'x', line: k, from: i, normal: [0, 0, -1] });
      if (!occ(i, k + 1)) edges.push({ ax: 'x', line: k + 1, from: i, normal: [0, 0, 1] });
      if (!occ(i - 1, k)) edges.push({ ax: 'z', line: i, from: k, normal: [-1, 0, 0] });
      if (!occ(i + 1, k)) edges.push({ ax: 'z', line: i + 1, from: k, normal: [1, 0, 0] });
    }
    const grid = new Set();
    edges.forEach((e) => { grid.add(gp(e, e.from).join(',')); grid.add(gp(e, e.from + 1).join(',')); });
    const runMap = {};
    edges.forEach((e) => { const key = `${e.ax}${e.line}${e.normal.join('')}`; (runMap[key] = runMap[key] || { ax: e.ax, line: e.line, normal: e.normal, us: [] }).us.push(e.from); });
    const runs = [];
    Object.values(runMap).forEach((r) => {
      r.us.sort((a, b) => a - b);
      let cur = null;
      r.us.forEach((u) => { if (cur && u === cur.to) cur.to = u + 1; else { cur = { ...r, from: u, to: u + 1 }; delete cur.us; runs.push(cur); } });
    });
    runs.forEach((r) => { const key = `${r.ax}${r.line}${r.normal.join('')}:${r.from}-${r.to}`; if (!(key in runIds)) runIds[key] = 'r' + runN++; r.id = runIds[key]; });
    edgesS.push(edges); runsS.push(runs); gridS.push(grid);
  }
  const edges = edgesS[0], runs = runsS[0];
  const grid = new Set(gridS.flatMap((g) => [...g]));

  // 절점: 층 j 높이에는 아래층(j-1)이나 위층(j)의 테두리 격자점
  const nodes = {};
  for (let j = 0; j <= S; j++) {
    const here = new Set([...(gridS[j - 1] || []), ...(gridS[j] || [])]);
    for (const g of here) {
      const [i, k] = g.split(',').map(Number);
      nodes[`${i},${k},${j}`] = { id: `${i},${k},${j}`, p: [X(i), j === 0 ? Y0 + baseH(i, k) : levelY[j], Z(k)], j, grid: true };
    }
  }
  // 기둥: 기본은 그 층의 모든 테두리 격자점, noPost 로 빼고 설계의 기둥 추가로 더함
  const noPost = new Set(L.noPost || []);
  const added = new Set(design.filter((d) => d.t === 'post').map((d) => d.node));
  const hasPost = (i, k, s) => gridS[s].has(`${i},${k}`) && (!noPost.has(`${i},${k},${s}`) || added.has(`${i},${k},${s}`));
  const posts = [];
  for (const g of grid) {
    const [i, k] = g.split(',').map(Number);
    for (let s = 0; s < S; s++) if (hasPost(i, k, s)) posts.push({ id: `p${i},${k},${s}`, a: `${i},${k},${s}`, b: `${i},${k},${s + 1}`, s, i, k, added: added.has(`${i},${k},${s}`) && noPost.has(`${i},${k},${s}`) });
  }
  // 기둥을 더할 수 있는 자리 (빠진 곳)
  const postSlots = [...noPost].filter((n) => !added.has(n) && nodes[n]).map((n) => n);

  const flag = (list, s, ax, line, u) => (list || []).some((d) => d[0] === s && d[1] === ax && d[2] === line && d[3] === u);
  const studs = [], headers = [], bays = [];
  for (let s = 0; s < S; s++) for (const r of runsS[s]) {
    const cols = [];
    for (let u = r.from; u <= r.to; u++) { const [i, k] = gp(r, u); if (hasPost(i, k, s)) cols.push(u); }
    for (let c = 0; c + 1 < cols.length; c++) {
      const u0 = cols[c], u1 = cols[c + 1];
      const [i0, k0] = gp(r, u0), [i1, k1] = gp(r, u1);
      const nb0 = `${i0},${k0},${s}`, nb1 = `${i1},${k1},${s}`, nt0 = `${i0},${k0},${s + 1}`, nt1 = `${i1},${k1},${s + 1}`;
      let windowy = false;
      for (let u = u0; u < u1; u++) if (flag(L.windows, s, r.ax, r.line, u)) windowy = true;
      const isDoor = u1 - u0 === 1 && flag(L.doors, s, r.ax, r.line, u0);
      const mk = (a0, a1, b0, b1, extra = {}) => {
        const pa0 = nodes[a0].p, pa1 = nodes[a1].p;
        const w = dist([pa0[0], 0, pa0[2]], [pa1[0], 0, pa1[2]]);
        const h = nodes[b0].p[1] - pa0[1];
        bays.push({ id: `${r.id}s${s}:${a0}>${a1}`, run: r.id, ax: r.ax, s, b0: a0, b1: a1, t0: b0, t1: b1, normal: r.normal, w, h, rect: Math.abs(pa0[1] - pa1[1]) < 1e-6, window: windowy, ...extra });
      };
      if (!isDoor) { mk(nb0, nb1, nt0, nt1); continue; }
      // 문: 가운데 1.0 m, 높이 2.1 m. 양옆 샛기둥(층 전체 높이) + 인방(위층 강막에 붙음)
      const p0 = nodes[nb0].p, p1 = nodes[nb1].p, dir = norm(sub([p1[0], 0, p1[2]], [p0[0], 0, p0[2]]));
      const mid = mul(add(p0, p1), 0.5), dw = 0.5;
      const key = `J${r.id}s${s}u${u0}`;
      const jL = (y) => [mid[0] - dir[0] * dw, y, mid[2] - dir[2] * dw], jR = (y) => [mid[0] + dir[0] * dw, y, mid[2] + dir[2] * dw];
      const yb = p0[1], yt = nodes[nt0].p[1];
      nodes[key + 'Lb'] = { id: key + 'Lb', p: jL(yb), j: s }; nodes[key + 'Lt'] = { id: key + 'Lt', p: jL(yt), j: s + 1 };
      nodes[key + 'Rb'] = { id: key + 'Rb', p: jR(yb), j: s }; nodes[key + 'Rt'] = { id: key + 'Rt', p: jR(yt), j: s + 1 };
      studs.push({ id: key + 'L', a: key + 'Lb', b: key + 'Lt', s }, { id: key + 'R', a: key + 'Rb', b: key + 'Rt', s });
      headers.push({ a: jL(yb + 2.1), b: jR(yb + 2.1), s: s + 1 });
      mk(nb0, key + 'Lb', nt0, key + 'Lt');
      mk(key + 'Lb', key + 'Rb', key + 'Lt', key + 'Rt', { door: true });
      mk(key + 'Rb', nb1, key + 'Rt', nt1);
    }
  }
  const bayById = Object.fromEntries(bays.map((b) => [b.id, b]));
  // 가새 = 칸의 대각선만 (그래야 아무 부재도 뚫지 않음)
  const diag = {};
  bays.forEach((b) => { if (b.door) return; diag[key2(b.b0, b.t1)] = b; diag[key2(b.b1, b.t0)] = b; });
  const bbox = { x0: X(0), x1: X(L.xs.length - 1), z0: Z(0), z1: Z(L.zs.length - 1) };
  return { L, S, nodes, posts, studs, headers, bays, bayById, diag, runs, edges, edgesS, cellsS, levelY, cells, X, Z, bbox, postSlots, gp };
}
export const key2 = (a, b) => (a < b ? a + '|' + b : b + '|' + a);

// 설계 항목 → 놓을 수 있나 (안 되면 이유)
export function checkItem(M, design, it) {
  if (it.t === 'brace') {
    if (it.a === it.b) return 'same';
    const bay = M.diag[key2(it.a, it.b)];
    if (!bay) return 'notBay';
    if ([...(M.L.pre || []), ...design].some((d) => d.t === 'brace' && key2(d.a, d.b) === key2(it.a, it.b))) return 'dup';
    return null;
  }
  if (BAY_TOOLS.includes(it.t)) {
    const bay = M.bayById[it.bay];
    if (!bay || bay.door) return 'door';
    if (!bay.rect) return 'slope';
    if ([...(M.L.pre || []), ...design].some((d) => BAY_TOOLS.includes(d.t) && d.t !== 'brick' && d.bay === it.bay)) return 'dup';
    return null;
  }
  if (COL_TOOLS.includes(it.t)) {
    if (!M.posts.some((p) => p.a === it.col)) return 'gone';
    if (design.some((d) => COL_TOOLS.includes(d.t) && d.col === it.col)) return 'dup';
    return null;
  }
  if (it.t === 'plate') return M.nodes[it.node] ? null : 'gone';
  if (it.t === 'post') return M.postSlots.includes(it.node) ? null : 'gone';
  return 'bad';
}
// 기둥을 더하면 칸 이름이 바뀌므로, 없어진 칸에 붙은 항목은 버림
export function cleanDesign(L, design) {
  const M = makeModel(L, design);
  const ok = [];
  for (const d of design) if (!checkItem(M, ok, d) || d.t === 'post') ok.push(d);
  return ok;
}
export function priceOf(M, it) {
  let krw = 0;
  if (it.t === 'brace') krw = PRICE.brace.base + PRICE.brace.perM * dist(M.nodes[it.a].p, M.nodes[it.b].p);
  else if (it.t === 'ply') { const b = M.bayById[it.bay]; krw = PRICE.ply.base + PRICE.ply.perM2 * (b ? b.w * b.h : 0); }
  else if (it.t === 'plate') krw = PRICE.plate.base;
  else if (it.t === 'steelx' || it.t === 'rcwall') { const b = M.bayById[it.bay]; krw = PRICE[it.t].base + PRICE[it.t].perM2 * (b ? b.w * b.h : 0); }
  else if (COL_TOOLS.includes(it.t)) { const p = M.posts.find((q) => q.a === it.col); krw = PRICE[it.t].base + PRICE[it.t].perM * (p ? M.nodes[p.b].p[1] - M.nodes[p.a].p[1] : 3); }
  else if (it.t === 'post') { const n = M.nodes[it.node]; const t = M.nodes[it.node.replace(/,(\d+)$/, (m, j) => ',' + (+j + 1))]; krw = PRICE.post.base + PRICE.post.perM * (t.p[1] - n.p[1]); }
  krw = Math.round(krw / 1000) * 1000;
  return { krw, usd: usdOf(krw) };
}
export function costOf(L, design) {
  const M = makeModel(L, design);
  return design.reduce((s, d) => { const p = priceOf(M, d); return { krw: s.krw + p.krw, usd: s.usd + p.usd }; }, { krw: 0, usd: 0 });
}
// 방향·층별 벽 줄 저항 [가새 하나=1, X=2, 합판≈2.8]
export function capacitySummary(L, design) {
  const M = makeModel(L, design);
  const all = [...(L.pre || []), ...design];
  const lines = {}; // run+story → 값
  M.bays.forEach((b) => {
    const nb = all.filter((d) => d.t === 'brace' && M.diag[key2(d.a, d.b)] === b).length;
    const ply = all.some((d) => d.t === 'ply' && d.bay === b.id);
    const panel = all.filter((d) => d.bay === b.id).reduce((a, d) => a + ({ steelx: 3, rcwall: 5, brick: 1 }[d.t] || 0), 0);
    const v = Math.min(nb, 2) + (ply ? 2.8 : 0) + panel;
    const k = `${b.run}@${b.s}`;
    lines[k] = lines[k] || { ax: b.ax, s: b.s, v: 0 };
    lines[k].v += v;
  });
  const stories = [];
  for (let s = 0; s < M.S; s++) {
    const ls = Object.values(lines).filter((l) => l.s === s);
    stories.push({ x: ls.filter((l) => l.ax === 'x').reduce((a, l) => a + l.v, 0), z: ls.filter((l) => l.ax === 'z').reduce((a, l) => a + l.v, 0), empty: ls.filter((l) => l.v === 0).length, lines: ls.length });
  }
  return { stories };
}

const G_GROUND = 1, G_PAD = 2, G_HUT = 4;

// =====================================================================
// 물리 세계 만들기
// =====================================================================
export function buildSim(L, design = [], tune = {}) {
  const T = { ...TUNE, ...tune, Amax: TUNE.Amax * (L.quake || 1) };
  // 단계 난이도 맞춤: 큰 집(무거운 여러 층)은 부재·접합도 그만큼 굵다고 보고 내력을 키움
  const sg = L.strength || 1;
  // 콘크리트 단계는 골조(기둥) 내력은 그대로, 판(벽돌·가새틀·전단벽) 내력만 맞춤
  for (const k of (L.mat === 'rc' ? ['sxPerM', 'rcwPerM'] : ['pinF', 'plateM', 'baseUp', 'braceT', 'braceC', 'plyPerM'])) T[k] *= sg;
  const M = makeModel(L, design);
  const pre = L.pre || [];
  // 보강 판을 넣은 칸의 벽돌 채움벽은 헐고 바꾼다 (한 칸에 판 둘이 겹치지 않게)
  const taken = new Set(design.filter((d) => d.t === 'steelx' || d.t === 'rcwall').map((d) => d.bay));
  const items = [...pre.filter((d) => !(d.t === 'brick' && taken.has(d.bay))).map((d) => ({ ...d, pre: true })), ...design.map((d, idx) => ({ ...d, idx }))];
  const world = new C.World({ gravity: new C.Vec3(0, -9.81, 0) });
  world.broadphase = new C.NaiveBroadphase();
  world.solver.iterations = L.mat === "rc" ? (L.iters || 40 + 16 * L.hs.length) : 40; // 층이 많을수록 더 돌려야 수렴
  world.solver.tolerance = 1e-9;
  world.allowSleep = false;
  world.defaultContactMaterial.friction = 0.6;
  world.defaultContactMaterial.restitution = 0.05;

  const parts = [], joints = [], braces = [], panels = [], events = [];
  const plates = new Set(items.filter((d) => d.t === 'plate').map((d) => d.node));
  const { bbox } = M;

  const ground = new C.Body({ mass: 0, type: C.Body.STATIC, collisionFilterGroup: G_GROUND, collisionFilterMask: G_HUT });
  ground.addShape(new C.Plane());
  ground.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
  ground.position.set(0, -0.22, 0);
  world.addBody(ground);

  // 기초 + 토대 (한 몸, 땅과 함께 흔들림)
  const pad = new C.Body({ mass: 0, type: C.Body.KINEMATIC, collisionFilterGroup: G_PAD, collisionFilterMask: G_HUT });
  const padShapes = [];
  const addPad = (he, off, kind, q = [0, 0, 0, 1]) => { pad.addShape(new C.Box(V(he)), V(off), new C.Quaternion(...q)); padShapes.push({ he, off, q, kind }); };
  const hx = (bbox.x1 - bbox.x0) / 2 + 0.9, hz = (bbox.z1 - bbox.z0) / 2 + 0.9;
  addPad([hx, 0.2, hz], [0, -0.2, 0], 'pad');
  for (const blk of L.terrain || []) {
    // 비탈: 높은 땅 덩어리 (x/z 범위는 격자 좌표 기준)
    const x0 = (blk.x0 ?? bbox.x0 - 0.9), x1 = (blk.x1 ?? bbox.x1 + 0.9), z0 = blk.z0, z1 = blk.z1;
    addPad([(x1 - x0) / 2, blk.h / 2, (z1 - z0) / 2], [(x0 + x1) / 2, blk.h / 2, (z0 + z1) / 2], 'earth');
  }
  M.edges.forEach((e) => {
    const [i0, k0] = M.gp(e, e.from), [i1, k1] = M.gp(e, e.from + 1);
    const a = M.nodes[`${i0},${k0},0`].p, b = M.nodes[`${i1},${k1},0`].p;
    if (Math.abs(a[1] - b[1]) > 1e-6) return;
    const c = mul(add(a, b), 0.5), l = dist(a, b) + 0.14;
    addPad(e.ax === 'x' ? [l / 2, 0.06, 0.07] : [0.07, 0.06, l / 2], [c[0], a[1] - 0.06, c[2]], 'sill');
  });
  if (L.ribbon && L.ribbon.s === 0) for (const b of M.bays) {
    // 띠창 허리벽 (1층): 기둥 사이 낮은 벽 — 이것 때문에 기둥이 짧아진다
    if (!b.window || b.s !== 0) continue;
    const p0 = M.nodes[b.b0].p, p1 = M.nodes[b.b1].p, c = mul(add(p0, p1), 0.5);
    const l = b.w - (L.colW || 0.45) - 0.12, hh = L.ribbon.sill / 2;
    addPad(b.ax === 'x' ? [l / 2, hh, 0.1] : [0.1, hh, l / 2], [c[0], Y0 + hh, c[2]], 'spandrel');
  }
  world.addBody(pad);
  parts.push({ id: 'pad', kind: 'pad', body: pad, shapes: padShapes });

  // 층 강막: 도리·보 + 바닥(또는 지붕) 한 덩어리
  const levels = [null];
  const RC = L.mat === 'rc';
  for (let j = 1; j <= M.S; j++) {
    const y = M.levelY[j], top = j === M.S;
    const cellsL = M.cellsS[j - 1], edgesL = M.edgesS[j - 1];
    let footArea = 0;
    for (const c of cellsL) { const [i, k] = c.split(',').map(Number); footArea += (L.xs[i + 1] - L.xs[i]) * (L.zs[k + 1] - L.zs[k]); }
    const shapes = [];
    const body = new C.Body({ mass: 1, collisionFilterGroup: G_HUT, collisionFilterMask: G_GROUND | G_PAD, linearDamping: 0.02, angularDamping: 0.04 });
    const ctr = [(bbox.x0 + bbox.x1) / 2, y + (top ? 0.45 : 0.1), (bbox.z0 + bbox.z1) / 2];
    // 무게중심: 실제 바닥 칸들의 중심 (L자 등 비대칭이면 치우침)
    let gx = 0, gz = 0;
    for (const c of cellsL) { const [i, k] = c.split(',').map(Number); const a = (L.xs[i + 1] - L.xs[i]) * (L.zs[k + 1] - L.zs[k]); gx += a * (M.X(i) + M.X(i + 1)) / 2; gz += a * (M.Z(k) + M.Z(k + 1)) / 2; }
    ctr[0] = gx / footArea; ctr[2] = gz / footArea;
    if (L.balcony && j === L.balcony.j) { /* 발코니: 한쪽으로 내민 무거운 바닥 → 무게중심이 치우침 */ }
    body.position.set(...ctr);
    const piece = (p1, p2, a, b, zh, kind) => {
      const d = sub(p2, p1), f = frame(d, zh), l = len(d);
      const he = [a / 2, l / 2, b / 2], q = basisQuat(f.x, f.y, f.z);
      const off = sub(mul(add(p1, p2), 0.5), ctr);
      body.addShape(new C.Box(V(he)), V(off), q);
      shapes.push({ he, off, q: [q.x, q.y, q.z, q.w], kind });
    };
    const bd = RC ? 0.55 : 0.15, bw = RC ? 0.35 : 0.12, yb = RC ? y - bd / 2 + 0.1 : y + 0.075;
    edgesL.forEach((e) => {
      const [i0, k0] = M.gp(e, e.from), [i1, k1] = M.gp(e, e.from + 1);
      const a = [M.X(i0), yb, M.Z(k0)], b = [M.X(i1), yb, M.Z(k1)];
      const ext = e.ax === 'x' ? [bw / 2, 0, 0] : [0, 0, bw / 2];
      piece(sub(a, ext), add(b, ext), bd, bw, e.ax === 'x' ? [0, 0, 1] : [1, 0, 0], RC ? 'rbeam' : 'beam');
    });
    M.headers.filter((h) => h.s === j).forEach((h) => piece(h.a, h.b, 0.12, 0.1, [0, 1, 0], 'header'));
    let mass = 10 * edgesL.length * 3;
    if (RC) {
      // 콘크리트 바닥판(칸마다) + 지붕이면 난간벽. 무거움
      for (const c of cellsL) {
        const [i, k] = c.split(',').map(Number);
        const x0 = M.X(i), x1 = M.X(i + 1), z0 = M.Z(k), z1 = M.Z(k + 1);
        piece([x0 - 0.15, y + 0.03, (z0 + z1) / 2], [x1 + 0.15, y + 0.03, (z0 + z1) / 2], z1 - z0 + 0.3, 0.2, [0, 1, 0], 'slab');
      }
      if (top) edgesL.forEach((e) => {
        const [i0, k0] = M.gp(e, e.from), [i1, k1] = M.gp(e, e.from + 1);
        const o = mul(e.normal, 0.1);
        piece(add([M.X(i0), y + 0.55, M.Z(k0)], o), add([M.X(i1), y + 0.55, M.Z(k1)], o), 0.7, 0.15, e.ax === 'x' ? [0, 0, 1] : [1, 0, 0], 'parapet');
      });
      mass += footArea * (top ? (L.roofKg || 380) : (L.floorKg || 450));
      if (top && L.tank) {
        // 옥상 물탱크: 무겁고 높이 있음
        piece([ctr[0] - 1.3, y + 0.15 + L.tank.h / 2, ctr[2]], [ctr[0] + 1.3, y + 0.15 + L.tank.h / 2, ctr[2]], L.tank.h, 2.2, [0, 1, 0], 'tank');
        for (const sx of [-1, 1]) for (const sz of [-1, 1]) piece([ctr[0] + sx * 1.1, y + 0.1, ctr[2] + sz * 0.9], [ctr[0] + sx * 1.1, y + 0.2, ctr[2] + sz * 0.9], 0.15, 0.15, [0, 0, 1], 'rbeam');
        mass += L.tank.kg;
      }
    } else if (!top) {
      // 바닥판(칸마다 얇은 판) — 위층 바닥
      for (const c of cellsL) {
        const [i, k] = c.split(',').map(Number);
        const x0 = M.X(i), x1 = M.X(i + 1), z0 = M.Z(k), z1 = M.Z(k + 1);
        piece([x0 + 0.06, y + 0.17, (z0 + z1) / 2], [x1 - 0.06, y + 0.17, (z0 + z1) / 2], z1 - z0 - 0.12, 0.04, [0, 1, 0], 'floor');
      }
      mass += footArea * (L.floorKg || 70);
      if (L.balcony && L.balcony.j === j) {
        const bl = L.balcony; // { j, side:'x+'|'z+', depth, kg }
        const { x0, x1, z0, z1 } = bbox;
        const bx = bl.side === 'z+' ? [x0 + 0.3, x1 - 0.3, z1, z1 + bl.depth] : [x1, x1 + bl.depth, z0 + 0.3, z1 - 0.3];
        piece([bx[0], y + 0.12, (bx[2] + bx[3]) / 2], [bx[1], y + 0.12, (bx[2] + bx[3]) / 2], bx[3] - bx[2], 0.12, [0, 1, 0], 'floor');
        // 난간
        const yr = y + 1.1;
        if (bl.side === 'z+') piece([bx[0], yr, bx[3] - 0.04], [bx[1], yr, bx[3] - 0.04], 0.06, 0.06, [0, 0, 1], 'rail');
        else piece([bx[1] - 0.04, yr, bx[2]], [bx[1] - 0.04, yr, bx[3]], 0.06, 0.06, [1, 0, 0], 'rail');
        mass += bl.kg;
      }
    } else {
      // 지붕: 날개마다 박공(서까래·마룻대·중도리). 무거운 지붕은 기와 판까지
      const wings = L.roof || [{ x0: bbox.x0, x1: bbox.x1, z0: bbox.z0, z1: bbox.z1 }];
      const ys = y + 0.15;
      for (const w of wings) {
        const alongX = (w.x1 - w.x0) >= (w.z1 - w.z0);
        const span = alongX ? w.z1 - w.z0 : w.x1 - w.x0, lng = alongX ? w.x1 - w.x0 : w.z1 - w.z0;
        const rise = w.rise || Math.min(1.4, span * 0.37), over = 0.35, slope = rise / (span / 2);
        const cA = alongX ? (w.z0 + w.z1) / 2 : (w.x0 + w.x1) / 2; // 마룻대 위치(가로)
        const P = (a, h, c) => (alongX ? [a, h, c] : [c, h, a]); // a = 길이 방향, c = 가로 방향
        const a0 = alongX ? w.x0 : w.z0;
        const n = Math.max(2, Math.ceil(lng / 1.9));
        for (let r = 0; r <= n; r++) for (const sg of [1, -1]) {
          const a = a0 + (lng * r) / n;
          const foot = P(a, ys - over * slope + 0.08, cA + sg * (span / 2 + over)), topP = P(a, ys + rise + 0.08, cA);
          piece(foot, topP, 0.06, 0.14, alongX ? [0, 1, 0] : [0, 1, 0], 'rafter');
        }
        piece(P(a0 - 0.4, ys + rise + 0.16, cA), P(a0 + lng + 0.4, ys + rise + 0.16, cA), 0.18, 0.08, [0, 1, 0], 'ridge');
        for (const sg of [1, -1]) for (const fr of [0.3, 0.65, 1.0]) {
          const c = cA + sg * (span / 2) * (1 - fr), h = ys + rise * fr + 0.19;
          piece(P(a0 - 0.4, h, c), P(a0 + lng + 0.4, h, c), 0.07, 0.07, [0, 1, 0], 'purlin');
        }
        if (L.roofStyle === 'heavy') for (const sg of [1, -1]) {
          // 기와 판: 경사면 하나를 두꺼운 판으로
          const lo = P(a0 + lng / 2, ys - over * slope + 0.3, cA + sg * (span / 2 + over)), hi = P(a0 + lng / 2, ys + rise + 0.3, cA);
          const d = sub(hi, lo), f = frame(d, alongX ? [1, 0, 0] : [0, 0, 1]);
          const he = [(lng + 0.8) / 2, len(d) / 2, 0.06], q = basisQuat(f.z, f.y, mul(f.x, -1));
          const off = sub(mul(add(lo, hi), 0.5), ctr);
          body.addShape(new C.Box(V([he[0], he[1], he[2]])), V(off), q);
          shapes.push({ he, off, q: [q.x, q.y, q.z, q.w], kind: 'tile' });
        }
      }
      mass += footArea * (L.roofKg || 60);
    }
    body.mass = mass; body.updateMassProperties();
    world.addBody(body);
    // 물탱크는 무게중심을 옮기지 않게 지붕 가운데에 둠 (ctr 위)
    const part = { id: 'lv' + j, kind: top ? 'roof' : 'floor', body, shapes };
    parts.push(part);
    levels.push(body);
  }
  const primary = (nid) => { const n = M.nodes[nid]; return n.j === 0 ? pad : levels[n.j]; };

  function member(id, kind, p1, p2, a, b, zh, opts = {}) {
    const d = sub(p2, p1), Lm = len(d) - (opts.trim || 0) * 2;
    const f = frame(d, zh);
    const he = [a / 2, Lm / 2, b / 2];
    const mass = a * b * Lm * (opts.rho || T.rho);
    const body = new C.Body({ mass, collisionFilterGroup: G_HUT, collisionFilterMask: G_GROUND | G_PAD, linearDamping: 0.02, angularDamping: 0.04 });
    body.addShape(new C.Box(V(he)));
    const c = add(mul(add(p1, p2), 0.5), opts.off || [0, 0, 0]);
    body.position.set(c[0], c[1], c[2]);
    body.quaternion.copy(basisQuat(f.x, f.y, f.z));
    world.addBody(body);
    const part = { id, kind, body, shapes: [{ he, off: [0, 0, 0], q: [0, 0, 0, 1], kind }], item: opts.item };
    parts.push(part);
    return part;
  }
  function pin(kind, A, B, node, cap, extra = {}) {
    const p = V(node);
    const c = new C.PointToPointConstraint(A, A.pointToLocalFrame(p), B, B.pointToLocalFrame(p), 1e9);
    c.collideConnected = false;
    world.addConstraint(c);
    const j = { kind, c, A, B, node: node.slice(), cap, f: 0, broken: false, ...extra };
    joints.push(j);
    return j;
  }
  function plated(kind, A, B, node, cap, Mlim) {
    const c = new C.LockConstraint(A, B, { maxForce: 1e9 });
    const p = V(node);
    c.pivotA.copy(A.pointToLocalFrame(p)); c.pivotB.copy(B.pointToLocalFrame(p));
    // cannon 의 maxForce 는 한 스텝 충격량 한계 → 힘×dt
    for (const r of [c.rotationalEquation1, c.rotationalEquation2, c.rotationalEquation3]) { r.maxForce = Mlim * T.dt; r.minForce = -Mlim * T.dt; }
    c.collideConnected = false;
    world.addConstraint(c);
    const j = { kind, c, A, B, node: node.slice(), cap, f: 0, broken: false, q0: A.quaternion.inverse().mult(B.quaternion), plate: true };
    joints.push(j);
    return j;
  }
  const relAngle = (j) => {
    const q = j.A.quaternion.inverse().mult(j.B.quaternion);
    const d = j.q0.inverse().mult(q);
    return 2 * Math.acos(Math.min(1, Math.abs(d.w)));
  };

  // 기둥·샛기둥: 위아래 핀. 철물이면 제한된 회전 저항
  const rcCols = [];
  const colMod = {};
  items.forEach((d) => { if (COL_TOOLS.includes(d.t)) colMod[d.col] = d; });
  if (RC) for (const v of M.posts) {
    const pa = M.nodes[v.a].p, pb = M.nodes[v.b].p;
    const mod = colMod[v.a], mf = mod ? COL_MODS[mod.t] : { V: 1, M: 1, w: 0 };
    const w0 = L.colW || 0.45, w = Math.max(w0, mf.w || 0) + (mod && mod.t === 'jacket' ? 0.2 : 0);
    const part = member('p' + v.a, 'col', [pa[0], pa[1] + 0.01, pa[2]], [pb[0], pb[1] - 0.1, pb[2]], w, w, [0, 0, 1], { rho: 2400 });
    part.mod = mod ? mod.t : null; part.item = mod && !mod.pre ? mod.idx : undefined; part.col = v.a;
    if (mod && mod.t === 'wing') {
      // 날개벽: 기둥 양옆, 그 층에 벽 줄이 있는 방향으로 짧은 벽
      const sh = part.shapes;
      const dirs = M.edgesS[v.s].filter((e) => { const g0 = M.gp(e, e.from).join(','), g1 = M.gp(e, e.from + 1).join(','); return g0 === `${v.i},${v.k}` || g1 === `${v.i},${v.k}`; })
        .map((e) => { const g0 = M.gp(e, e.from); const sgn = (g0[0] === v.i && g0[1] === v.k) ? 1 : -1; return e.ax === 'x' ? [sgn, 0, 0] : [0, 0, sgn]; });
      const hh = (pb[1] - pa[1]) / 2 - 0.05;
      for (const d of dirs) {
        const he = d[0] ? [0.4, hh, 0.12] : [0.12, hh, 0.4];
        const off = [d[0] * (w / 2 + 0.4), 0, d[2] * (w / 2 + 0.4)];
        part.body.addShape(new C.Box(V(he)), V(off));
        sh.push({ he, off, q: [0, 0, 0, 1], kind: 'wing' });
      }
      part.body.updateMassProperties();
    }
    const sc = (L.colScale || 1);
    const bottomGround = M.nodes[v.a].j === 0;
    const h = pb[1] - pa[1];
    const short = L.ribbon && L.ribbon.s === v.s && L.ribbon.cols.includes(`${v.i},${v.k}`);
    const hEff = short ? L.ribbon.hEff : h;
    // 휨 항복 모멘트: 짧은 기둥은 순높이가 짧아 같은 My 로도 옆 힘(2My/순높이)이 큼 → 몸통 길이 h 기준으로 환산
    // 아래층 기둥일수록 굵고(위 무게를 짐) 축력 덕분에 휨 내력도 큼
    const fN = 0.5 + 0.5 * (M.S - v.s);
    // 단, 전단 내력(모멘트로 환산 rcVM×My×전단배율)을 넘을 수는 없음 → 짧은 기둥은 전단 한계에서 먼저 멈추고 미끄러지다 빗금 파괴
    const My = T.rcMy * fN * Math.min(sc * mf.M * (h / hEff), T.rcVM * mf.V);
    const MyB = bottomGround ? My * T.rcFootMy : My;
    const jb = plated(bottomGround ? 'footing' : 'rcjoint', primary(v.a), part.body, pa, T.pinF * 1e3, MyB);
    const jt = plated('rcjoint', primary(v.b), part.body, pb, T.pinF * 1e3, My);
    jb.My = MyB; jt.My = My;
    // 콘크리트 골조는 벽·가새보다 무르다: 회전 구속을 스프링처럼(강성 rcRotK) → 벽이 힘을 먼저 받음
    const kOf = (j) => T.rcRotK * fN * (mf.k || 1) * (j === jb && bottomGround ? 0.5 : 1) * (short ? (h / L.ribbon.hEff) ** 3 : 1);
    // 휨(r1·r2)만 스프링. 기둥 비틀림(r3, 수직축)은 거의 없음 — 그래야 층 전체가 벽 쪽을 축으로 비틀릴 수 있다
    for (const j of [jb, jt]) {
      j.k0 = kOf(j);
      for (const q of [j.c.rotationalEquation1, j.c.rotationalEquation2]) q.setSpookParams(j.k0, 4, T.dt);
      const r3 = j.c.rotationalEquation3; r3.setSpookParams(j.k0 * 0.02, 4, T.dt); r3.maxForce = j.My * 0.05 * T.dt; r3.minForce = -r3.maxForce;
    }
    for (const j of [jb, jt]) for (const q of [j.c.equationX, j.c.equationY, j.c.equationZ]) q.setSpookParams(T.panelK, 3, T.dt); // 기둥 축·위치는 단단히
    const upB = primary(v.b), loB = primary(v.a);
    // 연성: 단면 증설·탄소섬유는 구속이 좋아 소성 회전을 더 견딤
    const duct = mod ? { jacket: 2.2, frp: 2.6, wing: 1.4 }[mod.t] : 1;
    rcCols.push({ id: v.a, s: v.s, part, jb, jt, h, hEff, short, mM: mf.M * sc, mV: mf.V, duct, v: 0, broken: false,
      mu: 0, cum: 0, deg: 1, te0: 0, dmg: 0,
      upB, loB, upL: upB.pointToLocalFrame(V(pb)), loL: loB.pointToLocalFrame(V(pa)), d0: [pb[0] - pa[0], pb[2] - pa[2]], d0L: loB.vectorToLocalFrame(V(sub(pb, pa))) });
  }
  const vert = RC ? [] : [...M.posts.map((p) => ({ ...p, kind: 'post', w: 0.12 })), ...M.studs.map((p) => ({ ...p, kind: 'stud', w: 0.09 }))];
  for (const v of vert) {
    const pa = M.nodes[v.a].p, pb = M.nodes[v.b].p;
    const part = member(v.id, v.kind, [pa[0], pa[1] + 0.012, pa[2]], pb, v.w, v.w, [0, 0, 1]);
    for (const [nid, isBase] of [[v.a, true], [v.b, false]]) {
      const P = primary(nid), pl = plates.has(nid), ground = M.nodes[nid].j === 0;
      const kind = ground ? 'base' : 'frame';
      const cap = T.pinF * (pl ? T.plateF : 1);
      const j = pl ? plated(kind, P, part.body, M.nodes[nid].p, cap, T.plateM) : pin(kind, P, part.body, M.nodes[nid].p, cap);
      // 아래쪽 끝은 뽑힘(인발) 검사: 땅이면 기초, 위층이면 바닥에서
      if (isBase) j.up = (ground ? T.baseUp : T.baseUp * 1.6) * (pl ? T.holdUp : 1);
      // 합판벽 끝 기둥인데 홀다운이 없음 → 뽑히면 결과 창에서 '양 끝 홀다운' 팁 (표시용 표식)
      if (isBase && !pl) j.plyEnd = items.some((d) => d.t === 'ply' && M.bayById[d.bay] && [M.bayById[d.bay].b0, M.bayById[d.bay].b1].includes(nid));
    }
  }

  // 플레이어 보강 + 처음부터 있던 것
  const braceCount = {};
  items.forEach((d) => {
    const item = d.pre ? undefined : d.idx;
    if (d.t === 'brace') {
      const bay = M.diag[key2(d.a, d.b)];
      if (!bay) return;
      const pa = M.nodes[d.a].p, pb = M.nodes[d.b].p;
      const nrm = bay.normal; braceCount[bay.id] = (braceCount[bay.id] || 0) + 1;
      const off = mul(nrm, 0.11 + 0.05 * (braceCount[bay.id] - 1));
      const part = member('brace' + (item ?? 'pre' + braceCount[bay.id] + bay.id), 'brace', pa, pb, 0.10, 0.045, nrm, { trim: 0.1, off, item });
      part.pre = d.pre;
      const e1 = pin('braceEnd', primary(d.a), part.body, pa, Infinity);
      const e2 = pin('braceEnd', primary(d.b), part.body, pb, Infinity);
      const Lb = dist(pa, pb);
      const capT = T.braceT * Math.min(plates.has(d.a) ? T.bracePlate : 1, plates.has(d.b) ? T.bracePlate : 1);
      const capC = T.braceC * Math.max(0.6, Math.min(1.3, (T.braceLref / Lb) ** 2));
      braces.push({ item, part, ends: [e1, e2], a: pa, b: pb, capT, capC, ax: 0, lastSign: 0, cycles: 0, ratio: 0, broken: false });
    } else if (d.t === 'ply' || d.t === 'brick' || d.t === 'rcwall' || d.t === 'steelx') {
      const bay = M.bayById[d.bay];
      if (!bay || bay.door || !bay.rect) return;
      const n = [bay.b0, bay.b1, bay.t1, bay.t0].map((id) => M.nodes[id].p);
      const spec = {
        ply: { th: 0.018, off: 0.09, rho: 560, perM: T.plyPerM, inset: 0.04 },
        brick: { th: 0.2, off: 0, rho: 1500, perM: T.brickPerM * (L.brickMul || 1), inset: (L.colW || 0.45) + 0.05 },
        rcwall: { th: 0.2, off: 0, rho: 2400, perM: T.rcwPerM, inset: (L.colW || 0.45) + 0.05 },
        steelx: { th: 0.16, off: 0.32, rho: 0, perM: T.sxPerM, inset: 0.3 },
      }[d.t];
      const off = mul(bay.normal, spec.off);
      const top = d.t === 'ply' ? 0 : -0.45; // 콘크리트 보 밑까지
      const p1 = add(mul(add(n[0], n[1]), 0.5), [0, d.t === 'ply' ? 0.03 : 0.02, 0]), p2 = add(mul(add(n[3], n[2]), 0.5), [0, top, 0]);
      let part;
      if (d.t === 'steelx') {
        // 철골 X가새 프레임: 테두리 + 대각선 둘을 한 몸으로
        const dir = norm(sub(n[1], n[0])), hw = (bay.w - spec.inset) / 2, hh = (p2[1] - p1[1]) / 2;
        const c = add(mul(add(p1, p2), 0.5), off);
        const body = new C.Body({ mass: 140 * bay.w + 80 * hh * 2, collisionFilterGroup: G_HUT, collisionFilterMask: G_GROUND | G_PAD, linearDamping: 0.02, angularDamping: 0.04 });
        body.position.set(...c);
        const shapes = [];
        const sp = (pa, pb, a, b, kind) => {
          const dd = sub(pb, pa), f = frame(dd, bay.normal), l = len(dd);
          const he = [a / 2, l / 2, b / 2], q = basisQuat(f.x, f.y, f.z), o = sub(mul(add(pa, pb), 0.5), c);
          body.addShape(new C.Box(V(he)), V(o), q); shapes.push({ he, off: o, q: [q.x, q.y, q.z, q.w], kind });
        };
        const P = (u, v) => add(c, add(mul(dir, u * hw), [0, v * hh, 0]));
        sp(P(-1, -1), P(1, 1), 0.16, 0.16, 'steel'); sp(P(1, -1), P(-1, 1), 0.16, 0.16, 'steel');
        sp(P(-1, -1), P(1, -1), 0.14, 0.18, 'steel'); sp(P(-1, 1), P(1, 1), 0.14, 0.18, 'steel');
        sp(P(-1, -1), P(-1, 1), 0.14, 0.18, 'steel'); sp(P(1, -1), P(1, 1), 0.14, 0.18, 'steel');
        body.updateMassProperties();
        world.addBody(body);
        part = { id: 'sx' + (item ?? 'pre' + bay.id), kind: 'steelx', body, shapes, item };
        parts.push(part);
      } else part = member(d.t + (item ?? 'pre' + bay.id), d.t, p1, p2, bay.w - spec.inset, spec.th, bay.normal, { off, item, rho: spec.rho });
      part.pre = d.pre;
      // 판 모서리: 미는 힘(가로)을 받는다. 세로로는 제한까지만 — 바닥 무게는 기둥이 진다
      const corners = [bay.b0, bay.b1, bay.t1, bay.t0].map((id) => {
        const cap = spec.perM * bay.w * (plates.has(id) ? 1.3 : 1);
        const j = pin('plyCorner', primary(id), part.body, M.nodes[id].p, cap, { horiz: true });
        const ey = j.c.equationY; ey.maxForce = cap * 0.8 * T.dt; ey.minForce = -cap * 0.8 * T.dt;
        if (d.t !== 'ply') for (const q of j.c.equations) q.setSpookParams(T.panelK, 3, T.dt); // 콘크리트·철골 판은 단단히
        // 벽 면 밖(면외) 방향: 벽·가새틀은 면 안으로만 힘을 받는다. 위 모서리의 면외 구속을 약하게 → 층이 벽을 축으로 비틀 수 있음
        const inEq = bay.ax === 'x' ? j.c.equationX : j.c.equationZ, outEq = bay.ax === 'x' ? j.c.equationZ : j.c.equationX;
        j.inAx = bay.ax;
        if (d.t !== 'ply' && (id === bay.t0 || id === bay.t1)) { outEq.maxForce = cap * 0.05 * T.dt; outEq.minForce = -outEq.maxForce; }
        if (d.t === 'brick') {
          // 벽돌: 단단하지만 내력에 닿으면 미끄러지며(빗금 금·줄눈 미끄럼) 그 힘만 버팀. 미끄럼이 쌓이면 모서리가 떨어져 나감
          j.brick = true; j.slip = 0;
          inEq.maxForce = cap * T.dt; inEq.minForce = -cap * T.dt;
        }
        return j;
      });
      panels.push({ item, part, corners, broken: false, kind: d.t });
    } else if (d.t === 'plate') {
      const body = primary(d.node);
      const part = parts.find((p) => p.body === body);
      part.plates = part.plates || [];
      part.plates.push({ node: d.node, item, p: M.nodes[d.node].p, pre: d.pre });
    }
  });

  const hutBodies = parts.filter((p) => p.kind !== 'pad').map((p) => p.body);
  const top = levels[M.S];
  for (const b of hutBodies) b.addEventListener('collide', (e) => {
    if (!sim.breaksOn) return;
    const v = Math.abs(e.contact.getImpactVelocityAlongNormal());
    if (v > 2.2) {
      const p = b.position;
      events.push({ type: 'thud', pos: [p.x, Math.max(0, p.y - 0.3), p.z], power: Math.min(1, v / 7), big: levels.includes(b) });
    }
  });

  const sim = {
    M, L, world, parts, joints, braces, panels, events, rcCols, pad, levels, top, T, C,
    t: 0, tq: -1, fadeAt: null, breaksOn: false, h0: [], shake: 0, maxDrop: 0, maxTwist: 0, firstFail: null,
    groundAt(t) {
      const { Amax, fx, fz, rise, peak, decay } = T;
      let A;
      if (t < 0) A = 0;
      else if (t < rise) A = Amax * Math.pow(t / rise, 1.3);
      else if (t < rise + peak) A = Amax;
      else A = Amax * Math.pow(Math.max(0, 1 - (t - rise - peak) / decay), 2);
      if (this.fadeAt != null) A *= Math.max(0, 1 - (t - this.fadeAt) / 1.2);
      const w1 = 2 * Math.PI * fx, w2 = 2 * Math.PI * fz;
      const kx = QUAKE_XZ[0] / Math.max(...QUAKE_XZ), kz = QUAKE_XZ[1] / Math.max(...QUAKE_XZ);
      const x = kx * (0.75 * Math.sin(w1 * t) + 0.3 * Math.sin(2.37 * w1 * t + 0.7));
      const z = kz * (0.75 * Math.sin(w2 * t + 0.35) + 0.3 * Math.sin(2.29 * w2 * t + 1.0));
      return [A * x, A * z, A / Amax];
    },
    step() {
      const dt = T.dt;
      if (this.tq >= 0) {
        const [x0, z0, s] = this.groundAt(this.tq), [x1, z1] = this.groundAt(this.tq + dt);
        pad.position.set(x0, 0, z0);
        pad.velocity.set((x1 - x0) / dt, 0, (z1 - z0) / dt);
        this.shake = s;
        this.tq += dt;
      } else { pad.velocity.set(0, 0, 0); this.shake = 0; }
      world.step(dt);
      this.t += dt;
      // 비틀림: 층마다 수평 회전(요) — 벽이 한쪽에만 있으면 커짐
      for (let j = 1; j < levels.length; j++) { const q = levels[j].quaternion; const yaw = Math.abs(2 * Math.atan2(q.y, q.w)); if (yaw > this.maxTwist && yaw < 1) this.maxTwist = yaw; }
      if (this.breaksOn) this.checkBreaks();
      const d = this.drop();
      if (d > this.maxDrop) this.maxDrop = d;
      if (this.maxDrop > 0.3 && !this.collapseInfo && rcCols.length) this.collapseInfo = this.failInfo(); // 무너지는 순간의 모습으로 설명
    },
    // 층마다 땅에서의 높이가 얼마나 줄었나 → 가장 큰 값
    drop() {
      if (!this.h0.length) return 0;
      let m = 0;
      for (let j = 1; j < levels.length; j++) m = Math.max(m, (this.h0[j] - levels[j].position.y - 0.22) / this.h0[j]);
      return m;
    },
    sway() { return [top.position.x - pad.position.x, top.position.z - pad.position.z]; },
    breakJoint(j, why) {
      if (j.broken) return;
      j.broken = true; j.why = why; world.removeConstraint(j.c);
      const wp = j.A.pointToWorldFrame(j.c.pivotA);
      events.push({ type: 'break', kind: j.kind, why, pos: [wp.x, wp.y, wp.z], big: j.kind === 'base' });
    },
    checkBreaks() {
      for (const j of joints) {
        if (j.broken || j.cap === Infinity) continue;
        const eqs = j.c.equations;
        const fx = eqs[0].multiplier, fy = eqs[1].multiplier, fz = eqs[2].multiplier;
        const F = j.horiz ? Math.hypot(fx, fz) : Math.hypot(fx, fy, fz);
        j.f = j.f * 0.6 + F * 0.4;
        if (j.f > j.cap && !j.brick) { this.breakJoint(j, 'force'); continue; }
        if (j.up !== undefined) {
          j.fu = (j.fu || 0) * 0.6 + -fy * 0.4; // 기둥(B)을 아래로 붙잡는 힘 = 뽑힘
          if (j.fu > j.up) { this.breakJoint(j, 'uplift'); continue; }
        }
        if (j.q0 && relAngle(j) > T.rotBreak) this.breakJoint(j, 'rot');
      }
      for (const br of braces) {
        if (br.broken) continue;
        if (br.ends.some((e) => e.broken)) { br.broken = true; continue; }
        const u = norm(sub(br.b, br.a));
        let a = 0;
        br.ends.forEach((e, k) => {
          const q = e.c.equations;
          const F = [q[0].multiplier, q[1].multiplier, q[2].multiplier];
          a += (k === 0 ? -dot(F, u) : dot(F, u)) / 2;
        });
        br.ax = br.ax * 0.6 + a * 0.4;
        const cap = br.ax >= 0 ? br.capT : br.capC;
        br.ratio = Math.min(1.5, Math.abs(br.ax) / cap);
        const sgn = Math.sign(br.ax);
        if (Math.abs(br.ax) > 0.7 * cap && sgn !== br.lastSign) {
          if (br.lastSign !== 0) { br.cycles++; br.capT *= 1 - T.degrade; br.capC *= 1 - T.degrade; const bp = br.part.body.position; events.push({ type: 'creak', pos: [bp.x, bp.y, bp.z] }); }
          br.lastSign = sgn;
        }
        if (br.ax > br.capT) { br.broken = true; br.why = 'pull'; this.breakJoint(br.ends[br.cycles % 2], 'pull'); }
        else if (-br.ax > br.capC) { br.broken = true; br.why = 'buckle'; this.breakJoint(br.ends[1], 'buckle'); }
      }
      // 철근콘크리트 기둥: 층간 변위로 판단. 실금 → 항복(모멘트 상한) → 소성 회전 누적으로 내력 저하 → 소성힌지 잃음 / 전단(빗금)
      for (const c of rcCols) {
        if (c.broken) continue;
        const tp = c.upB.pointToWorldFrame(c.upL), bp = c.loB.pointToWorldFrame(c.loL);
        // 층간 변위는 아래층 바닥 기준(그 바닥이 기울어도 통째 회전은 빼고 잼)
        const rel = c.loB.vectorToLocalFrame(tp.vsub(bp));
        const dx = rel.x - c.d0L.x, dz = rel.z - c.d0L.z;
        const d = Math.hypot(dx, dz);
        c.drift = d; c.maxDrift = Math.max(c.maxDrift || 0, d);
        const th = d / c.h, te = d / c.hEff; // 층간변위각 · 기둥 현 회전(순높이 기준)
        const cp = c.part.body.position, at = [cp.x, cp.y, cp.z];
        if (!c.hair && th > T.rcThCr) {
          c.hair = true; c.dmg = Math.max(c.dmg, 1);
          // 실금: 휨 강성 60% 로
          for (const j of [c.jt, c.jb]) for (const q of [j.c.rotationalEquation1, j.c.rotationalEquation2]) q.setSpookParams(j.k0 * 0.6, 4, T.dt);
          events.push({ type: 'dmg', kind: 'hairline', col: c.id, s: c.s, pos: [tp.x, tp.y - 0.4, tp.z] });
        }
        const ry = te / (T.rcThY * c.mM);
        if (ry > c.mu) c.mu = ry;
        if (!c.yielded && ry > 1) {
          c.yielded = true; c.dmg = Math.max(c.dmg, 2);
          for (const j of [c.jt, c.jb]) j.cracked = true;
          events.push({ type: 'dmg', kind: 'yield', col: c.id, s: c.s, pos: at });
        }
        // 소성 회전 누적: 항복 넘은 상태에서 움직인 만큼
        if (ry > 1) c.cum += Math.abs(te - c.te0);
        c.te0 = te;
        const deg = Math.max(T.rcResid, 1 - c.cum / (T.rcCum * c.duct));
        if (deg < c.deg - 0.02 || (deg === T.rcResid && c.deg !== deg)) {
          c.deg = deg;
          for (const j of [c.jt, c.jb]) { if (j.broken) continue; const r = j.My * deg * T.dt; for (const q of [j.c.rotationalEquation1, j.c.rotationalEquation2]) { q.maxForce = r; q.minForce = -r; } }
          if (deg < 0.55 && c.dmg < 3) { c.dmg = 3; events.push({ type: 'dmg', kind: 'spall', col: c.id, s: c.s, pos: at }); }
          if (deg === T.rcResid && !c.hinged) { c.hinged = true; c.dmg = 4; this.firstFail = this.firstFail || { mode: 'hinge', s: c.s, col: c.id, t: this.tq }; events.push({ type: 'break', kind: 'hinge', col: c.id, s: c.s, pos: at, big: true }); }
        }
        // 전단: 휨-전단 — 연성비가 2 를 넘으면 전단 내력이 줄어듦
        const fV = Math.max(0.4, 1 - T.rcVdeg * Math.max(0, c.mu / c.duct - 2)); // 감기·증설은 구속이 좋아 덜 줄어듦
        const rs = te / ((c.short ? T.rcGammaShort : T.rcGamma) * c.mV * fV);
        c.ratio = Math.min(1.5, Math.max(ry * 0.6, rs));
        if (rs > 1) {
          c.broken = true; c.sheared = true; c.dmg = 5;
          this.firstFail = this.firstFail || { mode: 'shear', s: c.s, col: c.id, short: c.short, t: this.tq };
          this.breakJoint(c.jt, 'shear'); this.breakJoint(c.jb, 'shear');
          events.push({ type: 'break', kind: 'shear', col: c.id, s: c.s, pos: at, big: true });
        }
      }
      // 벽돌 채움벽: 처음엔 단단히 받다가 금 가고(내력 조금씩 ↓, 그 힘으로 미끄러짐), 미끄럼이 쌓인 모서리는 떨어져 나감 → 골조 혼자
      for (const pn of panels) {
        if (pn.broken || pn.kind !== 'brick') continue;
        let r = 0;
        for (const c of pn.corners) {
          if (c.broken) continue;
          r = Math.max(r, c.f / c.cap);
          const wa = c.A.pointToWorldFrame(c.c.pivotA), wb = c.B.pointToWorldFrame(c.c.pivotB);
          const gap = c.inAx === 'x' ? wa.x - wb.x : wa.z - wb.z;
          c.slip += Math.abs(gap - (c.gap0 ?? gap)); c.gap0 = gap;
          if (c.slip > T.brickSlip) { const bp = pn.part.body.position; this.breakJoint(c, 'slip'); events.push({ type: 'dmg', kind: 'bricks', pos: [bp.x, bp.y, bp.z], n: 4 }); }
        }
        const hi = r > T.brickCrack;
        if (hi && !pn.hi) {
          const bp = pn.part.body.position;
          if (!pn.cracked) { pn.cracked = true; events.push({ type: 'dmg', kind: 'infillCrack', pos: [bp.x, bp.y, bp.z] }); }
          else { pn.cyc = (pn.cyc || 0) + 1; if (pn.cyc % 2 === 0) events.push({ type: 'dmg', kind: 'bricks', pos: [bp.x, bp.y + (Math.random() - 0.3), bp.z], n: 2 }); }
          for (const c of pn.corners) { if (c.broken) continue; c.cap *= 1 - T.brickDeg; { const q = c.inAx === 'x' ? c.c.equationX : c.c.equationZ; q.maxForce = c.cap * T.dt; q.minForce = -q.maxForce; } const ey = c.c.equationY; ey.maxForce = c.cap * 0.8 * T.dt; ey.minForce = -ey.maxForce; }
        }
        pn.hi = hi;
      }
      for (const pn of panels) {
        if (pn.broken) continue;
        if (pn.corners.filter((c) => c.broken).length >= 2) {
          pn.broken = true; pn.corners.forEach((c) => this.breakJoint(c, 'panel'));
          if (pn.kind === 'brick') { const bp = pn.part.body.position; events.push({ type: 'dmg', kind: 'infillOut', pos: [bp.x, bp.y, bp.z], n: 10 }); }
        }
      }
    },
    // 무너진 곳 설명 (결과 팁용): 처음 치명적 파괴 + 가장 많이 내려앉은 층
    failInfo() {
      if (this.collapseInfo) return this.collapseInfo;
      let worst = -1, wd = 0;
      for (let j = 1; j < levels.length; j++) {
        const below = j > 1 ? (this.h0[j - 1] - levels[j - 1].position.y - 0.22) : 0;
        const dj = (this.h0[j] - levels[j].position.y - 0.22) - below;
        if (dj > wd) { wd = dj; worst = j - 1; }
      }
      const brickAbove = (s) => (L.brickStories || []).some((b) => b > s) && !(L.brickStories || []).includes(s);
      return { ...(this.firstFail || {}), story: worst, soft: worst >= 0 && brickAbove(worst), twist: +this.maxTwist.toFixed(3) };
    },
    settle(sec = 0.5) {
      const n = Math.round(sec / T.dt);
      for (let i = 0; i < n; i++) this.step();
      this.h0 = levels.map((b) => (b ? b.position.y + 0.22 : 0));
      this.breaksOn = true; this.maxTwist = 0;
    },
    startQuake() { this.tq = 0; },
    get shakeEnd() { return T.rise + T.peak + T.decay; },
    get quakeLen() { return T.rise + T.peak + T.decay + T.calm; },
    // 피해 %: 끊어진 보강·접합 비율 + 내려앉음
    damage() {
      const reinf = braces.length + panels.length;
      const bad = braces.filter((b) => b.broken).length + panels.filter((p) => p.broken).length;
      const fj = joints.filter((j) => ['frame', 'base', 'rcjoint', 'footing'].includes(j.kind));
      const fb = fj.filter((j) => j.broken || j.cracked).length;
      if (RC) {
        // 콘크리트: 빠진 벽돌 · 끊어진 보강 · 항복한 기둥 비율, 그리고 전단 파괴·소성힌지를 잃은 기둥은 하나마다 큰 피해(서 있어도 못 쓰는 상태)
        const bricks = panels.filter((p) => p.kind === 'brick'), added = [...braces, ...panels.filter((p) => p.kind !== 'brick')];
        const frac = (a, f) => (a.length ? a.filter(f).length / a.length : 0);
        const deadCols = rcCols.filter((c) => c.sheared || c.hinged).length;
        return Math.min(100, Math.round(25 * frac(bricks, (p) => p.broken) + 60 * frac(added, (p) => p.broken) + 30 * frac(rcCols, (c) => c.yielded) + 25 * deadCols + 300 * this.maxDrop));
      }
      return Math.min(100, Math.round(100 * (0.6 * (reinf ? bad / reinf : 0) + 0.4 * (fb / Math.max(1, fj.length))) + 300 * this.maxDrop));
    },
  };
  return sim;
}

// 끝까지 빠르게 돌려 결과만 (시험·탐색용)
export function runQuick(L, design, tune = {}) {
  const s = buildSim(L, design, tune);
  s.settle();
  s.startQuake();
  const n = Math.round(s.quakeLen / s.T.dt);
  let at = null;
  for (let i = 0; i < n; i++) { s.step(); if (at === null && s.maxDrop > 0.3) { at = s.tq; break; } }
  return { stand: s.maxDrop < 0.3, drop: s.maxDrop, at, sway: s.sway(), damage: s.damage(), bodies: s.world.bodies.length };
}

// 별 (형 10/12): 쉬움 — ★ 버팀 · ★★ 모범×1.6 이하 · ★★★ ×1.25 이하 & 피해<20%
//               어려움 — ★★ 모범×1.3 이하 · ★★★ ×1.05 이하 & 피해<15%.  창(가게 앞) 막으면 −1
export function starsFor({ ok, cost, refCost, damage, blocked, hard }) {
  if (!ok) return 0;
  const [a2, a3, d3] = hard ? [1.3, 1.05, 15] : [1.6, 1.25, 20];
  let st = 1;
  if (cost <= refCost * a2) st = 2;
  if (cost <= refCost * a3 && damage < d3) st = 3;
  return blocked ? Math.max(1, st - 1) : st;
}
export function blocksWindow(L, design) {
  const M = makeModel(L, design);
  return design.some((d) => (d.t === 'ply' && M.bayById[d.bay]?.window) || (d.t === 'brace' && M.diag[key2(d.a, d.b)]?.window));
}
