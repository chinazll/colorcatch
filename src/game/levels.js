// ─────────────────────────────────────────
// LEVELS — Difficulty & spawn parameters
// ─────────────────────────────────────────

import { COLOR_KEYS } from './Player.js';

export const LEVELS = [
  // Level 1 – Beginner
  {
    rowSpawnSpacing: 85,
    platformCount: 3,
    platformWidthMin: 70,
    platformWidthMax: 90,
    crumblingChance: 0.05,
    movingChance: 0.0,
    bonusChance: 0.05,
    ballChance: 0.4,
    ballColorSameBias: 0.3,
  },
  // Level 2
  {
    rowSpawnSpacing: 82,
    platformCount: 3,
    platformWidthMin: 65,
    platformWidthMax: 85,
    crumblingChance: 0.08,
    movingChance: 0.05,
    bonusChance: 0.06,
    ballChance: 0.45,
    ballColorSameBias: 0.25,
  },
  // Level 3
  {
    rowSpawnSpacing: 80,
    platformCount: 3,
    platformWidthMin: 60,
    platformWidthMax: 82,
    crumblingChance: 0.1,
    movingChance: 0.1,
    bonusChance: 0.07,
    ballChance: 0.5,
    ballColorSameBias: 0.2,
  },
  // Level 4
  {
    rowSpawnSpacing: 78,
    platformCount: 3,
    platformWidthMin: 58,
    platformWidthMax: 80,
    crumblingChance: 0.12,
    movingChance: 0.12,
    bonusChance: 0.07,
    ballChance: 0.5,
    ballColorSameBias: 0.2,
  },
  // Level 5
  {
    rowSpawnSpacing: 75,
    platformCount: 3,
    platformWidthMin: 55,
    platformWidthMax: 78,
    crumblingChance: 0.15,
    movingChance: 0.15,
    bonusChance: 0.08,
    ballChance: 0.55,
    ballColorSameBias: 0.15,
  },
  // Level 6
  {
    rowSpawnSpacing: 73,
    platformCount: 4,
    platformWidthMin: 55,
    platformWidthMax: 75,
    crumblingChance: 0.18,
    movingChance: 0.18,
    bonusChance: 0.08,
    ballChance: 0.55,
    ballColorSameBias: 0.15,
  },
  // Level 7
  {
    rowSpawnSpacing: 70,
    platformCount: 4,
    platformWidthMin: 52,
    platformWidthMax: 72,
    crumblingChance: 0.2,
    movingChance: 0.2,
    bonusChance: 0.09,
    ballChance: 0.6,
    ballColorSameBias: 0.1,
  },
  // Level 8
  {
    rowSpawnSpacing: 68,
    platformCount: 4,
    platformWidthMin: 50,
    platformWidthMax: 70,
    crumblingChance: 0.22,
    movingChance: 0.22,
    bonusChance: 0.09,
    ballChance: 0.6,
    ballColorSameBias: 0.1,
  },
  // Level 9
  {
    rowSpawnSpacing: 65,
    platformCount: 4,
    platformWidthMin: 48,
    platformWidthMax: 68,
    crumblingChance: 0.25,
    movingChance: 0.25,
    bonusChance: 0.1,
    ballChance: 0.65,
    ballColorSameBias: 0.08,
  },
  // Level 10 – Expert
  {
    rowSpawnSpacing: 62,
    platformCount: 4,
    platformWidthMin: 45,
    platformWidthMax: 65,
    crumblingChance: 0.28,
    movingChance: 0.28,
    bonusChance: 0.1,
    ballChance: 0.7,
    ballColorSameBias: 0.05,
  },
];

export function getLevelConfig(level) {
  const idx = Math.min(level - 1, LEVELS.length - 1);
  return LEVELS[idx];
}

export function getRandomColorKey(sameAs = null, sameBias = 0.2) {
  if (sameAs !== null && Math.random() < sameBias) {
    return sameAs;
  }
  return COLOR_KEYS[Math.floor(Math.random() * COLOR_KEYS.length)];
}
