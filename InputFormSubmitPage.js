// @ts-check

class InputFormSubmitPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
    // Scope all field locators to the main <main> region so the page's
    // header/footer "Contact Sales" forms (also containing email/name fields)
    // do not collide with our locators.
    const form = page.locator('main');
    this.form = form;
    // Mix of locator strategies, all scoped inside the form region:
    // 1) Role + accessible name
    this.name = form.getByRole('textbox', { name: 'Name', exact: true });
    this.email = form.getByRole('textbox', { name: 'Email*', exact: true });
    this.password = form.getByRole('textbox', { name: 'Password*', exact: true });
    this.company = form.getByRole('textbox', { name: 'Company', exact: true });
    this.website = form.getByRole('textbox', { name: 'Website', exact: true });
    // 2) Native <select> via CSS attribute selector
    this.country = form.locator('select[name="country"]');
    this.city = form.getByRole('textbox', { name: 'City', exact: true });
    this.address1 = form.getByRole('textbox', { name: 'Address 1', exact: true });
    this.address2 = form.getByRole('textbox', { name: 'Address 2', exact: true });
    // State input has a quirky accessible name; use placeholder instead.
    this.state = form.getByPlaceholder('State');
    this.zip = form.getByPlaceholder('Zip code');
    // 3) Role-based for the submit button
    this.submitBtn = form.getByRole('button', { name: /^submit$/i });
    // 4) Text-based for the success banner (search whole page – success
    //    text may render outside the original form node)
    this.successMessage = page.getByText(
      'Thanks for contacting us, we will get back to you shortly.',
      { exact: false }
    );
  }

  async clickSubmit() {
    await this.submitBtn.scrollIntoViewIfNeeded();
    await this.submitBtn.click();
  }

  /**
   * Fill all required fields of the form.
   * @param {{
   *   name:string,email:string,password:string,company:string,website:string,
   *   city:string,address1:string,address2:string,state:string,zip:string
   * }} data
   */
  async fillAll(data) {
    await this.name.fill(data.name);
    await this.email.fill(data.email);
    await this.password.fill(data.password);
    await this.company.fill(data.company);
    await this.website.fill(data.website);
    await this.city.fill(data.city);
    await this.address1.fill(data.address1);
    await this.address2.fill(data.address2);
    await this.state.fill(data.state);
    await this.zip.fill(data.zip);
  }

  /**
   * Select a country option by its visible text label.
   * @param {string} text
   */
  async selectCountryByText(text) {
    await this.country.selectOption({ label: text });
  }
}

module.exports = { InputFormSubmitPage };
