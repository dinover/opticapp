describe('Sanity · Autenticación', () => {
  it('la pantalla de login carga con el formulario visible', () => {
    cy.visit('/login');
    cy.get('input[type="text"]').should('be.visible');
    cy.get('input[type="password"]').should('be.visible');
    cy.get('button[type="submit"]').should('contain.text', 'Ingresar');
  });

  it('rechaza credenciales inválidas y muestra un error', () => {
    cy.loginUI('usuario_que_no_existe', 'password-incorrecto');
    cy.location('pathname').should('eq', '/login');
    cy.contains(/credenciales inválidas/i).should('be.visible');
  });

  it('permite iniciar sesión con la cuenta de QA y llegar al dashboard', () => {
    const username = Cypress.env('qaUsername');
    const password = Cypress.env('qaPassword');
    cy.loginUI(username, password);
    cy.location('pathname').should('eq', '/dashboard');
    cy.get('.page-title').should('contain.text', 'Dashboard');
    cy.contains(username).should('be.visible');
  });

  it('permite cerrar sesión y vuelve a pedir login', () => {
    cy.loginAsQA('/dashboard');
    cy.contains('button', 'Salir').click();
    cy.location('pathname').should('eq', '/login');
    // Una vez fuera, una ruta privada redirige de nuevo a /login.
    cy.visit('/dashboard');
    cy.location('pathname').should('eq', '/login');
  });
});
