function timerSeconds(): Cypress.Chainable<number> {
  return cy
    .get('.timer span')
    .invoke('text')
    .then((text) => parseInt(text.replace(/\D/g, ''), 10));
}

describe('Game — reveal timer', () => {
  afterEach(() => {
    cy.botDisconnectAll();
  });

  it('counts down during the active turn', () => {
    cy.startGameWithBots('Господар', ['Ада', 'Боря', 'Віка']).then(() => {
      timerSeconds().should('be.closeTo', 60, 3);
      cy.wait(2200);
      timerSeconds().should('be.lessThan', 60);
    });
  });

  it('survives a page reload instead of resetting to the full duration', () => {
    cy.startGameWithBots('Хазяїн', ['Аня', 'Боб', 'Віт']).then(() => {
      cy.wait(3000);
      let before = 0;
      timerSeconds().then((s) => {
        before = s;
        expect(before).to.be.lessThan(58);

        cy.reload();
        cy.contains('.bar__phase', 'Відкриття властивостей').should('be.visible');
        // Still counting down from where the server's deadline says, not reset to 60.
        timerSeconds().should((after) => {
          expect(after).to.be.lessThan(60);
          expect(after).to.be.at.most(before + 1);
        });
      });
    });
  });

  it('auto-reveals a random trait and advances the turn once the deadline passes', () => {
    cy.startGameWithBots('Власниця', ['Тіна', 'Юра', 'Лев']).then(({ botIds }) => {
      const [tina] = botIds;
      // Real player (owner) just lets their own turn time out — REVEAL_TURN_SECONDS is 60s server-side.
      cy.waitUntilBotState(tina, (room) => room.activePlayerId === tina, { timeout: 70000 });

      cy.botGetState(tina).then((room) => {
        const owner = room?.players.find((p) => p.id === room?.ownerId);
        expect(owner?.publiclyRevealedCategories).to.include('PROFESSION');
      });
      cy.contains('.bar__active', 'Хід: Тіна').should('be.visible');
    });
  });
});
