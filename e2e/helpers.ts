import { test as base, expect, type Frame, type Page } from '@playwright/test';

export { expect };

/**
 * Every test fails if the app showed an error message (see src/lib/errors), so a failure that
 * would only flash on screen for a few seconds is still caught.
 */
export const test = base.extend({
  page: async ({ page }, use) => {
    const shown: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() !== 'error') return;
      const text = msg.text();
      if (/^(Could not|Something went wrong|Live query failed)/.test(text)) shown.push(text);
    });
    await use(page);
    expect(shown, 'error messages shown to the user').toEqual([]);
  },
});

/**
 * Opens a route and waits for the database to open. On web the previous page's SQLite worker can
 * still hold the database file for a moment, so the first open may fail; press "Try again" like a person would.
 */
export async function open(page: Page, path: string) {
  await page.goto(path);
  await page.waitForLoadState('networkidle');
  for (let i = 0; i < 3; i++) {
    const failed = page.getByText("Your notes couldn't open");
    if (!(await failed.isVisible())) return;
    await page.waitForTimeout(500);
    await page.getByText('Try again', { exact: true }).click();
    await page.waitForLoadState('networkidle');
  }
}

/** The TenTap editor lives in an iframe. */
export async function editor(page: Page) {
  await expect.poll(() => page.frames().length, { timeout: 15_000 }).toBeGreaterThan(1);
  for (let i = 0; i < 30; i++) {
    for (const frame of page.frames().slice(1)) {
      const ed = frame.locator('[contenteditable=true]');
      if (await ed.count()) return { frame: frame as Frame, editable: ed.first() };
    }
    await page.waitForTimeout(300);
  }
  throw new Error('Editor did not load');
}

export const button = (page: Page, name: string | RegExp, exact = true) =>
  page.getByRole('button', typeof name === 'string' ? { name, exact } : { name });

/** The header back arrow, the same control a person taps (it saves before leaving). */
export async function tapBack(page: Page) {
  await page.getByRole('link', { name: /back$/ }).first().click();
}
