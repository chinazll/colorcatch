// ─────────────────────────────────────────────
//  Background.js — Candy Crush style parallax background
// ─────────────────────────────────────────────

function seededRand(seed) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

const CANDY_COLORS = ['#FF6B6B', '#FFD166', '#95E66A', '#4ECDC4', '#C44AFF', '#FF9F6B', '#06B6D4'];
const BG_TOP    = '#FFD1DC';  // light pink
const BG_MID    = '#B8E8FC';  // sky blue
const BG_BOTTOM = '#FFF9C4';  // cream yellow

export class Background {
  constructor(W, H) {
    this.W = W;
    this.H = H;
    const rng = seededRand(42);

    // Fluffy clouds
    this.clouds = Array.from({ length: 9 }, (_, i) => ({
      x: rng() * W,
      y: rng() * H * 0.38 + 15,
      w: rng() * 70 + 45,
      h: rng() * 28 + 18,
      seed: i,
    }));

    // Mountain layers (3 layers for depth)
    this.mtBack = Array.from({ length: 7 }, () => ({
      x: rng() * W * 1.6,
      h: rng() * 70 + 50,
      w: rng() * 110 + 90,
      color: '#D4A8C8', // lavender
    }));
    this.mtMid = Array.from({ length: 6 }, () => ({
      x: rng() * W * 1.4,
      h: rng() * 60 + 40,
      w: rng() * 90 + 70,
      color: '#98D4A0', // sage green
    }));

    // Floating candy decorations
    this.candies = Array.from({ length: 6 }, (_, i) => ({
      x: rng() * W,
      y: rng() * H * 0.5 + H * 0.1,
      r: rng() * 8 + 6,
      color: CANDY_COLORS[i % CANDY_COLORS.length],
      phase: rng() * Math.PI * 2,
      speed: rng() * 0.5 + 0.3,
      amp: rng() * 15 + 8,
    }));

    // Ground flowers
    this.flowers = Array.from({ length: 14 }, () => ({
      x: rng() * W,
      y: H - 18 - rng() * 35,
      r: rng() * 5 + 3,
      color: CANDY_COLORS[Math.floor(rng() * CANDY_COLORS.length)],
    }));
  }

  draw(ctx, camY) {
    const W = this.W, H = this.H;

    // ── Layer 1: Sky gradient ───────────────────────────
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, BG_TOP);
    sky.addColorStop(0.45, BG_MID);
    sky.addColorStop(1, BG_BOTTOM);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    // ── Layer 2: Sun glow (top-right) ───────────────────
    const sunGrad = ctx.createRadialGradient(W * 0.82, H * 0.12, 0, W * 0.82, H * 0.12, 80);
    sunGrad.addColorStop(0, 'rgba(255,230,130,0.7)');
    sunGrad.addColorStop(0.4, 'rgba(255,200,80,0.3)');
    sunGrad.addColorStop(1, 'rgba(255,180,60,0)');
    ctx.fillStyle = sunGrad;
    ctx.fillRect(0, 0, W, H);

    // ── Layer 3: Clouds (parallax 0.05) ───────────────
    const cloudParallax = camY * 0.05;
    this.clouds.forEach(c => {
      const cy = ((c.y - cloudParallax) % (H * 1.2) + H * 1.2) % (H * 1.2) - 20;
      ctx.fillStyle = 'rgba(255,255,255,0.88)';
      ctx.beginPath();
      ctx.arc(c.x, cy, c.h * 0.5, 0, Math.PI * 2);
      ctx.arc(c.x + c.w * 0.3, cy - c.h * 0.08, c.h * 0.44, 0, Math.PI * 2);
      ctx.arc(c.x + c.w * 0.6, cy, c.h * 0.42, 0, Math.PI * 2);
      ctx.fill();
    });

    // ── Layer 4: Back mountains ─────────────────────────
    const mtParallax = camY * 0.12;
    this.mtBack.forEach(m => {
      const my = H - m.h - 55 + ((-mtParallax) % (H * 0.4) + H * 0.4) % (H * 0.4) - 25;
      ctx.fillStyle = m.color;
      ctx.beginPath();
      ctx.moveTo(m.x, my + m.h);
      ctx.lineTo(m.x + m.w / 2, my);
      ctx.lineTo(m.x + m.w, my + m.h);
      ctx.closePath();
      ctx.fill();
    });

    // ── Layer 5: Mid mountains ────────────────────────
    const midParallax = camY * 0.22;
    this.mtMid.forEach(m => {
      const my = H - m.h - 40 + ((-midParallax) % (H * 0.35) + H * 0.35) % (H * 0.35) - 20;
      ctx.fillStyle = m.color;
      ctx.beginPath();
      ctx.moveTo(m.x, my + m.h);
      ctx.lineTo(m.x + m.w / 2, my);
      ctx.lineTo(m.x + m.w, my + m.h);
      ctx.closePath();
      ctx.fill();
    });

    // ── Layer 6: Floating candies (parallax 0.3) ───────
    const candyParallax = camY * 0.3;
    const t = Date.now() * 0.001;
    this.candies.forEach((c, i) => {
      const cx = c.x;
      const cy = ((c.y - candyParallax + c.amp * Math.sin(t * c.speed + c.phase)) % (H * 1.4) + H * 1.4) % (H * 1.4) - 40;

      // Candy body
      ctx.fillStyle = c.color;
      ctx.beginPath();
      ctx.arc(cx, cy, c.r, 0, Math.PI * 2);
      ctx.fill();

      // Shine highlight
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.beginPath();
      ctx.arc(cx - c.r * 0.25, cy - c.r * 0.28, c.r * 0.35, 0, Math.PI * 2);
      ctx.fill();

      // Outline
      ctx.strokeStyle = 'rgba(0,0,0,0.12)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, c.r, 0, Math.PI * 2);
      ctx.stroke();
    });

    // ── Layer 7: Ground strip ────────────────────────────
    const groundParallax = camY * 0.45;
    const groundY = H - 48 + ((-groundParallax) % 70 + 70) % 70;

    // Grass background
    ctx.fillStyle = 'rgba(149,230,106,0.45)';
    ctx.fillRect(0, groundY, W, 55);

    // Grass top edge
    const grassGrad = ctx.createLinearGradient(0, groundY, 0, groundY + 10);
    grassGrad.addColorStop(0, '#6DD84A');
    grassGrad.addColorStop(1, 'rgba(109,216,74,0)');
    ctx.fillStyle = grassGrad;
    ctx.fillRect(0, groundY, W, 10);

    // Ground line
    ctx.fillStyle = 'rgba(95,200,60,0.7)';
    ctx.fillRect(0, groundY, W, 6);

    // Flowers
    this.flowers.forEach(f => {
      const fy = ((f.y - groundParallax * 0.5) % (H + 80) + H + 80) % (H + 80);
      ctx.fillStyle = f.color;
      ctx.beginPath();
      ctx.arc(f.x, fy, f.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FFE66D';
      ctx.beginPath();
      ctx.arc(f.x, fy, f.r * 0.4, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  update(camY) { this._camY = camY; }
}
