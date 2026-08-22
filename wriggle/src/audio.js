// audio.js — 파일 없이 WebAudio 신스로만 낸다 (§13). 실패해도 게임은 계속된다.
import { SFX } from './config.js';

let ac = null, muted = false;

export function unlock() {
  try {
    if (!ac) ac = new (window.AudioContext || window.webkitAudioContext)();
    if (ac.state === 'suspended') ac.resume();
  } catch (e) { ac = null; }
}

export function setMute(b) { muted = !!b; }
export function isMuted() { return muted; }

function tone(type, f0, f1, dur, gain, t0) {
  const o = ac.createOscillator(), g = ac.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f0, t0);
  if (f1 && f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t0 + dur);
  g.gain.setValueAtTime(gain * SFX.MASTER, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(ac.destination);
  o.start(t0); o.stop(t0 + dur + 0.02);
}

export function play(name, opt = {}) {
  if (muted || !ac) return;
  const s = SFX[name];
  if (!s) return;
  try {
    let t = ac.currentTime;
    const detune = opt.semitone ? Math.pow(2, opt.semitone / 12) : 1;
    if (s.seq) {
      for (const [f, d] of s.seq) {
        if (f > 0) tone(s.type, f * detune, f * detune, d, s.gain, t);
        t += d;
      }
    } else {
      const r = s.rand ? 1 + (Math.random() - 0.5) * 2 * s.rand : 1;
      tone(s.type, s.f0 * detune * r, s.f1 * detune * r, s.dur, s.gain, t);
    }
  } catch (e) {}
}

let heartTimer = null;
export function heartbeat(on) {
  if (heartTimer) { clearInterval(heartTimer); heartTimer = null; }
  if (on) heartTimer = setInterval(() => play('heart'), 700);
}
