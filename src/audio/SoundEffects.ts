/**
 * Procedural 16-Bit Retro Sound Effects Generator
 * Grizzly Run - Web Audio API Implementation
 */

import { Storage } from '../utils/Storage';

export class SoundEffects {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isUnlocked = false;

  constructor() {
    this._initContext();
  }

  private _initContext(): void {
    if (typeof window === 'undefined') return;
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    this.ctx = new AudioCtx();
    this.masterGain = this.ctx.createGain();
    this.masterGain.connect(this.ctx.destination);
    this.updateVolume();

    // Browser autoplay unlock listeners
    const unlock = () => {
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().then(() => {
          this.isUnlocked = true;
        }).catch(() => {});
      } else {
        this.isUnlocked = true;
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
  }

  public updateVolume(): void {
    if (!this.ctx || !this.masterGain) return;
    const settings = Storage.getSettings();
    if (settings.masterMute) {
      this.masterGain.gain.setValueAtTime(0, this.ctx.currentTime);
    } else {
      this.masterGain.gain.setValueAtTime(settings.sfxVolume, this.ctx.currentTime);
    }
  }

  // --- Sound Effects ---

  /** Rhythmic mechanical pedal chain tick */
  playPedal(): void {
    if (!this.ctx || !this.masterGain || !this.isUnlocked) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(480, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.035);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.04);
  }

  /** Retro rising jump chirp; frequency scales with charge ratio */
  playJump(chargeRatio = 0): void {
    if (!this.ctx || !this.masterGain || !this.isUnlocked) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    const startFreq = 180 + chargeRatio * 120;
    const endFreq = 420 + chargeRatio * 320;

    osc.type = 'square';
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(endFreq, now + 0.16);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

    // Filter to soften harsh square edges
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2200, now);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.17);
  }

  /** Thump and crunch landing feedback */
  playLand(): void {
    if (!this.ctx || !this.masterGain || !this.isUnlocked) return;
    const now = this.ctx.currentTime;
    
    // Sub thump
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.exponentialRampToValueAtTime(32, now + 0.09);

    gain.gain.setValueAtTime(0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.1);

    // Dirt crunch noise
    const noiseLen = Math.floor(this.ctx.sampleRate * 0.06);
    const buf = this.ctx.createBuffer(1, noiseLen, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < noiseLen; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (noiseLen * 0.3));
    }
    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = buf;
    const nFilter = this.ctx.createBiquadFilter();
    nFilter.type = 'bandpass';
    nFilter.frequency.setValueAtTime(650, now);

    const nGain = this.ctx.createGain();
    nGain.gain.setValueAtTime(0.18, now);
    nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    noiseSource.connect(nFilter);
    nFilter.connect(nGain);
    nGain.connect(this.masterGain);
    noiseSource.start(now);
  }

  /** Grit and mud tire skid sound */
  playSkid(): void {
    if (!this.ctx || !this.masterGain || !this.isUnlocked) return;
    const now = this.ctx.currentTime;
    const duration = 0.28;

    const len = Math.floor(this.ctx.sampleRate * duration);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      const white = Math.random() * 2 - 1;
      last = 0.85 * last + 0.15 * white;
      data[i] = last * Math.sin((i / len) * Math.PI);
    }

    const source = this.ctx.createBufferSource();
    source.buffer = buf;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200, now);
    filter.frequency.exponentialRampToValueAtTime(450, now + duration);
    filter.Q.setValueAtTime(3.0, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.24, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    source.start(now);
  }

  /** Water splash sound when crossing creek */
  playSplash(): void {
    if (!this.ctx || !this.masterGain || !this.isUnlocked) return;
    const now = this.ctx.currentTime;
    const duration = 0.25;

    const len = Math.floor(this.ctx.sampleRate * duration);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (len * 0.4));
    }

    const source = this.ctx.createBufferSource();
    source.buffer = buf;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1800, now);
    filter.frequency.exponentialRampToValueAtTime(350, now + duration);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    source.start(now);
  }

  /** Guttural predatory bear roar / growl burst */
  playBearRoar(): void {
    if (!this.ctx || !this.masterGain || !this.isUnlocked) return;
    const now = this.ctx.currentTime;
    const duration = 0.65;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(110, now);
    osc.frequency.exponentialRampToValueAtTime(42, now + duration);

    // Throat rattle modulator
    const mod = this.ctx.createOscillator();
    const modGain = this.ctx.createGain();
    mod.frequency.setValueAtTime(32, now);
    modGain.gain.setValueAtTime(45, now);
    mod.connect(osc.frequency);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.38, now + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(750, now);

    mod.start(now);
    osc.start(now);
    mod.stop(now + duration);
    osc.stop(now + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
  }

  /** Arcade score chime for obstacle clears */
  playBonus(): void {
    if (!this.ctx || !this.masterGain || !this.isUnlocked) return;
    const now = this.ctx.currentTime;

    const notes = [587.33, 880.0, 1174.66]; // D5 -> A5 -> D6
    notes.forEach((freq, idx) => {
      const noteTime = now + idx * 0.055;
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.18, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.12);

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(noteTime);
      osc.stop(noteTime + 0.14);
    });
  }

  /** UI click sound */
  playClick(): void {
    if (!this.ctx || !this.masterGain || !this.isUnlocked) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.03);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.035);
  }
}

export const SFX = new SoundEffects();
