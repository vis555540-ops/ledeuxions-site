// sound.js — 소리는 전부 Web Audio 로 만든다 (음원 파일 없음).
(function (root) {
  'use strict';
  const S = { ctx: null, master: null, musicGain: null, noise: null, on: true, music: true, _seq: null };

  S.unlock = function () {
    if (!S.ctx) {
      try {
        const C = root.AudioContext || root.webkitAudioContext;
        if (!C) return;
        S.ctx = new C();
        S.master = S.ctx.createGain(); S.master.gain.value = 0.55;
        const comp = S.ctx.createDynamicsCompressor();
        S.master.connect(comp); comp.connect(S.ctx.destination);
        S.musicGain = S.ctx.createGain(); S.musicGain.gain.value = 0.0; S.musicGain.connect(S.master);
        const len = S.ctx.sampleRate * 1;
        S.noise = S.ctx.createBuffer(1, len, S.ctx.sampleRate);
        const d = S.noise.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      } catch (e) { S.ctx = null; return; }
    }
    if (S.ctx.state === 'suspended') S.ctx.resume();
  };

  function tone(f, dur, type, vol, when, slideTo, dest) {
    const c = S.ctx; if (!c) return;
    const t0 = c.currentTime + (when || 0);
    const o = c.createOscillator(), g = c.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(f, t0);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol || 0.2, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(dest || S.master);
    o.start(t0); o.stop(t0 + dur + 0.02);
  }
  function noise(dur, vol, fFrom, fTo, when, q, type) {
    const c = S.ctx; if (!c) return;
    const t0 = c.currentTime + (when || 0);
    const src = c.createBufferSource(); src.buffer = S.noise;
    const f = c.createBiquadFilter(); f.type = type || 'bandpass'; f.Q.value = q || 1.2;
    f.frequency.setValueAtTime(fFrom, t0);
    if (fTo) f.frequency.exponentialRampToValueAtTime(fTo, t0 + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + dur * 0.25);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(f); f.connect(g); g.connect(S.master);
    src.start(t0, Math.random() * 0.5); src.stop(t0 + dur + 0.02);
  }

  S.play = function (name, o) {
    if (!S.on || !S.ctx) return;
    o = o || {};
    switch (name) {
      case 'tap': tone(660, 0.07, 'triangle', 0.18); tone(990, 0.06, 'sine', 0.1, 0.03); break;
      case 'chomp': {
        const f = 220 + Math.random() * 60;
        tone(f, 0.07, 'square', 0.07, 0, f * 0.6);
        noise(0.05, 0.12, 1800, 900, 0, 2);
        break;
      }
      case 'conquer':
        [523, 659, 784].forEach((f, i) => tone(f, 0.16, 'triangle', 0.16, i * 0.06));
        tone(1046, 0.25, 'sine', 0.1, 0.18);
        break;
      case 'spread': tone(392, 0.12, 'sine', 0.08, 0, 520); break;
      case 'sugar': tone(1318, 0.06, 'sine', 0.08); tone(1760, 0.08, 'sine', 0.06, 0.04); break;
      case 'candy': [880, 1108, 1318, 1760].forEach((f, i) => tone(f, 0.09, 'triangle', 0.12, i * 0.045)); break;
      case 'warn': tone(880, 0.09, 'square', 0.06); tone(880, 0.09, 'square', 0.06, 0.16); break;
      case 'swish': noise(0.55, 0.22, 900, 4200, 0, 0.8); noise(0.4, 0.12, 3000, 6000, 0.12, 1.5); break;
      case 'floss': tone(1400, 0.25, 'sawtooth', 0.03, 0, 500); noise(0.25, 0.1, 5000, 2500, 0, 3); break;
      case 'clean': noise(0.12, 0.06, 5000, 7000, 0, 4, 'highpass'); break;
      case 'hit':
        tone(520, 0.35, 'square', 0.12, 0, 130);
        tone(260, 0.3, 'triangle', 0.14, 0.05, 90);
        noise(0.3, 0.15, 3000, 800, 0, 1);
        break;
      case 'upgrade': [392, 523, 659, 784, 1046].forEach((f, i) => tone(f, 0.12, 'triangle', 0.13, i * 0.05)); break;
      case 'deny': tone(196, 0.14, 'square', 0.07); break;
      case 'win':
        [523, 659, 784, 1046, 784, 1046, 1318].forEach((f, i) => tone(f, 0.22, 'triangle', 0.16, i * 0.11));
        break;
      case 'lose':
        [392, 349, 311, 262].forEach((f, i) => tone(f, 0.3, 'triangle', 0.14, i * 0.18));
        break;
      case 'bubble': tone(500 + Math.random() * 400, 0.08, 'sine', 0.05, 0, 1200); break;
    }
  };

  // 배경 음악: 짧고 통통 튀는 반복 (C 장조, 약 120bpm)
  const MEL = [72, 0, 76, 79, 76, 0, 74, 72, 69, 0, 72, 74, 76, 0, 72, 0,
               72, 0, 76, 79, 81, 79, 76, 74, 72, 74, 76, 74, 72, 0, 0, 0];
  const BASS = [48, 48, 55, 55, 45, 45, 52, 52, 41, 41, 48, 48, 43, 43, 50, 43];
  const mtof = n => 440 * Math.pow(2, (n - 69) / 12);
  S.startMusic = function (fast) {
    if (!S.ctx) return;
    S.stopMusic();
    const step = fast ? 0.115 : 0.13;
    let i = 0, next = S.ctx.currentTime + 0.1;
    S.musicGain.gain.cancelScheduledValues(S.ctx.currentTime);
    S.musicGain.gain.setTargetAtTime(S.music ? 0.32 : 0, S.ctx.currentTime, 0.3);
    S._seq = setInterval(() => {
      if (!S.ctx) return;
      while (next < S.ctx.currentTime + 0.25) {
        const when = next - S.ctx.currentTime;
        const m = MEL[i % 32];
        if (m) tone(mtof(m), step * 1.6, 'triangle', 0.09, when, 0, S.musicGain);
        if (i % 2 === 0) tone(mtof(BASS[(i >> 1) % 16]), step * 1.8, 'sine', 0.16, when, 0, S.musicGain);
        if (i % 4 === 2) {
          const c = S.ctx, t0 = c.currentTime + when;
          const src = c.createBufferSource(); src.buffer = S.noise;
          const f = c.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 7000;
          const g = c.createGain(); g.gain.setValueAtTime(0.05, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.05);
          src.connect(f); f.connect(g); g.connect(S.musicGain); src.start(t0); src.stop(t0 + 0.06);
        }
        next += step; i++;
      }
    }, 60);
  };
  S.stopMusic = function () { if (S._seq) { clearInterval(S._seq); S._seq = null; } };
  S.setMusic = function (on) {
    S.music = on;
    if (S.ctx) S.musicGain.gain.setTargetAtTime(on ? 0.32 : 0, S.ctx.currentTime, 0.2);
  };

  S.vibrate = function (p) {
    try { if (S.on && navigator.vibrate) navigator.vibrate(p); } catch (e) { }
  };

  root.Sound = S;
})(window);
