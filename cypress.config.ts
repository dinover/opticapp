import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: process.env.CYPRESS_BASE_URL || 'http://localhost:5173',
    supportFile: 'cypress/support/e2e.ts',
    specPattern: 'cypress/e2e/**/*.cy.ts',
    fixturesFolder: 'cypress/fixtures',
    screenshotsFolder: 'cypress/screenshots',
    videosFolder: 'cypress/videos',
    downloadsFolder: 'cypress/downloads',
    defaultCommandTimeout: 10000,
    requestTimeout: 15000,
    responseTimeout: 15000,
    video: false,
    screenshotOnRunFailure: true,
    retries: {
      runMode: 1,
      openMode: 0,
    },
    env: {
      // Credenciales de la cuenta 'owner' dedicada a QA. Nunca hardcodear
      // valores acá: se inyectan como CYPRESS_QA_USERNAME / CYPRESS_QA_PASSWORD
      // (Cypress mapea automáticamente env vars con prefijo CYPRESS_ a Cypress.env()).
      qaUsername: process.env.CYPRESS_QA_USERNAME,
      qaPassword: process.env.CYPRESS_QA_PASSWORD,
      // Credenciales del usuario admin del sistema, solo necesarias para la
      // Regression (aprobar/rechazar solicitudes, gestión de licencias).
      adminUsername: process.env.CYPRESS_ADMIN_USERNAME,
      adminPassword: process.env.CYPRESS_ADMIN_PASSWORD,
    },
  },
});
