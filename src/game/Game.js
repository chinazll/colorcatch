// ─────────────────────────────────────────────
//  Game.js — Main controller + game loop
// ─────────────────────────────────────────────

import { Player, PLAYER_RADIUS } from './Player.js';
import { Platform, PLATFORM_TYPES } from './Platform.js';
import { ParticleSystem } from './Particle.js';
import { Background } from '../render/Background.js';
import { HUD } from '../render/HUD.js';
import { ScreenShake } from '../render/Effect.js';
import { LEVELS, SECONDS_PER_LEVEL } from './levels.js';
import { COLORS, COLOR_KEYS, rand, randPick, randInt, clamp, lerp } from '../utils/utils.js';
import { playJump, playLand, playScore, playCombo, playBonus, playGameOver } from '../utils/audio.js';
import { Storage } from './Storage.js';

// ── Constants ──────────────────────────────────────────────────────

const CANVAS_W = 400;
const CANVAS_H = 640;
const GRAVITY = 0.38;
const CAM_LERP = 0.35;
const PLAYER_SCREEN_RATIO = 0.6;
const COMBO_WINDOW = 2.0;

// ── Game state ─────────────────────────────────────────────────────

const STATE = {
  MENU:      'menu',
  PLAYING:   'playing',
  GAME_OVER: 'gameover',
};

// ── Game ───────────────────────────────────────────────────────────

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.W = CANVAS_W;
    this.H = CANVAS_H;
    canvas.width = this.W;
    canvas.height = this.H;

    this.bg = new Background(this.W, this.H);
    this.ps = new ParticleSystem();
    this.hud = new HUD(this.W, this.H);
    this.shake = new ScreenShake();
    this.storage = new Storage();

    this.keys = {};
    this._bindInput();

    this.state = STATE.MENU;
    this.score = 0;
    this.level = 1;
    this.levelTimer = 0;
    this.combo = 0;
    this.comboTimer = 0;
    this.highestY = 0;

    this.player = null;
    this.platforms = [];
    this.camY = 0;
    this.targetCamY = 0;
    this.nextPlatformY = 0;

    // Game over animation timer (frames)
    this.deathAnimTimer = 0;
    // Anti re-collision: set to true after landing, prevents immediate re-collision
    this.justLanded = false;
    // Invulnerability at game start (seconds) — player can't die during this window
    this.invulnerable = 0;

    this.lastTime = 0;
  }

  // Convenience getters for existing main.js polling
  get gameOver() { return this.state === STATE.GAME_OVER; }

  // ── Input ──────────────────────────────────────────────────────

  _bindInput() {
    window.addEventListener('keydown', e => {
      this.keys[e.code] = true;
      if (e.code === 'Space') e.preventDefault();
    });
    window.addEventListener('keyup', e => { this.keys[e.code] = false; });

    this.canvas.addEventListener('click', () => {
      if (this.state === STATE.PLAYING) this._handleJump();
    });

    let dragging = false, dragStartX = 0, playerStartX = 0;
    this.canvas.addEventListener('touchstart', e => {
      e.preventDefault();
      dragging = true;
      dragStartX = e.touches[0].clientX;
      if (this.player) playerStartX = this.player.x;
    }, { passive: false });
    this.canvas.addEventListener('touchmove', e => {
      e.preventDefault();
      if (!dragging || !this.player || this.state !== STATE.PLAYING) return;
      const dx = e.touches[0].clientX - dragStartX;
      this.player.x = clamp(playerStartX + dx, PLAYER_RADIUS, this.W - PLAYER_RADIUS);
    }, { passive: false });
    this.canvas.addEventListener('touchend', e => {
      e.preventDefault();
      dragging = false;
      if (this.state === STATE.PLAYING) this._handleJump();
    }, { passive: false });
  }

  _handleJump() {
    if (this.player && this.player.jump()) {
      playJump();
      this.ps.emit(this.player.x, this.player.y + PLAYER_RADIUS, 'jump', null, 10);
    }
  }

  _handleInput() {
    if (!this.player || this.state !== STATE.PLAYING) return;
    if (this.keys['ArrowLeft'] || this.keys['KeyA']) this.player.moveLeft();
    if (this.keys['ArrowRight'] || this.keys['KeyD']) this.player.moveRight();
    if (this.keys['Space']) this._handleJump();
  }

  // ── Game lifecycle ─────────────────────────────────────────────

  start() {
    this.score = 0;
    this.level = 1;
    this.levelTimer = 0;
    this.combo = 0;
    this.comboTimer = 0;
    this.highestY = 0;
    this.platforms = [];
    this.ps = new ParticleSystem();
    this.shake = new ScreenShake();
    this.hud = new HUD(this.W, this.H);
    this.deathAnimTimer = 0;

    this._generateInitialPlatforms();

    const first = this.platforms[0];
    this.player = new Player(
      first.x + first.width / 2,
      first.y - PLAYER_RADIUS,
      first.colorKey
    );

    this.camY = this.player.y - this.H * PLAYER_SCREEN_RATIO;  // start at player screen ratio
    this.targetCamY = this.camY;
    this.state = STATE.PLAYING;
    this.invulnerable = 0.5;  // 0.5s grace period at start
    this.justLanded = false;

    this.lastTime = performance.now();
    requestAnimationFrame(t => this._loop(t));
  }

  _generateInitialPlatforms() {
    this.platforms = [];
    this.nextPlatformY = this.H - 40;
    // First platform: fixed color (red=COLOR_KEYS[0]), wide, centered, NEVER crumbles
    const first = new Platform(
      this.W / 2 - 70,
      this.nextPlatformY,
      140,
      COLOR_KEYS[0],  // always red — matches player initial color
      { type: PLATFORM_TYPES.NORMAL }
    );
    this.platforms.push(first);

    // Second platform: same color, small gap so player can always reach it on first jump
    this.nextPlatformY -= 55;  // small, guaranteed-reachable jump
    const second = new Platform(
      this.W / 2 - 50,
      this.nextPlatformY,
      100,
      COLOR_KEYS[0],  // same color — player lands safely
      { type: PLATFORM_TYPES.NORMAL }
    );
    this.platforms.push(second);

    // Now generate the rest
    this.nextPlatformY -= randInt(55, 70);
    this._generatePlatformsUpTo(this.H + 800);
  }

  _generatePlatformsUpTo(worldY) {
    const cfg = LEVELS[Math.min(this.level - 1, LEVELS.length - 1)];
    while (this.nextPlatformY > worldY) {
      const width = randInt(cfg.platformWidth[0], cfg.platformWidth[1]);
      const x = randInt(10, this.W - width - 10);
      const colorKey = randPick(COLOR_KEYS.slice(0, cfg.colorCount));

      let type = PLATFORM_TYPES.NORMAL;
      const roll = Math.random();
      if (roll < cfg.crumblingRatio) type = PLATFORM_TYPES.CRUMBLING;
      else if (roll < cfg.crumblingRatio + cfg.movingRatio) type = PLATFORM_TYPES.MOVING;

      const platform = new Platform(x, this.nextPlatformY, width, colorKey, {
        type,
        moveSpeed: cfg.movingSpeed,
        moveRange: cfg.movingRange,
        hasBonus: Math.random() < cfg.bonusChance,
      });
      this.platforms.push(platform);
      this.nextPlatformY -= randInt(cfg.platformGapMin, cfg.platformGapMax);
    }
  }

  _removeLowPlatforms() {
    this.platforms = this.platforms.filter(p => p.alive && p.y < this.camY + this.H + 200);
  }

  // ── Update ─────────────────────────────────────────────────────

  _update(dt) {
    if (this.state === STATE.MENU) return;

    // Death animation continues even after game over
    if (this.state === STATE.GAME_OVER) {
      this.deathAnimTimer++;
      this.ps.update();
      this.shake.update(dt);
      this.hud.update(dt);
      return;
    }

    // Playing state
    this.levelTimer += dt;
    if (this.levelTimer >= SECONDS_PER_LEVEL && this.level < LEVELS.length) {
      this.level++;
      this.levelTimer = 0;
      this.hud.onLevelUp(this.level);
    }

    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) {
        this.combo = 0;
        this.hud.onCombo(0);
      }
    }

    // Countdown invulnerability
    if (this.invulnerable > 0) this.invulnerable -= dt;

    this._handleInput();

    if (this.player) {
      this.player.grounded = false;
      this.player.update(dt);
      this.player.x = clamp(this.player.x, PLAYER_RADIUS, this.W - PLAYER_RADIUS);
    }

    // Reset justLanded at the start of each physics step
    this.justLanded = false;

    // Platform update & collision
    for (const plat of this.platforms) {
      if (!plat.alive) continue;
      plat.update(dt, this.W);

      if (this.player && !this.justLanded &&
          plat.landsOn(this.player.x, this.player.y, PLAYER_RADIUS, this.player.vy)) {
        const wasAbove = this.player.y < plat.y;
        this.player.y = plat.y - PLAYER_RADIUS;
        this.player.vy = 0;
        this.player.onLand();
        this.justLanded = true;
        playLand();
        if (wasAbove) this._onPlatformLand(plat);
      }

      // Bonus ball
      if (plat.ball && plat.ball.alive && this.player &&
          plat.ball.overlaps(this.player.x, this.player.y, PLAYER_RADIUS)) {
        plat.ball.alive = false;
        playBonus();
        this.storage.onBonusCollected();
        const pts = 30;
        this._addScore(pts, plat.ball.x, plat.ball.y);
        this.ps.emit(plat.ball.x, plat.ball.y, 'score', '#FF9F43', 15);
      }
    }

    // Camera — lerp toward target; hard-floor after lerp so camera never scrolls below start
    if (this.player) {
      const targetScreenY = this.H * PLAYER_SCREEN_RATIO;
      this.targetCamY = this.player.y - targetScreenY;
      // Use flooredTarget as lerp destination (allows upward following)
      const flooredTarget = Math.min(this.targetCamY, 0);
      this.camY = lerp(this.camY, flooredTarget, CAM_LERP);
      // Hard floor: camera can never scroll below starting position
      if (this.camY > 0) this.camY = 0;
      if (this.player.y < this.highestY) this.highestY = this.player.y;
    }

    if (this.nextPlatformY > this.highestY - this.H - 400) {
      this._generatePlatformsUpTo(this.highestY - this.H - 400);
    }

    // Fell off screen — only triggers if invulnerable has expired
    if (this.player) {
      const playerScreenY = this.player.y - this.camY;
      if (playerScreenY > this.H + 100 && this.invulnerable <= 0) {
        this._triggerGameOver();
        return;
      }
    }

    this._removeLowPlatforms();
    this.ps.update();
    this.shake.update(dt);
    this.hud.update(dt);
  }

  _onPlatformLand(plat) {
    const colorMatch = plat.colorKey === this.player.colorKey;

    if (colorMatch) {
      plat.startCrumble();
      this.combo++;
      this.comboTimer = COMBO_WINDOW;
      const pts = 10 * Math.max(1, this.combo);
      this._addScore(pts, this.player.x, plat.y - 20);
      this.hud.onCombo(this.combo);

      // Change player to a different color
      const cfg = LEVELS[Math.min(this.level - 1, LEVELS.length - 1)];
      const pool = COLOR_KEYS.slice(0, cfg.colorCount).filter(c => c !== plat.colorKey);
      this.player.changeColor(randPick(pool));

      this.ps.emit(this.player.x, plat.y, 'score', null, 12);

      if (this.combo >= 2) playCombo(this.combo);
      else playScore();

      if (this.combo >= 5) {
        this.shake.trigger(4, 0.3);
        this.ps.emit(this.player.x, this.player.y, 'eliminate', null, 20);
      }
    } else {
      this.ps.emit(this.player.x, this.player.y, 'eliminate', null, 20);
      this.shake.trigger(6, 0.5);
      playGameOver();
      this._triggerGameOver();
    }
  }

  _addScore(pts, worldX, worldY) {
    this.score += pts;
    this.hud.onScore(pts, worldX, worldY);
    this.ps.pop(worldX, worldY, `+${pts}`);
  }

  _triggerGameOver() {
    if (this.state === STATE.GAME_OVER) return;
    if (this.player) this.player.dead = true;
    this.state = STATE.GAME_OVER;
    this.deathAnimTimer = 0;
    // Persist score & achievements via Storage
    this.storage.onGameEnd(this.score, this.combo);
    this.hud.refreshFromStorage();
    // Signal main.js to show over panel
    this._gameOverPending = this.score;
    if (this.onGameOver) this.onGameOver(this.score);
  }

  // ── Draw ────────────────────────────────────────────────────────

  _draw() {
    const ctx = this.ctx;
    ctx.save();

    const s = this.shake.getOffset();
    ctx.translate(s.x, s.y);

    this.bg.draw(ctx, this.camY);

    for (const plat of this.platforms) plat.draw(ctx, this.camY);

    if (this.player) {
      ctx.save();
      if (this.state === STATE.GAME_OVER && this.deathAnimTimer > 0) {
        const alpha = Math.max(0, 1 - this.deathAnimTimer / 40);
        ctx.globalAlpha = alpha;
        ctx.translate(0, this.deathAnimTimer * 2);
      }
      this.player.draw(ctx, this.camY);
      ctx.restore();
    }

    this.ps.draw(ctx, this.camY);
    this.hud.draw(ctx);

    ctx.restore();
  }

  // ── Loop ───────────────────────────────────────────────────────

  _loop(timestamp) {
    const dt = Math.min((timestamp - this.lastTime) / 1000, 0.05);
    this.lastTime = timestamp;

    this._update(dt);
    this._draw();

    if (this.state !== STATE.MENU) {
      requestAnimationFrame(t => this._loop(t));
    }
  }
}
