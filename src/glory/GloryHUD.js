/**
 * GloryHUD.js - Glory Candy score/time HUD
 */
class GloryHUD {
  constructor() {
    this.score = 0;
    this.startTime = Date.now();
    this.combo = 0;
    this.comboTimer = 0;
    this.playerColor = '#FFD700';
  }

  setScore(score) { this.score = score; }
  setCombo(c) { this.combo = c; this.comboTimer = 90; }
  setPlayerColor(color) { this.playerColor = color; }

  update(dt) {
    if (this.comboTimer > 0) this.comboTimer -= dt * 60;
  }

  draw(ctx) {
    const W = 400;
    const H = 640;

    // Score (top-left)
    ctx.font = 'bold 22px Nunito, sans-serif';
    ctx.fillStyle = '#FFD700';
    ctx.shadowColor = '#FFD700';
    ctx.shadowBlur = 8;
    ctx.fillText('★ ' + this.score, 12, 36);
    ctx.shadowBlur = 0;

    // Time (top-right)
    const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
    const mm = String(Math.floor(elapsed / 60)).padStart(2, '0');
    const ss = String(elapsed % 60).padStart(2, '0');
    ctx.font = 'bold 16px Nunito, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fillText(mm + ':' + ss, W - 52, 34);

    // Combo (bottom-center, fades out)
    if (this.comboTimer > 0 && this.combo >= 3) {
      const alpha = Math.min(1, this.comboTimer / 30);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = 'bold 18px Nunito, sans-serif';
      ctx.fillStyle = '#FFD700';
      ctx.shadowColor = '#FFD700';
      ctx.shadowBlur = 12;
      ctx.textAlign = 'center';
      ctx.fillText('x' + this.combo + ' COMBO!', W / 2, H - 32);
      ctx.shadowBlur = 0;
      ctx.restore();
    }
  }
}
export { GloryHUD };
