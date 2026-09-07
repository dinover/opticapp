import { uniqueName } from '../../support/testData';
import type { AuthPayload } from '../../support/commands';

describe('Regression · Equipo (el owner invita y desactiva empleados)', () => {
  let ownerAuth: AuthPayload;
  const memberUsername = uniqueName('empleado');
  const memberPassword = 'password123';

  before(() => {
    cy.apiLogin(Cypress.env('qaUsername'), Cypress.env('qaPassword')).then((a) => (ownerAuth = a));
  });

  it('el owner crea un empleado nuevo desde /team', () => {
    cy.visitAsUser('/team', ownerAuth);
    cy.contains('button', 'Nuevo empleado').click();
    cy.get('#team-username').type(memberUsername);
    cy.get('#team-email').type(`${memberUsername}@opticapp.test`);
    cy.get('#team-password').type(memberPassword);
    cy.get('.modal-box').contains('button', 'Crear empleado').click();
    cy.contains(memberUsername).should('be.visible');
  });

  it('el empleado nuevo puede loguearse pero no puede ver /team ni /admin', () => {
    cy.loginUI(memberUsername, memberPassword);
    cy.location('pathname').should('eq', '/dashboard');

    cy.visit('/team');
    cy.location('pathname').should('eq', '/dashboard');

    cy.visit('/admin');
    cy.location('pathname').should('eq', '/dashboard');
  });

  it('el owner desactiva al empleado y este pierde el acceso', () => {
    cy.visitAsUser('/team', ownerAuth);
    cy.get(`button[aria-label="Desactivar usuario ${memberUsername}"]`).click();
    cy.confirmDialog('Desactivar');
    cy.contains(memberUsername).should('not.exist');

    // El localStorage todavía tiene el token del owner (de visitAsUser): sin
    // limpiarlo, /login redirige derecho a /dashboard antes de mostrar el
    // formulario.
    cy.clearLocalStorage();
    cy.loginUI(memberUsername, memberPassword);
    cy.contains(/credenciales inválidas/i).should('be.visible');
  });
});
