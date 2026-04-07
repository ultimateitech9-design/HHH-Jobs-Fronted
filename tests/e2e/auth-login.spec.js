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

  await expect(page.getByText('Invalid email or password', { exact: true })).toBeVisible();
  await expect(signInButton).toBeInViewport();
  await expect(forgotPasswordLink).toBeInViewport();

  await passwordField.fill('CorrectPassword123!');
  await signInButton.click();

  await expect.poll(() => loginAttempt).toBe(2);
});
