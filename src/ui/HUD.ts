/**
 * Top HUD Overlay & Defender-Style Trail Scanner
 * Grizzly Run - 16-Bit Arcade UI
 * 
 * Fixed logical 640x360 coordinate system (scrollFactor = 0)
 */

import Phaser from 'phaser';
import { GAME_CONFIG } from '../config';
import { Obstacle, ObstacleType, PlayerStats } from '../types';

export class HUD {
  public scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;

  // HUD Elements
  private scoreText: Phaser.GameObjects.Text;
  private bearDistText: Phaser.GameObjects.Text;
  private speedText: Phaser.GameObjects.Text;

  // Stamina Bar
  private staminaBarBg: Phaser.GameObjects.Rectangle;
  private staminaBarFill: Phaser.GameObjects.Rectangle;
  private staminaLabel: Phaser.GameObjects.Text;

  // Defender-Style Trail Scanner (Radar)
  private scannerBg: Phaser.GameObjects.Rectangle;
  private scannerRiderDot: Phaser.GameObjects.Rectangle;
  private scannerBearDot: Phaser.GameObjects.Rectangle;
  private scannerObstacleDots: Phaser.GameObjects.Rectangle[] = [];
  private scannerRangerMarker: Phaser.GameObjects.Rectangle;

  // Red Danger Vignette Overlay
  private dangerVignette: Phaser.GameObjects.Rectangle;

  constructor(scene: Phaser.Scene, obstacles: Obstacle[]) {
    this.scene = scene;
    this.container = scene.add.container(0, 0);
    this.container.setScrollFactor(0);
    this.container.setDepth(100);

    // 1. Top HUD Dark Header Bar (640 x 38)
    const headerBar = scene.add.rectangle(320, 19, 640, 38, 0x050a14, 0.92);
    headerBar.setStrokeStyle(1, 0x1e293b);
    this.container.add(headerBar);

    // 2. Score Readout (Left top)
    this.scoreText = scene.add.text(14, 6, 'SCORE: 00000', {
      fontFamily: '"Courier New", Courier, monospace',
      fontSize: '12px',
      color: '#f8fafc',
      fontStyle: 'bold'
    });
    this.container.add(this.scoreText);

    // Speed readout (under score)
    this.speedText = scene.add.text(14, 20, 'SPD: 23 KM/H', {
      fontFamily: '"Courier New", Courier, monospace',
      fontSize: '10px',
      color: '#06b6d4',
      fontStyle: 'bold'
    });
    this.container.add(this.speedText);

    // 3. Defender-Style Trail Scanner (Center)
    // Scanner width: 280px, height: 14px, centered at x=320, y=14
    const scannerX = 320;
    const scannerY = 13;
    const scannerW = 280;
    const scannerH = 14;

    this.scannerBg = scene.add.rectangle(scannerX, scannerY, scannerW, scannerH, 0x0f172a, 0.95);
    this.scannerBg.setStrokeStyle(1, 0x334155);
    this.container.add(this.scannerBg);

    // Scanner Trail centerline
    const centerLine = scene.add.rectangle(scannerX, scannerY, scannerW - 4, 1, 0x1e293b);
    this.container.add(centerLine);

    // Ranger Station finish icon on far left of scanner
    this.scannerRangerMarker = scene.add.rectangle(scannerX - scannerW / 2 + 5, scannerY, 4, 10, 0x22c55e);
    this.container.add(this.scannerRangerMarker);

    // Populate static obstacle blips on scanner
    // Note: World X: 25,000 (right) -> 450 (left)
    // In scanner: left edge corresponds to FINISH_X, right edge to START_X
    const totalCourseSpan = GAME_CONFIG.COURSE.START_X - GAME_CONFIG.COURSE.FINISH_X;
    const scannerLeftEdge = scannerX - scannerW / 2 + 6;
    const scannerTrackWidth = scannerW - 12;

    for (const obs of obstacles) {
      // Map worldX to scanner coordinate:
      // worldX=450 -> progress=1 (left edge); worldX=25000 -> progress=0 (right edge)
      const ratioFromStart = (GAME_CONFIG.COURSE.START_X - obs.x) / totalCourseSpan;
      const blipX = (scannerX + scannerW / 2 - 6) - (ratioFromStart * scannerTrackWidth);

      let blipColor = 0xeab308; // Yellow for log
      let blipH = 4;
      let blipW = 2;

      if (obs.type === ObstacleType.CREEK_GAP) {
        blipColor = 0x0284c7; // Cyan/blue for creek
        blipW = 6;
        blipH = 8;
      } else if (obs.type === ObstacleType.RAMP) {
        blipColor = 0xf8fafc; // White for kicker ramp
        blipH = 6;
      } else if (obs.type === ObstacleType.MUD_PATCH) {
        blipColor = 0x78350f; // Brown for mud
        blipW = 4;
        blipH = 3;
      }

      const blip = scene.add.rectangle(blipX, scannerY, blipW, blipH, blipColor, 0.85);
      this.scannerObstacleDots.push(blip);
      this.container.add(blip);
    }

    // Bear Dot (amber pip)
    this.scannerBearDot = scene.add.rectangle(scannerX, scannerY, 5, 7, 0xef4444);
    this.container.add(this.scannerBearDot);

    // Rider Dot (cyan pip)
    this.scannerRiderDot = scene.add.rectangle(scannerX, scannerY, 4, 8, 0x06b6d4);
    this.container.add(this.scannerRiderDot);

    // Scanner labels (FINISH on left, START on right)
    const lblFinish = scene.add.text(scannerX - scannerW / 2 + 2, 23, 'RANGER', {
      fontFamily: 'monospace',
      fontSize: '8px',
      color: '#22c55e'
    });
    const lblStart = scene.add.text(scannerX + scannerW / 2 - 24, 23, 'START', {
      fontFamily: 'monospace',
      fontSize: '8px',
      color: '#64748b'
    });
    this.container.add([lblFinish, lblStart]);

    // 4. Stamina Bar & Bear Distance (Right Top)
    // Bear Distance indicator
    this.bearDistText = scene.add.text(495, 6, 'BEAR: 25.0 M', {
      fontFamily: '"Courier New", Courier, monospace',
      fontSize: '11px',
      color: '#22c55e',
      fontStyle: 'bold'
    });
    this.container.add(this.bearDistText);

    // Stamina Label
    this.staminaLabel = scene.add.text(495, 20, 'STAMINA', {
      fontFamily: 'monospace',
      fontSize: '9px',
      color: '#94a3b8'
    });
    this.container.add(this.staminaLabel);

    // Stamina Bar
    this.staminaBarBg = scene.add.rectangle(575, 24, 110, 8, 0x0f172a);
    this.staminaBarBg.setStrokeStyle(1, 0x334155);
    this.staminaBarFill = scene.add.rectangle(520, 24, 108, 6, 0x22c55e);
    this.staminaBarFill.setOrigin(0, 0.5);
    this.container.add([this.staminaBarBg, this.staminaBarFill]);

    // 5. Danger Vignette (Full screen edge alert when bear < 14m)
    this.dangerVignette = scene.add.rectangle(320, 180, 640, 360, 0xef4444, 0.0);
    this.dangerVignette.setScrollFactor(0);
    this.dangerVignette.setDepth(90);
  }

  // ==========================================================================
  // UPDATE HUD STATS
  // ==========================================================================

  public update(stats: PlayerStats, bearWorldX: number, riderWorldX: number): void {
    // 1. Score Readout
    this.scoreText.setText(`SCORE: ${stats.score.toString().padStart(5, '0')}`);

    // 2. Speed Readout (px/s converted to virtual km/h)
    const virtualKmh = Math.round((stats.speed / GAME_CONFIG.RIDER.BASE_SPEED) * 24);
    this.speedText.setText(`SPD: ${virtualKmh} KM/H`);

    // 3. Stamina Bar Fill & Color Shift
    const staminaRatio = Math.max(0, Math.min(1.0, stats.stamina / stats.maxStamina));
    this.staminaBarFill.width = Math.floor(108 * staminaRatio);

    if (staminaRatio < 0.25) {
      this.staminaBarFill.setFillStyle(0xef4444); // Low: Red
      this.staminaLabel.setText('EXHAUSTION!');
      this.staminaLabel.setColor('#ef4444');
    } else if (staminaRatio < 0.55) {
      this.staminaBarFill.setFillStyle(0xeab308); // Moderate: Yellow
      this.staminaLabel.setText('STAMINA');
      this.staminaLabel.setColor('#eab308');
    } else {
      this.staminaBarFill.setFillStyle(0x22c55e); // Healthy: Green
      this.staminaLabel.setText('STAMINA');
      this.staminaLabel.setColor('#94a3b8');
    }

    // 4. Bear Distance Readout
    this.bearDistText.setText(`BEAR: ${stats.bearDistanceM.toFixed(1)} M`);
    if (stats.bearDistanceM <= GAME_CONFIG.BEAR.DANGER_DISTANCE_M) {
      this.bearDistText.setColor('#ef4444'); // Danger red
      // Pulsing red vignette
      const pulseAlpha = 0.15 + 0.12 * Math.sin(this.scene.time.now / 150);
      this.dangerVignette.setAlpha(pulseAlpha);
    } else if (stats.bearDistanceM <= 22.0) {
      this.bearDistText.setColor('#eab308'); // Warning yellow
      this.dangerVignette.setAlpha(0.0);
    } else {
      this.bearDistText.setColor('#22c55e'); // Safe green
      this.dangerVignette.setAlpha(0.0);
    }

    // 5. Defender-Style Radar Blips Update
    const totalCourseSpan = GAME_CONFIG.COURSE.START_X - GAME_CONFIG.COURSE.FINISH_X;
    const scannerX = 320;
    const scannerW = 280;
    const scannerTrackWidth = scannerW - 12;

    // Rider Blip
    const riderRatio = (GAME_CONFIG.COURSE.START_X - riderWorldX) / totalCourseSpan;
    const riderRadarX = (scannerX + scannerW / 2 - 6) - (riderRatio * scannerTrackWidth);
    this.scannerRiderDot.setPosition(
      Phaser.Math.Clamp(riderRadarX, scannerX - scannerW / 2 + 5, scannerX + scannerW / 2 - 5),
      13
    );

    // Bear Blip
    const bearRatio = (GAME_CONFIG.COURSE.START_X - bearWorldX) / totalCourseSpan;
    const bearRadarX = (scannerX + scannerW / 2 - 6) - (bearRatio * scannerTrackWidth);
    this.scannerBearDot.setPosition(
      Phaser.Math.Clamp(bearRadarX, scannerX - scannerW / 2 + 5, scannerX + scannerW / 2 - 5),
      13
    );
  }

  public destroy(): void {
    this.container.destroy();
    this.dangerVignette.destroy();
  }
}
