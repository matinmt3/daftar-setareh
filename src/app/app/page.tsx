import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpenCheck,
  CalendarClock,
  CheckCircle2,
  Circle,
  Flame,
  GraduationCap,
  NotebookPen,
  ScrollText,
  Sparkles,
  Star,
  Target,
  TrendingUp,
} from "lucide-react";
import { requireOnboardedUser } from "@/server/auth/session";
import { buildDashboard } from "@/server/services/dashboard";
import { listCards } from "@/server/repositories/cards";
import { currentHourTehran, formatFullDate, formatNumericDate, formatShortDate, formatTimePersian, relativeDayLabel } from "@/lib/dates";
import { faDecimal, faMinutesShort, faNum, faPercent, faScoreFromPercent, greetingForHour } from "@/lib/format";
import { gradeLabel } from "@/lib/constants";
import { examPercent } from "@/lib/grades";
import { PageHeader, SectionHeading, StatCard, Delta, EmptyState } from "@/components/ui/page";
import { Badge } from "@/components/ui/badge";
import { Progress, ProgressRing } from "@/components/ui/progress";
import { SubjectIcon, SubjectDot } from "@/components/subject-icon";
import { WeeklyStudyChart } from "@/components/charts/charts";
import { SessionCompleteButton } from "@/components/session-complete-button";

export const metadata: Metadata = { title: "داشبورد" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireOnboardedUser();
  const data = buildDashboard(user);
  const latestCard = listCards(user.id, undefined, 1)[0];
  const firstName = (user.name ?? "رفیق").split(" ")[0];
  const greeting = greetingForHour(currentHourTehran());
  const goalPercent = Math.min(100, Math.round((data.todayMinutes / Math.max(1, user.dailyGoalMinutes)) * 100));
  const weekLabels = data.weekStudyByDay.map((day) => ({
    label: `${new Intl.DateTimeFormat("fa-IR", { weekday: "narrow" }).format(new Date(`${day.date}T12:00:00`))} ${formatNumericDate(day.date).split("/").at(-1)}`,
    minutes: day.minutes,
    plannedMinutes: day.plannedMinutes,
  }));

  return (
    <div>
      <PageHeader
        eyebrow={formatFullDate(data.today)}
        title={`${greeting}، ${firstName}`}
        description="امروز یک صفحهٔ تازه از دفترت است. نگاهی به برنامه بینداز و قدم بعدی را بردار."
        actions={
          <>
            <Link href={data.reportToday ? "/app/reports/new?additional=1" : "/app/reports/new"} className="btn btn-primary text-xs">
              <NotebookPen className="size-4" aria-hidden="true" />
              {data.reportToday ? "گزارش تکمیلی" : "ثبت گزارش امروز"}
            </Link>
            <Link href="/app/planner" className="btn btn-secondary text-xs">
              <CalendarClock className="size-4" aria-hidden="true" />
              برنامهٔ هفته
            </Link>
          </>
        }
      />

      <section className="grid gap-4 xl:grid-cols-[1.45fr_1fr]">
        <div className="relative overflow-hidden rounded-[1.6rem] bg-night p-5 text-white shadow-[0_30px_70px_-32px_rgba(33,27,63,0.85)] sm:p-6">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(109,91,246,0.45),transparent_36%),radial-gradient(circle_at_90%_110%,rgba(242,116,139,0.22),transparent_34%)]" aria-hidden="true" />
          <svg className="absolute inset-0 size-full opacity-40" viewBox="0 0 500 240" fill="none" aria-hidden="true">
            <circle cx="60" cy="45" r="1.6" fill="#F4C95D" />
            <circle cx="410" cy="35" r="1.3" fill="#fff" />
            <circle cx="460" cy="170" r="2" fill="#F2748B" />
            <circle cx="330" cy="205" r="1.4" fill="#F4C95D" />
          </svg>
          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="gold" className="bg-white/10 text-[#f4d06f]">
                  <Star className="size-3 fill-current" aria-hidden="true" />
                  هدف امروز
                </Badge>
                <span className="rounded-full bg-white/10 px-2.5 py-1 text-[0.63rem] text-white/65">
                  {gradeLabel(user.gradeLevel)}
                </span>
              </div>
              <p className="mt-4 text-xs text-white/60">تا این لحظه</p>
              <div className="mt-1 flex items-end gap-2">
                <span className="num text-[2.4rem] font-extrabold leading-none">
                  {faMinutesShort(data.todayMinutes)}
                </span>
                <span className="mb-1 text-xs text-white/55">از {faMinutesShort(user.dailyGoalMinutes)}</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-[0.68rem] text-white/70">
                <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1">
                  <CheckCircle2 className="size-3 text-mint" aria-hidden="true" />
                  {faNum(data.todayCompletedTasks)} کار انجام‌شده
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1">
                  <Circle className="size-3 text-gold" aria-hidden="true" />
                  {faNum(data.todayPendingTasks)} کار باقی‌مانده
                </span>
                {data.reportToday ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-mint/15 px-2.5 py-1 text-[#a8f0d7]">
                    <CheckCircle2 className="size-3" aria-hidden="true" />
                    گزارش امروز ثبت شده
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-coral/15 px-2.5 py-1 text-[#ffc2cd]">
                    <NotebookPen className="size-3" aria-hidden="true" />
                    گزارش امروز هنوز ثبت نشده
                  </span>
                )}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-4 self-start sm:self-center">
              <ProgressRing value={goalPercent} size={112} stroke={9} color="#F4C95D" track="rgba(255,255,255,0.12)">
                <span className="num text-2xl font-extrabold">{faNum(goalPercent)}٪</span>
                <span className="mt-0.5 text-[0.55rem] text-white/55">از هدف</span>
              </ProgressRing>
              <div className="space-y-2.5">
                <div className="flex items-center gap-2">
                  <span className="flex size-8 items-center justify-center rounded-xl bg-coral/15 text-coral">
                    <Flame className="size-4" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="num text-sm font-bold">{faNum(data.streak)} روز</p>
                    <p className="text-[0.58rem] text-white/50">زنجیرهٔ پیوسته</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex size-8 items-center justify-center rounded-xl bg-sky/15 text-[#8fcdf9]">
                    <BookOpenCheck className="size-4" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="num text-sm font-bold">{faMinutesShort(data.weeklyMinutes)}</p>
                    <p className="text-[0.58rem] text-white/50">مطالعهٔ این هفته</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 xl:grid-cols-1">
          <StatCard
            label="میانگین کل"
            value={
              data.overallPercent === null ? (
                <span className="text-lg text-muted">هنوز نمره‌ای نیست</span>
              ) : (
                <span>
                  {faScoreFromPercent(data.overallPercent, user.gradeScale)}
                  <span className="mr-1 text-xs font-medium text-muted">از {faNum(user.gradeScale)}</span>
                </span>
              )
            }
            hint="میانگین درس‌ها بر پایهٔ همهٔ آزمون‌ها"
            icon={<GraduationCap className="size-5" aria-hidden="true" />}
            tone="violet"
            delta={data.weeklyAcademicChange}
          />
          <StatCard
            label="مطالعهٔ این هفته"
            value={<span className="num">{faMinutesShort(data.weeklyMinutes)}</span>}
            hint={`هدف روزانه: ${faMinutesShort(user.dailyGoalMinutes)}`}
            icon={<CalendarClock className="size-5" aria-hidden="true" />}
            tone="mint"
          />
        </div>
      </section>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.5fr_1fr]">
        <div className="space-y-5">
          <section className="card p-4 sm:p-5">
            <SectionHeading
              title="ریتم مطالعهٔ این هفته"
              description="مطالعهٔ ثبت‌شده در گزارش‌ها در برابر زمان برنامه‌ریزی‌شده"
              icon={<TrendingUp className="size-4" aria-hidden="true" />}
              action={<Link href="/app/analytics" className="btn btn-ghost min-h-8 px-2 text-[0.7rem]">تحلیل کامل</Link>}
            />
            <WeeklyStudyChart data={weekLabels} />
            <div className="mt-2 flex items-center justify-center gap-4 text-[0.62rem] text-muted">
              <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-violet" /> ثبت‌شده</span>
              <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-[#ece5f9]" /> برنامه‌ریزی‌شده</span>
            </div>
          </section>

          <section className="card p-4 sm:p-5">
            <SectionHeading
              title="میانگین درس‌ها"
              description="قوی‌ترین و ضعیف‌ترین درس‌ها را ببین؛ برای جزئیات به کارنامه‌ها سر بزن."
              icon={<GraduationCap className="size-4" aria-hidden="true" />}
              action={<Link href="/app/exams" className="btn btn-ghost min-h-8 px-2 text-[0.7rem]">همهٔ آزمون‌ها</Link>}
            />
            {data.subjectAverages.length === 0 ? (
              <EmptyState
                compact
                icon={<GraduationCap className="size-5" aria-hidden="true" />}
                title="هنوز آزمونی ثبت نکرده‌ای"
                description="با ثبت اولین آزمون، میانگین درس‌ها و روند پیشرفتت اینجا شکل می‌گیرد."
                action={<Link href="/app/exams" className="btn btn-secondary text-xs">ثبت آزمون</Link>}
              />
            ) : (
              <div className="space-y-3">
                {data.subjectAverages.slice(0, 5).map((subject) => (
                  <div key={subject.subjectId} className="flex items-center gap-3">
                    <SubjectIcon icon={subject.subjectIcon} color={subject.subjectColor} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-xs font-semibold text-ink">{subject.subjectName}</p>
                        <div className="flex items-center gap-2">
                          <Delta value={subject.changeFromPrevious ?? 0} className="hidden sm:inline-flex" />
                          <span className="num text-xs font-bold text-ink-soft">
                            {faScoreFromPercent(subject.averagePercent, user.gradeScale)}
                          </span>
                        </div>
                      </div>
                      <div className="mt-1.5 flex items-center gap-2">
                        <Progress
                          value={subject.averagePercent}
                          tone={subject.averagePercent >= 75 ? "mint" : subject.averagePercent >= 50 ? "gold" : "coral"}
                          className="h-1.5"
                          label={`میانگین ${subject.subjectName}`}
                        />
                        <span className="num w-9 text-left text-[0.6rem] text-muted">{faPercent(subject.averagePercent)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="card p-4 sm:p-5">
            <SectionHeading
              title="آزمون‌های اخیر"
              description="آخرین نمره‌ها و آزمون‌های نزدیک"
              icon={<BookOpenCheck className="size-4" aria-hidden="true" />}
              action={<Link href="/app/exams" className="btn btn-ghost min-h-8 px-2 text-[0.7rem]">مدیریت</Link>}
            />
            {data.recentExams.length === 0 ? (
              <EmptyState compact title="هنوز آزمونی ثبت نشده" description="اولین آزمون را اضافه کن." action={<Link href="/app/exams" className="btn btn-secondary text-xs">افزودن آزمون</Link>} />
            ) : (
              <div className="grid gap-2.5 sm:grid-cols-2">
                {data.recentExams.slice(0, 4).map((exam) => {
                  const percent = examPercent(exam);
                  return (
                    <div key={exam.id} className="flex items-center gap-2.5 rounded-xl border border-line bg-[#fdfaf4] p-2.5">
                      <SubjectIcon icon={exam.subjectIcon} color={exam.subjectColor} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[0.72rem] font-semibold text-ink">{exam.title}</p>
                        <p className="mt-0.5 text-[0.6rem] text-muted">
                          {exam.subjectName} • <span className="num">{formatShortDate(exam.examDate)}</span>
                        </p>
                      </div>
                      <div className="text-left">
                        {exam.grade === null ? (
                          <Badge tone="outline" className="text-[0.58rem]">بدون نمره</Badge>
                        ) : (
                          <span className="num text-sm font-extrabold text-ink">
                            {faScoreFromPercent(percent, user.gradeScale)}
                            <span className="mr-0.5 text-[0.55rem] font-medium text-muted">/{faNum(user.gradeScale)}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {data.upcomingExams.length > 0 ? (
              <div className="mt-3 rounded-xl bg-gold-soft/55 px-3 py-2.5">
                <p className="mb-1.5 flex items-center gap-1 text-[0.65rem] font-bold text-[#7c5c12]">
                  <CalendarClock className="size-3.5" aria-hidden="true" />
                  آزمون‌های پیش رو
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {data.upcomingExams.map((exam) => (
                    <span key={exam.id} className="chip bg-white text-[0.62rem]">
                      <SubjectDot color={exam.subjectColor} />
                      {exam.title} • {relativeDayLabel(exam.examDate)}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </section>
        </div>

        <aside className="space-y-5">
          <section className="card overflow-hidden">
            <div className="bg-gradient-to-br from-violet/95 to-[#8b7cff] p-4 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[0.65rem] text-white/75">
                  <ScrollText className="size-3.5" aria-hidden="true" />
                  آخرین کارنامه
                </div>
                <Star className="size-4 fill-white/80 text-white/80" aria-hidden="true" />
              </div>
              {latestCard ? (
                <>
                  <p className="mt-2 text-sm font-bold">{latestCard.data.title}</p>
                  <div className="mt-3 flex items-end justify-between">
                    <div>
                      <p className="text-[0.58rem] text-white/60">میانگین دوره</p>
                      <p className="num mt-0.5 text-2xl font-extrabold">
                        {latestCard.data.overallPercent === null
                          ? "—"
                          : faScoreFromPercent(latestCard.data.overallPercent, user.gradeScale)}
                        <span className="mr-1 text-[0.6rem] font-medium text-white/55">از {faNum(user.gradeScale)}</span>
                      </p>
                    </div>
                    <div className="text-left">
                      <p className="text-[0.58rem] text-white/60">مطالعه</p>
                      <p className="num mt-0.5 text-xs font-bold">{faMinutesShort(latestCard.data.studyMinutes)}</p>
                    </div>
                  </div>
                  <Link
                    href={`/app/cards/${latestCard.id}`}
                    className="mt-3 inline-flex items-center gap-1 rounded-lg bg-white/15 px-2.5 py-1.5 text-[0.65rem] font-semibold transition-colors hover:bg-white/25"
                  >
                    دیدن کارنامه
                    <ArrowLeft className="size-3" aria-hidden="true" />
                  </Link>
                </>
              ) : (
                <>
                  <p className="mt-2 text-sm font-bold">اولین کارنامه‌ات در راه است</p>
                  <p className="mt-1 text-[0.65rem] leading-5 text-white/65">
                    با تکمیل یک هفته و ثبت گزارش‌ها، کارنامهٔ خودکار ساخته می‌شود.
                  </p>
                  <Link href="/app/cards" className="mt-3 inline-flex items-center gap-1 text-[0.65rem] font-semibold">
                    راهنمای کارنامه‌ها
                    <ArrowLeft className="size-3" aria-hidden="true" />
                  </Link>
                </>
              )}
            </div>
            <div className="p-4">
              <SectionHeading
                title="جلسه‌های امروز"
                icon={<CalendarClock className="size-4" aria-hidden="true" />}
                action={<Link href="/app/planner" className="text-[0.65rem] font-semibold text-violet-deep">برنامه</Link>}
                className="mb-3"
              />
              {data.todaySessions.length === 0 ? (
                <p className="rounded-xl bg-[#f7f2e9] px-3 py-2.5 text-[0.68rem] leading-6 text-muted">
                  امروز جلسه‌ای برنامه‌ریزی نکرده‌ای. یک جلسهٔ کوتاه ۲۵ دقیقه‌ای هم شروع خوبی است.
                </p>
              ) : (
                <div className="space-y-2">
                  {data.todaySessions.map((session) => (
                    <div key={session.id} className="flex items-center gap-2 rounded-xl border border-line bg-white p-2.5">
                      <SessionCompleteButton id={session.id} completed={session.status === "completed"} />
                      <div className="min-w-0 flex-1">
                        <p className={`truncate text-[0.7rem] font-semibold ${session.status === "completed" ? "text-muted line-through" : "text-ink"}`}>
                          {session.title}
                        </p>
                        <p className="num mt-0.5 text-[0.58rem] text-muted">
                          {formatTimePersian(session.startTime)} تا {formatTimePersian(session.endTime)}
                        </p>
                      </div>
                      {session.subjectName ? <SubjectDot color={session.subjectColor} /> : null}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className="card p-4">
            <SectionHeading
              title="هدف‌های فعال"
              icon={<Target className="size-4" aria-hidden="true" />}
              action={<Link href="/app/planner#goals" className="text-[0.65rem] font-semibold text-violet-deep">مدیریت</Link>}
              className="mb-3"
            />
            {data.activeGoals.length === 0 ? (
              <p className="rounded-xl bg-[#f7f2e9] px-3 py-2.5 text-[0.68rem] leading-6 text-muted">
                هدفی تعریف نکرده‌ای. یک هدف کوچک و قابل اندازه‌گیری انتخاب کن.
              </p>
            ) : (
              <div className="space-y-3.5">
                {data.activeGoals.map((goal) => (
                  <div key={goal.goal.id}>
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-[0.7rem] font-semibold text-ink">{goal.goal.title}</p>
                      <span className={`num text-[0.65rem] font-bold ${goal.achieved ? "text-[#157a5b]" : "text-muted"}`}>
                        {faNum(goal.percent)}٪
                      </span>
                    </div>
                    <Progress value={goal.percent} tone={goal.achieved ? "mint" : "violet"} className="mt-1.5 h-1.5" label={goal.goal.title} />
                    <p className="mt-1 text-[0.58rem] text-muted">{goal.label}</p>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="card p-4">
            <div className="flex items-start gap-2.5">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gold-soft text-[#8a6410]">
                <Sparkles className="size-4" aria-hidden="true" />
              </span>
              <div>
                <p className="text-xs font-bold text-ink">یک ستارهٔ کوچک برای امروز</p>
                <p className="mt-1 text-[0.65rem] leading-6 text-muted">
                  {data.todayMinutes >= user.dailyGoalMinutes
                    ? "هدف امروزت را کامل کردی؛ حالا چند دقیقه به مرور فردا فکر کن."
                    : `${faMinutesShort(Math.max(0, user.dailyGoalMinutes - data.todayMinutes))} دیگر تا هدف امروز مانده. یک جلسهٔ کوتاه کافی است.`}
                </p>
              </div>
            </div>
          </section>
        </aside>
      </div>

      <section className="mt-5 grid gap-3 sm:grid-cols-3">
        <Link href="/app/reports" className="card group flex items-center gap-3 p-4 transition-transform hover:-translate-y-0.5">
          <span className="flex size-10 items-center justify-center rounded-2xl bg-coral-soft text-[#c73554]">
            <NotebookPen className="size-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-bold text-ink">گزارش‌های گذشته</p>
            <p className="mt-0.5 text-[0.62rem] text-muted">همهٔ صفحه‌های دفترت</p>
          </div>
          <ArrowLeft className="mr-auto size-4 text-muted transition-transform group-hover:-translate-x-1" aria-hidden="true" />
        </Link>
        <Link href="/app/cards" className="card group flex items-center gap-3 p-4 transition-transform hover:-translate-y-0.5">
          <span className="flex size-10 items-center justify-center rounded-2xl bg-violet-soft text-violet-deep">
            <ScrollText className="size-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-bold text-ink">کارنامه‌های خودکار</p>
            <p className="mt-0.5 text-[0.62rem] text-muted">جمع‌بندی هفتگی و ماهانه</p>
          </div>
          <ArrowLeft className="mr-auto size-4 text-muted transition-transform group-hover:-translate-x-1" aria-hidden="true" />
        </Link>
        <Link href="/app/analytics" className="card group flex items-center gap-3 p-4 transition-transform hover:-translate-y-0.5">
          <span className="flex size-10 items-center justify-center rounded-2xl bg-mint-soft text-[#157a5b]">
            <TrendingUp className="size-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-bold text-ink">تحلیل پیشرفت</p>
            <p className="mt-0.5 text-[0.62rem] text-muted">روند نمره و عادت‌ها</p>
          </div>
          <ArrowLeft className="mr-auto size-4 text-muted transition-transform group-hover:-translate-x-1" aria-hidden="true" />
        </Link>
      </section>
      <p className="sr-only">
        میانگین درصدی: {data.overallPercent === null ? "بدون داده" : faDecimal(data.overallPercent)}
      </p>
    </div>
  );
}
