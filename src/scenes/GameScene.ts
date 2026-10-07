/**
 * Game Scene - Core 16-Bit Gameplay Orchestration
 * Grizzly Run - Physics, Entities, Trail Scanner, Parallax & Obstacles
 */

import Phaser from 'phaser';
import { GAME_CONFIG } from '../config';
import { GameState, Obstacle, ObstacleType, RunResults } from '../types';
import { LevelData } from '../level/LevelData';
import { Cyclist } from '../entities/Cyclist';
import { Bear } from '../entities/Bear';
import { HUD } from '../ui/HUD';
import { TouchControls } from '../ui/TouchControls';
import { SoundtrackEngine } from '../audio/SoundtrackEngine';
import { SFX } from '../audio/SoundEffects';
import { Storage } from '../utils/Storage';

export class GameScene extends Phaser.Scene {
  private musicEngine!: SoundtrackEngine;

  // Entities
  private cyclist!: Cyclist;
  private bear!: Bear;
  private hud!: HUD;
  private touchControls!: TouchControls;

  // Level & World
  private obstacles: Obstacle[] = [];
  private obstacleSprites: Phaser.GameObjects.GameObject[] = [];
  private terrainTiles: Phaser.GameObjects.TileSprite[] = [];

  // Parallax Background Layers
  private bgSky!: Phaser.GameObjects.TileSprite;
  private bgMountains!: Phaser.GameObjects.TileSprite;
  private bgForestFar!: Phaser.GameObjects.TileSprite;
  private bgForestMid!: Phaser.GameObjects.TileSprite;

  // Ranger Station Finish Marker
  private rangerStationSprite!: Phaser.GameObjects.Sprite;

  // Gameplay Run State
  private gameState: GameState = GameState.PLAYING;
  private score: number = 0;
  private runTimerSec: number = 0;
  private gapsClearedCount: number = 0;
  private distanceTraveledM: number = 0;

  // Key controls
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keyW!: Phaser.Input.Keyboard.Key;
  private keyS!: Phaser.Input.Keyboard.Key;
  private keyP!: Phaser.Input.Keyboard.Key;
  private keyM!: Phaser.Input.Keyboard.Key;
  private keySpace!: Phaser.Input.Keyboard.Key;
  private keyEsc!: Phaser.Input.Keyboard.Key;

  constructor() {
    super({ key: 'GameScene' });
  }

  init(data: { musicEngine?: SoundtrackEngine }): void {
    if (data.musicEngine) {
      this.musicEngine = data.musicEngine;
    } else {
      this.musicEngine = new SoundtrackEngine();
    }
  }

  create(): void {
    this.gameState = GameState.PLAYING;
    this.score = 0;
    this.runTimerSec = 0;
    this.gapsClearedCount = 0;
    this.distanceTraveledM = 0;

    // 1. Setup Camera
    this.cameras.main.setBounds(0, 0, GAME_CONFIG.COURSE.START_X + 1000, 360);

    // 2. Setup Parallax Background Layers
    this.createParallaxLayers();

    // 3. Setup Ground Terrain & Course Obstacles
    this.createCourseTerrain();

    // 4. Instantiate Finish Line (Ranger Station)
    this.rangerStationSprite = this.add.sprite(
      GAME_CONFIG.COURSE.FINISH_X,
      GAME_CONFIG.COURSE.GROUND_Y - 40,
      'bldg_ranger_station'
    ).setOrigin(0.5, 0.5).setDepth(12);

    // 5. Instantiate Entities
    this.cyclist = new Cyclist(
      this,
      GAME_CONFIG.COURSE.START_X,
      GAME_CONFIG.COURSE.GROUND_Y
    );

    this.bear = new Bear(
      this,
      GAME_CONFIG.COURSE.START_X + GAME_CONFIG.COURSE.BEAR_START_OFFSET,
      GAME_CONFIG.COURSE.GROUND_Y
    );

    // 6. Setup HUD & Touch Controls
    this.hud = new HUD(this, this.obstacles);

    this.touchControls = new TouchControls(
      this,
      this.cyclist,
      this.musicEngine,
      () => this.togglePause()
    );

    // 7. Setup Keyboard Input
    this.setupKeyboardInput();

    // 8. Start Soundtrack Gameplay Loop
    this.musicEngine.playGameplay();

    // 9. Tab visibility pause listener
    this.setupVisibilityListener();
  }

  // ==========================================================================
  // PARALLAX & TERRAIN SETUP
  // ==========================================================================

  private createParallaxLayers(): void {
    // Sky
    this.bgSky = this.add.tileSprite(320, 180, 640, 360, 'bg_sky')
      .setScrollFactor(0)
      .setDepth(1);

    // Mountains
    this.bgMountains = this.add.tileSprite(320, 210, 640, 160, 'bg_mountains')
      .setScrollFactor(0)
      .setDepth(2)
      .setAlpha(0.65);

    // Far Forest
    this.bgForestFar = this.add.tileSprite(320, 230, 640, 180, 'bg_forest_far')
      .setScrollFactor(0)
      .setDepth(3)
      .setAlpha(0.75);

    // Mid Forest
    this.bgForestMid = this.add.tileSprite(320, 250, 640, 220, 'bg_forest_mid')
      .setScrollFactor(0)
      .setDepth(4);
  }

  private createCourseTerrain(): void {
    this.obstacles = LevelData.getObstacles();
    const segments = LevelData.getTerrainSegments();

    // Create ground tiles along the trail for solid segments
    for (const seg of segments) {
      if (!seg.isGap) {
        const minX = Math.min(seg.startX, seg.endX);
        const maxX = Math.max(seg.startX, seg.endX);
        const width = maxX - minX;
        const centerX = minX + width / 2;

        const tile = this.add.tileSprite(
          centerX,
          GAME_CONFIG.COURSE.GROUND_Y + 45,
          width,
          90,
          'tile_trail'
        ).setDepth(10);

        this.terrainTiles.push(tile);
      } else {
        // Creek water in gap
        const minX = Math.min(seg.startX, seg.endX);
        const maxX = Math.max(seg.startX, seg.endX);
        const width = maxX - minX;
        const centerX = minX + width / 2;

        const water = this.add.tileSprite(
          centerX,
          GAME_CONFIG.COURSE.CREEK_DEPTH_Y + 30,
          width,
          70,
          'creek_water'
        ).setDepth(9);

        this.terrainTiles.push(water);
      }
    }

    // Spawn Obstacle Sprites
    for (const obs of this.obstacles) {
      if (obs.type === ObstacleType.LOG) {
        const sp = this.add.sprite(obs.x + obs.width / 2, obs.y + obs.height! / 2, 'obs_log')
          .setDepth(11);
        this.obstacleSprites.push(sp);
      } else if (obs.type === ObstacleType.RAMP) {
        const sp = this.add.sprite(obs.x + obs.width / 2, obs.y + obs.height! / 2, 'obs_kicker')
          .setDepth(11);
        this.obstacleSprites.push(sp);
      } else if (obs.type === ObstacleType.MUD_PATCH) {
        const sp = this.add.sprite(obs.x + obs.width / 2, obs.y + 6, 'obs_mud')
          .setDisplaySize(obs.width, 16)
          .setDepth(11);
        this.obstacleSprites.push(sp);
      }
    }
  }

  // ==========================================================================
  // INPUT HANDLING
  // ==========================================================================

  private setupKeyboardInput(): void {
    if (!this.input.keyboard) return;

    this.cursors = this.input.keyboard.createCursorKeys();
    this.keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.keyS = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    this.keyP = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P);
    this.keyM = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.M);
    this.keySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.keyEsc = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

    // Jump press and release
    this.keySpace.on('down', () => this.cyclist.onJumpPress());
    this.keySpace.on('up', () => this.cyclist.onJumpRelease());

    // Pause toggle
    this.keyP.on('down', () => this.togglePause());
    this.keyEsc.on('down', () => this.togglePause());

    // Sound toggle
    this.keyM.on('down', () => {
      const cur = Storage.getSettings();
      const newMute = !cur.masterMute;
      Storage.saveSettings({ masterMute: newMute });
      this.musicEngine.updateVolume();
      SFX.updateVolume();
    });
  }

  private togglePause(): void {
    if (this.gameState !== GameState.PLAYING) return;
    this.gameState = GameState.PAUSED;
    this.touchControls.resetInputs();
    this.cyclist.setSprint(false);
    this.cyclist.setBrake(false);
    this.scene.pause();
    this.scene.launch('PauseScene', { musicEngine: this.musicEngine });
  }

  private setupVisibilityListener(): void {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.gameState === GameState.PLAYING) {
        this.togglePause();
      }
    });
  }

  // ==========================================================================
  // MAIN UPDATE LOOP (Fixed simulation step)
  // ==========================================================================

  update(time: number, delta: number): void {
    if (this.gameState !== GameState.PLAYING) return;

    // Clamp delta time to prevent physics tunneling after interruptions
    const dtSec = Math.min(0.045, delta / 1000);
    this.runTimerSec += dtSec;

    // 1. Process Desktop Input into Cyclist States
    this.handleKeyboardPolling();

    // 2. Determine Terrain Ground Elevation for Rider & Bear
    const riderInCreek = LevelData.isWorldXInCreek(this.cyclist.worldX);
    const bearInCreek = LevelData.isWorldXInCreek(this.bear.worldX);

    // 3. Update Entities
    this.cyclist.update(dtSec, this.obstacles, GAME_CONFIG.COURSE.GROUND_Y, riderInCreek);
    this.bear.update(
      dtSec,
      this.cyclist.worldX,
      this.cyclist.vx,
      this.obstacles,
      GAME_CONFIG.COURSE.GROUND_Y,
      bearInCreek
    );

    // 4. Update Camera Tracking
    // Rider travels LEFT: Lead camera to give forward visibility towards left
    const targetCamX = this.cyclist.worldX - 160;
    this.cameras.main.scrollX = Phaser.Math.Linear(
      this.cameras.main.scrollX,
      targetCamX,
      0.12
    );

    // 5. Update Parallax Background Positions
    const camX = this.cameras.main.scrollX;
    this.bgSky.tilePositionX = camX * 0.02;
    this.bgMountains.tilePositionX = camX * 0.1;
    this.bgForestFar.tilePositionX = camX * 0.25;
    this.bgForestMid.tilePositionX = camX * 0.5;

    // 6. Distance & Score Tracking
    this.distanceTraveledM = Math.max(
      0,
      Math.floor((GAME_CONFIG.COURSE.START_X - this.cyclist.worldX) / GAME_CONFIG.COURSE.PIXELS_PER_METER)
    );
    this.score = Math.floor(this.distanceTraveledM * GAME_CONFIG.SCORING.DISTANCE_FACTOR);

    // 7. Check Obstacle Clears & Jumps
    this.checkObstacleClears();

    // 8. Update Audio Danger Stem (Hysteresis handled inside SoundtrackEngine)
    this.musicEngine.updateDangerStem(this.bear.distanceMeters);

    // 9. Update HUD Stats & Defender-style Radar
    const stats = this.cyclist.getStats(this.bear.distanceMeters, this.score);
    this.hud.update(stats, this.bear.worldX, this.cyclist.worldX);

    // 10. Check Win & Loss Conditions
    this.checkGameOutcomes(riderInCreek);
  }

  private handleKeyboardPolling(): void {
    if (!this.input.keyboard) return;

    // Sprinting
    const sprintKey = (this.keyW && this.keyW.isDown) || (this.cursors && this.cursors.up.isDown);
    if (!this.cyclist.isSprinting && sprintKey) {
      this.cyclist.setSprint(true);
    } else if (this.cyclist.isSprinting && !sprintKey) {
      // Only release if touch isn't holding sprint
      this.cyclist.setSprint(false);
    }

    // Braking
    const brakeKey = (this.keyS && this.keyS.isDown) || (this.cursors && this.cursors.down.isDown);
    if (!this.cyclist.isBraking && brakeKey) {
      this.cyclist.setBrake(true);
    } else if (this.cyclist.isBraking && !brakeKey) {
      this.cyclist.setBrake(false);
    }
  }

  // ==========================================================================
  // OBSTACLE CLEAR DETECTION & SCORING
  // ==========================================================================

  private checkObstacleClears(): void {
    for (const obs of this.obstacles) {
      if (obs.cleared) continue;

      // Obstacle left edge is obs.x. Cyclist travels LEFT: passing obstacle means cyclist.worldX < obs.x
      if (this.cyclist.worldX < obs.x) {
        obs.cleared = true;

        if (obs.type === ObstacleType.LOG) {
          // If cleared log without colliding
          if (!this.cyclist.isSkidding) {
            this.awardBonusScore(obs.bonusScore, obs.x, obs.y - 20, 'HOP CLEAR!');
          }
        } else if (obs.type === ObstacleType.RAMP) {
          this.awardBonusScore(obs.bonusScore, obs.x, obs.y - 24, 'AIR LAUNCH!');
        } else if (obs.type === ObstacleType.CREEK_GAP) {
          // Cleared creek gap alive!
          this.gapsClearedCount++;
          this.awardBonusScore(obs.bonusScore, obs.x, obs.y - 50, 'GAP CLEARED!');
        }
      }
    }
  }

  private awardBonusScore(bonus: number, worldX: number, worldY: number, label: string): void {
    this.score += bonus;
    SFX.playBonus();

    // Floating Arcade Popup Text
    const popup = this.add.text(worldX, worldY, `+${bonus}\n${label}`, {
      fontFamily: '"Impact", "Arial Black", monospace',
      fontSize: '12px',
      color: '#fde047',
      align: 'center',
      stroke: '#050a14',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(25);

    this.tweens.add({
      targets: popup,
      y: worldY - 26,
      alpha: 0,
      duration: 800,
      ease: 'Cubic.easeOut',
      onComplete: () => popup.destroy()
    });
  }

  // ==========================================================================
  // GAME OUTCOMES (WIN / CAUGHT / CREEK FALL)
  // ==========================================================================

  private checkGameOutcomes(riderInCreek: boolean): void {
    // 1. Victory: Reached Ranger Station alive!
    if (this.cyclist.worldX <= GAME_CONFIG.COURSE.FINISH_X) {
      this.triggerOutcome(true, 'escaped');
      return;
    }

    // 2. Defeat: Caught by Bear
    if (this.bear.hasCaughtRider()) {
      this.triggerOutcome(false, 'caught');
      return;
    }

    // 3. Defeat: Uncleared Creek Gap Fall
    if (riderInCreek && this.cyclist.worldY >= GAME_CONFIG.COURSE.CREEK_DEPTH_Y - 10) {
      SFX.playSplash();
      this.triggerOutcome(false, 'creek_fall');
      return;
    }
  }

  private triggerOutcome(won: boolean, reason: 'caught' | 'creek_fall' | 'escaped'): void {
    if (this.gameState !== GameState.PLAYING) return;
    this.gameState = won ? GameState.VICTORY : (reason === 'caught' ? GameState.GAMEOVER_CAUGHT : GameState.GAMEOVER_GAP);

    if (won) {
      this.score += GAME_CONFIG.SCORING.VICTORY_BONUS;
    }

    const results: RunResults = {
      won,
      reason,
      score: this.score,
      distanceCoveredM: this.distanceTraveledM,
      totalTimeSec: this.runTimerSec,
      gapsCleared: this.gapsClearedCount,
      bestScore: Storage.getHighScore()
    };

    // Transition to GameOverScene
    this.time.delayedCall(200, () => {
      this.scene.start('GameOverScene', { results, musicEngine: this.musicEngine });
    });
  }
}
