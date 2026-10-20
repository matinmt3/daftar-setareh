import { all, newId, nowIso, one, run } from "../db/connection";
import {
  mapDailyReport,
  mapDailyReportSummary,
  mapReportSubject,
  mapReportTask,
  type DailyReportRow,
  type DailyReportSummaryRow,
  type ReportSubjectRow,
  type ReportTaskRow,
} from "../db/mappers";
import type { DailyReport, DailyReportSummary } from "@/lib/types";

const SUMMARY_SELECT = `
  SELECT r.*,
    (SELECT COALESCE(SUM(rs.minutes), 0) FROM report_subjects rs WHERE rs.report_id = r.id) AS minutes,
    (SELECT COUNT(*) FROM report_tasks t WHERE t.report_id = r.id AND t.status = 'completed') AS completed_tasks,
    (SELECT COUNT(*) FROM report_tasks t WHERE t.report_id = r.id AND t.status = 'pending') AS pending_tasks,
    (SELECT COUNT(*) FROM report_subjects rs WHERE rs.report_id = r.id) AS subject_count
  FROM daily_reports r
`;

export function findReport(userId: string, id: string): DailyReport | null {
  const row = one<DailyReportRow>("SELECT * FROM daily_reports WHERE id = ? AND user_id = ?", [id, userId]);
  if (!row) return null;
  const subjectRows = all<ReportSubjectRow>(
    `SELECT rs.*, s.name AS subject_name, s.color AS subject_color, s.icon AS subject_icon
     FROM report_subjects rs JOIN subjects s ON s.id = rs.subject_id
     WHERE rs.report_id = ? ORDER BY s.name ASC`,
    [id],
  );
  const taskRows = all<ReportTaskRow>(
    `SELECT t.*, s.name AS subject_name
     FROM report_tasks t LEFT JOIN subjects s ON s.id = t.subject_id
     WHERE t.report_id = ? ORDER BY t.created_at ASC`,
    [id],
  );
  return mapDailyReport(row, subjectRows.map(mapReportSubject), taskRows.map(mapReportTask));
}

export function findReportByDate(
  userId: string,
  date: string,
  entryIndex = 0,
): DailyReport | null {
  const row = one<DailyReportRow>(
    "SELECT * FROM daily_reports WHERE user_id = ? AND report_date = ? AND entry_index = ?",
    [userId, date, entryIndex],
  );
  return row ? findReport(userId, row.id) : null;
}

export function listReportSummaries(
  userId: string,
  filters: { from?: string; to?: string; limit?: number } = {},
): DailyReportSummary[] {
  const clauses = ["r.user_id = ?"];
  const params: (string | number)[] = [userId];
  if (filters.from) {
    clauses.push("r.report_date >= ?");
    params.push(filters.from);
  }
  if (filters.to) {
    clauses.push("r.report_date <= ?");
    params.push(filters.to);
  }
  let sql = `${SUMMARY_SELECT} WHERE ${clauses.join(" AND ")}
    ORDER BY r.report_date DESC, r.entry_index DESC, r.updated_at DESC`;
  if (filters.limit) {
    sql += " LIMIT ?";
    params.push(filters.limit);
  }
  return all<DailyReportSummaryRow>(sql, params).map(mapDailyReportSummary);
}

export function listSummariesForDate(userId: string, date: string): DailyReportSummary[] {
  return all<DailyReportSummaryRow>(
    `${SUMMARY_SELECT} WHERE r.user_id = ? AND r.report_date = ?
     ORDER BY r.entry_index ASC`,
    [userId, date],
  ).map(mapDailyReportSummary);
}

export function latestReport(userId: string): DailyReportSummary | null {
  const row = one<DailyReportSummaryRow>(
    `${SUMMARY_SELECT} WHERE r.user_id = ? ORDER BY r.report_date DESC, r.entry_index DESC LIMIT 1`,
    [userId],
  );
  return row ? mapDailyReportSummary(row) : null;
}

export function nextEntryIndex(userId: string, date: string): number {
  const row = one<{ value: number }>(
    "SELECT COALESCE(MAX(entry_index) + 1, 0) AS value FROM daily_reports WHERE user_id = ? AND report_date = ?",
    [userId, date],
  );
  return row?.value ?? 0;
}

export function countReportsForDate(userId: string, date: string): number {
  const row = one<{ count: number }>(
    "SELECT COUNT(*) AS count FROM daily_reports WHERE user_id = ? AND report_date = ?",
    [userId, date],
  );
  return row?.count ?? 0;
}

export function createReportMetadata(input: {
  userId: string;
  reportDate: string;
  entryIndex: number;
  lessonsReviewed: string;
  exercises: string;
  difficulties: string;
  reflection: string;
  nextDayGoals: string;
}): string {
  const id = newId();
  const now = nowIso();
  run(
    `INSERT INTO daily_reports
      (id, user_id, report_date, entry_index, lessons_reviewed, exercises, difficulties, reflection, next_day_goals, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.userId,
      input.reportDate,
      input.entryIndex,
      input.lessonsReviewed || null,
      input.exercises || null,
      input.difficulties || null,
      input.reflection || null,
      input.nextDayGoals || null,
      now,
      now,
    ],
  );
  return id;
}

export function updateReportMetadata(
  userId: string,
  id: string,
  input: {
    reportDate: string;
    lessonsReviewed: string;
    exercises: string;
    difficulties: string;
    reflection: string;
    nextDayGoals: string;
  },
): void {
  run(
    `UPDATE daily_reports
     SET report_date = ?, lessons_reviewed = ?, exercises = ?, difficulties = ?, reflection = ?,
         next_day_goals = ?, updated_at = ?
     WHERE id = ? AND user_id = ?`,
    [
      input.reportDate,
      input.lessonsReviewed || null,
      input.exercises || null,
      input.difficulties || null,
      input.reflection || null,
      input.nextDayGoals || null,
      nowIso(),
      id,
      userId,
    ],
  );
}

export function deleteReportChildren(reportId: string): void {
  run("DELETE FROM report_tasks WHERE report_id = ?", [reportId]);
  run("DELETE FROM report_subjects WHERE report_id = ?", [reportId]);
}

export function insertReportSubjects(
  reportId: string,
  subjects: { subjectId: string; minutes: number; note: string }[],
): void {
  subjects.forEach((subject) => {
    run(
      `INSERT INTO report_subjects (id, report_id, subject_id, minutes, note)
       VALUES (?, ?, ?, ?, ?)`,
      [newId(), reportId, subject.subjectId, subject.minutes, subject.note || null],
    );
  });
}

export function insertReportTasks(
  reportId: string,
  tasks: { subjectId: string | null; title: string; status: "completed" | "pending" }[],
): void {
  const now = nowIso();
  tasks.forEach((task) => {
    run(
      `INSERT INTO report_tasks (id, report_id, subject_id, title, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [newId(), reportId, task.subjectId, task.title, task.status, now],
    );
  });
}

export function deleteReport(userId: string, id: string): void {
  run("DELETE FROM daily_reports WHERE id = ? AND user_id = ?", [id, userId]);
}

export function sumReportMinutes(userId: string, from: string, to: string): number {
  const row = one<{ value: number | null }>(
    `SELECT SUM(rs.minutes) AS value
     FROM report_subjects rs
     JOIN daily_reports r ON r.id = rs.report_id
     WHERE r.user_id = ? AND r.report_date >= ? AND r.report_date <= ?`,
    [userId, from, to],
  );
  return row?.value ?? 0;
}

export function sumAllReportMinutes(userId: string): number {
  const row = one<{ value: number | null }>(
    `SELECT SUM(rs.minutes) AS value
     FROM report_subjects rs
     JOIN daily_reports r ON r.id = rs.report_id
     WHERE r.user_id = ?`,
    [userId],
  );
  return row?.value ?? 0;
}

export function minutesByDate(
  userId: string,
  from: string,
  to: string,
): { date: string; minutes: number }[] {
  return all<{ date: string; minutes: number }>(
    `SELECT r.report_date AS date, SUM(rs.minutes) AS minutes
     FROM daily_reports r
     JOIN report_subjects rs ON rs.report_id = r.id
     WHERE r.user_id = ? AND r.report_date >= ? AND r.report_date <= ?
     GROUP BY r.report_date
     ORDER BY r.report_date ASC`,
    [userId, from, to],
  );
}

export function taskCounts(
  userId: string,
  from: string,
  to: string,
): { completed: number; pending: number } {
  const row = one<{ completed: number | null; pending: number | null }>(
    `SELECT
       SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) AS completed,
       SUM(CASE WHEN t.status = 'pending' THEN 1 ELSE 0 END) AS pending
     FROM report_tasks t
     JOIN daily_reports r ON r.id = t.report_id
     WHERE r.user_id = ? AND r.report_date >= ? AND r.report_date <= ?`,
    [userId, from, to],
  );
  return { completed: row?.completed ?? 0, pending: row?.pending ?? 0 };
}

export function tasksByDate(
  userId: string,
  from: string,
  to: string,
): { date: string; completed: number; pending: number }[] {
  return all<{ date: string; completed: number; pending: number }>(
    `SELECT r.report_date AS date,
       SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) AS completed,
       SUM(CASE WHEN t.status = 'pending' THEN 1 ELSE 0 END) AS pending
     FROM report_tasks t
     JOIN daily_reports r ON r.id = t.report_id
     WHERE r.user_id = ? AND r.report_date >= ? AND r.report_date <= ?
     GROUP BY r.report_date
     ORDER BY r.report_date ASC`,
    [userId, from, to],
  );
}

export function countReportDays(userId: string, from: string, to: string): number {
  const row = one<{ count: number }>(
    "SELECT COUNT(DISTINCT report_date) AS count FROM daily_reports WHERE user_id = ? AND report_date >= ? AND report_date <= ?",
    [userId, from, to],
  );
  return row?.count ?? 0;
}

export function reportActivityDates(userId: string, from: string, to: string): string[] {
  return all<{ report_date: string }>(
    `SELECT DISTINCT report_date FROM daily_reports
     WHERE user_id = ? AND report_date >= ? AND report_date <= ?
     ORDER BY report_date DESC`,
    [userId, from, to],
  ).map((row) => row.report_date);
}

