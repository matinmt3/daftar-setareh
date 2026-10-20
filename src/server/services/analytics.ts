import {
  addDaysISO,
  analyticsRange,
  formatMonthYear,
  formatShortDate,
  monthRange,
  monthKey,
  previousMonthRange,
  rangeLength,
  startOfWeekISO,
  todayISO,
  type AnalyticsRange,
  type DateRange,
} from "@/lib/dates";
import {
  buildExamEntries,
  buildSubjectStats,
  gradeDistribution,
  overallAverage,
  percentChange,
} from "@/lib/grades";
import type { AnalyticsData, User } from "@/lib/types";
import { listExams } from "../repositories/exams";
import { listSubjects } from "../repositories/subjects";
import { minutesByDate, reportActivityDates, taskCounts } from "../repositories/reports";
import {
  completedSessionDates,
  listSessions,
  sessionCounts,
} from "../repositories/planner";
import { getGoalProgress } from "./goals";

function previousRangeFor(preset: AnalyticsRange, range: DateRange, today: string): DateRange | null {
  if (preset === "all") return null;
  if (preset === "this-month") return previousMonthRange(today);
  if (preset === "last-month") {
    const before = addDaysISO(range.start, -1);
    return monthRange(before);
  }
  const days = rangeLength(range);
  return { start: addDaysISO(range.start, -days), end: addDaysISO(range.start, -1) };
}

function currentStreak(userId: string, today: string): number {
  const activity = new Set<string>([
    ...reportActivityDates(userId, addDaysISO(today, -365), today),
    ...completedSessionDates(userId, addDaysISO(today, -365), today),
  ]);
  let cursor = activity.has(today) ? today : addDaysISO(today, -1);
  let streak = 0;
  while (activity.has(cursor)) {
    streak += 1;
    cursor = addDaysISO(cursor, -1);
  }
  return streak;
}

export function buildAnalytics(user: User, preset: AnalyticsRange): AnalyticsData {
  const today = todayISO();
  const range = analyticsRange(preset, today);
  const previousRange = previousRangeFor(preset, range, today);
  const subjects = listSubjects(user.id, true);
  const allExams = listExams(user.id);
  const exams = listExams(user.id, { from: range.start, to: range.end });
  const previousExams = previousRange
    ? listExams(user.id, { from: previousRange.start, to: previousRange.end })
    : [];
  const stats = buildSubjectStats(subjects, exams, user.gradeScale, allExams, previousExams);
  const previousStats = previousRange
    ? buildSubjectStats(subjects, previousExams, user.gradeScale, previousExams)
    : [];
  const overallPercent = overallAverage(stats.map((item) => item.averagePercent));
  const previousOverallPercent = previousRange
    ? overallAverage(previousStats.map((item) => item.averagePercent))
    : null;
  const entries = buildExamEntries(exams, subjects, user.gradeScale);

  const studyMinutes = minutesByDate(user.id, range.start, range.end);
  const totalStudyMinutes = studyMinutes.reduce((sum, item) => sum + item.minutes, 0);
  const previousStudy = previousRange
    ? minutesByDate(user.id, previousRange.start, previousRange.end)
    : [];
  const previousStudyMinutes = previousRange
    ? previousStudy.reduce((sum, item) => sum + item.minutes, 0)
    : null;
  const sessions = sessionCounts(user.id, range.start, range.end);
  const tasks = taskCounts(user.id, range.start, range.end);

  const dailyMinutes = new Map(studyMinutes.map((item) => [item.date, item.minutes]));
  const rangeSessions = listSessions(user.id, { from: range.start, to: range.end });

  const weeklyStudy: AnalyticsData["weeklyStudy"] = [];
  const latestWeek = startOfWeekISO(range.end);
  for (let index = 0; index < 18; index += 1) {
    const weekStart = addDaysISO(latestWeek, -7 * index);
    const weekEnd = addDaysISO(weekStart, 6);
    if (weekEnd < range.start) break;
    const start = weekStart < range.start ? range.start : weekStart;
    const end = weekEnd > range.end ? range.end : weekEnd;
    let minutes = 0;
    for (let day = start; day <= end; day = addDaysISO(day, 1)) {
      minutes += dailyMinutes.get(day) ?? 0;
    }
    const planned = rangeSessions
      .filter((session) => session.sessionDate >= start && session.sessionDate <= end)
      .reduce((sum, session) => sum + session.durationMinutes, 0);
    weeklyStudy.push({ label: formatShortDate(start), start, minutes, plannedMinutes: planned });
  }
  weeklyStudy.reverse();
  if (weeklyStudy.length > 16) weeklyStudy.splice(0, weeklyStudy.length - 16);

  const monthlyMap = new Map<string, { label: string; start: string; minutes: number }>();
  let monthCursor = monthRange(range.end);
  for (let index = 0; index < 18; index += 1) {
    if (monthCursor.end < range.start) break;
    const minutes = studyMinutes
      .filter((item) => monthKey(item.date) === monthKey(monthCursor.start))
      .reduce((sum, item) => sum + item.minutes, 0);
    monthlyMap.set(monthCursor.start, {
      label: formatMonthYear(monthCursor.start),
      start: monthCursor.start,
      minutes,
    });
    monthCursor = previousMonthRange(monthCursor.start);
  }
  const monthlyStudy = Array.from(monthlyMap.values()).reverse().slice(-6);

  const dataWarnings: string[] = [];
  if (entries.length === 0) dataWarnings.push("در این بازه آزمون نمره‌داری ثبت نشده است.");
  if (entries.length > 0 && entries.length < 3) {
    dataWarnings.push("برای تحلیل دقیق‌تر روند، دست‌کم سه آزمون نمره‌دار لازم است.");
  }
  if (totalStudyMinutes === 0) dataWarnings.push("در این بازه زمان مطالعه‌ای ثبت نشده است.");
  if (exams.length > entries.length) {
    dataWarnings.push("چند آزمون هنوز نمره ندارند و در میانگین‌ها حساب نشده‌اند.");
  }

  return {
    range,
    scale: user.gradeScale,
    overallPercent,
    overallScale:
      overallPercent === null ? null : Math.round((overallPercent / 100) * user.gradeScale * 10) / 10,
    previousOverallPercent,
    previousOverallChange: percentChange(overallPercent, previousOverallPercent),
    examCount: exams.length,
    gradedExamCount: entries.length,
    studyMinutes: totalStudyMinutes,
    previousStudyMinutes,
    completionRate:
      sessions.total > 0 ? Math.round((sessions.completed / sessions.total) * 100) : null,
    completedSessions: sessions.completed,
    totalSessions: sessions.total,
    streak: currentStreak(user.id, today),
    subjectStats: stats,
    examTrend: [...entries]
      .sort((a, b) => a.examDate.localeCompare(b.examDate))
      .slice(-60)
      .map((exam) => ({
        date: exam.examDate,
        percent: exam.percent,
        title: exam.title,
        subjectName: exam.subjectName,
        subjectColor: exam.subjectColor,
        grade: exam.grade,
        maxGrade: exam.maxGrade,
      })),
    weeklyStudy,
    monthlyStudy,
    gradeDistribution: gradeDistribution(entries.map((exam) => exam.percent)),
    goals: getGoalProgress(user.id, user.gradeScale, true),
    periodComparison: [
      {
        label: "میانگین نمرات",
        current: overallPercent,
        previous: previousOverallPercent,
        unit: "percent",
      },
      {
        label: "زمان مطالعه",
        current: totalStudyMinutes,
        previous: previousStudyMinutes,
        unit: "minutes",
      },
      {
        label: "کارهای انجام‌شده",
        current: tasks.completed,
        previous: previousRange
          ? taskCounts(user.id, previousRange.start, previousRange.end).completed
          : null,
        unit: "count",
      },
      {
        label: "تکمیل برنامه",
        current:
          sessions.total > 0 ? Math.round((sessions.completed / sessions.total) * 100) : null,
        previous: previousRange
          ? (() => {
              const prev = sessionCounts(user.id, previousRange.start, previousRange.end);
              return prev.total > 0 ? Math.round((prev.completed / prev.total) * 100) : null;
            })()
          : null,
        unit: "percent",
      },
    ],
    taskCompleted: tasks.completed,
    taskPending: tasks.pending,
    dataWarnings,
  };
}
