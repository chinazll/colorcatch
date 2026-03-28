/**
 * GloryHUD.js - 分数 HUD
 * 左上角: 星星图标 + 分数
 * 右上角: 存活时间 mm:ss
 * 底部: 连击数 "x3" (金色, 透明度随连击消失)
 */

export class GloryHUD {
  constructor(W, H) {
    this.W = W;
    this.H = H;
    this.score = 0;
    this.startTime = 0;
    this.combo = 0;
    this.comboTimer = 0;
    this.comboMaxTimer = 90; // frames (~1.5s at 60fps)
  }

  reset() {
    this.score = 0;
    this.startTime = Date.now();
    this.combo = 0;
    this.comboTimer = 0;
  }

  addStar() {
    this.score += 10 + (this.combo > 0 ? this.combo * 2 : 0);
    this.combo++;
    this.comboTimer = this.comboMaxTimer;
  }

  update() {
    if (this.comboTimer > 0) {
      this.comboTimer--;
      if (this.comboTimer === 0) {
        this.combo = 0;
      }
    }
  }

  getElapsedSeconds() {
    return Math.floor((Date.now() - this.startTime) / 1000);
  }

  formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  _drawStar(ctx, cx, cy, r) {
    const spikes = 5;
    const outer = r;
    const inner = r * 0.4;
    ctx.beginPath();
    for (let i = 0; i < spikes * 2; i++) {
      const angle = (i * Math.PI) / spikes - Math.PI / 2;
      const radius = i % 2 === 0 ? outer : inner;
      const x = cx + Math.cos(angle) * radius;
      const y = cy + Math.sin(angle) * radius;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
  }

  draw(ctx) {
    // 左上角: 星星图标 + 分数
    ctx.save();
    ctx.fillStyle = '#FFD700';
    ctx.strokeStyle = '#FFD700';
    this._drawStar(ctx, 28, 28, 10);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px sans-serif';
    ctx.textBaseline = 'top';
    ctx.fillText(this.score, 46, 16);
    ctx.restore();

    // 右上角: 存活时间
    const elapsed = this.getElapsedSeconds();
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillText(this.formatTime(elapsed), this.W - 16, 16);
    ctx.restore();

    // 底部: 连击数
    if (this.combo > 1) {
      const alpha = this.comboTimer / this.comboMaxTimer;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#FFD700';
      ctx.font = 'bold 18px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(`x${this.combo}`, this.W / 2, this.H - 16);
      ctx.restore();
    }
  }
}
