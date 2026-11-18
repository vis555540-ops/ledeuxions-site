// Tiny WebAudio synth: engine hum, nitro "pfffrt", coin, beeps, bonks. All generated, no files.
let ctx = null, master = null, engOsc = null, engOsc2 = null, engGain = null, engFilt = null, noiseBuf = null;
let muted = false, extMute = false, sfxOn = true, musicOn = true, musGain = null, sfxGain = null, musTimer = null, musStep = 0, musNext = 0;
try { muted = localStorage.getItem('npr_mute') === '1'; sfxOn = localStorage.getItem('npr_sfx') !== '0'; musicOn = localStorage.getItem('npr_music') !== '0'; } catch (e) { }

function ensure() {
  if (ctx) return true;
  try {
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false;
    ctx = new AC();
    const out = ctx.createGain(); out.gain.value = (muted || extMute) ? 0 : 0.6; out.connect(ctx.destination); audio._out = out;
    sfxGain = ctx.createGain(); sfxGain.gain.value = sfxOn ? 1 : 0; sfxGain.connect(out);
    musGain = ctx.createGain(); musGain.gain.value = musicOn ? 0.32 : 0; musGain.connect(out);
    master = sfxGain;
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    engFilt = ctx.createBiquadFilter(); engFilt.type = 'lowpass'; engFilt.frequency.value = 500;
    engGain = ctx.createGain(); engGain.gain.value = 0;
    engOsc = ctx.createOscillator(); engOsc.type = 'sawtooth'; engOsc.frequency.value = 50;
    engOsc2 = ctx.createOscillator(); engOsc2.type = 'square'; engOsc2.frequency.value = 25;
    const g2 = ctx.createGain(); g2.gain.value = 0.35;
    engOsc.connect(engFilt); engOsc2.connect(g2); g2.connect(engFilt); engFilt.connect(engGain); engGain.connect(master);
    engOsc.start(); engOsc2.start();
    return true;
  } catch (e) { ctx = null; return false; }
}
function applyVol() {
  if (!ctx) return; const t = ctx.currentTime;
  audio._out.gain.setTargetAtTime((muted || extMute) ? 0 : 0.6, t, 0.02);
  sfxGain.gain.setTargetAtTime(sfxOn ? 1 : 0, t, 0.02); musGain.gain.setTargetAtTime(musicOn ? 0.32 : 0, t, 0.02);
}
// tiny bouncy chiptune loop (original, 2 bars of bass + lead), scheduled ahead with a timer
const BASS = [45, 45, 52, 45, 50, 50, 52, 47];
const LEAD = [69, 0, 72, 74, 76, 0, 74, 72, 74, 0, 72, 69, 71, 0, 67, 69];
const hz = n => 440 * Math.pow(2, (n - 69) / 12);
function musTick() {
  if (!ctx || ctx.state !== 'running') return;
  const spb = 60 / 132 / 2;
  if (musNext < ctx.currentTime) musNext = ctx.currentTime + 0.05;
  while (musNext < ctx.currentTime + 0.25) {
    const st = musStep % 16;
    if (st % 2 === 0) note(hz(BASS[(st / 2 + Math.floor(musStep / 16) * 0) % 8]), musNext, spb * 1.6, 'triangle', 0.5);
    const ln = LEAD[(st + (Math.floor(musStep / 16) % 2) * 0) % 16]; if (ln) note(hz(ln + (Math.floor(musStep / 32) % 2 ? 2 : 0)), musNext, spb * 0.9, 'square', 0.12);
    if (st % 4 === 2) { const n = ctx.createBufferSource(); n.buffer = noiseBuf; const g = ctx.createGain(); g.gain.setValueAtTime(0.08, musNext); g.gain.exponentialRampToValueAtTime(0.0001, musNext + 0.05); const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 6000; n.connect(f); f.connect(g); g.connect(musGain); n.start(musNext); n.stop(musNext + 0.06); }
    musNext += spb; musStep++;
  }
}
function note(f, t, d, type, v) { const o = ctx.createOscillator(); o.type = type; o.frequency.value = f; const g = ctx.createGain(); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d); o.connect(g); g.connect(musGain); o.start(t); o.stop(t + d + 0.02); }

export const audio = {
  unlock() { if (ensure() && ctx.state === 'suspended') ctx.resume().catch(() => { }); },
  get muted() { return muted; }, get sfx() { return sfxOn; }, get music() { return musicOn; },
  setSfx(b) { sfxOn = b; try { localStorage.setItem('npr_sfx', b ? '1' : '0'); } catch (e) { } applyVol(); },
  setMusic(b) { musicOn = b; try { localStorage.setItem('npr_music', b ? '1' : '0'); } catch (e) { } applyVol(); },
  musicStart() { if (!ensure() || musTimer) return; musNext = ctx.currentTime + 0.1; musTimer = setInterval(musTick, 100); },
  musicStop() { if (musTimer) { clearInterval(musTimer); musTimer = null; } },
  cheer(v = 1) { // crowd: lots of bandpassed noise swells + a few "woo" whistles
    if (!ctx) return; const t = ctx.currentTime;
    const n = ctx.createBufferSource(); n.buffer = noiseBuf; n.loop = true; const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1100; f.Q.value = 0.6;
    const am = ctx.createOscillator(); am.frequency.value = 7; const amg = ctx.createGain(); amg.gain.value = 0.05 * v;
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.16 * v, t + 0.25); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.8);
    am.connect(amg); amg.connect(g.gain); n.connect(f); f.connect(g); g.connect(master); n.start(t); am.start(t); n.stop(t + 1.9); am.stop(t + 1.9);
    for (let i = 0; i < 3; i++) { const o = ctx.createOscillator(); o.type = 'sine'; const t0 = t + 0.1 + i * 0.22 + Math.random() * 0.1; o.frequency.setValueAtTime(900 + Math.random() * 400, t0); o.frequency.exponentialRampToValueAtTime(1800 + Math.random() * 500, t0 + 0.25); const og = ctx.createGain(); og.gain.setValueAtTime(0.0001, t0); og.gain.exponentialRampToValueAtTime(0.05 * v, t0 + 0.05); og.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.35); o.connect(og); og.connect(master); o.start(t0); o.stop(t0 + 0.4); }
  },
  pop() { if (!ctx) return; this._noise(0.08, 3000, 0.4); this._blip(180, 0.12, 'sine', 0.3); const t = ctx.currentTime; const n = ctx.createBufferSource(); n.buffer = noiseBuf; const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 3500; const g = ctx.createGain(); g.gain.setValueAtTime(0.12, t + 0.05); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.8); n.connect(f); f.connect(g); g.connect(master); n.start(t + 0.05); n.stop(t + 1.9); },
  thud(v = 1) { this._blip(70, 0.22, 'sine', 0.35 * v); this._noise(0.16, 260, 0.22 * v); },
  rev() { if (!ctx) return; const t = ctx.currentTime; const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(50, t); o.frequency.exponentialRampToValueAtTime(140, t + 0.35); o.frequency.exponentialRampToValueAtTime(60, t + 0.9); const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 800; const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.18, t + 0.08); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.95); o.connect(f); f.connect(g); g.connect(master); o.start(t); o.stop(t + 1); },
  toggleMute() { muted = !muted; try { localStorage.setItem('npr_mute', muted ? '1' : '0'); } catch (e) { } applyVol(); return muted; },
  setExternalMute(b) { extMute = !!b; applyVol(); },
  suspend() { if (ctx) ctx.suspend().catch(() => { }); },
  resume() { if (ctx) ctx.resume().catch(() => { }); },
  engine(speed01, on, boost) {
    if (!ctx) return;
    const t = ctx.currentTime;
    const f = 42 + speed01 * 120 + (boost ? 40 : 0); // pitch climbs with speed
    engOsc.frequency.setTargetAtTime(f, t, 0.05);
    engOsc2.frequency.setTargetAtTime(f / 2, t, 0.05);
    engFilt.frequency.setTargetAtTime(350 + speed01 * 900 + (boost ? 600 : 0), t, 0.05);
    engGain.gain.setTargetAtTime(on ? 0.07 + speed01 * 0.07 : 0, t, 0.08);
  },
  puff() { // cute "pbbbt" : wobbling low square + soft noise
    if (!ctx) return; const t = ctx.currentTime;
    const o = ctx.createOscillator(); o.type = 'square'; o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(55, t + 0.45);
    const lfo = ctx.createOscillator(); lfo.frequency.value = 32; const lg = ctx.createGain(); lg.gain.value = 40; lfo.connect(lg); lg.connect(o.frequency);
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 700;
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.35, t + 0.03); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
    o.connect(f); f.connect(g); g.connect(master); o.start(t); lfo.start(t); o.stop(t + 0.55); lfo.stop(t + 0.55);
    const n = ctx.createBufferSource(); n.buffer = noiseBuf; const nf = ctx.createBiquadFilter(); nf.type = 'bandpass'; nf.frequency.value = 900; nf.Q.value = 0.7;
    const ng = ctx.createGain(); ng.gain.setValueAtTime(0.12, t); ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
    n.connect(nf); nf.connect(ng); ng.connect(master); n.start(t); n.stop(t + 0.65);
  },
  coin() { this._blip(988, 0.07, 'square', 0.12); setTimeout(() => this._blip(1319, 0.12, 'square', 0.12), 70); },
  pickNitro() { this._blip(520, 0.08, 'triangle', 0.2); setTimeout(() => this._blip(780, 0.1, 'triangle', 0.2), 60); setTimeout(() => this._blip(1040, 0.12, 'triangle', 0.2), 120); },
  beep(hi) { this._blip(hi ? 880 : 440, hi ? 0.5 : 0.2, 'square', 0.17); if (hi) setTimeout(() => this._blip(1320, 0.35, 'square', 0.1), 60); },
  lap() { this._blip(660, 0.1, 'square', 0.12); setTimeout(() => this._blip(880, 0.15, 'square', 0.12), 100); },
  win() { [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => this._blip(f, 0.18, 'square', 0.13), i * 110)); },
  buy() { this._blip(700, 0.06, 'square', 0.12); setTimeout(() => this._blip(1050, 0.1, 'square', 0.12), 60); },
  upgrade() { this.rev(); [392, 523, 659, 784, 1047, 1319].forEach((f, i) => setTimeout(() => this._blip(f, 0.14, 'triangle', 0.16), 80 + i * 55)); setTimeout(() => this._noise(0.35, 2200, 0.08), 400); },
  bonk(v) { if (!ctx) return; this._noise(0.14, 380, Math.min(0.35, v * 0.035)); this._blip(110 + Math.random() * 40, 0.08, 'square', Math.min(0.12, v * 0.012)); },
  land() { this._noise(0.1, 200, 0.18); },
  _blip(freq, dur, type, vol) {
    if (!ctx) return; const t = ctx.currentTime;
    const o = ctx.createOscillator(); o.type = type; o.frequency.value = freq;
    const g = ctx.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.02);
  },
  _noise(dur, freq, vol) {
    if (!ctx) return; const t = ctx.currentTime;
    const n = ctx.createBufferSource(); n.buffer = noiseBuf; const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = freq;
    const g = ctx.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    n.connect(f); f.connect(g); g.connect(master); n.start(t); n.stop(t + dur + 0.02);
  },
};
