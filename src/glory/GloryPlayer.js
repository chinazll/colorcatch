/**
 * GloryPlayer.js - Glory Candy glowing bouncing player
 * Doodle Jump style: tap = jump, gravity = fall, bounce on platform
 */
class GloryPlayer {
  constructor(x, y, W = 400) {
    this.x = x;
    this.y = y;
    this.W = W;
    this.radius = 14;
    this.vx = 0;
    this.vy = 0;
    this.GRAVITY = 0.45;      // fall speed
    this.JUMP_VY = -13;       // jump impulse (negative = upward)
    this.BOUNCE = 0.0;        // no auto-bounce, only player-triggered jumps
    this.FRICTION = 0.985;
    this.MAX_VX = 12;
    this.trail = [];
    this.breathPhase = 0;
    this.squash = 1;
    this.onGround = false;
  }

  jump() {
    // Can jump only when on ground (or recently landed)
    if (this.onGround) {
      this.vy = this.JUMP_VY;
      this.onGround = false;
      this.squash = 1.4; // stretch on jump
      return true;
    }
    return false;
  }

  update(dt, platforms) {
    // Store trail
    this.trail.push({ x: this.x, y: this.y });
    if (this.trail.length > 12) this.trail.shift();

    // Clamp dt to avoid physics explosion on tab-switch / lag frames
    dt = Math.min(dt, 0.05);

    // Capture position and velocity BEFORE this frame's physics
    const prevY = this.y;
    const vyPrev = this.vy;

    // Assume NOT on ground until collision proves otherwise
    this.onGround = false;

    // Gravity
    this.vy += this.GRAVITY * dt * 60;

    // Friction
    this.vx *= Math.pow(this.FRICTION, dt * 60);

    // Position
    this.x += this.vx * dt * 60;
    this.y += this.vy * dt * 60;

    // Wall bounce
    const W = 400;
    if (this.x < this.radius) { this.x = this.radius; this.vx = Math.abs(this.vx) * 0.5; }
    if (this.x > W - this.radius) { this.x = W - this.radius; this.vx = -Math.abs(this.vx) * 0.5; }

    // Platform collision - use ACTUAL previous frame position (prevY) and velocity (vyPrev)
    for (const plat of platforms) {
      if (!plat) continue;
      const inX = this.x + this.radius > plat.x && this.x - this.radius < plat.x + plat.width;
      const curFeetY = this.y + this.radius;
      const prevFeetY = prevY + this.radius;

      // CASE 1: Player crossed platform surface from above this frame (normal landing)
      // prevFeetY was ABOVE platform top, curFeetY is AT or BELOW
      const crossedDown = prevFeetY < plat.y && curFeetY >= plat.y;

      // CASE 2: Player is already inside platform from a previous frame
      // (safety net for high-speed falls that skip through in one frame)
      const insidePlatform = curFeetY > plat.y && inX;

      if (inX && (crossedDown || insidePlatform) && vyPrev >= 0) {
        this.y = plat.y - this.radius;
        this.vy = 0;
        this.onGround = true;
        this.squash = 0.65;
        return 'land';
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
