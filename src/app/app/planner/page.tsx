import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, ChevronLeft, ChevronRight, Target } from "lucide-react";
import { requireOnboardedUser } from "@/server/auth/session";
import { getSessions, getSeriesList } from "@/server/services/planner";
import { computeGoalProgress, getGoals } from "@/server/services/goals";
import { getSubjects } from "@/server/services/subjects";
import {
  addDaysISO,
  formatFullDate,
  formatPeriodLabel,
  isValidISODate,
  todayISO,
  weekRange,
} from "@/lib/dates";
import { PageHeader } from "@/components/ui/page";
import { PlannerBoard, type SeriesWithSample } from "./planner-board";

export const metadata: Metadata = { title: "برنامهٔ مطالعه" };
export const dynamic = "force-dynamic";

function resolveWeek(value: string | undefined): string {
  return value && isValidISODate(value) ? value : todayISO();
}

export default async function PlannerPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const user = await requireOnboardedUser();
  const params = await searchParams;
  const today = todayISO();
  const anchor = resolveWeek(params.week);
  const range = weekRange(anchor);
  const weekDates = Array.from({ length: 7 }, (_, index) => addDaysISO(range.start, index));
  const sessions = getSessions(user.id, { from: range.start, to: range.end });
  const series = getSeriesList(user.id, range.start).map<SeriesWithSample>((item) => ({
    ...item,
    sampleSessionId: getSessions(user.id, { seriesId: item.id, limit: 1 })[0]?.id ?? null,
  }));
  const goals = getGoals(user.id).map((goal) =>
    computeGoalProgress(user.id, goal, user.gradeScale),
  );
  const subjects = getSubjects(user.id);
  const isCurrentWeek = weekRange(today).start === range.start;
  const previousWeek = addDaysISO(range.start, -7);
  const nextWeek = addDaysISO(range.start, 7);

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow={formatFullDate(today)}
        title="برنامهٔ مطالعه"
        description="هفته را روی کاغذ نیاور؛ اینجا بچین. جلسه‌های کوچک، هدف‌های روشن و ستاره‌هایی که یکی‌یکی روشن می‌شوند."
      />

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-white px-4 py-3 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-xl bg-violet-soft text-violet-deep">
            <CalendarDays className="size-4" aria-hidden="true" />
          </span>
          <div>
            <p className="text-[0.6rem] text-muted">{isCurrentWeek ? "هفتهٔ جاری" : "هفتهٔ انتخاب‌شده"}</p>
            <p className="text-sm font-extrabold text-ink">{formatPeriodLabel(range, "weekly")}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Link
            href={`/app/planner?week=${previousWeek}`}
            className="flex size-8 items-center justify-center rounded-lg border border-line text-muted transition-colors hover:border-violet/40 hover:text-violet-deep"
            aria-label="هفتهٔ قبل"
          >
            <ChevronRight className="size-4" aria-hidden="true" />
          </Link>
          <Link
            href="/app/planner"
            className="rounded-lg border border-line px-3 py-1.5 text-[0.62rem] font-semibold text-ink transition-colors hover:border-violet/40 hover:text-violet-deep"
          >
            {isCurrentWeek ? "همین هفته" : "برو به این هفته"}
          </Link>
          <Link
            href={`/app/planner?week=${nextWeek}`}
            className="flex size-8 items-center justify-center rounded-lg border border-line text-muted transition-colors hover:border-violet/40 hover:text-violet-deep"
            aria-label="هفتهٔ بعد"
          >
            <ChevronLeft className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </div>

      <PlannerBoard
        sessions={sessions}
        series={series}
        goals={goals}
        subjects={subjects}
        weekDates={weekDates}
        today={today}
        weekLabel={formatPeriodLabel(range, "weekly")}
      />

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-gold/20 bg-gold-soft/40 px-4 py-3">
        <Target className="size-5 shrink-0 text-[#8b6410]" aria-hidden="true" />
        <p className="text-[0.65rem] leading-6 text-[#7c5c12]">
          هدف‌ها از گزارش‌های روزانه و آزمون‌های همین بازه محاسبه می‌شوند. اگر هدفی را متوقف کنی، پیشرفتش پاک نمی‌شود و
          هر وقت خواستی می‌توانی دوباره فعالش کنی.
        </p>
      </div>
    </div>
  );
}
