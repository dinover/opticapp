import { uniqueName } from '../../support/testData';
import type { AuthPayload } from '../../support/commands';

/**
 * Flujo completo de alta de una óptica nueva: registro → login inmediato en
 * trial → el admin la aprueba (licencia activa 30 días) o la rechaza (cuenta
 * desactivada). Corre solo en Regression (a mano) porque cada corrida deja
 * una fila en `optics` y una en `users` en la base (soft-delete al final,
 * pero no se borran físicamente — ver cypress/README.md).
 *
 * Estos tests usan la cuenta ADMIN real del sistema. Para no arriesgar tocar
 * una solicitud de un cliente real, cada acción de admin apunta al botón con
 * el aria-label que incluye el username único que generó el propio test —
 * nunca "la primera pendiente" de la lista.
 */
describe('Regression · Alta de óptica y aprobación/rechazo del admin', () => {
  let adminAuth: AuthPayload;

  before(() => {
    cy.apiLogin(Cypress.env('adminUsername'), Cypress.env('adminPassword')).then((a) => (adminAuth = a));
  });

  function submitRequest(username: string, email: string, opticsName: string) {
    cy.visit('/request-user');
    cy.get('input[type="text"]').eq(0).type(username);
    cy.get('input[type="email"]').type(email);
    cy.get('input[type="text"]').eq(1).type(opticsName);
    cy.get('input[type="password"]').eq(0).type('password123');
    cy.get('input[type="password"]').eq(1).type('password123');
    cy.contains('button', 'Crear cuenta').click();
    cy.contains('¡Cuenta creada!').should('be.visible');
  }

  /** Se llama justo después de crear la solicitud, antes de aprobar/rechazar,
   * para tener el id de usuario y de óptica a mano para la limpieza final
   * (después de rechazar, el usuario deja de listarse como activo). */
  function captureCreatedRecord(username: string) {
    return cy
      .apiRequest('GET', '/auth/admin/users', undefined, adminAuth.token)
      .then((resp) => resp.body.find((u: any) => u.username === username));
  }

  function cleanup(userId: number, opticsId: number | null) {
    if (opticsId) cy.apiRequest('DELETE', `/optics/${opticsId}`, undefined, adminAuth.token);
    cy.apiRequest('DELETE', `/auth/admin/users/${userId}`, undefined, adminAuth.token);
  }

  it('el registro crea la cuenta en trial y permite ingresar de inmediato', () => {
    const username = uniqueName('reg_owner');
    const email = `${username}@opticapp.test`;
    submitRequest(username, email, uniqueName('Optica Regression'));

    cy.loginUI(username, 'password123');
    cy.location('pathname').should('eq', '/dashboard');
    cy.contains(/modo de prueba/i).should('be.visible');

    captureCreatedRecord(username).then((user) => cleanup(user.id, user.optics_id));
  });

  it('el admin aprueba la solicitud y la cuenta pasa a licencia activa', () => {
    const username = uniqueName('reg_approve');
    const email = `${username}@opticapp.test`;
    submitRequest(username, email, uniqueName('Optica Aprobar'));

    let record: any;
    captureCreatedRecord(username).then((user) => (record = user));

    cy.visitAsUser('/admin', adminAuth);
    cy.get(`button[aria-label="Aprobar solicitud de ${username} y darle un mes de licencia"]`).click();
    // Al procesarse pasa de "Pendientes" a "Historial" (sigue mostrando el
    // username ahí), así que se verifica por el botón de acción, no por el
    // texto del username en toda la página.
    cy.get(`button[aria-label="Aprobar solicitud de ${username} y darle un mes de licencia"]`).should('not.exist');

    cy.apiRequest('GET', '/auth/admin/users', undefined, adminAuth.token).then((resp) => {
      const user = resp.body.find((u: any) => u.username === username);
      expect(user, 'usuario aprobado presente').to.exist;
      expect(user.license_type).to.eq('active');
    });

    cy.then(() => cleanup(record.id, record.optics_id));
  });

  it('el admin rechaza la solicitud y la cuenta queda deshabilitada', () => {
    const username = uniqueName('reg_reject');
    const email = `${username}@opticapp.test`;
    submitRequest(username, email, uniqueName('Optica Rechazar'));

    let record: any;
    captureCreatedRecord(username).then((user) => (record = user));

    cy.visitAsUser('/admin', adminAuth);
    cy.get(`button[aria-label="Rechazar solicitud de ${username}"]`).click();
    cy.confirmDialog('Rechazar');
    // Al procesarse pasa de "Pendientes" a "Historial" (sigue mostrando el
    // username ahí), así que se verifica por el botón de acción, no por el
    // texto del username en toda la página.
    cy.get(`button[aria-label="Rechazar solicitud de ${username}"]`).should('not.exist');

    // La cuenta rechazada no puede volver a entrar. Hay que limpiar el
    // localStorage antes: todavía tiene el token del admin (de visitAsUser),
    // y con una sesión válida /login redirige derecho a /admin.
    cy.clearLocalStorage();
    cy.loginUI(username, 'password123');
    cy.contains(/credenciales inválidas/i).should('be.visible');

    cy.then(() => cleanup(record.id, record.optics_id));
  });
});
