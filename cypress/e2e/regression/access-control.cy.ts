import type { AuthPayload } from '../../support/commands';

describe('Regression · Control de acceso por rol', () => {
  const privateRoutes = ['/dashboard', '/clients', '/products', '/sales', '/suppliers', '/import', '/reports', '/team', '/profile', '/admin'];

  privateRoutes.forEach((path) => {
    it(`sin sesión, ${path} redirige a /login`, () => {
      cy.visit(path);
      cy.location('pathname').should('eq', '/login');
    });
  });

  it('la cuenta owner no puede entrar a /admin (es exclusivo del admin del sistema)', () => {
    cy.apiLogin(Cypress.env('qaUsername'), Cypress.env('qaPassword')).then((auth: AuthPayload) => {
      cy.visitAsUser('/admin', auth);
      cy.location('pathname').should('eq', '/dashboard');
    });
  });

  it('la cuenta admin del sistema no tiene acceso a /team (exclusivo de un owner)', () => {
    cy.apiLogin(Cypress.env('adminUsername'), Cypress.env('adminPassword')).then((auth: AuthPayload) => {
      cy.visitAsUser('/team', auth);
      cy.location('pathname').should('eq', '/dashboard');
    });
  });
});
