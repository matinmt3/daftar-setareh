import { all, newId, nowIso, one, run } from "../db/connection";
import { mapStudyGoal, type StudyGoalRow } from "../db/mappers";
import type { GoalMetric, GoalPeriod } from "@/lib/constants";
import type { StudyGoal } from "@/lib/types";

export function listGoals(userId: string, onlyActive = false): StudyGoal[] {
  const rows = all<StudyGoalRow>(
    `SELECT * FROM study_goals WHERE user_id = ? ${onlyActive ? "AND is_active = 1" : ""}
     ORDER BY is_active DESC, created_at DESC`,
    [userId],
  );
  return rows.map(mapStudyGoal);
}

export function findGoal(userId: string, id: string): StudyGoal | null {
  const row = one<StudyGoalRow>("SELECT * FROM study_goals WHERE id = ? AND user_id = ?", [id, userId]);
  return row ? mapStudyGoal(row) : null;
}

export function createGoal(input: {
  userId: string;
  title: string;
  metric: GoalMetric;
  period: GoalPeriod;
  targetValue: number;
  startDate: string;
  endDate: string | null;
}): StudyGoal {
  const id = newId();
  const now = nowIso();
  run(
    `INSERT INTO study_goals
      (id, user_id, title, metric, period, target_value, start_date, end_date, is_active, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
    [
      id,
      input.userId,
      input.title,
      input.metric,
      input.period,
      input.targetValue,
      input.startDate,
      input.endDate,
      now,
      now,
    ],
  );
  const goal = findGoal(input.userId, id);
  if (!goal) throw new Error("ثبت هدف انجام نشد.");
  return goal;
}

export function updateGoalRecord(input: {
  userId: string;
  id: string;
  title: string;
  metric: GoalMetric;
  period: GoalPeriod;
  targetValue: number;
  startDate: string;
  endDate: string | null;
  isActive?: boolean;
}): StudyGoal {
  run(
    `UPDATE study_goals
     SET title = ?, metric = ?, period = ?, target_value = ?, start_date = ?, end_date = ?,
         is_active = COALESCE(?, is_active), updated_at = ?
     WHERE id = ? AND user_id = ?`,
    [
      input.title,
      input.metric,
      input.period,
      input.targetValue,
      input.startDate,
      input.endDate,
      input.isActive === undefined ? null : input.isActive ? 1 : 0,
      nowIso(),
      input.id,
      input.userId,
    ],
  );
  const goal = findGoal(input.userId, input.id);
  if (!goal) throw new Error("هدف پیدا نشد.");
  return goal;
}

export function setGoalActive(userId: string, id: string, active: boolean): void {
  run("UPDATE study_goals SET is_active = ?, updated_at = ? WHERE id = ? AND user_id = ?", [
    active ? 1 : 0,
    nowIso(),
    id,
    userId,
  ]);
}

export function deleteGoal(userId: string, id: string): void {
  run("DELETE FROM study_goals WHERE id = ? AND user_id = ?", [id, userId]);
}

export function countActiveGoals(userId: string): number {
  const row = one<{ count: number }>(
    "SELECT COUNT(*) AS count FROM study_goals WHERE user_id = ? AND is_active = 1",
    [userId],
  );
  return row?.count ?? 0;
}

