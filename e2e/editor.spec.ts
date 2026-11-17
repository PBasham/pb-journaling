import { button, editor, expect, open, tapBack, test } from './helpers';

test('formats text with headings, lists and checklists', async ({ page }) => {
  await open(page, '/');
  await button(page, 'Add').click();
  await button(page, /^Note/).click();
  await page.getByRole('textbox', { name: 'Title' }).fill('Weekend');

  const { frame, editable } = await editor(page);
  await editable.click();
  await button(page, 'Text styles').click();
  await button(page, 'Heading').click();
  await editable.pressSequentially('Errands');
  await editable.press('Enter');
  await button(page, 'Bulleted list').click();
  await editable.pressSequentially('Groceries');
  await editable.press('Enter');
  await editable.pressSequentially('Pharmacy');
  await editable.press('Enter');
  await editable.press('Enter');
  await button(page, 'Numbered list').click();
  await editable.pressSequentially('First');
  await editable.press('Enter');
  await editable.press('Enter');
  await button(page, 'Checklist').click();
  await editable.pressSequentially('Call mom');

  await expect(frame.locator('.ProseMirror h2')).toHaveText('Errands');
  await expect(frame.locator('.ProseMirror ul:not([data-type]) > li')).toHaveCount(2);
  await expect(frame.locator('.ProseMirror ol > li')).toHaveText(['First']);
  await expect(frame.locator('.ProseMirror ul[data-type="taskList"] li')).toHaveCount(1);

  // Markdown style shortcuts work too.
  await editable.press('Enter');
  await editable.press('Enter');
  await editable.pressSequentially('# Big title');
  await expect(frame.locator('.ProseMirror h1')).toHaveText('Big title');

  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'test-results/editor.png' });
  await tapBack(page);
  // The list preview reads the text out of the formatted document.
  await expect(page.getByRole('button', { name: /Weekend, Errands Groceries Pharmacy First Call mom/ })).toBeVisible();
});

test('pins a note to the top and restores a deleted one', async ({ page }) => {
  await open(page, '/');
  for (const title of ['Alpha', 'Beta']) {
    await button(page, 'Add').click();
    await button(page, /^Note/).click();
    await page.getByRole('textbox', { name: 'Title' }).fill(title);
    await page.waitForTimeout(900);
    await tapBack(page);
  }
  const titles = () => page.getByRole('button', { name: /^(Alpha|Beta)/ }).allInnerTexts();
  await expect.poll(async () => (await titles())[0]).toContain('Beta');

  await page.getByRole('button', { name: /^Alpha/ }).click({ delay: 800 });
  await button(page, 'Pin to top').click();
  await expect.poll(async () => (await titles())[0]).toContain('Alpha');

  await page.getByRole('button', { name: /^Beta/ }).click({ delay: 800 });
  await button(page, 'Delete').click();
  await page.getByRole('button', { name: 'Delete', exact: true }).last().click();
  await expect(page.getByRole('button', { name: /^Beta/ })).toHaveCount(0);

  await page.getByRole('tab', { name: 'Settings' }).or(page.getByRole('link', { name: 'Settings' })).first().click();
  await button(page, /^Recently deleted/).click();
  await page.getByRole('button', { name: /^Beta, 30 days left/ }).click();
  await button(page, 'Restore').click();
  await expect(page.getByText('Restored Beta.')).toBeVisible();
  await expect(page.getByText('Nothing here')).toBeVisible();
});
