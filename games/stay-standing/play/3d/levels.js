// 3D 나무집 10단계 — 2D 판(~/구조보강/levels.js)의 개념을 3D 로.
// 좌표: xs = 왼→오, zs = 뒤→앞(앞 = 카메라 쪽 +z). hs = 층 높이. 절점 'i,k,j'.
// doors / windows: [층, 'x'|'z', 선 번호, 시작 칸]  (x 줄 = 앞뒤 벽, 선 번호 = zs 번호 / z 줄 = 옆벽, 선 번호 = xs 번호)
// pre: 처음부터 있는 보강(돈 안 듦, 못 뺌). ref: node 탐색(test/search.mjs)으로 찾은 싼 모범 보강 — 화면엔 안 나옴.
// quake: 기본 지진 세기 배수. budget 은 원.
import { makeModel } from './sim.js';
export const LEVELS = [
  { // 1
    id: 'hut', name: { en: 'Little hut', ko: '작은 오두막' },
    lesson: { en: 'One brace holds one way only. Brace BOTH directions — front/back walls and side walls.', ko: '가새 하나는 한 방향만 버팁니다. 앞뒤 벽과 옆벽, 두 방향 모두 보강하세요.' },
    xs: [0, 3.6], zs: [0, 2.7], hs: [2.4],
    doors: [[0, 'x', 1, 0]],
    quake: 1.0,
  },
  { // 2
    id: 'stilts', name: { en: 'Shed on stilts', ko: '기둥 위 창고' },
    lesson: { en: 'The box is already strong — the bare stilts are not. Brace the legs, in both directions.', ko: '상자는 이미 튼튼해요 — 맨 기둥이 약하죠. 다리를 두 방향 모두 보강하세요.' },
    xs: [0, 3.0], zs: [0, 2.4], hs: [2.0, 2.3], floorKg: 90,
    pre: 'plyStory1',
    quake: 1.0, strength: 1.72,
  },
  { // 3
    id: 'window', name: { en: 'Big window', ko: '큰 창이 있는 집' },
    lesson: { en: 'Do not brace over the window. Use the solid bays on BOTH sides of it so the wall stays balanced.', ko: '창 위에는 가새를 대지 마세요. 창 양옆 막힌 칸에 고르게 넣어 균형을 맞추세요.' },
    xs: [0, 2, 4, 6], zs: [0, 3.0], hs: [2.4],
    windows: [[0, 'x', 1, 1]], doors: [[0, 'z', 3, 0]],
    quake: 1.0, strength: 1.56,
  },
  { // 4
    id: 'shop', name: { en: 'Shop with open front', ko: '1층이 뚫린 상가주택' },
    lesson: { en: 'Upstairs is strong, the open shop floor is not (soft story). Brace the ground floor — and with the front open, the side walls must stop the twist.', ko: '2층은 튼튼한데 뚫린 1층이 약해요(필로티·연약층). 1층을 보강하세요 — 앞이 뚫렸으니 옆벽이 비틀림을 잡아야 해요.' },
    xs: [0, 3, 6], zs: [0, 3.6], hs: [2.7, 2.5], floorKg: 75,
    noPost: ['1,1,0'], windows: [[0, 'x', 1, 0], [0, 'x', 1, 1]], doors: [[0, 'x', 0, 1]],
    pre: 'plyStory1',
    quake: 1.0, strength: 3.57,
  },
  { // 5
    id: 'long', name: { en: 'Long house', ko: '긴 집' },
    lesson: { en: 'The left end is braced, the right end is loose — the house twists around the strong end. Spread bracing to both ends.', ko: '왼쪽 끝만 보강돼 있어 오른쪽 끝이 비틀리며 돌아갑니다. 양 끝에 고르게 나눠 넣으세요.' },
    xs: [0, 3, 6, 9, 12], zs: [0, 4.0], hs: [2.4],
    doors: [[0, 'x', 1, 2]],
    pre: [{ t: 'brace', a: '0,0,0', b: '0,1,1' }, { t: 'brace', a: '0,1,0', b: '0,0,1' }, { t: 'brace', a: '0,1,0', b: '1,1,1' }, { t: 'brace', a: '1,1,0', b: '0,1,1' }, { t: 'brace', a: '0,0,0', b: '1,0,1' }, { t: 'brace', a: '1,0,0', b: '0,0,1' }],
    quake: 1.0, strength: 1.9,
  },
  { // 6
    id: 'slope', name: { en: 'House on a slope', ko: '비탈 위의 집' },
    lesson: { en: 'On a slope the back posts are short and the front ones tall. Brace the stilts on every side — short and tall.', ko: '비탈에선 뒤 기둥은 짧고 앞 기둥은 깁니다. 짧은 쪽, 긴 쪽 모두 다리를 보강하세요.' },
    xs: [0, 3.6], zs: [0, 3.0], hs: [2.4, 2.4], floorKg: 75,
    baseH: { '0,0': 1.2, '1,0': 1.2 }, terrain: [{ z0: -2.4, z1: -0.9, h: 1.2 }],
    pre: 'plyStory1',
    quake: 1.0, strength: 2.56,
  },
  { // 7
    id: 'tile', name: { en: 'Heavy tile roof', ko: '무거운 기와지붕' },
    lesson: { en: 'Quake force = mass × shaking. A heavy roof pulls hard — single braces snap; it needs X-braces or plywood walls.', ko: '지진 힘 = 무게 × 흔들림. 무거운 지붕은 세게 당겨요 — 가새 하나로는 부러지고, X가새나 합판벽이 필요해요.' },
    xs: [0, 3.6], zs: [0, 3.0], hs: [2.5], roofKg: 150, roofStyle: 'heavy',
    doors: [[0, 'x', 1, 0]],
    quake: 1.0, strength: 1.56,
  },
  { // 8
    id: 'lshape', name: { en: 'L-shaped house', ko: 'ㄱ자 집' },
    lesson: { en: 'An L-shape twists at the corner. Brace each wing in both directions — not just the walls that are easy to reach.', ko: 'ㄱ자 집은 꺾인 곳에서 비틀립니다. 날개마다 두 방향 모두 보강하세요.' },
    xs: [0, 3, 6], zs: [0, 3, 6], hs: [2.4], cells: ['0,0', '1,0', '0,1'],
    roof: [{ x0: -3, x1: 3, z0: -3, z1: 0 }, { x0: -3, x1: 0, z0: -3, z1: 3 }],
    doors: [[0, 'x', 2, 0]],
    quake: 1.0, strength: 1.15,
  },
  { // 9
    id: 'budget', name: { en: 'Family house on a budget', ko: '빠듯한 예산의 가족집' },
    lesson: { en: 'Money is tight and the balcony pulls the top forward. Spend on the ground floor first, both directions.', ko: '돈은 빠듯하고 발코니가 위층을 앞으로 당겨요. 1층부터, 두 방향 모두에 쓰세요.' },
    xs: [0, 3, 6], zs: [0, 3.6], hs: [2.6, 2.5], floorKg: 70,
    balcony: { j: 1, side: 'z+', depth: 1.2, kg: 900 },
    doors: [[0, 'x', 1, 0]],
    pre: [{ t: 'brace', a: '0,0,1', b: '1,0,2' }, { t: 'brace', a: '1,0,1', b: '0,0,2' }],
    tight: true,
    quake: 1.0, strength: 4.55,
  },
  { // 10
    id: 'three', name: { en: 'Three-storey timber house', ko: '3층 목조주택' },
    lesson: { en: 'The bottom storey carries the sway of every floor above. Make each storey at least as strong as the one on top — in both directions.', ko: '맨 아래층이 위 모든 층의 흔들림을 받칩니다. 아래층일수록, 두 방향 모두 더 튼튼하게.' },
    xs: [0, 3.6], zs: [0, 3.0], hs: [2.6, 2.5, 2.4], floorKg: 65,
    doors: [[0, 'x', 1, 0]],
    quake: 1.0, strength: 4.17,
  },
];
// =================== 2장: 철근콘크리트 (11~20) — 1970~90년대 오래된 건물 ===================
// 오래된 비연성 RC 골조 + 기존 벽돌(조적) 채움벽. 벽돌은 처음엔 단단해서 힘을 끌어가지만 취성 — 금 가고 빠지면 맨 골조만 남는다.
// 벽돌이 한쪽에만 있으면 강성 중심이 치우쳐 건물이 비틀린다(비틀림). 플레이어 일 = 균형: 약한·뚫린 쪽을 보강.
// brick: { 면: [층…] } 면 = front(z−) · back(z+) · left(x−) · right(x+). 그 면의 벽 칸(창·문 빼고)은 처음부터 벽돌.
// brickStories: 그 층 모든 면이 벽돌. ribbon: 띠창 허리벽 때문에 짧아진 기둥.
const RC = { mat: 'rc', quake: 0.65 };
LEVELS.push(
  { // 11
    ...RC, id: 'rc_office', strength: 0.9, name: { en: '1978 neighbourhood clinic', ko: '1978년 동네 의원' },
    lesson: { en: 'Brick walls only at the back and left: that side is stiff, the open glass side swings round it (twist). Balance it — brace the OPEN side, not next to the brick.', ko: '벽돌벽이 뒤쪽과 왼쪽에만 있어 그쪽이 뻣뻣하고, 뚫린 유리 쪽이 그 둘레로 돌아갑니다(비틀림). 벽돌 옆 말고 뚫린 쪽을 보강해 균형을 맞추세요.' },
    xs: [0, 6, 12], zs: [0, 6], hs: [3.3, 3.3],
    windows: [[0, 'x', 0, 0], [0, 'x', 0, 1]], brick: { back: [0, 1], left: [0, 1] },
  },
  { // 12
    ...RC, quake: 0.5, id: 'rc_piloti', strength: 2.1, brickMul: 3, name: { en: '1995 piloti villa', ko: '1995년 필로티 다세대' },
    lesson: { en: 'Brick flats upstairs, open parking below, and one brick stair wall on the left. However strong the upper floors are, the open ground floor fails and twists round the stair wall — brace the ground floor, on the open side too.', ko: '위층은 벽돌 세대, 1층은 뻥 뚫린 주차장, 왼쪽엔 계단실 벽돌벽 하나. 위층이 아무리 튼튼해도 뚫린 1층이 계단실을 축으로 비틀며 무너집니다 — 1층을, 뚫린 쪽까지 보강하세요.' },
    xs: [0, 6, 12], zs: [0, 6], hs: [3.0, 2.8, 2.8, 2.8], brickStories: [1, 2, 3], brick: { left: [0] },
  },
  { // 13
    ...RC, quake: 0.75, brickMul: 0.3, id: 'rc_ribbon', strength: 2.3, name: { en: '1982 school with ribbon windows', ko: '1982년 띠창 학교' },
    lesson: { en: 'Brick half-walls under the front window band make the front columns short. Short columns are stiff, grab the force and split in shear — wrap or jacket THOSE columns.', ko: '앞쪽 띠창 아래 벽돌 허리벽이 앞 기둥을 짧게 만듭니다. 짧은 기둥은 뻣뻣해서 힘을 몰아 받아 빗금으로 쪼개져요 — 바로 그 기둥을 감거나 키우세요.' },
    xs: [0, 6, 12, 18], zs: [0, 7], hs: [3.4],
    windows: [[0, 'x', 0, 0], [0, 'x', 0, 1], [0, 'x', 0, 2]],
    brick: { back: [0], left: [0], right: [0] }, ribbon: { s: 0, hEff: 1.2, sill: 1.1, cols: ['1,0', '2,0'] },
  },
  { // 14
    ...RC, id: 'rc_corner', strength: 2.2, brickMul: 1, searchCol: 'wing', name: { en: '1986 corner shop', ko: '1986년 모퉁이 상가' },
    lesson: { en: 'Glass on two sides of the corner, brick on the other two: the brick side is stiff, the glass corner swings round (twist). Wing walls beside the glass-side columns stiffen it and keep the windows.', ko: '모퉁이 두 면은 유리, 나머지 두 면은 벽돌: 벽돌 쪽은 뻣뻣하고 유리 모퉁이가 돌아갑니다(비틀림). 유리 쪽 기둥에 날개벽을 붙이면 창은 그대로 두고 균형이 맞아요.' },
    xs: [0, 5, 10], zs: [0, 5], hs: [3.6, 3.0],
    windows: [[0, 'x', 1, 0], [0, 'x', 1, 1], [0, 'z', 2, 0]], brickStories: [0, 1],
  },
  { // 15
    ...RC, id: 'rc_corridor', strength: 1.5, name: { en: '1979 school with a long corridor', ko: '1979년 긴 복도 학교' },
    lesson: { en: 'The brick stair hall at the left end is stiff; the long right end swings round it. Bracing that same end again does nothing — spread bracing to the far end (and the middle).', ko: '왼쪽 끝 벽돌 계단실은 뻣뻣하고 긴 오른쪽이 그 둘레로 돌아갑니다. 같은 끝을 또 보강하면 소용없어요 — 먼 끝(과 가운데)에 나눠 넣으세요.' },
    xs: [0, 4, 8, 12, 16, 20], zs: [0, 8], hs: [3.4, 3.4], brick: { left: [0, 1] }, brickBays: { front: [0], back: [0] },
  },
  { // 16
    ...RC, id: 'rc_tank', strength: 2.2, name: { en: '1984 building with a rooftop tank', ko: '1984년 옥상 물탱크 건물' },
    lesson: { en: 'A heavy tank on the roof swings the building like a pendulum, and the brick back wall makes it twist. Mass up high needs bracing all the way down, balanced on both sides.', ko: '옥상의 무거운 물탱크가 건물을 시계추처럼 흔들고, 뒤쪽 벽돌벽 때문에 비틀리기까지 합니다. 높은 곳의 무게는 아래층까지, 양쪽 균형 맞춰 보강하세요.' },
    xs: [0, 6, 12], zs: [0, 6], hs: [3.2, 3.2, 3.2], tank: { kg: 45000, h: 2.0 }, brick: { back: [0, 1, 2] },
  },
  { // 17
    ...RC, id: 'rc_setback', strength: 2.5, name: { en: '1988 setback building', ko: '1988년 위가 좁아지는 건물' },
    lesson: { en: 'Where the building steps in, stiffness jumps. The wide floors below carry everything — brace them first.', ko: '건물이 좁아지는 곳에서 강성이 확 바뀝니다. 아래 넓은 층이 다 받치니 거기부터 보강하세요.' },
    xs: [0, 5, 10, 15], zs: [0, 6], hs: [3.3, 3.3, 3.3, 3.3],
    storyCells: [null, null, ['1,0', '2,0'], ['1,0', '2,0']], brickStories: [2, 3], brick: { back: [0, 1] },
  },
  { // 18
    ...RC, id: 'rc_weakcol', strength: 1.5, name: { en: '1975 weak columns, strong beams', ko: '1975년 약한 기둥, 강한 보' },
    lesson: { en: 'Thin columns under heavy beams: a whole storey folds at once. Bracing only the ground floor moves the fold upstairs — strengthen every storey.', ko: '무거운 보 아래 가는 기둥: 한 층이 통째로 접힙니다. 1층만 보강하면 접힘이 위층으로 옮겨가요 — 층마다 보강하세요.' },
    xs: [0, 6, 12], zs: [0, 6], hs: [3.3, 3.3, 3.3], colW: 0.32, colScale: 0.75,
  },
  { // 19
    ...RC, quake: 0.45, id: 'rc_budget', strength: 1.9, name: { en: '1990 mixed-use on a budget', ko: '1990년 빠듯한 예산의 근린상가' },
    lesson: { en: 'Shop glass in front, brick flats above and a brick back wall: stiff at the back, soft and twisting at the front. Money is tight — put it on the open front, and compare strength per won.', ko: '앞은 가게 유리, 위는 벽돌 세대, 뒤는 벽돌벽: 뒤는 뻣뻣하고 앞은 무르게 비틀립니다. 돈이 빠듯해요 — 뚫린 앞쪽에, 원당 효과를 따져 쓰세요.' },
    xs: [0, 5, 10, 15], zs: [0, 6], hs: [3.5, 3.0, 3.0],
    windows: [[0, 'x', 0, 0], [0, 'x', 0, 1], [0, 'x', 0, 2]], brickStories: [1, 2], brick: { back: [0] }, tight: true,
  },
  { // 20
    ...RC, quake: 0.45, id: 'rc_five', strength: 3.0, name: { en: '1992 five-storey building', ko: '1992년 5층 건물' },
    lesson: { en: 'Five storeys, brick from the 2nd floor up but only a brick back wall at street level: a soft, twisting ground floor under everything. Brace continuously from the ground up, balanced — no weak storey anywhere.', ko: '5층, 2층부터 위는 벽돌인데 1층엔 뒤쪽 벽돌벽뿐: 모든 무게 아래 무르고 비틀리는 1층. 땅부터 끊김 없이, 균형 있게 보강하세요 — 약한 층이 하나도 없게.' },
    xs: [0, 6, 12], zs: [0, 6], hs: [3.3, 3.0, 3.0, 3.0, 3.0], brickStories: [1, 2, 3, 4], brick: { back: [0] },
  },
);
// storyCells 의 null = 전체 칸
LEVELS.forEach((L) => { if (L.storyCells) L.storyCells = L.storyCells.map((c) => c || L.xs.slice(1).flatMap((_, i) => L.zs.slice(1).map((__, k) => `${i},${k}`))); });

// 'plyStory1' = 2층 벽 전부 합판(문 칸 빼고)
LEVELS.forEach((L, n) => {
  L.n = n + 1;
  if (L.brickStories || L.brick) {
    const M0 = makeModel({ ...L, pre: [] });
    const face = (b) => (b.normal[2] < 0 ? 'front' : b.normal[2] > 0 ? 'back' : b.normal[0] < 0 ? 'left' : 'right');
    // brickBays: { 면: [칸 순서…] } — 그 면에서 왼쪽(작은 좌표)부터 n번째 칸만 (모든 층)
    const nth = (b) => { const p = M0.nodes[b.b0].p, q = M0.nodes[b.b1].p; return b.ax === 'x' ? Math.min(p[0], q[0]) : Math.min(p[2], q[2]); };
    const pick = (b) => (L.brickStories || []).includes(b.s) || ((L.brick || {})[face(b)] || []).includes(b.s) ||
      Object.entries(L.brickBays || {}).some(([f, list]) => f === face(b) && list.includes(M0.bays.filter((c) => face(c) === f && c.s === b.s).map(nth).sort((x, y) => x - y).indexOf(nth(b))));
    L.pre = [...(Array.isArray(L.pre) ? L.pre : []), ...M0.bays.filter((b) => pick(b) && !b.door && !b.window && b.rect).map((b) => ({ t: 'brick', bay: b.id }))];
  }
  if (L.pre === 'plyStory1') L.pre = makeModel({ ...L, pre: [] }).bays.filter((b) => b.s === 1 && !b.door && b.rect).map((b) => ({ t: 'ply', bay: b.id }));
});

// ===== 쉬움 / 어려움 (형 10/12) =====
// 1–20 = 쉬움(본편): 나무는 지진 0.85배로 순하게, 콘크리트는 위에서 맞춘 세기 그대로(보강 없으면 3.8~4.8초에 무너짐).
// 21–40 = 어려움: 같은 건물, id + '_h'. 나무는 원래 세기(1.0), 콘크리트는 1.2배. 예산·별 기준도 빡빡 (game.js budgetOf · sim.js starsFor).
export const EASY_WOOD_QUAKE = 0.85, HARD_RC_QUAKE = 1.2;
const EASY = LEVELS.slice();
EASY.forEach((L) => { L.hard = false; L.baseQuake = L.quake; if (L.mat !== 'rc') L.quake = +(L.quake * EASY_WOOD_QUAKE).toFixed(3); });
EASY.forEach((L, i) => LEVELS.push({ ...L, id: L.id + '_h', n: 21 + i, hard: true, easyId: L.id, quake: L.mat === 'rc' ? +(L.baseQuake * HARD_RC_QUAKE).toFixed(3) : L.baseQuake }));
