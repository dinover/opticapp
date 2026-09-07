import { uniqueName } from '../../support/testData';
import type { AuthPayload } from '../../support/commands';

describe('Regression · Productos (CRUD y validaciones)', () => {
  let auth: AuthPayload;

  before(() => {
    cy.apiLogin(Cypress.env('qaUsername'), Cypress.env('qaPassword')).then((a) => (auth = a));
  });

  beforeEach(() => {
    cy.visitAsUser('/products', auth);
  });

  it('el nombre es obligatorio para crear un producto', () => {
    cy.contains('button', 'Nuevo producto').click();
    cy.get('.modal-box').contains('button', 'Crear producto').click();
    cy.get('#product-name:invalid').should('exist');
  });

  it('no permite precio ni stock negativos', () => {
    cy.contains('button', 'Nuevo producto').click();
    cy.get('#product-name').type(uniqueName('Producto Invalido'));
    cy.get('#product-price').type('-10');
    cy.get('#product-price:invalid').should('exist');
  });

  it('crea, edita, busca y elimina un producto de punta a punta', () => {
    const name = uniqueName('Producto CRUD');
    const renamed = `${name} (editado)`;

    cy.contains('button', 'Nuevo producto').click();
    cy.get('#product-name').type(name);
    cy.get('#product-price').type('2500');
    cy.get('#product-quantity').type('5');
    cy.get('.modal-box').contains('button', 'Crear producto').click();
    cy.contains('Producto creado').should('be.visible');
    cy.contains(name).should('be.visible');

    cy.get('input[aria-label="Buscar productos"]').type(name);
    cy.contains(name).should('be.visible');
    cy.get('input[aria-label="Buscar productos"]').clear();

    cy.get(`button[aria-label="Editar ${name}"]`).click();
    cy.get('#product-name').should('have.value', name).clear().type(renamed);
    cy.get('#product-price').clear().type('3000');
    cy.get('.modal-box').contains('button', 'Guardar cambios').click();
    cy.contains(renamed).should('be.visible');
    cy.contains('3.000,00').should('be.visible');

    cy.get(`button[aria-label="Eliminar ${renamed}"]`).click();
    cy.confirmDialog('Eliminar');
    cy.contains(renamed).should('not.exist');
  });

  after(() => {
    cy.apiRequest('GET', `/products?search=${encodeURIComponent('Producto CRUD')}`, undefined, auth.token).then((resp) => {
      resp.body.data.forEach((p: any) => cy.apiRequest('DELETE', `/products/${p.id}`, undefined, auth.token));
    });
    cy.apiRequest('GET', `/products?search=${encodeURIComponent('Producto Invalido')}`, undefined, auth.token).then((resp) => {
      resp.body.data.forEach((p: any) => cy.apiRequest('DELETE', `/products/${p.id}`, undefined, auth.token));
    });
  });
});
