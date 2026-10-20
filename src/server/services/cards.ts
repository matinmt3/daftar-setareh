import { createHash } from "node:crypto";
import { AppError, NotFoundError } from "../errors";
import { one } from "../db/connection";
import {
  countCards,
  deleteCard,
  findCard,
  findCardById,
  listCards,
  upsertCard,
} from "../repositories/cards";
import { listExams } from "../repositories/exams";
import {
  countReportDays,
  listReportSummaries,
  sumReportMinutes,
  taskCounts,
} from "../repositories/reports";
import { listSubjects } from "../repositories/subjects";
import {
  listSessions,
  listSeries,
  plannedMinutes,
  sessionCounts,
} from "../repositories/planner";
import { listGoals } from "../repositories/goals";
import { findUserById, listUsersForCron } from "../repositories/users";
import {
  buildExamEntries,
  buildSubjectStats,
  gradeDistribution,
  overallAverage,
  percentChange,
  strengthsAndNeeds,
} from "@/lib/grades";
import {
  completedPeriodRanges,
  formatPeriodLabel,
  formatPeriodTitle,
  getPreviousPeriodRange,
  todayISO,
  type DateRange,
  type PeriodType,
} from "@/lib/dates";
import { faMinutes, faNum, faPercent, faScoreFromPercent, faSigned } from "@/lib/format";
import type {
  ExamPeriodEntry,
  ReportCardData,
  ReportCardGoal,
  ReportCardRecord,
  ReportCardType,
  User,
} from "@/lib/types";
import { computeGoalProgress } from "./goals";

export function cardFingerprint(
  user: User,
  type: ReportCardType,
  range: DateRange,
  sourceFingerprint = cardSourceFingerprint(user),
): string {
  return createHash("sha256").update(JSON.stringify([sourceFingerprint, type, range])).digest("hex");
}

function cardSourceFingerprint(user: User): string {
  // Counts and MAX(updated_at) miss renames and edits within one millisecond.
  // Hash the actual inputs so a cached card always follows its source data.
  const sources = {
    user,
    exams: listExams(user.id),
    reports: listReportSummaries(user.id),
    subjects: listSubjects(user.id, true),
    sessions: listSessions(user.id),
    series: listSeries(user.id),
    goals: listGoals(user.id),
  };
  return createHash("sha256").update(JSON.stringify(sources)).digest("hex");
}

function buildGoalSnapshots(finishedUser: User, range: DateRange): ReportCardGoal[] {
  const goals = listGoals(finishedUser.id, false).filter((goal) => {
    if (goal.startDate > range.end) return false;
    if (goal.endDate && goal.endDate < range.start) return false;
    return true;
  });
  return goals.slice(0, 8).map((goal) => {
    const progress = computeGoalProgress(finishedUser.id, goal, finishedUser.gradeScale, range);
    return {
      id: goal.id,
      title: goal.title,
      metric: goal.metric,
      period: goal.period,
      targetValue: goal.targetValue,
      currentValue: progress.currentValue,
      percent: progress.percent,
      achieved: progress.achieved,
    };
  });
}

function countPendingExams(userId: string, range: DateRange): number {
  const row = one<{ count: number }>(
    "SELECT COUNT(*) AS count FROM exams WHERE user_id = ? AND grade IS NULL AND exam_date >= ? AND exam_date <= ?",
    [userId, range.start, range.end],
  );
  return row?.count ?? 0;
}

export function buildCardData(
  user: User,
  type: ReportCardType,
  range: DateRange,
  now = new Date(),
): ReportCardData {
  const examCount = periodExamCount(user.id, range);
  const exams = listExams(user.id, { from: range.start, to: range.end });
  const allExams = listExams(user.id);
  const previousRange = getPreviousPeriodRange(type, range.start);
  const previousExams = listExams(user.id, { from: previousRange.start, to: previousRange.end });
  const subjects = listSubjects(user.id, true);

  const stats = buildSubjectStats(subjects, exams, user.gradeScale, allExams, previousExams);
  const allTimeStats = buildSubjectStats(subjects, allExams, user.gradeScale, allExams);
  const previousStats = buildSubjectStats(subjects, previousExams, user.gradeScale, allExams);
  const overallPercent = overallAverage(stats.map((item) => item.averagePercent));
  const allTimePercent = overallAverage(allTimeStats.map((item) => item.averagePercent));
  const previousOverall = overallAverage(previousStats.map((item) => item.averagePercent));
  const entryList = buildExamEntries(exams, subjects, user.gradeScale);
  const highestExam = entryList.reduce<ExamPeriodEntry | null>(
    (best, item) => (!best || item.percent > best.percent ? item : best),
    null,
  );
  const lowestExam = entryList.reduce<ExamPeriodEntry | null>(
    (best, item) => (!best || item.percent < best.percent ? item : best),
    null,
  );

  const studyMinutes = sumReportMinutes(user.id, range.start, range.end);
  const previousStudyMinutes = sumReportMinutes(user.id, previousRange.start, previousRange.end);
  const sessions = sessionCounts(user.id, range.start, range.end);
  const previousSessions = sessionCounts(user.id, previousRange.start, previousRange.end);
  const tasks = taskCounts(user.id, range.start, range.end);
  const previousTasks = taskCounts(user.id, previousRange.start, previousRange.end);
  const reportDays = countReportDays(user.id, range.start, range.end);
  const planCompletion = sessions.total > 0 ? Math.round((sessions.completed / sessions.total) * 100) : null;
  const previousPlanCompletion =
    previousSessions.total > 0 ? Math.round((previousSessions.completed / previousSessions.total) * 100) : null;
  const gradedEntries = entryList;
  const { strengths, needs } = strengthsAndNeeds(stats, overallPercent);
  const goals = buildGoalSnapshots(user, range);

  const summaryLines: string[] = [];
  if (gradedEntries.length > 0 && overallPercent !== null) {
    summaryLines.push(
      `میانگین نمرات این دوره ${faScoreFromPercent(overallPercent, user.gradeScale)} از ${faNum(user.gradeScale)} است.`,
    );
    summaryLines.push(
      `در ${faNum(gradedEntries.length)} آزمون از ${faNum(stats.length)} درس، میانگین درصدی ${faPercent(overallPercent)} ثبت شده است.`,
    );
    if (highestExam) {
      summaryLines.push(
        `بهترین نتیجه در «${highestExam.title}» با ${faPercent(highestExam.percent)} به دست آمده است.`,
      );
    }
    if (previousOverall !== null) {
      const change = percentChange(overallPercent, previousOverall);
      if (change !== null && Math.abs(change) >= 0.5) {
        summaryLines.push(
          change > 0
            ? `میانگین نسبت به دورهٔ قبل ${faSigned(change)} واحد درصد بهتر شده است.`
            : `میانگین نسبت به دورهٔ قبل ${faSigned(change)} واحد درصد کاهش داشته است.`,
        );
      }
    }
  } else {
    summaryLines.push("در این دوره آزمون نمره‌دار ثبت نشده است؛ با ثبت نمره‌ها، تحلیل درسی کامل‌تر می‌شود.");
  }

  if (studyMinutes > 0) {
    summaryLines.push(`در این دوره ${faMinutes(studyMinutes)} مطالعه ثبت شده است.`);
    const diff = studyMinutes - previousStudyMinutes;
    if (previousStudyMinutes > 0) {
      summaryLines.push(
        diff >= 0
          ? `این مقدار ${faMinutes(diff)} بیشتر از دورهٔ قبل است.`
          : `این مقدار ${faMinutes(Math.abs(diff))} کمتر از دورهٔ قبل است.`,
      );
    }
  } else {
    summaryLines.push("برای این دوره زمان مطالعه‌ای ثبت نشده است.");
  }

  if (tasks.completed + tasks.pending > 0) {
    summaryLines.push(
      `از ${faNum(tasks.completed + tasks.pending)} کار ثبت‌شده، ${faNum(tasks.completed)} کار انجام شده است.`,
    );
  }
  if (planCompletion !== null) {
    summaryLines.push(`از جلسه‌های برنامه‌ریزی‌شده، ${faPercent(planCompletion)} به پایان رسیده‌اند.`);
  }
  if (goals.length > 0) {
    const achieved = goals.filter((goal) => goal.achieved).length;
    summaryLines.push(
      achieved > 0
        ? `${faNum(achieved)} هدف از ${faNum(goals.length)} هدف مرتبط در این دوره محقق شده است.`
        : `هیچ‌یک از ${faNum(goals.length)} هدف مرتبط در این دوره به‌طور کامل محقق نشده است.`,
    );
  }
  if (!gradedEntries.length && studyMinutes === 0 && sessions.total === 0) {
    summaryLines.push("این دوره هنوز دادهٔ کافی برای جمع‌بندی ندارد.");
  }

  const hasAcademicData = gradedEntries.length > 0;
  const hasStudyData = studyMinutes > 0 || sessions.total > 0 || reportDays > 0;
  const previous =
    previousOverall !== null || previousStudyMinutes > 0 || previousSessions.total > 0
      ? {
          periodStart: previousRange.start,
          periodEnd: previousRange.end,
          overallPercent: previousOverall,
          studyMinutes: previousStudyMinutes,
          planCompletion: previousPlanCompletion,
          tasksCompleted: previousTasks.completed,
        }
      : null;

  return {
    type,
    periodStart: range.start,
    periodEnd: range.end,
    title: formatPeriodTitle(range, type),
    periodLabel: formatPeriodLabel(range, type),
    generatedAt: now.toISOString(),
    gradeScale: user.gradeScale,
    overallPercent,
    overallScale: overallPercent === null ? null : faScale(overallPercent, user.gradeScale),
    allTimePercent,
    allTimeScale: allTimePercent === null ? null : faScale(allTimePercent, user.gradeScale),
    allTimeExamCount: allExams.length,
    examCount,
    gradedExamCount: gradedEntries.length,
    pendingExamCount: countPendingExams(user.id, range),
    subjectStats: stats,
    exams: entryList,
    highestExam,
    lowestExam,
    studyMinutes,
    studyChangeMinutes: previous ? studyMinutes - previousStudyMinutes : null,
    plannedMinutes: plannedMinutes(user.id, range.start, range.end),
    planCompletion,
    completedSessions: sessions.completed,
    totalSessions: sessions.total,
    tasksCompleted: tasks.completed,
    tasksPending: tasks.pending,
    reportDays,
    previous,
    overallChange: percentChange(overallPercent, previousOverall),
    studyChange:
      previous && previousStudyMinutes > 0
        ? Math.round(((studyMinutes - previousStudyMinutes) / previousStudyMinutes) * 1000) / 10
        : null,
    taskChange: previous ? tasks.completed - previousTasks.completed : null,
    strengths,
    needsAttention: needs,
    summaryLines,
    goals,
    gradeDistribution: gradeDistribution(gradedEntries.map((exam) => exam.percent)),
    hasAcademicData,
    hasStudyData,
    hasEnoughForComparison: previous !== null,
  };
}

function faScale(percent: number, scale: number): number {
  const value = (percent / 100) * scale;
  return Math.round(value * 10) / 10;
}

function periodExamCount(userId: string, range: DateRange): number {
  const row = one<{ count: number }>(
    "SELECT COUNT(*) AS count FROM exams WHERE user_id = ? AND exam_date >= ? AND exam_date <= ?",
    [userId, range.start, range.end],
  );
  return row?.count ?? 0;
}

export function rangeHasData(userId: string, range: DateRange): boolean {
  const row = one<{ value: number }>(
    `SELECT
      (SELECT COUNT(*) FROM exams WHERE user_id = ? AND exam_date >= ? AND exam_date <= ?) +
      (SELECT COUNT(*) FROM daily_reports WHERE user_id = ? AND report_date >= ? AND report_date <= ?) +
      (SELECT COUNT(*) FROM study_sessions WHERE user_id = ? AND session_date >= ? AND session_date <= ?) AS value`,
    [
      userId,
      range.start,
      range.end,
      userId,
      range.start,
      range.end,
      userId,
      range.start,
      range.end,
    ],
  );
  return (row?.value ?? 0) > 0;
}

export function ensureCard(user: User, type: ReportCardType, range: DateRange, force = false, sourceFingerprint?: string): ReportCardRecord | null {
  if (!rangeHasData(user.id, range)) {
    const existing = findCard(user.id, type, range.start);
    if (existing) deleteCard(user.id, existing.id);
    return null;
  }
  const fingerprint = cardFingerprint(user, type, range, sourceFingerprint);
  const existing = findCard(user.id, type, range.start);
  if (existing && !force && existing.fingerprint === fingerprint) return existing;
  const data = buildCardData(user, type, range);
  return upsertCard({
    userId: user.id,
    type,
    periodStart: range.start,
    periodEnd: range.end,
    data: { ...data, generatedAt: new Date().toISOString() },
    fingerprint,
  });
}

export function ensureRecentCards(user: User, sourceFingerprint = cardSourceFingerprint(user)): ReportCardRecord[] {
  const today = todayISO();
  const weekly = completedPeriodRanges("weekly", today, 8);
  const monthly = completedPeriodRanges("monthly", today, 6);
  const cards: ReportCardRecord[] = [];
  [...weekly, ...monthly].forEach((range) => {
    const type: ReportCardType = monthly.includes(range) ? "monthly" : "weekly";
    const card = ensureCard(user, type, range, false, sourceFingerprint);
    if (card) cards.push(card);
  });
  return cards.sort((a, b) => b.periodStart.localeCompare(a.periodStart));
}

export function getCard(userId: string, id: string): ReportCardRecord {
  const card = findCardById(userId, id);
  if (!card) throw new NotFoundError("کارنامه پیدا نشد.");
  const user = findUserById(userId);
  const refreshed = user && ensureCard(user, card.type, { start: card.periodStart, end: card.periodEnd });
  if (!refreshed) throw new NotFoundError("کارنامه پیدا نشد.");
  return refreshed;
}

export function getCards(user: User, type?: ReportCardType): ReportCardRecord[] {
  const sourceFingerprint = cardSourceFingerprint(user);
  ensureRecentCards(user, sourceFingerprint);
  return listCards(user.id, type, 30)
    .map(card => ensureCard(user, card.type, { start: card.periodStart, end: card.periodEnd }, false, sourceFingerprint))
    .filter((card): card is ReportCardRecord => card !== null && (card.data.hasAcademicData || card.data.hasStudyData));
}

export function getCardStats(userId: string): { weekly: number; monthly: number; total: number } {
  const weekly = listCards(userId, "weekly", 100).length;
  const monthly = listCards(userId, "monthly", 100).length;
  return { weekly, monthly, total: countCards(userId) };
}

export function ensureAllRecentCards(): { users: number; cards: number; errors: number } {
  const users = listUsersForCron();
  let cards = 0;
  let errors = 0;
  users.forEach((user) => {
    try {
      cards += ensureRecentCards(user).length;
    } catch (error) {
      errors += 1;
      console.error("[daftar-setareh] report card cron failed", error);
    }
  });
  return { users: users.length, cards, errors };
}

export function generateCompletedCardsForPeriod(type: PeriodType, dateISO: string, user: User): ReportCardRecord | null {
  const ranges = completedPeriodRanges(type, dateISO, 1);
  const range = ranges[0];
  if (!range) throw new AppError("دورهٔ کاملی برای ساخت کارنامه پیدا نشد.");
  return ensureCard(user, type, range, true);
}
