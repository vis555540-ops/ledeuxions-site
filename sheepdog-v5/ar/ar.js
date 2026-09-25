// ar.js — AR 산책 (2026-09-25). three.js r170 (ar/three.module.min.js, 받아 둔 것 — 빌드 없음)
// 흐름: 시작 → 어른 확인(두 자리 덧셈) → immersive-ar → 바닥 고리(레티클) → 톡 = 강아지 놓기
//       → 강아지가 폰이 보는 쪽으로 천천히 걸어감(뒷모습 4칸) · 발자국
//       → 🦮 빨간 줄(2026-09-25 형 「줄 하나 만들자. 너무 일찍 가면 폰 당기거나 그러면 진동 오게」):
//         줄 1.2m. 팽팽해지면 느려지고 멈춤 + 진동 60ms(1.5초에 한 번까지). 폰을 휙 뒤로 당기면 강아지가 끌려오고 진동 120ms.
//         내가 3초 넘게 멈춰 있으면 강아지가 앉아서 기다림.
//       → 🏠 강아지 집(딸 요청): 먼저 톡 = 집 놓기(게임에서 쓰는 집 그림, 없으면 박스 집) → 강아지가 집에서 쏙 나옴.
//         「집으로 가자」나 5분이 되면 줄을 풀고 집으로 걸어가 쏙 들어간 뒤 쉬는 시간.
// 안 되는 기기(아이폰·컴퓨터)는 안내 + 2D 미리보기만. 카메라 화면은 저장·전송하지 않는다.
import * as THREE from "./three.module.min.js";

const $ = (id) => document.getElementById(id);
const 그림들 = ["back_1", "back_2", "back_3", "back_4", "sit"];
const 이미지 = {};
for (const n of 그림들) { const im = new Image(); im.src = "ar/" + n + ".png"; 이미지[n] = im; }

const 돌아가기 = () => { location.href = "./"; };
for (const id of ["back1", "back3", "back4"]) $(id).onclick = 돌아가기;

// ── 쉬는 시간·놀이 시간 (2026-09-25 형 「AR 에 쉬는 시간 필수」)
//   AR 은 한 번에 5분 → 쉬는 화면으로 끝나고, 그 뒤 10분은 잠김(게임의 AR 버튼도 이 값을 읽는다).
//   이 페이지에 머문 시간은 게임 설정의 「놀이 시간」에 들어간다. 게임 저장 덩어리(양몰이_v5)는 읽기만 하고,
//   더할 초는 따로(sheepdog_ar_play) 적어 두면 게임이 켜질 때 합친다 — 뒤로가기로 되살아난 게임이 덮어쓰지 않게.
const AR최대초 = 5 * 60, 쉼초 = 10 * 60;
const 쓴키 = "sheepdog_ar_used", 쉼키 = "sheepdog_ar_rest_until", 놀이키 = "sheepdog_ar_play", 저장키 = "양몰이_v5";
const 오늘 = () => { const t = new Date(); return t.getFullYear() + "-" + String(t.getMonth() + 1).padStart(2, "0") + "-" + String(t.getDate()).padStart(2, "0"); };
const 읽기 = (k) => { try { return JSON.parse(localStorage.getItem(k) || "null"); } catch (e) { return null; } };
// 「그만하기」로 껐다 다시 켜도 5분이 새로 시작되지 않게: 10분 안에 다시 켜면 쓴 시간을 이어서 센다
function 앞서쓴초() { const u = 읽기(쓴키); return (u && Date.now() - u.마지막 < 쉼초 * 1000) ? (u.초 || 0) : 0; }
function 쉼남은초() { const u = +(localStorage.getItem(쉼키) || 0); return Math.max(0, Math.ceil((u - Date.now()) / 1000)); }
function 놀이끝났나() {
  const d = 읽기(저장키), n = d && d.놀이시간; if (!n || !n.분) return false;
  const t = 오늘(), r = 읽기(놀이키), 대기 = (r && r.날 === t) ? (r.초 || 0) : 0;
  const 초 = (n.날 === t ? (n.초 || 0) : 0) + 대기, 더 = n.날 === t ? (n.더 || 0) : 0;
  return n.끝낸날 === t || 초 >= (n.분 + 더) * 60;
}
function 놀이더하기(초) {
  try { const t = 오늘(); let r = 읽기(놀이키); if (!r || r.날 !== t) r = { 날: t, 초: 0 };
    r.초 += 초; localStorage.setItem(놀이키, JSON.stringify(r)); } catch (e) {}
}
const 분초 = (s) => Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");
function 보이기(id) { for (const k of ["start", "gate", "rest", "playover"]) $(k).hidden = k !== id; }
// AR 중이 아니면 지금 어떤 화면이어야 하는지
function 화면정하기() {
  if (놀이끝났나()) return 보이기("playover");
  const 남 = 쉼남은초(); if (남 > 0) { $("restleft").textContent = 분초(남); return 보이기("rest"); }
  if (!$("rest").hidden || !$("playover").hidden) 보이기("start");
}
setInterval(() => {
  if (document.hidden) return;
  놀이더하기(1);
  if (session) { if (놀이끝났나()) { 끝낼까 = "놀이"; session.end(); } return; }
  if ($("gate").hidden) 화면정하기(); else if (놀이끝났나() || 쉼남은초() > 0) 화면정하기();
}, 1000);

// ── 2D 미리보기 (시작 화면에서 늘 돈다 — AR 안 되는 폰에서는 이게 전부)
const pv = $("preview"), pc = pv.getContext("2d");
let pvT = 0, pvLast = performance.now();
function 미리보기(now) {
  const dt = Math.max(0, Math.min(0.1, (now - pvLast) / 1000)); pvLast = now; pvT += dt;
  const W = pv.width, H = pv.height;
  pc.fillStyle = "#c8955a"; pc.fillRect(0, 0, W, H);
  pc.fillStyle = "#b07e48";                              // 멀어지는 마루 줄
  for (let i = 0; i < 8; i++) { const k = ((i + pvT * 0.8) % 8) / 8, y = 40 + k * k * (H - 40); pc.fillRect(0, y, W, 1 + k * 2); }
  pc.fillStyle = "#e9dcc5"; pc.fillRect(0, 0, W, 40);   // 벽
  for (let i = 0; i < 6; i++) {                          // 발자국 (강아지 뒤로 남음)
    const k = ((i / 6) + pvT * 0.25) % 1, y = 150 - (1 - k) * 90, s = 3 + k * 5;
    pc.globalAlpha = 0.25 + k * 0.5; 발자국그림(pc, W / 2 + (i % 2 ? -8 : 8) * (0.5 + k), y + 20, s); }
  pc.globalAlpha = 1;
  const im = 이미지["back_" + (1 + (Math.floor(pvT * 6) % 4))];
  if (im.complete && im.naturalWidth) pc.drawImage(im, W / 2 - 55, 42 + Math.abs(Math.sin(pvT * 6 * Math.PI / 2)) * -3, 110, 110);
  requestAnimationFrame(미리보기);
}
function 발자국그림(c, x, y, s) {
  c.fillStyle = "#6b4423";
  c.beginPath(); c.ellipse(x, y, s, s * 0.85, 0, 0, Math.PI * 2); c.fill();
  for (const [dx, dy] of [[-1, -1.3], [-0.35, -1.75], [0.35, -1.75], [1, -1.3]]) {
    c.beginPath(); c.arc(x + dx * s, y + dy * s, s * 0.38, 0, Math.PI * 2); c.fill(); }
}
requestAnimationFrame(미리보기);

// ── 되는 기기인지
let arOK = false;
(async () => {
  try { arOK = !!(navigator.xr && await navigator.xr.isSessionSupported("immersive-ar")); } catch (e) { arOK = false; }
  if (!arOK) {
    const ios = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    $("nosupport").hidden = false;
    $("nosupport").innerHTML = ios
      ? "🍎 아이폰은 아직 AR 산책이 안 돼요.<br>위에서 걸어가는 강아지를 구경해요!"
      : "😢 이 기기에서는 AR이 아직 안 돼요.<br>안드로이드 폰의 크롬에서 열어 주세요.<br>(그동안 위에서 강아지를 구경해요)";
    $("lead").hidden = true;
    $("go").hidden = true;
  }
})();

// ── 어른 확인 (두 자리 덧셈). 틀리면 새 문제
let 정답 = 0;
function 새문제() {
  const a = 11 + Math.floor(Math.random() * 28), b = 11 + Math.floor(Math.random() * 18);
  정답 = a + b; $("q").textContent = a + " + " + b + " = ?"; $("ans").value = "";
}
$("go").onclick = () => { if (!arOK) return; 화면정하기(); if ($("start").hidden) return; 새문제(); $("err").textContent = ""; $("start").hidden = true; $("gate").hidden = false; setTimeout(() => $("ans").focus(), 50); };
$("back2").onclick = () => { $("gate").hidden = true; $("start").hidden = false; };
$("ans").addEventListener("keydown", (e) => { if (e.key === "Enter") $("ok").click(); });
$("ok").onclick = () => {
  if (parseInt($("ans").value, 10) !== 정답) { $("err").textContent = "다시 해 볼까요?"; 새문제(); return; }
  $("err").textContent = "";
  if (놀이끝났나() || 쉼남은초() > 0) return 화면정하기();
  AR시작();                                   // ★ 누른 그 순간에 불러야 브라우저가 허락해 준다(사용자 동작)
};

// ── AR
let 끝낼까 = null, 세션시작 = 0;
let house, 집놓음 = false, 귀가 = null, renderer, scene, camera, session, hitSource, reticle, dog, dogMat, tex = {}, paws = [], pawGeo, pawTex, leash, leashMat;
const 상태 = { 놓음: false, 기다림: false, 방향: new THREE.Vector3(0, 0, -1), 걸은: 0, 발: 0, t: 0, 칸: 0, 마지막: 0 };
const 키 = 0.26, 속도 = 0.12, 발간격 = 0.07, 발최대 = 60;
// 줄: 손(폰 0.3m 아래·0.2m 앞) ↔ 목줄(강아지 키의 62%). 길이 1.2m
const 줄길이 = 1.2, 줄굵기 = 0.004, 목높이 = 키 * 0.62, 팽팽 = 0.95, 느려짐 = 0.8, 진동간격 = 1.5, 멈춤초 = 3;
// 게임 저장(양몰이_v5)의 지금 집 → 그림. 없으면 박스 집 (자료.js 집목록과 같게)
const 집그림 = { box: "box", basic: "wood", red: "red", 예쁜: "brick", log: "log", 별빛: "star", garden: "garden", glass: "glass", castle: "castle", 별의집: "moon" };
const 집크기 = 0.34, 문앞 = 0.09;
const 진동 = (ms) => { try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) {} };
const 줄 = { 손: new THREE.Vector3(), 목: new THREE.Vector3(), 가운데: new THREE.Vector3(), 비율: 0, 팽팽: false,
  진동때: -99, 당김때: -99, 당김초: 0, 멈춘자리: new THREE.Vector3(), 멈춘초: 0, 앉음: false, 멀어짐: 0, 옛폰: null };

function 준비() {
  if (renderer) return;
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true;
  renderer.xr.setReferenceSpaceType("local");
  renderer.domElement.style.display = "none";
  document.body.appendChild(renderer.domElement);
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 30);

  reticle = new THREE.Mesh(new THREE.RingGeometry(0.05, 0.065, 32).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: 0xffe9a0, transparent: true, opacity: 0.9 }));
  reticle.matrixAutoUpdate = false; reticle.visible = false; scene.add(reticle);

  const ld = new THREE.TextureLoader();
  for (const n of 그림들) { const t = ld.load("ar/" + n + ".png"); t.colorSpace = THREE.SRGBColorSpace; tex[n] = t; }
  dogMat = new THREE.MeshBasicMaterial({ map: tex.back_1, transparent: true, alphaTest: 0.15, side: THREE.DoubleSide });
  dog = new THREE.Mesh(new THREE.PlaneGeometry(키, 키).translate(0, 키 / 2, 0), dogMat);   // 발이 바닥에 닿게
  dog.visible = false; scene.add(dog);
  // 그림자 한 점 (떠 보이지 않게)
  const sh = new THREE.Mesh(new THREE.CircleGeometry(0.07, 24).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.22, depthWrite: false }));
  sh.position.y = 0.002; sh.scale.set(1, 1, 0.55); dog.add(sh);

  const cv = document.createElement("canvas"); cv.width = cv.height = 64;
  발자국그림(cv.getContext("2d"), 32, 40, 11);
  pawTex = new THREE.CanvasTexture(cv); pawTex.colorSpace = THREE.SRGBColorSpace;
  pawGeo = new THREE.PlaneGeometry(0.035, 0.035).rotateX(-Math.PI / 2);

  const hd = 읽기(저장키), ht = new THREE.TextureLoader().load("house/" + (집그림[hd && hd.집] || "box") + ".png");
  ht.colorSpace = THREE.SRGBColorSpace; ht.magFilter = THREE.NearestFilter; ht.minFilter = THREE.NearestFilter;
  house = new THREE.Mesh(new THREE.PlaneGeometry(집크기, 집크기).translate(0, 집크기 / 2, 0),
    new THREE.MeshBasicMaterial({ map: ht, transparent: true, alphaTest: 0.2, side: THREE.DoubleSide }));
  house.visible = false; scene.add(house);

  leashMat = new THREE.MeshBasicMaterial({ color: 0xd62828 });
  leash = new THREE.Mesh(new THREE.BufferGeometry(), leashMat); leash.frustumCulled = false; leash.visible = false; scene.add(leash);
}

// 줄 그리기: 느슨하면 아래로 처지고(길이 남은 만큼), 다 펴지면 곧게. 바닥 밑으로는 안 내려감
const 줄곡선 = new THREE.QuadraticBezierCurve3(new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3());
function 줄그리기(바닥y) {
  const a = 줄.손, b = 줄.목, d = a.distanceTo(b), 남 = Math.max(0, 줄길이 - d);
  let 처짐 = Math.sqrt(3 * d * 남 / 8);                     // 줄 길이 ≈ d + 8h²/(3d)
  줄.가운데.addVectors(a, b).multiplyScalar(0.5);
  처짐 = Math.min(처짐, Math.max(0, 줄.가운데.y - 바닥y - 0.01));
  줄곡선.v0.copy(a); 줄곡선.v2.copy(b); 줄곡선.v1.copy(줄.가운데); 줄곡선.v1.y -= 처짐 * 2;   // 조절점은 처짐의 두 배
  leash.geometry.dispose();
  leash.geometry = new THREE.TubeGeometry(줄곡선, 24, 줄굵기, 5, false);
  leash.visible = true;
}

async function AR시작() {
  try {
    준비();
    const overlay = $("overlay");
    session = await navigator.xr.requestSession("immersive-ar", {
      requiredFeatures: ["hit-test"], optionalFeatures: ["dom-overlay"], domOverlay: { root: overlay } });
    끝낼까 = null; 세션시작 = performance.now() - 앞서쓴초() * 1000;
    overlay.classList.add("on"); $("gate").hidden = true;
    // 그만하기 버튼을 누를 때 강아지가 옮겨지지 않게
    $("exit").addEventListener("beforexrselect", (e) => e.preventDefault());
    $("exit").onclick = () => session && session.end();
    session.addEventListener("end", 끝남);
    session.addEventListener("select", 톡);
    renderer.domElement.style.display = "block";
    await renderer.xr.setSession(session);
    const viewer = await session.requestReferenceSpace("viewer");
    hitSource = await session.requestHitTestSource({ space: viewer });
    상태.놓음 = false; 상태.기다림 = false; 집놓음 = false; 귀가 = null; house.visible = false; $("home").hidden = true;
    $("home").addEventListener("beforexrselect", (e) => e.preventDefault());
    $("home").onclick = () => 집으로("버튼");
    힌트("바닥을 천천히 비춰 주세요 🔍");
    renderer.setAnimationLoop(그리기);
  } catch (e) {
    console.warn("AR 시작 못함", e);
    $("gate").hidden = true; $("start").hidden = false; $("overlay").classList.remove("on");
    $("nosupport").hidden = false;
    $("nosupport").innerHTML = "😢 AR을 켜지 못했어요.<br>카메라를 허락했는지, <b>Google Play 서비스 AR</b>이 깔려 있는지 봐 주세요.";
    if (session) try { session.end(); } catch (_) {}
  }
}

function 힌트(s) { const h = $("hint"); if (h.textContent !== s) h.textContent = s; }

function 톡() {
  if (!reticle.visible || 집놓음) return;
  const p = new THREE.Vector3(), q = new THREE.Quaternion(), sc = new THREE.Vector3();
  reticle.matrix.decompose(p, q, sc);
  house.position.copy(p); house.visible = true; 집놓음 = true;     // 집은 놓은 자리에 그대로 (바닥 기준 고정)
  // 강아지는 집 문 앞(폰 쪽)에서 쏙 나온다
  const 쪽 = 상태.폰 ? new THREE.Vector3(상태.폰.x - p.x, 0, 상태.폰.z - p.z) : new THREE.Vector3(0, 0, 1);
  if (쪽.lengthSq() < 1e-4) 쪽.set(0, 0, 1); 쪽.normalize();
  dog.position.copy(p).addScaledVector(쪽, 문앞); dog.visible = true; dog.scale.setScalar(0.2);
  상태.놓음 = true; 상태.기다림 = false; 상태.걸은 = 0; 상태.t = 0; 상태.마지막 = 0;
  for (const m of paws) { scene.remove(m); m.material.dispose(); } paws = [];
  줄.앉음 = false; 줄.팽팽 = false; 줄.멈춘초 = -2; 줄.당김초 = 0; 줄.옛폰 = null; 줄.멀어짐 = 0; if (상태.폰) 줄.멈춘자리.copy(상태.폰);
  // 처음 방향 = 폰이 보는 쪽 (뒷모습이 보이게) — 없으면 폰에서 집 쪽
  상태.방향.copy(쪽).negate();
  $("home").hidden = false;
}

// 집으로: 줄을 풀고 강아지가 집 문 앞까지 걸어가 쏙 들어감 → 쉬는 시간
function 집으로(왜) {
  if (귀가 || !session) return;
  if (!집놓음) { 끝낼까 = "쉼"; 쉬기시작(); session.end(); return; }
  귀가 = { 왜, 초: 0, 들어감: 0 }; $("home").hidden = true; leash.visible = false;
}

function 발자국(pos, dir) {
  상태.발 ^= 1;
  const side = new THREE.Vector3(-dir.z, 0, dir.x).multiplyScalar(상태.발 ? 0.022 : -0.022);
  const m = new THREE.Mesh(pawGeo, new THREE.MeshBasicMaterial({ map: pawTex, transparent: true, opacity: 0.85, depthWrite: false }));
  m.position.copy(pos).add(side); m.position.y += 0.003;
  m.rotation.y = Math.atan2(-dir.x, -dir.z);
  m.userData.t = 0; scene.add(m); paws.push(m);
  if (paws.length > 발최대) { const o = paws.shift(); scene.remove(o); o.material.dispose(); }
}

const 앞 = new THREE.Vector3(), 폰 = new THREE.Vector3(), 폰q = new THREE.Quaternion();
function 그리기(time, frame) {
  const dt = 상태.마지막 ? Math.min(0.1, (time - 상태.마지막) / 1000) : 0; 상태.마지막 = time;
  if (!frame) return;
  const 지난초 = (performance.now() - 세션시작) / 1000;
  if (지난초 >= AR최대초 && !끝낼까 && !귀가) 집으로("시간");
  if (귀가 && !끝낼까 && (귀가.초 > 20 || 귀가.들어감 >= 0.5)) { 끝낼까 = "쉼"; 쉬기시작(); session.end(); return; }
  const ref = renderer.xr.getReferenceSpace();
  const vp = frame.getViewerPose(ref);
  if (vp) { const o = vp.transform.position, r = vp.transform.orientation;
    폰.set(o.x, o.y, o.z); 폰q.set(r.x, r.y, r.z, r.w); 상태.폰 = 폰; }
  const hits = hitSource ? frame.getHitTestResults(hitSource) : [];
  if (hits.length) { const pose = hits[0].getPose(ref); reticle.visible = true; reticle.matrix.fromArray(pose.transform.matrix); }
  else reticle.visible = false;
  reticle.material.opacity = 상태.놓음 ? 0.35 : 0.9;
  const 곧쉼 = 지난초 >= AR최대초 - 30;
  if (집놓음 && vp) house.rotation.y = Math.atan2(폰.x - house.position.x, 폰.z - house.position.z);

  if (!상태.놓음) 힌트(reticle.visible ? "먼저 강아지 집을 놓아요 🏠 화면을 톡!" : "바닥을 천천히 비춰 주세요 🔍");
  else if (vp && 귀가) {
    상태.t += dt; 귀가.초 += dt;
    const 문 = new THREE.Vector3(폰.x - house.position.x, 0, 폰.z - house.position.z);
    if (문.lengthSq() < 1e-4) 문.set(0, 0, 1); 문.normalize().multiplyScalar(문앞 * 0.5).add(house.position);
    const 쪽 = new THREE.Vector3(문.x - dog.position.x, 0, 문.z - dog.position.z), 남 = 쪽.length();
    if (남 > 0.02 && 귀가.들어감 === 0) {
      const 걸음 = Math.min(남, 속도 * 1.6 * dt); dog.position.addScaledVector(쪽.divideScalar(남), 걸음);
      상태.걸은 += 걸음; if (상태.걸은 >= 발간격) { 상태.걸은 = 0; 발자국(dog.position, 쪽); }
      dogMat.map = tex["back_" + (1 + Math.floor(상태.t * 8) % 4)];
    } else { 귀가.들어감 += dt; dog.scale.setScalar(Math.max(0.01, 1 - 귀가.들어감 * 2)); dogMat.map = tex.back_1; }
    dog.rotation.set(0, Math.atan2(폰.x - dog.position.x, 폰.z - dog.position.z), 0);
    힌트("강아지가 집으로 가요 🏠 잘 가~ 👋");
  }
  else if (vp) {
    상태.t += dt;
    if (dog.scale.x < 1) dog.scale.setScalar(Math.min(1, dog.scale.x + dt * 2.5));   // 집에서 쏙 나옴
    // 손 = 폰 0.3m 아래, 폰이 보는 쪽(수평)으로 0.2m 앞
    앞.set(0, 0, -1).applyQuaternion(폰q); 앞.y = 0;
    const 앞있음 = 앞.lengthSq() > 1e-4; if (앞있음) 앞.normalize();
    줄.손.copy(폰); 줄.손.y -= 0.3; if (앞있음) 줄.손.addScaledVector(앞, 0.2);
    // 내가 얼마나 빨리 강아지에게서 멀어지나 (폰 움직임을 강아지→폰 방향으로)
    const 밖 = new THREE.Vector3(폰.x - dog.position.x, 0, 폰.z - dog.position.z);
    const 밖길이 = 밖.length(); if (밖길이 > 1e-4) 밖.divideScalar(밖길이);
    if (줄.옛폰 && dt > 0) {
      const v = ((폰.x - 줄.옛폰.x) * 밖.x + (폰.z - 줄.옛폰.z) * 밖.z) / dt;
      줄.멀어짐 += (v - 줄.멀어짐) * Math.min(1, dt * 8);
    }
    줄.옛폰 = (줄.옛폰 || new THREE.Vector3()).copy(폰);
    // 멈춰 있나: 폰이 12cm 넘게 움직이면 다시 셈. 3초 넘게 멈추면 앉음
    const 움직임 = Math.hypot(폰.x - 줄.멈춘자리.x, 폰.z - 줄.멈춘자리.z);
    if (움직임 > 0.12) { 줄.멈춘자리.copy(폰); 줄.멈춘초 = 0; 줄.앉음 = false; }
    else { 줄.멈춘초 += dt; if (줄.멈춘초 > 멈춤초) 줄.앉음 = true; }
    // 줄이 닿는 가장 먼 수평 거리 (손 높이 때문에 1.2m 보다 짧다. 너무 짧아지지 않게 0.4m 는 둠)
    const 높이차 = 줄.손.y - (dog.position.y + 목높이);
    const 최대 = Math.max(0.4, Math.sqrt(Math.max(0, 줄길이 * 줄길이 - 높이차 * 높이차)));
    const 수평 = () => Math.hypot(dog.position.x - 줄.손.x, dog.position.z - 줄.손.z);
    // 휙 당김: 줄이 팽팽한데 폰이 빨리 멀어지면 강아지가 살짝 끌려옴 + 센 진동
    const 지금 = 상태.t;
    if (수평() / 최대 > 0.85 && 줄.멀어짐 > 0.5 && 지금 - 줄.당김때 > 0.8) {
      줄.당김때 = 지금; 줄.당김초 = 0.4; 줄.앉음 = false; 줄.멈춘초 = 0; 줄.멈춘자리.copy(폰); 진동(120); 줄.진동때 = 지금;
    }
    let 걸음 = 0;
    if (줄.당김초 > 0) {
      줄.당김초 -= dt;
      const 쪽 = new THREE.Vector3(줄.손.x - dog.position.x, 0, 줄.손.z - dog.position.z), 남은 = 쪽.length();
      if (남은 > 최대 * 0.55) dog.position.addScaledVector(쪽.divideScalar(남은), Math.min(남은 - 최대 * 0.55, 0.5 * dt));
      dogMat.map = tex.back_1; 힌트("당겼어요! 강아지가 따라와요 🐕");
    } else if (줄.앉음) {
      dogMat.map = tex.sit;   // 앉아서 기다림
      힌트("강아지가 기다려요 🐾 같이 걸어 볼까요?");
    } else if (상태.t < 1.0) {
      dogMat.map = tex.back_1; 힌트("강아지를 따라가요! 🐾");
    } else {
      // 폰이 보는 쪽(수평)으로 천천히 방향을 튼다
      if (앞있음) 상태.방향.lerp(앞, Math.min(1, dt * 1.2)).normalize();
      // 줄이 당겨질수록 느려짐 — 손에서 멀어지는 쪽으로만. 끝까지 가면 멈춤
      const 비 = 수평() / 최대, 멀어지는쪽 = (dog.position.x - 줄.손.x) * 상태.방향.x + (dog.position.z - 줄.손.z) * 상태.방향.z > 0;
      const 배 = 멀어지는쪽 ? Math.max(0, Math.min(1, (1 - 비) / (1 - 느려짐))) : 1;
      걸음 = 속도 * dt * 배;
      dog.position.addScaledVector(상태.방향, 걸음);
      상태.걸은 += 걸음;
      if (상태.걸은 >= 발간격) { 상태.걸은 = 0; 발자국(dog.position, 상태.방향); }
    }
    // 줄 끝보다 멀리는 못 감 (내가 뒤로 가면 끌려옴)
    { const dx = dog.position.x - 줄.손.x, dz = dog.position.z - 줄.손.z, h = Math.hypot(dx, dz);
      if (h > 최대) { dog.position.x = 줄.손.x + dx / h * 최대; dog.position.z = 줄.손.z + dz / h * 최대; } }
    줄.목.set(dog.position.x, dog.position.y + 목높이, dog.position.z);
    줄.비율 = 줄.손.distanceTo(줄.목) / 줄길이;
    줄.팽팽 = 수평() / 최대 >= 팽팽 && !줄.앉음;
    if (줄.팽팽 && 지금 - 줄.진동때 >= 진동간격) { 진동(60); 줄.진동때 = 지금; }
    if (줄.팽팽 && 줄.당김초 <= 0) {
      dogMat.map = tex.back_1;   // 멈춰서 뒤돌아봄 (살짝 고개 흔들기)
      dog.rotation.z = Math.sin(상태.t * 5) * 0.06;
      힌트("줄이 팽팽해요! 강아지가 돌아봐요 🐕 따라가요");
    } else {
      dog.rotation.z = 0;
      if (!줄.앉음 && 줄.당김초 <= 0 && 상태.t >= 1.0) {
        if (걸음 > 속도 * dt * 0.1) 상태.칸 = Math.floor(상태.t * 6) % 4;
        dogMat.map = tex["back_" + (상태.칸 + 1)]; 힌트("강아지를 따라가요! 🐾");
      }
    }
    줄그리기(dog.position.y);
    // 폰 쪽을 보게 (세로축만) — 뒷모습 그림이라 늘 등이 보인다
    dog.rotation.y = Math.atan2(폰.x - dog.position.x, 폰.z - dog.position.z);
    for (const m of paws) { m.userData.t += dt; m.material.opacity = Math.max(0, 0.85 - m.userData.t / 25); }
  }
  if (곧쉼 && !귀가) 힌트("⏰ 곧 쉬는 시간이에요. 강아지한테 인사해요 👋");
  renderer.render(scene, camera);
}
function 쉬기시작() { try { localStorage.setItem(쉼키, String(Date.now() + 쉼초 * 1000)); localStorage.removeItem(쓴키); } catch (e) {} }

function 끝남() {
  if (끝낼까 !== "쉼") try { localStorage.setItem(쓴키, JSON.stringify({ 초: Math.round((performance.now() - 세션시작) / 1000), 마지막: Date.now() })); } catch (e) {}
  renderer.setAnimationLoop(null);
  if (hitSource) try { hitSource.cancel(); } catch (_) {}
  hitSource = null; session = null;
  dog.visible = false; reticle.visible = false; 상태.놓음 = false; if (leash) leash.visible = false;
  if (house) house.visible = false; 집놓음 = false; 귀가 = null; if (dog) dog.scale.setScalar(1); $("home").hidden = true;
  for (const m of paws) { scene.remove(m); m.material.dispose(); } paws = [];
  renderer.domElement.style.display = "none";
  $("overlay").classList.remove("on"); 보이기("start"); 화면정하기();
}

화면정하기();
if (location.search.includes("artest")) window.__ar = { 줄, 상태, get dog() { return dog; }, get 귀가() { return 귀가; }, get leash() { return leash; }, get house() { return house; } };   // 시험용 (가짜 XR)
