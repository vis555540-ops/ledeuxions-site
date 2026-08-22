// main.js — 부트, 고정 timestep 루프, 씬 스택. game 객체는 여기서만 소유한다.
import { CANVAS, DEBUG } from './config.js';
import * as input from './input.js';
import * as save from './save.js';
import * as audio from './audio.js';
import * as juice from './juice.js';
import playScene from './scenes/play.js';
import gameoverScene from './scenes/gameover.js';

const STEP = 1 / CANVAS.FPS;
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d', { alpha: false });
ctx.imageSmoothingEnabled = false;

// 정수배 스케일만 (§20.2). 논리 해상도는 절대 바꾸지 않는다.
function fit() {
  const s = Math.max(1, Math.min(Math.floor(innerWidth / CANVAS.W), Math.floor(innerHeight / CANVAS.H)));
  canvas.style.width = CANVAS.W * s + 'px';
  canvas.style.height = CANVAS.H * s + 'px';
}
addEventListener('resize', fit);
fit();

for (const ev of ['contextmenu', 'dblclick', 'gesturestart']) {
  addEventListener(ev, e => e.preventDefault());
}

export const game = {
  ctx, canvas,
  scenes: [],
  save: save.load(),
  debug: new URLSearchParams(location.search).get('debug') === '1',
  fps: 0,
  scenesByName: { play: playScene, gameover: gameoverScene },
};

export function pushScene(s, arg) {
  game.scenes.push(s);
  if (s.enter) s.enter(game, arg);
}
export function popScene() {
  const s = game.scenes.pop();
  if (s && s.exit) s.exit(game);
}
export function replaceScene(s, arg) {
  while (game.scenes.length) popScene();
  pushScene(s, arg);
}
game.push = pushScene; game.pop = popScene; game.replace = replaceScene;

function top() { return game.scenes[game.scenes.length - 1]; }

input.init(canvas, {
  onJump(dir) { const s = top(); if (s && s.input) s.input(game, 'jump' + dir); },
  onTap(x, y) { const s = top(); if (s && s.tap) s.tap(game, x, y); },
  onKey(k)    { const s = top(); if (s && s.key) s.key(game, k); },
  onFirstGesture() { audio.unlock(); },
});

let last = performance.now() / 1000, acc = 0, frames = 0, fpsT = 0;

function loop(nowMs) {
  requestAnimationFrame(loop);
  const now = nowMs / 1000;
  const frameDt = now - last;
  last = now;

  acc = Math.min(acc + frameDt, 0.25);   // §20.3 물리 폭주 방지
  while (acc >= STEP) {
    if (!juice.stopped()) {
      const s = top(); if (s && s.update) s.update(game, STEP);
    }
    juice.step();
    acc -= STEP;
  }

  frames++; fpsT += frameDt;
  if (fpsT >= 0.5) { game.fps = Math.round(frames / fpsT); frames = 0; fpsT = 0; }

  const s = top(); if (s && s.render) s.render(game, ctx);
  if (game.debug) drawDebug(ctx);
}

function drawDebug(c) {
  const s = top();
  const d = (s && s.debugInfo) ? s.debugInfo(game) : {};
  c.save();
  c.font = 'bold 8px monospace'; c.fillStyle = '#0f0'; c.textAlign = 'left';
  const lines = [`fps ${game.fps}`, ...Object.entries(d).map(([k, v]) => `${k} ${v}`)];
  lines.forEach((t, i) => c.fillText(t, 4, 12 + i * 10));
  c.restore();
}

audio.setMute(!!game.save.mute);
replaceScene(playScene);
requestAnimationFrame(loop);

if (DEBUG.CHEAT) console.warn('DEBUG.CHEAT 가 켜져 있다 — 배포 전 false 로 되돌릴 것');
