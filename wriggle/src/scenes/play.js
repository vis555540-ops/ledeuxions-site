// scenes/play.js — 코어 루프. 게임은 어떤 경우에도 정지하지 않는다 (§8.5).
import { CANVAS, WORLD, MOIST, UI, COMBO, JUICE, COLORS as C, MOIST as M } from '../config.js';
import * as world from '../world.js';
import * as player from '../player.js';
import * as render from '../render.js';
import * as juice from '../juice.js';
import * as audio from '../audio.js';
import * as save from '../save.js';
import { hit, dirOf } from '../input.js';
import gameover from './gameover.js';

let w = null, p = null, t = 0, tutorialT = 0, milestone = 0, runT = 0;

const scene = {
  enter(game) {
    juice.reset();
    w = world.create();
    p = player.create(game.save);
    t = 0; runT = 0; milestone = 0;
    tutorialT = game.save.st.deaths === 0 ? 2 : 0;   // §20.5 첫 사망 전까지만
    audio.heartbeat(false);
  },

  update(game, dt) {
    t += dt; runT += dt;
    if (tutorialT > 0) tutorialT -= dt;

    player.update(p, dt, w);
    world.update(w, p, dt);

    if (w.pickedUp) {
      const d = w.pickedUp; w.pickedUp = null;
      player.drink(p, d.big ? M.DROP_BIG : M.DROP_SMALL);
      juice.particle(d.x, d.y, C.waterHi, 5);
      audio.play(d.big ? 'bigdrop' : 'drop');
    }

    const ratio = p.moist / p.moistMax;
    audio.heartbeat(ratio < M.WARN_BLINK / 100);

    const m = Math.floor(w.altM / JUICE.MILESTONE_M);
    if (m > milestone) { milestone = m; juice.flash(C.accent, 0.1); }

    if (p.y - 7 > w.cameraY + CANVAS.H) { p.alive = false; p.cause = 'fall'; }
    if (!p.alive) die(game);
  },

  input(game, kind) { if (p && p.alive) player.jump(p, kind === 'jumpLeft' ? 'Left' : 'Right'); },

  tap(game, x, y) {
    if (hit(UI.MUTE, x, y)) {                 // §20.5 음소거 사각형은 점프로 안 센다
      const m = !audio.isMuted(); audio.setMute(m); save.setMute(m); audio.play('ui');
      return;
    }
    if (p && p.alive) player.jump(p, dirOf(x));
  },

  render(game, ctx) {
    const off = juice.offset();
    ctx.save(); ctx.translate(Math.round(off.x), Math.round(off.y));

    render.bg(ctx, w.cameraY, w.fissureMix);
    for (const pl of w.platforms) render.platform(ctx, pl, w.cameraY);
    for (const d of w.drops) if (!d.taken) render.drop(ctx, d, w.cameraY, t);
    juice.drawParticles(ctx, w.cameraY);
    render.worm(ctx, p, w.cameraY, t);

    ctx.restore();
    juice.drawOverlay(ctx, CANVAS.W, CANVAS.H);
    hud(ctx);
  },

  key(game, k) { /* PLAY 중 별도 키 없음 */ },

  debugInfo() {
    return {
      alt: Math.floor(w.altM) + 'm',
      moist: p.moist.toFixed(0),
      drain: (p.drainNow || 0).toFixed(1),
      plat: w.platforms.length,
      drops: w.drops.length,
      combo: p.combo,
    };
  },
};

function hud(ctx) {
  render.gauge(ctx, p.moist / p.moistMax);
  render.text(ctx, `${Math.floor(w.altM).toLocaleString()}m`, CANVAS.W / 2, UI.ALT_Y, 16);
  render.text(ctx, `지표까지 ${Math.max(0, WORLD.SURFACE_M - Math.floor(w.altM)).toLocaleString()}m`,
    CANVAS.W / 2, UI.GHOST_Y, 9, C.uiBorder);

  if (p.combo >= COMBO.SHOW_FROM) {
    render.text(ctx, `x${p.combo}`, UI.COMBO[0], UI.COMBO[1], 14, C.accent, 'right');
  }
  if (w.inFissure) {
    const [bx, by, bw, bh] = UI.FISSURE_BANNER;
    ctx.fillStyle = 'rgba(255,209,102,0.18)'; ctx.fillRect(bx, by, bw, bh);
    render.text(ctx, '균열 — 빨리 마른다', CANVAS.W / 2, by + 14, 10, C.sky);
  }
  // 음소거 버튼 — 배경색과 거의 같아 안 보였다. 테두리를 준다
  const [mx, my, mw, mh] = UI.MUTE;
  ctx.fillStyle = C.uiPanel; ctx.fillRect(mx, my, mw, mh);
  ctx.strokeStyle = C.uiBorder; ctx.lineWidth = 1;
  ctx.strokeRect(mx + 0.5, my + 0.5, mw - 1, mh - 1);
  render.text(ctx, audio.isMuted() ? '음' : '소', mx + mw / 2, my + mh / 2 + 4, 10);

  if (tutorialT > 0) {
    render.text(ctx, '화면 왼쪽/오른쪽을 탭', CANVAS.W / 2, 420, 12, C.uiText);
    render.text(ctx, '탭한 쪽으로 뛴다', CANVAS.W / 2, 440, 10, C.uiBorder);
  }
}

function die(game) {
  const run = {
    altM: w.altM, drops: p.drops, cause: p.cause, combo: p.comboMax,
    time: runT, wall: p.wallHits, fis: w.fissureCount, dry: p.dryCounted ? 1 : 0,
  };
  console.log(`[RUN] ${runT.toFixed(1)}s alt=${Math.floor(w.altM)}m cause=${p.cause} drops=${p.drops} combo=${p.comboMax}`);
  save.addStats({ drops: p.drops, wall: p.wallHits, fis: w.fissureCount, dry: run.dry });
  const s = save.load();
  if (p.comboMax > s.st.comboMax) { s.st.comboMax = p.comboMax; save.commit(); }
  const settled = save.settle(run);
  audio.heartbeat(false);
  juice.shake(JUICE.SHAKE_HIT.px, JUICE.SHAKE_HIT.frames);
  game.replace(gameover, { run, settled });
}

export default scene;
