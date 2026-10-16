// 버텨라! (Stay Standing!) 3D — 옛 이름 구조 보강하기 — 나무집 10단계
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/OrbitControls.js';
import { C, buildSim, makeModel, checkItem, cleanDesign, priceOf, costOf, capacitySummary, starsFor, blocksWindow, key2, TUNE, usdOf, BAY_TOOLS, COL_TOOLS } from './sim.js';
import { LEVELS } from './levels.js';
import { REFS } from './refs.js';
import { sfx } from './sfx.js';

const qs = new URLSearchParams(location.search);
const CG = globalThis.CG || { init() {}, loadingStart() {}, loadingStop() {}, gameplayStart() {}, gameplayStop() {}, happytime() {}, onMute() {}, go(u) { location.href = u; }, dirty() {} };
CG.init(); CG.loadingStart();
const hubForce = qs.get('unlock') === 'all'; // 통합판 시험용: 모든 장 열기
const LANG = (qs.get('lang') || navigator.language || 'en').toLowerCase().startsWith('ko') ? 'ko' : 'en';
const KO = LANG === 'ko';
const SPEED = Math.max(0.25, Math.min(8, +qs.get('speed') || 1));
const t2 = (o) => (o ? o[LANG] ?? o.en : '');

const TXT = {
  en: {
    title: 'Stay Standing! 3D', left: 'Left',
    iLine: 'Brace the wooden house within budget. Survive the quake, then stay standing 5 s after it stops.<br>Drag to orbit · wheel / pinch to zoom.',
    iStart: (globalThis.matchMedia && matchMedia('(pointer: coarse)').matches) ? 'Tap anywhere to start' : 'Click anywhere to start',
    tools: { brace: 'Brace', ply: 'Plywood', plate: 'Metal plate', post: 'Add post', remove: 'Remove', steelx: 'Steel X-brace', rcwall: 'RC shear wall', jacket: 'Column jacket', frp: 'Carbon wrap', wing: 'Wing wall' },
    chap: ['Wood', 'Concrete'], easy: 'Easy', hard: 'Hard', hardTag: ' (hard)', hardOpenMsg: 'Hard mode unlocked for this chapter!',
    undo: '↶ Undo', go: 'Earthquake!', again: 'Rebuild', clear: 'Clear all', next: 'Next ▶',
    hint: {
      brace: 'Brace: tap a joint, then the opposite corner of the same wall bay', braceB: 'Now tap the green joint (tap empty space to cancel)',
      ply: 'Plywood: tap a wall bay to sheathe it (tap again to remove)', plate: 'Metal plate: tap a joint (at the base it is a hold-down)',
      post: 'Add post: tap a ghost joint — it splits a wide opening into bays you can brace', remove: 'Tap anything you added to remove it (refund)',
      steelx: 'Steel X-brace: tap a wall bay (between columns, one storey)', rcwall: 'RC shear wall: tap a wall bay — strongest, most expensive',
      jacket: 'Column jacket: tap a column — stronger in bending and shear', frp: 'Carbon-fiber wrap: tap a column — stops shear splitting (cheap)', wing: 'Wing wall: tap a column — short walls beside it, windows stay open',
    },
    deny: { same: 'Same joint', notBay: 'Braces go corner-to-corner inside ONE wall bay (no passing through members)', dup: 'Already there', door: 'That is a doorway', slope: 'Plywood needs a rectangular bay', money: 'Not enough money', gone: 'Not here' },
    shaking: 'Earthquake!', hold: 'Shaking stopped — stand for 5 s',
    win: 'Still standing!', lose: 'Collapsed!', dmg: 'Damage', cost: 'Cost', ref: 'Target',
    blocked: 'Window/shop front blocked: −1 ★',
    tips: {
      dir: (d, s) => `${s}nothing resists the ${d} direction — it fell that way. Quakes shake in every direction.`,
      twist: (s) => `${s}some wall lines have no bracing, so the house twisted around the strong walls. Balance opposite walls.`,
      weak: 'Braced both ways, but too weak. Single brace = 1, X-brace ≈ 2, plywood ≈ 2.8 — and braces loosen with every cycle.',
      none: 'With pinned joints the frame is a mechanism — nothing stops it leaning. Triangles (braces) or plywood walls do.',
      x: 'side-to-side (X)', z: 'front-to-back (Z)', story: (n) => `Floor ${n}: `,
      noneRC: 'The old concrete joints cracked one by one and the frame folded. Steel X-braces or shear walls take the load off the columns.',
      short: 'The short columns (under the window band) split in shear first. Wrap or jacket THOSE columns.',
      shear: 'Columns split in shear (brittle). Take the load off them with braces/walls, or wrap/jacket the columns.',
      twistRC: 'Brick walls on one side only, so the building twisted round them and the open side failed — brace the open side to balance it.',
      softRC: 'The open storey under the brick floors folded (soft storey). Brace that storey.',
      hingeRC: 'the column ends cracked open again and again until they could no longer hold (plastic hinges) and the storey folded.',
      deadCols: (n) => `It stood, but ${n} column${n > 1 ? 's' : ''} failed — badly damaged. `,
      pull: 'Brace-end nails pulled out — the wood held, the joint did not. Add metal plates at the brace ends. ',
      buckle: 'A brace was squeezed and bowed sideways (buckling). Pair it with one the other way (X). ',
      plyHold: 'A plywood wall needs hold-downs under the posts at BOTH ends — it rocked and yanked an end post out of the foundation. ',
    },
    fail: { shear: (s, short) => `Floor ${s} ${short ? 'short ' : ''}column shear failure`, hinge: (s) => `Floor ${s} column hinges gave out`, soft: (s) => `Floor ${s} (open storey) collapsed` },
    rebar: 'Rebar', rebarTip: 'Show rebar (R)',
  },
  ko: {
    title: '버텨라! 3D', left: '남은 돈',
    iLine: '예산 안에서 나무집을 보강하세요. 지진이 멈춘 뒤 5초 동안 서 있으면 성공!<br>끌면 돌려보기 · 휠/두 손가락으로 확대',
    iStart: '아무 데나 누르면 시작',
    tools: { brace: '가새', ply: '합판 벽', plate: '철물', post: '기둥 추가', remove: '빼기', steelx: '철골 X가새', rcwall: 'RC 전단벽', jacket: '기둥 단면 증설', frp: '탄소섬유 감기', wing: '날개벽' },
    chap: ['나무', '철근콘크리트'], easy: '쉬움', hard: '어려움', hardTag: ' (어려움)', hardOpenMsg: '이 장의 어려움 모드가 열렸어요!',
    undo: '↶ 되돌리기', go: '지진!', again: '다시 짓기', clear: '모두 지우기', next: '다음 ▶',
    hint: {
      brace: '가새: 절점을 누르고, 같은 벽 칸의 맞은편 모서리를 누르세요', braceB: '초록 절점을 누르세요 (빈 곳을 누르면 취소)',
      ply: '합판: 벽 칸을 누르면 합판을 댑니다 (다시 누르면 뺌)', plate: '철물: 절점을 누르세요 (밑동이면 홀다운)',
      post: '기둥 추가: 흐린 절점을 누르세요 — 넓은 개구부가 가새를 댈 수 있는 칸으로 나뉩니다', remove: '넣은 것을 누르면 빠지고 돈이 돌아옵니다',
      steelx: '철골 X가새: 벽 칸(기둥 사이, 한 층)을 누르세요', rcwall: 'RC 전단벽: 벽 칸을 누르세요 — 가장 세고 가장 비쌈',
      jacket: '기둥 단면 증설: 기둥을 누르세요 — 휨·전단 모두 강해짐', frp: '탄소섬유 감기: 기둥을 누르세요 — 빗금(전단) 파괴를 막음, 쌈', wing: '날개벽: 기둥을 누르세요 — 옆에 짧은 벽, 창은 그대로',
    },
    deny: { same: '같은 절점', notBay: '가새는 벽 칸 하나 안에서 모서리끼리만 (부재를 뚫고 지나갈 수 없어요)', dup: '이미 있어요', door: '문 자리예요', slope: '합판은 네모난 칸에만', money: '돈이 모자라요', gone: '여기엔 안 돼요' },
    shaking: '지진!', hold: '흔들림 멈춤 — 5초 버티기',
    win: '버텼다!', lose: '무너졌다!', dmg: '피해', cost: '쓴 돈', ref: '목표',
    blocked: '창·가게 앞을 막음: 별 −1',
    tips: {
      dir: (d, s) => `${s}${d} 방향을 막는 게 없어서 그쪽으로 쓰러졌어요. 지진은 모든 방향으로 흔들어요.`,
      twist: (s) => `${s}보강 없는 벽 줄이 있어서 센 벽을 축으로 비틀렸어요. 마주 보는 벽끼리 균형을 맞추세요.`,
      weak: '두 방향 다 보강했지만 약했어요. 가새 하나 = 1, X가새 ≈ 2, 합판 ≈ 2.8 — 가새는 흔들릴수록 헐거워져요.',
      none: '핀 접합 뼈대는 메커니즘 — 기우는 걸 막는 게 없어요. 삼각형(가새)이나 합판 벽이 막아 줍니다.',
      x: '좌우(X)', z: '앞뒤(Z)', story: (n) => `${n}층: `,
      noneRC: '오래된 콘크리트 접합부가 하나씩 금 가며 골조가 접혔어요. 철골 X가새나 전단벽이 기둥 대신 힘을 받아 줍니다.',
      short: '창 아래 허리벽 때문에 짧아진 기둥이 먼저 빗금으로 쪼개졌어요. 바로 그 기둥을 감거나 키우세요.',
      shear: '기둥이 빗금(전단)으로 쪼개졌어요(취성). 가새·벽으로 힘을 덜어주거나 기둥을 감고 키우세요.',
      twistRC: '벽돌이 한쪽에만 있어 건물이 비틀렸고 뚫린 쪽이 먼저 부서졌어요 — 반대쪽(뚫린 쪽)을 보강해 균형을 맞추세요.',
      softRC: '벽돌 층 아래 뚫린 층이 접혔어요(연약층·필로티). 그 층을 보강하세요.',
      hingeRC: '기둥 위아래가 금 가고 꺾이기를 되풀이하다 버티지 못해(소성힌지) 층이 접혔어요.',
      deadCols: (n) => `버티긴 했지만 기둥 ${n}개가 부서졌어요 — 피해가 커요. `,
      pull: '가새 끝 못이 뽑혔어요 — 나무는 멀쩡, 접합이 약했죠. 철물로 가새 끝 접합을 보강하세요. ',
      buckle: '가새가 눌려 옆으로 휘었어요(좌굴). 반대 방향 가새와 짝(X자)으로 넣으세요. ',
      plyHold: '합판벽은 양 끝 기둥 밑을 홀다운으로 잡아야 들리지 않아요 — 합판벽이 들썩이며 끝 기둥을 기초에서 뽑아 올렸어요. ',
    },
    fail: { shear: (s, short) => `${s}층 ${short ? '짧은 ' : ''}기둥 전단 파괴`, hinge: (s) => `${s}층 기둥 소성힌지 붕괴`, soft: (s) => s === 1 ? '필로티 층(1층) 붕괴' : `${s}층 연약층 붕괴` },
    rebar: '철근 보기', rebarTip: '철근 보기 (R)',
  },
}[LANG];
document.documentElement.lang = LANG;
const fmt = (krw, usd) => (KO ? '₩' + Math.round(krw).toLocaleString('ko-KR') : '$' + Math.round(usd ?? usdOf(krw)).toLocaleString('en-US'));
const r10k = (x) => Math.ceil(x / 10000) * 10000;
function budgetOf(L) {
  const ref = REFS[L.id]?.cost ?? 1e8;
  const krw = r10k(ref * (L.hard ? 1.1 : 2)); // 형 10/12: 쉬움 = 모범의 2배 · 어려움 = 1.1배
  return { krw, usd: Math.round(krw / 1350 / 5) * 5 };
}
const store = {
  get(k, d) { try { const v = localStorage.getItem('qr3d:' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('qr3d:' + k, JSON.stringify(v)); } catch (e) { /* 없음 */ } if (globalThis.CG) CG.dirty(); },
};

// ---------- 화면 기본
const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
const scene = new THREE.Scene();
const SKY = new THREE.Color('#cfe1ea');
scene.background = SKY;
scene.fog = new THREE.Fog(SKY, 34, 90);
const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 250);
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true; controls.dampingFactor = 0.08;
controls.maxPolarAngle = Math.PI * 0.47;
controls.enablePan = false;
scene.add(new THREE.HemisphereLight(0xe6f0ff, 0x8a7558, 1.1));
const sun = new THREE.DirectionalLight(0xfff0dc, 2.6);
sun.position.set(8, 14, 6);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -11, right: 11, top: 11, bottom: -11, near: 1, far: 40 });
sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.02;
scene.add(sun);
const ground = new THREE.Mesh(new THREE.CircleGeometry(90, 48), new THREE.MeshStandardMaterial({ color: 0x9aa676, roughness: 1 }));
ground.rotation.x = -Math.PI / 2; ground.position.y = -0.22; ground.receiveShadow = true; scene.add(ground);
const dirt = new THREE.Mesh(new THREE.CircleGeometry(1, 40), new THREE.MeshStandardMaterial({ color: 0xa48c6a, roughness: 1 }));
dirt.rotation.x = -Math.PI / 2; dirt.position.y = -0.215; dirt.receiveShadow = true; scene.add(dirt);
{
  const trunkM = new THREE.MeshStandardMaterial({ color: 0x6b4a2e, roughness: 1 });
  const leafM = new THREE.MeshStandardMaterial({ color: 0x5f7f4a, roughness: 1, flatShading: true });
  [[-15, -12], [-19, 2], [16, -14], [20, -3], [-8, -20], [9, -22], [-22, -8], [23, 7]].forEach(([x, z], i) => {
    const s = 0.9 + ((i * 37) % 10) / 12;
    const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.15 * s, 0.2 * s, 1.4 * s, 6), trunkM);
    tr.position.set(x, -0.22 + 0.7 * s, z); tr.castShadow = true; scene.add(tr);
    const lf = new THREE.Mesh(new THREE.ConeGeometry(1.2 * s, 3 * s, 7), leafM);
    lf.position.set(x, -0.22 + 2.6 * s, z); lf.castShadow = true; scene.add(lf);
  });
}

// ---------- 재료
const COLORS = { pad: 0xb9b5ad, earth: 0x9c8466, sill: 0x8a5a2b, post: 0xc98a4b, stud: 0xc08a50, beam: 0xb97a3e, header: 0xa9733c, floor: 0xb08955, rail: 0x8a5a2b, rafter: 0xa86b35, ridge: 0x9c6430, purlin: 0xb5773d, tile: 0x6d4c41, brace: 0xe0a35c, ply: 0xe6c88e, plate: 0xaab3bb,
  col: 0xb8b4ac, rbeam: 0xc4c0b8, slab: 0xbdb9b1, parapet: 0xc9c5bd, brick: 0xc98b6b, spandrel: 0xc0805f, rcwall: 0xd6d3cc, steel: 0x5f7a91, tank: 0x7f9db3, wing: 0xc7c3bb, jacket: 0xd4d0c8, frp: 0x2e2e30 };
function hash(s) { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return ((h >>> 0) % 1000) / 1000; }
function matFor(kind, seed, pre) {
  const c = new THREE.Color(COLORS[kind] ?? 0xcccccc);
  if (!['pad', 'plate', 'earth', 'steel', 'frp'].includes(kind)) { const r = hash(seed); c.offsetHSL((r - 0.5) * 0.02, (r - 0.5) * 0.08, (r - 0.5) * 0.07); }
  if (pre) c.offsetHSL(0, -0.15, -0.08); // 처음부터 있던 보강은 조금 어둡게
  const metal = kind === 'plate' || kind === 'steel';
  const m = new THREE.MeshStandardMaterial({ color: c, roughness: metal ? 0.4 : kind === 'frp' ? 0.5 : 0.85, metalness: metal ? 0.35 : 0 });
  m.userData.base = c.clone();
  return m;
}
const glassM = new THREE.MeshStandardMaterial({ color: 0x9fd3ea, transparent: true, opacity: 0.35, roughness: 0.1, depthWrite: false, side: THREE.DoubleSide });

// ---------- 상태
let lvIdx = Math.min(LEVELS.length - 1, Math.max(0, (+qs.get('level') || store.get('last', 1)) - 1));
let L = LEVELS[lvIdx];
let design = [];
let M = makeModel(L, design);
let tool = 'brace';
let phase = 'intro';
let sim = buildSim(L, design);
let selA = null;
let hoverNode = null, hoverBay = null;
const hut = new THREE.Group(); scene.add(hut);
const marks = new THREE.Group(); scene.add(marks);
let pickables = [];
let dots = {}, bayMeshes = {};

function disposeGroup(g) {
  while (g.children.length) {
    const c = g.children.pop();
    c.traverse((o) => { if (o.isMesh || o.isLine) { o.geometry?.dispose?.(); if (o.material !== glassM && o.material?.dispose && !o.userData.sharedMat) o.material.dispose(); } });
  }
}
function buildView() {
  disposeGroup(hut);
  pickables = [];
  for (const part of sim.parts) {
    const g = new THREE.Group();
    part.shapes.forEach((sh, k) => {
      const kindV = sh.kind === 'col' && part.mod && part.mod !== 'wing' ? part.mod : sh.kind;
      const m = new THREE.Mesh(new THREE.BoxGeometry(sh.he[0] * 2, sh.he[1] * 2, sh.he[2] * 2), matFor(kindV, part.id + k, part.pre));
      m.userData.kind = kindV;
      m.position.set(...sh.off); m.quaternion.set(...sh.q);
      m.castShadow = sh.kind !== 'pad'; m.receiveShadow = true;
      if (part.item !== undefined) { m.userData.item = part.item; pickables.push(m); }
      g.add(m);
    });
    // 추가한 기둥은 빼기 도구로 누를 수 있게
    if (part.kind === 'post') {
      const idx = design.findIndex((d) => d.t === 'post' && 'p' + d.node === part.id);
      if (idx >= 0) { g.children[0].userData.item = idx; pickables.push(g.children[0]); }
    }
    for (const pl of part.plates || []) {
      const local = part.body.pointToLocalFrame(new C.Vec3(...pl.p));
      const top = M.nodes[pl.node].j > 0;
      const m = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.26, 0.17), matFor('plate', pl.node));
      m.position.set(local.x, local.y + (top ? -0.1 : 0.14), local.z);
      m.castShadow = true;
      if (pl.item !== undefined) { m.userData.item = pl.item; pickables.push(m); }
      g.add(m);
    }
    part.view = g;
    hut.add(g);
  }
  // 창(유리) — 위층 강막에 매달아 같이 흔들리게
  for (const b of M.bays) {
    if (!b.window) continue;
    const covered = [...(L.pre || []), ...design].some((d) => (d.t === 'ply' && d.bay === b.id));
    if (covered) continue;
    const up = sim.levels[b.s + 1];
    const part = sim.parts.find((p) => p.body === up);
    const p0 = M.nodes[b.b0].p, p1 = M.nodes[b.t1].p;
    const c = new C.Vec3((p0[0] + p1[0]) / 2 + b.normal[0] * 0.02, (p0[1] + p1[1]) / 2 + 0.1, (p0[2] + p1[2]) / 2 + b.normal[2] * 0.02);
    const local = up.pointToLocalFrame(c);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(b.w - 0.3, b.h - 0.9), glassM);
    m.userData.sharedMat = true;
    m.position.set(local.x, local.y, local.z);
    m.lookAt(new THREE.Vector3(local.x + b.normal[0], local.y, local.z + b.normal[2]));
    part.view.add(m);
  }
  buildDamageVis(); applyRebar();
  syncView();
}
function syncView() {
  for (const p of sim.parts) { p.view.position.copy(p.body.position); p.view.quaternion.copy(p.body.quaternion); }
}

// ---------- 절점 점 · 벽 칸
const dotGeo = new THREE.SphereGeometry(0.085, 16, 12);
const hitGeo = new THREE.SphereGeometry(0.28, 8, 6);
let colDots = {};
function buildMarks() {
  disposeGroup(marks);
  dots = {}; bayMeshes = {}; colDots = {};
  if (L.mat === 'rc') for (const p of M.posts) {
    const a = M.nodes[p.a].p, b = M.nodes[p.b].p;
    const m = new THREE.Mesh(dotGeo, new THREE.MeshBasicMaterial({ color: 0xffffff, depthTest: false, transparent: true, opacity: 0.95 }));
    m.renderOrder = 10; m.scale.setScalar(1.6);
    m.position.set(a[0], (a[1] + b[1]) / 2, a[2]);
    colDots[p.a] = m; marks.add(m);
  }
  for (const id of Object.keys(M.nodes)) {
    const m = new THREE.Mesh(dotGeo, new THREE.MeshBasicMaterial({ color: 0xffffff, depthTest: false, transparent: true, opacity: 0.95 }));
    m.renderOrder = 10; m.userData.sharedGeo = true;
    const hit = new THREE.Mesh(hitGeo, new THREE.MeshBasicMaterial({ visible: false }));
    hit.userData.node = id;
    m.add(hit);
    m.position.set(...M.nodes[id].p);
    dots[id] = m; marks.add(m);
  }
  for (const b of M.bays) {
    if (b.door) continue;
    const q = [b.b0, b.b1, b.t1, b.t0].map((id) => new THREE.Vector3(...M.nodes[id].p).add(new THREE.Vector3(...b.normal).multiplyScalar(0.15)));
    const geo = new THREE.BufferGeometry().setFromPoints([q[0], q[1], q[2], q[0], q[2], q[3]]);
    const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0xffd27a, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide }));
    m.userData.bay = b.id; m.renderOrder = 5;
    bayMeshes[b.id] = m; marks.add(m);
  }
}
const previewGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
const preview = new THREE.Line(previewGeo, new THREE.LineDashedMaterial({ color: 0xffffff, dashSize: 0.12, gapSize: 0.08, depthTest: false }));
preview.renderOrder = 12; preview.visible = false; scene.add(preview);

const allItems = () => [...(L.pre || []), ...design];
function refreshMarkers() {
  const building = phase === 'build';
  for (const [id, d] of Object.entries(dots)) {
    const slot = M.postSlots.includes(id);
    d.visible = L.mat !== 'rc' && building && ((tool === 'brace' || tool === 'plate') && !slot || tool === 'post' && slot);
    let col = 0xffffff, op = 0.95;
    if (tool === 'post') { col = 0xbfe8ff; op = 0.7; }
    if (tool === 'brace' && selA) col = id === selA ? 0xff8a3d : checkItem(M, design, { t: 'brace', a: selA, b: id }) ? 0x9aa0a6 : 0x6fe08a;
    if (tool === 'brace' && selA && id !== selA && checkItem(M, design, { t: 'brace', a: selA, b: id })) op = 0.35;
    if (tool === 'plate' && allItems().some((x) => x.t === 'plate' && x.node === id)) col = 0x8d969e;
    if (id === hoverNode) col = tool === 'brace' && selA && id !== selA && checkItem(M, design, { t: 'brace', a: selA, b: id }) ? 0xff6b6b : 0xffd27a;
    d.material.color.setHex(col); d.material.opacity = op;
    d.scale.setScalar(id === hoverNode || id === selA ? 1.35 : 1);
  }
  for (const [id, m] of Object.entries(colDots)) {
    const mod = allItems().find((x) => COL_TOOLS.includes(x.t) && x.col === id);
    m.visible = building && COL_TOOLS.includes(tool);
    m.material.color.setHex(id === hoverNode ? 0xffd27a : mod ? (mod.t === tool ? 0x6fe08a : 0x9aa0a6) : 0xffffff);
  }
  for (const [id, m] of Object.entries(bayMeshes)) {
    const b = M.bayById[id];
    const has = allItems().some((x) => BAY_TOOLS.includes(x.t) && x.bay === id);
    m.visible = building && BAY_TOOLS.includes(tool) && b.rect && (L.mat === 'rc') === (tool !== 'ply');
    m.material.color.setHex(b.window ? 0x9fd3ea : 0xffd27a);
    m.material.opacity = id === hoverBay ? 0.4 : has ? 0 : 0.1;
  }
  preview.visible = building && tool === 'brace' && !!selA && !!hoverNode && hoverNode !== selA;
  if (preview.visible) {
    previewGeo.setFromPoints([new THREE.Vector3(...M.nodes[selA].p), new THREE.Vector3(...M.nodes[hoverNode].p)]);
    preview.computeLineDistances();
    preview.material.color.setHex(checkItem(M, design, { t: 'brace', a: selA, b: hoverNode }) ? 0xff6b6b : 0x6fe08a);
  }
}

// ---------- HUD
const $ = (id) => document.getElementById(id);
document.title = TXT.title; $('iTitle').textContent = TXT.title; $('iLine').innerHTML = TXT.iLine; $('iStart').textContent = TXT.iStart;
$('undo').textContent = TXT.undo; $('go').textContent = TXT.go; $('again').textContent = TXT.again; $('clear').textContent = TXT.clear; $('next').textContent = TXT.next;
document.querySelectorAll('.tool').forEach((b) => {
  const t = b.dataset.tool;
  b.querySelector('.nm').textContent = TXT.tools[t];
  b.addEventListener('click', () => { if (phase !== 'build') return; tool = t; selA = null; sfx.init(); updateHud(); });
});
function toolPriceLabel(t) {
  if (t === 'plate') return fmt(40000, 30);
  if (t === 'brace') return KO ? '₩3만+2만/m' : '$20+15/m';
  if (t === 'ply') return KO ? '₩6만+4만/㎡' : '$45+30/m²';
  if (t === 'post') return KO ? '₩6만+4만/m' : '$45+30/m';
  if (t === 'steelx') return KO ? '₩200만+50만/㎡' : '$1.5k+370/m²';
  if (t === 'rcwall') return KO ? '₩300만+70만/㎡' : '$2.2k+520/m²';
  if (t === 'jacket') return KO ? '₩150만+150만/m' : '$1.1k+1.1k/m';
  if (t === 'frp') return KO ? '₩50만+60만/m' : '$370+440/m';
  if (t === 'wing') return KO ? '₩100만+90만/m' : '$740+670/m';
  return '';
}
// 판 열림: 허브 진행(QRHUB.isOpen) — 어려움은 그 장 쉬움을 다 깨야 열림. ?unlock=all 이면 모두
const levelOpen = (i) => !globalThis.QRHUB || hubForce || QRHUB.isOpen('3d', i + 1, hubForce);
let viewHard = false; // 판 고르기에서 보고 있는 모드
function buildLevelBar() {
  const bar = $('levels'); bar.innerHTML = '';
  const modeRow = document.createElement('div'); modeRow.className = 'lvrow mode';
  [false, true].forEach((h) => {
    const b = document.createElement('button');
    b.className = 'lv modebtn' + (viewHard === h ? ' on' : ''); b.dataset.mode = h ? 'hard' : 'easy';
    const locked = h && ![9, 19].some((k) => levelOpen(k + 20));
    b.textContent = (h ? TXT.hard : TXT.easy) + (locked ? ' 🔒' : '');
    b.addEventListener('click', () => { viewHard = h; buildLevelBar(); });
    modeRow.appendChild(b);
  });
  bar.appendChild(modeRow);
  const rows = [document.createElement('div'), document.createElement('div')];
  rows.forEach((r, n) => { r.className = 'lvrow'; const c = document.createElement('span'); c.className = 'chap'; c.textContent = TXT.chap[n]; r.appendChild(c); bar.appendChild(r); });
  LEVELS.forEach((lv, i) => {
    if (!!lv.hard !== viewHard) return;
    const b = document.createElement('button');
    const st = store.get('stars:' + lv.id, 0);
    b.className = 'lv' + (i === lvIdx ? ' on' : '') + (lv.hard ? ' hard' : '');
    b.dataset.n = i + 1;
    b.innerHTML = `${lv.hard ? i - 19 : i + 1}<span class="st">${'★'.repeat(st)}</span>`;
    b.title = t2(lv.name) + (lv.hard ? TXT.hardTag : '');
    if (i !== lvIdx && !levelOpen(i)) { b.disabled = true; b.style.opacity = '.35'; b.title += ' 🔒'; }
    b.addEventListener('click', () => { if (phase === 'quake') return; loadLevel(i); });
    rows[lv.mat === 'rc' ? 1 : 0].appendChild(b);
  });
}
let flash = null;
function hint(msg, bad) {
  $('hint').textContent = msg; $('hint').style.color = bad ? '#ffb3a3' : '#fff';
  if (bad) { clearTimeout(flash); flash = setTimeout(() => updateHud(), 1600); }
}
const spentNow = () => costOf(L, design);
function updateHud() {
  const B = budgetOf(L), sp = spentNow();
  const left = B.krw - sp.krw, leftUsd = B.usd - sp.usd;
  $('money').innerHTML = `<small>${TXT.left} / ${fmt(B.krw, B.usd)}</small>${fmt(left, leftUsd)}`;
  document.querySelectorAll('.tool').forEach((b) => {
    const t = b.dataset.tool;
    b.querySelector('.cs').textContent = toolPriceLabel(t);
    b.classList.toggle('on', t === tool);
    b.disabled = phase !== 'build' || (t === 'post' && !M.postSlots.length && !design.some((d) => d.t === 'post'));
    const rcT = b.classList.contains('rc'), woodT = b.classList.contains('wood');
    b.style.display = (t === 'post' && !(L.noPost || []).length) || (rcT && L.mat !== 'rc') || (woodT && L.mat === 'rc') ? 'none' : '';
  });
  $('undo').disabled = phase !== 'build' || !design.length;
  $('go').disabled = phase !== 'build';
  $('bar').style.visibility = phase === 'quake' ? 'hidden' : 'visible';
  $('rebarBtn').style.display = L.mat === 'rc' ? '' : 'none'; $('rebarBtn').textContent = TXT.rebar; $('rebarBtn').title = TXT.rebarTip;
  $('lvName').textContent = `${L.hard ? lvIdx - 19 : lvIdx + 1}. ${t2(L.name)}${L.hard ? TXT.hardTag : ''}`;
  $('lvLesson').textContent = t2(L.lesson);
  if (phase === 'build') hint(tool === 'brace' && selA ? TXT.hint.braceB : TXT.hint[tool]);
  else hint('');
  refreshMarkers();
}
function moneyBad() { $('money').classList.add('bad'); setTimeout(() => $('money').classList.remove('bad'), 500); }

function setDesign(d) {
  dust.forEach((s) => { s.visible = false; }); clearChunks();
  design = cleanDesign(L, d.map((x) => ({ ...x })));
  M = makeModel(L, design);
  sim = buildSim(L, design);
  buildView(); buildMarks(); updateHud();
}
function addItem(item) {
  const why = checkItem(M, design, item);
  if (why) { sfx.deny(); hint(TXT.deny[why] || why, true); return false; }
  const p = priceOf(M, item), B = budgetOf(L);
  if (spentNow().krw + p.krw > B.krw) { sfx.deny(); moneyBad(); hint(TXT.deny.money, true); return false; }
  setDesign([...design, item]); sfx.place();
  hint(`${TXT.tools[item.t]} −${fmt(p.krw, p.usd)}`);
  setTimeout(() => { if (phase === 'build') updateHud(); }, 1200);
  return true;
}
function removeItem(idx) {
  if (idx == null || idx < 0) return;
  const d = design.slice(); d.splice(idx, 1); sfx.remove(); setDesign(d);
}
$('undo').addEventListener('click', () => { if (phase === 'build' && design.length) removeItem(design.length - 1); });
$('mute').addEventListener('click', () => { sfx.init(); $('mute').textContent = sfx.toggle() ? '🔇' : '🔊'; });

function frameCamera() {
  const { x0, x1, z0, z1 } = M.bbox;
  const top = M.levelY[M.S] + 1;
  const size = Math.max(x1 - x0, z1 - z0, top * 1.15);
  controls.target.set((x0 + x1) / 2, top * 0.45, (z0 + z1) / 2);
  const d = 1.55 * size + 4.5;
  camera.position.set(controls.target.x + d * 0.62, top * 0.55 + d * 0.38, controls.target.z + d * 0.72);
  controls.minDistance = size * 0.8; controls.maxDistance = size * 4 + 8;
  const r = Math.max(x1 - x0, z1 - z0) / 2 + 2.5;
  dirt.scale.setScalar(r);
}
function loadLevel(i) {
  lvIdx = i; L = LEVELS[i]; store.set('last', i + 1); viewHard = !!L.hard;
  if (globalThis.QRHUB) QRHUB.setLast('3d', i + 1);
  phase = phase === 'intro' ? 'intro' : 'build';
  if (phase === 'build') CG.gameplayStart();
  $('result').classList.add('hide'); $('banner').innerHTML = '';
  selA = null; tool = L.mat === 'rc' ? 'steelx' : 'brace'; if (L.mat !== 'rc') rebarOn = false;
  setDesign([]); frameCamera(); buildLevelBar();
}

// ---------- 누르기
const ray = new THREE.Raycaster();
const ptr = new THREE.Vector2();
function pick(ev, objs) {
  const r = canvas.getBoundingClientRect();
  ptr.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
  ray.setFromCamera(ptr, camera);
  return ray.intersectObjects(objs, false)[0];
}
const hitObjs = () => Object.values(dots).filter((d) => d.visible).map((d) => d.children[0]);
// 절점 고르기: 화면에서 손가락/커서에 가장 가까운 점 (뒤쪽 점도 고를 수 있게). 가새 두 번째 점은 맞는 점을 먼저
const _v = new THREE.Vector3();
function pickNode(ev) {
  const r = canvas.getBoundingClientRect();
  const lim = ev.pointerType === 'touch' ? 34 : 22;
  let best = null, bd = Infinity;
  for (const [id, d] of Object.entries(dots)) {
    if (!d.visible) continue;
    _v.copy(d.position).project(camera);
    const x = r.left + (_v.x + 1) / 2 * r.width, y = r.top + (1 - _v.y) / 2 * r.height;
    let dd = Math.hypot(x - ev.clientX, y - ev.clientY);
    if (tool === 'brace' && selA && id !== selA && checkItem(M, design, { t: 'brace', a: selA, b: id })) dd += 14;
    if (dd < lim && dd < bd) { bd = dd; best = id; }
  }
  return best;
}
function pickCol(ev) {
  const r = canvas.getBoundingClientRect();
  const lim = ev.pointerType === 'touch' ? 40 : 28;
  let best = null, bd = Infinity;
  for (const [id, d] of Object.entries(colDots)) {
    if (!d.visible) continue;
    _v.copy(d.position).project(camera);
    const x = r.left + (_v.x + 1) / 2 * r.width, y = r.top + (1 - _v.y) / 2 * r.height;
    const dd = Math.hypot(x - ev.clientX, y - ev.clientY);
    if (dd < lim && dd < bd) { bd = dd; best = id; }
  }
  return best;
}
function onHover(ev) {
  if (phase !== 'build') return;
  let n = null, w = null;
  if (COL_TOOLS.includes(tool)) {
    n = pickCol(ev);
    if (n !== hoverNode) { hoverNode = n; refreshMarkers(); if (n) { const p = priceOf(M, { t: tool, col: n }); hint(`${TXT.tools[tool]} ${fmt(p.krw, p.usd)}`); } }
    return;
  }
  if (tool === 'brace' || tool === 'plate' || tool === 'post') n = pickNode(ev);
  if (BAY_TOOLS.includes(tool)) { const h = pick(ev, Object.values(bayMeshes).filter((m) => m.visible)); w = h ? h.object.userData.bay : null; }
  if (tool === 'remove') {
    const h = pick(ev, pickables);
    pickables.forEach((m) => m.material.emissive?.setHex(h && m.userData.item === h.object.userData.item ? 0x661111 : 0));
  }
  if (n !== hoverNode || w !== hoverBay) {
    hoverNode = n; hoverBay = w; refreshMarkers();
    if (tool === 'brace' && selA && n && n !== selA && !checkItem(M, design, { t: 'brace', a: selA, b: n })) { const p = priceOf(M, { t: 'brace', a: selA, b: n }); hint(`${TXT.tools.brace} ${fmt(p.krw, p.usd)}`); }
    if (BAY_TOOLS.includes(tool) && w) { const p = priceOf(M, { t: tool, bay: w }); hint(`${TXT.tools[tool]} ${fmt(p.krw, p.usd)}${M.bayById[w].window ? ' · ' + TXT.blocked : ''}`); }
  }
}
function onTap(ev) {
  if (phase === 'intro') return startGame();
  if (phase !== 'build') return;
  sfx.init();
  if (tool === 'brace') {
    const n = pickNode(ev);
    if (!n) { selA = null; return updateHud(); }
    if (!selA) { selA = n; sfx.place(); return updateHud(); }
    if (n === selA) { selA = null; return updateHud(); }
    const a = selA; selA = null;
    if (!addItem({ t: 'brace', a, b: n })) refreshMarkers();
  } else if (tool === 'plate') {
    const n = pickNode(ev);
    if (!n) return;
    const i = design.findIndex((x) => x.t === 'plate' && x.node === n);
    if (i >= 0) removeItem(i); else if (addItem({ t: 'plate', node: n })) sfx.clank();
  } else if (tool === 'post') {
    const n = pickNode(ev);
    if (n) addItem({ t: 'post', node: n });
  } else if (BAY_TOOLS.includes(tool)) {
    const h = pick(ev, Object.values(bayMeshes).filter((m) => m.visible)); const w = h && h.object.userData.bay;
    if (!w) return;
    const i = design.findIndex((x) => x.t === tool && x.bay === w);
    if (i >= 0) removeItem(i); else addItem({ t: tool, bay: w });
  } else if (COL_TOOLS.includes(tool)) {
    const n = pickCol(ev);
    if (!n) return;
    const i = design.findIndex((x) => COL_TOOLS.includes(x.t) && x.col === n);
    if (i >= 0 && design[i].t === tool) removeItem(i);
    else if (i >= 0) { const d = design.slice(); d[i] = { t: tool, col: n }; const before = spentNow().krw; const after = costOf(L, d).krw; if (after > budgetOf(L).krw) { sfx.deny(); moneyBad(); hint(TXT.deny.money, true); } else { setDesign(d); sfx.place(); void before; } }
    else addItem({ t: tool, col: n });
  } else if (tool === 'remove') {
    const h = pick(ev, pickables);
    if (h) removeItem(h.object.userData.item);
  }
}
let down = null;
canvas.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY, t: performance.now() }; });
canvas.addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse') onHover(e); });
canvas.addEventListener('pointerup', (e) => {
  if (!down) return;
  const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
  if (moved < 8 && performance.now() - down.t < 600) { if (e.pointerType !== 'mouse') onHover(e); onTap(e); }
  down = null;
});
addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { selA = null; updateHud(); }
  if ((e.metaKey || e.ctrlKey) && e.key === 'z') $('undo').click();
  if ((e.key === 'r' || e.key === 'R' || e.key === 'ㄱ') && !e.metaKey && !e.ctrlKey && L.mat === 'rc' && phase !== 'intro') setRebar(!rebarOn);
  const k = (L.mat === 'rc' ? { 1: 'steelx', 2: 'rcwall', 3: 'jacket', 4: 'frp', 5: 'wing', 6: 'remove' } : { 1: 'brace', 2: 'ply', 3: 'plate', 4: 'post', 5: 'remove' })[e.key];
  if (k && phase === 'build') { tool = k; selA = null; updateHud(); }
});
$('intro').addEventListener('pointerup', () => startGame());
function startGame() {
  if (phase !== 'intro') return;
  sfx.init(); $('intro').classList.add('hide'); phase = 'build'; CG.gameplayStart(); updateHud();
}

// ---------- 먼지
const dustTex = (() => {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 2, 32, 32, 31);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.5, 'rgba(255,255,255,.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
})();
const dust = [];
for (let i = 0; i < 160; i++) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: dustTex, color: 0xcdb99a, transparent: true, opacity: 0, depthWrite: false }));
  s.visible = false; s.userData = { life: 0 }; scene.add(s); dust.push(s);
}
let dustI = 0;
function puff(pos, n = 10, power = 1) {
  for (let i = 0; i < n; i++) {
    const s = dust[dustI++ % dust.length];
    const a = Math.random() * Math.PI * 2, sp = (0.4 + Math.random() * 1.4) * power;
    s.position.set(pos[0] + (Math.random() - 0.5) * 0.3, Math.max(-0.1, pos[1]) + Math.random() * 0.2, pos[2] + (Math.random() - 0.5) * 0.3);
    s.userData = { life: 0, max: 1.2 + Math.random() * 1.2, v: [Math.cos(a) * sp, 0.3 + Math.random() * 0.9 * power, Math.sin(a) * sp], s0: 0.25 + Math.random() * 0.3 };
    s.material.color.setHSL(0.09, 0.2 + Math.random() * 0.1, 0.62 + Math.random() * 0.15);
    s.visible = true;
  }
}
function updateDust(dt) {
  for (const s of dust) {
    if (!s.visible) continue;
    const u = s.userData; u.life += dt;
    const k = u.life / u.max;
    if (k >= 1) { s.visible = false; continue; }
    s.position.x += u.v[0] * dt; s.position.y += u.v[1] * dt; s.position.z += u.v[2] * dt;
    u.v[0] *= 0.96; u.v[2] *= 0.96; u.v[1] *= 0.97;
    s.scale.setScalar(u.s0 + k * 1.6);
    s.material.opacity = 0.55 * (1 - k) * Math.min(1, u.life * 8);
  }
}

// ---------- 콘크리트 피해 표시: 실금 → 빗금 → 박락 → 전단 X, 벽돌 금·조각, 그리고 철근 보기
const crackM = new THREE.LineBasicMaterial({ color: 0x2a2420 });
const crackM2 = new THREE.LineBasicMaterial({ color: 0x1a1512 });
const segs = (pts) => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3)); return g; };
// 면(±x, ±z) 위의 2D 선 (u = 면 가로, v = 세로) → 3D 점
function faceLines(hx, hz, lines2d, faces = ['+x', '-x', '+z', '-z']) {
  const out = [];
  for (const f of faces) {
    const e = 0.008;
    for (const [u0, v0, u1, v1] of lines2d) {
      const P = (u, v) => (f === '+x' ? [hx + e, v, u * hz] : f === '-x' ? [-hx - e, v, -u * hz] : f === '+z' ? [-u * hx, v, hz + e] : [u * hx, v, -hz - e]);
      out.push(...P(u0, v0), ...P(u1, v1));
    }
  }
  return out;
}
function colCracks(he) {
  const [hx, hy, hz] = he, top = hy, bot = -hy;
  const st = [];
  // 1 실금: 위·아래 끝 가로 금
  const l1 = []; for (const y of [0.12, 0.3, 0.5]) { l1.push([-0.8, top - y, 0.6, top - y - 0.01], [-0.6, bot + y, 0.8, bot + y + 0.01]); }
  st.push(l1);
  // 2 항복: 끝부분 빗금
  const l2 = []; for (const y of [0.25, 0.55]) { l2.push([-0.9, top - y, 0.9, top - y - 0.35], [-0.9, bot + y + 0.35, 0.9, bot + y]); }
  st.push(l2);
  // 3 박락: 끝 X
  st.push([[-0.95, top - 0.1, 0.95, top - 0.7], [0.95, top - 0.1, -0.95, top - 0.7], [-0.95, bot + 0.7, 0.95, bot + 0.1], [0.95, bot + 0.7, -0.95, bot + 0.1]]);
  // 5 전단: 몸통 가운데 큰 X (빗금 파괴)
  const m = Math.min(hy * 0.7, 1.1);
  st.push([[-1, m, 1, -m], [1, m, -1, -m], [-1, m * 0.5, 0.4, -m], [0.6, m, -1, -m * 0.3]]);
  return st.map((l) => faceLines(hx, hz, l));
}
let rcVis = []; // { c, groups:[...], mats }
let brickVis = [];
function buildDamageVis() {
  rcVis = []; brickVis = [];
  if (L.mat !== 'rc') return;
  for (const c of sim.rcCols) {
    const he = c.part.shapes[0].he;
    const st = colCracks(he).map((pts, i) => { const ls = new THREE.LineSegments(segs(pts), i >= 2 ? crackM2 : crackM); ls.visible = false; c.part.view.add(ls); return ls; });
    // 보 끝 금 (위 강막에 붙임): 기둥이 항복하면 보 아래쪽에 세로 금
    const up = sim.parts.find((p) => p.body === c.upB);
    let beam = null;
    if (up) {
      const node = sim.M.nodes[c.id.replace(/,(\d+)$/, (m, j) => ',' + (+j + 1))];
      if (node) {
        const lp = c.upB.pointToLocalFrame(new C.Vec3(...node.p));
        const pts = [];
        const [i, k, j] = c.id.split(',').map(Number);
        const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([di, dk]) => sim.M.nodes[`${i + di},${k + dk},${j + 1}`]);
        for (const [di, dk] of dirs) for (const r of [0.4, 0.65, 0.9]) for (const side of [-1, 1]) {
          const x = lp.x + di * r + (dk ? side * 0.19 : 0), z = lp.z + dk * r + (di ? side * 0.19 : 0);
          pts.push(x, lp.y - 0.42, z, x + (di || 0) * 0.05, lp.y - 0.05, z + (dk || 0) * 0.05);
        }
        beam = new THREE.LineSegments(segs(pts), crackM); beam.visible = false; up.view.add(beam);
      }
    }
    rcVis.push({ c, st, beam });
  }
  for (const pn of sim.panels) {
    if (pn.kind !== 'brick') continue;
    const [hx, hy, hz] = pn.part.shapes[0].he;
    // 계단식 빗금 (줄눈 따라)
    const zig = (sx) => { const o = []; let x = -0.9 * sx, y = 0.9; const n = 7; for (let i = 0; i < n; i++) { const nx = x + sx * 1.8 / n, ny = y - 1.8 / n; o.push([x, y, nx, y], [nx, y, nx, ny]); x = nx; y = ny; } return o; };
    const mk = (l) => { const pts = []; for (const [u0, v0, u1, v1] of l) for (const zz of [hz + 0.01, -hz - 0.01]) pts.push(u0 * hx, v0 * hy, zz, u1 * hx, v1 * hy, zz); const ls = new THREE.LineSegments(segs(pts), crackM2); ls.visible = false; pn.part.view.add(ls); return ls; };
    brickVis.push({ pn, a: mk(zig(1)), b: mk(zig(-1)) });
  }
}
const grime = new THREE.Color(0x6e6258);
function updateDamageVis() {
  for (const v of rcVis) {
    const d = v.c.dmg || 0;
    v.st[0].visible = d >= 1; v.st[1].visible = d >= 2; v.st[2].visible = d >= 3; v.st[3].visible = !!v.c.sheared;
    if (v.beam) v.beam.visible = d >= 2;
  }
  for (const b of brickVis) {
    b.a.visible = !!b.pn.cracked; b.b.visible = (b.pn.cyc || 0) >= 2;
    const m = b.pn.part.view.children[0].material;
    if (m.userData.base) m.color.copy(m.userData.base).lerp(grime, Math.min(0.5, (b.pn.cracked ? 0.12 : 0) + 0.06 * (b.pn.cyc || 0)));
  }
}

// ---------- 떨어지는 조각 (벽돌·콘크리트)
const CHUNKS = 260;
const chunkMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(0.16, 0.08, 0.11), new THREE.MeshStandardMaterial({ roughness: 0.95 }), CHUNKS);
chunkMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); chunkMesh.castShadow = true; chunkMesh.frustumCulled = false; scene.add(chunkMesh);
const chunks = Array.from({ length: CHUNKS }, () => ({ on: false, p: new THREE.Vector3(), v: new THREE.Vector3(), r: new THREE.Euler(), w: new THREE.Vector3(), life: 0 }));
let chunkI = 0;
const _m4 = new THREE.Matrix4(), _q = new THREE.Quaternion(), _s0 = new THREE.Vector3(0, 0, 0), _s1 = new THREE.Vector3(1, 1, 1), _col = new THREE.Color();
for (let i = 0; i < CHUNKS; i++) { chunkMesh.setMatrixAt(i, _m4.compose(new THREE.Vector3(), _q, _s0)); chunkMesh.setColorAt(i, _col.set(0xc98b6b)); }
function spawnChunks(pos, n, brick) {
  for (let i = 0; i < n; i++) {
    const c = chunks[chunkI]; chunkMesh.setColorAt(chunkI, _col.set(brick ? 0xb5714f : 0xb7b2a9).offsetHSL(0, 0, (Math.random() - 0.5) * 0.12)); chunkI = (chunkI + 1) % CHUNKS;
    c.on = true; c.life = 0;
    c.p.set(pos[0] + (Math.random() - 0.5) * 1.6, pos[1] + (Math.random() - 0.2) * 1.2, pos[2] + (Math.random() - 0.5) * 1.6);
    c.v.set((Math.random() - 0.5) * 2.2, Math.random() * 1.2, (Math.random() - 0.5) * 2.2);
    c.w.set(Math.random() * 8, Math.random() * 8, Math.random() * 8);
  }
  chunkMesh.instanceColor.needsUpdate = true;
}
function updateChunks(dt) {
  let any = false;
  chunks.forEach((c, i) => {
    if (!c.on) return; any = true;
    c.life += dt;
    if (c.p.y > -0.18) { c.v.y -= 9.81 * dt; c.p.addScaledVector(c.v, dt); c.r.x += c.w.x * dt; c.r.y += c.w.y * dt; c.r.z += c.w.z * dt; }
    else { c.p.y = -0.18; c.v.set(0, 0, 0); }
    const sc = c.life > 6 ? Math.max(0, 1 - (c.life - 6)) : 1;
    if (sc <= 0) c.on = false;
    chunkMesh.setMatrixAt(i, _m4.compose(c.p, _q.setFromEuler(c.r), sc > 0 ? _s1.set(sc, sc, sc) : _s0));
  });
  if (any) chunkMesh.instanceMatrix.needsUpdate = true;
}
function clearChunks() { chunks.forEach((c, i) => { c.on = false; chunkMesh.setMatrixAt(i, _m4.compose(c.p, _q, _s0)); }); chunkMesh.instanceMatrix.needsUpdate = true; }

// ---------- 철근 보기 (콘크리트는 반투명, 안의 철근: 주근·띠철근(성기게 300mm, 90° 갈고리)·밑동 겹침이음, 보강 철근)
let rebarOn = false;
const rebarParts = []; // { c, bars, ties }
const OLD_BAR = 0x7a4a2e, NEW_BAR = 0x2f6fb0;
function rectRing(a, b, y, hook) {
  const p = [-a, y, -b, a, y, -b, a, y, -b, a, y, b, a, y, b, -a, y, b, -a, y, b, -a, y, -b];
  if (hook) p.push(-a, y, -b, -a + 0.09, y, -b, -a, y, -b, -a, y, -b + 0.09); // 90° 갈고리 (안으로 짧게 꺾임 — 135° 아님)
  return p;
}
function colRebar(part, c) {
  const g = new THREE.Group();
  const he = part.shapes[0].he, h = he[1];
  const w0 = (L.colW || 0.45) / 2 - 0.05;
  const barsP = [], tiesP = [], newP = [], newTie = [];
  for (const [x, z] of [[-1, -1], [1, -1], [1, 1], [-1, 1], [0, -1], [1, 0], [0, 1], [-1, 0]]) barsP.push(x * w0, -h, z * w0, x * w0, h, z * w0);
  // 밑동 겹침이음: 기초에서 올라온 다월 철근이 옆에 나란히 (0.9 m)
  for (const [x, z] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { const o = 0.03; barsP.push(x * (w0 - o), -h, z * (w0 - o), x * (w0 - o), -h + 0.9, z * (w0 - o)); }
  for (let y = -h + 0.1; y < h; y += 0.3) tiesP.push(...rectRing(w0 + 0.01, w0 + 0.01, y, true));
  const mod = part.mod;
  if (mod === 'jacket') {
    const w1 = he[0] - 0.05;
    for (let k = -2; k <= 2; k++) { const t = (k / 2) * w1; for (const [x, z] of [[t, -w1], [t, w1], [-w1, t], [w1, t]]) newP.push(x, -h, z, x, h, z); }
    for (let y = -h + 0.05; y < h; y += 0.1) newTie.push(...rectRing(w1 + 0.01, w1 + 0.01, y, false));
  }
  const mats = { bar: new THREE.LineBasicMaterial({ color: OLD_BAR, depthTest: true }), tie: new THREE.LineBasicMaterial({ color: OLD_BAR }) };
  g.add(new THREE.LineSegments(segs(barsP), mats.bar), new THREE.LineSegments(segs(tiesP), mats.tie));
  if (newP.length) { const nm = new THREE.LineBasicMaterial({ color: NEW_BAR }); g.add(new THREE.LineSegments(segs(newP), nm), new THREE.LineSegments(segs(newTie), nm)); }
  if (mod === 'frp') {
    // 탄소섬유 띠: 기둥 둘레 검은 띠
    const a = he[0] + 0.012, bands = [];
    for (let y = -h + 0.15; y < h - 0.05; y += 0.28) for (let d = 0; d < 0.13; d += 0.025) bands.push(...rectRing(a, a, y + d, false));
    g.add(new THREE.LineSegments(segs(bands), new THREE.LineBasicMaterial({ color: 0x111111 })));
  }
  if (mod === 'wing') {
    const nm = new THREE.LineBasicMaterial({ color: NEW_BAR }), mesh = [];
    for (const sh of part.shapes) {
      if (sh.kind !== 'wing') continue;
      const [ax, , az] = sh.he, [ox, , oz] = sh.off, along = ax > az ? 'x' : 'z', L2 = Math.max(ax, az), t = Math.min(ax, az) - 0.04;
      const P = (u, y, s) => (along === 'x' ? [ox + u, y, oz + s * t] : [ox + s * t, y, oz + u]);
      for (const s of [-1, 1]) {
        for (let u = -L2 + 0.05; u <= L2; u += 0.2) mesh.push(...P(u, -h, s), ...P(u, h, s));
        for (let y = -h + 0.1; y < h; y += 0.25) mesh.push(...P(-L2, y, s), ...P(L2, y, s));
      }
      // 기둥에 묶는 앵커 철근 (날개벽 → 기둥 속으로)
      const sg = along === 'x' ? Math.sign(ox) : Math.sign(oz);
      for (let y = -h + 0.3; y < h; y += 0.5) { const a0 = P(-sg * L2, y, 0), a1 = along === 'x' ? [ox - sg * (L2 + he[0] * 0.8), y, oz] : [ox, y, oz - sg * (L2 + he[2] * 0.8)]; mesh.push(...a0, ...a1); }
    }
    g.add(new THREE.LineSegments(segs(mesh), nm));
  }
  return { g, mats };
}
function beamRebar(sh) {
  const g = new THREE.Group(); g.position.set(...sh.off); g.quaternion.set(...sh.q);
  const [ax, ly, az] = sh.he, a = ax - 0.05, b = az - 0.05, bars = [], st = [];
  for (const [x, z] of [[-a, -b], [-a, b], [a, -b], [a, b]]) bars.push(x, -ly, z, x, ly, z);
  for (let y = -ly + 0.15; y < ly; y += 0.3) st.push(...rectRing(a + 0.01, b + 0.01, y, true));
  const m = new THREE.LineBasicMaterial({ color: OLD_BAR });
  g.add(new THREE.LineSegments(segs(bars), m), new THREE.LineSegments(segs(st), m));
  return g;
}
function wallMesh(sh, color) {
  const g = new THREE.Group(); g.position.set(...sh.off); g.quaternion.set(...sh.q);
  const [hx, hy, hz] = sh.he, p = [];
  for (const z of [hz - 0.05, -hz + 0.05]) {
    for (let x = -hx; x <= hx + 1e-6; x += 0.3) p.push(x, -hy, z, x, hy, z);
    for (let y = -hy; y <= hy + 1e-6; y += 0.3) p.push(-hx, y, z, hx, y, z);
  }
  g.add(new THREE.LineSegments(segs(p), new THREE.LineBasicMaterial({ color })));
  return g;
}
const SEE = { col: 0.22, jacket: 0.22, wing: 0.22, rbeam: 0.25, slab: 0.35, parapet: 0.35, rcwall: 0.25, brick: 0.5, spandrel: 0.45, frp: 0.3 };
function applyRebar() {
  rebarParts.length = 0;
  for (const p of sim.parts) {
    if (!p.view) continue;
    p.view.children.forEach((m) => {
      if (!m.isMesh || !m.userData.kind) return;
      const op = rebarOn && L.mat === 'rc' ? SEE[m.userData.kind] : undefined;
      m.material.transparent = op !== undefined; m.material.opacity = op ?? 1; m.material.depthWrite = op === undefined; m.material.needsUpdate = true;
      m.castShadow = op === undefined && m.userData.kind !== 'pad';
    });
  }
  // 이미 만든 철근 지우기
  for (const p of sim.parts) if (p.view) for (const ch of p.view.children.filter((o) => o.userData.rebar)) { p.view.remove(ch); ch.traverse((o) => { o.geometry?.dispose?.(); o.material?.dispose?.(); }); }
  if (!rebarOn || L.mat !== 'rc') return;
  for (const c of sim.rcCols) { const { g, mats } = colRebar(c.part, c); g.userData.rebar = true; c.part.view.add(g); rebarParts.push({ c, mats }); }
  for (const p of sim.parts) {
    if (p.kind === 'floor' || p.kind === 'roof') for (const sh of p.shapes) if (sh.kind === 'rbeam') { const g = beamRebar(sh); g.userData.rebar = true; p.view.add(g); }
    if (p.kind === 'rcwall') { const g = wallMesh(p.shapes[0], NEW_BAR); g.userData.rebar = true; p.view.add(g); }
  }
}
const _red = new THREE.Color(0xff2a1a), _org = new THREE.Color(0xff9a1a), _oldBar = new THREE.Color(OLD_BAR);
function updateRebar() {
  for (const r of rebarParts) {
    const c = r.c;
    // 띠철근이 벌어짐 → 전단 파괴 (빨강) / 주근: 항복 주황 → 소성힌지·파괴 빨강
    r.mats.tie.color.copy(c.sheared ? _red : c.dmg >= 3 ? _org : _oldBar);
    r.mats.bar.color.copy(c.sheared || c.hinged ? _red : c.yielded ? _org : _oldBar);
  }
}
function setRebar(on) {
  rebarOn = on && L.mat === 'rc';
  $('rebarBtn').classList.toggle('on', rebarOn);
  applyRebar();
}
$('rebarBtn').addEventListener('click', () => { sfx.init(); setRebar(!rebarOn); });

// ---------- 지진
let acc = 0, evIdx = 0, kick = 0, collapsedAt = null, lastCount = null, resultAt = null, lastResult = null;
function startQuake() {
  if (phase !== 'build') return;
  sfx.init();
  selA = null; hoverNode = hoverBay = null;
  phase = 'quake';
  sim = buildSim(L, design); sim.settle(); buildView();
  sim.startQuake();
  acc = 0; evIdx = 0; kick = 0; collapsedAt = null; lastCount = null; resultAt = null;
  updateHud();
  $('banner').innerHTML = `${TXT.shaking}<div class="meter"><i id="meterI"></i></div>`;
}
$('go').addEventListener('click', startQuake);

function handleEvents() {
  const evs = sim.events;
  for (; evIdx < evs.length; evIdx++) {
    const e = evs[evIdx];
    if (e.type === 'break' && (e.kind === 'shear' || e.kind === 'hinge')) { sfx.crash(true); puff(e.pos, 22, 1.1); spawnChunks(e.pos, 12, false); kick = Math.max(kick, 0.18); }
    else if (e.type === 'break') { sfx.crack(); puff(e.pos, e.big ? 14 : 8, 0.8); kick = Math.max(kick, e.big ? 0.12 : 0.06); if (e.big) sfx.crash(false); }
    else if (e.type === 'creak') sfx.creak();
    else if (e.type === 'dmg') {
      // 콘크리트·벽돌 피해 단계: 실금(조용히) → 항복(딱) → 박락(조각) / 벽돌 금 → 조각 → 통째로 빠짐
      if (e.kind === 'hairline') { if (Math.random() < 0.4) sfx.creak(); }
      else if (e.kind === 'yield') { sfx.crack(); puff(e.pos, 4, 0.5); }
      else if (e.kind === 'spall') { sfx.crack(); puff(e.pos, 8, 0.7); spawnChunks(e.pos, 5, false); }
      else if (e.kind === 'infillCrack') { sfx.crack(); puff(e.pos, 5, 0.5); spawnChunks(e.pos, 2, true); }
      else if (e.kind === 'bricks') { puff(e.pos, 4, 0.6); spawnChunks(e.pos, e.n || 3, true); }
      else if (e.kind === 'infillOut') { sfx.crash(false); puff(e.pos, 16, 1.0); spawnChunks(e.pos, e.n || 10, true); kick = Math.max(kick, 0.08); }
    }
    else if (e.type === 'thud') { sfx.crash(e.big); puff(e.pos, Math.round(6 + 16 * e.power), 0.6 + e.power); kick = Math.max(kick, 0.05 + 0.2 * e.power * (e.big ? 1.5 : 1)); }
  }
}
// 무엇이 먼저 부서졌나 (콘크리트) — 예: 「1층 기둥 전단 파괴」「필로티 층(1층) 붕괴」
function failLabel() {
  if (L.mat !== 'rc' || !sim.failInfo) return '';
  const f = sim.failInfo();
  if (f.soft && f.story >= 0) return TXT.fail.soft(f.story + 1);
  if (f.mode === 'shear') return TXT.fail.shear(f.s + 1, f.short);
  if (f.mode === 'hinge') return TXT.fail.hinge(f.s + 1);
  return '';
}
function tipFor(ok) {
  const dead = (sim.rcCols || []).filter((c) => c.sheared || c.hinged).length;
  if (ok) return (dead ? TXT.tips.deadCols(dead) + (failLabel() ? '(' + failLabel() + ') ' : '') : '') + t2(L.lesson);
  const lab = failLabel(), pre = lab ? lab + ' — ' : '';
  if (L.mat === 'rc') {
    const f = sim.failInfo();
    if (sim.rcCols.some((c) => c.sheared && c.short)) return pre + TXT.tips.short;
    if (f.soft) return pre + TXT.tips.softRC;
    const brick = (L.pre || []).some((d) => d.t === 'brick');
    if (brick && f.twist > 0.025) return pre + TXT.tips.twistRC;
  }
  // 나무: 무엇이 끊어졌나 먼저 (나무 자체가 아니라 가새 끝 접합이 뽑히거나, 가새가 눌려 휨)
  let woodPre = '';
  if (L.mat !== 'rc') {
    if (sim.joints.some((j) => j.broken && j.why === 'uplift' && j.plyEnd)) woodPre = TXT.tips.plyHold;
    else if (sim.braces.some((b) => b.why === 'pull')) woodPre = TXT.tips.pull;
    else if (sim.braces.some((b) => b.why === 'buckle')) woodPre = TXT.tips.buckle;
  }
  const cap = capacitySummary(L, design);
  const multi = cap.stories.length > 1;
  const nothing = cap.stories.every((s) => s.x === 0 && s.z === 0);
  const NONE = L.mat === 'rc' ? TXT.tips.noneRC : TXT.tips.none;
  if (nothing && !design.length) return pre + (L.mat === 'rc' && sim.rcCols.some((c) => c.hinged) && !sim.rcCols.some((c) => c.sheared) ? TXT.tips.hingeRC + ' ' : '') + NONE;
  for (let s = 0; s < cap.stories.length; s++) {
    const st = cap.stories[s], sp = multi ? TXT.tips.story(s + 1) : '';
    if (st.x === 0 && st.z === 0) return pre + woodPre + sp + NONE;
    if (st.x === 0 || st.z === 0) return pre + woodPre + TXT.tips.dir(st.x === 0 ? TXT.tips.x : TXT.tips.z, sp);
  }
  for (let s = 0; s < cap.stories.length; s++) if (cap.stories[s].empty > 0) return pre + woodPre + TXT.tips.twist(multi ? TXT.tips.story(s + 1) : '');
  if (sim.rcCols && sim.rcCols.some((c) => c.sheared)) return pre + TXT.tips.shear;
  if (sim.rcCols && sim.rcCols.some((c) => c.hinged)) return pre + TXT.tips.hingeRC;
  return pre + woodPre + TXT.tips.weak;
}
function result() {
  const ok = sim.maxDrop < 0.3;
  const damage = ok ? sim.damage() : 100;
  const cost = spentNow(), ref = REFS[L.id]?.cost ?? 1e8;
  const blocked = blocksWindow(L, design);
  const stars = starsFor({ ok, cost: cost.krw, refCost: ref, damage, blocked, hard: L.hard });
  // 저장 먼저 (화면·이동보다 앞서): 별 · 깬 판 기록
  if (stars > store.get('stars:' + L.id, 0)) store.set('stars:' + L.id, stars);
  if (ok && globalThis.QRHUB) QRHUB.markClear('3d', lvIdx + 1);
  // 통합판: 장의 마지막 판을 깨면 허브로 가는 단추
  const ce = ok && globalThis.QRHUB ? QRHUB.chapterEnd('3d', lvIdx + 1) : null;
  $('rHubMsg').style.display = ce ? 'block' : 'none';
  $('toHub').style.display = ce ? '' : 'none';
  if (ce) { $('rHubMsg').textContent = [!ce.hard && ce.hardOpen ? TXT.hardOpenMsg : '', ce.nextOpen ? (KO ? '다음 장 열림!' : 'Next chapter unlocked!') : (KO ? '이 장 끝!' : 'Chapter complete!')].filter(Boolean).join(' '); $('toHub').textContent = KO ? '메뉴로 →' : 'Go to menu →'; }
  $('rTitle').textContent = ok ? TXT.win : TXT.lose;
  $('rTitle').className = ok ? 'win' : 'lose';
  $('rStars').innerHTML = [1, 2, 3].map((i) => `<span class="${i <= stars ? 'on' : ''}">★</span>`).join('');
  $('rLine').innerHTML = `${TXT.dmg} <b>${damage}%</b> · ${TXT.cost} <b>${fmt(cost.krw, cost.usd)}</b> · ${TXT.ref} <b>${fmt(ref)}</b>` + (blocked ? `<br><small>${TXT.blocked}</small>` : '');
  $('rTip').textContent = '💡 ' + tipFor(ok);
  $('next').style.display = ok && nextIdx() !== null ? '' : 'none';
  $('result').classList.remove('hide');
  $('banner').innerHTML = '';
  ok ? sfx.win() : sfx.lose();
  phase = 'result'; CG.gameplayStop();
  if (ok && (stars === 3 || ce)) CG.happytime(); // 별 3개·장 끝 = 기쁜 순간
  lastResult = { level: L.id, stand: ok, drop: sim.maxDrop, damage, stars, cost: cost.krw, ref, tip: $('rTip').textContent, sway: sim.sway(), fail: failLabel(), failInfo: sim.failInfo ? sim.failInfo() : null };
  buildLevelBar();
  updateHud();
}
$('again').addEventListener('click', () => { $('result').classList.add('hide'); phase = 'build'; CG.gameplayStart(); setDesign(design); });
$('clear').addEventListener('click', () => { $('result').classList.add('hide'); phase = 'build'; CG.gameplayStart(); setDesign([]); });
$('toHub').addEventListener('click', () => CG.go('../index.html'));
$('menuBtn').addEventListener('click', (e) => { e.preventDefault(); CG.go('../index.html'); });
$('rotate').textContent = KO ? '↻ 휴대폰을 가로로 돌려 주세요' : '↻ Rotate your phone to landscape';
CG.onMute((m) => { sfx.setExt(m); $('mute').textContent = sfx.muted ? '🔇' : '🔊'; });
$('menuBtn').textContent = KO ? '← 메뉴' : '← Menu';
// 다음 판: 같은 모드 안에서, 열린 판만 (쉬움 20 → 끝 / 어려움 40 → 끝)
function nextIdx() { const j = lvIdx + 1; if (j >= LEVELS.length || !!LEVELS[j].hard !== !!L.hard) return null; return levelOpen(j) ? j : null; }
$('next').addEventListener('click', () => { const j = nextIdx(); if (j === null) return; phase = 'build'; loadLevel(j); });

function quakeTick() {
  const tq = sim.tq;
  const m = document.getElementById('meterI');
  if (m) m.style.width = Math.round(Math.min(1, sim.shake) * 100) + '%';
  if (tq >= sim.shakeEnd && tq < sim.quakeLen && collapsedAt === null) {
    const n = Math.ceil(sim.quakeLen - tq);
    if (n !== lastCount) {
      lastCount = n;
      const c = $('count'); c.textContent = n; c.classList.remove('pop'); void c.offsetWidth; c.classList.add('pop');
      sfx.tick();
      if (n === 5) $('banner').innerHTML = `<span class="calm">${TXT.hold}</span>`;
    }
  }
  if (collapsedAt === null && sim.drop() > 0.3) {
    collapsedAt = tq; sfx.crash(true); kick = 0.3; $('count').classList.remove('pop'); $('banner').innerHTML = '';
    sim.fadeAt = tq;
  }
  if (resultAt === null) {
    if (collapsedAt !== null) resultAt = collapsedAt + 2.6;
    else if (tq > sim.quakeLen + 0.2) resultAt = tq;
  }
  if (resultAt !== null && tq >= resultAt) { sim.tq = -1; result(); }
}

// ---------- 그리기
function resize() {
  const w = innerWidth, h = innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.fov = w / h < 1.2 ? 55 : 42;
  camera.updateProjectionMatrix();
}
addEventListener('resize', resize); resize();
const clock = new THREE.Clock();
const shakeOff = new THREE.Vector3();
const red = new THREE.Color(0xd8432b);
function frame() {
  requestAnimationFrame(frame);
  const dt = Math.min(0.05, clock.getDelta());
  if (phase === 'quake' || phase === 'result') {
    acc += dt * SPEED;
    let n = 0;
    const maxN = Math.ceil(10 * SPEED);
    while (acc >= TUNE.dt && n < maxN) { sim.step(); acc -= TUNE.dt; n++; if (phase === 'quake') quakeTick(); }
    if (n === maxN) acc = 0;
    handleEvents();
    syncView();
    for (const br of sim.braces) {
      const m = br.part.view.children[0].material;
      m.color.copy(m.userData.base).lerp(red, br.broken ? 0 : Math.min(1, br.ratio));
    }
    for (const c of sim.rcCols || []) {
      // 색: 힘 받는 만큼 붉게 + 금·박락이 쌓일수록 칙칙하게
      const m = c.part.view.children[0].material;
      m.color.copy(m.userData.base).lerp(grime, Math.min(0.55, 0.12 * (c.dmg || 0))).lerp(red, c.broken ? 0.15 : Math.min(0.8, (c.ratio || 0) * 0.7));
    }
    updateDamageVis(); updateRebar();
    sfx.rumble(sim.tq >= 0 ? sim.shake : 0);
  }
  updateDust(dt); updateChunks(dt);
  controls.update();
  const amp = (sim.tq >= 0 ? sim.shake * 0.025 : 0) + kick;
  kick *= Math.pow(0.02, dt);
  shakeOff.set((Math.random() - 0.5) * amp, (Math.random() - 0.5) * amp, (Math.random() - 0.5) * amp);
  camera.position.add(shakeOff);
  renderer.render(scene, camera);
  camera.position.sub(shakeOff);
}

loadLevel(lvIdx); frame();
requestAnimationFrame(() => requestAnimationFrame(() => CG.loadingStop())); // 첫 화면을 그린 뒤

// 시험용 손잡이
window.__qr = {
  load: (n) => { if (phase === 'intro') startGame(); phase = 'build'; loadLevel(n - 1); },
  setDesign: (d) => { if (phase === 'intro') startGame(); phase = 'build'; $('result').classList.add('hide'); setDesign(d); },
  ref: () => REFS[L.id]?.ref ?? [],
  quake: () => startQuake(),
  get phase() { return phase; },
  get result() { return lastResult; },
  get design() { return design; },
  get sim() { return sim; },
  get model() { return M; },
  project(id) {
    const v = new THREE.Vector3(...M.nodes[id].p).project(camera); const r = canvas.getBoundingClientRect();
    return { x: r.left + (v.x + 1) / 2 * r.width, y: r.top + (1 - v.y) / 2 * r.height };
  },
  projectBay(id) {
    const b = M.bayById[id]; const p0 = M.nodes[b.b0].p, p1 = M.nodes[b.t1].p;
    const v = new THREE.Vector3((p0[0] + p1[0]) / 2 + b.normal[0] * 0.15, (p0[1] + p1[1]) / 2, (p0[2] + p1[2]) / 2 + b.normal[2] * 0.15).project(camera); const r = canvas.getBoundingClientRect();
    return { x: r.left + (v.x + 1) / 2 * r.width, y: r.top + (1 - v.y) / 2 * r.height };
  },
  tool: (t) => { tool = t; selA = null; updateHud(); },
  rebar: (on) => setRebar(on),
  get rebarOn() { return rebarOn; },
  projectCol(id) {
    const d = colDots[id]; const v = d.position.clone().project(camera); const r = canvas.getBoundingClientRect();
    return { x: r.left + (v.x + 1) / 2 * r.width, y: r.top + (1 - v.y) / 2 * r.height };
  },
  key2,
};
