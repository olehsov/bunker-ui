import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { TraitCard, TraitCategory, TRAIT_CATEGORY_ICONS, TRAIT_CATEGORY_LABELS } from '../../../../core/models/room.models';

export interface RevealConfirmDialogData {
  category: TraitCategory;
  card: TraitCard;
}

@Component({
  selector: 'app-reveal-confirm-dialog',
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './reveal-confirm-dialog.html',
  styleUrl: './reveal-confirm-dialog.scss',
})
export class RevealConfirmDialog {
  readonly data = inject<RevealConfirmDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<RevealConfirmDialog>);

  readonly icons = TRAIT_CATEGORY_ICONS;
  readonly labels = TRAIT_CATEGORY_LABELS;

  confirm(): void {
    this.dialogRef.close(true);
  }

  cancel(): void {
    this.dialogRef.close(false);
  }
}
