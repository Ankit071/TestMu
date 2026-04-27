# TestMu AI - Playwright Automation Framework

A Playwright (JavaScript) framework that automates 3 scenarios on the
TestMu AI Selenium Playground (https://www.testmuai.com/selenium-playground/).

## Structure

```
Testmu/
├── playwright.config.js          # Global config (video, screenshots, traces, retries)
├── fixtures/
│   └── loggingFixture.js         # Custom fixture: console + network log capture
├── pages/                        # Page Object Model classes
│   ├── PlaygroundHomePage.js
│   ├── SimpleFormDemoPage.js
│   ├── DragDropSlidersPage.js
│   └── InputFormSubmitPage.js
└── tests/
    ├── scenario1.simpleFormDemo.spec.js
    ├── scenario2.dragDropSliders.spec.js
    └── scenario3.inputFormSubmit.spec.js
```

## Setup

```powershell
npm install
npx playwright install
```

## Run

```powershell
# All tests
npx playwright test

# A single scenario
npx playwright test tests/scenario1.simpleFormDemo.spec.js

# Headed (watch the browser)
npx playwright test --headed

# Open the HTML report
npx playwright show-report
```

## Capabilities Enabled (per `playwright.config.js`)

| Capability      | Setting        |
| --------------- | -------------- |
| Video recording | `video: 'on'`  |
| Screenshots     | `screenshot: 'on'` |
| Trace (Playwright Inspector)   | `trace: 'on'` |
| Console logs    | captured per-test via `loggingFixture` -> `logs/<test>/console.log` |
| Network logs    | captured per-test via `loggingFixture` -> `logs/<test>/network.log` |

All artifacts are attached to the HTML report automatically.

## Locator Strategies Used (>= 3)

The framework intentionally mixes locator strategies to satisfy the
"at least 3 different locators" requirement:

1. **CSS / id selectors** – e.g. `#user-message`, `input[name="name"]`
2. **Role-based** – `getByRole('button', { name: /submit/i })`
3. **Placeholder-based** – `getByPlaceholder(/email/i)`
4. **XPath** – `xpath=following-sibling::output[1]` (slider value node)
5. **Text-based** – `getByText('Thanks for contacting us...')`

## Scenarios

1. **Simple Form Demo** – type a message, click *Get Checked Value*, assert the
   echoed text in the right panel.
2. **Drag & Drop Sliders** – set the *Default value 15* slider to **95** and
   assert the live value output reads `95`.
3. **Input Form Submit** – submit empty form -> assert validation, fill all
   fields, choose *United States* by visible text from the country dropdown,
   submit -> assert success banner.
