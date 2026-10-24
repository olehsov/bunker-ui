import { Component, DestroyRef, computed, effect, inject, signal } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { CdkDropList, CdkDragDrop } from '@angular/cdk/drag-drop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ApiService } from '../../core/services/api.service';
import { SessionService } from '../../core/services/session.service';
import { SocketService } from '../../core/services/socket.service';
import { NotesService } from '../../core/services/notes.service';
import { TurnAlertService } from '../../core/services/turn-alert.service';
import {
  BunkerConfig,
  CataclysmConfig,
  ELIMINATION_SCHEDULE,
  HOBBY_LEVELS,
  PROFESSION_LEVELS,
  RoomPhase,
  TraitCategory,
  TRAIT_CATEGORY_ICONS,
  TRAIT_CATEGORY_LABELS,
  TRAIT_CATEGORY_ORDER,
} from '../../core/models/room.models';
import { TimerBar } from './components/timer-bar/timer-bar';
import { PlayerRow } from './components/player-row/player-row';
import { OwnTraitsTray, PlaySpecialCardEvent } from './components/own-traits-tray/own-traits-tray';
import { GameLog } from './components/game-log/game-log';
import { VotingPanel } from './components/voting-panel/voting-panel';
import { GameOver } from './components/game-over/game-over';

@Component({
  selector: 'app-game',
  imports: [
    CdkDropList,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    TimerBar,
    PlayerRow,
    OwnTraitsTray,
    VotingPanel,
    GameOver,
    GameLog,
  ],
  templateUrl: './game.html',
  styleUrl: './game.scss',
})
export class Game {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(ApiService);
  private readonly session = inject(SessionService);
  private readonly socket = inject(SocketService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);
  private readonly notesService = inject(NotesService);
  private readonly turnAlert = inject(TurnAlertService);
  private readonly title = inject(Title);

  readonly RoomPhase = RoomPhase;

  readonly code = this.route.snapshot.paramMap.get('code')!;
  readonly playerId = this.session.getPlayerId(this.code);

  readonly room = this.socket.room;

  readonly bunkers = signal<BunkerConfig[]>([]);
  readonly cataclysms = signal<CataclysmConfig[]>([]);

  readonly me = computed(() => this.room()?.players.find((p) => p.isSelf) ?? null);
  readonly isOwner = computed(() => !!this.me()?.isOwner);
  readonly players = computed(() => this.room()?.players ?? []);
  readonly aliveCount = computed(() => this.players().filter((p) => !p.eliminated).length);
  readonly notes = this.notesService.notes;
  readonly soundOn = this.turnAlert.soundOn;

  /** Players eliminated stay in `players`, so its length is the starting headcount. */
  readonly seats = computed(() => {
    const total = this.players().length;
    const votes = (ELIMINATION_SCHEDULE[total] ?? []).reduce((a, b) => a + b, 0);
    return total - votes;
  });

  readonly bunker = computed(
    () => this.bunkers().find((b) => b.id === this.room()?.bunkerId) ?? null,
  );
  readonly cataclysm = computed(
    () => this.cataclysms().find((c) => c.id === this.room()?.cataclysmId) ?? null,
  );

  readonly isMyTurn = computed(() => {
    const room = this.room();
    const me = this.me();
    return !!room && !!me && room.phase === RoomPhase.REVEAL && room.activePlayerId === me.id;
  });

  /** Round 1 opens professions, unless a "Викриття" card already exposed mine. */
  readonly forcedCategory = computed<TraitCategory | null>(() =>
    this.room()?.round === 1 &&
    !this.me()?.publiclyRevealedCategories.includes(TraitCategory.PROFESSION)
      ? TraitCategory.PROFESSION
      : null,
  );

  readonly categoryOrder = TRAIT_CATEGORY_ORDER;
  readonly categoryLabels = TRAIT_CATEGORY_LABELS;
  readonly categoryIcons = TRAIT_CATEGORY_ICONS;
  readonly professionLevels = PROFESSION_LEVELS;
  readonly hobbyLevels = HOBBY_LEVELS;
  readonly TraitCategory = TraitCategory;

  readonly scenarioExpanded = signal(false);

  readonly professionLevelsTooltip = `Можливі рівні стажу:\n${PROFESSION_LEVELS.join('\n')}`;
  readonly hobbyLevelsTooltip = `Можливі рівні володіння:\n${HOBBY_LEVELS.join('\n')}`;

  readonly showBoard = computed(() => {
    const phase = this.room()?.phase;
    return (
      phase === RoomPhase.READY_FOR_ROUND ||
      phase === RoomPhase.REVEAL ||
      phase === RoomPhase.AWAITING_VOTE_START ||
      phase === RoomPhase.VOTING ||
      phase === RoomPhase.AWAITING_NEXT_ROUND
    );
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

    this.notesService.useRoom(this.code);

    let wasMyTurn = false;
    effect(() => {
      const myTurn = this.isMyTurn();
      if (myTurn && !wasMyTurn) {
        this.turnAlert.alert();
      }
      wasMyTurn = myTurn;
      this.title.setTitle(myTurn ? '● Ваш хід — Бункер' : 'Бункер');
    });
    this.destroyRef.onDestroy(() => this.title.setTitle('Бункер'));

    // Toast special cards played since the last snapshot; the first snapshot
    // only sets the baseline so a refresh doesn't replay old events.
    let lastLogId: number | null = null;
    effect(() => {
      const log = this.room()?.log ?? [];
      const newestId = log.at(-1)?.id ?? 0;
      if (lastLogId !== null) {
        const fresh = log.filter((e) => e.id > lastLogId! && e.kind === 'card');
        if (fresh.length) {
          this.snackBar.open(fresh.map((e) => e.text).join('\n'), 'Ок', {
            duration: 5000,
            panelClass: 'multiline-snack',
          });
        }
      }
      lastLogId = newestId;
    });
  }

  onPlaySpecial(event: PlaySpecialCardEvent): void {
    this.socket.playSpecialCard(event.cardId, event.targetPlayerId);
  }

  toggleSound(): void {
    this.turnAlert.toggleSound();
  }

  setNote(playerId: string, text: string): void {
    this.notesService.set(playerId, text);
  }

  toggleScenario(): void {
    this.scenarioExpanded.update((v) => !v);
  }

  startRound(): void {
    this.socket.startRound();
  }

  startVoting(): void {
    this.socket.startVoting();
  }

  onTrayReveal(category: TraitCategory): void {
    this.socket.revealTrait(category);
  }

  onVote(targetPlayerId: string): void {
    this.socket.castVote(targetPlayerId);
  }

  onEndVoting(): void {
    this.socket.endVoting();
  }

  onRestartVoting(): void {
    this.socket.restartVoting();
  }

  onBoardDrop(event: CdkDragDrop<unknown, unknown, TraitCategory>): void {
    if (event.previousContainer.id !== 'traitsTray' || !this.isMyTurn()) {
      return;
    }
    const category = event.item.data as TraitCategory;
    const forced = this.forcedCategory();
    if (forced !== null && category !== forced) {
      return;
    }
    const me = this.me();
    if (me?.publiclyRevealedCategories.includes(category)) {
      return;
    }
    this.socket.revealTrait(category);
  }
}
