// 작은 XPBD 구조 해석기: 절점(질점) + 축부재(거리 구속) + 접합부 휨(각도 구속) + 기초 앵커.
// 구속력이 내력을 넘으면 끊어진다. 브라우저와 node 양쪽에서 돈다.
(function () {
  const QR = (globalThis.QR = globalThis.QR || {});
  const G = 9.81;
  const wrap = (a) => { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; };

  // ---------- 단계 + 설계 → 절점/부재 목록 ----------
  function nodePos(level, name) {
    if (level.extra && level.extra[name]) return level.extra[name];
    const [i, j] = name.split(',').map(Number);
    return [level.xs[i], level.ys[j]];
  }
  // 기초(땅에 박힌) 절점: level.base 가 있으면 그것, 없으면 맨 아래 줄 격자점
  const baseList = (level) => level.base || level.xs.map((_, i) => `${i},0`);
  const isGround = (name, level) => (level && level.base ? level.base.includes(name) : /^\d+,0$/.test(name));
  const cellCorners = (i, j) => [`${i},${j}`, `${i + 1},${j}`, `${i},${j + 1}`, `${i + 1},${j + 1}`];
  const key2 = (a, b) => (a < b ? a + '|' + b : b + '|' + a);

  // 지금 구조에 있는 모든 부재 (고정 + 플레이어)
  const toolDef = (id) => QR.TOOLS.find((t) => t.id === id);
  function allMembers(level, design) {
    const out = [];
    const wallElem = (QR.MATERIALS[level.material] || {}).wallElem || 'ply';
    level.members.forEach(([t, a, b]) => out.push({ type: t, a, b, fixed: true }));
    (level.braces || []).forEach(([a, b]) => out.push({ type: level.braceType || 'brace', a, b, fixed: true }));
    const slits = new Set(design.filter((d) => d.tool === 'slit').map((d) => `${d.i},${d.j}`));
    (level.walls || []).forEach(([i, j]) => {
      if (slits.has(`${i},${j}`)) return; // 내진 슬릿: 벽돌을 골조에서 떼어 냄 → 구조로는 없는 셈
      const [bl, br, tl, tr] = cellCorners(i, j);
      const g = `w${i},${j}`;
      out.push({ type: wallElem, a: bl, b: tr, fixed: true, group: g }, { type: wallElem, a: br, b: tl, fixed: true, group: g });
    });
    design.forEach((d, idx) => {
      const T = toolDef(d.tool); if (!T) return;
      if (d.tool === 'slit') return;
      if (T.kind === 'link') out.push({ type: T.elem, a: d.a, b: d.b, item: idx });
      else if (T.kind === 'bay') {
        const [bl, br, tl, tr] = cellCorners(d.i, d.j);
        const g = `${T.panel ? 'w' : 'x'}${d.i},${d.j}`;
        out.push({ type: T.elem, a: bl, b: tr, item: idx, group: g }, { type: T.elem, a: br, b: tl, item: idx, group: g });
      }
    });
    return out;
  }
  // 기둥(세로 골조 부재) 목록 — 기둥 보강 도구가 붙는 자리
  function columnsOf(level) {
    return level.members.filter(([t, a, b]) => { const e = QR.MATERIALS[level.material].elements[t]; const [p, q] = [nodePos(level, a), nodePos(level, b)]; return e.role === 'frame' && Math.abs(p[0] - q[0]) < 1e-6 && t !== 'stud'; }).map(([t, a, b]) => ({ a, b }));
  }

  function activeNodes(level, design) {
    const s = new Set();
    allMembers(level, design).forEach((m) => { s.add(m.a); s.add(m.b); });
    return s;
  }

  // 자유 배치: 이을 수 있는 절점(이미 있는 절점 + 기초 위 격자점)과 막힌 칸들
  function computeSlots(level, design) {
    const mem = allMembers(level, design);
    const act = activeNodes(level, design);
    const joints = [...act];
    baseList(level).forEach((n) => { if (!act.has(n)) joints.push(n); });
    const on = (n) => act.has(n) || isGround(n, level);
    const wallCells = new Set();
    mem.forEach((m) => { if (m.group) wallCells.add(m.group.slice(1)); }); // 벽·철골가새가 이미 있는 칸
    const slitDone = design.filter((d) => d.tool === 'slit').map((d) => `${d.i},${d.j}`);
    slitDone.forEach((c) => wallCells.add(c));
    // 내진 슬릿을 넣을 수 있는 칸 = 처음부터 있던 벽돌(조적) 칸
    const wElem = (QR.MATERIALS[level.material] || {}).wallElem;
    // (허리벽·창 위 벽처럼 기둥을 짧게 만드는 벽만 — level.sills)
    const slit = wElem === 'brk' ? (level.sills || []).filter(([i, j]) => !slitDone.includes(`${i},${j}`)).map(([i, j]) => ({ i, j })) : [];
    const openings = new Set((level.openings || []).map(([i, j]) => `${i},${j}`));
    const bay = [];
    for (let i = 0; i < level.xs.length - 1; i++) for (let j = 0; j < level.ys.length - 1; j++) {
      const c = cellCorners(i, j);
      if (!c.every(on) || wallCells.has(`${i},${j}`)) continue;
      if (!covered(level, mem, c[2], c[3], ['beam', 'rbeam'])) continue; // 위가 보로 닫힌 칸만
      bay.push({ i, j, door: openings.has(`${i},${j}`) });
    }
    return { joints, bay, slit, node: [...act].map((n) => ({ n })), cols: columnsOf(level) };
  }
  function covered(level, mem, a, b, kinds) {
    const [ax, ay] = nodePos(level, a), [bx, by] = nodePos(level, b);
    const e = 1e-6;
    return mem.some((m) => {
      if (!kinds.includes(m.type)) return false;
      const [px, py] = nodePos(level, m.a), [qx, qy] = nodePos(level, m.b);
      if (Math.abs(ay - by) < e) return Math.abs(py - ay) < e && Math.abs(qy - ay) < e && Math.min(px, qx) < Math.max(ax, bx) - e && Math.max(px, qx) > Math.min(ax, bx) + e;
      if (Math.abs(ax - bx) < e) return Math.abs(px - ax) < e && Math.abs(qx - ax) < e && Math.min(py, qy) < Math.max(ay, by) - e && Math.max(py, qy) > Math.min(ay, by) + e;
      return key2(m.a, m.b) === key2(a, b);
    });
  }
  // 두 절점을 잇는 부재를 놓을 수 있나? 안 되면 이유 코드
  function checkLink(level, design, tool, a, b) {
    if (a === b) return 'same';
    const [ax, ay] = nodePos(level, a), [bx, by] = nodePos(level, b);
    if (tool === 'post' && Math.abs(ax - bx) > 1e-6) return 'vertical';
    if (tool === 'beam' && Math.abs(ay - by) > 1e-6) return 'horizontal';
    if (tool === 'beam' && isGround(a, level) && isGround(b, level)) return 'ground';
    const mem = allMembers(level, design);
    const kinds = tool === 'brace' ? ['brace'] : [tool];
    if (covered(level, mem, a, b, kinds) || mem.some((m) => key2(m.a, m.b) === key2(a, b) && m.type !== 'ply')) return 'dup';
    // 부재를 뚫고 지나갈 수 없음 (가새끼리 X자로 엇갈리는 건 괜찮음). 마디를 그냥 지나가도 안 됨.
    const P0 = [ax, ay], P1 = [bx, by];
    const cr = (o, p, q) => (p[0] - o[0]) * (q[1] - o[1]) - (p[1] - o[1]) * (q[0] - o[0]);
    const e = 1e-6;
    for (const m of mem) {
      if (m.type === 'brace') continue;
      if (m.a === a || m.a === b || m.b === a || m.b === b) continue;
      const Q0 = nodePos(level, m.a), Q1 = nodePos(level, m.b);
      const d1 = cr(P0, P1, Q0), d2 = cr(P0, P1, Q1), d3 = cr(Q0, Q1, P0), d4 = cr(Q0, Q1, P1);
      if (((d1 > e && d2 < -e) || (d1 < -e && d2 > e)) && ((d3 > e && d4 < -e) || (d3 < -e && d4 > e))) return m.type === 'ply' ? 'crossWall' : 'cross';
    }
    const nodes = new Set(); mem.forEach((m) => { nodes.add(m.a); nodes.add(m.b); });
    for (const n of nodes) {
      if (n === a || n === b) continue;
      const q = nodePos(level, n);
      if (Math.abs(cr(P0, P1, q)) < 1e-6 && (q[0] - ax) * (q[0] - bx) + (q[1] - ay) * (q[1] - by) < -1e-6) return 'throughNode';
    }
    return null;
  }
  // 부재가 문(개구부) 칸 안을 가로지르나
  function blocksDoor(level, a, b) {
    const [ax, ay] = nodePos(level, a), [bx, by] = nodePos(level, b);
    return (level.openings || []).some(([i, j]) => {
      const dr = level.doorRects && level.doorRects[`${i},${j}`]; // 문틀이 있으면 문 자리만
      const x0 = (dr ? dr.x0 : level.xs[i]) + 0.05, x1 = (dr ? dr.x1 : level.xs[i + 1]) - 0.05, y0 = (dr ? dr.y0 : level.ys[j]) + 0.05, y1 = (dr ? dr.y1 : level.ys[j + 1]) - 0.05;
      for (let u = 0.02; u < 1; u += 0.02) { const x = ax + (bx - ax) * u, y = ay + (by - ay) * u; if (x > x0 && x < x1 && y > y0 && y < y1) return true; }
      return false;
    });
  }

  // ---------- 세계 ----------
  class World {
    constructor(level, design) {
      const mat = QR.MATERIALS[level.material];
      this.level = level; this.mat = mat;
      const mem = allMembers(level, design);
      const conns = new Set(design.filter((d) => d.tool === 'conn').map((d) => d.n));
      this.conns = conns;
      const names = [...activeNodes(level, design)];
      this.names = names;
      const idx = {}; names.forEach((n, k) => (idx[n] = k));
      this.idx = idx;
      const N = names.length;
      this.N = N;
      this.x = new Float64Array(N); this.y = new Float64Array(N);
      this.vx = new Float64Array(N); this.vy = new Float64Array(N);
      this.px = new Float64Array(N); this.py = new Float64Array(N);
      this.x0 = new Float64Array(N); this.y0 = new Float64Array(N);
      this.m = new Float64Array(N); this.w = new Float64Array(N);
      names.forEach((n, k) => { const [x, y] = nodePos(level, n); this.x[k] = this.x0[k] = x; this.y[k] = this.y0[k] = y; });
      // 부재
      this.members = mem.map((m) => {
        const e = mat.elements[m.type];
        const a = idx[m.a], b = idx[m.b];
        const L = Math.hypot(this.x[b] - this.x[a], this.y[b] - this.y[a]);
        const endCap = (n) => e.tEnd * (conns.has(n) ? e.connF || mat.connEndFactor : 1);
        const mass = e.kgm * L;
        this.m[a] += mass / 2; this.m[b] += mass / 2;
        return { ...m, ia: a, ib: b, L0: L, alpha: L / e.EA, tcap: Math.min(e.tcap, endCap(m.a), endCap(m.b)), endGov: Math.min(endCap(m.a), endCap(m.b)) < e.tcap,
          ccap: e.Lref ? e.ccap * Math.min(1.3, Math.pow(e.Lref / L, 2)) : e.ccap, role: e.role, broken: false, f: 0, util: 0 };
      });
      this.members.forEach((m) => { if (mat.elements[m.type].buckle) m.buckle = true; });
      // 판마다 부재 보정: 긴 건물은 바닥판이 휘어(면내 유연) 먼 끝이 따로 놂 → 보(바닥 띠)의 축강성·이음을 낮춤
      Object.entries(level.memberMods || {}).forEach(([type, mo]) => this.members.forEach((m) => { if (m.type !== type || m.item !== undefined) return; if (mo.EA) m.alpha /= mo.EA; if (mo.tcap) m.tcap *= mo.tcap; }));
      // 기둥 보강(재킷·FRP·날개벽): 그 기둥의 전단·접합·축강성을 키움
      this.members.forEach((m) => { m.mod = { vcap: 1, jk: 1, jcap: mat.elements[m.type].jcap || 1, EA: 1 }; });
      design.forEach((d) => {
        const T = toolDef(d.tool); if (!T || T.kind !== 'column' || !mat.mods) return;
        const mo = mat.mods[d.tool];
        const m = this.members.find((q) => q.fixed && key2(q.a, q.b) === key2(d.a, d.b)); if (!m) return;
        m.mod.vcap *= mo.vcap; m.mod.jk *= mo.jk; m.mod.jcap *= mo.jcap; m.mod.EA *= mo.EA; m.alpha /= mo.EA;
        const add = mo.kgm * m.L0; this.m[m.ia] += add / 2; this.m[m.ib] += add / 2;
        (m.mods = m.mods || []).push(d.tool);
      });
      // 가새는 반복해서 크게 흔들리면 못이 헐거워져 약해진다(합판벽은 안 그럼)
      this.members.forEach((m) => { const e = mat.elements[m.type]; if (e.degrade) Object.assign(m, { degrade: e.degrade, deg: 1, alpha0: m.alpha, tcap0: m.tcap, ccap0: m.ccap, lastSign: 0, cycles: 0 }); });
      Object.entries(level.loads || {}).forEach(([n, kg]) => { if (idx[n] !== undefined) this.m[idx[n]] += kg; });
      // 슬릿으로 뗀 벽돌도 무게는 그대로 (구조로만 빠짐)
      design.forEach((d) => { if (d.tool !== 'slit' || !mat.wallElem) return; const e = mat.elements[mat.wallElem];
        cellCorners(d.i, d.j).forEach((n, k, c) => { if (idx[n] === undefined) return; const [x0, y0] = nodePos(level, c[0]), [x1, y1] = nodePos(level, c[3]); this.m[idx[n]] += (e.kgm * 2 * Math.hypot(x1 - x0, y1 - y0)) / 4; }); });
      for (let k = 0; k < N; k++) { if (this.m[k] < 5) this.m[k] = 5; this.w[k] = 1 / this.m[k]; }
      // 접합부 휨 (frame 부재끼리, 그리고 밑동은 땅 기준)
      this.joints = [];
      const frameAt = names.map(() => []);
      this.members.forEach((m, mi) => { if (m.role === 'frame') { frameAt[m.ia].push(mi); frameAt[m.ib].push(mi); } });
      frameAt.forEach((list, n) => {
        const jt0 = mat.joints[conns.has(names[n]) ? 'plate' : 'nailed'];
        const other = (mi) => (this.members[mi].ia === n ? this.members[mi].ib : this.members[mi].ia);
        const ang = (mi) => { const o = other(mi); return Math.atan2(this.y[o] - this.y[n], this.x[o] - this.x[n]); };
        const sorted = list.slice().sort((p, q) => ang(p) - ang(q));
        // 접합 강성·내력은 기둥(세로 부재) 쪽이 정함: 약한 기둥이면 약하고, 기둥을 보강하면 세짐
        const vert = (mi) => { const m = this.members[mi]; return Math.abs(this.x[m.ia] - this.x[m.ib]) < 1e-6; };
        const colMod = (p, q, key) => { const c = [p, q].filter((mi) => mi >= 0 && vert(mi)); return c.length ? Math.min(...c.map((mi) => this.members[mi].mod[key])) : 1; };
        const mk = (p, q, jt) => this.joints.push({ n, a: other(p), b: other(q), mA: p, mB: q, th0: wrap(ang(p) - ang(q)),
          alpha: 1 / (jt.k * colMod(p, q, 'jk')), cap: jt.cap * colMod(p, q, 'jcap') * (jt === mat.joints.continuous && vert(p) ? 0.4 : 1), broken: false, f: 0, util: 0, cont: jt === mat.joints.continuous,
          kind: jt === mat.joints.continuous ? 'cont' : jt === mat.joints.plate ? 'plate' : 'nailed' });
        for (let s = 0; s + 1 < sorted.length; s++) mk(sorted[s], sorted[s + 1], jt0);
        // 이어진 보(절점을 지나가는 한 부재)만 휨이 이어짐. 기둥은 층마다 핀 — 통재기둥도 고정단 아님
        for (let p = 0; p < list.length; p++) for (let q = p + 1; q < list.length; q++) {
          const MA = this.members[list[p]], MB = this.members[list[q]];
          if (MA.type !== MB.type || !(MA.type === 'beam' || MA.type === 'stud' || MA.type === 'rbeam' || MA.type === 'col' || MA.type === 'colS') || MA.item !== undefined || MB.item !== undefined) continue;
          if (Math.abs(Math.abs(wrap(ang(list[p]) - ang(list[q]))) - Math.PI) < 0.05) mk(list[p], list[q], mat.joints.continuous);
        }
        // 기둥 밑동은 핀(토대 위에 얹힘) — 철물(홀다운)이 있을 때만 약간의 회전저항
        // 나무: 기둥 밑동은 언제나 핀(홀다운은 들림만 막음). RC: 기초가 회전을 조금만 잡음(고정단 아님)
        if (isGround(names[n], level) && mat.footing) sorted.forEach((mi) => {
          this.joints.push({ n, a: other(mi), b: -1, mA: mi, mB: -1, th0: ang(mi), alpha: 1 / (mat.footing.k * this.members[mi].mod.jk), cap: mat.footing.cap * this.members[mi].mod.jcap, broken: false, f: 0, util: 0, kind: 'footing' });
        });
      });
      // 기둥 전단(짧은 기둥 효과): 양 끝 접합부 휨모멘트 합 / 길이
      this.members.forEach((m, mi) => { const e = mat.elements[m.type]; if (e.vcap) { m.vcap = e.vcap * m.mod.vcap; m.jl = this.joints.filter((j) => j.mA === mi || j.mB === mi); if (e.dcap) m.dcap = e.dcap * Math.sqrt(m.mod.vcap); } });
      // RC 이력(균열 → 항복 → 강도 저하): 접합부는 갑자기 깨지지 않고, 휘면서 금이 가고 소성회전이 쌓이면 약해진다
      this.hyst = mat.hyst || null;
      if (this.hyst) {
        this.joints.forEach((j) => Object.assign(j, { thp: 0, dmg: 0, str: 1, ms: 0, cracked: false, yielded: false }));
        this.members.forEach((m, mi) => {
          m.endM = 0; m.crk = 0; m.vr = 0;
          if (m.vcap) m.jlEnds = m.jl.map((j) => ({ j, s: j.mA === mi ? 1 : -1 }));
          if (mat.elements[m.type].infill) Object.assign(m, { infill: true, deg: 1, alpha0: m.alpha, tcap0: m.tcap, ccap0: m.ccap, lastSign: 0, cracked: false });
        });
      }
      // 앵커
      this.anchors = [];
      names.forEach((n, k) => {
        if (!isGround(n, level)) return;
        const an = mat.anchors[conns.has(n) ? 'plate' : 'nailed'];
        // 나무 합판벽 끝 기둥: 합판이 벽을 통째로 단단하게 묶어서 벽 전체가 한 판처럼 넘어지려 함 → 끝 기둥 밑을 세게 뽑아 올림.
        // 홀다운이 없으면 토대에 박은 못만으로는 거의 못 잡음 (양 끝 모두 홀다운이 필요)
        const plyEnd = !conns.has(n) && mat.anchors.plyEnd && mem.some((m) => m.type === mat.wallElem && (m.a === n || m.b === n) && mat.elements[m.type].role === 'panel');
        this.anchors.push({ n: k, uplift: plyEnd ? mat.anchors.plyEnd.uplift : an.uplift, shear: an.shear, broken: false, fy: 0, fx: 0, plyEnd });
      });
      // 땅 높이(비탈이면 기초 절점들을 잇는 꺾은선)
      this.gprof = baseList(level).map((n) => nodePos(level, n)).sort((p, q) => p[0] - q[0]);
      this.anchored = new Uint8Array(N);
      this.anchors.forEach((a) => (this.anchored[a.n] = 1));
      // 측정용: 지붕 처마 높이의 절점들
      const topY = Math.max(...level.ys);
      this.top = []; for (let k = 0; k < N; k++) if (this.y0[k] >= topY - 1e-6) this.top.push(k);
      this.H = topY;
      this.events = [];
      this.t = 0; this.gx = 0; this.gvx = 0;
      this.breaking = true;
      this.damping = 0.6;
      this.totalWeight = this.members.length + this.joints.length * 0.5 + this.anchors.length * 0.5;
    }

    groundAt(x) {
      const g = this.gprof; if (x <= g[0][0]) return g[0][1];
      for (let i = 1; i < g.length; i++) if (x <= g[i][0]) { const u = (x - g[i - 1][0]) / (g[i][0] - g[i - 1][0]); return g[i - 1][1] + (g[i][1] - g[i - 1][1]) * u; }
      return g[g.length - 1][1];
    }

    breakMember(mi, why) {
      const m = this.members[mi]; if (m.broken) return; m.broken = true;
      this.joints.forEach((j) => { if (!j.broken && (j.mA === mi || j.mB === mi)) j.broken = true; });
      this.events.push({ type: 'member', mi, why, x: (this.x[m.ia] + this.x[m.ib]) / 2, y: (this.y[m.ia] + this.y[m.ib]) / 2 });
    }

    // 채움벽 한 칸이 통째로 빠짐 (두 대각선 다)
    dropInfill(mi) {
      const m = this.members[mi];
      const grp = m.group ? this.members.map((q, k) => k).filter((k) => this.members[k].group === m.group) : [mi];
      const live = grp.filter((k) => !this.members[k].broken);
      if (!live.length) return;
      live.forEach((k) => { this.members[k].broken = true; });
      const q = this.members[mi];
      this.events.push({ type: 'infillOut', mi, group: m.group, x: (this.x[q.ia] + this.x[q.ib]) / 2, y: (this.y[q.ia] + this.y[q.ib]) / 2 });
    }

    step(h, gx, gvx) {
      const { x, y, vx, vy, px, py, w, N } = this;
      const h2 = h * h;
      const damp = Math.max(0, 1 - this.damping * h);
      for (let k = 0; k < N; k++) {
        vy[k] -= G * h; vx[k] *= damp; vy[k] *= damp;
        px[k] = x[k]; py[k] = y[k];
        x[k] += vx[k] * h; y[k] += vy[k] * h;
      }
      // 앵커 (땅과 함께 움직임)
      for (const an of this.anchors) {
        if (an.broken) continue;
        const k = an.n;
        const cx = x[k] - (this.x0[k] + gx), cy = y[k] - this.y0[k];
        const a = 1e-9 / h2;
        const dlx = -cx / (w[k] + a), dly = -cy / (w[k] + a);
        x[k] += w[k] * dlx; y[k] += w[k] * dly;
        const fy = -dly / h2, fx = dlx / h2; // fy>0: 구조가 위로 뽑음
        an.fy += (fy - an.fy) * 0.15; an.fx += (fx - an.fx) * 0.15;
        if (this.breaking && (an.fy > an.uplift || Math.abs(an.fx) > an.shear)) {
          an.broken = true; this.anchored[k] = 0;
          this.events.push({ type: 'anchor', x: x[k], y: y[k], why: an.fy > an.uplift ? 'uplift' : 'shear', plyEnd: !!an.plyEnd });
        }
      }
      // 축부재
      const ms = this.members;
      for (let mi = 0; mi < ms.length; mi++) {
        const m = ms[mi]; if (m.broken) continue;
        const a = m.ia, b = m.ib;
        let dx = x[b] - x[a], dy = y[b] - y[a];
        const L = Math.hypot(dx, dy) || 1e-9; dx /= L; dy /= L;
        const C = L - m.L0;
        const at = m.alpha / h2;
        let dl = -C / (w[a] + w[b] + at);
        // 가는 가새는 눌리면 휘어(좌굴) 더는 못 밀어냄 — 부러지진 않고, 당기는 힘으로는 다시 일함
        if (m.buckle && dl > m.ccap * h2) { dl = m.ccap * h2; if (this.breaking && !m.buckled) { m.buckled = true; this.events.push({ type: 'buckle', mi, x: (x[a] + x[b]) / 2, y: (y[a] + y[b]) / 2 }); } }
        x[a] -= w[a] * dl * dx; y[a] -= w[a] * dl * dy;
        x[b] += w[b] * dl * dx; y[b] += w[b] * dl * dy;
        const T = -dl / h2; // +인장 / -압축
        m.f += (T - m.f) * 0.15;
        m.util = m.f > 0 ? m.f / m.tcap : -m.f / m.ccap;
        if (m.degrade && m.util > 0.35) {
          const sg = m.f > 0 ? 1 : -1;
          if (sg !== m.lastSign) {
            m.lastSign = sg; m.cycles++;
            m.deg = Math.max(0.45, m.deg * (1 - m.degrade));
            m.alpha = m.alpha0 / m.deg; m.tcap = m.tcap0 * m.deg; m.ccap = m.ccap0 * m.deg;
          }
        }
        if (m.infill && this.breaking) { // 벽돌 채움벽: 금(강성↓) → 흔들릴 때마다 부스러짐 → 빠져 떨어짐
          const H_ = this.hyst;
          if (!m.cracked && m.util > H_.infCrack) { m.cracked = true; m.alpha = m.alpha0 * H_.infSoft; this.events.push({ type: 'infillCrack', mi, x: (x[a] + x[b]) / 2, y: (y[a] + y[b]) / 2 }); }
          if (m.cracked && m.util > 0.3) {
            const sg = m.f > 0 ? 1 : -1;
            if (sg !== m.lastSign) { m.lastSign = sg; m.deg *= 1 - H_.infDeg; m.tcap = m.tcap0 * m.deg; m.ccap = m.ccap0 * m.deg; m.alpha = m.alpha0 * H_.infSoft / m.deg;
              this.events.push({ type: 'infillChip', mi, x: (x[a] + x[b]) / 2, y: (y[a] + y[b]) / 2 }); }
          }
          if (m.util > 1 || m.deg < H_.infOut) { this.dropInfill(mi); continue; }
        }
        // 당겨서 터질 때: 끝(못·철물)이 먼저면 'pullout'(접합이 뽑힘), 부재 자체면 'tension'(RC 보의 겹침이음 풀림 등)
        if (this.breaking && m.util > (m.buckle && m.f < 0 ? 1e9 : 1)) this.breakMember(mi, m.f > 0 ? (m.endGov ? 'pullout' : 'tension') : 'compression');
      }
      // 접합부 휨
      for (const j of this.joints) {
        if (j.broken) continue;
        const n = j.n, a = j.a, b = j.b;
        const rax = x[a] - x[n], ray = y[a] - y[n];
        const ra2 = rax * rax + ray * ray || 1e-9;
        const gax = -ray / ra2, gay = rax / ra2;
        let phb = 0, gbx = 0, gby = 0;
        if (b >= 0) {
          const rbx = x[b] - x[n], rby = y[b] - y[n];
          const rb2 = rbx * rbx + rby * rby || 1e-9;
          phb = Math.atan2(rby, rbx); gbx = -rby / rb2; gby = rbx / rb2;
        }
        let C = wrap(Math.atan2(ray, rax) - phb - j.th0 - (j.thp || 0));
        const HY = this.hyst;
        if (HY && this.breaking) { // 항복: 모멘트가 My 를 못 넘고 남는 회전은 소성회전으로 쌓임
          const lim = j.cap * j.str * j.alpha;
          if (C > lim || C < -lim) {
            const ex = Math.abs(C) - lim, sg = C > 0 ? 1 : -1;
            j.thp += sg * ex; j.dmg += ex; C = sg * lim;
            if (!j.yielded) { j.yielded = true; this.events.push({ type: 'yield', n, x: x[n], y: y[n] }); }
            j.str = Math.max(HY.residual, 1 - j.dmg / HY.thu);
          }
        }
        const wb = b >= 0 ? w[b] : 0;
        const gnx = -gax + gbx, gny = -gay + gby;
        const den = w[a] * (gax * gax + gay * gay) + wb * (gbx * gbx + gby * gby) + w[n] * (gnx * gnx + gny * gny) + j.alpha / h2;
        const dl = -C / den;
        x[a] += w[a] * dl * gax; y[a] += w[a] * dl * gay;
        if (b >= 0) { x[b] -= wb * dl * gbx; y[b] -= wb * dl * gby; }
        x[n] += w[n] * dl * gnx; y[n] += w[n] * dl * gny;
        const M = Math.abs(dl) / h2;
        j.f += (M - j.f) * 0.15;
        j.util = j.f / j.cap;
        if (HY) {
          j.ms += (dl / h2 - j.ms) * 0.15;
          if (this.breaking && !j.cracked && j.f > HY.crack * j.cap) { j.cracked = true; j.alpha *= HY.crackSoft; this.events.push({ type: 'crack', n, x: x[n], y: y[n] }); }
          if (this.breaking && j.dmg > HY.thBreak) { j.broken = true; this.events.push({ type: 'joint', why: 'hinge', x: x[n], y: y[n] }); }
          continue;
        }
        if (this.breaking && j.util > 1) {
          j.broken = true;
          this.events.push({ type: 'joint', x: x[n], y: y[n] });
        }
      }
      // 기둥 전단
      if (this.breaking && this.hyst) for (let mi = 0; mi < ms.length; mi++) {
        // RC 기둥 전단: V = (위끝 모멘트 + 아래끝 모멘트) / 길이. 휘어 항복한 뒤엔 띠철근이 벌어져 전단 내력이 줄어듦
        const m = ms[mi]; if (!m.vcap || m.broken) continue;
        let M = 0, dm = 0;
        for (const { j, s: sg } of m.jlEnds) if (!j.broken) { M += sg * j.ms; dm = Math.max(dm, j.dmg); }
        const V = Math.abs(M) / m.L0, vc = m.vcap * (1 - this.hyst.vdeg * Math.min(1, dm / this.hyst.thv));
        // 휨-전단: 층간변위가 기둥의 변형 한계(띠철근 성긴 옛 기둥 ≈2~3%)를 넘으면 빗금이 벌어져 전단 파괴
        const dr = Math.abs((x[m.ib] - x[m.ia]) - (this.x0[m.ib] - this.x0[m.ia])) / m.L0;
        // 한 번 크게 휜다고 바로 깨지진 않음: 한계의 60%를 넘는 동안 손상이 쌓이고(Dc≥1), 한계의 1.6배면 그 자리에서 깨짐
        if (m.dcap) { const r = dr / m.dcap; if (r > 0.6) m.dc = (m.dc || 0) + ((r - 0.6) / 0.4) ** 2 * h / this.hyst.tfat; m.vr = Math.max(V / vc, (m.dc || 0), r / 1.6); }
        else m.vr = V / vc;
        if (m.vr > m.crk) {
          const lv0 = m.crk < 0.5 ? 0 : m.crk < 0.8 ? 1 : 2, lv1 = m.vr < 0.5 ? 0 : m.vr < 0.8 ? 1 : 2;
          m.crk = Math.min(1, m.vr);
          if (lv1 > lv0) this.events.push({ type: 'scrack', mi, lvl: lv1, x: (x[m.ia] + x[m.ib]) / 2, y: (y[m.ia] + y[m.ib]) / 2 });
        }
        if (m.vr > 1) this.breakMember(mi, 'shear');
      }
      else if (this.breaking) for (let mi = 0; mi < ms.length; mi++) {
        const m = ms[mi]; if (!m.vcap || m.broken) continue;
        let M = 0; for (const j of m.jl) if (!j.broken) M += j.f;
        if (M / m.L0 > m.vcap) this.breakMember(mi, 'shear');
      }
      // 땅
      for (let k = 0; k < N; k++) {
        const gh = this.groundAt(x[k] - gx);
        if (y[k] < gh) {
          const vin = (y[k] - py[k]) / h;
          y[k] = gh;
          const rel = (x[k] - px[k]) - gvx * h;
          x[k] -= rel * 0.6;
          if (vin < -4 && this.breaking && !this.anchored[k]) {
            // 세게 땅에 부딪힘: 붙은 부재 하나 부러짐
            const hit = ms.findIndex((m) => !m.broken && (m.ia === k || m.ib === k));
            if (hit >= 0) this.breakMember(hit, 'impact');
            this.events.push({ type: 'impact', x: x[k], y: 0, v: -vin });
          }
        }
      }
      for (let k = 0; k < N; k++) { vx[k] = (x[k] - px[k]) / h; vy[k] = (y[k] - py[k]) / h; }
      this.t += h; this.gx = gx; this.gvx = gvx;
    }

    // 중력만 걸고 가만히 자리 잡기 (부서짐 없음)
    settle(sec = 1.5, h = 1 / 1200) {
      this.breaking = false; const d = this.damping; this.damping = 25;
      for (let t = 0; t < sec; t += h) this.step(h, 0, 0);
      this.vx.fill(0); this.vy.fill(0);
      this.members.forEach((m) => (m.f = 0)); this.joints.forEach((j) => { j.f = 0; if (j.ms !== undefined) j.ms = 0; });
      this.anchors.forEach((a) => { a.fy = 0; a.fx = 0; });
      this.damping = d; this.breaking = true; this.t = 0; this.events.length = 0;
    }

    // 상태 측정
    measure() {
      let hs = 0, dr = 0;
      for (const k of this.top) { hs += this.y[k] / this.y0[k]; dr += (this.x[k] - this.x0[k] - this.gx); }
      const n = this.top.length || 1;
      const height = hs / n, drift = Math.abs(dr / n) / this.H;
      let broken = 0;
      this.members.forEach((m) => { if (m.broken) broken += 1; });
      this.joints.forEach((j) => { if (j.broken) broken += 0.5; });
      this.anchors.forEach((a) => { if (a.broken) broken += 0.5; });
      return { height, drift, brokenFrac: broken / this.totalWeight };
    }
  }

  // 지진 지반 변위 x_g(t): 여러 주파수 합 + 점점 커지는 포락선. 최대가속도를 pga(g)로 맞춤.
  function makeQuake(pga, dur = 5, seed = 1) {
    let s = seed * 9301 + 49297;
    const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
    const comps = [[0.7, 1.0], [1.1, 0.45], [1.8, 0.12]].map(([f, a]) => ({ f, a, p: rnd() * 6.28 }));
    const T1 = dur * 0.75, sm = (u) => u * u * (3 - 2 * u); // 매끈한 포락선 (꺾이면 가속도가 튐)
    // 0~T1 점점 세게 → T1~dur 잦아듦 → dur 이후 완전히 멈춤(5초 버티기는 조용한 땅에서)
    const env = (t) => (t <= 0 || t >= dur ? 0 : t < T1 ? sm(t / T1) : sm(1 - (t - T1) / (dur - T1)));
    const raw = (t) => env(t) * comps.reduce((acc, c) => acc + c.a * Math.sin(2 * Math.PI * c.f * t + c.p), 0);
    // 수치미분으로 최대가속도 찾아 크기 맞춤
    let amax = 0; const dt = 0.004;
    for (let t = dt; t < dur; t += dt) amax = Math.max(amax, Math.abs((raw(t + dt) - 2 * raw(t) + raw(t - dt)) / (dt * dt)));
    const A = (pga * G) / amax;
    return {
      dur, x: (t) => A * raw(t), v: (t) => (A * (raw(t + 1e-3) - raw(t - 1e-3))) / 2e-3,
      intensity: (t) => env(t),
    };
  }

  // ---------- 진짜 해석: 2D 선형 강성법 ----------
  // 축부재 = 트러스 막대(EA/L). 접합부는 핀 — 철물(plate)과 이어진 부재(cont)만 회전 스프링.
  // 기초 절점은 핀 지점. 옆 하중 F(기본 3000N)를 무게 비율로 나눠 걸고 변위·부재력을 구한다.
  // 행렬이 특이(메커니즘)한지는 아주 약한 땅 스프링을 넣고 변위가 터무니없이 큰지로 판단.
  function analyze(level, design, F) {
    const w = new World(level, design);
    // 하중: 나무집 3 kN, 철근콘크리트는 무게의 10% (지진 계수 0.1 쯤)
    if (!F) { let M = 0; for (let k = 0; k < w.N; k++) if (!w.anchors.some((an) => an.n === k)) M += w.m[k]; F = w.mat.pinnedJoints ? 3000 : Math.round(0.1 * G * M / 1000) * 1000; }
    const N = w.N, n2 = 2 * N;
    const K = Array.from({ length: n2 }, () => new Float64Array(n2));
    const add = (i, j, v) => { K[i][j] += v; };
    const x = w.x0, y = w.y0;
    w.members.forEach((m) => {
      const a = m.ia, b = m.ib; const dx = x[b] - x[a], dy = y[b] - y[a], L = Math.hypot(dx, dy);
      const c = dx / L, s = dy / L, k = 1 / m.alpha;
      const v = [-c, -s, c, s], d = [2 * a, 2 * a + 1, 2 * b, 2 * b + 1];
      for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) add(d[i], d[j], k * v[i] * v[j]);
    });
    w.joints.forEach((jn) => {
      if (jn.kind === 'nailed' && w.mat.pinnedJoints) return;
      const n = jn.n, a = jn.a, b = jn.b, k = 1 / jn.alpha;
      const rax = x[a] - x[n], ray = y[a] - y[n], ra2 = rax * rax + ray * ray;
      const g = new Map(); const put = (i, vx, vy) => { const o = g.get(i) || [0, 0]; g.set(i, [o[0] + vx, o[1] + vy]); };
      const gax = -ray / ra2, gay = rax / ra2;
      put(a, gax, gay); put(n, -gax, -gay);
      if (b >= 0) { const rbx = x[b] - x[n], rby = y[b] - y[n], rb2 = rbx * rbx + rby * rby; const gbx = -rby / rb2, gby = rbx / rb2; put(b, -gbx, -gby); put(n, gbx, gby); }
      const ent = [...g.entries()].flatMap(([i, [vx, vy]]) => [[2 * i, vx], [2 * i + 1, vy]]);
      ent.forEach(([i, vi]) => ent.forEach(([j, vj]) => add(i, j, k * vi * vj)));
    });
    const fixed = new Uint8Array(n2);
    w.anchors.forEach((an) => { fixed[2 * an.n] = 1; fixed[2 * an.n + 1] = 1; });
    const REG = 1; // N/m, 메커니즘 찾기용 아주 약한 스프링
    let mt = 0; for (let k = 0; k < N; k++) if (!fixed[2 * k]) mt += w.m[k];
    const f = new Float64Array(n2);
    for (let k = 0; k < N; k++) if (!fixed[2 * k]) f[2 * k] = F * w.m[k] / mt;
    // 풀기 (고정 자유도 제거, 가우스 소거)
    const free = []; for (let i = 0; i < n2; i++) if (!fixed[i]) free.push(i);
    const M = free.length, A = free.map((i) => free.map((j) => K[i][j])), r = free.map((i) => f[i]);
    for (let i = 0; i < M; i++) A[i][i] += REG;
    for (let c = 0; c < M; c++) {
      let p = c; for (let i = c + 1; i < M; i++) if (Math.abs(A[i][c]) > Math.abs(A[p][c])) p = i;
      [A[c], A[p]] = [A[p], A[c]]; [r[c], r[p]] = [r[p], r[c]];
      for (let i = c + 1; i < M; i++) { const q = A[i][c] / A[c][c]; if (!q) continue; for (let j = c; j < M; j++) A[i][j] -= q * A[c][j]; r[i] -= q * r[c]; }
    }
    const sol = new Float64Array(M);
    for (let i = M - 1; i >= 0; i--) { let t = r[i]; for (let j = i + 1; j < M; j++) t -= A[i][j] * sol[j]; sol[i] = t / A[i][i]; }
    const u = new Float64Array(n2); free.forEach((i, k) => (u[i] = sol[k]));
    // 층별 변위
    const rows = level.ys.map((yy, j) => { const ks = []; for (let k = 0; k < N; k++) if (Math.abs(y[k] - yy) < 1e-6 && /^\d+,\d+$/.test(w.names[k])) ks.push(k); return ks; });
    const ux = (ks) => (ks.length ? ks.reduce((t, k) => t + u[2 * k], 0) / ks.length : 0);
    const storeys = [];
    for (let j = 1; j < level.ys.length; j++) storeys.push({ j, drift: ux(rows[j]) - ux(rows[j - 1]) });
    const topU = ux(rows[rows.length - 1]);
    const mechanism = Math.abs(topU) > 10 || storeys.some((st) => Math.abs(st.drift) > 10);
    const members = w.members.map((m) => {
      const a = m.ia, b = m.ib; const dx = x[b] - x[a], dy = y[b] - y[a], L = Math.hypot(dx, dy);
      const N_ = (1 / m.alpha) * ((u[2 * b] - u[2 * a]) * dx / L + (u[2 * b + 1] - u[2 * a + 1]) * dy / L);
      return { ia: a, ib: b, type: m.type, group: m.group, role: m.role, N: N_ };
    });
    let weak = 0; storeys.forEach((st, i) => { if (Math.abs(st.drift) > Math.abs(storeys[weak].drift)) weak = i; });
    return { mechanism, K: mechanism ? 0 : F / Math.abs(topU) / 1000, storeys, weakStorey: storeys[weak] ? storeys[weak].j : 1, u, members, world: w, F };
  }

  // 비틀림(2D 화면은 건물 앞면 골조): level.back = { ratio } 이면 뒷면(벽돌로 꽉 막힘)의 옆 강성 = 맨 앞면 × ratio.
  // 앞·뒤 강성이 다르면 강성 중심(CR)이 무게 중심(CM)에서 벗어나 건물이 비틀리고, 약한 쪽 골조가 더 크게 흔들린다.
  // 앞면이 받는 흔들림 배율 tf = 1 + amp × |뒤 − 앞| / (뒤 + 앞). 앞면을 보강해 뒤와 비슷해지면 1 로 내려감.
  const torCache = new Map();
  QR.torsionOf = (level, design) => {
    if (!level.back) return { tf: 1, u: 0, e: 0 };
    let K0 = torCache.get(level.id); if (K0 === undefined) { K0 = analyze(level, []).K || 1; torCache.set(level.id, K0); }
    const a = analyze(level, design), Kf = a.mechanism ? 0 : a.K, Kb = level.back.ratio * K0;
    const u = (Kb - Kf) / (Kb + Kf); // + 면 뒤가 더 단단 → 앞(화면)이 크게 돎
    const D = level.back.depth || 8;
    return { tf: 1 + (level.back.amp || 0.5) * Math.abs(u), u, e: (u * D) / 2, D, Kf, Kb };
  };

  // 이 판·이 보강에서 앞면 골조가 받는 지진 (비틀림 배율 포함) — 게임과 시험이 같은 것을 씀
  QR.quakeFor = (level, design, li, pga) => makeQuake((pga || level.pga) * QR.torsionOf(level, design).tf, 5, level.seed || li + 1);

  // 값: 길이·넓이에 따라
  QR.priceOf = (level, it) => {
    const P = QR.PRICES[it.tool];
    if (it.tool === 'conn') return P.base;
    if (P.perM2 !== undefined) { const w = level.xs[it.i + 1] - level.xs[it.i], h = level.ys[it.j + 1] - level.ys[it.j]; return Math.round((P.base + P.perM2 * w * h) / 1000) * 1000; }
    const [a, b] = [nodePos(level, it.a), nodePos(level, it.b)];
    return Math.round((P.base + P.perM * Math.hypot(b[0] - a[0], b[1] - a[1])) / 1000) * 1000;
  };
  QR.usdOf = (krw) => Math.max(5, Math.round(krw / QR.USD_RATE / 5) * 5);

  QR.physics = { columnsOf, toolDef, analyze, World, makeQuake, computeSlots, checkLink, blocksDoor, allMembers, activeNodes, nodePos, isGround, baseList, cellCorners, key2 };
})();
