import type { Page } from '@playwright/test';

import { button, expect, open, tapBack, test } from './helpers';

const tab = (page: Page, name: string) => page.getByRole('tab', { name }).or(page.getByRole('link', { name })).first();

async function newItem(page: Page, kind: 'Collection' | 'Book', name: string) {
  await button(page, 'Add').click();
  await button(page, new RegExp(`^${kind}`)).click();
  await page.getByLabel('Name').fill(name);
  await button(page, 'Create').click();
}

async function newNote(page: Page, title: string) {
  await button(page, 'Add').click();
  await button(page, /^Note/).click();
  await page.getByRole('textbox', { name: 'Title' }).fill(title);
  await page.waitForTimeout(900);
  await tapBack(page);
}

test('brings existing books and notes into a collection, and takes them out again', async ({ page }) => {
  await open(page, '/');
  await newNote(page, 'Loose idea');
  await newItem(page, 'Book', 'Sketchbook');
  await tapBack(page);
  await newItem(page, 'Collection', 'Art');

  await button(page, 'Add').click();
  await button(page, /^Something you already have/).click();
  await page.getByRole('button', { name: /^Sketchbook, Library/ }).click();
  await page.getByRole('button', { name: /^Loose idea, Library/ }).click();
  await button(page, 'Move 2 items here').click();
  await expect(page.getByText('Moved 2 items to Art.')).toBeVisible();
  await expect(page.getByRole('button', { name: /^Book Sketchbook/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /^Loose idea/ }).filter({ visible: true })).toBeVisible();

  // Take the note back out to the Library.
  await page.getByRole('button', { name: /^Loose idea/ }).filter({ visible: true }).click({ delay: 800 });
  await button(page, /^Remove from collection/).click();
  await expect(page.getByRole('button', { name: /^Loose idea/ }).filter({ visible: true })).toHaveCount(0);
  await tapBack(page);
  await expect(page.getByRole('button', { name: /^Collection Art, 1 book · 0 notes/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /^Loose idea/ }).first()).toBeVisible();
});

test('adds a loose note to a book as a page, then takes the page out', async ({ page }) => {
  await open(page, '/');
  await newNote(page, 'Wandering thought');
  await newItem(page, 'Collection', 'Journal');
  await newItem(page, 'Book', 'Diary');
  await button(page, 'Add existing notes as pages').click();
  await page.getByRole('button', { name: /^Wandering thought, Library/ }).click();
  await button(page, 'Move 1 item here').click();
  await expect(page.getByRole('button', { name: /^1\., Wandering thought/ })).toBeVisible();

  // From inside the page, through its options menu.
  await page.getByRole('button', { name: /^1\., Wandering thought/ }).click();
  await page.getByRole('button', { name: 'Note options' }).click();
  await button(page, /^Take out of book/).click();
  await expect(page.getByText('Taken out of the book.')).toBeVisible();
  await expect(page.getByText('Journal', { exact: true }).filter({ visible: true }).first()).toBeVisible();
  await tapBack(page);
  await expect(page.getByRole('button', { name: /^1\., Wandering thought/ })).toHaveCount(0);
  await tapBack(page);
  // It lands in the book's collection as a loose note.
  await expect(page.getByRole('button', { name: /^Wandering thought/ }).filter({ visible: true })).toBeVisible();
});

test('tags a collection and a book, and finds them by tag', async ({ page }) => {
  await open(page, '/');
  await newItem(page, 'Collection', 'Garden');
  await button(page, 'Add tag').click();
  await page.getByRole('textbox', { name: 'New tag' }).fill('outdoors');
  await button(page, 'Add').last().click();
  await page.mouse.click(200, 120);
  await expect(page.getByRole('textbox', { name: 'New tag' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Tag outdoors' })).toBeVisible();

  await newItem(page, 'Book', 'Planting log');
  await page.getByRole('button', { name: 'Book options' }).click();
  await button(page, 'Tags').click();
  await page.getByRole('button', { name: /^#outdoors/ }).click();
  await page.mouse.click(200, 120);
  await expect(page.getByRole('button', { name: 'Tag outdoors' }).filter({ visible: true })).toBeVisible();
  await tapBack(page);
  await tapBack(page);

  await tab(page, 'Search').click();
  await button(page, 'Filter by outdoors').click();
  await expect(page.getByRole('button', { name: 'Garden' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Planting log' })).toBeVisible();
});
