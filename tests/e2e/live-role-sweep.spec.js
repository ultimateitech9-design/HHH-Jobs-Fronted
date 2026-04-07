import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test, expect } from '@playwright/test';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FRONTEND_ROOT = path.resolve(__dirname, '../..');
const AUDIT_ROOT = path.resolve(FRONTEND_ROOT, '../playwright-audit');
const SCREENSHOT_ROOT = path.join(AUDIT_ROOT, 'screenshots', 'live-role-sweep');
const SUMMARY_PATH = path.join(AUDIT_ROOT, 'live-role-sweep-results.json');

const PASSWORD = process.env.E2E_PASSWORD;
const UI_ERROR_PATTERN = /Unexpected Application Error|Something went wrong|Cannot read properties|Error loading|Unhandled error/i;

const runResults = [];

const roleConfigs = [
  {
    key: 'student',
    emailEnv: 'E2E_STUDENT_EMAIL',
    landingPath: '/portal/student/dashboard',
    routes: [
      { name: 'dashboard', path: '/portal/student/dashboard' },
      { name: 'profile', path: '/portal/student/profile' },
      {
        name: 'jobs',
        path: '/portal/student/jobs',
        probe: probeDetailLink({
          name: 'job-detail',
          selector: 'a[href^="/portal/student/jobs/"]',
          expectedPrefix: '/portal/student/jobs/'
        })
      },
      { name: 'applications', path: '/portal/student/applications' },
      { name: 'saved-jobs', path: '/portal/student/saved-jobs' },
      { name: 'alerts', path: '/portal/student/alerts' },
      { name: 'interviews', path: '/portal/student/interviews' },
      { name: 'analytics', path: '/portal/student/analytics' },
      { name: 'ats', path: '/portal/student/ats' },
      { name: 'notifications', path: '/portal/student/notifications' },
      { name: 'company-reviews', path: '/portal/student/company-reviews' },
      { name: 'global-jobs', path: '/portal/student/global-jobs' }
    ]
  },
  {
    key: 'hr',
    emailEnv: 'E2E_HR_EMAIL',
    landingPath: '/portal/hr/dashboard',
    routes: [
      { name: 'dashboard', path: '/portal/hr/dashboard' },
      {
        name: 'jobs',
        path: '/portal/hr/jobs',
        probe: probeDetailLink({
          name: 'job-applicants',
          selector: 'a[href*="/portal/hr/jobs/"][href*="/applicants"]',
          expectedPrefix: '/portal/hr/jobs/'
        })
      },
      { name: 'candidates', path: '/portal/hr/candidates' },
      { name: 'interviews', path: '/portal/hr/interviews' },
      { name: 'notifications', path: '/portal/hr/notifications' },
      { name: 'analytics', path: '/portal/hr/analytics' },
      { name: 'ats', path: '/portal/hr/ats' },
      { name: 'profile', path: '/portal/hr/profile' }
    ]
  },
  {
    key: 'admin',
    emailEnv: 'E2E_ADMIN_EMAIL',
    landingPath: '/portal/admin/dashboard',
    routes: [
      { name: 'dashboard', path: '/portal/admin/dashboard' },
      { name: 'users', path: '/portal/admin/users' },
      { name: 'jobs', path: '/portal/admin/jobs' },
      { name: 'applications', path: '/portal/admin/applications' },
      { name: 'master-data', path: '/portal/admin/master-data' },
      { name: 'payments', path: '/portal/admin/payments' },
      { name: 'reports', path: '/portal/admin/reports' },
      { name: 'audit', path: '/portal/admin/audit' },
      { name: 'settings', path: '/portal/admin/settings' },
      { name: 'control', path: '/portal/admin/control' },
      { name: 'external-jobs', path: '/portal/admin/external-jobs' }
    ]
  },
  {
    key: 'super-admin',
    emailEnv: 'E2E_SUPERADMIN_EMAIL',
    landingPath: '/portal/super-admin/dashboard',
    routes: [
      { name: 'dashboard', path: '/portal/super-admin/dashboard' },
      { name: 'users', path: '/portal/super-admin/users' },
      { name: 'companies', path: '/portal/super-admin/companies' },
      { name: 'jobs', path: '/portal/super-admin/jobs' },
      { name: 'applications', path: '/portal/super-admin/applications' },
      { name: 'payments', path: '/portal/super-admin/payments' },
      { name: 'subscriptions', path: '/portal/super-admin/subscriptions' },
      { name: 'reports', path: '/portal/super-admin/reports' },
      { name: 'support-tickets', path: '/portal/super-admin/support-tickets' },
      { name: 'system-logs', path: '/portal/super-admin/system-logs' },
      { name: 'roles-permissions', path: '/portal/super-admin/roles-permissions' },
      { name: 'system-settings', path: '/portal/super-admin/system-settings' }
    ]
  },
  {
    key: 'accounts',
    emailEnv: 'E2E_ACCOUNTS_EMAIL',
    landingPath: '/portal/accounts/overview',
    routes: [
      { name: 'overview', path: '/portal/accounts/overview' },
      { name: 'transactions', path: '/portal/accounts/transactions' },
      { name: 'invoices', path: '/portal/accounts/invoices' },
      { name: 'subscriptions', path: '/portal/accounts/subscriptions' },
      { name: 'expenses', path: '/portal/accounts/expenses' },
      { name: 'payouts', path: '/portal/accounts/payouts' },
      { name: 'refunds', path: '/portal/accounts/refunds' },
      { name: 'reports', path: '/portal/accounts/reports' },
      { name: 'payment-settings', path: '/portal/accounts/payment-settings' }
    ]
  },
  {
    key: 'sales',
    emailEnv: 'E2E_SALES_EMAIL',
    landingPath: '/portal/sales/overview',
    routes: [
      { name: 'overview', path: '/portal/sales/overview' },
      {
        name: 'orders',
        path: '/portal/sales/orders',
        probe: probeDetailLink({
          name: 'order-detail',
          selector: 'a[href^="/portal/sales/order-details/"]',
          expectedPrefix: '/portal/sales/order-details/'
        })
      },
      {
        name: 'leads',
        path: '/portal/sales/leads',
        probe: probeDetailLink({
          name: 'lead-detail',
          selector: 'a[href^="/portal/sales/lead-details/"]',
          expectedPrefix: '/portal/sales/lead-details/'
        })
      },
      {
        name: 'customers',
        path: '/portal/sales/customers',
        probe: probeDetailLink({
          name: 'customer-detail',
          selector: 'a[href^="/portal/sales/customer-details/"]',
          expectedPrefix: '/portal/sales/customer-details/'
        })
      },
      { name: 'team', path: '/portal/sales/team' },
      { name: 'products', path: '/portal/sales/products' },
      { name: 'coupons', path: '/portal/sales/coupons' },
      { name: 'refunds', path: '/portal/sales/refunds' },
      { name: 'reports', path: '/portal/sales/reports' }
    ]
  },
  {
    key: 'dataentry',
    emailEnv: 'E2E_DATAENTRY_EMAIL',
    landingPath: '/portal/dataentry/dashboard',
    routes: [
      { name: 'dashboard', path: '/portal/dataentry/dashboard' },
      { name: 'add-job', path: '/portal/dataentry/add-job' },
      { name: 'records', path: '/portal/dataentry/records' },
      { name: 'manage-entries', path: '/portal/dataentry/manage-entries' },
      { name: 'drafts', path: '/portal/dataentry/drafts' },
      { name: 'pending', path: '/portal/dataentry/pending' },
      { name: 'approved', path: '/portal/dataentry/approved' },
      { name: 'rejected', path: '/portal/dataentry/rejected' },
      { name: 'notifications', path: '/portal/dataentry/notifications' },
      { name: 'profile', path: '/portal/dataentry/profile' }
    ]
  }
];

test.beforeAll(async () => {
  await fs.mkdir(SCREENSHOT_ROOT, { recursive: true });
});

test.afterAll(async () => {
  await fs.mkdir(path.dirname(SUMMARY_PATH), { recursive: true });
  await fs.writeFile(SUMMARY_PATH, JSON.stringify(runResults, null, 2), 'utf8');
});

for (const roleConfig of roleConfigs) {
  test(`${roleConfig.key} live portal sweep`, async ({ browser }, testInfo) => {
    test.setTimeout(240_000);

    const email = readOptionalEnv(roleConfig.emailEnv);
    test.skip(!PASSWORD, 'Set E2E_PASSWORD to run the live portal sweep.');
    test.skip(!email, `Set ${roleConfig.emailEnv} to run the ${roleConfig.key} live portal sweep.`);

    const context = await browser.newContext();
    const page = await context.newPage();
    const diagnostics = attachDiagnostics(page);
    const routeResults = [];
    const failures = [];

    try {
      await loginAsRole(page, roleConfig, email);

      for (const routeConfig of roleConfig.routes) {
        await test.step(`${roleConfig.key} -> ${routeConfig.name}`, async () => {
          const routeResult = await visitRoute(page, roleConfig.key, routeConfig, diagnostics);
          routeResults.push(routeResult);
          if (routeResult.status !== 'passed') {
            failures.push(`${routeConfig.name}: ${routeResult.issues.join(' | ')}`);
          }

          if (routeConfig.probe) {
            const probeResult = await routeConfig.probe(page, roleConfig.key, diagnostics);
            routeResults.push(probeResult);
            if (probeResult.status !== 'passed') {
              failures.push(`${routeConfig.name}/${probeResult.name}: ${probeResult.issues.join(' | ')}`);
            }
          }
        });
      }
    } finally {
      runResults.push({
        role: roleConfig.key,
        login: maskEmail(email),
        routes: routeResults
      });

      await testInfo.attach(`${roleConfig.key}-summary`, {
        body: Buffer.from(JSON.stringify(routeResults, null, 2), 'utf8'),
        contentType: 'application/json'
      });

      await context.close();
    }

    expect(failures, failures.join('\n')).toEqual([]);
  });
}

function readOptionalEnv(name) {
  return String(process.env[name] || '').trim();
}

function maskEmail(email) {
  const [localPart = '', domain = ''] = String(email).split('@');
  const prefix = localPart.slice(0, 2);
  return `${prefix}${localPart.length > 2 ? '***' : ''}@${domain}`;
}

function attachDiagnostics(page) {
  const diagnostics = {
    consoleErrors: [],
    pageErrors: [],
    errorResponses: [],
    failedRequests: []
  };

  page.on('console', (message) => {
    if (message.type() === 'error') {
      diagnostics.consoleErrors.push({
        url: page.url(),
        text: message.text()
      });
    }
  });

  page.on('pageerror', (error) => {
    diagnostics.pageErrors.push({
      url: page.url(),
      text: error.message
    });
  });

  page.on('response', (response) => {
    const url = response.url();
    if ((isLocalAppUrl(url) || isLocalApiUrl(url)) && response.status() >= 400) {
      diagnostics.errorResponses.push({
        url,
        status: response.status()
      });
    }
  });

  page.on('requestfailed', (request) => {
    const url = request.url();
    const errorText = request.failure()?.errorText || 'request failed';
    if (/ERR_ABORTED/i.test(errorText)) {
      return;
    }
    if (isLocalAppUrl(url) || isLocalApiUrl(url)) {
      diagnostics.failedRequests.push({
        url,
        errorText
      });
    }
  });

  return diagnostics;
}

function isLocalAppUrl(url) {
  return /^https?:\/\/127\.0\.0\.1:4173/i.test(url);
}

function isLocalApiUrl(url) {
  return /^https?:\/\/127\.0\.0\.1:6001/i.test(url);
}

function snapshotDiagnostics(diagnostics) {
  return {
    consoleErrors: diagnostics.consoleErrors.length,
    pageErrors: diagnostics.pageErrors.length,
    errorResponses: diagnostics.errorResponses.length,
    failedRequests: diagnostics.failedRequests.length
  };
}

function collectDiagnostics(diagnostics, snapshot) {
  return [
    ...diagnostics.consoleErrors.slice(snapshot.consoleErrors).map((entry) => `console error: ${entry.text}`),
    ...diagnostics.pageErrors.slice(snapshot.pageErrors).map((entry) => `page error: ${entry.text}`),
    ...diagnostics.errorResponses.slice(snapshot.errorResponses).map((entry) => `HTTP ${entry.status}: ${entry.url}`),
    ...diagnostics.failedRequests.slice(snapshot.failedRequests).map((entry) => `request failed: ${entry.url} (${entry.errorText})`)
  ];
}

async function loginAsRole(page, roleConfig, email) {
  if (!PASSWORD) {
    throw new Error('Missing required environment variable: E2E_PASSWORD');
  }

  await page.goto('/login', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('input[type="email"]')).toBeVisible();
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[autocomplete="current-password"]').fill(PASSWORD);
  await page.getByRole('button', { name: /sign in/i }).click();

  await waitForPathPrefix(page, roleConfig.landingPath);
  await waitForRouteSettled(page);
}

async function visitRoute(page, roleKey, routeConfig, diagnostics) {
  const snapshot = snapshotDiagnostics(diagnostics);
  const issues = [];

  try {
    await page.goto(routeConfig.path, { waitUntil: 'domcontentloaded' });
    await waitForPathPrefix(page, routeConfig.path);
    await waitForRouteSettled(page);
  } catch (error) {
    issues.push(error.message);
  }

  const pathname = safePathname(page.url());
  if (pathname === '/login') {
    issues.push('redirected back to login');
  } else if (pathname === '/forbidden') {
    issues.push('redirected to forbidden');
  } else if (!pathname.startsWith(routeConfig.path)) {
    issues.push(`unexpected route: ${pathname}`);
  }

  const uiError = await detectUiError(page);
  if (uiError) {
    issues.push(`ui error: ${uiError}`);
  }

  const heading = await readHeading(page);
  if (!heading) {
    issues.push('no heading found');
  }

  issues.push(...collectDiagnostics(diagnostics, snapshot));

  const screenshot = await takeRouteScreenshot(page, roleKey, routeConfig.name);
  return {
    name: routeConfig.name,
    path: routeConfig.path,
    heading,
    screenshot,
    status: issues.length ? 'failed' : 'passed',
    issues
  };
}

function probeDetailLink({ name, selector, expectedPrefix }) {
  return async (page, roleKey, diagnostics) => {
    const snapshot = snapshotDiagnostics(diagnostics);
    const issues = [];

    const link = page.locator(selector).first();
    if ((await link.count()) === 0) {
      issues.push(`no live detail link found for selector ${selector}`);
      return {
        name,
        path: expectedPrefix,
        heading: '',
        screenshot: await takeRouteScreenshot(page, roleKey, name),
        status: 'failed',
        issues
      };
    }

    try {
      await link.click();
      await waitForPathPrefix(page, expectedPrefix);
      await waitForRouteSettled(page);
    } catch (error) {
      issues.push(error.message);
    }

    const pathname = safePathname(page.url());
    if (!pathname.startsWith(expectedPrefix)) {
      issues.push(`unexpected detail route: ${pathname}`);
    }

    const uiError = await detectUiError(page);
    if (uiError) {
      issues.push(`ui error: ${uiError}`);
    }

    const heading = await readHeading(page);
    if (!heading) {
      issues.push('no heading found');
    }

    issues.push(...collectDiagnostics(diagnostics, snapshot));

    const screenshot = await takeRouteScreenshot(page, roleKey, name);
    return {
      name,
      path: pathname,
      heading,
      screenshot,
      status: issues.length ? 'failed' : 'passed',
      issues
    };
  };
}

async function waitForPathPrefix(page, expectedPrefix) {
  const timeoutAt = Date.now() + 20_000;

  while (Date.now() < timeoutAt) {
    const pathname = safePathname(page.url());
    if (pathname.startsWith(expectedPrefix)) {
      return;
    }
    if (pathname === '/verify-otp') {
      throw new Error('login redirected to OTP verification');
    }
    await page.waitForTimeout(250);
  }

  throw new Error(`timed out waiting for route ${expectedPrefix}, current ${safePathname(page.url())}`);
}

async function waitForRouteSettled(page) {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForLoadState('networkidle', { timeout: 6_000 }).catch(() => {});
  await page.waitForTimeout(600);
  await page.locator('main, h1, h2, [role="heading"]').first().waitFor({ state: 'visible', timeout: 10_000 }).catch(() => {});
  await page.waitForTimeout(300);
}

async function detectUiError(page) {
  const errorNode = page.getByText(UI_ERROR_PATTERN).first();
  if (await errorNode.isVisible().catch(() => false)) {
    return (await errorNode.textContent())?.trim() || 'Unknown UI error';
  }
  return '';
}

async function readHeading(page) {
  const heading = page.locator('h1, h2, [role="heading"]').first();
  if (await heading.isVisible().catch(() => false)) {
    return ((await heading.textContent()) || '').trim();
  }
  return '';
}

async function takeRouteScreenshot(page, roleKey, routeName) {
  const roleDir = path.join(SCREENSHOT_ROOT, roleKey);
  await fs.mkdir(roleDir, { recursive: true });
  const filePath = path.join(roleDir, `${routeName}.png`);
  await page.screenshot({ path: filePath, fullPage: true });
  return filePath;
}

function safePathname(url) {
  try {
    return new URL(url).pathname;
  } catch (error) {
    return String(url || '');
  }
}
