import { expect, test } from '@playwright/test';

const categoryGrid = '#home-category-grid';

const revealCategorySection = async (page) => {
  await page.locator('#job-categories').scrollIntoViewIfNeeded();
  await expect(page.locator(categoryGrid)).toBeAttached();
  await page.locator(categoryGrid).scrollIntoViewIfNeeded();
};

test('home category cards use relevant images and reveal the full directory on demand', async ({ page }) => {
  await page.goto('/');
  await revealCategorySection(page);

  const cards = page.locator(`${categoryGrid} > a`);
  await expect(cards).toHaveCount(16);
  await expect(page.locator(`${categoryGrid} > a:visible`)).toHaveCount(8);
  await expect(page.locator(`${categoryGrid} > a:visible img`)).toHaveCount(8);

  const firstImage = cards.first().locator('img');
  await expect(firstImage).toHaveAttribute('src', '/images/categories/software.webp');
  await expect.poll(() => firstImage.evaluate((image) => image.naturalWidth)).toBeGreaterThan(0);

  const toggle = page.getByRole('button', { name: 'View all categories' });
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await toggle.click();

  await expect(page.locator(`${categoryGrid} > a:visible`)).toHaveCount(16);
  await expect(page.locator(`${categoryGrid} > a img`)).toHaveCount(16);
  await expect(page.getByRole('button', { name: 'Show fewer categories' })).toHaveAttribute('aria-expanded', 'true');

  await page.getByRole('button', { name: 'Show fewer categories' }).click();
  await expect(page.locator(`${categoryGrid} > a:visible`)).toHaveCount(8);
});

test.describe('mobile category preview', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('keeps the home page concise before the user expands it', async ({ page }) => {
    await page.goto('/');
    await revealCategorySection(page);

    await expect(page.locator(`${categoryGrid} > a:visible`)).toHaveCount(4);
    await page.getByRole('button', { name: 'View all categories' }).click();
    await expect(page.locator(`${categoryGrid} > a:visible`)).toHaveCount(16);
  });
});
