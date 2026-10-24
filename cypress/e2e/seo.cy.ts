const pages: Array<{ path: string; titleContains: string }> = [
  { path: '/', titleContains: 'Бункер онлайн українською' },
  { path: '/create', titleContains: 'Створити кімнату' },
  { path: '/join', titleContains: 'Приєднатися до гри' },
];

describe('SEO', () => {
  pages.forEach(({ path, titleContains }) => {
    it(`sets a distinct title/description/canonical for ${path}`, () => {
      cy.visit(path);
      cy.title().should('contain', titleContains);
      cy.get('head meta[name="description"]').should('have.attr', 'content').and('not.be.empty');
      cy.get('head link[rel="canonical"]')
        .should('have.attr', 'href')
        .and('match', new RegExp(`${path === '/' ? '/?$' : path + '$'}`));
      cy.get('head meta[property="og:title"]')
        .should('have.attr', 'content')
        .and('contain', titleContains);
    });
  });

  it('serves robots.txt disallowing /room/ and allowing the static pages', () => {
    cy.request('/robots.txt').then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body).to.contain('Disallow: /room/');
      expect(res.body).to.contain('Allow: /');
      expect(res.body).to.contain('Sitemap:');
    });
  });

  it('serves a sitemap.xml listing the three static pages', () => {
    // sitemap.xml is a static public/ asset with the production domain baked
    // in (see SITE_URL in app-config.ts) — it doesn't vary with baseUrl.
    const PRODUCTION_ORIGIN = 'https://bunker-ui-708695421901.us-east1.run.app';
    cy.request('/sitemap.xml').then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body).to.contain('<urlset');
      pages.forEach(({ path }) => {
        expect(res.body).to.contain(`<loc>${PRODUCTION_ORIGIN}${path === '/' ? '/' : path}</loc>`);
      });
    });
  });

  it('renders real content server-side for a crawler that does not run JS', () => {
    // Prerendered output check: fetch the raw HTML (no JS execution) and look
    // for real page content, not just an empty <app-root></app-root> shell.
    cy.request('/').then((res) => {
      expect(res.body).to.contain('Бункер');
      expect(res.body).to.contain('Створити кімнату');
    });
  });
});
