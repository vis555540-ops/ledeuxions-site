/* CrazyGames SDK v3 wrapper + save (SDK data module with localStorage fallback).
   Everything is wrapped so the game runs identically with no SDK at all. */
(function () {
  'use strict';
  var G = window.G, sdk = null;
  var S = G.sdk = { ok: false, env: 'none', adPlaying: false, playing: false, loading: false };
  var KEY = 'wobblebrawl_save_v1';
  function safe(fn) { try { var r = fn(); if (r && typeof r.catch === 'function') r.catch(function () { }); return r; } catch (e) { return undefined; } }

  S.init = function () {
    // site copy: no CrazyGames SDK on our own site / local test -> no ads inside the game
    if (/(^|\.)ledeuxions\.com$|^localhost$|^127\.|^192\.168\./.test(location.hostname) || location.hostname === '') return Promise.resolve();
    return new Promise(function (res) {
      var done = false; function fin() { if (!done) { done = true; res(); } }
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
            if (S.ok) {
              safe(function () {
                var st = sdk.game.settings; if (st && st.muteAudio) G.audio.setExternalMute(true);
                sdk.game.addSettingsChangeListener(function (n) { G.audio.setExternalMute(!!(n && n.muteAudio)); });
              });
            }
            fin();
          }).catch(fin);
        } catch (e) { fin(); }
      };
      s.onerror = fin;
      document.head.appendChild(s);
    });
  };
  S.loadingStart = function () { if (S.ok && !S.loading) { S.loading = true; safe(function () { return sdk.game.loadingStart(); }); } };
  S.loadingStop = function () { if (S.ok && S.loading) { S.loading = false; safe(function () { return sdk.game.loadingStop(); }); } };
  S.gameplayStart = function () { if (S.playing) return; S.playing = true; if (S.ok) safe(function () { return sdk.game.gameplayStart(); }); };
  S.gameplayStop = function () { if (!S.playing) return; S.playing = false; if (S.ok) safe(function () { return sdk.game.gameplayStop(); }); };
  S.happytime = function () { if (S.ok) safe(function () { return sdk.game.happytime(); }); };
  S.canReward = function () { return S.ok; };

  function requestAd(type, cb) {
    if (!S.ok || S.adPlaying) { cb(false); return; }
    var fired = false;
    function end(okk) { if (fired) return; fired = true; S.adPlaying = false; G.audio.setAdMute(false); cb(okk); }
    try {
      S.adPlaying = true;
      sdk.ad.requestAd(type, {
        adStarted: function () { G.audio.setAdMute(true); },
        adFinished: function () { end(true); },
        adError: function () { end(false); }
      });
      setTimeout(function () { if (!fired && !G.audio.adMute) end(false); }, 8000); // never hang the flow if no callback arrives
    } catch (e) { end(false); }
  }
  /* midgame: only ever called between matches. Continues regardless of outcome. */
  S.midgame = function (cb) { requestAd('midgame', function () { cb(); }); };
  /* rewarded: cb(true) only when the ad was fully watched. */
  S.rewarded = function (cb) { requestAd('rewarded', cb); };

  /* ---------- save ---------- */
  function defaults() {
    return { rev: 0, coins: 0, skins: ['red', 'blue'], hats: ['none'], skin: 'red', hat: 'none', streak: 0, best: 0, wins: 0, played: 0,
      daily: { date: '', id: 0, prog: 0, done: false }, opts: { music: true, sfx: true, lang: '' }, lvl: 1, map: 'random', seenHint: 0 };
  }
  function parse(str) { try { var o = JSON.parse(str); return (o && typeof o === 'object') ? o : null; } catch (e) { return null; } }
  function merge(o) { var d = defaults(); if (!o) return d; for (var k in d) if (o[k] !== undefined && o[k] !== null) d[k] = o[k]; if (!d.opts) d.opts = defaults().opts; if (!d.daily) d.daily = defaults().daily; return d; }
  var Save = G.save = { data: defaults() };
  Save.loadLocal = function () { var s = null; try { s = localStorage.getItem(KEY); } catch (e) { } Save.data = merge(parse(s)); };
  Save.loadSdk = function () {
    if (!S.ok) return false;
    var s = safe(function () { return sdk.data.getItem(KEY); });
    var o = typeof s === 'string' ? parse(s) : null;
    if (o && (o.rev || 0) > (Save.data.rev || 0)) { Save.data = merge(o); return true; }
    return false;
  };
  Save.commit = function () {
    Save.data.rev = (Save.data.rev || 0) + 1;
    var s = JSON.stringify(Save.data);
    try { localStorage.setItem(KEY, s); } catch (e) { }
    if (S.ok) safe(function () { return sdk.data.setItem(KEY, s); });
  };
})();
