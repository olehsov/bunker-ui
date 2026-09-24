import { RoomSnapshot } from '../../src/app/core/models/room.models';

export interface BotSession {
  playerId: string;
  code: string;
  room: RoomSnapshot;
}

Cypress.Commands.add('createRoomViaUI', (ownerName: string) => {
  cy.visit('/create');
  cy.get('input[matInput]').first().type(ownerName);
  cy.contains('button', 'Створити').click();
  cy.url().should('match', /\/room\/[A-Z0-9]+\/lobby$/);
  return cy.location('pathname').then((pathname) => {
    const code = pathname.split('/')[2];
    return cy.wrap(code, { log: false });
  });
});

Cypress.Commands.add('joinRoomViaUI', (code: string, name: string) => {
  cy.visit('/join');
  cy.get('input[matInput]').eq(0).type(code);
  cy.get('input[matInput]').eq(1).type(name);
  cy.contains('button', 'Приєднатись').click();
});

Cypress.Commands.add('botCreateRoom', (ownerName: string) => {
  return cy.task<BotSession>('bot:createRoom', { ownerName });
});

Cypress.Commands.add('botJoinRoom', (code: string, name: string) => {
  return cy.task<BotSession>('bot:joinRoom', { code, name });
});

Cypress.Commands.add('botEmit', (playerId: string, event: string, payload?: unknown) => {
  return cy.task('bot:emit', { playerId, event, payload });
});

Cypress.Commands.add('botGetState', (playerId: string) => {
  return cy.task<RoomSnapshot | null>('bot:getState', { playerId }, { log: false });
});

Cypress.Commands.add('botRevealTurn', (playerId: string) => {
  return cy.task('bot:revealTurn', { playerId });
});

Cypress.Commands.add('botVoteRandom', (playerId: string) => {
  return cy.task('bot:voteRandom', { playerId });
});

Cypress.Commands.add('botDisconnect', (playerId: string) => {
  return cy.task('bot:disconnect', { playerId });
});

Cypress.Commands.add('botDisconnectAll', () => {
  return cy.task('bot:disconnectAll');
});

/**
 * Polls a bot's view of the room until `predicate` passes. Used instead of
 * `cy.task(...).should(...)` because cy.task isn't reliably auto-retried —
 * this recursive `.then()` chain gives us full control over the polling.
 */
Cypress.Commands.add(
  'waitUntilBotState',
  (
    playerId: string,
    predicate: (room: RoomSnapshot) => boolean,
    options?: { timeout?: number; interval?: number },
  ) => {
    const timeout = options?.timeout ?? 15000;
    const interval = options?.interval ?? 250;
    const deadline = Date.now() + timeout;

    const attempt = (): Cypress.Chainable<RoomSnapshot> =>
      cy.task<RoomSnapshot | null>('bot:getState', { playerId }, { log: false }).then((state) => {
        if (state && predicate(state)) {
          return cy.wrap(state, { log: false });
        }
        if (Date.now() > deadline) {
          throw new Error(
            `waitUntilBotState timed out after ${timeout}ms for player ${playerId} (last state: ${JSON.stringify(state)})`,
          );
        }
        return cy.wait(interval, { log: false }).then(attempt);
      });

    return attempt();
  },
);

export interface GameSetup {
  code: string;
  /** Bot player ids in join order (same order as the `botNames` passed in). */
  botIds: string[];
}

/**
 * Creates a room via the real UI (the real player becomes owner), joins+readies
 * `botNames.length` bots, starts the game, then starts round 1 — all via the UI
 * for owner actions and via bot tasks for the simulated players. Leaves the
 * real browser on the game page mid-round-1-reveal, with the owner (real
 * player) as the first active player (round 1 always starts with the owner).
 */
Cypress.Commands.add('startGameWithBots', (realOwnerName: string, botNames: string[]) => {
  return cy.createRoomViaUI(realOwnerName).then((code) => {
    const botIds: string[] = [];

    return cy
      .wrap(botNames, { log: false })
      .each((name: string) =>
        cy.botJoinRoom(code, name).then(({ playerId }) => {
          botIds.push(playerId);
          cy.botEmit(playerId, 'player:ready', { ready: true });
        }),
      )
      .then(() => {
        cy.contains('mat-chip', '/ 16 гравців').should('contain', `${botNames.length + 1} / 16`);
        cy.contains('button', 'Розпочати гру').should('be.enabled').click();
        cy.url().should('include', `/room/${code}/game`);
        cy.contains('button', 'Розпочати раунд 1').click();
        cy.contains('.bar__phase', 'Відкриття властивостей').should('be.visible');
        return cy.wrap({ code, botIds } as GameSetup, { log: false });
      });
  });
});

/**
 * Drives a whole REVEAL phase (any round) to completion: whenever it's the
 * real player's turn, reveals their first revealable card via the UI;
 * whenever it's a bot's turn, reveals via the bot task. Polls `pollPlayerId`'s
 * view (any bot works — phase/round/activePlayerId aren't viewer-masked).
 * Resolves once the phase moves on from REVEAL.
 */
Cypress.Commands.add('playOutRevealPhase', (pollPlayerId: string, botIds: string[]) => {
  const step = (): Cypress.Chainable<unknown> =>
    cy.botGetState(pollPlayerId).then((room): Cypress.Chainable<unknown> => {
      if (!room || room.phase !== 'REVEAL') {
        return cy.wrap<unknown>(null, { log: false });
      }
      const activeId = room.activePlayerId;
      if (!activeId) {
        return cy.wait(200, { log: false }).then(step);
      }
      if (botIds.includes(activeId)) {
        return cy
          .botRevealTurn(activeId)
          .then(() => cy.wait(150, { log: false }))
          .then(step);
      }
      // Not a bot, so it must be the real player's turn — reveal via the UI.
      return cy
        .get('.tray [role="button"]', { timeout: 10000 })
        .first()
        .click()
        .then(() => cy.contains('button', 'Відкрити').click())
        .then(() => cy.wait(300, { log: false }))
        .then(step);
    });

  return step();
});

declare global {
  namespace Cypress {
    interface Chainable {
      /** Fills out /create as `ownerName` and waits for the lobby redirect; yields the room code. */
      createRoomViaUI(ownerName: string): Chainable<string>;
      /** Fills out /join with `code`/`name` and submits. Does not wait for the result — assert after. */
      joinRoomViaUI(code: string, name: string): Chainable<void>;
      /** Creates a room via REST and opens a socket for it — a simulated player, not driven through the UI. */
      botCreateRoom(ownerName: string): Chainable<BotSession>;
      /** Joins an existing room via REST and opens a socket for it. */
      botJoinRoom(code: string, name: string): Chainable<BotSession>;
      /** Emits a raw socket event as the given bot (e.g. 'player:ready', 'owner:startRound'). */
      botEmit(playerId: string, event: string, payload?: unknown): Chainable<null>;
      /** The latest room:state a bot's socket has received, or null before the first one arrives. */
      botGetState(playerId: string): Chainable<RoomSnapshot | null>;
      /** If it's this bot's turn in REVEAL phase, reveals its next trait (PROFESSION first in round 1). No-op otherwise. */
      botRevealTurn(playerId: string): Chainable<{ revealed: boolean; category?: string }>;
      /** Casts a random valid vote for this bot during VOTING phase if it hasn't voted yet. No-op otherwise. */
      botVoteRandom(playerId: string): Chainable<{ voted: boolean; targetId?: string }>;
      /** Disconnects one bot's socket. */
      botDisconnect(playerId: string): Chainable<null>;
      /** Disconnects every bot's socket — call in afterEach to avoid leaking sockets across tests. */
      botDisconnectAll(): Chainable<null>;
      /** Polls (via bot:getState) until `predicate(room)` is true, or throws after `timeout` ms. */
      waitUntilBotState(
        playerId: string,
        predicate: (room: RoomSnapshot) => boolean,
        options?: { timeout?: number; interval?: number },
      ): Chainable<RoomSnapshot>;
      /** Full setup: real player creates+owns a room, `botNames` bots join+ready, game and round 1 start. */
      startGameWithBots(realOwnerName: string, botNames: string[]): Chainable<GameSetup>;
      /** Drives the current REVEAL phase to completion, mixing UI actions (real player) and bot tasks. */
      playOutRevealPhase(pollPlayerId: string, botIds: string[]): Chainable<unknown>;
    }
  }
}
