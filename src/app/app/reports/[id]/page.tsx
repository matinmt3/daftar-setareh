import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Circle,
  Clock3,
  FileText,
  Lightbulb,
  ListChecks,
  NotebookPen,
  Pencil,
  Sparkles,
  Target,
} from "lucide-react";
import { requireOnboardedUser } from "@/server/auth/session";
import { getReport, getReportsForDate } from "@/server/services/reports";
import { deleteReportAction } from "@/server/actions/reports";
import { formatFullDate, formatNumericDate } from "@/lib/dates";
import { faMinutes, faNum, faPercent } from "@/lib/format";
import { reportEntryTitle } from "@/lib/constants";
import { PageHeader, SectionHeading } from "@/components/ui/page";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { SubjectIcon } from "@/components/subject-icon";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import type { DailyReport } from "@/lib/types";

export const metadata: Metadata = { title: "گزارش روزانه" };
export const dynamic = "force-dynamic";

const textSections = [
  { key: "lessonsReviewed", label: "مرور و خواندن", icon: FileText },
  { key: "exercises", label: "تمرین و تکلیف", icon: ListChecks },
  { key: "difficulties", label: "سختی‌های امروز", icon: Target },
  { key: "nextDayGoals", label: "هدف فردا", icon: Sparkles },
] as const;

export default async function ReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireOnboardedUser();
  const { id } = await params;
  let report: DailyReport;
  try {
    report = getReport(user.id, id);
  } catch {
    notFound();
  }
  const siblings = getReportsForDate(user.id, report.reportDate);
  const totalMinutes = report.subjects.reduce((sum, entry) => sum + entry.minutes, 0);
  const completed = report.tasks.filter((task) => task.status === "completed").length;
  const completion = report.tasks.length > 0 ? Math.round((completed / report.tasks.length) * 100) : null;
  const deleteAction = deleteReportAction.bind(null, { id: report.id });

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        eyebrow={formatFullDate(report.reportDate)}
        title={reportEntryTitle(report.entryIndex)}
        description={
          siblings.length > 1
            ? `این روز ${faNum(siblings.length)} صفحه در دفتر دارد.`
            : "همهٔ چیزهایی که امروز ثبت کرده‌ای، یک‌جا."
        }
        actions={
          <>
            <Link href={`/app/reports/${report.id}/edit`} className="btn btn-secondary text-xs">
              <Pencil className="size-4" aria-hidden="true" />
              ویرایش
            </Link>
            <ConfirmDeleteButton
              action={deleteAction}
              title="حذف گزارش روزانه؟"
              description="این صفحه از دفتر حذف می‌شود و در محاسبه‌ها و کارنامه‌ها دیگر لحاظ نخواهد شد."
              redirectTo="/app/reports"
              compact
            />
          </>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_17rem]">
        <div className="space-y-5">
          <section className="card overflow-hidden">
            <div className="grid grid-cols-2 divide-x divide-x-reverse divide-line border-b border-line bg-[#fdfaf4] sm:grid-cols-4">
              <div className="p-4">
                <p className="flex items-center gap-1 text-[0.6rem] text-muted">
                  <Clock3 className="size-3" aria-hidden="true" /> مطالعه
                </p>
                <p className="num mt-1.5 text-base font-extrabold">{faMinutes(totalMinutes)}</p>
              </div>
              <div className="p-4">
                <p className="flex items-center gap-1 text-[0.6rem] text-muted">
                  <NotebookPen className="size-3" aria-hidden="true" /> درس‌ها
                </p>
                <p className="num mt-1.5 text-base font-extrabold">{faNum(report.subjects.length)}</p>
              </div>
              <div className="p-4">
                <p className="flex items-center gap-1 text-[0.6rem] text-muted">
                  <CheckCircle2 className="size-3" aria-hidden="true" /> کار انجام‌شده
                </p>
                <p className="num mt-1.5 text-base font-extrabold">{faNum(completed)}</p>
              </div>
              <div className="p-4">
                <p className="flex items-center gap-1 text-[0.6rem] text-muted">
                  <Circle className="size-3" aria-hidden="true" /> کار باقی‌مانده
                </p>
                <p className="num mt-1.5 text-base font-extrabold">{faNum(report.tasks.length - completed)}</p>
              </div>
            </div>

            <div className="p-4 sm:p-5">
              <SectionHeading
                title="مطالعه به تفکیک درس"
                icon={<NotebookPen className="size-4" aria-hidden="true" />}
              />
              {report.subjects.length === 0 ? (
                <p className="rounded-xl border border-dashed border-line bg-[#fdfaf4] px-4 py-6 text-center text-xs text-muted">
                  برای این روز مطالعه‌ای ثبت نشده است.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {report.subjects.map((entry) => {
                    const share = totalMinutes > 0 ? Math.round((entry.minutes / totalMinutes) * 100) : 0;
                    return (
                      <div key={entry.id} className="rounded-xl border border-line bg-[#fdfaf4] p-3">
                        <div className="flex items-center gap-2.5">
                          <SubjectIcon icon={entry.subjectIcon} color={entry.subjectColor} size="sm" />
                          <p className="min-w-0 flex-1 truncate text-xs font-semibold text-ink">
                            {entry.subjectName ?? "درس"}
                          </p>
                          <span className="num text-xs font-bold text-ink-soft">{faMinutes(entry.minutes)}</span>
                          <span className="num w-9 text-left text-[0.58rem] text-muted">{faPercent(share)}</span>
                        </div>
                        <Progress
                          value={share}
                          className="mt-2 h-1"
                          tone={entry.minutes > 0 ? "violet" : "gold"}
                          label={`سهم ${entry.subjectName ?? "درس"}`}
                        />
                        {entry.note ? (
                          <p className="mt-2 rounded-lg bg-white px-2.5 py-1.5 text-[0.65rem] leading-5 text-ink-soft">
                            {entry.note}
                          </p>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          <section className="card p-4 sm:p-5">
            <SectionHeading
              title="کارهای امروز"
              description={completion === null ? "کاری برای این روز ثبت نشده است." : `${faPercent(completion)} کارها انجام شده‌اند.`}
              icon={<ListChecks className="size-4" aria-hidden="true" />}
            />
            {report.tasks.length === 0 ? (
              <p className="rounded-xl border border-dashed border-line bg-[#fdfaf4] px-4 py-6 text-center text-xs text-muted">
                کاری ثبت نشده است.
              </p>
            ) : (
              <div className="space-y-2">
                {report.tasks.map((task) => (
                  <div
                    key={task.id}
                    className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 ${
                      task.status === "completed" ? "border-mint/40 bg-mint-soft/40" : "border-line bg-[#fdfaf4]"
                    }`}
                  >
                    <span
                      className={`flex size-5 shrink-0 items-center justify-center rounded-full ${
                        task.status === "completed" ? "bg-mint text-white" : "border border-[#d8cfc0] bg-white text-transparent"
                      }`}
                    >
                      <CheckCircle2 className="size-3.5" aria-hidden="true" />
                    </span>
                    <p className={`min-w-0 flex-1 text-xs ${task.status === "completed" ? "text-muted line-through" : "text-ink"}`}>
                      {task.title}
                    </p>
                    {task.subjectName ? (
                      <Badge tone="outline" className="shrink-0 text-[0.55rem]">{task.subjectName}</Badge>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="card p-4 sm:p-5">
            <SectionHeading
              title="یادداشت‌های صفحه"
              icon={<FileText className="size-4" aria-hidden="true" />}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              {textSections.map((section) => {
                const value = report[section.key];
                const Icon = section.icon;
                return (
                  <div key={section.key} className="rounded-xl border border-line bg-[#fdfaf4] p-3.5">
                    <p className="flex items-center gap-1.5 text-[0.65rem] font-bold text-ink-soft">
                      <Icon className="size-3.5 text-violet-deep" aria-hidden="true" />
                      {section.label}
                    </p>
                    <p className={`mt-2 text-xs leading-6 ${value ? "text-ink-soft" : "text-muted"}`}>
                      {value || "چیزی نوشته نشده است."}
                    </p>
                  </div>
                );
              })}
              <div className="rounded-xl border border-violet/20 bg-violet-soft/60 p-3.5 sm:col-span-2">
                <p className="flex items-center gap-1.5 text-[0.65rem] font-bold text-violet-deep">
                  <Lightbulb className="size-3.5" aria-hidden="true" />
                  جملهٔ امروز
                </p>
                <p className={`mt-2 text-xs leading-7 ${report.reflection ? "text-ink-soft" : "text-muted"}`}>
                  {report.reflection || "یک جمله دربارهٔ امروز، فردا کمکت می‌کند."}
                </p>
              </div>
            </div>
          </section>
        </div>

        <aside className="space-y-4">
          <div className="card p-4">
            <SectionHeading title="یک نگاه سریع" className="mb-3" />
            <div className="space-y-3 text-[0.68rem]">
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-muted">
                  <CalendarDays className="size-3.5" aria-hidden="true" /> تاریخ
                </span>
                <span className="num font-semibold">{formatNumericDate(report.reportDate)}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-muted">
                  <NotebookPen className="size-3.5" aria-hidden="true" /> تعداد صفحه
                </span>
                <span className="font-semibold">{reportEntryTitle(report.entryIndex)}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-muted">
                  <CheckCircle2 className="size-3.5" aria-hidden="true" /> تکمیل کارها
                </span>
                <span className="num font-semibold">{faPercent(completion)}</span>
              </div>
            </div>
            {completion !== null ? (
              <Progress value={completion} tone="mint" className="mt-3 h-1.5" label="تکمیل کارها" />
            ) : null}
          </div>

          {siblings.length > 1 ? (
            <div className="card p-4">
              <SectionHeading title="صفحه‌های این روز" className="mb-3" />
              <div className="space-y-1.5">
                {siblings.map((sibling) => (
                  <Link
                    key={sibling.id}
                    href={`/app/reports/${sibling.id}`}
                    className={`flex items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-[0.65rem] transition-colors ${
                      sibling.id === report.id ? "bg-violet-soft font-bold text-violet-deep" : "text-muted hover:bg-paper"
                    }`}
                  >
                    <span>{reportEntryTitle(sibling.entryIndex)}</span>
                    {sibling.id === report.id ? <StarIcon /> : <ArrowRight className="size-3 rotate-180" aria-hidden="true" />}
                  </Link>
                ))}
              </div>
            </div>
          ) : null}

          <Link href="/app/reports/new" className="card group flex items-center gap-3 p-4 transition-transform hover:-translate-y-0.5">
            <span className="flex size-9 items-center justify-center rounded-xl bg-coral-soft text-[#c73554]">
              <NotebookPen className="size-4" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-bold">نوشتن گزارش تازه</p>
              <p className="mt-0.5 text-[0.6rem] text-muted">یک صفحهٔ دیگر برای امروز</p>
            </div>
            <ArrowRight className="mr-auto size-4 text-muted transition-transform group-hover:-translate-x-1" aria-hidden="true" />
          </Link>
        </aside>
      </div>
    </div>
  );
}

function StarIcon() {
  return <span className="size-2 rounded-full bg-violet" aria-hidden="true" />;
}
