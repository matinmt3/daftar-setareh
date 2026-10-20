import type { Metadata } from "next";
import Link from "next/link";
import {
  BellRing,
  BookOpen,
  CalendarDays,
  KeyRound,
  LogOut,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import { requireOnboardedUser } from "@/server/auth/session";
import { logoutAction } from "@/server/actions/auth";
import { getSubjects } from "@/server/services/subjects";
import { formatNumericDate } from "@/lib/dates";
import { fieldLabel, gradeLabel } from "@/lib/constants";
import { faNum, toPersianDigits } from "@/lib/format";
import { PageHeader } from "@/components/ui/page";
import { Badge } from "@/components/ui/badge";
import { SettingsForm } from "./settings-form";
import { SubjectsManager } from "./subjects-manager";
import { DangerZone } from "./danger-zone";

export const metadata: Metadata = { title: "تنظیمات" };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await requireOnboardedUser();
  const subjects = getSubjects(user.id, true);
  const initial = (user.name ?? "د").slice(0, 1);

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="حساب و تنظیمات"
        title="تنظیمات"
        description="مشخصات، مقیاس نمره و درس‌هایت را اینجا نگه دار. هر تغییری که بدهی، از همین لحظه در گزارش‌ها و کارنامه‌ها اثر می‌گذارد."
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.45fr)_minmax(17rem,0.55fr)]">
        <div className="space-y-4">
          <section className="card p-4 sm:p-5">
            <div className="mb-4 flex items-center gap-2.5">
              <span className="flex size-9 items-center justify-center rounded-xl bg-violet-soft text-violet-deep">
                <UserRound className="size-4" aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-sm font-extrabold text-ink">مشخصات و اهداف</h2>
                <p className="mt-0.5 text-[0.6rem] text-muted">نام، پایه و هدف روزانه‌ات را به‌روز کن.</p>
              </div>
            </div>
            <SettingsForm user={user} />
          </section>

          <section id="subjects" className="card scroll-mt-24 p-4 sm:p-5">
            <SubjectsManager subjects={subjects} />
          </section>

          <section className="card p-4 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="flex size-9 items-center justify-center rounded-xl bg-sky-soft text-[#1e6dad]">
                  <ShieldCheck className="size-4" aria-hidden="true" />
                </span>
                <div>
                  <h2 className="text-sm font-extrabold text-ink">حساب و امنیت</h2>
                  <p className="mt-0.5 text-[0.6rem] text-muted">ورود با رمز یک‌بارمصرف و شمارهٔ موبایل.</p>
                </div>
              </div>
              <form action={logoutAction}>
                <button type="submit" className="btn btn-secondary text-[0.65rem]">
                  <LogOut className="size-3.5" aria-hidden="true" />
                  خروج از حساب
                </button>
              </form>
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <div className="rounded-xl border border-line/80 bg-[#fcfaf6] px-3 py-2.5">
                <p className="text-[0.56rem] text-muted">شمارهٔ موبایل</p>
                <p className="num mt-1 text-xs font-bold text-ink">{toPersianDigits(user.phone)}</p>
              </div>
              <div className="rounded-xl border border-line/80 bg-[#fcfaf6] px-3 py-2.5">
                <p className="text-[0.56rem] text-muted">عضویت از</p>
                <p className="mt-1 text-xs font-bold text-ink">{formatNumericDate(user.createdAt.slice(0, 10))}</p>
              </div>
            </div>

            <div className="mt-3 flex items-start gap-2 rounded-xl bg-violet-soft/50 px-3 py-2.5">
              <KeyRound className="mt-0.5 size-3.5 shrink-0 text-violet-deep" aria-hidden="true" />
              <p className="text-[0.6rem] leading-5 text-violet-deep">
                کد ورود فقط دو دقیقه اعتبار دارد و حداکثر پنج بار قابل امتحان است. اگر کد را با کسی به اشتراک گذاشتی،
                همین حالا از حساب خارج شو.
              </p>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
              <div>
                <p className="text-xs font-bold text-ink">حذف حساب</p>
                <p className="mt-0.5 text-[0.58rem] text-muted">
                  همهٔ داده‌های این حساب برای همیشه پاک می‌شود.
                </p>
              </div>
              {user.isDemo ? (
                <Badge tone="gold">در حساب نمایشی غیرفعال است</Badge>
              ) : (
                <DangerZone />
              )}
            </div>
          </section>
        </div>

        <aside className="space-y-4">
          <section className="card overflow-hidden">
            <div className="relative bg-gradient-to-bl from-violet-soft via-[#fbf7ef] to-gold-soft/60 px-4 pb-4 pt-5">
              <div className="absolute left-4 top-4 opacity-30">
                <Sparkles className="size-10 text-violet-deep" aria-hidden="true" />
              </div>
              <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet to-[#9a8bff] text-xl font-extrabold text-white shadow-md">
                {initial}
              </div>
              <p className="mt-3 text-base font-extrabold text-ink">{user.name ?? "دانش‌آموز"}</p>
              <p className="mt-0.5 text-[0.62rem] text-muted">
                {gradeLabel(user.gradeLevel)}
                {user.field ? ` · ${fieldLabel(user.field)}` : ""}
              </p>
              {user.isDemo ? (
                <Badge tone="gold" className="mt-2">
                  <Sparkles className="size-3" aria-hidden="true" />
                  حساب نمایشی
                </Badge>
              ) : null}
            </div>
            <ul className="space-y-2 px-4 py-4">
              <li className="flex items-center justify-between gap-2 text-[0.62rem]">
                <span className="flex items-center gap-1.5 text-muted">
                  <BookOpen className="size-3.5" aria-hidden="true" />
                  درس‌ها
                </span>
                <span className="font-bold text-ink">{faNum(subjects.filter((subject) => !subject.isArchived).length)} فعال</span>
              </li>
              <li className="flex items-center justify-between gap-2 text-[0.62rem]">
                <span className="flex items-center gap-1.5 text-muted">
                  <CalendarDays className="size-3.5" aria-hidden="true" />
                  مقیاس نمره
                </span>
                <span className="font-bold text-ink">از {faNum(user.gradeScale)}</span>
              </li>
              <li className="flex items-center justify-between gap-2 text-[0.62rem]">
                <span className="flex items-center gap-1.5 text-muted">
                  <BellRing className="size-3.5" aria-hidden="true" />
                  یادآور
                </span>
                <span className="font-bold text-ink">{user.notificationEnabled ? "روشن" : "خاموش"}</span>
              </li>
              <li className="flex items-center justify-between gap-2 text-[0.62rem]">
                <span className="flex items-center gap-1.5 text-muted">
                  <UserRound className="size-3.5" aria-hidden="true" />
                  هدف روزانه
                </span>
                <span className="font-bold text-ink">{faNum(user.dailyGoalMinutes)} دقیقه</span>
              </li>
            </ul>
          </section>

          <section className="rounded-2xl border border-line bg-white p-4 shadow-sm">
            <h2 className="text-xs font-extrabold text-ink">میان‌بُرها</h2>
            <div className="mt-2 space-y-1.5">
              <Link href="/app/planner" className="flex items-center justify-between rounded-lg bg-paper/60 px-3 py-2 text-[0.62rem] text-ink-soft transition-colors hover:bg-violet-soft hover:text-violet-deep">
                برنامهٔ مطالعه و هدف‌ها
                <span aria-hidden="true">←</span>
              </Link>
              <Link href="/app/reports" className="flex items-center justify-between rounded-lg bg-paper/60 px-3 py-2 text-[0.62rem] text-ink-soft transition-colors hover:bg-violet-soft hover:text-violet-deep">
                گزارش‌های روزانه
                <span aria-hidden="true">←</span>
              </Link>
              <Link href="/app/cards" className="flex items-center justify-between rounded-lg bg-paper/60 px-3 py-2 text-[0.62rem] text-ink-soft transition-colors hover:bg-violet-soft hover:text-violet-deep">
                کارنامه‌ها
                <span aria-hidden="true">←</span>
              </Link>
            </div>
          </section>

          <section className="rounded-2xl border border-gold/20 bg-gold-soft/30 p-4">
            <p className="text-xs font-extrabold text-[#7c5c12]">دفتر ستاره</p>
            <p className="mt-1 text-[0.6rem] leading-5 text-[#7c5c12]">
              هر روز یک صفحهٔ تازه، هر صفحه یک ستاره. داده‌ها روی همین سرور نگهداری می‌شوند و در اختیار تو هستند.
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}
