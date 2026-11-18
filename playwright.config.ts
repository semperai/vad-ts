import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for browser integration tests
 * Tests browser-specific APIs like AudioContext, AudioWorklet, getUserMedia
 */
export default defineConfig({
  testDir: './packages/web/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Grant microphone permissions for getUserMedia tests
        permissions: ['microphone'],
      },
    },
  ],

  // Run local dev server before starting tests
  webServer: {
    command: 'npm run serve-test-site',
    url: 'http://127.0.0.1:8080/e2e-test.html',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
