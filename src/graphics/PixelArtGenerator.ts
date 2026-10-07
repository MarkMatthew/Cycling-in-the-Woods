/**
 * Procedural 16-Bit Pixel Art Texture Generator
 * Generates all sprites, scenery, tiles, obstacles, and effects in code.
 * Grizzly Run - Zero external image dependencies.
 */

import Phaser from 'phaser';

export class PixelArtGenerator {
  /**
   * Helper to create an in-memory canvas of width x height.
   */
  private static createCanvas(width: number, height: number): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.imageSmoothingEnabled = false;
    }
    return canvas;
  }

  /**
   * Main entry point: Generates all game textures into Phaser's TextureManager.
   */
  public static generateAllTextures(scene: Phaser.Scene): void {
    const textures = scene.textures;

    // 1. Cyclist Frames (facing LEFT, 32x28)
    this.generateCyclistFrames(textures);

    // 2. Grizzly Bear Frames (facing LEFT, 48x32)
    this.generateBearFrames(textures);

    // 3. Parallax Backgrounds
    this.generateBackgrounds(textures);

    // 4. Ground & Terrain Elements
    this.generateTerrain(textures);

    // 5. Obstacles (Log, Kicker, Creek Water, Mud)
    this.generateObstacles(textures);

    // 6. Finish Line Ranger Station (120x80)
    this.generateRangerStation(textures);

    // 7. Particle & Effect Textures
    this.generateEffects(textures);
  }

  // ==========================================================================
  // 1. CYCLIST SPRITES (Faces LEFT, racing toward X=0)
  // 32 wide x 28 high
  // ==========================================================================
  private static generateCyclistFrames(textures: Phaser.Textures.TextureManager): void {
    // 6 pedaling frames
    for (let f = 0; f < 6; f++) {
      const key = `cyclist_pedal_${f}`;
      if (!textures.exists(key)) {
        const canvas = this.createCanvas(32, 28);
        const ctx = canvas.getContext('2d')!;
        this.drawCyclist(ctx, f, 'pedal');
        textures.addCanvas(key, canvas);
      }
    }

    // Jump (tucked in air)
    if (!textures.exists('cyclist_jump')) {
      const canvas = this.createCanvas(32, 28);
      const ctx = canvas.getContext('2d')!;
      this.drawCyclist(ctx, 0, 'jump');
      textures.addCanvas('cyclist_jump', canvas);
    }

    // Land (crouched compression)
    if (!textures.exists('cyclist_land')) {
      const canvas = this.createCanvas(32, 28);
      const ctx = canvas.getContext('2d')!;
      this.drawCyclist(ctx, 0, 'land');
      textures.addCanvas('cyclist_land', canvas);
    }

    // Skid (counter-steering slide)
    if (!textures.exists('cyclist_skid')) {
      const canvas = this.createCanvas(32, 28);
      const ctx = canvas.getContext('2d')!;
      this.drawCyclist(ctx, 0, 'skid');
      textures.addCanvas('cyclist_skid', canvas);
    }

    // Crash / fall
    if (!textures.exists('cyclist_crash')) {
      const canvas = this.createCanvas(32, 28);
      const ctx = canvas.getContext('2d')!;
      this.drawCyclist(ctx, 0, 'crash');
      textures.addCanvas('cyclist_crash', canvas);
    }
  }

  /**
   * Pixel drawer for mountain biker facing LEFT.
   * Frame Width = 32, Height = 28.
   * Front wheel is on the LEFT (x ~ 6), Rear wheel is on the RIGHT (x ~ 26).
   */
  private static drawCyclist(
    ctx: CanvasRenderingContext2D,
    frame: number,
    pose: 'pedal' | 'jump' | 'land' | 'skid' | 'crash'
  ): void {
    ctx.clearRect(0, 0, 32, 28);

    // Color Palette
    const cRed = '#ef4444';       // Jacket bright red
    const cDarkRed = '#991b1b';   // Jacket shadow
    const cHelmet = '#f8fafc';    // White helmet
    const cVisor = '#0284c7';     // Cyan visor
    const cSkin = '#fbcfe8';      // Face / hands
    const cCyan = '#06b6d4';      // Cyan bike frame
    const cDarkCyan = '#0e7490';  // Dark bike frame
    const cTire = '#1e293b';      // Tires
    const cRim = '#94a3b8';       // Wheel rim
    const cSpoke = '#cbd5e1';     // Spokes
    const cPants = '#334155';     // Dark grey riding shorts

    // Helpers
    const px = (x: number, y: number, color: string) => {
      ctx.fillStyle = color;
      ctx.fillRect(Math.floor(x), Math.floor(y), 1, 1);
    };
    const rect = (x: number, y: number, w: number, h: number, color: string) => {
      ctx.fillStyle = color;
      ctx.fillRect(Math.floor(x), Math.floor(y), w, h);
    };

    if (pose === 'crash') {
      // Bike on side, rider thrown
      rect(4, 23, 24, 3, cCyan);
      rect(6, 21, 6, 6, cTire);
      rect(20, 22, 6, 5, cTire);
      rect(14, 18, 6, 4, cDarkRed);
      rect(18, 16, 4, 4, cHelmet);
      return;
    }

    // Wheel animation rotation angle
    const wheelPhase = (frame * Math.PI) / 3;

    // Y offsets for poses
    let riderYOff = 0;
    let bikeAngle = 0;

    if (pose === 'land') {
      riderYOff = 2; // squatted
    } else if (pose === 'jump') {
      riderYOff = -1; // tucked
      bikeAngle = -0.08;
    } else if (pose === 'skid') {
      riderYOff = 1;
    }

    ctx.save();
    if (bikeAngle !== 0) {
      ctx.translate(16, 20);
      ctx.rotate(bikeAngle);
      ctx.translate(-16, -20);
    }

    // 1. WHEELS (Left: Front wheel center x=7, y=21; Right: Rear wheel center x=25, y=21)
    const drawWheel = (cx: number, cy: number) => {
      // 9x9 circular pixel wheel
      rect(cx - 3, cy - 4, 7, 9, cTire);
      rect(cx - 4, cy - 3, 9, 7, cTire);
      // Rim
      rect(cx - 2, cy - 2, 5, 5, cRim);
      // Hub
      px(cx, cy, cSpoke);
      // Spinning spokes representation
      const sx = Math.round(Math.cos(wheelPhase) * 2);
      const sy = Math.round(Math.sin(wheelPhase) * 2);
      px(cx + sx, cy + sy, cSpoke);
      px(cx - sx, cy - sy, cSpoke);
    };

    drawWheel(7, 21);  // Front wheel (left)
    drawWheel(25, 21); // Rear wheel (right)

    // 2. BIKE FRAME (Cyan)
    // Bottom bracket (crank) at (17, 21)
    // Front fork from (7, 21) to (11, 14)
    ctx.strokeStyle = cCyan;
    ctx.lineWidth = 1;
    ctx.beginPath();
    // Fork
    ctx.moveTo(7, 21);
    ctx.lineTo(11, 14);
    // Down tube
    ctx.lineTo(17, 21);
    // Chain stay
    ctx.lineTo(25, 21);
    // Seat stay
    ctx.lineTo(19, 14);
    // Seat tube
    ctx.lineTo(17, 21);
    // Top tube
    ctx.moveTo(11, 14);
    ctx.lineTo(19, 14);
    ctx.stroke();

    // Handlebars at (10, 13)
    rect(9, 12, 3, 2, cDarkCyan);
    px(9, 12, '#64748b'); // Grip

    // Saddle at (18, 13)
    rect(17, 13, 5, 2, '#0f172a');

    // 3. PEDALS & CRANK (Animated with frame)
    const crankAngle = ((frame % 6) / 6) * Math.PI * 2;
    const pedalX = Math.round(17 + Math.cos(crankAngle) * 3);
    const pedalY = Math.round(21 + Math.sin(crankAngle) * 3);
    px(17, 21, '#64748b'); // Crank axis
    ctx.strokeStyle = '#94a3b8';
    ctx.beginPath();
    ctx.moveTo(17, 21);
    ctx.lineTo(pedalX, pedalY);
    ctx.stroke();
    px(pedalX, pedalY, '#475569'); // Pedal

    // 4. RIDER (Red jacket, helmet, shorts)
    const ry = riderYOff;

    // Torso / Red Jacket (leaning forward over handlebars)
    rect(13, 10 + ry, 6, 5, cRed);
    rect(14, 11 + ry, 5, 4, cDarkRed); // shadow

    // Arm reaching to handlebars (10, 13)
    ctx.strokeStyle = cRed;
    ctx.beginPath();
    ctx.moveTo(14, 11 + ry);
    ctx.lineTo(10, 13);
    ctx.stroke();
    px(10, 13, cSkin); // Glove

    // Shorts / Hips
    rect(17, 12 + ry, 4, 3, cPants);

    // Legs pedaling to pedal position
    ctx.strokeStyle = cPants;
    ctx.beginPath();
    ctx.moveTo(18, 14 + ry);
    const kneeX = 15;
    const kneeY = 17 + Math.round(Math.sin(crankAngle) * 2);
    ctx.lineTo(kneeX, kneeY);
    ctx.lineTo(pedalX, pedalY);
    ctx.stroke();
    px(pedalX, pedalY + 1, '#1e293b'); // Cycling shoe

    // Head & Helmet (x ~ 11..16, y ~ 4..9 + ry)
    rect(11, 6 + ry, 5, 4, cSkin);       // Face
    rect(10, 4 + ry, 6, 4, cHelmet);     // Helmet dome
    rect(9, 7 + ry, 3, 2, cVisor);       // Cyan visor facing LEFT
    px(13, 8 + ry, '#0f172a');           // Eye / strap

    // Skid dust hint under rear wheel if skidding
    if (pose === 'skid') {
      rect(26, 24, 5, 2, '#78350f');
    }

    ctx.restore();
  }

  // ==========================================================================
  // 2. GRIZZLY BEAR SPRITES (Faces LEFT, pursues from RIGHT)
  // 48 wide x 32 high
  // ==========================================================================
  private static generateBearFrames(textures: Phaser.Textures.TextureManager): void {
    // 6 running gallop frames
    for (let f = 0; f < 6; f++) {
      const key = `bear_run_${f}`;
      if (!textures.exists(key)) {
        const canvas = this.createCanvas(48, 32);
        const ctx = canvas.getContext('2d')!;
        this.drawBear(ctx, f, 'run');
        textures.addCanvas(key, canvas);
      }
    }

    // Bear Leap (clearing gap/log)
    if (!textures.exists('bear_leap')) {
      const canvas = this.createCanvas(48, 32);
      const ctx = canvas.getContext('2d')!;
      this.drawBear(ctx, 0, 'leap');
      textures.addCanvas('bear_leap', canvas);
    }
  }

  private static drawBear(
    ctx: CanvasRenderingContext2D,
    frame: number,
    pose: 'run' | 'leap'
  ): void {
    ctx.clearRect(0, 0, 48, 32);

    // Warm Brown Grizzly Palette
    const cFur = '#78350f';        // Main warm brown fur
    const cHighlight = '#92400e';  // Shoulder/back highlight
    const cDarkFur = '#451a03';    // Deep underbelly shadow
    const cSnout = '#b45309';      // Lighter muzzle
    const cNose = '#1c1917';       // Black nose & claws
    const cEye = '#ef4444';        // Fierce red-tinted eye
    const cTeeth = '#fef08a';      // Snarl teeth

    const rect = (x: number, y: number, w: number, h: number, color: string) => {
      ctx.fillStyle = color;
      ctx.fillRect(Math.floor(x), Math.floor(y), w, h);
    };

    // Gallop cycle paw motion offsets
    // Front paw (left, x ~ 10), Rear paw (right, x ~ 36)
    let frontPawX = 10;
    let frontPawY = 24;
    let backPawX = 36;
    let backPawY = 24;
    let bodyBob = 0;

    if (pose === 'leap') {
      frontPawX = 6;
      frontPawY = 18;
      backPawX = 42;
      backPawY = 26;
      bodyBob = -3;
    } else {
      // 6-step gallop
      const phases = [
        { fpx: 12, fpy: 26, bpx: 38, bpy: 22, bob: 0 },
        { fpx: 8,  fpy: 24, bpx: 40, bpy: 25, bob: -2 },
        { fpx: 6,  fpy: 20, bpx: 36, bpy: 26, bob: -3 },
        { fpx: 9,  fpy: 22, bpx: 32, bpy: 25, bob: -1 },
        { fpx: 14, fpy: 26, bpx: 30, bpy: 22, bob: 1 },
        { fpx: 16, fpy: 25, bpx: 34, bpy: 20, bob: 2 }
      ];
      const p = phases[frame % 6];
      frontPawX = p.fpx;
      frontPawY = p.fpy;
      backPawX = p.bpx;
      backPawY = p.bpy;
      bodyBob = p.bob;
    }

    const by = bodyBob;

    // 1. MASSIVE POWERFUL BODY & HUMP (x: 16 to 40, y: 10 to 22)
    // Distinctive Grizzly shoulder muscle hump
    rect(18, 9 + by, 12, 6, cHighlight);
    rect(16, 12 + by, 22, 10, cFur);
    rect(18, 19 + by, 18, 4, cDarkFur); // Underbelly shadow

    // Haunches
    rect(32, 11 + by, 10, 11, cFur);

    // 2. BEAR HEAD & SNOUT (Facing LEFT, x: 6 to 18, y: 8 to 18)
    rect(10, 10 + by, 10, 8, cFur);
    // Ears
    rect(17, 7 + by, 3, 3, cFur);
    rect(18, 8 + by, 1, 1, cDarkFur);

    // Snout / Muzzle
    rect(5, 13 + by, 6, 5, cSnout);
    rect(4, 13 + by, 2, 2, cNose); // Black nose tip

    // Red intense eye
    rect(9, 11 + by, 2, 2, cEye);

    // Open snarling mouth & teeth
    rect(5, 16 + by, 4, 2, cDarkFur);
    rect(5, 16 + by, 1, 1, cTeeth);
    rect(7, 16 + by, 1, 1, cTeeth);

    // 3. POWERFUL LEGS & CLAWS
    // Front Left Leg
    ctx.strokeStyle = cFur;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(18, 18 + by);
    ctx.lineTo(frontPawX, frontPawY);
    ctx.stroke();
    // Claws
    rect(frontPawX - 2, frontPawY + 1, 3, 2, cNose);

    // Front Right Leg (darker, background)
    ctx.strokeStyle = cDarkFur;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(22, 19 + by);
    ctx.lineTo(frontPawX + 6, frontPawY - 1);
    ctx.stroke();

    // Back Left Leg
    ctx.strokeStyle = cFur;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(34, 18 + by);
    ctx.lineTo(backPawX, backPawY);
    ctx.stroke();
    rect(backPawX - 1, backPawY + 1, 3, 2, cNose);

    // Back Right Leg (darker, background)
    ctx.strokeStyle = cDarkFur;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(38, 19 + by);
    ctx.lineTo(backPawX + 5, backPawY + 2);
    ctx.stroke();
  }

  // ==========================================================================
  // 3. PARALLAX FOREST BACKGROUNDS & SKY
  // ==========================================================================
  private static generateBackgrounds(textures: Phaser.Textures.TextureManager): void {
    // 3.1 Sky & Pixel Moon (640x360)
    if (!textures.exists('bg_sky')) {
      const canvas = this.createCanvas(640, 360);
      const ctx = canvas.getContext('2d')!;

      // Deep twilight/night gradient
      const grad = ctx.createLinearGradient(0, 0, 0, 360);
      grad.addColorStop(0.0, '#040711');
      grad.addColorStop(0.4, '#091526');
      grad.addColorStop(0.8, '#132438');
      grad.addColorStop(1.0, '#1c3447');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 640, 360);

      // Pixel Stars
      const starColors = ['#f8fafc', '#94a3b8', '#64748b'];
      for (let i = 0; i < 90; i++) {
        const sx = (i * 47) % 640;
        const sy = (i * 29) % 180;
        const sc = starColors[i % 3];
        ctx.fillStyle = sc;
        ctx.fillRect(sx, sy, 1, 1);
      }

      // 16-Bit Pixel Crescent Moon (upper right: x=510, y=42)
      const moonX = 510;
      const moonY = 42;
      ctx.fillStyle = '#fef08a';
      // Draw 14px circle
      for (let dy = -7; dy <= 7; dy++) {
        for (let dx = -7; dx <= 7; dx++) {
          if (dx * dx + dy * dy <= 49) {
            ctx.fillRect(moonX + dx, moonY + dy, 1, 1);
          }
        }
      }
      // Cut crescent
      ctx.fillStyle = '#091526';
      for (let dy = -6; dy <= 6; dy++) {
        for (let dx = -4; dx <= 8; dx++) {
          if ((dx - 3) * (dx - 3) + dy * dy <= 36) {
            ctx.fillRect(moonX + dx, moonY + dy, 1, 1);
          }
        }
      }

      textures.addCanvas('bg_sky', canvas);
    }

    // 3.2 Distant Mountains (640x160)
    if (!textures.exists('bg_mountains')) {
      const canvas = this.createCanvas(640, 160);
      const ctx = canvas.getContext('2d')!;
      ctx.clearRect(0, 0, 640, 160);

      const mColor = '#111e2e';
      const mShade = '#0a131e';

      // Jagged mountain peaks
      ctx.fillStyle = mColor;
      ctx.beginPath();
      ctx.moveTo(0, 160);
      const peaks = [
        [0, 120], [60, 75], [130, 115], [210, 50], [280, 100],
        [350, 60], [430, 110], [520, 45], [590, 85], [640, 110]
      ];
      peaks.forEach(([px, py]) => ctx.lineTo(px, py));
      ctx.lineTo(640, 160);
      ctx.closePath();
      ctx.fill();

      // Shadowed faces
      ctx.fillStyle = mShade;
      peaks.forEach(([px, py], i) => {
        if (i % 2 === 1) {
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(px + 45, 160);
          ctx.lineTo(px, 160);
          ctx.closePath();
          ctx.fill();
        }
      });

      textures.addCanvas('bg_mountains', canvas);
    }

    // 3.3 Far Forest Silhouettes (640x180)
    if (!textures.exists('bg_forest_far')) {
      const canvas = this.createCanvas(640, 180);
      const ctx = canvas.getContext('2d')!;
      ctx.clearRect(0, 0, 640, 180);

      const pineFar = '#0b2320';
      ctx.fillStyle = pineFar;

      // Draw dense row of pointy pine silhouettes
      for (let x = 0; x < 640; x += 12) {
        const h = 55 + ((x * 13) % 40);
        this.drawPineSilhouette(ctx, x, 180, h, 14, pineFar);
      }

      textures.addCanvas('bg_forest_far', canvas);
    }

    // 3.4 Mid Forest Layer with needle textures (640x220)
    if (!textures.exists('bg_forest_mid')) {
      const canvas = this.createCanvas(640, 220);
      const ctx = canvas.getContext('2d')!;
      ctx.clearRect(0, 0, 640, 220);

      const pineMid = '#133a2d';
      const pineHighlight = '#1e5340';
      const trunkColor = '#241a12';

      for (let x = 8; x < 640; x += 36) {
        const th = 85 + ((x * 17) % 55);
        // Trunk
        ctx.fillStyle = trunkColor;
        ctx.fillRect(x + 8, 220 - th, 4, th);

        // Foliage layers
        this.drawPineDetailed(ctx, x + 10, 220 - th, pineMid, pineHighlight);
      }

      textures.addCanvas('bg_forest_mid', canvas);
    }
  }

  private static drawPineSilhouette(
    ctx: CanvasRenderingContext2D,
    bx: number,
    by: number,
    height: number,
    width: number,
    color: string
  ): void {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(bx, by - height);
    ctx.lineTo(bx + width / 2, by);
    ctx.lineTo(bx - width / 2, by);
    ctx.closePath();
    ctx.fill();
  }

  private static drawPineDetailed(
    ctx: CanvasRenderingContext2D,
    tipX: number,
    tipY: number,
    color: string,
    highlight: string
  ): void {
    const tiers = 4;
    for (let t = 0; t < tiers; t++) {
      const cy = tipY + t * 22;
      const w = 18 + t * 10;
      const h = 26;

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(tipX, cy);
      ctx.lineTo(tipX + w / 2, cy + h);
      ctx.lineTo(tipX - w / 2, cy + h);
      ctx.closePath();
      ctx.fill();

      // Right-side highlight
      ctx.fillStyle = highlight;
      ctx.beginPath();
      ctx.moveTo(tipX, cy);
      ctx.lineTo(tipX + w / 2, cy + h);
      ctx.lineTo(tipX, cy + h);
      ctx.closePath();
      ctx.fill();
    }
  }

  // ==========================================================================
  // 4. TERRAIN (Trail surfaces, soil, grass edges)
  // ==========================================================================
  private static generateTerrain(textures: Phaser.Textures.TextureManager): void {
    // 4.1 Dirt Trail Block (64x90) - seamless tiling
    if (!textures.exists('tile_trail')) {
      const canvas = this.createCanvas(64, 90);
      const ctx = canvas.getContext('2d')!;

      const cGrass = '#2e5628';
      const cGrassLight = '#4d7c38';
      const cDirt = '#5c3a21';
      const cDarkDirt = '#3b2314';
      const cPebble = '#78716c';

      // Deep earth base
      ctx.fillStyle = cDarkDirt;
      ctx.fillRect(0, 0, 64, 90);

      // Top dirt surface (first 18px)
      ctx.fillStyle = cDirt;
      ctx.fillRect(0, 0, 64, 22);

      // Grass fringe on top
      ctx.fillStyle = cGrass;
      ctx.fillRect(0, 0, 64, 4);
      for (let x = 0; x < 64; x += 3) {
        const gh = (x % 5 === 0) ? 6 : 4;
        ctx.fillStyle = cGrassLight;
        ctx.fillRect(x, 0, 1, gh);
      }

      // Soil texture noise & pebbles
      for (let y = 6; y < 90; y += 4) {
        for (let x = 0; x < 64; x += 6) {
          if ((x + y) % 5 === 0) {
            ctx.fillStyle = cDarkDirt;
            ctx.fillRect(x, y, 2, 2);
          } else if ((x * y) % 23 === 0) {
            ctx.fillStyle = cPebble;
            ctx.fillRect(x, y, 2, 1);
          }
        }
      }

      textures.addCanvas('tile_trail', canvas);
    }
  }

  // ==========================================================================
  // 5. OBSTACLES (Logs, Kicker Ramps, Creek Water, Mud Patches)
  // ==========================================================================
  private static generateObstacles(textures: Phaser.Textures.TextureManager): void {
    // 5.1 Fallen Log (32x22)
    if (!textures.exists('obs_log')) {
      const canvas = this.createCanvas(32, 22);
      const ctx = canvas.getContext('2d')!;

      const cBark = '#452615';
      const cLightBark = '#6b3f22';
      const cRings = '#a16207';
      const cMoss = '#4d7c0f';

      // Log body
      ctx.fillStyle = cBark;
      ctx.fillRect(4, 4, 24, 16);
      ctx.fillStyle = cLightBark;
      ctx.fillRect(4, 6, 24, 4);

      // Log cut end (left face)
      ctx.fillStyle = cRings;
      ctx.beginPath();
      ctx.ellipse(5, 12, 4, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#78350f';
      ctx.fillRect(5, 12, 1, 1); // center pith

      // Moss on top
      ctx.fillStyle = cMoss;
      ctx.fillRect(8, 3, 14, 2);
      ctx.fillRect(12, 5, 6, 1);

      textures.addCanvas('obs_log', canvas);
    }

    // 5.2 Dirt Kicker Ramp (44x24) - angled wedge pointing LEFT
    if (!textures.exists('obs_kicker')) {
      const canvas = this.createCanvas(44, 24);
      const ctx = canvas.getContext('2d')!;

      const cDirt = '#784c28';
      const cDarkDirt = '#452712';
      const cWood = '#311d11';

      // Ramp wedge: starts at y=24 on right (x=44), slopes up to y=4 on left (x=6)
      ctx.fillStyle = cDirt;
      ctx.beginPath();
      ctx.moveTo(44, 24);
      ctx.lineTo(6, 4);   // Lip of kicker
      ctx.lineTo(0, 4);   // Flat lip extension
      ctx.lineTo(0, 24);
      ctx.closePath();
      ctx.fill();

      // Wood support planks
      ctx.fillStyle = cWood;
      ctx.fillRect(2, 4, 3, 20);
      ctx.fillRect(18, 12, 2, 12);
      ctx.fillRect(32, 18, 2, 6);

      // Dirt surface lip highlight
      ctx.fillStyle = '#a16207';
      ctx.fillRect(0, 3, 8, 2);

      // Shadow under wedge
      ctx.fillStyle = cDarkDirt;
      ctx.fillRect(0, 22, 44, 2);

      textures.addCanvas('obs_kicker', canvas);
    }

    // 5.3 Mud Patch Surface (96x16)
    if (!textures.exists('obs_mud')) {
      const canvas = this.createCanvas(96, 16);
      const ctx = canvas.getContext('2d')!;

      const cMud = '#2a170b';
      const cSlick = '#4a2b16';
      const cHighlight = '#694125';

      // Gooey mud puddle
      ctx.fillStyle = cMud;
      ctx.beginPath();
      ctx.ellipse(48, 8, 46, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      // Wet reflections
      ctx.fillStyle = cSlick;
      ctx.fillRect(20, 6, 50, 4);
      ctx.fillStyle = cHighlight;
      ctx.fillRect(28, 7, 24, 2);

      textures.addCanvas('obs_mud', canvas);
    }

    // 5.4 Creek Gap Water (64x70) - seamless water tile
    if (!textures.exists('creek_water')) {
      const canvas = this.createCanvas(64, 70);
      const ctx = canvas.getContext('2d')!;

      const cWaterDeep = '#075985';
      const cWaterMid = '#0284c7';
      const cFoam = '#bae6fd';

      ctx.fillStyle = cWaterDeep;
      ctx.fillRect(0, 0, 64, 70);

      ctx.fillStyle = cWaterMid;
      ctx.fillRect(0, 0, 64, 16);

      // Water ripples & foam
      ctx.fillStyle = cFoam;
      for (let x = 0; x < 64; x += 16) {
        ctx.fillRect(x + 2, 2, 8, 2);
        ctx.fillRect(x + 8, 6, 6, 1);
        ctx.fillRect(x, 12, 10, 1);
      }

      textures.addCanvas('creek_water', canvas);
    }
  }

  // ==========================================================================
  // 6. FINISH LINE: RANGER STATION CABIN (120x80)
  // Marked with warm glowing windows, cedar shingles, and FINISH banner.
  // ==========================================================================
  private static generateRangerStation(textures: Phaser.Textures.TextureManager): void {
    if (textures.exists('bldg_ranger_station')) return;

    const canvas = this.createCanvas(120, 80);
    const ctx = canvas.getContext('2d')!;

    const cRoof = '#78350f';       // Cedar shingles
    const cRoofShade = '#451a03';
    const cLog = '#854d0e';        // Log walls
    const cLogDark = '#543106';
    const cWindowGlow = '#fef08a'; // Warm interior light
    const cDoor = '#3f220a';
    const cStone = '#475569';      // Chimney stone
    const cBanner = '#ef4444';     // Red banner
    const cWhite = '#f8fafc';

    // 1. Chimney with smoke (x: 95..107, y: 4..40)
    ctx.fillStyle = cStone;
    ctx.fillRect(94, 6, 12, 34);
    // Stone mortar lines
    ctx.fillStyle = '#64748b';
    ctx.fillRect(96, 10, 8, 2);
    ctx.fillRect(94, 20, 8, 2);
    ctx.fillRect(98, 28, 8, 2);

    // Chimney smoke puffs
    ctx.fillStyle = 'rgba(241, 245, 249, 0.7)';
    ctx.fillRect(97, 2, 4, 3);
    ctx.fillRect(99, -1, 3, 2);

    // 2. Cabin Base Log Walls (x: 14 to 106, y: 36 to 80)
    ctx.fillStyle = cLog;
    ctx.fillRect(14, 36, 92, 44);

    // Horizontal logs grooves
    ctx.fillStyle = cLogDark;
    for (let y = 42; y < 80; y += 6) {
      ctx.fillRect(14, y, 92, 2);
    }

    // 3. Pitched Gable Roof (x: 4 to 116, y: 16 to 38)
    ctx.fillStyle = cRoof;
    ctx.beginPath();
    ctx.moveTo(60, 14); // Ridge peak
    ctx.lineTo(116, 38);
    ctx.lineTo(4, 38);
    ctx.closePath();
    ctx.fill();

    // Roof edge shadow & fascia
    ctx.fillStyle = cRoofShade;
    ctx.fillRect(4, 36, 112, 3);

    // 4. Windows with warm golden glow
    const drawWindow = (wx: number, wy: number) => {
      ctx.fillStyle = cWindowGlow;
      ctx.fillRect(wx, wy, 16, 16);
      // Window panes frame
      ctx.fillStyle = '#451a03';
      ctx.fillRect(wx + 7, wy, 2, 16);
      ctx.fillRect(wx, wy + 7, 16, 2);
      ctx.strokeRect(wx, wy, 16, 16);
    };

    drawWindow(22, 46);
    drawWindow(82, 46);

    // 5. Cabin Door in center (x: 52, y: 50, w: 16, h: 30)
    ctx.fillStyle = cDoor;
    ctx.fillRect(52, 50, 16, 30);
    // Brass door handle
    ctx.fillStyle = '#fde047';
    ctx.fillRect(64, 65, 2, 2);

    // 6. FINISH LINE BANNER across front
    ctx.fillStyle = cBanner;
    ctx.fillRect(10, 72, 100, 7);
    ctx.fillStyle = cWhite;
    ctx.font = 'bold 6px monospace';
    ctx.fillText('★ RANGER STATION - FINISH ★', 12, 78);

    textures.addCanvas('bldg_ranger_station', canvas);
  }

  // ==========================================================================
  // 7. PARTICLES & FEEDBACK EFFECTS
  // ==========================================================================
  private static generateEffects(textures: Phaser.Textures.TextureManager): void {
    // 7.1 Mud droplet particle (4x4)
    if (!textures.exists('particle_mud')) {
      const canvas = this.createCanvas(4, 4);
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#5c3a21';
      ctx.fillRect(0, 0, 4, 4);
      ctx.fillStyle = '#2a170b';
      ctx.fillRect(1, 1, 2, 2);
      textures.addCanvas('particle_mud', canvas);
    }

    // 7.2 Water droplet particle (3x3)
    if (!textures.exists('particle_water')) {
      const canvas = this.createCanvas(3, 3);
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(0, 0, 3, 3);
      ctx.fillStyle = '#f0f9ff';
      ctx.fillRect(1, 1, 1, 1);
      textures.addCanvas('particle_water', canvas);
    }

    // 7.3 Dust / land shockwave (6x3)
    if (!textures.exists('particle_dust')) {
      const canvas = this.createCanvas(6, 3);
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#78716c';
      ctx.fillRect(0, 0, 6, 3);
      textures.addCanvas('particle_dust', canvas);
    }

    // 7.4 Jump Charge Pip (4x8)
    if (!textures.exists('ui_charge_pip')) {
      const canvas = this.createCanvas(4, 8);
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#06b6d4';
      ctx.fillRect(0, 0, 4, 8);
      textures.addCanvas('ui_charge_pip', canvas);
    }
  }
}
