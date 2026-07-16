import { defineConfig } from '@playwright/test';
import process from 'node:process';

const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:4173';
const skipWebServer = /^(?:1|true)$/i.test(process.env.PLAYWRIGHT_SKIP_WEBSERVER || '');
const serverUrl = new URL(baseURL);
const serverPort = serverUrl.port || '4173';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  retries: 0,
  timeout: 60_000,
  expect: {
    timeout: 10_000
  },
  reporter: [
    ['list'],
    ['html', { open: 'never' }]
  ],
  use: {
    baseURL,
    headless: true,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' }
    },
    {
      name: 'chrome',
      use: { browserName: 'chromium', channel: 'chrome' }
    }
  ],
  webServer: skipWebServer
    ? undefined
    : {
        command: `npm run dev -- --host ${serverUrl.hostname} --port ${serverPort}`,
        url: baseURL,
        reuseExistingServer: true,
        timeout: 120_000
      }
});
