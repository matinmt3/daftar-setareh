import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from '@playwright/test';

const port = Number(process.env.WEB_TEST_PORT || 4410);
const origin = `http://127.0.0.1:${port}`;
const project = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const chrome = [process.env.PLAYWRIGHT_CHROME_PATH, process.platform === 'win32' ? join(process.env.ProgramFiles || 'C:\\Program Files', 'Google', 'Chrome', 'Application', 'chrome.exe') : undefined].find((path): path is string => Boolean(path && existsSync(path)));
export default defineConfig({
  testDir: '.',
  testMatch: 'app.spec.ts',
  outputDir: resolve(project, 'test-results/offline-web'),
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  forbidOnly: Boolean(process.env.CI),
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [['list'], ['html', { outputFolder: resolve(project, 'playwright-report/offline-web'), open: 'never' }], ['json', { outputFile: resolve(project, 'test-results/offline-web-results.json') }]],
  use: {
    baseURL: `${origin}/daftar-setareh/`,
    headless: true,
    locale: 'fa-IR',
    timezoneId: 'Asia/Tehran',
    viewport: { width: 1440, height: 1000 },
    actionTimeout: 12_000,
    navigationTimeout: 20_000,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    launchOptions: chrome ? { executablePath: chrome } : {},
  },
  webServer: {
    command: 'node scripts/serve-static-web.mjs',
    cwd: project,
    url: `${origin}/daftar-setareh/`,
    timeout: 30_000,
    reuseExistingServer: !process.env.CI,
    env: { STATIC_PORT: String(port) },
  },
});
