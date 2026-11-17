import { button, editor, expect, open, tapBack, test } from './helpers';

test('creates a collection with a book of pages and a loose note', async ({ page }) => {
  await open(page, '/');
  await expect(page.getByText('Nothing here yet')).toBeVisible();

  // Collection
  await button(page, 'Add').click();
  await button(page, /^Collection/).click();
  await page.getByLabel('Name').fill('Recipes');
  await page.getByRole('radio', { name: 'Orange' }).click();
  await button(page, 'Create').click();
  await expect(page.getByText('Empty collection')).toBeVisible();

  // Book inside it
  await button(page, 'Add').click();
  await button(page, /^Book/).click();
  await page.getByLabel('Name').fill('Vegan');
  await button(page, 'Create').click();
  await expect(page.getByText('Book in Recipes')).toBeVisible();

  // Two pages
  for (const [title, body] of [
    ['Lentil soup', 'Lentils, carrots, cumin'],
    ['Tofu scramble', 'Firm tofu, turmeric'],
  ]) {
    await button(page, 'New page').click();
    await page.getByRole('textbox', { name: 'Title' }).fill(title);
    const { editable } = await editor(page);
    await editable.click();
    await editable.pressSequentially(body);
    await page.waitForTimeout(1000);
    await tapBack(page);
    await expect(page.getByText(title).filter({ visible: true }).first()).toBeVisible();
  }
  await expect(page.getByText('2 pages', { exact: true }).filter({ visible: true })).toBeVisible();

  // Reorder: move the second page up
  await page.getByRole('button', { name: /^2\., Tofu scramble/ }).click({ delay: 800 });
  await button(page, 'Move page up').click();
  await expect(page.getByRole('button', { name: /^1\., Tofu scramble/ })).toBeVisible();

  // Back to the collection, then the library
  await tapBack(page);
  await expect(page.getByRole('button', { name: /Book Vegan, 2 pages/ })).toBeVisible();
  await tapBack(page);
  await expect(page.getByRole('button', { name: /Collection Recipes, 1 book · 0 notes/ })).toBeVisible();

  // A loose note at the top level
  await button(page, 'Add').click();
  await button(page, /^Note/).click();
  await page.getByRole('textbox', { name: 'Title' }).fill('Groceries');
  await page.waitForTimeout(1000);
  await tapBack(page);
  await expect(page.getByRole('button', { name: /^Groceries/ })).toBeVisible();

  // It survives a reload
  await open(page, '/');
  await expect(page.getByRole('button', { name: /^Groceries/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /Collection Recipes/ })).toBeVisible();

  await page.screenshot({ path: 'test-results/library.png' });
});

test('moves a note into a book and deletes with undo', async ({ page }) => {
  await open(page, '/');
  await button(page, 'Add').click();
  await button(page, /^Book/).click();
  await page.getByLabel('Name').fill('Journal');
  await button(page, 'Create').click();
  await tapBack(page);

  await button(page, 'Add').click();
  await button(page, /^Note/).click();
  await page.getByRole('textbox', { name: 'Title' }).fill('Stray thought');
  await page.waitForTimeout(1000);
  await tapBack(page);

  await page.getByRole('button', { name: /^Stray thought/ }).click({ delay: 800 });
  await button(page, /^Move to…/).click();
  await button(page, 'Journal').click();
  await expect(page.getByText('Moved to Journal.')).toBeVisible();
  await expect(page.getByRole('button', { name: /^Stray thought/ })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /Book Journal, 1 page/ })).toBeVisible();

  await page.getByRole('button', { name: /Book Journal/ }).click({ delay: 800 });
  await button(page, 'Delete').click();
  await page.getByRole('button', { name: 'Delete', exact: true }).last().click();
  await expect(page.getByRole('button', { name: /Book Journal/ })).toHaveCount(0);
  await button(page, 'Undo').click();
  await expect(page.getByRole('button', { name: /Book Journal, 1 page/ })).toBeVisible();
});

test('a new note left blank is not kept', async ({ page }) => {
  await open(page, '/');
  await button(page, 'Add').click();
  await button(page, /^Note/).click();
  await expect(page.getByRole('textbox', { name: 'Title' })).toBeVisible();
  await tapBack(page);
  await expect(page.getByText('Nothing here yet')).toBeVisible();
});
