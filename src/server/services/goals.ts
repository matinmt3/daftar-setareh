import { AppError, NotFoundError } from "../errors";
import {
  countActiveGoals,
  createGoal,
  deleteGoal,
  findGoal,
  listGoals,
  setGoalActive,
  updateGoalRecord,
} from "../repositories/goals";
import { listExams } from "../repositories/exams";
import { listSubjects } from "../repositories/subjects";
import { sumReportMinutes, taskCounts } from "../repositories/reports";
import {
  monthRange,
  todayISO,
  weekRange,
  type DateRange,
} from "@/lib/dates";
import { buildSubjectStats, overallAverage } from "@/lib/grades";
import { faMinutes, faNum, faPercent } from "@/lib/format";
import type { GoalMetric, GoalPeriod } from "@/lib/constants";
import type { GoalProgress, StudyGoal } from "@/lib/types";

export function getGoals(userId: string, onlyActive = false): StudyGoal[] {
  return listGoals(userId, onlyActive);
}

export function getGoal(userId: string, id: string): StudyGoal {
  const goal = findGoal(userId, id);
  if (!goal) throw new NotFoundError("هدف پیدا نشد.");
  return goal;
}

export function goalRange(goal: StudyGoal, today = todayISO()): DateRange | null {
  const base =
    goal.period === "daily"
      ? { start: today, end: today }
      : goal.period === "weekly"
        ? weekRange(today)
        : monthRange(today);
  return intersectRange(base, goal);
}

function calculateValue(
  userId: string,
  metric: GoalMetric,
  range: DateRange,
  gradeScale: number,
): number {
  if (metric === "study-minutes") {
    return sumReportMinutes(userId, range.start, range.end);
  }
  if (metric === "tasks-completed") {
    return taskCounts(userId, range.start, range.end).completed;
  }
  const subjects = listSubjects(userId, true);
  const exams = listExams(userId, { from: range.start, to: range.end });
  const stats = buildSubjectStats(subjects, exams, gradeScale, exams);
  return overallAverage(stats.map((item) => item.averagePercent)) ?? 0;
}

export function progressValueLabel(metric: GoalMetric, value: number): string {
  if (metric === "study-minutes") return faMinutes(value);
  if (metric === "tasks-completed") return `${faNum(value)} کار`;
  return faPercent(value);
}

export function computeGoalProgress(
  userId: string,
  goal: StudyGoal,
  gradeScale: number,
  range?: DateRange,
): GoalProgress {
  const effectiveRange = range ? intersectRange(range, goal) : goalRange(goal);
  const currentValue = effectiveRange ? calculateValue(userId, goal.metric, effectiveRange, gradeScale) : 0;
  const targetValue = goal.targetValue;
  const rawPercent = targetValue > 0 ? (currentValue / targetValue) * 100 : 0;
  return {
    goal,
    currentValue,
    targetValue,
    percent: Math.max(0, Math.min(100, Math.round(rawPercent))),
    achieved: currentValue >= targetValue,
    label:
      goal.metric === "exam-average"
        ? `${faPercent(currentValue)} از ${faPercent(targetValue)}`
        : `${progressValueLabel(goal.metric, currentValue)} از ${progressValueLabel(goal.metric, targetValue)}`,
  };
}

export function getGoalProgress(userId: string, gradeScale: number, onlyActive = true): GoalProgress[] {
  return getGoals(userId, onlyActive).map((goal) => computeGoalProgress(userId, goal, gradeScale));
}

export function addGoal(
  userId: string,
  input: {
    title: string;
    metric: GoalMetric;
    period: GoalPeriod;
    targetValue: number;
    startDate: string;
    endDate: string | null;
  },
): StudyGoal {
  assertGoalCapacity(userId);
  return createGoal({ userId, ...input });
}

function assertGoalCapacity(userId: string): void {
  if (countActiveGoals(userId) >= 12) {
    throw new AppError("حداکثر ۱۲ هدف فعال می‌توانی داشته باشی. یکی از هدف‌های قبلی را غیرفعال کن.", {
      fieldErrors: { title: ["تعداد هدف‌های فعال زیاد است."] },
    });
  }
}

export function editGoal(
  userId: string,
  input: {
    id: string;
    title: string;
    metric: GoalMetric;
    period: GoalPeriod;
    targetValue: number;
    startDate: string;
    endDate: string | null;
    isActive?: boolean;
  },
): StudyGoal {
  const existing = getGoal(userId, input.id);
  if (input.isActive === true && !existing.isActive) assertGoalCapacity(userId);
  return updateGoalRecord({ userId, ...input });
}

export function toggleGoal(userId: string, id: string, active: boolean): void {
  const existing = getGoal(userId, id);
  if (active && !existing.isActive) assertGoalCapacity(userId);
  setGoalActive(userId, id, active);
}

export function removeGoal(userId: string, id: string): void {
  getGoal(userId, id);
  deleteGoal(userId, id);
}

export function intersectRange(range: DateRange, goal: StudyGoal): DateRange | null {
  const start = range.start > goal.startDate ? range.start : goal.startDate;
  const end = goal.endDate && goal.endDate < range.end ? goal.endDate : range.end;
  return start > end ? null : { start, end };
}
