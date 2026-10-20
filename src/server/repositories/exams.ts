import { all, newId, nowIso, one, run } from "../db/connection";
import { mapExamWithSubject, type ExamRow } from "../db/mappers";
import type { ExamWithSubject } from "@/lib/types";

const SELECT_EXAM = `
  SELECT e.*, s.name AS subject_name, s.color AS subject_color, s.icon AS subject_icon
  FROM exams e
  JOIN subjects s ON s.id = e.subject_id
`;

export type ExamFilters = {
  from?: string;
  to?: string;
  subjectId?: string;
  limit?: number;
};

export function listExams(userId: string, filters: ExamFilters = {}): ExamWithSubject[] {
  const clauses = ["e.user_id = ?"];
  const params: (string | number)[] = [userId];
  if (filters.from) {
    clauses.push("e.exam_date >= ?");
    params.push(filters.from);
  }
  if (filters.to) {
    clauses.push("e.exam_date <= ?");
    params.push(filters.to);
  }
  if (filters.subjectId) {
    clauses.push("e.subject_id = ?");
    params.push(filters.subjectId);
  }
  let sql = `${SELECT_EXAM} WHERE ${clauses.join(" AND ")} ORDER BY e.exam_date DESC, e.created_at DESC`;
  if (filters.limit) {
    sql += " LIMIT ?";
    params.push(filters.limit);
  }
  return all<ExamRow>(sql, params).map(mapExamWithSubject);
}

export function listUpcomingExams(userId: string, fromDate: string, limit = 6): ExamWithSubject[] {
  return all<ExamRow>(
    `${SELECT_EXAM} WHERE e.user_id = ? AND e.exam_date >= ? ORDER BY e.exam_date ASC, e.created_at ASC LIMIT ?`,
    [userId, fromDate, limit],
  ).map(mapExamWithSubject);
}

export function listRecentExams(userId: string, limit = 5): ExamWithSubject[] {
  return listExams(userId, { limit });
}

export function findExam(userId: string, id: string): ExamWithSubject | null {
  const row = one<ExamRow>(`${SELECT_EXAM} WHERE e.user_id = ? AND e.id = ?`, [userId, id]);
  return row ? mapExamWithSubject(row) : null;
}

export function createExam(input: {
  userId: string;
  subjectId: string;
  title: string;
  examDate: string;
  grade: number | null;
  maxGrade: number;
  weight: number | null;
  notes: string;
}): ExamWithSubject {
  const id = newId();
  const now = nowIso();
  run(
    `INSERT INTO exams (id, user_id, subject_id, title, exam_date, grade, max_grade, weight, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.userId,
      input.subjectId,
      input.title,
      input.examDate,
      input.grade,
      input.maxGrade,
      input.weight,
      input.notes || null,
      now,
      now,
    ],
  );
  const exam = findExam(input.userId, id);
  if (!exam) throw new Error("ثبت آزمون انجام نشد.");
  return exam;
}

export function updateExamRecord(input: {
  userId: string;
  id: string;
  subjectId: string;
  title: string;
  examDate: string;
  grade: number | null;
  maxGrade: number;
  weight: number | null;
  notes: string;
}): ExamWithSubject {
  run(
    `UPDATE exams
     SET subject_id = ?, title = ?, exam_date = ?, grade = ?, max_grade = ?, weight = ?, notes = ?, updated_at = ?
     WHERE id = ? AND user_id = ?`,
    [
      input.subjectId,
      input.title,
      input.examDate,
      input.grade,
      input.maxGrade,
      input.weight,
      input.notes || null,
      nowIso(),
      input.id,
      input.userId,
    ],
  );
  const exam = findExam(input.userId, input.id);
  if (!exam) throw new Error("آزمون پیدا نشد.");
  return exam;
}

export function deleteExam(userId: string, id: string): void {
  run("DELETE FROM exams WHERE id = ? AND user_id = ?", [id, userId]);
}

export function countExamsInRange(userId: string, from: string, to: string): number {
  const row = one<{ count: number }>(
    "SELECT COUNT(*) AS count FROM exams WHERE user_id = ? AND exam_date >= ? AND exam_date <= ?",
    [userId, from, to],
  );
  return row?.count ?? 0;
}

export function latestExamDate(userId: string): string | null {
  const row = one<{ value: string | null }>(
    "SELECT MAX(exam_date) AS value FROM exams WHERE user_id = ?",
    [userId],
  );
  return row?.value ?? null;
}

export function earliestExamDate(userId: string): string | null {
  const row = one<{ value: string | null }>(
    "SELECT MIN(exam_date) AS value FROM exams WHERE user_id = ?",
    [userId],
  );
  return row?.value ?? null;
}
