import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireOnboardedUser } from "@/server/auth/session";
import { getReport } from "@/server/services/reports";
import { listSubjects } from "@/server/repositories/subjects";
import { reportEntryTitle } from "@/lib/constants";
import { PageHeader } from "@/components/ui/page";
import { ReportForm } from "../../report-form";

export const metadata: Metadata = { title: "ویرایش گزارش" };
export const dynamic = "force-dynamic";

export default async function EditReportPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireOnboardedUser();
  const { id } = await params;
  let report;
  try {
    report = getReport(user.id, id);
  } catch {
    notFound();
  }
  const subjects = listSubjects(user.id, true);

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        eyebrow={reportEntryTitle(report.entryIndex)}
        title="ویرایش صفحهٔ دفتر"
        description="هر چیزی را می‌توانی اصلاح کنی؛ میانگین‌ها و کارنامه‌ها بعد از ذخیره دوباره ساخته می‌شوند."
        backHref={`/app/reports/${report.id}`}
        backLabel="بازگشت به گزارش"
      />
      <ReportForm
        subjects={subjects}
        initialDate={report.reportDate}
        initialReport={report}
        allowAdditional
        existingCount={1}
      />
    </div>
  );
}
