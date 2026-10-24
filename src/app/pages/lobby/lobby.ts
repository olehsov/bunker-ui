import { Component, DestroyRef, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ApiService } from '../../core/services/api.service';
import { SessionService } from '../../core/services/session.service';
import { SocketService } from '../../core/services/socket.service';
import { BunkerConfig, CataclysmConfig, MAX_PLAYERS, MIN_PLAYERS, PlayerView, RoomPhase } from '../../core/models/room.models';
import { Avatar } from '../../shared/avatar/avatar';

@Component({
  selector: 'app-lobby',
  imports: [
    FormsModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTooltipModule,
    Avatar,
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
  readonly linkCopied = signal(false);
  readonly canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  readonly me = computed(() => this.room()?.players.find((p) => p.isSelf) ?? null);
  readonly isOwner = computed(() => !!this.me()?.isOwner);
  readonly players = computed(() => this.room()?.players ?? []);
  readonly playerCount = computed(() => this.players().length);
  /** Owner counts as ready — they signal readiness by pressing "start". */
  readonly readyCount = computed(() => this.players().filter((p) => p.isOwner || p.ready).length);
  readonly readyPercent = computed(() =>
    this.playerCount() ? (this.readyCount() / this.playerCount()) * 100 : 0,
  );
  /** Placeholder rows that show how many more people are needed to start. */
  readonly emptySlots = computed(() => Array(Math.max(0, MIN_PLAYERS - this.playerCount())));

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

    this.socket.kicked$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.session.clear(this.code);
      this.socket.disconnect();
      this.router.navigate(['/']);
      this.snackBar.open('Власник прибрав вас із кімнати', 'Ок', { duration: 5000 });
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

  private get inviteUrl(): string {
    return `${location.origin}/join?code=${this.code}`;
  }

  copyCode(): void {
    navigator.clipboard.writeText(this.code).then(() => {
      this.codeCopied.set(true);
      setTimeout(() => this.codeCopied.set(false), 1500);
    });
  }

  copyInviteLink(): void {
    navigator.clipboard.writeText(this.inviteUrl).then(() => {
      this.linkCopied.set(true);
      setTimeout(() => this.linkCopied.set(false), 1500);
    });
  }

  shareInvite(): void {
    // Only the URL: share targets like "Copy link" concatenate `text` onto
    // the URL, which then lands in the join page's code param.
    navigator.share({ title: 'Бункер', url: this.inviteUrl }).catch(() => undefined);
  }

  kick(player: PlayerView): void {
    this.socket.kickPlayer(player.id);
    this.snackBar.open(`${player.name} більше не в кімнаті`, undefined, { duration: 2500 });
  }

  randomizeScenario(): void {
    const pick = <T>(list: T[]): T | undefined => list[Math.floor(Math.random() * list.length)];
    const bunker = pick(this.bunkers());
    const cataclysm = pick(this.cataclysms());
    if (bunker) {
      this.socket.selectBunker(bunker.id);
    }
    if (cataclysm) {
      this.socket.selectCataclysm(cataclysm.id);
    }
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
