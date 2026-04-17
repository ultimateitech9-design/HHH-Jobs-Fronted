import { test, expect } from '@playwright/test';

test.describe('SuperAdmin Portal E2E', () => {
  test.use({
    storageState: {
      cookies: [],
      origins: [
        {
          origin: typeof process.env.BASE_URL === 'string' ? process.env.BASE_URL : 'http://127.0.0.1:4173',
          localStorage: [
            { name: 'job_portal_token', value: 'mock-superadmin-token' },
            {
              name: 'job_portal_user',
              value: JSON.stringify({
                id: 'mock-superadmin',
                role: 'super_admin',
                name: 'Super Admin',
                isEmailVerified: true
              })
            }
          ]
        }
      ]
    }
  });

  test.beforeEach(async ({ page }) => {
    // 1. Dashboard
    await page.route('**/super-admin/dashboard', async (route) => {
      if (route.request().resourceType() === 'document') return route.continue();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          dashboard: {
            stats: {
              totalUsers: 1000,
              pendingApprovals: 12,
              activeCompanies: 50,
              activeSubscriptions: 38,
              liveJobs: 300,
              totalApplications: 840,
              monthlyRevenue: 50000,
              openSupportTickets: 7,
              criticalLogs: 3,
              duplicateAccounts: 5
            },
            users: [
              {
                id: 'sa-user-1',
                name: 'Super Test User',
                email: 'sa@test.com',
                role: 'student',
                status: 'active',
                is_email_verified: true,
                created_at: '2026-03-20T08:00:00.000Z'
              }
            ],
            jobs: [
              {
                id: 'sa-job-1',
                title: 'Super Test Job',
                company_name: 'Super Test Company',
                location: 'Remote',
                applications: 16,
                status: 'open',
                approval_status: 'approved',
                created_at: '2026-04-01T08:00:00.000Z'
              }
            ],
            applications: [
              {
                id: 'sa-app-1',
                applicant_name: 'SA Candidate',
                job_title: 'Super Test Job',
                company_name: 'Super Test Company',
                score: 88,
                stage: 'shortlisted',
                status: 'applied',
                created_at: '2026-04-02T08:00:00.000Z'
              }
            ],
            payments: [
              {
                id: 'sa-pay-1',
                company_name: 'Super Test Company',
                plan_name: 'Premium Plan',
                reference_id: 'INV-500',
                amount: 500,
                provider: 'razorpay',
                status: 'paid',
                created_at: '2026-04-03T08:00:00.000Z'
              }
            ],
            supportTickets: [
              {
                id: 'ticket-1',
                title: 'Billing escalation',
                company: 'Super Test Company',
                assignee_name: 'Support Lead',
                priority: 'high',
                status: 'open',
                updated_at: '2026-04-04T08:00:00.000Z'
              }
            ],
            systemLogs: [
              {
                id: 'log-1',
                actor_name: 'System',
                actor_role: 'system',
                actor_id: 'sys-1',
                module: 'billing',
                action: 'Invoice generated',
                level: 'warning',
                details: 'Invoice INV-500 issued for Super Test Company.',
                created_at: '2026-04-04T10:00:00.000Z'
              }
            ],
            reports: {
              revenueTrend: [
                { month: 'Jan', revenue: 32000 },
                { month: 'Feb', revenue: 41000 },
                { month: 'Mar', revenue: 50000 }
              ]
            }
          }
        })
      });
    });

    // 2. Users
    await page.route('**/super-admin/users*', async (route) => {
      if (route.request().resourceType() === 'document') return route.continue();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          users: [
            {
              id: 'sa-user-1',
              name: 'Super Test User',
              email: 'sa@test.com',
              role: 'student',
              status: 'active',
              is_email_verified: true,
              created_at: '2026-03-20T08:00:00.000Z'
            }
          ]
        })
      });
    });

    // 3. Companies
    await page.route('**/super-admin/companies*', async (route) => {
      if (route.request().resourceType() === 'document') return route.continue();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          companies: [
            {
              id: 'co-1',
              company_name: 'Super Test Company',
              plan: 'Enterprise',
              industry_type: 'IT',
              is_verified: true,
              job_count: 12,
              application_count: 44,
              users: [
                {
                  id: 'hr-1',
                  name: 'Company Owner',
                  email: 'owner@supertest.com',
                  status: 'active',
                  is_hr_approved: true
                }
              ],
              updated_at: '2026-04-03T08:00:00.000Z'
            }
          ]
        })
      });
    });

    // 4. Jobs
    await page.route('**/super-admin/jobs*', async (route) => {
      if (route.request().resourceType() === 'document') return route.continue();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          jobs: [
            {
              id: 'sa-job-1',
              title: 'Super Test Job',
              company_name: 'Super Test Company',
              location: 'Remote',
              applications: 16,
              status: 'open',
              approval_status: 'approved',
              created_at: '2026-04-01T08:00:00.000Z'
            }
          ]
        })
      });
    });

    // 5. Applications
    await page.route('**/super-admin/applications*', async (route) => {
      if (route.request().resourceType() === 'document') return route.continue();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          applications: [
            {
              id: 'sa-app-1',
              applicant_name: 'SA Candidate',
              job_title: 'Super Test Job',
              company_name: 'Super Test Company',
              score: 88,
              stage: 'shortlisted',
              status: 'applied',
              created_at: '2026-04-02T08:00:00.000Z'
            }
          ]
        })
      });
    });

    // 6. Payments
    await page.route('**/super-admin/payments*', async (route) => {
      if (route.request().resourceType() === 'document') return route.continue();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          payments: [
            {
              id: 'sa-pay-1',
              company_name: 'Super Test Company',
              plan_name: 'Premium Plan',
              reference_id: 'INV-500',
              amount: 500,
              provider: 'razorpay',
              status: 'paid',
              created_at: '2026-04-03T08:00:00.000Z'
            }
          ]
        })
      });
    });
  });

  test('superadmin can log in securely and see dashboard', async ({ page }) => {
    await page.goto('/portal/super-admin/dashboard');
    await expect(page.getByText(/Super Admin Dashboard/i).first()).toBeVisible();
    await expect(page.getByText('1000').first()).toBeVisible();
  });

  test('superadmin can view users', async ({ page }) => {
    await page.goto('/portal/super-admin/users');
    await expect(page.getByText('Super Test User')).toBeVisible();
  });

  test('superadmin can view companies', async ({ page }) => {
    await page.goto('/portal/super-admin/companies');
    await expect(page.getByText('Super Test Company')).toBeVisible();
  });

  test('superadmin can view jobs', async ({ page }) => {
    await page.goto('/portal/super-admin/jobs');
    await expect(page.getByText('Super Test Job')).toBeVisible();
  });

  test('superadmin can view applications', async ({ page }) => {
    await page.goto('/portal/super-admin/applications');
    await expect(page.getByText('SA Candidate')).toBeVisible();
  });

  test('superadmin can view payments', async ({ page }) => {
    await page.goto('/portal/super-admin/payments');
    await expect(page.getByText('Super Test Company')).toBeVisible();
    await expect(page.getByText(/500/).first()).toBeVisible();
  });
});
