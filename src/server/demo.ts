import { AppError } from "./errors";
import { transaction } from "./db/connection";
import {
  completeOnboarding,
  createUser,
  findUserByPhone,
  updateUserPreferences,
} from "./repositories/users";
import { findSubjectByName, insertSubjects } from "./repositories/subjects";
import { createExam } from "./repositories/exams";
import {
  createReportMetadata,
  insertReportSubjects,
  insertReportTasks,
} from "./repositories/reports";
import { createSessionRecord, createSeriesRecord, updateSessionStatus } from "./repositories/planner";
import { listSessions } from "./repositories/planner";
import { createGoal } from "./repositories/goals";
import { addDaysISO, durationBetween, todayISO } from "@/lib/dates";
import { generateRecurrenceDates } from "@/lib/recurrence";
import type { Subject, User } from "@/lib/types";

export const DEMO_PHONE = process.env.DEMO_PHONE?.trim() || "09120000000";

const demoSubjects = [
  { name: "ریاضی", color: "violet", icon: "calculator" },
  { name: "فارسی", color: "coral", icon: "book-open" },
  { name: "علوم تجربی", color: "teal", icon: "flask" },
  { name: "زبان انگلیسی", color: "sky", icon: "languages" },
  { name: "مطالعات اجتماعی", color: "indigo", icon: "globe2" },
  { name: "عربی", color: "gold", icon: "book-open" },
  { name: "پیام‌های آسمان", color: "plum", icon: "book-open" },
];

function pseudo(seed: number): number {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return value - Math.floor(value);
}

export function isDemoEnabled(): boolean {
  return process.env.DEMO_MODE === "true";
}

export function ensureDemoUser(): User {
  if (!isDemoEnabled()) {
    throw new AppError("حساب نمایشی در این نسخه فعال نیست.", { code: "demo_disabled" });
  }
  const existing = findUserByPhone(DEMO_PHONE);
  if (existing) {
    if (!existing.isDemo) {
      throw new AppError("شمارهٔ حساب نمایشی رزرو شده است و قابل استفاده نیست.", {
        code: "demo_reserved",
      });
    }
    return existing;
  }

  return transaction(() => {
    const user = createUser(DEMO_PHONE, { name: "ستارهٔ نمونه", isDemo: true });
    completeOnboarding(user.id, {
      name: "ستارهٔ نمونه",
      gradeLevel: 9,
      field: null,
      gradeScale: 20,
      dailyGoalMinutes: 120,
    });
    updateUserPreferences(user.id, { notificationEnabled: true, reminderLeadMinutes: 15 });
    insertSubjects(user.id, demoSubjects);
    const subjects = demoSubjects
      .map((subject) => findSubjectByName(user.id, subject.name))
      .filter((subject): subject is Subject => Boolean(subject));
    const subjectIds = subjects.map((subject) => subject.id);
    const today = todayISO();

    for (let index = 0; index < 14; index += 1) {
      const examDate = addDaysISO(today, -70 + index * 5);
      const subjectId = subjectIds[index % subjectIds.length];
      if (!subjectId) break;
      const percent = 58 + Math.round(pseudo(index + 1) * 39);
      const maxGrade = 20;
      const grade = Math.round((percent / 100) * maxGrade * 2) / 2;
      createExam({
        userId: user.id,
        subjectId,
        title: `آزمون ${index % 3 === 0 ? "میان‌ترم" : index % 3 === 1 ? "کلاسی" : "کوییز"} ${index + 1}`,
        examDate,
        grade,
        maxGrade,
        weight: index % 4 === 0 ? 2 : null,
        notes: index % 5 === 0 ? "مرور اشتباه‌ها انجام شد." : "",
      });
    }

    [8, 15, 23].forEach((offset, index) => {
      const subjectId = subjectIds[(index + 2) % subjectIds.length];
      if (!subjectId) return;
      createExam({
        userId: user.id,
        subjectId,
        title: `آزمون پیش رو ${index + 1}`,
        examDate: addDaysISO(today, offset),
        grade: null,
        maxGrade: 20,
        weight: null,
        notes: "",
      });
    });

    for (let offset = 0; offset < 63; offset += 1) {
      if (offset !== 0 && pseudo(offset * 3 + 2) < 0.2) continue;
      const date = addDaysISO(today, -offset);
      const reportId = createReportMetadata({
        userId: user.id,
        reportDate: date,
        entryIndex: 0,
        lessonsReviewed: offset % 3 === 0 ? "درس‌های امروز را مرور کردم و خلاصه نوشتم." : "مرور کوتاه درس‌ها",
        exercises: offset % 2 === 0 ? "تمرین‌های فصل جاری را حل کردم." : "",
        difficulties: offset % 7 === 0 ? "در چند مسئلهٔ ترکیبی کمی گیج شدم؛ فردا دوباره تمرین می‌کنم." : "",
        reflection: offset % 4 === 0 ? "امروز تمرکزم بهتر بود و توانستم برنامه‌ام را کامل کنم." : "روز معمولی بود، اما از برنامه عقب نماندم.",
        nextDayGoals: offset % 2 === 0 ? "فردا تمرین‌های باقی‌مانده را تمام کنم." : "فردا درس جدید را پیش‌خوانی کنم.",
      });
      const reportSubjects = subjectIds
        .slice(0, 3)
        .map((subjectId, subjectIndex) => ({
          subjectId,
          minutes: Math.round(25 + pseudo(offset * 7 + subjectIndex) * 50),
          note: subjectIndex === 0 && offset % 5 === 0 ? "تمرکز خوبی داشتم." : "",
        }));
      insertReportSubjects(reportId, reportSubjects);
      insertReportTasks(reportId, [
        {
          subjectId: subjectIds[offset % subjectIds.length] ?? null,
          title: offset % 2 === 0 ? "حل تمرین‌های ریاضی" : "خلاصه‌نویسی فارسی",
          status: offset % 3 === 0 ? "pending" : "completed",
        },
        {
          subjectId: subjectIds[(offset + 1) % subjectIds.length] ?? null,
          title: offset % 4 === 0 ? "مرور لغات انگلیسی" : "خواندن درس علوم",
          status: "completed",
        },
      ]);
    }

    const mathId = findSubjectByName(user.id, "ریاضی")?.id ?? null;
    const scienceId = findSubjectByName(user.id, "علوم تجربی")?.id ?? null;
    const englishId = findSubjectByName(user.id, "زبان انگلیسی")?.id ?? null;
    const seriesStart = addDaysISO(today, -21);
    const seriesEnd = addDaysISO(today, 21);
    const series = createSeriesRecord({
      userId: user.id,
      subjectId: mathId,
      title: "تمرین ریاضی",
      kind: "study",
      priority: "high",
      notes: "حل تمرین‌های فصل جاری",
      startDate: seriesStart,
      endDate: seriesEnd,
      weekdays: [6, 1, 3],
      startTime: "17:00",
      durationMinutes: 50,
      reminderMinutes: 15,
    });
    generateRecurrenceDates({
      startDate: seriesStart,
      endDate: seriesEnd,
      weekdays: [6, 1, 3],
    }).forEach((date) => {
      createSessionRecord({
        userId: user.id,
        subjectId: mathId,
        seriesId: series.id,
        title: "تمرین ریاضی",
        kind: "study",
        priority: "high",
        notes: "حل تمرین‌های فصل جاری",
        sessionDate: date,
        startTime: "17:00",
        endTime: "17:50",
        durationMinutes: 50,
        reminderMinutes: 15,
      });
    });
    generateRecurrenceDates({
      startDate: addDaysISO(today, -21),
      endDate: addDaysISO(today, -1),
      weekdays: [6, 1, 3],
    }).forEach((date) => {
      const session = listSessions(user.id, { from: date, to: date, seriesId: series.id })[0];
      if (session) updateSessionStatus(user.id, session.id, "completed");
    });
    [0, 1, 2].forEach((offset) => {
      const date = addDaysISO(today, offset);
      const subjectsPair = [
        { subjectId: scienceId, title: "مرور علوم", time: "19:00", end: "19:40", kind: "revision" },
        { subjectId: englishId, title: "تمرین مکالمه", time: "20:00", end: "20:25", kind: "homework" },
        { subjectId: mathId, title: "حل نمونه سؤال", time: "21:00", end: "21:45", kind: "exam-prep" },
      ];
      const item = subjectsPair[offset];
      if (!item) return;
      createSessionRecord({
        userId: user.id,
        subjectId: item.subjectId,
        seriesId: null,
        title: item.title,
        kind: item.kind,
        priority: "medium",
        notes: "",
        sessionDate: date,
        startTime: item.time,
        endTime: item.end,
        durationMinutes: durationBetween(item.time, item.end),
        reminderMinutes: 10,
      });
    });

    createGoal({
      userId: user.id,
      title: "هر روز دست‌کم دو ساعت مطالعه",
      metric: "study-minutes",
      period: "daily",
      targetValue: 120,
      startDate: addDaysISO(today, -30),
      endDate: null,
    });
    createGoal({
      userId: user.id,
      title: "هفته‌ای ده کار تمام‌شده",
      metric: "tasks-completed",
      period: "weekly",
      targetValue: 10,
      startDate: addDaysISO(today, -30),
      endDate: null,
    });
    createGoal({
      userId: user.id,
      title: "میانگین فصل بالای ۸۰٪",
      metric: "exam-average",
      period: "monthly",
      targetValue: 80,
      startDate: addDaysISO(today, -30),
      endDate: addDaysISO(today, 60),
    });
    const finalUser = findUserByPhone(DEMO_PHONE);
    if (!finalUser) throw new Error("ساخت حساب نمایشی انجام نشد.");
    return finalUser;
  });
}
