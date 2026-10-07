/**
 * Shared Type Definitions & Interfaces
 * Grizzly Run - 16-Bit Survival Cycling Game
 */

export enum GameState {
  TITLE = 'TITLE',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  GAMEOVER_CAUGHT = 'GAMEOVER_CAUGHT',
  GAMEOVER_GAP = 'GAMEOVER_GAP',
  VICTORY = 'VICTORY'
}

export enum ObstacleType {
  LOG = 'LOG',
  RAMP = 'RAMP',
  CREEK_GAP = 'CREEK_GAP',
  MUD_PATCH = 'MUD_PATCH'
}

export interface Obstacle {
  id: string;
  type: ObstacleType;
  x: number;               // Left edge in world X
  width: number;
  y: number;               // Surface elevation Y
  height?: number;
  gapWidth?: number;       // For creek gaps
  cleared?: boolean;       // One-time scoring guard
  bonusScore: number;
}

export interface TerrainSegment {
  startX: number;
  endX: number;
  startY: number;
  endY: number;
  isMud?: boolean;
  isGap?: boolean;
}

export interface PlayerStats {
  score: number;
  stamina: number;
  maxStamina: number;
  speed: number;           // Current speed in px/s (positive value)
  distanceMeters: number;  // Distance from start in meters
  progressRatio: number;   // 0.0 to 1.0 (to Ranger Station)
  bearDistanceM: number;   // Distance to bear in meters
  isGrounded: boolean;
  isAirborne: boolean;
  isSkidding: boolean;
  isSprinting: boolean;
  isBraking: boolean;
  jumpChargeRatio: number; // 0.0 to 1.0
  inMud: boolean;
}

export interface RunResults {
  won: boolean;
  reason: 'caught' | 'creek_fall' | 'escaped';
  score: number;
  distanceCoveredM: number;
  totalTimeSec: number;
  gapsCleared: number;
  bestScore: number;
}

export interface AudioSettings {
  masterMute: boolean;
  musicVolume: number;
  sfxVolume: number;
  reduceShake: boolean;
}
