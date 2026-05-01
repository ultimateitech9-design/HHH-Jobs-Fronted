import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { test, expect } from '@playwright/test';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FRONTEND_ROOT = path.resolve(__dirname, '../..');
const WORKSPACE_ROOT = path.resolve(FRONTEND_ROOT, '..');
const BACKEND_ROOT = path.resolve(WORKSPACE_ROOT, 'HHH-JOBS-BACKEND-main');
const AUDIT_ROOT = path.resolve(WORKSPACE_ROOT, 'playwright-audit', 'commercial-role-plans');
const SCREENSHOT_ROOT = path.join(AUDIT_ROOT, 'screenshots');
const SUMMARY_PATH = path.join(AUDIT_ROOT, 'summary.json');
const BACKEND_ENV_PATH = path.join(BACKEND_ROOT, '.env');
const FRONTEND_ORIGIN = 'http://127.0.0.1:4173';
const API_BASE = process.env.E2E_API_BASE_URL || 'http://127.0.0.1:6004';

const backendRequire = createRequire(path.join(BACKEND_ROOT, 'package.json'));
const jwt = backendRequire('jsonwebtoken');

const backendEnv = parseEnvFile(await fs.readFile(BACKEND_ENV_PATH, 'utf8'));
const scenario = {
  users: {},
  tokens: {},
  coupon: null,
  purchases: [],
  subscriptions: [],
  createdAt: new Date().toISOString()
};

test.setTimeout(180_000);
test.describe.configure({ mode: 'serial' });

test.beforeAll(async () => {
  test.setTimeout(180_000);
  console.log('[commercial-role-plans] preparing audit scenario');
  await fs.mkdir(SCREENSHOT_ROOT, { recursive: true });
  await seedCommercialScenario();
  console.log('[commercial-role-plans] scenario seeded');
  await persistScenarioSummary();
});

test('admin can review coupon scope and approve commercial purchases', async ({ browser }) => {
  const page = await openRolePage(browser, 'admin');

  try {
    await page.goto('/portal/admin/payments', { waitUntil: 'domcontentloaded' });
    await waitForSettled(page);
    await expect(page.getByText('Commercial Role Plans', { exact: true })).toBeVisible();
    await expect(page.getByText('Commercial Plan Purchases', { exact: true })).toBeVisible();
    await expect(page.getByText(scenario.coupon.code, { exact: true })).toBeVisible();

    await takeScreenshot(page, 'admin', 'before-approval');

    for (const purchase of scenario.purchases) {
      const row = page.locator('tr').filter({ hasText: purchase.shortId }).first();
      await expect(row).toBeVisible();
      const approveButton = row.getByRole('button', { name: 'Approve', exact: true });
      if (await approveButton.isVisible().catch(() => false)) {
        await approveButton.click();
        await expect(row.getByText('paid', { exact: true })).toBeVisible({ timeout: 20_000 });
        purchase.status = 'paid';
      }
    }

    scenario.subscriptions = await fetchScenarioSubscriptions();
    await persistScenarioSummary();
    await waitForSettled(page);
    await takeScreenshot(page, 'admin', 'after-approval');
  } finally {
    await page.context().close();
  }
});

test('hr billing shows recruiter subscription and purchase history', async ({ browser }) => {
  const page = await openRolePage(browser, 'hr');

  try {
    await page.goto('/portal/hr/jobs', { waitUntil: 'domcontentloaded' });
    await waitForSettled(page);
    await page.getByRole('button', { name: /billing & credits/i }).click();
    await expect(page.getByText('Recruiter Plan Purchase History', { exact: true })).toBeVisible();
    await expect(page.getByText('Recruiter Plan Checkout', { exact: true })).toBeVisible();
    await expect(page.getByText(/HR Growth/i).first()).toBeVisible();
    await takeScreenshot(page, 'hr', 'billing');
  } finally {
    await page.context().close();
  }
});

test('campus connect dashboard shows active campus subscription flow', async ({ browser }) => {
  const page = await openRolePage(browser, 'campus_connect');

  try {
    await page.goto('/portal/campus-connect/dashboard', { waitUntil: 'domcontentloaded' });
    await waitForSettled(page);
    await expect(page.getByText('Placement workflow subscriptions', { exact: true })).toBeVisible();
    await expect(page.getByText('Activate Campus Plan', { exact: true })).toBeVisible();
    await expect(page.getByText('campus_growth', { exact: true }).first()).toBeVisible();
    await takeScreenshot(page, 'campus', 'dashboard');
  } finally {
    await page.context().close();
  }
});

test('student services shows student premium plan flow', async ({ browser }) => {
  const page = await openRolePage(browser, 'student');

  try {
    await page.goto('/portal/student/services', { waitUntil: 'domcontentloaded' });
    await waitForSettled(page);
    await expect(page.getByText('Premium plan checkout', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Request Student Plan', exact: true })).toBeVisible();
    await expect(page.getByText('student_pro', { exact: true }).first()).toBeVisible();
    await takeScreenshot(page, 'student', 'services');
  } finally {
    await page.context().close();
  }
});

test('sales portal shows commercial leads, customers, and coupons', async ({ browser }) => {
  const page = await openRolePage(browser, 'sales');

  try {
    await page.goto('/portal/sales/leads', { waitUntil: 'domcontentloaded' });
    await waitForSettled(page);
    await expect(page.getByRole('heading', { name: 'Leads', exact: true }).first()).toBeVisible();
    await takeScreenshot(page, 'sales', 'leads');

    await page.goto('/portal/sales/customers', { waitUntil: 'domcontentloaded' });
    await waitForSettled(page);
    await expect(page.getByRole('heading', { name: 'Customers', exact: true }).first()).toBeVisible();
    await expect(page.getByText(/Customers/i).first()).toBeVisible();
    await takeScreenshot(page, 'sales', 'customers');

    await page.goto('/portal/sales/coupons', { waitUntil: 'domcontentloaded' });
    await waitForSettled(page);
    await expect(page.getByRole('heading', { name: 'Coupons', exact: true }).first()).toBeVisible();
    await expect(page.getByText(scenario.coupon.code, { exact: true })).toBeVisible();
    await takeScreenshot(page, 'sales', 'coupons');
  } finally {
    await page.context().close();
  }
});

test('accounts portal shows subscription, transaction, and invoice records', async ({ browser }) => {
  const page = await openRolePage(browser, 'accounts');

  try {
    await page.goto('/portal/accounts/subscriptions', { waitUntil: 'domcontentloaded' });
    await waitForSettled(page);
    await expect(page.getByRole('heading', { name: 'Subscriptions', exact: true }).first()).toBeVisible();
    await takeScreenshot(page, 'accounts', 'subscriptions');

    await page.goto('/portal/accounts/transactions', { waitUntil: 'domcontentloaded' });
    await waitForSettled(page);
    await expect(page.getByRole('heading', { name: 'Transactions', exact: true }).first()).toBeVisible();
    await takeScreenshot(page, 'accounts', 'transactions');

    await page.goto('/portal/accounts/invoices', { waitUntil: 'domcontentloaded' });
    await waitForSettled(page);
    await expect(page.getByRole('heading', { name: 'Invoices', exact: true }).first()).toBeVisible();
    await takeScreenshot(page, 'accounts', 'invoices');
  } finally {
    await page.context().close();
  }
});

async function seedCommercialScenario() {
  console.log('[commercial-role-plans] resolving users');
  const usersByRole = await resolveUsersByRole();
  scenario.users = usersByRole;
  scenario.tokens = Object.fromEntries(Object.entries(usersByRole).map(([role, user]) => [role, signToken(user)]));

  const couponCode = `VISUAL${Date.now().toString().slice(-8)}`;
  console.log('[commercial-role-plans] creating coupon', couponCode);
  const coupon = await api('/sales/coupons', {
    method: 'POST',
    token: scenario.tokens.admin,
    body: {
      code: couponCode,
      discount_type: 'percent',
      discount_value: 15,
      max_uses: 50,
      valid_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      audience_roles: ['hr', 'campus_connect', 'student'],
      plan_slugs: ['hr_growth', 'campus_growth', 'student_pro'],
      assigned_to_sales_id: usersByRole.sales.id,
      min_amount: 0
    }
  });
  scenario.coupon = {
    id: coupon.coupon.id,
    code: coupon.coupon.code
  };

  const pendingPurchases = [];
  console.log('[commercial-role-plans] creating pending purchases');
  pendingPurchases.push(await createPendingPurchase('hr', {
    planSlug: 'hr_growth',
    quantity: 2,
    couponCode
  }));
  pendingPurchases.push(await createPendingPurchase('campus_connect', {
    planSlug: 'campus_growth',
    quantity: 1,
    couponCode
  }));
  pendingPurchases.push(await createPendingPurchase('student', {
    planSlug: 'student_pro',
    quantity: 1,
    couponCode
  }));

  scenario.purchases = pendingPurchases.map((purchase) => ({
    id: purchase.id,
    shortId: String(purchase.id).slice(-8).toUpperCase(),
    role: purchase.audience_role,
    planSlug: purchase.role_plan_slug,
    totalAmount: purchase.total_amount,
    status: purchase.status
  }));
}

async function resolveUsersByRole() {
  const preferredEmails = {
    admin: ['admin.demo@hhh-jobs.com', 'admin@hhh-jobs.com'],
    sales: ['sales.demo@hhh-jobs.com', 'sales@hhh-jobs.com'],
    accounts: ['accounts.demo@hhh-jobs.com', 'accounts@hhh-jobs.com'],
    hr: ['codex.hr.1777019373825@example.com', 'hr@eimager.com'],
    campus_connect: ['codex.campus.1777019373825@example.com', 'qa.campus.1777498914539@example.com'],
    student: ['qa.student.1777498914539@example.com', 'qa.student.1777498260552@example.com']
  };

  const users = {};
  for (const role of ['admin', 'sales', 'accounts', 'hr', 'campus_connect', 'student']) {
    const rows = await fetchUsersForRole(role);
    const selected = preferredEmails[role]
      .map((email) => rows.find((row) => row.email === email))
      .find(Boolean) || rows.find((row) => row.is_email_verified !== false);

    if (!selected) {
      throw new Error(`No active user found for role ${role}`);
    }

    users[role] = selected;
  }
  return users;
}

async function fetchUsersForRole(role) {
  const url = new URL(`${backendEnv.SUPABASE_URL}/rest/v1/users`);
  url.searchParams.set('select', 'id,email,role,name,status,is_hr_approved,is_email_verified,mobile');
  url.searchParams.set('role', `eq.${role}`);
  url.searchParams.set('status', 'eq.active');
  url.searchParams.set('order', 'created_at.desc');
  url.searchParams.set('limit', '20');

  const response = await fetch(url, {
    headers: {
      apikey: backendEnv.SUPABASE_SERVICE_ROLE_KEY || backendEnv.SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${backendEnv.SUPABASE_SERVICE_ROLE_KEY || backendEnv.SUPABASE_SERVICE_KEY}`
    }
  });

  if (!response.ok) {
    throw new Error(`Unable to resolve ${role} users (${response.status})`);
  }

  return response.json();
}

function signToken(user) {
  return jwt.sign({
    id: user.id,
    email: user.email,
    role: user.role,
    status: user.status,
    isHrApproved: user.is_hr_approved
  }, backendEnv.JWT_SECRET, { expiresIn: '7d' });
}

async function createPendingPurchase(role, { planSlug, quantity, couponCode }) {
  const result = await api('/pricing/role-plans/checkout', {
    method: 'POST',
    token: scenario.tokens[role],
    body: {
      planSlug,
      quantity,
      couponCode,
      paymentStatus: 'pending',
      provider: 'manual',
      note: `Visual audit seed for ${role}`
    }
  });

  return result.purchase;
}

async function api(endpoint, { method = 'GET', token = '', body } = {}) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: body ? JSON.stringify(body) : undefined
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.status === false) {
    throw new Error(payload.message || `Request failed for ${endpoint} (${response.status})`);
  }

  return payload;
}

async function fetchScenarioSubscriptions() {
  const subscriptions = [];

  for (const role of ['hr', 'campus_connect', 'student']) {
    const response = await api(`/pricing/role-subscriptions?userId=${scenario.users[role].id}`, {
      token: scenario.tokens.admin
    });
    subscriptions.push(...(response.subscriptions || []).map((subscription) => ({
      id: subscription.id,
      userId: subscription.user_id,
      role: subscription.audience_role,
      planSlug: subscription.role_plan_slug,
      status: subscription.status
    })));
  }

  return subscriptions;
}

async function persistScenarioSummary() {
  await fs.writeFile(SUMMARY_PATH, JSON.stringify({
    createdAt: scenario.createdAt,
    coupon: scenario.coupon,
    users: Object.fromEntries(Object.entries(scenario.users).map(([role, user]) => [role, {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name
    }])),
    purchases: scenario.purchases,
    subscriptions: scenario.subscriptions
  }, null, 2), 'utf8');
}

async function openRolePage(browser, role) {
  const user = scenario.users[role];
  const token = scenario.tokens[role];
  const context = await browser.newContext({
    storageState: {
      cookies: [],
      origins: [
        {
          origin: FRONTEND_ORIGIN,
          localStorage: [
            { name: 'job_portal_token', value: token },
            {
              name: 'job_portal_user',
              value: JSON.stringify({
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                status: user.status,
                isHrApproved: user.is_hr_approved,
                isEmailVerified: user.is_email_verified !== false
              })
            }
          ]
        }
      ]
    }
  });

  return context.newPage();
}

async function waitForSettled(page) {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForLoadState('networkidle', { timeout: 8_000 }).catch(() => {});
  await page.waitForTimeout(800);
}

async function takeScreenshot(page, role, name) {
  const targetDir = path.join(SCREENSHOT_ROOT, role);
  await fs.mkdir(targetDir, { recursive: true });
  await page.screenshot({
    path: path.join(targetDir, `${name}.png`),
    fullPage: true
  });
}

function parseEnvFile(source) {
  const entries = {};
  for (const rawLine of String(source || '').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const separatorIndex = line.indexOf('=');
    if (separatorIndex <= 0) continue;
    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();
    entries[key] = value;
  }
  return entries;
}
