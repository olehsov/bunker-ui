describe('Game — special condition cards', () => {
  afterEach(() => {
    cy.botDisconnectAll();
  });

  it('deals two cards, plays one via the dialog, and shows bot plays in the log', () => {
    cy.startGameWithBots('Власник', ['Боб', 'Ева', 'Нік']).then(({ botIds }) => {
      const [bob] = botIds;

      // Two unplayed cards in the tray; the first is always playable outside voting.
      cy.get('.tray__special app-special-card').should('have.length', 2);
      cy.get('.tray__special .special-card--playable').first().click();

      // Pick a target when the card needs one, then play it.
      cy.get('app-play-card-dialog').then(($dialog) => {
        if ($dialog.find('.target').length) {
          cy.contains('.target', 'Боб').click();
        }
      });
      cy.contains('button', 'Зіграти').click();

      cy.get('.tray__special app-special-card').should('have.length', 1);
      cy.contains('app-game-log', 'Власник грає «').should('be.visible');
      cy.get('.row__player--self').find('.tag--special').should('contain', '1');

      // A bot plays its own guaranteed ANY-timing card on the owner; the real
      // player sees it in the log without reloading.
      cy.botGetState(bob).then((room) => {
        const me = room!.players.find((p) => p.isSelf)!;
        const card = me.specialCards.find((c) => !c.used && c.timing === 'ANY')!;
        cy.botEmit(bob, 'player:playSpecialCard', {
          cardId: card.id,
          targetPlayerId: card.target === 'none' ? null : room!.ownerId,
        });
        cy.contains('app-game-log', `Боб грає «${card.title}»`).should('be.visible');
      });
    });
  });

  it('keeps voting-only cards locked outside a vote', () => {
    cy.startGameWithBots('Власник', ['Боб', 'Ева', 'Нік']).then(({ botIds }) => {
      cy.botGetState(botIds[0]).then((room) => {
        const me = room!.players.find((p) => p.isSelf)!;
        const votingCard = me.specialCards.find((c) => c.timing === 'VOTING');
        if (!votingCard) {
          return;
        }
        cy.botEmit(botIds[0], 'player:playSpecialCard', { cardId: votingCard.id });
        // cy.task isn't retried, so give the server a moment to answer first.
        cy.wait(500);
        cy.task<string | null>('bot:getLastError', { playerId: botIds[0] }).then((error) => {
          expect(error).to.contain('лише під час голосування');
        });
      });
    });
  });
});
