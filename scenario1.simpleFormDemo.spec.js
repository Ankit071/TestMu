// @ts-check
const { test, expect } = require('../fixtures/testFixture');
const { PlaygroundHomePage } = require('../pages/PlaygroundHomePage');
const { SimpleFormDemoPage } = require('../pages/SimpleFormDemoPage');

test.describe('Scenario 1 - Simple Form Demo', () => {
  test('enters a message and validates the displayed value', async ({ page }) => {
    const home = new PlaygroundHomePage(page);
    const form = new SimpleFormDemoPage(page);

    await home.open();
    await home.openDemo('Simple Form Demo');

    // 3. URL contains "simple-form-demo"
    await expect(page).toHaveURL(/simple-form-demo/i);

    // 4 & 5. Variable used as input
    const message = 'Welcome to TestMu AI';
    await form.enterMessage(message);

    // 6. Submit
    await form.submit();

    // 7. Validate the message reflected in the right-hand panel
    await expect(form.displayedMessage).toHaveText(message);
  });
});
