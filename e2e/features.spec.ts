import type { Page } from '@playwright/test';

import { button, editor, expect, open, tapBack, test } from './helpers';

const tab = (page: Page, name: string) => page.getByRole('tab', { name }).or(page.getByRole('link', { name })).first();

async function newNote(page: Page, title: string, body?: string) {
  await button(page, 'Add').click();
  await button(page, /^Note/).click();
  await page.getByRole('textbox', { name: 'Title' }).fill(title);
  if (body) {
    const { editable } = await editor(page);
    await editable.click();
    await editable.pressSequentially(body);
  }
  await page.waitForTimeout(1000);
  await tapBack(page);
}

async function enterPin(page: Page, digits: string) {
  for (const d of digits) await button(page, d).last().click();
}

test('search finds titles and text', async ({ page }) => {
  await open(page, '/');
  await newNote(page, 'Garden plan', 'Plant tomatoes in May');
  await tab(page, 'Search').click();
  await page.getByRole('textbox', { name: 'Search' }).fill('tomatoes');
  await expect(page.getByRole('button', { name: /Garden plan, Plant tomatoes in May/ })).toBeVisible();
  await page.getByRole('textbox', { name: 'Search' }).fill('zebra');
  await expect(page.getByText('Nothing found for “zebra”')).toBeVisible();
});

test('locks a note with a PIN and keeps it out of search', async ({ page }) => {
  await open(page, '/');
  await tab(page, 'Settings').click();
  await button(page, /^Locks/).click();
  await button(page, 'Set up a PIN').click();
  await enterPin(page, '2580');
  await button(page, 'Continue').click();
  await expect(page.getByText('Confirm your PIN')).toBeVisible();
  await enterPin(page, '2580');
  await expect(page.getByText('What it locks')).toBeVisible();

  await tab(page, 'Library').click();
  await newNote(page, 'Secret diary', 'Nobody reads this');
  await page.getByRole('button', { name: /Secret diary/ }).click({ delay: 800 });
  await button(page, /^Lock/).click();
  await expect(page.getByRole('button', { name: /Secret diary, locked/ })).toBeVisible();

  // Search leaves it out.
  await tab(page, 'Search').click();
  await page.getByRole('textbox', { name: 'Search' }).fill('diary');
  await expect(page.getByText('Nothing found for “diary”')).toBeVisible();

  // Lock opened items again (the Settings tab is still on the Locks screen), then opening asks for the PIN.
  await tab(page, 'Settings').click();
  await button(page, /^Lock opened items now/).click();
  await tab(page, 'Library').click();
  await page.getByRole('button', { name: /Secret diary, locked/ }).click();
  await expect(page.getByText('“Secret diary” is locked')).toBeVisible();
  await enterPin(page, '1111');
  await expect(page.getByText(/Wrong PIN/)).toBeVisible();
  await enterPin(page, '2580');
  await expect(page.getByRole('textbox', { name: 'Title' })).toHaveValue('Secret diary');
});

test('reorders pages with the arrow buttons', async ({ page }) => {
  await open(page, '/');
  await button(page, 'Add').click();
  await button(page, /^Book/).click();
  await page.getByLabel('Name').fill('Story');
  await button(page, 'Create').click();
  for (const title of ['One', 'Two', 'Three']) {
    await button(page, 'New page').click();
    await page.getByRole('textbox', { name: 'Title' }).fill(title);
    await page.waitForTimeout(900);
    await tapBack(page);
    await expect(page.getByRole('button', { name: new RegExp(`\\. ${title}|, ${title}`) }).first()).toBeVisible();
  }
  await button(page, 'Reorder').click();
  await button(page, 'Move Three up').click();
  await button(page, 'Move Three up').click();
  await button(page, 'Move One down').click();
  await tapBack(page);
  await expect(page.getByRole('button', { name: /^1\., Three/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /^2\., Two/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /^3\., One/ })).toBeVisible();
});

test('appearance changes theme and accent', async ({ page }) => {
  await open(page, '/');
  await newNote(page, 'Hello');
  await tab(page, 'Settings').click();
  await button(page, /^Appearance/).click();
  await page.getByRole('radio', { name: 'Dark' }).click();
  await page.getByRole('radio', { name: 'Rose' }).click();
  await tapBack(page);
  await expect(page.getByRole('button', { name: /Appearance, Dark · Rose/ })).toBeVisible();
  await page.screenshot({ path: 'test-results/settings-dark.png' });
  await tab(page, 'Library').click();
  await page.screenshot({ path: 'test-results/library-dark.png' });
});

test('backup screen offers export and restore', async ({ page }) => {
  await open(page, '/');
  await tab(page, 'Settings').click();
  await button(page, /^Backup & restore/).click();
  await button(page, /^Back up now/).click();
  await expect(page.getByText('Protect with a passphrase')).toBeVisible();
  await page.getByLabel('Passphrase', { exact: true }).fill('short');
  await expect(page.getByText('At least 8 characters.')).toBeVisible();
  await expect(button(page, 'Save backup file')).toBeDisabled();
});
