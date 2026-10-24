import { Component, EventEmitter, Output, computed, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RoomSnapshot } from '../../../../core/models/room.models';
import { Avatar } from '../../../../shared/avatar/avatar';

@Component({
  selector: 'app-voting-panel',
  imports: [MatButtonModule, MatIconModule, Avatar],
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

  isImmune(playerId: string): boolean {
    return this.room().voting?.immunePlayerIds.includes(playerId) ?? false;
  }

  isDoubleVoter(playerId: string): boolean {
    return this.room().voting?.doubleVoterIds.includes(playerId) ?? false;
  }

  canVoteFor(targetId: string): boolean {
    return targetId !== this.myPlayerId() && !this.isImmune(targetId);
  }

  voteFor(targetId: string): void {
    if (!this.canVoteFor(targetId)) {
      return;
    }
    this.vote.emit(targetId);
  }

  votePercent(candidateId: string): number {
    const total = Object.values(this.room().voting?.voteCounts ?? {}).reduce((a, b) => a + b, 0);
    return total ? (this.voteCountFor(candidateId) / total) * 100 : 0;
  }

  voteCountFor(candidateId: string): number {
    return this.room().voting?.voteCounts[candidateId] ?? 0;
  }
}
