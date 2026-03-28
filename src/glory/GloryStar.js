/**
 * GloryStar.js - 金色星星
 * 旋转五角星，支持收集检测和特效触发
 */

export class GloryStar {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.baseY = y;
    this.radius = 12;
    this.innerRadius = 5;
    this.rotation = Math.random() * Math.PI * 2;
    this.rotationSpeed = 2; // rad/s
    this.floatPhase = Math.random() * Math.PI * 2;
    this.floatAmplitude = 3;
    this.floatPeriod = 1000; // ms
    this.collected = false;
  }

  update(dt) {
    // dt in seconds
    this.rotation += this.rotationSpeed * dt;
    const t = (Date.now() % this.floatPeriod) / this.floatPeriod;
    this.y = this.baseY + Math.sin(t * Math.PI * 2 + this.floatPhase) * this.floatAmplitude;
  }

  // 收集判定
  collidesWith(player) {
    if (this.collected) return false;
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    return dist < player.radius + this.radius + 5;
  }

  collect() {
    this.collected = true;
  }

  _drawStarShape(ctx, cx, cy, outer, inner) {
    const spikes = 5;
    ctx.beginPath();
    for (let i = 0; i < spikes * 2; i++) {
      const angle = (i * Math.PI) / spikes - Math.PI / 2 + this.rotation;
      const r = i % 2 === 0 ? outer : inner;
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
  }

  draw(ctx) {
    if (this.collected) return;

    const { x, y, radius, innerRadius } = this;

    ctx.save();

    // 发光
    ctx.shadowColor = '#FFD700';
    ctx.shadowBlur = 12;

    // 五角星
    ctx.fillStyle = '#FFD700';
    this._drawStarShape(ctx, x, y, radius, innerRadius);
    ctx.fill();

    ctx.shadowBlur = 0;

    // 中心白色高光
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    // 4条光芒射线
    ctx.strokeStyle = '#FFD700';
    ctx.globalAlpha = 0.4;
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2 + this.rotation;
      const inner = radius + 2;
      const outer = radius + 8;
      ctx.beginPath();
      ctx.moveTo(x + Math.cos(angle) * inner, y + Math.sin(angle) * inner);
      ctx.lineTo(x + Math.cos(angle) * outer, y + Math.sin(angle) * outer);
      ctx.stroke();
    }

    ctx.restore();
  }
}
