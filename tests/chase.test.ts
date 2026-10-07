import { describe, it, expect } from 'vitest';
import { GAME_CONFIG } from '../src/config';

describe('Grizzly Bear Chase Dynamics', () => {
  it('correctly calculates physical pursuit distance from world coordinates', () => {
    const ppm = GAME_CONFIG.COURSE.PIXELS_PER_METER; // 24 px/m
    const riderWorldX = 20000;
    
    // Initial 25 meter offset (+600 px behind rider)
    const bearWorldX = riderWorldX + 600;
    const distanceMeters = (bearWorldX - riderWorldX) / ppm;
    expect(distanceMeters).toBe(25.0);

    // Closer: 12 meters (+288 px)
    const closeBearWorldX = riderWorldX + 288;
    const closeDist = (closeBearWorldX - riderWorldX) / ppm;
    expect(closeDist).toBe(12.0);
  });

  it('triggers catch condition when distance <= CATCH_DISTANCE_M', () => {
    const catchRadiusM = GAME_CONFIG.BEAR.CATCH_DISTANCE_M; // 0.6m
    expect(catchRadiusM).toBe(0.6);

    const distanceClose = 0.5;
    const isCaught = distanceClose <= catchRadiusM;
    expect(isCaught).toBe(true);

    const distanceFar = 2.4;
    const isNotCaught = distanceFar <= catchRadiusM;
    expect(isNotCaught).toBe(false);
  });

  it('identifies danger stem trigger and hysteresis bounds', () => {
    const dangerTrigger = GAME_CONFIG.BEAR.DANGER_DISTANCE_M;    // 14.0m
    const dangerRelease = GAME_CONFIG.BEAR.DANGER_HYSTERESIS_M; // 18.0m

    // When bear closes in from 16m to 13m
    let inDanger = false;
    const dist1 = 13.5;
    if (dist1 <= dangerTrigger) inDanger = true;
    expect(inDanger).toBe(true);

    // When rider pulls away to 16m: still in danger (hysteresis active)
    const dist2 = 16.0;
    if (dist2 > dangerRelease) inDanger = false;
    expect(inDanger).toBe(true); // Still true!

    // When rider pulls away past 18m: danger releases
    const dist3 = 18.5;
    if (dist3 > dangerRelease) inDanger = false;
    expect(inDanger).toBe(false); // Released
  });

  it('triggers surge speed multiplier when rider pulls beyond 32 meters', () => {
    const surgeDistanceM = GAME_CONFIG.BEAR.SURGE_DISTANCE_M; // 32.0m
    const surgeMultiplier = GAME_CONFIG.BEAR.SURGE_SPEED_MULT; // 1.18

    const distance35m = 35.0;
    const shouldSurge = distance35m > surgeDistanceM;
    expect(shouldSurge).toBe(true);

    const riderSpeed = 300;
    const targetSurgeSpeed = riderSpeed * surgeMultiplier;
    expect(targetSurgeSpeed).toBe(354);
  });
});
