import { expect, test, type Locator, type Page } from "@playwright/test";

// Multi-step persistence checks also include first compilation in local dev QA.
test.setTimeout(120_000);

// Run only against the isolated Playwright database/mirror, never a personal account.
const tag = (label: string) => `${label} ${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

async function loginAsDemo(page: Page) {
  await page.goto("/auth", { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: "ورود به حساب نمایشی", exact: true }).click();
  await page.waitForURL("**/app");
}

async function confirmDelete(page: Page, trigger: Locator, title: string) {
  await trigger.click();
  const confirmation = page.getByRole("dialog", { name: title, exact: true });
  await expect(confirmation).toBeVisible();
  await confirmation.getByRole("button", { name: "بله، حذف کن", exact: true }).click();
  await expect(confirmation).not.toBeVisible();
}

async function createSession(page: Page, title: string) {
  await page.goto("/app/planner", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "جلسهٔ تازه", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "جلسهٔ تازه", exact: true });
  await dialog.getByLabel("عنوان جلسه").fill(title);
  await dialog.getByLabel("درس", { exact: true }).selectOption("");
  await dialog.getByText("نوع، اولویت و یادآور (اختیاری)", { exact: true }).click();
  await dialog.getByLabel("یادآور قبل از شروع (دقیقه)").fill("۰");
  await dialog.getByRole("button", { name: "افزودن جلسه", exact: true }).click();
  await expect(dialog).not.toBeVisible();
  const chip = page.getByTestId("study-session").filter({ hasText: title });
  await expect(chip).toBeVisible();
  return chip;
}

test("private routes redirect and unavailable SMS never promises to send a code", async ({ page }) => {
  await page.goto("/app/planner", { waitUntil: "domcontentloaded" });
  await expect(page).toHaveURL(/\/auth$/);
  const phone = page.getByLabel("شمارهٔ موبایل", { exact: true });
  const send = page.getByRole("button", { name: "دریافت کد تأیید", exact: true });
  if (await send.isDisabled()) {
    await expect(phone).toBeDisabled();
    await expect(page.locator("#phone-hint")).toContainText("ورود با پیامک در این نسخه فعال نیست");
  } else {
    await phone.fill("۱۲۳");
    await send.click();
    await expect(page.locator("#auth-error").getByRole("alert")).toContainText("شمارهٔ موبایل معتبر نیست");
    await expect(phone).toHaveAttribute("aria-invalid", "true");
  }
  await expect(page.getByRole("button", { name: "ورود به حساب نمایشی", exact: true })).toBeEnabled();
  await expect(page.getByLabel("کد تأیید ۶ رقمی", { exact: true })).toHaveCount(0);
});

test("report creates Persian-digit study time and a subjectless task, edits after reload, then deletes", async ({ page }) => {
  const marker = tag("گزارش بررسی");
  await loginAsDemo(page);
  await page.goto("/app/reports/new?additional=1", { waitUntil: "domcontentloaded" });
  const minutes = page.getByRole("textbox", { name: /^دقیقهٔ مطالعه / }).first();
  for (const invalid of ["-30", "1.5"]) {
    await minutes.fill(invalid);
    await expect(minutes).toHaveValue(invalid);
    await page.getByRole("button", { name: "ثبت گزارش", exact: true }).click();
    await expect(minutes).toHaveAttribute("aria-invalid", "true");
    await expect(minutes).toBeFocused();
    await expect(page).toHaveURL(/\/app\/reports\/new/);
  }
  await minutes.fill("۴۵");
  await expect(minutes).toHaveValue("45");
  await page.getByRole("button", { name: "افزودن کار", exact: true }).click();
  await page.getByRole("textbox", { name: "عنوان کار", exact: true }).fill(marker);
  await page.getByRole("combobox", { name: "درس کار", exact: true }).selectOption("");
  await page.getByRole("button", { name: "باقی‌مانده", exact: true }).click();
  await page.getByLabel("یک جمله دربارهٔ امروز").fill(marker);
  await page.getByRole("button", { name: "ثبت گزارش", exact: true }).filter({ visible: true }).click();
  await page.waitForURL((url) => /^\/app\/reports\/[0-9a-f-]{36}$/.test(url.pathname));
  const detail = page.url();
  await page.reload();
  await expect(page.getByText(marker, { exact: true }).first()).toBeVisible();
  await expect(page.getByText("۴۵ دقیقه", { exact: true }).first()).toBeVisible();
  await page.getByRole("link", { name: "ویرایش", exact: true }).click();
  await expect(page.getByRole("textbox", { name: /^دقیقهٔ مطالعه / }).first()).toHaveValue("45");
  await page.getByRole("textbox", { name: /^دقیقهٔ مطالعه / }).first().fill("٦٠");
  await page.getByLabel("یک جمله دربارهٔ امروز").fill(`${marker} ویرایش‌شده`);
  await page.getByRole("button", { name: "ذخیرهٔ تغییرات", exact: true }).filter({ visible: true }).click();
  await page.waitForURL(detail);
  await page.reload();
  await expect(page.getByText(`${marker} ویرایش‌شده`, { exact: true })).toBeVisible();
  await expect(page.getByText("۱ ساعت", { exact: true }).first()).toBeVisible();
  await confirmDelete(page, page.getByRole("button", { name: "حذف", exact: true }).first(), "حذف گزارش روزانه؟");
  await expect(page).toHaveURL(/\/app\/reports$/);
  await expect(page.getByText(`${marker} ویرایش‌شده`, { exact: true })).toHaveCount(0);
});

test("planner persists a subjectless session, completion, edits and deletion", async ({ page }) => {
  const title = tag("جلسه بررسی");
  await loginAsDemo(page);
  let chip = await createSession(page, title);
  await chip.getByRole("button", { name: "علامت‌زدن به‌عنوان انجام‌شده", exact: true }).click();
  await expect(chip.getByRole("button", { name: "برگرداندن به حالت انجام‌نشده", exact: true })).toHaveAttribute("aria-pressed", "true");
  await page.reload();
  chip = page.getByTestId("study-session").filter({ hasText: title });
  await expect(chip.getByRole("button", { name: "برگرداندن به حالت انجام‌نشده", exact: true })).toBeVisible();
  await chip.getByRole("button", { name: `ویرایش ${title}`, exact: true }).click();
  const editor = page.getByRole("dialog", { name: "ویرایش جلسه", exact: true });
  await expect(editor.getByLabel("یادآور قبل از شروع (دقیقه)")).toHaveValue("0");
  await editor.getByLabel("عنوان جلسه").fill(`${title} ویرایش`);
  await editor.getByLabel("ساعت شروع").fill("23:30");
  await expect(editor.getByLabel("ساعت پایان")).toHaveValue("23:59");
  await editor.getByRole("button", { name: "ذخیره", exact: true }).click();
  await expect(editor).not.toBeVisible();
  await page.reload();
  chip = page.getByTestId("study-session").filter({ hasText: `${title} ویرایش` });
  await chip.getByRole("button", { name: `ویرایش ${title} ویرایش`, exact: true }).click();
  await confirmDelete(page, page.getByRole("dialog", { name: "ویرایش جلسه", exact: true }).getByRole("button", { name: "حذف", exact: true }), "حذف این جلسه؟");
  await expect(page.getByTestId("study-session").filter({ hasText: title })).toHaveCount(0);
});

test("a failed completion request rolls back and a failed save preserves editable input", async ({ page }) => {
  const title = tag("جلسه خطای شبکه");
  await loginAsDemo(page);
  const chip = await createSession(page, title);
  let holdSave = false;
  let markStarted: () => void = () => {};
  let releaseSave: () => void = () => {};
  const started = new Promise<void>((resolve) => { markStarted = resolve; });
  const release = new Promise<void>((resolve) => { releaseSave = resolve; });
  await page.route("**/app/planner*", async (route) => {
    if (route.request().method() === "POST") {
      if (holdSave) { markStarted(); await release; }
      return route.abort("failed");
    }
    return route.continue();
  });
  await chip.getByRole("button", { name: "علامت‌زدن به‌عنوان انجام‌شده", exact: true }).click();
  await expect(page.getByRole("alert").filter({ hasText: "تغییر وضعیت انجام نشد" })).toBeVisible();
  await expect(chip.getByRole("button", { name: "علامت‌زدن به‌عنوان انجام‌شده", exact: true })).toHaveAttribute("aria-pressed", "false");
  await chip.getByRole("button", { name: `ویرایش ${title}`, exact: true }).click();
  const editor = page.getByRole("dialog", { name: "ویرایش جلسه", exact: true });
  await editor.getByLabel("عنوان جلسه").fill(`${title} حفظ‌شده`);
  holdSave = true;
  await editor.getByRole("button", { name: "ذخیره", exact: true }).click();
  await started;
  await expect(editor.getByRole("button", { name: "بستن", exact: true })).toBeDisabled();
  await page.keyboard.press("Escape");
  await expect(editor).toBeVisible();
  releaseSave();
  await expect(editor.getByRole("alert")).toContainText("ارتباط با سرور برقرار نشد");
  await expect(editor.getByLabel("عنوان جلسه")).toHaveValue(`${title} حفظ‌شده`);
  await expect(editor.getByRole("button", { name: "ذخیره", exact: true })).toBeEnabled();
  await page.unroute("**/app/planner*");
  await confirmDelete(page, editor.getByRole("button", { name: "حذف", exact: true }), "حذف این جلسه؟");
});

test("exam validation, missing grade, Persian decimal update and confirmed deletion persist", async ({ page }) => {
  const title = tag("آزمون بررسی");
  await loginAsDemo(page);
  await page.goto("/app/exams", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "آزمون تازه", exact: true }).click();
  let dialog = page.getByRole("dialog", { name: "ثبت آزمون تازه", exact: true });
  await dialog.getByLabel("عنوان آزمون").fill(title);
  await dialog.getByLabel("نمرهٔ کل").fill("۲۰");
  await dialog.getByLabel("نمره", { exact: true }).fill("۲۱");
  await dialog.getByRole("button", { name: "ثبت آزمون", exact: true }).click();
  await expect(dialog.locator("#exam-grade-error")).toHaveText("نمره نمی‌تواند از نمرهٔ کل بیشتر باشد.");
  await expect(dialog.getByLabel("نمره", { exact: true })).toHaveAttribute("aria-invalid", "true");
  await dialog.getByLabel("نمره", { exact: true }).fill("");
  await dialog.getByRole("button", { name: "ثبت آزمون", exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await page.reload();
  let row = page.locator("article").filter({ hasText: title });
  await expect(row.getByText("در انتظار نمره", { exact: true })).toBeVisible();
  await row.getByRole("button", { name: `ویرایش ${title}`, exact: true }).click();
  dialog = page.getByRole("dialog", { name: "ویرایش آزمون", exact: true });
  await dialog.getByLabel("نمره", { exact: true }).fill("۱۸٫۵");
  await expect(dialog.getByText(/پیش‌نمایش:/)).toBeVisible();
  await dialog.getByRole("button", { name: "ذخیرهٔ تغییرات", exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await page.reload();
  row = page.locator("article").filter({ hasText: title });
  await expect(row.getByText("در انتظار نمره", { exact: true })).toHaveCount(0);
  await expect(row).toContainText("۱۸٫۵");
  await row.getByRole("button", { name: "حذف", exact: true }).click();
  let confirmation = page.getByRole("dialog", { name: "حذف آزمون؟", exact: true });
  await confirmation.getByRole("button", { name: "انصراف", exact: true }).click();
  await expect(row).toBeVisible();
  await confirmDelete(page, row.getByRole("button", { name: "حذف", exact: true }), "حذف آزمون؟");
  await expect(row).toHaveCount(0);
});

test("goals support an open end date, pause/restore, edit and delete", async ({ page }) => {
  const title = tag("هدف بررسی");
  await loginAsDemo(page);
  await page.goto("/app/planner", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "هدف تازه", exact: true }).click();
  let dialog = page.getByRole("dialog", { name: "هدف تازه", exact: true });
  await dialog.getByLabel("عنوان هدف").fill(title);
  await dialog.getByLabel("مقدار هدف").fill("۶۰");
  await dialog.getByRole("button", { name: "ساختن هدف", exact: true }).click();
  await expect(dialog).not.toBeVisible();
  let row = page.getByTestId("study-goal").filter({ hasText: title });
  await row.getByRole("button", { name: "توقف هدف", exact: true }).click();
  await expect(row).toContainText("متوقف");
  await page.reload();
  row = page.getByTestId("study-goal").filter({ hasText: title });
  await row.getByRole("button", { name: "فعال‌کردن هدف", exact: true }).click();
  await expect(row.getByRole("button", { name: "توقف هدف", exact: true })).toBeVisible();
  await row.getByRole("button", { name: `ویرایش ${title}`, exact: true }).click();
  dialog = page.getByRole("dialog", { name: "ویرایش هدف", exact: true });
  await dialog.getByLabel("عنوان هدف").fill(`${title} ویرایش`);
  await dialog.getByRole("button", { name: "ذخیرهٔ هدف", exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await page.reload();
  row = page.getByTestId("study-goal").filter({ hasText: `${title} ویرایش` });
  await confirmDelete(page, row.getByRole("button", { name: "حذف", exact: true }), "حذف این هدف؟");
  await expect(row).toHaveCount(0);
});

test("Persian subject editor persists create/edit/archive/restore/delete", async ({ page }) => {
  const title = tag("درس بررسی");
  await loginAsDemo(page);
  await page.goto("/app/settings#subjects", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "درس‌های من", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "درس تازه", exact: true }).click();
  let dialog = page.getByRole("dialog", { name: "درس تازه", exact: true });
  await dialog.getByLabel("نام درس").fill(title);
  await dialog.getByRole("button", { name: "افزودن درس", exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await page.reload();
  let row = page.getByTestId("subject-card").filter({ hasText: title });
  await row.getByRole("button", { name: `ویرایش ${title}`, exact: true }).click();
  dialog = page.getByRole("dialog", { name: "ویرایش درس", exact: true });
  await dialog.getByLabel("نام درس").fill(`${title} نو`);
  await dialog.getByRole("button", { name: "ذخیره", exact: true }).click();
  await expect(dialog).not.toBeVisible();
  row = page.getByTestId("subject-card").filter({ hasText: `${title} نو` });
  await row.getByRole("button", { name: `بایگانی ${title} نو`, exact: true }).click();
  await expect(row.getByRole("button", { name: "بازگردانی", exact: true })).toBeVisible();
  await page.reload();
  row = page.getByTestId("subject-card").filter({ hasText: `${title} نو` });
  await row.getByRole("button", { name: "بازگردانی", exact: true }).click();
  await expect(row.getByRole("button", { name: `ویرایش ${title} نو`, exact: true })).toBeVisible();
  await confirmDelete(page, row.getByRole("button", { name: "حذف", exact: true }), "حذف این درس؟");
  await expect(row).toHaveCount(0);

  const usedSubject = page.getByTestId("subject-card").filter({ has: page.getByText("ریاضی", { exact: true }) });
  await usedSubject.getByRole("button", { name: "حذف", exact: true }).click();
  const blockedDelete = page.getByRole("dialog", { name: "حذف این درس؟", exact: true });
  await blockedDelete.getByRole("button", { name: "بله، حذف کن", exact: true }).click();
  await expect(blockedDelete.getByRole("alert")).toContainText("به‌جای حذف، آن را بایگانی کن");
  await blockedDelete.getByRole("button", { name: "انصراف", exact: true }).click();
  await expect(usedSubject).toBeVisible();
});

test("settings save Persian numeric values and the disabled reminder preference survives reload", async ({ page }) => {
  await loginAsDemo(page);
  await page.goto("/app/settings", { waitUntil: "domcontentloaded" });
  const goal = page.getByLabel("هدف مطالعهٔ روزانه (دقیقه)");
  const lead = page.getByLabel("چند دقیقه قبل؟");
  const enabled = page.getByRole("checkbox", { name: "یادآور درون‌برنامه‌ای روشن باشد", exact: true });
  const previousGoal = await goal.inputValue();
  const previousLead = await lead.inputValue();
  const previousEnabled = await enabled.isChecked();
  await goal.fill("۹۰");
  await lead.fill("٠");
  await enabled.uncheck();
  await page.getByRole("button", { name: "ذخیرهٔ تنظیمات", exact: true }).click();
  await expect(page.getByRole("status").filter({ hasText: "تنظیمات ذخیره شد" })).toBeVisible();
  await page.reload();
  await expect(goal).toHaveValue("90");
  await expect(lead).toHaveValue("0");
  await expect(enabled).not.toBeChecked();
  await goal.fill(previousGoal);
  await lead.fill(previousLead);
  await enabled.setChecked(previousEnabled);
  await page.getByRole("button", { name: "ذخیرهٔ تنظیمات", exact: true }).click();
  await expect(page.getByRole("status").filter({ hasText: "تنظیمات ذخیره شد" })).toBeVisible();
});

test("320px planner keeps page/dialog/calendar inside viewport with Escape and focus return", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await loginAsDemo(page);
  await page.goto("/app/planner", { waitUntil: "domcontentloaded" });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  const trigger = page.getByRole("button", { name: "جلسهٔ تازه", exact: true });
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "جلسهٔ تازه", exact: true });
  const box = await dialog.boundingBox();
  expect(box && box.x >= 0 && box.x + box.width <= 321).toBe(true);
  await dialog.getByLabel("تاریخ").click();
  const calendar = page.getByRole("dialog").filter({ has: page.getByRole("button", { name: "ماه قبل", exact: true }) });
  const calendarBox = await calendar.boundingBox();
  expect(calendarBox && calendarBox.x >= 0 && calendarBox.x + calendarBox.width <= 321).toBe(true);
  await page.keyboard.press("Escape");
  await expect(calendar).not.toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await page.getByRole("navigation", { name: "ناوبری اصلی", exact: true }).getByRole("link", { name: "آزمون‌ها", exact: true }).click();
  await expect(page).toHaveURL(/\/app\/exams$/);
});


test("today has one study action and mobile More exposes every secondary destination", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.setViewportSize({ width: 390, height: 844 });
  await loginAsDemo(page);
  await expect(page.getByRole("heading", { level: 1, name: "امروز", exact: true })).toBeVisible();
  const study = page.getByRole("link", { name: "ثبت مطالعه", exact: true });
  await expect(study).toHaveCount(1);
  await expect(study).toHaveAttribute("href", "/app/reports/new?additional=1");
  await study.click();
  await expect(page.getByRole("heading", { level: 1, name: "افزودن مطالعهٔ امروز", exact: true })).toBeVisible();
  await expect(page.getByText("این روز قبلاً ثبت شده است")).toHaveCount(0);
  const notes = page.getByText("یادداشت‌های بیشتر (اختیاری)", { exact: true });
  await expect(page.getByLabel("هدف فردا")).not.toBeVisible();
  await notes.click();
  await expect(page.getByLabel("هدف فردا")).toBeVisible();
  const more = page.getByRole("navigation", { name: "ناوبری اصلی", exact: true }).getByRole("button", { name: "بیشتر", exact: true });
  await more.click();
  let dialog = page.getByRole("dialog", { name: "بخش‌های دیگر", exact: true });
  await expect(dialog.getByRole("link", { name: "کارنامه‌ها", exact: true })).toBeVisible();
  await expect(dialog.getByRole("link", { name: "تحلیل پیشرفت", exact: true })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(more).toBeFocused();
  await more.click();
  dialog = page.getByRole("dialog", { name: "بخش‌های دیگر", exact: true });
  await dialog.getByRole("link", { name: "تنظیمات و درس‌ها", exact: true }).click();
  await expect(page).toHaveURL(/\/app\/settings$/);
  await expect(dialog).not.toBeVisible();
  expect(errors).toEqual([]);
});

test("all app screens stay readable inside mobile, tablet and desktop viewports", async ({ page }, testInfo) => {
  test.setTimeout(180_000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await loginAsDemo(page);
  const screens = [
    ["today", "/app"], ["study", "/app/reports/new?additional=1"],
    ["planner", "/app/planner"], ["exams", "/app/exams"],
    ["cards", "/app/cards"], ["analytics", "/app/analytics"], ["settings", "/app/settings"],
  ];
  for (const width of [320, 768, 1440]) {
    await page.setViewportSize({ width, height: 960 });
    for (const [label, route] of screens) {
      await page.goto(route, { waitUntil: "networkidle" });
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${label} at ${width}px must not overflow`).toBe(true);
      if (width === 320 || width === 1440) {
        const screenshot = testInfo.outputPath(`${label}-${width}.png`);
        await page.screenshot({ path: screenshot, fullPage: true, animations: "disabled" });
        await testInfo.attach(`${label}-${width}`, { path: screenshot, contentType: "image/png" });
      }
    }
  }
  expect(errors).toEqual([]);
});
