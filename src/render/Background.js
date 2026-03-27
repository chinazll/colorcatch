import { roundRect } from '../utils/utils.js';

export class Background {
  constructor(W, H) {
    this.W = W;
    this.H = H;
    this.layers = [
      { speed: 0.2, offset: 0, clouds: [] },
      { speed: 0.5, offset: 0, hills: [] },
      { speed: 1.0, offset: 0, grass: [] },
    ];
    this._init();
  }

  _init() {
    // 初始化云朵
    this.layers[0].clouds = [];
    for (let i = 0; i < 5; i++) {
      this.layers[0].clouds.push({
        x: Math.random() * this.W * 1.5,
        y: 30 + Math.random() * 80,
        w: 60 + Math.random() * 80,
        h: 25 + Math.random() * 20,
      });
    }
    // 初始化山丘
    this.layers[1].hills = [];
    for (let i = 0; i < 6; i++) {
      this.layers[1].hills.push({
        x: i * (this.W / 3) - 50,
        h: 60 + Math.random() * 80,
        w: this.W / 2.5 + Math.random() * 50,
      });
    }
    // 初始化草地装饰
    this.layers[2].grass = [];
    for (let i = 0; i < 20; i++) {
      this.layers[2].grass.push({
        x: i * (this.W / 10) + Math.random() * 20,
        h: 8 + Math.random() * 12,
        sway: Math.random() * Math.PI * 2,
      });
    }
  }

  update(playerVY) {
    const scrollSpeed = Math.max(0, -playerVY) * 0.3;
    this.layers.forEach((layer) => {
      layer.offset = (layer.offset + scrollSpeed * layer.speed) % (this.W * 2);
    });
    this.layers[2].grass.forEach((g) => { g.sway += 0.05; });
  }

  draw(ctx) {
    const W = this.W;
    const H = this.H;

    // 天空渐变
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#87CEEB');
    sky.addColorStop(0.5, '#B8E4F9');
    sky.addColorStop(1, '#FFE4E1');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    // 远景云
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    this.layers[0].clouds.forEach((c) => {
      const cx = ((c.x - this.layers[0].offset * 0.5) % (W * 1.5 + c.w)) - c.w;
      this._drawCloud(ctx, cx, c.y, c.w, c.h);
    });

    // 中景山丘
    this.layers[1].hills.forEach((h) => {
      const hx = ((h.x - this.layers[1].offset * 0.5) % (W + h.w * 2)) - h.w;
      ctx.fillStyle = '#90C695';
      ctx.beginPath();
      ctx.ellipse(hx + h.w / 2, H - 60, h.w / 2, h.h, 0, Math.PI, 0);
      ctx.fill();
    });

    // 近景草地
    this.layers[2].grass.forEach((g) => {
      const gx = ((g.x - this.layers[2].offset) % (W + 30)) - 15;
      const sway = Math.sin(g.sway) * 3;
      ctx.strokeStyle = '#6BBF59';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(gx, H);
      ctx.quadraticCurveTo(gx + sway, H - g.h / 2, gx + sway * 1.5, H - g.h);
      ctx.stroke();
    });

    // 地面
    const ground = ctx.createLinearGradient(0, H - 60, 0, H);
    ground.addColorStop(0, '#7EC850');
    ground.addColorStop(1, '#5A9E3A');
    ctx.fillStyle = ground;
    ctx.beginPath();
    roundRect(ctx, 0, H - 60, W, 60, 0);
    ctx.fill();
  }

  _drawCloud(ctx, x, y, w, h) {
    ctx.beginPath();
    ctx.ellipse(x, y, w * 0.5, h * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x - w * 0.3, y + h * 0.1, w * 0.35, h * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x + w * 0.3, y + h * 0.05, w * 0.3, h * 0.45, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}
