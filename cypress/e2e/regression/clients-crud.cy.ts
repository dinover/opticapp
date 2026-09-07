import { uniqueName } from '../../support/testData';
import type { AuthPayload } from '../../support/commands';

describe('Regression · Clientes (CRUD y validaciones)', () => {
  let auth: AuthPayload;

  before(() => {
    cy.apiLogin(Cypress.env('qaUsername'), Cypress.env('qaPassword')).then((a) => (auth = a));
  });

  beforeEach(() => {
    cy.visitAsUser('/clients', auth);
  });

  it('el nombre es obligatorio para crear un cliente', () => {
    cy.contains('button', 'Nuevo cliente').click();
    cy.get('.modal-box').contains('button', 'Crear cliente').click();
    // El form no llega a mandarse: el input required de HTML bloquea el submit.
    cy.get('#client-name:invalid').should('exist');
  });

  it('crea, edita, busca y elimina un cliente de punta a punta', () => {
    const name = uniqueName('Cliente CRUD');
    const renamed = `${name} (editado)`;

    cy.contains('button', 'Nuevo cliente').click();
    cy.get('#client-name').type(name);
    cy.get('#client-document').type('99887766');
    cy.get('#client-phone').type('+598 99 000 111');
    cy.get('.modal-box').contains('button', 'Crear cliente').click();
    cy.contains('Cliente creado').should('be.visible');
    cy.contains(name).should('be.visible');

    // Búsqueda: filtra a solo este cliente.
    cy.get('input[aria-label="Buscar clientes"]').type(name);
    cy.contains(name).should('be.visible');
    cy.get('input[aria-label="Buscar clientes"]').clear();

    // Edición.
    cy.get(`button[aria-label="Editar ${name}"]`).click();
    cy.get('#client-name').should('have.value', name).clear().type(renamed);
    cy.get('.modal-box').contains('button', 'Guardar cambios').click();
    cy.contains(renamed).should('be.visible');

    // Eliminación con confirmación.
    cy.get(`button[aria-label="Eliminar ${renamed}"]`).click();
    cy.confirmDialog('Eliminar');
    cy.contains(renamed).should('not.exist');
  });

  after(() => {
    // Red de seguridad por si algún assert de UI falla a mitad del test y el
    // cliente de prueba queda sin borrar.
    cy.apiRequest('GET', `/clients?search=${encodeURIComponent('Cliente CRUD')}`, undefined, auth.token).then((resp) => {
      resp.body.data.forEach((c: any) => cy.apiRequest('DELETE', `/clients/${c.id}`, undefined, auth.token));
    });
  });
});
