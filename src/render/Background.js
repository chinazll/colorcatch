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
    // 初始化云朵 — 更多更丰富
    this.layers[0].clouds = [];
    const cloudColors = [
      'rgba(255,255,255,0.9)',
      'rgba(255,240,245,0.85)',  // 粉色云
      'rgba(230,248,255,0.85)',  // 淡蓝云
      'rgba(255,255,230,0.85)',  // 淡黄云
    ];
    for (let i = 0; i < 10; i++) {
      this.layers[0].clouds.push({
        x: Math.random() * this.W * 1.8,
        y: 20 + Math.random() * 100,
        w: 50 + Math.random() * 90,
        h: 20 + Math.random() * 25,
        color: cloudColors[Math.floor(Math.random() * cloudColors.length)],
      });
    }
    // 初始化山丘 — 多层彩色
    this.layers[1].hills = [];
    // 后层 — 淡紫色
    for (let i = 0; i < 5; i++) {
      this.layers[1].hills.push({
        x: i * (this.W / 2.5) - 80,
        h: 50 + Math.random() * 60,
        w: this.W / 2 + Math.random() * 60,
        color: '#C8A8D0',
        layer: 0,
      });
    }
    // 中层 — 粉色
    for (let i = 0; i < 5; i++) {
      this.layers[1].hills.push({
        x: i * (this.W / 2.8) - 60,
        h: 60 + Math.random() * 70,
        w: this.W / 2.2 + Math.random() * 50,
        color: '#F4A8C0',
        layer: 1,
      });
    }
    // 前层 — 绿色
    for (let i = 0; i < 6; i++) {
      this.layers[1].hills.push({
        x: i * (this.W / 3) - 50,
        h: 60 + Math.random() * 80,
        w: this.W / 2.5 + Math.random() * 50,
        color: '#90C695',
        layer: 2,
      });
    }
    // 初始化草地装饰 — 带小花
    this.layers[2].grass = [];
    for (let i = 0; i < 30; i++) {
      this.layers[2].grass.push({
        x: i * (this.W / 15) + Math.random() * 20,
        h: 8 + Math.random() * 14,
        sway: Math.random() * Math.PI * 2,
        isFlower: Math.random() > 0.65,
        flowerColor: ['#FF6B6B', '#FFD93D', '#FF9F43', '#FF85C1', '#FFFFFF'][Math.floor(Math.random() * 5)],
        flowerX: Math.random() * 10 - 5,
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

    // 天空渐变 — 糖果风格，暖色调
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#87CEEB');
    sky.addColorStop(0.3, '#B8E4F9');
    sky.addColorStop(0.6, '#FFD1DC');  // 粉红天空
    sky.addColorStop(1, '#FFE4E1');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    // 太阳光晕
    const sunX = W * 0.85;
    const sunY = H * 0.15;
    const sunGlow = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, 80);
    sunGlow.addColorStop(0, 'rgba(255,240,150,0.8)');
    sunGlow.addColorStop(0.4, 'rgba(255,220,100,0.3)');
    sunGlow.addColorStop(1, 'rgba(255,200,80,0)');
    ctx.fillStyle = sunGlow;
    ctx.beginPath();
    ctx.arc(sunX, sunY, 80, 0, Math.PI * 2);
    ctx.fill();

    // 太阳本体
    ctx.fillStyle = '#FFE066';
    ctx.shadowColor = '#FFD700';
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(sunX, sunY, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // 远景云 — 彩色
    this.layers[0].clouds.forEach((c) => {
      const cx = ((c.x - this.layers[0].offset * 0.5) % (W * 1.8 + c.w)) - c.w;
      ctx.fillStyle = c.color;
      this._drawCloud(ctx, cx, c.y, c.w, c.h);
    });

    // 中景山丘 — 分层绘制
    // 先画后层（远景）
    this.layers[1].hills.filter(h => h.layer === 0).forEach((h) => {
      const hx = ((h.x - this.layers[1].offset * 0.3) % (W + h.w * 2)) - h.w;
      ctx.fillStyle = h.color;
      ctx.beginPath();
      ctx.ellipse(hx + h.w / 2, H - 50, h.w / 2, h.h, 0, Math.PI, 0);
      ctx.fill();
    });
    // 再画中层
    this.layers[1].hills.filter(h => h.layer === 1).forEach((h) => {
      const hx = ((h.x - this.layers[1].offset * 0.5) % (W + h.w * 2)) - h.w;
      ctx.fillStyle = h.color;
      ctx.beginPath();
      ctx.ellipse(hx + h.w / 2, H - 55, h.w / 2, h.h, 0, Math.PI, 0);
      ctx.fill();
    });
    // 最后画前层
    this.layers[1].hills.filter(h => h.layer === 2).forEach((h) => {
      const hx = ((h.x - this.layers[1].offset * 0.6) % (W + h.w * 2)) - h.w;
      ctx.fillStyle = h.color;
      ctx.beginPath();
      ctx.ellipse(hx + h.w / 2, H - 60, h.w / 2, h.h, 0, Math.PI, 0);
      ctx.fill();
    });

    // 近景草地
    this.layers[2].grass.forEach((g) => {
      const gx = ((g.x - this.layers[2].offset) % (W + 30)) - 15;
      const sway = Math.sin(g.sway) * 3;

      if (g.isFlower) {
        // 画小花
        ctx.fillStyle = g.flowerColor;
        ctx.shadowColor = g.flowerColor;
        ctx.shadowBlur = 3;
        ctx.beginPath();
        ctx.arc(gx + g.flowerX, H - g.h - 4, 3, 0, Math.PI * 2);
        ctx.fill();
        // 花心
        ctx.fillStyle = '#FFD700';
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.arc(gx + g.flowerX, H - g.h - 4, 1.5, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // 普通草
        ctx.strokeStyle = '#6BBF59';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(gx, H);
        ctx.quadraticCurveTo(gx + sway, H - g.h / 2, gx + sway * 1.5, H - g.h);
        ctx.stroke();
      }
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
