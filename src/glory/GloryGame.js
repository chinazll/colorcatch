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

    // Hide old HTML overlay immediately so it doesn't block canvas
    const overlay = document.getElementById('ui-overlay');
    if (overlay) overlay.style.display = 'none';

    this._bindInput();
    this._loop(0);
  }

  _bindInput() {
    const getCoords = (e, src) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = src.clientX - rect.left;
      const y = src.clientY - rect.top;
      return {
        cx: x * (this.W / rect.width),
        cy: y * (this.H / rect.height)
      };
    };

    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      const { cx, cy } = getCoords(e, touch);
      if (this.state === 'MENU') {
        this._menu.handleClick(cx, cy);
        return;
      }
      if (this.state === 'GAME_OVER') {
        if (this._gameOver) this._gameOver.handleClick(cx, cy);
        return;
      }
      // PLAYING: left/right based on canvas X midpoint
      this.setDirection(cx < this.W / 2 ? 'left' : 'right');
    }, { passive: false });

    this.canvas.addEventListener('click', (e) => {
      const { cx, cy } = getCoords(e, e);
      if (this.state === 'MENU') {
        this._menu.handleClick(cx, cy);
        return;
      }
      if (this.state === 'GAME_OVER') {
        if (this._gameOver) this._gameOver.handleClick(cx, cy);
        return;
      }
      this.setDirection(cx < this.W / 2 ? 'left' : 'right');
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
    this.player = new GloryPlayer(W / 2, H * 0.78, W);
    this.platforms = [];
    this.stars = [];
    this.camY = 0;
    this.score = 0;
    this._elapsedTime = 0;
    this.hud = new GloryHUD();
    if (this.hud.setPlayerColor) this.hud.setPlayerColor('#BF40FF');
    this.particles = new GloryParticles();

    // Initial platforms - spread below and above player for immediate bouncing
    this.platforms.push(new GloryPlatform(50, H * 0.80, 120)); // under player
    this.platforms.push(new GloryPlatform(W * 0.5, H * 0.62, 100));
    this.platforms.push(new GloryPlatform(20, H * 0.46, 90));
    this.platforms.push(new GloryPlatform(W * 0.6, H * 0.32, 100));
    this.platforms.push(new GloryPlatform(40, H * 0.18, 110));
    this.platforms.push(new GloryPlatform(W * 0.55, H * 0.04, 90));
    // Stars on initial platforms
    for (const plat of this.platforms) {
      if (Math.random() < 0.6) {
        this.stars.push(new GloryStar(plat.x + plat.width / 2, plat.y - 30));
      }
    }
  }

  _generatePlatform(yPos) {
    const W = this.W;
    const difficulty = GloryLevels.getDifficulty(this._elapsedTime);
    const w = difficulty.platformWidth[0] + Math.random() * (difficulty.platformWidth[1] - difficulty.platformWidth[0]);
    const x = 20 + Math.random() * (W - 40 - w);
    const plat = new GloryPlatform(x, yPos, w);
    this.platforms.push(plat);

    if (Math.random() < difficulty.starDensity) {
      this.stars.push(new GloryStar(x + w / 2, yPos - 30 - Math.random() * 30));
      if (Math.random() < 0.2) {
        this.stars.push(new GloryStar(x + w / 2 + (Math.random() - 0.5) * 60, yPos - 40 - Math.random() * 20));
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
      () => { this._initGame(); this.state = 'PLAYING'; },
      () => {
        this.state = 'MENU';
        const overlay = document.getElementById('ui-overlay');
        if (overlay) overlay.style.display = '';
      }
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

    const event = this.player.update(dt, this.platforms);
    if (event === 'bounce') {
      this.particles.emit(this.player.x, this.player.y, 'bounce');
    }
    this.particles.emit(this.player.x, this.player.y, 'trail');

    // Camera - follows player (both up and down) with lerp smoothing
    const targetCamY = this.player.y - this.H * 0.65;
    this.camY += (targetCamY - this.camY) * 0.08;
    this.camY = Math.max(0, this.camY);

    // Death
    if (this.player.y - this.camY > this.H + 50) {
      this.triggerGameOver();
      return;
    }

    // Generate platforms ahead
    while (this.platforms.length < 8) {
      const topPlat = this.platforms.reduce((m, p) => p.y < m.y ? p : m, this.platforms[0]);
      const difficulty = GloryLevels.getDifficulty(this._elapsedTime);
      const gap = difficulty.gap[0] + Math.random() * (difficulty.gap[1] - difficulty.gap[0]);
      this._generatePlatform(topPlat.y - gap);
    }

    // Stars
    for (const star of this.stars) {
      star.update(dt);
      if (!star.collected && star.collidesWith(this.player)) {
        star.collect();
        this.score += 10;
        this.hud.setScore(this.score);
        this.particles.emit(star.x, star.y, 'collect_star');
      }
    }
    this.stars = this.stars.filter(s => {
      if (s.collected && s.collectTimer > 15) return false;
      return (s.y - this.camY) > -100 && (s.y - this.camY) < this.H + 200;
    });

    // Cull
    this.platforms = this.platforms.filter(p => (p.y - this.camY) < this.H + 200);
    this.particles.update(dt);
    this.hud.update(dt);
  }

  _render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.W, this.H);
    this.background.draw(ctx, 0);

    if (this.state === 'MENU') {
      this._menu.draw(ctx);
      return;
    }

    ctx.save();
    ctx.translate(0, -this.camY);
    for (const p of this.platforms) p.draw(ctx, this.camY);
    for (const s of this.stars) s.draw(ctx, this.camY);
    if (this.player) this.player.draw(ctx, this.camY);
    this.particles.draw(ctx, this.camY);
    ctx.restore();

    if (this.state === 'PLAYING') this.hud.draw(ctx);
    if (this.state === 'GAME_OVER' && this._gameOver) this._gameOver.draw(ctx);
  }
}
export { GloryGame };
