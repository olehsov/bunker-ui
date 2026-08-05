import { Injectable } from '@angular/core';

interface StoredSession {
  playerId: string;
}

/**
 * Uses sessionStorage (not localStorage) so each browser TAB keeps its own
 * player identity. localStorage is shared across every tab of the same
 * origin, which would make a second tab silently hijack the first tab's
 * player identity for the same room code — sessionStorage still survives a
 * refresh of that same tab, which is all reconnect needs.
 */
@Injectable({ providedIn: 'root' })
export class SessionService {
  private key(code: string): string {
    return `bunker:session:${code}`;
  }

  save(code: string, playerId: string): void {
    sessionStorage.setItem(this.key(code), JSON.stringify({ playerId } satisfies StoredSession));
  }

  getPlayerId(code: string): string | null {
    const raw = sessionStorage.getItem(this.key(code));
    if (!raw) {
      return null;
    }
    try {
      return (JSON.parse(raw) as StoredSession).playerId;
    } catch {
      return null;
    }
  }

  clear(code: string): void {
    sessionStorage.removeItem(this.key(code));
  }
}
