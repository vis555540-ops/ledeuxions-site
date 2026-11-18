// 3D view (three.js r160). Fixed high angled camera that shows the whole track, like a tabletop.
import * as THREE from 'three';
import { GLTFLoader } from '../lib/GLTFLoader.js';
import { nearestGlobal } from './tracks.js';

const A = 'assets/kenney-racing-kit/';
const MOBILE = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
const MODELS = ['raceCarRed', 'treeLarge', 'treeSmall', 'grandStand', 'flagCheckers', 'pylon', 'bannerTowerRed', 'bannerTowerGreen', 'tent', 'barrierRed'];

export class View {
  constructor(canvas) {
    this.canvas = canvas;
    const r = this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    this.maxDpr = Math.min(window.devicePixelRatio || 1, 2);
    r.setPixelRatio(this.maxDpr);
    r.shadowMap.enabled = true; r.shadowMap.type = MOBILE ? THREE.PCFShadowMap : THREE.PCFSoftShadowMap;
    r.outputColorSpace = THREE.SRGBColorSpace;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x8fd3f0);
    this.scene.fog = new THREE.Fog(0x8fd3f0, 70, 140);
    this.camera = new THREE.PerspectiveCamera(38, 16 / 9, 0.5, 300);
    const hemi = new THREE.HemisphereLight(0xfff4dd, 0x6b8a3a, 1.25); this.scene.add(hemi);
    const sun = this.sun = new THREE.DirectionalLight(0xffffff, 2.0);
    sun.position.set(-14, 30, 12); sun.castShadow = true;
    sun.shadow.mapSize.set(MOBILE ? 1024 : 2048, MOBILE ? 1024 : 2048);
    const sc = sun.shadow.camera; sc.left = -30; sc.right = 30; sc.top = 20; sc.bottom = -20; sc.near = 1; sc.far = 80;
    sun.shadow.bias = -0.0008; sun.shadow.normalBias = 0.03;
    this.scene.add(sun);
    this.models = {};
    this.trackGroup = null;
    this.cars = [];
    this.pickMeshes = new Map();
    this._initParticles();
    this._initMarks();
    this.shake = 0; this.camBase = new THREE.Vector3(); this.podium = null;
    this._ft = 0; this._fn = 0;
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }
  // adaptive resolution: if the phone can't keep up, render fewer pixels (never above devicePixelRatio 2)
  perf(dt) {
    this._ft += dt; this._fn++;
    if (this._fn >= 90) {
      const avg = this._ft / this._fn; this._ft = 0; this._fn = 0;
      const pr = this.renderer.getPixelRatio();
      if (avg > 0.021 && pr > 1) { this.renderer.setPixelRatio(Math.max(1, pr - 0.25)); this.resize(); }
      else if (avg < 0.0135 && pr < this.maxDpr) { this.renderer.setPixelRatio(Math.min(this.maxDpr, pr + 0.25)); this.resize(); }
    }
  }

  async load(onProgress) {
    const loader = new GLTFLoader();
    let done = 0;
    await Promise.all(MODELS.map(name => new Promise(res => {
      loader.load(A + name + '.glb', g => {
        g.scene.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
        if (/^tree/.test(name)) g.scene.traverse(o => { if (o.isMesh) { o.material = o.material.clone(); const c = o.material.color; if (c.g > c.r * 0.8 && c.b > 0.25) c.set(name === 'treeLarge' ? 0x3f9a4a : 0x58b04c); } });
        this.models[name] = g.scene; done++; onProgress && onProgress(done / MODELS.length); res();
      }, undefined, () => { done++; res(); });
    })));
  }

  resize() {
    const w = this.canvas.clientWidth || window.innerWidth, h = this.canvas.clientHeight || window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this._fitCamera();
  }

  _fitCamera() {
    // fixed tilt; pull back until the whole field fits the screen
    const cam = this.camera, target = new THREE.Vector3(0, 0, 0.6);
    const dir = new THREE.Vector3(0, Math.sin(THREE.MathUtils.degToRad(58)), Math.cos(THREE.MathUtils.degToRad(58)));
    const corners = [];
    const b = this.bounds || { x0: -25.5, x1: 25.5, z0: -14.5, z1: 15 };
    for (const x of [b.x0, b.x1]) for (const z of [b.z0, b.z1]) corners.push(new THREE.Vector3(x, 0, z));
    target.set((b.x0 + b.x1) / 2, 0, (b.z0 + b.z1) / 2 + 0.6);
    let lo = 10, hi = 200;
    for (let it = 0; it < 30; it++) {
      const mid = (lo + hi) / 2;
      cam.position.copy(target).addScaledVector(dir, mid); cam.lookAt(target); cam.updateMatrixWorld(); cam.updateProjectionMatrix();
      const fits = corners.every(c => { const p = c.clone().project(cam); return Math.abs(p.x) < 0.97 && p.y < 0.86 && p.y > -0.97; });
      if (fits) hi = mid; else lo = mid;
    }
    cam.position.copy(target).addScaledVector(dir, hi); cam.lookAt(target); cam.updateProjectionMatrix();
    this.camBase.copy(cam.position); this.camTarget = target.clone();
  }

  // ---------- track ----------
  buildTrack(T, carColors) {
    this.flags = []; this.endPodium();
    if (this.trackGroup) { this.scene.remove(this.trackGroup); this.trackGroup.traverse(o => { if (o.geometry && o.userData.own) o.geometry.dispose(); }); }
    const G = this.trackGroup = new THREE.Group(); this.scene.add(G);
    this.T = T;
    let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9;
    for (let i = 0; i < T.N; i++) { x0 = Math.min(x0, T.xs[i]); x1 = Math.max(x1, T.xs[i]); z0 = Math.min(z0, T.zs[i]); z1 = Math.max(z1, T.zs[i]); }
    const mg = T.halfW + 1.6;
    this.bounds = { x0: x0 - mg, x1: x1 + mg, z0: z0 - mg - 0.5, z1: z1 + mg };
    this._fitCamera();
    // terrain grid
    const W = 74, H = 50, sx = MOBILE ? 222 : 296, sz = MOBILE ? 150 : 200;
    const geo = new THREE.PlaneGeometry(W, H, sx, sz); geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position, n = pos.count;
    const col = new Float32Array(n * 3);
    const dirtL = new THREE.Color(0xe8b578), dirt = new THREE.Color(0xc98a4e), dirtD = new THREE.Color(0xa86a38), hay = new THREE.Color(0xe2bf5c), hayD = new THREE.Color(0xb8902f);
    const grass = new THREE.Color(0x74c04c), grassD = new THREE.Color(0x5aa63c), tmp = new THREE.Color();
    const hw = T.halfW;
    for (let v = 0; v < n; v++) {
      const x = pos.getX(v), z = pos.getZ(v);
      const d = distToCenter(T, x, z);
      let y = T.height(x, z);
      const nz = hash2(x * 3.1, z * 3.1), nz2 = hash2(Math.floor(x * 0.7), Math.floor(z * 0.7));
      const rp = rampAt(T, x, z);
      if (rp >= 0 && d < hw + 0.2) {
        // jump ramp: bright wooden boards with red/yellow chevrons so you see it coming
        tmp.set((Math.floor(rp * 6) & 1) ? 0xffcf3a : 0xe0452e);
        if (rp > 0.97) tmp.set(0xffffff);
      } else if (d < hw) {
        tmp.copy(dirt).lerp(dirtD, nz * 0.5 + (d > hw - 0.35 ? 0.4 : 0)); if (y > 0.05) tmp.lerp(dirtL, Math.min(0.6, y * 0.35)); else if (y < -0.02) tmp.lerp(dirtD, 0.5);
      } else if (d < hw + 0.85) {
        const u = (d - hw) / 0.85;
        y += 0.38 * Math.sin(Math.PI * u) ** 0.6;
        tmp.copy(hay).lerp(hayD, (Math.floor((x + z) * 2.2) & 1) ? 0.15 + nz * 0.2 : nz * 0.25);
      } else {
        tmp.copy(grass).lerp(grassD, nz * 0.35 + nz2 * 0.3);
        if (d < hw + 1.4) tmp.lerp(dirt, 0.25);
        y += (nz2 - 0.5) * 0.12 + (d > 8 ? Math.min(1.5, (d - 8) * 0.06) * hash2(x * 0.11, z * 0.13) : 0);
      }
      pos.setY(v, y);
      col[v * 3] = tmp.r; col[v * 3 + 1] = tmp.g; col[v * 3 + 2] = tmp.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    geo.computeVertexNormals();
    const ground = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ vertexColors: true, map: grainTexture() }));
    ground.receiveShadow = true; ground.userData.own = true; G.add(ground);
    // start line (checkered strip)
    const s0 = 0, ang = Math.atan2(T.tz[s0], T.tx[s0]);
    const chk = new THREE.Mesh(new THREE.PlaneGeometry(0.7, hw * 2), new THREE.MeshLambertMaterial({ map: checkerTexture(), polygonOffset: true, polygonOffsetFactor: -2 }));
    chk.rotation.x = -Math.PI / 2; chk.rotation.z = -ang; chk.position.set(T.xs[s0], T.height(T.xs[s0], T.zs[s0]) + 0.02, T.zs[s0]);
    chk.receiveShadow = true; G.add(chk);
    // mud puddles
    for (const f of T.feats) if (f.type === 'mud') {
      const m = new THREE.Mesh(new THREE.CircleGeometry(f.r, 24), new THREE.MeshPhongMaterial({ color: 0x6a4a2e, shininess: 90, specular: 0x887766, transparent: true, opacity: 0.92, polygonOffset: true, polygonOffsetFactor: -1 }));
      m.rotation.x = -Math.PI / 2; m.position.set(f.x, T.height(f.x, f.z) + 0.03, f.z); m.receiveShadow = true; G.add(m);
      const rim = new THREE.Mesh(new THREE.RingGeometry(f.r, f.r + 0.25, 24), new THREE.MeshLambertMaterial({ color: 0x8a5a32, polygonOffset: true, polygonOffsetFactor: -1 }));
      rim.rotation.x = -Math.PI / 2; rim.position.copy(m.position); G.add(rim);
    }
    // bump markers: little white/red posts at each end
    for (const f of T.feats) if (f.type === 'bump') {
      for (const s of [-1, 1]) {
        const off = s * (hw + 1.2), x = f.x - f.tz * off, z = f.z + f.tx * off;
        this._place(G, 'pylon', x, z, 0, 1.6);
      }
    }
    for (const f of T.feats) if (f.type === 'ramp') {
      for (const s of [-1, 1]) for (const a of [-2.4, 0]) {
        const off = s * (hw + 0.9), x = f.x - f.tz * off + f.tx * a, z = f.z + f.tx * off + f.tz * a;
        this._place(G, 'pylon', x, z, 0, 1.8);
      }
    }
    // decor: start banners, flag, grandstand, trees
    const nx = -T.tz[s0], nz = T.tx[s0];
    this._place(G, 'bannerTowerRed', T.xs[s0] + nx * (hw + 1.1), T.zs[s0] + nz * (hw + 1.1), -ang, 1.6);
    this._place(G, 'bannerTowerGreen', T.xs[s0] - nx * (hw + 1.1), T.zs[s0] - nz * (hw + 1.1), -ang, 1.6);
    const placed = [];
    const free = (x, z, r) => distToCenter(T, x, z) > hw + r && placed.every(p => Math.hypot(p[0] - x, p[1] - z) > p[2] + r);
    // grandstand near the start on the roomier side
    for (const side of [1, -1]) {
      const ox = T.xs[8] + nx * side * (hw + 3.2), oz = T.zs[8] + nz * side * (hw + 3.2);
      if (free(ox, oz, 2.6) && Math.abs(ox) < 23 && Math.abs(oz) < 13) {
        this._place(G, 'grandStand', ox, oz, Math.atan2(-nx * side, -nz * side), 2.2); placed.push([ox, oz, 2.6]); break;
      }
    }
    // finish flags on both sides of the line
    for (const side of [1, -1]) {
      const fl = this._place(G, 'flagCheckers', T.xs[s0] + nx * side * (hw + 0.5) + T.tx[s0] * 0.6, T.zs[s0] + nz * side * (hw + 0.5) + T.tz[s0] * 0.6, -ang, 2.2);
      if (fl) { fl.userData.wave = true; (this.flags = this.flags || []).push(fl); }
    }
    this._buildCrowd(G, T, free, placed);
    const rnd = mulberry(T.N * 7 + (T.reverse ? 3 : 0));
    let tries = 0, trees = 0;
    while (trees < 46 && tries < 900) {
      tries++;
      const x = (rnd() * 2 - 1) * 30, z = (rnd() * 2 - 1) * 19;
      const big = rnd() < 0.45, r = big ? 1.4 : 0.9;
      if (!free(x, z, r + 0.6)) continue;
      // keep the playfield readable: fewer trees inside the loop
      if (Math.abs(x) < 20 && Math.abs(z) < 11 && rnd() < 0.6) continue;
      this._place(G, big ? 'treeLarge' : 'treeSmall', x, z, rnd() * 6, big ? 2.4 : 1.8);
      placed.push([x, z, r]); trees++;
    }
    for (let k = 0; k < 3; k++) {
      const x = (rnd() * 2 - 1) * 26, z = -15 - rnd() * 2;
      if (free(x, z, 1.5)) { this._place(G, 'tent', x, z, 0, 2); placed.push([x, z, 1.5]); }
    }
    // cars
    for (const c of this.cars) this.scene.remove(c.root);
    this.cars = [];
    this._resetMarks();
    for (const p of this.pickMeshes.values()) this.scene.remove(p);
    this.pickMeshes.clear();
    for (const p of this.parts) { p.life = 0; p.mesh.visible = false; }
  }

  // spectators: little round people (instanced, cheap), thick near the start/finish line
  _buildCrowd(G, T, free, placed) {
    const hw = T.halfW, spots = [];
    const rnd = mulberry(T.N * 13 + 5);
    const nearStart = i => Math.min(i, T.N - i) < 26;
    for (let i = 0; i < T.N; i += 1) {
      const dense = nearStart(i);
      if (!dense && (i % 4 || rnd() < 0.45)) continue;
      for (const side of [1, -1]) {
        const rows = dense ? 3 : 1;
        for (let r = 0; r < rows; r++) {
          const off = side * (hw + 1.45 + r * 0.55 + rnd() * 0.2);
          const x = T.xs[i] - T.tz[i] * off, z = T.zs[i] + T.tx[i] * off;
          if (Math.abs(x) > 28 || Math.abs(z) > 17) continue;
          if (distToCenter(T, x, z) < hw + 1.25) continue;
          if (placed.some(p => Math.hypot(p[0] - x, p[1] - z) < p[2])) continue;
          if (spots.some(p => Math.hypot(p.x - x, p.z - z) < 0.42)) continue;
          spots.push({ x, z, y: T.height(x, z) + 0.38 * 0, face: Math.atan2(T.zs[i] - z, T.xs[i] - x), ph: rnd() * 6, i });
        }
      }
    }
    const max = MOBILE ? 170 : 300;
    while (spots.length > max) spots.splice(Math.floor(rnd() * spots.length), 1);
    const n = spots.length;
    const bodyG = new THREE.CapsuleGeometry(0.13, 0.22, 3, 8); bodyG.translate(0, 0.24, 0);
    const headG = new THREE.SphereGeometry(0.12, 10, 8); headG.translate(0, 0.56, 0);
    const armG = new THREE.CapsuleGeometry(0.04, 0.2, 2, 5); armG.translate(0, 0.62, 0);
    const body = new THREE.InstancedMesh(bodyG, new THREE.MeshLambertMaterial(), n);
    const head = new THREE.InstancedMesh(headG, new THREE.MeshLambertMaterial(), n);
    const arms = new THREE.InstancedMesh(armG, new THREE.MeshLambertMaterial(), n * 2);
    const shirts = [0xff5a3c, 0x3c8dff, 0xffcc2a, 0x9b5cff, 0x2fbf71, 0xff8ad8, 0xffffff, 0xff9a2a];
    const skins = [0xf6d0a8, 0xe0ac7e, 0xb07a52, 0x7a4e2e, 0xffe0bd];
    const col = new THREE.Color();
    for (let k = 0; k < n; k++) {
      body.setColorAt(k, col.set(shirts[Math.floor(rnd() * shirts.length)]));
      head.setColorAt(k, col.set(skins[Math.floor(rnd() * skins.length)]));
      arms.setColorAt(2 * k, col.set(skins[k % skins.length])); arms.setColorAt(2 * k + 1, col);
    }
    for (const m of [body, head, arms]) { m.castShadow = !MOBILE; m.userData.own = true; m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); G.add(m); }
    this.crowd = { spots, body, head, arms, cheer: 0 };
    this._crowdPose(0, null);
  }
  _crowdPose(time, R) {
    const C = this.crowd; if (!C) return;
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), qa = new THREE.Quaternion(), v = new THREE.Vector3(), one = new THREE.Vector3(1, 1, 1), up = new THREE.Vector3(0, 1, 0), fw = new THREE.Vector3();
    const pl = R && R.cars[0];
    for (let k = 0; k < C.spots.length; k++) {
      const p = C.spots[k];
      let ex = C.cheer * 0.6;
      if (pl) { const d = Math.hypot(pl.x - p.x, pl.z - p.z); if (d < 5) ex = Math.max(ex, (1 - d / 5) * (pl.place === 1 ? 1 : 0.6)); }
      const hop = ex > 0.05 ? Math.abs(Math.sin(time * 9 + p.ph)) * 0.22 * ex : Math.abs(Math.sin(time * 1.5 + p.ph)) * 0.015;
      q.setFromAxisAngle(up, -p.face + Math.PI / 2);
      v.set(p.x, this.T.height(p.x, p.z) + hop, p.z);
      m.compose(v, q, one); C.body.setMatrixAt(k, m); C.head.setMatrixAt(k, m);
      // arms: down at rest, waving overhead when excited
      fw.set(1, 0, 0).applyQuaternion(q);
      for (const sd of [-1, 1]) {
        const wave = ex > 0.05 ? 2.6 + Math.sin(time * 12 + p.ph + sd) * 0.5 : 0.25;
        qa.setFromAxisAngle(fw, sd * wave).multiply(q);
        const sx = p.x + fw.x * sd * 0.15, sz = p.z + fw.z * sd * 0.15;
        m.compose(v.set(sx, this.T.height(p.x, p.z) + hop + 0.42, sz), qa, one);
        m.multiply(new THREE.Matrix4().makeTranslation(0, -0.62, 0));
        C.arms.setMatrixAt(2 * k + (sd > 0 ? 1 : 0), m);
      }
    }
    C.body.instanceMatrix.needsUpdate = C.head.instanceMatrix.needsUpdate = C.arms.instanceMatrix.needsUpdate = true;
    C.cheer = Math.max(0, C.cheer - 0.008);
  }
  cheer(a = 1) { if (this.crowd) this.crowd.cheer = Math.max(this.crowd.cheer, a); }
  kick(a) { this.shake = Math.min(0.6, Math.max(this.shake, a)); }

  // ---------- podium (after the race) ----------
  startPodium(R, order, colors) {
    this.endPodium();
    const b = this.bounds, cx = (b.x0 + b.x1) / 2, cz = (b.z0 + b.z1) / 2 + 1;
    const g = new THREE.Group(); g.position.set(cx, 3.2, cz); this.scene.add(g);
    const mats = [0xffd23a, 0xd9dde3, 0xe3a46a].map(c => new THREE.MeshStandardMaterial({ color: c, metalness: 0.35, roughness: 0.45 }));
    const slot = [[0, 1.6], [-3.1, 1.1], [3.1, 0.7]];
    const base = new THREE.Mesh(new THREE.BoxGeometry(10.5, 0.3, 4.2), new THREE.MeshLambertMaterial({ color: 0xb22a2a }));
    base.position.y = -0.15; base.receiveShadow = true; g.add(base);
    for (let k = 0; k < 3; k++) {
      const blk = new THREE.Mesh(new THREE.BoxGeometry(3, slot[k][1], 3), mats[k]);
      blk.position.set(slot[k][0], slot[k][1] / 2, 0); blk.castShadow = blk.receiveShadow = true; g.add(blk);
      const num = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.2), new THREE.MeshBasicMaterial({ map: textTex(String(k + 1), '#2b1d12'), transparent: true }));
      num.position.set(slot[k][0], slot[k][1] / 2, 1.51); g.add(num);
    }
    const cars = [];
    for (let k = 0; k < 3 && k < order.length; k++) {
      const v = this.cars[order[k].k]; if (!v) continue;
      v.root.position.set(cx + slot[k][0], 3.2 + slot[k][1], cz); v.root.rotation.set(0, -Math.PI / 2 + (k ? (k === 1 ? 0.35 : -0.35) : 0), 0);
      v.tilt.rotation.set(0, 0, 0); cars.push(v);
    }
    for (const v of this.cars) if (!cars.includes(v)) v.root.visible = false;
    // sparkling soda bottle (gold, no label) next to the winner
    const bottle = new THREE.Group();
    const glass = new THREE.MeshStandardMaterial({ color: 0xe8b52c, metalness: 0.7, roughness: 0.25 });
    const b1 = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.24, 0.75, 14), glass); b1.position.y = 0.37; bottle.add(b1);
    const b2 = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.22, 0.32, 14), glass); b2.position.y = 0.9; bottle.add(b2);
    const foil = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.18, 12), new THREE.MeshStandardMaterial({ color: 0xfff1a8, metalness: 0.9, roughness: 0.2 })); foil.position.y = 1.12; bottle.add(foil);
    const cork = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.16, 10), new THREE.MeshLambertMaterial({ color: 0xc89a5a })); cork.position.y = 1.27; bottle.add(cork);
    bottle.position.set(slot[0][0] + 0.2, slot[0][1] + 1.05, 0.9); bottle.scale.setScalar(1.3); g.add(bottle);
    this.podium = { g, bottle, cork, t: 0, popped: false, cx, cz, top: 3.2 + slot[0][1], winX: cx + slot[0][0] };
    for (const p of this.parts) { p.life = 0; p.mesh.visible = false; }
    this.cheer(1);
  }
  endPodium() {
    if (!this.podium) return;
    this.scene.remove(this.podium.g); this.podium = null;
    for (const v of this.cars) v.root.visible = true;
    this._fitCamera();
  }
  _podiumStep(dt, time) {
    const P = this.podium; P.t += dt;
    const cam = this.camera, want = new THREE.Vector3(P.cx, P.top + 4.2, P.cz + 10.5), look = new THREE.Vector3(P.cx, P.top + 0.4, P.cz);
    cam.position.lerp(want, Math.min(1, dt * 3)); cam.lookAt(look);
    const bt = P.bottle;
    if (P.t < 1.3) { bt.rotation.z = Math.sin(P.t * 34) * 0.35 * Math.min(1, P.t * 2); }
    else {
      bt.rotation.z += (-0.9 - bt.rotation.z) * Math.min(1, dt * 8);
      if (!P.popped) {
        P.popped = true; P.cork.visible = false; this.onPop && this.onPop();
        const wp = new THREE.Vector3(); P.cork.getWorldPosition(wp);
        this.spawn(wp.x, wp.y, wp.z, 2.5, 9, 0.6, 1.6, 0.16, 0.16, 0xc89a5a, 1, 14);
      }
      if (P.t < 3.6) {
        const wp = new THREE.Vector3(); P.cork.getWorldPosition(wp);
        for (let i = 0; i < (MOBILE ? 3 : 6); i++) this.spawn(wp.x, wp.y, wp.z, 3 + Math.random() * 2.5, 3 + Math.random() * 3, (Math.random() - 0.5) * 2, 1.0, 0.08, 0.3, Math.random() < 0.7 ? 0xfffbe8 : 0xffe27a, 0.95, 9);
      }
    }
    if (Math.random() < dt * 6) this.confetti(P.winX + (Math.random() - 0.5) * 8, P.top + 3 + Math.random() * 2, P.cz + (Math.random() - 0.5) * 3, 6);
    for (let k = 0; k < this.cars.length; k++) { const v = this.cars[k]; if (v.root.visible) v.tilt.rotation.z = Math.abs(Math.sin(time * 6 + k)) * 0.06; }
  }
  confetti(x, y, z, n = 30) {
    const cols = [0xff5a3c, 0xffd23a, 0x3c8dff, 0x7ee05a, 0xff8ad8, 0xffffff];
    for (let i = 0; i < n; i++) this.spawn(x, y, z, (Math.random() - 0.5) * 7, 3 + Math.random() * 5, (Math.random() - 0.5) * 7, 1.6 + Math.random(), 0.09, 0.09, cols[i % cols.length], 1, 6);
  }

  _place(G, name, x, z, rotY, scale) {
    const src = this.models[name]; if (!src) return null;
    const o = src.clone(); o.scale.setScalar(scale); o.rotation.y = rotY || 0;
    o.position.set(x, this.T.height(x, z), z); G.add(o); return o;
  }

  addCars(colors, upg) {
    const src = this.models.raceCarRed;
    for (let k = 0; k < colors.length; k++) {
      const root = new THREE.Group();
      let body;
      if (src) {
        body = src.clone(true);
        body.traverse(o => {
          if (o.isMesh) {
            o.material = o.material.clone();
            if (o.material.name === 'red') { o.material.color.set(colors[k]); if (o.material.emissive) o.material.emissive.set(colors[k]).multiplyScalar(0.18); }
          }
        });
        // scale model to ~1.3 long
        const box = new THREE.Box3().setFromObject(body), size = box.getSize(new THREE.Vector3());
        const len = Math.max(size.x, size.z), s = 2.7 / len; // was 1.6: cars were too small on the whole-track view
        body.scale.setScalar(s);
        const box2 = new THREE.Box3().setFromObject(body), c2 = box2.getCenter(new THREE.Vector3());
        body.position.set(-c2.x, -box2.min.y, -c2.z);
        // face +X (sim heading 0) : model's long axis
        if (size.x < size.z) { const w = new THREE.Group(); w.add(body); w.rotation.y = Math.PI / 2; body = w; }
      } else {
        body = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.4, 0.7), new THREE.MeshLambertMaterial({ color: colors[k] }));
        body.position.y = 0.2; body.castShadow = true;
      }
      const tilt = new THREE.Group(); tilt.add(body); root.add(tilt);
      // little number flag so the player can find "their" car
      // soft round shadow under every car (reads well even when the real shadow is small)
      const blob = new THREE.Mesh(new THREE.PlaneGeometry(3.1, 1.9), new THREE.MeshBasicMaterial({ map: blobTex(), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4 }));
      blob.rotation.x = -Math.PI / 2; blob.position.y = 0.04; root.add(blob); root.userData.blob = blob;
      if (k === 0) {
        const tag = new THREE.Group();
        const arrow = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.7, 4), new THREE.MeshBasicMaterial({ color: 0xffe14a }));
        arrow.rotation.x = Math.PI; tag.add(arrow);
        const lab = new THREE.Sprite(new THREE.SpriteMaterial({ map: textTex(this.youLabel || 'YOU', '#ffffff', '#ff5a3c'), depthTest: false }));
        lab.scale.set(1.9, 0.95, 1); lab.position.y = 0.95; lab.renderOrder = 10; tag.add(lab);
        tag.position.y = 2.1; root.add(tag); root.userData.tag = tag;
      }
      const wheels = [];
      root.traverse(o => { if (/wheel/i.test(o.name)) wheels.push(o); });
      const flame = (k === 0 && upg) ? this._dressCar(tilt, wheels, upg) : null;
      this.scene.add(root);
      this.cars.push({ root, tilt, wheels, roll: 0, modelFlip: null, flame });
    }
  }

  // visible upgrades on the player's car: spoiler (suspension), bigger wheels (tires),
  // exhaust pipes + flame (engine), side nitro bottles (nitro), and a trim stripe in the best part's finish
  _dressCar(tilt, wheels, up) {
    const TC = [0x9aa3ad, 0xe0452e, 0x2f7bff, 0xffc72a], tierOf = lv => (lv >= 5 ? 3 : lv >= 3 ? 2 : lv >= 1 ? 1 : 0);
    const mat = lv => new THREE.MeshStandardMaterial({ color: TC[tierOf(lv)], metalness: 0.25, roughness: 0.35, emissive: TC[tierOf(lv)], emissiveIntensity: 0.15 });
    const box = new THREE.Box3().setFromObject(tilt), mn = box.min, mx = box.max;
    const W = mx.z - mn.z, H = mx.y - mn.y, back = mn.x;
    const add = (geo, m, x, y, z) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = true; tilt.add(o); return o; };
    if (up.tire > 0) { const s = 1 + 0.05 * up.tire; for (const w of wheels) w.scale.multiplyScalar(s); }
    if (up.top > 0) { // rear wing grows with level
      const m = mat(up.top), y0 = mn.y + H * 0.55, h = H * (0.12 + 0.035 * up.top), wd = W * (0.62 + 0.04 * up.top);
      add(new THREE.BoxGeometry(0.34 + 0.03 * up.top, 0.06, wd), m, back + 0.22, y0 + h, 0);
      for (const z of [-wd * 0.3, wd * 0.3]) add(new THREE.BoxGeometry(0.07, h, 0.05), m, back + 0.24, y0 + h / 2, z);
    }
    let flame = null;
    if (up.eng > 0) {
      const chrome = new THREE.MeshStandardMaterial({ color: 0xdfe5ea, metalness: 1, roughness: 0.2 });
      const r = 0.07 + 0.012 * up.eng, n = up.eng >= 3 ? 2 : 1;
      flame = new THREE.Group();
      for (let i = 0; i < n; i++) {
        const z = n === 1 ? -W * 0.22 : (i ? 1 : -1) * W * 0.22;
        const p = add(new THREE.CylinderGeometry(r, r, 0.4, 10), chrome, back + 0.05, mn.y + H * 0.3, z); p.rotation.z = Math.PI / 2;
        const f = new THREE.Mesh(new THREE.ConeGeometry(r * 1.4, 1, 10), new THREE.MeshBasicMaterial({ color: up.eng >= 5 ? 0x66ccff : 0xff8a2a, transparent: true, opacity: 0.85, depthWrite: false, blending: THREE.AdditiveBlending }));
        f.geometry.translate(0, 0.5, 0); f.rotation.z = Math.PI / 2; f.position.set(back - 0.15, mn.y + H * 0.3, z); flame.add(f);
      }
      flame.userData.len = 0.25 + 0.09 * up.eng; tilt.add(flame);
    }
    if (up.nitro > 0) {
      const m = new THREE.MeshStandardMaterial({ color: 0x7ee05a, metalness: 0.5, roughness: 0.3, emissive: 0x2a6010 });
      const n = Math.min(3, Math.ceil(up.nitro / 2));
      for (let i = 0; i < n; i++) for (const sd of [-1, 1]) {
        const c = add(new THREE.CapsuleGeometry(0.09, 0.42, 4, 10), m, back + 0.55 + i * 0.32, mn.y + H * 0.55, sd * (W / 2 + 0.05)); c.rotation.z = Math.PI / 2;
      }
    }
    return flame;
  }

  // ---------- particles ----------
  _initParticles() {
    this.parts = [];
    const geo = new THREE.IcosahedronGeometry(0.5, 1);
    for (let i = 0; i < (MOBILE ? 160 : 260); i++) {
      const m = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 1, flatShading: true, depthWrite: false }));
      m.visible = false; this.scene.add(m);
      this.parts.push({ mesh: m, life: 0, max: 1, vx: 0, vy: 0, vz: 0, s0: 0.2, s1: 0.5, type: 0 });
    }
    this.pi = 0;
  }
  spawn(x, y, z, vx, vy, vz, life, s0, s1, color, op = 0.9, grav = 0) {
    const p = this.parts[this.pi = (this.pi + 1) % this.parts.length];
    p.mesh.position.set(x, y, z); p.vx = vx; p.vy = vy; p.vz = vz; p.life = p.max = life; p.s0 = s0; p.s1 = s1; p.op = op; p.grav = grav;
    p.mesh.material.color.set(color); p.mesh.visible = true; p.mesh.rotation.set(Math.random() * 3, Math.random() * 3, 0);
  }
  puff(c) { // nitro "pfff" cloud behind the car: soft round green-yellow puffs
    const ca = Math.cos(c.a), sa = Math.sin(c.a);
    const cols = [0xd8f59a, 0xc4ec7c, 0xf2f7c8, 0xb8e070];
    for (let i = 0; i < 9; i++) {
      const b = 0.7 + Math.random() * 0.6, sp = (Math.random() - 0.5) * 0.8;
      this.spawn(c.x - ca * b - sa * sp, c.y + 0.35 + Math.random() * 0.3, c.z - sa * b + ca * sp,
        -ca * (1.5 + Math.random() * 2) + (Math.random() - 0.5), 0.6 + Math.random() * 0.8, -sa * (1.5 + Math.random() * 2) + (Math.random() - 0.5),
        1.1 + Math.random() * 0.6, 0.25, 0.9 + Math.random() * 0.6, cols[i % 4], 0.85);
    }
  }
  _initMarks() {
    const g = new THREE.PlaneGeometry(0.13, 0.32); g.rotateX(-Math.PI / 2);
    const m = new THREE.MeshBasicMaterial({ color: 0x4a2c14, transparent: true, opacity: 0.32, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3 });
    this.marks = new THREE.InstancedMesh(g, m, 1600); this.marks.frustumCulled = false; this.markI = 0;
    this.scene.add(this.marks); this._resetMarks();
  }
  _resetMarks() {
    const z = new THREE.Matrix4().makeScale(0, 0, 0);
    for (let i = 0; i < 1600; i++) this.marks.setMatrixAt(i, z);
    this.marks.instanceMatrix.needsUpdate = true;
  }
  mark(x, y, z, a) {
    const m = new THREE.Matrix4().compose(new THREE.Vector3(x, y + 0.03, z), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -a + Math.PI / 2), new THREE.Vector3(1, 1, 1));
    this.marks.setMatrixAt(this.markI = (this.markI + 1) % 1600, m); this.marksDirty = true;
  }

  // ---------- per frame ----------
  update(R, dt, time) {
    const T = R.T;
    this.perf(dt);
    if (this.podium) { this._podiumStep(dt, time); this._particles(dt); this._crowdPose(time, null); this.renderer.render(this.scene, this.camera); return; }
    // camera shake (nitro, bumps, landings)
    if (this.camOverride) { this.shake = Math.max(0, this.shake - dt * 1.6); this.camOverride(this.camera, time); if (this.shake > 0) this.camera.position.y += (Math.random() - 0.5) * this.shake * 0.5; }
    else if (this.camBase) {
      this.shake = Math.max(0, this.shake - dt * 1.6);
      const s = this.shake * this.shake * 0.9;
      this.camera.position.set(this.camBase.x + (Math.random() - 0.5) * s, this.camBase.y + (Math.random() - 0.5) * s, this.camBase.z + (Math.random() - 0.5) * s);
    }
    for (const f of this.flags || []) f.rotation.z = Math.sin(time * 6) * 0.08;
    if ((this._crowdTick = (this._crowdTick || 0) + 1) % (MOBILE ? 2 : 1) === 0) this._crowdPose(time, R);
    for (let k = 0; k < R.cars.length; k++) {
      const c = R.cars[k], v = this.cars[k]; if (!v) continue;
      v.root.position.set(c.x, c.y, c.z);
      v.root.rotation.y = -c.a;
      // pitch/roll from ground (or nose-up in the air)
      const ca = Math.cos(c.a), sa = Math.sin(c.a);
      let pitch, roll;
      if (!c.air) {
        const hf = T.height(c.x + ca * 0.5, c.z + sa * 0.5), hb = T.height(c.x - ca * 0.5, c.z - sa * 0.5);
        const hl = T.height(c.x + sa * 0.35, c.z - ca * 0.35), hr = T.height(c.x - sa * 0.35, c.z + ca * 0.35);
        pitch = Math.atan2(hf - hb, 1.0); roll = Math.atan2(hl - hr, 0.7);
      } else { pitch = Math.max(-0.4, Math.min(0.4, c.vy * 0.05)); roll = 0; }
      // body lean when drifting
      const vL = -c.vx * sa + c.vz * ca;
      v.roll += ((roll + vL * 0.03) - v.roll) * Math.min(1, dt * 10);
      v.tilt.rotation.set(v.roll, 0, pitch, 'YXZ');
      v.tilt.rotation.order = 'XYZ';
      v.tilt.rotation.x = v.roll; v.tilt.rotation.z = pitch;
      for (const w of v.wheels) w.rotation.x += c.speed * dt * 3;
      if (v.flame) { const L = v.flame.userData.len * (c.boostT > 0 ? 2.6 : 0.6 + Math.min(1, c.speed / 10) * 0.6) * (0.8 + Math.random() * 0.4); for (const f of v.flame.children) f.scale.set(1, L, 1); }
      if (v.root.userData.tag) { v.root.userData.tag.position.y = 2.1 + Math.sin(time * 5) * 0.15; v.root.userData.tag.rotation.y = c.a; }
      if (v.root.userData.blob) { const gh = T.height(c.x, c.z); v.root.userData.blob.position.y = gh - c.y + 0.04; v.root.userData.blob.material.opacity = Math.max(0.25, 1 - (c.y - gh) * 0.35); }
      // dust + tire marks
      if (!c.air && c.speed > 2) {
        const rx = c.x - ca * 0.45, rz = c.z - sa * 0.45;
        if (c.drift > 2.0 || (c.input.brake && c.speed > 4)) {
          this.mark(rx - sa * 0.3, T.height(rx, rz), rz + ca * 0.3, c.a);
          this.mark(rx + sa * 0.3, T.height(rx, rz), rz - ca * 0.3, c.a);
        }
        const rate = (c.speed / 11) * (c.drift > 2 ? 2.5 : 0.8) * dt * 30;
        if (Math.random() < rate) {
          const mud = c.mud;
          this.spawn(rx + (Math.random() - 0.5) * 0.5, c.y + 0.1, rz + (Math.random() - 0.5) * 0.5,
            -c.vx * 0.12 + (Math.random() - 0.5), 0.5 + Math.random() * (mud ? 2.5 : 0.6), -c.vz * 0.12 + (Math.random() - 0.5),
            mud ? 0.6 : 0.9 + Math.random() * 0.5, 0.1, mud ? 0.22 : 0.45 + Math.random() * 0.3, mud ? 0x5a3b20 : 0xd9b080, mud ? 1 : 0.55, mud ? 9 : 0);
        }
      }
      if (c.boostT > 0 && Math.random() < dt * 25) {
        this.spawn(c.x - ca * 0.8, c.y + 0.3, c.z - sa * 0.8, -ca * 2, 0.4, -sa * 2, 0.7, 0.15, 0.6, 0xdff7a8, 0.7);
      }
    }
    if (this.marksDirty) { this.marks.instanceMatrix.needsUpdate = true; this.marksDirty = false; }
    this._particles(dt);
    this._pickups(R, time);
    this.renderer.render(this.scene, this.camera);
  }
  _particles(dt) {
    for (const p of this.parts) {
      if (p.life <= 0) continue;
      p.life -= dt;
      if (p.life <= 0) { p.mesh.visible = false; continue; }
      p.vy -= p.grav * dt;
      p.mesh.position.x += p.vx * dt; p.mesh.position.y += p.vy * dt; p.mesh.position.z += p.vz * dt;
      p.vx *= (1 - dt * 1.5); p.vz *= (1 - dt * 1.5);
      const u = 1 - p.life / p.max;
      p.mesh.scale.setScalar(p.s0 + (p.s1 - p.s0) * Math.sqrt(u));
      p.mesh.material.opacity = p.op * (1 - u * u);
    }
  }
  _pickups(R, time) {
    const T = R.T;
    const seen = new Set();
    for (const p of R.pickups) {
      if (!p.alive) continue;
      seen.add(p.id);
      let m = this.pickMeshes.get(p.id);
      if (!m) { m = this._pickMesh(p.type); this.scene.add(m); this.pickMeshes.set(p.id, m); }
      m.position.set(p.x, T.height(p.x, p.z) + 0.55 + Math.sin(time * 3 + p.x) * 0.12, p.z);
      m.rotation.y = time * 2.5;
    }
    for (const [id, m] of this.pickMeshes) if (!seen.has(id)) { this.scene.remove(m); this.pickMeshes.delete(id); }
  }

  burst(x, z, color, n = 10) {
    const y = this.T.height(x, z) + 0.5;
    for (let i = 0; i < n; i++) this.spawn(x, y, z, (Math.random() - 0.5) * 4, 2 + Math.random() * 3, (Math.random() - 0.5) * 4, 0.6, 0.12, 0.2, color, 1, 9);
  }
  landDust(c, big) { const n = big ? 16 : 8; for (let i = 0; i < n; i++) { const a = i / n * 6.283; this.spawn(c.x + Math.cos(a) * 0.6, c.y + 0.1, c.z + Math.sin(a) * 0.6, Math.cos(a) * (2 + Math.random() * 2.5), 0.5 + Math.random(), Math.sin(a) * (2 + Math.random() * 2.5), 0.8, 0.25, big ? 1.0 : 0.6, 0xd9b080, 0.7); } }
  bonkDust(x, z, v) { const y = this.T.height(x, z) + 0.3, n = Math.min(10, 3 + Math.floor(v)); for (let i = 0; i < n; i++) this.spawn(x, y, z, (Math.random() - 0.5) * 5, 1 + Math.random() * 2.5, (Math.random() - 0.5) * 5, 0.6, 0.15, 0.55, i & 1 ? 0xe2bf5c : 0xd9b080, 0.8, 6); }

  _pickMesh(type) {
    const g = new THREE.Group();
    if (type === 'cash') {
      // money bag: round sack + tied neck + coin
      const sack = new THREE.Mesh(new THREE.SphereGeometry(0.32, 12, 10), new THREE.MeshLambertMaterial({ color: 0xc9a25a }));
      sack.scale.y = 0.9; sack.castShadow = true; g.add(sack);
      const neck = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.22, 8), new THREE.MeshLambertMaterial({ color: 0xb08a48 }));
      neck.position.y = 0.33; g.add(neck);
      const coin = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.05, 16), new THREE.MeshLambertMaterial({ color: 0xffd23a, emissive: 0x664400 }));
      coin.rotation.x = Math.PI / 2; coin.position.set(0, 0, 0.3); g.add(coin);
    } else {
      const can = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.55, 12), new THREE.MeshLambertMaterial({ color: 0x55dd55, emissive: 0x114411 }));
      can.castShadow = true; g.add(can);
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.12, 10), new THREE.MeshLambertMaterial({ color: 0xffffff }));
      cap.position.y = 0.33; g.add(cap);
      const band = new THREE.Mesh(new THREE.CylinderGeometry(0.205, 0.205, 0.1, 12), new THREE.MeshLambertMaterial({ color: 0xffee44 }));
      g.add(band);
    }
    return g;
  }
}

function rampAt(T, x, z) {
  for (const f of T.feats) if (f.type === 'ramp') {
    const dx = x - f.x, dz = z - f.z, along = dx * f.tx + dz * f.tz, perp = Math.abs(-dx * f.tz + dz * f.tx);
    if (along > -2.6 && along <= 0.05 && perp < T.halfW + 0.1) return (along + 2.6) / 2.6;
  }
  return -1;
}
function textTex(txt, color, bg) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 128; const g = c.getContext('2d');
  if (bg) { g.fillStyle = bg; g.strokeStyle = '#fff'; g.lineWidth = 10; const r = 40; g.beginPath(); g.roundRect ? g.roundRect(14, 18, 228, 92, r) : g.rect(14, 18, 228, 92); g.fill(); g.stroke(); }
  g.font = '900 64px "Trebuchet MS", "Apple SD Gothic Neo", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.lineWidth = 8; g.strokeStyle = 'rgba(0,0,0,.35)'; if (!bg) g.strokeText(txt, 128, 68);
  g.fillStyle = color; g.fillText(txt, 128, 68);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
let _blob = null;
function blobTex() {
  if (_blob) return _blob;
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
  const gr = g.createRadialGradient(32, 32, 4, 32, 32, 31); gr.addColorStop(0, 'rgba(20,10,0,.55)'); gr.addColorStop(1, 'rgba(20,10,0,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  return (_blob = new THREE.CanvasTexture(c));
}

function distToCenter(T, x, z) {
  let bd = 1e9;
  for (let i = 0; i < T.N; i += 2) { const d = (x - T.xs[i]) ** 2 + (z - T.zs[i]) ** 2; if (d < bd) bd = d; }
  // refine with exact segment distance around the best
  return Math.sqrt(bd) - 0.06;
}
function hash2(x, y) { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); }
function mulberry(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function grainTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
  const im = g.createImageData(64, 64);
  for (let i = 0; i < 64 * 64; i++) { const v = 215 + Math.random() * 40; im.data[i * 4] = im.data[i * 4 + 1] = im.data[i * 4 + 2] = v; im.data[i * 4 + 3] = 255; }
  g.putImageData(im, 0, 0);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(60, 40); t.magFilter = THREE.NearestFilter; t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
function checkerTexture() {
  const c = document.createElement('canvas'); c.width = 16; c.height = 64; const g = c.getContext('2d');
  for (let y = 0; y < 8; y++) for (let x = 0; x < 2; x++) { g.fillStyle = (x + y) & 1 ? '#222' : '#fff'; g.fillRect(x * 8, y * 8, 8, 8); }
  const t = new THREE.CanvasTexture(c); t.magFilter = THREE.NearestFilter; t.colorSpace = THREE.SRGBColorSpace; return t;
}
