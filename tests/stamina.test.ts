import { describe, it, expect } from 'vitest';
import { GAME_CONFIG } from '../src/config';

describe('Stamina & Oxygen Debt Model', () => {
  it('drains stamina steadily during clean sprinting', () => {
    let stamina = 100;
    const drainRate = GAME_CONFIG.RIDER.SPRINT_DRAIN_RATE; // 24%/s
    const dt = 1.0; // 1 second

    stamina -= drainRate * dt;
    expect(stamina).toBeCloseTo(76, 1);

    // 2 more seconds
    stamina -= drainRate * 2.0;
    expect(stamina).toBeCloseTo(28, 1);
  });

  it('drains extra stamina when sprinting through mud', () => {
    let staminaClean = 100;
    let staminaMud = 100;

    const baseDrain = GAME_CONFIG.RIDER.SPRINT_DRAIN_RATE; // 24%/s
    const mudCostMult = GAME_CONFIG.RIDER.MUD_TRACTION_COST; // 1.8x
    const dt = 1.0;

    staminaClean -= baseDrain * dt;
    staminaMud -= baseDrain * mudCostMult * dt;

    expect(staminaMud).toBeLessThan(staminaClean);
    expect(staminaMud).toBeCloseTo(100 - (24 * 1.8), 1);
  });

  it('recovers stamina up to MAX_STAMINA while coasting', () => {
    let stamina = 50;
    const recoveryRate = GAME_CONFIG.RIDER.COAST_RECOVERY_RATE; // 16%/s
    const maxStamina = GAME_CONFIG.RIDER.MAX_STAMINA; // 100

    // Coast for 2 seconds
    stamina = Math.min(maxStamina, stamina + recoveryRate * 2.0);
    expect(stamina).toBeCloseTo(82, 1);

    // Coast for 3 more seconds: should cap at 100
    stamina = Math.min(maxStamina, stamina + recoveryRate * 3.0);
    expect(stamina).toBe(100);
  });

  it('triggers exhaustion penalty when stamina hits 0', () => {
    let stamina = 10;
    let isExhausted = false;
    let exhaustionCooldownMs = 0;

    // Drain beyond 0
    stamina -= 15;
    if (stamina <= 0) {
      stamina = 0;
      isExhausted = true;
      exhaustionCooldownMs = GAME_CONFIG.RIDER.EXHAUSTION_PENALTY_MS; // 2000ms
    }

    expect(isExhausted).toBe(true);
    expect(exhaustionCooldownMs).toBe(2000);
    expect(stamina).toBe(0);

    // Cooldown elapsed
    exhaustionCooldownMs -= 2000;
    if (exhaustionCooldownMs <= 0) {
      isExhausted = false;
      stamina = 20; // Recover to 20%
    }

    expect(isExhausted).toBe(false);
    expect(stamina).toBe(20);
  });
});
