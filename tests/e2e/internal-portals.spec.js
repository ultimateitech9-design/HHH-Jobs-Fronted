import { test, expect } from '@playwright/test';

const createRolePage = async (browser, role) => {
  const context = await browser.newContext({
    storageState: {
      cookies: [],
      origins: [
        {
          origin: 'http://127.0.0.1:4173',
          localStorage: [
            { name: 'job_portal_token', value: `managed-e2e-${role}` },
            {
              name: 'job_portal_user',
              value: JSON.stringify({
                id: `e2e-${role}`,
                role,
                name: `E2E ${role}`,
                isEmailVerified: true
              })
            }
          ]
        }
      ]
    }
  });

  const page = await context.newPage();
  return { context, page };
};

test('platform dashboard demo access shows usable demo telemetry', async ({ browser }) => {
  const { context, page } = await createRolePage(browser, 'platform');
  try {
    await page.goto('/portal/platform/dashboard');

    await expect(page).toHaveURL(/\/portal\/platform\/dashboard$/);
    await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
    await expect(page.getByText(/demo telemetry/i)).toBeVisible({ timeout: 20000 });
    await expect(page.getByText('Alpha Talent Labs', { exact: true })).toBeVisible({ timeout: 20000 });
    await expect(page.getByText('Webhook signing validation', { exact: true })).toBeVisible({ timeout: 20000 });
  } finally {
    await context.close();
  }
});

test('audit dashboard demo access shows alert and event context', async ({ browser }) => {
  const { context, page } = await createRolePage(browser, 'audit');
  try {
    await page.goto('/portal/audit/dashboard');

    await expect(page).toHaveURL(/\/portal\/audit\/dashboard$/);
    await expect(page.locator('h1, h2, [role="heading"]').first()).toBeVisible();
    await expect(page.getByText(/investigation live|demo trace/i)).toBeVisible();
    await expect(page.getByText('Webhook failure spike', { exact: true })).toBeVisible();
    await expect(page.getByText('billing_webhook_failed', { exact: true })).toBeVisible();
  } finally {
    await context.close();
  }
});
