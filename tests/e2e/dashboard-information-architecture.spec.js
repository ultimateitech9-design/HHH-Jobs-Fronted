import { expect, test } from '@playwright/test';

const dashboards = [
  { role: 'admin', path: '/portal/admin/dashboard', heading: 'Operations overview', nextView: 'recruiters' },
  { role: 'admin', path: '/portal/admin/users', heading: 'Identity & Access', nextView: 'workforce' },
  { role: 'hr', path: '/portal/hr/dashboard', heading: 'Hiring command center', nextView: 'activity' },
  { role: 'campus_connect', path: '/portal/campus-connect/dashboard', heading: 'Placement command center', nextView: 'branches' },
  { role: 'dataentry', path: '/portal/dataentry/dashboard', heading: 'Entry workspace', nextView: 'quality' },
  { role: 'sales', path: '/portal/sales/overview', heading: 'Sales workspace', nextView: 'automation' },
  { role: 'accounts', path: '/portal/accounts/overview', heading: 'Accounts overview', nextView: 'transactions' },
  { role: 'support', path: '/portal/support/dashboard', heading: 'Support workspace', nextView: 'queue' },
  { role: 'super_admin', path: '/portal/super-admin/dashboard', heading: 'Super admin control center', nextView: 'workspaces' },
  { role: 'platform', path: '/portal/platform/dashboard', heading: 'Platform control center', nextView: 'tenants' },
  { role: 'audit', path: '/portal/audit/dashboard', heading: 'Audit control center', nextView: 'events' }
];

const seedRole = async (page, role) => {
  await page.addInitScript((activeRole) => {
    window.localStorage.setItem('job_portal_token', `dashboard-ia-${activeRole}`);
    window.localStorage.setItem('job_portal_user', JSON.stringify({
      id: `dashboard-ia-${activeRole}`,
      role: activeRole,
      name: `Dashboard ${activeRole}`,
      isEmailVerified: true
    }));
  }, role);
};

const expectNoHorizontalOverflow = async (page) => {
  const dimensions = await page.evaluate(() => ({
    viewport: window.innerWidth,
    document: document.documentElement.scrollWidth
  }));
  expect(dimensions.document).toBeLessThanOrEqual(dimensions.viewport + 1);
};

for (const dashboard of dashboards) {
  test(`${dashboard.role} ${dashboard.heading} uses one focused workspace`, async ({ page }) => {
    await seedRole(page, dashboard.role);
    await page.goto(dashboard.path, { waitUntil: 'domcontentloaded' });

    await expect(page.getByRole('heading', { name: dashboard.heading, exact: true })).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('.dashboard-focus-nav')).toBeVisible();
    await expect(page.locator('[role="tabpanel"]:visible')).toHaveCount(1);
    await expectNoHorizontalOverflow(page);

    if (process.env.DASHBOARD_VISUAL_OUTPUT === '1' && ['admin', 'hr'].includes(dashboard.role)) {
      const screenshotName = `${dashboard.role}-${dashboard.heading}`
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-');
      await page.screenshot({ path: `.codex-${screenshotName}.png`, fullPage: true });
    }

    await page.getByRole('tab').nth(1).click();
    await expect(page).toHaveURL(new RegExp(`[?&]view=${dashboard.nextView}(?:&|$)`));
    await expect(page.locator(`#dashboard-view-${dashboard.nextView}`)).toBeVisible();
    await expect(page.locator('[role="tabpanel"]:visible')).toHaveCount(1);

    await page.setViewportSize({ width: 390, height: 844 });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: dashboard.heading, exact: true })).toBeVisible({ timeout: 20_000 });
    await expectNoHorizontalOverflow(page);
  });
}
