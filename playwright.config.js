// @ts-check
const { defineConfig, devices } = require('@playwright/test');

/**
 * Playwright config for TestMu AI Selenium Playground automation.
 * Enables: video recording, screenshots, traces, and console/network logs.
 */
module.exports = defineConfig({
  testDir: './tests',
  timeout: 60 * 1000,
  expect: { timeout: 10 * 1000 },
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ],
  use: {
    baseURL: 'https://www.testmuai.com',
    headless: true,
    actionTimeout: 15 * 1000,
    navigationTimeout: 30 * 1000,
    // Capture artifacts on every run
    trace: 'on',
    screenshot: 'on',
    video: 'on',
    viewport: { width: 1440, height: 900 },
    ignoreHTTPSErrors: true,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  outputDir: 'test-results/',
});
