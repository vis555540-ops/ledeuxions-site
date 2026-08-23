// world.js — 발판·카메라·고도·균열. §23 층 단위 생성 (사슬은 lanes=1 구간에서만).
import { WORLD, CANVAS, FISSURE, MOIST, DIFF, REACH, SAFE_EVERY, SAFE_PLATFORM,
         WALL_ESCAPE_PX, START_FUNNEL, SLOTS, DROP_RATE_BY_LANES, DROPS_FROM_M } from './config.js';

export function create() {
  const w = {
    platforms: [], drops: [],
    cameraY: 0, altM: 0, topY: WORLD.GROUND_Y,
    inFissure: false, fissureCount: 0, fissureMix: 0,
    made: 0, lastCombo: null,
  };
  // 시작 발판: 화면 전체 폭, 파괴 불가 (§20.1)
  w.platforms.push({ x: 0, y: WORLD.GROUND_Y, w: CANVAS.W, kind: 'soil', ground: true });
  buildFunnel(w);
  fill(w);
  return w;
}

// §23.2 매판 똑같은 굴. 어느 쪽으로 뛰어도 올라가진다.
function buildFunnel(w) {
  for (const layer of START_FUNNEL.layers) {
    const y = WORLD.GROUND_Y + layer.dy;
    for (const [cx, pw] of layer.plats) {
      w.platforms.push({ x: Math.round(cx - pw / 2), y, w: pw, kind: 'soil', x0: cx - pw / 2, press: 0, funnel: true });
    }
    w.topY = y;
  }
}

export function altitudeM(w) { return Math.max(0, -w.cameraY) / WORLD.PX_PER_M; }

function fissureAt(altM) {
  if (altM < FISSURE.START_M) return false;
  return ((altM - FISSURE.START_M) % FISSURE.EVERY_M) < FISSURE.LENGTH_M;
}

function tier(altM) {
  for (const d of DIFF) if (altM < d.upTo) return d;
  return DIFF[DIFF.length - 1];
}

function pickKind() {
  const r = Math.random();
  if (r < WORLD.P_SOIL) return 'soil';
  if (r < WORLD.P_SOIL + WORLD.P_ROOT) return 'root';
  return 'crumble';
}

// §22.3-1 간격이 벌어질수록 옆으로 갈 수 있는 거리는 줄어든다
function reachAt(dy) {
  const keys = Object.keys(REACH).map(Number).sort((a, b) => a - b);
  if (dy <= keys[0]) return REACH[keys[0]];
  if (dy >= keys[keys.length - 1]) return REACH[keys[keys.length - 1]];
  for (let i = 1; i < keys.length; i++) {
    if (dy <= keys[i]) {
      const a = keys[i - 1], b = keys[i];
      return REACH[a] + (REACH[b] - REACH[a]) * ((dy - a) / (b - a));
    }
  }
  return REACH[keys[keys.length - 1]];
}

function fill(w) {
  const limit = w.cameraY - WORLD.SPAWN_AHEAD;
  let guard = 0;
  while (w.topY > limit && guard++ < 200) spawnLayer(w);
}

// 굴 최상단 (여기 위로는 고정 배치가 없다)
const FUNNEL_TOP_Y = WORLD.GROUND_Y + START_FUNNEL.layers[START_FUNNEL.layers.length - 1].dy;

function spawnLayer(w) {
  const altHere = Math.max(0, WORLD.GROUND_Y - w.topY) / WORLD.PX_PER_M;
  let T = tier(altHere);
  // 🚨 굴은 5층(270px=27m)뿐인데 DIFF 의 funnel 구간은 60m 까지다.
  //    그 사이가 빈 공간이 되어 60m 도달률이 0이었다. 굴이 끝나면 다음 구간 규칙으로 잇는다.
  if (T.funnel) {
    if (w.topY > FUNNEL_TOP_Y) { w.topY -= 54; return; }   // 아직 굴 안 — 이미 깔려 있다
    T = DIFF.find(d => !d.funnel);                          // 굴 위 = 첫 일반 구간(lanes 3)
  }

  const inFis = fissureAt(altHere);
  let gapMax = T.gap[1];
  if (inFis) gapMax = Math.round(gapMax * 1.15);
  const dy = T.gap[0] + Math.random() * Math.max(1, gapMax - T.gap[0]);
  const y = w.topY - dy;

  const lanes = T.lanes[0] + Math.floor(Math.random() * (T.lanes[1] - T.lanes[0] + 1));
  if (lanes >= 2) layerRow(w, y, lanes, T, inFis);
  else chainOne(w, y, dy, T, inFis, altHere);

  w.topY = y;
}

// §23.3 슬롯에 나눠 놓는다. 같은 자리 사다리가 반복되지 않게 조합을 기억한다.
function layerRow(w, y, lanes, T, inFis) {
  let idx = [0, 1, 2].sort(() => Math.random() - 0.5).slice(0, lanes).sort();
  const key = idx.join(',');
  if (lanes === 1 && w.lastCombo === key) idx = [(idx[0] + 1) % 3];
  w.lastCombo = idx.join(',');

  for (const i of idx) {
    const [cx, jit] = SLOTS[i];
    const pw = Math.round(T.w[0] + Math.random() * (T.w[1] - T.w[0]));
    let x = cx + (Math.random() * 2 - 1) * jit - pw / 2;
    x = Math.max(0, Math.min(CANVAS.W - pw, x));
    const p = { x, y, w: pw, kind: pickKind(), dir: Math.random() < 0.5 ? -1 : 1, x0: x, press: 0 };
    w.platforms.push(p);
  }
  maybeDrop(w, y, lanes, inFis);
}

// lanes 1 — 기존 사슬 규칙 (§22.3 3중 보장). 기준은 직전 층에서 중앙에 가장 가까운 발판.
function chainOne(w, y, dy, T, inFis, altHere) {
  const prev = nearestToCenter(w, w.topY);
  const prevW = prev.w || WORLD.PLATFORM_W;
  const prevCenter = prev.x + prevW / 2;

  w.made++;
  const safe = w.made % SAFE_EVERY === 0;
  const pw = Math.round(safe ? SAFE_PLATFORM.w : T.w[0] + Math.random() * (T.w[1] - T.w[0]));

  let dx = (Math.random() * 2 - 1) * (safe ? SAFE_PLATFORM.dxMax : (T.dxMax || 140));
  if (prevCenter < WALL_ESCAPE_PX) dx = Math.abs(dx);
  else if (prevCenter > CANVAS.W - WALL_ESCAPE_PX) dx = -Math.abs(dx);

  const limit = Math.max(20, reachAt(dy) - pw / 2);
  if (Math.abs(dx) > limit) dx = Math.sign(dx) * limit;

  let x = prevCenter + dx - pw / 2;
  if (inFis && FISSURE.SAFE_LANE && !safe) {
    const rightSide = Math.floor(altHere / FISSURE.EVERY_M) % 2 === 0;
    const lo = rightSide ? CANVAS.W * 0.45 : 0;
    const hi = rightSide ? CANVAS.W - pw : CANVAS.W * 0.55 - pw;
    x = Math.max(lo, Math.min(Math.max(lo, hi), x));
  }
  x = Math.max(0, Math.min(CANVAS.W - pw, x));

  w.platforms.push({ x, y, w: pw, kind: safe ? 'soil' : pickKind(),
                     dir: Math.random() < 0.5 ? -1 : 1, x0: x, press: 0, safe });
  maybeDrop(w, y, 1, inFis);
}

function nearestToCenter(w, atY) {
  let best = w.platforms[w.platforms.length - 1], bd = Infinity;
  for (let i = w.platforms.length - 1; i >= 0 && w.platforms[i].y === atY; i--) {
    const p = w.platforms[i];
    const d = Math.abs(p.x + (p.w || WORLD.PLATFORM_W) / 2 - CANVAS.W / 2);
    if (d < bd) { bd = d; best = p; }
  }
  return best;
}

// §23.4 층당 발판이 늘었으니 물방울은 층 단위로 한 번만 굴린다
function maybeDrop(w, y, lanes, inFis) {
  const altHere = Math.max(0, WORLD.GROUND_Y - y) / WORLD.PX_PER_M;
  if (altHere < DROPS_FROM_M) return;
  const row = w.platforms.filter(p => p.y === y);
  if (!row.length) return;
  const target = row[Math.floor(Math.random() * row.length)];
  const cx = target.x + (target.w || WORLD.PLATFORM_W) / 2;

  if (inFis && Math.random() < FISSURE.DROP_BIG_RATE) {
    w.drops.push({ x: cx, y: y - 12, big: true }); return;
  }
  if (Math.random() < (DROP_RATE_BY_LANES[lanes] || 0.35)) {
    w.drops.push({ x: cx, y: y - 12, big: false });
  } else if (Math.random() < WORLD.DROP_IN_AIR) {
    w.drops.push({ x: 20 + Math.random() * (CANVAS.W - 40), y: y + 30, big: false });
  }
}

export function update(w, p, dt) {
  w.cameraY = Math.min(w.cameraY, p.y - WORLD.CAM_LINE);
  w.altM = altitudeM(w);

  const was = w.inFissure;
  w.inFissure = fissureAt(w.altM);
  if (w.inFissure && !was) w.fissureCount++;
  w.fissureMix += ((w.inFissure ? 1 : 0) - w.fissureMix) * Math.min(1, dt * 4);

  moveRoots(w, dt);
  crumble(w, dt);
  fill(w);
  cull(w);
  pickup(w, p);
}

function moveRoots(w, dt) {
  for (const pl of w.platforms) {
    if (pl.kind !== 'root' || pl.ground || pl.funnel) continue;
    pl.x += pl.dir * WORLD.ROOT_SPEED * dt;
    if (Math.abs(pl.x - pl.x0) > WORLD.ROOT_RANGE) pl.dir *= -1;
    pl.x = Math.max(0, Math.min(CANVAS.W - (pl.w || WORLD.PLATFORM_W), pl.x));
  }
}

function crumble(w, dt) {
  for (const pl of w.platforms) {
    if (!pl.crumbling || pl.dead) continue;
    pl.crumbleT -= dt;
    if (pl.crumbleT <= 0) pl.dead = true;
  }
}

function cull(w) {
  const floor = w.cameraY + CANVAS.H + WORLD.DESPAWN_BELOW;
  w.platforms = w.platforms.filter(p => p.y < floor && !p.dead);
  w.drops = w.drops.filter(d => d.y < floor && !d.taken);
}

function pickup(w, p) {
  const r = p.pickupRadius || MOIST.PICKUP_RADIUS;
  for (const d of w.drops) {
    if (d.taken) continue;
    const dx = d.x - p.x, dy = d.y - p.y;
    if (dx * dx + dy * dy <= r * r) { d.taken = true; w.pickedUp = d; }
  }
}

export function inFissure(w) { return w.inFissure; }
