/**
 * GloryMenu.js - Glory Candy start menu
 * Frosted glass + gold title + bouncing character preview
 */
class GloryMenu {
  constructor(onStart, onToggleSound) {
    this.onStart = onStart;
    this.onToggleSound = onToggleSound;
    this.time = 0;
    this.previewY = 0;
    this.previewVY = -0.1;
  }

  update(dt) {
    this.time += dt;
    this.previewY += this.previewVY;
    if (this.previewY < -20 || this.previewY > 20) this.previewVY *= -1;
  }

  draw(ctx) {
    const W = 400;
    const H = 640;
    ctx.fillStyle = 'rgba(10,22,40,0.92)';
    ctx.fillRect(0, 0, W, H);

    // Title
    ctx.save();
    ctx.font = 'bold 34px Nunito, sans-serif';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#FFD700';
    ctx.shadowBlur = 22;
    ctx.fillStyle = '#FFD700';
    ctx.fillText('★ 荣耀糖糖 ★', W / 2, H * 0.22);
    ctx.restore();

    // Subtitle
    ctx.save();
    ctx.font = '16px Nunito, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#FF9EC4';
    ctx.fillText('糖果收集', W / 2, H * 0.22 + 36);
    ctx.restore();

    // Character preview (bouncing purple ball)
    const px = W / 2;
    const py = H * 0.45 + this.previewY;
    const grad = ctx.createRadialGradient(px - 3, py - 3, 0, px, py, 14);
    grad.addColorStop(0, '#BF40FF');
    grad.addColorStop(1, '#8A2BE2');
    ctx.save();
    ctx.shadowColor = '#BF40FF';
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(px, py, 14, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.restore();

    // Buttons
    this._drawButton(ctx, W / 2, H * 0.68, 200, 44, '开始游戏', true, this.onStart);
    this._drawButton(ctx, W / 2, H * 0.78, 160, 40, '音效开关', false, this.onToggleSound);

    // High score
    const hs = localStorage.getItem('glory_highscore') || 0;
    ctx.save();
    ctx.font = '14px Nunito, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255,215,0,0.8)';
    ctx.fillText('最高分: ' + hs, W / 2, H * 0.90);
    ctx.restore();
  }

  _drawButton(ctx, cx, cy, w, h, label, gold, cb) {
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(cx - w / 2, cy - h / 2, w, h, 10);
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fill();
    ctx.strokeStyle = gold ? '#FFD700' : 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.font = 'bold 16px Nunito, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = gold ? '#FFD700' : 'rgba(255,255,255,0.7)';
    ctx.fillText(label, cx, cy);
    ctx.restore();
    this._buttonAreas = this._buttonAreas || [];
    this._buttonAreas.push({ x: cx - w / 2, y: cy - h / 2, w, h, cb });
  }

  handleClick(cx, cy) {
    if (!this._buttonAreas) return;
    for (const b of this._buttonAreas) {
      if (cx >= b.x && cx <= b.x + b.w && cy >= b.y && cy <= b.y + b.h) {
        if (b.cb) b.cb();
        break;
      }
    }
  }
}
export { GloryMenu };
