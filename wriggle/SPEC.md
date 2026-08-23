# SPEC.md — 꿈틀 (Wriggle) 완전 스펙 v4

> 이 문서는 Claude Code가 **질문 없이 끝까지 구현**할 수 있도록 모든 수치·좌표·데이터·순서를 확정한 문서다.
> 여기 없는 결정은 CLAUDE.md의 결정 프로토콜을 따른다. 작업 순서는 §16.

---

## 1. 콘셉트와 엔딩 구조

지렁이가 땅속에서 지표의 구멍(고도 **5,000m**)을 향해 올라간다.
올라갈수록 지표에 가까워져 **빨리 마른다.** 물방울을 주우면 버틴다.

### 1.1 게임의 끝 (확정)

| 결말 | 조건 | 처리 |
|---|---|---|
| 게임오버 | 화면 하단 이탈 **또는** 수분 0 | §6.3 게임오버 화면 |
| **클리어 (엔딩)** | 고도 5,000m 도달 | §6.4 엔딩 시퀀스 → 클리어 화면 |
| **완벽 클리어** | 도달 시점 수분 ≥ 80 | 엔딩에 추가 문구 + 전용 스킨 |

- 클리어 후에도 게임은 반복 플레이된다. 두 번째 경쟁 축은 **클리어 타임**(빨리 나가기).
- 게임오버 화면에는 항상 `지표까지 N,NNNm` 을 표시해 목표를 살려둔다.

### 1.2 테마 규칙 (엄수)
- 실사 지렁이 금지. §14의 도형 캐릭터로만.
- 수분에 따라 외형 변화: 100% 통통·진한 색 → 30% 밝아짐 → 15% 깜빡임 + 세로 0.85배.

---

## 2. 기술 기준

- 논리 해상도 **360×640**, 논리 60Hz 고정(accumulator), 캔버스 정수배 스케일, `imageSmoothingEnabled=false`.
- 텍스트는 시스템 `monospace` 폰트 허용 (유일한 예외 의존성).
- **로컬 테스트는 반드시 `python3 -m http.server 8000` 으로.** ES Modules는 `file://` 에서 차단된다.

### 2.2 index.html (이 내용 그대로 생성)

```html
<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover">
<title>꿈틀 — 지표까지 5,000m</title>
<meta name="description" content="마르기 전에 올라가라! 원터치 지렁이 점프 게임">
<style>
  html,body{margin:0;padding:0;background:#1c130e;height:100%;overflow:hidden;
    touch-action:none;-webkit-user-select:none;user-select:none;
    -webkit-tap-highlight-color:transparent;overscroll-behavior:none}
  #game{display:block;margin:0 auto;image-rendering:pixelated;image-rendering:crisp-edges}
</style>
</head>
<body>
<canvas id="game" width="360" height="640"></canvas>
<script type="module" src="src/main.js"></script>
</body>
</html>
```

- 캔버스 표시 크기: `min(floor(innerW/360), floor(innerH/640))` 배율(최소 1). `resize` 이벤트에서 재계산.
- `contextmenu`, `dblclick`, `gesturestart` 는 `preventDefault`.

---

## 3. 색 팔레트 (전 파일 공통 — config.js `COLORS`)

| 키 | HEX | 용도 |
|---|---|---|
| bgTop | #241811 | 땅속 배경 상단 |
| bgBottom | #17100b | 땅속 배경 하단 |
| soil | #7a5a3a | 발판 몸통 |
| soilTop | #9b7a4f | 발판 윗면 2px |
| soilDark | #4a3527 | 균열/그림자 |
| root | #4f7a3a | 뿌리 발판 윗면 |
| crumble | #8a6a4a | 부슬흙 발판 |
| sky | #ffd166 | 균열 구간 빛 |
| skyLight | #fff3c4 | 빛줄기 |
| water | #4fc3f7 | 물방울 |
| waterHi | #b3e5fc | 물방울 하이라이트 |
| ant | #33302c | 개미 |
| pebble | #8a8a8a | 돌 |
| mole | #5b4a63 | 두더지 |
| uiText | #f5efe6 | 기본 텍스트 |
| uiPanel | #2e2119 | 버튼/패널 배경 |
| uiBorder | #6b5138 | 패널 테두리 |
| warn | #e05a4e | 경고 |
| good | #6fcf97 | 성공/획득 |
| accent | #ffd166 | 강조/콤보 |
| rain | #8ad4f0 | 엔딩 빗줄기 |
| grass | #5aa05a | 엔딩 풀밭 |

---

## 4. config.js (이 내용 그대로 생성 — 유일한 튜닝 지점)

```js
// config.js — 꿈틀의 모든 수치. 튜닝은 이 파일만 수정한다.
export const CANVAS = { W: 360, H: 640, FPS: 60 };

export const PHYS = {
  GRAVITY: 2000, JUMP_VY: -900, JUMP_VX: 260,
  MAX_FALL: 1400, WALL_BOUNCE: 0.9,
};

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
};

export const FISSURE = {                 // 균열 구간
  EVERY_M: 400, LENGTH_M: 120, START_M: 400,
  DRAIN_MULT: 3.0, DROP_BIG_RATE: 0.6,  // 구간 내 발판당 큰 물방울 확률
  WARN_M: 40,                            // 진입 N m 전 경고 배너
  SAFE_LANE: true,                       // 좌/우 한쪽에 우회 루트 보장
};

export const MOIST = {
  MAX: 100, START: 100,
  BASE_DRAIN: 3.0,         // %/s (추정값 — Phase 0 실측 후 조정)
  DRAIN_PER_1000M: 1.2, MAX_DRAIN: 9.0,
  DROP_SMALL: 12, DROP_BIG: 30,
  PICKUP_RADIUS: 40,       // 기본 흡인 반경(px). 촉수 감각이 확장
  WARN_DESAT: 60, WARN_VIGNETTE: 30, WARN_BLINK: 15,  // 연출 임계 %
};

export const LEVEL = {
  EXP_SMALL: 1, EXP_BIG: 3,
  need: n => 5 + 3 * n,       // 레벨 n→n+1 필요 EXP
  CARD_Y_OFFSET: -400,        // 카드 생성 높이 (플레이어 기준)
  CARD_X: [60, 180, 300], CARD_W: 64, CARD_H: 48,
};

export const ENEMY = {
  ANT:    { fromM: 200, speed: 80, dmg: 15, hp: 1 },
  PEBBLE: { fromM: 500, dmg: 10, hp: 1 },
  MOLE:   { fromM: 800, dmg: 30, warnSec: 1.2, crossSec: 0.45,
            laneH: 24, intervalMin: 12, intervalMax: 20 },
  DENSITY: alt => Math.min(0.1 + alt / 5000, 0.4),  // 발판당 적 확률
  KNOCK_VY: 400, IFRAME: 0.6,
};

export const COMBO = { SHOW_FROM: 3 };  // 더 높은 발판 착지 +1, 아니면 1로 리셋

// ─── 특성 8종 (id, 이름, 2글자 아이콘, 레벨별 효과) ───
export const TRAITS = [
  { id:'wiggle', name:'꿈틀 도약', icon:'꿈틀', max:2, desc:['공중 점프 +1','공중 점프 +2'] },
  { id:'shot',   name:'점액 분사', icon:'점액', max:2, desc:['점프 시 좌우 점액탄 (쿨 0.8s)','쿨타임 0.4s'],
    cool:[0.8,0.4] },
  { id:'feel',   name:'촉수 감각', icon:'촉수', max:2, desc:['물방울 흡인 반경 90','흡인 반경 140'],
    radius:[90,140] },
  { id:'cuticle',name:'두꺼운 각피', icon:'각피', max:2, desc:['건조 속도 -15%','건조 속도 -25%'],
    mult:[0.85,0.75] },
  { id:'pouch',  name:'물주머니', icon:'주머', max:2, desc:['최대 수분 +30','최대 수분 +50'],
    add:[30,50] },
  { id:'molt',   name:'허물 벗기', icon:'허물', max:2, desc:['수분 0 시 1회 50% 회복+무적 2s','부활 2회'],
    lives:[1,2] },
  { id:'humus',  name:'부엽토', icon:'부엽', max:2, desc:['착지 시 15% 코인','착지 시 25% 코인'],
    rate:[0.15,0.25] },
  { id:'dash',   name:'점액 가속', icon:'가속', max:2, desc:['콤보 5 도달 시 1.5s 무적+가속 (쿨 10s)','콤보 4 트리거, 쿨 8s'],
    trigger:[5,4], cool:[10,8], boostVy:-600, dur:1.5 },
];
export const FILLER_CARD = { id:'dew', name:'이슬', icon:'이슬', moist:25 }; // 카드 풀 부족 시

// ─── 스킨 21종 (basic + 해금 20) : [body, bodyDark, accent] ───
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

export const SHOP = {
  moist: { name:'시작 수분',   effect:'+5/Lv',  max:5, price:[20,40,80,160,320] },
  coin:  { name:'코인 획득',   effect:'+10%/Lv', max:5, price:[30,60,120,240,480] },
  trait: { name:'시작 특성',   effect:'무작위 특성 1개 보유', max:1, price:[500] },
};

export const ECON = {
  COIN_PER_100M: 1,          // 정산: floor(고도/100)
  COIN_PER_20DROPS: 1,       // 정산: floor(물방울/20)
  GHOST_BEAT_MULT: 2,        // 고스트 추월 시 정산 x2
  CLEAR_BONUS: 200,
};

export const GRADES = [      // [상한 고도(미만), 문구]
  [50,'아직 흙 속'], [150,'일단 올라감'], [300,'감 잡음'], [600,'좀 하네'],
  [1000,'고수 등장'], [2000,'손가락 미쳤다'], [3500,'전설의 지렁이'],
  [5000,'지표가 보인다'], [Infinity,'밖으로 나갔다'],
];

export const GHOST = { G_MIN:1, G_MAX:5000, NAME_MAX:8, NAME_FALLBACK:'친구' };

export const ENDING = {
  ASCEND_SEC:1.2, FADE_SEC:0.5, RAIN_SEC:3.0, REFILL_SEC:1.2,
  TYPE_MS:24, MIN_HOLD:1.5, PERFECT_MOIST:80,
  LINE1:'구멍 밖은 — 비가 내리고 있었다.',
  LINE2:'그리고 너는 하나도 마르지 않았다.',
};

export const JUICE = {
  SQUASH:[0.7,1.15,1.0], SQUASH_SEC:0.12,
  SHAKE_HIT:{px:4,frames:6}, SHAKE_FISSURE:{px:2,frames:10},
  HITSTOP_FRAMES:3, PARTICLE_MAX:60,
  VIGNETTE_PULSE:0.6, PLATFORM_PRESS:2,
  MILESTONE_M:100, FLASH_DROP:0.15,
};

export const UI = {   // 모든 사각형 [x,y,w,h] — 임의 배치 금지
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
  GRID:{X0:24,Y0:120,CELL:72,GAP:8,COLS:4,ROWS:5},        // 도감
  SHOP_ROWS:[[16,120,328,72],[16,200,328,72],[16,280,328,72]],
};

export const SFX = {  // WebAudio 신스 파라미터 (§13)
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
```

**추정값 표기:** `MOIST.BASE_DRAIN`, `WORLD.GAP_*`, `FISSURE.EVERY_M`, `WORLD.DROP_*` 4계열은 추정이다. Phase 0/1 실측 후 이 파일에서만 조정한다.

---

## 5. 상태 머신

```
BOOT → TITLE
TITLE → PLAY | COLLECTION | SHOP
COLLECTION → TITLE      SHOP → TITLE
PLAY → GAMEOVER | ENDING
GAMEOVER → PLAY(다시하기) | TITLE(메뉴)
ENDING → CLEAR화면 → PLAY | TITLE
어느 씬이든: visibilitychange(hidden) && PLAY → PAUSED 오버레이, 탭으로 복귀
```

- 씬은 `{enter, update(dt), render(ctx), input(e), exit}` 인터페이스 통일. main.js가 스택 관리.
- BOOT: 세이브 로드 + AudioContext 준비(첫 제스처에서 resume)만 하고 즉시 TITLE.

---

## 6. 화면별 레이아웃 (좌표는 config.UI — 여기 수치가 원본)

### 6.1 TITLE
- "꿈틀" 48px bold, y=140 중앙 / "WRIGGLE · 지표까지 5,000m" 12px, y=172
- 최고기록 `최고 1,240m` 14px y=210. 클리어 시 y=232에 `☔ 클리어 07:32` (bestTime)
- 현재 스킨 지렁이 미리보기(3배) y=270, 좌우 `‹ ›` 버튼으로 **해금된 스킨만** 순환(저장됨)
- **[ 시작 ]** (60,300,240,64) 20px — 탭 시 PLAY
- **[ 도감 ]** (60,390,115,48) / **[ 상점 ]** (185,390,115,48)
- 힌트 `화면 왼쪽 / 오른쪽을 탭!` 12px y=470
- 하단 y=612: `데이터 초기화` 10px 회색. 1탭 → warn색 `한 번 더 누르면 전체 삭제`(3초 유지) → 2탭 시 localStorage 삭제 후 reload. (`confirm()` 금지 원칙의 대체 패턴)
- 우상단 음소거 토글(전 씬 공통, 328,8,24,24): 🔇/🔊 는 도형으로 그림. 기본 ON(음소거)

### 6.2 PLAY (HUD)
- 수분 바 (6,80,10,220): 테두리 1px uiText, 아래→위 채움, 색 water / 30% 미만 warn
- 고도 `1,240m` 16px 중앙 y=26
- 고스트 라벨(있을 때) 12px y=46: `르통통 1,240m` — 라인은 월드에 점선으로
- 콤보 `×5` 14px accent (312,180), 콤보<3이면 숨김
- 균열 경고: (0,60,360,20) warn 40% 투명 배경 + `⚠ 균열 구간` — 진입 40m 전부터 통과 시까지
- 첫 판 한정: 시작 2초간 좌/우 하단에 반투명 손가락 도형(원+삼각). 텍스트 튜토리얼 없음
- PAUSED: 검정 60% 오버레이 + `탭하여 계속` 16px 중앙. 복귀 시 0.5초 카운트 없이 즉시 재개

### 6.3 GAMEOVER
- 마른 지렁이(수분 0 외형) 3배 y=150
- 고도 숫자 40px bold y=230 / 등급 문구(§4 GRADES) 16px y=266
- `지표까지 3,760m` 12px y=290 (클리어 판이면 표기 없음)
- 신기록 시 y=310 `NEW RECORD!` accent 점멸(0.4s 주기)
- 특성 아이콘 8칸: x0=15, y=330, 셀 36, 간격 6. 미획득=uiPanel 빈칸, 획득=accent 테두리+2글자 아이콘, Lv2=이중 테두리
- `최고 1,588m` (40,390 좌정렬) / `+47c` good색 (320,390 우정렬)
- **[ 다시 하기 ]** (24,430,150,56) / **[ 친구에게 도전 ]** (186,430,150,56)
- `메뉴로` 12px y=520
- 다시 하기는 **아무 키보드 키로도** 동작. 탭→재시작까지 0.5초 이내, 팝업·지연 금지

### 6.4 ENDING (스크립트 시퀀스 — ending.js)
1. 고도 5,000m 도달 순간: 입력 차단, 화면 상단 중앙에 구멍(40×24 타원, 밝은 하늘색) 표시, 지렁이 자동 상승 1.2s
2. 흰색 페이드 인 0.5s
3. 비 장면 3.0s: 상단 하늘 그라데이션(sky→skyLight), 하단 40px 풀밭(grass), 빗줄기 40개(rain색 2px 선, 속도 400px/s 재활용 풀), 지렁이 중앙. 수분 바가 1.2s에 걸쳐 100까지 참
4. 중앙 텍스트 타자기 연출(24ms/글자): LINE1. **완벽 클리어**(도달 시 수분≥80)면 줄바꿈 후 LINE2
5. 최소 1.5s 유지 후 탭 → 클리어 화면: §6.3 레이아웃 재사용, 등급 `밖으로 나갔다`, y=310에 `클리어 07:32`, 보상 `+200c` 표시, 공유 URL은 `?g=5000&c=1&t=초`
- 보상 처리: coins+=200(코인 배수 적용 안 함), 스킨 `h5000` 해금, 완벽이면 `perfect` 해금, `cleared=true`, `bestTime=min(기존, 이번)`

### 6.5 COLLECTION (도감)
- 뒤로(8,8,44,44) `‹` / 제목 `도감` 16px y=30 중앙 / 우측 y=30 `12 / 21`
- 4×5 그리드: x0=24, y0=120, 셀 72, 간격 8 (21번째 `sausage`는 2페이지가 아니라 **그리드 아래 y=520에 단독 1칸**)
- 해금 칸: 스킨 색 지렁이 미리보기 + 이름 8px. 탭 → 장착(테두리 accent)
- 잠금 칸: 실루엣(soilDark 단색) + 조건 텍스트 7px 2줄. 상점 스킨은 가격 표시, 코인 충분 시 탭 2회(1탭=가격 강조, 2탭=구매)로 즉시 구매
- 하단 y=600: 통계 요약 1줄 `사망 132 · 물방울 2,480 · 격추 87`

### 6.6 SHOP (상점)
- 뒤로 / 제목 `상점` / 우상단 y=30 `보유 470c` accent
- 3행 카드 (16,120,328,72) (16,200,328,72) (16,280,328,72): 좌측 이름+효과, 중앙 레벨 점 5개(채움=good), 우측 [가격 c] 버튼 84×44
- 코인 부족: 버튼 회색 + 탭 시 좌우 4px 흔들림 0.2s
- 최대 레벨: 버튼 자리에 `MAX`
- y=380 안내 10px: `스킨은 도감에서 구매할 수 있어요`

---

## 7. 입력 (input.js)

- `pointerdown` 좌표 < 180 → `jumpLeft`, ≥ 180 → `jumpRight`. UI 사각형 위 탭은 UI가 우선 소비.
- 키보드: `ArrowLeft/a` = jumpLeft, `ArrowRight/d` = jumpRight, 아무 키 = GAMEOVER에서 재시작.
- 멀티터치: 첫 포인터만 처리, 나머지 무시.
- 첫 사용자 제스처에서 `audio.unlock()` 호출 (iOS AudioContext resume).
- `pointerdown`만 사용 (`click` 지연 회피). 모든 기본 동작 preventDefault.

---

## 8. 플레이 규칙

### 8.1 지렁이 (player.js)
- 히트박스 12×14. 착지 판정은 `vy > 0` 하강 중 + 발판 상단 교차 시에만. 상승 중 통과.
- 착지 상태에서만 점프. `wiggle` 특성으로 공중 점프 잔여 횟수 관리(착지 시 리셋).
- 좌우 벽: x 클램프 + `vx *= -WALL_BOUNCE`, 통계 `wall`++.
- 콤보: 직전 착지 발판보다 **높은** 발판 착지 시 +1, 같거나 낮으면 1로 리셋. `comboMax` 통계 갱신.
- 무적(`iframe`) 중 적 접촉 무시. 무적 표시는 스프라이트 0.1s 간격 점멸.

### 8.2 수분
- `drain = clamp(BASE + altM/1000*DRAIN_PER_1000M, 0, MAX_DRAIN) * (균열 내? 3 : 1) * cuticle배수`
- 물방울 획득: `moist = min(moistMax, moist + 회복량)` — **가득이면 초과분은 버려진다** (언제 주울지의 판단 축)
- `moistMax = 100 + pouch + 상점(시작 수분은 시작치에만 가산이 아니라 START에 +5/Lv... → 확정: 상점 '시작 수분'은 START에 가산, MAX는 불변)`
- 수분 0: `molt` 잔여 부활 있으면 50 회복+무적 2s, 없으면 사망(사유='dry', 통계 `deaths`++)
- 수분 5% 이하에서 3초 이상 생존 후 회복 시 통계 `dry`++ (쭈글이 조건)

### 8.3 월드 (world.js)
- 발판 생성: 마지막 발판 기준 `dy=rand(GAP_MIN,GAP_MAX)` (0~50m는 상한 75), `dx=rand(-DX_MAX,DX_MAX)` 후 화면 안 클램프. 종류는 P_ 확률.
- **도달 가능성 보장:** 새 발판이 이전 발판에서 `|dx| > 140 && dy > 95` 이면 dx를 ±140으로 클램프.
- 물방울: 발판 위 중앙 +12px 확률 0.35 / 발판 사이 중간점 확률 0.15. 균열 구간은 큰 물방울 0.6.
- 균열 구간: 400m부터 400m마다, 길이 120m. 구간 내 발판 밀도 -20%(GAP +15%). **안전 차선:** 구간 발판을 화면 좌 또는 우 55% 폭 안에만 생성해 반대쪽에 우회 경로(일반 규칙 발판)를 1열 유지.
- 카메라: `cameraY = min(cameraY, playerY - 256)` (상승만). 고도 m = 카메라 누적 상승 / 10.
- 화면 하단(카메라 기준 +640) 아래로 히트박스 완전 이탈 → 사망(사유='fall').

### 8.4 적 (entities.js)
- 발판 생성 시 `DENSITY(alt)` 확률로 1기 배치 (200m 미만 없음, 균열 구간에는 배치 안 함 — 압박 중복 방지).
- ant: 발판 상부를 좌우 왕복 80px/s. pebble: 발판 위 24px 지점 고정.
- 접촉: 수분 -dmg, `vy=+KNOCK_VY` 아래로 튕김, 무적 0.6s, 화면 흔들림 4px.
- 점액탄(`shot`): 점프 순간 좌우로 각 1발, 속도 300px/s 수평 + 근접 적에게 완만 유도(회전 상한 4°/frame), 수명 1.2s. 명중: 적 제거, 히트스톱 3프레임, 통계 `kills`++.
- 두더지: 800m부터. 12~20s 간격. 경고 1.2s(플레이어 당시 y에 화살표 + molewarn음) → 해당 y의 24px 레인을 0.45s에 횡단. 접촉 시 -30 + 강한 튕김. 무피격 통과 시 `moleDodge`++. 죽일 수 없음.

### 8.5 레벨업 (entities.js / traits.js)
- EXP: 물방울 1 / 균열 물방울 3. `need(n)=5+3n`.
- 레벨업 순간: `playerY-400` 에 카드 3장(x=60/180/300). 카드는 월드 고정(카메라와 함께 내려옴).
- 카드 풀: 만렙 아닌 특성 중 무작위 3종(중복 없음). 후보 부족 시 `이슬`(즉시 수분+25)로 채움.
- 지렁이 히트박스가 카드와 교차 → 해당 특성 획득(또는 Lv2), 나머지 즉시 소멸, card음.
- 3장 모두 화면 하단으로 사라지면 소실 — 페널티 아님. 다음 레벨업은 정상 진행.
- 게임은 **어떤 경우에도 정지하지 않는다.**

---

## 9. 스킨 해금 판정 (save.js가 게임오버/클리어 정산 시 일괄 검사)

조건 → 통계 매핑: 고도 계열=`high`, ant100=`kills≥100`, fis3=`fis≥3`, wall50=`wall≥50`,
combo10=`comboMax≥10`, mole10=`moleDodge≥10`, c계열=`drops 누적`, die50=`deaths≥50`,
dry3=`dry≥3`, h5000=`cleared`, perfect=`perfect`.
새 해금 발생 시 게임오버 화면 상단에 토스트 `새 스킨: 이끼!` 2초 (good색).

---

## 10. 저장 (save.js)

```json
{ "v":1, "high":0, "coins":0,
  "up":{"moist":0,"coin":0,"trait":0},
  "skins":["basic"], "skin":"basic",
  "st":{"deaths":0,"drops":0,"kills":0,"wall":0,"fis":0,"comboMax":0,"dry":0,"moleDodge":0},
  "cleared":false,"perfect":false,"bestTime":0,"mute":true }
```

- 키: `localStorage["wriggle.v1"]`. 로드 시 기본값과 깊은 병합(누락 필드 보충). `v` 불일치 시 마이그레이션 자리만 남김.
- 쓰기: 게임오버/클리어/구매/장착/음소거 변경 시. 플레이 중 상시 쓰기 금지.
- 실패(quota/프라이빗 모드): 메모리 폴백 + 타이틀 하단에 1회 `저장이 지원되지 않는 브라우저예요` 10px 표시.

---

## 11. URL 고스트 (share.js)

- 생성: `location.origin + location.pathname + "?g=" + 고도m + "&n=" + encodeURIComponent(이름)` — 이름은 저장된 스킨명 아님, 기본 `꿈틀이`. (닉네임 입력 UI는 만들지 않는다. 이름은 현재 장착 스킨 이름을 사용 — 개인정보 입력 0)
- 클리어 공유: `?g=5000&c=1&t=초`
- 공유 버튼: `navigator.share` 가능하면 `{title:'꿈틀', text:'나 N,NNNm 올라감. 이겨봐', url}`, 아니면 클립보드 복사 + 토스트 `링크 복사됨!` 1.5s
- 파싱(부트 시): `g`=정수 1..5000 아니면 무시. `n`=디코드 후 `<>&"'` 제거, 8자 초과 절단, 빈값이면 `친구`. `c/t` 표시용.
- 표시: 해당 고도에 흰 점선(4px 대시) 가로선 + 우측 라벨 `이름 1,240m`. HUD y=46 상단 라벨 상시.
- 추월 순간: 화면 플래시 0.15s + `추월!` 24px 중앙 0.8s + 해당 판 정산 코인 ×2 플래그.

---

## 12. 게임필 (juice.js) — 항목·수치는 config.JUICE

| 항목 | 트리거 | Phase |
|---|---|---|
| 스쿼시&스트레치 0.7→1.15→1.0 (0.12s) | 착지 | **0** |
| 화면 흔들림 4px/6f, 2px/10f | 적 접촉 / 균열 진입 | **0** |
| 수분 비네트+맥박(0.6s) / 채도 감소 | §4 MOIST.WARN_* | **0** |
| 발판 2px 눌림 (0.1s) | 착지 | 1 |
| 흙 파티클 3개 (0.3s 소멸, 풀 재사용) | 점프 | 1 |
| 물방울 획득 플래시 0.15s + 게이지 팽창 | 획득 | 1 |
| 흡인 시 베지어 곡선 이동 | 촉수 감각 | 1 |
| 100m 마일스톤 숫자 플래시 | 고도 | 1 |
| 콤보 텍스트 ×N | 콤보≥3 | 1 |
| 히트스톱 3프레임 | 점액탄 명중 | 2 |

- 파티클 풀 고정 60개. 초과 요청 시 가장 오래된 것 재활용. 프레임 드랍 감지(3프레임 연속 dt>1/45) 시 파티클 생성 중단.

---

## 13. 사운드 (audio.js — 파일 없음, WebAudio 신스)

- `AudioContext` 1개. `unlock()`: 첫 제스처에서 resume.
- `play(name)`: config.SFX 파라미터로 Oscillator+Gain 생성. `f0→f1` 은 `exponentialRampToValueAtTime`, `seq` 는 [주파수,길이] 순차(주파수 0 = 쉼). gain은 attack 0.005s / release는 dur 내 linear→0.
- jump 는 매회 주파수 ±5% 무작위, 콤보 N이면 반음(×2^(n/12)) 씩 상승(상한 +12반음).
- 수분 15% 미만: heart 를 0.6s 간격 자동 재생, 회복 시 중단.
- 음소거: master gain 0. 저장값 `mute` 기본 **true**.

---

## 14. 플레이스홀더 렌더 (render.js — 도트 없이 완성)

이미지 파일을 로드하지 않는다. 전 개체를 아래 규칙으로 그린다. (도트 교체는 출시 후 선택)

- **지렁이:** 반지름 5 원 3개를 가로로 6px 간격 배치, 각 마디 y에 `sin(t*10 + i*1.2)*1.5` 웨이브. 머리(진행 방향 쪽)에 흰 2px 눈 2개 + 검정 1px 동공, accent색 볼 1px. 색은 장착 스킨 [body, bodyDark(아랫면), accent]. 수분에 따라 body를 `#d9c9a8` 쪽으로 선형 보간 + 15% 미만 0.1s 점멸 + scaleY 0.85.
- **발판:** soil 채움 + 상단 2px soilTop. root는 상단 2px root색 + 좌우 끝 1px 짙게. crumble은 soilDark 균열선 2개, 밟히면 0.3s간 1px씩 아래로 3회 떨림 후 소멸.
- **물방울:** water 원 r=4(큰 것 6) + 좌상단 waterHi 1px. 2f 주기로 r ±0.5 반짝임.
- **개미:** ant색 원 r=3 두 개 연결 + 다리 선 3개(1px). **돌:** pebble 원 r=7 + 하이라이트. **두더지:** mole 24×20 둥근 사각 + 분홍 코 3px + 흰 이빨 2px.
- **특성 카드:** uiPanel 64×48 + uiBorder 1px + 중앙 2글자 아이콘 14px + 하단 이름 8px. 획득 시 0.15s 확대 소멸.
- **배경:** bgTop→bgBottom 세로 그라데이션 + 깊이별 흙 얼룩(soilDark 2px 점, 고도 시드 기반 고정). 균열 구간: 배경을 sky 쪽으로 보간 + skyLight 빛줄기 평행사변형 2개(투명도 0.25).
- **버튼:** uiPanel 채움 + uiBorder 1px + 눌림 시 1프레임 y+2px & 밝기 +10%.
- 모든 텍스트: `bold {size}px monospace`, 색 uiText 기본.

---

## 15. 모듈 계약 (이 시그니처대로)

```
main.js      boot()/loop, pushScene(s), popScene(), game 객체 소유
config.js    (상수만, 로직 없음)
input.js     init(canvas, ui) / on('jumpLeft'|'jumpRight'|'tap', fn) / uiHit(x,y)->id
player.js    create(saveUp) / update(p,dt,world,traits) / jump(p,dir) / damage(p,amt)
world.js     create(ghost) / update(w,p,dt) / altitudeM(w) / inFissure(w) / spawn 내부처리
entities.js  updateDrops/updateEnemies/updateCards/updateShots(각 dt) / spawnCards(y,pool)
traits.js    pool(owned) / apply(id, player) / has(id), lv(id)
juice.js     shake(px,frames) / hitstop(frames) / particle(x,y,kind) / flash(color,sec) / vignette(level)
audio.js     unlock() / play(name,{semitone}) / heartbeat(on) / setMute(b)
render.js    worm/platform/drop/enemy/card/bg/button/text/gauge (ctx, camera 인자)
save.js      load() / commit() / addStats(patch) / settle(runResult)->{coins,newSkins} / wipe()
share.js     parseGhost(loc)->{g,n,c,t}|null / buildUrl(run) / share(run)
scenes/*     {enter, update, render, input, exit}
```

---

## 16. 작업 순서와 완료 체크리스트

### Phase 0 — 코어 루프
순서: `index.html → config.js → main.js(루프/씬스택) → input.js → render.js(배경·발판·지렁이·게이지·텍스트) → player.js → world.js(soil만) → save.js(최소: high/mute) → scenes/play.js → scenes/gameover.js(최소형: 고도·등급·다시하기) → juice.js(스쿼시·흔들림·비네트)`

체크리스트 (전부 통과해야 Phase 1):
- [ ] `python3 -m http.server` 로 열면 에러 0으로 실행
- [ ] 좌/우 탭·키보드로 방향 점프, 벽 바운스 동작
- [ ] 카메라 상승만 하고, 하단 이탈·수분 0 각각 사망
- [ ] 수분이 고도에 따라 빨리 줄고, 비네트·점멸 연출 발동
- [ ] 게임오버 → 다시하기 1탭, 0.5초 이내 재시작
- [ ] 최고기록 저장·표시, 새로고침 후 유지
- [ ] 모바일 실기기에서 스크롤·확대 안 되고 60fps
- [ ] **탭만 반복하는 30초가 재미있는가** — 아니면 PHYS/WORLD/MOIST 튜닝, 진행 중단

### Phase 1 — 성장 루프
순서: `물방울 생성·획득 → 레벨/EXP → 카드 생성·통과 선택 → traits(wiggle/feel/cuticle/molt) → juice 나머지 → scenes/title.js(전체 §6.1) → gameover 완성형(§6.3)`
- [ ] 카드 3장 통과 선택이 정지 없이 동작, 놓치면 소실
- [ ] 가득 찬 수분에서 물방울 초과분이 버려짐
- [ ] 특성 4종 효과가 수치대로 적용 (콘솔 확인 로그 1줄씩)
- [ ] 판마다 다르게 느껴지는가

### Phase 2 — 리스크 축
순서: `root/crumble 발판 → ant/pebble → shot(점액탄) → mole(경고 포함) → 균열 구간(경고·안전차선·큰물방울) → traits 나머지 4종 → audio.js 전체 → 콤보`
- [ ] 두더지 경고 1.2s가 항상 선행
- [ ] 균열 구간에 우회 루트가 항상 존재
- [ ] 모든 피해가 수분으로만 귀결
- [ ] 균열 앞에서 실제로 망설이는가

### Phase 3 — 엔딩·메타·확산
순서: `ending.js(§6.4) → 코인 정산(ECON) → shop.js → collection.js(해금 판정 §9) → share.js(고스트 전체 §11) → 데이터 초기화 → 배포(§17)`
- [ ] 5,000m 도달 시 엔딩 재생, 완벽 클리어 분기 동작
- [ ] 고스트 URL 파싱·표시·추월 보상 동작, 악성 파라미터 무해
- [ ] 스킨 21종 전부 해금 경로 존재(치트 키 `K` 로 전체 해금 — 배포 전 제거)
- [ ] 죽은 직후 "한 판 더"를 누르는가

---

## 17. 배포 (ledeuxions.com — 기존 nginx 인프라)

```bash
# 1) 서버로 복사
rsync -av --delete wriggle/ 서버:/var/www/ledeuxions/wriggle/
#    (CLAUDE.md, SPEC.md 는 제외해도 무방: --exclude 'CLAUDE.md' --exclude 'SPEC.md')

# 2) nginx (이미 /iphoneheic/ 정적 서빙 중이면 폴더 복사만으로 동작할 수 있음.
#    location 이 필요하면 /etc/nginx/sites-enabled/ledeuxions 에 추가)
location /wriggle/ {
    alias /var/www/ledeuxions/wriggle/;
    index index.html;
}

# 3) 검증·반영
sudo nginx -t && sudo systemctl reload nginx
# 4) 확인: https://ledeuxions.com/wriggle/  (모바일 실기기 필수 확인)
```

- 캐시: 초기에는 손대지 않는다. 업데이트가 잦아지면 index.html에 `?v=날짜` 쿼리로 src 캐시 무효화.

---

## 18. 제약 (미성년자 대상 — 설계 확정)

| 항목 | 결정 |
|---|---|
| 서버 랭킹·닉네임 입력·애널리틱스 | **없음.** 고스트 이름 = 장착 스킨명, 입력 UI 자체가 없다 |
| 확률형 뽑기 | 없음. 조건 해금 + 고정가 구매만 |
| 광고 | 게임 캔버스 안에는 절대 없음. 붙인다면 페이지 하단 배너 1개까지 (Phase 3 이후 별도 결정) |
| 로그인 | 없음 |
| 문구 | 게임 안의 일만. 성적·외모·집안 소재 금지 |

**확인 필요(추정):** 광고로 영리성이 생기면 게임물 등급분류 대상 여부 발생 가능 → 게임물관리위원회에 직접 확인. 확인 전까지 광고 미부착.

---

## 19. 미확정 추정값 (실측 후 config.js에서만 조정)

1. `MOIST.BASE_DRAIN=3.0` — Phase 0에서 첫 3판이 20~30초 사망이 되도록 조정
2. `WORLD.GAP_MIN/MAX` — 지루하면 상한 ↑, 억울하면 ↓
3. `FISSURE.EVERY_M=400` — 1판 평균 지속 시간 측정 후
4. `WORLD.DROP_ON_PLATFORM=0.35` — "가득일 때 주울까 말까" 판단이 실제 발생하는 밀도로

---
*v4 / 완전 스펙 / Claude Code 자율 구현용*

---

# §20. 잔여 모호성 확정 (추측 금지 부록)

> Claude Code가 추측하게 될 지점을 전수 점검해 확정한다. §1~§19와 충돌 시 **§20이 우선**한다.

## 20.1 좌표계 (가장 중요 — 이것이 없으면 전부 추측이 된다)

- 월드 좌표는 캔버스 관례를 따른다: **y는 아래로 증가.** 위로 올라갈수록 y가 작아진다.
- `GROUND_Y = 576` (월드 y). 게임 시작 시 **화면 전체 폭(0~360)의 시작 발판**이 y=576에 깔린다. 종류 soil, 파괴 불가. 첫 탭이 반드시 성공하도록.
- 지렁이 시작 위치: `(180, GROUND_Y - 8)` — 시작 발판 위.
- `cameraY` = 화면 최상단의 월드 y. 초기값 0. 상승 규칙: `cameraY = min(cameraY, wormY - 256)` (감소만 한다).
- 화면 변환: `screenY = worldY - cameraY`, `screenX = worldX`.
- 고도: `altM = max(0, -cameraY) / WORLD.PX_PER_M` (카메라가 음수로 갈수록 고도 증가).
- 지표(클리어) 월드 y: `SURFACE_Y = GROUND_Y - WORLD.SURFACE_M * WORLD.PX_PER_M` = **-49,424**. `wormY <= SURFACE_Y` 순간 엔딩 시퀀스.
- 고스트 라인 월드 y: `GROUND_Y - g * WORLD.PX_PER_M`.
- 사망 라인: 지렁이 히트박스 상단이 `cameraY + 640` 보다 아래로 완전히 내려가면 추락사.

## 20.2 캔버스 스케일 (index.html/main.js)

```js
function fit(canvas){
  const s = Math.max(1, Math.min(Math.floor(innerWidth/360), Math.floor(innerHeight/640)));
  canvas.style.width  = 360*s + 'px';
  canvas.style.height = 640*s + 'px';   // canvas.width/height(논리 360×640)는 절대 바꾸지 않는다
}
addEventListener('resize', () => fit(canvas));
```

## 20.3 루프 안전장치

- accumulator 상한: `acc = Math.min(acc + frameDt, 0.25)` — 탭 전환 복귀 시 물리 폭주 방지.
- 클리어 타임 = PLAY 씬에서 소비한 고정 스텝 수 / 60. **일시정지 시간은 제외된다.** 표기 `mm:ss` (내림).

## 20.4 생성·배치 세부 확정

- **적과 물방울은 같은 발판에 공존하지 않는다.** 적이 배치된 발판은 물방울 생성을 건너뛴다.
- 시작 발판(GROUND)에는 적·물방울 없음.
- 특성 카드는 발판·적과 **충돌하지 않는다** (렌더 최상단, 획득 판정만 존재). 지렁이는 카드를 통과하며 줍는다.
- 점액탄 유도 목표: 반경 160px 내 가장 가까운 생존 적. 없으면 직진. 회전 상한 4°/프레임.
- 배경 흙 얼룩의 "시드 기반 고정" 해시: `hash(n){ const s = Math.sin(n*12.9898)*43758.5453; return s - Math.floor(s); }` — 셀 키는 `floor(worldY/16)*1000 + floor(x/16)`.
- 그 외 무작위는 전부 `Math.random()`. 시드 재현성은 요구하지 않는다.

## 20.5 UI·연출 세부 확정

- 손가락 튜토리얼: **`save.st.deaths === 0` 인 동안**, 매 판 시작 2초간 표시. 첫 사망 이후 영구 소멸.
- PLAY 중 UI는 음소거 버튼 하나뿐. 그 사각형 위 탭은 점프로 처리하지 않는다.
- 신기록 판정: 정산 시 `altM > save.high` 이면 갱신 + NEW RECORD 표시.
- 고스트 추월 판정은 판마다 새로 한다(같은 링크로 여러 번 도전 가능).
- 상점 '시작 수분'은 시작치에만 가산한다. 최대치(100 + 물주머니)는 불변.

## 20.6 디버그 모드 (Phase 0부터 구현 — §19 튜닝의 눈)

- `config.js` 에 `export const DEBUG = { CHEAT:false };` 추가.
- URL `?debug=1` 일 때 좌상단 8px monospace 오버레이:
  `fps / altM / moist / drain(현재 %/s) / 발판 수 / 엔티티 수 / combo`
- **사망·클리어 시 콘솔 1줄 요약(항상 출력):**
  `[RUN] 34.2s alt=412m cause=dry drops=18 lv=3 traits=wiggle1,feel1 combo=6`
  → §19의 추정값 튜닝은 이 로그 데이터로 한다. 감으로 하지 않는다.
- 전체 스킨 해금 치트 `K` 키는 `DEBUG.CHEAT===true` 일 때만. 배포 시 false 확인이 Phase 3 체크리스트에 포함된 것으로 간주한다.

## 20.7 index.html `<head>` 추가분 (카카오톡·SNS 미리보기)

```html
<meta property="og:title" content="꿈틀 — 지표까지 5,000m">
<meta property="og:description" content="마르기 전에 올라가! 링크 열면 설치 없이 바로 시작">
<meta property="og:image" content="https://ledeuxions.com/wriggle/og.png">
<meta property="og:url" content="https://ledeuxions.com/wriggle/">
<meta name="twitter:card" content="summary_large_image">
```

- `og.png` (1200×630)는 Phase 3에서 게임 화면 캡처 기반으로 제작. **없어도 게임은 동작한다** — 카톡 미리보기만 빈약해질 뿐.
- 서버가 없으므로 미리보기는 **정적**이다. 점수별 동적 미리보기는 불가하며, 점수는 URL 파라미터와 공유 텍스트로 전달된다. 이것은 한계가 아니라 §18(무서버) 결정의 결과다.

## 20.8 브라우저 기준

- 지원: 최신 Chrome / Safari / Samsung Internet / Edge. 구형 브라우저 폴리필 작성 금지.
- `pointerdown` 미지원 환경 대응 코드 작성 금지 (2020년 이후 전 브라우저 지원).

---

# §21. 아트 에셋 통합 (assets/ 동봉 — §14 플레이스홀더의 상위 호환)

에셋은 이미 제작되어 동봉된다. **로드 성공 시 스프라이트, 실패 시 §14 플레이스홀더**로 자동 폴백한다.
게임이 에셋 때문에 막히는 상황은 존재하지 않는다.

## 21.1 동봉 파일

| 파일 | 내용 |
|---|---|
| `assets/sprites.png` | 192×48 스프라이트 시트 (아래 좌표표) |
| `assets/bg_tile.png` | 64×64 타일러블 흙 질감 |
| `assets/logo.png` | 54×30 "꿈틀" 픽셀 로고 (투명 배경) |
| `assets/og.png` | 1200×630 SNS/카톡 미리보기 카드 (§20.7) |
| `tools/gen_sprites.py` | 전 에셋을 재생성하는 파이썬 스크립트 (python3 + Pillow). **게임 실행과 무관한 오프라인 도구.** 도트 수정은 이 코드로 한다 |

## 21.2 sprites.png 좌표표 [x, y, w, h]

| 키 | 좌표 | 키 | 좌표 |
|---|---|---|---|
| worm_idle | [0,0,16,16] | drop_1 | [64,0,16,16] |
| worm_rise | [16,0,16,16] | drop_2 | [80,0,16,16] |
| worm_fall | [32,0,16,16] | bigdrop_1 | [96,0,16,16] |
| worm_dead | [48,0,16,16] | bigdrop_2 | [112,0,16,16] |
| ant_1 | [128,0,16,16] | ant_2 | [144,0,16,16] |
| pebble | [160,0,16,16] | | |
| plat_soil | [0,16,48,8] | plat_root | [48,16,48,8] |
| plat_crumble | [96,16,48,8] | | |
| mole_1 | [0,24,32,24] | mole_2 | [32,24,32,24] |

## 21.3 프레임 선택 규칙

- 지렁이: 게임오버 화면 = `worm_dead` / 착지 상태 = `worm_idle` / `vy < 0` = `worm_rise` / 그 외 = `worm_fall`
- 좌향 이동 시 수평 반전(`ctx.scale(-1,1)` 후 드로우). 두더지도 진행 방향으로 반전.
- 물방울 2프레임 @300ms 루프 / 개미 2프레임 @160ms / 두더지 2프레임 @120ms
- 스프라이트는 논리 픽셀 1:1로 드로우 (월드 좌표가 이미 논리 px).

## 21.4 스킨 색 교체 (로드 시 1회, 런타임 비용 0)

지렁이 4프레임(시트의 x<64, y<16 영역)만 대상으로, 오프스크린 캔버스에서 **정확히 일치하는 RGB 3색**을 치환해 스킨별 캔버스를 캐시한다:

```
#ff9db0 (몸)      → SKINS[i].c[0]
#e56a86 (윤곽/음영) → SKINS[i].c[1]
#ffd1dc (하이라이트) → SKINS[i].c[2]
```

- 흰 눈/검은 동공은 치환하지 않는다. 시트의 지렁이 영역은 위 3색 + 흰/검만 사용하도록 제작되어 있다.
- **영역을 x<64로 제한할 것** — 두더지 코가 몸색(#ff9db0)을 공유하므로 전체 치환 시 두더지 코까지 바뀐다.
- 건조 표현: 스킨 캐시 캔버스를 그린 뒤 `source-atop` 으로 `rgba(217,201,168, (1 - moist/100) * 0.7)` 오버레이. §14의 색 보간과 동일 효과.

## 21.5 배경·로고 사용

- 배경: 그라데이션(bgTop→bgBottom) 채움 후 `bg_tile.png` 를 alpha 0.5로 타일링. 오프셋 `-(cameraY % 64)` 로 스크롤 동기화. 균열 구간의 하늘 보간·빛줄기는 §14 그대로 절차 렌더.
- 타이틀 로고: `logo.png` 를 4배(216×120)로 §6.1 LOGO 위치에. 로드 실패 시 §6.1의 텍스트 로고.
- 엔딩·게임오버의 지렁이도 동일 시트 사용 (dead 프레임 + 건조 오버레이).

## 21.6 로드 전략

- `render.init()` 에서 sprites/bg_tile/logo 3장을 `Image` 로드. 각각 독립 폴백 (하나 실패해도 나머지는 사용).
- 로드 완료 전 첫 프레임들은 플레이스홀더로 그린다 — 로딩 화면을 만들지 않는다.

---

# §22. 플레이테스트 1차 반영 (v4.1) — §4·§8·§16과 충돌 시 §22가 우선

> 근거(실측): ① 점프 단일 궤적 ② 발판 과소 폭 ③ 초반 과난이도 ④ 도달 불가 발판 발생 ⑤ 타이틀 부재 ⑥ 특성 시스템 미인지.
> 아래 수치는 1차 조정값(추정)이며, 재실측 대상이다.

## 22.1 점프 개편 (config.PHYS 교체)

```js
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
```

- **가변 높이:** `pointerdown` 에 점프 시작, `pointerup` 시점에 `vy < JUMP_CUT_VY` 이면 `vy = JUMP_CUT_VY`. 짧은 탭 ≈ 절반 높이, 꾹 누름 = 최대. (키보드도 keyup에 동일 적용)
- **가변 각도:** `t = |tapX - 180| / 180` (0=중앙, 1=가장자리), `vx = ±(JUMP_VX_MIN + (JUMP_VX_MAX - JUMP_VX_MIN) * t)`. 중앙 근처 = 수직에 가깝게, 가장자리 = 멀리.
- **버퍼/코요테:** 공중에서 탭 → 0.10s 안에 착지하면 착지 프레임에 자동 점프. 발판에서 떨어진 뒤 0.06s 내 탭은 지상 점프로 인정.
- 튜토리얼 손가락 힌트 문구 변경: 좌우 아이콘 아래에 `꾹 누르면 높이!` 8px 1줄 추가 (deaths===0 동안).

## 22.2 발판 개편 — 난이도 곡선표 (WORLD의 고정 GAP/W 폐기)

```js
export const DIFF = [   // altM 미만 구간에 적용. 폭·간격·수평산포 [min,max]
  { upTo:  150, w:[80,88], gap:[55, 75], dxMax:  90 },
  { upTo:  400, w:[64,76], gap:[60, 90], dxMax: 120 },
  { upTo: 1500, w:[56,68], gap:[60,105], dxMax: 140 },
  { upTo: Infinity, w:[48,64], gap:[60,110], dxMax: 150 },
];
```

- 발판 폭이 가변이 되므로 렌더는 시트 조각을 **3-slice**로: `plat_*` 의 좌 6px + 중앙 반복 + 우 6px. (§21 시트 그대로 사용)
- 히트박스 = 표시 폭 그대로 (관용 픽셀 없음 — 폭을 키웠으므로).

## 22.3 도달 보장 3중 규칙 (§8.3의 클램프 규칙 폐기·대체)

생성된 후보 (dx, dy)에 대해 순서대로 적용:

1. **물리 검증표:** 최대 점프(vy −900, vx 280) 기준 간격별 도달 가능 수평거리
   `REACH = { 60:150, 75:135, 90:115, 105:95, 110:85 }` (선형 보간).
   `|dx| > REACH(dy) - 발판폭/2` 이면 dx를 그 한계로 클램프.
2. **벽 탈출 규칙:** 직전 발판 중심이 벽에서 60px 이내이면, 다음 발판의 dx 부호는 **무조건 화면 중앙 방향.** (무작위 아님)
3. **안전 발판:** 5번째 발판마다 폭 88px 고정 + `|dx| ≤ 60` + `dy ≤ 80`. 사다리가 항상 존재한다.

균열 구간의 "안전 차선"(§8.3)에도 위 3규칙이 동일 적용된다.

## 22.4 시작 특성 선택 (신규 — 특성 시스템의 첫인상이자 튜토리얼)

- 런 시작 시 시작 발판 위 `GROUND_Y - 220` 에 특성 카드 3장 배치. 풀은 항상 `[꿈틀 도약, 촉수 감각, 두꺼운 각피]`, x 순서만 무작위.
- 시작 카드는 **획득 전까지 소멸하지 않는다:** 카메라 하단으로 사라지면 `playerY - 350` 에 재배치. 단 3회 회피(재배치) 후에는 그대로 소멸하고 게임 진행.
- **수분 감소는 시작 카드를 획득한 순간부터 시작한다.** (기존 `START_DELAY 3초` 폐기. 3회 회피로 카드가 소멸한 경우엔 그 시점부터.) 선택이 곧 출발 신호다.
- 첫 레벨업 이후의 카드는 기존 규칙(§8.5) 그대로 — 놓치면 소실.
- 상점 `trait` 항목 교체: ~~시작 시 무작위 특성 1개~~ → **`시작 선택 특성이 Lv2로 시작`** (500c, max 1). 모두가 특성 1개로 시작하게 되었으므로.

## 22.5 타이틀 화면 전진 배치 — "Phase 0.5"

§16 순서 변경: Phase 0 체크리스트 통과 직후, Phase 1 진입 **전에** 다음을 구현한다.

- `scenes/title.js` — §6.1 레이아웃 그대로. 단 이 단계에서는:
  - 로고: `assets/logo.png` 4배
  - [시작] / 최고기록 / 음소거 / 데이터 초기화: 완전 동작
  - [도감] [상점]: 버튼은 배치하되, 탭 시 토스트 `아직 잠겨 있어요` 1.2s (Phase 3에서 개방)
  - 스킨 미리보기·좌우 순환: 스킨이 basic뿐이므로 미리보기만, 화살표는 Phase 3에서
- 부트 흐름: BOOT → **TITLE** → PLAY. (기존 BOOT → PLAY 직행 폐기)
- 게임오버의 `메뉴로` 가 TITLE로 연결되는지 확인.

## 22.6 Phase 0 체크리스트 추가분 (재검증 항목)

- [ ] 짧은 탭과 긴 탭의 도달 높이가 눈에 띄게 다르다 (대략 절반 vs 최대)
- [ ] 가장자리 탭과 중앙 탭의 수평 거리가 다르다
- [ ] 착지 직전 선입력이 씹히지 않는다 (버퍼 체감)
- [ ] 500m 연속 플레이에서 도달 불가 상황 0회 (§20.6 디버그 오버레이 켜고 확인)
- [ ] 시작 카드 3장 중 하나를 집기 전에는 수분이 줄지 않는다
- [ ] 타이틀 → 시작 → 게임오버 → 메뉴 → 시작 순환에 막힘 없음

---

# §23. 시작 굴과 밀도 곡선 (v4.2) — §22.2와 충돌 시 §23이 우선

> 근거(실측 2차): 초반 등반이 여전히 어렵다. 요구: 시작은 어느 방향으로 뛰어도 올라가지는 깔때기(굴 입구) 형태, 난이도는 위로 갈수록 점진 상승.

## 23.1 원리 — 난이도의 1축은 "층당 발판 수"

발판을 사슬(직전 발판 기준 1개)로만 생성하지 않는다. **층(layer) 단위**로 생성한다.
한 층 = 수직 간격 하나. 층당 발판 수(lanes)가 3이면 화면 폭이 덮여 실패가 거의 불가능하고, 1이면 기존 사슬 방식이다. 3→2→1로 줄어드는 것이 굴이 좁아지는 것이다.

## 23.2 시작 굴 (0~60m) — 무작위 없음, 고정 배치

```js
export const START_FUNNEL = {   // GROUND_Y 기준 상대 y. 층당 [xCenter, w] 목록
  layers: [
    { dy:  -54, plats: [[62,96],[180,80],[298,96]] },
    { dy: -108, plats: [[70,88],[180,76],[290,88]] },
    { dy: -162, plats: [[78,84],[180,72],[282,84]] },
    { dy: -216, plats: [[88,80],[272,80]] },          // 시작 카드(§22.4, y -230)와 같은 높이대 — 카드는 무충돌이므로 공존
    { dy: -270, plats: [[110,76],[180,72],[250,76]] },
  ],
};
```

- 종류는 전부 `soil`. 적·물방울 배치 없음 (물방울은 60m부터).
- **매판 동일하다.** 신규 유저의 학습 구간이 항상 같은 지형이 되도록 의도된 결정이다.
- 시각 연출(선택, Phase 1): 시작 화면 좌우 하단에 흙벽 쐐기(장식 사각형, 충돌 없음) 2개로 굴 입구 실루엣. 없어도 무방.

## 23.3 밀도 곡선 — DIFF 테이블 v2 (§22.2 테이블 교체)

```js
export const DIFF = [  // altM 미만 구간. lanes:[min,max] = 층당 발판 수 범위
  { upTo:  60,  funnel: true },                                        // §23.2 고정 배치
  { upTo: 150,  lanes:[3,3], w:[72,88], gap:[55,70] },
  { upTo: 300,  lanes:[2,3], w:[64,80], gap:[58,80] },
  { upTo: 600,  lanes:[1,2], w:[60,72], gap:[60,90] },
  { upTo: 1500, lanes:[1,1], w:[56,68], gap:[60,105], dxMax:140 },     // 여기부터 사슬 방식
  { upTo: Infinity, lanes:[1,1], w:[48,64], gap:[60,110], dxMax:150 },
];
```

### 층 생성 규칙 (lanes ≥ 2)
- 슬롯 3개: 좌 `x=60±22`, 중 `x=180±26`, 우 `x=300±22` (지터는 무작위).
- 층당 lanes 수를 [min,max]에서 뽑고, 그 수만큼 슬롯을 무작위 선택해 배치. **연속 두 층이 같은 단일 슬롯 조합이면 다음 층은 다른 조합 강제** (같은 자리 사다리 방지).
- lanes=2 층은 반드시 **비인접 슬롯 1쌍 이상 포함 가능** — 제한 없음, 무작위면 충분.
- 층 방식 구간에서는 §22.3의 도달표가 불필요하다 (슬롯 간격 120px < REACH). §22.3은 사슬 구간(lanes 1)에만 적용.

### 사슬 전환 (lanes [1,2] 구간)
- 층마다 lanes를 뽑아 1이면 사슬 규칙(§22.3 3중 보장), 2면 층 규칙. 전환이 자연히 섞인다.

## 23.4 배치 밀도 보정 (발판이 늘었으므로)

- 물방울: lanes 3 구간 발판당 0.20 / lanes 2 구간 0.28 / 사슬 구간 0.35 (기존값).
- 적: 기존 규칙 유지 (200m부터, §8.4 밀도식). 층 구간에서는 **층당 최대 1기** 상한 추가.
- 코인·EXP 등 경제 수치 변경 없음.

## 23.5 전체 난이도 로드맵 (참조표 — 무엇이 언제 압박이 되는가)

| 고도 | 새로 들어오는 압박 |
|---|---|
| 0~60m | 없음 (고정 굴, 수분도 카드 획득 전 정지) |
| 60m | 무작위 시작, 물방울 등장 |
| 150m | 층당 발판 3→2~3 |
| 200m | 개미 |
| 300m | 층당 2, 발판 폭 축소 시작 |
| 400m | 첫 균열 구간 |
| 500m | 돌 |
| 600m | 사슬 구간 진입(층당 1~2), 건조 가속 체감 |
| 800m | 두더지 |
| 1500m | 완전 사슬 + 최소 폭 대역 |
| 5000m | 지표 — 엔딩 |

## 23.6 재검증 항목 (Phase 0 체크리스트 추가)

- [ ] 시작 굴이 매판 동일한 배치로 나온다
- [ ] 처음 접한 테스터의 60m 도달률 100% (5판 관찰)
- [ ] 150m까지 아무 방향 점프로도 진행 가능
- [ ] 600m 전후에서 층→사슬 전환이 튀지 않고 섞여 들어간다
- [ ] 도달 불가 0회 재확인 (사슬 구간, 디버그 오버레이)
