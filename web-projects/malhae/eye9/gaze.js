/* 말해요 · 눈으로 9칸 — 시선 셈 (화면·카메라와 상관없는 순수 계산만. node 에서도 그대로 시험한다)
   2026-10-19 형 생각: 「진짜 시선추적기처럼 거리랑 고개 기울기를 빼 주고, 그다음에 눈을 보자」

   한 장면(frame)에서 재는 것  measure()
     · 눈 틀 안 눈동자 위치 gx, gy  — 눈 꼬리 두 점·눈꺼풀 기준 (눈 너비 단위라 거리와 상관없음)
     · 같은 것을 MediaPipe 표정값(eyeLook*)으로 한 번 더  bx, by
     · 고개 방향 yaw/pitch (얼굴 회전 행렬) + 코끝 위치(부호 확인용) + 고개 기울기 roll (두 눈 잇는 선)
     · 두 눈 사이 거리 iod (사진 크기 기준) → 얼굴까지 거리,  두 눈 가운데 위치 ex, ey → 얼굴이 옆으로 간 만큼

   셈 순서  geom()
     1) 눈 틀 안 눈동자 → 눈알이 돈 각도 (머리 기준)
     2) 고개 각도(좌우·위아래·기울기)로 돌려서 → 카메라 기준 시선 방향
     3) 두 눈 위치(거리 포함)에서 그 방향으로 선을 그어 → 카메라가 있는 판(=화면 판)과 만나는 점
     4) 그 점 → 화면 칸 좌표 (맞추기 9점으로 2차식을 맞춤, ridge)
   거리·위치는 「두 눈 사이 거리(약 6.3cm)」를 자로 쓴다. 그래서 단위를 몰라도 된다.

   쓰는 좌표: 카메라 사진 기준. x=사진 오른쪽, y=사진 아래, z=카메라에서 사람 쪽. 화면은 z=0 판.
   (앞 카메라 사진은 거울이 아니다. 사람의 오른쪽 = 사진 왼쪽. 마지막 2차식이 부호를 알아서 맞춘다.) */

export const D2R = Math.PI / 180;
export const F_DEFAULT = 0.75;   // 앞 카메라 초점거리(사진 긴 변=1). 폰 앞 카메라 화각 약 65~70도 기준 짐작값
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
export const median = a => {
  if(!a.length) return NaN;
  const s = [...a].sort((p, q) => p - q), n = s.length >> 1;
  return s.length % 2 ? s[n] : (s[n - 1] + s[n]) / 2;
};
const mean = a => a.reduce((s, x) => s + x, 0) / (a.length || 1);

/* ───────── 한 장면 재기 ───────── */
// 눈동자 위치를 「그 눈의 두 꼬리·위아래 눈꺼풀」 기준으로 잰다 (head 판과 같은 셈)
function eyeOffset(P, a, b, up, lo, iris){
  const ux = P[b].x - P[a].x, uy = P[b].y - P[a].y, L = Math.hypot(ux, uy) || 1;
  const ex = ux / L, ey = uy / L, nx = -ey, ny = ex;
  const ix = P[iris].x - P[a].x, iy = P[iris].y - P[a].y;
  const mx = (P[up].x + P[lo].x) / 2 - P[iris].x, my = (P[up].y + P[lo].y) / 2 - P[iris].y;
  return { gx: (ix * ex + iy * ey) / L - 0.5, gy: -(mx * nx + my * ny) / L };
}
// lm: 얼굴 점 478개(0~1), bs: 표정값 {이름:값}, M: 얼굴 회전 행렬 16개(없어도 됨), W·H: 영상 크기
export function measure(lm, bs, M, W, H){
  if(!lm || lm.length < 478) return null;
  const S = Math.max(W, H) || 1, sx = W / S, sy = H / S;
  const P = lm.map(p => ({ x: p.x * sx, y: p.y * sy }));
  const a = P[33], b = P[263], n = P[1];
  const dx = b.x - a.x, dy = b.y - a.y, iod = Math.hypot(dx, dy) || 1e-6;
  const roll = Math.atan2(dy, dx);
  const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
  const c = Math.cos(-roll), s = Math.sin(-roll);
  const nx = (n.x - mx) / iod, ny = (n.y - my) / iod;
  const r = eyeOffset(P, 33, 133, 159, 145, 468), l = eyeOffset(P, 362, 263, 386, 374, 473);
  const g = k => (bs && bs[k]) || 0;
  let yawM = 0, pitchM = 0, hasM = false;
  if(M && M.length >= 16){
    yawM = Math.atan2(M[8], M[10]) / D2R;
    pitchM = Math.asin(clamp(-M[9], -1, 1)) / D2R;
    hasM = true;
  }
  return {
    gx: (r.gx + l.gx) / 2, gy: (r.gy + l.gy) / 2,
    // 사진 +x 쪽을 볼 때 + / 아래를 볼 때 + (부호는 맞추기에서 다시 확인한다)
    bx: ((g("eyeLookOutLeft") + g("eyeLookInRight")) - (g("eyeLookOutRight") + g("eyeLookInLeft"))) / 2,
    by: ((g("eyeLookDownLeft") + g("eyeLookDownRight")) - (g("eyeLookUpLeft") + g("eyeLookUpRight"))) / 2,
    yawM, pitchM, hasM,
    noseX: nx * c - ny * s, noseY: nx * s + ny * c,
    roll, iod, ex: mx - sx / 2, ey: my - sy / 2,
    v: (g("eyeBlinkLeft") + g("eyeBlinkRight")) / 2
  };
}

/* ───────── 몇 가지 작은 셈 ───────── */
function linfit(xs, ys){
  const n = xs.length; if(n < 3) return null;
  const mx = mean(xs), my = mean(ys);
  let sxy = 0, sxx = 0, syy = 0;
  for(let i = 0; i < n; i++){ const a = xs[i] - mx, b = ys[i] - my; sxy += a * b; sxx += a * a; syy += b * b; }
  if(sxx <= 1e-12 || syy <= 1e-12) return null;
  const b = sxy / sxx;
  return { a: my - b * mx, b, r2: (sxy * sxy) / (sxx * syy), sdx: Math.sqrt(sxx / n) };
}
// 작은 연립방정식 (가우스 소거)
function solve(A, y){
  const n = y.length, M = A.map((r, i) => [...r, y[i]]);
  for(let c = 0; c < n; c++){
    let p = c; for(let r = c + 1; r < n; r++) if(Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    [M[c], M[p]] = [M[p], M[c]];
    const d = M[c][c] || 1e-12;
    for(let r = 0; r < n; r++){ if(r === c) continue; const f = M[r][c] / d; for(let k = c; k <= n; k++) M[r][k] -= f * M[c][k]; }
  }
  return M.map((r, i) => r[n] / (r[i] || 1e-12));
}
// 2차식 ridge: 점(x,y) → 값. 입력은 평균·표준편차로 맞춰서(표준화) 넣는다
const LAMBDA = [0, 1e-4, 1e-4, 0.03, 0.03, 0.03];
function phi(a, b){ return [1, a, b, a * a, b * b, a * b]; }
function fitPoly(X, Y, U, V){
  const mx = mean(X), my = mean(Y);
  const sx = Math.sqrt(mean(X.map(x => (x - mx) ** 2))) || 1, sy = Math.sqrt(mean(Y.map(y => (y - my) ** 2))) || 1;
  const rows = X.map((x, i) => phi((x - mx) / sx, (Y[i] - my) / sy));
  const n = rows.length, A = Array.from({ length: 6 }, () => Array(6).fill(0)), bu = Array(6).fill(0), bv = Array(6).fill(0);
  rows.forEach((r, i) => { for(let p = 0; p < 6; p++){ bu[p] += r[p] * U[i]; bv[p] += r[p] * V[i]; for(let q = 0; q < 6; q++) A[p][q] += r[p] * r[q]; } });
  for(let p = 0; p < 6; p++) A[p][p] += LAMBDA[p] * n;
  return { mx, my, sx, sy, wu: solve(A, bu), wv: solve(A, bv) };
}
function evalPoly(m, x, y){
  const r = phi((x - m.mx) / m.sx, (y - m.my) / m.sy);
  let u = 0, v = 0; for(let p = 0; p < 6; p++){ u += m.wu[p] * r[p]; v += m.wv[p] * r[p]; }
  return { u, v };
}

/* ───────── 머리 각도 · 눈 각도 · 화면 판의 점 ───────── */
// 고개 각도(라디안, 사진 기준): hx>0 = 얼굴이 사진 +x 쪽을 봄, hy>0 = 아래쪽을 봄
export function headAng(m, M){
  if(M.useM) return { hx: M.sx * m.yawM * D2R, hy: M.sy * m.pitchM * D2R };
  return { hx: Math.asin(clamp(m.noseX / 0.45, -0.9, 0.9)), hy: Math.asin(clamp((m.noseY - M.noseY0) / 0.45, -0.9, 0.9)) };
}
// 눈 틀 안 눈동자 (점 위치 + 표정값을 섞음)
export function eyeInHead(m, M){
  let x = m.gx, y = m.gy;
  if(M.bfx) x = (1 - M.bfx.w) * x + M.bfx.w * (M.bfx.a + M.bfx.b * m.bx);
  if(M.bfy) y = (1 - M.bfy.w) * y + M.bfy.w * (M.bfy.a + M.bfy.b * m.by);
  return { x, y };
}
// 화면 판(z=0) 위의 점. 단위 = 두 눈 사이 거리
//  opt.noDist: 거리·위치 보정 없이(맞출 때 자리에 그대로 있다고 치고) — 비교용
export function geom(m, M, opt = {}){
  const h = headAng(m, M), e = eyeInHead(m, M);
  const tx = Math.tan(Math.asin(clamp(e.x / M.kx, -0.95, 0.95)));
  const ty = Math.tan(Math.asin(clamp(e.y / M.ky, -0.95, 0.95)));
  let x = tx, y = ty, z = -1, c, s;
  c = Math.cos(h.hy); s = Math.sin(h.hy); [y, z] = [c * y - s * z, s * y + c * z];   // 위아래
  c = Math.cos(h.hx); s = Math.sin(h.hx); [x, z] = [c * x - s * z, s * x + c * z];   // 좌우
  c = Math.cos(m.roll); s = Math.sin(m.roll); [x, y] = [c * x - s * y, s * x + c * y]; // 기울기
  const iod = m.iod / Math.max(0.5, Math.cos(h.hx));   // 고개를 돌리면 두 눈 사이가 좁아 보인다
  let Ex = m.ex / iod, Ey = m.ey / iod, Ez = M.F / iod;
  if(opt.noDist){ Ex = M.E0.x; Ey = M.E0.y; Ez = M.E0.z; }
  const t = Ez / Math.max(0.2, -z);
  return { x: Ex + t * x, y: Ey + t * y, Ez };
}

function sgnCorr(frames, fa, fb){
  const r = linfit(frames.map(fa), frames.map(fb));
  if(!r || r.r2 < 0.09) return { s: 1, ok: false };
  return { s: r.b >= 0 ? 1 : -1, ok: true };
}
function blendFit(pts, kb, kg){
  // 아홉 점의 가운데값끼리 맞춤: 표정값 → 눈 틀 안 위치. 잘 맞을수록(r²) 많이 섞는다(최대 반)
  const r = linfit(pts.map(p => median(p.frames.map(m => m[kb]))), pts.map(p => median(p.frames.map(m => m[kg]))));
  if(!r || r.r2 < 0.3) return null;
  return { a: r.a, b: r.b, w: 0.5 * clamp((r.r2 - 0.3) / 0.6, 0, 1), r2: r.r2 };
}
// 점을 보면서 고개만 움직이면 눈은 반대로 돈다(전정안반사). 그 비율 = 눈알 반지름/눈 너비 (k)
function vorGain(frames, M, axis, def){
  if(!frames || frames.length < 8) return { k: def, ok: false };
  const H = frames.map(m => axis === "x" ? headAng(m, M).hx : headAng(m, M).hy);
  const E = frames.map(m => axis === "x" ? eyeInHead(m, M).x : eyeInHead(m, M).y);
  const r = linfit(H, E);
  if(!r || r.sdx < 2.5 * D2R) return { k: def, ok: false, why: "small" };
  const k = -r.b;
  if(!(k > 0.08 && k < 1.2) || r.r2 < 0.2) return { k: def, ok: false, why: "bad" };
  return { k, ok: true };
}

/* ───────── 맞추기 ─────────
   cal = { points:[{u,v,frames:[m…]}…9개], wigX:[m…], wigY:[m…] }
   u,v = 9칸 판 안의 위치(0~1). 결과 M 하나에 세 가지 셈(전체 / 거리 보정 없이 / 눈만)을 다 담는다 */
export function fit(cal, opt = {}){
  const pts = cal.points.filter(p => p.frames && p.frames.length >= 3);
  if(pts.length < 6) return null;
  const pf = pts.flatMap(p => p.frames);
  const wigX = cal.wigX || [], wigY = cal.wigY || [];
  const all = [...pf, ...wigX, ...wigY];
  const M = { ver: 1, F: opt.F || F_DEFAULT, notes: [] };
  M.useM = all.every(m => m.hasM);
  const sX = sgnCorr(wigX.length > 8 ? wigX : all, m => m.yawM, m => m.noseX);
  const sY = sgnCorr(wigY.length > 8 ? wigY : all, m => m.pitchM, m => m.noseY);
  M.sx = sX.s; M.sy = sY.s;
  if(M.useM && !sX.ok) M.notes.push("sx?");
  if(M.useM && !sY.ok) M.notes.push("sy?");
  const ctr = pts.reduce((b, p) => Math.hypot(p.u - .5, p.v - .5) < Math.hypot(b.u - .5, b.v - .5) ? p : b, pts[0]);
  M.noseY0 = median(ctr.frames.map(m => m.noseY));
  M.bfx = blendFit(pts, "bx", "gx"); M.bfy = blendFit(pts, "by", "gy");
  const vx = vorGain(wigX, M, "x", 0.4), vy = vorGain(wigY, M, "y", 0.25);
  M.kx = vx.k; M.ky = vy.k; M.vorOk = { x: vx.ok, y: vy.ok };
  if(!vx.ok) M.notes.push("kx기본값"); if(!vy.ok) M.notes.push("ky기본값");

  // 맞출 때 자리 (거리 보정 없는 비교용 + 범위 알림용)
  const Ezs = pf.map(m => { const h = headAng(m, M), iod = m.iod / Math.max(0.5, Math.cos(h.hx)); return { x: m.ex / iod, y: m.ey / iod, z: M.F / iod, iod, hx: h.hx, hy: h.hy }; });
  M.E0 = { x: median(Ezs.map(e => e.x)), y: median(Ezs.map(e => e.y)), z: median(Ezs.map(e => e.z)) };
  M.ref = { iod: median(Ezs.map(e => e.iod)), hx: median(Ezs.map(e => e.hx)), hy: median(Ezs.map(e => e.hy)) };

  const U = pts.map(p => p.u), V = pts.map(p => p.v);
  const pointsOf = f => pts.map(p => { const g = p.frames.map(f); return { x: median(g.map(q => q.x)), y: median(g.map(q => q.y)) }; });
  const full = pointsOf(m => geom(m, M)), nod = pointsOf(m => geom(m, M, { noDist: true })), eye = pointsOf(m => eyeInHead(m, M));
  M.full = fitPoly(full.map(q => q.x), full.map(q => q.y), U, V);
  M.noDist = fitPoly(nod.map(q => q.x), nod.map(q => q.y), U, V);
  M.eye = fitPoly(eye.map(q => q.x), eye.map(q => q.y), U, V);
  M.trainErr = mean(full.map((q, i) => { const r = evalPoly(M.full, q.x, q.y); return Math.hypot(r.u - U[i], r.v - V[i]); }));
  return M;
}

// mode: "full"(거리·고개 보정) | "noDist"(고개만) | "eye"(눈만, 예전 방식)
export function predict(M, m, mode = "full"){
  if(!M || !m) return null;
  if(mode === "eye"){ const e = eyeInHead(m, M); return evalPoly(M.eye, e.x, e.y); }
  const g = geom(m, M, { noDist: mode === "noDist" });
  return evalPoly(mode === "noDist" ? M.noDist : M.full, g.x, g.y);
}

/* 맞출 때와 너무 달라졌나 — 고칠 수 있는 범위를 넘으면 말로 알려 준다 */
export function hint(M, m){
  if(!m) return "face";
  if(!M) return null;
  const h = headAng(m, M), iod = m.iod / Math.max(0.5, Math.cos(h.hx)), r = iod / M.ref.iod;
  if(r < 0.72) return "far";
  if(r > 1.4) return "near";
  if(Math.abs(h.hx - M.ref.hx) > 20 * D2R || Math.abs(h.hy - M.ref.hy) > 16 * D2R || Math.abs(m.roll) > 25 * D2R) return "pose";
  return null;
}

/* ───────── 칸 ───────── */
export function cellOf(u, v){
  if(!(u > -0.12 && u < 1.12 && v > -0.12 && v < 1.12)) return -1;
  return clamp(Math.floor(v * 3), 0, 2) * 3 + clamp(Math.floor(u * 3), 0, 2);
}
// 지금 칸에서 조금(margin) 벗어나도 그대로 둔다 — 칸 경계에서 깜빡이지 않게
//  가장자리 칸은 판 밖으로 조금 나가도(0.25) 그 칸으로 둔다 — 끝 칸을 볼 때 점이 바깥으로 흔들리기 쉬워서
export function stickyCell(cur, u, v, margin = 0.06){
  if(cur >= 0){
    const r = Math.floor(cur / 3), c = cur % 3, E = 0.25;
    const x0 = c === 0 ? -E : c / 3 - margin, x1 = c === 2 ? 1 + E : (c + 1) / 3 + margin;
    const y0 = r === 0 ? -E : r / 3 - margin, y1 = r === 2 ? 1 + E : (r + 1) / 3 + margin;
    if(u > x0 && u < x1 && v > y0 && v < y1) return cur;
  }
  return cellOf(u, v);
}

/* ───────── One-Euro 거르개 (가만히 볼 땐 단단히, 눈을 옮길 땐 빨리 따라감) ───────── */
export class OneEuro{
  constructor(minCut = 0.5, beta = 0.2, dCut = 1){ this.minCut = minCut; this.beta = beta; this.dCut = dCut; this.reset(); }
  reset(){ this.x = null; this.dx = 0; this.t = 0; }
  static a(cut, dt){ const r = 2 * Math.PI * cut * dt; return r / (r + 1); }
  filter(x, t){
    if(this.x === null || t - this.t > 0.6){ this.x = x; this.dx = 0; this.t = t; return x; }
    const dt = Math.max(1e-3, t - this.t); this.t = t;
    const dx = (x - this.x) / dt;
    this.dx += OneEuro.a(this.dCut, dt) * (dx - this.dx);
    const cut = this.minCut + this.beta * Math.abs(this.dx);
    this.x += OneEuro.a(cut, dt) * (x - this.x);
    return this.x;
  }
}
