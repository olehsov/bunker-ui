import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../core/services/api.service';
import { SessionService } from '../../core/services/session.service';

@Component({
  selector: 'app-create-room',
  imports: [
    FormsModule,
    RouterLink,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './create-room.html',
  styleUrl: './create-room.scss',
})
export class CreateRoom {
  private readonly api = inject(ApiService);
  private readonly session = inject(SessionService);
  private readonly router = inject(Router);

  readonly ownerName = signal('');
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  createRoom(): void {
    const name = this.ownerName().trim();
    if (!name) {
      this.error.set("Вкажіть ваше ім'я");
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    this.api.createRoom(name).subscribe({
      next: ({ playerId, room }) => {
        this.session.save(room.code, playerId);
        this.router.navigate(['/room', room.code, 'lobby']);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Не вдалося створити кімнату. Спробуйте ще раз.');
      },
    });
  }
}
