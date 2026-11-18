// CrazyGames HTML5 SDK v3 wrapper (docs.crazygames.com/sdk/intro).
// Everything is try/catch-wrapped and time-limited: the game runs the same with no SDK at all.
// - The SDK script is loaded only off local/own hosts (or with ?sdk=1 to test the SDK's 'local' overlay ads).
// - Real ads only when SDK.environment is 'crazygames' (or 'local' when forced with ?sdk=1).
// - No SDK / 'disabled' -> the old fake rewarded ad (1.2 s overlay) so the game still works on other hosts.
// - Audio: muted while an ad plays and whenever the CrazyGames "muteAudio" setting is on (it beats the in-game toggle).
import { audio } from './audio.js';

const SDK_URL = 'https://sdk.crazygames.com/crazygames-sdk-v3.js';
const MID_GAP = 180000;   // midgame ads at most every ~3 min (counting rewarded ads too)
const Q = (() => { try { return new URLSearchParams(location.search); } catch (e) { return new URLSearchParams(); } })();

let C = null;            // window.CrazyGames.SDK once init() resolved and environment != 'disabled'
let env = 'none', real = false, playing = false, loading = false, busy = false;
let rwOff = false;   // real rewarded ads failed once / adblock / ads disabled -> hide rewarded buttons for the session
let adMute = false, cgMute = false, lastAd = Date.now();
const applyMute = () => { try { audio.setExternalMute(adMute || cgMute); } catch (e) { } };
const safe = fn => { try { const r = fn(); if (r && typeof r.catch === 'function') r.catch(() => { }); return r; } catch (e) { return undefined; } };

function wantSdk() {
  if (Q.get('sdk') === '1') return true;
  const h = location.hostname;
  return !(h === '' || h === 'localhost' || /^127\./.test(h) || /^192\.168\./.test(h) || /^10\./.test(h) || /(^|\.)ledeuxions\.com$/.test(h));
}

function loadScript() {
  return new Promise(res => {
    try {
      const s = document.createElement('script');
      s.src = SDK_URL; s.async = true;
      s.onload = () => res(true); s.onerror = () => res(false);
      document.head.appendChild(s);
    } catch (e) { res(false); }
  });
}

// fake rewarded ad (no SDK): short overlay, always rewards
function simulateAd() {
  return new Promise(resolve => {
    let box = null;
    try {
      box = document.createElement('div');
      box.style.cssText = 'position:fixed;inset:0;z-index:50;display:flex;align-items:center;justify-content:center;flex-direction:column;background:rgba(0,0,0,.82);color:#fff;font:800 22px system-ui,sans-serif;gap:10px';
      box.innerHTML = '<div style="font-size:46px">▶</div><div>AD (test)</div>';
      document.body.appendChild(box);
    } catch (e) { box = null; }
    adMute = true; applyMute();
    setTimeout(() => { try { box && box.remove(); } catch (e) { } adMute = false; applyMute(); resolve(true); }, 1200);
  });
}

// one real ad request -> resolves 'done' | 'fail'. Exactly one resolve; audio muted only while the ad is on screen.
function realAd(type) {
  return new Promise(resolve => {
    let fired = false, started = false, t1 = 0, t2 = 0;
    const end = r => {
      if (fired) return; fired = true; clearTimeout(t1); clearTimeout(t2);
      adMute = false; applyMute(); if (started) lastAd = Date.now(); resolve(r);
    };
    try {
      const p = C.ad.requestAd(type, {
        adStarted: () => { started = true; clearTimeout(t1); adMute = true; applyMute(); t2 = setTimeout(() => end('fail'), 120000); },
        adFinished: () => end('done'),
        adError: () => end('fail'),
      });
      if (p && typeof p.catch === 'function') p.catch(() => end('fail'));
      t1 = setTimeout(() => { if (!started) end('fail'); }, type === 'rewarded' ? 8000 : 3000);
    } catch (e) { end('fail'); }
  });
}

export const sdk = {
  get env() { return env; },
  get realAds() { return real; },
  // rewarded buttons are shown only while this is true (fake ad off-CrazyGames always counts as available)
  get rewardedOk() { return real && !rwOff; },   // site copy: no fake ads off-CrazyGames
  async init() {
    if (!wantSdk()) return;
    try {
      const ok = await Promise.race([loadScript(), new Promise(r => setTimeout(() => r(false), 6000))]);
      const S = ok && window.CrazyGames && window.CrazyGames.SDK;
      if (!S) return;
      await Promise.race([Promise.resolve(S.init()), new Promise((_, rej) => setTimeout(() => rej(new Error('init timeout')), 6000))]);
      env = S.environment || 'unknown';
      if (env === 'disabled') return;
      C = S;
      if (loading) safe(() => C.game.loadingStart());
      real = env === 'crazygames' || (env === 'local' && Q.get('sdk') === '1');
      if (real) safe(() => C.ad.hasAdblock().then(b => { if (b) rwOff = true; }));
      safe(() => {
        const st = C.game.settings; cgMute = !!(st && st.muteAudio); applyMute();
        C.game.addSettingsChangeListener(n => { cgMute = !!(n && n.muteAudio); applyMute(); });
      });
    } catch (e) { C = null; real = false; }
  },
  // loadingStart may come before init() finished: it is reported to the SDK as soon as init resolves
  loadingStart() { if (loading) return; loading = true; if (C) safe(() => C.game.loadingStart()); },
  loadingStop() { if (!loading) return; loading = false; if (C) safe(() => C.game.loadingStop()); },
  gameplayStart() { if (playing) return; playing = true; if (C) safe(() => C.game.gameplayStart()); },
  gameplayStop() { if (!playing) return; playing = false; if (C) safe(() => C.game.gameplayStop()); },
  happytime() { if (C) safe(() => C.game.happytime()); },   // cup wins only (docs: use sparingly)
  // midgame ad between races only. cb() is always called exactly once, ad or not.
  midgame(cb) {
    let done = false; const go = () => { if (!done) { done = true; try { cb && cb(); } catch (e) { console.error(e); } } };
    if (!real || busy || Date.now() - lastAd < MID_GAP) return go();
    busy = true;
    realAd('midgame').then(() => { busy = false; go(); });
  },
  // rewarded ad: resolves true ONLY when the ad finished (or the fake ad ran when there is no SDK)
  rewarded() {
    if (busy) return Promise.resolve(false);
    busy = true;
    if (rwOff) { busy = false; return Promise.resolve(false); }
    const p = real ? realAd('rewarded').then(r => { if (r !== 'done') rwOff = true; return r === 'done'; }) : simulateAd();
    return p.finally(() => { busy = false; });
  },
};
