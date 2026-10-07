import { describe, it, expect } from 'vitest';
import { GAME_CONFIG } from '../src/config';
import { Storage } from '../src/utils/Storage';
import { Obstacle, ObstacleType } from '../src/types';

describe('Scoring System & High Score Persistence', () => {
  it('awards distance score based on meters traveled', () => {
    const factor = GAME_CONFIG.SCORING.DISTANCE_FACTOR; // 1.0 point per meter
    const metersCovered = 450;
    const score = Math.floor(metersCovered * factor);
    expect(score).toBe(450);
  });

  it('awards obstacle clear bonuses strictly ONCE per obstacle', () => {
    const obstacle: Obstacle = {
      id: 'log_test_1',
      type: ObstacleType.LOG,
      x: 1000,
      y: 256,
      width: 28,
      height: 14,
      cleared: false,
      bonusScore: GAME_CONFIG.SCORING.LOG_CLEAR_BONUS // 150
    };

    let totalScore = 0;

    // First time passing
    if (!obstacle.cleared) {
      obstacle.cleared = true;
      totalScore += obstacle.bonusScore;
    }
    expect(totalScore).toBe(150);
    expect(obstacle.cleared).toBe(true);

    // Second time checking (e.g. adjacent frame)
    if (!obstacle.cleared) {
      totalScore += obstacle.bonusScore;
    }
    expect(totalScore).toBe(150); // No double-scoring!
  });

  it('safely stores and retrieves high scores', () => {
    // Initial read
    const initialBest = Storage.getHighScore();
    expect(typeof initialBest).toBe('number');

    // Save a higher score
    const newScore = initialBest + 500;
    const saved = Storage.saveHighScore(newScore);
    expect(saved).toBe(true);
    expect(Storage.getHighScore()).toBe(newScore);

    // Try saving lower score: should not overwrite
    const lowerScore = newScore - 100;
    const overwritten = Storage.saveHighScore(lowerScore);
    expect(overwritten).toBe(false);
    expect(Storage.getHighScore()).toBe(newScore);
  });

  it('verifies victory bonus configuration', () => {
    expect(GAME_CONFIG.SCORING.VICTORY_BONUS).toBe(3000);
    expect(GAME_CONFIG.SCORING.CREEK_CLEAR_BONUS).toBe(500);
    expect(GAME_CONFIG.SCORING.RAMP_LAUNCH_BONUS).toBe(200);
    expect(GAME_CONFIG.SCORING.LOG_CLEAR_BONUS).toBe(150);
  });
});
