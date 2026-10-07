/**
 * Game Over & Victory Results Scene
 * Grizzly Run - Clean Non-Graphic Outcome Presentation & Replay Loop
 */

import Phaser from 'phaser';
import { RunResults } from '../types';
import { Storage } from '../utils/Storage';
import { SoundtrackEngine } from '../audio/SoundtrackEngine';
import { SFX } from '../audio/SoundEffects';

export class GameOverScene extends Phaser.Scene {
  private musicEngine!: SoundtrackEngine;
  private results!: RunResults;

  constructor() {
    super({ key: 'GameOverScene' });
  }

  init(data: { results: RunResults; musicEngine: SoundtrackEngine }): void {
    this.results = data.results;
    this.musicEngine = data.musicEngine;
  }

  create(): void {
    const r = this.results;
    const isNewHigh = Storage.saveHighScore(r.score);
    const best = Storage.getHighScore();

    // 1. Dimmed Background
    this.add.rectangle(320, 180, 640, 360, 0x050a14, 0.95);

    // 2. Play Audio Stings
    if (r.won) {
      this.musicEngine.playVictory();
    } else {
      this.musicEngine.playDefeat();
    }

    // 3. Header Title & Banner
    let headerText = 'DEFEAT';
    let headerColor = '#ef4444';
    let subMsg = '';

    if (r.won) {
      headerText = 'VICTORY!';
      headerColor = '#22c55e';
      subMsg = 'YOU REACHED THE RANGER STATION & SURVIVED!';
    } else if (r.reason === 'creek_fall') {
      headerText = 'WIPEOUT!';
      headerColor = '#38bdf8';
      subMsg = 'LOST TRACTION AND TUMBLED INTO THE ICY CREEK.';
    } else {
      headerText = 'CAUGHT!';
      headerColor = '#ef4444';
      subMsg = 'THE GRIZZLY BEAR OVERWHELMED YOU ON THE TRAIL.';
    }

    this.add.text(320, 50, headerText, {
      fontFamily: '"Impact", "Arial Black", monospace',
      fontSize: '38px',
      color: headerColor,
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.add.text(320, 84, subMsg, {
      fontFamily: '"Courier New", Courier, monospace',
      fontSize: '11px',
      color: '#cbd5e1',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // 4. Results Card Box
    const boxX = 320;
    const boxY = 180;
    const box = this.add.rectangle(boxX, boxY, 400, 130, 0x0f172a, 0.9);
    box.setStrokeStyle(1, 0x334155);

    // Final Score
    this.add.text(boxX, boxY - 42, `FINAL SCORE: ${r.score.toString().padStart(5, '0')}`, {
      fontFamily: '"Courier New", Courier, monospace',
      fontSize: '18px',
      color: '#fde047',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    if (isNewHigh) {
      this.add.text(boxX, boxY - 22, '★ NEW RECORD HIGH SCORE! ★', {
        fontFamily: '"Courier New", Courier, monospace',
        fontSize: '11px',
        color: '#22c55e',
        fontStyle: 'bold'
      }).setOrigin(0.5);
    } else {
      this.add.text(boxX, boxY - 22, `ALL-TIME BEST: ${best.toString().padStart(5, '0')}`, {
        fontFamily: '"Courier New", Courier, monospace',
        fontSize: '11px',
        color: '#94a3b8'
      }).setOrigin(0.5);
    }

    // Run Stats
    const timeFormatted = `${Math.floor(r.totalTimeSec / 60)}:${(Math.floor(r.totalTimeSec) % 60).toString().padStart(2, '0')}`;
    const statsLines = [
      `DISTANCE COVERED: ${r.distanceCoveredM} METERS`,
      `RUN TIME: ${timeFormatted}`,
      `CREEK GAPS CLEARED: ${r.gapsCleared} / 2`
    ];

    statsLines.forEach((line, idx) => {
      this.add.text(boxX, boxY + 2 + idx * 17, line, {
        fontFamily: '"Courier New", Courier, monospace',
        fontSize: '11px',
        color: '#e2e8f0'
      }).setOrigin(0.5);
    });

    // 5. Restart Action Prompt
    const restartPrompt = this.add.text(320, 280, 'PRESS R / SPACE / TAP TO RESTART RUN', {
      fontFamily: '"Impact", "Arial Black", monospace',
      fontSize: '16px',
      color: '#22c55e',
      backgroundColor: '#051b11',
      padding: { x: 12, y: 6 }
    }).setOrigin(0.5);

    this.tweens.add({
      targets: restartPrompt,
      alpha: 0.3,
      duration: 500,
      yoyo: true,
      repeat: -1
    });

    // 6. Action Handlers
    const restartRun = () => {
      SFX.playClick();
      this.scene.start('GameScene', { musicEngine: this.musicEngine });
    };

    this.input.keyboard?.on('keydown-R', restartRun);
    this.input.keyboard?.on('keydown-SPACE', restartRun);
    this.input.keyboard?.on('keydown-ENTER', restartRun);
    this.input.on('pointerdown', restartRun);
  }
}
