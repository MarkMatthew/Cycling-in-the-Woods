/**
 * Cyclist Entity (Mountain Biker)
 * Grizzly Run - Physics, Input, Jump Mechanics, Stamina Model, and Animation
 * 
 * Races LEFT (decreasing World X) from X=25,000 to X=450.
 */

import Phaser from 'phaser';
import { GAME_CONFIG } from '../config';
import { Obstacle, ObstacleType, PlayerStats } from '../types';
import { SFX } from '../audio/SoundEffects';

export class Cyclist {
  public scene: Phaser.Scene;
  public sprite: Phaser.GameObjects.Sprite;
  
  // World Physics Position
  public worldX: number;
  public worldY: number;
  public vx: number = GAME_CONFIG.RIDER.BASE_SPEED; // Moving left: positive magnitude (px/s)
  public vy: number = 0;                            // Vertical velocity (px/s)

  // Ground State
  public isGrounded: boolean = true;
  public groundY: number = GAME_CONFIG.COURSE.GROUND_Y;
  private timeSinceLeftGroundMs: number = 0;

  // Jump Charging & Buffering
  public isChargingJump: boolean = false;
  private jumpChargeTimerMs: number = 0;
  private jumpBufferTimerMs: number = 0;
  private jumpChargeRatio: number = 0;

  // Stamina & Oxygen Debt
  public stamina: number = GAME_CONFIG.RIDER.MAX_STAMINA;
  public maxStamina: number = GAME_CONFIG.RIDER.MAX_STAMINA;
  public isExhausted: boolean = false;
  private exhaustionTimerMs: number = 0;

  // Traction, Mud & Skidding
  public inMud: boolean = false;
  public isSkidding: boolean = false;
  private skidTimerMs: number = 0;

  // Input states (can be set by keyboard or touch)
  public isSprinting: boolean = false;
  public isBraking: boolean = false;

  // Animation & Audio timers
  private pedalSoundTimerMs: number = 0;
  private animFrameIndex: number = 0;
  private animTimerMs: number = 0;
  private landingSquishTimerMs: number = 0;

  // Visual Charge Indicator
  private chargeBarBg: Phaser.GameObjects.Rectangle;
  private chargeBarFill: Phaser.GameObjects.Rectangle;

  // Particles
  private mudEmitter: Phaser.GameObjects.Particles.ParticleEmitter | null = null;

  constructor(scene: Phaser.Scene, startX: number, startY: number) {
    this.scene = scene;
    this.worldX = startX;
    this.worldY = startY;

    // Create main sprite
    this.sprite = scene.add.sprite(startX, startY, 'cyclist_pedal_0');
    this.sprite.setOrigin(0.5, 0.9);
    this.sprite.setDepth(15);

    // Charge indicator bar (floats 18px above cyclist)
    this.chargeBarBg = scene.add.rectangle(startX, startY - 24, 22, 4, 0x0f172a, 0.85);
    this.chargeBarBg.setOrigin(0.5, 0.5).setDepth(20).setVisible(false);

    this.chargeBarFill = scene.add.rectangle(startX - 10, startY - 24, 0, 2, 0x06b6d4, 1.0);
    this.chargeBarFill.setOrigin(0, 0.5).setDepth(21).setVisible(false);

    // Particle emitter for mud sprays
    if (scene.textures.exists('particle_mud')) {
      this.mudEmitter = scene.add.particles(0, 0, 'particle_mud', {
        speed: { min: 40, max: 120 },
        angle: { min: -40, max: 20 }, // Spitting rightwards behind bike
        scale: { start: 1, end: 0.2 },
        lifespan: 300,
        gravityY: 400,
        emitting: false
      });
      this.mudEmitter.setDepth(14);
    }
  }

  // ==========================================================================
  // INPUT CONTROLS
  // ==========================================================================

  public setSprint(active: boolean): void {
    if (this.isExhausted) {
      this.isSprinting = false;
      return;
    }
    this.isSprinting = active;
  }

  public setBrake(active: boolean): void {
    this.isBraking = active;
  }

  /**
   * Called on Space pressed (or touch jump pressed).
   */
  public onJumpPress(): void {
    // Input buffering: remember jump press even if in air
    this.jumpBufferTimerMs = GAME_CONFIG.RIDER.INPUT_BUFFER_MS;

    if (this.isGrounded || this.timeSinceLeftGroundMs <= GAME_CONFIG.RIDER.COYOTE_TIME_MS) {
      this.isChargingJump = true;
      this.jumpChargeTimerMs = 0;
      this.jumpChargeRatio = 0;
      this.chargeBarBg.setVisible(true);
      this.chargeBarFill.setVisible(true);
    }
  }

  /**
   * Called on Space released (or touch jump released).
   */
  public onJumpRelease(): void {
    if (this.isChargingJump) {
      this.executeJump();
    }
  }

  /**
   * Perform the jump with the charged ratio.
   */
  private executeJump(): void {
    const charge = Math.min(1.0, this.jumpChargeTimerMs / GAME_CONFIG.RIDER.MAX_CHARGE_MS);
    this.isChargingJump = false;
    this.chargeBarBg.setVisible(false);
    this.chargeBarFill.setVisible(false);
    this.jumpBufferTimerMs = 0;

    // Linear interpolation between bunny hop and max charged jump
    const jumpImpulse = GAME_CONFIG.RIDER.HOP_VELOCITY + 
      charge * (GAME_CONFIG.RIDER.MAX_JUMP_VELOCITY - GAME_CONFIG.RIDER.HOP_VELOCITY);

    this.vy = jumpImpulse;
    this.isGrounded = false;
    this.timeSinceLeftGroundMs = 9999;

    SFX.playJump(charge);

    // Dust puff at takeoff
    this.spawnTakeoffDust();
  }

  // ==========================================================================
  // UPDATE LOOP (Fixed simulation step)
  // ==========================================================================

  public update(
    dtSec: number,
    obstacles: Obstacle[],
    currentGroundY: number,
    isInGap: boolean
  ): void {
    const dtMs = dtSec * 1000;
    this.groundY = currentGroundY;

    // 1. Process Stamina & Oxygen Debt
    this.updateStamina(dtSec, dtMs);

    // 2. Process Jump Charging & Coyote / Buffer Timers
    this.updateJumpState(dtMs);

    // 3. Horizontal Speed Physics (Target velocity towards left)
    this.updateHorizontalPhysics(dtSec);

    // 4. Vertical Velocity & Gravity
    this.updateVerticalPhysics(dtSec, isInGap);

    // 5. Obstacle Interactions & Mud Traction
    this.updateObstacleInteractions(obstacles);

    // 6. Skidding Management
    this.updateSkidState(dtMs);

    // 7. Advance World Position
    // Note: vx is magnitude moving LEFT (decreasing worldX)
    this.worldX -= this.vx * dtSec;
    this.worldY += this.vy * dtSec;

    // 8. Ground Clamping & Landing Detection
    this.resolveGroundCollision(isInGap);

    // 9. Animations & Audio Cues
    this.updateVisualsAndAudio(dtMs);

    // 10. Sync Sprite Position
    this.syncDisplayObjects();
  }

  // --------------------------------------------------------------------------
  // Sub-systems
  // --------------------------------------------------------------------------

  private updateStamina(dtSec: number, dtMs: number): void {
    if (this.isExhausted) {
      this.exhaustionTimerMs -= dtMs;
      if (this.exhaustionTimerMs <= 0) {
        this.isExhausted = false;
        this.stamina = 20; // Recover to 20%
      }
      this.isSprinting = false;
      return;
    }

    if (this.isSprinting) {
      const mudMultiplier = this.inMud ? GAME_CONFIG.RIDER.MUD_TRACTION_COST : 1.0;
      this.stamina -= GAME_CONFIG.RIDER.SPRINT_DRAIN_RATE * mudMultiplier * dtSec;
      if (this.stamina <= 0) {
        this.stamina = 0;
        this.isExhausted = true;
        this.isSprinting = false;
        this.exhaustionTimerMs = GAME_CONFIG.RIDER.EXHAUSTION_PENALTY_MS;
      }
    } else if (!this.isBraking) {
      // Coasting / steady pace recovers stamina
      this.stamina = Math.min(
        this.maxStamina,
        this.stamina + GAME_CONFIG.RIDER.COAST_RECOVERY_RATE * dtSec
      );
    }
  }

  private updateJumpState(dtMs: number): void {
    // Coyote time counter
    if (this.isGrounded) {
      this.timeSinceLeftGroundMs = 0;
    } else {
      this.timeSinceLeftGroundMs += dtMs;
    }

    // Input buffer counter
    if (this.jumpBufferTimerMs > 0) {
      this.jumpBufferTimerMs -= dtMs;
      // If we just landed and buffer is still active, trigger jump
      if (this.isGrounded && !this.isChargingJump) {
        this.onJumpPress();
      }
    }

    // Jump charging
    if (this.isChargingJump) {
      this.jumpChargeTimerMs += dtMs;
      this.jumpChargeRatio = Math.min(1.0, this.jumpChargeTimerMs / GAME_CONFIG.RIDER.MAX_CHARGE_MS);

      // Auto-launch at 350ms cap as per specification
      if (this.jumpChargeTimerMs >= GAME_CONFIG.RIDER.MAX_CHARGE_MS) {
        this.executeJump();
      }
    }
  }

  private updateHorizontalPhysics(dtSec: number): void {
    let targetSpeed = GAME_CONFIG.RIDER.BASE_SPEED;

    if (this.isSprinting && !this.isExhausted) {
      targetSpeed = GAME_CONFIG.RIDER.SPRINT_SPEED;
    } else if (this.isBraking) {
      targetSpeed = GAME_CONFIG.RIDER.BRAKE_SPEED;
    }

    // Mud speed reduction
    if (this.inMud) {
      targetSpeed *= GAME_CONFIG.RIDER.MUD_SPEED_MULT;
    }

    // Skid penalty
    if (this.isSkidding) {
      targetSpeed *= GAME_CONFIG.RIDER.SKID_SPEED_PENALTY;
    }

    // Accelerate or decelerate towards target
    if (this.vx < targetSpeed) {
      this.vx = Math.min(targetSpeed, this.vx + GAME_CONFIG.RIDER.ACCELERATION * dtSec);
    } else if (this.vx > targetSpeed) {
      const decel = this.isBraking ? GAME_CONFIG.RIDER.BRAKE_RATE : GAME_CONFIG.RIDER.DECELERATION;
      this.vx = Math.max(targetSpeed, this.vx - decel * dtSec);
    }
  }

  private updateVerticalPhysics(dtSec: number, isInGap: boolean): void {
    if (!this.isGrounded || isInGap) {
      this.vy += GAME_CONFIG.RIDER.GRAVITY * dtSec;
    }
  }

  private updateObstacleInteractions(obstacles: Obstacle[]): void {
    this.inMud = false;

    // Cyclist bounding box: center worldX, width 32
    const riderLeft = this.worldX - 16;
    const riderRight = this.worldX + 16;
    const riderBottom = this.worldY;

    for (const obs of obstacles) {
      const obsRight = obs.x + obs.width;
      const obsLeft = obs.x;

      // Check horizontal overlap
      if (riderRight >= obsLeft && riderLeft <= obsRight) {
        if (obs.type === ObstacleType.MUD_PATCH) {
          this.inMud = true;
          // Emitting mud particles when riding in mud
          if (this.mudEmitter && this.isGrounded && this.vx > 180) {
            this.mudEmitter.emitParticleAt(this.worldX + 12, this.worldY, 1);
          }
        } else if (obs.type === ObstacleType.RAMP) {
          // Kicker ramp launch boost!
          if (this.isGrounded && riderBottom >= obs.y) {
            this.triggerRampBoost(obs);
          }
        } else if (obs.type === ObstacleType.LOG) {
          // Log collision check: if grounded and hitting log
          if (this.isGrounded && riderBottom >= obs.y) {
            this.triggerLogBump();
          }
        }
      }
    }
  }

  private triggerRampBoost(ramp: Obstacle): void {
    this.vy = GAME_CONFIG.RIDER.HOP_VELOCITY + GAME_CONFIG.RIDER.KICKER_BOOST_VY;
    this.vx += GAME_CONFIG.RIDER.KICKER_BOOST_VX;
    this.isGrounded = false;
    this.timeSinceLeftGroundMs = 9999;
    SFX.playJump(0.8);
    this.spawnTakeoffDust();
  }

  private triggerLogBump(): void {
    // Cost speed and trigger skid feedback if bumping log while grounded
    if (!this.isSkidding) {
      this.triggerSkid(400);
      this.vx = Math.max(GAME_CONFIG.RIDER.BRAKE_SPEED, this.vx * 0.6);
    }
  }

  public triggerSkid(durationMs = GAME_CONFIG.RIDER.SKID_DURATION_MS): void {
    this.isSkidding = true;
    this.skidTimerMs = durationMs;
    SFX.playSkid();
  }

  private updateSkidState(dtMs: number): void {
    if (this.isSkidding) {
      this.skidTimerMs -= dtMs;
      if (this.skidTimerMs <= 0) {
        this.isSkidding = false;
      }
    }
  }

  private resolveGroundCollision(isInGap: boolean): void {
    if (isInGap) {
      // In gap, falling below ground surface is normal until creek water
      this.isGrounded = false;
      return;
    }

    if (this.worldY >= this.groundY) {
      const wasAirborne = !this.isGrounded;
      this.worldY = this.groundY;
      this.vy = 0;
      this.isGrounded = true;

      if (wasAirborne) {
        // Landing feedback!
        this.landingSquishTimerMs = 120;
        SFX.playLand();
        this.spawnTakeoffDust();

        // If landing in mud with high speed, trigger brief skid
        if (this.inMud && this.vx > 280) {
          this.triggerSkid(300);
        }
      }
    }
  }

  private updateVisualsAndAudio(dtMs: number): void {
    if (this.landingSquishTimerMs > 0) {
      this.landingSquishTimerMs -= dtMs;
    }

    // Select sprite frame based on state
    if (this.isSkidding) {
      this.sprite.setTexture('cyclist_skid');
    } else if (!this.isGrounded) {
      this.sprite.setTexture('cyclist_jump');
    } else if (this.landingSquishTimerMs > 0) {
      this.sprite.setTexture('cyclist_land');
    } else {
      // Pedaling animation: speed determines frame rate
      this.animTimerMs += dtMs * (this.vx / GAME_CONFIG.RIDER.BASE_SPEED);
      if (this.animTimerMs >= 90) {
        this.animTimerMs = 0;
        this.animFrameIndex = (this.animFrameIndex + 1) % 6;
        this.sprite.setTexture(`cyclist_pedal_${this.animFrameIndex}`);

        // Pedal click sound periodically
        if (this.animFrameIndex === 0 || this.animFrameIndex === 3) {
          SFX.playPedal();
        }
      }
    }

    // Squash & Stretch for landing
    if (this.landingSquishTimerMs > 0) {
      this.sprite.setScale(1.2, 0.85);
    } else if (!this.isGrounded) {
      this.sprite.setScale(0.95, 1.05);
    } else {
      this.sprite.setScale(1.0, 1.0);
    }

    // Update Jump Charge Bar UI
    if (this.isChargingJump) {
      const fillWidth = Math.floor(20 * this.jumpChargeRatio);
      this.chargeBarFill.width = fillWidth;
      // Color shifts towards bright cyan/white
      const color = this.jumpChargeRatio > 0.8 ? 0xf8fafc : 0x06b6d4;
      this.chargeBarFill.setFillStyle(color);
    }
  }

  private syncDisplayObjects(): void {
    this.sprite.setPosition(this.worldX, this.worldY);
    this.chargeBarBg.setPosition(this.worldX, this.worldY - 26);
    this.chargeBarFill.setPosition(this.worldX - 10, this.worldY - 26);
  }

  private spawnTakeoffDust(): void {
    if (this.scene.textures.exists('particle_dust')) {
      const dust = this.scene.add.sprite(this.worldX, this.worldY - 2, 'particle_dust');
      dust.setDepth(13).setAlpha(0.85);
      this.scene.tweens.add({
        targets: dust,
        alpha: 0,
        y: this.worldY - 8,
        scaleX: 1.4,
        scaleY: 1.4,
        duration: 250,
        onComplete: () => dust.destroy()
      });
    }
  }

  // ==========================================================================
  // GETTERS FOR HUD & CHASE
  // ==========================================================================

  public getStats(bearDistanceM: number, score: number): PlayerStats {
    const totalDistanceM = (GAME_CONFIG.COURSE.START_X - GAME_CONFIG.COURSE.FINISH_X) / GAME_CONFIG.COURSE.PIXELS_PER_METER;
    const currentM = (GAME_CONFIG.COURSE.START_X - this.worldX) / GAME_CONFIG.COURSE.PIXELS_PER_METER;
    const progress = Math.min(1.0, Math.max(0.0, currentM / totalDistanceM));

    return {
      score,
      stamina: this.stamina,
      maxStamina: this.maxStamina,
      speed: this.vx,
      distanceMeters: Math.floor(currentM),
      progressRatio: progress,
      bearDistanceM: Math.max(0, parseFloat(bearDistanceM.toFixed(1))),
      isGrounded: this.isGrounded,
      isAirborne: !this.isGrounded,
      isSkidding: this.isSkidding,
      isSprinting: this.isSprinting,
      isBraking: this.isBraking,
      jumpChargeRatio: this.jumpChargeRatio,
      inMud: this.inMud
    };
  }

  public destroy(): void {
    this.sprite.destroy();
    this.chargeBarBg.destroy();
    this.chargeBarFill.destroy();
    if (this.mudEmitter) this.mudEmitter.destroy();
  }
}
