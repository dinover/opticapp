import { uniqueName } from '../../support/testData';
import type { AuthPayload } from '../../support/commands';

describe('Regression · Proveedores (CRUD)', () => {
  let auth: AuthPayload;

  before(() => {
    cy.apiLogin(Cypress.env('qaUsername'), Cypress.env('qaPassword')).then((a) => (auth = a));
  });

  beforeEach(() => {
    cy.visitAsUser('/suppliers', auth);
  });

  it('el nombre es obligatorio para crear un proveedor', () => {
    cy.contains('button', 'Nuevo proveedor').click();
    cy.get('.modal-box').contains('button', 'Crear proveedor').click();
    cy.get('#supplier-name:invalid').should('exist');
  });

  it('crea, edita y elimina un proveedor de punta a punta', () => {
    const name = uniqueName('Proveedor CRUD');
    const renamed = `${name} (editado)`;

    cy.contains('button', 'Nuevo proveedor').click();
    cy.get('#supplier-name').type(name);
    cy.get('#supplier-contact').type('Contacto de prueba');
    cy.get('#supplier-phone').type('+598 99 222 333');
    cy.get('.modal-box').contains('button', 'Crear proveedor').click();
    cy.contains(name).should('be.visible');

    cy.get(`button[aria-label="Editar ${name}"]`).click();
    cy.get('#supplier-name').should('have.value', name).clear().type(renamed);
    cy.get('.modal-box').contains('button', 'Guardar cambios').click();
    cy.contains(renamed).should('be.visible');

    cy.get(`button[aria-label="Eliminar ${renamed}"]`).click();
    cy.confirmDialog('Eliminar');
    cy.contains(renamed).should('not.exist');
  });

  after(() => {
    cy.apiRequest('GET', '/suppliers', undefined, auth.token).then((resp) => {
      resp.body
        .filter((s: any) => s.name.startsWith('Proveedor CRUD'))
        .forEach((s: any) => cy.apiRequest('DELETE', `/suppliers/${s.id}`, undefined, auth.token));
    });
  });
});
