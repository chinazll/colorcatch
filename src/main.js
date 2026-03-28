// ─────────────────────────────────────────────
//  main.js — Application entry point
// ─────────────────────────────────────────────

import './style.css';
import { Game } from './game/Game.js';
import { initAudio } from './utils/audio.js';
import { Storage, SKINS } from './game/Storage.js';

const canvas    = document.getElementById('c');
const startBtn  = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const startPanel = document.getElementById('start-panel');
const overPanel  = document.getElementById('over-panel');
const finalScore = document.getElementById('final-score');

const storage = new Storage();
let game = null;

// ── Responsive canvas scaling ─────────────────────────────────────
function resize() {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const aspect = 400 / 640;
  if (vw / vh < aspect) {
    canvas.style.width = vw + 'px';
    canvas.style.height = (vw / aspect) + 'px';
  } else {
    canvas.style.width = (vh * aspect) + 'px';
    canvas.style.height = vh + 'px';
  }
  canvas.width = 400;
  canvas.height = 640;
}
window.addEventListener('resize', resize);
resize();

// ── Phase 2 UI helpers ─────────────────────────────────────────────

function showToast(message, duration = 3000) {
  const existing = document.getElementById('toast');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.id = 'toast';
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed; top: 80px; left: 50%; transform: translateX(-50%);
    background: rgba(45,52,54,0.9); color: #FFD93D; font-family: Nunito, sans-serif;
    font-weight: 700; font-size: 15px; padding: 10px 20px; border-radius: 20px;
    z-index: 9999; pointer-events: none; white-space: nowrap;
    animation: toastIn 0.3s ease;
  `;
  const style = document.createElement('style');
  style.textContent = `
    @keyframes toastIn { from { opacity: 0; transform: translateX(-50%) translateY(-10px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
    @keyframes toastOut { from { opacity: 1; transform: translateX(-50%) translateY(0); } to { opacity: 0; transform: translateX(-50%) translateY(-10px); } }
  `;
  document.head.appendChild(style);
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'toastOut 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

function showAchievementUnlock(achievements) {
  if (!achievements || achievements.length === 0) return;
  achievements.forEach((ach, i) => {
    setTimeout(() => {
      showToast(`${ach.icon} 解锁成就：${ach.name}！+${ach.reward}⭐`, 4000);
    }, i * 1500);
  });
}

function showTaskComplete(task) {
  if (!task) return;
  showToast(`✅ 任务完成：${task.label}！+${task.reward}⭐`, 3500);
}

function createOverlay(id, title, innerHTML) {
  const existing = document.getElementById(id);
  if (existing) existing.remove();
  const overlay = document.createElement('div');
  overlay.id = id;
  overlay.style.cssText = `
    position: fixed; inset: 0; background: rgba(0,0,0,0.6);
    display: flex; justify-content: center; align-items: center;
    z-index: 1000; font-family: Nunito, sans-serif;
  `;
  overlay.innerHTML = `
    <div style="background:white;border-radius:24px;padding:32px 36px;width:320px;max-width:90vw;text-align:center;box-shadow:0 8px 32px rgba(0,0,0,0.2);">
      <h2 style="font-size:22px;font-weight:900;color:#FF6B6B;margin-bottom:20px;">${title}</h2>
      ${innerHTML}
    </div>
  `;
  overlay.addEventListener('click', e => {
    if (e.target === overlay) overlay.remove();
  });
  document.body.appendChild(overlay);
  return overlay;
}

function renderDailyTasks() {
  const tasks = storage.getDailyTasks();
  const completedCount = tasks.filter(t => t.completed).length;
  let html = `<p style="font-size:14px;color:#888;margin-bottom:16px;">今日进度：${completedCount}/3 任务</p>`;
  html += '<div style="text-align:left;display:flex;flex-direction:column;gap:12px;margin-bottom:20px;">';
  for (const t of tasks) {
    const pct = Math.min(100, Math.round((t.progress / t.target) * 100));
    html += `
      <div style="background:#f8f8f8;border-radius:12px;padding:12px ${t.completed ? 'opacity:0.6' : ''}">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
          <span style="font-size:14px;font-weight:700;color:${t.completed ? '#95E66A' : '#555'}">${t.completed ? '✅' : '⬜'} ${t.label}</span>
          <span style="font-size:13px;color:#FFD93D">+${t.reward}⭐</span>
        </div>
        <div style="background:#e0e0e0;border-radius:6px;height:8px;overflow:hidden;">
          <div style="width:${pct}%;height:100%;background:${t.completed ? '#95E66A' : '#FF6B6B'};border-radius:6px;"></div>
        </div>
        <div style="font-size:11px;color:#aaa;margin-top:3px;">${t.progress}/${t.target}</div>
      </div>
    `;
  }
  html += '</div>';
  html += '<button class="btn btn-secondary" id="tasks-close-btn" style="width:100%;">关闭</button>';
  const overlay = createOverlay('daily-tasks-overlay', '📋 每日任务', html);
  setTimeout(() => {
    const btn = document.getElementById('tasks-close-btn');
    if (btn) btn.addEventListener('click', () => overlay.remove());
  }, 50);
}

function renderAchievements() {
  const achs = storage.getAchievements();
  const ACHIEVEMENT_LIST = [
    { id: 'first_game',  icon: '⭐', name: '初次见面',   desc: '完成第一局游戏' },
    { id: 'score_100',   icon: '💯', name: '百分突破',   desc: '单局得分超过 100' },
    { id: 'combo_5',     icon: '🔥', name: '连击达人',   desc: '触发 5x Combo' },
    { id: 'daily_3',    icon: '📋', name: '任务达人',   desc: '单日完成 3 个每日任务' },
    { id: 'score_500',   icon: '💎', name: '五百大关',   desc: '单局得分超过 500' },
    { id: 'score_1000',  icon: '👑', name: '千分大师',   desc: '单局得分超过 1000' },
    { id: 'combo_10',    icon: '⚡', name: '超级连击',   desc: '触发 10x Combo' },
  ];
  let html = '<div style="text-align:left;display:flex;flex-direction:column;gap:10px;margin-bottom:20px;max-height:380px;overflow-y:auto;">';
  for (const a of ACHIEVEMENT_LIST) {
    const unlocked = achs[a.id];
    html += `
      <div style="display:flex;align-items:center;gap:12px;padding:10px;background:${unlocked ? '#fffbe6' : '#f5f5f5'};border-radius:12px;opacity:${unlocked ? '1' : '0.55'}">
        <span style="font-size:28px">${a.icon}</span>
        <div>
          <div style="font-weight:800;font-size:14px;color:${unlocked ? '#FFD93D' : '#aaa'}">${a.name}</div>
          <div style="font-size:12px;color:#888">${a.desc}</div>
        </div>
        ${unlocked ? '<span style="margin-left:auto;font-size:12px;color:#95E66A;font-weight:700">已解锁</span>' : ''}
      </div>
    `;
  }
  html += '</div>';
  html += `<p style="font-size:13px;color:#aaa;margin-bottom:16px;">已获得 ${Object.keys(achs).length}/${ACHIEVEMENT_LIST.length} 个成就</p>`;
  html += '<button class="btn btn-secondary" id="ach-close-btn" style="width:100%;">关闭</button>';
  const overlay = createOverlay('achievements-overlay', '🏆 成就', html);
  setTimeout(() => {
    const btn = document.getElementById('ach-close-btn');
    if (btn) btn.addEventListener('click', () => overlay.remove());
  }, 50);
}

function renderSkinShop() {
  const unlocked = storage.getUnlockedSkins();
  const selected = storage.getSelectedSkin();
  const stars = storage.getStars();
  let html = `<p style="font-size:14px;color:#888;margin-bottom:16px;">当前星星：<span style="color:#FFD93D;font-weight:900">${stars}⭐</span></p>`;
  html += '<div style="text-align:left;display:flex;flex-direction:column;gap:12px;margin-bottom:20px;">';
  for (const [id, skin] of Object.entries(SKINS)) {
    const isUnlocked = unlocked.includes(id);
    const isSelected = selected === id;
    html += `
      <div style="display:flex;align-items:center;gap:12px;padding:12px;background:${isSelected ? '#fffbe6' : '#f8f8f8'};border-radius:12px;border:2px solid ${isSelected ? '#FFD93D' : 'transparent'}">
        <div style="width:36px;height:36px;border-radius:50%;background:${skin.color};box-shadow:0 2px 8px rgba(0,0,0,0.15);"></div>
        <div style="flex:1">
          <div style="font-weight:800;font-size:14px;color:#333">${skin.name}</div>
          ${!isUnlocked ? `<div style="font-size:12px;color:#aaa">解锁需 30⭐</div>` : ''}
        </div>
        ${isSelected ? '<span style="font-size:12px;color:#95E66A;font-weight:700">使用中</span>' :
          isUnlocked ? `<button class="skin-select-btn" data-id="${id}" style="background:#4ECDC4;color:#fff;border:none;border-radius:8px;padding:6px 12px;font-family:Nunito,sans-serif;font-weight:700;font-size:12px;cursor:pointer;">使用</button>` :
          `<button class="skin-unlock-btn" data-id="${id}" data-cost="30" style="background:#FFD93D;color:#333;border:none;border-radius:8px;padding:6px 12px;font-family:Nunito,sans-serif;font-weight:700;font-size:12px;cursor:pointer;">购买 30⭐</button>`
        }
      </div>
    `;
  }
  html += '</div>';
  html += '<button class="btn btn-secondary" id="shop-close-btn" style="width:100%;">关闭</button>';
  const overlay = createOverlay('skin-shop-overlay', '✨ 皮肤商店', html);
  setTimeout(() => {
    const btn = document.getElementById('shop-close-btn');
    if (btn) btn.addEventListener('click', () => overlay.remove());
    // Skin select buttons
    overlay.querySelectorAll('.skin-select-btn').forEach(b => {
      b.addEventListener('click', () => {
        const id = b.dataset.id;
        storage.setSelectedSkin(id);
        showToast(`✨ 已换上：${SKINS[id].name}`);
        overlay.remove();
      });
    });
    // Skin unlock buttons
    overlay.querySelectorAll('.skin-unlock-btn').forEach(b => {
      b.addEventListener('click', () => {
        const id = b.dataset.id;
        const cost = parseInt(b.dataset.cost);
        if (storage.getStars() >= cost) {
          storage.spendStars(cost);
          storage.unlockSkin(id);
          showToast(`🎉 解锁新皮肤：${SKINS[id].name}！`);
          renderSkinShop(); // Re-render
        } else {
          showToast(`星星不足！还差 ${cost - storage.getStars()}⭐`);
        }
      });
    });
  }, 50);
}

// Add Phase 2 buttons to start panel
function injectPhase2UI() {
  if (document.getElementById('tasks-btn')) return;
  const container = startPanel;
  // Tasks button
  const tasksBtn = document.createElement('button');
  tasksBtn.id = 'tasks-btn';
  tasksBtn.className = 'btn btn-secondary';
  tasksBtn.textContent = '📋 每日任务';
  tasksBtn.style.marginTop = '4px';
  tasksBtn.style.fontSize = '13px';
  tasksBtn.style.padding = '8px';
  tasksBtn.addEventListener('click', e => { e.stopPropagation(); renderDailyTasks(); });

  // Achievements button
  const achBtn = document.createElement('button');
  achBtn.id = 'ach-btn';
  achBtn.className = 'btn btn-secondary';
  achBtn.textContent = '🏆 成就';
  achBtn.style.marginTop = '4px';
  achBtn.style.fontSize = '13px';
  achBtn.style.padding = '8px';
  achBtn.addEventListener('click', e => { e.stopPropagation(); renderAchievements(); });

  // Shop button
  const shopBtn = document.createElement('button');
  shopBtn.id = 'shop-btn';
  shopBtn.className = 'btn btn-secondary';
  shopBtn.textContent = '✨ 皮肤商店';
  shopBtn.style.marginTop = '4px';
  shopBtn.style.fontSize = '13px';
  shopBtn.style.padding = '8px';
  shopBtn.addEventListener('click', e => { e.stopPropagation(); renderSkinShop(); });

  // Inject buttons
  const instructions = container.querySelector('.instructions');
  if (instructions) {
    container.insertBefore(shopBtn, instructions);
    container.insertBefore(achBtn, instructions);
    container.insertBefore(tasksBtn, instructions);
  }
}

// ── Game over polling ───────────────────────────────────────────────
// ── Game over polling — keeps running across multiple games ───────────
function watchGameOver() {
  if (!game) {
    requestAnimationFrame(watchGameOver);
    return;
  }
  if (game._gameOverPending !== undefined) {
    finalScore.textContent = Math.floor(game._gameOverPending);
    overPanel.classList.add('visible');
    startPanel.classList.remove('visible');
    const achs = storage.getAchievements();
    const today = new Date().toISOString().split('T')[0];
    const recentUnlocks = Object.values(achs).filter(a => a.unlockedAt === today);
    if (recentUnlocks.length > 0) {
      setTimeout(() => showAchievementUnlock(recentUnlocks), 800);
    }
    const tasks = storage.getDailyTasks();
    const completed = tasks.find(t => t.completed && t.progress === t.target);
    if (completed) {
      setTimeout(() => showTaskComplete(completed), 1200);
    }
    // Keep polling for next game over (don't stop!)
    game._gameOverPending = null;
    requestAnimationFrame(watchGameOver);
    return;
  }
  requestAnimationFrame(watchGameOver);
}

// ── Start / restart game ────────────────────────────────────────────
function doStart() {
  initAudio();
  startPanel.classList.remove('visible');
  overPanel.classList.remove('visible');
  injectPhase2UI();

  if (!game) {
    game = new Game(canvas);
  }

  // Wire up game-over callback
  game.onGameOver = (score) => {
    game._gameOverPending = score;
  };

  game.start();
  // Always reset _gameOverPending on fresh start so panel doesn't flash back
  game._gameOverPending = undefined;
  requestAnimationFrame(watchGameOver);
}

startBtn.addEventListener('click', doStart);
restartBtn.addEventListener('click', doStart);

// Prevent default touch scroll on canvas
canvas.addEventListener('touchmove', e => e.preventDefault(), { passive: false });
