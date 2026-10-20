import { readFile } from 'node:fs/promises';
import { expect, test, type Page } from '@playwright/test';
import type { Notebook } from '../core';

const key = 'daftar-setareh-offline:v1';
const profileName = 'دانش‌آموز آزمون وب';
const notebook = async (page: Page): Promise<Notebook> => page.evaluate(storageKey => JSON.parse(localStorage.getItem(storageKey) ?? 'null'), key);
const rawStorage = async (page: Page): Promise<string | null> => page.evaluate(storageKey => localStorage.getItem(storageKey), key);
async function start(page: Page) {
  await page.goto('./');
  await page.getByLabel('نامت چیست؟', { exact: true }).fill(profileName);
  await page.getByRole('button', { name: 'ساخت دفتر من', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText(profileName);
}
async function go(page: Page, screen: string) { await page.goto(`./#${screen}`); await expect(page.locator('.app-shell')).toBeVisible(); }
async function openStudy(page: Page) { await go(page, 'today'); await page.getByRole('button', { name: 'ثبت مطالعه', exact: true }).click(); return page.getByRole('dialog'); }
async function study(page: Page, amount = '۴۵', reflection = 'تمرین خوب پیش رفت.') {
  const dialog = await openStudy(page); await dialog.getByLabel('زمان درس ۱', { exact: true }).fill(amount); await dialog.getByLabel('امروز چطور گذشت؟ (اختیاری)', { exact: true }).fill(reflection); await dialog.getByRole('button', { name: 'ذخیرهٔ مطالعه', exact: true }).click(); await expect(dialog).not.toBeVisible();
}
async function exam(page: Page, title: string, grade: string, weight = '', subject = 'ریاضی') {
  await go(page, 'exams'); await page.getByRole('button', { name: 'آزمون تازه', exact: true }).click(); const dialog = page.getByRole('dialog');
  await dialog.getByLabel('عنوان آزمون', { exact: true }).fill(title); await dialog.getByRole('combobox', { name: 'درس', exact: true }).selectOption({ label: subject }); await dialog.getByLabel('نمرهٔ کسب‌شده', { exact: false }).fill(grade);
  if (weight) { await dialog.locator('.form-details>summary').click(); await dialog.getByLabel('ضریب آزمون', { exact: false }).fill(weight); }
  await dialog.getByRole('button', { name: 'ذخیرهٔ آزمون', exact: true }).click(); await expect(dialog).not.toBeVisible();
}
async function upload(page: Page, value: unknown, filename = 'qa-notebook.json') {
  await page.locator('input[type=file]').setInputFiles({ name: filename, mimeType: 'application/json', buffer: Buffer.from(typeof value === 'string' ? value : JSON.stringify(value), 'utf8') });
}
function envelope(data: Notebook) { return { app: 'daftar-setareh-offline', version: 1, exportedAt: new Date().toISOString(), data }; }
async function chooseISO(page: Page, selector: string, iso: string) {
  const parts = new Intl.DateTimeFormat('en-US-u-ca-persian', { year: 'numeric', month: 'numeric', day: 'numeric' }).formatToParts(new Date(`${iso}T12:00:00`));
  const part = (name: string) => Number(parts.find(p => p.type === name)?.value);
  const wrapper = page.locator(selector); await wrapper.locator('.date-picker>summary').click(); await wrapper.locator('.calendar-jump select').nth(1).selectOption(String(part('year'))); await wrapper.locator('.calendar-jump select').nth(0).selectOption(String(part('month')));
  const number = String(part('day')).replace(/\d/g, digit => '۰۱۲۳۴۵۶۷۸۹'[Number(digit)]); await wrapper.locator('.calendar-grid>button:not(.outside)').filter({ hasText: new RegExp(`^${number}$`) }).click();
}

test('empty onboarding is local, creates only a profile/subjects and survives reload', async ({ page }) => {
  await page.goto('./'); await expect(page.getByRole('heading', { name: 'روزت را ساده‌تر بچین.' })).toBeVisible(); await expect(page.getByRole('link', { name: 'حریم خصوصی', exact: true })).toBeVisible();
  await start(page); const data = await notebook(page); expect(data.profile).toHaveLength(1); expect(data.subjects.length).toBeGreaterThan(0); expect(data.reports).toEqual([]); expect(data.exams).toEqual([]); expect(data.sessions).toEqual([]);
  await page.reload(); await expect(page.getByRole('heading', { level: 1 })).toContainText(profileName); await expect(page.getByRole('heading', { name: 'دفترت منتظر اولین خط است' })).toBeVisible();
});

test('study rejects negative/fractional minutes, accepts Persian minutes and edits/deletes with cancellation', async ({ page }) => {
  await start(page); const dialog = await openStudy(page);
  for (const invalid of ['-30', '۱٫۵']) { await dialog.getByLabel('زمان درس ۱', { exact: true }).fill(invalid); await dialog.getByRole('button', { name: 'ذخیرهٔ مطالعه', exact: true }).click(); await expect(dialog.getByRole('alert')).toContainText('زمان مطالعه'); expect((await notebook(page)).reports).toHaveLength(0); }
  await dialog.getByLabel('زمان درس ۱', { exact: true }).fill('۴۵'); await dialog.getByLabel('امروز چطور گذشت؟ (اختیاری)', { exact: true }).fill('QA نگه‌داری مطالعه'); await dialog.getByRole('button', { name: 'ذخیرهٔ مطالعه' }).click(); await expect(dialog).not.toBeVisible();
  await page.getByRole('button', { name: /^ویرایش گزارش / }).click(); await page.getByRole('dialog').getByLabel('زمان درس ۱', { exact: true }).fill('۶۰'); await page.getByRole('dialog').getByRole('button', { name: 'ذخیرهٔ مطالعه' }).click(); expect((await notebook(page)).reports[0].subjects[0].minutes).toBe(60);
  await page.getByRole('button', { name: /^حذف گزارش / }).click(); await page.getByRole('dialog').getByRole('button', { name: 'انصراف' }).click(); expect((await notebook(page)).reports).toHaveLength(1);
  await page.getByRole('button', { name: /^حذف گزارش / }).click(); await page.getByRole('dialog').getByRole('button', { name: 'بله، حذف شود' }).click(); expect((await notebook(page)).reports).toHaveLength(0);
});

test('study supports multiple lessons, completed/pending tasks and saved reflection details', async ({ page }) => {
  await start(page); const dialog = await openStudy(page); await dialog.getByLabel('زمان درس ۱', { exact: true }).fill('۳۰'); await dialog.getByRole('button', { name: 'درس دیگر' }).click(); await dialog.getByLabel('زمان درس ۲', { exact: true }).fill('۱۵');
  await dialog.locator('.form-details>summary').click(); await dialog.getByRole('button', { name: 'افزودن کار' }).click(); await dialog.getByLabel('عنوان کار ۱', { exact: true }).fill('حل ده تمرین'); await dialog.getByLabel('کار ۱ انجام شد', { exact: true }).check(); await dialog.getByRole('button', { name: 'افزودن کار' }).click(); await dialog.getByLabel('عنوان کار ۲', { exact: true }).fill('مرور واژه‌ها'); await dialog.getByLabel('کجا به کمک نیاز داری؟', { exact: true }).fill('مسئله‌های فصل دوم'); await dialog.getByLabel('قدم بعدی برای فردا', { exact: true }).fill('پرسش از دبیر'); await dialog.getByRole('button', { name: 'ذخیرهٔ مطالعه' }).click(); await expect(dialog).not.toBeVisible();
  const data = await notebook(page); expect(data.reports[0].subjects.map(row => row.minutes)).toEqual([30, 15]); expect(new Set(data.reports[0].subjects.map(row => row.subjectId)).size).toBe(2); expect(data.reports[0].tasks.map(task => task.completed)).toEqual([true, false]);
  await page.locator('.record-details>summary').click(); await expect(page.getByText('مسئله‌های فصل دوم', { exact: true })).toBeVisible(); await page.getByLabel('مرور واژه‌ها', { exact: true }).check(); expect((await notebook(page)).reports[0].tasks.every(task => task.completed)).toBe(true);
});

test('a Jalali date can be chosen directly with month/year controls and stored as valid ISO', async ({ page }) => {
  await start(page); const dialog = await openStudy(page); await dialog.locator('.date-picker>summary').click(); await dialog.getByRole('combobox', { name: 'سال تاریخ', exact: true }).selectOption('1404'); await dialog.getByRole('combobox', { name: 'ماه تاریخ', exact: true }).selectOption('1'); await dialog.getByRole('button', { name: /جمعه ۱ فروردین ۱۴۰۴/ }).click(); await expect(dialog.locator('input[name=date]')).toHaveValue('2025-03-21'); await expect(dialog.locator('.date-picker>summary')).toContainText('۱۴۰۴'); expect(await dialog.locator('.date-picker>summary').innerText()).not.toMatch(/[0-9]/);
  await dialog.getByRole('button', { name: 'ذخیرهٔ مطالعه' }).click(); expect((await notebook(page)).reports[0].date).toBe('2025-03-21');
});

test('weighted grades include real zero, ignore ungraded exams and average equally across subjects', async ({ page }) => {
  await start(page); await exam(page, 'QA صفر', '۰', '۱'); await exam(page, 'QA کامل', '۲۰', '۳'); await exam(page, 'QA اعلام نشده', '', '۱۰'); await exam(page, 'QA علوم', '۱۰', '', 'علوم تجربی');
  await go(page, 'progress'); const stats = page.locator('.stats-strip').first(); await expect(stats).toContainText('۱۲٫۵ از ۲۰'); await expect(stats).toContainText('۳ آزمون نمره‌دار');
  await go(page, 'exams'); await page.getByRole('button', { name: 'ویرایش QA صفر', exact: true }).click(); await page.getByRole('dialog').getByLabel('نمرهٔ کسب‌شده', { exact: false }).fill('۱۰'); await page.getByRole('dialog').getByRole('button', { name: 'ذخیرهٔ آزمون' }).click(); expect((await notebook(page)).exams.find(e => e.title === 'QA صفر')?.grade).toBe(10);
  await page.getByRole('button', { name: 'حذف QA علوم', exact: true }).click(); await page.getByRole('dialog').getByRole('button', { name: 'بله، حذف شود' }).click(); expect((await notebook(page)).exams).toHaveLength(3);
});

test('percentage exams and invalid grade ranges are handled explicitly', async ({ page }) => {
  await start(page); await go(page, 'exams'); await page.getByRole('button', { name: 'آزمون تازه' }).click(); const dialog = page.getByRole('dialog'); await dialog.getByLabel('عنوان آزمون', { exact: true }).fill('QA درصد'); await dialog.getByLabel('ورود نمره به درصد', { exact: true }).check(); await dialog.getByLabel('درصد کسب‌شده', { exact: false }).fill('۱۰۱'); await dialog.getByRole('button', { name: 'ذخیرهٔ آزمون' }).click(); await expect(dialog.getByRole('alert')).toContainText('نمره'); expect((await notebook(page)).exams).toHaveLength(0);
  await dialog.getByLabel('درصد کسب‌شده', { exact: false }).fill('۸۲٫۵'); await dialog.getByRole('button', { name: 'ذخیرهٔ آزمون' }).click(); const record = (await notebook(page)).exams[0]; expect(record.maxGrade).toBe(100); expect(record.grade).toBe(82.5);
});

test('planner uses the selected day, persists completion without double-counting study and edits/deletes', async ({ page }) => {
  await start(page); await go(page, 'plan'); await page.getByRole('button', { name: 'هفتهٔ بعد', exact: true }).click(); await page.getByRole('button', { name: 'برنامهٔ تازه', exact: true }).click(); const dialog = page.getByRole('dialog'); const selected = await dialog.locator('input[name=date]').inputValue(); await dialog.getByLabel('قرار است چه کاری انجام دهی؟', { exact: true }).fill('QA تمرین فردا'); await dialog.getByRole('button', { name: 'ذخیرهٔ برنامه' }).click(); expect((await notebook(page)).sessions[0].date).toBe(selected);
  await page.getByRole('button', { name: 'انجام QA تمرین فردا', exact: true }).click(); let data = await notebook(page); expect(data.sessions[0].completed).toBe(true); expect(data.reports).toHaveLength(0);
  await page.getByRole('button', { name: 'ویرایش QA تمرین فردا', exact: true }).click(); await page.getByRole('dialog').getByLabel('مدت (دقیقه)', { exact: true }).fill('۶۰'); await page.getByRole('dialog').getByRole('button', { name: 'ذخیرهٔ برنامه' }).click(); data = await notebook(page); expect(data.sessions[0].duration).toBe(60);
  await page.getByRole('button', { name: 'حذف QA تمرین فردا', exact: true }).click(); await page.getByRole('dialog').getByRole('button', { name: 'بله، حذف شود' }).click(); expect((await notebook(page)).sessions).toHaveLength(0);
});

test('recurring planning is bounded and a whole series is removed only after explicit selection', async ({ page }) => {
  await start(page); await go(page, 'plan'); await page.getByRole('button', { name: 'برنامهٔ تازه' }).click(); const dialog = page.getByRole('dialog'); await dialog.getByLabel('قرار است چه کاری انجام دهی؟', { exact: true }).fill('QA مرور تکراری'); await dialog.getByLabel('این برنامه تکرار شود', { exact: true }).check(); await dialog.getByRole('button', { name: 'ساخت جلسه‌های تکراری' }).click(); await expect(dialog).not.toBeVisible();
  const sessions = (await notebook(page)).sessions; expect(sessions.length).toBeGreaterThan(1); expect(new Set(sessions.map(s => s.seriesId)).size).toBe(1); expect(sessions.every(s => s.seriesId)).toBe(true);
  const first = sessions[0]; expect([6, 1, 3]).toContain(new Date(`${first.date}T12:00:00`).getDay());
  await chooseISO(page, '.plan-date', first.date);
  await page.getByRole('button', { name: 'حذف QA مرور تکراری', exact: true }).first().click(); await page.getByRole('dialog').getByLabel('همهٔ جلسه‌های این مجموعه هم حذف شوند', { exact: true }).check(); await page.getByRole('dialog').getByRole('button', { name: 'بله، حذف شود' }).click(); expect((await notebook(page)).sessions).toHaveLength(0);
});

test('goals show actual study progress, preserve compatible fractional targets and support edit/delete', async ({ page }) => {
  await start(page); await study(page, '۴۵'); await go(page, 'progress'); await page.getByRole('button', { name: 'هدف تازه', exact: true }).click(); let dialog = page.getByRole('dialog'); await dialog.getByLabel('عنوان هدف', { exact: true }).fill('QA هدف ۹۰ دقیقه'); await dialog.getByLabel('دقیقهٔ هدف', { exact: true }).fill('۹۰'); await dialog.getByRole('button', { name: 'ذخیرهٔ هدف' }).click(); await expect(page.getByRole('progressbar', { name: 'پیشرفت QA هدف ۹۰ دقیقه' })).toHaveAttribute('value', '50');
  await page.getByRole('button', { name: 'ویرایش QA هدف ۹۰ دقیقه', exact: true }).click(); dialog = page.getByRole('dialog'); await dialog.getByRole('combobox', { name: 'چه چیزی را دنبال کنیم؟', exact: true }).selectOption('tasks'); await dialog.getByLabel('تعداد کار هدف', { exact: true }).fill('۴٫۵'); await dialog.getByRole('button', { name: 'ذخیرهٔ هدف' }).click(); await expect(dialog).not.toBeVisible(); expect((await notebook(page)).goals[0].metric).toBe('tasks'); expect((await notebook(page)).goals[0].target).toBe(4.5); await expect(page.locator('.goal-row')).toContainText('۴٫۵');
  await page.getByRole('button', { name: 'حذف QA هدف ۹۰ دقیقه', exact: true }).click(); await page.getByRole('dialog').getByRole('button', { name: 'بله، حذف شود' }).click(); expect((await notebook(page)).goals).toHaveLength(0);
});

test('subject archive hides new-entry choice, preserves history and can be reversed', async ({ page }) => {
  await start(page); await study(page); const original = (await notebook(page)).reports[0].subjects[0].subjectId; await go(page, 'subjects'); await page.getByRole('button', { name: 'درس تازه', exact: true }).click(); await page.getByRole('dialog').getByLabel('نام درس', { exact: true }).fill('QA منطق'); await page.getByRole('dialog').getByRole('button', { name: 'ذخیره', exact: true }).click(); await expect(page.getByText('QA منطق', { exact: true })).toBeVisible();
  const row = page.locator('.subject-row').filter({ hasText: 'ریاضی' }); await row.getByRole('button', { name: 'بایگانی', exact: true }).click(); expect((await notebook(page)).reports[0].subjects[0].subjectId).toBe(original); expect((await notebook(page)).subjects.find(s => s.id === original)?.archived).toBe(true);
  const dialog = await openStudy(page); await expect(dialog.getByRole('combobox', { name: 'درس ۱', exact: true }).locator('option')).not.toContainText(['ریاضی']); await dialog.getByRole('button', { name: 'انصراف' }).click(); await go(page, 'subjects'); await page.locator('.subject-row').filter({ hasText: 'ریاضی' }).getByRole('button', { name: 'فعال‌کردن', exact: true }).click(); expect((await notebook(page)).subjects.find(s => s.id === original)?.archived).toBe(false);
});

test('settings edit profile and scale without changing recorded grades or subjects', async ({ page }) => {
  await start(page); await exam(page, 'QA نمره', '۱۵'); const before = await notebook(page); await go(page, 'settings'); await page.getByRole('button', { name: 'ویرایش', exact: true }).click(); const dialog = page.getByRole('dialog'); await dialog.getByLabel('نامت چیست؟', { exact: true }).fill('نام ویرایش‌شده'); await dialog.getByLabel('مقیاس نمایش نمره', { exact: false }).fill('۱۰۰'); await dialog.getByLabel('هدف مطالعهٔ روزانه (دقیقه)', { exact: false }).fill('۱۲۰'); await dialog.getByRole('button', { name: 'ذخیرهٔ تغییرات' }).click(); const after = await notebook(page); expect(after.profile[0].scale).toBe(100); expect(after.profile[0].dailyGoal).toBe(120); expect(after.subjects).toEqual(before.subjects); expect(after.exams).toEqual(before.exams);
});

test('backup download round-trips exact data, cancel leaves it unchanged and confirmed restore replaces atomically', async ({ page }) => {
  await start(page); await study(page, '۴۵', 'QA پشتیبان'); await go(page, 'settings'); const before = await notebook(page), pending = page.waitForEvent('download'); await page.getByRole('button', { name: 'دریافت پشتیبان JSON', exact: true }).click(); const download = await pending, path = await download.path(); expect(path).toBeTruthy(); const exported = JSON.parse(await readFile(path!, 'utf8')); expect(exported.app).toBe('daftar-setareh-offline'); expect(exported.version).toBe(1); expect(exported.data).toEqual(before);
  const imported: Notebook = structuredClone(before); imported.profile[0].name = 'دفتر بازیابی‌شده'; imported.reports = []; await upload(page, envelope(imported)); await expect(page.getByRole('dialog')).toContainText('جایگزین'); await page.getByRole('dialog').getByRole('button', { name: 'انصراف', exact: true }).click(); expect(await notebook(page)).toEqual(before);
  await upload(page, envelope(imported)); const dialog = page.getByRole('dialog'); await dialog.getByLabel('می‌دانم که کل دفتر فعلی جایگزین می‌شود.', { exact: true }).check(); await dialog.getByRole('button', { name: 'جایگزینی کل دفتر' }).click(); await expect(dialog).not.toBeVisible(); expect(await notebook(page)).toEqual(imported);
});

test('invalid, dangling, unsupported and oversized backups never replace existing information', async ({ page }) => {
  await start(page); await study(page); await go(page, 'settings'); const before = await rawStorage(page), data = await notebook(page), dangling = structuredClone(data); dangling.reports[0].subjects[0].subjectId = 'does-not-exist';
  for (const input of ['{"bad":', { app: 'daftar-setareh-offline', version: 2, data }, envelope(dangling)]) { await upload(page, input); await expect(page.getByRole('alert')).toBeVisible(); expect(await rawStorage(page)).toBe(before); await expect(page.getByRole('dialog')).toHaveCount(0); }
  await upload(page, 'x'.repeat(5_000_001)); await expect(page.getByRole('alert')).toContainText('۵ مگابایت'); expect(await rawStorage(page)).toBe(before);
});

test('quota failure leaves existing bytes and open inputs intact without a success message', async ({ page }) => {
  await start(page); await study(page, '۳۰'); const before = await rawStorage(page); await page.evaluate(() => { Storage.prototype.setItem = function () { throw new DOMException('QA quota full', 'QuotaExceededError'); }; }); const dialog = await openStudy(page); await dialog.getByLabel('زمان درس ۱', { exact: true }).fill('۶۰'); await dialog.getByRole('button', { name: 'ذخیرهٔ مطالعه' }).click(); await expect(dialog.getByRole('alert')).toContainText('ذخیره نشد'); await expect(dialog.getByLabel('زمان درس ۱', { exact: true })).toHaveValue('۶۰'); expect(await rawStorage(page)).toBe(before);
});

test('another tab refreshes the notebook and a stale open form cannot overwrite newer changes', async ({ page, context }) => {
  await start(page); const dialog = await openStudy(page); await dialog.getByLabel('زمان درس ۱', { exact: true }).fill('۴۵'); const other = await context.newPage(); await other.goto('./#settings'); await other.getByRole('button', { name: 'ویرایش', exact: true }).click(); await other.getByRole('dialog').getByLabel('نامت چیست؟', { exact: true }).fill('نام تب دیگر'); await other.getByRole('dialog').getByRole('button', { name: 'ذخیرهٔ تغییرات' }).click(); await expect(page.getByRole('status')).toContainText('تب دیگری');
  await dialog.getByRole('button', { name: 'ذخیرهٔ مطالعه' }).click(); await expect(dialog.getByRole('alert')).toContainText('تب دیگری'); const stored = await notebook(page); expect(stored.profile[0].name).toBe('نام تب دیگر'); expect(stored.reports).toHaveLength(0); await other.close();
});

test('weekly/monthly report cards preserve unknown grades and prepare a real print layout', async ({ page }) => {
  await start(page); await study(page, '۴۵'); await exam(page, 'QA کارنامه', '۱۸'); await exam(page, 'QA منتظر', ''); await go(page, 'cards'); await expect(page.locator('.report-card-print')).toContainText('۱۸ از ۲۰'); await expect(page.locator('.report-card-print')).toContainText('در انتظار'); await page.getByRole('combobox', { name: 'نوع کارنامه', exact: true }).selectOption('monthly'); await expect(page.locator('.report-card-print')).toContainText('ماهانه');
  await page.evaluate(() => { window.print = () => { document.documentElement.dataset.qaPrint = 'called'; }; }); await page.getByRole('button', { name: 'چاپ / PDF', exact: true }).click(); await expect(page.locator('html')).toHaveAttribute('data-qa-print', 'called'); await page.emulateMedia({ media: 'print' }); await expect(page.locator('.card-controls')).not.toBeVisible(); await expect(page.locator('.report-card-print')).toBeVisible(); await expect(page.locator('.app-sidebar')).not.toBeVisible();
});

test('keyboard focus stays in a native dialog, Escape closes it and restores the triggering action', async ({ page }) => {
  await start(page); const dialog = await openStudy(page); await expect.poll(() => page.evaluate(() => Boolean(document.activeElement?.closest('dialog')))).toBe(true); for (let i = 0; i < 18; i++) { await page.keyboard.press('Tab'); await expect.poll(() => page.evaluate(() => Boolean(document.activeElement?.closest('dialog')))).toBe(true); } await page.keyboard.press('Escape'); await expect(dialog).not.toBeVisible(); await expect(page.getByRole('button', { name: 'ثبت مطالعه', exact: true })).toBeFocused();
});

test('clearing a notebook requires the exact confirmation phrase and cancellation preserves records', async ({ page }) => {
  await start(page); await study(page); await go(page, 'settings'); const before = await rawStorage(page); await page.getByRole('button', { name: 'حذف همهٔ اطلاعات این مرورگر' }).click(); let dialog = page.getByRole('dialog'); await dialog.getByLabel('برای تأیید، «حذف دفتر» را بنویس', { exact: true }).fill('حذف'); await dialog.getByRole('button', { name: 'حذف کل دفتر' }).click(); await expect(dialog.getByRole('alert')).toContainText('دقیقاً'); expect(await rawStorage(page)).toBe(before); await dialog.getByRole('button', { name: 'انصراف' }).click();
  await page.getByRole('button', { name: 'حذف همهٔ اطلاعات این مرورگر' }).click(); dialog = page.getByRole('dialog'); await dialog.getByLabel('برای تأیید، «حذف دفتر» را بنویس', { exact: true }).fill('حذف دفتر'); await dialog.getByRole('button', { name: 'حذف کل دفتر' }).click(); await expect(page.getByRole('heading', { name: 'روزت را ساده‌تر بچین.' })).toBeVisible(); expect((await notebook(page)).profile).toEqual([]);
});

for (const width of [320, 390, 768, 1440]) {
  test(`responsive ${width}px layouts keep all primary screens and open forms within the viewport`, async ({ page }, testInfo) => {
    await start(page); await study(page, '۴۵', 'یادداشت واقعی برای بررسی نمایش موبایل و رایانه.'); await page.setViewportSize({ width, height: width < 768 ? 844 : 1000 });
    for (const screen of ['today', 'plan', 'progress', 'more', 'settings', 'exams', 'cards']) { await go(page, screen); expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), `overflow in ${screen}`).toBe(true); await expect(page.getByRole('heading', { level: 1 })).toBeVisible(); }
    await go(page, 'today'); await page.screenshot({ path: testInfo.outputPath(`today-${width}.png`), fullPage: true }); const dialog = await openStudy(page); expect(await dialog.evaluate(element => element.scrollWidth <= element.clientWidth + 1)).toBe(true); await dialog.locator('.date-picker>summary').click(); expect(await dialog.evaluate(element => element.scrollWidth <= element.clientWidth + 1)).toBe(true); await page.keyboard.press('Escape'); await expect(dialog).not.toBeVisible();
  });
}

test('application makes no external data requests or console/page errors through all destinations', async ({ page }) => {
  const errors: string[] = [], external: string[] = []; page.on('pageerror', error => errors.push(error.message)); page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); }); page.on('request', request => { const url = new URL(request.url()); if (!['127.0.0.1', 'localhost'].includes(url.hostname)) external.push(request.url()); });
  await start(page); await study(page); for (const screen of ['plan', 'progress', 'more', 'reports', 'exams', 'cards', 'subjects', 'settings', 'help']) await go(page, screen); expect(external).toEqual([]); expect(errors).toEqual([]);
});

test('service-worker cached application reloads and records study with network fully offline', async ({ page, context }) => {
  await start(page); await study(page, '۳۰'); await page.evaluate(async () => { await navigator.serviceWorker.ready; }); await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
  await context.setOffline(true); try { await page.reload(); await expect(page.getByRole('heading', { level: 1 })).toContainText(profileName); await page.getByRole('button', { name: 'ثبت مطالعه', exact: true }).click(); const dialog = page.getByRole('dialog'); await dialog.getByLabel('زمان درس ۱', { exact: true }).fill('۱۵'); await dialog.getByRole('button', { name: 'ذخیرهٔ مطالعه' }).click(); await expect(dialog).not.toBeVisible(); expect((await notebook(page)).reports).toHaveLength(2); await page.reload(); expect((await notebook(page)).reports).toHaveLength(2); } finally { await context.setOffline(false); }
});

test('offline public guide, privacy and about directory links retain their own content and return to the saved notebook', async ({ page, context }) => {
  await start(page); await study(page, '۳۰', 'دفتر شخصی باید پس از مرور راهنما حفظ شود.'); const before = await notebook(page);
  await expect.poll(() => page.evaluate(async () => { const registration = await navigator.serviceWorker.getRegistration(); return Boolean(registration?.active && navigator.serviceWorker.controller); }), { timeout: 20_000 }).toBe(true);
  await context.setOffline(true);
  try {
    await page.getByRole('link', { name: 'راهنما', exact: true }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'راهنمای استفاده از دفتر ستاره', exact: true })).toBeVisible(); await expect(page).toHaveURL(/\/guide\/$/);
    await page.getByRole('link', { name: 'حریم خصوصی', exact: true }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'حریم خصوصی نسخهٔ مستقل وب', exact: true })).toBeVisible(); await expect(page).toHaveURL(/\/privacy\/$/);
    await page.getByRole('link', { name: 'درباره', exact: true }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'دربارهٔ دفتر ستاره', exact: true })).toBeVisible(); await expect(page).toHaveURL(/\/about\/$/);
    await page.getByRole('link', { name: 'باز کردن دفتر ستاره', exact: true }).click();
    await expect(page.getByRole('heading', { level: 1 })).toContainText(profileName); expect(await notebook(page)).toEqual(before);
  } finally { await context.setOffline(false); }
});

test('switching exam entry between raw grade and percentage preserves the score, weight and pending grade semantics', async ({ page }) => {
  await start(page); await exam(page, 'QA تبدیل نمره', '۱۸', '۲');
  await page.getByRole('button', { name: 'ویرایش QA تبدیل نمره', exact: true }).click(); let dialog = page.getByRole('dialog');
  await dialog.getByLabel('ورود نمره به درصد', { exact: true }).check(); await expect(dialog.getByLabel('درصد کسب‌شده', { exact: false })).toHaveValue('90'); await expect(dialog.getByLabel('از نمرهٔ کامل', { exact: true })).toHaveValue('100');
  await dialog.getByRole('button', { name: 'ذخیرهٔ آزمون' }).click(); let saved = (await notebook(page)).exams[0]; expect(saved.grade).toBe(90); expect(saved.maxGrade).toBe(100); expect(saved.weight).toBe(2); expect(saved.title).toBe('QA تبدیل نمره');
  await page.getByRole('button', { name: 'ویرایش QA تبدیل نمره', exact: true }).click(); dialog = page.getByRole('dialog'); await dialog.getByLabel('ورود نمره به درصد', { exact: true }).uncheck(); await expect(dialog.getByLabel('نمرهٔ کسب‌شده', { exact: false })).toHaveValue('18'); await expect(dialog.getByLabel('از نمرهٔ کامل', { exact: true })).toHaveValue('20');
  await dialog.getByRole('button', { name: 'ذخیرهٔ آزمون' }).click(); saved = (await notebook(page)).exams[0]; expect(saved.grade).toBe(18); expect(saved.maxGrade).toBe(20); expect(saved.grade! / saved.maxGrade * 100).toBe(90); expect(saved.weight).toBe(2);
  await page.getByRole('button', { name: 'ویرایش QA تبدیل نمره', exact: true }).click(); dialog = page.getByRole('dialog'); await dialog.getByLabel('نمرهٔ کسب‌شده', { exact: false }).fill('-۱'); await dialog.getByLabel('ورود نمره به درصد', { exact: true }).click(); await expect(dialog.getByRole('alert')).toContainText('نمره'); await expect(dialog.getByLabel('ورود نمره به درصد', { exact: true })).not.toBeChecked(); await expect(dialog.getByLabel('نمرهٔ کسب‌شده', { exact: false })).toHaveValue('-۱'); expect((await notebook(page)).exams[0].grade).toBe(18);
  await dialog.getByLabel('نمرهٔ کسب‌شده', { exact: false }).fill(''); await dialog.getByLabel('ورود نمره به درصد', { exact: true }).check(); await expect(dialog.getByLabel('درصد کسب‌شده', { exact: false })).toHaveValue(''); await dialog.getByRole('button', { name: 'ذخیرهٔ آزمون' }).click(); saved = (await notebook(page)).exams[0]; expect(saved.grade).toBeNull(); expect(saved.maxGrade).toBe(100); expect(saved.weight).toBe(2);
});



