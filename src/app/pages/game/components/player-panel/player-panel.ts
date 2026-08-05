import { Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PlayerView } from '../../../../core/models/room.models';
import { TraitCard } from '../trait-card/trait-card';

@Component({
  selector: 'app-player-panel',
  imports: [MatIconModule, MatTooltipModule, TraitCard],
  templateUrl: './player-panel.html',
  styleUrl: './player-panel.scss',
})
export class PlayerPanel {
  @Input({ required: true }) player!: PlayerView;
  @Input() active = false;

  isPubliclyRevealed(category: PlayerView['traits'][number]['category']): boolean {
    return this.player.publiclyRevealedCategories.includes(category);
  }
}
