/* CrazyGames SDK v3 wrapper + save (SDK data module, localStorage fallback). Pattern from Wobble Brawl v1.6 (sdk.js).
   Everything is wrapped: the game runs the same with no SDK at all (own site, local tests). */
(function () {
  'use strict';
  var G = window.G, sdk = null;
  var S = G.sdk = { ok: false, env: 'none', adsOk: false, adPending: false, adPlaying: false, playing: false, loading: false, onReady: null, onLateAd: null, log: [] };
  function safe(fn) { try { var r = fn(); if (r && typeof r.catch === 'function') r.catch(function () { }); return r; } catch (e) { return undefined; } }
  function lg(s) { S.log.push(s); if (S.log.length > 200) S.log.shift(); }

  // load the SDK only where it can work: not on our own site or a local test server (unless ?sdk=1)
  function wantSdk() {
    if (/[?&]sdk=1/.test(location.search)) return true;
    var h = location.hostname;
    return !(h === '' || h === 'localhost' || /^127\./.test(h) || /^192\.168\./.test(h) || /(^|\.)ledeuxions\.com$/.test(h));
  }
  S.init = function () {
    return new Promise(function (res) {
      var done = false; function fin() { if (!done) { done = true; res(); } }
      if (!wantSdk()) return fin();
      setTimeout(fin, 4000);
      var s = document.createElement('script');
      s.src = 'https://sdk.crazygames.com/crazygames-sdk-v3.js'; s.async = true;
      s.onload = function () {
        try {
          var C = window.CrazyGames && window.CrazyGames.SDK;
          if (!C) return fin();
          Promise.resolve(C.init()).then(function () {
            sdk = C; S.env = C.environment || 'unknown';
            S.ok = S.env !== 'disabled';
            S.adsOk = S.ok && !!(sdk.ad && typeof sdk.ad.requestAd === 'function');
            if (S.adsOk) safe(function () { var h = sdk.ad.hasAdblock && sdk.ad.hasAdblock(); if (h && typeof h.then === 'function') h.then(function (b) { if (b) S.adsOk = false; }).catch(function () { }); });
            if (S.ok) safe(function () {
              var st = sdk.game.settings; if (st && st.muteAudio) G.audio.setExternalMute(true);
              sdk.game.addSettingsChangeListener(function (n) { G.audio.setExternalMute(!!(n && n.muteAudio)); });
            });
            lg('init:' + S.env);
            if (S.onReady) { try { S.onReady(); } catch (e) { } }
            fin();
          }).catch(fin);
        } catch (e) { fin(); }
      };
      s.onerror = fin;
      document.head.appendChild(s);
    });
  };
  S.loadingStart = function () { if (S.ok && !S.loading) { S.loading = true; lg('loadingStart'); safe(function () { return sdk.game.loadingStart(); }); } };
  S.loadingStop = function () { if (S.ok && S.loading) { S.loading = false; lg('loadingStop'); safe(function () { return sdk.game.loadingStop(); }); } };
  S.gameplayStart = function () { if (S.playing) return; S.playing = true; if (S.ok) { lg('gameplayStart'); safe(function () { return sdk.game.gameplayStart(); }); } };
  S.gameplayStop = function () { if (!S.playing) return; S.playing = false; if (S.ok) { lg('gameplayStop'); safe(function () { return sdk.game.gameplayStop(); }); } };
  // the first match can begin before init resolves: report it once the SDK is there
  S.syncPlaying = function () { if (S.ok && S.playing) { lg('gameplayStart'); safe(function () { return sdk.game.gameplayStart(); }); } };
  S.happytime = function () { if (S.ok) { lg('happytime'); safe(function () { return sdk.game.happytime(); }); } };
  S.inviteLink = function (params) { if (!S.ok) return null; var r = safe(function () { return sdk.game.inviteLink(params); }); return typeof r === 'string' ? r : null; };
  S.inviteParam = function (k) { if (!S.ok) return null; var r = safe(function () { return sdk.game.getInviteParam(k); }); return r == null ? null : String(r); };
  S.instantMp = function () { return S.ok && !!safe(function () { return sdk.game.isInstantMultiplayer; }); };

  /* midgame ad. One request always ends with exactly one cb(); the game is only held while an ad is on screen;
     nothing starts within 3 s = give up. Two failures in a row = stop asking this session (Basic Launch has no ads). */
  var midFails = 0;
  S.midgame = function (cb) {
    if (!S.ok || !S.adsOk || midFails >= 2) { cb('skip'); return; }
    if (S.adPending) { cb('busy'); return; }
    S.adPending = true; lg('midgame');
    var fired = false, started = false, t1 = 0, t2 = 0;
    function end(r) {
      if (fired) return; fired = true; clearTimeout(t1); clearTimeout(t2);
      S.adPending = false; S.adPlaying = false; G.audio.setAdMute(false);
      if (r === 'fail') midFails++; else midFails = 0;
      lg('ad:' + r); try { cb(r); } catch (e) { }
    }
    try {
      var p = sdk.ad.requestAd('midgame', {
        adStarted: function () {
          started = true; clearTimeout(t1); S.adPlaying = true; G.audio.setAdMute(true);
          if (fired && S.onLateAd) { try { S.onLateAd(); } catch (e) { } }
          clearTimeout(t2); t2 = setTimeout(function () { if (fired) { S.adPlaying = false; G.audio.setAdMute(false); } else end('fail'); }, 90000);
        },
        adFinished: function () { if (fired) { clearTimeout(t2); S.adPlaying = false; G.audio.setAdMute(false); } else end('done'); },
        adError: function () { if (fired) { clearTimeout(t2); S.adPlaying = false; G.audio.setAdMute(false); } else end('fail'); }
      });
      if (p && typeof p.catch === 'function') p.catch(function () { end('fail'); });
      t1 = setTimeout(function () { if (!started) end('fail'); }, 3000);
    } catch (e) { end('fail'); }
  };

  /* rewarded ad (pick screen "watch ads to unlock"). Only on an explicit click, never while a match is being played.
     cb('done') ONLY on adFinished; adError / no fill / nothing within 8 s / a rejected promise -> cb('fail'); no SDK -> cb('skip').
     The game is already stopped on the pick screen; audio is muted while the ad is on screen. Exactly one cb() per request. */
  S.lastAdT = 0;
  S.rewardedOk = function () { return S.ok && S.adsOk; };
  S.rewarded = function (cb) {
    if (!S.rewardedOk()) { cb('skip'); return; }
    if (S.adPending || S.playing) { cb('busy'); return; }
    S.adPending = true; lg('rewarded');
    var fired = false, t1 = 0, t2 = 0;
    function end(r) {
      if (fired) return; fired = true; clearTimeout(t1); clearTimeout(t2);
      S.adPending = false; S.adPlaying = false; G.audio.setAdMute(false); S.lastAdT = performance.now();
      lg('rw:' + r); try { cb(r); } catch (e) { }
    }
    try {
      var p = sdk.ad.requestAd('rewarded', {
        adStarted: function () {
          if (fired) return; clearTimeout(t1); S.adPlaying = true; G.audio.setAdMute(true);
          t2 = setTimeout(function () { end('fail'); }, 120000);
        },
        adFinished: function () { end('done'); },
        adError: function () { end('fail'); }
      });
      if (p && typeof p.catch === 'function') p.catch(function () { end('fail'); });
      t1 = setTimeout(function () { if (!S.adPlaying) end('fail'); }, 8000);
    } catch (e) { end('fail'); }
  };

  /* ---------- save ---------- */
  var KEY = 'wobbledodge_v1';   // same key the site version already used: old saves keep working
  function defaults() {
    return { rev: 0, beaten: 0, mute: false, lang: '', played: 0, n: 5, easy: false, keys: null, picks: [],
      firstDone: 0, wins: 0, losses: 0, xp: 0, unl: [0, 3, 5, 7, 24], hats: [], hat: '', gifts: 0,
      login: { last: '', streak: 0, best: 0, days: 0 }, daily: { date: '', done: false }, dailyN: 0, seen: { lvl: 1 },
      lite: 0, rec: { cat: 0, hit: 0, streak: 0, cur: 0 },
      sto: { seen: '', fails: 0, sf: 0, badge: 0, sc: 0, end: 0, season: 0, dl: 0, train: 0 }, free: { n: 3, lvl: 0 },   // story: comics seen (',id,'), 1 vs 1 losses, SUPER CATCH owned, ending seen, title-defence season + match, trainings done
      ach: { hit: 0, cat: 0, sp: 0, rev: 0, ban: 0, outsBest: 0, spBest: 0, noHit: 0, w7: 0, flipAir: 0, mpCatch: 0, hulkWin: 0, airCat: 0, passBest: 0, code: 0 },
      ads: { day: '', n: 0, ch: {} } };   // ads = rewarded-ad unlock progress (meta.js MT.adWatched): local day, ads counted that day, { player: ads so far }; ach = goal counters for player unlocks (meta.js MT.UNLOCKS)
  }
  G.saveDefaults = defaults;
  function parse(str) { try { var o = JSON.parse(str); return (o && typeof o === 'object' && !Array.isArray(o)) ? o : null; } catch (e) { return null; } }
  // a damaged or hand-edited save must never stop the game: each field is checked against the type of its default
  function merge(o) {
    var d = defaults(), z = defaults(), k;
    if (!o) return d;
    var old = o.unl === undefined && (o.played > 0 || o.beaten > 0);   // a save from the site version (before progression)
    for (k in d) {
      var v = o[k], t = z[k];
      if (v === undefined || v === null) continue;
      if (t === null) { d[k] = v; continue; }
      if (Array.isArray(t)) { if (Array.isArray(v)) d[k] = v.filter(function (x) { return typeof x === typeof (t[0] === undefined ? (k === 'picks' ? 0 : '') : t[0]); }); }
      else if (typeof t === 'number') { if (typeof v === 'number' && isFinite(v)) d[k] = v; }
      else if (typeof t === 'object') { if (typeof v === 'object' && !Array.isArray(v)) { for (var k2 in t) if (typeof v[k2] === typeof t[k2]) d[k][k2] = v[k2]; } }
      else if (typeof v === typeof t) d[k] = v;
    }
    if (old) { d.firstDone = 1; if (typeof o.n === 'number') d.n = o.n; }
    [0, 3, 5, 7, 24].forEach(function (c) { if (d.unl.indexOf(c) < 0) d.unl.push(c); });
    d.unl = d.unl.filter(function (c, i, a) { return c >= 0 && c < G.NROSTER && (c | 0) === c && a.indexOf(c) === i; });
    d.beaten = Math.max(0, Math.min(10, d.beaten | 0)); d.xp = Math.max(0, Math.floor(d.xp));
    if (G.TEAM_SIZES && G.TEAM_SIZES.indexOf(d.n) < 0) d.n = 5;
    var ac = {}, a0 = d.ads.ch; if (a0 && typeof a0 === 'object') for (var c in a0) { var cn = +c, v = a0[c]; if ((cn | 0) === cn && cn >= 0 && cn < 24 && typeof v === 'number' && v >= 1) ac[cn] = Math.min(2, v | 0); }
    d.ads.ch = ac; d.ads.n = Math.max(0, d.ads.n | 0);
    // older saves (daily-gift / win-count unlocks): every player already unlocked stays unlocked; goal counters start at 0
    // except what the save already knows (wins, ladder, days, best catches/hits in a match)
    if (o.ach === undefined) { d.ach.cat = Math.max(d.ach.cat, d.rec.cat); d.ach.hit = Math.max(d.ach.hit, d.rec.hit); }
    return d;
  }
  G.mergeSave = merge;
  var Save = G.save = { data: defaults(), key: KEY };
  Save.loadLocal = function () { var s = null; try { s = localStorage.getItem(KEY); } catch (e) { } Save.data = merge(parse(s)); };
  // CrazyGames: the data module is the source of truth (it falls back to its own local storage for guests)
  Save.loadSdk = function () {
    if (!S.ok) return false;
    var s = safe(function () { return sdk.data.getItem(KEY); });
    var o = typeof s === 'string' ? parse(s) : null;
    if (o && (o.rev || 0) >= (Save.data.rev || 0)) { Save.data = merge(o); lg('load:sdk'); return true; }
    return false;
  };
  Save.commit = function () {
    Save.data.rev = (Save.data.rev || 0) + 1;
    var s = JSON.stringify(Save.data);
    try { localStorage.setItem(KEY, s); } catch (e) { }
    if (S.ok) safe(function () { return sdk.data.setItem(KEY, s); });
  };
})();
