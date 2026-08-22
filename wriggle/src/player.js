// player.js — 지렁이 물리·수분·콤보. 히트박스 12×14 (§8.1).
import { PHYS, MOIST, WORLD, CANVAS, SKINS, JUICE } from './config.js';
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
    skin, alive: true, cause: null, t: 0,
  };
}

export function jump(p, dir) {
  if (!p.grounded) return;
  p.vy = PHYS.JUMP_VY;
  p.vx = dir === 'Left' ? -PHYS.JUMP_VX : PHYS.JUMP_VX;
  p.face = dir === 'Left' ? -1 : 1;
  p.grounded = false;
  p.squashT = JUICE.SQUASH_SEC;
  audio.play('jump');
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

function drainRate(altM, inFissure) {
  const base = MOIST.BASE_DRAIN + (altM / 1000) * MOIST.DRAIN_PER_1000M;
  const r = Math.max(0, Math.min(MOIST.MAX_DRAIN, base));
  return r * (inFissure ? 3 : 1);
}

export function update(p, dt, world) {
  p.t += dt;
  if (p.iframe > 0) p.iframe -= dt;
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
      return;
    }
  }
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
  const rate = drainRate(world.altM, world.inFissure);
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
