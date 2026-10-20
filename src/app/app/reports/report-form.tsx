"use client";

import { useMemo, useState, useTransition, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  Loader2,
  NotebookPen,
  Plus,
  Send,
  Sparkles,
  Trash2,
} from "lucide-react";
import { saveReportAction } from "@/server/actions/reports";
import type { DailyReport, ReportTask, Subject } from "@/lib/types";
import { faNum, toLatinDigits, toPersianDigits } from "@/lib/format";
import { reportEntryTitle } from "@/lib/constants";
import { formatNumericDate } from "@/lib/dates";
import { Field, InlineAlert, Input, Select, Textarea } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { JalaliDatePicker } from "@/components/ui/jalali-date-picker";
import { SubjectIcon } from "@/components/subject-icon";
import { showToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import { runAction } from "@/components/ui/run-action";

type TaskDraft = {
  key: string;
  title: string;
  subjectId: string;
  status: "completed" | "pending";
};

type TextValues = {
  lessonsReviewed: string;
  exercises: string;
  difficulties: string;
  reflection: string;
  nextDayGoals: string;
};

const textFields: { key: keyof TextValues; label: string; placeholder: string; hint?: string }[] = [
  {
    key: "lessonsReviewed",
    label: "چه چیزهایی مرور شد؟",
    placeholder: "مثلاً فصل دوم ریاضی، لغت‌های درس سه انگلیسی...",
  },
  {
    key: "exercises",
    label: "تمرین‌ها و تکالیف",
    placeholder: "کدام تمرین‌ها را انجام دادی؟",
  },
  {
    key: "difficulties",
    label: "کجا گیر کردی؟",
    placeholder: "اگر بخشی سخت بود، همین‌جا بنویس تا فردا سراغش بروی.",
    hint: "نوشتن سختی‌ها کمک می‌کند فردا هدفمندتر شروع کنی.",
  },
  {
    key: "reflection",
    label: "یک جمله دربارهٔ امروز",
    placeholder: "امروز چطور گذشت؟",
  },
  {
    key: "nextDayGoals",
    label: "هدف فردا",
    placeholder: "فردا می‌خواهم...",
  },
];

function taskDraft(task?: Partial<TaskDraft>): TaskDraft {
  return {
    key: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: task?.title ?? "",
    subjectId: task?.subjectId ?? "",
    status: task?.status ?? "pending",
  };
}

function initialTasks(report: DailyReport | null | undefined): TaskDraft[] {
  if (!report || report.tasks.length === 0) return [];
  return report.tasks.map((task: ReportTask) =>
    taskDraft({ title: task.title, subjectId: task.subjectId ?? "", status: task.status }),
  );
}

export function ReportForm({
  subjects,
  initialDate,
  initialReport,
  allowAdditional,
  existingCount,
}: {
  subjects: Subject[];
  initialDate: string;
  initialReport?: DailyReport | null;
  allowAdditional: boolean;
  existingCount: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [reportDate, setReportDate] = useState(initialReport?.reportDate ?? initialDate);
  const [minutes, setMinutes] = useState<Record<string, string>>(() => {
    const values: Record<string, string> = {};
    initialReport?.subjects.forEach((entry) => {
      values[entry.subjectId] = entry.minutes > 0 ? String(entry.minutes) : "";
    });
    return values;
  });
  const [notes, setNotes] = useState<Record<string, string>>(() => {
    const values: Record<string, string> = {};
    initialReport?.subjects.forEach((entry) => {
      values[entry.subjectId] = entry.note ?? "";
    });
    return values;
  });
  const [openNotes, setOpenNotes] = useState<string[]>(() =>
    initialReport?.subjects.filter((entry) => entry.note).map((entry) => entry.subjectId) ?? [],
  );
  const [tasks, setTasks] = useState<TaskDraft[]>(() => initialTasks(initialReport));
  const [texts, setTexts] = useState<TextValues>({
    lessonsReviewed: initialReport?.lessonsReviewed ?? "",
    exercises: initialReport?.exercises ?? "",
    difficulties: initialReport?.difficulties ?? "",
    reflection: initialReport?.reflection ?? "",
    nextDayGoals: initialReport?.nextDayGoals ?? "",
  });
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const totalMinutes = useMemo(
    () =>
      Object.values(minutes).reduce((sum, value) => {
        const number = Number(toLatinDigits(value).replace(/[^\d]/g, ""));
        return sum + (Number.isFinite(number) ? number : 0);
      }, 0),
    [minutes],
  );
  const filledSubjects = subjects.filter((subject) => {
    const value = Number(toLatinDigits(minutes[subject.id] ?? "").replace(/[^\d]/g, ""));
    return value > 0 || (notes[subject.id] ?? "").trim().length > 0;
  }).length;
  const completedTasks = tasks.filter((task) => task.status === "completed" && task.title.trim()).length;

  const updateTask = (key: string, patch: Partial<TaskDraft>) => {
    setTasks((current) => current.map((task) => (task.key === key ? { ...task, ...patch } : task)));
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setFieldErrors({});
    const subjectPayload = subjects
      .map((subject) => ({
        subjectId: subject.id,
        minutes: minutes[subject.id] || "0",
        note: notes[subject.id] ?? "",
      }))
      .filter((subject) => {
        const value = Number(toLatinDigits(String(subject.minutes)).replace(/[^\d]/g, ""));
        return value > 0 || subject.note.trim().length > 0;
      });
    const taskPayload = tasks
      .filter((task) => task.title.trim())
      .map((task) => ({
        subjectId: task.subjectId || null,
        title: task.title.trim(),
        status: task.status,
      }));

    startTransition(async () => {
      const result = await runAction(() => saveReportAction({
        id: initialReport?.id,
        reportDate,
        entryIndex: initialReport?.entryIndex ?? existingCount,
        allowAdditional,
        subjects: subjectPayload,
        tasks: taskPayload,
        ...texts,
      }));
      if (!result.ok) {
        setError(result.message);
        setFieldErrors(result.fieldErrors ?? {});
        showToast({ title: "گزارش ذخیره نشد", description: result.message, tone: "error" });
        return;
      }
      showToast({
        title: initialReport ? "گزارش به‌روز شد" : "گزارش ثبت شد",
        description: "صفحهٔ امروزت به دفتر اضافه شد.",
        tone: "success",
      });
      const reportId = result.data?.id;
      router.push(reportId ? `/app/reports/${reportId}` : "/app/reports");
      router.refresh();
    });
  };

  return (
    <form onSubmit={submit} className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
      <div className="space-y-5">
        {error ? <InlineAlert title={error}>{fieldErrors._form?.join(" ")}</InlineAlert> : null}

        <section className="card p-4 sm:p-5">
          <div className="mb-4 flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-xl bg-violet-soft text-violet-deep">
              <CalendarDays className="size-4" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-sm font-bold text-ink">تاریخ گزارش</h2>
              <p className="mt-0.5 text-[0.65rem] text-muted">
                {initialReport
                  ? reportEntryTitle(initialReport.entryIndex)
                  : allowAdditional
                    ? `${reportEntryTitle(existingCount)} • گزارش تکمیلی`
                    : "گزارش اصلی روز"}
              </p>
            </div>
          </div>
          <div className="max-w-sm">
            <Field label="تاریخ" htmlFor="report-date" error={fieldErrors.reportDate?.[0]}>
              <JalaliDatePicker
                id="report-date"
                value={reportDate}
                onChange={setReportDate}
              />
            </Field>
          </div>
        </section>

        <section className="card p-4 sm:p-5">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="flex items-center gap-2 text-sm font-bold text-ink">
                <NotebookPen className="size-4 text-violet-deep" aria-hidden="true" />
                مطالعهٔ امروز
              </h2>
              <p className="mt-1 text-[0.65rem] text-muted">
                برای هر درس زمان بگذار؛ یادداشت اختیاری است.
              </p>
            </div>
            <span className="rounded-full bg-violet-soft px-2.5 py-1 text-[0.65rem] font-bold text-violet-deep">
              {filledSubjects} درس
            </span>
          </div>

          {subjects.length === 0 ? (
            <InlineAlert tone="warning">
              هنوز درسی نداری. اول از بخش درس‌ها یک درس اضافه کن.
            </InlineAlert>
          ) : (
            <div className="space-y-2">
              {subjects.map((subject) => {
                const noteOpen = openNotes.includes(subject.id);
                return (
                  <div
                    key={subject.id}
                    className={cn(
                      "rounded-xl border bg-[#fdfaf4] p-2.5 transition-colors",
                      (minutes[subject.id] || notes[subject.id]) ? "border-violet/30" : "border-line",
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <SubjectIcon icon={subject.icon} color={subject.color} size="sm" />
                      <span className="min-w-0 flex-1 truncate text-xs font-semibold text-ink">
                        {subject.name}
                      </span>
                      <div className="relative w-24">
                        <Input
                          type="text"
                          inputMode="numeric"
                          className="num h-9 py-1 pl-9 pr-2 text-center text-xs"
                          placeholder="۰"
                          value={minutes[subject.id] ?? ""}
                          onChange={(event) =>
                            setMinutes((current) => ({
                              ...current,
                              [subject.id]: toLatinDigits(event.target.value).replace(/\D/g, ""),
                            }))
                          }
                          aria-label={`دقیقهٔ مطالعه ${subject.name}`}
                        />
                        <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-[0.58rem] text-muted">
                          دقیقه
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setOpenNotes((current) =>
                            current.includes(subject.id)
                              ? current.filter((id) => id !== subject.id)
                              : [...current, subject.id],
                          )
                        }
                        className={cn(
                          "flex size-8 items-center justify-center rounded-lg border text-muted transition-colors",
                          noteOpen ? "border-violet/30 bg-violet-soft text-violet-deep" : "border-line bg-white hover:bg-paper",
                        )}
                        aria-expanded={noteOpen}
                        aria-label={`یادداشت ${subject.name}`}
                      >
                        <ChevronDown className={cn("size-3.5 transition-transform", noteOpen && "rotate-180")} aria-hidden="true" />
                      </button>
                    </div>
                    {noteOpen ? (
                      <Input
                        className="mt-2 h-9 bg-white py-1 text-xs"
                        placeholder={`یادداشت ${subject.name} (اختیاری)`}
                        value={notes[subject.id] ?? ""}
                        maxLength={300}
                        onChange={(event) =>
                          setNotes((current) => ({ ...current, [subject.id]: event.target.value }))
                        }
                        aria-label={`یادداشت ${subject.name}`}
                      />
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
          {fieldErrors.subjects?.[0] ? (
            <p className="mt-2 text-xs text-[#c73554]" role="alert">{fieldErrors.subjects[0]}</p>
          ) : null}
        </section>

        <section className="card p-4 sm:p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="flex items-center gap-2 text-sm font-bold text-ink">
                <ClipboardCheck className="size-4 text-[#157a5b]" aria-hidden="true" />
                کارهای امروز
              </h2>
              <p className="mt-1 text-[0.65rem] text-muted">هر کار را انجام‌شده یا باقی‌مانده علامت بزن.</p>
            </div>
            <button
              type="button"
              onClick={() => setTasks((current) => [...current, taskDraft()])}
              className="btn btn-secondary min-h-8 px-2.5 text-[0.68rem]"
            >
              <Plus className="size-3.5" aria-hidden="true" />
              افزودن کار
            </button>
          </div>
          {tasks.length === 0 ? (
            <p className="rounded-xl border border-dashed border-line bg-[#fdfaf4] px-3 py-5 text-center text-[0.68rem] text-muted">
              اگر امروز کاری انجام دادی، همین‌جا اضافه کن. اگر نه، خالی بگذار.
            </p>
          ) : (
            <div className="space-y-2">
              {tasks.map((task) => (
                <div key={task.key} className="grid gap-2 rounded-xl border border-line bg-[#fdfaf4] p-2.5 sm:grid-cols-[1fr_9rem_auto_auto]">
                  <Input
                    className="h-9 bg-white py-1 text-xs"
                    placeholder="عنوان کار"
                    value={task.title}
                    maxLength={160}
                    onChange={(event) => updateTask(task.key, { title: event.target.value })}
                    aria-label="عنوان کار"
                  />
                  <Select
                    className="h-9 py-1 text-xs"
                    value={task.subjectId}
                    onChange={(event) => updateTask(task.key, { subjectId: event.target.value })}
                    aria-label="درس کار"
                  >
                    <option value="">بدون درس</option>
                    {subjects.map((subject) => (
                      <option key={subject.id} value={subject.id}>{subject.name}</option>
                    ))}
                  </Select>
                  <button
                    type="button"
                    onClick={() =>
                      updateTask(task.key, {
                        status: task.status === "completed" ? "pending" : "completed",
                      })
                    }
                    className={cn(
                      "flex h-9 items-center justify-center gap-1.5 rounded-lg border px-2.5 text-[0.62rem] font-semibold transition-colors",
                      task.status === "completed"
                        ? "border-mint bg-mint-soft text-[#157a5b]"
                        : "border-line bg-white text-muted hover:border-mint",
                    )}
                    aria-pressed={task.status === "completed"}
                  >
                    <CheckCircle2 className="size-3.5" aria-hidden="true" />
                    {task.status === "completed" ? "انجام شد" : "باقی‌مانده"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setTasks((current) => current.filter((entry) => entry.key !== task.key))}
                    className="flex h-9 items-center justify-center rounded-lg px-2 text-muted transition-colors hover:bg-coral-soft hover:text-[#c73554]"
                    aria-label="حذف کار"
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="card p-4 sm:p-5">
          <div className="mb-4">
            <h2 className="flex items-center gap-2 text-sm font-bold text-ink">
              <Sparkles className="size-4 text-gold" aria-hidden="true" />
              چند خط بیشتر
            </h2>
            <p className="mt-1 text-[0.65rem] text-muted">
              این بخش اختیاری است؛ اما نوشتنش کمک می‌کند هفته را بهتر ببینی.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {textFields.map((item, index) => (
              <Field
                key={item.key}
                label={item.label}
                htmlFor={`report-${item.key}`}
                hint={item.hint}
                error={fieldErrors[item.key]?.[0]}
                className={index === 4 ? "sm:col-span-2" : undefined}
              >
                <Textarea
                  id={`report-${item.key}`}
                  className="min-h-24 bg-[#fdfaf4] text-xs"
                  value={texts[item.key]}
                  placeholder={item.placeholder}
                  maxLength={item.key === "reflection" ? 1500 : 1200}
                  onChange={(event) => setTexts((current) => ({ ...current, [item.key]: event.target.value }))}
                />
              </Field>
            ))}
          </div>
        </section>

        <div className="flex flex-wrap items-center justify-end gap-2 lg:hidden">
          <Link href="/app/reports" className="btn btn-ghost text-xs">انصراف</Link>
          <Button type="submit" loading={pending} className="text-xs">
            <Send className="size-4" aria-hidden="true" />
            {initialReport ? "ذخیرهٔ تغییرات" : "ثبت گزارش"}
          </Button>
        </div>
      </div>

      <aside className="hidden lg:block">
        <div className="sticky top-24 space-y-3">
          <div className="card overflow-hidden">
            <div className="bg-night p-4 text-white">
              <p className="text-[0.6rem] text-white/55">جمع امروز</p>
              <p className="num mt-1 text-2xl font-extrabold">
                {faNum(Math.floor(totalMinutes / 60))}
                <span className="mx-0.5 text-sm text-white/50">:</span>
                {toPersianDigits(String(totalMinutes % 60).padStart(2, "0"))}
              </p>
              <p className="mt-1 text-[0.6rem] text-white/50">ساعت مطالعه</p>
            </div>
            <div className="space-y-2.5 p-4 text-[0.68rem]">
              <div className="flex items-center justify-between">
                <span className="text-muted">درس‌های ثبت‌شده</span>
                <span className="num font-bold">{filledSubjects} از {subjects.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted">کارهای انجام‌شده</span>
                <span className="num font-bold">{completedTasks} از {tasks.filter((task) => task.title.trim()).length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted">تاریخ</span>
                <span className="num font-semibold">{formatNumericDate(reportDate)}</span>
              </div>
            </div>
            <div className="border-t border-line p-3">
              <Button type="submit" loading={pending} block className="text-xs">
                <Send className="size-4" aria-hidden="true" />
                {initialReport ? "ذخیرهٔ تغییرات" : "ثبت گزارش"}
              </Button>
              <Link href="/app/reports" className="btn btn-ghost mt-1.5 w-full text-[0.68rem]">انصراف</Link>
            </div>
          </div>
          <p className="px-1 text-[0.6rem] leading-5 text-muted">
            {pending ? (
              <span className="flex items-center gap-1.5"><Loader2 className="size-3 animate-spin" /> در حال ذخیره...</span>
            ) : (
              "می‌توانی بعداً هم همین گزارش را ویرایش کنی."
            )}
          </p>
        </div>
      </aside>
    </form>
  );
}
