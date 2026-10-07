/**
 * Handcrafted 90-120s Forest Trail Course Data
 * Grizzly Run - Level Design & Obstacle Placement
 * 
 * Coordinate System:
 * - World X: Starts at X = 25,000, runs LEFT to X = 450 (Ranger Station Finish).
 * - Ground Y: Default trail surface at Y = 270.
 * - Speeds: ~230 px/s base, ~430 px/s sprint -> ~98s duration at ~250 px/s.
 */

import { Obstacle, ObstacleType, TerrainSegment } from '../types';
import { GAME_CONFIG } from '../config';

export class LevelData {
  /**
   * Complete obstacle list placed sequentially from right (start) to left (finish).
   */
  public static getObstacles(): Obstacle[] {
    return [
      // ----------------------------------------------------------------------
      // SECTION 1: Safe Warm-up & Tutorial (X = 25,000 -> 22,500)
      // Teach sprint, coasting, and simple bunny-hop over roots/small logs.
      // ----------------------------------------------------------------------
      {
        id: 'log_intro_1',
        type: ObstacleType.LOG,
        x: 23800,
        y: GAME_CONFIG.COURSE.GROUND_Y - 14,
        width: 28,
        height: 14,
        bonusScore: GAME_CONFIG.SCORING.LOG_CLEAR_BONUS
      },
      {
        id: 'mud_intro_1',
        type: ObstacleType.MUD_PATCH,
        x: 22800,
        y: GAME_CONFIG.COURSE.GROUND_Y - 4,
        width: 120,
        height: 12,
        bonusScore: 0
      },

      // ----------------------------------------------------------------------
      // SECTION 2: Introductory Mud & Log Combos (X = 22,500 -> 18,500)
      // Mud patches followed by logs to test traction management.
      // ----------------------------------------------------------------------
      {
        id: 'log_seq_1',
        type: ObstacleType.LOG,
        x: 21600,
        y: GAME_CONFIG.COURSE.GROUND_Y - 14,
        width: 28,
        height: 14,
        bonusScore: GAME_CONFIG.SCORING.LOG_CLEAR_BONUS
      },
      {
        id: 'mud_seq_2',
        type: ObstacleType.MUD_PATCH,
        x: 20700,
        y: GAME_CONFIG.COURSE.GROUND_Y - 4,
        width: 140,
        height: 12,
        bonusScore: 0
      },
      {
        id: 'log_seq_2',
        type: ObstacleType.LOG,
        x: 19800,
        y: GAME_CONFIG.COURSE.GROUND_Y - 14,
        width: 28,
        height: 14,
        bonusScore: GAME_CONFIG.SCORING.LOG_CLEAR_BONUS
      },
      {
        id: 'kicker_demo_1',
        type: ObstacleType.RAMP,
        x: 18900,
        y: GAME_CONFIG.COURSE.GROUND_Y - 20,
        width: 40,
        height: 20,
        bonusScore: GAME_CONFIG.SCORING.RAMP_LAUNCH_BONUS
      },
      {
        id: 'mud_after_kicker',
        type: ObstacleType.MUD_PATCH,
        x: 18780,
        y: GAME_CONFIG.COURSE.GROUND_Y - 4,
        width: 110,
        height: 12,
        bonusScore: 0
      },

      // ----------------------------------------------------------------------
      // SECTION 3: Technical Rhythm & Approach to Creek 1 (X = 18,500 -> 14,800)
      // Consecutive logs and mud requiring rhythmic jumping and speed prep.
      // ----------------------------------------------------------------------
      {
        id: 'log_rhythm_1',
        type: ObstacleType.LOG,
        x: 17600,
        y: GAME_CONFIG.COURSE.GROUND_Y - 14,
        width: 28,
        height: 14,
        bonusScore: GAME_CONFIG.SCORING.LOG_CLEAR_BONUS
      },
      {
        id: 'log_rhythm_2',
        type: ObstacleType.LOG,
        x: 16900,
        y: GAME_CONFIG.COURSE.GROUND_Y - 14,
        width: 28,
        height: 14,
        bonusScore: GAME_CONFIG.SCORING.LOG_CLEAR_BONUS
      },
      {
        id: 'mud_heavy_1',
        type: ObstacleType.MUD_PATCH,
        x: 15900,
        y: GAME_CONFIG.COURSE.GROUND_Y - 4,
        width: 160,
        height: 12,
        bonusScore: 0
      },
      {
        id: 'log_mud_exit',
        type: ObstacleType.LOG,
        x: 15300,
        y: GAME_CONFIG.COURSE.GROUND_Y - 14,
        width: 28,
        height: 14,
        bonusScore: GAME_CONFIG.SCORING.LOG_CLEAR_BONUS
      },

      // ----------------------------------------------------------------------
      // SECTION 4: CREEK GAP #1 - Pine Creek Crossing (X = 14,600 -> 14,100)
      // Approach kicker at X = 14,500 launch over water gap (X = 14,460 -> 14,120)
      // ----------------------------------------------------------------------
      {
        id: 'kicker_creek_1',
        type: ObstacleType.RAMP,
        x: 14500,
        y: GAME_CONFIG.COURSE.GROUND_Y - 22,
        width: 44,
        height: 22,
        bonusScore: GAME_CONFIG.SCORING.RAMP_LAUNCH_BONUS
      },
      {
        id: 'gap_creek_1',
        type: ObstacleType.CREEK_GAP,
        x: 14460, // Right edge / takeoff lip
        y: GAME_CONFIG.COURSE.CREEK_DEPTH_Y,
        width: 340, // 340px gap across to X = 14,120
        gapWidth: 340,
        height: 70,
        bonusScore: GAME_CONFIG.SCORING.CREEK_CLEAR_BONUS
      },

      // ----------------------------------------------------------------------
      // SECTION 5: Rolling Mud Valley (X = 14,000 -> 9,000)
      // Post-gap sprint, deep mud beds, staggered logs, and kickers.
      // ----------------------------------------------------------------------
      {
        id: 'mud_post_creek',
        type: ObstacleType.MUD_PATCH,
        x: 13500,
        y: GAME_CONFIG.COURSE.GROUND_Y - 4,
        width: 180,
        height: 12,
        bonusScore: 0
      },
      {
        id: 'log_valley_1',
        type: ObstacleType.LOG,
        x: 12600,
        y: GAME_CONFIG.COURSE.GROUND_Y - 14,
        width: 28,
        height: 14,
        bonusScore: GAME_CONFIG.SCORING.LOG_CLEAR_BONUS
      },
      {
        id: 'kicker_valley_1',
        type: ObstacleType.RAMP,
        x: 11800,
        y: GAME_CONFIG.COURSE.GROUND_Y - 22,
        width: 44,
        height: 22,
        bonusScore: GAME_CONFIG.SCORING.RAMP_LAUNCH_BONUS
      },
      {
        id: 'mud_valley_pit',
        type: ObstacleType.MUD_PATCH,
        x: 11680,
        y: GAME_CONFIG.COURSE.GROUND_Y - 4,
        width: 150,
        height: 12,
        bonusScore: 0
      },
      {
        id: 'log_double_1',
        type: ObstacleType.LOG,
        x: 10700,
        y: GAME_CONFIG.COURSE.GROUND_Y - 14,
        width: 28,
        height: 14,
        bonusScore: GAME_CONFIG.SCORING.LOG_CLEAR_BONUS
      },
      {
        id: 'log_double_2',
        type: ObstacleType.LOG,
        x: 10100,
        y: GAME_CONFIG.COURSE.GROUND_Y - 14,
        width: 28,
        height: 14,
        bonusScore: GAME_CONFIG.SCORING.LOG_CLEAR_BONUS
      },
      {
        id: 'mud_valley_2',
        type: ObstacleType.MUD_PATCH,
        x: 9300,
        y: GAME_CONFIG.COURSE.GROUND_Y - 4,
        width: 140,
        height: 12,
        bonusScore: 0
      },

      // ----------------------------------------------------------------------
      // SECTION 6: CREEK GAP #2 - Blackwood Gorge (X = 8,600 -> 8,000)
      // Demanding wide creek gap! Requires solid sprint speed & kicker launch.
      // Kicker at X = 8,440; Gap from X = 8,400 to 8,020 (380px wide).
      // ----------------------------------------------------------------------
      {
        id: 'kicker_creek_2',
        type: ObstacleType.RAMP,
        x: 8440,
        y: GAME_CONFIG.COURSE.GROUND_Y - 24,
        width: 44,
        height: 24,
        bonusScore: GAME_CONFIG.SCORING.RAMP_LAUNCH_BONUS
      },
      {
        id: 'gap_creek_2',
        type: ObstacleType.CREEK_GAP,
        x: 8400,
        y: GAME_CONFIG.COURSE.CREEK_DEPTH_Y,
        width: 380,
        gapWidth: 380,
        height: 70,
        bonusScore: GAME_CONFIG.SCORING.CREEK_CLEAR_BONUS
      },

      // ----------------------------------------------------------------------
      // SECTION 7: Demanding Final Gauntlet (X = 7,900 -> 1,800)
      // Rapid series of mud patches, kickers, and logs with pursuer close behind.
      // ----------------------------------------------------------------------
      {
        id: 'mud_final_1',
        type: ObstacleType.MUD_PATCH,
        x: 7300,
        y: GAME_CONFIG.COURSE.GROUND_Y - 4,
        width: 150,
        height: 12,
        bonusScore: 0
      },
      {
        id: 'log_final_1',
        type: ObstacleType.LOG,
        x: 6500,
        y: GAME_CONFIG.COURSE.GROUND_Y - 14,
        width: 28,
        height: 14,
        bonusScore: GAME_CONFIG.SCORING.LOG_CLEAR_BONUS
      },
      {
        id: 'kicker_final_1',
        type: ObstacleType.RAMP,
        x: 5700,
        y: GAME_CONFIG.COURSE.GROUND_Y - 22,
        width: 44,
        height: 22,
        bonusScore: GAME_CONFIG.SCORING.RAMP_LAUNCH_BONUS
      },
      {
        id: 'mud_final_deep',
        type: ObstacleType.MUD_PATCH,
        x: 4800,
        y: GAME_CONFIG.COURSE.GROUND_Y - 4,
        width: 180,
        height: 12,
        bonusScore: 0
      },
      {
        id: 'log_final_2',
        type: ObstacleType.LOG,
        x: 3900,
        y: GAME_CONFIG.COURSE.GROUND_Y - 14,
        width: 28,
        height: 14,
        bonusScore: GAME_CONFIG.SCORING.LOG_CLEAR_BONUS
      },
      {
        id: 'kicker_final_2',
        type: ObstacleType.RAMP,
        x: 2900,
        y: GAME_CONFIG.COURSE.GROUND_Y - 22,
        width: 44,
        height: 22,
        bonusScore: GAME_CONFIG.SCORING.RAMP_LAUNCH_BONUS
      },
      {
        id: 'mud_final_last',
        type: ObstacleType.MUD_PATCH,
        x: 2200,
        y: GAME_CONFIG.COURSE.GROUND_Y - 4,
        width: 130,
        height: 12,
        bonusScore: 0
      },
      {
        id: 'log_final_gate',
        type: ObstacleType.LOG,
        x: 1600,
        y: GAME_CONFIG.COURSE.GROUND_Y - 14,
        width: 28,
        height: 14,
        bonusScore: GAME_CONFIG.SCORING.LOG_CLEAR_BONUS
      }

      // ----------------------------------------------------------------------
      // SECTION 8: Home Stretch to Ranger Station (X = 1,500 -> 450)
      // Clear firm dirt trail. Reaching X <= 450 triggers victory!
      // ----------------------------------------------------------------------
    ];
  }

  /**
   * Terrain ground segments (solid trail vs creek gaps).
   * Note: Rider moves from higher X to lower X.
   */
  public static getTerrainSegments(): TerrainSegment[] {
    const gy = GAME_CONFIG.COURSE.GROUND_Y;
    return [
      // 1. Trail from Start (25000) to Creek Gap 1 (14460)
      { startX: 25500, endX: 14460, startY: gy, endY: gy },
      // Creek 1 Gap (14460 to 14120) is water gap!
      { startX: 14460, endX: 14120, startY: GAME_CONFIG.COURSE.CREEK_DEPTH_Y, endY: GAME_CONFIG.COURSE.CREEK_DEPTH_Y, isGap: true },
      // 2. Trail between Creek 1 and Creek 2 (14120 to 8400)
      { startX: 14120, endX: 8400, startY: gy, endY: gy },
      // Creek 2 Gap (8400 to 8020) is water gap!
      { startX: 8400, endX: 8020, startY: GAME_CONFIG.COURSE.CREEK_DEPTH_Y, endY: GAME_CONFIG.COURSE.CREEK_DEPTH_Y, isGap: true },
      // 3. Final trail through Ranger Station (8020 to 0)
      { startX: 8020, endX: 0, startY: gy, endY: gy }
    ];
  }

  /**
   * Check whether a given world coordinate X is inside any creek gap.
   */
  public static isWorldXInCreek(worldX: number): boolean {
    const segments = this.getTerrainSegments();
    for (const seg of segments) {
      if (seg.isGap) {
        // Since segments go right to left: startX > endX
        const minX = Math.min(seg.startX, seg.endX);
        const maxX = Math.max(seg.startX, seg.endX);
        if (worldX >= minX && worldX <= maxX) {
          return true;
        }
      }
    }
    return false;
  }
}
