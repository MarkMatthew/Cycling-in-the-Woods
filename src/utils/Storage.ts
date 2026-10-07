/**
 * LocalStorage Manager with Safe Memory Fallback
 * Grizzly Run - 16-Bit Survival Cycling Game
 */

import { AudioSettings } from '../types';

const STORAGE_KEYS = {
  HIGH_SCORE: 'grizzly_run_high_score',
  SETTINGS: 'grizzly_run_settings'
};

const DEFAULT_SETTINGS: AudioSettings = {
  masterMute: false,
  musicVolume: 0.65,
  sfxVolume: 0.75,
  reduceShake: false
};

class StorageManager {
  private memoryStore: Map<string, string> = new Map();
  private hasLocalStorage: boolean;

  constructor() {
    this.hasLocalStorage = this.checkAvailability();
  }

  private checkAvailability(): boolean {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return false;
      }
      const testKey = '__storage_test__';
      window.localStorage.setItem(testKey, testKey);
      window.localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  getHighScore(): number {
    try {
      if (this.hasLocalStorage) {
        const val = window.localStorage.getItem(STORAGE_KEYS.HIGH_SCORE);
        return val ? parseInt(val, 10) || 0 : 0;
      }
      const val = this.memoryStore.get(STORAGE_KEYS.HIGH_SCORE);
      return val ? parseInt(val, 10) || 0 : 0;
    } catch {
      return 0;
    }
  }

  saveHighScore(score: number): boolean {
    const currentBest = this.getHighScore();
    if (score > currentBest) {
      try {
        if (this.hasLocalStorage) {
          window.localStorage.setItem(STORAGE_KEYS.HIGH_SCORE, score.toString());
        }
        this.memoryStore.set(STORAGE_KEYS.HIGH_SCORE, score.toString());
        return true;
      } catch {
        this.memoryStore.set(STORAGE_KEYS.HIGH_SCORE, score.toString());
      }
    }
    return false;
  }

  getSettings(): AudioSettings {
    try {
      let raw: string | null = null;
      if (this.hasLocalStorage) {
        raw = window.localStorage.getItem(STORAGE_KEYS.SETTINGS);
      } else {
        raw = this.memoryStore.get(STORAGE_KEYS.SETTINGS) || null;
      }
      if (raw) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
      }
    } catch {
      // Fallback
    }
    return { ...DEFAULT_SETTINGS };
  }

  saveSettings(settings: Partial<AudioSettings>): void {
    const current = this.getSettings();
    const updated = { ...current, ...settings };
    try {
      const serialized = JSON.stringify(updated);
      if (this.hasLocalStorage) {
        window.localStorage.setItem(STORAGE_KEYS.SETTINGS, serialized);
      }
      this.memoryStore.set(STORAGE_KEYS.SETTINGS, serialized);
    } catch {
      this.memoryStore.set(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
    }
  }
}

export const Storage = new StorageManager();
