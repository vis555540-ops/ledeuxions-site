// Race simulation: physics, AI, laps, pickups. No drawing here.
import { nearestLocal, lateral } from './tracks.js';

export const LAPS = 4;
const GRAV = 35, AIR_GRAV = 21, CAR_R = 0.78; // cars are drawn bigger now -> bigger bump radius; floatier air for jumps

// per-level gains. Player parts got ~1.6x stronger (owner: "can't feel the upgrades"); level 0 is unchanged.
// AI keeps the old, gentler gains (gain = AI_GAIN) so the rivals' difficulty curve stays the same.
export const PLAYER_GAIN = { eng: 0.18, top: 0.09, tire: 1.35, boost: 0.12 };
const AI_GAIN = { eng: 0.11, top: 0.055, tire: 0.85, boost: 0 };
export function makeStats(up, extra = 0, G = PLAYER_GAIN) {
  // up = {eng, tire, top, nitro} levels 0..6 ; extra = AI difficulty bonus (0..~0.3)
  return {
    accel: 12 * (1 + G.eng * up.eng + extra),
    top: 10.2 * (1 + G.top * up.top + extra * 0.6),
    grip: 4.6 + G.tire * up.tire + extra * 3,
    nitro: 3 + up.nitro,
    boostT: 1.25 * (1 + G.boost * up.nitro), // nitro tank also makes each puff last longer
  };
}

// AI rivals for race number `race` (0-based). The first two races are deliberately gentle
// so a brand-new driver can win.
export function aiStatsFor(race) {
  const extra = Math.min(0.36, -0.1 + race * 0.035);
  const aiUp = k => ({ eng: Math.min(6, Math.floor(race * 0.45) + (k === 2 ? 1 : 0)), tire: Math.min(6, Math.floor(race * 0.4)), top: Math.min(6, Math.floor(race * 0.4) + (k === 0 ? 1 : 0)), nitro: Math.min(4, Math.floor(race / 3)) });
  const ease = race === 0 ? 0.62 : race === 1 ? 0.64 : race === 2 ? 0.7 : race < 6 ? 0.85 + 0.05 * (race - 3) : 1;
  return [0, 1, 2].map(k => {
    const st = makeStats(aiUp(k), extra - 0.04 * k, AI_GAIN);
    st.top *= ease; st.accel *= ease;
    return st;
  });
}

export function createRace(T, opts) {
  const { playerStats, aiStats, colors, names } = opts;
  const cars = [];
  const nCars = opts.solo ? 1 : 4; // solo = time attack: just the player on the track
  for (let k = 0; k < nCars; k++) {
    const row = Math.floor(k / 2), col = k % 2;
    const i = (T.N - 5 - row * 8 + T.N) % T.N; // bigger cars -> roomier starting grid
    const off = col ? -1.0 : 1.0;
    const st = k === 0 ? playerStats : aiStats[k - 1];
    const a = Math.atan2(T.tz[i], T.tx[i]);
    cars.push({
      k, isPlayer: k === 0, color: colors[k], name: names[k],
      x: T.xs[i] - T.tz[i] * off, z: T.zs[i] + T.tx[i] * off, y: 0, vy: 0, air: false,
      a, vx: 0, vz: 0, steer: 0, spin: 0,
      idx: i, laps: -1, finished: false, finishT: 0, place: 0,
      stats: st, nitro: st.nitro, boostT: 0, cash: 0,
      lapStart: 0, bestLap: 0, lastLap: 0, stuckT: 0, revT: 0,
      lane: (k - 1.5) * 0.45, laneP: Math.random() * 6, nitroCD: 2 + Math.random() * 3,
      drift: 0, mud: false, speed: 0, input: { steer: 0, gas: 0, brake: 0, nitro: false },
    });
    cars[k].y = T.height(cars[k].x, cars[k].z);
  }
  // rubber band: rivals far ahead of the player ease off, rivals behind push a bit (strong in the first races)
  const R = { solo: !!opts.solo, laps: opts.laps || LAPS, rubber: opts.rubber == null ? 0.5 : opts.rubber, T, cars, autoGas: !!opts.autoGas, assist: !!opts.autoGas, t: 0, state: 'countdown', count: 3.0, events: [], pickups: [], finishOrder: [], endT: -1, lastAiFinishT: -1, done: false };
  for (let n = 0; n < 4; n++) spawnPickup(R, n === 0 ? 'nitro' : 'cash');
  return R;
}

function spawnPickup(R, type) {
  const T = R.T;
  for (let tries = 0; tries < 30; tries++) {
    const i = Math.floor(Math.random() * T.N);
    if (i < 12 || i > T.N - 14) continue; // keep the start area clear
    const off = (Math.random() * 2 - 1) * (T.halfW - 0.7);
    const x = T.xs[i] - T.tz[i] * off, z = T.zs[i] + T.tx[i] * off;
    if (T.mudAt(x, z)) continue;
    if (R.pickups.some(p => p.alive && Math.hypot(p.x - x, p.z - z) < 4)) continue;
    R.pickups.push({ type, x, z, alive: true, id: Math.random() });
    return;
  }
}

export function aiInput(R, c, dt, skill) {
  const T = R.T;
  const sp = c.speed;
  const look = Math.floor(5 + sp * 0.75);
  const j = (c.idx + look) % T.N;
  c.laneP += dt * 0.5;
  const lane = c.lane + Math.sin(c.laneP) * 0.5;
  const tx = T.xs[j] - T.tz[j] * lane, tz = T.zs[j] + T.tx[j] * lane;
  const want = Math.atan2(tz - c.z, tx - c.x);
  let d = want - c.a; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI;
  const inp = c.input;
  if (c.revT > 0) { c.revT -= dt; inp.gas = 0; inp.brake = 1; inp.steer = -Math.sign(d); inp.nitro = false; return; }
  inp.steer = Math.max(-1, Math.min(1, d * 2.6));
  inp.gas = Math.abs(d) < 1.0 ? 1 : 0;
  inp.brake = Math.abs(d) > 1.4 && sp > 5 ? 1 : 0;
  // stuck against a wall -> back up a little
  if (R.state === 'race' && sp < 0.8 && !c.air) { c.stuckT += dt; if (c.stuckT > 1.2) { c.revT = 0.7; c.stuckT = 0; } } else c.stuckT = 0;
  c.nitroCD -= dt;
  inp.nitro = false;
  if (c.nitro > 0 && c.nitroCD <= 0 && Math.abs(d) < 0.12 && sp > 6 && c.boostT <= 0) {
    // look further ahead: is it straight enough?
    const j2 = (c.idx + 22) % T.N;
    const straight = T.tx[j2] * T.tx[c.idx] + T.tz[j2] * T.tz[c.idx];
    if (straight > 0.9) { inp.nitro = true; c.nitroCD = 4 + Math.random() * 5 * (1.2 - skill); }
  }
}

export function step(R, dt) {
  const T = R.T;
  R.t += dt;
  if (R.state === 'countdown') {
    if (R.count === 3.0) R.events.push({ t: 'beep', n: 3 });
    const prev = Math.ceil(R.count);
    R.count -= dt;
    if (Math.ceil(R.count) !== prev && R.count > 0) R.events.push({ t: 'beep', n: Math.ceil(R.count) });
    if (R.count <= 0) { R.state = 'race'; R.raceStart = R.t; R.events.push({ t: 'go' }); for (const c of R.cars) c.lapStart = R.t; }
  }
  const racing = R.state === 'race' || R.state === 'post';
  for (const c of R.cars) carStep(R, c, dt, racing);
  collideCars(R);
  // pickups
  for (const p of R.pickups) {
    if (!p.alive) continue;
    for (const c of R.cars) {
      if (Math.hypot(c.x - p.x, c.z - p.z) < 0.85) {
        p.alive = false;
        if (p.type === 'cash') { c.cash += 1; R.events.push({ t: 'coin', car: c, x: p.x, z: p.z }); }
        else { c.nitro = Math.min(c.nitro + 1, 9); R.events.push({ t: 'nitroPick', car: c, x: p.x, z: p.z }); }
        R.respawn = R.respawn || [];
        R.respawn.push({ type: p.type, at: R.t + 3 + Math.random() * 3 });
        break;
      }
    }
  }
  if (R.respawn) {
    R.respawn = R.respawn.filter(r => { if (R.t >= r.at) { spawnPickup(R, r.type); return false; } return true; });
    R.pickups = R.pickups.filter(p => p.alive);
  }
  // ranking
  const order = R.cars.slice().sort((a, b) => {
    if (a.finished && b.finished) return a.finishT - b.finishT;
    if (a.finished) return -1; if (b.finished) return 1;
    return (b.laps * T.N + b.idx) - (a.laps * T.N + a.idx);
  });
  order.forEach((c, n) => { c.place = n + 1; });
  // race end
  const pl = R.cars[0];
  if (R.state === 'race' && pl.finished) { R.state = 'post'; R.endT = R.t + 2.2; }
  const aiDone = R.cars.length > 1 && R.cars.slice(1).every(c => c.finished);
  if (aiDone && R.lastAiFinishT < 0) R.lastAiFinishT = R.t;
  if (R.state === 'race' && R.lastAiFinishT > 0 && R.t - R.lastAiFinishT > 25) { R.state = 'post'; R.endT = R.t + 0.5; }
  if (R.state === 'post' && R.t >= R.endT && !R.done) {
    R.done = true;
    R.result = order.map(c => ({ k: c.k, place: c.place, finished: c.finished, time: c.finished ? c.finishT - R.raceStart : 0 }));
    R.events.push({ t: 'end' });
  }
}

function carStep(R, c, dt, racing) {
  const T = R.T, inp = c.input, st = c.stats;
  const ca = Math.cos(c.a), sa = Math.sin(c.a);
  let vF = c.vx * ca + c.vz * sa, vL = -c.vx * sa + c.vz * ca;
  const canDrive = racing && !c.finished;
  const brake = canDrive ? inp.brake : 0;
  // auto-gas (player only): always driving forward unless braking
  const gas = canDrive ? ((c.isPlayer && R.autoGas && !brake) ? 1 : inp.gas) : 0;
  if (c.finished) { /* coast gently to a stop */ }
  if (canDrive && inp.nitro && c.nitro > 0 && c.boostT <= 0) {
    c.nitro--; c.boostT = st.boostT || 1.25; R.events.push({ t: 'puff', car: c });
  }
  if (c.boostT > 0) c.boostT -= dt;
  const boost = c.boostT > 0;
  c.mud = !c.air && T.mudAt(c.x, c.z);
  if (!c.air) {
    const steerAmt = (canDrive ? inp.steer : 0);
    // keep some steering even when nearly stopped, so you can always turn away from a wall
    const turn = 3.3 * (0.45 + 0.55 * Math.min(1, Math.abs(vF) / 3.5)) * (vF < -0.2 ? -1 : 1) * (c.mud ? 0.85 : 1);
    c.a += steerAmt * turn * dt;
    // easy-steer assist (player): the truck gently follows the road, which damps late / over-steering
    if (c.isPlayer && R.assist && canDrive && vF > 1) {
      const j = (c.idx + 6 + Math.floor(vF * 0.5)) % T.N;
      let dA = Math.atan2(T.zs[j] - c.z, T.xs[j] - c.x) - c.a;
      while (dA > Math.PI) dA -= 2 * Math.PI; while (dA < -Math.PI) dA += 2 * Math.PI;
      c.a += Math.max(-1.8, Math.min(1.8, dA * 2.2)) * dt;
    }
    let rb = 1;
    if (!c.isPlayer && R.rubber && R.state === 'race') {
      const pl = R.cars[0], T2 = R.T;
      const gap = ((c.laps * T2.N + c.idx) - (pl.laps * T2.N + pl.idx)) * 0.5; // world units ahead (+) / behind (-)
      const lead = R.rubber >= 1 ? 4 : 2; // first races: rivals try to stay a few car lengths behind you
      if (!pl.finished) rb = gap > -lead ? 1 - Math.min(R.rubber >= 1 ? 0.85 : 0.6, R.rubber * (gap + lead) / 10) : 1 + (R.rubber >= 1 ? 0 : R.rubber * 0.2 * Math.min(1, (-gap - lead) / 25));
    }
    const top = st.top * rb * (boost ? 1.55 : 1) * (c.mud ? 0.8 : 1);
    const acc = st.accel * (boost ? 2.4 : 1);
    if (gas) vF += acc * dt * Math.max(0, 1 - vF / top) * 2.3 + (vF < 0 ? 18 * dt : 0);
    if (boost && !gas) vF += acc * 0.6 * dt;
    if (brake) { if (vF > 0.3) vF -= 22 * dt; else vF = Math.max(vF - 9 * dt, -4); }
    if (!gas && !brake) vF -= vF * 0.9 * dt;
    if (vF > top) vF -= (vF - top) * 3 * dt;
    // slope: going uphill slows, downhill speeds up
    const h0 = T.height(c.x - ca * 0.4, c.z - sa * 0.4), h1 = T.height(c.x + ca * 0.4, c.z + sa * 0.4);
    vF -= 14 * ((h1 - h0) / 0.8) * dt;
    if (c.mud) vF -= vF * 0.5 * dt;
    // lateral grip -> drift
    const grip = st.grip * (boost ? 0.7 : 1) * (c.mud ? 0.6 : 1) * (steerAmt && Math.abs(vF) > 7 ? 0.8 : 1);
    vL *= Math.exp(-grip * dt);
  }
  c.drift = Math.abs(vL);
  if (c.air) { /* keep momentum */ }
  c.vx = vF * ca - vL * sa; c.vz = vF * sa + vL * ca;
  c.speed = Math.hypot(c.vx, c.vz);
  c.x += c.vx * dt; c.z += c.vz * dt;
  // vertical
  const h = T.height(c.x, c.z);
  if (c.air) {
    c.vy -= AIR_GRAV * dt; c.y += c.vy * dt;
    if (c.y <= h) { c.y = h; c.air = false; if (c.vy < -3) R.events.push({ t: 'land', car: c, v: -c.vy }); c.vy = 0; }
  } else {
    const gv = (h - c.y) / dt;
    const ny = c.y + c.vy * dt - 0.5 * GRAV * dt * dt;
    if (ny > h + 0.02 && c.vy > 2.5) { c.air = true; c.y = ny; c.vy = Math.min(c.vy * 1.15, 9) - AIR_GRAV * dt; if (c.vy > 3.5) R.events.push({ t: 'jump', car: c }); }
    else { c.y = h; c.vy = Math.min(gv, 9); }
  }
  // walls (hay bale berms)
  const prev = c.idx;
  c.idx = nearestLocal(T, c.x, c.z, c.idx);
  const lat = lateral(T, c.idx, c.x, c.z), lim = T.halfW - 0.42;
  if (Math.abs(lat) > lim) {
    const nx = -T.tz[c.idx], nz = T.tx[c.idx], s = Math.sign(lat);
    const ex = lat - s * lim;
    c.x -= nx * ex; c.z -= nz * ex;
    const vn = c.vx * nx + c.vz * nz;
    if (vn * s > 0) {
      // slide along the berm instead of bouncing off it: kill the into-wall speed (tiny rebound),
      // keep most of the speed along the track
      c.vx -= nx * vn * 1.15; c.vz -= nz * vn * 1.15;
      c.vx *= 0.985; c.vz *= 0.985;
      if (Math.abs(vn) > 3) R.events.push({ t: 'bonk', car: c, v: Math.abs(vn), x: c.x + nx * s * 0.5, z: c.z + nz * s * 0.5 });
    }
    // nudge the nose back toward the racing direction so you don't stay pinned
    if (!c.finished) {
      const fwd = (c.vx * T.tx[c.idx] + c.vz * T.tz[c.idx]) >= -0.5 ? 1 : -1;
      let want = Math.atan2(T.tz[c.idx] * fwd, T.tx[c.idx] * fwd);
      let dA = want - c.a; while (dA > Math.PI) dA -= 2 * Math.PI; while (dA < -Math.PI) dA += 2 * Math.PI;
      const k = Math.min(1, (c.isPlayer ? 5 : 3) * dt);
      c.a += dA * k;
      // and swing the velocity with it
      const sp = Math.hypot(c.vx, c.vz), va = Math.atan2(c.vz, c.vx);
      let dV = want - va; while (dV > Math.PI) dV -= 2 * Math.PI; while (dV < -Math.PI) dV += 2 * Math.PI;
      if (Math.abs(dV) < 1.6) { const na = va + dV * k; c.vx = Math.cos(na) * sp; c.vz = Math.sin(na) * sp; }
    }
  }
  // laps
  const d = c.idx - prev;
  if (d < -T.N / 2) {
    c.laps++;
    if (racing && c.laps >= 1) {
      const lt = R.t - c.lapStart; c.lastLap = lt; (c.lapTimes || (c.lapTimes = [])).push(lt); if (!c.bestLap || lt < c.bestLap) c.bestLap = lt;
    }
    c.lapStart = R.t;
    if (racing && c.laps >= 1) R.events.push({ t: 'lapTime', car: c, v: c.lastLap, best: c.bestLap === c.lastLap });
    if (c.laps >= R.laps && !c.finished) { c.finished = true; c.finishT = R.t; R.events.push({ t: 'finish', car: c }); if (c.k > 0 && R.lastAiFinishT < 0 && R.cars.length > 1 && R.cars.slice(1).every(o => o.finished)) R.lastAiFinishT = R.t; }
    else if (c.laps >= 1) R.events.push({ t: 'lap', car: c });
  } else if (d > T.N / 2) c.laps--;
}

function collideCars(R) {
  const cs = R.cars;
  for (let i = 0; i < cs.length; i++) for (let j = i + 1; j < cs.length; j++) {
    const a = cs[i], b = cs[j];
    if (Math.abs(a.y - b.y) > 0.6) continue;
    const dx = b.x - a.x, dz = b.z - a.z, d = Math.hypot(dx, dz);
    if (d > 0 && d < CAR_R * 2) {
      const nx = dx / d, nz = dz / d, pen = (CAR_R * 2 - d) / 2;
      // first races: the player is "heavy" - rivals get shoved aside instead of blocking a new driver
      const wa = (R.rubber >= 1 && a.isPlayer) ? 0 : 1, wb = 2 - wa;
      a.x -= nx * pen * wa; a.z -= nz * pen * wa; b.x += nx * pen * wb; b.z += nz * pen * wb;
      const rv = (b.vx - a.vx) * nx + (b.vz - a.vz) * nz;
      if (rv < 0) {
        const imp = -rv * 0.8;
        a.vx -= nx * imp * 0.5 * wa; a.vz -= nz * imp * 0.5 * wa; b.vx += nx * imp * 0.5 * wb; b.vz += nz * imp * 0.5 * wb;
        if (imp > 2.5) R.events.push({ t: 'bump', car: a.isPlayer || b.isPlayer ? cs[0] : a, v: imp, x: (a.x + b.x) / 2, z: (a.z + b.z) / 2 });
      }
    }
  }
}
