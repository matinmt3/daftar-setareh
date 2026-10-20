import { expect, test, type Page } from "@playwright/test";

function watchPageErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  return errors;
}

async function loginAsDemo(page: Page): Promise<void> {
  await page.goto("/auth", { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: "ورود به حساب نمایشی" }).click();
  await page.waitForURL("**/app", { timeout: 60_000 });
}

test("landing page loads with the product story", async ({ page }) => {
  const errors = watchPageErrors(page);
  await page.goto("/", { waitUntil: "domcontentloaded" });

  await expect(page.locator("h1").first()).toBeVisible();
  await expect(page.getByText("دفتر ستاره").first()).toBeVisible();
  await expect(
    page.getByRole("link", { name: /شروع|ورود|دفتر من/ }).first(),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test("demo login opens every main app page", async ({ page }) => {
  // This one journey visits eight routes; cold webpack compilation is cumulative.
  test.setTimeout(180_000);
  const errors = watchPageErrors(page);
  await loginAsDemo(page);

  await expect(page.locator("h1").first()).toBeVisible();
  await expect(page.getByRole("link", { name: "امروز", exact: true }).first()).toBeVisible();

  const pages: { path: string; heading: string }[] = [
    { path: "/app/reports", heading: "گزارش‌های من" },
    { path: "/app/reports/new?additional=1", heading: "افزودن مطالعهٔ امروز" },
    { path: "/app/exams", heading: "آزمون‌ها و نمره‌ها" },
    { path: "/app/cards", heading: "کارنامه‌های من" },
    { path: "/app/planner", heading: "برنامهٔ مطالعه" },
    { path: "/app/analytics", heading: "تحلیل روند" },
    { path: "/app/settings", heading: "تنظیمات" },
  ];

  for (const item of pages) {
    await page.goto(item.path, { waitUntil: "domcontentloaded" });
    await expect(
      page.getByRole("heading", { level: 1, name: item.heading }),
    ).toBeVisible();
    await expect(page.locator("text=خطای").first()).toHaveCount(0);
  }

  await page.goto("/app/cards", { waitUntil: "domcontentloaded" });
  const firstCard = page.locator('a[href^="/app/cards/"]').first();
  await expect(firstCard).toBeVisible();
  await firstCard.click();
  await expect(page.getByRole("button", { name: /چاپ/ }).first()).toBeVisible();
  await expect(page.locator("h1").first()).toBeVisible();

  expect(errors).toEqual([]);
});

test("planner opens the new session dialog and validates empty title", async ({ page }) => {
  const errors = watchPageErrors(page);
  await loginAsDemo(page);

  await page.goto("/app/planner", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "جلسهٔ تازه" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByRole("heading", { name: "جلسهٔ تازه" })).toBeVisible();

  await page.getByRole("button", { name: "افزودن جلسه" }).click();
  await expect(page.locator("#session-title-error")).toHaveText("عنوان جلسه را بنویس.");
  await expect(page.getByLabel("عنوان جلسه")).toHaveAttribute("aria-invalid", "true");
  expect(errors).toEqual([]);
});
