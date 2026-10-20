import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, CalendarClock, CheckCircle2, GraduationCap, NotebookPen, Plus, Target } from "lucide-react";
import { requireOnboardedUser } from "@/server/auth/session";
import { buildDashboard } from "@/server/services/dashboard";
import { formatFullDate, formatShortDate, formatTimePersian, relativeDayLabel } from "@/lib/dates";
import { faMinutes, faNum, faScoreFromPercent } from "@/lib/format";
import { PageHeader, SectionHeading } from "@/components/ui/page";
import { Progress } from "@/components/ui/progress";
import { SessionCompleteButton } from "@/components/session-complete-button";

export const metadata: Metadata = { title: "امروز" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireOnboardedUser();
  const data = buildDashboard(user);
  const firstName = (user.name ?? "دوست من").split(" ")[0];
  const goalPercent = Math.min(100, Math.round(data.todayMinutes / Math.max(1, user.dailyGoalMinutes) * 100));
  const remaining = Math.max(0, user.dailyGoalMinutes - data.todayMinutes);
  const studyHref = data.reportToday ? "/app/reports/new?additional=1" : "/app/reports/new";

  return <div className="space-y-6">
    <PageHeader eyebrow={formatFullDate(data.today)} title="امروز" description={`${firstName}، از یک قدم کوچک شروع کن.`} />
    <section className="today-study card p-5 sm:p-7" aria-labelledby="today-study-title">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 id="today-study-title" className="text-sm font-semibold text-ink-soft">مطالعهٔ امروز</h2>
          <p className="num mt-3 text-3xl font-extrabold leading-relaxed text-ink">{faMinutes(data.todayMinutes)}</p>
          <p className="mt-1 text-sm text-muted">از هدف {faMinutes(user.dailyGoalMinutes)}</p>
        </div>
        <Link href={studyHref} className="btn btn-primary min-h-12 px-6 text-sm">
          <Plus className="size-5" aria-hidden="true" />ثبت مطالعه
        </Link>
      </div>
      <Progress value={goalPercent} label="هدف مطالعهٔ امروز" className="mt-5 h-2" />
      <p className="mt-3 flex items-center gap-2 text-sm text-muted">
        {remaining === 0 ? <CheckCircle2 className="size-4 text-violet-deep" aria-hidden="true" /> : null}
        {remaining === 0 ? "هدف امروز کامل شد. آفرین!" : `${faMinutes(remaining)} تا هدف امروز باقی مانده.`}
      </p>
      {data.reportToday && data.latestReportId ? <Link href={`/app/reports/${data.latestReportId}/edit`} className="mt-4 inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-violet-deep">
        <NotebookPen className="size-4" aria-hidden="true" />ویرایش آخرین گزارش
      </Link> : null}
    </section>
    <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(16rem,1fr)]">
      <section className="card p-5">
        <SectionHeading title="برنامهٔ امروز" action={<Link href="/app/planner" className="inline-flex min-h-10 items-center gap-1 text-sm font-semibold text-violet-deep">برنامهٔ هفته<ArrowLeft className="size-4" aria-hidden="true" /></Link>} />
        {data.todaySessions.length === 0 ? <div className="rounded-xl bg-paper p-5">
          <CalendarClock className="mb-3 size-6 text-muted" aria-hidden="true" />
          <h3 className="text-sm font-semibold">برنامهٔ امروزت خالی است</h3>
          <p className="mt-2 text-sm leading-7 text-muted">یک زمان کوتاه برای درس بعدی کنار بگذار.</p>
          <Link href="/app/planner" className="btn btn-secondary mt-4 text-sm">افزودن جلسه</Link>
        </div> : <ul className="divide-y divide-line">
          {data.todaySessions.map((session) => <li key={session.id} className="flex items-center gap-3 py-4">
            <SessionCompleteButton id={session.id} completed={session.status === "completed"} />
            <div className="min-w-0 flex-1">
              <p className={`text-sm font-semibold ${session.status === "completed" ? "text-muted line-through" : "text-ink"}`}>{session.title}</p>
              <p className="num mt-1 text-xs leading-6 text-muted">{formatTimePersian(session.startTime)} تا {formatTimePersian(session.endTime)}{session.subjectName ? ` · ${session.subjectName}` : ""}</p>
            </div>
          </li>)}
        </ul>}
      </section>
      <div className="space-y-5">
        <section className="card p-5">
          <SectionHeading title="آزمون بعدی" action={<Link href="/app/exams" className="inline-flex min-h-10 items-center text-sm text-violet-deep">همه</Link>} />
          {data.upcomingExams.length > 0 ? <ul className="space-y-4">{data.upcomingExams.slice(0, 2).map((exam) => <li key={exam.id}>
            <p className="text-sm font-semibold">{exam.title}</p>
            <p className="mt-1 text-xs leading-6 text-muted">{exam.subjectName} · {formatShortDate(exam.examDate)} · {relativeDayLabel(exam.examDate)}</p>
          </li>)}</ul> : <p className="text-sm leading-7 text-muted">آزمون پیشِ رو نداری. بعد از مشخص‌شدن تاریخ، اینجا ثبتش کن.</p>}
        </section>
        {data.activeGoals.length > 0 ? <section className="card p-5">
          <SectionHeading title="هدف نزدیک" action={<Link href="/app/planner#goals" className="inline-flex min-h-10 items-center text-sm text-violet-deep">هدف‌ها</Link>} />
          {data.activeGoals.slice(0, 2).map(({ goal, percent, label }) => <div key={goal.id} className="mt-4">
            <p className="flex items-center gap-2 text-sm font-semibold"><Target className="size-4 text-violet-deep" aria-hidden="true" />{goal.title}</p>
            <Progress value={percent} label={goal.title} className="mt-3" />
            <p className="mt-2 text-xs leading-6 text-muted">{label}</p>
          </div>)}
        </section> : null}
      </div>
    </div>
    <section className="rounded-xl border border-line bg-white" aria-label="خلاصهٔ پیشرفت">
      <dl className="grid grid-cols-1 divide-y divide-line sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        <div className="p-5"><dt className="text-sm text-muted">مطالعهٔ این هفته</dt><dd className="num mt-2 text-lg font-bold">{faMinutes(data.weeklyMinutes)}</dd></div>
        <div className="p-5"><dt className="text-sm text-muted">روزهای پیوسته</dt><dd className="num mt-2 text-lg font-bold">{faNum(data.streak)} روز</dd></div>
        <div className="p-5"><dt className="flex items-center gap-2 text-sm text-muted"><GraduationCap className="size-4" aria-hidden="true" />میانگین نمره‌ها</dt><dd className="num mt-2 text-lg font-bold">{data.overallPercent === null ? "هنوز نمره‌ای نیست" : `${faScoreFromPercent(data.overallPercent, user.gradeScale)} از ${faNum(user.gradeScale)}`}</dd></div>
      </dl>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-5 py-3">
        <span className="text-xs leading-6 text-muted">نمودارها و جزئیات در بخش تحلیل پیشرفت هستند.</span>
        <Link href="/app/analytics" className="inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-violet-deep">دیدن پیشرفت<ArrowLeft className="size-4" aria-hidden="true" /></Link>
      </div>
    </section>
  </div>;
}
