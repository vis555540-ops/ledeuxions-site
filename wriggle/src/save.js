// save.js — localStorage 래퍼. Phase 0 은 high/mute/deaths 만 쓴다.
const KEY = 'wriggle.v1';

const EMPTY = {
  high: 0, coins: 0, mute: false, skin: 'basic', skins: ['basic'],
  cleared: false, bestTime: 0,
  st: { deaths: 0, drops: 0, kills: 0, wall: 0, comboMax: 0, fis: 0, moleDodge: 0, dry: 0 },
};

let data = null;

export function load() {
  if (data) return data;
  try {
    const raw = localStorage.getItem(KEY);
    data = raw ? { ...structuredClone(EMPTY), ...JSON.parse(raw) } : structuredClone(EMPTY);
    data.st = { ...EMPTY.st, ...(data.st || {}) };
  } catch (e) {
    data = structuredClone(EMPTY);
  }
  return data;
}

export function commit() {
  try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) {}
}

export function addStats(patch) {
  const d = load();
  for (const [k, v] of Object.entries(patch)) d.st[k] = (d.st[k] || 0) + v;
  commit();
}

// 판 정산 — Phase 0 은 최고 고도와 사망 수만 본다.
export function settle(run) {
  const d = load();
  const newRecord = run.altM > d.high;
  if (newRecord) d.high = Math.floor(run.altM);
  d.st.deaths += 1;
  commit();
  return { newRecord, high: d.high };
}

export function setMute(b) { load().mute = !!b; commit(); }
export function wipe() { try { localStorage.removeItem(KEY); } catch (e) {} data = null; }
