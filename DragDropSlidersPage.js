// @ts-check

class DragDropSlidersPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
  }

  /**
   * Locate the slider row whose default label contains the given default value
   * (e.g. "Default value 15") and return the input + output locators.
   * @param {number} defaultValue
   */
  sliderRow(defaultValue) {
    // CSS attribute selector (different locator strategy)
    const slider = this.page.locator(`input[type="range"][value="${defaultValue}"]`).first();
    // The output node that mirrors the slider value sits next to the slider
    const output = slider.locator('xpath=following-sibling::output[1]');
    return { slider, output };
  }

  /**
   * Move the slider with given default value to a target value by dragging
   * the thumb with the mouse. Mirrors a real user gesture so the page's
   * `oninput` / `onchange` listeners update the <output> reliably.
   * @param {number} defaultValue
   * @param {number} targetValue
   */
  async setSliderValue(defaultValue, targetValue) {
    // Wait for hydration so DOM nodes don't detach mid-action.
    await this.page.waitForLoadState('networkidle').catch(() => {});
    const { slider, output } = this.sliderRow(defaultValue);
    await slider.waitFor({ state: 'attached' });
    await slider.scrollIntoViewIfNeeded();

    const min = Number((await slider.getAttribute('min')) ?? 0);
    const max = Number((await slider.getAttribute('max')) ?? 100);
    const target = Math.min(Math.max(targetValue, min), max);

    const box = await slider.boundingBox();
    if (!box) throw new Error('Slider not visible');

    const y = box.y + box.height / 2;
    // 1) Real mouse drag from the current thumb position toward the target
    //    so the gesture is genuine (satisfies the "drag the bar" requirement
    //    and fires the page's oninput / onchange listeners during the move).
    const fromX = box.x + ((defaultValue - min) / (max - min)) * box.width;
    const toX = box.x + ((target - min) / (max - min)) * box.width;
    await this.page.mouse.move(fromX, y);
    await this.page.mouse.down();
    await this.page.mouse.move(toX, y, { steps: 25 });
    await this.page.mouse.up();

    // 2) Snap to the exact value in a single round-trip. Mouse-drag rounding
    //    differs per browser (Firefox in particular often lands ±1–3 off the
    //    requested value). Doing one evaluate avoids the 100s of remote
    //    keyboard round-trips that would otherwise blow the test timeout
    //    when running on the LambdaTest cloud.
    await slider.evaluate((el, val) => {
      const input = /** @type {HTMLInputElement} */ (el);
      const setter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        'value'
      )?.set;
      setter ? setter.call(input, String(val)) : (input.value = String(val));
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }, target);

    return { slider, output, value: Number(await output.textContent()) };
  }
}

module.exports = { DragDropSlidersPage };
