/**
 * GloryGame.js - 荣耀糖糖主控制器
 * 游戏状态管理 + 主循环 + 摄像机 + 无限生成 + 死亡判定
 */

import { GloryPlayer } from './GloryPlayer.js';
import { GloryPlatform } from './GloryPlatform.js';
import { GloryStar } from './GloryStar.js';
import { GloryBackground } from './GloryBackground.js';
import { GloryHUD } from './GloryHUD.js';
import { GloryParticles } from './GloryParticles.js';
import { GloryLevels } from './GloryLevels.js';

const W = 400;
const H = 640;

const lerp = (a, b, t) => a + (b - a) * t;

export const GameState = {
  MENU: 'MENU',
  PLAYING: 'PLAYING',
  GAME_OVER: 'GAME_OVER',
};

export class GloryGame {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.W = W;
    this.H = H;

    // 模块
    this.bg = new GloryBackground(W, H);
    this.hud = new GloryHUD(W, H);
    this.particles = new GloryParticles();
    this.levels = new GloryLevels();

    // 游戏状态
    this.state = GameState.MENU;
    this.player = null;
    this.platforms = [];
    this.stars = [];
    this.camY = 0;
    this._lastTime = 0;
    this.score = 0;
    this._gameOverPending = undefined;
    this.onGameOver = null;

    // 内部
    this._direction = null;
  }

  // --- 对外 API ---

  start() {
    this._initGame();
    this.state = GameState.PLAYING;
    this._lastTime = performance.now();
    this._loop();
  }

  restart() {
    this.start();
  }

  triggerGameOver() {
    if (this.state !== GameState.PLAYING) return;
    this.state = GameState.GAME_OVER;
    this._gameOverPending = this.score;
    if (this.onGameOver) this.onGameOver(this.score);
  }

  setDirection(dir) {
    this._direction = dir;
  }

  // --- 内部 ---

  _initGame() {
    this.camY = 0;
    this.platforms = [];
    this.stars = [];
    this.particles = new GloryParticles();

    // 初始玩家
    this.player = new GloryPlayer(W / 2, H - 100);

    // 初始平台（玩家脚下 + 往上几层）
    let startY = H - 80;
    // 第一个平台在玩家下方
    const firstPlat = new GloryPlatform(W / 2 - 50, startY, 100, '#BF40FF');
    this.platforms.push(firstPlat);

    // 生成初始平台链
    let lastX = W / 2;
    let lastY = startY;
    for (let i = 0; i < 8; i++) {
      const gap = 55 + Math.random() * 25;
      lastY -= gap;
      const platW = 90 + Math.random() * 50;
      const platX = Math.max(20, Math.min(W - platW - 20, lastX - platW / 2 + (Math.random() - 0.5) * 60));
      const plat = new GloryPlatform(platX, lastY, platW);
      this.platforms.push(plat);

      // 星星
      if (Math.random() < 0.3) {
        const starX = platX + platW / 2;
        const starY = plat.y - 30 - Math.random() * 30;
        this.stars.push(new GloryStar(starX, starY));
      }

      lastX = platX + platW / 2;
    }

    this.hud.reset();
    this._direction = null;
  }

  _loop() {
    if (this.state === GameState.MENU || this.state === GameState.GAME_OVER) return;

    const now = performance.now();
    const dt = Math.min((now - this._lastTime) / 1000, 0.05); // cap at 50ms
    this._lastTime = now;

    this._update(dt);
    this._render();

    requestAnimationFrame(() => this._loop());
  }

  _update(dt) {
    const hudTime = this.hud.getElapsedSeconds();

    // 方向输入
    if (this._direction) {
      this.player.setDirection(this._direction);
      this._direction = null;
    }

    // 拖尾粒子
    this.particles.emitTrail(this.player.x, this.player.y);

    // 更新玩家
    const { bounced } = this.player.update(dt, this.platforms, W);
    if (bounced) {
      this.particles.emitBounce(this.player.x, this.player.y + this.player.radius);
    }

    // 摄像机跟随（只升不降）
    const targetCamY = this.player.y - H * 0.65;
    this.camY = lerp(this.camY, targetCamY, 0.08);
    // 永不超过玩家视线
    const maxCamY = this.player.y - H * 0.3;
    if (this.camY > maxCamY) this.camY = maxCamY;
    if (this.camY < 0) this.camY = 0;

    // 平台无限生成
    const topPlatY = Math.min(...this.platforms.map(p => p.y));
    while (this.platforms.length < 8) {
      const gap = this.levels.randGap(hudTime);
      const platW = this.levels.randPlatformWidth(hudTime);
      const lastPlat = this.platforms[this.platforms.length - 1];
      const newY = lastPlat.y - gap;
      const newX = Math.max(20, Math.min(W - platW - 20, lastPlat.x + platW / 2 - platW / 2 + (Math.random() - 0.5) * 80));
      const plat = new GloryPlatform(newX, newY, platW);
      this.platforms.push(plat);

      // 星星生成
      if (this.levels.shouldSpawnStar(hudTime)) {
        const starX = newX + platW / 2;
        const starY = newY - 30 - Math.random() * 30;
        this.stars.push(new GloryStar(starX, starY));
        if (this.levels.shouldSpawnTwoStars(hudTime)) {
          this.stars.push(new GloryStar(starX + 25, starY - 10));
        }
      }
    }

    // 清理超出视野的平台和星星
    const cullY = this.camY + H + 200;
    this.platforms = this.platforms.filter(p => p.y < cullY);
    this.stars = this.stars.filter(s => s.y < cullY);

    // 星星收集
    for (const star of this.stars) {
      star.update(dt);
      if (!star.collected && star.collidesWith(this.player)) {
        star.collect();
        this.hud.addStar();
        this.particles.emitCollectStar(star.x, star.y);
      }
    }

    // 粒子更新
    this.particles.update();

    // HUD 更新
    this.hud.update();

    // 死亡判定
    if (this.player.y - this.camY > H + 50) {
      this.triggerGameOver();
    }
  }

  _render() {
    const ctx = this.ctx;

    // 背景（固定）
    this.bg.draw(ctx);

    // 世界物体（滚动）
    ctx.save();
    ctx.translate(0, -this.camY);

    // 平台
    for (const plat of this.platforms) {
      plat.draw(ctx);
    }

    // 星星
    for (const star of this.stars) {
      star.draw(ctx);
    }

    // 玩家（只在 PLAYING 状态绘制）
    if (this.player) this.player.draw(ctx);

    // 粒子
    this.particles.draw(ctx);

    ctx.restore();

    // HUD（固定 screen space）
    this.hud.draw(ctx);

    // 游戏结束遮罩
    if (this.state === GameState.GAME_OVER) {
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(0, 0, W, H);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 36px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('GAME OVER', W / 2, H / 2 - 30);

      ctx.font = '18px sans-serif';
      ctx.fillText(`Score: ${this.hud.score}`, W / 2, H / 2 + 10);
      ctx.fillText(`Time: ${this.hud.formatTime(this.hud.getElapsedSeconds())}`, W / 2, H / 2 + 38);

      ctx.font = '14px sans-serif';
      ctx.fillStyle = '#aaaaaa';
      ctx.fillText('Tap to Restart', W / 2, H / 2 + 80);
      ctx.restore();
    }
  }
}
