// @ts-check

class SimpleFormDemoPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
    // Locator strategy 1: textbox by its accessible name (placeholder)
    this.messageInput = page.getByRole('textbox', { name: /please enter your message/i });
    // Locator strategy 2: button by id (CSS)
    this.getCheckedValueBtn = page.locator('#showInput');
    // Locator strategy 3: id selector for the output paragraph
    this.displayedMessage = page.locator('p#message');
  }

  /** @param {string} text */
  async enterMessage(text) {
    // Wait for hydration so click handlers are bound.
    await this.page.waitForLoadState('networkidle').catch(() => {});
    await this.messageInput.fill(text);
  }

  async submit() {
    await this.getCheckedValueBtn.click();
  }
}

module.exports = { SimpleFormDemoPage };
