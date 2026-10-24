import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SPECIAL_CARD_ICONS, SpecialCard as SpecialCardModel } from '../../../../core/models/room.models';

@Component({
  selector: 'app-special-card',
  imports: [MatIconModule, MatTooltipModule],
  templateUrl: './special-card.html',
  styleUrl: './special-card.scss',
})
export class SpecialCard {
  @Input({ required: true }) card!: SpecialCardModel;
  @Input() playable = false;
  /** Why the card can't be played right now; shown as a tooltip. */
  @Input() disabledReason = '';
  @Input() compact = false;

  @Output() activated = new EventEmitter<void>();

  readonly icons = SPECIAL_CARD_ICONS;

  onClick(): void {
    if (this.playable) {
      this.activated.emit();
    }
  }
}
