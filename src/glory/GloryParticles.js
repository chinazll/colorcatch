/**
 * GloryParticles.js - Glory Candy particle system
 * Types: bounce (white sparks), collect_star (gold burst), trail (purple)
 */
class GloryParticles {
  constructor() {
    this.particles = [];
  }

  emit(x, y, type, extra) {
    if (type === 'bounce') {
      for (let i = 0; i < 8; i++) {
        const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI;
        const speed = 2 + Math.random() * 3;
        this.particles.push({
          x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
          life: 1, maxLife: 12, size: 2 + Math.random() * 2,
          color: '#ffffff', type
        });
      }
    } else if (type === 'collect_star') {
      for (let i = 0; i < 12; i++) {
        const angle = (Math.PI * 2 / 12) * i;
        const speed = 3 + Math.random() * 2;
        this.particles.push({
          x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
          life: 1, maxLife: 24, size: 3 + Math.random() * 3,
          color: '#FFD700', type
        });
      }
    } else if (type === 'trail') {
      this.particles.push({
        x, y, vx: 0, vy: 0,
        life: 1, maxLife: 12, size: 6,
        color: '#BF40FF', type
      });
    }
  }

  update(dt) {
    const decay = 1 / 12;
    this.particles = this.particles.filter(p => {
      p.life -= decay * dt * 60;
      p.x += p.vx * dt * 60;
      p.y += p.vy * dt * 60;
      p.vy += 0.05 * dt * 60;
      return p.life > 0;
    });
    // Cap at 200
    if (this.particles.length > 200) {
      this.particles = this.particles.slice(-200);
    }
  }

  draw(ctx, camY) {
    for (const p of this.particles) {
      const screenY = p.y - camY;
      if (screenY < -50 || screenY > 740) continue;
      ctx.save();
      ctx.globalAlpha = p.life;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(p.x, screenY, p.size * p.life, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
      ctx.restore();
    }
  }
}
export { GloryParticles };
