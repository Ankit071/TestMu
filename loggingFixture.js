// @ts-check
const base = require('@playwright/test');
const fs = require('fs');
const path = require('path');

/**
 * Custom fixture that attaches console + network log capturing on every page.
 * Logs are written under ./logs/<testName>/{console,network}.log
 */
exports.test = base.test.extend({
  page: async ({ page }, use, testInfo) => {
    const safeName = testInfo.title.replace(/[^a-z0-9_-]+/gi, '_');
    const logDir = path.join(testInfo.project.outputDir, '..', 'logs', safeName);
    fs.mkdirSync(logDir, { recursive: true });

    const consoleFile = path.join(logDir, 'console.log');
    const networkFile = path.join(logDir, 'network.log');
    const consoleStream = fs.createWriteStream(consoleFile, { flags: 'a' });
    const networkStream = fs.createWriteStream(networkFile, { flags: 'a' });

    page.on('console', (msg) => {
      consoleStream.write(`[${msg.type()}] ${msg.text()}\n`);
    });
    page.on('pageerror', (err) => {
      consoleStream.write(`[pageerror] ${err.message}\n`);
    });
    page.on('request', (req) => {
      networkStream.write(`>> ${req.method()} ${req.url()}\n`);
    });
    page.on('response', (res) => {
      networkStream.write(`<< ${res.status()} ${res.url()}\n`);
    });

    await use(page);

    consoleStream.end();
    networkStream.end();

    // Attach logs to the report
    if (fs.existsSync(consoleFile)) {
      await testInfo.attach('console.log', { path: consoleFile, contentType: 'text/plain' });
    }
    if (fs.existsSync(networkFile)) {
      await testInfo.attach('network.log', { path: networkFile, contentType: 'text/plain' });
    }
  },
});

exports.expect = base.expect;
