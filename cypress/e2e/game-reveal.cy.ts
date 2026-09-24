describe('Game — round 1 reveal', () => {
  afterEach(() => {
    cy.botDisconnectAll();
  });

  it('enforces turn order and forces PROFESSION in round 1, then advances the round', () => {
    cy.startGameWithBots('Власник', ['Боб', 'Ева', 'Нік']).then(({ botIds }) => {
      const [bob, eva, nik] = botIds;

      // Round 1 always starts with the owner (the real player).
      cy.contains('.bar__active', 'Хід: Власник').should('be.visible');
      cy.contains('.tray__hint', 'відкрити').should('be.visible');

      // Only PROFESSION is revealable in round 1 — reveal it via the confirm dialog.
      cy.get('[aria-label="Відкрити властивість Професія"]').click();
      cy.contains('mat-dialog-content', 'Професія').should('be.visible');
      cy.contains('button', 'Відкрити').click();

      // Turn passes to the first bot (join order); the real player can no longer act.
      cy.contains('.bar__active', 'Хід: Боб').should('be.visible');
      cy.contains('.tray__hint', 'відкрити').should('not.exist');
      cy.get('.row__player--self')
        .parent()
        .find('.row__cell')
        .first()
        .should('not.have.class', 'row__cell--hidden');

      cy.waitUntilBotState(bob, (room) => room.activePlayerId === bob).then(() => {
        cy.botRevealTurn(bob);
      });
      cy.contains('.bar__active', 'Хід: Ева').should('be.visible');

      cy.waitUntilBotState(eva, (room) => room.activePlayerId === eva).then(() => {
        cy.botRevealTurn(eva);
      });
      cy.contains('.bar__active', 'Хід: Нік').should('be.visible');

      cy.waitUntilBotState(nik, (room) => room.activePlayerId === nik).then(() => {
        cy.botRevealTurn(nik);
      });

      // 4 players, round 1 → 0 voting sessions scheduled → straight to AWAITING_NEXT_ROUND.
      cy.waitUntilBotState(bob, (room) => room.phase === 'AWAITING_NEXT_ROUND');
      cy.contains('button', 'Розпочати раунд 2').should('be.visible');

      // Everyone's PROFESSION column is now publicly revealed on the board.
      cy.get('.board tbody tr').should('have.length', 4);
      cy.get('.board tbody tr').each(($row) => {
        cy.wrap($row).find('.row__cell').first().should('not.have.class', 'row__cell--hidden');
      });
    });
  });

  it("rejects revealing another player's turn via a direct socket action", () => {
    cy.startGameWithBots('Хазяйка', ['Ант', 'Біб', 'Сім']).then(({ botIds }) => {
      const [ant] = botIds;
      // It's the owner's (real player's) turn — a bot trying to act now must be rejected.
      cy.botEmit(ant, 'player:revealTrait', { category: 'PROFESSION' });
      cy.botGetState(ant).then((room) => {
        expect(room?.activePlayerId).to.eq(room?.ownerId);
      });
      // Give the rejection a moment to round-trip back over the socket.
      cy.wait(500);
      cy.task('bot:getLastError', { playerId: ant }).should('eq', 'Зараз не ваш хід');
    });
  });
});
