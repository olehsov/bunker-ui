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

  readonly specialCards = [
    { icon: 'swap_horiz', title: 'Обмін', text: 'поміняйтеся професією, здоровʼям, багажем чи фобією з іншим гравцем.' },
    { icon: 'casino', title: 'Нова карта', text: 'замініть свою характеристику на випадкову.' },
    { icon: 'local_fire_department', title: 'Крадіжка / Зараження', text: 'зіпсуйте характеристику іншого гравця.' },
    { icon: 'medical_services', title: 'Аптечка', text: 'повністю вилікуйте будь-кого, зокрема себе.' },
    { icon: 'visibility', title: 'Шпигун', text: 'таємно подивіться приховану характеристику іншого гравця.' },
    { icon: 'flashlight_on', title: 'Викриття', text: 'змусьте гравця відкрити випадкову характеристику.' },
    { icon: 'shield', title: 'Імунітет', text: 'під час голосування за вас не можна голосувати.' },
    { icon: 'exposure_plus_2', title: 'Подвійний голос', text: 'ваш голос у голосуванні рахується двічі.' },
    { icon: 'restart_alt', title: 'Переголосування', text: 'скасуйте всі поточні голоси.' },
  ];

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
