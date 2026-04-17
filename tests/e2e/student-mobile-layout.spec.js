import { test, expect } from '@playwright/test';

const studentStorageState = {
  cookies: [],
  origins: [
    {
      origin: 'http://127.0.0.1:4173',
      localStorage: [
        { name: 'job_portal_token', value: 'managed-e2e-student' },
        {
          name: 'job_portal_user',
          value: JSON.stringify({
            id: 'e2e-student',
            role: 'student',
            name: 'E2E Student',
            isEmailVerified: true
          })
        }
      ]
    }
  ]
};

const companiesPayload = {
  companies: [
    {
      id: 'cmp-apple',
      slug: 'apple',
      name: 'Apple',
      headline: 'Live openings fetched from official company career pages',
      location: 'Seattle',
      totalJobs: 193,
      premium: true,
      portalProfile: true,
      liveFeed: true,
      categories: ['Data / AI / ML', 'Software Engineering', 'Product'],
      description: 'Live openings fetched from official company career pages with 193 open roles right now.'
    },
    {
      id: 'cmp-cloudflare',
      slug: 'cloudflare',
      name: 'Cloudflare',
      headline: 'Live openings fetched from official company career pages',
      location: 'Hybrid',
      totalJobs: 54,
      premium: true,
      portalProfile: true,
      liveFeed: true,
      categories: ['Software Engineering', 'DevOps / Infrastructure', 'Security'],
      description: 'Live openings fetched from official company career pages with 54 open roles right now.'
    }
  ],
  summary: {
    totalCompanies: 2
  }
};

test('student companies page stays stable on mobile', async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 412, height: 915 },
    isMobile: true,
    deviceScaleFactor: 3,
    storageState: studentStorageState
  });

  const page = await context.newPage();

  try {
    await page.route('**/companies*', async (route) => {
      if (route.request().resourceType() === 'document') return route.continue();

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(companiesPayload)
      });
    });

    await page.goto('/portal/student/companies');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: /portal companies/i })).toBeVisible();
    await expect(page.getByText('Apple', { exact: true })).toBeVisible();

    const layout = await page.evaluate(() => ({
      viewportWidth: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      bodyWidth: document.body.scrollWidth
    }));

    expect(layout.documentWidth).toBeLessThanOrEqual(layout.viewportWidth);
    expect(layout.bodyWidth).toBeLessThanOrEqual(layout.viewportWidth);
    await expect(page.getByLabel('Open AI assistant')).toHaveCount(0);
  } finally {
    await context.close();
  }
});
