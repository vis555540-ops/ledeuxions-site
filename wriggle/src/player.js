// player.js — 지렁이 물리·수분·콤보. 히트박스 12×14 (§8.1).
import { PHYS, MOIST, WORLD, CANVAS, SKINS, JUICE, TRAITS } from './config.js';
import * as juice from './juice.js';
import * as audio from './audio.js';

export const HITBOX = { w: 12, h: 14 };

export function create(save) {
  const skin = (SKINS.find(s => s.id === save.skin) || SKINS[0]).c;
  return {
    x: CANVAS.W / 2, y: WORLD.GROUND_Y - 8,
    vx: 0, vy: 0, face: 1,
    grounded: true, lastPlatformY: WORLD.GROUND_Y,
    moist: MOIST.START, moistMax: MOIST.MAX,
    combo: 1, comboMax: 1, iframe: 0, squash: 1, squashT: 0,
    drops: 0, wallHits: 0, dryTimer: 0, dryCounted: false,
    holding: false, coyote: 0, buffer: 0, bufferX: 0,
    airLeft: 0, traits: {}, moistFrozen: true,   // 시작 카드 집기 전엔 안 마른다 (§22.4)
    skin, alive: true, cause: null, t: 0,
  };
}

// §22.1 탭 x 가 각도를 정한다. 중앙=수직에 가깝게, 가장자리=멀리.
function vxFromTap(tapX) {
  const t = Math.min(1, Math.abs(tapX - CANVAS.W / 2) / (CANVAS.W / 2));
  const mag = PHYS.JUMP_VX_MIN + (PHYS.JUMP_VX_MAX - PHYS.JUMP_VX_MIN) * t;
  return tapX < CANVAS.W / 2 ? -mag : mag;
}

export function press(p, tapX) {
  p.holding = true;
  const canGround = p.grounded || p.coyote > 0;
  if (canGround) { doJump(p, tapX); return; }
  if (p.airLeft > 0) { p.airLeft--; doJump(p, tapX); return; }
  p.buffer = PHYS.BUFFER_SEC; p.bufferX = tapX;      // 선입력 버퍼
}

export function release(p) {
  p.holding = false;
  if (p.vy < PHYS.JUMP_CUT_VY) p.vy = PHYS.JUMP_CUT_VY;   // 짧게 떼면 낮게 뜬다
}

function doJump(p, tapX) {
  p.vy = PHYS.JUMP_VY;
  p.vx = vxFromTap(tapX);
  p.face = p.vx < 0 ? -1 : 1;
  p.grounded = false; p.coyote = 0; p.buffer = 0;
  p.squashT = JUICE.SQUASH_SEC;
  audio.play('jump');
}

// 특성 적용 — 시작 카드/레벨업 카드가 공통으로 쓴다
export function giveTrait(p, id) {
  const t = TRAITS.find(x => x.id === id);
  if (!t) return;
  p.traits[id] = Math.min(t.max, (p.traits[id] || 0) + 1);
  const lv = p.traits[id];
  if (id === 'feel')    p.pickupRadius = t.radius[lv - 1];
  if (id === 'cuticle') p.drainMult = t.mult[lv - 1];
  if (id === 'pouch')   p.moistMax = MOIST.MAX + t.add[lv - 1];
  if (id === 'wiggle')  p.airMax = t.air[lv - 1];
  p.moistFrozen = false;                                   // 고른 순간 출발 (§22.4)
}

export function damage(p, amt) {
  if (p.iframe > 0) return false;
  p.moist = Math.max(0, p.moist - amt);
  p.vy = PHYS.KNOCK_VY || 400;
  p.iframe = 0.6;
  juice.shake(JUICE.SHAKE_HIT.px, JUICE.SHAKE_HIT.frames);
  audio.play('hurt');
  return true;
}

export function drink(p, amount) {
  p.moist = Math.min(p.moistMax, p.moist + amount);
  p.drops++;
  juice.flash('#4fc3f7', JUICE.FLASH_DROP);
}

function drainRate(altM, inFissure, mult) {
  const base = MOIST.BASE_DRAIN + (altM / 1000) * MOIST.DRAIN_PER_1000M;
  const r = Math.max(0, Math.min(MOIST.MAX_DRAIN, base));
  return r * (inFissure ? 3 : 1) * (mult || 1);
}

export function update(p, dt, world) {
  p.t += dt;
  if (p.iframe > 0) p.iframe -= dt;
  if (p.coyote > 0) p.coyote -= dt;
  if (p.buffer > 0) {
    p.buffer -= dt;
    if (p.grounded) { doJump(p, p.bufferX); }              // 착지 프레임에 자동 점프
  }
  if (p.squashT > 0) {
    p.squashT -= dt;
    const k = p.squashT / JUICE.SQUASH_SEC;
    p.squash = 1 + (JUICE.SQUASH[0] - 1) * k;
  } else p.squash = 1;

  p.vy = Math.min(PHYS.MAX_FALL, p.vy + PHYS.GRAVITY * dt);
  p.x += p.vx * dt;
  p.y += p.vy * dt;

  bounceWalls(p);
  landing(p, world);
  moisture(p, dt, world);
  return p;
}

function bounceWalls(p) {
  const half = HITBOX.w / 2;
  if (p.x < half) { p.x = half; p.vx = -p.vx * PHYS.WALL_BOUNCE; p.wallHits++; }
  else if (p.x > CANVAS.W - half) { p.x = CANVAS.W - half; p.vx = -p.vx * PHYS.WALL_BOUNCE; p.wallHits++; }
}

// 하강 중(vy>0)에만 발판 상단을 붙잡는다. 상승 중에는 통과.
function landing(p, world) {
  if (p.vy <= 0) { p.grounded = false; return; }
  const footPrev = p.y + HITBOX.h / 2 - p.vy * (1 / 60);
  const foot = p.y + HITBOX.h / 2;
  for (const pl of world.platforms) {
    if (pl.dead) continue;
    const pw = pl.w || WORLD.PLATFORM_W;   // 시작 발판은 화면 전체 폭이다
    if (p.x + HITBOX.w / 2 < pl.x || p.x - HITBOX.w / 2 > pl.x + pw) continue;
    if (footPrev <= pl.y && foot >= pl.y) {
      p.y = pl.y - HITBOX.h / 2;
      p.vy = 0; p.vx = 0;
      if (!p.grounded) onLand(p, pl);
      p.grounded = true;
      p.airLeft = p.airMax || 0;
      return;
    }
  }
  if (p.grounded) p.coyote = PHYS.COYOTE_SEC;              // 막 떨어진 순간부터 유예 시작
  p.grounded = false;
}

function onLand(p, pl) {
  p.combo = pl.y < p.lastPlatformY ? p.combo + 1 : 1;   // y 가 작을수록 높다
  p.lastPlatformY = pl.y;
  if (p.combo > p.comboMax) p.comboMax = p.combo;
  p.squashT = JUICE.SQUASH_SEC;
  pl.press = JUICE.PLATFORM_PRESS;
  setTimeout(() => { pl.press = 0; }, 60);
  if (pl.kind === 'crumble' && !pl.crumbling) { pl.crumbling = true; pl.crumbleT = WORLD.CRUMBLE_DELAY; }
  audio.play('land');
}

function moisture(p, dt, world) {
  const rate = p.moistFrozen ? 0 : drainRate(world.altM, world.inFissure, p.drainMult);
  p.drainNow = rate;
  p.moist = Math.max(0, p.moist - rate * dt);

  if (p.moist / p.moistMax <= 0.05) {
    p.dryTimer += dt;
    if (p.dryTimer >= 3) p.dryCounted = true;
  } else p.dryTimer = 0;

  const ratio = p.moist / p.moistMax;
  juice.vignette(ratio < MOIST.WARN_VIGNETTE / 100 ? (1 - ratio / (MOIST.WARN_VIGNETTE / 100)) * JUICE.VIGNETTE_PULSE : 0);

  if (p.moist <= 0 && p.alive) { p.alive = false; p.cause = 'dry'; }
}
