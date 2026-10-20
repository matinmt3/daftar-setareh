"use client";

import { useEffect, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { BellRing, Save, UserRound } from "lucide-react";
import type { User } from "@/lib/types";
import { GRADE_LEVELS, STUDY_FIELDS, type StudyFieldValue } from "@/lib/constants";
import { updateProfileAction } from "@/server/actions/profile";
import { Field, InlineAlert, Input, Select } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { showToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import { runAction } from "@/components/ui/run-action";

export function SettingsForm({ user }: { user: User }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState(user.name ?? "");
  const [gradeLevel, setGradeLevel] = useState(String(user.gradeLevel ?? 10));
  const [field, setField] = useState<StudyFieldValue | "">(user.field ?? "");
  const [gradeScale, setGradeScale] = useState(String(user.gradeScale));
  const [dailyGoalMinutes, setDailyGoalMinutes] = useState(String(user.dailyGoalMinutes));
  const [notificationEnabled, setNotificationEnabled] = useState(user.notificationEnabled);
  const [reminderLeadMinutes, setReminderLeadMinutes] = useState(String(user.reminderLeadMinutes));
  const [permission, setPermission] = useState("unsupported");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  useEffect(() => {
    if ("Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if (!("Notification" in window)) {
      setPermission("unsupported");
      showToast({ title: "این مرورگر از اعلان پشتیبانی نمی‌کند.", tone: "error" });
      return;
    }
    let result: NotificationPermission;
    try {
      result = await Notification.requestPermission();
    } catch {
      showToast({ title: "دریافت اجازهٔ اعلان انجام نشد", description: "اجازهٔ اعلان را از تنظیمات مرورگر بررسی کن.", tone: "error" });
      return;
    }
    setPermission(result);
    if (result === "granted") {
      setNotificationEnabled(true);
      showToast({ title: "اعلان مرورگر فعال شد", description: "یادآورها وقتی برنامه باز باشد نمایش داده می‌شوند.", tone: "success" });
    } else if (result === "denied") {
      setNotificationEnabled(false);
      showToast({
        title: "اجازهٔ اعلان داده نشد",
        description: "می‌توانی از تنظیمات مرورگر اجازه را تغییر بدهی.",
        tone: "error",
      });
    }
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setFieldErrors({});
    startTransition(async () => {
      const result = await runAction(() => updateProfileAction({
        name,
        gradeLevel,
        field: field || null,
        gradeScale,
        dailyGoalMinutes,
        notificationEnabled,
        reminderLeadMinutes,
      }));
      if (!result.ok) {
        setError(result.message);
        setFieldErrors(result.fieldErrors ?? {});
        return;
      }
      showToast({ title: "تنظیمات ذخیره شد", description: result.message, tone: "success" });
      router.refresh();
    });
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      {error ? <InlineAlert>{error}</InlineAlert> : null}

      <div className="grid gap-3.5 sm:grid-cols-2">
        <Field label="نام و نام خانوادگی" htmlFor="settings-name" required error={fieldErrors.name?.[0]} className="sm:col-span-2">
          <Input
            id="settings-name"
            value={name}
            maxLength={60}
            onChange={(event) => setName(event.target.value)}
          />
        </Field>
        <Field label="پایه" htmlFor="settings-grade" error={fieldErrors.gradeLevel?.[0]}>
          <Select id="settings-grade" value={gradeLevel} onChange={(event) => setGradeLevel(event.target.value)}>
            {GRADE_LEVELS.map((grade) => (
              <option key={grade.value} value={grade.value}>{grade.label}</option>
            ))}
          </Select>
        </Field>
        <Field label="رشته" htmlFor="settings-field" error={fieldErrors.field?.[0]} hint="برای دورهٔ ابتدایی خالی بگذار.">
          <Select
            id="settings-field"
            value={field}
            onChange={(event) => setField(event.target.value as StudyFieldValue | "")}
          >
            <option value="">بدون رشته</option>
            {STUDY_FIELDS.map((item) => (
              <option key={item.value} value={item.value}>{item.label}</option>
            ))}
          </Select>
        </Field>
        <Field label="مقیاس نمایش نمره" htmlFor="settings-scale" error={fieldErrors.gradeScale?.[0]}>
          <Select id="settings-scale" value={gradeScale} onChange={(event) => setGradeScale(event.target.value)}>
            <option value="20">از ۲۰</option>
            <option value="100">از ۱۰۰ (درصدی)</option>
          </Select>
        </Field>
        <Field
          label="هدف مطالعهٔ روزانه (دقیقه)"
          htmlFor="settings-daily"
          error={fieldErrors.dailyGoalMinutes?.[0]}
          hint="بین ۱۵ تا ۷۲۰ دقیقه."
        >
          <Input
            id="settings-daily"
            inputMode="numeric"
            value={dailyGoalMinutes}
            onChange={(event) => setDailyGoalMinutes(event.target.value)}
          />
        </Field>
      </div>

      <div className="rounded-xl border border-line bg-[#fcfaf6] p-3.5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-gold-soft text-[#8a6410]">
              <BellRing className="size-4" aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs font-bold text-ink">یادآور جلسه‌های مطالعه</p>
              <p className="mt-0.5 text-[0.6rem] leading-5 text-muted">
                اعلان مرورگر فقط زمانی کار می‌کند که دفتر ستاره در همین مرورگر باز باشد.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={requestPermission}
            disabled={permission === "granted" || permission === "unsupported"}
            className={cn(
              "rounded-lg border px-3 py-1.5 text-[0.62rem] font-semibold transition-colors",
              permission === "granted"
                ? "border-mint/30 bg-mint-soft text-[#157a5b]"
                : "border-line bg-white text-ink hover:border-violet/40 hover:text-violet-deep",
            )}
          >
            {permission === "granted"
              ? "اعلان مرورگر فعال است"
              : permission === "denied"
                ? "اجازه از تنظیمات مرورگر"
                : permission === "unsupported"
                  ? "پشتیبانی نمی‌شود"
                  : "فعال‌کردن اعلان مرورگر"}
          </button>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="flex cursor-pointer items-center gap-2 rounded-lg bg-white px-3 py-2.5 text-[0.65rem] text-ink-soft">
            <input
              type="checkbox"
              checked={notificationEnabled}
              onChange={(event) => setNotificationEnabled(event.target.checked)}
              className="size-4 accent-[#6d5bf6]"
            />
            یادآور درون‌برنامه‌ای روشن باشد
          </label>
          <Field label="چند دقیقه قبل؟" htmlFor="settings-lead" error={fieldErrors.reminderLeadMinutes?.[0]}>
            <Input
              id="settings-lead"
              inputMode="numeric"
              value={reminderLeadMinutes}
              onChange={(event) => setReminderLeadMinutes(event.target.value)}
              className="h-9 bg-white"
            />
          </Field>
        </div>
      </div>

      <div className="flex flex-col items-start gap-3 border-t border-line pt-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-center gap-1 text-[0.58rem] text-muted">
          <UserRound className="size-3" aria-hidden="true" />
          تغییرات فقط روی حساب خودت اعمال می‌شود.
        </p>
        <Button type="submit" loading={pending}>
          <Save className="size-4" aria-hidden="true" />
          ذخیرهٔ تنظیمات
        </Button>
      </div>
    </form>
  );
}
