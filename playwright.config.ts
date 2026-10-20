import { existsSync } from "node:fs";
import { join } from "node:path";
import { defineConfig, devices } from "@playwright/test";

const port = 3105;
const baseURL = `http://localhost:${port}`;

const systemChrome = [
  process.env.PLAYWRIGHT_CHROME_PATH,
  process.env.ProgramFiles && join(process.env.ProgramFiles, "Google", "Chrome", "Application", "chrome.exe"),
  process.env["ProgramFiles(x86)"] && join(process.env["ProgramFiles(x86)"], "Google", "Chrome", "Application", "chrome.exe"),
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
].find((candidate): candidate is string => Boolean(candidate && existsSync(candidate)));

const channel = process.env.PLAYWRIGHT_CHANNEL ?? (systemChrome ? "chrome" : undefined);

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [["list"]],
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL,
    locale: "fa-IR",
    viewport: { width: 1440, height: 960 },
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        locale: "fa-IR",
        ...(channel ? { channel } : {}),
      },
    },
  ],
  webServer: {
    command: `npm run dev -- --port ${port}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: {
      DATABASE_PATH: "./.data/e2e.db",
      AUTH_SECRET: "e2e-secret-that-is-long-enough-for-validation",
      SMS_PROVIDER: "console",
      DEMO_MODE: "true",
      CRON_SECRET: "e2e-cron-secret",
      NEXT_PUBLIC_APP_URL: baseURL,
    },
  },
});
