import { Component, computed, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { GameLogEntry } from '../../../../core/models/room.models';

const KIND_ICONS: Record<GameLogEntry['kind'], string> = {
  round: 'flag',
  card: 'auto_awesome',
  elimination: 'logout',
};

/** Newest-first feed of what happened: rounds, played special cards, eliminations. */
@Component({
  selector: 'app-game-log',
  imports: [DatePipe, MatIconModule],
  templateUrl: './game-log.html',
  styleUrl: './game-log.scss',
})
export class GameLog {
  readonly entries = input<GameLogEntry[]>([]);
  readonly icons = KIND_ICONS;
  readonly newestFirst = computed(() => [...this.entries()].reverse());
}
