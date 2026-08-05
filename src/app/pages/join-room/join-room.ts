import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../core/services/api.service';
import { SessionService } from '../../core/services/session.service';

@Component({
  selector: 'app-join-room',
  imports: [
    FormsModule,
    RouterLink,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './join-room.html',
  styleUrl: './join-room.scss',
})
export class JoinRoom {
  private readonly api = inject(ApiService);
  private readonly session = inject(SessionService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly code = signal(this.route.snapshot.queryParamMap.get('code')?.toUpperCase() ?? '');
  readonly playerName = signal('');
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  joinRoom(): void {
    const code = this.code().trim();
    const name = this.playerName().trim();
    if (!code || !name) {
      this.error.set("Вкажіть код кімнати та ім'я");
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    this.api.joinRoom(code, name).subscribe({
      next: ({ playerId, room }) => {
        this.session.save(room.code, playerId);
        this.router.navigate(['/room', room.code, 'lobby']);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.message ?? 'Не вдалося приєднатись. Перевірте код кімнати.');
      },
    });
  }
}
