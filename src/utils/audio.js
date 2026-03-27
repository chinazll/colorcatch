// audio.js — Web Audio synthesizer for Color Catch

let ctx = null;

function getCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  return ctx;
}

export function resumeAudio() {
  const c = getCtx();
  if (c.state === 'suspended') c.resume();
}

/** Call once on first user interaction to unlock audio */
export function initAudio() {
  resumeAudio();
}

function playTone(freq, duration, type = 'sine', gain = 0.3, startDelay = 0) {
  const c = getCtx();
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.connect(g);
  g.connect(c.destination);
  osc.type = type;
  osc.frequency.value = freq;
  const t = c.currentTime + startDelay;
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + duration);
  osc.start(t);
  osc.stop(t + duration + 0.01);
}

function playNoise(duration, gain = 0.15, startDelay = 0) {
  const c = getCtx();
  const bufSize = c.sampleRate * duration;
  const buf = c.createBuffer(1, bufSize, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buf;
  const g = c.createGain();
  const filter = c.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = 800;
  src.connect(filter);
  filter.connect(g);
  g.connect(c.destination);
  const t = c.currentTime + startDelay;
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + duration);
  src.start(t);
  src.stop(t + duration + 0.01);
}

export function playJump() {
  const c = getCtx();
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.connect(g);
  g.connect(c.destination);
  osc.type = 'sine';
  const t = c.currentTime;
  osc.frequency.setValueAtTime(300, t);
  osc.frequency.exponentialRampToValueAtTime(600, t + 0.12);
  g.gain.setValueAtTime(0.25, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
  osc.start(t);
  osc.stop(t + 0.13);
}

export function playLand() {
  playTone(180, 0.08, 'sine', 0.3);
  playNoise(0.06, 0.12, 0.01);
}

export function playScore() {
  // C5-E5-G5 ascending ding
  playTone(523, 0.12, 'sine', 0.25, 0);
  playTone(659, 0.12, 'sine', 0.25, 0.07);
  playTone(784, 0.18, 'sine', 0.25, 0.14);
}

export function playCombo(level = 2) {
  const notes = [523, 659, 784, 1047, 1319];
  for (let i = 0; i < Math.min(level, notes.length); i++) {
    playTone(notes[i], 0.15, 'sine', 0.25, i * 0.06);
  }
}

export function playBonus() {
  for (let i = 0; i < 6; i++) {
    playTone(800 + i * 200, 0.08, 'sine', 0.2, i * 0.04);
  }
  playTone(1200, 0.25, 'sine', 0.3, 0.2);
}

export function playGameOver() {
  const notes = [400, 350, 300, 200];
  for (let i = 0; i < notes.length; i++) {
    playTone(notes[i], 0.3, 'sawtooth', 0.15, i * 0.18);
  }
  playNoise(0.4, 0.1, 0.1);
}
