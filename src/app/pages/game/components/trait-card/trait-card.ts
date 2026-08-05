import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TraitCard as TraitCardModel, TraitCategory, TRAIT_CATEGORY_ICONS, TRAIT_CATEGORY_LABELS } from '../../../../core/models/room.models';

@Component({
  selector: 'app-trait-card',
  imports: [MatIconModule, MatTooltipModule],
  templateUrl: './trait-card.html',
  styleUrl: './trait-card.scss',
})
export class TraitCard {
  @Input({ required: true }) category!: TraitCategory;
  @Input() card: TraitCardModel | null = null;
  @Input() revealed = false;
  /** False only for the owner's own not-yet-publicly-opened cards. */
  @Input() publiclyRevealed = true;
  @Input() interactive = false;
  @Input() compact = false;

  @Output() activated = new EventEmitter<void>();

  readonly icons = TRAIT_CATEGORY_ICONS;
  readonly labels = TRAIT_CATEGORY_LABELS;

  onClick(): void {
    if (this.interactive) {
      this.activated.emit();
    }
  }
}
