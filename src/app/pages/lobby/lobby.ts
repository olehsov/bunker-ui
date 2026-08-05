import { Component, DestroyRef, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { ApiService } from '../../core/services/api.service';
import { SessionService } from '../../core/services/session.service';
import { SocketService } from '../../core/services/socket.service';
import { BunkerConfig, CataclysmConfig, MAX_PLAYERS, MIN_PLAYERS, RoomPhase } from '../../core/models/room.models';

@Component({
  selector: 'app-lobby',
  imports: [
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatTooltipModule,
    MatDividerModule,
  ],
  templateUrl: './lobby.html',
  styleUrl: './lobby.scss',
})
export class Lobby {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(ApiService);
  private readonly session = inject(SessionService);
  private readonly socket = inject(SocketService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  readonly code = this.route.snapshot.paramMap.get('code')!;
  readonly playerId = this.session.getPlayerId(this.code);

  readonly room = this.socket.room;
  readonly connected = this.socket.connected;

  readonly bunkers = signal<BunkerConfig[]>([]);
  readonly cataclysms = signal<CataclysmConfig[]>([]);
  readonly nameDraft = signal('');
  readonly codeCopied = signal(false);

  readonly me = computed(() => this.room()?.players.find((p) => p.isSelf) ?? null);
  readonly isOwner = computed(() => !!this.me()?.isOwner);
  readonly players = computed(() => this.room()?.players ?? []);
  readonly playerCount = computed(() => this.players().length);

  readonly selectedBunker = computed(() =>
    this.bunkers().find((b) => b.id === this.room()?.bunkerId) ?? null,
  );
  readonly selectedCataclysm = computed(() =>
    this.cataclysms().find((c) => c.id === this.room()?.cataclysmId) ?? null,
  );

  readonly notReadyPlayers = computed(
    () => this.players().filter((p) => !p.isOwner && !p.ready).map((p) => p.name),
  );

  readonly canStart = computed(() => {
    const count = this.playerCount();
    return count >= MIN_PLAYERS && count <= MAX_PLAYERS && this.notReadyPlayers().length === 0;
  });

  readonly startHint = computed(() => {
    const count = this.playerCount();
    if (count < MIN_PLAYERS) {
      return `Потрібно щонайменше ${MIN_PLAYERS} гравці (зараз ${count})`;
    }
    if (count > MAX_PLAYERS) {
      return `Забагато гравців (максимум ${MAX_PLAYERS})`;
    }
    if (this.notReadyPlayers().length > 0) {
      return `Ще не готові: ${this.notReadyPlayers().join(', ')}`;
    }
    return '';
  });

  constructor() {
    if (!this.playerId) {
      this.router.navigate(['/join'], { queryParams: { code: this.code } });
    } else {
      this.socket.ensureConnected(this.code, this.playerId);
    }

    this.api.getBunkers().subscribe((list) => this.bunkers.set(list));
    this.api.getCataclysms().subscribe((list) => this.cataclysms.set(list));

    this.socket.error$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((message) => {
      this.snackBar.open(message, 'Ок', { duration: 4000 });
    });

    effect(() => {
      const me = this.me();
      if (me && !this.nameDraft()) {
        this.nameDraft.set(me.name);
      }
    });

    effect(() => {
      const phase = this.room()?.phase;
      if (phase && phase !== RoomPhase.LOBBY) {
        this.router.navigate(['/room', this.code, 'game']);
      }
    });
  }

  copyCode(): void {
    navigator.clipboard.writeText(this.code).then(() => {
      this.codeCopied.set(true);
      setTimeout(() => this.codeCopied.set(false), 1500);
    });
  }

  saveName(): void {
    const name = this.nameDraft().trim();
    if (name && name !== this.me()?.name) {
      this.socket.rename(name);
    }
  }

  toggleReady(): void {
    const me = this.me();
    if (me) {
      this.socket.setReady(!me.ready);
    }
  }

  onBunkerChange(bunkerId: string): void {
    this.socket.selectBunker(bunkerId);
  }

  onCataclysmChange(cataclysmId: string): void {
    this.socket.selectCataclysm(cataclysmId);
  }

  startGame(): void {
    this.socket.startGame();
  }
}
