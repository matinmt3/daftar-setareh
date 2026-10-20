"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, Repeat2, Save, Trash2 } from "lucide-react";
import type { Subject, StudySession } from "@/lib/types";
import { addDaysISO, minutesToTime, parseISODate, timeToMinutes } from "@/lib/dates";
import { WEEKDAYS, SESSION_KINDS, PRIORITIES, type Priority, type SessionKind } from "@/lib/constants";
import { createSeriesAction, createSessionAction, deleteSessionAction, updateSessionAction } from "@/server/actions/planner";
import { Field, InlineAlert, Input, Select, Textarea } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { JalaliDatePicker } from "@/components/ui/jalali-date-picker";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { showToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import { runAction } from "@/components/ui/run-action";
import { useModalPending } from "@/components/ui/modal";

type Mode = "single" | "series";
type Scope = "single" | "future" | "series";

export function SessionForm({
  subjects,
  initialDate,
  session,
  onDone,
}: {
  subjects: Subject[];
  initialDate: string;
  session?: StudySession | null;
  onDone: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  useModalPending(pending);
  const [mode, setMode] = useState<Mode>("single");
  const [scope, setScope] = useState<Scope>("single");
  const [title, setTitle] = useState(session?.title ?? "");
  const [subjectId, setSubjectId] = useState(session?.subjectId ?? "");
  const [kind, setKind] = useState<SessionKind>(session?.kind ?? "study");
  const [priority, setPriority] = useState<Priority>(session?.priority ?? "medium");
  const [date, setDate] = useState(session?.sessionDate ?? initialDate);
  const [startTime, setStartTime] = useState(session?.startTime ?? "16:00");
  const [endTime, setEndTime] = useState(session?.endTime ?? "17:00");
  const [seriesEndDate, setSeriesEndDate] = useState(addDaysISO(initialDate, 30));
  const [weekdays, setWeekdays] = useState<number[]>(() => {
    const parsed = parseISODate(initialDate);
    return [parsed.getDay()];
  });
  const [durationMinutes, setDurationMinutes] = useState("60");
  const [reminderMinutes, setReminderMinutes] = useState(String(session?.reminderMinutes ?? 15));
  const [notes, setNotes] = useState(session?.notes ?? "");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const editing = Boolean(session);

  const updateStart = (value: string) => {
    setStartTime(value);
    if (timeToMinutes(value) >= timeToMinutes(endTime)) {
      setEndTime(minutesToTime(Math.min(timeToMinutes(value) + 60, 23 * 60 + 59)));
    }
  };

  const toggleWeekday = (day: number) => {
    setWeekdays((current) =>
      current.includes(day) ? current.filter((item) => item !== day) : [...current, day],
    );
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setFieldErrors({});
    startTransition(async () => {
      const common = {
        subjectId: subjectId || null,
        title,
        kind,
        priority,
        notes,
        startTime,
        reminderMinutes,
      };
      const result = await runAction(() =>
        editing && session
          ? updateSessionAction({
              id: session.id,
              scope,
              ...common,
              sessionDate: date,
              endTime,
            })
          : mode === "series"
            ? createSeriesAction({
                ...common,
                startDate: date,
                endDate: seriesEndDate,
                weekdays,
                durationMinutes,
              })
            : createSessionAction({
                ...common,
                sessionDate: date,
                endTime,
              }));

      if (!result.ok) {
        setError(result.message);
        setFieldErrors(result.fieldErrors ?? {});
        return;
      }
      showToast({
        title: editing ? "جلسه به‌روز شد" : mode === "series" ? "برنامهٔ تکرارشونده ساخته شد" : "جلسه اضافه شد",
        description: result.message,
        tone: "success",
      });
      onDone();
      router.refresh();
    });
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      {error ? <InlineAlert>{error}</InlineAlert> : null}

      {!editing ? (
        <div className="grid grid-cols-2 gap-1 rounded-xl bg-paper p-1">
          <button
            type="button"
            onClick={() => setMode("single")}
            aria-pressed={mode === "single"}
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-[0.68rem] font-semibold transition-colors",
              mode === "single" ? "bg-white text-ink shadow-sm" : "text-muted",
            )}
          >
            <CalendarClock className="size-3.5" aria-hidden="true" />
            یک جلسه
          </button>
          <button
            type="button"
            onClick={() => setMode("series")}
            aria-pressed={mode === "series"}
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-[0.68rem] font-semibold transition-colors",
              mode === "series" ? "bg-white text-ink shadow-sm" : "text-muted",
            )}
          >
            <Repeat2 className="size-3.5" aria-hidden="true" />
            برنامهٔ تکرارشونده
          </button>
        </div>
      ) : null}

      <div className="grid gap-3.5 sm:grid-cols-2">
        <Field label="عنوان جلسه" htmlFor="session-title" required error={fieldErrors.title?.[0]} className="sm:col-span-2">
          <Input
            id="session-title"
            value={title}
            maxLength={100}
            placeholder="مثلاً مرور فصل دو ریاضی"
            onChange={(event) => setTitle(event.target.value)}
          />
        </Field>
        <Field label="درس" htmlFor="session-subject" error={fieldErrors.subjectId?.[0]}>
          <Select
            id="session-subject"
            value={subjectId}
            onChange={(event) => setSubjectId(event.target.value)}
          >
            <option value="">بدون درس</option>
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>{subject.name}</option>
            ))}
          </Select>
        </Field>

        <Field label={mode === "series" && !editing ? "شروع از" : "تاریخ"} htmlFor="session-date" required error={fieldErrors.sessionDate?.[0] ?? fieldErrors.startDate?.[0]}>
          <JalaliDatePicker id="session-date" value={date} onChange={setDate} />
        </Field>

        <Field label="ساعت شروع" htmlFor="session-start" required error={fieldErrors.startTime?.[0]}>
          <Input
            id="session-start"
            type="time"
            value={startTime}
            onChange={(event) => updateStart(event.target.value)}
            className="num"
          />
        </Field>
        {mode === "series" && !editing ? (
          <Field
            label="مدت هر جلسه (دقیقه)"
            htmlFor="session-duration"
            required
            error={fieldErrors.durationMinutes?.[0]}
          >
            <Input
              id="session-duration"
              inputMode="numeric"
              value={durationMinutes}
              onChange={(event) => setDurationMinutes(event.target.value)}
            />
          </Field>
        ) : (
          <Field label="ساعت پایان" htmlFor="session-end" required error={fieldErrors.endTime?.[0]}>
            <Input
              id="session-end"
              type="time"
              value={endTime}
              onChange={(event) => setEndTime(event.target.value)}
              className="num"
            />
          </Field>
        )}

        {editing && session?.seriesId ? (
          <Field label="اعمال تغییر روی" htmlFor="session-scope" className="sm:col-span-2">
            <Select id="session-scope" value={scope} onChange={(event) => setScope(event.target.value as Scope)}>
              <option value="single">فقط این جلسه</option>
              <option value="future">این جلسه و جلسه‌های بعدی</option>
              <option value="series">کل برنامهٔ تکرارشونده</option>
            </Select>
          </Field>
        ) : null}
      </div>

      {mode === "series" && !editing ? (
        <>
          <Field label="تا تاریخ" htmlFor="series-end" required error={fieldErrors.endDate?.[0]}>
            <JalaliDatePicker id="series-end" value={seriesEndDate} onChange={setSeriesEndDate} min={date} />
          </Field>
          <Field label="روزهای تکرار" error={fieldErrors.weekdays?.[0]}>
            <div className="grid grid-cols-7 gap-1">
              {WEEKDAYS.map((day) => {
                const selected = weekdays.includes(day.value);
                return (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => toggleWeekday(day.value)}
                    aria-pressed={selected}
                    aria-label={day.label}
                    className={cn(
                      "rounded-lg border py-2 text-[0.62rem] font-semibold transition-colors",
                      selected
                        ? "border-violet bg-violet-soft text-violet-deep"
                        : "border-line bg-white text-muted hover:border-violet/40",
                    )}
                  >
                    {day.label.replace("شنبه", "شنبه").slice(0, 4)}
                  </button>
                );
              })}
            </div>
          </Field>
          <p className="rounded-xl bg-gold-soft/50 px-3 py-2.5 text-[0.62rem] leading-5 text-[#7c5c12]">
            حداکثر بازهٔ ساخت برنامه ۱۲۰ روز و ۱۵۰ جلسه است. جلسه‌ها فقط تا پایان بازه ساخته می‌شوند.
          </p>
        </>
      ) : null}

      <details className="rounded-xl border border-line p-3" open={Boolean(session && (session.notes || session.kind !== "study" || session.priority !== "medium" || session.reminderMinutes !== 15)) || undefined}>
        <summary className="text-sm font-semibold text-ink-soft">نوع، اولویت و یادآور (اختیاری)</summary>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Field label="نوع" htmlFor="session-kind" error={fieldErrors.kind?.[0]}>
          <Select id="session-kind" value={kind} onChange={(event) => setKind(event.target.value as SessionKind)}>
            {SESSION_KINDS.map((item) => (
              <option key={item.value} value={item.value}>{item.label}</option>
            ))}
          </Select>
        </Field>
        <Field label="اولویت" htmlFor="session-priority" error={fieldErrors.priority?.[0]}>
          <Select id="session-priority" value={priority} onChange={(event) => setPriority(event.target.value as Priority)}>
            {PRIORITIES.map((item) => (
              <option key={item.value} value={item.value}>{item.label}</option>
            ))}
          </Select>
        </Field>
        <Field
          label="یادآور قبل از شروع (دقیقه)"
          htmlFor="session-reminder"
          error={fieldErrors.reminderMinutes?.[0]}
          hint="۰ یعنی بدون یادآور."
        >
          <Input
            id="session-reminder"
            inputMode="numeric"
            value={reminderMinutes}
            onChange={(event) => setReminderMinutes(event.target.value)}
          />
        </Field>
        </div>
        <div className="mt-4">
      <Field label="یادداشت" htmlFor="session-notes" error={fieldErrors.notes?.[0]}>
        <Textarea
          id="session-notes"
          className="min-h-20 bg-white text-xs"
          value={notes}
          maxLength={1000}
          placeholder="منبع، صفحه یا نکته‌ای برای این جلسه..."
          onChange={(event) => setNotes(event.target.value)}
        />
      </Field>
        </div>
      </details>

      <div className="flex flex-wrap items-center gap-2 border-t border-line pt-3">
        {editing && session ? (
          <ConfirmDeleteButton
            action={() => deleteSessionAction({ id: session.id, scope: "single" })}
            title="حذف این جلسه؟"
            description="فقط همین جلسه حذف می‌شود. برای حذف کل برنامه از بخش برنامه‌های تکرارشونده استفاده کن."
            onDone={onDone}
          />
        ) : null}
        <div className="mr-auto flex items-center gap-2">
          <Button variant="ghost" type="button" onClick={onDone} disabled={pending}>
            انصراف
          </Button>
          <Button type="submit" loading={pending}>
            <Save className="size-4" aria-hidden="true" />
            {editing ? "ذخیره" : mode === "series" ? "ساختن برنامه" : "افزودن جلسه"}
          </Button>
        </div>
      </div>
      {editing && session?.seriesId ? (
        <p className="flex items-center gap-1 text-[0.58rem] text-muted">
          <Trash2 className="size-3" aria-hidden="true" />
          برای حذف کل برنامه از فهرست «برنامه‌های تکرارشونده» پایین صفحه استفاده کن.
        </p>
      ) : null}
    </form>
  );
}
