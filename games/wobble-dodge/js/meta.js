/* Progression (no DOM): login streak + daily gift, daily challenge (seeded by the local date), XP / level, character + hat unlocks.
   Every function takes the save object `d` and, where it matters, a Date, so tests can drive it with fake dates. */
(function () {
  'use strict';
  var G = window.G, MT = G.meta = {};
  MT.now = function () { var f = G.fakeNow != null ? G.fakeNow : window.__fakeNow; return new Date(f != null ? f : Date.now()); };   // tests may set G.fakeNow (ms)

  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function dayKey(dt) { return dt.getFullYear() + '-' + pad(dt.getMonth() + 1) + '-' + pad(dt.getDate()); }
  function dayNum(dt) { return Math.round(Date.UTC(dt.getFullYear(), dt.getMonth(), dt.getDate()) / 86400000); }   // local calendar day as an integer
  MT.dayKey = dayKey; MT.dayNum = dayNum;
  function keyNum(k) { var m = /^(\d{4})-(\d\d)-(\d\d)$/.exec(k || ''); return m ? Math.round(Date.UTC(+m[1], +m[2] - 1, +m[3]) / 86400000) : null; }

  /* ---------- characters / hats ---------- */
  MT.STARTERS = [0, 3, 5, 7];
  // 20 to unlock: one free player a day (login gift) + one at these win counts -> a new one every 1-2 sessions for about two weeks
  MT.UNLOCK_ORDER = [2, 12, 1, 16, 4, 13, 6, 18, 8, 14, 9, 19, 10, 15, 11, 17, 20, 21, 22, 23];
  MT.WIN_UNLOCKS = [1, 3, 5, 8, 11, 15, 20, 26, 33];   // wins that unlock the next character
  // cosmetic hats: id -> how it is earned
  MT.HATS = [
    { id: 'star', how: 'lvl', v: 3 }, { id: 'flower', how: 'streak', v: 3 }, { id: 'wizard', how: 'lvl', v: 5 },
    { id: 'pirate', how: 'wins', v: 10 }, { id: 'viking', how: 'streak', v: 7 }, { id: 'goldcrown', how: 'champ', v: 5 }
  ];
  MT.nextLocked = function (d) { for (var i = 0; i < MT.UNLOCK_ORDER.length; i++) if (d.unl.indexOf(MT.UNLOCK_ORDER[i]) < 0) return MT.UNLOCK_ORDER[i]; return -1; };
  function unlockNext(d, ev, why) { var c = MT.nextLocked(d); if (c < 0) return -1; d.unl.push(c); ev.push({ k: 'char', ch: c, why: why }); return c; }
  function hatCheck(d, ev) {
    var L = MT.level(d.xp).lvl;
    MT.HATS.forEach(function (h) {
      if (d.hats.indexOf(h.id) >= 0) return;
      var ok = h.how === 'lvl' ? L >= h.v : h.how === 'wins' ? d.wins >= h.v : h.how === 'streak' ? d.login.best >= h.v : h.how === 'champ' ? d.beaten >= h.v : false;
      if (ok) { d.hats.push(h.id); ev.push({ k: 'hat', hat: h.id }); }
    });
  }
  MT.hatCheck = hatCheck;

  /* ---------- XP / level ---------- */
  MT.need = function (L) { return 100 + 40 * (L - 1); };   // XP from level L to L+1
  MT.level = function (xp) { var L = 1, rest = Math.max(0, xp | 0); while (rest >= MT.need(L) && L < 99) { rest -= MT.need(L); L++; } return { lvl: L, cur: rest, need: MT.need(L) }; };

  /* ---------- login streak + daily gift ---------- */
  // call on boot and whenever the day may have changed. Returns events (empty if already counted today).
  MT.login = function (d, dt) {
    var ev = [], t = dayKey(dt), last = keyNum(d.login.last), now = dayNum(dt);
    if (d.login.last === t) return ev;
    var first = !d.login.last;
    if (last !== null && now - last === 1) d.login.streak++; else d.login.streak = 1;
    d.login.last = t; d.login.days++; d.login.best = Math.max(d.login.best, d.login.streak);
    if (!first) {
      var bonus = 25 * Math.min(7, d.login.streak); d.xp += bonus;
      ev.push({ k: 'streak', n: d.login.streak, xp: bonus });
      if (unlockNext(d, ev, 'gift') >= 0) d.gifts++;
      hatCheck(d, ev);
    }
    return ev;
  };

  /* ---------- daily challenge ---------- */
  // seven kinds; the target k varies by day. Every one is doable by a beginner in one or two matches.
  var KINDS = ['spWin', 'left', 'catch', 'sp', 'hit', 'flaw', 'win'], KS = { left: [2, 3], catch: [2, 3], hit: [3, 4], sp: [2] };
  MT.DAILY = KINDS;
  function rng(seed) { var a = seed >>> 0; return function () { a = (a + 0x6D2B79F5) >>> 0; var t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  // each week is a shuffled order of the 7 kinds; if a week would start with the kind that ended the last one, its first two swap
  function week(w) { var r = rng(w * 7919 + 13), p = KINDS.slice(); for (var i = p.length - 1; i > 0; i--) { var j = Math.floor(r() * (i + 1)), t = p[i]; p[i] = p[j]; p[j] = t; } return p; }
  function weekFixed(w) { var p = week(w), q = week(w - 1); if (p[0] === q[6]) { var t = p[0]; p[0] = p[1]; p[1] = t; } return p; }
  MT.challenge = function (dt) {
    var n = dayNum(dt), w = Math.floor(n / 7), id = weekFixed(w)[n - w * 7], ks = KS[id] || [1];
    return { id: id, k: ks[Math.floor(rng(n * 31 + 7)() * ks.length)], day: dayKey(dt) };
  };
  MT.ensureDaily = function (d, dt) { var t = dayKey(dt); if (d.daily.date !== t) { d.daily.date = t; d.daily.done = false; } return MT.challenge(dt); };
  // did this match finish today's challenge? st = match summary from main.js
  MT.meets = function (c, st) {
    switch (c.id) {
      case 'win': return st.won;
      case 'spWin': return st.spKO >= 1;            // finish a round with a special shot (the round's last out)
      case 'left': return st.won && st.leftMax >= Math.min(c.k, st.n);   // win a round with k teammates still in
      case 'catch': return st.cat >= c.k;
      case 'sp': return st.sp >= c.k;
      case 'hit': return st.hit >= c.k;
      case 'flaw': return st.flaw >= 1;             // a round won without losing anyone
    }
    return false;
  };
  MT.progress = function (c, st) {
    switch (c.id) { case 'catch': return Math.min(c.k, st.cat); case 'sp': return Math.min(c.k, st.sp); case 'hit': return Math.min(c.k, st.hit); }
    return MT.meets(c, st) ? c.k : 0;
  };

  /* ---------- match rewards ---------- */
  // st: { won, draw, lvl, firstBeat, hit, cat, sp, spKO, leftMax, flaw, n, guide }
  MT.reward = function (d, st, dt) {
    var ev = [], xp = 0, parts = [];
    var before = MT.level(d.xp);
    xp += st.won ? 60 : 25; parts.push(['xpMatch', st.won ? 60 : 25]);
    var play = 10 * st.hit + 15 * st.cat + 20 * st.sp; if (play) { xp += play; parts.push(['xpPlay', play]); }
    if (st.firstBeat) { xp += 50; parts.push(['xpNewTeam', 50]); }
    var c = MT.ensureDaily(d, dt), dailyNow = false;
    if (!d.daily.done && MT.meets(c, st)) { d.daily.done = true; d.dailyN++; xp += 150; parts.push(['xpDaily', 150]); dailyNow = true; ev.push({ k: 'daily', c: c }); }
    d.played = d.played; if (st.won) d.wins++; else if (!st.draw) d.losses++;
    d.xp += xp;
    if (st.won && MT.WIN_UNLOCKS.indexOf(d.wins) >= 0) unlockNext(d, ev, 'wins');
    var after = MT.level(d.xp);
    if (after.lvl > before.lvl) ev.push({ k: 'lvl', from: before.lvl, to: after.lvl });
    hatCheck(d, ev);
    return { xp: xp, parts: parts, before: before, after: after, ev: ev, daily: c, dailyNow: dailyNow };
  };
  // what is waiting tomorrow (for the "come back tomorrow" teaser)
  MT.tomorrow = function (d, dt) {
    var t = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate() + 1, 0, 0, 0);
    return { ch: MT.nextLocked(d), challenge: MT.challenge(t), streak: d.login.last === dayKey(dt) ? d.login.streak + 1 : 1, ms: t - dt };
  };
  // wins needed for the next win-unlock (or -1)
  MT.winsToNext = function (d) { for (var i = 0; i < MT.WIN_UNLOCKS.length; i++) if (MT.WIN_UNLOCKS[i] > d.wins) return MT.WIN_UNLOCKS[i] - d.wins; return -1; };
})();
