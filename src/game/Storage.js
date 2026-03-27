// Storage.js — Phase 2: localStorage persistence for retention features
// Handles: highScore, stars, achievements, dailyTasks, skins

import { randInt, randPick } from '../utils/utils.js';

// ─── Skin definitions ─────────────────────────────────────────
export const SKINS = {
  default:    { id: 'default',    name: '小糖豆',   color: '#FF6B6B', particle: '#FF6B6B' },
  strawberry: { id: 'strawberry', name: '草莓小糖', color: '#FF85C1', particle: '#FFB3D9' },
  blueberry:  { id: 'blueberry',  name: '蓝莓精灵', color: '#9B59B6', particle: '#D4A3E8' },
  lemon:      { id: 'lemon',      name: '柠檬小子', color: '#F7DC6F', particle: '#FCF3A8' },
};

// ─── Achievement definitions ───────────────────────────────────
export const ACHIEVEMENTS = {
  first_game:  { id: 'first_game',  name: '初次见面',   desc: '完成第一局游戏',         icon: '⭐', reward: 5 },
  score_100:   { id: 'score_100',   name: '百分突破',   desc: '单局得分超过 100',        icon: '💯', reward: 10 },
  combo_5:     { id: 'combo_5',     name: '连击达人',   desc: '触发 5x Combo',           icon: '🔥', reward: 15 },
  daily_3:    { id: 'daily_3',    name: '任务达人',   desc: '单日完成 3 个每日任务',   icon: '📋', reward: 20 },
  score_500:   { id: 'score_500',   name: '五百大关',   desc: '单局得分超过 500',        icon: '💎', reward: 30 },
  score_1000:  { id: 'score_1000',  name: '千分大师',   desc: '单局得分超过 1000',       icon: '👑', reward: 50 },
  combo_10:    { id: 'combo_10',    name: '超级连击',   desc: '触发 10x Combo',          icon: '⚡', reward: 25 },
};

// ─── Task templates ────────────────────────────────────────────
const TASK_TEMPLATES = [
  { type: 'score',  label: '单局得分达到', unit: '分', targets: [50, 100, 200, 300] },
  { type: 'combo',  label: '达成 Combo',  unit: 'x',  targets: [3, 5, 7, 10] },
  { type: 'bonus',  label: '收集星星球',  unit: '个', targets: [1, 3, 5, 8] },
];

function todayString() {
  return new Date().toISOString().split('T')[0];
}

function generateDailyTasks() {
  const date = todayString();
  const tasks = [];
  const shuffled = [...TASK_TEMPLATES].sort(() => Math.random() - 0.5).slice(0, 3);
  for (const tmpl of shuffled) {
    const target = randPick(tmpl.targets);
    const reward = Math.round(target * 0.5) + 5;
    tasks.push({
      id: `${tmpl.type}_${randInt(1000, 9999)}`,
      type: tmpl.type,
      label: `${tmpl.label} ${target}${tmpl.unit}`,
      target,
      progress: 0,
      reward,
      completed: false,
      date,
    });
  }
  return tasks;
}

// ─── Storage class ──────────────────────────────────────────────
const P = 'cc_'; // prefix

export class Storage {
  constructor() {
    this._ensureInit();
  }

  _s(key, fallback) {
    try {
      const v = localStorage.getItem(P + key);
      return v !== null ? JSON.parse(v) : fallback;
    } catch { return fallback; }
  }
  _set(key, val) {
    try { localStorage.setItem(P + key, JSON.stringify(val)); } catch {}
  }

  _ensureInit() {
    if (localStorage.getItem(P + 'highScore') === null)
      this._set('highScore', { highScore: 0, lastPlayedDate: '' });
    if (localStorage.getItem(P + 'stars') === null)
      this._set('stars', 0);
    if (localStorage.getItem(P + 'achievements') === null)
      this._set('achievements', {});
    if (localStorage.getItem(P + 'dailyTasks') === null)
      this._set('dailyTasks', generateDailyTasks());
    if (localStorage.getItem(P + 'unlockedSkins') === null)
      this._set('unlockedSkins', ['default']);
    if (localStorage.getItem(P + 'selectedSkin') === null)
      this._set('selectedSkin', 'default');
  }

  _checkDateReset() {
    const tasks = this._s('dailyTasks', []);
    const today = todayString();
    if (tasks.length > 0 && tasks[0].date !== today) {
      this._set('dailyTasks', generateDailyTasks());
    }
  }

  // ── High Score ──────────────────────────────────────────────
  getHighScore() {
    this._checkDateReset();
    const d = this._s('highScore', {});
    return d.highScore || 0;
  }

  updateHighScore(score) {
    const d = this._s('highScore', { highScore: 0 });
    if (score > d.highScore) {
      d.highScore = score;
      d.lastPlayedDate = todayString();
      this._set('highScore', d);
      return true; // new record
    }
    return false;
  }

  // ── Stars ────────────────────────────────────────────────────
  getStars() {
    return parseInt(this._s('stars', 0), 10);
  }

  addStars(n) {
    const cur = this.getStars();
    this._set('stars', cur + n);
    return cur + n;
  }

  spendStars(n) {
    const cur = this.getStars();
    if (cur < n) return false;
    this._set('stars', cur - n);
    return true;
  }

  // ── Achievements ─────────────────────────────────────────────
  getAchievements() {
    return this._s('achievements', {});
  }

  unlockAchievement(id) {
    const achs = this.getAchievements();
    if (achs[id]) return null;
    const def = ACHIEVEMENTS[id];
    if (!def) return null;
    achs[id] = { ...def, unlockedAt: todayString() };
    this._set('achievements', achs);
    this.addStars(def.reward);
    return def;
  }

  isAchievementUnlocked(id) {
    return !!this.getAchievements()[id];
  }

  // ── Daily Tasks ─────────────────────────────────────────────
  getDailyTasks() {
    this._checkDateReset();
    return this._s('dailyTasks', []);
  }

  /** Increment task progress for a specific type (score/combo/bonus) */
  incrementTask(type, amount = 1) {
    this._checkDateReset();
    const tasks = this.getDailyTasks();
    let completed = null;
    for (const t of tasks) {
      if (!t.completed && t.type === type) {
        t.progress = Math.min(t.progress + amount, t.target);
        if (t.progress >= t.target) {
          t.completed = true;
          this.addStars(t.reward);
          completed = t;
        }
      }
    }
    this._set('dailyTasks', tasks);
    return completed;
  }

  /** Set absolute progress value */
  setTaskProgress(type, value) {
    this._checkDateReset();
    const tasks = this.getDailyTasks();
    let completed = null;
    for (const t of tasks) {
      if (!t.completed && t.type === type) {
        t.progress = Math.max(t.progress, value);
        if (t.progress >= t.target && !t.completed) {
          t.completed = true;
          this.addStars(t.reward);
          completed = t;
        }
      }
    }
    this._set('dailyTasks', tasks);
    return completed;
  }

  getCompletedTaskCountToday() {
    return this.getDailyTasks().filter(t => t.completed).length;
  }

  // ── Skins ───────────────────────────────────────────────────
  getUnlockedSkins() {
    return this._s('unlockedSkins', ['default']);
  }

  unlockSkin(id) {
    const skins = this.getUnlockedSkins();
    if (!skins.includes(id)) {
      skins.push(id);
      this._set('unlockedSkins', skins);
      return true;
    }
    return false;
  }

  getSelectedSkin() {
    return this._s('selectedSkin', 'default');
  }

  setSelectedSkin(id) {
    const skins = this.getUnlockedSkins();
    if (skins.includes(id)) {
      this._set('selectedSkin', id);
      return true;
    }
    return false;
  }

  // ── Game lifecycle hooks ─────────────────────────────────────
  /** Call when a game session ends */
  onGameEnd(score, maxCombo) {
    const newRecord = this.updateHighScore(score);

    // Unlock achievements
    const unlocked = [];
    const ach = this.unlockAchievement('first_game');
    if (ach) unlocked.push(ach);
    if (score >= 100) { const a = this.unlockAchievement('score_100'); if (a) unlocked.push(a); }
    if (score >= 500) { const a = this.unlockAchievement('score_500'); if (a) unlocked.push(a); }
    if (score >= 1000) { const a = this.unlockAchievement('score_1000'); if (a) unlocked.push(a); }
    if (maxCombo >= 5) { const a = this.unlockAchievement('combo_5'); if (a) unlocked.push(a); }
    if (maxCombo >= 10) { const a = this.unlockAchievement('combo_10'); if (a) unlocked.push(a); }

    // Update daily tasks
    const taskCompleted = this.incrementTask('score', score);
    if (maxCombo >= 3) this.incrementTask('combo', maxCombo);

    // Check daily_3 achievement
    const completedToday = this.getCompletedTaskCountToday();
    if (completedToday >= 3) {
      const a = this.unlockAchievement('daily_3');
      if (a) unlocked.push(a);
    }

    return { newRecord, unlocked, taskCompleted };
  }

  /** Call when a bonus ball is collected */
  onBonusCollected() {
    const completed = this.incrementTask('bonus', 1);
    return completed;
  }
}
