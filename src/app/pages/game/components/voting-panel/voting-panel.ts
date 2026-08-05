import { Component, EventEmitter, Output, computed, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RoomSnapshot } from '../../../../core/models/room.models';

@Component({
  selector: 'app-voting-panel',
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './voting-panel.html',
  styleUrl: './voting-panel.scss',
})
export class VotingPanel {
  readonly room = input.required<RoomSnapshot>();
  readonly myPlayerId = input.required<string>();
  readonly isOwner = input(false);

  @Output() vote = new EventEmitter<string>();
  @Output() endVoting = new EventEmitter<void>();
  @Output() restartVoting = new EventEmitter<void>();

  readonly candidates = computed(() => this.room().players.filter((p) => !p.eliminated));

  readonly myVote = computed(() => this.room().voting?.votes[this.myPlayerId()] ?? null);

  readonly isTie = computed(() => this.room().voting?.lastResult === 'TIE');

  readonly votedCount = computed(() => Object.keys(this.room().voting?.votes ?? {}).length);

  voteFor(targetId: string): void {
    if (targetId === this.myPlayerId()) {
      return;
    }
    this.vote.emit(targetId);
  }

  voteCountFor(candidateId: string): number {
    return this.room().voting?.voteCounts[candidateId] ?? 0;
  }
}
