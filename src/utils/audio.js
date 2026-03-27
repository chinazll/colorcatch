// ─────────────────────────────────────────
// WEB AUDIO API — Synthesized Game Sounds
// No external audio files required.
// ─────────────────────────────────────────

let audioCtx = null;

export function initAudio() {
  try {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  } catch (e) {
    console.warn('Web Audio API not supported:', e);
  }
}

function ensureContext() {
  if (!audioCtx) return null;
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function playTone({ frequency, type = 'sine', duration, startTime = 0, volume = 0.3, attack = 0.01, decay = 0.1, slide = 0 }) {
  const ctx = ensureContext();
  if (!ctx) return;

  const now = ctx.currentTime + startTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(frequency, now);
  if (slide !== 0) {
    osc.frequency.linearRampToValueAtTime(frequency + slide, now + duration);
  }

  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(volume, now + attack);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + duration + 0.05);
}

function playNoise({ duration, volume = 0.15, startTime = 0, filterFreq = 1000 }) {
  const ctx = ensureContext();
  if (!ctx) return;

  const now = ctx.currentTime + startTime;
  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = filterFreq;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(volume, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

  source.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  source.start(now);
}

// ─────────────────────────────────────────
// SOUND EFFECTS
// ─────────────────────────────────────────

/** Short bouncy jump sound */
export function playSound(name) {
  switch (name) {
    case 'jump': {
      // Rising pitch + noise pop
      playTone({ frequency: 280, type: 'sine', duration: 0.08, volume: 0.25, slide: 200 });
      playTone({ frequency: 400, type: 'sine', duration: 0.06, volume: 0.2, slide: 100, startTime: 0.03 });
      break;
    }

    case 'land': {
      // Soft thud
      playTone({ frequency: 120, type: 'sine', duration: 0.1, volume: 0.2, slide: -60 });
      playNoise({ duration: 0.08, volume: 0.12, filterFreq: 800 });
      break;
    }

    case 'score': {
      // Cheerful ascending ding-ding
      playTone({ frequency: 660, type: 'sine', duration: 0.08, volume: 0.2 });
      playTone({ frequency: 880, type: 'sine', duration: 0.08, volume: 0.18, startTime: 0.07 });
      playTone({ frequency: 1100, type: 'sine', duration: 0.12, volume: 0.15, startTime: 0.14 });
      break;
    }

    case 'combo': {
      // Exciting triple ding
      playTone({ frequency: 523, type: 'sine', duration: 0.1, volume: 0.25 });
      playTone({ frequency: 659, type: 'sine', duration: 0.1, volume: 0.25, startTime: 0.08 });
      playTone({ frequency: 784, type: 'sine', duration: 0.1, volume: 0.25, startTime: 0.16 });
      playTone({ frequency: 1047, type: 'sine', duration: 0.2, volume: 0.2, startTime: 0.24 });
      break;
    }

    case 'bonus': {
      // Magical sparkle
      playTone({ frequency: 880, type: 'sine', duration: 0.06, volume: 0.2 });
      playTone({ frequency: 1320, type: 'sine', duration: 0.06, volume: 0.18, startTime: 0.05 });
      playTone({ frequency: 1760, type: 'sine', duration: 0.1, volume: 0.15, startTime: 0.1 });
      playTone({ frequency: 2200, type: 'sine', duration: 0.15, volume: 0.12, startTime: 0.15 });
      break;
    }

    case 'gameover': {
      // Descending sad tones
      playTone({ frequency: 440, type: 'sine', duration: 0.15, volume: 0.3, slide: -100 });
      playTone({ frequency: 349, type: 'sine', duration: 0.15, volume: 0.28, startTime: 0.15, slide: -80 });
      playTone({ frequency: 262, type: 'sine', duration: 0.3, volume: 0.25, startTime: 0.3, slide: -60 });
      playNoise({ duration: 0.2, volume: 0.1, filterFreq: 2000, startTime: 0.05 });
      break;
    }

    case 'crumble': {
      // Cracking / crumbling noise
      playNoise({ duration: 0.3, volume: 0.18, filterFreq: 500 });
      playTone({ frequency: 80, type: 'triangle', duration: 0.2, volume: 0.15, slide: -40 });
      break;
    }

    default:
      break;
  }
}
