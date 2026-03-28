// ─────────────────────────────────────────────
//  HUD.js — Candy Crush style score/combo/level display
// ─────────────────────────────────────────────

import { Storage } from '../game/Storage.js';

export class HUD {
  constructor(W, H) {
    this.W = W;
    this.H = H;
    this.displayScore = 0;
    this.targetScore = 0;
    this.scorePopTimer = 0;
    this.lastScoreDelta = 0;
    this.comboDisplay = 0;
    this.comboAlpha = 0;
    this.comboScale = 0;
    this.level = 1;
    this.levelUpFlash = 0;
    this.scorePopScale = 0;
    this.scorePopX = W / 2;
    this.scorePopY = H * 0.3;
    this.comboScaleX = 0;
    this.storage = new Storage();
    this.stars = this.storage.getStars();
    this.highScore = this.storage.getHighScore();
    this.time = 0;
  }

  refreshFromStorage() {
    this.stars = this.storage.getStars();
    this.highScore = this.storage.getHighScore();
  }

  onScore(delta, x, y) {
    this.targetScore += delta;
    this.lastScoreDelta = delta;
    this.scorePopTimer = 1.0;
    this.scorePopX = x || this.W / 2;
    this.scorePopY = y || this.H * 0.35;
    this.scorePopScale = 0;
  }

  onCombo(count) {
    this.comboDisplay = count;
    this.comboAlpha = 1.0;
    this.comboScale = 0;
    this.comboScaleX = 0;
  }

  onLevelUp(level) {
    this.level = level;
    this.levelUpFlash = 1.0;
  }

  update(dt) {
    this.time += dt;
    const scoreDiff = this.targetScore - this.displayScore;
    this.displayScore += scoreDiff * 0.15;
    if (Math.abs(scoreDiff) < 0.5) this.displayScore = this.targetScore;

    if (this.scorePopTimer > 0) {
      this.scorePopTimer -= dt * 1.5;
      this.scorePopScale = Math.min(1, this.scorePopScale + dt * 9);
    }
    if (this.comboScale < 1) this.comboScale = Math.min(1, this.comboScale + dt * 10);
    if (this.comboScaleX < 1) this.comboScaleX = Math.min(1, this.comboScaleX + dt * 12);
    if (this.comboAlpha > 0 && this.comboDisplay === 0) this.comboAlpha -= dt * 2;
    if (this.levelUpFlash > 0) this.levelUpFlash -= dt * 1.2;
  }

  _drawStar(ctx, cx, cy, r) {
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const angle = (Math.PI / 5) * i - Math.PI / 2;
      const ri = i % 2 === 0 ? r : r * 0.45;
      const px = cx + ri * Math.cos(angle);
      const py = cy + ri * Math.sin(angle);
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
  }

  draw(ctx) {
    const W = this.W;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    // ── Score pill ───────────────────────────────────────
    const scoreText = Math.floor(this.displayScore).toString();
    ctx.font = 'bold 30px Nunito, sans-serif';
    const tw = ctx.measureText(scoreText).width;
    const pillW = tw + 52;
    const pillH = 46;
    const pillX = W / 2 - pillW / 2;
    const pillY = 10;

    // Shadow
    ctx.shadowColor = 'rgba(255,107,157,0.35)';
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 3;

    // Pill background (pink gradient)
    const pillGrad = ctx.createLinearGradient(pillX, pillY, pillX, pillY + pillH);
    pillGrad.addColorStop(0, '#FF9F6B');
    pillGrad.addColorStop(1, '#FF6B9D');
    ctx.fillStyle = pillGrad;
    ctx.beginPath();
    ctx.roundRect(pillX, pillY, pillW, pillH, pillH / 2);
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    // Inner shine
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.beginPath();
    ctx.roundRect(pillX + 4, pillY + 3, pillW - 8, pillH / 2 - 3, 10);
    ctx.fill();

    // Score text
    ctx.fillStyle = '#fff';
    ctx.fillText(scoreText, W / 2, pillY + 9);

    // Score label
    ctx.font = '11px Nunito, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fillText('分数', W / 2, pillY + pillH + 3);

    // ── Stars (top-left) ───────────────────────────────
    ctx.save();
    ctx.textAlign = 'left';
    const starX = 14, starY = 12;

    ctx.shadowColor = 'rgba(255,200,0,0.5)';
    ctx.shadowBlur = 8;
    ctx.fillStyle = '#FFD166';
    this._drawStar(ctx, starX + 10, starY + 11, 11);
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;

    ctx.font = 'bold 15px Nunito, sans-serif';
    ctx.fillStyle = '#fff';
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = 3;
    ctx.fillText(`${this.stars}`, starX + 26, starY + 1);
    ctx.restore();

    // ── High score (top-right) ──────────────────────────
    ctx.save();
    ctx.textAlign = 'right';
    ctx.font = 'bold 13px Nunito, sans-serif';
    ctx.fillStyle = 'rgba(255,240,180,0.95)';
    ctx.shadowColor = 'rgba(0,0,0,0.25)';
    ctx.shadowBlur = 2;
    ctx.fillText(`最高 ${this.highScore}`, W - 16, 14);
    ctx.restore();

    // ── Level badge ────────────────────────────────────
    ctx.save();
    ctx.textAlign = 'right';
    ctx.font = 'bold 17px Nunito, sans-serif';
    ctx.fillStyle = '#2D3436';
    ctx.shadowColor = 'rgba(255,255,255,0.5)';
    ctx.shadowBlur = 0;
    ctx.fillText(`Lv.${this.level}`, W - 16, 32);
    ctx.restore();

    // ── Level-up flash ────────────────────────────────
    if (this.levelUpFlash > 0) {
      ctx.globalAlpha = this.levelUpFlash * 0.45;
      const flashGrad = ctx.createRadialGradient(W/2, this.H/2, 0, W/2, this.H/2, this.H * 0.6);
      flashGrad.addColorStop(0, '#FFD166');
      flashGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = flashGrad;
      ctx.fillRect(0, 0, W, this.H);
      ctx.globalAlpha = this.levelUpFlash;
      ctx.font = 'bold 40px Nunito, sans-serif';
      ctx.fillStyle = '#fff';
      ctx.shadowColor = 'rgba(255,107,107,0.8)';
      ctx.shadowBlur = 20;
      ctx.fillText(`第 ${this.level} 关`, W / 2, this.H / 2 - 45);
      ctx.globalAlpha = 1;
    }

    // ── Score pop (+N) ───────────────────────────────
    if (this.scorePopTimer > 0) {
      const alpha = Math.min(1, this.scorePopTimer * 2);
      ctx.globalAlpha = alpha;
      ctx.save();
      ctx.translate(this.scorePopX, this.scorePopY);
      const scY = 0.5 + this.scorePopScale * 0.9;
      const scX = 0.7 + this.scorePopScale * 0.3;
      ctx.scale(scX, scY);
      ctx.font = 'bold 24px Nunito, sans-serif';
      ctx.fillStyle = '#FFD166';
      ctx.strokeStyle = 'rgba(0,0,0,0.3)';
      ctx.lineWidth = 3;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const text = `+${this.lastScoreDelta}`;
      ctx.strokeText(text, 0, 0);
      ctx.fillText(text, 0, 0);
      ctx.restore();
      ctx.globalAlpha = 1;
    }

    // ── Combo display ─────────────────────────────────
    if (this.comboDisplay >= 2 && this.comboAlpha > 0) {
      ctx.globalAlpha = Math.min(this.comboAlpha, 1);
      ctx.save();
      ctx.translate(W / 2, this.H * 0.18);
      const sc = 0.5 + this.comboScale * 0.75;
      const sx = 0.6 + this.comboScaleX * 0.4;
      ctx.scale(sx * sc, sc);

      const comboColors = ['#FF6B6B','#FF9F1C','#FFD166','#95E66A','#4ECDC4','#C44AFF'];
      const c = comboColors[Math.min(this.comboDisplay - 2, comboColors.length - 1)];

      ctx.font = 'bold 30px Nunito, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Glow
      ctx.shadowColor = c;
      ctx.shadowBlur = 16;

      // Outline
      ctx.strokeStyle = 'rgba(255,255,255,0.9)';
      ctx.lineWidth = 3;
      const comboText = `${this.comboDisplay}x COMBO!`;
      ctx.strokeText(comboText, 0, 0);

      // Fill
      ctx.fillStyle = c;
      ctx.fillText(comboText, 0, 0);
      ctx.restore();
      ctx.globalAlpha = 1;
    }

    ctx.restore();
  }
}
