import { all, newId, nowIso, one, run } from "../db/connection";
import {
  mapStudySeries,
  mapStudySession,
  type StudySeriesRow,
  type StudySessionRow,
} from "../db/mappers";
import type { StudySeries, StudySession } from "@/lib/types";

const SELECT_SESSION = `
  SELECT ss.*, s.name AS subject_name, s.color AS subject_color, s.icon AS subject_icon,
         ser.weekdays AS series_weekdays
  FROM study_sessions ss
  LEFT JOIN subjects s ON s.id = ss.subject_id
  LEFT JOIN study_series ser ON ser.id = ss.series_id
`;

export type SessionFilters = {
  from?: string;
  to?: string;
  status?: "planned" | "completed";
  limit?: number;
  seriesId?: string;
};

export function listSessions(userId: string, filters: SessionFilters = {}): StudySession[] {
  const clauses = ["ss.user_id = ?"];
  const params: (string | number)[] = [userId];
  if (filters.from) {
    clauses.push("ss.session_date >= ?");
    params.push(filters.from);
  }
  if (filters.to) {
    clauses.push("ss.session_date <= ?");
    params.push(filters.to);
  }
  if (filters.status) {
    clauses.push("ss.status = ?");
    params.push(filters.status);
  }
  if (filters.seriesId) {
    clauses.push("ss.series_id = ?");
    params.push(filters.seriesId);
  }
  let sql = `${SELECT_SESSION} WHERE ${clauses.join(" AND ")}
    ORDER BY ss.session_date ASC, ss.start_time ASC`;
  if (filters.limit) {
    sql += " LIMIT ?";
    params.push(filters.limit);
  }
  return all<StudySessionRow>(sql, params).map(mapStudySession);
}

export function findSession(userId: string, id: string): StudySession | null {
  const row = one<StudySessionRow>(`${SELECT_SESSION} WHERE ss.user_id = ? AND ss.id = ?`, [userId, id]);
  return row ? mapStudySession(row) : null;
}

export function createSessionRecord(input: {
  userId: string;
  subjectId: string | null;
  seriesId: string | null;
  title: string;
  kind: string;
  priority: string;
  notes: string;
  sessionDate: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  reminderMinutes: number;
}): StudySession {
  const id = newId();
  const now = nowIso();
  run(
    `INSERT INTO study_sessions
      (id, user_id, subject_id, series_id, title, kind, priority, notes, session_date, start_time, end_time, duration_minutes, reminder_minutes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.userId,
      input.subjectId,
      input.seriesId,
      input.title,
      input.kind,
      input.priority,
      input.notes || null,
      input.sessionDate,
      input.startTime,
      input.endTime,
      input.durationMinutes,
      input.reminderMinutes,
      now,
      now,
    ],
  );
  const session = findSession(input.userId, id);
  if (!session) throw new Error("ثبت جلسه انجام نشد.");
  return session;
}

export function updateSessionRecord(input: {
  userId: string;
  id: string;
  subjectId: string | null;
  title: string;
  kind: string;
  priority: string;
  notes: string;
  sessionDate: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  reminderMinutes: number;
  seriesId?: string | null;
}): void {
  const clauses = [
    "subject_id = ?",
    "title = ?",
    "kind = ?",
    "priority = ?",
    "notes = ?",
    "session_date = ?",
    "start_time = ?",
    "end_time = ?",
    "duration_minutes = ?",
    "reminder_minutes = ?",
    "updated_at = ?",
  ];
  const params: (string | number | null)[] = [
    input.subjectId,
    input.title,
    input.kind,
    input.priority,
    input.notes || null,
    input.sessionDate,
    input.startTime,
    input.endTime,
    input.durationMinutes,
    input.reminderMinutes,
    nowIso(),
  ];
  if (input.seriesId !== undefined) {
    clauses.push("series_id = ?");
    params.push(input.seriesId);
  }
  params.push(input.id, input.userId);
  run(`UPDATE study_sessions SET ${clauses.join(", ")} WHERE id = ? AND user_id = ?`, params);
}

export function updateSessionMeta(
  userId: string,
  id: string,
  input: {
    subjectId: string | null;
    title: string;
    kind: string;
    priority: string;
    notes: string;
    startTime: string;
    endTime: string;
    durationMinutes: number;
    reminderMinutes: number;
  },
): void {
  run(
    `UPDATE study_sessions
     SET subject_id = ?, title = ?, kind = ?, priority = ?, notes = ?, start_time = ?, end_time = ?,
         duration_minutes = ?, reminder_minutes = ?, updated_at = ?
     WHERE id = ? AND user_id = ?`,
    [
      input.subjectId,
      input.title,
      input.kind,
      input.priority,
      input.notes || null,
      input.startTime,
      input.endTime,
      input.durationMinutes,
      input.reminderMinutes,
      nowIso(),
      id,
      userId,
    ],
  );
}

export function updateSessionStatus(
  userId: string,
  id: string,
  status: "planned" | "completed",
): void {
  run(
    "UPDATE study_sessions SET status = ?, completed_at = ?, updated_at = ? WHERE id = ? AND user_id = ?",
    [status, status === "completed" ? nowIso() : null, nowIso(), id, userId],
  );
}

export function deleteSessionRecord(userId: string, id: string): void {
  run("DELETE FROM study_sessions WHERE id = ? AND user_id = ?", [id, userId]);
}

export function deleteFutureSeriesSessions(
  userId: string,
  seriesId: string,
  fromDate: string,
): number {
  return Number(
    run(
      "DELETE FROM study_sessions WHERE user_id = ? AND series_id = ? AND session_date >= ? AND status = 'planned'",
      [userId, seriesId, fromDate],
    ).changes,
  );
}

export function deleteSeriesSessions(userId: string, seriesId: string): void {
  run("DELETE FROM study_sessions WHERE user_id = ? AND series_id = ?", [userId, seriesId]);
}

export function listSeriesSessionsFrom(
  userId: string,
  seriesId: string,
  fromDate: string,
  status?: "planned" | "completed",
): StudySession[] {
  return listSessions(userId, { seriesId, from: fromDate, status });
}

export function createSeriesRecord(input: {
  userId: string;
  subjectId: string | null;
  title: string;
  kind: string;
  priority: string;
  notes: string;
  startDate: string;
  endDate: string;
  weekdays: number[];
  startTime: string;
  durationMinutes: number;
  reminderMinutes: number;
}): StudySeries {
  const id = newId();
  const now = nowIso();
  run(
    `INSERT INTO study_series
      (id, user_id, subject_id, title, kind, priority, notes, start_date, end_date, weekdays, start_time, duration_minutes, reminder_minutes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.userId,
      input.subjectId,
      input.title,
      input.kind,
      input.priority,
      input.notes || null,
      input.startDate,
      input.endDate,
      JSON.stringify(input.weekdays),
      input.startTime,
      input.durationMinutes,
      input.reminderMinutes,
      now,
      now,
    ],
  );
  const series = findSeries(input.userId, id);
  if (!series) throw new Error("ثبت برنامهٔ تکرارشونده انجام نشد.");
  return series;
}

export function findSeries(userId: string, id: string): StudySeries | null {
  const row = one<StudySeriesRow>("SELECT * FROM study_series WHERE id = ? AND user_id = ?", [id, userId]);
  return row ? mapStudySeries(row) : null;
}

export function listSeries(userId: string, fromDate?: string): StudySeries[] {
  const rows = fromDate
    ? all<StudySeriesRow>(
        "SELECT * FROM study_series WHERE user_id = ? AND end_date >= ? ORDER BY start_date ASC",
        [userId, fromDate],
      )
    : all<StudySeriesRow>("SELECT * FROM study_series WHERE user_id = ? ORDER BY start_date ASC", [userId]);
  return rows.map(mapStudySeries);
}

export function updateSeriesRecord(input: {
  userId: string;
  id: string;
  subjectId: string | null;
  title: string;
  kind: string;
  priority: string;
  notes: string;
  startDate: string;
  endDate: string;
  weekdays: number[];
  startTime: string;
  durationMinutes: number;
  reminderMinutes: number;
}): void {
  run(
    `UPDATE study_series
     SET subject_id = ?, title = ?, kind = ?, priority = ?, notes = ?, start_date = ?, end_date = ?,
         weekdays = ?, start_time = ?, duration_minutes = ?, reminder_minutes = ?, updated_at = ?
     WHERE id = ? AND user_id = ?`,
    [
      input.subjectId,
      input.title,
      input.kind,
      input.priority,
      input.notes || null,
      input.startDate,
      input.endDate,
      JSON.stringify(input.weekdays),
      input.startTime,
      input.durationMinutes,
      input.reminderMinutes,
      nowIso(),
      input.id,
      input.userId,
    ],
  );
}

export function deleteSeriesRecord(userId: string, seriesId: string): void {
  run("DELETE FROM study_series WHERE id = ? AND user_id = ?", [seriesId, userId]);
}

export function plannedMinutes(userId: string, from: string, to: string): number {
  const row = one<{ value: number | null }>(
    `SELECT SUM(duration_minutes) AS value FROM study_sessions
     WHERE user_id = ? AND session_date >= ? AND session_date <= ?`,
    [userId, from, to],
  );
  return row?.value ?? 0;
}

export function sessionCounts(
  userId: string,
  from: string,
  to: string,
): { total: number; completed: number; planned: number } {
  const row = one<{ total: number; completed: number | null; planned: number | null }>(
    `SELECT COUNT(*) AS total,
       SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed,
       SUM(CASE WHEN status = 'planned' THEN 1 ELSE 0 END) AS planned
     FROM study_sessions WHERE user_id = ? AND session_date >= ? AND session_date <= ?`,
    [userId, from, to],
  );
  return {
    total: row?.total ?? 0,
    completed: row?.completed ?? 0,
    planned: row?.planned ?? 0,
  };
}

export function completedSessionMinutes(userId: string, from: string, to: string): number {
  const row = one<{ value: number | null }>(
    `SELECT SUM(duration_minutes) AS value FROM study_sessions
     WHERE user_id = ? AND status = 'completed' AND session_date >= ? AND session_date <= ?`,
    [userId, from, to],
  );
  return row?.value ?? 0;
}

export function completedSessionDates(userId: string, from: string, to: string): string[] {
  return all<{ session_date: string }>(
    `SELECT DISTINCT session_date FROM study_sessions
     WHERE user_id = ? AND status = 'completed' AND session_date >= ? AND session_date <= ?
     ORDER BY session_date DESC`,
    [userId, from, to],
  ).map((row) => row.session_date);
}

export function upcomingSessions(userId: string, fromDate: string, limit = 5): StudySession[] {
  return all<StudySessionRow>(
    `${SELECT_SESSION} WHERE ss.user_id = ? AND ss.session_date >= ? AND ss.status = 'planned'
     ORDER BY ss.session_date ASC, ss.start_time ASC LIMIT ?`,
    [userId, fromDate, limit],
  ).map(mapStudySession);
}

export function sessionsForDate(userId: string, date: string): StudySession[] {
  return listSessions(userId, { from: date, to: date });
}

