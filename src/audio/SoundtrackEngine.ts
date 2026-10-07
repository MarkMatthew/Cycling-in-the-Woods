/**
 * Original 1980s Pop-Rock Instrumental Soundtrack Engine
 * Full-band arrangement: Drums (gated snare), Bass, Rhythm Guitar, Synth Hook, Danger Stem
 * Grizzly Run - Web Audio API Implementation
 */

import { Storage } from '../utils/Storage';
import { GAME_CONFIG } from '../config';

export class SoundtrackEngine {
  private ctx: AudioContext | null = null;
  private masterMusicGain: GainNode | null = null;
  private baseGain: GainNode | null = null;
  private dangerGain: GainNode | null = null;

  private isUnlocked = false;
  private isPlaying = false;
  private currentTrackType: 'title' | 'gameplay' | 'victory' | 'defeat' | null = null;

  // Stems and loops
  private titleBuffer: AudioBuffer | null = null;
  private gameplayBaseBuffer: AudioBuffer | null = null;
  private gameplayDangerBuffer: AudioBuffer | null = null;
  private victoryBuffer: AudioBuffer | null = null;
  private defeatBuffer: AudioBuffer | null = null;

  private baseSource: AudioBufferSourceNode | null = null;
  private dangerSource: AudioBufferSourceNode | null = null;
  private singleSource: AudioBufferSourceNode | null = null;

  // Danger hysteresis
  private isDangerActive = false;

  constructor() {
    this._initAudio();
  }

  private _initAudio(): void {
    if (typeof window === 'undefined') return;
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    this.ctx = new AudioCtx();
    this.masterMusicGain = this.ctx.createGain();
    this.masterMusicGain.connect(this.ctx.destination);

    this.baseGain = this.ctx.createGain();
    this.baseGain.connect(this.masterMusicGain);

    this.dangerGain = this.ctx.createGain();
    this.dangerGain.gain.setValueAtTime(0.001, this.ctx.currentTime);
    this.dangerGain.connect(this.masterMusicGain);

    this.updateVolume();

    // Browser autoplay unlock listeners
    const unlock = () => {
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().then(() => {
          this.isUnlocked = true;
          this._prebakeBuffers();
        }).catch(() => {});
      } else {
        this.isUnlocked = true;
        this._prebakeBuffers();
      }
    };

    ['pointerdown', 'keydown', 'touchstart'].forEach(evt => {
      window.addEventListener(evt, unlock, { once: true, passive: true });
    });
  }

  public ensureUnlocked(): void {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    if (!this.gameplayBaseBuffer) {
      this._prebakeBuffers();
    }
  }

  public updateVolume(): void {
    if (!this.ctx || !this.masterMusicGain) return;
    const settings = Storage.getSettings();
    if (settings.masterMute) {
      this.masterMusicGain.gain.setValueAtTime(0, this.ctx.currentTime);
    } else {
      this.masterMusicGain.gain.setValueAtTime(settings.musicVolume, this.ctx.currentTime);
    }
  }

  // --------------------------------------------------------------------------
  // Playback Controls
  // --------------------------------------------------------------------------

  public playTitle(): void {
    if (this.currentTrackType === 'title' && this.isPlaying) return;
    this.stopAll();
    this.ensureUnlocked();
    if (!this.ctx || !this.titleBuffer) return;

    this.currentTrackType = 'title';
    this.singleSource = this.ctx.createBufferSource();
    this.singleSource.buffer = this.titleBuffer;
    this.singleSource.loop = true;
    this.singleSource.connect(this.baseGain!);
    this.singleSource.start(0);
    this.isPlaying = true;
  }

  public playGameLoop(): void {
    if (this.currentTrackType === 'gameplay' && this.isPlaying) return;
    this.stopAll();
    this.ensureUnlocked();
    if (!this.ctx || !this.gameplayBaseBuffer || !this.gameplayDangerBuffer) return;

    this.currentTrackType = 'gameplay';
    this.isDangerActive = false;
    const now = this.ctx.currentTime;

    // Reset stem gains
    this.baseGain!.gain.cancelScheduledValues(now);
    this.baseGain!.gain.setValueAtTime(1.0, now);

    this.dangerGain!.gain.cancelScheduledValues(now);
    this.dangerGain!.gain.setValueAtTime(0.001, now);

    // Create synchronized dual-stem loop
    this.baseSource = this.ctx.createBufferSource();
    this.baseSource.buffer = this.gameplayBaseBuffer;
    this.baseSource.loop = true;
    this.baseSource.connect(this.baseGain!);

    this.dangerSource = this.ctx.createBufferSource();
    this.dangerSource.buffer = this.gameplayDangerBuffer;
    this.dangerSource.loop = true;
    this.dangerSource.connect(this.dangerGain!);

    this.baseSource.start(now);
    this.dangerSource.start(now);
    this.isPlaying = true;
  }

  public playGameplay(): void {
    this.playGameLoop();
  }

  public updateDangerStem(bearDistanceM: number): void {
    this.updateDangerLevel(bearDistanceM);
  }

  /**
   * Updates bear proximity danger stem with hysteresis.
   * @param bearDistanceM Actual distance in meters
   */
  public updateDangerLevel(bearDistanceM: number): void {
    if (this.currentTrackType !== 'gameplay' || !this.ctx || !this.dangerGain) return;

    const DANGER_TRIGGER = GAME_CONFIG.BEAR.DANGER_DISTANCE_M; // 14m
    const DANGER_RELEASE = GAME_CONFIG.BEAR.DANGER_HYSTERESIS_M; // 18m

    const now = this.ctx.currentTime;

    if (!this.isDangerActive && bearDistanceM <= DANGER_TRIGGER) {
      this.isDangerActive = true;
      // Crossfade danger lead guitar & rapid cymbals in over 0.4s
      this.dangerGain.gain.cancelScheduledValues(now);
      this.dangerGain.gain.setValueAtTime(Math.max(0.001, this.dangerGain.gain.value), now);
      this.dangerGain.gain.linearRampToValueAtTime(1.0, now + 0.4);
    } else if (this.isDangerActive && bearDistanceM >= DANGER_RELEASE) {
      this.isDangerActive = false;
      // Fade danger stem out smoothly over 0.8s
      this.dangerGain.gain.cancelScheduledValues(now);
      this.dangerGain.gain.setValueAtTime(Math.max(0.001, this.dangerGain.gain.value), now);
      this.dangerGain.gain.linearRampToValueAtTime(0.001, now + 0.8);
    }
  }

  public playVictory(): void {
    this.stopAll();
    this.ensureUnlocked();
    if (!this.ctx || !this.victoryBuffer) return;

    this.currentTrackType = 'victory';
    this.singleSource = this.ctx.createBufferSource();
    this.singleSource.buffer = this.victoryBuffer;
    this.singleSource.loop = false;
    this.singleSource.connect(this.baseGain!);
    this.singleSource.start(0);
    this.isPlaying = true;
  }

  public playDefeat(): void {
    this.stopAll();
    this.ensureUnlocked();
    if (!this.ctx || !this.defeatBuffer) return;

    this.currentTrackType = 'defeat';
    this.singleSource = this.ctx.createBufferSource();
    this.singleSource.buffer = this.defeatBuffer;
    this.singleSource.loop = false;
    this.singleSource.connect(this.baseGain!);
    this.singleSource.start(0);
    this.isPlaying = true;
  }

  public pause(): void {
    if (this.ctx && this.ctx.state === 'running') {
      this.ctx.suspend().catch(() => {});
    }
  }

  public resume(): void {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public stopAll(): void {
    if (this.baseSource) {
      try { this.baseSource.stop(); this.baseSource.disconnect(); } catch {}
      this.baseSource = null;
    }
    if (this.dangerSource) {
      try { this.dangerSource.stop(); this.dangerSource.disconnect(); } catch {}
      this.dangerSource = null;
    }
    if (this.singleSource) {
      try { this.singleSource.stop(); this.singleSource.disconnect(); } catch {}
      this.singleSource = null;
    }
    this.isPlaying = false;
    this.currentTrackType = null;
  }

  // --------------------------------------------------------------------------
  // Procedural Music Synthesis (Zero External Files)
  // --------------------------------------------------------------------------

  private _prebakeBuffers(): void {
    if (!this.ctx) return;
    try {
      this.titleBuffer = this._renderTitleTheme();
      this.gameplayBaseBuffer = this._renderGameplayBase();
      this.gameplayDangerBuffer = this._renderGameplayDanger();
      this.victoryBuffer = this._renderVictoryFanfare();
      this.defeatBuffer = this._renderDefeatSting();
    } catch (e) {
      console.warn('SoundtrackEngine prebake error:', e);
    }
  }

  /**
   * Title Screen Theme (8 bars @ 132 BPM, ~14.5s loop)
   */
  private _renderTitleTheme(): AudioBuffer {
    const sr = this.ctx!.sampleRate || 44100;
    const bpm = 132;
    const beatSec = 60 / bpm;
    const totalBars = 8;
    const totalSec = totalBars * 4 * beatSec;
    const totalSamples = Math.floor(sr * totalSec);

    const buf = this.ctx!.createBuffer(2, totalSamples, sr);
    const left = buf.getChannelData(0);
    const right = buf.getChannelData(1);

    // D minor / F / G / Bb 1980s Pop Rock Progression
    const chords = [
      { root: 146.83, name: 'Dm' }, // D3
      { root: 174.61, name: 'F' },  // F3
      { root: 196.00, name: 'G' },  // G3
      { root: 116.54, name: 'Bb' }  // Bb2
    ];

    const leadHook = [
      587.33, 659.25, 698.46, 587.33, 880.0, 783.99, 698.46, 659.25
    ];

    for (let bar = 0; bar < totalBars; bar++) {
      const chord = chords[bar % chords.length];
      const barStart = Math.floor(bar * 4 * beatSec * sr);

      // 1. Kick on 1 and 3, Snare on 2 and 4
      for (let beat = 0; beat < 4; beat++) {
        const beatStart = barStart + Math.floor(beat * beatSec * sr);
        if (beat === 0 || beat === 2) {
          this._synthRockKick(left, right, beatStart, sr);
        } else {
          this._synthGatedSnare(left, right, beatStart, sr);
        }
        // 8th-note hi-hats
        this._synthHiHat(left, right, beatStart, sr);
        this._synthHiHat(left, right, beatStart + Math.floor(0.5 * beatSec * sr), sr);
      }

      // 2. Punchy Picked Bass
      const bassFreq = chord.root * 0.5;
      for (let eighth = 0; eighth < 8; eighth++) {
        const eighthStart = barStart + Math.floor(eighth * 0.5 * beatSec * sr);
        this._synthPickedBass(left, right, eighthStart, bassFreq, sr);
      }

      // 3. Crunchy Rhythm Guitar Power Chord Chug
      for (let eighth = 0; eighth < 8; eighth++) {
        const eighthStart = barStart + Math.floor(eighth * 0.5 * beatSec * sr);
        this._synthGuitarChug(left, right, eighthStart, chord.root, sr);
      }

      // 4. Anthemic Analog Poly-Synth Melody
      const melodyNote = leadHook[(bar * 2) % leadHook.length];
      this._synthAnalogLead(left, right, barStart, melodyNote, Math.floor(2 * beatSec * sr), sr);
      const melodyNote2 = leadHook[(bar * 2 + 1) % leadHook.length];
      this._synthAnalogLead(left, right, barStart + Math.floor(2 * beatSec * sr), melodyNote2, Math.floor(2 * beatSec * sr), sr);
    }

    this._normalize(buf, 0.90);
    return buf;
  }

  /**
   * Gameplay Base Stem (32 bars @ 132 BPM, ~58.2s seamless loop)
   */
  private _renderGameplayBase(): AudioBuffer {
    const sr = this.ctx!.sampleRate || 44100;
    const bpm = 132;
    const beatSec = 60 / bpm;
    const totalBars = 32;
    const totalSec = totalBars * 4 * beatSec;
    const totalSamples = Math.floor(sr * totalSec);

    const buf = this.ctx!.createBuffer(2, totalSamples, sr);
    const left = buf.getChannelData(0);
    const right = buf.getChannelData(1);

    // 1980s Driving Adventure Montage Progression
    const chordPattern = [
      146.83, 146.83, 174.61, 196.00, // Dm, Dm, F, G
      146.83, 146.83, 233.08, 220.00, // Dm, Dm, Bb, A
      174.61, 196.00, 146.83, 146.83, // F, G, Dm, Dm
      233.08, 220.00, 146.83, 146.83  // Bb, A, Dm, Dm
    ];

    const leadChorus = [
      587.33, 659.25, 698.46, 880.00, 783.99, 698.46, 659.25, 587.33,
      880.00, 1046.50, 880.00, 783.99, 698.46, 783.99, 880.00, 587.33
    ];

    for (let bar = 0; bar < totalBars; bar++) {
      const rootFreq = chordPattern[bar % chordPattern.length];
      const barStart = Math.floor(bar * 4 * beatSec * sr);

      // Drum Kit: Gated-Reverb Snare + Driving 8th Kick
      for (let beat = 0; beat < 4; beat++) {
        const beatStart = barStart + Math.floor(beat * beatSec * sr);
        if (beat === 0 || beat === 2 || (bar % 4 === 3 && beat === 3)) {
          this._synthRockKick(left, right, beatStart, sr);
        }
        if (beat === 1 || beat === 3) {
          this._synthGatedSnare(left, right, beatStart, sr);
        }
        // 16th-note driving hi-hats
        for (let sixteenth = 0; sixteenth < 4; sixteenth++) {
          const hStart = beatStart + Math.floor(sixteenth * 0.25 * beatSec * sr);
          const accent = sixteenth === 0 || sixteenth === 2;
          this._synthHiHat(left, right, hStart, sr, accent ? 0.16 : 0.08);
        }
      }

      // Driving 8th-note Electric/Synth Bass
      const bassFreq = rootFreq * 0.5;
      for (let eighth = 0; eighth < 8; eighth++) {
        const eighthStart = barStart + Math.floor(eighth * 0.5 * beatSec * sr);
        this._synthPickedBass(left, right, eighthStart, bassFreq, sr);
      }

      // Overdriven Electric Rhythm Guitar Chug
      for (let eighth = 0; eighth < 8; eighth++) {
        const eighthStart = barStart + Math.floor(eighth * 0.5 * beatSec * sr);
        this._synthGuitarChug(left, right, eighthStart, rootFreq, sr);
      }

      // Anthemic 1980s Lead Synth Hook (plays in bars 8-24)
      if (bar >= 8 && bar < 24) {
        const noteIdx = (bar - 8) % leadChorus.length;
        const noteFreq = leadChorus[noteIdx];
        this._synthAnalogLead(left, right, barStart, noteFreq, Math.floor(3 * beatSec * sr), sr);
      }
    }

    this._normalize(buf, 0.92);
    return buf;
  }

  /**
   * Gameplay Danger Stem (Synchronized screaming lead guitar & rapid cymbals)
   */
  private _renderGameplayDanger(): AudioBuffer {
    const sr = this.ctx!.sampleRate || 44100;
    const bpm = 132;
    const beatSec = 60 / bpm;
    const totalBars = 32;
    const totalSec = totalBars * 4 * beatSec;
    const totalSamples = Math.floor(sr * totalSec);

    const buf = this.ctx!.createBuffer(2, totalSamples, sr);
    const left = buf.getChannelData(0);
    const right = buf.getChannelData(1);

    // Screaming Lead Guitar solo countermelodies & ride cymbal frenzy
    const dangerArp = [
      880.00, 1046.50, 1174.66, 1318.51, 1046.50, 880.00, 1174.66, 1046.50
    ];

    for (let bar = 0; bar < totalBars; bar++) {
      const barStart = Math.floor(bar * 4 * beatSec * sr);

      // Blistering 16th Ride Cymbals & Snare Rolls
      for (let sixteenth = 0; sixteenth < 16; sixteenth++) {
        const sStart = barStart + Math.floor(sixteenth * 0.25 * beatSec * sr);
        this._synthRideCymbal(left, right, sStart, sr);
        if (bar % 4 === 3 && sixteenth >= 8) {
          this._synthGatedSnare(left, right, sStart, sr, 0.22);
        }
      }

      // High-gain Screaming Lead Guitar Arpeggios
      for (let step = 0; step < 8; step++) {
        const stepStart = barStart + Math.floor(step * 0.5 * beatSec * sr);
        const noteFreq = dangerArp[(bar * 2 + step) % dangerArp.length];
        this._synthSoloGuitar(left, right, stepStart, noteFreq, Math.floor(0.48 * beatSec * sr), sr);
      }
    }

    this._normalize(buf, 0.88);
    return buf;
  }

  /**
   * Victory Fanfare (4 bars triumphant brass & guitar resolution)
   */
  private _renderVictoryFanfare(): AudioBuffer {
    const sr = this.ctx!.sampleRate || 44100;
    const totalSec = 5.5;
    const totalSamples = Math.floor(sr * totalSec);

    const buf = this.ctx!.createBuffer(2, totalSamples, sr);
    const left = buf.getChannelData(0);
    const right = buf.getChannelData(1);

    // D Major triumphant resolution chords: G -> A -> D Major
    const fanNotes = [
      { t: 0.0, f: 587.33, dur: 0.35 }, // D5
      { t: 0.4, f: 659.25, dur: 0.35 }, // E5
      { t: 0.8, f: 739.99, dur: 0.35 }, // F#5
      { t: 1.2, f: 880.00, dur: 0.8 },  // A5
      { t: 2.1, f: 739.99, dur: 0.35 }, // F#5
      { t: 2.5, f: 880.00, dur: 0.35 }, // A5
      { t: 2.9, f: 1174.66, dur: 2.2 }  // D6 (Grand Sustained Finish)
    ];

    fanNotes.forEach(n => {
      const start = Math.floor(n.t * sr);
      const len = Math.floor(n.dur * sr);
      this._synthAnalogLead(left, right, start, n.f, len, sr);
      this._synthPickedBass(left, right, start, n.f * 0.25, sr);
      this._synthRockKick(left, right, start, sr);
      this._synthGatedSnare(left, right, start + Math.floor(0.2 * sr), sr);
    });

    this._normalize(buf, 0.94);
    return buf;
  }

  /**
   * Defeat Sting (2 bars dramatic descending minor power chords)
   */
  private _renderDefeatSting(): AudioBuffer {
    const sr = this.ctx!.sampleRate || 44100;
    const totalSec = 3.6;
    const totalSamples = Math.floor(sr * totalSec);

    const buf = this.ctx!.createBuffer(2, totalSamples, sr);
    const left = buf.getChannelData(0);
    const right = buf.getChannelData(1);

    const defeatChords = [
      { t: 0.0, f: 220.00, dur: 0.4 }, // A
      { t: 0.45, f: 196.00, dur: 0.4 }, // G
      { t: 0.9, f: 174.61, dur: 0.4 }, // F
      { t: 1.4, f: 146.83, dur: 2.0 }  // Dm (Final Low Minor Crash)
    ];

    defeatChords.forEach(c => {
      const start = Math.floor(c.t * sr);
      const len = Math.floor(c.dur * sr);
      this._synthGuitarChug(left, right, start, c.f, sr);
      this._synthPickedBass(left, right, start, c.f * 0.5, sr);
      this._synthRockKick(left, right, start, sr);
    });

    // Crash cymbal
    this._synthCrashCymbal(left, right, Math.floor(1.4 * sr), sr);

    this._normalize(buf, 0.92);
    return buf;
  }

  // --------------------------------------------------------------------------
  // Instrument DSP Synthesizers
  // --------------------------------------------------------------------------

  private _synthRockKick(left: Float32Array, right: Float32Array, start: number, sr: number): void {
    const len = Math.floor(0.28 * sr);
    for (let i = 0; i < len; i++) {
      if (start + i >= left.length) break;
      const t = i / sr;
      const freq = 48 + 120 * Math.exp(-t / 0.028);
      const env = Math.exp(-t / 0.12);
      const sample = Math.sin(2 * Math.PI * freq * t) * env * 0.95;
      left[start + i] += sample;
      right[start + i] += sample;
    }
  }

  private _synthGatedSnare(left: Float32Array, right: Float32Array, start: number, sr: number, gain = 0.48): void {
    const len = Math.floor(0.22 * sr); // Gated hard cutoff
    let noiseState = 0;
    for (let i = 0; i < len; i++) {
      if (start + i >= left.length) break;
      const t = i / sr;
      const tone = Math.sin(2 * Math.PI * 195 * t) * Math.exp(-t / 0.06) * 0.5;
      const white = Math.random() * 2 - 1;
      noiseState = 0.8 * noiseState + 0.2 * white;
      const noise = noiseState * 0.7;
      // 80s Gated Reverb Envelope: flat and punchy, abrupt cut at 200ms
      const env = (1.0 - (i / len) * 0.25) * gain;
      const s = Math.tanh((tone + noise) * 1.5) * env;
      left[start + i] += s;
      right[start + i] += s;
    }
  }

  private _synthHiHat(left: Float32Array, right: Float32Array, start: number, sr: number, gain = 0.14): void {
    const len = Math.floor(0.035 * sr);
    for (let i = 0; i < len; i++) {
      if (start + i >= left.length) break;
      const t = i / sr;
      const h = (Math.random() * 2 - 1) * Math.exp(-t / 0.012) * gain;
      left[start + i] += h;
      right[start + i] += h * 0.9;
    }
  }

  private _synthRideCymbal(left: Float32Array, right: Float32Array, start: number, sr: number): void {
    const len = Math.floor(0.08 * sr);
    for (let i = 0; i < len; i++) {
      if (start + i >= left.length) break;
      const t = i / sr;
      const ping = Math.sin(2 * Math.PI * 5400 * t) * 0.3;
      const noise = (Math.random() * 2 - 1) * 0.7;
      const s = (ping + noise) * Math.exp(-t / 0.035) * 0.12;
      left[start + i] += s * 0.8;
      right[start + i] += s * 1.1;
    }
  }

  private _synthCrashCymbal(left: Float32Array, right: Float32Array, start: number, sr: number): void {
    const len = Math.floor(1.2 * sr);
    let n = 0;
    for (let i = 0; i < len; i++) {
      if (start + i >= left.length) break;
      const t = i / sr;
      n = 0.88 * n + 0.12 * (Math.random() * 2 - 1);
      const s = n * Math.exp(-t / 0.45) * 0.35;
      left[start + i] += s;
      right[start + i] += s;
    }
  }

  private _synthPickedBass(left: Float32Array, right: Float32Array, start: number, freq: number, sr: number): void {
    const len = Math.floor(0.24 * sr);
    for (let i = 0; i < len; i++) {
      if (start + i >= left.length) break;
      const t = i / sr;
      const sub = Math.sin(2 * Math.PI * freq * t);
      const harm2 = Math.sin(2 * Math.PI * (freq * 2) * t) * 0.4;
      const click = Math.sin(2 * Math.PI * 1800 * t) * Math.exp(-t / 0.005) * 0.3;
      const env = Math.exp(-t / 0.15) * 0.45;
      const s = Math.tanh((sub + harm2 + click) * 1.4) * env;
      left[start + i] += s;
      right[start + i] += s;
    }
  }

  private _synthGuitarChug(left: Float32Array, right: Float32Array, start: number, root: number, sr: number): void {
    const len = Math.floor(0.22 * sr);
    const fifth = root * 1.498; // Power chord fifth
    const octave = root * 2.0;

    for (let i = 0; i < len; i++) {
      if (start + i >= left.length) break;
      const t = i / sr;
      const saw1 = (2 * ((t * root) % 1) - 1);
      const saw2 = (2 * ((t * fifth) % 1) - 1) * 0.8;
      const saw3 = (2 * ((t * octave) % 1) - 1) * 0.5;
      const env = Math.exp(-t / 0.11) * 0.28;
      // High-gain waveshaper overdrive
      const raw = (saw1 + saw2 + saw3) * 2.5;
      const s = Math.tanh(raw) * env;
      left[start + i] += s * 1.05;
      right[start + i] += s * 0.95;
    }
  }

  private _synthAnalogLead(left: Float32Array, right: Float32Array, start: number, freq: number, len: number, sr: number): void {
    for (let i = 0; i < len; i++) {
      if (start + i >= left.length) break;
      const t = i / sr;
      // Dual oscillator with chorusing detune
      const osc1 = (2 * ((t * freq) % 1) - 1);
      const osc2 = (2 * ((t * (freq * 1.004)) % 1) - 1);
      const vibrato = Math.sin(2 * Math.PI * 5.5 * t) * (t > 0.15 ? 0.008 : 0);
      const sub = Math.sin(2 * Math.PI * (freq * (1 + vibrato) * 0.5) * t) * 0.3;

      const attack = Math.min(1.0, i / (0.02 * sr));
      const decay = Math.exp(-t / (len / sr * 1.2));
      const env = attack * decay * 0.32;

      const s = Math.tanh((osc1 + osc2 + sub) * 1.2) * env;
      left[start + i] += s * 0.95;
      right[start + i] += s * 1.05;
    }
  }

  private _synthSoloGuitar(left: Float32Array, right: Float32Array, start: number, freq: number, len: number, sr: number): void {
    for (let i = 0; i < len; i++) {
      if (start + i >= left.length) break;
      const t = i / sr;
      const vibrato = Math.sin(2 * Math.PI * 6.5 * t) * 0.015;
      const f = freq * (1 + vibrato);
      const saw = (2 * ((t * f) % 1) - 1);
      const sq = (Math.sin(2 * Math.PI * f * t) > 0 ? 0.6 : -0.6);
      const env = Math.min(1.0, i / (0.015 * sr)) * Math.exp(-t / (len / sr * 1.1)) * 0.30;
      const s = Math.tanh((saw + sq) * 3.0) * env;
      left[start + i] += s * 1.1;
      right[start + i] += s * 0.9;
    }
  }

  private _normalize(buffer: AudioBuffer, peak = 0.92): void {
    const l = buffer.getChannelData(0);
    const r = buffer.getChannelData(1);
    let max = 0;
    for (let i = 0; i < l.length; i++) {
      const a = Math.abs(l[i]);
      const b = Math.abs(r[i]);
      if (a > max) max = a;
      if (b > max) max = b;
    }
    if (max > 0.001) {
      const scale = peak / max;
      for (let i = 0; i < l.length; i++) {
        l[i] *= scale;
        r[i] *= scale;
      }
    }
  }
}

export const Music = new SoundtrackEngine();
