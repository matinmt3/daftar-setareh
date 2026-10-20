"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarPlus,
  CheckCircle2,
  Pause,
  Pencil,
  Play,
  Plus,
  Repeat2,
  Sparkles,
  Target,
} from "lucide-react";
import type { GoalProgress, StudyGoal, StudySeries, StudySession, Subject } from "@/lib/types";
import {
  GOAL_METRICS,
  WEEKDAYS,
  goalPeriodLabel,
  sessionKindLabel,
  subjectColor,
} from "@/lib/constants";
import { faNum, faPercent } from "@/lib/format";
import {
  formatNumericDate,
  formatShortDate,
  formatTimePersian,
  minutesToTime,
  timeToMinutes,
  weekdayLabel,
} from "@/lib/dates";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Progress } from "@/components/ui/progress";
import { SessionCompleteButton } from "@/components/session-complete-button";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { showToast } from "@/components/ui/toast";
import { deleteSessionAction } from "@/server/actions/planner";
import { deleteGoalAction, toggleGoalAction } from "@/server/actions/goals";
import { SessionForm } from "./session-form";
import { GoalForm } from "./goal-form";
import { runAction } from "@/components/ui/run-action";

export type SeriesWithSample = StudySeries & { sampleSessionId: string | null };

const priorityBorder: Record<string, string> = {
  low: "border-s-mint",
  medium: "border-s-gold",
  high: "border-s-coral",
};

function minutesLabel(total: number): string {
  if (total <= 0) return "۰ دقیقه";
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  if (hours && minutes) return `${faNum(hours)} ساعت و ${faNum(minutes)} دقیقه`;
  if (hours) return `${faNum(hours)} ساعت`;
  return `${faNum(minutes)} دقیقه`;
}

export function PlannerBoard({
  sessions,
  series,
  goals,
  subjects,
  weekDates,
  today,
  weekLabel,
}: {
  sessions: StudySession[];
  series: SeriesWithSample[];
  goals: GoalProgress[];
  subjects: Subject[];
  weekDates: string[];
  today: string;
  weekLabel: string;
}) {
  const [sessionDialog, setSessionDialog] = useState<{
    open: boolean;
    date: string;
    session: StudySession | null;
  }>({ open: false, date: today, session: null });
  const [goalDialog, setGoalDialog] = useState<{ open: boolean; goal: StudyGoal | null }>({
    open: false,
    goal: null,
  });

  const byDate = useMemo(() => {
    const map = new Map<string, StudySession[]>();
    weekDates.forEach((date) => map.set(date, []));
    sessions.forEach((session) => {
      const list = map.get(session.sessionDate);
      if (list) list.push(session);
    });
    return map;
  }, [sessions, weekDates]);

  const plannedMinutes = sessions.reduce((sum, session) => sum + session.durationMinutes, 0);
  const completed = sessions.filter((session) => session.status === "completed");
  const completedMinutes = completed.reduce((sum, session) => sum + session.durationMinutes, 0);
  const activeGoals = goals.filter((item) => item.goal.isActive);
  const defaultSessionDate = weekDates.includes(today) ? today : (weekDates[0] ?? today);

  const openNewSession = (date: string) =>
    setSessionDialog({ open: true, date, session: null });

  return (
    <>
      <div className="rounded-2xl border border-line bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex size-10 items-center justify-center rounded-xl bg-violet-soft text-violet-deep">
              <CalendarPlus className="size-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-[0.62rem] text-muted">برنامهٔ این هفته</p>
              <p className="text-sm font-extrabold text-ink">{weekLabel}</p>
            </div>
          </div>
          <div className="mr-auto flex flex-wrap items-center gap-2">
            <Button size="sm" onClick={() => openNewSession(defaultSessionDate)}>
              <Plus className="size-4" aria-hidden="true" />
              جلسهٔ تازه
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setGoalDialog({ open: true, goal: null })}
            >
              <Target className="size-4" aria-hidden="true" />
              هدف تازه
            </Button>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Metric label="جلسه‌ها" value={faNum(sessions.length)} hint={`${faNum(completed.length)} انجام‌شده`} />
          <Metric label="زمان برنامه" value={minutesLabel(plannedMinutes)} hint="مجموع این هفته" />
          <Metric label="زمان انجام‌شده" value={minutesLabel(completedMinutes)} hint={`${faPercent(plannedMinutes ? (completedMinutes / plannedMinutes) * 100 : 0)} از برنامه`} />
          <Metric label="هدف‌های فعال" value={faNum(activeGoals.length)} hint="از ۱۲ هدف ممکن" />
        </div>
      </div>

      <section className="rounded-2xl border border-line bg-white p-3.5 shadow-sm sm:p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-extrabold text-ink">هفتهٔ پیشِ رو</h2>
            <p className="mt-0.5 text-[0.62rem] text-muted">جلسه‌های هر روز را ببین و کارهای انجام‌شده را علامت بزن.</p>
          </div>
          <span className="hidden items-center gap-1 rounded-full bg-paper px-2.5 py-1 text-[0.58rem] text-muted sm:flex">
            <Sparkles className="size-3" aria-hidden="true" />
            هفته از شنبه شروع می‌شود
          </span>
        </div>

        <div className="pb-1">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-7 xl:gap-2">
            {weekDates.map((date) => {
              const daySessions = byDate.get(date) ?? [];
              const dayMinutes = daySessions.reduce((sum, session) => sum + session.durationMinutes, 0);
              const isToday = date === today;
              const dateNumber = formatNumericDate(date).split("/").at(-1);
              return (
                <div
                  key={date}
                  className={cn(
                    "flex min-h-32 flex-col rounded-xl border p-3 transition-colors xl:min-h-[15rem] xl:p-2",
                    isToday ? "border-violet/40 bg-violet-soft/30" : "border-line/80 bg-[#fcfaf6]",
                  )}
                >
                  <div className="mb-2 flex items-start justify-between gap-1 border-b border-line/60 pb-2">
                    <div>
                      <p className={cn("text-[0.62rem] font-bold", isToday ? "text-violet-deep" : "text-ink")}>
                        {weekdayLabel(date)}
                      </p>
                      <p className="mt-0.5 text-[0.55rem] text-muted">{formatShortDate(date)}</p>
                    </div>
                    <span
                      className={cn(
                        "num flex size-7 items-center justify-center rounded-lg text-[0.7rem] font-extrabold",
                        isToday ? "bg-violet text-white" : "bg-white text-muted",
                      )}
                    >
                      {dateNumber}
                    </span>
                  </div>

                  <div className="flex-1 space-y-1.5">
                    {daySessions.length === 0 ? (
                      <button
                        type="button"
                        onClick={() => openNewSession(date)}
                        className="flex h-16 w-full items-center justify-center rounded-lg border border-dashed border-line text-[0.55rem] text-muted transition-colors hover:border-violet/40 hover:text-violet-deep"
                      >
                        جلسه‌ای نیست
                      </button>
                    ) : (
                      daySessions.map((session) => (
                        <SessionChip
                          key={session.id}
                          session={session}
                          onEdit={() =>
                            setSessionDialog({ open: true, date: session.sessionDate, session })
                          }
                        />
                      ))
                    )}
                  </div>

                  <div className="mt-2 flex items-center justify-between border-t border-line/60 pt-1.5">
                    <span className="text-[0.52rem] text-muted">
                      {dayMinutes ? minutesLabel(dayMinutes) : "خالی"}
                    </span>
                    <button
                      type="button"
                      onClick={() => openNewSession(date)}
                      className="flex size-6 items-center justify-center rounded-md text-muted transition-colors hover:bg-white hover:text-violet-deep"
                      aria-label={`افزودن جلسه برای ${formatShortDate(date)}`}
                    >
                      <Plus className="size-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-2xl border border-line bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-1.5 text-sm font-extrabold text-ink">
              <Repeat2 className="size-4 text-violet-deep" aria-hidden="true" />
              برنامه‌های تکرارشونده
            </h2>
            <span className="text-[0.58rem] text-muted">{faNum(series.length)} برنامه</span>
          </div>
          {series.length === 0 ? (
            <div className="rounded-xl border border-dashed border-line bg-paper/40 px-4 py-6 text-center">
              <p className="text-xs font-semibold text-ink">هنوز برنامهٔ تکرارشونده نداری.</p>
              <p className="mt-1 text-[0.6rem] leading-5 text-muted">
                یک برنامه هفتگی بساز تا جلسه‌هایش خودکار در تقویم بنشیند.
              </p>
              <Button
                size="sm"
                variant="secondary"
                className="mt-3"
                onClick={() => openNewSession(defaultSessionDate)}
              >
                ساختن برنامه
              </Button>
            </div>
          ) : (
            <ul className="space-y-2">
              {series.map((item) => {
                const color = subjectColor(
                  subjects.find((subject) => subject.id === item.subjectId)?.color,
                );
                return (
                  <li key={item.id} className="rounded-xl border border-line/80 bg-[#fcfaf6] p-3">
                    <div className="flex items-start gap-2">
                      <span
                        className="mt-1 size-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: color.hex }}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-ink">{item.title}</p>
                        <p className="mt-0.5 text-[0.58rem] text-muted">
                          {formatTimePersian(item.startTime)} تا{" "}
                          {formatTimePersian(minutesToTime(timeToMinutes(item.startTime) + item.durationMinutes))}
                          {" · "}
                          {minutesLabel(item.durationMinutes)}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {WEEKDAYS.filter((day) => item.weekdays.includes(day.value)).map((day) => (
                            <span
                              key={day.value}
                              className="flex size-5 items-center justify-center rounded-md bg-white text-[0.55rem] font-bold text-violet-deep"
                            >
                              {day.short}
                            </span>
                          ))}
                        </div>
                      </div>
                      {item.sampleSessionId ? (
                        <ConfirmDeleteButton
                          compact
                          action={() =>
                            deleteSessionAction({ id: item.sampleSessionId!, scope: "series" })
                          }
                          title="حذف کل برنامه؟"
                          description="همهٔ جلسه‌های این برنامه، چه انجام‌شده و چه انجام‌نشده، حذف می‌شوند."
                        />
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section id="goals" className="scroll-mt-24 rounded-2xl border border-line bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-1.5 text-sm font-extrabold text-ink">
              <Target className="size-4 text-violet-deep" aria-hidden="true" />
              هدف‌های مطالعه
            </h2>
            <span className="text-[0.58rem] text-muted">{faNum(activeGoals.length)} فعال</span>
          </div>
          {goals.length === 0 ? (
            <div className="rounded-xl border border-dashed border-line bg-paper/40 px-4 py-6 text-center">
              <p className="text-xs font-semibold text-ink">هدف یعنی مسیر روشن.</p>
              <p className="mt-1 text-[0.6rem] leading-5 text-muted">
                مثلاً «هفته‌ای ده ساعت مطالعه» یا «میانگین آزمون بالای ۸۰٪».
              </p>
              <Button
                size="sm"
                variant="secondary"
                className="mt-3"
                onClick={() => setGoalDialog({ open: true, goal: null })}
              >
                ساختن هدف
              </Button>
            </div>
          ) : (
            <ul className="space-y-2">
              {goals.map((item) => (
                <GoalRow
                  key={item.goal.id}
                  progress={item}
                  onEdit={() => setGoalDialog({ open: true, goal: item.goal })}
                />
              ))}
            </ul>
          )}
        </section>
      </div>

      <Modal
        open={sessionDialog.open}
        onOpenChange={(open) =>
          setSessionDialog((current) => ({ ...current, open }))
        }
        title={sessionDialog.session ? "ویرایش جلسه" : "جلسهٔ تازه"}
        description={
          sessionDialog.session
            ? "تغییرها را روی همین جلسه یا جلسه‌های بعدی برنامه اعمال کن."
            : "یک جلسهٔ کوتاه و مشخص، بهتر از یک برنامهٔ مبهم است."
        }
        size="md"
      >
        <SessionForm
          key={`${sessionDialog.session?.id ?? "new"}-${sessionDialog.date}`}
          subjects={subjects}
          initialDate={sessionDialog.date}
          session={sessionDialog.session}
          onDone={() => setSessionDialog((current) => ({ ...current, open: false, session: null }))}
        />
      </Modal>

      <Modal
        open={goalDialog.open}
        onOpenChange={(open) => setGoalDialog((current) => ({ ...current, open }))}
        title={goalDialog.goal ? "ویرایش هدف" : "هدف تازه"}
        description="هدف باید قابل اندازه‌گیری باشد؛ معیار و بازه را روشن انتخاب کن."
        size="sm"
      >
        <GoalForm
          key={goalDialog.goal?.id ?? "new-goal"}
          goal={goalDialog.goal}
          onDone={() => setGoalDialog({ open: false, goal: null })}
        />
      </Modal>
    </>
  );
}

function Metric({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-xl bg-paper/70 px-3 py-2.5">
      <p className="text-[0.58rem] text-muted">{label}</p>
      <p className="mt-0.5 text-sm font-extrabold text-ink">{value}</p>
      <p className="mt-0.5 text-[0.52rem] text-muted">{hint}</p>
    </div>
  );
}

function SessionChip({ session, onEdit }: { session: StudySession; onEdit: () => void }) {
  const color = subjectColor(session.subjectColor);
  const done = session.status === "completed";
  return (
    <div
      data-testid="study-session"
      className={cn(
        "group relative rounded-lg border border-line/80 border-s-[3px] bg-white p-2 transition-opacity",
        priorityBorder[session.priority] ?? "border-s-line",
        done && "opacity-60",
      )}
    >
      <div className="flex items-center justify-between gap-1">
        <span className={cn("num text-[0.52rem] font-bold text-muted", done && "line-through")}>
          {formatTimePersian(session.startTime)}
        </span>
        <SessionCompleteButton id={session.id} completed={done} />
      </div>
      <p className={cn("mt-1 text-[0.62rem] font-bold leading-5 text-ink", done && "line-through")}>
        {session.title}
      </p>
      <div className="mt-1 flex items-center justify-between gap-1">
        <span className="flex min-w-0 items-center gap-1">
          <span className="size-1.5 shrink-0 rounded-full" style={{ backgroundColor: color.hex }} />
          <span className="truncate text-[0.52rem] text-muted">
            {session.subjectName || sessionKindLabel(session.kind)}
          </span>
        </span>
        <button
          type="button"
          onClick={onEdit}
          className="flex size-5 shrink-0 items-center justify-center rounded text-muted opacity-0 transition-opacity hover:bg-paper hover:text-violet-deep group-hover:opacity-100 focus-visible:opacity-100"
          aria-label={`ویرایش ${session.title}`}
        >
          <Pencil className="size-3" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

function GoalRow({ progress, onEdit }: { progress: GoalProgress; onEdit: () => void }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const { goal } = progress;
  const metric = GOAL_METRICS.find((item) => item.value === goal.metric);
  const valueText =
    goal.metric === "study-minutes"
      ? minutesLabel(progress.currentValue)
      : goal.metric === "exam-average"
        ? faPercent(progress.currentValue)
        : `${faNum(progress.currentValue)} کار`;
  const targetText =
    goal.metric === "study-minutes"
      ? minutesLabel(progress.targetValue)
      : goal.metric === "exam-average"
        ? faPercent(progress.targetValue)
        : `${faNum(progress.targetValue)} کار`;

  const toggle = () => {
    startTransition(async () => {
      const result = await runAction(() => toggleGoalAction({ id: goal.id, active: !goal.isActive }));
      if (!result.ok) {
        showToast({ title: "تغییر وضعیت هدف انجام نشد", description: result.message, tone: "error" });
        return;
      }
      showToast({ title: result.message ?? "وضعیت هدف تغییر کرد", tone: "success" });
      router.refresh();
    });
  };

  return (
    <li
      data-testid="study-goal"
      className={cn(
        "rounded-xl border border-line/80 bg-[#fcfaf6] p-3",
        !goal.isActive && "opacity-60 grayscale-[0.3]",
      )}
    >
      <div className="flex items-start gap-2">
        <span
          className={cn(
            "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg",
            progress.achieved ? "bg-mint-soft text-[#157a5b]" : "bg-violet-soft text-violet-deep",
          )}
        >
          {progress.achieved ? (
            <CheckCircle2 className="size-4" aria-hidden="true" />
          ) : (
            <Target className="size-4" aria-hidden="true" />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs font-bold text-ink">{goal.title}</p>
              <p className="mt-0.5 text-[0.55rem] text-muted">
                {metric?.label} · {goalPeriodLabel(goal.period)}
                {!goal.isActive ? " · متوقف" : ""}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-0.5">
              <button
                type="button"
                onClick={toggle}
                disabled={pending}
                className="flex size-6 items-center justify-center rounded-md text-muted transition-colors hover:bg-white hover:text-violet-deep"
                aria-label={goal.isActive ? "توقف هدف" : "فعال‌کردن هدف"}
              >
                {goal.isActive ? <Pause className="size-3" aria-hidden="true" /> : <Play className="size-3" aria-hidden="true" />}
              </button>
              <button
                type="button"
                onClick={onEdit}
                className="flex size-6 items-center justify-center rounded-md text-muted transition-colors hover:bg-white hover:text-violet-deep"
                aria-label={`ویرایش ${goal.title}`}
              >
                <Pencil className="size-3" aria-hidden="true" />
              </button>
              <ConfirmDeleteButton
                compact
                action={() => deleteGoalAction({ id: goal.id })}
                title="حذف این هدف؟"
                description="پیشرفت ثبت‌شده حذف نمی‌شود، فقط خود هدف از فهرست برداشته می‌شود."
              />
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between gap-2 text-[0.55rem]">
            <span className="font-semibold text-ink">{valueText}</span>
            <span className="text-muted">از {targetText}</span>
          </div>
          <Progress
            value={Math.min(100, Math.max(0, progress.percent))}
            tone={progress.achieved ? "mint" : "violet"}
            className="mt-1.5 h-1.5"
          />
        </div>
      </div>
    </li>
  );
}
