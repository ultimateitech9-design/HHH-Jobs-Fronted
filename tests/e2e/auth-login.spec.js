import { test, expect } from '@playwright/test';

test('login retry controls stay in viewport after an invalid password error', async ({ page }) => {
  let loginAttempt = 0;

  await page.route('**/auth/providers', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: true,
        providers: []
      })
    });
  });

  await page.route('**/auth/login', async (route) => {
    loginAttempt += 1;

    if (loginAttempt === 1) {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          status: false,
          message: 'Invalid email or password'
        })
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: true,
        token: 'test-token',
        user: {
          id: 'student-1',
          role: 'student',
          name: 'Retry Candidate',
          isEmailVerified: true
        },
        redirectTo: '/portal/student/dashboard'
      })
    });
  });

  await page.setViewportSize({ width: 1024, height: 600 });
  await page.goto('/login');

  const emailField = page.getByPlaceholder('you@example.com');
  const passwordField = page.getByPlaceholder('Enter your password');
  const signInButton = page.getByRole('button', { name: 'Sign In', exact: true });
  const forgotPasswordLink = page.getByRole('link', { name: 'Forgot password?' });

  await emailField.fill('retry@example.com');
  await passwordField.fill('WrongPassword123!');
  await signInButton.click();

  await expect(page.getByText('Wrong ID or password.', { exact: true })).toBeVisible();
  await expect(signInButton).toBeInViewport();
  await expect(forgotPasswordLink).toBeInViewport();

  await passwordField.fill('CorrectPassword123!');
  await signInButton.click();

  await expect.poll(() => loginAttempt).toBe(2);
});

test('invalid portal login clears stale session and stays on login instead of forbidden', async ({ browser }) => {
  const context = await browser.newContext({
    storageState: {
      cookies: [],
      origins: [
        {
          origin: 'http://127.0.0.1:4173',
          localStorage: [
            { name: 'job_portal_token', value: 'stale-student-token' },
            {
              name: 'job_portal_user',
              value: JSON.stringify({
                id: 'student-1',
                role: 'student',
                name: 'Stale Student',
                isEmailVerified: true
              })
            }
          ]
        }
      ]
    }
  });

  const page = await context.newPage();

  await page.route('**/auth/providers', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: true,
        providers: []
      })
    });
  });

  await page.route('**/auth/login', async (route) => {
    await route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({
        status: false,
        message: 'Invalid email or password'
      })
    });
  });

  try {
    await page.goto('/login');

    await page.getByPlaceholder('you@example.com').fill('wrong-admin@example.com');
    await page.getByPlaceholder('Enter your password').fill('WrongPassword123!');
    await page.getByRole('button', { name: 'Sign In', exact: true }).click();

    await expect(page.getByText('Wrong ID or password.', { exact: true })).toBeVisible();

    const storedToken = await page.evaluate(() => window.localStorage.getItem('job_portal_token'));
    const storedUser = await page.evaluate(() => window.localStorage.getItem('job_portal_user'));

    expect(storedToken).toBeNull();
    expect(storedUser).toBeNull();

    await page.goto('/portal/admin/dashboard');
    await expect(page).toHaveURL(/\/login$/);
    await expect(page).not.toHaveURL(/\/forbidden$/);
    await expect(page.getByRole('button', { name: 'Sign In', exact: true })).toBeVisible();
  } finally {
    await context.close();
  }
});

test('wrong portal credentials stay on login instead of opening forbidden', async ({ page }) => {
  await page.route('**/auth/providers', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: true,
        providers: []
      })
    });
  });

  await page.route('**/auth/login', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: true,
        token: 'super-admin-token',
        user: {
          id: 'super-admin-1',
          role: 'super_admin',
          name: 'Super Admin',
          isEmailVerified: true
        },
        redirectTo: '/portal/super-admin/dashboard'
      })
    });
  });

  await page.goto('/portal/admin/dashboard');
  await expect(page).toHaveURL(/\/login$/);

  await page.getByPlaceholder('you@example.com').fill('superadmin@example.com');
  await page.getByPlaceholder('Enter your password').fill('CorrectButWrongPortal123!');
  await page.getByRole('button', { name: 'Sign In', exact: true }).click();

  await expect(page).toHaveURL(/\/login$/);
  await expect(page).not.toHaveURL(/\/forbidden$/);
  await expect(page.getByText('Wrong ID or password.', { exact: true })).toBeVisible();

  const storedToken = await page.evaluate(() => window.localStorage.getItem('job_portal_token'));
  const storedUser = await page.evaluate(() => window.localStorage.getItem('job_portal_user'));

  expect(storedToken).toBeNull();
  expect(storedUser).toBeNull();
});
