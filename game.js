/**
 * ============================================================================
 * APEX TRAIL: SURVIVAL CYCLING
 * Lead Architect Master Synthesis: Unified Zero-Dependency Engine
 * ============================================================================
 * Synthesizes:
 * 1. Pseudo-3D Outrun-style Forest Trail & Mud Raster Scaling Engine
 * 2. Oxygen Debt Stamina & Cycling Physics Engine
 * 3. Grizzly Bear Behavior Tree Predator AI
 * 4. Procedural Web Audio Engine (Trip-Hop & DnB Stems + SFX)
 * 5. Streamlined DOM HUD Controller & Proximity Alert System
 */

// ============================================================================
// MODULE 1: PROCEDURAL WEB AUDIO ENGINE
// ============================================================================
class GameAudioEngine {
  constructor() {
    this.ctx = null;
    this.isInitialized = false;
    this.isPlaying = false;
    this.isUnlocked = false;

    this.masterGain = null;
    this.compressor = null;
    this.adrenalineFilter = null;

    this.tripHopBuffer = null;
    this.dnbBuffer = null;
    this.tripHopSource = null;
    this.dnbSource = null;
    this.tripHopGain = null;
    this.dnbGain = null;

    this.isFrenzy = false;
    this.frenzyLfoPhase = 0;
    this.cadenceRpm = 0;
    this.staminaRatio = 1.0;
    this.inMud = false;

    this.mudGain = null;
    this.mudFilter = null;
    this.mudSource = null;

    this.heartbeatTimer = 0;
    this.pantTimer = 0;

    this._handleUserGesture = this._handleUserGesture.bind(this);
  }

  async init() {
    if (this.isInitialized) return;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    this.ctx = new AudioCtx();
    if (this.ctx.state === 'suspended') {
      ['pointerdown', 'keydown', 'click'].forEach(evt =>
        window.addEventListener(evt, this._handleUserGesture, { once: true, passive: true })
      );
    } else {
      this.isUnlocked = true;
    }

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.85, this.ctx.currentTime);

    this.compressor = this.ctx.createDynamicsCompressor();
    this.compressor.threshold.setValueAtTime(-10.0, this.ctx.currentTime);
    this.compressor.ratio.setValueAtTime(8.0, this.ctx.currentTime);

    this.adrenalineFilter = this.ctx.createBiquadFilter();
    this.adrenalineFilter.type = 'lowpass';
    this.adrenalineFilter.frequency.setValueAtTime(20000, this.ctx.currentTime);
    this.adrenalineFilter.Q.setValueAtTime(0.707, this.ctx.currentTime);

    this.adrenalineFilter.connect(this.compressor);
    this.compressor.connect(this.masterGain);
    this.masterGain.connect(this.ctx.destination);

    this.tripHopGain = this.ctx.createGain();
    this.tripHopGain.gain.setValueAtTime(1.0, this.ctx.currentTime);
    this.tripHopGain.connect(this.adrenalineFilter);

    this.dnbGain = this.ctx.createGain();
    this.dnbGain.gain.setValueAtTime(0.001, this.ctx.currentTime);
    this.dnbGain.connect(this.adrenalineFilter);

    this.tripHopBuffer = this._synthesizeTripHopStem();
    this.dnbBuffer = this._synthesizeDnBStem();
    this._initMudGraph();

    this.isInitialized = true;
  }

  _handleUserGesture() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().then(() => { this.isUnlocked = true; }).catch(() => {});
    } else {
      this.isUnlocked = true;
    }
  }

  start() {
    if (!this.isInitialized) {
      this.init().then(() => this.start());
      return;
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    if (this.isPlaying) return;

    const now = this.ctx.currentTime;
    this.tripHopSource = this.ctx.createBufferSource();
    this.tripHopSource.buffer = this.tripHopBuffer;
    this.tripHopSource.loop = true;
    this.tripHopSource.playbackRate.setValueAtTime(1.0, now);
    this.tripHopSource.connect(this.tripHopGain);

    this.dnbSource = this.ctx.createBufferSource();
    this.dnbSource.buffer = this.dnbBuffer;
    this.dnbSource.loop = true;
    this.dnbSource.playbackRate.setValueAtTime(1.0, now);
    this.dnbSource.connect(this.dnbGain);

    this.tripHopSource.start(now);
    this.dnbSource.start(now);
    this.isPlaying = true;
  }

  update(dt = 0.016, cadenceRpm = 0, isFrenzy = false, staminaRatio = 1.0, inMud = false) {
    if (!this.isInitialized || !this.isPlaying || !this.ctx) return;

    const now = this.ctx.currentTime;
    this.cadenceRpm = cadenceRpm;
    this.staminaRatio = Math.max(0, Math.min(1, staminaRatio));
    this.inMud = inMud;

    // 1. Cadence-Linked Dynamic Playback for Trip-Hop Stem (clamped [0.5, 1.5])
    const clampedRpm = Math.max(0, Math.min(120, cadenceRpm));
    const targetRate = Math.max(0.5, Math.min(1.5, 0.5 + (clampedRpm / 120.0)));
    if (this.tripHopSource) {
      this.tripHopSource.playbackRate.setTargetAtTime(targetRate, now, 0.08);
    }

    // 2. Frenzy Crossfade
    if (isFrenzy !== this.isFrenzy) {
      if (isFrenzy) this.onFrenzyStart();
      else this.onFrenzyEnd();
    }

    // 3. Adrenaline Tunnel Vision Sweeping Filter
    if (this.isFrenzy) {
      this.frenzyLfoPhase += dt * 3.0;
      const lfoNorm = (Math.sin(this.frenzyLfoPhase) + 1.0) * 0.5;
      const sweepCutoff = 600 * Math.pow(12000 / 600, lfoNorm);
      this.adrenalineFilter.frequency.setTargetAtTime(sweepCutoff, now, 0.05);
      this.adrenalineFilter.Q.setTargetAtTime(5.0, now, 0.08);
    }

    // 4. Low Stamina Heartbeat & Panting (< 30%)
    if (this.staminaRatio < 0.3) {
      const fatigueFactor = 1.0 - (this.staminaRatio / 0.3);
      const interval = 0.70 - (fatigueFactor * 0.35);
      this.heartbeatTimer += dt;
      if (this.heartbeatTimer >= interval) {
        this.heartbeatTimer = 0;
        this._playHeartbeatThump(fatigueFactor);
      }
      this.pantTimer += dt;
      if (this.pantTimer >= interval * 2.0) {
        this.pantTimer = 0;
        this._playPantingBreath(fatigueFactor);
      }
    } else {
      this.heartbeatTimer = 0;
      this.pantTimer = 0;
    }

    // 5. Mud Squelch Noise
    if (this.mudGain) {
      const isMovingInMud = this.inMud && (this.cadenceRpm > 2);
      const targetMudVol = isMovingInMud ? Math.min(0.65, 0.15 + (this.cadenceRpm / 120.0) * 0.5) : 0.0001;
      this.mudGain.gain.setTargetAtTime(targetMudVol, now, 0.08);
      if (isMovingInMud) {
        const mudCutoff = 450 + Math.sin(now * 12.0) * 200 + (this.cadenceRpm * 3.0);
        this.mudFilter.frequency.setTargetAtTime(Math.min(2200, mudCutoff), now, 0.05);
      }
    }
  }

  onFrenzyStart() {
    this.isFrenzy = true;
    if (!this.isInitialized || !this.ctx) return;
    const now = this.ctx.currentTime;
    this.tripHopGain.gain.cancelScheduledValues(now);
    this.tripHopGain.gain.setValueAtTime(Math.max(0.0001, this.tripHopGain.gain.value), now);
    this.tripHopGain.gain.linearRampToValueAtTime(0.001, now + 0.3);

    this.dnbGain.gain.cancelScheduledValues(now);
    this.dnbGain.gain.setValueAtTime(Math.max(0.0001, this.dnbGain.gain.value), now);
    this.dnbGain.gain.linearRampToValueAtTime(1.0, now + 0.3);

    this.frenzyLfoPhase = 0;
    this.adrenalineFilter.Q.setTargetAtTime(5.5, now, 0.1);
    this.playRoar();
  }

  onFrenzyEnd() {
    this.isFrenzy = false;
    if (!this.isInitialized || !this.ctx) return;
    const now = this.ctx.currentTime;
    this.dnbGain.gain.cancelScheduledValues(now);
    this.dnbGain.gain.setValueAtTime(Math.max(0.0001, this.dnbGain.gain.value), now);
    this.dnbGain.gain.linearRampToValueAtTime(0.001, now + 0.5);

    this.tripHopGain.gain.cancelScheduledValues(now);
    this.tripHopGain.gain.setValueAtTime(Math.max(0.0001, this.tripHopGain.gain.value), now);
    this.tripHopGain.gain.linearRampToValueAtTime(1.0, now + 0.5);

    this.adrenalineFilter.frequency.cancelScheduledValues(now);
    this.adrenalineFilter.frequency.setValueAtTime(this.adrenalineFilter.frequency.value, now);
    this.adrenalineFilter.frequency.exponentialRampToValueAtTime(20000, now + 0.5);
    this.adrenalineFilter.Q.setTargetAtTime(0.707, now, 0.5);
  }

  playGearShift() {
    if (!this.isInitialized || !this.ctx) return;
    this._handleUserGesture();
    const now = this.ctx.currentTime;

    for (let i = 0; i < 2; i++) {
      const clickTime = now + (i * 0.015);
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(i === 0 ? 2500 : 3600, clickTime);
      osc.frequency.exponentialRampToValueAtTime(800, clickTime + 0.02);
      gain.gain.setValueAtTime(0.35, clickTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, clickTime + 0.02);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(clickTime);
      osc.stop(clickTime + 0.022);
    }
  }

  playRoar() {
    if (!this.isInitialized || !this.ctx) return;
    this._handleUserGesture();
    const now = this.ctx.currentTime;
    const duration = 1.3;

    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'sawtooth';
    subOsc.frequency.setValueAtTime(140, now);
    subOsc.frequency.exponentialRampToValueAtTime(36, now + duration);

    const modOsc = this.ctx.createOscillator();
    const modGain = this.ctx.createGain();
    modOsc.frequency.setValueAtTime(32, now);
    modGain.gain.setValueAtTime(50, now);
    modOsc.connect(subOsc.frequency);

    subGain.gain.setValueAtTime(0.001, now);
    subGain.gain.linearRampToValueAtTime(0.85, now + 0.08);
    subGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    const formantFilter = this.ctx.createBiquadFilter();
    formantFilter.type = 'bandpass';
    formantFilter.frequency.setValueAtTime(1600, now);
    formantFilter.frequency.exponentialRampToValueAtTime(450, now + duration * 0.8);
    formantFilter.Q.setValueAtTime(4.0, now);

    modOsc.start(now);
    subOsc.start(now);
    modOsc.stop(now + duration);
    subOsc.stop(now + duration);

    subOsc.connect(formantFilter);
    formantFilter.connect(subGain);
    subGain.connect(this.masterGain);
  }

  playDeath() {
    if (!this.isInitialized || !this.ctx) return;
    this._handleUserGesture();
    const now = this.ctx.currentTime;

    this.tripHopGain.gain.setTargetAtTime(0.0001, now, 0.05);
    this.dnbGain.gain.setTargetAtTime(0.0001, now, 0.05);

    const boomOsc = this.ctx.createOscillator();
    const boomGain = this.ctx.createGain();
    boomOsc.type = 'sine';
    boomOsc.frequency.setValueAtTime(120, now);
    boomOsc.frequency.exponentialRampToValueAtTime(20, now + 1.2);
    boomGain.gain.setValueAtTime(1.0, now);
    boomGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.5);
    boomOsc.connect(boomGain);
    boomGain.connect(this.masterGain);
    boomOsc.start(now);
    boomOsc.stop(now + 1.6);
  }

  _synthesizeTripHopStem() {
    const sr = this.ctx.sampleRate || 44100;
    const totalSamples = Math.round(sr * (16 * 60 / 90)); // 4 bars @ 90 BPM (~10.66s)
    const buffer = this.ctx.createBuffer(2, totalSamples, sr);
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);
    const stepSamples = totalSamples / 64;

    // Vinyl noise floor
    let brown = 0;
    for (let i = 0; i < totalSamples; i++) {
      brown = brown * 0.95 + (Math.random() * 2 - 1) * 0.05;
      const v = brown * 0.015;
      left[i] += v;
      right[i] += v;
    }

    const kickSteps = [0, 6, 10, 16, 22, 26, 28, 32, 38, 42, 48, 54, 58, 60];
    const snareSteps = [4, 12, 20, 28, 36, 44, 52, 60];

    // Sub bass
    for (let bar = 0; bar < 4; bar++) {
      const root = bar % 2 === 0 ? 36.7 : 32.7;
      const start = Math.floor(bar * 16 * stepSamples);
      const len = Math.floor(15 * stepSamples);
      for (let i = 0; i < len; i++) {
        const t = i / sr;
        const sub = Math.sin(2 * Math.PI * root * t) * Math.exp(-t / 1.4);
        left[start + i] += sub * 0.6;
        right[start + i] += sub * 0.6;
      }
    }

    // Kicks
    for (const step of kickSteps) {
      const start = Math.floor(step * stepSamples);
      const len = Math.floor(0.35 * sr);
      for (let i = 0; i < len; i++) {
        const t = i / sr;
        const freq = 45 + 110 * Math.exp(-t / 0.035);
        const env = Math.exp(-t / 0.18);
        const k = Math.sin(2 * Math.PI * freq * t) * env * 0.9;
        const idx = (start + i) % totalSamples;
        left[idx] += k;
        right[idx] += k;
      }
    }

    // Snares
    for (const step of snareSteps) {
      const start = Math.floor(step * stepSamples);
      const len = Math.floor(0.2 * sr);
      for (let i = 0; i < len; i++) {
        const t = i / sr;
        const tone = Math.sin(2 * Math.PI * 180 * t) * Math.exp(-t / 0.06) * 0.4;
        const noise = (Math.random() * 2 - 1) * Math.exp(-t / 0.12) * 0.5;
        const idx = (start + i) % totalSamples;
        left[idx] += tone + noise;
        right[idx] += tone + noise;
      }
    }

    // Hats
    for (let step = 0; step < 64; step++) {
      const start = Math.floor(step * stepSamples);
      const len = Math.floor(0.04 * sr);
      for (let i = 0; i < len; i++) {
        const t = i / sr;
        const h = (Math.random() * 2 - 1) * Math.exp(-t / 0.02) * 0.15;
        const idx = (start + i) % totalSamples;
        left[idx] += h;
        right[idx] += h;
      }
    }

    return buffer;
  }

  _synthesizeDnBStem() {
    const sr = this.ctx.sampleRate || 44100;
    const totalSamples = Math.round(sr * (16 * 60 / 174)); // 4 bars @ 174 BPM (~5.51s)
    const buffer = this.ctx.createBuffer(2, totalSamples, sr);
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);
    const stepSamples = totalSamples / 64;

    const kickSteps = [0, 10, 16, 22, 26, 32, 42, 48, 54, 58];
    const snareSteps = [4, 12, 20, 28, 36, 44, 52, 60];

    // Aggressive reese saw bassline
    for (let bar = 0; bar < 4; bar++) {
      const root = bar % 2 === 0 ? 43.6 : 38.9;
      const start = Math.floor(bar * 16 * stepSamples);
      const len = Math.floor(15 * stepSamples);
      for (let i = 0; i < len; i++) {
        const t = i / sr;
        const saw1 = (2 * ((t * root) % 1) - 1) * 0.4;
        const saw2 = (2 * ((t * (root + 1.2)) % 1) - 1) * 0.4;
        const env = Math.min(1.0, i / 500) * Math.exp(-t / 1.1);
        const b = Math.tanh((saw1 + saw2) * 2.0) * env * 0.65;
        left[start + i] += b;
        right[start + i] += b;
      }
    }

    // Hard punch kicks
    for (const step of kickSteps) {
      const start = Math.floor(step * stepSamples);
      const len = Math.floor(0.18 * sr);
      for (let i = 0; i < len; i++) {
        const t = i / sr;
        const freq = 52 + 160 * Math.exp(-t / 0.02);
        const k = Math.sin(2 * Math.PI * freq * t) * Math.exp(-t / 0.08) * 0.95;
        const idx = (start + i) % totalSamples;
        left[idx] += k;
        right[idx] += k;
      }
    }

    // Snappy break snares
    for (const step of snareSteps) {
      const start = Math.floor(step * stepSamples);
      const len = Math.floor(0.15 * sr);
      for (let i = 0; i < len; i++) {
        const t = i / sr;
        const tone = Math.sin(2 * Math.PI * 230 * t) * Math.exp(-t / 0.04) * 0.45;
        const noise = (Math.random() * 2 - 1) * Math.exp(-t / 0.09) * 0.6;
        const idx = (start + i) % totalSamples;
        left[idx] += tone + noise;
        right[idx] += tone + noise;
      }
    }

    // Rapid 16th hats
    for (let step = 0; step < 64; step++) {
      const start = Math.floor(step * stepSamples);
      const len = Math.floor(0.025 * sr);
      for (let i = 0; i < len; i++) {
        const t = i / sr;
        const h = (Math.random() * 2 - 1) * Math.exp(-t / 0.012) * 0.18;
        const idx = (start + i) % totalSamples;
        left[idx] += h;
        right[idx] += h;
      }
    }

    return buffer;
  }

  _initMudGraph() {
    const sr = this.ctx.sampleRate || 44100;
    const len = sr * 2;
    const mudBuf = this.ctx.createBuffer(1, len, sr);
    const data = mudBuf.getChannelData(0);
    let b0 = 0;
    for (let i = 0; i < len; i++) {
      b0 = 0.97 * b0 + (Math.random() * 2 - 1) * 0.03;
      data[i] = b0 * 2.0;
    }

    this.mudSource = this.ctx.createBufferSource();
    this.mudSource.buffer = mudBuf;
    this.mudSource.loop = true;

    this.mudFilter = this.ctx.createBiquadFilter();
    this.mudFilter.type = 'lowpass';
    this.mudFilter.frequency.setValueAtTime(650, this.ctx.currentTime);
    this.mudFilter.Q.setValueAtTime(2.5, this.ctx.currentTime);

    this.mudGain = this.ctx.createGain();
    this.mudGain.gain.setValueAtTime(0.0001, this.ctx.currentTime);

    this.mudSource.connect(this.mudFilter);
    this.mudFilter.connect(this.mudGain);
    this.mudGain.connect(this.masterGain);
    this.mudSource.start(this.ctx.currentTime);
  }

  _playHeartbeatThump(intensity = 0.5) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(65, now);
    osc.frequency.exponentialRampToValueAtTime(35, now + 0.12);
    gain.gain.setValueAtTime(0.6 * intensity, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.13);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.14);
  }

  _playPantingBreath(intensity = 0.5) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(800, now);
    gain.gain.setValueAtTime(0.2 * intensity, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.26);
  }
}

// ============================================================================
// MODULE 2: CYCLING PHYSICS & OXYGEN DEBT STAMINA ENGINE
// ============================================================================
class CyclingPhysicsEngine {
  constructor(config = {}) {
    this.GEAR_RATIOS = { 1: 0.5, 2: 1.0, 3: 2.0 };
    this.BASE_MAX_STAMINA = 100.0;
    this.MIN_MAX_STAMINA = 15.0;
    this.BASE_STAMINA_DRAIN = 6.5;
    this.STAMINA_RECOVERY_RATE = 10.0;
    this.REDLINE_LOAD_THRESHOLD = 4.0;
    this.REDLINE_TRIGGER_DELAY = 3.0;
    this.REDLINE_DEGRADE_RATE = 0.05; // 5% per second

    this.DRIVE_SPEED_SCALE = 0.235;
    this.AIR_DRAG_COEFF = 0.0016;
    this.BASE_ROLLING_RESISTANCE = 1.8;
    this.ACCELERATION_RATE = 3.2;

    this._gear = 2;
    this._mudResistance = 1.0;
    this._tapTimestamps = [];
    this._cadenceRpm = 0.0;
    this._cadenceDecayRate = 120.0;
    this._lastTapTime = -Infinity;

    this._maxStamina = this.BASE_MAX_STAMINA;
    this._stamina = this.BASE_MAX_STAMINA;
    this._overloadTimer = 0.0;
    this._isRedline = false;
    this._redlineDuration = 0.0;
    this._isExhausted = false;

    this._speed = 0.0;
    this._currentTime = 0.0;

    this.onRedlineStart = null;
    this.onRedlineEnd = null;
    this.onGearChange = null;
  }

  get speed() { return Math.max(0, this._speed); }
  get cadenceRpm() { return Math.max(0, this._cadenceRpm); }
  get stamina() { return Math.max(0, this._stamina); }
  get maxStamina() { return this._maxStamina; }
  get gear() { return this._gear; }
  get gearRatio() { return this.GEAR_RATIOS[this._gear]; }
  get effortLoad() { return this.gearRatio * this._mudResistance; }
  get mudResistance() { return this._mudResistance; }
  get isRedline() { return this._isRedline; }
  get redlineDuration() { return this._redlineDuration; }
  get isExhausted() { return this._isExhausted; }

  registerTap(timestampSec = this._currentTime) {
    if (this._isExhausted) {
      if (timestampSec - this._lastTapTime < 0.35) return;
    }
    this._tapTimestamps.push(timestampSec);
    this._lastTapTime = timestampSec;
  }

  handleKeyDown(event) {
    if (event.repeat) return;
    const key = event.key;
    const code = event.code;

    if (key === 'w' || key === 'W' || code === 'KeyW' || key === ' ') {
      this.registerTap();
    } else if (key === 'ArrowUp' || code === 'ArrowUp' || key === 'e' || key === 'E') {
      this.shiftUp();
    } else if (key === 'ArrowDown' || code === 'ArrowDown' || key === 'q' || key === 'Q') {
      this.shiftDown();
    }
  }

  shiftUp() {
    if (this._gear < 3) {
      this._gear += 1;
      if (this.onGearChange) this.onGearChange(this._gear);
    }
  }

  shiftDown() {
    if (this._gear > 1) {
      this._gear -= 1;
      if (this.onGearChange) this.onGearChange(this._gear);
    }
  }

  setGear(gear) {
    if (gear >= 1 && gear <= 3 && gear !== this._gear) {
      this._gear = gear;
      if (this.onGearChange) this.onGearChange(this._gear);
    }
  }

  update(dt, inMudPatch = false, mudResistanceValue = 2.8) {
    if (dt <= 0) return;
    this._currentTime += dt;

    // 1. Mud resistance interpolation
    const targetResistance = inMudPatch ? Math.min(3.0, Math.max(1.0, mudResistanceValue)) : 1.0;
    this._mudResistance += (targetResistance - this._mudResistance) * Math.min(1.0, dt * 5.0);

    // 2. Cadence & decay
    const cutoff = this._currentTime - 1.2;
    this._tapTimestamps = this._tapTimestamps.filter(t => t >= cutoff);
    const timeSinceLastTap = this._currentTime - this._lastTapTime;

    if (this._tapTimestamps.length > 0 && timeSinceLastTap < 0.65) {
      let tapsPerSec = 0;
      if (this._tapTimestamps.length >= 2) {
        const span = this._tapTimestamps[this._tapTimestamps.length - 1] - this._tapTimestamps[0];
        tapsPerSec = span > 0.05 ? (this._tapTimestamps.length - 1) / span : this._tapTimestamps.length / 1.2;
      } else {
        tapsPerSec = 1.0 / Math.max(0.2, timeSinceLastTap);
      }
      const targetRpm = Math.min(130.0, tapsPerSec * 60.0);
      this._cadenceRpm += (targetRpm - this._cadenceRpm) * Math.min(1.0, dt * 6.0);
    } else {
      this._cadenceRpm = Math.max(0.0, this._cadenceRpm - this._cadenceDecayRate * dt);
    }

    // 3. Effort Load & Redline Formula (Effort Load = Gear * Resistance)
    const currentLoad = this.effortLoad;

    if (currentLoad > this.REDLINE_LOAD_THRESHOLD) {
      this._overloadTimer += dt;
      if (this._overloadTimer >= this.REDLINE_TRIGGER_DELAY && !this._isRedline) {
        this._isRedline = true;
        this._redlineDuration = 0.0;
        if (this.onRedlineStart) this.onRedlineStart(currentLoad);
      }
    } else {
      this._overloadTimer = 0.0;
      if (this._isRedline) {
        this._isRedline = false;
        this._redlineDuration = 0.0;
        if (this.onRedlineEnd) this.onRedlineEnd(currentLoad);
      }
    }

    // Degrade max stamina capacity by 5% per second while redlining
    if (this._isRedline) {
      this._redlineDuration += dt;
      const degradation = this.REDLINE_DEGRADE_RATE * this.BASE_MAX_STAMINA * dt;
      this._maxStamina = Math.max(this.MIN_MAX_STAMINA, this._maxStamina - degradation);
      if (this._stamina > this._maxStamina) this._stamina = this._maxStamina;
    }

    // 4. Stamina Depletion & Recovery ("Oxygen Debt")
    const isPedaling = this._cadenceRpm > 5.0;
    const drain = this.BASE_STAMINA_DRAIN * currentLoad * (this._cadenceRpm / 60.0);

    if (isPedaling && drain > 0.5) {
      this._stamina -= drain * dt;
      if (this._stamina <= 0.0) {
        this._stamina = 0.0;
        this._isExhausted = true;
      }
    } else {
      const recMultiplier = this._isExhausted ? 0.6 : 1.0;
      this._stamina = Math.min(
        this._maxStamina,
        this._stamina + this.STAMINA_RECOVERY_RATE * recMultiplier * dt
      );
      if (this._isExhausted && this._stamina >= 20.0) {
        this._isExhausted = false;
      }
    }

    // 5. Speed Physics & Inertia
    let staminaEff = this._isExhausted ? 0.20 : 0.5 + 0.5 * (this._stamina / Math.max(1.0, this._maxStamina));
    const targetDriveSpeed = (this._cadenceRpm * this.gearRatio / Math.sqrt(this._mudResistance))
      * this.DRIVE_SPEED_SCALE
      * staminaEff;

    const rollingDecel = this.BASE_ROLLING_RESISTANCE * this._mudResistance;
    const airDragDecel = this.AIR_DRAG_COEFF * (this._speed * this._speed);
    const totalResistance = rollingDecel + airDragDecel;

    if (targetDriveSpeed > this._speed) {
      const driveAccel = (targetDriveSpeed - this._speed) * this.ACCELERATION_RATE;
      this._speed = Math.max(0.0, this._speed + (driveAccel - totalResistance) * dt);
    } else {
      this._speed = Math.max(0.0, this._speed - totalResistance * dt);
    }
  }

  reset() {
    this._gear = 2;
    this._mudResistance = 1.0;
    this._tapTimestamps = [];
    this._cadenceRpm = 0.0;
    this._lastTapTime = -Infinity;
    this._maxStamina = this.BASE_MAX_STAMINA;
    this._stamina = this.BASE_MAX_STAMINA;
    this._overloadTimer = 0.0;
    this._isRedline = false;
    this._redlineDuration = 0.0;
    this._isExhausted = false;
    this._speed = 0.0;
    this._currentTime = 0.0;
  }
}

// ============================================================================
// MODULE 3: GRIZZLY BEAR BEHAVIOR TREE PREDATOR AI
// ============================================================================
const BTNodeState = { SUCCESS: 'SUCCESS', FAILURE: 'FAILURE', RUNNING: 'RUNNING' };

class BTNode {
  constructor(name = 'BTNode') { this.name = name; }
  tick(bb) { throw new Error('Unimplemented tick'); }
}

class BTSelector extends BTNode {
  constructor(children = [], name = 'BTSelector') {
    super(name);
    this.children = children;
  }
  tick(bb) {
    for (const child of this.children) {
      const res = child.tick(bb);
      if (res !== BTNodeState.FAILURE) return res;
    }
    return BTNodeState.FAILURE;
  }
}

class BTSequence extends BTNode {
  constructor(children = [], name = 'BTSequence') {
    super(name);
    this.children = children;
  }
  tick(bb) {
    for (const child of this.children) {
      const res = child.tick(bb);
      if (res !== BTNodeState.SUCCESS) return res;
    }
    return BTNodeState.SUCCESS;
  }
}

class BTCondition extends BTNode {
  constructor(fn, name = 'BTCondition') {
    super(name);
    this.fn = fn;
  }
  tick(bb) { return this.fn(bb) ? BTNodeState.SUCCESS : BTNodeState.FAILURE; }
}

class BTAction extends BTNode {
  constructor(fn, name = 'BTAction') {
    super(name);
    this.fn = fn;
  }
  tick(bb) {
    const res = this.fn(bb);
    if (res === BTNodeState.SUCCESS || res === BTNodeState.FAILURE || res === BTNodeState.RUNNING) return res;
    return res ? BTNodeState.SUCCESS : BTNodeState.FAILURE;
  }
}

class PredatorAI {
  constructor(options = {}) {
    this.initialDistance = options.initialDistance ?? 80.0;
    this.minCreepSpeed = 15.0; // km/h creeping speed when player slows down
    this.onStateChange = options.onStateChange || null;
    this.onCaught = options.onCaught || null;
    this.onFrenzyTrigger = options.onFrenzyTrigger || null;

    this.blackboard = {
      dt: 0,
      playerSpeed: 0,
      playerMaxSpeed: 45.0,
      isRedline: false,
      distance: this.initialDistance,
      speed: 0.0,
      state: 'TRACKING',
      stateTimer: 0.0,
      isCaught: false
    };

    this.tree = this._buildTree();
  }

  get distance() { return this.blackboard.distance; }
  get speed() { return this.blackboard.speed; }
  get state() { return this.blackboard.state; }
  get isCaught() { return this.blackboard.isCaught; }

  _buildTree() {
    // 1. Catch Player Sequence
    const catchSeq = new BTSequence([
      new BTCondition(bb => bb.distance <= 0 || bb.isCaught, 'CheckCaught'),
      new BTAction(bb => {
        this._handleCaught();
        return BTNodeState.SUCCESS;
      }, 'TriggerMaul')
    ]);

    // 2. Frenzy Rush Sequence (Player hits Redline -> Surge at MaxSpeed * 1.3 for 4.0s)
    const frenzySeq = new BTSequence([
      new BTCondition(bb => {
        if (bb.state === 'FRENZY') return true;
        return bb.isRedline && bb.state !== 'FATIGUE';
      }, 'CheckFrenzyTrigger'),
      new BTAction(bb => {
        if (bb.state !== 'FRENZY') this._setState('FRENZY');
        bb.speed = bb.playerMaxSpeed * 1.3; // Frenzy speed: 58.5 km/h
        bb.stateTimer += bb.dt;

        if (bb.stateTimer >= 4.0) {
          this._setState('FATIGUE');
          bb.speed = bb.playerSpeed * 0.50;
          return BTNodeState.SUCCESS;
        }
        return BTNodeState.RUNNING;
      }, 'ExecuteFrenzySurge')
    ]);

    // 3. Fatigue Recovery Sequence (Speed drops to 50% for 5.0s)
    const fatigueSeq = new BTSequence([
      new BTCondition(bb => bb.state === 'FATIGUE', 'CheckFatigueState'),
      new BTAction(bb => {
        bb.speed = Math.max(8.0, bb.playerSpeed * 0.50);
        bb.stateTimer += bb.dt;

        if (bb.stateTimer >= 5.0) {
          this._setState('TRACKING');
          bb.speed = Math.max(this.minCreepSpeed, bb.playerSpeed * 0.95);
          return BTNodeState.SUCCESS;
        }
        return BTNodeState.RUNNING;
      }, 'ExecuteFatigueSlowdown')
    ]);

    // 4. Default Tracking Action (Bear matches playerSpeed * 0.95)
    const trackingAction = new BTAction(bb => {
      if (bb.state !== 'TRACKING') this._setState('TRACKING');
      bb.speed = Math.max(this.minCreepSpeed, bb.playerSpeed * 0.95);
      bb.stateTimer += bb.dt;
      return BTNodeState.RUNNING;
    }, 'TrackPlayer');

    return new BTSelector([catchSeq, frenzySeq, fatigueSeq, trackingAction]);
  }

  update(dt, playerSpeed = 0, playerMaxSpeed = 45.0, isRedline = false) {
    if (dt <= 0 || this.blackboard.isCaught) return this.blackboard;

    this.blackboard.dt = dt;
    this.blackboard.playerSpeed = playerSpeed;
    this.blackboard.playerMaxSpeed = playerMaxSpeed;
    this.blackboard.isRedline = isRedline;

    this.tree.tick(this.blackboard);

    // Distance kinematic update: (playerSpeed - bearSpeed) converted from km/h to m/s
    if (!this.blackboard.isCaught) {
      const relSpeedMps = (this.blackboard.playerSpeed - this.blackboard.speed) * (1000.0 / 3600.0);
      this.blackboard.distance += relSpeedMps * dt;
      if (this.blackboard.distance <= 0) {
        this._handleCaught();
      }
    }

    return this.blackboard;
  }

  _setState(newState) {
    const oldState = this.blackboard.state;
    if (oldState !== newState) {
      this.blackboard.state = newState;
      this.blackboard.stateTimer = 0.0;
      if (newState === 'FRENZY' && this.onFrenzyTrigger) {
        this.onFrenzyTrigger();
      }
      if (this.onStateChange) {
        this.onStateChange(newState, oldState);
      }
    }
  }

  _handleCaught() {
    this.blackboard.distance = 0.0;
    this.blackboard.speed = 0.0;
    if (!this.blackboard.isCaught) {
      this.blackboard.isCaught = true;
      if (this.onCaught) this.onCaught();
    }
  }

  reset() {
    this.blackboard.distance = this.initialDistance;
    this.blackboard.speed = 0.0;
    this.blackboard.state = 'TRACKING';
    this.blackboard.stateTimer = 0.0;
    this.blackboard.isCaught = false;
  }
}

// ============================================================================
// MODULE 4: PSEUDO-3D OUTRUN CANVAS RENDERER
// ============================================================================
class ForestTrailRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);

    this.roadWidth = 2000;
    this.segmentLength = 200;
    this.totalSegments = 1200;
    this.cameraHeight = 900;
    this.drawDistance = 260;
    this.fieldOfView = 80;
    this.cameraDepth = 1 / Math.tan((this.fieldOfView / 2) * Math.PI / 180);

    this.segments = [];
    this.mudPatches = []; // Array of { start, end, x, w }
    this.spriteCache = {};

    this._initCanvas();
    this._generateSprites();
    this._buildTrack();
    this._setupResize();
  }

  _initCanvas() {
    this.width = this.canvas.clientWidth || window.innerWidth;
    this.height = this.canvas.clientHeight || window.innerHeight;
    this.canvas.width = Math.floor(this.width * this.dpr);
    this.canvas.height = Math.floor(this.height * this.dpr);
  }

  _setupResize() {
    window.addEventListener('resize', () => {
      this._initCanvas();
    });
  }

  _generateSprites() {
    // 1. Conifer Pine Tree
    const treeCanvas = document.createElement('canvas');
    treeCanvas.width = 160;
    treeCanvas.height = 320;
    const tctx = treeCanvas.getContext('2d');
    tctx.fillStyle = '#1e1610';
    tctx.fillRect(72, 240, 16, 80);
    // Dark gloomy foliage layers
    const tiers = [
      { y: 240, w: 140, h: 80, c: '#08170e' },
      { y: 180, w: 110, h: 70, c: '#0c2214' },
      { y: 120, w: 80, h: 60, c: '#102e1c' },
      { y: 60, w: 50, h: 50, c: '#143822' }
    ];
    for (const t of tiers) {
      tctx.fillStyle = t.c;
      tctx.beginPath();
      tctx.moveTo(80, t.y - t.h);
      tctx.lineTo(80 - t.w / 2, t.y);
      tctx.lineTo(80 + t.w / 2, t.y);
      tctx.closePath();
      tctx.fill();
    }
    this.spriteCache.tree = treeCanvas;

    // 2. Forest Boulder
    const rockCanvas = document.createElement('canvas');
    rockCanvas.width = 100;
    rockCanvas.height = 60;
    const rctx = rockCanvas.getContext('2d');
    rctx.fillStyle = '#1c2420';
    rctx.beginPath();
    rctx.ellipse(50, 35, 45, 22, 0, 0, Math.PI * 2);
    rctx.fill();
    rctx.fillStyle = '#2d3b34';
    rctx.beginPath();
    rctx.ellipse(45, 28, 30, 14, -0.2, 0, Math.PI * 2);
    rctx.fill();
    this.spriteCache.rock = rockCanvas;
  }

  _buildTrack() {
    this.segments = [];
    for (let i = 0; i < this.totalSegments; i++) {
      // Gentle curves & undulating forest hills
      const curve = (i > 80 && i < 300) ? Math.sin((i - 80) / 40) * 2.2
                  : (i > 450 && i < 700) ? -Math.cos((i - 450) / 45) * 2.6
                  : (i > 850 && i < 1100) ? Math.sin((i - 850) / 35) * 2.0 : 0;

      const y = Math.sin(i / 30) * 450 + Math.cos(i / 70) * 300;

      // Foliage along banks
      const sprites = [];
      if (i % 4 === 0) {
        sprites.push({ sprite: this.spriteCache.tree, offset: -1.4 - (Math.sin(i) * 0.5) });
      }
      if (i % 5 === 0) {
        sprites.push({ sprite: this.spriteCache.tree, offset: 1.4 + (Math.cos(i) * 0.5) });
      }
      if (i % 18 === 0) {
        sprites.push({ sprite: this.spriteCache.rock, offset: -1.15 });
      }

      this.segments.push({
        index: i,
        p1: { world: { x: 0, y, z: i * this.segmentLength }, screen: { x: 0, y: 0, w: 0, scale: 0 } },
        p2: { world: { x: 0, y, z: (i + 1) * this.segmentLength }, screen: { x: 0, y: 0, w: 0, scale: 0 } },
        curve,
        sprites
      });
    }

    // Configure distinct Mud Patches along the trail
    // Segments: [100-140], [260-310], [500-560], [750-810], [980-1040]
    this.mudPatches = [
      { start: 100, end: 140, x: -0.1, w: 0.8 },
      { start: 260, end: 310, x: 0.1, w: 0.9 },
      { start: 500, end: 560, x: -0.05, w: 0.85 },
      { start: 750, end: 810, x: 0.15, w: 0.9 },
      { start: 980, end: 1040, x: 0.0, w: 0.95 }
    ];
  }

  isSegmentInMud(segmentIndex) {
    const wrapped = segmentIndex % this.totalSegments;
    return this.mudPatches.some(m => wrapped >= m.start && wrapped <= m.end);
  }

  project(p, cameraX, cameraY, cameraZ) {
    const relX = p.world.x - cameraX;
    const relY = p.world.y - cameraY;
    const relZ = p.world.z - cameraZ;

    if (relZ <= 0) {
      p.screen.scale = 0;
      return;
    }

    const scale = (this.cameraDepth / relZ);
    p.screen.scale = scale;
    p.screen.x = Math.round((this.canvas.width / 2) + (scale * relX * (this.canvas.width / 2)));
    p.screen.y = Math.round((this.canvas.height / 2) - (scale * relY * (this.canvas.height / 2)));
    p.screen.w = Math.round(scale * this.roadWidth * (this.canvas.width / 2));
  }

  render(state) {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // 1. Background Sky & Deep Forest Silhouette
    const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.6);
    skyGrad.addColorStop(0, '#040705');
    skyGrad.addColorStop(0.65, '#0a140e');
    skyGrad.addColorStop(1, '#112217');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, h);

    // Ground Grass / Forest Floor
    ctx.fillStyle = '#0a130c';
    ctx.fillRect(0, h * 0.45, w, h * 0.55);

    // 2. Camera Positioning & Shake
    const speed = state.speed || 0;
    const cadence = state.cadence || 0;
    const cameraZ = state.cameraZ || 0;
    const isRedline = state.isRedline || false;

    let shakeX = (Math.random() - 0.5) * (speed * 0.35);
    let shakeY = (Math.random() - 0.5) * (speed * 0.35);
    if (isRedline) {
      shakeX += (Math.random() - 0.5) * 8;
      shakeY += (Math.random() - 0.5) * 8;
    }

    // Handlebar Bobbing Phase
    const bobPhase = (cameraZ / 280) + (cadence > 0 ? (performance.now() * 0.008) : 0);
    const bobX = Math.sin(bobPhase) * Math.min(18, cadence * 0.2);
    const bobY = Math.abs(Math.cos(bobPhase)) * Math.min(14, cadence * 0.16);

    const baseSegmentIndex = Math.floor(cameraZ / this.segmentLength);
    const baseSegment = this.segments[baseSegmentIndex % this.totalSegments];
    const cameraY = this.cameraHeight + baseSegment.p1.world.y + shakeY;
    const cameraX = (state.cameraX || 0) * this.roadWidth + shakeX;

    let maxY = h;
    let dx = -(baseSegment.curve * ((cameraZ % this.segmentLength) / this.segmentLength));
    let x = 0;

    // Project Visible Road Segments
    const renderSegments = [];
    for (let n = 0; n < this.drawDistance; n++) {
      const segIndex = (baseSegmentIndex + n) % this.totalSegments;
      const segment = this.segments[segIndex];
      const loopOffset = (baseSegmentIndex + n >= this.totalSegments) ? (this.totalSegments * this.segmentLength) : 0;

      segment.p1.world.z = (segIndex * this.segmentLength) + loopOffset;
      segment.p2.world.z = ((segIndex + 1) * this.segmentLength) + loopOffset;

      segment.p1.world.x = x;
      segment.p2.world.x = x + dx;

      this.project(segment.p1, cameraX, cameraY, cameraZ);
      this.project(segment.p2, cameraX, cameraY, cameraZ);

      x += dx;
      dx += segment.curve;

      if (segment.p1.screen.scale > 0 && segment.p1.screen.y < maxY) {
        renderSegments.push({ segment, segIndex });
      }
    }

    // 3. Draw Road Surfaces (Back to Front)
    for (let i = renderSegments.length - 1; i >= 0; i--) {
      const { segment, segIndex } = renderSegments[i];
      const p1 = segment.p1.screen;
      const p2 = segment.p2.screen;

      if (p2.y >= p1.y) continue;

      // Alternating Dirt Trail Ruts
      const isAlt = (segIndex % 6 < 3);
      const dirtColor = isAlt ? '#3b2819' : '#301f13';
      const bankColor = isAlt ? '#112217' : '#0c1a11';

      // Forest Banks
      ctx.fillStyle = bankColor;
      ctx.fillRect(0, p2.y, w, p1.y - p2.y);

      // Dirt Road
      ctx.fillStyle = dirtColor;
      ctx.beginPath();
      ctx.moveTo(p1.x - p1.w, p1.y);
      ctx.lineTo(p1.x + p1.w, p1.y);
      ctx.lineTo(p2.x + p2.w, p2.y);
      ctx.lineTo(p2.x - p2.w, p2.y);
      ctx.closePath();
      ctx.fill();

      // Tire tracks / ruts
      ctx.fillStyle = '#22140b';
      const rutW1 = p1.w * 0.08;
      const rutW2 = p2.w * 0.08;
      const rutOff1 = p1.w * 0.35;
      const rutOff2 = p2.w * 0.35;
      // Left track
      ctx.beginPath();
      ctx.moveTo(p1.x - rutOff1 - rutW1, p1.y);
      ctx.lineTo(p1.x - rutOff1 + rutW1, p1.y);
      ctx.lineTo(p2.x - rutOff2 + rutW2, p2.y);
      ctx.lineTo(p2.x - rutOff2 - rutW2, p2.y);
      ctx.fill();
      // Right track
      ctx.beginPath();
      ctx.moveTo(p1.x + rutOff1 - rutW1, p1.y);
      ctx.lineTo(p1.x + rutOff1 + rutW1, p1.y);
      ctx.lineTo(p2.x + rutOff2 + rutW2, p2.y);
      ctx.lineTo(p2.x + rutOff2 - rutW2, p2.y);
      ctx.fill();

      // MUD PATCHES: Scaling brown rectangles approaching camera!
      const mud = this.mudPatches.find(m => segIndex >= m.start && segIndex <= m.end);
      if (mud) {
        ctx.fillStyle = '#1c0f06'; // Deep slick mud brown
        const mudCenter1 = p1.x + (mud.x * p1.w);
        const mudCenter2 = p2.x + (mud.x * p2.w);
        const mudW1 = p1.w * mud.w * 0.75;
        const mudW2 = p2.w * mud.w * 0.75;

        ctx.beginPath();
        ctx.moveTo(mudCenter1 - mudW1, p1.y);
        ctx.lineTo(mudCenter1 + mudW1, p1.y);
        ctx.lineTo(mudCenter2 + mudW2, p2.y);
        ctx.lineTo(mudCenter2 - mudW2, p2.y);
        ctx.closePath();
        ctx.fill();

        // Wet mud glossy sheen highlight
        ctx.fillStyle = 'rgba(74, 43, 21, 0.65)';
        ctx.fillRect(mudCenter1 - mudW1 * 0.6, p2.y, mudW1 * 1.2, (p1.y - p2.y) * 0.5);
      }

      // Exponential Forest Gloom Fog
      const relZ = segment.p1.world.z - cameraZ;
      const fogFactor = Math.min(1.0, Math.exp(-relZ * 0.00018));
      if (fogFactor < 0.98) {
        ctx.fillStyle = `rgba(8, 14, 10, ${1.0 - fogFactor})`;
        ctx.fillRect(0, p2.y, w, p1.y - p2.y);
      }

      // Draw Foliage Sprites
      for (const sp of segment.sprites) {
        const sprite = sp.sprite;
        const scale = p1.scale;
        const sw = sprite.width * scale * 5.0;
        const sh = sprite.height * scale * 5.0;
        const sx = p1.x + (scale * sp.offset * this.roadWidth * (w / 2)) - (sw / 2);
        const sy = p1.y - sh;

        if (sx + sw > 0 && sx < w && sy + sh > 0 && sy < h) {
          ctx.drawImage(sprite, sx, sy, sw, sh);
          if (fogFactor < 0.98) {
            ctx.fillStyle = `rgba(8, 14, 10, ${(1.0 - fogFactor) * 0.8})`;
            ctx.fillRect(sx, sy, sw, sh);
          }
        }
      }
    }

    // 4. First-Person MTB Handlebar & Stem Cockpit Overlay
    this._renderCockpit(ctx, w, h, bobX, bobY);
  }

  _renderCockpit(ctx, w, h, bobX, bobY) {
    ctx.save();
    const cx = (w / 2) + bobX;
    const cy = h - 10 + bobY;

    // Handlebar Stem
    ctx.fillStyle = '#1e2421';
    ctx.fillRect(cx - 24, cy - 80, 48, 90);
    ctx.fillStyle = '#0f1311';
    ctx.fillRect(cx - 20, cy - 75, 40, 30);

    // Main Handlebar Crossbar
    ctx.fillStyle = '#262d29';
    ctx.beginPath();
    ctx.roundRect(cx - (w * 0.42), cy - 90, w * 0.84, 26, 12);
    ctx.fill();

    // Rubber Grips
    ctx.fillStyle = '#0a0d0b';
    ctx.fillRect(cx - (w * 0.42), cy - 92, w * 0.12, 30);
    ctx.fillRect(cx + (w * 0.30), cy - 92, w * 0.12, 30);

    // Textured grip ribs
    ctx.strokeStyle = '#1a221d';
    ctx.lineWidth = 2;
    for (let i = 0; i < 8; i++) {
      const gx1 = cx - (w * 0.42) + (i * 12);
      const gx2 = cx + (w * 0.30) + (i * 12);
      ctx.beginPath();
      ctx.moveTo(gx1, cy - 92); ctx.lineTo(gx1, cy - 62); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(gx2, cy - 92); ctx.lineTo(gx2, cy - 62); ctx.stroke();
    }

    // Brake Levers
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(cx - (w * 0.28), cy - 80);
    ctx.lineTo(cx - (w * 0.36), cy - 50);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx + (w * 0.28), cy - 80);
    ctx.lineTo(cx + (w * 0.36), cy - 50);
    ctx.stroke();

    ctx.restore();
  }
}

// ============================================================================
// MODULE 5: STREAMLINED DOM HUD CONTROLLER
// ============================================================================
class HUDController {
  constructor(options = {}) {
    this.options = options;
    this.elements = {
      vignette: document.getElementById('proximity-vignette'),
      predatorStatusIndicator: document.getElementById('predator-status-indicator'),
      predatorStatusLabel: document.getElementById('predator-status-label'),
      predatorDistanceVal: document.getElementById('predator-distance-val'),
      predatorBarFill: document.getElementById('predator-bar-fill'),
      speedVal: document.getElementById('speed-val'),
      cadenceVal: document.getElementById('cadence-val'),
      cadenceDot: document.getElementById('cadence-dot'),
      distanceCoveredVal: document.getElementById('distance-covered-val'),
      staminaFill: document.getElementById('stamina-fill'),
      staminaDebtZone: document.getElementById('stamina-debt-zone'),
      staminaDebtBadge: document.getElementById('stamina-debt-badge'),
      staminaDebtVal: document.getElementById('stamina-debt-val'),
      effortLoadVal: document.getElementById('effort-load-val'),
      redlineAlert: document.getElementById('redline-alert'),
      gearPills: {
        1: document.getElementById('gear-pill-1'),
        2: document.getElementById('gear-pill-2'),
        3: document.getElementById('gear-pill-3')
      },
      screenStart: document.getElementById('screen-start'),
      screenGameOver: document.getElementById('screen-gameover'),
      screenVictory: document.getElementById('screen-victory'),
      btnStart: document.getElementById('btn-start'),
      btnRetry: document.getElementById('btn-retry'),
      btnRestartVictory: document.getElementById('btn-restart-victory'),
      // Stats
      statGoDistance: document.getElementById('stat-go-distance'),
      statGoSpeed: document.getElementById('stat-go-speed'),
      statGoTime: document.getElementById('stat-go-time'),
      statGoRedline: document.getElementById('stat-go-redline'),
      statVicTime: document.getElementById('stat-vic-time'),
      statVicCadence: document.getElementById('stat-vic-cadence'),
      statVicSpeed: document.getElementById('stat-vic-speed'),
      statVicStamina: document.getElementById('stat-vic-stamina')
    };

    this._lastCadencePulse = 0;
    this._initEvents();
  }

  _initEvents() {
    [1, 2, 3].forEach(gear => {
      const pill = this.elements.gearPills[gear];
      if (pill) {
        pill.addEventListener('click', () => {
          if (this.options.onGearChange) this.options.onGearChange(gear);
        });
      }
    });

    if (this.elements.btnStart) {
      this.elements.btnStart.addEventListener('click', () => {
        this.elements.screenStart.classList.remove('active');
        if (this.options.onStart) this.options.onStart();
      });
    }

    if (this.elements.btnRetry) {
      this.elements.btnRetry.addEventListener('click', () => {
        this.elements.screenGameOver.classList.remove('active');
        if (this.options.onRestart) this.options.onRestart();
      });
    }

    if (this.elements.btnRestartVictory) {
      this.elements.btnRestartVictory.addEventListener('click', () => {
        this.elements.screenVictory.classList.remove('active');
        if (this.options.onRestart) this.options.onRestart();
      });
    }
  }

  update(telemetry) {
    const {
      speed, cadence, stamina, maxStamina, gear, effortLoad,
      predatorDistance, predatorState, distanceTraveledMeters, isRedline
    } = telemetry;

    // 1. Speed & Cadence
    this.elements.speedVal.textContent = speed.toFixed(1);
    this.elements.cadenceVal.textContent = Math.round(cadence);

    // Cadence metronome dot pulse
    if (cadence > 20) {
      const interval = 60000 / cadence;
      const now = performance.now();
      if (now - this._lastCadencePulse >= interval) {
        this._lastCadencePulse = now;
        this.elements.cadenceDot.classList.add('beat');
        setTimeout(() => this.elements.cadenceDot.classList.remove('beat'), 80);
      }
    }

    // 2. Stamina Bar & Oxygen Debt Lockout Zone
    const currentPct = Math.max(0, Math.min(100, (stamina / 100.0) * 100));
    const debtPct = Math.max(0, Math.min(85, ((100.0 - maxStamina) / 100.0) * 100));

    this.elements.staminaFill.style.width = `${currentPct}%`;
    this.elements.staminaDebtZone.style.width = `${debtPct}%`;

    // Dynamic color shift: Yellow (#facc15) -> Orange (#f97316) -> Red (#ef4444)
    let staminaColor = '#facc15';
    if (currentPct < 30) staminaColor = '#ef4444';
    else if (currentPct < 65) staminaColor = '#f97316';
    document.documentElement.style.setProperty('--stamina-color', staminaColor);

    // Lactic Debt Badge
    if (debtPct > 2) {
      this.elements.staminaDebtBadge.classList.add('visible');
      this.elements.staminaDebtVal.textContent = `-${Math.round(debtPct)}%`;
    } else {
      this.elements.staminaDebtBadge.classList.remove('visible');
    }

    // Effort Load Pill
    this.elements.effortLoadVal.textContent = `LOAD: ${effortLoad.toFixed(1)}`;
    if (effortLoad > 4.0) {
      this.elements.effortLoadVal.classList.add('danger');
    } else {
      this.elements.effortLoadVal.classList.remove('danger');
    }

    // 3. Redline Status Alert Banner
    if (isRedline) {
      this.elements.redlineAlert.classList.add('visible');
    } else {
      this.elements.redlineAlert.classList.remove('visible');
    }

    // 4. Gear Selection Pills
    [1, 2, 3].forEach(g => {
      const pill = this.elements.gearPills[g];
      if (pill) {
        if (g === gear) pill.classList.add('active');
        else pill.classList.remove('active');
      }
    });

    // 5. Predator Proximity & Pulsing Red Vignette (< 50m)
    const distClamped = Math.max(0, predatorDistance);
    this.elements.predatorDistanceVal.innerHTML = `${distClamped.toFixed(1)} <span class="unit">m</span>`;

    // Proximity meter bar (100m to 0m)
    const proxFillPct = Math.max(0, Math.min(100, (1.0 - (distClamped / 100.0)) * 100));
    this.elements.predatorBarFill.style.width = `${proxFillPct}%`;

    // Status label & indicator
    if (predatorState === 'FRENZY') {
      this.elements.predatorStatusLabel.textContent = 'GRIZZLY: FRENZY RUSH!';
      this.elements.predatorStatusIndicator.style.background = '#ef4444';
      this.elements.predatorStatusIndicator.style.boxShadow = '0 0 16px #ef4444';
    } else if (predatorState === 'FATIGUE') {
      this.elements.predatorStatusLabel.textContent = 'GRIZZLY: FATIGUED';
      this.elements.predatorStatusIndicator.style.background = '#eab308';
      this.elements.predatorStatusIndicator.style.boxShadow = '0 0 10px #eab308';
    } else {
      this.elements.predatorStatusLabel.textContent = distClamped < 50 ? 'GRIZZLY: CLOSING IN' : 'GRIZZLY: TRACKING';
      this.elements.predatorStatusIndicator.style.background = distClamped < 50 ? '#ef4444' : '#10b981';
      this.elements.predatorStatusIndicator.style.boxShadow = distClamped < 50 ? '0 0 14px #ef4444' : '0 0 10px #10b981';
    }

    // Pulsing Red Vignette (< 50m)
    if (distClamped < 50.0) {
      const dangerFactor = (50.0 - distClamped) / 50.0; // 0.0 to 1.0
      const vignetteOpacity = Math.min(0.95, 0.25 + (dangerFactor * 0.70));
      const pulsePeriod = Math.max(0.4, 1.2 - (dangerFactor * 0.75)); // pulses faster as bear nears

      document.documentElement.style.setProperty('--vignette-opacity', vignetteOpacity.toFixed(2));
      document.documentElement.style.setProperty('--pulse-duration', `${pulsePeriod.toFixed(2)}s`);
      this.elements.vignette.classList.add('active-pulse');
    } else {
      document.documentElement.style.setProperty('--vignette-opacity', '0');
      this.elements.vignette.classList.remove('active-pulse');
    }

    // 6. Forest Escape Route Progress
    const kmCovered = (distanceTraveledMeters / 1000.0).toFixed(2);
    this.elements.distanceCoveredVal.textContent = `${kmCovered} km / 2.00 km`;
  }

  showGameOver(stats) {
    this.elements.statGoDistance.textContent = `${(stats.distanceTraveled / 1000).toFixed(2)} km`;
    this.elements.statGoSpeed.textContent = `${stats.topSpeed.toFixed(1)} km/h`;
    this.elements.statGoTime.textContent = stats.timeFormatted;
    this.elements.statGoRedline.textContent = `${stats.redlineTotal.toFixed(1)}s`;
    this.elements.screenGameOver.classList.add('active');
  }

  showVictory(stats) {
    this.elements.statVicTime.textContent = stats.timeFormatted;
    this.elements.statVicCadence.textContent = `${Math.round(stats.avgCadence)} RPM`;
    this.elements.statVicSpeed.textContent = `${stats.topSpeed.toFixed(1)} km/h`;
    this.elements.statVicStamina.textContent = `${Math.round(stats.finalStamina)}%`;
    this.elements.screenVictory.classList.add('active');
  }
}

// ============================================================================
// MODULE 6: MASTER GAME CONTROLLER & EXECUTION LOOP
// ============================================================================
class SurvivalCyclingGame {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.renderer = new ForestTrailRenderer(this.canvas);
    this.physics = new CyclingPhysicsEngine();
    this.predator = new PredatorAI({ initialDistance: 80.0 });
    this.audio = new GameAudioEngine();

    this.hud = new HUDController({
      onStart: () => this.start(),
      onRestart: () => this.restart(),
      onGearChange: (gear) => {
        this.physics.setGear(gear);
        this.audio.playGearShift();
      }
    });

    this.isRunning = false;
    this.isFinished = false;
    this.lastFrameTime = performance.now();

    // Run Telemetry tracking
    this.distanceTraveledMeters = 0;
    this.targetEscapeMeters = 2000; // 2.0 km to escape
    this.topSpeed = 0;
    this.elapsedSeconds = 0;
    this.redlineSeconds = 0;
    this.cadenceReadings = [];

    this._bindEvents();
    this._setupSubagentHooks();
  }

  _bindEvents() {
    // Keyboard Event Routing: 'W' (pedal) and ArrowUp/ArrowDown (shift gears)
    window.addEventListener('keydown', (e) => {
      // Audio autoplay unlock on any key
      if (!this.audio.isPlaying && this.isRunning) {
        this.audio.start();
      }

      // Check gear shift keys for audio feedback
      const prevGear = this.physics.gear;
      this.physics.handleKeyDown(e);
      if (this.physics.gear !== prevGear) {
        this.audio.playGearShift();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.physics.handleKeyUp(e);
    });

    // Touch / Click on canvas also triggers pedaling tap
    this.canvas.addEventListener('pointerdown', () => {
      if (!this.audio.isPlaying && this.isRunning) {
        this.audio.start();
      }
      this.physics.registerTap();
    });
  }

  _setupSubagentHooks() {
    // 1. Physics Engine Events
    this.physics.onRedlineStart = () => {
      // Broadcast Frenzy to Predator
    };
    this.physics.onRedlineEnd = () => {};

    // 2. Predator AI Events
    this.predator.onFrenzyTrigger = () => {
      this.audio.onFrenzyStart();
    };

    this.predator.onStateChange = (newState, oldState) => {
      if (oldState === 'FRENZY' && newState !== 'FRENZY') {
        this.audio.onFrenzyEnd();
      }
    };

    this.predator.onCaught = () => {
      this.gameOverMauled();
    };
  }

  start() {
    this.isRunning = true;
    this.isFinished = false;
    this.lastFrameTime = performance.now();
    this.audio.start();
    requestAnimationFrame((t) => this._loop(t));
  }

  restart() {
    this.physics.reset();
    this.predator.reset();
    this.distanceTraveledMeters = 0;
    this.topSpeed = 0;
    this.elapsedSeconds = 0;
    this.redlineSeconds = 0;
    this.cadenceReadings = [];
    this.isRunning = true;
    this.isFinished = false;
    this.lastFrameTime = performance.now();
    this.audio.start();
  }

  gameOverMauled() {
    this.isRunning = false;
    this.isFinished = true;
    this.audio.playDeath();

    const mins = Math.floor(this.elapsedSeconds / 60);
    const secs = Math.floor(this.elapsedSeconds % 60);
    const timeFormatted = `${mins}:${secs < 10 ? '0' : ''}${secs}`;

    this.hud.showGameOver({
      distanceTraveled: this.distanceTraveledMeters,
      topSpeed: this.topSpeed,
      timeFormatted,
      redlineTotal: this.redlineSeconds
    });
  }

  victoryEscaped() {
    this.isRunning = false;
    this.isFinished = true;

    const mins = Math.floor(this.elapsedSeconds / 60);
    const secs = Math.floor(this.elapsedSeconds % 60);
    const timeFormatted = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    const avgCadence = this.cadenceReadings.length > 0
      ? this.cadenceReadings.reduce((a, b) => a + b, 0) / this.cadenceReadings.length
      : 0;

    this.hud.showVictory({
      timeFormatted,
      avgCadence,
      topSpeed: this.topSpeed,
      finalStamina: this.physics.stamina
    });
  }

  _loop(currentTime) {
    if (!this.isRunning) {
      // Still render static/paused canvas if needed
      requestAnimationFrame((t) => this._loop(t));
      return;
    }

    const dt = Math.min(0.064, (currentTime - this.lastFrameTime) / 1000.0);
    this.lastFrameTime = currentTime;

    // 1. Track Terrain & Mud Intersection
    // Map current camera distance to road segment
    const segmentIndex = Math.floor((this.distanceTraveledMeters * 10.0) / this.renderer.segmentLength);
    const inMud = this.renderer.isSegmentInMud(segmentIndex);

    // 2. Physics & Oxygen Debt Update
    this.physics.update(dt, inMud, 2.8);

    // Update Telemetry Records
    if (this.physics.speed > this.topSpeed) this.topSpeed = this.physics.speed;
    this.elapsedSeconds += dt;
    if (this.physics.isRedline) this.redlineSeconds += dt;
    if (this.physics.cadenceRpm > 10) this.cadenceReadings.push(this.physics.cadenceRpm);

    // Integrate cyclist distance traveled along the forest fire road
    const deltaMeters = this.physics.speed * (1000.0 / 3600.0) * dt;
    this.distanceTraveledMeters += deltaMeters;

    // 3. Predator AI Behavior Tree Update
    this.predator.update(dt, this.physics.speed, 45.0, this.physics.isRedline);

    // 4. Procedural Audio Engine Update
    this.audio.update(
      dt,
      this.physics.cadenceRpm,
      this.predator.state === 'FRENZY',
      this.physics.stamina / 100.0,
      inMud
    );

    // 5. Outrun Pseudo-3D Canvas Rendering
    this.renderer.render({
      speed: this.physics.speed,
      cadence: this.physics.cadenceRpm,
      cameraZ: this.distanceTraveledMeters * 10.0, // Scale to world units
      cameraX: 0,
      isRedline: this.physics.isRedline,
      predatorDistance: this.predator.distance
    });

    // 6. Streamlined DOM HUD Overlay Update
    this.hud.update({
      speed: this.physics.speed,
      cadence: this.physics.cadenceRpm,
      stamina: this.physics.stamina,
      maxStamina: this.physics.maxStamina,
      gear: this.physics.gear,
      effortLoad: this.physics.effortLoad,
      predatorDistance: this.predator.distance,
      predatorState: this.predator.state,
      distanceTraveledMeters: this.distanceTraveledMeters,
      isRedline: this.physics.isRedline
    });

    // Check Victory condition: 2.0 km forest fire road completed
    if (this.distanceTraveledMeters >= this.targetEscapeMeters && !this.isFinished) {
      this.victoryEscaped();
    }

    requestAnimationFrame((t) => this._loop(t));
  }
}

// Initialize and start on DOM load
window.addEventListener('DOMContentLoaded', () => {
  window.game = new SurvivalCyclingGame();
});
