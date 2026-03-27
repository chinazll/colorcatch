import { ease } from '../utils/easing.js';
import { shadeColor, roundRect } from '../utils/utils.js';

export const PLAT_TYPES = ['normal', 'crumbling', 'moving', 'bonus'];

export class Platform {
  constructor(x, y, w, colorKey, type = 'normal') {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = 18;
    this.colorKey = colorKey;
    this.color = null; // set by game via COLORS
    this.type = type;
    this.alive = true;
    this.animScale = 1.0;
    this.animTime = 0;
    // 特殊属性
    this.moveDir = type === 'moving' ? (Math.random() > 0.5 ? 1 : -1) : 0;
    this.moveSpeed = type === 'moving' ? 1.2 : 0;
    this.crumbleTimer = 0;
    this.crumbling = false;
    this.alpha = 1.0;
    // Q弹动画
    this.springX = 0;
    this.springVX = 0;
    this.springY = 0;
    this.springVY = 0;
    // 入场动画
    this.enterTime = 0;
    this.entered = false;
  }

  setColor(color) {
    this.color = color;
  }

  land() {
    if (this.type === 'crumbling' && !this.crumbling) {
      this.crumbling = true;
      this.crumbleTimer = 0;
    }
    // Q弹压缩动画
    this.springVY = -6;
    this.springVX = 0;
  }

  update(dt, scrollY, W) {
    // 入场动画
    if (!this.entered) {
      this.enterTime += dt;
      if (this.enterTime < 0.4) {
        this.animScale = ease.outBack(this.enterTime / 0.4) * 0.3 + 0.7;
      } else {
        this.animScale = 1.0;
        this.entered = true;
      }
    }
    // 移动平台
    if (this.type === 'moving') {
      this.x += this.moveDir * this.moveSpeed;
      if (this.x <= 10 || this.x + this.w >= W - 10) this.moveDir *= -1;
    }
    // 崩塌平台
    if (this.crumbling) {
      this.crumbleTimer += dt;
      this.alpha = Math.max(0, 1 - this.crumbleTimer / 0.6);
      if (this.crumbleTimer > 0.6) this.alive = false;
    }
    // 弹簧物理
    this.springY += this.springVY;
    this.springVY += 0.5;
    if (this.springY > 0) { this.springY = 0; this.springVY = 0; }
    this.springX += this.springVX;
    this.springVX *= 0.85;
  }

  draw(ctx) {
    if (!this.alive) return;
    ctx.save();
    ctx.globalAlpha = this.alpha;
    const cx = this.x + this.w / 2;
    const cy = this.y + this.h / 2 + this.springY;
    const ew = this.w * this.animScale;
    const eh = this.h * this.animScale;
    const r = eh / 2 + 2;

    // 平台主体
    const grad = ctx.createLinearGradient(cx - ew / 2, cy - eh / 2, cx - ew / 2, cy + eh / 2);
    if (this.type === 'bonus') {
      grad.addColorStop(0, '#FFD700');
      grad.addColorStop(1, '#FF9F43');
    } else if (this.type === 'crumbling') {
      grad.addColorStop(0, this.color + 'CC');
      grad.addColorStop(1, this.color + '88');
    } else {
      grad.addColorStop(0, this.color);
      grad.addColorStop(1, shadeColor(this.color, -30));
    }
    ctx.fillStyle = grad;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    roundRect(ctx, cx - ew / 2, cy - eh / 2, ew, eh, r);
    ctx.fill();

    // 高光
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.beginPath();
    roundRect(ctx, cx - ew / 2 + 4, cy - eh / 2 + 2, ew - 8, eh * 0.35, r * 0.5);
    ctx.fill();

    // 特殊标记
    if (this.type === 'crumbling' && this.crumbling) {
      ctx.strokeStyle = 'rgba(255,255,255,0.6)';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(cx - ew / 3 + i * ew / 4, cy - eh / 2);
        ctx.lineTo(cx - ew / 4 + i * ew / 4, cy + eh / 2);
        ctx.stroke();
      }
    }
    if (this.type === 'bonus') {
      ctx.fillStyle = '#fff';
      ctx.font = `bold ${Math.round(eh * 0.7)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.shadowBlur = 0;
      ctx.fillText('★', cx, cy + eh * 0.25);
    }

    ctx.restore();
  }
}

// ─────────────────────────────────────────
// COLOR BALL (目标糖果球)
// ─────────────────────────────────────────

export class ColorBall {
  constructor(x, y, colorKey, color) {
    this.x = x;
    this.y = y;
    this.colorKey = colorKey;
    this.color = color;
    this.r = 14;
    this.alive = true;
    this.animTime = 0;
    this.floatPhase = Math.random() * Math.PI * 2;
    this.entered = false;
    this.enterTime = 0;
    this.scale = 0;
    this.bonus = colorKey === 'orange';
  }

  update(dt) {
    this.animTime += dt;
    this.floatPhase += 0.05;
    if (!this.entered) {
      this.enterTime += dt;
      this.scale = ease.outBack(Math.min(1, this.enterTime / 0.35));
      if (this.enterTime > 0.35) { this.scale = 1; this.entered = true; }
    }
  }

  draw(ctx) {
    if (!this.alive) return;
    ctx.save();
    const floatY = Math.sin(this.floatPhase) * 4;
    ctx.translate(this.x, this.y + floatY);
    ctx.scale(this.scale, this.scale);
    const r = this.r;

    ctx.shadowColor = this.color;
    ctx.shadowBlur = 15;
    const grad = ctx.createRadialGradient(-r * 0.3, -r * 0.3, 0, 0, 0, r);
    grad.addColorStop(0, shadeColor(this.color, 70));
    grad.addColorStop(0.5, shadeColor(this.color, 20));
    grad.addColorStop(1, this.color);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();

    // 高光
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.ellipse(-r * 0.3, -r * 0.35, r * 0.35, r * 0.22, -0.4, 0, Math.PI * 2);
    ctx.fill();

    // Bonus星号
    if (this.bonus) {
      ctx.fillStyle = '#FFD700';
      ctx.shadowColor = '#FFD700';
      ctx.shadowBlur = 8;
      ctx.font = `bold ${r}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('★', 0, 1);
    }

    ctx.restore();
  }
}
