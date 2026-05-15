import { test, expect } from '@playwright/test';

const publicRoutes = [
  '/',
  '/services',
  '/ats',
  '/emp-verify',
  '/retired-employee',
  '/about-us',
  '/contact-us',
  '/help-center',
  '/report-issue',
  '/privacy-policy',
  '/terms-and-conditions',
  '/grievances',
  '/trust-and-safety',
  '/summons-notices'
];

test('key public pages render without 404 or empty-shell failures', async ({ page }) => {
  test.setTimeout(180_000);

  for (const route of publicRoutes) {
    await page.goto(route, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});

    await expect(page).toHaveURL(new RegExp(`${route === '/' ? '/$' : `${route.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`}`));
    await expect(page.locator('main, h1, h2, [role="heading"]').first()).toBeVisible();
    await expect(page.getByText(/page not found|cannot get/i)).toHaveCount(0);
  }
});
