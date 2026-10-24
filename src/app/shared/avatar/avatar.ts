import { Component, computed, input } from '@angular/core';

/**
 * Initials on a colour derived from the player id, so every player keeps the
 * same colour across lobby, board, voting and the final screen.
 */
@Component({
  selector: 'app-avatar',
  template: `{{ initials() }}`,
  styleUrl: './avatar.scss',
  host: {
    '[style.--avatar-hue]': 'hue()',
    '[style.--avatar-size.px]': 'size()',
    '[class.avatar--muted]': 'muted()',
    'aria-hidden': 'true',
  },
})
export class Avatar {
  readonly name = input.required<string>();
  readonly seed = input<string>('');
  readonly size = input(32);
  readonly muted = input(false);

  readonly initials = computed(() => {
    const parts = this.name().trim().split(/\s+/).filter(Boolean);
    const letters = parts.length > 1 ? parts[0][0] + parts[1][0] : (parts[0] ?? '?').slice(0, 2);
    return letters.toUpperCase();
  });

  readonly hue = computed(() => {
    const source = this.seed() || this.name();
    let hash = 0;
    for (let i = 0; i < source.length; i++) {
      hash = (hash * 31 + source.charCodeAt(i)) | 0;
    }
    return Math.abs(hash) % 360;
  });
}
