// ─────────────────────────────────────────────
//  Background.js — 3-layer parallax background
// ─────────────────────────────────────────────

import { SKY_TOP, SKY_BOTTOM, lerp } from '../utils/utils.js';

// Pre-generate cloud and mountain shapes so we can reuse them
function seededRand(seed) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

export class Background {
  constructor(canvasWidth, canvasHeight) {
    this.W = canvasWidth;
    this.H = canvasHeight;

    // Seeded random for stable cloud/mountain placement
    const rng = seededRand(42);

    // Clouds — array of { x, y, w, h, seed }
    this.clouds = Array.from({ length: 7 }, (_, i) => ({
      x: rng() * this.W,
      y: rng() * this.H * 0.4 + 20,
      w: rng() * 60 + 40,
      h: rng() * 25 + 15,
      seed: i,
    }));

    // Mountains — array of { x, h, w }
    this.mountains = Array.from({ length: 8 }, () => ({
      x: rng() * this.W * 1.5,
      h: rng() * 80 + 60,
      w: rng() * 100 + 80,
    }));

    // Flowers — near the bottom
    this.flowers = Array.from({ length: 12 }, () => ({
      x: rng() * this.W,
      y: this.H - 20 - rng() * 40,
      r: rng() * 4 + 3,
      color: ['#FF6B6B', '#FFD93D', '#95E66A', '#C77DFF', '#FF9F43'][Math.floor(rng() * 5)],
    }));
  }

  /**
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} camY — camera Y offset (world units)
   */
  draw(ctx, camY) {
    const W = this.W;
    const H = this.H;

    // ── Layer 1: Sky gradient (fixed) ─────────────────────
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, SKY_TOP);
    sky.addColorStop(1, SKY_BOTTOM);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    // ── Layer 2: Clouds (parallax factor 0.05 — slowest) ──
    const cloudParallax = camY * 0.05;
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    this.clouds.forEach(c => {
      const cy = ((c.y - cloudParallax) % (H * 1.2) + H * 1.2) % (H * 1.2) - 20;
      // Draw puffy cloud (3 overlapping circles)
      const cx = c.x;
      ctx.beginPath();
      ctx.arc(cx, cy, c.h * 0.5, 0, Math.PI * 2);
      ctx.arc(cx + c.w * 0.3, cy - c.h * 0.1, c.h * 0.45, 0, Math.PI * 2);
      ctx.arc(cx + c.w * 0.6, cy, c.h * 0.4, 0, Math.PI * 2);
      ctx.fill();
    });

    // ── Layer 3: Far mountains (parallax factor 0.15) ────
    const mtParallax = camY * 0.15;
    this.mountains.forEach(m => {
      const my = H - m.h - 60 + ((-mtParallax) % (H * 0.5) + H * 0.5) % (H * 0.5) - 30;
      ctx.fillStyle = 'rgba(180,210,230,0.6)';
      ctx.beginPath();
      ctx.moveTo(m.x, my + m.h);
      ctx.lineTo(m.x + m.w / 2, my);
      ctx.lineTo(m.x + m.w, my + m.h);
      ctx.closePath();
      ctx.fill();
    });

    // ── Layer 4: Ground / grass strip (parallax factor 0.4) ──
    const groundParallax = camY * 0.4;
    const groundY = (H - 50 + ((-groundParallax) % 80 + 80) % 80);

    // Grass background
    ctx.fillStyle = 'rgba(149,230,106,0.4)';
    ctx.fillRect(0, groundY, W, 60);

    // Ground line
    ctx.fillStyle = 'rgba(95,200,60,0.7)';
    ctx.fillRect(0, groundY, W, 8);

    // Flowers
    this.flowers.forEach(f => {
      const fy = ((f.y - groundParallax * 0.5) % (H + 100) + H + 100) % (H + 100);
      ctx.fillStyle = f.color;
      ctx.beginPath();
      ctx.arc(f.x, fy, f.r, 0, Math.PI * 2);
      ctx.fill();
      // Flower center
      ctx.fillStyle = '#FFE66D';
      ctx.beginPath();
      ctx.arc(f.x, fy, f.r * 0.4, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  /** Called each frame by Game.js */
  update(camY) {
    this._camY = camY;
  }
}
