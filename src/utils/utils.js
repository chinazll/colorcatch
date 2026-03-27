// ─────────────────────────────────────────────
//  utils.js — Color tools, roundRect, drawStar
// ─────────────────────────────────────────────

export const COLORS = {
  red:    '#FF6B6B',
  yellow: '#FFD93D',
  blue:   '#4ECDC4',
  green:  '#95E66A',
  purple: '#C77DFF',
  orange: '#FF9F43',
};

export const COLOR_KEYS = Object.keys(COLORS);

export const GOLD = '#FFE66D';
export const SHADOW = '#2D3436';
export const SKY_TOP = '#87CEEB';
export const SKY_BOTTOM = '#FFE4E1';

export function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}

/** Draw a rounded rectangle path (does NOT call ctx.stroke/fill) */
export function roundRect(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/** Draw a 5-pointed star centered at (cx, cy) */
export function drawStar(ctx, cx, cy, outerR, innerR, rotation = 0) {
  const points = 5;
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const angle = (Math.PI / points) * i - Math.PI / 2 + rotation;
    const r = i % 2 === 0 ? outerR : innerR;
    const px = cx + r * Math.cos(angle);
    const py = cy + r * Math.sin(angle);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

/** Clamp a value between min and max */
export function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

/** Linear interpolation */
export function lerp(a, b, t) {
  return a + (b - a) * t;
}

/** Random float in [min, max] */
export function rand(min, max) {
  return min + Math.random() * (max - min);
}

/** Random integer in [min, max] (inclusive) */
export function randInt(min, max) {
  return Math.floor(rand(min, max + 1));
}

/** Pick a random element from an array */
export function randPick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
