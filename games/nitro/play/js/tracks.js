// Nitro Puff Rally - original tracks. World units: x in [-24,24], z in [-13.5,13.5]. Ground y=0 + features.
// Each track: closed control points (480x270 sketch space), dirt width, features at fraction t along the lap.
const RAW = [
  { id: 'kidney', name: { en: 'Kidney Bean Flats', ko: '콩팥 들판' },
    pts: [[70,60],[240,48],[410,60],[440,140],[400,220],[300,225],[240,165],[180,225],[80,220],[40,140]],
    feats: [ { type: 'ramp', t: 0.09, h: 1.25 }, { type: 'ramp', t: 0.47, h: 1.1 }, { type: 'hill', t: 0.2, r: 4.2, h: 1.5 }, { type: 'bump', t: 0.43, h: 0.55 }, { type: 'mud', t: 0.62, r: 1.7 },
             { type: 'bump', t: 0.86, h: 0.45 }, { type: 'mud', t: 0.33, r: 1.3, off: -0.9 } ] },
  { id: 'hairpin', name: { en: 'Hairpin Gulch', ko: '머리핀 협곡' },
    // softer V-notches than v1 (were 262,105 / 318,165) and a wider road: this was the track new drivers lost on
    pts: [[60,50],[195,40],[262,84],[330,40],[430,60],[440,200],[362,232],[318,186],[255,232],[140,232],[112,162],[44,166]], w: 2.75,
    feats: [ { type: 'ramp', t: 0.17, h: 1.25 }, { type: 'ramp', t: 0.8, h: 1.1 }, { type: 'mud', t: 0.27, r: 1.5 }, { type: 'bump', t: 0.42, h: 0.6 },
             { type: 'hill', t: 0.72, r: 3.4, h: 1.2 }, { type: 'bump', t: 0.9, h: 0.5 }, { type: 'mud', t: 0.55, r: 1.4, off: 0.8 } ] },
  { id: 'snake', name: { en: 'Rattlesnake Run', ko: '방울뱀 길' },
    pts: [[50,62],[150,40],[205,112],[262,40],[382,40],[440,108],[402,172],[300,146],[262,222],[150,232],[60,222],[92,145]],
    w: 2.5,
    feats: [ { type: 'ramp', t: 0.2, h: 1.3 }, { type: 'ramp', t: 0.71, h: 1.1 }, { type: 'bump', t: 0.1, h: 0.5 }, { type: 'hill', t: 0.3, r: 3.8, h: 1.6 }, { type: 'mud', t: 0.5, r: 1.8 },
             { type: 'bump', t: 0.66, h: 0.55 }, { type: 'mud', t: 0.8, r: 1.4, off: -0.8 }, { type: 'hill', t: 0.92, r: 3.2, h: 1.0 } ] },
  // later "pro" tracks: narrow dirt + tight bends (unlocked after the first season)
  { id: 'zigzag', name: { en: 'Zigzag Canyon', ko: '지그재그 계곡' }, w: 1.95, pro: true,
    pts: [[60,45],[160,45],[200,120],[240,45],[340,45],[440,70],[445,150],[380,150],[345,225],[260,165],[180,230],[90,225],[40,140]],
    feats: [ { type: 'ramp', t: 0.06, h: 1.35 }, { type: 'ramp', t: 0.6, h: 1.2 }, { type: 'mud', t: 0.34, r: 1.4 }, { type: 'bump', t: 0.45, h: 0.6 },
             { type: 'hill', t: 0.85, r: 3.4, h: 1.3 }, { type: 'mud', t: 0.72, r: 1.2, off: 0.6 } ] },
  { id: 'pretzel', name: { en: 'Pretzel Pass', ko: '꽈배기 고개' }, w: 1.85, pro: true,
    pts: [[50,60],[150,40],[215,95],[150,150],[230,215],[330,225],[400,165],[330,110],[400,45],[445,110],[445,225],[300,250],[120,240],[45,180]],
    feats: [ { type: 'ramp', t: 0.12, h: 1.3 }, { type: 'ramp', t: 0.66, h: 1.3 }, { type: 'mud', t: 0.4, r: 1.3 }, { type: 'bump', t: 0.52, h: 0.6 },
             { type: 'hill', t: 0.88, r: 3.2, h: 1.2 } ] },
];
export const EASY_COUNT = 3;

function catmull(p0, p1, p2, p3, t) {
  const t2 = t * t, t3 = t2 * t;
  return 0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3);
}

export function buildTrack(index, reverse, tier = 0) {
  const raw = RAW[index % RAW.length];
  let pts = raw.pts.map(([x, y]) => [x / 10 - 24, y / 10 - 13.5]);
  if (reverse) pts = pts.slice().reverse();
  // dense spline
  const dense = [];
  const n = pts.length;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    for (let k = 0; k < 40; k++) {
      const t = k / 40;
      dense.push([catmull(p0[0], p1[0], p2[0], p3[0], t), catmull(p0[1], p1[1], p2[1], p3[1], t)]);
    }
  }
  // resample at equal spacing
  const step = 0.5, S = [];
  let acc = 0; S.push(dense[0]);
  for (let i = 1; i <= dense.length; i++) {
    const a = dense[i - 1], b = dense[i % dense.length];
    let seg = Math.hypot(b[0] - a[0], b[1] - a[1]), s0 = 0;
    while (acc + (seg - s0) >= step) {
      const need = step - acc; s0 += need; acc = 0;
      const f = s0 / seg; S.push([a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f]);
    }
    acc += seg - s0;
  }
  if (Math.hypot(S[S.length - 1][0] - S[0][0], S[S.length - 1][1] - S[0][1]) < step * 0.6) S.pop();
  const N = S.length;
  const xs = new Float32Array(N), zs = new Float32Array(N), tx = new Float32Array(N), tz = new Float32Array(N);
  for (let i = 0; i < N; i++) { xs[i] = S[i][0]; zs[i] = S[i][1]; }
  for (let i = 0; i < N; i++) {
    const a = (i - 1 + N) % N, b = (i + 1) % N;
    const dx = xs[b] - xs[a], dz = zs[b] - zs[a], l = Math.hypot(dx, dz) || 1;
    tx[i] = dx / l; tz[i] = dz / l;
  }
  // was 1.85 - wider dirt so new drivers can stay on it. Each later season narrows the road a little.
  const halfW = Math.max(1.75, (raw.w || 2.3) - 0.15 * Math.max(0, tier));
  const feats = raw.feats.map(f => {
    let t = reverse ? (1 - f.t) : f.t;
    const i = Math.floor(t * N) % N;
    const off = (f.off || 0) * (reverse ? -1 : 1);
    // normal = (-tz, tx)
    return { ...f, i, x: xs[i] - tz[i] * off, z: zs[i] + tx[i] * off, tx: tx[i], tz: tz[i] };
  });
  const T = { pro: !!raw.pro, id: raw.id + (reverse ? '-r' : ''), name: raw.name, reverse: !!reverse, N, xs, zs, tx, tz, halfW, feats, length: N * step };
  T.height = (x, z) => heightAt(T, x, z);
  T.mudAt = (x, z) => { for (const f of feats) if (f.type === 'mud') { const d = Math.hypot(x - f.x, z - f.z); if (d < f.r) return true; } return false; };
  return T;
}

export const TRACK_COUNT = RAW.length;

// terrain height (analytic, shared by physics and the 3D mesh)
function heightAt(T, x, z) {
  let h = 0;
  for (const f of T.feats) {
    if (f.type === 'hill') {
      const d2 = (x - f.x) ** 2 + (z - f.z) ** 2;
      h += f.h * Math.exp(-d2 / (2 * (f.r * 0.45) ** 2));
    } else if (f.type === 'bump') {
      const dx = x - f.x, dz = z - f.z;
      const along = dx * f.tx + dz * f.tz, perp = -dx * f.tz + dz * f.tx;
      if (Math.abs(along) < 1.5 && Math.abs(perp) < 4) h += f.h * Math.exp(-(along * along) / (2 * 0.32 * 0.32)) * Math.exp(-(perp * perp) / (2 * 2.6 * 2.6));
    } else if (f.type === 'ramp') {
      // jump ramp: long rise along the driving direction, then a sharp lip -> trucks fly
      const dx = x - f.x, dz = z - f.z, dir = 1; // tx already points along the driving direction (also in reverse)
      const along = (dx * f.tx + dz * f.tz) * dir, perp = Math.abs(-dx * f.tz + dz * f.tx);
      if (along > -2.6 && along < 0.45 && perp < T.halfW + 0.9) {
        const side = perp < T.halfW ? 1 : Math.max(0, 1 - (perp - T.halfW) / 0.9);
        const prof = along <= 0 ? Math.pow((along + 2.6) / 2.6, 1.4) : 1 - along / 0.45;
        h += f.h * prof * side;
      }
    } else if (f.type === 'mud') {
      const d = Math.hypot(x - f.x, z - f.z);
      if (d < f.r + 0.4) h -= 0.12 * Math.max(0, 1 - (d / (f.r + 0.4)) ** 2);
    }
  }
  return h;
}

// nearest centerline sample near a previous index (local search avoids jumping between close track parts)
export function nearestLocal(T, x, z, prev, span = 24) {
  let best = prev, bd = 1e9;
  for (let k = -span; k <= span; k++) {
    const i = ((prev + k) % T.N + T.N) % T.N;
    const d = (x - T.xs[i]) ** 2 + (z - T.zs[i]) ** 2;
    if (d < bd) { bd = d; best = i; }
  }
  return best;
}
export function nearestGlobal(T, x, z) {
  let best = 0, bd = 1e9;
  for (let i = 0; i < T.N; i++) { const d = (x - T.xs[i]) ** 2 + (z - T.zs[i]) ** 2; if (d < bd) { bd = d; best = i; } }
  return { i: best, d: Math.sqrt(bd) };
}
// signed lateral offset of (x,z) from sample i (+ = left/normal side)
export function lateral(T, i, x, z) {
  return -(x - T.xs[i]) * T.tz[i] + (z - T.zs[i]) * T.tx[i];
}
