// input.js — 포인터/키보드. §22.1 로 pointerup(손 뗌)까지 봐야 해서 눌림 상태를 들고 있다.
import { CANVAS } from './config.js';

let cb = null, canvasEl = null, unlocked = false;

function toLogical(e) {
  const r = canvasEl.getBoundingClientRect();
  return {
    x: (e.clientX - r.left) * CANVAS.W / r.width,
    y: (e.clientY - r.top) * CANVAS.H / r.height,
  };
}

export function init(canvas, handlers) {
  canvasEl = canvas; cb = handlers;
  let activeId = null;

  canvas.addEventListener('pointerdown', e => {
    e.preventDefault();
    if (activeId !== null) return;              // 멀티터치: 첫 포인터만
    activeId = e.pointerId;
    if (!unlocked) { unlocked = true; cb.onFirstGesture && cb.onFirstGesture(); }
    const p = toLogical(e);
    cb.onPress && cb.onPress(p.x, p.y);
  }, { passive: false });

  const release = e => {
    if (e.pointerId !== activeId) return;
    activeId = null;
    cb.onRelease && cb.onRelease();
  };
  canvas.addEventListener('pointerup', release);
  canvas.addEventListener('pointercancel', release);

  const KEY_X = { ArrowLeft: 0, a: 0, A: 0, ArrowRight: CANVAS.W, d: CANVAS.W, D: CANVAS.W };
  addEventListener('keydown', e => {
    if (e.repeat) return;
    if (!unlocked) { unlocked = true; cb.onFirstGesture && cb.onFirstGesture(); }
    if (e.key in KEY_X) { e.preventDefault(); cb.onPress && cb.onPress(KEY_X[e.key], CANVAS.H / 2); }
    else cb.onKey && cb.onKey(e.key);
  });
  addEventListener('keyup', e => { if (e.key in KEY_X) cb.onRelease && cb.onRelease(); });
}

export function hit(rect, x, y) {
  return x >= rect[0] && x <= rect[0] + rect[2] && y >= rect[1] && y <= rect[1] + rect[3];
}
