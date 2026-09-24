describe('Edge cases', () => {
  afterEach(() => {
    cy.botDisconnectAll();
  });

  it('redirects to /join with the code prefilled when visiting a lobby without a session', () => {
    cy.botCreateRoom('Хтось').then(({ code }) => {
      cy.visit(`/room/${code}/lobby`);
      cy.url().should('include', '/join');
      cy.url().should('include', `code=${code}`);
      cy.get('input[matInput]').eq(0).should('have.value', code);
    });
  });

  it('redirects to /join with the code prefilled when visiting a game page without a session', () => {
    cy.botCreateRoom('ІншийХтось').then(({ code }) => {
      cy.visit(`/room/${code}/game`);
      cy.url().should('include', '/join');
      cy.url().should('include', `code=${code}`);
    });
  });

  it('keeps the same identity across a page reload (session persistence)', () => {
    cy.createRoomViaUI('Постійний').then((code) => {
      cy.reload();
      cy.url().should('include', `/room/${code}/lobby`);
      cy.contains('.player--self', 'Постійний').within(() => cy.contains('Власник'));
    });
  });

  it('rejects joining once the room is at MAX_PLAYERS (16)', () => {
    cy.botCreateRoom('Заповнювач').then(({ code }) => {
      const names = Array.from({ length: 15 }, (_, i) => `Гравець${i}`);
      cy.wrap(names, { log: false }).each((name: string) => cy.botJoinRoom(code, name));

      cy.joinRoomViaUI(code, 'Зайвий');
      cy.contains('максимум').should('be.visible');
      cy.url().should('include', '/join');
    });
  });
});

describe('Edge cases — REST API', () => {
  // This Cypress version only exposes env vars via the async `cy.env()` command
  // and `Cypress.config('env')` isn't reliably populated at spec-load time —
  // read it through the same Node-side task the bot manager already uses.
  let apiUrl: string;

  before(() => {
    cy.task<string>('env:apiUrl').then((url) => {
      apiUrl = url;
    });
  });

  it('404s for a room code that does not exist', () => {
    cy.request({ url: `${apiUrl}/rooms/ZZZZZZ`, failOnStatusCode: false }).then((res) => {
      expect(res.status).to.eq(404);
    });
  });

  it('deletes the room when the owner leaves the lobby, and just removes a member otherwise', () => {
    cy.botCreateRoom('Хазяїн').then(({ code, playerId: ownerId }) => {
      cy.botJoinRoom(code, 'Другий').then(({ playerId: memberId }) => {
        cy.request('POST', `${apiUrl}/rooms/${code}/leave`, { playerId: memberId }).then((res) => {
          expect(res.body.players).to.have.length(1);
        });
        cy.request('POST', `${apiUrl}/rooms/${code}/leave`, { playerId: ownerId });
        cy.request({ url: `${apiUrl}/rooms/${code}`, failOnStatusCode: false }).then((res) => {
          expect(res.status).to.eq(404);
        });
      });
    });
  });
});
