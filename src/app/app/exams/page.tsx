import type { Metadata } from "next";
import Link from "next/link";
import { Award, BarChart3, BookOpenCheck, CalendarClock, GraduationCap, TrendingDown, TrendingUp } from "lucide-react";
import { requireOnboardedUser } from "@/server/auth/session";
import { getExams, getUpcomingExams } from "@/server/services/exams";
import { listSubjects } from "@/server/repositories/subjects";
import { buildSubjectStats, overallAverage } from "@/lib/grades";
import { todayISO } from "@/lib/dates";
import { faDecimal, faNum, faScoreFromPercent } from "@/lib/format";
import { PageHeader, StatCard, EmptyState } from "@/components/ui/page";
import { SubjectBarsChart } from "@/components/charts/charts";
import { Badge } from "@/components/ui/badge";
import { SubjectDot } from "@/components/subject-icon";
import { ExamManager } from "./exam-manager";

export const metadata: Metadata = { title: "آزمون‌ها و نمره‌ها" };
export const dynamic = "force-dynamic";

export default async function ExamsPage() {
  const user = await requireOnboardedUser();
  const exams = getExams(user.id);
  const upcoming = getUpcomingExams(user.id, todayISO(), 5);
  const subjects = listSubjects(user.id, true);
  const stats = buildSubjectStats(subjects, exams, user.gradeScale, exams).filter(
    (subject) => subject.examCount > 0,
  );
  const overall = overallAverage(stats.map((subject) => subject.averagePercent));
  const sorted = [...stats].sort((a, b) => b.averagePercent - a.averagePercent);
  const best = sorted[0] ?? null;
  const weakest = sorted[sorted.length - 1] ?? null;
  const gradedCount = exams.filter((exam) => exam.grade !== null).length;
  const pendingCount = exams.length - gradedCount;

  return (
    <div>
      <PageHeader
        eyebrow="کارنامهٔ درسی"
        title="آزمون‌ها و نمره‌ها"
        description="هر آزمون را ثبت کن تا میانگین درس‌ها، روند پیشرفت و نقاط قوت و ضعفت روشن شود."
        actions={
          <Link href="/app/analytics" className="btn btn-secondary text-xs">
            <BarChart3 className="size-4" aria-hidden="true" />
            تحلیل پیشرفت
          </Link>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="میانگین کل"
          value={
            overall === null ? (
              <span className="text-base text-muted">بدون داده</span>
            ) : (
              <span>
                {faScoreFromPercent(overall, user.gradeScale)}
                <span className="mr-1 text-xs font-medium text-muted">از {faNum(user.gradeScale)}</span>
              </span>
            )
          }
          hint={`از ${faNum(stats.length)} درس دارای نمره`}
          icon={<GraduationCap className="size-5" aria-hidden="true" />}
          tone="violet"
        />
        <StatCard
          label="قوی‌ترین درس"
          value={
            best ? (
              <span className="text-base">{best.subjectName}</span>
            ) : (
              <span className="text-base text-muted">—</span>
            )
          }
          hint={best ? `میانگین ${faScoreFromPercent(best.averagePercent, user.gradeScale)} • ${faNum(best.examCount)} آزمون` : "بعد از ثبت نمره‌ها مشخص می‌شود"}
          icon={<TrendingUp className="size-5" aria-hidden="true" />}
          tone="mint"
        />
        <StatCard
          label="نیازمند توجه"
          value={
            weakest ? (
              <span className="text-base">{weakest.subjectName}</span>
            ) : (
              <span className="text-base text-muted">—</span>
            )
          }
          hint={weakest ? `میانگین ${faScoreFromPercent(weakest.averagePercent, user.gradeScale)}` : "هنوز دادهٔ کافی نیست"}
          icon={<TrendingDown className="size-5" aria-hidden="true" />}
          tone="coral"
        />
        <StatCard
          label="آزمون‌ها"
          value={<span className="num">{faNum(exams.length)}</span>}
          hint={`${faNum(gradedCount)} دارای نمره • ${faNum(pendingCount)} در انتظار`}
          icon={<BookOpenCheck className="size-5" aria-hidden="true" />}
          tone="gold"
        />
      </div>

      {upcoming.length > 0 ? (
        <section className="mt-4 rounded-2xl border border-gold/35 bg-gold-soft/50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="flex items-center gap-1.5 text-xs font-bold text-[#7c5c12]">
              <CalendarClock className="size-4" aria-hidden="true" />
              آزمون‌های پیش رو
            </p>
            <span className="text-[0.6rem] text-[#8a6b24]">برای آماده‌شدن یک جلسه در برنامه‌ات بساز.</span>
          </div>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {upcoming.map((exam) => (
              <span key={exam.id} className="chip bg-white text-[0.65rem]">
                <SubjectDot color={exam.subjectColor} />
                {exam.title} • {exam.subjectName}
              </span>
            ))}
          </div>
        </section>
      ) : null}

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(18rem,1fr)]">
        <ExamManager exams={exams} subjects={subjects} gradeScale={user.gradeScale} />

        <aside className="space-y-4">
          <div className="card p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-bold">مقایسهٔ درس‌ها</h2>
              {stats.length > 0 ? <Badge tone="violet" className="text-[0.55rem]">{faNum(stats.length)} درس</Badge> : null}
            </div>
            {stats.length === 0 ? (
              <EmptyState
                compact
                icon={<Award className="size-5" aria-hidden="true" />}
                title="نمودار بعد از اولین نمره"
                description="با ثبت آزمون دارای نمره، مقایسهٔ درس‌ها اینجا ظاهر می‌شود."
              />
            ) : (
              <SubjectBarsChart
                data={stats.map((subject) => ({
                  subjectName: subject.subjectName,
                  averagePercent: subject.averagePercent,
                  subjectColor: subject.subjectColor,
                }))}
              />
            )}
          </div>

          <div className="card p-4">
            <h2 className="text-sm font-bold">چند نکته برای ثبت دقیق</h2>
            <ul className="mt-3 space-y-2.5 text-[0.68rem] leading-6 text-muted">
              <li className="flex gap-2">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-violet" />
                اگر آزمون چند بخشی است، هر بخش را جدا ثبت کن یا میانگین وزن‌دار بده.
              </li>
              <li className="flex gap-2">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-gold" />
                نمرهٔ کل را واقعی وارد کن؛ دفتر خودش آن را به مقیاس {faNum(user.gradeScale)} تبدیل می‌کند.
              </li>
              <li className="flex gap-2">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-mint" />
                برای آزمون‌های مهم وزن بزرگ‌تر بگذار تا میانگین واقعی‌تر شود.
              </li>
            </ul>
            {overall !== null ? (
              <p className="mt-4 rounded-xl bg-violet-soft/60 px-3 py-2.5 text-[0.65rem] leading-6 text-violet-deep">
                میانگین درصدی فعلی تو <span className="font-bold">{faDecimal(overall)}٪</span> است؛ برای مقیاس {faNum(user.gradeScale)} یعنی{" "}
                <span className="font-bold">{faScoreFromPercent(overall, user.gradeScale)}</span>.
              </p>
            ) : null}
          </div>

          <div className="card p-4">
            <p className="flex items-center gap-1.5 text-xs font-bold">
              <CalendarClock className="size-4 text-violet-deep" aria-hidden="true" />
              آزمون بدون نمره
            </p>
            <p className="mt-1.5 text-[0.65rem] leading-6 text-muted">
              می‌توانی آزمون آینده را از قبل ثبت کنی و بعداً نمره‌اش را اضافه کنی. تا آن زمان در میانگین‌ها حساب نمی‌شود.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
