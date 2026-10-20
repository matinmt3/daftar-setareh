"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { saveExamAction } from "@/server/actions/exams";
import type { ExamWithSubject, Subject } from "@/lib/types";
import { faNum, faScoreFromPercent, toLatinDigits } from "@/lib/format";
import { todayISO } from "@/lib/dates";
import { Field, InlineAlert, Input, Select, Textarea } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { JalaliDatePicker } from "@/components/ui/jalali-date-picker";
import { showToast } from "@/components/ui/toast";
import { runAction } from "@/components/ui/run-action";
import { useModalPending } from "@/components/ui/modal";

export function ExamForm({
  subjects,
  exam,
  gradeScale,
  onDone,
}: {
  subjects: Subject[];
  exam?: ExamWithSubject | null;
  gradeScale: number;
  onDone: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  useModalPending(pending);
  const [subjectId, setSubjectId] = useState(exam?.subjectId ?? subjects[0]?.id ?? "");
  const [title, setTitle] = useState(exam?.title ?? "");
  const [examDate, setExamDate] = useState(exam?.examDate ?? todayISO());
  const [grade, setGrade] = useState(exam?.grade !== null && exam?.grade !== undefined ? String(exam.grade) : "");
  const [maxGrade, setMaxGrade] = useState(String(exam?.maxGrade ?? gradeScale));
  const [weight, setWeight] = useState(exam?.weight !== null && exam?.weight !== undefined ? String(exam.weight) : "");
  const [notes, setNotes] = useState(exam?.notes ?? "");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const gradeNumber = Number(toLatinDigits(grade).replace(/[,٬\s]/g, "").replace(/٫/g, "."));
  const maxNumber = Number(toLatinDigits(maxGrade).replace(/[,٬\s]/g, "").replace(/٫/g, "."));
  const previewPercent =
    grade.trim() && Number.isFinite(gradeNumber) && Number.isFinite(maxNumber) && maxNumber > 0 && gradeNumber >= 0 && gradeNumber <= maxNumber
      ? (gradeNumber / maxNumber) * 100
      : null;

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setFieldErrors({});
    startTransition(async () => {
      const result = await runAction(() => saveExamAction({
        id: exam?.id,
        subjectId,
        title,
        examDate,
        grade: grade.trim() ? grade : null,
        maxGrade,
        weight: weight.trim() ? weight : null,
        notes,
      }));
      if (!result.ok) {
        setError(result.message);
        setFieldErrors(result.fieldErrors ?? {});
        return;
      }
      showToast({
        title: exam ? "آزمون به‌روز شد" : "آزمون ثبت شد",
        tone: "success",
      });
      onDone();
      router.refresh();
    });
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      {error ? <InlineAlert>{error}</InlineAlert> : null}
      <div className="grid gap-3.5 sm:grid-cols-2">
        <Field label="درس" htmlFor="exam-subject" required error={fieldErrors.subjectId?.[0]}>
          <Select
            id="exam-subject"
            value={subjectId}
            onChange={(event) => setSubjectId(event.target.value)}
          >
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>{subject.name}</option>
            ))}
          </Select>
        </Field>
        <Field label="عنوان آزمون" htmlFor="exam-title" required error={fieldErrors.title?.[0]}>
          <Input
            id="exam-title"
            value={title}
            maxLength={80}
            placeholder="مثلاً میان‌ترم فصل دو"
            onChange={(event) => setTitle(event.target.value)}
          />
        </Field>
        <Field label="تاریخ آزمون" htmlFor="exam-date" required error={fieldErrors.examDate?.[0]}>
          <JalaliDatePicker id="exam-date" value={examDate} onChange={setExamDate} />
        </Field>
        <Field
          label="نمره"
          htmlFor="exam-grade"
          hint="اگر هنوز نمره نگرفته‌ای، خالی بگذار."
          error={fieldErrors.grade?.[0]}
        >
          <Input
            id="exam-grade"
            value={grade}
            inputMode="decimal"
            placeholder="خالی = بدون نمره"
            onChange={(event) => setGrade(event.target.value)}
          />
        </Field>
        <Field
          label="نمرهٔ کل"
          htmlFor="exam-max"
          required
          hint={`پیش‌فرض بر اساس مقیاس دفتر: ${faNum(gradeScale)}`}
          error={fieldErrors.maxGrade?.[0]}
        >
          <Input
            id="exam-max"
            value={maxGrade}
            inputMode="decimal"
            onChange={(event) => setMaxGrade(event.target.value)}
          />
        </Field>
        <Field
          label="وزن آزمون"
          htmlFor="exam-weight"
          hint="اختیاری؛ برای آزمون‌های مهم‌تر عدد بزرگ‌تر بده."
          error={fieldErrors.weight?.[0]}
        >
          <Input
            id="exam-weight"
            value={weight}
            inputMode="decimal"
            placeholder="مثلاً ۲"
            onChange={(event) => setWeight(event.target.value)}
          />
        </Field>
      </div>

      {previewPercent !== null ? (
        <div className="rounded-xl border border-violet/20 bg-violet-soft/55 px-3.5 py-2.5 text-[0.68rem] text-violet-deep">
          پیش‌نمایش:{" "}
          <span className="num font-bold">{faScoreFromPercent(previewPercent, gradeScale)}</span>{" "}
          از {faNum(gradeScale)}
        </div>
      ) : null}

      <Field label="یادداشت" htmlFor="exam-notes" error={fieldErrors.notes?.[0]}>
        <Textarea
          id="exam-notes"
          className="min-h-20 bg-white text-xs"
          value={notes}
          maxLength={1000}
          placeholder="نکته‌ای دربارهٔ آزمون یا اشتباه‌هایی که نباید تکرار شوند..."
          onChange={(event) => setNotes(event.target.value)}
        />
      </Field>

      <div className="flex justify-end gap-2 border-t border-line pt-3">
        <Button variant="ghost" type="button" onClick={onDone} disabled={pending}>
          انصراف
        </Button>
        <Button type="submit" loading={pending}>
          <Save className="size-4" aria-hidden="true" />
          {exam ? "ذخیرهٔ تغییرات" : "ثبت آزمون"}
        </Button>
      </div>
    </form>
  );
}
