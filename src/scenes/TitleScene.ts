/**
 * Title Scene
 * Grizzly Run - 16-Bit Title Screen, Controls Guide, High Score & Audio Trigger
 */

import Phaser from 'phaser';
import { Storage } from '../utils/Storage';
import { SoundtrackEngine } from '../audio/SoundtrackEngine';
import { SFX } from '../audio/SoundEffects';

export class TitleScene extends Phaser.Scene {
  private musicEngine!: SoundtrackEngine;

  constructor() {
    super({ key: 'TitleScene' });
  }

  init(data: { musicEngine?: SoundtrackEngine }): void {
    if (data.musicEngine) {
      this.musicEngine = data.musicEngine;
    } else {
      this.musicEngine = new SoundtrackEngine();
    }
  }

  create(): void {
    // 1. Background Layers
    this.add.image(320, 180, 'bg_sky').setDisplaySize(640, 360);
    this.add.image(320, 220, 'bg_mountains').setDisplaySize(640, 160).setAlpha(0.65);
    this.add.image(320, 250, 'bg_forest_far').setDisplaySize(640, 180).setAlpha(0.75);
    this.add.image(320, 270, 'bg_forest_mid').setDisplaySize(640, 220);

    // Dark bottom ground band
    this.add.rectangle(320, 320, 640, 80, 0x0a131a);

    // 2. Title Logo ("GRIZZLY RUN")
    // Retro drop-shadow text
    this.add.text(323, 73, 'GRIZZLY RUN', {
      fontFamily: '"Impact", "Arial Black", monospace',
      fontSize: '44px',
      color: '#451a03',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const titleText = this.add.text(320, 70, 'GRIZZLY RUN', {
      fontFamily: '"Impact", "Arial Black", monospace',
      fontSize: '44px',
      color: '#ef4444',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Neon subtitle
    this.add.text(320, 104, 'ESCAPE THE BEAST  •  REACH THE RANGER STATION', {
      fontFamily: '"Courier New", Courier, monospace',
      fontSize: '11px',
      color: '#06b6d4',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // 3. Animated Sprites Preview
    // Bear chasing cyclist across bottom
    const bearPreview = this.add.sprite(390, 280, 'bear_run_0').setScale(1.2);
    bearPreview.play('bear_gallop');

    const cyclistPreview = this.add.sprite(250, 280, 'cyclist_pedal_0').setScale(1.2);
    cyclistPreview.play('cyclist_pedal');

    // 4. High Score Display
    const highScore = Storage.getHighScore();
    this.add.text(320, 134, `RECORD SCORE: ${highScore.toString().padStart(5, '0')}`, {
      fontFamily: '"Courier New", Courier, monospace',
      fontSize: '13px',
      color: '#fde047',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // 5. Controls Guide Box
    const boxX = 320;
    const boxY = 196;
    const box = this.add.rectangle(boxX, boxY, 440, 68, 0x050a14, 0.88);
    box.setStrokeStyle(1, 0x334155);

    const controls = [
      'W / UP : SPRINT (DRAINS STAMINA)   •   S / DOWN : BRAKE / TRACTION',
      'SPACE : TAP HOP  /  HOLD TO CHARGE JUMP (AUTO-LAUNCH AT CAP)',
      'P : PAUSE   •   M : MUTE AUDIO   •   R : RESTART'
    ];

    controls.forEach((line, i) => {
      this.add.text(boxX, boxY - 20 + i * 18, line, {
        fontFamily: '"Courier New", Courier, monospace',
        fontSize: '9px',
        color: '#94a3b8',
        align: 'center'
      }).setOrigin(0.5);
    });

    // 6. Blinking "PRESS SPACE OR TAP TO PLAY"
    const startPrompt = this.add.text(320, 252, 'PRESS SPACE OR TAP TO PLAY', {
      fontFamily: '"Impact", "Arial Black", monospace',
      fontSize: '18px',
      color: '#22c55e',
      backgroundColor: '#051b11',
      padding: { x: 14, y: 5 }
    }).setOrigin(0.5);

    this.tweens.add({
      targets: startPrompt,
      alpha: 0.25,
      duration: 500,
      yoyo: true,
      repeat: -1
    });

    // 7. Input Handlers to Start Game
    const startGame = () => {
      SFX.playClick();
      this.musicEngine.ensureUnlocked();
      this.scene.start('GameScene', { musicEngine: this.musicEngine });
    };

    // Keyboard trigger
    this.input.keyboard?.on('keydown-SPACE', startGame);
    this.input.keyboard?.on('keydown-ENTER', startGame);

    // Click / Touch trigger
    this.input.on('pointerdown', startGame);

    // Start title music on user interaction
    this.musicEngine.playTitle();
  }
}
