/**
 * GloryPlatform.js - Glory Candy glowing candy platform
 * Top-collision only, random width/color
 */
class GloryPlatform {
  constructor(x, y, width) {
    const W = 400;
    this.x = x;
    this.y = y;
    this.width = width || (60 + Math.random() * 60);
    this.height = 12;
    const colors = ['#00BFFF', '#BF40FF', '#FF69B4', '#FFD700'];
    this.color = colors[Math.floor(Math.random() * colors.length)];
    this.radius = 6;
  }

  draw(ctx, camY) {
    const screenY = this.y - camY;
    if (screenY < -50 || screenY > 740) return;

    ctx.save();
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 12;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.roundRect(this.x, screenY, this.width, this.height, this.radius);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // Top highlight
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.beginPath();
    ctx.roundRect(this.x + 2, screenY + 2, this.width - 4, 4, 2);
    ctx.fill();
    ctx.restore();
  }

  collidesWith(player) {
    if (!player) return false;
    const screenY = player.y;
    const inX = player.x + player.radius > this.x && player.x - player.radius < this.x + this.width;
    const atTop = player.y + player.radius >= this.y && player.y + player.radius <= this.y + 16;
    const falling = player.vy > 0;
    return inX && atTop && falling;
  }
}
export { GloryPlatform };
