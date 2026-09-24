# Bunker UI

Фронтенд для гри "Бункер". Angular 22 (standalone, signals) + Angular
Material 3 + Angular CDK drag-drop. Працює в парі з [bunker-api](../bunker-api).

## Чому Angular Material

Обрано Material замість Ionic — це веб-застосунок для десктопного й
мобільного браузера, а не гібридний застосунок з нативними обгортками;
Material 3 дає готову темну тему, форми та діалоги "з коробки". Тема
навмисно темна (post-apocalyptic vibe): orange/red палітра поверх
`mat.theme()`.

## Запуск

```bash
npm install
npm start   # http://localhost:4200, очікує backend на http://localhost:3000
```

Backend URL за замовчуванням — `http://localhost:3000` (fallback у
[`src/app/core/config/app-config.ts`](src/app/core/config/app-config.ts)). У
Docker-образі він підміняється в рантаймі через `window.__env`
(`public/env.js`, генерується з `API_BASE_URL`/`WS_BASE_URL` при старті
контейнера — див. `docker-entrypoint.d/`), так що один образ можна
спрямувати на різні бекенди без перебілду.

## Сторінки

| Маршрут | Що там |
|---|---|
| `/` | Головна: створити / приєднатись |
| `/create` | Форма створення кімнати (ім'я власника) |
| `/join?code=` | Форма приєднання (код + ім'я); код можна передати в query |
| `/room/:code/lobby` | Лобі: список гравців, готовність, вибір бункера/катаклізму (власник), старт гри |
| `/room/:code/game` | Сама гра: таймер-бар, дошка гравців, свої картки внизу, голосування, фінальний екран |

## Ключові рішення

- **Ідентичність гравця в `sessionStorage`, не `localStorage`.** Кожна
  вкладка браузера — окремий гравець; `localStorage` спільний між вкладками
  одного origin і "вкрав" би сесію іншого гравця, відкритого в сусідній
  вкладці того ж браузера (реальний баг, знайдений під час тестування
  кількох гравців в одному браузері).
- **Одна WebSocket-сесія на вкладку**, керована `SocketService`
  (`ensureConnected` уникає повторного підключення при навігації
  лобі → гра).
- **Маскування властивостей повністю на бекенді** — фронтенд лише
  відображає `revealed`/`card` як є. Поле `publiclyRevealedCategories`
  (окремо від viewer-залежного `revealed`) дозволяє власнику картки
  відрізнити "бачу лише я" від "вже бачать усі".
- **Відкриття властивості — два способи**, обидва ведуть до одного виклику
  `socket.revealTrait(category)`:
  - клік по картці в треї → діалог підтвердження → "Відкрити";
  - drag-and-drop картки з трею (`cdkDropList#traitsTray`) на дошку
    гравців (`cdkDropList#playersBoard`) — перетягування саме по собі є
    підтвердженням дії.
- **Таймери (60с хід / 60с голосування) — server-enforced.** Бекенд ставить
  `phaseDeadline` (epoch ms) при кожній зміні `activePlayerId`/сесії
  голосування; фронтенд лише рахує залишок від цього таймстемпу (переживає
  рефреш сторінки), а якщо гравець не встиг — бекенд сам через
  `setTimeout` відкриває випадкову ще не розкриту властивість і передає хід
  далі (`game.gateway.ts`, `scheduleTurnTimeout`).
- Інтерактивні картки й кандидати голосування мають `role="button"` +
  `tabindex` + обробку Enter/Space — це не декоративні `div`, а keyboard/
  screen-reader-доступні елементи.

## Структура

```
src/app/
  core/
    config/app-config.ts        адреси API/WS
    models/room.models.ts       типи, що дзеркалять контракт бекенда
    services/
      api.service.ts            REST (create/join/leave, бункери/катаклізми)
      socket.service.ts         WebSocket-з'єднання + сигнали стану кімнати
      session.service.ts        playerId у sessionStorage per room code
  pages/
    home/ create-room/ join-room/ lobby/
    game/
      game.ts                   оркестрація сторінки гри
      components/
        timer-bar/              верхній оверлей: раунд/фаза/таймер
        player-panel/           картки властивостей одного гравця
        own-traits-tray/        нижній трей власних карток (клік + drag)
        trait-card/             одна картка властивості (hidden/revealed/private)
        reveal-confirm-dialog/  діалог підтвердження відкриття
        voting-panel/           голосування, підрахунок, нічия
        game-over/              фінальний екран з повним розкриттям
```

## E2E-тести (Cypress)

```bash
npm start          # термінал 1: UI на :4200
# і в bunker-api:   npm run start:dev   # термінал 2: API на :3000

npm run e2e         # headless прогін усього набору
npm run e2e:open    # інтерактивний Cypress Runner
```

Гра — realtime і мультиплеєрна (мінімум 4 гравці), а Cypress керує лише
одним реальним браузером. Інших гравців симулює
[`cypress/support/botManager.ts`](cypress/support/botManager.ts) — Node-сайд
`socket.io-client`-з'єднання напряму до бекенда (ті самі REST/WS виклики,
що й у `ApiService`/`SocketService`), зареєстровані як Cypress `task`
(`cy.botCreateRoom`, `cy.botRevealTurn`, `cy.botVoteRandom` тощо, див.
[`cypress/support/commands.ts`](cypress/support/commands.ts)). Реальний
браузер завжди керує власником кімнати.

| Спек | Що покриває |
|---|---|
| `home.cy.ts` | Головна сторінка, навігація, SEO-теги |
| `create-room.cy.ts` / `join-room.cy.ts` | Валідація форм, помилки бекенда, успішні create/join |
| `lobby.cy.ts` | Готовність, лічильник гравців, вибір бункера/катаклізму, rename, wifi-off при дисконекті |
| `game-reveal.cy.ts` | Черга ходу, примусова категорія PROFESSION у 1-му раунді, відхилення дії поза чергою |
| `game-timer.cy.ts` | Відлік таймера, **переживання рефрешу сторінки**, реальне 60-секундне очікування авто-відкриття по таймауту |
| `game-voting.cy.ts` | Голосування, елімінація, нічия + перезапуск |
| `game-full-flow.cy.ts` | Повна гра: 5 раундів, 2 елімінації, екран Game Over |
| `edge-cases.cy.ts` | Редіректи без сесії, персистентність сесії, MAX_PLAYERS, leave-room API |
| `seo.cy.ts` | Унікальні title/canonical/OG на 3 сторінках, robots.txt, sitemap.xml, prerendered-контент |

Один тест у `game-timer.cy.ts` навмисно чекає повні 60с (реальний
`REVEAL_TURN_SECONDS` бекенда, не замокано) — тому повний прогін триває
~1.5 хв, а не кілька секунд.
