import { test, expect } from '@playwright/test';

test.describe('Admin Portal E2E', () => {
  test.use({
    storageState: {
      cookies: [],
      origins: [
        {
          origin: typeof process.env.BASE_URL === 'string' ? process.env.BASE_URL : 'http://127.0.0.1:4173',
          localStorage: [
            { name: 'job_portal_token', value: 'mock-admin-token' },
            { name: 'job_portal_user', value: JSON.stringify({ id: 'mock-admin', role: 'admin', name: 'Mock Admin' }) }
          ]
        }
      ]
    }
  });

  test.beforeEach(async ({ page }) => {
    // 1. Dashboard Analytics
    await page.route('**/admin/analytics', async (route) => {
      if (route.request().resourceType() === 'document') return route.continue();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          analytics: { totalUsers: 500, activeUsers: 450, totalJobs: 120, openJobs: 40 }
        })
      });
    });

    // 2. Users
    await page.route('**/admin/users*', async (route) => {
      if (route.request().resourceType() === 'document') return route.continue();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          users: [ { id: 'user-1', name: 'Admin Test User', email: 'test@example.com', role: 'student', status: 'active' } ]
        })
      });
    });

    // 3. Jobs
    await page.route('**/admin/jobs*', async (route) => {
      if (route.request().resourceType() === 'document') return route.continue();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          jobs: [ { id: 'job-1', jobTitle: 'Admin Test Job', companyName: 'Test Company', status: 'pending', targetAudience: 'all' } ]
        })
      });
    });

    // 4. Master Data (Categories)
    await page.route('**/admin/categories*', async (route) => {
      if (route.request().resourceType() === 'document') return route.continue();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          categories: [ { id: 'cat-1', name: 'Technology', status: 'active' } ]
        })
      });
    });

    // Master Data (Locations)
    await page.route('**/admin/locations*', async (route) => {
      if (route.request().resourceType() === 'document') return route.continue();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          locations: [ { id: 'loc-1', name: 'New York', status: 'active' } ]
        })
      });
    });

    // 5. Reports
    await page.route('**/admin/reports*', async (route) => {
      if (route.request().resourceType() === 'document') return route.continue();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          reports: [
            {
              id: 'rep-1',
              targetType: 'job',
              targetId: 'job-1',
              status: 'open',
              reason: 'Content Violation',
              details: 'Listing contains misleading salary claims.',
              createdAt: '2026-04-01T10:00:00.000Z'
            }
          ]
        })
      });
    });

    // 6. Settings
    await page.route('**/admin/settings', async (route) => {
      if (route.request().resourceType() === 'document') return route.continue();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          settings: { allowSignups: true, maintenanceMode: false }
        })
      });
    });

    // 7. Payments
    await page.route('**/admin/payments*', async (route) => {
      if (route.request().resourceType() === 'document') return route.continue();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          payments: [ { id: 'pay-1', amount: 100, status: 'completed', provider: 'stripe' } ]
        })
      });
    });
    
    // 7. Pricing Plans for Payments page
    await page.route('**/pricing/admin/plans', async (route) => {
      if (route.request().resourceType() === 'document') return route.continue();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          plans: [ { id: 'plan-1', name: 'Basic Plan', status: 'active' } ]
        })
      });
    });
  });

  test('admin can log in securely and see dashboard', async ({ page }) => {
    await page.goto('/portal/admin/dashboard');
    await expect(page.getByText(/Admin Dashboard/i).first()).toBeVisible();
    await expect(page.getByText(/500/i).first()).toBeVisible();
  });

  test('admin can view user management', async ({ page }) => {
    await page.goto('/portal/admin/users');
    await expect(page.getByText(/Identity & Access/i).first()).toBeVisible();
    await expect(page.getByText('Admin Test User')).toBeVisible();
  });

  test('admin can view job moderation', async ({ page }) => {
    await page.goto('/portal/admin/jobs');
    await expect(page.getByText(/Oversight & Moderation/i).first()).toBeVisible();
    await expect(page.getByText('Admin Test Job')).toBeVisible();
  });

  test('admin can view master data', async ({ page }) => {
    await page.goto('/portal/admin/master-data');
    await expect(page.getByText(/Master Data/i).first()).toBeVisible();
    await expect(page.getByText('Technology').first()).toBeVisible();
  });

  test('admin can view reports', async ({ page }) => {
    await page.goto('/portal/admin/reports');
    await expect(page.getByText(/Moderation Support/i).first()).toBeVisible();
    await expect(page.getByText('Content Violation').first()).toBeVisible();
  });

  test('admin can view settings', async ({ page }) => {
    await page.goto('/portal/admin/settings');
    await expect(page.getByText(/Settings/i).first()).toBeVisible();
  });

  test('admin can view payments', async ({ page }) => {
    await page.goto('/portal/admin/payments');
    await expect(page.getByText(/Payments/i).first()).toBeVisible();
  });
});
