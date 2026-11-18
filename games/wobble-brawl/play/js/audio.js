/* WebAudio: synthesized SFX + sequenced chiptune BGM. No audio files. */
(function () {
  'use strict';
  var G = window.G;
  var A = G.audio = { ctx: null, music: true, sfxOn: true, adMute: false, extMute: false, demo: false, intensity: 0 };
  var master, mGain, sGain, noiseBuf, nextT = 0, step = 0, started = false;

  A.unlock = function () {
    if (A.ctx) { if (A.ctx.state === 'suspended' && !document.hidden) A.ctx.resume().catch(function () { }); return; }
    try {
      var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
      var c = A.ctx = new AC();
      var comp = c.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 6;
      master = c.createGain(); master.connect(comp); comp.connect(c.destination);
      mGain = c.createGain(); mGain.gain.value = 0.34; mGain.connect(master);
      sGain = c.createGain(); sGain.gain.value = 0.8; sGain.connect(master);
      noiseBuf = c.createBuffer(1, c.sampleRate, c.sampleRate);
      var d = noiseBuf.getChannelData(0); for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      started = true; nextT = c.currentTime + 0.08; applyMute();
    } catch (e) { A.ctx = null; }
  };
  function applyMute() {
    if (!master) return;
    var m = (A.adMute || A.extMute) ? 0 : 1;
    master.gain.setTargetAtTime(m, A.ctx.currentTime, 0.03);
  }
  A.setAdMute = function (v) { A.adMute = v; applyMute(); };
  A.setExternalMute = function (v) { A.extMute = v; applyMute(); };
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
  }
  function noise(dur, vol, freq, ftype, delay, dest, f1) {
    var c = A.ctx, t = c.currentTime + (delay || 0);
    var s = c.createBufferSource(); s.buffer = noiseBuf; s.loop = true;
    var f = c.createBiquadFilter(); f.type = ftype || 'lowpass'; f.frequency.setValueAtTime(freq, t);
    if (f1) f.frequency.exponentialRampToValueAtTime(f1, t + dur);
    var g = c.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(dest || sGain); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.03);
  }
  var SFX = {
    punch: function () { noise(0.07, 0.6, 1700, 'bandpass'); tone(170, 0.09, 'sine', 0.7, 60); },
    kick: function () { noise(0.1, 0.7, 900, 'lowpass'); tone(130, 0.15, 'sine', 0.9, 40); },
    heavy: function () { noise(0.2, 0.9, 700, 'lowpass'); tone(95, 0.28, 'sine', 1, 30); tone(320, 0.12, 'square', 0.22, 80); },
    whoosh: function () { noise(0.13, 0.16, 900, 'bandpass', 0, null, 3600); },
    jump: function () { tone(300, 0.12, 'square', 0.1, 640); },
    djump: function () { tone(460, 0.12, 'square', 0.1, 940); },
    land: function () { noise(0.05, 0.22, 420, 'lowpass'); },
    boing: function () { tone(170, 0.26, 'sine', 0.4, 540); tone(340, 0.26, 'triangle', 0.14, 1080); },
    squeak: function () { tone(900, 0.07, 'square', 0.2, 1500); tone(1500, 0.11, 'square', 0.18, 700, 0.07); noise(0.12, 0.6, 800, 'lowpass'); tone(110, 0.2, 'sine', 0.8, 40); },
    noodle: function () { tone(230, 0.1, 'triangle', 0.5, 130); noise(0.06, 0.4, 2600, 'bandpass'); },
    clang: function () { tone(820, 0.3, 'triangle', 0.3); tone(1236, 0.24, 'sine', 0.2); noise(0.04, 0.3, 4000, 'highpass'); },
    pickup: function () { tone(660, 0.07, 'square', 0.13); tone(990, 0.12, 'square', 0.13, 0, 0.07); },
    pop: function () {
      noise(0.16, 1, 1800, 'lowpass'); tone(140, 0.2, 'sine', 0.9, 40);
      for (var i = 0; i < 7; i++) noise(0.03, 0.45, 3000 + Math.random() * 3000, 'bandpass', 0.08 + i * 0.045 + Math.random() * 0.02);
    },
    grab: function () { noise(0.05, 0.35, 1300, 'bandpass'); tone(240, 0.06, 'square', 0.12, 330); },
    throw: function () { noise(0.22, 0.3, 600, 'bandpass', 0, null, 3200); tone(220, 0.18, 'sine', 0.25, 520); },
    ko: function () { tone(120, 0.7, 'sawtooth', 0.4, 36); noise(0.5, 0.7, 500, 'lowpass'); tone(660, 0.9, 'sine', 0.22); tone(990, 0.9, 'sine', 0.12); },
    out: function () { tone(1000, 0.55, 'sine', 0.25, 180); },
    beep: function () { tone(520, 0.1, 'square', 0.16); },
    go: function () { tone(1040, 0.3, 'square', 0.18); tone(1560, 0.3, 'square', 0.1); },
    coin: function () { tone(1320, 0.06, 'square', 0.12); tone(1760, 0.16, 'square', 0.12, 0, 0.06); },
    click: function () { tone(700, 0.04, 'square', 0.1, 900); },
    deny: function () { tone(200, 0.12, 'square', 0.12, 140); },
    win: function () { var n = [523, 659, 784, 1047, 1319]; for (var i = 0; i < n.length; i++) tone(n[i], 0.18, 'square', 0.16, 0, i * 0.09); },
    lose: function () { var n = [440, 392, 330, 262]; for (var i = 0; i < n.length; i++) tone(n[i], 0.22, 'triangle', 0.22, 0, i * 0.14); },
    break: function () { noise(0.1, 0.4, 2500, 'highpass'); tone(500, 0.08, 'square', 0.1, 200); },
    spawn: function () { tone(880, 0.08, 'sine', 0.12, 1320); }
  };
  var lastPlay = {};
  A.sfx = function (name, force) {
    if (!A.ctx || !A.sfxOn || !started || (A.demo && !force) || A.ctx.state !== 'running') return;
    var now = A.ctx.currentTime; if (lastPlay[name] && now - lastPlay[name] < 0.035) return; lastPlay[name] = now;
    try { SFX[name](); } catch (e) { }
  };

  /* ---------- music: 8-bar loop, 16th-note steps ---------- */
  var BPM = 138, SPB = 60 / BPM / 4;
  var roots = [45, 41, 48, 43, 45, 41, 43, 43];
  var chords = [[57, 60, 64], [53, 57, 60], [55, 60, 64], [55, 59, 62], [57, 60, 64], [53, 57, 60], [55, 59, 62], [55, 59, 62]];
  var _ = 0;
  var lead = [
    [69, _, 72, _, 76, _, 72, 69, _, _, 72, _, 74, 72, _, _],
    [69, _, 72, _, 77, _, 76, 72, _, _, _, _, 69, _, 72, _],
    [76, _, 79, _, 76, _, 72, _, 74, _, 76, _, _, _, _, _],
    [74, _, 74, 71, _, 74, _, 79, _, _, 74, _, 71, _, 67, _],
    [81, _, _, 79, _, 76, _, _, 72, _, 76, _, 79, _, 76, _],
    [77, _, _, 76, _, 72, _, _, 69, _, 72, _, 77, _, 81, _],
    [79, _, 74, _, 79, _, 83, _, 81, _, 79, _, 74, _, 71, _],
    [74, _, _, _, 71, _, 74, _, 79, 79, _, 79, _, 83, 86, _]
  ];
  var bassPat = [1, 0, 0, 1, 0, 0, 2, 0, 1, 0, 0, 1, 0, 0, 3, 0];
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
  /* called every frame; schedules notes slightly ahead */
  A.tick = function () {
    var c = A.ctx; if (!c || !started || c.state !== 'running') return;
    if (!A.music) { nextT = 0; return; }
    if (nextT < c.currentTime - 0.2 || nextT === 0) nextT = c.currentTime + 0.05;
    var full = A.intensity > 0;
    while (nextT < c.currentTime + 0.14) {
      var bar = (step >> 4) & 7, s = step & 15, t = nextT;
      var b = bassPat[s];
      if (b) mnote(roots[bar] + (b === 2 ? 12 : b === 3 ? 7 : 0), t, SPB * 1.7, 'triangle', 0.5);
      if (s % 4 === 2) { var ch = chords[bar]; mnote(ch[(step >> 2) % 3] + 12, t, SPB * 1.2, 'square', 0.05); }
      if (full) {
        var n = lead[bar][s]; if (n) mnote(n, t, SPB * 1.8, 'square', 0.085);
        if (s % 8 === 0) mdrum(0, t);
        if (s % 8 === 4) mdrum(1, t);
        if (s % 2 === 0) mdrum(2, t);
      } else {
        if (s === 0 || s === 10) mdrum(0, t);
        if (s % 4 === 2) mdrum(2, t);
        var n2 = lead[bar][s]; if (n2 && (bar & 2)) mnote(n2 - 12, t, SPB * 1.8, 'triangle', 0.12);
      }
      nextT += SPB; step++;
    }
  };
})();
