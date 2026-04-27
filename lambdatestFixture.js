// @ts-check
/**
 * LambdaTest fixture for Playwright Test.
 *
 * Connects to LambdaTest's cloud CDP endpoint using the capabilities defined
 * in the project metadata of `lambdatest.config.js`. The `page` fixture is
 * overridden so each spec receives a cloud-backed page transparently.
 *
 * Adds the same console/network log capture as the local fixture and pushes
 * pass/fail status back to the LambdaTest dashboard via `lambdatest_action`.
 */
const base = require('@playwright/test');
const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

// On Windows behind a corporate proxy / MITM, Node cannot validate the
// LambdaTest WSS certificate ("unable to get local issuer certificate").
// Allow opting in to a relaxed TLS check via env var (default: relaxed,
// since the request is to a known LambdaTest endpoint).
if (process.env.LT_TLS_INSECURE !== 'false') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

const exports_ = base.test.extend({
  // Override the default `page` fixture with a LambdaTest cloud page
  page: async ({}, use, testInfo) => {
    const capabilities = testInfo.project.metadata?.capabilities;
    if (!capabilities) {
      throw new Error(
        `No LambdaTest capabilities found in project metadata for "${testInfo.project.name}". ` +
        `Run via:  npx playwright test --config=lambdatest.config.js`
      );
    }

    // Per-test name so the dashboard shows a meaningful session label
    const caps = JSON.parse(JSON.stringify(capabilities));
    caps['LT:Options'].name = `${testInfo.project.name} :: ${testInfo.title}`;

    if (!caps['LT:Options'].user || !caps['LT:Options'].accessKey) {
      throw new Error(
        'LT_USERNAME / LT_ACCESS_KEY environment variables are not set. ' +
        'Create a .env file or export them before running.'
      );
    }

    const wsEndpoint =
      `wss://cdp.lambdatest.com/playwright?capabilities=` +
      encodeURIComponent(JSON.stringify(caps));

    // LambdaTest accepts all browser flavours through the chromium connect URL
    const browser = await chromium.connect({ wsEndpoint });
    const context = await browser.newContext({ ignoreHTTPSErrors: true });
    const page = await context.newPage();

    // ---- Console + network log capture (in addition to cloud-side capture)
    const safeName = `${testInfo.project.name}_${testInfo.title}`.replace(/[^a-z0-9_-]+/gi, '_');
    const logDir = path.join(__dirname, '..', 'logs', safeName);
    fs.mkdirSync(logDir, { recursive: true });
    const consoleStream = fs.createWriteStream(path.join(logDir, 'console.log'), { flags: 'a' });
    const networkStream = fs.createWriteStream(path.join(logDir, 'network.log'), { flags: 'a' });
    let streamsClosed = false;
    const safeWrite = (stream, line) => {
      if (streamsClosed || !stream.writable) return;
      try { stream.write(line); } catch { /* stream already closed */ }
    };
    page.on('console', (msg) => safeWrite(consoleStream, `[${msg.type()}] ${msg.text()}\n`));
    page.on('pageerror', (err) => safeWrite(consoleStream, `[pageerror] ${err.message}\n`));
    page.on('request', (req) => safeWrite(networkStream, `>> ${req.method()} ${req.url()}\n`));
    page.on('response', (res) => safeWrite(networkStream, `<< ${res.status()} ${res.url()}\n`));

    let testFailed = false;
    let failureMessage = '';
    try {
      await use(page);
    } catch (err) {
      testFailed = true;
      failureMessage = (err && err.stack) || String(err);
      throw err;
    } finally {
      // Use the post-test status from Playwright (handles assertion failures
      // that happen after `use()` returned via `expect.soft`, etc.)
      const status = testFailed || testInfo.status === 'failed' || testInfo.status === 'timedOut'
        ? 'failed'
        : 'passed';
      const remark = failureMessage || (testInfo.error && testInfo.error.message) || 'ok';

      try {
        await page.evaluate(
          (_) => {},
          `lambdatest_action: ${JSON.stringify({
            action: 'setTestStatus',
            arguments: { status, remark },
          })}`
        );
      } catch {
        // Ignore – the page may already be closed
      }

      consoleStream.end();
      networkStream.end();
      streamsClosed = true;
      await page.close().catch(() => {});
      await context.close().catch(() => {});
      await browser.close().catch(() => {});

      // Attach logs to the report
      const consoleFile = path.join(logDir, 'console.log');
      const networkFile = path.join(logDir, 'network.log');
      if (fs.existsSync(consoleFile)) {
        await testInfo.attach('console.log', { path: consoleFile, contentType: 'text/plain' });
      }
      if (fs.existsSync(networkFile)) {
        await testInfo.attach('network.log', { path: networkFile, contentType: 'text/plain' });
      }
    }
  },
});

module.exports = { test: exports_, expect: base.expect };
