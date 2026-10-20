/* WebAudio: synthesized SFX + small chiptune loop (tone/noise helpers from Wobble Brawl). No audio files. */
(function () {
  'use strict';
  var G = window.G;
  var A = G.audio = { ctx: null, muted: false, intensity: 0 };
  var master, mGain, sGain, crunch, noiseBuf, nextT = 0, step = 0, started = false;

  A.unlock = function () {
    if (A.ctx) { if (A.ctx.state === 'suspended' && !document.hidden) A.ctx.resume().catch(function () { }); return; }
    try {
      var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
      var c = A.ctx = new AC();
      var comp = c.createDynamicsCompressor(); comp.threshold.value = -12; comp.ratio.value = 5;
      master = c.createGain(); master.connect(comp); comp.connect(c.destination);
      mGain = c.createGain(); mGain.gain.value = 0.22; mGain.connect(master);
      sGain = c.createGain(); sGain.gain.value = 0.85; sGain.connect(master);
      // a little overdrive bus for crunchy hits
      crunch = c.createWaveShaper(); var cv = new Float32Array(512); for (var i = 0; i < 512; i++) { var x = i / 255.5 - 1; cv[i] = Math.tanh(x * 4.5); } crunch.curve = cv;
      var cg = c.createGain(); cg.gain.value = 0.55; crunch.connect(cg); cg.connect(master);
      noiseBuf = c.createBuffer(1, c.sampleRate, c.sampleRate);
      var d = noiseBuf.getChannelData(0); for (i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      started = true; nextT = c.currentTime + 0.08; applyMute();
    } catch (e) { A.ctx = null; }
  };
  // three reasons to be silent: the player's sound button, an ad on screen, the CrazyGames site mute setting
  function silent() { return A.muted || A.adMute || A.extMute; }
  A.silent = silent;
  function applyMute() { if (master) master.gain.setTargetAtTime(silent() ? 0 : 1, A.ctx.currentTime, 0.03); }
  A.setMute = function (v) { A.muted = v; applyMute(); };
  A.setAdMute = function (v) { A.adMute = !!v; applyMute(); };
  A.setExternalMute = function (v) { A.extMute = !!v; applyMute(); };
  A.suspend = function () { if (A.ctx && A.ctx.state === 'running') A.ctx.suspend().catch(function () { }); };
  A.resume = function () { if (A.ctx && A.ctx.state === 'suspended') { A.ctx.resume().catch(function () { }); nextT = 0; } };

  function tone(f0, dur, type, vol, f1, delay, dest) {
    var c = A.ctx, t = c.currentTime + (delay || 0);
    var o = c.createOscillator(), g = c.createGain();
    o.type = type || 'square'; o.frequency.setValueAtTime(f0, t);
    if (f1) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(dest || sGain); o.start(t); o.stop(t + dur + 0.03);
    return o;
  }
  function noise(dur, vol, freq, ftype, delay, dest, f1) {
    var c = A.ctx, t = c.currentTime + (delay || 0);
    var s = c.createBufferSource(); s.buffer = noiseBuf; s.loop = true;
    var f = c.createBiquadFilter(); f.type = ftype || 'lowpass'; f.frequency.setValueAtTime(freq, t);
    if (f1) f.frequency.exponentialRampToValueAtTime(f1, t + dur);
    var g = c.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(dest || sGain); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.03);
  }
  // tone with a vibrato LFO (ghost woo) or tremolo (toot)
  function wob(f0, dur, type, vol, f1, lfoF, depth, am, delay) {
    var c = A.ctx, t = c.currentTime + (delay || 0);
    var o = c.createOscillator(), g = c.createGain(), l = c.createOscillator(), lg = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t); if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    l.frequency.value = lfoF; lg.gain.value = depth; l.connect(lg);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    if (am) { var ag = c.createGain(); ag.gain.value = 0.5; lg.connect(ag.gain); o.connect(ag); ag.connect(g); } else { lg.connect(o.frequency); o.connect(g); }
    g.connect(sGain); o.start(t); l.start(t); o.stop(t + dur + 0.03); l.stop(t + dur + 0.03);
  }
  var SFX = {
    throw: function () { noise(0.2, 0.3, 700, 'bandpass', 0, null, 3400); tone(240, 0.14, 'sine', 0.25, 520); },
    pass: function () { noise(0.14, 0.16, 900, 'bandpass', 0, null, 2200); },
    /* the hit: crack + crunchy mid + body thump + sub drop. Big = longer, lower, with a slap echo */
    hit: function () { noise(0.05, 1, 3200, 'highpass', 0, crunch); tone(180, 0.12, 'square', 0.5, 70, 0, crunch); tone(120, 0.22, 'sine', 1, 38); noise(0.12, 0.7, 900, 'lowpass'); },
    bigHit: function () { noise(0.07, 1, 2600, 'highpass', 0, crunch); tone(150, 0.2, 'sawtooth', 0.55, 45, 0, crunch); tone(90, 0.45, 'sine', 1, 26); noise(0.35, 0.8, 700, 'lowpass', 0, null, 120); noise(0.05, 0.5, 2400, 'bandpass', 0.09); },
    catch: function () { noise(0.05, 0.7, 1500, 'bandpass', 0, crunch); tone(130, 0.12, 'sine', 0.8, 60); tone(660, 0.07, 'square', 0.13, 0, 0.05); tone(990, 0.12, 'square', 0.13, 0, 0.11); },
    faint: function () { tone(700, 0.5, 'triangle', 0.2, 160); },
    jump: function () { tone(300, 0.12, 'square', 0.1, 640); },
    land: function () { noise(0.05, 0.2, 420, 'lowpass'); },
    bounce: function () { tone(210, 0.08, 'sine', 0.35, 90); noise(0.03, 0.25, 1200, 'lowpass'); },
    dodge: function () { noise(0.16, 0.25, 1200, 'bandpass', 0, null, 4000); },
    whistle: function () { wob(2100, 0.45, 'sine', 0.22, 0, 38, 90); },
    whistle2: function () { wob(2100, 0.2, 'sine', 0.22, 0, 38, 90); wob(2100, 0.5, 'sine', 0.22, 0, 38, 90, false, 0.26); },
    crowd: function () { noise(0.9, 0.35, 900, 'bandpass', 0, null, 1500); noise(0.7, 0.18, 2200, 'bandpass', 0.05); wob(240, 0.6, 'sawtooth', 0.05, 300, 6, 18); wob(330, 0.6, 'sawtooth', 0.04, 410, 7, 20); },
    ready: function () { tone(784, 0.08, 'square', 0.13); tone(1047, 0.08, 'square', 0.13, 0, 0.07); tone(1568, 0.18, 'square', 0.13, 0, 0.14); },
    revive: function () { var n = [523, 784, 1047]; for (var i = 0; i < 3; i++) tone(n[i], 0.12, 'square', 0.12, 0, i * 0.07); },
    beep: function () { tone(520, 0.1, 'square', 0.16); },
    go: function () { tone(1040, 0.3, 'square', 0.18); tone(1560, 0.3, 'square', 0.1); },
    click: function () { tone(700, 0.04, 'square', 0.1, 900); },
    poof: function () { noise(0.18, 0.4, 1800, 'bandpass', 0, null, 500); },
    win: function () { var n = [523, 659, 784, 1047, 1319]; for (var i = 0; i < n.length; i++) tone(n[i], 0.18, 'square', 0.16, 0, i * 0.09); },
    lose: function () { var n = [440, 392, 330, 262]; for (var i = 0; i < n.length; i++) tone(n[i], 0.22, 'triangle', 0.22, 0, i * 0.14); },
    special: function () { noise(0.4, 0.5, 400, 'bandpass', 0, null, 5000); tone(220, 0.4, 'sawtooth', 0.18, 880); },
    /* specials */
    sp_banana: function () { tone(400, 0.25, 'sine', 0.35, 1300); tone(1300, 0.35, 'sine', 0.35, 450, 0.25); },
    sp_fart: function () { wob(95, 0.55, 'sawtooth', 0.5, 62, 26, 1, true); noise(0.5, 0.3, 300, 'lowpass'); },
    fartBoost: function () { wob(80, 0.35, 'sawtooth', 0.7, 50, 34, 1, true); noise(0.4, 0.8, 600, 'lowpass', 0, null, 150); noise(0.5, 0.3, 900, 'bandpass', 0.1, null, 4000); },
    sp_chicken: function () { tone(720, 0.09, 'square', 0.2, 520); tone(760, 0.09, 'square', 0.2, 520, 0.12); tone(980, 0.22, 'square', 0.2, 620, 0.25); },
    bawk: function () { tone(820, 0.08, 'square', 0.14, 560); },
    sp_giant: function () { tone(70, 0.7, 'sawtooth', 0.45, 140); noise(0.6, 0.5, 300, 'lowpass', 0, null, 900); },
    sp_clone: function () { var n = [880, 1109, 1319, 1760]; for (var i = 0; i < n.length; i++) tone(n[i], 0.25, 'sine', 0.16, 0, i * 0.05); },
    sp_slow: function () { tone(130, 0.9, 'triangle', 0.3, 100); },
    zoom: function () { noise(0.3, 0.7, 500, 'bandpass', 0, null, 6000); tone(300, 0.25, 'sawtooth', 0.2, 1800); },
    sp_boomer: function () { noise(1.2, 0.35, 500, 'bandpass', 0, null, 3500); wob(500, 1.1, 'triangle', 0.12, 700, 9, 150); },
    sp_zigzag: function () { for (var i = 0; i < 6; i++) tone(i % 2 ? 1400 : 900, 0.05, 'square', 0.12, 0, i * 0.08); },
    sp_ghost: function () { wob(520, 0.9, 'sine', 0.3, 380, 6, 40); },
    sp_flip: function () { tone(300, 0.55, 'sine', 0.3, 1500); noise(0.5, 0.3, 800, 'bandpass', 0.1, null, 3000); },
    sp_sneeze: function () { wob(420, 0.3, 'triangle', 0.25, 480, 5, 10); },
    ah2: function () { wob(520, 0.35, 'triangle', 0.28, 620, 5, 12); },
    achoo: function () { tone(700, 0.08, 'square', 0.25, 300); noise(0.4, 1, 3000, 'highpass', 0.04, null, 900); },
    sp_bouncy: function () { tone(170, 0.26, 'sine', 0.4, 540); tone(340, 0.26, 'triangle', 0.14, 1080); },
    boing: function () { tone(200, 0.16, 'sine', 0.35, 600); },
    sp_zap: function () { for (var i = 0; i < 4; i++) tone(1800 - i * 300, 0.05, 'sawtooth', 0.12, 2400, i * 0.06); noise(0.2, 0.3, 4000, 'highpass'); },
    zapStep: function () { tone(2200, 0.03, 'square', 0.06, 1400); },
    sp_sway: function () { wob(300, 0.9, 'triangle', 0.25, 220, 3, 60); },
    babam: function () { tone(392, 0.1, 'sawtooth', 0.2, 0, 0); tone(523, 0.1, 'sawtooth', 0.12, 0, 0); var n = [523, 659, 784, 1047]; for (var i = 0; i < 4; i++) tone(n[i], 0.55, i % 2 ? 'square' : 'sawtooth', 0.11, 0, 0.16); noise(0.5, 0.35, 5000, 'highpass', 0.16); tone(130, 0.35, 'sine', 0.5, 65, 0.16); },
    sp_fireball: function () { noise(0.6, 0.6, 400, 'lowpass', 0, null, 1600); tone(110, 0.5, 'sawtooth', 0.3, 220); }
  };
  var lastPlay = {};
  A.sfx = function (name) {
    if (!A.ctx || !started || A.ctx.state !== 'running' || silent() || !SFX[name]) return;
    var now = A.ctx.currentTime; if (lastPlay[name] && now - lastPlay[name] < 0.04) return; lastPlay[name] = now;
    try { SFX[name](); } catch (e) { }
  };
  A.buzz = function (ms) { if (silent()) return; try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) { } };
  G.sfx = A.sfx;

  /* ---------- music: 8-bar loop, 16th-note steps ---------- */
  var BPM = 144, SPB = 60 / BPM / 4, _ = 0;
  var roots = [48, 48, 53, 53, 50, 50, 55, 55];
  var lead = [
    [72, _, 76, _, 79, _, 76, _, 72, _, 74, 76, _, _, _, _], [77, _, 76, _, 74, _, 72, _, 74, _, _, _, 67, _, _, _],
    [77, _, 81, _, 84, _, 81, _, 77, _, 79, 81, _, _, _, _], [79, _, 77, _, 76, _, 74, _, 76, _, _, _, 72, _, _, _],
    [74, _, 77, _, 81, _, 77, _, 74, _, 76, 77, _, _, _, _], [79, _, 77, _, 76, _, 74, _, 72, _, _, _, 74, _, _, _],
    [79, _, 83, _, 86, _, 83, _, 79, _, 81, 83, _, _, _, _], [84, _, 83, _, 81, _, 79, _, 77, _, 76, _, 74, _, 71, _]
  ];
  var bassPat = [1, 0, 0, 2, 0, 0, 1, 0, 1, 0, 0, 2, 0, 1, 0, 0];
  function mf(n) { return 440 * Math.pow(2, (n - 69) / 12); }
  function mnote(n, t, dur, type, vol) {
    var c = A.ctx, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.value = mf(n);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(mGain); o.start(t); o.stop(t + dur + 0.02);
  }
  function mdrum(kind, t) {
    var c = A.ctx;
    if (kind === 0) { var o = c.createOscillator(), g = c.createGain(); o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.12); g.gain.setValueAtTime(0.9, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.16); o.connect(g); g.connect(mGain); o.start(t); o.stop(t + 0.18); return; }
    var s = c.createBufferSource(); s.buffer = noiseBuf; var f = c.createBiquadFilter(), g2 = c.createGain();
    if (kind === 1) { f.type = 'bandpass'; f.frequency.value = 1900; g2.gain.setValueAtTime(0.45, t); g2.gain.exponentialRampToValueAtTime(0.001, t + 0.11); }
    else { f.type = 'highpass'; f.frequency.value = 7000; g2.gain.setValueAtTime(0.13, t); g2.gain.exponentialRampToValueAtTime(0.001, t + 0.035); }
    s.connect(f); f.connect(g2); g2.connect(mGain); s.start(t, Math.random()); s.stop(t + 0.14);
  }
  A.tick = function () {
    var c = A.ctx; if (!c || !started || c.state !== 'running' || silent()) { nextT = 0; return; }
    if (nextT < c.currentTime - 0.2 || nextT === 0) nextT = c.currentTime + 0.05;
    var full = A.intensity > 0;
    while (nextT < c.currentTime + 0.14) {
      var bar = (step >> 4) & 7, s = step & 15, t = nextT, b = bassPat[s];
      if (b) mnote(roots[bar] - 12 + (b === 2 ? 12 : 0), t, SPB * 1.6, 'triangle', 0.5);
      if (full) { var n = lead[bar][s]; if (n) mnote(n, t, SPB * 1.7, 'square', 0.07); if (s % 8 === 0) mdrum(0, t); if (s % 8 === 4) mdrum(1, t); if (s % 2 === 0) mdrum(2, t); }
      else { if (s === 0 || s === 10) mdrum(0, t); if (s % 4 === 2) mdrum(2, t); var n2 = lead[bar][s]; if (n2 && (bar & 1)) mnote(n2 - 12, t, SPB * 1.8, 'triangle', 0.1); }
      nextT += SPB; step++;
    }
  };
})();
