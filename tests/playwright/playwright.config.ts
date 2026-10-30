import { defineConfig, devices } from '@playwright/test';
import { AUTH_FILE, BASE_URL } from './support/env';

const isCI = !!process.env.CI;
// Slows every browser action down (ms), to follow a headed run by eye.
const slowMo = Number(process.env.E2E_SLOWMO ?? 0);

export default defineConfig({
  testDir: './specs',
  testMatch: '**/*.e2e.ts',
  outputDir: './test-results',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  workers: isCI ? 2 : 4,
  reporter: isCI
    ? [['list'], ['html', { outputFolder: './playwright-report', open: 'never' }], ['github']]
    : [['list'], ['html', { outputFolder: './playwright-report', open: 'on-failure' }]],
  globalSetup: './support/global-setup.ts',
  globalTeardown: './support/global-teardown.ts',
  use: {
    ...devices['Desktop Chrome'],
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    launchOptions: { slowMo },
  },
  projects: [
    {
      name: 'setup',
      testMatch: 'setup/**/*.e2e.ts',
      workers: 1,
    },
    {
      name: 'chromium',
      testMatch: 'app/**/*.e2e.ts',
      dependencies: ['setup'],
      use: { storageState: AUTH_FILE },
    },
    {
      name: 'serial',
      testMatch: 'serial/**/*.e2e.ts',
      dependencies: ['chromium'],
      workers: 1,
      use: { storageState: AUTH_FILE },
    },
    {
      name: 'credentials',
      testMatch: 'credentials/**/*.e2e.ts',
      dependencies: ['serial'],
      workers: 1,
      use: { storageState: AUTH_FILE },
    },
  ],
});
