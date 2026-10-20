import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Clock3,
  GraduationCap,
  ScrollText,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { requireOnboardedUser } from "@/server/auth/session";
import { getCard } from "@/server/services/cards";
import { formatPeriodLabel, formatShortDate } from "@/lib/dates";
import {
  faDecimal,
  faMinutes,
  faNum,
  faPercent,
  faScoreFromPercent,
} from "@/lib/format";
import { goalMetricLabel } from "@/lib/constants";
import { BrandMark } from "@/components/brand";
import { PrintButton } from "@/components/print-button";
import { SubjectIcon } from "@/components/subject-icon";
import { Delta } from "@/components/ui/page";
import type { ReportCardGoal } from "@/lib/types";

export const metadata: Metadata = { title: "کارنامه" };
export const dynamic = "force-dynamic";

export default async function CardDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireOnboardedUser();
  const { id } = await params;
  let card;
  try {
    card = getCard(user.id, id);
  } catch {
    notFound();
  }
  const data = card.data;
  const typeLabel = data.type === "weekly" ? "کارنامهٔ هفتگی" : "کارنامهٔ ماهانه";

  return (
    <div className="mx-auto max-w-4xl">
      <div className="no-print mb-5 flex flex-wrap items-center justify-between gap-3">
        <Link href="/app/cards" className="btn btn-ghost min-h-9 px-2.5 text-xs">
          <ArrowRight className="size-4" aria-hidden="true" />
          همهٔ کارنامه‌ها
        </Link>
        <div className="flex items-center gap-2">
          <span className="hidden text-[0.65rem] text-muted sm:inline">برای چاپ، نسخهٔ A4 آماده می‌شود.</span>
          <PrintButton />
        </div>
      </div>

      <div className="print-area space-y-4">
        <article className="print-card overflow-hidden rounded-[1.75rem] border border-line bg-white shadow-[0_28px_70px_-42px_rgba(42,31,82,0.4)]">
          <header className="relative overflow-hidden border-b border-line bg-[#f7f2e9] p-5 sm:p-6">
            <div className="pointer-events-none absolute -left-10 -top-16 size-48 rounded-full border border-violet/10" aria-hidden="true" />
            <div className="relative flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <BrandMark size={42} />
                <div>
                  <p className="font-display text-lg leading-tight text-ink">دفتر ستاره</p>
                  <p className="mt-1 text-[0.6rem] text-muted">{typeLabel} • {formatPeriodLabel({ start: data.periodStart, end: data.periodEnd }, data.type)}</p>
                </div>
              </div>
              <div className="text-left">
                <span className="rounded-full bg-white px-3 py-1 text-[0.6rem] font-bold text-violet-deep shadow-sm">
                  {data.type === "weekly" ? "هفتگی" : "ماهانه"}
                </span>
                <p className="mt-2 text-[0.55rem] text-muted">
                  {formatShortDate(data.periodStart)} تا {formatShortDate(data.periodEnd)}
                </p>
              </div>
            </div>
            <div className="relative mt-5 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-[0.62rem] text-muted">جمع‌بندی این دوره</p>
                <h1 className="mt-1 text-xl font-extrabold text-ink sm:text-2xl">{data.title}</h1>
              </div>
              <div className="rounded-2xl border border-violet/15 bg-white/80 px-4 py-2.5 text-left">
                <p className="text-[0.55rem] text-muted">میانگین دوره</p>
                <p className="num mt-0.5 text-2xl font-extrabold text-ink">
                  {data.overallPercent === null ? "—" : faScoreFromPercent(data.overallPercent, data.gradeScale)}
                  <span className="mr-1 text-[0.6rem] font-medium text-muted">از {faNum(data.gradeScale)}</span>
                </p>
              </div>
            </div>
          </header>

          <div className="grid grid-cols-2 divide-x divide-x-reverse divide-y divide-line border-b border-line sm:grid-cols-3">
            <SummaryCell label="مطالعهٔ دوره" value={faMinutes(data.studyMinutes)} icon={<Clock3 className="size-3.5" />} />
            <SummaryCell label="روزهای گزارش" value={`${faNum(data.reportDays)} روز`} icon={<CalendarDays className="size-3.5" />} />
            <SummaryCell label="آزمون‌های دارای نمره" value={`${faNum(data.gradedExamCount)} آزمون`} icon={<GraduationCap className="size-3.5" />} />
            <SummaryCell label="تکمیل برنامه" value={faPercent(data.planCompletion)} icon={<Target className="size-3.5" />} />
            <SummaryCell label="کارهای انجام‌شده" value={`${faNum(data.tasksCompleted)} کار`} icon={<CheckCircle2 className="size-3.5" />} />
            <SummaryCell label="میانگین همیشگی" value={data.allTimeScale === null ? "—" : faDecimal(data.allTimeScale)} icon={<BarChart3 className="size-3.5" />} />
          </div>

          <div className="p-5 sm:p-6">
            <div className="rounded-2xl border border-violet/15 bg-violet-soft/40 p-4">
              <p className="flex items-center gap-1.5 text-[0.65rem] font-bold text-violet-deep">
                <Sparkles className="size-3.5" aria-hidden="true" />
                روایت این دوره
              </p>
              <div className="mt-2 space-y-1.5">
                {data.summaryLines.length > 0 ? (
                  data.summaryLines.map((line) => (
                    <p key={line} className="text-[0.7rem] leading-6 text-ink-soft">• {line}</p>
                  ))
                ) : (
                  <p className="text-[0.7rem] leading-6 text-muted">داده‌ای برای جمع‌بندی این دوره ثبت نشده است.</p>
                )}
              </div>
            </div>

            <div className="mt-5 grid gap-5 sm:grid-cols-[1.2fr_1fr]">
              <section>
                <SectionTitle title="میانگین درس‌ها" icon={<GraduationCap className="size-4" />} />
                {data.subjectStats.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-line bg-[#fdfaf4] px-3 py-5 text-center text-[0.65rem] text-muted">
                    در این دوره آزمون دارای نمره ثبت نشده است.
                  </p>
                ) : (
                  <div className="overflow-hidden rounded-xl border border-line">
                    <table className="w-full text-right text-[0.65rem]">
                      <thead className="bg-[#f7f2e9] text-[0.58rem] text-muted">
                        <tr>
                          <th className="px-3 py-2 font-bold">درس</th>
                          <th className="px-2 py-2 font-bold">میانگین</th>
                          <th className="px-2 py-2 font-bold">آزمون</th>
                          <th className="px-2 py-2 font-bold">تغییر</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line">
                        {data.subjectStats.map((subject) => (
                          <tr key={subject.subjectId}>
                            <td className="px-3 py-2.5">
                              <div className="flex items-center gap-1.5">
                                <SubjectIcon icon={subject.subjectIcon} color={subject.subjectColor} size="sm" className="size-6 rounded-md" />
                                <span className="font-semibold">{subject.subjectName}</span>
                              </div>
                            </td>
                            <td className="num px-2 py-2.5 font-bold">{faDecimal(subject.scaleValue)}</td>
                            <td className="num px-2 py-2.5 text-muted">{faNum(subject.examCount)}</td>
                            <td className="px-2 py-2.5">
                              <Delta value={subject.changeFromPrevious ?? 0} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              <section>
                <SectionTitle title="نقشهٔ نمره‌ها" icon={<BarChart3 className="size-4" />} />
                <div className="rounded-xl border border-line bg-[#fdfaf4] p-3">
                  <div className="space-y-2">
                    {data.gradeDistribution.map((bucket) => {
                      const share = data.gradedExamCount > 0 ? Math.round((bucket.count / data.gradedExamCount) * 100) : 0;
                      return (
                        <div key={bucket.label}>
                          <div className="flex justify-between text-[0.58rem]">
                            <span className="text-muted">{bucket.label}</span>
                            <span className="num font-semibold">{faNum(bucket.count)}</span>
                          </div>
                          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-paper-deep">
                            <div className="h-full rounded-full bg-violet" style={{ width: `${share}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-mint/25 bg-mint-soft/35 p-3.5">
                <p className="flex items-center gap-1.5 text-[0.62rem] font-bold text-[#157a5b]">
                  <TrendingUp className="size-3.5" aria-hidden="true" />
                  نقاط قوت
                </p>
                {data.strengths.length > 0 ? (
                  <div className="mt-2 space-y-1.5">
                    {data.strengths.map((item) => (
                      <p key={item} className="text-[0.65rem] leading-5 text-ink-soft">• {item}</p>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-[0.65rem] text-muted">برای این دوره نقطهٔ قوتی ثبت نشده است.</p>
                )}
              </div>
              <div className="rounded-xl border border-gold/30 bg-gold-soft/35 p-3.5">
                <p className="flex items-center gap-1.5 text-[0.62rem] font-bold text-[#7c5c12]">
                  <TrendingDown className="size-3.5" aria-hidden="true" />
                  نیازمند توجه
                </p>
                {data.needsAttention.length > 0 ? (
                  <div className="mt-2 space-y-1.5">
                    {data.needsAttention.map((item) => (
                      <p key={item} className="text-[0.65rem] leading-5 text-ink-soft">• {item}</p>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-[0.65rem] text-muted">مورد خاصی برای توجه پیدا نشد.</p>
                )}
              </div>
            </div>

            <section className="mt-5">
              <SectionTitle title="آزمون‌های این دوره" icon={<ScrollText className="size-4" />} />
              {data.exams.length === 0 ? (
                <p className="rounded-xl border border-dashed border-line bg-[#fdfaf4] px-3 py-5 text-center text-[0.65rem] text-muted">
                  آزمونی با نمره در این دوره ثبت نشده است.
                </p>
              ) : (
                <div className="overflow-hidden rounded-xl border border-line">
                  <table className="w-full text-right text-[0.65rem]">
                    <thead className="bg-[#f7f2e9] text-[0.58rem] text-muted">
                      <tr>
                        <th className="px-3 py-2 font-bold">آزمون</th>
                        <th className="px-2 py-2 font-bold">درس</th>
                        <th className="px-2 py-2 font-bold">تاریخ</th>
                        <th className="px-2 py-2 text-left font-bold">نمره</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {data.exams.map((exam) => (
                        <tr key={exam.id}>
                          <td className="px-3 py-2.5 font-semibold">{exam.title}</td>
                          <td className="px-2 py-2.5 text-muted">{exam.subjectName}</td>
                          <td className="num px-2 py-2.5 text-muted">{formatShortDate(exam.examDate)}</td>
                          <td className="num px-2 py-2.5 text-left font-bold">
                            {faDecimal(exam.scaleValue)}
                            <span className="mr-1 text-[0.55rem] font-medium text-muted">({faNum(exam.grade)} از {faNum(exam.maxGrade)})</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {data.goals.length > 0 ? (
              <section className="mt-5">
                <SectionTitle title="هدف‌های این دوره" icon={<Target className="size-4" />} />
                <div className="grid gap-2 sm:grid-cols-2">
                  {data.goals.map((goal) => (
                    <GoalLine key={goal.id} goal={goal} />
                  ))}
                </div>
              </section>
            ) : null}

            <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-4">
              <p className="text-[0.58rem] text-muted">
                ساخته‌شده با {faNum(data.reportDays)} روز گزارش و {faNum(data.examCount)} آزمون
              </p>
              <p className="flex items-center gap-1 text-[0.58rem] text-muted">
                <Sparkles className="size-3 text-gold" aria-hidden="true" />
                یک صفحهٔ تازه، هر هفته
              </p>
            </div>
          </div>
        </article>

        <p className="no-print rounded-xl bg-paper-deep/50 px-4 py-3 text-[0.62rem] leading-6 text-muted">
          کارنامه‌ها به‌صورت خودکار ساخته می‌شوند. اگر بعد از این تاریخ گزارش یا نمره‌ای اضافه یا اصلاح کنی، نسخهٔ کارنامه با مراجعهٔ بعدی به‌روز می‌شود.
        </p>
      </div>
    </div>
  );
}

function SummaryCell({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="p-3.5">
      <p className="flex items-center gap-1 text-[0.56rem] text-muted">
        <span className="text-violet-deep">{icon}</span>
        {label}
      </p>
      <p className="num mt-1 text-sm font-extrabold text-ink">{value}</p>
    </div>
  );
}

function SectionTitle({ title, icon }: { title: string; icon: React.ReactNode }) {
  return (
    <h2 className="mb-2.5 flex items-center gap-1.5 text-xs font-bold text-ink">
      <span className="text-violet-deep">{icon}</span>
      {title}
    </h2>
  );
}

function GoalLine({ goal }: { goal: ReportCardGoal }) {
  const value =
    goal.metric === "study-minutes"
      ? `${faMinutes(goal.currentValue)} از ${faMinutes(goal.targetValue)}`
      : goal.metric === "exam-average"
        ? `${faPercent(goal.currentValue)} از ${faPercent(goal.targetValue)}`
        : `${faNum(goal.currentValue)} از ${faNum(goal.targetValue)} کار`;
  return (
    <div className="rounded-xl border border-line bg-[#fdfaf4] p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-[0.65rem] font-semibold">{goal.title}</p>
        <span className={`num text-[0.6rem] font-bold ${goal.achieved ? "text-[#157a5b]" : "text-muted"}`}>{faPercent(goal.percent)}</span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-paper-deep">
        <div className={`h-full rounded-full ${goal.achieved ? "bg-mint" : "bg-violet"}`} style={{ width: `${goal.percent}%` }} />
      </div>
      <p className="mt-1.5 text-[0.56rem] text-muted">{goalMetricLabel(goal.metric)} • {value}</p>
    </div>
  );
}
