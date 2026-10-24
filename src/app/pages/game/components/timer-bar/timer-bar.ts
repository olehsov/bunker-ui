import { Component, DestroyRef, EventEmitter, Output, computed, effect, inject, input, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PHASE_DURATION_SECONDS, RoomPhase, RoomSnapshot } from '../../../../core/models/room.models';

const PHASE_LABELS: Record<RoomPhase, string> = {
  [RoomPhase.LOBBY]: 'Лобі',
  [RoomPhase.READY_FOR_ROUND]: 'Гра почалась',
  [RoomPhase.REVEAL]: 'Відкриття властивостей',
  [RoomPhase.AWAITING_VOTE_START]: 'Очікування голосування',
  [RoomPhase.VOTING]: 'Голосування',
  [RoomPhase.AWAITING_NEXT_ROUND]: 'Раунд завершено',
  [RoomPhase.FINISHED]: 'Гру завершено',
};

/**
 * The countdown is derived from `room.phaseDeadline`, an epoch-ms timestamp the
 * backend sets whenever a turn or voting session starts. Deriving from a fixed
 * timestamp (rather than counting down a locally-seeded value) means the timer
 * survives page refreshes and stays correct regardless of tab throttling.
 */
@Component({
  selector: 'app-timer-bar',
  imports: [MatButtonModule, MatIconModule, MatTooltipModule],
  templateUrl: './timer-bar.html',
  styleUrl: './timer-bar.scss',
})
export class TimerBar {
  readonly room = input<RoomSnapshot | null>(null);
  readonly soundOn = input(true);

  @Output() toggleSound = new EventEmitter<void>();

  readonly totalRounds = computed(() => this.room()?.totalRounds || 5);

  readonly roundDots = computed(() => {
    const round = this.room()?.round ?? 0;
    const finished = this.room()?.phase === RoomPhase.FINISHED;
    return Array.from({ length: this.totalRounds() }, (_, i) =>
      i + 1 < round || finished ? 'done' : i + 1 === round ? 'current' : 'todo',
    );
  });

  readonly phaseLabel = computed(() => {
    const phase = this.room()?.phase;
    return phase ? PHASE_LABELS[phase] : '';
  });

  readonly activePlayerName = computed(() => {
    const room = this.room();
    if (!room?.activePlayerId) {
      return null;
    }
    return room.players.find((p) => p.id === room.activePlayerId)?.name ?? null;
  });

  private readonly phaseDeadline = computed(() => this.room()?.phaseDeadline ?? null);

  readonly showTimer = computed(() => {
    const phase = this.room()?.phase;
    return (phase === RoomPhase.REVEAL || phase === RoomPhase.VOTING) && this.phaseDeadline() !== null;
  });

  readonly isRevealPhase = computed(() => this.room()?.phase === RoomPhase.REVEAL);

  readonly secondsLeft = signal(0);

  readonly progress = computed(() =>
    Math.min(100, (this.secondsLeft() / PHASE_DURATION_SECONDS) * 100),
  );

  private intervalId: ReturnType<typeof setInterval> | null = null;

  constructor() {
    const destroyRef = inject(DestroyRef);

    effect(() => {
      const deadline = this.phaseDeadline();

      this.stopInterval();
      if (deadline === null) {
        return;
      }

      const tick = () => this.secondsLeft.set(Math.max(0, Math.ceil((deadline - Date.now()) / 1000)));
      tick();
      this.intervalId = setInterval(tick, 1000);
    });

    destroyRef.onDestroy(() => this.stopInterval());
  }

  private stopInterval(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}
