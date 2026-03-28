// Player.js — Player entity with color system and animations

import { COLORS, COLOR_KEYS, lerp, rand } from '../utils/utils.js';
import { outBack, outBounce } from '../utils/easing.js';
import { drawStar } from '../utils/utils.js';

const W = 400, H = 640;
const GRAVITY = 0.38;
const JUMP_SPEED = -11;
const FRICTION = 0.88;
const MOVE_SPEED = 4;
const PLAYER_R = 18;
export const PLAYER_RADIUS = PLAYER_R;

export class Player {
  constructor(x, y, colorKey) {
    this.x = x !== undefined ? x : W / 2;
    this.y = y !== undefined ? y : H - 100;
    this.vx = 0;
    this.vy = 0;
    this.radius = PLAYER_R;
    this.colorKey = colorKey || 'red';
    this.color = COLORS[this.colorKey] || COLORS.red;
    this.onGround = false;
    this.grounded = false;
    // Animation state
    this.scaleY = 1;
    this.scaleX = 1;
    this.jumpAnim = 0;
    this.landAnim = 0;
    this.bobOffset = 0;
    this.bobTime = rand(0, Math.PI * 2);
    this.blinkTimer = rand(3, 5) * 60;
    this.isBlinking = false;
    this.blinkDur = 0;
    this.trailTimer = 0;
    this.dead = false;
    this.skin = 'default';
  }

  setColor(colorKey) {
    this.colorKey = colorKey;
    this.color = COLORS[colorKey] || COLORS.red;
  }

  changeColor(colorKey) { this.setColor(colorKey); }

  jump() {
    if (this.onGround || this.grounded) {
      this.vy = JUMP_SPEED;
      this.onGround = false;
      this.grounded = false;
      this.jumpAnim = 1;
      this.scaleY = 1.3;
      this.scaleX = 0.75;
      return true;
    }
    return false;
  }

  land() {
    if (!this.onGround && this.vy > 0) {
      this.landAnim = 1;
      this.scaleY = 0.7;
      this.scaleX = 1.3;
    }
    this.onGround = true;
    this.grounded = true;
  }

  onLand() { this.land(); }

  moveLeft() { this.vx -= MOVE_SPEED * 0.5; }
  moveRight() { this.vx += MOVE_SPEED * 0.5; }

  update(dt = 1/60) {
    if (this.dead) return;
    // Physics (use fixed step to match Game.js dt)
    if (!this.onGround && !this.grounded) {
      this.vy += GRAVITY * 60 * dt;
      this.vx *= Math.pow(FRICTION, 60 * dt);
    }
    this.x += this.vx;
    this.y += this.vy;

    // Wall bounce
    if (this.x < this.radius) { this.x = this.radius; this.vx *= -0.5; }
    if (this.x > W - this.radius) { this.x = W - this.radius; this.vx *= -0.5; }

    // Animate scale back to normal
    this.scaleX = lerp(this.scaleX, 1, 0.18);
    this.scaleY = lerp(this.scaleY, 1, 0.18);
    this.jumpAnim *= 0.85;
    this.landAnim *= 0.82;

    // Idle bob
    this.bobTime += 0.06;
    this.bobOffset = Math.sin(this.bobTime) * 2;

    // Blink
    this.blinkTimer--;
    if (this.blinkTimer <= 0) {
      if (!this.isBlinking) {
        this.isBlinking = true;
        this.blinkDur = 6;
      }
      this.blinkDur--;
      if (this.blinkDur <= 0) {
        this.isBlinking = false;
        this.blinkTimer = rand(3, 5) * 60;
      }
    }

    this.trailTimer++;
  }

  isTrailFrame() {
    const speed = Math.abs(this.vx) + Math.abs(this.vy);
    return (this.onGround || this.grounded) && speed > 4 && this.trailTimer % 3 === 0;
  }

  draw(ctx, camY = 0) {
    const drawY = this.y + ((this.onGround || this.grounded) ? this.bobOffset : 0);
    ctx.save();
    ctx.translate(this.x, drawY);
    ctx.scale(this.scaleX, this.scaleY);

    // Body gradient
    const grad = ctx.createRadialGradient(-4, -4, 2, 0, 0, this.radius);
    grad.addColorStop(0, this._lighten(this.color, 40));
    grad.addColorStop(0.6, this.color);
    grad.addColorStop(1, this._darken(this.color, 30));
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    // Shine
    ctx.beginPath();
    ctx.arc(-5, -6, 5, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fill();

    // Eyes
    if (!this.isBlinking) {
      ctx.beginPath();
      ctx.arc(-5, -2, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(-4.5, -1.5, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = '#2D3436';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(-3.8, -2.2, 1, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(5, -2, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(5.5, -1.5, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = '#2D3436';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(6.2, -2.2, 1, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.fill();
    } else {
      ctx.strokeStyle = '#2D3436';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-9, -2);
      ctx.lineTo(-1, -2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(1, -2);
      ctx.lineTo(9, -2);
      ctx.stroke();
    }

    // Blush
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = '#FF85C1';
    ctx.beginPath();
    ctx.ellipse(-10, 4, 4, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(10, 4, 4, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // Mouth
    ctx.beginPath();
    ctx.arc(0, 5, 3, 0, Math.PI);
    ctx.strokeStyle = this._darken(this.color, 40);
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.restore();
  }

  _lighten(hex, amt) {
    if (!hex || hex === 'undefined') return `rgb(255,255,255)`;
    const r = Math.min(255, parseInt(hex.slice(1,3),16) + amt);
    const g = Math.min(255, parseInt(hex.slice(3,5),16) + amt);
    const b = Math.min(255, parseInt(hex.slice(5,7),16) + amt);
    return `rgb(${r},${g},${b})`;
  }

  _darken(hex, amt) {
    if (!hex || hex === 'undefined') return `rgb(0,0,0)`;
    const r = Math.max(0, parseInt(hex.slice(1,3),16) - amt);
    const g = Math.max(0, parseInt(hex.slice(3,5),16) - amt);
    const b = Math.max(0, parseInt(hex.slice(5,7),16) - amt);
    return `rgb(${r},${g},${b})`;
  }
}
