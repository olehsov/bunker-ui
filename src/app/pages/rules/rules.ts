import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { SeoService } from '../../core/services/seo.service';
import {
  MAX_PLAYERS,
  MIN_PLAYERS,
  TRAIT_CATEGORY_ICONS,
  TRAIT_CATEGORY_LABELS,
  TRAIT_CATEGORY_ORDER,
} from '../../core/models/room.models';

@Component({
  selector: 'app-rules',
  imports: [RouterLink, MatButtonModule, MatIconModule],
  templateUrl: './rules.html',
  styleUrl: './rules.scss',
})
export class Rules {
  readonly minPlayers = MIN_PLAYERS;
  readonly maxPlayers = MAX_PLAYERS;
  readonly categories = TRAIT_CATEGORY_ORDER;
  readonly labels = TRAIT_CATEGORY_LABELS;
  readonly icons = TRAIT_CATEGORY_ICONS;

  readonly phases = [
    {
      title: 'Лобі',
      text: 'Власник створює кімнату й надсилає друзям посилання або код. Коли всі натиснули «Я готовий», власник обирає бункер і катаклізм (або залишає випадкові) та запускає гру.',
    },
    {
      title: 'Розкриття',
      text: 'Гравці по черзі відкривають по одній характеристиці. У першому раунді всі відкривають професію. На хід — 60 секунд; якщо час вийшов, відкривається випадкова картка.',
    },
    {
      title: 'Обговорення та голосування',
      text: 'Починаючи з другого-третього раунду, після розкриття йде голосування. Кожен голосує за того, хто, на його думку, найменш корисний для виживання. Нічия — голосування перезапускається.',
    },
    {
      title: 'Фінал',
      text: 'Після 5 раундів ті, хто залишився, потрапляють у бункер. Вирішіть разом, чи зможе ця команда вижити й відродити людство.',
    },
  ];

  constructor() {
    inject(SeoService).setPage({
      title: 'Правила гри «Бункер» — як грати онлайн',
      description:
        'Правила гри «Бункер»: характеристики персонажів, раунди розкриття, голосування й фінал. Коротко і зрозуміло, українською.',
      path: '/rules',
    });
  }
}
