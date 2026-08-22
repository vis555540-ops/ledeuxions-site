// world.js — 발판 생성·카메라·고도·균열 구간. 좌표계는 §20.1 (y는 아래로 증가).
import { WORLD, CANVAS, FISSURE, MOIST, DIFF, REACH, SAFE_EVERY, SAFE_PLATFORM, WALL_ESCAPE_PX } from './config.js';

export function create() {
  const w = {
    platforms: [], drops: [],
    cameraY: 0, altM: 0, topY: WORLD.GROUND_Y,
    inFissure: false, fissureCount: 0, lastFissureIdx: -1, made: 0,
    fissureMix: 0,
  };
  // 시작 발판: 화면 전체 폭, 파괴 불가. 첫 탭이 반드시 성공하도록 (§20.1)
  w.platforms.push({ x: 0, y: WORLD.GROUND_Y, kind: 'soil', w: CANVAS.W, ground: true });
  fill(w);
  return w;
}

export function altitudeM(w) { return Math.max(0, -w.cameraY) / WORLD.PX_PER_M; }

// 이 월드 y 가 균열 구간 안인가
function fissureAt(altM) {
  if (altM < FISSURE.START_M) return false;
  const off = (altM - FISSURE.START_M) % FISSURE.EVERY_M;
  return off < FISSURE.LENGTH_M;
}

function pickKind() {
  const r = Math.random();
  if (r < WORLD.P_SOIL) return 'soil';
  if (r < WORLD.P_SOIL + WORLD.P_ROOT) return 'root';
  return 'crumble';
}

function fill(w) {
  const limit = w.cameraY - WORLD.SPAWN_AHEAD;
  let guard = 0;
  while (w.topY > limit && guard++ < 400) spawnOne(w);
}

// §22.2 고도로 난이도를 고른다. 고정 GAP/폭은 폐기됐다.
function tier(altM) {
  for (const d of DIFF) if (altM < d.upTo) return d;
  return DIFF[DIFF.length - 1];
}

// §22.3-1 간격이 벌어질수록 옆으로 갈 수 있는 거리는 줄어든다. 표 사이는 선형 보간.
function reachAt(dy) {
  const keys = Object.keys(REACH).map(Number).sort((a, b) => a - b);
  if (dy <= keys[0]) return REACH[keys[0]];
  if (dy >= keys[keys.length - 1]) return REACH[keys[keys.length - 1]];
  for (let i = 1; i < keys.length; i++) {
    if (dy <= keys[i]) {
      const a = keys[i - 1], b = keys[i], t = (dy - a) / (b - a);
      return REACH[a] + (REACH[b] - REACH[a]) * t;
    }
  }
  return REACH[keys[keys.length - 1]];
}

function spawnOne(w) {
  const last = w.platforms[w.platforms.length - 1];
  const lastW = last.w || WORLD.PLATFORM_W;
  const altHere = Math.max(0, WORLD.GROUND_Y - w.topY) / WORLD.PX_PER_M;
  const inFis = fissureAt(altHere);
  const T = tier(altHere);

  w.made++;
  const safe = w.made % SAFE_EVERY === 0;                    // §22.3-3 사다리는 항상 있다

  let pw = safe ? SAFE_PLATFORM.w : T.w[0] + Math.random() * (T.w[1] - T.w[0]);
  pw = Math.round(pw);

  let gapMax = safe ? Math.min(T.gap[1], SAFE_PLATFORM.gapMax) : T.gap[1];
  if (inFis && !safe) gapMax = Math.round(gapMax * 1.15);
  const dy = T.gap[0] + Math.random() * Math.max(1, gapMax - T.gap[0]);

  let dxMax = safe ? SAFE_PLATFORM.dxMax : T.dxMax;
  let dx = (Math.random() * 2 - 1) * dxMax;

  // §22.3-2 벽에 몰렸으면 다음은 무조건 중앙 쪽. 무작위가 아니다.
  const lastCenter = last.x + lastW / 2;
  if (lastCenter < WALL_ESCAPE_PX) dx = Math.abs(dx);
  else if (lastCenter > CANVAS.W - WALL_ESCAPE_PX) dx = -Math.abs(dx);

  // §22.3-1 물리적으로 못 닿으면 닿는 데까지 당긴다
  const limit = Math.max(20, reachAt(dy) - pw / 2);
  if (Math.abs(dx) > limit) dx = Math.sign(dx) * limit;

  let x = lastCenter + dx - pw / 2;
  if (inFis && FISSURE.SAFE_LANE && !safe) {
    const rightSide = Math.floor(altHere / FISSURE.EVERY_M) % 2 === 0;
    const lo = rightSide ? CANVAS.W * 0.45 : 0;
    const hi = rightSide ? CANVAS.W - pw : CANVAS.W * 0.55 - pw;
    x = Math.max(lo, Math.min(Math.max(lo, hi), x));
  }
  x = Math.max(0, Math.min(CANVAS.W - pw, x));

  const y = w.topY - dy;
  const p = { x, y, w: pw, kind: safe ? 'soil' : pickKind(), dir: Math.random() < 0.5 ? -1 : 1, x0: x, press: 0, safe };
  w.platforms.push(p);
  w.topY = y;

  maybeDrop(w, p, inFis, y, dy);
}

function maybeDrop(w, p, inFis, y, dy) {
  if (inFis && Math.random() < FISSURE.DROP_BIG_RATE) {
    w.drops.push({ x: p.x + (p.w || WORLD.PLATFORM_W) / 2, y: y - 12, big: true });
    return;
  }
  if (Math.random() < WORLD.DROP_ON_PLATFORM) {
    w.drops.push({ x: p.x + (p.w || WORLD.PLATFORM_W) / 2, y: y - 12, big: false });
  } else if (Math.random() < WORLD.DROP_IN_AIR) {
    w.drops.push({ x: 20 + Math.random() * (CANVAS.W - 40), y: y + dy / 2, big: false });
  }
}

export function update(w, p, dt) {
  // 카메라는 올라가기만 한다 (§20.1)
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
    if (pl.kind !== 'root' || pl.ground) continue;
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
