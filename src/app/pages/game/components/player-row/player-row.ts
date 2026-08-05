import { Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PlayerView, TraitCategory, TRAIT_CATEGORY_ORDER } from '../../../../core/models/room.models';

@Component({
  selector: 'tr[app-player-row]',
  imports: [MatIconModule, MatTooltipModule],
  templateUrl: './player-row.html',
  styleUrl: './player-row.scss',
})
export class PlayerRow {
  @Input({ required: true }) player!: PlayerView;
  @Input() active = false;

  readonly categories = TRAIT_CATEGORY_ORDER;

  isPubliclyRevealed(category: TraitCategory): boolean {
    return this.player.publiclyRevealedCategories.includes(category);
  }
}
