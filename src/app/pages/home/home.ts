import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { SeoService } from '../../core/services/seo.service';

@Component({
  selector: 'app-home',
  imports: [RouterLink, MatButtonModule, MatIconModule],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  constructor() {
    inject(SeoService).setPage({
      title: 'Бункер онлайн українською — безкоштовна браузерна гра',
      description:
        'Гра «Бункер» онлайн українською: зберіть компанію 4–16 гравців, розкривайте характеристики персонажів і голосуйте, хто отримає місце в бункері. Грати безкоштовно в браузері, без реєстрації.',
      path: '/',
    });
  }
}
