/**
 * GloryGameOver.js - Glory Candy game over screen
 * Dark overlay + score card + restart/home buttons
 */
class GloryGameOver {
  constructor(score, onRestart, onMenu) {
    this.score = score;
    this.onRestart = onRestart;
    this.onMenu = onMenu;
    this._buttons = [];
  }

  draw(ctx) {
    const W = 400;
    const H = 640;

    ctx.fillStyle = 'rgba(6,12,28,0.88)';
    ctx.fillRect(0, 0, W, H);

    // Title
    ctx.save();
    ctx.font = 'bold 30px Nunito, sans-serif';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#FF5555';
    ctx.shadowBlur = 16;
    ctx.fillStyle = '#FF5555';
    ctx.fillText('游戏结束', W / 2, H * 0.25);
    ctx.restore();

    // Score card
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(W / 2 - 140, H * 0.32, 280, 160, 16);
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,215,0,0.4)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    const hs = localStorage.getItem('glory_highscore') || 0;
    ctx.font = '22px Nunito, sans-serif';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#FFD700';
    ctx.shadowBlur = 8;
    ctx.fillStyle = '#FFD700';
    ctx.fillText('本局: ' + this.score, W / 2, H * 0.38 + 20);
    ctx.shadowBlur = 0;
    ctx.font = '14px Nunito, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.fillText('最高: ' + Math.max(hs, this.score), W / 2, H * 0.38 + 50);
    ctx.restore();

    // Buttons
    this._buttons = [];
    this._drawBtn(ctx, W / 2, H * 0.68, 200, 46, '再来一局', true, this.onRestart);
    this._drawBtn(ctx, W / 2, H * 0.78, 160, 42, '主菜单', false, this.onMenu);
  }

  _drawBtn(ctx, cx, cy, w, h, label, gold, cb) {
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
    this._buttons.push({ x: cx - w / 2, y: cy - h / 2, w, h, cb });
  }

  handleClick(cx, cy) {
    for (const b of this._buttons) {
      if (cx >= b.x && cx <= b.x + b.w && cy >= b.y && cy <= b.y + b.h) {
        if (b.cb) b.cb();
        break;
      }
    }
  }
}
export { GloryGameOver };
