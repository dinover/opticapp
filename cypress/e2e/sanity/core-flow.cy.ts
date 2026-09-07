import { uniqueName } from '../../support/testData';
import type { AuthPayload } from '../../support/commands';

/**
 * El flujo de negocio principal de OpticApp: dar de alta un cliente, cargar
 * un producto al catálogo y registrar una venta que los une. Es el camino
 * que un usuario real recorre el primer día que usa la app, así que si esto
 * se rompe, la app no sirve — por eso vive en Sanity y no en Regression.
 *
 * Todo lo que crea este spec queda con nombres únicos (uniqueName) y se
 * borra en el after(), sea cual sea el resultado de los tests, para no
 * ensuciar la cuenta QA en cada corrida.
 */
describe('Sanity · Alta de cliente, producto y venta', () => {
  let auth: AuthPayload;
  const clientName = uniqueName('Cliente Sanity');
  const productName = uniqueName('Producto Sanity');
  let clientId: number;
  let productId: number;

  before(() => {
    cy.apiLogin(Cypress.env('qaUsername'), Cypress.env('qaPassword')).then((a) => (auth = a));
  });

  after(() => {
    // Se busca por nombre en vez de depender de los ids capturados durante
    // los tests: si un test falla a mitad de camino, igual queremos borrar
    // lo que sí llegó a crearse. Orden importa: la venta referencia cliente
    // y producto.
    cy.apiRequest('GET', `/sales?search=${encodeURIComponent(clientName)}`, undefined, auth.token).then((resp) => {
      resp.body.data
        .filter((s: any) => s.client_name === clientName)
        .forEach((s: any) => cy.apiRequest('DELETE', `/sales/${s.id}`, undefined, auth.token));
    });
    cy.apiRequest('GET', `/clients?search=${encodeURIComponent(clientName)}`, undefined, auth.token).then((resp) => {
      resp.body.data.forEach((c: any) => cy.apiRequest('DELETE', `/clients/${c.id}`, undefined, auth.token));
    });
    cy.apiRequest('GET', `/products?search=${encodeURIComponent(productName)}`, undefined, auth.token).then((resp) => {
      resp.body.data.forEach((p: any) => cy.apiRequest('DELETE', `/products/${p.id}`, undefined, auth.token));
    });
  });

  it('crea un cliente nuevo', () => {
    cy.visitAsUser('/clients', auth);
    cy.contains('button', 'Nuevo cliente').click();
    cy.get('#client-name').type(clientName);
    cy.get('#client-email').type('sanity.cliente@opticapp.test');
    cy.get('.modal-box').contains('button', 'Crear cliente').click();

    cy.contains(clientName).should('be.visible');
    cy.apiRequest('GET', `/clients?search=${encodeURIComponent(clientName)}`, undefined, auth.token).then((resp) => {
      const created = resp.body.data.find((c: any) => c.name === clientName);
      expect(created, 'cliente recién creado presente en la API').to.exist;
      clientId = created.id;
    });
  });

  it('crea un producto nuevo en el catálogo', () => {
    cy.visitAsUser('/products', auth);
    cy.contains('button', 'Nuevo producto').click();
    cy.get('#product-name').type(productName);
    cy.get('#product-price').type('1500');
    cy.get('#product-quantity').type('10');
    cy.get('.modal-box').contains('button', 'Crear producto').click();

    cy.contains(productName).should('be.visible');
    cy.apiRequest('GET', `/products?search=${encodeURIComponent(productName)}`, undefined, auth.token).then((resp) => {
      const created = resp.body.data.find((p: any) => p.name === productName);
      expect(created, 'producto recién creado presente en la API').to.exist;
      productId = created.id;
    });
  });

  it('registra una venta del producto para el cliente', () => {
    cy.visitAsUser('/sales', auth);
    cy.contains('button', 'Nueva venta').click();

    cy.get('.modal-box').within(() => {
      // Se selecciona por value (el id numérico): el texto de la opción de
      // producto incluye el stock ("Nombre (stock: N)"), no el nombre solo.
      cy.get('#sale-client').select(String(clientId));
      cy.get('#sale-product').select(String(productId));
      cy.get('#sale-unit-price').clear().type('1500');
      cy.contains('button', 'Agregar').click();
      cy.contains(productName).should('be.visible');
      cy.contains('button', 'Crear venta').click();
    });

    cy.contains('td, span, div', clientName).should('be.visible');

    cy.apiRequest('GET', `/sales?search=${encodeURIComponent(clientName)}`, undefined, auth.token).then((resp) => {
      const created = resp.body.data.find((s: any) => s.client_name === clientName);
      expect(created, 'venta recién creada presente en la API').to.exist;
    });
  });
});
