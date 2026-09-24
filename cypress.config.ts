import { defineConfig } from 'cypress';
import { registerBotTasks } from './cypress/support/botManager';

export default defineConfig({
  e2e: {
    baseUrl: process.env['CYPRESS_BASE_URL'] ?? 'http://localhost:4200',
    supportFile: 'cypress/support/e2e.ts',
    specPattern: 'cypress/e2e/**/*.cy.ts',
    defaultCommandTimeout: 8000,
    env: {
      apiUrl: process.env['CYPRESS_API_URL'] ?? 'http://localhost:3000',
    },
    setupNodeEvents(on, config) {
      registerBotTasks(on, config);
      return config;
    },
  },
});
