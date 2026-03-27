import { shadeColor, lightenColor } from '../utils/utils.js';

export const COLOR_KEYS = ['red', 'yellow', 'blue', 'green', 'purple', 'orange'];

export const COLORS = {
  red:    '#FF6B6B',
  yellow: '#FFD93D',
  blue:   '#4ECDC4',
  green:  '#95E66A',
  purple: '#C77DFF',
  orange: '#FF9F43',
};

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.r = 18;
    this.vx = 0;
    this.vy = 0;
    this.colorKey = COLOR_KEYS[Math.floor(Math.random() * COLOR_KEYS.length)];
    this.color = COLORS[this.colorKey];
    this.onGround = false;
    this.alive = true;
    this.animTime = 0;
    // Q弹状态
    this.scaleX = 1;
    this.scaleY = 1;
    this.targetScaleX = 1;
    this.targetScaleY = 1;
    this.blinkTimer = 0;
    this.isBlinking = false;
    // 拉伸状态
    this.stretchY = 1;
    this.floatPhase = 0;
  }

  jump() {
    this.vy = -11;
    this.targetScaleX = 0.75;
    this.targetScaleY = 1.3;
    return true; // signal that jump happened
  }

  land() {
    this.targetScaleX = 1.25;
    this.targetScaleY = 0.7;
    setTimeout(() => {
      this.targetScaleX = 1;
      this.targetScaleY = 1;
    }, 80);
  }

  setColor(colorKey) {
    this.colorKey = colorKey;
    this.color = COLORS[colorKey];
  }

  update(dt) {
    this.animTime += dt;
    this.floatPhase += 0.06;
    // 眨眼
    this.blinkTimer += dt;
    if (this.blinkTimer > 3 + Math.random() * 2) {
      this.isBlinking = true;
      setTimeout(() => { this.isBlinking = false; }, 120);
      this.blinkTimer = 0;
    }
    // Q弹缩放插值
    this.scaleX += (this.targetScaleX - this.scaleX) * 0.25;
    this.scaleY += (this.targetScaleY - this.scaleY) * 0.25;
    // 跳跃时拉伸
    if (this.vy < -2) {
      this.stretchY = 1 + Math.min(0.3, Math.abs(this.vy) * 0.04);
    } else if (this.vy > 2) {
      this.stretchY = 1 - Math.min(0.2, Math.abs(this.vy) * 0.03);
    } else {
      this.stretchY += (1 - this.stretchY) * 0.15;
    }
    // 物理
    this.vy += 0.38; // 重力
    this.y += this.vy;
    this.x += this.vx;
    this.vx *= 0.88;
  }

  clampX(W) {
    if (this.x < this.r) { this.x = this.r; this.vx *= -0.5; }
    if (this.x > W - this.r) { this.x = W - this.r; this.vx *= -0.5; }
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    const sx = this.scaleX * (1 / this.stretchY);
    const sy = this.scaleY * this.stretchY;
    // 待机浮动
    const float = Math.sin(this.floatPhase) * 2;
    ctx.translate(0, float);
    ctx.scale(sx, sy);
    const r = this.r;

    // 身体主体（圆形带高光）
    const bodyGrad = ctx.createRadialGradient(-r * 0.3, -r * 0.3, 0, 0, 0, r);
    bodyGrad.addColorStop(0, lightenColor(this.color, 60));
    bodyGrad.addColorStop(0.4, lightenColor(this.color, 20));
    bodyGrad.addColorStop(1, shadeColor(this.color, -20));
    ctx.fillStyle = bodyGrad;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();

    // 高光圆
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.ellipse(-r * 0.35, -r * 0.38, r * 0.32, r * 0.22, -0.5, 0, Math.PI * 2);
    ctx.fill();

    // 腮红
    ctx.fillStyle = 'rgba(255,150,150,0.35)';
    ctx.beginPath();
    ctx.ellipse(-r * 0.55, r * 0.15, r * 0.18, r * 0.12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(r * 0.55, r * 0.15, r * 0.18, r * 0.12, 0, 0, Math.PI * 2);
    ctx.fill();

    // 眼睛
    const eyeY = -r * 0.1;
    const eyeR = r * 0.18;
    if (this.isBlinking) {
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-eyeR * 2, eyeY);
      ctx.lineTo(-eyeR * 0.5, eyeY);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(eyeR * 0.5, eyeY);
      ctx.lineTo(eyeR * 2, eyeY);
      ctx.stroke();
    } else {
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.ellipse(-r * 0.3, eyeY, eyeR, eyeR * 1.15, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(r * 0.3, eyeY, eyeR, eyeR * 1.15, 0, 0, Math.PI * 2);
      ctx.fill();
      // 瞳孔
      ctx.fillStyle = '#333';
      ctx.beginPath();
      ctx.arc(-r * 0.3, eyeY + eyeR * 0.1, eyeR * 0.55, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(r * 0.3, eyeY + eyeR * 0.1, eyeR * 0.55, 0, Math.PI * 2);
      ctx.fill();
      // 眼神光
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(-r * 0.2, eyeY - eyeR * 0.1, eyeR * 0.22, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(r * 0.4, eyeY - eyeR * 0.1, eyeR * 0.22, 0, Math.PI * 2);
      ctx.fill();
    }

    // 小嘴巴
    ctx.fillStyle = shadeColor(this.color, -40);
    ctx.beginPath();
    ctx.ellipse(0, r * 0.35, r * 0.18, r * 0.1, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}
