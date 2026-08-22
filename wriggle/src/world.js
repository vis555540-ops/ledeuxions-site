// world.js — 발판 생성·카메라·고도·균열 구간. 좌표계는 §20.1 (y는 아래로 증가).
import { WORLD, CANVAS, FISSURE, MOIST } from './config.js';

export function create() {
  const w = {
    platforms: [], drops: [],
    cameraY: 0, altM: 0, topY: WORLD.GROUND_Y,
    inFissure: false, fissureCount: 0, lastFissureIdx: -1,
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

function spawnOne(w) {
  const last = w.platforms[w.platforms.length - 1];
  const altHere = Math.max(0, (WORLD.GROUND_Y - w.topY)) / WORLD.PX_PER_M;
  const inFis = fissureAt(altHere);

  let gapMax = altHere < WORLD.TUTORIAL_M ? WORLD.GAP_TUTORIAL_MAX : WORLD.GAP_MAX;
  if (inFis) gapMax = Math.round(gapMax * 1.15);          // 균열 구간은 밀도 -20%
  const dy = WORLD.GAP_MIN + Math.random() * (gapMax - WORLD.GAP_MIN);

  let dx = (Math.random() * 2 - 1) * WORLD.DX_MAX;
  if (Math.abs(dx) > 140 && dy > 95) dx = Math.sign(dx) * 140;   // 도달 가능성 보장 (§8.3)

  let x = (last.x || 0) + dx;
  if (inFis && FISSURE.SAFE_LANE) {
    // 구간 발판은 한쪽 55% 폭 안에만 — 반대쪽에 우회 경로를 남긴다
    const rightSide = Math.floor(altHere / FISSURE.EVERY_M) % 2 === 0;
    const lo = rightSide ? CANVAS.W * 0.45 : 0;
    const hi = rightSide ? CANVAS.W - WORLD.PLATFORM_W : CANVAS.W * 0.55 - WORLD.PLATFORM_W;
    x = Math.max(lo, Math.min(hi, x));
  }
  x = Math.max(0, Math.min(CANVAS.W - WORLD.PLATFORM_W, x));

  const y = w.topY - dy;
  const p = { x, y, kind: pickKind(), dir: Math.random() < 0.5 ? -1 : 1, x0: x, press: 0 };
  w.platforms.push(p);
  w.topY = y;

  maybeDrop(w, p, inFis, y, dy);
}

function maybeDrop(w, p, inFis, y, dy) {
  if (inFis && Math.random() < FISSURE.DROP_BIG_RATE) {
    w.drops.push({ x: p.x + WORLD.PLATFORM_W / 2, y: y - 12, big: true });
    return;
  }
  if (Math.random() < WORLD.DROP_ON_PLATFORM) {
    w.drops.push({ x: p.x + WORLD.PLATFORM_W / 2, y: y - 12, big: false });
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
    pl.x = Math.max(0, Math.min(CANVAS.W - WORLD.PLATFORM_W, pl.x));
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
