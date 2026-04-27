// @ts-check

class PlaygroundHomePage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
    this.url = 'https://www.testmuai.com/selenium-playground/';
  }

  async open() {
    await this.page.goto(this.url, { waitUntil: 'domcontentloaded' });
    // Let any hydration / re-render settle so links don't detach mid-click.
    await this.page.waitForLoadState('networkidle').catch(() => {});
  }

  /**
   * Click a playground card by its visible title.
   * Uses a role-based locator (different from CSS / getByText used elsewhere).
   * @param {string} title
   */
  async openDemo(title) {
    const link = this.page.getByRole('link', { name: title, exact: true }).first();
    // The Next.js page hydrates after first render; the link node can detach
    // mid-click. Retry on detach errors and as a final fallback navigate
    // straight to the demo's href.
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        await link.click({ timeout: 8000 });
        await this.page.waitForLoadState('domcontentloaded');
        return;
      } catch (err) {
        const msg = String(err && err.message);
        if (!/not attached|detached|Target closed/i.test(msg) || attempt === 2) {
          if (attempt === 2) {
            const href = await link.getAttribute('href').catch(() => null);
            if (href) {
              await this.page.goto(href, { waitUntil: 'domcontentloaded' });
              return;
            }
          }
          throw err;
        }
        // Wait briefly for hydration to settle, then retry.
        await this.page.waitForLoadState('networkidle').catch(() => {});
      }
    }
  }
}

module.exports = { PlaygroundHomePage };
