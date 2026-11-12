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

// ── 🐶 형 강아지 (v5.58 형 「강아지 얼굴 안 보이고 뒷모습만… 내 강아지만 보고 싶은데」)
//   게임 저장(양몰이_v5)의 선택개 → 견종·털색·이름. 없으면 보더콜리(게임 첫 강아지).
//   ar/dogs/<견종>_ar.png = 128px 8칸: 0-3 옆 걷기(머리 오른쪽) · 4-5 얼굴(정면) · 6-7 앉기 (게임 시트에서 최근접으로 뽑음)
const 견종파일 = { 보더콜리: "border_collie", 코기: "corgi", 골든리트리버: "golden", 진도견: "jindo", 삽살개: "sapsal", 저먼셰퍼드: "shepherd" };
const 견종영어 = { 보더콜리: "Border Collie", 코기: "Corgi", 골든리트리버: "Golden", 진도견: "Jindo", 삽살개: "Sapsal", 저먼셰퍼드: "Shepherd" };
const 털색회전 = { 1: { h: -20, s: 1.1, l: 0.75 }, 2: { h: 25, s: 0.6, l: 1.25 } };   // 자료.js 와 같게
const 걷칸 = 0, 얼칸 = 4, 앉칸 = 6;
const 내개 = (() => {
  let d = null; try { d = JSON.parse(localStorage.getItem("양몰이_v5") || "null"); } catch (e) {}
  let g = null; if (d && Array.isArray(d.개)) g = d.개.find((x) => x && x.아이디 === d.선택개) || d.개[0];
  if (!g || !견종파일[g.견종]) g = { 견종: "보더콜리", 털색: 0, 이름: "" };
  const en = !!(d && d.언어 === "en");
  return { 견종: g.견종, 털색: g.털색 || 0, 이름: g.이름 || (en ? 견종영어[g.견종] : g.견종), en,
    소리: !(d && d.설정 && d.설정.효과음 === false) };
})();
// 이름 뒤 조사 (받침 있으면 이/을/이도, 없으면 가/를/도)
const 받침 = (() => { const c = 내개.이름.charCodeAt(내개.이름.length - 1); return c >= 0xac00 && c <= 0xd7a3 && (c - 0xac00) % 28 !== 0; })();
const 이가 = 내개.이름 + (받침 ? "이" : "가"), 을를 = 내개.이름 + (받침 ? "을" : "를");
const 칸들 = [];          // [{ R: canvas(원래), L: canvas(좌우 뒤집음) }] × 8
let 칸준비 = null;        // AR 이 켜질 때 텍스처로 바꿀 함수
function 털색칠(cx, w, h, r) {
  const d = cx.getImageData(0, 0, w, h), p = d.data;
  for (let i = 0; i < p.length; i += 4) {
    if (p[i + 3] < 10) continue; const R = p[i] / 255, G = p[i + 1] / 255, B = p[i + 2] / 255, mx = Math.max(R, G, B), mn = Math.min(R, G, B); let hh = 0, s = 0, l = (mx + mn) / 2;
    if (l < 0.18 || (l > 0.92 && mx - mn < 0.1)) continue;
    if (mx !== mn) { const dd = mx - mn; s = l > 0.5 ? dd / (2 - mx - mn) : dd / (mx + mn); hh = mx === R ? ((G - B) / dd + (G < B ? 6 : 0)) : mx === G ? ((B - R) / dd + 2) : ((R - G) / dd + 4); hh /= 6; }
    hh = (hh + r.h / 360 + 1) % 1; s = Math.min(1, s * r.s); l = Math.min(0.95, l * r.l);
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s, pp = 2 * l - q, f = (t) => { t = (t + 1) % 1; return t < 1 / 6 ? pp + (q - pp) * 6 * t : t < 0.5 ? q : t < 2 / 3 ? pp + (q - pp) * (2 / 3 - t) * 6 : pp; };
    p[i] = f(hh + 1 / 3) * 255; p[i + 1] = f(hh) * 255; p[i + 2] = f(hh - 1 / 3) * 255;
  }
  cx.putImageData(d, 0, 0);
}
{
  const im = new Image();
  im.onload = () => {
    const n = Math.round(im.width / im.height) || 8, w = im.height;
    for (let i = 0; i < n; i++) {
      const R = document.createElement("canvas"); R.width = R.height = w;
      const rc = R.getContext("2d"); rc.imageSmoothingEnabled = false; rc.drawImage(im, i * w, 0, w, w, 0, 0, w, w);
      if (털색회전[내개.털색]) try { 털색칠(rc, w, w, 털색회전[내개.털색]); } catch (e) {}
      const L = document.createElement("canvas"); L.width = L.height = w;
      const lc = L.getContext("2d"); lc.translate(w, 0); lc.scale(-1, 1); lc.drawImage(R, 0, 0);
      칸들.push({ R, L });
    }
    try { const ri = document.querySelector("#rest img"); if (ri && 칸들[얼칸]) { ri.src = 칸들[얼칸].R.toDataURL(); ri.style.imageRendering = "pixelated"; } } catch (e) {}
    if (칸준비) 칸준비();
  };
  im.src = "ar/dogs/" + 견종파일[내개.견종] + "_ar.png";
}
// 짖기 — 게임 소리 그대로 (견종별 없으면 기본 짖기). 효과음 꺼 두면 안 냄
function 짖기() {
  if (!내개.소리) return;
  try { const a = new Audio("소리/짖기_" + 내개.견종 + ".mp3"); a.volume = 0.8;
    a.play().catch(() => { try { const b = new Audio("소리/짖기.mp3"); b.volume = 0.8; b.play().catch(() => {}); } catch (e) {} }); } catch (e) {}
}
function 하트그림(c, x, y, s) {
  c.fillStyle = "#ff5a7a"; c.beginPath();
  c.moveTo(x, y + s * 0.35);
  c.bezierCurveTo(x - s * 1.1, y - s * 0.45, x - s * 0.45, y - s * 1.1, x, y - s * 0.45);
  c.bezierCurveTo(x + s * 0.45, y - s * 1.1, x + s * 1.1, y - s * 0.45, x, y + s * 0.35);
  c.fill();
}

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
//   형 강아지가 마루를 왔다 갔다(옆모습) → 멈추면 돌아서 얼굴 보여 주고 꼬리 살랑 → 가끔 앉음. 톡 = 하트·짖기·이름
const pv = $("preview"), pc = pv.getContext("2d");
let pvT = 0, pvLast = performance.now();
const pv개 = { x: 70, 쪽: 1, 단계: "걷기", 남: 2.6, 톡: -9, 하트: [] };
pv.setAttribute("aria-label", 내개.이름);
pv.style.cursor = "pointer";
pv.addEventListener("pointerdown", () => {
  pv개.톡 = pvT; 짖기(); 진동(30);
  for (let i = 0; i < 5; i++) pv개.하트.push({ x: pv개.x + (Math.random() - 0.5) * 50, y: 95, vy: 22 + Math.random() * 18, t: 0, s: 5 + Math.random() * 4 });
});
function 미리보기(now) {
  const dt = Math.max(0, Math.min(0.1, (now - pvLast) / 1000)); pvLast = now; pvT += dt;
  const W = pv.width, H = pv.height, 바닥 = 150;
  pc.imageSmoothingEnabled = false;
  pc.fillStyle = "#c8955a"; pc.fillRect(0, 0, W, H);
  pc.fillStyle = "#b07e48"; for (let i = 0; i < 6; i++) { const y = 52 + i * i * 4; pc.fillRect(0, y, W, 1 + i * 0.4); }   // 마루 줄
  pc.fillStyle = "#e9dcc5"; pc.fillRect(0, 0, W, 48);   // 벽
  const 톡중 = pvT - pv개.톡 < 2.2;
  // 걷기 → 멈춤(얼굴) → 걷기 … 세 번에 한 번은 앉기
  if (!톡중) { pv개.남 -= dt;
    if (pv개.남 <= 0) {
      if (pv개.단계 === "걷기") { pv개.단계 = Math.random() < 0.3 ? "앉기" : "얼굴"; pv개.남 = 2.2; }
      else { pv개.단계 = "걷기"; pv개.남 = 2 + Math.random() * 1.5; if (Math.random() < 0.5) pv개.쪽 *= -1; }
    } }
  if (!톡중 && pv개.단계 === "걷기") {
    pv개.x += pv개.쪽 * 34 * dt;
    if (pv개.x > W - 48) { pv개.x = W - 48; pv개.쪽 = -1; } if (pv개.x < 48) { pv개.x = 48; pv개.쪽 = 1; }
  }
  let i = 얼칸 + (Math.floor(pvT * 4) % 2), 뒤집 = false, 흔들 = 0, 깡 = 0;
  if (톡중) { 깡 = Math.abs(Math.sin((pvT - pv개.톡) * 9)) * 6; }
  else if (pv개.단계 === "걷기") { i = 걷칸 + (Math.floor(pvT * 7) % 4); 뒤집 = pv개.쪽 < 0; 깡 = Math.abs(Math.sin(pvT * 7 * Math.PI / 2)) * 2; }
  else if (pv개.단계 === "앉기") i = 앉칸 + (Math.floor(pvT * 1.5) % 2);
  else 흔들 = Math.sin(pvT * 9) * 0.05;
  pc.fillStyle = "rgba(0,0,0,.18)"; pc.beginPath(); pc.ellipse(pv개.x, 바닥, 30, 6, 0, 0, Math.PI * 2); pc.fill();
  const f = 칸들[i];
  if (f) { pc.save(); pc.translate(pv개.x, 바닥 - 깡); pc.rotate(흔들); pc.drawImage(뒤집 ? f.L : f.R, -48, -92, 96, 96); pc.restore(); }
  for (const h of pv개.하트) { h.t += dt; h.y -= h.vy * dt; pc.globalAlpha = Math.max(0, 1 - h.t / 1.4); 하트그림(pc, h.x, h.y, h.s); }
  pc.globalAlpha = 1; pv개.하트 = pv개.하트.filter((h) => h.t < 1.4);
  // 이름 말풍선 (톡 했을 때)
  if (톡중) {
    pc.font = "bold 15px 'Apple SD Gothic Neo','Noto Sans KR',sans-serif"; pc.textAlign = "center"; pc.textBaseline = "middle";
    const 글 = 내개.이름 + (내개.en ? " ♥" : " 💕"), w = pc.measureText(글).width + 20, bx = Math.max(w / 2 + 4, Math.min(W - w / 2 - 4, pv개.x)), by = 24;
    pc.fillStyle = "#fffaf0"; pc.strokeStyle = "#b07e48"; pc.lineWidth = 2;
    pc.beginPath(); pc.roundRect(bx - w / 2, by - 13, w, 26, 12); pc.fill(); pc.stroke();
    pc.fillStyle = "#4a3218"; pc.fillText(글, bx, by + 1);
  }
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
let 하트텍, 이름표, 하트들 = [], house, 집놓음 = false, 귀가 = null, renderer, scene, camera, session, hitSource, reticle, dog, dogMat, tex = {}, paws = [], pawGeo, pawTex, leash, leashMat;
const 상태 = { 놓음: false, 기다림: false, 방향: new THREE.Vector3(0, 0, -1), 걸은: 0, 발: 0, t: 0, 칸: 0, 마지막: 0, 왼: false, 톡때: -99, 멈춤초: 0 };
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
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, premultipliedAlpha: true });
  renderer.setClearColor(0x000000, 0);   // 빈 곳만 알파 0 → 카메라. (2026-09-29 「하얀색 다 투명해」)
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true;
  renderer.xr.setReferenceSpaceType("local");
  renderer.domElement.style.display = "none";
  document.body.appendChild(renderer.domElement);
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 30);

  reticle = new THREE.Mesh(new THREE.RingGeometry(0.05, 0.065, 32).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: 0xffe9a0, transparent: true, opacity: 0.9, premultipliedAlpha: true }));
  reticle.matrixAutoUpdate = false; reticle.visible = false; scene.add(reticle);

  // 형 강아지 칸 → 텍스처 (R=원래, L=좌우 뒤집음). 그림이 아직이면 다 받은 뒤에 만든다
  칸준비 = () => { 칸들.forEach((f, i) => { for (const k of ["R", "L"]) { if (tex[i + k]) continue;
    const t = new THREE.CanvasTexture(f[k]); t.colorSpace = THREE.SRGBColorSpace; t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; tex[i + k] = t; } });
    if (dogMat && !dogMat.map && tex[얼칸 + "R"]) { dogMat.map = tex[얼칸 + "R"]; dogMat.needsUpdate = true; } };
  // ★ 그림은 오려낸 불투명(transparent:false + alphaTest) — 남은 픽셀은 알파가 꼭 1.0 으로 써진다(three 의 OPAQUE).
  //   transparent:true 면 반투명 섞기 길로 가서 AR 합성기에서 밝은 색일수록 카메라가 비쳐 보였다(형 「하얀색 다 투명해」)
  dogMat = new THREE.MeshBasicMaterial({ map: null, transparent: false, alphaTest: 0.5, side: THREE.DoubleSide });
  dog = new THREE.Mesh(new THREE.PlaneGeometry(키, 키).translate(0, 키 / 2, 0), dogMat);   // 발이 바닥에 닿게
  dog.visible = false; scene.add(dog);
  칸준비();
  // 톡 하면 떠오르는 하트 + 이름표 (늘 폰을 보는 Sprite)
  { const hc = document.createElement("canvas"); hc.width = hc.height = 64; 하트그림(hc.getContext("2d"), 32, 36, 22);
    하트텍 = new THREE.CanvasTexture(hc); 하트텍.colorSpace = THREE.SRGBColorSpace; }
  { const nc = document.createElement("canvas"); nc.width = 512; nc.height = 128; const x = nc.getContext("2d");
    x.font = "bold 64px 'Apple SD Gothic Neo','Noto Sans KR',sans-serif"; x.textAlign = "center"; x.textBaseline = "middle";
    const 글 = 내개.이름 + (내개.en ? " ♥" : " 💕"), w = Math.min(500, x.measureText(글).width + 56);
    x.fillStyle = "#fffaf0"; x.strokeStyle = "#b07e48"; x.lineWidth = 8; x.beginPath(); x.roundRect(256 - w / 2, 10, w, 108, 50); x.fill(); x.stroke();
    x.fillStyle = "#4a3218"; x.fillText(글, 256, 66, 460);
    const t = new THREE.CanvasTexture(nc); t.colorSpace = THREE.SRGBColorSpace;
    이름표 = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false, depthTest: false }));
    이름표.scale.set(0.32, 0.08, 1); 이름표.visible = false; 이름표.renderOrder = 10; scene.add(이름표); }
  // 그림자 한 점 (떠 보이지 않게)
  const sh = new THREE.Mesh(new THREE.CircleGeometry(0.07, 24).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.22, depthWrite: false, premultipliedAlpha: true }));
  sh.position.y = 0.002; sh.scale.set(1, 1, 0.55); dog.add(sh);

  const cv = document.createElement("canvas"); cv.width = cv.height = 64;
  발자국그림(cv.getContext("2d"), 32, 40, 11);
  pawTex = new THREE.CanvasTexture(cv); pawTex.colorSpace = THREE.SRGBColorSpace;
  pawGeo = new THREE.PlaneGeometry(0.035, 0.035).rotateX(-Math.PI / 2);

  const hd = 읽기(저장키), ht = new THREE.TextureLoader().load("house/" + (집그림[hd && hd.집] || "box") + ".png");
  ht.colorSpace = THREE.SRGBColorSpace; ht.magFilter = THREE.NearestFilter; ht.minFilter = THREE.NearestFilter;
  house = new THREE.Mesh(new THREE.PlaneGeometry(집크기, 집크기).translate(0, 집크기 / 2, 0),
    new THREE.MeshBasicMaterial({ map: ht, transparent: false, alphaTest: 0.5, side: THREE.DoubleSide }));
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

function 톡(e) {
  if (집놓음) { if (dog.visible && !귀가 && 강아지맞음(e)) 쓰다듬(); return; }
  if (!reticle.visible) return;
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

// 톡한 줄(레이)이 강아지 몸 가까이(22cm) 지나가면 맞음. 레이를 못 얻으면 화면 어디든 맞음으로 친다
function 강아지맞음(e) {
  try {
    const pose = e && e.frame && e.frame.getPose(e.inputSource.targetRaySpace, renderer.xr.getReferenceSpace());
    if (!pose) return true;
    const o = pose.transform.position, r = pose.transform.orientation;
    const 원 = new THREE.Vector3(o.x, o.y, o.z), 쪽 = new THREE.Vector3(0, 0, -1).applyQuaternion(new THREE.Quaternion(r.x, r.y, r.z, r.w));
    const 몸 = dog.position.clone(); 몸.y += 키 / 2;
    const k = Math.max(0, 몸.clone().sub(원).dot(쪽));
    return 원.addScaledVector(쪽, k).distanceTo(몸) < 0.22;
  } catch (_) { return true; }
}
function 쓰다듬() {
  상태.톡때 = 상태.t; 짖기(); 진동(30);
  for (let i = 0; i < 5; i++) {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: 하트텍, transparent: true, depthWrite: false }));
    sp.scale.setScalar(0.045 + Math.random() * 0.025);
    sp.position.copy(dog.position); sp.position.y += 키 * (0.7 + Math.random() * 0.3);
    sp.userData = { t: 0, vx: (Math.random() - 0.5) * 0.12, vz: (Math.random() - 0.5) * 0.12, vy: 0.14 + Math.random() * 0.1 };
    scene.add(sp); 하트들.push(sp);
  }
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
  const m = new THREE.Mesh(pawGeo, new THREE.MeshBasicMaterial({ map: pawTex, transparent: true, opacity: 0.85, depthWrite: false, premultipliedAlpha: true }));
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
      옆보기(쪽); 모습(걷칸 + Math.floor(상태.t * 8) % 4, 상태.왼);
    } else { 귀가.들어감 += dt; dog.scale.setScalar(Math.max(0.01, 1 - 귀가.들어감 * 2)); 모습(얼칸 + Math.floor(상태.t * 6) % 2); }   // 안녕 하고 들어감
    눕힘(0);
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
      옆보기(쪽); 모습(걷칸 + Math.floor(상태.t * 8) % 4, 상태.왼); 힌트("당겼어요! 강아지가 따라와요 🐕");
    } else if (줄.앉음) {
      모습(앉칸 + Math.floor(상태.t * 1.5) % 2);   // 앉아서 나를 보며 기다림
      힌트("강아지가 기다려요 🐾 같이 걸어 볼까요?");
    } else if (상태.t < 1.0) {
      모습(얼칸 + Math.floor(상태.t * 4) % 2); 힌트(내개.이름 + " 나왔어요! 🐾");   // 나오자마자 얼굴 보여 줌
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
    // 얼굴 보여 줄 때: 줄 팽팽(돌아봄) · 잠깐 멈춤 · 톡 한 뒤 2.5초 — 정면 그림 + 꼬리 살랑(두 칸) + 살짝 흔들
    const 걷는중 = 걸음 > 속도 * dt * 0.1;
    상태.멈춤초 = 걷는중 ? 0 : 상태.멈춤초 + dt;
    const 톡중 = 상태.t - 상태.톡때 < 2.5;
    let 흔들 = 0;
    if (줄.당김초 > 0 || 상태.t < 1.0) {}
    else if (줄.앉음) { if (톡중) 힌트(내개.이름 + " — 좋아요 💕"); }
    else if (톡중 || 줄.팽팽 || 상태.멈춤초 > 0.5) {
      모습(얼칸 + Math.floor(상태.t * 4) % 2);
      흔들 = Math.sin(상태.t * (톡중 ? 9 : 5)) * 0.06;
      힌트(톡중 ? 이가 + " 좋아해요 💕" : 줄.팽팽 ? "줄이 팽팽해요! " + 이가 + " 돌아봐요 🐕 따라가요" : 이가 + " 기다려요 🐾");
    } else {
      // 옆모습으로 걸어감 — 화면에서 오른쪽으로 가면 그대로, 왼쪽이면 뒤집음
      옆보기(상태.방향);
      상태.칸 = Math.floor(상태.t * 6) % 4;
      모습(걷칸 + 상태.칸, 상태.왼); 힌트(을를 + " 따라가요! 🐾");
    }
    줄그리기(dog.position.y);
    눕힘(흔들);
    { const s = dog.scale.x; dog.scale.y = s * (1 + (흔들 ? Math.abs(Math.sin(상태.t * 9)) * 0.04 : 0)); }   // 깡충
    for (const m of paws) { m.userData.t += dt; m.material.opacity = Math.max(0, 0.85 - m.userData.t / 25); }
  }
  // 하트 떠오름 · 이름표는 강아지 머리 위
  for (const sp of 하트들) { const u = sp.userData; u.t += dt;
    sp.position.x += u.vx * dt; sp.position.z += u.vz * dt; sp.position.y += u.vy * dt; sp.material.opacity = Math.max(0, 1 - u.t / 1.4); }
  하트들 = 하트들.filter((sp) => { if (sp.userData.t < 1.4) return true; scene.remove(sp); sp.material.dispose(); return false; });
  if (이름표) { 이름표.visible = dog.visible && !귀가 && 상태.t - 상태.톡때 < 2.5;
    if (이름표.visible) { 이름표.position.copy(dog.position); 이름표.position.y += 키 * dog.scale.x + 0.06; } }
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
  for (const sp of 하트들) { scene.remove(sp); sp.material.dispose(); } 하트들 = []; if (이름표) 이름표.visible = false;
  renderer.domElement.style.display = "none";
  $("overlay").classList.remove("on"); 보이기("start"); 화면정하기();
}

화면정하기();
if (location.search.includes("artest")) window.__ar = { 줄, 상태, get dog() { return dog; }, get 귀가() { return 귀가; }, get leash() { return leash; }, get house() { return house; }, 쓰다듬, 내개 };   // 시험용 (가짜 XR)

// 폰으로 내려다볼 때 세운 그림이 옆면(선)으로 납작하게 보이던 것 — 폰 높이만큼 뒤로 눕혀 늘 얼굴이 폰을 보게 (2026-11-12 형 캡처)
function 눕힘(흔들) {
  // v5.57: 기울이기만으론 형 폰에서 여전히 찌부 → 완전 빌보드(폰과 같은 방향을 봄 = 늘 정면). 흔들(z)은 꼬리 살랑
  dog.quaternion.copy(폰q);
  if (흔들) dog.rotateZ(흔들);
}
// 칸 바꾸기 (i: 0-7, 왼: 좌우 뒤집음). 그림이 아직이면 그대로 둠
function 모습(i, 왼) { const t = tex[i + (왼 ? "L" : "R")]; if (t && dogMat.map !== t) { const 처음 = !dogMat.map; dogMat.map = t; if (처음) dogMat.needsUpdate = true; } }
// 가는 쪽을 폰 화면의 좌우로 — 옆으로 확실히 갈 때만 바꿈(앞뒤로 갈 땐 그대로)
const 오른 = new THREE.Vector3();
function 옆보기(쪽) { 오른.set(1, 0, 0).applyQuaternion(폰q); const l = 쪽.x * 오른.x + 쪽.z * 오른.z, n = Math.hypot(쪽.x, 쪽.z) || 1;
  if (l / n > 0.15) 상태.왼 = false; else if (l / n < -0.15) 상태.왼 = true; }
