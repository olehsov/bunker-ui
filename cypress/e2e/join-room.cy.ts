describe('Join room', () => {
  beforeEach(() => {
    cy.visit('/join');
  });

  it('blocks submission with empty fields', () => {
    cy.contains('button', 'Приєднатись').click();
    cy.contains("Вкажіть код кімнати та ім'я").should('be.visible');
  });

  it('shows a backend error for a non-existent room code', () => {
    cy.get('input[matInput]').eq(0).type('ZZZZZZ');
    cy.get('input[matInput]').eq(1).type('Гість');
    cy.contains('button', 'Приєднатись').click();
    cy.contains('не знайдено').should('be.visible');
  });

  it('joins an existing room and lands in the lobby as a non-owner', () => {
    cy.botCreateRoom('Хазяїн').then(({ code }) => {
      cy.joinRoomViaUI(code, 'Гість');
      cy.url().should('include', `/room/${code}/lobby`);
      cy.contains('.player', 'Хазяїн').within(() => cy.contains('Власник'));
      cy.contains('.player--self', 'Гість').within(() => {
        cy.contains('Власник').should('not.exist');
      });
      cy.contains('button', 'Я готовий').should('be.visible');
    });
  });

  it('shows an error when the room already started', () => {
    cy.botCreateRoom('Хазяїн2').then(({ playerId: ownerId, code }) => {
      const joiners = ['Боб', 'Ева', 'Нік'];
      cy.wrap(joiners).each((name: string) => {
        cy.botJoinRoom(code, name).then(({ playerId }) => {
          cy.botEmit(playerId, 'player:ready', { ready: true });
        });
      });
      cy.waitUntilBotState(ownerId, (room) => room.players.length === 4).then(() => {
        cy.botEmit(ownerId, 'owner:startGame');
      });
      cy.waitUntilBotState(ownerId, (room) => room.phase !== 'LOBBY');

      cy.get('input[matInput]').eq(0).type(code);
      cy.get('input[matInput]').eq(1).type('Запізнілий');
      cy.contains('button', 'Приєднатись').click();
      cy.contains('вже розпочалася').should('be.visible');
    });
  });
});
