import { describe, it, expect } from 'vitest';
import { GAME_CONFIG } from '../src/config';
import { LevelData } from '../src/level/LevelData';
import { ObstacleType } from '../src/types';

describe('Level Design & Course Layout', () => {
  it('defines valid start and finish course coordinates', () => {
    expect(GAME_CONFIG.COURSE.START_X).toBe(25000);
    expect(GAME_CONFIG.COURSE.FINISH_X).toBe(450);
    expect(GAME_CONFIG.COURSE.START_X).toBeGreaterThan(GAME_CONFIG.COURSE.FINISH_X);

    const totalDistanceMeters = (GAME_CONFIG.COURSE.START_X - GAME_CONFIG.COURSE.FINISH_X) / GAME_CONFIG.COURSE.PIXELS_PER_METER;
    expect(totalDistanceMeters).toBeCloseTo(1022.9, 1);
  });

  it('contains at least two creek gap jumps with preceding kicker ramps', () => {
    const obstacles = LevelData.getObstacles();
    const creekGaps = obstacles.filter(o => o.type === ObstacleType.CREEK_GAP);
    const kickers = obstacles.filter(o => o.type === ObstacleType.RAMP);

    expect(creekGaps.length).toBeGreaterThanOrEqual(2);
    expect(kickers.length).toBeGreaterThanOrEqual(2);

    // Verify creek gaps have valid positive width and bonus scores
    creekGaps.forEach(gap => {
      expect(gap.width).toBeGreaterThan(200);
      expect(gap.bonusScore).toBe(GAME_CONFIG.SCORING.CREEK_CLEAR_BONUS);
    });
  });

  it('ensures terrain segments properly detect creek water boundaries', () => {
    // Gap 1 is at 14460 -> 14120
    expect(LevelData.isWorldXInCreek(14300)).toBe(true);
    expect(LevelData.isWorldXInCreek(14500)).toBe(false);
    expect(LevelData.isWorldXInCreek(14000)).toBe(false);

    // Gap 2 is at 8400 -> 8020
    expect(LevelData.isWorldXInCreek(8200)).toBe(true);
    expect(LevelData.isWorldXInCreek(8500)).toBe(false);
    expect(LevelData.isWorldXInCreek(7900)).toBe(false);
  });

  it('verifies all obstacles are placed within the course span', () => {
    const obstacles = LevelData.getObstacles();
    obstacles.forEach(obs => {
      expect(obs.x).toBeLessThanOrEqual(GAME_CONFIG.COURSE.START_X);
      expect(obs.x).toBeGreaterThanOrEqual(GAME_CONFIG.COURSE.FINISH_X);
      expect(obs.width).toBeGreaterThan(0);
    });
  });
});
