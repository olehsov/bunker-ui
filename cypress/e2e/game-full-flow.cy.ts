/** Plays a full 4-player game to completion: 5 rounds, with elimination votes in rounds 4 and 5. */
describe('Game — full flow to Game Over', () => {
  afterEach(() => {
    cy.botDisconnectAll();
  });

  it('reaches FINISHED with the right survivors after two eliminations', () => {
    cy.startGameWithBots('Виживач', ['Боб', 'Ева', 'Нік']).then(({ botIds }) => {
      const [bob, eva, nik] = botIds;

      cy.playOutRevealPhase(bob, botIds); // round 1 — no vote (4p schedule)
      cy.contains('button', 'Розпочати раунд 2').click();
      cy.playOutRevealPhase(bob, botIds); // round 2 — no vote
      cy.contains('button', 'Розпочати раунд 3').click();
      cy.playOutRevealPhase(bob, botIds); // round 3 — no vote
      cy.contains('button', 'Розпочати раунд 4').click();
      cy.playOutRevealPhase(bob, botIds); // round 4 — 1 vote scheduled

      cy.contains('button', 'Розпочати голосування').click();
      cy.botGetState(bob).then((room) => {
        const owner = room!.ownerId;
        cy.botEmit(bob, 'player:castVote', { targetPlayerId: nik });
        cy.botEmit(eva, 'player:castVote', { targetPlayerId: nik });
        cy.botEmit(nik, 'player:castVote', { targetPlayerId: owner });
        cy.contains('.candidate', 'Нік').click();
        cy.waitUntilBotState(bob, (r) => r.voting?.allVoted === true);
        cy.contains('button', 'Завершити голосування').click();
        cy.waitUntilBotState(bob, (r) => r.phase === 'AWAITING_NEXT_ROUND');
      });
      cy.botGetState(bob).then((room) => {
        expect(room!.players.find((p) => p.id === nik)!.eliminated).to.eq(true);
      });

      cy.contains('button', 'Розпочати раунд 5').click();
      cy.playOutRevealPhase(bob, botIds); // round 5 — final vote scheduled

      cy.contains('button', 'Розпочати голосування').click();
      cy.botGetState(bob).then(() => {
        // 3 remaining active players (owner, bob, eva) — 2 votes for Боб is a clean majority.
        cy.botEmit(eva, 'player:castVote', { targetPlayerId: bob });
        cy.botEmit(bob, 'player:castVote', { targetPlayerId: eva });
        cy.contains('.candidate', 'Боб').click();
        cy.waitUntilBotState(bob, (r) => r.voting?.allVoted === true);
        cy.contains('button', 'Завершити голосування').click();
      });

      cy.waitUntilBotState(bob, (r) => r.phase === 'FINISHED', { timeout: 10000 });

      cy.contains('h1', 'Гру завершено').should('be.visible');
      cy.contains('У бункер потрапили 2 із 4 гравців').should('be.visible');
      cy.get('.group')
        .contains('h2', 'Вижили')
        .parent()
        .as('survivorsGroup')
        .find('app-player-panel')
        .should('have.length', 2);
      cy.get('@survivorsGroup').should('contain', 'Виживач');
      cy.get('.group')
        .contains('h2', 'Вигнані')
        .parent()
        .find('app-player-panel')
        .should('have.length', 2);

      cy.contains('button', 'На головну').click();
      cy.url().should('eq', Cypress.config().baseUrl + '/');
    });
  });
});
