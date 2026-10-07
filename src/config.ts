/**
 * Centralized Game Configuration & Tuning Parameters
 * Grizzly Run - 16-Bit Survival Cycling Game
 */

export const GAME_CONFIG = {
  // Logical Playfield (16:9 640x360 nearest-neighbor pixel art)
  WIDTH: 640,
  HEIGHT: 360,

  // Course Coordinate System:
  // Cyclist races LEFT (from high X down to low X = 0 where Ranger Station is).
  // Bear pursues from the RIGHT (higher X).
  COURSE: {
    START_X: 25000,           // World X where rider begins
    FINISH_X: 450,            // World X of Ranger Station
    BEAR_START_OFFSET: 600,   // ~25 meters behind rider (to the right, +600 px)
    PIXELS_PER_METER: 24.0,   // 24 px = 1 meter
    GROUND_Y: 270,            // Base trail elevation
    CREEK_DEPTH_Y: 340        // Creek water elevation
  },

  // Rider Physics & Tuning
  RIDER: {
    WIDTH: 32,
    HEIGHT: 28,
    BASE_SPEED: 230,          // Base automatic rolling speed (px/s leftward)
    SPRINT_SPEED: 430,        // Max sprint speed (px/s)
    BRAKE_SPEED: 110,         // Min braking speed (px/s)
    ACCELERATION: 420,        // Acceleration towards target speed (px/s²)
    DECELERATION: 380,        // Deceleration when releasing sprint (px/s²)
    BRAKE_RATE: 550,          // Active braking deceleration (px/s²)
    GRAVITY: 920,             // Vertical gravity (px/s²)
    
    // Jump mechanics
    HOP_VELOCITY: -270,       // Quick tap bunny hop vertical impulse
    MAX_JUMP_VELOCITY: -450,  // Full 350ms charged jump vertical impulse
    MAX_CHARGE_MS: 350,       // Max jump hold charge duration
    KICKER_BOOST_VY: -110,    // Extra vertical impulse from dirt kickers
    KICKER_BOOST_VX: 60,      // Extra horizontal speed boost from kickers
    COYOTE_TIME_MS: 100,      // Coyote grace window after leaving ground
    INPUT_BUFFER_MS: 120,     // Jump input buffering window
    
    // Stamina ("Oxygen Debt")
    MAX_STAMINA: 100,
    SPRINT_DRAIN_RATE: 24,    // Stamina drained per second while sprinting (%/s)
    COAST_RECOVERY_RATE: 16,  // Stamina recovered per second while cruising (%/s)
    EXHAUSTION_PENALTY_MS: 2000, // Cooldown if stamina hits 0%

    // Traction & Mud
    MUD_SPEED_MULT: 0.65,     // Speed multiplier in mud
    MUD_TRACTION_COST: 1.8,   // Extra stamina cost when sprinting in mud
    SKID_SPEED_PENALTY: 0.55, // Speed factor during skid
    SKID_DURATION_MS: 500     // Duration of skid loss of control
  },

  // Grizzly Bear Chase Tuning
  BEAR: {
    WIDTH: 48,
    HEIGHT: 32,
    BASE_SPEED_OFFSET: 15,    // Base speed bonus when far away
    LEAP_VELOCITY: -380,      // Vertical leap over obstacles
    CATCH_DISTANCE_M: 0.6,    // Catch radius (meters)
    DANGER_DISTANCE_M: 14.0,  // Threshold for music danger stem (meters)
    DANGER_HYSTERESIS_M: 18.0,// Threshold to exit danger music stem
    SURGE_DISTANCE_M: 32.0,   // Distance at which bear surges to close gap
    SURGE_SPEED_MULT: 1.18    // Speed multiplier during surge
  },

  // Scoring
  SCORING: {
    DISTANCE_FACTOR: 1.0,     // 1 point per 2 meters traveled
    LOG_CLEAR_BONUS: 150,     // Hop over log bonus
    RAMP_LAUNCH_BONUS: 200,   // Jump off ramp bonus
    CREEK_CLEAR_BONUS: 500,   // Clear creek gap bonus
    VICTORY_BONUS: 3000       // Reaching Ranger Station alive
  },

  // Audio Tuning
  AUDIO: {
    BPM: 132,
    MASTER_VOLUME: 0.85,
    MUSIC_VOLUME: 0.65,
    SFX_VOLUME: 0.75
  }
};
