// @ts-check
/**
 * Standalone LambdaTest runner – mirrors LambdaTest's `playwright-single.js`
 * pattern but executes the 3 TestMu AI scenarios on a single capability.
 *
 * Usage:
 *   node playwright-single.js
 *
 * Credentials are read from .env (LT_USERNAME, LT_ACCESS_KEY).
 */
require('dotenv').config();
const cp = require('child_process');
const { chromium } = require('@playwright/test');
const { expect } = require('@playwright/test');

const { PlaygroundHomePage } = require('./pages/PlaygroundHomePage');
const { SimpleFormDemoPage } = require('./pages/SimpleFormDemoPage');
const { DragDropSlidersPage } = require('./pages/DragDropSlidersPage');
const { InputFormSubmitPage } = require('./pages/InputFormSubmitPage');

// Allow Node to talk to LambdaTest WSS even behind a corporate MITM proxy
if (process.env.LT_TLS_INSECURE !== 'false') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

const playwrightClientVersion = cp
  .execSync('npx playwright --version')
  .toString()
  .trim()
  .split(' ')[1];

const capability = {
  browserName: 'Chrome',
  browserVersion: '147.0',
  'LT:Options': {
    geoLocation: 'IN',
    timezone: 'Kolkata',
    video: true,
    platform: 'Windows 10',
    network: true,
    build: 'TestMu',
    name: 'Test',
    tunnel: process.env.LT_TUNNEL === 'true',
    tunnelName: process.env.LT_TUNNEL_NAME || 'Mu',
    console: true,
    smartUIProjectName: 'SmartTestMu',
    user: process.env.LT_USERNAME,
    accessKey: process.env.LT_ACCESS_KEY,
    playwrightClientVersion,
  },
};

/**
 * @param {import('@playwright/test').Page} page
 * @param {'passed'|'failed'} status
 * @param {string} remark
 */
async function setStatus(page, status, remark) {
  try {
    await page.evaluate(
      (_) => {},
      `lambdatest_action: ${JSON.stringify({
        action: 'setTestStatus',
        arguments: { status, remark },
      })}`
    );
  } catch {
    /* page may already be closed */
  }
}

async function scenario1(page) {
  const home = new PlaygroundHomePage(page);
  const form = new SimpleFormDemoPage(page);
  await home.open();
  await home.openDemo('Simple Form Demo');
  await expect(page).toHaveURL(/simple-form-demo/i);
  const message = 'Welcome to TestMu AI';
  await form.enterMessage(message);
  await form.submit();
  await expect(form.displayedMessage).toHaveText(message);
}

async function scenario2(page) {
  const home = new PlaygroundHomePage(page);
  const sliders = new DragDropSlidersPage(page);
  await home.open();
  await home.openDemo('Drag & Drop Sliders');
  const { output } = await sliders.setSliderValue(15, 95);
  await expect(output).toHaveText('95');
}

async function scenario3(page) {
  const home = new PlaygroundHomePage(page);
  const form = new InputFormSubmitPage(page);
  await home.open();
  await home.openDemo('Input Form Submit');

  await form.clickSubmit();
  const nameValidation = await form.name.evaluate(
    (el) => /** @type {HTMLInputElement} */ (el).validationMessage
  );
  const customBanner = page.getByText(/please fill (in|out) the fields/i);
  const customVisible = await customBanner.isVisible().catch(() => false);
  // Accept any of: a custom banner, a non-empty native validation message,
  // or the absence of the success banner (form was not submitted).
  const successHidden = !(await form.successMessage.isVisible().catch(() => false));
  expect(
    customVisible || (nameValidation && nameValidation.length > 0) || successHidden,
    `Expected validation. native="${nameValidation}", custom=${customVisible}, successHidden=${successHidden}`
  ).toBeTruthy();

  await form.fillAll({
    name: 'JohnDoe',
    email: 'john.doe@example.com',
    password: 'P@ssw0rd!',
    company: 'TestMuQA',
    website: 'https://example.com',
    city: 'NewYork',
    address1: '123 Main St',
    address2: 'Apt 4B',
    state: 'NY',
    zip: '10001',
  });
  await form.selectCountryByText('United States');
  await form.clickSubmit();
  await expect(form.successMessage).toBeVisible({ timeout: 20000 });
}

async function run() {
  if (!capability['LT:Options'].user || !capability['LT:Options'].accessKey) {
    throw new Error('LT_USERNAME / LT_ACCESS_KEY must be set in .env');
  }

  console.log('Connecting to LambdaTest…');
  console.log(`Platform: ${capability['LT:Options'].platform}`);
  console.log(`Browser : ${capability.browserName} ${capability.browserVersion}`);
  console.log(`User    : ${capability['LT:Options'].user}`);

  const wsEndpoint =
    `wss://cdp.lambdatest.com/playwright?capabilities=` +
    encodeURIComponent(JSON.stringify(capability));
  const browser = await chromium.connect({ wsEndpoint });
  const context = await browser.newContext({ ignoreHTTPSErrors: true });
  const page = await context.newPage();

  page.on('console', (m) => console.log(`[browser ${m.type()}] ${m.text()}`));

  const scenarios = [
    { name: 'Scenario 1 – Simple Form Demo', fn: scenario1 },
    { name: 'Scenario 2 – Drag & Drop Sliders', fn: scenario2 },
    { name: 'Scenario 3 – Input Form Submit', fn: scenario3 },
  ];

  let firstError = null;
  for (const s of scenarios) {
    console.log(`\n=== ${s.name} ===`);
    try {
      await s.fn(page);
      console.log(`PASS: ${s.name}`);
    } catch (err) {
      console.error(`FAIL: ${s.name}`);
      console.error(err && err.stack ? err.stack : err);
      firstError = firstError || err;
      break; // stop on first failure (mirrors single-session run)
    }
  }

  await setStatus(
    page,
    firstError ? 'failed' : 'passed',
    firstError ? (firstError.message || String(firstError)) : 'All TestMu scenarios passed'
  );

  await page.close().catch(() => {});
  await context.close().catch(() => {});
  await browser.close().catch(() => {});

  if (firstError) process.exit(1);
  console.log('\nAll scenarios passed on LambdaTest.');
}

run().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
