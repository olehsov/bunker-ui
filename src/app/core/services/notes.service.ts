import { Injectable, signal } from '@angular/core';

/**
 * Private per-room notes about other players ("brags about being a doctor,
 * hides health"). Kept in localStorage — they belong to the person, not to the
 * tab's player identity, and never leave the browser.
 */
@Injectable({ providedIn: 'root' })
export class NotesService {
  private code: string | null = null;
  private readonly _notes = signal<Record<string, string>>({});
  readonly notes = this._notes.asReadonly();

  private key(code: string): string {
    return `bunker:notes:${code}`;
  }

  useRoom(code: string): void {
    if (this.code === code) {
      return;
    }
    this.code = code;
    try {
      this._notes.set(JSON.parse(localStorage.getItem(this.key(code)) ?? '{}'));
    } catch {
      this._notes.set({});
    }
  }

  set(playerId: string, text: string): void {
    const next = { ...this._notes() };
    const trimmed = text.trim();
    if (trimmed) {
      next[playerId] = trimmed;
    } else {
      delete next[playerId];
    }
    this._notes.set(next);
    if (this.code) {
      try {
        localStorage.setItem(this.key(this.code), JSON.stringify(next));
      } catch {
        // Storage can be unavailable (private mode); notes then live for this page only.
      }
    }
  }
}
