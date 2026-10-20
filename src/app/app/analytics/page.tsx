import type { Metadata } from "next";
import Link from "next/link";
import {
  Activity,
  ArrowUpRight,
  BarChart3,
  BookOpenCheck,
  CalendarRange,
  CheckCircle2,
  Clock3,
  Flame,
  GraduationCap,
  Lightbulb,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { requireOnboardedUser } from "@/server/auth/session";
import { buildAnalytics } from "@/server/services/analytics";
import {
  analyticsRangeDisplay,
  analyticsRangeLabel,
  type AnalyticsRange,
} from "@/lib/dates";
import { faDecimal, faMinutes, faNum, faPercent } from "@/lib/format";
import { goalPeriodLabel, subjectColor } from "@/lib/constants";
import { cn } from "@/lib/cn";
import { Delta, EmptyState, PageHeader, SectionHeading, StatCard } from "@/components/ui/page";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { SubjectIcon } from "@/components/subject-icon";
import { DistributionChart, GradeTrendChart, MonthlyStudyChart, SubjectBarsChart, WeeklyStudyChart } from "@/components/charts/charts";

export const metadata: Metadata = { title: "تحلیل روند" };
export const dynamic = "force-dynamic";

const RANGES: AnalyticsRange[] = ["this-month", "last-month", "last-30", "last-90", "all"];
const RANGE_HINTS: Record<AnalyticsRange, string> = {
  "this-month": "از اول ماه تا امروز",
  "last-month": "ماه کامل گذشته",
  "last-30": "۳۰ روز منتهی به امروز",
  "last-90": "۹۰ روز منتهی به امروز",
  all: "همهٔ داده‌های ثبت‌شده",
};

function resolveRange(value: string | undefined): AnalyticsRange {
  return RANGES.includes(value as AnalyticsRange) ? (value as AnalyticsRange) : "this-month";
}

function comparisonValue(value: number | null, unit: "percent" | "minutes" | "count"): string {
  if (value === null) return "—";
  if (unit === "minutes") return faMinutes(value);
  if (unit === "percent") return faPercent(value);
  return `${faNum(value)} کار`;
}

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const user = await requireOnboardedUser();
  const params = await searchParams;
  const range = resolveRange(params.range);
  const data = buildAnalytics(user, range);
  const subjectsWithExams = data.subjectStats.filter((subject) => subject.examCount > 0);
  const sorted = [...subjectsWithExams].sort((a, b) => b.averagePercent - a.averagePercent);
  const strengths = sorted.slice(0, 3);
  const needsWork = [...sorted].reverse().slice(0, 3);
  const hasData =
    data.examCount > 0 ||
    data.studyMinutes > 0 ||
    data.totalSessions > 0 ||
    data.taskCompleted > 0;

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={analyticsRangeDisplay(data.range)}
        title="تحلیل روند"
        description="عددها فقط برای قضاوت نیستند؛ برای پیدا کردن مسیر بهترند. اینجا ببین کجا رشد کردی و کجا باید یک قدم کوچک برداری."
        actions={
          <Link href="/app/planner" className="btn btn-secondary text-xs">
            <CalendarRange className="size-4" aria-hidden="true" />
            رفتن به برنامه
          </Link>
        }
      />

      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-line bg-white p-2 shadow-sm">
        {RANGES.map((item) => (
          <Link
            key={item}
            href={`/app/analytics?range=${item}`}
            className={cn(
              "rounded-lg px-3 py-2 text-[0.68rem] font-semibold transition-colors",
              item === range
                ? "bg-violet text-white shadow-sm"
                : "text-muted hover:bg-paper hover:text-ink",
            )}
          >
            {analyticsRangeLabel(item)}
          </Link>
        ))}
        <span className="mr-auto hidden text-[0.58rem] text-muted sm:block">{RANGE_HINTS[range]}</span>
      </div>

      {data.dataWarnings.length > 0 ? (
        <div className="rounded-2xl border border-gold/25 bg-gold-soft/40 px-4 py-3">
          <p className="flex items-center gap-1.5 text-[0.68rem] font-bold text-[#7c5c12]">
            <Lightbulb className="size-4" aria-hidden="true" />
            برای تحلیل دقیق‌تر
          </p>
          <ul className="mt-1.5 space-y-1 pr-5 text-[0.62rem] leading-5 text-[#7c5c12]">
            {data.dataWarnings.map((warning) => (
              <li key={warning} className="list-disc">{warning}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 lg:grid-cols-5">
        <StatCard
          label="میانگین آزمون‌ها"
          value={data.overallPercent === null ? "—" : faPercent(data.overallPercent)}
          hint={
            data.overallScale === null
              ? "آزمون نمره‌دار نداری"
              : `${faDecimal(data.overallScale)} از ${faNum(data.scale)}`
          }
          icon={<GraduationCap className="size-4" aria-hidden="true" />}
          tone="violet"
          delta={data.previousOverallChange}
        />
        <StatCard
          label="زمان مطالعه"
          value={faMinutes(data.studyMinutes)}
          hint={data.previousStudyMinutes === null ? "در این بازه" : `قبلاً ${faMinutes(data.previousStudyMinutes)}`}
          icon={<Clock3 className="size-4" aria-hidden="true" />}
          tone="sky"
        />
        <StatCard
          label="جلسه‌های انجام‌شده"
          value={data.completionRate === null ? "—" : faPercent(data.completionRate)}
          hint={`${faNum(data.completedSessions)} از ${faNum(data.totalSessions)} جلسه`}
          icon={<CheckCircle2 className="size-4" aria-hidden="true" />}
          tone="mint"
        />
        <StatCard
          label="روزهای پیوسته"
          value={`${faNum(data.streak)} روز`}
          hint="گزارش یا جلسهٔ انجام‌شده"
          icon={<Flame className="size-4" aria-hidden="true" />}
          tone="coral"
        />
        <StatCard
          label="کارهای تمام‌شده"
          value={faNum(data.taskCompleted)}
          hint={`${faNum(data.taskPending)} کار هنوز باز`}
          icon={<BookOpenCheck className="size-4" aria-hidden="true" />}
          tone="gold"
        />
      </div>

      {!hasData ? (
        <EmptyState
          icon={<BarChart3 className="size-5" aria-hidden="true" />}
          title="هنوز داده‌ای برای تحلیل نیست"
          description="یک گزارش روزانه یا یک آزمون ثبت کن تا این صفحه کم‌کم تصویر واقعی پیشرفتت را نشان بدهد."
          action={
            <Link href="/app/reports/new" className="btn btn-primary text-xs">
              ثبت گزارش روزانه
            </Link>
          }
        />
      ) : (
        <>
          <section className="card p-4 sm:p-5">
            <SectionHeading
              title="مقایسه با بازهٔ قبل"
              description="همین معیارها در بازهٔ قبل چه عددی بودند؟"
              icon={<Activity className="size-4" aria-hidden="true" />}
            />
            <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
              {data.periodComparison.map((item) => {
                const hasPrevious = item.previous !== null;
                const current = item.current ?? 0;
                const previous = item.previous ?? 0;
                const ratio =
                  hasPrevious && Math.max(current, previous) > 0
                    ? Math.round((current / Math.max(current, previous)) * 100)
                    : current > 0
                      ? 100
                      : 0;
                const difference = hasPrevious ? current - previous : null;
                return (
                  <div key={item.label} className="rounded-xl border border-line/80 bg-[#fcfaf6] px-3.5 py-3">
                    <p className="text-[0.62rem] font-semibold text-muted">{item.label}</p>
                    <div className="mt-1 flex items-end justify-between gap-2">
                      <p className="text-base font-extrabold text-ink">{comparisonValue(item.current, item.unit)}</p>
                      {difference !== null ? (
                        <Delta
                          value={difference}
                          suffix={
                            item.unit === "percent"
                              ? "واحد درصد"
                              : item.unit === "minutes"
                                ? "دقیقه"
                                : "کار"
                          }
                        />
                      ) : (
                        <span className="text-[0.58rem] text-muted">بدون بازهٔ قبل</span>
                      )}
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[0.55rem] text-muted">
                      <span>بازهٔ قبل: {comparisonValue(item.previous, item.unit)}</span>
                      <span>{faPercent(ratio)}</span>
                    </div>
                    <Progress
                      value={ratio}
                      tone={item.unit === "minutes" ? "sky" : item.unit === "percent" ? "violet" : "mint"}
                      className="mt-1.5 h-1.5"
                    />
                  </div>
                );
              })}
            </div>
          </section>

          <div className="grid gap-4 lg:grid-cols-2">
            <section className="card p-4 sm:p-5">
              <SectionHeading
                title="مطالعه در هفته‌ها"
                description="زمان ثبت‌شده در گزارش‌ها، هفته به هفته"
                icon={<Clock3 className="size-4" aria-hidden="true" />}
              />
              {data.weeklyStudy.some((item) => item.minutes > 0 || item.plannedMinutes > 0) ? (
                <WeeklyStudyChart data={data.weeklyStudy} />
              ) : (
                <p className="rounded-xl bg-paper px-3 py-8 text-center text-xs text-muted">داده‌ای برای نمایش نیست.</p>
              )}
            </section>

            <section className="card p-4 sm:p-5">
              <SectionHeading
                title="روند نمره‌ها"
                description="درصد هر آزمون نمره‌دار، به ترتیب تاریخ"
                icon={<TrendingUp className="size-4" aria-hidden="true" />}
              />
              {data.examTrend.length > 0 ? (
                <GradeTrendChart data={data.examTrend} />
              ) : (
                <p className="rounded-xl bg-paper px-3 py-8 text-center text-xs text-muted">آزمون نمره‌داری در این بازه نیست.</p>
              )}
            </section>

            <section className="card p-4 sm:p-5">
              <SectionHeading
                title="میانگین هر درس"
                description="درس‌هایی که در این بازه آزمون داشته‌اند"
                icon={<BarChart3 className="size-4" aria-hidden="true" />}
              />
              {subjectsWithExams.length > 0 ? (
                <SubjectBarsChart data={subjectsWithExams} />
              ) : (
                <p className="rounded-xl bg-paper px-3 py-8 text-center text-xs text-muted">برای مقایسهٔ درس‌ها هنوز آزمونی ثبت نشده.</p>
              )}
            </section>

            <section className="card p-4 sm:p-5">
              <SectionHeading
                title="پراکندگی نمره‌ها"
                description="تعداد آزمون‌ها در هر بازهٔ درصدی"
                icon={<Activity className="size-4" aria-hidden="true" />}
              />
              {data.examTrend.length > 0 ? (
                <DistributionChart data={data.gradeDistribution} />
              ) : (
                <p className="rounded-xl bg-paper px-3 py-8 text-center text-xs text-muted">داده‌ای برای نمایش نیست.</p>
              )}
            </section>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <section className="card p-4 sm:p-5">
              <SectionHeading
                title="ماه به ماه"
                description="روند کلی زمان مطالعه در شش ماه اخیر"
                icon={<CalendarRange className="size-4" aria-hidden="true" />}
              />
              {data.monthlyStudy.some((item) => item.minutes > 0) ? (
                <MonthlyStudyChart data={data.monthlyStudy} />
              ) : (
                <p className="rounded-xl bg-paper px-3 py-8 text-center text-xs text-muted">زمان مطالعه‌ای در گزارش‌ها ثبت نشده.</p>
              )}
            </section>

            <section className="card p-4 sm:p-5">
              <SectionHeading
                title="هدف‌های فعال"
                description="پیشرفت هدف‌ها از ابتدای بازهٔ هدف"
                icon={<Target className="size-4" aria-hidden="true" />}
              />
              {data.goals.length === 0 ? (
                <div className="rounded-xl bg-paper px-4 py-6 text-center">
                  <p className="text-xs font-semibold text-ink">هدف فعالی نداری.</p>
                  <Link href="/app/planner" className="mt-2 inline-block text-[0.62rem] font-semibold text-violet-deep">
                    ساختن هدف در برنامهٔ مطالعه
                  </Link>
                </div>
              ) : (
                <ul className="space-y-3">
                  {data.goals.map((progress) => (
                    <li key={progress.goal.id}>
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-[0.68rem] font-semibold text-ink">{progress.goal.title}</p>
                        <span className="shrink-0 text-[0.58rem] text-muted">
                          {progress.achieved ? "رسیدی" : `${faPercent(progress.percent)}`}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[0.55rem] text-muted">
                        {progress.label} · {goalPeriodLabel(progress.goal.period)}
                      </p>
                      <Progress
                        value={progress.percent}
                        tone={progress.achieved ? "mint" : "violet"}
                        className="mt-1.5 h-1.5"
                      />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <section className="card p-4 sm:p-5">
              <SectionHeading
                title="نقاط قوت"
                description="درس‌هایی که میانگین بالاتری داری"
                icon={<TrendingUp className="size-4" aria-hidden="true" />}
              />
              {strengths.length === 0 ? (
                <p className="rounded-xl bg-paper px-3 py-5 text-center text-xs text-muted">هنوز آزمون نمره‌داری نیست.</p>
              ) : (
                <div className="space-y-2">
                  {strengths.map((subject) => (
                    <SubjectRow key={subject.subjectId} subject={subject} positive />
                  ))}
                </div>
              )}
            </section>

            <section className="card p-4 sm:p-5">
              <SectionHeading
                title="جای رشد"
                description="درس‌هایی که با یک برنامهٔ کوچک بهتر می‌شوند"
                icon={<TrendingDown className="size-4" aria-hidden="true" />}
              />
              {needsWork.length === 0 ? (
                <p className="rounded-xl bg-paper px-3 py-5 text-center text-xs text-muted">هنوز آزمون نمره‌داری نیست.</p>
              ) : (
                <div className="space-y-2">
                  {needsWork.map((subject) => (
                    <SubjectRow key={subject.subjectId} subject={subject} positive={false} />
                  ))}
                </div>
              )}
            </section>
          </div>

          {subjectsWithExams.length > 0 ? (
            <section className="card overflow-hidden">
              <div className="border-b border-line px-4 py-4 sm:px-5">
                <SectionHeading
                  title="جدول درس‌ها"
                  description="مقایسهٔ میانگین دوره با میانگین کل و تغییر نسبت به بازهٔ قبل"
                  icon={<Sparkles className="size-4" aria-hidden="true" />}
                  className="mb-0"
                />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[36rem] text-right text-[0.68rem]">
                  <thead>
                    <tr className="border-b border-line bg-paper/60 text-[0.58rem] text-muted">
                      <th className="px-4 py-2.5 font-semibold">درس</th>
                      <th className="px-3 py-2.5 font-semibold">آزمون</th>
                      <th className="px-3 py-2.5 font-semibold">میانگین دوره</th>
                      <th className="px-3 py-2.5 font-semibold">میانگین کل</th>
                      <th className="px-3 py-2.5 font-semibold">بهترین</th>
                      <th className="px-3 py-2.5 font-semibold">تغییر</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.subjectStats.map((subject) => (
                      <tr key={subject.subjectId} className="border-b border-line/60 last:border-0">
                        <td className="px-4 py-2.5">
                          <span className="flex items-center gap-2 font-semibold text-ink">
                            <SubjectIcon icon={subject.subjectIcon} color={subject.subjectColor} className="size-6 rounded-md" />
                            {subject.subjectName}
                          </span>
                        </td>
                        <td className="num px-3 py-2.5 text-muted">{faNum(subject.examCount)}</td>
                        <td className="px-3 py-2.5 font-bold text-ink">
                          {subject.examCount ? faPercent(subject.averagePercent) : "—"}
                        </td>
                        <td className="px-3 py-2.5 text-muted">
                          {subject.allTimePercent === null ? "—" : faPercent(subject.allTimePercent)}
                        </td>
                        <td className="px-3 py-2.5 text-muted">
                          {subject.examCount ? faPercent(subject.highestPercent) : "—"}
                        </td>
                        <td className="px-3 py-2.5">
                          {subject.changeFromPrevious === null ? (
                            <span className="text-muted">—</span>
                          ) : (
                            <Delta value={subject.changeFromPrevious} suffix="واحد" />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}
        </>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-violet/20 bg-violet-soft/40 px-4 py-3">
        <p className="text-[0.65rem] leading-6 text-violet-deep">
          یک پیشنهاد ساده: درسی را که «جای رشد» است انتخاب کن و همین هفته دو جلسهٔ کوتاه برایش در برنامه بگذار.
        </p>
        <Link href="/app/planner" className="btn btn-secondary text-[0.65rem]">
          برنامه‌ریزی برای رشد
          <ArrowUpRight className="size-3.5" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}

function SubjectRow({
  subject,
  positive,
}: {
  subject: {
    subjectId: string;
    subjectName: string;
    subjectColor: string;
    subjectIcon: string;
    examCount: number;
    averagePercent: number;
    allTimePercent: number | null;
  };
  positive: boolean;
}) {
  const color = subjectColor(subject.subjectColor);
  return (
    <div className="rounded-xl border border-line/80 bg-[#fcfaf6] px-3 py-2.5">
      <div className="flex items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-2">
          <SubjectIcon icon={subject.subjectIcon} color={subject.subjectColor} className="size-7 rounded-lg" />
          <span className="truncate text-[0.68rem] font-semibold text-ink">{subject.subjectName}</span>
          <Badge tone={positive ? "mint" : "coral"}>{faNum(subject.examCount)} آزمون</Badge>
        </span>
        <span className="num shrink-0 text-xs font-extrabold" style={{ color: color.hex }}>
          {faPercent(subject.averagePercent)}
        </span>
      </div>
      <Progress value={subject.averagePercent} tone={positive ? "mint" : "coral"} className="mt-2 h-1.5" />
      <p className="mt-1 text-[0.55rem] text-muted">
        میانگین کل: {subject.allTimePercent === null ? "—" : faPercent(subject.allTimePercent)}
      </p>
    </div>
  );
}

