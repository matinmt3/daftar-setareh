"use client";

import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  Clock3,
  FlaskConical,
  Globe2,
  GraduationCap,
  Loader2,
  Sparkles,
  Target,
  Wrench,
} from "lucide-react";
import { completeOnboardingAction } from "@/server/actions/profile";
import {
  DEFAULT_DAILY_GOAL,
  DEFAULT_GRADE_SCALE,
  GRADE_LEVELS,
  STUDY_FIELDS,
  type StudyFieldValue,
} from "@/lib/constants";
import { defaultSubjectsFor } from "@/lib/subject-presets";
import { toPersianDigits } from "@/lib/format";
import { InlineAlert } from "@/components/ui/form";
import { cn } from "@/lib/cn";

function isRedirectError(error: unknown): boolean {
  return Boolean(
    error &&
      typeof error === "object" &&
      "digest" in error &&
      String((error as { digest?: unknown }).digest).startsWith("NEXT_REDIRECT"),
  );
}

const fieldIcons = {
  math: FlaskConical,
  science: GraduationCap,
  humanities: Globe2,
  vocational: Wrench,
} as const;

const goalOptions = [45, 60, 90, 120, 150, 180];

export function OnboardingForm({
  initialName,
  initialGrade,
}: {
  initialName: string;
  initialGrade: number | null;
}) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState(initialName);
  const [grade, setGrade] = useState<number | null>(initialGrade);
  const [field, setField] = useState<StudyFieldValue | null>(null);
  const [dailyGoal, setDailyGoal] = useState(DEFAULT_DAILY_GOAL);
  const [scale, setScale] = useState(DEFAULT_GRADE_SCALE);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const needsField = Boolean(grade && grade >= 10);
  const totalSteps = needsField ? 3 : 2;
  const previewSubjects = useMemo(
    () => (grade ? defaultSubjectsFor(grade, field).slice(0, 6) : []),
    [grade, field],
  );

  function next(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (step === 1) {
      if (name.trim().length < 2) {
        setError("نامت را کامل‌تر بنویس؛ دست‌کم دو نویسه.");
        return;
      }
      if (!grade) {
        setError("پایهٔ تحصیلی را انتخاب کن.");
        return;
      }
      setStep(2);
      return;
    }
    if (step === 2 && needsField) {
      if (!field) {
        setError("رشتهٔ تحصیلی را انتخاب کن.");
        return;
      }
      setStep(3);
      return;
    }
    void submit();
  }

  async function submit() {
    if (!grade) return;
    setPending(true);
    setError(null);
    try {
      const result = await completeOnboardingAction({
        name,
        gradeLevel: grade,
        field: needsField ? field : null,
        dailyGoalMinutes: dailyGoal,
        gradeScale: scale,
      });
      if (!result.ok) {
        if (result.fieldErrors) {
          const first = Object.values(result.fieldErrors)[0]?.[0];
          setError(first ?? result.message);
        } else {
          setError(result.message);
        }
      }
    } catch (caught) {
      if (isRedirectError(caught)) throw caught;
      setError("ثبت اطلاعات انجام نشد. دوباره تلاش کن.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="card noise-overlay overflow-hidden">
      <div className="border-b border-line bg-[#fdfaf4] px-5 py-4 sm:px-7">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-[0.7rem] font-semibold text-ink-soft">
            <span className="flex size-7 items-center justify-center rounded-lg bg-violet-soft text-violet-deep">
              {numberIcon(step)}
            </span>
            قدم {toPersianDigits(step)} از {toPersianDigits(totalSteps)}
          </div>
          <div className="flex gap-1" aria-hidden="true">
            {Array.from({ length: totalSteps }).map((_, index) => (
              <span
                key={index}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  index < step ? "w-7 bg-violet" : "w-3 bg-[#e5ddd0]",
                )}
              />
            ))}
          </div>
        </div>
      </div>

      <form onSubmit={next} className="p-5 sm:p-7">
        {error ? (
          <InlineAlert tone="error" className="mb-4">
            {error}
          </InlineAlert>
        ) : null}

        {step === 1 ? (
          <div className="animate-[rise_0.35s_ease-out]">
            <SectionTitle
              icon={<Sparkles className="size-4" />}
              title="از خودت بگو"
              description="این اطلاعات فقط برای شخصی‌سازی دفتر و کارنامه‌هایت استفاده می‌شود."
            />
            <label htmlFor="student-name" className="label mt-5">
              اسمی که صدایت کنیم
            </label>
            <input
              id="student-name"
              className="field h-11"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="مثلاً سارا"
              maxLength={50}
              autoComplete="name"
              autoFocus
            />

            <p className="label mt-5">پایهٔ تحصیلی</p>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
              {GRADE_LEVELS.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setGrade(item.value)}
                  className={cn(
                    "relative rounded-xl border px-2 py-2.5 text-center transition-all",
                    grade === item.value
                      ? "border-violet bg-violet-soft text-violet-deep shadow-sm"
                      : "border-[#e2d9ca] bg-white text-ink-soft hover:border-violet/40 hover:bg-[#fbf8f2]",
                  )}
                  aria-pressed={grade === item.value}
                >
                  <span className="num block text-sm font-extrabold">{toPersianDigits(item.value)}</span>
                  <span className="mt-0.5 block text-[0.58rem] text-muted">{item.band}</span>
                  {grade === item.value ? (
                    <span className="absolute -top-1.5 -left-1.5 flex size-4 items-center justify-center rounded-full bg-violet text-white">
                      <Check className="size-2.5" aria-hidden="true" />
                    </span>
                  ) : null}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {step === 2 && needsField ? (
          <div className="animate-[rise_0.35s_ease-out]">
            <SectionTitle
              icon={<GraduationCap className="size-4" />}
              title="رشتهٔ تحصیلی‌ات چیست؟"
              description="درس‌های پیشنهادی و تحلیل‌ها بر اساس رشته تنظیم می‌شوند."
            />
            <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
              {STUDY_FIELDS.map((item) => {
                const Icon = fieldIcons[item.value as StudyFieldValue];
                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setField(item.value)}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl border p-3.5 text-right transition-all",
                      field === item.value
                        ? "border-violet bg-violet-soft shadow-sm"
                        : "border-[#e2d9ca] bg-white hover:border-violet/40 hover:bg-[#fbf8f2]",
                    )}
                    aria-pressed={field === item.value}
                  >
                    <span
                      className={cn(
                        "flex size-10 shrink-0 items-center justify-center rounded-xl",
                        field === item.value ? "bg-white text-violet-deep" : "bg-[#f4f0e7] text-muted",
                      )}
                    >
                      <Icon className="size-5" aria-hidden="true" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-bold text-ink">{item.label}</span>
                      <span className="mt-0.5 block text-[0.65rem] text-muted">
                        {item.value === "math"
                          ? "ریاضی، فیزیک، شیمی"
                          : item.value === "science"
                            ? "زیست، شیمی، فیزیک"
                            : item.value === "humanities"
                              ? "ادبیات، تاریخ، فلسفه"
                              : "مهارت‌های فنی و کارگاهی"}
                      </span>
                    </span>
                    {field === item.value ? (
                      <Check className="mr-auto size-4 text-violet-deep" aria-hidden="true" />
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        {step === 2 && !needsField ? (
          <StudySettings
            dailyGoal={dailyGoal}
            setDailyGoal={setDailyGoal}
            scale={scale}
            setScale={setScale}
            previewSubjects={previewSubjects}
          />
        ) : null}

        {step === 3 ? (
          <StudySettings
            dailyGoal={dailyGoal}
            setDailyGoal={setDailyGoal}
            scale={scale}
            setScale={setScale}
            previewSubjects={previewSubjects}
          />
        ) : null}

        <div className="mt-7 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              setError(null);
              setStep((current) => Math.max(1, current - 1));
            }}
            className={cn("btn btn-ghost text-xs", step === 1 && "invisible")}
            disabled={pending}
          >
            <ArrowRight className="size-4" aria-hidden="true" />
            مرحلهٔ قبل
          </button>
          <button type="submit" className="btn btn-primary min-w-36 text-sm" disabled={pending}>
            {pending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : step === totalSteps ? (
              <Target className="size-4" aria-hidden="true" />
            ) : null}
            {pending ? "در حال آماده‌سازی..." : step === totalSteps ? "ساخت دفتر من" : "ادامه"}
            {!pending && step !== totalSteps ? <ArrowLeft className="size-4" aria-hidden="true" /> : null}
          </button>
        </div>
      </form>
    </div>
  );
}

function StudySettings({
  dailyGoal,
  setDailyGoal,
  scale,
  setScale,
  previewSubjects,
}: {
  dailyGoal: number;
  setDailyGoal: (value: number) => void;
  scale: number;
  setScale: (value: number) => void;
  previewSubjects: { name: string; color: string }[];
}) {
  return (
    <div className="animate-[rise_0.35s_ease-out]">
      <SectionTitle
        icon={<Clock3 className="size-4" />}
        title="ریتم مطالعه‌ات را بچین"
        description="این عددها فقط نقطهٔ شروع‌اند؛ بعداً در تنظیمات قابل تغییرند."
      />

      <p className="label mt-5">هدف روزانهٔ مطالعه</p>
      <div className="grid grid-cols-3 gap-2">
        {goalOptions.map((minutes) => (
          <button
            key={minutes}
            type="button"
            onClick={() => setDailyGoal(minutes)}
            className={cn(
              "rounded-xl border px-2 py-2.5 text-center transition-all",
              dailyGoal === minutes
                ? "border-violet bg-violet-soft text-violet-deep"
                : "border-[#e2d9ca] bg-white text-ink-soft hover:border-violet/40",
            )}
            aria-pressed={dailyGoal === minutes}
          >
            <span className="num block text-sm font-extrabold">{toPersianDigits(minutes)}</span>
            <span className="mt-0.5 block text-[0.6rem] text-muted">دقیقه</span>
          </button>
        ))}
      </div>

      <p className="label mt-5">مقیاس نمایش نمره‌ها</p>
      <div className="grid grid-cols-2 gap-2">
        {[20, 100].map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setScale(value)}
            className={cn(
              "flex items-center justify-between rounded-xl border px-3.5 py-3 transition-all",
              scale === value
                ? "border-violet bg-violet-soft"
                : "border-[#e2d9ca] bg-white hover:border-violet/40",
            )}
            aria-pressed={scale === value}
          >
            <span className="text-sm font-bold text-ink">
              {value === 20 ? "از ۲۰" : "درصدی (۱۰۰)"}
            </span>
            <span
              className={cn(
                "flex size-5 items-center justify-center rounded-full border",
                scale === value ? "border-violet bg-violet text-white" : "border-[#d7cebe]",
              )}
            >
              {scale === value ? <Check className="size-3" aria-hidden="true" /> : null}
            </span>
          </button>
        ))}
      </div>

      <div className="mt-5 rounded-2xl bg-[#f6f1e8] p-3.5">
        <p className="flex items-center gap-1.5 text-[0.7rem] font-semibold text-ink-soft">
          <BookOpen className="size-3.5 text-violet-deep" aria-hidden="true" />
          درس‌های پیشنهادی
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {previewSubjects.map((subject) => (
            <span key={subject.name} className="chip bg-white">
              {subject.name}
            </span>
          ))}
          <span className="chip bg-transparent text-muted">و قابل ویرایش در تنظیمات</span>
        </div>
      </div>
    </div>
  );
}

function SectionTitle({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-gold-soft text-[#8a6410]">
        {icon}
      </span>
      <div>
        <h2 className="text-base font-extrabold text-ink">{title}</h2>
        <p className="mt-1 text-xs leading-6 text-muted">{description}</p>
      </div>
    </div>
  );
}

function numberIcon(step: number) {
  return step === 1 ? "۱" : step === 2 ? "۲" : "۳";
}
