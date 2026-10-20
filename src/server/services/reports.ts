import { transaction } from "../db/connection";
import { ConflictError, NotFoundError } from "../errors";
import {
  countReportsForDate,
  createReportMetadata,
  deleteReport,
  deleteReportChildren,
  findReport,
  findReportByDate,
  insertReportSubjects,
  insertReportTasks,
  listReportSummaries,
  listSummariesForDate,
  nextEntryIndex,
  updateReportMetadata,
} from "../repositories/reports";
import { listSubjects } from "../repositories/subjects";
import type { DailyReport, DailyReportSummary } from "@/lib/types";

export type ReportInput = {
  id?: string;
  reportDate: string;
  entryIndex: number;
  allowAdditional: boolean;
  subjects: { subjectId: string; minutes: number; note: string }[];
  tasks: { subjectId: string | null; title: string; status: "completed" | "pending" }[];
  lessonsReviewed: string;
  exercises: string;
  difficulties: string;
  reflection: string;
  nextDayGoals: string;
};

export function getReport(userId: string, id: string): DailyReport {
  const report = findReport(userId, id);
  if (!report) throw new NotFoundError("گزارش روزانه پیدا نشد.");
  return report;
}

export function getReportForDate(userId: string, date: string, entryIndex = 0): DailyReport | null {
  return findReportByDate(userId, date, entryIndex);
}

export function getReports(userId: string, filters: { from?: string; to?: string; limit?: number } = {}): DailyReportSummary[] {
  return listReportSummaries(userId, filters);
}

export function getReportsForDate(userId: string, date: string): DailyReportSummary[] {
  return listSummariesForDate(userId, date);
}

function assertSubjectsOwned(userId: string, subjectIds: string[]): void {
  if (subjectIds.length === 0) return;
  const owned = new Set(listSubjects(userId, true).map((subject) => subject.id));
  const invalid = subjectIds.some((id) => !owned.has(id));
  if (invalid) {
    throw new ConflictError("یکی از درس‌های انتخاب‌شده معتبر نیست.", {
      subjects: ["درس‌های انتخاب‌شده را دوباره بررسی کن."],
    });
  }
}

export function saveReport(userId: string, input: ReportInput): DailyReport {
  assertSubjectsOwned(userId, [
    ...input.subjects.map((item) => item.subjectId),
    ...input.tasks.flatMap((task) => (task.subjectId ? [task.subjectId] : [])),
  ]);

  let reportId = input.id ?? null;
  let entryIndex = input.entryIndex;

  if (reportId) {
    const existing = getReport(userId, reportId);
    const collision = findReportByDate(userId, input.reportDate, existing.entryIndex);
    if (collision && collision.id !== reportId) {
      throw new ConflictError("برای این تاریخ و شمارهٔ گزارش، گزارش دیگری ثبت شده است.", {
        reportDate: ["این تاریخ قبلاً استفاده شده است."],
      });
    }
    entryIndex = existing.entryIndex;
  } else {
    const existing = findReportByDate(userId, input.reportDate, 0);
    if (existing && !input.allowAdditional) {
      throw new ConflictError(
        "برای این روز گزارش ثبت کرده‌ای. می‌توانی یک گزارش تکمیلی اضافه کنی.",
        { reportDate: ["برای این روز از قبل گزارش داری."] },
      );
    }
    if (existing) {
      entryIndex = nextEntryIndex(userId, input.reportDate);
    } else {
      entryIndex = 0;
    }
  }

  const filteredSubjects = input.subjects.filter(
    (subject) => subject.minutes > 0 || subject.note.trim().length > 0,
  );

  transaction(() => {
    if (reportId) {
      updateReportMetadata(userId, reportId, input);
      deleteReportChildren(reportId);
    } else {
      reportId = createReportMetadata({
        userId,
        reportDate: input.reportDate,
        entryIndex,
        lessonsReviewed: input.lessonsReviewed,
        exercises: input.exercises,
        difficulties: input.difficulties,
        reflection: input.reflection,
        nextDayGoals: input.nextDayGoals,
      });
    }
    if (!reportId) throw new Error("ثبت گزارش انجام نشد.");
    insertReportSubjects(reportId, filteredSubjects);
    insertReportTasks(reportId, input.tasks);
  });

  return getReport(userId, reportId as string);
}

export function removeReport(userId: string, id: string): void {
  getReport(userId, id);
  deleteReport(userId, id);
}

export function reportExistsForDate(userId: string, date: string): boolean {
  return countReportsForDate(userId, date) > 0;
}
