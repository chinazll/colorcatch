import { ease } from '../utils/easing.js';
import { lightenColor } from '../utils/utils.js';

// ─────────────────────────────────────────
// PARTICLE
// ─────────────────────────────────────────

export class Particle {
  constructor(x, y, color, type = 'jump') {
    this.x = x;
    this.y = y;
    this.color = color;
    this.type = type;
    this.alive = true;
    this.life = 1.0;
    this.decay = 0.03 + Math.random() * 0.02;

    if (type === 'jump') {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 2.5;
      this.vx = Math.cos(angle) * speed;
      this.vy = Math.sin(angle) * speed - 2;
      this.r = 3 + Math.random() * 3;
      this.decay = 0.04;
    } else if (type === 'score') {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.2;
      const speed = 3 + Math.random() * 3;
      this.vx = Math.cos(angle) * speed;
      this.vy = Math.sin(angle) * speed;
      this.r = 2 + Math.random() * 4;
      this.decay = 0.025;
      this.star = Math.random() > 0.5;
    } else if (type === 'eliminate') {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 5;
      this.vx = Math.cos(angle) * speed;
      this.vy = Math.sin(angle) * speed - 1;
      this.r = 4 + Math.random() * 6;
      this.decay = 0.02;
    } else if (type === 'trail') {
      this.vx = (Math.random() - 0.5) * 0.5;
      this.vy = -0.5 - Math.random() * 0.5;
      this.r = 2 + Math.random() * 2;
      this.decay = 0.08;
    }
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.08;
    this.vx *= 0.98;
    this.life -= this.decay;
    if (this.life <= 0) this.alive = false;
  }

  draw(ctx) {
    const alpha = Math.max(0, this.life);
    ctx.save();
    ctx.globalAlpha = alpha;
    if (this.type === 'score' && this.star) {
      ctx.fillStyle = this.color;
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 6;
      this._drawStar(ctx, this.x, this.y, 5, this.r, this.r * 0.5);
    } else {
      ctx.fillStyle = this.color;
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 4;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r * this.life, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  _drawStar(ctx, cx, cy, spikes, outerR, innerR) {
    let rot = Math.PI / 2 * 3;
    const step = Math.PI / spikes;
    ctx.beginPath();
    ctx.moveTo(cx, cy - outerR);
    for (let i = 0; i < spikes; i++) {
      ctx.lineTo(cx + Math.cos(rot) * outerR, cy + Math.sin(rot) * outerR);
      rot += step;
      ctx.lineTo(cx + Math.cos(rot) * innerR, cy + Math.sin(rot) * innerR);
      rot += step;
    }
    ctx.closePath();
    ctx.fill();
  }
}

// ─────────────────────────────────────────
// PARTICLE POOL
// ─────────────────────────────────────────

export class ParticlePool {
  constructor() {
    this.particles = [];
  }

  emit(x, y, color, type, count = 8) {
    for (let i = 0; i < count; i++) {
      this.particles.push(new Particle(x, y, color, type));
    }
  }

  update() {
    this.particles = this.particles.filter((p) => {
      p.update();
      return p.alive;
    });
  }

  draw(ctx) {
    this.particles.forEach((p) => p.draw(ctx));
  }
}

// ─────────────────────────────────────────
// SCORE POPUP
// ─────────────────────────────────────────

export class ScorePopup {
  constructor(x, y, text, color = '#FFD700') {
    this.x = x;
    this.y = y;
    this.text = text;
    this.color = color;
    this.life = 1.0;
    this.vy = -2.5;
    this.scale = 0.5;
    this.alive = true;
  }

  update() {
    this.y += this.vy;
    this.vy *= 0.95;
    this.life -= 0.025;
    if (this.life < 0.5) {
      this.scale = ease.outBack((1 - this.life * 2)) * 0.8 + 0.5;
    } else {
      this.scale = ease.outBack((this.life - 0.5) * 2) * 0.5 + 0.5;
    }
    if (this.life <= 0) this.alive = false;
  }

  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, this.life * 2);
    ctx.font = `bold ${Math.round(18 * this.scale)}px Nunito, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff';
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 4;
    ctx.fillText(this.text, this.x + 1, this.y + 1);
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 8;
    ctx.fillText(this.text, this.x, this.y);
    ctx.restore();
  }
}
