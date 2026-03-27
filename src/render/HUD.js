// ─────────────────────────────────────────────
//  HUD.js — Score / Combo / Level display
// ─────────────────────────────────────────────

import { GOLD } from '../utils/utils.js';
import { drawStar } from '../utils/utils.js';
import { Storage } from '../game/Storage.js';

export class HUD {
  constructor(canvasWidth, canvasHeight) {
    this.W = canvasWidth;
    this.H = canvasHeight;

    // Score display animation
    this.displayScore = 0;
    this.targetScore = 0;
    this.scorePopTimer = 0;   // for "+N" flash on score increase
    this.lastScoreDelta = 0;

    // Combo
    this.comboDisplay = 0;    // shown combo count
    this.comboAlpha = 0;
    this.comboScale = 0;

    // Level
    this.level = 1;
    this.levelUpFlash = 0;    // 0-1 timer for level-up effect

    // Score pop animation
    this.scorePopScale = 0;
    this.scorePopX = this.W / 2;
    this.scorePopY = this.H * 0.3;

    // Phase 2: Stars & High Score
    this.storage = new Storage();
    this.stars = this.storage.getStars();
    this.highScore = this.storage.getHighScore();
  }

  /** Refresh stars and high score from localStorage */
  refreshFromStorage() {
    this.stars = this.storage.getStars();
    this.highScore = this.storage.getHighScore();
  }

  /** Called by Game when score increases */
  onScore(delta, x, y) {
    this.targetScore += delta;
    this.lastScoreDelta = delta;
    this.scorePopTimer = 1.0;
    this.scorePopX = x || this.W / 2;
    this.scorePopY = y || this.H * 0.35;
    this.scorePopScale = 0;
  }

  /** Called by Game when combo increases */
  onCombo(count) {
    this.comboDisplay = count;
    this.comboAlpha = 1.0;
    this.comboScale = 0;
  }

  /** Called when level advances */
  onLevelUp(level) {
    this.level = level;
    this.levelUpFlash = 1.0;
  }

  update(dt) {
    // Smooth score counter
    const scoreDiff = this.targetScore - this.displayScore;
    this.displayScore += scoreDiff * 0.15;
    if (Math.abs(scoreDiff) < 0.5) this.displayScore = this.targetScore;

    // Score pop
    if (this.scorePopTimer > 0) {
      this.scorePopTimer -= dt * 1.5;
      this.scorePopScale = Math.min(1, this.scorePopScale + dt * 8);
    }

    // Combo fade
    if (this.comboAlpha > 0 && this.comboDisplay === 0) {
      this.comboAlpha -= dt * 2;
    }
    if (this.comboScale < 1) {
      this.comboScale = Math.min(1, this.comboScale + dt * 8);
    }

    // Level-up flash
    if (this.levelUpFlash > 0) {
      this.levelUpFlash -= dt * 1.2;
    }
  }

  draw(ctx) {
    const W = this.W;

    // ── Score ──────────────────────────────────────────────
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    // Background pill
    const scoreText = Math.floor(this.displayScore).toString();
    ctx.font = 'bold 28px Nunito, sans-serif';
    const tw = ctx.measureText(scoreText).width;
    const pillW = tw + 40;
    const pillH = 40;
    const pillX = W / 2 - pillW / 2;
    const pillY = 12;

    ctx.fillStyle = 'rgba(255,255,255,0.82)';
    ctx.beginPath();
    ctx.roundRect(pillX, pillY, pillW, pillH, 20);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,200,100,0.5)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#2D3436';
    ctx.fillText(scoreText, W / 2, pillY + 8);

    // Score label
    ctx.font = '12px Nunito, sans-serif';
    ctx.fillStyle = 'rgba(45,52,54,0.6)';
    ctx.fillText('分数', W / 2, pillY + pillH + 2);

    // ── Stars (top-left) ─────────────────────────────────
    ctx.save();
    ctx.textAlign = 'left';
    const starX = 12;
    const starY = 14;
    // Star icon
    ctx.fillStyle = '#FFD93D';
    ctx.save();
    ctx.translate(starX + 8, starY + 10);
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const angle = (Math.PI / 5) * i - Math.PI / 2;
      const r = i % 2 === 0 ? 9 : 4;
      const px = r * Math.cos(angle);
      const py = r * Math.sin(angle);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    // Star count
    ctx.font = 'bold 14px Nunito, sans-serif';
    ctx.fillStyle = '#fff';
    ctx.shadowColor = 'rgba(0,0,0,0.4)';
    ctx.shadowBlur = 3;
    ctx.fillText(`${this.stars}`, starX + 22, starY);
    ctx.restore();

    // ── High score (top-right above level badge) ──────────
    ctx.save();
    ctx.textAlign = 'right';
    ctx.font = 'bold 12px Nunito, sans-serif';
    ctx.fillStyle = 'rgba(255,230,100,0.9)';
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = 2;
    ctx.fillText(`最高 ${this.highScore}`, W - 16, 14);
    ctx.restore();

    // ── Level badge ───────────────────────────────────────
    ctx.textAlign = 'right';
    ctx.font = 'bold 16px Nunito, sans-serif';
    ctx.fillStyle = '#2D3436';
    ctx.fillText(`Lv.${this.level}`, W - 16, 14);

    // Level-up flash
    if (this.levelUpFlash > 0) {
      ctx.globalAlpha = this.levelUpFlash * 0.5;
      ctx.fillStyle = '#FFD93D';
      ctx.fillRect(0, 0, W, this.H);
      ctx.globalAlpha = this.levelUpFlash;
      ctx.font = 'bold 36px Nunito, sans-serif';
      ctx.fillStyle = '#FF6B6B';
      ctx.textAlign = 'center';
      ctx.fillText(`第 ${this.level} 关`, W / 2, this.H / 2 - 40);
      ctx.globalAlpha = 1;
    }

    // ── Score pop ──────────────────────────────────────────
    if (this.scorePopTimer > 0) {
      const alpha = Math.min(1, this.scorePopTimer * 2);
      ctx.globalAlpha = alpha;
      ctx.save();
      ctx.translate(this.scorePopX, this.scorePopY);
      const sc = 0.5 + this.scorePopScale * 0.8;
      ctx.scale(sc, sc);
      ctx.font = 'bold 22px Nunito, sans-serif';
      ctx.fillStyle = GOLD;
      ctx.strokeStyle = '#2D3436';
      ctx.lineWidth = 3;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const text = `+${this.lastScoreDelta}`;
      ctx.strokeText(text, 0, 0);
      ctx.fillText(text, 0, 0);
      ctx.restore();
      ctx.globalAlpha = 1;
    }

    // ── Combo display ──────────────────────────────────────
    if (this.comboDisplay >= 2 && this.comboAlpha > 0) {
      ctx.globalAlpha = this.comboAlpha;
      ctx.save();
      ctx.translate(W / 2, this.H * 0.18);
      const sc = 0.5 + this.comboScale * 0.7;
      ctx.scale(sc, sc);
      ctx.font = 'bold 26px Nunito, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#FF6B6B';
      ctx.strokeStyle = 'rgba(255,255,255,0.8)';
      ctx.lineWidth = 2;
      const comboText = `${this.comboDisplay}x COMBO!`;
      ctx.strokeText(comboText, 0, 0);
      ctx.fillText(comboText, 0, 0);
      ctx.restore();
      ctx.globalAlpha = 1;
    }

    ctx.restore();
  }
}
