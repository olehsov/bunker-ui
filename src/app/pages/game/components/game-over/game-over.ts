import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { BunkerConfig, CataclysmConfig, RoomSnapshot } from '../../../../core/models/room.models';
import { PlayerPanel } from '../player-panel/player-panel';

@Component({
  selector: 'app-game-over',
  imports: [RouterLink, MatButtonModule, MatIconModule, PlayerPanel],
  templateUrl: './game-over.html',
  styleUrl: './game-over.scss',
})
export class GameOver {
  readonly room = input.required<RoomSnapshot>();
  readonly bunker = input<BunkerConfig | null>(null);
  readonly cataclysm = input<CataclysmConfig | null>(null);

  readonly survivors = computed(() => this.room().players.filter((p) => !p.eliminated));
  readonly eliminated = computed(() => this.room().players.filter((p) => p.eliminated));
}
