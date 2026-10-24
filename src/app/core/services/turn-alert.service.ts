import { Injectable, signal } from '@angular/core';

const SOUND_KEY = 'bunker:sound';

/** Short chime + vibration + tab-title marker when it becomes this player's turn. */
@Injectable({ providedIn: 'root' })
export class TurnAlertService {
  private audioCtx: AudioContext | null = null;
  private readonly _soundOn = signal(this.readSoundPref());
  readonly soundOn = this._soundOn.asReadonly();

  toggleSound(): void {
    this._soundOn.update((v) => !v);
    try {
      localStorage.setItem(SOUND_KEY, this._soundOn() ? '1' : '0');
    } catch {
      // ignore
    }
  }

  alert(): void {
    if (typeof window === 'undefined') {
      return;
    }
    navigator.vibrate?.(150);
    if (this._soundOn()) {
      this.chime();
    }
  }

  private chime(): void {
    try {
      this.audioCtx ??= new AudioContext();
      const ctx = this.audioCtx;
      const now = ctx.currentTime;
      [660, 880].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        const start = now + i * 0.12;
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(0.15, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.25);
        osc.connect(gain).connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.3);
      });
    } catch {
      // Autoplay policies may block audio before the first user gesture.
    }
  }

  private readSoundPref(): boolean {
    try {
      return typeof localStorage === 'undefined' || localStorage.getItem(SOUND_KEY) !== '0';
    } catch {
      return true;
    }
  }
}
