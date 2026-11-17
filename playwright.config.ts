import { defineConfig, devices } from '@playwright/test';

/**
 * Browser tests against the web export. Web is not a shipping target; these exercise the screens
 * and data layer end to end. Build first: `npm run e2e:build`.
 * Set PW_CHANNEL=chrome to use an installed Chrome instead of Playwright's Chromium.
 */
export default defineConfig({
  testDir: 'e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://localhost:8092',
    ...devices['Pixel 7'],
    ...(process.env.PW_CHANNEL ? { channel: process.env.PW_CHANNEL } : {}),
    timezoneId: 'America/New_York',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'PORT=8092 node e2e/server.mjs dist-e2e',
    url: 'http://localhost:8092',
    reuseExistingServer: !process.env.CI,
  },
});
