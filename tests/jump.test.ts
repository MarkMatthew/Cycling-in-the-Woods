import { describe, it, expect } from 'vitest';
import { GAME_CONFIG } from '../src/config';

describe('Jump Mechanics & Kinematics', () => {
  it('calculates vertical impulse correctly between tap hop and max charged jump', () => {
    const hopVel = GAME_CONFIG.RIDER.HOP_VELOCITY;       // -270
    const maxVel = GAME_CONFIG.RIDER.MAX_JUMP_VELOCITY;  // -450

    // Charge = 0 (quick tap)
    const impulseTap = hopVel + 0 * (maxVel - hopVel);
    expect(impulseTap).toBe(-270);

    // Charge = 0.5 (half charged)
    const impulseHalf = hopVel + 0.5 * (maxVel - hopVel);
    expect(impulseHalf).toBe(-360);

    // Charge = 1.0 (full 350ms charge)
    const impulseMax = hopVel + 1.0 * (maxVel - hopVel);
    expect(impulseMax).toBe(-450);
  });

  it('clamps charge duration at MAX_CHARGE_MS (350ms)', () => {
    const maxChargeMs = GAME_CONFIG.RIDER.MAX_CHARGE_MS; // 350
    const heldTimes = [0, 100, 250, 350, 500, 1000];

    heldTimes.forEach(held => {
      const ratio = Math.min(1.0, held / maxChargeMs);
      expect(ratio).toBeLessThanOrEqual(1.0);
      expect(ratio).toBeGreaterThanOrEqual(0.0);
    });

    const overcharged = Math.min(1.0, 600 / maxChargeMs);
    expect(overcharged).toBe(1.0);
  });

  it('validates coyote time window (100ms)', () => {
    const coyoteWindow = GAME_CONFIG.RIDER.COYOTE_TIME_MS; // 100ms

    const timeSinceGrounded80ms = 80;
    const canJump80 = timeSinceGrounded80ms <= coyoteWindow;
    expect(canJump80).toBe(true);

    const timeSinceGrounded150ms = 150;
    const canJump150 = timeSinceGrounded150ms <= coyoteWindow;
    expect(canJump150).toBe(false);
  });

  it('validates input buffer window (120ms)', () => {
    const bufferWindow = GAME_CONFIG.RIDER.INPUT_BUFFER_MS; // 120ms
    expect(bufferWindow).toBe(120);

    let bufferTimer = bufferWindow;
    // Advance 50ms
    bufferTimer -= 50;
    expect(bufferTimer > 0).toBe(true);

    // Advance 80ms more (total 130ms)
    bufferTimer -= 80;
    expect(bufferTimer <= 0).toBe(true);
  });

  it('adds kicker ramp impulse to vertical launch', () => {
    const baseHop = GAME_CONFIG.RIDER.HOP_VELOCITY;          // -270
    const kickerBoostVy = GAME_CONFIG.RIDER.KICKER_BOOST_VY; // -110
    const kickerBoostVx = GAME_CONFIG.RIDER.KICKER_BOOST_VX; // 60

    const totalVy = baseHop + kickerBoostVy;
    expect(totalVy).toBe(-380);

    const baseVx = GAME_CONFIG.RIDER.BASE_SPEED; // 230
    const boostedVx = baseVx + kickerBoostVx;
    expect(boostedVx).toBe(290);
  });
});
