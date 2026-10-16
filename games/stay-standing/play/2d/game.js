// 버텨라! / Stay Standing! (옛 이름 구조 보강하기) — 화면·입력·진행
(function () {
  const QR = globalThis.QR;
  const { World, makeQuake, computeSlots, checkLink, blocksDoor, nodePos, baseList, cellCorners } = QR.physics;
  const KO = (navigator.language || '').toLowerCase().startsWith('ko');
  const L = (o) => (typeof o === 'string' ? o : KO ? o.ko : o.en);
  const TX = {
    title: { en: 'Stay Standing!', ko: '버텨라!' },
    sub: { en: 'Reinforce the house within budget. Survive the quake and stay standing for 5 seconds.', ko: '정해진 돈으로 집을 보강하세요. 지진을 버티고 5초 동안 서 있으면 성공!' },
    tap: { en: 'Tap to start', ko: '눌러서 시작' },
    undo: { en: '↶ Undo', ko: '↶ 되돌리기' },
    reset: { en: 'Clear', ko: '모두 빼기' },
    pick: { en: 'Choose a house', ko: '집 고르기' },
    spentLbl: { en: 'You spent', ko: '쓴 돈' },
    refLbl: { en: 'Good-retrofit cost', ko: '모범 보강 비용' },
    engBtn: { en: "🔬 Engineer's view", ko: '🔬 진짜 해석 보기' },
    engTitle: { en: "Engineer's view — linear stiffness analysis", ko: '진짜 해석 — 2D 선형 강성법' },
    mech: { en: 'Mechanism: no lateral resistance', ko: '메커니즘: 옆으로 버티는 힘 없음' },
    mechSub: { en: 'The stiffness matrix is singular — this story just folds sideways like a parallelogram. It needs a triangle (brace) or a wall.', ko: '강성행렬이 특이(0) — 이 층은 평행사변형처럼 그냥 접힙니다. 삼각형(가새)이나 벽이 있어야 해요.' },
    stiff: { en: 'Lateral stiffness', ko: '옆 강성' },
    yours: { en: 'Yours', ko: '내 보강' },
    goodFix: { en: 'Good retrofit', ko: '모범 보강' },
    driftUnder: { en: 'Story drift under 3 kN sideways:', ko: '옆 힘 3 kN 일 때 층 변위:' },
    tension: { en: 'tension', ko: '인장' },
    compr: { en: 'compression', ko: '압축' },
    thick: { en: 'thicker = more force', ko: '굵을수록 힘이 큼' },
    deformed: { en: 'deformed shape', ko: '변형 모양' },
    mechAnim: { en: 'mechanism mode (free sway)', ko: '메커니즘 모양 (그냥 흔들림)' },
    engNote: { en: 'Linear analysis: pinned bases and joints (metal plates add a little rotation stiffness), 3 kN spread by weight. No loosening or breaking — the quake test above includes those.', ko: '선형 해석: 밑동·접합부는 핀(철물만 조금 회전 저항), 3 kN 을 무게 비율로 나눠 걸음. 헐거워짐·부러짐은 빼고 계산 — 그건 지진 시험에서 보여요.' },
    back: { en: '← Back to result', ko: '← 결과로' },
    go: { en: 'Earthquake!', ko: '지진 시험!' },
    budget: { en: 'Budget', ko: '남은 돈' },
    lvl: { en: 'Lv', ko: '단계' },
    quakeStr: { en: 'Quake strength', ko: '지진 세기' },
    shaking: { en: 'Shaking…  hold on!', ko: '흔들린다… 버텨라!' },
    hold: { en: 'Shaking stopped — stand for 5 seconds', ko: '흔들림 멈춤 — 5초 버티기' },
    crash: { en: 'CRASH!', ko: '와장창!' },
    win: { en: 'It stood!', ko: '버텼다!' },
    lose: { en: 'Collapsed', ko: '무너졌다' },
    damage: { en: 'Damage', ko: '피해' },
    left: { en: 'Money left', ko: '남은 돈' },
    retry: { en: 'Try again', ko: '다시 하기' },
    next: { en: 'Next house →', ko: '다음 집 →' },
    again: { en: 'Back to build', ko: '보강 고치기' },
    allclear: { en: 'All wooden houses done! RC next.', ko: '나무집 끝! 다음은 철근콘크리트.' },
    nomoney: { en: 'Not enough money!', ko: '돈이 모자라요!' },
    remove: { en: 'tap to remove (refund)', ko: '누르면 빼고 돈 돌려받음' },
    doorBlocked: { en: '🚪 Exit blocked', ko: '🚪 출구 막힘' },
    winBlocked: { en: '🪟 Window blocked', ko: '🪟 창 막힘' },
    menu: { en: '← Menu', ko: '← 메뉴' },
    chOpen: { en: 'Next chapter unlocked!', ko: '다음 장 열림!' },
    chDone: { en: 'Chapter complete!', ko: '이 장 끝!' },
    toHub: { en: 'Go to menu →', ko: '메뉴로 →' },
    noBay: { en: 'A wall needs a bay framed on all sides', ko: '사방이 틀로 둘러싸인 칸에만 벽을 댈 수 있어요' },
    noSlit: { en: 'Slits go only on the old brick sill/spandrel walls', ko: '내진 슬릿은 옛 벽돌 허리벽·창 위 벽에만 넣어요' },
    rebar: { en: '🔩 Show rebar', ko: '🔩 철근 보기' },
    easy: { en: 'Easy', ko: '쉬움' }, hard: { en: 'Hard', ko: '어려움' },
    hardLock: { en: 'Clear every Easy level of a chapter to unlock its Hard levels', ko: '그 장의 쉬움 판을 다 깨면 어려움이 열려요' },
    hardOpen: { en: 'Hard mode unlocked for this chapter!', ko: '이 장의 어려움 모드가 열렸어요!' },
    plan: { en: 'Plan (from above)', ko: '평면 (위에서 본 모습)' },
    front: { en: 'front (this view)', ko: '앞 (지금 보는 면)' },
    twist: { en: 'Twist', ko: '비틀림' },
    balanced: { en: 'balanced', ko: '균형 맞음' },
    // CrazyGames 판: 첫 판 안내 (진행을 막지 않는 짧은 글)
    coach1: { en: 'Drag a brace from corner to corner', ko: '모서리에서 모서리로 가새를 끌어 보세요' },
    coach2: { en: 'Now the other diagonal: make an X', ko: '이번엔 반대 대각선: X자로!' },
    coachGo: { en: 'Now shake it!', ko: '이제 흔들어 봐요!' },
    coachTool: { en: 'Pick the Brace tool', ko: '가새 도구를 고르세요' },
    allLv: { en: '☰ All levels', ko: '☰ 전체 단계' },
    rot: { en: 'Rotate your phone to landscape', ko: '휴대폰을 가로로 돌려 주세요' },
  };
  const t = (k) => L(TX[k]);
  // 돈 표시: 한국어=원, 영어=달러(가격표의 usd 값을 그대로 더함)
  const usdOf = QR.usdOf;
  const won = (krw, usd) => (KO ? '₩' + Math.round(krw).toLocaleString() : '$' + Math.round(usd ?? usdOf(krw)).toLocaleString());
  const priceIt = (it) => QR.priceOf(level(), it);
  const wonIt = (it) => { const k = priceIt(it); return won(k, usdOf(k)); };
  // 도구 단추에 쓰는 단가 설명 (예: 3만+2만/m)
  const unitTxt = (id) => {
    const P = QR.PRICES[id], m = (k) => (KO ? (k / 10000).toLocaleString() + '만' : '$' + usdOf(k));
    if (P.perM2 !== undefined) return `${m(P.base)}+${m(P.perM2)}/㎡`;
    if (P.perM !== undefined) return `${m(P.base)}+${m(P.perM)}/m`;
    return won(P.base, usdOf(P.base));
  };

  // ---------- 상태 ----------
  const QS = new URLSearchParams(location.search);
  const FIRST = QS.get('first') === '1'; // 허브가 첫 방문자를 곧바로 1판으로 보냄
  const CG = globalThis.CG || { init() {}, loadingStart() {}, loadingStop() {}, gameplayStart() {}, gameplayStop() {}, happytime() {}, onMute() {}, go(u) { location.href = u; }, dirty() {} };
  CG.init(); CG.loadingStart();
  const G = { li: 0, design: [], tool: 'brace', mode: 'title', world: null, quake: null, time: 0, hover: null,
    debris: [], dust: [], sparks: [], shake: 0, collapseAt: null, lastCount: 0, stats: null };
  let progress = { v: 2, stars: [0, 0, 0], unlocked: 1 }; // v:2 — 없으면 progress.js 가 옛 60판 저장으로 보고 번호를 옮겨 버림(새 사용자 별이 엉뚱한 판으로 감)
  try { const p = JSON.parse(localStorage.getItem('qr-progress') || 'null'); if (p && p.stars) progress = p; } catch (e) {}
  const save = () => { try { localStorage.setItem('qr-progress', JSON.stringify(progress)); } catch (e) {} if (globalThis.CG) CG.dirty(); };

  const $ = (id) => document.getElementById(id);
  const cv = $('cv'), ctx = cv.getContext('2d');
  const stage = $('stage');
  const level = () => QR.LEVELS[G.li];
  const mat = () => QR.MATERIALS[level().material];
  const toolDef = (id) => QR.TOOLS.find((x) => x.id === id);
  const spent = () => G.design.reduce((s, d) => s + QR.priceOf(level(), d), 0);
  const money = () => level().budget - spent();
  const moneyUSD = () => usdOf(level().budget) - G.design.reduce((s, d) => s + usdOf(QR.priceOf(level(), d)), 0);
  const wonLeft = () => won(money(), moneyUSD());

  // ---------- 화면 맞춤 ----------
  let S = 1, DPR = 1;
  function fit() {
    const W = window.innerWidth, H = window.innerHeight;
    S = Math.min(W / 1600, H / 900);
    stage.style.transform = `translate(${(W - 1600 * S) / 2}px, ${(H - 900 * S) / 2}px) scale(${S})`;
    DPR = Math.min(2.5, S * (window.devicePixelRatio || 1));
    const coarse = !!(window.matchMedia && matchMedia('(pointer: coarse)').matches);
    G.compact = S < 0.55 || (coarse && S < 0.8);
    document.body.classList.toggle('compact', G.compact);
    if ($('undo').title) setUndoLabel();
    cv.width = Math.round(1600 * DPR); cv.height = Math.round(900 * DPR);
  }
  window.addEventListener('resize', fit);

  // 월드 → 화면
  const GY = 690; // 기초 윗면(y=0)의 화면 높이
  let ppm = 100, ox = 800;
  function layoutLevel() {
    const lv = level();
    const xs = [...lv.xs, ...Object.values(lv.extra || {}).map((p) => p[0])];
    const ys = [...lv.ys, ...Object.values(lv.extra || {}).map((p) => p[1])];
    const w = Math.max(...xs) - Math.min(...xs), h = Math.max(...ys);
    ppm = Math.min(118, 1100 / (w + 3), (GY - 120) / (h + 0.9));
    ox = 800 - ((Math.max(...xs) + Math.min(...xs)) / 2) * ppm;
  }
  const sx = (x) => ox + x * ppm, sy = (y) => GY - y * ppm;
  const wx = (px) => (px - ox) / ppm, wy = (py) => (GY - py) / ppm;

  // ---------- 설계 검증 (빼면 거기 기대던 것도 같이 빠짐) ----------
  const LINK = ['brace', 'post', 'beam'];
  const kindOf = (tool) => (QR.TOOLS.find((t) => t.id === tool) || {}).kind;
  const isBay = (tool) => kindOf(tool) === 'bay', isCol = (tool) => kindOf(tool) === 'column';
  const bayList = (tool, s) => ((toolDef(tool) || {}).slit ? s.slit : s.bay);
  const toolsHere = () => QR.TOOLS.filter((t) => t.mat === level().material);
  function validItem(d, design) {
    const s = computeSlots(level(), design);
    if (LINK.includes(d.tool)) return s.joints.includes(d.a) && s.joints.includes(d.b) && !checkLink(level(), design, d.tool, d.a, d.b);
    if (isBay(d.tool)) return bayList(d.tool, s).some((x) => x.i === d.i && x.j === d.j);
    if (isCol(d.tool)) return s.cols.some((c) => c.a === d.a && c.b === d.b) && !design.some((e) => e.tool === d.tool && e.a === d.a && e.b === d.b);
    if (d.tool === 'conn') return s.node.some((x) => x.n === d.n) && !design.some((e) => e.tool === 'conn' && e.n === d.n);
    return false;
  }
  function revalidate() {
    const out = [];
    for (const d of G.design) if (validItem(d, out)) out.push(d);
    G.design = out;
  }
  function rebuildPreview() {
    G.world = new World(level(), G.design);
    G.slots = computeSlots(level(), G.design);
    G.tor = QR.torsionOf(level(), G.design);
    updateHud();
  }
  // 문·창을 막은 항목들
  function blockedOpenings(design) {
    const lv = level(), out = new Set();
    (lv.openings || []).forEach(([i, j, kind]) => {
      const id = `${i},${j}`;
      const hit = design.some((d) => (isBay(d.tool) && d.tool !== 'slit' && d.i === i && d.j === j) ||
        (LINK.includes(d.tool) && blocksDoor({ ...lv, openings: [[i, j]] }, d.a, d.b)));
      if (hit) out.add(id + ',' + (kind || 'door'));
    });
    return [...out].map((s) => { const [i, j, k] = s.split(','); return { i: +i, j: +j, kind: k }; });
  }

  // ---------- 입력 ----------
  const P = (n) => nodePos(level(), n);
  function segDist(px, py, ax, ay, bx, by) {
    const dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy || 1e-9;
    let u = ((px - ax) * dx + (py - ay) * dy) / l2; u = Math.max(0, Math.min(1, u));
    return Math.hypot(px - (ax + u * dx), py - (ay + u * dy));
  }
  const pickR = (m) => Math.min(m * 2.2, Math.max(m, 24 / (S * ppm))); // m 미터, 그러나 손가락으로 24px 은 되게
  function nearJoint(x, y, r = pickR(0.42)) {
    let best = null, bd = r;
    for (const n of G.slots.joints) { const p = P(n); const d = Math.hypot(x - p[0], y - p[1]); if (d < bd) { bd = d; best = n; } }
    return best;
  }
  function nearPlaced(x, y, tool) {
    let best = -1, bd = 0.3;
    G.design.forEach((d, idx) => {
      if (d.tool !== tool) return;
      const [a, b] = [P(d.a), P(d.b)]; const dd = segDist(x, y, a[0], a[1], b[0], b[1]);
      if (dd < bd) { bd = dd; best = idx; }
    });
    return best;
  }
  function nearCol(x, y) {
    let best = null, bd = pickR(0.6);
    G.slots.cols.forEach((c) => { const [a, b] = [P(c.a), P(c.b)]; const d = segDist(x, y, a[0], a[1], b[0], b[1]); if (d < bd) { bd = d; best = c; } });
    return best;
  }
  function bayAt(x, y) {
    const lv = level();
    for (let i = 0; i < lv.xs.length - 1; i++) for (let j = 0; j < lv.ys.length - 1; j++)
      if (x > lv.xs[i] && x < lv.xs[i + 1] && y > lv.ys[j] && y < lv.ys[j + 1]) return [i, j];
    return null;
  }
  const REASON = {
    same: { en: 'Pick a different joint', ko: '다른 절점을 고르세요' },
    vertical: { en: 'A post must go straight up — pick a joint directly above or below', ko: '기둥은 똑바로 서야 해요 — 바로 위나 아래 절점을 고르세요' },
    horizontal: { en: 'A beam must be level — pick a joint at the same height', ko: '보는 수평이어야 해요 — 같은 높이 절점을 고르세요' },
    ground: { en: 'Beams go above ground', ko: '보는 땅 위에 놓아요' },
    dup: { en: 'There is already one there', ko: '거기엔 이미 있어요' },
    cross: { en: 'It cannot pass through a beam or post — split it at the joint into two pieces', ko: '보를 뚫고 지나갈 수 없어요 — 마디에서 끊어서 두 개로 넣으세요' },
    crossWall: { en: 'It cannot pass through a plywood wall', ko: '합판벽을 뚫고 지나갈 수 없어요' },
    throughNode: { en: 'It runs straight through a joint — split it there into two pieces', ko: '마디를 그냥 지나가요 — 거기서 끊어서 두 개로 넣으세요' },
  };
  function addItem(item) {
    const c = priceIt(item);
    if (c > money()) { QR.sfx.deny(); flashMoney(); showHint(t('nomoney')); return false; }
    G.design.push(item); QR.sfx.place();
    const bl = blockedOpenings([item]);
    if (bl.length) showHint(bl[0].kind === 'window' ? t('winBlocked') : t('doorBlocked'));
    rebuildPreview(); return true;
  }
  function removeAt(idx) { G.design.splice(idx, 1); revalidate(); QR.sfx.remove(); rebuildPreview(); }
  function tryLink(a, b) {
    const r = checkLink(level(), G.design, G.tool, a, b);
    if (r) { QR.sfx.deny(); showHint(L(REASON[r])); return; }
    addItem({ tool: G.tool, a, b });
  }
  function flashMoney() { const m = $('money'); m.classList.add('bad'); setTimeout(() => m.classList.remove('bad'), 450); }

  function onDown(x, y, mouse) {
    const tool = G.tool;
    if (LINK.includes(tool)) {
      const n = nearJoint(x, y);
      if (G.linkFrom) {
        const from = G.linkFrom; G.linkFrom = null;
        if (n && n !== from) { tryLink(from, n); return; }
        if (n === from) return; // 같은 점 다시 → 취소
      }
      if (n) { G.linkFrom = n; G.dragging = true; return; }
      const idx = nearPlaced(x, y, tool);
      if (idx >= 0) removeAt(idx);
    } else if (isBay(tool)) {
      const cell = bayAt(x, y); if (!cell) return;
      const idx = G.design.findIndex((d) => d.tool === tool && d.i === cell[0] && d.j === cell[1]);
      if (idx >= 0) return removeAt(idx);
      if (bayList(tool, G.slots).some((b) => b.i === cell[0] && b.j === cell[1])) addItem({ tool, i: cell[0], j: cell[1] });
      else { QR.sfx.deny(); showHint(t(toolDef(tool).slit ? 'noSlit' : 'noBay')); }
    } else if (isCol(tool)) {
      const c = nearCol(x, y); if (!c) return;
      const idx = G.design.findIndex((d) => d.tool === tool && d.a === c.a && d.b === c.b);
      if (idx >= 0) return removeAt(idx);
      addItem({ tool, a: c.a, b: c.b });
    } else if (tool === 'conn') {
      const n = nearJoint(x, y); if (!n) return;
      const idx = G.design.findIndex((d) => d.tool === 'conn' && d.n === n);
      if (idx >= 0) return removeAt(idx);
      if (G.slots.node.some((q) => q.n === n)) addItem({ tool: 'conn', n });
    }
  }
  function onUp(x, y) {
    if (!G.dragging) return; G.dragging = false;
    const n = nearJoint(x, y);
    if (G.linkFrom && n && n !== G.linkFrom) { const a = G.linkFrom; G.linkFrom = null; tryLink(a, n); }
    // 같은 점에서 뗐으면 누르기-누르기 방식으로 계속
  }

  // ---------- 지진 ----------
  function startQuake() {
    if (G.mode !== 'build') return;
    QR.sfx.init();
    G.world = new World(level(), G.design);
    G.world.settle();
    G.tor = QR.torsionOf(level(), G.design);
    G.quake = QR.quakeFor(level(), G.design, G.li); // 비틀림이 있으면 앞면이 더 세게 흔들림
    G.qmax = 1e-6; for (let tt = 0; tt < 10; tt += 0.02) G.qmax = Math.max(G.qmax, Math.abs(G.quake.x(tt)));
    $('hint').textContent = ''; hintTimer = 0;
    G.time = 0; G.mode = 'quake'; G.collapseAt = null; G.lastCount = 0; G.debris = []; G.dust = []; G.sparks = [];
    G.stats = { member: {}, why: {}, anchor: 0, plyUp: 0, joint: 0, braceT: 0, braceC: 0, impact: 0, first: null, infillOut: [], hinge: 0 };
    G.linkFrom = null; G.ptr = null;
    setBarEnabled(false);
    $('banner').textContent = t('shaking');
  }
  const H = 1 / 1200;
  function simFrame(dt) {
    const w = G.world, q = G.quake;
    const n = Math.min(48, Math.round(dt / H));
    for (let i = 0; i < n; i++) {
      w.step(H, q.x(G.time), q.v(G.time)); G.time += H;
      if (w.events.length) { w.events.forEach(onEvent); w.events.length = 0; }
    }
    const inten = q.intensity(G.time);
    QR.sfx.rumble(G.mode === 'quake' ? inten : 0);
    const m = w.measure();
    if (!G.collapseAt && (m.height < 0.75 || m.drift > 0.3)) {
      G.collapseAt = G.time; $('banner').textContent = t('crash'); $('count').classList.remove('pop'); $('count').textContent = ''; QR.sfx.crash(true); G.shake += 14;
    }
    if (G.collapseAt && G.time - G.collapseAt > 2.2) return finish(false, m);
    if (G.time >= q.dur && !G.collapseAt) {
      const c = Math.ceil(10 - G.time);
      if (c >= 1 && c !== G.lastCount) {
        G.lastCount = c; const el = $('count'); el.textContent = c; el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop');
        $('banner').textContent = t('hold'); QR.sfx.tick();
      }
    }
    if (G.time >= 10) finish(m.height > 0.85 && m.drift < 0.12 && !G.collapseAt, m);
  }
  function onEvent(e) {
    const w = G.world;
    if (e.type === 'member') {
      const m = w.members[e.mi];
      G.stats.member[m.type] = (G.stats.member[m.type] || 0) + 1; G.stats.why[e.mi] = e.why;
      if (m.type === 'brace') { if (e.why === 'tension' || e.why === 'pullout') G.stats.braceT++; else if (e.why === 'compression') G.stats.braceC++; }
      if (!G.stats.first && e.why !== 'impact') G.stats.first = { mi: e.mi, why: e.why, t: G.time };
      if (e.why === 'pullout') { spawnDebris(m, 1); spark(e.x, e.y); QR.sfx.snap(); G.shake += 3; } // 끝의 못이 뽑혀 통째로 빠짐(나무는 안 끊어짐)
      else { spawnDebris(m); puff(e.x, e.y, 10, 0.6); QR.sfx.crack(); G.shake += 5; }
      if (e.why === 'shear') { chunks(e.x, e.y, 8, '#b8b4ac'); puff(e.x, e.y, 18, 0.9); }
    } else if (e.type === 'crack') { // 접합부 실금 (조용히)
    } else if (e.type === 'yield') { puff(e.x, e.y, 3, 0.3);
    } else if (e.type === 'scrack') { chunks(e.x, e.y, e.lvl > 1 ? 3 : 1, '#b8b4ac'); puff(e.x, e.y, e.lvl > 1 ? 5 : 2, 0.4); if (e.lvl > 1) QR.sfx.creak();
    } else if (e.type === 'infillCrack') { chunks(e.x, e.y, 2, '#c98b6b'); puff(e.x, e.y, 3, 0.4);
    } else if (e.type === 'infillChip') { chunks(e.x, e.y, 2, '#c98b6b');
    } else if (e.type === 'infillOut') { // 벽돌 칸이 통째로 빠져 떨어짐
      G.stats.infillOut.push({ group: e.group, t: G.time }); if (!G.stats.first) G.stats.first = { infill: e.group, t: G.time };
      chunks(e.x, e.y, 26, '#c98b6b', 1.4); puff(e.x, e.y, 22, 1.4); QR.sfx.crack(); G.shake += 6;
    } else if (e.type === 'joint') {
      if (e.why === 'hinge') { G.stats.hinge++; chunks(e.x, e.y, 3, '#b8b4ac'); }
      G.stats.joint++; QR.sfx.snap(); if (Math.random() < 0.5) QR.sfx.creak(); spark(e.x, e.y);
    } else if (e.type === 'buckle') {
      QR.sfx.creak(); spark(e.x, e.y);
    } else if (e.type === 'anchor') {
      G.stats.anchor++; if (e.plyEnd) G.stats.plyUp++; QR.sfx.clank(); puff(e.x, 0, 8, 0.5); G.shake += 3;
    } else if (e.type === 'impact') {
      G.stats.impact++; QR.sfx.crash(e.v > 6); puff(e.x, 0, 16, 1); G.shake += Math.min(10, e.v);
    }
  }
  // 작은 조각(벽돌·콘크리트 부스러기)
  function chunks(x, y, n, color, s = 0.6) {
    for (let k = 0; k < n; k++) {
      if (G.debris.length > 220) G.debris.shift();
      G.debris.push({ chunk: true, x: x + (Math.random() - 0.5) * s, y: y + (Math.random() - 0.5) * s, vx: (Math.random() - 0.5) * 2.4, vy: Math.random() * 1.2, a: Math.random() * 3, w: (Math.random() - 0.5) * 10,
        len: 0.08 + Math.random() * 0.14, width: 0.06 + Math.random() * 0.06, color });
    }
  }
  function spawnDebris(m, whole) {
    const w = G.world;
    const ax = w.x[m.ia], ay = w.y[m.ia], bx = w.x[m.ib], by = w.y[m.ib];
    const e = mat().elements[m.type];
    const vx = (w.vx[m.ia] + w.vx[m.ib]) / 2, vy = (w.vy[m.ia] + w.vy[m.ib]) / 2;
    const pieces = whole ? 1 : m.type === 'ply' ? 3 : 2;
    for (let k = 0; k < pieces; k++) {
      const u0 = k / pieces, u1 = (k + 1) / pieces;
      const x1 = ax + (bx - ax) * u0, y1 = ay + (by - ay) * u0, x2 = ax + (bx - ax) * u1, y2 = ay + (by - ay) * u1;
      if (G.debris.length > 220) G.debris.shift();
      G.debris.push({ x: (x1 + x2) / 2, y: (y1 + y2) / 2, a: Math.atan2(y2 - y1, x2 - x1), len: Math.hypot(x2 - x1, y2 - y1) * 0.95,
        vx: vx + (Math.random() - 0.5) * 2.5, vy: vy + Math.random() * 2, w: (Math.random() - 0.5) * 8,
        width: Math.max(0.06, e.width || 0.08), color: e.color, dark: e.dark, ply: m.type === 'ply' });
    }
  }
  function puff(x, y, n, s) {
    for (let k = 0; k < n; k++) G.dust.push({ x: x + (Math.random() - 0.5) * s, y: y + Math.random() * 0.3, vx: (Math.random() - 0.5) * 2.4 * s, vy: Math.random() * 1.5 * s, life: 1, r: 0.12 + Math.random() * 0.2 });
    if (G.dust.length > 400) G.dust.splice(0, G.dust.length - 400);
  }
  function spark(x, y) { for (let k = 0; k < 6; k++) G.sparks.push({ x, y, vx: (Math.random() - 0.5) * 5, vy: Math.random() * 4, life: 0.4 }); }
  function updateFx(dt) {
    const gx = G.world ? G.world.gx : 0;
    for (const d of G.debris) {
      d.vy -= 9.81 * dt; d.x += d.vx * dt; d.y += d.vy * dt; d.a += d.w * dt;
      const low = d.y - Math.abs(Math.sin(d.a)) * d.len / 2 - d.width / 2;
      if (low < -0.2) { d.y += -0.2 - low; if (d.vy < 0) d.vy *= -0.25; d.vx *= 0.8; d.w *= 0.6;
        // 눕히기
        const target = Math.round(d.a / Math.PI) * Math.PI; d.a += (target - d.a) * 0.08; }
    }
    for (const p of G.dust) { p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.97; p.vy *= 0.97; p.life -= dt * 0.55; p.r += dt * 0.5; }
    G.dust = G.dust.filter((p) => p.life > 0);
    for (const p of G.sparks) { p.vy -= 9.81 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; }
    G.sparks = G.sparks.filter((p) => p.life > 0);
    G.shake *= Math.pow(0.02, dt);
    void gx;
  }

  // ---------- 결과 ----------
  function finish(ok, m) {
    if (G.mode !== 'quake') return;
    G.mode = 'result'; QR.sfx.rumble(0); CG.gameplayStop();
    $('banner').textContent = '';
    const lv = level();
    let damage = Math.min(100, m.brokenFrac * 160 + m.drift * 300);
    if (!ok) damage = Math.max(damage, 85);
    damage = Math.round(damage);
    const left = money(), frac = left / lv.budget;
    const blocked = blockedOpenings(G.design);
    let stars = 0;
    const refCost = QR.solutionCost(lv);
    stars = QR.starsFor({ ok, cost: spent(), refCost, damage, blocked: blocked.length > 0, hard: lv.mode === 'hard' });
    if (ok && globalThis.QRHUB) QRHUB.markClear('2d', G.li + 1);
    if (ok) { QR.sfx.win(); progress.stars[G.li] = Math.max(progress.stars[G.li] || 0, stars); progress.unlocked = Math.max(progress.unlocked, Math.min(QR.LEVELS.length, G.li + 2)); save(); }
    else QR.sfx.lose();
    G.result = { ok, damage, left, stars, blocked: blocked.length };
    $('rTitle').textContent = ok ? t('win') : t('lose');
    $('rTitle').style.color = ok ? 'var(--ok)' : 'var(--accent)';
    $('rStars').innerHTML = [0, 1, 2].map((k) => (k < stars ? '<b>★</b>' : '★')).join('');
    $('rStats').innerHTML = `<div>${t('damage')}<b>${damage}%</b></div><div>${t('spentLbl')}<b>${won(spent(), G.design.reduce((a, d) => a + usdOf(QR.priceOf(lv, d)), 0))}</b></div><div>${t('refLbl')}<b>${won(refCost, lv.solution.map(QR.parseItem).reduce((a, d) => a + usdOf(QR.priceOf(lv, d)), 0))}</b></div>` +
      (blocked.length ? `<div style="color:#b3261e">${blocked[0].kind === 'window' ? t('winBlocked') : t('doorBlocked')}<b>−1★</b></div>` : '');
    G.result.tipKey = tipFor(ok, damage, blocked);
    $('rTip').textContent = G.result.tip;
    $('rRetry').textContent = ok ? t('again') : t('retry');
    const last = G.li >= QR.LEVELS.length - 1 || !QR.LEVELS[G.li + 1] || QR.LEVELS[G.li + 1].mode !== lv.mode;
    $('rNext').style.display = ok && (last || levelOpen(G.li + 1)) ? '' : 'none';
    $('rNext').textContent = last ? t('allclear') : t('next');
    $('rNext').disabled = last;
    // 통합판: 장의 마지막 판을 깨면 허브로 가는 단추
    const ce = ok && globalThis.QRHUB ? QRHUB.chapterEnd('2d', G.li + 1) : null;
    $('rHubMsg').style.display = ce ? 'block' : 'none';
    $('rHub').style.display = ce ? '' : 'none';
    if (ce) { $('rHubMsg').textContent = [!ce.hard && ce.hardOpen ? t('hardOpen') : '', ce.nextOpen ? t('chOpen') : t('chDone')].filter(Boolean).join(' '); $('rHub').textContent = t('toHub'); if (last) $('rNext').style.display = 'none'; }
    if (ok && (stars === 3 || ce)) CG.happytime(); // 별 3개·장 끝 = 기쁜 순간
    // 결과 창에서도 전체 단계(허브)로 갈 수 있게 (원래는 장 끝에서만 있었음). 장 끝이면 초록 '메뉴로' 단추가 대신함
    $('rMenu').style.display = ce ? 'none' : '';
    $('rEng').style.display = FIRST && G.li === 0 ? 'none' : '';
    setTimeout(() => $('result').classList.add('show'), ok ? 400 : 200);
    updateHud();
  }
  // 놓은 가새들의 생김새 분석
  function braceInfo() {
    const lv = level(), topY = Math.max(...lv.ys);
    return G.design.map((d, idx) => {
      if (d.tool !== 'brace') return null;
      const [a, b] = [P(d.a), P(d.b)];
      const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy);
      const ang = Math.abs(Math.atan2(Math.abs(dy), Math.abs(dx))) * 180 / Math.PI;
      const mem = G.world.members.filter((q) => q.item === idx);
      return { idx, len, ang, lean: Math.sign(dx * dy), roof: Math.min(a[1], b[1]) >= topY - 1e-6,
        buckled: mem.some((q) => q.buckled),
        loose: mem.some((q) => q.deg !== undefined && q.deg < 0.75) };
    }).filter(Boolean);
  }
  function tipFor(ok, damage, blocked) {
    const d = G.design, lv = level(), st = G.stats;
    const rowOf = (n) => +n.split(',')[1] || 0;
    const lateral = (j) => d.filter((x) => (isBay(x.tool) && x.j === j) || (x.tool === 'wing' && rowOf(x.a) === j) || (x.tool === 'brace' && Math.min(rowOf(x.a), rowOf(x.b)) === j)).length
      + (lv.walls || []).filter((w) => w[1] === j).length + (lv.braces || []).filter(([a, b]) => Math.min(rowOf(a), rowOf(b)) === j).length;
    const bi = braceInfo();
    const useful = bi.filter((b) => !b.roof && b.ang > 22 && b.ang < 72);
    const hasLat = useful.length > 0 || d.some((x) => isBay(x.tool));
    const onlyPosts = d.length > 0 && d.every((x) => x.tool === 'post' || x.tool === 'beam' || x.tool === 'conn');
    const dirs = new Set(useful.map((b) => b.lean));
    // 보강(가새·벽)이 1층 칸들 중 한쪽 절반에만 몰렸나
    const oneSided = () => {
      const nb = lv.xs.length - 1; if (nb < 3) return false;
      const cols = [];
      d.forEach((x) => { if (isBay(x.tool) && x.j === 0) cols.push(x.i); if (x.tool === 'brace' && Math.min(rowOf(x.a), rowOf(x.b)) === 0) cols.push(Math.min(+x.a.split(',')[0], +x.b.split(',')[0])); });
      (lv.walls || []).forEach(([i, j]) => { if (j === 0) cols.push(i); });
      (lv.braces || []).forEach(([a, b]) => { if (Math.min(rowOf(a), rowOf(b)) === 0) cols.push(Math.min(+a.split(',')[0], +b.split(',')[0])); });
      if (!cols.length) return false;
      const mid = (nb - 1) / 2;
      return cols.every((c) => c < mid) || cols.every((c) => c > mid);
    };
    const T = {
      soft: (QR.CONCEPTS.find((c) => c.id === 'wood4') || {}).lesson,
      long: { en: 'The long brace was squashed and bowed sideways (buckled). Braces work best short and diagonal — one bay each, not across the whole house.', ko: '긴 가새가 눌려 휘었어요(좌굴). 가새는 짧게, 한 칸씩 대각선으로 넣어야 잘 버팁니다.' },
      roof: { en: 'Bracing the roof does not help the walls — the roof truss is already a triangle. The walls below need it.', ko: '지붕 안의 가새는 벽을 못 도와요 — 지붕틀은 이미 삼각형입니다. 아래 벽에 넣으세요.' },
      flat: { en: 'A nearly flat (or upright) brace barely resists sway. Braces near 45° work best.', ko: '거의 눕거나 선 가새는 흔들림을 거의 못 막아요. 45° 쯤이 제일 잘 버팁니다.' },
      oneDir: { en: 'Braces only in one direction: they hold one way, then buckle or pull out the other way. Add the opposite diagonal.', ko: '가새가 한 방향뿐: 한쪽으론 버티지만 반대쪽으론 휘거나 빠집니다. 반대 대각선도 넣으세요.' },
      oneSide: { en: 'Stiffen only one side and the force piles up there — the weak bay fails first. Spread the bracing.', ko: '한쪽만 단단히 잡으면 힘이 몰리고, 약한 칸이 먼저 무너집니다. 고르게 나눠 보강하세요.' },
      loose: { en: 'Big quakes: braces loosen with every swing — plywood walls hold better.', ko: '큰 지진엔 가새가 흔들릴 때마다 헐거워집니다 — 합판벽이 더 잘 버텨요.' },
      posts: { en: 'Extra posts and plates carry weight, but do little against sideways shaking. Lateral force needs diagonals or walls.', ko: '기둥·철물만으로는 무게는 받아도 옆 흔들림엔 별 도움이 안 됩니다. 옆 힘은 대각선이나 벽이 받습니다.' },
      none: { en: 'Posts and beams alone barely resist sideways shaking — the joints just rotate. Make triangles: braces or plywood walls.', ko: '기둥과 보만으로는 옆 흔들림을 거의 못 막습니다 — 접합부가 돌아가 버려요. 가새나 합판벽으로 삼각형을 만드세요.' },
      plyHold: { en: 'The plywood wall rocked like one stiff panel and yanked its end post up out of the foundation. Plywood walls need hold-downs under the posts at BOTH ends.', ko: '합판벽은 양 끝 기둥 밑을 홀다운으로 잡아야 들리지 않아요. 합판벽이 한 판처럼 들썩이며 끝 기둥을 기초에서 뽑아 올렸습니다.' },
      uplift: { en: 'A post base was yanked out of the foundation. Braced walls pull up hard at their ends — add a hold-down (metal connector) there.', ko: '기둥 밑동이 기초에서 뽑혔습니다. 가새·벽 끝은 위로 세게 당겨져요 — 거기에 홀다운 철물을 다세요.' },
      pull: { en: 'The nails at a brace end pulled out (the wood itself is very strong in tension — the joint gave). Metal connectors at both brace ends hold far more.', ko: '가새 끝 못이 뽑혔어요 (나무 자체는 당기는 힘에 아주 셉니다 — 약한 건 접합). 가새 양 끝을 철물로 보강하세요.' },
      joints: { en: 'Weak joints failed first. Spread braces or walls evenly and strengthen the joints around them.', ko: '약한 접합부부터 터졌습니다. 가새·벽을 고르게 나누고 그 주변 접합부를 철물로 보강하세요.' },
      door: { en: 'It stood — but you sealed the opening. Blocking an exit or window is a real-world mistake. Brace the solid bays instead.', ko: '버텼지만 문·창을 막았습니다. 출구를 막는 건 실제로도 큰 실수예요. 막힌 칸에 보강하세요.' },
      wasted: { en: 'It stood, but some braces did nothing (roof or flat ones). Spend that money on diagonals in the walls.', ko: '버텼지만 몇 가새는 일을 안 했어요(지붕 속, 누운 가새). 그 돈은 벽 대각선에 쓰세요.' },
      spend: { en: 'It stood, but with damage. Balance both directions and add connectors where things broke.', ko: '버텼지만 상처가 났습니다. 양방향 균형을 맞추고, 부서진 곳에 철물을 더하세요.' },
    };
    let k;
    if (lv.material === 'rc') {
      const W = G.world, why = G.stats.why;
      const rowOfM = (m) => Math.min(rowOf(W.names[m.ia]), rowOf(W.names[m.ib])) + 1; // 몇 층 부재인가
      const vertM = (m) => Math.abs(W.x0[m.ia] - W.x0[m.ib]) < 1e-6;
      const sh = Object.entries(why).filter(([, y]) => y === 'shear').map(([mi]) => W.members[mi]);
      const beamT = Object.entries(why).filter(([mi, y]) => y === 'tension' && W.members[mi].type === 'rbeam').map(([mi]) => W.members[mi]);
      const tor = G.tor || { tf: 1 };
      const twisted = lv.back && tor.tf > 1.12;
      const brickFirst = G.stats.first && G.stats.first.infill;
      // 어디가 먼저 부서졌나
      let where = '';
      const floorTxt = (n) => (KO ? `${n}층` : `story ${n}`);
      if (!ok) {
        if (sh.length) {
          const st = Math.min(...sh.map(rowOfM)), short = sh.some((m) => m.L0 < 2);
          const wallsAbove = (lv.walls || []).some((w2) => w2[1] === st) && !(lv.walls || []).some((w2) => w2[1] === st - 1) && st === 1;
          where = short ? (KO ? `${floorTxt(st)} 짧은 기둥 전단 파괴` : `short columns, ${floorTxt(st)}: shear failure`)
            : wallsAbove || (st === 1 && lateral(0) < lateral(1)) ? (KO ? `필로티 층(${floorTxt(st)}) 붕괴` : `soft/open ${floorTxt(st)} collapsed`)
            : (KO ? `${floorTxt(st)} 기둥 전단 파괴` : `${floorTxt(st)} columns: shear failure`);
        } else if (G.stats.hinge) where = KO ? '기둥-보 접합부가 힌지로 풀려 층이 접힘' : 'beam-column joints hinged and the story folded';
        else if (beamT.length) where = KO ? `${floorTxt(rowOfM(beamT[0]) - 1)} 보 겹침이음 풀림` : `${floorTxt(rowOfM(beamT[0]) - 1)} beam lap splice pulled apart`;
      }
      if (ok) k = blocked.length ? 'door' : damage >= 30 ? 'spend' : 'lesson';
      else if (twisted) k = 'twist';
      else if (lv.ys.length > 2 && lateral(0) < lateral(1)) k = 'soft';
      else if (sh.some((m) => m.L0 < 2)) k = 'shortcol';
      else if (brickFirst) k = 'brick';
      else if (sh.length) k = 'rcshear';
      else k = 'rcbrittle';
      const RT = {
        soft: { en: 'The open ground floor (piloti) took all the sway while the brick floors above stayed stiff — it folded. Brace or wall the ground floor.', ko: '위층은 벽돌로 단단한데 뚫린 1층(필로티)이 흔들림을 다 받아 접혔어요. 1층에 가새나 벽을 넣으세요.' },
        shortcol: { en: 'A short column split in shear — brick walls beside it left only a short stiff stub that took all the force. Wrap it, jacket it, or cut the brick free with a seismic slit.', ko: '짧은 기둥이 빗금으로 쪼개졌습니다 — 옆 벽돌벽 때문에 짧고 뻣뻣해져 힘을 다 받았어요. 감거나 키우거나, 내진 슬릿으로 벽돌을 떼어 내세요.' },
        rcshear: { en: 'The columns bent and cracked, then split in shear at the strongest shaking. Old columns have sparse ties — wrap or jacket them, or add a brace/wall so they sway less.', ko: '기둥이 휘며 금이 가다가 가장 센 흔들림에 빗금(전단)으로 깨졌어요. 옛 기둥은 띠철근이 성겨요 — 감거나 키우거나, 가새·벽으로 덜 흔들리게 하세요.' },
        brick: { en: 'The brick infill held at first, then cracked and fell out — and the force jumped onto the bare frame. Give the open part its own brace or wall.', ko: '벽돌벽이 처음엔 버티다 금이 가고 빠져 떨어졌어요 — 그러자 힘이 맨 골조로 넘어갔습니다. 열린 쪽에 가새나 벽을 따로 넣으세요.' },
        twist: { en: 'Brick on only one side (the back): the building twisted and the open front swung the most. Strengthen the front to balance it with the back.', ko: '벽돌이 한쪽(뒷면)에만 있어 건물이 비틀렸어요 — 열린 앞면이 가장 크게 흔들렸습니다. 앞면을 보강해 뒤와 균형을 맞추세요.' },
        rcbrittle: { en: 'The frame ran out of strength. Give the building a stiff path for sideways force: a steel X-brace or a shear wall, from the ground up.', ko: '골조가 힘이 다했어요. 옆 힘이 갈 단단한 길을 주세요: 철골 X가새나 전단벽을 땅부터.' },
        door: T.door, spend: T.spend,
      };
      const body = k === 'lesson' ? L(lv.lesson) : L(RT[k]);
      G.result.tip = where ? `${KO ? '무너진 곳' : 'Failed'}: ${where}. ${body}` : body;
      return k;
    }
    if (!ok) {
      if (lv.ys.length > 2 && lateral(0) < lateral(1)) k = 'soft';
      else if (bi.some((b) => b.buckled && b.len > 4.6)) k = 'long';
      else if (bi.length && !hasLat && bi.some((b) => b.roof)) k = 'roof';
      else if (bi.length && !hasLat) k = 'flat';
      else if (!hasLat && onlyPosts) k = 'posts';
      else if (!hasLat) k = 'none';
      else if (st.plyUp > 0) k = 'plyHold';
      else if (dirs.size === 1 && !d.some((x) => isBay(x.tool))) k = 'oneDir';
      else if (oneSided()) k = 'oneSide';
      else if (st.anchor > 0) k = 'uplift';
      else if (bi.some((b) => b.loose)) k = 'loose';
      else if (st.braceT > 0) k = 'pull';
      else k = 'joints';
    } else if (FIRST && G.li === 0) { k = blocked.length ? 'door' : 'lesson'; // 첫 판을 깨면 그 판의 교훈 한 줄
    } else {
      if (blocked.length) k = 'door';
      else if (bi.some((b) => b.roof || b.ang <= 22 || b.ang >= 72)) k = 'wasted';
      else if (st.plyUp > 0) k = 'plyHold';
      else if (damage >= 30) k = 'spend';
      else if (bi.some((b) => b.loose)) k = 'loose';
      else k = 'lesson';
    }
    G.result.tip = k === 'lesson' ? L(lv.lesson) : L(T[k]);
    return k;
  }

  // ---------- HUD ----------
  function svgIcon(id) {
    const wood = '#c98a4b', dk = '#6e441f';
    const frame = `<rect x="6" y="6" width="36" height="30" fill="none" stroke="${dk}" stroke-width="4"/>`;
    if (id === 'brace') return `<svg viewBox="0 0 48 42">${frame}<line x1="8" y1="34" x2="40" y2="8" stroke="${wood}" stroke-width="5" stroke-linecap="round"/></svg>`;
    const gy = '#9a968e', st = '#33475a';
    if (id === 'steelx') return `<svg viewBox="0 0 48 42"><rect x="6" y="6" width="36" height="30" fill="none" stroke="${gy}" stroke-width="5"/><path d="M8 34L40 8M8 8L40 34" stroke="${st}" stroke-width="4"/></svg>`;
    if (id === 'rcwall') return `<svg viewBox="0 0 48 42"><rect x="6" y="6" width="36" height="30" fill="#d6d3cc" stroke="${gy}" stroke-width="5"/><circle cx="16" cy="16" r="1.5" fill="${gy}"/><circle cx="30" cy="24" r="1.5" fill="${gy}"/><circle cx="22" cy="29" r="1.2" fill="${gy}"/></svg>`;
    if (id === 'jacket') return `<svg viewBox="0 0 48 42"><rect x="19" y="3" width="10" height="36" fill="#b8b4ac"/><rect x="15" y="9" width="18" height="24" fill="none" stroke="#4f4c47" stroke-width="4"/></svg>`;
    if (id === 'frp') return `<svg viewBox="0 0 48 42"><rect x="18" y="3" width="12" height="36" fill="#b8b4ac" stroke="${gy}" stroke-width="2"/><path d="M15 11h18M15 18h18M15 25h18M15 32h18" stroke="#1d1f22" stroke-width="3"/></svg>`;
    if (id === 'slit') return `<svg viewBox="0 0 48 42"><rect x="4" y="3" width="8" height="36" fill="#b8b4ac" stroke="${gy}" stroke-width="2"/><rect x="36" y="3" width="8" height="36" fill="#b8b4ac" stroke="${gy}" stroke-width="2"/><rect x="15" y="18" width="18" height="21" fill="#c98b6b" stroke="#8f5b42" stroke-width="2"/><path d="M13.5 16v24M34.5 16v24" stroke="#2b2118" stroke-width="2" stroke-dasharray="3 2"/></svg>`;
    if (id === 'wing') return `<svg viewBox="0 0 48 42"><rect x="14" y="3" width="10" height="36" fill="#b8b4ac" stroke="${gy}" stroke-width="2"/><rect x="24" y="3" width="12" height="36" fill="#d6d3cc" stroke="${gy}" stroke-width="2"/></svg>`;
    if (id === 'wall') return `<svg viewBox="0 0 48 42"><rect x="6" y="6" width="36" height="30" fill="#e9c98d" stroke="${dk}" stroke-width="4"/><path d="M12 12h24M12 20h24M12 28h24" stroke="#c9a76a" stroke-width="2"/></svg>`;
    if (id === 'post') return `<svg viewBox="0 0 48 42"><line x1="4" y1="7" x2="44" y2="7" stroke="${dk}" stroke-width="5"/><rect x="19" y="8" width="10" height="30" fill="${wood}" stroke="${dk}" stroke-width="2"/></svg>`;
    if (id === 'beam') return `<svg viewBox="0 0 48 42"><line x1="8" y1="4" x2="8" y2="40" stroke="${dk}" stroke-width="5"/><line x1="40" y1="4" x2="40" y2="40" stroke="${dk}" stroke-width="5"/><rect x="9" y="16" width="30" height="10" fill="${wood}" stroke="${dk}" stroke-width="2"/></svg>`;
    return `<svg viewBox="0 0 48 42"><line x1="24" y1="2" x2="24" y2="40" stroke="${wood}" stroke-width="8"/><line x1="4" y1="14" x2="44" y2="14" stroke="${wood}" stroke-width="8"/><rect x="12" y="4" width="24" height="22" rx="3" fill="#7d8a96" stroke="#3d4650" stroke-width="2"/><circle cx="18" cy="10" r="2.4" fill="#2c333a"/><circle cx="30" cy="10" r="2.4" fill="#2c333a"/><circle cx="18" cy="20" r="2.4" fill="#2c333a"/><circle cx="30" cy="20" r="2.4" fill="#2c333a"/></svg>`;
  }
  function buildUi() {
    document.documentElement.lang = KO ? 'ko' : 'en';
    document.title = t('title');
    $('tTitle').textContent = t('title'); $('tSub').textContent = t('sub'); $('tTap').textContent = t('tap');
    $('undo').title = t('undo'); setUndoLabel(); $('reset').textContent = t('reset'); $('go').textContent = t('go');
    buildTools();
    $('undo').onclick = () => { if (G.mode !== 'build' || !G.design.length) return; G.design.pop(); revalidate(); QR.sfx.remove(); rebuildPreview(); };
    $('reset').onclick = () => { if (G.mode !== 'build') return; G.design = []; QR.sfx.remove(); rebuildPreview(); };
    $('go').onclick = startQuake;
    $('rebarBtn').onclick = toggleRebar;
    $('snd').onclick = () => { QR.sfx.init(); $('snd').textContent = QR.sfx.toggle() ? '🔇' : '🔊'; };
    $('rRetry').onclick = () => { $('result').classList.remove('show'); toBuild(); };
    $('rEng').onclick = openEngineer; $('rEng').textContent = t('engBtn');
    $('rNext').onclick = () => { $('result').classList.remove('show'); loadLevel(G.li + 1); };
    $('pickClose').onclick = () => { $('picker').classList.remove('show'); if (G.mode === 'build') CG.gameplayStart(); };
    $('pickTitle').textContent = t('pick');
    $('menuBtn').textContent = t('menu');
    $('rHub').onclick = () => CG.go('../index.html');
    $('rMenu').onclick = () => CG.go('../index.html'); $('rMenu').textContent = t('allLv');
    $('menuBtn').addEventListener('click', (e) => { e.preventDefault(); CG.go('../index.html'); });
    $('rotTxt').textContent = t('rot');
    CG.onMute((m) => { QR.sfx.setExt(m); $('snd').textContent = QR.sfx.muted ? '🔇' : '🔊'; });
    $('title').addEventListener('pointerdown', (e) => { e.preventDefault(); QR.sfx.init(); $('title').style.display = 'none'; G.mode = 'build'; CG.gameplayStart(); updateHud(); });
  }
  function buildTools() {
    const tools = $('tools'); tools.innerHTML = '';
    toolsHere().forEach((tl) => {
      const b = document.createElement('button'); b.className = 'tool'; b.dataset.tool = tl.id;
      b.innerHTML = svgIcon(tl.id) + `<span class="nm">${L(tl.name)}</span><span class="cs">${unitTxt(tl.id)}</span>`;
      b.onclick = () => { setTool(tl.id); };
      tools.appendChild(b);
    });
    if (!toolsHere().some((t) => t.id === G.tool)) G.tool = toolsHere()[0].id;
  }
  function setUndoLabel() { if (G.compact) $('undo').innerHTML = '<svg viewBox="0 0 24 24" width="46" height="46" style="display:block"><path d="M9 7H4V2M4.6 7A9 9 0 1 1 3 13" fill="none" stroke="#2b2118" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>'; else $('undo').textContent = t('undo'); }
  function toggleRebar() { G.rebar = !G.rebar; updateHud(); }
  function setTool(id) { G.tool = id; G.linkFrom = null; QR.sfx.init(); updateHud(); if (!coachStep()) showHint(L(toolDef(id).hint)); }
  let hintTimer = 0;
  function showHint(s) { $('hint').textContent = s; hintTimer = 3.5; }
  function setBarEnabled(on) { document.querySelectorAll('#bar button').forEach((b) => (b.disabled = !on)); }
  function updateHud() {
    const lv = level();
    $('brand').innerHTML = `${t('title')}<small>${L(lv.tag)} ${t('lvl')} ${lv.num} · ${L(mat().name)} · ${L(lv.name)} (${L(lv.tag)}) · ${t('quakeStr')} ${lv.pga.toFixed(2)}g</small>`;
    $('money').innerHTML = `<small>${t('budget')}</small>${wonLeft()}`;
    const lvEl = $('levels'); lvEl.innerHTML = '';
    const pb = document.createElement('button'); pb.className = 'lv on'; pb.id = 'pickBtn';
    pb.innerHTML = `${L(lv.tag)} ${t('lvl')} ${lv.num} / 20 ▾`; pb.disabled = G.mode === 'quake';
    pb.onclick = openPicker; lvEl.appendChild(pb);
    document.querySelectorAll('.tool').forEach((b) => b.classList.toggle('on', b.dataset.tool === G.tool));
    const rb = $('rebarBtn'); rb.style.display = lv.material === 'rc' ? '' : 'none'; rb.textContent = t('rebar'); rb.classList.toggle('on', !!G.rebar);
  }
  // 판 열림: 장이 열렸고(허브), 어려움이면 그 장 쉬움을 다 깼고, 장 안에서는 앞 판을 깼어야 함 (?unlock=all 이면 모두)
  const FORCE = new URLSearchParams(location.search).get('unlock') === 'all';
  const clearedLv = (i) => (progress.stars[i] || 0) > 0 || (globalThis.QRHUB ? QRHUB.cleared('2d', i + 1) : false);
  function levelOpen(i) {
    if (FORCE || i === G.li) return true;
    if (globalThis.QRHUB && !QRHUB.isOpen('2d', i + 1)) return false;
    return i % 10 === 0 || clearedLv(i - 1);
  }
  const hardOpenAny = () => FORCE || !globalThis.QRHUB || QRHUB.summary().some((c) => c.game === '2d' && c.hardOpen);
  let pickHard = false;
  function openPicker(hardView) {
    if (G.mode === 'quake') return;
    CG.gameplayStop();
    pickHard = typeof hardView === 'boolean' ? hardView : level().mode === 'hard';
    const grid = $('pickGrid'); grid.innerHTML = '';
    // 쉬움 / 어려움 고르기
    const tg = document.createElement('div'); tg.className = 'modes';
    [false, true].forEach((h) => {
      const b = document.createElement('button'); const locked = h && !hardOpenAny();
      b.className = 'lv modebtn' + (pickHard === h ? ' on' : ''); b.dataset.mode = h ? 'hard' : 'easy';
      b.textContent = (h ? t('hard') : t('easy')) + (locked ? ' 🔒' : '');
      b.title = locked ? t('hardLock') : '';
      b.onclick = () => { if (locked) { showHint(t('hardLock')); return; } openPicker(h); };
      tg.appendChild(b);
    });
    grid.appendChild(tg);
    QR.LEVELS.forEach((x, i) => {
      if ((x.mode === 'hard') !== pickHard) return;
      const b = document.createElement('button'); b.className = 'lv' + (i === G.li ? ' on' : '') + (x.material === 'rc' ? ' rc' : '') + (pickHard ? ' hard' : '');
      const st = progress.stars[i] || 0, open = levelOpen(i);
      b.dataset.n = i + 1;
      b.innerHTML = `<b>${open ? x.num : '🔒'}</b><span class="nm">${L(x.name)}</span><span class="st">${'★'.repeat(st)}${'☆'.repeat(3 - st)}</span>`;
      b.disabled = !open;
      b.onclick = () => { $('picker').classList.remove('show'); $('result').classList.remove('show'); loadLevel(i); };
      grid.appendChild(b);
    });
    if (pickHard && !hardOpenAny()) { const m = document.createElement('div'); m.className = 'lockmsg'; m.textContent = t('hardLock'); grid.appendChild(m); }
    $('picker').classList.add('show');
  }
  function toBuild() {
    CG.gameplayStart();
    G.mode = 'build'; G.debris = []; G.dust = []; G.sparks = []; $('count').textContent = ''; $('banner').textContent = '';
    setBarEnabled(true); rebuildPreview();
  }
  function loadLevel(i) {
    ['result', 'picker'].forEach((id) => $(id).classList.remove('show')); $('eng').classList.remove('show');
    const matChanged = !QR.LEVELS[G.li] || QR.LEVELS[G.li].material !== QR.LEVELS[i].material || !$('tools').children.length;
    G.li = i; G.design = []; G.linkFrom = null; if (matChanged) buildTools(); layoutLevel(); toBuild(); coachK = null;
    if (!(FIRST && i === 0)) showHint(L(toolDef(G.tool).hint));
    try { localStorage.setItem('qr-last', String(i)); } catch (e) {}
    if (globalThis.QRHUB) QRHUB.setLast('2d', i + 1);
  }

  // ---------- 그리기 ----------
  function mix(c1, c2, u) {
    const p = (c) => [1, 3, 5].map((k) => parseInt(c.slice(k, k + 2), 16));
    const a = p(c1), b = p(c2);
    return `rgb(${a.map((v, k) => Math.round(v + (b[k] - v) * u)).join(',')})`;
  }
  function drawBg() {
    const lk = mat().looks;
    const g = ctx.createLinearGradient(0, 0, 0, GY);
    g.addColorStop(0, lk.sky1); g.addColorStop(1, lk.sky2);
    ctx.fillStyle = g; ctx.fillRect(-50, -50, 1700, 1000);
    // 먼 언덕
    ctx.fillStyle = '#cfe6c8';
    ctx.beginPath(); ctx.moveTo(-50, GY - 60);
    for (let x = -50; x <= 1650; x += 50) ctx.lineTo(x, GY - 90 - 40 * Math.sin(x / 210) - 25 * Math.sin(x / 77));
    ctx.lineTo(1650, GY + 20); ctx.lineTo(-50, GY + 20); ctx.fill();
    // 구름
    ctx.fillStyle = 'rgba(255,255,255,.85)';
    [[230, 150, 1], [1250, 120, 1.3], [820, 210, 0.8]].forEach(([x, y, s]) => {
      ctx.beginPath(); ctx.arc(x, y, 34 * s, 0, 7); ctx.arc(x + 40 * s, y - 14 * s, 42 * s, 0, 7); ctx.arc(x + 86 * s, y, 32 * s, 0, 7); ctx.fill();
    });
  }
  function drawGround(gx) {
    const off = gx * ppm, lv = level();
    const pts = baseList(lv).map((n) => P(n)).sort((p, q) => p[0] - q[0]);
    const line = [[-60, pts[0][1]], ...pts, [(2000 - ox) / ppm + 10, pts[pts.length - 1][1]]];
    const X = (x) => sx(x) + off, Y = (y) => sy(y - 0.2);
    const g = ctx.createLinearGradient(0, Y(Math.max(...pts.map((p) => p[1]))), 0, 900);
    g.addColorStop(0, '#8a6a45'); g.addColorStop(1, '#5e4630');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-60, 960);
    line.forEach(([x, y], i) => ctx.lineTo(i === 0 ? -60 : i === line.length - 1 ? 2000 : X(x), Y(y)));
    ctx.lineTo(2000, 960); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#7fb069'; ctx.lineWidth = 12; ctx.lineJoin = 'round'; ctx.beginPath();
    line.forEach(([x, y], i) => { const px = i === 0 ? -60 : i === line.length - 1 ? 2000 : X(x); i ? ctx.lineTo(px, Y(y)) : ctx.moveTo(px, Y(y)); }); ctx.stroke();
    // 기초: 기초 절점마다 받침 + 이웃끼리 잇는 띠
    ctx.fillStyle = '#b9b3a8'; ctx.strokeStyle = '#9d968a'; ctx.lineWidth = 2;
    for (let i = 0; i < pts.length; i++) {
      const [x, y] = pts[i];
      const xl = i === 0 ? x - 0.25 : x, xr = i === pts.length - 1 ? x + 0.25 : pts[i + 1][0], yr = i === pts.length - 1 ? y : pts[i + 1][1];
      ctx.beginPath(); ctx.moveTo(X(xl), sy(y)); ctx.lineTo(X(xr), sy(yr)); ctx.lineTo(X(xr), sy(yr) + 0.32 * ppm); ctx.lineTo(X(xl), sy(y) + 0.32 * ppm); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillRect(X(x) - 0.25 * ppm, sy(y), 0.5 * ppm, 0.36 * ppm);
    }
  }
  function memberColor(m, e) {
    if (G.mode !== 'build' && m.crk !== undefined) { // RC: 금이 갈수록 칙칙하게, 한계에 가까우면 붉게
      const p = (c) => [1, 3, 5].map((k) => parseInt(c.slice(k, k + 2), 16)), d = p('#8f8373'), r = p('#e8322b');
      let a = p(e.color); const u1 = Math.min(1, m.crk * 0.8); a = a.map((v, k) => v + (d[k] - v) * u1);
      if (m.vr > 0.6) { const u2 = Math.min(0.7, (m.vr - 0.6) * 1.5); a = a.map((v, k) => v + (r[k] - v) * u2); }
      return `rgb(${a.map(Math.round).join(',')})`;
    }
    if (G.mode === 'build' || m.util < 0.35) return e.color;
    return mix(e.color, '#e8322b', Math.min(1, (m.util - 0.35) / 0.6));
  }
  function stick(ax, ay, bx, by, wpx, col, dark) {
    ctx.lineCap = 'round';
    ctx.strokeStyle = dark; ctx.lineWidth = wpx + 3; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
    ctx.strokeStyle = col; ctx.lineWidth = wpx; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
    // 나뭇결
    ctx.strokeStyle = 'rgba(255,255,255,.22)'; ctx.lineWidth = Math.max(1, wpx * 0.18);
    const dx = bx - ax, dy = by - ay, l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l, o = wpx * 0.22;
    ctx.beginPath(); ctx.moveTo(ax + nx * o, ay + ny * o); ctx.lineTo(bx + nx * o, by + ny * o); ctx.stroke();
  }
  function drawWorld() {
    const w = G.world, lv = level(), m = mat();
    const X = (k) => sx(w.x[k]), Y = (k) => sy(w.y[k]);
    // 내진 슬릿으로 뗀 벽돌: 무게만 있고 구조로는 안 일함 — 기둥 옆에 틈(점선)
    G.design.forEach((d) => {
      if (d.tool !== 'slit') return;
      const c = cellCorners(d.i, d.j).map((n) => w.idx[n]); if (c.some((k) => k === undefined)) return;
      const g = 0.07 * ppm, q = [[X(c[0]) + g, Y(c[0])], [X(c[1]) - g, Y(c[1])], [X(c[3]) - g, Y(c[3])], [X(c[2]) + g, Y(c[2])]];
      ctx.fillStyle = '#c98b6b'; ctx.beginPath(); q.forEach((p, k) => (k ? ctx.lineTo(...p) : ctx.moveTo(...p))); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(120,60,40,.45)'; ctx.lineWidth = 2;
      for (let u = 0.125; u < 1; u += 0.125) { ctx.beginPath(); ctx.moveTo(q[0][0] + (q[3][0] - q[0][0]) * u, q[0][1] + (q[3][1] - q[0][1]) * u); ctx.lineTo(q[1][0] + (q[2][0] - q[1][0]) * u, q[1][1] + (q[2][1] - q[1][1]) * u); ctx.stroke(); }
      ctx.strokeStyle = '#2b2118'; ctx.lineWidth = 2; ctx.setLineDash([5, 4]);
      [[q[0], q[3]], [q[1], q[2]]].forEach(([p1, p2]) => { ctx.beginPath(); ctx.moveTo(...p1); ctx.lineTo(...p2); ctx.stroke(); });
      ctx.setLineDash([]);
    });
    // 합판벽
    const groups = {};
    w.members.forEach((mm) => { if (mm.group) (groups[mm.group] = groups[mm.group] || []).push(mm); });
    Object.entries(groups).forEach(([gname, ms]) => {
      const alive = ms.filter((q) => !q.broken).length;
      if (!alive) return;
      const [i, j] = gname.slice(1).split(',').map(Number);
      const c = cellCorners(i, j).map((n) => w.idx[n]);
      const quad = [c[0], c[1], c[3], c[2]];
      const util = Math.max(...ms.map((q) => (q.broken ? 0 : q.util)));
      const pe = m.elements[ms[0].type]; if (pe.role !== 'panel') return; // 철골 X가새는 부재로 그림
      ctx.fillStyle = G.mode === 'build' || util < 0.35 ? pe.color : mix(pe.color, '#f07a5a', Math.min(1, (util - 0.35) / 0.6));
      ctx.globalAlpha = alive === 2 ? 1 : 0.6;
      ctx.beginPath(); quad.forEach((k, s) => (s ? ctx.lineTo(X(k), Y(k)) : ctx.moveTo(X(k), Y(k)))); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = ms[0].type === 'brk' ? 'rgba(120,60,40,.45)' : ms[0].type === 'rcw' ? 'rgba(120,120,120,.25)' : 'rgba(150,110,60,.35)'; ctx.lineWidth = 2;
      for (let u = ms[0].type === 'brk' ? 0.125 : 0.2; u < 1; u += ms[0].type === 'brk' ? 0.125 : 0.2) {
        const lx = X(c[0]) + (X(c[2]) - X(c[0])) * u, ly = Y(c[0]) + (Y(c[2]) - Y(c[0])) * u;
        const rx = X(c[1]) + (X(c[3]) - X(c[1])) * u, ry = Y(c[1]) + (Y(c[3]) - Y(c[1])) * u;
        ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(rx, ry); ctx.stroke();
      }
      ctx.fillStyle = '#6b5a45';
      if (ms[0].type === 'brk' && G.mode !== 'build') drawBrickDamage(c, ms, gname);
      if (ms[0].type === 'rcw' && G.rebar) drawMesh(c.map((k) => [X(k), Y(k)]), 7, 7);
      if (ms[0].type === 'ply') quad.forEach((k, s) => { const k2 = quad[(s + 1) % 4]; for (let u = 0.1; u < 1; u += 0.2) { ctx.beginPath(); ctx.arc(X(k) + (X(k2) - X(k)) * u, Y(k) + (Y(k2) - Y(k)) * u, 1.6, 0, 7); ctx.fill(); } });
      if (alive < 2) { ctx.strokeStyle = '#5a3a1a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(X(c[0]) + 10, Y(c[0]) - 10); ctx.lineTo((X(c[0]) + X(c[3])) / 2 + 8, (Y(c[0]) + Y(c[3])) / 2); ctx.lineTo(X(c[3]) - 10, Y(c[3]) + 12); ctx.stroke(); }
      ctx.globalAlpha = 1;
    });
    // 지붕 기와(장식) — 서까래를 따라
    w.members.forEach((mm) => {
      if (mm.broken || mm.type !== 'rafter') return;
      let a = mm.ia, b = mm.ib; if (w.y[a] > w.y[b]) [a, b] = [b, a]; // a=처마, b=용마루
      const ax = X(a), ay = Y(a), bx = X(b), by = Y(b);
      const dx = bx - ax, dy = by - ay, l = Math.hypot(dx, dy), ux = dx / l, uy = dy / l;
      const nx = uy, ny = -ux; const side = nx * 0 + (ny < 0 ? 1 : -1);
      const th = 0.32 * ppm, ov = 0.6 * ppm;
      const p0x = ax - ux * ov, p0y = ay - uy * ov;
      ctx.fillStyle = '#5b6b7a'; ctx.strokeStyle = '#3c4955'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(p0x, p0y); ctx.lineTo(bx, by); ctx.lineTo(bx + nx * th * side, by + ny * th * side); ctx.lineTo(p0x + nx * th * side, p0y + ny * th * side); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,.18)';
      for (let u = 0.08; u < 1; u += 0.08) { const qx = p0x + (bx - p0x) * u, qy = p0y + (by - p0y) * u; ctx.beginPath(); ctx.moveTo(qx, qy); ctx.lineTo(qx + nx * th * side, qy + ny * th * side); ctx.stroke(); }
    });
    // 부재: 가새 → 보·기둥 순
    const order = (q) => (q.role === 'brace' ? 0 : q.type === 'beam' ? 2 : 1);
    const RC = lv.material === 'rc', nodeJ = RC ? jointStates(w) : null;
    if (RC && G.rebar) drawBrokenBars(w);
    w.members.filter((q) => !q.broken && q.role !== 'panel').sort((p, q) => order(p) - order(q)).forEach((mm) => {
      const e = m.elements[mm.type];
      if (RC && G.rebar && mm.role === 'frame') ctx.globalAlpha = 0.33; // 콘크리트를 비춰 철근이 보이게
      if (mm.mods && mm.mods.includes('wing')) { // 날개벽: 기둥 옆 짧은 벽
        const xa = X(mm.ia), ya = Y(mm.ia), xb = X(mm.ib), yb = Y(mm.ib), ww = 0.8 * ppm;
        ctx.fillStyle = '#d6d3cc'; ctx.strokeStyle = '#9a968e'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(xa, ya); ctx.lineTo(xb, yb); ctx.lineTo(xb + ww, yb); ctx.lineTo(xa + ww, ya); ctx.closePath(); ctx.fill(); ctx.stroke();
      }
      const wpx = Math.max(4, e.width * ppm) * (mm.mods && mm.mods.includes('jacket') ? 1.5 : 1);
      stick(X(mm.ia), Y(mm.ia), X(mm.ib), Y(mm.ib), wpx, memberColor(mm, e), mm.mods && mm.mods.includes('jacket') ? '#4f4c47' : e.dark);
      if (mm.mods && mm.mods.includes('frp')) { // 탄소섬유 띠
        ctx.strokeStyle = '#1d1f22'; ctx.lineWidth = Math.max(3, 0.12 * ppm);
        for (let u = 0.15; u < 0.9; u += 0.17) { const cx = X(mm.ia) + (X(mm.ib) - X(mm.ia)) * u, cy = Y(mm.ia) + (Y(mm.ib) - Y(mm.ia)) * u; ctx.beginPath(); ctx.moveTo(cx - wpx / 2 - 2, cy); ctx.lineTo(cx + wpx / 2 + 2, cy); ctx.stroke(); }
      }
      ctx.globalAlpha = 1;
      if (RC && mm.role === 'frame' && G.mode !== 'build') drawRcCracks(w, mm, wpx, nodeJ);
      if (RC && G.rebar && mm.role === 'frame') drawRebar(w, mm, wpx, nodeJ);
    });
    if (lv.tank && w.idx[lv.tank] !== undefined) { // 옥상 물탱크
      const k = w.idx[lv.tank], tw = 2.4 * ppm, th = 1.8 * ppm;
      ctx.fillStyle = '#4f86b8'; ctx.strokeStyle = '#2d5577'; ctx.lineWidth = 3;
      ctx.fillRect(X(k) - tw / 2, Y(k) - th - 0.3 * ppm, tw, th); ctx.strokeRect(X(k) - tw / 2, Y(k) - th - 0.3 * ppm, tw, th);
      ctx.fillStyle = '#fff'; ctx.font = `800 ${Math.max(12, 0.45 * ppm)}px system-ui`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(KO ? '물탱크' : 'TANK', X(k), Y(k) - th / 2 - 0.3 * ppm);
    }
    // 접합부
    for (let k = 0; k < w.N; k++) {
      const name = w.names[k], x = X(k), y = Y(k);
      if (lv.material !== 'wood') { ctx.fillStyle = 'rgba(60,58,54,.5)'; ctx.fillRect(x - 3, y - 3, 6, 6); continue; }
      if (w.conns.has(name)) {
        const s = 0.17 * ppm;
        ctx.fillStyle = '#7d8a96'; ctx.strokeStyle = '#3d4650'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x - s, y - s, 2 * s, 2 * s, 3) : ctx.rect(x - s, y - s, 2 * s, 2 * s); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#2c333a';
        [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([p, q]) => { ctx.beginPath(); ctx.arc(x + p * s * 0.55, y + q * s * 0.55, Math.max(1.5, s * 0.16), 0, 7); ctx.fill(); });
      } else {
        ctx.fillStyle = '#4a3420'; ctx.beginPath(); ctx.arc(x, y, Math.max(2, 0.04 * ppm), 0, 7); ctx.fill();
      }
    }
    // 부러진 접합부 표시
    ctx.strokeStyle = '#e8322b'; ctx.lineWidth = 3;
    const seen = new Set();
    w.joints.forEach((j) => {
      if (!j.broken || seen.has(j.n)) return; seen.add(j.n);
      const x = X(j.n), y = Y(j.n), r = 0.16 * ppm;
      ctx.beginPath(); ctx.moveTo(x - r, y - r * 0.4); ctx.lineTo(x - r * 0.3, y + r * 0.3); ctx.lineTo(x + r * 0.2, y - r * 0.5); ctx.lineTo(x + r, y + r * 0.2); ctx.stroke();
    });
  }
  // ---------- RC 피해·철근 그리기 ----------
  const hsh = (k) => { const x = Math.sin(k * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }; // 늘 같은 자리에 금이 가게
  function jointStates(w) {
    const st = Array.from({ length: w.N }, () => ({ cr: false, yl: false, dmg: 0, br: false }));
    w.joints.forEach((j) => { const s = st[j.n]; if (j.cracked) s.cr = true; if (j.yielded) s.yl = true; s.dmg = Math.max(s.dmg, j.dmg || 0); if (j.broken) s.br = true; });
    return st;
  }
  // 한 부재 위의 점: u(0~1 길이 방향), v(폭 방향 -1~1)
  function memFrame(w, mm, wpx) {
    const ax = sx(w.x[mm.ia]), ay = sy(w.y[mm.ia]), bx = sx(w.x[mm.ib]), by = sy(w.y[mm.ib]);
    const l = Math.hypot(bx - ax, by - ay) || 1, ux = (bx - ax) / l, uy = (by - ay) / l, nx = -uy, ny = ux;
    return { l, at: (u, v) => [ax + (bx - ax) * u + nx * v * wpx / 2, ay + (by - ay) * u + ny * v * wpx / 2] };
  }
  const seg = (p, q) => { ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); ctx.stroke(); };
  function drawRcCracks(w, mm, wpx, nodeJ) {
    const F = memFrame(w, mm, wpx), Lm = mm.L0, vert = Math.abs(w.x0[mm.ia] - w.x0[mm.ib]) < 1e-6, id = w.members.indexOf(mm);
    ctx.lineCap = 'round';
    // 휨 실금: 금 간 접합부 쪽 끝에 가로 금 (항복하면 더 많고 진하게)
    [[mm.ia, 0], [mm.ib, 1]].forEach(([k, end]) => {
      const s = nodeJ[k]; if (!s.cr) return;
      const n = s.yl ? (s.dmg > 0.04 ? 4 : 3) : 2;
      ctx.strokeStyle = s.yl ? 'rgba(45,35,28,.85)' : 'rgba(60,50,40,.55)'; ctx.lineWidth = s.yl ? 2 : 1.2;
      for (let q = 0; q < n; q++) {
        const d = (0.1 + q * 0.14) / Lm, u = end ? 1 - d : d, j = (hsh(id * 7 + q + end * 3) - 0.5) * 0.3;
        seg(F.at(u + j * 0.02, -0.9), F.at(u - j * 0.02, 0.2 + hsh(id + q) * 0.6));
      }
      if (s.dmg > 0.06) { ctx.fillStyle = 'rgba(120,110,95,.7)'; const p = F.at(end ? 1 - 0.12 / Lm : 0.12 / Lm, 0.6); ctx.beginPath(); ctx.arc(p[0], p[1], wpx * 0.22, 0, 7); ctx.fill(); } // 피복 박락
    });
    // 전단 빗금: 기둥 몸통에 대각선 (실금 → 굵은 X)
    if (vert && mm.crk >= 0.5) {
      const big = mm.crk >= 0.8;
      ctx.strokeStyle = big ? 'rgba(35,25,20,.9)' : 'rgba(60,50,40,.6)'; ctx.lineWidth = big ? 2.6 : 1.2;
      const n = big ? 3 : 2;
      for (let q = 0; q < n; q++) {
        const u0 = 0.25 + q * 0.22 + (hsh(id * 3 + q) - 0.5) * 0.08, du = Math.min(0.25, 0.9 * wpx / F.l);
        seg(F.at(u0, -0.95), F.at(u0 + du, 0.95));
        if (big) seg(F.at(u0 + du, -0.95), F.at(u0, 0.95));
      }
    }
  }
  function drawBrickDamage(c, ms, gname) {
    const w = G.world, P4 = c.map((k) => [sx(w.x[k]), sy(w.y[k])]); // 0 왼아래 1 오른아래 2 왼위 3 오른위
    const bl = (u, v) => { const a = P4[0], b = P4[1], d = P4[2], e = P4[3]; return [a[0] * (1 - u) * (1 - v) + b[0] * u * (1 - v) + d[0] * (1 - u) * v + e[0] * u * v, a[1] * (1 - u) * (1 - v) + b[1] * u * (1 - v) + d[1] * (1 - u) * v + e[1] * u * v]; };
    const seed = gname.split('').reduce((a, ch) => a + ch.charCodeAt(0), 0);
    const deg = Math.min(...ms.map((q) => (q.deg === undefined ? 1 : q.deg)));
    // 계단식 금 (줄눈 따라)
    ms.forEach((q, k) => {
      if (!q.cracked) return;
      ctx.strokeStyle = 'rgba(50,25,15,.8)'; ctx.lineWidth = deg < 0.8 ? 2.4 : 1.4;
      ctx.beginPath(); const steps = 8;
      for (let s2 = 0; s2 <= steps; s2++) { const u = s2 / steps, v = k ? 1 - u : u; const p = bl(k ? 1 - u : u, u), p2 = bl(k ? 1 - (u + 0.5 / steps) : u + 0.5 / steps, u); if (!s2) ctx.moveTo(...p); else ctx.lineTo(...p); if (s2 < steps) ctx.lineTo(p2[0], p[1]); void v; }
      ctx.stroke();
    });
    // 빠진 벽돌 구멍
    const holes = Math.round((1 - deg) * 16);
    ctx.fillStyle = '#4a3b33';
    for (let h = 0; h < holes; h++) { const u = 0.1 + hsh(seed + h * 13) * 0.8, v = 0.1 + hsh(seed + h * 29) * 0.8; const p = bl(u, v); const ww = Math.abs(P4[1][0] - P4[0][0]) / 9, hh = Math.abs(P4[2][1] - P4[0][1]) / 9; ctx.fillRect(p[0] - ww / 2, p[1] - hh / 2, ww, hh); }
  }
  function drawMesh(P4, nu, nv) { // 철근망 (전단벽·날개벽)
    const bl = (u, v) => [P4[0][0] * (1 - u) * (1 - v) + P4[1][0] * u * (1 - v) + P4[2][0] * (1 - u) * v + P4[3][0] * u * v, P4[0][1] * (1 - u) * (1 - v) + P4[1][1] * u * (1 - v) + P4[2][1] * (1 - u) * v + P4[3][1] * u * v];
    ctx.strokeStyle = 'rgba(40,90,160,.8)'; ctx.lineWidth = 1.4;
    for (let a = 1; a < nu; a++) seg(bl(a / nu, 0.04), bl(a / nu, 0.96));
    for (let b = 1; b < nv; b++) seg(bl(0.04, b / nv), bl(0.96, b / nv));
  }
  // 철근 보기: 주근(길이 방향 선) · 띠철근/늑근(성긴 고리, 90° 갈고리) · 기둥 밑 겹침이음 · 보강 철근(파랑)
  function drawRebar(w, mm, wpx, nodeJ) {
    const F = memFrame(w, mm, wpx), Lm = mm.L0, vert = Math.abs(w.x0[mm.ia] - w.x0[mm.ib]) < 1e-6;
    const mods = mm.mods || [], jk = mods.includes('jacket'), wpx0 = jk ? wpx / 1.5 : wpx;
    const yl = nodeJ[mm.ia].yl || nodeJ[mm.ib].yl, sh = (mm.crk || 0) >= 0.8;
    const bar = yl ? '#e08a1e' : '#6b3f22';
    ctx.lineCap = 'round';
    const o = (0.62 * wpx0) / wpx;
    ctx.strokeStyle = bar; ctx.lineWidth = Math.max(1.6, wpx0 * 0.07);
    seg(F.at(0, -o), F.at(1, -o)); seg(F.at(0, o), F.at(1, o));
    // 겹침이음: 층마다 기둥 아래쪽 0.6m 에서 철근이 겹침
    if (vert) {
      const low = w.y0[mm.ia] < w.y0[mm.ib] ? 0 : 1, d = Math.min(0.45, 0.6 / Lm);
      ctx.lineWidth = Math.max(1.4, wpx0 * 0.06); ctx.strokeStyle = '#8a5a35';
      const u0 = low ? 1 - d : 0, u1 = low ? 1 : d;
      seg(F.at(u0, -o * 0.7), F.at(u1, -o * 0.7)); seg(F.at(u0, o * 0.7), F.at(u1, o * 0.7));
    }
    // 띠철근(기둥)·늑근(보): 옛 건물 300mm 간격, 90° 갈고리. 전단으로 벌어지면 빨강
    const sp = 0.3, tie = sh ? '#e8322b' : '#8a5a35';
    ctx.strokeStyle = tie; ctx.lineWidth = sh ? 2.2 : 1.3;
    for (let d = sp / 2; d < Lm; d += sp) {
      const u = d / Lm; seg(F.at(u, -o - 0.06), F.at(u, o + 0.06));
      const hk = sh ? 0.22 : 0.1; seg(F.at(u, o + 0.06), F.at(u + hk * (wpx0 / wpx) * 0.6 / Lm, o - 0.2)); // 90° 갈고리 (벌어지면 길게 튀어나옴)
    }
    if (jk) { // 단면 증설: 바깥 새 주근 + 촘촘한 띠(100mm)
      const o2 = 0.86; ctx.strokeStyle = '#2f6db3'; ctx.lineWidth = Math.max(1.6, wpx * 0.05);
      seg(F.at(0, -o2), F.at(1, -o2)); seg(F.at(0, o2), F.at(1, o2));
      ctx.lineWidth = 1.1; for (let d = 0.05; d < Lm; d += 0.1) seg(F.at(d / Lm, -o2 - 0.05), F.at(d / Lm, o2 + 0.05));
    }
    if (mods.includes('frp')) { // 탄소섬유 띠
      ctx.strokeStyle = 'rgba(20,22,26,.85)'; ctx.lineWidth = Math.max(4, 0.12 * ppm);
      for (let u = 0.12; u < 0.95; u += 0.12) seg(F.at(u, -1.15), F.at(u, 1.15));
    }
    if (mods.includes('wing')) { // 날개벽 철근망 + 기둥으로 들어가는 앵커
      const a = [sx(w.x[mm.ia]), sy(w.y[mm.ia])], b = [sx(w.x[mm.ib]), sy(w.y[mm.ib])], ww = 0.8 * ppm;
      const P4 = a[1] > b[1] ? [a, [a[0] + ww, a[1]], b, [b[0] + ww, b[1]]] : [b, [b[0] + ww, b[1]], a, [a[0] + ww, a[1]]];
      drawMesh(P4, 3, Math.max(4, Math.round(Lm / 0.3)));
      ctx.strokeStyle = '#2f6db3'; ctx.lineWidth = 1.6;
      for (let d = 0.3; d < Lm; d += 0.45) { const p = F.at(d / Lm, 0); seg([p[0] - wpx * 0.2, p[1]], [p[0] + wpx * 0.6 + 0.2 * ppm, p[1]]); }
    }
  }
  // 무너진 RC 부재: 철근만 휘어 남은 모습 (빨강)
  function drawBrokenBars(w) {
    w.members.forEach((mm) => {
      if (!mm.broken || mm.role !== 'frame' || mm.crk === undefined) return;
      const ax = sx(w.x[mm.ia]), ay = sy(w.y[mm.ia]), bx = sx(w.x[mm.ib]), by = sy(w.y[mm.ib]);
      const l = Math.hypot(bx - ax, by - ay); if (l > mm.L0 * ppm * 1.6) return; // 떨어져 나간 건 안 그림
      const mx = (ax + bx) / 2 + 0.25 * ppm, my = (ay + by) / 2;
      ctx.strokeStyle = '#e8322b'; ctx.lineWidth = 2.2; ctx.setLineDash([]);
      [-6, 6].forEach((o) => { ctx.beginPath(); ctx.moveTo(ax + o, ay); ctx.quadraticCurveTo(mx + o, my, bx + o, by); ctx.stroke(); });
    });
  }
  // 평면 작은 지도: 무게 중심(CM)·강성 중심(CR)과 비틀림
  function drawPlan() {
    const lv = level(); if (lv.material !== 'rc' || !lv.back || !G.tor || G.mode === 'engineer') return;
    const T = G.tor, x = 1320, y = G.mode === 'build' ? 92 : 166, w = 250, h = 166; // compact 면 render() 가 1.5배로 키움 (CG판: 글자가 겹치지 않게 조금 넓힘)
    ctx.fillStyle = 'rgba(255,248,236,.94)'; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, 12) : ctx.rect(x, y, w, h); ctx.fill();
    ctx.fillStyle = '#2b2118'; ctx.font = '700 13px system-ui, sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillText(t('plan'), x + 10, y + 7);
    const pw = 150, ph = 66, cx = x + w / 2, cy = y + 50 + ph / 2;
    // 비틀림: 지진 중엔 앞면 흔들림에 맞춰 강성 중심 둘레로 돎 (과장)
    let th = 0;
    if (G.world && G.mode !== 'build') { const W = G.world; let d = 0; for (const k of W.top) d += W.x[k] - W.x0[k] - W.gx; d /= W.top.length || 1; th = Math.max(-0.4, Math.min(0.4, (d / W.H) * T.u * 18)); }
    const cry = cy + (-T.e / T.D) * ph; // 뒤(위쪽)가 단단하면 CR 이 위로
    ctx.save(); ctx.translate(cx, cry); ctx.rotate(th); ctx.translate(-cx, -cry);
    ctx.fillStyle = '#e9e5de'; ctx.strokeStyle = '#7d7a73'; ctx.lineWidth = 2; ctx.fillRect(cx - pw / 2, cy - ph / 2, pw, ph); ctx.strokeRect(cx - pw / 2, cy - ph / 2, pw, ph);
    // 뒷면 벽돌 (위)
    ctx.fillStyle = '#c98b6b'; ctx.fillRect(cx - pw / 2, cy - ph / 2, pw, 8);
    ctx.strokeStyle = 'rgba(120,60,40,.6)'; ctx.lineWidth = 1; for (let k = 1; k < 10; k++) seg([cx - pw / 2 + k * pw / 10, cy - ph / 2], [cx - pw / 2 + k * pw / 10, cy - ph / 2 + 8]);
    // 앞면 (아래) — 보강할수록 굵게
    const fr = Math.max(0.15, Math.min(1.2, T.Kf / T.Kb));
    ctx.strokeStyle = '#4f86b8'; ctx.lineWidth = 2 + fr * 7; seg([cx - pw / 2, cy + ph / 2], [cx + pw / 2, cy + ph / 2]);
    ctx.restore();
    // CM · CR
    ctx.fillStyle = '#2b2118'; ctx.beginPath(); ctx.arc(cx, cy, 4.5, 0, 7); ctx.fill();
    ctx.fillStyle = '#e8322b'; ctx.beginPath(); ctx.arc(cx, cry, 4.5, 0, 7); ctx.fill();
    ctx.font = '700 11px system-ui, sans-serif'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#2b2118'; ctx.fillText(KO ? '무게중심' : 'mass', cx + 8, cy + 1);
    ctx.fillStyle = '#b3261e'; ctx.fillText(KO ? '강성중심' : 'stiffness', cx + 8, cry - 1);
    ctx.fillStyle = '#7a5a3a'; ctx.textBaseline = 'top'; ctx.fillText(L(lv.back), x + 10, y + 29); ctx.textBaseline = 'middle'; ctx.fillText(t('front'), x + 10, cy + ph / 2 + 13);
    ctx.font = '800 14px system-ui, sans-serif'; ctx.fillStyle = T.tf > 1.12 ? '#b3261e' : '#2e7d4f';
    ctx.textAlign = 'right'; ctx.fillText(T.tf > 1.03 ? `${t('twist')} ×${T.tf.toFixed(2)}` : t('balanced'), x + w - 10, y + 15);
    ctx.textAlign = 'left';
  }
  function drawOpenings() {
    const lv = level(); if (!lv.openings) return;
    const bl = G.mode === 'build' ? blockedOpenings(G.design) : [];
    lv.openings.forEach(([i, j, kind]) => {
      const x0 = lv.xs[i], x1 = lv.xs[i + 1], y0 = lv.ys[j], y1 = lv.ys[j + 1], cx = (x0 + x1) / 2;
      if (G.labelPass) { /* 글자만 */ } else if (kind === 'window') {
        const w = (x1 - x0) * 0.7, h = (y1 - y0) * 0.45, by = y0 + (y1 - y0) * 0.35;
        ctx.fillStyle = '#bfe0f2'; ctx.strokeStyle = '#7d5a3a'; ctx.lineWidth = 4;
        ctx.fillRect(sx(cx - w / 2), sy(by + h), w * ppm, h * ppm); ctx.strokeRect(sx(cx - w / 2), sy(by + h), w * ppm, h * ppm);
        ctx.beginPath(); ctx.moveTo(sx(cx), sy(by + h)); ctx.lineTo(sx(cx), sy(by)); ctx.stroke();
      } else {
        const dr = lv.doorRects && lv.doorRects[`${i},${j}`];
        const w = dr ? dr.x1 - dr.x0 - 0.1 : 0.95, h = dr ? dr.y1 - y0 - 0.04 : Math.min(2.1, (y1 - y0) - 0.3);
        ctx.fillStyle = '#9a6a3c'; ctx.strokeStyle = '#5e3d1f'; ctx.lineWidth = 3;
        ctx.fillRect(sx(cx - w / 2), sy(y0 + h), w * ppm, h * ppm); ctx.strokeRect(sx(cx - w / 2), sy(y0 + h), w * ppm, h * ppm);
        ctx.fillStyle = '#f2c14e'; ctx.beginPath(); ctx.arc(sx(cx + w * 0.3), sy(y0 + h * 0.48), 0.06 * ppm, 0, 7); ctx.fill();
      }
      if (G.labelPass && bl.some((b) => b.i === i && b.j === j)) {
        const txt = kind === 'window' ? t('winBlocked') : t('doorBlocked');
        const k = G.compact ? 1.5 : 1;
        ctx.font = `800 ${17 * k}px system-ui, sans-serif`; const tw = ctx.measureText(txt).width + 16 * k;
        ctx.fillStyle = '#b3261e'; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(sx(cx) - tw / 2, sy(y1) + 8, tw, 26 * k, 8) : ctx.rect(sx(cx) - tw / 2, sy(y1) + 8, tw, 26 * k); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(txt, sx(cx), sy(y1) + 8 + 13 * k);
      }
    });
  }
  function label(x, y, txt, bg) {
    const k = G.compact ? 1.6 : 1;
    ctx.font = `700 ${17 * k}px system-ui, sans-serif`;
    const tw = ctx.measureText(txt).width + 18 * k;
    ctx.fillStyle = bg; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x - tw / 2, y - 14 * k, tw, 28 * k, 8) : ctx.rect(x - tw / 2, y - 14 * k, tw, 28 * k); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(txt, x, y);
  }
  function drawGhosts() {
    if (G.mode !== 'build' || !G.slots) return;
    const tool = G.tool, ptr = G.ptr;
    ctx.save();
    // 절점: 작은 잡을 점
    if (LINK.includes(tool) || tool === 'conn') {
      const list = tool === 'conn' ? G.slots.node.map((q) => q.n) : G.slots.joints;
      list.forEach((n) => {
        const p = P(n); const hot = ptr && Math.hypot(ptr[0] - p[0], ptr[1] - p[1]) < pickR(0.42);
        ctx.fillStyle = hot ? 'rgba(46,140,80,.95)' : 'rgba(255,255,255,.9)'; ctx.strokeStyle = 'rgba(43,33,24,.7)'; ctx.lineWidth = G.compact ? 3 : 2;
        ctx.beginPath(); ctx.arc(sx(p[0]), sy(p[1]), (hot ? 9 : 6) * (G.compact ? 1.8 : 1), 0, 7); ctx.fill(); ctx.stroke();
      });
    }
    if (LINK.includes(tool) && G.linkFrom && ptr) {
      const a = P(G.linkFrom); const n = nearJoint(ptr[0], ptr[1]);
      const b = n && n !== G.linkFrom ? P(n) : ptr;
      const bad = n && n !== G.linkFrom ? checkLink(level(), G.design, tool, G.linkFrom, n) : null;
      const e = mat().elements[tool];
      ctx.strokeStyle = bad ? 'rgba(232,50,43,.85)' : 'rgba(46,140,80,.85)'; ctx.lineCap = 'round';
      ctx.lineWidth = Math.max(5, e.width * ppm); ctx.setLineDash(n ? [] : [10, 8]);
      ctx.beginPath(); ctx.moveTo(sx(a[0]), sy(a[1])); ctx.lineTo(sx(b[0]), sy(b[1])); ctx.stroke(); ctx.setLineDash([]);
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
      const PR = QR.PRICES[tool], live = Math.round((PR.base + PR.perM * len) / 1000) * 1000;
      label(sx((a[0] + b[0]) / 2), sy((a[1] + b[1]) / 2) - 26, `-${won(live, usdOf(live))} · ${len.toFixed(1)}m`, live > money() ? '#e8322b' : '#2b2118');
    } else if (LINK.includes(tool) && ptr && !nearJoint(ptr[0], ptr[1])) {
      const idx = nearPlaced(ptr[0], ptr[1], tool);
      if (idx >= 0) { const d = G.design[idx]; const [a, b] = [P(d.a), P(d.b)];
        ctx.strokeStyle = 'rgba(232,50,43,.85)'; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(sx(a[0]), sy(a[1])); ctx.lineTo(sx(b[0]), sy(b[1])); ctx.stroke();
        label(sx((a[0] + b[0]) / 2), sy((a[1] + b[1]) / 2) - 26, `+${wonIt(d)}  ${t('remove')}`, '#b3261e'); }
    } else if (isBay(tool) && ptr) {
      const cell = bayAt(ptr[0], ptr[1]);
      if (cell) {
        const lv = level(), [i, j] = cell;
        const placed = G.design.some((d) => d.tool === tool && d.i === i && d.j === j);
        const ok = placed || bayList(tool, G.slots).some((b) => b.i === i && b.j === j);
        const x0 = sx(lv.xs[i]), x1 = sx(lv.xs[i + 1]), y0 = sy(lv.ys[j]), y1 = sy(lv.ys[j + 1]);
        ctx.fillStyle = placed ? 'rgba(232,50,43,.3)' : ok ? 'rgba(233,201,141,.8)' : 'rgba(150,150,150,.15)';
        ctx.fillRect(x0 + 6, y1 + 6, x1 - x0 - 12, y0 - y1 - 12);
        if (ok) label((x0 + x1) / 2, (y0 + y1) / 2, placed ? `+${wonIt({ tool, i, j })}  ${t('remove')}` : `-${wonIt({ tool, i, j })}`, placed ? '#b3261e' : '#2b2118');
      }
    } else if (isCol(tool) && ptr) {
      const c = nearCol(ptr[0], ptr[1]);
      G.slots.cols.forEach((q) => { const [a, b] = [P(q.a), P(q.b)]; ctx.strokeStyle = q === c ? 'rgba(46,140,80,.9)' : 'rgba(46,120,200,.35)'; ctx.lineWidth = q === c ? 0.7 * ppm : 4; ctx.setLineDash(q === c ? [] : [8, 7]); ctx.beginPath(); ctx.moveTo(sx(a[0]), sy(a[1])); ctx.lineTo(sx(b[0]), sy(b[1])); ctx.stroke(); });
      ctx.setLineDash([]);
      if (c) { const placed = G.design.some((d) => d.tool === tool && d.a === c.a && d.b === c.b); const [a, b] = [P(c.a), P(c.b)];
        label(sx((a[0] + b[0]) / 2), sy((a[1] + b[1]) / 2), placed ? `+${wonIt({ tool, a: c.a, b: c.b })}  ${t('remove')}` : `-${wonIt({ tool, a: c.a, b: c.b })}`, placed ? '#b3261e' : '#2b2118'); }
    } else if (tool === 'conn' && ptr) {
      const n = nearJoint(ptr[0], ptr[1]);
      if (n && G.slots.node.some((q) => q.n === n)) {
        const placed = G.design.some((d) => d.tool === 'conn' && d.n === n); const p = P(n);
        label(sx(p[0]), sy(p[1]) - 30, placed ? `+${wonIt({ tool: 'conn', n })}  ${t('remove')}` : `-${wonIt({ tool: 'conn', n })}`, placed ? '#b3261e' : '#2b2118');
      }
    }
    ctx.restore();
  }
  function drawFx() {
    for (const d of G.debris) {
      const cx = sx(d.x), cy = sy(d.y), l = d.len * ppm / 2, ca = Math.cos(d.a), sa = Math.sin(d.a);
      if (d.chunk) { ctx.save(); ctx.translate(cx, cy); ctx.rotate(-d.a); ctx.fillStyle = d.color; ctx.strokeStyle = 'rgba(60,40,30,.6)'; ctx.lineWidth = 1;
        ctx.fillRect(-l, -d.width * ppm / 2, 2 * l, d.width * ppm); ctx.strokeRect(-l, -d.width * ppm / 2, 2 * l, d.width * ppm); ctx.restore(); continue; }
      if (d.ply) {
        ctx.save(); ctx.translate(cx, cy); ctx.rotate(-d.a); ctx.fillStyle = '#e9c98d'; ctx.strokeStyle = '#b8955a'; ctx.lineWidth = 2;
        ctx.fillRect(-l, -0.22 * ppm, 2 * l, 0.44 * ppm); ctx.strokeRect(-l, -0.22 * ppm, 2 * l, 0.44 * ppm); ctx.restore();
      } else stick(cx - ca * l, cy + sa * l, cx + ca * l, cy - sa * l, Math.max(4, d.width * ppm), d.color, d.dark);
    }
    for (const p of G.sparks) { ctx.fillStyle = `rgba(255,190,60,${p.life * 2.5})`; ctx.fillRect(sx(p.x) - 2, sy(p.y) - 2, 4, 4); }
    for (const p of G.dust) { ctx.fillStyle = `rgba(170,140,105,${Math.max(0, p.life) * 0.45})`; ctx.beginPath(); ctx.arc(sx(p.x), sy(p.y), p.r * ppm, 0, 7); ctx.fill(); }
  }
  function drawQuakeMeter() {
    if (G.mode !== 'quake' && G.mode !== 'result') return;
    const q = G.quake, x = 1360, y = 92, w = 210;
    ctx.fillStyle = 'rgba(255,248,236,.92)'; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, 64, 12) : ctx.rect(x, y, w, 64); ctx.fill();
    ctx.fillStyle = '#2b2118'; ctx.font = '700 15px system-ui, sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillText(`${t('quakeStr')}  ${Math.min(10, G.time).toFixed(1)}s`, x + 12, y + 8);
    // 지진파 그림
    ctx.strokeStyle = '#e4572e'; ctx.lineWidth = 2; ctx.beginPath();
    for (let i = 0; i <= 100; i++) { const tt = i / 10; const v = q.x(tt) / G.qmax; const px = x + 12 + i * 1.86, py = y + 46 - Math.max(-14, Math.min(14, v * 14)); i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
    ctx.stroke();
    ctx.fillStyle = 'rgba(43,33,24,.85)'; ctx.fillRect(x + 12 + Math.min(10, G.time) * 18.6, y + 30, 2, 32);
  }
  function render() {
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    const shk = G.mode === 'quake' ? G.shake + (G.quake ? G.quake.intensity(G.time) * 3 : 0) : 0;
    ctx.save();
    if (shk > 0.3) ctx.translate((Math.random() - 0.5) * shk, (Math.random() - 0.5) * shk);
    drawBg();
    if (G.mode === 'engineer') { ctx.translate(-250, 0); drawGround(0); drawEng(); ctx.restore(); return; }
    const gx = G.world && G.mode !== 'build' ? G.world.gx : 0;
    drawGround(gx);
    drawOpenings();
    if (G.world) drawWorld();
    G.labelPass = true; drawOpenings(); G.labelPass = false;
    drawGhosts();
    drawFx();
    ctx.restore();
    ctx.save();
    if (G.compact) { ctx.translate(1580, 128); ctx.scale(1.5, 1.5); ctx.translate(-1570, -92); }
    drawQuakeMeter();
    drawPlan();
    ctx.restore();
    drawCoach();
  }
  // ---------- 첫 판 안내 (첫 방문 1판만, 진행을 막지 않음) ----------
  function coachStep() {
    if (!FIRST || G.li !== 0 || G.mode !== 'build') return null;
    const has = (a, b) => G.design.some((d) => d.tool === 'brace' && ((d.a === a && d.b === b) || (d.a === b && d.b === a)));
    const h1 = has('0,0', '1,1'), h2 = has('1,0', '0,1');
    if (h1 && h2) return { k: 'go' };
    if (G.tool !== 'brace') return { k: 'tool' };
    if (!h1 && !h2) return { k: 'b1', a: '0,0', b: '1,1' };
    return h1 ? { k: 'b2', a: '1,0', b: '0,1' } : { k: 'b2', a: '0,0', b: '1,1' };
  }
  let coachK = null;
  function drawCoach() {
    const st = coachStep(), k = st ? st.k : null;
    if (k !== coachK) {
      coachK = k;
      $('go').classList.toggle('pulse', k === 'go');
      document.querySelectorAll('.tool').forEach((b) => b.classList.toggle('pulse', k === 'tool' && b.dataset.tool === 'brace'));
    }
    if (!st) return;
    const z = G.compact ? 1.6 : 1, now = performance.now() / 1000;
    const bubble = (x, y, txt) => {
      ctx.font = `900 ${26 * z}px system-ui, sans-serif`; const tw = ctx.measureText(txt).width + 36 * z, th = 50 * z;
      ctx.fillStyle = 'rgba(43,33,24,.9)'; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x - tw / 2, y - th / 2, tw, th, 16) : ctx.rect(x - tw / 2, y - th / 2, tw, th); ctx.fill();
      ctx.fillStyle = '#ffd27a'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(txt, x, y + 1);
    };
    const lv = level(), topY = sy(Math.max(...lv.ys, ...Object.values(lv.extra || {}).map((p) => p[1])));
    if (k === 'b1' || k === 'b2') {
      const a = P(st.a), b = P(st.b), ax = sx(a[0]), ay = sy(a[1]), bx = sx(b[0]), by = sy(b[1]);
      ctx.save();
      ctx.strokeStyle = 'rgba(255,210,122,.95)'; ctx.lineWidth = 8 * z; ctx.lineCap = 'round'; ctx.setLineDash([14 * z, 12 * z]); ctx.lineDashOffset = -now * 40;
      ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke(); ctx.setLineDash([]);
      const r0 = (now * 1.2) % 1; // 시작점 물결
      ctx.strokeStyle = `rgba(255,210,122,${1 - r0})`; ctx.lineWidth = 5 * z; ctx.beginPath(); ctx.arc(ax, ay, (10 + 30 * r0) * z, 0, 7); ctx.stroke();
      const u = Math.min(1, ((now * 0.7) % 1.25)); // 손가락이 a → b 로 미끄러짐
      const fx = ax + (bx - ax) * u, fy = ay + (by - ay) * u;
      ctx.fillStyle = 'rgba(255,255,255,.95)'; ctx.strokeStyle = '#2b2118'; ctx.lineWidth = 3 * z; ctx.beginPath(); ctx.arc(fx, fy, 15 * z, 0, 7); ctx.fill(); ctx.stroke();
      ctx.restore();
      bubble(sx(lv.xs[1]), Math.max(160 * z, topY - 50 * z), t(k === 'b1' ? 'coach1' : 'coach2'));
    } else if (k === 'go') {
      const goR = $('go').getBoundingClientRect(), stR = stage.getBoundingClientRect();
      const gx = (goR.left + goR.width / 2 - stR.left) / S, gy = (goR.top - stR.top) / S;
      const yy = gy - 70 * z - Math.abs(Math.sin(now * 4)) * 14 * z;
      bubble(Math.min(1600 - 160 * z, gx), yy - 36 * z, t('coachGo') + '  ↓');
    } else if (k === 'tool') {
      const el = document.querySelector('.tool[data-tool="brace"]'); if (!el) return;
      const r = el.getBoundingClientRect(), stR = stage.getBoundingClientRect();
      bubble(Math.max(200 * z, (r.left + r.width / 2 - stR.left) / S), (r.top - stR.top) / S - 50 * z, t('coachTool') + '  ↓');
    }
  }

  // ---------- 진짜 해석 보기 (선형 강성법) ----------
  const fmt = (v, d = 0) => v.toLocaleString(undefined, { maximumFractionDigits: d, minimumFractionDigits: d });
  function openEngineer() {
    const lv = level();
    G.eng = QR.physics.analyze(lv, G.design);
    G.engRef = QR.physics.analyze(lv, lv.solution.map(QR.parseItem));
    G.engT = 0; G.mode = 'engineer';
    $('result').classList.remove('show');
    const a = G.eng, r = G.engRef;
    const floorName = (j) => (KO ? `${j}층` : `story ${j}`);
    let html = `<h3>${t('engTitle')}</h3>`;
    html += a.mechanism
      ? `<div class="verdict bad">⚠️ ${t('mech')} — ${floorName(a.weakStorey)}</div><div class="sub">${t('mechSub')}</div>`
      : `<div class="verdict">${t('stiff')} <b>${fmt(a.K)} kN/m</b></div>`;
    const kMax = Math.max(a.K, r.K, 1);
    html += `<div class="cmp"><div><span>${t('yours')}</span><i style="width:${(a.K / kMax) * 100}%"></i><b>${a.mechanism ? '0' : fmt(a.K)}</b></div>`
      + `<div><span>${t('goodFix')}</span><i class="ref" style="width:${(r.K / kMax) * 100}%"></i><b>${r.mechanism ? '0' : fmt(r.K)}</b></div></div>`;
    if (!a.mechanism) html += `<div class="sub">${t('driftUnder').replace('3', fmt(a.F / 1000))}</div><div class="drifts">` + a.storeys.map((st) => `<span>${floorName(st.j)} <b>${fmt(Math.abs(st.drift) * 1000, 2)} mm</b></span>`).join('') + '</div>';
    html += `<div class="legend"><span class="ten">━ ${t('tension')}</span><span class="com">━ ${t('compr')}</span><span>${t('thick')}</span></div>`;
    html += `<div class="note">${t('engNote')}</div><button class="small" id="engClose">${t('back')}</button>`;
    $('engBody').innerHTML = html;
    $('engClose').onclick = () => { $('eng').classList.remove('show'); G.mode = 'result'; $('result').classList.add('show'); };
    $('eng').classList.add('show');
  }
  function drawEng() {
    const a = G.eng, w = a.world; G.engT += 1 / 60;
    let maxU = 1e-9; for (let k = 0; k < w.N; k++) maxU = Math.max(maxU, Math.hypot(a.u[2 * k], a.u[2 * k + 1]));
    const scale = a.mechanism ? 0.6 / maxU : Math.min(200, 0.6 / maxU);
    const ph = Math.sin(G.engT * 2.2);
    const X = (k) => sx(w.x0[k] + a.u[2 * k] * scale * ph), Y = (k) => sy(w.y0[k] + a.u[2 * k + 1] * scale * ph);
    const lv = level();
    // 약한 층 띠
    if (a.mechanism) {
      const j = a.weakStorey; ctx.fillStyle = 'rgba(232,50,43,.16)';
      ctx.fillRect(sx(Math.min(...lv.xs)) - 30, sy(lv.ys[j]), (Math.max(...lv.xs) - Math.min(...lv.xs)) * ppm + 60, (lv.ys[j] - lv.ys[j - 1]) * ppm);
    }
    // 원래 모양(흐리게)
    ctx.strokeStyle = 'rgba(43,33,24,.18)'; ctx.lineWidth = 3; ctx.setLineDash([6, 6]);
    a.members.forEach((m) => { ctx.beginPath(); ctx.moveTo(sx(w.x0[m.ia]), sy(w.y0[m.ia])); ctx.lineTo(sx(w.x0[m.ib]), sy(w.y0[m.ib])); ctx.stroke(); });
    ctx.setLineDash([]);
    // 합판벽 면
    const groups = {}; a.members.forEach((m) => { if (m.group) groups[m.group] = 1; });
    Object.keys(groups).forEach((g) => { const [i, j] = g.slice(1).split(',').map(Number); const c = cellCorners(i, j).map((n) => w.idx[n]);
      ctx.fillStyle = 'rgba(233,201,141,.35)'; ctx.beginPath(); [c[0], c[1], c[3], c[2]].forEach((k, q) => (q ? ctx.lineTo(X(k), Y(k)) : ctx.moveTo(X(k), Y(k)))); ctx.closePath(); ctx.fill(); });
    // 부재력 색
    const maxN = Math.max(1, ...a.members.map((m) => Math.abs(m.N)));
    a.members.forEach((m) => {
      const u = Math.abs(m.N) / maxN;
      ctx.strokeStyle = u < 0.02 || a.mechanism ? '#9a8f84' : m.N > 0 ? '#2f6fd6' : '#e0412b';
      ctx.lineWidth = 3 + (a.mechanism ? 0 : 14 * u); ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(X(m.ia), Y(m.ia)); ctx.lineTo(X(m.ib), Y(m.ib)); ctx.stroke();
    });
    for (let k = 0; k < w.N; k++) { ctx.fillStyle = w.anchored[k] ? '#2b2118' : '#fff'; ctx.strokeStyle = '#2b2118'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(X(k), Y(k), w.anchored[k] ? 6 : 4, 0, 7); ctx.fill(); ctx.stroke(); }
    // 하중 화살표
    ctx.fillStyle = '#2b2118'; ctx.font = '700 18px system-ui, sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    const topJ = lv.ys.length - 1, ay = sy(lv.ys[topJ]), ax = sx(Math.min(...lv.xs)) - 130;
    ctx.strokeStyle = '#2b2118'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ax + 90, ay); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(ax + 100, ay); ctx.lineTo(ax + 84, ay - 9); ctx.lineTo(ax + 84, ay + 9); ctx.fill();
    ctx.fillText(`${fmt(a.F / 1000)} kN`, ax, ay - 20);
    ctx.fillText(a.mechanism ? t('mechAnim') : `${t('deformed')} ×${fmt(scale)}`, sx(Math.min(...lv.xs)), sy(-0.2) + 34);
  }

  // ---------- 포인터 ----------
  const pt = (e) => { const r = stage.getBoundingClientRect(); return [(e.clientX - r.left) / S, (e.clientY - r.top) / S]; };
  const wpt = (e) => { const [x, y] = pt(e); return [wx(x), wy(y)]; };
  cv.addEventListener('pointermove', (e) => { if (G.mode !== 'build') return; G.ptr = wpt(e); });
  cv.addEventListener('pointerleave', () => { if (!G.linkFrom) G.ptr = null; });
  cv.addEventListener('pointerdown', (e) => {
    QR.sfx.init();
    if (G.mode !== 'build') return;
    try { cv.setPointerCapture(e.pointerId); } catch (er) {}
    G.ptr = wpt(e); onDown(G.ptr[0], G.ptr[1]);
  });
  cv.addEventListener('pointerup', (e) => { if (G.mode !== 'build') return; G.ptr = wpt(e); onUp(G.ptr[0], G.ptr[1]); if (e.pointerType !== 'mouse' && !G.linkFrom) G.ptr = null; });
  window.addEventListener('keydown', (e) => {
    if (G.mode === 'title') { $('title').style.display = 'none'; G.mode = 'build'; CG.gameplayStart(); QR.sfx.init(); return; }
    if (e.key === 'Escape') G.linkFrom = null;
    const tl = QR.TOOLS.find((x) => x.key === e.key); if (tl && G.mode === 'build') setTool(tl.id);
    if ((e.key === 'z' || e.key === 'Z') && G.mode === 'build') $('undo').click();
    if ((e.key === 'r' || e.key === 'R') && level().material === 'rc') toggleRebar();
    if ((e.key === 'Enter' || e.key === ' ') && G.mode === 'build') { e.preventDefault(); startQuake(); }
  });

  // ---------- 루프 ----------
  let lastT = performance.now();
  function loop(now) {
    const dt = Math.min(1 / 30, (now - lastT) / 1000); lastT = now;
    if (G.mode === 'quake') simFrame(dt);
    else if (G.mode === 'result' && G.world && !G.result.ok) { // 무너진 뒤에도 잔해는 계속 떨어짐
      const w = G.world; for (let i = 0; i < 20; i++) { w.step(H, w.gx, 0); w.events.forEach((ev) => ev.type === 'impact' && puff(ev.x, 0, 6, 0.6)); w.events.length = 0; }
    }
    updateFx(dt);
    if (hintTimer > 0) { hintTimer -= dt; if (hintTimer <= 0 && G.mode === 'build') $('hint').textContent = ''; }
    render();
    requestAnimationFrame(loop);
  }

  // ?level=N (1부터) — 허브에서 바로 그 판으로. 타이틀 화면은 건너뜀
  const qLevel = Math.floor(+new URLSearchParams(location.search).get('level') || 0);
  if (qLevel >= 1 && qLevel <= QR.LEVELS.length) {
    progress.unlocked = Math.max(progress.unlocked, qLevel); // 고르기 창에서도 보이게 (저장은 깰 때만)
    fit(); buildUi(); loadLevel(qLevel - 1); $('title').style.display = 'none'; G.mode = 'build'; updateHud();
  } else { fit(); buildUi(); loadLevel(0); G.mode = 'title'; CG.gameplayStop(); }
  requestAnimationFrame(loop);
  requestAnimationFrame(() => requestAnimationFrame(() => CG.loadingStop())); // 첫 화면을 그린 뒤

  // 시험용 손잡이
  window.__qr = {
    G, loadLevel, startQuake, setTool,
    screenOf: (x, y) => { const r = stage.getBoundingClientRect(); return [r.left + sx(x) * S, r.top + sy(y) * S]; },
    nodeXY: (n) => P(n),
  };
})();
