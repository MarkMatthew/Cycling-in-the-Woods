# Grizzly Run 🐻🚴

> A complete 16-bit retro pixel-art mountain biking survival browser game built with TypeScript, Phaser 3, and Vite. Designed for crisp nearest-neighbor 640×360 arcade rendering, responsive mobile/desktop play, zero external dependencies, and seamless deployment on Vercel.

---

## 🌲 The Premise

A helmeted mountain biker in a red jacket and cyan bicycle races **LEFT** through a dark pine forest on an unforgiving muddy trail, pursued from the **RIGHT** by a simulated grizzly bear. The rider must manage speed, stamina, traction, and charged jumps across logs, kicker ramps, and deep creek gaps to reach the finish-line Ranger Station alive.

---

## 🎮 Controls

### Desktop Keyboard
| Key | Action | Description |
|---|---|---|
| **`W` / `↑`** | **Sprint** | Accelerate up to 430 px/s (drains stamina). |
| **`S` / `↓`** | **Brake** | Decelerate down to 110 px/s to maintain control in mud. |
| **`Space`** | **Jump / Charge** | Tap for bunny hop; hold up to 350ms for high leap (auto-launches at cap). |
| **`P` / `Esc`** | **Pause** | Open in-game menu (resume, restart, sound toggles). |
| **`M`** | **Mute** | Toggle master audio on/off. |
| **`R`** | **Restart** | Immediately restart a clean run after victory or defeat. |

### Mobile Touch
- **Sprint Button**: Green touch button (bottom-left) for sprinting.
- **Brake Button**: Red touch button (bottom-left) for braking.
- **Jump Button**: Large cyan touch button (bottom-right) for tap hop and hold-to-charge jumps.
- **Multi-Touch**: Full support for simultaneous sprinting and jumping.
- **Header Buttons**: Touch icons for Pause and Mute.

---

## 🕹️ Core Systems & Mechanics

### 1. 16-Bit Pixel Art Aesthetic
- **Playfield**: 640 × 360 logical resolution with crisp nearest-neighbor integer scaling (`pixelArt: true`).
- **Art Direction**: Approved 16-bit color palette with navy-black shadows, dark pine/teal parallax layers, brown mud, red jacket, cyan bike highlights, warm brown grizzly, and pixel crescent moon.
- **Defender-Style Trail Scanner**: Real-time top radar HUD displaying the cyclist, bear, upcoming logs, kickers, mud patches, and creek gaps.
- **Zero External Assets**: All sprites, terrain, scenery, particles, and obstacles are procedurally generated in code via the HTML5 Canvas API and registered into Phaser's TextureManager.

### 2. Bicycle Physics & Jump Mechanics
- **Deterministic Fixed Step**: Physics calculations run on a fixed step with clamped `dt` to prevent tunneling or framerate variance.
- **Jump Charging**: Tap for small bunny hops over logs; hold and release (up to 350ms) for high vertical impulse. Automatically launches at 350ms cap.
- **Coyote Time & Input Buffering**: 100ms coyote grace window upon leaving ledges; 120ms input buffer when landing.
- **Landing Dynamics**: Clean landings yield squash-and-stretch feedback; awkward landings in mud cost speed and cause skidding.
- **Dirt Kickers**: Specially angled kickers provide launch boosts (`+60 px/s` horizontal, `-110 px/s` vertical impulse).

### 3. Grizzly Bear Pursuit AI
- **True Pursuer Simulation**: Tracks continuous world coordinates behind the rider, starting with a 25-meter gap.
- **Dynamic Pacing & Surges**: Sprinting and clean riding pull away from the bear. Braking, bumping logs, or skidding lets the bear close in. If the gap widens past 32 meters, the bear surges to maintain tension.
- **Obstacle Leaping**: The bear leaps athletically over fallen logs and traverses creek gaps.
- **Proximity Warnings**: Pulsing red vignette overlay and guttural bear roars trigger when the pursuer is within 14 meters.

### 4. Original 1980s Pop-Rock Instrumental Soundtrack
- **Dual-Stem Web Audio Synthesis**: Full-band synthesized pop-rock at 132 BPM featuring gated reverb snares, punchy bass, palm-muted rhythm guitar chugs, synth brass leads, and an intense danger stem.
- **Hysteresis Danger Crossfade**: Danger stem activates when the bear closes to within 14 meters and releases only when the player creates an 18-meter lead.
- **Stings & Fanfares**: Dedicated title screen theme, victory fanfare, defeat sting, and retro SFX (pedal clicks, jump chirps, mud skids, water splashes, and bonus chimes).

---

## 🛠️ Project Structure

```
├── src/
│   ├── audio/
│   │   ├── SoundEffects.ts         # 16-bit retro procedural sound effects
│   │   └── SoundtrackEngine.ts     # Dual-stem 1980s pop-rock soundtrack engine
│   ├── entities/
│   │   ├── Bear.ts                 # Simulated grizzly pursuer entity & AI
│   │   └── Cyclist.ts              # Cyclist physics, jump charging & stamina
│   ├── graphics/
│   │   └── PixelArtGenerator.ts    # Procedural 16-bit sprites & textures
│   ├── level/
│   │   └── LevelData.ts            # Handcrafted 90-120s course layout & obstacles
│   ├── scenes/
│   │   ├── BootScene.ts            # Texture generation & animations
│   │   ├── TitleScene.ts           # 16-bit title screen & high scores
│   │   ├── GameScene.ts            # Main gameplay loop, camera & parallax
│   │   ├── PauseScene.ts           # Pause menu & audio/shake toggles
│   │   └── GameOverScene.ts        # Victory & non-graphic defeat recap
│   ├── ui/
│   │   ├── HUD.ts                  # Defender-style radar, stamina bar & score
│   │   └── TouchControls.ts        # Multi-touch mobile controls
│   ├── utils/
│   │   └── Storage.ts              # Safe LocalStorage persistence
│   ├── config.ts                   # Centralized game tuning constants
│   ├── main.ts                     # Phaser entry point & config
│   └── types.ts                    # TypeScript interfaces & enums
├── tests/
│   ├── chase.test.ts               # Pursuit calculations & hysteresis tests
│   ├── jump.test.ts                # Jump charging & coyote time tests
│   ├── level.test.ts               # Course bounds & creek gap tests
│   ├── scoring.test.ts             # Bonus scoring & persistence tests
│   └── stamina.test.ts             # Oxygen debt & exhaustion tests
├── index.html                      # Mount point & responsive metadata
├── style.css                       # Pixel-art nearest-neighbor styling
├── vercel.json                     # Vercel deployment configuration
├── tsconfig.json                   # Strict TypeScript compiler options
└── vite.config.ts                  # Vite build configuration
```

---

## 🚀 Development & Deployment

### Prerequisites
- Node.js (v18+)
- npm

### Installation
```bash
npm install
```

### Development Server
```bash
npm run dev
```

### Typecheck & Test
```bash
npm run typecheck
npm test
```

### Production Build
```bash
npm run build
npm run preview
```

### Deploying to Vercel
Push this repository to GitHub and import it into Vercel. With `vercel.json` and the standard Vite build configuration, it deploys automatically with zero configuration.
