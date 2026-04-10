import { test, expect } from '@playwright/test';

const getSidebar = (page) => page.getByRole('navigation');

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
                name: `E2E ${role}`
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

const runWithRolePage = async (browser, role, callback) => {
  const { context, page } = await createRolePage(browser, role);
  try {
    await callback(page);
  } finally {
    await context.close();
  }
};

test('admin dashboard smoke', async ({ browser }) => {
  await runWithRolePage(browser, 'admin', async (page) => {
    const sidebar = getSidebar(page);

    await page.goto('/portal/admin/dashboard');
    await expect(page).toHaveURL(/\/portal\/admin\/dashboard$/);
    await expect(page.getByText('Admin Dashboard', { exact: true })).toBeVisible();
    await expect(
      page.getByRole('heading', {
        name: /operations overview for moderation, recruiter approvals, and platform governance/i
      })
    ).toBeVisible();
    await expect(sidebar.getByRole('link', { name: 'Users', exact: true })).toBeVisible();
    await expect(sidebar.getByRole('link', { name: 'Jobs', exact: true })).toBeVisible();
    await expect(sidebar.getByRole('link', { name: 'Reports', exact: true })).toBeVisible();
    await expect(sidebar.getByRole('link', { name: 'Payments', exact: true })).toBeVisible();

    await sidebar.getByRole('link', { name: 'Users', exact: true }).click();
    await expect(page).toHaveURL(/\/portal\/admin\/users$/);
    await expect(page.getByRole('heading', { name: /identity & access/i })).toBeVisible();

    await sidebar.getByRole('link', { name: 'Jobs', exact: true }).click();
    await expect(page).toHaveURL(/\/portal\/admin\/jobs$/);
    await expect(page.getByRole('heading', { name: /oversight & moderation/i })).toBeVisible();

    await sidebar.getByRole('link', { name: 'Reports', exact: true }).click();
    await expect(page).toHaveURL(/\/portal\/admin\/reports$/);
    await expect(page.getByRole('heading', { name: /moderation support/i })).toBeVisible();
  });
});

test('super admin cannot access admin dashboard', async ({ browser }) => {
  await runWithRolePage(browser, 'super_admin', async (page) => {
    await page.goto('/portal/admin/dashboard');
    await expect(page).toHaveURL(/\/forbidden$/);
    await expect(page.getByText('Access Forbidden', { exact: true })).toBeVisible();
  });
});

test('hr dashboard smoke', async ({ browser }) => {
  await runWithRolePage(browser, 'hr', async (page) => {
    const sidebar = getSidebar(page);

    await page.goto('/portal/hr/dashboard');
    await expect(page).toHaveURL(/\/portal\/hr\/dashboard$/);
    await expect(page.getByText('Recruiter Dashboard', { exact: true })).toBeVisible();
    await expect(
      page.getByRole('heading', {
        name: /company overview, hiring pipeline, and candidate movement in one recruiter workspace/i
      })
    ).toBeVisible();
    await expect(sidebar.getByRole('link', { name: 'Job Postings', exact: true })).toBeVisible();
    await expect(sidebar.getByRole('link', { name: 'Applicants', exact: true })).toBeVisible();
    await expect(sidebar.getByRole('link', { name: 'Interviews', exact: true })).toBeVisible();
    await expect(sidebar.getByRole('link', { name: 'Employee Verification', exact: true })).toBeVisible();
    await expect(sidebar.getByRole('link', { name: 'Company Profile', exact: true })).toBeVisible();

    await sidebar.getByRole('link', { name: 'Applicants', exact: true }).click();
    await expect(page).toHaveURL(/\/portal\/hr\/candidates$/);
    await expect(page.getByRole('heading', { name: /candidate database/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /apply filters/i })).toBeVisible();

    await sidebar.getByRole('link', { name: 'Interviews', exact: true }).click();
    await expect(page).toHaveURL(/\/portal\/hr\/interviews$/);
    await expect(page.getByRole('heading', { name: /interview calendar/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /schedule invite/i })).toBeVisible();

    await sidebar.getByRole('link', { name: 'Employee Verification', exact: true }).click();
    await expect(page).toHaveURL(/\/portal\/hr\/employee-verification$/);
    await expect(page.getByRole('heading', { name: 'Employee Verification', exact: true })).toBeVisible();

    await sidebar.getByRole('link', { name: 'Company Profile', exact: true }).click();
    await expect(page).toHaveURL(/\/portal\/hr\/profile$/);
    await expect(page.getByRole('heading', { name: /company profile/i }).first()).toBeVisible();
  });
});

test('student dashboard smoke', async ({ browser }) => {
  await runWithRolePage(browser, 'student', async (page) => {
    const sidebar = getSidebar(page);

    await page.goto('/portal/student/dashboard');
    await expect(page).toHaveURL(/\/portal\/student\/dashboard$/);
    await expect(page.getByText('Student Dashboard', { exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();
    await expect(sidebar.getByRole('link', { name: 'Saved Jobs', exact: true })).toBeVisible();
    await expect(sidebar.getByRole('link', { name: 'Alerts', exact: true })).toBeVisible();
    await expect(sidebar.getByRole('link', { name: 'Interviews', exact: true })).toBeVisible();
    await expect(sidebar.getByRole('link', { name: 'Notifications', exact: true })).toBeVisible();
    await expect(sidebar.getByRole('link', { name: 'Company Reviews', exact: true })).toBeVisible();

    await sidebar.getByRole('link', { name: 'Saved Jobs', exact: true }).click();
    await expect(page).toHaveURL(/\/portal\/student\/saved-jobs$/);
    await expect(page.getByRole('heading', { name: /your saved opportunities/i })).toBeVisible();

    await sidebar.getByRole('link', { name: 'Alerts', exact: true }).click();
    await expect(page).toHaveURL(/\/portal\/student\/alerts$/);
    await expect(page.getByRole('heading', { name: /create and manage alert rules/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /create alert/i })).toBeVisible();

    await sidebar.getByRole('link', { name: 'Company Reviews', exact: true }).click();
    await expect(page).toHaveURL(/\/portal\/student\/company-reviews$/);
    await expect(page.getByRole('heading', { name: /company reviews/i }).first()).toBeVisible();
    await expect(page.getByRole('heading', { name: /write a review/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /submit review/i })).toBeVisible();
  });
});

test('accounts dashboard smoke', async ({ browser }) => {
  await runWithRolePage(browser, 'accounts', async (page) => {
    const sidebar = getSidebar(page);

    await page.goto('/portal/accounts/overview');
    await expect(page).toHaveURL(/\/portal\/accounts\/overview$/);
    await expect(page.getByText('Accounts Overview', { exact: true })).toBeVisible();
    await expect(page.getByText(/revenue, invoices, collections, and settlements across the hhh jobs platform/i)).toBeVisible();
    await expect(sidebar.getByRole('link', { name: 'Overview', exact: true })).toBeVisible();
    await expect(sidebar.getByRole('link', { name: 'Invoices', exact: true })).toBeVisible();
    await expect(sidebar.getByRole('link', { name: 'Payment Settings', exact: true })).toBeVisible();

    await sidebar.getByRole('link', { name: 'Invoices', exact: true }).click();
    await expect(page).toHaveURL(/\/portal\/accounts\/invoices$/);
    await expect(page.getByRole('heading', { name: /^Invoices$/ }).first()).toBeVisible();
    await expect(page.getByRole('combobox').first()).toBeVisible();

    await sidebar.getByRole('link', { name: 'Payment Settings', exact: true }).click();
    await expect(page).toHaveURL(/\/portal\/accounts\/payment-settings$/);
    await expect(page.getByRole('heading', { name: /payment settings/i }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /save settings/i })).toBeVisible();
  });
});

test('data entry dashboard smoke', async ({ browser }) => {
  await runWithRolePage(browser, 'dataentry', async (page) => {
    const sidebar = getSidebar(page);

    await page.goto('/portal/dataentry/dashboard');
    await expect(page).toHaveURL(/\/portal\/dataentry\/dashboard$/);
    await expect(page.getByText('Data Entry Dashboard', { exact: true })).toBeVisible();
    await expect(page.getByText(/candidate, company, and job entry operations in one command view/i)).toBeVisible();
    await expect(sidebar.getByRole('link', { name: 'Dashboard', exact: true })).toBeVisible();
    await expect(sidebar.getByRole('link', { name: 'Post Job', exact: true })).toBeVisible();
    await expect(sidebar.getByRole('link', { name: 'Pending Approval', exact: true })).toBeVisible();

    await sidebar.getByRole('link', { name: 'Post Job', exact: true }).click();
    await expect(page).toHaveURL(/\/portal\/dataentry\/add-job$/);
    await expect(page.getByRole('heading', { name: /add job/i }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /save job entry/i })).toBeVisible();

    await sidebar.getByRole('link', { name: 'Pending Approval', exact: true }).click();
    await expect(page).toHaveURL(/\/portal\/dataentry\/pending$/);
    await expect(page.getByRole('heading', { name: /pending entries/i }).first()).toBeVisible();
  });
});

test('super admin dashboard smoke', async ({ browser }) => {
  await runWithRolePage(browser, 'super_admin', async (page) => {
    const sidebar = getSidebar(page);

    await page.goto('/portal/super-admin/dashboard');
    await expect(page).toHaveURL(/\/portal\/super-admin\/dashboard$/);
    await expect(page.getByText('Super Admin Dashboard', { exact: true }).first()).toBeVisible();
    await expect(page.getByText(/one workspace to monitor growth, risk, revenue, trust, and operations/i)).toBeVisible();
    await expect(sidebar.getByRole('link', { name: 'Users', exact: true })).toBeVisible();
    await expect(sidebar.getByRole('link', { name: 'System Settings', exact: true })).toBeVisible();

    await sidebar.getByRole('link', { name: 'Users', exact: true }).click();
    await expect(page).toHaveURL(/\/portal\/super-admin\/users$/);
    await expect(page.getByRole('heading', { name: /users management/i }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /create .* id/i })).toBeVisible();

    await sidebar.getByRole('link', { name: 'System Settings', exact: true }).click();
    await expect(page).toHaveURL(/\/portal\/super-admin\/system-settings$/);
    await expect(page.getByRole('heading', { name: /system settings/i }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /save settings/i })).toBeVisible();
  });
});

test('support ticket details link opens selected ticket', async ({ browser }) => {
  const { context, page } = await createRolePage(browser, 'support');
  try {
  await page.goto('/portal/support/tickets');
  await page.waitForLoadState('networkidle');

  await expect(page).toHaveURL(/\/portal\/support\/tickets$/);
  await expect(page.getByRole('link', { name: 'SUP-1001' })).toBeVisible();

  await page.getByRole('link', { name: 'SUP-1001' }).click();
  await page.waitForLoadState('networkidle');

  await expect(page).toHaveURL(/\/portal\/support\/ticket-details\/SUP-1001$/);
  await expect(page.getByRole('heading', { name: /ticket details/i }).first()).toBeVisible();
  await expect(page.getByText('SUP-1001', { exact: true })).toBeVisible();
  await expect(page.getByText('Employer cannot publish approved job', { exact: true })).toBeVisible();
  } finally {
    await context.close();
  }
});

test('sales order details link opens selected order', async ({ browser }) => {
  const { context, page } = await createRolePage(browser, 'sales');
  try {
  await page.route('**/sales/orders/SO-2101', async (route) => {
    if (route.request().resourceType() === 'document') return route.continue();
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        order: {
          id: 'SO-2101',
          customer: 'Metro Build Infra',
          product: 'Enterprise Hiring Pack',
          amount: 25000,
          quantity: 1,
          payment_method: 'UPI',
          status: 'paid',
          created_at: '2026-04-01T10:00:00.000Z'
        }
      })
    });
  });

  await page.route('**/sales/orders', async (route) => {
    if (route.request().resourceType() === 'document') return route.continue();
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        orders: [
          {
            id: 'SO-2101',
            customer: 'Metro Build Infra',
            product: 'Enterprise Hiring Pack',
            amount: 25000,
            quantity: 1,
            payment_method: 'UPI',
            status: 'paid',
            created_at: '2026-04-01T10:00:00.000Z'
          }
        ]
      })
    });
  });

  await page.goto('/portal/sales/orders');
  await page.waitForLoadState('networkidle');

  await expect(page).toHaveURL(/\/portal\/sales\/orders$/);
  await expect(page.getByRole('link', { name: 'SO-2101' })).toBeVisible();

  await page.getByRole('link', { name: 'SO-2101' }).click();
  await page.waitForLoadState('networkidle');

  await expect(page).toHaveURL(/\/portal\/sales\/order-details\/SO-2101$/);
  await expect(page.getByRole('heading', { name: /order details/i }).first()).toBeVisible();
  await expect(page.locator('li').filter({ hasText: 'Order ID' }).getByText('SO-2101')).toBeVisible();
  await expect(page.locator('li').filter({ hasText: 'Customer' }).getByText('Metro Build Infra')).toBeVisible();
  } finally {
    await context.close();
  }
});
