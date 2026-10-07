/**
 * Pause Overlay Scene
 * Grizzly Run - In-game Pause Menu & Settings
 */

import Phaser from 'phaser';
import { Storage } from '../utils/Storage';
import { SoundtrackEngine } from '../audio/SoundtrackEngine';
import { SFX } from '../audio/SoundEffects';

export class PauseScene extends Phaser.Scene {
  private musicEngine!: SoundtrackEngine;

  constructor() {
    super({ key: 'PauseScene' });
  }

  init(data: { musicEngine: SoundtrackEngine }): void {
    this.musicEngine = data.musicEngine;
  }

  create(): void {
    // 1. Semi-transparent dark overlay
    this.add.rectangle(320, 180, 640, 360, 0x050a14, 0.75);

    // 2. Pause Box
    const box = this.add.rectangle(320, 180, 300, 200, 0x0f172a, 0.95);
    box.setStrokeStyle(1, 0x334155);

    this.add.text(320, 105, 'PAUSED', {
      fontFamily: '"Impact", "Arial Black", monospace',
      fontSize: '28px',
      color: '#06b6d4'
    }).setOrigin(0.5);

    // 3. Interactive Menu Buttons
    const resumeBtn = this.createMenuButton(320, 145, 'RESUME GAME (P / ESC)', () => {
      this.resumeGame();
    });

    const restartBtn = this.createMenuButton(320, 180, 'RESTART RUN (R)', () => {
      this.restartGame();
    });

    // Mute toggle button
    const settings = Storage.getSettings();
    let muteLabel = settings.masterMute ? 'SOUND: OFF (M)' : 'SOUND: ON (M)';
    const muteBtn = this.createMenuButton(320, 215, muteLabel, () => {
      const cur = Storage.getSettings();
      const newMute = !cur.masterMute;
      Storage.saveSettings({ masterMute: newMute });
      this.musicEngine.updateVolume();
      SFX.updateVolume();
      muteText.setText(newMute ? 'SOUND: OFF (M)' : 'SOUND: ON (M)');
    });
    const muteText = (muteBtn as any).btnText as Phaser.GameObjects.Text;

    // Shake toggle button
    let shakeLabel = settings.reduceShake ? 'SCREEN SHAKE: REDUCED' : 'SCREEN SHAKE: NORMAL';
    const shakeBtn = this.createMenuButton(320, 250, shakeLabel, () => {
      const cur = Storage.getSettings();
      const newShake = !cur.reduceShake;
      Storage.saveSettings({ reduceShake: newShake });
      shakeText.setText(newShake ? 'SCREEN SHAKE: REDUCED' : 'SCREEN SHAKE: NORMAL');
    });
    const shakeText = (shakeBtn as any).btnText as Phaser.GameObjects.Text;

    // 4. Keyboard Shortcuts
    this.input.keyboard?.on('keydown-P', () => this.resumeGame());
    this.input.keyboard?.on('keydown-ESC', () => this.resumeGame());
    this.input.keyboard?.on('keydown-R', () => this.restartGame());
    this.input.keyboard?.on('keydown-M', () => {
      const cur = Storage.getSettings();
      const newMute = !cur.masterMute;
      Storage.saveSettings({ masterMute: newMute });
      this.musicEngine.updateVolume();
      SFX.updateVolume();
      muteText.setText(newMute ? 'SOUND: OFF (M)' : 'SOUND: ON (M)');
    });
  }

  private createMenuButton(x: number, y: number, text: string, callback: () => void): Phaser.GameObjects.Rectangle {
    const bg = this.add.rectangle(x, y, 240, 26, 0x1e293b, 0.9);
    bg.setStrokeStyle(1, 0x475569);
    bg.setInteractive({ useHandCursor: true });

    const btnText = this.add.text(x, y, text, {
      fontFamily: '"Courier New", Courier, monospace',
      fontSize: '11px',
      color: '#f8fafc',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    (bg as any).btnText = btnText;

    bg.on('pointerover', () => {
      bg.setFillStyle(0x334155);
      btnText.setColor('#06b6d4');
    });
    bg.on('pointerout', () => {
      bg.setFillStyle(0x1e293b);
      btnText.setColor('#f8fafc');
    });
    bg.on('pointerdown', () => {
      SFX.playClick();
      callback();
    });

    return bg;
  }

  private resumeGame(): void {
    SFX.playClick();
    this.scene.stop();
    this.scene.resume('GameScene');
  }

  private restartGame(): void {
    SFX.playClick();
    this.scene.stop();
    this.scene.stop('GameScene');
    this.scene.start('GameScene', { musicEngine: this.musicEngine });
  }
}
