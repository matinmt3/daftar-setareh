import { useRef } from 'react';
import { ArrowDownToLine, ArrowUpFromLine, ShieldCheck } from 'lucide-react';
import { Button, SectionHeading } from './components';
import { backupText, fa, parseBackup, type Notebook } from './core';
import { downloadText } from './store';
import { PageTitle, type Actions } from './pages';

export function BackupControls({ data, onImport, onError, recovery = false }: { data: Notebook; onImport: (data: Notebook, name: string) => void; onError: (message: string) => void; recovery?: boolean }) {
  const input = useRef<HTMLInputElement>(null);
  async function load(file?: File) {
    if (!file) return;
    try {
      if (file.size > 5_000_000) throw new Error('فایل پشتیبان باید حداکثر ۵ مگابایت باشد.');
      const text = await file.text(), notebook = parseBackup(text); onImport(notebook, file.name);
    } catch (cause) { onError(cause instanceof Error ? cause.message : 'فایل خوانده نشد.'); }
    finally { if (input.current) input.current.value = ''; }
  }
  return <div className="backup-controls">{!recovery && <Button icon={undefined} onClick={() => { try { downloadText(backupText(data), `daftar-setareh-${new Date().toISOString().slice(0, 10)}.json`); } catch (error) { onError(error instanceof Error ? error.message : 'پشتیبان ساخته نشد.'); } }}><ArrowDownToLine size={18} aria-hidden="true" />دریافت پشتیبان JSON</Button>}<Button onClick={() => input.current?.click()}><ArrowUpFromLine size={18} aria-hidden="true" />ورود فایل پشتیبان</Button><input hidden type="file" accept=".json,application/json" ref={input} aria-label="انتخاب فایل پشتیبان JSON" onChange={e => void load(e.target.files?.[0])} /></div>;
}
export function SettingsPage({ data, actions, onImport, onError, onClear }: { data: Notebook; actions: Actions; onImport: (data: Notebook, name: string) => void; onError: (message: string) => void; onClear: () => void }) {
  const p = data.profile[0], records = data.reports.length + data.exams.length + data.sessions.length + data.goals.length;
  return <><PageTitle title="تنظیمات و پشتیبان" subtitle="دفترت مال خودت است؛ نسخه‌ای از آن را هم نگه دار." /><section className="paper"><SectionHeading title="مشخصات من" action={<Button kind="ghost" icon="edit" onClick={() => actions.edit({ type: 'profile' })}>ویرایش</Button>} /><dl className="profile-summary"><div><dt>نام</dt><dd>{p.name}</dd></div><div><dt>پایه و رشته</dt><dd>{fa(p.grade)} · {p.field || 'عمومی'}</dd></div><div><dt>هدف روزانه</dt><dd>{fa(p.dailyGoal)} دقیقه</dd></div><div><dt>مقیاس نمایش نمره</dt><dd>از {fa(p.scale)}</dd></div></dl></section><section className="paper backup-panel"><SectionHeading title="یک نسخهٔ امن از دفترت" subtitle="قبل از پاک‌کردن حافظهٔ مرورگر، تغییر دستگاه یا بازیابی فایل، پشتیبان بگیر." /><div className="backup-explainer"><ShieldCheck size={28} aria-hidden="true" /><div><p>اطلاعات فقط در همین مرورگر ذخیره می‌شود.</p><small>{fa(records)} گزارش، آزمون، جلسه و هدف · بدون حساب و همگام‌سازی خودکار</small></div></div><BackupControls data={data} onImport={onImport} onError={onError} /><p className="help-text">فرمت مشترک نسخهٔ وب و اندروید مستقل؛ حداکثر ۵ مگابایت و ۲۰٬۰۰۰ رکورد. بازیابی پس از تأیید، تمام دفتر فعلی را جایگزین می‌کند.</p></section><section className="paper danger-zone"><SectionHeading title="شروع دوباره" subtitle="حذف دفتر از این مرورگر قابل برگشت نیست؛ فایل پشتیبان را جدا نگه دار." /><Button kind="danger" onClick={onClear}>حذف همهٔ اطلاعات این مرورگر</Button></section><p className="version-note">دفتر ستاره · نسخهٔ مستقل وب ۱٫۱ · بدون تحلیل‌گر یا ارسال دادهٔ شخصی</p></>;
}
