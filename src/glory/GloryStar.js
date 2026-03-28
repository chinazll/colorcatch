/**
 * GloryStar.js - Glory Candy golden star collectible
 * Rotating, floating, gold collect animation
 */
class GloryStar {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 12;
    this.rotation = Math.random() * Math.PI * 2;
    this.floatOffset = Math.random() * Math.PI * 2;
    this.collected = false;
    this.collectTimer = 0;
  }

  update(dt) {
    if (this.collected) {
      this.collectTimer += dt * 60;
      return;
    }
    this.rotation += 0.05 * dt * 60;
    this.floatOffset += 0.03 * dt * 60;
  }

  draw(ctx, camY) {
    const screenY = this.y - camY + Math.sin(this.floatOffset) * 3;
    if (screenY < -50 || screenY > 740) return;

    if (this.collected) {
      // Fade-out burst
      const progress = this.collectTimer / 15;
      if (progress >= 1) return;
      ctx.save();
      ctx.globalAlpha = 1 - progress;
      ctx.shadowColor = '#FFD700';
      ctx.shadowBlur = 30;
      ctx.beginPath();
      ctx.arc(this.x, screenY, this.radius + progress * 20, 0, Math.PI * 2);
      ctx.fillStyle = '#FFD700';
      ctx.fill();
      ctx.restore();
      return;
    }

    ctx.save();
    ctx.translate(this.x, screenY);
    ctx.rotate(this.rotation);
    ctx.shadowColor = '#FFD700';
    ctx.shadowBlur = 18;

    // Draw 5-pointed star
    const outerR = this.radius;
    const innerR = outerR * 0.45;
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const r = i % 2 === 0 ? outerR : innerR;
      const angle = (Math.PI / 5) * i - Math.PI / 2;
      const px = r * Math.cos(angle);
      const py = r * Math.sin(angle);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fillStyle = '#FFD700';
    ctx.fill();

    // White center glow
    ctx.beginPath();
    ctx.arc(0, 0, 3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.fill();

    ctx.restore();
  }

  collidesWith(player) {
    if (!player || this.collected) return false;
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    return dist < player.radius + this.radius + 5;
  }

  collect() { this.collected = true; }
}
export { GloryStar };
