import { expect, test } from "@playwright/test";

test("public content and native FAQ remain readable with JavaScript disabled", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, baseURL, viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  try {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.locator("html")).toHaveAttribute("lang", "fa");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator("#features").getByRole("heading", { level: 2 })).toBeVisible();
    await expect(page.locator('a[href="/guide"]').first()).toBeVisible();
    await expect(page.locator('a[href="/privacy"]').first()).toBeVisible();
    const faq = page.locator("#questions details").first();
    await faq.locator("summary").focus();
    await page.keyboard.press("Enter");
    await expect(faq).toHaveAttribute("open", "");
    await expect(faq.locator("p")).toBeVisible();
  } finally {
    await context.close();
  }
});

test("mobile public navigation supports Escape and the illustration survives unavailable WebGL", async ({ page }) => {
  const uncaught: string[] = [];
  page.on("pageerror", (error) => uncaught.push(error.message));
  await page.setViewportSize({ width: 320, height: 780 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, kind: string, ...args: unknown[]) {
      if (/webgl/i.test(kind)) return null;
      return getContext.call(this, kind, ...args);
    } as typeof getContext;
  });
  await page.goto("/", { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  const menuButton = page.getByRole("button", { name: "باز کردن منو", exact: true });
  await menuButton.click();
  await expect(page.getByRole("navigation", { name: "ناوبری موبایل", exact: true })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("navigation", { name: "ناوبری موبایل", exact: true })).not.toBeVisible();
  await expect(menuButton).toBeFocused();
  await expect(page.locator('svg[viewBox="0 0 420 360"]')).toBeVisible();
  expect(uncaught).toEqual([]);
});
