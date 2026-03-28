/**
 * GloryGame.js - Glory Candy main game controller
 * States: MENU | PLAYING | GAME_OVER
 * Physics: elastic ball, auto-bounce, left/right tap control
 */
import { GloryPlayer } from './GloryPlayer.js';
import { GloryPlatform } from './GloryPlatform.js';
import { GloryStar } from './GloryStar.js';
import { GloryBackground } from './GloryBackground.js';
import { GloryHUD } from './GloryHUD.js';
import { GloryMenu } from './GloryMenu.js';
import { GloryGameOver } from './GloryGameOver.js';
import { GloryParticles } from './GloryParticles.js';
import { GloryLevels } from './GloryLevels.js';

class GloryGame {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.W = 400;
    this.H = 640;
    this.state = 'MENU';
    this.player = null;
    this.platforms = [];
    this.stars = [];
    this.camY = 0;
    this.score = 0;
    this._gameOverPending = undefined;
    this.onGameOver = null;
    this._lastTime = 0;
    this._direction = null;
    this._lastDirTime = 0;
    this.background = new GloryBackground();
    this.hud = new GloryHUD();
    this.particles = new GloryParticles();
    this._menu = new GloryMenu(
      () => this.start(),
      () => { /* sound toggle placeholder */ }
    );
    this._gameOver = null;
    this._elapsedTime = 0;

    this._bindInput();
    this._loop(0);
  }

  _bindInput() {
    const handleTap = (clientX) => {
      if (this.state === 'MENU') {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.W / rect.width;
        const cx = (clientX - rect.left) * scaleX;
        this._menu.handleClick(cx, cx); // approximate - needs fixing
        return;
      }
      if (this.state === 'GAME_OVER') {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.W / rect.width;
        const cx = (clientX - rect.left) * scaleX;
        if (this._gameOver) this._gameOver.handleClick(cx, cx);
        return;
      }
      if (this.state === 'PLAYING') {
        // Left/right tap
        const mid = window.innerWidth / 2;
        this.setDirection(clientX < mid ? 'left' : 'right');
      }
    };

    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      if (this.state === 'MENU') {
        const rect = this.canvas.getBoundingClientRect();
        const cx = (touch.clientX - rect.left) * (this.W / rect.width);
        const cy = (touch.clientY - rect.top) * (this.H / rect.height);
        this._menu.handleClick(cx, cy);
        return;
      }
      if (this.state === 'GAME_OVER') {
        const rect = this.canvas.getBoundingClientRect();
        const cx = (touch.clientX - rect.left) * (this.W / rect.width);
        const cy = (touch.clientY - rect.top) * (this.H / rect.height);
        if (this._gameOver) this._gameOver.handleClick(cx, cy);
        return;
      }
      const mid = window.innerWidth / 2;
      this.setDirection(touch.clientX < mid ? 'left' : 'right');
    }, { passive: false });

    this.canvas.addEventListener('click', (e) => {
      if (this.state === 'MENU') {
        const rect = this.canvas.getBoundingClientRect();
        const cx = (e.clientX - rect.left) * (this.W / rect.width);
        const cy = (e.clientY - rect.top) * (this.H / rect.height);
        this._menu.handleClick(cx, cy);
        return;
      }
      if (this.state === 'GAME_OVER') {
        const rect = this.canvas.getBoundingClientRect();
        const cx = (e.clientX - rect.left) * (this.W / rect.width);
        const cy = (e.clientY - rect.top) * (this.H / rect.height);
        if (this._gameOver) this._gameOver.handleClick(cx, cy);
        return;
      }
    });
  }

  setDirection(dir) {
    const now = performance.now();
    if (now - this._lastDirTime < 100) return;
    this._lastDirTime = now;
    if (this.player) this.player.setDirection(dir);
  }

  start() {
    this.state = 'MENU';
    this._initGame();
    this.state = 'PLAYING';
  }

  _initGame() {
    const W = this.W;
    const H = this.H;
    this.player = new GloryPlayer(W / 2, H * 0.6);
    this.platforms = [];
    this.stars = [];
    this.camY = 0;
    this.score = 0;
    this._elapsedTime = 0;
    this.hud = new GloryHUD();
    this.hud.setPlayerColor && this.hud.setPlayerColor('#BF40FF');
    this.particles = new GloryParticles();

    // Initial platforms
    for (let i = 0; i < 8; i++) {
      this._generatePlatform(H * 0.7 + i * (H * 0.2));
    }
  }

  _generatePlatform(yPos) {
    const W = this.W;
    const difficulty = GloryLevels.getDifficulty(this._elapsedTime);
    const width = difficulty.platformWidth[0] + Math.random() * (difficulty.platformWidth[1] - difficulty.platformWidth[0]);
    const x = 20 + Math.random() * (W - 40 - width);
    const plat = new GloryPlatform(x, yPos, width);
    this.platforms.push(plat);

    // Star on platform
    if (Math.random() < difficulty.starDensity) {
      const starX = x + width / 2 + (Math.random() - 0.5) * 40;
      const starY = yPos - 30 - Math.random() * 30;
      this.stars.push(new GloryStar(starX, starY));
      if (Math.random() < 0.2) {
        this.stars.push(new GloryStar(
          x + width / 2 + (Math.random() - 0.5) * 60,
          yPos - 40 - Math.random() * 20
        ));
      }
    }
  }

  triggerGameOver() {
    if (this.state !== 'PLAYING') return;
    this.state = 'GAME_OVER';
    this._gameOverPending = this.score;
    if (this.onGameOver) this.onGameOver(this.score);
    const hs = localStorage.getItem('glory_highscore') || 0;
    if (this.score > parseInt(hs)) localStorage.setItem('glory_highscore', this.score);
    this._gameOver = new GloryGameOver(
      this.score,
      () => this._initGame() || (this.state = 'PLAYING'),
      () => this.state = 'MENU'
    );
  }

  _loop(ts) {
    const dt = Math.min((ts - this._lastTime) / 1000, 0.05);
    this._lastTime = ts;
    this._update(dt);
    this._render();
    requestAnimationFrame((t) => this._loop(t));
  }

  _update(dt) {
    if (this.state === 'MENU') {
      this._menu.update(dt);
      return;
    }
    if (this.state !== 'PLAYING') return;

    this._elapsedTime += dt;

    // Update player
    const event = this.player.update(dt, this.platforms);
    if (event === 'bounce') {
      this.particles.emit(this.player.x, this.player.y, 'bounce');
    }

    // Trail
    this.particles.emit(this.player.x, this.player.y, 'trail');

    // Camera - only goes up, never down
    const targetCamY = this.player.y - this.H * 0.65;
    this.camY += (Math.min(targetCamY, this.camY) - this.camY) * 0.08;
    this.camY = Math.max(0, Math.min(this.camY, this.player.y - this.H * 0.3));

    // Death check
    if (this.player.y - this.camY > this.H + 50) {
      this.triggerGameOver();
      return;
    }

    // Generate platforms ahead
    const difficulty = GloryLevels.getDifficulty(this._elapsedTime);
    while (this.platforms.length < 8) {
      const topPlat = this.platforms.reduce((min, p) => p.y < min.y ? p : min, this.platforms[0]);
      const gap = difficulty.gap[0] + Math.random() * (difficulty.gap[1] - difficulty.gap[0]);
      this._generatePlatform(topPlat.y - gap);
    }

    // Update & cull stars
    for (const star of this.stars) {
      star.update(dt);
      if (star.collected && star.collectTimer > 15) continue;
      if (star.collidesWith(this.player) && !star.collected) {
        star.collect();
        this.score += 10;
        this.hud.setScore(this.score);
        this.particles.emit(star.x, star.y, 'collect_star');
      }
    }
    this.stars = this.stars.filter(s => {
      if (s.collected && s.collectTimer > 15) return false;
      const sy = s.y - this.camY;
      return sy > -100 && sy < this.H + 200;
    });

    // Cull platforms
    this.platforms = this.platforms.filter(p => {
      return p.y - this.camY < this.H + 200;
    });

    this.particles.update(dt);
    this.hud.update(dt);
  }

  _render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.W, this.H);
    this.background.draw(ctx, 0); // background is fixed

    if (this.state === 'MENU') {
      this._menu.draw(ctx);
      return;
    }

    ctx.save();
    ctx.translate(0, -this.camY);

    // Platforms
    for (const p of this.platforms) p.draw(ctx, this.camY);

    // Stars
    for (const s of this.stars) s.draw(ctx, this.camY);

    // Player
    if (this.player) this.player.draw(ctx, this.camY);

    // Particles
    this.particles.draw(ctx, this.camY);

    ctx.restore();

    // HUD (screen space)
    if (this.state === 'PLAYING') {
      this.hud.draw(ctx);
    }

    if (this.state === 'GAME_OVER') {
      if (this._gameOver) this._gameOver.draw(ctx);
    }
  }
}
export { GloryGame };
