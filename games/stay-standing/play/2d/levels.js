// 단계 데이터 (나무집 1~10편). 절점 이름 'i,j' = (xs[i], ys[j]) 격자점, 그 밖의 이름은 extra 에서 정의.
// members: [부재종류, 절점A, 절점B]. walls: 처음부터 있는 합판벽 칸 [i,j](왼쪽아래 격자).
// braces: 처음부터 있는 가새. openings: 문·창 칸 — 막아도 되지만 출구가 막혀 별 -1.
// base: 기초에 박힌 절점(없으면 맨 아랫줄). loads: 절점에 얹힌 질량(kg) — 지붕·바닥 무게.
// lesson: 이 단계가 가르치는 한 가지. solution: 시험용 모범 보강(화면엔 안 나옴)
//   'X a b' 가새 · 'W i j' 합판벽 · 'P a b' 기둥 · 'B a b' 보 · 'C n' 철물
//   RC: 'S i j' 철골X가새 · 'R i j' RC전단벽 · 'J a b' 기둥증설 · 'F a b' 탄소섬유 · 'G a b' 날개벽
(function () {
  const QR = (globalThis.QR = globalThis.QR || {});

  // 박공지붕 한 채 만들기 도우미: 격자 위 처마 줄(top)과 용마루 R
  const gable = (n, top, mid) => {
    const m = [['rafter', `0,${top}`, 'R'], ['rafter', 'R', `${n - 1},${top}`]];
    if (mid) m.push(['strut', mid, 'R']);
    return m;
  };
  const row = (type, j, from, to, extra) => {
    const out = [];
    let pts = []; for (let i = from; i <= to; i++) pts.push(`${i},${j}`);
    if (extra) pts = extra(pts);
    for (let k = 0; k + 1 < pts.length; k++) out.push([type, pts[k], pts[k + 1]]);
    return out;
  };
  const cols = (type, list, j0, j1) => list.flatMap((i) => { const o = []; for (let j = j0; j < j1; j++) o.push([type, `${i},${j}`, `${i},${j + 1}`]); return o; });
  // RC 바닥 무게(kg): 층마다 바깥 기둥 ext, 안쪽 int / 지붕 rext, rint
  const rcLoads = (n, rows, ext, int, rext, rint) => { const o = {}; const top = Math.max(...rows);
    rows.forEach((j) => { for (let i = 0; i < n; i++) o[`${i},${j}`] = (i === 0 || i === n - 1) ? (j === top ? rext : ext) : (j === top ? rint : int); }); return o; };
  const posts = (cols, j0, j1) => cols.flatMap((i) => { const o = []; for (let j = j0; j < j1; j++) o.push(['post', `${i},${j}`, `${i},${j + 1}`]); return o; });

  const BASE = [
    { // 1
      id: 'wood1', material: 'wood',
      name: { en: 'Little cabin', ko: '작은 나무집' },
      lesson: { en: 'One brace only works one way. Braces in both directions (an X) or a plywood wall hold the house.', ko: '가새 하나는 한쪽 방향만 버팁니다. 양방향(X자)이나 합판벽이어야 집이 섭니다.' },
      xs: [0, 3, 6], ys: [0, 2.7], extra: { R: [3, 4.3] },
      members: [...posts([0, 2], 0, 1), ...row('beam', 1, 0, 2), ...gable(3, 1, '1,1')],
      walls: [], braces: [], openings: [[1, 0]],
      loads: { R: 700, '0,1': 650, '2,1': 650, '1,1': 450 },
      budget: 740000, pga: 0.5,
      solution: ['X 0,0 1,1', 'X 1,0 0,1'], // 최저가 탐색(가새 좌굴 반영)
      solutionEasy: ['X 0,0 1,1', 'X 1,0 0,1'], // 최저가 탐색(가새 좌굴 반영)
      solutionHard: ['X 1,0 0,1', 'X 1,0 D10Lt', 'C 1,0', 'C 0,1'], // 최저가 탐색(가새 좌굴 반영)
    },
    { // 2
      id: 'wood2', material: 'wood',
      name: { en: 'Shed on stilts', ko: '기둥 위 창고' },
      lesson: { en: 'A box on bare stilts is only as strong as its legs. Brace the stilts, not the box.', ko: '맨 기둥 위 상자는 다리만큼만 강합니다. 상자 말고 다리를 보강하세요.' },
      xs: [0, 2.4, 4.8], ys: [0, 2.2, 4.4], extra: { R: [2.4, 5.6] },
      members: [...posts([0, 2], 0, 1), ...posts([0, 2], 1, 2), ...row('beam', 1, 0, 2), ...row('beam', 2, 0, 2), ...gable(3, 2, '1,2')],
      walls: [[0, 1], [1, 1]], braces: [], openings: [],
      loads: { R: 450, '0,2': 400, '2,2': 400, '1,2': 250, '0,1': 600, '1,1': 900, '2,1': 600 },
      budget: 570000, pga: 0.38,
      solution: ['X 0,0 1,1', 'X 1,0 0,1', 'C 0,0', 'C 1,1'], // 최저가 탐색(가새 좌굴 반영)
      solutionEasy: ['W 0 0', 'C 0,0', 'C 1,0'], // 10/12 오후: 합판벽 양 끝 홀다운 규칙 뒤 다시 고름
      solutionHard: ['W 0 0', 'C 0,0', 'C 1,0'], // 10/12 오후: 합판벽 양 끝 홀다운 규칙 뒤 다시 고름
    },
    { // 3
      id: 'wood3', material: 'wood',
      name: { en: 'House with a big window', ko: '큰 창이 있는 집' },
      lesson: { en: 'Bracing across the window blocks it. Put braces in the solid bays on both sides, balanced.', ko: '창 위에 가새를 대면 창이 막힙니다. 양옆 막힌 칸에 고르게 나눠 넣으세요.' },
      xs: [0, 3, 6, 9], ys: [0, 2.7], extra: { R: [4.5, 4.5], K: [4.5, 2.7] },
      members: [...posts([0, 1, 2, 3], 0, 1), ...row('beam', 1, 0, 3, (p) => [p[0], p[1], 'K', p[2], p[3]]), ...gable(4, 1, 'K'), ['strut', '1,1', 'R'], ['strut', '2,1', 'R']],
      walls: [], braces: [], openings: [[1, 0, 'window']],
      loads: { R: 900, K: 300, '0,1': 600, '3,1': 600, '1,1': 450, '2,1': 450 },
      budget: 670000, pga: 0.6,
      solution: ['W 0 0'], // 최저가 탐색(가새 좌굴 반영)
      solutionEasy: ['W 0 0', 'C 0,0', 'C 1,0'], // 10/12 오후: 합판벽 양 끝 홀다운 규칙 뒤 다시 고름
      solutionHard: ['W 0 0', 'C 0,0', 'C 1,0'], // 10/12 오후: 합판벽 양 끝 홀다운 규칙 뒤 다시 고름
    },
    { // 4
      id: 'wood4', material: 'wood',
      name: { en: 'Shop house (open ground floor)', ko: '1층이 뚫린 상가주택' },
      lesson: { en: 'No matter how strong you make the 2nd floor, the open 1st floor collapses — put at least one brace/wall on the ground floor.', ko: '2층을 아무리 튼튼하게 해도 비어 있는 1층은 무너집니다 — 1층에 가새나 벽을 꼭 하나 이상 넣으세요.' },
      xs: [0, 3, 6], ys: [0, 2.7, 5.4], extra: { R: [3, 6.9] },
      members: [...posts([0, 2], 0, 1), ...posts([0, 1, 2], 1, 2), ...row('beam', 1, 0, 2), ...row('beam', 2, 0, 2), ...gable(3, 2, '1,2')],
      walls: [[0, 1], [1, 1]], braces: [], openings: [],
      loads: { R: 500, '0,2': 400, '2,2': 400, '1,2': 300, '0,1': 500, '1,1': 650, '2,1': 500 },
      budget: 250000, pga: 0.3,
      solution: ['X 0,0 1,1', 'X 1,0 0,1'], // 최저가 탐색(가새 좌굴 반영)
      solutionEasy: ['X 0,0 1,1', 'X 1,0 0,1'], // 최저가 탐색(가새 좌굴 반영)
      solutionHard: ['X 0,0 1,1', 'X 1,0 0,1', 'C 1,0'], // 최저가 탐색(가새 좌굴 반영)
    },
    { // 5
      id: 'wood5', material: 'wood',
      name: { en: 'Long house', ko: '긴 집' },
      lesson: { en: 'Bracing only one end leaves the far end loose to rack. Spread braces evenly — both ends and the middle.', ko: '한쪽 끝만 보강하면 먼 쪽 끝이 비틀리며 기웁니다. 양 끝과 가운데에 고르게 나눠 넣으세요.' },
      xs: [0, 3, 6, 9, 12, 15], ys: [0, 2.7], extra: { R: [7.5, 4.6], K: [7.5, 2.7] },
      members: [...posts([0, 1, 2, 3, 4, 5], 0, 1), ...row('beam', 1, 0, 5, (p) => [p[0], p[1], p[2], 'K', p[3], p[4], p[5]]), ...gable(6, 1, 'K'),
        ['strut', '1,1', 'R'], ['strut', '4,1', 'R']],
      walls: [], braces: [['0,0', '1,1'], ['1,0', '0,1']], openings: [[1, 0]],
      loads: { R: 900, K: 300, '0,1': 550, '5,1': 550, '1,1': 500, '2,1': 500, '3,1': 500, '4,1': 500 },
      budget: 250000, pga: 0.6, pgaHard: 0.66,
      solution: ['X 2,0 3,1', 'X 3,0 4,1'], // 최저가 탐색(가새 좌굴 반영)
      solutionEasy: ['X 2,0 3,1', 'X 3,0 2,1'], // 최저가 탐색(가새 좌굴 반영)
      solutionHard: ['X 2,0 3,1', 'X 3,0 2,1', 'X 4,0 3,1'], // 최저가 탐색(가새 좌굴 반영)
    },
    { // 6
      id: 'wood6', material: 'wood',
      name: { en: 'House on a slope', ko: '비탈 위의 집' },
      lesson: { en: 'Short posts are stiffer, so they grab most of the quake force and fail first (short-column effect). Brace the short side too — not just the tall side.', ko: '짧은 기둥은 더 뻣뻣해서 지진 힘을 더 많이 받고 먼저 부서집니다(짧은 기둥 효과). 긴 쪽만 말고 짧은 쪽도 보강하세요.' },
      xs: [0, 3, 6], ys: [0, 1.6, 2.7, 5.4], extra: { R: [3, 6.9] },
      base: ['0,0', '1,1', '2,1'],
      members: [['post', '0,0', '0,1'], ['post', '0,1', '0,2'], ['beam', '0,1', '1,1'], ['post', '1,1', '1,2'], ['post', '2,1', '2,2'], ...row('beam', 2, 0, 2),
        ...posts([0, 1, 2], 2, 3), ...row('beam', 3, 0, 2), ...gable(3, 3, '1,3')],
      walls: [[0, 2], [1, 2]], braces: [], openings: [],
      loads: { R: 600, '0,3': 500, '2,3': 500, '1,3': 400, '0,2': 700, '1,2': 900, '2,2': 700 },
      budget: 220000, pga: 0.5,
      solution: ['W 0 1'], // 최저가 탐색(가새 좌굴 반영)
      solutionEasy: ['W 0 1'], // 최저가 탐색(가새 좌굴 반영)
      solutionHard: ['W 0 1'], // 최저가 탐색(가새 좌굴 반영)
    },
    { // 7
      id: 'wood7', material: 'wood',
      name: { en: 'Heavy tile roof', ko: '무거운 기와지붕' },
      lesson: { en: 'Quake force = mass × shaking. A heavy roof up high pulls hard — one brace will not do, it needs full walls.', ko: '지진 힘 = 무게 × 흔들림. 높이 얹힌 무거운 지붕은 세게 잡아당깁니다 — 가새 하나론 안 되고 벽이 필요해요.' },
      xs: [0, 3, 6], ys: [0, 2.8], extra: { R: [3, 4.9] },
      members: [...posts([0, 2], 0, 1), ...row('beam', 1, 0, 2), ...gable(3, 1, '1,1')],
      walls: [], braces: [], openings: [],
      loads: { R: 1500, '0,1': 1200, '2,1': 1200, '1,1': 700 },
      roofStyle: 'heavy',
      budget: 730000, pga: 0.45,
      solution: ['W 0 0'], // 최저가 탐색(가새 좌굴 반영)
      solutionEasy: ['X 1,0 0,1', 'X 1,0 2,1', 'C 1,0', 'C 0,1', 'C 2,1'], // 최저가 탐색(가새 좌굴 반영)
      solutionHard: ['X 1,0 0,1', 'X 1,0 2,1', 'C 1,0', 'C 0,1', 'C 2,1'], // 최저가 탐색(가새 좌굴 반영)
    },
    { // 8
      id: 'wood8', material: 'wood',
      name: { en: 'Narrow house with balcony', ko: '발코니 달린 좁은 집' },
      lesson: { en: 'Tall, narrow walls try to tip over and yank their posts out of the foundation. Hold-downs at the base stop that.', ko: '높고 좁은 벽은 넘어지려 하며 기둥을 기초에서 뽑아 올립니다. 밑동 홀다운 철물이 막아요.' },
      xs: [0, 2.7], ys: [0, 2.7, 5.4], extra: { R: [1.35, 6.7], B: [4.0, 2.7] },
      members: [...posts([0, 1], 0, 2), ...row('beam', 1, 0, 1), ...row('beam', 2, 0, 1), ['beam', '1,1', 'B'], ...gable(2, 2)],
      walls: [], braces: [], openings: [],
      loads: { R: 350, '0,2': 400, '1,2': 400, '0,1': 650, '1,1': 650, B: 350 },
      budget: 830000, pga: 0.65,
      solution: ['W 0 0', 'X 0,1 1,2', 'X 1,1 0,2', 'C 0,0'], // 최저가 탐색(가새 좌굴 반영)
      solutionEasy: ['W 0 0', 'X 0,1 1,2', 'X 1,1 0,2'], // 최저가 탐색(가새 좌굴 반영)
      solutionHard: ['W 0 0', 'X 0,1 1,2', 'X 1,1 0,2', 'C 0,0', 'C 1,0'], // 최저가 탐색(가새 좌굴 반영)
    },
    { // 9
      id: 'wood9', material: 'wood',
      name: { en: 'Family house on a budget', ko: '빠듯한 예산의 가족집' },
      lesson: { en: 'Money is tight: put walls where they work hardest — the ground floor, both ends — and skip the rest.', ko: '돈이 빠듯합니다: 가장 일 많이 하는 곳(1층, 양 끝)에만 넣고 나머진 아끼세요.' },
      xs: [0, 3, 6, 9], ys: [0, 2.7, 5.4], extra: { R: [4.5, 7.6], K: [4.5, 5.4] },
      members: [...posts([0, 2, 3], 0, 1), ...posts([0, 1, 2, 3], 1, 2), ...row('beam', 1, 0, 3), ...row('beam', 2, 0, 3, (p) => [p[0], p[1], 'K', p[2], p[3]]),
        ...gable(4, 2, 'K'), ['strut', '1,2', 'R'], ['strut', '2,2', 'R']],
      walls: [[0, 1]], braces: [['2,0', '3,1']], openings: [[1, 0]],
      loads: { R: 800, '0,2': 700, '3,2': 700, '1,2': 500, '2,2': 500, K: 400, '0,1': 800, '1,1': 1100, '2,1': 1100, '3,1': 800 },
      budget: 340000, pga: 0.25,
      solution: ['X 1,0 0,1', 'X 0,0 1,1', 'X D10Lb 1,1', 'X 1,0 D10Lt'], // 쉬움 1~3 모두 버티는 보강 (10/12)
      solutionEasy: ['X 1,0 0,1', 'X 0,0 1,1', 'X D10Lb 1,1', 'X 1,0 D10Lt'], // 10/12 오후: 합판벽 양 끝 홀다운 규칙 뒤 다시 고름
      solutionHard: ['X 1,0 D10Lt', 'C 1,0', 'C D10Lt'], // 최저가 탐색(가새 좌굴 반영)
    },
    { // 10
      id: 'wood10', material: 'wood',
      name: { en: 'Three-story timber house', ko: '3층 목조주택' },
      lesson: { en: 'The lowest story carries the sway of every floor above it. Make each story at least as strong as the one on top.', ko: '맨 아래층은 위 모든 층의 흔들림을 받칩니다. 아래층일수록 더 튼튼하게 하세요.' },
      xs: [0, 3, 6], ys: [0, 2.7, 5.4, 8.1], extra: { R: [3, 9.6] },
      members: [...posts([0, 2], 0, 1), ...posts([0, 1, 2], 1, 3), ...row('beam', 1, 0, 2), ...row('beam', 2, 0, 2), ...row('beam', 3, 0, 2), ...gable(3, 3, '1,3')],
      walls: [], braces: [], openings: [],
      loads: { R: 600, '0,3': 550, '2,3': 550, '1,3': 400, '0,2': 700, '1,2': 900, '2,2': 700, '0,1': 700, '1,1': 900, '2,1': 700 },
      budget: 2420000, pga: 0.5,
      solution: ['W 0 0', 'X 1,1 0,2', 'W 0 2', 'W 1 0', 'W 1 1'], // 최저가 탐색(가새 좌굴 반영)
      solutionEasy: ['W 0 0', 'X 1,1 0,2', 'W 0 2', 'W 1 0', 'W 1 1', 'C 0,0', 'C 1,0', 'C 2,0'], // 10/12 오후: 합판벽 양 끝 홀다운 규칙 뒤 다시 고름
      solutionHard: ['W 0 0', 'W 1 0', 'W 0 1', 'W 1 1', 'W 0 2', 'W 1 2', 'C 0,0', 'C 1,0', 'C 2,0'], // 최저가 탐색(가새 좌굴 반영)
    },

    // =================== 2장: 철근콘크리트 (31~60판) — 1970~90년대에 지은 옛 건물들 ===================
    // walls = 처음부터 있는 벽돌(조적) 채움벽: 처음엔 단단하지만 깨지면 빠져 떨어지고 힘이 맨 골조로 넘어감.
    // back = 화면 밖 뒷면(벽돌로 꽉 막힌 면)의 강성 배율 → 앞뒤가 다르면 건물이 비틀림(작은 평면도로 보여 줌)
    { // R1
      id: 'rc1', material: 'rc', roofStyle: 'flat', year: 1984,
      name: { en: 'Old office, brick on one side (1984)', ko: '한쪽만 벽돌인 옛 사무소 (1984)' },
      lesson: { en: 'Old concrete frames bend and crack before they fall. The brick bay is stiff at first, then cracks and drops out — and the force jumps to the bare frame. Brace the open bay so both sides share the load.', ko: '옛 콘크리트 골조는 휘고 금이 가다가 무너집니다. 벽돌 칸은 처음엔 단단하지만 깨져 빠지면 힘이 맨 골조로 넘어가요 — 열린 칸을 보강해 양쪽이 나눠 받게 하세요.' },
      xs: [0, 6, 12], ys: [0, 3.3, 6.6],
      members: [...cols('col', [0, 1, 2], 0, 2), ...row('rbeam', 1, 0, 2), ...row('rbeam', 2, 0, 2)],
      walls: [[0, 0], [0, 1]], braces: [], openings: [],
      loads: rcLoads(3, [1, 2], 14000, 22000, 9000, 14000),
      budget: 14900000, pga: 0.58, solution: ['S 1 0', 'S 1 1'],
    },
    { // R2
      id: 'rc2', material: 'rc', roofStyle: 'flat', year: 1995,
      name: { en: 'Piloti villa (1995)', ko: '필로티 다세대 (1995)' },
      lesson: { en: 'Piloti: brick walls upstairs, open parking below. No matter how strong the upper floors are, the open ground floor folds — put a brace or wall on the ground floor.', ko: '필로티: 위층은 벽돌벽, 1층은 뻥 뚫린 주차장. 위층이 아무리 튼튼해도 1층이 접힙니다 — 1층에 가새나 벽을 넣으세요.' },
      xs: [0, 6, 12], ys: [0, 3.0, 5.8, 8.6, 11.4],
      members: [...cols('col', [0, 1, 2], 0, 4), ...[1, 2, 3, 4].flatMap((j) => row('rbeam', j, 0, 2))],
      walls: [[0, 1], [1, 1], [0, 2], [1, 2], [0, 3], [1, 3]], braces: [], openings: [],
      loads: rcLoads(3, [1, 2, 3, 4], 12000, 19000, 8000, 12000),
      budget: 13800000, pga: 0.3, solution: ['S 0 0', 'S 1 0'],
    },
    { // R3
      id: 'rc3', material: 'rc', roofStyle: 'flat', year: 1978,
      name: { en: 'School with brick sill walls (1978)', ko: '벽돌 허리벽 학교 (1978)' },
      lesson: { en: 'Brick sill walls under the window band leave only a short stub of column. Short columns are stiff, grab the force and split in shear. Wrap them, or cut the brick free with a seismic slit.', ko: '창 아래 벽돌 허리벽 때문에 기둥이 짧게 남습니다. 짧은 기둥은 뻣뻣해서 힘을 몰아 받고 빗금(전단)으로 쪼개져요. 감싸 주거나, 내진 슬릿으로 벽돌을 떼어 내세요.' },
      xs: [0, 6, 12, 18], ys: [0, 1.2, 2.4, 3.4],
      members: [...cols('col', [0, 1, 2, 3], 0, 3), ...row('rbeam', 1, 0, 3), ...row('rbeam', 2, 0, 3), ...row('rbeam', 3, 0, 3)],
      walls: [[0, 0], [1, 0], [2, 0], [0, 2], [1, 2], [2, 2]], braces: [], openings: [[0, 1, 'window'], [1, 1, 'window'], [2, 1, 'window']],
      sills: [[0, 0], [1, 0], [2, 0], [0, 2], [1, 2], [2, 2]], // 허리벽·창 위 벽: 내진 슬릿을 넣을 수 있음
      loads: rcLoads(4, [3], 0, 0, 14000, 22000),
      budget: 3100000, pga: 0.56, solution: ['G 0,1 0,2', 'F 1,1 1,2', 'F 2,1 2,2'],
    },
    { // R4
      id: 'rc4', material: 'rc', roofStyle: 'flat', year: 1990, back: { ratio: 2.5, ko: '뒷면: 벽돌로 꽉 막힘', en: 'Back: solid brick' },
      name: { en: 'Corner shop: glass front, brick back (1990)', ko: '앞은 유리, 뒤는 벽돌인 상가 (1990)' },
      lesson: { en: 'Glass in front, brick at the back: the building twists and the glass side swings the most. Stiffen the front (wing walls keep the glass) until both sides balance.', ko: '앞은 유리, 뒤는 벽돌: 건물이 비틀리며 유리 쪽이 가장 크게 흔들립니다. 앞쪽을 단단하게(날개벽은 유리를 살림) 해서 앞뒤 균형을 맞추세요.' },
      xs: [0, 5, 10, 15], ys: [0, 3.6, 6.6],
      members: [...cols('col', [0, 1, 2, 3], 0, 2), ...row('rbeam', 1, 0, 3), ...row('rbeam', 2, 0, 3)],
      walls: [[0, 1], [1, 1], [2, 1]], braces: [], openings: [[0, 0, 'window'], [1, 0, 'window'], [2, 0, 'window']],
      loads: rcLoads(4, [1, 2], 10000, 16000, 7000, 11000),
      budget: 15900000, pga: 0.32, solution: ['J 0,0 0,1', 'G 1,0 1,1', 'G 2,0 2,1'],
    },
    { // R5
      id: 'rc5', material: 'rc', roofStyle: 'flat', year: 1982,
      name: { en: 'Long school, brick stair at one end (1982)', ko: '한쪽 끝에 벽돌 계단실, 긴 학교 (1982)' },
      lesson: { en: 'A long building with a stiff brick stair at one end: the far end swings free. Spread bracing along the length — the far end and the middle — not next to what is already stiff.', ko: '한쪽 끝만 벽돌 계단실로 단단한 긴 건물: 먼 끝이 마음대로 흔들립니다. 이미 단단한 곳 옆이 아니라 먼 끝과 가운데에 나눠 보강하세요.' },
      xs: [0, 4, 8, 12, 16, 20], ys: [0, 3.4, 6.8],
      members: [...cols('col', [0, 1, 2, 3, 4, 5], 0, 2), ...row('rbeam', 1, 0, 5), ...row('rbeam', 2, 0, 5)],
      walls: [[0, 0], [0, 1]], braces: [], openings: [],
      loads: rcLoads(6, [1, 2], 10000, 15000, 7000, 10000),
      memberMods: { rbeam: { EA: 0.004, tcap: 0.8 } }, // 20m 긴 바닥: 면내로 휘어 먼 끝이 늦게·따로 흔들림
      budget: 11000000, pga: 0.44, solution: ['S 2 0'],
    },
    { // R6
      id: 'rc6', material: 'rc', roofStyle: 'flat', tank: '1,3', year: 1988,
      name: { en: 'Heavy rooftop water tank (1988)', ko: '옥상 물탱크 건물 (1988)' },
      lesson: { en: 'A heavy tank on the roof swings the whole building like a pendulum. Mass up high needs stronger bracing all the way down.', ko: '옥상의 무거운 물탱크는 건물 전체를 시계추처럼 흔듭니다. 높은 곳의 무게는 아래층까지 더 튼튼한 보강이 필요해요.' },
      xs: [0, 6, 12], ys: [0, 3.2, 6.4, 9.6],
      members: [...cols('col', [0, 1, 2], 0, 3), ...[1, 2, 3].flatMap((j) => row('rbeam', j, 0, 2))],
      walls: [[1, 1], [1, 2]], braces: [], openings: [],
      loads: { ...rcLoads(3, [1, 2, 3], 12000, 19000, 8000, 12000), '1,3': 12000 + 45000 },
      budget: 29000000, pga: 0.3, solution: ['S 0 1', 'S 1 0'],
    },
    { // R7
      id: 'rc7', material: 'rc', roofStyle: 'flat', year: 1986,
      name: { en: 'Setback building (1986)', ko: '위가 좁아지는 건물 (1986)' },
      lesson: { en: 'Where the building steps in, stiffness jumps. The floors below the setback carry everything — brace them first.', ko: '건물이 좁아지는 곳에서 강성이 확 바뀝니다. 그 아래층이 다 받치니 거기부터 보강하세요.' },
      xs: [0, 5, 10, 15], ys: [0, 3.3, 6.6, 9.9, 13.2],
      members: [...cols('col', [0, 1, 2, 3], 0, 2), ...cols('col', [1, 2, 3], 2, 4), ...row('rbeam', 1, 0, 3), ...row('rbeam', 2, 0, 3), ...row('rbeam', 3, 1, 3), ...row('rbeam', 4, 1, 3)],
      walls: [[1, 2], [2, 2], [1, 3], [2, 3]], braces: [], openings: [],
      loads: { ...rcLoads(4, [1, 2], 11000, 17000, 0, 0), '1,3': 11000, '2,3': 17000, '3,3': 11000, '1,4': 7000, '2,4': 11000, '3,4': 7000, '0,2': 8000 },
      budget: 16000000, pga: 0.5, solution: ['S 1 0', 'S 2 0', 'S 1 1', 'S 2 1'],
    },
    { // R8
      id: 'rc8', material: 'rc', roofStyle: 'flat', year: 1980, back: { ratio: 1.6, ko: '뒷면: 벽돌 반쯤', en: 'Back: half brick' },
      name: { en: 'Weak columns, strong beams (1980)', ko: '약한 기둥, 강한 보 (1980)' },
      lesson: { en: 'Strong column, weak beam: if columns are weaker than beams, a whole story folds at once. Make the columns the strong part (jacket them).', ko: '강한 기둥-약한 보: 기둥이 보보다 약하면 한 층이 통째로 접힙니다. 기둥을 강하게(단면 증설) 만드세요.' },
      xs: [0, 6, 12], ys: [0, 3.3, 6.6, 9.9],
      members: [...cols('colS', [0, 1, 2], 0, 3), ...[1, 2, 3].flatMap((j) => row('rbeam', j, 0, 2))],
      walls: [], braces: [], openings: [],
      loads: rcLoads(3, [1, 2, 3], 11000, 17000, 7000, 11000),
      budget: 23000000, pga: 0.5, solution: ['S 0 0', 'S 0 1', 'S 0 2'],
    },
    { // R9
      id: 'rc9', material: 'rc', roofStyle: 'flat', year: 1992, back: { ratio: 2.2, ko: '뒷면: 벽돌로 꽉 막힘', en: 'Back: solid brick' },
      name: { en: 'Mixed-use on a budget (1992)', ko: '빠듯한 예산의 근린상가 (1992)' },
      lesson: { en: 'Money is tight and the back is solid brick, so the open shop front twists. Compare tools by force per won — and aim for balance, not just strength.', ko: '예산은 빠듯하고 뒤는 벽돌로 꽉 막혀 앞 가게 쪽이 비틀립니다. 원당 효과를 비교하고, 세기보다 앞뒤 균형을 노리세요.' },
      xs: [0, 5, 10, 15], ys: [0, 3.5, 6.5, 9.5],
      members: [...cols('col', [0, 1, 2, 3], 0, 3), ...[1, 2, 3].flatMap((j) => row('rbeam', j, 0, 3))],
      walls: [[0, 1], [2, 1], [0, 2], [2, 2]], braces: [], openings: [[1, 0, 'window']],
      loads: rcLoads(4, [1, 2, 3], 10000, 16000, 7000, 11000),
      budget: 13500000, pga: 0.45, solution: ['S 0 0', 'S 2 0'],
    },
    { // R10
      id: 'rc10', material: 'rc', roofStyle: 'flat', year: 1989, back: { ratio: 2.6, ko: '뒷면: 벽돌로 꽉 막힘', en: 'Back: solid brick' },
      name: { en: 'Five-story apartment, tall shop floor (1989)', ko: '1층 상가가 높은 5층 아파트 (1989)' },
      lesson: { en: 'Five stories, a tall open shop floor, brick everywhere above and at the back: soft story and twist together. Brace continuously from the ground up and balance the open front.', ko: '5층에 1층은 높고 뚫린 상가, 위층과 뒷면은 벽돌: 약한 층과 비틀림이 겹칩니다. 땅부터 끊김 없이 보강하고 열린 앞면의 균형을 맞추세요.' },
      xs: [0, 6, 12], ys: [0, 3.6, 6.6, 9.6, 12.6, 15.6],
      members: [...cols('col', [0, 1, 2], 0, 5), ...[1, 2, 3, 4, 5].flatMap((j) => row('rbeam', j, 0, 2))],
      walls: [[0, 1], [0, 2], [1, 2], [0, 3], [1, 3], [0, 4], [1, 4]], braces: [], openings: [],
      loads: rcLoads(3, [1, 2, 3, 4, 5], 12000, 19000, 8000, 12000),
      budget: 40600000, pga: 0.36, solution: ['R 0 0', 'R 1 0', 'R 0 1', 'R 1 1'],
    },
  ];

  // 별 규칙: 모범 보강 비용과 비교 (판마다 3★가 꼭 가능하도록)
  //  쉬움: 버팀 = 1★ · 비용 ≤ 모범×1.6 = 2★ · 비용 ≤ 모범×1.25 그리고 피해 <20% = 3★
  //  어려움: 버팀 = 1★ · 비용 ≤ 모범×1.3 그리고 피해 <40% = 2★ · 비용 ≤ 모범×1.05 그리고 피해 <15% = 3★ · 문/창 막으면 −1★
  QR.solutionCost = (lv) => lv.solution.map(QR.parseItem).reduce((t, it) => t + QR.priceOf(lv, it), 0);
  QR.starsFor = ({ ok, cost, refCost, damage, blocked, hard }) => {
    if (!ok) return 0;
    let st = 1;
    if (hard) { if (cost <= refCost * 1.3 && damage < 40) st = 2; if (cost <= refCost * 1.05 && damage < 15) st = 3; }
    else { if (cost <= refCost * 1.6) st = 2; if (cost <= refCost * 1.25 && damage < 20) st = 3; }
    return blocked ? Math.max(0, st - 1) : st;
  };

  // 'X a b' 같은 짧은 표기를 설계 항목으로
  QR.parseItem = (s) => {
    const [k, p, q] = s.split(' ');
    if (k === 'X') return { tool: 'brace', a: p, b: q };
    if (k === 'W') return { tool: 'wall', i: +p, j: +q };
    if (k === 'P') return { tool: 'post', a: p, b: q };
    if (k === 'B') return { tool: 'beam', a: p, b: q };
    if (k === 'S') return { tool: 'steelx', i: +p, j: +q };   // 철골 X가새 칸
    if (k === 'R') return { tool: 'rcwall', i: +p, j: +q };   // RC 전단벽 칸
    if (k === 'J') return { tool: 'jacket', a: p, b: q };     // 기둥 단면 증설
    if (k === 'F') return { tool: 'frp', a: p, b: q };        // 탄소섬유
    if (k === 'G') return { tool: 'wing', a: p, b: q };       // 날개벽
    if (k === 'L') return { tool: 'slit', i: +p, j: +q };     // 내진 슬릿 (벽돌 칸)
    return { tool: 'conn', n: p };
  };

  // ---- 문틀: 문 칸마다 양옆 샛기둥 + 인방(가는 부재, 핀 접합). 문 옆 좁은 칸에도 가새를 댈 절점이 생김 ----
  const DOOR_W = 1.0, DOOR_H = 2.1;
  function addDoorFrames(lv) {
    const doors = (lv.openings || []).filter((o) => o[2] !== 'window');
    if (!doors.length) return lv;
    const out = { ...lv, extra: { ...(lv.extra || {}) }, members: lv.members.slice(), doorRects: {} };
    const base = lv.base ? lv.base.slice() : lv.xs.map((_, i) => `${i},0`);
    doors.forEach(([i, j]) => {
      const x0 = lv.xs[i], x1 = lv.xs[i + 1], y0 = lv.ys[j], y1 = lv.ys[j + 1], cx = (x0 + x1) / 2;
      const xl = cx - DOOR_W / 2, xr = cx + DOOR_W / 2, yh = Math.min(y0 + DOOR_H, y1 - 0.25);
      const n = (k) => `D${i}${j}${k}`;
      Object.assign(out.extra, { [n('Lb')]: [xl, y0], [n('Lh')]: [xl, yh], [n('Lt')]: [xl, y1], [n('Rb')]: [xr, y0], [n('Rh')]: [xr, yh], [n('Rt')]: [xr, y1] });
      if (j === 0) base.push(n('Lb'), n('Rb'));
      // 칸 위 보를 문틀 위에서 나눔 (이어진 보라 휨은 그대로)
      const top = [`${i},${j + 1}`, `${i + 1},${j + 1}`];
      const k = out.members.findIndex(([t, a, b]) => t === 'beam' && ((a === top[0] && b === top[1]) || (a === top[1] && b === top[0])));
      if (k >= 0) out.members.splice(k, 1, ['beam', top[0], n('Lt')], ['beam', n('Lt'), n('Rt')], ['beam', n('Rt'), top[1]]);
      out.members.push(['stud', n('Lb'), n('Lh')], ['stud', n('Lh'), n('Lt')], ['stud', n('Rb'), n('Rh')], ['stud', n('Rh'), n('Rt')], ['stud', n('Lh'), n('Rh')]);
      out.doorRects[`${i},${j}`] = { x0: xl, x1: xr, y0, y1: yh };
    });
    out.base = base;
    return out;
  }

  // ---- 개념 하나당 3판 (쉬움 → 보통 → 어려움), 번호는 1,2,3… 그대로 이어짐 ----
  // 쉬움: 지진 약하게·돈 넉넉 / 보통: 기본 / 어려움: 지진 세게 — 가새·벽 끝을 철물로 잡아야 버팀
  const endpoints = (it) => it.tool === 'wall' ? cellCornersOf(it.i, it.j) : it.tool === 'conn' ? [it.n] : [it.a, it.b];
  const cellCornersOf = (i, j) => [`${i},${j}`, `${i + 1},${j}`, `${i},${j + 1}`, `${i + 1},${j + 1}`];
  
  const r10 = (x) => Math.round(x / 10000) * 10000; // 만원 단위
  const costOf = (lv, sol) => sol.reduce((t, x) => t + QR.priceOf(lv, QR.parseItem(x)), 0);
  QR.CONCEPTS = BASE;
  // 형 지시(10/12 최종): 장마다 '쉬움'(본편) 10판 + '어려움' 10판. 보통은 없음.
  //   번호: 1–10 나무 쉬움 · 11–20 RC 쉬움 · 21–30 나무 어려움 · 31–40 RC 어려움 (progress.js 와 같은 약속)
  //   쉬움: 지진 0.85×, 예산 = 모범 보강 ×2, ★★★ ≤ 모범×1.25 / 어려움: 지진 세게, 예산 ≈ 모범 ×1.1, ★★★ ≤ 모범×1.05
  const easyOf = (b, ci) => {
    const sol = b.solutionEasy || b.solution;
    return { ...b, id: b.id + 'e', mode: 'easy', concept: ci, tag: { en: 'Easy', ko: '쉬움' },
      pga: b.pgaEasy || +(b.pga * 0.85).toFixed(2), seed: ci * 3 + 2, solution: sol, budget: b.budgetEasy || r10(costOf(b, sol) * 2) };
  };
  const hardOf = (b, ci) => {
    const sol = b.solutionHard || b.solution;
    return { ...b, id: b.id + 'h', mode: 'hard', concept: ci, tag: { en: 'Hard', ko: '어려움' },
      pga: b.pgaHard || +(b.pga * (b.material === 'rc' ? 1 : 1.2)).toFixed(2), seed: b.material === 'rc' ? ci * 3 + 2 : ci * 3 + 3,
      solution: sol, budget: b.budgetHard || r10(costOf(b, sol) * 1.1 + 15000) };
  };
  const B2 = BASE.map(addDoorFrames);
  const wood = B2.map((b, ci) => [b, ci]).filter(([b]) => b.material === 'wood'), rc = B2.map((b, ci) => [b, ci]).filter(([b]) => b.material === 'rc');
  QR.LEVELS = [...wood.map(([b, ci]) => easyOf(b, ci)), ...rc.map(([b, ci]) => easyOf(b, ci)), ...wood.map(([b, ci]) => hardOf(b, ci)), ...rc.map(([b, ci]) => hardOf(b, ci))];
  QR.LEVELS.forEach((l, i) => { l.num = i < 20 ? i + 1 : i - 19; }); // 모드 안에서의 번호 (화면용)

})();
