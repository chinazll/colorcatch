/**
 * GloryParticles.js - 粒子系统
 * 复用现有 src/game/Particle.js 架构
 * 新增三种粒子类型: bounce, collect_star, trail
 */

export class GloryParticle {
  constructor(x, y, color, vx, vy, size, life, type = 'circle', gravity = 0.15) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.vx = vx;
    this.vy = vy;
    this.size = size;
    this.life = life;
    this.maxLife = life;
    this.type = type;
    this.gravity = gravity;
    this.alpha = 1;
    this.rotation = Math.random() * Math.PI * 2;
    this.rotationSpeed = (Math.random() - 0.5) * 0.2;
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
      this._drawStar(ctx, 0, 0, this.size, this.size * 0.45, 0);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.arc(0, 0, this.size, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.fill();
    }
    ctx.restore();
  }

  _drawStar(ctx, cx, cy, outer, inner, rotation) {
    const spikes = 5;
    ctx.beginPath();
    for (let i = 0; i < spikes * 2; i++) {
      const angle = (i * Math.PI) / spikes - Math.PI / 2 + rotation;
      const r = i % 2 === 0 ? outer : inner;
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
  }

  get alive() {
    return this.life > 0;
  }
}

export class GloryParticles {
  constructor() {
    this.particles = [];
  }

  _add(p) {
    this.particles.push(p);
  }

  // bounce: 平台碰撞火花，白色，8颗，向上喷射，持续 200ms
  emitBounce(x, y) {
    for (let i = 0; i < 8; i++) {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.8;
      const speed = 2 + Math.random() * 3;
      this._add(new GloryParticle(
        x, y,
        '#ffffff',
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        2 + Math.random() * 2,
        Math.floor(200 / 16.67), // ~200ms at 60fps
        'circle',
        0.1
      ));
    }
  }

  // collect_star: 星星收集金色爆发，12颗，向外扩散，持续 400ms
  emitCollectStar(x, y) {
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const speed = 3 + Math.random() * 2;
      this._add(new GloryParticle(
        x, y,
        '#FFD700',
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        3 + Math.random() * 2,
        Math.floor(400 / 16.67), // ~400ms
        'star',
        0.05
      ));
    }
  }

  // trail: 角色拖尾，紫色渐隐，跟随位置
  emitTrail(x, y) {
    this._add(new GloryParticle(
      x, y,
      '#BF40FF',
      (Math.random() - 0.5) * 0.5,
      (Math.random() - 0.5) * 0.5,
      6,
      Math.floor(200 / 16.67),
      'circle',
      0
    ));
  }

  update() {
    this.particles = this.particles.filter(p => {
      p.update();
      return p.alive;
    });
  }

  draw(ctx) {
    for (const p of this.particles) {
      p.draw(ctx);
    }
  }
}
