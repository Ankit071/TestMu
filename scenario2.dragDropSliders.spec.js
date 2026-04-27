// @ts-check
const { test, expect } = require('../fixtures/testFixture');
const { PlaygroundHomePage } = require('../pages/PlaygroundHomePage');
const { DragDropSlidersPage } = require('../pages/DragDropSlidersPage');

test.describe('Scenario 2 - Drag & Drop Sliders', () => {
  test('moves "Default value 15" slider to 95', async ({ page }) => {
    const home = new PlaygroundHomePage(page);
    const sliders = new DragDropSlidersPage(page);

    await home.open();
    await home.openDemo('Drag & Drop Sliders');

    const { output } = await sliders.setSliderValue(15, 95);

    await expect(output).toHaveText('95');
  });
});
