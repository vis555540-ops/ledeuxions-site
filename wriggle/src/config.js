// config.js — 꿈틀의 모든 수치. 튜닝은 이 파일만 수정한다.
export const CANVAS = { W: 360, H: 640, FPS: 60 };

export const DEBUG = { CHEAT: false };

// §22.1 점프 개편 — 궤적이 하나뿐이라 지루했다. 세기와 각도를 손가락이 정한다.
export const PHYS = {
  GRAVITY: 2000,
  JUMP_VY: -900,          // 최대(꾹 누름) 점프
  JUMP_CUT_VY: -380,      // 손을 뗀 순간 vy < 이 값이면 vy를 이 값으로 절삭
  JUMP_VX_MAX: 280,       // 화면 끝 탭
  JUMP_VX_MIN: 140,       // 중앙 근처 탭
  MAX_FALL: 1400, WALL_BOUNCE: 0.9,
  BUFFER_SEC: 0.10,       // 입력 버퍼: 착지 전 선입력 유효 시간
  COYOTE_SEC: 0.06,       // 발판 이탈 직후 점프 유예
};

// §22.2 난이도 곡선 — 고정 GAP/폭 폐기. altM 미만 구간에 적용
export const DIFF = [
  { upTo:  150, w:[80,88], gap:[55, 75], dxMax:  90 },
  { upTo:  400, w:[64,76], gap:[60, 90], dxMax: 120 },
  { upTo: 1500, w:[56,68], gap:[60,105], dxMax: 140 },
  { upTo: Infinity, w:[48,64], gap:[60,110], dxMax: 150 },
];

// §22.3 도달 보장 — 최대 점프 기준 간격별 도달 가능 수평거리 (선형 보간)
export const REACH = { 60:150, 75:135, 90:115, 105:95, 110:85 };
export const SAFE_EVERY = 5;              // 다섯 번째 발판은 항상 사다리
export const SAFE_PLATFORM = { w:88, dxMax:60, gapMax:80 };
export const WALL_ESCAPE_PX = 60;         // 벽에서 이 거리 안이면 다음은 중앙 방향

// §22.4 시작 특성 카드
export const START_CARDS = { POOL:['wiggle','feel','cuticle'], Y_OFFSET:-220, REPOS_Y:-350, MAX_REPOS:3 };

export const WORLD = {
  PX_PER_M: 10,            // 10px = 1m
  SURFACE_M: 5000,         // 지표(클리어) 고도
  CAM_LINE: 256,           // 이 y선 위로 가면 카메라 상승 (상단 40%)
  GAP_MIN: 60, GAP_MAX: 110,
  GAP_TUTORIAL_MAX: 75,    // 0~50m 구간 간격 상한
  TUTORIAL_M: 50,
  DX_MAX: 150,             // 발판 수평 산포 반경
  PLATFORM_W: 48, PLATFORM_H: 8,
  SPAWN_AHEAD: 800, DESPAWN_BELOW: 200,
  P_SOIL: 0.60, P_ROOT: 0.20, P_CRUMBLE: 0.20,
  ROOT_SPEED: 40, ROOT_RANGE: 60,
  CRUMBLE_DELAY: 0.3,
  DROP_ON_PLATFORM: 0.35,  // 발판 위 물방울 확률
  DROP_IN_AIR: 0.15,       // 발판 사이 공중 물방울 확률
  GROUND_Y: 576,           // §20.1 시작 발판 월드 y
};

export const FISSURE = {                 // 균열 구간
  EVERY_M: 400, LENGTH_M: 120, START_M: 400,
  DRAIN_MULT: 3.0, DROP_BIG_RATE: 0.6,
  WARN_M: 40,
  SAFE_LANE: true,
};

export const MOIST = {
  MAX: 100, START: 100,
  BASE_DRAIN: 3.0,         // %/s (추정값 — Phase 0 실측 후 조정)
  DRAIN_PER_1000M: 1.2, MAX_DRAIN: 9.0,
  DROP_SMALL: 12, DROP_BIG: 30,
  PICKUP_RADIUS: 40,
  WARN_DESAT: 60, WARN_VIGNETTE: 30, WARN_BLINK: 15,
};

export const LEVEL = {
  EXP_SMALL: 1, EXP_BIG: 3,
  need: n => 5 + 3 * n,
  CARD_Y_OFFSET: -400,
  CARD_X: [60, 180, 300], CARD_W: 64, CARD_H: 48,
};

export const ENEMY = {
  ANT:    { fromM: 200, speed: 80, dmg: 15, hp: 1 },
  PEBBLE: { fromM: 500, dmg: 10, hp: 1 },
  MOLE:   { fromM: 800, dmg: 30, warnSec: 1.2, crossSec: 0.45,
            laneH: 24, intervalMin: 12, intervalMax: 20 },
  DENSITY: alt => Math.min(0.1 + alt / 5000, 0.4),
  KNOCK_VY: 400, IFRAME: 0.6,
};

export const COMBO = { SHOW_FROM: 3 };

export const TRAITS = [
  { id:'wiggle', name:'꿈틀 도약', icon:'꿈틀', max:2, desc:['공중 점프 +1','공중 점프 +2'], air:[1,2] },
  { id:'shot',   name:'점액 분사', icon:'점액', max:2, desc:['점프 시 좌우 점액탄 (쿨 0.8s)','쿨타임 0.4s'], cool:[0.8,0.4] },
  { id:'feel',   name:'촉수 감각', icon:'촉수', max:2, desc:['물방울 흡인 반경 90','흡인 반경 140'], radius:[90,140] },
  { id:'cuticle',name:'두꺼운 각피', icon:'각피', max:2, desc:['건조 속도 -15%','건조 속도 -25%'], mult:[0.85,0.75] },
  { id:'pouch',  name:'물주머니', icon:'주머', max:2, desc:['최대 수분 +30','최대 수분 +50'], add:[30,50] },
  { id:'molt',   name:'허물 벗기', icon:'허물', max:2, desc:['수분 0 시 1회 50% 회복+무적 2s','부활 2회'], lives:[1,2] },
  { id:'humus',  name:'부엽토', icon:'부엽', max:2, desc:['착지 시 15% 코인','착지 시 25% 코인'], rate:[0.15,0.25] },
  { id:'dash',   name:'점액 가속', icon:'가속', max:2, desc:['콤보 5 도달 시 1.5s 무적+가속 (쿨 10s)','콤보 4 트리거, 쿨 8s'],
    trigger:[5,4], cool:[10,8], boostVy:-600, dur:1.5 },
];
export const FILLER_CARD = { id:'dew', name:'이슬', icon:'이슬', moist:25 };

export const LEVEL_CARD = { W:64, H:48, X:[60,180,300] };


export const COLORS = {
  bgTop:'#241811', bgBottom:'#17100b',
  soil:'#7a5a3a', soilTop:'#9b7a4f', soilDark:'#4a3527',
  root:'#4f7a3a', crumble:'#8a6a4a',
  sky:'#ffd166', skyLight:'#fff3c4',
  water:'#4fc3f7', waterHi:'#b3e5fc',
  ant:'#33302c', pebble:'#8a8a8a', mole:'#5b4a63',
  uiText:'#f5efe6', uiPanel:'#2e2119', uiBorder:'#6b5138',
  warn:'#e05a4e', good:'#6fcf97', accent:'#ffd166',
  rain:'#8ad4f0', grass:'#5aa05a',
  dry:'#d9c9a8',            // 수분 감소 시 보간 목표색 (§14)
};

export const SKINS = [
  { id:'basic',    name:'꿈틀이',     cond:'기본',                       c:['#ff9db0','#e56a86','#ffd1dc'] },
  { id:'h100',     name:'새싹',       cond:'고도 100m',                  c:['#a8e6a1','#6fbf6a','#e2ffd9'] },
  { id:'h300',     name:'흙탕이',     cond:'고도 300m',                  c:['#b08d5f','#8a6a42','#d9c39a'] },
  { id:'h600',     name:'이끼',       cond:'고도 600m',                  c:['#7fbf8e','#4f8f63','#cfe8d5'] },
  { id:'h1200',    name:'광부',       cond:'고도 1,200m',                c:['#ffd166','#e0a72e','#fff3c4'] },
  { id:'h2500',    name:'야광이',     cond:'고도 2,500m',                c:['#baffc9','#59d98c','#eaffef'] },
  { id:'h5000',    name:'비의 지렁이', cond:'지표 도달 (클리어)',          c:['#6ec6ff','#2f8fd6','#d6efff'] },
  { id:'ant100',   name:'개미잡이',   cond:'적 100기 격추',              c:['#d96a5a','#a84a3e','#f2b8ad'] },
  { id:'fis3',     name:'햇살이',     cond:'균열 구간 3회 통과',          c:['#ffe08a','#e0b34e','#fff2c9'] },
  { id:'wall50',   name:'벽돌이',     cond:'벽 바운스 50회',             c:['#c96f52','#9a4f3a','#e8b39e'] },
  { id:'combo10',  name:'번개',       cond:'콤보 10 달성',               c:['#fff176','#e0c92e','#ffffd1'] },
  { id:'perfect',  name:'이슬이',     cond:'수분 80% 이상으로 클리어',    c:['#c9f0ff','#8ad4f0','#eefbff'] },
  { id:'mole10',   name:'그림자',     cond:'두더지 10회 회피',           c:['#6b5b7a','#4a3f57','#a597b8'] },
  { id:'c500',     name:'파랑이',     cond:'누적 물방울 500',            c:['#8ab8ff','#5a86d6','#cfe0ff'] },
  { id:'c1000',    name:'바다',       cond:'누적 물방울 1,000',          c:['#5aa0d6','#33709f','#aacfe8'] },
  { id:'c3000',    name:'사파이어',   cond:'누적 물방울 3,000',          c:['#4a6fd6','#2f4a9f','#9fb4e8'] },
  { id:'c10000',   name:'심해',       cond:'누적 물방울 10,000',         c:['#3a4a8f','#232f66','#7f8fc4'] },
  { id:'die50',    name:'불사조',     cond:'50회 사망',                  c:['#ff8a5a','#d65a2f','#ffc4a8'] },
  { id:'dry3',     name:'쭈글이',     cond:'수분 5% 이하 생존 3회',       c:['#d9c9a8','#b0a184','#efe6cf'] },
  { id:'noodle',   name:'국수',       cond:'상점 100코인',               c:['#f5e6c9','#d6c49a','#fff6e0'], price:100 },
  { id:'sausage',  name:'소시지',     cond:'상점 300코인',               c:['#e07a5a','#b8503a','#f2b09a'], price:300 },
];

export const ECON = {
  COIN_PER_100M: 1, COIN_PER_20DROPS: 1,
  GHOST_BEAT_MULT: 2, CLEAR_BONUS: 200,
};

export const GRADES = [
  [50,'아직 흙 속'], [150,'일단 올라감'], [300,'감 잡음'], [600,'좀 하네'],
  [1000,'고수 등장'], [2000,'손가락 미쳤다'], [3500,'전설의 지렁이'],
  [5000,'지표가 보인다'], [Infinity,'밖으로 나갔다'],
];

export const JUICE = {
  SQUASH:[0.7,1.15,1.0], SQUASH_SEC:0.12,
  SHAKE_HIT:{px:4,frames:6}, SHAKE_FISSURE:{px:2,frames:10},
  HITSTOP_FRAMES:3, PARTICLE_MAX:60,
  VIGNETTE_PULSE:0.6, PLATFORM_PRESS:2,
  MILESTONE_M:100, FLASH_DROP:0.15,
};

export const UI = {
  MUTE:[328,8,24,24],
  MOIST_BAR:[6,80,10,220],
  ALT_Y:26, GHOST_Y:46, FISSURE_BANNER:[0,60,360,20], COMBO:[312,180],
  TITLE:{ LOGO_Y:140, SUB_Y:172, BEST_Y:210, CLEAR_Y:232,
    SKIN_PREVIEW_Y:270, SKIN_L:[30,258,28,28], SKIN_R:[302,258,28,28],
    START:[60,300,240,64], COLLECT:[60,390,115,48], SHOP:[185,390,115,48],
    HINT_Y:470, RESET_Y:612 },
  GAMEOVER:{ WORM_Y:150, ALT_Y:230, GRADE_Y:266, LEFT_Y:290, NEWREC_Y:310,
    ICONS:{X0:15,Y:330,CELL:36,GAP:6}, BEST:[40,390], COINS:[320,390],
    RETRY:[24,430,150,56], CHALLENGE:[186,430,150,56], MENU_Y:520 },
  BACK:[8,8,44,44],
  GRID:{X0:24,Y0:120,CELL:72,GAP:8,COLS:4,ROWS:5},
  SHOP_ROWS:[[16,120,328,72],[16,200,328,72],[16,280,328,72]],
};

export const SFX = {
  MASTER:0.5,
  jump:   {type:'square',   f0:420, f1:660, dur:0.06, gain:0.15, rand:0.05},
  land:   {type:'square',   f0:120, f1:100, dur:0.03, gain:0.08},
  drop:   {type:'sine',     f0:880, f1:1320,dur:0.08, gain:0.18},
  bigdrop:{type:'sine',     seq:[[880,0.06],[1174,0.06],[1568,0.10]], gain:0.2},
  hurt:   {type:'sawtooth', f0:200, f1:80,  dur:0.12, gain:0.2},
  card:   {type:'triangle', seq:[[523,0.09],[659,0.09],[784,0.12]], gain:0.18},
  heart:  {type:'sine',     f0:60,  f1:50,  dur:0.08, gain:0.25},
  molewarn:{type:'square',  seq:[[220,0.05],[0,0.05],[220,0.05],[0,0.05],[220,0.05]], gain:0.2},
  clear:  {type:'triangle', seq:[[523,0.12],[659,0.12],[784,0.12],[1046,0.3]], gain:0.22},
  ui:     {type:'square',   f0:700, f1:700, dur:0.03, gain:0.1},
};

// §20.1 파생 상수 — 여기서만 계산한다
export const SURFACE_Y = WORLD.GROUND_Y - WORLD.SURFACE_M * WORLD.PX_PER_M;
