// scenes/gameover.js — Phase 0 최소형: 고도·등급·다시하기. 재시작은 1탭 0.5초 안.
import { CANVAS, UI, GRADES, WORLD, COLORS as C } from '../config.js';
import * as render from '../render.js';
import * as audio from '../audio.js';
import { hit } from '../input.js';

let data = null, pressed = null;

function grade(altM) {
  for (const [ceil, label] of GRADES) if (altM < ceil) return label;
  return GRADES[GRADES.length - 1][1];
}

const scene = {
  enter(game, arg) { data = arg; pressed = null; },

  update() {},

  onPress(game, x, y) {
    if (y > UI.GAMEOVER.MENU_Y - 14) { toTitle(game); return; }   // §22.5 메뉴로
    restart(game);                                                // 그 외 아무 데나 = 재시작
  },

  key(game) { restart(game); },

  render(game, ctx) {
    const { run, settled } = data;
    ctx.fillStyle = C.bgBottom; ctx.fillRect(0, 0, CANVAS.W, CANVAS.H);

    render.text(ctx, run.cause === 'dry' ? '말라버렸다' : '떨어졌다',
      CANVAS.W / 2, UI.GAMEOVER.WORM_Y, 18, C.warn);

    render.text(ctx, `${Math.floor(run.altM).toLocaleString()}m`,
      CANVAS.W / 2, UI.GAMEOVER.ALT_Y, 30);
    render.text(ctx, grade(run.altM), CANVAS.W / 2, UI.GAMEOVER.GRADE_Y, 13, C.accent);
    render.text(ctx, `지표까지 ${Math.max(0, WORLD.SURFACE_M - Math.floor(run.altM)).toLocaleString()}m`,
      CANVAS.W / 2, UI.GAMEOVER.LEFT_Y, 11, C.uiBorder);

    if (settled.newRecord) {
      render.text(ctx, 'NEW RECORD', CANVAS.W / 2, UI.GAMEOVER.NEWREC_Y, 12, C.good);
    }

    render.text(ctx, `최고 ${settled.high.toLocaleString()}m`, UI.GAMEOVER.BEST[0], UI.GAMEOVER.BEST[1], 10, C.uiBorder, 'left');
    render.text(ctx, `물방울 ${run.drops}`, UI.GAMEOVER.COINS[0], UI.GAMEOVER.COINS[1], 10, C.uiBorder, 'right');

    render.button(ctx, UI.GAMEOVER.RETRY, '다시 하기', pressed === 'retry', 14);
    render.button(ctx, UI.GAMEOVER.CHALLENGE, `${run.time.toFixed(1)}초`, false, 12);
    render.text(ctx, '아무 데나 눌러도 다시 시작', CANVAS.W / 2, UI.GAMEOVER.MENU_Y - 16, 9, C.uiBorder);
    render.text(ctx, '메뉴로', CANVAS.W / 2, UI.GAMEOVER.MENU_Y + 8, 11, C.uiText);
  },

  debugInfo() { return { alt: Math.floor(data.run.altM) + 'm', cause: data.run.cause }; },
};

async function restart(game) {
  audio.play('ui');
  const play = (await import('./play.js')).default;
  game.replace(play);
}

async function toTitle(game) {
  audio.play('ui');
  const title = (await import('./title.js')).default;
  game.replace(title);
}

export default scene;
