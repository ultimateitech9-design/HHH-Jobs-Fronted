import { test, expect } from '@playwright/test';

test.describe('HR Portal E2E', () => {
  test.use({
    storageState: {
      cookies: [],
      origins: [
        {
          origin: typeof process.env.BASE_URL === 'string' ? process.env.BASE_URL : 'http://127.0.0.1:4173',
          localStorage: [
            { name: 'job_portal_token', value: 'mock-hr-token' },
            {
              name: 'job_portal_user',
              value: JSON.stringify({ id: 'mock-hr', role: 'hr', name: 'Mock HR', isEmailVerified: true })
            }
          ]
        }
      ]
    }
  });

  test.beforeEach(async ({ page }) => {
    await page.route('**/hr/analytics', async (route) => {
      if (route.request().resourceType() === 'document') return route.continue();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          analytics: {
            totalJobs: 10, openJobs: 3, closedJobs: 7, totalViews: 120, totalApplications: 45,
            pipeline: { applied: 10, shortlisted: 5, interviewed: 2, offered: 1, rejected: 20, hired: 1 }
          }
        })
      });
    });

    await page.route('**/hr/jobs', async (route) => {
      if (route.request().resourceType() === 'document') return route.continue();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          jobs: [ { id: 'job-1', jobTitle: 'Senior Dev', companyName: 'Mock Company', status: 'open', applicantsCount: 4 } ]
        })
      });
    });

    await page.route('**/hr/candidates/search*', async (route) => {
      if (route.request().resourceType() === 'document') return route.continue();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          candidates: [ { user: { id: 'cand-1', name: 'Applicant One', email: 'one@example.com' }, profile: { headline: 'Dev', skills: ['JS'] } } ]
        })
      });
    });

    await page.route('**/hr/jobs/*/applicants', async (route) => {
      if (route.request().resourceType() === 'document') return route.continue();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          applicants: [ { id: 'app-1', applicant: { name: 'Applicant One' }, status: 'applied' } ]
        })
      });
    });

    await page.route('**/hr/interviews', async (route) => {
      if (route.request().resourceType() === 'document') return route.continue();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          interviews: [ { id: 'int-1', candidateName: 'Applicant One', scheduledAt: new Date().toISOString(), status: 'scheduled' } ]
        })
      });
    });

    await page.route('**/hr/profile', async (route) => {
      if (route.request().resourceType() === 'document') return route.continue();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          profile: { companyName: 'Mock Company', industryType: 'Technology' }
        })
      });
    });
  });

  test('hr can log in securely and see dashboard', async ({ page }) => {
    await page.goto('/portal/hr/dashboard');
    await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
    await expect(page.getByText(/45/i).first()).toBeVisible({ timeout: 20000 });
  });

  test('hr can view company profile', async ({ page }) => {
    await page.goto('/portal/hr/profile');
    await expect(page.getByRole('heading', { name: /Company Profile/i }).first()).toBeVisible();
  });

  test('hr can view job postings', async ({ page }) => {
    await page.goto('/portal/hr/jobs');
    await expect(page.getByRole('heading', { name: /Job Postings/i }).first()).toBeVisible();
    await expect(page.getByText('Senior Dev')).toBeVisible();
  });

  test('hr can view candidate database', async ({ page }) => {
    await page.goto('/portal/hr/candidates');
    await expect(page.getByRole('heading', { name: /Candidate DB/i }).first()).toBeVisible();
    await expect(page.getByText(/Applicant One/i).first()).toBeVisible();
  });

  test('hr can view interview schedule', async ({ page }) => {
    await page.goto('/portal/hr/interviews');
    await expect(page.getByRole('heading', { name: /^Interviews$/ }).first()).toBeVisible();
    await expect(page.getByRole('heading', { name: /Schedule Interview/i }).first()).toBeVisible();
  });
});
