/**
 * GloryLevels.js - 难度配置
 * 难度随存活时间递进
 */

export class GloryLevels {
  constructor() {
    this.levels = [
      { maxTime: 30,  platformWidth: [90, 140], gap: [55, 80],  starDensity: 0.3 },
      { maxTime: 60,  platformWidth: [70, 110], gap: [65, 95],  starDensity: 0.3 },
      { maxTime: 120, platformWidth: [55, 90],  gap: [75, 110], starDensity: 0.2 },
      { maxTime: Infinity, platformWidth: [45, 70], gap: [90, 130], starDensity: 0.15 },
    ];
  }

  getDifficulty(timeSeconds) {
    for (const level of this.levels) {
      if (timeSeconds < level.maxTime) {
        return level;
      }
    }
    return this.levels[this.levels.length - 1];
  }

  randPlatformWidth(timeSeconds) {
    const d = this.getDifficulty(timeSeconds);
    const [min, max] = d.platformWidth;
    return Math.random() * (max - min) + min;
  }

  randGap(timeSeconds) {
    const d = this.getDifficulty(timeSeconds);
    const [min, max] = d.gap;
    return Math.random() * (max - min) + min;
  }

  shouldSpawnStar(timeSeconds) {
    const d = this.getDifficulty(timeSeconds);
    return Math.random() < d.starDensity;
  }

  shouldSpawnTwoStars(timeSeconds) {
    // 20% chance of 2 stars when spawning
    return Math.random() < 0.2;
  }
}
