import { z } from "zod";
import { DEFAULT_DAILY_GOAL, DEFAULT_GRADE_SCALE, SUBJECT_COLORS, SUBJECT_ICONS } from "./constants";
import { isValidISODate, timeToMinutes } from "./dates";
import { normalizePhone } from "./phone";
import { toLatinDigits } from "./format";

const isTime = (value: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(value);

const numberFromInput = z
  .union([z.number(), z.string()])
  .transform((value, ctx) => {
    const normalized = typeof value === "string" ? toLatinDigits(value).replace(/[,٬\s]/g, "").replace(/٫/g, ".") : value;
    const parsed = Number(normalized);
    if (!Number.isFinite(parsed)) {
      ctx.addIssue({ code: "custom", message: "یک عدد معتبر وارد کن." });
      return z.NEVER;
    }
    return parsed;
  });

const optionalNumberFromInput = z
  .union([z.number(), z.string(), z.null(), z.undefined()])
  .transform((value, ctx) => {
    if (value === null || value === undefined || (typeof value === "string" && value.trim() === "")) return null;
    const normalized = typeof value === "string" ? toLatinDigits(value).replace(/[,٬\s]/g, "").replace(/٫/g, ".") : value;
    const parsed = Number(normalized);
    if (!Number.isFinite(parsed)) {
      ctx.addIssue({ code: "custom", message: "یک عدد معتبر وارد کن." });
      return z.NEVER;
    }
    return parsed;
  });

const optionalText = (max = 1200) =>
  z
    .string()
    .trim()
    .max(max, { message: `این متن نباید بیشتر از ${max} نویسه باشد.` })
    .optional()
    .transform((value) => value ?? "");

const optionalId = z
  .string()
  .trim()
  .nullable()
  .optional()
  .transform((value) => (value ? value : null));

export const phoneSchema = z
  .string()
  .min(1, { message: "شمارهٔ موبایل را وارد کن." })
  .transform((value, ctx) => {
    const normalized = normalizePhone(value);
    if (!normalized) {
      ctx.addIssue({ code: "custom", message: "شمارهٔ موبایل معتبر نیست. مثل ۰۹۱۲۳۴۵۶۷۸۹ وارد کن." });
      return z.NEVER;
    }
    return normalized;
  });

export const otpSchema = z.object({
  phone: phoneSchema,
  code: z
    .string()
    .transform((value) => toLatinDigits(value).replace(/\s/g, ""))
    .refine((value) => /^\d{6}$/.test(value), { message: "کد تأیید باید ۶ رقم باشد." }),
});

export const requestOtpSchema = z.object({
  phone: phoneSchema,
});

export const nameSchema = z
  .string()
  .trim()
  .min(2, { message: "نامت را کامل‌تر بنویس." })
  .max(50, { message: "نام نباید بیشتر از ۵۰ نویسه باشد." });

export const gradeLevelSchema = numberFromInput.pipe(z
  .number()
  .int()
  .min(1, { message: "پایهٔ تحصیلی را انتخاب کن." })
  .max(12, { message: "پایهٔ تحصیلی معتبر نیست." }));

export const gradeScaleSchema = numberFromInput.pipe(z
  .number()
  .int()
  .min(1, { message: "مقیاس نمره معتبر نیست." })
  .max(100, { message: "مقیاس نمره باید حداکثر ۱۰۰ باشد." }));

export const dailyGoalSchema = numberFromInput.pipe(z
  .number()
  .int()
  .min(15, { message: "هدف روزانه باید دست‌کم ۱۵ دقیقه باشد." })
  .max(720, { message: "هدف روزانه نباید بیشتر از ۱۲ ساعت باشد." }));

export const onboardingSchema = z.object({
  name: nameSchema,
  gradeLevel: gradeLevelSchema,
  field: z.enum(["math", "science", "humanities", "vocational"]).nullable().optional(),
  dailyGoalMinutes: dailyGoalSchema.default(DEFAULT_DAILY_GOAL),
  gradeScale: gradeScaleSchema.default(DEFAULT_GRADE_SCALE),
});

export const profileSchema = z.object({
  name: nameSchema,
  gradeLevel: gradeLevelSchema,
  field: z.enum(["math", "science", "humanities", "vocational"]).nullable().optional(),
  gradeScale: gradeScaleSchema,
  dailyGoalMinutes: dailyGoalSchema,
  notificationEnabled: z.boolean().default(false),
  reminderLeadMinutes: numberFromInput.pipe(z.number().int().min(0).max(180)).default(15),
});

const subjectColorValues = SUBJECT_COLORS.map((item) => item.value) as [string, ...string[]];
const subjectIconValues = SUBJECT_ICONS.map((item) => item.value) as [string, ...string[]];

export const subjectSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: "نام درس را بنویس." })
    .max(40, { message: "نام درس نباید بیشتر از ۴۰ نویسه باشد." }),
  color: z.enum(subjectColorValues).default("violet"),
  icon: z.enum(subjectIconValues).default("book-open"),
});

export const subjectUpdateSchema = subjectSchema.extend({
  id: z.string().min(1),
  isArchived: z.boolean().optional(),
});

export const examSchema = z
  .object({
    id: z.string().optional(),
    subjectId: z.string().min(1, { message: "درس آزمون را انتخاب کن." }),
    title: z
      .string()
      .trim()
      .min(2, { message: "عنوان آزمون را بنویس." })
      .max(80, { message: "عنوان آزمون نباید بیشتر از ۸۰ نویسه باشد." }),
    examDate: z
      .string()
      .refine(isValidISODate, { message: "تاریخ آزمون معتبر نیست." }),
    grade: optionalNumberFromInput,
    maxGrade: numberFromInput,
    weight: optionalNumberFromInput,
    notes: optionalText(1000),
  })
  .superRefine((data, ctx) => {
    if (data.maxGrade <= 0) {
      ctx.addIssue({ code: "custom", path: ["maxGrade"], message: "نمرهٔ کل باید بیشتر از صفر باشد." });
    }
    if (data.grade !== null) {
      if (data.grade < 0) {
        ctx.addIssue({ code: "custom", path: ["grade"], message: "نمره نمی‌تواند منفی باشد." });
      }
      if (data.grade > data.maxGrade) {
        ctx.addIssue({ code: "custom", path: ["grade"], message: "نمره نمی‌تواند از نمرهٔ کل بیشتر باشد." });
      }
    }
    if (data.weight !== null && (data.weight < 0.1 || data.weight > 10)) {
      ctx.addIssue({ code: "custom", path: ["weight"], message: "وزن آزمون باید بین ۰٫۱ و ۱۰ باشد." });
    }
  });

export const reportSubjectInputSchema = z.object({
  subjectId: z.string().min(1, { message: "درس را انتخاب کن." }),
  minutes: numberFromInput.pipe(z
    .number()
    .int()
    .min(0, { message: "زمان مطالعه نمی‌تواند منفی باشد." })
    .max(1440, { message: "زمان مطالعهٔ یک درس در روز حداکثر ۲۴ ساعت است." })),
  note: optionalText(300),
});

export const reportTaskInputSchema = z.object({
  id: z.string().optional(),
  subjectId: optionalId,
  title: z
    .string()
    .trim()
    .min(1, { message: "عنوان کار را بنویس." })
    .max(160, { message: "عنوان کار نباید بیشتر از ۱۶۰ نویسه باشد." }),
  status: z.enum(["completed", "pending"]),
});

export const dailyReportSchema = z
  .object({
    id: z.string().optional(),
    reportDate: z.string().refine(isValidISODate, { message: "تاریخ گزارش معتبر نیست." }),
    entryIndex: numberFromInput.pipe(z.number().int().min(0).max(20)).default(0),
    subjects: z.array(reportSubjectInputSchema).max(20).default([]),
    tasks: z.array(reportTaskInputSchema).max(40).default([]),
    lessonsReviewed: optionalText(1200),
    exercises: optionalText(1200),
    difficulties: optionalText(1200),
    reflection: optionalText(1500),
    nextDayGoals: optionalText(1200),
    allowAdditional: z.boolean().optional().default(false),
  })
  .superRefine((data, ctx) => {
    const studied = data.subjects.some((subject) => subject.minutes > 0);
    const hasTask = data.tasks.length > 0;
    const hasText = Boolean(
      data.lessonsReviewed.trim() ||
        data.exercises.trim() ||
        data.difficulties.trim() ||
        data.reflection.trim() ||
        data.nextDayGoals.trim(),
    );
    if (!studied && !hasTask && !hasText) {
      ctx.addIssue({
        code: "custom",
        path: ["subjects"],
        message: "دست‌کم زمان مطالعهٔ یک درس یا یک کار را ثبت کن.",
      });
    }
    const subjectIds = data.subjects.map((item) => item.subjectId);
    if (new Set(subjectIds).size !== subjectIds.length) {
      ctx.addIssue({ code: "custom", path: ["subjects"], message: "هر درس را فقط یک بار می‌توانی وارد کنی." });
    }
  });

const studySessionBaseSchema = z.object({
  id: z.string().optional(),
  subjectId: optionalId,
  title: z
    .string()
    .trim()
    .min(2, { message: "عنوان جلسه را بنویس." })
    .max(100, { message: "عنوان جلسه نباید بیشتر از ۱۰۰ نویسه باشد." }),
  kind: z.enum(["study", "homework", "revision", "exam-prep", "project"]).default("study"),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  notes: optionalText(1000),
  sessionDate: z.string().refine(isValidISODate, { message: "تاریخ جلسه معتبر نیست." }),
  startTime: z.string().refine(isTime, { message: "ساعت شروع معتبر نیست." }),
  endTime: z.string().refine(isTime, { message: "ساعت پایان معتبر نیست." }),
  reminderMinutes: numberFromInput.pipe(z.number().int().min(0).max(1440)).default(15),
});

function checkSessionTime(
  data: { startTime: string; endTime: string },
  ctx: z.RefinementCtx,
): void {
  if (data.endTime <= data.startTime) {
    ctx.addIssue({ code: "custom", path: ["endTime"], message: "ساعت پایان باید بعد از ساعت شروع باشد." });
  }
  if (data.startTime === data.endTime) {
    ctx.addIssue({ code: "custom", path: ["endTime"], message: "مدت جلسه باید بیشتر از صفر باشد." });
  }
}

export const studySessionSchema = studySessionBaseSchema.superRefine(checkSessionTime);

export const studySeriesSchema = z
  .object({
    subjectId: optionalId,
    title: z
      .string()
      .trim()
      .min(2, { message: "عنوان برنامه را بنویس." })
      .max(100, { message: "عنوان برنامه نباید بیشتر از ۱۰۰ نویسه باشد." }),
    kind: z.enum(["study", "homework", "revision", "exam-prep", "project"]).default("study"),
    priority: z.enum(["low", "medium", "high"]).default("medium"),
    notes: optionalText(1000),
    startDate: z.string().refine(isValidISODate, { message: "تاریخ شروع معتبر نیست." }),
    endDate: z.string().refine(isValidISODate, { message: "تاریخ پایان معتبر نیست." }),
    weekdays: z.array(z.number().int().min(0).max(6)).min(1, { message: "دست‌کم یک روز هفته را انتخاب کن." }),
    startTime: z.string().refine(isTime, { message: "ساعت شروع معتبر نیست." }),
    durationMinutes: numberFromInput.pipe(z.number().int().min(10, { message: "مدت جلسه دست‌کم ۱۰ دقیقه باشد." }).max(480)),
    reminderMinutes: numberFromInput.pipe(z.number().int().min(0).max(1440)).default(15),
  })
  .superRefine((data, ctx) => {
    if (data.endDate < data.startDate) {
      ctx.addIssue({ code: "custom", path: ["endDate"], message: "تاریخ پایان باید بعد از تاریخ شروع باشد." });
    }
    if (timeToMinutes(data.startTime) + data.durationMinutes >= 1440) {
      ctx.addIssue({ code: "custom", path: ["durationMinutes"], message: "جلسه باید پیش از پایان همان روز تمام شود." });
    }
  });

export const goalSchema = z
  .object({
    id: z.string().optional(),
    title: z
      .string()
      .trim()
      .min(2, { message: "عنوان هدف را بنویس." })
      .max(80, { message: "عنوان هدف نباید بیشتر از ۸۰ نویسه باشد." }),
    metric: z.enum(["study-minutes", "tasks-completed", "exam-average"]),
    period: z.enum(["daily", "weekly", "monthly"]),
    targetValue: numberFromInput,
    startDate: z.string().refine(isValidISODate, { message: "تاریخ شروع هدف معتبر نیست." }),
    endDate: z
      .string()
      .nullable()
      .optional()
      .transform((value) => (value ? value : null))
      .refine((value) => value === null || isValidISODate(value), { message: "تاریخ پایان هدف معتبر نیست." }),
  })
  .superRefine((data, ctx) => {
    if (data.targetValue <= 0) {
      ctx.addIssue({ code: "custom", path: ["targetValue"], message: "مقدار هدف باید بیشتر از صفر باشد." });
    }
    if (data.endDate && data.endDate < data.startDate) {
      ctx.addIssue({ code: "custom", path: ["endDate"], message: "تاریخ پایان باید بعد از تاریخ شروع باشد." });
    }
    if (data.metric === "exam-average" && (data.targetValue < 0 || data.targetValue > 100)) {
      ctx.addIssue({ code: "custom", path: ["targetValue"], message: "هدف معدل باید درصدی بین ۰ تا ۱۰۰ باشد." });
    }
    if (data.metric !== "exam-average" && !Number.isInteger(data.targetValue)) {
      ctx.addIssue({ code: "custom", path: ["targetValue"], message: "این هدف باید عدد صحیح باشد." });
    }
  });

export const deleteConfirmSchema = z.object({
  id: z.string().min(1),
  confirm: z.literal(true, { message: "برای حذف، تأیید کن." }),
});

export const sessionScopeSchema = z.enum(["single", "future", "series"]);

export const studySessionUpdateSchema = studySessionBaseSchema
  .extend({
    id: z.string().min(1),
    scope: sessionScopeSchema.default("single"),
  })
  .superRefine(checkSessionTime);

export const reportIdSchema = z.object({ id: z.string().min(1) });
export const examIdSchema = z.object({ id: z.string().min(1) });

export function fieldErrorsFromZod(error: z.ZodError): Record<string, string[]> {
  const errors: Record<string, string[]> = {};
  error.issues.forEach((issue) => {
    const key = issue.path.length > 0 ? issue.path.join(".") : "_form";
    const list = errors[key] ?? [];
    list.push(issue.message);
    errors[key] = list;
  });
  return errors;
}

export const studyGoalIdSchema = z.object({ id: z.string().min(1) });

export const accountDeleteSchema = z.object({
  confirmation: z
    .string()
    .trim()
    .refine((value) => value === "حذف حساب", { message: "برای حذف حساب عبارت «حذف حساب» را بنویس." }),
});
