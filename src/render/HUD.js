import { roundRect } from '../utils/utils.js';
import { COLORS } from '../game/Player.js';

export class HUD {
  constructor(W, H) {
    this.W = W;
    this.H = H;
  }

  draw(ctx, gameState) {
    const { score, combo, maxCombo, level, player } = gameState;
    const W = this.W;

    // 分数卡
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.88)';
    ctx.shadowColor = 'rgba(0,0,0,0.15)';
    ctx.shadowBlur = 12;
    roundRect(ctx, W / 2 - 80, 12, 160, 50, 16);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#FFD93D';
    ctx.font = 'bold 11px Nunito, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SCORE', W / 2, 30);
    ctx.fillStyle = '#FF9F43';
    ctx.font = 'bold 22px Nunito, sans-serif';
    ctx.fillText(score, W / 2, 52);
    ctx.restore();

    // Combo
    if (combo >= 2) {
      ctx.save();
      ctx.fillStyle = '#FFD700';
      ctx.font = `bold ${16 + combo * 2}px Nunito, sans-serif`;
      ctx.textAlign = 'center';
      ctx.shadowColor = '#FF9F43';
      ctx.shadowBlur = 8;
      ctx.fillText(`${combo}x`, W / 2, 78);
      ctx.restore();
    }

    // 最高Combo
    if (maxCombo >= 2) {
      ctx.save();
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.font = '11px Nunito, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`最佳 ${maxCombo}x`, W - 12, 26);
      ctx.restore();
    }

    // 玩家当前颜色指示
    if (player) {
      ctx.save();
      ctx.fillStyle = COLORS[player.colorKey];
      ctx.shadowColor = COLORS[player.colorKey];
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(W - 28, 30, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.ellipse(W - 31, 27, 4, 3, -0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 关卡
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = '10px Nunito, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`LV.${level}`, 12, 26);
    ctx.restore();
  }
}
