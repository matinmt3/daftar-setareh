import { backupText, emptyNotebook, validateNotebook, type Notebook } from './core';
export const STORAGE_KEY = 'daftar-setareh-offline:v1';
export type Snapshot = { data: Notebook; raw: string | null; error: string | null };
export function readNotebook(): Snapshot {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
    return { data: raw ? validateNotebook(JSON.parse(raw)) : emptyNotebook(), raw, error: null };
  } catch {
    return { data: emptyNotebook(), raw, error: 'دفتر از حافظهٔ مرورگر خوانده نشد. اطلاعات قبلی دست‌نخورده مانده است؛ ابتدا فایل بازیابی را دریافت کن یا پشتیبان معتبر وارد کن.' };
  }
}
/** setItem is atomic; state is published only after a successful validated write. */
export function writeNotebook(next: Notebook, expectedRaw: string | null): Snapshot {
  const data = validateNotebook(next);
  if (data.profile.length) backupText(data); // A saved notebook must always remain exportable and restorable.
  let existing: string | null;
  try { existing = localStorage.getItem(STORAGE_KEY); } catch { throw new Error('مرورگر دسترسی به حافظه را مسدود کرده است. دفتر در حالت فعلی ذخیره نشده است.'); }
  if (existing !== expectedRaw) throw new Error('دفتر در تب دیگری تغییر کرده است. صفحه را تازه کن تا تغییرات جدید را ببینی؛ چیزی جایگزین نشد.');
  const raw = JSON.stringify(data);
  try { localStorage.setItem(STORAGE_KEY, raw); } catch { throw new Error('ذخیره نشد؛ حافظهٔ مرورگر پر یا غیرفعال است. از اطلاعات فعلی پشتیبان بگیر و فضای مرورگر را بررسی کن.'); }
  return { data, raw, error: null };
}
export function downloadText(text: string, filename: string, type = 'application/json') {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const link = document.createElement('a'); link.href = url; link.download = filename; document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
