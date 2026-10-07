/**
 * On-Screen Touch Controls Overlay for Mobile
 * Grizzly Run - Multi-Touch Responsive Interface
 */

import Phaser from 'phaser';
import { Cyclist } from '../entities/Cyclist';
import { SFX } from '../audio/SoundEffects';
import { SoundtrackEngine } from '../audio/SoundtrackEngine';
import { Storage } from '../utils/Storage';

export class TouchControls {
  private scene: Phaser.Scene;
  private cyclist: Cyclist;
  private musicEngine: SoundtrackEngine;
  private container: Phaser.GameObjects.Container;

  // Active touch states
  private sprintPointerId: number | null = null;
  private brakePointerId: number | null = null;
  private jumpPointerId: number | null = null;

  constructor(
    scene: Phaser.Scene,
    cyclist: Cyclist,
    musicEngine: SoundtrackEngine,
    onPauseToggle: () => void
  ) {
    this.scene = scene;
    this.cyclist = cyclist;
    this.musicEngine = musicEngine;

    this.container = scene.add.container(0, 0);
    this.container.setScrollFactor(0);
    this.container.setDepth(110);

    // Only render on touch-capable devices or small viewports
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (!isTouch && window.innerWidth > 900) {
      this.container.setVisible(false);
      return;
    }

    this.createButtons(onPauseToggle);
    this.setupGlobalPointerHandlers();
  }

  private createButtons(onPauseToggle: () => void): void {
    const scene = this.scene;

    // ------------------------------------------------------------------------
    // LEFT SIDE: BRAKE & SPRINT BUTTONS
    // ------------------------------------------------------------------------
    // BRAKE BUTTON (Bottom left, x=54, y=308, radius 28)
    const brakeCircle = scene.add.circle(54, 308, 28, 0xef4444, 0.45);
    brakeCircle.setStrokeStyle(2, 0xef4444);
    const brakeText = scene.add.text(54, 308, 'BRAKE', {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    brakeCircle.setInteractive({ useHandCursor: true });
    brakeCircle.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.brakePointerId = pointer.id;
      this.cyclist.setBrake(true);
      brakeCircle.setFillStyle(0xef4444, 0.85);
    });
    brakeCircle.on('pointerup', () => {
      this.brakePointerId = null;
      this.cyclist.setBrake(false);
      brakeCircle.setFillStyle(0xef4444, 0.45);
    });

    // SPRINT BUTTON (Bottom left-ish, x=130, y=308, radius 32)
    const sprintCircle = scene.add.circle(130, 308, 32, 0x22c55e, 0.45);
    sprintCircle.setStrokeStyle(2, 0x22c55e);
    const sprintText = scene.add.text(130, 308, 'SPRINT', {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    sprintCircle.setInteractive({ useHandCursor: true });
    sprintCircle.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.sprintPointerId = pointer.id;
      this.cyclist.setSprint(true);
      sprintCircle.setFillStyle(0x22c55e, 0.85);
    });
    sprintCircle.on('pointerup', () => {
      this.sprintPointerId = null;
      this.cyclist.setSprint(false);
      sprintCircle.setFillStyle(0x22c55e, 0.45);
    });

    // ------------------------------------------------------------------------
    // RIGHT SIDE: LARGE JUMP / CHARGE BUTTON
    // ------------------------------------------------------------------------
    // JUMP BUTTON (Bottom right, x=576, y=298, radius 42)
    const jumpCircle = scene.add.circle(576, 298, 42, 0x06b6d4, 0.45);
    jumpCircle.setStrokeStyle(3, 0x06b6d4);
    const jumpText = scene.add.text(576, 298, 'JUMP\nHOLD', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#ffffff',
      fontStyle: 'bold',
      align: 'center'
    }).setOrigin(0.5);

    jumpCircle.setInteractive({ useHandCursor: true });
    jumpCircle.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.jumpPointerId = pointer.id;
      this.cyclist.onJumpPress();
      jumpCircle.setFillStyle(0x06b6d4, 0.85);
    });
    jumpCircle.on('pointerup', () => {
      this.jumpPointerId = null;
      this.cyclist.onJumpRelease();
      jumpCircle.setFillStyle(0x06b6d4, 0.45);
    });

    // ------------------------------------------------------------------------
    // TOP CORNER BUTTONS: PAUSE & MUTE
    // ------------------------------------------------------------------------
    // PAUSE BUTTON (x=618, y=18, 16x16)
    const pauseBtn = scene.add.rectangle(618, 18, 26, 22, 0x1e293b, 0.85);
    pauseBtn.setStrokeStyle(1, 0x64748b);
    const pauseText = scene.add.text(618, 18, '⏸', {
      fontSize: '12px',
      color: '#f8fafc'
    }).setOrigin(0.5);
    pauseBtn.setInteractive({ useHandCursor: true });
    pauseBtn.on('pointerdown', () => {
      SFX.playClick();
      onPauseToggle();
    });

    this.container.add([
      brakeCircle, brakeText,
      sprintCircle, sprintText,
      jumpCircle, jumpText,
      pauseBtn, pauseText
    ]);
  }

  private setupGlobalPointerHandlers(): void {
    // When touch leaves screen or cancels, clear held inputs
    this.scene.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (pointer.id === this.sprintPointerId) {
        this.sprintPointerId = null;
        this.cyclist.setSprint(false);
      }
      if (pointer.id === this.brakePointerId) {
        this.brakePointerId = null;
        this.cyclist.setBrake(false);
      }
      if (pointer.id === this.jumpPointerId) {
        this.jumpPointerId = null;
        this.cyclist.onJumpRelease();
      }
    });

    this.scene.input.on('gameout', () => {
      this.resetInputs();
    });
  }

  public resetInputs(): void {
    this.sprintPointerId = null;
    this.brakePointerId = null;
    this.jumpPointerId = null;
    this.cyclist.setSprint(false);
    this.cyclist.setBrake(false);
    this.cyclist.onJumpRelease();
  }

  public destroy(): void {
    this.container.destroy();
  }
}
