import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  globalSetup: './tests/globalSetup.ts',
  fullyParallel: !!process.env.CI,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  maxFailures: process.env.CI ? 10 : undefined,
  workers: process.env.CI ? 18 : undefined,
  snapshotPathTemplate: './tests/screenshots{/projectName}/{testFilePath}/{arg}{ext}',
  outputDir: './tests/test-results',
  reporter: [['html', { outputFolder: './tests/playwright-report' }]],
  globalTimeout: 800_000,
  timeout: 800_000,
  use: {
    baseURL: 'http://localhost:3335',
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    testIdAttribute: 'data-cy',
    actionTimeout: 10_000,
    launchOptions: {
      // do not hide the scrollbars so that we can assert their look-and-feel
      ignoreDefaultArgs: ['--hide-scrollbars'],
      args: ['--use-gl=egl'],
    },
  },

  projects: [
    {
      name: 'chromium',
      // Responsive specs run in their own dedicated projects below.
      testIgnore: /.*\.responsive\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], deviceScaleFactor: 1 },
    },
    // Responsive matrix (US-RSP-002). Specs under tests/responsive/ opt in
    // via the `@responsive` tag and run against mobile, tablet and desktop.
    {
      name: 'responsive-mobile',
      testMatch: /.*\.responsive\.spec\.ts/,
      use: {
        ...devices['Pixel 5'],
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 1,
        isMobile: true,
        hasTouch: true,
      },
    },
    {
      name: 'responsive-tablet',
      testMatch: /.*\.responsive\.spec\.ts/,
      use: {
        // Chromium (not the iPad WebKit default) — matches the suite-wide
        // browser policy; WebKit is blocked on SharedArrayBuffer support.
        ...devices['Desktop Chrome'],
        viewport: { width: 1024, height: 768 },
        deviceScaleFactor: 1,
        isMobile: false,
        hasTouch: true,
      },
    },
    {
      name: 'responsive-desktop',
      testMatch: /.*\.responsive\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 },
        deviceScaleFactor: 1,
      },
    },
    // TODO: Fix firefox tests
    // {
    //  name: 'firefox',
    //  use: { ...devices['Desktop Firefox'], deviceScaleFactor: 1 },
    // },
    // This is commented out until SharedArrayBuffer is enabled in WebKit
    // See: https://github.com/microsoft/playwright/issues/14043

    //{
    //  name: 'webkit',
    //  use: { ...devices['Desktop Safari'], deviceScaleFactor: 1 },
    //},
  ],
  webServer: {
    command:
      'cross-env APP_CONFIG=config/e2e.js COVERAGE=true OHIF_PORT=3335 OHIF_OPEN=false nyc pnpm --filter @ohif/app exec rspack serve --config .webpack/webpack.pwa.js',
    url: 'http://localhost:3335',
    reuseExistingServer: !process.env.CI,
    timeout: 360_000,
  },
});
