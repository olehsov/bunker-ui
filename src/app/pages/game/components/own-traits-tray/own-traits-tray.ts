import { Component, EventEmitter, Output, computed, inject, input } from '@angular/core';
import { CdkDrag, CdkDropList } from '@angular/cdk/drag-drop';
import { MatDialog } from '@angular/material/dialog';
import {
  PlayerView,
  RoomPhase,
  RoomSnapshot,
  SpecialCard as SpecialCardModel,
  TraitCardView,
  TraitCategory,
} from '../../../../core/models/room.models';
import { TraitCard } from '../trait-card/trait-card';
import { SpecialCard } from '../special-card/special-card';
import { RevealConfirmDialog, RevealConfirmDialogData } from '../reveal-confirm-dialog/reveal-confirm-dialog';
import { PlayCardDialog, PlayCardDialogData, PlayCardDialogResult } from '../play-card-dialog/play-card-dialog';

export interface PlaySpecialCardEvent {
  cardId: string;
  targetPlayerId: string | null;
}

@Component({
  selector: 'app-own-traits-tray',
  imports: [CdkDropList, CdkDrag, TraitCard, SpecialCard],
  templateUrl: './own-traits-tray.html',
  styleUrl: './own-traits-tray.scss',
})
export class OwnTraitsTray {
  readonly me = input.required<PlayerView>();
  readonly room = input.required<RoomSnapshot>();
  readonly canReveal = input(false);
  /** Round 1 forces everyone to open PROFESSION first; null means any hidden card is fair game. */
  readonly forcedCategory = input<TraitCategory | null>(null);

  @Output() reveal = new EventEmitter<TraitCategory>();
  @Output() playSpecial = new EventEmitter<PlaySpecialCardEvent>();

  private readonly dialog = inject(MatDialog);

  readonly hiddenTraits = computed(() =>
    this.me().traits.filter((t) => !this.me().publiclyRevealedCategories.includes(t.category)),
  );

  readonly unplayedSpecial = computed(() => this.me().specialCards.filter((c) => !c.used));

  /** Mirrors the backend's timing rules so the UI only offers cards the server will accept. */
  disabledReason(card: SpecialCardModel): string {
    const room = this.room();
    if (this.me().eliminated) {
      return 'Вигнані гравці не грають особливі умови';
    }
    if (room.phase === RoomPhase.FINISHED || room.phase === RoomPhase.LOBBY) {
      return 'Гру завершено';
    }
    if (card.timing === 'VOTING') {
      if (room.phase !== RoomPhase.VOTING) {
        return 'Можна зіграти лише під час голосування';
      }
      if (room.voting?.lastResult === 'TIE') {
        return 'Спершу перезапустіть голосування';
      }
    }
    return '';
  }

  isPlayable(card: SpecialCardModel): boolean {
    return !card.used && this.disabledReason(card) === '';
  }

  onSpecialClick(card: SpecialCardModel): void {
    if (!this.isPlayable(card)) {
      return;
    }
    const ref = this.dialog.open<PlayCardDialog, PlayCardDialogData, PlayCardDialogResult>(
      PlayCardDialog,
      { data: { card, me: this.me(), players: this.room().players }, width: '400px' },
    );
    ref.afterClosed().subscribe((result) => {
      if (result) {
        this.playSpecial.emit({ cardId: card.id, targetPlayerId: result.targetPlayerId });
      }
    });
  }

  isRevealable(trait: TraitCardView): boolean {
    if (!this.canReveal()) {
      return false;
    }
    const forced = this.forcedCategory();
    return forced === null || trait.category === forced;
  }

  onCardClick(trait: TraitCardView): void {
    if (!this.isRevealable(trait) || !trait.card) {
      return;
    }
    const ref = this.dialog.open<RevealConfirmDialog, RevealConfirmDialogData, boolean>(
      RevealConfirmDialog,
      { data: { category: trait.category, card: trait.card }, width: '360px' },
    );
    ref.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.reveal.emit(trait.category);
      }
    });
  }
}
