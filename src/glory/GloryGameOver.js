/**
 * GloryGameOver.js - 荣耀糖糖游戏结束画面
 */

export class GloryGameOver {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.W = canvas.width;
    this.H = canvas.height;

    this.score = 0;
    this.highScore = 0;
    this.survivalTime = 0;

    this.buttons = this._buildButtons();
    this._bindEvents();
  }

  _buildButtons() {
    const cx = this.W / 2;
    const bw = 180;
    const bh = 48;
    const gap = 14;

    return {
      restart: { x: cx - bw / 2, y: this.H * 0.68, w: bw, h: bh, label: '再来一局', action: 'restart' },
      menu: { x: cx - bw / 2, y: this.H * 0.68 + bh + gap, w: bw, h: bh, label: '主菜单', action: 'menu' },
    };
  }

  _bindEvents() {
    this.canvas.addEventListener('click', (e) => this._handleClick(e));
    this.canvas.style.cursor = 'pointer';
  }

  _handleClick(e) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.W / rect.width;
    const scaleY = this.H / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;

    for (const btn of Object.values(this.buttons)) {
      if (mx >= btn.x && mx <= btn.x + btn.w && my >= btn.y && my <= btn.y + btn.h) {
        this._triggerAction(btn.action);
        break;
      }
    }
  }

  _triggerAction(action) {
    if (action === 'restart' && this.onRestart) this.onRestart();
    if (action === 'menu' && this.onMenu) this.onMenu();
  }

  setData(score, survivalTimeSec) {
    this.score = score;
    this.survivalTime = survivalTimeSec;
    this.highScore = this._getHighScore();
    // 更新最高分
    if (score > this.highScore) {
      this.highScore = score;
      this._setHighScore(score);
    }
  }

  draw() {
    const ctx = this.ctx;

    // 深色半透明遮罩
    ctx.fillStyle = 'rgba(6, 12, 28, 0.88)';
    ctx.fillRect(0, 0, this.W, this.H);

    const cx = this.W / 2;

    // === 游戏结束标题 ===
    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = 'bold 30px Nunito, sans-serif';
    ctx.shadowColor = '#FF4444';
    ctx.shadowBlur = 16;
    ctx.fillStyle = '#FF5555';
    ctx.fillText('游戏结束', cx, this.H * 0.22);
    ctx.restore();

    // === 毛玻璃卡片 ===
    const cardX = cx - 155;
    const cardY = this.H * 0.30;
    const cardW = 310;
    const cardH = 180;
    const cardR = 14;

    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.07)';
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cardX + cardR, cardY);
    ctx.lineTo(cardX + cardW - cardR, cardY);
    ctx.quadraticCurveTo(cardX + cardW, cardY, cardX + cardW, cardY + cardR);
    ctx.lineTo(cardX + cardW, cardY + cardH - cardR);
    ctx.quadraticCurveTo(cardX + cardW, cardY + cardH, cardX + cardW - cardR, cardY + cardH);
    ctx.lineTo(cardX + cardR, cardY + cardH);
    ctx.quadraticCurveTo(cardX, cardY + cardH, cardX, cardY + cardH - cardR);
    ctx.lineTo(cardX, cardY + cardR);
    ctx.quadraticCurveTo(cardX, cardY, cardX + cardR, cardY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // === 卡片内容 ===
    this._drawStatRow(this.H * 0.37, '本局分数', `${this.score}`, '#FFD700');
    this._drawStatRow(this.H * 0.50, '最高分', `${this.highScore}`, '#FFD700');
    this._drawStatRow(this.H * 0.63, '存活时间', `${this.survivalTime}s`, 'rgba(255,255,255,0.7)');

    // === 按钮 ===
    this._drawButton(this.buttons.restart, true);
    this._drawButton(this.buttons.menu, false);
  }

  _drawStatRow(y, label, value, valueColor) {
    const ctx = this.ctx;
    const cx = this.W / 2;

    ctx.save();
    ctx.textAlign = 'center';

    // 标签
    ctx.font = '13px Nunito, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillText(label, cx, y);

    // 数值
    ctx.font = 'bold 26px Nunito, sans-serif';
    ctx.fillStyle = valueColor;
    if (valueColor === '#FFD700') {
      ctx.shadowColor = '#FFD700';
      ctx.shadowBlur = 10;
    }
    ctx.fillText(value, cx, y + 30);
    ctx.restore();
  }

  _drawButton(btn, isPrimary) {
    const ctx = this.ctx;
    const { x, y, w, h, label } = btn;

    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.strokeStyle = isPrimary ? '#FFD700' : 'rgba(255,255,255,0.25)';
    ctx.lineWidth = isPrimary ? 1.5 : 1;
    const r = 10;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = isPrimary ? '#FFD700' : 'rgba(255,255,255,0.7)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `bold 16px Nunito, sans-serif`;
    ctx.fillText(label, x + w / 2, y + h / 2);
    ctx.restore();
  }

  _getHighScore() {
    try {
      return parseInt(localStorage.getItem('glory_highscore') || '0', 10);
    } catch {
      return 0;
    }
  }

  _setHighScore(score) {
    try {
      localStorage.setItem('glory_highscore', String(score));
    } catch { /* ignore */ }
  }
}
