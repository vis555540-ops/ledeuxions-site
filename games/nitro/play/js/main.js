// Nitro Puff Rally - game flow, save, shop, input, loop.
import { buildTrack } from './tracks.js';
import { partIcons, tierOf } from './parts.js';
import { createRace, step, aiInput, makeStats, aiStatsFor, PLAYER_GAIN } from './sim.js';
import { View } from './view3d.js';
import { audio } from './audio.js';
import { STR } from './i18n.js';
import { sdk } from './sdk.js';

const Q = new URLSearchParams(location.search);
const AUTO = Q.has('auto'), FAST = Math.max(1, Math.min(20, +Q.get('fast') || 1));
const $ = id => document.getElementById(id);
const COLORS = [0xff5a3c, 0x3c8dff, 0xffcc2a, 0x9b5cff];
const CSS_COLORS = ['#ff5a3c', '#3c8dff', '#ffcc2a', '#9b5cff'];
const UP_KEYS = ['eng', 'tire', 'top', 'nitro'];
const UP_COST = [100, 180, 300, 460, 680, 950];
const UP_MAX = 6;
const KEY = 'npr_save_v1';

// ---------- save ----------
const today = () => new Date().toISOString().slice(0, 10);
let S = load();
function load() {
  let s = null;
  try { s = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { }
  const def = { money: 0, up: { eng: 0, tire: 0, top: 0, nitro: 0 }, race: 0, wins: 0, best: {}, ta: {}, taIdx: 0, lastDay: '', lang: '', firstWin: false, autoGas: true };
  s = Object.assign(def, s || {}); s.up = Object.assign(def.up, s.up || {}); s.ta = s.ta || {};
  // v3 fields (cups / seasons). Old saves: races already driven count toward the Dust Cup.
  if (!s.cups || typeof s.cups !== 'object') s.cups = {};
  if (!s.cur || !Array.isArray(s.cur.pts)) {
    const r = s.race || 0;
    s.cur = { c: r < 4 ? 'dust' : null, i: r < 4 ? r : 0, pts: [0, 0, 0, 0] };
    if (r >= 4 && !s.cups.dust) s.cups.dust = { plays: 1, best: 0 };
    s.seasons = r >= 4 ? 1 : 0;
  }
  s.seasons = s.seasons || 0; s.newParts = s.newParts || {};
  if (!s.lang) s.lang = (navigator.language || 'en').toLowerCase().startsWith('ko') ? 'ko' : 'en';
  if (Q.get('lang') === 'ko' || Q.get('lang') === 'en') s.lang = Q.get('lang');
  return s;
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { } }
let dailyGift = 0;
if (S.lastDay && S.lastDay !== today()) { dailyGift = 150 + 50 * Math.min(4, Math.floor(S.race / 3)); S.money += dailyGift; }
S.lastDay = today(); save();

const L = () => STR[S.lang];
// cups: each cup = one season of 4 races over its own tracks. Dust Cup is the fixed first season;
// finishing a cup unlocks the next one. Track = [index, reverse].
const CUPS = [
  { id: 'dust', name: { en: 'Mud Puddle Cup', ko: '진흙웅덩이 컵' }, tracks: [[0, 0], [1, 0], [2, 0], [0, 1]], base: 0, tier: 0, mult: 1, stars: 1, col: '#e3a46a' },
  { id: 'canyon', name: { en: 'Dusty Canyon Cup', ko: '먼지 협곡 컵' }, tracks: [[1, 0], [2, 1], [0, 1], [1, 1]], base: 5, tier: 1, mult: 1.35, stars: 2, col: '#dfe6ee' },
  { id: 'pro', name: { en: 'Thunder Hill Cup', ko: '천둥 언덕 컵' }, tracks: [[3, 0], [4, 0], [1, 1], [3, 1]], base: 9, tier: 1, mult: 1.7, stars: 3, col: '#ffd23a' },
  { id: 'rev', name: { en: 'Puff King Cup', ko: '뿌웅왕 컵' }, tracks: [[0, 1], [3, 1], [4, 1], [2, 1]], base: 12, tier: 2, mult: 2.1, stars: 4, col: '#c08cff' },
];
const CUP_RACES = 4, PTS = [10, 6, 4, 2];
const cupById = id => CUPS.find(c => c.id === id) || CUPS[0];
const cupInfo = c => S.cups[c.id] || { plays: 0, best: 0 };
const cupOpen = i => i === 0 || cupInfo(CUPS[i - 1]).plays > 0;
const curCup = () => cupById(S.cur.c || 'dust');
const cupDiff = c => c.base + S.cur.i + 2 * Math.min(3, cupInfo(c).plays); // replaying a cup = harder rivals
function curTrack() {
  const c = curCup(), t = c.tracks[Math.min(CUP_RACES - 1, S.cur.i)];
  return { idx: t[0], rev: !!t[1], tier: Math.min(3, c.tier + Math.min(1, cupInfo(c).plays)) };
}
const rubberFor = r => (r < 3 ? 1 : r < 6 ? 0.6 : 0.35);
const season = () => S.seasons + 1;
const cupMult = c => c.mult * (1 + 0.1 * Math.min(5, S.seasons));
const raceLine = () => { const l = L(); return `🏆 ${curCup().name[S.lang]} · ${l.race} ${S.cur.i + 1}/${CUP_RACES} · ${l.series} ${season()}`; };

// ---------- view ----------
const view = new View($('game'));
let R = null, T = null, mode = 'loading', paused = false, isTA = false, titleR = null, shopFrom = 'title';
const TA_LAPS = 3;
const fmt = t => (t ? t.toFixed(2) + 's' : '--');
window.__npr = { get mode() { return mode; }, get R() { return R; }, get S() { return S; }, errors: [], view, test: { openCupSel: () => openCupSel(), openShop: f => openShop(f), startCredits: () => startCredits(), openSeason: () => openSeason(), save: () => save(), toTitle: () => toTitle() } };

function applyLang() {
  const l = L();
  document.documentElement.lang = S.lang;
  document.querySelectorAll('[data-t]').forEach(el => { el.textContent = l[el.dataset.t]; });
  $('langBtn').textContent = S.lang === 'en' ? 'English → 한국어' : '한국어 → English';
  $('autoBtn').textContent = S.autoGas ? l.autoOn : l.autoOff;
  view.youLabel = l.you;
  soundLabels();
  $('tGas').style.display = S.autoGas ? 'none' : '';
  document.title = l.title;
  if (mode === 'shop') renderShop();
  if (mode === 'taSel') renderTASel();
  if (mode === 'cupSel') renderCupSel();
}
function show(id) {
  for (const s of ['title', 'result', 'shop', 'hud', 'pause', 'settings', 'intro', 'taSel', 'taRes', 'cupSel', 'season', 'credits']) $(s).classList.toggle('on', s === id || (s === 'hud' && (id === 'race')));
  $('touch').classList.toggle('on', id === 'race' && isTouch());
  $('rotate').classList.toggle('need', id === 'race');
  if (id !== 'race') { $('speedfx').classList.remove('on'); $('bigPlace').classList.remove('on'); }
}
function soundLabels() {
  const l = L(), ic = audio.muted ? '🔇' : '🔊';
  $('muteBtn').textContent = audio.muted ? l.soundOff : l.soundOn; $('hMute').textContent = ic; $('pSound').textContent = `${ic} ${l.sound}`;
  $('sSound').textContent = audio.muted ? l.off : l.on; $('sSfx').textContent = audio.sfx ? l.on : l.off; $('sMusic').textContent = audio.music ? l.on : l.off;
}
const isTouch = () => matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;

// ---------- race ----------
function startRace() {
  audio.unlock(); isTA = false;
  if (!S.cur.c) S.cur.c = 'dust';
  const tr = curTrack(), d = cupDiff(curCup());
  T = buildTrack(tr.idx, tr.rev, tr.tier);
  const l = L();
  beginRace(() => createRace(T, { playerStats: makeStats(S.up), aiStats: aiStatsFor(d), colors: COLORS, names: [l.you, ...l.rivals], autoGas: S.autoGas && !AUTO, rubber: rubberFor(d) }), COLORS,
    `${raceLine()} · ${T.name[S.lang]}${tr.rev ? ' (' + l.reverse + ')' : ''}${T.pro ? ' · ' + l.proTrack : ''}`, raceLine());
  R.skill = [0.6, 0.75, 0.9];
}
// time attack: solo, 3 laps, best lap per track saved locally
function taTracks() {
  const out = [], seen = new Set();
  CUPS.forEach((c, i) => {
    if (!cupOpen(i)) return;
    const ts = i === 0 && !cupInfo(c).plays ? c.tracks.slice(0, Math.max(3, S.cur.i + 1)) : c.tracks;
    for (const t of ts) { const k = t[0] + '-' + t[1]; if (!seen.has(k)) { seen.add(k); out.push({ idx: t[0], rev: t[1] }); } }
  });
  return out;
}
const taPick = () => { const ts = taTracks(); return ts[((S.taIdx % ts.length) + ts.length) % ts.length]; };
function startTA() {
  audio.unlock(); isTA = true;
  const u = taPick(), l = L();
  T = buildTrack(u.idx, !!u.rev, 0);
  beginRace(() => createRace(T, { playerStats: makeStats(S.up), aiStats: [], colors: COLORS, names: [l.you], autoGas: S.autoGas && !AUTO, rubber: 0, solo: true, laps: TA_LAPS }), [COLORS[0]],
    `${l.taPick} · ${T.name[S.lang]}${u.rev ? ' (' + l.reverse + ')' : ''}`, l.taPick);
  R.skill = [];
}
function beginRace(make, colors, label, head) {
  titleR = null; view.camOverride = null;
  view.buildTrack(T);
  paused = false; $('pause').classList.remove('on'); placeShown = false; lapFlash = null;
  R = make();
  view.addCars(colors, S.up);
  // start banner: cup / race line + what the recently bought parts do
  const l = L(), np = Object.keys(S.newParts || {}).filter(k => UP_KEYS.includes(k) && S.up[k] > 0);
  $('raceInfo').innerHTML = `<b>${head || ''}</b>` + (np.length ? `<div class="ri2">🔧 ${l.newCar}</div>` + np.map(k => `<div class="ri3">${partLine(k)}</div>`).join('') : '');
  $('raceInfo').classList.remove('on'); void $('raceInfo').offsetWidth; $('raceInfo').classList.add('on');
  clearTimeout(beginRace.t); beginRace.t = setTimeout(() => $('raceInfo').classList.remove('on'), np.length ? 4500 : 3000);
  if (np.length) { S.newParts = {}; save(); }
  mode = 'race'; show('race');
  $('trackName').textContent = label;
  audio.musicStart();
  $('countdown').textContent = '3'; $('countdown').classList.add('on');
  sdk.gameplayStart();
}

function toast(msg) { const t = $('toast'); if (!t) return; t.textContent = msg; t.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('on'), 2200); }
// rewarded-ad buttons ("double coins" after a race)
function setupAdDouble(btn, earn) {
  const l = L();
  btn.classList.toggle('on', earn > 0 && sdk.rewardedOk); btn.disabled = false;
  btn.textContent = `${l.adDouble} (+$${earn})`;
  btn.onclick = () => {
    btn.disabled = true;
    sdk.rewarded().then(ok => {
      if (!ok) { toast(L().adFail); btn.disabled = false; if (!sdk.rewardedOk) btn.classList.remove('on'); return; }
      S.money += earn; save(); audio.coin();
      btn.textContent = `✓ ${L().adDoubled} +$${earn}`;
    });
  };
}

let podiumT = 0;
function startPodium() {
  mode = 'podium'; podiumT = 0;
  show('none'); $('podiumSkip').style.display = 'block';
  const order = R.cars.slice().sort((a, b) => a.place - b.place);
  view.startPodium(R, order, COLORS);
  audio.engine(0, false); audio.cheer(1.2);
}
function endPodium() { if (mode !== 'podium') return; $('podiumSkip').style.display = 'none'; view.endPodium(); endRace(); }
function endRace() {
  sdk.gameplayStop();
  mode = 'result';
  const l = L(), pl = R.cars[0], cup = curCup();
  const place = pl.place;
  const mult = cupMult(cup);
  const prize = Math.round([300, 180, 110, 60][place - 1] * mult);
  const bags = pl.cash * 30;
  let bonus = 0;
  if (place === 1) { S.wins++; if (!S.firstWin) { S.firstWin = true; bonus = 200; } }
  S.money += prize + bags + bonus;
  if (pl.bestLap && (!S.best[T.id] || pl.bestLap < S.best[T.id])) S.best[T.id] = pl.bestLap;
  S.race++;
  // season points
  const gain = [0, 0, 0, 0], raceNo = S.cur.i + 1;
  for (const c of R.cars) { gain[c.k] = PTS[c.place - 1] || 0; S.cur.pts[c.k] += gain[c.k]; }
  S.cur.i++;
  const pts = S.cur.pts.slice();
  if (S.cur.i >= CUP_RACES) finishCup(cup, pts);
  save();
  $('rPlace').textContent = l.place[place - 1];
  $('rPlace').style.color = ['#ffd23a', '#e6e6e6', '#e3a46a', '#c9c9c9'][place - 1];
  const rows = [[l.prize, '$' + prize], [l.bags + ` ×${pl.cash}`, '$' + bags]];
  if (bonus) rows.push([l.firstWin, '$' + bonus]);
  if (pl.bestLap) rows.push([l.best, pl.bestLap.toFixed(2) + 's']);
  rows.push([l.total, '$' + (prize + bags + bonus)]);
  $('rRows').innerHTML = rows.map(r => `<div class="row"><span>${r[0]}</span><b>${r[1]}</b></div>`).join('');
  $('rOrder').innerHTML = R.cars.slice().sort((a, b) => a.place - b.place).map(c => `<span style="color:${CSS_COLORS[c.k]}">${c.place}. ${c.name}</span>`).join('');
  $('rStand').innerHTML = `<div class="sth">${cup.name[S.lang]} · ${l.race} ${raceNo}/${CUP_RACES} · ${l.standings}</div>` + standingsHTML(pts, gain);
  $('rUnlock').textContent = S.seaDone ? '🏆 ' + l.cupDone : '';
  // reasons to come back: next upgrade bar, cup ladder, tomorrow's gift
  const costs = UP_KEYS.filter(k => S.up[k] < UP_MAX).map(k => ({ k, c: UP_COST[S.up[k]] })).sort((a, b) => a.c - b.c);
  if (costs.length) {
    const n = costs[0], pct = Math.min(100, Math.round(S.money / n.c * 100));
    $('rProg').innerHTML = (S.money >= n.c ? `<b style="color:#7ee05a">⬆ ${l.ready}</b> (${l.up[n.k]})` : `${l.nextUp} (${l.up[n.k]}): <b>$${n.c - S.money}</b>`) + `<div class="prog"><i></i></div>`;
    requestAnimationFrame(() => requestAnimationFrame(() => { const b = $('rProg').querySelector('i'); if (b) b.style.width = pct + '%'; }));
  } else $('rProg').innerHTML = '';
  $('rTracks').innerHTML = cupChips();
  setupAdDouble($('rAd'), prize + bags + bonus);
  $('rDaily').textContent = `🎁 ${l.tomorrow} $${150 + 50 * Math.min(4, Math.floor(S.race / 3))}`;
  show('result');
}
function cupChips() {
  const l = L();
  return CUPS.map((c, i) => {
    const inf = cupInfo(c), open = cupOpen(i), now = S.cur.c === c.id;
    return `<span class="${now ? 'nw' : open ? '' : 'lk'}">${inf.plays ? '✓' : open ? (now ? '▶' : '•') : '🔒'} ${c.name[S.lang]}${inf.best === 1 ? ' 🏆' : ''}</span>`;
  }).join('');
}
function standingsHTML(pts, gain) {
  const l = L(), names = [l.you, ...l.rivals];
  const order = [0, 1, 2, 3].sort((a, b) => pts[b] - pts[a] || a - b);
  return `<div class="stand">` + order.map((k, n) => `<div class="srw${k === 0 ? ' me' : ''}"><span>${n + 1}.</span><span style="color:${CSS_COLORS[k]}">${names[k]}</span><b>${pts[k]} ${l.pts}</b>${gain ? `<i>+${gain[k]}</i>` : ''}</div>`).join('') + `</div>`;
}
// end of a 4-race cup: season bonus, cup record, unlock next cup, maybe the credits
function finishCup(cup, pts) {
  const order = [0, 1, 2, 3].sort((a, b) => pts[b] - pts[a] || a - b), myPos = order.indexOf(0) + 1;
  const bonus = Math.round([500, 300, 150, 60][myPos - 1] * cupMult(cup));
  const ci = CUPS.indexOf(cup), allBefore = CUPS.every(c => cupInfo(c).plays > 0);
  const inf = S.cups[cup.id] = Object.assign({ plays: 0, best: 0 }, S.cups[cup.id]);
  const firstClear = !inf.plays;
  inf.plays++; inf.best = inf.best ? Math.min(inf.best, myPos) : myPos;
  S.money += bonus;
  if (myPos === 1) sdk.happytime();   // cup win = the special moment (CrazyGames: use sparingly)
  const next = firstClear && CUPS[ci + 1] ? CUPS[ci + 1].id : null;
  // ending credits: first time you WIN the last cup (Puff King Cup); fallback: first time all cups are done
  const credits = (ci === CUPS.length - 1 && myPos === 1 && !S.crSeen) || (!allBefore && CUPS.every(c => cupInfo(c).plays > 0));
  if (credits) S.crSeen = true;
  S.seaDone = { cup: cup.id, pts, myPos, bonus, next, credits, season: season() };
  S.seasons++;
  S.cur = { c: null, i: 0, pts: [0, 0, 0, 0] };
}
function openSeason() {
  const d = S.seaDone; if (!d) return openShop();
  const l = L(), cup = cupById(d.cup);
  mode = 'season';
  $('seaTrophy').innerHTML = trophySVG(d.myPos === 1 ? cup.col : '#8a7a66', 120);
  $('seaTrophy').classList.toggle('win', d.myPos === 1);
  $('seaHead').textContent = `${cup.name[S.lang]} · ${l.series} ${d.season}`;
  $('seaPlace').textContent = d.myPos === 1 ? l.champion : l.place[d.myPos - 1];
  $('seaPlace').style.color = ['#ffd23a', '#e6e6e6', '#e3a46a', '#c9c9c9'][d.myPos - 1];
  $('seaStand').innerHTML = standingsHTML(d.pts);
  $('seaRows').innerHTML = `<div class="row"><span>${l.seasonBonus}</span><b>$${d.bonus}</b></div>`;
  $('seaUnl').textContent = d.credits ? '★ ' + l.allCups : d.next ? `★ ${l.cupUnl} ${cupById(d.next).name[S.lang]}` : '';
  show('season');
  if (d.myPos === 1) { audio.win(); audio.cheer(1.3); confettiDOM(); } else audio.lap();
}
function seasonContinue() {
  const d = S.seaDone; S.seaDone = null; save();
  if (d && d.credits) startCredits(); else openShop();
}
function trophySVG(col, size) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 100 100"><path d="M28 14h44v18c0 16-10 27-22 27S28 48 28 32z" fill="${col}" stroke="#2b1d12" stroke-width="3"/>
<path d="M28 20H14c0 14 6 20 16 21M72 20h14c0 14-6 20-16 21" fill="none" stroke="${col}" stroke-width="6"/><rect x="44" y="58" width="12" height="14" fill="${col}" stroke="#2b1d12" stroke-width="3"/>
<rect x="30" y="72" width="40" height="12" rx="3" fill="#6b4a2a" stroke="#2b1d12" stroke-width="3"/><path d="M38 22c0 10 3 18 8 22" stroke="#fff" stroke-opacity=".55" stroke-width="5" fill="none" stroke-linecap="round"/></svg>`;
}
function confettiDOM() {
  const box = $('confetti'); box.innerHTML = '';
  const cols = ['#ffd23a', '#ff5a3c', '#3c8dff', '#7ee05a', '#c08cff', '#fff'];
  for (let i = 0; i < 70; i++) {
    const e = document.createElement('i');
    e.style.cssText = `left:${Math.random() * 100}%;background:${cols[i % 6]};animation-delay:${Math.random() * 1.2}s;animation-duration:${2.2 + Math.random() * 1.6}s;transform:rotate(${Math.random() * 360}deg)`;
    box.appendChild(e);
  }
  clearTimeout(confettiDOM.t); confettiDOM.t = setTimeout(() => { box.innerHTML = ''; }, 5000);
}

// ---------- cup select (after the first season) ----------
const miniCache = {};
function miniTrack(idx, rev) {
  const key = idx + '-' + rev; if (miniCache[key]) return miniCache[key];
  const t = buildTrack(idx, !!rev); let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9;
  for (let i = 0; i < t.N; i++) { x0 = Math.min(x0, t.xs[i]); x1 = Math.max(x1, t.xs[i]); z0 = Math.min(z0, t.zs[i]); z1 = Math.max(z1, t.zs[i]); }
  const sc = 36 / Math.max(x1 - x0, z1 - z0), pts = [];
  for (let i = 0; i < t.N; i += 3) pts.push(((t.xs[i] - x0) * sc + 2 + (36 - (x1 - x0) * sc) / 2).toFixed(1) + ',' + ((t.zs[i] - z0) * sc + 2 + (36 - (z1 - z0) * sc) / 2).toFixed(1));
  return (miniCache[key] = `<svg viewBox="0 0 40 40" class="mini"><polygon points="${pts.join(' ')}" fill="none" stroke="${t.pro ? '#ffb03a' : '#e9d3a6'}" stroke-width="3.2" stroke-linejoin="round"/>${rev ? '<text x="20" y="24" font-size="11" text-anchor="middle" fill="#fff">↺</text>' : ''}</svg>`);
}
function renderCupSel() {
  const l = L();
  $('cupCards').innerHTML = CUPS.map((c, i) => {
    const open = cupOpen(i), inf = cupInfo(c);
    const stars = '★'.repeat(c.stars + Math.min(2, inf.plays)) + '☆'.repeat(Math.max(0, 6 - c.stars - Math.min(2, inf.plays)));
    return `<div class="cup${open ? '' : ' lock'}" data-cup="${c.id}"><div class="ctro">${trophySVG(open ? c.col : '#5d5245', 64)}</div>
      <div class="cn" style="color:${c.col}">${c.name[S.lang]}</div>
      <div class="cmini">${c.tracks.map(t => miniTrack(t[0], t[1])).join('')}</div>
      <div class="cl">${l.diff} <b class="st">${stars}</b></div>
      <div class="cl">${l.prize1} <b>$${Math.round(300 * cupMult(c))}</b> · ${l.tracks4}</div>
      <div class="cl">${open ? (inf.best ? `${l.cupBest}: <b>${inf.best === 1 ? '🏆 ' : ''}${l.place[inf.best - 1]}</b>` : '&nbsp;') : '🔒 ' + l.lockedBy.replace('{0}', CUPS[i - 1].name[S.lang])}</div></div>`;
  }).join('');
  $('cupCards').querySelectorAll('.cup:not(.lock)').forEach(el => el.onclick = () => {
    audio.buy(); S.cur = { c: el.dataset.cup, i: 0, pts: [0, 0, 0, 0] }; save(); startRace();
  });
  $('cupMoney').textContent = '$' + S.money + ` · ${l.series} ${season()}`;
}
function openCupSel() { audio.unlock(); R = null; mode = 'cupSel'; renderCupSel(); show('cupSel'); showcase(buildTrack(0, false, 0)); }
// championship entry: continue the cup in progress, else pick a cup (once the Dust Cup is done)
function nextChamp() {
  if (S.seaDone) return openSeason();
  if (S.cur.c) startRace();
  else if (cupInfo(CUPS[0]).plays > 0) openCupSel();
  else { S.cur.c = 'dust'; startRace(); }
}

// ---------- credits ----------
function startCredits() {
  audio.unlock(); R = null; mode = 'credits';
  const l = L();
  $('crRoll').innerHTML = `<div class="crt">${trophySVG('#ffd23a', 90)}</div>` + l.cr.map((t, i) => `<div class="${i === 0 ? 'crh' : i === l.cr.length - 1 ? 'crh crl' : 'cri'}">${t}</div>`).join('');
  const el = $('crRoll'); el.style.animation = 'none'; void el.offsetWidth; el.style.animation = '';
  el.onanimationend = () => endCredits();
  show('credits'); showcase(buildTrack(0, false, 0)); audio.musicStart(); audio.cheer(0.8);
}
function endCredits() { if (mode !== 'credits') return; audio.musicStop(); toTitle(); }

// ---------- shop ----------
// stat bars: one bar per part, current value + glowing preview of the next level's gain
const STATS = [
  { k: 'top', lab: 'sTop', v: st => st.top * 10, f: v => Math.round(v) + ' km/h' },
  { k: 'eng', lab: 'sAcc', v: st => st.accel * 5, f: v => String(Math.round(v)) },
  { k: 'tire', lab: 'sHan', v: st => st.grip * 10, f: v => String(Math.round(v)) },
  { k: 'nitro', lab: 'sNit', v: st => st.nitro * st.boostT, f: (v, st) => `${st.nitro}×${st.boostT.toFixed(1)}s` },
];
const upWith = (k, d) => Object.assign({}, S.up, { [k]: Math.min(UP_MAX, S.up[k] + d) });
const statMax = s => s.v(makeStats({ eng: UP_MAX, tire: UP_MAX, top: UP_MAX, nitro: UP_MAX })) * 1.04;
// bars start at 60% of a stock car so each level's gain looks as big as it feels
const statPct = (s, v) => { const v0 = s.v(makeStats({ eng: 0, tire: 0, top: 0, nitro: 0 })) * 0.6; return Math.max(0, (v - v0) / (statMax(s) - v0) * 100); };
// "Engine Lv2: +36% acceleration" (vs. a stock car)
function partLine(k) {
  const l = L(), lv = S.up[k];
  const pct = Math.round(k === 'eng' ? PLAYER_GAIN.eng * lv * 100 : k === 'top' ? PLAYER_GAIN.top * lv * 100 : k === 'tire' ? PLAYER_GAIN.tire * lv / 4.6 * 100 : PLAYER_GAIN.boost * lv * 100);
  return `${l.up[k]} Lv${lv}: +${pct}% ${l.eff[k]}${k === 'nitro' ? `, +${lv} ${l.morePuffs}` : ''}`;
}
function statGain(k) { const s = STATS.find(x => x.k === k), a = s.v(makeStats(S.up)), b = s.v(makeStats(upWith(k, 1))); return b - a; }
function renderStats(anim) {
  const l = L(), st = makeStats(S.up);
  $('stats').innerHTML = STATS.map(s => {
    const v = s.v(st), maxed = S.up[s.k] >= UP_MAX, nst = makeStats(upWith(s.k, 1)), nv = s.v(nst);
    const cur = statPct(s, v), gain = maxed ? 0 : statPct(s, nv) - cur;
    const w0 = anim && anim.k === s.k ? anim.from : cur;
    return `<div class="stat" data-s="${s.k}"><span class="sl">${l[s.lab]}</span><div class="sbar"><i class="cur" style="width:${w0}%"></i><i class="gain" style="left:${cur}%;width:${gain}%"></i></div>
      <span class="sv"><b>${s.f(v, st)}</b>${maxed ? '' : ` <em>→ ${s.f(nv, nst)}</em>`}</span></div>`;
  }).join('');
  if (anim) requestAnimationFrame(() => requestAnimationFrame(() => {
    const el = $('stats').querySelector(`[data-s="${anim.k}"]`); if (!el) return;
    el.classList.add('pop'); el.querySelector('.cur').style.width = anim.to + '%';
  }));
}
function buyPart(k) {
  const s = STATS.find(x => x.k === k), from = statPct(s, s.v(makeStats(S.up)));
  S.up[k]++; S.newParts = S.newParts || {}; S.newParts[k] = S.up[k]; save();
  audio.buy(); audio.upgrade(); flashK = k;
  const to = statPct(s, s.v(makeStats(S.up)));
  renderShop({ k, from, to }); flashK = null;
  if (titleR && mode === 'shop') showcase(T); // garage backdrop car picks up the new part
}
function renderShop(anim) {
  const l = L();
  $('sMoney').textContent = '$' + S.money;
  const tr = curTrack();
  $('sNext').textContent = shopFrom === 'ta' ? '' : (S.cur.c || !cupInfo(CUPS[0]).plays) ? `${raceLine()} · ${buildTrackName(tr)}` : `${l.series} ${season()} · ${l.cupSel}`;
  renderStats(anim);
  const icons = partIcons(), TN = ['', 'RED', 'CHROME', 'GOLD'], TC = ['#ccc', '#ff7a5c', '#7fb2ff', '#ffd23a'];
  $('cards').innerHTML = UP_KEYS.map(k => {
    const lv = S.up[k], max = lv >= UP_MAX, cost = UP_COST[lv], ti = tierOf(lv);
    const pips = Array.from({ length: UP_MAX }, (_, i) => `<i class="${i < lv ? 'f' : ''}"></i>`).join('');
    const img = icons[k] && icons[k][ti] ? `<img class="pimg" alt="" src="${icons[k][ti]}">` : '';
    const s = STATS.find(x => x.k === k), g = max ? '' : `<div class="cg">+${k === 'nitro' ? `1 ${l.morePuffs}` : Math.round(statGain(k)) + (k === 'top' ? ' km/h' : '')} ${l[s.lab]}</div>`;
    return `<div class="card${k === flashK ? ' flash' : ''}" data-card="${k}">${img}<div class="tier" style="color:${TC[ti]}">${TN[ti] || '&nbsp;'}</div><div class="ct">${l.up[k]} <small>Lv${lv}</small></div><div class="cd">${l.upd[k]}</div>${g}<div class="pips">${pips}</div>
      ${!max && S.money < cost && sdk.rewardedOk ? `<button class="buy ad" data-ad="${k}">${l.adMissing}${cost - S.money} → ${l.adBuy}</button>` : `<button class="buy" data-k="${k}" ${max || S.money < cost ? 'disabled' : ''}>${max ? l.max : l.buy + ' $' + cost}</button>`}</div>`;
  }).join('');
  // hovering a part card lights up its stat bar
  $('cards').querySelectorAll('.card').forEach(c => {
    const hi = on => { const el = $('stats').querySelector(`[data-s="${c.dataset.card}"]`); if (el) el.classList.toggle('hi', on); };
    c.onpointerenter = () => hi(true); c.onpointerleave = () => hi(false);
  });
  $('cards').querySelectorAll('.buy:not(.ad)').forEach(b => b.onclick = () => {
    const k = b.dataset.k, lv = S.up[k];
    if (lv < UP_MAX && S.money >= UP_COST[lv]) { S.money -= UP_COST[lv]; buyPart(k); }
  });
  // "watch ad to get the missing coins" -> the part is bought right away
  $('cards').querySelectorAll('.buy.ad').forEach(b => b.onclick = () => {
    const k = b.dataset.ad; b.disabled = true;
    sdk.rewarded().then(ok => {
      if (!ok) toast(L().adFail);
      const lv = S.up[k];
      if (ok && lv < UP_MAX) { S.money = Math.max(S.money, UP_COST[lv]); S.money -= UP_COST[lv]; if (mode === 'shop') return buyPart(k); S.up[k]++; S.newParts[k] = S.up[k]; save(); }
      if (mode === 'shop') renderShop();
    });
  });
  $('nextBtn').textContent = shopFrom === 'ta' ? l.ta : l.next;
}
let flashK = null;
function buildTrackName(tr) { const l = L(); const t = buildTrack(tr.idx, tr.rev); return `${t.name[S.lang]}${tr.rev ? ' (' + l.reverse + ')' : ''}${t.pro ? ' ★' + l.proTrack : ''}`; }
function openShop(from) { shopFrom = from || 'race'; mode = 'shop'; renderShop(); show('shop'); }

// ---------- time attack screens ----------
function renderTASel() {
  const l = L(), u = taPick(), t = buildTrack(u.idx, !!u.rev);
  $('taName').textContent = `${u.idx + 1}${u.rev ? '↺' : ''}. ${t.name[S.lang]}${u.rev ? ' (' + l.reverse + ')' : ''}`;
  $('taBestL').textContent = `${l.taBest}: ${S.ta[t.id] ? fmt(S.ta[t.id]) : l.taNone}`;
}
function openTASel() {
  audio.unlock(); R = null; mode = 'taSel'; renderTASel(); show('taSel');
  const u = taPick(); showcase(buildTrack(u.idx, !!u.rev, 0));
}
function taStep(d) { S.taIdx = (S.taIdx || 0) + d; save(); renderTASel(); const u = taPick(); showcase(buildTrack(u.idx, !!u.rev, 0)); }
function endTA() {
  sdk.gameplayStop(); mode = 'taRes';
  const l = L(), c = R.cars[0], prev = S.ta[T.id] || 0, best = c.bestLap || 0;
  const rec = !!best && (!prev || best < prev);
  if (rec) S.ta[T.id] = best;
  const bags = c.cash * 20, earn = 40 + (rec ? 100 : 0) + bags;
  S.money += earn; save();
  $('taHead').textContent = rec ? '★ ' + l.taNew + ' ★' : `${l.taPick} · ${T.name[S.lang]}`;
  $('taBig').textContent = fmt(best); $('taBig').style.color = rec ? '#ffd23a' : '#fff';
  const laps = c.lapTimes || [];
  const rows = laps.map((t, i) => [`${l.lapN} ${i + 1}`, fmt(t), t === best]);
  rows.push([rec ? l.taPrev : l.taBest, fmt(rec ? prev : S.ta[T.id]), false]);
  rows.push([l.earned + (rec ? ' (+' + l.taNew + ')' : ''), '$' + earn, false]);
  $('taRows').innerHTML = rows.map(r => `<div class="row${r[2] ? ' nb' : ''}"><span>${r[0]}</span><b>${r[2] ? '★ ' : ''}${r[1]}</b></div>`).join('');
  setupAdDouble($('taAd'), earn);
  if (rec) audio.win();
  show('taRes');
}
// title backdrop: the player's car on the starting grid with a slow orbiting camera
function showcase(tr) {
  T = tr; view.buildTrack(T); view.addCars([COLORS[0]], S.up);
  titleR = createRace(T, { playerStats: makeStats(S.up), aiStats: [], colors: COLORS, names: [L().you], solo: true });
  const tag = view.cars[0] && view.cars[0].root.userData.tag; if (tag) tag.visible = false;
  const c = titleR.cars[0];
  view.camOverride = (cam, time) => {
    const a = time * 0.22, r = 7.5;
    cam.position.set(c.x + Math.cos(a) * r, c.y + 3.4, c.z + Math.sin(a) * r);
    cam.lookAt(c.x, c.y - 0.6, c.z);
  };
}

// ---------- input ----------
const keys = {};
const touch = { l: false, r: false, gas: false, nitro: false, brake: false };
addEventListener('keydown', e => {
  keys[e.code] = true;
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
  audio.unlock();
  if ((e.code === 'Enter' || e.code === 'Space') && mode === 'title') openTASel();
  else if (e.code === 'Enter' && mode === 'taSel') startTA();
  else if (mode === 'intro') endIntro();
  else if (mode === 'credits') endCredits();
  else if (mode === 'podium' && podiumT > 0.6) endPodium();
  if (e.code === 'KeyP' || e.code === 'Escape') togglePause();
});
addEventListener('keyup', e => { keys[e.code] = false; });
function bindTouch(id, k) {
  const el = $(id);
  const on = e => { e.preventDefault(); touch[k] = true; el.classList.add('down'); audio.unlock(); };
  const off = e => { e.preventDefault(); touch[k] = false; el.classList.remove('down'); };
  el.addEventListener('pointerdown', on); el.addEventListener('pointerup', off); el.addEventListener('pointercancel', off); el.addEventListener('pointerleave', off);
}
bindTouch('tGas', 'gas'); bindTouch('tNitro', 'nitro'); bindTouch('tBrake', 'brake');
// steering: press anywhere on the left / right half of the screen (multi-touch safe)
const padPtr = new Map();
function padUpdate() { let l = false, r = false; for (const s of padPtr.values()) { if (s === 'l') l = true; else r = true; } touch.l = l; touch.r = r; $('tHintL').classList.toggle('down', l); $('tHintR').classList.toggle('down', r); }
const padSide = e => (e.clientX < innerWidth / 2 ? 'l' : 'r');
const pad = $('tPad');
pad.addEventListener('pointerdown', e => { e.preventDefault(); audio.unlock(); try { pad.setPointerCapture(e.pointerId); } catch (_) { } padPtr.set(e.pointerId, padSide(e)); padUpdate(); });
pad.addEventListener('pointermove', e => { if (padPtr.has(e.pointerId)) { padPtr.set(e.pointerId, padSide(e)); padUpdate(); } });
for (const ev of ['pointerup', 'pointercancel', 'lostpointercapture']) pad.addEventListener(ev, e => { padPtr.delete(e.pointerId); padUpdate(); });
let nitroHeld = false;
function playerInput() {
  const c = R.cars[0], inp = c.input;
  if (AUTO) { aiInput(R, c, 1 / 60, 0.9); return; }
  const left = keys.ArrowLeft || keys.KeyA || touch.l, right = keys.ArrowRight || keys.KeyD || touch.r;
  inp.steer = (right ? 1 : 0) - (left ? 1 : 0);
  inp.gas = (keys.ArrowUp || keys.KeyW || touch.gas) ? 1 : 0;
  inp.brake = (keys.ArrowDown || keys.KeyS || touch.brake) ? 1 : 0;
  const n = keys.Space || keys.ShiftLeft || touch.nitro;
  inp.nitro = n && !nitroHeld; nitroHeld = !!n;
}
function togglePause(force, fromHide) {
  if (mode !== 'race') return;
  paused = force !== undefined ? force : !paused;
  $('pause').classList.toggle('on', paused);
  if (paused) { audio.engine(0, false); audio.musicStop(); if (!fromHide) sdk.gameplayStop(); } else { audio.musicStart(); sdk.gameplayStart(); }
}
function toTitle() {
  paused = false; $('pause').classList.remove('on'); sdk.gameplayStop(); audio.engine(0, false); audio.musicStop();
  mode = 'title'; R = null; const tr = curTrack(); showcase(buildTrack(tr.idx, tr.rev, tr.tier));
  $('tMoney').textContent = S.race > 0 ? '$' + S.money : ''; show('title');
}
document.addEventListener('contextmenu', e => e.preventDefault());   // no browser menu on long-press / right-click (iframe)
document.addEventListener('visibilitychange', () => { if (document.hidden) { togglePause(true, true); audio.suspend(); } else audio.resume(); });
$('pResume').onclick = () => togglePause(false);
$('pRestart').onclick = () => { paused = false; $('pause').classList.remove('on'); sdk.gameplayStop(); isTA ? startTA() : startRace(); };
$('pMenu').onclick = () => toTitle();
$('pSound').onclick = () => { audio.toggleMute(); soundLabels(); };
$('hMute').onclick = () => { audio.toggleMute(); soundLabels(); };

// ---------- HUD ----------
function hud() {
  const l = L(), c = R.cars[0];
  $('hLap').textContent = `${l.lap} ${Math.max(1, Math.min(R.laps, c.laps + 1))}/${R.laps}`;
  if (R.solo) {
    const cur = R.state === 'race' && !c.finished && c.laps >= 0 ? R.t - c.lapStart : 0;
    $('hPos').textContent = '⏱ ' + (cur ? cur.toFixed(1) : '0.0'); $('hPos').style.color = '#fff';
  } else { $('hPos').textContent = l.place[c.place - 1]; $('hPos').style.color = c.place === 1 ? '#ffd23a' : '#fff'; }
  $('hNitro').innerHTML = '<span class="nlab">PUFF</span>' + Array.from({ length: c.nitro }, () => '<i></i>').join('');
  if (R.solo) { const bn = Math.min(S.ta[T.id] || 1e9, c.bestLap || 1e9); $('hCash').textContent = `${l.taBest} ${fmt(bn < 1e9 ? bn : 0)}`; }
  else $('hCash').textContent = '$' + (S.money + c.cash * 30);
  const cd = $('countdown');
  if (R.state === 'countdown') { cd.textContent = Math.ceil(R.count); cd.classList.add('on'); }
  else if (R.t - (R.raceStart || 0) < 0.8) { cd.textContent = l.go; cd.classList.add('on'); }
  else if (c.finished) { cd.textContent = l.finish; cd.classList.add('on'); }
  else if (lapFlash && R.t < lapFlash.until) { cd.textContent = lapFlash.txt; cd.classList.add('on'); }
  else cd.classList.remove('on');
  cd.classList.toggle('finalLap', !!(lapFlash && lapFlash.fin && R.t < lapFlash.until && !c.finished));
  $('speedfx').classList.toggle('on', c.boostT > 0 && R.state === 'race');
  if (c.finished && !placeShown) {
    placeShown = true; const bp = $('bigPlace');
    if (R.solo) { const rec = c.bestLap && (!S.ta[T.id] || c.bestLap < S.ta[T.id]); bp.textContent = rec ? '★ ' + l.taNew : fmt(c.bestLap); bp.style.color = rec ? '#ffd23a' : '#fff'; }
    else { bp.textContent = c.place === 1 ? `🏆 ${l.place[0]}` : l.place[c.place - 1]; bp.style.color = ['#ffd23a', '#f0f0f0', '#f0b47a', '#d0d0d0'][c.place - 1]; }
    bp.classList.add('on'); cd.style.top = '18%';
  } else if (!c.finished) { $('bigPlace').classList.remove('on'); cd.style.top = ''; }
}
let placeShown = false, lapFlash = null;

// ---------- loop ----------
let last = performance.now(), acc = 0;
const DT = 1 / 120;
function frame(now) {
  requestAnimationFrame(frame);
  let dt = Math.min(0.05, (now - last) / 1000); last = now;
  const time = now / 1000;
  if (mode === 'race' && R && !paused) {
    acc += dt * FAST;
    let n = 0;
    while (acc >= DT && n < 40 * FAST) {
      playerInput();
      for (let k = 1; k < R.cars.length; k++) aiInput(R, R.cars[k], DT, R.skill[k - 1]);
      step(R, DT); acc -= DT; n++;
    }
    handleEvents();
    hud();
    const c = R.cars[0];
    audio.engine(Math.min(1, c.speed / 14), R.state !== 'post' || !c.finished, c.boostT > 0);
    view.update(R, dt * FAST, time);
    if (R.done && mode === 'race') { if (R.solo) endTA(); else if (Q.has('nopodium')) endRace(); else startPodium(); }
  } else if (mode === 'podium') {
    podiumT += dt; view.update(R, dt, time);
    if (podiumT > 3.8) endPodium();
  } else if (mode === 'intro') {
    introStep(dt, time);
  } else if (titleR && !R) {
    view.update(titleR, dt, time);
  } else if (R) {
    view.update(R, paused ? 0 : dt, time);
    if (mode !== 'race') audio.engine(0, false);
  } else if (mode !== 'loading') {
    view.renderer.render(view.scene, view.camera);
  }
}
function handleEvents() {
  for (const e of R.events) {
    const me = e.car && e.car.isPlayer;
    switch (e.t) {
      case 'beep': audio.beep(false); break;
      case 'go': audio.beep(true); break;
      case 'puff': view.puff(e.car); if (me) { audio.puff(); view.kick(0.32); } else audio._blip(90, 0.15, 'square', 0.04); break;
      case 'coin': view.burst(e.x, e.z, 0xffd23a); if (me) audio.coin(); break;
      case 'nitroPick': view.burst(e.x, e.z, 0x8ef07a); if (me) audio.pickNitro(); break;
      case 'land': view.landDust(e.car, e.v > 6); if (me) { audio.thud(Math.min(1.3, e.v / 7)); view.kick(Math.min(0.45, e.v * 0.05)); } break;
      case 'jump': if (me) audio._blip(300, 0.15, 'triangle', 0.08); break;
      case 'bonk': if (e.x !== undefined && e.v > 4) view.bonkDust(e.x, e.z, e.v); if (me) { audio.bonk(e.v); view.kick(Math.min(0.3, e.v * 0.03)); } break;
      case 'bump': audio.bonk(e.v * 0.6); if (e.x !== undefined) view.bonkDust(e.x, e.z, e.v * 0.6); if (me) view.kick(Math.min(0.3, e.v * 0.04)); break;
      case 'lap': if (me) { const n = e.car.laps, fin = n === R.laps - 1; if (fin || !R.solo) lapFlash = { txt: fin ? L().finalLap : `${L().lap} ${n + 1}/${R.laps}`, until: R.t + 1.2, fin }; if (fin) { audio.beep(true); setTimeout(() => audio.win(), 180); } else audio.lap(); if (e.car.place === 1) { audio.cheer(0.7); view.cheer(0.8); } } break;
      case 'lapTime': if (me && R.solo && R.state === 'race' && e.car.laps < R.laps - 1) lapFlash = { txt: (e.best ? '★ ' : '') + fmt(e.v), until: R.t + 1.4 }; break;
      case 'finish': if (me && R.solo) { audio.lap(); audio.cheer(0.8); view.cheer(1); } else if (me) { audio.lap(); audio.cheer(e.car.place === 1 ? 1.3 : 0.7); view.cheer(1); if (e.car.place === 1) { audio.win(); for (let i = 0; i < 4; i++) setTimeout(() => view.confetti(e.car.x, e.car.y + 2, e.car.z, 26), i * 250); } } break;
    }
  }
  R.events.length = 0;
}

// ---------- boot ----------
$('playBtn').onclick = () => nextChamp();
$('crBtn').onclick = () => startCredits();
$('credits').addEventListener('pointerdown', () => endCredits());
$('seaBtn').onclick = () => seasonContinue();
$('cupBack').onclick = () => toTitle();
$('cupGarage').onclick = () => openShop('race');
$('taBtn').onclick = () => openTASel();
$('taPrev').onclick = () => taStep(-1); $('taNext').onclick = () => taStep(1);
$('taGo').onclick = () => startTA();
$('taBack').onclick = () => toTitle();
$('taRetry').onclick = () => startTA();
$('taNextT').onclick = () => { S.taIdx = (S.taIdx || 0) + 1; save(); openTASel(); };
$('taGarage').onclick = () => openShop('ta');
$('taMenu').onclick = () => toTitle();
$('garageBtn').onclick = () => { audio.unlock(); openShop('title'); };
$('contBtn').onclick = () => (S.seaDone ? openSeason() : openShop());
$('nextBtn').onclick = () => sdk.midgame(() => (shopFrom === 'ta' ? openTASel() : nextChamp()));
$('autoBtn').onclick = () => { S.autoGas = !S.autoGas; save(); applyLang(); };
$('langBtn').onclick = () => { S.lang = S.lang === 'en' ? 'ko' : 'en'; save(); applyLang(); };
$('muteBtn').onclick = () => { audio.unlock(); audio.toggleMute(); soundLabels(); };
$('setBtn').onclick = () => { audio.unlock(); mode = 'settings'; show('settings'); };
$('setBack').onclick = () => { mode = 'title'; show('title'); };
$('shopBack').onclick = () => toTitle();
$('sSound').onclick = () => { audio.unlock(); audio.toggleMute(); soundLabels(); };
$('sSfx').onclick = () => { audio.unlock(); audio.setSfx(!audio.sfx); soundLabels(); audio.coin(); };
$('sMusic').onclick = () => { audio.unlock(); audio.setMusic(!audio.music); soundLabels(); };
$('podiumSkip').onclick = () => endPodium();
$('game').addEventListener('pointerdown', () => { if (mode === 'podium' && podiumT > 0.6) endPodium(); });
$('intro').addEventListener('pointerdown', () => endIntro());
view.onPop = () => audio.pop();
$('hPause').onclick = () => togglePause();
window.addEventListener('error', e => window.__npr.errors.push(String(e.message)));

(async function boot() {
  const sdkReady = sdk.init();   // SDK script loads in parallel with the models; never throws, max ~12 s
  sdk.loadingStart();
  applyLang();
  await view.load(p => { $('loadBar').style.width = Math.round(p * 100) + '%'; });
  await sdkReady;
  sdk.loadingStop();
  $('loading').classList.remove('on');
  if (dailyGift) { $('daily').textContent = `🎁 ${L().daily} +$${dailyGift}`; $('daily').classList.add('on'); }
  requestAnimationFrame(frame);
  if (Q.get('debug') === 'ending') startCredits();
  else if (Q.has('autostart')) { toTitle(); startRace(); }
  else if (Q.has('nointro') || (introSeen() && !Q.has('intro'))) toTitle(); else startIntro();
  window.__npr.ready = true;
})();

// ---------- opening (first run ~7s, later runs skip straight to the menu) ----------
let introT = 0, introR = null;
function introSeen() { try { return localStorage.getItem('npr_intro') === '1'; } catch (e) { return false; } }
function startIntro() {
  mode = 'intro'; introT = 0; show('intro');
  T = buildTrack(0, false); view.buildTrack(T);
  introR = createRace(T, { playerStats: makeStats(S.up), aiStats: aiStatsFor(0), colors: COLORS, names: [L().you, ...L().rivals], autoGas: false });
  view.addCars(COLORS);
  const s0 = 0, b = view.bounds, cx = (b.x0 + b.x1) / 2, cz = (b.z0 + b.z1) / 2;
  const gx = T.xs[s0] - T.tx[s0] * 4, gz = T.zs[s0] - T.tz[s0] * 4;
  view.camOverride = cam => {
    // sweep over the field, then swoop down onto the starting grid
    const u = Math.min(1, introT / 4.2), e = u * u * (3 - 2 * u);
    const ang = -1.2 + introT * 0.55;
    const ox = cx + Math.cos(ang) * 30, oz = cz + Math.sin(ang) * 22, oy = 26;
    const nx = gx - T.tx[s0] * 9 + T.tz[s0] * 6, nz = gz - T.tz[s0] * 9 - T.tx[s0] * 6;
    cam.position.set(ox + (nx - ox) * e, oy + (5.5 - oy) * e * e, oz + (nz - oz) * e);
    cam.lookAt(cx + (gx - cx) * e, 0, cz + (gz - cz) * e);
  };
}
function introStep(dt, time) {
  const prev = introT; introT += dt;
  const hit = t => prev < t && introT >= t;
  if (hit(2.2) || hit(3.0)) audio.rev();
  if (hit(4.3)) { view.puff(introR.cars[0]); audio.puff(); view.kick(0.25); }
  if (hit(4.6)) { $('introTitle').classList.add('on'); audio.beep(true); }
  view.update(introR, dt, time);
  if (introT > 7.2) endIntro();
}
function endIntro() {
  if (mode !== 'intro') return;
  try { localStorage.setItem('npr_intro', '1'); } catch (e) { }
  view.camOverride = null; $('introTitle').classList.remove('on'); introR = null;
  toTitle();
}
