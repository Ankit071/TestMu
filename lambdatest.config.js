// @ts-check
/**
 * Playwright config for LambdaTest (TestMu AI) cloud execution.
 *
 * Each `project` represents one OS / browser combination. Playwright Test
 * runs the same spec files against every project in parallel.
 *
 * Required env vars:
 *   LT_USERNAME      – your LambdaTest username
 *   LT_ACCESS_KEY    – your LambdaTest access key
 *
 * Run with:
 *   npx playwright test --config=lambdatest.config.js --workers=3
 */
require('dotenv').config();
// Tell fixtures/testFixture.js to route through the LambdaTest cloud fixture
process.env.PW_TARGET = 'lambdatest';
const { defineConfig } = require('@playwright/test');
const cp = require('child_process');

const playwrightClientVersion = cp
  .execSync('npx playwright --version')
  .toString()
  .trim()
  .split(' ')[1];

const BUILD = process.env.LT_BUILD || `TestMu Playwright Build ${new Date().toISOString()}`;

/**
 * Builds the LambdaTest desired-capabilities object that becomes the
 * `wsEndpoint` query parameter at connect time.
 * @param {{browserName:string, browserVersion?:string, platform:string, name:string}} cfg
 */
function ltCapabilities(cfg) {
  return {
    browserName: cfg.browserName,
    browserVersion: cfg.browserVersion || 'latest',
    'LT:Options': {
      platform: cfg.platform,
      build: BUILD,
      name: cfg.name,
      user: process.env.LT_USERNAME,
      accessKey: process.env.LT_ACCESS_KEY,
      // Capabilities required by the assignment
      network: true,
      video: true,
      console: true,
      // Geo / locale
      geoLocation: 'IN',
      timezone: 'Kolkata',
      // SmartUI visual project
      smartUIProjectName: 'SmartTestMu',
      // Tunnel – set LT_TUNNEL=true and LT_TUNNEL_NAME to enable
      tunnel: process.env.LT_TUNNEL === 'true',
      tunnelName: process.env.LT_TUNNEL_NAME || 'Mu',
      playwrightClientVersion,
    },
  };
}

/**
 * 2 OS/browser combinations executed in parallel.
 * Add or change entries here to broaden the matrix.
 */
const matrix = [
  {
    name: 'Windows10-Chrome',
    capabilities: ltCapabilities({
      browserName: 'Chrome',
      browserVersion: '147.0',
      platform: 'Windows 10',
      name: 'TestMu Suite – Windows 10 / Chrome 147',
    }),
  },
  {
    name: 'macOSVentura-pw-firefox',
    capabilities: ltCapabilities({
      browserName: 'pw-firefox',
      browserVersion: 'latest',
      platform: 'MacOS Ventura',
      name: 'TestMu Suite – macOS Ventura / Firefox',
    }),
  },
];

module.exports = defineConfig({
  testDir: './tests',
  timeout: 120 * 1000,
  expect: { timeout: 15 * 1000 },
  // Run different projects (and their tests) in parallel
  fullyParallel: true,
  workers: matrix.length * 3,
  retries: 0,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report-lt', open: 'never' }],
  ],
  use: {
    baseURL: 'https://www.testmuai.com',
    actionTimeout: 30 * 1000,
    navigationTimeout: 60 * 1000,
    // Local artifacts (the cloud also captures its own video/network/console)
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
    ignoreHTTPSErrors: true,
  },
  projects: matrix.map((m) => ({
    name: m.name,
    metadata: { capabilities: m.capabilities },
  })),
});
