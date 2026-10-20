import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  NotebookPen,
  Pencil,
  Sparkles,
} from "lucide-react";
import { requireOnboardedUser } from "@/server/auth/session";
import { getReports } from "@/server/services/reports";
import {
  formatFullDate,
  formatMonthYear,
  monthKey,
  monthKeyToRange,
  todayISO,
  addMonthsISO,
  formatShortDate,
} from "@/lib/dates";
import { faMinutes, faNum, faPercent } from "@/lib/format";
import { reportEntryTitle } from "@/lib/constants";
import { PageHeader, EmptyState, SectionHeading } from "@/components/ui/page";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "گزارش‌های روزانه" };
export const dynamic = "force-dynamic";

function resolveMonth(key: string | undefined): string {
  if (key) {
    try {
      monthKeyToRange(key);
      return key;
    } catch {
      return monthKey(todayISO());
    }
  }
  return monthKey(todayISO());
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const user = await requireOnboardedUser();
  const params = await searchParams;
  const activeMonth = resolveMonth(params.month);
  const range = monthKeyToRange(activeMonth);
  const currentMonth = monthKey(todayISO());
  const reports = getReports(user.id, { from: range.start, to: range.end, limit: 200 });
  const previous = monthKey(addMonthsISO(range.start, -1));
  const next = monthKey(addMonthsISO(range.start, 1));
  const isCurrent = activeMonth >= currentMonth;
  const totalMinutes = reports.reduce((sum, report) => sum + report.minutes, 0);
  const totalTasks = reports.reduce((sum, report) => sum + report.completedTasks, 0);
  const uniqueDays = new Set(reports.map((report) => report.reportDate)).size;

  const grouped = new Map<string, typeof reports>();
  reports.forEach((report) => {
    const list = grouped.get(report.reportDate) ?? [];
    list.push(report);
    grouped.set(report.reportDate, list);
  });
  const groups = Array.from(grouped.entries());

  return (
    <div>
      <PageHeader
        eyebrow="دفتر روزانه"
        title="گزارش‌های من"
        description="همهٔ صفحه‌های دفترت، ماه به ماه. هر روز می‌تواند بیش از یک صفحه داشته باشد."
        actions={
          <Link href="/app/reports/new" className="btn btn-primary text-xs">
            <NotebookPen className="size-4" aria-hidden="true" />
            گزارش تازه
          </Link>
        }
      />

      <section className="mb-5 grid gap-3 sm:grid-cols-3">
        <div className="card flex items-center gap-3 p-4">
          <span className="flex size-10 items-center justify-center rounded-2xl bg-coral-soft text-[#c73554]">
            <CalendarDays className="size-4" aria-hidden="true" />
          </span>
          <div>
            <p className="text-[0.65rem] text-muted">روزهای ثبت‌شده</p>
            <p className="num mt-0.5 text-xl font-extrabold">{faNum(uniqueDays)}<span className="mr-1 text-[0.6rem] font-medium text-muted">روز</span></p>
          </div>
        </div>
        <div className="card flex items-center gap-3 p-4">
          <span className="flex size-10 items-center justify-center rounded-2xl bg-violet-soft text-violet-deep">
            <Clock3 className="size-4" aria-hidden="true" />
          </span>
          <div>
            <p className="text-[0.65rem] text-muted">مطالعهٔ ماه</p>
            <p className="num mt-0.5 text-xl font-extrabold">{faMinutes(totalMinutes)}</p>
          </div>
        </div>
        <div className="card flex items-center gap-3 p-4">
          <span className="flex size-10 items-center justify-center rounded-2xl bg-mint-soft text-[#157a5b]">
            <CheckCircle2 className="size-4" aria-hidden="true" />
          </span>
          <div>
            <p className="text-[0.65rem] text-muted">کارهای انجام‌شده</p>
            <p className="num mt-0.5 text-xl font-extrabold">{faNum(totalTasks)}<span className="mr-1 text-[0.6rem] font-medium text-muted">کار</span></p>
          </div>
        </div>
      </section>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-cream/80 p-2.5">
        <Link
          href={`/app/reports?month=${previous}`}
          className="btn btn-ghost min-h-8 px-2.5 text-[0.68rem]"
          aria-label="ماه قبل"
        >
          <ChevronRight className="size-4" aria-hidden="true" />
          ماه قبل
        </Link>
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-lg bg-violet-soft text-violet-deep">
            <CalendarDays className="size-3.5" aria-hidden="true" />
          </span>
          <p className="num text-sm font-bold">{formatMonthYear(range.start)}</p>
          {activeMonth === currentMonth ? (
            <Badge tone="violet" className="text-[0.55rem]">این ماه</Badge>
          ) : null}
        </div>
        {isCurrent ? (
          <span className="btn btn-ghost pointer-events-none min-h-8 px-2.5 text-[0.68rem] opacity-40">
            ماه بعد
            <ChevronLeft className="size-4" aria-hidden="true" />
          </span>
        ) : (
          <Link
            href={`/app/reports?month=${next}`}
            className="btn btn-ghost min-h-8 px-2.5 text-[0.68rem]"
            aria-label="ماه بعد"
          >
            ماه بعد
            <ChevronLeft className="size-4" aria-hidden="true" />
          </Link>
        )}
      </div>

      {groups.length === 0 ? (
        <div className="card p-5">
          <EmptyState
            icon={<NotebookPen className="size-5" aria-hidden="true" />}
            title="این ماه هنوز صفحه‌ای ندارد"
            description="اولین گزارش این ماه را بنویس؛ حتی چند دقیقه مطالعه هم شروع خوبی است."
            action={<Link href="/app/reports/new" className="btn btn-primary text-xs">نوشتن اولین گزارش</Link>}
          />
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_17rem]">
          <div className="space-y-5">
            {groups.map(([date, entries]) => {
              const minutes = entries.reduce((sum, entry) => sum + entry.minutes, 0);
              return (
                <section key={date}>
                  <div className="mb-2.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="flex size-8 items-center justify-center rounded-xl border border-line bg-cream text-[0.65rem] font-bold text-violet-deep">
                        {formatShortDate(date).split(" ")[0]}
                      </span>
                      <div>
                        <h2 className="text-xs font-bold text-ink">{formatFullDate(date)}</h2>
                        <p className="mt-0.5 text-[0.6rem] text-muted">
                          {faNum(entries.length)} صفحه • {faMinutes(minutes)}
                        </p>
                      </div>
                    </div>
                    {date === todayISO() ? <Badge tone="mint" className="text-[0.55rem]">امروز</Badge> : null}
                  </div>
                  <div className="space-y-2.5">
                    {entries.map((report) => {
                      const tasks = report.completedTasks + report.pendingTasks;
                      const rate = tasks > 0 ? Math.round((report.completedTasks / tasks) * 100) : null;
                      return (
                        <article key={report.id} className="card group p-4 transition-transform hover:-translate-y-0.5">
                          <div className="flex items-start gap-3">
                            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-violet-soft text-violet-deep">
                              <NotebookPen className="size-4" aria-hidden="true" />
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <Link href={`/app/reports/${report.id}`} className="text-sm font-bold text-ink hover:text-violet-deep">
                                  {reportEntryTitle(report.entryIndex)}
                                </Link>
                                <span className="num rounded-full bg-paper px-2 py-0.5 text-[0.55rem] text-muted">
                                  {faMinutes(report.minutes)}
                                </span>
                                {rate !== null ? (
                                  <span className="num rounded-full bg-mint-soft px-2 py-0.5 text-[0.55rem] font-semibold text-[#157a5b]">
                                    {faPercent(rate)} کارها
                                  </span>
                                ) : null}
                              </div>
                              {report.reflection ? (
                                <p className="mt-1.5 line-clamp-2 text-xs leading-6 text-muted">{report.reflection}</p>
                              ) : (
                                <p className="mt-1.5 text-[0.65rem] text-muted">
                                  {report.subjectCount > 0 ? `${faNum(report.subjectCount)} درس ثبت شده` : "بدون جزئیات درسی"}
                                </p>
                              )}
                            </div>
                            <div className="flex shrink-0 items-center gap-1">
                              <Link
                                href={`/app/reports/${report.id}/edit`}
                                className="flex size-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-violet-soft hover:text-violet-deep"
                                aria-label={`ویرایش ${reportEntryTitle(report.entryIndex)}`}
                              >
                                <Pencil className="size-3.5" aria-hidden="true" />
                              </Link>
                              <Link
                                href={`/app/reports/${report.id}`}
                                className="flex size-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-violet-soft hover:text-violet-deep"
                                aria-label={`دیدن ${reportEntryTitle(report.entryIndex)}`}
                              >
                                <ArrowLeft className="size-4" aria-hidden="true" />
                              </Link>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>

          <aside className="space-y-4">
            <div className="card overflow-hidden bg-night text-white">
              <div className="bg-[radial-gradient(circle_at_80%_0%,rgba(109,91,246,0.65),transparent_55%)] p-4">
                <Sparkles className="size-5 text-gold" aria-hidden="true" />
                <p className="mt-2 text-sm font-bold">امروز را جا نگذار</p>
                <p className="mt-1 text-[0.65rem] leading-5 text-white/60">
                  یک گزارش کوتاه هم کافی است تا زنجیرهٔ روزهایت ادامه پیدا کند.
                </p>
                <Link href="/app/reports/new" className="btn mt-3 w-full bg-white text-xs text-ink hover:bg-gold-soft">
                  نوشتن گزارش امروز
                  <ArrowRight className="size-3.5 rotate-180" aria-hidden="true" />
                </Link>
              </div>
            </div>
            <div className="card p-4">
              <SectionHeading title="این ماه در یک نگاه" className="mb-3" />
              <div className="space-y-2.5 text-[0.68rem]">
                <div className="flex justify-between gap-2">
                  <span className="text-muted">تعداد صفحه</span>
                  <span className="num font-bold">{faNum(reports.length)}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-muted">میانگین مطالعهٔ روز</span>
                  <span className="num font-bold">{faMinutes(uniqueDays > 0 ? Math.round(totalMinutes / uniqueDays) : 0)}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-muted">کارهای باقی‌مانده</span>
                  <span className="num font-bold">{faNum(reports.reduce((sum, report) => sum + report.pendingTasks, 0))}</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
