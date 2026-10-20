"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import type { StudyGoal } from "@/lib/types";
import { GOAL_METRICS, GOAL_PERIODS, goalMetricLabel, goalPeriodLabel, type GoalMetric, type GoalPeriod } from "@/lib/constants";
import { todayISO } from "@/lib/dates";
import { saveGoalAction } from "@/server/actions/goals";
import { Field, InlineAlert, Input, Select } from "@/components/ui/form";
import { JalaliDatePicker } from "@/components/ui/jalali-date-picker";
import { Button } from "@/components/ui/button";
import { showToast } from "@/components/ui/toast";
import { runAction } from "@/components/ui/run-action";
import { useModalPending } from "@/components/ui/modal";

const DEFAULT_TARGETS: Record<GoalMetric, number> = {
  "study-minutes": 600,
  "tasks-completed": 10,
  "exam-average": 80,
};

function metricHint(metric: GoalMetric): string {
  if (metric === "study-minutes") return "زمان مطالعه از گزارش‌های روزانه جمع می‌شود.";
  if (metric === "tasks-completed") return "تعداد کارهای تیک‌خورده در گزارش‌های روزانه.";
  return "میانگین درصدی آزمون‌های ثبت‌شده در بازه.";
}

export function GoalForm({
  goal,
  onDone,
}: {
  goal?: StudyGoal | null;
  onDone: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  useModalPending(pending);
  const [title, setTitle] = useState(goal?.title ?? "");
  const [metric, setMetric] = useState<GoalMetric>(goal?.metric ?? "study-minutes");
  const [period, setPeriod] = useState<GoalPeriod>(goal?.period ?? "weekly");
  const [targetValue, setTargetValue] = useState(
    goal ? String(goal.targetValue) : String(DEFAULT_TARGETS["study-minutes"]),
  );
  const [startDate, setStartDate] = useState(goal?.startDate ?? todayISO());
  const [endDate, setEndDate] = useState(goal?.endDate ?? "");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const changeMetric = (value: GoalMetric) => {
    setMetric(value);
    setTargetValue(String(DEFAULT_TARGETS[value]));
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setFieldErrors({});
    startTransition(async () => {
      const result = await runAction(() => saveGoalAction({
        id: goal?.id,
        title,
        metric,
        period,
        targetValue,
        startDate,
        endDate: endDate || null,
      }));
      if (!result.ok) {
        setError(result.message);
        setFieldErrors(result.fieldErrors ?? {});
        return;
      }
      showToast({
        title: goal ? "هدف به‌روز شد" : "هدف تازه ساخته شد",
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
      <Field label="عنوان هدف" htmlFor="goal-title" required error={fieldErrors.title?.[0]}>
        <Input
          id="goal-title"
          value={title}
          maxLength={100}
          placeholder="مثلاً هر هفته ده ساعت مطالعه"
          onChange={(event) => setTitle(event.target.value)}
        />
      </Field>
      <div className="grid gap-3.5 sm:grid-cols-2">
        <Field label="معیار" htmlFor="goal-metric" error={fieldErrors.metric?.[0]}>
          <Select
            id="goal-metric"
            value={metric}
            onChange={(event) => changeMetric(event.target.value as GoalMetric)}
          >
            {GOAL_METRICS.map((item) => (
              <option key={item.value} value={item.value}>{item.label}</option>
            ))}
          </Select>
        </Field>
        <Field label="بازه" htmlFor="goal-period" error={fieldErrors.period?.[0]}>
          <Select
            id="goal-period"
            value={period}
            onChange={(event) => setPeriod(event.target.value as GoalPeriod)}
          >
            {GOAL_PERIODS.map((item) => (
              <option key={item.value} value={item.value}>{item.label}</option>
            ))}
          </Select>
        </Field>
        <Field
          label="مقدار هدف"
          htmlFor="goal-target"
          required
          error={fieldErrors.targetValue?.[0]}
          hint={metricHint(metric)}
        >
          <Input
            id="goal-target"
            inputMode="decimal"
            value={targetValue}
            onChange={(event) => setTargetValue(event.target.value)}
          />
        </Field>
        <Field label="شروع" htmlFor="goal-start" required error={fieldErrors.startDate?.[0]}>
          <JalaliDatePicker id="goal-start" value={startDate} onChange={setStartDate} />
        </Field>
      </div>
      <Field
        label="پایان (اختیاری)"
        htmlFor="goal-end"
        error={fieldErrors.endDate?.[0]}
        hint="اگر خالی بماند، هدف تا زمانی که خودت متوقفش نکنی ادامه دارد."
      >
        <JalaliDatePicker
          id="goal-end"
          value={endDate}
          onChange={setEndDate}
          min={startDate}
          allowClear
        />
      </Field>
      <div className="rounded-xl bg-paper px-3 py-2.5 text-[0.62rem] leading-5 text-muted">
        {goalMetricLabel(metric)} · {goalPeriodLabel(period)}
        {endDate ? " · بازهٔ محدود" : " · بازهٔ باز"}
      </div>
      <div className="flex items-center justify-end gap-2 border-t border-line pt-3">
        <Button variant="ghost" type="button" onClick={onDone} disabled={pending}>
          انصراف
        </Button>
        <Button type="submit" loading={pending}>
          <Save className="size-4" aria-hidden="true" />
          {goal ? "ذخیرهٔ هدف" : "ساختن هدف"}
        </Button>
      </div>
    </form>
  );
}
