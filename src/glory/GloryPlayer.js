/**
 * GloryPlayer.js - 糖果战士
 * 永动弹球物理 + 紫色发光球体 + 呼吸光环 + 拖尾
 */

export class GloryPlayer {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = -12; // JUMP_SPEED

    // 物理参数
    this.GRAVITY   = 0.35;
    this.JUMP_SPEED = -12;
    this.BOUNCE    = 0.95;
    this.MIN_VY    = -10;  // 保证最低弹跳速度，防止能量衰减使游戏停止
    this.FRICTION  = 0.985;
    this.MAX_VX    = 12;

    this.radius = 14;
    this.direction = null; // 'left' | 'right' | null

    // 冷却
    this._lastDirTime = 0;
    this._dirCooldown = 100; // ms

    // 呼吸光环
    this._breathPhase = 0;
    this._breathPeriod = 1500; // ms

    // 拖尾
    this.trail = [];
    this._maxTrail = 12;
  }

  setDirection(dir) {
    const now = Date.now();
    if (now - this._lastDirTime < this._dirCooldown) return;
    this._lastDirTime = now;

    if (dir === 'left') {
      this.vx -= 4.5;
    } else if (dir === 'right') {
      this.vx += 4.5;
    }
    // Clamp
    this.vx = Math.max(-this.MAX_VX, Math.min(this.MAX_VX, this.vx));
  }

  update(dt, platforms, W) {
    // 重力
    this.vy += this.GRAVITY;

    // 摩擦
    this.vx *= this.FRICTION;

    // 位置更新
    this.x += this.vx;
    this.y += this.vy;

    // 平台碰撞
    for (const plat of platforms) {
      if (plat.collidesWith(this)) {
        this.vy = Math.max(this.MIN_VY, -Math.abs(this.vy) * this.BOUNCE);
        this.y = plat.y - this.radius;
        return { bounced: true, x: this.x, y: this.y };
      }
    }

    // 边界水平反弹
    if (this.x - this.radius < 0) {
      this.x = this.radius;
      this.vx = Math.abs(this.vx) * 0.5;
    }
    if (this.x + this.radius > W) {
      this.x = W - this.radius;
      this.vx = -Math.abs(this.vx) * 0.5;
    }

    // 拖尾更新
    this.trail.unshift({ x: this.x, y: this.y });
    if (this.trail.length > this._maxTrail) {
      this.trail.pop();
    }

    return { bounced: false };
  }

  draw(ctx) {
    const { x, y, radius } = this;

    // 拖尾
    for (let i = this.trail.length - 1; i >= 0; i--) {
      const t = this.trail[i];
      const alpha = (1 - i / this.trail.length) * 0.4;
      const size = radius * (1 - i / this.trail.length) * 0.8;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(t.x, t.y, size, 0, Math.PI * 2);
      ctx.fillStyle = '#8A2BE2';
      ctx.fill();
      ctx.restore();
    }

    ctx.save();
    ctx.translate(x, y);

    // 呼吸光环
    const breathT = ((Date.now() % this._breathPeriod) / this._breathPeriod);
    const breathAlpha = 0.3 + 0.4 * (0.5 + 0.5 * Math.sin(breathT * Math.PI * 2));
    ctx.globalAlpha = breathAlpha;
    ctx.beginPath();
    ctx.arc(0, 0, 18, 0, Math.PI * 2);
    ctx.fillStyle = '#BF40FF';
    ctx.fill();

    // 主体球
    ctx.globalAlpha = 1;
    const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
    grad.addColorStop(0, '#BF40FF');
    grad.addColorStop(1, '#8A2BE2');
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    // 高光
    ctx.beginPath();
    ctx.arc(-radius * 0.3, -radius * 0.3, radius * 0.35, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fill();

    ctx.restore();
  }
}
