import { all, newId, nowIso, one, run } from "../db/connection";
import { mapSubject, type SubjectRow } from "../db/mappers";
import type { Subject } from "@/lib/types";

export function listSubjects(userId: string, includeArchived = false): Subject[] {
  const rows = all<SubjectRow>(
    `SELECT * FROM subjects
     WHERE user_id = ? ${includeArchived ? "" : "AND is_archived = 0"}
     ORDER BY is_archived ASC, created_at ASC`,
    [userId],
  );
  return rows.map(mapSubject);
}

export function findSubject(userId: string, id: string): Subject | null {
  const row = one<SubjectRow>("SELECT * FROM subjects WHERE id = ? AND user_id = ?", [id, userId]);
  return row ? mapSubject(row) : null;
}

export function findSubjectByName(userId: string, name: string): Subject | null {
  const row = one<SubjectRow>("SELECT * FROM subjects WHERE user_id = ? AND name = ?", [userId, name]);
  return row ? mapSubject(row) : null;
}

export function createSubject(input: {
  userId: string;
  name: string;
  color: string;
  icon: string;
}): Subject {
  const id = newId();
  const now = nowIso();
  run(
    `INSERT INTO subjects (id, user_id, name, color, icon, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, input.userId, input.name, input.color, input.icon, now, now],
  );
  const subject = findSubject(input.userId, id);
  if (!subject) throw new Error("افزودن درس انجام نشد.");
  return subject;
}

export function updateSubjectRecord(input: {
  userId: string;
  id: string;
  name: string;
  color: string;
  icon: string;
  isArchived?: boolean;
}): Subject {
  run(
    `UPDATE subjects SET name = ?, color = ?, icon = ?, is_archived = COALESCE(?, is_archived), updated_at = ?
     WHERE id = ? AND user_id = ?`,
    [
      input.name,
      input.color,
      input.icon,
      input.isArchived === undefined ? null : input.isArchived ? 1 : 0,
      nowIso(),
      input.id,
      input.userId,
    ],
  );
  const subject = findSubject(input.userId, input.id);
  if (!subject) throw new Error("درس پیدا نشد.");
  return subject;
}

export function setSubjectArchived(userId: string, id: string, archived: boolean): void {
  run("UPDATE subjects SET is_archived = ?, updated_at = ? WHERE id = ? AND user_id = ?", [
    archived ? 1 : 0,
    nowIso(),
    id,
    userId,
  ]);
}

export function countSubjectExams(userId: string, subjectId: string): number {
  const row = one<{ count: number }>(
    "SELECT COUNT(*) AS count FROM exams WHERE user_id = ? AND subject_id = ?",
    [userId, subjectId],
  );
  return row?.count ?? 0;
}

export function countSubjectReports(userId: string, subjectId: string): number {
  const row = one<{ count: number }>(
    `SELECT COUNT(*) AS count FROM report_subjects rs
     JOIN daily_reports r ON r.id = rs.report_id
     WHERE r.user_id = ? AND rs.subject_id = ?`,
    [userId, subjectId],
  );
  return row?.count ?? 0;
}

export function deleteSubjectRecord(userId: string, id: string): void {
  run("DELETE FROM subjects WHERE id = ? AND user_id = ?", [id, userId]);
}

export function countSubjects(userId: string): number {
  const row = one<{ count: number }>(
    "SELECT COUNT(*) AS count FROM subjects WHERE user_id = ? AND is_archived = 0",
    [userId],
  );
  return row?.count ?? 0;
}

export function insertSubjects(
  userId: string,
  subjects: { name: string; color: string; icon: string }[],
): void {
  const now = nowIso();
  subjects.forEach((subject) => {
    run(
      `INSERT OR IGNORE INTO subjects (id, user_id, name, color, icon, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [newId(), userId, subject.name, subject.color, subject.icon, now, now],
    );
  });
}

export function subjectUpdatedAt(userId: string): string | null {
  const row = one<{ value: string | null }>(
    "SELECT MAX(updated_at) AS value FROM subjects WHERE user_id = ?",
    [userId],
  );
  return row?.value ?? null;
}
