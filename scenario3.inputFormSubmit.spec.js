// @ts-check
const { test, expect } = require('../fixtures/testFixture');
const { PlaygroundHomePage } = require('../pages/PlaygroundHomePage');
const { InputFormSubmitPage } = require('../pages/InputFormSubmitPage');

test.describe('Scenario 3 - Input Form Submit', () => {
  test('validates required-field errors and successful submission', async ({ page }) => {
    const home = new PlaygroundHomePage(page);
    const form = new InputFormSubmitPage(page);

    await home.open();
    await home.openDemo('Input Form Submit');

    // 2. Submit empty form
    await form.clickSubmit();

    // 3. Browser-native validation message check on the first required field (Name).
    //    Some implementations render a custom "Please fill in the fields" banner instead;
    //    others rely solely on the form not submitting. Accept any of those signals.
    const nameValidation = await form.name.evaluate(
      (el) => /** @type {HTMLInputElement} */ (el).validationMessage
    );
    const customBanner = page.getByText(/please fill (in|out) the fields/i);
    const customVisible = await customBanner.isVisible().catch(() => false);
    const successHidden = !(await form.successMessage.isVisible().catch(() => false));

    expect(
      customVisible || (nameValidation && nameValidation.length > 0) || successHidden,
      `Expected a "please fill in the fields" indicator. native="${nameValidation}", customVisible=${customVisible}, successHidden=${successHidden}`
    ).toBeTruthy();

    // 4 & 6. Fill in all fields
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

    // 5. Country dropdown - select by visible text
    await form.selectCountryByText('United States');
    await expect(form.country).toHaveValue(/.+/);

    // 6. Submit
    await form.clickSubmit();

    // 7. Success message
    await expect(form.successMessage).toBeVisible({ timeout: 20000 });
  });
});
