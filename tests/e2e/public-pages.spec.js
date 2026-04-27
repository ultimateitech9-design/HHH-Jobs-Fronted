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
  for (const route of publicRoutes) {
    await page.goto(route);
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(new RegExp(`${route === '/' ? '/$' : `${route.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`}`));
    await expect(page.locator('main, h1, h2, [role="heading"]').first()).toBeVisible();
    await expect(page.getByText(/page not found|cannot get/i)).toHaveCount(0);
  }
});
