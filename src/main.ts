/**
 * Grizzly Run - 16-Bit Survival Cycling Game
 * Game Initialization & Phaser Entry Point
 */

import Phaser from 'phaser';
import { GAME_CONFIG } from './config';
import { BootScene } from './scenes/BootScene';
import { TitleScene } from './scenes/TitleScene';
import { GameScene } from './scenes/GameScene';
import { PauseScene } from './scenes/PauseScene';
import { GameOverScene } from './scenes/GameOverScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: GAME_CONFIG.WIDTH,
  height: GAME_CONFIG.HEIGHT,
  pixelArt: true,
  roundPixels: true,
  backgroundColor: '#050a14',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: GAME_CONFIG.WIDTH,
    height: GAME_CONFIG.HEIGHT
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false
    }
  },
  scene: [BootScene, TitleScene, GameScene, PauseScene, GameOverScene]
};

// Start the game instance
export const game = new Phaser.Game(config);
