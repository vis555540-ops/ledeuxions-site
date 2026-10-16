// WebAudio 로 만드는 짧은 효과음 (파일 없음)
(function () {
  const QR = (globalThis.QR = globalThis.QR || {});
  let ac = null, master = null, rumbleGain = null, noiseBuf = null, muted = false, ext = false; // ext = CrazyGames 설정의 음소거
  const last = {};

  function init() {
    if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
    try {
      ac = new (window.AudioContext || window.webkitAudioContext)();
      master = ac.createGain(); master.gain.value = muted || ext ? 0 : 0.7; master.connect(ac.destination);
      noiseBuf = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      // 지진 웅웅 소리: 저역 잡음 상시 재생, 크기만 조절
      const src = ac.createBufferSource(); src.buffer = noiseBuf; src.loop = true;
      const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 90;
      rumbleGain = ac.createGain(); rumbleGain.gain.value = 0;
      src.connect(lp); lp.connect(rumbleGain); rumbleGain.connect(master); src.start();
    } catch (e) { ac = null; }
  }
  const ok = (name, gap) => {
    if (!ac || muted || ext) return false;
    const t = ac.currentTime;
    if (last[name] && t - last[name] < gap) return false;
    last[name] = t; return true;
  };
  function noise(dur, type, freq, q, vol, attack = 0.002) {
    const t = ac.currentTime;
    const s = ac.createBufferSource(); s.buffer = noiseBuf; s.playbackRate.value = 0.8 + Math.random() * 0.4;
    const f = ac.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
    const g = ac.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(master); s.start(t, Math.random()); s.stop(t + dur + 0.05);
  }
  function tone(type, f0, f1, dur, vol, delay = 0) {
    const t = ac.currentTime + delay;
    const o = ac.createOscillator(); o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    const g = ac.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.05);
  }

  QR.sfx = {
    init,
    get muted() { return muted || ext; },
    setExt(v) { ext = !!v; if (master) master.gain.value = muted || ext ? 0 : 0.7; if (ext && rumbleGain && ac) rumbleGain.gain.setValueAtTime(0, ac.currentTime); },
    toggle() { muted = !muted; if (master) master.gain.value = muted || ext ? 0 : 0.7; return muted || ext; },
    rumble(level) { if (rumbleGain && ac) rumbleGain.gain.setTargetAtTime(muted || ext ? 0 : Math.min(1.2, level * 1.3), ac.currentTime, 0.08); },
    place() { if (!ok('place', 0.03)) return; tone('triangle', 520, 300, 0.09, 0.25); noise(0.06, 'bandpass', 1800, 2, 0.2); },
    remove() { if (!ok('place', 0.03)) return; tone('triangle', 300, 520, 0.09, 0.2); },
    deny() { if (!ok('deny', 0.15)) return; tone('square', 160, 120, 0.18, 0.12); },
    creak() {
      if (!ok('creak', 0.25)) return;
      const t = ac.currentTime, o = ac.createOscillator(); o.type = 'sawtooth';
      const base = 70 + Math.random() * 60; o.frequency.setValueAtTime(base, t);
      o.frequency.linearRampToValueAtTime(base * (1.6 + Math.random()), t + 0.35);
      const f = ac.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 900; f.Q.value = 6;
      const g = ac.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.25, t + 0.05); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
      o.connect(f); f.connect(g); g.connect(master); o.start(t); o.stop(t + 0.45);
    },
    crack() { if (!ok('crack', 0.05)) return; noise(0.12, 'highpass', 1500, 0.7, 0.9, 0.001); tone('square', 900, 200, 0.05, 0.15); },
    snap() { if (!ok('snap', 0.08)) return; noise(0.08, 'bandpass', 2400, 3, 0.6, 0.001); },
    clank() { if (!ok('clank', 0.1)) return; tone('triangle', 1400, 1300, 0.25, 0.18); tone('triangle', 2100, 2000, 0.2, 0.1); },
    crash(big) {
      if (!ok('crash', 0.09)) return;
      noise(big ? 0.9 : 0.4, 'lowpass', big ? 700 : 1200, 0.8, big ? 1.0 : 0.6, 0.003);
      tone('sine', 110, 40, big ? 0.5 : 0.25, big ? 0.6 : 0.3);
    },
    win() { if (!ac || muted || ext) return; [523, 659, 784, 1046].forEach((f, i) => tone('triangle', f, f, 0.25, 0.25, i * 0.11)); },
    lose() { if (!ac || muted || ext) return; [392, 330, 262].forEach((f, i) => tone('sawtooth', f, f * 0.97, 0.3, 0.12, i * 0.16)); },
    tick() { if (!ok('tick', 0.3)) return; tone('sine', 880, 880, 0.08, 0.2); },
  };
})();
