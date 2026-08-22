// render.js — 도트 없이 도형으로만 그린다 (§14). 좌표는 전부 월드 → 화면 변환 후 정수 반올림.
import { CANVAS, COLORS as C, WORLD, MOIST, UI } from './config.js';

const R = Math.round;

export function bg(ctx, cameraY, fissureMix = 0) {
  const g = ctx.createLinearGradient(0, 0, 0, CANVAS.H);
  g.addColorStop(0, mix(C.bgTop, C.sky, fissureMix * 0.55));
  g.addColorStop(1, mix(C.bgBottom, C.sky, fissureMix * 0.35));
  ctx.fillStyle = g; ctx.fillRect(0, 0, CANVAS.W, CANVAS.H);

  // 흙 얼룩 — 고도 시드 기반이라 스크롤해도 제자리에 붙어 있다 (§20.4)
  ctx.fillStyle = C.soilDark;
  const y0 = Math.floor(cameraY / 16) - 1, y1 = y0 + Math.ceil(CANVAS.H / 16) + 2;
  for (let cy = y0; cy <= y1; cy++) {
    for (let cx = 0; cx < CANVAS.W / 16; cx++) {
      if (hash(cy * 1000 + cx) > 0.82) {
        ctx.fillRect(cx * 16 + 6, R(cy * 16 - cameraY) + 6, 2, 2);
      }
    }
  }
  if (fissureMix > 0) beams(ctx, fissureMix);
}

function beams(ctx, m) {
  ctx.save(); ctx.globalAlpha = 0.25 * m; ctx.fillStyle = C.skyLight;
  for (const x of [70, 230]) {
    ctx.beginPath();
    ctx.moveTo(x, 0); ctx.lineTo(x + 40, 0);
    ctx.lineTo(x + 100, CANVAS.H); ctx.lineTo(x + 60, CANVAS.H);
    ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}

export function platform(ctx, p, cameraY) {
  const x = R(p.x), y = R(p.y - cameraY) + (p.press || 0);
  const w = p.w || WORLD.PLATFORM_W, h = WORLD.PLATFORM_H;
  if (y < -h || y > CANVAS.H) return;
  ctx.fillStyle = p.kind === 'crumble' ? C.crumble : C.soil;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = p.kind === 'root' ? C.root : C.soilTop;
  ctx.fillRect(x, y, w, 2);
  if (p.kind === 'root') {
    ctx.fillStyle = C.soilDark;
    ctx.fillRect(x, y, 1, h); ctx.fillRect(x + w - 1, y, 1, h);
  }
  if (p.kind === 'crumble') {
    ctx.fillStyle = C.soilDark;
    ctx.fillRect(x + 14, y + 3, 1, h - 3);
    ctx.fillRect(x + 32, y + 2, 1, h - 2);
  }
}

// 지렁이: 반지름 5 원 3개 + 웨이브. 수분이 낮을수록 마른 색으로 간다.
export function worm(ctx, p, cameraY, t) {
  const moistRatio = Math.max(0, Math.min(1, p.moist / p.moistMax));
  if (p.moist / p.moistMax < MOIST.WARN_BLINK / 100 && Math.floor(t * 10) % 2 === 0) return;
  if (p.iframe > 0 && Math.floor(t * 10) % 2 === 0) return;

  const body = mix(C.dry, p.skin[0], moistRatio);
  const dark = mix(C.dry, p.skin[1], moistRatio);
  const scaleY = p.moist / p.moistMax < MOIST.WARN_BLINK / 100 ? 0.85 : 1;
  const cx = R(p.x), cy = R(p.y - cameraY);
  const dir = p.face || 1;

  for (let i = 2; i >= 0; i--) {
    const ox = (i - 1) * 6 * -dir;
    const oy = Math.sin(t * 10 + i * 1.2) * 1.5;
    ctx.fillStyle = i === 0 ? body : dark;
    ellipse(ctx, cx + ox, cy + oy * scaleY, 5, 5 * scaleY * (p.squash || 1));
  }
  // 머리 = 진행 방향 쪽 마디
  const hx = cx + 6 * dir * 0 + 0;
  ctx.fillStyle = '#fff';
  ctx.fillRect(hx - 2 + dir, cy - 2, 2, 2); ctx.fillRect(hx + 1 + dir, cy - 2, 2, 2);
  ctx.fillStyle = '#000';
  ctx.fillRect(hx - 1 + dir, cy - 1, 1, 1); ctx.fillRect(hx + 2 + dir, cy - 1, 1, 1);
  ctx.fillStyle = p.skin[2];
  ctx.fillRect(hx - 3 + dir, cy + 2, 1, 1);
}

function ellipse(ctx, x, y, rx, ry) {
  ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
}

export function drop(ctx, d, cameraY, t) {
  const y = R(d.y - cameraY);
  if (y < -10 || y > CANVAS.H + 10) return;
  const r = (d.big ? 6 : 4) + Math.sin(t * 6) * 0.5;
  ctx.fillStyle = C.water; ellipse(ctx, R(d.x), y, r, r);
  ctx.fillStyle = C.waterHi; ctx.fillRect(R(d.x) - 2, y - 2, 1, 1);
}

export function gauge(ctx, ratio) {
  const [x, y, w, h] = UI.MOIST_BAR;
  ctx.fillStyle = C.uiPanel; ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = C.uiBorder; ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  const fh = R((h - 2) * Math.max(0, Math.min(1, ratio)));
  ctx.fillStyle = ratio > 0.3 ? C.water : C.warn;
  ctx.fillRect(x + 1, y + h - 1 - fh, w - 2, fh);
}

export function text(ctx, s, x, y, size = 12, color = C.uiText, align = 'center') {
  ctx.font = `bold ${size}px monospace`;
  ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = 'alphabetic';
  ctx.fillText(s, x, y);
}

export function button(ctx, rect, label, pressed = false, size = 14) {
  const [x, y, w, h] = rect, dy = pressed ? 2 : 0;
  ctx.fillStyle = C.uiPanel; ctx.fillRect(x, y + dy, w, h);
  ctx.strokeStyle = C.uiBorder; ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + dy + 0.5, w - 1, h - 1);
  text(ctx, label, x + w / 2, y + dy + h / 2 + size * 0.36, size);
}


export function card(ctx, c, cameraY, label) {
  const w = 64, h = 48;
  const x = R(c.x - w / 2), y = R(c.y - h / 2 - cameraY);
  if (y < -h || y > CANVAS.H) return;
  ctx.fillStyle = C.uiPanel; ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = C.accent; ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  text(ctx, label.icon, x + w / 2, y + 24, 14, C.uiText);
  text(ctx, label.name, x + w / 2, y + 40, 8, C.uiBorder);
}

export function hash(n) {
  const s = Math.sin(n * 12.9898) * 43758.5453;
  return s - Math.floor(s);
}

export function mix(a, b, t) {
  t = Math.max(0, Math.min(1, t));
  const pa = hex(a), pb = hex(b);
  return `rgb(${R(pa[0] + (pb[0] - pa[0]) * t)},${R(pa[1] + (pb[1] - pa[1]) * t)},${R(pa[2] + (pb[2] - pa[2]) * t)})`;
}
function hex(h) {
  // mix() 결과(rgb 문자열)를 다시 mix 에 넣는 경우가 있어 둘 다 받는다
  if (h[0] !== '#') {
    const m = h.match(/\d+/g);
    return m ? m.slice(0, 3).map(Number) : [0, 0, 0];
  }
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
