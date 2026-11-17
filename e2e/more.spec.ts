import type { Page } from '@playwright/test';

import { button, editor, expect, open, tapBack, test } from './helpers';

const tab = (page: Page, name: string) => page.getByRole('tab', { name }).or(page.getByRole('link', { name })).first();

test('example library, continue writing and tag search', async ({ page }) => {
  await open(page, '/');
  await button(page, 'Add an example library').click();
  await expect(page.getByRole('button', { name: /^Collection Recipes/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /^Ideas/ })).toBeVisible();

  await page.getByRole('button', { name: /^Collection Recipes/ }).click();
  await page.getByRole('button', { name: /^Book Weeknight dinners/ }).click();
  await page.getByRole('button', { name: /Lentil soup/ }).click();
  await expect(page.getByRole('button', { name: 'Tag recipe' })).toBeVisible();
  await tapBack(page);
  await tapBack(page);
  await tapBack(page);
  await expect(page.getByRole('button', { name: 'Continue Lentil soup' })).toBeVisible();

  await tab(page, 'Search').click();
  await button(page, 'Filter by travel').click();
  await expect(page.getByRole('button', { name: /^Plan,/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /^Day 1,/ })).toBeVisible();
  await page.getByRole('textbox', { name: 'Search' }).fill('lobster');
  await expect(page.getByRole('button', { name: /^Day 1,/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /^Plan,/ })).toHaveCount(0);
});

test('starts a note from a template, tags it, adds a code block and divider', async ({ page }) => {
  await open(page, '/');
  await button(page, 'Add').click();
  await button(page, /^Note/).click();
  await button(page, 'Template Recipe').click();
  const { frame, editable } = await editor(page);
  await expect(frame.locator('.ProseMirror h2').first()).toHaveText('Ingredients');
  await page.getByRole('textbox', { name: 'Title' }).fill('Pancakes');

  await button(page, 'Add tag').click();
  await page.getByRole('textbox', { name: 'New tag' }).fill('breakfast');
  await button(page, 'Add').last().click();
  await page.mouse.click(200, 120);
  await expect(page.getByRole('button', { name: 'Tag breakfast' })).toBeVisible();

  await editable.click();
  await editable.press('Control+End');
  await editable.press('Enter');
  await button(page, 'Text styles').click();
  await button(page, 'Code block').click();
  await editable.pressSequentially('flour = 2 cups');
  await expect(frame.locator('.ProseMirror pre code')).toHaveText('flour = 2 cups');
  await button(page, 'Divider').click();
  await expect(frame.locator('.ProseMirror hr')).toHaveCount(1);
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'test-results/template-note.png' });
  await tapBack(page);

  // Duplicate and info from the options menu.
  await page.getByRole('button', { name: /^Pancakes/ }).click({ delay: 800 });
  await button(page, 'Duplicate').click();
  await expect(page.getByRole('button', { name: /^Pancakes copy/ })).toBeVisible();
  await page.getByRole('button', { name: /^Pancakes,/ }).click({ delay: 800 });
  await button(page, 'Info').click();
  await expect(page.getByRole('button', { name: /^Words/ }).or(page.getByText('Words'))).toBeVisible();
  await page.mouse.click(200, 120);

  // Save as template, then it is offered on a new note.
  await page.getByRole('button', { name: /^Pancakes,/ }).click({ delay: 800 });
  await button(page, 'Save as template').click();
  await page.getByRole('textbox', { name: 'Template name' }).fill('My pancakes');
  await button(page, 'Save template').click();
  await button(page, 'Add').click();
  await button(page, /^Note/).click();
  await expect(button(page, 'Template My pancakes')).toBeVisible();
});

test('manages tags and templates in Settings', async ({ page }) => {
  await open(page, '/');
  await button(page, 'Add an example library').click();
  await tab(page, 'Settings').click();
  await button(page, /^Tags/).click();
  await page.getByRole('button', { name: /^#todo/ }).click();
  await page.getByLabel('Name').fill('recipe');
  await button(page, 'Save').click();
  await expect(page.getByRole('button', { name: /^#todo/ })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /^#recipe, 6 items/ })).toBeVisible();
  await tapBack(page);
  await button(page, /^Templates/).click();
  await expect(page.getByText('Meeting notes')).toBeVisible();
});
