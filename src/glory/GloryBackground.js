/**
 * GloryBackground.js - Glory Candy deep space background
 * Dark blue gradient + star dust particles
 */
class GloryBackground {
  constructor() {
    this.stars = [];
    const count = 30 + Math.floor(Math.random() * 21);
    for (let i = 0; i < count; i++) {
      this.stars.push({
        x: Math.random() * 400,
        y: Math.random() * 10000,
        size: 1 + Math.random() * 2,
        alpha: 0.3 + Math.random() * 0.5
      });
    }
  }

  draw(ctx, camY) {
    if (!ctx) return;
    const W = 400;
    const H = 640;
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#0a1628');
    grad.addColorStop(1, '#1a2a4a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    for (const star of this.stars) {
      const screenY = (star.y - camY * 0.3) % (H + 200);
      ctx.globalAlpha = star.alpha;
      ctx.beginPath();
      ctx.arc(star.x, screenY, star.size, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}
export { GloryBackground };
