import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  reporter: [
    ['list'],                         // nice terminal output
    ['json', { outputFile: 'playwright-report.json' }], // JSON for the AI analyzer
  ],
});
