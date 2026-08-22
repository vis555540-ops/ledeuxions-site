// juice.js — 흔들림/히트스톱/파티클/플래시/비네트. 값은 config.JUICE.
import { JUICE } from './config.js';

let shakePx = 0, shakeLeft = 0, stopLeft = 0, flashColor = null, flashLeft = 0, flashDur = 0;
let vig = 0;
const parts = [];

export function shake(px, frames) { shakePx = Math.max(shakePx, px); shakeLeft = Math.max(shakeLeft, frames); }
export function hitstop(frames) { stopLeft = Math.max(stopLeft, frames); }
export function stopped() { return stopLeft > 0; }
export function flash(color, sec) { flashColor = color; flashLeft = flashDur = sec; }
export function vignette(level) { vig = level; }

export function particle(x, y, color, n = 6) {
  for (let i = 0; i < n && parts.length < JUICE.PARTICLE_MAX; i++) {
    parts.push({
      x, y, color,
      vx: (Math.random() - 0.5) * 160,
      vy: -Math.random() * 160,
      life: 0.35 + Math.random() * 0.2, max: 0.55,
    });
  }
}

// 고정 스텝마다 1회. 히트스톱이 걸린 프레임에도 이건 돈다(안 그러면 영영 안 풀린다).
export function step() {
  if (stopLeft > 0) { stopLeft--; return; }
  if (shakeLeft > 0) { shakeLeft--; if (shakeLeft === 0) shakePx = 0; }
  if (flashLeft > 0) flashLeft = Math.max(0, flashLeft - 1 / 60);
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i];
    p.life -= 1 / 60;
    if (p.life <= 0) { parts.splice(i, 1); continue; }
    p.x += p.vx / 60; p.y += p.vy / 60; p.vy += 900 / 60;
  }
}

export function offset() {
  if (shakeLeft <= 0) return { x: 0, y: 0 };
  return { x: (Math.random() - 0.5) * 2 * shakePx, y: (Math.random() - 0.5) * 2 * shakePx };
}

export function drawParticles(ctx, cameraY) {
  for (const p of parts) {
    ctx.globalAlpha = Math.max(0, p.life / p.max);
    ctx.fillStyle = p.color;
    ctx.fillRect(Math.round(p.x), Math.round(p.y - cameraY), 2, 2);
  }
  ctx.globalAlpha = 1;
}

export function drawOverlay(ctx, w, h) {
  if (vig > 0) {
    const g = ctx.createRadialGradient(w / 2, h / 2, h * 0.25, w / 2, h / 2, h * 0.62);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, `rgba(90,10,10,${0.55 * vig})`);
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  }
  if (flashLeft > 0 && flashColor) {
    ctx.globalAlpha = (flashLeft / flashDur) * 0.5;
    ctx.fillStyle = flashColor; ctx.fillRect(0, 0, w, h);
    ctx.globalAlpha = 1;
  }
}

export function reset() {
  shakePx = shakeLeft = stopLeft = flashLeft = 0; flashColor = null; vig = 0; parts.length = 0;
}
