describe('Lobby', () => {
  afterEach(() => {
    cy.botDisconnectAll();
  });

  it('reflects player count and readiness as bots join and ready up, gating the start button', () => {
    cy.createRoomViaUI('Власник').then((code) => {
      cy.contains('.lobby__count', '/ 16 гравців').should('contain', '1 / 16');
      cy.contains('button', 'Розпочати гру').should('be.disabled');
      cy.contains(`Потрібно щонайменше 4 гравці`).should('be.visible');

      const botNames = ['Боб', 'Ева', 'Нік'];
      const playerIds: string[] = [];

      cy.wrap(botNames, { log: false }).each((name: string) =>
        cy.botJoinRoom(code, name).then(({ playerId }) => {
          playerIds.push(playerId);
        }),
      );

      cy.contains('.lobby__count', '/ 16 гравців').should('contain', '4 / 16');
      cy.contains('.player', 'Боб').within(() => cy.contains('Очікуємо'));
      cy.contains('button', 'Розпочати гру').should('be.disabled');
      cy.contains('Ще не готові: Боб, Ева, Нік').should('be.visible');

      cy.wrap(null).then(() => {
        playerIds.forEach((id) => cy.botEmit(id, 'player:ready', { ready: true }));
      });

      cy.contains('.player', 'Боб').within(() => cy.contains('Готовий'));
      cy.contains('.player', 'Ева').within(() => cy.contains('Готовий'));
      cy.contains('.player', 'Нік').within(() => cy.contains('Готовий'));
      cy.contains('button', 'Розпочати гру').should('be.enabled');
    });
  });

  it('lets the owner rename and pick bunker/cataclysm, visible to a non-owner', () => {
    cy.createRoomViaUI('Стас').then((code) => {
      cy.get('input[matInput]').clear().type('Стасян');
      cy.get('input[matInput]').blur();
      cy.contains('.player--self', 'Стасян').should('be.visible');

      cy.botJoinRoom(code, 'Марта').then(({ playerId }) => {
        cy.botGetState(playerId).then((room) => {
          expect(room?.bunkerId).to.be.null;
          expect(room?.cataclysmId).to.be.null;
        });

        cy.contains('mat-form-field', 'Бункер').find('mat-select').click();
        cy.get('mat-option').first().click();
        cy.waitUntilBotState(playerId, (room) => !!room.bunkerId);

        cy.contains('mat-form-field', 'Катаклізм').find('mat-select').click();
        cy.get('mat-option').first().click();
        cy.waitUntilBotState(playerId, (room) => !!room.cataclysmId);
      });
    });
  });

  it('shows a player as disconnected when their socket drops', () => {
    cy.createRoomViaUI('Господар').then((code) => {
      cy.botJoinRoom(code, 'Зникомий').then(({ playerId }) => {
        cy.contains('.player', 'Зникомий').find('.player__offline').should('not.exist');
        cy.botDisconnect(playerId);
        cy.contains('.player', 'Зникомий').find('.player__offline').should('exist');
      });
    });
  });

  it('lets a non-owner toggle ready, and the owner has no ready button', () => {
    cy.botCreateRoom('Господар2').then(({ code }) => {
      cy.joinRoomViaUI(code, 'Я');
      cy.url().should('include', `/room/${code}/lobby`);

      cy.contains('button', 'Я готовий').click();
      cy.contains('.player--self', 'Я').within(() => cy.contains('Готовий'));
      cy.contains('button', 'Скасувати готовність').click();
      cy.contains('.player--self', 'Я').within(() => cy.contains('Очікуємо'));
    });
  });
});
