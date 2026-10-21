/* Progression (no DOM): login streak + daily gift, daily challenge (seeded by the local date), XP / level, character goal unlocks (MT.UNLOCKS) + hat unlocks.
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
  /* Vampire-Survivors-style unlocks: every locked player has its own goal tied to play.
     v = the counter in d.ach (or d.wins / d.beaten / d.login.days), n = goal. Per-match goals keep the best match in d.ach.
     req = a chain: the goal stays hidden ("unlock X first") until X is unlocked. sec = secret: only a vague hint until done.
     Pace (art/해금_속도_분석.md, Monte-Carlo with MT.reward, average player): ~2 in the first session (first win + 10 hits), ~5 after day 1,
     ~9 by day 3, ~13 by day 7, ~17 after a month; one or two a day in between. Ladder/story (15, 20) and the secrets keep their goals.
     A locked, visible (not secret / not chained) player can also be opened with 3 rewarded ads (MT.adWatched, max 5 ads a day). */
  MT.UNLOCKS = [
    { ch: 2, v: 'wins', n: 1 },                 // first win (the guided match)
    { ch: 12, v: 'hit', n: 10 },                // hit 10 opponents in total
    { ch: 1, v: 'sp', n: 10 },                  // use 10 special shots in total
    { ch: 4, v: 'outsBest', n: 10 },            // put 10 out (hits + catch-outs) in one match
    { ch: 6, v: 'cat', n: 50 },                 // catch 50 balls in total
    { ch: 18, v: 'spBest', n: 5, req: 12 },     // chain after Zappy: 5 specials in one match (the fire one)
    { ch: 8, v: 'rev', n: 30 },                 // bring 30 teammates back with catches (the halo one)
    { ch: 13, v: 'ban', n: 25 },                // hit 25 times with the BANANA SHOT
    { ch: 14, v: 'noHit', n: 3 },               // win 3 matches without getting hit (the ninja)
    { ch: 10, v: 'days', n: 3 },                // the one login unlock: play on 3 different days
    { ch: 9, v: 'w7', n: 1 },                   // win a 7 vs 7 match
    { ch: 23, v: 'flipAir', n: 1, req: 9 },     // chain after the horned one: FLIP shot hits a jumping enemy
    { ch: 11, v: 'mpCatch', n: 1 },             // finish a match with a catch on match point
    { ch: 16, v: 'cat', n: 120 },               // the old master: 120 catches in total
    { ch: 15, v: 'beaten', n: 8 },              // beat ladder team 8
    { ch: 20, v: 'hulkWin', n: 1, req: 15 },    // chain after Hulky: win with Hulky on the team
    { ch: 17, v: 'wins', n: 60 },               // 60 wins in total (the idol)
    { ch: 19, v: 'airCat', n: 1, sec: 1 },      // secret: catch a ball in mid-air (the cat)
    { ch: 21, v: 'passBest', n: 8, sec: 1 },    // secret: 8 passes in a row without throwing (the bee)
    { ch: 22, v: 'code', n: 1, sec: 1 }         // secret: tickle the title (tap it 5x, or type WOBBLE on the menu)
  ];
  MT.ACH = { hit: 0, cat: 0, sp: 0, rev: 0, ban: 0, outsBest: 0, spBest: 0, noHit: 0, w7: 0, flipAir: 0, mpCatch: 0, hulkWin: 0, airCat: 0, passBest: 0, code: 0 };
  MT.uOf = function (ch) { for (var i = 0; i < MT.UNLOCKS.length; i++) if (MT.UNLOCKS[i].ch === ch) return MT.UNLOCKS[i]; return null; };
  function ach(d) { if (!d.ach || typeof d.ach !== 'object') d.ach = {}; for (var k in MT.ACH) if (typeof d.ach[k] !== 'number') d.ach[k] = 0; return d.ach; }
  MT.val = function (d, u) { return u.v === 'wins' ? d.wins : u.v === 'beaten' ? d.beaten : u.v === 'days' ? d.login.days : (ach(d)[u.v] || 0); };
  // what the select screen / results show for a locked player: { ch, u, cur, n, frac, shown: false when chained or secret }
  MT.status = function (d, ch) {
    var u = MT.uOf(ch); if (!u) return null;
    var cur = Math.min(u.n, MT.val(d, u)), open = d.unl.indexOf(ch) >= 0, chained = !!(u.req != null && d.unl.indexOf(u.req) < 0);
    return { ch: ch, u: u, cur: cur, n: u.n, frac: u.n ? cur / u.n : 0, open: open, chained: chained, secret: !!u.sec, shown: !chained && !u.sec };
  };
  // unlock everything whose goal is met (chains: only once the earlier one is open). Returns the events.
  MT.check = function (d, ev, why) {
    ev = ev || []; var again = true;
    while (again) {
      again = false;
      MT.UNLOCKS.forEach(function (u) {
        if (d.unl.indexOf(u.ch) >= 0 || (u.req != null && d.unl.indexOf(u.req) < 0) || MT.val(d, u) < u.n) return;
        d.unl.push(u.ch); ev.push({ k: 'char', ch: u.ch, why: why || u.v }); again = true;
      });
    }
    return ev;
  };
  // the locked player closest to opening (only goals the player can see; counters first) -> drives "one more match"
  MT.nextLocked = function (d) {
    var best = null;
    MT.UNLOCKS.forEach(function (u) {
      var s = MT.status(d, u.ch); if (s.open || !s.shown || u.v === 'days') return;
      var sc = s.frac + (u.n > 1 ? 0.001 : -0.5);   // a counting goal with progress beats a yes/no goal
      if (!best || sc > best.sc) best = { ch: u.ch, sc: sc, s: s };
    });
    return best ? best.ch : -1;
  };
  /* rewarded-ad unlock (pick screen): 3 finished ads open one player; at most 5 counted ads per local day.
     Only players whose goal is visible (not secret, not chained) and still locked. Save: d.ads = { day, n, ch: { id: ads so far } } */
  MT.AD_NEED = 3; MT.AD_DAY = 5;
  function ads(d, dt) {
    var a = d.ads; if (!a || typeof a !== 'object') a = d.ads = { day: '', n: 0, ch: {} };
    if (!a.ch || typeof a.ch !== 'object') a.ch = {};
    var t = dayKey(dt); if (a.day !== t) { a.day = t; a.n = 0; }
    return a;
  }
  MT.adCan = function (d, ch) { var s = MT.status(d, ch); return !!(s && !s.open && s.shown && ch < G.NROSTER); };
  MT.adLeft = function (d, dt) { return Math.max(0, MT.AD_DAY - ads(d, dt).n); };
  MT.adCount = function (d, ch) { var v = d.ads && d.ads.ch ? d.ads.ch[ch] : 0; return typeof v === 'number' && v > 0 ? Math.min(MT.AD_NEED - 1, v | 0) : 0; };
  // one finished rewarded ad for `ch`. Returns the events (a 'char' event when this was the third ad), or null when not allowed.
  MT.adWatched = function (d, ch, dt) {
    if (!MT.adCan(d, ch) || MT.adLeft(d, dt) <= 0) return null;
    var a = ads(d, dt), ev = [], c = MT.adCount(d, ch) + 1; a.n++;
    if (c >= MT.AD_NEED) { delete a.ch[ch]; d.unl.push(ch); ev.push({ k: 'char', ch: ch, why: 'ad' }); MT.check(d, ev, 'ad'); }
    else a.ch[ch] = c;
    return ev;
  };
  MT.secretCode = function (d) { var ev = []; if (!ach(d).code) { d.ach.code = 1; MT.check(d, ev, 'code'); } return ev; };
  // cosmetic hats: id -> how it is earned
  MT.HATS = [
    { id: 'star', how: 'lvl', v: 3 }, { id: 'flower', how: 'streak', v: 3 }, { id: 'wizard', how: 'lvl', v: 5 },
    { id: 'pirate', how: 'wins', v: 10 }, { id: 'viking', how: 'streak', v: 7 }, { id: 'goldcrown', how: 'champ', v: 5 }
  ];
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
    if (d.login.last === t) return MT.check(d, ev, 'boot');   // same day: only goals already met (e.g. an older save) open
    var first = !d.login.last;
    if (last !== null && now - last === 1) d.login.streak++; else d.login.streak = 1;
    d.login.last = t; d.login.days++; d.login.best = Math.max(d.login.best, d.login.streak);
    if (!first) {
      var bonus = 25 * Math.min(7, d.login.streak); d.xp += bonus;
      ev.push({ k: 'streak', n: d.login.streak, xp: bonus });
      hatCheck(d, ev);
    }
    MT.check(d, ev, 'days');   // the one login-based player (3 days)
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
  // st: { won, draw, lvl, firstBeat, hit, cat, sp, spKO, leftMax, flaw, n, guide, outs, hurt, rev, ban, flipAir, airCat, mpCatch, passBest, chars }
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
    // lifetime counters + best-in-a-match records for the player goals, then unlock what is met
    var A = ach(d);
    A.hit += st.hit | 0; A.cat += st.cat | 0; A.sp += st.sp | 0; A.rev += st.rev | 0; A.ban += st.ban | 0;
    if (!st.guide) {   // one-match feats don't count in the guided first match (its rivals are too weak)
      A.outsBest = Math.max(A.outsBest, st.outs | 0); A.spBest = Math.max(A.spBest, st.sp | 0); A.passBest = Math.max(A.passBest, st.passBest | 0);
      A.flipAir += st.flipAir | 0; A.airCat += st.airCat | 0;
      if (st.won) { if (!st.hurt) A.noHit++; if (st.n === 7) A.w7++; if (st.mpCatch) A.mpCatch++; if ((st.chars || []).indexOf(15) >= 0) A.hulkWin++; }
    }
    MT.check(d, ev, 'match');
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
  // the login player still to come? -> days left (for the "tomorrow" teaser), else 0
  MT.daysToGift = function (d) { var u = MT.uOf(10); return u && d.unl.indexOf(10) < 0 ? Math.max(0, u.n - d.login.days) : 0; };
})();
