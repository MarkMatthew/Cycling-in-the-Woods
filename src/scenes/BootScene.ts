/**
 * Boot Scene
 * Grizzly Run - Texture Generation, Animation Setup & Initial Assets
 */

import Phaser from 'phaser';
import { PixelArtGenerator } from '../graphics/PixelArtGenerator';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  create(): void {
    // 1. Generate all procedural 16-bit textures
    PixelArtGenerator.generateAllTextures(this);

    // 2. Register sprite animations
    this.createAnimations();

    // 3. Immediately transition to TitleScene
    this.scene.start('TitleScene');
  }

  private createAnimations(): void {
    // Cyclist pedaling animation
    if (!this.anims.exists('cyclist_pedal')) {
      this.anims.create({
        key: 'cyclist_pedal',
        frames: [
          { key: 'cyclist_pedal_0' },
          { key: 'cyclist_pedal_1' },
          { key: 'cyclist_pedal_2' },
          { key: 'cyclist_pedal_3' },
          { key: 'cyclist_pedal_4' },
          { key: 'cyclist_pedal_5' }
        ],
        frameRate: 12,
        repeat: -1
      });
    }

    // Grizzly bear galloping animation
    if (!this.anims.exists('bear_gallop')) {
      this.anims.create({
        key: 'bear_gallop',
        frames: [
          { key: 'bear_run_0' },
          { key: 'bear_run_1' },
          { key: 'bear_run_2' },
          { key: 'bear_run_3' },
          { key: 'bear_run_4' },
          { key: 'bear_run_5' }
        ],
        frameRate: 10,
        repeat: -1
      });
    }
  }
}
