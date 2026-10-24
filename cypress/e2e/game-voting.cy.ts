/**
 * With exactly 4 players, ELIMINATION_SCHEDULE only schedules a voting session
 * in rounds 4 and 5 — so getting to a vote means playing rounds 1-3 reveal-only.
 */
function playToFirstVote(botIds: string[]) {
  const [first] = botIds;
  cy.playOutRevealPhase(first, botIds); // round 1 (started by startGameWithBots)
  cy.contains('button', 'Розпочати раунд 2').click();
  cy.playOutRevealPhase(first, botIds);
  cy.contains('button', 'Розпочати раунд 3').click();
  cy.playOutRevealPhase(first, botIds);
  cy.contains('button', 'Розпочати раунд 4').click();
  cy.playOutRevealPhase(first, botIds);
  cy.contains('button', 'Розпочати голосування').click();
  cy.contains('.voting', 'Голосування').should('be.visible');
}

describe('Game — voting', () => {
  afterEach(() => {
    cy.botDisconnectAll();
  });

  it('eliminates the unanimous target and reveals all their traits', () => {
    cy.startGameWithBots('Хазяйка', ['Боб', 'Ева', 'Нік']).then(({ botIds }) => {
      const [bob, eva, nik] = botIds;
      playToFirstVote(botIds);

      cy.botGetState(bob).then((room) => {
        const owner = room!.ownerId;

        cy.botEmit(bob, 'player:castVote', { targetPlayerId: nik });
        cy.botEmit(eva, 'player:castVote', { targetPlayerId: nik });
        cy.botEmit(nik, 'player:castVote', { targetPlayerId: owner });
        cy.contains('.candidate', 'Нік').click();

        cy.waitUntilBotState(bob, (r) => r.voting?.allVoted === true);
        cy.contains('button', 'Завершити голосування').should('be.enabled').click();

        cy.waitUntilBotState(bob, (r) => r.players.some((p) => p.eliminated));
        cy.contains('.row__player', 'Нік').should('have.class', 'row__player--eliminated');
      });

      cy.botGetState(bob).then((room) => {
        const nikPlayer = room!.players.find((p) => p.id === nik)!;
        expect(nikPlayer.eliminated).to.eq(true);
        expect(nikPlayer.publiclyRevealedCategories).to.have.length(9);
      });

      cy.contains('button', 'Розпочати раунд 5').should('be.visible');
    });
  });

  it('shows a tie banner and lets the owner restart voting', () => {
    cy.startGameWithBots('Хазяїн2', ['Боб2', 'Ева2', 'Нік2']).then(({ botIds }) => {
      const [bob, eva, nik] = botIds;
      playToFirstVote(botIds);

      cy.botGetState(bob).then((room) => {
        const owner = room!.ownerId;

        // 2 votes for Нік2, 2 votes for the owner (real player) — a tie.
        cy.botEmit(bob, 'player:castVote', { targetPlayerId: nik });
        cy.botEmit(eva, 'player:castVote', { targetPlayerId: owner });
        cy.botEmit(nik, 'player:castVote', { targetPlayerId: owner });
        cy.contains('.candidate', 'Нік2').click();

        cy.waitUntilBotState(bob, (r) => r.voting?.allVoted === true);
        cy.contains('button', 'Завершити голосування').click();

        cy.contains('Нічия!').should('be.visible');
        cy.contains('button', 'Перезапустити голосування').click();

        // Restarted session: vote unanimously for Нік2 this time to resolve it.
        cy.waitUntilBotState(bob, (r) => r.voting?.sessionIndex === 1 && !r.voting.lastResult);
        cy.botEmit(bob, 'player:castVote', { targetPlayerId: nik });
        cy.botEmit(eva, 'player:castVote', { targetPlayerId: nik });
        cy.botEmit(nik, 'player:castVote', { targetPlayerId: owner });
        cy.contains('.candidate', 'Нік2').click();

        cy.waitUntilBotState(bob, (r) => r.voting?.allVoted === true);
        cy.contains('button', 'Завершити голосування').click();
        cy.waitUntilBotState(bob, (r) => r.players.some((p) => p.eliminated));
      });

      cy.contains('button', 'Розпочати раунд 5').should('be.visible');
    });
  });
});
