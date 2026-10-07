/**
 * Grizzly Bear Pursuer Entity
 * Grizzly Run - Simulated AI Chaser, Kinematics & Obstacle Traversal
 * 
 * Follows same route from the RIGHT (higher World X), pursuing LEFT.
 */

import Phaser from 'phaser';
import { GAME_CONFIG } from '../config';
import { Obstacle, ObstacleType } from '../types';
import { SFX } from '../audio/SoundEffects';

export class Bear {
  public scene: Phaser.Scene;
  public sprite: Phaser.GameObjects.Sprite;

  // World Coordinates
  public worldX: number;
  public worldY: number;
  public vx: number = GAME_CONFIG.RIDER.BASE_SPEED; // Moving left: positive speed
  public vy: number = 0;

  // Ground and Physics State
  public isGrounded: boolean = true;
  public groundY: number = GAME_CONFIG.COURSE.GROUND_Y;

  // Animation and gallop timing
  private animTimerMs: number = 0;
  private animFrameIndex: number = 0;

  // Roar audio cooldown
  private roarCooldownMs: number = 0;

  // Distance tracking
  public distanceMeters: number = 25.0;

  constructor(scene: Phaser.Scene, startX: number, startY: number) {
    this.scene = scene;
    this.worldX = startX;
    this.worldY = startY;

    this.sprite = scene.add.sprite(startX, startY, 'bear_run_0');
    this.sprite.setOrigin(0.5, 0.95);
    this.sprite.setDepth(16);
  }

  // ==========================================================================
  // UPDATE LOOP (Fixed simulation step)
  // ==========================================================================

  public update(
    dtSec: number,
    riderWorldX: number,
    riderSpeed: number,
    obstacles: Obstacle[],
    currentGroundY: number,
    isInGap: boolean
  ): void {
    const dtMs = dtSec * 1000;
    this.groundY = currentGroundY;

    // 1. Calculate Actual Physical Distance to Rider
    // Rider is at riderWorldX, Bear is at this.worldX (Bear is behind rider -> worldX > riderWorldX)
    const distancePx = this.worldX - riderWorldX;
    this.distanceMeters = Math.max(0, distancePx / GAME_CONFIG.COURSE.PIXELS_PER_METER);

    // 2. Chaser Kinematics & Target Speed Tuning
    this.updatePursuitSpeed(dtSec, riderSpeed);

    // 3. Obstacle Traversal (Leap over logs and across creeks)
    this.handleObstacleTraversal(obstacles, isInGap);

    // 4. Gravity & Vertical Physics
    if (!this.isGrounded || isInGap) {
      this.vy += GAME_CONFIG.RIDER.GRAVITY * dtSec;
    }

    // 5. Advance World Coordinates (moving LEFT -> decreasing worldX)
    this.worldX -= this.vx * dtSec;
    this.worldY += this.vy * dtSec;

    // 6. Ground Clamping
    this.resolveGroundCollision(isInGap);

    // 7. Gallop Animation & Audio Roar Triggers
    this.updateVisualsAndAudio(dtMs);

    // 8. Sync Sprite Position
    this.sprite.setPosition(this.worldX, this.worldY);
  }

  // --------------------------------------------------------------------------
  // Sub-systems
  // --------------------------------------------------------------------------

  private updatePursuitSpeed(dtSec: number, riderSpeed: number): void {
    // Target speed is fundamentally coupled to rider's pace, with tension dynamics
    let targetSpeed = riderSpeed;

    if (this.distanceMeters > GAME_CONFIG.BEAR.SURGE_DISTANCE_M) {
      // Rider pulled far ahead: bear surges to keep chase dramatic
      targetSpeed = riderSpeed * GAME_CONFIG.BEAR.SURGE_SPEED_MULT;
    } else if (this.distanceMeters > 20.0) {
      // Balanced pacing with slight gain
      targetSpeed = Math.max(GAME_CONFIG.RIDER.BASE_SPEED, riderSpeed + GAME_CONFIG.BEAR.BASE_SPEED_OFFSET);
    } else if (this.distanceMeters < 8.0) {
      // Dangerously close: bear lunges hard!
      targetSpeed = Math.max(riderSpeed * 1.05, GAME_CONFIG.RIDER.BASE_SPEED + 30);
    } else {
      // Middle zone: matches speed with gentle pressure
      targetSpeed = riderSpeed + 5;
    }

    // Smooth acceleration toward target speed
    const accel = 350;
    if (this.vx < targetSpeed) {
      this.vx = Math.min(targetSpeed, this.vx + accel * dtSec);
    } else if (this.vx > targetSpeed) {
      this.vx = Math.max(targetSpeed, this.vx - accel * dtSec);
    }
  }

  private handleObstacleTraversal(obstacles: Obstacle[], isInGap: boolean): void {
    if (!this.isGrounded) return;

    // Scan upcoming obstacles in front of bear (bear moves left -> check obs with X < worldX)
    const lookAheadPx = 80;
    const bearFront = this.worldX;

    for (const obs of obstacles) {
      const obsRight = obs.x + obs.width;
      const obsLeft = obs.x;

      // If obstacle is just ahead of bear
      if (obsRight < bearFront && obsRight > bearFront - lookAheadPx) {
        if (obs.type === ObstacleType.LOG || obs.type === ObstacleType.RAMP || obs.type === ObstacleType.CREEK_GAP) {
          // Perform athletic pursuer leap over obstacle
          this.executeLeap();
          break;
        }
      }
    }

    // Also leap if approaching edge of creek gap
    if (isInGap && this.isGrounded) {
      this.executeLeap();
    }
  }

  private executeLeap(): void {
    this.vy = GAME_CONFIG.BEAR.LEAP_VELOCITY;
    this.isGrounded = false;
    this.sprite.setTexture('bear_leap');
  }

  private resolveGroundCollision(isInGap: boolean): void {
    if (isInGap) {
      this.isGrounded = false;
      return;
    }

    if (this.worldY >= this.groundY) {
      this.worldY = this.groundY;
      this.vy = 0;
      this.isGrounded = true;
    }
  }

  private updateVisualsAndAudio(dtMs: number): void {
    if (this.roarCooldownMs > 0) {
      this.roarCooldownMs -= dtMs;
    }

    // Trigger roar when within danger proximity
    if (this.distanceMeters < GAME_CONFIG.BEAR.DANGER_DISTANCE_M && this.roarCooldownMs <= 0) {
      SFX.playBearRoar();
      this.roarCooldownMs = 7000; // Roar at most every 7 seconds
    }

    // Gallop animation
    if (!this.isGrounded) {
      this.sprite.setTexture('bear_leap');
    } else {
      this.animTimerMs += dtMs * (this.vx / GAME_CONFIG.RIDER.BASE_SPEED);
      if (this.animTimerMs >= 100) {
        this.animTimerMs = 0;
        this.animFrameIndex = (this.animFrameIndex + 1) % 6;
        this.sprite.setTexture(`bear_run_${this.animFrameIndex}`);
      }
    }
  }

  /**
   * Check if bear has caught the rider.
   */
  public hasCaughtRider(): boolean {
    return this.distanceMeters <= GAME_CONFIG.BEAR.CATCH_DISTANCE_M;
  }

  public destroy(): void {
    this.sprite.destroy();
  }
}
