describe('Regression · Página 404', () => {
  it('una ruta desconocida sin sesión muestra la página 404, no un error', () => {
    cy.visit('/esto/no/existe/nunca', { failOnStatusCode: false });
    cy.contains('Esta página no existe').should('be.visible');
    cy.contains('a', 'Volver al inicio').should('have.attr', 'href', '/');
  });

  it('una ruta desconocida logueado también muestra la página 404', () => {
    cy.apiLogin(Cypress.env('qaUsername'), Cypress.env('qaPassword')).then((auth) => {
      cy.visitAsUser('/otra-ruta-que-no-existe', auth);
      cy.contains('Esta página no existe').should('be.visible');
    });
  });
});
