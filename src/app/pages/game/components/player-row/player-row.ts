import { Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PlayerView, TraitCategory, TRAIT_CATEGORY_ORDER } from '../../../../core/models/room.models';
import { Avatar } from '../../../../shared/avatar/avatar';

@Component({
  selector: 'tr[app-player-row]',
  imports: [FormsModule, MatButtonModule, MatIconModule, MatMenuModule, MatTooltipModule, Avatar],
  templateUrl: './player-row.html',
  styleUrl: './player-row.scss',
})
export class PlayerRow {
  @Input({ required: true }) player!: PlayerView;
  @Input() active = false;
  @Input() note = '';

  @Output() noteChange = new EventEmitter<string>();

  @ViewChild(MatMenuTrigger) private menuTrigger?: MatMenuTrigger;
  @ViewChild('noteInput') private noteInput?: ElementRef<HTMLTextAreaElement>;

  readonly categories = TRAIT_CATEGORY_ORDER;
  draft = '';

  isPubliclyRevealed(category: TraitCategory): boolean {
    return this.player.publiclyRevealedCategories.includes(category);
  }

  onMenuOpened(): void {
    this.draft = this.note;
    // The menu content is attached lazily; wait a tick for the textarea to exist.
    setTimeout(() => this.noteInput?.nativeElement.focus());
  }

  saveNote(): void {
    this.noteChange.emit(this.draft);
    this.menuTrigger?.closeMenu();
  }
}
