describe('Create room', () => {
  beforeEach(() => {
    cy.visit('/create');
  });

  it('blocks submission with an empty name and does not call the API', () => {
    cy.intercept('POST', '**/rooms').as('createRoom');
    cy.contains('button', 'Створити').click();
    cy.contains("Вкажіть ваше ім'я").should('be.visible');
    cy.get('@createRoom.all').should('have.length', 0);
  });

  it('creates a room and lands in the lobby as owner', () => {
    cy.get('input[matInput]').first().type('Олег');
    cy.contains('button', 'Створити').click();

    cy.url().should('match', /\/room\/[A-Z0-9]+\/lobby$/);
    cy.contains('.room-code__value', /^[A-Z0-9]+$/).should('be.visible');
    cy.contains('.player--self', 'Олег').within(() => {
      cy.contains('Власник').should('be.visible');
    });

    cy.location('pathname').then((pathname) => {
      const code = pathname.split('/')[2];
      cy.window().then((win) => {
        expect(win.sessionStorage.getItem(`bunker:session:${code}`)).to.not.be.null;
      });
    });
  });

  it('navigates back home', () => {
    cy.get('a[aria-label="Назад"]').click();
    cy.url().should('eq', Cypress.config().baseUrl + '/');
  });
});
