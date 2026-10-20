import {
  addDaysISO,
  monthRange,
  previousMonthRange,
  previousWeekRange,
  todayISO,
  weekDays,
  weekRange,
} from "@/lib/dates";
import { overallAverage, percentChange, buildSubjectStats } from "@/lib/grades";
import type { DashboardData, User } from "@/lib/types";
import { listExams, listRecentExams, listUpcomingExams } from "../repositories/exams";
import { listSubjects } from "../repositories/subjects";
import {
  minutesByDate,
  reportActivityDates,
  countReportsForDate,
  listSummariesForDate,
  latestReport,
  sumReportMinutes,
  taskCounts,
} from "../repositories/reports";
import {
  completedSessionDates,
  listSessions,
  sessionCounts,
  sessionsForDate,
  upcomingSessions,
} from "../repositories/planner";
import { getGoalProgress } from "./goals";

export function buildDashboard(user: User): DashboardData {
  const today = todayISO();
  const weekly = weekRange(today);
  const monthly = monthRange(today);
  const previousWeek = previousWeekRange(today);
  const previousMonth = previousMonthRange(today);

  const allExams = listExams(user.id);
  const previousMonthExams = listExams(user.id, {
    from: previousMonth.start,
    to: previousMonth.end,
  });
  const subjects = listSubjects(user.id, true);
  const subjectStats = buildSubjectStats(
    subjects,
    allExams,
    user.gradeScale,
    allExams,
    previousMonthExams,
  );
  const overallPercent = overallAverage(subjectStats.map((item) => item.averagePercent));

  const overallFor = (from: string, to: string): number | null => {
    const exams = listExams(user.id, { from, to });
    const stats = buildSubjectStats(subjects, exams, user.gradeScale, exams);
    return overallAverage(stats.map((item) => item.averagePercent));
  };

  const weeklyAcademicChange = percentChange(
    overallFor(weekly.start, weekly.end),
    overallFor(previousWeek.start, previousWeek.end),
  );
  const monthlyAcademicChange = percentChange(
    overallFor(monthly.start, monthly.end),
    overallFor(previousMonth.start, previousMonth.end),
  );

  const todayMinutes = sumReportMinutes(user.id, today, today);
  const todayTasks = taskCounts(user.id, today, today);
  const todayReports = listSummariesForDate(user.id, today);
  const weeklyMinutes = sumReportMinutes(user.id, weekly.start, weekly.end);
  const monthlyMinutes = sumReportMinutes(user.id, monthly.start, monthly.end);

  const weekDates = weekDays(today);
  const reportMinutesByDate = new Map(
    minutesByDate(user.id, weekly.start, weekly.end).map((row) => [row.date, row.minutes]),
  );
  const weekSessions = listSessions(user.id, { from: weekly.start, to: weekly.end });
  const plannedByDate = new Map<string, number>();
  weekSessions.forEach((session) => {
    plannedByDate.set(
      session.sessionDate,
      (plannedByDate.get(session.sessionDate) ?? 0) + session.durationMinutes,
    );
  });
  const weekStudyByDay = weekDates.map((date) => ({
    date,
    minutes: reportMinutesByDate.get(date) ?? 0,
    plannedMinutes: plannedByDate.get(date) ?? 0,
  }));

  const activity = new Set<string>([
    ...reportActivityDates(user.id, addDaysISO(today, -365), today),
    ...completedSessionDates(user.id, addDaysISO(today, -365), today),
  ]);
  let streak = 0;
  let cursor = today;
  if (!activity.has(cursor)) cursor = addDaysISO(today, -1);
  if (activity.has(cursor)) {
    while (activity.has(cursor)) {
      streak += 1;
      cursor = addDaysISO(cursor, -1);
    }
  }

  const weekSessionsCounts = sessionCounts(user.id, weekly.start, weekly.end);
  const latest = latestReport(user.id);

  return {
    user,
    today,
    weeklyRange: weekly,
    monthlyRange: monthly,
    todayMinutes,
    todayCompletedTasks: todayTasks.completed,
    todayPendingTasks: todayTasks.pending,
    todayReports: todayReports.length,
    weeklyMinutes,
    monthlyMinutes,
    weekStudyByDay,
    streak,
    overallPercent,
    overallScale:
      overallPercent === null ? null : Math.round((overallPercent / 100) * user.gradeScale * 10) / 10,
    subjectAverages: subjectStats,
    recentExams: listRecentExams(user.id, 4),
    upcomingExams: listUpcomingExams(user.id, today, 4),
    todaySessions: sessionsForDate(user.id, today),
    upcomingSessions: upcomingSessions(user.id, addDaysISO(today, 1), 6),
    activeGoals: getGoalProgress(user.id, user.gradeScale, true).slice(0, 4),
    weeklyAcademicChange,
    monthlyAcademicChange,
    planCompletion:
      weekSessionsCounts.total > 0
        ? Math.round((weekSessionsCounts.completed / weekSessionsCounts.total) * 100)
        : null,
    reportToday: countReportsForDate(user.id, today) > 0,
    latestReportId: latest?.id ?? null,
  };
}
