import { Player, COLOR_KEYS, COLORS } from './Player.js';
import { Platform, ColorBall, PLAT_TYPES } from './Platform.js';
import { ParticlePool, ScorePopup } from './Particle.js';
import { Background } from '../render/Background.js';
import { HUD } from '../render/HUD.js';
import { ScreenShake } from '../render/Effect.js';
import { getLevelConfig, getRandomColorKey } from './levels.js';
import { playSound } from '../utils/audio.js';

export class Game {
  constructor(canvas, ctx, W, H) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.W = W;
    this.H = H;

    this.particles = null;
    this.scorePopups = null;
    this.platforms = [];
    this.colorBalls = [];
    this.player = null;

    this.score = 0;
    this.combo = 0;
    this.comboTimer = 0;
    this.maxCombo = 0;
    this.level = 1;
    this.levelTimer = 0;

    this.gameOver = false;
    this.gameOverAnim = 0;
    this.started = false;

    this.scrollY = 0;
    this.cameraTargetY = 0;

    this.shake = new ScreenShake();
    this.background = new Background(W, H);
    this.hud = new HUD(W, H);

    this.keys = {};
    this.touchStartX = null;

    this.lastTime = 0;

    this._bindInput();
  }

  // ─────────────────────────────────────────
  // INIT
  // ─────────────────────────────────────────

  _init() {
    this.particles = new ParticlePool();
    this.scorePopups = [];
    this.platforms = [];
    this.colorBalls = [];
    this.scrollY = 0;
    this.cameraTargetY = 0;
    this.shake = new ScreenShake();

    this.score = 0;
    this.combo = 0;
    this.comboTimer = 0;
    this.maxCombo = 0;
    this.level = 1;
    this.levelTimer = 0;
    this.gameOver = false;
    this.gameOverAnim = 0;

    // 初始平台
    const groundPlat = new Platform(this.W / 2 - 50, this.H - 80, 100, COLOR_KEYS[0], 'normal');
    groundPlat.setColor(COLORS[COLOR_KEYS[0]]);
    groundPlat.entered = true;
    groundPlat.animScale = 1;
    this.platforms.push(groundPlat);

    // 玩家
    this.player = new Player(this.W / 2, this.H - 80 - 20);

    // 生成初始平台
    for (let i = 0; i < 8; i++) {
      this._spawnRow(this.H - 80 - (i + 1) * 85, i);
    }

    // 给所有平台设置颜色
    this.platforms.forEach((pl) => {
      if (!pl.color) pl.setColor(COLORS[pl.colorKey]);
    });
  }

  // ─────────────────────────────────────────
  // SPAWN
  // ─────────────────────────────────────────

  _spawnRow(y, rowIndex) {
    const cfg = getLevelConfig(this.level);
    const spacing = this.W / (cfg.platformCount + 1);

    for (let i = 0; i < cfg.platformCount; i++) {
      const x = spacing * (i + 1) - 35 + Math.random() * 20;
      const w = cfg.platformWidthMin + Math.random() * (cfg.platformWidthMax - cfg.platformWidthMin);
      const colorKey = getRandomColorKey();
      const r = Math.random();

      let type = 'normal';
      if (rowIndex > 2) {
        if (r < cfg.bonusChance) type = 'bonus';
        else if (r < cfg.bonusChance + cfg.crumblingChance) type = 'crumbling';
        else if (r < cfg.bonusChance + cfg.crumblingChance + cfg.movingChance) type = 'moving';
      }

      const plat = new Platform(x, y, w, colorKey, type);
      plat.setColor(COLORS[colorKey]);
      this.platforms.push(plat);

      // 颜色球
      if (Math.random() < cfg.ballChance) {
        const ballX = spacing * (i + 1) + Math.random() * 30 - 15;
        const ballColorKey = getRandomColorKey(
          this.player ? this.player.colorKey : null,
          cfg.ballColorSameBias
        );
        this.colorBalls.push(new ColorBall(ballX, y - 30 - Math.random() * 20, ballColorKey, COLORS[ballColorKey]));
      }
    }
  }

  // ─────────────────────────────────────────
  // START / GAME OVER
  // ─────────────────────────────────────────

  start() {
    document.getElementById('ui-overlay').classList.add('active');
    document.getElementById('start-panel').classList.remove('visible');
    document.getElementById('over-panel').classList.remove('visible');
    this._init();
    this.started = true;
    this.lastTime = performance.now();
    requestAnimationFrame((ts) => this._loop(ts));
  }

  _showGameOver() {
    document.getElementById('final-score').textContent = this.score;
    document.getElementById('ui-overlay').classList.add('active');
    document.getElementById('over-panel').classList.add('visible');
  }

  _showCombo(count) {
    if (count < 2) return;
    const el = document.getElementById('combo-el');
    el.textContent = `${count}x COMBO!`;
    el.classList.remove('pop');
    void el.offsetWidth;
    el.classList.add('pop');
    this.shake.trigger(count >= 5 ? 4 : 2);
    if (count >= 5) {
      this.particles.emit(this.W / 2, this.H / 2, '#FFD700', 'eliminate', 20);
    }
    playSound('combo');
  }

  // ─────────────────────────────────────────
  // INPUT
  // ─────────────────────────────────────────

  _bindInput() {
    document.addEventListener('keydown', (e) => {
      this.keys[e.key] = true;
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].includes(e.key)) {
        e.preventDefault();
      }
      // Jump on space
      if (e.key === ' ' && this.started && !this.gameOver && this.player.onGround) {
        this._doJump();
      }
    });
    document.addEventListener('keyup', (e) => { this.keys[e.key] = false; });

    // Touch support
    this.canvas.addEventListener('touchstart', (e) => {
      this.touchStartX = e.touches[0].clientX;
      // Tap to jump
      if (this.started && !this.gameOver && this.player.onGround) {
        this._doJump();
      }
      e.preventDefault();
    }, { passive: false });

    this.canvas.addEventListener('touchmove', (e) => {
      if (this.touchStartX !== null && this.started && !this.gameOver) {
        const dx = e.touches[0].clientX - this.touchStartX;
        this.player.vx += dx * 0.015;
        this.touchStartX = e.touches[0].clientX;
      }
      e.preventDefault();
    }, { passive: false });

    this.canvas.addEventListener('touchend', () => { this.touchStartX = null; });

    // Click to jump
    this.canvas.addEventListener('click', () => {
      if (this.started && !this.gameOver && this.player.onGround) {
        this._doJump();
      }
    });
  }

  _doJump() {
    if (this.player.jump()) {
      this.particles.emit(this.player.x, this.player.y + this.player.r, this.player.color, 'jump', 10);
      playSound('jump');
    }
  }

  // ─────────────────────────────────────────
  // COLLISION
  // ─────────────────────────────────────────

  _checkPlatformCollision(player, platform) {
    if (!platform.alive) return false;
    if (player.vy < 0) return false;
    const px = player.x;
    const py = player.y;
    const pr = player.r;
    const platTop = platform.y + platform.h / 2 + platform.springY;
    const platLeft = platform.x;
    const platRight = platform.x + platform.w;
    const prevPY = py - player.vy;
    if (px > platLeft - pr * 0.5 && px < platRight + pr * 0.5) {
      if (prevPY <= platTop + 2 && py >= platTop - 2) {
        return true;
      }
    }
    return false;
  }

  _checkBallCollision(player, ball) {
    if (!ball.alive) return false;
    const dx = player.x - ball.x;
    const dy = player.y - ball.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    return dist < player.r + ball.r;
  }

  // ─────────────────────────────────────────
  // UPDATE
  // ─────────────────────────────────────────

  _update(dt) {
    if (this.gameOver) {
      this.gameOverAnim += dt;
      return;
    }

    const p = this.player;

    // Combo计时
    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) {
        this.combo = 0;
      }
    }

    // Level升级
    this.levelTimer += dt;
    if (this.levelTimer > 15) {
      this.levelTimer = 0;
      this.level = Math.min(10, this.level + 1);
    }

    // 输入 — 左右移动
    if (this.keys['ArrowLeft'] || this.keys['a'] || this.keys['A']) p.vx -= 0.6;
    if (this.keys['ArrowRight'] || this.keys['d'] || this.keys['D']) p.vx += 0.6;

    p.update(dt);
    p.clampX(this.W);

    // 平台更新
    this.platforms.forEach((pl) => pl.update(dt, this.scrollY, this.W));
    this.platforms = this.platforms.filter((pl) => pl.alive);

    // 颜色球更新
    this.colorBalls.forEach((ball) => ball.update(dt));
    this.colorBalls = this.colorBalls.filter((ball) => ball.alive);

    // 平台碰撞
    let landed = false;
    for (const pl of this.platforms) {
      if (this._checkPlatformCollision(p, pl)) {
        p.y = pl.y + pl.h / 2 + pl.springY - p.r;
        if (p.vy > 2) p.land();
        p.vy = 0;
        p.onGround = true;
        landed = true;
        pl.land();

        if (pl.colorKey === p.colorKey) {
          const comboMultiplier = Math.max(1, this.combo);
          const baseScore = pl.type === 'bonus' ? 30 : 10;
          const pts = baseScore * comboMultiplier;
          this.score += pts;
          this.combo++;
          this.comboTimer = 2.0;
          this.maxCombo = Math.max(this.maxCombo, this.combo);
          if (this.combo >= 2) this._showCombo(this.combo);
          this.particles.emit(p.x, p.y, pl.color, 'score', 12);
          this.scorePopups.push(new ScorePopup(p.x, p.y - 20, `+${pts}`, '#FFD700'));
          this._changePlayerColor();
          if (this.combo >= 3) {
            this.particles.emit(p.x, p.y, pl.color, 'eliminate', 8);
          }
          playSound('score');
        } else {
          this.combo = 0;
          this.particles.emit(p.x, p.y, '#FF0000', 'eliminate', 15);
          this.shake.trigger(6);
          this.scorePopups.push(new ScorePopup(p.x, p.y - 20, '颜色不匹配!', '#FF4444'));
          playSound('gameover');
          this.gameOver = true;
          setTimeout(() => this._showGameOver(), 600);
          return;
        }
        break;
      }
    }
    if (!landed) p.onGround = false;

    // 颜色球碰撞
    for (const ball of this.colorBalls) {
      if (this._checkBallCollision(p, ball)) {
        const pts = ball.bonus ? 50 : 15;
        this.score += pts;
        this.particles.emit(ball.x, ball.y, ball.color, 'score', 15);
        if (ball.bonus) {
          this.particles.emit(ball.x, ball.y, '#FFD700', 'eliminate', 20);
          this.shake.trigger(3);
          playSound('bonus');
        } else {
          playSound('score');
        }
        this.scorePopups.push(new ScorePopup(ball.x, ball.y, `+${pts}`, '#FFD700'));
        ball.alive = false;
      }
    }

    // 相机跟随
    const targetCameraY = Math.min(0, -(p.y - this.H * 0.6));
    this.cameraTargetY += (targetCameraY - this.cameraTargetY) * 0.1;
    this.scrollY = this.cameraTargetY;

    // 背景视差
    this.background.update(p.vy);

    // 粒子
    this.particles.update();
    this.scorePopups = this.scorePopups.filter((s) => { s.update(); return s.alive; });
    this.shake.update();

    // 生成新行
    const topY = Math.min(...this.platforms.map((pl) => pl.y));
    const cfg = getLevelConfig(this.level);
    if (topY > -this.scrollY - 100) {
      this._spawnRow(topY - cfg.rowSpawnSpacing, 99);
    }

    // 屏幕外清理
    this.platforms = this.platforms.filter((pl) => pl.y < -this.scrollY + this.H + 100);
    this.colorBalls = this.colorBalls.filter((b) => b.y < -this.scrollY + this.H + 100);

    // 死亡检测
    if (p.y > -this.scrollY + this.H + 50) {
      this.gameOver = true;
      playSound('gameover');
      setTimeout(() => this._showGameOver(), 600);
    }
  }

  _changePlayerColor() {
    const idx = COLOR_KEYS.indexOf(this.player.colorKey);
    let newIdx;
    do { newIdx = Math.floor(Math.random() * COLOR_KEYS.length); }
    while (newIdx === idx);
    this.player.setColor(COLOR_KEYS[newIdx]);
  }

  // ─────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────

  _render() {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(this.shake.x, this.shake.y);

    // 背景
    this.background.draw(ctx);

    // 相机变换
    ctx.save();
    ctx.translate(0, this.scrollY);

    // 平台
    this.platforms.forEach((pl) => pl.draw(ctx));

    // 颜色球
    this.colorBalls.forEach((ball) => ball.draw(ctx));

    // 玩家
    if (!this.gameOver || this.gameOverAnim < 0.5) {
      const alpha = this.gameOver ? Math.max(0, 1 - this.gameOverAnim * 2) : 1;
      ctx.globalAlpha = alpha;
      this.player.draw(ctx);
      ctx.globalAlpha = 1;
    }

    // 粒子
    this.particles.draw(ctx);

    // 得分弹出
    this.scorePopups.forEach((s) => s.draw(ctx));

    ctx.restore(); // camera

    // HUD
    this.hud.draw(ctx, {
      score: this.score,
      combo: this.combo,
      maxCombo: this.maxCombo,
      level: this.level,
      player: this.player,
    });

    ctx.restore(); // shake
  }

  // ─────────────────────────────────────────
  // GAME LOOP
  // ─────────────────────────────────────────

  _loop(ts) {
    const dt = Math.min(0.05, (ts - this.lastTime) / 1000);
    this.lastTime = ts;

    this._update(dt);
    this._render();

    if (!this.gameOver) {
      requestAnimationFrame((t) => this._loop(t));
    } else {
      if (this.gameOverAnim < 1.0) {
        requestAnimationFrame((t) => this._loop(t));
      }
    }
  }
}
