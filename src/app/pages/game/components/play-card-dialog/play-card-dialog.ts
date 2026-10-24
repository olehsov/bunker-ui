import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { PlayerView, SPECIAL_CARD_ICONS, SpecialCard } from '../../../../core/models/room.models';
import { Avatar } from '../../../../shared/avatar/avatar';

export interface PlayCardDialogData {
  card: SpecialCard;
  me: PlayerView;
  players: PlayerView[];
}

/** Closes with `{ targetPlayerId }` on confirm (null for target-less cards), or undefined on cancel. */
export interface PlayCardDialogResult {
  targetPlayerId: string | null;
}

@Component({
  selector: 'app-play-card-dialog',
  imports: [MatDialogModule, MatButtonModule, MatIconModule, Avatar],
  templateUrl: './play-card-dialog.html',
  styleUrl: './play-card-dialog.scss',
})
export class PlayCardDialog {
  readonly data = inject<PlayCardDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<PlayCardDialog, PlayCardDialogResult>);

  readonly icons = SPECIAL_CARD_ICONS;
  readonly selectedId = signal<string | null>(null);

  readonly targets = computed(() =>
    this.data.players.filter(
      (p) => !p.eliminated && (this.data.card.target === 'any' || p.id !== this.data.me.id),
    ),
  );

  readonly needsTarget = this.data.card.target !== 'none';
  readonly canConfirm = computed(() => !this.needsTarget || this.selectedId() !== null);

  confirm(): void {
    if (this.canConfirm()) {
      this.dialogRef.close({ targetPlayerId: this.needsTarget ? this.selectedId() : null });
    }
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
