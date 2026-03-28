// Platform.js — Platform entities + ColorBall (bonus) + moving/crumbling logic

import { COLORS, COLOR_KEYS, rand, randPick, randInt } from '../utils/utils.js';
import { drawStar } from '../utils/utils.js';

const W = 400;
const PLATFORM_H = 16;

export const PLATFORM_TYPES = {
  NORMAL:    'normal',
  CRUMBLING: 'crumbling',
  MOVING:    'moving',
  BONUS:     'bonus',
};

export class Platform {
  constructor(x, y, width, colorKey, typeOrOpts = 'normal', levelConfig = null) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = PLATFORM_H;
    this.colorKey = colorKey;
    this.color = COLORS[colorKey];
    // Support both string type and { type, hasBonus } object
    if (typeof typeOrOpts === 'object' && typeOrOpts !== null) {
      this.type = typeOrOpts.type || 'normal';
      this.hasBonusBall = !!typeOrOpts.hasBonus;
    } else {
      this.type = typeOrOpts;
      this.hasBonusBall = false;
    }
    this.alive = true;
    this.crumbleTimer = 0;
    this.crumbleOffset = 0;
    this.shakeOffset = 0;
    // Moving platform
    this.originX = x;
    this.moveDir = randPick([-1, 1]);
    this.moveSpeed = levelConfig ? (1 + Math.random() * 1.5) * levelConfig.speed : 2;
    this.moveRange = 60;
    // Bonus ball
    this.bonusBallY = y - 30;
    this.bonusBallR = 12;
    this.bonusBallColor = COLORS.orange;
    this.bonusBallAlive = true;
  }

  update(dt = 1/60, canvasWidth = 400) {
    if (!this.alive) return;

    if (this.type === 'crumbling') {
      if (this.crumbleTimer > 0) {
        this.crumbleTimer -= dt * 60;
        this.shakeOffset = rand(-2, 2);
        this.crumbleOffset = (36 - this.crumbleTimer) * 0.3;
        if (this.crumbleTimer <= 0) {
          this.alive = false;
        }
      }
    }

    if (this.type === 'moving') {
      this.x += this.moveDir * this.moveSpeed;
      if (this.x > this.originX + this.moveRange || this.x < this.originX - this.moveRange) {
        this.moveDir *= -1;
      }
      this.x = Math.max(0, Math.min(canvasWidth - this.width, this.x));
    }
  }

  /** Check if player (circle) is landing on this platform */
  landsOn(x, y, r, vy) {
    if (!this.alive) return false;
    const prevBottom = y + r - vy;
    const curBottom = y + r;
    return vy >= 0 &&
      prevBottom <= this.y + 2 &&
      curBottom >= this.y &&
      x + r > this.x &&
      x - r < this.x + this.width;
  }

  /** Bonus ball accessor for Game.js compat — proxied to bonusBall* fields */
  get ball() {
    const self = this;
    const _bx = () => self.x + self.width / 2;
    const _by = () => self.y - 28;
    return {
      get alive() { return self.bonusBallAlive; },
      set alive(v) { self.bonusBallAlive = v; },
      get x() { return _bx(); },
      get y() { return _by(); },
      overlaps(px, py, pr) {
        const dx = px - _bx();
        const dy = py - _by();
        return Math.sqrt(dx*dx + dy*dy) < pr + self.bonusBallR;
      },
    };
  }

  startCrumble() {
    if (this.type === 'crumbling' && this.crumbleTimer === 0) {
      this.crumbleTimer = 36; // 0.6s at 60fps
    }
  }

  draw(ctx, cameraY) {
    if (!this.alive) return;
    const screenY = this.y - cameraY;
    if (screenY > 700 || screenY < -50) return;

    const alpha = this.type === 'crumbling' ? Math.max(0.3, 1 - this.crumbleOffset / 15) : 1;
    const dw = this.shakeOffset;

    ctx.save();
    ctx.globalAlpha = alpha;

    // Platform body
    const px = this.x + dw;
    const grad = ctx.createLinearGradient(px, screenY, px, screenY + this.height);
    if (this.type === 'bonus') {
      grad.addColorStop(0, '#FFE66D');
      grad.addColorStop(1, '#FF9F43');
    } else if (this.type === 'crumbling') {
      grad.addColorStop(0, this._lighten(this.color, 20));
      grad.addColorStop(1, this._darken(this.color, 20));
    } else {
      grad.addColorStop(0, this._lighten(this.color, 30));
      grad.addColorStop(1, this.color);
    }

    const r = Math.min(10, this.width / 4);
    ctx.beginPath();
    ctx.moveTo(px + r, screenY);
    ctx.lineTo(px + this.width - r, screenY);
    ctx.quadraticCurveTo(px + this.width, screenY, px + this.width, screenY + r);
    ctx.lineTo(px + this.width, screenY + this.height - r);
    ctx.quadraticCurveTo(px + this.width, screenY + this.height, px + this.width - r, screenY + this.height);
    ctx.lineTo(px + r, screenY + this.height);
    ctx.quadraticCurveTo(px, screenY + this.height, px, screenY + this.height - r);
    ctx.lineTo(px, screenY + r);
    ctx.quadraticCurveTo(px, screenY, px + r, screenY);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Shine
    ctx.beginPath();
    ctx.ellipse(px + this.width * 0.3, screenY + 4, 12, 4, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.fill();

    // Crumbling cracks
    if (this.type === 'crumbling' && this.crumbleTimer > 10) {
      ctx.strokeStyle = 'rgba(0,0,0,0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(px + this.width * 0.2, screenY);
      ctx.lineTo(px + this.width * 0.4, screenY + this.height);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(px + this.width * 0.7, screenY);
      ctx.lineTo(px + this.width * 0.6, screenY + this.height);
      ctx.stroke();
    }

    // Moving platform indicator (small arrows)
    if (this.type === 'moving') {
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('◀▶', px + this.width / 2, screenY + 12);
    }

    // Bonus ball
    if (this.hasBonusBall && this.bonusBallAlive) {
      const by = screenY - 28;
      const bx = px + this.width / 2;
      const bgrad = ctx.createRadialGradient(bx - 3, by - 3, 1, bx, by, this.bonusBallR);
      bgrad.addColorStop(0, '#FFE66D');
      bgrad.addColorStop(1, '#FF9F43');
      ctx.beginPath();
      ctx.arc(bx, by, this.bonusBallR, 0, Math.PI * 2);
      ctx.fillStyle = bgrad;
      ctx.fill();
      // Star on bonus ball
      ctx.fillStyle = '#fff';
      drawStar(ctx, bx, by, 6, 3, 0);
      ctx.fill();
    }

    ctx.restore();
  }

  checkCollision(player) {
    const playerBottom = player.y + player.radius;
    const playerTop = player.y - player.radius;
    const prevBottom = playerBottom - player.vy;

    if (
      player.vy > 0 &&
      prevBottom <= this.y + 2 &&
      playerBottom >= this.y &&
      player.x + player.radius > this.x &&
      player.x - player.radius < this.x + this.width
    ) {
      return true;
    }
    return false;
  }

  checkBonusBallCollision(player) {
    if (!this.hasBonusBall || !this.bonusBallAlive) return false;
    const bx = this.x + this.width / 2;
    const by = this.y - 28;
    const dx = player.x - bx;
    const dy = player.y - by;
    return Math.sqrt(dx * dx + dy * dy) < player.radius + this.bonusBallR;
  }

  _lighten(hex, amt) {
    const r = Math.min(255, parseInt(hex.slice(1,3),16) + amt);
    const g = Math.min(255, parseInt(hex.slice(3,5),16) + amt);
    const b = Math.min(255, parseInt(hex.slice(5,7),16) + amt);
    return `rgb(${r},${g},${b})`;
  }

  _darken(hex, amt) {
    const r = Math.max(0, parseInt(hex.slice(1,3),16) - amt);
    const g = Math.max(0, parseInt(hex.slice(3,5),16) - amt);
    const b = Math.max(0, parseInt(hex.slice(5,7),16) - amt);
    return `rgb(${r},${g},${b})`;
  }
}
