/**
 * GloryLevels.js - Glory Candy difficulty configuration
 * 4 levels based on elapsed time
 */
class GloryLevels {
  static getDifficulty(timeSeconds) {
    if (timeSeconds < 30) {
      return { platformWidth: [90, 140], gap: [55, 80], starDensity: 0.3 };
    } else if (timeSeconds < 60) {
      return { platformWidth: [70, 110], gap: [65, 95], starDensity: 0.3 };
    } else if (timeSeconds < 120) {
      return { platformWidth: [55, 90], gap: [75, 110], starDensity: 0.2 };
    } else {
      return { platformWidth: [45, 70], gap: [90, 130], starDensity: 0.15 };
    }
  }
}
export { GloryLevels };
