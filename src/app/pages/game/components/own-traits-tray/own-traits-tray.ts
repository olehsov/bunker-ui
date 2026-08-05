import { Component, EventEmitter, Output, computed, inject, input } from '@angular/core';
import { CdkDrag, CdkDropList } from '@angular/cdk/drag-drop';
import { MatDialog } from '@angular/material/dialog';
import { PlayerView, TraitCardView, TraitCategory } from '../../../../core/models/room.models';
import { TraitCard } from '../trait-card/trait-card';
import { RevealConfirmDialog, RevealConfirmDialogData } from '../reveal-confirm-dialog/reveal-confirm-dialog';

@Component({
  selector: 'app-own-traits-tray',
  imports: [CdkDropList, CdkDrag, TraitCard],
  templateUrl: './own-traits-tray.html',
  styleUrl: './own-traits-tray.scss',
})
export class OwnTraitsTray {
  readonly me = input.required<PlayerView>();
  readonly canReveal = input(false);
  /** Round 1 forces everyone to open PROFESSION first; null means any hidden card is fair game. */
  readonly forcedCategory = input<TraitCategory | null>(null);

  @Output() reveal = new EventEmitter<TraitCategory>();

  private readonly dialog = inject(MatDialog);

  readonly hiddenTraits = computed(() =>
    this.me().traits.filter((t) => !this.me().publiclyRevealedCategories.includes(t.category)),
  );

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
