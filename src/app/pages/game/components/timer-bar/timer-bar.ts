import { Component, DestroyRef, computed, effect, inject, input, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RoomPhase, RoomSnapshot } from '../../../../core/models/room.models';

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
  imports: [MatIconModule],
  templateUrl: './timer-bar.html',
  styleUrl: './timer-bar.scss',
})
export class TimerBar {
  readonly room = input<RoomSnapshot | null>(null);

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
