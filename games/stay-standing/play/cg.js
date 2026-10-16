/* CrazyGames SDK v3 연결 + 저장 (SDK Data Module 우선, localStorage 폴백).
   SDK 가 없거나 실패해도 게임은 그대로 돈다 (모든 호출이 안전하게 감싸져 있음).
   저장: 게임은 원래처럼 localStorage 의 'qr…' 키들을 쓴다. CG.dirty() 가 그 키들을 한 덩어리로
   SDK data('gujo_save_v1')에 올리고, 첫 화면(허브)에서 CG.hydrate() 가 SDK 쪽이 더 새것이면 내려받는다. */
(function () {
  'use strict';
  var sdk = null, ext = false, listeners = [], readyCbs = [], isReady = false;
  var KEY = 'gujo_save_v1', REV = 'qr-save-rev';
  var ON_CG = /(^|\.)crazygames\.[a-z.]+$/i.test(location.hostname);
  var CG = window.CG = { ok: false, env: 'none', playing: false, loading: false, muted: false };
  function safe(fn) { try { var r = fn(); if (r && typeof r.catch === 'function') r.catch(function () {}); return r; } catch (e) { return undefined; } }
  function setMute(m) { m = !!m; if (m === CG.muted) return; CG.muted = m; listeners.forEach(function (f) { safe(function () { f(m); }); }); }
  CG.onMute = function (f) { listeners.push(f); if (CG.muted) safe(function () { f(true); }); };
  CG.onReady = function (f) { if (isReady) safe(f); else readyCbs.push(f); };

  var initP = null;
  CG.init = function (timeoutMs) {
    if (initP) return initP;
    initP = new Promise(function (res) {
      var done = false;
      function fin() { if (done) return; done = true; isReady = true; readyCbs.splice(0).forEach(function (f) { safe(f); }); res(CG.ok); }
      // ledeuxions.com 등 CrazyGames 밖에서는 SDK 를 아예 안 불러옴 (바깥 호출 0). 저장은 localStorage 만.
      if (!ON_CG) { fin(); return; }
      setTimeout(fin, timeoutMs || 3000);
      var s = document.createElement('script');
      s.src = 'https://sdk.crazygames.com/crazygames-sdk-v3.js'; s.async = true;
      s.onerror = fin;
      s.onload = function () {
        try {
          var C = window.CrazyGames && window.CrazyGames.SDK;
          if (!C) return fin();
          Promise.resolve(C.init()).then(function () {
            sdk = C; CG.env = C.environment || 'unknown'; CG.ok = CG.env !== 'disabled';
            if (CG.ok) safe(function () {
              var st = sdk.game.settings; if (st && st.muteAudio) setMute(true);
              sdk.game.addSettingsChangeListener(function (n) { setMute(!!(n && n.muteAudio)); });
            });
            if (CG.ok && wantLoading) { wantLoading = false; CG.loadingStart(); if (pageReady) CG.loadingStop(); }
            if (CG.ok && CG.playing) safe(function () { return sdk.game.gameplayStart(); }); // 시작이 SDK 준비보다 먼저였으면 지금 알림
            if (CG.ok && pendingSave) CG.flush();
            fin();
          }).catch(fin);
        } catch (e) { fin(); }
      };
      document.head.appendChild(s);
    });
    return initP;
  };

  // 로딩: 페이지가 뜨기 시작할 때 begin, 다 그리면 pageLoaded. SDK 가 늦게 준비돼도 짝이 맞게 보냄
  var wantLoading = false, pageReady = false;
  CG.loadingStart = function () {
    if (!CG.ok) { wantLoading = true; return; }
    if (CG.loading) return; CG.loading = true; safe(function () { return sdk.game.loadingStart(); });
  };
  CG.loadingStop = function () {
    pageReady = true;
    if (!CG.ok) { return; }
    if (!CG.loading) return; CG.loading = false; safe(function () { return sdk.game.loadingStop(); });
  };
  CG.gameplayStart = function () { if (CG.playing) return; CG.playing = true; if (CG.ok) safe(function () { return sdk.game.gameplayStart(); }); };
  CG.gameplayStop = function () { if (!CG.playing) return; CG.playing = false; if (CG.ok) safe(function () { return sdk.game.gameplayStop(); }); };
  CG.happytime = function () { if (CG.ok) safe(function () { return sdk.game.happytime(); }); };
  // 다른 페이지로 갈 때: 놀이 멈춤 알리고 저장 올린 뒤 이동
  CG.go = function (url) { CG.gameplayStop(); CG.flush(); location.href = url; };

  // ---------- 저장 ----------
  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function localKeys() { var out = []; try { for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (k && k.indexOf('qr') === 0 && k !== REV) out.push(k); } } catch (e) {} return out; }
  function snapshot() { var d = {}; localKeys().forEach(function (k) { var v = lsGet(k); if (v != null) d[k] = v; }); return d; }
  CG.hasLocalSave = function () { return localKeys().some(function (k) { return k === 'qr-progress' || k === 'qr-hub-clear' || k === 'qr-hub-last' || k.indexOf('qr3d:stars:') === 0; }); };
  var pendingSave = false, timer = 0;
  CG.flush = function () {
    clearTimeout(timer);
    if (!CG.ok || !sdk || !sdk.data) { pendingSave = true; return; }
    pendingSave = false;
    var rev = (+lsGet(REV) || 0) + 1; lsSet(REV, String(rev));
    var blob = JSON.stringify({ rev: rev, data: snapshot() });
    safe(function () { return sdk.data.setItem(KEY, blob); });
  };
  CG.dirty = function () { pendingSave = true; clearTimeout(timer); timer = setTimeout(CG.flush, 250); };
  // SDK 쪽 저장이 더 새것이면 localStorage 로 내려받음. 바뀌었으면 true
  CG.hydrate = function () {
    if (!CG.ok || !sdk || !sdk.data) return false;
    var s = safe(function () { return sdk.data.getItem(KEY); });
    if (typeof s !== 'string') return false;
    var o = null; try { o = JSON.parse(s); } catch (e) { return false; }
    if (!o || typeof o !== 'object' || !o.data || typeof o.data !== 'object' || Array.isArray(o.data)) return false;
    var rev = +o.rev || 0, mine = +lsGet(REV) || 0;
    if (rev <= mine && CG.hasLocalSave()) return false;
    Object.keys(o.data).forEach(function (k) { if (k.indexOf('qr') === 0 && typeof o.data[k] === 'string') lsSet(k, o.data[k]); });
    lsSet(REV, String(rev));
    return true;
  };
  addEventListener('pagehide', function () { if (pendingSave) CG.flush(); CG.gameplayStop(); });
})();
