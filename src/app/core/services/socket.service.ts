import { Injectable, signal } from '@angular/core';
import { Subject } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { WS_BASE_URL, WS_NAMESPACE } from '../config/app-config';
import { RoomSnapshot, TraitCategory } from '../models/room.models';

@Injectable({ providedIn: 'root' })
export class SocketService {
  private socket: Socket | null = null;
  private activeCode: string | null = null;
  private activePlayerId: string | null = null;

  private readonly _room = signal<RoomSnapshot | null>(null);
  readonly room = this._room.asReadonly();

  private readonly _connected = signal(false);
  readonly connected = this._connected.asReadonly();

  private readonly errorSubject = new Subject<string>();
  readonly error$ = this.errorSubject.asObservable();

  /** Connects only if not already connected to this exact room+player. Safe to call from every page. */
  ensureConnected(code: string, playerId: string): void {
    if (this.socket && this.activeCode === code && this.activePlayerId === playerId) {
      return;
    }
    this.connect(code, playerId);
  }

  connect(code: string, playerId: string): void {
    if (this.socket) {
      this.disconnect();
    }
    this.activeCode = code;
    this.activePlayerId = playerId;
    this.socket = io(`${WS_BASE_URL}${WS_NAMESPACE}`, {
      query: { code, playerId },
      transports: ['websocket'],
    });

    this.socket.on('connect', () => this._connected.set(true));
    this.socket.on('disconnect', () => this._connected.set(false));
    this.socket.on('room:state', (state: RoomSnapshot) => this._room.set(state));
    this.socket.on('room:error', (payload: { message: string }) =>
      this.errorSubject.next(payload.message),
    );
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
    this.activeCode = null;
    this.activePlayerId = null;
    this._room.set(null);
    this._connected.set(false);
  }

  rename(name: string): void {
    this.socket?.emit('player:rename', { name });
  }

  setReady(ready: boolean): void {
    this.socket?.emit('player:ready', { ready });
  }

  selectBunker(bunkerId: string): void {
    this.socket?.emit('owner:selectBunker', { bunkerId });
  }

  selectCataclysm(cataclysmId: string): void {
    this.socket?.emit('owner:selectCataclysm', { cataclysmId });
  }

  startGame(): void {
    this.socket?.emit('owner:startGame');
  }

  startRound(): void {
    this.socket?.emit('owner:startRound');
  }

  revealTrait(category: TraitCategory): void {
    this.socket?.emit('player:revealTrait', { category });
  }

  startVoting(): void {
    this.socket?.emit('owner:startVoting');
  }

  castVote(targetPlayerId: string): void {
    this.socket?.emit('player:castVote', { targetPlayerId });
  }

  endVoting(): void {
    this.socket?.emit('owner:endVoting');
  }

  restartVoting(): void {
    this.socket?.emit('owner:restartVoting');
  }
}
