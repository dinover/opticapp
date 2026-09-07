import { uniqueName } from '../../support/testData';
import type { AuthPayload } from '../../support/commands';

describe('Regression · Ventas (alta con ficha óptica, stock y eliminación)', () => {
  let auth: AuthPayload;
  let clientId: number;
  let productId: number;
  const clientName = uniqueName('Cliente Venta');
  const productName = uniqueName('Producto Venta');
  const initialStock = 20;

  before(() => {
    cy.apiLogin(Cypress.env('qaUsername'), Cypress.env('qaPassword')).then((a) => {
      auth = a;
      cy.apiRequest('POST', '/clients', { name: clientName }, auth.token).then((resp) => (clientId = resp.body.id));
      cy.apiRequest(
        'POST',
        '/products',
        { name: productName, price: 1000, quantity: initialStock },
        auth.token
      ).then((resp) => (productId = resp.body.id));
    });
  });

  after(() => {
    if (clientId) cy.apiRequest('DELETE', `/clients/${clientId}`, undefined, auth.token);
    if (productId) cy.apiRequest('DELETE', `/products/${productId}`, undefined, auth.token);
  });

  it('el cliente es un campo obligatorio del formulario', () => {
    cy.visitAsUser('/sales', auth);
    cy.contains('button', 'Nueva venta').click();
    cy.get('.modal-box').contains('button', 'Crear venta').click();
    cy.get('#sale-client:invalid').should('exist');
  });

  it('no deja crear la venta sin haber agregado ningún producto', () => {
    cy.visitAsUser('/sales', auth);
    cy.contains('button', 'Nueva venta').click();
    cy.get('#sale-client').select(String(clientId));
    cy.get('.modal-box').contains('button', 'Crear venta').click();
    cy.contains('Agregá al menos un producto').should('be.visible');
  });

  it('registra una venta con ficha óptica, descuenta stock, y al eliminarla lo devuelve', () => {
    cy.visitAsUser('/sales', auth);
    cy.contains('button', 'Nueva venta').click();

    cy.get('.modal-box').within(() => {
      cy.get('#sale-client').select(String(clientId));
      cy.get('[aria-label="Ojo derecho esf"]').type('-1.5');
      cy.get('[aria-label="Ojo izquierdo esf"]').type('-1.25');
      cy.get('#sale-product').select(String(productId));
      cy.get('#sale-qty').clear().type('3');
      cy.get('#sale-unit-price').clear().type('1000');
      cy.contains('button', 'Agregar').click();
      cy.contains(productName).should('be.visible');
      cy.contains('button', 'Crear venta').click();
    });

    cy.contains('Venta registrada').should('be.visible');
    cy.contains(clientName).should('be.visible');

    cy.apiRequest('GET', `/products/${productId}`, undefined, auth.token).then((resp) => {
      expect(Number(resp.body.quantity)).to.eq(initialStock - 3);
    });

    cy.get(`button[aria-label="Eliminar la venta de ${clientName}"]`).click();
    cy.confirmDialog('Eliminar');
    cy.contains(clientName).should('not.exist');

    cy.apiRequest('GET', `/products/${productId}`, undefined, auth.token).then((resp) => {
      expect(Number(resp.body.quantity)).to.eq(initialStock);
    });
  });
});
