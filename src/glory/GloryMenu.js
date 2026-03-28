/**
 * GloryMenu.js - 荣耀糖糖开始菜单
 */

export class GloryMenu {
  constructor(canvas, audioManager) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.audioManager = audioManager;
    this.W = canvas.width;
    this.H = canvas.height;

    // 预览角色动画状态
    this.previewPlayer = {
      x: this.W / 2,
      y: this.H * 0.55,
      vy: 0,
      baseY: this.H * 0.55,
    };
    this.previewTime = 0;

    // 按钮区域
    this.buttons = this._buildButtons();
    this._bindEvents();
  }

  _buildButtons() {
    const cx = this.W / 2;
    const bw = 180;
    const bh = 48;
    const gap = 14;

    return {
      start: { x: cx - bw / 2, y: this.H * 0.62, w: bw, h: bh, label: '开始游戏', action: 'start' },
      sound: { x: cx - bw / 2, y: this.H * 0.62 + bh + gap, w: bw, h: bh, label: '♪ 音效 ON', action: 'sound' },
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
    if (action === 'start' && this.onStart) this.onStart();
    if (action === 'sound' && this.onToggleSound) this.onToggleSound();
  }

  updateSoundLabel(enabled) {
    this.buttons.sound.label = enabled ? '♪ 音效 ON' : '♪ 音效 OFF';
  }

  update(dt) {
    // 预览角色上下弹跳动画
    this.previewTime += dt;
    const t = this.previewTime;
    // 简谐运动模拟弹跳预览
    this.previewPlayer.y = this.previewPlayer.baseY - Math.abs(Math.sin(t * 2.5)) * 30;
  }

  draw() {
    const ctx = this.ctx;
    const cx = this.W / 2;

    // 深色毛玻璃背景
    ctx.fillStyle = 'rgba(10, 22, 40, 0.92)';
    ctx.fillRect(0, 0, this.W, this.H);

    // === 标题 ===
    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = 'bold 34px Nunito, sans-serif';

    // 发光效果
    ctx.shadowColor = '#FFD700';
    ctx.shadowBlur = 22;
    ctx.fillStyle = '#FFD700';
    ctx.fillText('荣耀糖糖', cx, this.H * 0.18);
    ctx.restore();

    // === 副标题 ===
    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = '16px Nunito, sans-serif';
    ctx.fillStyle = '#FF9EC4';
    ctx.fillText('★ 糖果收集 ★', cx, this.H * 0.25);
    ctx.restore();

    // === 角色预览动画 ===
    this._drawPreviewPlayer();

    // === 最高分 ===
    const highScore = this._getHighScore();
    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = '14px Nunito, sans-serif';
    ctx.fillStyle = '#FFD700';
    ctx.globalAlpha = 0.85;
    ctx.fillText(`最高分  ${highScore}`, cx, this.H * 0.42);
    ctx.restore();

    // === 按钮 ===
    this._drawButton(this.buttons.start, true);
    this._drawButton(this.buttons.sound, false);
  }

  _drawPreviewPlayer() {
    const ctx = this.ctx;
    const px = this.previewPlayer.x;
    const py = this.previewPlayer.y;

    ctx.save();
    ctx.shadowColor = '#BF40FF';
    ctx.shadowBlur = 18;
    ctx.fillStyle = '#BF40FF';
    ctx.beginPath();
    ctx.arc(px, py, 16, 0, Math.PI * 2);
    ctx.fill();

    // 高光
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath();
    ctx.arc(px - 5, py - 5, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  _drawButton(btn, isPrimary) {
    const ctx = this.ctx;
    const { x, y, w, h, label } = btn;

    // 毛玻璃背景
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.strokeStyle = isPrimary ? '#FFD700' : 'rgba(255,255,255,0.25)';
    ctx.lineWidth = isPrimary ? 1.5 : 1;
    // 圆角矩形
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

    // 文字
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
}
