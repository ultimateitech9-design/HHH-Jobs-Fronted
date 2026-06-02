import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  retries: 0,
  timeout: 90_000,
  expect: {
    timeout: 15_000
  },
  reporter: [['list']],
  use: {
    baseURL: process.env.PW_BASE_URL || 'http://127.0.0.1:5173',
    headless: true,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' }
    }
  ],
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 5173',
    url: process.env.PW_BASE_URL || 'http://127.0.0.1:5173',
    reuseExistingServer: true,
    timeout: 120_000
  }
});
