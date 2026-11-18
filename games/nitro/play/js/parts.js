// Garage part pictures: small 3D parts rendered once with real lighting -> PNG data URLs.
// 4 parts x 4 finish tiers (steel, red, blue chrome, gold). Built lazily the first time the garage opens.
import * as THREE from 'three';

const TIERS = [
  { c: 0x9aa3ad, m: 0.75, r: 0.35 }, // steel
  { c: 0xe0452e, m: 0.45, r: 0.3 },  // racing red
  { c: 0x2f7bff, m: 0.8, r: 0.2 },   // blue chrome
  { c: 0xffc72a, m: 1.0, r: 0.18 },  // gold
];
export const tierOf = lv => (lv >= 5 ? 3 : lv >= 3 ? 2 : lv >= 1 ? 1 : 0);
let cache = null;

function std(c, m = 0.6, r = 0.4) { return new THREE.MeshStandardMaterial({ color: c, metalness: m, roughness: r }); }

function engine(t) {
  const g = new THREE.Group(), main = std(t.c, t.m, t.r), dark = std(0x2b2f36, 0.5, 0.5), chrome = std(0xe8edf2, 1, 0.15);
  const block = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.9, 1.0), main); g.add(block);
  const head = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.28, 0.8), dark); head.position.y = 0.6; g.add(head);
  for (let i = 0; i < 4; i++) { const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.2, 14), chrome); cap.position.set(-0.6 + i * 0.4, 0.82, 0); g.add(cap); }
  for (let i = 0; i < 4; i++) { const p = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.06, 8, 16, Math.PI), chrome); p.position.set(-0.6 + i * 0.4, 0.3, 0.55); p.rotation.y = Math.PI / 2; p.rotation.z = -Math.PI / 2; g.add(p); }
  const pul = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.14, 24), dark); pul.rotation.z = Math.PI / 2; pul.position.set(0.88, -0.05, 0); g.add(pul);
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.18, 16), chrome); hub.rotation.z = Math.PI / 2; hub.position.set(0.9, -0.05, 0); g.add(hub);
  const filt = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.16, 28), chrome); filt.position.y = 1.0; g.add(filt);
  for (let i = 0; i < 5; i++) { const fin = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.6, 1.02), dark); fin.position.set(-0.6 + i * 0.3, -0.05, 0); g.add(fin); }
  return g;
}
function tire(t) {
  const g = new THREE.Group(), rub = std(0x24262b, 0.1, 0.85), rim = std(t.c, t.m, t.r), chrome = std(0xe8edf2, 1, 0.15);
  const tr = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.36, 16, 40), rub); g.add(tr);
  for (let i = 0; i < 28; i++) { const a = i / 28 * Math.PI * 2; const k = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.2, 0.8), rub); k.position.set(Math.cos(a) * 1.18, Math.sin(a) * 1.18, 0); k.rotation.z = a; g.add(k); }
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.4, 32), rim); disc.rotation.x = Math.PI / 2; g.add(disc);
  for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; const h = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.44, 12), std(0x1a1c20, 0.3, 0.6)); h.rotation.x = Math.PI / 2; h.position.set(Math.cos(a) * 0.36, Math.sin(a) * 0.36, 0.01); g.add(h); }
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.5, 16), chrome); hub.rotation.x = Math.PI / 2; g.add(hub);
  g.rotation.y = 0.8; return g;
}
function suspension(t) {
  const g = new THREE.Group(), spring = std(t.c, t.m, t.r), chrome = std(0xe8edf2, 1, 0.12), dark = std(0x2b2f36, 0.5, 0.5);
  const pts = []; for (let i = 0; i <= 200; i++) { const u = i / 200, a = u * Math.PI * 2 * 7; pts.push(new THREE.Vector3(Math.cos(a) * 0.42, -0.9 + u * 1.8, Math.sin(a) * 0.42)); }
  g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 400, 0.075, 8), spring));
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 2.1, 16), chrome); g.add(rod);
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 1.0, 16), dark); body.position.y = -0.55; g.add(body);
  for (const y of [1.0, -1.0]) { const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.12, 24), dark); cap.position.y = y; g.add(cap);
    const eye = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.07, 8, 16), chrome); eye.position.y = y + Math.sign(y) * 0.32; g.add(eye); }
  g.rotation.z = 0.5; return g;
}
function nitro(t) {
  const g = new THREE.Group(), tank = std(t.c, t.m, t.r), chrome = std(0xe8edf2, 1, 0.12), dark = std(0x2b2f36, 0.5, 0.5);
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.5, 1.4, 8, 24), tank); g.add(body);
  for (const y of [0.45, -0.45]) { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.515, 0.515, 0.16, 28), dark); b.position.y = y; g.add(b); }
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 0.3, 16), chrome); neck.position.y = 1.3; g.add(neck);
  const valve = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.05, 8, 20), std(0xe0452e, 0.3, 0.4)); valve.rotation.x = Math.PI / 2; valve.position.y = 1.5; g.add(valve);
  const gauge = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.08, 20), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 })); gauge.rotation.x = Math.PI / 2; gauge.position.set(0.22, 1.3, 0.12); g.add(gauge);
  const strip = new THREE.Mesh(new THREE.CylinderGeometry(0.505, 0.505, 0.3, 28), std(0x7ee05a, 0.3, 0.4)); g.add(strip);
  g.rotation.z = -0.35; return g;
}
const MAKERS = { eng: engine, tire, top: suspension, nitro };

export function partIcons() {
  if (cache) return cache;
  cache = {};
  let r;
  try {
    const cv = document.createElement('canvas'); cv.width = cv.height = 160;
    r = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true, preserveDrawingBuffer: true });
    r.outputColorSpace = THREE.SRGBColorSpace; r.toneMapping = THREE.ACESFilmicToneMapping;
    const sc = new THREE.Scene();
    sc.add(new THREE.HemisphereLight(0xffffff, 0x554433, 1.6));
    const key = new THREE.DirectionalLight(0xffffff, 2.6); key.position.set(3, 5, 4); sc.add(key);
    const rim = new THREE.DirectionalLight(0xffe2a8, 1.4); rim.position.set(-4, 2, -3); sc.add(rim);
    // fake environment for metals
    const pm = new THREE.PMREMGenerator(r); const envScene = new THREE.Scene(); envScene.background = new THREE.Color(0x6a7684);
    const l1 = new THREE.Mesh(new THREE.BoxGeometry(2, 0.2, 2), new THREE.MeshBasicMaterial({ color: 0xffffff })); l1.position.set(0, 3, 0); envScene.add(l1);
    const l2 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 2, 2), new THREE.MeshBasicMaterial({ color: 0xffd9a0 })); l2.position.set(-3, 0, 1); envScene.add(l2);
    sc.environment = pm.fromScene(envScene, 0.04).texture;
    const cam = new THREE.PerspectiveCamera(30, 1, 0.1, 50); cam.position.set(2.6, 2.2, 5.2); cam.lookAt(0, 0, 0);
    for (const k in MAKERS) {
      cache[k] = [];
      for (let ti = 0; ti < 4; ti++) {
        const o = MAKERS[k](TIERS[ti]); o.rotation.y += -0.45;
        const box = new THREE.Box3().setFromObject(o), sz = box.getSize(new THREE.Vector3()).length();
        o.scale.setScalar(4.0 / sz); const c = new THREE.Box3().setFromObject(o).getCenter(new THREE.Vector3()); o.position.sub(c);
        sc.add(o); r.render(sc, cam); cache[k][ti] = cv.toDataURL('image/png'); sc.remove(o);
      }
    }
    pm.dispose();
  } catch (e) { /* no WebGL: cards just show text */ }
  try { r && r.dispose(); r && r.forceContextLoss(); } catch (e) { }
  return cache;
}
