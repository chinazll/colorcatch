/**
 * GloryPlatform.js - 发光平台
 * 彩色发光糖果条，支持顶部碰撞检测
 */

export class GloryPlatform {
  constructor(x, y, width, color) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = 12;
    this.color = color || this._randColor();
  }

  _randColor() {
    const pool = ['#00BFFF', '#BF40FF', '#FF69B4', '#FFD700'];
    return pool[Math.floor(Math.random() * pool.length)];
  }

  _lightenColor(hex, amount) {
    const r = Math.min(255, parseInt(hex.slice(1, 3), 16) + amount);
    const g = Math.min(255, parseInt(hex.slice(3, 5), 16) + amount);
    const b = Math.min(255, parseInt(hex.slice(5, 7), 16) + amount);
    return `rgb(${r},${g},${b})`;
  }

  // 碰撞检测: 仅顶部碰撞
  collidesWith(player) {
    const px = player.x;
    const py = player.y;
    const pr = player.radius;
    const pvy = player.vy;

    // 玩家在平台水平范围内
    const inX = px + pr > this.x && px - pr < this.x + this.width;
    // 玩家正在下落
    const falling = pvy > 0;
    // 玩家下边缘刚好接触平台顶部的阈值
    const atTop = py + pr >= this.y && py + pr <= this.y + this.height + pvy;

    return inX && falling && atTop;
  }

  draw(ctx) {
    const { x, y, width, height, color } = this;
    const radius = 6;

    ctx.save();

    // 发光描边
    ctx.shadowColor = color;
    ctx.shadowBlur = 8;
    ctx.strokeStyle = this._lightenColor(color, 40);
    ctx.lineWidth = 2;

    // 圆角矩形
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();

    ctx.fillStyle = color;
    ctx.fill();
    ctx.stroke();

    ctx.shadowBlur = 0;

    // 顶部高光条
    ctx.globalAlpha = 0.2;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x + radius, y + 1, width - radius * 2, 3);

    ctx.restore();
  }
}
