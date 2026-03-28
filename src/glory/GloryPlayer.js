/**
 * GloryPlayer.js - Glory Candy glowing bouncing player
 * Doodle Jump style: auto-bounce on platform landing (no tap needed to jump)
 * Tap = left/right direction control
 */
class GloryPlayer {
  constructor(x, y, W = 400) {
    this.x = x;
    this.y = y;
    this.W = W;
    this.radius = 14;
    this.vx = 0;
    this.vy = 0;
    // Physics - tuned so player falls naturally and bounces
    this.GRAVITY = 0.25;       // gentler fall
    this.BOUNCE = 0.75;        // auto-bounce when landing (Doodle Jump style)
    this.FRICTION = 0.985;
    this.MAX_VX = 12;
    this.trail = [];
    this.breathPhase = 0;
    this.squash = 1;
  }

  update(dt, platforms) {
    // Store trail
    this.trail.push({ x: this.x, y: this.y });
    if (this.trail.length > 12) this.trail.shift();

    // Clamp dt to avoid physics explosion on tab-switch / lag frames
    dt = Math.min(dt, 0.05);

    // Gravity
    this.vy += this.GRAVITY * dt * 60;

    // Friction
    this.vx *= Math.pow(this.FRICTION, dt * 60);

    // Position
    this.x += this.vx * dt * 60;
    this.y += this.vy * dt * 60;

    // Wall bounce
    if (this.x < this.radius) { this.x = this.radius; this.vx = Math.abs(this.vx) * 0.5; }
    if (this.x > this.W - this.radius) { this.x = this.W - this.radius; this.vx = -Math.abs(this.vx) * 0.5; }

    // Platform collision - Doodle Jump style:
    // Only trigger when player is FALLING (vy > 0) and feet cross platform from above
    for (const plat of platforms) {
      if (!plat) continue;
      const inX = this.x + this.radius > plat.x && this.x - this.radius < plat.x + plat.width;
      if (!inX) continue;

      const feetY = this.y + this.radius;
      const prevFeetY = feetY - this.vy * dt * 60;
      
      // Normal landing: player was above platform, now at or below platform top
      const landed = prevFeetY <= plat.y && feetY >= plat.y && this.vy > 0;
      // Safety: player already inside platform (high-speed fallthrough)
      const inside = feetY > plat.y && this.vy > 0;

      if (landed || inside) {
        // Place player on top of platform
        this.y = plat.y - this.radius;
        // Bounce - Doodle Jump style: reverse vy with damping
        this.vy = -this.vy * this.BOUNCE;
        // Ensure minimum upward velocity after bounce
        if (this.vy > -4) this.vy = -4;
        this.squash = 0.65;
        return 'bounce';
      }
    }

    // Squash/stretch animation recovery
    this.squash += (1 - this.squash) * 0.15;
    this.breathPhase += 0.04 * dt * 60;

    return null;
  }

  setDirection(dir) {
    if (dir === 'left') {
      this.vx = Math.max(-this.MAX_VX, this.vx - 5);
    } else if (dir === 'right') {
      this.vx = Math.min(this.MAX_VX, this.vx + 5);
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
