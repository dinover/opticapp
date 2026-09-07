/// <reference types="cypress" />

export interface AuthPayload {
  token: string;
  user: {
    id: number;
    username: string;
    email: string;
    role: 'admin' | 'owner' | 'user';
    optics_id: number | null;
    license_type?: string;
    trial_expires_at?: string | null;
    license_expires_at?: string | null;
  };
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      /** Login contra la API (rápido, sin pasar por el form) y devuelve {token, user}. */
      apiLogin(username: string, password: string): Chainable<AuthPayload>;
      /** Visita `path` ya autenticado como `auth` (localStorage seteado antes de que cargue la SPA). */
      visitAsUser(path: string, auth: AuthPayload): Chainable<AUTWindow>;
      /** Atajo: login por API contra la cuenta QA (env CYPRESS_QA_USERNAME/PASSWORD) y visita `path`. */
      loginAsQA(path?: string): Chainable<AuthPayload>;
      /** Login real a través del formulario de /login (para probar el flujo tal cual lo usa una persona). */
      loginUI(username: string, password: string): Chainable<void>;
      /** Request autenticado a la API. Nunca falla el test por status code: usar la respuesta para assertear. */
      apiRequest<T = any>(
        method: Cypress.HttpMethod,
        path: string,
        body?: any,
        token?: string
      ): Chainable<Cypress.Response<T>>;
      /** Confirma (o cancela) el modal de confirmación (useConfirm/ConfirmProvider). */
      confirmDialog(buttonLabel?: string): Chainable<void>;
      cancelDialog(): Chainable<void>;
    }
  }
}

Cypress.Commands.add('apiLogin', (username: string, password: string) => {
  return cy
    .request({
      method: 'POST',
      url: '/api/auth/login',
      body: { username, password },
    })
    .then((resp) => resp.body as AuthPayload);
});

Cypress.Commands.add('visitAsUser', (path: string, auth: AuthPayload) => {
  return cy.visit(path, {
    onBeforeLoad(win) {
      win.localStorage.setItem('token', auth.token);
      win.localStorage.setItem('user', JSON.stringify(auth.user));
    },
  });
});

Cypress.Commands.add('loginAsQA', (path: string = '/dashboard') => {
  const username = Cypress.env('qaUsername');
  const password = Cypress.env('qaPassword');
  expect(username, 'CYPRESS_QA_USERNAME configurado').to.be.a('string').and.not.be.empty;
  expect(password, 'CYPRESS_QA_PASSWORD configurado').to.be.a('string').and.not.be.empty;

  return cy.apiLogin(username, password).then((auth) => {
    return cy.visitAsUser(path, auth).then(() => auth);
  });
});

Cypress.Commands.add('loginUI', (username: string, password: string) => {
  cy.visit('/login');
  cy.get('input[type="text"]').first().clear().type(username);
  cy.get('input[type="password"]').first().clear().type(password);
  cy.get('button[type="submit"]').click();
});

Cypress.Commands.add(
  'apiRequest',
  (method: Cypress.HttpMethod, path: string, body?: any, token?: string) => {
    return cy.request({
      method,
      url: `/api${path}`,
      body,
      failOnStatusCode: false,
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
  }
);

Cypress.Commands.add('confirmDialog', (buttonLabel: string = 'Eliminar') => {
  cy.get('.modal-box').should('be.visible').contains('button', buttonLabel).click();
});

Cypress.Commands.add('cancelDialog', () => {
  cy.get('.modal-box').should('be.visible').contains('button', 'Cancelar').click();
});

export {};
