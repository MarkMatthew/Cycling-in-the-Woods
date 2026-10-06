# Cycling in the Woods (Apex Trail)

> A high-tension, first-person survival cycling web game built with vanilla JavaScript, HTML5 Canvas, and modern CSS. Zero dependencies, 60 FPS, ready for deployment on Vercel or GitHub Pages.

---

## 🌲 The Story
You are descending an isolated, muddy logging road deep in grizzly country when an apex predator catches your trail. Stalking 80 meters behind you, the bear matches your pace—waiting for you to crack. Manage your pedaling cadence, shift through discrete gears to overcome thick mud patches, and monitor your oxygen debt. If you redline your physical capacity, the grizzly will enter an aggressive frenzy surge.

Reach the highway 2.0 km ahead before you are mauled.

---

## 🎮 Controls

| Key | Action | Details |
|---|---|---|
| **`W`** or **`Space`** | **Pedal** | Tap rhythmically to build and maintain cadence (RPM). |
| **`↑` / `E`** | **Shift Up** | Shift to a higher gear (Gear 1 $\to$ 2 $\to$ 3). |
| **`↓` / `Q`** | **Shift Down** | Shift to a lower gear (Gear 3 $\to$ 2 $\to$ 1). |
| **Mouse / Touch** | **Pedal Tap** | Click or tap anywhere on the canvas to pedal. |

---

## ⚙️ Core Mechanics & Architecture

### 1. Oxygen Debt & Physical Redline Model
- **Discrete Gear Ratios**:
  - **Gear 1 (`0.5x`)**: High torque for thick mud. Lower top speed, minimal fatigue.
  - **Gear 2 (`1.0x`)**: Balanced cruising gear for packed dirt.
  - **Gear 3 (`2.0x`)**: High-speed sprint gear on flat terrain (~45 km/h). Severe stamina cost in mud.
- **Mud Resistance**: Rises from $1.0$ (packed trail) to $3.0$ (deep mud).
- **Effort Load Formula**:
  $$\text{Effort Load} = \text{Gear Ratio} \times \text{Mud Resistance}$$
- **The Redline Penalty**:
  - If $\text{Effort Load} > 4.0$ continuously for **3.0 seconds**, you enter **Redline** status.
  - While redlining, maximum stamina capacity degrades by **5% per second** (lactic lockout).
  - You must downshift (to Gear 1 or 2) or clear the mud patch to lower Effort Load below $4.0$ to recover.

### 2. Grizzly Bear Behavior Tree AI
The predator is governed by a priority-based Behavior Tree:
1. **Catch Player Sequence**: Triggers instant game over maul if distance $\le 0\text{ m}$.
2. **Frenzy Rush Sequence**: Triggered when the player enters Redline status. Bear surges to **$\text{Max Speed} \times 1.3$** ($58.5\text{ km/h}$) for **$4.0\text{ seconds}$**.
3. **Fatigue Recovery Sequence**: If the player survives Frenzy without being caught, the bear drops to **$50\%$ speed** for **$5.0\text{ seconds}$** to recover.
4. **Default Stalking Action**: Matches player speed at $95\%$ with a minimum creeping speed of $15\text{ km/h}$.

### 3. Procedural Web Audio Engine
100% self-contained in-memory synthesis via Web Audio API—no external `.mp3` or `.wav` assets:
- **Trip-Hop Drum Stem (~90 BPM)**: Deep sub-bass 808, chunky kicks, vinyl surface crackle, and shakers.
- **Cadence Linking**: Trip-Hop `playbackRate` scales dynamically with cadence ($0\text{--}120\text{ RPM}$) between $0.5\times$ and $1.5\times$.
- **Frenzy Crossfade**: On Redline, Trip-Hop fades out and a frantic **Drum-and-Bass Breakbeat (~174 BPM)** fades in over $0.3\text{s}$, accompanied by a sweeping resonant lowpass filter simulating adrenaline tunnel vision.
- **Procedural SFX**: Dual-ratchet gear shift clicks, low-stamina heartbeat/panting ($<30\%$), mud squelch, and predator roar.

### 4. Pseudo-3D Outrun Canvas Engine
- Segment scanline road projection with curves, rolling hills, and depth fog.
- Scaling brown rectangles representing mud patches approaching in 3D perspective.
- First-person cockpit with textured grips, brake levers, and cadence-linked handlebar sway and dip.
- Proximity warning pulsing red vignette and real-time distance telemetry when the predator is $<50\text{ m}$.

---

## 🚀 Deployment

### Zero-Dependency Local Play
Open `index.html` in any modern web browser:
```bash
# Optional local HTTP server (or open directly)
npx serve .
# Or Python
python3 -m http.server 8000
```

### Vercel Deployment
Deploy instantly with zero build step:
```bash
npx vercel
```
Or import this repository directly into your [Vercel Dashboard](https://vercel.com).

---

## 📁 Repository Structure
```
├── index.html       # HTML5 game viewport, DOM HUD, proximity vignette, modals
├── style.css        # Responsive styling, glassmorphism HUD, pulse animations
├── game.js          # Consolidated engine: Audio, Physics, AI, Renderer, HUD
└── README.md        # Documentation and game manual
```
