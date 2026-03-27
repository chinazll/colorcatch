// Effect.js — Screen shake + flash controller

// Alias for code that imports ScreenEffect
export { ScreenShake as ScreenEffect };

export class ScreenShake {
  constructor() {
    this.shakeIntensity = 0;
    this.shakeDuration = 0;
    this.offsetX = 0;
    this.offsetY = 0;
    this.flashAlpha = 0;
    this.flashColor = '#ffffff';
  }

  shake(intensity, duration) {
    this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
    this.shakeDuration = Math.max(this.shakeDuration, duration);
  }

  trigger(intensity, duration = 0.3) {
    this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
    this.shakeDuration = Math.max(this.shakeDuration, duration);
  }

  flash(color = '#ffffff', alpha = 0.4) {
    this.flashColor = color;
    this.flashAlpha = alpha;
  }

  update() {
    if (this.shakeDuration > 0) {
      this.shakeDuration--;
      this.offsetX = (Math.random() - 0.5) * 2 * this.shakeIntensity;
      this.offsetY = (Math.random() - 0.5) * 2 * this.shakeIntensity;
      this.shakeIntensity *= 0.9;
      if (this.shakeDuration <= 0) {
        this.shakeIntensity = 0;
        this.offsetX = 0;
        this.offsetY = 0;
      }
    }
    if (this.flashAlpha > 0) {
      this.flashAlpha *= 0.85;
      if (this.flashAlpha < 0.01) this.flashAlpha = 0;
    }
  }

  applyTransform(ctx) {
    ctx.translate(this.offsetX, this.offsetY);
  }

  drawFlash(ctx) {
    if (this.flashAlpha > 0) {
      ctx.save();
      ctx.globalAlpha = this.flashAlpha;
      ctx.fillStyle = this.flashColor;
      ctx.fillRect(-10, -10, 420, 660);
      ctx.restore();
    }
  }

  getOffset() {
    return { x: this.offsetX, y: this.offsetY };
  }
}
