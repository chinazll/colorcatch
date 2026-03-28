/**
 * GloryPlayer.js - Glory Candy glowing bouncing player
 * Elastic ball physics: GRAVITY, BOUNCE=0.95, MIN_VY=-10保证永动
 */
class GloryPlayer {
  constructor(x, y, W = 400) {
    this.x = x;
    this.y = y;
    this.W = W;
    this.radius = 14;
    this.vx = 0;
    this.vy = 0; // start still, fall onto first platform under gravity
    this.GRAVITY = 0.35;
    this.BOUNCE = 0.95;
    this.FRICTION = 0.985;
    this.MAX_VX = 12;
    this.MIN_VY = -10; // 保证每次弹跳都有足够的向上速度
    this.trail = []; // [{x,y}] last N positions
    this.breathPhase = 0;
    this.squash = 1;
  }

  update(dt, platforms) {
    // Store trail
    this.trail.push({ x: this.x, y: this.y });
    if (this.trail.length > 12) this.trail.shift();

    // Gravity
    this.vy += this.GRAVITY * dt * 60;

    // Friction
    this.vx *= Math.pow(this.FRICTION, dt * 60);

    // Position
    this.x += this.vx * dt * 60;
    this.y += this.vy * dt * 60;

    // Wall collision
    const W = 400;
    if (this.x < this.radius) { this.x = this.radius; this.vx = Math.abs(this.vx); }
    if (this.x > W - this.radius) { this.x = W - this.radius; this.vx = -Math.abs(this.vx); }

    // Platform collision - check position-based collision regardless of direction
    // If player's feet cross the platform surface from above, trigger bounce
    const feetY = this.y + this.radius;
    const prevFeetY = feetY - this.vy; // previous frame feet position
    for (const plat of platforms) {
      if (!plat) continue;
      const inX = this.x + this.radius > plat.x && this.x - this.radius < plat.x + plat.width;
      const atSurface = feetY >= plat.y && prevFeetY <= plat.y + 2;
      if (inX && atSurface && this.vy > 0) {
        this.y = plat.y - this.radius;
        this.vy = Math.max(this.MIN_VY, -Math.abs(this.vy) * this.BOUNCE);
        this.squash = 0.7;
        return 'bounce';
      }
    }

    // Squash/stretch animation recovery
    this.squash += (1 - this.squash) * 0.2;
    this.breathPhase += 0.04 * dt * 60;

    return null;
  }

  setDirection(dir) {
    if (dir === 'left') {
      this.vx = Math.max(-this.MAX_VX, this.vx - 4.5);
    } else if (dir === 'right') {
      this.vx = Math.min(this.MAX_VX, this.vx + 4.5);
    }
  }

  draw(ctx, camY) {
    const sx = this.x;
    const sy = this.y - camY;
    const breathAlpha = 0.3 + Math.abs(Math.sin(this.breathPhase)) * 0.4;

    // Trail
    for (let i = 0; i < this.trail.length; i++) {
      const t = this.trail[i];
      const alpha = (i / this.trail.length) * 0.4;
      const size = this.radius * (i / this.trail.length) * 0.8;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(t.x, t.y - camY, size, 0, Math.PI * 2);
      ctx.fillStyle = '#BF40FF';
      ctx.fill();
      ctx.restore();
    }

    ctx.save();
    // Breathing glow
    ctx.shadowColor = '#BF40FF';
    ctx.shadowBlur = 20;
    ctx.globalAlpha = breathAlpha;
    ctx.beginPath();
    ctx.arc(sx, sy, this.radius + 5, 0, Math.PI * 2);
    ctx.fillStyle = '#BF40FF';
    ctx.fill();
    ctx.restore();

    // Squash/stretch body
    const scaleX = 1 / this.squash;
    const scaleY = this.squash;
    ctx.save();
    ctx.translate(sx, sy);
    ctx.scale(scaleX, scaleY);
    const grad = ctx.createRadialGradient(-3, -3, 0, 0, 0, this.radius);
    grad.addColorStop(0, '#BF40FF');
    grad.addColorStop(1, '#8A2BE2');
    ctx.shadowColor = '#BF40FF';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    // Eyes
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.beginPath();
    ctx.arc(-4, -3, 3, 0, Math.PI * 2);
    ctx.arc(4, -3, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
export { GloryPlayer };
