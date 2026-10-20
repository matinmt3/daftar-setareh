import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CalendarDays, NotebookPen, Pencil } from "lucide-react";
import { requireOnboardedUser } from "@/server/auth/session";
import { getReportsForDate } from "@/server/services/reports";
import { listSubjects } from "@/server/repositories/subjects";
import { isValidISODate, todayISO } from "@/lib/dates";
import { reportEntryTitle } from "@/lib/constants";
import { PageHeader } from "@/components/ui/page";
import { ReportForm } from "../report-form";

export const metadata: Metadata = { title: "ثبت گزارش روزانه" };
export const dynamic = "force-dynamic";

export default async function NewReportPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; additional?: string }>;
}) {
  const user = await requireOnboardedUser();
  const params = await searchParams;
  const reportDate = params.date && isValidISODate(params.date) ? params.date : todayISO();
  const additional = params.additional === "1";
  const subjects = listSubjects(user.id);
  const existingReports = getReportsForDate(user.id, reportDate);
  const existing = existingReports[0] ?? null;

  if (existing && !additional) {
    return (
      <div className="mx-auto max-w-2xl">
        <PageHeader
          eyebrow="گزارش روزانه"
          title="این روز قبلاً ثبت شده است"
          description="برای این تاریخ یک گزارش اصلی داری. می‌توانی آن را ویرایش کنی یا یک گزارش تکمیلی برای همین روز بسازی."
          backHref="/app/reports"
          backLabel="همهٔ گزارش‌ها"
        />
        <div className="card overflow-hidden">
          <div className="bg-gradient-to-br from-violet/95 to-[#8b7cff] p-5 text-white">
            <div className="flex items-center gap-2 text-xs text-white/75">
              <CalendarDays className="size-4" aria-hidden="true" />
              {existingReports.length > 1 ? `${existingReports.length} گزارش برای این روز` : "یک گزارش ثبت‌شده"}
            </div>
            <p className="mt-2 text-lg font-extrabold">{reportEntryTitle(existing.entryIndex)}</p>
            <p className="mt-1 text-xs text-white/70">
              {existing.subjectCount > 0 ? `${existing.subjectCount} درس ثبت شده` : "بدون درس"} •{" "}
              {existing.completedTasks + existing.pendingTasks > 0
                ? `${existing.completedTasks + existing.pendingTasks} کار`
                : "بدون کار"}
            </p>
          </div>
          <div className="flex flex-col gap-2 p-5 sm:flex-row">
            <Link href={`/app/reports/${existing.id}`} className="btn btn-secondary flex-1 text-xs">
              <NotebookPen className="size-4" aria-hidden="true" />
              دیدن گزارش
            </Link>
            <Link href={`/app/reports/${existing.id}/edit`} className="btn btn-secondary flex-1 text-xs">
              <Pencil className="size-4" aria-hidden="true" />
              ویرایش گزارش
            </Link>
            <Link
              href={`/app/reports/new?date=${reportDate}&additional=1`}
              className="btn btn-primary flex-1 text-xs"
            >
              گزارش تکمیلی
              <ArrowRight className="size-4 rotate-180" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        eyebrow="گزارش روزانه"
        title={additional ? "افزودن مطالعهٔ امروز" : "ثبت مطالعه"}
        description={
          additional
            ? "مطالعهٔ جدید به جمع امروز اضافه می‌شود؛ زمان‌های قبلی را دوباره وارد نکن."
            : "فقط زمان درس‌هایی را که خوانده‌ای وارد کن. بقیهٔ بخش‌ها اختیاری هستند."
        }
        backHref="/app/reports"
        backLabel="همهٔ گزارش‌ها"
      />
      <ReportForm
        subjects={subjects}
        initialDate={reportDate}
        allowAdditional={additional}
        existingCount={existingReports.length}
      />
    </div>
  );
}
