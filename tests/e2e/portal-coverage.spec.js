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

test('management portal buttons route unauthenticated users to portal login', async ({ page }) => {
  await page.goto('/management');

  await expect(page.getByRole('heading', { name: 'Management' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Employee' })).toBeVisible();

  await page.locator('.management-card--management').hover();
  await page.getByRole('button', { name: 'Platform Ops', exact: true }).click({ force: true });

  await expect(page).toHaveURL(/\/management\/login\/platform$/);
  await expect(page.getByRole('heading', { name: /platform operations portal/i })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Sign in', exact: true })).toBeVisible();
});

test('authenticated admin can move from management portal into platform ops without logging in again', async ({ browser }) => {
  const { context, page } = await createRolePage(browser, 'admin');

  try {
    await page.goto('/management');

    await page.locator('.management-card--management').hover();
    await page.getByRole('button', { name: 'Platform Ops', exact: true }).click({ force: true });

    await expect(page).toHaveURL(/\/portal\/platform\/dashboard$/);
    await expect(page.getByText('Platform Dashboard', { exact: true }).first()).toBeVisible();
  } finally {
    await context.close();
  }
});

test('admin can open the super admin dashboard route through shared management access', async ({ browser }) => {
  const { context, page } = await createRolePage(browser, 'admin');

  try {
    await page.goto('/portal/super-admin/dashboard');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(/\/portal\/super-admin\/dashboard$/);
    await expect(page.getByText('Super Admin Dashboard', { exact: true }).first()).toBeVisible();
  } finally {
    await context.close();
  }
});

test('authenticated super admin can move from management portal into accounts without logging in again', async ({ browser }) => {
  const { context, page } = await createRolePage(browser, 'super_admin');

  try {
    await page.goto('/management');

    await page.locator('.management-card--employee').hover();
    await page.getByRole('button', { name: 'Accounts Dashboard', exact: true }).click({ force: true });

    await expect(page).toHaveURL(/\/portal\/accounts\/overview$/);
    await expect(page.getByText('Accounts Overview', { exact: true }).first()).toBeVisible();
  } finally {
    await context.close();
  }
});

test('super admin dashboard smoke', async ({ browser }) => {
  const { context, page } = await createRolePage(browser, 'super_admin');

  try {
    await page.goto('/portal/super-admin/dashboard');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(/\/portal\/super-admin\/dashboard$/);
    await expect(page.getByText('Super Admin Dashboard', { exact: true }).first()).toBeVisible();

    const sidebar = page.getByRole('navigation');
    await expect(sidebar.getByRole('link', { name: 'Users', exact: true })).toBeVisible();

    await sidebar.getByRole('link', { name: 'Users', exact: true }).click();
    await expect(page).toHaveURL(/\/portal\/super-admin\/users$/);
    await expect(page.getByText('Users Management', { exact: true }).first()).toBeVisible();
  } finally {
    await context.close();
  }
});

test('accounts dashboard smoke', async ({ browser }) => {
  const { context, page } = await createRolePage(browser, 'accounts');

  try {
    await page.goto('/portal/accounts/overview');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(/\/portal\/accounts\/overview$/);
    await expect(page.getByText('Accounts Overview', { exact: true }).first()).toBeVisible();

    const sidebar = page.getByRole('navigation');
    await expect(sidebar.getByRole('link', { name: 'Transactions', exact: true })).toBeVisible();

    await sidebar.getByRole('link', { name: 'Transactions', exact: true }).click();
    await expect(page).toHaveURL(/\/portal\/accounts\/transactions$/);
    await expect(page.locator('h1, h2').first()).toBeVisible();
  } finally {
    await context.close();
  }
});

test('data entry dashboard smoke', async ({ browser }) => {
  const { context, page } = await createRolePage(browser, 'dataentry');

  try {
    await page.goto('/portal/dataentry/dashboard');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(/\/portal\/dataentry\/dashboard$/);
    await expect(page.getByText('Data Entry Dashboard', { exact: true }).first()).toBeVisible();

    const sidebar = page.getByRole('navigation');
    await expect(sidebar.getByRole('link', { name: 'Data Records', exact: true })).toBeVisible();

    await sidebar.getByRole('link', { name: 'Data Records', exact: true }).click();
    await expect(page).toHaveURL(/\/portal\/dataentry\/records$/);
    await expect(page.locator('h1, h2').first()).toBeVisible();
  } finally {
    await context.close();
  }
});
