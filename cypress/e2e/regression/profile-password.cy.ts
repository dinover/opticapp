import { uniqueName } from '../../support/testData';
import type { AuthPayload } from '../../support/commands';

/**
 * Prueba el cambio de contraseña con una cuenta descartable (un empleado
 * creado y desactivado por la propia cuenta QA), en vez de tocar la
 * contraseña real de la cuenta QA: si un cambio fallara a mitad de camino,
 * dejaría al Sanity sin poder loguearse en la próxima corrida.
 */
describe('Regression · Cambio de contraseña propia', () => {
  let ownerAuth: AuthPayload;
  let memberAuth: AuthPayload;
  const username = uniqueName('pass_test');
  const originalPassword = 'password123';
  const newPassword = 'password456';

  before(() => {
    cy.apiLogin(Cypress.env('qaUsername'), Cypress.env('qaPassword')).then((owner) => {
      ownerAuth = owner;
      return cy.apiRequest(
        'POST',
        '/auth/team/users',
        { username, email: `${username}@opticapp.test`, password: originalPassword },
        ownerAuth.token
      );
    });
  });

  after(() => {
    cy.apiRequest('GET', '/auth/team/users', undefined, ownerAuth.token).then((resp) => {
      const member = resp.body.find((u: any) => u.username === username);
      if (member) cy.apiRequest('DELETE', `/auth/team/users/${member.id}`, undefined, ownerAuth.token);
    });
  });

  it('rechaza el cambio si la contraseña actual está mal', () => {
    cy.apiLogin(username, originalPassword).then((a) => {
      memberAuth = a;
      cy.visitAsUser('/profile', memberAuth);
    });

    cy.get('#current_password').type('esta-no-es-la-actual');
    cy.get('#new_password').type(newPassword);
    cy.get('#confirm_password').type(newPassword);
    cy.contains('button', 'Cambiar contraseña').click();
    cy.contains('La contraseña actual no es correcta').should('be.visible');
  });

  it('exige que la confirmación coincida con la contraseña nueva', () => {
    cy.visitAsUser('/profile', memberAuth);
    cy.get('#current_password').type(originalPassword);
    cy.get('#new_password').type(newPassword);
    cy.get('#confirm_password').type(`${newPassword}-distinto`);
    cy.contains('button', 'Cambiar contraseña').click();
    cy.contains('La contraseña nueva y su confirmación no coinciden').should('be.visible');
  });

  it('cambia la contraseña con datos válidos, y la vieja deja de servir', () => {
    cy.visitAsUser('/profile', memberAuth);
    cy.get('#current_password').type(originalPassword);
    cy.get('#new_password').type(newPassword);
    cy.get('#confirm_password').type(newPassword);
    cy.contains('button', 'Cambiar contraseña').click();
    cy.contains('Contraseña actualizada correctamente').should('be.visible');

    // El localStorage todavía tiene el token vigente (de visitAsUser): sin
    // limpiarlo, /login redirige derecho a /dashboard antes de mostrar el
    // formulario.
    cy.clearLocalStorage();
    cy.loginUI(username, originalPassword);
    cy.contains(/credenciales inválidas/i).should('be.visible');

    cy.loginUI(username, newPassword);
    cy.location('pathname').should('eq', '/dashboard');
  });
});
