// scenes/title.js — §22.5 Phase 0.5. 도감·상점은 자리만 잡고 토스트로 막는다.
import { CANVAS, UI, COLORS as C, SKINS } from '../config.js';
import * as render from '../render.js';
import * as audio from '../audio.js';
import * as save from '../save.js';
import { hit } from '../input.js';

let toast = 0, toastMsg = '', t = 0, confirmWipe = 0;

const scene = {
  enter() { t = 0; toast = 0; confirmWipe = 0; },

  update(game, dt) {
    t += dt;
    if (toast > 0) toast -= dt;
    if (confirmWipe > 0) confirmWipe -= dt;
  },

  onPress(game, x, y) {
    const T = UI.TITLE;
    if (hit(T.START, x, y)) { audio.play('ui'); start(game); return; }
    if (hit(T.COLLECT, x, y) || hit(T.SHOP, x, y)) { say('아직 잠겨 있어요'); return; }
    if (hit(UI.MUTE, x, y)) {
      const m = !audio.isMuted(); audio.setMute(m); save.setMute(m); audio.play('ui'); return;
    }
    if (y > T.RESET_Y - 14) {                    // 데이터 초기화 — 두 번 눌러야 지운다
      if (confirmWipe > 0) { save.wipe(); game.save = save.load(); say('지웠습니다'); confirmWipe = 0; }
      else { say('한 번 더 누르면 기록이 지워집니다'); confirmWipe = 3; }
      return;
    }
    start(game);                                  // 그 외엔 바로 시작 — 마찰 0
  },

  key(game) { start(game); },

  render(game, ctx) {
    const T = UI.TITLE, s = game.save;
    ctx.fillStyle = C.bgBottom; ctx.fillRect(0, 0, CANVAS.W, CANVAS.H);

    render.text(ctx, '꿈틀', CANVAS.W / 2, T.LOGO_Y, 40, C.uiText);
    render.text(ctx, '지표까지 5,000m', CANVAS.W / 2, T.SUB_Y, 12, C.accent);
    render.text(ctx, `최고 ${(s.high || 0).toLocaleString()}m`, CANVAS.W / 2, T.BEST_Y, 12, C.uiBorder);
    if (s.cleared) render.text(ctx, '클리어함', CANVAS.W / 2, T.CLEAR_Y, 10, C.good);

    drawWorm(ctx, CANVAS.W / 2, T.SKIN_PREVIEW_Y, s);

    render.button(ctx, T.START, '시작', false, 20);
    render.button(ctx, T.COLLECT, '도감', false, 13);
    render.button(ctx, T.SHOP, '상점', false, 13);
    render.text(ctx, '탭한 쪽으로 뛴다 · 꾹 누르면 높이', CANVAS.W / 2, T.HINT_Y, 10, C.uiBorder);
    render.text(ctx, '기록 초기화', CANVAS.W / 2, T.RESET_Y, 9, C.uiBorder);

    const [mx, my, mw, mh] = UI.MUTE;
    ctx.fillStyle = C.uiPanel; ctx.fillRect(mx, my, mw, mh);
    ctx.strokeStyle = C.uiBorder; ctx.lineWidth = 1;
    ctx.strokeRect(mx + 0.5, my + 0.5, mw - 1, mh - 1);
    render.text(ctx, audio.isMuted() ? '음' : '소', mx + mw / 2, my + mh / 2 + 4, 10);

    if (toast > 0) {
      ctx.fillStyle = 'rgba(0,0,0,0.65)'; ctx.fillRect(40, 540, 280, 32);
      render.text(ctx, toastMsg, CANVAS.W / 2, 561, 11);
    }
  },
};

function drawWorm(ctx, cx, cy, s) {
  const skin = (SKINS.find(k => k.id === s.skin) || SKINS[0]).c;
  for (let i = 2; i >= 0; i--) {
    ctx.fillStyle = i === 0 ? skin[0] : skin[1];
    ctx.beginPath();
    ctx.ellipse(cx + (i - 1) * -8, cy + Math.sin(t * 4 + i * 1.2) * 2, 7, 7, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function say(m) { toast = 1.2; toastMsg = m; audio.play('ui'); }

async function start(game) {
  const play = (await import('./play.js')).default;
  game.replace(play);
}

export default scene;
