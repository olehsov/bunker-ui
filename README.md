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

Backend URL захардкожений у [`src/app/core/config/app-config.ts`](src/app/core/config/app-config.ts) — змінити тут, якщо API піднято на іншому хості.

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
- **Таймери (60с хід / 60с голосування) — суто клієнтські**, без
  server-enforced дедлайнів (як і задумано в ТЗ): скидаються локально при
  зміні `activePlayerId` або `voting.sessionIndex`.
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
