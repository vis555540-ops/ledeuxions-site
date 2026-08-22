// input.js — 포인터/키보드를 점프 신호로만 바꾼다. UI 판정은 씬이 한다.
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
    if (activeId !== null) return;          // 멀티터치: 첫 포인터만
    activeId = e.pointerId;
    if (!unlocked) { unlocked = true; cb.onFirstGesture && cb.onFirstGesture(); }
    const p = toLogical(e);
    cb.onTap && cb.onTap(p.x, p.y);
  }, { passive: false });

  const clear = e => { if (e.pointerId === activeId) activeId = null; };
  canvas.addEventListener('pointerup', clear);
  canvas.addEventListener('pointercancel', clear);

  addEventListener('keydown', e => {
    if (!unlocked) { unlocked = true; cb.onFirstGesture && cb.onFirstGesture(); }
    const k = e.key;
    if (k === 'ArrowLeft' || k === 'a' || k === 'A') { e.preventDefault(); cb.onJump('Left'); }
    else if (k === 'ArrowRight' || k === 'd' || k === 'D') { e.preventDefault(); cb.onJump('Right'); }
    else cb.onKey && cb.onKey(k);
  });
}

// 씬이 "이 탭은 점프다" 라고 판단했을 때 방향만 물어본다.
export function dirOf(x) { return x < CANVAS.W / 2 ? 'Left' : 'Right'; }

export function hit(rect, x, y) {
  return x >= rect[0] && x <= rect[0] + rect[2] && y >= rect[1] && y <= rect[1] + rect[3];
}
