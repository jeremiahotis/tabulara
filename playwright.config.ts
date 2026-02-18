import { defineConfig, devices } from '@playwright/test';
import process from 'node:process';

const baseURL = process.env.BASE_URL ?? 'http://127.0.0.1:4173';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  timeout: 60_000,
  expect: {
    timeout: 15_000,
  },
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'test-results/html-report', open: 'never' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
  ],
  use: {
    baseURL,
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  outputDir: 'test-results/artifacts',
  webServer: {
    command: 'npm run dev',
    url: baseURL,
    env: {
      ...process.env,
      HOST: '127.0.0.1',
      PORT: '4173',
      API_HOST: '127.0.0.1',
      API_PORT: '4174',
    },
    reuseExistingServer: true,
    timeout: 60_000,
  },
  projects: [
    {
      name: 'chromium-e2e',
      testMatch: /e2e\/.*\.spec\.ts$/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'api',
      testMatch: /api\/.*\.spec\.ts$/,
      use: {
        baseURL: process.env.API_URL ?? baseURL,
      },
    },
  ],
});
