// Particle.js — Particle system + score popups

import { drawStar, hexToRgb, rand, randInt } from '../utils/utils.js';

export class Particle {
  constructor(x, y, color, vx, vy, size, life, type = 'circle', gravity = 0.15) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.vx = vx;
    this.vy = vy;
    this.size = size;
    this.life = life;
    this.maxLife = life;
    this.type = type; // 'circle' | 'star'
    this.gravity = gravity;
    this.alpha = 1;
    this.rotation = rand(0, Math.PI * 2);
    this.rotationSpeed = rand(-0.1, 0.1);
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += this.gravity;
    this.life--;
    this.alpha = Math.max(0, this.life / this.maxLife);
    this.rotation += this.rotationSpeed;
  }

  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    if (this.type === 'star') {
      ctx.fillStyle = this.color;
      drawStar(ctx, 0, 0, this.size, this.size * 0.45, 0);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.arc(0, 0, this.size, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.fill();
    }
    ctx.restore();
  }

  get alive() {
    return this.life > 0;
  }
}

export class ScorePopup {
  constructor(x, y, text, color = '#FFE66D') {
    this.x = x;
    this.y = y;
    this.text = text;
    this.color = color;
    this.life = 60;
    this.maxLife = 60;
    this.scale = 0;
    this.targetScale = 1.4;
    this.startY = y;
    this.vy = -2;
  }

  update() {
    this.life--;
    this.y += this.vy;
    this.vy *= 0.95;
    const t = 1 - this.life / this.maxLife;
    if (t < 0.15) {
      this.scale = (t / 0.15) * this.targetScale;
    } else if (t < 0.25) {
      this.scale = this.targetScale * (1 - (t - 0.15) / 0.1 * 0.4);
    } else {
      this.scale = this.targetScale * 0.6;
    }
  }

  draw(ctx) {
    const alpha = Math.min(1, this.life / 20);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(this.x, this.y);
    ctx.scale(this.scale, this.scale);
    ctx.font = 'bold 22px Nunito, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeStyle = '#2D3436';
    ctx.lineWidth = 3;
    ctx.strokeText(this.text, 0, 0);
    ctx.fillStyle = this.color;
    ctx.fillText(this.text, 0, 0);
    ctx.restore();
  }

  get alive() {
    return this.life > 0;
  }
}

export class ParticleSystem {
  constructor() {
    this.particles = [];
    this.popups = [];
  }

  /** Generic emit — dispatches to named emitters */
  emit(x, y, type, color, count) {
    switch (type) {
      case 'jump':     return this.emitJump(x, y, color || '#fff');
      case 'score':    return this.emitScore(x, y);
      case 'eliminate': return this.emitEliminate(x, y, color || '#ff6b6b');
      case 'celebration': return this.emitCelebration();
      case 'trail':    return this.emitTrail(x, y, color || '#fff');
      default: {
        // Generic burst
        for (let i = 0; i < (count || 5); i++) {
          const angle = rand(0, Math.PI * 2);
          const speed = rand(1, 4);
          this.particles.push(new Particle(
            x, y, color || '#fff',
            Math.cos(angle) * speed,
            Math.sin(angle) * speed,
            rand(3, 7),
            randInt(20, 40),
            'circle',
            0.15
          ));
        }
      }
    }
  }

  emitJump(x, y, color) {
    for (let i = 0; i < 10; i++) {
      const angle = rand(0, Math.PI * 2);
      const speed = rand(2, 5);
      this.particles.push(new Particle(
        x, y, color,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed - 1,
        rand(3, 6),
        randInt(20, 35),
        'circle',
        0.18
      ));
    }
  }

  emitScore(x, y) {
    for (let i = 0; i < 12; i++) {
      const angle = -Math.PI / 2 + rand(-0.8, 0.8);
      const speed = rand(1.5, 4);
      this.particles.push(new Particle(
        x + rand(-10, 10), y,
        '#FFE66D',
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        rand(4, 8),
        randInt(30, 50),
        'star',
        0.05
      ));
    }
  }

  emitEliminate(x, y, color) {
    for (let i = 0; i < 15; i++) {
      const angle = rand(0, Math.PI * 2);
      const speed = rand(3, 7);
      this.particles.push(new Particle(
        x, y, color,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        rand(5, 10),
        randInt(25, 45),
        'circle',
        0.2
      ));
    }
  }

  emitCelebration() {
    // Full-screen gold particle burst for achievements
    const colors = ['#FFE66D', '#FFD93D', '#FF9F43', '#FF6B6B', '#FF85C1'];
    for (let i = 0; i < 80; i++) {
      const x = rand(0, 400);
      const angle = rand(-Math.PI, 0);
      const speed = rand(4, 12);
      this.particles.push(new Particle(
        x, rand(300, 640),
        colors[randInt(0, colors.length - 1)],
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        rand(5, 12),
        randInt(60, 100),
        'star',
        0.12
      ));
    }
  }

  emitTrail(x, y, color) {
    this.particles.push(new Particle(x, y, color, rand(-0.3, 0.3), rand(-0.3, 0.3), rand(2, 4), randInt(8, 15), 'circle', 0));
  }

  addPopup(popup) {
    this.popups.push(popup);
  }

  /** Add a score popup (world coords, camera-adjusted internally) */
  pop(worldX, worldY, text, color = '#FFE66D') {
    this.popups.push(new ScorePopup(worldX, worldY, text, color));
  }

  update() {
    this.particles = this.particles.filter(p => { p.update(); return p.alive; });
    this.popups = this.popups.filter(p => { p.update(); return p.alive; });
  }

  draw(ctx, camY = 0) {
    ctx.save();
    ctx.translate(0, -camY);
    for (const p of this.particles) p.draw(ctx);
    ctx.restore();
    for (const p of this.popups) p.draw(ctx);
  }
}
