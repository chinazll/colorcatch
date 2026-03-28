/**
 * GloryBackground.js - 深色星空背景
 * 渲染永夜空渐变背景 + 静态星尘粒子
 */

export class GloryBackground {
  constructor(W, H) {
    this.W = W;
    this.H = H;
    this.stars = [];
    this._generateStars();
  }

  _generateStars() {
    const count = 30 + Math.floor(Math.random() * 21); // 30~50
    for (let i = 0; i < count; i++) {
      this.stars.push({
        x: Math.random() * this.W,
        y: Math.random() * this.H,
        size: 1 + Math.random(),
        alpha: 0.3 + Math.random() * 0.4,
      });
    }
  }

  draw(ctx) {
    // 背景渐变
    const grad = ctx.createLinearGradient(0, 0, 0, this.H);
    grad.addColorStop(0, '#0a1628');
    grad.addColorStop(1, '#1a2a4a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this.W, this.H);

    // 静态星尘
    for (const s of this.stars) {
      ctx.save();
      ctx.globalAlpha = s.alpha;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
}
