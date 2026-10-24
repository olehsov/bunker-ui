describe('Home page', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('shows the hero content', () => {
    cy.contains('h1', 'Бункер').should('be.visible');
    cy.contains('Катастрофа сталася').should('be.visible');
  });

  it('navigates to /create', () => {
    cy.contains('button', 'Створити кімнату').click();
    cy.url().should('include', '/create');
  });

  it('navigates to /join', () => {
    cy.contains('button', 'Приєднатись до гри').click();
    cy.url().should('include', '/join');
  });

  it('navigates to /rules', () => {
    cy.contains('a', 'Правила').click();
    cy.url().should('include', '/rules');
    cy.contains('h1', 'Правила гри').should('be.visible');
  });

  it('sets the SEO title and description', () => {
    cy.title().should('contain', 'Бункер онлайн українською');
    cy.get('head meta[name="description"]').should('have.attr', 'content').and('contain', 'Бункер');
    cy.get('head link[rel="canonical"]').should('exist');
  });
});
