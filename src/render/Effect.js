// ─────────────────────────────────────────
// EFFECT — Screen Shake
// ─────────────────────────────────────────

export class ScreenShake {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.intensity = 0;
    this.decay = 0.9;
  }

  trigger(intensity) {
    this.intensity = Math.max(this.intensity, intensity);
  }

  update() {
    if (this.intensity > 0.1) {
      this.x = (Math.random() - 0.5) * this.intensity * 2;
      this.y = (Math.random() - 0.5) * this.intensity * 2;
      this.intensity *= this.decay;
    } else {
      this.x = 0;
      this.y = 0;
      this.intensity = 0;
    }
  }
}
