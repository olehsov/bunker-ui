import { Component, computed, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import {
  BunkerConfig,
  CataclysmConfig,
  RoomSnapshot,
  TraitCategory,
} from '../../../../core/models/room.models';
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

  readonly copied = signal(false);

  /** Plain-text recap for a group chat: scenario plus each survivor's profession. */
  private resultText(): string {
    const lines = ['🛖 Бункер — результат гри'];
    if (this.cataclysm()) {
      lines.push(`Катаклізм: ${this.cataclysm()!.name}`);
    }
    if (this.bunker()) {
      lines.push(`Бункер: ${this.bunker()!.name}`);
    }
    lines.push('', `Вижили (${this.survivors().length}):`);
    for (const p of this.survivors()) {
      const profession = p.traits.find((t) => t.category === TraitCategory.PROFESSION)?.card?.label;
      lines.push(`• ${p.name}${profession ? ` — ${profession}` : ''}`);
    }
    lines.push('', `Грати: ${location.origin}`);
    return lines.join('\n');
  }

  shareResult(): void {
    const text = this.resultText();
    if (typeof navigator.share === 'function') {
      navigator.share({ title: 'Бункер', text }).catch(() => undefined);
      return;
    }
    navigator.clipboard.writeText(text).then(() => {
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 1500);
    });
  }
}
