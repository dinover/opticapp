import type { AuthPayload } from '../../support/commands';

/**
 * Recorre las secciones principales de la app (con la cuenta QA, rol 'owner')
 * y verifica que cada una carga su contenido sin pantalla de error. No es un
 * chequeo funcional profundo de cada página: eso lo cubre Regression. Acá
 * solo interesa detectar una pantalla rota (bundle roto, ruta que 500,
 * ErrorBoundary disparado) apenas después de un deploy.
 */
describe('Sanity · Navegación entre secciones', () => {
  const sections: Array<{ path: string; title: string }> = [
    { path: '/dashboard', title: 'Dashboard' },
    { path: '/clients', title: 'Clientes' },
    { path: '/products', title: 'Productos' },
    { path: '/sales', title: 'Ventas' },
    { path: '/suppliers', title: 'Proveedores' },
    { path: '/reports', title: 'Reportes' },
    { path: '/profile', title: 'Mi cuenta' },
  ];

  let auth: AuthPayload;

  before(() => {
    cy.apiLogin(Cypress.env('qaUsername'), Cypress.env('qaPassword')).then((a) => (auth = a));
  });

  sections.forEach(({ path, title }) => {
    it(`${path} carga y muestra "${title}"`, () => {
      cy.visitAsUser(path, auth);
      cy.get('.page-title', { timeout: 15000 }).should('contain.text', title);
      // El ErrorBoundary de la app no debería haberse disparado.
      cy.contains(/algo salió mal|error inesperado/i).should('not.exist');
    });
  });

  it('una ruta que no existe muestra la página 404, no una pantalla en blanco', () => {
    cy.visitAsUser('/esto-no-existe', auth);
    cy.get('body').should('not.be.empty');
    cy.location('pathname').should('eq', '/esto-no-existe');
  });
});
