import { uniqueName } from '../../support/testData';

describe('Regression · Validaciones de autenticación', () => {
  it('usuario y contraseña son campos obligatorios del formulario', () => {
    cy.visit('/login');
    cy.get('button[type="submit"]').click();
    cy.get('input[type="text"]:invalid').should('exist');
  });

  it('login con usuario inexistente muestra "Credenciales inválidas"', () => {
    cy.loginUI(uniqueName('nadie'), 'cualquier-cosa');
    cy.contains(/credenciales inválidas/i).should('be.visible');
  });

  it('login con la contraseña equivocada de un usuario real muestra el mismo error genérico', () => {
    // No debe distinguir "usuario no existe" de "contraseña incorrecta": es una
    // decisión de seguridad deliberada (no filtrar qué usernames existen).
    cy.loginUI(Cypress.env('qaUsername'), 'password-definitivamente-incorrecto');
    cy.contains(/credenciales inválidas/i).should('be.visible');
    cy.location('pathname').should('eq', '/login');
  });

  it('solicitar acceso valida que las contraseñas coincidan (sin llamar a la API)', () => {
    cy.visit('/request-user');
    cy.get('input[type="text"]').eq(0).type(uniqueName('regression_user'));
    cy.get('input[type="email"]').type(`${uniqueName('regression')}@opticapp.test`);
    cy.get('input[type="text"]').eq(1).type(uniqueName('Optica Regression'));
    cy.get('input[type="password"]').eq(0).type('password1');
    cy.get('input[type="password"]').eq(1).type('password2-distinto');
    cy.contains('button', 'Enviar solicitud').click();
    cy.contains('Las contraseñas no coinciden').should('be.visible');
  });

  it('solicitar acceso exige contraseña de al menos 6 caracteres', () => {
    cy.visit('/request-user');
    cy.get('input[type="text"]').eq(0).type(uniqueName('regression_user'));
    cy.get('input[type="email"]').type(`${uniqueName('regression')}@opticapp.test`);
    cy.get('input[type="text"]').eq(1).type(uniqueName('Optica Regression'));
    cy.get('input[type="password"]').eq(0).type('abc');
    cy.get('input[type="password"]').eq(1).type('abc');
    cy.contains('button', 'Enviar solicitud').click();
    cy.contains('La contraseña debe tener al menos 6 caracteres').should('be.visible');
  });

  it('solicitar acceso con un username ya existente (la cuenta QA) es rechazado por la API', () => {
    cy.visit('/request-user');
    cy.get('input[type="text"]').eq(0).type(Cypress.env('qaUsername'));
    cy.get('input[type="email"]').type(`${uniqueName('otro-email')}@opticapp.test`);
    cy.get('input[type="text"]').eq(1).type(uniqueName('Optica Regression'));
    cy.get('input[type="password"]').eq(0).type('password123');
    cy.get('input[type="password"]').eq(1).type('password123');
    cy.contains('button', 'Enviar solicitud').click();
    cy.contains('El username ya está en uso').should('be.visible');
  });
});
